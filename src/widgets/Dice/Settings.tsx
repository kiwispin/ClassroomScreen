import { Check, Dices } from 'lucide-react';
import type { ReactNode } from 'react';
import SettingsPopover from '../../components/SettingsPopover';
import SettingsTriggerButton from '../../components/SettingsTriggerButton';
import { useAppStore } from '../../store/store';
import type { WidgetSettingsProps } from '../Demo/meta';
import type { DiceConfig } from '.';
import { CoinFace, ColorFace, DieFace, LetterFace, PolyDie, RpsFace } from '.';

type DiceOption = {
  id: string;
  label: string;
  config: Partial<DiceConfig>;
  preview: ReactNode;
};

const RangePreview = ({ children }: { children: ReactNode }) => (
  <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-slate-950 bg-white text-3xl font-bold text-slate-950">
    {children}
  </div>
);

const DiceCluster = ({ values }: { values: number[] }) => (
  <div className="relative flex min-h-20 min-w-24 items-center justify-center">
    {values.map((value, index) => (
      <DieFace
        key={index}
        value={value}
        className={
          values.length === 1
            ? 'w-16 text-slate-950'
            : values.length === 2
              ? 'w-14 text-slate-950 ' + (index === 0 ? '-mr-1' : '')
              : 'absolute w-12 text-slate-950 ' +
                (index === 0
                  ? 'left-1 top-2'
                  : index === 1
                    ? 'right-1 top-2'
                    : 'bottom-1 left-1/2 -translate-x-1/2')
        }
        soft
      />
    ))}
  </div>
);

const options: DiceOption[] = [
  {
    id: '1d6',
    label: 'One die',
    config: { mode: 'dice', count: 1 },
    preview: <DiceCluster values={[4]} />,
  },
  {
    id: '2d6',
    label: 'Two dice',
    config: { mode: 'dice', count: 2 },
    preview: <DiceCluster values={[4, 5]} />,
  },
  {
    id: '3d6',
    label: 'Three dice',
    config: { mode: 'dice', count: 3 },
    preview: <DiceCluster values={[4, 5, 6]} />,
  },
  {
    id: 'plus-six',
    label: '1 to 6',
    config: { mode: 'range', min: 1, max: 6 },
    preview: <RangePreview>+6</RangePreview>,
  },
  {
    id: 'minus-six',
    label: '-6 to -1',
    config: { mode: 'range', min: -6, max: -1 },
    preview: <RangePreview>-6</RangePreview>,
  },
  {
    id: 'hundred',
    label: '1 to 100',
    config: { mode: 'range', min: 1, max: 100 },
    preview: (
      <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-slate-950 bg-white text-3xl font-bold leading-none text-slate-950">
        +x
      </div>
    ),
  },
  {
    id: 'color',
    label: 'Color',
    config: { mode: 'color' },
    preview: <ColorFace color="#c084fc" className="w-20 text-slate-950" />,
  },
  {
    id: 'd12',
    label: 'D12',
    config: { mode: 'd12' },
    preview: <PolyDie value={12} sides={12} className="w-24" />,
  },
  {
    id: 'd20',
    label: 'D20',
    config: { mode: 'd20' },
    preview: <PolyDie value={20} sides={20} className="w-24" />,
  },
  {
    id: 'coin',
    label: 'Coin',
    config: { mode: 'coin' },
    preview: (
      <div className="relative h-24 w-28">
        <CoinFace side="tails" className="absolute left-0 top-0 w-20" />
        <CoinFace side="heads" className="absolute bottom-0 right-0 w-20" />
      </div>
    ),
  },
  {
    id: 'letter',
    label: 'A-Z',
    config: { mode: 'letter' },
    preview: <LetterFace value="A-Z" className="h-20 w-20 text-2xl" />,
  },
  {
    id: 'rps',
    label: 'Rock paper scissors',
    config: { mode: 'rps' },
    preview: (
      <div className="flex gap-1">
        <RpsFace value="rock" className="h-10 w-10 text-2xl" />
        <RpsFace value="paper" className="h-10 w-10 text-2xl" />
        <RpsFace value="scissors" className="h-10 w-10 text-2xl" />
      </div>
    ),
  },
];

export default function DiceSettings({ instance }: WidgetSettingsProps) {
  const updateConfig = useAppStore((s) => s.updateWidgetConfig);
  const cfg = instance.config as DiceConfig;
  const mode = cfg.mode ?? 'dice';
  const count = cfg.count ?? 2;
  const min = cfg.min ?? 1;
  const max = cfg.max ?? 100;

  const isSelected = (option: DiceOption) => {
    if (option.config.mode !== mode) return false;
    if (option.config.mode === 'dice') return count === option.config.count;
    if (option.config.mode === 'range') return min === option.config.min && max === option.config.max;
    return true;
  };

  return (
    <SettingsPopover
      title="Dice"
      panelClassName="overflow-auto p-0"
      trigger={(open) => (
        <SettingsTriggerButton open={open} label="Dice settings" />
      )}
    >
      {() => (
        <div className="w-[min(36rem,calc(100vw-32px))] bg-white p-6 text-slate-950">
          <div className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Dices className="h-8 w-8 text-slate-950" strokeWidth={2.2} />
            <span>Choose dice</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {options.map((option) => {
              const selected = isSelected(option);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateConfig(instance.id, option.config)}
                  className={
                    'relative flex h-36 flex-col items-center justify-center rounded-lg border bg-white p-3 transition-colors ' +
                    (selected
                      ? 'border-2 border-indigo-500 ring-1 ring-indigo-100'
                      : 'border-slate-300 hover:border-slate-400')
                  }
                  title={option.label}
                >
                  {selected && (
                    <span className="absolute top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                  <div className={selected ? 'mt-4' : ''}>{option.preview}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-slate-300 p-4">
            <div className="mb-3 font-semibold">Custom dice</div>
            {mode === 'dice' ? (
              <label className="flex items-center justify-between gap-3">
                <span>Number of dice</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={count}
                  onChange={(e) =>
                    updateConfig(instance.id, {
                      mode: 'dice',
                      count: Number(e.target.value),
                    })
                  }
                  className="w-20 rounded border border-slate-300 px-2 py-1"
                />
              </label>
            ) : mode === 'range' ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-slate-600">Min</span>
                  <input
                    type="number"
                    value={min}
                    onChange={(e) =>
                      updateConfig(instance.id, {
                        mode: 'range',
                        min: Number(e.target.value),
                      })
                    }
                    className="rounded border border-slate-300 px-2 py-1"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-slate-600">Max</span>
                  <input
                    type="number"
                    value={max}
                    onChange={(e) =>
                      updateConfig(instance.id, {
                        mode: 'range',
                        max: Number(e.target.value),
                      })
                    }
                    className="rounded border border-slate-300 px-2 py-1"
                  />
                </label>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Select Dice or Number below to edit custom values.
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => updateConfig(instance.id, { mode: 'dice' })}
                className={
                  'rounded px-3 py-1.5 text-sm font-medium ' +
                  (mode === 'dice'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }
              >
                Dice
              </button>
              <button
                type="button"
                onClick={() => updateConfig(instance.id, { mode: 'range' })}
                className={
                  'rounded px-3 py-1.5 text-sm font-medium ' +
                  (mode === 'range'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }
              >
                Number
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPopover>
  );
}
