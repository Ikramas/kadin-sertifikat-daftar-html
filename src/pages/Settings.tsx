import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLanguage } from '@/hooks/useLanguage';
import { User, Mail, Phone, Building2, Calendar, Shield, MapPin, Globe, Bell, Lock, Palette, HelpCircle, Trash2, Save, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mengimpor interface User dan Company dari file types yang sesuai
import type { User as UserData } from '@/types/user';
import type { Company as CompanyData } from '@/types/company';

// Mock update functions (replace with actual API calls)
// Tetap sebagai mock sampai Anda mengimplementasikan endpoint backend sebenarnya.
const mockUpdateUserProfile = async (userId: string, data: Partial<UserData>) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Updating user profile:', userId, data);
      resolve({ status: 'success', message: 'Profil pengguna berhasil diperbarui.' });
    }, 1000);
  });
};

const mockUpdateCompanyProfile = async (companyId: string, data: Partial<CompanyData>) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Updating company profile:', companyId, data);
      resolve({ status: 'success', message: 'Profil perusahaan berhasil diperbarui.' });
    }, 1000);
  });
};

const mockChangePassword = async (userId: string, newPassword: string) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (newPassword.length < 8) {
        reject({ status: 'error', message: 'Password minimal 8 karakter.' });
      } else {
        console.log('Changing password for user:', userId);
        resolve({ status: 'success', message: 'Password berhasil diubah.' });
      }
    }, 1000);
  });
};

export default function Settings() {
  const { user, company, fetchUserProfile, logout } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const { getCurrentLanguage, changeLanguage, getAvailableLanguages } = useLanguage();

  const [editUserMode, setEditUserMode] = useState(false);
  const [editCompanyMode, setEditCompanyMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form states for user data
  const [userName, setUserName] = useState(user?.name || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '');

  // Form states for company data
  const [companyName, setCompanyName] = useState(company?.company_name || '');
  const [companyAddress, setCompanyAddress] = useState(company?.address || '');
  const [companyEmail, setCompanyEmail] = useState(company?.company_email || '');
  const [companyPhone, setCompanyPhone] = useState(company?.company_phone || ''); 


  // Notification settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Theme settings state (mock)
  const [appTheme, setAppTheme] = useState('system'); // 'light', 'dark', 'system'


  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserPhone(user.phone);
    }
    if (company) {
      setCompanyName(company.company_name);
      setCompanyAddress(company.address);
      setCompanyEmail(company.company_email);
      setCompanyPhone(company.company_phone);
    }
  }, [user, company]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary">Menunggu Verifikasi Email</Badge>;
      case 'pending_document_verification':
        return <Badge variant="outline">Menunggu Dokumen Registrasi</Badge>;
      case 'pending_admin_approval':
        return <Badge className="bg-warning text-warning-foreground">Menunggu Persetujuan Admin</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Dibekukan</Badge>;
      default:
        return <Badge variant="outline">Tidak Diketahui</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tidak tersedia';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveUserProfile = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        handleError(new Error('User not authenticated.'), 'update_user_profile');
        return;
      }

      // 1. Ambil CSRF Token
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success') {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;

      // 2. Lakukan Panggilan API Sebenarnya
      const token = localStorage.getItem('token');
      const response = await fetch('/backend/api/users/update-profile.php', { // Ganti dengan endpoint Anda
        method: 'POST', // Atau 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          name: userName,
          phone: userPhone, // Mengirim 'phone' untuk pengguna
          csrf_token: csrfToken // Pastikan token juga dikirim di body jika backend membutuhkannya
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchUserProfile(); // Re-fetch user profile untuk memperbarui context
        handleSuccess('Profil pengguna berhasil diperbarui.');
        setEditUserMode(false);
      } else {
        throw new Error(data.message || 'Gagal memperbarui profil pengguna.');
      }
    } catch (error) {
      handleError(error, 'update_user_profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompanyProfile = async () => {
    setIsSaving(true);
    try {
      if (!company) {
        handleError(new Error('Company data not available.'), 'update_company_profile');
        return;
      }

      // 1. Ambil CSRF Token
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success') {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;

      // 2. Lakukan Panggilan API Sebenarnya
      const token = localStorage.getItem('token');
      const response = await fetch('/backend/api/users/update-profile.php', { // Ganti dengan endpoint Anda
        method: 'POST', // Atau 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          company_name: companyName,
          address: companyAddress,
          company_email: companyEmail,
          company_phone: companyPhone, // Mengirim 'company_phone' untuk perusahaan
          csrf_token: csrfToken
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        await fetchUserProfile(); // Re-fetch user profile untuk memperbarui context
        handleSuccess('Profil perusahaan berhasil diperbarui.');
        setEditCompanyMode(false);
      } else {
        throw new Error(data.message || 'Gagal memperbarui profil perusahaan.');
      }
    } catch (error) {
      handleError(error, 'update_company_profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        handleError(new Error('User not authenticated.'), 'change_password');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error('Konfirmasi password tidak cocok.');
      }
      if (newPassword.length < 8) {
        throw new Error('Password baru minimal 8 karakter.');
      }

      // 1. Ambil CSRF Token
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success') {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;
      
      // 2. Lakukan Panggilan API Sebenarnya
      const token = localStorage.getItem('token');
      const response = await fetch('/backend/api/users/change-password.php', { // Ganti dengan endpoint Anda
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmNewPassword,
          csrf_token: csrfToken
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        handleSuccess('Password Anda berhasil diubah.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        throw new Error(data.message || 'Gagal mengubah password.');
      }
    } catch (error) {
      handleError(error, 'change_password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    // Ini adalah fitur yang sensitif. Anda akan membutuhkan endpoint backend DELETE
    // dan kemungkinan konfirmasi lebih lanjut (misalnya, OTP kedua atau input password).
    toast({
      title: 'Hapus Akun',
      description: 'Fitur hapus akun akan segera tersedia setelah implementasi backend yang aman.',
      variant: 'default',
    });
    // Contoh panggilan API DELETE (jika endpoint sudah ada):
    /*
    try {
        if (window.confirm("Apakah Anda yakin ingin menghapus akun Anda secara permanen?")) {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/backend/api/users/delete-account.php', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.status === 'success') {
                handleSuccess('Akun Anda telah berhasil dihapus.');
                logout(); // Logout pengguna setelah akun dihapus
            } else {
                throw new Error(data.message || 'Gagal menghapus akun.');
            }
        }
    } catch (error) {
        handleError(error, 'delete_account');
    } finally {
        setIsSaving(false);
    }
    */
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola preferensi akun, profil, dan notifikasi Anda
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="profile">Profil & Akun</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="appearance">Tampilan</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
        </TabsList>

        {/* Tab Content: Profile & Account */}
        <TabsContent value="profile" className="space-y-6">
          {/* User Information Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informasi Akun
                </CardTitle>
                <CardDescription>Kelola data pribadi Anda</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditUserMode(!editUserMode)}>
                {editUserMode ? 'Batal' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Nama Lengkap</Label>
                  <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} disabled={!editUserMode || isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input id="userEmail" value={user?.email} disabled readOnly className="opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Nomor Telepon</Label>
                  <Input id="userPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} disabled={!editUserMode || isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Status Akun</Label>
                  {user?.status && getStatusBadge(user.status)}
                </div>
              </div>
              {editUserMode && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveUserProfile} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Information Card */}
          {company && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Informasi Perusahaan
                  </CardTitle>
                  <CardDescription>Kelola data perusahaan Anda</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditCompanyMode(!editCompanyMode)}>
                  {editCompanyMode ? 'Batal' : 'Edit'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nama Perusahaan</Label>
                    <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={!editCompanyMode || isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email Perusahaan</Label>
                    <Input id="companyEmail" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} disabled={!editCompanyMode || isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Telepon Perusahaan</Label>
                    <Input id="companyPhone" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} disabled={!editCompanyMode || isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Alamat Perusahaan</Label>
                    <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} disabled={!editCompanyMode || isSaving} />
                  </div>
                </div>
                {editCompanyMode && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveCompanyProfile} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                )}
                <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">NPWP:</p> {company.npwp || 'N/A'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">NIB:</p> {company.nib || 'N/A'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">KTA KADIN:</p> {company.kta_kadin_number || 'N/A'} (Tanggal: {formatDate(company.kta_date)})
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Status Verifikasi:</p> {getStatusBadge(company.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>Perbarui password akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Konfirmasi Password Baru</Label>
                <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} disabled={isSaving} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Mengubah...' : 'Ubah Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pengaturan Notifikasi
              </CardTitle>
              <CardDescription>Pilih jenis notifikasi yang ingin Anda terima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
                  <span>Notifikasi Email</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Dapatkan pembaruan status permohonan melalui email.
                  </span>
                </Label>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={isSaving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="inAppNotifications" className="flex flex-col space-y-1">
                  <span>Notifikasi Dalam Aplikasi</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Tampilkan notifikasi langsung di portal.
                  </span>
                </Label>
                <Switch
                  id="inAppNotifications"
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                  disabled={isSaving}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSuccess('Pengaturan notifikasi disimpan.')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Tampilan
              </CardTitle>
              <CardDescription>Sesuaikan tampilan portal Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appTheme">Tema Aplikasi</Label>
                <Select value={appTheme} onValueChange={setAppTheme} disabled={isSaving}>
                  <SelectTrigger id="appTheme">
                    <SelectValue placeholder="Pilih tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Bahasa</Label>
                <Select value={getCurrentLanguage()} onValueChange={changeLanguage} disabled={isSaving}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Pilih bahasa" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSuccess('Pengaturan tampilan disimpan.')} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content: Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Status Keamanan
              </CardTitle>
              <CardDescription>Informasi penting terkait keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span>Email Terverifikasi</span>
                </div>
                <Badge className="bg-success text-success-foreground">
                  {user?.email_verified_at ? 'Aktif' : 'Belum Aktif'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                  <span>Terakhir Diperbarui</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(user?.updated_at || '')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bagian "Hapus Akun" dikomentari sesuai permintaan */}
          {/*
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Hapus Akun
              </CardTitle>
              <CardDescription>Hapus akun Anda secara permanen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Menghapus akun akan menghapus semua data Anda secara permanen dan tidak dapat dikembalikan.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSaving}>
                <XCircle className="w-4 h-4 mr-2" />
                {isSaving ? 'Memproses...' : 'Hapus Akun Saya'}
              </Button>
            </CardContent>
          </Card>
          */}
        </TabsContent>
      </Tabs>
    </div>
  );
}