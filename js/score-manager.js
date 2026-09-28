var ScoreManager = (function () {
  var FORM_URL  = 'https://docs.google.com/forms/d/e/1FAIpQLScqmG98EkuIREvZIXq7PYC6-z2HrPU4UKB07ifoIxEVPfefsg/formResponse';
  var HMAC_SALT = '@Pd`6aI3>Cb};XCco_Ol.~3._b*+iE?c}HMlJx>cQ>~Tv4h#bE#yif,dK<KlMq5C';

  // ── Score formula weights — tweak here ────────────────────────────────────
  var SCORE_WEIGHTS = {
    levelMult:     15,   // points per level
    encounterDiv:   5,   // floor(encounters / encounterDiv)
    companionMult:  8,   // points per companion
    statDiv:        2,   // floor(net stats / statDiv)
    fishMult:       2,   // points per successful fish catch
    winBonus:     100,   // flat bonus for any win ending
  };
  var DIFFICULTY_MULTS = {
    Easy:      0.7,
    Standard:  1.0,
    Hardcore:  1.5,
  };
  // ─────────────────────────────────────────────────────────────────────────

  var ENDING_LABELS = {
    win_kill:    '🗡 Ended what love could not.',
    win_walk:    '💔 Let her wait forever.',
    win_guard:   '🗿 Turned to stone beside her.',
    win_embrace: '🫂 Held her until the dark came.',
    win_sleep:   '💤 Let the world go cold.',
    win_speak:   '💖 Finally remembered her name.',
    win_free:    '🪽 Undid the spell that started it.',
    win_pray:    '🙏 Asked the gods for their mercy.',
    win_curse:   '👺 Made sure neither finds peace.',
    win:         '👑 Finished.',
    death:       '💀 Never made it back to her.',
    rival_death: "💔 Slain by someone's shadow."
  };

  function getEndingLabel(endType) {
    return ENDING_LABELS[endType] || (endType && endType.startsWith('win_') ? '👑 ' + endType.slice(4) : '💀 Died');
  }
  var NICKNAME_KEY = 'playerNickname';
  var RANKINGS_URL = 'https://raw.githubusercontent.com/IGPenguin/stay-dead/rankings/highscores.json';
  var _BANNED_NICKNAMES = ['perseus blade'];

  function _isBannedNickname(name) {
    if (typeof isLocalhost === 'function' && isLocalhost()) return false;
    return _BANNED_NICKNAMES.indexOf((name || '').toLowerCase().trim()) !== -1;
  }

  var ENTRY = {
    userId:         'entry.1612912835',
    sessionId:      'entry.1993758260',
    score:          'entry.1465451014',
    nickname:       'entry.1372787820',
    charName:       'entry.1616306744',
    origin:         'entry.1542875165',
    level:          'entry.590114713',
    encounterCount: 'entry.839368',
    companions:     'entry.33188034',
    stats:          'entry.1588854288',
    karma:          'entry.583263093',
    difficulty:     'entry.1242759362',
    gameVersion:    'entry.1921806822',
    playtime:       'entry.25828477',
    endType:        'entry.1003026246',
    datetime:       'entry.384732007',
    inventory:      'entry.1287444781',
    coins:          'entry.232215063',
    ghostLink:      'entry.180473238',
    hash:           'entry.1370835727'
  };

  var _pendingPayload    = null;
  var _pendingOnDismissed = null;

  function _computeComponents(level, encounters, companions, totalStats, baseline, karma, isWin, diffLabel, critSuccesses, critFails, fishCatches, sleepPenalty) {
    var w = SCORE_WEIGHTS;
    var cs             = critSuccesses || 0;
    var cf             = critFails     || 0;
    var fc             = fishCatches   || 0;
    var sp             = sleepPenalty  || 0;
    var levelBonus     = level * w.levelMult;
    var encounterBonus = Math.floor(encounters / w.encounterDiv);
    var companionBonus = companions * w.companionMult;
    var statDelta      = Math.max(0, totalStats - baseline);
    var statBonus      = Math.floor(statDelta / w.statDiv);
    var karmaBonus     = karma;
    var critSuccessBonus = cs * 3;
    var critFailPenalty  = cf * 3;
    var critBonus        = critSuccessBonus - critFailPenalty;
    var fishBonus      = fc * w.fishMult;
    var winBonus       = isWin ? w.winBonus : 0;
    var mult           = DIFFICULTY_MULTS[diffLabel] || 1.0;
    var raw            = levelBonus + encounterBonus + companionBonus + statBonus + karmaBonus + critBonus + fishBonus - sp;
    return {
      levelBonus: levelBonus, encounterBonus: encounterBonus, companionBonus: companionBonus,
      statBonus: statBonus, statDelta: statDelta, karmaBonus: karmaBonus,
      critSuccesses: cs, critFails: cf, critSuccessBonus: critSuccessBonus, critFailPenalty: critFailPenalty, critBonus: critBonus,
      fishCatches: fc, fishBonus: fishBonus,
      sleepPenalty: sp,
      winBonus: winBonus, mult: mult, raw: raw, score: Math.round((raw + winBonus) * mult),
      level: level, encounters: encounters, companions: companions
    };
  }

  function _liveComponents(isWin) {
    if (!encounterCount) return null;
    var totalStats = (playerHpMax||0)+(playerAtk||0)+(playerStaMax||0)+(playerLck||0)+(playerInt||0)+(playerMgkMax||0)+(playerDef||0);
    var companions  = countEmoji(playerPartyString);
    var diffLabel   = typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.label : 'Standard';
    return _computeComponents(playerLevel||1, encounterCount||0, companions, totalStats, scoreBaselineStats||0, playerKarma||1, !!isWin, diffLabel, playerCritSuccesses||0, playerCritFails||0, playerFishCatches||0, playerTotalSleepPenalty||0);
  }

  function calculate() {
    var c = _liveComponents(false);
    return c ? c.raw : 0;
  }

  function buildPayload(endType) {
    var isWin   = endType === 'win' || (typeof endType === 'string' && endType.startsWith('win_'));
    var comps   = _liveComponents(isWin) || _computeComponents(playerLevel||1, 0, 0, 0, 0, playerKarma||1, isWin, typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.label : 'Standard', playerCritSuccesses||0, playerCritFails||0, playerFishCatches||0, playerTotalSleepPenalty||0);
    var statsStr = [playerHpMax, playerAtk, playerStaMax, playerLck, playerInt, playerMgkMax, playerDef].join(';');
    var playtime = getActivePlaytime();
    return {
      score:             comps.score,
      nickname:          getNickname() || String(playerName || '?'),
      charName:          String(playerName || '?'),
      origin:            String(playerOriginName || ''),
      level:             playerLevel || 1,
      encounterCount:    encounterCount || 0,
      companions:        comps.companions,
      stats:             statsStr,
      karma:             playerKarma || 1,
      difficulty:        (typeof GAME_CONFIG !== 'undefined' ? (GAME_CONFIG.displayName || GAME_CONFIG.label) : '💔 Rough'),
      gameVersion:       (typeof versionCode !== 'undefined' ? versionCode : '?'),
      playtime:          playtime,
      endType:           endType,
      datetime:          new Date().toISOString(),
      inventory:         String(playerLootString  || ''),
      companionString:   String(playerPartyString || ''),
      area:              String(areaName          || ''),
      originEmoji:       String(playerEmoji       || ''),
      coins:             savedCoins || 0,
      deathMessage:      (typeof enemyEmoji !== 'undefined' && enemyEmoji ? enemyEmoji + ' ' : '') + (typeof enemyMsg !== 'undefined' ? String(enemyMsg || '') : ''),
      scoreBaselineStats: scoreBaselineStats || 0,
      critSuccesses:     playerCritSuccesses      || 0,
      critFails:         playerCritFails          || 0,
      fishCatches:       playerFishCatches        || 0,
      sleepPenalty:      playerTotalSleepPenalty  || 0
    };
  }

  function _rotr32(x, n) { return (x >>> n) | (x << (32 - n)); }

  function _sha256(buf) {
    var K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var len = buf.length, bitLen = len * 8;
    var padLen = (len % 64 < 56) ? 56 - (len % 64) : 120 - (len % 64);
    var padded = new Uint8Array(len + padLen + 8);
    padded.set(buf); padded[len] = 0x80;
    var pdv = new DataView(padded.buffer);
    pdv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
    pdv.setUint32(padded.length - 4, bitLen >>> 0, false);
    var w = new Uint32Array(64);
    for (var bi = 0; bi < padded.length; bi += 64) {
      var dv = new DataView(padded.buffer, bi, 64);
      for (var j = 0; j < 16; j++) w[j] = dv.getUint32(j * 4, false);
      for (j = 16; j < 64; j++) {
        var s0 = _rotr32(w[j-15],7)  ^ _rotr32(w[j-15],18) ^ (w[j-15] >>> 3);
        var s1 = _rotr32(w[j-2], 17) ^ _rotr32(w[j-2], 19) ^ (w[j-2]  >>> 10);
        w[j] = (w[j-16] + s0 + w[j-7] + s1) >>> 0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (j = 0; j < 64; j++) {
        var S1  = _rotr32(e,6)  ^ _rotr32(e,11) ^ _rotr32(e,25);
        var ch  = (e & f) ^ (~e & g);
        var t1  = (h + S1 + ch + K[j] + w[j]) >>> 0;
        var S0  = _rotr32(a,2)  ^ _rotr32(a,13) ^ _rotr32(a,22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2  = (S0 + maj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    var out = new Uint8Array(32), ov = new DataView(out.buffer);
    for (var i = 0; i < 8; i++) ov.setUint32(i * 4, H[i], false);
    return out;
  }

  function _hmacSha256Fallback(keyStr, msgStr) {
    var enc = new TextEncoder();
    var key = enc.encode(keyStr), msg = enc.encode(msgStr);
    if (key.length > 64) key = _sha256(key);
    var ipad = new Uint8Array(64), opad = new Uint8Array(64);
    ipad.set(key); opad.set(key);
    for (var i = 0; i < 64; i++) { ipad[i] ^= 0x36; opad[i] ^= 0x5c; }
    var inner = new Uint8Array(64 + msg.length);
    inner.set(ipad); inner.set(msg, 64);
    var outer = new Uint8Array(96);
    outer.set(opad); outer.set(_sha256(inner), 64);
    return Array.from(_sha256(outer)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function _generateHash(payload) {
    var msg = payload.charName + '|' + payload.score + '|' + payload.datetime;
    var enc = new TextEncoder();
    try {
      var key = await crypto.subtle.importKey(
        'raw', enc.encode(HMAC_SALT),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      var sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
      return Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    } catch (e) { return _hmacSha256Fallback(HMAC_SALT, msg); }
  }

  function encodeGhostLink(payload) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(payload)))); }
    catch (e) { return ''; }
  }

  function decodeGhostLink(b64) {
    try { return JSON.parse(decodeURIComponent(escape(atob(b64)))); }
    catch (e) { return null; }
  }

  function getNickname() {
    try { return localStorage.getItem(NICKNAME_KEY) || null; } catch (e) { return null; }
  }

  function setNickname(s) {
    try { localStorage.setItem(NICKNAME_KEY, s); } catch (e) {}
  }

  function _getBreakdown(payload) {
    var statArr    = (payload.stats || '').split(';').map(Number);
    var totalStats = statArr.reduce(function(a, b) { return a + b; }, 0);
    var isWin      = payload.endType && (payload.endType === 'win' || payload.endType.startsWith('win_'));
    var diffLabel  = typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.label : 'Standard';
    return _computeComponents(payload.level||1, payload.encounterCount||0, payload.companions||0, totalStats, payload.scoreBaselineStats||0, payload.karma||1, !!isWin, diffLabel, payload.critSuccesses||0, payload.critFails||0, payload.fishCatches||0, payload.sleepPenalty||0);
  }

  function _buildBreakdownHTML(payload) {
    var b   = _getBreakdown(payload);
    var ROW = 'display:flex;justify-content:space-between;margin:3px 0;';
    var GOLD = colorGold;
    var RED  = colorRed;

    function makeRow(label, value, color) {
      var c = color || GOLD;
      return '<div style="' + ROW + '"><span style="color:' + c + ';">' + label + '</span>'
           + '<span style="color:' + c + ';font-weight:bold;">' + value + '</span></div>';
    }

    var karmaColor = (b.karmaBonus < 0) ? RED : GOLD;
    var cfColor    = (b.critFails > 0)  ? RED : GOLD;

    var html = '';
    html += makeRow('Level ' + b.level,                    '+' + b.levelBonus);
    html += makeRow('Stat Growth +' + b.statDelta,         '+' + b.statBonus);
    html += makeRow('Karma ' + payload.karma,              (b.karmaBonus >= 0 ? '+' : '') + b.karmaBonus, karmaColor);
    if (b.encounters) html += makeRow('Encounters ' + b.encounters,          '+' + b.encounterBonus);
    if (b.companions) html += makeRow('Companions ' + b.companions,          '+' + b.companionBonus);
    if (b.critSuccesses) html += makeRow('Crit Successes ' + b.critSuccesses, '+' + b.critSuccessBonus);
    if (b.critFails)     html += makeRow('Crit Fails ' + b.critFails,         '-' + b.critFailPenalty, cfColor);
    if (b.fishBonus)     html += makeRow('Fishing ' + b.fishCatches, '+' + b.fishBonus);
    if (b.sleepPenalty)  html += makeRow('Oversleeping ' + b.sleepPenalty,     '-' + b.sleepPenalty, RED);
    if (b.winBonus)      html += makeRow('Ending Bonus',      '+' + b.winBonus);
    if (b.mult !== 1)    html += makeRow('Difficulty',     '×' + b.mult);
    return html;
  }

  async function _doSubmit(payload) {
    if (!isAuthorizedHost()) return;
    var hash = await _generateHash(payload);
    var ghost = encodeGhostLink(payload);

    var uid = (typeof userId !== 'undefined') ? userId : 'anonymous';
    var sid = (typeof sessionId !== 'undefined') ? sessionId : 'none';

    // Google Forms requires application/x-www-form-urlencoded — URLSearchParams sends that format.
    var params = new URLSearchParams();
    params.append(ENTRY.userId,          uid);
    params.append(ENTRY.sessionId,       sid);
    params.append(ENTRY.score,          payload.score);
    params.append(ENTRY.nickname,       payload.nickname);
    params.append(ENTRY.charName,       payload.charName);
    params.append(ENTRY.origin,         payload.origin);
    params.append(ENTRY.level,          payload.level);
    params.append(ENTRY.encounterCount, payload.encounterCount);
    params.append(ENTRY.companions,     payload.companions);
    params.append(ENTRY.stats,          payload.stats);
    params.append(ENTRY.karma,          payload.karma);
    params.append(ENTRY.difficulty,     payload.difficulty);
    params.append(ENTRY.gameVersion,    payload.gameVersion);
    params.append(ENTRY.playtime,       payload.playtime);
    params.append(ENTRY.endType,        payload.endType);
    params.append(ENTRY.datetime,       payload.datetime);
    params.append(ENTRY.inventory,      payload.inventory);
    params.append(ENTRY.coins,          payload.coins);
    params.append(ENTRY.ghostLink,      ghost);
    params.append(ENTRY.hash,           hash);

    var success = false;
    try {
      // Primary: fetch with no-cors (most reliable for active session)
      fetch(FORM_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: params,
        keepalive: true 
      });
      success = true;
    } catch (e) {
      // Fallback: sendBeacon
      if (navigator.sendBeacon) {
        success = navigator.sendBeacon(FORM_URL, params);
      }
    }

    if (!success) { console.warn('ScoreManager: submission failed'); }
  }

  function submitOrPrompt(payload, onDismissed) {
    if (isLocalhost() && RANKINGS_DISABLED_LOCALHOST) {
      if (onDismissed) onDismissed();
      return;
    }
    _pendingPayload     = payload;
    _pendingOnDismissed = onDismissed || null;

    var isWin = payload.endType && (payload.endType === 'win' || payload.endType.startsWith('win_'));

    var labelEl = document.getElementById('nickname_ending_label');
    if (labelEl) {
      labelEl.textContent = isWin
        ? getEndingLabel(payload.endType)
        : (payload.deathMessage || getEndingLabel(payload.endType));
      labelEl.style.color = isWin ? colorGold : colorRed;
    }

    var scoreEl = document.getElementById('nickname_score_display');
    if (scoreEl) scoreEl.textContent = '🎖️ Valor: '+payload.score;

    var breakdownEl = document.getElementById('nickname_score_breakdown');
    if (breakdownEl) breakdownEl.innerHTML = _buildBreakdownHTML(payload);

    var input = document.getElementById('nickname_input');
    if (input) input.value = getNickname() || '';

    var errEl = document.getElementById('nickname_error');
    if (errEl) errEl.style.display = 'none';
    var banEl = document.getElementById('nickname_ban_error');
    if (banEl) banEl.style.display = 'none';

    var overlay = document.getElementById('nickname_overlay');
    if (overlay) overlay.style.display = 'flex';

    var confirmBtn = document.getElementById('nickname_confirm');
    if (confirmBtn) {
      var blocked = typeof cheatedThisRun !== 'undefined' && cheatedThisRun;
      confirmBtn.disabled = blocked;
      confirmBtn.style.opacity = blocked ? '0.35' : '';
      confirmBtn.style.pointerEvents = blocked ? 'none' : '';
      confirmBtn.title = blocked ? '✕ Cheats used this journey.' : '';
    }
  }

  function fetchRankings(callback) {
    fetch(RANKINGS_URL + '?_=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { callback(null, data); })
      .catch(function (e) { callback(e, null); });
  }

  function init() {
    var confirmBtn = document.getElementById('nickname_confirm');
    var skipBtn    = document.getElementById('nickname_skip');
    var input      = document.getElementById('nickname_input');
    var errEl      = document.getElementById('nickname_error');
    var banEl      = document.getElementById('nickname_ban_error');
    var overlay    = document.getElementById('nickname_overlay');
    if (!confirmBtn) return;

    function _dismiss() {
      _pendingPayload = null;
      if (overlay) overlay.style.display = 'none';
      if (_pendingOnDismissed) { var _cb = _pendingOnDismissed; _pendingOnDismissed = null; _cb(); }
    }

    confirmBtn.addEventListener('click', function () {
      var val = (input.value || '').trim();
      if (val.length < 3) {
        if (errEl) errEl.style.display = '';
        if (banEl) banEl.style.display = 'none';
        return;
      }
      if (_isBannedNickname(val)) {
        if (banEl) banEl.style.display = '';
        if (errEl) errEl.style.display = 'none';
        return;
      }
      if (errEl) errEl.style.display = 'none';
      if (banEl) banEl.style.display = 'none';
      setNickname(val);
      if (_pendingPayload && !cheatedThisRun) {
        _pendingPayload.nickname = val;
        _doSubmit(_pendingPayload);
        showAchievementToast({ emoji: '🪦', desc: 'Reckoning submitted: ' + _pendingPayload.score + ' 🎖️ Valor' }, Date.now(), null);
      }
      _dismiss();
    });

    skipBtn.addEventListener('click', function () {
      _dismiss();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') confirmBtn.click();
    });
  }

  return {
    calculate:       calculate,
    buildPayload:    buildPayload,
    submitOrPrompt:  submitOrPrompt,
    encodeGhostLink: encodeGhostLink,
    decodeGhostLink: decodeGhostLink,
    getNickname:     getNickname,
    setNickname:     setNickname,
    fetchRankings:   fetchRankings,
    getEndingLabel:  getEndingLabel,
    init:            init
  };
})();
