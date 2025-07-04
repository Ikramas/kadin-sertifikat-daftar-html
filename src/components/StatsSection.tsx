
import React from 'react';
import { TrendingUp, Award, Clock, Shield } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      icon: Award,
      number: "10,000+",
      label: "Perusahaan Tersertifikasi",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Clock,
      number: "3-5",
      label: "Hari Proses",
      color: "from-green-500 to-green-600"
    },
    {
      icon: TrendingUp,
      number: "98%",
      label: "Tingkat Kepuasan",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Shield,
      number: "15+",
      label: "Tahun Pengalaman",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <section className="py-16 bg-white relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dipercaya Ribuan Perusahaan Indonesia
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Bergabunglah dengan komunitas bisnis yang telah mempercayai KADIN Indonesia 
              untuk mendukung pertumbuhan usaha mereka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {stat.number}
                </h3>
                <p className="text-gray-600 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Keamanan & Kepercayaan Terjamin</h3>
              <p className="text-gray-600">Data Anda dilindungi dengan standar keamanan tingkat enterprise</p>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-gray-700">SSL Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-gray-700">ISO Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-gray-700">Data Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
