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
  Star
} from 'lucide-react';

const Guide: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('getting-started');

  const quickLinks = [
    { id: 'getting-started', label: 'Panduan Memulai', icon: BookOpen },
    { id: 'documents', label: 'Persiapan Dokumen', icon: FileText },
    { id: 'application', label: 'Proses Permohonan', icon: Shield },
    { id: 'verification', label: 'Verifikasi & Audit', icon: CheckCircle },
    { id: 'certificate', label: 'Penerbitan Sertifikat', icon: Star },
    { id: 'faq', label: 'FAQ', icon: Info },
    { id: 'contact', label: 'Kontak', icon: Phone },
  ];

  const guideSteps = [
    {
      step: 1,
      title: 'Registrasi Akun',
      description: 'Daftar akun baru dengan email perusahaan yang valid',
      status: 'completed',
      details: [
        'Klik "Daftar" pada halaman login',
        'Isi data pribadi dan perusahaan',
        'Verifikasi email yang dikirim ke kotak masuk',
        'Login dengan akun yang telah diverifikasi'
      ]
    },
    {
      step: 2,
      title: 'Melengkapi Dokumen Registrasi',
      description: 'Upload dokumen perusahaan yang diperlukan',
      status: 'current',
      details: [
        'Akses menu "Dokumen Registrasi"',
        'Lengkapi informasi perusahaan',
        'Upload semua dokumen yang diperlukan',
        'Tunggu verifikasi dari admin'
      ]
    },
    {
      step: 3,
      title: 'Mengajukan Permohonan SBU',
      description: 'Buat permohonan sertifikat badan usaha',
      status: 'pending',
      details: [
        'Pilih jenis permohonan (Baru/Perpanjangan)',
        'Tentukan klasifikasi dan kualifikasi',
        'Upload dokumen pendukung',
        'Submit permohonan untuk review'
      ]
    },
    {
      step: 4,
      title: 'Proses Verifikasi',
      description: 'Admin melakukan verifikasi dokumen dan audit',
      status: 'pending',
      details: [
        'Tim verifikasi memeriksa kelengkapan dokumen',
        'Proses audit lapangan (jika diperlukan)',
        'Evaluasi kesesuaian dengan standar SBU',
        'Pembahasan hasil verifikasi'
      ]
    },
    {
      step: 5,
      title: 'Penerbitan Sertifikat',
      description: 'Sertifikat SBU diterbitkan dan dapat diunduh',
      status: 'pending',
      details: [
        'Sertifikat diterbitkan setelah lolos verifikasi',
        'Notifikasi email dikirim ke pemohon',
        'Download sertifikat melalui portal',
        'Sertifikat berlaku sesuai klasifikasi'
      ]
    }
  ];

  const requiredDocuments = [
    {
      category: 'Dokumen Perusahaan',
      items: [
        { name: 'KTA Kadin Terakhir', format: 'PDF/JPG', required: true, description: 'Kartu Tanda Anggota Kadin yang masih berlaku' },
        { name: 'NIB (Nomor Induk Berusaha)', format: 'PDF/JPG', required: true, description: 'Nomor Induk Berusaha dari OSS' },
        { name: 'Akta Pendirian Perusahaan', format: 'PDF', required: true, description: 'Akta pendirian yang telah disahkan Kemenkumham' },
        { name: 'Akta Perubahan (Jika Ada)', format: 'PDF', required: false, description: 'Akta perubahan terakhir perusahaan' },
        { name: 'NPWP Perusahaan', format: 'PDF/JPG', required: true, description: 'Nomor Pokok Wajib Pajak perusahaan' },
        { name: 'SK Kemenkumham', format: 'PDF', required: true, description: 'Surat Keputusan pengesahan dari Kemenkumham' },
      ]
    },
    {
      category: 'Dokumen Pimpinan',
      items: [
        { name: 'KTP Pimpinan', format: 'PDF/JPG', required: true, description: 'Kartu Tanda Penduduk pimpinan perusahaan' },
        { name: 'NPWP Pimpinan', format: 'PDF/JPG', required: true, description: 'NPWP pribadi pimpinan perusahaan' },
        { name: 'Pasfoto Pimpinan', format: 'JPG/PNG', required: true, description: 'Foto formal terbaru ukuran 4x6 cm' },
      ]
    },
    {
      category: 'Dokumen Pendukung SBU',
      items: [
        { name: 'Laporan Keuangan 2 Tahun Terakhir', format: 'PDF', required: true, description: 'Laporan keuangan yang telah diaudit' },
        { name: 'Daftar Peralatan Utama', format: 'PDF/Excel', required: true, description: 'Inventaris peralatan dan mesin produksi' },
        { name: 'Sertifikat Tenaga Ahli', format: 'PDF', required: true, description: 'Sertifikat keahlian tenaga ahli perusahaan' },
        { name: 'Pengalaman Kerja/Proyek', format: 'PDF', required: true, description: 'Portofolio pengalaman kerja relevan' },
        { name: 'Surat Domisili Perusahaan', format: 'PDF', required: false, description: 'Surat keterangan domisili dari kelurahan' },
      ]
    }
  ];

  const certificateTypes = [
    {
      type: 'Kecil',
      description: 'Untuk perusahaan dengan kekayaan bersih maksimal Rp 1 miliar',
      requirements: ['Modal minimal Rp 200 juta', 'Tenaga ahli minimal 1 orang', 'Pengalaman kerja minimal 2 tahun'],
      validPeriod: '3 tahun'
    },
    {
      type: 'Menengah', 
      description: 'Untuk perusahaan dengan kekayaan bersih Rp 1-10 miliar',
      requirements: ['Modal minimal Rp 1 miliar', 'Tenaga ahli minimal 2 orang', 'Pengalaman kerja minimal 5 tahun'],
      validPeriod: '3 tahun'
    },
    {
      type: 'Besar',
      description: 'Untuk perusahaan dengan kekayaan bersih di atas Rp 10 miliar',
      requirements: ['Modal minimal Rp 10 miliar', 'Tenaga ahli minimal 3 orang', 'Pengalaman kerja minimal 7 tahun'],
      validPeriod: '3 tahun'
    }
  ];

  const faqData = [
    {
      question: 'Apa itu Sertifikat Badan Usaha (SBU)?',
      answer: 'SBU adalah sertifikat yang diterbitkan untuk menunjukkan bahwa suatu badan usaha memiliki kompetensi tertentu dalam melaksanakan pekerjaan konstruksi. SBU merupakan syarat wajib untuk mengikuti tender pekerjaan konstruksi pemerintah.'
    },
    {
      question: 'Berapa lama proses penerbitan SBU?',
      answer: 'Proses penerbitan SBU memakan waktu 14-21 hari kerja setelah dokumen lengkap diserahkan. Waktu dapat bervariasi tergantung kelengkapan dokumen dan hasil verifikasi lapangan.'
    },
    {
      question: 'Apakah SBU perlu diperpanjang?',
      answer: 'Ya, SBU memiliki masa berlaku 3 tahun dan harus diperpanjang sebelum masa berlaku habis. Perpanjangan dapat dilakukan 3 bulan sebelum masa berlaku berakhir.'
    },
    {
      question: 'Apa yang terjadi jika dokumen tidak lengkap?',
      answer: 'Jika dokumen tidak lengkap, permohonan akan dikembalikan dengan catatan dokumen yang kurang. Pemohon harus melengkapi dokumen yang diminta sebelum proses dapat dilanjutkan.'
    },
    {
      question: 'Berapa biaya pengurusan SBU?',
      answer: 'Biaya pengurusan SBU bervariasi tergantung jenis dan tingkat kualifikasi yang dimohon. Detail biaya akan diberikan setelah permohonan disubmit dan diverifikasi.'
    },
    {
      question: 'Apakah bisa mengajukan lebih dari satu klasifikasi?',
      answer: 'Ya, perusahaan dapat mengajukan beberapa klasifikasi SBU sekaligus selama memenuhi persyaratan untuk masing-masing klasifikasi yang dimohon.'
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'current':
        return <Clock className="w-6 h-6 text-warning" />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Panduan Portal SBU</h1>
          <p className="text-muted-foreground">
            Panduan lengkap untuk menggunakan Portal Sertifikasi Badan Usaha Kadin Indonesia.
          </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {quickLinks.map((link) => (
          <Button
            key={link.id}
            variant={selectedTopic === link.id ? "default" : "outline"}
            onClick={() => setSelectedTopic(link.id)}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <link.icon className="w-5 h-5" />
            <span className="text-xs text-center">{link.label}</span>
          </Button>
        ))}
      </div>

      <Tabs value={selectedTopic} onValueChange={setSelectedTopic} className="space-y-6">
        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Panduan Memulai
              </CardTitle>
              <CardDescription>
                Langkah-langkah untuk memulai proses permohonan SBU
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {guideSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step.status)}
                    {index < guideSteps.length - 1 && (
                      <div className="w-px h-12 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Langkah {step.step}</Badge>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                    <div className="space-y-1">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
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
              Pastikan semua dokumen dalam format yang benar dan ukuran maksimal 5MB per file.
            </AlertDescription>
          </Alert>

          {requiredDocuments.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((doc, docIndex) => (
                    <div key={docIndex} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{doc.name}</h4>
                            {doc.required ? (
                              <Badge variant="destructive" className="text-xs">Wajib</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Opsional</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                          <Badge variant="outline" className="text-xs">Format: {doc.format}</Badge>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Proses Permohonan SBU
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {certificateTypes.map((cert, index) => (
                  <Card key={index} className="border-2 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Kualifikasi {cert.type}</CardTitle>
                      <CardDescription>{cert.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Persyaratan:</h4>
                        <ul className="space-y-1">
                          {cert.requirements.map((req, reqIndex) => (
                            <li key={reqIndex} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-3 h-3 text-success" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-sm font-medium">Masa Berlaku: {cert.validPeriod}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Process */}
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                Proses Verifikasi & Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Tahap Verifikasi Dokumen</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">Pengecekan kelengkapan dokumen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">Validasi keaslian dokumen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">Verifikasi data perusahaan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">Penilaian kualifikasi</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Audit Lapangan (Jika Diperlukan)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full" />
                      <span className="text-sm">Kunjungan ke lokasi perusahaan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full" />
                      <span className="text-sm">Verifikasi peralatan dan SDM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full" />
                      <span className="text-sm">Wawancara dengan pimpinan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full" />
                      <span className="text-sm">Pembuatan berita acara audit</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificate Information */}
        <TabsContent value="certificate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-6 h-6 text-primary" />
                Penerbitan Sertifikat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Sertifikat akan diterbitkan setelah semua proses verifikasi selesai dan dinyatakan lulus.
                </AlertDescription>
              </Alert>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Informasi Sertifikat</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Format:</span>
                      <p className="text-sm text-muted-foreground">Sertifikat digital dalam format PDF</p>
                    </div>
                    <div>
                      <span className="font-medium">Masa Berlaku:</span>
                      <p className="text-sm text-muted-foreground">3 tahun dari tanggal penerbitan</p>
                    </div>
                    <div>
                      <span className="font-medium">Nomor Sertifikat:</span>
                      <p className="text-sm text-muted-foreground">Nomor unik yang dapat diverifikasi online</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Setelah Sertifikat Terbit</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-primary" />
                      <span className="text-sm">Download sertifikat dari portal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-sm">Notifikasi email dikirim otomatis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="text-sm">Sertifikat dapat diverifikasi online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Siap digunakan untuk tender</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-6 h-6 text-primary" />
                Frequently Asked Questions (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-6 h-6 text-primary" />
                  Informasi Kontak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Telepon</p>
                      <p className="text-muted-foreground">021-5734568</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">sbu@kadin.id</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-muted-foreground">www.kadin.id</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Alamat</p>
                      <p className="text-muted-foreground">
                        Menara KADIN Indonesia Lt. 26<br />
                        Jl. HR. Rasuna Said Blok X-5 Kav. 2-3<br />
                        Jakarta Selatan 12950
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jam Operasional</CardTitle>
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
                
                <Alert>
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