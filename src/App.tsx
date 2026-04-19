import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Volume2, 
  Loader2, 
  Trash2,
  Sparkles,
  History,
  ChevronDown,
  Mic,
  MicOff,
  Globe,
  FileText
} from 'lucide-react';
import { translateText, summarizeText, LANGUAGES } from './services/geminiService';
import { cn } from './lib/utils';

// Type definition for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [history, setHistory] = useState<{ source: string, target: string, text: string, translation: string, pronunciation?: string }[]>([]);
  const [filterPair, setFilterPair] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('smartlang_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('smartlang_history', JSON.stringify(history));
  }, [history]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateText(inputText, sourceLang, targetLang);
      setTranslatedText(result.translation);
      setPronunciation(result.pronunciation);
      
      // Add to history
      setHistory(prev => [
        { source: sourceLang, target: targetLang, text: inputText, translation: result.translation, pronunciation: result.pronunciation },
        ...prev.slice(0, 9) // Keep last 10
      ]);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const handleSummarize = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsSummarizing(true);
    try {
      const summary = await summarizeText(inputText);
      setTranslatedText(summary);
      setPronunciation('');
      
      // Add to history as a "Summary"
      setHistory(prev => [
        { source: sourceLang, target: "Summary", text: inputText, translation: summary },
        ...prev.slice(0, 9)
      ]);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsSummarizing(false);
    }
  }, [inputText, sourceLang]);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setPronunciation('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.toLowerCase().substring(0, 2)));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire translation history?')) {
      setHistory([]);
      setFilterPair(null);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Find language code
    const langObj = LANGUAGES.find(l => l.name === sourceLang);
    recognition.lang = langObj?.code || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-blue-500/30">
      <header className="bg-black/50 backdrop-blur-md border-b border-zinc-800 px-6 py-4 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-900/40 group-hover:rotate-12 transition-transform duration-300">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              Smart<span className="text-blue-500">Lang</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full">
              <History className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-zinc-800" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-950/30 text-blue-400 rounded-full text-sm font-semibold border border-blue-900/30">
              <Sparkles className="w-4 h-4" />
              <span>Translate</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/40 rounded-[2.5rem] shadow-2xl shadow-black border border-zinc-800/50 overflow-hidden flex flex-col md:flex-row min-h-[550px] relative backdrop-blur-sm"
        >
          {/* Input Section */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-zinc-800/50">
            <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
              <div className="relative group">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm font-bold text-blue-400 uppercase tracking-widest focus:outline-none cursor-pointer hover:text-blue-300 transition-colors"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.name} className="bg-zinc-900 text-white">{lang.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-300" />
              </div>
              <button 
                onClick={() => {
                  setInputText('');
                  setPronunciation('');
                }}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
                title="Clear text"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate..."
              className="flex-1 p-8 text-2xl resize-none focus:outline-none bg-transparent placeholder:text-zinc-700 leading-relaxed font-medium text-white"
            />
            <div className="p-6 flex justify-between items-center bg-zinc-900/10">
              <div className="flex gap-3">
                <button 
                  onClick={() => speak(inputText, sourceLang)}
                  disabled={!inputText}
                  className="p-3.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-950/30 rounded-2xl transition-all disabled:opacity-10 disabled:hover:bg-transparent"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
                <button 
                  onClick={toggleListening}
                  className={cn(
                    "p-3.5 rounded-2xl transition-all flex items-center gap-2",
                    isListening 
                      ? "text-red-400 bg-red-950/40 animate-pulse shadow-lg shadow-red-900/20" 
                      : "text-zinc-400 hover:text-blue-400 hover:bg-blue-950/30"
                  )}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
              <span className="text-xs text-zinc-600 font-mono font-bold tracking-tighter">
                {inputText.length} CHARS
              </span>
            </div>
          </div>

          {/* Swap Button (Floating) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
            <button 
              onClick={swapLanguages}
              className="bg-zinc-900 p-4 rounded-full shadow-2xl border border-zinc-800 text-blue-400 hover:scale-110 active:scale-95 transition-all hover:bg-zinc-800 hover:text-blue-300"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>
          
          {/* Mobile Swap Button */}
          <div className="md:hidden flex justify-center -my-6 z-20">
            <button 
              onClick={swapLanguages}
              className="bg-zinc-900 p-4 rounded-full shadow-2xl border border-zinc-800 text-blue-400 hover:scale-110 active:scale-95 transition-all"
            >
              <ArrowRightLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Output Section */}
          <div className="flex-1 flex flex-col bg-zinc-950/30">
            <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
              <div className="relative group">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm font-bold text-blue-400 uppercase tracking-widest focus:outline-none cursor-pointer hover:text-blue-300 transition-colors"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.name} className="bg-zinc-900 text-white">{lang.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-zinc-300" />
              </div>
            </div>
            
            <div className="flex-1 p-8 relative">
              <AnimatePresence mode="wait">
                {(isTranslating || isSummarizing) ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md z-10"
                  >
                    <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />
                    <p className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">
                      {isSummarizing ? "AI Summarizing" : "AI Processing"}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              
              <div className={cn(
                "text-2xl leading-relaxed min-h-full transition-opacity duration-300 font-medium relative group/text",
                !translatedText ? "text-zinc-800 italic" : "text-blue-50"
              )}>
                {translatedText || "Translation will appear here..."}
                {translatedText && (
                  <button 
                    onClick={() => speak(translatedText, targetLang)}
                    className="absolute -right-4 top-0 p-2 text-zinc-700 hover:text-blue-400 opacity-0 group-hover/text:opacity-100 transition-all"
                    title="Listen to translation"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
                {pronunciation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => speak(translatedText, targetLang)}
                    className="mt-4 p-3 bg-blue-950/20 border border-blue-900/20 rounded-xl inline-block cursor-pointer hover:bg-blue-950/40 transition-colors group"
                    title="Click to hear pronunciation"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Pronunciation</p>
                      <Volume2 className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-sm text-blue-200/80 font-mono italic">{pronunciation}</p>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="p-6 flex justify-between items-center bg-zinc-900/20">
              <div className="flex gap-3">
                <button 
                  onClick={() => speak(translatedText, targetLang)}
                  disabled={!translatedText}
                  className="px-5 py-3.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-950/30 rounded-2xl transition-all disabled:opacity-10 disabled:hover:bg-transparent flex items-center gap-2 group"
                >
                  <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Listen</span>
                </button>
                <button 
                  onClick={copyToClipboard}
                  disabled={!translatedText}
                  className={cn(
                    "px-5 py-3.5 rounded-2xl transition-all disabled:opacity-10 disabled:hover:bg-transparent flex items-center gap-2 group",
                    copied ? "text-green-400 bg-green-950/30" : "text-zinc-400 hover:text-blue-400 hover:bg-blue-950/30"
                  )}
                >
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                  <span className="text-xs font-black uppercase tracking-widest">{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-zinc-600 font-mono font-bold tracking-tighter">
                  {translatedText.length} CHARS
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSummarize}
                    disabled={!inputText || isSummarizing || isTranslating}
                    className="bg-zinc-800 text-zinc-300 px-6 py-4 rounded-[1.5rem] font-black hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-20 disabled:active:scale-100 flex items-center gap-3 text-sm uppercase tracking-wider border border-zinc-700"
                  >
                    {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Summarize
                  </button>
                  <button
                    onClick={handleTranslate}
                    disabled={!inputText || isTranslating || isSummarizing}
                    className="bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-20 disabled:active:scale-100 flex items-center gap-3 text-lg uppercase tracking-wider"
                  >
                    {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
                    Translate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {history.length > 0 && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Recent Activity</h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  <button
                    onClick={() => setFilterPair(null)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                      !filterPair 
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                    )}
                  >
                    All
                  </button>
                  {Array.from(new Set(history.map(item => `${item.source} → ${item.target}`))).map(pair => (
                    <button
                      key={pair}
                      onClick={() => setFilterPair(pair === filterPair ? null : pair)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                        filterPair === pair
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20" 
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                      )}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
                <div className="h-6 w-[1px] bg-zinc-800 hidden md:block" />
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history
                .filter(item => !filterPair || `${item.source} → ${item.target}` === filterPair)
                .map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl hover:shadow-blue-900/5 hover:border-zinc-700 transition-all cursor-pointer group backdrop-blur-sm"
                  onClick={() => {
                    setInputText(item.text);
                    setTranslatedText(item.translation);
                    setPronunciation(item.pronunciation || '');
                    setSourceLang(item.source);
                    setTargetLang(item.target);
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                      <span>{item.source}</span>
                      <ArrowRightLeft className="w-3 h-3 text-zinc-700" />
                      <span>{item.target}</span>
                    </div>
                  </div>
                  <p className="text-base text-zinc-100 line-clamp-2 mb-2 font-semibold tracking-tight leading-snug">{item.text}</p>
                  <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{item.translation}</p>
                  {item.pronunciation && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Volume2 className="w-3 h-3 text-blue-500/40" />
                        <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">Pronunciation</span>
                      </div>
                      <p className="text-xs text-blue-300/90 font-mono italic line-clamp-2 leading-relaxed">
                        {item.pronunciation}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-16 border-t border-zinc-900 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-xs font-bold text-zinc-600 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-800" />
            <p>© 2026 SmartLang. POWERED BY GEMINI 3 FLASH.</p>
          </div>
          <div className="flex gap-10">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-400 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
