/**
 * THEDAL Control Plane — Universal Clipboard Utility
 * Ensures 100% reliable copy action across HTTP/HTTPS, localhost, remote IPs, and all modern browsers.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Modern Async Clipboard API (Available in secure contexts / modern browsers)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText threw error, invoking execCommand fallback...", err);
    }
  }

  // 2. Legacy fallback using invisible textarea + document.execCommand('copy')
  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // Ensure full text range selected for mobile/iOS
      textArea.setSelectionRange(0, text.length);

      const success = document.execCommand("copy");
      document.body.removeChild(textArea);

      return success;
    } catch (fallbackErr) {
      console.error("document.execCommand fallback failed:", fallbackErr);
      return false;
    }
  }

  return false;
}
