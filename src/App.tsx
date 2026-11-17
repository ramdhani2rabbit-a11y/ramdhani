import { useState, useRef, FormEvent } from 'react';
import {
  ArrowUpRight,
  Menu,
  X,
  Copy,
  Check,
  FileText,
  Mail,
  MapPin,
} from 'lucide-react';
import {
  STUDENT_PROFILE,
  HERO_METRICS,
  PROJECTS,
  COMPETENCIES,
  EXPERIENCES,
  TESTIMONIAL,
  CERTIFICATIONS,
  type ProjectCategory,
  type PortfolioProject,
} from './data/portfolioData';
import { ResilientImage } from './components/ResilientImage';
import { ProjectModal } from './components/ProjectModal';
import { ResumePrintModal } from './components/ResumePrintModal';
import { ThreePhaseCalculator } from './components/ThreePhaseCalculator';

const FILTER_CATEGORIES: ProjectCategory[] = [
  'Semua',
  'Panel & Distribusi',
  'Otomasi PLC',
  'Energi Terbarukan',
  'Proteksi & Uji',
];

const MARQUEE_ITEMS = [
  'instalasi tenaga tiga fasa',
  'panel hubung bagi utama',
  'otomasi plc & kendali motor',
  'pembumian & tahanan isolasi',
  'pembangkit surya atap',
  'standar puil 2011 & k3 listrik',
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('Semua');
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact form state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'error' | 'submitted'>('idle');
  const [formError, setFormError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  const contactSectionRef = useRef<HTMLElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredProjects =
    selectedCategory === 'Semua'
      ? PROJECTS
      : PROJECTS.filter((project) => project.category === selectedCategory);

  const handleRequestDiscussion = (projectTitle: string) => {
    setActiveProject(null);
    setSubject(`Diskusi Proyek: ${projectTitle}`);
    setFormStatus('idle');
    setTimeout(() => {
      contactSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      messageInputRef.current?.focus();
    }, 120);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(STUDENT_PROFILE.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    } catch {
      setEmailCopied(false);
    }
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) {
      setFormStatus('error');
      setFormError('Mohon lengkapi nama, alamat email, dan isi pesan sebelum mengirim.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      setFormStatus('error');
      setFormError('Format alamat email belum valid. Mohon periksa kembali.');
      return;
    }

    setFormError('');
    setFormStatus('submitted');
  };

  const handleResetForm = () => {
    setSenderName('');
    setSenderEmail('');
    setSubject('');
    setMessage('');
    setFormStatus('idle');
    setFormError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#beranda"
            className="text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            {STUDENT_PROFILE.shortBrand}
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#proyek"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              Proyek
            </a>
            <a
              href="#kompetensi"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              Kompetensi
            </a>
            <a
              href="#pengalaman"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              Pengalaman
            </a>
            <a
              href="#sertifikasi"
              className="hover:text-slate-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              Sertifikasi
            </a>
          </nav>

          {/* Zone 3: 1 primary action (+ mobile menu trigger on small viewports) */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#kontak"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Hubungi Saya
            </a>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <nav
            aria-label="Navigasi seluler"
            className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1"
          >
            <a
              href="#proyek"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Proyek
            </a>
            <a
              href="#kompetensi"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Kompetensi
            </a>
            <a
              href="#pengalaman"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Pengalaman
            </a>
            <a
              href="#sertifikasi"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Sertifikasi
            </a>
            <div className="pt-2">
              <a
                href="#kontak"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Hubungi Saya
              </a>
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* Split-Screen Hero Section */}
        <section
          id="beranda"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left Column: Editorial Typographic Hierarchy */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <p className="text-sm font-medium text-slate-600">
                  {STUDENT_PROFILE.program}
                  <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
                  <span>{STUDENT_PROFILE.school}</span>
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-950 leading-[1.08] text-balance">
                  {STUDENT_PROFILE.headline}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {STUDENT_PROFILE.lead}
                </p>
              </div>

              <div className="pt-8 space-y-5">
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="#proyek"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <span>Jelajahi Proyek Teknik</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsResumeOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-800 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <FileText className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    <span>Ringkasan CV Teknis</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  {STUDENT_PROFILE.availability}
                  <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
                  <span>{STUDENT_PROFILE.location}</span>
                </p>
              </div>
            </div>

            {/* Right Column: Matching-Height Lab Portrait */}
            <div className="lg:col-span-6">
              <div className="h-full min-h-[320px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-white">
                <ResilientImage
                  src={STUDENT_PROFILE.heroImage}
                  alt={STUDENT_PROFILE.heroImageAlt}
                  fallbackTitle={`${STUDENT_PROFILE.fullName} — Laboratorium Ketenagalistrikan`}
                  className="w-full h-full object-cover object-center"
                  containerClassName="w-full h-full min-h-[320px]"
                />
              </div>
            </div>
          </div>

          {/* 4-Column Proof & Metrics Strip Directly Below Hero Split */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {HERO_METRICS.map((metric) => (
              <div key={metric.label} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-950">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-slate-900">{metric.label}</p>
                <p className="text-xs text-slate-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subtle Marquee Discipline Ribbon */}
        <div
          aria-hidden="true"
          className="no-print border-y border-slate-200 bg-white py-3.5 overflow-hidden select-none"
        >
          <div className="animate-marquee-ribbon text-xs font-medium tracking-wide text-slate-500">
            {[0, 1].map((loopIndex) => (
              <div key={loopIndex} className="flex items-center gap-6 pr-6">
                {MARQUEE_ITEMS.map((item) => (
                  <span key={`${loopIndex}-${item}`} className="flex items-center gap-6 whitespace-nowrap">
                    <span>{item}</span>
                    <span className="text-slate-300">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Electrical Projects Showcase (Bento Grid + Filter Tabs) */}
        <section
          id="proyek"
          className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-blue-700">
                Dokumentasi Praktikum & Proyek Lapangan
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                Proyek Instalasi, Otomasi & Pengujian Terukur
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Pilih salah satu kartu proyek untuk memeriksa spesifikasi teknis, metode pengerjaan, serta hasil uji komisioning.
              </p>
            </div>

            {/* Interactive Segmented Filter Tabs */}
            <div
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl border border-slate-200 self-start lg:self-auto"
              role="tablist"
              aria-label="Filter kategori proyek ketenagalistrikan"
            >
              {FILTER_CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bento Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const isWideFeatured =
                selectedCategory === 'Semua' && project.featured;

              return (
                <article
                  key={project.id}
                  className={`group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden transition-colors hover:border-slate-300 ${
                    isWideFeatured ? 'md:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveProject(project)}
                    className="flex flex-col h-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <div
                      className={`w-full overflow-hidden bg-slate-100 border-b border-slate-200 ${
                        isWideFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
                      }`}
                    >
                      <ResilientImage
                        src={project.image}
                        alt={project.imageAlt}
                        fallbackTitle={project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        containerClassName="w-full h-full"
                      />
                    </div>

                    <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                      <div className="space-y-2.5">
                        {/* Zero-pill inline metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{project.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{project.year}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{project.systemSpec}</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-950 group-hover:text-blue-700 transition-colors text-balance">
                          {project.title}
                        </h3>

                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {project.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                        <span className="text-slate-500 truncate">
                          Acuan: <strong className="font-medium text-slate-800">{project.standardRef}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-blue-700 whitespace-nowrap shrink-0">
                          <span>Lihat Spesifikasi</span>
                          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Technical Competencies & Electrical Verification Calculator */}
        <section
          id="kompetensi"
          className="border-t border-slate-200 bg-white py-16 sm:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-blue-700">
                Bidang Keahlian & Perangkat Kerja
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                Kompetensi Inti Teknik Ketenagalistrikan
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Penguasaan teori perhitungan daya hingga eksekusi pengawatan panel dan pengujian keselamatan di lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
              {COMPETENCIES.map((item) => (
                <div
                  key={item.number}
                  className="pt-6 border-t border-slate-200 space-y-2.5"
                >
                  <h3 className="text-lg font-semibold text-slate-950">
                    <span className="font-mono text-blue-700 mr-2 tabular-nums">
                      {item.number}
                    </span>
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-xs font-mono text-slate-500 pt-1">
                    Perangkat: {item.tools}
                  </p>
                </div>
              ))}
            </div>

            {/* Practical Engineering Verification Tool */}
            <ThreePhaseCalculator />
          </div>
        </section>

        {/* Field Apprenticeship (PKL) & Supervisor Testimonial */}
        <section
          id="pengalaman"
          className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left 7 Columns: Experience Timeline */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-700">
                    Rekam Jejak Lapangan & Laboratorium
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                    Pengalaman Praktik Industri & Asistensi
                  </h2>
                </div>

                <div className="space-y-8">
                  {EXPERIENCES.map((exp) => (
                    <div
                      key={exp.role}
                      className="pt-6 border-t border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {exp.role}
                        </h3>
                        <span className="text-xs font-mono text-slate-500 tabular-nums">
                          {exp.period}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-700">
                        {exp.organization}
                        <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
                        <span className="font-normal text-slate-500">{exp.location}</span>
                      </p>

                      <ul className="space-y-2 text-sm text-slate-600 leading-relaxed list-disc pl-5">
                        {exp.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 Columns: Attributable Supervisor Testimonial (No border-l-4!) */}
              <div className="lg:col-span-5">
                <figure className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6">
                  <p className="text-xs font-medium text-slate-500">
                    Evaluasi Pembimbing Lapangan
                  </p>
                  <blockquote className="text-base text-slate-800 leading-relaxed">
                    “{TESTIMONIAL.quote}”
                  </blockquote>
                  <figcaption className="pt-4 border-t border-slate-200 space-y-0.5">
                    <p className="text-sm font-semibold text-slate-950">
                      {TESTIMONIAL.author}
                    </p>
                    <p className="text-xs text-slate-600">{TESTIMONIAL.role}</p>
                    <p className="text-xs text-slate-500">{TESTIMONIAL.organization}</p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications & Achievements Table */}
        <section
          id="sertifikasi"
          className="border-t border-slate-200 bg-white py-16 sm:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-blue-700">
                Validasi Kompetensi Resmi
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                Sertifikasi Keahlian & Prestasi Lomba
              </h2>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                    <th className="py-3.5 px-5 whitespace-nowrap">Tahun</th>
                    <th className="py-3.5 px-5">Nama Sertifikasi / Prestasi</th>
                    <th className="py-3.5 px-5">Lembaga Penerbit</th>
                    <th className="py-3.5 px-5 whitespace-nowrap">Nomor Registrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {CERTIFICATIONS.map((cert) => (
                    <tr key={cert.credentialCode} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 font-mono text-slate-600 tabular-nums align-top whitespace-nowrap">
                        {cert.year}
                      </td>
                      <td className="py-4 px-5 align-top">
                        <p className="font-medium text-slate-950">{cert.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{cert.scope}</p>
                      </td>
                      <td className="py-4 px-5 text-slate-700 align-top">
                        {cert.issuer}
                      </td>
                      <td className="py-4 px-5 font-mono text-xs text-slate-600 tabular-nums align-top whitespace-nowrap">
                        {cert.credentialCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Contact & Recruitment Inquiry Section */}
        <section
          id="kontak"
          ref={contactSectionRef}
          className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Contact Details */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-700">
                    Koneksi Industri & Rekrutmen
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
                    Jadwalkan Wawancara atau Diskusi Teknis
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Siap bergabung sebagai teknisi junior instalasi listrik, panel maker, maupun teknisi pemeliharaan utilitas industri.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-slate-700 min-w-0">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      <span className="font-mono text-xs sm:text-sm truncate">
                        {STUDENT_PROFILE.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      {emailCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Salin Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>{STUDENT_PROFILE.location}</span>
                  </div>
                </div>
              </div>

              {/* Right Interactive Contact Form */}
              <div className="lg:col-span-7">
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
                  {formStatus === 'submitted' ? (
                    <div className="space-y-4 py-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-700">
                        <Check className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        Pesan Anda Berhasil Dicatat
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Terima kasih, <span className="font-medium text-slate-900">{senderName}</span>. Pesan terkait{' '}
                        <span className="font-medium text-slate-900">
                          {subject || 'peluang kerja / wawancara'}
                        </span>{' '}
                        telah disiapkan. Untuk korespondensi langsung, silakan hubungi juga melalui{' '}
                        <span className="font-mono text-slate-900">{STUDENT_PROFILE.email}</span>.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Kirim Pesan Lainnya
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                      {formStatus === 'error' && formError && (
                        <div
                          role="alert"
                          className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900"
                        >
                          {formError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="contact-name"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                          >
                            Nama / Instansi
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            placeholder="Contoh: Budi Santoso — PT Daya Mitra"
                            className="w-full px-3.5 py-2.5 text-sm text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="contact-email"
                            className="block text-xs font-medium text-slate-700 mb-1.5"
                          >
                            Alamat Email
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            placeholder="nama@perusahaan.co.id"
                            className="w-full px-3.5 py-2.5 text-sm text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-subject"
                          className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                          Topik / Kebutuhan
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Undangan wawancara teknisi / permintaan diagram proyek"
                          className="w-full px-3.5 py-2.5 text-sm text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contact-message"
                          className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                          Pesan
                        </label>
                        <textarea
                          id="contact-message"
                          ref={messageInputRef}
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Tuliskan jadwal wawancara, posisi yang ditawarkan, atau detail proyek yang ingin didiskusikan..."
                          className="w-full px-3.5 py-2.5 text-sm text-slate-950 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-y"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <p className="text-xs text-slate-500">
                          Respon maksimal 1×24 jam pada hari kerja.
                        </p>
                        <button
                          type="submit"
                          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          Kirim Pesan
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © 2026 {STUDENT_PROFILE.fullName} · Portofolio Teknik Instalasi Tenaga Listrik
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#proyek" className="hover:text-slate-900 transition-colors">
              Proyek
            </a>
            <a href="#kompetensi" className="hover:text-slate-900 transition-colors">
              Kompetensi
            </a>
            <a href="#pengalaman" className="hover:text-slate-900 transition-colors">
              Pengalaman
            </a>
            <button
              type="button"
              onClick={() => setIsResumeOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Ringkasan CV
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProjectModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
        onRequestDiscussion={handleRequestDiscussion}
      />

      <ResumePrintModal
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
      />
    </div>
  );
}
