"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export function VoiceDemoPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white/70 px-5 py-4">
      <button
        onClick={toggle}
        aria-label={playing ? "Pausieren" : "Abspielen"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bronze text-white transition-transform hover:scale-105"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Volume2 className="h-3.5 w-3.5 text-bronze" /> So klingt HalloMia wirklich
        </p>
        <p className="text-xs text-ink-faint">Echter Anruf-Ausschnitt · ~7 Sekunden</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand">
          <div className="h-full rounded-full bg-bronze transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <audio
        ref={audioRef}
        src="/marketing/demo-voice.mp3"
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
    </div>
  );
}
