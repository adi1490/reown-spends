'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, User, ShieldAlert, LogIn, Sun, Moon } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = (savedTheme as 'light' | 'dark') || systemTheme;
    setTheme(activeTheme);
    if (activeTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase().trim(), password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      // Cache non-sensitive display info for instant profile render
      if (data.user) {
        localStorage.setItem('reown_user', JSON.stringify({ name: data.user.name, username: data.user.username }));
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.15s ease',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-base)',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          padding: '10px', borderRadius: '10px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div style={{ width: '100%', maxWidth: '420px', zIndex: 10 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            backgroundColor: 'var(--accent)', marginBottom: '20px',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--accent-fg)', letterSpacing: '-0.04em' }}>
              re
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 8px' }}>
            reOWN <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Spends</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
            Private Expense & Financial Intelligence Platform
          </p>
        </div>

        {/* Login card */}
        <div style={{
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '32px',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Founder Sign In
          </h2>

          {error && (
            <div
              className="animate-slideDown"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px', borderRadius: '8px',
                backgroundColor: 'var(--danger-light)',
                border: '1px solid rgba(186,26,26,0.25)',
                color: 'var(--danger)', fontSize: '13px', fontWeight: 500,
                marginBottom: '20px',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="username" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="e.g. narasimha"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={isLoading}
                  style={{ ...inputBase, paddingLeft: '38px', fontFamily: 'var(--font-mono)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="password" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{ ...inputBase, paddingLeft: '38px', paddingRight: '44px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span>Keep me signed in for 7 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: 'var(--accent)', color: 'var(--accent-fg)',
                fontSize: '14px', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 4px 16px rgba(254,185,4,0.25)',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; }}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            >
              {isLoading
                ? <div style={{ width: '18px', height: '18px', border: '2px solid var(--accent-fg)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                : <><LogIn size={17} /><span>Sign In</span></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', margin: '24px 0 0', lineHeight: 1.6, fontWeight: 300 }}>
          Authorized personnel only. Activities are logged under company audit protocol.<br />
          REOWN INFOCOM LLP © {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ width: '36px', height: '36px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </main>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
