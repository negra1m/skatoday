"use client";

import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

export function VoiceCapture({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const [supported, setSupported] = React.useState(true);
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);

  React.useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Cls = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Cls) {
      setSupported(false);
    }
  }, []);

  const start = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Cls = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Cls) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    const r = new Cls();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "pt-BR";
    r.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        onTranscript(finalText.trim());
        setInterim("");
      }
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    r.onerror = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = r;
    r.start();
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  if (!supported) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={listening ? stop : start}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-secondary px-3 text-sm transition-colors",
          listening && "border-red-500 bg-red-500/10 text-red-300",
        )}
      >
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {listening ? "Ouvindo..." : "Ditar"}
      </button>
      {interim && (
        <p className="text-xs italic text-muted-foreground">{interim}</p>
      )}
    </div>
  );
}
