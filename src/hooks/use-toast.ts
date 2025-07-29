// src/hooks/use-toast.ts
// Ini adalah implementasi hook `useToast` dari Shadcn UI,
// yang menyediakan fungsionalitas untuk menampilkan, memperbarui, dan menutup notifikasi toast.
// File ini berfungsi sebagai API klien untuk sistem notifikasi toast Anda.

import * as React from "react"

// Import definisi tipe yang diperlukan dari file `toast.tsx`
// Pastikan path ini benar sesuai struktur proyek Anda.
import type { ToastActionElement, ToastProps } from "@/components/ui/toast" 

// Batasan jumlah toast yang dapat ditampilkan secara bersamaan.
// Notifikasi toast yang lebih baru akan menggantikan yang lebih lama jika batas ini tercapai.
const TOAST_LIMIT = 1

// Penundaan sebelum toast dihapus secara permanen dari DOM setelah ditutup.
// Diubah menjadi 5 detik agar pesan kesalahan lebih terlihat, tetapi tidak terlalu lama.
const TOAST_REMOVE_DELAY = 5000 

// Definisi tipe untuk objek toast yang akan dikelola oleh sistem.
// Ini memperluas `ToastProps` dari `toast.tsx` dengan informasi tambahan seperti ID.
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode // Judul toast
  description?: React.ReactNode // Deskripsi atau isi toast
  action?: ToastActionElement // Komponen aksi untuk toast (misalnya tombol "Undo")
}

// Objek yang berisi jenis-jenis aksi yang dapat dilakukan pada state toast.
// Ini digunakan dalam reducer untuk membedakan operasi.
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",       // Menambahkan toast baru
  UPDATE_TOAST: "UPDATE_TOAST", // Memperbarui toast yang sudah ada
  DISMISS_TOAST: "DISMISS_TOAST", // Menandai toast untuk ditutup (memulai animasi keluar)
  REMOVE_TOAST: "REMOVE_TOAST", // Menghapus toast secara permanen dari state
} as const // `as const` untuk memastikan properti adalah read-only string literals

// Variabel untuk menghasilkan ID unik untuk setiap toast.
let count = 0

/**
 * Menghasilkan ID unik untuk setiap toast.
 * Menggunakan counter sederhana yang di-reset saat mencapai batas integer aman.
 * @returns {string} ID unik.
 */
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// Map untuk menyimpan timeout agar toast dapat dihapus setelah delay
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Menambahkan toast ke antrean penghapusan setelah `TOAST_REMOVE_DELAY`.
 * Jika toast sudah ada di antrean, tidak akan ditambahkan lagi.
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}


// Definisi tipe untuk semua kemungkinan aksi yang dapat dikirim ke reducer.
type Action =
  | {
      type: typeof actionTypes.ADD_TOAST // Aksi untuk menambahkan toast
      toast: ToasterToast // Objek toast lengkap yang akan ditambahkan
    }
  | {
      type: typeof actionTypes.UPDATE_TOAST // Aksi untuk memperbarui toast
      toast: Partial<ToasterToast> // Sebagian objek toast yang berisi properti yang akan diperbarui
    }
  | {
      type: typeof actionTypes.DISMISS_TOAST // Aksi untuk menutup toast
      toastId?: ToasterToast["id"] // ID toast yang akan ditutup (opsional, jika ingin menutup semua)
    }
  | {
      type: typeof actionTypes.REMOVE_TOAST // Aksi untuk menghapus toast
      toastId?: ToasterToast["id"] // ID toast yang akan dihapus
    }

// Definisi interface untuk state global toast.
interface State {
  toasts: ToasterToast[] // Array yang berisi semua objek toast yang aktif
}

// Reducer yang mengelola perubahan state toast berdasarkan aksi yang dikirim.
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        // Tambahkan toast baru di awal array, dan potong jika melebihi batas TOAST_LIMIT
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        // Iterasi melalui toast dan perbarui toast yang cocok dengan ID
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Array listener yang akan dipanggil setiap kali state berubah.
// Ini memungkinkan komponen React untuk berlangganan perubahan state toast.
const listeners: Array<(state: State) => void> = []

// State dalam memori yang dipegang secara global.
// Ini adalah state yang diakses dan dimodifikasi oleh semua instansi `useToast`.
let memoryState: State = { toasts: [] }

/**
 * Mengirimkan aksi ke reducer dan memperbarui state global.
 * Kemudian memberitahu semua listener tentang perubahan state.
 * @param {Action} action Aksi yang akan dikirim.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Definisi tipe untuk objek toast yang akan diterima oleh fungsi `toast()`.
// Ini adalah `ToasterToast` tanpa properti `id`.
type Toast = Omit<ToasterToast, "id">

/**
 * Fungsi utama untuk menampilkan toast baru.
 * @param {Toast} props Properti toast (judul, deskripsi, aksi, dll.).
 * @returns {object} Objek dengan `id` toast, serta fungsi `update` dan `dismiss` untuk mengelolanya.
 */
function toast({ ...props }: Toast) {
  const id = genId() // Buat ID unik untuk toast baru

  // Fungsi untuk memperbarui properti toast setelah dibuat
  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })
  // Fungsi untuk menutup toast (mengatur `open: false`)
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  // Kirim aksi untuk menambahkan toast baru ke state
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true, // Toast baru selalu dimulai dalam keadaan terbuka
      // Handler `onOpenChange` akan dipanggil ketika status `open` berubah.
      // Jika `open` menjadi `false` (yaitu toast ditutup), panggil `dismiss()`.
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Kembalikan objek untuk mengelola toast yang baru dibuat
  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Hook React untuk mengakses state toast dan fungsi `toast()`.
 * Komponen yang menggunakan hook ini akan re-render setiap kali state toast berubah.
 * @returns {State & { toast: typeof toast; dismiss: (toastId?: string) => void }} Objek state dan fungsi manajemen toast.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState) // State lokal komponen yang mencerminkan state global

  React.useEffect(() => {
    // Berlangganan (subscribe) ke perubahan state global
    listeners.push(setState)
    // Fungsi cleanup: unsubscribe saat komponen di-unmount
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, []) // Dependensi kosong agar tidak menyebabkan re-render yang tidak perlu.

  return {
    ...state, // Mengembalikan semua properti dari state (yaitu array `toasts`)
    toast,    // Fungsi untuk menampilkan toast baru
    // Fungsi `dismiss` yang di-memoized untuk menutup toast tertentu
    dismiss: React.useCallback(
      (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
      []
    ),
  }
}

// Export hook dan fungsi `toast` agar dapat digunakan di seluruh aplikasi.
export { useToast, toast }