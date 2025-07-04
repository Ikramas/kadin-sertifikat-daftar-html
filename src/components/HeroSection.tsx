
import React from 'react';
import { Shield, Award, CheckCircle, Users } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900"></div>
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 mb-6">
              <Shield className="w-4 h-4 mr-2 text-yellow-400" />
              <span className="text-sm font-medium">Sertifikasi Resmi KADIN Indonesia</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pendaftaran
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Sertifikat Badan Usaha
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed max-w-3xl mx-auto">
            Dapatkan sertifikat resmi untuk meningkatkan kredibilitas dan kepercayaan bisnis Anda 
            dengan proses yang mudah, cepat, dan terpercaya.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center bg-white/10 px-4 py-3 rounded-lg backdrop-blur-sm">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-sm font-medium">Proses Cepat 3-5 Hari</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-3 rounded-lg backdrop-blur-sm">
              <Award className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm font-medium">Sertifikat Resmi</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-3 rounded-lg backdrop-blur-sm">
              <Users className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm font-medium">Dipercaya 10,000+ Perusahaan</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Persyaratan Umum</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                <span>Badan usaha beroperasi minimal 1 tahun</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                <span>Memiliki izin usaha yang berlaku</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                <span>Tidak dalam proses pailit/likuidasi</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                <span>Laporan keuangan dapat dipertanggungjawabkan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 text-slate-50 fill-current" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
