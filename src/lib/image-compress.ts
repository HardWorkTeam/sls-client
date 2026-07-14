/**
 * Client-side utility to compress and convert mobile photos (including large JPEGs, PNGs, and HEIC/HEIF)
 * before uploading to the backend.
 * This prevents PHP max upload size limit errors (e.g. > 2MB) and optimizes network transfers on mobile data.
 */
export async function compressImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const { maxDimension = 2560, quality = 0.85 } = options;

  // Skip videos, documents, or non-image files
  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  const isImageMime = file.type.startsWith("image/");
  const isImageExt = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp"].includes(extension);

  if (!isImageMime && !isImageExt) {
    return file;
  }

  const isHeic = extension === ".heic" || extension === ".heif" || file.type.includes("heic") || file.type.includes("heif");

  // Skip small non-HEIC images (e.g., under 1.2MB) to avoid unnecessary processing
  if (file.size < 1.2 * 1024 * 1024 && !isHeic) {
    return file;
  }

  try {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load error"));
      img.src = blobUrl;
    });

    URL.revokeObjectURL(blobUrl);

    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (!width || !height) {
      return file;
    }

    // Downscale if image dimensions exceed maxDimension
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const compressedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!compressedBlob) return file;

    // Output clean JPEG file with updated filename extension
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const newFileName = `${baseName}.jpg`;

    return new File([compressedBlob], newFileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // If client-side processing fails (e.g. browser doesn't support canvas drawing for this format), return original file
    return file;
  }
}
