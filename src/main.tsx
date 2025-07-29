// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // CSS utama aplikasi
import './i18n'; // Konfigurasi i18n
import ErrorBoundary from './contexts/ErrorBoundary'; // Import ErrorBoundary
import { BrowserRouter } from 'react-router-dom'; // FIX: Import BrowserRouter di sini

// Definisikan variabel untuk mengontrol StrictMode
// Anda bisa mengubah ini menjadi `false` untuk production build,
// atau menggunakannya dengan variabel lingkungan (misal: process.env.NODE_ENV === 'development')
const isStrictModeEnabled = true; // Setel ke 'false' untuk produksi jika Anda ingin menonaktifkan StrictMode

// Entry point aplikasi React Anda
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);

  const AppContent = (
    // ErrorBoundary harus membungkus komponen root aplikasi.
    <ErrorBoundary>
      {/* FIX: BrowserRouter membungkus seluruh App di sini, di level paling atas. */}
      {/* Ini memastikan konteks router tersedia untuk semua komponen di dalamnya. */}
      <BrowserRouter future={{ v7_startTransition: true }}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  );

  root.render(
    isStrictModeEnabled ? (
      <React.StrictMode>
        {AppContent}
      </React.StrictMode>
    ) : (
      AppContent
    )
  );
} else {
  console.error('Failed to find the root element with ID "root".');
}