import React, { useState, useEffect } from 'react';
import {
  Mic,
  Menu,
  Sparkles,
} from 'lucide-react';
import { BudgetLimit, Expense, UserProfile } from './types';
import { offlineSyncEngine } from './services/offlineSync';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ExpenseList } from './components/ExpenseList';
import { BudgetsView } from './components/BudgetsView';
import { TravelCurrencyView } from './components/TravelCurrencyView';
import { VoiceInputModal } from './components/VoiceInputModal';
import { ExportModal } from './components/ExportModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { DocsModal } from './components/DocsModal';
import { AuthModal } from './components/AuthModal';
import { googleAuthService } from './services/googleAuth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'budgets' | 'travel'>('dashboard');
  const [user, setUser] = useState<UserProfile>(() => {
    const googleSession = googleAuthService.getSession();
    if (googleSession && googleSession.user) {
      return googleSession.user;
    }
    return offlineSyncEngine.getUser();
  });
  const [expenses, setExpenses] = useState<Expense[]>(offlineSyncEngine.getExpenses());
  const [budgets, setBudgets] = useState<BudgetLimit[]>(offlineSyncEngine.getBudgets());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modal States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync with Local & Backend Engine silently in background
  useEffect(() => {
    setExpenses(offlineSyncEngine.getExpenses());
    setBudgets(offlineSyncEngine.getBudgets());
    setUser(offlineSyncEngine.getUser());

    const unsubscribe = offlineSyncEngine.subscribe((updatedExpenses, updatedBudgets) => {
      setExpenses([...updatedExpenses]);
      setBudgets([...updatedBudgets]);
    });

    const handleOnline = () => {
      offlineSyncEngine.triggerSync();
    };

    window.addEventListener('online', handleOnline);

    // Subscribe to SSE backend stream for multi-device real-time sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/sync/events');
      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'SYNC_EVENT' && message.payload) {
            if (message.payload.expenses) {
              offlineSyncEngine.saveExpensesFromRemote(message.payload.expenses);
            }
            if (message.payload.budgets) {
              offlineSyncEngine.saveBudgetsFromRemote(message.payload.budgets);
            }
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch (err) {
      console.warn('SSE connection could not be established:', err);
    }

    // Trigger initial sync with backend
    offlineSyncEngine.triggerSync();

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Sync font theme attribute on document root
  useEffect(() => {
    const savedTheme = user.fontTheme || localStorage.getItem('vocal_ledger_font_theme') || 'sora';
    document.documentElement.setAttribute('data-font-theme', savedTheme);
  }, [user.fontTheme]);

  // Handlers for data updates
  const handleSaveExpense = (newExpense: Expense) => {
    offlineSyncEngine.saveExpense(newExpense);
  };

  const handleDeleteExpense = (id: string) => {
    offlineSyncEngine.deleteExpense(id);
  };

  const handleSaveBudgets = (updatedBudgets: BudgetLimit[]) => {
    offlineSyncEngine.saveBudgets(updatedBudgets);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    offlineSyncEngine.saveUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 flex font-sans selection:bg-zinc-700 selection:text-white">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={activeTab}
        setCurrentTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        user={user}
        expenses={expenses}
        budgets={budgets}
        onUpdateUser={handleUpdateUser}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTestModal={() => setIsTestRunnerOpen(true)}
        onOpenDocsModal={() => setIsDocsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenDbModal={() => setIsAuthModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0e0e12]/90 backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300 hover:text-white"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center">
                <span className="font-extrabold text-xs text-zinc-950 font-mono tracking-tighter">V</span>
              </div>
              <span className="font-bold text-sm text-white">VoiceLedger</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-[#15151b] text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
            >
              {user.authProvider === 'google' ? (
                user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </span>
                )
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-xs font-bold"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Voice</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 px-4 sm:px-8 lg:px-10 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              expenses={expenses}
              budgets={budgets}
              user={user}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onNavigateToBudgets={() => setActiveTab('budgets')}
              onNavigateToExpenses={() => setActiveTab('expenses')}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseList
              expenses={expenses}
              user={user}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              expenses={expenses}
              user={user}
              onSaveBudgets={handleSaveBudgets}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'travel' && (
            <TravelCurrencyView
              user={user}
              expenses={expenses}
              onUpdateUser={handleUpdateUser}
            />
          )}
        </main>
      </div>

      {/* Floating Action Button (FAB) for AI Voice Input on Mobile/Tablet */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          id="btn-fab-voice-input"
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white text-zinc-950 font-bold text-xs rounded-full shadow-2xl transition-all duration-200 active:scale-95"
        >
          <Mic className="h-4 w-4" />
          <span>Voice Input</span>
        </button>
      </div>

      {/* Modals */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        user={user}
        onSaveExpense={handleSaveExpense}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
        user={user}
        budgets={budgets}
      />

      <TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
