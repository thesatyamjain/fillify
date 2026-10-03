/**
 * Production-ready copy to clipboard with fallback for non-secure contexts (HTTP / iframes).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to legacy execCommand if modern API is blocked by permissions or security context
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Clipboard write fallback failed:', err);
    return false;
  }
}

/**
 * Read text from clipboard with security context check.
 */
export async function pasteFromClipboard(): Promise<string | null> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
      return null;
    }
  }
  return null;
}
