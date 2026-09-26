import type { WidgetMeta } from '../widgets/Demo/meta';

export function resolveToolbarWidgets(preference: unknown, available: WidgetMeta[]): WidgetMeta[] {
  if (!Array.isArray(preference)) return available.filter((widget) => !widget.secondary);
  const seen = new Set<string>();
  return preference.flatMap((type) => {
    const widget = available.find((item) => item.type === type);
    if (!widget || seen.has(widget.type)) return [];
    seen.add(widget.type);
    return [widget];
  });
}
