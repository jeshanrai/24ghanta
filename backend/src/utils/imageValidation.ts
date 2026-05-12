import sizeOf from 'image-size';

export interface ImageValidationResult {
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_DIMENSION = 200; // pixels
const MAX_DIMENSION = 6000; // pixels

/**
 * Validates the image using Magic Bytes (Header Sniffing),
 * checks file size, and enforces dimension limits.
 */
export function validateImage(buffer: Buffer): ImageValidationResult {
  const sizeBytes = buffer.length;

  // 1. Enforce Size Limit
  if (sizeBytes > MAX_FILE_SIZE) {
    throw new Error('File exceeds the 5MB size limit.');
  }

  // 2. Magic Byte Sniffing (Header Check)
  let mimeType = '';
  let ext = '';
  const hexHex = buffer.toString('hex', 0, 12).toUpperCase();
  
  if (hexHex.startsWith('FFD8FF')) {
    mimeType = 'image/jpeg';
    ext = 'jpg';
  } else if (hexHex.startsWith('89504E470D0A1A0A')) {
    mimeType = 'image/png';
    ext = 'png';
  } else if (hexHex.startsWith('52494646') && hexHex.substring(16, 24) === '57454250') {
    // "RIFF" is 52494646, "WEBP" is 57454250
    mimeType = 'image/webp';
    ext = 'webp';
  } else if (hexHex.startsWith('47494638')) {
    mimeType = 'image/gif';
    ext = 'gif';
  } else {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
  }

  // 3. Extract dimensions and validate structural integrity using image-size
  let dimensions;
  try {
    dimensions = sizeOf(buffer);
  } catch (error) {
    throw new Error('File is corrupted or not a valid image.');
  }

  const width = dimensions.width || 0;
  const height = dimensions.height || 0;

  // 4. Enforce Dimension Limits
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(`Image dimensions too small. Minimum size is ${MIN_DIMENSION}x${MIN_DIMENSION}px.`);
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`Image dimensions too large. Maximum size is ${MAX_DIMENSION}x${MAX_DIMENSION}px.`);
  }

  return {
    mimeType,
    ext,
    width,
    height,
    sizeBytes,
  };
}
