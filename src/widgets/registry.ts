import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../store/types';

import DemoWidget from './Demo';
import { demoMeta, type WidgetMeta } from './Demo/meta';
import Notepad from './Notepad';
import { notepadMeta } from './Notepad/meta';
import Clock from './Clock';
import { clockMeta } from './Clock/meta';
import Timer from './Timer';
import { timerMeta } from './Timer/meta';
import Stopwatch from './Stopwatch';
import { stopwatchMeta } from './Stopwatch/meta';
import NamePicker from './NamePicker';
import { namePickerMeta } from './NamePicker/meta';
import Dice from './Dice';
import { diceMeta } from './Dice/meta';
import TrafficLight from './TrafficLight';
import { trafficLightMeta } from './TrafficLight/meta';

export type WidgetProps = { instance: WidgetInstance };

type Entry = {
  meta: WidgetMeta;
  Component: ComponentType<WidgetProps>;
};

const registry: Partial<Record<WidgetType, Entry>> = {
  demo: { meta: demoMeta, Component: DemoWidget },
  notepad: { meta: notepadMeta, Component: Notepad },
  clock: { meta: clockMeta, Component: Clock },
  timer: { meta: timerMeta, Component: Timer },
  stopwatch: { meta: stopwatchMeta, Component: Stopwatch },
  namepicker: { meta: namePickerMeta, Component: NamePicker },
  dice: { meta: diceMeta, Component: Dice },
  trafficlight: { meta: trafficLightMeta, Component: TrafficLight },
};

export const allWidgets: WidgetMeta[] = Object.values(registry)
  .filter((e): e is Entry => Boolean(e))
  .map((e) => e.meta)
  .filter((m) => !m.hidden);

export const getWidgetMeta = (type: WidgetType): WidgetMeta | undefined =>
  registry[type]?.meta;

export const getWidgetComponent = (
  type: WidgetType,
): ComponentType<WidgetProps> | undefined => registry[type]?.Component;
