/**
 * ClipboardManager - Secure clipboard operations for HadesNotes
 * Handles copying sensitive data with auto-clear functionality
 */

// Store timer reference for cleanup
let clipboardClearTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Copy text to clipboard securely
 * @param text - Text to copy
 * @returns Promise<boolean> - Success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Use modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log('📋 Text copied to clipboard');
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (success) {
      console.log('📋 Text copied to clipboard (fallback)');
    }
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Clear clipboard contents
 * @returns Promise<void>
 */
export async function clearClipboard(): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText('');
      console.log('🧹 Clipboard cleared');
    }
  } catch (error) {
    // Clipboard clear may fail silently in some browsers
    console.warn('Could not clear clipboard:', error);
  }
}

/**
 * Schedule automatic clipboard clear after delay
 * @param delayMs - Delay in milliseconds before clearing
 */
export function scheduleClipboardClear(delayMs: number = 60000): void {
  // Cancel any existing timer
  cancelClipboardClear();

  clipboardClearTimer = setTimeout(async () => {
    await clearClipboard();
    clipboardClearTimer = null;
    console.log('⏰ Clipboard auto-cleared after timeout');
  }, delayMs);

  console.log(`⏱️ Clipboard will be cleared in ${delayMs / 1000} seconds`);
}

/**
 * Cancel scheduled clipboard clear
 */
export function cancelClipboardClear(): void {
  if (clipboardClearTimer) {
    clearTimeout(clipboardClearTimer);
    clipboardClearTimer = null;
  }
}

/**
 * Copy sensitive data with auto-clear
 * @param text - Sensitive text to copy
 * @param autoClearDelayMs - Auto-clear delay (default: 60 seconds)
 * @returns Promise<boolean> - Success status
 */
export async function copySensitiveData(
  text: string,
  autoClearDelayMs: number = 60000
): Promise<boolean> {
  const success = await copyToClipboard(text);
  
  if (success) {
    scheduleClipboardClear(autoClearDelayMs);
  }
  
  return success;
}
