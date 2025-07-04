
import React from 'react';
import { Phone, Mail, MapPin, Globe, Facebook, Twitter, Instagram, Linkedin, Award, Users, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-blue-900 font-bold text-xl">KADIN</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">KADIN Indonesia</h3>
                  <p className="text-blue-200">Kamar Dagang dan Industri Indonesia</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md">
                Kamar Dagang dan Industri Indonesia adalah organisasi terkemuka yang 
                mewakili kepentingan dunia usaha Indonesia dalam forum nasional dan internasional. 
                Kami berkomitmen mendukung pertumbuhan ekonomi melalui sertifikasi dan pemberdayaan UMKM.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Users className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <div className="text-lg font-bold">10K+</div>
                  <div className="text-xs text-gray-300">Anggota</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Award className="w-6 h-6 text-green-400 mx-auto mb-1" />
                  <div className="text-lg font-bold">15+</div>
                  <div className="text-xs text-gray-300">Tahun</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <Shield className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <div className="text-lg font-bold">100%</div>
                  <div className="text-xs text-gray-300">Terpercaya</div>
                </div>
              </div>
              
              {/* Social media */}
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Contact info */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-yellow-400">Kontak Kami</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3 group">
                  <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors duration-300">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-300">Telepon</p>
                    <p className="font-medium">+62 21 316 0275</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-500 transition-colors duration-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-300">Email</p>
                    <p className="font-medium">info@kadin.id</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="bg-red-600 p-2 rounded-lg group-hover:bg-red-500 transition-colors duration-300">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-300">Alamat</p>
                    <p className="font-medium">Jakarta Pusat, Indonesia</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="bg-purple-600 p-2 rounded-lg group-hover:bg-purple-500 transition-colors duration-300">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-300">Website</p>
                    <p className="font-medium">www.kadin.id</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-yellow-400">Layanan Kami</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                    <Award className="w-4 h-4 mr-2 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
                    Sertifikat Badan Usaha
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                    <Shield className="w-4 h-4 mr-2 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                    Sertifikat Asal Barang
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                    <Users className="w-4 h-4 mr-2 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                    Keanggotaan KADIN
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                    <Globe className="w-4 h-4 mr-2 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                    Konsultasi Bisnis
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group">
                    <Phone className="w-4 h-4 mr-2 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                    Networking
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-gray-700/50 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2024 KADIN Indonesia. Semua hak cipta dilindungi undang-undang.
              </p>
              <div className="flex space-x-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors duration-300">Kebijakan Privasi</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Syarat & Ketentuan</a>
                <a href="#" className="hover:text-white transition-colors duration-300">FAQ</a>
                <a href="#" className="hover:text-white transition-colors duration-300">Bantuan</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
