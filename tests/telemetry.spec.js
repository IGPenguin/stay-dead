const { test, expect } = require('@playwright/test');
const { dismissChangelog } = require('./helpers');

// Google Form entry IDs — mirror of ENTRY in js/telemetry.js
const E = {
  event:          'entry.779158674',
  payload:        'entry.1070192513',
  encounterCount: 'entry.839368',
  playtime:       'entry.25828477'
};

// Telemetry is blocked in tests by three guards: navigator.webdriver, the
// sd_is_test localStorage flag, and isAuthorizedHost(). Neutralise all three and
// swap sendBeacon for a capture buffer so we can assert on what would be sent.
async function armCapture(page) {
  await page.addInitScript(() => {
    try { localStorage.removeItem('sd_is_test'); } catch (e) {}
    window.SD_LOCAL_AUTH = true;
    Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
    window.__TELE = [];
    navigator.sendBeacon = function (url, data) { window.__TELE.push(data); return true; };
  });
}

// TELEMETRY_DISABLED_LOCALHOST is declared in constants.js, so it can only be
// flipped after page scripts have run.
async function unblockLocalhost(page) {
  await page.evaluate(() => { window.TELEMETRY_DISABLED_LOCALHOST = false; });
}

async function events(page) {
  const bodies = await page.evaluate(async () =>
    await Promise.all((window.__TELE || []).map(b => (typeof b === 'string' ? b : b.text())))
  );
  return bodies.map(b => {
    const p = new URLSearchParams(b);
    return {
      event:   p.get(E.event),
      payload: p.get(E.payload) || '',
      ec:      p.get(E.encounterCount),
      playtime: parseInt(p.get(E.playtime) || '0', 10)
    };
  });
}

function pack(payload) {
  const i = payload.lastIndexOf('^');          // split on the LAST ^, per the format contract
  const out = {};
  if (i === -1) return out;
  payload.slice(i + 1).split(';').forEach(kv => {
    const j = kv.indexOf('=');
    if (j > -1) out[kv.slice(0, j)] = kv.slice(j + 1);
  });
  return out;
}
const prefix = (payload) => payload.slice(0, payload.lastIndexOf('^'));

async function hide(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
async function show(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// touchFree: skip the changelog dismissal, which is itself a real click and would
// set the interaction flag. Only the "never touched" test needs this.
async function atMenu(page, { touchFree = false } = {}) {
  await armCapture(page);
  await page.goto('/');
  await expect(page.locator('#menu_new_game')).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  if (!touchFree) await dismissChangelog(page);
  await unblockLocalhost(page);
  await page.evaluate(() => { window.__TELE.length = 0; }); // drop the boot game_visit
}

async function startRun(page) {
  await page.locator('#menu_new_game').click();
  await expect(page.locator('#id_game')).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(
    () => typeof linesGenerator !== 'undefined' && linesGenerator.length > 0,
    { timeout: 10_000 }
  );
}

test.describe('telemetry: context pack', () => {
  test('rides the payload column without disturbing the existing prefix', async ({ page }) => {
    await atMenu(page);
    await page.evaluate(() => TelemetryManager.send('run_end', '\u{1F404} Grazing Cow|death'));

    const [e] = await events(page);
    expect(e.event).toBe('run_end');
    // The historical prefix must survive byte-identical or old rows stop comparing.
    expect(prefix(e.payload)).toBe('\u{1F404} Grazing Cow|death');
    expect(pack(e.payload)).toMatchObject({ ri: expect.any(String), ar: expect.any(String),
                                            rv: expect.any(String), hp: expect.any(String),
                                            in: expect.any(String) });
  });

  test('achievement payload keeps the bare id as its prefix', async ({ page }) => {
    await atMenu(page);
    await page.evaluate(() => TelemetryManager.send('achievement', 'kill_first'));
    const [e] = await events(page);
    expect(prefix(e.payload)).toBe('kill_first');
  });

  test('reports revives from the run-scoped counter', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { playerRevivesThisRun = 2; TelemetryManager.send('achievement', 'x'); });
    const evs = await events(page);
    expect(pack(evs[evs.length - 1].payload).rv).toBe('2');
  });
});

test.describe('telemetry: runIndex', () => {
  test('increments on a new run and is carried in the pack', async ({ page }) => {
    await atMenu(page);
    const before = await page.evaluate(() => localStorage.getItem('sd_run_index'));
    await startRun(page);

    const after = await page.evaluate(() => localStorage.getItem('sd_run_index'));
    expect(parseInt(after || '0', 10)).toBe(parseInt(before || '0', 10) + 1);

    const runStart = (await events(page)).find(e => e.event === 'run_start');
    expect(runStart).toBeTruthy();
    // Must reflect the post-increment value, not the stale one.
    expect(pack(runStart.payload).ri).toBe(after);
  });
});

test.describe('telemetry: interaction flag', () => {
  test('is 0 when the page is never touched', async ({ page }) => {
    await atMenu(page, { touchFree: true });
    await page.evaluate(() => TelemetryManager.send('game_visit', ''));
    const [e] = await events(page);
    expect(pack(e.payload).in).toBe('0');
  });

  test('flips to 1 after a real pointer input', async ({ page }) => {
    await atMenu(page);
    await page.locator('#menu_new_game').click();
    await page.evaluate(() => TelemetryManager.send('game_visit', ''));
    const evs = await events(page);
    expect(pack(evs[evs.length - 1].payload).in).toBe('1');
  });
});

test.describe('telemetry: run_exit', () => {
  test('fires on page hide mid-run, carrying encounter depth', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { window.__TELE.length = 0; });

    await hide(page);
    const exits = (await events(page)).filter(e => e.event === 'run_exit');
    expect(exits).toHaveLength(1);
    expect(parseInt(exits[0].ec, 10)).toBeGreaterThanOrEqual(0);
  });

  test('does not re-report the same depth on a second hide', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { window.__TELE.length = 0; });

    await hide(page);
    await show(page);
    await hide(page);
    expect((await events(page)).filter(e => e.event === 'run_exit')).toHaveLength(1);
  });

  test('re-arms once the player advances', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { window.__TELE.length = 0; });

    await hide(page);
    await show(page);
    await page.evaluate(() => { encounterCount += 1; });
    await hide(page);
    expect((await events(page)).filter(e => e.event === 'run_exit')).toHaveLength(2);
  });

  test('is suppressed once the run has already ended', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { TelemetryManager.send('run_end', 'x|death'); window.__TELE.length = 0; });

    await hide(page);
    const evs = await events(page);
    expect(evs.filter(e => e.event === 'run_exit')).toHaveLength(0);
    expect(evs.filter(e => e.event === 'menu_leave')).toHaveLength(0);
  });
});

test.describe('telemetry: menu_leave', () => {
  test('fires when the player leaves without ever starting a run', async ({ page }) => {
    await atMenu(page);
    await hide(page);

    const leaves = (await events(page)).filter(e => e.event === 'menu_leave');
    expect(leaves).toHaveLength(1);
    const [dwell, screen] = prefix(leaves[0].payload).split('|');
    expect(parseInt(dwell, 10)).toBeGreaterThanOrEqual(0);
    expect(screen).toBe('menu_main_screen');
  });

  test('reports the last screen the player was on', async ({ page }) => {
    await atMenu(page);
    await page.locator('#menu_settings').click();
    await page.waitForTimeout(700); // menuFade
    await hide(page);

    const leaves = (await events(page)).filter(e => e.event === 'menu_leave');
    expect(leaves).toHaveLength(1);
    expect(prefix(leaves[0].payload).split('|')[1]).toBe('menu_settings_screen');
  });

  test('never fires once a run is in progress', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { window.__TELE.length = 0; });

    await hide(page);
    const evs = await events(page);
    expect(evs.filter(e => e.event === 'menu_leave')).toHaveLength(0);
    expect(evs.filter(e => e.event === 'run_exit')).toHaveLength(1);
  });
});

test.describe('telemetry: active playtime', () => {
  test('does not advance while the tab is hidden', async ({ page }) => {
    await atMenu(page);
    await startRun(page);

    await hide(page);
    const banked = await page.evaluate(() => getActivePlaytimeMs());
    await page.waitForTimeout(1200);
    const afterIdle = await page.evaluate(() => getActivePlaytimeMs());
    expect(afterIdle).toBe(banked); // clock is paused, not ticking

    await show(page);
    await page.waitForTimeout(1100);
    expect(await page.evaluate(() => getActivePlaytimeMs())).toBeGreaterThan(banked);
  });

  test('survives a save/restore without absorbing the idle gap', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.waitForTimeout(1100);

    await page.evaluate(() => SaveManager.saveGameState());
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('gameState')).playtimeBankedMs
    );
    expect(saved).toBeGreaterThan(0);

    // Backdate runStartTimestamp by a day: the old wall-clock formula would report
    // ~86400s here. The banked value must ignore it entirely.
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('gameState'));
      s.runStartTimestamp = Date.now() - 86_400_000;
      localStorage.setItem('gameState', JSON.stringify(s));
    });

    await page.reload();
    await expect(page.locator('#menu_continue')).toBeVisible({ timeout: 15_000 });
    await dismissChangelog(page);
    await page.locator('#menu_continue').click();
    await expect(page.locator('#id_game')).toBeVisible({ timeout: 10_000 });

    const restored = await page.evaluate(() => getActivePlaytime());
    expect(restored).toBeGreaterThanOrEqual(1);
    expect(restored).toBeLessThan(60); // not the 86400 the wall-clock bug would give
  });

  test('score payload uses active playtime, not wall clock', async ({ page }) => {
    await atMenu(page);
    await startRun(page);
    await page.evaluate(() => { runStartTimestamp = Date.now() - 86_400_000; });
    const playtime = await page.evaluate(() => ScoreManager.buildPayload('death').playtime);
    expect(playtime).toBeLessThan(60);
  });
});
