var Menu = (function () {
  var _currentDetailSession = null; // set when history detail is open
  var _selectedOrigin = null;
  var _isInitialLoad = true;
  var _changelogShownThisSession = false;

  var SCREENS = [
    'menu_main_screen',
    'menu_memories_screen',
    'menu_history_screen',
    'menu_credits_screen',
    'menu_confirm_screen',
    'menu_origin_screen',
    'menu_rankings_screen',
    'menu_settings_screen'
  ];

  // ── Show / Hide ────────────────────────────────────────────────────────────

  function show() {
    setBackground("Depths");
    document.getElementById('id_menu').style.display = 'flex';
    document.getElementById('id_game').style.display = 'none';

    var splashEnabled = !isLocalhost() || !SPLASH_DISABLED_LOCALHOST;
    if (_isInitialLoad && splashEnabled) {
      _isInitialLoad = false;
      _renderMain(true);
      _doInitialSplash();
    } else {
      _isInitialLoad = false;
      _renderMain(true); // skipFade — outer curtain (transitionToGame / menuFade) handles the transition
      //_animateLogo();
      _checkVersionChangelog();
    }
  }

  function hide() {
    document.getElementById('id_menu').style.display = 'none';
    // display:contents makes #id_game transparent to its parent flex layout,
    // preserving the exact same centering as before the wrapper was added.
    document.getElementById('id_game').style.display = 'contents';
  }

  // ── Logo animation ─────────────────────────────────────────────────────────

  function _animateLogo() {
    var logo = document.getElementById('id_menu_logo');
    if (!logo) return;
    logo.classList.remove('animate__animated', 'animate__fadeInDown');
    void logo.offsetWidth; // reflow
    logo.style.setProperty('--animate-duration', '2s');
    logo.classList.add('animate__animated', 'animate__fadeInDown');
    logo.addEventListener('animationend', function onDone() {
      logo.removeEventListener('animationend', onDone);
      logo.classList.remove('animate__animated', 'animate__fadeInDown');
    });
  }

  function _doInitialSplash() {
    var curtain = document.getElementById('id_fullscreen_curtain');
    var textEl  = document.getElementById('id_fullscreen_text');
    var logoSource = document.getElementById('id_menu_logo');
    if (!curtain || !textEl || !logoSource) return;

    // 1. Immediate curtain
    curtain.style.display = 'block';
    curtain.style.opacity = '1';
    curtain.style.pointerEvents = 'auto';

    // 2. Prepare Logo clone for the curtain
    var svg = logoSource.querySelector('svg');
    if (!svg) return;
    var svgClone = svg.cloneNode(true);
    svgClone.style.marginTop = '0';
    svgClone.style.display = 'block';
    svgClone.style.margin = '0 auto';
    
    textEl.innerHTML = '';
    textEl.appendChild(svgClone);

    // 2b. Add subtitle
    var sub = document.createElement('div');
    sub.innerHTML = '<span style="color:#FFF; font-weight:600;">by IGPenguin</span>';
    sub.style.cssText = 'margin-top: -46px; font-size: 22px; opacity: 0.6; letter-spacing: 1.5px; font-weight: 400;';
    textEl.appendChild(sub);

    textEl.style.display = 'block';
    textEl.style.opacity = '0';
    textEl.style.webkitTextStroke = '0'; // Remove text stroke for the SVG logo

    // 3. Fade in Logo
    void textEl.offsetWidth;
    textEl.style.setProperty('--animate-duration', '3s');
    textEl.classList.add('animate__animated', 'animate__fadeIn');

    // 4. Hold and Fade out both
    setTimeout(function() {
      textEl.classList.remove('animate__animated', 'animate__fadeIn');
      void textEl.offsetWidth;
      textEl.style.setProperty('--animate-duration', '2.5s');
      textEl.classList.add('animate__animated', 'animate__fadeOut');

      curtain.style.setProperty('--animate-duration', '2.5s');
      curtain.classList.add('animate__animated', 'animate__fadeOut');

      curtain.addEventListener('animationend', function onDone() {
        curtain.removeEventListener('animationend', onDone);
        curtain.style.display = 'none';
        curtain.style.pointerEvents = 'none';
        curtain.classList.remove('animate__animated', 'animate__fadeOut');

        textEl.style.display = 'none';
        textEl.classList.remove('animate__animated', 'animate__fadeOut');
        textEl.innerHTML = '';
        textEl.style.webkitTextStroke = ''; // Restore original style

        _checkVersionChangelog();
      }, { once: true });
    }, 2000);
  }

  // ── Screen routing ─────────────────────────────────────────────────────────

  var _lastScreen = 'menu_main_screen'; // read by TelemetryManager for the menu_leave payload

  function _doShowScreen(id) {
    SCREENS.forEach(function (s) {
      document.getElementById(s).style.display = (s === id) ? '' : 'none';
    });
    _lastScreen = id;
    window.scrollTo(0, -128);
  }

  function getCurrentScreen() { return _lastScreen; }

  // Always fades between screens (only used for in-menu navigation, never from show()).
  function _showScreen(id) {
    menuFade(function () { _doShowScreen(id); });
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  function _renderMain(skipFade) {
    var hasSave = SaveManager.hasContinue();
    savedCoins = parseInt(localStorage.getItem('coins'));
    if (isNaN(savedCoins)) savedCoins = 0;
    // Refund transmute debt if a run was started but origin picker was bypassed
    // (players without boss_kill_first go straight to _doNewGame, never through _renderOriginPicker)
    if (localStorage.getItem('transmuteRunStarted')) {
      var _debt = parseInt(localStorage.getItem('transmuteDebt') || '0');
      if (_debt > 0) {
        savedCoins += _debt;
        localStorage.setItem('coins', parseInt(savedCoins));
      }
      try { localStorage.removeItem('transmuteDebt'); } catch(e) {}
      try { localStorage.removeItem('transmuteRunStarted'); } catch(e) {}
    }
    document.getElementById('menu_continue').style.display = hasSave ? '' : 'none';

    var preview = document.getElementById('menu_continue_preview');
    if (hasSave) {
      var s = SaveManager.loadGameState();
      var stats = _buildStats(s.playerHpMax, s.playerStaMax, s.playerAtk, s.playerMgkMax);

      var partyLoot = '';
      if (s.playerPartyString && s.playerPartyString !== 'undefined') partyLoot += s.playerPartyString;
      if (s.playerLootString  && s.playerLootString  !== 'undefined') partyLoot += s.playerLootString;

      var encounter = (s.enemyEmoji || '') + (s.enemyName ? ' ' + s.enemyName : '');
      preview.innerHTML = _buildRunCardHTML(s.playerName || '?', s.playerLevel || '?', s.areaName || '?', stats, partyLoot, encounter || null, s.adventureStartTime || null, false, true);
      document.getElementById('menu_card_rename').addEventListener('click', function () {
        _renameCurrentRun(function () { _renderMain(true); });
      });
    } else {
      preview.innerHTML = _buildRunCardHTML('👤 Damned Soul', '??', 'Depths of Slumber'," x x x ", '...', '💤 Drifting Away', '⨯ ⨯ ⨯');
    }
    preview.style.display = '';

    if (skipFade) { _doShowScreen('menu_main_screen'); } else { _showScreen('menu_main_screen'); }
  }

  // ── Confirm new game ────────────────────────────────────────────────────────

  function _renderConfirm() {
    var confirmPreview = document.getElementById('menu_confirm_preview');
    if (confirmPreview) {
      var s = SaveManager.loadGameState();
      if (s) {
        var stats = _buildStats(s.playerHpMax, s.playerStaMax, s.playerAtk, s.playerMgkMax);
        var partyLoot = '';
        if (s.playerPartyString && s.playerPartyString !== 'undefined') partyLoot += s.playerPartyString;
        if (s.playerLootString  && s.playerLootString  !== 'undefined') partyLoot += s.playerLootString;
        var encounter = (s.enemyEmoji || '') + (s.enemyName ? ' ' + s.enemyName : '');
        confirmPreview.innerHTML = _buildRunCardHTML(s.playerName || '?', s.playerLevel || '?', s.areaName || '?', stats, partyLoot, encounter || null, s.adventureStartTime || null, false, true);
        document.getElementById('menu_card_rename').addEventListener('click', function () {
          _renameCurrentRun(function () { _renderConfirm(); });
        });
        confirmPreview.style.display = '';
      } else {
        confirmPreview.style.display = 'none';
      }
    }
    _showScreen('menu_confirm_screen');
  }

  // ── Rename current run ─────────────────────────────────────────────────────

  function _renameCurrentRun(onDone) {
    var s = SaveManager.loadGameState();
    if (!s) return;
    var current = s.playerName || playerName || '';
    var currentEmoji = _getCurrentNameEmoji();
    if (currentEmoji && current.startsWith(currentEmoji + ' ')) {
      current = current.slice(currentEmoji.length + 1);
    }
    showCompanionNameDialog('rename', current, function(chosenName) {
      var newName = chosenName || 'Nameless';
      if (_applyCheatName(newName)) {
        SaveManager.patchPlayerName(playerName);
        onDone(); return;
      }
      playerName = newName;
      SaveManager.patchPlayerName(playerName);
      onDone();
    }, function() {
      // cancelled — do nothing
    });
  }

  function _doNewGame(origin) {
    localStorage.setItem('transmuteRunStarted', 'true');
    try { localStorage.removeItem('originRoll'); } catch(e) {}
    renewPlayer(); // sets spentCoins=0, availableCoins=savedCoins
    if (origin) {
      var hp  = origin.hp  || 0;
      var sta = origin.sta || 0;
      var mgk = origin.mgk || 0;
      playerHpMax  = Math.max(1, playerHpMax  + hp);
      playerHp     = playerHpMax;
      playerAtk    = Math.max(0, playerAtk    + (origin.atk || 0));
      playerStaMax = Math.max(1, playerStaMax + sta);
      playerSta    = playerStaMax;
      playerLck    = playerLck + (origin.lck || 0);
      playerInt    = playerInt + (origin.int || 0);
      playerMgkMax = Math.max(0, playerMgkMax + mgk);
      playerMgk    = playerMgkMax;
      if (mgk > 0) AchievementManager.check('mana_first');
      playerName = origin.forcedName || origin.rolledName || getOriginName(origin);
      playerEmoji = origin.emoji;
      playerOriginName = origin.originName || '';
      playerDestined = true;
      
      // Origin starting gifts
      if (origin.emoji.includes("💍")) playerLove += 2; //Groom starts with love
      if (origin.emoji.includes("🎣")) playerLootString += chooseFrom(validBaits) + chooseFrom(validBaits); //Angler starts with two baits
      if (origin.emoji.includes("🤌")) playerLootString += "🧂"; //Gourmet starts with a Salt Shaker
      if (origin.emoji.includes("🏴‍☠️")) savedCoins++ //Pirate gets extra coin (one-time use)

      AchievementManager.check('destiny');
    }
    scoreBaselineStats = playerHpMax + playerAtk + playerStaMax + playerLck + playerInt + playerMgkMax + playerDef;
    AchievementManager.resetSession();
    SaveManager.clearSave();
    startGame(false);
  }

  function _rollOrigins(guaranteeAboveTier) {
    var cards = typeof getOrigins === 'function' ? getOrigins() : [];

    // Filter achievement-locked origins
    var available = cards.filter(function(o) {
      var a = o.achiev || 'none';
      return a === 'none' || AchievementManager.isUnlocked(a);
    });

    // Return stored roll if still valid against the unlocked pool
    try {
      var stored = localStorage.getItem('originRoll');
      if (stored) {
        var parsed = JSON.parse(stored);
        var unlockedNames = available.map(function(c) { return c.originName; });
        if (Array.isArray(parsed) && parsed.length > 0 &&
            parsed.every(function(o) { return o && o.originName && (o._synthetic || unlockedNames.indexOf(o.originName) >= 0); })) {
          return parsed;
        }
      }
    } catch(e) {}

    if (available.length === 0) return [];

    var tierBuckets = {};
    available.forEach(function(o) {
      var tier = _originTier(o);
      if (!tierBuckets[tier]) tierBuckets[tier] = [];
      tierBuckets[tier].push(o);
    });

    // Roll 3 origins using rarity-weighted selection with deduplication.
    // Each slot does an independent tier roll; falls back to any available origin
    // if the rolled tier is exhausted.
    var roll = [];
    var usedNames = {};
    for (var attempts = 0; roll.length < Math.min(3, available.length) && attempts < 30; attempts++) {
      var tier = RarityManager.rollTier(playerLck, playerKarma);
      var bucket = tierBuckets[tier] || [];
      var candidates = bucket.filter(function(o) { return !usedNames[o.originName]; });
      if (candidates.length === 0) {
        dbg('OriginRarityRoll:' + tier + ' → no pool, flat fallback');
        candidates = available.filter(function(o) { return !usedNames[o.originName]; });
      } else {
        dbg('OriginRarityRoll:' + tier);
      }
      if (candidates.length === 0) break;
      var picked = candidates[Math.floor(Math.random() * candidates.length)];
      picked.rolledName = picked.forcedName || getOriginName(picked);
      picked.tier = _originTier(picked);
      usedNames[picked.originName] = true;
      roll.push(picked);
    }

    if (guaranteeAboveTier && roll.length > 0) {
      var TIER_ORDER = ['Cursed', 'Common', 'Uncommon', 'Rare', 'Legendary'];
      var baseIdx = TIER_ORDER.indexOf(guaranteeAboveTier);
      var hasHigher = roll.some(function(o) { return TIER_ORDER.indexOf(o.tier) > baseIdx; });
      if (!hasHigher) {
        var weakestIdx = 0;
        var weakestTierIdx = TIER_ORDER.indexOf(roll[0].tier);
        for (var ri = 1; ri < roll.length; ri++) {
          var rTierIdx = TIER_ORDER.indexOf(roll[ri].tier);
          if (rTierIdx < weakestTierIdx) { weakestTierIdx = rTierIdx; weakestIdx = ri; }
        }
        for (var ti = baseIdx + 1; ti < TIER_ORDER.length; ti++) {
          var otherNames = {};
          roll.forEach(function(o, idx) { if (idx !== weakestIdx) otherNames[o.originName] = true; });
          var bkt = (tierBuckets[TIER_ORDER[ti]] || []).filter(function(o) { return !otherNames[o.originName]; });
          if (bkt.length > 0) {
            var newPick = bkt[Math.floor(Math.random() * bkt.length)];
            newPick.rolledName = newPick.forcedName || getOriginName(newPick);
            newPick.tier = _originTier(newPick);
            roll[weakestIdx] = newPick;
            break;
          }
        }
      }
    }

    try { localStorage.setItem('originRoll', JSON.stringify(roll)); } catch(e) {}
    return roll;
  }

  function _originNet(o) { return RarityManager.calcNet(o); }
  function _hasAnyStats(o) {
    return (o.atk||0)>0||(o.hp||0)>0||(o.sta||0)>0||(o.lck||0)>0||(o.int||0)>0||(o.mgk||0)>0||(o.def||0)>0;
  }

  // Explicit [Tag] in note wins; achievement-gated origins with no stat changes are Legendary
  // (they have hidden bonuses not reflected in stats); otherwise stat net.
  function _originTier(o) {
    var noteTag = RarityManager.getTierFromNote(o.note || '');
    if (noteTag) return noteTag;
    var achievId = (o.achiev || '').trim();
    if (achievId && achievId !== 'none' && _originNet(o) <= 0) return 'Legendary';
    return RarityManager.getTierForNet(_originNet(o));
  }

  function _originRarityBg(net) {
    return RarityManager.getBg(RarityManager.getTierForNet(net));
  }

  function _originRarityColor(net) {
    return RarityManager.getColor(RarityManager.getTierForNet(net));
  }

  function _spliceName(nameA, nameB) {
    var wordA = nameA.slice(0, Math.ceil(nameA.length / 2));
    var wordB = nameB.slice(Math.floor(nameB.length / 2));
    var cap = function(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; };
    return cap(wordA) + wordB;
  }

  function _pickOneOrigin(excludeNames) {
    var cards = typeof getOrigins === 'function' ? getOrigins() : [];
    var available = cards.filter(function(o) {
      var a = o.achiev || 'none';
      return (a === 'none' || AchievementManager.isUnlocked(a)) && excludeNames.indexOf(o.originName) < 0;
    });
    if (available.length === 0) return null;
    var tierBuckets = {};
    available.forEach(function(o) {
      var t = _originTier(o);
      if (!tierBuckets[t]) tierBuckets[t] = [];
      tierBuckets[t].push(o);
    });
    var tier = RarityManager.rollTier(playerLck, playerKarma);
    var bucket = tierBuckets[tier] || [];
    var candidates = bucket.length > 0 ? bucket : available;
    var pick = candidates[Math.floor(Math.random() * candidates.length)];
    pick.rolledName = pick.forcedName || getOriginName(pick);
    pick.tier = _originTier(pick);
    return pick;
  }

  function _buildComboDesc(combined) {
    var LONG_POS  = { hp: '❤️ Health', atk: '⚔️ Attack', sta: '🟢 Energy', lck: '🍀 Luck', int: '🧠 Intellect', mgk: '🔵 Mana', def: '🔰 Defense' };
    var LONG_NEG  = { hp: '💔 Health', atk: '⚔️ Attack', sta: '🟢 Energy', lck: '🍀 Luck', int: '🧠 Intellect', mgk: '🔵 Mana', def: '🔰 Defense' };
    var SHORT_POS = { hp: '❤️ HP',     atk: '⚔️ Atk',    sta: '🟢 Eng',   lck: '🍀 Lck',  int: '🧠 Int',       mgk: '🔵 Man', def: '🔰 Def' };
    var SHORT_NEG = { hp: '💔 HP',     atk: '⚔️ Atk',    sta: '🟢 Eng',   lck: '🍀 Lck',  int: '🧠 Int',       mgk: '🔵 Man', def: '🔰 Def' };
    var statKeys = ['hp', 'atk', 'sta', 'lck', 'int', 'mgk', 'def'];
    var nonZero = statKeys.filter(function(s) { return (combined[s] || 0) !== 0; });
    var POS = nonZero.length >= 3 ? SHORT_POS : LONG_POS;
    var NEG = nonZero.length >= 3 ? SHORT_NEG : LONG_NEG;
    var gains = [], losses = [];
    statKeys.forEach(function(s) {
      var v = combined[s] || 0;
      if (v > 0) gains.push('<b>+' + v + ' ' + POS[s] + '</b>');
      if (v < 0) losses.push('<b>' + v + ' ' + NEG[s] + '</b>');
    });
    var parts = [];
    var sep = nonZero.length >= 4 ? ', ' : ' and ';
    if (gains.length > 0) parts.push((nonZero.length < 3 ? 'Gain ' : '') + gains.join(sep));
    if (losses.length > 0) parts.push((nonZero.length < 4 ? 'lose ' : '') + losses.join(sep));
    var line1 = parts.length > 0 ? parts.join(', ') + '.' : 'No stat changes.';
    return line1 + '<br><i>Transmuted from two different fates.</i>';
  }

  function _buildComboOrigin(a, b) {
    var statKeys = ['hp', 'atk', 'sta', 'lck', 'int', 'mgk', 'def'];
    var combined = {};
    statKeys.forEach(function(s) { combined[s] = (a[s] || 0) + (b[s] || 0); });
    var cleanA = (a.originName || '').replace(/\[.*\]/g, '').trim();
    var cleanB = (b.originName || '').replace(/\[.*\]/g, '').trim();
    var name = Math.random() < 0.5 ? _spliceName(cleanA, cleanB) : _spliceName(cleanB, cleanA);
    var rolledA = (a.rolledName || cleanA).replace(/\[.*\]/g, '').trim();
    var rolledB = (b.rolledName || cleanB).replace(/\[.*\]/g, '').trim();
    var partsA = rolledA.split(' '), partsB = rolledB.split(' ');
    var firstA = partsA[0], surnameA = partsA[partsA.length - 1];
    var firstB = partsB[0], surnameB = partsB[partsB.length - 1];
    var combo = {
      emoji: '🧬',
      originName: name,
      rolledName: Math.random() < 0.5 ? firstA + ' ' + surnameB : firstB + ' ' + surnameA,
      hp: combined.hp, atk: combined.atk, sta: combined.sta,
      lck: combined.lck, int: combined.int, mgk: combined.mgk, def: combined.def,
      desc: _buildComboDesc(combined),
      note: '',
      achiev: 'none',
      _synthetic: true
    };
    combo.tier = _originTier(combo);
    return combo;
  }

  function _renderOriginPicker(skipScreenSwitch, guaranteeAboveTier) {
    // Refund transmute debt only after a run was actually started (not on page reload)
    if (!skipScreenSwitch && localStorage.getItem('transmuteRunStarted')) {
      var debt = parseInt(localStorage.getItem('transmuteDebt') || '0');
      if (debt > 0) {
        savedCoins += debt;
        localStorage.setItem('coins', parseInt(savedCoins));
        try { localStorage.removeItem('transmuteDebt'); } catch(e) {}
      }
      try { localStorage.removeItem('transmuteRunStarted'); } catch(e) {}
    }

    _selectedOrigin = null;
    var origins = _rollOrigins(guaranteeAboveTier);
    if (origins.length === 0) { _doNewGame(null); return; }

    // Legendary tier first, then origins with any stat changes, then by net stat descending
    origins = origins.slice().sort(function(a, b) {
      var aLeg = _originTier(a) === 'Legendary' ? 1 : 0;
      var bLeg = _originTier(b) === 'Legendary' ? 1 : 0;
      if (bLeg !== aLeg) return bLeg - aLeg;
      var aHas = _hasAnyStats(a) ? 1 : 0;
      var bHas = _hasAnyStats(b) ? 1 : 0;
      if (bHas !== aHas) return bHas - aHas;
      return _originNet(b) - _originNet(a);
    });

    var subtitle = document.getElementById('menu_origin_subtitle');

    var availableCoins = parseInt(savedCoins);
    var everHadCoins = AchievementManager.isUnlocked('coin_first');
    if (availableCoins > 0) {
      subtitle.innerHTML = 'Pick a starting Origin, you have <b style="color:#7193bf;">' + availableCoins + ' 🪙 Drachmae</b>.';
    } else if (everHadCoins) {
      subtitle.innerHTML = "You don't have any more "+'<b style="color:#7193bf;">'+"🪙 Drachmae</b>.";
    } else {
      subtitle.innerHTML = 'These starting Origins are available:';
    }

    var list = document.getElementById('menu_origin_list');
    list.innerHTML = '';

    origins.forEach(function(origin) {
      var net        = _originNet(origin);
      var tier       = _originTier(origin);
      var rarityBg    = origin._synthetic ? 'rgb(72,56,8)' : RarityManager.getBg(tier);
      var rarityColor = origin._synthetic ? '#FFD940' : RarityManager.getColor(tier);

      var descParts = origin.desc.split('<br>');
      var descLine1 = descParts[0] || '';
      var descLine2 = descParts.slice(1).join('<br>');

      var entry = document.createElement('div');
      entry.className = 'menu-history-entry';
      entry.setAttribute('tabindex', '0');
      entry.style.cursor = 'pointer';
      entry.style.userSelect = 'none';
      if (rarityBg) entry.style.backgroundColor = rarityBg;

      entry.innerHTML =
        '<div style="display:flex; align-items:center; gap:8px; padding:10px 6px 8px 12px; margin-top:8px;">'
          + '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; width:42px; gap:3px; align-self:center;">'
            + '<span style="font-size:26px; line-height:1; margin-bottom:2px">' + origin.emoji + '</span>'
            + '<h5 style="margin:0; font-size:10px; font-style:normal; font-weight:600; opacity:0.8; text-align:center; color:#fff; white-space:nowrap;">'+ origin.originName + '</h5>'
          + '</div>'
          + '<div style="flex:1; min-width:0;">'
            + '<h5 style="margin:0 0 3px 0; font-size:16px; font-style:normal; font-weight:600; color:' + rarityColor + ';'
            + ' text-align:left; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">'
            + (origin.rolledName || origin.originName)
            + (origin._synthetic ? ' <span style="float:right; font-size:12px; -webkit-text-stroke:0; paint-order:stroke fill; padding-right:10px; margin-top:-2px;">✨ <i style="font-weight:600; color:#FFD940; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">Unique</i></span>' : (origin.achiev && origin.achiev.trim() !== 'none') ? ' <span style="float:right; font-size:12px; -webkit-text-stroke:0; paint-order:stroke fill; padding-right:10px; margin-top:-2px;">🧩 <i style="font-weight:600; color:#62a862ff; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">Memory</i></span>' : '')
            + '</h5>'
            + '<h5 style="margin:0; font-size:13px; font-style:normal; font-weight:400; text-align:left; line-height:165%; color:#fff;">'
            + descLine1 + '</h5>'
            + (descLine2 ? '<h5 style="margin:0; font-size:12px; font-style:italic; font-weight:400; opacity:0.6; text-align:left; line-height:150%; color:#fff;">' + descLine2 + '</h5>' : '')
          + '</div>'
        + '</div>';

      entry.addEventListener('click', function() {
        list.querySelectorAll('.menu-history-entry').forEach(function(el) { el.classList.remove('menu-history-selected'); });
        entry.classList.add('menu-history-selected');
        _selectedOrigin = origin;
        var btn = document.getElementById('menu_origin_begin');
        btn.innerHTML = '✨ Start as ' + origin.originName;
        btn.style.color = '#FFD940';
      });

      list.appendChild(entry);
    });

    var beginBtn = document.getElementById('menu_origin_begin');
    beginBtn.innerHTML = '⁉️ Select Origin...';
    beginBtn.style.color = 'grey';

    var rerollBtn = document.getElementById('menu_origin_reroll');
    if (rerollBtn) {
      var canReroll = parseInt(savedCoins) >= 1;
      rerollBtn.style.display = (canReroll || everHadCoins) ? '' : 'none';
      rerollBtn.disabled = !canReroll;
      rerollBtn.style.color = canReroll ? colorFairy : colorDarkGrey;
      rerollBtn.style.backgroundColor = canReroll ? 'rgb(40 57 79)' : '#2a2a2a';
    }

    var combineBtn = document.getElementById('menu_origin_combine');
    if (combineBtn) {
      var canCombine = parseInt(savedCoins) >= 2;
      combineBtn.style.display = (canCombine || everHadCoins) ? '' : 'none';
      combineBtn.disabled = !canCombine;
      combineBtn.style.color = canCombine ? '#FFD940' : colorDarkGrey;
      combineBtn.style.backgroundColor = canCombine ? 'rgb(40 57 79)' : '#2a2a2a';
    }

    if (skipScreenSwitch) { _doShowScreen('menu_origin_screen'); } else { _showScreen('menu_origin_screen'); }
  }

  // ── Shared run card renderer ───────────────────────────────────────────────

  function _buildStats(hpMax, staMax, atk, mgkMax, def) {
    return buildStatsUI(hpMax || 0, 0, staMax || 0, 0, atk || 0, 0, mgkMax || 0, 0, def || 0);
  }

  // Builds an in-game-styled player card matching the in-game toolbar layout exactly.
  // area + sub render as one h5 line; date renders as a second dimmer h5 (matches list item style).
  // renameable=true adds a tap target on the name bar (id="menu_card_rename").
  function _buildRunCardHTML(name, level, area, stats, partyLoot, sub, date, skipLoot, renameable, showStats) {
    var html = '';

    // Outer wrapper — matches toolbar-card
    html += '<div style="padding-top:3px; padding-bottom:3px;">';

    // Name bar with level badge absolutely positioned inside (no flow hack needed)
    html += '<div class="box-border-dynamic menu-card-name" style="margin-left:3px; margin-right:3px; '
      + 'position:relative; background-color:#202020;">'
      + '<h3 style="position:absolute; top:0; bottom:0; right:10px; display:flex; align-items:center; '
        + 'z-index:3; margin:0; padding:0;">'
        + '<i style="font-weight:600; margin-top:4px; color:#FFD940; font-size:14px; '
        + '-webkit-text-stroke:3px #121212; paint-order:stroke fill;">Level&nbsp;' + level + '</i>'
      + '</h3>'
      + '<h3 ' + (renameable ? 'id="menu_card_rename" ' : '') + 'style="display:flex; align-items:center; height:28px; '
        + 'text-align:left; padding-left:8px; letter-spacing:0.8px; font-size:17px; font-weight:bold; '
        + 'margin:0; -webkit-text-stroke:5px #121212; paint-order:stroke fill;'
        + (renameable ? ' cursor:pointer; user-select:none;' : '') + '">'
      + name
      + '</h3>'
      + '</div>';

    // Area + cause + date — one bordered div, two h5 lines (matches history list style)
    var infoParts = [area && area !== '?' ? area : null, sub || null].filter(Boolean);
    if (infoParts.length || date) {
      html += '<div class="box-border-dynamic menu-card-info" style="margin-left:3px; margin-right:3px; '
        + 'padding:2px 8px; background-color:#202020;">';
      if (infoParts.length)
        html += '<h5 style="margin:4px 0 1px 0; font-size:16px; line-height:24px; font-style: normal; font-weight:400;">' + infoParts.join('<br>') + '</h5>';
      if (date)
        html += '<h5 style="margin:0px 0 4px 0; opacity:0.6; font-size:14px;">' + date + '</h5>';
      html += '</div>';
    }

    // XP bar (static, width 0)
    html += '<div style="width:0%; height:1px; background:#FFD940; '
      + 'margin-top:1px; margin-bottom:0px; margin-left:4px;">&nbsp;</div>';

    // Note: Disabled stats and party+loot display below to declutter main menu

    if (showStats) {
      html += '<div class="box-border-dynamic menu-card-stats" style="margin-left:3px; margin-right:3px; '
        + 'margin-bottom:14px; box-shadow:0px 0px 0px 3px #121212; background-color:#202020;">'
        + '<h3 style="text-align:left; padding-left:8px; font-size:14px; font-family:sans; '
        + 'height:26px; line-height:26px; margin:0; '
        + 'background-color:#202020; box-shadow:0px 0px 0px 3px #000000; position:relative; z-index:1;">'
        + (stats || '&nbsp;') + '</h3>'
        + '</div>';
    }

    // if (!skipLoot) {
    //   // Loot/party bar — matches id_player_party_loot exactly
    //   html += '<h3 style="text-align:left; text-overflow:ellipsis; overflow:hidden; '
    //     + 'white-space:nowrap; float:left; padding-top:3px; padding-bottom:3px; padding-left:8px; '
    //     + 'margin-left:3px; margin-bottom:0px; margin-top:0px; display:inline-block; width:95.8%; '
    //     + 'box-shadow:0px 0px 0px 3px #121212; background-color:#272727;">'
    //     + (partyLoot || '<span style="color:#fff;">x x x</span>') + '</h3>';
    //   // Clear float before closing wrapper
    //   html += '<div style="clear:both;"></div>';
    // }
    html += '</div>';

    return html;
  }

  // ── Session History ────────────────────────────────────────────────────────

  function _formatEndMessage(session) {
    var msg = session.deathMessage || session.causeOfDeath || '';
    if (!msg) return '';
    var isWin = session.endType && session.endType.indexOf('win') === 0;
    if (isWin)   return '<span style="color:#FFD940;">' + msg + '</span>';
    return '<span style="color:#FF0000">' + msg + '</span>';
  }

  // Rebinds the history back button label and handler.
  function _bindHistoryBack(label, fn) {
    var btn = document.getElementById('menu_history_back');
    var fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.innerHTML = label;
    fresh.addEventListener('click', fn);
  }

  // State 1: compact session list.
  function _renderHistoryList() {
    _currentDetailSession = null;
    document.getElementById('menu_history_actions').style.display = 'none';
    var _slBtn = document.getElementById('menu_history_scorelink');
    if (_slBtn) _slBtn.style.display = 'none';
    _bindHistoryBack('👈 Back', function () { _renderMain(); });

    var list = document.getElementById('menu_history_list');
    list.parentElement.style.overflowY = 'auto';
    var sessions = SaveManager.listSessionHistory();

    var _note = document.getElementById('menu_chronicles_note');
    if (_note) {
      if (sessions.length === 0) {
        _note.innerHTML = 'No journeys have been walked yet.';
      } else {
        var _wins = sessions.filter(function(s) {
          return s.endType && s.endType.indexOf('win') === 0;
        }).length;
        var _losses = sessions.length - _wins;
        _note.innerHTML = 'The journeys of the '
          + '<span style="color:#FF0000;">' + _losses + '&nbsp;Faded</span>'
          + ' and the '
          + '<span style="color:#FFD940;">' + _wins + '&nbsp;Endured</span>.';
      }
    }

    if (sessions.length === 0) {
      list.innerHTML =
        '<h4 style="color:#fff; text-align:center; min-height:0; ' +
        'padding:16px 0; margin:0;">⨯ ⨯ ⨯</h4>';
      return;
    }

    list.innerHTML = '';
    sessions.forEach(function (session) {
      var entry = document.createElement('div');
      entry.className = 'menu-history-entry';

      entry.innerHTML =
        '<div style="overflow:hidden;padding-top:3px;padding-bottom:3px;">'
          + '<div class="box-border-dynamic menu-card-name" style="margin-left:3px; margin-right:3px; '
            + 'position:relative; background-color:#202020;">'
            + '<h3 style="position:absolute; top:0; bottom:0; right:10px; display:flex; align-items:center; '
              + 'z-index:3; margin:0; padding:0;">'
              + '<i style="font-weight:600; margin-top:4px; color:#FFD940; font-size:14px; '
                + '-webkit-text-stroke:3px #121212; paint-order:stroke fill;">Level&nbsp;' + (session.level || '?') + '</i>'
            + '</h3>'
            + '<h3 style="display:flex; align-items:center; height:28px; '
              + 'text-align:left; padding-left:8px; letter-spacing:0.8px; font-size:17px; font-weight:bold; '
              + 'margin:0; -webkit-text-stroke:5px #121212; paint-order:stroke fill;">'
              + (session.playerName || 'Unknown') + '</h3>'
          + '</div>'
        + '</div>'
        + '<h5 style="margin:4px 0 1px 0; font-size:16px; font-style:normal; font-weight:400; line-height:24px;">' + (session.area || '?') + '<br>' + _formatEndMessage(session) + '</h5>'
        + '<h5 style="margin:0px 0 4px 0; opacity:0.6; font-size:14px;">'
        + (session.playerOriginEmoji ? session.playerOriginEmoji + '&nbsp;' : '')
        + (session.playerOriginName && session.playerOriginName !== 'None' ? session.playerOriginName + '&nbsp;&nbsp;•&nbsp;&nbsp;' : '')
        + (session.date || '')
        + (session.score !== undefined ? '&nbsp;&nbsp;•&nbsp;&nbsp;🎖️ ' + session.score : '') + '</h5>';

      entry.addEventListener('click', function () { menuFade(function () { _renderHistoryDetail(session); }); });
      list.appendChild(entry);
    });
  }

  // State 2: full in-game-style detail for a single session.
  function _renderHistoryDetail(session) {
    _currentDetailSession = session;
    document.getElementById('menu_history_actions').style.display = 'flex';
    _bindHistoryBack('👈 Back', function () { menuFade(_renderHistoryList); });

    var stats = _buildStats(session.playerHpMax, session.playerStaMax, session.playerAtk, session.playerMgkMax, session.playerDef);

    var partyLoot = '';
    if (session.playerPartyString && session.playerPartyString !== 'undefined') partyLoot += session.playerPartyString;
    if (session.playerLootString  && session.playerLootString  !== 'undefined') partyLoot += session.playerLootString;

    var list = document.getElementById('menu_history_list');
    var sc = list.parentElement;
    sc.style.overflowY = 'hidden';
    list.innerHTML = '';

    // Full player card
    var card = document.createElement('div');
    card.innerHTML = _buildRunCardHTML(
      session.playerName || 'Unknown',
      session.level || '?',
      session.area  || '?',
      stats, partyLoot,
      _formatEndMessage(session) || null,
      session.date || null,
      true,  // skipLoot — loot bar rendered below log
      null,  // renameable
      true   // showStats
    );
    list.appendChild(card);

    // Action log — styled like the in-game log box
    var logLines = (session.actionLog || '').split('<br>').filter(function (l) {
      return l.replace(/&nbsp;/g, '').trim();
    }).reverse();

    var logWrap = document.createElement('div');
    logWrap.style.cssText = 'margin:4px 3px 3px 3px; box-shadow:0px 0px 0px 3px #121212; background-color:#272727;';

    var logEl = document.createElement('h4');
    logEl.style.cssText = 'margin:-18px 0 0 0; padding:4px 8px; text-align:left; '
      + 'font-size:14.6px; line-height:165%; overflow-y:auto; '
      + 'scrollbar-width:thin; scrollbar-color:#000 transparent;';
    logEl.innerHTML = logLines.length ? logLines.join('<br>') : '<i style="opacity:0.5;">No log.</i>';

    logWrap.appendChild(logEl);
    list.appendChild(logWrap);

    // Combined party + loot bar — matches in-game id_player_party_loot display
    var _partyStr = String(session.playerPartyString || '').replace('undefined', '').trim();
    var _lootStr  = String(session.playerLootString  || '').replace('undefined', '').trim();
    var _partsArr = [_partyStr, _lootStr].filter(Boolean);
    var _combined = _partsArr.join('&nbsp;|&nbsp;');
    var lootBar = document.createElement('h3');
    lootBar.className = 'menu-loot-bar';
    lootBar.style.cssText = 'text-align:left; text-overflow:ellipsis; overflow:hidden; '
      + 'white-space:nowrap; float:left; padding-top:3px; padding-bottom:3px; padding-left:8px; '
      + 'margin-left:3px; margin-bottom:0px; margin-top:12px; display:inline-block; width:95.8%; '
      + 'box-shadow:0px 0px 0px 3px #121212; background-color:#272727;';
    lootBar.innerHTML = _combined || '<span style="color:#fff;">x x x</span>';
    list.appendChild(lootBar);

    var clearDiv = document.createElement('div');
    clearDiv.style.clear = 'both';
    list.appendChild(clearDiv);

    // Score + run info bar
    if (session.score !== undefined) {
      var scoreBar = document.createElement('div');
      scoreBar.className = 'menu-score-bar';
      scoreBar.style.cssText = 'margin:14px 3px 0px 3px; box-shadow:0 0 0 3px #121212; background-color:#272727; padding:6px 10px;';
      scoreBar.innerHTML =
        '<h5 style="margin:2px 0; font-size:14px; color:#FFD940;">🎖️ Valor: <b>' + session.score + '</b>'
        + (session.encounterCount ? '&nbsp;&nbsp;&nbsp;Encounters: ' + session.encounterCount : '') + '</h5>'
        + '<h5 style="margin:2px 0; font-size:12px; opacity:0.7;">'
        + (session.difficulty ? session.difficulty + '&nbsp;&nbsp;|&nbsp;&nbsp;' : '')
        + (session.playerOriginName ? 'Origin: ' + session.playerOriginName + '&nbsp;&nbsp;|&nbsp;&nbsp;' : '')
        + 'Lifetime: ' + _formatPlaytime(session.playtime || 0) + '</h5>';
      list.appendChild(scoreBar);
    }

    // Wire Copy Score Link button
    var scoreLinkBtn = document.getElementById('menu_history_scorelink');
    
    if (scoreLinkBtn) {
      if (session.ghostLink) {
        scoreLinkBtn.style.display = '';
        scoreLinkBtn.onclick = function () {
          var link = window.location.origin + window.location.pathname + '?ghost=' + session.ghostLink;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).catch(function () {});
          } else {
            var ta = document.createElement('textarea');
            ta.value = link;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          scoreLinkBtn.innerHTML = '✅ Copied!';
          setTimeout(function () { scoreLinkBtn.innerHTML = ' Link'; }, 2000);
        };
      } else {
        scoreLinkBtn.style.display = 'none';
      }
    }

    //Force-hide Score Link button (for now)
    scoreLinkBtn.style.display = 'none';

    // Size the log to fill remaining space — measured after layout so the
    // height is exact regardless of card/loot-bar size.
    requestAnimationFrame(function () {
      var logH = sc.clientHeight - card.offsetHeight - lootBar.offsetHeight - 15;
      logEl.style.height = Math.min(128, Math.max(74, logH)) + 'px';
    });

    // Session achievements unlocked by this character
    // var achIds = session.sessionAchievements;
    // if (achIds && achIds.length > 0) {
    //   var allAchs = AchievementManager.getAll();
    //   var achMap = {};
    //   allAchs.forEach(function (a) { achMap[a.id] = a; });

    //   var achLabel = document.createElement('h5');
    //   achLabel.style.cssText = 'text-align:left; padding-left:8px; margin:6px 3px 2px 3px; font-size:12px; opacity:0.55; letter-spacing:0.5px;';
    //   achLabel.innerHTML = '🧩 Memories unlocked';
    //   list.appendChild(achLabel);

    //   var achWrap = document.createElement('div');
    //   achWrap.style.cssText = 'margin:0 3px 3px 3px; background:#1a1a1a; box-shadow:0 0 0 3px #FFD940; padding:6px 8px;';
    //   var achLines = achIds.map(function (id) {
    //     var a = achMap[id];
    //     return a ? (a.emoji + '&nbsp;' + a.desc) : id;
    //   });
    //   achWrap.innerHTML = '<h5 style="margin:0; font-size:13px; font-style:normal; line-height:190%; color:#FFD940;">'
    //     + achLines.join('<br>')
    //     + '</h5>';
    //   list.appendChild(achWrap);
    // }
  }

  // ── History share / review ─────────────────────────────────────────────────

  function _stripHtml(s) {
    return (s || '').replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
  }

  // Short summary text for clipboard.
  function _buildSessionShareText(session) {
    var t = _stripHtml(session.playerName || 'Unknown') + '  •  Lvl ' + (session.level || '?');
    t += '\n❤️ ' + (session.playerHpMax || '?')
       + '  🟢 ' + (session.playerStaMax || '?')
       + '  ⚔️ ' + (session.playerAtk || '?');
    if (session.playerMgkMax > 0) t += '  🔵 ' + session.playerMgkMax;
    var partyLoot = '';
    if (session.playerPartyString && session.playerPartyString !== 'undefined') partyLoot += session.playerPartyString;
    if (session.playerLootString  && session.playerLootString  !== 'undefined') partyLoot += session.playerLootString;
    if (partyLoot) t += '\n' + _stripHtml(partyLoot);
    t += '\n' + _stripHtml(session.area || '?') + '  •  ' + _stripHtml(session.deathMessage || session.causeOfDeath || '');
    t += '\n' + (session.date || '');
    t += '\nhttps://igpenguin.github.io/stay-dead';
    return t;
  }

  // Full legend: summary header + stripped action log reversed (for .txt and Google Form).
  function _buildSessionFullText(session) {
    var header = _buildSessionShareText(session);
    var logLines = (session.actionLog || '').split('<br>').map(function (l) {
      return _stripHtml(l).trim();
    }).filter(Boolean).reverse();
    return logLines.length ? header + '\n\n' + logLines.join('\n') : header;
  }

  function _downloadText(fileName, text) {
    var a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function _shareSession() {
    if (!_currentDetailSession) { showSharePopup(); return; }
    var text = _buildSessionShareText(_currentDetailSession);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    var btn = document.getElementById('menu_history_share');
    if (btn) { var prev = btn.innerHTML; btn.innerHTML = '✅ Copied!'; setTimeout(function () { btn.innerHTML = prev; }, 2000); }
  }

  function _reviewSession() {
    if (!_currentDetailSession) return;
    openFeedbackForm(_buildSessionFullText(_currentDetailSession));
  }

  function _renderHistory() {
    _renderHistoryList();
    _showScreen('menu_history_screen');
  }

  // ── Memories ──────────────────────────────────────────────────────────────────

  function _renderMemoriesList() {
    var list = document.getElementById('menu_memories_list');
    var achievements = AchievementManager.getAll();
    var unlockedCount = 0;

    list.innerHTML = '';

    achievements.forEach(function (a) {
      var unlocked = AchievementManager.isUnlocked(a.id);
      if (unlocked) unlockedCount++;
    });

    var countEl = document.getElementById('menu_memories_count');
    if (countEl) countEl.innerHTML = 'Recalling the past reshapes the future: <b style="color:#62a862ff;">' + unlockedCount + ' / ' + achievements.length + '</b>';

    achievements.forEach(function (a) {
      var unlocked = AchievementManager.isUnlocked(a.id);
      var entry = document.createElement('div');
      entry.className = 'menu-history-entry';

      var tsLine = '<h5 style="margin:4px 0 4px 0; opacity:0.6; font-size:12px; text-align:left;">'
    + "Keep trying..."
    + '</h5>';

      if (unlocked) {
        var ts = AchievementManager.getUnlockTime(a.id);
        if (ts) {
          var d = new Date(ts);
          tsLine = '<h5 style="margin:4px 0 4px 0; opacity:0.6; font-size:12px; text-align:left;">'
            + d.toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
            + '</h5>';
        }
        var unlockLine = a.unlock
          ? '<h5 style="margin:4px 0 4px 0; font-style:normal; font-size:13px; line-height:14px; font-weight:400; color:#ffffff; text-align:left;">' + a.unlock + '</h5>'
          : '<h5 style="margin:4px 0 4px 0; opacity:0.6; font-style:normal; font-size:13px; font-weight:400; color:#CCCCCC; text-align:left;">Carved into who you are.</h5>';
        entry.innerHTML =
          '<div style="display:flex; align-items:center; gap:12px; padding:12px 0px 8px 16px; margin-bottom:-8px;">'
            + '<span style="font-size:26px; line-height:1; flex-shrink:0;">' + a.emoji + '</span>'
            + '<div><h5 style="margin:0; font-size:16px; font-style:normal; font-weight:600; color:#FFD940; text-align:left; -webkit-text-stroke: 3px #121212;paint-order: stroke fill;">' + a.desc + '</h5>' + unlockLine + tsLine + '</div>'
          + '</div>';
      } else {
        var hintText = (a.hint && a.hint.length > 0) ? a.hint : "Not discovered yet.";
        var lockedUnlockLine = '<h5 style="margin:4px 0 4px 0; font-size:13px; font-weight:400; color:#CCCCCC; text-align:left;">Something not yet remembered.</h5>';
        entry.innerHTML =
          '<div style="display:flex; align-items:center; gap:12px; padding:12px 0px 8px 16px; margin-bottom:-8px; background-color:rgb(22,22,22); opacity:0.38;">'
            + '<span style="font-size:26px; line-height:1; flex-shrink:0;">' + a.emoji + '</span>'
            + '<div><h5 style="margin:0; font-size:16px; font-weight:500; color:#CCCCCC; text-align:left; -webkit-text-stroke: 3px #121212;paint-order: stroke fill;"> ' + (hintText || '') + '</h5>' + lockedUnlockLine + tsLine + '</div>'
          + '</div>';
      }
      list.appendChild(entry);
    });
  }

  function _renderChallenges(skipFade) {
    _renderMemoriesList();
    if (skipFade) { _doShowScreen('menu_memories_screen'); }
    else          { _showScreen('menu_memories_screen'); }
  }

  // ── Credits ────────────────────────────────────────────────────────────────

  function _renderCredits() {
    _showScreen('menu_credits_screen');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _formatPlaytime(seconds) {
    seconds = parseInt(seconds, 10) || 0;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + 'm ' + s + 's';
  }

  // ── Rankings ───────────────────────────────────────────────────────────────

  function _bindRankingsBack(label, handler) {
    var btn = document.getElementById('menu_rankings_back');
    if (!btn) return;
    btn.innerHTML = label;
    btn.onclick = handler;
  }

  function _renderRankings(skipFade) {
    _bindRankingsBack('👈 Back', function () { _renderMain(); });
    if (skipFade === true) { _doShowScreen('menu_rankings_screen'); } else { _showScreen('menu_rankings_screen'); }
    var list = document.getElementById('menu_rankings_list');
    var sc = list.parentElement;
    sc.style.overflowY = 'auto';
    sc.scrollTop = 0;
    list.innerHTML = '<h4 style="text-align:center; padding:20px 0; color:#fff; min-height:0; margin:0; opacity:0.5;">Loading...</h4>';

    ScoreManager.fetchRankings(function (err, data) {
      if (err || !data) {
        list.innerHTML = '<h4 style="text-align:center; padding:20px 0; color:#ff4444; min-height:0; margin:0;">Could not load reckonings.<br><span style="opacity:0.5; font-size:13px;">Check your connection.</span></h4>';
        return;
      }
      if (!data.length) {
        list.innerHTML = '<h4 style="text-align:center; padding:20px 0; min-height:0; margin:0; opacity:0.5;">No reckonings yet.<br>Be the first!</h4>';
        return;
      }
      list.innerHTML = '';
      data.forEach(function (entry, i) {
        var el = document.createElement('div');
        el.className = 'menu-history-entry';
        var rankColor = i === 0 ? '#FFD940' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#fff';
        var rankBg    = i === 0 ? '#1e1900' : i === 1 ? '#181818' : i === 2 ? '#1c1100' : '#202020';
        var medal     = i === 0 ? '👑 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : (i + 1) + '. ';
        var _isWin = entry.endType && entry.endType.startsWith('win_');
        var _endColor = _isWin ? '#FFD940' : '#FF0000';
        var _endLabel;
        if (_isWin) {
          _endLabel = ScoreManager.getEndingLabel(entry.endType);
        } else {
          var _decodedGhost = entry.ghostLink ? ScoreManager.decodeGhostLink(entry.ghostLink) : null;
          _endLabel = (_decodedGhost && _decodedGhost.deathMessage) ? _decodedGhost.deathMessage : ScoreManager.getEndingLabel(entry.endType);
        }
        var _listGhost = entry.ghostLink ? ScoreManager.decodeGhostLink(entry.ghostLink) : null;
        var _areaLabel = (_listGhost && _listGhost.area) ? _listGhost.area : (entry.charName || '?');
        el.innerHTML =
          '<div style="overflow:hidden;padding-top:3px;padding-bottom:3px;">'
            + '<div class="box-border-dynamic menu-card-name" style="margin-left:3px; margin-right:3px; position:relative; background-color:' + rankBg + ';">'
              + '<h3 style="position:absolute; top:0; bottom:0; right:10px; display:flex; align-items:center; z-index:3; margin:0; padding:0;">'
                + '<i style="font-weight:600; margin-top:4px; color:' + rankColor + '; font-size:14px; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">'
                + '🎖️ ' + (entry.score || 0)
                + '</i></h3>'
              + '<h3 style="display:flex; align-items:center; height:28px; text-align:left; padding-left:8px; font-size:17px; font-weight:bold; margin:0; color:' + rankColor + '; -webkit-text-stroke:5px #121212; paint-order:stroke fill;">'
              + medal + (entry.nickname || entry.charName || '?') + '</h3></div></div>'
            + '<h5 style="margin:4px 0 1px 0; font-size:16px; font-style:normal; font-weight:400; line-height:24px;">'
            + _areaLabel + '&nbsp;•&nbsp;Lvl&nbsp;' + (entry.level || '?') + '<br>'
            + '<span style="color:' + _endColor + ';">' + _endLabel + '</span></h5>'
            + '<h5 style="margin:0px 0 4px 0; opacity:0.6; font-size:14px;">'
            + (entry.charName ? entry.charName + '&nbsp;&nbsp;•&nbsp;&nbsp;' : '')
            + ((_listGhost && _listGhost.originEmoji) ? _listGhost.originEmoji + '&nbsp;' : '')
            + (entry.origin ? entry.origin + '&nbsp;&nbsp;•&nbsp;&nbsp;' : '')
            + (entry.datetime ? entry.datetime.slice(0, 10) : '')
            + '</h5>';

        if (entry.ghostLink) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', (function (rankIdx) { return function () {
            var ghost = ScoreManager.decodeGhostLink(entry.ghostLink);
            if (ghost) menuFade(function () { _renderViewGhost(ghost, rankIdx); });
          }; })(i));
        }
        list.appendChild(el);
      });
    });
  }

  function _renderViewGhost(ghost, rankIdx) {
    _bindRankingsBack('👈 Back', function () { menuFade(function () { _renderRankings(true); }); });
    var list = document.getElementById('menu_rankings_list');
    var sc = list.parentElement;
    sc.style.overflowY = 'hidden';
    list.innerHTML = '';

    var _statParts = (ghost.stats || '').split(';');
    var _ghostStats = _buildStats(parseInt(_statParts[0]) || 0, parseInt(_statParts[2]) || 0, parseInt(_statParts[1]) || 0, parseInt(_statParts[5]) || 0, parseInt(_statParts[6]) || 0);
    var partyLoot = String(ghost.inventory || '');
    rankIdx = (rankIdx !== undefined && rankIdx !== null) ? rankIdx : -1;
    var rankColor = rankIdx === 0 ? '#FFD940' : rankIdx === 1 ? '#c0c0c0' : rankIdx === 2 ? '#cd7f32' : '#fff';
    var rankBg    = rankIdx === 0 ? '#1e1900' : rankIdx === 1 ? '#181818' : rankIdx === 2 ? '#1c1100' : '#202020';
    var medal     = rankIdx === 0 ? '👑 ' : rankIdx === 1 ? '🥈 ' : rankIdx === 2 ? '🥉 ' : rankIdx >= 0 ? (rankIdx + 1) + '. ' : '';

    var card = document.createElement('div');
    var displayDiff = ghost.difficulty || 'Standard';
    if (DIFFICULTY_MODES[displayDiff]) displayDiff = DIFFICULTY_MODES[displayDiff].displayName;
    else if (displayDiff === 'Standard') displayDiff = '💔 Rough';
    else if (displayDiff === 'Easy')     displayDiff = '🕯️ Story';
    else if (displayDiff === 'Hardcore') displayDiff = '☠️ Fatal';

    var _ghostIsWin = ghost.endType && ghost.endType.startsWith('win_');
    var _ghostEndMsg = (!_ghostIsWin && ghost.deathMessage) ? ghost.deathMessage : ScoreManager.getEndingLabel(ghost.endType);
    var _ghostEndColor = _ghostIsWin ? '#FFD940' : '#FF0000';
    var _ghostSub = '<span style="color:' + _ghostEndColor + ';">' + _ghostEndMsg + '</span>';

    var _ghostAreaSlot = (ghost.area && ghost.area !== '?') ? ghost.area : (displayDiff + ' · ' + (ghost.encounterCount || 0) + ' encounters');
    card.innerHTML =
      '<div style="overflow:hidden;padding-top:3px;padding-bottom:3px;">'
        + '<div class="box-border-dynamic menu-card-name" style="margin-left:3px; margin-right:3px; position:relative; background-color:' + rankBg + ';">'
          + '<h3 style="position:absolute; top:0; bottom:0; right:10px; display:flex; align-items:center; z-index:3; margin:0; padding:0;">'
            + '<i style="font-weight:600; margin-top:4px; color:' + rankColor + '; font-size:14px; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">🎖️ ' + (ghost.score || 0) + '</i>'
          + '</h3>'
          + '<h3 style="display:flex; align-items:center; height:28px; text-align:left; padding-left:8px; font-size:17px; font-weight:bold; margin:0; color:' + rankColor + '; -webkit-text-stroke:5px #121212; paint-order:stroke fill;">'
          + medal + (ghost.nickname || ghost.charName || '?') + '</h3>'
        + '</div>'
      + '</div>'
      + '<div class="box-border-dynamic menu-card-info" style="margin-top:-3px;margin-left:3px; margin-right:3px; padding:2px 8px; background-color:#202020;">'
        + '<h5 style="margin:4px 0 1px 0; font-size:16px; font-style:normal; font-weight:400; line-height:24px;">'
        + _ghostAreaSlot + '&nbsp;•&nbsp;Lvl&nbsp;' + (ghost.level || '?') + '<br>'
        + _ghostSub + '</h5>'
        + '<h5 style="margin:0px 0 4px 0; opacity:0.6; font-size:14px;">'
        + (ghost.charName ? ghost.charName + '&nbsp;&nbsp;•&nbsp;&nbsp;' : '')
        + (ghost.originEmoji ? ghost.originEmoji + '&nbsp;' : '')
        + (ghost.origin ? ghost.origin + '&nbsp;&nbsp;•&nbsp;&nbsp;' : '')
        + (ghost.datetime ? ghost.datetime.slice(0, 10) : '')
        + '</h5>'
      + '</div>'
      + '<div class="box-border-dynamic menu-card-stats" style="margin-top:3px;margin-left:3px; margin-right:3px; margin-bottom:14px; box-shadow:0px 0px 0px 3px #121212; background-color:#202020;">'
        + '<h3 style="text-align:left; padding-left:8px; font-size:14px; font-family:sans; height:26px; line-height:26px; margin:0; background-color:#202020; box-shadow:0px 0px 0px 3px #000000; position:relative; z-index:1;">'
        + (_ghostStats || '&nbsp;') + '</h3>'
      + '</div>';
    list.appendChild(card);

    // Combined party + loot bar — matches in-game id_player_party_loot display
    var _ghostParty = String(ghost.companionString || '').trim();
    var _ghostLoot  = partyLoot.trim();
    var _ghostCombined = [_ghostParty, _ghostLoot].filter(Boolean).join('&nbsp;|&nbsp;');
    var lootBar = document.createElement('h3');
    lootBar.className = 'menu-loot-bar';
    lootBar.style.cssText = 'text-align:left; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; float:left; padding-top:3px; padding-bottom:3px; padding-left:8px; margin-left:3px; margin-bottom:0; margin-top:2px; display:inline-block; width:95.8%; box-shadow:0 0 0 3px #121212; background-color:#272727;';
    lootBar.innerHTML = _ghostCombined || '<span style="color:#fff;">x x x</span>';
    list.appendChild(lootBar);
    var clearDiv = document.createElement('div');
    clearDiv.style.clear = 'both';
    list.appendChild(clearDiv);

    var infoEl = document.createElement('div');
    infoEl.className = 'menu-score-bar';
    infoEl.style.cssText = 'margin:14px 3px 3px 3px; box-shadow:0 0 0 3px #121212; background-color:#272727; padding:6px 10px;';
    infoEl.innerHTML =
      '<h5 style="margin:2px 0; font-size:14px; color:#FFD940;">🎖️ Valor: <b>' + (ghost.score || 0) + '</b>'
      + (ghost.encounterCount ? '&nbsp;&nbsp;&nbsp;Encounters: ' + ghost.encounterCount : '') + '</h5>'
      + '<h5 style="margin:2px 0; font-size:12px; opacity:0.7;">'
      + (ghost.difficulty ? ghost.difficulty + '&nbsp;&nbsp;|&nbsp;&nbsp;' : '')
      + (ghost.origin ? 'Origin: ' + ghost.origin + '&nbsp;&nbsp;|&nbsp;&nbsp;' : '')
      + 'Lifetime: ' + _formatPlaytime(ghost.playtime || 0) + '</h5>'
      + '<h5 style="margin:2px 0; font-size:12px; opacity:0.5;">' + (ghost.gameVersion || '') + '</h5>';
    list.appendChild(infoEl);

    requestAnimationFrame(function () {
      var logH = sc.clientHeight - card.offsetHeight - lootBar.offsetHeight - infoEl.offsetHeight - 20;
      logH; // ghost view has no log — layout only
    });
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  var _DIFF_FLAVOR = {
    Easy:     'The world is warmer than usual.',
    Standard: 'The intended satisfying struggle.',
    Hardcore: 'No mercy, death is always fatal.'
  };

  function _applyStoredDifficulty() {
    var saved = null;
    try { saved = localStorage.getItem('sd_difficulty'); } catch (e) {}
    if (!saved || !DIFFICULTY_MODES[saved]) return;
    if (saved === 'Standard') { GAME_CONFIG = DIFFICULTY_MODES.Standard; return; }
    var isLocal = isLocalhost();
    if (!DIFFICULTY_PICKER_ENABLED && !isLocal) return;
    if (saved === 'Easy') {
      GAME_CONFIG = DIFFICULTY_MODES.Easy;
    } else if (saved === 'Hardcore' && AchievementManager.isUnlocked('game_win_first')) {
      GAME_CONFIG = DIFFICULTY_MODES.Hardcore;
    }
  }

  function _setDifficulty(key) {
    if (!DIFFICULTY_MODES[key]) return;
    GAME_CONFIG = DIFFICULTY_MODES[key];
    try { localStorage.setItem('sd_difficulty', key); } catch (e) {}
  }

  // pendingKey: when set, a mid-run difficulty confirmation is being shown.
  function _renderSettings(pendingKey) {
    var isLocal = isLocalhost();
    var _pickerOverride = false;
    try { _pickerOverride = localStorage.getItem('sd_picker_override') === 'true'; } catch (e) {}
    var pickerEnabled = (typeof DIFFICULTY_PICKER_ENABLED !== 'undefined' && DIFFICULTY_PICKER_ENABLED) || isLocal || _pickerOverride;
    var hasWon = AchievementManager.isUnlocked('game_win_first');
    var currentDiffLabel = (typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG.label : 'Standard');
    var currentNickname = ScoreManager.getNickname() || '';
    var isVibOn = (typeof vibrationEnabled !== 'undefined' ? vibrationEnabled : true);
    var hasRun = SaveManager.hasContinue();

    var content = document.getElementById('menu_settings_content');
    content.innerHTML = '';

    var SECTION_LABEL = 'font-size:15px; font-weight:600; letter-spacing:0.6px;'
      + ' -webkit-text-stroke:4px #121212; paint-order:stroke fill;'
      + ' text-align:center; margin:0 0 10px 0; color:#fff;';
    var SEG_TEXT = 'font-size:15px; font-weight:600; letter-spacing:0.4px;'
      + ' -webkit-text-stroke:3px #121212; paint-order:stroke fill;';

    // ── Nickname ────────────────────────────────────────────────────────────
    var nickSection = document.createElement('div');
    nickSection.style.cssText = 'margin:10px 3px 0 3px; padding:10px 10px 12px 10px; background:#1a1a1a; box-shadow:0 0 0 3px #000;';

    var nickLabel = document.createElement('h5');
    nickLabel.style.cssText = SECTION_LABEL;
    nickLabel.textContent = 'Reckonings Nickname';
    nickSection.appendChild(nickLabel);

    var nickInput = document.createElement('input');
    nickInput.type = 'text';
    nickInput.maxLength = 32;
    nickInput.placeholder = 'Your Nickname (3+ chars)';
    nickInput.value = currentNickname;
    nickInput.style.cssText = 'width:100%; box-sizing:border-box; font-size:16px; padding:8px 10px; background:#2a2a2a; border:none; outline:2px solid #444; color:#fff; font-family:inherit;';
    nickInput.addEventListener('blur', function () {
      var val = nickInput.value.trim();
      if (val.length >= 3) ScoreManager.setNickname(val);
    });
    nickSection.appendChild(nickInput);
    content.appendChild(nickSection);

    // ── Difficulty ──────────────────────────────────────────────────────────
    var diffSection = document.createElement('div');
    diffSection.style.cssText = 'margin:10px 3px 0 3px; padding:10px 10px 12px 10px; background:#1a1a1a; box-shadow:0 0 0 3px #000;';

    var diffLabel = document.createElement('h5');
    diffLabel.style.cssText = SECTION_LABEL;
    diffLabel.textContent = 'Journey Difficulty';
    diffSection.appendChild(diffLabel);

    var segRow = document.createElement('div');
    segRow.style.cssText = 'display:flex; gap:8px; line-height:16px;';

    var diffOptions = [
      { key: 'Easy',     locked: !pickerEnabled,           lockHint: '🔒 Coming soon' },
      { key: 'Standard', locked: false,                     lockHint: '' },
      { key: 'Hardcore', locked: !pickerEnabled || !hasWon,
                         lockHint: pickerEnabled ? '🔒 Finish a run first' : '🔒 Coming soon' }
    ];

    diffOptions.forEach(function (d) {
      var isActive = d.key === currentDiffLabel;
      var btn = document.createElement('div');
      btn.style.cssText = 'flex:1; padding:9px 4px; text-align:center;'
        + ' box-shadow:0 0 0 2px ' + (isActive ? '#FFD940' : '#333') + ';'
        + ' background:' + (isActive ? '#2a2500' : '#252525') + ';'
        + ' opacity:' + (d.locked ? '0.35' : '1') + ';'
        + ' cursor:' + (d.locked ? 'default' : 'pointer') + '; user-select:none;';
      var btnLabel = (d.locked ? '🔒 Locked' : DIFFICULTY_MODES[d.key].displayName);
      btn.innerHTML = '<div style="' + SEG_TEXT + ' color:' + (isActive ? '#FFD940' : '#fff') + ';">' + btnLabel + '</div>';

      if (!d.locked) {
        btn.setAttribute('tabindex', '0');
        btn.addEventListener('click', function () {
          if (d.key === currentDiffLabel) return;
          if (hasRun) {
            _renderSettings(d.key);
          } else {
            _setDifficulty(d.key);
            _renderSettings();
          }
        });
      }
      segRow.appendChild(btn);
    });

    diffSection.appendChild(segRow);

    // Inline mid-run confirmation
    if (pendingKey) {
      var warnEl = document.createElement('div');
      warnEl.style.cssText = 'margin-top:10px; padding:8px 10px; background:#2a1010; box-shadow:0 0 0 2px #cc3333;';
      warnEl.innerHTML = '<h5 style="margin:0 0 8px 0; font-size:14px; color:#ff6666; font-style:normal; font-weight:500; -webkit-text-stroke:3px #121212; paint-order:stroke fill; text-align:center;">⚠️ Changing this will end your current run!</h5>'
        + '<div style="display:flex; gap:8px;">'
        + '<div id="settings_diff_cancel" tabindex="0" style="flex:1; padding:8px 4px; text-align:center; background:#252525; box-shadow:0 0 0 2px #444; cursor:pointer; user-select:none;">'
        +   '<span style="font-size:14px; font-weight:600; color:#fff; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">Cancel</span>'
        + '</div>'
        + '<div id="settings_diff_confirm" tabindex="0" style="flex:1; padding:8px 4px; text-align:center; background:#3a1010; box-shadow:0 0 0 2px #cc3333; cursor:pointer; user-select:none;">'
        +   '<span style="font-size:14px; font-weight:600; color:red; -webkit-text-stroke:3px #121212; paint-order:stroke fill;">✕ Confirm</span>'
        + '</div>'
        + '</div>';
      diffSection.appendChild(warnEl);

      setTimeout(function () {
        var confirmBtn = document.getElementById('settings_diff_confirm');
        var cancelBtn  = document.getElementById('settings_diff_cancel');
        if (confirmBtn) confirmBtn.addEventListener('click', function () {
          SaveManager.abandonCurrentRun();
          _setDifficulty(pendingKey);
          _renderSettings();
        });
        if (cancelBtn) cancelBtn.addEventListener('click', function () { _renderSettings(); });
      }, 0);
    } else {
      var flavorEl = document.createElement('h5');
      flavorEl.style.cssText = 'margin:10px 0 0 0; font-size:14px; font-style:italic; opacity:0.6; text-align:center;';
      flavorEl.textContent = _DIFF_FLAVOR[currentDiffLabel] || '';
      diffSection.appendChild(flavorEl);
    }

    content.appendChild(diffSection);

    // ── Font Type ────────────────────────────────────────────────────────
    if (false) { //HACK: Disable font picker altogether
      var fontSection = document.createElement('div');
      fontSection.style.cssText = 'margin:10px 3px 6px 3px; padding:10px 10px 12px 10px; background:#1a1a1a; box-shadow:0 0 0 3px #000;';

      var fontLabel = document.createElement('h5');
      fontLabel.style.cssText = SECTION_LABEL;
      fontLabel.textContent = 'Font Type';
      fontSection.appendChild(fontLabel);

      var fontRow = document.createElement('div');
      fontRow.style.cssText = 'display:flex; gap:8px;';

      ['Gelasio', 'Pixel', 'Native'].forEach(function (f) {
        var isActive = (f === fontPreference);
        var btn = document.createElement('div');
        btn.setAttribute('tabindex', '0');
        btn.style.cssText = 'flex:1; padding:9px 4px; text-align:center; cursor:pointer; user-select:none; line-height:16px;'
          + ' box-shadow:0 0 0 2px ' + (isActive ? '#FFD940' : '#333') + ';'
          + ' background:' + (isActive ? '#2a2500' : '#252525') + ';';
        btn.innerHTML = '<div style="' + SEG_TEXT + ' color:' + (isActive ? '#FFD940' : '#fff') + ';">' + f + '</div>';
        btn.addEventListener('click', function () {
          fontPreference = f;
          try { localStorage.setItem('sd_font_pref', f); } catch (e) {}
          applyFontPreference();
          _renderSettings(pendingKey);
        });
        fontRow.appendChild(btn);
      });

      fontSection.appendChild(fontRow);
      content.appendChild(fontSection);
    }

    // ── Vibration (Android only) ───────────────────────────────────────────
    if (getPlatform() === 'android') {
      var vibSection = document.createElement('div');
      vibSection.style.cssText = 'margin:10px 3px 6px 3px; padding:10px 10px 12px 10px; background:#1a1a1a; box-shadow:0 0 0 3px #000;';

      var vibLabel = document.createElement('h5');
      vibLabel.style.cssText = SECTION_LABEL;
      vibLabel.textContent = 'Vibration';
      vibSection.appendChild(vibLabel);

      var vibRow = document.createElement('div');
      vibRow.style.cssText = 'display:flex; gap:8px;';

      ['Off', 'On'].forEach(function (v) {
        var isActive = (v === 'On') === isVibOn;
        var btn = document.createElement('div');
        btn.setAttribute('tabindex', '0');
        btn.style.cssText = 'flex:1; padding:9px 4px; text-align:center; cursor:pointer; user-select:none;'
          + ' box-shadow:0 0 0 2px ' + (isActive ? '#FFD940' : '#333') + ';'
          + ' background:' + (isActive ? '#2a2500' : '#252525') + ';';
        btn.innerHTML = '<div style="' + SEG_TEXT + ' color:' + (isActive ? '#FFD940' : '#fff') + ';">' + v + '</div>';
        btn.addEventListener('click', function () {
          var newVal = (v === 'On');
          vibrationEnabled = newVal;
          try { localStorage.setItem('sd_vibration', newVal ? 'true' : 'false'); } catch (e) {}
          _renderSettings(pendingKey);
        });
        vibRow.appendChild(btn);
      });

      vibSection.appendChild(vibRow);
      content.appendChild(vibSection);
    }

    _doShowScreen('menu_settings_screen');
  }

  // ── Version changelog ──────────────────────────────────────────────────────

  function _fetchAndShowChangelog() {
    fetch('docs/VERSION.md')
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (text) {
        var lines = text.split('\n');
        var inSection = false;
        var items = [];
        for (var i = 0; i < lines.length; i++) {
          var trimmed = lines[i].trim();
          if (trimmed === '## ' + versionCode) { inSection = true; continue; }
          if (inSection) {
            if (trimmed.startsWith('## ')) break;
            if (trimmed) items.push(trimmed);
          }
        }
        _showChangelog(items.length > 0 ? items : ['💭 No changelog details provided.']);
      })
      .catch(function () { _markVersionSeen(); });
  }

  function _checkVersionChangelog() {
    if (_changelogShownThisSession) return;
    var lastSeen = null;
    try { lastSeen = localStorage.getItem('sd_last_seen_version'); } catch (e) {}
    if (lastSeen === versionCode) return;

    _changelogShownThisSession = true;
    _fetchAndShowChangelog();
  }

  function _markVersionSeen() {
    try { localStorage.setItem('sd_last_seen_version', versionCode); } catch (e) {}
  }

  function _showChangelog(items) {
    var overlay = document.getElementById('changelog_overlay');
    if (!overlay) { _markVersionSeen(); return; }
    var versionEl = document.getElementById('changelog_version');
    if (versionEl) versionEl.textContent = versionCode;
    var listEl = document.getElementById('changelog_list');
    if (listEl) {
      listEl.innerHTML = items.map(function (item) {
        return '<h5 style="margin:0; padding:2px 0 0 4px; font-size:14px; font-style:normal; font-weight:400; text-align:left; line-height:150%; color:#fff;">' + item + '</h5>';
      }).join('');
    }
    overlay.style.display = 'flex';
  }

  function _showVersionHistory() {
    var overlay = document.getElementById('version_history_overlay');
    var listEl  = document.getElementById('version_history_list');
    if (!overlay || !listEl) return;
    listEl.innerHTML = '<h5 style="margin:0; padding:2px 4px; opacity:0.5; font-size:12px; font-weight:400; color:#fff;">Loading…</h5>';
    overlay.style.display = 'flex';
    fetch('docs/VERSION.md')
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (text) {
        var lines = text.split('\n');
        var html = '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line) continue;
          if (line.startsWith('## ')) {
            html += '<h5 style="margin:' + (i === 0 ? '0' : '10px') + ' 0 2px 0; padding:2px 8px 2px 8px; font-size:13px; font-weight:700; color:#FFD940; font-style:normal; border-bottom:1px solid #444; text-align:left;">' + line.slice(3) + '</h5>';
          } else if (line === '---') {
            html += '<hr style="border:none; border-top:1px solid #333; margin:4px 0;">';
          } else {
            html += '<h5 style="margin:0; padding:1px 8px 1px 8px; font-size:13px; font-weight:400; font-style:normal; line-height:150%; color:#fff; text-align:left;">' + line + '</h5>';
          }
        }
        listEl.innerHTML = html || '<h5 style="margin:0; padding:2px 4px; opacity:0.5; font-size:12px; font-weight:400; color:#fff;">No history found.</h5>';
      })
      .catch(function () {
        listEl.innerHTML = '<h5 style="margin:0; padding:2px 4px; opacity:0.5; font-size:12px; font-weight:400; color:#fff;">Could not load version history.</h5>';
      });
  }

  // ── Button wiring ──────────────────────────────────────────────────────────

  function _bindButtons() {
    document.getElementById('menu_new_game').addEventListener('click', function () {
      var _saved = SaveManager.loadGameState();
      if (SaveManager.hasContinue() && !(_saved && _saved.playerWonThisRun)) {
        _renderConfirm();
      } else if (AchievementManager.isUnlocked('boss_kill_first')) {
        _renderOriginPicker();
      } else {
        _doNewGame(null);
      }
    });

    document.getElementById('menu_confirm_yes').addEventListener('click', function () {
      SaveManager.abandonCurrentRun();
      if (AchievementManager.isUnlocked('boss_kill_first')) {
        _renderOriginPicker();
      } else {
        _doNewGame(null);
      }
    });

    document.getElementById('menu_confirm_cancel').addEventListener('click', function () { _renderMain(); });

    document.getElementById('menu_origin_begin').addEventListener('click', function () {
      if (_selectedOrigin) _doNewGame(_selectedOrigin);
    });

    document.getElementById('menu_origin_reroll').addEventListener('click', function () {
      if (parseInt(savedCoins) < 1) return;
      savedCoins--;
      localStorage.setItem('coins', parseInt(savedCoins));
      var debt = parseInt(localStorage.getItem('transmuteDebt') || '0');
      localStorage.setItem('transmuteDebt', debt + 1);
      AchievementManager.check('meditate');
      var prevBestTier = (function () {
        var TIER_ORDER = ['Cursed', 'Common', 'Uncommon', 'Rare', 'Legendary'];
        try {
          var stored = JSON.parse(localStorage.getItem('originRoll') || 'null');
          if (Array.isArray(stored) && stored.length > 0) {
            var best = 0;
            stored.forEach(function (o) {
              var idx = TIER_ORDER.indexOf(o.tier || _originTier(o));
              if (idx > best) best = idx;
            });
            return TIER_ORDER[best];
          }
        } catch (e) {}
        return null;
      })();
      try { localStorage.removeItem('originRoll'); } catch(e) {}
      menuFade(function () {
        _selectedOrigin = null;
        _renderOriginPicker(true, prevBestTier);
      }, '<p style="color:#2cc176;letter-spacing:1.5px;font-size:28px;-webkit-text-stroke:4px #121212;paint-order:stroke fill;">Shuffling new Origins...</p>', 1000, '0.6s');
    });

    document.getElementById('menu_origin_combine').addEventListener('click', function () {
      if (parseInt(savedCoins) < 2) return;
      var currentRoll;
      try { currentRoll = JSON.parse(localStorage.getItem('originRoll') || 'null'); } catch(e) {}
      if (!Array.isArray(currentRoll) || currentRoll.length < 2) return;
      savedCoins -= 2;
      localStorage.setItem('coins', parseInt(savedCoins));
      var debt = parseInt(localStorage.getItem('transmuteDebt') || '0');
      localStorage.setItem('transmuteDebt', debt + 2);
      AchievementManager.check('combine');
      var idxPool = [];
      for (var ci = 0; ci < currentRoll.length; ci++) idxPool.push(ci);
      var idxA = idxPool.splice(Math.floor(Math.random() * idxPool.length), 1)[0];
      var idxB = idxPool.splice(Math.floor(Math.random() * idxPool.length), 1)[0];
      var idxC = idxPool.length > 0 ? idxPool[0] : undefined;
      var originA = currentRoll[idxA];
      var originB = currentRoll[idxB];
      var surviving = idxC !== undefined ? currentRoll[idxC] : null;
      var cards = document.querySelectorAll('#menu_origin_list .menu-history-entry');
      var sortedRoll = currentRoll.slice().sort(function(a, b) {
        var aLeg = _originTier(a) === 'Legendary' ? 1 : 0;
        var bLeg = _originTier(b) === 'Legendary' ? 1 : 0;
        if (bLeg !== aLeg) return bLeg - aLeg;
        var aHas = _hasAnyStats(a) ? 1 : 0;
        var bHas = _hasAnyStats(b) ? 1 : 0;
        if (bHas !== aHas) return bHas - aHas;
        return _originNet(b) - _originNet(a);
      });
      var domIdxA = -1, domIdxB = -1;
      for (var si = 0; si < sortedRoll.length; si++) {
        if (sortedRoll[si].originName === originA.originName) domIdxA = si;
        if (sortedRoll[si].originName === originB.originName) domIdxB = si;
      }
      var cardA = domIdxA >= 0 ? cards[domIdxA] : null;
      var cardB = domIdxB >= 0 ? cards[domIdxB] : null;
      var goldFrames = [
        { boxShadow: 'inset 0 0 0 1000px rgba(255,217,64,0)' },
        { boxShadow: 'inset 0 0 0 1000px rgba(255,217,64,0.55)' },
        { boxShadow: 'inset 0 0 0 1000px rgba(255,217,64,0)' },
        { boxShadow: 'inset 0 0 0 1000px rgba(255,217,64,0.55)' },
        { boxShadow: 'inset 0 0 0 1000px rgba(255,217,64,0)' }
      ];
      var animOpts = { duration: 1120, easing: 'ease-in-out' };
      function _afterFlash() {
        var combo = _buildComboOrigin(originA, originB);
        var excludeNames = [originA.originName, originB.originName];
        if (surviving) excludeNames.push(surviving.originName);
        var fill = _pickOneOrigin(excludeNames);
        var newRoll = [];
        if (surviving) newRoll.push(surviving);
        newRoll.push(combo);
        if (fill) newRoll.push(fill);
        try { localStorage.setItem('originRoll', JSON.stringify(newRoll)); } catch(e) {}
        menuFade(function () {
          _selectedOrigin = null;
          _renderOriginPicker(true);
        }, '<p style="color:#FFD940;letter-spacing:1.5px;font-size:28px;-webkit-text-stroke:4px #121212;paint-order:stroke fill;">Fusing Origin fates...</p>', 900, '0.6s');
      }
      if (cardA) cardA.animate(goldFrames, animOpts);
      if (cardB) {
        cardB.animate(goldFrames, animOpts).onfinish = _afterFlash;
      } else {
        setTimeout(_afterFlash, 1120);
      }
    });

    document.getElementById('menu_origin_cancel').addEventListener('click', function () {
      _selectedOrigin = null;
      _renderMain();
    });

    document.getElementById('menu_continue').addEventListener('click', function () {
      AchievementManager.resetSession();
      startGame(true);
    });

    document.getElementById('menu_history_share').addEventListener('click', _shareSession);
    document.getElementById('menu_history_review').addEventListener('click', _reviewSession);

    document.getElementById('menu_memories_back').addEventListener('click', function () { _renderMain(); });
    document.getElementById('menu_challenges').addEventListener('click', function () { _renderChallenges(); });
    document.getElementById('menu_history').addEventListener('click', _renderHistory);
    document.getElementById('menu_credits').addEventListener('click', _renderCredits);
    document.getElementById('menu_leaderboard').addEventListener('click', _renderRankings);
    document.getElementById('menu_leaderboard').style.color = '';
    document.getElementById('menu_report_bug').addEventListener('click', function () {
      window.open('https://github.com/IGPenguin/stay-dead/issues/new', '_blank');
    });
    document.getElementById('menu_contribute').addEventListener('click', function () {
      window.open('https://github.com/IGPenguin/stay-dead', '_blank');
    });
    document.getElementById('menu_codex').addEventListener('click', function () {
      window.open('https://github.com/IGPenguin/stay-dead/blob/live/docs/WIKI.md', '_blank');
    });
    document.getElementById('menu_credits_donate').addEventListener('click', function () { showDonatePopup(); });
    document.getElementById('menu_credits_contact').addEventListener('click', function () { visitLinkedIn(); });
    document.getElementById('menu_credits_share').addEventListener('click', function () {
      showSharePopup();
    });
    document.getElementById('menu_credits_review').addEventListener('click', function () { redirectToFeedback(); });
    document.getElementById('menu_credits_back').addEventListener('click', function () { _renderMain(); });

    document.getElementById('menu_settings').addEventListener('click', function () {
      menuFade(function () { _renderSettings(); });
    });
    document.getElementById('menu_version_history').addEventListener('click', _showVersionHistory);
    document.getElementById('version_history_dismiss').addEventListener('click', function () {
      document.getElementById('version_history_overlay').style.display = 'none';
    });
    document.getElementById('menu_settings_back').addEventListener('click', function () { _renderMain(); });

    document.getElementById('changelog_dismiss').addEventListener('click', function () {
      _markVersionSeen();
      document.getElementById('changelog_overlay').style.display = 'none';
    });

    ['version_warpper', 'version_warpper_menu'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', function () { _fetchAndShowChangelog(); });
    });

    holdToConfirm(document.getElementById('menu_settings_purge_1'), 3, function () {
      document.getElementById('menu_settings_purge_1').style.display = 'none';
      document.getElementById('menu_settings_purge_2').style.display = 'flex';
    });
    document.getElementById('menu_settings_purge_cancel').addEventListener('click', function () {
      document.getElementById('menu_settings_purge_2').style.display = 'none';
      document.getElementById('menu_settings_purge_1').style.display = '';
    });
    document.getElementById('menu_settings_purge_confirm').addEventListener('click', function () {
      SaveManager.purgeAll();
      location.reload();
    });
  }

  // ── Public init ────────────────────────────────────────────────────────────

  function init() {
    _applyStoredDifficulty();
    applyFontPreference();
    document.getElementById('menu_version').innerHTML = versionCode;
    _bindButtons();
    show();
  }

  function showMemories() {
    document.getElementById('id_menu').style.display = 'flex';
    document.getElementById('id_game').style.display = 'none';
    _renderChallenges(true);
    _animateLogo();
  }

  return { init: init, show: show, hide: hide, showMemories: showMemories, rollOrigins: _rollOrigins,
           getCurrentScreen: getCurrentScreen };
})();
