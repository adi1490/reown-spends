'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, Sun, Moon } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Handle initial theme detection
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

  // Toggle dark/light theme
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-bg-base p-4 relative overflow-hidden transition-colors duration-300">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent/5 dark:bg-accent/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/5 dark:bg-accent/3 blur-[120px] pointer-events-none" />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl border border-border bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-all duration-200 cursor-pointer shadow-sm hover-lift"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="w-full max-w-[440px] z-10">
        {/* Brand Logo & Tagline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-accent mb-4 text-accent-fg shadow-md">
            <span className="font-display font-bold text-2xl tracking-tighter">re</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
            re<span className="font-normal opacity-90">OWN</span> <span className="text-[#feb904] dark:text-[#feb904] font-semibold">Spends</span>
          </h1>
          <p className="text-sm text-text-secondary mt-2 font-light">
            Private Financial Wealth & Expense Tracker
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-surface border border-border rounded-3xl p-8 shadow-xl transition-all duration-300 relative overflow-hidden">
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium animate-shake">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@reown.sale"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-12 pr-12 py-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-text-secondary select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-border text-accent bg-bg-subtle focus:ring-accent cursor-pointer accent-accent"
                />
                <span>Remember me for 7 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl font-bold bg-[#feb904] text-black hover:bg-[#e0a403] focus:ring-4 focus:ring-accent/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-accent/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Access Platform</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Secure Footer Notice */}
        <p className="text-center text-xs text-text-muted mt-8 font-light leading-relaxed">
          Authorized personnel only. Activities logged under company audit protocol.<br />
          REOWN INFOCOM LLP © 2026. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen w-full flex items-center justify-center bg-bg-base p-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
