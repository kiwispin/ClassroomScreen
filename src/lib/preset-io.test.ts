import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  buildExportBundle,
  importFromBundle,
  collectImageIds,
  collectAudioIds,
} from './preset-io';
import { putImage, getImage } from '../overlays/Background/idb';
import { putAudio, getAudio } from './audio-storage';
import { useAppStore } from '../store/store';
import type { Preset } from '../store/types';

const blob = (body: string, type: string) => new Blob([body], { type });
const file = (name: string, body: string, type: string) =>
  new File([body], name, { type });

const reset = () => {
  useAppStore.setState({
    schemaVersion: 1,
    current: { widgets: [], background: { kind: 'solid', color: '#fff' } },
    presets: [],
    activePresetId: null,
    annotateOpen: false,
    toolbarPinned: false,
  });
};

describe('preset-io', () => {
  beforeEach(reset);

  describe('collectImageIds', () => {
    it('finds image ids in backgrounds and image widgets', () => {
      const presets: Preset[] = [
        {
          id: 'p1',
          name: 'P1',
          createdAt: 0,
          updatedAt: 0,
          state: {
            background: { kind: 'image', imageId: 'bg-1', fit: 'cover' },
            widgets: [
              { id: 'w1', type: 'image', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1, config: { source: 'upload', imageId: 'iw-1' } },
              { id: 'w2', type: 'clock', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1, config: {} },
            ],
          },
        },
      ];
      expect(collectImageIds(presets)).toEqual(new Set(['bg-1', 'iw-1']));
    });
  });

  describe('collectAudioIds', () => {
    it('finds custom sound ids on timer widgets', () => {
      const presets: Preset[] = [
        {
          id: 'p1', name: 'P1', createdAt: 0, updatedAt: 0,
          state: {
            background: { kind: 'solid', color: '#fff' },
            widgets: [
              { id: 'w1', type: 'timer', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1, config: { customSoundId: 'snd-1' } },
              { id: 'w2', type: 'timer', position: { x: 0, y: 0 }, size: { width: 100, height: 100 }, zIndex: 1, config: { sfx: 'bell' } },
            ],
          },
        },
      ];
      expect(collectAudioIds(presets)).toEqual(new Set(['snd-1']));
    });
  });

  describe('round-trip', () => {
    it('preserves a bundled curated background asset id without embedding a file', async () => {
      const preset: Preset = {
        id: 'curated-preset', name: 'Nature', createdAt: 1, updatedAt: 1,
        state: { background: { kind: 'preset-image', assetId: '32613724', fit: 'contain' }, widgets: [] },
      };
      const bundle = await buildExportBundle([preset]);
      expect(bundle.images).toEqual([]);
      expect(bundle.presets[0].state.background).toEqual(preset.state.background);

      await importFromBundle(bundle);
      expect(useAppStore.getState().presets[0].state.background).toEqual(preset.state.background);
    });

    it('exports and imports a preset with embedded image + audio, remapping ids', async () => {
      // Seed IDB with one image and one audio
      const imgBlob = blob('IMG-DATA', 'image/png');
      const imgId = await putImage(imgBlob);

      const sndFile = file('chime.mp3', 'SND-DATA', 'audio/mpeg');
      const { id: sndId } = await putAudio(sndFile);

      // Build a preset that references both
      const preset: Preset = {
        id: 'orig-preset',
        name: 'Maths',
        createdAt: 1,
        updatedAt: 1,
        state: {
          background: { kind: 'image', imageId: imgId, fit: 'cover' },
          widgets: [
            {
              id: 'orig-w',
              type: 'timer',
              position: { x: 10, y: 20 },
              size: { width: 480, height: 200 },
              zIndex: 1,
              config: {
                customSoundId: sndId,
                sfx: 'custom',
                fullDurationMs: 600_000,
                frostedGlass: true,
                glassOpacity: 45,
              },
            },
            {
              id: 'clock-w',
              type: 'clock',
              position: { x: 20, y: 40 },
              size: { width: 280, height: 140 },
              zIndex: 2,
              config: {
                format24: false,
                showSeconds: true,
                showDate: true,
                analog: false,
                frostedGlass: true,
                glassOpacity: 45,
              },
            },
          ],
        },
      };

      const bundle = await buildExportBundle([preset]);
      expect(bundle.presets).toHaveLength(1);
      expect(bundle.images).toHaveLength(1);
      expect(bundle.audio).toHaveLength(1);
      expect(bundle.images[0].dataB64.length).toBeGreaterThan(0);
      expect(bundle.audio[0].name).toBe('chime.mp3');

      // Pretend we're on a fresh device: clear store presets but keep IDB
      useAppStore.setState({ presets: [] });

      const result = await importFromBundle(bundle);
      expect(result.presetsAdded).toBe(1);
      expect(result.imagesAdded).toBe(1);
      expect(result.audioAdded).toBe(1);

      const presets = useAppStore.getState().presets;
      expect(presets).toHaveLength(1);
      const imported = presets[0];
      expect(imported.name).toBe('Maths');
      expect(imported.id).not.toBe('orig-preset'); // id remapped

      // Background image id remapped, blob is reachable
      if (imported.state.background.kind !== 'image') throw new Error('expected image bg');
      const newImgId = imported.state.background.imageId;
      expect(newImgId).not.toBe(imgId);
      const restoredImg = await getImage(newImgId);
      expect(restoredImg).toBeDefined();
      expect(await restoredImg!.text()).toBe('IMG-DATA');

      // Timer audio id remapped
      const tw = imported.state.widgets.find((widget) => widget.type === 'timer');
      const cw = imported.state.widgets.find((widget) => widget.type === 'clock');
      if (!tw || !cw) throw new Error('expected both Timer and Clock widgets');
      const tcfg = tw.config as { customSoundId?: string };
      const newSndId = tcfg.customSoundId!;
      expect(newSndId).not.toBe(sndId);
      const restoredSnd = await getAudio(newSndId);
      expect(restoredSnd).toBeDefined();
      expect(await restoredSnd!.blob.text()).toBe('SND-DATA');
      expect(tw.config).toMatchObject({ frostedGlass: true, glassOpacity: 45 });
      expect(cw.config).toMatchObject({
        format24: false,
        showSeconds: true,
        analog: false,
        frostedGlass: true,
        glassOpacity: 45,
      });
    });

    it('keeps legacy Timer and Clock presets without glass settings unchanged', async () => {
      const legacyConfig = { theme: 'midnight', fullDurationMs: 300_000 };
      const legacyClockConfig = { format24: true, showDate: true, analog: false };
      const preset: Preset = {
        id: 'legacy-timer-preset',
        name: 'Legacy timer',
        createdAt: 1,
        updatedAt: 1,
        state: {
          background: { kind: 'solid', color: '#fff' },
          widgets: [{
            id: 'legacy-timer',
            type: 'timer',
            position: { x: 0, y: 0 },
            size: { width: 480, height: 200 },
            zIndex: 1,
            config: legacyConfig,
          }, {
            id: 'legacy-clock',
            type: 'clock',
            position: { x: 0, y: 220 },
            size: { width: 280, height: 140 },
            zIndex: 2,
            config: legacyClockConfig,
          }],
        },
      };

      const bundle = await buildExportBundle([preset]);
      await importFromBundle(bundle);
      const widgets = useAppStore.getState().presets[0].state.widgets;
      expect(widgets.find((widget) => widget.type === 'timer')?.config).toEqual(legacyConfig);
      expect(widgets.find((widget) => widget.type === 'clock')?.config).toEqual(legacyClockConfig);
    });

    it('rejects an invalid file', async () => {
      // @ts-expect-error - passing an invalid bundle on purpose
      await expect(importFromBundle({})).rejects.toThrow(/ClassroomScreen/);
    });

    it('rejects an unsupported version', async () => {
      const bundle = await buildExportBundle([]);
      bundle.version = 999;
      await expect(importFromBundle(bundle)).rejects.toThrow(/version/);
    });
  });
});
