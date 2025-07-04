
import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">KADIN</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">KADIN INDONESIA</h1>
              <p className="text-blue-200">Kamar Dagang dan Industri Indonesia</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Sertifikat Badan Usaha</p>
            <p className="text-lg font-semibold">Pendaftaran Online</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
