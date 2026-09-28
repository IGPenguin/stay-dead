var AchievementManager = (function () {
  var STORAGE_KEY = 'achievements';
  var STATS_KEY   = 'achievStats';

  var ACHIEVEMENTS = [
    { id: 'all_achievements',    emoji: '🏆', desc: "Completed ALL available memories!", hint: "Gotta catch 'em all to get into Credits!", unlock: "You'll appear in <b>🖤 Credits</b> soon™" },

    { id: 'kill_first',          emoji: '🪓', desc: 'Defeated your first enemy!', hint: "Spill blood for the first time.", unlock: 'Unlocked the <b>🔪 Bloody Knife</b> item.' },
    { id: 'knockout_first',      emoji: '💤', desc: 'Knocked out your first enemy!', hint: 'It does not have to hurt.', unlock: 'Unlocked the <b>🥋 Budo Kimono</b> item.' },
    { id: 'calm_first',          emoji: '💬', desc: 'Talked an enemy into submission!', hint: 'How about trying de-escalation?', unlock: 'Unlocked the <b>🏳️ Pacifist</b> origin.' },
    { id: 'survive_trap',        emoji: '💥', desc: 'Survived a deadly trap!', hint: 'Watch where you step.', unlock: 'Unlocked the <b>🤙 Careless</b> origin.' },
    { id: 'died_first',          emoji: '💀', desc: 'Died for the first time!', hint: "Finally face the inevitable.", unlock: 'Unlocked the <b>🧟‍♂️ Rotten</b> origin.' },
    { id: 'death_trap',          emoji: '🪤', desc: 'Killed by a deadly trap!', hint: 'Ooops... that was deadly.', unlock: 'Unlocked the <b>💥 Clumsy</b> origin.' },
    { id: 'death_sleep',         emoji: '💤', desc: 'Died in your sleep...', hint: 'Not the peaceful rest you hoped for.', unlock: 'Unlocked the <b>👻 Wraith</b> origin.' },
    { id: 'level_first',         emoji: '🎉', desc: 'Leveled up for the first time!', hint: 'Gain experience. Grow stronger.', unlock: 'Unlocked the <b>🥻 Philosopher Toga</b>.' },
    
    { id: 'boss_kill_first',     emoji: '♠️', desc: 'Defeated the first area boss!', hint: "Defeat the first challenging enemy!", unlock: 'Unlocked the <b>♠️ Origins</b> feature.' },
    { id: 'destiny_first',       emoji: '📜', desc: 'Picked an Origin for the first time!', hint: "Start over, this time different.", unlock: 'Unlocked the <b>🔥 Eternal Bonefire</b>.' },
    { id: 'coin_first',          emoji: '🪙', desc: 'Picked up the first Drachma coin!', hint: "Obtain the everlasting currency.", unlock: 'Unlocked the <b>⚖️ Undertaker</b>.' },
    { id: 'mana_first',          emoji: '🔵', desc: 'Gained mana for the first time!', hint: 'Magic answers to the willing.', unlock: 'Unlocked <b>🩸 Warlock</b> origin.' },
    { id: 'gate_fairyland',      emoji: '⛩️', desc: 'Conquered the Twisted Fairyland!', hint: "Endure through the spells and hexes.", unlock: 'Unlocked the <b>⛩️ Soulbinding Arch</b>.' },
    { id: 'coin_3',              emoji: '💰', desc: 'Set up for success with 3 Drachmae!', hint: "Fill your pouch to the brim.", unlock: 'Unlocked buy <b>🟠 Artifact</b> option.' },

    { id: 'fish_bait_first',     emoji: '🎣', desc: 'Caught something for the first time!', hint: "Whaaat? There's fishing?", unlock: 'Unlocked the <b>🎣 Angler</b> origin.' },
    { id: 'fish_no_bait_first',  emoji: '🪝', desc: 'Caught something without bait!', hint: "Pffft... who needs a bait anyway?", unlock: 'Unlocked the <b>👒 Fishing Hat</b> item.' },

    { id: 'key_unlock_first',    emoji: '🔓', desc: 'Opened a lock with a key!', hint: 'The right key for the right lock.', unlock: 'Unlocked the <b>📎 Universal Key</b> item.' },
    { id: 'smash_door_first',    emoji: '🔨', desc: 'Smashed a lock open with an attack!', hint: 'When keys fail, force prevails.', unlock: 'Unlocked the <b>♨ Choleric</b> origin.' },
    { id: 'magic_unlock_first',  emoji: '🪄', desc: 'Opened a lock with a spell!', hint: 'Magic opens more than minds.', unlock: 'Unlocked the <b>🧿 Wizard</b> origin.' },
    { id: 'grab_exquisite',      emoji: '🟣', desc: 'Grabbed your first exquisite item!', hint: 'A mark of fine quality.', unlock: 'Unlocked the <b>🧐 Collector</b> origin.' },
    { id: 'grab_artifact',       emoji: '🏺', desc: 'Grabbed your first artifact!', hint: 'Some items are truly legendary.', unlock: 'Unlocked the <b>🏺 Tomb Raider</b> origin.' },
    { id: 'grab_rubbish',        emoji: '🕸️', desc: 'Picked up something useless!', hint: 'Nothing wrong with low standards.', unlock: 'Unlocked the <b>🧥 Hobo</b> origin.' },

    { id: 'eat_hazardous',       emoji: '🤢', desc: 'Consumed something hazardous!', hint: 'Are you sure? Suit yourself...', unlock: 'Unlocked the <b>🐷 Pig Mask</b>.' },
    { id: 'eat_purple',          emoji: '💜', desc: 'Consumed a premium refreshment!', hint: 'The finer things in death.', unlock: 'Unlocked the <b>🍷 Vinekeeper</b> origin.' },
    { id: 'eat_legendary',       emoji: '🍔', desc: 'Consumed a legendary refreshment!', hint: 'Become a certified gourmet.', unlock: 'Unlocked the <b>🤌 Gourmet</b> origin.' },
    { id: 'pet_first',           emoji: '🐾', desc: 'Got your first furry companion!', hint: 'Befriend a cute furry being.', unlock: 'Unlocked the <b>🦧 Furry</b> origin.' },
    { id: 'pet_parrot',          emoji: '🦜', desc: 'Acquired a talking companion!', hint: 'Pet a lone bird while saling, matey.', unlock: 'Unlocked the <b>🏴‍☠️ Pirate</b> origin.' },
    { id: 'recruit_first',       emoji: '🤝', desc: 'Recruited your first ally!', hint: 'Talk someone to join your side.', unlock: 'Unlocked the <b>💬 Preacher</b> origin.' },
    { id: 'full_party',          emoji: '👥', desc: 'Got a party of three companions!', hint: 'The more, the merrier, always.', unlock: 'Unlocked the <b>💍 Engraved Ring</b> item.' },

    { id: 'discover_forsaken',   emoji: '🏚️', desc: 'Discovered: Forsaken Village!', hint: "Seek the long forgotten village.", unlock: 'Unlocked the <b>🧭 Guide</b> origin.' },
    { id: 'discover_fairyland',  emoji: '🍄', desc: 'Discovered: Twisted Fairyland!', hint: "Seek the home of supernatural beings.", unlock: 'Unlocked the <b>🎋 Shaman</b> origin.' },
    { id: 'discover_river',      emoji: '🌊', desc: 'Discovered: River of Sorrows!', hint: "Sail the flows of eternal tears.", unlock: 'Unlocked the <b>⛵️ Sailor</b> origin.' },
    { id: 'discover_necropolis', emoji: '🪦', desc: 'Discovered: Shrouded Necropolis!', hint: "Where the deepest shadows dwell.", unlock: 'Unlocked the <b>🦴 Survivor</b> origin.' },

    { id: 'reincarnated_first',  emoji: '✨', desc: 'Reincarnated for the first time!', hint: "Don't give up skeleton!", unlock: 'Unlocked the <b>♥️ Extra Life</b> item.' },
    { id: 'meditate_first',      emoji: '🌀', desc: 'Changed your fate with a coin.', hint: 'Spend coin to rethink who you are.', unlock: 'Unlocked the <b>🌀 Shedding Stone</b> item.' },
    { id: 'transmute_first',     emoji: '🧬', desc: 'Combined two Origins for the first time!', hint: 'Some fates were never meant to stay separate.', unlock: 'Unlocked the <b>🧬 Fused Marrow</b> item.' },

    //Missing "Favor/Body buy" achiev
    { id: 'gamble_win_first',    emoji: '🍀', desc: 'Won the gamble for the first time!', hint: "Luck smiles upon the bold.", unlock: 'Unlocked the <b>🍀 Lucky</b> origin.' },
    { id: 'gamble_lose_first',   emoji: '🥺', desc: 'Lost the gamble for the first time!', hint: "But why the long face?", unlock: 'Unlocked the <b>🐴 Horse Mask</b> item.' },
    { id: 'buy_item_first',      emoji: '⚖️', desc: 'Bought an item from the Shade!', hint: "A fair trade for a fair price.", unlock: 'Unlocked the <b>⚖️ Fence</b> origin.' },
    { id: 'buy_artifact_first',  emoji: '💎', desc: 'Bought an artifact from the Shade!', hint: "An eye for the unusual antiques.", unlock: "Unlocked the <b>🏷️ Merchant's Tag</b>." },
    { id: 'buy_level_first',     emoji: '📈', desc: 'Bought a level up from the Shade!', hint: "Shortcut to power, at a cost.", unlock: 'Unlocked the <b>💰 Profiteer</b> origin.' },
    { id: 'spent_10',            emoji: '💸', desc: 'Spent 10 Drachmae in total already!', hint: "A loyal customer of the shadows." },

    { id: 'letter_remember',     emoji: '💌', desc: 'Read a very disturbing writing.', hint: 'Some things are better left in the past.', unlock: 'Unlocked the <b>💘 Lover</b> origin.' },
    { id: 'letter_grab',         emoji: '✉️', desc: 'Kept a disturbing writing with you.', hint: 'Could not bring yourself to leave it.', unlock: 'Unlocked the <b>✉️ Courier</b> origin' },
    { id: 'letter_ditch',        emoji: '💔', desc: 'Cast a disturbing writing aside.', hint: 'Letting go hurts more than holding on.', unlock: 'Unlocked the <b>💔 Broken</b> origin.' },
    //Missing teleported through gate first time

    { id: 'rival_spot',          emoji: '👾', desc: 'Got invaded from another world!',         hint: 'See the face of someone who fell.',    unlock: 'Unlocked the <b>👁️ Haunted</b> origin.' },
    { id: 'rival_kill',          emoji: '⚔️', desc: 'Slain an Invader from another world!',   hint: 'The dead can die twice.',              unlock: 'Unlocked the <b>〽️ Echo Blade</b> item.' },
    { id: 'rival_killed_by',     emoji: '⚰️', desc: 'Slain by Invader from another world.',   hint: 'Their death echoed into yours.',       unlock: 'Unlocked the <b>🎯 Marked</b> origin.' },
    { id: 'rival_kills_10',      emoji: '🔪', desc: 'Slain 10 Invaders from another world!',   hint: 'The world boundary grows thinner.',    unlock: 'Unlocked the <b>🔪 Slayer</b> origin.' },

    { id: 'cook_food_first',     emoji: '🔥', desc: 'Cooked your first meal!', hint: 'Sometimes survival requires creativity.', unlock: 'Unlocked the <b>🧂Salt Shaker</b> item.' },
    { id: 'salt_food_first',     emoji: '🧂', desc: 'Seasoned your first meal!', hint: 'A pinch of salt goes a long way.', unlock: 'Unlocked the <b>👨🏻‍🍳 Chef></b> origin.' },

    { id: 'fish_legendary_first',emoji: '🏺', desc: 'Reeled in a legendary find!', hint: 'The best things are worth waiting for.', unlock: 'Unlocked the <b>🔱 Titanslayer Trident</b>.' },
    { id: 'fish_boss_first',     emoji: '🦕', desc: 'Fished out a legendary beast!', hint: 'The rumors were true after all.', unlock: 'Unlocked the <b>🔍 Surveyor</b> origin.' },
    { id: 'fish_boss_kill',      emoji: '🦴', desc: 'Defeated the ancient water monster!', hint: 'Calm the cursed waters forever.', unlock: 'Unlocked a hidden <b>🪙 Drachma</b>.' },
    { id: 'spoke_boss',          emoji: '🗣️', desc: 'Calmed a Boss into submission!', hint: 'Could peace be an actual option?', unlock: 'Unlocked the <b>📣 Loud Vocalizer</b> item.' },
    { id: 'spoke_demon',         emoji: '🤯', desc: 'Talked a Demon into submission!', hint: 'Try to make a deal with the devil.', unlock: 'Unlocked the <b>😈 Devil</b> origin.' },
    { id: 'quest_first',         emoji: '⭐️', desc: 'Completed your first quest!', hint: 'Bring them what they ask for.', unlock: "Unlocked the <b>📦 Schrödinger's Box</b>." },
    { id: 'touch_grass',         emoji: '🌿', desc: 'You finally touched the grass!', hint: 'Try going outside and then?', unlock: 'Unlocked the <b>🌻 Hippie</b> origin.' },

    { id: 'level_5',             emoji: '🎊', desc: 'Reached the character level 5!', hint: 'The path ahead grows longer.', unlock: 'Unlocked the <b>🎓 Scholar</b> origin.' },
    { id: 'destiny_10',          emoji: '♻️', desc: 'Started over again 10 times!', hint: "Repeat the cycle again and again.", unlock: 'Unlocked the <b>📼 Rewind Tape</b> item.' },
    { id: 'kill_30',             emoji: '🔪', desc: 'Defeated 30 enemies!', hint: "A growing trail of broken spirits.", unlock: 'Unlocked the <b>🥩 Butcher</b> origin.' },
    { id: 'knockout_30',         emoji: '✌️', desc: 'Knocked out 30 enemies!', hint: "Mercy becomes your second nature.", unlock: 'Unlocked the <b>🥷 Ninja</b> origin.' },
    { id: 'boss_kill_10',        emoji: '🎖️', desc: 'Defeated 10 bosses!', hint: "Giant slayer, born in struggle.", unlock: 'Unlocked the <b>🎖️ Hero</b> origin.' },
    { id: 'fish_bait_30',        emoji: '🎏', desc: 'Caught something 30x!', hint: "Master the haunted waters.", unlock: 'Unlocked the <b>🧵 Lucky Fishline</b> item.' },
    { id: 'fish_no_bait_30',     emoji: '😎', desc: 'Caught something with no bait 30x!', hint: "Pure skill always beats the odds.", unlock: 'Unlocked the <b>🪣 Sturdy Bucket</b>.' },
    { id: 'gamble_win_10',       emoji: '🎰', desc: 'Won the shady gamble 10 times!', hint: "Become a well seasoned gambler.", unlock: 'Unlocked the <b>🎲 Gambler</b> origin.' },
    { id: 'meditate_10',         emoji: '⚗️', desc: 'Changed your fate 10 times!', hint: 'Some identities are harder to keep.', unlock: 'Unlocked the <b>⚗️ Mystic</b> origin.' },
    { id: 'transmute_10',        emoji: '🔆', desc: 'Combined Origins ten times!', hint: 'You have mastered the art of becoming.', unlock: 'Unlocked the <b>🔆 Adept</b> origin.' },

    { id: 'game_win_first',  emoji: '👑', desc: 'Finished the game for the first time!',   hint: "Understand how did everything begin.",   unlock: 'Unlocked the <b>💍 Groom</b> origin.' },
    { id: 'ending_kill',    emoji: '🩸', desc: 'Chose the blade where mercy failed.',      hint: 'The blade knows only one language.',       unlock: 'Unlocked the <b>🩸 Traitor</b> origin.' },
    { id: 'ending_walk',   emoji: '💔', desc: 'Turned your back, she watched you go.',    hint: 'Not every story ends at its threshold.',   unlock: 'Unlocked the <b>👣 Wanderer</b> origin.' },
    { id: 'ending_guard',  emoji: '🔰', desc: 'Stayed still, that was the only answer.',  hint: 'Devotion without motion is its own end.',   unlock: 'Unlocked the <b>🗿 Sentinel</b> origin.' },
    { id: 'ending_embrace',emoji: '🌑', desc: 'Held her close, the dark took you both.',  hint: 'Together is not the same as saved.',        unlock: 'Unlocked the <b>👤 Tainted</b> origin.' },
    { id: 'ending_sleep',  emoji: '💤', desc: 'Laid beside her, deemed it enough.',   hint: 'Some debts are repaid in silence.',         unlock: 'Unlocked the <b>🌿 Quiet</b> origin.' },
    { id: 'ending_speak',  emoji: '❤️', desc: 'Said her name and she remembered.',   hint: 'The right word at the last moment.',        unlock: 'Unlocked the <b>🕊️ Gifted</b> origin.' },
    { id: 'ending_pray',   emoji: '🌪️', desc: 'Called the gods, something answered.',  hint: 'Some powers reward desperation.',           unlock: 'Unlocked the <b>🌈 Blessed</b> origin.' },
    { id: 'ending_free',   emoji: '🪽', desc: 'Undid what you made, thread by thread.',   hint: 'Unmaking your own curse is hardest.',       unlock: 'Unlocked the <b>❤️‍🩹 Absolver</b> origin.' },
    { id: 'ending_curse',  emoji: '👹', desc: 'Sealed the pact, without hesitation.',     hint: 'Some choose darkness without pause.',       unlock: 'Unlocked the <b>👹 Hexed</b> origin.' },
    { id: 'hardcore_win',   emoji: '☠️', desc: 'Finished the game on Fatal difficulty!',   hint: 'Prove your dedication and true skill.',   unlock: 'Unlocked the <b>💀 Brittle</b> origin.' },

    { id: 'use_cheat',           emoji: '⚠️', desc: 'Used a cheat for the first time!', hint: 'Try using a secret special name.', unlock: 'Unlocked the <b>🤥 Cheater</b> origin.' }
  ];

  var _defaultStats = {
    totalDeaths:         0,
    totalReincarnations: 0,
    maxSavedCoins:       0,
    totalCoinsSpent:     0,
    totalGambleWins:     0,
    totalGambleLosses:   0,
    totalDestinyAccepts: 0,
    totalKills:          0,
    totalBossKills:      0,
    totalKnockouts:      0,
    calmedEnemy:         false,
    gotPet:              false,
    pettedParrot:        false,
    gotRecruit:          false,
    completedQuest:      false,
    spokeBoss:           false,
    spokeDemon:          false,
    survivedTrap:        false,
    fullParty:           false,
    totalFishBait:       0,
    totalFishNoBait:     0,
    boughtItem:          false,
    boughtArtifact:      false,
    boughtLevel:         false,
    wonGame:             false,
    endingsCompleted:    [],
    rivalSpot:           false,
    rivalKills:          0,
    rivalKilledBy:       false,
    discoveredAreas:     [],
    grabbedArtifact:     false,
    grabbedExquisite:    false,
    grabbedRubbish:      false,
    keyUnlockFirst:      false,
    smashDoorFirst:      false,
    magicUnlockFirst:    false,
    manaFirst:           false,
    ateHazardous:        false,
    atePurple:           false,
    ateLegendary:        false,
    leveledFirst:        false,
    reachedLevel5:       false,
    usedCheat:           false,
    fishedBoss:          false,
    fishedLegendary:     false,
    cookedFood:          false,
    saltedFood:          false,
    letterRemember:      false,
    letterGrab:          false,
    letterDitch:         false,
    diedByTrap:          false,
    diedBySleep:         false,
    killedFishingBoss:   false,
    meditateFirst:       false,
    totalMeditations:    0,
    combineFirst:        false,
    totalCombines:       0
  };

  var _unlocked       = {};
  var _stats          = {};
  var _sessionUnlocked = [];
  var _toastQueue     = [];
  var _toastActive    = false;

  // ── Persistence ──────────────────────────────────────────────────────────

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      _unlocked = raw ? JSON.parse(raw) : {};
    } catch(e) { _unlocked = {}; }
    try {
      var rawStats = localStorage.getItem(STATS_KEY);
      _stats = rawStats ? JSON.parse(rawStats) : {};
    } catch(e) { _stats = {}; }
    Object.keys(_defaultStats).forEach(function(k) {
      if (_stats[k] === undefined) {
        _stats[k] = JSON.parse(JSON.stringify(_defaultStats[k]));
      }
    });
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_unlocked)); } catch(e) {}
    try { localStorage.setItem(STATS_KEY,   JSON.stringify(_stats));    } catch(e) {}
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function _showNextToast() {
    if (_toastQueue.length === 0) { _toastActive = false; return; }
    _toastActive = true;
    var item = _toastQueue.shift();
    var done = function() { _toastActive = false; _showNextToast(); };
    if (item._type === 'bark') {
      showCompanionBarkToast(item.barkIcon, item.name, item.text, item.color, done);
    } else {
      var ts = ('_ts' in item) ? item._ts : AchievementManager.getUnlockTime(item.id);
      showAchievementToast(item, ts, done);
    }
  }

  function queueToast(achievement, subtitleText) {
    var item = Object.assign({}, achievement, { _ts: subtitleText || null });
    _toastQueue.push(item);
    if (!_toastActive) _showNextToast();
  }

  function queueCompanionBark(barkIcon, name, text, color) {
    _toastQueue.push({ _type: 'bark', barkIcon: barkIcon, name: name, text: text, color: color });
    if (!_toastActive) _showNextToast();
  }

  // ── Unlock ────────────────────────────────────────────────────────────────

  function _checkAllAchievements() {
    if (_unlocked['all_achievements']) return;
    var allDone = ACHIEVEMENTS.every(function(a) {
      return a.id === 'all_achievements' || !!_unlocked[a.id];
    });
    if (allDone) _unlock('all_achievements');
  }

  function _unlock(id) {
    if (_unlocked[id]) return;
    _unlocked[id] = Date.now();
    _sessionUnlocked.push(id);
    _save();
    if (typeof TelemetryManager !== 'undefined') TelemetryManager.send('achievement', id);
    var achievement = null;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      if (ACHIEVEMENTS[i].id === id) { achievement = ACHIEVEMENTS[i]; break; }
    }

    // Add log
    if (achievement) setTimeout(function () {
      var MAX_LENGTH = 45;
      var text = achievement.desc;
      if (text.length > MAX_LENGTH) text = achievement.desc.substring(0,MAX_LENGTH)+"..."
      
      logAction("🧩 ▸ "+achievement.emoji+" <b style=\"color:"+colorGold+"\";>"+text+"</b>");
      redraw();
    },1) //Hehehehe, hack to log after logging action done

    // Show toast
    if (achievement) {
      _toastQueue.push(achievement);
      if (!_toastActive) _showNextToast();
    }

    if (id !== 'all_achievements') _checkAllAchievements();
  }

  function dismissToast() {
    var toast = document.getElementById('achievement_toast');
    if (!toast) return;
    toast.style.transition = 'opacity 0.25s';
    toast.style.opacity = '0';
    setTimeout(function() {
      if (document.getElementById('achievement_toast') === toast) toast.remove();
      _toastActive = false;
      _showNextToast();
    }, 260);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function check(trigger, value) {

    //Prevent achievements in tutorial, except cheats
    if (areaName && areaName.includes("Depths of Slumber") && !playerEmoji.includes("⚠️")) return;

    switch (trigger) {

      case 'death':
        _stats.totalDeaths++;
        _save();
        if (_stats.totalDeaths === 1) _unlock('died_first');
        break;

      case 'reincarnate':
        _stats.totalReincarnations++;
        _save();
        if (_stats.totalReincarnations === 1) _unlock('reincarnated_first');
        break;

      case 'coin_pickup':
        // value = current savedCoins after pickup
        if (value > _stats.maxSavedCoins) { _stats.maxSavedCoins = value; _save(); }
        if (_stats.maxSavedCoins >= 1) _unlock('coin_first');
        if (_stats.maxSavedCoins >= 3) _unlock('coin_3');
        break;

      case 'gamble_win':
        _stats.totalGambleWins++;
        _save();
        if (_stats.totalGambleWins === 1)  _unlock('gamble_win_first');
        if (_stats.totalGambleWins >= 10)  _unlock('gamble_win_10');
        break;

      case 'gamble_lose':
        _stats.totalGambleLosses++;
        _save();
        if (_stats.totalGambleLosses === 1) _unlock('gamble_lose_first');
        break;

      case 'destiny':
        _stats.totalDestinyAccepts++;
        _save();
        if (_stats.totalDestinyAccepts === 1)  _unlock('destiny_first');
        if (_stats.totalDestinyAccepts >= 10)  _unlock('destiny_10');
        break;

      case 'meditate':
        if (!_stats.totalMeditations) _stats.totalMeditations = 0;
        _stats.totalMeditations++;
        _save();
        if (!_stats.meditateFirst) { _stats.meditateFirst = true; _unlock('meditate_first'); }
        if (_stats.totalMeditations >= 10) _unlock('meditate_10');
        break;

      case 'combine':
        if (!_stats.totalCombines) _stats.totalCombines = 0;
        _stats.totalCombines++;
        _save();
        if (!_stats.combineFirst) { _stats.combineFirst = true; _unlock('transmute_first'); }
        if (_stats.totalCombines >= 10) _unlock('transmute_10');
        break;

      case 'buy_item':
        if (!_stats.boughtItem) { _stats.boughtItem = true; _save(); _unlock('buy_item_first'); }
        break;

      case 'buy_artifact':
        if (!_stats.boughtArtifact) { _stats.boughtArtifact = true; _save(); _unlock('buy_artifact_first'); }
        break;

      case 'buy_level':
        if (!_stats.boughtLevel) { _stats.boughtLevel = true; _save(); _unlock('buy_level_first'); }
        break;

      case 'spend_coins':
        _stats.totalCoinsSpent += (value || 0);
        _save();
        if (_stats.totalCoinsSpent >= 10) _unlock('spent_10');
        break;

      case 'kill':
        _stats.totalKills++;
        _save();
        if (_stats.totalKills === 1)  _unlock('kill_first');
        if (_stats.totalKills >= 30)  _unlock('kill_30');
        break;

      case 'boss_kill':
        _stats.totalBossKills++;
        _save();
        if (_stats.totalBossKills === 1)  _unlock('boss_kill_first');
        if (_stats.totalBossKills >= 10)  _unlock('boss_kill_10');
        break;

      case 'gate_fairyland':
        _unlock('gate_fairyland');
        break;

      case 'rival_spot':
        if (!_stats.rivalSpot) { _stats.rivalSpot = true; _save(); _unlock('rival_spot'); }
        break;

      case 'rival_kill':
        _stats.rivalKills++;
        _save();
        if (_stats.rivalKills === 1)  _unlock('rival_kill');
        if (_stats.rivalKills >= 10)  _unlock('rival_kills_10');
        break;

      case 'rival_killed_by':
        if (!_stats.rivalKilledBy) { _stats.rivalKilledBy = true; _save(); _unlock('rival_killed_by'); }
        break;

      case 'knockout':
        _stats.totalKnockouts++;
        _save();
        if (_stats.totalKnockouts === 1)  _unlock('knockout_first');
        if (_stats.totalKnockouts >= 30)  _unlock('knockout_30');
        break;

      case 'calm_enemy':
        if (!_stats.calmedEnemy) { _stats.calmedEnemy = true; _save(); _unlock('calm_first'); }
        break;

      case 'get_pet':
        if (!_stats.gotPet) { _stats.gotPet = true; _save(); _unlock('pet_first'); }
        break;
      
      case 'pet_parrot':
        if (!_stats.pettedParrot) { _stats.pettedParrot = true; _save(); _unlock('pet_parrot'); }
        break;

      case 'get_recruit':
        if (!_stats.gotRecruit) { _stats.gotRecruit = true; _save(); _unlock('recruit_first'); }
        break;

      case 'quest_complete':
        if (!_stats.completedQuest) { _stats.completedQuest = true; _save(); _unlock('quest_first'); }
        break;

      case 'calm_boss':
        if (!_stats.spokeBoss) { _stats.spokeBoss = true; _save(); _unlock('spoke_boss'); }
        break;
      
      case 'calm_demon':
        if (!_stats.spokeDemon) { _stats.spokeDemon = true; _save(); _unlock('spoke_demon'); }
        break;

      case 'survive_trap':
        if (!_stats.survivedTrap) { _stats.survivedTrap = true; _save(); _unlock('survive_trap'); }
        break;

      case 'full_party':
        if (!_stats.fullParty) { _stats.fullParty = true; _save(); _unlock('full_party'); }
        break;

      case 'fish_bait':
        _stats.totalFishBait++;
        _save();
        if (_stats.totalFishBait === 1)   _unlock('fish_bait_first');
        if (_stats.totalFishBait >= 30)  _unlock('fish_bait_30');
        break;

      case 'fish_no_bait':
        _stats.totalFishNoBait++;
        _save();
        if (_stats.totalFishNoBait === 1)   _unlock('fish_no_bait_first');
        if (_stats.totalFishNoBait >= 30)  _unlock('fish_no_bait_30');
        break;

      case 'discover_area': {
        var _areaMap = {
          'Forsaken Village':    'discover_forsaken',
          'Twisted Fairyland':   'discover_fairyland',
          'River of Sorrows':    'discover_river',
          'Shrouded Necropolis': 'discover_necropolis'
        };
        var _achId = _areaMap[value];
        if (_achId && !_stats.discoveredAreas.includes(value)) {
          _stats.discoveredAreas.push(value);
          _save();
          _unlock(_achId);
        }
        break;
      }

      case 'grab_artifact':
        if (!_stats.grabbedArtifact) { _stats.grabbedArtifact = true; _save(); _unlock('grab_artifact'); }
        break;

      case 'grab_exquisite':
        if (!_stats.grabbedExquisite) { _stats.grabbedExquisite = true; _save(); _unlock('grab_exquisite'); }
        break;

      case 'grab_rubbish':
        if (!_stats.grabbedRubbish) { _stats.grabbedRubbish = true; _save(); _unlock('grab_rubbish'); }
        break;

      case 'key_unlock_first':
        if (!_stats.keyUnlockFirst) { _stats.keyUnlockFirst = true; _save(); _unlock('key_unlock_first'); }
        break;

      case 'smash_door_first':
        if (!_stats.smashDoorFirst) { _stats.smashDoorFirst = true; _save(); _unlock('smash_door_first'); }
        break;

      case 'magic_unlock_first':
        if (!_stats.magicUnlockFirst) { _stats.magicUnlockFirst = true; _save(); _unlock('magic_unlock_first'); }
        break;

      case 'mana_first':
        if (!_stats.manaFirst) { _stats.manaFirst = true; _save(); _unlock('mana_first'); }
        break;

      case 'eat_hazardous':
        if (!_stats.ateHazardous) { _stats.ateHazardous = true; _save(); _unlock('eat_hazardous'); }
        break;

      case 'eat_purple':
        if (!_stats.atePurple) { _stats.atePurple = true; _save(); _unlock('eat_purple'); }
        break;

      case 'eat_legendary':
        if (!_stats.ateLegendary) { _stats.ateLegendary = true; _save(); _unlock('eat_legendary'); }
        break;

      case 'level_up':
        if (!_stats.leveledFirst) { _stats.leveledFirst = true; _save(); _unlock('level_first'); }
        if ((value >= 5) && !_stats.reachedLevel5) { _stats.reachedLevel5 = true; _save(); _unlock('level_5'); }
        break;

      case 'use_cheat':
        if (!_stats.usedCheat) { _stats.usedCheat = true; _save(); _unlock('use_cheat'); }
        break;

      case 'game_win':
        if (!_stats.wonGame) { _stats.wonGame = true; _save(); _unlock('game_win_first'); }
        break;

      case 'game_win_ending':
        if (!_stats.endingsCompleted) _stats.endingsCompleted = [];
        if (value && !_stats.endingsCompleted.includes(value)) {
          _stats.endingsCompleted.push(value);
          _save();
          var _endingAchievMap = {
            'win_kill':    'ending_kill',
            'win_walk':    'ending_walk',
            'win_guard':   'ending_guard',
            'win_embrace': 'ending_embrace',
            'win_sleep':   'ending_sleep',
            'win_speak':   'ending_speak',
            'win_pray':    'ending_pray',
            'win_free':    'ending_free',
            'win_curse':   'ending_curse'
          };
          var _achId = _endingAchievMap[value];
          if (_achId) _unlock(_achId);
        }
        break;

      case 'hardcore_win':
        _unlock('hardcore_win');
        break;

      case 'touch_grass':
        _unlock('touch_grass');
        break;

      case 'fish_boss':
        if (!_stats.fishedBoss) { _stats.fishedBoss = true; _save(); _unlock('fish_boss_first'); }
        break;

      case 'fish_boss_kill':
        if (!_stats.killedFishingBoss) { _stats.killedFishingBoss = true; _save(); _unlock('fish_boss_kill'); }
        break;

      case 'fish_legendary':
        if (!_stats.fishedLegendary) { _stats.fishedLegendary = true; _save(); _unlock('fish_legendary_first'); }
        break;

      case 'cook_food':
        if (!_stats.cookedFood) { _stats.cookedFood = true; _save(); _unlock('cook_food_first'); }
        break;

      case 'salt_food':
        if (!_stats.saltedFood) { _stats.saltedFood = true; _save(); _unlock('salt_food_first'); }
        break;

      case 'letter_remember':
        if (!_stats.letterRemember) { _stats.letterRemember = true; _save(); _unlock('letter_remember'); }
        break;

      case 'letter_grab':
        if (!_stats.letterGrab) { _stats.letterGrab = true; _save(); _unlock('letter_grab'); }
        break;

      case 'letter_ditch':
        if (!_stats.letterDitch) { _stats.letterDitch = true; _save(); _unlock('letter_ditch'); }
        break;

      case 'death_trap':
        if (!_stats.diedByTrap) { _stats.diedByTrap = true; _save(); _unlock('death_trap'); }
        break;

      case 'death_sleep':
        if (!_stats.diedBySleep) { _stats.diedBySleep = true; _save(); _unlock('death_sleep'); }
        break;
    }
  }

  function resetSession() {
    _sessionUnlocked = [];
  }

  function getSessionUnlocked() {
    return _sessionUnlocked.slice();
  }

  function isUnlocked(id) {
    return !!_unlocked[id];
  }

  function getUnlockTime(id) {
    var ts = _unlocked[id];
    if (!ts || ts === true) return null; // backwards-compat: old saves stored `true`
    return ts;
  }

  function getAll() {
    return ACHIEVEMENTS;
  }

  function clearAll() {
    _unlocked = {};
    _stats = JSON.parse(JSON.stringify(_defaultStats));
    _save();
  }

  function unlockAll() {
  ACHIEVEMENTS.forEach(function(a) {
    _unlock(a.id);
  });
}

  function _itemTier(snap) {
    var noteTag = RarityManager.getTierFromNote(snap.note || '');
    if (noteTag) return noteTag;
    if ((snap.note || '').includes('Artifact')) return 'Legendary';
    return RarityManager.getTierForItemNet(RarityManager.calcNet(snap), snap);
  }

  function checkGrabAchievement(snap) {
    var tier = _itemTier(snap);
    var note = snap.note || '';
    if (tier === 'Legendary') {
      check('grab_artifact');
    } else if (tier === 'Rare') {
      check('grab_exquisite');
    } else if (snap.emoji !== '🪙' && snap.emoji !== '💰' && snap.emoji !== '🗝️' && snap.emoji !== '🔑'
               && !note.includes('Lover') && !note.includes('Lost Possession') && !note.includes('Piece of History')) {
      check('grab_rubbish');
    }
  }

  function checkEatAchievement(snap, note) {
    var tier = RarityManager.getTierFromNote(note)
      || ((note||'').includes('Artifact') || (note||'').includes('Essence') ? 'Legendary'
      : RarityManager.getTierForConsumableNet(RarityManager.calcConsumableNet(snap)));
    if (tier === 'Legendary') check('eat_legendary');
    else if (tier === 'Rare') check('eat_purple');
    else if (tier === 'Cursed') check('eat_hazardous');
    // Any food with at least one negative stat counts as hazardous regardless of net
    if (tier !== 'Cursed') {
      var _keys = ['atk','mgk','hp','sta','lck','int','def'];
      for (var _i = 0; _i < _keys.length; _i++) {
        if ((snap[_keys[_i]] || 0) < 0) { check('eat_hazardous'); break; }
      }
    }
  }

  _load();

  return {
    check:               check,
    queueToast:          queueToast,
    queueCompanionBark:  queueCompanionBark,
    dismissToast:        dismissToast,
    resetSession:        resetSession,
    getSessionUnlocked:  getSessionUnlocked,
    isUnlocked:          isUnlocked,
    getUnlockTime:       getUnlockTime,
    getAll:              getAll,
    clearAll:            clearAll,

    checkGrabAchievement: checkGrabAchievement,
    checkEatAchievement:  checkEatAchievement,

    //cheat
    unlockAll: unlockAll
  };
})();

