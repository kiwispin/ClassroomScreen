import { Hand, HandFist, Scissors } from 'lucide-react';
type DieFaceProps = {
  value: number;
  className?: string;
  soft?: boolean;
};

const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]],
};

export function DieFace({ value, className = '', soft = false }: DieFaceProps) {
  const pips = PIP_POSITIONS[Math.max(1, Math.min(6, value))] ?? PIP_POSITIONS[1];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <rect
        x="7"
        y="7"
        width="86"
        height="86"
        rx="9"
        fill={soft ? 'var(--die-fill, #f8fafc)' : 'var(--die-fill, #fff)'}
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="7" fill="currentColor" />
      ))}
    </svg>
  );
}

export function ColorFace({ color = '#c084fc', className = '' }: { color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="8" y="8" width="84" height="84" rx="8" fill="var(--die-fill, #f8fafc)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="26" fill={color} opacity="0.85" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

// Face-on projections: a pentagonal D12 face and a triangular D20 face.
// Every surrounding region is a single face, not decorative triangulation.
const D12_FACES = [
  ['60,10 60,30 32,50 14,44 32,20', '#cdd0d3'],
  ['60,10 88,20 106,44 88,50 60,30', '#c7cacf'],
  ['88,50 106,44 106,75 88,99 77,84', '#f0f1f2'],
  ['77,84 88,99 60,110 32,99 43,84', '#afb3b9'],
  ['43,84 32,99 14,75 14,44 32,50', '#e9ebed'],
  ['60,30 88,50 77,84 43,84 32,50', 'var(--die-fill, #f5f6f7)'],
];
const D20_FACES = [
  ['60,8 60,36 14,36', '#b9bcc1'],
  ['60,8 106,36 60,36', '#afb3b9'],
  ['14,36 60,36 29,86', '#d2d4d7'],
  ['60,36 106,36 91,86', '#bfc3c8'],
  ['14,36 29,86 14,86', '#b4b8be'],
  ['106,36 106,86 91,86', '#aeb2b8'],
  ['14,86 29,86 60,114', '#979ca4'],
  ['29,86 91,86 60,114', '#c9ccd0'],
  ['91,86 106,86 60,114', '#969ba3'],
  ['60,36 91,86 29,86', 'var(--die-fill, #f5f6f7)'],
];

export function PolyDie({ value, sides, className = '' }: {
  value: number;
  sides: 12 | 20;
  className?: string;
}) {
  return <svg viewBox="0 0 120 120" className={className} aria-hidden>
    {(sides === 12 ? D12_FACES : D20_FACES).map(([points, fill]) => (
      <polygon key={points} points={points} fill={fill} stroke={fill} strokeWidth="0.35" strokeLinejoin="round" />
    ))}
    <text x="60" y={sides === 12 ? 64 : 70} textAnchor="middle" dominantBaseline="middle"
      fill="var(--die-ink, #18202e)" fontSize={sides === 12 ? 24 : 22} fontWeight="600">
      {value}
    </text>
  </svg>;
}

export function CoinFace({ side = 'heads', className = '' }: { side?: string; className?: string }) {
  const isHeads = side === 'heads';

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden style={{ overflow: 'visible' }}>
      <circle cx="60" cy="60" r="48" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="7" />
      <circle cx="60" cy="60" r="41" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="11 6" />
      {isHeads ? (
        <>
          <path d="M44 74 C36 61 39 40 55 33 C68 28 79 37 80 50 C81 59 75 65 69 69 L72 84 C61 89 49 85 44 74 Z" fill="white" stroke="#0f172a" strokeWidth="3.3" strokeLinejoin="round" />
          <path d="M54 37 C54 28 61 25 67 26 C73 27 77 32 78 38" fill="none" stroke="#0f172a" strokeWidth="3.3" strokeLinecap="round" />
          <path d="M49 57 C55 60 61 58 66 53" fill="none" stroke="#0f172a" strokeWidth="2.7" strokeLinecap="round" />
          <circle cx="65" cy="45" r="2.3" fill="#0f172a" />
          <path d="M42 85 L77 85" fill="none" stroke="#0f172a" strokeWidth="3.3" strokeLinecap="round" />
        </>
      ) : (
        <text x="60" y="78" textAnchor="middle" fill="#0f172a" fontSize="68" fontWeight="400" fontFamily="Georgia, serif">
          1
        </text>
      )}
    </svg>
  );
}

export function LetterFace({ value = 'A', className = '' }: { value?: string; className?: string }) {
  return <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <rect x="7" y="7" width="86" height="86" rx="9" fill="var(--die-fill, #f8fafc)" stroke="currentColor" strokeWidth="2.5" />
    <text x="50" y="53" textAnchor="middle" dominantBaseline="middle" fill="currentColor" fontWeight="700" fontSize={value.length > 4 ? 19 : value.length > 2 ? 27 : 42}>{value}</text>
  </svg>;
}
export function RpsFace({ value = 'rock', className = '' }: { value?: string; className?: string }) {
  const Icon = value === 'rock' ? HandFist : value === 'paper' ? Hand : Scissors;
  return <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <rect x="7" y="7" width="86" height="86" rx="9" fill="var(--die-fill, #f8fafc)" stroke="currentColor" strokeWidth="2.5" />
    <Icon x="24" y="24" width="52" height="52" strokeWidth={1.6} />
  </svg>;
}
