import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Users,
  Building2,
  CreditCard,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Info,
  Star,
  Receipt // Menambahkan ikon Receipt untuk pembayaran
} from 'lucide-react';

const Guide: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('getting-started');

  const quickLinks = [
    { id: 'getting-started', label: 'Panduan Memulai', icon: BookOpen },
    { id: 'documents', label: 'Persiapan Dokumen', icon: FileText },
    { id: 'application', label: 'Proses Permohonan', icon: Shield },
    { id: 'payment', label: 'Mekanisme Pembayaran', icon: Receipt }, // FIX: Menambahkan menu pembayaran
    { id: 'verification', label: 'Verifikasi & Audit', icon: CheckCircle },
    { id: 'certificate', label: 'Penerbitan Sertifikat', icon: Star },
    { id: 'faq', label: 'FAQ', icon: Info },
    { id: 'contact', label: 'Kontak', icon: Phone },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Registrasi Akun Perusahaan',
      description: 'Daftarkan akun perusahaan Anda untuk mengakses portal.',
      status: 'completed',
      details: [
        'Klik "Daftar" di halaman login.',
        'Isi data pribadi pengguna dan data lengkap perusahaan.',
        'Verifikasi alamat email Anda melalui tautan yang dikirimkan.',
        'Lanjutkan untuk login ke portal.'
      ]
    },
    {
      step: 2,
      title: 'Lengkapi Dokumen Registrasi',
      description: 'Unggah semua dokumen legalitas perusahaan yang wajib.',
      status: 'current',
      details: [
        'Akses menu "Dokumen Registrasi" setelah berhasil login.',
        'Unggah setiap dokumen yang diminta sesuai jenisnya (contoh: Akta Pendirian, NPWP Perusahaan, KTP Pimpinan).',
        'Pastikan format file (PDF/JPG/PNG) dan ukuran file maksimal (5MB) sesuai.',
        'Dokumen Anda akan melalui proses verifikasi oleh Admin.'
      ]
    },
    {
      step: 3,
      title: 'Ajukan Permohonan Sertifikat Badan Usaha (SBU)',
      description: 'Setelah dokumen registrasi diverifikasi, Anda dapat mengajukan SBU.',
      status: 'pending',
      details: [
        'Pilih menu "Permohonan SBU" untuk memulai pengajuan baru, perpanjangan, atau peningkatan kualifikasi.',
        'Isi detail permohonan, termasuk klasifikasi dan kualifikasi yang diinginkan.',
        'Unggah dokumen pendukung spesifik untuk permohonan SBU (contoh: Neraca Tahun Terakhir, Surat Permohonan Subbidang).',
        'Submit permohonan Anda untuk proses review lebih lanjut.'
      ]
    },
    {
      step: 4,
      title: 'Lakukan Pembayaran',
      description: 'Pembayaran akan diperlukan setelah permohonan disetujui untuk diproses.',
      status: 'pending',
      details: [
        'Setelah permohonan disetujui untuk diproses, Anda akan menerima notifikasi tagihan.',
        'Akses menu "Transaksi" untuk melihat detail tagihan dan instruksi pembayaran.',
        'Lakukan pembayaran sesuai metode yang tersedia.',
        'Konfirmasi pembayaran jika diperlukan dan tunggu verifikasi pembayaran.'
      ]
    },
    {
      step: 5,
      title: 'Proses Verifikasi dan Audit Lapangan',
      description: 'Tim verifikasi akan meninjau permohonan Anda secara mendalam.',
      status: 'pending',
      details: [
        'Tim verifikasi akan memeriksa kelengkapan dan keaslian dokumen Anda.',
        'Audit lapangan mungkin dilakukan untuk verifikasi langsung data dan kondisi perusahaan.',
        'Evaluasi kesesuaian dengan standar dan regulasi SBU akan dilakukan.',
        'Anda akan diberitahu mengenai hasil verifikasi dan langkah selanjutnya.'
      ]
    },
    {
      step: 6,
      title: 'Penerbitan Sertifikat',
      description: 'Sertifikat SBU Anda akan diterbitkan setelah semua proses selesai.',
      status: 'pending',
      details: [
        'Setelah permohonan Anda dinyatakan lulus verifikasi, sertifikat akan diterbitkan.',
        'Anda akan menerima notifikasi melalui email saat sertifikat siap.',
        'Unduh sertifikat digital Anda langsung dari portal.',
        'Sertifikat ini berlaku selama 1 (satu) tahun dan dapat diperpanjang.'
      ]
    }
  ];

  const requiredDocuments = [
    {
      category: 'Dokumen Registrasi Perusahaan (Wajib di Unggah pada Menu "Dokumen Registrasi")',
      items: [
        { name: 'KTA Kadin Terakhir', format: 'PDF/JPG/PNG', required: true, description: 'Kartu Tanda Anggota Kadin yang masih berlaku.' },
        { name: 'NIB (Nomor Induk Berusaha)', format: 'PDF/JPG/PNG', required: true, description: 'Nomor Induk Berusaha yang diterbitkan melalui sistem OSS.' },
        { name: 'Akta Pendirian Perusahaan', format: 'PDF', required: true, description: 'Akta pendirian perusahaan yang telah disahkan oleh Kementerian Hukum dan HAM.' },
        { name: 'Akta Perubahan Terakhir (Jika Ada)', format: 'PDF', required: false, description: 'Akta perubahan perusahaan terakhir (jika ada perubahan dari akta pendirian).' },
        { name: 'NPWP Perusahaan', format: 'PDF/JPG/PNG', required: true, description: 'Nomor Pokok Wajib Pajak perusahaan.' },
        { name: 'SK Kemenkumham', format: 'PDF', required: true, description: 'Surat Keputusan pengesahan badan hukum dari Kementerian Hukum dan HAM.' },
        { name: 'KTP Pimpinan', format: 'PDF/JPG/PNG', required: true, description: 'Kartu Tanda Penduduk pimpinan utama perusahaan.' },
        { name: 'NPWP Pimpinan', format: 'PDF/JPG/PNG', required: true, description: 'Nomor Pokok Wajib Pajak pribadi pimpinan utama perusahaan.' },
        { name: 'Pasfoto Pimpinan', format: 'JPG/PNG', required: true, description: 'Pasfoto formal terbaru pimpinan perusahaan (latar belakang merah/biru, ukuran 4x6 cm).' },
      ]
    },
    {
      category: 'Dokumen Pendukung Permohonan SBU (Di Unggah pada Form Permohonan SBU)',
      items: [
        { name: 'File Neraca Tahun Terakhir', format: 'PDF', required: true, description: 'Laporan neraca keuangan perusahaan untuk tahun terakhir. Format dapat diunduh di portal.' },
        { name: 'Surat Permohonan Subbidang (Cap & Tanda Tangan)', format: 'PDF', required: true, description: 'Surat permohonan subbidang yang telah diisi, diberi cap perusahaan, dan ditandatangani pimpinan. Format dapat diunduh di portal.' },
        { name: 'Laporan Keuangan 2 Tahun Terakhir', format: 'PDF', required: false, description: 'Laporan keuangan yang telah diaudit oleh akuntan publik (jika diperlukan untuk kualifikasi tertentu).' },
        { name: 'Daftar Peralatan Utama', format: 'PDF/Excel', required: false, description: 'Daftar inventaris peralatan utama yang dimiliki perusahaan yang relevan dengan bidang usaha.' },
        { name: 'Sertifikat Tenaga Ahli', format: 'PDF', required: false, description: 'Sertifikat keahlian tenaga ahli yang dimiliki perusahaan (contoh: SKA, SKTK).' },
        { name: 'Portofolio Pengalaman Kerja/Proyek', format: 'PDF', required: false, description: 'Daftar proyek atau pengalaman kerja yang relevan dan telah diselesaikan perusahaan.' },
      ]
    }
  ];

  const certificateTypes = [
    {
      type: 'Kecil',
      description: 'Untuk perusahaan dengan kualifikasi aset/modal yang sesuai dengan kriteria usaha kecil.',
      requirements: ['Modal disetor minimal Rp 200 juta.', 'Memiliki tenaga ahli sesuai bidang.', 'Pengalaman kerja minimal 1 proyek relevan.'],
      validPeriod: '1 tahun', // FIX: Masa berlaku 1 tahun
      renewalPeriod: '1 tahun' // FIX: Perpanjangan 1 tahun
    },
    {
      type: 'Menengah',
      description: 'Untuk perusahaan dengan kualifikasi aset/modal yang sesuai dengan kriteria usaha menengah.',
      requirements: ['Modal disetor minimal Rp 1 miliar.', 'Memiliki tenaga ahli bersertifikat.', 'Pengalaman kerja minimal 3 proyek relevan.'],
      validPeriod: '1 tahun', // FIX: Masa berlaku 1 tahun
      renewalPeriod: '1 tahun' // FIX: Perpanjangan 1 tahun
    },
    {
      type: 'Besar',
      description: 'Untuk perusahaan dengan kualifikasi aset/modal yang sesuai dengan kriteria usaha besar.',
      requirements: ['Modal disetor minimal Rp 10 miliar.', 'Memiliki tenaga ahli profesional.', 'Pengalaman kerja minimal 5 proyek besar.'],
      validPeriod: '1 tahun', // FIX: Masa berlaku 1 tahun
      renewalPeriod: '1 tahun' // FIX: Perpanjangan 1 tahun
    }
  ];

  const paymentMechanism = {
    title: 'Langkah-Langkah Pembayaran',
    description: 'Panduan lengkap mengenai mekanisme pembayaran permohonan SBU Anda.',
    steps: [
      { title: 'Notifikasi Tagihan', detail: 'Anda akan menerima notifikasi tagihan di portal dan email setelah permohonan Anda diverifikasi dan siap untuk pembayaran.' },
      { title: 'Akses Detail Tagihan', detail: 'Klik pada notifikasi atau buka menu "Transaksi" untuk melihat detail tagihan, termasuk jumlah yang harus dibayar, nomor rekening, atau virtual account.' },
      { title: 'Pilih Metode Pembayaran', detail: 'Portal mendukung berbagai metode pembayaran, seperti transfer bank (virtual account), kartu kredit, atau e-wallet (jika tersedia).' },
      { title: 'Lakukan Pembayaran', detail: 'Ikuti instruksi pembayaran yang tertera. Pastikan Anda membayar dalam batas waktu yang ditentukan.' },
      { title: 'Verifikasi Pembayaran', detail: 'Sistem akan secara otomatis memverifikasi pembayaran Anda. Anda akan menerima notifikasi status pembayaran berhasil. Jika ada kendala, hubungi dukungan.' }
    ],
    notes: 'Pastikan untuk selalu menyimpan bukti pembayaran Anda. Semua transaksi tercatat di menu "Transaksi".'
  };

  const faqData = [
    {
      question: 'Apa itu Sertifikat Badan Usaha (SBU)?',
      answer: 'SBU adalah bukti pengakuan formal atas kompetensi dan kemampuan suatu badan usaha untuk melaksanakan pekerjaan di bidang jasa konstruksi atau bidang usaha lainnya yang relevan. SBU merupakan syarat wajib untuk mengikuti pengadaan barang/jasa pemerintah dan proyek swasta tertentu.'
    },
    {
      question: 'Berapa lama masa berlaku SBU?',
      answer: 'SBU yang diterbitkan memiliki masa berlaku **1 (satu) tahun** sejak tanggal diterbitkan. Anda perlu mengajukan perpanjangan setiap tahun untuk menjaga SBU tetap aktif.' // FIX: Masa berlaku 1 tahun
    },
    {
      question: 'Kapan dan bagaimana cara memperpanjang SBU?',
      answer: 'Anda dapat mengajukan perpanjangan SBU mulai dari **3 (tiga) bulan sebelum tanggal masa berlaku berakhir**. Proses perpanjangan dilakukan melalui portal ini dengan mengisi form perpanjangan dan mengunggah dokumen terbaru. Masa berlaku perpanjangan juga **1 (satu) tahun**.' // FIX: Perpanjangan 1 tahun
    },
    {
      question: 'Berapa lama proses penerbitan SBU?',
      answer: 'Estimasi proses penerbitan SBU adalah **7-14 hari kerja** setelah semua dokumen lengkap dan pembayaran terverifikasi. Waktu dapat bervariasi tergantung beban kerja dan hasil verifikasi lapangan.'
    },
    {
      question: 'Apa yang terjadi jika dokumen tidak lengkap atau tidak valid?',
      answer: 'Jika dokumen tidak lengkap atau tidak valid, permohonan akan dikembalikan dengan status "Ditolak" atau "Perlu Perbaikan" disertai catatan detail. Anda harus melengkapi/memperbaiki dokumen yang diminta dan mengajukan ulang.'
    },
    {
      question: 'Berapa biaya pengurusan SBU?',
      answer: 'Biaya pengurusan SBU bervariasi tergantung pada jenis klasifikasi, kualifikasi, dan subbidang yang dimohon. Detail biaya akan ditampilkan secara transparan di portal pada tahap pembayaran permohonan Anda.' // FIX: Lebih umum tentang biaya
    },
    {
      question: 'Apakah bisa mengajukan lebih dari satu klasifikasi sekaligus?',
      answer: 'Ya, perusahaan dapat mengajukan beberapa klasifikasi dan subbidang SBU sekaligus dalam satu permohonan, selama perusahaan memenuhi semua persyaratan untuk setiap klasifikasi yang dimohon.'
    },
    {
      question: 'Bagaimana jika saya lupa kata sandi akun portal?',
      answer: 'Di halaman login, klik tautan "Lupa Kata Sandi?". Anda akan diminta memasukkan email terdaftar dan ikuti instruksi untuk mengatur ulang kata sandi Anda.'
    },
    {
      question: 'Apakah ada dukungan teknis jika saya mengalami kesulitan?',
      answer: 'Tentu. Anda dapat menghubungi tim dukungan teknis kami melalui informasi kontak yang tersedia di tab "Kontak" selama jam operasional.'
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'current':
        return <Clock className="w-6 h-6 text-warning animate-pulse" />; // Tambah animasi untuk 'current'
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Panduan Portal SBU Kadin</h1>
        <p className="text-muted-foreground">
          Panduan lengkap untuk menggunakan Portal Sertifikasi Badan Usaha Kadin Indonesia secara efektif.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {quickLinks.map((link) => (
          <Button
            key={link.id}
            variant={selectedTopic === link.id ? "default" : "outline"}
            onClick={() => setSelectedTopic(link.id)}
            className="h-auto p-4 flex flex-col items-center gap-2 text-center"
          >
            <link.icon className="w-5 h-5" />
            <span className="text-xs">{link.label}</span>
          </Button>
        ))}
      </div>

      <Tabs value={selectedTopic} onValueChange={setSelectedTopic} className="space-y-6">
        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <BookOpen className="w-6 h-6" />
                Panduan Memulai: Alur Utama Penggunaan Portal
              </CardTitle>
              <CardDescription>
                Langkah-langkah terperinci untuk mendaftar, mengajukan, hingga mendapatkan SBU.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {guideSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step.status)}
                    {index < guideSteps.length - 1 && (
                      <div className="w-px h-16 bg-border mt-2" /> 
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">Langkah {step.step}</Badge>
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2"> {/* Menggunakan items-start */}
                          <ArrowRight className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Guide */}
        <TabsContent value="documents" className="space-y-6">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Pastikan semua dokumen dalam format yang benar (PDF/JPG/PNG) dan ukuran maksimal 5MB per file untuk proses yang lebih cepat.
            </AlertDescription>
          </Alert>

          {requiredDocuments.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <FileText className="w-6 h-6" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((doc, docIndex) => (
                    <div key={docIndex} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{doc.name}</h4>
                            {doc.required ? (
                              <Badge variant="destructive" className="text-xs font-semibold">Wajib</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs font-semibold">Opsional</Badge>
                            )}
                            <Badge variant="outline" className="text-xs font-medium">Format: {doc.format}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Application Process */}
        <TabsContent value="application" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="w-6 h-6" />
                Proses Permohonan SBU Berdasarkan Kualifikasi
              </CardTitle>
              <CardDescription>
                Pahami persyaratan umum untuk setiap kualifikasi SBU.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {certificateTypes.map((cert, index) => (
                  <Card key={index} className="border-2 border-primary/20 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">Kualifikasi {cert.type}</CardTitle>
                      <CardDescription>{cert.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Persyaratan Umum:</h4>
                        <ul className="space-y-1">
                          {cert.requirements.map((req, reqIndex) => (
                            <li key={reqIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-border mt-4">
                        <span className="text-sm font-medium text-foreground">Masa Berlaku: <span className="text-primary font-semibold">{cert.validPeriod}</span></span><br/>
                        <span className="text-sm font-medium text-foreground">Perpanjangan: Setiap <span className="text-primary font-semibold">{cert.renewalPeriod}</span></span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Mechanism */}
        <TabsContent value="payment" className="space-y-6">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Receipt className="w-6 h-6" />
                        {paymentMechanism.title}
                    </CardTitle>
                    <CardDescription>
                        {paymentMechanism.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {paymentMechanism.steps.map((step, index) => (
                        <div key={index} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                                    {index + 1}
                                </div>
                                {index < paymentMechanism.steps.length - 1 && (
                                    <div className="w-px h-10 bg-border mt-2" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-semibold text-foreground">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.detail}</p>
                            </div>
                        </div>
                    ))}
                    <Alert className="mt-4">
                        <Info className="w-4 h-4" />
                        <AlertDescription>
                            {paymentMechanism.notes}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Verification Process */}
        <TabsContent value="verification" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-6 h-6" />
                Proses Verifikasi & Audit Permohonan
              </CardTitle>
              <CardDescription>
                Tahapan yang akan dilalui permohonan Anda oleh tim verifikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Tahap Verifikasi Dokumen</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Pengecekan kelengkapan dan kesesuaian dokumen yang diunggah.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Validasi keaslian dokumen melalui sistem terkait.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Verifikasi data perusahaan dengan informasi di database atau instansi terkait.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Penilaian awal kualifikasi berdasarkan dokumen yang diserahkan.</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Audit Lapangan (Jika Diperlukan)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-warning rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Kunjungan ke lokasi perusahaan untuk verifikasi fisik.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-warning rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Verifikasi kondisi peralatan, kantor, dan sumber daya manusia.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-warning rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Wawancara dengan pimpinan dan staf terkait.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-warning rounded-full flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Pembuatan Berita Acara Audit sebagai laporan hasil verifikasi.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Information */}
        <TabsContent value="certificate" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Star className="w-6 h-6" />
                Penerbitan Sertifikat Badan Usaha (SBU)
              </CardTitle>
              <CardDescription>
                Detail mengenai proses penerbitan dan penggunaan SBU Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Sertifikat akan diterbitkan setelah semua proses verifikasi dan audit selesai serta permohonan dinyatakan lulus.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Informasi Penting Sertifikat</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-foreground">Format:</span>
                      <p className="text-sm text-muted-foreground">Sertifikat digital dalam format PDF yang dapat diunduh.</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Masa Berlaku:</span>
                      <p className="text-sm text-muted-foreground">SBU berlaku selama **1 (satu) tahun** dari tanggal penerbitan.</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Nomor Sertifikat:</span>
                      <p className="text-sm text-muted-foreground">Nomor unik yang dapat diverifikasi keabsahannya secara online melalui portal.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Setelah Sertifikat Terbit</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Anda dapat mengunduh sertifikat langsung dari menu "Sertifikat" di portal.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Notifikasi penerbitan sertifikat akan dikirimkan otomatis ke alamat email terdaftar Anda.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Sertifikat dapat diverifikasi keasliannya secara online melalui fitur verifikasi di website Kadin.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">SBU Anda siap digunakan untuk persyaratan tender proyek atau legalitas usaha.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Penting: Ajukan perpanjangan SBU setiap 1 tahun sekali untuk menjaga masa berlakunya.</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Info className="w-6 h-6" />
                Frequently Asked Questions (FAQ)
              </CardTitle>
              <CardDescription>
                Temukan jawaban atas pertanyaan umum seputar SBU dan penggunaan portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Phone className="w-6 h-6" />
                  Informasi Kontak Kami
                </CardTitle>
                <CardDescription>
                  Hubungi kami untuk pertanyaan atau bantuan lebih lanjut.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Telepon</p>
                      <p className="text-muted-foreground">021-5734568</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground">sbu@kadin.id</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Website</p>
                      <p className="text-muted-foreground">www.kadin.id</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Alamat Kantor</p>
                      <p className="text-sm text-muted-foreground">
                        Menara KADIN Indonesia Lt. 26<br />
                        Jl. HR. Rasuna Said Blok X-5 Kav. 2-3<br />
                        Jakarta Selatan 12950
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-foreground">Jam Operasional</CardTitle>
                <CardDescription>Waktu layanan kami.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Senin - Jumat</span>
                    <span className="font-medium">08:00 - 17:00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sabtu</span>
                    <span className="font-medium">08:00 - 12:00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minggu & Hari Libur</span>
                    <span className="text-muted-foreground">Tutup</span>
                  </div>
                </div>

                <Alert className="mt-4">
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    Untuk konsultasi lebih lanjut, silakan hubungi kami di jam operasional atau kirim email.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Guide;