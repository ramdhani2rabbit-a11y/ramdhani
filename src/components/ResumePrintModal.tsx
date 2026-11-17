import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Copy, Check } from 'lucide-react';
import {
  STUDENT_PROFILE,
  COMPETENCIES,
  EXPERIENCES,
  CERTIFICATIONS,
  PROJECTS,
  type ProfileData,
  type CompetencyItem,
  type ExperienceItem,
  type CertificationItem,
  type PortfolioProject,
} from '../data/portfolioData';

interface ResumePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfileData;
  competencies?: CompetencyItem[];
  experiences?: ExperienceItem[];
  certifications?: CertificationItem[];
  projects?: PortfolioProject[];
}

export function ResumePrintModal({
  isOpen,
  onClose,
  profile = STUDENT_PROFILE,
  competencies = COMPETENCIES,
  experiences = EXPERIENCES,
  certifications = CERTIFICATIONS,
  projects = PROJECTS,
}: ResumePrintModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  const handleCopySummary = async () => {
    const plainText = [
      `${profile.fullName} — ${profile.program}`,
      `${profile.school} | ${profile.location}`,
      `Email: ${profile.email} | Telp: ${profile.phone}`,
      '',
      'KOMPETENSI INTI:',
      ...competencies.map((c) => `- ${c.title} (${c.tools})`),
      '',
      'PROYEK PILIHAN:',
      ...projects.map((p) => `- ${p.title} (${p.year}, ${p.systemSpec})`),
      '',
      'SERTIFIKASI & PRESTASI:',
      ...certifications.map((s) => `- [${s.year}] ${s.name} — ${s.issuer}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="no-print flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <h2 id="resume-modal-title" className="text-base font-semibold text-slate-950">
                Ringkasan CV Teknis Siswa
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Salin Teks CV</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup ringkasan CV"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Preview Body */}
            <div className="overflow-y-auto p-6 sm:p-10 space-y-7 text-slate-900 bg-white">
              <div className="border-b border-slate-200 pb-5">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                  {profile.fullName}
                </h3>
                <p className="text-sm font-medium text-blue-700 mt-1">
                  {profile.program} · {profile.school}
                </p>
                <p className="text-xs text-slate-600 mt-2 font-mono">
                  {profile.location} · {profile.email} · {profile.phone}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950 mb-2">
                  Profil Singkat
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {profile.lead}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950 mb-3">
                  Pengalaman Praktik Lapangan &amp; Laboratorium
                </h4>
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id || exp.role} className="space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{exp.role}</p>
                        <span className="text-xs font-mono text-slate-500 tabular-nums">
                          {exp.period}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {exp.organization} · {exp.location}
                      </p>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 pt-1">
                        {exp.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-950 mb-2.5">
                  Sertifikasi &amp; Prestasi Keahlian
                </h4>
                <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                  {certifications.map((cert) => (
                    <div
                      key={cert.id || cert.credentialCode}
                      className="py-2.5 flex flex-wrap items-baseline justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{cert.name}</span>
                        <span className="text-slate-500"> — {cert.issuer}</span>
                      </div>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {cert.year} · {cert.credentialCode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
