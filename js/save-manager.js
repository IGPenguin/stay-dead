var SaveManager = (function () {
  var HISTORY_KEY  = 'sessionHistory';
  var STATE_KEY    = 'gameState';
  // ── Session history ────────────────────────────────────────────────────────

  function saveSession(session) {
    if (typeof TelemetryManager !== 'undefined') {
      TelemetryManager.send('run_end', (session.causeOfDeath || '') + '|' + (session.endType || session.outcome || ''));
    }
    var history = listSessionHistory();
    history.unshift(session);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('SaveManager: history write failed', e);
    }
  }

  function listSessionHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var sessions = raw ? JSON.parse(raw) : [];
      sessions.forEach(function (s, i) { s._rawIdx = i; });
      sessions.sort(function (a, b) {
        if (a.runEndTimestamp && b.runEndTimestamp) return b.runEndTimestamp - a.runEndTimestamp;
        if (a.runEndTimestamp) return -1;
        if (b.runEndTimestamp) return 1;
        return a._rawIdx - b._rawIdx;
      });
      sessions.forEach(function (s) { delete s._rawIdx; });
      return sessions;
    } catch (e) { return []; }
  }

  // ── Mid-run game state ─────────────────────────────────────────────────────
  // Called from redraw() after every action. Snapshots all runtime globals
  // that are not re-derivable from the CSV files on the next page load.
  // linesGenerator / linesLoot are rebuilt from encounters.csv — not saved.

  function saveGameState() {
    if (typeof linesStory === 'undefined' || !linesStory || !linesStory.length) return;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        // ── Player ──────────────────────────────────────────────────────────
        playerName:         playerName,
        playerNumber:       playerNumber,
        playerKills:        playerKills,
        playerLootString:   String(playerLootString),
        playerPartyString:  String(playerPartyString),
        petName:            petName,
        followerName:       followerName,
        playerSlotHead:     playerSlotHead,
        playerSlotWeapon:   playerSlotWeapon,
        playerSlotChest:    playerSlotChest,
        playerSlotLegs:     playerSlotLegs,
        playerSlotTrinket:  playerSlotTrinket,
        playerInventory:    playerInventory,
        playerHpMax:        playerHpMax,   playerStaMax:      playerStaMax,
        playerMgkMax:       playerMgkMax,
        playerHp:           playerHp,      playerSta:         playerSta,
        playerLck:          playerLck,     playerInt:         playerInt,
        playerAtk:          playerAtk,     playerAtkBonus:    playerAtkBonus,
        playerDef:          playerDef,     playerMgk:         playerMgk,
        playerXP:           playerXP,      playerLevel:       playerLevel,
        playerXPThreshold:  playerXPThreshold,
        playerLove:         playerLove,    playerKarma:       playerKarma,
        playerRested:       playerRested,  playerCooked:      playerCooked,
        playerShopped:      playerShopped, playerDestined:    playerDestined, playerEmoji: playerEmoji,
        bubblesUsed:        bubblesUsed,
        playerAttackType:   playerAttackType, playerRollType: playerRollType,
        playerBlockType:    playerBlockType,  playerSleepType: playerSleepType,
        playerSpeakType:    playerSpeakType,  playerCastType: playerCastType,
        playerHealType:     playerHealType,   playerCurseType: playerCurseType,
        savedCoins:         savedCoins,    spentCoins:        spentCoins,
        // ── Progression / logging ────────────────────────────────────────────
        adventureStartTime:    adventureStartTime,
        adventureLog:          adventureLog,
        adventureEncounterCount: adventureEncounterCount,
        encounterCount:        encounterCount,
        scoreBaselineStats:    scoreBaselineStats,
        runStartTimestamp:     runStartTimestamp,
        // Banked active-play time only. playtimeSegmentStart is deliberately NOT saved —
        // it is re-anchored on restore so the gap between sessions never counts as playtime.
        playtimeBankedMs:      getActivePlaytimeMs(),
        playerRevivesThisRun:  playerRevivesThisRun,
        playerOriginName:      playerOriginName,
        adventureEndReason:    adventureEndReason,
        playerCritSuccesses:     playerCritSuccesses,
        playerCritFails:         playerCritFails,
        playerFishCatches:       playerFishCatches,
        playerFishSkillBonus:    playerFishSkillBonus,
        playerAreaSleepCount:    playerAreaSleepCount,
        playerTotalSleepPenalty: playerTotalSleepPenalty,
        fishingRested:           fishingRested,
        isEndingState:         isEndingState,
        gatewayPassed:         gatewayPassed,
        isKillEnding:          isKillEnding,
        playerWonThisRun:      playerWonThisRun,
        seenLoot:              seenLoot,
        seenEncounters:        seenEncounters,
        usedShopMessages:      usedShopMessages,
        // ── Current encounter ────────────────────────────────────────────────
        enemyEmoji:            enemyEmoji,  enemyName:   enemyName,
        enemyHp:               enemyHp,     enemyAtk:    enemyAtk,
        enemySta:              enemySta,    enemyLck:    enemyLck,
        enemyInt:              enemyInt,    enemyMgk:    enemyMgk,
        enemyDef:              enemyDef,
        enemyType:             enemyType,   previousEnemyType: previousEnemyType,
        enemyItemSlot:         enemyItemSlot,
        enemyContainerNumber:  enemyContainerNumber,
        enemyTeam:             String(enemyTeam),
        enemyDesc:             enemyDesc,   enemyMsg:    enemyMsg,
        enemyQuestItems:       String(enemyQuestItems),
        enemyHpLost:           enemyHpLost, enemyStaLost: enemyStaLost,
        enemyAtkBonus:         enemyAtkBonus, enemyIntBonus: enemyIntBonus,
        enemyMgkLost:          enemyMgkLost,
        enemyEmojiScaleX:      enemyEmojiScaleX,
        enemyBossType:         enemyBossType,
        enemyCursed:           enemyCursed,
        enemyFamiliar:         enemyFamiliar,
        totalBonus:            totalBonus,  totalMalus:  totalMalus,
        isFishing:             isFishing,   encounterUsed: encounterUsed,  lootEncounterIndex: lootEncounterIndex,
        corpseState:           corpseState, corpseSnapshot: corpseSnapshot,
        corpseHasLoot:         corpseHasLoot, corpseLoot:  corpseLoot,
        // ── Area / story queue ───────────────────────────────────────────────
        areaName:              areaName,    previousArea: previousArea,
        encounterIndex:        encounterIndex,
        lastEncounterIndex:    lastEncounterIndex,
        lastGeneratorName:     lastGeneratorName,
        linesStory:            linesStory
      }));
    } catch (e) {
      console.error('SaveManager: gameState write failed', e);
    }
  }

  function loadGameState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function restoreGameState(s) {
    // Player
    playerName        = s.playerName;       playerNumber      = s.playerNumber;
    playerKills       = s.playerKills;
    playerLootString  = s.playerLootString; playerPartyString = s.playerPartyString;
    petName           = s.petName      !== undefined ? s.petName      : {};
    followerName      = s.followerName !== undefined ? s.followerName : {};
    playerSlotHead    = s.playerSlotHead    || null;
    playerSlotWeapon  = s.playerSlotWeapon  || null;
    playerSlotChest   = s.playerSlotChest   || null;
    playerSlotLegs    = s.playerSlotLegs    || null;
    playerSlotTrinket = s.playerSlotTrinket || null;
    playerInventory   = s.playerInventory   || [];
    playerHpMax       = s.playerHpMax;      playerStaMax      = s.playerStaMax;
    playerMgkMax      = s.playerMgkMax;
    playerHp          = s.playerHp;         playerSta         = s.playerSta;
    playerLck         = s.playerLck;        playerInt         = s.playerInt;
    playerAtk         = s.playerAtk;        playerAtkBonus    = s.playerAtkBonus;
    playerDef         = s.playerDef;        playerMgk         = s.playerMgk;
    playerXP          = s.playerXP;         playerLevel       = s.playerLevel;
    playerXPThreshold = s.playerXPThreshold;
    playerLove        = s.playerLove;       playerKarma       = s.playerKarma;
    playerRested      = s.playerRested;     playerCooked      = s.playerCooked;
    playerShopped     = s.playerShopped;    playerDestined    = s.playerDestined;    playerEmoji       = s.playerEmoji || '';
    bubblesUsed       = s.bubblesUsed;
    playerAttackType  = s.playerAttackType; playerRollType    = s.playerRollType;
    playerBlockType   = s.playerBlockType;  playerSleepType   = s.playerSleepType;
    playerSpeakType   = s.playerSpeakType;  playerCastType    = s.playerCastType;
    playerHealType    = s.playerHealType;   playerCurseType   = s.playerCurseType;
    savedCoins        = s.savedCoins;       spentCoins        = s.spentCoins;
    // Progression
    adventureStartTime      = s.adventureStartTime;
    adventureLog            = s.adventureLog;
    adventureEncounterCount = s.adventureEncounterCount;
    encounterCount          = s.encounterCount      || 0;
    scoreBaselineStats      = s.scoreBaselineStats  || 8;
    runStartTimestamp       = s.runStartTimestamp   || Date.now();
    // Re-anchor the live segment to now: the idle gap since the save must not count.
    playtimeBankedMs        = s.playtimeBankedMs    || 0;
    playtimeSegmentStart    = Date.now();
    playerRevivesThisRun    = s.playerRevivesThisRun || 0;
    playerOriginName        = s.playerOriginName    || '';
    adventureEndReason      = s.adventureEndReason;
    playerCritSuccesses     = s.playerCritSuccesses     || 0;
    playerCritFails         = s.playerCritFails         || 0;
    playerFishCatches       = s.playerFishCatches       || 0;
    playerFishSkillBonus    = s.playerFishSkillBonus    || 0;
    playerAreaSleepCount    = s.playerAreaSleepCount    || 0;
    playerTotalSleepPenalty = s.playerTotalSleepPenalty || 0;
    fishingRested           = !!s.fishingRested;
    isEndingState           = !!s.isEndingState;
    gatewayPassed           = !!s.gatewayPassed;
    isKillEnding            = !!s.isKillEnding;
    playerWonThisRun        = !!s.playerWonThisRun;
    seenLoot                = s.seenLoot       || [];
    seenEncounters          = s.seenEncounters || [];
    usedShopMessages        = s.usedShopMessages || [];
    // Enemy
    enemyEmoji           = s.enemyEmoji;   enemyName          = s.enemyName;
    enemyHp              = s.enemyHp;      enemyAtk           = s.enemyAtk;
    enemySta             = s.enemySta;     enemyLck           = s.enemyLck;
    enemyInt             = s.enemyInt;     enemyMgk           = s.enemyMgk;
    enemyDef             = s.enemyDef;
    enemyType            = s.enemyType;    previousEnemyType  = s.previousEnemyType;
    enemyItemSlot        = s.enemyItemSlot || null;
    enemyContainerNumber = s.enemyContainerNumber;
    enemyTeam            = s.enemyTeam;    enemyDesc          = s.enemyDesc;
    enemyMsg             = s.enemyMsg;     enemyQuestItems    = s.enemyQuestItems;
    enemyHpLost          = s.enemyHpLost;  enemyStaLost       = s.enemyStaLost;
    enemyAtkBonus        = s.enemyAtkBonus; enemyIntBonus     = s.enemyIntBonus;
    enemyMgkLost         = s.enemyMgkLost;
    enemyEmojiScaleX     = s.enemyEmojiScaleX;
    enemyBossType        = s.enemyBossType;
    enemyCursed          = s.enemyCursed;
    enemyFamiliar        = !!s.enemyFamiliar;
    totalBonus           = s.totalBonus;   totalMalus         = s.totalMalus;
    isFishing            = s.isFishing;    encounterUsed      = s.encounterUsed;  lootEncounterIndex = s.lootEncounterIndex;
    corpseState          = s.corpseState    || '';
    corpseSnapshot       = s.corpseSnapshot || null;
    corpseHasLoot        = !!s.corpseHasLoot;
    corpseLoot           = s.corpseLoot     || null;
    // Area / story
    areaName           = s.areaName;      previousArea       = s.previousArea;
    encounterIndex     = s.encounterIndex;
    lastEncounterIndex = s.lastEncounterIndex;
    lastGeneratorName  = s.lastGeneratorName;
    linesStory         = s.linesStory;
  }

  function clearGameState() {
    localStorage.removeItem(STATE_KEY);
  }

  // Saves the active run as an abandoned session, then clears it.
  // Called when the player confirms New Game while a run is in progress.
  function abandonCurrentRun() {
    var saved = loadGameState();
    if (!saved) return;
    saveSession({
      date:            saved.adventureEndTime || saved.adventureStartTime,
      runEndTimestamp: Date.now(),
      playerName:   saved.playerName,
      level:        saved.playerLevel,
      kills:        saved.playerKills,
      area:         saved.areaName,
      causeOfDeath: '❌ Given up',
      outcome:      'abandoned',
      actionLog:    saved.adventureLog,
      playerHpMax:       saved.playerHpMax,
      playerStaMax:      saved.playerStaMax,
      playerAtk:         saved.playerAtk,
      playerMgkMax:      saved.playerMgkMax,
      playerLootString:  String(saved.playerLootString  || ''),
      playerPartyString: String(saved.playerPartyString || ''),
      sessionAchievements: (typeof AchievementManager !== 'undefined' ? AchievementManager.getSessionUnlocked() : []),
      score:          0,
      endType:        'abandoned',
      ghostLink:      null,
      playerOriginName:  saved.playerOriginName  || '',
      playerOriginEmoji: saved.playerEmoji       || '',
      encounterCount: saved.encounterCount || 0,
      difficulty:     'Standard',
      playtime:       0
    });
    clearGameState();
  }

  // ── Meta-save (coins) ──────────────────────────────────────────────────────

  // Wipes active run and fishing loot — coins are intentionally preserved
  function clearSave() {
    localStorage.removeItem('seenLoot');
    clearGameState();
  }

  function clearAll() {
    localStorage.removeItem('coins'); // full wipe only
    localStorage.removeItem('transmuteDebt');
    localStorage.removeItem('transmuteRunStarted');
    clearSave();
    localStorage.removeItem(HISTORY_KEY);
  }

  // Wipes all gameplay data: run, history, coins, achievements, nickname.
  // Settings (difficulty, vibration) are intentionally preserved.
  function purgeAll() {
    localStorage.removeItem('coins');
    localStorage.removeItem('transmuteDebt');
    localStorage.removeItem('transmuteRunStarted');
    clearSave();
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem('achievements');
    localStorage.removeItem('achievStats');
    localStorage.removeItem('originRoll');
    localStorage.removeItem('playerNickname');
  }

  // Removes the most-recently saved session for the given run start time.
  // Used by playerReincarnate() to undo the death entry written by gameOver().
  function removeLastDeathSession(startTime) {
    var history = listSessionHistory();
    var idx = history.findIndex(function (s) { return s.date === startTime; });
    if (idx !== -1) {
      history.splice(idx, 1);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
    }
  }

  // Continue is available whenever an active run snapshot exists
  function hasContinue() {
    return loadGameState() !== null;
  }

  // Patches only playerName in the existing save — safe to call without linesStory loaded.
  function patchPlayerName(newName) {
    var s = loadGameState();
    if (!s) return;
    s.playerName = newName;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  return {
    hasContinue:        hasContinue,
    saveGameState:      saveGameState,
    loadGameState:      loadGameState,
    restoreGameState:   restoreGameState,
    clearGameState:     clearGameState,
    abandonCurrentRun:  abandonCurrentRun,
    saveSession:          saveSession,
    listSessionHistory:   listSessionHistory,
    removeLastDeathSession: removeLastDeathSession,
    clearSave:          clearSave,
    clearAll:           clearAll,
    purgeAll:           purgeAll,
    patchPlayerName:    patchPlayerName
  };
})();
