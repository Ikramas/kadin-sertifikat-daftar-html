// src/pages/ApplicationDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  ArrowLeft,
  FileCheck,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { downloadAuthenticatedFile } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/useErrorHandler'; // Import useErrorHandler


interface ApplicationDetailData {
  id: string;
  application_number: string;
  code_reg: string; 
  application_number_formatted: string;
  application_type: 'new' | 'renewal' | 'upgrade';
  current_sbu_number?: string;
  requested_classification: string;
  business_field: string;
  company_qualification: 'Kecil' | 'Menengah' | 'Besar';

  akta_pendirian_notaris?: string;
  akta_pendirian_nomor?: string;
  akta_pendirian_tanggal?: string;
  akta_pendirian_tanggal_formatted?: string;
  akta_perubahan_notaris?: string;
  akta_perubahan_nomor?: string;
  akta_perubahan_tanggal?: string;
  akta_perubahan_tanggal_formatted?: string;
  sk_kemenkumham_nomor_tanggal?: string;
  nib_date?: string;
  nib_date_formatted?: string;
  sub_bidang_code?: string;
  bidang_name?: string;

  npwp_perusahaan?: string;
  npwp_pimpinan?: string;
  nib_perusahaan?: string;

  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submission_date?: string;
  submission_date_formatted?: string;
  review_date?: string;
  review_date_formatted?: string;
  completion_date?: string;
  completion_date_formatted?: string;
  notes?: string;
  company_name: string;
  reviewer_name?: string;
  created_at: string;
  created_at_formatted: string;
  updated_at: string;
}

interface DocumentData {
  id: string;
  original_name: string;
  file_name: string;
  document_type: string;
  status: string;
  file_url?: string;
}

const ApplicationDetail: React.FC = () => {
  const { code_reg } = useParams<{ code_reg: string }>();
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler(); // Gunakan useErrorHandler
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetailData | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicationDetail = async () => {
    if (!code_reg) {
      setError("Kode registrasi permohonan tidak ditemukan di URL. Mohon kembali ke daftar permohonan.");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`/backend/api/applications/get_detail.php?code_reg=${code_reg}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        setApplication(result.data.application);
        setDocuments(result.data.documents || []);
        handleSuccess('Detail permohonan berhasil dimuat.', 'Data Diperbarui'); // Feedback sukses
      } else {
        throw new Error(result.message || 'Gagal memuat detail permohonan');
      }
    } catch (err: any) {
      console.error('Error fetching application detail:', err);
      setError(handleError(err, 'application_detail_fetch').message); // Gunakan handleError
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isDocumentVerified) {
        fetchApplicationDetail();
    }
  }, [code_reg, isDocumentVerified]); // Hapus toast dari dependensi karena handleError sudah menggunakannya

  const handleSubmitApplication = async () => {
    if (!application?.id) {
        handleError(new Error('ID permohonan tidak ditemukan. Mohon coba muat ulang halaman.'), 'application_submission_missing_id');
        return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan. Mohon refresh halaman.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const response = await fetch('/backend/api/applications/submit.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ application_id: application.id, csrf_token: csrfToken }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        handleSuccess(result.message || 'Permohonan Anda berhasil disubmit dan sedang dalam proses review.', 'Permohonan Berhasil Disubmit');
        fetchApplicationDetail(); 
      } else {
        handleError(new Error(result.message), 'application_submission');
      }
    } catch (err: any) {
      handleError(err, 'application_submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDocument = async (fileUrl: string, originalName: string) => {
    try {
      await downloadAuthenticatedFile(fileUrl, originalName);
      handleSuccess(`Dokumen '${originalName}' berhasil diunduh.`, 'Unduh Berhasil');
    } catch (error: any) {
      handleError(error, 'document_download', { fileUrl, originalName });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText, className: '' },
      submitted: { label: 'Disubmit', variant: 'outline' as const, icon: Clock, className: '' },
      under_review: { label: 'Dalam Review', variant: 'default' as const, icon: AlertTriangle, className: '' },
      approved: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle, className: '' },
      completed: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getApplicationTypeLabel = (type: string) => {
    const types = {
      new: 'Permohonan Baru',
      renewal: 'Perpanjangan',
      upgrade: 'Peningkatan',
    };
    return types[type as keyof typeof types] || type;
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary">Terunggah</Badge>;
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">Tidak Diketahui</Badge>;
    }
  };

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda belum dapat melihat detail permohonan. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link to="/applications">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Permohonan
            </Button>
          </Link>
          <Button onClick={fetchApplicationDetail} className="ml-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Detail permohonan tidak ditemukan. Data mungkin telah dihapus atau ID tidak valid.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link to="/applications">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Permohonan
            </Button>
          </Link>
          <Button onClick={fetchApplicationDetail} className="ml-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Detail Permohonan</h1>
          <p className="text-muted-foreground">
            Lihat detail lengkap dan status permohonan SBU Anda.
          </p>
        </div>
        <Link to="/applications">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Ringkasan Permohonan */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl">
                  {application.application_number_formatted}
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div>{getApplicationTypeLabel(application.application_type)}</div>
                  <div className="text-sm text-muted-foreground">
                    Dibuat: {application.created_at_formatted}
                  </div>
                </CardDescription>
              </div>
              {getStatusBadge(application.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Perusahaan:</p>
                <p className="text-muted-foreground">{application.company_name}</p>
              </div>
              <div>
                <p className="font-medium">Klasifikasi Dimohon:</p>
                <p className="text-muted-foreground">{application.requested_classification}</p>
              </div>
              <div>
                <p className="font-medium">Bidang Usaha:</p>
                <p className="text-muted-foreground">{application.business_field}</p>
              </div>
              <div>
                <p className="font-medium">Kode Subbidang:</p>
                <p className="text-muted-foreground">{application.sub_bidang_code || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Nama Bidang:</p>
                <p className="text-muted-foreground">{application.bidang_name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Kualifikasi Perusahaan:</p>
                <p className="text-muted-foreground">{application.company_qualification}</p>
              </div>
              {application.current_sbu_number && (
                <div>
                  <p className="font-medium">Nomor SBU Saat Ini:</p>
                  <p className="text-muted-foreground">{application.current_sbu_number}</p>
                </div>
              )}
            </div>

            {application.notes && (
              <div className="border-t pt-4">
                <p className="font-medium mb-1">Catatan:</p>
                <p className="text-muted-foreground text-sm">{application.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status dan Tanggal Proses */}
        <Card>
          <CardHeader>
            <CardTitle>Linimasa Proses</CardTitle>
            <CardDescription>Perkembangan permohonan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Dibuat:</p>
                <p className="text-muted-foreground">{application.created_at_formatted}</p>
              </div>
            </div>
            {application.submission_date_formatted && (
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Disubmit:</p>
                  <p className="text-muted-foreground">{application.submission_date_formatted}</p>
                </div>
              </div>
            )}
            {application.review_date_formatted && (
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Direview oleh:</p>
                  <p className="text-muted-foreground">{application.reviewer_name || 'Admin Sistem'}</p>
                  <p className="text-muted-foreground">{application.review_date_formatted}</p>
                </div>
              </div>
            )}
            {application.completion_date_formatted && (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium">Selesai pada:</p>
                  <p className="text-muted-foreground">{application.completion_date_formatted}</p>
                </div>
              </div>
            )}
            {['rejected', 'suspended'].includes(application.status) && (
                 <div className="flex items-center gap-3 text-destructive">
                    <XCircle className="w-5 h-5" />
                    <div>
                        <p className="font-medium">Status Akhir:</p>
                        <p className="text-muted-foreground">{application.status === 'rejected' ? 'Ditolak' : 'Dibekukan'}</p>
                        <p className="text-muted-foreground">Catatan tambahan: {application.notes || 'Tidak ada catatan.'}</p>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Informasi Legalitas dan Perusahaan */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Legalitas & Perusahaan</CardTitle>
            <CardDescription>Detail akta, NIB, dan NPWP yang terkait.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="font-medium">NPWP Perusahaan:</p>
                    <p className="text-muted-foreground">{application.npwp_perusahaan || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">NPWP Pimpinan:</p>
                    <p className="text-muted-foreground">{application.npwp_pimpinan || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">NIB Perusahaan:</p>
                    <p className="text-muted-foreground">{application.nib_perusahaan || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">Tanggal NIB:</p>
                    <p className="text-muted-foreground">{application.nib_date_formatted || 'N/A'}</p>
                </div>
            </div>
            <Separator className="my-4" />
            <h4 className="font-semibold mb-2">Akta Pendirian</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="font-medium">Notaris:</p>
                    <p className="text-muted-foreground">{application.akta_pendirian_notaris || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">Nomor Akta:</p>
                    <p className="text-muted-foreground">{application.akta_pendirian_nomor || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">Tanggal Akta:</p>
                    <p className="text-muted-foreground">{application.akta_pendirian_tanggal_formatted || 'N/A'}</p>
                </div>
            </div>
            <Separator className="my-4" />
            <h4 className="font-semibold mb-2">Akta Perubahan Terakhir (Opsional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="font-medium">Notaris:</p>
                    <p className="text-muted-foreground">{application.akta_perubahan_notaris || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">Nomor Akta:</p>
                    <p className="text-muted-foreground">{application.akta_perubahan_nomor || 'N/A'}</p>
                </div>
                <div>
                    <p className="font-medium">Tanggal Akta:</p>
                    <p className="text-muted-foreground">{application.akta_perubahan_tanggal_formatted || 'N/A'}</p>
                </div>
            </div>
            <Separator className="my-4" />
            <h4 className="font-semibold mb-2">SK Kemenkumham</h4>
            <div>
                <p className="font-medium">Nomor/Tanggal SK Kemenkumham:</p>
                <p className="text-muted-foreground">{application.sk_kemenkumham_nomor_tanggal || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dokumen Terkait */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Terkait</CardTitle>
            <CardDescription>Dokumen yang diunggah untuk permohonan ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p>Tidak ada dokumen yang diunggah untuk permohonan ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium text-sm capitalize">
                            {doc.original_name || doc.document_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tipe: {doc.document_type.replace(/_/g, ' ')}
                    </p>
                    <div className="flex gap-2">
                      {doc.file_url ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownloadDocument(doc.file_url!, doc.original_name || 'document.pdf')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Unduh
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <Download className="w-4 h-4 mr-2" />
                          Unduh (Tidak Tersedia)
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tombol Final Ajukan Permohonan */}
        {application.status === 'draft' && (
          <Card className="text-center py-6">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Finalisasi Permohonan</h3>
              <p className="text-muted-foreground mb-6">
                Pastikan semua informasi dan dokumen sudah benar. Setelah diajukan, Anda tidak dapat mengubah permohonan ini.
              </p>
              <Button
                size="lg"
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
              >
                <FileCheck className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Mengirim Permohonan...' : 'Final Ajukan Permohonan'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;