function playerHas(emoji) {
  return playerLootString.includes(emoji) || playerEmoji === emoji;
}

function renewPlayer(){ //Default values
  playerName = getFirstName();
  playerHpMax=3;
  playerHp = playerHpMax;
  playerStaMax = 3;
  playerSta = playerStaMax;
  playerMgkMax = 0;
  playerAtk = 1;
  playerAtkBonus = 0;
  playerDef = 0;
  playerLck = 0;
  playerInt = 1;
  playerXP=0;
  playerLevel=1;
  playerXPThreshold=300;
  playerMgk = playerMgkMax;
  playerRested = false;
  fishingRested = false;
  playerCooked = false;
  playerShopped = false;
  playerDestined = false;
  playerEmoji = '👤';
  playerLootString = [""];
  playerPartyString = [""];
  petName = {};
  followerName = {};
  playerAttackType = "⚔️";
  playerRollType = "🌀";
  playerBlockType = "🔰";
  playerSleepType = "💤";
  playerSpeakType = "💬";
  playerCastType = "💫";
  playerHealType = "❤️‍🩹";
  playerCurseType = "🪬";

  playerSlotHead    = null;
  playerSlotWeapon  = null;
  playerSlotChest   = null;
  playerSlotLegs    = null;
  playerSlotTrinket = null;
  playerInventory   = [];

  playerKills = 0;
  playerKarma=1;
  playerLove=0;
  isEndingState = false;
  gatewayPassed = false;
  removeGatewayEffects();
  isKillEnding = false;
  playerWonThisRun = false;
  seenLoot = [];
  adventureLog = actionLog;
  spentCoins=0;
  availableCoins=savedCoins;
  encounterCount = 0;
  runStartTimestamp = Date.now();
  playtimeBankedMs     = 0;
  playtimeSegmentStart = Date.now();
  playerRevivesThisRun = 0;
  playerOriginName = '';
  cheatedThisRun = false;
  playerCritSuccesses     = 0;
  playerCritFails         = 0;
  playerFishCatches       = 0;
  playerFishSkillBonus    = 0;
  playerAreaSleepCount    = 0;
  playerTotalSleepPenalty = 0;
  scoreBaselineStats = playerHpMax + playerAtk + playerStaMax + playerLck + playerInt + playerMgkMax + playerDef;

  reincarnateEnemyHpLost = reincarnateEnemyStaLost = reincarnateEnemyMgkLost = reincarnateEnemyAtkBonus = 0;
  if (typeof RivalManager !== 'undefined') RivalManager.resetRun();
  initRunLog();
}

renewPlayer();

// ── Slot/inventory helpers ────────────────────────────────────────────────────

function getPlayerSlot(slot) {
  if (slot === 'head')    return playerSlotHead;
  if (slot === 'weapon')  return playerSlotWeapon;
  if (slot === 'chest')   return playerSlotChest;
  if (slot === 'legs')    return playerSlotLegs;
  if (slot === 'trinket') return playerSlotTrinket;
  return null;
}

function setPlayerSlot(slot, data) {
  if (slot === 'head')    playerSlotHead    = data;
  if (slot === 'weapon')  playerSlotWeapon  = data;
  if (slot === 'chest')   playerSlotChest   = data;
  if (slot === 'legs')    playerSlotLegs    = data;
  if (slot === 'trinket') playerSlotTrinket = data;
}

function buildItemSnapshot() {
  return {
    emoji: enemyEmoji, name: enemyName,
    hp:  parseInt(enemyHp)  || 0,
    atk: parseInt(enemyAtk) || 0,
    sta: parseInt(enemySta) || 0,
    lck: parseInt(enemyLck) || 0,
    int: parseInt(enemyInt) || 0,
    mgk: parseInt(enemyMgk) || 0,
    def: parseInt(enemyDef) || 0,
    slot: enemyItemSlot,
    note: String(enemyTeam || ''),
    desc: String(enemyDesc || '')
  };
}

function formatSlotDiff(oldData) {
  var newHp  = parseInt(enemyHp)  || 0;
  var newAtk = parseInt(enemyAtk) || 0;
  var newSta = parseInt(enemySta) || 0;
  var newLck = parseInt(enemyLck) || 0;
  var newInt = parseInt(enemyInt) || 0;
  var newMgk = parseInt(enemyMgk) || 0;
  var newDef = parseInt(enemyDef) || 0;
  var pairs = [
    [newAtk - oldData.atk, '⚔️'],
    [newMgk - oldData.mgk, '🔵'],
    [newHp  - oldData.hp,  '❤️'],
    [newSta - oldData.sta, '🟢'],
    [newLck - oldData.lck, '🍀'],
    [newInt - oldData.int, '🧠'],
    [newDef - oldData.def, '🔰']
  ];
  var parts = [];
  pairs.forEach(function(p) {
    if (p[0] !== 0) parts.push((p[0] > 0 ? '+' : '') + p[0] + ' ' + p[1]);
  });
  return parts.length ? parts.join(', ') : 'no stat change';
}

// ─────────────────────────────────────────────────────────────────────────────

function playerGainXP(multiplier=1,gainedXP=0, message="Improved your insight ", msgColor="#FFF"){
  var intBonus=1+playerInt/20;
  var statSum=0;
  var typeMultiplier=1;

  //Per type XP multipliers
  if (enemyType=="Hot"||enemyType=="Stingy"||enemyType=="Toxic"||enemyType=="Tough") typeMultiplier=1.1;
  if (enemyType=="Swift"||enemyType=="Heavy") typeMultiplier=1.2;
  if (enemyType=="Demon"||enemyType=="Spirit"||enemyType=="Undead") typeMultiplier=1.4;
  if (enemyBossType.includes("Boss")) typeMultiplier=1.6;

  statSum+=parseInt(enemyHp);
  statSum+=parseInt(enemySta);
  statSum+=parseInt(enemyAtk);
  //statSum+=enemyLck; - Does not make diff now.
  //statSum+=enemyInt; - This might be OP
  statSum+=parseInt(enemyMgk);

  if (gainedXP==0) {
    gainedXP=parseInt((((parseInt(statSum)*10)/2)*multiplier)*typeMultiplier*intBonus);
  } else {
    gainedXP=parseInt(gainedXP*multiplier*intBonus);
  }

  playerXP+=gainedXP;
  if (message!="") logPlayerAction(actionString,message + decorateStatusText(""," +"+gainedXP+" XP",colorGold), msgColor);
  var XPString = gainedXP + " ("+playerXP+"/"+playerXPThreshold+")"
  dbg("XP +"+XPString+"\naction x"+multiplier+" type x" +typeMultiplier+" int x" +intBonus);

  if (procAbilityChance("🎓",100)) gainedXP=parseInt(gainedXP*1.25);

  if (playerXP>=playerXPThreshold) logAction(enemyEmoji+" ▸ 🎉 "+"<text style=color:"+colorGold+";>"+"You are ready to <b>level up!</b></text>")

  return parseInt(gainedXP);
}

//Player
function playerCheckLevelUp(){
  var levelUp = ["area:"+areaName,"emoji:🎉","name:Level Up!","type:Upgrade","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Character Upgrade","desc:<b>Choose a perk</b> to shape your character.<br>","message:","achiev:none"]

  if (playerXP>=playerXPThreshold){
    playerXP=playerXP-playerXPThreshold;
    playerXPThreshold=playerLevel*200;
    playerLevel++;

    curtainFadeInAndOut("<p style=\"color:"+colorGold+";letter-spacing: 1.8px;-webkit-text-stroke: 6.5px black;paint-order: stroke fill;font-size:52px;line-height:20px;font-weight:600;\">Level Up!</p><p style=\"font-size:20px;\""+decorateStatusText("","New perk available.",colorWhite));
    if (playerHp<playerHpMax) playerHp=playerHpMax;
    playerRest(true);
    AchievementManager.check('level_up', playerLevel);
    updateXPProgress();
    // When fishing, encounterIndex has been reset to lastEncounterIndex (one before the fishing
    // spot). Restore it so the level-up inserts at the right queue position and the fishing
    // spot resumes correctly after the perk is chosen.
    if (isFishing) { isFishing = false; encounterIndex = lastEncounterIndex + 1; }
    if (corpseState !== "") {
      levelUpSavedCorpse = {
        corpseState: corpseState, corpseSnapshot: corpseSnapshot,
        corpseHasLoot: corpseHasLoot, corpseLoot: corpseLoot,
        enemyEmoji: enemyEmoji, enemyName: enemyName, enemyType: enemyType, enemyBossType: enemyBossType,
        enemyHp: enemyHp, enemyHpLost: enemyHpLost,
        enemyAtk: enemyAtk, enemyAtkBonus: enemyAtkBonus,
        enemySta: enemySta, enemyStaLost: enemyStaLost,
        enemyLck: enemyLck, enemyInt: enemyInt, enemyIntBonus: enemyIntBonus,
        enemyMgk: enemyMgk, enemyMgkLost: enemyMgkLost, enemyDef: enemyDef,
        enemyDesc: enemyDesc, enemyMsg: enemyMsg,
        totalBonus: totalBonus, totalMalus: totalMalus,
        playerRested: playerRested
      };
    }
    pushEncounter(levelUp,0);
    encounterIndex=encounterIndex-1;
    nextEncounter();
    logAction("✨ ▸ <text style=color:"+colorGold+";>"+ "<b>🎉 Level Up!</b> Select a character perk.</text>")
  }
}

function playerRest(silent=false, countThreshold=false){
  if (!playerRested || (enemyType.includes("Trap"))){
    if (((playerStaMax-playerSta)>0) || ((playerMgkMax-playerMgk)>0)){
      playerGetStamina(playerStaMax-playerSta,true);
      if (playerMgk<playerMgkMax) playerMgk=playerMgkMax;
      playerRested=true;

      if (!silent) {
        logPlayerAction(actionString, getSleepFullLog());
        displayPlayerEffect("💤");
        displayPlayerRestedEffect();
      }
    } else {
      playerRested=true;

      if (!silent) {
        logPlayerAction(actionString, getSleepWastedLog());
        displayPlayerEffect("💤");
      }
    }

    if (!silent && procAbilityChance("⛺️",50)){
      logAction("💤 ▸ <b>⛺️️ Camping Tent</b> provided bonus +1 🟢")
      playerSta++;
      displayPlayerRestedEffect();
    }

    if (!silent && procAbilityChance("🔮",50)){
      logAction("🔮 ▸ <b>👁️ Vivid Dream</b> provided bonus +1 🔵")
      playerMgk++;
      displayPlayerRestedEffect();
    }

if (playerCheckLevelUp()){
  return true;
}

  } else {
    if (!silent) logPlayerAction(actionString,"Not feeling sleepy anymore.");
    displayPlayerCannotEffect();
  }
  if (countThreshold && areaName !== "Depths of Slumber" && areaName !== "Shrouded Necropolis") {
    playerAreaSleepCount++;
    var _thr = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.sleepAreaThreshold != null)
      ? GAME_CONFIG.sleepAreaThreshold : 5;
    if (playerAreaSleepCount === _thr - 1) {
      logAction('💤 ▸ 🍂 <i style="color:orange;">' + getSleepNearLimitLog() + '</i>');
    } else if (playerAreaSleepCount > _thr) {
      playerTotalSleepPenalty++;
      playerLove--;
      logAction('💤 ▸ 💔 <i style="color:#FF0000;">' + getSleepOverLimitLog() + '</i>');
    }
  }
}

function playerHeal(critBonus){
  var missingHp=playerHpMax-playerHp;
  if (missingHp<0) missingHp=0;

  if (missingHp>0) {
    var healAmount=missingHp;
    if (healAmount>(playerMgk)) healAmount=(playerMgk);
    var bonusHeal = (critBonus && (playerHp+healAmount) < playerHpMax) ? 1 : 0;
    playerHp+=healAmount+bonusHeal;
    playerMgk-=healAmount;

    if (bonusHeal) {
      logPlayerAction(actionString,"Felt a divine overflow. +"+(healAmount+bonusHeal)+" ❤️‍🩹 -"+healAmount+" 🔵", colorYellow);
    } else {
      logPlayerAction(actionString,"Cast a +"+healAmount+" ❤️‍🩹 healing spell for -"+healAmount+" 🔵");
    }
    displayPlayerGainedEffect();
  } else {
    logPlayerAction(actionString,"Wasted a healing spell -1 🔵");
    playerMgk-=1;
    displayPlayerCannotEffect();
  }
}

function playerGetStamina(stamina,silent = false){
  if (playerSta >= playerStaMax) { //Cannot get more
    if (!silent){
      logPlayerAction(actionString, getStaminaWastedLog());
    }
    return false;
  } else {
    if (!silent){
      logPlayerAction(actionString,"Rested and regained +" + stamina + " 🟢");
    }
    playerSta += stamina;
    if (playerSta > playerStaMax){
      playerSta = playerStaMax;
    }
    animateUIElement(playerInfoUIElement,"animate__pulse","0.4"); //Animate player rest
    return true;
  }
}

function playerUseStamina(stamina, message = ""){
  if (playerSta <= 0) { //Cannot lose more
    if (message != ""){ //Display specific "too tired message"
      logPlayerAction(actionString,message);
    }
    displayPlayerCannotEffect();
    return false;
  } else {
    playerSta -= stamina;
    if (procAbilityChance("🪶",50)){
      logAction("🪶  ▸ <b>♻️ Quick Reflexes</b> kicked in +"+stamina+" 🟢");
      playerSta+=stamina;
    }
    return true;
  }
}

function playerRestBadly(countThreshold=false) {
  playerSta = Math.max(1, playerStaMax - 1);
  playerMgk = Math.max(1, playerMgkMax - 1);
  playerRested = true;
  logPlayerAction(actionString, getRestBadlyText());
  displayPlayerEffect("💤");
  if (countThreshold && areaName !== "Depths of Slumber" && areaName !== "Shrouded Necropolis") {
    playerAreaSleepCount++;
    var _thr = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.sleepAreaThreshold != null)
      ? GAME_CONFIG.sleepAreaThreshold : 5;
    if (playerAreaSleepCount === _thr - 1) {
      logAction('💤 ▸ 🍂 <i style="color:orange;">' + getSleepNearLimitLog() + '</i>');
    } else if (playerAreaSleepCount > _thr) {
      playerTotalSleepPenalty++;
      playerLove--;
      logAction('💤 ▸ 💔 <i style="color:#FF0000;">' + getSleepOverLimitLog() + '</i>');
    }
  }
}

function playerUseMagic(magic, message = ""){
  if (playerMgk < magic) { //Not enough mana for this cost
    if (message != ""){ //Display specific "too tired message"
      logPlayerAction(actionString,message);
    }
    displayPlayerCannotEffect();
    return false;
  } else {
    playerMgk -= magic;
    return true;
  }
}

function playerChangeStats(bonusHp=enemyHp,bonusAtk=enemyAtk,bonusSta=enemySta,bonusLck=enemyLck,bonusInt=enemyInt,bonusMgk=enemyMgk,bonusDef=enemyDef,gainedString = "Might come in handy later.",logMessage=true,moveForward=true,actionIcon=actionString){
  var totalBonus=bonusHp+bonusAtk+bonusSta+bonusLck+bonusInt+bonusMgk+bonusDef;
  var changeSign=" +";
  if (gainedString=="") gainedString="Might come in handy later."

  if ((totalBonus >= 0) && (gainedString=="Might come in handy later.")) {
    if (totalBonus !=0){
      gainedString="Felt becoming stronger";
    }
  } else if (gainedString=="Might come in handy later.") {
    gainedString="Got cursed by it";
    if (enemyType.includes("Trap")) gainedString=enemyMsg
    if (gainedString=="") gainedString="Seems like it was a mistake."
  }

  if (enemyMsg != "" && gainedString == "") {
    gainedString = enemyMsg;
  }

  if (totalBonus!=0){
    gainedString = gainedString.replace("."," ");
  }

  if (bonusLck != 0){
    if (bonusLck<0) {
      changeSign=" "
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerGainedEffect();
    }
    playerLck += +bonusLck;
    gainedString += Math.abs(bonusLck)<1 ? (bonusLck>0?"Minor +":"Minor -")+"🍀" : changeSign+bonusLck + " 🍀";
    displayPlayerEffect("🍀");
    displayPlayerGainedEffect();
  }

  if (bonusInt != 0){
    if (bonusInt<0) {
      changeSign=" "
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerGainedEffect();
    }
    playerInt += +bonusInt;
    gainedString += Math.abs(bonusInt)<1 ? (bonusInt>0?"Minor +":"Minor -")+"🧠" : changeSign+bonusInt + " 🧠";
    displayPlayerEffect("🧠");
    displayPlayerGainedEffect();
  }

  if (bonusMgk != 0){
    if (bonusMgk<0) {
      changeSign=" "
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerGainedEffect();
    }
    playerMgkMax += parseInt(bonusMgk);
    playerMgk += parseInt(bonusMgk);
    if (playerMgk<0) playerMgk=0;
    if (parseInt(bonusMgk) > 0) AchievementManager.check('mana_first');
    gainedString += changeSign+bonusMgk + " 🔵";
    displayPlayerEffect("🪬");
    displayPlayerGainedEffect();
  }

  if (bonusSta != 0){
    if (bonusSta<0) {
      changeSign=" "
      displayPlayerEffect(enemyEmoji);
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerEffect("💨");
      displayPlayerGainedEffect();
    }
    playerStaMax += parseInt(bonusSta);
    playerSta += parseInt(bonusSta);
    if (playerSta<0) playerSta=0;
    gainedString += changeSign+bonusSta + " 🟢";
  }

  if (bonusAtk != 0){
    if (bonusAtk<0) {
      changeSign=" ";
      displayPlayerEffect("🪬");
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerEffect("⚔️");
      displayPlayerGainedEffect();
    }
    playerAtk += parseInt(bonusAtk);
    gainedString += changeSign+bonusAtk + " ⚔️";
  }

  if (bonusDef != 0){
    if (bonusDef<0) {
      changeSign=" ";
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerGainedEffect();
    }
    playerDef += parseInt(bonusDef);
    if (bonusDef<0) playerDef=0;
    gainedString += changeSign+bonusDef + " 🔰";
    displayPlayerEffect("🔰");
    displayPlayerGainedEffect();
  }

  if (bonusHp != 0) {
    var hpEmoji = "❤️"

    if (bonusHp<0) {
      changeSign=" ";
      displayPlayerEffect("💢");
      hpEmoji = "💔"
      displayPlayerCannotEffect();
    } else {
      changeSign=" +";
      displayPlayerEffect("❤️");
      displayPlayerGainedEffect();
    }
    playerHp+=parseInt(bonusHp);
    playerHpMax += parseInt(bonusHp);
    if (playerHp>playerHpMax) playerHp = playerHpMax
    gainedString += changeSign+bonusHp + " "+hpEmoji;
    if (playerHp<=0) {
      enemyMsg=gainedString;
      playerHit(0,false,true);
      return;
    }
    if (enemyType=="Item") displayPlayerEffect(enemyEmoji);
  }

  if (hasAnyOf(attackTypes,enemyEmoji)&&enemyType=="Item") playerAttackType=enemyEmoji;

  if (castTypes.includes(enemyEmoji)&&enemyType=="Item"&&enemyMgk>0) playerCastType=enemyEmoji;

  if (enemyEmoji=="⛺️") playerSleepType=enemyEmoji;

  if (enemyEmoji=="📣") playerSpeakType=enemyEmoji;

  if (logMessage) {
    logPlayerAction(actionIcon,gainedString);
  }
  if (moveForward) nextEncounter();
  return gainedString;
}

function playerConsumed(silent=false){ //TODO this seems to not handle enemyDef at various places (not needed at the moment, but might be in future)
  //Works for both morph and mask, logs manipulated further down
  if (playerLootString.includes("🐷")) {
    if (enemyHp < 0) enemyHp = 0; if (enemyAtk < 0) enemyAtk = 0; if (enemySta < 0) enemySta = 0;
    if (enemyLck < 0) enemyLck = 0; if (enemyInt < 0) enemyInt = 0; if (enemyMgk < 0) enemyMgk = 0;
    if (enemyDef < 0) enemyDef = 0;
  }

  var consumedString="Replenished resources"
  var sign = "";
  if (enemyType=="Consumable") var eatEmoji= "🍴"

  var missingHp=0;
  if (playerHp<playerHpMax && enemyType=="Consumable") missingHp=parseInt(playerHpMax)-parseInt(playerHp);
  var missingSta=parseInt(playerStaMax)-parseInt(playerSta);
  var gainStamina=0;

  if (enemyMsg!="") consumedString=enemyMsg;

  if (enemyHp>0 || enemySta>0 || enemyAtk>0  || enemyLck>0  || enemyInt>0  || enemyMgk>0) {
    if (enemyMsg=="") consumedString="That was actually tasty";
  }

  //Recover stamina if not bad food
  if (enemyHp>=0 && enemySta>=0 && enemyAtk>=0  && enemyLck>=0  && enemyInt>=0  && enemyMgk>=0 && !enemyType.includes("Container")){
    if ((parseInt(missingSta)<=0 && enemySta==0 && enemyType=="Consumable") && playerHp>=playerHpMax) {
      gainStamina+=1;
      if (enemyMsg=="") consumedString="Got an energy bonus";
    } else {
      if (missingSta>0) gainStamina+=parseInt(missingSta)+parseInt(enemySta);
    }
    animateUIElement(playerInfoUIElement,"animate__pulse","0.4"); //Animate player rest
  }

  if (enemyHp<0 || enemySta<0 || enemyAtk<0  || enemyLck<0  || enemyInt<0  || enemyMgk<0) {
    if (enemyMsg=="") consumedString="That did not taste good";
    if (enemyType=="Consumable") eatEmoji="🤮";
    animateUIElement(playerInfoUIElement,"animate__shakeX","0.5"); //Animate hitreact
  }

  //Pig morph and mask log tweak
  if (playerLootString.includes("🐷")) consumedString="<b>Devoured</b> by <b>🐷 Pig Digestion</b>";

  gainStamina+=parseInt(enemySta);
  if (gainStamina<0) sign=""
  if (gainStamina>=0) sign="+"
  if (gainStamina!=0) consumedString +=" "+sign+(parseInt(gainStamina)) + " 🟢";
  playerSta+=parseInt(gainStamina);
  if (playerSta<0) playerSta=0;

  if (missingHp > 0 || parseInt(enemyHp)!=0){
    var heart = "❤️"
    var hpChange=parseInt(enemyHp);
    if (enemyHp>=0) {
      hpChange+=parseInt(missingHp); //Another nasty hack, why is this so spaghetti
      sign=" +"
    }
    if (hpChange<0) {
      sign="";
      heart="💔";
    }
    if (hpChange>0) playerHp += hpChange;
    consumedString += " "+sign+parseInt(hpChange) + " "+heart+" ";
    animateUIElement(playerInfoUIElement,"animate__pulse","0.4"); //Animate player rest
  }

  //Apply stat changes (except hp & sta)
  playerChangeStats(0,enemyAtk,0,enemyLck,enemyInt,enemyMgk,enemyDef,consumedString,!silent,false,eatEmoji);

  //Actually damages here, to log potential lucky dmg avoidance at the right time
  if (enemyHp<0) playerHit(-1*enemyHp,true,true);

  return consumedString;
}

function playerHit(incomingDamage,applyLuck=true,typeMagic=false) {
  var hitChance = Math.floor(Math.random() * luckInterval);

  if (applyLuck && ( hitChance <= playerLck )){
    logAction("🍀 ▸ 💢 <b>Luckily</b> avoided receiving the damage.");
    displayPlayerEffect("🍀");
    return;
  }

  if (procAbilityChance("🧼",100) && bubblesUsed==false && !enemyType.includes("consumable") && !enemyType.includes("trap") && !enemyType.includes("container")) {
    bubblesUsed=true;
    logAction("🫧 ▸ 💢 Damage repelled by <b>🫧 Bubble Shield</b>.");
    displayPlayerCannotEffect();
    displayPlayerEffect("🫧");
    return;
  }

  if (procAbilityChance("🛡️",50) && !typeMagic) {
    logAction("🛡️ ▸ 💢 Attack deflected by <b>🛡 Random Block</b>.");
    displayPlayerCannotEffect();
    displayPlayerEffect("🛡️");
    return;
  }

  var defended = 0;
  if (playerDef > 0 && incomingDamage > 1) {
    defended = Math.min(playerDef, incomingDamage - 1);
    incomingDamage -= defended;
  }

  playerHp = playerHp - incomingDamage;
  animateUIElement(playerInfoUIElement,"animate__shakeX","0.5"); //Animate hitreact
  if (defended > 0) {
    logAction("🔰 ▸ 💢 -" + incomingDamage + " 💔 (" + defended + " 🔰)");
    displayPlayerEffect("🔰");
  }
  if (playerHp <= 0){
    playerHp=0; //Prevent redraw issues post-overkill

    var deathChance = Math.floor(Math.random() * luckInterval * 3); //Small chance to not die
    if (applyLuck && ( deathChance <= playerLck )){
      playerHp+=1;
      logAction("🍀 ▸ 💀 <b>Luckily</b> got a second chance to live.");
      displayPlayerEffect("🍀");
      return;
    }

    var ress="";
    if (!(typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.label === 'Hardcore')) {
      validRess.forEach((item, i) => {
        if (playerLootString.includes(item)) {
          ress=item;
          return true;
        }
      });
    }
    if (ress!="" && playerUseItem(ress,"n/a","n/a",true,true)){
      logAction("💀 ▸ "+ress+" Still alive thanks to <b>💀 Cheat Death</b>.");
      displayPlayerGainedEffect();
      playerHp+=1;
      if (playerSlotTrinket && playerSlotTrinket.emoji === ress) playerSlotTrinket = null;
      return;
    }

    if (procAbilityChance("📦",50)) {
      logAction("📦 ▸ ❤️‍🩹 Turned out <b>📦 <s>Dead or</s> Alive</b>.");
      displayPlayerGainedEffect();
      playerHp+=1;
      return;
    }

    if (playerLootString.includes("📦")) {
      logAction("📦 ▸ 💀 Turned out <b>📦 Dead <s>or Alive</s></b>.");
      displayPlayerCannotEffect();
      displayPlayerEffect("📦");
    }

    isFishing = false;
    gameOver();
    return;
  }
  displayPlayerEffect("💢");
}

function playerUseItem(item,messageSuccess = "Used "+item+" from your inventory.",messageFail = "Requires "+item+" to continue.",effect=true,silent=false,consumeItem=true){
  if (playerLootString.includes(item)){
    if (enemyMsg!="") messageSuccess=enemyMsg;
    if (effect) displayEnemyEffect(item);
    if (consumeItem) playerLootString=playerLootString.replace(item,"");
    if (playerLootString.length==0) playerLootString=[""]
    displayPlayerEffect(item);
    if (!silent) logPlayerAction(actionString,messageSuccess);
    return true;
  } else {
    if (!silent) logPlayerAction(actionString,messageFail);
    displayPlayerCannotEffect();
    return false;
  }
}

function playerWaive(){
  logPlayerAction(actionString,"Waived the <b>🏳️ White Flag</b>! -3 🧠");
  displayPlayerEffect("🏳️");
  playerInt-=3;
  nextEncounter();
  return false;
}

function playerReincarnate(){
  if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.label === 'Hardcore') return;
  SaveManager.removeLastDeathSession(adventureStartTime);
  //SaveManager.clearGameState(); // treat revive as a new run — wipe the death-screen snapshot
  playerNumber++; //Tracks revives of the character
  playerRevivesThisRun++; //Run-scoped copy for telemetry (playerNumber is not reset per run)
  AchievementManager.check('reincarnate');
  displayPlayerEffect("✨");
  
  //encounterIndex=3; //Skip tutorial
  //adventureEncounterCount = -1; //Death + tutorial

  //Ress where died
  encounterIndex=lastEncounterIndex-1;
  
  playerHp=1; //Renew
  playerSta=playerStaMax; //Renew

  logPlayerAction("✨", getReincarnateLog()+"<br>&nbsp;<br>&nbsp;");

  if (playerKarma>0){ //TODO Revise this threshold
    var randomArea=chooseFrom(["Fading Wildlands","Forsaken Village","Twisted Fairyland", "River of Sorrows"]) //Consider any artifact from all areas except endgame
    var giftType = ['Item'];
    var excludes = ["Lover's Memento", "Piece of History", "Lost Possession"];
    var bonusItem = getWeightedEncounter(giftType, ["Artifact"], randomArea, excludes);
    bonusItem[0]="area:"+previousArea;

    var bonusWrapper=["area:"+previousArea,"emoji:🎁","name:Pleasant Surprise","type:Container","hp:0","atk:0","sta:0","lck:0","int:0","mgk:0","def:0","note:Karma Bonus","desc:Received for staying out of trouble!<br>","message:Opened the mysterious gift box.","achiev:none"]

    logAction("💚 ▸ 🎁 Eligible for a good karma bonus!");
    pushEncounter(bonusWrapper,2); //Push after the point of dising
    pushEncounter(bonusItem,3);
  }

  nextEncounter(true, true); // skip area transition — reincarnation owns its own curtain

  enemyHpLost   = reincarnateEnemyHpLost;
  enemyStaLost  = reincarnateEnemyStaLost;
  enemyMgkLost  = reincarnateEnemyMgkLost;
  enemyAtkBonus = reincarnateEnemyAtkBonus;
  reincarnateEnemyHpLost = reincarnateEnemyStaLost = reincarnateEnemyMgkLost = reincarnateEnemyAtkBonus = 0;
  redraw();

  curtainFadeInAndOut("<p style=\"color:"+colorGold+";-webkit-text-stroke: 6.5px black;paint-order: stroke fill;letter-spacing:1.8px;line-height:20px;font-size:52px;\">Reincarnated!</p><p style=\"font-size:20px;\""+decorateStatusText("","Remember what you've learned.",colorWhite),4);

  // Save the fresh run state now that both the encounter and player stats are fully reset.
  // The redraw() inside nextEncounter() above fired before renewPlayer(), so its snapshot
  // had stale death-screen stats — this call captures the correct new-run state.
  SaveManager.saveGameState();
}

function checkPlayerHasItem(itemArray=validBaits){
  var bait="";
  itemArray.forEach((item, i) => {
    if (playerLootString.includes(item)) {
      bait=item;
      return true;
    }
  });
  return bait;
}

function sufferToxin(){
  if (enemyType=="Toxic") {
  var grabDmg=enemyAtk;
  if (grabDmg==0) grabDmg=1;
  var dmgMsg="Oof, that smells just nasty";

  logAction(enemyEmoji+" ▸ 🦠 "+dmgMsg+" -"+grabDmg+" 💔");
  playerHit(grabDmg,true,true);
  displayEnemyEffect("🦠");
  }
}

function procAbilityChance(abilityEmoji="",abilityChance=100) { //Congrats me!!!
  if (!playerLootString.includes(abilityEmoji)){
    return false;
  }

  var randomRoll = (Math.floor(Math.random() * 100))
  var success = (randomRoll<=abilityChance)

  if (abilityEmoji!="") dbg("requires:"+abilityEmoji);
  // console.log("chance:"+abilityChance+"/100");
  // console.log("rolled:"+randomRoll);
  // console.log("success:"+success);
  // console.log("----");

  return success;
}
