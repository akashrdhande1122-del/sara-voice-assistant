import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from "@/hooks/useSpeech";
import { Bell, Mic, MicOff, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type MessageRole = "sara" | "user" | "error";

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

const USER_INFO = {
  name: "Akash Dhande",
  family: ["Ma", "Papa", "Bhaiya", "Bhabhi", "Akash (main)"],
  familyCount: 5,
};

const GREETING =
  "Hello Akash bhai! Main Sara hoon. Aapki kya madad kar sakti hoon?";

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Teacher ne pucha: ek aur ek kitna hota hai? Student: Depends on situation sir, ek aur ek gyarah bhi ho sakte hain!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "Ek aadmi doctor ke paas gaya aur bola: Doctor, mujhe lagta hai main invisible hoon. Doctor ne kaha: Abhi mera number nahi hai!",
  "What do you call a fake noodle? An impasta!",
  "Pappu ne Google Maps khola aur bola: Wow! Meri colony bhi space se dikti hai!",
  "Why can't a bicycle stand on its own? Because it's two-tired!",
  "Santa ji ne fridge kharida, Banta ne pucha: Kyon? Santa: Kyunki andar light jalti hai, bahar nahi!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised!",
  "Ek aadmi ped pe chadh gaya, logon ne pucha kya kar rahe ho? Bola: Maine sunha tha upar jakkar dekho, toh main dekh raha hoon!",
  "Why did the math book look so sad? Because it had too many problems!",
  "Student to exam paper: I know you. I've seen you in my nightmares!",
  "Husband: Darling, aaj dinner mein kya banaya? Wife: Google karo!",
  "What do you call cheese that isn't yours? Nacho cheese!",
  "Boss ne pucha: Tum late kyun aaye? Employee: Traffic tha. Boss: Tum paidal aate ho!",
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

let msgCounter = 0;
function nextId() {
  return ++msgCounter;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
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

  // Greet on mount
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const timer = setTimeout(() => {
      addMessage("sara", GREETING);
      speak(GREETING);
    }, 800);
    return () => clearTimeout(timer);
  }, [addMessage, speak]);

  const handleCommand = useCallback(
    (query: string) => {
      addMessage("user", query);

      if (!query.includes("sara")) {
        return;
      }

      if (query.includes("hello") || query.includes("hi")) {
        const response = "Hi Akash bhai! Kaise ho aap?";
        addMessage("sara", response);
        speak(response);
      } else if (query.includes("time")) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const response = `Abhi ${hh}:${mm} ho rahe hain.`;
        addMessage("sara", response);
        speak(response);
      } else if (query.includes("date")) {
        const dateStr = new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const response = `Aaj ${dateStr} hai.`;
        addMessage("sara", response);
        speak(response);
      } else if (query.includes("joke")) {
        const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
        addMessage("sara", joke);
        speak(joke);
      } else if (query.includes("weather")) {
        if (!navigator.geolocation) {
          const response = "Aapka browser location support nahi karta.";
          addMessage("sara", response);
          speak(response);
          return;
        }
        const loadingMsg = "Location dhundh rahi hoon, ek second...";
        addMessage("sara", loadingMsg);
        speak(loadingMsg);
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
              const response = `Abhi ${temp}°C hai aur ${desc} hai.`;
              addMessage("sara", response);
              speak(response);
            } catch {
              const response =
                "Weather fetch karne mein problem aayi. Internet check karein.";
              addMessage("sara", response);
              speak(response);
            }
          },
          () => {
            const response =
              "Location access nahi mila. Please allow location.";
            addMessage("sara", response);
            speak(response);
          },
        );
      } else if (query.includes("alarm")) {
        const match = query.match(/(\d+)\s*minute/);
        if (!match) {
          const response =
            "Kitne minute ka alarm lagaun? Boliye 'Sara alarm 5 minutes'.";
          addMessage("sara", response);
          speak(response);
        } else {
          const minutes = Number.parseInt(match[1], 10);
          const response = `Theek hai, ${minutes} minute mein alarm bajega.`;
          addMessage("sara", response);
          speak(response);
          setActiveAlarms((prev) => prev + 1);
          setTimeout(() => {
            const alarmMsg = `Alarm! ${minutes} minute ho gaye!`;
            addMessage("sara", alarmMsg);
            speak(alarmMsg);
            setActiveAlarms((prev) => Math.max(0, prev - 1));
          }, minutes * 60000);
        }
      } else if (
        query.includes("naam") ||
        query.includes("name") ||
        query.includes("mera naam")
      ) {
        const response = `Aapka naam ${USER_INFO.name} hai.`;
        addMessage("sara", response);
        speak(response);
      } else if (
        query.includes("family") ||
        query.includes("parivar") ||
        query.includes("ghar") ||
        query.includes("meri family")
      ) {
        const response = `Aapki family mein ${USER_INFO.familyCount} log hain: Ma, Papa, Bhaiya, Bhabhi, aur aap Akash.`;
        addMessage("sara", response);
        speak(response);
      } else if (query.includes("who am i") || query.includes("kaun hoon")) {
        const response = `Aap ${USER_INFO.name} hain.`;
        addMessage("sara", response);
        speak(response);
      } else if (query.includes("stop")) {
        const response = "Theek hai, bye bye Akash bhai!";
        addMessage("sara", response);
        speak(response, () => {
          setIsListening(false);
          setIsStopped(true);
        });
      } else {
        const response = "Mujhe samajh nahi aaya, please dobara boliye.";
        addMessage("sara", response);
        speak(response);
      }
    },
    [addMessage, speak],
  );

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addMessage(
        "error",
        "Speech Recognition is not supported in your browser. Please use Chrome or Edge.",
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
      addMessage("sara", "Dobara boliye...");
      speak("Dobara boliye...");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

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
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen mesh-bg noise-overlay flex flex-col">
      {/* Header */}
      <header className="relative z-10 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-semibold tracking-wide text-foreground">
              Sara
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-3">
            {activeAlarms > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1.5"
                data-ocid="alarm.panel"
              >
                <Bell className="w-4 h-4 text-primary animate-pulse" />
                <Badge variant="default" className="text-xs px-1.5 py-0 h-5">
                  {activeAlarms}
                </Badge>
              </motion.div>
            )}
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                isListening
                  ? "bg-primary animate-pulse"
                  : isStopped
                    ? "bg-destructive"
                    : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isListening ? "Listening" : isStopped ? "Stopped" : "Idle"}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-6 pt-2 max-w-3xl mx-auto w-full">
        {/* Sara Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-6"
        >
          {/* Avatar with glow rings */}
          <div className="relative flex items-center justify-center mb-4">
            {isListening && (
              <>
                <div
                  className="listening-ring-1 absolute rounded-full border border-primary/40"
                  style={{ width: 120, height: 120 }}
                />
                <div
                  className="listening-ring-2 absolute rounded-full border border-primary/20"
                  style={{ width: 120, height: 120 }}
                />
              </>
            )}
            <div className="sara-avatar-glow relative z-10 w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30">
              <img
                src="/assets/generated/sara-avatar.dim_200x200.png"
                alt="Sara"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Sara
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-sans">
            Namaste Akash bhai, main aapki Sara hoon 🙏
          </p>

          <AnimatePresence>
            {isListening && (
              <motion.div
                data-ocid="sara.loading_state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full glass-panel"
              >
                <span className="text-xs text-primary font-medium mr-2">
                  Listening...
                </span>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="wave-bar w-1 rounded-full bg-primary"
                    style={{ height: 4 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Conversation Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full flex-1 glass-panel rounded-2xl overflow-hidden mb-6"
          style={{ minHeight: 280, maxHeight: 380 }}
        >
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Conversation
            </span>
          </div>
          <ScrollArea className="h-80">
            <div
              ref={scrollRef}
              data-ocid="sara.conversation.list"
              className="p-4 space-y-3 scrollbar-thin"
            >
              <AnimatePresence initial={false}>
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                    Conversation will appear here...
                  </div>
                )}
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    data-ocid={`sara.item.${index + 1}`}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.role === "sara"
                          ? "sara-bubble rounded-tl-sm"
                          : msg.role === "error"
                            ? "bg-destructive/20 border border-destructive/30 rounded-tr-sm"
                            : "user-bubble rounded-tr-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            msg.role === "sara"
                              ? "text-primary"
                              : msg.role === "error"
                                ? "text-destructive"
                                : "text-accent"
                          }`}
                        >
                          {msg.role === "sara"
                            ? "Sara"
                            : msg.role === "error"
                              ? "System"
                              : "Akash"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>

        {/* Mic Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="flex flex-col items-center gap-3"
        >
          <button
            type="button"
            data-ocid="sara.mic_button"
            onClick={toggleListening}
            disabled={isStopped}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            className={`relative w-20 h-20 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              isStopped
                ? "opacity-40 cursor-not-allowed bg-muted border border-border"
                : isListening
                  ? "bg-primary/20 border-2 border-primary shadow-cyan-glow-lg scale-110"
                  : "bg-primary/10 border-2 border-primary/50 hover:bg-primary/20 hover:border-primary hover:shadow-cyan-glow hover:scale-105"
            }`}
          >
            <span className="flex items-center justify-center w-full h-full">
              {isListening ? (
                <MicOff className="w-8 h-8 text-primary" />
              ) : (
                <Mic className="w-8 h-8 text-primary" />
              )}
            </span>
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {isStopped
              ? "Session ended — refresh to restart"
              : isListening
                ? "Tap to stop"
                : 'Tap to speak — say "Sara" to activate'}
          </p>
        </motion.div>

        {/* Commands hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-6 w-full glass-panel rounded-xl px-4 py-3"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            Commands
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              '"Sara hello"',
              '"Sara time"',
              '"Sara date"',
              '"Sara weather"',
              '"Sara joke"',
              '"Sara alarm 5 minutes"',
              '"Sara mera naam"',
              '"Sara meri family"',
              '"Sara stop"',
            ].map((cmd) => (
              <span
                key={cmd}
                data-ocid="sara.command.tab"
                className="text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono"
              >
                {cmd}
              </span>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
