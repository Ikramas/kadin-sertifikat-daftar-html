import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Application {
  id: string;
  application_number: string;
  application_type: 'new' | 'renewal' | 'upgrade';
  current_sbu_number?: string;
  requested_classification: string;
  business_field: string;
  company_qualification: 'Kecil' | 'Menengah' | 'Besar';
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submission_date?: string;
  review_date?: string;
  completion_date?: string;
  notes?: string;
  company_name: string;
  reviewer_name?: string;
  document_count: number;
  created_at_formatted: string;
  submission_date_formatted?: string;
  review_date_formatted?: string;
  completion_date_formatted?: string;
}

const Applications: React.FC = () => {
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);

  useEffect(() => {
    if (isDocumentVerified) {
      fetchApplications();
    }
  }, [isDocumentVerified]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/backend/api/applications/list.php', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.status === 'success') {
        setApplications(result.data.applications);
      } else {
        throw new Error(result.message || 'Gagal memuat data permohonan');
      }
    } catch (error) {
      toast({
        title: 'Gagal memuat data',
        description: error.message || 'Terjadi kesalahan saat memuat daftar permohonan',
        variant: 'destructive',
      });
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
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

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda belum dapat mengajukan SBU. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Permohonan SBU</h1>
          <p className="text-muted-foreground">
            Kelola permohonan Sertifikat Badan Usaha Anda
          </p>
        </div>
        <Button 
          onClick={() => setShowNewApplicationForm(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajukan SBU Baru
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dalam Proses</p>
                <p className="text-2xl font-bold">
                  {applications.filter(app => ['submitted', 'under_review'].includes(app.status)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter(app => ['approved', 'completed'].includes(app.status)).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter(app => app.status === 'draft').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Permohonan</h3>
            <p className="text-muted-foreground mb-4">
              Anda belum mengajukan permohonan SBU. Mulai dengan mengajukan SBU baru.
            </p>
            <Button onClick={() => setShowNewApplicationForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajukan SBU Baru
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">
                      {application.application_number}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div>{getApplicationTypeLabel(application.application_type)}</div>
                      <div className="text-xs">
                        Dibuat: {application.created_at_formatted}
                      </div>
                    </CardDescription>
                  </div>
                  {getStatusBadge(application.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Klasifikasi:</span>
                    <div className="text-muted-foreground">{application.requested_classification}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Bidang Usaha:</span>
                    <div className="text-muted-foreground">{application.business_field}</div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Kualifikasi:</span>
                    <Badge variant="outline">{application.company_qualification}</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Dokumen:</span>
                    <span className="text-muted-foreground">{application.document_count} file</span>
                  </div>
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

                {application.completion_date_formatted && (
                  <div className="text-xs text-muted-foreground">
                    Selesai: {application.completion_date_formatted}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Detail
                  </Button>
                  
                  {application.status === 'completed' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Unduh
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;