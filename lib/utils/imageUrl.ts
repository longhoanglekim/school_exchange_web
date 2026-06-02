/**
 * Check whether a value represents a displayable image (data URL, local path, or remote URL).
 *
 * Returns false for legacy placeholder text like "POST", "BOOK", "∑", etc.
 */
export function isImageUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  return (
    value.startsWith('data:image/') ||
    value.startsWith('/images/') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}
