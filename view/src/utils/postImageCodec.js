const resolvedImageCache = new Map();
const MAX_DIMENSION = 1600;
const TARGET_QUALITY = 0.82;

function decodeBase64(base64Value) {
  const binary = atob(base64Value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function inflatePayload(payload) {
  const source = new Blob([payload]).stream();
  const decompressed = source.pipeThrough(new DecompressionStream('deflate'));
  const buffer = await new Response(decompressed).arrayBuffer();
  return new Uint8Array(buffer);
}

async function loadImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Nao foi possivel carregar a imagem selecionada.'));
      element.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getScaledSize(width, height) {
  const largestSide = Math.max(width, height);
  if (!largestSide || largestSide <= MAX_DIMENSION) {
    return { width, height };
  }
  const ratio = MAX_DIMENSION / largestSide;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

async function compressImageFile(file) {
  const image = await loadImage(file);
  const { width, height } = getScaledSize(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Nao foi possivel preparar a imagem selecionada.');
  }

  context.drawImage(image, 0, 0, width, height);
  const originalType = String(file.type || '').toLowerCase();
  const targetType = originalType === 'image/png' ? 'image/png' : 'image/jpeg';
  const quality = targetType === 'image/png' ? undefined : TARGET_QUALITY;
  return canvas.toDataURL(targetType, quality);
}

export async function resolvePostImageSource(rawValue) {
  if (!rawValue) return null;
  if (resolvedImageCache.has(rawValue)) return resolvedImageCache.get(rawValue);

  if (rawValue.startsWith('data:image/')) {
    resolvedImageCache.set(rawValue, rawValue);
    return rawValue;
  }

  if (!rawValue.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed?.kind !== 'compressed-image' || !parsed?.payload || !parsed?.mime) {
      return null;
    }

    if (typeof DecompressionStream === 'undefined') {
      return null;
    }

    const compressed = decodeBase64(parsed.payload);
    const inflated = await inflatePayload(compressed);
    const dataUrl = `data:${parsed.mime};base64,${encodeBase64(inflated)}`;
    resolvedImageCache.set(rawValue, dataUrl);
    return dataUrl;
  } catch (error) {
    console.error('Falha ao resolver imagem da publicacao:', error);
    return null;
  }
}

export async function readFileAsDataUrl(file) {
  if (!file) {
    return '';
  }

  try {
    return await compressImageFile(file);
  } catch (error) {
    console.error('Falha ao comprimir imagem antes do envio:', error);
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
