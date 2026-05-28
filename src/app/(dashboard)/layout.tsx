'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Download, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Activity', href: '/activity', icon: History },
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userName, setUserName] = useState('Founder');
  const [userEmail, setUserEmail] = useState('');

  // Hydrate user info from JWT session dynamically from the /api/auth/me route
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUserName(data.user.name);
            setUserEmail(data.user.email);
            sessionStorage.setItem('user_profile', JSON.stringify(data.user));
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.warn('Could not retrieve fresh user info:', err);
      }
    };
    fetchUser();
  }, [router]);

  // Theme support
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = (savedTheme as 'light' | 'dark') || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        sessionStorage.clear();
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row transition-colors duration-300">
      
      {/* 1. COLLAPSIBLE SIDEBAR FOR DESKTOP */}
      <aside 
        className={`hidden md:flex flex-col bg-bg-surface border-r border-border transition-all duration-300 z-30 sticky top-0 h-screen shrink-0 ${
          isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      >
        {/* Brand/Logo Area */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link href="/" className="flex items-center gap-3 select-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-accent-fg shadow-sm shrink-0">
              <span className="font-display font-black text-lg tracking-tighter">re</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="font-display font-extrabold text-lg tracking-tight">
                re<span className="font-normal opacity-90">OWN</span> <span className="text-[#feb904] font-semibold">Spends</span>
              </span>
            )}
          </Link>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-bg-subtle border-border text-text-primary shadow-xs font-bold' 
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle/50'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Theme toggle & Profile) */}
        <div className="p-4 border-t border-border space-y-4 bg-bg-surface">
          {/* Theme Switcher inside Sidebar */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-all ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* User Profile Info */}
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-bg-subtle border border-border flex items-center justify-center font-bold text-accent shrink-0 select-none shadow-inner">
              {getInitials(userName)}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-text-primary leading-tight">{userName}</p>
                <p className="text-xs text-text-secondary truncate font-light leading-tight">Founder</p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/10 cursor-pointer transition-all ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP NAVIGATION BAR */}
      <header className="md:hidden flex items-center justify-between bg-bg-surface border-b border-border px-4 h-16 sticky top-0 z-30 w-full transition-colors duration-300">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-accent-fg shadow-sm">
            <span className="font-display font-black text-sm tracking-tighter">re</span>
          </div>
          <span className="font-display font-extrabold text-md tracking-tight">
            re<span className="font-normal opacity-90">OWN</span> <span className="text-[#feb904] font-semibold">Spends</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Quick theme toggle on mobile */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Toggle Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Dropdown Drawer overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-bg-base pt-16 animate-fadeIn transition-colors duration-300">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-base font-semibold cursor-pointer border ${
                    isActive 
                      ? 'bg-bg-subtle border-border text-text-primary font-bold shadow-xs' 
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-border space-y-4 bg-bg-surface">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center font-bold text-accent shadow-inner">
                {getInitials(userName)}
              </div>
              <div>
                <p className="text-base font-bold text-text-primary leading-tight">{userName}</p>
                <p className="text-xs text-text-secondary font-light leading-tight">Founder</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-danger/10 hover:bg-danger/20 text-danger text-sm font-bold cursor-pointer transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1400px] w-full mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* 4. BOTTOM TAB BAR FOR MOBILE DEVICE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface border-t border-border flex items-center justify-around z-30 transition-colors duration-300 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-accent' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={18} className={isActive ? 'scale-105 transition-transform' : ''} />
              <span className={`text-[9px] mt-1 font-semibold ${isActive ? 'font-bold' : 'font-light'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
