/**
 * Utilitas Sinkronisasi Tema Aplikasi & Status Bar Peramban (Refactor 174)
 */

export function syncThemeChrome(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;

  const targetColor = theme === 'dark' ? '#0b0f19' : '#f8fafc';

  let metaThemeColor = document.querySelector<HTMLMetaElement>('meta#app-theme-color');
  if (!metaThemeColor) {
    metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  }

  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', targetColor);
  } else {
    const meta = document.createElement('meta');
    meta.id = 'app-theme-color';
    meta.name = 'theme-color';
    meta.content = targetColor;
    document.head.appendChild(meta);
  }
}

