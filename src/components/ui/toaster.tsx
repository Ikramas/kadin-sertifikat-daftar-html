// src/components/ui/toaster.tsx
// Ini adalah komponen `Toaster` dari Shadcn UI,
// yang bertanggung jawab untuk merender semua notifikasi toast yang ada dalam state.

import {
  Toast,          // Komponen Toast individual (visualisasi toast)
  ToastClose,     // Tombol untuk menutup toast
  ToastDescription, // Deskripsi isi toast
  ToastProvider,  // Provider konteks untuk toast
  ToastTitle,     // Judul toast
  ToastViewport,  // Area tampilan toast (posisi di layar)
} from "./toast" // Import komponen-komponen ini dari file `toast.tsx` yang sama direktori

import { useToast } from "./use-toast" // Import hook `useToast` untuk mengakses state toast

/**
 * Komponen Toaster.
 * Ini adalah titik masuk utama untuk menampilkan semua toast di aplikasi Anda.
 * Harus diletakkan di level tertinggi struktur komponen Anda, seperti di `App.tsx`.
 */
export function Toaster() {
  // Gunakan hook `useToast` untuk mendapatkan daftar toast yang aktif dari state global.
  const { toasts } = useToast()

  return (
    // ToastProvider membungkus seluruh sistem toast, menyediakan konteks yang diperlukan.
    <ToastProvider>
      {/* Mapping (iterasi) melalui array `toasts` dan render setiap toast. */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          // Setiap Toast individual dirender dengan propertinya.
          // Properti `key` sangat penting untuk identifikasi elemen dalam daftar React.
          <Toast key={id} {...props}>
            {/* Bagian konten toast yang berisi judul dan deskripsi. */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>} {/* Render judul jika ada */}
              {description && (
                <ToastDescription>{description}</ToastDescription> // Render deskripsi jika ada
              )}
            </div>
            {action} {/* Render komponen aksi (misalnya tombol Undo) jika ada */}
            <ToastClose /> {/* Render tombol tutup toast */}
          </Toast>
        )
      })}
      {/* ToastViewport adalah area di mana semua toast akan muncul. */}
      {/* Posisi (misalnya top-right, bottom-left) diatur di dalam `ToastViewport` itu sendiri (di `toast.tsx`). */}
      <ToastViewport />
    </ToastProvider>
  )
}