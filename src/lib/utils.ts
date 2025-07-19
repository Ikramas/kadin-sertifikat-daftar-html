// File: src/lib/utils.ts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mengunduh file dari URL terproteksi menggunakan token autentikasi.
 * Memaksa browser untuk mengunduh, bukan membuka di tab baru.
 * @param fileUrl URL file dari API (misal: /backend/api/documents/download.php?file_name=...)
 * @param fileName Nama file yang akan digunakan saat unduh
 */
export async function downloadAuthenticatedFile(fileUrl: string, fileName: string): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
    }

    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Gagal mengunduh file. Terjadi kesalahan jaringan atau server.' }));
      throw new Error(errorData.message || 'Gagal mengunduh file.');
    }

    // Ambil blob dari response
    const blob = await response.blob();

    // Buat URL objek sementara dari blob
    const url = window.URL.createObjectURL(blob);

    // Buat elemen <a> sementara untuk memicu unduhan
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; // Menggunakan nama file asli untuk unduhan
    document.body.appendChild(a);
    a.click(); // Memicu klik
    a.remove(); // Hapus elemen <a> sementara
    window.URL.revokeObjectURL(url); // Bersihkan URL objek
  } catch (error) {
    console.error('Error saat mengunduh file:', error);
    // Anda bisa mengintegrasikan toast di sini jika diperlukan
    // import { toast } from '@/hooks/use-toast';
    // toast({ title: 'Unduh Gagal', description: error.message, variant: 'destructive' });
    throw error; // Lempar error untuk ditangani di komponen panggilan
  }
}