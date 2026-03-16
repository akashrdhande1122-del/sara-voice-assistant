import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from "@/hooks/useSpeech";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type MessageRole = "sara" | "user" | "error";

interface Message {
  id: number;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

const GREETING = "Hello, main Sara hoon. Main aapki kya madad kar sakti hoon?";

let msgCounter = 0;
function nextId() {
  return ++msgCounter;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
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

      let response = "";

      if (query.includes("hello") || query.includes("hi")) {
        response = "Hi! Kaise ho aap?";
      } else if (query.includes("time")) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        response = `Abhi ${hh}:${mm} ho rahe hain.`;
      } else if (query.includes("stop")) {
        response = "Theek hai, bye bye!";
        addMessage("sara", response);
        speak(response, () => {
          setIsListening(false);
          setIsStopped(true);
        });
        return;
      } else {
        response = "Mujhe samajh nahi aaya, please dobara boliye.";
      }

      addMessage("sara", response);
      speak(response);
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
          <div className="flex items-center gap-2">
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
            Aapki AI Voice Assistant
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
                              : "You"}
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
            {['"Sara hello"', '"Sara time"', '"Sara stop"'].map((cmd) => (
              <span
                key={cmd}
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
