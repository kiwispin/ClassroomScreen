import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { DEFAULT_SCREEN } from '../../store/types';
import { useAppStore } from '../../store/store';
import { putImage } from './idb';
import BackgroundPicker from './Picker';

vi.mock('./idb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./idb')>();
  return { ...actual, putImage: vi.fn() };
});
vi.mock('./resize', () => ({ resizeImage: vi.fn(async (file: File) => file) }));

const reset = () => useAppStore.setState({
  current: { ...DEFAULT_SCREEN, widgets: [] },
  presets: [],
  backgroundUploads: [],
  activePresetId: null,
});

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'background' }));
  return screen.findByRole('dialog', { name: 'Background' });
};

describe('BackgroundPicker', () => {
  beforeEach(() => {
    reset();
    vi.mocked(putImage).mockReset();
  });

  it('searches curated tags, selects a photo, and changes its fit', async () => {
    const user = userEvent.setup();
    render(<BackgroundPicker />);
    await openPicker(user);

    await user.type(screen.getByRole('searchbox', { name: 'Search backgrounds' }), 'auckland');
    const waves = await screen.findByRole('button', { name: 'Select Auckland waves background' });
    expect(screen.queryByRole('button', { name: 'Select Sandy shore background' })).not.toBeInTheDocument();
    await user.click(waves);
    expect(useAppStore.getState().current.background).toEqual({
      kind: 'preset-image', assetId: '16322856', fit: 'cover',
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Background image fit' }), 'contain');
    expect(useAppStore.getState().current.background).toEqual({
      kind: 'preset-image', assetId: '16322856', fit: 'contain',
    });
  });

  it('saves multiple local images and reports invalid files without discarding valid ones', async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.mocked(putImage)
      .mockResolvedValueOnce('upload-one')
      .mockResolvedValueOnce('upload-two');
    render(<BackgroundPicker />);
    await openPicker(user);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, [
      new File(['one'], 'Forest.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'Sea.png', { type: 'image/png' }),
      new File(['text'], 'notes.txt', { type: 'text/plain' }),
    ]);

    await waitFor(() => expect(useAppStore.getState().backgroundUploads).toHaveLength(2));
    expect(useAppStore.getState().backgroundUploads?.map((upload) => upload.name)).toEqual(['Forest.jpg', 'Sea.png']);
    expect(useAppStore.getState().current.background).toEqual({
      kind: 'image', imageId: 'upload-one', fit: 'cover',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Saved 2 images');
    expect(screen.getByRole('status')).toHaveTextContent('notes.txt: choose an image file.');
  });

  it('removes the active upload from the screen before deleting it and does not re-adopt it', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      current: { ...DEFAULT_SCREEN, widgets: [], background: { kind: 'image', imageId: 'legacy', fit: 'cover' } },
      backgroundUploads: [{ id: 'legacy', name: 'Legacy photo.jpg', tags: ['legacy'], addedAt: 1 }],
    });
    render(<BackgroundPicker />);
    await openPicker(user);

    await user.click(await screen.findByRole('button', { name: 'Delete Legacy photo.jpg from My uploads' }));
    await waitFor(() => expect(useAppStore.getState().current.background).toEqual(DEFAULT_SCREEN.background));
    expect(await screen.findByRole('status')).toHaveTextContent('Image removed from My uploads.');
    await waitFor(() => expect(useAppStore.getState().backgroundUploads).toEqual([]));
  });

  it('adopts a legacy active background into My uploads even if its blob is unavailable', async () => {
    const user = userEvent.setup();
    useAppStore.setState({
      current: { ...DEFAULT_SCREEN, widgets: [], background: { kind: 'image', imageId: 'legacy-unavailable', fit: 'cover' } },
      backgroundUploads: [],
    });
    render(<BackgroundPicker />);
    await openPicker(user);

    await waitFor(() => expect(useAppStore.getState().backgroundUploads).toEqual([
      { id: 'legacy-unavailable', name: 'Previous background upload', tags: [], addedAt: expect.any(Number) },
    ]));
    expect(await screen.findByText('Image unavailable')).toBeInTheDocument();
  });
});
