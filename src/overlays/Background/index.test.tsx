import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getImage } from './idb';
import BackgroundLayer from './index';

vi.mock('./idb', () => ({ getImage: vi.fn() }));

const mockedGetImage = vi.mocked(getImage);

describe('BackgroundLayer', () => {
  beforeEach(() => mockedGetImage.mockReset());

  it('does not keep showing a previous image after switching to a missing upload', async () => {
    mockedGetImage.mockResolvedValue(undefined);
    const view = render(<BackgroundLayer bg={{ kind: 'preset-image', assetId: '17026767', fit: 'cover' }} />);

    await waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute(
      'src', `${import.meta.env.BASE_URL}backgrounds/17026767.jpg`,
    ));

    view.rerender(<BackgroundLayer bg={{ kind: 'image', imageId: 'missing', fit: 'contain' }} />);
    await waitFor(() => expect(view.container.querySelector('img')).toBeNull());
    expect(view.container.firstElementChild).toHaveClass('bg-slate-200');
  });

  it('renders an unknown preset id as an empty fallback rather than a stale image', async () => {
    const view = render(<BackgroundLayer bg={{ kind: 'preset-image', assetId: 'removed', fit: 'cover' }} />);
    await waitFor(() => expect(view.container.querySelector('img')).toBeNull());
    expect(view.container.firstElementChild).toHaveClass('bg-slate-200');
  });
});
