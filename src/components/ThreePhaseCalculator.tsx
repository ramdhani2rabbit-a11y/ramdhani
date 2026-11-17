import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { Trash2, BookmarkCheck } from 'lucide-react';
import {
  db,
  BLUEPRINT_LIMITS,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';

type PhaseSystem = '3-phase' | '1-phase';

interface SavedCalcRecord {
  id: string;
  label: string;
  phase: PhaseSystem;
  powerKw: number;
  powerFactor: number;
  nominalCurrent: number;
  recommendedMcb: number;
  cableRecommendation: string;
}

const STANDARD_MCB_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];

function recommendCableSize(mcbRating: number): string {
  if (mcbRating <= 10) return '1,5 mm² (NYA / NYM)';
  if (mcbRating <= 16) return '2,5 mm² (NYA / NYM)';
  if (mcbRating <= 25) return '4 mm² (NYY / NYM)';
  if (mcbRating <= 32) return '6 mm² (NYY)';
  if (mcbRating <= 50) return '10 mm² (NYY)';
  if (mcbRating <= 63) return '16 mm² (NYY)';
  return '25 mm² (NYY)';
}

export function ThreePhaseCalculator() {
  const { user, authReady, authLoading, signInWithGoogle } = useFirebase();

  const [phase, setPhase] = useState<PhaseSystem>('3-phase');
  const [powerKw, setPowerKw] = useState<string>('11');
  const [powerFactor, setPowerFactor] = useState<string>('0.85');
  const [calcLabel, setCalcLabel] = useState<string>('Panel Pompa Bengkel');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [savedRecords, setSavedRecords] = useState<SavedCalcRecord[]>([]);

  const calculation = useMemo(() => {
    const pKw = Math.max(
      BLUEPRINT_LIMITS.calculation.powerMin,
      Math.min(BLUEPRINT_LIMITS.calculation.powerMax, Number(powerKw) || 0.1)
    );
    const pf = Math.max(
      BLUEPRINT_LIMITS.calculation.pfMin,
      Math.min(BLUEPRINT_LIMITS.calculation.pfMax, Number(powerFactor) || 0.85)
    );
    const voltage = phase === '3-phase' ? 380 : 220;

    const nominalCurrent =
      phase === '3-phase'
        ? (pKw * 1000) / (Math.sqrt(3) * voltage * pf)
        : (pKw * 1000) / (voltage * pf);

    const apparentPowerKva = pKw / pf;
    const safetyCurrent = nominalCurrent * 1.25;
    const recommendedMcb =
      STANDARD_MCB_RATINGS.find((rating) => rating >= safetyCurrent) ?? 100;

    return {
      pKw,
      pf,
      voltage,
      nominalCurrent: Number(nominalCurrent.toFixed(1)),
      apparentPowerKva,
      recommendedMcb,
      cableRecommendation: recommendCableSize(recommendedMcb),
    };
  }, [phase, powerKw, powerFactor]);

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setSavedRecords([]);
      return;
    }

    const q = query(
      collection(db, 'calculations'),
      where('ownerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows: SavedCalcRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            label: String(data.label ?? ''),
            phase: data.phase === '1-phase' ? '1-phase' : '3-phase',
            powerKw: Number(data.powerKw ?? 0),
            powerFactor: Number(data.powerFactor ?? 0.85),
            nominalCurrent: Number(data.nominalCurrent ?? 0),
            recommendedMcb: Number(data.recommendedMcb ?? 10),
            cableRecommendation: String(data.cableRecommendation ?? ''),
          };
        });
        setSavedRecords(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'calculations');
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  const handleSaveCalculation = async () => {
    setSaveFeedback('');

    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) return;
    }

    if (!activeUser.emailVerified) {
      setSaveState('error');
      setSaveFeedback('Akun Google harus memiliki email terverifikasi untuk menyimpan catatan.');
      return;
    }

    const trimmedLabel = calcLabel
      .trim()
      .slice(0, BLUEPRINT_LIMITS.calculation.labelMax);

    if (trimmedLabel.length < BLUEPRINT_LIMITS.calculation.labelMin) {
      setSaveState('error');
      setSaveFeedback('Masukkan nama beban atau panel minimal 2 karakter.');
      return;
    }

    setSaveState('saving');
    const calcId = `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const path = `calculations/${calcId}`;

    try {
      await setDoc(doc(db, 'calculations', calcId), {
        ownerUid: activeUser.uid,
        label: trimmedLabel,
        phase,
        powerKw: calculation.pKw,
        powerFactor: calculation.pf,
        nominalCurrent: calculation.nominalCurrent,
        recommendedMcb: calculation.recommendedMcb,
        cableRecommendation: calculation.cableRecommendation.slice(
          0,
          BLUEPRINT_LIMITS.calculation.cableMax
        ),
        createdAt: serverTimestamp(),
      });
      setSaveState('saved');
      setSaveFeedback('Perhitungan berhasil disimpan ke Firestore.');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (error) {
      setSaveState('error');
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    const path = `calculations/${recordId}`;
    try {
      await deleteDoc(doc(db, 'calculations', recordId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-950">
            Kalkulator Verifikasi Arus & Proteksi PUIL
          </h3>
          <p className="text-sm text-slate-600">
            Alat bantu cepat menghitung arus nominal beban, daya semu, serta estimasi rating MCB dan penampang kabel tembaga.
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200"
          role="group"
          aria-label="Pilih sistem fasa"
        >
          <button
            type="button"
            onClick={() => setPhase('3-phase')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              phase === '3-phase'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            3-Fasa (380 V)
          </button>
          <button
            type="button"
            onClick={() => setPhase('1-phase')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              phase === '1-phase'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            1-Fasa (220 V)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="calc-power-kw"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Daya Aktif Beban (kW)
            </label>
            <input
              id="calc-power-kw"
              type="number"
              min="0.2"
              max="500"
              step="0.5"
              value={powerKw}
              onChange={(e) => setPowerKw(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="calc-pf"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Faktor Daya (cos φ)
            </label>
            <input
              id="calc-pf"
              type="number"
              min="0.50"
              max="1.00"
              step="0.01"
              value={powerFactor}
              onChange={(e) => setPowerFactor(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 mb-1">Arus Nominal (In)</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-slate-950">
                {calculation.nominalCurrent.toFixed(1)} A
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Daya Semu (S)</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-slate-950">
                {calculation.apparentPowerKva.toFixed(1)} kVA
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Rekomendasi MCB</p>
              <p className="text-xl font-semibold font-mono tabular-nums text-blue-700">
                {calculation.recommendedMcb} A
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Kabel Minimum</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-950 pt-1">
                {calculation.cableRecommendation}
              </p>
            </div>
          </div>

          {/* Save Calculation to Firestore */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <input
              type="text"
              aria-label="Label beban atau panel"
              maxLength={BLUEPRINT_LIMITS.calculation.labelMax}
              value={calcLabel}
              onChange={(e) => setCalcLabel(e.target.value)}
              placeholder="Nama beban (mis. Motor Kompresor)"
              className="flex-1 px-3.5 py-2 text-sm text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
            <button
              type="button"
              disabled={saveState === 'saving' || authLoading}
              onClick={handleSaveCalculation}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {user
                  ? saveState === 'saving'
                    ? 'Menyimpan...'
                    : 'Simpan Riwayat'
                  : 'Masuk Google & Simpan'}
              </span>
            </button>
          </div>

          {saveFeedback && (
            <p
              className={`text-xs ${
                saveState === 'error' ? 'text-amber-700' : 'text-blue-700'
              }`}
            >
              {saveFeedback}
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Rumus: {phase === '3-phase' ? 'I = P / (√3 × 380 V × cos φ)' : 'I = P / (220 V × cos φ)'} dengan faktor pengaman proteksi 125% sesuai pedoman instalasi dasar.
      </p>

      {/* Real-time Saved Calculations History for Authenticated User */}
      {user && savedRecords.length > 0 && (
        <div className="pt-5 border-t border-slate-200 space-y-3">
          <p className="text-xs font-semibold text-slate-800">
            Riwayat Perhitungan Tersimpan ({savedRecords.length})
          </p>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {savedRecords.map((rec) => (
              <div
                key={rec.id}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-900">{rec.label}</p>
                  <p className="font-mono text-slate-500 tabular-nums">
                    {rec.phase === '3-phase' ? '3-Fasa' : '1-Fasa'} · {rec.powerKw} kW · cos φ {rec.powerFactor}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-slate-800 tabular-nums">
                    In {rec.nominalCurrent.toFixed(1)} A · MCB {rec.recommendedMcb} A · {rec.cableRecommendation}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(rec.id)}
                    aria-label={`Hapus catatan ${rec.label}`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200/70 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
