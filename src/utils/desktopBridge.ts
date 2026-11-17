import type {
  DesktopAPI,
  DesktopUpdateStatus,
  ScanModsFolderResult,
} from '../types/desktop.d.ts';

let externalLinkInterceptorAttached = false;

async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

function getTauriInvoke():
  | (<T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>)
  | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.__TAURI__?.core?.invoke === 'function') {
    return window.__TAURI__.core.invoke;
  }
  if (typeof window.__TAURI_INTERNALS__?.invoke === 'function') {
    return window.__TAURI_INTERNALS__.invoke;
  }
  return null;
}

function attachExternalLinkInterceptor(openExternal: (url: string) => void): void {
  if (typeof document === 'undefined' || externalLinkInterceptorAttached) return;
  externalLinkInterceptorAttached = true;

  document.addEventListener('click', event => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a[target="_blank"]') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href && (href.startsWith('https://') || href.startsWith('http://'))) {
      event.preventDefault();
      openExternal(href);
    }
  });
}

export function resetDesktopBridgeForTests(): void {
  externalLinkInterceptorAttached = false;
}

export function initDesktopBridge(): void {
  if (typeof window === 'undefined') return;

  const tauriInvoke = getTauriInvoke();
  if (tauriInvoke) {
    const api: DesktopAPI = {
      isDesktop: true,
      getAppMeta: () => tauriInvoke('desktop_get_meta'),
      checkHotDbUpdate: () => tauriInvoke('desktop_check_hot_db'),
      checkAppUpdate: () => tauriInvoke('desktop_check_app_update'),
      installAppUpdate: () => tauriInvoke<void>('desktop_install_app_update'),
      scanModsFolder: () => tauriInvoke<ScanModsFolderResult>('desktop_scan_mods'),
      loadAppState: () => tauriInvoke<Record<string, unknown> | null>('desktop_load_state'),
      saveAppState: async state => {
        const ok = await tauriInvoke<boolean>('desktop_save_state', { state });
        return Boolean(ok);
      },
      onAppUpdateStatus: callback => {
        const listen = window.__TAURI__?.event?.listen;
        if (typeof listen !== 'function') {
          return () => {};
        }
        let unlistenFn: (() => void) | null = null;
        let disposed = false;
        void listen<DesktopUpdateStatus>('desktop://update-status', evt => {
          if (!disposed && evt?.payload) {
            callback(evt.payload);
          }
        }).then(unlisten => {
          if (disposed) {
            unlisten();
          } else {
            unlistenFn = unlisten;
          }
        });
        return () => {
          disposed = true;
          unlistenFn?.();
        };
      },
    };

    window.desktopAPI = api;
    attachExternalLinkInterceptor(href => {
      void tauriInvoke('desktop_open_external', { url: href });
    });
    return;
  }

  if (!window.__GO_DESKTOP_API__) return;

  const api: DesktopAPI = {
    isDesktop: true,
    getAppMeta: async () => {
      const res = await fetch('/api/desktop/meta', { cache: 'no-store' });
      return res.json();
    },
    checkHotDbUpdate: () => postJSON('/api/desktop/check-hot-db'),
    checkAppUpdate: async () => ({ ok: false, message: 'Используйте релизы GitHub' }),
    installAppUpdate: async () => {},
    scanModsFolder: () => postJSON<ScanModsFolderResult>('/api/desktop/scan-mods'),
    loadAppState: async () => {
      const res = await fetch('/api/desktop/state', { cache: 'no-store' });
      return res.json();
    },
    saveAppState: async state => {
      const data = await postJSON<{ ok?: boolean }>('/api/desktop/state', state);
      return Boolean(data.ok);
    },
    onAppUpdateStatus: () => () => {},
  };

  window.desktopAPI = api;
  attachExternalLinkInterceptor(href => {
    void postJSON('/api/desktop/open-external', { url: href });
  });
}
