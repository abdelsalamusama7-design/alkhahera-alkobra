import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";

type Props = {
  title: string;
  excerpt?: string | null;
  content?: string | null;
};

export function ArticleVoice({ title, excerpt, content }: Props) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const buildText = () => {
    const parts = [title];
    if (excerpt) parts.push(excerpt);
    if (content) parts.push(content);
    return parts.join("\n\n").slice(0, 6000);
  };

  const pickArabicVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /ar[-_]/i.test(v.lang)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("ar")) ||
      voices[0]
    );
  };

  const handlePlay = () => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    if (paused) {
      synth.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(buildText());
    u.lang = "ar-EG";
    u.rate = 0.95;
    u.pitch = 1;
    const voice = pickArabicVoice();
    if (voice) u.voice = voice;
    u.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    u.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterRef.current = u;
    // Voices may load async
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => {
        const v = pickArabicVoice();
        if (v) u.voice = v;
        synth.speak(u);
      };
    } else {
      synth.speak(u);
    }
    setPlaying(true);
    setPaused(false);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setPaused(true);
    setPlaying(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  };

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2 mb-4">
      <Volume2 size={16} className="text-gold" />
      <span className="text-sm font-bold text-primary">استمع للخبر</span>
      <div className="flex items-center gap-1 mr-auto">
        {!playing ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors text-xs font-bold px-3 py-1.5 rounded-full min-h-[36px]"
            aria-label="تشغيل القراءة الصوتية"
          >
            <Play size={14} />
            {paused ? "متابعة" : "تشغيل"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground transition-colors text-xs font-bold px-3 py-1.5 rounded-full min-h-[36px]"
            aria-label="إيقاف مؤقت"
          >
            <Pause size={14} />
            إيقاف مؤقت
          </button>
        )}
        {(playing || paused) && (
          <button
            onClick={handleStop}
            className="flex items-center gap-1 bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs font-bold px-3 py-1.5 rounded-full min-h-[36px] border border-border"
            aria-label="إيقاف"
          >
            <Square size={14} />
            إيقاف
          </button>
        )}
      </div>
    </div>
  );
}
