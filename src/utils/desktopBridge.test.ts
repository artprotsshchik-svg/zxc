import test from 'node:test';
import assert from 'node:assert/strict';
import { initDesktopBridge, resetDesktopBridgeForTests } from './desktopBridge';

test('initDesktopBridge leaves desktopAPI undefined in pure browser mode', () => {
  resetDesktopBridgeForTests();
  const prevWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = {};

  try {
    initDesktopBridge();
    assert.equal(((globalThis as Record<string, unknown>).window as { desktopAPI?: unknown }).desktopAPI, undefined);
  } finally {
    (globalThis as Record<string, unknown>).window = prevWindow;
  }
});

test('initDesktopBridge wires Rust/Tauri v2 commands when __TAURI_INTERNALS__ is present', async () => {
  resetDesktopBridgeForTests();
  const calls: Array<{ cmd: string; args?: Record<string, unknown> }> = [];

  const mockWindow = {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string, args?: Record<string, unknown>) => {
        calls.push({ cmd, args });
        if (cmd === 'desktop_get_meta') {
          return { appVersion: '0.1.0', hotManifest: null };
        }
        if (cmd === 'desktop_scan_mods') {
          return {
            canceled: false,
            folderPath: 'C:/Minecraft/mods',
            jarFiles: ['embeddium-0.3.jar', 'modernfix-5.19.jar'],
            hasConnectorFolder: false,
            hasEmbeddiumSodiumAlias: true,
          };
        }
        if (cmd === 'desktop_save_state') {
          return true;
        }
        if (cmd === 'desktop_load_state') {
          return { schemaVersion: 2, activeTab: 'checker' };
        }
        if (cmd === 'desktop_check_hot_db') {
          return { status: 'up-to-date', updatedAt: '16.11.2026' };
        }
        if (cmd === 'desktop_check_app_update') {
          return { ok: true, version: '0.1.0', message: 'Установлена последняя версия' };
        }
        return null;
      },
    },
  } as unknown as Window;

  const prevWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = mockWindow;

  try {
    initDesktopBridge();
    const api = mockWindow.desktopAPI;
    assert.ok(api, 'desktopAPI must be initialized');
    assert.equal(api.isDesktop, true);

    const meta = await api.getAppMeta();
    assert.equal(meta.appVersion, '0.1.0');

    const scan = await api.scanModsFolder();
    assert.equal(scan.canceled, false);
    assert.equal(scan.hasEmbeddiumSodiumAlias, true);
    assert.deepEqual(scan.jarFiles, ['embeddium-0.3.jar', 'modernfix-5.19.jar']);

    const saved = await api.saveAppState?.({ activeTab: 'checker' });
    assert.equal(saved, true);

    const loaded = await api.loadAppState?.();
    assert.deepEqual(loaded, { schemaVersion: 2, activeTab: 'checker' });

    const hot = await api.checkHotDbUpdate();
    assert.equal(hot.status, 'up-to-date');

    const upd = await api.checkAppUpdate();
    assert.equal(upd.ok, true);

    assert.deepEqual(
      calls.map(c => c.cmd),
      [
        'desktop_get_meta',
        'desktop_scan_mods',
        'desktop_save_state',
        'desktop_load_state',
        'desktop_check_hot_db',
        'desktop_check_app_update',
      ]
    );
    assert.deepEqual(calls[2].args, { state: { activeTab: 'checker' } });
  } finally {
    (globalThis as Record<string, unknown>).window = prevWindow;
  }
});
