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
  imageAlt: string;
  summary: string;
  challenge: string;
  solution: string;
  standardRef: string;
  role: string;
  components: string[];
  specs: TechnicalSpec[];
}

export interface CompetencyItem {
  number: string;
  title: string;
  description: string;
  tools: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  organization: string;
  location: string;
  highlights: string[];
}

export interface CertificationItem {
  year: string;
  name: string;
  issuer: string;
  credentialCode: string;
  scope: string;
}

export const STUDENT_PROFILE = {
  fullName: 'Nadia Kusuma Putri',
  shortBrand: 'Nadia Kusuma',
  program: 'Teknik Instalasi Tenaga Listrik (TITL)',
  school: 'SMKN 2 Bandung · Angkatan 2026',
  location: 'Bandung, Jawa Barat',
  email: 'nadia.kusuma.titl@example.id',
  phone: '+62 812-3456-7890',
  heroImage: '/src/assets/images/hero_electrical_student_1794890035668.jpg',
  heroImageAlt:
    'Nadia Kusuma mengenakan kacamata pelindung dan seragam kerja teknik listrik sedang menguji panel distribusi 3-fasa menggunakan tang ampere digital di laboratorium',
  headline: 'Merancang Sistem Kelistrikan yang Aman, Presisi, dan Terukur.',
  lead:
    'Siswa tingkat akhir Teknik Instalasi Tenaga Listrik dengan fokus pada perakitan Panel Hubung Bagi 3-fasa, pemrograman PLC industri, integrasi PLTS atap, serta pengujian proteksi berbasis PUIL 2011.',
  availability: 'Terbuka untuk Rekrutmen Teknisi Listrik, Magang Lanjutan, dan Asisten Engineer DUDI',
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
    image: '/src/assets/images/project_panel_phb_1794890036081.jpg',
    imageAlt:
      'Interior panel distribusi utama 3-fasa dengan susunan busbar tembaga presisi, pemutus tenaga MCCB, MCB cabang, dan meter daya digital',
    summary:
      'Perancangan tata letak, pembengkokan busbar tembaga, pengawatan sistem kendali, dan komisioning panel distribusi utama untuk beban bengkel pemesinan berkapasitas 35 kVA.',
    challenge:
      'Memastikan pembagian beban antar fasa R, S, dan T tetap seimbang (ketidakseimbangan < 5%) serta menjaga jarak bebas isolasi antar busbar sesuai standar keselamatan kerja.',
    solution:
      'Menerapkan skema warna kabel SNI terbaru (cokelat, hitam, abu-abu, biru, kuning-hijau), pemasangan power quality meter digital untuk pemantauan THD serta faktor daya real-time, dan penomoran ferul pada setiap terminal.',
    standardRef: 'PUIL 2011 / SNI 0225 & IEC 61439',
    role: 'Perancang Single Line Diagram, Perakit Busbar & Penguji Komisioning',
    components: [
      'MCCB Utama 3-Pole 63A (18 kA)',
      'Digital Power Meter 3-Fasa (V, A, kW, cos φ, THD)',
      'Busbar Tembaga Elektrolitik 20×5 mm',
      'MCB Cabang Kurva C (10A, 16A, 25A) & RCCB 30 mA',
      'Surge Protection Device (SPD) Tipe 2',
    ],
    specs: [
      { label: 'Tegangan Nominal', value: '400 V L-L / 230 V L-N' },
      { label: 'Kapasitas Arus Panel', value: '63 A (35,2 kVA)' },
      { label: 'Tahanan Isolasi Fasa-PE', value: '> 550 MΩ @ 500 VDC' },
      { label: 'Faktor Daya Terukur', value: '0,94 (Cos φ)' },
      { label: 'THD Tegangan', value: '1,2 %' },
      { label: 'Status Uji Beban', value: 'Lulus (2 Jam Beban Penuh)' },
    ],
  },
  {
    id: 'otomasi-plc-star-delta',
    title: 'Sistem Kendali Motor Induksi 3-Fasa Star-Delta Otomatis Berbasis PLC',
    category: 'Otomasi PLC',
    year: '2025',
    systemSpec: 'PLC S7-1200 · 5,5 kW Motor',
    image: '/src/assets/images/project_plc_motor_1794890036957.jpg',
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
  },
  {
    id: 'plts-atap-on-grid',
    title: 'Simulasi & Instalasi PLTS Atap Hibrida 3,3 kWp untuk Gedung Laboratorium',
    category: 'Energi Terbarukan',
    year: '2025',
    systemSpec: '3,3 kWp · DC 48V / AC 230V',
    image: '/src/assets/images/project_solar_plts_1794890036712.jpg',
    imageAlt:
      'Susunan panel surya monokristalin di atap gedung bersama inverter dan kotak penggabung DC terpasang rapi di dinding',
    summary:
      'Perencanaan kapasitas, pemasangan string panel surya monokristalin, kotak proteksi DC Combiner, hingga sinkronisasi inverter hibrida untuk suplai penerangan ruang praktik.',
    challenge:
      'Mengantisipasi penurunan tegangan DC pada jalur kabel atap ke ruang panel serta melindungi inverter dari sambaran petir tidak langsung di musim hujan.',
    solution:
      'Menghitung luas penampang kabel PV 6 mm² (rugi tegangan < 1,5%), memasang DC Surge Arrester 1000 VDC serta sekering gPV pada setiap string di dalam DC Combiner Box tahan cuaca IP65.',
    standardRef: 'SNI IEC 62548 & Permen ESDM PLTS Atap',
    role: 'Anggota Tim Instalasi Array, Proteksi DC & Pengujian Voc/Isc',
    components: [
      '6× Modul Surya Monokristalin 550 Wp',
      'Inverter Hibrida 5 kVA MPPT',
      'DC Combiner Box (MCB DC 16A, Fuse gPV, SPD DC)',
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
  },
  {
    id: 'audit-pembumian-isolasi',
    title: 'Audit Tahanan Pembumian & Isolasi Jaringan Bengkel Tegangan Rendah',
    category: 'Proteksi & Uji',
    year: '2026',
    systemSpec: 'Megger 500V · Metode 3-Titik',
    image: '/src/assets/images/project_grounding_test_1794890037094.jpg',
    imageAlt:
      'Alat ukur digital tahanan pembumian Megger terhubung ke busbar grounding tembaga di ruang panel listrik',
    summary:
      'Pengujian berkala tahanan elektroda pembumian sistem TN-S dan tahanan isolasi penghantar antar panel guna mencegah bahaya tegangan sentuh tidak langsung.',
    challenge:
      'Mengidentifikasi penyebab nilai resistansi tanah yang sempat naik di atas 6 Ω pada area tanah berpasir selama musim kemarau.',
    solution:
      'Melakukan pengukuran metode jatuh potensial 3-titik, merekomendasikan penambahan batang elektroda paralel dengan jarak 2× panjang elektroda dan bahan pembenah tanah bentonit sehingga resistansi turun ke 1,82 Ω.',
    standardRef: 'PUIL 2011 Bagian 5-54 (Pembumian) & IEEE Std 81',
    role: 'Teknisi Pengujian Alat Ukur Presisi & Penyusun Laporan Audit K3',
    components: [
      'Digital Earth Resistance Tester 3-Pole',
      'Insulation Tester 500V / 1000V DC',
      'Busbar Tembaga PE Utama 30×5 mm',
      'Batang Elektroda Copper-Bonded 5/8" (2,4 m)',
      'Kabel Penghantar PE NYA 16 mm² Kuning-Hijau',
    ],
    specs: [
      { label: 'Resistansi Awal', value: '6,45 Ω (Tidak Memenuhi)' },
      { label: 'Resistansi Akhir', value: '1,82 Ω (Lulus < 5 Ω)' },
      { label: 'Tahanan Isolasi L-N', value: '999 MΩ @ 500 VDC' },
      { label: 'Tahanan Isolasi L-PE', value: '842 MΩ @ 500 VDC' },
      { label: 'Waktu Trip RCCB 30 mA', value: '24 ms' },
    ],
  },
];

export const COMPETENCIES: CompetencyItem[] = [
  {
    number: '01.',
    title: 'Instalasi Tenaga & Panel Distribusi (PHB)',
    description:
      'Membaca dan menggambar Single Line Diagram serta Wiring Diagram, menghitung kebutuhan KHA kabel, pembagian beban 3-fasa seimbang, hingga perakitan busbar dan pemutus tenaga MCCB/MCB sesuai PUIL 2011.',
    tools: 'AutoCAD Electrical · EPLAN · Crimping Hidrolik · Tang Ampere True-RMS',
  },
  {
    number: '02.',
    title: 'Otomasi Industri & Kendali Motor Listrik',
    description:
      'Merancang rangkaian kontrol elektromagnetik (DOL, Forward-Reverse, Star-Delta, Berurutan) serta memprogram PLC menggunakan Ladder Diagram untuk kendali motor industri dan sensor lapangan.',
    tools: 'TIA Portal · CX-Programmer · EKTS Simulator · Kontaktor & TOR',
  },
  {
    number: '03.',
    title: 'Sistem Proteksi, Pembumian & Keselamatan K3',
    description:
      'Melaksanakan inspeksi kelayakan operasi instalasi menggunakan Insulation Tester (Megger), Earth Ground Tester, dan Phase Sequence Indicator dengan prosedur Lockout-Tagout (LOTO).',
    tools: 'Digital Earth Tester · Insulation Tester · RCD Tester · Prosedur LOTO',
  },
  {
    number: '04.',
    title: 'Energi Terbarukan & Audit Efisiensi Daya',
    description:
      'Menghitung sizing array PLTS atap, proteksi sisi DC dan AC, komisioning inverter hibrida, serta analisis faktor daya dan perbaikan cos φ menggunakan kapasitor bank.',
    tools: 'PVsyst Dasar · Power Quality Analyzer · DC Clamp Meter · Kalkulasi Cos φ',
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    period: 'Juli – Desember 2025',
    role: 'Siswa Praktik Kerja Lapangan (Divisi Pemeliharaan Distribusi)',
    organization: 'PT PLN (Persero) UP3 Bandung — Unit Layanan Pelanggan',
    location: 'Bandung, Jawa Barat',
    highlights: [
      'Mendampingi tim inspeksi gardu distribusi 20 kV / 380 V dalam pengukuran beban puncak malam dan penyeimbangan beban fasa R-S-T pada 14 gardu portal.',
      'Membantu pencatatan dan pemeriksaan tahanan pembumian PHB-TR menggunakan Earth Clamp Tester dengan akurasi pelaporan harian.',
      'Menyusun rekapitulasi dokumentasi teknis pemeliharaan panel LV (Low Voltage) yang mempercepat pelacakan riwayat perbaikan sebesar 25% di tim unit.',
    ],
  },
  {
    period: 'Januari 2025 – Sekarang',
    role: 'Koordinator Asisten Laboratorium Instalasi Tenaga',
    organization: 'Bengkel Teknik Ketenagalistrikan SMKN 2 Bandung',
    location: 'Bandung, Jawa Barat',
    highlights: [
      'Menyiapkan 16 unit trainer kontrol motor dan memeriksa kelayakan alat ukur sebelum sesi praktikum siswa kelas XI.',
      'Memandu pelaksanaan prosedur K3 listrik dan verifikasi rangkaian kontrol sebelum penyambungan ke sumber tegangan 3-fasa.',
    ],
  },
];

export const TESTIMONIAL = {
  quote:
    'Selama enam bulan praktik lapangan, Nadia menunjukkan ketelitian tinggi dalam membaca diagram pengawatan serta disiplin ketat terhadap prosedur keselamatan K3 dan LOTO. Catatan pengukuran beban gardu yang disusunnya langsung membantu tim kami menstabilkan ketidakseimbangan fasa di tiga penyulang.',
  author: 'Ir. Hendra Wijaya, S.T.',
  role: 'Supervisor Pemeliharaan Jaringan Distribusi',
  organization: 'PT PLN (Persero) UP3 Bandung',
};

export const CERTIFICATIONS: CertificationItem[] = [
  {
    year: '2026',
    name: 'Sertifikat Kompetensi Klaster Pemasangan Instalasi Tenaga Listrik Bangunan Industri',
    issuer: 'BNSP — LSP P1 Teknik Ketenagalistrikan',
    credentialCode: 'REG. TITL-2026-0418',
    scope: 'Pengawatan PHB 3-Fasa, Kendali Motor & Pengujian Tahanan Isolasi',
  },
  {
    year: '2025',
    name: 'Juara 2 Lomba Kompetensi Siswa (LKS) Bidang Electrical Installation',
    issuer: 'Dinas Pendidikan Provinsi Jawa Barat',
    credentialCode: 'LKS-JABAR-EL-2025',
    scope: 'Instalasi Sistem Smart Building KNX & Panel Distribusi Presisi',
  },
  {
    year: '2025',
    name: 'Sertifikat Keselamatan dan Kesehatan Kerja (K3) Bidang Listrik Dasar',
    issuer: 'Balai K3 Bandung & Praktisi Industri',
    credentialCode: 'K3L-BDG-2025-119',
    scope: 'Identifikasi Bahaya Busur Listrik, APD Tegangan Rendah & LOTO',
  },
  {
    year: '2024',
    name: 'Pelatihan Dasar Pemrograman PLC Industri & Sistem SCADA',
    issuer: 'Balai Besar Pengembangan Penjaminan Mutu Pendidikan Vokasi (BBPPMPV)',
    credentialCode: 'BBP-PLC-2024-882',
    scope: 'Ladder Logic, Timer/Counter, Sequencing & Troubleshooting I/O',
  },
];
