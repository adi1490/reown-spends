'use client';

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Database, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  User, 
  ArrowRight,
  ShieldAlert,
  Server
} from 'lucide-react';

interface BackupMeta {
  exists: boolean;
  name: string;
  created_at: string;
  size_kb: number;
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [backupMeta, setBackupMeta] = useState<BackupMeta>({
    exists: false,
    name: 'N/A',
    created_at: 'N/A',
    size_kb: 0
  });

  // Fetch session data and backup status
  useEffect(() => {
    // 1. Fetch user from session storage
    const storedUser = sessionStorage.getItem('user_profile');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // Fallback
      setCurrentUser({ name: 'Narasimha', email: 'narasimha@reown.sale' });
    }

    // 2. Fetch last backup info
    const fetchBackupInfo = async () => {
      try {
        const res = await fetch('/api/backup/last'); // we will implement this API route
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setBackupMeta(data);
          }
        }
      } catch (err) {
        console.warn('Could not load backup metadata:', err);
      }
    };
    
    // We'll call this after we implement the api
    fetchBackupInfo();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password update failed.');
      }

      setStatus({ type: 'success', message: 'Your password was successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const runManualBackup = async () => {
    // Call manual backup trigger to verify it works
    const token = prompt('Enter the BACKUP_CRON_SECRET to execute manual database backup:');
    if (!token) return;

    try {
      const res = await fetch('/api/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Backup executed successfully! Check storage. Result: ' + JSON.stringify(data));
        // Refresh backup meta
        window.location.reload();
      } else {
        alert('Backup failed: ' + (data.error || 'Unauthorized'));
      }
    } catch (err: any) {
      alert('Error triggering backup: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-light">
          Manage your founder profile and system configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <User size={20} className="text-accent" />
              <span>Founder Profile</span>
            </h2>
            <div className="flex flex-col items-center py-6 text-center border-b border-border mb-6">
              <div className="w-20 h-20 rounded-2xl bg-bg-subtle border border-border flex items-center justify-center font-bold text-3xl text-accent shadow-inner select-none mb-4">
                {currentUser ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'F'}
              </div>
              <p className="text-lg font-bold text-text-primary">{currentUser?.name || 'Founder'}</p>
              <p className="text-xs text-text-secondary font-light mt-0.5">reOWN Founding Partner</p>
              <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent/15 text-[#e0a403] border border-accent/25">
                Full Admin Privilege
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Registered Email</p>
                <p className="text-sm text-text-primary mt-1 font-medium">{currentUser?.email || 'name@reown.sale'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Role Description</p>
                <p className="text-sm text-text-primary mt-1 font-light leading-relaxed">
                  Has equal view/mutate permissions for expense records and full visibility into the company activity ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="bg-bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Server size={20} className="text-accent" />
              <span>Infrastructure Status</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-subtle border border-border text-sm">
                <span className="text-text-secondary font-medium">Database Node</span>
                <span className="flex items-center gap-1.5 font-bold text-[#2e7d32]">
                  <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse" />
                  <span>Always-On</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-subtle border border-border text-sm">
                <span className="text-text-secondary font-medium">File Storage</span>
                <span className="flex items-center gap-1.5 font-bold text-[#2e7d32]">
                  <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse" />
                  <span>Connected</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card & System Backups */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Change Password Form */}
          <div className="bg-bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
              <KeyRound size={20} className="text-accent" />
              <span>Security & Password</span>
            </h2>

            {status && (
              <div className={`mb-6 flex items-start gap-3 p-4 rounded-2xl border text-sm font-medium animate-fadeIn ${
                status.type === 'success' 
                  ? 'bg-accent/15 border-accent/25 text-[#cda005] dark:text-[#feb904]' 
                  : 'bg-danger/10 border-danger/20 text-danger'
              }`}>
                {status.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <ShieldAlert size={18} className="shrink-0 mt-0.5" />}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Current Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-bg-subtle/50 text-text-primary text-sm focus:outline-none focus:border-accent focus:bg-bg-surface focus:ring-4 focus:ring-accent/15 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 rounded-2xl font-bold bg-[#feb904] text-black hover:bg-[#e0a403] focus:ring-4 focus:ring-accent/30 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-accent/15 flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* System Data Backup Details */}
          <div className="bg-bg-surface border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Database size={20} className="text-accent" />
                <span>Automated Data Backup</span>
              </h2>
              
              <button
                onClick={runManualBackup}
                className="self-start sm:self-auto px-4 py-2 text-xs font-bold rounded-xl border border-border hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-sm hover-lift"
              >
                Trigger Manual Backup
              </button>
            </div>

            <p className="text-sm text-text-secondary font-light leading-relaxed">
              Financial data is protected via 3 layers of redundancy: continuous automated point-in-time snapshots in Supabase, daily cron backups (2:00 AM IST) uploaded as secure CSV archives inside private storage, and manual Excel exports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
              <div className="p-4 rounded-2xl bg-bg-subtle border border-border space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Last Auto-Backup Date</p>
                <p className="text-sm font-bold text-text-primary font-tabular">
                  {backupMeta.exists ? new Date(backupMeta.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Pending execution...'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-bg-subtle border border-border space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Latest Archive File</p>
                <p className="text-sm font-bold text-text-primary truncate" title={backupMeta.name}>
                  {backupMeta.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#feb904]/10 border border-[#feb904]/25 text-[#cda005] dark:text-[#feb904] text-xs">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="font-light">
                Backup archives are stored in a private Supabase Storage bucket (`backups`) and are retained for 30 days. Old records are automatically recycled.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
