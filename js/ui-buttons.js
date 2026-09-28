//UI Buttons

// Attach a hold-to-confirm behaviour to a button.
// The user must hold for `seconds` seconds without releasing or leaving.
// On completion, `onComplete` is called (e.g. reveal a confirm row).
// Returns a cleanup function that resets the button to its original state.
function holdToConfirm(btn, seconds, onComplete) {
  var origHTML = btn.innerHTML;
  var holdInterval = null;

  function reset() {
    if (!holdInterval) return;
    clearInterval(holdInterval);
    holdInterval = null;
    btn.innerHTML = origHTML;
    btn.removeEventListener('pointerup',     reset);
    btn.removeEventListener('pointerleave',  reset);
    btn.removeEventListener('pointercancel', reset);
  }

  btn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (holdInterval) return;
    var count = seconds;
    btn.innerHTML = '✕ Hold for ' + count + ' sec...';
    btn.addEventListener('pointerup',     reset);
    btn.addEventListener('pointerleave',  reset);
    btn.addEventListener('pointercancel', reset);
    holdInterval = setInterval(function () {
      count--;
      if (count > 0) {
        btn.innerHTML = '✕ Hold for ' + count + ' sec...';
      } else {
        reset();
        onComplete();
      }
    }, 1000);
  });

  return reset;
}
function setButton(elementID,text,color=colorWhite){
  document.getElementById(elementID).innerHTML=text.replace(" "," <b style=\"color:"+color+";\">")+"</b>";
  if (text.includes("🪙")) { //HAAAACKKKK!!!
    var price = text.split(" ")[0]
    var item = text.split(" ")[2]
    document.getElementById(elementID).innerHTML=price+narrowSpace+"🪙 <b style=\"color:"+color+";\">"+item+"</b>";
  }
}

function resetEncounterButtons(){
  ['button_attack','button_roll','button_block','button_grab','button_sleep',
   'button_speak','button_cast','button_heal','button_curse'].forEach(function(id){
    document.getElementById(id).disabled = false;
  });
  if (playerSta>0 && (!enemyType.includes("Dream"))){
    setButton('button_attack',playerAttackType+" Attack");
    setButton('button_block',"🔰 Block");
    setButton('button_roll',"🌀 Dodge");
  } else {
    setButton('button_attack',playerAttackType+" Attack",colorDarkGrey);
    setButton('button_block',"🔰 Block",colorDarkGrey);
    setButton('button_roll',"🌀 Dodge",colorDarkGrey);
  }

  if ((((enemyAtk+enemyAtkBonus)<=0)&&(enemyMgk<=0)&&(enemyType!="Death"))||enemyType=="Friend")  setButton('button_roll',"👣 Leave");
  setButton('button_grab',"👋 Grab");
  setButton('button_sleep',playerSleepType+" Sleep");
  if (enemyType=="Prop" && totalBonus>0) setButton('button_sleep',playerSleepType+" Sleep",colorSoftGreen);
  if (enemyType=="Prop" && totalMalus<0) setButton('button_sleep',playerSleepType+" Sleep",colorSoftRed);
  if (playerSta<playerStaMax || playerMgk<playerMgkMax) setButton('button_sleep',playerSleepType+" Sleep",colorLightBlue);
  if (playerXP>=playerXPThreshold) setButton('button_sleep',playerSleepType+" Sleep",colorGold);
  var _sleepThr = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.sleepAreaThreshold != null) ? GAME_CONFIG.sleepAreaThreshold : 5;
  if (areaName !== "Depths of Slumber" && areaName !== "Shrouded Necropolis") {
    if (playerAreaSleepCount >= _sleepThr) setButton('button_sleep', playerSleepType+" Sleep", colorRed);
    else if (playerAreaSleepCount >= _sleepThr - 1) setButton('button_sleep', playerSleepType+" Sleep", colorOrange);
  }
  if (playerRested && (!enemyType.includes("Trap"))) setButton('button_sleep',"💤 Sleep",colorDarkGrey);

  setButton('button_speak',playerSpeakType+" Speak");
  setButton('button_cast',playerCastType+" Cast");
  setButton('button_curse',"🪬 Curse");
  setButton('button_heal',"❤️‍🩹 Heal");
  if (playerMgk<=0){
    setButton('button_cast',playerCastType+" Cast",colorDarkGrey);
    setButton('button_heal',"❤️‍🩹 Heal",colorDarkGrey);
  }
  if (playerMgk<2) setButton('button_curse',"🪬 Curse",colorDarkGrey);
}

function _setEndingButtons() {
  var allIds = ['button_attack','button_roll','button_block','button_grab',
                'button_sleep','button_speak','button_cast','button_heal','button_curse'];
  allIds.forEach(function(id) {
    document.getElementById(id).disabled = false;
    setButton(id, '-', colorDarkGrey);
  });

  setButton('button_attack', '🔪 Kill', colorRed);
  setButton('button_roll',   '💔 Leave', colorRed);
  setButton('button_block',  '🔰 Guard', colorDarkGreen);
  setButton('button_sleep', '💤 Sleep', playerLove >= 1                          ? colorShadeBlue     : colorDarkGrey);
  setButton('button_grab',  '🫂 Hold',  playerLove >= 4                          ? colorPink      : colorDarkGrey);
  setButton('button_speak', '❤️ Name',  playerLove >= 6                          ? colorPink      : colorDarkGrey);
  setButton('button_heal',  '❤️‍🩹 Cure', playerMgk >= 4                           ? colorLightBlue : colorDarkGrey);
  setButton('button_cast',  '🙏 Pray',   playerLck >= 6                           ? colorYellow : colorDarkGrey);
  setButton('button_curse', '💀 Damn',  playerKarma <= -2                        ? colorDarkRed       : colorDarkGrey);
}

function adjustEncounterButtons(){
  if (isEndingState) { _setEndingButtons(); return; }
  resetEncounterButtons();
  var originalType=enemyType;

  //Dead/asleep override (LLM limit gone, hack it is!)
  if (corpseState!=""){ 
    enemyType="Prop"
  }

  //Override Rival type for action
  if (enemyType.includes("Boss-Rival")){
    enemyType="Standard"
  }

  if (enemyType.includes("Boss")) {
    enemyType=enemyType.replace("Boss-","");
  }

  switch (enemyType){
    case "Upgrade":
      setButton('button_attack',"❤️ Health",colorPink);
      setButton('button_roll',"🟢 Energy",colorDarkGreen);
      setButton('button_block',"🔵 Mana",colorLightBlue);
      setButton('button_cast',"🍀 Fortune", colorSoftGreen);
      setButton('button_grab',"🎣 Fishing", colorShadeBlue);
      setButton('button_curse',"🎲 Fate", colorRed);
      setButton('button_speak',"💖 Recall", colorFairy);
      setButton('button_heal',"📿 Faith", colorWhite);
      setButton('button_sleep',"🧠 Psyche", colorPink);
      break;

    case "Consumable":
    case "Consumable-Container":
      setButton('button_cast',"🔥 Cook",colorDarkGrey);
      if (playerMgk>0 && !playerCooked) setButton('button_cast',"🔥 Cook");
      if (playerLootString.includes("🧂")) {
        setButton('button_cast',"🧂 Salt");
        if (playerCooked) setButton('button_cast',"🧂 Salt",colorDarkGrey);
      }
      setButton('button_roll',"❌ Ditch");
      setButton("button_grab","🍴 Eat",eatColor);
      var drinks=["🧃","🍺","🍹","🍷","🍸","🍾","🧉","🥤","🧋","🍵","⚗️","🍶"]
      if (drinks.includes(enemyEmoji)) setButton("button_grab","👄 Drink",eatColor);

      break;

    case "Altar":
      // Pray is rebound to button_speak on Altars; button_heal stays as ❤️‍🩹 Heal
      setButton('button_speak', "🙏 Pray", encounterUsed ? colorDarkGrey : colorWhite);
      if (!encounterUsed) setButton('button_speak', "🙏 Pray", colorYellow);
      var blade=checkPlayerHasItem(validBlades);
      if (blade!=""&&enemyHp<0) {
        setButton("button_speak", "🩸 Offer", colorRed);
        if (encounterUsed) setButton('button_speak', "🩸 Offer", colorDarkGrey);
      }
    case "Prop":
      document.getElementById('button_grab').innerHTML="✋ Touch";
      document.getElementById('button_roll').innerHTML="👣 Walk";
      if (corpseState != "" && areaName === "Shrouded Necropolis" && enemyBossType.includes("Boss")) setButton('button_roll', "🤲 Hold", colorGold);
      if (isFishing) setButton('button_roll',"❌ Ditch");
      if (enemyEmoji=="🛶" || areaName=="River of Sorrows") setButton("button_roll","🛶 Sail");
      break;

    case "Curse":
      document.getElementById('button_grab').innerHTML="✋ Reach";
      document.getElementById('button_roll').innerHTML="👣 Ignore";
      if (encounterUsed) document.getElementById('button_roll').innerHTML="👣 Walk";
      document.getElementById('button_heal').innerHTML="🧠 Endure";
      if (encounterUsed) setButton('button_heal',"🧠 Endure",colorDarkGrey);
      setButton('button_sleep',"😵‍💫 Submit");
      if (encounterUsed) setButton('button_sleep',playerSleepType+" Sleep");
      if (encounterUsed) if (playerSta<playerStaMax || playerMgk<playerMgkMax) setButton('button_sleep',playerSleepType+" Sleep",colorLightBlue);
      if (encounterUsed) if (playerRested && (!enemyType.includes("Trap"))) setButton('button_sleep',"💤 Sleep",colorDarkGrey);
      break;

    case "Memory":
      setButton('button_attack', "👊 Strike", colorRed);
      setButton('button_roll', "👣 Leave");
      setButton('button_sleep', '💤 Sleep', playerRested ? colorDarkGrey : colorFairy);
      setButton('button_grab', "🫲 Caress", encounterUsed ? colorDarkGrey : colorYellow);
      setButton('button_speak', "💭 Recall", encounterUsed ? colorDarkGrey : colorGrapefruit);
      break;

    case "Mirror":
      setButton('button_speak', playerSpeakType + " Speak", encounterUsed ? colorDarkGrey : colorYellow);
      break;

    case "Item":
      setButton('button_grab',"👋 Grab",grabColor);
      setButton('button_roll',"❌ Ditch",colorRed);
      var _isMemento = enemyTeam.includes("Lover's Memento") || enemyTeam.includes("Piece of History");
      if (_isMemento&&!encounterUsed) setButton('button_speak',"💭 Recall",colorGrapefruit);
      if (_isMemento&&encounterUsed) setButton('button_speak',"💭 Recall",colorDarkGrey);
      if (_isMemento) setButton('button_grab',"👋 Grab",colorGold);
      if (_isMemento) setButton('button_attack',"💔 Shred",colorRed);
      if (_isMemento) setButton('button_roll',"👣 Leave");
      if (enemyEmoji=="🪙" || enemyEmoji=="💰") setButton('button_grab',"👋 Claim",colorLightShadeBlue);
      if (enemyEmoji=="🪙" && enemyName.includes("Lucky")) setButton('button_grab',"👋 Claim",colorSoftGreen);
      if (enemyItemSlot) {
        if (getPlayerSlot(enemyItemSlot)) {
          setButton('button_grab',"♻️ Swap",grabColor);
        } else {
          setButton('button_grab',"👋 Equip",grabColor);
        }
      }
      break;

    case "Trap":
    case "Trap-Big":
    case "Trap-Attack":
    case "Trap-Sleep":
      document.getElementById('button_grab').innerHTML="✋ Reach";
      if (encounterUsed) setButton('button_grab',"✋ Reach",colorDarkGrey);
      document.getElementById('button_roll').innerHTML="👣 Avoid";
      if (areaName=="River of Sorrows") setButton("button_roll","🛶 Sail");
      break;

    case "Trap-Roll":
    case "Prop":
      document.getElementById('button_grab').innerHTML="✋ Reach";
      if (encounterUsed) setButton('button_grab',"✋ Reach",colorDarkGrey);
      document.getElementById('button_roll').innerHTML="👣 Walk";
      if (areaName=="River of Sorrows") setButton("button_roll","🛶 Sail");
      break;

    case "Trap-Obstacle":
      document.getElementById('button_grab').innerHTML="👋 Move";
      document.getElementById('button_roll').innerHTML="👣 Walk";
      if (areaName=="River of Sorrows") setButton("button_roll","🛶 Sail");
      break;

    case "Dream":
      setButton('button_grab',"✋ Reach",colorDarkGrey);
      setButton('button_roll',"👣 Walk", colorGold);
      if (enemyName.includes("Waking Moment")) setButton('button_roll',"👁️ Awaken",colorGold);
      if (playerSta==0) setButton('button_roll',"👣 Walk",colorDarkGrey);
      setButton('button_speak',"💬 Speak",colorDarkGrey);
      setButton('button_sleep',"💤 Sleep",colorLightBlue);
      if (enemyName.includes("Regrets")) {
        setButton('button_sleep',"🙁 Accept",colorSoftRed);
        setButton('button_roll',"👐 Shrug",colorSoftRed);
       }
      if (enemyName.includes("Waking Moment") || enemyName.includes("Horrific Realization")) setButton('button_sleep',"💤 Sleep",colorDarkGrey);
      if (areaName.includes("Shrouded")) setButton('button_sleep',"🧠 Think",colorRed);
      break;

    case "Fishing":
      document.getElementById('button_roll').innerHTML="👣 Walk";
      if (areaName=="River of Sorrows") setButton("button_roll","🛶 Sail");
      setButton('button_grab',"🎣 Fish",colorWhite);
      var bait=checkPlayerHasItem(validBaits);
      if (bait!="" && playerLootString.includes(bait)) setButton('button_grab',"🎣 Fish",colorYellow);
      if (playerSta<1) setButton('button_grab',"🎣 Fish",colorDarkGrey);
      break;

    case "Small":
      if (enemyInt>-1 && enemyInt<playerInt && enemyAtk>0) {
        setButton('button_speak',"💬 Defuse");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
      setButton('button_sleep',"💤 Rest");
      break;

    case "Recruit":
      if ((enemyInt < playerInt) && (enemySta-enemyStaLost == 0)){ //If they are tired and you are smarter they join you
        setButton('button_speak',"💬 Recruit");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
      if ((playerSta == 0)&&(enemySta-enemyStaLost==0)) document.getElementById('button_grab').innerHTML="🦶 Kick";
      setButton('button_sleep',"💤 Rest");
      break;

    case "Friend":
      setButton('button_speak',playerSpeakType+" Speak",colorWhite);
      if (enemyStatusString.includes("Adversary")) setButton('button_speak',playerSpeakType+" Speak",colorWhite);

      var heldQuestItem=checkPlayerHasItem(enemyQuestItems);
      if (heldQuestItem!="") {
        setButton('button_speak',heldQuestItem+" Give",colorYellow);
      }
      break;

    case "Pet":
      if ((enemySta - enemyStaLost) <= 0 && (playerSta > 0)) document.getElementById('button_grab').innerHTML="👋 Pet";
      if (enemyInt>-1 && enemyInt<playerInt && enemyAtk>0) {
        setButton('button_speak',"💬 Defuse");
        if ((enemySta - enemyStaLost) <= 0) setButton('button_speak',"💬 Soothe");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
    case "Stingy":
    case "Toxic":
    case "Hot":
    case "Tough":
    case "Standard":
      if ((playerSta == 0)&&(enemySta-enemyStaLost==0)) { //Applies for all above without "break;"
        document.getElementById('button_grab').innerHTML="🦶 Kick";
      }
      if (enemyInt>-1 && enemyInt<playerInt && enemyAtk>0) {
        setButton('button_speak',"💬 Defuse");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
      setButton('button_sleep',"💤 Rest");
      break;

    case "Heavy":
    case "Swift":
    case "Reflective":
      if (enemySta-enemyStaLost==0) {
        document.getElementById('button_grab').innerHTML="🦶 Kick";
      }
      if (enemyInt>-1 && enemyInt<playerInt && enemyAtk>0) {
        setButton('button_speak',"💬 Defuse");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
      setButton('button_sleep',"💤 Rest");
      break;

    case "Undead":
    case "Spirit":
    case "Demon":
      if (enemyType!="Undead" && enemyInt>-1 && enemyInt<playerInt && enemyAtk>0) {
        setButton('button_speak',"💬 Defuse");
      } else if (playerLootString.includes("🏳️")) {
        setButton('button_speak',"🏳️ Waive");
      }
      setButton('button_sleep',"💤 Rest");
      break;

    case "Death":
      ['button_sleep','button_cast',
       'button_heal','button_curse'].forEach(function(id){
        setButton(id,"-",colorDarkGrey);
        //document.getElementById(id).disabled = true; //Do not disable buttons to allow keyboard navigation
      });
      setButton('button_attack',"✨ Revive",colorGold);
        if (areaName.includes("Auxiliary")) setButton('button_attack',"✨ Revive",colorDarkGrey);
      setButton('button_roll',"❌ Resign",colorRed);
        if (areaName.includes("Auxiliary")) setButton('button_roll',"✅ Return",colorGreen);
      setButton('button_block',"💚 Rate",colorSoftGreen);
      setButton('button_speak',"📎 Share",colorWhite);
      setButton('button_grab',"🗣️ Greet",colorLightBlue);
      break;

    case "Shop":
      var availableCoins=savedCoins-spentCoins;
      setButton('button_attack',"1 🪙 Favor",colorSoftGreen);
        if (availableCoins<1) setButton('button_attack',"1 🪙 Favor",colorDarkGrey);

      setButton('button_roll',"👣 Leave",colorRed);
      if (availableCoins<=0) setButton('button_roll',"👣 Leave",colorYellow);

      setButton('button_grab',"1 🪙 Item",colorWhite);
        if (availableCoins<1) setButton('button_grab',"1 🪙 Item",colorDarkGrey);

      setButton('button_block',"2 🪙 Body",colorSoftGreen);
        if (availableCoins<2) setButton('button_block',"2 🪙 Body",colorDarkGrey);

      setButton('button_sleep',"2 🪙 Item",colorLightBlue);
        if (availableCoins<2) setButton('button_sleep',"2 🪙 Item",colorDarkGrey);

      setButton('button_speak',"3 🪙 Item",colorPurple);
        if (availableCoins<3) setButton('button_speak',"3 🪙 Item",colorDarkGrey);

      setButton('button_cast',"1 🪙 Risk",colorRed);
        if (availableCoins<1) setButton('button_cast',"1 🪙 Risk",colorDarkGrey);

      setButton('button_heal',"3 🪙 Level",colorYellow);
        if (availableCoins<3) setButton('button_heal',"3 🪙 Level",colorDarkGrey);

      setButton('button_curse',"4 🪙 Artif.",colorOrange);
        if (availableCoins<4) setButton('button_curse',"4 🪙 Artif.",colorDarkGrey);
      break;

    default:
      if (enemyType=="Checkpoint") setButton('button_grab',"✨ Praise",colorYellow)
      if (enemyType.includes("Heavy")||enemyType.includes("Swift")) {
        if (enemySta-enemyStaLost==0) document.getElementById('button_grab').innerHTML="🦶 Kick";
      } else {
        if (!enemyType.includes("Boss")) setButton('button_roll',"👣 Walk");
        if (enemyType.includes("Container")) setButton('button_grab',"👀 <b style=\"color:"+colorYellow+";\">Search</b>");
        if (enemyType.includes("Locked")){
          setButton('button_cast',"🪄 Unlock");
          if (playerMgk<2) setButton('button_cast',"🪄 Unlock",colorDarkGrey)
          if (playerLootString.includes("🗝️")){
            document.getElementById('button_grab').innerHTML="🗝️ Unlock";
          } else if (playerLootString.includes("📎")) {
            setButton('button_grab',"️📎 Unlock",colorOrange);
          } else {
          document.getElementById('button_grab').innerHTML="👋 Reach";
          }
        }
      }
      break;
  }
  //After all button manipulations
  if (enemyHp>0 && enemySta>0 && corpseState==="") {
    if (((enemyAtk+enemyAtkBonus)<=0)) setButton('button_block',"☝️ Tease")
    if (((enemyAtk+enemyAtkBonus)<=0) && playerSta<=0) setButton('button_block',"☝️ Tease",colorDarkGrey)
  }

  // Corpse state overrides
  if (corpseState !== "") {
    if (corpseHasLoot) {
      setButton('button_grab',"👀 Search",colorYellow);
    } else {
      document.getElementById('button_grab').innerHTML="✋ Touch";
    }
  }

  enemyType=originalType;
}

//Button action resolvers (raw — invoked by ActionBar after skill-check resolves)
var callback_attack = resolveAction('button_attack');
var callback_roll   = resolveAction('button_roll');
var callback_block  = resolveAction('button_block');
var callback_grab   = resolveAction('button_grab');
var callback_sleep  = resolveAction('button_sleep');
var callback_speak  = resolveAction('button_speak');
var callback_cast   = resolveAction('button_cast');
var callback_pray   = resolveAction('button_heal');
var callback_curse  = resolveAction('button_curse');

// Wrapped pointerdown handlers (stored for removal)
var _abHandlers      = {};
var _menuHandler     = null;
var _memoriesHandler = null;
var _technicalHandler = null;

var _ACTION_BUTTONS = [
  ['button_attack', function() { return callback_attack; }],
  ['button_roll',   function() { return callback_roll;   }],
  ['button_block',  function() { return callback_block;  }],
  ['button_grab',   function() { return callback_grab;   }],
  ['button_sleep',  function() { return callback_sleep;  }],
  ['button_speak',  function() { return callback_speak;  }],
  ['button_cast',   function() { return callback_cast;   }],
  ['button_heal',   function() { return callback_pray;   }],
  ['button_curse',  function() { return callback_curse;  }],
];

function registerClickListeners(delay=0){
  setTimeout(function(){
    removeClickListeners();
    _ACTION_BUTTONS.forEach(function(pair) {
      var id  = pair[0];
      var raw = pair[1]();
      var handler = function(e) {
        e.preventDefault();
        AchievementManager.dismissToast();
        var _pb  = document.getElementById(id);
        var _pbb = _pb.querySelector('b');
        var _pbc = _pbb ? _pbb.style.color : '';
        _pb.classList.remove('btn-pressed');
        void _pb.offsetWidth;
        _pb.style.filter = (_pbc && _pbc.toUpperCase() !== '#FFFFFF')
          ? 'brightness(1.2) drop-shadow(0 0 5px ' + _pbc + ')'
          : 'brightness(1.2)';
        _pb.classList.add('btn-pressed');
        _pb.addEventListener('animationend', function _pbDone(ev) {
          if (ev.target !== ev.currentTarget) return;
          _pb.classList.remove('btn-pressed');
          _pb.style.filter = '';
        }, { once: true });
        ActionBar.showActionBar(calcActionBarConfig(id), function(isSuccess, val, critResult) {
          actionBarSuccess = isSuccess;
          actionBarCrit = critResult || null;
          raw();
        }, document.getElementById(id));
      };
      _abHandlers[id] = handler;
      document.getElementById(id).addEventListener('pointerdown', handler);
    });

    _menuHandler = function() { menuFade(function() { Menu.show(); }); };
    document.getElementById('button_menu').addEventListener('click', _menuHandler);
    _memoriesHandler = function() { menuFade(function() { Menu.showMemories(); }); };
    document.getElementById('button_challenges').addEventListener('click', _memoriesHandler);
  }, delay);
}

function removeClickListeners(){
  _ACTION_BUTTONS.forEach(function(pair) {
    var id = pair[0];
    if (_abHandlers[id]) {
      document.getElementById(id).removeEventListener('pointerdown', _abHandlers[id]);
      delete _abHandlers[id];
    }
  });
  if (_menuHandler) {
    document.getElementById('button_menu').removeEventListener('click', _menuHandler);
    _menuHandler = null;
  }
  if (_memoriesHandler) {
    document.getElementById('button_challenges').removeEventListener('click', _memoriesHandler);
    _memoriesHandler = null;
  }
  ActionBar.hideActionBar();
}

function registerClickListenersTechnical(){
  if (_technicalHandler) return;
  var eventType = 'click';

  // versionIDUIElement.addEventListener(eventType, ()=> {
  //   actionString="⚙️"
  //   adventureEndReason="\nDebug: "+enemyEmoji+" "+enemyName
  //   //copyAdventureToClipboard();
  //   redirectToFeedback();
  //   redraw();
  // });

  _technicalHandler = ()=>{
    var oldName=playerName;
    renameCharacter(function(newName) {
      if (_applyCheatName(newName)) return;
      if (oldName!=newName) logAction("✏️ ▸ ✨ Renamed to: <b>"+newName+"</b>");
      redraw();
    });
  };
  document.getElementById('id_player_level').addEventListener(eventType, _technicalHandler);
}
