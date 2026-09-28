//Enemy
function enemyRest(stamina){
  if (enemyHp - enemyHpLost > 0){
    var _ol = document.getElementById('id_enemy_overlay');
    if (_ol && _ol.innerHTML != "💢") displayEnemyEffect("💤")
    enemyStaLost-=stamina;
    if (enemyStaLost < 0) {
      enemyStaLost = 0;
    }
  }
}

function enemyStaminaChangeMessage(stamina,successMessage,failMessage,color){
  if (enemyStaLost < enemySta) {
    logPlayerAction(actionString,successMessage,color); //TODO: switch emojis around >> 🐅 > ⚔️
    //animateUIElement(enemyInfoUIElement,"animate__headShake","0.7");

    //Play attack animation
    displayEnemyAttackEffect();

    enemyStaLost -= stamina;
    if (enemyStaLost > enemySta) enemyStaLost = enemySta;
    return true;
  } else if (enemyHp - enemyHpLost > 0) { //Enemy rest if not dead
    logPlayerAction(actionString,failMessage);
    //animateUIElement(enemyInfoUIElement,"animate__pulse","0.4");

    //Animate enemy rest
    displayEnemyRestEffect();
    displayEnemyEffect("💤");

    enemyStaLost += stamina
    return false;
  } else { //Enemy dead
    return false;
  }
}

function enemyHit(damage,magicType=false,applyLuck=true,silent=false) {
  if (playerHas("🐴")){ //Revert mask effect, just the first time hit
    if (enemyHpLost==0){
        enemyAtkBonus=enemyAtk;
        enemyMgkLost=0;
    }  
  }

  animateUIElement(emojiWrapperUIElement,"animate__shakeX","0.5"); //Animate hitreact
  var hitMsg = "Hit them with an attack -"+damage+" 💔";

  if (magicType==true) {
    actionString=playerCastType; hitMsg="Scorched them with a spell -"+damage+" 💔";
  } else { //Melee
      actionString="⚔️";
  }

  displayEnemyEffect("💢");
  var critChance = Math.floor(Math.random() * luckInterval);
  if ( (critChance <= playerLck) && applyLuck){
    logAction("🍀 ▸ "+actionString+" Your strike was blessed with luck.");
    hitMsg="Attack hit them critically -"+(damage+1)+" 💔";
    displayPlayerEffect("🍀");
    damage+=1;
  }

  if (damage<=0) {
    hitMsg="Your attack had no effect! ❌";
    displayEnemyEffect("");
  }
  if (enemyDef>0 && !magicType) {
    hitMsg=hitMsg+" ("+enemyDef+" 🔰)";
    if (damage<=0){
      hitMsg="Your attack was fully repelled! ("+enemyDef+" 🔰)";
      displayEnemyEffect("🔰");
    }
  }

  if (!silent) logPlayerAction(actionString,hitMsg);
  enemyHpLost = enemyHpLost + damage;

  if (!magicType && procAbilityChance("🀄️",10) && playerHp<playerHpMax){
      logAction("🀄️ "+arrowSymbol+" ✨ Your syphoned their health +1 ❤️");
      playerHp+=1;
  }

  if (enemyHpLost >= enemyHp) {
    enemyHpLost=enemyHp; //Negate overkill damage
    enemyKilled();
    return true;
  }

  if (enemyAtk==0 && enemyAtkBonus<1) {
    enemyAtkBonus++
    logAction(enemyEmoji+" "+arrowSymbol+" 💢 They got enraged gaining +1 ⚔️");
  }
}

function pushBossLoot() {
  if (areaName.includes("Shrouded")) return;
  if (areaName === "Fishing") {
    var _firstKill = !AchievementManager.isUnlocked('fish_boss_kill');
    AchievementManager.check('fish_boss_kill');
    if (_firstKill) pushEncounter(drachmaCoin);
    return;
  }
  if (procAbilityChance("", 25 + playerLck)) {
    pushEncounter(getWeightedEncounter(["Item"], ["Artifact"]));
  } else {
    pushEncounter(getWeightedEncounter(["Item"], [], "", ["Artifact", "Lost Possession"]));
  }
}

function enemyKilled(){
  var gainedXP=parseInt(playerGainXP(1,0,""));
  logAction(enemyEmoji + " ▸ " + "☠️ They've received a fatal blow " + decorateStatusText("","+"+gainedXP+" XP",colorGold));

  if (!isKarmaSafeKill()) { playerKarma-=1; dbg("karma-- ("+playerKarma+")"); }
  playerKills++;
  AchievementManager.check('kill');
  if (enemyBossType.includes('Boss') && !_isRival) {
    AchievementManager.check('boss_kill');
    if (areaName === 'Twisted Fairyland') AchievementManager.check('gate_fairyland');
    pushBossLoot();
  }

  var _wasFishing=isFishing;
  isFishing=false;

  if (_wasFishing) {
    animateFlipNextEncounter();
  } else {
    animateFlipToCorpse("killed");
  }
}

function enemyJoinedParty(){
  var _emoji=enemyEmoji, _atk=enemyAtk, _lck=enemyLck, _mgk=enemyMgk, _msg=enemyMsg;
  var _actionStr=actionString;
  var _overlay = document.getElementById('id_enemy_overlay');
  displayEnemyEffect("👋", 2.1);
  animateUIElement(emojiWrapperUIElement, "emoji-purr", "0.56");
  _overlay.addEventListener('animationend', function _petGrabDone(e) {
    if (e.target !== e.currentTarget) return;
    _overlay.removeEventListener('animationend', _petGrabDone);
    showCompanionNameDialog('pet', getRandomPetName(), function(chosenName) {
      petName[_emoji] = chosenName;
      displayPlayerEffect(_emoji);
      playerPartyString += _emoji;
      var gainedXP=playerGainXP(1.5,0,"");
      playerKarma++;
      var joinMsg="<b>"+chosenName+"</b> joined the party!";
      playerChangeStats(0, _atk, 0, _lck, 0, _mgk, 0, joinMsg, true, true, _actionStr);
      AchievementManager.check('get_pet');
      if (_emoji=="🦜") AchievementManager.check('pet_parrot');
      if (countEmoji(playerPartyString) >= 3) AchievementManager.check('full_party');
      // Guarantee a safe breather after taming. Taming drains stamina and the
      // generator can otherwise drop a hard enemy next while the player is tired,
      // and a tamed pet leaves no restable corpse the way a knockout does.
      var _breatherRow = getRandomEncounter(["Prop"], [], "", ["-1"]);
      if (_breatherRow && !String(_breatherRow[3]).includes("type:Error")) pushEncounter(_breatherRow, 1);
    });
  });
}

function enemyKnockedOut(){
  var gainedXP=parseInt(playerGainXP(1.25,0,""));
  var knockoutString="💤 Harmlessly knocked them out "
  if ((enemyAtk+enemyAtkBonus)<=0) knockoutString="💤 Carefully put them to sleep "
  logAction(enemyEmoji + "&nbsp;▸&nbsp;" + knockoutString + decorateStatusText("","+"+gainedXP+" XP",colorGold));
  playerKarma++;
  AchievementManager.check('knockout');
  if (enemyBossType.includes('Boss')) pushBossLoot();

  var _wasFishing=isFishing;
  isFishing=false;
  displayEnemyEffect("💤");

  if (_wasFishing) {
    animateFlipNextEncounter();
  } else {
    animateFlipToCorpse("neutralized");
  }
}

function animateFlipToCorpse(state) {
  var animationHandler = function(e){
    if (e.target !== cardUIElement) return; // ignore bubbled animationend from child elements
    if (e.animationName !== 'flipOutY') return; // ignore other animations completing on the card
    transitionToCorpse(state);
    registerClickListeners();
    cardUIElement.removeEventListener("animationend", animationHandler);
  }
  cardUIElement.removeEventListener("animationend", animationHandler);
  animateUIElement(areaUIElement,"animate__flipOutX","1.2");
  animateUIElement(cardUIElement,"animate__flipOutY","1.2");
  removeClickListeners();
  cardUIElement.addEventListener('animationend', animationHandler);
}

function transitionToCorpse(state) {
  var baseName  = (corpseSnapshot) ? corpseSnapshot.name  : enemyName;
  var baseEmoji = (corpseSnapshot) ? corpseSnapshot.emoji : enemyEmoji;

  corpseSnapshot = null;
  if (state === "neutralized") {
    corpseSnapshot = {
      name: enemyName, emoji: enemyEmoji, type: enemyType,
      hp: enemyHp, atk: enemyAtk, sta: enemySta,
      lck: enemyLck, int: enemyInt, mgk: enemyMgk, def: enemyDef,
      desc: enemyDesc, msg: enemyMsg
    };
  }

  corpseState = state;
  corpseHasLoot = false;
  corpseLoot = null;

  if (enemyBossType.includes('Boss') && !areaName.includes("Shrouded")) {
    if (_isRival) {
      logAction("💔 ▸ "+baseEmoji+"<text style=color:"+colorRed+";>"+" Invader defeated: <b>"+baseName+"</b></text>");
      curtainFadeInAndOut("<p style=\"color:"+colorRed+";letter-spacing: 1.8px;-webkit-text-stroke: 6.5px black;paint-order: stroke fill;font-size:36px;line-height:20px;\">Invader defeated!</p><p style=\"font-size:20px;\""+decorateStatusText("",baseEmoji+emptySpace+"<b>"+baseName+"</b>"+emptySpace+emptySpace,colorWhite),4);
    } else {
      logAction("👑 ▸ "+baseEmoji+"<text style=color:"+colorGold+";>"+" Boss defeated: <b>"+baseName+"</b></text>");
      curtainFadeInAndOut("<p style=\"color:"+colorGold+";letter-spacing: 1.8px;-webkit-text-stroke: 6.5px black;paint-order: stroke fill;font-size:52px;line-height:20px;\">Boss defeated!</p><p style=\"font-size:20px;\""+decorateStatusText("",baseEmoji+emptySpace+"<b>"+baseName+"</b>"+emptySpace+emptySpace,colorWhite),4);
    }
  }

  enemyEmoji = baseEmoji;
  enemyName  = baseName + (state === "killed" ? " (Dead)" : " (Asleep)");
  stopEnemyEmojiPulse();
  setPersistentEnemyEffect(state === "killed" ? "☠️" : "💤", state !== "killed");
  //enemyType  = "Prop";

  //enemyAtk=0; enemyAtkBonus=0;
  //enemySta=0; enemyStaLost=0;
  //enemyDef=0;
  //totalBonus=0; totalMalus=0;
  enemyMgk=0; enemyMgkLost=0;
  enemyStaLost=enemySta;
  
  var _lootType = null;
  if (!enemyBossType.includes('Boss') && areaName !== "Depths of Slumber") {
    if (procAbilityChance("", GAME_CONFIG.killItemDropChance+luckSpawnBonus())) {
      _lootType = ["Item"];
    } else if (procAbilityChance("", GAME_CONFIG.killConsumableDropChance+luckSpawnBonus())) {
      _lootType = ["Consumable"];
    }
    if (_lootType) {
      var _loot = getWeightedEncounter(_lootType, [], "", ["Lover's Memento","Lost Possession"]);
      if (_loot) { corpseHasLoot=true; corpseLoot=_loot; logAction(enemyEmoji+' ▸ 👀 <span style="color:#F7D147;">'+getLootDropLog()+'</span>'); }
    }
  }

  if (state === "killed") {
    enemyDesc = corpseHasLoot ? "There's something among the bones.<br>" : "Nothing but quiet remains.<br>";
  } else {
    enemyDesc = corpseHasLoot ? "There's something underneath them.<br>" : "Lies on the ground, breathing faintly.<br>";
  }
  enemyMsg = "";

  animateUIElement(cardUIElement,"animate__fadeIn","1.2");
  redraw();
}

function restoreCorpseAfterLevelUp() {
  var s = levelUpSavedCorpse;
  levelUpSavedCorpse = null;
  corpseState = s.corpseState; corpseSnapshot = s.corpseSnapshot;
  corpseHasLoot = s.corpseHasLoot; corpseLoot = s.corpseLoot;
  enemyEmoji = s.enemyEmoji; enemyName = s.enemyName; enemyBossType = s.enemyBossType;
  enemyHp = s.enemyHp; enemyHpLost = s.enemyHpLost;
  enemyAtk = s.enemyAtk; enemyAtkBonus = s.enemyAtkBonus;
  enemySta = s.enemySta; enemyStaLost = s.enemyStaLost;
  enemyLck = s.enemyLck; enemyInt = s.enemyInt; enemyIntBonus = s.enemyIntBonus;
  enemyMgk = s.enemyMgk; enemyMgkLost = s.enemyMgkLost; enemyDef = s.enemyDef;
  enemyDesc = s.enemyDesc; enemyMsg = s.enemyMsg;
  totalBonus = s.totalBonus; totalMalus = s.totalMalus;
  playerRested = s.playerRested;
}

function wakeUpEnemy(msg) {
  logAction(corpseSnapshot.emoji + " ▸ 💢 " + (msg || getEnemyWakeLog()));

  enemyEmoji = corpseSnapshot.emoji;
  enemyName  = corpseSnapshot.name;
  enemyType  = corpseSnapshot.type;
  enemyAtk   = corpseSnapshot.atk;
  enemySta   = corpseSnapshot.sta;
  enemyLck   = corpseSnapshot.lck;
  enemyInt   = corpseSnapshot.int;
  enemyMgk   = corpseSnapshot.mgk;
  enemyDef   = corpseSnapshot.def;
  enemyDesc  = corpseSnapshot.desc;
  enemyMsg   = corpseSnapshot.msg;
  enemyStaLost=0;
  enemyMgkLost=0;
  enemyAtkBonus=0;

  var ea=[enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef].map(Number);
  totalBonus=ea.filter(function(x){return x>0}).reduce(function(s,a){return s+a},0);
  totalMalus=ea.filter(function(x){return x<0}).reduce(function(s,a){return s+a},0);

  corpseState="";
  corpseSnapshot=null;
  corpseHasLoot=false;
  corpseLoot=null;

  clearPersistentEnemyEffect();
  animateUIElement(emojiWrapperUIElement,"animate__bounce","0.8");
  redraw();
  startEnemyEmojiPulse();
}

function enemyDisengage(crit){
  var _xpMsg = crit ? "Convinced them to stand down" : "Convinced them to disengage";
  var _gainedXP = playerGainXP(crit ? 2 : 1.5, 0, _xpMsg);
  if (crit) logAction(enemyEmoji+" ▸ 💬 <text style=color:"+colorYellow+";>Played them to back down</text>");
  playerKarma+=1;
  if (enemyBossType.includes('Boss') && !_isRival) {
    pushBossLoot();
    if (!areaName.includes("Shrouded")) {
      logAction("👑 ▸ "+enemyEmoji+"<text style=color:"+colorGold+";> Boss convinced to leave: <b>"+enemyName+"</b></text>");
      curtainFadeInAndOut("<p style=\"color:"+colorGold+";letter-spacing: 1.8px;-webkit-text-stroke: 6.5px black;paint-order: stroke fill;font-size:52px;line-height:20px;\">Boss defeated!</p><p style=\"font-size:20px;\">"+enemyEmoji+"&nbsp;&nbsp;<b>"+enemyName+"</b>&nbsp;&nbsp;</p>",4);
    }
  }

  isFishing=false;
  displayPlayerEffect("💬");
  animateFlipNextEncounter();
}

function enemyGrabbedIntoLoot(msg="Grabbed it into your bag -1 🟢", msgColor="#FFF"){
  playerGainXP(1.25,0,msg,msgColor);
  playerLootString+=enemyEmoji;
  //No karma change

  isFishing=false;
  displayEnemyEffect("👋");
  nextEncounter();
}

function enemyKicked(crit){
  logPlayerAction(actionString, crit ? "Knocked them on the ground! +2 🟢" : "Kicked them afar regaining +2 🟢");
  displayEnemyCannotEffect();
  displayEnemyEffect("🦶");
  playerGetStamina(2,true);
  if (!crit) enemyRest(1);
  if (enemyAtk==0 && enemyAtkBonus<1) {
    enemyAtkBonus++
    logAction(enemyEmoji+" "+arrowSymbol+" 💢 They got enraged gaining +1 ⚔️");
  }
}

function enemyTurnAggressive(message="That has made them really upset!"){
  enemyType="Standard";
  enemyDesc="It wanted to be friends, not enemies.<br>But you asked me to..."
  enemyHp=2+playerLevel;
  enemyAtk=Math.floor(1+playerLevel/2);
  enemySta=Math.floor(2+playerLevel/2);
  enemyMsg="Got killed by a friend."
  playerKarma--;
  logPlayerAction(actionString,message);
  return true;
}

function enemyDodged(message="Missed, they evaded your grasp."){
  displayPlayerCannotEffect();
  displayEnemyEffect("🌀");
  enemyAttackOrRest(message,true); //FML
}

function enemyCastIfMgk(hit=true,customHitMessage=""){
  switch (enemyType){
    case "Trap": //Rest to full if out of combat + mana
    case "Trap-Attack":
    case "Trap-Roll":
    case "Trap-Big":
    case "Trap-Obstacle":
    case "Item":
    case "Consumable":
    case "Altar":
    case "Curse":
    case "Fishing":
      return false;
      break;
  }

  if (parseInt(enemyMgk)>parseInt(enemyMgkLost)) {
    var damageAndCost=1;
    if (parseInt(enemyMgk)>(parseInt(enemyMgkLost)+1)) damageAndCost=2;

    enemyMgkLost+=damageAndCost;
    displayEnemyCannotEffect(); //Actually can, but this is just for effect

    if (procAbilityChance("💠",50)){
      logAction("🪄 ▸ <b>💠 Reflect Magic</b> resisted their spell.");
      displayPlayerEffect("💠");
      return false;
    }

    if (hit && (customHitMessage=="")) {
      logAction(enemyEmoji+" ▸ 🪄 Got hit by the enemy spell -"+damageAndCost+" 💔");
    } else if (hit) {
      logPlayerAction(actionString,customHitMessage+" -"+damageAndCost+" 💔");
    }

    if (hit) playerHit(damageAndCost,true,true);

    return true;
  }
}

function enemyAttackOrRest(message="",isGrab=false,skipToxin=false){
  var damageReceived=enemyAtk+enemyAtkBonus;
  var staminaChangeMsg;

  if ((enemySta>enemyStaLost)&&(enemyHp>enemyHpLost)) {
    if (playerLootString.includes("🖤") || playerLootString.includes("🪣") ) {
      displayPlayerEffect("🔰");
      if ((enemyAtk+enemyAtkBonus)>0) playerHp++
    }

    if (enemyType!="Demon"){
      staminaChangeMsg = "They attacked you dealing -"+(enemyAtk+enemyAtkBonus)+" 💔"
    } else {
        staminaChangeMsg = "They syphoned your health -"+(enemyAtk+enemyAtkBonus)+" 💔";
        if ((enemyHpLost > 0) && (!areaName.includes("Depths of Slumber"))) {enemyHpLost-=1;}
    }

    if ((damageReceived<=0)){
      staminaChangeMsg=chooseFrom(["They just hang around.","They do not seem to care.","They just wait around.","They seem to be very chill."])
      if (enemyCursed && (enemyAtk+enemyAtkBonus)<=0) staminaChangeMsg="They are too weak to do any harm."
      animateUIElement(emojiWrapperUIElement,"animate__headShake","0.8"); //Play chill animation
      if (enemyType=="Pet"){ //Harder to befriend
        enemyIntBonus++;
        if ((enemyInt+enemyIntBonus)<=playerInt){
          logAction(enemyEmoji+" ▸ ⁉️ They now seem more concerned.");
          displayEnemyEffect("⁉️")
          enemyRest(1);
        } else {
          logAction(enemyEmoji+" ▸ ‼️ They got bored and left.");
          nextEncounter();
          return;
        }
      }
      if (message!="") staminaChangeMsg=message;
      if (!isGrab) {
        logAction(enemyEmoji+" "+arrowSymbol+" 💤 "+staminaChangeMsg);
        enemyRest(1);
        sufferToxin();
        return; //They don't waste stamina unless necessary
      }
    } else {
      if (message!="") staminaChangeMsg=message;
      enemyStaminaChangeMessage(-1,staminaChangeMsg,"n/a");
      if (isGrab){return;}
      playerHit(damageReceived,true,false);

      if (playerLootString.includes("🥀") && (enemyHp>enemyHpLost) && (enemyAtk+enemyAtkBonus)>0 && !isGrab) {
        logAction("⚔️ ▸ 🥀 Dealt -1 💔 by <b>🥀 Thorns Payback</b>.");
        enemyHit(1,false,false,true);
        displayEnemyEffect("🥀");
      }

      if (playerLootString.includes("🖤") || playerLootString.includes("🪣") ) logAction("⚔️ ▸ <b>🔰 Unbreakable</b> provided protection +1 🔰");
      return;
    }
    enemyStaminaChangeMessage(-1,staminaChangeMsg,"n/a","Shit happened.");
  } else if (enemyHp > enemyHpLost) {
    if (message=="") {
      staminaChangeMsg="They recovered some energy.";
    } else {
      staminaChangeMsg=message;
    }
    if (enemyType=="Spirit") staminaChangeMsg = "Impossible to hit, they recovered energy."
    if (enemyType=="Spirit" && (enemySta+enemyStaLost==0)) staminaChangeMsg = "Seems to be impossible to hit."
    logPlayerAction(actionString,staminaChangeMsg);
    enemyRest(1);
    sufferToxin();
  }
}
