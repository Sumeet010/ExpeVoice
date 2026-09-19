import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Check,
  AlertCircle,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { CategoryType, Expense, ParsedVoiceResult, PaymentMethod, UserProfile } from '../types';
import { convertCurrency, formatMoney, SUPPORTED_CURRENCIES } from '../services/currency';
import { parseVoiceInputLocally, parseVoiceWithAI } from '../services/nlpVoiceParser';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveExpense: (expense: Expense) => void;
}

const SAMPLE_VOICE_COMMANDS = [
  'Team dinner 1450 rupees yesterday paid by credit card',
  'Ola cab to airport 450 rupees with UPI',
  'Organic groceries and fruit 2400 rupees',
  'Booked train ticket 68 euros travel',
  'Wifi and electricity bill 1200 rupees utilities',
];

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveExpense,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedVoiceResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [manualText, setManualText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setParsedData(null);
      setErrorMessage('');
      setManualText('');
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  const startListening = () => {
    setErrorMessage('');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMessage(`Microphone notice: ${event.error}. You can also type or use sample commands below.`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not start speech recognition:', err);
      setIsRecording(false);
      setErrorMessage('Microphone access unavailable. You can use quick sample prompts or text input.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsRecording(false);
  };

  const handleProcessInput = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsParsing(true);
    setErrorMessage('');

    try {
      const result = await parseVoiceWithAI(textToProcess, user.homeCurrency);
      setParsedData(result);
    } catch (e: any) {
      const fallback = parseVoiceInputLocally(textToProcess, user.homeCurrency);
      setParsedData(fallback);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setTranscript(sample);
    setManualText(sample);
    handleProcessInput(sample);
  };

  const handleSave = () => {
    if (!parsedData || parsedData.amount <= 0) {
      setErrorMessage('Please provide a valid expense amount.');
      return;
    }

    const homeCurrency = user.homeCurrency || 'INR';
    const convertedAmount = convertCurrency(
      parsedData.amount,
      parsedData.currency,
      homeCurrency
    );

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      description: parsedData.description || 'Voice Expense',
      originalAmount: parsedData.amount,
      originalCurrency: parsedData.currency,
      convertedAmount,
      homeCurrency,
      category: parsedData.category,
      date: parsedData.date,
      paymentMethod: parsedData.paymentMethod,
      tags: parsedData.tags || ['voice-logged'],
      isVoiceInput: true,
      voiceTranscript: transcript || manualText,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#0e0e12]/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">AI Voice Expense Input</h3>
              <p className="text-xs text-zinc-400">
                Spoken natural language is automatically parsed & categorized
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Voice Microphone Centerpiece */}
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-[#16161a] rounded-xl border border-zinc-800/80 relative">
            {/* Animated Pulse Rings when recording */}
            <div className="relative">
              {isRecording && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-white/15 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-white/20 animate-pulse" />
                </>
              )}
              <button
                id="btn-modal-mic-toggle"
                onClick={() => (isRecording ? stopListening() : startListening())}
                className={`relative z-10 h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-white text-zinc-950 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700/60'
                }`}
              >
                {isRecording ? <Mic className="h-7 w-7" /> : <MicOff className="h-7 w-7" />}
              </button>
            </div>

            <p className="mt-3.5 text-xs font-semibold text-zinc-200">
              {isRecording ? 'Listening... Speak your expense naturally' : 'Tap microphone to speak'}
            </p>
            <p className="text-xs text-zinc-400 text-center max-w-xs mt-1">
              e.g., &quot;Dinner with client 1,450 rupees yesterday paid by card&quot; or &quot;Coffee 180 rupees&quot;
            </p>

            {/* Transcript display */}
            {transcript && (
              <div className="mt-4 w-full">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 italic flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span>&quot;{transcript}&quot;</span>
                </div>
                {!parsedData && !isParsing && (
                  <button
                    onClick={() => handleProcessInput(transcript)}
                    className="mt-2 w-full py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Parse Spoken Expense
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Fallback Text Input or Quick Sample Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Or type your natural language transaction:</span>
              <span className="text-[10px] text-zinc-500">Free-form NLP</span>
            </label>
            <div className="flex gap-2">
              <input
                id="input-voice-manual-text"
                type="text"
                placeholder="e.g. Paid 1,450 rupees for team lunch by card"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTranscript(manualText);
                    handleProcessInput(manualText);
                  }
                }}
                className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
              />
              <button
                id="btn-voice-manual-submit"
                onClick={() => {
                  setTranscript(manualText);
                  handleProcessInput(manualText);
                }}
                disabled={isParsing || !manualText.trim()}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 border border-zinc-700/80 disabled:opacity-40 cursor-pointer"
              >
                {isParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Suggestions */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-400">Quick Test Prompts (click to parse):</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSample(cmd)}
                  className="px-2.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs rounded-lg border border-zinc-800 transition-colors text-left truncate max-w-full cursor-pointer"
                >
                  &quot;{cmd}&quot;
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-zinc-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Spinner */}
          {isParsing && (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
              <span>Analyzing speech entities & auto-categorizing...</span>
            </div>
          )}

          {/* Parsed Output Preview Card */}
          {parsedData && !isParsing && (
            <div className="p-4 bg-[#16161a] border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-zinc-300" />
                  Parsed Transaction Details
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full font-semibold">
                  {Math.round(parsedData.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Amount & Currency */}
                <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Amount & Currency</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={parsedData.amount}
                      onChange={(e) =>
                        setParsedData({ ...parsedData, amount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-white font-bold text-xs focus:outline-none focus:border-zinc-600"
                    />
                    <select
                      value={parsedData.currency}
                      onChange={(e) => setParsedData({ ...parsedData, currency: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  {parsedData.currency !== user.homeCurrency && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Converts to ≈ {formatMoney(convertCurrency(parsedData.amount, parsedData.currency, user.homeCurrency), user.homeCurrency)}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Category</label>
                  <select
                    value={parsedData.category}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, category: e.target.value as CategoryType })
                    }
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs text-white font-medium focus:outline-none focus:border-zinc-600"
                  >
                    {[
                      'Food & Dining',
                      'Transportation',
                      'Groceries',
                      'Shopping',
                      'Travel',
                      'Entertainment',
                      'Health & Wellness',
                      'Utilities',
                      'Housing',
                      'Education',
                      'Personal Care',
                      'Other',
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-2 p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Description / Merchant</label>
                  <input
                    type="text"
                    value={parsedData.description}
                    onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>

                {/* Date */}
                <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Date</label>
                  <input
                    type="date"
                    value={parsedData.date}
                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-zinc-600"
                  />
                </div>

                {/* Payment Method */}
                <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800/80">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold">Payment Method</label>
                  <select
                    value={parsedData.paymentMethod}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    {['Credit Card', 'Cash', 'Debit Card', 'Apple Pay', 'Bank Transfer'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-[#0e0e12]/60 flex justify-end gap-2.5">
          <button
            id="btn-voice-modal-cancel"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-voice-modal-save"
            onClick={handleSave}
            disabled={!parsedData || parsedData.amount <= 0}
            className="px-5 py-2 text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};
