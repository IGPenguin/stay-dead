// ── Companion Manager ─────────────────────────────────────────────────────────
// Companion bark system — ambient pet/follower reactions at non-combat encounters.
// Loaded before encounter-loader.js so _clearCompanionBark is available for the
// encounterRenew() IIFE. Future home for deeper companion logic (PET-SLOT, COMP-PLAY).

// ── Name Pools ────────────────────────────────────────────────────────────────

var _PET_NAMES      = ["Jekyll","Pluto","Kerberos","Deimos","Herakles","Perseus","Phobos","Atlas","Argos","Kratos","Morpheus"];
var _FOLLOWER_NAMES = ["Orpheus","Aegeus","Icarus","Leander","Evander","Theron","Meleager","Lysander","Patroclus","Diomedes","Odysseus"];

function getRandomPetName()      { return _PET_NAMES[Math.floor(Math.random() * _PET_NAMES.length)]; }
function getRandomFollowerName() { return _FOLLOWER_NAMES[Math.floor(Math.random() * _FOLLOWER_NAMES.length)]; }

var _BARK_CHANCE  = 0.10;
var _FETCH_CHANCE = 0.02;
var _BARK_DELAY   = 2500;

// ── Type Classification ───────────────────────────────────────────────────────

var _COMPANION_DOGS    = ['🐶','🐕','🐩','🐺','🦮','🐕‍🦺','🦦'];
var _COMPANION_CATS    = ['🐱','🐈','🐈‍⬛','🐅','🐆','🦁'];
var _COMPANION_BIRDS   = ['🐓','🐦','🐦‍⬛','🦜','🦚','🦢','🦅','🦉','🐥','🦩'];
var _COMPANION_LIZARDS = ['🦎','🐊','🦕'];
var _COMPANION_CRITTERS= ['🐞','🐝','🪲','🐛','🦗','🪳','🦟'];
var _COMPANION_RODENTS = ['🦝','🐀','🐇','🐹','🦔','🐭'];
var _COMPANION_LARGE   = ['🦄','🐴','🦙','🦓','🐎','🐘','🦛','🦏','🫏','🦒','🐪','🐫'];

// ── Bark Pools ────────────────────────────────────────────────────────────────

var _BARK_POOLS = {
  dog: [
    { icon: '🗯️', text: 'Barks in an excited voice.' },
    { icon: '❤️',  text: 'Asks for belly rubs.' },
    { icon: '💧',  text: 'Marks their territory.' },
    { icon: '🐾',  text: 'Sniffs around suspiciously.' },
    { icon: '💤',  text: 'Curls up against your leg.' },
    { icon: '🗯️', text: 'Growls at something unseen.' },
    { icon: '🐾',  text: 'Circles the area restlessly.' },
    { icon: '💩',  text: 'Takes a stinky relief.' },
    { icon: '🐾',  text: 'Chases something not there.' },
    { icon: '💦',  text: 'Shakes water from their coat.' },
    { icon: '🦴',  text: 'Buries something small.' },
    { icon: '🐾',  text: 'Paws at your leg insistently.' },
    { icon: '🗯️', text: 'Whimpers at nothing.' },
    { icon: '🦠',  text: 'Tracks some interesting scent.' },
    { icon: '❤️',  text: 'Wags with full commitment.' },
    { icon: '🐾',  text: 'Sits between you and the dark.' },
    { icon: '🐾',  text: 'Licks a wound you did not notice.' },
    { icon: '💤',  text: 'Lies where someone used to sleep.' },
    { icon: '❤️',  text: 'Lies at your feet and stays.' },
    { icon: '🗯️', text: 'Howls once at nothing, then stops.' },
  ],
  cat: [
    { icon: '🗯️', text: 'Meows very loud for no reason.' },
    { icon: '👀',  text: 'Makes a quick eye contact.' },
    { icon: '🐾',  text: 'Plays with a tiny insect.' },
    { icon: '💤',  text: 'Ignores you completely.' },
    { icon: '🗯️', text: 'Hisses at the darkness.' },
    { icon: '❤️',  text: 'Headbutts your ankle.' },
    { icon: '💨',  text: 'Zooms around for no reason.' },
    { icon: '💩',  text: 'Takes a stinky relief.' },
    { icon: '🐾',  text: 'Kneads the air with both paws.' },
    { icon: '👀',  text: 'Stares upward for too long.' },
    { icon: '💤',  text: 'Curls up to fall asleep.' },
    { icon: '🐾',  text: 'Plays with your shoelaces.' },
    { icon: '🐾',  text: 'Sits on what you need most.' },
    { icon: '👅',  text: 'Grooms with excessive dignity.' },
    { icon: '🐾',  text: 'Knocks something over calmly.' },
    { icon: '👀',  text: 'Sits beside something dead.' },
    { icon: '👀',  text: 'Stares at the dead ground.' },
    { icon: '👀',  text: 'Watches the shadows move.' },
    { icon: '🐾',  text: 'Avoids stale air currents.' },
    { icon: '❤️',  text: 'Presses against you and stays.' },
    { icon: '🗯️', text: 'Cries once into the open air.' },
  ],
  bird: [
    { icon: '🎶',  text: 'Sings a happy melody.' },
    { icon: '🗯️', text: 'Shrieks at something.' },
    { icon: '👀',  text: 'Stares at you sideways.' },
    { icon: '🎶',  text: 'Mimics a recent sound.' },
    { icon: '🪶',  text: 'Ruffles their feathers.' },
    { icon: '💤',  text: 'Tucks head under a wing.' },
    { icon: '🎶',  text: 'Whistles part of a melody.' },
    { icon: '🗯️', text: 'Squawks your name wrong.' },
    { icon: '🐾',  text: 'Bobs their head rhythmically.' },
    { icon: '👀',  text: 'Tracks something distant.' },
    { icon: '🎶',  text: 'Calls out to no response.' },
    { icon: '💨',  text: 'Flaps wings, stays grounded.' },
    { icon: '🐾',  text: 'Hops sideways on a ledge.' },
    { icon: '🗯️', text: 'Mutters in bird language.' },
    { icon: '❤️',  text: 'Tugs a feather from your coat.' },
    { icon: '🎶',  text: 'Sings a sad note of grief.' },
    { icon: '🪶',  text: 'Perches where the road ends.' },
    { icon: '👀',  text: 'Circles low, watching you closely.' },
    { icon: '💤',  text: 'Falls quiet without a reason.' },
    { icon: '🎶',  text: 'Sings softer as the light fades.' },
  ],
  humanoid: [
    { icon: '💬',  text: 'Sighs with tiresome exhaustion.' },
    { icon: '💬',  text: 'Mutters something under breath.' },
    { icon: '👀',  text: 'Checks the surroundings nervously.' },
    { icon: '✊',  text: 'Cracks their knuckles.' },
    { icon: '👐',  text: 'Shrugs as you look at them.' },
    { icon: '🎶',  text: 'Quietly hums an old hymn.' },
    { icon: '💬',  text: 'Tells a joke nobody asked for.' },
    { icon: '👀',  text: 'Peers around the next corner.' },
    { icon: '🍞',  text: 'Produces food from somewhere.' },
    { icon: '💬',  text: 'Sighs deeply and says nothing.' },
    { icon: '🗡️', text: 'Checks their weapon again.' },
    { icon: '💬',  text: 'Asks if we are there yet.' },
    { icon: '👀',  text: 'Points at something, says nothing.' },
    { icon: '💬',  text: 'Repeats the same old story.' },
    { icon: '🙌',  text: 'Stretches with satisfaction.' },
    { icon: '👀',  text: 'Silently looks in the distance.' },
    { icon: '💬',  text: 'Does not speak. Just stays close.' },
    { icon: '👀',  text: 'Stares at the road behind you.' },
    { icon: '👋',  text: 'Places a hand on your shoulder.' },
    { icon: '💬',  text: 'Folds something to hide it away.' },
  ],
  lizard: [
    { icon: '👀',  text: 'Flicks tongue at the air.' },
    { icon: '💤',  text: 'Basks in place, motionless.' },
    { icon: '🐾',  text: 'Scurries up the nearest wall.' },
    { icon: '👀',  text: 'Eyes you without blinking.' },
    { icon: '🗯️', text: 'Puffs throat in alarm.' },
    { icon: '💤',  text: 'Freezes and becomes a statue.' },
    { icon: '🐾',  text: 'Detaches tail without warning.' },
    { icon: '🗯️', text: 'Hisses without moving at all.' },
    { icon: '👀',  text: 'Rotates one eye independently.' },
    { icon: '🐾',  text: 'Climbs somewhere inaccessible.' },
    { icon: '💤',  text: 'Goes cold and still in shade.' },
    { icon: '🪰', text: 'Devours a tiny fly.' },
    { icon: '🐾',  text: 'Darts sideways at full speed.' },
    { icon: '👀',  text: 'Tracks a fly with precise focus.' },
    { icon: '👅',  text: 'Licks their own eye clean.' },
    { icon: '👀',  text: 'Does not move when a shadow passes.' },
    { icon: '💤',  text: 'Sits on something cold and waits.' },
    { icon: '🐾',  text: 'Zooms around searching for food.' },
    { icon: '👀',  text: 'Watches something unseen decay.' },
    { icon: '💤',  text: 'Stays where the warmth lingers.' },
  ],
  critter: [
    { icon: '🗯️', text: 'Buzzes around your head.' },
    { icon: '🐾',  text: 'Lands on your shoulder.' },
    { icon: '🐾',  text: 'Crawls in a confused circle.' },
    { icon: '🗯️', text: 'Makes a small, proud sound.' },
    { icon: '🌸',  text: 'Pollinates something nearby.' },
    { icon: '🐾',  text: 'Climbs up and falls right back.' },
    { icon: '✨',  text: 'Glows briefly for no reason.' },
    { icon: '🗯️', text: 'Stridulates in the dark.' },
    { icon: '💨',  text: 'Vanishes into a tiny crack.' },
    { icon: '👀',  text: 'Watches you from a leaf.' },
    { icon: '🗯️', text: 'Makes an annoying loud sound.' },
    { icon: '🐾',  text: 'Finds something rotten to eat.' },
    { icon: '💤',  text: 'Goes still and waits.' },
    { icon: '🐾',  text: 'Drags something much too large.' },
    { icon: '🌿',  text: 'Blends into the surroundings.' },
    { icon: '🐾',  text: 'Clings to your coat in the cold.' },
    { icon: '💤',  text: 'Goes still when the wind dies.' },
    { icon: '🐾',  text: 'Crawls toward the darkest corner.' },
    { icon: '✨',  text: 'Pulses once, then goes dark.' },
    { icon: '🎶',  text: 'Hums faintly in the silence.' },
  ],
  rodent: [
    { icon: '👀',  text: 'Sniffs at the air.' },
    { icon: '🐾',  text: 'Nibbles at something nearby.' },
    { icon: '👀',  text: 'Watches from a distance.' },
    { icon: '🐾',  text: 'Tries to steal something.' },
    { icon: '💨',  text: 'Scurries into a crack.' },
    { icon: '🐾',  text: 'Grooms furiously for a moment.' },
    { icon: '🗯️', text: 'Squeaks once, very loudly.' },
    { icon: '🐾',  text: 'Stuffs cheeks with whatever.' },
    { icon: '👀',  text: 'Stops cold at an unheard sound.' },
    { icon: '💨',  text: 'Bolts and returns immediately.' },
    { icon: '🐾',  text: 'Digs at nothing in particular.' },
    { icon: '🗯️', text: 'Chitters nervously at nothing.' },
    { icon: '🐾',  text: 'Buries something at your feet.' },
    { icon: '💤',  text: 'Curls into a tight little ball.' },
    { icon: '👀',  text: 'Peeks out from a hiding spot.' },
    { icon: '👀',  text: 'Does not flee. Just watches.' },
    { icon: '💤',  text: 'Tucks itself against your boot.' },
    { icon: '🐾',  text: 'Sits at the edge of the light.' },
    { icon: '💤',  text: 'Curls in tight and does not move.' },
    { icon: '🗯️', text: 'Squeaks softly and says nothing.' },
  ],
  large: [
    { icon: '🗯️',  text: 'Huffs loud impatiently.' },
    { icon: '🐾',  text: 'Stamps a hoof in silence.' },
    { icon: '🗯️',  text: 'Snorts with a relief.' },
    { icon: '👀',  text: 'Flicks ears toward something.' },
    { icon: '💧',  text: 'Nuzzles you with full force.' },
    { icon: '🌿',  text: 'Grazes on something nearby.' },
    { icon: '🗯️',  text: 'Calls out to the distance.' },
    { icon: '💨',  text: 'Shakes their whole body once.' },
    { icon: '🐾',  text: 'Leans against you, heavily.' },
    { icon: '👀',  text: 'Stares at the horizon steadily.' },
    { icon: '💧',  text: 'Drools from their maw.' },
    { icon: '🗯️',  text: 'Makes a sound like thunder.' },
    { icon: '🐾',  text: 'Stomps a front leg decisively.' },
    { icon: '💤',  text: 'Falls asleep standing up.' },
    { icon: '❤️',  text: 'Headbutts you, gently.' },
    { icon: '👀',  text: 'Stands very still, ears up.' },
    { icon: '💤',  text: 'Refuses to move forward.' },
    { icon: '💧',  text: 'Sheds a tear for a lost friend.' },
    { icon: '💤',  text: 'Lowers its head to the ground.' },
    { icon: '❤️',  text: 'Scratches with your shoulder.' },
  ],
};

// ── Death Bark Pools ──────────────────────────────────────────────────────────

var _DEATH_BARK_POOLS = {
  dog: [
    { icon: '🗯️', text: 'Whimpers once, then goes quiet.' },
    { icon: '💤', text: 'Lies down beside you and stays.' },
    { icon: '🐾', text: 'Nudges your hand with their nose.' },
    { icon: '🗯️', text: 'Howls once. Nobody hears it.' },
    { icon: '💧', text: 'Licks your face. You do not stir.' },
  ],
  cat: [
    { icon: '🐾', text: 'Waits a bit, then starts eating your face.' },
    { icon: '💤', text: 'Curls up on your corpse for warmth.' },
    { icon: '👀', text: 'Sits on your chest. Stares into nothing.' },
    { icon: '🗯️', text: 'Meows once at your body and leaves.' },
    { icon: '🗯️', text: 'Meows at your body until something answers.' },
  ],
  bird: [
    { icon: '🗯️', text: 'Shrieks once at the empty air.' },
    { icon: '🎶', text: 'Sings your name to the silence.' },
    { icon: '💨', text: 'Takes flight and does not return.' },
    { icon: '🪶', text: 'Drops a feather on your chest.' },
    { icon: '🎶', text: 'Calls out until the echo stops.' },
  ],
  lizard: [
    { icon: '👀', text: 'Blinks once, then moves on.' },
    { icon: '💤', text: 'Basks on your body in the warmth.' },
    { icon: '🐾', text: 'Scurries over you without pause.' },
    { icon: '👀', text: 'Does not appear to notice.' },
    { icon: '💤', text: 'Presses flat against you for warmth.' },
  ],
  critter: [
    { icon: '🐾', text: 'Crawls slowly across your face.' },
    { icon: '💤', text: 'Settles near your cold hand.' },
    { icon: '✨', text: 'Glows dimly above your body.' },
    { icon: '🗯️', text: 'Buzzes once. Then stops.' },
    { icon: '🌿', text: 'Makes a home in your coat pocket.' },
  ],
  rodent: [
    { icon: '🐾', text: 'Steals something from your pocket.' },
    { icon: '🗯️', text: 'Squeaks once at your body.' },
    { icon: '💤', text: 'Curls up beside you and stays.' },
    { icon: '🐾', text: 'Buries something small beside you.' },
    { icon: '👀', text: 'Watches from a nearby shadow.' },
  ],
  large: [
    { icon: '🗯️', text: 'Calls out once into the darkness.' },
    { icon: '🐾', text: 'Stands over your body, does not move.' },
    { icon: '💧', text: 'Nuzzles your hand and does not leave.' },
    { icon: '💤', text: 'Lies down beside you in the dirt.' },
    { icon: '🗯️', text: 'Stamps the ground. Once. Again.' },
  ],
  humanoid: [
    { icon: '💬', text: 'Says nothing, just stands there.' },
    { icon: '💬', text: 'Tries to wake you one last time.' },
    { icon: '👀', text: 'Checks for a pulse. Finds none.' },
    { icon: '💬', text: 'Closes your eyes with one hand.' },
    { icon: '💬', text: 'Swears quietly, then goes silent.' },
    { icon: '👋', text: 'Holds your hand for a moment.' },
    { icon: '💬', text: "Says your name, you don't answer." },
    { icon: '🗡️', text: 'Picks up your weapon, stands guard.' },
  ],
};

function fireDeathBarks() {
  if (!playerPartyString || !String(playerPartyString).trim()) return;
  [...playerPartyString].forEach(function(emoji) {
    var _type, _name;
    if      (_COMPANION_DOGS.includes(emoji))     { _type = 'dog';      _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_CATS.includes(emoji))     { _type = 'cat';      _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_BIRDS.includes(emoji))    { _type = 'bird';     _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_LIZARDS.includes(emoji))  { _type = 'lizard';   _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_CRITTERS.includes(emoji)) { _type = 'critter';  _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_RODENTS.includes(emoji))  { _type = 'rodent';   _name = petName[emoji] || 'companion'; }
    else if (_COMPANION_LARGE.includes(emoji))    { _type = 'large';    _name = petName[emoji] || 'companion'; }
    else                                           { _type = 'humanoid'; _name = followerName[emoji] || petName[emoji] || 'companion'; }
    var _pool = _DEATH_BARK_POOLS[_type] || _DEATH_BARK_POOLS.humanoid;
    var _b = _pool[Math.floor(Math.random() * _pool.length)];
    logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + '</i>');
    AchievementManager.queueCompanionBark(_b.icon, emoji + ' ' + _name, _b.text);
  });
  redraw();
}

// ── Companion Bark Toast ───────────────────────────────────────────────────────
// color = undefined/null → white border, no flash (ambient bark).
// color = hex/css string → colored border + flash (fetch reward).
function showCompanionBarkToast(barkIcon, name, text, color, onDone) {
  var old = document.getElementById('achievement_toast');
  if (old) old.remove();

  var toast = document.createElement('div');
  toast.id = 'achievement_toast';

  var _border = color || '#ffffff';

  toast.innerHTML =
    '<div style="display:flex; align-items:center; gap:10px; padding:7px 0px 8px 12px; margin-bottom:-8px;">'
      + '<span style="font-size:22px; line-height:1; flex-shrink:0;">' + barkIcon + '</span>'
      + '<div style="flex:1;">'
        + '<h5 style="margin:-2px 0 0 0; font-size:16px; line-height:1.2; font-style:italic; font-weight:400; color:#ffffff; text-align:left;">' + text + '</h5>'
        + '<h5 style="margin:2px 0 4px 0; color:#aaaaaa; font-size:14px; text-align:left;">' + name + '</h5>'
      + '</div>'
    + '</div>';

  toast.style.cssText =
    'position:absolute; top:0; left:3px; right:3px;' +
    'z-index:9999; pointer-events:none; box-sizing:border-box;' +
    'background-color:#272727; overflow:hidden;' +
    'box-shadow:0 0 0 3px ' + _border + ';' +
    'opacity:0; transition:opacity 0.3s;';

  var _el = document.getElementById('id_action_bar_area');
  if (!_el) return;
  _el.appendChild(toast);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { toast.style.opacity = '1'; });
  });

  if (color) {
    var _flash = function(n) {
      if (n <= 0) return;
      setTimeout(function() {
        if (document.getElementById('achievement_toast') !== toast) return;
        toast.style.boxShadow = '0 0 0 3px #fff, 0 0 8px ' + color;
        setTimeout(function() {
          if (document.getElementById('achievement_toast') !== toast) return;
          toast.style.boxShadow = '0 0 0 3px ' + color;
          _flash(n - 1);
        }, 350);
      }, n === 3 ? 200 : 180);
    };
    _flash(3);
  }

  setTimeout(function() {
    if (document.getElementById('achievement_toast') !== toast) return;
    toast.style.transition = 'opacity 2s';
    toast.style.opacity = '0';
    setTimeout(function() {
      if (document.getElementById('achievement_toast') === toast) toast.remove();
      if (onDone) onDone();
    }, 2300);
  }, 4000);
}

// ── Bark Timer ────────────────────────────────────────────────────────────────
// _clearCompanionBark() is called from encounterRenew() on every navigation,
// ensuring a pending bark from the previous encounter never fires after the player moves on.

var _companionBarkTimer = null;

function _clearCompanionBark() {
  if (_companionBarkTimer) { clearTimeout(_companionBarkTimer); _companionBarkTimer = null; }
}

// Encounter types that should never trigger a companion bark.
var _BARK_SKIP_TYPES = [
  'Standard','Heavy','Small','Hot','Stingy','Swift','Tough','Toxic','Reflective',
  'Demon','Undead','Spirit','Pet','Recruit',
  'Item','Consumable','Shop','Upgrade','Checkpoint'
];

// Called at the end of loadEncounter(). Schedules a companionBark 3s after load
// if the encounter is non-combat and at least one companion is in the party.
function _scheduledCompanionBark() {
  _clearCompanionBark();
  if (isEndingState) return;
  if (_BARK_SKIP_TYPES.indexOf(enemyType) !== -1 || enemyType.startsWith('Item') || enemyType.startsWith('Consumable') || enemyType.includes('Boss')) return;

  var _p = _partyEmojis();
  if (_p.length === 0) return;

  _companionBarkTimer = setTimeout(function() {
    _companionBarkTimer = null;
    if (typeof ActionBar !== 'undefined') ActionBar.cancelActionBar();
    var _party = _partyEmojis();
    if (_party.length === 0) return;
    var _shuffled = _party.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < _shuffled.length; i++) {
      if (companionBark(_shuffled[i])) return;
    }
  }, _BARK_DELAY);
}

// Returns the party string split into grapheme clusters (respects ZWJ sequences
// like 🐈‍⬛ and 🐕‍🦺). Uses Intl.Segmenter when available; falls back to
// code-point iteration filtered of ZWJ/VS16 on older runtimes.
function _partyEmojis() {
  var str = String(playerPartyString || '');
  if (!str) return [];
  var segs;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    segs = [...new Intl.Segmenter().segment(str)].map(function(s) { return s.segment; });
  } else {
    segs = [...str].filter(function(e) {
      var c = e.codePointAt(0);
      return c !== 0x200D && c !== 0xFE0F;
    });
  }
  return segs.filter(function(e) { return e.trim().length > 0 && (petName[e] || followerName[e]); });
}

// ── Fetch Barks ───────────────────────────────────────────────────────────────
// Log lines and icons for each type's 1% special fetch. 5 variations per type.

var _FETCH_BARKS = {
  dog: [
    { icon: '🎁', text: 'Digs up something valuable.' },
    { icon: '🎁', text: 'Zooms back with a rare find.' },
    { icon: '🎁', text: 'Sniffed out something hidden.' },
    { icon: '🎁', text: 'Drags something over with pride.' },
    { icon: '🎁', text: 'Returns with something in their mouth.' },
  ],
  cat: [
    { icon: '🎁', text: 'Bats something small toward you.' },
    { icon: '🎁', text: 'Deposits a live catch at your feet.' },
    { icon: '🎁', text: 'Drops something wriggling nearby.' },
    { icon: '🎁', text: 'Presents a catch with indifference.' },
    { icon: '🎁', text: 'Leaves something wiggling.' },
  ],
  bird: [
    { icon: '🥚', text: 'Lays something small and warm.' },
    { icon: '🥚', text: 'Deposits an egg without ceremony.' },
    { icon: '🥚', text: 'Nests briefly, then stands again.' },
    { icon: '🥚', text: 'Leaves something pale behind.' },
    { icon: '🥚', text: 'Produces something round and quiet.' },
  ],
  humanoid: [
    { icon: '🍞', text: 'Splits what little they had.' },
    { icon: '🍞', text: 'Pulls something from their pack.' },
    { icon: '🍞', text: 'Finds a forgotten stash nearby.' },
    { icon: '🍞', text: 'Produces rations from somewhere.' },
    { icon: '🍞', text: 'Offers what they were keeping.' },
  ],
  lizard: [
    { icon: '🥚', text: 'Leaves something leathery here.' },
    { icon: '🥚', text: 'Leaves a pale clutch behind.' },
    { icon: '🥚', text: 'Digs shallow. Leaves something.' },
    { icon: '🥚', text: 'Lays in silence, then walks on.' },
    { icon: '🥚', text: 'Settles it somewhere warm.' },
  ],
  critter: [
    { icon: '✨', text: 'Lands briefly on your open palm.' },
    { icon: '✨', text: 'Lands on your wrist and lingers.' },
    { icon: '✨', text: 'Crawls close in a moment of clarity.' },
    { icon: '✨', text: 'Rests still long enough to matter.' },
    { icon: '✨', text: 'Settles on your skin to lift off.' },
  ],
  rodent: [
    { icon: '🎁', text: 'Returns with full cheeks.' },
    { icon: '🎁', text: 'Drags something edible from a crack.' },
    { icon: '🎁', text: 'Stuffs your pocket with a find.' },
    { icon: '🎁', text: 'Surfaces with something to share.' },
    { icon: '🎁', text: 'Leaves a small hoard at your feet.' },
  ],
  large: [
    { icon: '💚', text: 'Carries your load a while.' },
    { icon: '💚', text: 'Lets you lean on them.' },
    { icon: '💚', text: 'Breathes slow. So do you.' },
    { icon: '💚', text: 'Steadies you with presence.' },
    { icon: '💚', text: 'Lowers their weight to you.' },
  ],
};

// Dispatches the 1% special fetch per companion type:
//   dog     — Item from current area (encounter-splice)
//   cat / humanoid / rodent — Consumable from current area (encounter-splice)
//   bird / lizard — hardcoded egg consumable (encounter-splice)
//   critter — +1 LCK directly
//   large   — +1 STA directly (capped at playerStaMax)
function _companionFetch(_type, emoji, _name) {
  if (!linesStory || !linesStory[encounterIndex]) return;
  var _fb   = _FETCH_BARKS[_type] || _FETCH_BARKS.dog;
  var _b    = _fb[Math.floor(Math.random() * _fb.length)];
  var _area = linesStory[encounterIndex][0].split(':').slice(1).join(':');

  var _displayName = emoji + ' ' + _name;

  if (_type === 'critter') {
    playerLck++;
    logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + ' +1 🍀</i>');
    AchievementManager.queueCompanionBark(_b.icon, _displayName, _b.text + ' +1 🍀', colorSoftGreen);
    redraw();
    return;
  }
  if (_type === 'large') {
    playerSta = Math.min(playerSta + 1, playerStaMax + 1);
    logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + ' +1 🟢</i>');
    AchievementManager.queueCompanionBark(_b.icon, _displayName, _b.text + ' +1 🟢', colorSoftGreen);
    redraw();
    return;
  }
  if (_type === 'bird' || _type === 'lizard') {
    var _eggName = (_type === 'lizard') ? "Lizard's Egg" : "Bird's Egg";
    var _egg = [
      'area:' + _area, 'emoji:🥚', 'name:' + _eggName, 'type:Consumable',
      'hp:1', 'atk:0', 'sta:0', 'lck:0', 'int:0', 'mgk:0', 'def:0',
      'note:', 'desc:Laid by ' + emoji + ' ' + _name + '.<br>Provides <b>+1 ❤️ Health</b>, restores <b>🟢 Energy</b>.',
      'message:', 'achiev:none'
    ];
    logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + '</i>');
    AchievementManager.queueCompanionBark(_b.icon, _displayName, _b.text, RarityManager.getColor(_rarityFromRow(_egg)));
    linesStory.splice(encounterIndex + 1, 0, _egg);
    redraw();
    return;
  }

  var _fetchTypes = (_type === 'dog') ? ['Item'] : ['Consumable'];
  var _excludes   = ["Lover's Memento", "Piece of History", "Lost Possession"];
  var _fetched    = getWeightedEncounter(_fetchTypes, [], _area, _excludes);
  if (!_fetched) return;
  logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + '</i>');
  AchievementManager.queueCompanionBark(_b.icon, _displayName, _b.text, RarityManager.getColor(_rarityFromRow(_fetched)));
  linesStory.splice(encounterIndex + 1, 0, _fetched);
  redraw();
}

// ── companionBark ─────────────────────────────────────────────────────────────
// Takes a companion emoji from the party. Classifies it, looks up the name from
// the petName/followerName maps, then rolls _FETCH_CHANCE and _BARK_CHANCE.
// Returns true if any action fired (used by the scheduler to stop iteration).
function companionBark(emoji) {
  var _type, _name;
  if (_COMPANION_DOGS.includes(emoji)) {
    _type = 'dog';      _name = petName[emoji] || 'companion';
  } else if (_COMPANION_CATS.includes(emoji)) {
    _type = 'cat';      _name = petName[emoji] || 'companion';
  } else if (_COMPANION_BIRDS.includes(emoji)) {
    _type = 'bird';     _name = petName[emoji] || 'companion';
  } else if (_COMPANION_LIZARDS.includes(emoji)) {
    _type = 'lizard';   _name = petName[emoji] || 'companion';
  } else if (_COMPANION_CRITTERS.includes(emoji)) {
    _type = 'critter';  _name = petName[emoji] || 'companion';
  } else if (_COMPANION_RODENTS.includes(emoji)) {
    _type = 'rodent';   _name = petName[emoji] || 'companion';
  } else if (_COMPANION_LARGE.includes(emoji)) {
    _type = 'large';    _name = petName[emoji] || 'companion';
  } else {
    _type = 'humanoid'; _name = followerName[emoji] || petName[emoji] || 'companion';
  }

  if (Math.random() < _FETCH_CHANCE) { _companionFetch(_type, emoji, _name); return true; }

  if (Math.random() < _BARK_CHANCE) {
    var _pool = _BARK_POOLS[_type] || _BARK_POOLS.humanoid;
    var _b = _pool[Math.floor(Math.random() * _pool.length)];
    logAction(emoji + '&nbsp;▸&nbsp;' + _b.icon + ' <i>' + _b.text + '</i>');
    AchievementManager.queueCompanionBark(_b.icon, emoji + ' ' + _name, _b.text);
    redraw();
    return true;
  }
  return false;
}
