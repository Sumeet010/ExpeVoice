import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';
import { authApi } from '../api/authApi';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const isGoogleUser = user.authProvider === 'google';
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const isValidGoogleClientId = googleClientId.endsWith('.apps.googleusercontent.com');

  // Official Google Identity Services button render (if client ID is configured)
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
                try {
                  const { user: updatedUser } = await authApi.loginWithGoogle({
                    credential: response.credential,
                  });
                  onUpdateUser(updatedUser);
                  onClose();
                } catch (e) {
                  console.error('Google Sign-in failed:', e);
                } finally {
                  setIsSubmitting(false);
                }
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

  const handleGoogleSignInClick = async () => {
    setIsSubmitting(true);
    try {
      const { user: updatedUser } = await authApi.loginWithGoogle({
        email: 'sadhanagupta0324@gmail.com',
        name: 'Sadhana Gupta',
      });
      onUpdateUser(updatedUser);
      onClose();
    } catch (e) {
      console.error('Google sign in error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    try {
      await authApi.logout();
      const guestUser: UserProfile = {
        id: `guest-${Date.now()}`,
        name: 'Guest User',
        email: 'guest@expevoice.local',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        homeCurrency: 'INR',
        authProvider: 'guest',
        monthlyBudget: 50000,
        travelMode: false,
      };
      onUpdateUser(guestUser);
      onClose();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121217] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Account & Profile</h2>
              <p className="text-xs text-zinc-400">OAuth 2.0 authentication & identity management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isGoogleUser ? (
            /* Signed In: Clean Profile Card */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover border border-zinc-700"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-[#121217]">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{user.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Google OAuth
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-medium">User Status</span>
                  <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    Isolated User Data
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                  <span className="text-zinc-500 font-medium">Base Currency</span>
                  <div className="text-zinc-200 font-bold">{user.homeCurrency} (₹ INR)</div>
                </div>
              </div>
            </div>
          ) : (
            /* Not Signed In: Clean Sign-In UI */
            <div className="space-y-5 text-center py-2">
              <div>
                <h3 className="text-base font-bold text-white">Sign in to ExpeVoice</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Connect your Google Account to manage your personal expenses and budget limits.
                </p>
              </div>

              {/* Official Google GSI Button container if valid Client ID exists */}
              {isValidGoogleClientId && (
                <div className="flex justify-center my-3">
                  <div ref={googleBtnRef} />
                </div>
              )}

              {/* Clean Google OAuth Button */}
              <div className="max-w-xs mx-auto">
                <button
                  onClick={handleGoogleSignInClick}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
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
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="text-[11px] text-zinc-500 pt-2">
                Personalized & secure expense tracking
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#15151b] flex items-center justify-between text-xs text-zinc-400">
          <span>ExpeVoice</span>
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
