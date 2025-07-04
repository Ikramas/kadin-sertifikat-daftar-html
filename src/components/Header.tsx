
import React from 'react';
import { Phone, Mail } from 'lucide-react';

const Header = () => {
  return (
    <header className="relative">
      {/* Top bar */}
      <div className="bg-gray-900 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+62 21 316 0275</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>info@kadin.id</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-300">Bantuan: </span>
              <span className="text-yellow-400">Senin - Jumat, 08:00 - 17:00 WIB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-lg relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-yellow-400 font-bold text-xl tracking-wide">KADIN</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
                  KADIN INDONESIA
                </h1>
                <p className="text-gray-600 text-sm font-medium">Kamar Dagang dan Industri Indonesia</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">Beranda</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">Layanan</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">Tentang</a>
                <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">Kontak</a>
              </nav>
              
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
                Portal Sertifikat
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
