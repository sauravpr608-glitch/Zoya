import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Smartphone, 
  Zap,
  Globe,
  Cpu,
  Fingerprint,
  QrCode,
  Sparkles,
  User,
  Check,
  Mic,
  MicOff,
  Play,
  Settings,
  Key,
  Sliders,
  MessageSquare,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  Undo2,
  Redo2,
  Battery,
  Share2
} from "lucide-react";

import { syncService } from "../services/syncService";
import { AVAILABLE_PERSONAS, VoicePersona } from "./VoiceCloningModule";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  currentPersonaId: string;
  onSelectPersona: (persona: VoicePersona) => void;
  isVoiceUnlocked: boolean;
  onPlayAd: () => void;
  onUpdateSettings?: () => void;
  
  // App active states & controls
  appState: "idle" | "listening" | "processing" | "speaking";
  isSessionActive: boolean;
  onToggleListening: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  messages: { id: string; sender: "user" | "zoya"; text: string }[];
  onClearMessages: () => void;
  onSendTextCommand: (text: string) => void;
  latestBuildUrl: string | null;
  onUndo: () => void;
  onRedo: () => void;
}

type TabType = "controls" | "chat" | "configs" | "dna";

export default function ZoyaDashboard({ 
  isOpen, 
  onClose, 
  userData, 
  currentPersonaId, 
  onSelectPersona, 
  isVoiceUnlocked, 
  onPlayAd, 
  onUpdateSettings,
  appState,
  isSessionActive,
  onToggleListening,
  isMuted,
  onToggleMute,
  isScreenSharing,
  onToggleScreenShare,
  messages,
  onClearMessages,
  onSendTextCommand,
  latestBuildUrl,
  onUndo,
  onRedo
}: Props) {
  const [activeTab, setActiveTab] = React.useState<TabType>("controls");
  const [isSynced, setIsSynced] = React.useState(false);
  const [textInputValue, setTextInputValue] = React.useState("");

  const [apiKeyInput, setApiKeyInput] = React.useState(() => localStorage.getItem("zoya_custom_api_key") || "");
  const [chatModelInput, setChatModelInput] = React.useState(() => localStorage.getItem("zoya_custom_chat_model") || "gemini-3-flash-preview");
  const [liveModelInput, setLiveModelInput] = React.useState(() => localStorage.getItem("zoya_custom_live_model") || "gemini-3.1-flash-live-preview");
  const [voiceInput, setVoiceInput] = React.useState(() => localStorage.getItem("zoya_custom_voice") || "");
  const [masterNameInput, setMasterNameInput] = React.useState(() => userData?.name || "Saurav");
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    if (userData?.name) {
      setMasterNameInput(userData.name);
    }
  }, [userData]);

  React.useEffect(() => {
    if (!isOpen) return;

    const checkSync = () => {
       setIsSynced(syncService.isConnected());
    };

    checkSync();
    const interval = setInterval(checkSync, 2000);
    
    syncService.onDeviceJoined(() => {
      setIsSynced(true);
    });

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputValue.trim()) return;
    onSendTextCommand(textInputValue);
    setTextInputValue("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300]"
            id="dashboard-backdrop"
          />
          
          {/* Main Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-4xl h-[85vh] max-h-[800px] bg-[#07080d] border border-white/10 rounded-[32px] z-[301] shadow-2xl overflow-hidden flex flex-col"
            id="dashboard-main-panel"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-blue-900/10 to-transparent gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  Z
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-white leading-tight">Zoya Core Settings & Controls</h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Consolidated Operational Hub</p>
                </div>
              </div>
              
              {/* Tab Selector */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {(
                  [
                    { id: "controls", label: "Controls", icon: <Sliders size={12} /> },
                    { id: "chat", label: "Logs", icon: <MessageSquare size={12} /> },
                    { id: "configs", label: "Intelligence", icon: <Settings size={12} /> },
                    { id: "dna", label: "Sync & DNA", icon: <Cpu size={12} /> }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === tab.id 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={onClose}
                className="absolute sm:static top-4 right-4 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all ring-1 ring-white/10"
                id="close-dashboard-button"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              
              {/* TAB 1: CONTROLS */}
              {activeTab === "controls" && (
                <div className="space-y-6" id="tab-controls-content">
                  {/* Status Box */}
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSessionActive ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {isSessionActive ? <MicOff size={22} /> : <Mic size={22} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Zoya Pulse State</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? "bg-red-500 animate-ping" : "bg-blue-500"}`} />
                        </div>
                        <h3 className="text-lg font-bold text-white capitalize">{appState === "idle" ? "Zoya Idle - Standing By" : `Zoya is ${appState}...`}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {latestBuildUrl && (
                        <button 
                          onClick={() => window.open(latestBuildUrl, "_blank")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          Launch Build
                        </button>
                      )}
                      <button 
                        onClick={onToggleScreenShare}
                        disabled={!isSessionActive}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all border ${
                          isScreenSharing 
                            ? "bg-red-500/20 border-red-500/40 text-red-400" 
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                        }`}
                      >
                        <Share2 size={12} />
                        <span>{isScreenSharing ? "Stop Share" : "Share Screen"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Operational Controls Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Trigger Controls */}
                    <div className="bg-[#0c0d14] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Live Microphone link</h4>
                        <p className="text-[11px] text-white/30 leading-relaxed mb-6">
                          Start or stop the continuous Live Audio Session. In Live Mode, Gemini will stream and receive raw PCM audio buffers to achieve minimal conversation latency.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {!isVoiceUnlocked && (
                          <div className="p-[1px] bg-gradient-to-r from-blue-500 via-pink-500 to-violet-600 rounded-2xl">
                            <button 
                              onClick={onPlayAd}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-black/90 hover:bg-black/80 rounded-[15px] transition-all group"
                            >
                              <span className="text-sm group-hover:scale-125 transition-transform">🎬</span>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Unlock Voice Core</p>
                                <p className="text-[8px] uppercase tracking-wider text-white/40 font-bold">Watch Ad to Activate</p>
                              </div>
                            </button>
                          </div>
                        )}

                        <button 
                          onClick={onToggleListening}
                          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border ${
                            isSessionActive 
                              ? "bg-red-500/15 text-red-500 border-red-500/30 hover:bg-red-500/25" 
                              : "bg-blue-600 text-white border-blue-400/30 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                          }`}
                        >
                          {isSessionActive ? <><MicOff size={16} /><span>Disconnect Session</span></> : <><Mic size={16} /><span>Connect Voice Session</span></>}
                        </button>

                        <button 
                          onClick={onToggleMute}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all border ${
                            isMuted 
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20" 
                              : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {isMuted ? <><VolumeX size={14} /><span>Voice Feedback Muted</span></> : <><Volume2 size={14} /><span>Voice Feedback Enabled</span></>}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Text Command console */}
                    <div className="bg-[#0c0d14] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Text Command Console</h4>
                        <p className="text-[11px] text-white/30 leading-relaxed mb-6">
                          Type commands, quick prompts, or general queries to transmit directly to Zoya's Standard intelligence core without activating audio streams.
                        </p>
                      </div>

                      <form onSubmit={handleTextSubmit} className="space-y-3">
                        <div className="relative">
                          <input 
                            type="text"
                            value={textInputValue}
                            onChange={(e) => setTextInputValue(e.target.value)}
                            placeholder="Type queries or commands here..."
                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <Send size={12} />
                          <span>Send Text Command</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Build & Quick Tools Panel */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Quick Tool Access Nodes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Creative Hub", info: "Generate creative items", color: "border-blue-500/20 bg-blue-500/5 text-blue-400", cmd: "Saurav, Creative Hub se aap images aur creative content generate kar sakte hain." },
                        { label: "Neural Flow", info: "Process core thoughts", color: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400", cmd: "Neural Flow active hai! Main aapke commands aur thoughts ko process kar rahi hoon." },
                        { label: "Logic Core", info: "Advanced intelligence", color: "border-violet-500/20 bg-violet-500/5 text-violet-400", cmd: "Logic Core optimized hai. Main complex coding aur analysis ke liye taiyar hoon." },
                        { label: "System Status", info: "Check active monitors", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400", cmd: "System configurations up-to-date hain! Sabhi systems stable operate kar rahe hain." }
                      ].map((node, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            onSendTextCommand(node.cmd);
                            setActiveTab("chat");
                          }}
                          className={`p-3.5 border rounded-2xl hover:bg-white/10 transition-all text-left ${node.color}`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider">{node.label}</p>
                          <p className="text-[9px] opacity-50 mt-1 leading-tight">{node.info}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVE LOGS & CHAT HISTORY */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-full space-y-4" id="tab-chat-content">
                  <div className="flex justify-between items-center shrink-0 bg-white/5 p-4 border border-white/5 rounded-2xl">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-white">Neural Active Log History</h3>
                      <p className="text-white/40 text-[9px] uppercase tracking-widest font-mono">Sync buffers & log items</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={onUndo}
                        title="Undo Message"
                        className="p-2 rounded-xl border border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Undo2 size={14} />
                      </button>
                      <button 
                        onClick={onRedo}
                        title="Redo Message"
                        className="p-2 rounded-xl border border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Redo2 size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Flush neural logic? This clears message logs.")) {
                            onClearMessages();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-900/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all"
                      >
                        <Trash2 size={12} />
                        <span>Flush Logs</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-16 scale-90">
                        <Sparkles size={36} className="mb-3 text-blue-400" />
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-center">Awaiting Pulse Signal...</p>
                        <p className="text-[9px] text-center text-white/40 mt-1 max-w-xs">No logs recorded. Talk to Zoya or enter a text command in the Controls tab to view neural records.</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1 px-1">
                            {msg.sender === "user" ? userData?.name || "Saurav" : "Zoya OS"}
                          </span>
                          <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed border max-w-[85%] ${
                            msg.sender === "user" 
                              ? "bg-blue-600/10 border-blue-500/20 text-blue-100" 
                              : "bg-white/5 border-white/5 text-white/80 italic font-serif"
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SYSTEM INTELLIGENCE CONFIG */}
              {activeTab === "configs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="tab-configs-content">
                  {/* Left Column: API Configurations */}
                  <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col justify-between hover:border-violet-500/20 transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Sliders className="text-cyan-400" size={18} />
                        <h3 className="text-base font-serif font-bold text-white">System Settings</h3>
                      </div>
                      
                      <p className="text-white/40 text-[10px] leading-relaxed mb-6">
                        Customize Core Intelligence models, API secrets, default voices, and Master identity protocols. Saved variables persist securely inside local storage.
                      </p>

                      <div className="space-y-4">
                        {/* Master Name Field */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Master Identity Name</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40 text-xs">@</span>
                            <input 
                              type="text" 
                              value={masterNameInput}
                              onChange={(e) => setMasterNameInput(e.target.value)}
                              placeholder="e.g. Saurav Coder"
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 pl-8 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                          </div>
                        </div>

                        {/* API Key Field */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50">Gemini Custom API Key</label>
                            <button 
                              type="button" 
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="text-[9px] uppercase tracking-wider text-cyan-400 hover:underline font-bold"
                            >
                              {showApiKey ? "Hide" : "Show"}
                            </button>
                          </div>
                          <input 
                            type={showApiKey ? "text" : "password"}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="Using environment default secret"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-white/20"
                          />
                        </div>

                        {/* Chat Model Field */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Standard Chat Model</label>
                          <select 
                            value={chatModelInput}
                            onChange={(e) => setChatModelInput(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                          >
                            <option value="gemini-3-flash-preview">gemini-3-flash-preview (Default)</option>
                            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Fast)</option>
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced)</option>
                            <option value="gemini-2.5-pro">gemini-2.5-pro (Creative)</option>
                          </select>
                        </div>

                        {/* Live Model Field */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Live Audio Session Model</label>
                          <select 
                            value={liveModelInput}
                            onChange={(e) => setLiveModelInput(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                          >
                            <option value="gemini-3.1-flash-live-preview">gemini-3.1-flash-live-preview (Default)</option>
                            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Fast)</option>
                            <option value="gemini-2.5-flash">gemini-2.5-flash (Optimized)</option>
                          </select>
                        </div>

                        {/* Default Voice Core Field */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Voice DNA Core Override</label>
                          <select 
                            value={voiceInput}
                            onChange={(e) => setVoiceInput(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                          >
                            <option value="">No Override (Use Persona Default)</option>
                            <option value="Kore">Kore (Zoya Original)</option>
                            <option value="Charon">Charon (Deep Male)</option>
                            <option value="Puck">Puck (Young Male / SRK)</option>
                            <option value="Aoede">Aoede (Soft Female)</option>
                            <option value="Fenrir">Fenrir (Classic Neutral)</option>
                            <option value="Zephyr">Zephyr (Pro Assistant)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          if (apiKeyInput.trim()) {
                            localStorage.setItem("zoya_custom_api_key", apiKeyInput.trim());
                          } else {
                            localStorage.removeItem("zoya_custom_api_key");
                          }
                          
                          localStorage.setItem("zoya_custom_chat_model", chatModelInput);
                          localStorage.setItem("zoya_custom_live_model", liveModelInput);
                          
                          if (voiceInput) {
                            localStorage.setItem("zoya_custom_voice", voiceInput);
                          } else {
                            localStorage.removeItem("zoya_custom_voice");
                          }

                          const updatedUserData = { ...userData, name: masterNameInput || "Saurav" };
                          localStorage.setItem("zoya_user_info", JSON.stringify(updatedUserData));

                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 3000);

                          if (onUpdateSettings) {
                            onUpdateSettings();
                          }
                        }}
                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        {saveSuccess ? "✓ Configs Saved!" : "Save Configuration"}
                      </button>
                      
                      <button 
                        onClick={() => {
                          localStorage.removeItem("zoya_custom_api_key");
                          localStorage.removeItem("zoya_custom_chat_model");
                          localStorage.removeItem("zoya_custom_live_model");
                          localStorage.removeItem("zoya_custom_voice");
                          
                          setApiKeyInput("");
                          setChatModelInput("gemini-3-flash-preview");
                          setLiveModelInput("gemini-3.1-flash-live-preview");
                          setVoiceInput("");
                          setMasterNameInput("Saurav");

                          const defaultUserData = { ...userData, name: "Saurav" };
                          localStorage.setItem("zoya_user_info", JSON.stringify(defaultUserData));

                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 3000);

                          if (onUpdateSettings) {
                            onUpdateSettings();
                          }
                        }}
                        className="py-3 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Master Identity Summary */}
                  <div className="bg-[#0c0d14] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Fingerprint className="text-pink-400" size={18} />
                        <h3 className="text-base font-serif font-bold text-white">Master Identity DNA</h3>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-white/5">
                          {userData?.name ? userData.name[0].toUpperCase() : "S"}
                        </div>
                        <div>
                          <p className="text-xl font-serif font-bold text-white">{userData?.name || "Saurav Coder"}</p>
                          <p className="text-[10px] text-white/40">Master Administrator & Architect</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">Intelligence Core</span>
                          <span className="text-pink-400 font-mono text-[10px] uppercase font-bold">{chatModelInput}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/30">System Integrity</span>
                          <span className="text-cyan-400 font-bold tracking-tighter">99.9%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "99.9%" }}
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            transition={{ duration: 1.5 }}
                           />
                        </div>

                        {/* Anime Protocol */}
                        <div className="pt-3 flex items-center justify-between border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <Sparkles size={14} className={userData?.isAnimeMode ? "text-pink-400 animate-pulse" : "text-white/20"} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Anime Visualizer Core</span>
                          </div>
                          <button 
                            onClick={() => {
                              const newUser = { ...userData, isAnimeMode: !userData?.isAnimeMode };
                              localStorage.setItem("zoya_user_info", JSON.stringify(newUser));
                              window.location.reload();
                            }}
                            className={`w-10 h-5 rounded-full p-1 relative transition-colors ${userData?.isAnimeMode ? 'bg-pink-500' : 'bg-white/10'}`}
                          >
                            <motion.div 
                              animate={{ x: userData?.isAnimeMode ? 20 : 0 }}
                              className="w-3 h-3 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        {/* Voice core protocol status */}
                        <div className="pt-3 flex items-center justify-between border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <Play size={14} className={isVoiceUnlocked ? "text-emerald-400" : "text-white/20"} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mic Authorization</span>
                          </div>
                          <span className={`text-[9px] px-2.5 py-1 rounded uppercase font-black tracking-widest ${isVoiceUnlocked ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/15 text-yellow-400 animate-pulse border border-yellow-500/20'}`}>
                            {isVoiceUnlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5">
                      <p className="text-[9px] text-white/20 italic leading-snug">
                        Master configuration parameters are held in state variables local memory buffers, shielding all intelligence secrets securely from external servers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DNA & REMOTE BRIDGING */}
              {activeTab === "dna" && (
                <div className="space-y-6" id="tab-dna-content">
                  {/* System monitors */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Latency */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Sync Latency</span>
                        <Zap size={12} className="text-cyan-400" />
                      </div>
                      <p className="text-2xl font-serif font-black text-white">24ms</p>
                    </div>
                    {/* Active Nodes */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Neural Cores</span>
                        <Cpu size={12} className="text-pink-400" />
                      </div>
                      <p className="text-2xl font-serif font-black text-white">128 Nodes</p>
                    </div>
                    {/* Health */}
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Node Integrity</span>
                        <ShieldCheck size={12} className="text-violet-400" />
                      </div>
                      <p className="text-2xl font-serif font-black text-white">Hybrid</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Voice Personas List */}
                    <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Mic size={16} className="text-violet-400" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-white">Active Neural Voices</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {AVAILABLE_PERSONAS.map((persona) => (
                          <button
                            key={persona.id}
                            onClick={() => onSelectPersona(persona)}
                            className={`p-3.5 rounded-xl border transition-all text-left relative group ${
                              currentPersonaId === persona.id
                                ? "bg-violet-600/20 border-violet-500 shadow-lg shadow-violet-500/10"
                                : "bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/[0.07]"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {persona.voiceName}
                              </span>
                              {currentPersonaId === persona.id && (
                                <div className="bg-violet-500 p-0.5 rounded-full">
                                  <Check size={8} className="text-white" />
                                </div>
                              )}
                            </div>
                            <h5 className="text-white font-bold text-[10px] truncate">{persona.name}</h5>
                            <p className="text-white/30 text-[8px] leading-tight line-clamp-2 mt-1">{persona.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Remote Sync QR */}
                    <div className="bg-white/5 border border-white/10 rounded-[24px] p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <QrCode size={16} className="text-cyan-400" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-white">Secondary Bridge</h4>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-white p-2 rounded-xl shadow-xl shrink-0">
                          <QRCodeSVG 
                            value={window.location.href} 
                            size={100}
                            level="H"
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/70 font-bold mb-1.5 uppercase tracking-wide">Sync Instructions:</p>
                          <ol className="text-[9px] text-white/40 space-y-1 list-decimal pl-3.5 leading-relaxed">
                            <li>Scan QR with secondary device camera.</li>
                            <li>Authorize with the identical Master identity credential.</li>
                            <li>Zoya instantly synchronizes actions over active sockets.</li>
                          </ol>
                        </div>
                      </div>

                      <div className="mt-4 p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isSynced ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`} />
                          <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">
                            {isSynced ? "Primary Bridge Link Established" : "Secondary Bridge Standing By"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center shrink-0">
               <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">Zoya Neural Base System</span>
               <button 
                onClick={onClose}
                className="px-6 py-3 bg-white hover:bg-white/95 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                id="close-terminal-button"
               >
                 Close Terminal
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
