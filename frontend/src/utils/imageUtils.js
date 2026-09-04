/**
 * Ensures image data string is formatted correctly as a valid img src URL.
 * Handles raw base64, data URIs, and standard URLs safely without double-prefixing.
 */
export function formatImageSrc(imgStr) {
  if (!imgStr) return '';
  const s = String(imgStr).trim();
  if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
    return s;
  }
  return `data:image/jpeg;base64,${s}`;
}

export default formatImageSrc;
