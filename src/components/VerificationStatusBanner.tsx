
import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, FileCheck, Edit } from 'lucide-react';
import { ApplicationStatus } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';

interface VerificationStatusBannerProps {
  status: ApplicationStatus;
  onEdit?: () => void;
}

const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({ status, onEdit }) => {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'submitted':
        return {
          icon: Clock,
          title: 'Aplikasi Terkirim',
          description: 'Aplikasi Anda telah berhasil dikirim dan sedang menunggu review',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'under_review':
        return {
          icon: FileCheck,
          title: 'Sedang Direview',
          description: 'Tim verifikasi sedang memeriksa dokumen Anda',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'revision_needed':
        return {
          icon: AlertTriangle,
          title: 'Perlu Revisi',
          description: 'Ada beberapa dokumen yang perlu diperbaiki',
          color: 'orange',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Disetujui',
          description: 'Selamat! Aplikasi Anda telah disetujui',
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Ditolak',
          description: 'Aplikasi Anda tidak dapat diproses',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: Edit,
          title: 'Draft',
          description: 'Lengkapi formulir untuk mengajukan aplikasi',
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6 mb-8`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl bg-${config.color}-100`}>
            <Icon className={`w-6 h-6 text-${config.color}-600`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${config.textColor} mb-2`}>
              {config.title}
            </h3>
            <p className={`${config.textColor} mb-3`}>
              {config.description}
            </p>
            {status.comments && (
              <p className={`text-sm ${config.textColor} opacity-80`}>
                {status.comments}
              </p>
            )}
            {status.submittedAt && (
              <p className={`text-xs ${config.textColor} opacity-60 mt-2`}>
                Dikirim pada: {status.submittedAt.toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
        
        {status.canEdit && onEdit && (
          <Button 
            onClick={onEdit}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Aplikasi</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default VerificationStatusBanner;
