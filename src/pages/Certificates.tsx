import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Calendar,
  Building,
  FileText,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CertificateData {
  id: string;
  certificate_number: string;
  classification: string;
  business_field: string;
  qualification: string;
  issued_date: string;
  expiry_date: string;
  status: string;
  issuer_name: string;
  certificate_file_path?: string;
  application_number?: string;
  application_type?: string;
  issued_date_formatted: string;
  expiry_date_formatted: string;
  category: 'active' | 'expiring_soon' | 'expired' | 'in_process';
  days_until_expiry?: number;
}

interface ApplicationInProgress {
  id: string;
  application_number: string;
  application_type: string;
  requested_classification: string;
  business_field: string;
  company_qualification: string;
  status: string;
  submission_date_formatted?: string;
  review_date_formatted?: string;
}

interface CertificatesResponse {
  certificates: {
    active: CertificateData[];
    expiring_soon: CertificateData[];
    expired: CertificateData[];
    in_process: CertificateData[];
  };
  applications_in_progress: ApplicationInProgress[];
  summary: {
    total_certificates: number;
    active_count: number;
    expiring_soon_count: number;
    expired_count: number;
    in_process_count: number;
    applications_in_progress_count: number;
  };
}

const Certificates: React.FC = () => {
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const [certificatesData, setCertificatesData] = useState<CertificatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDocumentVerified) {
      fetchCertificates();
    }
  }, [isDocumentVerified]);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/backend/api/certificates/list.php', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        setCertificatesData(result.data);
      } else {
        throw new Error(result.message || 'Gagal memuat data sertifikat');
      }
    } catch (error: any) {
      toast({
        title: 'Gagal memuat data',
        description: error.message || 'Terjadi kesalahan saat memuat daftar sertifikat',
        variant: 'destructive',
      });
      console.error('Error fetching certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, category?: string) => {
    if (category === 'expiring_soon') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Akan Berakhir
        </Badge>
      );
    }
    
    if (category === 'expired') {
      return (
        <Badge variant="destructive">
          <Clock className="w-3 h-3 mr-1" />
          Kadaluarsa
        </Badge>
      );
    }

    const statusConfig = {
      active: { label: 'Aktif', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      pending: { label: 'Dalam Proses', variant: 'outline' as const, icon: Clock, className: '' },
      suspended: { label: 'Ditangguhkan', variant: 'destructive' as const, icon: AlertTriangle, className: '' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getApplicationStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Disubmit', variant: 'outline' as const, icon: Clock, className: '' },
      under_review: { label: 'Dalam Review', variant: 'default' as const, icon: AlertTriangle, className: '' },
      approved: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderCertificateCard = (certificate: CertificateData) => (
    <Card key={certificate.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="truncate">{certificate.certificate_number}</span>
            </CardTitle>
            <CardDescription>
              {certificate.classification}
            </CardDescription>
          </div>
          {getStatusBadge(certificate.status, certificate.category)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{certificate.business_field}</div>
              <div className="text-muted-foreground">Kualifikasi: {certificate.qualification}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Diterbitkan: {certificate.issued_date_formatted}</div>
              <div className="text-muted-foreground">Berakhir: {certificate.expiry_date_formatted}</div>
            </div>
          </div>
          
          {certificate.days_until_expiry !== undefined && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">
                  Berakhir dalam {certificate.days_until_expiry} hari
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            Detail
          </Button>
          
          {certificate.certificate_file_path && (
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Unduh
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderApplicationCard = (application: ApplicationInProgress) => (
    <Card key={application.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="truncate">{application.application_number}</span>
            </CardTitle>
            <CardDescription>
              {application.application_type === 'new' ? 'Permohonan Baru' : 
               application.application_type === 'renewal' ? 'Perpanjangan' : 'Peningkatan'}
            </CardDescription>
          </div>
          {getApplicationStatusBadge(application.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium">{application.requested_classification}</div>
            <div className="text-muted-foreground">{application.business_field}</div>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Kualifikasi:</span>
            <Badge variant="outline">{application.company_qualification}</Badge>
          </div>
          
          {application.submission_date_formatted && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Disubmit: {application.submission_date_formatted}
            </div>
          )}
          
          {application.review_date_formatted && (
            <div className="text-xs text-muted-foreground">
              Direview: {application.review_date_formatted}
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda belum dapat melihat sertifikat. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!certificatesData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat data sertifikat. Silakan refresh halaman atau hubungi administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Sertifikat SBU</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau sertifikat Badan Usaha Anda
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sertifikat</p>
                <p className="text-2xl font-bold">{certificatesData.summary.total_certificates}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold text-green-600">{certificatesData.summary.active_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Akan Berakhir</p>
                <p className="text-2xl font-bold text-yellow-600">{certificatesData.summary.expiring_soon_count}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dalam Proses</p>
                <p className="text-2xl font-bold text-blue-600">{certificatesData.summary.applications_in_progress_count}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="active">Aktif ({certificatesData.summary.active_count})</TabsTrigger>
          <TabsTrigger value="expiring">Akan Berakhir ({certificatesData.summary.expiring_soon_count})</TabsTrigger>
          <TabsTrigger value="expired">Kadaluarsa ({certificatesData.summary.expired_count})</TabsTrigger>
          <TabsTrigger value="in_process">Dalam Proses ({certificatesData.summary.in_process_count})</TabsTrigger>
          <TabsTrigger value="applications">Pengajuan ({certificatesData.summary.applications_in_progress_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {certificatesData.certificates.active.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Sertifikat Aktif</h3>
                <p className="text-muted-foreground">
                  Anda belum memiliki sertifikat yang aktif.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificatesData.certificates.active.map(renderCertificateCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          {certificatesData.certificates.expiring_soon.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Sertifikat yang Akan Berakhir</h3>
                <p className="text-muted-foreground">
                  Semua sertifikat Anda masih dalam masa berlaku yang aman.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificatesData.certificates.expiring_soon.map(renderCertificateCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {certificatesData.certificates.expired.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Sertifikat Kadaluarsa</h3>
                <p className="text-muted-foreground">
                  Bagus! Semua sertifikat Anda masih berlaku.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificatesData.certificates.expired.map(renderCertificateCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in_process" className="space-y-4">
          {certificatesData.certificates.in_process.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Sertifikat dalam Proses</h3>
                <p className="text-muted-foreground">
                  Tidak ada sertifikat yang sedang dalam tahap penerbitan.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificatesData.certificates.in_process.map(renderCertificateCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {certificatesData.applications_in_progress.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak Ada Pengajuan dalam Proses</h3>
                <p className="text-muted-foreground">
                  Tidak ada permohonan SBU yang sedang dalam tahap review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificatesData.applications_in_progress.map(renderApplicationCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Certificates;