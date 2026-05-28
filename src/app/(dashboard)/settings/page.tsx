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
  Server,
} from 'lucide-react';

interface BackupMeta {
  exists: boolean;
  name: string;
  created_at: string;
  size_kb: number;
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
};

const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-base)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  fontFamily: 'var(--font-sans)',
};

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<{ name: string; username: string } | null>(null);
  const [backupMeta, setBackupMeta] = useState<BackupMeta>({
    exists: false,
    name: 'N/A',
    created_at: 'N/A',
    size_kb: 0,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setCurrentUser({ name: data.user.name, username: data.user.username });
          }
        }
      } catch (err) {
        console.warn('Could not retrieve user profile:', err);
      }
    };
    fetchUserProfile();

    const fetchBackupInfo = async () => {
      try {
        const res = await fetch('/api/backup/last');
        if (res.ok) {
          const data = await res.json();
          if (data.exists) setBackupMeta(data);
        }
      } catch (err) {
        console.warn('Could not load backup info:', err);
      }
    };
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
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
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
      if (!res.ok) throw new Error(data.error || 'Password update failed.');
      setStatus({ type: 'success', message: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const runManualBackup = async () => {
    const token = prompt('Enter BACKUP_CRON_SECRET to trigger manual backup:');
    if (!token) return;
    try {
      const res = await fetch('/api/backup', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        alert('Backup executed successfully.');
        window.location.reload();
      } else {
        alert('Backup failed: ' + (data.error || 'Unauthorized'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || '?';

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: 300 }}>
          Manage your profile and system configurations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg:grid-cols-[280px_1fr]">

        {/* Left column: Profile + System health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <User size={16} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Founder Profile</h2>
            </div>

            {/* Avatar + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '14px',
                backgroundColor: 'var(--bg-container)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)',
                marginBottom: '12px', userSelect: 'none',
              }}>
                {currentUser ? getInitials(currentUser.name) : '?'}
              </div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {currentUser?.name || 'Loading...'}
              </p>
              {currentUser?.username && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 4px', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                  @{currentUser.username}
                </p>
              )}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 12px', fontWeight: 300 }}>
                reOWN Founding Partner
              </p>
              <span style={{
                padding: '4px 12px', borderRadius: '100px', fontSize: '10px', fontWeight: 700,
                backgroundColor: 'rgba(254,185,4,0.12)', border: '1px solid rgba(254,185,4,0.25)',
                color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                Full Admin Access
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={sectionLabel}>Username</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '5px 0 0', fontFamily: 'var(--font-mono)' }}>
                  {currentUser?.username ? `@${currentUser.username}` : '—'}
                </p>
              </div>
              <div>
                <p style={sectionLabel}>Role</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '5px 0 0', lineHeight: 1.5, fontWeight: 300 }}>
                  Equal view & write access to all expense records and the full audit ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Infrastructure status */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Server size={16} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Infrastructure</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Database Node', status: 'Always-On' },
                { label: 'File Storage', status: 'Connected' },
              ].map(({ label, status }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Password + Backups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Change password */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <KeyRound size={16} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Security & Password</h2>
            </div>

            {status && (
              <div
                className="animate-slideDown"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: status.type === 'success' ? 'rgba(46,125,50,0.08)' : 'var(--danger-light)',
                  border: `1px solid ${status.type === 'success' ? 'rgba(46,125,50,0.25)' : 'rgba(186,26,26,0.25)'}`,
                  color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {status.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                <span>{status.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={sectionLabel}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    placeholder="Your current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                    style={{ ...inputStyle, paddingLeft: '36px' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={sectionLabel}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      style={{ ...inputStyle, paddingLeft: '36px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={sectionLabel}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      style={{ ...inputStyle, paddingLeft: '36px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 22px', borderRadius: '8px', border: 'none',
                    backgroundColor: 'var(--accent)', color: 'var(--accent-fg)',
                    fontSize: '13px', fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-dim)'; }}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
                >
                  {isLoading ? 'Updating...' : <><span>Update Password</span><ArrowRight size={15} /></>}
                </button>
              </div>
            </form>
          </div>

          {/* Backup card */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Automated Backups</h2>
              </div>
              <button
                onClick={runManualBackup}
                style={{
                  padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)',
                  backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px',
                  fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Trigger Manual Backup
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.7, fontWeight: 300 }}>
              Data is protected via continuous Supabase point-in-time snapshots, daily automated CSV backups at 2:00 AM IST, and manual export tools available on the Export page.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={sectionLabel}>Last Auto-Backup</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', margin: '6px 0 0', lineHeight: 1.3 }}>
                  {backupMeta.exists
                    ? new Date(backupMeta.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Pending execution'}
                </p>
              </div>
              <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <p style={sectionLabel}>Latest Archive</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', margin: '6px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {backupMeta.name}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '8px',
              backgroundColor: 'rgba(254,185,4,0.06)', border: '1px solid rgba(254,185,4,0.20)',
            }}>
              <AlertTriangle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
                Backup archives are stored in a private Supabase Storage bucket and retained for 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
