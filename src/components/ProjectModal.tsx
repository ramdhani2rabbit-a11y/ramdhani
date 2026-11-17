import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, Check } from 'lucide-react';
import type { PortfolioProject } from '../data/portfolioData';
import { ResilientImage } from './ResilientImage';

interface ProjectModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onRequestDiscussion: (projectTitle: string) => void;
}

export function ProjectModal({
  project,
  onClose,
  onRequestDiscussion,
}: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-[#0D1322] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Bar */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-[#070B14] shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="font-semibold text-amber-400">{project.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{project.year}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-300">{project.systemSpec}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup detail proyek"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <h2
                  id="project-modal-title"
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance"
                >
                  {project.title}
                </h2>
                <p className="text-sm text-slate-400">
                  Peran: <span className="font-medium text-slate-200">{project.role}</span>
                  <span className="mx-2 text-slate-700" aria-hidden="true">|</span>
                  Acuan Standar: <span className="font-medium text-slate-200">{project.standardRef}</span>
                </p>
              </div>

              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                <ResilientImage
                  src={project.image}
                  alt={project.imageAlt}
                  fallbackTitle={project.title}
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>

              {/* Engineering Narrative & Dark Spec Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      Tantangan Teknis
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed tracking-[0.01em]">
                      {project.challenge}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      Solusi & Implementasi
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed tracking-[0.01em]">
                      {project.solution}
                    </p>
                  </div>
                </div>

                {/* High-Contrast Telemetry Readout */}
                <div className="rounded-xl bg-[#070B14] text-slate-100 p-6 border border-slate-800">
                  <h3 className="text-sm font-semibold text-amber-400 mb-4">
                    Data Spesifikasi & Hasil Uji Komisioning
                  </h3>
                  <dl className="divide-y divide-slate-800/90">
                    {project.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="py-2.5 flex items-baseline justify-between gap-4 text-sm"
                      >
                        <dt className="text-slate-400">{spec.label}</dt>
                        <dd className="font-mono font-medium text-white tabular-nums text-right">
                          {spec.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Components List */}
              <div className="pt-5 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Komponen & Peralatan Utama
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {project.components.map((component) => (
                    <li
                      key={component}
                      className="flex items-start gap-2.5 text-sm text-slate-300"
                    >
                      <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{component}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 bg-[#070B14] shrink-0">
              <p className="text-xs text-slate-400">
                Dokumentasi lengkap diagram garis tunggal tersedia saat sesi wawancara.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDiscussion(project.title)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  <span>Diskusikan Proyek Ini</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
