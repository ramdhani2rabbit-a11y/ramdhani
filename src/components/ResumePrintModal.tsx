import { useEffect, useState } from 'react';
import { X, Printer, Copy, Check } from 'lucide-react';
import {
  STUDENT_PROFILE,
  COMPETENCIES,
  EXPERIENCES,
  CERTIFICATIONS,
  PROJECTS,
} from '../data/portfolioData';

interface ResumePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResumePrintModal({ isOpen, onClose }: ResumePrintModalProps) {
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

  if (!isOpen) return null;

  const handleCopySummary = async () => {
    const plainText = [
      `${STUDENT_PROFILE.fullName} — ${STUDENT_PROFILE.program}`,
      `${STUDENT_PROFILE.school} | ${STUDENT_PROFILE.location}`,
      `Email: ${STUDENT_PROFILE.email} | Telp: ${STUDENT_PROFILE.phone}`,
      '',
      'KOMPETENSI INTI:',
      ...COMPETENCIES.map((c) => `- ${c.title} (${c.tools})`),
      '',
      'PROYEK PILIHAN:',
      ...PROJECTS.map((p) => `- ${p.title} (${p.year}, ${p.systemSpec})`),
      '',
      'SERTIFIKASI & PRESTASI:',
      ...CERTIFICATIONS.map((s) => `- [${s.year}] ${s.name} — ${s.issuer}`),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      onClick={onClose}
    >
      <div
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
              {STUDENT_PROFILE.fullName}
            </h3>
            <p className="text-sm font-medium text-blue-700 mt-1">
              {STUDENT_PROFILE.program} · {STUDENT_PROFILE.school}
            </p>
            <p className="text-xs text-slate-600 mt-2 font-mono">
              {STUDENT_PROFILE.location} · {STUDENT_PROFILE.email} · {STUDENT_PROFILE.phone}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-950 mb-2">
              Profil Singkat
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {STUDENT_PROFILE.lead}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-950 mb-3">
              Pengalaman Praktik Lapangan & Laboratorium
            </h4>
            <div className="space-y-4">
              {EXPERIENCES.map((exp) => (
                <div key={exp.role} className="space-y-1">
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
              Sertifikasi & Prestasi Keahlian
            </h4>
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
              {CERTIFICATIONS.map((cert) => (
                <div
                  key={cert.credentialCode}
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
      </div>
    </div>
  );
}
