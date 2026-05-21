import sizeOf from 'image-size';

export interface ImageValidationResult {
  mimeType: string;
  ext: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MIN_DIMENSION = 200; // pixels
export const MAX_DIMENSION = 6000; // pixels
export const ALLOWED_TYPES = ['JPEG', 'PNG', 'WebP', 'GIF'] as const;
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Validates an image using magic-byte sniffing, enforces a hard size cap,
 * and applies min/max pixel dimensions. Throws Error with a user-facing
 * message on the first failed check so admins can fix the upload without
 * guessing which constraint tripped.
 */
export function validateImage(buffer: Buffer): ImageValidationResult {
  const sizeBytes = buffer.length;

  if (sizeBytes === 0) {
    throw new Error('The selected file is empty. Please choose a valid image.');
  }

  // 1. Enforce size limit before doing any decode work.
  if (sizeBytes > MAX_FILE_SIZE) {
    throw new Error(
      `Image is too large (${formatBytes(sizeBytes)}). Maximum allowed size is ${formatBytes(MAX_FILE_SIZE)}. ` +
        `Please compress the image or choose a smaller file.`
    );
  }

  // 2. Magic-byte sniffing — protects against renamed extensions.
  let mimeType = '';
  let ext = '';
  const header = buffer.toString('hex', 0, 12).toUpperCase();

  if (header.startsWith('FFD8FF')) {
    mimeType = 'image/jpeg';
    ext = 'jpg';
  } else if (header.startsWith('89504E470D0A1A0A')) {
    mimeType = 'image/png';
    ext = 'png';
  } else if (header.startsWith('52494646') && header.substring(16, 24) === '57454250') {
    // "RIFF" = 52494646, "WEBP" = 57454250
    mimeType = 'image/webp';
    ext = 'webp';
  } else if (header.startsWith('47494638')) {
    mimeType = 'image/gif';
    ext = 'gif';
  } else {
    throw new Error(
      `Unsupported file type. Only ${ALLOWED_TYPES.join(', ')} images are accepted ` +
        `(file extensions: ${ALLOWED_EXTENSIONS.join(', ')}). ` +
        `Tip: SVG, BMP, TIFF, HEIC and PDF files are not supported — please convert to JPEG, PNG or WebP first.`
    );
  }

  // 3. Decode dimensions — also catches corrupt / truncated files.
  let dimensions;
  try {
    dimensions = sizeOf(buffer);
  } catch {
    throw new Error(
      `The ${ext.toUpperCase()} file appears to be corrupted or incomplete and could not be read. ` +
        `Please re-export the image and try again.`
    );
  }

  const width = dimensions.width || 0;
  const height = dimensions.height || 0;

  if (!width || !height) {
    throw new Error(
      'Unable to determine the image dimensions. The file may be corrupted — please re-export and try again.'
    );
  }

  // 4. Pixel-dimension limits.
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(
      `Image is too small (${width}×${height}px). Minimum required dimensions are ` +
        `${MIN_DIMENSION}×${MIN_DIMENSION}px. Please upload a higher-resolution image.`
    );
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(
      `Image dimensions are too large (${width}×${height}px). Maximum allowed is ` +
        `${MAX_DIMENSION}×${MAX_DIMENSION}px. Please resize the image before uploading.`
    );
  }

  return {
    mimeType,
    ext,
    width,
    height,
    sizeBytes,
  };
}
