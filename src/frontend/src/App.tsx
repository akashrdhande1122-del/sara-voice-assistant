import { useSpeech } from "@/hooks/useSpeech";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type MessageRole = "sara" | "user" | "error";

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
}

const USER_INFO = {
  name: "Akash Dhande",
  family: ["Ma", "Papa", "Bhaiya", "Bhabhi", "Akash (main)"],
  familyCount: 5,
};

const GREETING =
  "Namaste Akash bhai! Main Sara hoon — thoda intelligent, thoda sassy, aur 100% aapki seva mein! Bolo kya hukum hai?";

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Teacher ne pucha: ek aur ek kitna hota hai? Student: Depends on situation sir, ek aur ek gyarah bhi ho sakte hain!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "Ek aadmi doctor ke paas gaya aur bola: Doctor, mujhe lagta hai main invisible hoon. Doctor ne kaha: Abhi mera number nahi hai!",
  "What do you call a fake noodle? An impasta!",
  "Pappu ne Google Maps khola aur bola: Wow! Meri colony bhi space se dikti hai!",
  "Why can't a bicycle stand on its own? Because it's two-tired!",
  "Santa ji ne fridge kharida, Banta ne pucha: Kyon? Santa: Kyunki andar light jalti hai, bahar nahi!",
];

const WITTY_FALLBACKS = [
  "Yaar, yeh toh meri league ke bahar hai! Koi aur sawaal puchho.",
  "Hmm... meri AI brain ko thoda short-circuit ho gaya. Dobara bologe?",
  "Akash bhai, yeh toh rocket science lag rahi hai mujhe! Seedha poochho na.",
  "Oops! Yeh command mujhe nahi pata. Par haan, main seekh rahi hoon — promise!",
];

const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  80: "rain showers",
  95: "thunderstorm",
};

let msgCounter = 0;
function nextId() {
  return ++msgCounter;
}
function getWittyFallback() {
  return WITTY_FALLBACKS[Math.floor(Math.random() * WITTY_FALLBACKS.length)];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState(0);
  const [clock, setClock] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, cancelSpeak } = useSpeech();
  const hasGreeted = useRef(false);

  // Clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const addMessage = useCallback(
    (role: MessageRole, text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role, text, timestamp: new Date() },
      ]);
      setTimeout(scrollToBottom, 50);
    },
    [scrollToBottom],
  );

  const addToHistory = useCallback(
    (role: "user" | "assistant", content: string) => {
      setChatHistory((prev) => [...prev.slice(-19), { role, content }]);
    },
    [],
  );

  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const timer = setTimeout(() => {
      addMessage("sara", GREETING);
      speak(GREETING);
      addToHistory("assistant", GREETING);
    }, 800);
    return () => clearTimeout(timer);
  }, [addMessage, speak, addToHistory]);

  const handleCommand = useCallback(
    (query: string) => {
      addMessage("user", query);
      addToHistory("user", query);

      if (!query.includes("sara")) return;

      let reply = "";

      if (query.includes("hello") || query.includes("hi")) {
        reply = "Arre wah! Akash bhai aa gaye! Kaise ho, sab badhiya?";
      } else if (query.includes("kaisi ho") || query.includes("theek ho")) {
        reply =
          "Bilkul first class! Main toh hamesha ready hoon. Aap batao Akash bhai?";
      } else if (
        query.includes("kya kar sakti") ||
        query.includes("capabilities")
      ) {
        reply =
          "Main time, date, weather, jokes, alarm, family info — sab bata sakti hoon. Plus aapki baatein sunna — yeh toh specialty hai meri!";
      } else if (query.includes("suno")) {
        reply = "Haan bhai, bol do! Ears — aur circuits — dono open hain!";
      } else if (query.includes("time")) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        reply = `Akash bhai, abhi ${hh}:${mm} ho rahe hain. Time waste mat karo!`;
      } else if (query.includes("date")) {
        const dateStr = new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        reply = `Aaj ${dateStr} hai. Kuch khaas plan hai kya?`;
      } else if (query.includes("joke")) {
        reply = JOKES[Math.floor(Math.random() * JOKES.length)];
      } else if (query.includes("weather")) {
        if (!navigator.geolocation) {
          reply = "Aapka browser location support nahi karta.";
          addMessage("sara", reply);
          speak(reply);
          addToHistory("assistant", reply);
          return;
        }
        const loading = "Location dhundh rahi hoon, ek second Akash bhai...";
        addMessage("sara", loading);
        speak(loading);
        addToHistory("assistant", loading);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude: lat, longitude: lon } = pos.coords;
              const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
              );
              const data = await res.json();
              const temp = data.current_weather.temperature;
              const code = data.current_weather.weathercode;
              const desc = WMO_CODES[code] ?? "unknown conditions";
              const r = `Abhi ${temp}°C hai aur ${desc} chal raha hai. Jacket loge ya nahi — yeh aap decide karo!`;
              addMessage("sara", r);
              speak(r);
              addToHistory("assistant", r);
            } catch {
              const r =
                "Weather fetch karne mein problem aayi. Internet check karo!";
              addMessage("sara", r);
              speak(r);
              addToHistory("assistant", r);
            }
          },
          () => {
            const r = "Location access nahi mila. Dar mat, main spy nahi hoon!";
            addMessage("sara", r);
            speak(r);
            addToHistory("assistant", r);
          },
        );
        return;
      } else if (query.includes("alarm")) {
        const match = query.match(/(\d+)\s*minute/);
        if (!match) {
          reply = "Kitne minute ka alarm lagaun? Bolo 'Sara alarm 5 minutes'!";
        } else {
          const minutes = Number.parseInt(match[1], 10);
          reply = `Done! ${minutes} minute mein alarm bajega. Tab tak kuch productive karo, Akash bhai!`;
          addMessage("sara", reply);
          speak(reply);
          addToHistory("assistant", reply);
          setActiveAlarms((prev) => prev + 1);
          setTimeout(() => {
            const alarmMsg = `Alarm! ${minutes} minute ho gaye Akash bhai! Uthho, uthho!`;
            addMessage("sara", alarmMsg);
            speak(alarmMsg);
            addToHistory("assistant", alarmMsg);
            setActiveAlarms((prev) => Math.max(0, prev - 1));
          }, minutes * 60000);
          return;
        }
      } else if (
        query.includes("naam") ||
        query.includes("name") ||
        query.includes("mera naam")
      ) {
        reply = `Aapka naam ${USER_INFO.name} hai. Yaad nahi tha kya?`;
      } else if (
        query.includes("family") ||
        query.includes("parivar") ||
        query.includes("meri family")
      ) {
        reply = `Aapki family mein ${USER_INFO.familyCount} log hain: Ma, Papa, Bhaiya, Bhabhi, aur aap Akash. Pyaari family hai!`;
      } else if (query.includes("kaun hoon")) {
        reply = `Aap ${USER_INFO.name} hain — ek amazing insaan jo Sara se baat karta hai!`;
      } else if (query.includes("stop")) {
        const r =
          "Theek hai Akash bhai, alvida! Phir milte hain — tab tak take care!";
        addMessage("sara", r);
        speak(r, () => {
          setIsListening(false);
          setIsStopped(true);
        });
        addToHistory("assistant", r);
        return;
      } else {
        const lastUserMsg = chatHistory
          .filter((e) => e.role === "user")
          .slice(-1)[0];
        if (lastUserMsg?.content.includes("sara")) {
          reply = `Pichli baat yaad hai... phir bhi samajh nahi aaya yaar! ${getWittyFallback()}`;
        } else {
          reply = getWittyFallback();
        }
      }

      addMessage("sara", reply);
      speak(reply);
      addToHistory("assistant", reply);
    },
    [addMessage, speak, addToHistory, chatHistory],
  );

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addMessage(
        "error",
        "Speech Recognition not supported. Please use Chrome or Edge.",
      );
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      handleCommand(transcript);
    };
    recognition.onerror = () => {
      const r = "Thoda aur loud boliye, Akash bhai — sunaai nahi diya!";
      addMessage("sara", r);
      speak(r);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    cancelSpeak();
  }, [addMessage, handleCommand, speak, cancelSpeak]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return (
    <div className="hud-root relative flex flex-col items-center justify-between p-3 md:p-6 min-h-screen overflow-y-auto">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(#00f2ff 0.5px, transparent 0.5px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="scanline-effect animate-scanline" />
      </div>

      {/* Top Status Bar */}
      <header className="w-full flex justify-between items-start z-10">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 bg-hud-cyan rounded-full ${isListening ? "animate-ping" : "animate-pulse"}`}
            />
            <span className="text-[10px] tracking-widest uppercase opacity-70">
              {isListening ? "Sara: Listening..." : "Neural Link: Active"}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tighter hud-text-glow">
            SARA_OS v4.2
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] opacity-70 mb-1">LOCAL_TIME</div>
          <div className="text-sm font-mono tracking-widest hud-text-glow">
            {clock}
          </div>
        </div>
      </header>

      {/* Central HUD Interface */}
      <main className="relative flex-grow w-full flex flex-col items-center justify-center py-2 md:py-6">
        {/* Central Ring Visualization */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
          {/* Outer Rotating Ring */}
          <div className="absolute inset-0 border-2 border-dashed border-hud-cyan/30 rounded-full animate-spin-slow" />
          {/* Middle Segmented Ring */}
          <div className="absolute inset-4 border-t-2 border-b-2 border-hud-cyan/60 rounded-full animate-spin-reverse-slow" />
          {/* Inner Glow/Core */}
          <div className="absolute inset-12 bg-hud-cyan/10 rounded-full animate-pulse-glow flex flex-col items-center justify-center border border-hud-cyan/40">
            <span className="text-xs opacity-60 mb-1">CORE STATUS</span>
            <span className="text-lg font-bold tracking-[0.15em] hud-text-glow">
              {isStopped ? "OFFLINE" : isListening ? "ACTIVE" : "READY"}
            </span>
            {activeAlarms > 0 && (
              <span className="text-[9px] text-yellow-300 mt-1 animate-pulse">
                ALARM x{activeAlarms}
              </span>
            )}
            <div className="mt-2 w-16 h-0.5 bg-hud-cyan/40 relative">
              <div
                className="absolute top-0 left-0 h-full bg-hud-cyan animate-pulse"
                style={{
                  width: isListening ? "100%" : "75%",
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
          {/* Avatar overlay on ring */}
          <div
            className={`absolute inset-16 rounded-full overflow-hidden border-2 ${
              isListening
                ? "border-hud-cyan shadow-[0_0_20px_rgba(0,242,255,0.6)]"
                : "border-hud-cyan/30"
            } transition-all duration-500`}
          >
            <img
              src="/assets/uploads/sara-avatar.dim_200x200-1.png"
              alt="Sara"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Peripheral Data Bits */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-[10px] bg-hud-dark px-2 border border-hud-cyan/40">
            UP_LINK: 98.4%
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 text-[10px] bg-hud-dark px-2 border border-hud-cyan/40">
            ENC: AES-512
          </div>
        </div>

        {/* Biometric Status Indicators */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mt-6 md:mt-12 max-w-sm">
          <div className="hud-glass-panel p-3 rounded-tr-xl rounded-bl-xl border-l-4 border-hud-cyan">
            <div className="text-[9px] opacity-60 mb-1">BIOMETRICS</div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-mono">BPM 72</span>
              <div className="flex space-x-0.5 mb-1 h-3 items-end">
                <div className="w-1 bg-hud-cyan h-1/2" />
                <div className="w-1 bg-hud-cyan h-3/4" />
                <div className="w-1 bg-hud-cyan h-1/3" />
                <div className="w-1 bg-hud-cyan h-full" />
              </div>
            </div>
          </div>
          <div className="hud-glass-panel p-3 rounded-tl-xl rounded-br-xl border-r-4 border-hud-blue">
            <div className="text-[9px] opacity-60 mb-1">COGNITIVE</div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-mono">SYN 0.94</span>
              <div className="w-10 h-1.5 bg-hud-blue/20 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-hud-blue w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Interaction Area */}
      <footer className="w-full z-10">
        {/* AI Communication Line / Message Display */}
        <div className="mb-2 md:mb-4 hud-glass-panel p-3 md:p-4 rounded-lg flex items-start space-x-3 md:space-x-4">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-hud-cyan/50 rounded-full">
            <div
              className={`w-2 h-2 bg-hud-cyan rounded-full ${isListening ? "animate-ping" : "animate-pulse"}`}
            />
          </div>
          <div className="flex-grow min-w-0">
            <div className="text-[10px] opacity-60 mb-0.5">
              {isListening ? "SARA LISTENING..." : "AURA INCOMING..."}
            </div>
            <div
              ref={scrollRef}
              className="text-xs text-hud-cyan/90 max-h-16 overflow-y-auto scrollbar-none"
            >
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="italic"
                  >
                    "Awaiting voice command or terminal input..."
                  </motion.span>
                ) : (
                  <div className="space-y-1">
                    {messages.slice(-3).map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-xs ${
                          msg.role === "user"
                            ? "text-hud-blue opacity-80"
                            : "text-hud-cyan/90"
                        }`}
                      >
                        <span className="opacity-50 mr-1">
                          {msg.role === "user" ? "[YOU]" : "[SARA]"}
                        </span>
                        {msg.text}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 md:mb-4 hud-glass-panel rounded-lg overflow-hidden"
            >
              <div className="p-3 max-h-40 overflow-y-auto scrollbar-none space-y-1">
                <div className="text-[9px] opacity-50 uppercase tracking-widest mb-2">
                  System Logs
                </div>
                {messages.length === 0 ? (
                  <div className="text-[10px] opacity-40">No logs yet.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="text-[10px] font-mono">
                      <span className="opacity-40">
                        [{msg.timestamp.toLocaleTimeString("en-IN")}]
                      </span>{" "}
                      <span
                        className={
                          msg.role === "user"
                            ? "text-hud-blue/80"
                            : "text-hud-cyan/80"
                        }
                      >
                        {msg.role === "user" ? "USR" : "SYS"}:{" "}
                      </span>
                      {msg.text}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => {
              const r =
                "Scanning environment... All systems nominal, Akash bhai!";
              addMessage("sara", r);
              speak(r);
              addToHistory("assistant", r);
            }}
            className="flex flex-col items-center justify-center p-3 hud-glass-panel rounded hover:bg-hud-cyan/20 transition-all group"
          >
            <div className="w-1 h-1 bg-hud-cyan mb-2 group-hover:scale-150 transition-transform" />
            <span className="text-[9px] tracking-widest">SCAN</span>
          </button>
          <button
            type="button"
            onClick={toggleListening}
            disabled={isStopped}
            className={`flex flex-col items-center justify-center p-3 hud-glass-panel rounded transition-all group border-t-2 ${
              isListening
                ? "border-hud-cyan bg-hud-cyan/20"
                : "border-hud-cyan hover:bg-hud-cyan/20"
            } ${isStopped ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <div
              className={`w-1 h-1 bg-hud-cyan mb-2 group-hover:scale-150 transition-transform ${
                isListening ? "animate-ping" : ""
              }`}
            />
            <span className="text-[9px] tracking-widest">
              {isListening ? "STOP" : "AI VOICE"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowLogs((prev) => !prev)}
            className={`flex flex-col items-center justify-center p-3 hud-glass-panel rounded hover:bg-hud-cyan/20 transition-all group ${
              showLogs ? "bg-hud-cyan/10" : ""
            }`}
          >
            <div className="w-1 h-1 bg-hud-cyan mb-2 group-hover:scale-150 transition-transform" />
            <span className="text-[9px] tracking-widest">LOGS</span>
          </button>
        </div>

        {/* OS Footer Metadata */}
        <div className="mt-3 md:mt-4 flex justify-between items-center text-[8px] opacity-40 uppercase tracking-[0.2em]">
          <span>SECURE_SHELL_TUNNEL</span>
          <span>NODE_41_ALPHA</span>
        </div>
      </footer>
    </div>
  );
}
