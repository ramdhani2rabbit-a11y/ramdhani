import heroMaleTechnicianImg from '../assets/images/hero_male_technician_1794895245140.jpg';
import projectPanelPhbImg from '../assets/images/project_panel_phb_1794890036081.jpg';
import projectPlcMotorImg from '../assets/images/project_plc_motor_1794890036957.jpg';
import projectSolarPltsImg from '../assets/images/project_solar_plts_1794890036712.jpg';
import projectGroundingTestImg from '../assets/images/project_grounding_test_1794890037094.jpg';

export type ProjectCategory =
  | 'Semua'
  | 'Panel & Distribusi'
  | 'Otomasi PLC'
  | 'Energi Terbarukan'
  | 'Proteksi & Uji';

export interface TechnicalSpec {
  label: string;
  value: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, 'Semua'>;
  year: string;
  systemSpec: string;
  featured?: boolean;
  image: string;
  imageUrl?: string;
  imageAlt: string;
  summary: string;
  challenge: string;
  solution: string;
  standardRef: string;
  role: string;
  components: string[];
  specs: TechnicalSpec[];
  sortOrder?: number;
  isPublished?: boolean;
}

export interface CompetencyItem {
  id: string;
  number: string;
  title: string;
  description: string;
  tools: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  location: string;
  highlights: string[];
  sortOrder?: number;
  isPublished?: boolean;
}

export interface CertificationItem {
  id: string;
  year: string;
  name: string;
  issuer: string;
  credentialCode: string;
  scope: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export interface ProfileData {
  fullName: string;
  shortBrand: string;
  program: string;
  school: string;
  location: string;
  email: string;
  phone: string;
  heroImage: string;
  heroImageAlt: string;
  headline: string;
  lead: string;
  availability: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  testimonialOrg: string;
}

export const DEFAULT_PROJECT_IMAGE_MAP: Record<string, string> = {
  'phb-3fasa-atelier': projectPanelPhbImg,
  'otomasi-plc-star-delta': projectPlcMotorImg,
  'plts-atap-on-grid': projectSolarPltsImg,
  'audit-pembumian-isolasi': projectGroundingTestImg,
};

export const FALLBACK_NEW_PROJECT_IMAGE = projectPanelPhbImg;

export const STUDENT_PROFILE: ProfileData = {
  fullName: 'Raka Pratama Putra',
  shortBrand: 'Raka Pratama',
  program: 'Teknik Instalasi Tenaga Listrik (TITL)',
  school: 'SMKN 2 Bandung · Angkatan 2026',
  location: 'Bandung, Jawa Barat',
  email: 'raka.pratama.titl@example.id',
  phone: '+62 812-3456-7890',
  heroImage: heroMaleTechnicianImg,
  heroImageAlt:
    'Raka Pratama mengenakan kacamata pelindung, sarung tangan isolasi, dan jaket teknisi listrik menguji panel switchgear 3-fasa menggunakan multimeter digital',
  headline: 'Merancang Sistem Listrik & Proteksi yang Tangguh dan Presisi.',
  lead:
    'Siswa dan calon teknisi muda ketenagalistrikan dengan spesialisasi perakitan Panel Hubung Bagi 3-fasa, proteksi petir & pembumian, otomasi PLC industri, serta komisioning berbasis PUIL 2011.',
  availability:
    'Siap Bergabung untuk Posisi Teknisi Listrik Industri, Panel Maker & Pemeliharaan Gardu',
  testimonialQuote:
    'Selama enam bulan praktik lapangan, Raka menunjukkan ketangguhan kerja di gardu distribusi, ketelitian dalam membaca diagram pengawatan, serta disiplin ketat terhadap prosedur K3 dan LOTO. Catatan pengukuran beban gardu dan pembumian arrester yang disusunnya langsung membantu tim kami menstabilkan tiga penyulang.',
  testimonialAuthor: 'Ir. Hendra Wijaya, S.T.',
  testimonialRole: 'Supervisor Pemeliharaan Jaringan Distribusi',
  testimonialOrg: 'PT PLN (Persero) UP3 Bandung',
};

export const HERO_METRICS = [
  {
    value: '12+',
    label: 'Panel & Rangkaian Terpasang',
    detail: 'Uji fungsi & komisioning lab',
  },
  {
    value: '1,82 Ω',
    label: 'Resistansi Pembumian Terbaik',
    detail: 'Di bawah batas maksimal 5 Ω PUIL',
  },
  {
    value: '6 Bulan',
    label: 'Praktik Kerja Lapangan',
    detail: 'Pemeliharaan distribusi 20 kV / 380 V',
  },
  {
    value: '94,5',
    label: 'Nilai Uji Kompetensi Keahlian',
    detail: 'Predikat Sangat Kompeten (BNSP)',
  },
];

export const PROJECTS: PortfolioProject[] = [
  {
    id: 'phb-3fasa-atelier',
    title: 'Perakitan & Komisioning Panel Hubung Bagi Utama (PHB) 3-Fasa 63A',
    category: 'Panel & Distribusi',
    year: '2026',
    systemSpec: '380V / 50Hz · 3-Fasa + N + PE',
    featured: true,
    image: projectPanelPhbImg,
    imageUrl: '',
    imageAlt:
      'Interior panel distribusi utama 3-fasa dengan susunan busbar tembaga presisi, pemutus tenaga MCCB, MCB cabang, dan meter daya digital',
    summary:
      'Perancangan tata letak, pembengkokan busbar tembaga, pengawatan sistem kendali, dan komisioning panel distribusi utama dengan proteksi surja petir SPD untuk beban bengkel 35 kVA.',
    challenge:
      'Memastikan pembagian beban antar fasa R, S, dan T tetap seimbang (ketidakseimbangan < 5%) serta melindungi peralatan ukur sensitif dari lonjakan tegangan transien.',
    solution:
      'Menerapkan skema warna kabel SNI terbaru, memasang Surge Protection Device (SPD) Tipe 2 pada rel utama, power quality meter digital untuk pemantauan THD real-time, serta penomoran ferul pada setiap terminal.',
    standardRef: 'PUIL 2011 / SNI 0225 & IEC 61439',
    role: 'Perancang Single Line Diagram, Perakit Busbar & Penguji Komisioning',
    components: [
      'MCCB Utama 3-Pole 63A (18 kA)',
      'Digital Power Meter 3-Fasa (V, A, kW, cos φ, THD)',
      'Busbar Tembaga Elektrolitik 20×5 mm',
      'MCB Cabang Kurva C (10A, 16A, 25A) & RCCB 30 mA',
      'Surge Protection Device (SPD) Tipe 2 — 40 kA',
    ],
    specs: [
      { label: 'Tegangan Nominal', value: '400 V L-L / 230 V L-N' },
      { label: 'Kapasitas Arus Panel', value: '63 A (35,2 kVA)' },
      { label: 'Tahanan Isolasi Fasa-PE', value: '> 550 MΩ @ 500 VDC' },
      { label: 'Faktor Daya Terukur', value: '0,94 (Cos φ)' },
      { label: 'THD Tegangan', value: '1,2 %' },
      { label: 'Status Uji Beban', value: 'Lulus (2 Jam Beban Penuh)' },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'otomasi-plc-star-delta',
    title: 'Sistem Kendali Motor Induksi 3-Fasa Star-Delta Otomatis Berbasis PLC',
    category: 'Otomasi PLC',
    year: '2025',
    systemSpec: 'PLC S7-1200 · 5,5 kW Motor',
    featured: false,
    image: projectPlcMotorImg,
    imageUrl: '',
    imageAlt:
      'Meja latih otomasi industri berisi PLC Siemens, kontaktor magnetik, relai beban lebih termal, dan motor induksi 3-fasa',
    summary:
      'Implementasi logika ladder PLC untuk pengasutan lembut motor induksi 3-fasa metode Star-Delta otomatis dengan proteksi interlock perangkat keras dan perangkat lunak.',
    challenge:
      'Menekan lonjakan arus start motor pompa bengkel hingga 33% dari metode Direct-On-Line (DOL) serta mencegah hubung singkat antar kontaktor Star dan Delta saat transisi.',
    solution:
      'Merancang interlock ganda (kontak bantu NC kontaktor serta jeda waktu 80 ms pada program PLC), dilengkapi indikator gangguan Thermal Overload Relay (TOR) dan tombol Emergency Stop NC terkunci.',
    standardRef: 'IEC 60947-4-1 & Standar Pengawatan Kontrol 24 VDC',
    role: 'Programmer Ladder Diagram & Teknisi Wiring Panel Kontrol',
    components: [
      'PLC Compact CPU 1214C AC/DC/Rly',
      '3× Kontaktor Magnetik 25A (Main, Delta, Star)',
      'Thermal Overload Relay (Setting 9,5 A)',
      'Power Supply 24 VDC 5A & Pilot Lamp LED',
      'Motor Induksi 3-Fasa 5,5 kW / 1450 RPM',
    ],
    specs: [
      { label: 'Arus Start (Star)', value: '14,2 A (Tereduksi 65%)' },
      { label: 'Arus Nominal (Delta)', value: '10,8 A @ 380 V' },
      { label: 'Waktu Transisi Star-Delta', value: '4,5 Detik + 80 ms Jeda' },
      { label: 'Tegangan Kontrol', value: '24 VDC Terisolasi' },
      { label: 'Respon Emergency Stop', value: '< 15 ms Cut-off' },
    ],
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 'plts-atap-on-grid',
    title: 'Simulasi & Instalasi PLTS Atap Hibrida 3,3 kWp untuk Gedung Laboratorium',
    category: 'Energi Terbarukan',
    year: '2025',
    systemSpec: '3,3 kWp · DC 48V / AC 230V',
    featured: false,
    image: projectSolarPltsImg,
    imageUrl: '',
    imageAlt:
      'Susunan panel surya monokristalin di atap gedung bersama inverter dan kotak penggabung DC terpasang rapi di dinding',
    summary:
      'Perencanaan kapasitas, pemasangan string panel surya monokristalin, kotak proteksi DC Combiner dengan arrester petir, hingga sinkronisasi inverter hibrida.',
    challenge:
      'Mengantisipasi penurunan tegangan DC pada jalur kabel atap ke ruang panel serta melindungi inverter dari induksi sambaran petir tidak langsung di area terbuka.',
    solution:
      'Menghitung luas penampang kabel PV 6 mm² (rugi tegangan < 1,5%), memasang DC Surge Arrester 1000 VDC serta sekering gPV pada setiap string di dalam DC Combiner Box tahan cuaca IP65.',
    standardRef: 'SNI IEC 62548 & Permen ESDM PLTS Atap',
    role: 'Teknisi Instalasi Array, Proteksi Petir DC & Pengujian Voc/Isc',
    components: [
      '6× Modul Surya Monokristalin 550 Wp',
      'Inverter Hibrida 5 kVA MPPT',
      'DC Combiner Box (MCB DC 16A, Fuse gPV, SPD DC 1000V)',
      'Kabel Solar TUV 1×6 mm² (Merah/Hitam)',
      'Konduit Baja Galvanis Tahan UV',
    ],
    specs: [
      { label: 'Kapasitas Puncak Array', value: '3.300 Wp (6 × 550 Wp)' },
      { label: 'Tegangan Rangkaian Terbuka', value: '298,4 VDC (Voc)' },
      { label: 'Produksi Energi Harian', value: '13,4 kWh / Hari Rata-rata' },
      { label: 'Efisiensi Konversi MPPT', value: '97,6 %' },
      { label: 'Rugi Tegangan Jalur DC', value: '1,18 %' },
    ],
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 'audit-pembumian-isolasi',
    title: 'Audit Pembumian, Proteksi Petir & Tahanan Isolasi Jaringan Bengkel',
    category: 'Proteksi & Uji',
    year: '2026',
    systemSpec: 'Megger 500V · Metode 3-Titik',
    featured: false,
    image: projectGroundingTestImg,
    imageUrl: '',
    imageAlt:
      'Alat ukur digital tahanan pembumian Megger terhubung ke busbar grounding tembaga di ruang panel listrik',
    summary:
      'Pengujian berkala tahanan elektroda pembumian sistem penangkal petir & sistem TN-S serta tahanan isolasi penghantar antar panel guna mencegah bahaya tegangan sentuh.',
    challenge:
      'Mengidentifikasi penyebab nilai resistansi tanah yang sempat naik di atas 6 Ω pada area tanah berpasir selama musim kemarau sehingga berisiko saat pelepasan arus gangguan petir.',
    solution:
      'Melakukan pengukuran metode jatuh potensial 3-titik, merekomendasikan penambahan batang elektroda paralel dengan jarak 2× panjang elektroda dan bahan pembenah tanah bentonit sehingga resistansi turun ke 1,82 Ω.',
    standardRef: 'PUIL 2011 Bagian 5-54, SNI 03-7015 & IEEE Std 81',
    role: 'Teknisi Pengujian Alat Ukur Presisi & Penyusun Laporan Audit K3',
    components: [
      'Digital Earth Resistance Tester 3-Pole',
      'Insulation Tester 500V / 1000V DC',
      'Busbar Tembaga PE & Arrester 30×5 mm',
      'Batang Elektroda Copper-Bonded 5/8" (2,4 m)',
      'Kabel Penghantar BC / NYA 16 mm² Kuning-Hijau',
    ],
    specs: [
      { label: 'Resistansi Awal', value: '6,45 Ω (Tidak Memenuhi)' },
      { label: 'Resistansi Akhir', value: '1,82 Ω (Lulus < 5 Ω)' },
      { label: 'Tahanan Isolasi L-N', value: '999 MΩ @ 500 VDC' },
      { label: 'Tahanan Isolasi L-PE', value: '842 MΩ @ 500 VDC' },
      { label: 'Waktu Trip RCCB 30 mA', value: '24 ms' },
    ],
    sortOrder: 4,
    isPublished: true,
  },
];

export const COMPETENCIES: CompetencyItem[] = [
  {
    id: 'comp-1',
    number: '01.',
    title: 'Instalasi Tenaga & Panel Distribusi (PHB)',
    description:
      'Membaca dan menggambar Single Line Diagram serta Wiring Diagram, menghitung kebutuhan KHA kabel, pembagian beban 3-fasa seimbang, hingga perakitan busbar dan pemutus tenaga MCCB/MCB sesuai PUIL 2011.',
    tools: 'AutoCAD Electrical · EPLAN · Crimping Hidrolik · Tang Ampere True-RMS',
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'comp-2',
    number: '02.',
    title: 'Otomasi Industri & Kendali Motor Listrik',
    description:
      'Merancang rangkaian kontrol elektromagnetik (DOL, Forward-Reverse, Star-Delta, Berurutan) serta memprogram PLC menggunakan Ladder Diagram untuk kendali motor industri dan sensor lapangan.',
    tools: 'TIA Portal · CX-Programmer · EKTS Simulator · Kontaktor & TOR',
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 'comp-3',
    number: '03.',
    title: 'Proteksi Petir, Pembumian & Keselamatan K3',
    description:
      'Melaksanakan inspeksi kelayakan operasi instalasi, pemasangan Surge Protection Device (SPD), pengujian tahanan tanah, dan isolasi penghantar dengan prosedur ketat Lockout-Tagout (LOTO).',
    tools: 'Digital Earth Tester · Megger 1000V · RCD Tester · Prosedur LOTO',
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 'comp-4',
    number: '04.',
    title: 'Energi Terbarukan & Audit Efisiensi Daya',
    description:
      'Menghitung sizing array PLTS atap, proteksi sisi DC dan AC, komisioning inverter hibrida, serta analisis faktor daya dan perbaikan cos φ menggunakan kapasitor bank.',
    tools: 'PVsyst Dasar · Power Quality Analyzer · DC Clamp Meter · Kalkulasi Cos φ',
    sortOrder: 4,
    isPublished: true,
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-1',
    period: 'Juli – Desember 2025',
    role: 'Teknisi Praktik Kerja Lapangan (Divisi Pemeliharaan Distribusi)',
    organization: 'PT PLN (Persero) UP3 Bandung — Unit Layanan Pelanggan',
    location: 'Bandung, Jawa Barat',
    highlights: [
      'Mendampingi tim inspeksi gardu distribusi 20 kV / 380 V dalam pengukuran beban puncak malam dan penyeimbangan beban fasa R-S-T pada 14 gardu portal.',
      'Melaksanakan pemeriksaan tahanan pembumian PHB-TR dan arrester gardu menggunakan Earth Clamp Tester dengan akurasi pelaporan harian.',
      'Menyusun rekapitulasi dokumentasi teknis pemeliharaan panel LV (Low Voltage) yang mempercepat pelacakan riwayat perbaikan sebesar 25% di tim unit.',
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'exp-2',
    period: 'Januari 2025 – Sekarang',
    role: 'Koordinator Asisten Laboratorium Instalasi Tenaga',
    organization: 'Bengkel Teknik Ketenagalistrikan SMKN 2 Bandung',
    location: 'Bandung, Jawa Barat',
    highlights: [
      'Menyiapkan 16 unit trainer kontrol motor dan memeriksa kelayakan alat ukur sebelum sesi praktikum siswa kelas XI.',
      'Memandu pelaksanaan prosedur K3 listrik dan verifikasi rangkaian kontrol sebelum penyambungan ke sumber tegangan 3-fasa.',
    ],
    sortOrder: 2,
    isPublished: true,
  },
];

export const CERTIFICATIONS: CertificationItem[] = [
  {
    id: 'cert-1',
    year: '2026',
    name: 'Sertifikat Kompetensi Klaster Pemasangan Instalasi Tenaga Listrik Bangunan Industri',
    issuer: 'BNSP — LSP P1 Teknik Ketenagalistrikan',
    credentialCode: 'REG. TITL-2026-0418',
    scope: 'Pengawatan PHB 3-Fasa, Kendali Motor & Pengujian Tahanan Isolasi',
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'cert-2',
    year: '2025',
    name: 'Juara 2 Lomba Kompetensi Siswa (LKS) Bidang Electrical Installation',
    issuer: 'Dinas Pendidikan Provinsi Jawa Barat',
    credentialCode: 'LKS-JABAR-EL-2025',
    scope: 'Instalasi Sistem Smart Building KNX & Panel Distribusi Presisi',
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 'cert-3',
    year: '2025',
    name: 'Sertifikat Keselamatan dan Kesehatan Kerja (K3) Bidang Listrik Dasar',
    issuer: 'Balai K3 Bandung & Praktisi Industri',
    credentialCode: 'K3L-BDG-2025-119',
    scope: 'Identifikasi Bahaya Busur Listrik, APD Tegangan Rendah & LOTO',
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 'cert-4',
    year: '2024',
    name: 'Pelatihan Dasar Pemrograman PLC Industri & Sistem SCADA',
    issuer: 'Balai Besar Pengembangan Penjaminan Mutu Pendidikan Vokasi (BBPPMPV)',
    credentialCode: 'BBP-PLC-2024-882',
    scope: 'Ladder Logic, Timer/Counter, Sequencing & Troubleshooting I/O',
    sortOrder: 4,
    isPublished: true,
  },
];
