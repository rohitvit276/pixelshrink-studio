// Robust blob downloader that works across browsers and iframe contexts.
// - Creates a fresh object URL on each call (no stale URLs)
// - Uses a hidden anchor with download attribute
// - Falls back to opening a new tab if the sandbox blocks downloads
export function downloadBlob(blob, filename) {
  if (!blob) return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (e) { /* noop */ }
      try { URL.revokeObjectURL(url); } catch (e) { /* noop */ }
    }, 1500);
    return true;
  } catch (e) {
    // Fallback: open in a new tab (works when iframe sandbox blocks downloads)
    try {
      const fallbackUrl = URL.createObjectURL(blob);
      window.open(fallbackUrl, '_blank', 'noopener');
      return true;
    } catch (err) {
      console.error('[downloadBlob] both attempts failed:', e, err);
      return false;
    }
  }
}
