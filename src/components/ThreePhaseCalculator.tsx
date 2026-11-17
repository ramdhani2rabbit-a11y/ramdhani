import { useState, useMemo } from 'react';

type PhaseSystem = '3-phase' | '1-phase';

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
  const [phase, setPhase] = useState<PhaseSystem>('3-phase');
  const [powerKw, setPowerKw] = useState<string>('11');
  const [powerFactor, setPowerFactor] = useState<string>('0.85');

  const calculation = useMemo(() => {
    const pKw = Math.max(0.1, Math.min(200, Number(powerKw) || 0));
    const pf = Math.max(0.5, Math.min(1, Number(powerFactor) || 0.85));
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
      voltage,
      nominalCurrent,
      apparentPowerKva,
      recommendedMcb,
      cableRecommendation: recommendCableSize(recommendedMcb),
    };
  }, [phase, powerKw, powerFactor]);

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
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
              max="100"
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

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
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
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Rumus: {phase === '3-phase' ? 'I = P / (√3 × 380 V × cos φ)' : 'I = P / (220 V × cos φ)'} dengan faktor pengaman proteksi 125% sesuai pedoman instalasi dasar.
      </p>
    </div>
  );
}
