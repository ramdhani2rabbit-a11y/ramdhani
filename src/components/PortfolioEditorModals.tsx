import { useEffect, useState, FormEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, AlertCircle } from 'lucide-react';
import {
  DEFAULT_PROJECT_IMAGE_MAP,
  FALLBACK_NEW_PROJECT_IMAGE,
  type PortfolioProject,
  type CompetencyItem,
  type ExperienceItem,
  type CertificationItem,
  type ProfileData,
  type ProjectCategory,
} from '../data/portfolioData';
import { makeSafeDocId } from '../services/portfolioStore';

const PROJECT_CATEGORIES: Exclude<ProjectCategory, 'Semua'>[] = [
  'Panel & Distribusi',
  'Otomasi PLC',
  'Energi Terbarukan',
  'Proteksi & Uji',
];

const YEAR_REGEX = /^20[0-9]{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BaseModalShellProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

function EditorModalShell({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: BaseModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl bg-[#0D1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-[#070B14] shrink-0">
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup editor"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 text-sm text-white bg-[#070B14] border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500';
const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-400/10 border border-amber-400/40 text-xs sm:text-sm text-amber-200"
    >
      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

// 1. Project Editor Modal
interface ProjectEditorModalProps {
  isOpen: boolean;
  initialProject: PortfolioProject | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (project: PortfolioProject) => Promise<void>;
}

export function ProjectEditorModal({
  isOpen,
  initialProject,
  nextSortOrder,
  onClose,
  onSave,
}: ProjectEditorModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<Exclude<ProjectCategory, 'Semua'>>('Panel & Distribusi');
  const [year, setYear] = useState('2026');
  const [systemSpec, setSystemSpec] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [standardRef, setStandardRef] = useState('');
  const [role, setRole] = useState('');
  const [summary, setSummary] = useState('');
  const [challenge, setChallenge] = useState('');
  const [solution, setSolution] = useState('');
  const [componentsText, setComponentsText] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialProject) {
      setTitle(initialProject.title);
      setCategory(initialProject.category);
      setYear(initialProject.year);
      setSystemSpec(initialProject.systemSpec);
      setFeatured(Boolean(initialProject.featured));
      setIsPublished(initialProject.isPublished ?? true);
      setImageUrl(initialProject.imageUrl || '');
      setStandardRef(initialProject.standardRef);
      setRole(initialProject.role);
      setSummary(initialProject.summary);
      setChallenge(initialProject.challenge);
      setSolution(initialProject.solution);
      setComponentsText(initialProject.components.join('\n'));
      setSpecsText(
        initialProject.specs.map((s) => `${s.label} | ${s.value}`).join('\n')
      );
      setSortOrder(initialProject.sortOrder ?? 1);
    } else {
      setTitle('');
      setCategory('Panel & Distribusi');
      setYear(String(new Date().getFullYear()));
      setSystemSpec('380V / 50Hz · 3-Fasa');
      setFeatured(false);
      setIsPublished(true);
      setImageUrl('');
      setStandardRef('PUIL 2011 / SNI 0225');
      setRole('Perancang & Teknisi Instalasi');
      setSummary('');
      setChallenge('');
      setSolution('');
      setComponentsText('MCCB Utama 3-Pole\nKontaktor Magnetik');
      setSpecsText('Tegangan Nominal | 380 V AC\nTahanan Isolasi | > 500 MΩ');
      setSortOrder(nextSortOrder);
    }
  }, [isOpen, initialProject, nextSortOrder]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanYear = year.trim();
    const cleanSpec = systemSpec.trim();
    const cleanImageUrl = imageUrl.trim();
    const cleanRef = standardRef.trim();
    const cleanRole = role.trim();
    const cleanSummary = summary.trim();
    const cleanChallenge = challenge.trim();
    const cleanSolution = solution.trim();

    if (cleanTitle.length < 5 || cleanTitle.length > 160) {
      setError('Judul proyek harus antara 5 hingga 160 karakter.');
      return;
    }
    if (!YEAR_REGEX.test(cleanYear)) {
      setError('Tahun proyek harus 4 digit valid (contoh: 2026).');
      return;
    }
    if (cleanSpec.length < 3 || cleanSpec.length > 80) {
      setError('Parameter sistem harus antara 3 hingga 80 karakter.');
      return;
    }
    if (cleanImageUrl.length > 500) {
      setError('URL gambar maksimal 500 karakter.');
      return;
    }
    if (cleanRef.length < 3 || cleanRef.length > 120) {
      setError('Acuan standar harus antara 3 hingga 120 karakter.');
      return;
    }
    if (cleanRole.length < 3 || cleanRole.length > 120) {
      setError('Peran proyek harus antara 3 hingga 120 karakter.');
      return;
    }
    if (cleanSummary.length < 10 || cleanSummary.length > 600) {
      setError('Ringkasan proyek harus antara 10 hingga 600 karakter.');
      return;
    }
    if (cleanChallenge.length < 10 || cleanChallenge.length > 800) {
      setError('Tantangan teknis harus antara 10 hingga 800 karakter.');
      return;
    }
    if (cleanSolution.length < 10 || cleanSolution.length > 800) {
      setError('Solusi & implementasi harus antara 10 hingga 800 karakter.');
      return;
    }

    const components = componentsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);

    const specs = specsText
      .split('\n')
      .map((line) => {
        const idx = line.indexOf('|');
        if (idx === -1) return null;
        const label = line.slice(0, idx).trim().slice(0, 80);
        const value = line.slice(idx + 1).trim().slice(0, 80);
        if (!label || !value) return null;
        return { label, value };
      })
      .filter((s): s is { label: string; value: string } => s !== null)
      .slice(0, 10);

    const docId = initialProject?.id || makeSafeDocId('proj');
    const resolvedImage =
      cleanImageUrl ||
      DEFAULT_PROJECT_IMAGE_MAP[docId] ||
      initialProject?.image ||
      FALLBACK_NEW_PROJECT_IMAGE;

    const payload: PortfolioProject = {
      id: docId,
      title: cleanTitle,
      category,
      year: cleanYear,
      systemSpec: cleanSpec,
      featured,
      image: resolvedImage,
      imageUrl: cleanImageUrl,
      imageAlt: cleanTitle,
      summary: cleanSummary,
      challenge: cleanChallenge,
      solution: cleanSolution,
      standardRef: cleanRef,
      role: cleanRole,
      components,
      specs,
      sortOrder: Math.max(0, Math.min(1000, Number(sortOrder) || 1)),
      isPublished,
    };

    setError('');
    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan proyek ke Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorModalShell
      isOpen={isOpen}
      title={initialProject ? 'Edit Proyek Teknik' : 'Tambah Proyek Teknik Baru'}
      subtitle="Perubahan akan tersimpan langsung ke Cloud Firestore."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div>
          <label htmlFor="proj-title" className={labelClass}>
            Judul Proyek (min. 5 karakter)
          </label>
          <input
            id="proj-title"
            type="text"
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Perakitan Panel ATS-AMF 3-Fasa 100A"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="proj-cat" className={labelClass}>
              Kategori
            </label>
            <select
              id="proj-cat"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Exclude<ProjectCategory, 'Semua'>)
              }
              className={inputClass}
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="proj-year" className={labelClass}>
              Tahun (4 digit)
            </label>
            <input
              id="proj-year"
              type="text"
              maxLength={4}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2026"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="proj-order" className={labelClass}>
              Urutan Tampil
            </label>
            <input
              id="proj-order"
              type="number"
              min={0}
              max={1000}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-spec" className={labelClass}>
              Parameter Sistem
            </label>
            <input
              id="proj-spec"
              type="text"
              maxLength={80}
              value={systemSpec}
              onChange={(e) => setSystemSpec(e.target.value)}
              placeholder="380V / 50Hz · 3-Fasa + N + PE"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="proj-ref" className={labelClass}>
              Acuan Standar
            </label>
            <input
              id="proj-ref"
              type="text"
              maxLength={120}
              value={standardRef}
              onChange={(e) => setStandardRef(e.target.value)}
              placeholder="PUIL 2011 / SNI 0225"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-role" className={labelClass}>
              Peran dalam Proyek
            </label>
            <input
              id="proj-role"
              type="text"
              maxLength={120}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Perancang SLD & Perakit Panel"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="proj-img" className={labelClass}>
              URL Foto Proyek (opsional, kosongkan untuk foto default)
            </label>
            <input
              id="proj-img"
              type="url"
              maxLength={500}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="proj-summary" className={labelClass}>
            Ringkasan Proyek (10–600 karakter)
          </label>
          <textarea
            id="proj-summary"
            rows={2}
            maxLength={600}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Gambaran singkat ruang lingkup dan hasil proyek..."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-challenge" className={labelClass}>
              Tantangan Teknis (10–800 karakter)
            </label>
            <textarea
              id="proj-challenge"
              rows={3}
              maxLength={800}
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="Masalah teknis atau batasan keselamatan yang harus diatasi..."
              className={`${inputClass} resize-y`}
            />
          </div>
          <div>
            <label htmlFor="proj-solution" className={labelClass}>
              Solusi &amp; Implementasi (10–800 karakter)
            </label>
            <textarea
              id="proj-solution"
              rows={3}
              maxLength={800}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Langkah perancangan, pengawatan, dan komisioning..."
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proj-components" className={labelClass}>
              Komponen Utama (1 baris per komponen, maks. 12)
            </label>
            <textarea
              id="proj-components"
              rows={4}
              value={componentsText}
              onChange={(e) => setComponentsText(e.target.value)}
              placeholder={'MCCB 3-Pole 63A\nSPD Tipe 2 40 kA'}
              className={`${inputClass} font-mono text-xs resize-y`}
            />
          </div>
          <div>
            <label htmlFor="proj-specs" className={labelClass}>
              Data Spesifikasi Uji (format: Label | Nilai, 1 per baris)
            </label>
            <textarea
              id="proj-specs"
              rows={4}
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
              placeholder={'Tegangan Nominal | 400 V L-L\nTahanan Isolasi | > 550 MΩ'}
              className={`${inputClass} font-mono text-xs resize-y`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span>Tampilkan sebagai proyek unggulan (kartu lebar)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span>Publikasikan ke pengunjung</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Proyek'}</span>
          </button>
        </div>
      </form>
    </EditorModalShell>
  );
}

// 2. Competency Editor Modal
interface CompetencyEditorModalProps {
  isOpen: boolean;
  initialItem: CompetencyItem | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (item: CompetencyItem) => Promise<void>;
}

export function CompetencyEditorModal({
  isOpen,
  initialItem,
  nextSortOrder,
  onClose,
  onSave,
}: CompetencyEditorModalProps) {
  const [number, setNumber] = useState('01.');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tools, setTools] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialItem) {
      setNumber(initialItem.number);
      setTitle(initialItem.title);
      setDescription(initialItem.description);
      setTools(initialItem.tools);
      setSortOrder(initialItem.sortOrder ?? 1);
      setIsPublished(initialItem.isPublished ?? true);
    } else {
      setNumber(String(nextSortOrder).padStart(2, '0') + '.');
      setTitle('');
      setDescription('');
      setTools('');
      setSortOrder(nextSortOrder);
      setIsPublished(true);
    }
  }, [isOpen, initialItem, nextSortOrder]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanNum = number.trim();
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanTools = tools.trim();

    if (cleanNum.length < 1 || cleanNum.length > 12) {
      setError('Nomor urut harus 1–12 karakter (mis. 01.).');
      return;
    }
    if (cleanTitle.length < 3 || cleanTitle.length > 140) {
      setError('Judul kompetensi harus antara 3 hingga 140 karakter.');
      return;
    }
    if (cleanDesc.length < 10 || cleanDesc.length > 600) {
      setError('Deskripsi kompetensi harus antara 10 hingga 600 karakter.');
      return;
    }
    if (cleanTools.length < 2 || cleanTools.length > 200) {
      setError('Perangkat kerja / tools harus antara 2 hingga 200 karakter.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        id: initialItem?.id || makeSafeDocId('comp'),
        number: cleanNum,
        title: cleanTitle,
        description: cleanDesc,
        tools: cleanTools,
        sortOrder: Math.max(0, Math.min(1000, Number(sortOrder) || 1)),
        isPublished,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan kompetensi ke Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorModalShell
      isOpen={isOpen}
      title={initialItem ? 'Edit Kompetensi Teknis' : 'Tambah Kompetensi Baru'}
      subtitle="Atur keahlian inti dan alat ukur yang dikuasai."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="comp-num" className={labelClass}>
              Nomor Label
            </label>
            <input
              id="comp-num"
              type="text"
              maxLength={12}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="05."
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="comp-title" className={labelClass}>
              Nama Kompetensi
            </label>
            <input
              id="comp-title"
              type="text"
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sistem SCADA & HMI Industri"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="comp-desc" className={labelClass}>
            Penjelasan Kemampuan (10–600 karakter)
          </label>
          <textarea
            id="comp-desc"
            rows={4}
            maxLength={600}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Uraikan standar kerja, penguasaan praktik, dan hasil pengukuran..."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="comp-tools" className={labelClass}>
              Alat Ukur &amp; Perangkat Lunak
            </label>
            <input
              id="comp-tools"
              type="text"
              maxLength={200}
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="AutoCAD Electrical · Megger 1000V · Tang Ampere"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="comp-order" className={labelClass}>
              Urutan Tampil
            </label>
            <input
              id="comp-order"
              type="number"
              min={0}
              max={1000}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 accent-amber-400 rounded"
          />
          <span>Publikasikan ke pengunjung</span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Kompetensi'}</span>
          </button>
        </div>
      </form>
    </EditorModalShell>
  );
}

// 3. Experience Editor Modal
interface ExperienceEditorModalProps {
  isOpen: boolean;
  initialItem: ExperienceItem | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (item: ExperienceItem) => Promise<void>;
}

export function ExperienceEditorModal({
  isOpen,
  initialItem,
  nextSortOrder,
  onClose,
  onSave,
}: ExperienceEditorModalProps) {
  const [role, setRole] = useState('');
  const [period, setPeriod] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialItem) {
      setRole(initialItem.role);
      setPeriod(initialItem.period);
      setOrganization(initialItem.organization);
      setLocation(initialItem.location);
      setHighlightsText(initialItem.highlights.join('\n'));
      setSortOrder(initialItem.sortOrder ?? 1);
      setIsPublished(initialItem.isPublished ?? true);
    } else {
      setRole('');
      setPeriod('');
      setOrganization('');
      setLocation('Bandung, Jawa Barat');
      setHighlightsText('');
      setSortOrder(nextSortOrder);
      setIsPublished(true);
    }
  }, [isOpen, initialItem, nextSortOrder]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanRole = role.trim();
    const cleanPeriod = period.trim();
    const cleanOrg = organization.trim();
    const cleanLoc = location.trim();
    const highlights = highlightsText
      .split('\n')
      .map((h) => h.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (cleanRole.length < 3 || cleanRole.length > 140) {
      setError('Posisi / peran harus antara 3 hingga 140 karakter.');
      return;
    }
    if (cleanPeriod.length < 3 || cleanPeriod.length > 80) {
      setError('Periode waktu harus antara 3 hingga 80 karakter.');
      return;
    }
    if (cleanOrg.length < 2 || cleanOrg.length > 160) {
      setError('Nama perusahaan / institusi harus antara 2 hingga 160 karakter.');
      return;
    }
    if (cleanLoc.length < 2 || cleanLoc.length > 100) {
      setError('Lokasi harus antara 2 hingga 100 karakter.');
      return;
    }
    if (highlights.length === 0) {
      setError('Mohon isi minimal 1 poin tugas atau pencapaian lapangan.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        id: initialItem?.id || makeSafeDocId('exp'),
        period: cleanPeriod,
        role: cleanRole,
        organization: cleanOrg,
        location: cleanLoc,
        highlights,
        sortOrder: Math.max(0, Math.min(1000, Number(sortOrder) || 1)),
        isPublished,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pengalaman ke Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorModalShell
      isOpen={isOpen}
      title={initialItem ? 'Edit Pengalaman Praktik' : 'Tambah Pengalaman Baru'}
      subtitle="Tambahkan riwayat PKL, magang industri, atau asistensi bengkel."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="exp-role" className={labelClass}>
              Posisi / Peran
            </label>
            <input
              id="exp-role"
              type="text"
              maxLength={140}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Teknisi PKL Pemeliharaan Panel Distribusi"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exp-period" className={labelClass}>
              Periode
            </label>
            <input
              id="exp-period"
              type="text"
              maxLength={80}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Juli – Desember 2025"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="exp-org" className={labelClass}>
              Perusahaan / Bengkel / Institusi
            </label>
            <input
              id="exp-org"
              type="text"
              maxLength={160}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="PT PLN (Persero) UP3 Bandung"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exp-loc" className={labelClass}>
              Lokasi
            </label>
            <input
              id="exp-loc"
              type="text"
              maxLength={100}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bandung, Jawa Barat"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="exp-highlights" className={labelClass}>
            Poin Tugas &amp; Pencapaian (1 baris per poin, maks. 8 poin)
          </label>
          <textarea
            id="exp-highlights"
            rows={5}
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
            placeholder={
              'Melaksanakan pengukuran beban puncak gardu distribusi 20 kV.\nMelakukan audit tahanan pembumian PHB-TR.'
            }
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="exp-order" className={labelClass}>
              Urutan Tampil
            </label>
            <input
              id="exp-order"
              type="number"
              min={0}
              max={1000}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span>Publikasikan ke pengunjung</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengalaman'}</span>
          </button>
        </div>
      </form>
    </EditorModalShell>
  );
}

// 4. Certification Editor Modal
interface CertificationEditorModalProps {
  isOpen: boolean;
  initialItem: CertificationItem | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (item: CertificationItem) => Promise<void>;
}

export function CertificationEditorModal({
  isOpen,
  initialItem,
  nextSortOrder,
  onClose,
  onSave,
}: CertificationEditorModalProps) {
  const [year, setYear] = useState('2026');
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [credentialCode, setCredentialCode] = useState('');
  const [scope, setScope] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialItem) {
      setYear(initialItem.year);
      setName(initialItem.name);
      setIssuer(initialItem.issuer);
      setCredentialCode(initialItem.credentialCode);
      setScope(initialItem.scope);
      setSortOrder(initialItem.sortOrder ?? 1);
      setIsPublished(initialItem.isPublished ?? true);
    } else {
      setYear(String(new Date().getFullYear()));
      setName('');
      setIssuer('');
      setCredentialCode('');
      setScope('');
      setSortOrder(nextSortOrder);
      setIsPublished(true);
    }
  }, [isOpen, initialItem, nextSortOrder]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanYear = year.trim();
    const cleanName = name.trim();
    const cleanIssuer = issuer.trim();
    const cleanCode = credentialCode.trim();
    const cleanScope = scope.trim();

    if (!YEAR_REGEX.test(cleanYear)) {
      setError('Tahun sertifikasi harus 4 digit valid (contoh: 2026).');
      return;
    }
    if (cleanName.length < 3 || cleanName.length > 180) {
      setError('Nama sertifikasi / prestasi harus antara 3 hingga 180 karakter.');
      return;
    }
    if (cleanIssuer.length < 2 || cleanIssuer.length > 160) {
      setError('Nama lembaga penerbit harus antara 2 hingga 160 karakter.');
      return;
    }
    if (cleanCode.length < 2 || cleanCode.length > 60) {
      setError('Nomor registrasi sertifikat harus antara 2 hingga 60 karakter.');
      return;
    }
    if (cleanScope.length < 3 || cleanScope.length > 240) {
      setError('Ruang lingkup kompetensi harus antara 3 hingga 240 karakter.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        id: initialItem?.id || makeSafeDocId('cert'),
        year: cleanYear,
        name: cleanName,
        issuer: cleanIssuer,
        credentialCode: cleanCode,
        scope: cleanScope,
        sortOrder: Math.max(0, Math.min(1000, Number(sortOrder) || 1)),
        isPublished,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan sertifikasi ke Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorModalShell
      isOpen={isOpen}
      title={initialItem ? 'Edit Sertifikasi' : 'Tambah Sertifikasi Baru'}
      subtitle="Kelola sertifikat kompetensi BNSP, K3 listrik, dan prestasi LKS."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cert-year" className={labelClass}>
              Tahun (4 digit)
            </label>
            <input
              id="cert-year"
              type="text"
              maxLength={4}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2026"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cert-code" className={labelClass}>
              Nomor Registrasi / Kode Kredensial
            </label>
            <input
              id="cert-code"
              type="text"
              maxLength={60}
              value={credentialCode}
              onChange={(e) => setCredentialCode(e.target.value)}
              placeholder="REG. TITL-2026-0418"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cert-name" className={labelClass}>
            Nama Sertifikasi / Prestasi
          </label>
          <input
            id="cert-name"
            type="text"
            maxLength={180}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sertifikat Kompetensi Klaster Pemasangan Instalasi Tenaga"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cert-issuer" className={labelClass}>
            Lembaga Penerbit
          </label>
          <input
            id="cert-issuer"
            type="text"
            maxLength={160}
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="BNSP — LSP P1 Teknik Ketenagalistrikan"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="cert-scope" className={labelClass}>
            Ruang Lingkup Uji / Kompetensi
          </label>
          <input
            id="cert-scope"
            type="text"
            maxLength={240}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Pengawatan PHB 3-Fasa, Kendali Motor & Pengujian Isolasi"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="cert-order" className={labelClass}>
              Urutan Tampil
            </label>
            <input
              id="cert-order"
              type="number"
              min={0}
              max={1000}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span>Publikasikan ke pengunjung</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Sertifikasi'}</span>
          </button>
        </div>
      </form>
    </EditorModalShell>
  );
}

// 5. Profile & Testimonial Editor Modal
interface ProfileEditorModalProps {
  isOpen: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSave: (nextProfile: ProfileData) => Promise<void>;
}

export function ProfileEditorModal({
  isOpen,
  profile,
  onClose,
  onSave,
}: ProfileEditorModalProps) {
  const [form, setForm] = useState<ProfileData>(profile);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(profile);
  }, [isOpen, profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.fullName.trim().length < 2 || form.shortBrand.trim().length < 2) {
      setError('Nama lengkap dan merek singkat minimal 2 karakter.');
      return;
    }
    if (form.program.trim().length < 2 || form.school.trim().length < 2) {
      setError('Jurusan dan asal sekolah wajib diisi.');
      return;
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError('Format email kontak belum valid.');
      return;
    }
    if (form.phone.trim().length < 5) {
      setError('Nomor telepon minimal 5 karakter.');
      return;
    }
    if (form.headline.trim().length < 5 || form.lead.trim().length < 10) {
      setError('Headline (min. 5) dan ringkasan diri (min. 10) wajib diisi.');
      return;
    }
    if (form.availability.trim().length < 5) {
      setError('Status kesiapan kerja minimal 5 karakter.');
      return;
    }
    if (
      form.testimonialQuote.trim().length < 10 ||
      form.testimonialAuthor.trim().length < 2 ||
      form.testimonialRole.trim().length < 2 ||
      form.testimonialOrg.trim().length < 2
    ) {
      setError('Kutipan dan identitas pembimbing testimoni wajib diisi lengkap.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan profil ke Firestore.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorModalShell
      isOpen={isOpen}
      title="Edit Profil Siswa & Testimoni Pembimbing"
      subtitle="Perbarui identitas diri, tajuk utama, kontak, dan evaluasi lapangan."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-fullname" className={labelClass}>
              Nama Lengkap
            </label>
            <input
              id="prof-fullname"
              type="text"
              maxLength={100}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="prof-brand" className={labelClass}>
              Nama Header Singkat
            </label>
            <input
              id="prof-brand"
              type="text"
              maxLength={50}
              value={form.shortBrand}
              onChange={(e) => setForm({ ...form, shortBrand: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-program" className={labelClass}>
              Program Keahlian
            </label>
            <input
              id="prof-program"
              type="text"
              maxLength={120}
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="prof-school" className={labelClass}>
              Sekolah &amp; Angkatan
            </label>
            <input
              id="prof-school"
              type="text"
              maxLength={120}
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="prof-loc" className={labelClass}>
              Lokasi
            </label>
            <input
              id="prof-loc"
              type="text"
              maxLength={100}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="prof-email" className={labelClass}>
              Email Kontak
            </label>
            <input
              id="prof-email"
              type="email"
              maxLength={150}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className={labelClass}>
              Nomor Telepon / WA
            </label>
            <input
              id="prof-phone"
              type="text"
              maxLength={40}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="prof-headline" className={labelClass}>
            Tajuk Utama (Headline Hero)
          </label>
          <input
            id="prof-headline"
            type="text"
            maxLength={160}
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="prof-lead" className={labelClass}>
            Ringkasan Diri (Lead Hero &amp; CV)
          </label>
          <textarea
            id="prof-lead"
            rows={3}
            maxLength={500}
            value={form.lead}
            onChange={(e) => setForm({ ...form, lead: e.target.value })}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="prof-avail" className={labelClass}>
            Status Kesiapan Kerja
          </label>
          <input
            id="prof-avail"
            type="text"
            maxLength={180}
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-4">
          <p className="text-xs font-semibold text-amber-400">
            Testimoni Pembimbing Lapangan
          </p>
          <div>
            <label htmlFor="prof-quote" className={labelClass}>
              Kutipan Testimoni
            </label>
            <textarea
              id="prof-quote"
              rows={3}
              maxLength={600}
              value={form.testimonialQuote}
              onChange={(e) =>
                setForm({ ...form, testimonialQuote: e.target.value })
              }
              className={`${inputClass} resize-y`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prof-t-author" className={labelClass}>
                Nama Pembimbing
              </label>
              <input
                id="prof-t-author"
                type="text"
                maxLength={100}
                value={form.testimonialAuthor}
                onChange={(e) =>
                  setForm({ ...form, testimonialAuthor: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-t-role" className={labelClass}>
                Jabatan Pembimbing
              </label>
              <input
                id="prof-t-role"
                type="text"
                maxLength={120}
                value={form.testimonialRole}
                onChange={(e) =>
                  setForm({ ...form, testimonialRole: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-t-org" className={labelClass}>
                Instansi Pembimbing
              </label>
              <input
                id="prof-t-org"
                type="text"
                maxLength={140}
                value={form.testimonialOrg}
                onChange={(e) =>
                  setForm({ ...form, testimonialOrg: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
          </button>
        </div>
      </form>
    </EditorModalShell>
  );
}
