/**
 * Tauri & Desktop Companion Helper Utilities
 */

interface TauriWindow {
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
}

interface CustomWindow extends Window {
  __TAURI__?: {
    window?: {
      getCurrentWindow: () => TauriWindow;
    };
  };
  __TAURI_INTERNALS__?: Record<string, unknown>;
}

export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as CustomWindow;
  return Boolean(win.__TAURI_INTERNALS__ || win.__TAURI__);
}

export async function minimizeWindow() {
  if (typeof window !== 'undefined' && isTauriEnvironment()) {
    try {
      const win = window as CustomWindow;
      if (win.__TAURI__?.window?.getCurrentWindow) {
        await win.__TAURI__.window.getCurrentWindow().minimize();
      }
    } catch (e) {
      console.warn('Tauri minimize not active', e);
    }
  }
}

export async function toggleMaximizeWindow() {
  if (typeof window !== 'undefined' && isTauriEnvironment()) {
    try {
      const win = window as CustomWindow;
      if (win.__TAURI__?.window?.getCurrentWindow) {
        await win.__TAURI__.window.getCurrentWindow().toggleMaximize();
      }
    } catch (e) {
      console.warn('Tauri maximize not active', e);
    }
  }
}

export async function closeWindow() {
  if (typeof window !== 'undefined' && isTauriEnvironment()) {
    try {
      const win = window as CustomWindow;
      if (win.__TAURI__?.window?.getCurrentWindow) {
        await win.__TAURI__.window.getCurrentWindow().close();
      }
    } catch (e) {
      console.warn('Tauri close not active', e);
    }
  }
}
