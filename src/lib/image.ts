export interface ImageAsset {
  name: string;
  src: string;
  width: number;
  height: number;
  size: number;
}

export async function readImageAsset(file: File): Promise<ImageAsset> {
  const src = await readAsDataUrl(file);
  const dimensions = await measureImage(src);

  return {
    name: file.name,
    src,
    width: dimensions.width,
    height: dimensions.height,
    size: file.size
  };
}

export function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read image dimensions."));
    image.src = src;
  });
}
