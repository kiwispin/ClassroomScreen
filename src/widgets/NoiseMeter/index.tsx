import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { WidgetInstance } from '../../store/types';

export type NoiseMeterConfig = {
  threshold?: number;
};

type Status = 'idle' | 'requesting' | 'running' | 'denied' | 'error';

const NUM_BARS = 16;

export default function NoiseMeter({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as NoiseMeterConfig;
  const threshold = cfg.threshold ?? 0.5;

  const [status, setStatus] = useState<Status>('idle');
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: NUM_BARS }, () => 0));
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = async () => {
    if (status === 'running' || status === 'requesting') return;
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxCtor =
        (window as unknown as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxCtor) {
        setStatus('error');
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioCtxCtor();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      src.connect(analyser);

      const timeBuf = new Uint8Array(analyser.fftSize);
      const freqBuf = new Uint8Array(analyser.frequencyBinCount);

      // Use the lower ~half of the frequency bins (voice lives there).
      const usefulBins = Math.floor(analyser.frequencyBinCount * 0.55);
      const binsPerBar = Math.max(1, Math.floor(usefulBins / NUM_BARS));

      let raf = 0;
      const tick = () => {
        // Overall RMS for threshold detection
        analyser.getByteTimeDomainData(timeBuf);
        let sum = 0;
        for (let i = 0; i < timeBuf.length; i++) {
          const v = (timeBuf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / timeBuf.length);
        setLevel(Math.min(1, rms * 1.6));

        // Per-bar frequency magnitudes for the EQ visualization
        analyser.getByteFrequencyData(freqBuf);
        const next: number[] = new Array(NUM_BARS);
        for (let b = 0; b < NUM_BARS; b++) {
          const start_ = b * binsPerBar;
          const end_ = Math.min(usefulBins, start_ + binsPerBar);
          let bsum = 0;
          for (let i = start_; i < end_; i++) bsum += freqBuf[i];
          next[b] = Math.min(1, bsum / (end_ - start_) / 255 * 1.4);
        }
        setBars(next);

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {
          /* ignore */
        });
      };
      setStatus('running');
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? '';
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error');
    }
  };

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    [],
  );

  const over = level >= threshold;
  const pct = Math.round(level * 100);

  return (
    <div
      className="h-full w-full flex flex-col p-3 gap-2"
      style={{ containerType: 'size' as const }}
    >
      {status !== 'running' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          {status === 'denied' ? (
            <>
              <MicOff className="w-8 h-8 opacity-60" strokeWidth={1.5} />
              <div className="text-sm">Microphone permission denied.</div>
              <div className="text-xs opacity-60">
                Allow mic access in your browser, then click Try again.
              </div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded-full text-white text-sm hover:opacity-90 transition"
                style={{ background: 'var(--w-accent, #6366f1)' }}
              >
                Try again
              </button>
            </>
          ) : status === 'error' ? (
            <>
              <MicOff className="w-8 h-8 opacity-60" strokeWidth={1.5} />
              <div className="text-sm">Could not start the microphone.</div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded-full text-white text-sm hover:opacity-90 transition"
                style={{ background: 'var(--w-accent, #6366f1)' }}
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 opacity-60" strokeWidth={1.5} />
              <button
                onClick={start}
                disabled={status === 'requesting'}
                className="px-4 py-1.5 rounded-full text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                style={{ background: 'var(--w-accent, #6366f1)' }}
              >
                {status === 'requesting' ? 'Requesting…' : 'Start listening'}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 flex items-end justify-between gap-[2%] relative">
            {bars.map((h, i) => {
              const heightPct = Math.max(4, Math.round(h * 100));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-[height,background] duration-75"
                  style={{
                    height: `${heightPct}%`,
                    background: over ? '#f43f5e' : 'var(--w-accent, #6366f1)',
                  }}
                />
              );
            })}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-current opacity-30 pointer-events-none"
              style={{ bottom: `${Math.round(threshold * 100)}%` }}
              aria-label={`Threshold ${Math.round(threshold * 100)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-xs opacity-70">
            <span className="tabular-nums">{pct}%</span>
            <span>{over ? '🔊 Too loud' : '🤫 OK'}</span>
          </div>
        </>
      )}
    </div>
  );
}
