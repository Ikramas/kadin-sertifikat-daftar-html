
import React from 'react';
import Header from '@/components/Header';
import CompanyInfoForm from '@/components/CompanyInfoForm';
import DirectorInfoForm from '@/components/DirectorInfoForm';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import SubmitSection from '@/components/SubmitSection';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />
      <HeroSection />
      <StatsSection />
      
      <main className="relative py-16">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-12">
              <div className="flex items-center justify-center space-x-4 mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                  <span className="ml-3 text-blue-600 font-medium">Informasi Perusahaan</span>
                </div>
                <div className="w-16 h-0.5 bg-blue-200"></div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">2</div>
                  <span className="ml-3 text-gray-600 font-medium">Informasi Direktur</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">3</div>
                  <span className="ml-3 text-gray-600 font-medium">Upload Dokumen</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-200"></div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-semibold text-sm">4</div>
                  <span className="ml-3 text-gray-600 font-medium">Selesai</span>
                </div>
              </div>
            </div>

            <CompanyInfoForm />
            <DirectorInfoForm />
            <DocumentUploadForm />
            <SubmitSection />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
