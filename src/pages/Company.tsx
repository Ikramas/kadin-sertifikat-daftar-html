// File: src/pages/Company.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building2, Calendar, Shield, MapPin, CreditCard, FileText, ExternalLink, Download, Edit, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useErrorHandler } from '@/hooks/useErrorHandler';

import type { Company, Document } from '@/types/company'; 

import { downloadAuthenticatedFile } from '@/lib/utils'; 

export default function Company() { 
  const { user, company, isDocumentVerified, fetchUserProfile } = useAuth(); 
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const [companyProfileData, setCompanyProfileData] = useState<Company | null>(null); 
  const [companyDocuments, setCompanyDocuments] = useState<Document[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (company) {
      setCompanyProfileData(company);
      if (user?.documents) { 
        setCompanyDocuments(user.documents);
      }
      setIsLoading(false);
    } else if (!user) { 
      setIsLoading(false);
    }
  }, [company, user]); 

  const refreshCompanyDocuments = async () => {
    setIsLoading(true);
    try {
      await fetchUserProfile(); 
      if (user?.documents) {
        setCompanyDocuments(user.documents);
      }
      handleSuccess('Data dokumen berhasil diperbarui.', 'Refresh Berhasil');
    } catch (error: any) { 
      handleError(error, 'document_refresh', { action: 'refresh_company_documents' });
    } finally {
      setIsLoading(false);
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
    switch (status) {
      case 'active':
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary">Menunggu Verifikasi Email</Badge>;
      case 'pending_document_verification':
        return <Badge variant="outline">Menunggu Dokumen Registrasi</Badge>;
      case 'pending_admin_approval':
        return <Badge className="bg-warning text-warning-foreground">Menunggu Persetujuan Admin</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Dibekukan</Badge>;
      default:
        return <Badge variant="outline">Tidak Diketahui</Badge>; // FIX: Mengganti "/Dua" dengan "/Badge"
    }
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tidak tersedia';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Akses Dibatasi</CardTitle>
            <CardDescription>
              Anda belum dapat melihat data perusahaan. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={() => window.location.href = '/document-registration'}>Lengkapi Dokumen Registrasi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !companyProfileData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Data Perusahaan</h1>
          <p className="text-muted-foreground">
            Informasi lengkap mengenai perusahaan dan dokumen yang diunggah
          </p>
        </div>
        <Button onClick={refreshCompanyDocuments} disabled={isLoading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang Data
        </Button>
      </div>

      <div className="space-y-6">

      {/* Company Information */}
      {companyProfileData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informasi Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Perusahaan</p>
                  <p className="font-medium">{companyProfileData.company_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bentuk Badan Usaha</p>
                  <p className="font-medium">{companyProfileData.business_entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Perusahaan</p>
                  <p className="font-medium">{companyProfileData.company_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telepon Perusahaan</p>
                  <p className="font-medium">{companyProfileData.company_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NPWP Perusahaan</p>
                  <p className="font-medium">{companyProfileData.npwp}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">NIB</p>
                  <p className="font-medium">{companyProfileData.nib}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KTA KADIN</p>
                  <p className="font-medium">{companyProfileData.kta_kadin_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal KTA</p>
                  <p className="font-medium">{formatDate(companyProfileData.kta_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Usaha</p>
                  <p className="font-medium">{companyProfileData.business_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Verifikasi</p>
                  {getStatusBadge(companyProfileData.status)}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium">Alamat Perusahaan</h4>
              </div>
              <div className="space-y-2">
                <p className="text-sm">{companyProfileData.address}</p>
                <p className="text-sm text-muted-foreground">
                  {companyProfileData.village}, {companyProfileData.district}, {companyProfileData.regency_city}, {companyProfileData.province}, {companyProfileData.postal_code}
                </p>
              </div>
            </div>

            {/* Leader Information */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-medium">Informasi Pimpinan</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Pimpinan</p>
                  <p className="font-medium">{companyProfileData.leader_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jabatan</p>
                  <p className="font-medium">{companyProfileData.leader_position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIK</p>
                  <p className="font-medium">{companyProfileData.leader_nik}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NPWP Pimpinan</p>
                  <p className="font-medium">{companyProfileData.leader_npwp}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dokumen Perusahaan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen Perusahaan
          </CardTitle>
          <CardDescription>Dokumen yang telah Anda unggah untuk keperluan registrasi dan SBU.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {companyDocuments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p>Belum ada dokumen yang diunggah atau tidak tersedia.</p>
              <p className="text-sm">Pastikan Anda sudah melengkapi dokumen di halaman Registrasi Dokumen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyDocuments.map((doc) => (
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

      {/* Bagian untuk link ke Settings jika ingin mengedit */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/settings'} className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Edit Data Perusahaan
          </Button>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}