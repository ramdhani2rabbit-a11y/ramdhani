import { useState, useRef, useEffect, FormEvent } from 'react';
import { MotionConfig, motion } from 'motion/react';
import {
  ArrowUpRight,
  Menu,
  X,
  Copy,
  Check,
  FileText,
  Mail,
  MapPin,
  LogOut,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  BLUEPRINT_LIMITS,
  OperationType,
  handleFirestoreError,
} from './firebase';
import { useFirebase } from './contexts/FirebaseContext';
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
  'proteksi petir & arrester spd',
  'panel hubung bagi utama',
  'otomasi plc & kendali motor',
  'audit pembumian & tahanan isolasi',
  'pembangkit surya atap',
  'standar puil 2011 & k3 loto',
];

type InquiryStatus = 'baru' | 'dibalas' | 'arsip';

interface InquiryRecord {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: InquiryStatus;
}

export default function App() {
  const {
    user,
    authReady,
    isAdmin,
    authLoading,
    authError,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('Semua');
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact form state
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'error' | 'submitted'>('idle');
  const [formError, setFormError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);

  const contactSectionRef = useRef<HTMLElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (user) {
      setSenderName((prev) => prev || user.displayName || '');
      setSenderEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setInquiries([]);
      return;
    }

    const inquiriesQuery = isAdmin
      ? collection(db, 'inquiries')
      : query(
          collection(db, 'inquiries'),
          where('senderUid', '==', user.uid)
        );

    const unsubscribe = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const rows: InquiryRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = data.status;
          const status: InquiryStatus =
            rawStatus === 'dibalas' || rawStatus === 'arsip' ? rawStatus : 'baru';
          return {
            id: docSnap.id,
            senderUid: String(data.senderUid ?? ''),
            senderName: String(data.senderName ?? ''),
            senderEmail: String(data.senderEmail ?? ''),
            subject: String(data.subject ?? ''),
            message: String(data.message ?? ''),
            status,
          };
        });
        setInquiries(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inquiries');
      }
    );

    return () => unsubscribe();
  }, [authReady, user, isAdmin]);

  const filteredProjects =
    selectedCategory === 'Semua'
      ? PROJECTS
      : PROJECTS.filter((project) => project.category === selectedCategory);

  const handleRequestDiscussion = (projectTitle: string) => {
    setActiveProject(null);
    setSubject(`Diskusi Proyek: ${projectTitle}`.slice(0, BLUEPRINT_LIMITS.inquiry.subjectMax));
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

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();

    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) return;
    }

    if (!activeUser.emailVerified) {
      setFormStatus('error');
      setFormError('Akun Google Anda harus terverifikasi untuk mengirim pesan ke basis data.');
      return;
    }

    const cleanName = (senderName.trim() || activeUser.displayName || '').slice(
      0,
      BLUEPRINT_LIMITS.inquiry.nameMax
    );
    const cleanEmail = (senderEmail.trim() || activeUser.email || '').slice(
      0,
      BLUEPRINT_LIMITS.inquiry.emailMax
    );
    const cleanSubject = (
      subject.trim() || 'Diskusi Portofolio Ketenagalistrikan'
    ).slice(0, BLUEPRINT_LIMITS.inquiry.subjectMax);
    const cleanMessage = message.trim().slice(0, BLUEPRINT_LIMITS.inquiry.messageMax);

    if (
      cleanName.length < BLUEPRINT_LIMITS.inquiry.nameMin ||
      cleanEmail.length < BLUEPRINT_LIMITS.inquiry.emailMin ||
      cleanMessage.length < BLUEPRINT_LIMITS.inquiry.messageMin
    ) {
      setFormStatus('error');
      setFormError(
        'Mohon lengkapi nama (min. 2 karakter), alamat email, dan pesan (min. 5 karakter).'
      );
      return;
    }

    if (!BLUEPRINT_LIMITS.inquiry.emailPattern.test(cleanEmail)) {
      setFormStatus('error');
      setFormError('Format alamat email belum valid. Mohon periksa kembali.');
      return;
    }

    setFormError('');
    setFormStatus('submitting');

    const inquiryId = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const path = `inquiries/${inquiryId}`;

    try {
      await setDoc(doc(db, 'inquiries', inquiryId), {
        senderUid: activeUser.uid,
        senderName: cleanName,
        senderEmail: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'baru',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSenderName(cleanName);
      setSenderEmail(cleanEmail);
      setSubject(cleanSubject);
      setFormStatus('submitted');
    } catch (error) {
      setFormStatus('error');
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateInquiryStatus = async (
    inquiryId: string,
    nextStatus: InquiryStatus
  ) => {
    const path = `inquiries/${inquiryId}`;
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    const path = `inquiries/${inquiryId}`;
    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleResetForm = () => {
    setSubject('');
    setMessage('');
    setFormStatus('idle');
    setFormError('');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#070B14] text-slate-100">
        {/* Top Bar Contract: 3 zones separated by gap-8 */}
        <header className="no-print sticky top-0 z-40 bg-[#070B14]/85 backdrop-blur-xl border-b border-slate-800/80">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Single text element wordmark */}
            <a
              href="#beranda"
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
            >
              {STUDENT_PROFILE.shortBrand}
            </a>

            {/* Zone 2: 4 concise single-line nav links */}
            <nav
              aria-label="Navigasi utama"
              className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
            >
              <a
                href="#proyek"
                className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
              >
                Proyek
              </a>
              <a
                href="#kompetensi"
                className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
              >
                Kompetensi
              </a>
              <a
                href="#pengalaman"
                className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
              >
                Pengalaman
              </a>
              <a
                href="#sertifikasi"
                className="hover:text-amber-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
              >
                Sertifikasi
              </a>
            </nav>

            {/* Zone 3: 1 primary action (+ mobile menu trigger on small viewports) */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#kontak"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                Hubungi Saya
              </a>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
                className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-800 bg-[#0D1322] text-slate-100 hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Panel */}
          {isMobileMenuOpen && (
            <nav
              aria-label="Navigasi seluler"
              className="md:hidden border-t border-slate-800 bg-[#0D1322] px-4 py-4 space-y-1"
            >
              <a
                href="#proyek"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800"
              >
                Proyek
              </a>
              <a
                href="#kompetensi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800"
              >
                Kompetensi
              </a>
              <a
                href="#pengalaman"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800"
              >
                Pengalaman
              </a>
              <a
                href="#sertifikasi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-slate-200 rounded-lg hover:bg-slate-800"
              >
                Sertifikasi
              </a>
              <div className="pt-2">
                <a
                  href="#kontak"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Hubungi Saya
                </a>
              </div>
            </nav>
          )}
        </header>

        <main>
          {/* High-Voltage Architectural Split-Screen Hero */}
          <section id="beranda" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-engineering-grid"
            />

            <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                {/* Left Column: Editorial Typographic Hierarchy */}
                <div className="lg:col-span-6 flex flex-col justify-between py-2">
                  <div className="space-y-6">
                    <p className="text-sm font-medium text-slate-400">
                      <span className="text-amber-400 font-semibold">{STUDENT_PROFILE.program}</span>
                      <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
                      <span>{STUDENT_PROFILE.school}</span>
                    </p>

                    <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.03em] text-white leading-[1.04] text-balance">
                      Merancang Sistem{' '}
                      <span className="text-amber-400">Listrik &amp; Proteksi</span>{' '}
                      yang Tangguh dan Presisi.
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed tracking-[0.01em] max-w-xl">
                      {STUDENT_PROFILE.lead}
                    </p>
                  </div>

                  <div className="pt-10 space-y-5">
                    <div className="flex flex-wrap items-center gap-3.5">
                      <a
                        href="#proyek"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                      >
                        <Zap className="w-4 h-4" aria-hidden="true" />
                        <span>Jelajahi Proyek Teknik</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setIsResumeOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-100 bg-[#0D1322] border border-slate-700 hover:border-slate-500 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                      >
                        <FileText className="w-4 h-4 text-sky-400" aria-hidden="true" />
                        <span>Ringkasan CV Teknis</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">
                      {STUDENT_PROFILE.availability}
                      <span className="mx-2 text-slate-700" aria-hidden="true">·</span>
                      <span>{STUDENT_PROFILE.location}</span>
                    </p>
                  </div>
                </div>

                {/* Right Column: Matching-Height Male Technician Portrait */}
                <div className="lg:col-span-6">
                  <div className="relative h-full min-h-[340px] sm:min-h-[440px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0D1322]">
                    <ResilientImage
                      src={STUDENT_PROFILE.heroImage}
                      alt={STUDENT_PROFILE.heroImageAlt}
                      fallbackTitle={`${STUDENT_PROFILE.fullName} — Teknisi Ketenagalistrikan`}
                      className="w-full h-full object-cover object-center"
                      containerClassName="w-full h-full min-h-[340px]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070B14]/90 via-[#070B14]/35 to-transparent"
                    />
                    <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-4 text-xs text-slate-100">
                      <span className="font-medium">{STUDENT_PROFILE.fullName}</span>
                      <span className="font-mono text-amber-400">Switchgear 380V · K3 LOTO</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carbon 4-Column Proof & Metrics Band Directly Below Hero Split */}
              <div className="mt-10 rounded-2xl bg-[#0D1322] border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 overflow-hidden">
                {HERO_METRICS.map((metric) => (
                  <div key={metric.label} className="p-6 sm:p-7 space-y-1.5">
                    <p className="text-3xl sm:text-[2rem] font-bold font-mono tabular-nums tracking-tight text-amber-400">
                      {metric.value}
                    </p>
                    <p className="text-sm font-medium text-white">{metric.label}</p>
                    <p className="text-xs text-slate-400">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Subtle Marquee Discipline Ribbon */}
          <div
            aria-hidden="true"
            className="no-print border-y border-slate-800 bg-[#0A0F1C] py-3.5 overflow-hidden select-none"
          >
            <div className="animate-marquee-ribbon text-xs font-medium tracking-wide text-slate-400">
              {[0, 1].map((loopIndex) => (
                <div key={loopIndex} className="flex items-center gap-6 pr-6">
                  {MARQUEE_ITEMS.map((item) => (
                    <span
                      key={`${loopIndex}-${item}`}
                      className="flex items-center gap-6 whitespace-nowrap"
                    >
                      <span>{item}</span>
                      <span className="text-amber-400/70">·</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Electrical Projects Showcase (Bento Grid + Filter Tabs) */}
          <section
            id="proyek"
            className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24"
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-amber-400">
                  Dokumentasi Praktikum &amp; Proyek Lapangan
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                  Proyek Instalasi, Proteksi Petir &amp; Otomasi Terukur
                </h2>
                <p className="text-sm sm:text-base text-slate-300 tracking-[0.01em]">
                  Pilih salah satu kartu proyek untuk memeriksa spesifikasi teknis, metode pengerjaan, serta hasil uji komisioning.
                </p>
              </div>

              {/* Interactive Segmented Filter Tabs */}
              <div
                className="flex flex-wrap items-center gap-1 p-1 bg-[#0D1322] rounded-xl border border-slate-800 self-start lg:self-auto"
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
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                        isActive
                          ? 'bg-amber-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
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
                  <motion.article
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={`group flex flex-col bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 ${
                      isWideFeatured ? 'md:col-span-2 lg:col-span-2' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveProject(project)}
                      className="flex flex-col h-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    >
                      <div
                        className={`relative w-full overflow-hidden bg-slate-950 border-b border-slate-800 ${
                          isWideFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
                        }`}
                      >
                        <ResilientImage
                          src={project.image}
                          alt={project.imageAlt}
                          fallbackTitle={project.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          containerClassName="w-full h-full"
                        />
                      </div>

                      <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                        <div className="space-y-3">
                          {/* Zero-pill inline metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-semibold text-amber-400">{project.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{project.year}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-300">{project.systemSpec}</span>
                          </div>

                          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-white group-hover:text-amber-400 transition-colors text-balance">
                            {project.title}
                          </h3>

                          <p className="text-sm text-slate-300 leading-relaxed tracking-[0.01em] line-clamp-3">
                            {project.summary}
                          </p>

                          {/* Compact 2-Metric Engineering Preview */}
                          {project.specs.length >= 2 && (
                            <div className="grid grid-cols-2 gap-3 pt-2">
                              {project.specs.slice(0, 2).map((spec) => (
                                <div
                                  key={spec.label}
                                  className="px-3 py-2 rounded-lg bg-[#070B14] border border-slate-800"
                                >
                                  <p className="text-[11px] text-slate-400 truncate">
                                    {spec.label}
                                  </p>
                                  <p className="text-xs font-mono font-semibold text-sky-400 tabular-nums truncate">
                                    {spec.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4 text-xs">
                          <span className="text-slate-400 truncate">
                            Acuan:{' '}
                            <strong className="font-medium text-slate-200">
                              {project.standardRef}
                            </strong>
                          </span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-700 text-slate-300 group-hover:bg-amber-400 group-hover:border-amber-400 group-hover:text-slate-950 transition-colors shrink-0">
                            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </section>

          {/* Technical Competencies (Asymmetric 4+8 Editorial Layout) & Calculator */}
          <section
            id="kompetensi"
            className="border-t border-slate-800 bg-[#0A0F1C] py-16 sm:py-24"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
                  <p className="text-xs font-semibold text-amber-400">
                    Bidang Keahlian &amp; Perangkat Kerja
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                    Kompetensi Inti Teknik Ketenagalistrikan
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed tracking-[0.01em]">
                    Penguasaan teori perhitungan daya, proteksi surja petir, hingga eksekusi pengawatan panel dan pengujian keselamatan di lapangan.
                  </p>
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                  {COMPETENCIES.map((item) => (
                    <div
                      key={item.number}
                      className="pt-6 border-t border-slate-800 space-y-3"
                    >
                      <span className="block text-2xl font-bold font-mono text-amber-400 tabular-nums">
                        {item.number}
                      </span>
                      <h3 className="text-lg font-semibold text-white tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed tracking-[0.01em]">
                        {item.description}
                      </p>
                      <p className="text-xs font-mono text-sky-400/90 pt-1">
                        {item.tools}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Engineering Verification Tool */}
              <ThreePhaseCalculator />
            </div>
          </section>

          {/* Field Apprenticeship (PKL) & Supervisor Testimonial */}
          <section
            id="pengalaman"
            className="border-t border-slate-800 bg-[#070B14] py-16 sm:py-24"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Left 7 Columns: Experience Timeline */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-400">
                      Rekam Jejak Lapangan &amp; Laboratorium
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                      Pengalaman Praktik Industri &amp; Asistensi
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {EXPERIENCES.map((exp) => (
                      <div
                        key={exp.role}
                        className="pt-6 border-t border-slate-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {exp.role}
                          </h3>
                          <span className="text-xs font-mono text-amber-400 tabular-nums">
                            {exp.period}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-slate-200">
                          {exp.organization}
                          <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
                          <span className="font-normal text-slate-400">{exp.location}</span>
                        </p>

                        <ul className="space-y-2 text-sm text-slate-300 leading-relaxed tracking-[0.01em] list-disc pl-5">
                          {exp.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 Columns: Attributable Supervisor Testimonial */}
                <div className="lg:col-span-5">
                  <figure className="p-7 sm:p-8 rounded-2xl bg-[#0D1322] text-slate-100 border border-slate-800 space-y-6">
                    <p className="text-xs font-semibold text-amber-400">
                      Evaluasi Pembimbing Lapangan
                    </p>
                    <blockquote className="text-base sm:text-lg text-white leading-relaxed tracking-[0.01em]">
                      “{TESTIMONIAL.quote}”
                    </blockquote>
                    <figcaption className="pt-5 border-t border-slate-800 space-y-0.5">
                      <p className="text-sm font-semibold text-white">
                        {TESTIMONIAL.author}
                      </p>
                      <p className="text-xs text-slate-300">{TESTIMONIAL.role}</p>
                      <p className="text-xs text-slate-400">{TESTIMONIAL.organization}</p>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </section>

          {/* Certifications & Achievements Table */}
          <section
            id="sertifikasi"
            className="border-t border-slate-800 bg-[#0A0F1C] py-16 sm:py-24"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold text-amber-400">
                  Validasi Kompetensi Resmi
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                  Sertifikasi Keahlian &amp; Prestasi Lomba
                </h2>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-[#0D1322]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#070B14] text-xs font-semibold text-slate-300">
                      <th className="py-3.5 px-5 whitespace-nowrap">Tahun</th>
                      <th className="py-3.5 px-5">Nama Sertifikasi / Prestasi</th>
                      <th className="py-3.5 px-5">Lembaga Penerbit</th>
                      <th className="py-3.5 px-5 whitespace-nowrap">Nomor Registrasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {CERTIFICATIONS.map((cert) => (
                      <tr
                        key={cert.credentialCode}
                        className="hover:bg-slate-900/60 transition-colors"
                      >
                        <td className="py-4 px-5 font-mono text-amber-400 tabular-nums align-top whitespace-nowrap">
                          {cert.year}
                        </td>
                        <td className="py-4 px-5 align-top">
                          <p className="font-medium text-white">{cert.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{cert.scope}</p>
                        </td>
                        <td className="py-4 px-5 text-slate-300 align-top">
                          {cert.issuer}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-sky-400 tabular-nums align-top whitespace-nowrap">
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
            className="border-t border-slate-800 bg-[#070B14] py-16 sm:py-24"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                {/* Left Contact Details */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-amber-400">
                      Koneksi Industri &amp; Rekrutmen
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                      Jadwalkan Wawancara atau Diskusi Teknis
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed tracking-[0.01em]">
                      Siap bergabung sebagai teknisi listrik industri, perakit panel PHB, maupun teknisi pemeliharaan jaringan dan proteksi.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-slate-200 min-w-0">
                        <Mail className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                        <span className="font-mono text-xs sm:text-sm truncate">
                          {STUDENT_PROFILE.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0D1322] border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                      >
                        {emailCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
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

                    <div className="flex items-center gap-2.5 text-slate-300">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                      <span>{STUDENT_PROFILE.location}</span>
                    </div>

                    {/* Authenticated Session Summary */}
                    <div className="pt-4 border-t border-slate-800 space-y-2.5">
                      {user ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {user.displayName || user.email}
                              {isAdmin ? ' · Admin Portofolio' : ''}
                            </p>
                            <p className="text-xs font-mono text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={signOutUser}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0D1322] border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                          >
                            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Keluar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            Masuk dengan Google untuk menyimpan pesan ke Firestore.
                          </p>
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={signInWithGoogle}
                            className="px-3.5 py-2 text-xs font-medium text-slate-100 bg-[#0D1322] border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                          >
                            {authLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}
                          </button>
                        </div>
                      )}
                      {authError && (
                        <p className="text-xs text-amber-300">{authError}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Interactive Contact Form & Firestore Inquiry List */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1322] border border-slate-800">
                    {formStatus === 'submitted' ? (
                      <div className="space-y-4 py-4">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-400/15 text-amber-400">
                          <Check className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          Pesan Tersimpan di Basis Data
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Terima kasih,{' '}
                          <span className="font-medium text-white">{senderName}</span>. Pesan terkait{' '}
                          <span className="font-medium text-white">
                            {subject || 'peluang kerja / wawancara'}
                          </span>{' '}
                          telah tersimpan dengan status{' '}
                          <span className="font-mono text-amber-400">baru</span>.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetForm}
                          className="px-4 py-2 text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                        >
                          Kirim Pesan Lainnya
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} noValidate className="space-y-5">
                        {formStatus === 'error' && formError && (
                          <div
                            role="alert"
                            className="p-3.5 rounded-lg bg-amber-400/10 border border-amber-400/40 text-xs sm:text-sm text-amber-200"
                          >
                            {formError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="contact-name"
                              className="block text-xs font-medium text-slate-300 mb-1.5"
                            >
                              Nama / Instansi
                            </label>
                            <input
                              id="contact-name"
                              type="text"
                              maxLength={BLUEPRINT_LIMITS.inquiry.nameMax}
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              placeholder="Contoh: Budi Santoso — PT Daya Mitra"
                              className="w-full px-3.5 py-2.5 text-sm text-white bg-[#070B14] border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="contact-email"
                              className="block text-xs font-medium text-slate-300 mb-1.5"
                            >
                              Alamat Email
                            </label>
                            <input
                              id="contact-email"
                              type="email"
                              maxLength={BLUEPRINT_LIMITS.inquiry.emailMax}
                              value={senderEmail}
                              onChange={(e) => setSenderEmail(e.target.value)}
                              placeholder="nama@perusahaan.co.id"
                              className="w-full px-3.5 py-2.5 text-sm text-white bg-[#070B14] border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="contact-subject"
                            className="block text-xs font-medium text-slate-300 mb-1.5"
                          >
                            Topik / Kebutuhan
                          </label>
                          <input
                            id="contact-subject"
                            type="text"
                            maxLength={BLUEPRINT_LIMITS.inquiry.subjectMax}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Undangan wawancara teknisi / permintaan diagram proyek"
                            className="w-full px-3.5 py-2.5 text-sm text-white bg-[#070B14] border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="contact-message"
                            className="block text-xs font-medium text-slate-300 mb-1.5"
                          >
                            Pesan
                          </label>
                          <textarea
                            id="contact-message"
                            ref={messageInputRef}
                            rows={4}
                            maxLength={BLUEPRINT_LIMITS.inquiry.messageMax}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tuliskan jadwal wawancara, posisi yang ditawarkan, atau detail proyek yang ingin didiskusikan..."
                            className="w-full px-3.5 py-2.5 text-sm text-white bg-[#070B14] border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500 resize-y"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                          <p className="text-xs text-slate-400">
                            Respon maksimal 1×24 jam pada hari kerja.
                          </p>
                          <button
                            type="submit"
                            disabled={formStatus === 'submitting' || authLoading}
                            className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                          >
                            {formStatus === 'submitting'
                              ? 'Mengirim...'
                              : user
                              ? 'Kirim Pesan'
                              : 'Masuk Google & Kirim'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Real-time Firestore Inquiries List (Scoped to Owner or Admin) */}
                  {user && inquiries.length > 0 && (
                    <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {isAdmin
                            ? `Kotak Masuk Pesan Portofolio (${inquiries.length})`
                            : `Riwayat Pesan Terkirim (${inquiries.length})`}
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-800">
                        {inquiries.map((item) => (
                          <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm font-semibold text-white">
                                {item.subject}
                              </p>
                              <span className="text-xs font-mono text-amber-400">
                                Status: {item.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {item.senderName} · {item.senderEmail}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {item.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {isAdmin && (
                                <>
                                  {(['baru', 'dibalas', 'arsip'] as const).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      disabled={item.status === st}
                                      onClick={() => handleUpdateInquiryStatus(item.id, st)}
                                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                        item.status === st
                                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold'
                                          : 'bg-[#070B14] text-slate-300 border-slate-700 hover:bg-slate-800'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </>
                              )}
                              {(isAdmin || item.status === 'baru') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInquiry(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Quiet Editorial Footer */}
        <footer className="no-print border-t border-slate-800 bg-[#0A0F1C]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © 2026 {STUDENT_PROFILE.fullName} · Portofolio Teknik Instalasi Tenaga Listrik
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a href="#proyek" className="hover:text-amber-400 transition-colors">
                Proyek
              </a>
              <a href="#kompetensi" className="hover:text-amber-400 transition-colors">
                Kompetensi
              </a>
              <a href="#pengalaman" className="hover:text-amber-400 transition-colors">
                Pengalaman
              </a>
              <button
                type="button"
                onClick={() => setIsResumeOpen(true)}
                className="hover:text-amber-400 transition-colors"
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
    </MotionConfig>
  );
}
