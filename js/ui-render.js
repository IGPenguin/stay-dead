//UI DRAW FUNCTIONS
function redraw(){
  //Version
  versionIDUIElement = document.getElementById('id_version')
  versionIDUIElement.innerHTML = versionCode

  //Disable debug show last generator below
  //versionIDUIElement.innerHTML = versionCode+"<br>"+lastGeneratorName+" (#"+adventureEncounterCount+")";

  //Player UI
  playerInfoUIElement = document.getElementById('id_player_info');
  toolbarCardUIElement = document.getElementById('id_toolbar_card');
  document.getElementById('id_player_name').innerHTML = (playerEmoji ? playerEmoji + ' ' : '') + playerName;

  playerLevelUIELement = document.getElementById('id_player_level');
  var lvlSymbol= ""
  if (playerXP>=playerXPThreshold) lvlSymbol="⇡ "
  playerLevelUIELement.innerHTML = decorateStatusText("","Level "+playerLevel+lvlSymbol,colorGold);

  var _hasMgk = playerMgkMax > 0 || playerMgk > 0;
  var playerStatusString = buildStatsUI(
    playerHp,  playerHpMax - playerHp,
    playerSta, playerStaMax - playerSta,
    playerAtk > 0 ? playerAtk : 0, 0,
    _hasMgk ? playerMgk : 0, _hasMgk ? playerMgkMax - playerMgk : 0,
    playerDef > 0 ? playerDef : 0
  );

  document.getElementById('id_player_status').innerHTML = playerStatusString;
  var _party = String(playerPartyString);
  var _loot  = String(playerLootString);
  var _partyLootParts = [];
  if (_party.length > 0) _partyLootParts.push(_party);
  if (_loot.length  > 0) _partyLootParts.push(_loot);
  document.getElementById('id_player_party_loot').innerHTML = _partyLootParts.length > 0 ? _partyLootParts.join('&nbsp;|') : "x x x";

  //Versus UI
  versusTextUIElement = document.getElementById('id_versus');

  //Encounter UI
  areaUIElement = document.getElementById('id_area');
  nameUIElement = document.getElementById('id_name');
  cardUIElement = document.getElementById('id_card');
  enemyInfoUIElement = document.getElementById('id_enemy_card_contents'); //This is just for animations, so :shrug:
  emojiUIElement = document.getElementById('id_emoji');
  emojiWrapperUIElement = document.getElementById('id_emoji_wrapper');
  emojiFlipperUIElement = document.getElementById('id_emoji_flipper');
  emojiFlipperUIElement.style.transform=enemyEmojiScaleX; //Visual variety ++
  enemyTeamUIElement = document.getElementById('id_team');

  emojiUIElement.innerHTML = enemyEmoji;
  areaUIElement.innerHTML = areaName;
  var _familiarBadge = enemyFamiliar
    ? '<span style="float:right; margin-top:6px; line-height:1; font-size:14px;">🧩 <i style="font-weight:600; color:' + colorSoftGreen + ';font-size:14px; -webkit-text-stroke:3px #121212; paint-order:stroke fill; padding-right:8px;">Memory</i></span>'
    : '';
  var _mkBadge = function(e,l,c){ return '<span style="float:right;margin-top:6px;line-height:1;font-size:14px;padding-right:8px;">'+decorateStatusText(e,l,c)+'</span>'; };
  var _typeBadge = '';
  nameUIElement.innerHTML = enemyName + _familiarBadge;

  var enemyDescUIElement = document.getElementById('id_desc')
  enemyDescUIElement.innerHTML = enemyDesc;

  //Hacky hacky hacky hack hack hack, hacky hacky hacky, yeah yeah
  enemyDescUIElement.innerHTML+="<br><center><i style=\"color:"+colorGrey+";"+"font-size:13px; padding-right:8px;\">"+"» "+enemyTeam+" «"+"</i></center>"; //enemyTeamUIElement.innerHTML=enemyTeam;

  //Encounter Statusbar UI
  enemyTeamUIElement.innerHTML="";
  cardUIElement.style.backgroundColor=colorCardBackground;
  cardUIElement.style.backgroundPosition='';
  cardUIElement.style.backgroundSize='';
  cardUIElement.style.backgroundRepeat='';
  cardUIElement.style.backgroundAttachment='';
  cardUIElement.style.backgroundOrigin='';
  cardUIElement.style.backgroundClip='';
  cardUIElement.style.boxShadow='';
  cardUIElement.classList.remove('invader-card');

  switch(enemyType) {
    case "Pet":
      _typeBadge=_mkBadge("🔸","Minion",colorOrange);
      enemyStatusString=appendEnemyStats();
      break;
    case "Swift":
      _typeBadge=_mkBadge("💨","Swift",colorGreen);
      enemyStatusString=appendEnemyStats();
      break;
    case "Heavy":
      _typeBadge=_mkBadge("🔺","Strong",colorRed);
      enemyStatusString=appendEnemyStats();
      break;
    case "Spirit":
      _typeBadge=_mkBadge("👻","Spectral",colorWhite);
      enemyStatusString=appendEnemyStats();
      break;
    case "Friend":
      enemyStatusString=decorateStatusText("💚","Friend",colorDarkGreen);
      if (totalMalus<0) enemyStatusString=decorateStatusText("💔","Remorseful",colorRed);
      if (areaName.includes("Shrouded") && !isFishing) {
        enemyStatusString=decorateStatusText("💔","Stranger",colorRed);
        cardUIElement.style.backgroundColor=colorDarkRed;
      }
      //Do not display stats = reward hidden
      break;
    case "Small":
      _typeBadge=_mkBadge("🔻","Small",colorWhite);
      enemyStatusString=appendEnemyStats();
      break;
    case "Recruit":
    case "Standard":
      _typeBadge=_mkBadge("▫️","Standard",colorWhite);
      enemyStatusString=appendEnemyStats();
      break;
    case "Demon":
      _typeBadge=_mkBadge("👺","Demon",colorRed);
      enemyStatusString=appendEnemyStats();
      break;
    case "Undead":
      _typeBadge=_mkBadge("💀","Undead",colorGrey);
      enemyStatusString=appendEnemyStats();
      break;
    case "Stingy":
      _typeBadge=_mkBadge("📌","Stingy",colorGrapefruit);
      enemyStatusString=appendEnemyStats();
      break;
    case "Toxic":
      _typeBadge=_mkBadge("🦠","Toxic",colorLime);
      enemyStatusString=appendEnemyStats();
      break;
    case "Tough":
      var enemyDefString = "";
      if (enemyDef>1) enemyDefString = romanNumber(enemyDef);
      _typeBadge=_mkBadge("🐚","Tough "+enemyDefString,colorSemiDarkGrey);
      enemyStatusString=appendEnemyStats();
      break;
    case "Hot":
      _typeBadge=_mkBadge("♨️","Blazing",colorGrapefruit);
      enemyStatusString=appendEnemyStats();
      break;
    case "Reflective":
      _typeBadge=_mkBadge("🔹","Reflective",colorLightBlue);
      enemyStatusString=appendEnemyStats();
      break;

    case "Shop": //Undertaker, Fatebound, Pactbound
      enemyStatusString=decorateStatusText("⚖️","Fatekeeper",colorLightShadeBlue);
      cardUIElement.style.backgroundColor=colorShadeBlue;
      break;

    case "Item":
      var _itemStats = { atk: enemyAtk, mgk: enemyMgk, hp: enemyHp, sta: enemySta, lck: enemyLck, int: enemyInt, def: enemyDef };
      var itemNet = RarityManager.calcNet(_itemStats);
      var _itemHasPositive = ['atk','mgk','hp','sta','lck','int','def'].some(function(k){ return (_itemStats[k]||0) > 0; });
      if (itemNet > 0 || _itemHasPositive || (enemyEmoji=="🗝️") || (enemyEmoji=="🔑")){
        enemyStatusString=decorateStatusText("⚜️","Valuable",colorGold);
        if (itemNet >= ITEM_NET_THRESHOLDS.uncommon){
          enemyStatusString=decorateStatusText("🔷","Magnificent",colorLightBlue);
          cardUIElement.style.backgroundColor=colorDarkBlue;
        }
        if (itemNet >= ITEM_NET_THRESHOLDS.rare){
          enemyStatusString=decorateStatusText("🟣","Exquisite",colorPurple);
          cardUIElement.style.backgroundColor=colorDarkPurple;
        }
      } else {
        enemyStatusString=decorateStatusText("🕸️","Rubbish","lightgrey");
      }
      if (itemNet >= ITEM_NET_THRESHOLDS.legendary || enemyTeam.includes("Artifact") || enemyTeam.includes("Questionable Drink")) {
        enemyStatusString=decorateStatusText("🟠","Legendary",colorOrange);
        cardUIElement.style.backgroundColor=colorDarkOrange;
      }
      if (enemyTeam.includes("Lover's Memento")||enemyTeam.includes("Piece of History")) {
        enemyStatusString=decorateStatusText("💔","Remembrance",colorPink);
        cardUIElement.style.backgroundColor=colorDarkPink;
      }
      if (enemyEmoji=="🪙" || enemyEmoji=="💰"){
        enemyStatusString=decorateStatusText("🧬","Everlasting",colorLightShadeBlue);
        cardUIElement.style.backgroundColor=colorShadeBlue;
        if (enemyName.includes("Lucky")){
          enemyStatusString=decorateStatusText("🍀","Fortune",colorSoftGreen);
          cardUIElement.style.backgroundColor=colorSoftGreen;
        }
      }
      if (enemyTeam.includes("Possesion")) enemyStatusString=decorateStatusText("⭐️","Quest Item",colorYellow);
      // Slot label: inject "(Head)" / "(Weapon)" / "(Chest)" after the tier word
      if (enemyItemSlot) {
        var _slotLabel = enemyItemSlot.charAt(0).toUpperCase() + enemyItemSlot.slice(1);
        enemyStatusString = enemyStatusString.replace(
          /(Rubbish|Valuable|Magnificent|Exquisite|Legendary|Quest Item|Remembrance)/,
          '$1 (' + _slotLabel + ')'
        );
      }

      grabColor=colorWhite;
      if (enemyStatusString.includes("Valuable")||enemyStatusString.includes("Quest")) grabColor=colorYellow;
      if (enemyStatusString.includes("Magnificent")) grabColor=colorLightBlue;
      if (enemyStatusString.includes("Exquisite")) grabColor=colorPurple;
      if (enemyStatusString.includes("Legendary")) grabColor=colorOrange;
      break;

    case "Consumable":
      var itemNet = RarityManager.calcConsumableNet({ atk: enemyAtk, mgk: enemyMgk, hp: enemyHp, sta: enemySta, lck: enemyLck, int: enemyInt, def: enemyDef });
      eatColor=colorWhite;
      enemyStatusString=decorateStatusText("❤️","Refreshment",colorWhite)
      if (enemyHp<0 || enemyAtk<0 || enemySta<0 || enemyLck<0 || enemyInt<0 || enemyMgk<0){
        enemyStatusString=decorateStatusText("🚩","Hazardous",colorRed);
        eatColor=colorRed;
      }
      if (itemNet >= CONSUMABLE_NET_THRESHOLDS.uncommon){
        enemyStatusString=decorateStatusText("💙","Refreshment",colorLightBlue);
        cardUIElement.style.backgroundColor=colorDarkBlue;
        eatColor=colorLightBlue;
      }
      if (itemNet >= CONSUMABLE_NET_THRESHOLDS.rare){
        enemyStatusString=decorateStatusText("💜","Refreshment",colorPurple);
        cardUIElement.style.backgroundColor=colorDarkPurple;
        eatColor=colorPurple;
      }
      if (itemNet >= CONSUMABLE_NET_THRESHOLDS.legendary || enemyTeam.includes("Artifact") || enemyTeam.includes("Essence")){
        enemyStatusString=decorateStatusText("🟠","Legendary",colorOrange);
        cardUIElement.style.backgroundColor=colorDarkOrange;
        eatColor=colorOrange;
      }
      break;

    case "Trap":
    case "Trap-Big":
    case "Trap-Attack":
    case "Trap-Roll":
    case "Trap-Sleep":
    case "Trap-Obstacle":
      enemyStatusString=decorateStatusText("⚫️","Obstacle",colorSemiDarkGrey);
      if (totalBonus>0) enemyStatusString=decorateStatusText("🎀","Curiosity",colorLightPink);
      if (totalMalus<0) enemyStatusString=decorateStatusText("🚩","Hazardous",colorRed);
      break;
    case "Dream":
      enemyStatusString=decorateStatusText("💭","Guidance","#FFFFFF");
      if (areaName.includes("Shrouded")) enemyStatusString=decorateStatusText("⁉️","Unsettling Anxiety",colorRed);
      break;
    case "Upgrade":
      enemyStatusString=decorateStatusText("⭐️","Advancement",colorGold);
      cardUIElement.style.backgroundColor=colorDarkGold;
      break;
    case "Prop":
      enemyStatusString=decorateStatusText("⚪️","Unremarkable",colorWhite);
      if (totalBonus>0)enemyStatusString=decorateStatusText("🟢","Comfortable",colorSoftGreen);
      if (totalMalus<0)enemyStatusString=decorateStatusText("🔴","Uncomfortable",colorSoftRed);
      if (enemyName.includes("Bride")) enemyStatusString=decorateStatusText("💔","Stranger",colorRed);
      if (corpseState!=="" && corpseHasLoot) enemyStatusString=decorateStatusText("🟡","Interesting",colorYellow);
      if (enemyName.includes("Regrets")) {
        enemyStatusString=decorateStatusText("❌","Misfortune",colorSoftRed);
        cardUIElement.style.backgroundColor=colorSoftRed;
      }
      break;
    case "Altar":
      enemyStatusString=decorateStatusText("⚪️","Unremarkable",colorWhite);
      if (totalBonus>0) enemyStatusString=decorateStatusText("🌙","Place of Worship",colorGold);
      if (totalMalus<0) enemyStatusString=decorateStatusText("♦️","Sacrificial Altar",colorRed);
      break;
    case "Fishing":
      enemyStatusString=decorateStatusText("🪝","Fishing Spot",colorGold);
      cardUIElement.style.backgroundColor=colorDarkBlue;
      //emojiWrapperUIElement.style.background=colorDarkBlue;
      break;
    case "Curse":
      enemyStatusString=decorateStatusText("🔆","Condition",colorYellow);
      if (parseInt(totalMalus)<0)enemyStatusString=decorateStatusText("♣️","Mystery",colorDarkGrey);
      break;
    case "Death":
      enemyStatusString=decorateStatusText("🦴","Deceased","lightgrey");
      if (areaName.includes("Auxiliary")) {
        enemyStatusString=decorateStatusText("🎉","Achievement",colorOrange);
        cardUIElement.style.backgroundColor=colorDarkOrange;
      }
      break;
    case "Checkpoint":
      enemyStatusString=decorateStatusText("🌙","Source of Power",colorGold);
      cardUIElement.style.backgroundColor=colorDarkOrange;
      break;
    case "Memory":
        enemyStatusString=decorateStatusText("💔","Remembrance",colorPink);
        cardUIElement.style.backgroundColor=colorDarkPink;
        break;
    case "Mirror":
        enemyStatusString=decorateStatusText("🌗","Reflection",colorDarkGrey);
        cardUIElement.style.backgroundColor=colorSuperDarkGrey;
        break;
    default:
      enemyStatusString=decorateStatusText("⚠️","No Details","red");
      //Multi-match
      if (enemyType && enemyType.includes("Container")) enemyStatusString=decorateStatusText("🟡","Interesting",colorYellow);
      if (enemyType && enemyType.includes("Container")&&(parseInt(totalMalus)<0)) enemyStatusString=decorateStatusText("🚩","Hazardous",colorRed);

      if (enemyType && enemyType.includes("Locked")) enemyStatusString=decorateStatusText("🗝️","Locked",colorGrey);

      if (enemyBossType.includes("Boss")){
        if (enemyBossType === 'Boss-Rival') {
          _typeBadge=_mkBadge("💔","Invader",colorRed);
          enemyStatusString=appendEnemyStats();
          cardUIElement.style.backgroundColor=colorDarkRed;
          cardUIElement.style.boxShadow='inset 0px 0px 0px 3px #cc2020, 0 0 18px rgba(200,32,32,0.7), 0 4px 8px rgba(0,0,0,0.5)';
          cardUIElement.classList.add('invader-card');
        } else {
          _typeBadge=_mkBadge("💀","Boss",colorRed);
          enemyStatusString=appendEnemyStats();
          cardUIElement.style.backgroundColor=colorDarkRed;
        }
      }
      break;
  }

  if (_typeBadge) nameUIElement.innerHTML += _typeBadge;
  document.getElementById('id_stats').innerHTML = enemyStatusString;
  var logEl = document.getElementById('id_log');
  logEl.innerHTML = adventureLog.split("<br>").filter(l => l.replace(/&nbsp;/g,"").trim()).reverse().join("<br>");
  logEl.scrollTop = 0;

  versusTextUIElement = document.getElementById('id_versus');
  switch (enemyType){
    case "Dream":
      displayPlayerState("Sleeping",colorBlue,"2.5")
      if (areaName.includes("Fading")) displayPlayerState();
      if (areaName.includes("Shrouded")) displayPlayerState("Frightened",colorRed,"0.4");
      break;

    case "Curse":
    case "Trap":
    case "Trap-Big":
    case "Trap-Roll":
    case "Trap-Attack":
    case "Trap-Sleep":
    case "Trap-Obstacle":
      displayPlayerState("Suspicious",colorOrange,"1")
      break;

    case "Shop":
      displayPlayerState("Deciding",colorDarkYellow,"2.5")
      break;

    case "Death":
      displayPlayerState(emptySpace,colorGrey,"0")
      break;

    default:
      displayPlayerState(); //Cautious by default
      if (enemyType && (enemyType.includes("Container") || enemyType.includes("Friend") || enemyType=="Prop" || enemyType=="Item"||enemyType=="Consumable"||enemyType=="Checkpoint"||enemyType=="Altar"||enemyType=="Fishing")){
        if (playerSta>=playerStaMax) displayPlayerState("Relaxed",colorDarkGreen,"2.5"); //I need this to be overwritable by the below
        if (playerSta<=(playerStaMax/2)) displayPlayerState("Fatigued",colorYellow,"2"); //I need this to be overwritable by the below
        if (playerSta==0) displayPlayerState("Exhausted",colorOrange,"2"); //I need this to be overwritable by the below
        if ((enemyType==="Fishing" && checkPlayerHasItem(validBaits)!="")) displayPlayerState("Bait Ready",colorPink,"0.8");
        if (enemyStatusString.includes("Legendary") || enemyEmoji=="🪙" || enemyEmoji=="💰") displayPlayerState("Excited",colorDarkYellow,"0.4");

        //Slot conflict = deciding
        if (enemyItemSlot && getPlayerSlot(enemyItemSlot)) {
          displayPlayerState("Deciding",colorRed,"1")
        }

      }
      if (enemyType=="Upgrade") displayPlayerState("Excited",colorGold,"0.5"); //I need this to be overwritable by the below
      if (enemyTeam && (enemyTeam.includes("Imaginary") || enemyTeam.includes("Turning Point"))) displayPlayerState("Sleeping",colorBlue,"2.5"); //Shitty, I know, its the tutorial
      if (enemyTeam && (enemyTeam.includes("Lover's Memento")||enemyTeam.includes("Piece of History"))&&!encounterUsed) displayPlayerState("Frightened",colorRed,"0.4");
      if (enemyTeam && (enemyTeam.includes("Lover's Memento")||enemyTeam.includes("Piece of History"))&&encounterUsed) displayPlayerState("Reminiscing",colorPink,"2.5");
      if (enemyTeam && enemyTeam.includes("Unlucky Moment")) displayPlayerState("Disappointed",colorRed,"2");
      if (corpseState === "" && enemyHp>0 && ((enemyAtk+enemyAtkBonus)>0 || enemyMgk>0)) {
        displayPlayerState("In Combat",colorRed,"0.8");
        setButton('button_sleep',"💤 Rest"); //Hack
      }
      if (corpseState !== "") {
        if (playerSta>=playerStaMax) displayPlayerState("Relaxed",colorDarkGreen,"2.5");
        if (playerSta<=(playerStaMax/2)) displayPlayerState("Fatigued",colorYellow,"2");
        if (playerSta==0) displayPlayerState("Exhausted",colorOrange,"2");
      }
      if (playerHp === 1) displayPlayerState("Bleeding", colorRed, "0.4");
      if (enemyName.includes("Bride")) displayPlayerState("Frightened",colorRed,"0.4");
      break;
  }

  buttonsContainer = document.getElementById('id_buttons');
  updateXPProgress();
  adjustEncounterButtons();
  SaveManager.saveGameState();
}

function displayPlayerState(stateString="Cautious",color=colorGrey,time="3"){
  versusTextUIElement.innerHTML = "<div style=\"color:"+color+";\">"+stateString+"</div>"
  animateUIElement(versusTextUIElement,"animate__pulse",time,false,"",true);
}

function displayEnemyType(type){ //TODO Refactor usage or remove
  if ((enemyStatusString.replaceAll("&nbsp;","")!="")&&(!enemyStatusString.includes("</i>"))){
    enemyTeamUIElement.innerHTML=type;
  } else {
    enemyStatusString=type;
  }
}

function buildStatsUI(hp, hpLost, sta, staLost, atk, atkLost, mgk, mgkLost, def) {
  def = def || 0;
  var total = (hp + Math.max(hpLost, 0)) + (sta + Math.max(staLost, 0)) + (atk + Math.max(atkLost, 0)) + (mgk + Math.max(mgkLost, 0)) + def;
  var numericAtk = total > 16;
  function bar(cur, lost) {
    var s = cur > 0 ? fullSymbol.repeat(cur) : "";
    if (lost > 0) s += emptySymbol.repeat(lost);
    return s;
  }
  var parts = [];
  if (hp  > 0 || hpLost  > 0) parts.push('<span class="ui-emoji">❤️</span>&nbsp;' + bar(hp,  hpLost));
  if (sta > 0 || staLost > 0) parts.push('<span class="ui-emoji">🟢</span>&nbsp;' + bar(sta, staLost));
  if (mgk > 0 || mgkLost > 0) parts.push('<span class="ui-emoji">🔵</span>&nbsp;' + bar(mgk, mgkLost));
  if (atk > 0 || atkLost > 0) parts.push('<span class="ui-emoji">⚔️</span>&nbsp;' + (numericAtk ? '<span style="font-size:16px;line-height:1;vertical-align:middle;">' + atk + '</span>' : bar(atk, atkLost)));
  if (def > 0) parts.push('<span class="ui-emoji">🔰</span>&nbsp;' + (numericAtk ? '<span style="font-size:16px;line-height:1;vertical-align:middle;">' + def + '</span>' : bar(def, 0)));
  return parts.join('&nbsp;&nbsp;');
}

function appendEnemyStats(){
  var _atkEff = enemyAtk + enemyAtkBonus;
  var _showAtk = (_atkEff > 0) || (enemyAtk !== 0);
  return buildStatsUI(
    enemyHp  > 0    ? enemyHp  - enemyHpLost  : 0, enemyHp  > 0    ? enemyHpLost  : 0,
    enemySta > 0    ? enemySta - enemyStaLost  : 0, enemySta > 0    ? enemyStaLost : 0,
    _showAtk        ? _atkEff                  : 0, _showAtk && enemyAtkBonus < 0 ? -enemyAtkBonus : 0,
    enemyMgk > 0   ? enemyMgk - enemyMgkLost  : 0, enemyMgk > 0    ? enemyMgkLost : 0,
    enemyDef > 0   ? enemyDef                  : 0
  );
}

function decorateStatusText(emoji,text,color="#FFFFFF",size=14){
  if (emoji=="") return emoji+"<i style=\"font-weight:600;color:"+color+";font-size:"+size+"px; -webkit-text-stroke: 3px #121212;paint-order: stroke fill;\">"+text+"</i>";
  return emoji+" <i style=\"font-weight:600;color:"+color+";font-size:"+size+"px; -webkit-text-stroke: 3px #121212;paint-order: stroke fill;\">"+text+"</i>";
}

function updateXPProgress(){
  var playerXpProgressUIElement = document.getElementById('id_xp_progress');
  var progressbarWidth=(100/playerXPThreshold)*playerXP;
  if (progressbarWidth>97) progressbarWidth=97;
  playerXpProgressUIElement.style.width=progressbarWidth+"%";
}

function showAchievementToast(achievement, unlockTimestamp, onDone) {
  var old = document.getElementById('achievement_toast');
  if (old) old.remove();

  var toast = document.createElement('div');
  toast.id = 'achievement_toast';

  var toastColor = achievement.color || '#FFD940';

  var tsLine = '';
  if (unlockTimestamp) {
    if (typeof unlockTimestamp === 'string') {
      tsLine = '<h5 style="margin:2px 0 4px 0; opacity:0.6; font-size:14px; text-align:left;">' + unlockTimestamp + '</h5>';
    } else {
      var d = new Date(unlockTimestamp);
      tsLine = '<h5 style="margin:2px 0 4px 0; opacity:0.6; font-size:14px; text-align:left;">'
        + d.toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
        + '</h5>';
    }
  }

  toast.innerHTML =
    '<div id="achievement_toast_inner" style="display:flex; align-items:center; gap:10px; padding:7px 0px 8px 12px; margin-bottom:-8px;">'
      + '<span id="achievement_toast_emoji" style="font-size:22px; line-height:1; flex-shrink:0;">' + achievement.emoji + '</span>'
      + '<div id="achievement_toast_text" style="flex:1;">'
        + '<h5 style="margin:-2px 0 0 0; font-size:16px; line-height:1.2; font-style:normal; font-weight:600; color:' + toastColor + '; text-align:left; -webkit-text-stroke: 3px #121212;paint-order: stroke fill;">' + achievement.desc + '</h5>'
        + tsLine
      + '</div>'
    + '</div>';

  toast.style.cssText =
    'position:absolute; top:0; left:3px; right:3px;' +
    'z-index:9999; pointer-events:none; box-sizing:border-box;' +
    'background-color:#272727; overflow:hidden;' +
    'box-shadow:0 0 0 3px ' + toastColor + ';' +
    'opacity:0; transition:opacity 0.3s;';

  document.getElementById('id_action_bar_area').appendChild(toast);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() { toast.style.opacity = '1'; });
  });

  var _flashToast = function(n) {
    if (n <= 0) return;
    setTimeout(function() {
      if (document.getElementById('achievement_toast') !== toast) return;
      toast.style.boxShadow = '0 0 0 3px #fff, 0 0 8px ' + toastColor;
      setTimeout(function() {
        if (document.getElementById('achievement_toast') !== toast) return;
        toast.style.boxShadow = '0 0 0 3px ' + toastColor;
        _flashToast(n - 1);
      }, 350);
    }, n === 3 ? 200 : 180);
  };
  _flashToast(3);

  var _fadeOutToast = function() {
    if (document.getElementById('achievement_toast') !== toast) return;
    toast.style.transition = 'opacity 2s';
    toast.style.opacity = '0';
    setTimeout(function() {
      if (document.getElementById('achievement_toast') === toast) toast.remove();
      if (onDone) onDone();
    }, 2300);
  };

  if (achievement.unlock) {
    var innerEl = document.getElementById('achievement_toast_inner');
    var emojiEl = document.getElementById('achievement_toast_emoji');
    var textEl  = document.getElementById('achievement_toast_text');
    setTimeout(function() {
      if (document.getElementById('achievement_toast') !== toast) return;
      innerEl.style.transition = 'opacity 0.4s';
      innerEl.style.opacity = '0';
      setTimeout(function() {
        if (document.getElementById('achievement_toast') !== toast) return;
        emojiEl.textContent = '🔓';
        var hintLine = achievement.hint ? '<h5 style="margin:2px 0 4px 0; opacity:0.6; font-size:14px; text-align:left; font-style:italic;">' + achievement.hint + '</h5>' : '';
        textEl.innerHTML = '<h5 style="margin:-2px 0 0 0; font-size:16px; line-height:1.2; font-style:normal; font-weight:400; color:#ffffff; text-align:left;">' + achievement.unlock + '</h5>' + hintLine;
        innerEl.style.opacity = '1';
        setTimeout(_fadeOutToast, 4000);
      }, 400);
    }, 3000);
  } else {
    setTimeout(_fadeOutToast, 5000);
  }
}
