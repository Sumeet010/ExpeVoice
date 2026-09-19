import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Layers,
  Shield,
  Mic,
  WifiOff,
  Server,
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'architecture' | 'oauth' | 'nlp' | 'offline' | 'api'
  >('architecture');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0e0e12]/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">System Architecture & Documentation</h3>
              <p className="text-xs text-zinc-400">
                Technical Specification & Engineering Design Document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex gap-1 overflow-x-auto text-xs pb-2 border-b border-zinc-800/80 bg-[#0e0e12]/40">
          {[
            { id: 'architecture', label: 'Architecture & Overview', icon: Layers },
            { id: 'oauth', label: 'OAuth2 Authentication', icon: Shield },
            { id: 'nlp', label: 'Voice & NLP Engine', icon: Mic },
            { id: 'offline', label: 'Offline Sync Protocol', icon: WifiOff },
            { id: 'api', label: 'REST & SSE Endpoints', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs text-zinc-300 leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">High-Level System Topology</h4>
                <p>
                  Voice Expense Tracker is engineered as a modern, offline-first progressive web application with a secure server-side Express backend. All AI and sensitive credential processing occurs strictly server-side, protecting API keys and sensitive user financial telemetry.
                </p>
              </div>

              <div className="p-4 bg-[#16161a] rounded-xl border border-zinc-800 space-y-2 font-mono text-[11px]">
                <div className="text-zinc-200 font-bold">// Data Flow Architecture</div>
                <div>User Voice Input (Web Speech API / Mic)</div>
                <div className="text-zinc-500 pl-4">↳ POST /api/nlp/parse-voice (Server-Side Gemini 2.5 Flash)</div>
                <div className="text-zinc-500 pl-4">↳ Fallback: Local Regex & Tokenizer Heuristics</div>
                <div>Frontend State Engine</div>
                <div className="text-zinc-500 pl-4">↳ Dual Write: LocalStorage (Offline Queue) + Server SSE Sync</div>
                <div className="text-zinc-500 pl-4">↳ Deterministic Conflict Resolution (Latest Timestamp Wins)</div>
                <div>Interactive Visual Dashboards</div>
                <div className="text-zinc-500 pl-4">↳ 14-day spending velocity chart, Category Donut & Budget Alert Engine</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-[#16161a] rounded-xl border border-zinc-800">
                  <span className="font-bold text-white block mb-1">Frontend Tier</span>
                  <p className="text-zinc-400">
                    React 18 + TypeScript, Tailwind CSS, Lucide icons, jsPDF report generator, and native Web Speech recognition API with interactive fallback.
                  </p>
                </div>
                <div className="p-3 bg-[#16161a] rounded-xl border border-zinc-800">
                  <span className="font-bold text-white block mb-1">Backend Tier</span>
                  <p className="text-zinc-400">
                    Node.js & Express, `@google/genai` SDK for Gemini 2.5 Flash structured entity extraction, SSE server-sent events for real-time synchronization, and OAuth2 token handling.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oauth' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">OAuth2 Security & Token Flow</h4>
                <p>
                  The backend features RFC 6749 compliant OAuth2 authorization code and token flows. User identity is protected using cryptographic bearer tokens transmitted exclusively over HTTPS.
                </p>
              </div>

              <div className="p-4 bg-[#16161a] rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-zinc-200 text-xs">Security Highlights:</div>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li><strong>Client-Side Safety:</strong> Zero API secrets or client secrets are exposed to client JavaScript.</li>
                  <li><strong>Bearer Token Authorization:</strong> All protected sync and expense endpoints authenticate using the <code>Authorization: Bearer &lt;token&gt;</code> header.</li>
                  <li><strong>Instant Sign-In Mechanism:</strong> Allows multi-user state switching seamlessly without needing external redirects.</li>
                </ul>
              </div>

              <div className="bg-[#16161a] p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300">
                <span className="text-zinc-500">// Token Exchange Request</span>
                <p className="text-white mt-1">POST /api/auth/oauth2/token</p>
                <p className="text-zinc-400">Content-Type: application/json</p>
                <p className="text-zinc-400">Body: {`{ "grant_type": "authorization_code", "code": "AUTH_CODE" }`}</p>
              </div>
            </div>
          )}

          {activeTab === 'nlp' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Voice & Natural Language Processing Pipeline</h4>
                <p>
                  Transactions are logged by simply speaking or typing naturally. The system handles unstructured speech transcripts (e.g., &quot;Spent 45 euros for team lunch yesterday with credit card&quot;) and categorizes them with high precision.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#16161a] rounded-xl border border-zinc-800">
                  <span className="font-bold text-white block mb-1">1. Gemini 2.5 Flash (Server-Side)</span>
                  <p className="text-zinc-400 text-[11px]">
                    Leverages Gemini 2.5 Flash via the official <code>@google/genai</code> SDK. Uses <code>responseMimeType: &apos;application/json&apos;</code> with a strict JSON schema to extract amount, currency, merchant, category, date, and payment method.
                  </p>
                </div>
                <div className="p-3.5 bg-[#16161a] rounded-xl border border-zinc-800">
                  <span className="font-bold text-white block mb-1">2. Offline Fallback Parser</span>
                  <p className="text-zinc-400 text-[11px]">
                    When offline or without active network connectivity, a client-side tokenizer runs lexical matching, keyword entity tagging, and number-word conversions (e.g. &quot;forty five&quot; -&gt; 45).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'offline' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Offline-First Engine & Real-Time SSE Sync</h4>
                <p>
                  Travelers often experience intermittent connectivity on flights, subways, and remote destinations. Voice Expense Tracker incorporates a resilient offline storage layer.
                </p>
              </div>

              <div className="p-4 bg-[#16161a] rounded-xl border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-200 text-xs">Offline Synchronization Workflow:</span>
                <ol className="list-decimal pl-5 space-y-1.5 text-zinc-300">
                  <li><strong>Local Persistence:</strong> All transactions are instantly committed to browser LocalStorage.</li>
                  <li><strong>Pending Mutation Queue:</strong> If disconnected, mutations are tagged <code>pending</code> and enqueued in an offline queue.</li>
                  <li><strong>Automatic Flusher:</strong> The application monitors the browser&apos;s <code>navigator.onLine</code> event. Once restored, the queue batch-syncs via <code>POST /api/sync/batch</code>.</li>
                  <li><strong>Deterministic Conflict Resolution:</strong> Uses Last-Timestamp-Wins (LWW) conflict resolution to guarantee data consistency.</li>
                  <li><strong>SSE Live Updates:</strong> Connected clients receive instantaneous updates via Server-Sent Events (<code>/api/sync/events</code>).</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">Backend Endpoints Reference</h4>
              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-[#16161a] font-mono text-[11px]">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">POST</span> /api/nlp/parse-voice
                  </div>
                  <span className="text-zinc-400 font-sans">Gemini 2.5 Flash entity extraction</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-300 font-bold">GET</span> /api/sync/events
                  </div>
                  <span className="text-zinc-400 font-sans">Server-Sent Events (SSE) stream</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">POST</span> /api/sync/batch
                  </div>
                  <span className="text-zinc-400 font-sans">Batch synchronize offline queues</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-300 font-bold">GET</span> /api/expenses
                  </div>
                  <span className="text-zinc-400 font-sans">Fetch user expenses</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">POST</span> /api/expenses
                  </div>
                  <span className="text-zinc-400 font-sans">Create/update expense record</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-rose-400 font-bold">DELETE</span> /api/expenses/:id
                  </div>
                  <span className="text-zinc-400 font-sans">Remove expense record</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-300 font-bold">GET</span> /api/budgets
                  </div>
                  <span className="text-zinc-400 font-sans">Fetch user budget limits</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="text-white font-bold">POST</span> /api/budgets
                  </div>
                  <span className="text-zinc-400 font-sans">Update monthly budget thresholds</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#0e0e12]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
