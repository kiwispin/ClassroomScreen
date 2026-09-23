import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import 'fake-indexeddb/auto';
import WidgetSettingsPanel from '../../components/WidgetSettingsPanel';
import { useAppStore } from '../../store/store';
import { getImage, putImage } from '../../overlays/Background/idb';
import { resizeImage } from '../../overlays/Background/resize';
import { Pictogram, PictogramPicker } from './Pictograms';

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

vi.mock('../../overlays/Background/resize', () => ({
  resizeImage: vi.fn(async (file: File) => file),
}));

const pickerSettings = (props: ComponentProps<typeof PictogramPicker>) => (
  <WidgetSettingsPanel
    title="Timetable settings"
    trigger={(toggle) => <button type="button" onClick={toggle}>Open timetable settings</button>}
  >
    {() => <div><PictogramPicker {...props} /></div>}
  </WidgetSettingsPanel>
);

const renderPickerInSettings = (props: ComponentProps<typeof PictogramPicker>) => render(pickerSettings(props));
const renderPickerOnCanvas = (onChange: ComponentProps<typeof PictogramPicker>['onChange']) => render(
  <div data-testid="transformed-widget" style={{ transform: 'translateZ(0)', overflow: 'hidden' }}>
    <PictogramPicker onChange={onChange} />
  </div>,
);

describe('Timetable pictograms', () => {
  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectURL });
  });

  beforeEach(() => {
    vi.mocked(resizeImage).mockClear();
    useAppStore.setState({
      current: { widgets: [], background: { kind: 'solid', color: '#fff' } },
      presets: [],
    });
  });

  it('selects a searchable built-in pictogram without closing the parent settings panel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPickerInSettings({ onChange });

    await user.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    const parentDialog = screen.getByRole('dialog', { name: 'Timetable settings' });
    await user.click(screen.getByRole('button', { name: 'Add pictogram' }));
    const picker = screen.getByRole('dialog', { name: 'Choose a timetable pictogram' });
    expect(parentDialog).toContainElement(picker);

    await user.type(screen.getByRole('searchbox', { name: 'Search pictograms' }), 'math');
    expect(screen.getByRole('button', { name: 'Use Mathematics pictogram' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use Science pictogram' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Use Mathematics pictogram' }));

    expect(onChange).toHaveBeenCalledWith({ icon: 'calculator', imageId: undefined });
    expect(parentDialog).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Choose a timetable pictogram' })).not.toBeInTheDocument();
  });

  it('searches the six technology pictograms and uses the shared toolbar-style accent treatment', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPickerInSettings({ icon: 'computer', onChange });
    await user.click(screen.getByRole('button', { name: 'Open timetable settings' }));

    const selected = screen.getByRole('button', { name: 'Change pictogram' });
    expect(selected).toHaveClass('h-9', 'w-9');
    expect(selected.querySelector('svg')?.parentElement).toHaveClass('h-5', 'w-5');
    expect(selected).toHaveClass('bg-white');
    expect(selected.querySelector('svg')).toHaveClass('text-slate-950');
    expect(selected.querySelector('[data-pictogram-accent]')).toHaveStyle({ backgroundColor: '#7dd3fc' });
    expect(selected.querySelector('[data-pictogram-accent]')).toHaveClass('inset-[18%]', 'rounded-[3px]', 'opacity-75');

    await user.click(selected);
    await user.type(screen.getByRole('searchbox', { name: 'Search pictograms' }), 'ict');
    const technologyOptions = screen.getAllByRole('button', { name: /^Use .* pictogram$/ });
    expect(technologyOptions.map((option) => option.getAttribute('aria-label'))).toEqual([
      'Use Computer pictogram',
      'Use Laptop pictogram',
      'Use Tablet pictogram',
      'Use Smartphone pictogram',
      'Use Keyboard pictogram',
      'Use Coding pictogram',
    ]);
    expect(technologyOptions[0].querySelector('svg')).toHaveClass('text-slate-950');
    expect(technologyOptions[0]).toHaveClass('h-20');
    expect(technologyOptions[0].querySelector('svg')?.parentElement).toHaveClass('h-10', 'w-10');
    expect(technologyOptions[0].querySelector('[data-pictogram-accent]')).toHaveStyle({ backgroundColor: '#7dd3fc' });
    expect(technologyOptions[0].querySelector('[data-pictogram-accent]')).toHaveClass('inset-[18%]');

    await user.click(technologyOptions[5]);
    expect(onChange).toHaveBeenCalledWith({ icon: 'coding', imageId: undefined });
  });

  it('renders built-in and uploaded display pictograms at 34px inside a stable 44px trigger', async () => {
    const user = userEvent.setup();
    const view = renderPickerInSettings({ icon: 'tablet', size: 'display', onChange: vi.fn() });
    await user.click(screen.getByRole('button', { name: 'Open timetable settings' }));

    const trigger = screen.getByRole('button', { name: 'Change pictogram' });
    expect(trigger).toHaveClass('h-11', 'w-11');
    expect(trigger.querySelector('svg')?.parentElement).toHaveClass('h-[34px]', 'w-[34px]');

    const imageId = await putImage(new Blob(['pictogram'], { type: 'image/png' }));
    view.rerender(pickerSettings({ imageId, size: 'display', onChange: vi.fn() }));
    await waitFor(() => expect(trigger.querySelector('img')).toHaveClass('h-[34px]', 'w-[34px]', 'object-contain'));
  });

  it('consumes Escape for the nested picker without dismissing parent settings', async () => {
    const user = userEvent.setup();
    renderPickerInSettings({ onChange: vi.fn() });
    await user.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    await user.click(screen.getByRole('button', { name: 'Add pictogram' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Choose a timetable pictogram' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Timetable settings' })).toBeInTheDocument();
  });

  it('portals the canvas chooser outside transformed and clipped widget DOM', async () => {
    const onChange = vi.fn();
    const view = renderPickerOnCanvas(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    const picker = await screen.findByRole('dialog', { name: 'Choose a timetable pictogram' });
    expect(view.getByTestId('transformed-widget')).not.toContainElement(picker);
    expect(document.body).toContainElement(picker);

    fireEvent.click(screen.getByRole('button', { name: 'Use Reading pictogram' }));
    expect(onChange).toHaveBeenCalledWith({ icon: 'book-open', imageId: undefined });
  });

  it('saves validated uploads through the shared resized image store', async () => {
    const onChange = vi.fn();
    const { container } = renderPickerInSettings({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    fireEvent.click(screen.getByRole('tab', { name: 'My uploads' }));

    const file = new File(['pictogram image'], 'science.png', { type: 'image/png' });
    const input = container.ownerDocument.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ icon: undefined, imageId: expect.any(String) }));
    expect(resizeImage).toHaveBeenCalledWith(file, 512);
    const imageId = onChange.mock.calls[0][0].imageId as string;
    expect(await (await getImage(imageId))?.text()).toBe('pictogram image');
  });

  it('rejects non-image uploads and lists pictograms already used on current timetable activities', async () => {
    const imageId = await putImage(new Blob(['existing image'], { type: 'image/png' }));
    useAppStore.setState({
      current: {
        widgets: [{
          id: 'timetable', type: 'timetable', position: { x: 0, y: 0 }, size: { width: 500, height: 300 }, zIndex: 1,
          config: { activities: [{ id: 'a', kind: 'activity', title: 'Science', durationMinutes: 30, imageId }] },
        }],
        background: { kind: 'solid', color: '#fff' },
      },
    });
    const onChange = vi.fn();
    const { container } = renderPickerInSettings({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    fireEvent.click(screen.getByRole('tab', { name: 'My uploads' }));
    expect(screen.getByRole('button', { name: 'Use uploaded pictogram 1' })).toBeInTheDocument();

    const input = container.ownerDocument.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(['not image'], 'notes.txt', { type: 'text/plain' })] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an image file.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects image uploads larger than 20 MB before resizing', async () => {
    const { container } = renderPickerInSettings({ onChange: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    fireEvent.click(screen.getByRole('tab', { name: 'My uploads' }));
    const oversized = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 20 * 1024 * 1024 + 1 });
    const input = container.ownerDocument.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [oversized] } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an image under 20 MB.');
    expect(resizeImage).not.toHaveBeenCalled();
  });

  it('uses a safe fallback for a missing image and revokes resolved object URLs', async () => {
    const create = vi.fn(() => 'blob:pictogram');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    const imageId = await putImage(new Blob(['image'], { type: 'image/png' }));
    const view = render(<Pictogram imageId="missing-image" />);
    expect(view.container.querySelector('svg')).toBeInTheDocument();
    view.rerender(<Pictogram imageId={imageId} />);
    await waitFor(() => expect(view.container.querySelector('img')).toHaveAttribute('src', 'blob:pictogram'));
    fireEvent.error(view.container.querySelector('img')!);
    expect(view.container.querySelector('svg')).toBeInTheDocument();
    view.rerender(<Pictogram icon="calculator" />);
    expect(revoke).toHaveBeenCalledWith('blob:pictogram');
  });

  it('does not call back if an upload decode finishes after the picker unmounts', async () => {
    let rejectResize!: (error: Error) => void;
    vi.mocked(resizeImage).mockImplementationOnce(() => new Promise((_, reject) => { rejectResize = reject; }));
    const onChange = vi.fn();
    const view = renderPickerInSettings({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    fireEvent.click(screen.getByRole('tab', { name: 'My uploads' }));
    const input = view.container.ownerDocument.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(['image'], 'late.png', { type: 'image/png' })] } });
    await waitFor(() => expect(resizeImage).toHaveBeenCalled());
    view.unmount();
    rejectResize(new Error('cancelled after unmount'));
    await waitFor(() => expect(onChange).not.toHaveBeenCalled());
  });

  it('delivers a completed upload to the latest activity callback after rerender', async () => {
    let finishResize!: (file: File) => void;
    vi.mocked(resizeImage).mockImplementationOnce(() => new Promise((resolve) => { finishResize = resolve; }));
    const staleChange = vi.fn();
    const currentChange = vi.fn();
    const view = renderPickerInSettings({ onChange: staleChange });
    fireEvent.click(screen.getByRole('button', { name: 'Open timetable settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add pictogram' }));
    fireEvent.click(screen.getByRole('tab', { name: 'My uploads' }));
    const file = new File(['latest image'], 'latest.png', { type: 'image/png' });
    const input = view.container.ownerDocument.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(resizeImage).toHaveBeenCalled());

    view.rerender(pickerSettings({ onChange: currentChange }));
    finishResize(file);
    await waitFor(() => expect(currentChange).toHaveBeenCalledWith({ icon: undefined, imageId: expect.any(String) }));
    expect(staleChange).not.toHaveBeenCalled();
  });
});
