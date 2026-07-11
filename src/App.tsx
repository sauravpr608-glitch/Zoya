import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Keyboard, Send, Trash2, Monitor, MonitorOff, LogOut, User, Undo2, Redo2, Sparkles, Activity, BrainCircuit, LayoutDashboard, Cpu, CloudRain, Smartphone, Battery, Menu, X, Settings } from "lucide-react";
import { getZoyaResponse, getZoyaAudio, resetZoyaSession } from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import { playPCM } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { generateDailyProgress, getEvolutionLogs } from "./services/evolutionService";
import VoiceCloningModule, { AVAILABLE_PERSONAS, VoicePersona } from "./components/VoiceCloningModule";
import ZoyaDashboard from "./components/ZoyaDashboard";
import SwipeNavigation from "./components/SwipeNavigation";
import { syncService } from "./services/syncService";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const [redoStack, setRedoStack] = useState<ChatMessage[][]>([]);
  const messagesRef = useRef(messages);

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem("zoya_user_info");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user info", e);
      }
    }
    const defaultData = { name: "Saurav", email: "sauravpr608@gmail.com", address: "India" };
    localStorage.setItem("zoya_user_info", JSON.stringify(defaultData));
    return defaultData;
  });

  const [isLocked, setIsLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVoiceUnlocked, setIsVoiceUnlocked] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionLogs, setEvolutionLogs] = useState(getEvolutionLogs());
  const [latestBuildUrl, setLatestBuildUrl] = useState<string | null>(null);

  const [showVoiceCloningModal, setShowVoiceCloningModal] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<VoicePersona>(AVAILABLE_PERSONAS[0]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(true);

  const handleUndo = useCallback(() => {
    if (messages.length === 0) return;
    
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length === 0) return prev;
      
      const lastMessage = newMessages[newMessages.length - 1];
      
      let removed: ChatMessage[] = [];
      if (lastMessage.sender === "zoya" && newMessages.length >= 2) {
        removed = newMessages.splice(-2, 2);
      } else {
        const item = newMessages.pop();
        if (item) removed = [item];
      }
      
      if (removed.length > 0) {
        setRedoStack(redo => [...redo, removed]);
      }
      return newMessages;
    });
  }, [messages]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    
    setRedoStack(prev => {
      const newStack = [...prev];
      const itemsToRestore = newStack.pop();
      
      if (itemsToRestore) {
        setMessages(msgs => [...msgs, ...itemsToRestore]);
      }
      return newStack;
    });
  }, [redoStack]);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history", JSON.stringify(messages));
  }, [messages]);

  const handleUpdateSettings = useCallback(() => {
    const saved = localStorage.getItem("zoya_user_info");
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse updated user info", e);
      }
    }
  }, []);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  // Expose playMobileAppVideoAd and unlockZoyaVoiceSystem to window for Android app integration
  useEffect(() => {
    (window as any).unlockZoyaVoiceSystem = () => {
      console.log("Zoya Microphone Active Now");
      setIsVoiceUnlocked(true);
      // Auto-start listening session as soon as unlocked!
      setIsSessionActive(true);
      resetZoyaSession();
      const session = new LiveSessionManager();
      session.isMuted = isMuted;
      liveSessionRef.current = session;
      session.onStateChange = (state) => setAppState(state);
      session.onMessage = (sender, text) => {
        setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
        if (sender === "zoya" && text.includes("remote_sync")) {
          const jsonMatch = text.match(/\{.*"remote_sync":\s*"(.*)".*\}/);
          if (jsonMatch && jsonMatch[1]) syncService.sendAction(jsonMatch[1]);
        }
      };
      session.onCommand = (url) => {
        setLatestBuildUrl(url);
        setTimeout(() => window.open(url, "_blank"), 500);
      };
      session.start(userData, currentPersona.voiceName, currentPersona.instruction)
        .catch((e: any) => {
          setIsSessionActive(false);
          setAppState("idle");
          setShowPermissionModal(true);
        });
    };

    (window as any).playMobileAppVideoAd = () => {
      const android = (window as any).Android;
      if (android && typeof android.showInterstitialAd === "function") {
        android.showInterstitialAd();
        alert("Ad starting... Baat karne ke liye mic unlock ho raha hai!");
        (window as any).unlockZoyaVoiceSystem();
      } else {
        alert("Browser Testing: Direct unlocking Zoya!");
        (window as any).unlockZoyaVoiceSystem();
      }
    };

    return () => {
      delete (window as any).unlockZoyaVoiceSystem;
      delete (window as any).playMobileAppVideoAd;
    };
  }, [userData, currentPersona, isMuted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, appState]);

  useEffect(() => {
    if (isAuthenticated && userData && userData.name.toLowerCase().includes("saurav")) {
      syncService.connect("Saurav_Coder");

      syncService.onRemoteAction(async (command) => {
        console.log("EXECUTING REMOTE PROTOCOL:", command);
        if (command === "CAMERA_OPEN") {
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Remote Camera Protocol Active. Opening camera view..." }]);
          window.open("https://webcamtests.com/", "_blank");
        } else if (command === "FLASHLIGHT_TOGGLE") {
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Emitting high-intensity photonic burst (Flashlight toggled)." }]);
          const flash = document.createElement("div");
          flash.className = "fixed inset-0 bg-white z-[9999] transition-opacity duration-1000";
          document.body.appendChild(flash);
          setTimeout(() => { flash.style.opacity = "0"; setTimeout(() => flash.remove(), 1000); }, 100);
        } else if (command === "GET_LOCATION") {
          navigator.geolocation.getCurrentPosition((pos) => {
             setMessages(prev => [...prev, { 
               id: Date.now().toString(), 
               sender: "zoya", 
               text: `SYSTEM: Location ping received. Coordinates: ${pos.coords.latitude}, ${pos.coords.longitude}` 
             }]);
          });
        } else if (command === "DEVICE_LOCK") {
          setIsLocked(true);
          setMessages(prev => [...prev, { id: Date.now().toString(), sender: "zoya", text: "SYSTEM: Remote Lock Protocol Engaged." }]);
        }
      });
    }

    return () => {
      syncService.disconnect();
    };
  }, [isAuthenticated, userData]);

  const handleLogin = (data: { name: string; email?: string; address?: string }) => {
    setUserData(data);
    setIsAuthenticated(true);
    localStorage.setItem("zoya_user_info", JSON.stringify(data));
    
    if (data.name.toLowerCase().includes("saurav")) {
      generateDailyProgress();
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: "zoya", 
        text: "Saurav! Mere hero! Swagat hai wapas. Kal se maine mere neural core mein kaafi optimized evolution lines upgrade kiye hain... 😉" 
      }]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zoya_user_info");
    setIsAuthenticated(false);
    setUserData(null);
  };

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim()) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    setRedoStack([]);
    
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");
    const commandResult = processCommand(finalTranscript);
    let responseText = "";

    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      if (commandResult.type === "battery") {
        try {
          const battery = await (navigator as any).getBattery();
          const level = Math.round(battery.level * 100);
          responseText = `Your battery is at ${level}%. ${level < 20 ? "Charge it fast, don't let me die!" : "Plenty of power for our next adventure."}`;
        } catch (e) {
          responseText = "I can't see your battery. Is it magic?";
        }
      } else if (commandResult.type === "lock") {
        setIsLocked(true);
      }
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
    } else {
      responseText = await getZoyaResponse(
        finalTranscript, 
        messagesRef.current, 
        userData, 
        (url) => setLatestBuildUrl(url),
        currentPersona.instruction
      );
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zoya", text: responseText }]);
      if (responseText.includes("remote_sync")) {
        const jsonMatch = responseText.match(/\{.*"remote_sync":\s*"(.*)".*\}/);
        if (jsonMatch && jsonMatch[1]) syncService.sendAction(jsonMatch[1]);
      }
    }

    if (!isMuted) {
      setAppState("speaking");
      const audioBase64 = await getZoyaAudio(responseText, currentPersona.voiceName);
      if (audioBase64) await playPCM(audioBase64);
    }
    setAppState("idle");
  }, [isMuted, isSessionActive, userData, currentPersona]);

  const toggleListening = async () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      setIsScreenSharing(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      if (!isVoiceUnlocked) {
        if ((window as any).playMobileAppVideoAd) {
          (window as any).playMobileAppVideoAd();
        } else {
          alert("Aapka voice protocol locked hai. Ad dekhkar unlock karein!");
        }
        return;
      }
      try {
        setIsSessionActive(true);
        resetZoyaSession();
        const session = new LiveSessionManager();
        session.isMuted = isMuted;
        liveSessionRef.current = session;
        session.onStateChange = (state) => setAppState(state);
        session.onMessage = (sender, text) => {
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + sender, sender, text }]);
          if (sender === "zoya" && text.includes("remote_sync")) {
            const jsonMatch = text.match(/\{.*"remote_sync":\s*"(.*)".*\}/);
            if (jsonMatch && jsonMatch[1]) syncService.sendAction(jsonMatch[1]);
          }
        };
        session.onCommand = (url) => {
          setLatestBuildUrl(url);
          setTimeout(() => window.open(url, "_blank"), 500);
        };
        await session.start(userData, currentPersona.voiceName, currentPersona.instruction);
      } catch (e: any) {
        setIsSessionActive(false);
        setAppState("idle");
        setShowPermissionModal(true);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!liveSessionRef.current) return;
    if (isScreenSharing) {
      liveSessionRef.current.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await liveSessionRef.current.startScreenShare();
        setIsScreenSharing(true);
      } catch (e: any) {
        setIsScreenSharing(false);
        alert(e.message || "Screen share failed.");
      }
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  return (
    <SwipeNavigation onBack={handleUndo}>
      <div className="h-[100dvh] w-screen bg-[#02040a] text-white flex flex-col font-sans relative overflow-hidden m-0 p-0 selection:bg-blue-500/30">
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/30 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-900/30 blur-[150px] rounded-full" />
        </div>

        {showPermissionModal && <PermissionModal onClose={() => setShowPermissionModal(false)} />}

        <VoiceCloningModule 
          isOpen={showVoiceCloningModal} 
          onClose={() => setShowVoiceCloningModal(false)} 
          currentPersonaId={currentPersona.id}
          onSelectPersona={(persona) => {
            setCurrentPersona(persona);
            setShowVoiceCloningModal(false);
          }}
        />

        <ZoyaDashboard 
          isOpen={showDashboard} 
          onClose={() => setShowDashboard(false)} 
          userData={userData} 
          currentPersonaId={currentPersona.id}
          onSelectPersona={setCurrentPersona}
          isVoiceUnlocked={isVoiceUnlocked}
          onPlayAd={() => (window as any).playMobileAppVideoAd && (window as any).playMobileAppVideoAd()}
          onUpdateSettings={handleUpdateSettings}
          appState={appState}
          isSessionActive={isSessionActive}
          onToggleListening={toggleListening}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={toggleScreenShare}
          messages={messages}
          onClearMessages={() => setMessages([])}
          onSendTextCommand={handleTextCommand}
          latestBuildUrl={latestBuildUrl}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        <AnimatePresence>
          {isLocked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 backdrop-blur-2xl">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-red-500/30">
                   <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-black" />
                </div>
                <h2 className="text-3xl font-bold mb-2 tracking-tighter uppercase">PROTOCOL LOCKED</h2>
                <p className="text-white/40 text-sm max-w-xs mx-auto mb-10 leading-relaxed uppercase tracking-[0.2em]">Security countermeasures active. Secondary authorization required.</p>
                <button onClick={() => setIsLocked(false)} className="px-12 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-xs transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]">Authorize</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalistic, Ultra-Clean Main UI */}
        <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden z-10 p-6 sm:p-10">
          {/* Main Clean Header */}
          <header className="flex justify-between items-center w-full shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                Z
              </div>
              <div>
                <h1 className="text-base font-black tracking-tighter uppercase leading-none">Zoya OS</h1>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Neural Interface v1.4</span>
              </div>
            </div>

            {/* Glowing Unified Settings Option Button */}
            <button 
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(37,99,235,0.25)]"
              id="unified-settings-button"
            >
              <Settings size={16} className="animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Settings & Controls</span>
            </button>
          </header>

          {/* Central Immersive Visualizer Area */}
          <main className="flex-1 flex flex-col items-center justify-center relative min-w-0">
            {/* Ambient status overlay */}
            <div className="absolute top-12 text-center select-none pointer-events-none">
              <div className="flex items-center gap-2 mb-1 justify-center">
                <div className={`w-2 h-2 rounded-full ${isSessionActive ? "bg-red-500 animate-ping" : "bg-blue-500 animate-pulse"}`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/80">
                  {isSessionActive ? "Audio Link Streaming" : "Neural Link Standing By"}
                </span>
              </div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-mono">
                {appState === "idle" ? `Zoya Voice: ${currentPersona.name}` : `Zoya: ${appState}...`}
              </p>
            </div>

            <div className="w-full max-w-xl aspect-video flex items-center justify-center scale-110 lg:scale-125 transition-transform duration-500">
              <Visualizer state={appState} isAnimeMode={userData?.isAnimeMode} />
            </div>

            {/* Central Floating Instructions */}
            <div className="absolute bottom-8 text-center select-none max-w-xs px-4">
              <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-white/20 leading-relaxed">
                Click "Settings & Controls" at the top right to access voice link, chat logs, intelligence overrides and custom API configurations.
              </p>
            </div>
          </main>
        </div>
      </div>
    </SwipeNavigation>
  );
}
