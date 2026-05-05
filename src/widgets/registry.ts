import type { ComponentType } from 'react';
import type { WidgetInstance, WidgetType } from '../store/types';

import DemoWidget from './Demo';
import { demoMeta, type WidgetMeta } from './Demo/meta';
import Notepad from './Notepad';
import { notepadMeta } from './Notepad/meta';

export type WidgetProps = { instance: WidgetInstance };

type Entry = {
  meta: WidgetMeta;
  Component: ComponentType<WidgetProps>;
};

const registry: Partial<Record<WidgetType, Entry>> = {
  demo: { meta: demoMeta, Component: DemoWidget },
  notepad: { meta: notepadMeta, Component: Notepad },
};

export const allWidgets: WidgetMeta[] = Object.values(registry)
  .filter((e): e is Entry => Boolean(e))
  .map((e) => e.meta);

export const getWidgetMeta = (type: WidgetType): WidgetMeta | undefined =>
  registry[type]?.meta;

export const getWidgetComponent = (
  type: WidgetType,
): ComponentType<WidgetProps> | undefined => registry[type]?.Component;
