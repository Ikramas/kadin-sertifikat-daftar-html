
import React from 'react';
import Header from '@/components/Header';
import CompanyInfoForm from '@/components/CompanyInfoForm';
import DirectorInfoForm from '@/components/DirectorInfoForm';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import SubmitSection from '@/components/SubmitSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">
              Pendaftaran Sertifikat Badan Usaha
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Lengkapi formulir di bawah ini untuk mengajukan sertifikat badan usaha dari KADIN Indonesia. 
              Pastikan semua informasi yang Anda berikan akurat dan lengkap.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Persyaratan Umum:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Badan usaha telah beroperasi minimal 1 tahun</li>
              <li>• Memiliki izin usaha yang masih berlaku</li>
              <li>• Tidak sedang dalam proses pailit atau likuidasi</li>
              <li>• Memiliki laporan keuangan yang dapat dipertanggungjawabkan</li>
            </ul>
          </div>

          <CompanyInfoForm />
          <DirectorInfoForm />
          <DocumentUploadForm />
          <SubmitSection />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
