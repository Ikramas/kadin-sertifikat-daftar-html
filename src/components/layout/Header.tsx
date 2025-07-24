import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang di Portal SBU Kadin Indonesia</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};