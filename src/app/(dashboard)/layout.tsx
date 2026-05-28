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
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
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
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');

  // Fetch fresh user from session — no default value to avoid flash
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUserName(data.user.name);
            setUserUsername(data.user.username);
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.warn('Could not retrieve user info:', err);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const active = (saved as 'light' | 'dark') || system;
    applyTheme(active);
    setTheme(active);
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
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

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || '?';

  // Sidebar item style helper
  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: isSidebarCollapsed ? '10px 0' : '9px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
    backgroundColor: isActive ? 'var(--bg-container)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    border: isActive ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'all 0.15s ease',
    width: '100%',
  });

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        style={{
          width: isSidebarCollapsed ? '64px' : '248px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          transition: 'width 0.22s cubic-bezier(0.16,1,0.3,1)',
          flexShrink: 0,
          cursor: isSidebarCollapsed ? 'pointer' : 'default',
          overflow: 'hidden',
        }}
        className="hidden md:flex flex-col sticky top-0 h-screen z-30"
        // Click anywhere on the collapsed sidebar to expand
        onClick={(e) => {
          if (!isSidebarCollapsed) return;
          // Prevent expand if clicking a nav link
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button')) return;
          setIsSidebarCollapsed(false);
        }}
      >
        {/* Brand header */}
        <div
          style={{
            height: '60px',
            borderBottom: '1px solid var(--border)',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
            onClick={(e) => { if (isSidebarCollapsed) { e.preventDefault(); setIsSidebarCollapsed(false); } }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              backgroundColor: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: 'var(--accent-fg)', letterSpacing: '-0.03em' }}>
                re
              </span>
            </div>
            {!isSidebarCollapsed && (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                OWN <span style={{ color: 'var(--accent)' }}>Spends</span>
              </span>
            )}
          </Link>

          {/* Collapse toggle — always visible */}
          {!isSidebarCollapsed && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(true); }}
              style={{
                padding: '5px', borderRadius: '7px',
                border: '1px solid var(--border)',
                backgroundColor: 'transparent', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Expand icon shown inside collapsed sidebar header */}
          {isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                style={navLinkStyle(isActive)}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'currentColor' }} />
                {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme + profile + sign out */}
        <div style={{
          padding: '10px', borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0,
        }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: isSidebarCollapsed ? '9px 0' : '9px 12px',
              borderRadius: '9px', border: 'none',
              backgroundColor: 'transparent', color: 'var(--text-secondary)',
              fontSize: '13px', cursor: 'pointer', width: '100%',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* Profile — only shown when name is loaded (no flash) */}
          {userName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: isSidebarCollapsed ? '6px 0' : '7px 12px',
              borderRadius: '9px',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                backgroundColor: 'var(--bg-container)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '10px', color: 'var(--accent)', flexShrink: 0,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
              }}>
                {getInitials(userName)}
              </div>
              {!isSidebarCollapsed && (
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName}
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{userUsername}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: isSidebarCollapsed ? '9px 0' : '9px 12px',
              borderRadius: '9px', border: 'none',
              backgroundColor: 'transparent', color: 'var(--danger)',
              fontSize: '13px', cursor: 'pointer', width: '100%',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--danger-light)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!isSidebarCollapsed && <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="md:hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        <header style={{
          height: '52px', backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '11px', color: 'var(--accent-fg)' }}>re</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              OWN <span style={{ color: 'var(--accent)' }}>Spends</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={toggleTheme}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </header>

        {/* Mobile slide-down menu */}
        {isMobileMenuOpen && (
          <div
            className="animate-slideDown"
            style={{
              position: 'fixed', inset: '52px 0 0 0',
              backgroundColor: 'var(--bg-base)', zIndex: 39,
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              paddingBottom: '80px', // clear bottom tab bar
            }}
          >
            <nav style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '13px 16px', borderRadius: '10px',
                      textDecoration: 'none', fontSize: '15px',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? 'var(--bg-container)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                    }}
                  >
                    <Icon size={20} style={{ color: isActive ? 'var(--accent)' : 'currentColor', flexShrink: 0 }} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User + sign out in mobile drawer */}
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
              {userName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 16px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    backgroundColor: 'var(--bg-container)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px', color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)', flexShrink: 0,
                  }}>
                    {getInitials(userName)}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{userName}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>@{userUsername}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '10px',
                  border: '1px solid rgba(186,26,26,0.3)',
                  backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <LogOut size={17} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile main content — bottom padding accounts for tab bar */}
        <main style={{ flex: 1, padding: '20px 16px', paddingBottom: '80px', minWidth: 0 }}>
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '60px', backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 38, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '4px 6px', gap: '2px', textDecoration: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  minWidth: '52px', flex: 1,
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '9px', fontWeight: isActive ? 700 : 400, letterSpacing: '0.02em' }}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ─── DESKTOP MAIN CONTENT ─── */}
      <main className="hidden md:flex flex-1 flex-col min-w-0">
        <div style={{ flex: 1, padding: '40px 48px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
