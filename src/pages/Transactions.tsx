import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Transactions: React.FC = () => {
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDocumentVerified) {
      fetchTransactions();
    }
  }, [isDocumentVerified]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/backend/api/transactions/list.php', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      if (result.status === 'success') {
        setTransactions(result.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground">
            Riwayat pembayaran dan invoice permohonan SBU
          </p>
        </div>
        <Button onClick={fetchTransactions} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {transactions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Transaksi</h3>
            <p className="text-muted-foreground">
              Transaksi akan muncul setelah admin menerbitkan invoice untuk permohonan SBU Anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p>Data transaksi akan ditampilkan di sini</p>
        </div>
      )}
    </div>
  );
};

export default Transactions;