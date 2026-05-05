const MAX_EDGE = 2560;

export const resizeImage = async (
  file: File,
  maxEdge: number = MAX_EDGE,
): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width <= maxEdge && height <= maxEdge) {
    bitmap.close();
    return file;
  }

  const scale = maxEdge / Math.max(width, height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.9,
    );
  });
};
