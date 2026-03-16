import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/useSpeech";
import { Bell, Mic, MicOff, Signal, Sparkles, Wifi } from "lucide-react";
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
  "Husband: Darling, aaj dinner mein kya banaya? Wife: Google karo!",
  "Boss ne pucha: Tum late kyun aaye? Employee: Traffic tha. Boss: Tum paidal aate ho!",
];

const WITTY_FALLBACKS = [
  "Yaar, yeh toh meri league ke bahar hai! Koi aur sawaal puchho.",
  "Hmm... meri AI brain ko thoda short-circuit ho gaya. Dobara bologe?",
  "Akash bhai, yeh toh rocket science lag rahi hai mujhe! Seedha poochho na.",
  "Oops! Yeh command mujhe nahi pata. Par haan, main seekh rahi hoon — promise!",
  "Yeh kya bol diya aapne? Main confuse ho gayi. Try karo 'Sara kya kar sakti ho'.",
  "Arre, itna difficult kyun karte ho? Simple rakhte hain baat ko, Akash bhai!",
];

const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  95: "thunderstorm",
};

const COMMANDS = [
  '"Sara hello"',
  '"Sara time"',
  '"Sara date"',
  '"Sara weather"',
  '"Sara joke"',
  '"Sara alarm 5 minutes"',
  '"Sara mera naam"',
  '"Sara meri family"',
  '"Sara kaisi ho"',
  '"Sara kya kar sakti ho"',
  '"Sara suno"',
  '"Sara stop"',
];

let msgCounter = 0;
function nextId() {
  return ++msgCounter;
}

function getWittyFallback() {
  return WITTY_FALLBACKS[Math.floor(Math.random() * WITTY_FALLBACKS.length)];
}

function StatusBar({ isListening }: { isListening: boolean }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  useEffect(() => {
    const t = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="phone-status-bar flex items-center justify-between px-5 pt-3 pb-1">
      <span className="text-[11px] font-semibold text-foreground/80 tabular-nums">
        {time}
      </span>
      <div className="flex items-center gap-1.5">
        {isListening && (
          <span className="text-[9px] text-primary font-bold uppercase tracking-wider animate-pulse">
            LIVE
          </span>
        )}
        <Signal className="w-3 h-3 text-foreground/70" />
        <Wifi className="w-3 h-3 text-foreground/70" />
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-2.5 rounded-[2px] border border-foreground/50 relative flex items-center px-[1px]">
            <div
              className="h-1.5 bg-foreground/70 rounded-[1px]"
              style={{ width: "70%" }}
            />
          </div>
          <div className="w-0.5 h-1.5 bg-foreground/50 rounded-r-[1px]" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, cancelSpeak } = useSpeech();
  const hasGreeted = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      } else if (
        query.includes("kaisi ho") ||
        query.includes("theek ho") ||
        query.includes("kaisi hai")
      ) {
        reply =
          "Bilkul first class! Main toh hamesha ready hoon. Aap batao Akash bhai?";
      } else if (
        query.includes("kya kar rahi") ||
        query.includes("kya kar rahi ho")
      ) {
        reply =
          "Main aapka intezaar kar rahi thi, Akash bhai! Aur kya kaam hoga mujhe?";
      } else if (
        query.includes("kya kar sakti") ||
        query.includes("kya pata hai") ||
        query.includes("capabilities")
      ) {
        reply =
          "Oho, list lambi hai! Main time, date, weather, jokes, alarm, aapki family info — sab bata sakti hoon. Plus aapki baatein sunna — yeh toh specialty hai meri!";
      } else if (query.includes("suno")) {
        reply = "Haan bhai, bol do! Ears — aur circuits — dono open hain!";
      } else if (
        query.includes("kitni baar") ||
        query.includes("gussa") ||
        query.includes("kya yaar") ||
        query.includes("uff")
      ) {
        reply =
          "Arre yaar, itna gussa mat karo! Main toh bas ek chhoti si AI hoon. Pyaar se poochho na!";
      } else if (query.includes("time")) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        reply = `Akash bhai, abhi ${hh}:${mm} ho rahe hain. Time waste mat karo! 😄`;
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
          reply =
            "Aapka browser location support nahi karta. Purana phone hai kya?";
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
                "Weather fetch karne mein problem aayi. Internet check karo, Akash bhai!";
              addMessage("sara", r);
              speak(r);
              addToHistory("assistant", r);
            }
          },
          () => {
            const r =
              "Location access nahi mila. Dar mat, main spy nahi hoon — bas weather batana tha!";
            addMessage("sara", r);
            speak(r);
            addToHistory("assistant", r);
          },
        );
        return;
      } else if (query.includes("alarm")) {
        const match = query.match(/(\d+)\s*minute/);
        if (!match) {
          reply =
            "Kitne minute ka alarm lagaun? Bolo 'Sara alarm 5 minutes' — seedha baat, seedha kaam!";
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
        reply = `Aapka naam ${USER_INFO.name} hai. Yaad nahi tha kya? 😄`;
      } else if (
        query.includes("family") ||
        query.includes("parivar") ||
        query.includes("ghar") ||
        query.includes("meri family")
      ) {
        reply = `Aapki family mein ${USER_INFO.familyCount} log hain: Ma, Papa, Bhaiya, Bhabhi, aur aap Akash. Pyaari family hai!`;
      } else if (query.includes("who am i") || query.includes("kaun hoon")) {
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
        // Check chat history context for a callback
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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="phone-wallpaper min-h-screen flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="phone-shell relative flex flex-col w-full max-w-[420px] mx-auto overflow-hidden"
        style={{ minHeight: "100svh", maxHeight: "100svh" }}
      >
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 phone-notch z-20 rounded-b-2xl flex items-center justify-center">
          <div className="w-12 h-1 rounded-full bg-black/60" />
        </div>

        <StatusBar isListening={isListening} />

        <header className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-500 sara-avatar-glow ${
                  isListening
                    ? "border-primary shadow-cyan-glow-lg"
                    : "border-primary/30"
                }`}
              >
                <img
                  src="/assets/generated/sara-avatar.dim_200x200.png"
                  alt="Sara"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[oklch(var(--background))] bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold text-foreground leading-none">
                  Sara
                </span>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isListening
                  ? "Sun rahi hoon..."
                  : isStopped
                    ? "Session khatam"
                    : "Thoda intelligent, thoda sassy ✨"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AnimatePresence>
              {activeAlarms > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1"
                  data-ocid="alarm.panel"
                >
                  <Bell className="w-4 h-4 text-primary animate-pulse" />
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 h-4 min-w-0"
                  >
                    {activeAlarms}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isListening && (
                <motion.div
                  data-ocid="sara.loading_state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-0.5 h-5"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="wave-bar w-0.5 rounded-full bg-primary"
                      style={{ height: 4 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div
          ref={scrollRef}
          data-ocid="sara.conversation.list"
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="flex flex-col items-center justify-center gap-3 pt-16"
                data-ocid="sara.empty_state"
              >
                <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center">
                  <Mic className="w-7 h-7 text-primary/60" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Tap the mic and say "Sara..." to begin
                </p>
              </motion.div>
            )}
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                data-ocid={`sara.item.${index + 1}`}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role !== "user" && (
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0">
                    <img
                      src="/assets/generated/sara-avatar.dim_200x200.png"
                      alt="Sara"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    msg.role === "sara"
                      ? "sara-bubble rounded-tl-sm"
                      : msg.role === "error"
                        ? "bg-destructive/20 border border-destructive/30 rounded-tr-sm"
                        : "user-bubble rounded-tr-sm"
                  }`}
                >
                  <p className="text-sm text-foreground leading-relaxed">
                    {msg.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="h-2" />
        </div>

        <div className="phone-bottom border-t border-white/5 px-4 pt-2 pb-safe">
          <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {COMMANDS.map((cmd) => (
              <span
                key={cmd}
                data-ocid="sara.command.tab"
                className="flex-shrink-0 text-[11px] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono whitespace-nowrap cursor-default"
              >
                {cmd}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-center py-3">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <div
                    className="listening-ring-1 absolute rounded-full border border-primary/40"
                    style={{ width: 88, height: 88 }}
                  />
                  <div
                    className="listening-ring-2 absolute rounded-full border border-primary/20"
                    style={{ width: 88, height: 88 }}
                  />
                </>
              )}
              <button
                type="button"
                data-ocid="sara.mic_button"
                onClick={toggleListening}
                disabled={isStopped}
                aria-label={isListening ? "Stop listening" : "Start listening"}
                className={`relative z-10 w-16 h-16 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isStopped
                    ? "opacity-40 cursor-not-allowed bg-muted border border-border"
                    : isListening
                      ? "bg-primary border-0 shadow-cyan-glow-lg scale-110"
                      : "bg-primary/15 border-2 border-primary/60 hover:bg-primary/25 hover:shadow-cyan-glow active:scale-95"
                }`}
              >
                <span className="flex items-center justify-center w-full h-full">
                  {isListening ? (
                    <MicOff className="w-7 h-7 text-background" />
                  ) : (
                    <Mic className="w-7 h-7 text-primary" />
                  )}
                </span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center pb-1">
            {isStopped
              ? "Session khatam — refresh karke dobara shuru karo"
              : isListening
                ? "Tap karke rokein"
                : '"Sara" bolo aur main sun lungi!'}
          </p>

          <p className="text-[10px] text-muted-foreground/50 text-center pb-2">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Built with ♥ caffeine.ai
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
