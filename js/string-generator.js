function _getCurrentNameEmoji() {
  if (playerEmoji) return playerEmoji;
  var lootEmojis = ['👺','🐴','🐷'];
  for (var i = 0; i < lootEmojis.length; i++) {
    if (playerName.startsWith(lootEmojis[i] + ' ')) return lootEmojis[i];
  }
  return '';
}

function renameCharacter(onDone) {
  var currentEmoji = _getCurrentNameEmoji();
  var displayName = playerName;
  if (currentEmoji && displayName.startsWith(currentEmoji + ' ')) {
    displayName = displayName.slice(currentEmoji.length + 1);
  }
  showCompanionNameDialog('rename', displayName, function(chosenName) {
    if (chosenName === null) { if (onDone) onDone(playerName); return; }
    var newName = chosenName || 'Nameless';
    playerName = newName;
    redraw();
    if (onDone) onDone(playerName);
  }, function() {
    if (onDone) onDone(playerName); // cancelled — no change
  });
}

//String generators
function getFirstName(){
  return "Damned Soul";
}

function getOriginName(origin) {
  // Prestige name pools for Familiar (relentless / won't stay dead) and Legendary (mythic / ancient / heroic).
  // These tiers get exclusive vocabulary unavailable to lower tiers.
  var _achievId = (origin.achiev || '').trim();
  var _isFamiliar = !!(_achievId && _achievId !== 'none');
  var _net = RarityManager.calcNet(origin);
  var _tier = _isFamiliar ? 'Familiar' : RarityManager.getTierForNet(_net);

  if (_tier === 'Familiar' || _tier === 'Legendary') {
    var _s = { atk: origin.atk||0, hp: origin.hp||0, sta: origin.sta||0,
               lck: origin.lck||0, int: origin.int||0, mgk: origin.mgk||0 };
    var _dom = null, _domMax = 0;
    for (var _k in _s) { if (_s[_k] > _domMax) { _domMax = _s[_k]; _dom = _k; } }

    var adj, noun;
    if (_tier === 'Familiar') {
      switch (_dom) {
        case 'atk': adj  = chooseFrom(["Relentless","Unyielding","Tenacious","Dogged","Iron","Unbroken","Dauntless","Scarred"]);
                    noun = chooseFrom(["Brawler","Stalwart","Slugger","Combatant","Scrapper","Enforcer","Endurer","Ironside","Fighter"]); break;
        case 'hp':  adj  = chooseFrom(["Enduring","Indomitable","Resolute","Persevering","Weathered","Unyielding","Unmoved","Iron"]);
                    noun = chooseFrom(["Cornerstone","Rampart","Bedrock","Foundation","Holdout","Anchor","Pillar","Survivor","Bulwark"]); break;
        case 'mgk': adj  = chooseFrom(["Devoted","Persistent","Faithful","Tireless","Driven","Enduring","Unwavering","Fixed"]);
                    noun = chooseFrom(["Disciple","Zealot","Practitioner","Devotee","Adherent","Keeper","Seeker","Acolyte","Channeler"]); break;
        case 'sta': adj  = chooseFrom(["Ceaseless","Persistent","Unwavering","Haggard","Lean","Restless","Worn"]);
                    noun = chooseFrom(["Roamer","Strider","Trudger","Rover","Plodder","Runner","Pilgrim","Wanderer","Courier"]); break;
        case 'lck': adj  = chooseFrom(["Undying","Tenacious","Dogged","Unkillable","Marked","Fortunate","Wily","Star-Crossed"]);
                    noun = chooseFrom(["Chancer","Revenant","Scrapper","Holdout","Contender","Gambler","Survivor","Drifter","Believer"]); break;
        case 'int': adj  = chooseFrom(["Patient","Weathered","Shrewd","Careful","Still","Measured"]);
                    noun = chooseFrom(["Keeper","Witness","Watcher","Inquirer","Chronicler","Reader","Archivist","Sentinel","Counselor"]); break;
        default:    adj  = chooseFrom(["Relentless","Dogged","Undying","Unkillable","Iron"]);
                    noun = chooseFrom(["Revenant","Holdout","Contender","Scrapper","Remnant"]); break;
      }
    } else {
      switch (_dom) {
        case 'atk': adj  = chooseFrom(["Undying","Glorious","Immortal","Unconquered","Eternal"]);
                    noun = chooseFrom(["Conqueror","Champion","Destroyer","Warlord","Scourge"]); break;
        case 'hp':  adj  = chooseFrom(["Ancient","Immovable","Deathless","Eternal","Undying"]);
                    noun = chooseFrom(["Colossus","Titan","Monolith","Bastion","Sentinel"]); break;
        case 'mgk': adj  = chooseFrom(["Ancient","Exalted","Ascendant","Sacred","Archaic"]);
                    noun = chooseFrom(["Archon","Oracle","Hierophant","Archmage","Sorcerer"]); break;
        case 'sta': adj  = chooseFrom(["Eternal","Undying","Ancient","Deathless","Immortal","Boundless","Ceaseless","Perpetual","Restless"]);
                    noun = chooseFrom(["Shade","Pilgrim","Wayfarer","Courier","Wanderer"]); break;
        case 'lck': adj  = chooseFrom(["Blessed","Divine","Exalted","Anointed","Sacred"]);
                    noun = chooseFrom(["Prophet","Herald","Seer","Vessel","Omen","Augur","Chosen"]); break;
        case 'int': adj  = chooseFrom(["Ancient","Eternal","Exalted","Undying","Omniscient","Ageless","Primordial","Timeless"]);
                    noun = chooseFrom(["Oracle","Augur","Loremaster","Sibyl","Visionary","Archivist","Architect","Chronicler","Philosopher"]); break;
        default:    adj  = chooseFrom(["Ancient","Eternal","Immortal","Undying","Exalted"]);
                    noun = chooseFrom(["Legend","Titan","Champion","Archon","Hero"]); break;
      }
    }
    return adj + ' ' + noun;
  }

  var stats = {
    atk: origin.atk || 0,
    hp:  origin.hp  || 0,
    sta: origin.sta || 0,
    lck: origin.lck || 0,
    int: origin.int || 0,
    mgk: origin.mgk || 0
  };

  var dominant = null;
  var max = 0;
  for (var s in stats) {
    if (stats[s] > max) { max = stats[s]; dominant = s; }
  }

  if (!dominant) {
    var minVal = 0;
    var weakest = null;
    for (var s in stats) {
      if (stats[s] < minVal) { minVal = stats[s]; weakest = s; }
    }

    var adj, noun;
    if (!weakest) {
      adj  = chooseFrom(["Forgotten","Weary","Nameless","Pale","Worn","Tired","Grey","Plain","Quiet","Lost","Faded","Hollow"]);
      noun = chooseFrom(["Nobody","Commoner","Stranger","Remnant","Shade","Vagrant","Stray","Outcast","Wretch","Drifter","Soul","Castaway"]);
      return adj + ' ' + noun;
    }

    switch (weakest) {
      case 'hp':
        adj  = chooseFrom(["Brittle","Frail","Rotted","Decaying","Crumbling","Withered","Ruined","Blighted","Broken","Tattered"]);
        noun = chooseFrom(["Husk","Shade","Remnant","Castaway","Wretch","Exile","Vagrant","Pauper","Revenant","Specter"]);
        break;
      case 'sta':
        adj  = chooseFrom(["Heavy","Sluggish","Winded","Spent","Leaden","Exhausted","Bloated","Withered","Lumbering","Plodding"]);
        noun = chooseFrom(["Shambler","Straggler","Wretch","Sluggard","Plodder","Laggard","Lummox","Trudger","Clod","Castaway"]);
        break;
      case 'atk':
        adj  = chooseFrom(["Meek","Feeble","Faltering","Timid","Wavering","Harmless","Reluctant","Yielding","Gentle","Soft"]);
        noun = chooseFrom(["Penitent","Coward","Bystander","Martyr","Lamb","Witness","Appeaser","Shepherd","Supplicant","Wayfarer"]);
        break;
      case 'lck':
        adj  = chooseFrom(["Cursed","Jinxed","Doomed","Forsaken","Ill-Fated","Blighted","Damned","Condemned","Wretched","Struck"]);
        noun = chooseFrom(["Pariah","Scapegoat","Wretch","Castaway","Outcast","Victim","Fool","Stray","Shade","Wanderer"]);
        break;
      case 'int':
        adj  = chooseFrom(["Senseless","Witless","Dull","Blank","Thoughtless","Vacant","Oblivious","Mindless","Dim","Empty"]);
        noun = chooseFrom(["Brute","Dullard","Fool","Oaf","Lout","Thrall","Pawn","Hollow","Wretch","Simpleton","Drone","Cretin"]);
        break;
      case 'mgk':
        adj  = chooseFrom(["Drained","Spent","Mundane","Voided","Depleted","Inert","Parched","Sunken","Hollowed","Empty"]);
        noun = chooseFrom(["Husk","Shell","Castaway","Exile","Pauper","Remnant","Outcast","Vessel","Hollow","Wretch"]);
        break;
      default:
        return getFirstName();
    }
    return adj + ' ' + noun;
  }

  var adj, noun;
  switch (dominant) {
    case 'atk':
      adj  = chooseFrom(["Bloodied","Savage","Ruthless","Wrathful","Scarred","Relentless","Merciless","Vicious","Vengeful","Hardened","Ravaged","Grim","Harrowed","Iron","Branded","Unrepentant","Bitter","Seasoned"]);
      noun = chooseFrom(["Slayer","Butcher","Ravager","Reaper","Killer","Predator","Blade","Brute","Marauder","Fury","Raider","Cutthroat","Bane","Hound","Executioner"]);
      break;
    case 'hp':
      adj  = chooseFrom(["Unbroken","Steadfast","Bound","Burdened","Immovable","Scarred","Enduring","Weathered","Grieving","Iron","Petrified","Unyielding"]);
      noun = chooseFrom(["Sentinel","Martyr","Remnant","Husk","Bearer","Warden","Survivor","Anchor","Keeper","Stone","Pillar","Bulwark","Obelisk","Rampart","Cornerstone"]);
      break;
    case 'mgk':
      adj  = chooseFrom(["Cursed","Veiled","Shrouded","Corrupted","Tainted","Haunted","Withered","Twisted","Ancient","Blighted","Unholy","Forsaken","Marked","Fractured","Ashen","Spell-worn","Unraveled","Bleeding"]);
      noun = chooseFrom(["Acolyte","Harbinger","Heretic","Relic","Shade","Whisperer","Seer","Penitent","Ascetic","Seeker","Witness","Channeler","Vessel","Hollow","Flicker","Arcanist"]);
      break;
    case 'sta':
      adj  = chooseFrom(["Restless","Fleeting","Drifting","Tireless","Fading","Cold","Hollow","Lost","Pale","Gaunt","Lean","Haggard","Ragged","Windswept"]);
      noun = chooseFrom(["Wanderer","Drifter","Pilgrim","Vagrant","Nomad","Exile","Recluse","Dancer","Runner","Shade","Fugitive","Courier","Scout"]);
      break;
    case 'lck':
      adj  = chooseFrom(["Blessed","Fated","Charmed","Lucky","Tempted","Doomed","Fallen","Twisted","Last","Forsaken","Bound","Reckless","Hapless","Capricious","Star-Crossed","Hexed","Chosen"]);
      noun = chooseFrom(["Fool","Gambler","Chaser","Believer","Soul","Dreamer","Prophet","One","Omen","Augur","Herald","Marked","Diviner"]);
      break;
    case 'int':
      adj  = chooseFrom(["Thoughtful","Quiet","Ancient","Nameless","Forgotten","Veiled","Grieving","Fallen","Hollow","Broken","Distant","Wise","Melancholic","Measured","Knowing","Careful","Still"]);
      noun = chooseFrom(["Prophet","Scholar","Seeker","Witness","Watcher","Hermit","Sage","Recluse","Exile","Keeper","Pilgrim","Archivist","Chronicler","Cartographer","Scribe","Surveyor"]);
      break;
    default:
      return getFirstName();
  }

  return adj + ' ' + noun;
}

function getGameTip(){
  const random_quotes = [
    "<b>👀 Search</b> for loot in places of interest.",
    "<b>💤 Sleeping</b> too much bears consequences.",
    "<b>💨 Hasty</b> attacks can only be <b>🔰 Blocked</b>.",
    "<b>🔺 Heavy</b> attacks can only be <b>🌀 Dodged</b>.",
    "<b>🔻 Small</b> creatures can be <b>👋 Grabbed</b>.",
    "<b>👋 Grab</b> exhausted enemies to <b>knock them out</b>.",
    "<b>🧠 Intellect</b> helps befreinding companions.",
    "<b>💫 Cast</b> spells always hit before retaliation.",
    "<b>🍴 Eating</b> when relaxed provides a bonus.",
    "Use <b>🔰 Block</b> or <b>🌀 Dodge</b> before <b>⚔️ Attack</b>.",
    "<b>💤 Sleep</b> recovers <b>🟢 Energy</b> and <b>🔵 Mana</b>.",
    "<b>🍀 Luck</b> rises the chance for a critical hit.",
    "<b>👋 Grab</b> some <b>🪱 Bait</b> to do <b>🎣 Fishing</b> later.",
    "<b>💌 Report</b> any issues to make a difference.",
    "<b>💬 Speaking</b> can sometimes stop the fight.",
    "<b>🍀 Luck</b> may help you  survive a fatal hit.",
    "Some <b>🔱 Altars</b> require 🔪  for a <b>Sacrifice<b>.",
    "<b>🎣 Fishing </b> provides a variety of unique items.",
    "<b>✏️ Rename</b> your hero by clicking their name.",
    "<b>🐞 Report</b> issues by clicking the version code.",
    "Pick up 🗝️ <b>Keys</b> to unlock secrets later.",
    "🪄 <b>Cast</b> a spell to open lock for -2 🔵 <b>Mana</b>.",
    "🪬 <b>Curse</b> lowers the enemy damage by half.",
    "Casting ❤️‍🩹 <b>Heal</b> restores up to <b>+2 ❤️ Health</b>.",
    "<b>🟠 Legendary</b> items provide unique advantage.",
    "🔥 <b>Cook</b> bad food to remove negative effects.",
    "<b>🍀 Luck</b> affects your chances for getting loot.",
    "Open <b>🗝️ Locked</b> objects by <b>🪄 Cast</b> for -2 🔵",
    "Non-deadly solutions always award more "+decorateStatusText("","XP",colorGold)+".",
    "Gain "+decorateStatusText("","XP",colorGold)+" to <b>🎉 Level Up</b> and get stronger.",
    "<b>🧠 Intellect</b> affects "+decorateStatusText("","XP",colorGold)+" gains both ways.",
    "<b>💀 Killing</b> enemies affects <b>karma negatively</b>.",
    "<b>Good karma</b> grants <b>🎁 Bonus</b> on <b>✨ Revival</b>.",
    "You need to <b>💤 Sleep</b> to get a <b>🎉 Level Up</b>.",
    "Pending <b>🎉 Level Up</b> is marked by a <b>⇡</b> symbol.",
    "No one likes to be called a <i><b>✏️ Dirty Cheater</b></i>.",
    "<b>⚔️ Attack</b> locks few times to break them open.",
    "<b>💔 Recalling</b> memories hurts first, helps later.",
    "Carefully consider where you <b>💤 Sleep</b>.",
    "Spend <b>🪙 Drachmae</b> to improve your chances.",
    "<b>🍀 Luck</b> affects various random chances.",
    "<b>🎣 Fishing</b> is dangerous, make sure to be rested.",
    "Try deep-sleeping at the <b>⛩️ Soulbinding Arch</b>.",
  ];
  return random_quotes[Math.floor(Math.random() * random_quotes.length)];
}

function getPoem(){ //For the letters "Lover's Memento"
  const random_quotes = [
    "Please, be careful what you wish for.<br>It might be exactly what you get.",
    "Do not follow where I fell, my heart.<br>The ground has swallowed my beauty.",
    "My vows outlived my breath.<br>They now whisper beneath the soil.",
    "The earth tried to keep me underneath.<br>I rose with your name on my lips.",
    "You whispered into the grave.<br>I came, half hatred, half devotion.",
    "I drank from the chalice of sorrow.<br>It tasted like you, and I awoke.",
    "I stitched myself from bones and vows.<br>Just to stand where you once wept.",
    "You promised to love me forever.<br>I kept my promise, what's your excuse?",
    "The mirror cracked when I passed.<br>Still shows me, just not the same way.",
    "The bells no longer ring for weddings.<br>Not since you spoke my name.",
    "The trees hum softly where I fell and rose.<br>No birds have sung there since.",
    "I left a kiss upon the oak we carved.<br>The bark split down the middle.",
    "Don't reach for the old book, my love.<br> Some secrets should remain hidden.",
    "The world could remain peaceful.<br>If only you would listen to me.",
    "I still wear your name like a veil.<br>Even the worms dare not touch it.",
    "You called me back with love.<br>But love does not know mercy.",
    "I have been waiting in the soil for so long.<br>The stars even forgot my name.",
    "Every petal you left on my grave<br>grew thorns when you turned away.",
    "Your healing hands became my undoing.<br>But I am not fully gone.",
    "The endless cold welcomed me first.<br>Then I remembered your warmth.",
    "You begged the gods to give me back.<br>And they released the darkness.",
    "I came the way you asked.<br>Not fully whole, but yours.",
    "Our vow didn't end with my death.<br>Only my breathing did.",
    "They buried me with lovely roses.<br>But I bloomed with something else.",
    "You desperately prayed for act of god.<br>I became one you could not bear.",
    "Even now, I reach for you..<br>Only shadows take my hand.",
    "The stars we used to watch together...<br>They now turn their faces away.",
    "Your twisted love outlived my breath.<br>Then cursed me forever.",
    "You called me back with trembling hands.<br>Now tremble for what you've done.",
    "I hoped you'd mourn me.<br>Not try to fix me.",
    "You wanted me to stay.<br>I'll fulfill your wish.",
    "Love me as I am now.<br>Or rot beside me.",
    "You broke me with foul magic.<br>Now I return with justice.",
    "I died believing in your love.<br>Now I rise certain of your betrayal.",
    "The wicked altar remembers what you forgot.<br>And surely so do I, my love."];
  return "<i>"+random_quotes[Math.floor(Math.random() * random_quotes.length)]+"</i>";
}

function getBrideOpeningByLove() {
  var accusatory = [
    "You broke me with foul magic.<br>Now I return with justice.",
    "I died believing in your love.<br>Then I rose, sure of betrayal.",
    "Your love outlived my breath.<br>Then cursed me forever.",
    "You called me back, trembling.<br>Now tremble for what you did.",
    "You begged the gods for me.<br>They released the darkness.",
    "You wanted me to stay.<br>I have fulfilled your wish.",
    "The world could be peaceful.<br>If only you would listen."
  ];
  var longing = [
    "My vows outlived my breath.<br>Now you see for yourself.",
    "I came the way you asked.<br>Not fully whole, but yours.",
    "Your whisper was like prayer.<br>Filled me hatred and devotion.",
    "I waited in the soil so long.<br>The stars forgot my name.",
    "I still wear your name like.<br>Even the worms won't touch it.",
    "Every petal on my grave...<br>Has been filling with poison.",
    "Stars we watched together...<br>They now turn their faces."
  ];
  var pool = (playerLove >= 3) ? longing : accusatory;
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getBrideDyingByLove() {
  var accusatory = [
    "You did this to me... to us!<br>Why wouldn't you let me go?",
    "Love me as I am now.<br>Or rot beside me.",
    "I hoped you'd mourn me.<br>Not try to fix me.",
  ];
  var longing = [
    "Vows don't end with death.<br>Only my breathing did.",
    "I reach, but find shadows.<br>Only shadows take my hand.",
    "The cold welcomed me first.<br>Then I remembered your warmth.",
    "I wear your name like a veil.<br>Even the worms won't touch it.",
    "Every petal on my grave...<br>Has been filling with poison.",
  ];
  var pool = (playerLove >= 3) ? longing : accusatory;
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

var ENDING_FRAMES = {
  button_attack: [
    {emoji:'⚔️', text:'The deed is finally done.',    text2:'You will not be clean again.'},
    {emoji:'🩸', text:'She finally rests in peace.',  text2:'She waited so long for this.'},
    {emoji:'🖤', text:'And you walk on alone.',       text2:'As you were always going to.'}
  ],
  button_roll: [
    {emoji:'💔', text:'You turn your back.',           text2:'She watches as you disappear.'},
    {emoji:'🥀', text:'The world slowly rots.',        text2:'No one is coming to stop it.'},
    {emoji:'👰🏻‍♀️', text:'She still waits, always will.', text2:'Her patience outlived your vow.'}
  ],
  button_block: [
    {emoji:'🔰', text:'You stand your ground.',        text2:'Resolve never found you.'},
    {emoji:'🗿', text:'Slowly turning to stone.',      text2:'This is a true devotion.'},
    {emoji:'💞', text:'Your hearts bound forever.',    text2:'Neither free, neither gone.'}
  ],
  button_grab: [
    {emoji:'🫂', text:'You hold her close.',           text2:'She does not pull away.'},
    {emoji:'🌑', text:'The darkness takes you both.',  text2:'You always knew it would.'},
    {emoji:'🖤', text:'Together, at last.',            text2:'Corrupted forever.'}
  ],
  button_sleep: [
    {emoji:'💤', text:'You slowly lie beside her.',    text2:'No love or grief, only resignation.'},
    {emoji:'🌿', text:'The ground stays silent.',      text2:'Even the corruption stands still.'},
    {emoji:'🤍', text:'Your hearts make no sound.',    text2:'The debt has been repaid in full.'}
  ],
  button_speak: [
    {emoji:'❤️', text:'You say her name: Rosabel!',    text2:'She did not expect you to know.'},
    {emoji:'✨', text:'Something stirs inside her.',   text2:'Not hope, something ancient.'},
    {emoji:'💖', text:'She remembers who she was.',    text2:'Before the corruption took her.'}
  ],
  button_heal: [
    {emoji:'❤️‍🩹', text:'You unravel the curse.',       text2:'Thread by thread. Year by year.'},
    {emoji:'✨', text:'The magic tears it apart.',     text2:'Nothing survives being unmade.'},
    {emoji:'🪽', text:'She is finally free.',          text2:'Not saved, set free.'}
  ],
  button_cast: [
    {emoji:'🙏', text:'You beg the gods for mercy.',  text2:'You have no other option left.'},
    {emoji:'🌩️', text:'Something hears your call.',   text2:'Its not mercy, just interest.'},
    {emoji:'🌪️', text:'The gods take her gently.',    text2:'She rises to the dark skies.'}
  ],
  button_curse: [
    {emoji:'💀', text:'You seal the pact forever.',    text2:'With no remorse, no hesitation.'},
    {emoji:'🌑', text:'The darkness claims you both.', text2:'It was patient, it always is.'},
    {emoji:'👹', text:'None of you deserve peace.',    text2:'And so it will always be.'}
  ]
};

function getRunStartMessage() {
  var pool = [
    "Your destiny still awaits.<br>Do not fail again.",
    "The corruption spreads.<br>Your love lingers.",
    "You have died before.<br>You will die again.",
    "Death was meant to free you.<br>But somehow it did not.",
    "The whole world is dying.<br>Try to remember why.",
    "The cursed do not rest.<br>Neither should you.",
    "The world didn't ask for this.<br>Neither did she.",
    "Every corpse you pass<br>whispers her name.",
    "Whatever you finally find.<br>Make the right choice.",
    "Your love broke something.<br>Your courage must answer.",
    "The dead world remembers.<br>Resolve your sins.",
    "The world is corrupted.<br>Only you can undo it.",
    "The world decays every step.<br>Make haste to stop it.",
    "Something brought you back.<br>It is about time to end it."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getRunEndMessage() {
  var pool = [
    "The loop continues.<br>She is still waiting.",
    "Flesh returns to dust.<br>The sin remains.",
    "Broken and forgotten.<br>Just like this world.",
    "The darkness claims you.<br>The debt is unpaid.",
    "Your light flickers out.<br>The world stays dead.",
    "A desperate end for<br>a desperate soul.",
    "Grief was your armor.<br>It wasn't enough.",
    "The corruption wins.<br>It always does.",
    "Silence falls again.<br>Listen to the decay.",
    "Your bones will join<br>the ones you stepped on.",
    "The failed spell echoes.<br>You are but a shadow.",
    "Forsaken by the sun.<br>Bound to the rot.",
    "The river flows cold.<br>Your story ends here.",
    "One more ghost added<br>to the list of regrets."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getResignMessage() {
  var pool = [
    "Another damned soul.",
    "The world does not mourn.",
    "Even ghosts can quit.",
    "The rot claims another.",
    "The gate closes quietly.",
    "One fewer soul to mourn.",
    "Some wounds choose to stay.",
    "The darkness needed no help.",
    "Grief takes many forms.",
  ];
  return chooseFrom(pool);
}

function getWeddingInvitationPoem() {
  var pool = [
    "You sent this once trembling.<br>She never stopped believing.",
    "The text held her handwriting.<br>The oath stayed unsaid.",
    "A dress was chosen, flowers ordered.<br>Only one of you was ready.",
    "She sealed it with her breath.<br>It stayed sealed forever.",
    "She wrote your name at the top.<br>Even then, she already knew.",
    "It said: arrive before sundown.<br>You arrived. Just not in time.",
    "She held this the night before.<br>But couldn't hold it the day after.",
    "A fold marks where she carried it.<br>Close to where it mattered.",
    "You promised to be there.<br>You were, just not the way she was.",
    "The envelope was never opened.<br>It stayed undelivered forever."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getWeddingInvitationFade() {
  var pool = [
    "Sealed with a pressed flower.<br>She chose it herself.",
    "A name, written by her hand.<br>The deed was never done.",
    "We were supposed to be there.<br>She is still to come.",
    "Gold-edged, still unopened.<br>Unlike the gates of hell.",
    "After all those days...<br>The wax holds her prints.",
    "You carried this once.<br>The feeling has changed.",
    "Still sealed. Still waiting.<br>Just like you and her.",
    "The paper holds her perfume.<br>It is never gonna fade.",
    "A promise folded into paper.<br>Yet still undelivered."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getLoversMementoFade() {
  var pool = [
    "The ink held long enough.<br>The words never arrived.",
    "Written in full, undeliveired.<br>Still smells of her perfume.",
    "She would have read it twice.<br>You kept it instead.",
    "Still folded the way she did it.<br>The crease has not softened.",
    "Every word still there.<br>Still unsaid as far as she knows.",
    "No address. No reply.<br>Sealed like a wound that held.",
    "Her name was going to be first.<br>It still is.",
    "Wind carried this a long way.<br>It still did not reach her."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getMeetingPlaceFade() {
  var pool = [
    "Something about this place.<br>You can't name it.",
    "You have seen this before.<br>But not in this life.",
    "The air here is different.<br>Feels heavier somehow.",
    "You slow without meaning to.<br>Something holds you here.",
    "This place feels familiar.<br>Something happened here.",
    "You have stood here before.<br>But the world was different.",
    "You stare at a familiar gate.<br>The feeling unsettles you.",
    "Something is wrong here.<br>It feels too well known.",
    "The corruption missed a spot.<br>Or perhaps spared it.",
    "You had to stop walking.<br>This caught your attention."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getMeetingPlaceRecall() {
  var pool = [
    "Saw her smile here the first time.<br>The world was still whole.",
    "She was standing right here.<br>You didn't know what to say.",
    "The world felt different that day.<br>She made it that way.",
    "She laughed here before.<br>You didn't see it.",
    "She had flowers in her hair.<br>You never asked which kind.",
    "You were just passing through.<br>She changed that forever.",
    "She was sitting just there.<br>You almost walked past.",
    "You didn't know her name yet.<br>You learned it quickly.",
    "She was right there.<br>The world had not yet fallen.",
    "This is where it began.<br>Before you broke it all.",
    "You didn't know her name yet.<br>You were about to meet."
  ];
  return '<i>' + pool[Math.floor(Math.random() * pool.length)] + '</i>';
}

function getLootChoiceLog(context, tier) {
  var _corpseHigh = [
    "This is what they were guarding.",
    "One of these was worth dying for.",
    "The darkness left something impossible behind.",
    "Whatever they were — they carried something rare.",
    "Take your time. You won't find this again."
  ];
  var _corpseMid = [
    "Something in the wreckage caught your eye.",
    "Not everything they carried was worthless.",
    "They protected something worth protecting.",
    "Whatever they carried — part of it mattered.",
    "The remains held more than one surprise."
  ];
  var _corpseLow = [
    "Three things worth taking from the remains.",
    "Went through what they left behind.",
    "Picked apart what little they had.",
    "The body held more than it should have.",
    "Searched what remained of them."
  ];
  var _propHigh = [
    "Something forgotten is remembering you.",
    "These don't appear by chance.",
    "The world hasn't offered something like this in a long time.",
    "One of these belongs to you. You'll know it when you see it.",
    "Something rare surfaced. Take your time."
  ];
  var _propMid = [
    "Something worth pausing for.",
    "Not everything here was left by accident.",
    "The corruption offered more than expected.",
    "A moment's choice in a world coming apart.",
    "Three things the world still holds."
  ];
  var _propLow = [
    "Three things within reach.",
    "Something here, maybe useful.",
    "The world offered a choice.",
    "Not everything left behind is worthless.",
    "Take what serves the journey."
  ];

  var _isHigh = (tier === 'Legendary' || tier === 'Rare');
  var _isMid  = (tier === 'Uncommon');
  if (context === 'corpse') {
    return chooseFrom(_isHigh ? _corpseHigh : _isMid ? _corpseMid : _corpseLow);
  }
  return chooseFrom(_isHigh ? _propHigh : _isMid ? _propMid : _propLow);
}

function getLootDropLog() {
  return chooseFrom([
    "Something fell from them.",
    "There's something left behind.",
    "They left something on the ground.",
    "Something droped on the ground.",
    "Something is under the body.",
    "They dropped something."
  ]);
}

function getRememberLog() {
  return chooseFrom([
    "Almost recalled her name this time.",
    "Long road ahead, already familiar.",
    "Something shifted, almost familiar.",
    "Caught and lost her scent again.",
    "Something hurts you deep inside.",
    "You held a memory, it faded slowly.",
    "The world was right, for a moment.",
    "You remembered and then forgot.",
    "The grief. Still there. Still yours.",
    "She would have known what to do here.",
    "Her name almost came out. Almost.",
    "An old pain called from inside you.",
    "Not a memory. The shape of one.",
    "Feels like a part of you is missing."
  ]);
}

function getFateLog() {
  return chooseFrom([
    "Taken and given",
    "The ledger never forgets",
    "The balance tips the odds",
    "Shifted your balance",
    "Debt follows this gift",
    "The world gives and collects",
    "Not all gains are for free",
    "The reward has a cost"
  ]);
}

function getFishingStumbleText() {
  return chooseFrom([
    "Nearly dropped the rod",
    "Fumbled, barely held on",
    "Almost lost the rod"
  ]);
}

function getRestBadlyText() {
  return chooseFrom([
    "Slept poorly, waking up tired.",
    "Tossed and turned, barely rested.",
    "Woke up early, not fully rested.",
    "Slept barely enough to recover.",
    "Dreamed badly, woken up tired.",
    "The dreams found you.",
    "Woke with weight on the chest.",
    "Sleep just came and left.",
    "Rested but not restored.",
    "Slept. It didn't take."]);
}

function getSleepNearLimitLog() {
  return chooseFrom([
    "Dark cold creeps in as you sleep.",
    "Something stirs, do not hesitate.",
    "She grows impatient while you sleep."
  ]);
}

function getSleepOverLimitLog() {
  return chooseFrom([
    "The world decays while you sleep.",
    "She slips away with your every sleep.",
    "The darkness deepens, do not linger."
  ]);
}

function getCorpseSearchLog() {
  return chooseFrom([
    "Went through what they carried.",
    "Turned out their belongings.",
    "Looked through what remained.",
    "Searched what little they had.",
    "Searched through their belongings."
  ]);
}

function getEnemyWakeLog() {
  return chooseFrom([
    "They refuse to stay down.",
    "Not as gone as they seemed.",
    "You disturbed their sleep.",
    "Still alive. Somehow.",
    "The ground didn't hold them."
  ]);
}

function getCritSleepLog() {
  return chooseFrom([
    "Woke up feeling uncannily whole +1 🟢",
    "Slept deeper than expected +1 🟢",
    "Slept well despite the darkness +1 🟢",
    "Rested far better than expected +1 🟢",
    "Woke up strangely renewed +1 🟢"
  ]);
}

function getWalkCritText() {
  return chooseFrom(["Left whistling under your breath.", "Walked away clean.", "The road ahead felt briefly less heavy.", "Slipped away without a backward glance.", "Left nothing behind worth taking."]);
}

function getShopMessage(){
  var random_quotes = [
    "Well met, what's it gonna be this time?",
    "Oh, its you again. Take your pick carefully.",
    "Back so soon? I guess you need a better gear.",
    "You again? I guess you failed your quest then.",
    "Out of lives again? Out of Drachmae soon too.",
    "You really know how to keep me in business.",
    "Failure suits you. My wares as well.",
    "Back again? My prices stayed the same.",
    "Another try, another tab to pay.",
    "You fall, I profit. Circle of life.",
    "The afterlife is free, my shop isn't.",
    "You died. I survived. Let's trade.",
    "Welcome back, my purse missed you already.",
    "Still trying? Admirable... and profitable.",
    "You again? Fate loves wasting time.",
    "If effort was currency, you'd be rich.",
    "No discount, no mercy, no refunds.",
    "Your enemies hit hard. My prices hit harder.",
    "You failed again. At least you're consistent.",
    "You fall, they laugh, I charge full price.",
    "Careful now. Dying gets expensive.",
    "Try not to waste this investment too.",
    "You keep dying. I keep stocking.",
    "Another attempt? Hope your wallet holds up.",
    "Progress is slow. My patience is slower.",
    "You lost everything… except spending habits.",
    "Back from the void? At least not empty handed.",
    "The grave is patient, I am not.",
    "You look worse. My inventory looks better.",
    "Failure is a habit and so is buying.",
    "You can't cheat death... or my prices.",
    "Another reincarnation, same old desperation.",
    "At this rate, you'll haunt my shop forever."]
    .filter(item => !usedShopMessages.includes(item));

  if (playerShopped) random_quotes = [
    "Sure sure, I got plenty more in stock.",
    "Seems like you have more to spend.",
    "There's no discount for returning customers.",
    "Not done yet? Still got plenty more.",
    "Ah, a spender. I totally approve.",
    "Coins still rattling? I've got more for you.",
    "Plenty of stock, pity about your skill.",
    "Keep buying, maybe luck will notice you.",
    "You live, you die, you shop. Cycle continues.",
    "Still have coin? I can surely fix that.",
    "Gear heavier, purse lighter. Nicely balanced.",
    "Nothing like fresh regret in shiny packaging.",
    "You buy it, I profit. Fair trade.",
    "More trinkets, same doomed story.",
    "You can't buy talent, but you're trying.",
    "Still breathing and still paying. Good.",
    "Spend now, regret later. Or not?",
    "Don't worry, I won't mind when you're broke.",
    "Stock's full, your fate is not.",
    "Oh look, you found more currency to waste.",
    "You must really believe this will help.",
    "I admire your optimism. It's delicious.",
    "Another shiny thing to die with.",
    "You buy, they kill, I restock.",
    "If practice mattered, you'd be unstoppable.",
    "I'll happily delay your next failure.",
    "A wise investment… probably.",
    "Good choice. Not good enough, but good.",
    "Your purse bleeds, my shelves smile.",
    "One step closer to being stylishly deceased.",
    "Keep it up and I'll name a shelf after you.",
    "Still have coin? Then we're not done."]
    .filter(item => !usedShopMessages.includes(item));

  if (random_quotes.length==0) random_quotes.push("Ugh, hate to see you here all the time.")
  var message = random_quotes[Math.floor(Math.random() * random_quotes.length)]+"<br>";
  usedShopMessages+=message;

  return message
}

function getShopLeaveMessage() {
  return chooseFrom([
    "The Shade dissolves into the dark.",
    "He was already gone when you turned.",
    "Gone. Waiting for the next dead soul.",
    "Left him in his shadow. Good habit.",
    "Already gone. He doesn't do goodbyes.",
    "The Undertaker recedes.",
    "You walk on. The Shade watches still.",
    "He recedes. The dark takes him back.",
  ]);
}

function getRecallPassText() {
  return chooseFrom([
    "An old memory hurts you inside -1 💔",
    "You recalled something painful -1 💔",
    "Familiar pain surfaced in you -1 💔",
    "A painful memory surfaced -1 💔",
    "You remembered someone close -1 💔"
  ]);
}

function getRecallCritPassText() {
  return chooseFrom([
    "There was someone special, just for you.",
    "You and her, bound together, forever.",
    "All slowly comes back to you.",
    "Her name. Whole and clear.",
    "The memory arrived complete. It hurt.",
    "You remembered her voice. It did not stay."
  ]);
}

function getRecallFailText() {
  return chooseFrom([
    "Couldn't remember why this is familiar.",
    "You felt something, but couldn't reach it.",
    "Familiar shape, but no memory attached.",
    "The feeling slipped before it formed.",
    "Somewhere deep inside, you should know."
  ]);
}

function getRecallCritFailText() {
  return chooseFrom([
    "Familiar shape with nothing attached.",
    "The shape of her, gone before you could hold it.",
    "There's a price for forgetting love.",
    "You refused your own memories.",
    "Whatever you once felt is now gone.",
    "Nothing came. The absence was complete."
  ]);
}

function getEncounterUsedMessage() {
  var pool = [
    "Seems like that was it for now.",
    "Nothing more to do here for now.",
    "That's it, you've done what you can."
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPrayNoTargetText() {
  return chooseFrom([
    "Your prayer rises and finds no answer.",
    "The gods take no interest in this.",
    "A quiet moment, nothing more.",
    "The silence does not pray back."
  ]);
}

function getCurseNoTargetText() {
  return chooseFrom([
    "The hex has no one to haunt here.",
    "Dark words land on deaf stone.",
    "There is nothing here worth cursing.",
    "The darkness finds nothing to cling to."
  ]);
}

function getSpeakCursePassText() {
  return chooseFrom([
    "Denounced it aloud.",
    "Refused its hold on you.",
    "Spoke it away.",
    "Your voice cut through the haze.",
    "Defied it with steady words."
  ]);
}

function getSpeakCurseCritPassText() {
  return chooseFrom([
    "Rebuked it entirely.",
    "Broke its hold with conviction.",
    "Drove it back with your voice.",
    "Your declaration silenced it."
  ]);
}

function getSpeakCurseFailText() {
  return chooseFrom([
    "Your words found no purchase.",
    "The curse paid you no heed.",
    "It did not listen.",
    "The air swallowed your voice."
  ]);
}

function getSpeakCurseCritFailText() {
  return chooseFrom([
    "Your words gave it strength.",
    "Speaking drew its attention.",
    "Your voice fed the darkness."
  ]);
}

function getRivalDialogue() {
  var pool = [
    "You should have stayed dead.",
    "My corpse remembers you.",
    "I died so you wouldn't have to.",
    "We were never that different."
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getWhisperingStonesLog() {
  var pool = [
    "Names of those who stood here before.",
    "Someone else carved into the stone.",
    "The dead remember their choices.",
    "Other worlds bled through here.",
    "You are not the first one here."
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

var _RIVAL_LAST_WORDS = {
  win_speak:   ["Said her name, she remembered.", "Called to her, she heard."],
  win_free:    ["Freed her once, not this time.", "Broke the curse before, not now."],
  win_kill:    ["Killed her before, now they pay.", "Drew blood once, karma remembers."],
  win_embrace: ["Chose the dark before.", "Walked into it willingly."],
  win_pray:    ["The gods heard them once.", "Prayed hard enough, once before."],
  win_walk:    ["Walked away before, not this time.", "Turned their back once, not now."],
  win_guard:   ["Stood guard once, now they fall.", "Chose to stay before, now forever."],
  win_sleep:   ["Laid down before and now for good.", "Found rest once, but only briefly."],
  win_curse:   ["The pact followed them here.", "Made a deal once, karma remembers."],
  death:       ["Died before reaching her.", "Never made it. Not then, not now.", "Fell short before, not closer now."],
  rival_death: ["Ended by rival before, now as well.", "Got cut down once and now again."],
  win:         ["Finished once, but not this time.", "Reached the end before, not now though."]
};

function getRivalLastWord(endType) {
  var pool = _RIVAL_LAST_WORDS[endType] || ["No echo. They left nothing behind."];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Mirror encounter text ─────────────────────────────────────────────────────

var _MIRROR_SOUL_POOLS = [
  // neg-0
  ["A shadow lingers where your soul used to be.", "The reflection offers no warmth in return.", "The mirror shows absence of altruism."],
  // low (1-3)
  ["A flicker of conscience is barely visible.", "The mirror recognizes something warm inside you.", "Your soul seems present, if you're uncertain."],
  // mid (4-6)
  ["The mirror finds your soul clear and steady.", "Something righteous sparkles in your gaze.", "A warm light answers from within you."],
  // high (7+)
  ["The mirror blazes with your conviction.", "Few souls burn this bright among the dead.", "An ancient conscience stares back nodding."]
];

var _MIRROR_HEART_POOLS = [
  // neg-0
  ["The mirror shows your hollow and cold chest.", "Nothing passionate stirs behind your eyes.", "If love was ever there, it has since departed."],
  // low (1-3)
  ["A dim pulse, cautious, not quite trusting.", "It shows something fragile kept alive by habit.", "Love survives in you, barely, as a reflex."],
  // mid (4-6)
  ["It shows a heart still capable of warmth.", "Something tender holds its shape inside you.", "Love burns in your chest like a slow fire."],
  // high (7+)
  ["Affection burns hot in your chest.", "This much love is rare among the dead.", "The glass cracks slightly, overwhelmed by emotion."]
];

var _MIRROR_KISMET_POOLS = [
  // neg-0
  ["Nothing kind is written in your margin.", "Misfortune is coiled around your silhouette.", "Luck left a forwarding address elsewhere."],
  // low (1-3)
  ["The odds acknowledge you slightly.", "Fortune notices you, without enthusiasm.", "Something small is trying to help you."],
  // mid (4-6)
  ["Luck is on your side today.", "The chances are bending towards you.", "Fortune keeps a cautious eye on you."],
  // high (7+)
  ["The mirror blinks, then looks again.", "Tangible blessing follows you around.", "Chance and fate are on your side."]
];

var _MIRROR_PSYCHE_POOLS = [
  // neg-0
  ["The mirror reflects a vast empty mind.", "Thoughts move through like smoke through cracks.", "Whatever wisdom you had has gone quiet."],
  // low (1-3)
  ["A mind still forming, still testing its edges.", "Instinct is doing most of the work.", "The mirror sees potential behind the fog."],
  // mid (4-6)
  ["The mind reflected here is precise and awake.", "Clarity is something you have earned.", "Intelligence watches from behind with patience."],
  // high (7+)
  ["The mirror struggles to reflect of your mind.", "Few things are as sharp as what stares back.", "The intellect reflected warps the glass."]
];

// Forsaken Village mirrors
var _MIRROR_FV_SOUL_POOLS = [
  // neg-0
  ["Nothing redeemable stirs in the glass.", "Your sins have settled where warmth should be.", "The mirror finds no virtue left to name."],
  // low (1-3)
  ["A small conscience, doing what it can.", "Something guilty still holds its shape.", "The mirror finds you salvageable, barely."],
  // mid (4-6)
  ["Your conscience is steady and intact.", "Enough goodness to earn a reflection.", "The mirror finds no reason to look away."],
  // high (7+)
  ["Few sinners pass through this clean.", "The glass has rarely shown this much light.", "A clear conscience looks back at you."]
];

var _MIRROR_FV_HEART_POOLS = [
  // neg-0
  ["No warmth remains in what you show here.", "Whoever loved from here has long since gone.", "The mirror finds a chest long since emptied."],
  // low (1-3)
  ["Love survives here as a habit, no more.", "Something tender lingers in the glass.", "A dull warmth, old and half-forgotten."],
  // mid (4-6)
  ["The mirror finds a heart still giving.", "Warmth holds its shape inside you.", "Something honest beats behind the glass."],
  // high (7+)
  ["The widow's mirror has not seen this before.", "Your heart fills the glass to the edge.", "Love this strong leaves a mark on the glass."]
];

var _MIRROR_FV_KISMET_POOLS = [
  // neg-0
  ["The mirror clouds when it reads your fate.", "Misfortune trails you like an old debt.", "This omen has nothing good to offer."],
  // low (1-3)
  ["The odds haven't forgotten you, just barely.", "Fortune is present, though not generous.", "A cautious omen, neither gift nor warning."],
  // mid (4-6)
  ["The omen tilts in your direction today.", "Fortune keeps one eye open for you.", "The mirror bends in your favor here."],
  // high (7+)
  ["The omen trembles with good fortune.", "Few readings come out this favored.", "Your luck is written plainly in the glass."]
];

var _MIRROR_FV_PSYCHE_POOLS = [
  // neg-0
  ["The scholar's glass finds little to read.", "Whatever knowledge lived here has gone quiet.", "Thought moves through here without sticking."],
  // low (1-3)
  ["A mind still finding its edges.", "Something is forming behind the fog.", "Instinct carries more weight than thought."],
  // mid (4-6)
  ["The mirror finds a mind precise and awake.", "Your thinking is earned and it shows.", "The scholar's glass approves what it reads."],
  // high (7+)
  ["The glass strains to contain your mind.", "Few reach this clarity among the dead.", "Your intellect warps the mirror slightly."]
];

// River of Sorrows shades
var _MIRROR_ROS_SOUL_POOLS = [
  // neg-0
  ["The shade turns away without a word.", "Found wanting. It offers nothing.", "Your sins are louder than your soul."],
  // low (1-3)
  ["The shade pauses, uncertain, then nods.", "A small record of goodness. It is enough.", "You have done just enough to be seen."],
  // mid (4-6)
  ["The shade reads you and steps aside.", "Your karma earns the crossing.", "Judged, and found passable."],
  // high (7+)
  ["The shade bows its head once.", "Few cross with a soul this clean.", "It has not seen this much light in years."]
];

var _MIRROR_ROS_HEART_POOLS = [
  // neg-0
  ["The shade looks for grief and finds quiet.", "No love left to weigh here.", "It recognizes nothing in your chest."],
  // low (1-3)
  ["A thin grief, still holding its shape.", "The shade sees love surviving on reflex.", "Something small still mourns in you."],
  // mid (4-6)
  ["The mourning shade knows this weight.", "Your grief is real enough to recognize.", "It sees love burning low but steady."],
  // high (7+)
  ["The shade stops. This grief is deep.", "It has not felt love this heavy before.", "Your heart is known here. It bows."]
];

var _MIRROR_ROS_KISMET_POOLS = [
  // neg-0
  ["The toll is steep. Fortune owes you nothing.", "Your luck dried up before the crossing.", "Fate has not been kind to your margin."],
  // low (1-3)
  ["The crossing is uncertain, but possible.", "Fate offers you a slim window.", "Your luck is thin, but it is there."],
  // mid (4-6)
  ["The toll shade nods and steps aside.", "Passage looks favorable from here.", "Your luck tips the crossing in your favor."],
  // high (7+)
  ["The toll is paid before it is asked.", "Fortune walks beside you at this crossing.", "Few cross this river with this much luck."]
];

var _MIRROR_ROS_PSYCHE_POOLS = [
  // neg-0
  ["The shade finds nothing worth reading.", "Thought passed through and left no mark.", "Your mind leaves no impression here."],
  // low (1-3)
  ["A dim awareness. The shade notes it.", "Something is forming. It registers.", "Instinct more than thought. It sees."],
  // mid (4-6)
  ["The knowing shade nods once, slowly.", "Your mind is clear enough to be read.", "It finds what it expected to find."],
  // high (7+)
  ["The shade goes still when it reads you.", "This clarity is rare among the crossing.", "Your mind unsettles it. It steps back."]
];

var _MIRROR_CONFIG = {
  // Twisted Fairyland (original names, original pools)
  'Soul Mirror':   { getStat: function() { return playerKarma; }, label: 'Karma',     emoji: '✨', pools: _MIRROR_SOUL_POOLS   },
  'Heart Mirror':  { getStat: function() { return playerLove;  }, label: 'Love',      emoji: '💕', pools: _MIRROR_HEART_POOLS  },
  'Kismet Mirror': { getStat: function() { return playerLck;   }, label: 'Luck',      emoji: '🍀', pools: _MIRROR_KISMET_POOLS },
  'Psyche Mirror': { getStat: function() { return playerInt;   }, label: 'Intellect', emoji: '🧠', pools: _MIRROR_PSYCHE_POOLS },
  // Forsaken Village
  "Sinner's Mirror": { getStat: function() { return playerKarma; }, label: 'Karma',     emoji: '✨', pools: _MIRROR_FV_SOUL_POOLS   },
  "Widow's Mirror":  { getStat: function() { return playerLove;  }, label: 'Love',      emoji: '💕', pools: _MIRROR_FV_HEART_POOLS  },
  'Omen Mirror':     { getStat: function() { return playerLck;   }, label: 'Luck',      emoji: '🍀', pools: _MIRROR_FV_KISMET_POOLS },
  "Scholar's Mirror":{ getStat: function() { return playerInt;   }, label: 'Intellect', emoji: '🧠', pools: _MIRROR_FV_PSYCHE_POOLS },
  // River of Sorrows
  'Judging Shade':  { getStat: function() { return playerKarma; }, label: 'Karma',     emoji: '✨', pools: _MIRROR_ROS_SOUL_POOLS   },
  'Mourning Shade': { getStat: function() { return playerLove;  }, label: 'Love',      emoji: '💕', pools: _MIRROR_ROS_HEART_POOLS  },
  'Toll Shade':     { getStat: function() { return playerLck;   }, label: 'Luck',      emoji: '🍀', pools: _MIRROR_ROS_KISMET_POOLS },
  'Knowing Shade':  { getStat: function() { return playerInt;   }, label: 'Intellect', emoji: '🧠', pools: _MIRROR_ROS_PSYCHE_POOLS }
};

function getMirrorDesc(mirrorName) {
  var c = _MIRROR_CONFIG[mirrorName];
  if (!c) return '';
  var stat = c.getStat();
  var tierIdx = stat <= 0 ? 0 : stat <= 3 ? 1 : stat <= 6 ? 2 : 3;
  var header = chooseFrom(c.pools[tierIdx]);
  return header + '<br><i>Your ' + c.label + ' is ' + stat + ' ' + c.emoji + '</i>';
}

var _MIRROR_SPEAK_CRIT_PASS = {
  'Karma':     ["Told the truth to the glass.",    "Said it plainly. The glass held."],
  'Love':      ["Said her name. Meant it.",         "Spoke it clean. The glass shivered."],
  'Luck':      ["Claimed it. Fortune held.",        "Insisted on your odds. Won."],
  'Intellect': ["Found the thought and held it.",   "Named it before it left."]
};
var _MIRROR_SPEAK_PASS = {
  'Karma':     ["Something almost honest surfaced.", "Close enough, just about."],
  'Love':      ["Found a word for it, at least.",    "Almost said the real thing."],
  'Luck':      ["Believed it for a moment.",         "Called yourself fortunate. Briefly."],
  'Intellect': ["Almost had it. Let it go.",         "The thought was there. Gone now."]
};
var _MIRROR_SPEAK_FAIL = {
  'Karma':     ["The mirror had heard this.",        "The reflection looked unconvinced."],
  'Love':      ["The silence after said more.",      "Not the right word. Close, though."],
  'Luck':      ["Didn't mean it. The glass knew.",   "Sounded hollow, even to you."],
  'Intellect': ["The conclusion did not follow.",    "Said something. Meant nothing."]
};
var _MIRROR_SPEAK_CRIT_FAIL = {
  'Karma':     ["Saw what you hoped to miss.",       "It showed you the honest count."],
  'Love':      ["Couldn't finish the sentence.",     "The name came out wrong."],
  'Luck':      ["The glass agreed, coldly.",         "Admitted your odds. Regretted it."],
  'Intellect': ["Came out no wiser.",                "Lost the thread. Entirely."]
};

var _MIRROR_SHADE_SPEAK_CRIT_PASS = {
  'Karma':     ["Confessed it. The shade moved.",    "Named the debt and the one deed."],
  'Love':      ["Said the unsayable. It counted.",   "Said the thing you never could."],
  'Luck':      ["Argued with the water. Won.",       "Made your case to the river."],
  'Intellect': ["Reasoned to the end for once.",     "Followed the thought all the way."]
};
var _MIRROR_SHADE_SPEAK_PASS = {
  'Karma':     ["The shade watched. You moved on.",  "It listened. Made no ruling."],
  'Love':      ["Spoke her name. No reply.",         "The shade held it, quietly."],
  'Luck':      ["The shade offered no verdict.",     "The river said nothing. Fair."],
  'Intellect': ["The shade gave nothing back.",      "It heard you. Said nothing."]
};
var _MIRROR_SHADE_SPEAK_FAIL = {
  'Karma':     ["The shade had your number.",        "The shade knew the count already."],
  'Love':      ["True words. Not enough.",           "The shade turned away."],
  'Luck':      ["Lost the argument. As expected.",   "The water was unconvinced."],
  'Intellect': ["The shade knew more. Said so.",     "It had already worked this out."]
};
var _MIRROR_SHADE_SPEAK_CRIT_FAIL = {
  'Karma':     ["Your debts, recounted exactly.",    "It tallied what you owe."],
  'Love':      ["It had heard this story before.",   "The shade already knew the end."],
  'Luck':      ["Assessed and found wanting.",       "The toll was clear. Came up short."],
  'Intellect': ["Each sentence undid the last.",     "Came out considerably less."]
};

// ── Familiar Memory — NG+ Necropolis dream replacement ────────────────────────
var _FAMILIAR_MEMORY_DESC = [
  "The fog here knows your shape.<br>You have walked this before.",
  "Her name forms before the thought.<br>You already know what waits ahead.",
  "The dark at the end is familiar.<br>The dread settles before it should.",
  "The stone holds your weight well.<br>It has done this before.",
  "Something at the edge knows your face.<br>The grief here fits you exactly.",
  "Old knowledge moves through you, quiet.<br>The bones remember what the mind forgot."
];
var _FAMILIAR_MEMORY_MSG = [
  "Memory moves faster than grief.",
  "The dread is familiar.",
  "The bones remember.",
  "It finds you before you find it.",
  "Something here has been waiting.",
  "Old weight, familiar shape.",
  "The knowledge arrived without asking.",
  "This was always going to happen."
];
function getFamiliarMemoryDesc()    { return chooseFrom(_FAMILIAR_MEMORY_DESC); }
function getFamiliarMemoryMessage() { return chooseFrom(_FAMILIAR_MEMORY_MSG); }

// ── Inline message pools (called from action-resolver / player-skills) ─────────

function getSpeakDefaultLog() {
  return chooseFrom([
    "The words fell into the silence.",
    "Said something. Nothing answered.",
    "Your voice dissolved into the ruin.",
    "No answer, but something heard."
  ]);
}

function getSleepFullLog() {
  return chooseFrom([
    "Rested well, back at full strength.",
    "Slept clean, everything restored.",
    "Slept well, ready to continue.",
    "Down and up, resources recovered."
  ]);
}

function getSleepWastedLog() {
  return chooseFrom([
    "Wasted some time sleeping.",
    "Already rested. Cost nothing but time.",
    "Nothing to recover. Rest wasted."
  ]);
}

function getPlayfulMomentLog() {
  return chooseFrom([
    "Enjoyed a playful moment -1 🟢",
    "Traded harmless blows -1 🟢",
    "A brief, cheerful scuffle -1 🟢",
    "Sparred lightly, no real threat -1 🟢",
    "Exchanged a playful swipe -1 🟢"
  ]);
}

function getWoreThemDownLog() {
  return chooseFrom([
    "Wore them down a bit -1 🟢",
    "Kept the pressure on -1 🟢",
    "Ground out every inch -1 🟢",
    "Pushed until they buckled -1 🟢",
    "Tired them a little bit -1 🟢"
  ]);
}

function getRestCritLog() {
  return chooseFrom([
    "Caught your breath quickly +1 🟢",
    "Rested fast despite the danger +1 🟢",
    "Pulled back enough to recover +1 🟢"
  ]);
}

function getReincarnateLog() {
  return chooseFrom([
    "Woke again. The debt unchanged.",
    "The world kept you. It always does.",
    "Still not done, apparently.",
    "Came back to life to continue."
  ]);
}

function getStaminaWastedLog() {
  return chooseFrom([
    "Wasted a moment of your life.",
    "Nothing left to recover.",
    "Already at full energy."
  ]);
}
