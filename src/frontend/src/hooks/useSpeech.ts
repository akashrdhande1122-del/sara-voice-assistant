import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechVoice = SpeechSynthesisVoice | null;

function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechVoice {
  // Prefer en-IN female voices
  const inFemale = voices.find(
    (v) =>
      v.lang.startsWith("en-IN") &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("woman") ||
        v.name.toLowerCase().includes("heera") ||
        v.name.toLowerCase().includes("ravi") === false),
  );
  if (inFemale) return inFemale;

  // Prefer en-US female voices
  const usFemale = voices.find(
    (v) =>
      v.lang.startsWith("en-US") &&
      (v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("susan") ||
        v.name.toLowerCase().includes("zira")),
  );
  if (usFemale) return usFemale;

  // Fallback: any en voice, pick second if available (often female)
  const enVoices = voices.filter((v) => v.lang.startsWith("en"));
  return enVoices[1] ?? enVoices[0] ?? voices[0] ?? null;
}

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectedVoice = useRef<SpeechVoice>(null);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        selectedVoice.current = pickFemaleVoice(available);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (selectedVoice.current) utter.voice = selectedVoice.current;
    utter.lang = "en-IN";
    utter.rate = 0.95;
    utter.pitch = 1.1;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
  }, []);

  const cancelSpeak = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancelSpeak, voices, selectedVoice };
}
