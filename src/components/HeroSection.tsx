
import React from 'react';
import { Shield, Award, CheckCircle, Users, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 mb-6">
                <Shield className="w-4 h-4 mr-2 text-yellow-400" />
                <span className="text-sm font-medium">Sertifikasi Resmi KADIN Indonesia</span>
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Pendaftaran
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Sertifikat Badan Usaha
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Dapatkan sertifikat resmi untuk meningkatkan kredibilitas dan kepercayaan bisnis Anda 
              dengan proses yang mudah, cepat, dan terpercaya.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
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
                <span className="text-sm font-medium">10,000+ Perusahaan</span>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Mulai Pendaftaran
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Right Content - Requirements Card */}
          <div className="lg:pl-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Persyaratan Umum</h3>
                  <p className="text-blue-200 text-sm">Pastikan perusahaan Anda memenuhi kriteria berikut</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Badan usaha beroperasi minimal 1 tahun</span>
                    <p className="text-blue-200 text-sm mt-1">Memiliki track record operasional yang dapat diverifikasi</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Memiliki izin usaha yang berlaku</span>
                    <p className="text-blue-200 text-sm mt-1">SIUP, TDP, NPWP, dan izin usaha sesuai bidang</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Tidak dalam proses pailit/likuidasi</span>
                    <p className="text-blue-200 text-sm mt-1">Status perusahaan aktif dan sehat secara hukum</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-white font-medium">Laporan keuangan dapat dipertanggungjawabkan</span>
                    <p className="text-blue-200 text-sm mt-1">Audit atau review oleh akuntan publik</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="text-center">
                  <p className="text-blue-200 text-sm mb-2">Tingkat Kepuasan Klien</p>
                  <div className="flex justify-center items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-white font-semibold ml-2">4.9/5.0</span>
                  </div>
                </div>
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
