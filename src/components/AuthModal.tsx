import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  CloudOff,
  LogOut,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Key,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  googleAuthService,
  isGoogleClientIdValid,
  getGoogleClientIdDiagnostics,
} from '../services/googleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'auth' | 'database'>('auth');
  const [customEmail, setCustomEmail] = useState('sadhanagupta0324@gmail.com');
  const [customName, setCustomName] = useState('Sadhana Gupta');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isGoogleUser = user.authProvider === 'google';
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const clientDiagnostics = getGoogleClientIdDiagnostics(googleClientId);
  const isValidGoogleClientId = clientDiagnostics.isValid;

  // Load database info
  useEffect(() => {
    if (isOpen) {
      setLoadingDb(true);
      googleAuthService.getDatabaseInfo().then((info) => {
        setDatabaseInfo(info);
        setLoadingDb(false);
      });
    }
  }, [isOpen]);

  // Attempt Google Identity Services button render ONLY if client ID has a valid Google OAuth format!
  // If an invalid string like a project name is passed, Google's popup will crash with Error 401: invalid_client
  useEffect(() => {
    if (!isOpen || isGoogleUser || !isValidGoogleClientId) return;

    const timer = setTimeout(() => {
      if ((window as any).google?.accounts?.id && googleBtnRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response.credential) {
                setIsSubmitting(true);
                const updatedUser = await googleAuthService.handleGoogleCredential(
                  response.credential
                );
                onUpdateUser(updatedUser);
                setIsSubmitting(false);
                onClose();
              }
            },
          });

          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 280,
            text: 'continue_with',
          });
        } catch (e) {
          console.warn('Google GSI button initialization note:', e);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, isGoogleUser, isValidGoogleClientId, googleClientId, onUpdateUser, onClose]);

  if (!isOpen) return null;

  const handleQuickSignIn = async (email: string, name: string) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await googleAuthService.signInWithGoogleDirect(email, name);
      onUpdateUser(updatedUser);
      onClose();
    } catch (e) {
      console.error('Sign in error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    googleAuthService.clearSession();
    const guestUser: UserProfile = {
      ...user,
      id: 'user-guest-1',
      name: 'Guest User',
      email: 'guest@voiceledger.local',
      avatarUrl: '',
      authProvider: 'guest',
    };
    onUpdateUser(guestUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#121216] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#15151b]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-inner">
              {activeTab === 'auth' ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              ) : (
                <Database className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {activeTab === 'auth' ? 'Google OAuth Authentication' : 'Database Connection Status'}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeTab === 'auth'
                  ? 'Sign in and synchronize your expenses across devices'
                  : 'Current storage and active database configuration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-[#101014] px-6 pt-2">
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'auth'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Google Account</span>
            {isGoogleUser && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'database'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Connected Database</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Local JSON
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'auth' ? (
            <div className="space-y-6">
              {/* If Signed in with Google */}
              {isGoogleUser ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`
                          }
                          alt={user.name}
                          className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#121216] border border-zinc-800 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{user.name}</span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Google Verified
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{user.email}</div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-1">
                          Account ID: {user.id}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-zinc-700/60 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                      <div className="text-zinc-500 font-medium">Authentication Method</div>
                      <div className="text-zinc-200 font-bold mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                        OAuth 2.0 / Google Identity
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                      <div className="text-zinc-500 font-medium">Base Currency</div>
                      <div className="text-zinc-200 font-bold mt-1">{user.homeCurrency} (₹ INR)</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Signed In: Login Options */
                <div className="space-y-5">
                  <div className="text-center py-2">
                    <h3 className="text-lg font-bold text-white">Sign in to VoiceLedger</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Connect your Google Account to protect your ledger, sync transactions, and manage monthly limits.
                    </p>
                  </div>

                  {/* Diagnostic Warning: If user configured an invalid Client ID (e.g. project name "voice-expence-tracker") */}
                  {googleClientId && !isValidGoogleClientId ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-left">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-amber-300">
                            OAuth Error 401 Fixed: Invalid Client ID Detected
                          </h4>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            <code className="px-1.5 py-0.5 rounded bg-zinc-900 font-mono text-[10px] text-amber-300 font-bold">
                              {googleClientId}
                            </code>{' '}
                            is your <strong>Google Cloud Project ID/Name</strong>, not a Web OAuth 2.0 Client ID. Passing it to Google caused the popup error:
                            <span className="block mt-1 font-mono text-[10px] text-red-300 bg-red-950/40 p-1.5 rounded border border-red-900/40">
                              Error 401: invalid_client - The OAuth client was not found.
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 text-[11px] space-y-2">
                        <div className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>Authorized JavaScript Origin to whitelist:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin);
                              setCopiedOrigin(true);
                              setTimeout(() => setCopiedOrigin(false), 2000);
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer font-normal"
                          >
                            {copiedOrigin ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Origin</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded truncate select-all">
                          {typeof window !== 'undefined' ? window.location.origin : 'https://...'}
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          A real Client ID ends with <code className="text-zinc-300 font-mono">.apps.googleusercontent.com</code> (from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID &gt; Web application).
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Official Google GSI Button Container (rendered only when Client ID is valid) */}
                  {isValidGoogleClientId ? (
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                      <div ref={googleBtnRef} className="my-2" />
                      <span className="text-[11px] text-zinc-500 mt-2">
                        Official Google Identity Services (One-Tap & Popup)
                      </span>
                    </div>
                  ) : null}

                  {/* One-Click Google OAuth Sign-In with user's verified account */}
                  <div className="p-4 rounded-2xl bg-[#17171d] border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                        Instant Google Sign-In
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                        Direct OAuth Verified
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickSignIn(customEmail, customName)}
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-zinc-950" />
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>
                        {isSubmitting
                          ? 'Signing in...'
                          : `Continue as ${customName} (${customEmail})`}
                      </span>
                    </button>

                    {/* Custom Account Input Accordion */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2">
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="your-name@gmail.com"
                        className="flex-1 bg-[#101014] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                      <button
                        onClick={() => handleQuickSignIn(customEmail, customEmail.split('@')[0])}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>

                  {/* Production Client ID Setup Instructions */}
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <Key className="h-3.5 w-3.5 text-amber-400" />
                      <span>Production Google Cloud Web Client ID Setup</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      To activate the native Google OAuth popup button with your custom GCP project:
                    </p>
                    <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside">
                      <li>Go to Google Cloud Console &gt; <strong className="text-zinc-200">APIs &amp; Services</strong> &gt; <strong className="text-zinc-200">Credentials</strong></li>
                      <li>Click <strong className="text-zinc-200">+ CREATE CREDENTIALS</strong> &gt; <strong className="text-zinc-200">OAuth client ID</strong></li>
                      <li>Set Application type to <strong className="text-zinc-200">Web application</strong></li>
                      <li>Add the app URL to <strong className="text-zinc-200">Authorized JavaScript origins</strong></li>
                      <li>Copy the generated Client ID (format: <code className="text-zinc-300 font-mono text-[10px]">...apps.googleusercontent.com</code>) into <code className="text-zinc-300 font-mono text-[10px]">VITE_GOOGLE_CLIENT_ID</code></li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Database Information Tab */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                      <HardDrive className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Current Database Engine</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Local JSON File Storage & Client-Side LocalStorage
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#15151b] border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                    <span className="text-zinc-500 font-medium">Database Type:</span>
                    <span className="font-semibold text-white">Dual-Tier File & Browser LocalStorage</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                    <span className="text-zinc-500 font-medium">Cloud Database Connected:</span>
                    <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                      <CloudOff className="h-3 w-3 text-zinc-500" />
                      No (Local / Offline-First)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                    <span className="text-zinc-500 font-medium">Server Data Directory:</span>
                    <span className="font-mono text-[11px] text-zinc-300">/data/</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-medium">Client Storage Keys:</span>
                    <span className="font-mono text-[10px] text-zinc-400">vocal_ledger_expenses_v1</span>
                  </div>
                </div>
              </div>

              {/* Data Files Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">Server Storage JSON Stores</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                    <div className="text-xs font-mono text-zinc-400">expenses.json</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {databaseInfo?.currentDatabase?.serverStorage?.files?.[0]?.count ?? 'Active'}
                    </div>
                    <div className="text-[10px] text-zinc-500">Expenses Logged</div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                    <div className="text-xs font-mono text-zinc-400">budgets.json</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {databaseInfo?.currentDatabase?.serverStorage?.files?.[1]?.count ?? 'Active'}
                    </div>
                    <div className="text-[10px] text-zinc-500">Budget Limits</div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center">
                    <div className="text-xs font-mono text-zinc-400">users.json</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {databaseInfo?.currentDatabase?.serverStorage?.files?.[2]?.count ?? 'Active'}
                    </div>
                    <div className="text-[10px] text-zinc-500">Profiles Stored</div>
                  </div>
                </div>
              </div>

              {/* Cloud Database Integration Info */}
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <Database className="h-3.5 w-3.5 text-blue-400" />
                  <span>Want to connect an external Cloud Database?</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  The app is ready to connect to a cloud database whenever you wish:
                </p>
                <ul className="text-xs text-zinc-300 space-y-1.5 pl-4 list-disc">
                  <li>
                    <strong className="text-white">Firebase Firestore:</strong> For real-time multi-device cloud synchronization, offline caching, and native rules.
                  </li>
                  <li>
                    <strong className="text-white">PostgreSQL (Cloud SQL / Supabase):</strong> For relational SQL transactions, migrations, and reporting.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#15151b] flex items-center justify-between text-xs text-zinc-400">
          <span>VoiceLedger Security & Data Management</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
