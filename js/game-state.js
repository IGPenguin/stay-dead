//Run logger (localhost only)
var runLog = [];
var runLogStart = "";

var savedCoins = 0; // populated from localStorage in menu.js before each new game

//Stats
var adventureStartTime = getTime();
var adventureEndTime = "Unfinished";
var seenLoot;

//Player stats init
var playerName = getFirstName();
var playerNumber = 1; //Increments on revival
var playerKills = 0;
var playerLootString;
var playerPartyString;
var petName = {};
var followerName = {};
var playerHpMax;
var playerStaMax;
var playerMgkMax;
var playerHp;
var playerSta;
var playerLck;
var luckInterval = 35; //Lower to increase chances
var playerInt;
var playerAtk;
var playerAtkBonus;
var playerDef;
var playerXP;
var playerLevel;
var playerXPThreshold;
var playerLove=0;
var playerKarma=1;
var isEndingState = false;
var gatewayPassed = false;
var isKillEnding = false;
var playerWonThisRun = false;
var _isRival = false;
var _rivalInventory = '';
var _rivalEndType = '';
var playerRested = false;
var fishingRested = false; // persists through getRandomFish/encounterRenew; reset only on nextEncounter or new run
var playerCooked = false;
var playerShopped = false;
var playerDestined = false;
var playerEmoji = '👤';
var bubblesUsed = false;
var playerAttackType = "⚔️";
var playerRollType = "🌀";
var playerBlockType = "🔰";
var playerSleepType = "💤";
var playerSpeakType = "💬";
var playerCastType = "💫";
var playerHealType = "❤️‍🩹";
var playerCurseType = "🪬";
var availableCoins=savedCoins;
var spentCoins=0;

var soulbindingArch=["area:Fading Wildlands","emoji:⛩️","name:Soulbinding Arch","type:Memory","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Piece of History","desc:It stood before the world came apart.<br>Feels quite familiar on sight.","message:Left it behind, perhaps forever.","achiev:none"]
var drachmaShop=["area:Fading Wildlands","emoji:👤","name:Undertaker Shade","type:Shop","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Voidwatcher","desc:Well met, what's it gonna be this time?<br>","message:Set out on another adventure!","achiev:none"]
var drachmaPrize=["area:Fading Wildlands","emoji:🪙","name:Lucky Drachma","type:Item","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Transient Currency","desc:Temporary reward for <b>one-time use only</b>.<br>Beware, gambling might be addictive.","message:Claimed a <b>Lucky Drachma +1 🪙</b>","achiev:none"]
var drachmaCoin=["area:Wherever","emoji:🪙","name:Ethereal Drachma","type:Item","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Transient Currency","desc:Entangles with one's soul on touch.<br>","message:Claimed an <b>Ethereal Drachma +1 🪙</b>","achiev:none"]
var gamblingLost=["area:Wherever","emoji:🥺","name:Worthless Regrets","type:Prop","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Unlucky Moment","desc:Ooops! <b>The gamble did not pay off.</b><br>Perhaps better luck next time?","message:Released a long disappointed sigh...","achiev:none"]
var drachmaeBag=["area:Wherever","emoji:💰","name:Drachmae Reward","type:Item","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Transient Currency","desc:Gambling winnings useful in the afterlife.<br>","message:Claimed an <b>Ethereal Drachma +1 🪙</b>","achiev:none"] //Unused
var usedShopMessages=[];

var attackTypes=(["🔪","🗡️","🔧","⛏️","🪚","🔨","🪓","🪛","🖋️","✂️","🪃","🪨","🌂","🦯","🥊","🪝","🦷","🪠","🗞️","🔱","🧹","🥏","🛹","⚔️","💉","🎣","⚓","⛓️"])
var validBlades=(["🔪","🗡️","🪛","🪚","🪓","✒️","🖋️","🖊️","🏹","🪝","🦷","✂️","🔱","⚔️","💉"])
var castTypes=(["⚡️","☄️","🍭","🔥","🪄","🥢","🌙","🎐","🎋","🖌️","📔","📘","📓"])
var validBaits=(["🪱","🦋","🐝","🐞","🦟","🦗","🐜","🪲","🪰","🪳","🕷","🦐","🦂","🍤","🐙","🐛","🦑","🐌"])
var validRess=["🫀","💾","♥️","🫁","🏵️","🛟","📼","💿"];

// Fishing bait quality: higher = wider success zone.
var baitQuality = {
  "🐞": 4,  // ladybug - awesome
  "🪱": 3,  // earthworm — great
  "🦐": 3,  // shrimp — great
  "🐙": 3,  // octopus — great
  "🪲": 2,  // beetle
  "🦂": 2,  // scorpion
  "🍤": 2,  // fried shrimp
  "🦑": 2,  // squid
  "🪰": 1,  // fly
  "🦋": 1,  // butterfly
  "🐛": 1,  // caterpillar
  "🐝": 0,  // bee
  "🦗": 0,  // cricket
  "🕷": 0,  // spider
  "🐜": -1, // ant - bad (small)
  "🐌": -1, // snail - bad (slimy)
  "🦟": -1, // mosquito — bad (small)
  "🪳": -2, // cockroach — terrible
};

//Adventure logging
var actionString; //Initial action log below
var actionLog = "";
var adventureLog = actionLog;
var adventureEncounterCount = 1;
var encounterCount = 0;      // total encounters this run; incremented by nextEncounter()
var runStartTimestamp = 0;   // Date.now() at run start; wall-clock anchor only — NOT playtime

// ── Active playtime ──────────────────────────────────────────────────────────
// runStartTimestamp alone measures wall clock, which counts every day a saved run
// sits idle between sessions (observed: run_end rows reporting 5+ days of "playtime").
// These track only the time the tab was actually visible.
//   playtimeSegmentStart = 0 means "paused"; non-zero is the start of the live stretch.
var playtimeBankedMs     = 0;
var playtimeSegmentStart = Date.now();

function bankPlaytime() {
  if (playtimeSegmentStart) playtimeBankedMs += Date.now() - playtimeSegmentStart;
  playtimeSegmentStart = 0;
}

function resumePlaytime() {
  if (!playtimeSegmentStart) playtimeSegmentStart = Date.now();
}

// Milliseconds of active play this run. Used for persistence — saving the rounded
// second value would drop sub-second remainder on every redraw() and drift low.
function getActivePlaytimeMs() {
  var live = playtimeSegmentStart ? (Date.now() - playtimeSegmentStart) : 0;
  return Math.max(0, playtimeBankedMs + live);
}

// Seconds of active play this run. Use this everywhere instead of runStartTimestamp.
function getActivePlaytime() {
  return Math.floor(getActivePlaytimeMs() / 1000);
}

var playerRevivesThisRun = 0; // reincarnations this run; reset in renewPlayer()
var playerOriginName = '';   // origin name applied at game start; '' = no origin
var cheatedThisRun = false;  // set by logCheatUse(); reset each new run; blocks score submission
var scoreBaselineStats = 0; // sum of stats at run start (after origin); subtracted from score formula
var adventureEndReason = "";

//Area init
var previousArea;
var areaName;

//Enemy stats init
var enemyEmoji;
var enemyName;
var enemyHp;
var enemyAtk;
var enemySta;
var enemyLck;
var enemyInt;
var enemyMgk;
var enemyDef;
var enemyType;
var previousEnemyType;
var enemyContainerNumber = 0;
var enemyTeam = "";
var enemyDesc;
var enemyMsg;
var enemyQuestItems;
var enemyFamiliar = false;

var enemyHpLost = 0;
var enemyStaLost = 0;
var enemyAtkBonus = 0;
var enemyIntBonus = 0;
var enemyMgkLost = 0;

var reincarnateEnemyHpLost = 0;
var reincarnateEnemyStaLost = 0;
var reincarnateEnemyMgkLost = 0;
var reincarnateEnemyAtkBonus = 0;
var currentProphercy;
var enemyEmojiScaleX;
var enemyBossType = "";
var enemyCursed=false;

var totalBonus=0;
var totalMalus=0;

//Global vars
var storyData;
var linesStory;
var linesLoot;
var linesGenerator;
var encounterIndex;
var lastEncounterIndex;
var lastGeneratorName = "none";
var lootTotal;
var randomEncounterIndex;
var lootEncounterIndex;
var isFishing = false;
var encounterUsed=false;
var seenEncounters = [];

// Equipment slots — one item each; null when empty
var playerSlotHead    = null; // { emoji, name, hp, atk, sta, lck, int, mgk, def, slot, note, desc }
var playerSlotWeapon  = null;
var playerSlotChest   = null;
var playerSlotLegs    = null;
var playerSlotTrinket = null;
// Full inventory list — all grabbed non-coin items with their original stat snapshot
var playerInventory  = []; // array of snapshots (same shape as slot objects)

// Set by loadEncounter when enemyType starts with "Item-"; null for generic items
var enemyItemSlot = null; // "head" | "weapon" | "chest" | "legs" | "trinket" | null

var corpseState = ""; // "" | "killed" | "neutralized"
var corpseSnapshot = null; // saved enemy data for neutralized wake-up
var corpseHasLoot = false;
var corpseLoot = null;

// Loot choice context — set before pushing a corpse drop encounter so the overlay can pick the right string pool
var _lootChoiceContext = 'prop'; // 'prop' | 'corpse'
// Raw CSV row of the encounter currently loaded — captured in loadEncounter() for LootChoiceManager
var _currentRawRow = null;
var levelUpSavedCorpse = null;  // full corpse state snapshot saved before level-up wipes it; restored after Upgrade resolves

//Global vars - UIElements
var areaUIElement;
var nameUIElement;
var cardUIElement;
var emojiUIElement;
var emojiWrapperUIElement;
var emojiFlipperUIElement;
var enemyInfoUIElement;
var playerInfoUIElement;
var toolbarCardUIElement;
var enemyTeamUIElement;
var versusTextUIElement;
var buttonsContainer;

var grabColor=colorWhite;
var eatColor=colorWhite;

// Set by ActionBar before invoking each callback; read and cleared once at the top of resolveAction.
// null  = no skill check (backwards compat)
// true  = skill check passed
// false = skill check failed
var actionBarSuccess = null;

var vibrationEnabled = (function () {
  try { return localStorage.getItem('sd_vibration') !== 'false'; } catch (e) { return true; }
})();

// null = no crit, 'success' = critical success zone hit, 'fail' = critical fail zone hit
var actionBarCrit = null;

var playerCritSuccesses     = 0;  // cumulative crit successes this run (+1 to score each)
var playerCritFails         = 0;  // cumulative crit fails this run (-1 to score each)
var playerFishCatches       = 0;  // successful fish catches this run (+2 to score each)
var playerFishSkillBonus    = 0;  // level-up fishing perk stacks — widens pass/crit zones
var playerAreaSleepCount    = 0;  // non-combat sleeps in the current area (resets on area change)
var playerTotalSleepPenalty = 0;  // accumulated score penalty from oversleeping per area (-1 each)
