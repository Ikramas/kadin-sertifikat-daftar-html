// src/components/ui/toast.tsx
// Ini adalah implementasi komponen UI toast dari Shadcn UI,
// yang menggunakan Radix UI Primitives untuk membangun notifikasi yang dapat diakses dan dianimasikan.

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast" // Import primitif toast dari Radix UI
import { cva, type VariantProps } from "class-variance-authority" // Digunakan untuk membuat varian kelas Tailwind CSS
import { X } from "lucide-react" // Ikon 'X' untuk tombol tutup toast

import { cn } from "@/lib/utils" // Import fungsi `cn` dari utilitas Anda (gabungan clsx dan tailwind-merge)
                                 // Pastikan path ini benar: src/lib/utils.ts

// ToastProvider: Konteks penyedia untuk sistem toast.
// Biasanya dibungkus di level teratas aplikasi Anda, di samping ToasterViewport.
const ToastProvider = ToastPrimitives.Provider

// ToastViewport: Area tempat toast akan dirender.
// Ini adalah kontainer yang mengelola posisi dan tumpukan toast.
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    // Menyesuaikan posisi default agar lebih fleksibel, bisa bottom-right, atau top-right
    // Untuk error, biasanya muncul di kanan atas atau bawah.
    // Fixed, z-index tinggi untuk memastikan di atas elemen lain
    className={cn(
      "fixed top-0 z-[999] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

// Definisi varian gaya untuk komponen Toast menggunakan `cva` (Class Variance Authority).
// Ini memungkinkan Anda untuk dengan mudah menentukan gaya yang berbeda (misalnya, default, destructive, success).
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all " +
  "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] " +
  "data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out " +
  "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full " +
  "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-white text-foreground", // Varian default: latar putih, teks foreground
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground", // Varian destruktif: latar merah, teks putih
        success: // Contoh penambahan varian 'success'
          "success group border-green-500 bg-green-500 text-white", // Varian sukses: latar hijau, teks putih
        // Menambahkan varian info dan warning agar lebih fleksibel
        info: "border-blue-500 bg-blue-500 text-white",
        warning: "border-orange-500 bg-orange-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default", // Varian default jika tidak ada yang ditentukan
    },
  }
)

// Komponen Toast utama.
// Ini adalah wrapper untuk konten toast dan tombol tutup.
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> // Gabungkan properti ToastPrimitives.Root dengan varian gaya
>(({ className, variant, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)} // Terapkan varian dan kelas tambahan
      {...props}
    >
      {children} {/* Konten toast akan dirender di sini */}
      {/* Tombol tutup toast */}
      {/* Memastikan opacity default tombol X adalah 100% agar selalu terlihat */}
      <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
        <X className="h-4 w-4" /> {/* Ikon 'X' */}
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

// ToastAction: Komponen untuk tombol aksi di dalam toast (misalnya "Undo").
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

// ToastClose: Komponen untuk tombol tutup toast.
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-100 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100", // Default opacity menjadi 100%
      className
    )}
    // Catatan: Properti `ToastOptions` biasanya tidak ada di sini,
    // mungkin ini sisa dari implementasi sebelumnya atau typo.
    // Jika tidak menyebabkan error, biarkan saja. Jika ya, hapus.
    // DURATION_AUTO di Radix digunakan untuk mengabaikan auto-dismiss
    // agar toast tetap terbuka sampai di-dismiss oleh pengguna atau kode.
    // Sebaiknya durasi dikontrol dari use-toast.ts atau pada komponen Toaster.
    // Menghapus `ToastOptions={{ duration: 0 }}` adalah praktik yang lebih umum jika tidak ada efek yang diinginkan.
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

// ToastTitle: Komponen untuk judul toast.
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

// ToastDescription: Komponen untuk deskripsi atau isi toast.
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Definisi tipe `ToastProps` dan `ToastActionElement`
// Ini diekspor agar dapat digunakan oleh `use-toast.ts` dan komponen lain.
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

// Export semua komponen dan tipe yang diperlukan.
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  type ToastProps,
  type ToastActionElement,
}