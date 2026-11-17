import { useState, useRef, useEffect, FormEvent, useMemo } from 'react';
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
  Plus,
  Pencil,
  ShieldCheck,
  Database,
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
  CERTIFICATIONS,
  DEFAULT_PROJECT_IMAGE_MAP,
  FALLBACK_NEW_PROJECT_IMAGE,
  type ProjectCategory,
  type PortfolioProject,
  type CompetencyItem,
  type ExperienceItem,
  type CertificationItem,
  type ProfileData,
} from './data/portfolioData';
import {
  saveProjectToFirestore,
  deleteProjectFromFirestore,
  saveCompetencyToFirestore,
  deleteCompetencyFromFirestore,
  saveExperienceToFirestore,
  deleteExperienceFromFirestore,
  saveCertificationToFirestore,
  deleteCertificationFromFirestore,
  saveProfileToFirestore,
  seedDefaultPortfolioToFirestore,
} from './services/portfolioStore';
import { ResilientImage } from './components/ResilientImage';
import { ProjectModal } from './components/ProjectModal';
import { ResumePrintModal } from './components/ResumePrintModal';
import { ThreePhaseCalculator } from './components/ThreePhaseCalculator';
import {
  ProjectEditorModal,
  CompetencyEditorModal,
  ExperienceEditorModal,
  CertificationEditorModal,
  ProfileEditorModal,
} from './components/PortfolioEditorModals';

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

type DeleteTarget =
  | { type: 'project'; id: string }
  | { type: 'competency'; id: string }
  | { type: 'experience'; id: string }
  | { type: 'certification'; id: string }
  | null;

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

  // Admin Edit Mode & CRUD Modal States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [adminNotice, setAdminNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<DeleteTarget>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  const [compEditorOpen, setCompEditorOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<CompetencyItem | null>(null);

  const [expEditorOpen, setExpEditorOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);

  const [certEditorOpen, setCertEditorOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);

  const [profileEditorOpen, setProfileEditorOpen] = useState(false);

  // Firestore Live Portfolio Data
  const [hasProfileInDb, setHasProfileInDb] = useState(false);
  const [dbProfile, setDbProfile] = useState<ProfileData | null>(null);

  const [dbProjects, setDbProjects] = useState<PortfolioProject[]>([]);
  const [persistedProjectIds, setPersistedProjectIds] = useState<Set<string>>(new Set());

  const [dbCompetencies, setDbCompetencies] = useState<CompetencyItem[]>([]);
  const [persistedCompetencyIds, setPersistedCompetencyIds] = useState<Set<string>>(new Set());

  const [dbExperiences, setDbExperiences] = useState<ExperienceItem[]>([]);
  const [persistedExperienceIds, setPersistedExperienceIds] = useState<Set<string>>(new Set());

  const [dbCertifications, setDbCertifications] = useState<CertificationItem[]>([]);
  const [persistedCertificationIds, setPersistedCertificationIds] = useState<Set<string>>(new Set());

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
    if (!isAdmin) {
      setIsEditMode(false);
      setConfirmDelete(null);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (user) {
      setSenderName((prev) => prev || user.displayName || '');
      setSenderEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  // Subscribe to PortfolioProfile
  useEffect(() => {
    if (!authReady) return;
    const q = isAdmin
      ? collection(db, 'portfolioProfile')
      : query(collection(db, 'portfolioProfile'), where('isPublished', '==', true));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const mainDoc = snapshot.docs.find((d) => d.id === 'main') || snapshot.docs[0];
        if (!mainDoc) {
          setHasProfileInDb(false);
          setDbProfile(null);
          return;
        }
        const data = mainDoc.data();
        setHasProfileInDb(true);
        setDbProfile({
          ...STUDENT_PROFILE,
          fullName: String(data.fullName ?? STUDENT_PROFILE.fullName),
          shortBrand: String(data.shortBrand ?? STUDENT_PROFILE.shortBrand),
          program: String(data.program ?? STUDENT_PROFILE.program),
          school: String(data.school ?? STUDENT_PROFILE.school),
          location: String(data.location ?? STUDENT_PROFILE.location),
          email: String(data.email ?? STUDENT_PROFILE.email),
          phone: String(data.phone ?? STUDENT_PROFILE.phone),
          headline: String(data.headline ?? STUDENT_PROFILE.headline),
          lead: String(data.lead ?? STUDENT_PROFILE.lead),
          availability: String(data.availability ?? STUDENT_PROFILE.availability),
          testimonialQuote: String(data.testimonialQuote ?? STUDENT_PROFILE.testimonialQuote),
          testimonialAuthor: String(data.testimonialAuthor ?? STUDENT_PROFILE.testimonialAuthor),
          testimonialRole: String(data.testimonialRole ?? STUDENT_PROFILE.testimonialRole),
          testimonialOrg: String(data.testimonialOrg ?? STUDENT_PROFILE.testimonialOrg),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'portfolioProfile');
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Subscribe to Projects
  useEffect(() => {
    if (!authReady) return;
    const q = isAdmin
      ? collection(db, 'projects')
      : query(collection(db, 'projects'), where('isPublished', '==', true));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const ids = new Set<string>();
        const rows: PortfolioProject[] = snapshot.docs.map((docSnap) => {
          ids.add(docSnap.id);
          const d = docSnap.data();
          const imageUrl = String(d.imageUrl ?? '');
          const resolvedImg =
            imageUrl.trim() ||
            DEFAULT_PROJECT_IMAGE_MAP[docSnap.id] ||
            FALLBACK_NEW_PROJECT_IMAGE;
          const rawCategory = String(d.category ?? 'Panel & Distribusi');
          const validCategory: Exclude<ProjectCategory, 'Semua'> =
            rawCategory === 'Otomasi PLC' ||
            rawCategory === 'Energi Terbarukan' ||
            rawCategory === 'Proteksi & Uji'
              ? rawCategory
              : 'Panel & Distribusi';

          return {
            id: docSnap.id,
            title: String(d.title ?? ''),
            category: validCategory,
            year: String(d.year ?? '2026'),
            systemSpec: String(d.systemSpec ?? ''),
            featured: Boolean(d.featured),
            image: resolvedImg,
            imageUrl,
            imageAlt: String(d.title ?? 'Dokumentasi proyek ketenagalistrikan'),
            summary: String(d.summary ?? ''),
            challenge: String(d.challenge ?? ''),
            solution: String(d.solution ?? ''),
            standardRef: String(d.standardRef ?? ''),
            role: String(d.role ?? ''),
            components: Array.isArray(d.components)
              ? d.components.map((c: unknown) => String(c))
              : [],
            specs: Array.isArray(d.specs)
              ? d.specs.map((s: { label?: unknown; value?: unknown }) => ({
                  label: String(s?.label ?? ''),
                  value: String(s?.value ?? ''),
                }))
              : [],
            sortOrder: Number(d.sortOrder ?? 1),
            isPublished: d.isPublished !== false,
          };
        });
        rows.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setPersistedProjectIds(ids);
        setDbProjects(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'projects');
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Subscribe to Competencies
  useEffect(() => {
    if (!authReady) return;
    const q = isAdmin
      ? collection(db, 'competencies')
      : query(collection(db, 'competencies'), where('isPublished', '==', true));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const ids = new Set<string>();
        const rows: CompetencyItem[] = snapshot.docs.map((docSnap) => {
          ids.add(docSnap.id);
          const d = docSnap.data();
          return {
            id: docSnap.id,
            number: String(d.number ?? '01.'),
            title: String(d.title ?? ''),
            description: String(d.description ?? ''),
            tools: String(d.tools ?? ''),
            sortOrder: Number(d.sortOrder ?? 1),
            isPublished: d.isPublished !== false,
          };
        });
        rows.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setPersistedCompetencyIds(ids);
        setDbCompetencies(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'competencies');
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Subscribe to Experiences
  useEffect(() => {
    if (!authReady) return;
    const q = isAdmin
      ? collection(db, 'experiences')
      : query(collection(db, 'experiences'), where('isPublished', '==', true));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const ids = new Set<string>();
        const rows: ExperienceItem[] = snapshot.docs.map((docSnap) => {
          ids.add(docSnap.id);
          const d = docSnap.data();
          return {
            id: docSnap.id,
            period: String(d.period ?? ''),
            role: String(d.role ?? ''),
            organization: String(d.organization ?? ''),
            location: String(d.location ?? ''),
            highlights: Array.isArray(d.highlights)
              ? d.highlights.map((h: unknown) => String(h))
              : [],
            sortOrder: Number(d.sortOrder ?? 1),
            isPublished: d.isPublished !== false,
          };
        });
        rows.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setPersistedExperienceIds(ids);
        setDbExperiences(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'experiences');
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Subscribe to Certifications
  useEffect(() => {
    if (!authReady) return;
    const q = isAdmin
      ? collection(db, 'certifications')
      : query(collection(db, 'certifications'), where('isPublished', '==', true));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const ids = new Set<string>();
        const rows: CertificationItem[] = snapshot.docs.map((docSnap) => {
          ids.add(docSnap.id);
          const d = docSnap.data();
          return {
            id: docSnap.id,
            year: String(d.year ?? '2026'),
            name: String(d.name ?? ''),
            issuer: String(d.issuer ?? ''),
            credentialCode: String(d.credentialCode ?? ''),
            scope: String(d.scope ?? ''),
            sortOrder: Number(d.sortOrder ?? 1),
            isPublished: d.isPublished !== false,
          };
        });
        rows.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setPersistedCertificationIds(ids);
        setDbCertifications(rows);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'certifications');
      }
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Subscribe to Inquiries (auth-scoped)
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

  const isFirestoreSeeded =
    hasProfileInDb ||
    persistedProjectIds.size > 0 ||
    persistedCompetencyIds.size > 0 ||
    persistedExperienceIds.size > 0 ||
    persistedCertificationIds.size > 0;

  const profile = dbProfile ?? STUDENT_PROFILE;
  const projects = useMemo(
    () => (hasProfileInDb || persistedProjectIds.size > 0 ? dbProjects : PROJECTS),
    [hasProfileInDb, persistedProjectIds, dbProjects]
  );
  const competencies = useMemo(
    () => (hasProfileInDb || persistedCompetencyIds.size > 0 ? dbCompetencies : COMPETENCIES),
    [hasProfileInDb, persistedCompetencyIds, dbCompetencies]
  );
  const experiences = useMemo(
    () => (hasProfileInDb || persistedExperienceIds.size > 0 ? dbExperiences : EXPERIENCES),
    [hasProfileInDb, persistedExperienceIds, dbExperiences]
  );
  const certifications = useMemo(
    () => (hasProfileInDb || persistedCertificationIds.size > 0 ? dbCertifications : CERTIFICATIONS),
    [hasProfileInDb, persistedCertificationIds, dbCertifications]
  );

  const filteredProjects =
    selectedCategory === 'Semua'
      ? projects
      : projects.filter((project) => project.category === selectedCategory);

  const showNotice = (msg: string) => {
    setAdminNotice(msg);
    setTimeout(() => {
      setAdminNotice((curr) => (curr === msg ? '' : curr));
    }, 3500);
  };

  const ensurePortfolioSeeded = async () => {
    if (!user || !isAdmin || hasProfileInDb) return;
    setIsSeeding(true);
    try {
      await seedDefaultPortfolioToFirestore(user.uid, {
        hasProfile: hasProfileInDb,
        existingProjectIds: persistedProjectIds,
        existingCompetencyIds: persistedCompetencyIds,
        existingExperienceIds: persistedExperienceIds,
        existingCertificationIds: persistedCertificationIds,
      });
      showNotice('Data portofolio awal berhasil disinkronkan ke Cloud Firestore.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleEditMode = async () => {
    if (!isAdmin) return;
    const next = !isEditMode;
    setIsEditMode(next);
    setConfirmDelete(null);
    if (next && !hasProfileInDb) {
      await ensurePortfolioSeeded();
    }
  };

  // CRUD Save & Delete handlers
  const handleSaveProject = async (proj: PortfolioProject) => {
    if (!user) return;
    if (!hasProfileInDb) await ensurePortfolioSeeded();
    const exists = persistedProjectIds.has(proj.id);
    await saveProjectToFirestore(proj, user.uid, exists);
    showNotice(`Proyek "${proj.title}" tersimpan.`);
  };

  const handleSaveCompetency = async (item: CompetencyItem) => {
    if (!user) return;
    if (!hasProfileInDb) await ensurePortfolioSeeded();
    const exists = persistedCompetencyIds.has(item.id);
    await saveCompetencyToFirestore(item, user.uid, exists);
    showNotice(`Kompetensi "${item.title}" tersimpan.`);
  };

  const handleSaveExperience = async (item: ExperienceItem) => {
    if (!user) return;
    if (!hasProfileInDb) await ensurePortfolioSeeded();
    const exists = persistedExperienceIds.has(item.id);
    await saveExperienceToFirestore(item, user.uid, exists);
    showNotice(`Pengalaman "${item.role}" tersimpan.`);
  };

  const handleSaveCertification = async (item: CertificationItem) => {
    if (!user) return;
    if (!hasProfileInDb) await ensurePortfolioSeeded();
    const exists = persistedCertificationIds.has(item.id);
    await saveCertificationToFirestore(item, user.uid, exists);
    showNotice(`Sertifikasi "${item.name}" tersimpan.`);
  };

  const handleSaveProfile = async (nextProfile: ProfileData) => {
    if (!user) return;
    if (!hasProfileInDb) await ensurePortfolioSeeded();
    await saveProfileToFirestore(nextProfile, user.uid, hasProfileInDb);
    showNotice('Profil & testimoni pembimbing diperbarui.');
  };

  const handleExecuteDelete = async () => {
    if (!confirmDelete || !user) return;
    setDeletingId(confirmDelete.id);
    try {
      if (!hasProfileInDb) {
        await ensurePortfolioSeeded();
      }
      if (confirmDelete.type === 'project') {
        await deleteProjectFromFirestore(confirmDelete.id);
        showNotice('Proyek dihapus dari portofolio.');
      } else if (confirmDelete.type === 'competency') {
        await deleteCompetencyFromFirestore(confirmDelete.id);
        showNotice('Kompetensi dihapus dari portofolio.');
      } else if (confirmDelete.type === 'experience') {
        await deleteExperienceFromFirestore(confirmDelete.id);
        showNotice('Pengalaman dihapus dari portofolio.');
      } else if (confirmDelete.type === 'certification') {
        await deleteCertificationFromFirestore(confirmDelete.id);
        showNotice('Sertifikasi dihapus dari portofolio.');
      }
      setConfirmDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

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
      await navigator.clipboard.writeText(profile.email);
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

  const renderHeadline = () => {
    if (profile.headline === STUDENT_PROFILE.headline) {
      return (
        <>
          Merancang Sistem{' '}
          <span className="text-amber-400">Listrik &amp; Proteksi</span>{' '}
          yang Tangguh dan Presisi.
        </>
      );
    }
    return profile.headline;
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
              {profile.shortBrand}
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
              {/* Admin Workspace Bar (only rendered outside header when signed in as Admin or for quick admin login) */}
              {isAdmin && (
                <div className="no-print mb-8 p-3.5 sm:px-5 rounded-xl bg-[#0D1322] border border-amber-400/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    <span className="font-semibold text-white">Ruang Editor Pemilik</span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-300 font-mono text-xs">{user?.email}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!isFirestoreSeeded && (
                      <button
                        type="button"
                        disabled={isSeeding}
                        onClick={ensurePortfolioSeeded}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-[#070B14] border border-sky-400/40 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Database className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isSeeding ? 'Menyimpan...' : 'Simpan Data Awal ke Cloud'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setProfileEditorOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#070B14] border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      <span>Edit Profil &amp; Testimoni</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleEditMode}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        isEditMode
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isEditMode ? 'Selesai Edit' : 'Aktifkan Mode Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={signOutUser}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#070B14] border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}

              {adminNotice && (
                <div
                  role="status"
                  className="no-print mb-6 px-4 py-2.5 rounded-lg bg-amber-400/15 border border-amber-400/40 text-xs sm:text-sm text-amber-200 flex items-center justify-between gap-3"
                >
                  <span>{adminNotice}</span>
                  <button
                    type="button"
                    onClick={() => setAdminNotice('')}
                    aria-label="Tutup notifikasi"
                    className="text-amber-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                {/* Left Column: Editorial Typographic Hierarchy */}
                <div className="lg:col-span-6 flex flex-col justify-between py-2">
                  <div className="space-y-6">
                    <p className="text-sm font-medium text-slate-400">
                      <span className="text-amber-400 font-semibold">{profile.program}</span>
                      <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
                      <span>{profile.school}</span>
                    </p>

                    <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-[-0.03em] text-white leading-[1.04] text-balance">
                      {renderHeadline()}
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed tracking-[0.01em] max-w-xl">
                      {profile.lead}
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

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        {profile.availability}
                        <span className="mx-2 text-slate-700" aria-hidden="true">·</span>
                        <span>{profile.location}</span>
                      </p>

                      {!user && (
                        <button
                          type="button"
                          disabled={authLoading}
                          onClick={signInWithGoogle}
                          className="no-print text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors whitespace-nowrap"
                        >
                          {authLoading ? 'Menghubungkan...' : 'Masuk Pemilik untuk Edit'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Matching-Height Male Technician Portrait */}
                <div className="lg:col-span-6">
                  <div className="relative h-full min-h-[340px] sm:min-h-[440px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0D1322]">
                    <ResilientImage
                      src={profile.heroImage}
                      alt={profile.heroImageAlt}
                      fallbackTitle={`${profile.fullName} — Teknisi Ketenagalistrikan`}
                      className="w-full h-full object-cover object-center"
                      containerClassName="w-full h-full min-h-[340px]"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#070B14]/90 via-[#070B14]/35 to-transparent"
                    />
                    <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-4 text-xs text-slate-100">
                      <span className="font-medium">{profile.fullName}</span>
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

              <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
                {/* Interactive Segmented Filter Tabs */}
                <div
                  className="flex flex-wrap items-center gap-1 p-1 bg-[#0D1322] rounded-xl border border-slate-800"
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

                {isAdmin && isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setProjectEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Tambah Proyek</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bento Project Grid */}
            {filteredProjects.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#0D1322] border border-slate-800 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  Belum ada proyek pada kategori ini.
                </p>
                {isAdmin && isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject(null);
                      setProjectEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Tambah Proyek Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const isWideFeatured =
                    selectedCategory === 'Semua' && project.featured;
                  const isConfirmingDelete =
                    confirmDelete?.type === 'project' &&
                    confirmDelete.id === project.id;

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
                        className="flex flex-col flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
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
                              {project.isPublished === false && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-sky-400">Draf</span>
                                </>
                              )}
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

                      {/* Admin Edit / Delete Bar */}
                      {isAdmin && isEditMode && (
                        <div className="px-6 py-3 border-t border-slate-800 bg-[#070B14] flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            Urutan #{project.sortOrder ?? 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {isConfirmingDelete ? (
                              <>
                                <button
                                  type="button"
                                  disabled={deletingId === project.id}
                                  onClick={handleExecuteDelete}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md"
                                >
                                  {deletingId === project.id ? 'Menghapus...' : 'Konfirmasi Hapus'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete(null)}
                                  className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProject(project);
                                    setProjectEditorOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:border-amber-400 rounded-md transition-colors"
                                >
                                  <Pencil className="w-3 h-3 text-amber-400" aria-hidden="true" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDelete({ type: 'project', id: project.id })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:text-white hover:border-slate-600 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                                  <span>Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Technical Competencies (Asymmetric 4+8 Editorial Layout) & Calculator */}
          <section
            id="kompetensi"
            className="border-t border-slate-800 bg-[#0A0F1C] py-16 sm:py-24"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                  <div className="space-y-3">
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

                  {isAdmin && isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComp(null);
                        setCompEditorOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Tambah Kompetensi</span>
                    </button>
                  )}
                </div>

                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                  {competencies.map((item) => {
                    const isConfirmingDelete =
                      confirmDelete?.type === 'competency' &&
                      confirmDelete.id === item.id;

                    return (
                      <div
                        key={item.id}
                        className="pt-6 border-t border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="block text-2xl font-bold font-mono text-amber-400 tabular-nums">
                            {item.number}
                          </span>
                          {isAdmin && isEditMode && (
                            <div className="flex items-center gap-1.5">
                              {isConfirmingDelete ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={deletingId === item.id}
                                    onClick={handleExecuteDelete}
                                    className="px-2 py-1 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md"
                                  >
                                    Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1 text-xs text-slate-300 bg-slate-800 rounded-md"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingComp(item);
                                      setCompEditorOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-200 bg-[#0D1322] border border-slate-700 hover:border-amber-400 rounded-md"
                                  >
                                    <Pencil className="w-3 h-3 text-amber-400" aria-hidden="true" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDelete({ type: 'competency', id: item.id })
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-300 bg-[#0D1322] border border-slate-800 hover:text-white rounded-md"
                                  >
                                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
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
                    );
                  })}
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
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-amber-400">
                        Rekam Jejak Lapangan &amp; Laboratorium
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                        Pengalaman Praktik Industri &amp; Asistensi
                      </h2>
                    </div>

                    {isAdmin && isEditMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExp(null);
                          setExpEditorOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Tambah Pengalaman</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-8">
                    {experiences.map((exp) => {
                      const isConfirmingDelete =
                        confirmDelete?.type === 'experience' &&
                        confirmDelete.id === exp.id;

                      return (
                        <div
                          key={exp.id}
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

                          {isAdmin && isEditMode && (
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                              {isConfirmingDelete ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={deletingId === exp.id}
                                    onClick={handleExecuteDelete}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md"
                                  >
                                    Konfirmasi Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 rounded-md"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingExp(exp);
                                      setExpEditorOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-200 bg-[#0D1322] border border-slate-700 hover:border-amber-400 rounded-md"
                                  >
                                    <Pencil className="w-3 h-3 text-amber-400" aria-hidden="true" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmDelete({ type: 'experience', id: exp.id })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-[#0D1322] border border-slate-800 hover:text-white rounded-md"
                                  >
                                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 5 Columns: Attributable Supervisor Testimonial */}
                <div className="lg:col-span-5">
                  <figure className="p-7 sm:p-8 rounded-2xl bg-[#0D1322] text-slate-100 border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-amber-400">
                        Evaluasi Pembimbing Lapangan
                      </p>
                      {isAdmin && isEditMode && (
                        <button
                          type="button"
                          onClick={() => setProfileEditorOpen(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-200 bg-[#070B14] border border-slate-700 hover:border-amber-400 rounded-md"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    <blockquote className="text-base sm:text-lg text-white leading-relaxed tracking-[0.01em]">
                      “{profile.testimonialQuote}”
                    </blockquote>
                    <figcaption className="pt-5 border-t border-slate-800 space-y-0.5">
                      <p className="text-sm font-semibold text-white">
                        {profile.testimonialAuthor}
                      </p>
                      <p className="text-xs text-slate-300">{profile.testimonialRole}</p>
                      <p className="text-xs text-slate-400">{profile.testimonialOrg}</p>
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
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-xs font-semibold text-amber-400">
                    Validasi Kompetensi Resmi
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                    Sertifikasi Keahlian &amp; Prestasi Lomba
                  </h2>
                </div>

                {isAdmin && isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCert(null);
                      setCertEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Tambah Sertifikasi</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-[#0D1322]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#070B14] text-xs font-semibold text-slate-300">
                      <th className="py-3.5 px-5 whitespace-nowrap">Tahun</th>
                      <th className="py-3.5 px-5">Nama Sertifikasi / Prestasi</th>
                      <th className="py-3.5 px-5">Lembaga Penerbit</th>
                      <th className="py-3.5 px-5 whitespace-nowrap">Nomor Registrasi</th>
                      {isAdmin && isEditMode && (
                        <th className="py-3.5 px-5 whitespace-nowrap text-right">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {certifications.map((cert) => {
                      const isConfirmingDelete =
                        confirmDelete?.type === 'certification' &&
                        confirmDelete.id === cert.id;

                      return (
                        <tr
                          key={cert.id}
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
                          {isAdmin && isEditMode && (
                            <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isConfirmingDelete ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={deletingId === cert.id}
                                      onClick={handleExecuteDelete}
                                      className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-amber-400 rounded-md"
                                    >
                                      Hapus
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDelete(null)}
                                      className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 rounded-md"
                                    >
                                      Batal
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCert(cert);
                                        setCertEditorOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-200 bg-[#070B14] border border-slate-700 hover:border-amber-400 rounded-md"
                                    >
                                      <Pencil className="w-3 h-3 text-amber-400" aria-hidden="true" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDelete({
                                          type: 'certification',
                                          id: cert.id,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-[#070B14] border border-slate-800 hover:text-white rounded-md"
                                    >
                                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
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
                          {profile.email}
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
                      <span>{profile.location}</span>
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
              © 2026 {profile.fullName} · Portofolio Teknik Instalasi Tenaga Listrik
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
          profile={profile}
          projects={projects}
          competencies={competencies}
          experiences={experiences}
          certifications={certifications}
        />

        {/* CRUD Editor Modals for Owner */}
        <ProjectEditorModal
          isOpen={projectEditorOpen}
          initialProject={editingProject}
          nextSortOrder={projects.length + 1}
          onClose={() => {
            setProjectEditorOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
        />

        <CompetencyEditorModal
          isOpen={compEditorOpen}
          initialItem={editingComp}
          nextSortOrder={competencies.length + 1}
          onClose={() => {
            setCompEditorOpen(false);
            setEditingComp(null);
          }}
          onSave={handleSaveCompetency}
        />

        <ExperienceEditorModal
          isOpen={expEditorOpen}
          initialItem={editingExp}
          nextSortOrder={experiences.length + 1}
          onClose={() => {
            setExpEditorOpen(false);
            setEditingExp(null);
          }}
          onSave={handleSaveExperience}
        />

        <CertificationEditorModal
          isOpen={certEditorOpen}
          initialItem={editingCert}
          nextSortOrder={certifications.length + 1}
          onClose={() => {
            setCertEditorOpen(false);
            setEditingCert(null);
          }}
          onSave={handleSaveCertification}
        />

        <ProfileEditorModal
          isOpen={profileEditorOpen}
          profile={profile}
          onClose={() => setProfileEditorOpen(false)}
          onSave={handleSaveProfile}
        />
      </div>
    </MotionConfig>
  );
}
