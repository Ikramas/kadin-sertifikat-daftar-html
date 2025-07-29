// src/pages/Transactions.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query'; 
import {
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Receipt, 
  ArrowRight, 
  Info, 
  Download,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useErrorHandler } from '@/hooks/useErrorHandler'; 
import { downloadAuthenticatedFile } from '@/lib/utils'; // Import fungsi ini

interface Transaction {
  id: string;
  transaction_number: string;
  amount: number;
  amount_formatted: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  payment_method: 'bank_transfer' | 'credit_card' | 'e_wallet' | 'other';
  payment_reference?: string;
  paid_at?: string;
  paid_at_formatted?: string;
  expired_at?: string;
  expired_at_formatted?: string;
  notes?: string;
  created_at: string;
  created_at_formatted: string;
  updated_at: string;
  application_id?: string;
  application_number?: string;
  application_code_reg?: string;
  application_detail_url?: string;
  company_name?: string; // Menambahkan ini agar bisa ditampilkan di FE
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

const Transactions: React.FC = () => {
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler(); 
  const [loadingTransactionNumber, setLoadingTransactionNumber] = React.useState<string | null>(null); // State baru untuk loading

  // Fungsi untuk mengambil data transaksi
  const fetchTransactionsData = async (): Promise<TransactionsResponse> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
    }

    const response = await fetch('/backend/api/transactions/list.php', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Gagal memuat daftar transaksi');
    }
  };

  // Menggunakan useQuery untuk data transaksi
  const { data, isLoading, error, refetch } = useQuery<TransactionsResponse, Error>({
    queryKey: ['transactions'],
    queryFn: fetchTransactionsData,
    enabled: isDocumentVerified, 
    staleTime: 1000 * 60, 
    refetchInterval: 1000 * 300, 
  });

  const transactions = data?.transactions || [];

  // --- REVISI: handleDownloadInvoice untuk loading & download langsung ---
  const handleDownloadInvoice = async (transactionNumber: string) => { 
    setLoadingTransactionNumber(transactionNumber); // Set loading state
    try {
      const fileUrl = `/backend/api/transactions/generate_invoice_pdf.php?transaction_number=${transactionNumber}`;
      const downloadFileName = `Faktur_${transactionNumber}.pdf`;

      // Menggunakan fungsi downloadAuthenticatedFile dari src/lib/utils.ts
      await downloadAuthenticatedFile(fileUrl, downloadFileName);
      
      handleSuccess(`Faktur ${transactionNumber} berhasil diunduh.`, 'Unduh Berhasil');
    } catch (err: any) {
      handleError(err, 'invoice_download', { transactionNumber });
    } finally {
      setLoadingTransactionNumber(null); // Reset loading state
    }
  };
  // --- AKHIR REVISI ---


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu Pembayaran', variant: 'warning' as const, icon: Clock },
      paid: { label: 'Berhasil Dibayar', variant: 'success' as const, icon: CheckCircle },
      failed: { label: 'Gagal', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: 'Dibatalkan', variant: 'outline' as const, icon: XCircle },
      refunded: { label: 'Dikembalikan', variant: 'secondary' as const, icon: Info },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const, icon: Info };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      bank_transfer: 'Transfer Bank',
      credit_card: 'Kartu Kredit',
      e_wallet: 'E-Wallet',
      other: 'Lainnya',
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda belum dapat melihat transaksi. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Terjadi kesalahan: {error.message}. Mohon coba muat ulang halaman.</AlertDescription>
        </Alert>
        <div className="mt-4">
            <Button onClick={() => refetch()} variant="outline">
                Muat Ulang Transaksi
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Daftar Transaksi</h1>
          <p className="text-muted-foreground">
            Lihat riwayat pembayaran dan status transaksi Anda.
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Muat Ulang Transaksi
        </Button>
      </div>

      {/* Daftar Transaksi */}
      {transactions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Transaksi</h3>
            <p className="text-muted-foreground mb-4">
              Anda belum memiliki riwayat transaksi pembayaran.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg truncate">
                    {transaction.transaction_number}
                  </CardTitle>
                  {getStatusBadge(transaction.status)}
                </div>
                <CardDescription className="text-sm font-bold text-primary">
                  {transaction.amount_formatted}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Jenis Pembayaran:</span>
                  <Badge variant="outline">{getPaymentMethodLabel(transaction.payment_method)}</Badge>
                </div>
                {transaction.payment_reference && (
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Ref. Pembayaran:</span>
                        <span className="text-muted-foreground">{transaction.payment_reference}</span>
                    </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Dibuat Pada:</span>
                  <span className="text-muted-foreground">{transaction.created_at_formatted}</span>
                </div>
                {transaction.paid_at_formatted && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Dibayar Pada:</span>
                    <span className="text-muted-foreground">{transaction.paid_at_formatted}</span>
                  </div>
                )}
                {transaction.expired_at_formatted && transaction.status === 'pending' && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="font-medium">Kadaluarsa Pada:</span>
                    <span className="text-orange-600">{transaction.expired_at_formatted}</span>
                  </div>
                )}
                {transaction.application_number && (
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="font-medium">Terhubung ke Permohonan:</span>
                    {transaction.application_detail_url ? (
                      <Link to={transaction.application_detail_url} className="text-primary hover:underline flex items-center gap-1">
                        {transaction.application_number} <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{transaction.application_number}</span>
                    )}
                  </div>
                )}
                {transaction.notes && (
                  <div className="border-t pt-3">
                    <p className="font-medium">Catatan:</p>
                    <p className="text-muted-foreground text-xs">{transaction.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  {(transaction.status === 'paid' || transaction.status === 'pending') && transaction.transaction_number && (
                    <Button 
                      size="sm"
                      onClick={() => handleDownloadInvoice(transaction.transaction_number)}
                      disabled={loadingTransactionNumber === transaction.transaction_number} // Disabled saat loading
                    >
                      {loadingTransactionNumber === transaction.transaction_number ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> // Spinner saat loading
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {loadingTransactionNumber === transaction.transaction_number ? 'Memuat...' : 'Unduh Faktur'}
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

export default Transactions;