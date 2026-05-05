import { useEffect, useRef, useState } from 'react';
import type { WidgetInstance } from '../../store/types';

export type NoiseMeterConfig = {
  threshold?: number;
};

type Status = 'idle' | 'requesting' | 'running' | 'denied' | 'error';

export default function NoiseMeter({ instance }: { instance: WidgetInstance }) {
  const cfg = instance.config as NoiseMeterConfig;
  const threshold = cfg.threshold ?? 0.5;

  const [status, setStatus] = useState<Status>('idle');
  const [level, setLevel] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const start = async () => {
    if (status === 'running' || status === 'requesting') return;
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxCtor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxCtor) {
        setStatus('error');
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const ctx = new AudioCtxCtor();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);

      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 1.6));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => { /* ignore */ });
      };
      setStatus('running');
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? '';
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error');
    }
  };

  useEffect(() => () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const over = level >= threshold;
  const pct = Math.round(level * 100);

  return (
    <div className="h-full w-full flex flex-col bg-white p-3 gap-2">
      {status !== 'running' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          {status === 'denied' ? (
            <>
              <div className="text-sm text-slate-700">Microphone permission denied.</div>
              <div className="text-xs text-slate-500">
                Allow mic access in your browser, then click Try again.
              </div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
              >
                Try again
              </button>
            </>
          ) : status === 'error' ? (
            <>
              <div className="text-sm text-slate-700">Could not start the microphone.</div>
              <button
                onClick={start}
                className="mt-1 px-3 py-1 rounded bg-slate-700 text-white text-sm hover:bg-slate-800"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="text-sm text-slate-700">Noise meter</div>
              <button
                onClick={start}
                disabled={status === 'requesting'}
                className="mt-1 px-3 py-1 rounded bg-emerald-500 text-white text-sm hover:bg-emerald-600 disabled:opacity-50"
              >
                {status === 'requesting' ? 'Requesting…' : 'Start'}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 relative bg-slate-100 rounded overflow-hidden">
            <div
              className={'absolute left-0 right-0 bottom-0 transition-[height] duration-75 ' + (over ? 'bg-rose-500' : 'bg-emerald-500')}
              style={{ height: `${pct}%` }}
            />
            <div
              className="absolute left-0 right-0 border-t border-dashed border-slate-400/70"
              style={{ bottom: `${Math.round(threshold * 100)}%` }}
              aria-label={`Threshold ${Math.round(threshold * 100)}%`}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">{pct}%</span>
            <span>{over ? '🔊 Too loud' : '🤫 OK'}</span>
          </div>
        </>
      )}
    </div>
  );
}
