//Game logic
function resolveAction(clickedButton){ //Yeah, this is bad, like really bad
  return function(){ //Well, stackoverflow comes to the rescue
    var button = clickedButton;
    // Consume the action-bar skill check result (null = no check, true/false = pass/fail)
    var _skillOK = actionBarSuccess;
    actionBarSuccess = null;
    var _crit = actionBarCrit;
    actionBarCrit = null;

    if (_crit === 'success') {
      var viewport = document.querySelector('.game-viewport');
      if (viewport) animateUIElement(viewport, "animate__shakeX", "0.6");
      playerCritSuccesses++;
    } else if (_crit === 'fail') {
      playerCritFails++;
    }

    if (isEndingState) {
      var _lockMsg = null;
      if (button === 'button_sleep' && playerLove < 1)                       _lockMsg = '💤 ▸ 💔 <i>She is shaking to avoid getting closer.</i>';
      if (button === 'button_grab'  && playerLove < 4)                       _lockMsg = '🫂 ▸ 💔 <i>She struggles to not let you closer.</i>';
      if (button === 'button_speak' && playerLove < 6 )                      _lockMsg = '❤️ ▸ 💔 <i>Her name does not come back to you.</i>';
      if (button === 'button_heal'  && playerMgk < 4)                        _lockMsg = '❤️‍🩹 ▸ 💔 <i>You are too weak to break the spell.</i>';
      if (button === 'button_cast'  && playerLck < 6)                        _lockMsg = '🙏 ▸ 💔 <i>Fate has not blessed this path.</i>';
      if (button === 'button_curse' && playerKarma > -2)                     _lockMsg = '💀 ▸ 💔 <i>You don\'t have the darkness it takes.</i>';
      if (_lockMsg) { logAction(_lockMsg); redraw(); displayPlayerCannotEffect(); return; }
      resolveEnding(button);
      return;
    }

    var buttonUIElement = document.getElementById(button);
    animateUIElement(buttonUIElement,"animate__pulse","0.15");
    actionString = buttonUIElement.innerHTML;
    actionVibrateFeedback(button);
    // Level-up shows Fortune on the cast slot and Fate on the curse slot
    if (enemyType == "Upgrade" && (button === 'button_cast' || button === 'button_curse')) {
      button = (button === 'button_cast') ? 'button_curse' : 'button_cast';
    }
    runLogAdd("action", {
      btn: button,
      player: {hp: playerHp, hpMax: playerHpMax, sta: playerSta, staMax: playerStaMax,
               mgk: playerMgk, atk: playerAtk, lck: playerLck, int: playerInt,
               def: playerDef, level: playerLevel, xp: playerXP, karma: playerKarma}
    });

    //Dead/asleep override (LLM limit gone, hack it is!)
    var originalType=enemyType;
    if (corpseState!=""){ 
      enemyType="Prop"
    }

    //Override Rival type for action
    if (enemyType.includes("Boss-Rival")){
      enemyType="Standard"
    }

    //Override boss type for action
    if (enemyType.includes("Boss")){
      enemyType=enemyType.replaceAll("Boss-","");
    }

    switch (button) {
      case 'button_attack': //Attacking always needs stamina
        var enemyAttacked=false;

        if (enemyType=="Death") {

          // Game won, no ress
          if (areaName.includes("Auxiliary")) {displayPlayerCannotEffect(); break;}

          if (_skillOK === false) {
            var runEndMessage=getRunEndMessage();
            permanentDeath("<p style=\"color:#fff;-webkit-text-stroke:4px black;paint-order:stroke fill;\">"+runEndMessage+"</p>");
            break;
          }
          playerReincarnate();
          break;
        }

        if (enemyType=="Dream") {
          displayPlayerCannotEffect();
          var msg = (areaName === "Shrouded Necropolis") ? "Nothing to strike, only yourself." : "Cannot attack while asleep.";
          if (enemyName.includes("Regrets")) msg="Attacking wouldn't solve anything."
          logPlayerAction(actionString,msg);
          break;
        }

        if (enemyType=="Shop") {
          drachmaeBuy(1,"Favor");
          break;
        }

        var _smashableTrap = (enemyType==="Trap" || enemyType==="Trap-Roll" || enemyType==="Trap-Obstacle");
        if (enemyType!="Upgrade" && !(_smashableTrap && _crit==='success')) {
          if (playerSta > 0) playerSta--;
        }

        // Corpse state — neutralized only (killed disables the button)
        if (corpseState === "neutralized") {
          if (_skillOK === false) {
            if (_crit === 'fail') {
              logPlayerAction(actionString,"Missed so badly, you hurt yourself -1 💔");
              playerHit(1,false);
            } else {
              logPlayerAction(actionString,"Missed the motionless target -1 🟢");
            }
            displayPlayerCannotEffect();
            break;
          }
          var _cdmg = playerAtk + playerAtkBonus;
          if (_crit === 'success') _cdmg++;
          displayEnemyEffect("💢");
          enemyHpLost = Math.min(parseInt(enemyHp), parseInt(enemyHpLost) + _cdmg);
          if (parseInt(enemyHpLost) >= parseInt(enemyHp)) {
            logPlayerAction(actionString, (_crit==='success')
              ? "Struck them extra hard —"+_cdmg+" 💔"
              : "Dealt a killing blow -"+_cdmg+" 💔", _crit==='success' ? colorYellow : "#FFF");
            var _kxp=parseInt(playerGainXP(_isRival ? 2 : 1,0,""));
            logAction(corpseSnapshot.emoji+" ▸ ☠️ Final blow delivered -"+_cdmg+" 💔 "+decorateStatusText("","+"+_kxp+" XP",colorGold));
            if (!isKarmaSafeKill()) playerKarma--;
            playerKills++;
            AchievementManager.check('kill');
            if (_isRival) {
              AchievementManager.check('rival_kill');
              if (typeof RivalManager !== 'undefined') {
                logAction(enemyEmoji+" ▸ 🗯️ <i>" + RivalManager.getLastWord(_rivalEndType) + "</i>");
                pushEncounter(RivalManager.getRivalItemDrop(_rivalInventory));
              }
            }
            transitionToCorpse("killed");
          } else {
            logPlayerAction(actionString,"Struck the helpless target -"+_cdmg+" 💔");
            wakeUpEnemy();
          }
          break;
        }

        switch (enemyType){
          case "Mirror":
          case "Item":
          case "Consumable":
          case "Container-Consume":
            isFishing=false;
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Your attack missed it -1 🟢");
              }
              break;
            }
            if (enemyTeam.includes("Transient Currency")) {
              logPlayerAction(actionString, "Your strike passed through it -1 🟢");
              displayPlayerCannotEffect();
              break;
            }
            if (enemyTeam.includes("Lover's Memento") || enemyTeam.includes("Piece of History")) {
              if (encounterUsed) {
                logPlayerAction(actionString, "No more relief is coming from that -1 🟢");
                break;
              }
              _crit === 'success'
              ? playerAtk++ : "nothing happens"; //if crit add ++ atk 
              playerLove-=2;
              playerKarma-=2;
              AchievementManager.check('letter_ditch');
              logPlayerAction(actionString, _crit === 'success'
                ? "<text style=color:"+colorRed+";>Shredded it with fury! +1 ⚔️ -1 💔</text>"
                : "<text style=color:"+colorRed+";>Tore it apart with hatred -1 💔</text>");
              displayPlayerCannotEffect();
              if (playerHp>0) nextEncounter();
              encounterUsed=true;
              break;
            }
            if (enemyType === "Mirror" && encounterUsed) {
              logPlayerAction(actionString, "The shards hold no more secrets.");
              displayPlayerCannotEffect();
              break;
            }

            logPlayerAction(actionString, "Smashed it to many pieces -1 🟢");

            if (enemyType === "Mirror") {
              logPlayerAction(actionString, "Misfortune took a notice of you! -3 🍀", colorRed)
              playerLck-=3;
            }

            animateFlipNextEncounter();
            break;
          case "Trap-Sleep":
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Your attack missed harmlessly -1 🟢");
              }
            } else {
              logPlayerAction(actionString, _crit === 'success'
                ? "Hit hit hard, but with no effect."
                : "Your attack had no effect -1 🟢", _crit === 'success' ? colorYellow : "#FFF");
            }
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            break;
          case "Trap-Big":
            // Bar is impossible (all-red)
            logPlayerAction(actionString, "Your attack had no effect -1 🟢");
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            break;
          case "Trap":
          case "Trap-Roll":
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            isFishing=false;
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Missed it completely -1 🟢");
              }
              break;
            }
            logPlayerAction(actionString, _crit === 'success'
              ? "Obliterated it without breaking a sweat."
              : "Smashed it into tiny bits -1 🟢", _crit === 'success' ? colorYellow : "#FFF");
            nextEncounter();
            break;

          case "Trap-Obstacle":
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            isFishing=false;
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Couldn't break through -1 🟢");
              }
              break;
            }
            logPlayerAction(actionString, _crit==='success'
              ? "Obliterated it without a flinch."
              : "Smashed it into tiny bits -1 🟢", _crit==='success' ? colorYellow : "#FFF");
            nextEncounter();
            break;

          case "Trap-Attack": //Attacking causes you damage
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();

            if (encounterUsed){
                logPlayerAction(actionString,getEncounterUsedMessage())
                break;
              }

            if (totalBonus > 0) {
              if (_skillOK === false) {
                if (_crit === 'fail') {
                  playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Terrible form — you set yourself back.", true, false);
                } else {
                  logPlayerAction(actionString, "Poor form, gained nothing -1 🟢");
                }
                break;
              }
              encounterUsed = true;
            }

            if (enemyHp<=0) playerHpMax-=enemyHp; //Don't lose max hp
            if (enemySta<=0) playerStaMax-=enemySta; //Don't lose max sta
            playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg,true,false);
            break;

          case "Spirit":
            displayEnemyEffect("💨");
            displayEnemyCannotEffect();
            if ((enemySta+enemyStaLost)==0){
              atckmsg="Seems impossible to be hit.";
            } else {
              atckmsg="Cannot hit them, they retaliated -"+enemyAtk+" 💔";
            }
            if (enemyCastIfMgk(true)) enemyAttacked=true;
            if (!enemyAttacked) enemyAttackOrRest(atckmsg);
            break;

          case "Friend":
            enemyTurnAggressive("Your attack turned them adversary!");
            enemyHit(playerAtk);
            break;

          //You hit first, they hit back if they have stamina
          case "Demon":
          case "Undead":
            if (playerLootString.includes("📿")) {
              playerAtkBonus=2;
              logAction("📿 ▸ ⚔️ Your attack was blessed with +2 ⚔️")
            }
          case "Standard":
          case "Heavy":
          case "Recruit":
          case "Pet":
          case "Boss":
          case "Small":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
          case "Reflective":
            if (enemyCastIfMgk(true)) enemyAttacked=true;

            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hit yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "You missed your attack -1 🟢");
              }
              displayEnemyDodgeEffect();
              if (!enemyAttacked) enemyAttackOrRest();
              break;
            }

            //if (enemyType=="Tough") enemyDef=1; //Hehe, should Tough have something špeci?
            if (_crit === 'success') {
              logPlayerAction(actionString, "Your attack hit them extra hard -"+(playerAtk+playerAtkBonus-enemyDef+1)+" 💔", colorYellow);
              enemyHit(playerAtk+playerAtkBonus-enemyDef+1,false,true,true);
            } else {
              enemyHit(playerAtk+playerAtkBonus-enemyDef);
            }

            if ((parseInt(enemyHp)-parseInt(enemyHpLost) > 0) && !enemyAttacked) { //If they survive, they counterattack or regain stamina
              if (enemyAtkBonus < 0) {
                enemyAtkBonus++;
                logAction(enemyEmoji+" ▸ 💢 Your attack angered them +1 ⚔️");
              }
              enemyAttackOrRest();
            }
            break;

          case "Swift": //Dodge only on fail; player always hits on pass
            if (enemyCastIfMgk(true)) enemyAttacked=true;

            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed them, hit yourself -1 💔 -1 🟢");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Your attack missed them -1 🟢");
              }
              displayEnemyDodgeEffect();
              if ((parseInt(enemySta)-parseInt(enemyStaLost) > 0) && !enemyAttacked) {
                displayEnemyEffect("🌀");
                if ((enemyAtk+enemyAtkBonus)>0){
                  enemyStaminaChangeMessage(-1,"They dodged that and retaliated -"+(enemyAtk+enemyAtkBonus)+" 💔","n/a");
                  playerHit(enemyAtk+enemyAtkBonus);
                } else {
                  enemyStaminaChangeMessage(-1,"They barely dodged your attack.","They needed to catch a breath.");
                }
              } else if (!enemyAttacked) {
                enemyAttackOrRest();
              }
              break;
            }

            if (_crit === 'success') {
              logPlayerAction(actionString, "Your attack hit them extra hard -"+(playerAtk+1)+" 💔", colorYellow);
              enemyHit(playerAtk+1,false,true,true);
            } else {
              enemyHit(playerAtk);
            }
            if ((parseInt(enemyHp)-parseInt(enemyHpLost) > 0) && !enemyAttacked) {
              if (enemyAtkBonus < 0) {
                enemyAtkBonus++;
                logAction(enemyEmoji+" ▸ 💢 Your attack angered them +1 ⚔️");
              }
              enemyAttackOrRest();
            }
            break;

          case "Altar":
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
              break;
            }
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Your attack missed it -1 🟢");
              }
              break;
            }
            logPlayerAction(actionString, _crit === 'success'
              ? "Obliterated it without a second thought."
              : "Smashed it to rubble -1 🟢", _crit === 'success' ? colorYellow : "#FFF");
            isFishing = false;
            animateFlipNextEncounter();
            break;

          case "Upgrade":
            //Health
            logPlayerAction(actionString,"Got more resilient <b>+1 ❤️ Health</b>.");
            displayPlayerGainedEffect();
            displayPlayerEffect("❤️");
            playerHpMax+=1;
            playerHp+=1;
            isFishing=false;
            animateFlipNextEncounter();
            break;

          case "Memory":
            isFishing = false;
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                logPlayerAction(actionString, "Pulled back at the last moment -1 🟢");
              }
              displayEnemyCannotEffect();
              break;
            }
            _crit === 'success' ? playerAtk++ : "nothing happens"; //if crit add ++ atk
            playerLove--;
            playerKarma--;
            if ((playerHp-1)<=0) enemyMsg="Torn apart by severe heartbreak!"
            logPlayerAction(actionString, _crit === 'success'
              ? "<text style=color:"+colorRed+";>Struck it furiously +1 ⚔️ -1 💔</text>"
              : "<text style=color:"+colorRed+";>Struck it full of anger -1 💔</text>");
            displayEnemyEffect("👊");
            displayPlayerEffect("💔");
            playerHit(1);
            break;

          default:
            if (enemyType.includes("Container")){
              var openMessage = "Smashed it into many pieces! -1 🟢";
              displayEnemyEffect("〽️");
              displayEnemyCannotEffect();

              if (enemyType.includes("Locked")) {
                openMessage = "Smashed it, the lock still holds -1 🟢";
                enemyHp-=playerAtk;
              } else {
                if (_skillOK === false) {
                  if (_crit === 'fail') {
                    logPlayerAction(actionString, "Missed so badly, you hurt yourself -1 💔");
                    playerHit(1, false);
                  } else {
                    logPlayerAction(actionString, "Your attack missed -1 🟢");
                  }
                  break;
                }
                openMessage = "Smashed it open! -1 🟢";
                displayEnemyEffect("〽️");
                logPlayerAction(actionString, openMessage);
                nextEncounter();
                break;
              }

              if (enemyType.includes("Locked")&&(enemyHp>(-3))){
                logPlayerAction(actionString, openMessage);
              } else {
                var gainedXP=playerGainXP(1,GAME_CONFIG.rewardXp*playerLevel,"");
                openMessage = "Smashed the lock open! -1 🟢 "+decorateStatusText("","+"+gainedXP+" XP",colorGold);
                logPlayerAction(actionString, openMessage);
                enemyType=enemyType.replace("Locked-","");
                enemyHp=0;
                enemyMsg="Uncovered what was locked inside."
                AchievementManager.check('smash_door_first');
                redraw();
              }
              break;
            }
            logPlayerAction(actionString,"Your attack had no effect -1 🟢");
            displayEnemyEffect("〽️");
            displayEnemyCannotEffect();
      }
      break;

      case 'button_roll': //Stamina not needed for non-enemies + dodge handling per enemy type
        if (enemyType=="Death"){
          permanentDeath("<p style=\"color:#fff;-webkit-text-stroke:4px black;paint-order:stroke fill;\">"+getResignMessage()+"</p>");
          break;
        }

        const noStaForRollMessage = "Too tired to make any move.";
        var rollMessage;

        switch (enemyType){ //Dodge attack or walk if they are harmless
          case "Curse":
            if (!encounterUsed) {
              if (_skillOK === true) {
                logPlayerAction(actionString,"Endured without any side-effect.");
                displayEnemyCannotEffect();
                displayPlayerEffect("✨");
                encounterUsed=true;
              } else {
                playerChangeStats(enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef,enemyMsg);
                encounterUsed=true;
              }
            } else {
              logPlayerAction(actionString,"Continued on your adventure.");
              nextEncounter();
            }
            break;

          case "Standard":
          case "Undead":
          case "Recruit":
          case "Pet":
          case "Demon":
          case "Spirit":
          case "Boss":
          case "Small":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
          case "Reflective":
            if (((enemyAtk+enemyAtkBonus)<=0) && ((enemyMgk-enemyMgkLost)<=0)){
              if (enemyAtkBonus<0){
                playerGainXP(1.5,0,"They let you walk freely away");
              } else if (_skillOK === false) {
                if (Math.random() < 0.25) {
                  logPlayerAction(actionString, "Ouch, sprained your ankle -1 💔");
                  playerHit(1);
                } else {
                  playerSta = Math.max(0, playerSta - 1);
                  logPlayerAction(actionString, "Stumbled, almost falling over -1 🟢");
                  displayPlayerCannotEffect();
                }
              } else {
                if (_crit === 'success') {
                  logPlayerAction(actionString, getWalkCritText(), colorYellow);
                } else {
                  logPlayerAction(actionString,"Walked away leaving them behind.");
                }
              }
              isFishing=false;
              if (playerHp > 0) animateFlipNextEncounter();
              break;
            }

            if (playerSta > 0 && _crit !== 'success') playerSta--;

            if (enemyCastIfMgk(false)){
              logPlayerAction(actionString,"Dodged their spell -1 🟢");
              displayEnemyCannotEffect();
              displayPlayerEffect("🌀");
              break;
            }

            if (_skillOK === false && (enemyType === "Toxic" || enemyType === "Hot")) {
              var _toxicDmg = Math.max(1, enemyAtk+enemyAtkBonus);
              logPlayerAction(actionString, "Fell right onto them -"+_toxicDmg+" 💔 -1 🟢");
              displayPlayerCannotEffect();
              playerHit(_toxicDmg);
              break;
            }

            if (_skillOK === false && (enemySta-enemyStaLost) <= 0 && (enemyAtk+enemyAtkBonus) > 0) {
              var _dodgeDmg = enemyAtk+enemyAtkBonus;
              logPlayerAction(actionString, "Dodged so slowly they hit you -"+_dodgeDmg+" 💔 -1 🟢");
              displayPlayerCannotEffect();
              playerHit(_dodgeDmg);
              break;
            }

            if (_skillOK === false && (enemyAtk+enemyAtkBonus) > 0) {
              var _dodgeDmg = enemyAtk+enemyAtkBonus;
              if (_crit === 'fail') {
                playerSta = Math.max(0, playerSta - 1);
                logPlayerAction(actionString, "Tripped right into them -"+_dodgeDmg+" 💔 -2 🟢");
              } else {
                logPlayerAction(actionString, "Dodge failed, took the hit -"+_dodgeDmg+" 💔 -1 🟢");
              }
              displayPlayerCannotEffect();
              playerHit(_dodgeDmg);
              break;
            }

            if (_crit === 'success') {
              rollMessage="Glided past, untouched.";
            } else if ((enemyAtk+enemyAtkBonus)!=0){
              rollMessage="Dodged their attack -1 🟢";
            } else {
              rollMessage="They do not mean any harm -1 🟢";
            }

            enemyStaminaChangeMessage(-1,rollMessage,"Your roll was a waste of energy -1 🟢", _crit === 'success' ? colorYellow : undefined);
            displayPlayerEffect("🌀");
            break;

          case "Swift":
            if (((enemyAtk+enemyAtkBonus)<=0) && ((enemyMgk-enemyMgkLost)<=0)){
              if (enemyAtkBonus<0){
                playerGainXP(1.5,0,"They let you walk away");
              } else if (_skillOK === false) {
                if (Math.random() < 0.25) {
                  logPlayerAction(actionString, "Ouch, sprained your ankle -1 💔");
                  playerHit(1);
                } else {
                  playerSta = Math.max(0, playerSta - 1);
                  logPlayerAction(actionString, "Stumbled, almost falling over -1 🟢");
                  displayPlayerCannotEffect();
                }
              } else {
                if (_crit === 'success') {
                  logPlayerAction(actionString, getWalkCritText(), colorYellow);
                } else {
                  logPlayerAction(actionString,"Walked away leaving them behind.");
                }
              }
              isFishing=false;
              if (playerHp > 0) nextEncounter();
              break;
            }

            if (enemyCastIfMgk(false) && playerUseStamina(1,noStaForRollMessage)){
              logPlayerAction(actionString,"Dodged their spell -1 🟢");
              break;
            }

            if (playerSta > 0 && _crit !== 'success') playerSta--;
            if (_skillOK === true) {
              enemyStaminaChangeMessage(-1,
                _crit === 'success' ? "Glided past a swift attack." : "Barely slipped a swift attack -1 🟢",
                "Rolled out of the way -1 🟢", _crit === 'success' ? colorYellow : undefined);
              displayPlayerEffect("🌀");
            } else {
              if (_crit === 'fail') {
                playerSta = Math.max(0, playerSta - 1);
                enemyStaminaChangeMessage(-1,"Ran straight into their attack -"+enemyAtk+" 💔 -2 🟢","Rolled into a surprise attack -"+enemyAtk+" 💔");
              } else {
                enemyStaminaChangeMessage(-1,"Failed to dodge their attack -"+enemyAtk+" 💔","Rolled into a surprise attack -"+enemyAtk+" 💔");
              }
              playerHit(enemyAtk);
            }
            break;

          case "Heavy":
            if (((enemyAtk+enemyAtkBonus)<=0) && ((enemyMgk-enemyMgkLost)<=0)){
              if (enemyAtkBonus<0){
                playerGainXP(1.5,0,"They let you walk away");
              } else if (_skillOK === false) {
                if (Math.random() < 0.25) {
                  logPlayerAction(actionString, "Ouch, sprained your ankle -1 💔");
                  playerHit(1);
                } else {
                  playerSta = Math.max(0, playerSta - 1);
                  logPlayerAction(actionString, "Stumbled, almost falling over -1 🟢");
                  displayPlayerCannotEffect();
                }
              } else {
                if (_crit === 'success') {
                  logPlayerAction(actionString, getWalkCritText(), colorYellow);
                } else {
                  logPlayerAction(actionString,"Walked away leaving them behind.");
                }
              }
              isFishing=false;
              if (playerHp > 0) animateFlipNextEncounter();
              break;
            }

            if (enemyCastIfMgk(false) && playerUseStamina(1,noStaForRollMessage)){
              logPlayerAction(actionString,"Dodged their spell -1 🟢");
              displayEnemyCannotEffect();
              displayPlayerEffect("🌀");
              break;
            }

            if (_crit === 'success' || playerUseStamina(1, noStaForRollMessage)) {
              if (_skillOK === false && (enemyAtk+enemyAtkBonus) > 0 && (enemySta-enemyStaLost) > 0) {
                enemyStaminaChangeMessage(-1,"Rolled so slow they hit you -"+(enemyAtk+enemyAtkBonus)+" 💔","Rolled around wasting energy -1 🟢");
                playerHit(enemyAtk+enemyAtkBonus);
              } else {
                enemyStaminaChangeMessage(-1,
                  _crit === 'success' ? "Glided past without a stumble." : "Dodged a heavy attack -1 🟢",
                  "Rolled around wasting energy -1 🟢");
                displayPlayerEffect("🌀");
              }
            }
            break;

          case "Item": //You'll simply skip ahead
          case "Consumable":
          case "Checkpoint":
            if (enemyName === "Dream Shrimp") {
              displayEnemyCannotEffect();
              logPlayerAction(actionString, "Can't leave this behind.");
              break;
            }
            if (isFishing){
              isFishing=false;
              logPlayerAction(actionString,"Threw it back into the water.");
              var _savedRested = playerRested;
              nextEncounter();
              playerRested = _savedRested;
              break;
            } else {
              if (enemyTeam.includes("Transient Currency")) {
                logPlayerAction(actionString, "It is now bound to your soul.");
                displayPlayerCannotEffect();
                break;
              }
              if (enemyTeam.includes("Lover's Memento") || enemyTeam.includes("Piece of History")){
                if (_skillOK === false) {
                  if (playerSta > 0) playerSta--;
                  logPlayerAction(actionString, "Walked away from it clumsily -1 🟢");
                  displayPlayerCannotEffect();
                  nextEncounter();
                  break;
                }
                logPlayerAction(actionString, _crit === 'success'
                  ? getWalkCritText()
                  : "Left it where you found it.", _crit === 'success' ? colorYellow : "#FFF");
                nextEncounter();
                break;
              }
              if (_skillOK === false) {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString,"Threw it unnecessarily far -1 🟢");
                displayPlayerCannotEffect();
                nextEncounter();
                break;
              }
              logPlayerAction(actionString,"Ditched it onto the ground.");
            }
            nextEncounter();
            break;
          case "Fishing":
            isFishing=false;
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Tripped on the way out -1 💔");
                playerHit(1);
              } else {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString, getFishingStumbleText() + " -1 🟢");
                displayPlayerCannotEffect();
              }
            } else {
              logPlayerAction(actionString, _crit === 'success'
                ? chooseFrom(["Left the waterside in a good mood.", "Walked away whistling a fishing tune.", "Strolled off from the water's edge."])
                : "Left the waterside.", _crit === 'success' ? colorYellow : "#FFF");
            }
            if (playerHp > 0) nextEncounter();
            break;
          case "Altar":
            logPlayerAction(actionString,"Continued on your adventure.");
            isFishing=false
            nextEncounter();
            break;
          case "Container":
          case "Consumable-Container":
          case "Locked-Container":
            logPlayerAction(actionString,"Walked away wasting the potential.");
            encounterIndex++;
            isFishing=false;
            nextEncounter();
            break;
          case "Dream":
            if (playerSta<=0){
              displayPlayerCannotEffect();
              var msg="Cannot walk while asleep."
              if (enemyName.includes("Regrets")) msg="You cannot walk away from this."
              logPlayerAction(actionString,msg);
            } else {
              if (_skillOK === false) {
                playerSta = Math.max(0, playerSta - 1);
                logPlayerAction(actionString, "Struggled to leave the dream -1 🟢");
                displayPlayerCannotEffect();
                nextEncounter();
                break;
              }
              logPlayerAction(actionString,enemyMsg);
              nextEncounter();
            }
            break;
          case "Mirror":
          case "Prop":
            isFishing=false;
            if (corpseState != "" && isKillEnding) {
              logPlayerAction(actionString, '<span style="color:#FFD940;">Picked her up to caress one last time.</span>');
              nextEncounter();
              break;
            }
            if (_skillOK === false) {
              if (Math.random() < 0.25) {
                logPlayerAction(actionString, "Ouch, sprained your ankle -1 💔");
                playerHit(1);
              } else {
                playerSta = Math.max(0, playerSta - 1);
                logPlayerAction(actionString, "Stumbled, almost falling over -1 🟢");
                displayPlayerCannotEffect();
              }
              if (playerHp > 0) nextEncounter();
              break;
            }
            var _walkMsg;
            if (_crit === 'success') {
              _walkMsg = getWalkCritText();
            } else if (enemyMsg!="" && totalBonus==0 && totalMalus==0){
              _walkMsg = enemyMsg;
            } else {
              _walkMsg = "Continued on your adventure.";
            }
            logPlayerAction(actionString, _walkMsg);
            if (enemyName === "Gloomy Gateway" && !gatewayPassed) { gatewayPassed = true; applyGatewayEffects(); }
            nextEncounter();
            break;
          case "Memory":
            isFishing = false;
            if (_skillOK === false) {
              if (Math.random() < 0.25) {
                logPlayerAction(actionString, "Ouch, sprained your ankle -1 💔");
                playerHit(1);
              } else {
                playerSta = Math.max(0, playerSta - 1);
                logPlayerAction(actionString, "Stumbled, almost falling over -1 🟢");
                displayPlayerCannotEffect();
              }
              if (playerHp > 0) nextEncounter();
              break;
            }
            logPlayerAction(actionString, _crit === 'success'
              ? getWalkCritText()
              : "Left it behind you without flinching.", _crit === 'success' ? colorYellow : "#FFF");
            nextEncounter();
            break;
          case "Friend":
            if (areaName.includes("Shrouded") && !isFishing) {
              logPlayerAction(actionString,"They did not let you leave!");
              isFishing=false;
              break;
            }
            logPlayerAction(actionString, _crit === 'success'
              ? chooseFrom(["Left with a warm farewell.", "Parted on good terms.", "Slipped away with a smile."])
              : "Walked away leaving them behind.", _crit === 'success' ? colorYellow : "#FFF");
            isFishing=false;
            nextEncounter();
            break;

          case "Trap-Roll": //Triggers when rolling into it — now bar-driven
            if (!encounterUsed) {
              if (_skillOK === false) {
                // Trap triggers — walked straight into it
                if (totalBonus > 0) {
                  if (_crit === 'fail') {
                    playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Terrible form — you set yourself back.", true, false);
                  } else {
                    logPlayerAction(actionString, "Poor form, triggered it instead -1 🟢");
                    playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg, true, false);
                  }
                } else {
                  if (enemyHp<=0) playerHpMax-=enemyHp;
                  if (enemySta<=0) playerStaMax-=enemySta;
                  playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg, true, false);
                }
                encounterUsed = true;
              } else {
                // Passed — walked away safely
                logPlayerAction(actionString, _crit === 'success'
                  ? chooseFrom(["Slipped past it effortlessly.", "Cleared it without a second thought.", "Avoided it perfectly."])
                  : "Carefully walked around it -1 🟢", _crit === 'success' ? colorYellow : "#FFF");
                if (playerSta > 0 && _crit !== 'success') playerSta--;
                isFishing=false;
                nextEncounter();
              }
            } else {
              logPlayerAction(actionString, "Continued on your adventure.");
              isFishing=false;
              nextEncounter();
            }
            displayPlayerCannotEffect();
            break;
          case "Trap-Obstacle":
            if (!encounterUsed) {
              if (totalBonus > 0) {
                if (_skillOK === false) {
                  if (_crit === 'fail') {
                    playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Terrible form — you set yourself back.", true, false);
                  } else {
                    logPlayerAction(actionString, "Poor form, gained nothing -1 🟢");
                  }
                  displayPlayerCannotEffect();
                  break;
                }
                encounterUsed = true;
              }
              if (enemyHp<=0) playerHpMax-=enemyHp; //Don't lose max hp
              if (enemySta<=0) playerStaMax-=enemySta; //Don't lose max sta
              playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk,enemyDef,enemyMsg,true,false);
            }
            //nextEncounter(); //Blocks the path ahead
            displayPlayerCannotEffect();
            break;
          case "Trap-Big":
            isFishing=false;
            if (_skillOK === false) {
              if (enemyHp<=0) playerHpMax-=enemyHp;
              if (enemySta<=0) playerStaMax-=enemySta;
              playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg, true, false);
              if (enemyHp < 0 && playerHp > 0) AchievementManager.check('survive_trap');
              encounterUsed = true;
            } else {
              logPlayerAction(actionString, _crit === 'success'
                ? "Slipped through the danger effortlessly."
                : "Carefully walked past it -1 🟢", _crit === 'success' ? colorYellow : "#FFF");
              if (playerSta > 0 && _crit !== 'success') playerSta--;
              nextEncounter();
            }
            break;
          case "Trap-Sleep":
            isFishing=false;
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString, "Stumbled, almost fell face-first -1 💔");
                playerHit(1);
              } else {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString, "Stumbled walking past it -1 🟢");
                displayPlayerCannotEffect();
              }
            } else {
              logPlayerAction(actionString, _crit === 'success'
                ? chooseFrom(["Walked away in a good mood.", "Strolled off without a care.", "Slipped past without a thought."])
                : "Continued on your adventure.", _crit === 'success' ? colorYellow : "#FFF");
            }
            if (playerHp > 0) nextEncounter();
            break;
          case "Trap":
          case "Trap-Attack":
            isFishing=false;
            logPlayerAction(actionString,"Continued on your adventure.");
            nextEncounter();
            break;

          case "Upgrade":
            logPlayerAction(actionString,"Felt becoming faster <b>+1 🟢 Stamina</b>.");
            displayPlayerGainedEffect();
            displayPlayerEffect("💨");
            playerStaMax+=1;
            playerSta+=1;
            isFishing=false;
            animateFlipNextEncounter();
            break;

          case "Error":
            logPlayerAction(actionString,"Skipping to next encounter.");
            nextEncounter();
            break;

          case "Shop":
            logPlayerAction(actionString, getShopLeaveMessage());
            nextEncounter();
            break;

          default:
            if (enemyType.includes("Container")){
              logPlayerAction(actionString,"Left without investigating it.");
              encounterIndex+=enemyContainerNumber;
              nextEncounter();
              break;
            }
            logPlayerAction(actionString,"Felt like nothing really happened.");
        }
        break;

      case 'button_block':
        if (enemyType=="Shop") {
          drachmaeBuy(2,"Body");
          break;
        }

        if (enemyType=="Death"){
          logPlayerAction(actionString,"Echoed a message to the universe.");
          redirectToFeedback();
          break;
        }

        if (enemyType=="Dream") {
          displayPlayerCannotEffect();
          var msg = (areaName === "Shrouded Necropolis") ? "Nothing to shield against here." : "Cannot block while asleep.";
          if (enemyName.includes("Regrets")) msg="You cannot block your regrets."
          logPlayerAction(actionString,msg);
          break;
        }

        if (enemyType == "Upgrade"){
          logPlayerAction(actionString,"Gained the power of <b>+1 🔵 Mana</b>.");
          AchievementManager.check('mana_first');
          displayPlayerCannotEffect();
          displayPlayerEffect("✨");
          playerMgk+=1;
          playerMgkMax+=1;
          isFishing=false;
          animateFlipNextEncounter();
          break;
        }

        if (['Prop','Memory','Mirror','Altar','Curse','Checkpoint','Fishing','Item','Consumable'].indexOf(enemyType) !== -1
            || enemyType.includes('Container') || enemyType.includes('Trap')) {
          logPlayerAction(actionString, encounterUsed ? "Nothing more to guard against." : "Nothing to block here.");
          displayPlayerCannotEffect();
          break;
        }

        if (playerSta > 0 && _crit !== 'success') playerSta--;

        if ((enemyAtk+enemyAtkBonus)<=0 && (enemySta-enemyStaLost) > 0 && enemyType!="Pet" && enemyType!="Small" && enemyType!="Toxic" && enemyType!="Hot"){
          if (_skillOK === true) {
            if (enemyStaminaChangeMessage(-2,"Threw them off balance -1 🟢","They needed to catch a breath -1 🟢")) {
              logAction(enemyEmoji+"&nbsp;▸&nbsp;🌀 Scrambles to recover their footing.");
            }
          } else {
            enemyStaminaChangeMessage(-1,"They dodged out of your reach -1 🟢","They needed to catch a breath -1 🟢");
          }
          displayEnemyEffect("☝️");
          displayEnemyCannotEffect();
          break;
        }

        if (!enemyType.includes("Friend") && enemyCastIfMgk(true,"Could not block their spell")){
          break;
        }

        if (enemyType === "Spirit" && (enemyAtk+enemyAtkBonus) > 0) {
          logPlayerAction(actionString, "Could not block a spectral attack -"+(enemyAtk+enemyAtkBonus)+" 💔");
          playerHit(enemyAtk+enemyAtkBonus, true, true);
          break;
        }

        if (_skillOK === false && enemyType === "Undead" && (enemyAtk+enemyAtkBonus) > 0) {
          var _undeadBlockDmg = enemyAtk + enemyAtkBonus;
          if (_crit === 'fail') {
            playerSta = Math.max(0, playerSta - 1);
            if (enemyStaminaChangeMessage(-1, "Rot tore through your guard -"+_undeadBlockDmg+" 💔 -2 🟢", "Couldn't break through, caught their breath.")) playerHit(_undeadBlockDmg);
          } else {
            if (enemyStaminaChangeMessage(-1, "The rot broke your block -"+_undeadBlockDmg+" 💔 -1 🟢", "Couldn't break through, caught their breath.")) playerHit(_undeadBlockDmg);
          }
          break;
        }

        if (_skillOK === false && (enemyAtk+enemyAtkBonus) > 0
            && enemyType!=="Pet" && enemyType!=="Small" && enemyType!=="Friend" && enemyType!=="Swift") {
          var _blockFailDmg = enemyAtk + enemyAtkBonus;
          var _blockFailMsg;
          if (_crit === 'fail') {
            playerSta = Math.max(0, playerSta - 1);
            _blockFailMsg = "Block crumbled inward -"+_blockFailDmg+" 💔 -2 🟢";
          } else {
            _blockFailMsg = "They broke your block -"+_blockFailDmg+" 💔 -1 🟢";
          }
          if (enemyStaminaChangeMessage(-1, _blockFailMsg, "Couldn't break through, caught their breath.")) {
            playerHit(_blockFailDmg);
          }
          break;
        }

        switch (enemyType){
          case "Pet":
          case "Small":
            if (enemySta<=0){
              displayEnemyEffect("☝️");
              logPlayerAction(actionString,"They cannot do much about that.")
              displayEnemyCannotEffect();
              break;
            }
            if ((enemyAtk+enemyAtkBonus)<=0) {
              if (_skillOK === true) {
                displayEnemyEffect("☝️");
                if (enemyStaminaChangeMessage(-2,getPlayfulMomentLog(),"They needed to catch a breath -1 🟢")) {
              }
            } else {
              displayEnemyEffect("☝️");
              enemyStaminaChangeMessage(-1,"They dodged out of your reach -1 🟢","They needed to catch a breath -1 🟢");
            }
            } else {
              enemyStaminaChangeMessage(-1,
                _crit === 'success' ? "Blocked without breaking a sweat." : "Blocked a regular attack -1 🟢",
                "Blocked just for the sake of it -1 🟢", _crit === 'success' ? colorYellow : undefined);
              displayPlayerEffect("🔰");
            }
            break;
          case "Undead":
            enemyStaminaChangeMessage(-1,
              _crit === 'success' ? "Held back the rot perfectly." : "Blocked through the stench -1 🟢",
              "Blocked just for the sake of it -1 🟢", _crit === 'success' ? colorYellow : undefined);
            displayPlayerEffect("🔰");
            break;

          case "Standard":
          case "Recruit":
          case "Demon":
          case "Stingy":
          case "Tough":
          case "Reflective":
            enemyStaminaChangeMessage(-1,
              _crit === 'success' ? "Blocked without breaking a sweat." : "Blocked a regular attack -1 🟢",
              "Blocked just for the sake of it -1 🟢", _crit === 'success' ? colorYellow : undefined);
            displayPlayerEffect("🔰");
            break;

          case "Swift":
            if (_skillOK === false && (enemyAtk+enemyAtkBonus) > 0) {
              enemyStaminaChangeMessage(-1,"You did not react fast enough -"+(enemyAtk+enemyAtkBonus)+" 💔","Blocked just for the sake of it -1 🟢");
              playerHit(enemyAtk+enemyAtkBonus);
              break;
            }
            enemyStaminaChangeMessage(-1,
              _crit === 'success' ? "Blocked without breaking a sweat." : "Blocked a swift attack -1 🟢",
              "Blocked just for the sake of it -1 🟢", _crit === 'success' ? colorYellow : undefined);
            displayPlayerEffect("🔰");
            break;

          case "Heavy": //Too heavy or spirit attack — can succeed but very hard
            if (_skillOK === true) {
              if (_crit === 'success') {
                var _hvXP = parseInt(playerGainXP(1, GAME_CONFIG.rewardXpSmall * playerLevel, ""));
                enemyStaminaChangeMessage(-1,
                  "Stood firm against the weight. " + decorateStatusText("", "+" + _hvXP + " XP", colorGold),
                  "They needed to catch a breath.");
              } else {
                enemyStaminaChangeMessage(-1, "Barely blocked a heavy attack -1 🟢", "They needed to catch a breath.");
              }
              displayPlayerEffect("🔰");
              break;
            }
            if (enemyStaminaChangeMessage(-1,"Could not block a heavy attack -"+enemyAtk+" 💔","They needed to catch a breath.")){
              playerHit(enemyAtk);
            } else {
              enemyStaminaChangeMessage(-1,"n/a","Blocked, but was not attacked -1 🟢");
              displayPlayerEffect("🔰");
            }
            break;

          case "Hot":
          case "Toxic":
            if (_skillOK === false) {
              var _passiveDmg = Math.max(1, enemyAtk + enemyAtkBonus);
              logPlayerAction(actionString, enemyType === "Hot"
                ? "Stood too close, got singed -" + _passiveDmg + " 💔"
                : "Breathed the toxic fumes in -" + _passiveDmg + " 💔");
              playerHit(_passiveDmg);
            } else {
              var _deflectMsg = enemyType === "Hot"
                ? (_crit === 'success' ? "Perfectly deflected the heat." : "Deflected the burning heat -1 🟢")
                : (_crit === 'success' ? "Perfectly covered your face."  : "Managed to cover your face  -1 🟢");
              enemyStaminaChangeMessage(-1, _deflectMsg, "Blocked, but was not attacked -1 🟢");
              displayPlayerEffect("🔰");
            }
            break;

          default:
            logPlayerAction(actionString,"Blocked just for the sake of it -1 🟢");
            displayPlayerEffect("🔰");
            break;
        }
        break;

        case 'button_cast':
          var mkgCost=1;
          var magicDamage = playerMgk;

          if (enemyType.includes("Locked")) mkgCost=2;

          if (enemyType=="Shop") {
            drachmaeBuy(1,"Gamble",_skillOK);
            break;
          }

          if (enemyType=="Death"){
            break;
          }

          if (enemyType=="Upgrade"){
            var _fateStats = [
              { gain: function(){ playerHpMax+=2; playerHp+=2; },
                lose: function(){ playerHpMax=Math.max(1,playerHpMax-1); if(playerHp>playerHpMax)playerHp=playerHpMax; }, icon:'❤️' },
              { gain: function(){ playerStaMax+=2; playerSta+=2; },
                lose: function(){ playerStaMax=Math.max(0,playerStaMax-1); if(playerSta>playerStaMax)playerSta=playerStaMax; }, icon:'🟢' },
              { gain: function(){ playerMgkMax+=2; playerMgk+=2; },
                lose: function(){ playerMgkMax=Math.max(0,playerMgkMax-1); if(playerMgk>playerMgkMax)playerMgk=playerMgkMax; }, icon:'🔵' },
              { gain: function(){ playerLck+=2; },
                lose: function(){ playerLck=Math.max(0,playerLck-1); }, icon:'🍀' },
              { gain: function(){ playerInt+=2; },
                lose: function(){ playerInt=Math.max(0,playerInt-1); }, icon:'🧠' }
            ];
            var _fGain = Math.floor(Math.random() * _fateStats.length);
            var _fLose;
            do { _fLose = Math.floor(Math.random() * _fateStats.length); } while (_fLose === _fGain);
            _fateStats[_fGain].gain();
            _fateStats[_fLose].lose();
            logPlayerAction(actionString, getFateLog()+" <b>+2 "+_fateStats[_fGain].icon+" -1 "+_fateStats[_fLose].icon+"</b>");
            displayPlayerGainedEffect();
            displayPlayerEffect("🎲");
            isFishing=false;
            animateFlipNextEncounter();
            break;
          }

          if (enemyType=="Dream") {
            displayPlayerCannotEffect();
            logPlayerAction(actionString, (areaName === "Shrouded Necropolis") ? "No spell will save you now." : "Cannot cast while asleep.");
            break;
          }

          if ((!playerLootString.includes("🧂")) && (playerMgk<mkgCost)){
            logPlayerAction(actionString,"Not enough mana, requires +"+mkgCost+" 🔵");
            displayPlayerCannotEffect();
            break;
          }

          // Corpse state — neutralized cast deals magic damage; killed does nothing
          if (corpseState !== "") {
            if (corpseState === "killed") {
              logPlayerAction(actionString,"Already dead.");
              displayPlayerCannotEffect();
              break;
            }
            // neutralized
            if (_skillOK === false) {
              playerMgk-=mkgCost;
              if (_crit === 'fail') {
                var _cbf=Math.max(1,magicDamage);
                logPlayerAction(actionString,"Spell snapped back -"+_cbf+" 💔 -"+mkgCost+" 🔵");
                playerHit(_cbf,false);
              } else {
                logPlayerAction(actionString,"Spell fizzled -"+mkgCost+" 🔵");
              }
              displayEnemyCannotEffect();
              break;
            }
            playerMgk-=mkgCost;
            var _cmdg=magicDamage;
            if (_crit==='success') _cmdg++;
            displayEnemyEffect("💢");
            enemyHpLost=Math.min(parseInt(enemyHp),parseInt(enemyHpLost)+_cmdg);
            if (parseInt(enemyHpLost)>=parseInt(enemyHp)) {
              logPlayerAction(actionString,(_crit==='success')
                ? "Spell was especially effective -"+_cmdg+" 💔"
                : "Spell delivered a killing blow -"+_cmdg+" 💔", _crit==='success' ? colorYellow : "#FFF");
              var _kxp2=parseInt(playerGainXP(_isRival ? 2 : 1,0,""));
              logAction(corpseSnapshot.emoji+" ▸ ☠️ Final blow delivered"+decorateStatusText("","+"+_kxp2+" XP",colorGold));
              if (!isKarmaSafeKill()) playerKarma--;
              playerKills++;
              AchievementManager.check('kill');
              if (_isRival) {
                AchievementManager.check('rival_kill');
                if (typeof RivalManager !== 'undefined') {
                  logAction("💭 ▸ <i>" + RivalManager.getLastWord(_rivalEndType) + "</i>");
                  pushEncounter(RivalManager.getRivalItemDrop(_rivalInventory));
                }
              }
              transitionToCorpse("killed");
            } else {
              logPlayerAction(actionString,"Struck the helpless target -"+_cmdg+" 💔");
              wakeUpEnemy();
            }
            break;
          }

          if (enemyType.includes("Locked")){
            if (playerMgk<mkgCost){
              logPlayerAction(actionString,"Not enough mana, requires +"+mkgCost+" 🔵");
              displayPlayerCannotEffect();
              break;
            } else {
              playerMgk-=mkgCost;
              var gainedXP=playerGainXP(1,GAME_CONFIG.rewardXp*playerLevel,"");
              logPlayerAction(actionString,"Unlocked it with a spell -"+mkgCost+" 🔵 "+decorateStatusText("","+"+gainedXP+" XP",colorGold));
              AchievementManager.check('magic_unlock_first');
              enemyType=enemyType.replace("Locked-","");
              enemyHp=0;
              enemyMsg="Uncovered what was locked inside.";
              redraw();
              break;
            }
          }

          if (enemyType!="Death" && playerCooked!=true && (enemyType=="Consumable" && !playerLootString.includes("🧂"))) displayPlayerEffect("🪄"); //I'm lazy

          if ((enemyType === "Mirror" || enemyType === "Prop" || enemyType === "Curse"
              || enemyType === "Memory" || enemyType === "Checkpoint") && encounterUsed) {
            logPlayerAction(actionString, getEncounterUsedMessage());
            displayPlayerCannotEffect();
            break;
          }

          if (_skillOK === false && !enemyType.includes("Locked") && !enemyType.includes("Container")
              && enemyType!=="Consumable" && enemyType!=="Item" && enemyType!=="Altar"
              && enemyType!=="Upgrade" && enemyType!=="Dream" && enemyType!=="Reflective"
              && enemyType!=="Prop") {
            var _backfireDmg = (_crit === 'fail') ? Math.max(1, playerMgk) : 0;
            playerMgk -= mkgCost;
            if (_crit === 'fail') {
              logPlayerAction(actionString, "Spell snapped back -"+_backfireDmg+" 💔 -"+mkgCost+" 🔵");
              playerHit(_backfireDmg, false);
            } else {
              logPlayerAction(actionString, "Spell fizzled -"+mkgCost+" 🔵");
            }
            displayEnemyCannotEffect();
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;
          }

        switch (enemyType){
          case "Friend":
            enemyTurnAggressive("Your spell turned them adversary!");
            enemyHit(magicDamage,true);
            break;

          case "Reflective":
            if ((parseInt(enemyHp)-parseInt(enemyHpLost))==1) magicDamage=1;
            if (_skillOK === false) {
              // Spell reflects back as HP damage
              playerMgk -= mkgCost;
              displayEnemyEffect("🔷");
              displayEnemyCannotEffect();
              logPlayerAction(actionString, "Spell reflected back -"+magicDamage+" 💔 -"+mkgCost+" 🔵");
              playerHit(magicDamage, false);
              if (enemyCastIfMgk(true)) enemyAttacked=true;
              if (!enemyAttacked) enemyAttackOrRest();
            } else {
              // Landed — spell bypasses reflection
              playerMgk-=magicDamage;
              var magicBonusDamage=0;
              if (procAbilityChance("💫",100)) magicBonusDamage=1;
              if ((enemyMgk-enemyMgkLost)<=magicDamage){
                if (_crit === 'success') {
                  logPlayerAction(actionString,"Spell pierced their defenses.", colorYellow);
                  enemyHit(magicDamage+magicBonusDamage+1,true);
                } else {
                  enemyHit(magicDamage+magicBonusDamage,true);
                }
              } else {
                logPlayerAction(actionString,"They resisted your spell -"+magicDamage+" 🔵");
                enemyMgkLost+=magicDamage;
                if (enemyMgkLost>enemyMgk) enemyMgkLost=enemyMgk;
              }
              if (enemyHp-enemyHpLost > 0) {
                if (enemyCastIfMgk()) break;
                enemyAttackOrRest();
              }
            }
            break;

          case "Recruit": //You should be faster if you have Mgk >= them
          case "Standard":
          case "Swift":
          case "Heavy":
          case "Pet":
          case "Swift":
          case "Spirit":
          case "Demon":
          case "Undead":
          case "Boss":
          case "Small":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
            if ((parseInt(enemyHp)-parseInt(enemyHpLost))==1) magicDamage=1;

            playerMgk-=magicDamage;
            var magicBonusDamage=0;

            if (procAbilityChance("💫",100)){
              magicBonusDamage=1;
            }

            if ((enemyMgk-enemyMgkLost)<=magicDamage){
              if (_crit === 'success') {
                logPlayerAction(actionString, "Spell was especially effective -"+(magicDamage+magicBonusDamage+1)+" 💔", colorYellow);
                enemyHit(magicDamage+magicBonusDamage+1,true,true,true);
              } else {
                enemyHit(magicDamage+magicBonusDamage,true);
              }
            } else {
              logPlayerAction(actionString,"They resisted your spell -"+magicDamage+" 🔵");
              enemyMgkLost+=magicDamage;
              if (enemyMgkLost>enemyMgk) enemyMgkLost=enemyMgk;
            }

            if (enemyHp-enemyHpLost > 0) { //If they survive, they counterattack or regain stamina
              if (enemyCastIfMgk()) break;
              enemyAttackOrRest();
            }
            break;

          case "Trap":
          case "Trap-Obstacle":
          case "Trap-Roll":
          case "Trap-Attack":
          case "Trap-Sleep":
          case "Item":
            playerMgk--;
            if (_skillOK === false) {
              logPlayerAction(actionString, _crit === 'fail'
                ? "Spell snapped back -1 🔵 -1 💔"
                : "Spell fizzled without effect -1 🔵");
              if (_crit === 'fail') playerHit(1, false);
              displayEnemyCannotEffect();
              break;
            }
            if (enemyTeam.includes("Transient Currency")) {
              logPlayerAction(actionString, "The spell passed right through -1 🔵");
              displayPlayerCannotEffect();
              break;
            }
            logPlayerAction(actionString,"Scorched it with a spell -1 🔵");
            displayEnemyEffect("🔥");
            isFishing=false;
            animateFlipNextEncounter();
            break;

          case "Consumable":
          case "Consumable-Container":
            if (_skillOK === false) {
              playerMgk--;
              logPlayerAction(actionString, _crit === 'fail'
                ? "Spell snapped back -1 🔵 -1 💔"
                : "Spell fizzled without effect -1 🔵");
              if (_crit === 'fail') playerHit(1, false);
              displayEnemyCannotEffect();
              break;
            }
            if (!playerCooked) {
              var logMessage="";

              if (enemyHp<0){
                logMessage="Cooked it with a spell -1 🔵";
                enemyHp=0;
                enemyMsg="Actually tasted good";
                displayEnemyEffect("🔥");
              } else {
                logMessage="Roasted a crispy crust -1 🔵";
                enemySta=parseInt(enemySta)+1;
                if (enemySta==1) enemySta=2;
                enemyMsg="That was very tasty";
                displayEnemyEffect("🔥");
              }

              if (playerLootString.includes("🧂")){
                logMessage="Added a tiny pinch of salt.";
                enemyName=enemyName+" (Salty)";
                displayEnemyEffect("✨");
                AchievementManager.check('salt_food');
              } else {
                enemyName=enemyName+" (Crispy)";
                playerMgk-=1;
              }

              playerCooked=true;
              AchievementManager.check('cook_food');
              logPlayerAction(actionString,logMessage);
              animateUIElement(enemyInfoUIElement,"animate__pulse","0.4"); //Animate cooking
            } else {
              displayPlayerCannotEffect();
              logPlayerAction(actionString, "Already improved this food!")
            }
            break;

          case "Altar":
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
              break;
            }
            playerMgk--;
            if (_skillOK === false) {
              logPlayerAction(actionString, _crit === 'fail'
                ? "Spell snapped back -1 🔵 -1 💔"
                : "Spell fizzled without effect -1 🔵");
              if (_crit === 'fail') playerHit(1, false);
              displayEnemyCannotEffect();
              break;
            }
            logPlayerAction(actionString,"Trashed it with a spell -1 🔵");
            isFishing=false;
            displayEnemyEffect("🔥");
            nextEncounter();
            break;

          default:
            if (enemyType.includes("Container") && !enemyType.includes("Locked")) {
              playerMgk--;
              if (_skillOK === false) {
                logPlayerAction(actionString, _crit === 'fail'
                  ? "Spell snapped back -1 🔵 -1 💔"
                  : "Spell fizzled without effect -1 🔵");
                if (_crit === 'fail') playerHit(1, false);
                displayEnemyCannotEffect();
                break;
              }
              logPlayerAction(actionString,"Scorched it with a spell -1 🔵");
              displayEnemyEffect("🔥");
              isFishing=false;
              nextEncounter();
              break;
              }
            logPlayerAction(actionString,"Your spell had no effect on that -1 🔵");
            playerMgk--;
            displayEnemyEffect("✨");
          }
          break;

        case 'button_heal':
          if (enemyType=="Shop") {
            drachmaeBuy(3,"Level");
            break;
          }

          if (enemyType=="Death"){
            // logPlayerAction(actionString,"It's kinda too late for healing now.");
            // displayPlayerCannotEffect();
            break;
          }

          if (enemyType=="Upgrade"){
            logPlayerAction(actionString,"Granted minor <b>+🍀 +🧠</b> gods blessing");
            displayPlayerGainedEffect();
            displayPlayerEffect("🙏");
            playerLck+=0.5;
            playerInt+=0.5;
            //playerKarma++; //Hmmm
            animateFlipNextEncounter();
            break;
          }

          if (enemyType=="Dream") {
            displayPlayerCannotEffect();
            logPlayerAction(actionString, (areaName === "Shrouded Necropolis") ? "This wound is beyond healing." : "Cannot heal while asleep.");
            break;
          }

          if (playerMgk<1 && enemyType!=="Curse" && enemyType!=="Altar"){
            logPlayerAction(actionString,"Not enough mana, requires +1 🔵");
            displayPlayerCannotEffect();
            break;
          }

          if (enemyType!="Death" && enemyType!="Dream") {displayPlayerEffect(actionString.substring(0,actionString.indexOf(" ")));}

          if (_skillOK === false && enemyType!=="Altar" && enemyType!=="Upgrade"
              && enemyType!=="Dream" && enemyType!=="Death" && enemyType!=="Curse") {
            playerMgk--;
            if (_crit === 'fail' && (enemyHp - enemyHpLost) < enemyHp) {
              enemyHpLost = Math.max(0, enemyHpLost - 1);
              logPlayerAction(actionString, "Healed the wrong target -1 🔵");
              displayEnemyEffect("❤️");
            } else {
              logPlayerAction(actionString, "Failed to cast a healing spell -1 🔵");
            }
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;
          }

        switch (enemyType){
          case "Curse": //Breaks only if mind is stronger
            if (_skillOK){
              if (!encounterUsed) {
                logPlayerAction(actionString,"Managed to keep it together +1 🧠");
                playerInt++;
                displayPlayerGainedEffect();
                encounterUsed=true;
              } else {
                logPlayerAction(actionString,getEncounterUsedMessage());
                displayPlayerCannotEffect();
                displayPlayerEffect("");
              }
            } else {
              playerChangeStats(enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef,"Gave your best, but failed.",true,false);
              encounterUsed=true;
              displayPlayerCannotEffect();
            }
            break;

          case "Consumable":
          case "Trap":
          case "Trap-Big":
          case "Trap-Obstacle":
          case "Trap-Attack":
          case "Trap-Roll":
          case "Trap-Sleep":
          case "Item":
          case "Fishing":
            playerHeal(_crit === 'success');
            break;
          case "Standard":
          case "Recruit":
          case "Swift":
          case "Heavy":
          case "Pet":
          case "Friend":
          case "Boss":
          case "Small":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
          case "Spirit":
          case "Demon":
          case "Undead":
            playerHeal(_crit === 'success');
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;

          case "Altar":
            // button_heal at Altar = heal (no mana cost; real altar prayer is on button_speak)
            var _altarMissingHp = playerHpMax - playerHp;
            if (_altarMissingHp > 0) {
              var _altarHeal = _altarMissingHp;
              playerHp += _altarHeal;
              logPlayerAction(actionString, "Healed at the altar +" + _altarHeal + " ❤️");
              displayPlayerGainedEffect();
            } else {
              logPlayerAction(actionString, "Already at full health, no effect.");
              displayPlayerCannotEffect();
            }
            break;

          default:
            playerHeal(_crit === 'success');
        }
        break;

      case 'button_curse':
        if (enemyType=="Shop") {
          drachmaeBuy(4,"Artifact");
          break;
        }

        if (enemyType=="Death"){
          // shareLinkedIn();
          // logPlayerAction(actionString,"Copied your run! Paste it into LinkedIn.");
          break;
        }

        if (enemyType=="Upgrade"){
            logPlayerAction(actionString,"Got blessed with <b>+1 🍀 Luck</b>.");
            displayPlayerCannotEffect();
            playerChangeStats(0, 0, 0, 1, 0, 0,0,"n/a",false,false);
            isFishing=false;
            animateFlipNextEncounter();
            break;
        }

        if (enemyType=="Dream") {
          displayPlayerCannotEffect();
          logPlayerAction(actionString, (areaName === "Shrouded Necropolis") ? "The darkness refuses to leave you." : "Cannot curse while asleep.");
          break;
        }

        if (['Prop','Memory','Mirror','Checkpoint','Fishing','Item','Consumable'].indexOf(enemyType) !== -1
            || enemyType.includes('Container')) {
          logPlayerAction(actionString, getCurseNoTargetText());
          displayPlayerCannotEffect();
          break;
        }

        if (encounterUsed) {
          logPlayerAction(actionString, getCurseNoTargetText());
          displayPlayerCannotEffect();
          break;
        }

        if (playerMgk < 2) { //Curse is never free, upgrd handled above
          logPlayerAction(actionString, "Not enough mana, requires +2 🔵");
          displayPlayerCannotEffect();
          break;
        }
        var _mgkSpent = playerMgk;
        playerMgk = 0;

        if (enemyType!="Death") {displayPlayerEffect("🪬");}

          // Reflective curse-back: failed skill check = curse snaps back onto the caster
          if (_skillOK === false && enemyType === "Reflective") {
            logPlayerAction(actionString, "Curse reflected back -1 ⚔️ -"+_mgkSpent+" 🔵");
            displayEnemyEffect("🔷");
            displayPlayerCannotEffect();
            playerAtk = Math.max(0, playerAtk - 1);
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;
          }

          if (_skillOK === false && enemyType!=="Upgrade" && enemyType!=="Death"
              && enemyType!=="Altar" && enemyType!=="Demon" && enemyType!=="Reflective") {
            if (_crit === 'fail') {
              playerAtk = Math.max(0, playerAtk - 1);
              logPlayerAction(actionString, "The curse turned on you -1 ⚔️ -"+_mgkSpent+" 🔵");
            } else {
              logPlayerAction(actionString, "Curse dissolved without effect -"+_mgkSpent+" 🔵");
            }
            displayEnemyCannotEffect();
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;
          }

      switch (enemyType){
        case "Reflective":
          // Curse landed (fail was caught above and broke early)
          if (playerMgkMax > enemyMgk && (enemyAtkBonus+enemyAtk)>0) {
            displayEnemyCannotEffect();
            displayEnemyEffect("🪬");
            var enemyAtkChange=Math.min(_mgkSpent-1, enemyAtk+enemyAtkBonus);
            enemyAtkBonus-=enemyAtkChange;
            if (_crit === 'success' && (enemyAtkBonus+enemyAtk) > 0) {
              enemyAtkBonus--;
              logPlayerAction(actionString,"The hex pierced their reflection -"+(enemyAtkChange+1)+" ⚔️ for -"+_mgkSpent+" 🔵", colorYellow);
            } else {
              logPlayerAction(actionString,"Curse bypassed their reflection -"+enemyAtkChange+" ⚔️ for -"+_mgkSpent+" 🔵");
            }
            enemyCursed=true;
            logAction(enemyEmoji+" ▸ 😱 They got terrified and couldn't react.");
          } else if (playerMgkMax <= enemyMgk) {
            logPlayerAction(actionString,"They resisted your curse -"+_mgkSpent+" 🔵");
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
          } else {
            logPlayerAction(actionString,"Your curse had no effect on them -"+_mgkSpent+" 🔵");
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
          }
          break;

        case "Demon":
            if (_skillOK === false) {
              logPlayerAction(actionString,"Your curse has made them stronger! -"+_mgkSpent+" 🔵");
              enemyName=enemyName+" (Cursed)";
              animateUIElement(enemyInfoUIElement,"animate__tada","1");
              enemyAtkBonus+=1;
            } else if (_crit === 'success') {
              enemyStaLost = enemySta;
              enemyCursed = true;
              logPlayerAction(actionString,"The hex overwhelmed their defenses -"+_mgkSpent+" 🔵", colorYellow);
              logAction(enemyEmoji+" ▸ 😱 They got terrified and couldn't react.");
            } else {
              logPlayerAction(actionString,"The hex dissolved into them -"+_mgkSpent+" 🔵");
              displayPlayerCannotEffect();
              if (enemyCastIfMgk()) break;
              enemyAttackOrRest();
            }
            break;

        case "Standard": //Reduce enemy atk if mgk stronger then them
        case "Recruit":
        case "Swift":
        case "Heavy":
        case "Pet":
        case "Undead":
        case "Spirit":
        case "Boss":
        case "Small":
        case "Stingy":
        case "Toxic":
        case "Hot":
        case "Tough":
          if (playerMgkMax > enemyMgk && (enemyAtkBonus+enemyAtk)>0) {
            displayEnemyCannotEffect();
            displayEnemyEffect("🪬");

            if (procAbilityChance("🪆",50)){
              var animalEmoji = chooseFrom(["🐁","🦔","🐸","🦎","🐀","🪱","🪰","🪲","🪳","🐌"]);
              var _polyXP = parseInt(playerGainXP(1, GAME_CONFIG.rewardXpSmall * playerLevel, ""));
              logAction("🪆 ▸ ‍🧬 <b>Polymorphed</b> them into a critter -2 🔵 " + decorateStatusText("", "+" + _polyXP + " XP", colorGold));
              displayEnemyCannotEffect();
              displayEnemyEffect("🧬");

              enemyEmoji=animalEmoji; enemyType="Small"; encounterRenew();
              enemyHp=1; enemyAtk=1; enemyAtkBonus=0; enemySta=1; enemyLck=0; enemyInt=-1; enemyMgk=0;
              enemyMsg="They avenged getting polymorphed!";
              break;
            }

            var enemyAtkChange=Math.min(_mgkSpent-1, enemyAtk+enemyAtkBonus);
            enemyAtkBonus-=enemyAtkChange;
            if (_crit === 'success' && (enemyAtkBonus+enemyAtk) > 0) {
              enemyAtkBonus--;
              logPlayerAction(actionString,"The hex sank deep -"+(enemyAtkChange+1)+" ⚔️ weaker for -"+_mgkSpent+" 🔵", colorYellow);
            } else {
              logPlayerAction(actionString,"Cursed them -"+enemyAtkChange+" ⚔️ weaker for -"+_mgkSpent+" 🔵");
            }
            enemyCursed=true;
            logAction(enemyEmoji+" ▸ 😱 They got terrified and couldn't react.");
            break; //Enemy does not attack if  cursed
          } else if (playerMgkMax <= enemyMgk) {
            logPlayerAction(actionString,"They resisted your curse -"+_mgkSpent+" 🔵");
          } else {
            logPlayerAction(actionString,"Your curse had no effect on them -"+_mgkSpent+" 🔵");
          }
          procAbilityChance()
          if (enemyCastIfMgk()) break;
          enemyAttackOrRest();
          break;

        case "Friend": //They'll boost your stats
          if (encounterUsed) {
            logPlayerAction(actionString, getCurseNoTargetText());
            displayPlayerCannotEffect();
            break;
          }
          if (playerMgk >= enemyMgk){
            encounterUsed = true;
            var gainedXP=playerGainXP(1,GAME_CONFIG.rewardXp*playerLevel,"");
            logPlayerAction(actionString,"Forced revealed their secrets -2 🔵 "+decorateStatusText("","+"+gainedXP+" XP",colorGold));
            playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg);
          } else {
            logPlayerAction(actionString,"Could not overpower their will -2 🔵");
            displayPlayerCannotEffect();
          }
          break;

        case "Altar":
          if (_skillOK === false) {
            logPlayerAction(actionString, "The curse dissolved without reaching the gods -2 🔵");
            displayEnemyCannotEffect();
          } else {
            logPlayerAction(actionString,"Your curse has angered the gods -1 🍀");
            playerLck-=1;
            displayPlayerEffect("🪬");
          }
          break;

        case "Fishing":
          if (AchievementManager.isUnlocked('fish_boss_kill')) {
            logPlayerAction(actionString, "The depths don't answer anymore -2 🔵");
            displayEnemyEffect("🌊");
            break;
          }
          // Successful curse at a fishing spot summons the ancient water monster
          logPlayerAction(actionString, "Angered the ancient water monster! -2 🔵");
          displayEnemyEffect("🌊");
          displayPlayerEffect("🪬");
          if (typeof AchievementManager !== 'undefined') AchievementManager.check('fish_boss');
          var _fishBossEnc = getRandomEncounter(["Boss"]);
          pushEncounter(_fishBossEnc);
          nextEncounter();
          break;

        default:
          logPlayerAction(actionString,"Your curse dispersed into the area -2 🔵");
      }
      break;

      case 'button_grab': //Player vs encounter stamina decides the success

        if (enemyType=="Shop") {
          drachmaeBuy(1,"ItemCommon");
          break;
        }

        // Corpse search
        if (corpseState !== "") {
          if (corpseState === "neutralized") {
            if (corpseHasLoot && _skillOK !== false) {
              displayEnemyEffect("👋");
              logPlayerAction(actionString, getCorpseSearchLog());
              if (typeof TelemetryManager !== 'undefined') TelemetryManager.setLootSource('drop');
              pushEncounter(corpseLoot);
              corpseHasLoot=false; corpseLoot=null;
              nextEncounter();
            } else {
              wakeUpEnemy(getEnemyWakeLog());
            }
            break;
          }
          // killed
          if (corpseHasLoot) {
            displayEnemyEffect("👋");
            logPlayerAction(actionString,"Searched through the remains.");
            if (typeof TelemetryManager !== 'undefined') TelemetryManager.setLootSource('drop');
            pushEncounter(corpseLoot);
            corpseHasLoot=false; corpseLoot=null;
            nextEncounter();
          } else {
            logPlayerAction(actionString,"There is nothing interesting.");
            displayPlayerCannotEffect();
          }
          break;
        }

        switch (enemyType){
          case "Curse":
            logPlayerAction(actionString,"Hands reached forward to no effect.");
            displayPlayerCannotEffect();
            break;

          case "Dream":
            logPlayerAction(actionString, (areaName === "Shrouded Necropolis") ? "Nothing to reach for." : "Trying hard but cannot move.");
            displayPlayerCannotEffect();
            break;

          case "Memory":
            if (encounterUsed) {
              logPlayerAction(actionString, "Already given it all you had.");
              displayPlayerCannotEffect();
              break;
            }
            encounterUsed = true;
            playerLove++;
            playerKarma++;
            playerHit(1);
            logPlayerAction(actionString, "<text style=color:"+colorGold+";>Remembered something deep inside -1 💔</text>");
            displayPlayerRestedEffect();
            displayPlayerEffect("💔");
            break;

          case "Pet": //Can become pet it when the player has higher current stamina
            if ((enemySta - enemyStaLost) <= 0 && (playerSta > 0)){
              if ((enemyInt+enemyIntBonus) > playerInt) { //Cannot become a party member if it has higher int than the player
                logPlayerAction(actionString,"It sees right through you 🧠");
                displayEnemyEffect("👀");
                redraw();
                break;
              }
              if (_skillOK === false) {
                logPlayerAction(actionString, "They flinched and ran away.");
                displayEnemyEffect("💨");
                animateFlipNextEncounter();
                isFishing=false;
                break;
              }
              enemyJoinedParty();
              break;
            }

          case "Recruit": //Player vs encounter stamina - knockout, dodge or asymmetrical rest
          case "Standard":
          case "Reflective":
          case "Tough":
            if ((enemySta - enemyStaLost) <= 0 && (playerSta > 0)){ //If they are tired and player has stamina
              if (enemyType.includes("Tough")) {
                enemyAttackOrRest("Cannot grab a proper hold of them.",true);
                displayEnemyCannotEffect();
                break;
              }
              if (_skillOK === false) {
                logPlayerAction(actionString,"Reached for them, but they slipped free.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They stirred, recovering some energy.");
                break;
              }
              logPlayerAction(actionString,"Grabbed them into stranglehold -1 🟢");
              playerSta--;
              enemyKnockedOut();
              isFishing=false;
            } else if (enemySta - enemyStaLost > 0){ //Enemy resists if they have stamina
              if (_skillOK === false) {
                if (_crit === 'fail' && (enemyAtk+enemyAtkBonus) > 0) {
                  var _ctrAtk = enemyAtk + enemyAtkBonus;
                  logPlayerAction(actionString, "They reversed the grab! -"+_ctrAtk+" 💔");
                  displayEnemyEffect("💢");
                  playerHit(_ctrAtk);
                } else {
                  if (playerSta > 0) playerSta--;
                  enemyDodged("Missed, they slipped your grasp -1 🟢");
                }
                displayEnemyCannotEffect();
                if (enemyCastIfMgk()) break;
                break;
              }
              if (_crit === 'success') {
                // Guaranteed strangle, skip luck check
                logPlayerAction(actionString,"Grabbed them into stranglehold -1 🟢", colorYellow);
                if (playerSta > 0) playerSta--;
                enemyKnockedOut();
                isFishing=false;
                break;
              }
              // Regular success — luck may spook them for free, otherwise tire them
              var touchChance = Math.floor(Math.random(10) * luckInterval);
              if ( touchChance <= playerLck ){
                var gainedXP=parseInt(playerGainXP(1,0,""));
                logAction("🍀 ▸ ✋ <b>Luckily</b>, they were spooked. "+ decorateStatusText("","+"+gainedXP+" XP",colorGold));
                displayEnemyEffect("💨");
                displayPlayerEffect("🍀");
                animateFlipNextEncounter();
                isFishing=false;
                break;
              }
              if (playerSta > 0) playerSta--;
              enemyStaLost = Math.min(enemySta, enemyStaLost + 2);
              logPlayerAction(actionString,getWoreThemDownLog());
              displayEnemyCannotEffect();
              if (enemyCastIfMgk()) break;
              if ((enemySta - enemyStaLost) > 0) enemyAttackOrRest();
            } else { //Player and enemy have no stamina - kick
              if (_skillOK === false) {
                logPlayerAction(actionString,"Too exhausted to kick them.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They recovered some energy.")
                break;
              }
              enemyKicked(_crit === 'success');
              if (enemyType=="Pet"){
                var gainedXP=parseInt(playerGainXP(1,0,""));

                logAction(enemyEmoji+" ▸ 😱 They got spooked and fled! "+ decorateStatusText("","+"+gainedXP+" XP",colorGold));
                displayEnemyEffect("💨");
                animateFlipNextEncounter();
                isFishing=false;
              }
            }
            break;

          case "Swift":
            if (enemySta-enemyStaLost == 0){
              if (_skillOK === false) {
                logPlayerAction(actionString,"Too exhausted to kick them.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They recovered some energy.")
                break;
              }
              enemyKicked(_crit === 'success');
              break;
            }
            if (_skillOK === true) {
              if (playerSta > 0) playerSta--;
              if (_crit === 'success') {
                enemyStaLost = enemySta; // Fully stagger — drain all remaining energy
                logPlayerAction(actionString, "Thrown them off balance -1 🟢", colorYellow);
              } else {
                enemyStaLost = Math.min(enemySta, enemyStaLost + 2);
                logPlayerAction(actionString, "They managed to slip away -1 🟢");
              }
              displayEnemyCannotEffect();
              break;
            }
            displayEnemyEffect("🌀");
            if ((enemyAtk+enemyAtkBonus) > 0) {
              enemyAttackOrRest("They dodged that and retaliated -"+(enemyAtk+enemyAtkBonus)+" 💔");
            } else {
              enemyStaminaChangeMessage(-1, "They effortlessly dodged the grab.", "n/a");
              displayEnemyCannotEffect();
            }
            break;

          case "Heavy":
            if (enemyCastIfMgk()) break;
            if ((enemySta - enemyStaLost) <= 0) { // Tired heavy — kick them
              if (_skillOK === false) {
                logPlayerAction(actionString,"Too exhausted to kick them.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They recovered some energy.")
                break;
              }
              enemyKicked(_crit === 'success');
              break;
            }
            // Active heavy: very hard, fail enrages (+ATK)
            if (_skillOK === true) {
              if (playerSta > 0) playerSta--;
              logPlayerAction(actionString,"Managed to overpower them! -1 🟢");
              displayEnemyEffect("💢");
              enemyKnockedOut();
              isFishing=false;
            } else {
              if (_crit === 'fail') {
                enemyAtkBonus += 2;
                var _enrageAtk = enemyAtk + enemyAtkBonus;
                logPlayerAction(actionString,"Drew their full fury -"+_enrageAtk+" 💔");
              } else {
                enemyAtkBonus++;
                var _enrageAtk = enemyAtk + enemyAtkBonus;
                logPlayerAction(actionString,"Enraged them, took the hit -"+_enrageAtk+" 💔");
              }
              displayEnemyEffect("💢");
              playerHit(_enrageAtk);
            }
            break;

          case "Boss":
            if (enemyCastIfMgk()) break;
            if ((enemySta - enemyStaLost) > 0){
              if (_skillOK === true) {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString,"Managed to overpower them! -1 🟢");
                displayEnemyEffect("💢");
                enemyKnockedOut();
                isFishing=false;
              } else {
                var damageReceived=(enemyAtk+enemyAtkBonus);
                if (damageReceived>0) {
                  damageReceived += (_crit === 'fail') ? 3 : 2;
                  logPlayerAction(actionString, (_crit === 'fail')
                    ? "Completely overwhelmed! -"+damageReceived+" 💔"
                    : "Got overpowered and hit hard -"+damageReceived+" 💔");
                  playerHit(damageReceived);
                  enemyStaLost++;
                } else {
                  logPlayerAction(actionString,"They are too big to grasp!");
                  displayPlayerCannotEffect();
                }
              }
            } else { // Tired boss — kick them
              if (_skillOK === false) {
                logPlayerAction(actionString,"Too exhausted to kick them.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They recovered some energy.")
                break;
              }
              enemyKicked(_crit === 'success');
            }
            break;

          case "Trap-Obstacle": //Removes from the way
            if (_skillOK === false) {
              if (_crit === 'fail') {
                logPlayerAction(actionString,"So clumsy you hurt yourself -1 💔");
                playerHit(1, false);
              } else {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString,"Tried but couldn't shift it -1 🟢");
                displayPlayerCannotEffect();
              }
              break;
            }
            if (_crit === 'success') {
              logPlayerAction(actionString,"Cleared the way without a flinch.", colorYellow);
            } else {
              if (playerSta > 0) playerSta--;
              logPlayerAction(actionString,"Cleared the way forward -1 🟢");
            }
            nextEncounter();
            break;

          case "Trap-Attack":
            if (totalBonus > 0) {
              displayEnemyCannotEffect();
              logPlayerAction(actionString,"Touched it, nothing happened.");
              break;
            }
            if (_skillOK === false) {
              if (_crit === 'fail' && !encounterUsed) {
                // Fumbled in — trigger the trap and take extra damage
                if (enemyHp<=0) playerHpMax-=enemyHp;
                if (enemySta<=0) playerStaMax-=enemySta;
                playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, "Fumbled right into it.",true,false);
                playerHit(1, false);
                if (enemyHp < 0 && playerHp > 0) AchievementManager.check('survive_trap');
              } else {
                logPlayerAction(actionString,"Pulled back just in time.");
                displayPlayerCannotEffect();
              }
              break;
            }
            // Grab success: trigger the trap, spend 1 STA unless crit pass
            if (encounterUsed) { logPlayerAction(actionString,getEncounterUsedMessage()); displayPlayerCannotEffect(); break; }
            if (_crit !== 'success' && playerSta > 0) playerSta--;
            if (totalBonus<=0 && totalMalus>=0) displayPlayerCannotEffect();
            if (enemyHp<=0) playerHpMax-=enemyHp;
            if (enemySta<=0) playerStaMax-=enemySta;
            playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg,true,false);
            if (enemyHp < 0 && playerHp > 0) AchievementManager.check('survive_trap');
            break;

          case "Trap": //Grabbing triggers the effect
          case "Trap-Big":
          case "Trap-Roll":
            if (encounterUsed){
                logPlayerAction(actionString,getEncounterUsedMessage())
                displayPlayerCannotEffect();
                break;
            }

            if (totalBonus > 0) {
              if (_skillOK === false) {
                if (_crit === 'fail') {
                  playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Terrible form — you set yourself back.", true, false);
                } else {
                  logPlayerAction(actionString, "Poor form, gained nothing -1 🟢");
                }
                displayPlayerCannotEffect();
                break;
              }
              encounterUsed = true;
            }

            if (totalBonus<=0 && totalMalus>=0) displayPlayerCannotEffect();

            if (enemyHp<=0) playerHpMax-=enemyHp; //Don't lose max hp
            if (enemySta<=0) playerStaMax-=enemySta; //Don't lose max sta
            playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg,true,false);
            if (enemyHp < 0 && playerHp > 0) AchievementManager.check('survive_trap');
            break;

          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Undead": //Grabbing is not safe
            if (enemyCastIfMgk()) break;
            var grabDmg=enemyAtk;
            if (grabDmg==0) grabDmg=1;

            var dmgMsg="Ouch, that hurt pretty bad";
            if (enemyType=="Toxic" || enemyType=="Undead") dmgMsg="Oof, that was really nasty";
            if (enemyMsg!="") dmgMsg=enemyMsg.replace(".","");
            logPlayerAction(actionString,dmgMsg+" -"+grabDmg+" 💔");
            playerHit(grabDmg,true,true);
            displayEnemyEffect("✋");
            break;

          case "Item":
            displayEnemyEffect("👋");

            if (_skillOK === false) {
              logPlayerAction(actionString, "Stumbled and shattered it to pieces.");
              displayEnemyCannotEffect();
              isFishing=false;
              nextEncounter();
              break;
            }

            if (enemyEmoji=="⚖️"){
              var halfHp = Math.floor(playerHpMax/2);
              if (halfHp == 0) {
                logPlayerAction(actionString,"Not enough <b>❤️ Health</b> available.");
                displayPlayerCannotEffect();
                break;
              }
              playerHpMax-=halfHp;
              playerAtk+=halfHp;
              if (playerHp>playerHpMax) playerHp=playerHpMax;
              displayPlayerEffect("💢");
              //playerHit(halfHp,false,true);
            }

            if (enemyEmoji=="UNASSIGNED"){ //TODO Was 🍭, needs replacement
              var halfSta = Math.floor(playerStaMax/2);
              if (halfSta == 0) {
                logPlayerAction(actionString,"Not enough <b>🟢 Energy</b> available.");
                displayPlayerCannotEffect();
                break;
              }
              playerSta=parseInt(playerSta)-halfSta;
              playerStaMax=parseInt(playerStaMax)-halfSta;
              playerMgkMax=parseInt(playerMgkMax)+halfSta;
              playerMgk=parseInt(playerMgk)+halfSta;
            }

            if (enemyEmoji=="🧪"){
              displayPlayerEffect("🌪️");
              var polymorph = chooseFrom(["🗿","🥨","🪰","🦎","🐸","🐁","🐷","🦍","😾","🧞‍♂️","👽","🎃","🪽"]);
              switch (polymorph) {

                case "🦍":
                  playerAtk+=1;
                  playerName="Muscular Ape"
                  enemyMsg="Turned into "+polymorph+" <b>Muscular Ape</b> +1 ⚔️";
                  break;

                case "😾":
                  playerAtk+=2;
                  playerName="Bipedal Feline"
                  enemyMsg="Turned into "+polymorph+" <b>Bipedal Feline</b> +2 ⚔️";
                  break;

                case "🪽":
                  playerSta+=3; playerStaMax+=3;
                  playerName="Winged Hybrid"
                  enemyMsg="Turned into "+polymorph+" <b>"+playerName+"</b> +3 🟢";
                  break;

                case "🧞‍♂️":
                  playerMgk=+3; playerMgkMax=+3;
                  playerName="Blueskin Genie"
                  enemyMsg="Morphed into "+polymorph+" <b>Blueskin Genie</b> +3 🔵";
                  break;

                case "👽":
                  playerName="Ancient Alien"
                  enemyMsg="Turned into "+polymorph+" <b>Ancient Alien</b> +4 🧠";
                  playerInt+=4;
                  break;

                case "🎃":
                  playerName="Hollow Giant"
                  enemyMsg="Turned into "+polymorph+" <b>"+playerName+"</b> +3 ❤️";
                  playerHp+=3; playerHpMax+=3;
                  break;

                case "🐷":
                  playerName="Pighead Hybrid"
                  enemyMsg="Turned into "+polymorph+" <b>Pighead Hybrid</b> -4 🧠";
                  playerInt-=4;
                  break;

                case "🗿":
                  playerName="Petrified Stone"
                  enemyMsg="Turned into "+polymorph+" <b>Petrified Stone</b>";
                  playerHp=0;
                  playerHit(0,false);
                  break;

                case "🥨":
                  playerName="Stale Pretzel"
                  enemyMsg="Turned into "+polymorph+" <b>"+playerName+"</b>";
                  playerHp=0;
                  playerHit(0,false);
                  break;

                default:
                  playerName="Harmless Vermin"
                  enemyMsg="Morphed into "+polymorph+" <b>Harmless Vermin</b> ⇣🔻";
                  playerHp=1; playerHpMax=1;
                  playerSta=2; playerStaMax=2;
                  playerMgk=0; playerMgkMax=0;
                  playerAtk=0;
              }

              playerName=playerName;
              playerEmoji=polymorph;
              displayPlayerCannotEffect();
              playerRest(true);
            }

            // ── Slot equip/swap ───────────────────────────────────────────────
            var _equipSlot = enemyItemSlot;
            if (_equipSlot) {
              var _oldSlotData = getPlayerSlot(_equipSlot);
              if (_oldSlotData) {
                InventoryManager.tryEquip(_equipSlot, _oldSlotData, buildItemSnapshot(), isFishing);
                break;
              }
            }
            // ─────────────────────────────────────────────────────────────────

            if (!enemyTeam.includes("Lover's Memento") && !enemyTeam.includes("Piece of History")) { //Add to loot
              if (enemyEmoji!="🪙" && enemyEmoji!="💰") playerLootString+=enemyEmoji;
              if (enemyEmoji=="👺" || enemyEmoji=="🐴" || enemyEmoji=="🐷") {
                playerEmoji = enemyEmoji;
              }
              displayPlayerGainedEffect();
            } else {
              playerLootString+=enemyEmoji; //Hmm add to loot anyway
              playerKarma++;
              playerLove++;
              AchievementManager.check('letter_grab');
              enemyMsg="<text style=color:"+colorGold+";>You just had to take it with yourself.</text>";
            }

            if (enemyEmoji=="🪙"){
              if (enemyName.includes("Lucky")) {
                spentCoins-=2; //Temporary coin for this run only, not persistent
              } else {
                if (savedCoins==0) curtainFadeInAndOut("<p style=\"color:"+colorLightShadeBlue+";-webkit-text-stroke: 6.5px black;paint-order: stroke fill;letter-spacing:1.8px;line-height:20px;font-size:42px;\">Drachma claimed!</p><p style=\"font-size:20px;\""+decorateStatusText("","Returns on death to shape your fate.",colorWhite),6);
                savedCoins+=1;
                localStorage.setItem('coins', parseInt(savedCoins));
                AchievementManager.check('coin_pickup', savedCoins);
              }
              displayPlayerEffect("🪙");
            }

            if (enemyEmoji=="💰"){
              var coinNumber=randomNumber(2,5);
              savedCoins+=coinNumber;
              displayPlayerEffect("🪙");
              localStorage.setItem('coins', parseInt(savedCoins));
              enemyMsg="Claimed <b>Ethereal Drachmae +"+coinNumber+" 🪙</b>";
              AchievementManager.check('coin_pickup', savedCoins);
            }

            //Grab end
            // Snapshot BEFORE playerChangeStats — it calls nextEncounter() which resets all enemy globals.
            // Slot and inventory must also be committed before playerChangeStats, because nextEncounter →
            // loadEncounter is where the NEXT encounter's swap diff log fires. If the slot isn't set yet,
            // an immediately-following slot item would show no diff.
            var _grabSnap = buildItemSnapshot();
            if (_equipSlot) {
              setPlayerSlot(_equipSlot, _grabSnap);
              playerInventory.push(_grabSnap);
            } else if (_grabSnap.emoji !== '🪙' && _grabSnap.emoji !== '💰' &&
                       !_grabSnap.note.includes("Lover's Memento") && !_grabSnap.note.includes("Piece of History")) {
              playerInventory.push(_grabSnap);
            }
            AchievementManager.checkGrabAchievement(_grabSnap);
            var _wasInFishing = isFishing;
            isFishing=false;
            if (playerHp==0) break;
            var _savedRested = _wasInFishing ? playerRested : false;
            playerChangeStats(enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef,enemyMsg);
            if (_wasInFishing) playerRested = _savedRested;
            break;

          case "Small":
            var _sEStaStart = Math.max(0, (enemySta || 0) - (enemyStaLost || 0));
            if (_skillOK === false) {
              if (_crit === 'fail') {
                playerSta = Math.max(0, playerSta - 2);
                logPlayerAction(actionString, "Lost your grip and stumbled -2 🟢");
              } else {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString, "Slipped through your fingers -1 🟢");
              }
              displayEnemyCannotEffect();
              if (enemyCastIfMgk()) break;
              if ((enemySta - enemyStaLost) > 0) enemyAttackOrRest();
              break;
            }
            if (_sEStaStart > 0) {
              if (_crit === 'success') {
                if (playerSta > 0) playerSta--;
                enemyGrabbedIntoLoot("Snatched it flawlessly -1 🟢", colorYellow);
                break;
              }
              // Regular pass with stamina — tire them, not pocketed yet
              if (playerSta > 0) playerSta--;
              enemyStaLost = Math.min(enemySta, enemyStaLost + 2);
              logPlayerAction(actionString, "Got a hold of it, not firmly -1 🟢");
              displayEnemyCannotEffect();
              if (enemyCastIfMgk()) break;
              if ((enemySta - enemyStaLost) > 0) enemyAttackOrRest();
            } else {
              // No stamina remaining — regular pass pockets them
              if (playerSta > 0) playerSta--;
              enemyGrabbedIntoLoot();
            }
            break;

          case "Friend":
            if (encounterUsed) {
              logPlayerAction(actionString, "They have nothing more to offer.");
              displayPlayerCannotEffect();
              isFishing=false;
              break;
            }
            if ((enemyName.includes("Bride")||enemyName.includes("Lethargic")) && playerLove>2){
              var _comfortXP = parseInt(playerGainXP(1, GAME_CONFIG.rewardXpSmall * playerLevel, ""));
              logPlayerAction(actionString, "Your touch has provided her comfort. " + decorateStatusText("", "+" + _comfortXP + " XP", colorGold));
            } else {
              logPlayerAction(actionString,"Your touch was not appreciated.");
            }
            displayEnemyEffect("✋");
            isFishing=false;
            nextEncounter();
            break;

          case "Consumable":
            if (_skillOK === false) {
              logPlayerAction(actionString, "Oops, slammed it to the ground.");
              displayEnemyCannotEffect();
              isFishing=false;
              nextEncounter();
              break;
            }
            playerConsumed();
            AchievementManager.checkEatAchievement(
              { atk: enemyAtk||0, mgk: enemyMgk||0, hp: enemyHp||0,
                sta: enemySta||0, lck: enemyLck||0, int: enemyInt||0, def: enemyDef||0 },
              enemyTeam
            );
            displayEnemyEffect("🍴");
            if (playerHp>0) nextEncounter();
            isFishing=false;
            break;

          case "Fishing":
            if (playerSta > 0) playerSta--;
            var bait=checkPlayerHasItem(validBaits);
            if (_skillOK === false) {
              if (_crit === 'fail' && bait !== "") {
                playerUseItem(bait, "Hook snagged — lost " + bait + " -1 🟢", "");
              } else {
                displayPlayerCannotEffect();
                logPlayerAction(actionString, bait !== "" ? "The fish slipped off the hook -1 🟢" : (playerSta <= 0 ? "Too tired to focus on the hook -1 🟢" : "Nothing bit the empty hook -1 🟢"));
              }
              break;
            }
            if (bait !== "") {
              AchievementManager.check('fish_bait');
              playerUseItem(bait,"Fished out something using "+bait+decorateStatusText(""," +"+(GAME_CONFIG.rewardXpSmall*playerLevel)+" XP",colorGold),"");
              playerGainXP(1,GAME_CONFIG.rewardXpSmall*playerLevel,"");
              if (procAbilityChance("🧵",50)) {
                logAction("🧵 ▸ "+bait+" Luckily the bait remained hooked.");
                displayPlayerEffect("🧵");
                playerLootString+=bait;
              }
            } else {
              AchievementManager.check('fish_no_bait');
              playerGainXP(1,GAME_CONFIG.rewardXpSmall*playerLevel,"");
              logPlayerAction(actionString,"Caught something without bait"+decorateStatusText(""," +"+(GAME_CONFIG.rewardXpSmall*playerLevel)+" XP",colorGold));
            }
            displayEnemyEffect("🪝");
            playerFishCatches++;
            getRandomFish(_crit === 'success' ? getArtifactLootIndex() : undefined);
            break;

          case "Demon":
            if ((enemySta - enemyStaLost) <= 0 && (playerSta > 0)) {
              logPlayerAction(actionString,"Grabbed them into stranglehold -1 🟢");
              if (playerSta > 0) playerSta--;
              enemyKnockedOut();
              isFishing=false;
            } else if (enemySta - enemyStaLost > 0) {
              if (_skillOK === false) {
                if (playerSta > 0) playerSta--;
                logPlayerAction(actionString,"Missed, they are faster than expected -1 🟢");
                displayEnemyEffect("🌀");
                if (enemyCastIfMgk()) break;
                enemyAttackOrRest();
                break;
              }
              logPlayerAction(actionString,"Grabbed them into stranglehold -1 🟢");
              if (playerSta > 0) playerSta--;
              enemyKnockedOut();
              isFishing=false;
            } else { // Both tired — kick
              if (_skillOK === false) {
                logPlayerAction(actionString,"Too exhausted to kick them.");
                displayPlayerCannotEffect();
                enemyAttackOrRest("They recovered some energy.")
                break;
              }
              enemyKicked(_crit === 'success');
            }
            break;

          case "Spirit":
            logPlayerAction(actionString,"Missed, they seem untouchable.");
            displayEnemyEffect("🌀");
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;

          case "Death":
            logPlayerAction(actionString,"Peeked at IGPenguin to say hi!");
            visitLinkedIn();
            break;

          case "Upgrade":
            playerFishSkillBonus++;
            logPlayerAction(actionString,"Sharpened the craft. <b>+1 🎣 Fishing</b>");
            displayPlayerGainedEffect();
            displayPlayerEffect("🎣");
            isFishing=false;
            animateFlipNextEncounter();
            break;

          case "Checkpoint": //LVL UP
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
              break;
            }
            encounterUsed = true;
            playerXP+=playerXPThreshold;
            isFishing=false;
            logPlayerAction(actionString,"Praised the <b>"+enemyName+"</b>!")
            playerRest(true);
            encounterIndex++;
            break;

          default:
            if (enemyType.includes("Container")){
              if (enemyType.includes("Locked")){
                if (playerLootString.includes("🗝️")){
                  if (_skillOK === false && Math.random() < 0.25) {
                    playerLootString = playerLootString.replace("🗝️","");
                    displayPlayerEffect("🗝️");
                    displayEnemyCannotEffect();
                    logPlayerAction(actionString,"Key snapped in the lock and was lost.");
                  } else {
                    playerUseItem("🗝️","Unlocked it with a key "+decorateStatusText("","+"+(GAME_CONFIG.rewardXp*playerLevel)+" XP",colorGold),"Cannot open, it is locked tight.",false);
                    playerGainXP(1,GAME_CONFIG.rewardXp*playerLevel,"");
                    AchievementManager.check('key_unlock_first');
                    enemyType=enemyType.replace("Locked-","");
                    enemyHp=0;
                    enemyMsg="Uncovered what was locked inside.";
                    redraw();
                  }
                  break;
                } else if (playerLootString.includes("📎")) {
                  logPlayerAction(actionString,"Unlocked with <b>📎 Universal Key</b> "+decorateStatusText("","+"+(GAME_CONFIG.rewardXp*playerLevel)+" XP",colorGold))
                  playerGainXP(1,GAME_CONFIG.rewardXp*playerLevel,"");
                  AchievementManager.check('key_unlock_first');
                  enemyType=enemyType.replace("Locked-","");
                  enemyHp=0;
                  enemyMsg="Uncovered what was locked inside.";
                  redraw();
                } else {
                  logPlayerAction(actionString, "Cannot get inside, it's locked.");
                  displayEnemyCannotEffect();
                }
                break;
              }
              if (_skillOK === false) {
                logPlayerAction(actionString, "Failed to find anything of value.");
                encounterIndex+=enemyContainerNumber;
                displayEnemyCannotEffect();
                isFishing=false;
                nextEncounter();
                break;
              }
              var openMessage = "Sucessfully found something.";
              displayEnemyEffect("👋");
              if (enemyMsg != ""){
                openMessage = enemyMsg;
              }
              if (totalBonus>0 || totalMalus<0) {
                playerConsumed();
              } else {
                logPlayerAction(actionString,openMessage);
              }
              if (playerHp>0) nextEncounter();
              break;
            }

            if (enemyType === "Prop") {
              if (enemyEmoji.includes("🌿")) AchievementManager.check('touch_grass');
              if (encounterUsed) {
                logPlayerAction(actionString, getEncounterUsedMessage());
                displayPlayerCannotEffect();
              } else {
                encounterUsed = true;
                logPlayerAction(actionString, "Touched it, nothing happened.");
                displayEnemyCannotEffect();
                displayEnemyEffect("✋");
              }
              break;
            }
            logPlayerAction(actionString,"Touched it, nothing happened.");
            displayEnemyCannotEffect();
            displayEnemyEffect("✋");
          }
        break;

      case 'button_speak':
        if (enemyType!="Dream" && enemyType!="Death") displayPlayerEffect("💬");

        if (enemyType=="Shop") {
          drachmaeBuy(3,"ItemRare");
          displayPlayerEffect("");
          break;
        }

        var convinceInt=playerInt;
        if (playerLootString.includes("📣")) {
          displayPlayerEffect("📣");
          convinceInt=playerInt*2;
        }
        if (_crit === 'success') convinceInt += 2;
        else if (!_skillOK && _crit === 'fail') convinceInt -= 2;

        // Gibberish: action-bar failure + low INT = player fumbles their words
        // Chance: 90% at INT 0, ~0% at INT 7+; skips special non-combat encounter types
        if (_skillOK === false) {
          var _noGibberishTypes = /Upgrade|Death|Dream|Altar|Shop|Curse|Memory|Mirror/.test(enemyType);
          var _gibberishChance = Math.min(1, Math.max(0, 0.9 - convinceInt * 0.12));
          if (!_noGibberishTypes && Math.random() < _gibberishChance) {
            logPlayerAction(actionString, (_crit === 'fail') ? "Your words came out all wrong." : "It came out as gibberish.");
            displayPlayerCannotEffect();
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;
          }
        }

        switch (enemyType){
          case "Mirror": {
            isFishing = false;
            if (encounterUsed) { logPlayerAction(actionString, "Nothing more to say to it."); displayPlayerCannotEffect(); break; }
            var _mc = (typeof _MIRROR_CONFIG !== 'undefined') ? _MIRROR_CONFIG[enemyName] : null;
            if (!_mc) { displayPlayerCannotEffect(); nextEncounter(); break; }
            var _isShade = (enemyEmoji === '👤');
            var _delta   = _isShade ? 2 : 1;
            var _pools   = _isShade ? { cp: _MIRROR_SHADE_SPEAK_CRIT_PASS, p: _MIRROR_SHADE_SPEAK_PASS, f: _MIRROR_SHADE_SPEAK_FAIL, cf: _MIRROR_SHADE_SPEAK_CRIT_FAIL }
                                    : { cp: _MIRROR_SPEAK_CRIT_PASS,       p: _MIRROR_SPEAK_PASS,       f: _MIRROR_SPEAK_FAIL,       cf: _MIRROR_SPEAK_CRIT_FAIL };
            var _lbl = _mc.label, _ico = _mc.emoji;
            if (_crit === 'success') {
              if (_lbl === 'Karma') playerKarma += _delta; else if (_lbl === 'Love') playerLove += _delta;
              else if (_lbl === 'Luck') playerLck += _delta; else playerInt += _delta;
              logPlayerAction(actionString, chooseFrom(_pools.cp[_lbl]) + ' +' + _delta + ' ' + _ico, colorYellow);
              displayPlayerGainedEffect(); displayEnemyCannotEffect();
            } else if (_skillOK) {
              logPlayerAction(actionString, chooseFrom(_pools.p[_lbl]));
              displayEnemyCannotEffect();
            } else if (_crit === 'fail') {
              if (_lbl === 'Karma') playerKarma -= _delta; else if (_lbl === 'Love') playerLove -= _delta;
              else if (_lbl === 'Luck') playerLck -= _delta; else playerInt -= _delta;
              logPlayerAction(actionString, chooseFrom(_pools.cf[_lbl]) + ' -' + _delta + ' ' + _ico);
              displayPlayerCannotEffect(); displayEnemyEffect("💢");
            } else {
              logPlayerAction(actionString, chooseFrom(_pools.f[_lbl]));
              displayPlayerCannotEffect();
            }
            encounterUsed = true;
            enemyDesc = getMirrorDesc(enemyName);
            redraw();
            break;
          }

          case "Altar": // Speak button is rebound to Pray on Altars
            displayPlayerEffect("🙏");
            var isSacrifice = (enemyHp < 0);
            if (isSacrifice) {
              displayEnemyEffect("🩸");
              playerHit(1, false, true);
              if (encounterUsed) {
                logPlayerAction(actionString, "Your sacrifice had no effect -1 💔");
                displayPlayerCannotEffect();
                break;
              }
              playerChangeStats(0, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg, true, false);
              playerGainXP(1, GAME_CONFIG.rewardXpSmall * playerLevel, "");
              isFishing = false;
              encounterUsed = true;
            } else {
              if (encounterUsed) {
                logPlayerAction(actionString, getPrayNoTargetText());
                displayPlayerEffect("🤲");
                displayPlayerCannotEffect();
                break;
              }
              if (_skillOK === false) {
                isFishing = false;
                encounterUsed = true;
                if (_crit === 'fail') {
                  displayPlayerCannotEffect();
                  displayEnemyEffect("⚡️");
                  playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Angered the mighty spirits!", true, false);
                } else {
                  logPlayerAction(actionString, "Your prayer went unanswered.");
                  displayPlayerCannotEffect();
                }
                break;
              }
              if (_crit === 'success') {
                playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck + 1, enemyInt, enemyMgk, enemyDef, enemyMsg || "Prayer answered", true, false);
              } else {
                playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, enemyMsg, true, false);
              }
              displayPlayerEffect("✨");
              displayPlayerGainedEffect();
              displayEnemyCannotEffect();
              isFishing = false;
              encounterUsed = true;
            }
            break;

          case "Pet":
            if (enemyInt === -1) {
              logPlayerAction(actionString, "They cannot comprehend any words.");
              displayPlayerCannotEffect();
              if (enemyCastIfMgk()) break;
              enemyAttackOrRest();
              break;
            }
            if (convinceInt >= enemyInt) {
              if (_skillOK === false) {
                logPlayerAction(actionString, "They flinched and bolted.");
                displayEnemyEffect("💨");
                animateFlipNextEncounter();
                isFishing = false;
                break;
              }
              // crit success and regular pass both tame; enemyJoinedParty handles XP
              enemyJoinedParty();
              break;
            } else if ((enemyInt > (convinceInt + 2)) && enemyAtkBonus <= 3) {
              if (_crit === 'success') {
                var gainedXP = parseInt(playerGainXP(1, 0, ""));
                logAction(enemyEmoji + " ▸ 😱 Startled them into fleeing! " + decorateStatusText("", "+" + gainedXP + " XP", colorGold));
                displayEnemyEffect("💨");
                animateFlipNextEncounter();
                isFishing = false;
                break;
              }
              logPlayerAction(actionString, "They got more agitated +1 ⚔️");
              enemyAtkBonus += 1;
            } else {
              if (_crit === 'success') {
                logAction("💬 ▸ " + enemyEmoji + " You convinced it to flee.");
                nextEncounter();
                break;
              }
              var _petSpeechChance = Math.floor(Math.random() * luckInterval);
              if (_petSpeechChance <= playerLck) {
                logAction("🍀 ▸ 💬 They relaxed and wandered off.");
                nextEncounter();
                break;
              } else {
                logPlayerAction(actionString, "They paid you no attention.");
              }
            }
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;

          case "Recruit": //If you are smarter they join you
            if (enemyInt < convinceInt){
              if (_skillOK === false) {
                logPlayerAction(actionString,"They hesitated and walked away.");
                animateFlipNextEncounter();
                isFishing=false;
                break;
              }
              var _rEmoji=enemyEmoji, _rAtk=enemyAtk, _rLck=enemyLck, _rMgk=enemyMgk;
              var _rActionStr=actionString;
              showCompanionNameDialog('follower', getRandomFollowerName(), function(chosenName) {
                followerName[_rEmoji] = chosenName;
                displayPlayerEffect(_rEmoji);
                playerPartyString += _rEmoji;
                var gainedXP=playerGainXP(1.5,0,"");
                var joinMsg="<b>"+chosenName+"</b> joined your cause!";
                var statMsg=playerChangeStats(0, _rAtk, 0, _rLck, 0, _rMgk, 0, joinMsg, false, true, _rActionStr);
                logPlayerAction(_rActionStr, statMsg+decorateStatusText(""," +"+gainedXP+" XP",colorGold));
                AchievementManager.check('get_recruit');
                if (countEmoji(playerPartyString) >= 3) AchievementManager.check('full_party');
              });
              break;
            }

          case "Standard": //If they are dumber they will walk away
          case "Swift":
          case "Heavy":
          case "Spirit":
          case "Demon":
          case "Boss":
          case "Small":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
          case "Reflective":
            var maxEnemyAngryBoost=3;

            if (enemyInt==-1) {
              logPlayerAction(actionString,"They cannot comprehend any words.");
              displayPlayerEffect("💬");
              if (enemyCastIfMgk()) break;
              enemyAttackOrRest();
              break;
            }

            if (enemyInt < convinceInt){
              if ((enemyAtk+enemyAtkBonus)>0){
                enemyAtkBonus--;
                logPlayerAction(actionString, (_crit === 'success') ? "Found the right words -1 ⚔️" : "Managed to calm them down -1 ⚔️", _crit === 'success' ? colorYellow : "#FFF");
                if ((enemyAtk+enemyAtkBonus)>0) {
                  enemyAttackOrRest();
                } else {
                  AchievementManager.check('calm_enemy');
                  if (enemyType === 'Boss') AchievementManager.check('calm_boss');
                  if (enemyType === 'Demon') AchievementManager.check('calm_demon');
                }
                displayEnemyCannotEffect();
              } else if (enemyAtk>0){
                AchievementManager.check('calm_enemy');
                if (enemyType === 'Boss') AchievementManager.check('calm_boss');
                if (enemyType === 'Demon') AchievementManager.check('calm_demon');
                enemyDisengage(_crit === 'success');
              } else {
                if (playerUseItem("🏳️","n/a","n/a",true,true)) {playerWaive(); break;}
                logPlayerAction(actionString,"They do not seem to care at all.")
                displayPlayerCannotEffect();
              }
              break;
            } else if ((enemyInt > (convinceInt+2)) && enemyAtkBonus <= maxEnemyAngryBoost) {
              if (playerUseItem("🏳️","n/a","n/a",true,true)) {playerWaive(); break;}
              logPlayerAction(actionString, (!_skillOK && _crit === 'fail') ? "Your fumbled words enraged them +1 ⚔️" : "They got more angry +1 ⚔️");
              enemyAtkBonus+=1;
            } else {
              var speechChance = Math.floor(Math.random() * luckInterval);
              if ( speechChance <= playerLck ){
                var _luckXP = parseInt(playerGainXP(1, GAME_CONFIG.rewardXpSmall * playerLevel, ""));
                logAction("🍀 ▸ 💬 They believed your lies and left." + decorateStatusText("", " +" + _luckXP + " XP", colorGold));
                nextEncounter();
                break;
              } else {
                if (playerUseItem("🏳️","n/a","n/a",true,true)) {playerWaive(); break;}
                logPlayerAction(actionString, (!_skillOK && _crit === 'fail') ? "Your words fell flat, ignored." : "They ignored whatever you said.");
              }
            }
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;

          case "Undead": //They don't care
            logPlayerAction(actionString,"They cannot comprehend any words.");
            if (enemyCastIfMgk()) break;
            enemyAttackOrRest();
            break;

          case "Friend": //They'll boost your stats
            var heldQuestItem=checkPlayerHasItem(enemyQuestItems);
            var _qualifies = heldQuestItem !== "" || (String(enemyQuestItems) === "" && convinceInt >= enemyInt);
            // encounterUsed + qualifies = reward already given; encounterUsed alone = fail-retry in progress
            if (encounterUsed && _qualifies) {
              logPlayerAction(actionString, "They have nothing more to offer.");
              displayPlayerCannotEffect();
              break;
            }
            if (_qualifies) {
              encounterUsed = true;
              if (String(enemyQuestItems).length>=1) { //Quest rewards
                //This means filter by two = guarantee artifact
                pushEncounter(getRandomEncounter(["Item"],["Artifact"]));
                playerLootString=playerLootString.replace(heldQuestItem,"");
                displayPlayerEffect(heldQuestItem);
                AchievementManager.check('quest_complete');
              }
              var gainedXP=playerGainXP(_crit === 'success' ? 1.2 : 1, GAME_CONFIG.rewardXp*playerLevel,"");
              var _friendMsg = (_crit === 'success' ? "Spoke with great conviction!" : enemyMsg) + " " + decorateStatusText("","+"+gainedXP+" XP",colorGold);
              if (enemyHp+enemyAtk+enemySta+enemyLck+enemyInt+enemyMgk+enemyDef == 0) {
                logPlayerAction(actionString, _friendMsg, _crit === 'success' ? colorYellow : undefined);
                nextEncounter();
                isFishing=false;
              } else {
                playerChangeStats(enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef,_friendMsg,true);
                isFishing=false;
                displayPlayerEffect("✨");
              }
              break;
            }

            // Bar-driven: crit fail = turns adversary, fail once = retry, fail twice = leaves
            if (_crit === 'fail') {
              enemyTurnAggressive("Your words provoked them into a fight!");
              break;
            }
            if (_skillOK === false) {
              if (encounterUsed) {
                logPlayerAction(actionString, "They lost patience and walked away.");
                isFishing=false;
                nextEncounter();
              } else {
                encounterUsed = true;
                logPlayerAction(actionString, "They seem unconvinced, yet?");
                displayPlayerCannotEffect();
                if (enemyCastIfMgk()) break;
                enemyAttackOrRest();
              }
              break;
            }

            if (String(enemyQuestItems)!=""){
              logPlayerAction(actionString,"Bring me: "+String(enemyQuestItems).replaceAll(","," "));
            } else {
              logPlayerAction(actionString,"You don't meet their standards 🧠");
              redraw();
            }
            displayPlayerCannotEffect();
            break;

          case "Death":  
            logPlayerAction(actionString,"Shared Stay Dead with others!");  
            showSharePopup();   
            break;

          case "Dream":
            displayPlayerCannotEffect();
            var msg = (areaName === "Shrouded Necropolis") ? "Your calling remains unanswered." : "Cannot speak while asleep.";
            if (enemyName.includes("Regrets")) msg="Your throat shakes as you sigh."
            logPlayerAction(actionString,msg);
            break;

          case "Upgrade":
            playerLove++;
            logPlayerAction(actionString,"<text style=color:"+colorRed+";>"+getRememberLog()+"</text>");
            displayPlayerRestedEffect();
            displayPlayerEffect("💭");
            isFishing=false;
            animateFlipNextEncounter();
            break;

          case "Memory":
            isFishing = false;
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
              break;
            }
            encounterUsed = true;
            if (_crit === 'success') {
              playerLove++;
              playerKarma++;
              displayPlayerRestedEffect();
              displayPlayerEffect("💖");
              logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallCritPassText() + "</text>");
            } else if (_crit === 'fail') {
              playerLove -= 2;
              displayPlayerEffect("💔");
              logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallCritFailText() + "</text>");
            } else if (_skillOK === false) {
              logPlayerAction(actionString, getRecallFailText());
              displayPlayerCannotEffect();
            } else {
              playerKarma++;
              playerLove++;
              playerHit(1);
              displayPlayerRestedEffect();
              displayPlayerEffect("💔");
              logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallPassText() + "</text>");
            }
            break;

          case "Item":
            if (encounterUsed) {
              logPlayerAction(actionString,"It doesn't cause you any new feelings.");
              displayPlayerCannotEffect();
              break;
            }

            if (enemyTeam.includes("Lover's Memento") || enemyTeam.includes("Piece of History")){
              isFishing = false;
              encounterUsed = true;
              AchievementManager.check('letter_remember');
              if (_crit === 'success') {
                playerLove++;
                playerKarma++;
                displayPlayerRestedEffect();
                displayPlayerEffect("💖");
                logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallCritPassText() + "</text>");
              } else if (_crit === 'fail') {
                playerLove -= 2;
                displayPlayerEffect("💔");
                logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallCritFailText() + "</text>");
              } else if (_skillOK === false) {
                logPlayerAction(actionString, getRecallFailText());
                displayPlayerCannotEffect();
              } else {
                playerKarma++;
                playerLove++;
                displayPlayerRestedEffect();
                displayPlayerEffect("💔");
                logPlayerAction(actionString, "<text style=color:"+colorRed+";>" + getRecallPassText() + "</text>");
                playerHit(1);
              }
              break;
            }

          case "Curse":
            isFishing = false;
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
              break;
            }
            if (_skillOK) {
              encounterUsed = true;
              var _cxp = parseInt(playerGainXP(_crit === 'success' ? 1.2 : 1, GAME_CONFIG.rewardXpSmall * playerLevel, ""));
              logPlayerAction(actionString,
                (_crit === 'success' ? getSpeakCurseCritPassText() : getSpeakCursePassText()) + " " + decorateStatusText("", "+" + _cxp + " XP", colorGold));
              displayEnemyCannotEffect();
              displayPlayerEffect("✨");
              nextEncounter();
            } else if (_crit === 'fail') {
              encounterUsed = true;
              playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk, enemyDef, getSpeakCurseCritFailText(), true, false);
              displayPlayerCannotEffect();
            } else {
              logPlayerAction(actionString, getSpeakCurseFailText());
              displayPlayerCannotEffect();
            }
            break;

          case "Prop":
            if (encounterUsed) {
              logPlayerAction(actionString, getEncounterUsedMessage());
              displayPlayerCannotEffect();
            } else {
              encounterUsed = true;
              logPlayerAction(actionString, getSpeakDefaultLog());
              displayPlayerCannotEffect();
              displayPlayerEffect("💬");
            }
            break;

          default:
            logPlayerAction(actionString, getSpeakDefaultLog());
            displayPlayerCannotEffect();
            displayPlayerEffect("💬");
        }
        break;

      case 'button_sleep':

        if (enemyType=="Shop") {
          drachmaeBuy(2,"ItemUncommon");
          break;
        }

        // Corpse rest — honor fishing restriction; killed acts as Prop (crit +1 sta); neutralized wakes them
        if (corpseState !== "") {
          if (fishingRested) {
            logPlayerAction(actionString,"Already slept at this fishing spot.");
            displayPlayerCannotEffect();
            break;
          }
          var _wasRested = playerRested;
          playerRest(false, true);
          if (_crit === 'success' && !_wasRested) {
            playerSta++;
            logPlayerAction(actionString, getCritSleepLog(), colorYellow);
            displayPlayerRestedEffect();
          }
          if (corpseState === "neutralized") {
            wakeUpEnemy(getEnemyWakeLog());
          }
          break;
        }

        if (playerRested && !enemyType.includes("Trap") && enemyType !== "Fishing") {
          logPlayerAction(actionString, "Not feeling sleepy anymore.");
          displayPlayerCannotEffect();
          break;
        }

        switch (enemyType){

          case "Curse": //Waiting triggers the curse
            if (!encounterUsed) {
              playerChangeStats(enemyHp,enemyAtk,enemySta,enemyLck,enemyInt,enemyMgk,enemyDef,enemyMsg,true,false);
              encounterUsed=true;
            } else {
              playerRest(false, true);
            }
            break;

          case "Small":
            playerRest(true, true);
            logPlayerAction(actionString,"Wandered too far away from you.");
            nextEncounter();
            break;

          case "Standard": //You get hit if they have stamina
          case "Swift":
          case "Heavy":
          case "Recruit":
          case "Pet":
          case "Spirit":
          case "Demon":
          case "Undead":
          case "Boss":
          case "Stingy":
          case "Toxic":
          case "Hot":
          case "Tough":
          case "Reflective":
            if (_skillOK === false && (enemyAtk+enemyAtkBonus) > 0) {
              var _atkTotal = enemyAtk + enemyAtkBonus;
              var _interruptDmg = (_crit === 'fail') ? _atkTotal * 2 : _atkTotal;
              logPlayerAction(actionString, (_crit === 'fail')
                ? "Caught completely off guard. -" + _interruptDmg + " 💔"
                : "They interrupted your rest -" + _atkTotal + " 💔");
              displayEnemyAttackEffect();
              displayPlayerCannotEffect();
              playerHit(_interruptDmg);
              break;
            }
            if (playerHp>0){
              displayPlayerEffect("💤");
              playerGetStamina(_crit === 'success' ? 1 : 1, _crit === 'success');
              // Refresh 1 on both pass and crit pass (crit pass skips enemy turn already)
            }
            if (_crit === 'success') {
              logPlayerAction(actionString, getRestCritLog(), colorYellow);
              break;
            }
            if (enemyCastIfMgk()){
              //
            } else {
              enemyAttackOrRest();
            }
            break;

          case "Mirror":
          case "Prop":
            if (!playerRested && (totalBonus>0 || totalMalus<0)){
              if (_skillOK === false && _crit !== 'fail') {
                playerRestBadly(true);
              } else if (_crit === 'fail') {
                playerRested = true;
                logPlayerAction(actionString, "Exhausted by trying to sleep.");
                displayPlayerEffect("💤");
              } else {
                playerRest(true, true);
                if (totalBonus>0 && enemyMsg=="") enemyMsg="Rested very well, gaining extra";
                if (totalMalus<0 && enemyMsg=="") enemyMsg="Did not rest well, somehow lost";
                playerConsumed();
                encounterUsed = true;
                displayPlayerEffect("💤");
                if (_crit === 'success') {
                  playerSta++;
                  logPlayerAction(actionString, getCritSleepLog(), colorYellow);
                  displayPlayerRestedEffect();
                }
              }
            } else {
              playerRest(false, true);
            }
            break;

          case "Memory":
            if (_crit === 'fail') {
              logPlayerAction(actionString, "Exhausted by trying to sleep.");
              displayPlayerEffect("💤");
            } else if (_crit === 'success') {
              var _skipIdx = -1;
              for (var _si = 0; _si < linesStory.length; _si++) {
                var _sr = linesStory[_si];
                if (!_sr) continue;
                var _sa = String(_sr[0] || '').split(':')[1] || '';
                if (_sa === 'Twisted Fairyland') { _skipIdx = _si; break; }
              }
              if (_skipIdx >= 0) {
                encounterIndex = _skipIdx - 1;
              }
              playerRest(true, true);
              var _tpXP = parseInt(playerGainXP(1, Math.floor(playerXPThreshold * GAME_CONFIG.teleportXpBonus), ""));
              logPlayerAction(actionString, "<text style=color:"+colorFairy+";>Woken up elsewhere... ✨</text> " + decorateStatusText("", "+" + _tpXP + " XP", colorGold));
              displayPlayerEffect("✨");
              nextEncounter();
            } else if (_skillOK === false) {
              playerRestBadly(true);
            } else {
              playerRest(false, true);
            }
            playerRested=true;
            break;

          case "Trap": //Rest to full if out of combat + mana
          case "Trap-Big":
          case "Trap-Obstacle":
          case "Trap-Attack":
          case "Trap-Roll":
          case "Item":
          case "Consumable":
          case "Checkpoint":
          case "Altar":
            if (_crit === 'fail') {
              playerRested = true;
              logPlayerAction(actionString, "Exhausted by trying to sleep.");
              displayPlayerEffect("💤");
            } else if (_skillOK === false) {
              playerRestBadly(true);
            } else {
              playerRest(false, true);
              if (_crit === 'success') {
                playerSta++;
                logPlayerAction(actionString, getCritSleepLog(), colorYellow);
                displayPlayerRestedEffect();
              }
            }
            break;

          case "Fishing":
            if (fishingRested) {
              logPlayerAction(actionString, "Already slept at this fishing spot.");
              displayPlayerCannotEffect();
              break;
            }
            fishingRested = true;
            if (_crit === 'fail') {
              playerRested = true;
              logPlayerAction(actionString, "Exhausted by trying to sleep.");
              displayPlayerEffect("💤");
            } else if (_skillOK === false) {
              playerRestBadly(true);
            } else {
              playerRest(false, true);
              if (_crit === 'success') {
                playerSta++;
                logPlayerAction(actionString, getCritSleepLog(), colorYellow);
                displayPlayerRestedEffect();
              }
            }
            break;

          case "Trap-Sleep":
            if (encounterUsed){
                logPlayerAction(actionString,"Seems like its power is exhausted.")
                displayPlayerCannotEffect();
                break;
              }

            if (totalBonus > 0) {
              if (_skillOK === false) {
                playerRest(false, true);
                if (_crit === 'fail') {
                  playerChangeStats(-enemyHp, -enemyAtk, -enemySta, -enemyLck, -enemyInt, -enemyMgk, -enemyDef, "Slept disturbed the energy ", true, false);
                } else {
                  logPlayerAction(actionString, "Rested nearby, but missed its power.");
                }
                break;
              }
              encounterUsed = true;
              playerRest(true, true);
            }

            if (enemyHp<=0) playerHpMax-=enemyHp; //Don't lose max hp
            if (enemySta<=0) playerStaMax-=enemySta; //Don't lose max sta
            playerChangeStats(enemyHp, enemyAtk, enemySta, enemyLck, enemyInt, enemyMgk,enemyDef,enemyMsg,true,false);
            break;

          case "Dream":
            if (enemyName.includes("Waking Moment") || enemyName.includes("Worrying Realization")){
              displayPlayerCannotEffect();
              logPlayerAction(actionString,"Cannot fall asleep at the moment.")
              break;
            }
            playerRest(true, true);
            logPlayerAction(actionString,enemyMsg)
            nextEncounter();
            break;

          case "Friend": //They'll leave if you'll rest
            if (encounterUsed) {
              logPlayerAction(actionString, "They have nothing more to offer.");
              displayPlayerCannotEffect();
              break;
            }
            playerRest(false, true);
            logPlayerAction(actionString,"They got tired of waiting for you.");
            nextEncounter();
            break;

          case "Death":
            // menuFade(function() {
            //   SaveManager.abandonCurrentRun();
            //   Menu.show();
            // });
            break;

          case "Upgrade":
            logPlayerAction(actionString,"Grew more discerning. <b>+1 🧠 Psyche</b>");
            displayPlayerGainedEffect();
            displayPlayerEffect("🧠");
            playerInt+=1;
            isFishing=false;
            animateFlipNextEncounter();
            break;

          default:
            if (enemyType.includes("Container")){
              playerRest(false, true);
              break;
            }
            logPlayerAction(actionString,"Cannot rest, monsters are nearby.");
            displayPlayerCannotEffect();
            displayPlayerEffect("👀");
            break;
        }

    };
    var _wasStillFishing = isFishing;
    if (isFishing && button!="button_cast") {
      loadEncounter(lootEncounterIndex,linesLoot);
      encounterIndex=lastEncounterIndex;
    }
    if (corpseState!="") enemyType=originalType;
    if (enemyBossType!="") enemyType=enemyBossType;
    if (_wasStillFishing && button!="button_cast") {
      if (enemyType.includes('Boss')) AchievementManager.check('fish_boss');
      else if (enemyTeam && enemyTeam.includes('Artifact')) AchievementManager.check('fish_legendary');
    }

    //Set intellect 1-6 (Pure Chance)
    if (procAbilityChance("🎲",100)){
      var temporaryIntellect=chooseFrom([1,2,3,4,5,6]);
      dbg("Chance→int:"+temporaryIntellect);
      playerInt=temporaryIntellect;
    }
    redraw();
  };
}

function drachmaeBuy(price=1,item="",skillSuccess=null){
  var availableCoins=(savedCoins-spentCoins)

  if (availableCoins>=price) {
    playerShopped=true;
    spentCoins+=price;
    AchievementManager.check('spend_coins', price);
    if (enemyDesc.includes("Unspent Drachmae")) {
      enemyDesc = enemyDesc.replace(/Unspent Drachmae: \d+/, "Unspent Drachmae: "+parseInt(savedCoins-spentCoins));
    }
    //DO NOT localStorage.setItem('coins', availableCoins); //Remove from local storage as well (coins do not endlessly add up)
    displayEnemyEffect("🪙");
    displayPlayerEffect("");

    var _tierMap = { ItemCommon: "Common", ItemUncommon: "Uncommon", ItemRare: "Rare" };
    var _forcedTier = _tierMap[item] || null;
    var _isItemBuy = (item=="Item" || item=="Artifact" || _forcedTier);
    if (_isItemBuy) {
      if (item=="Artifact") AchievementManager.check('buy_artifact');
      else AchievementManager.check('buy_item');
      displayPlayerGainedEffect();
      logPlayerAction(actionString,"Splendid! This ought to help");
      var genItem = _forcedTier ? generateRandomItemByTier(_forcedTier) : generateRandomItem(item=="Artifact" ? "Artifact" : "");
      genItem[0]="area:"+areaName;
      pushEncounter(genItem);
      nextEncounter();
      var _shopBack = drachmaShop.slice(); _shopBack[0]="area:"+areaName;
      pushEncounter(_shopBack);
    } else if (item=="Favor" || item=="Body") {
      var statPool = item=="Favor"
        ? [{ stat: "🍀", amt: " +", apply: function() { playerLck+=0.5; } },
           { stat: "🧠", amt: " +", apply: function() { playerInt+=0.5; } }]
        : [{ stat: "❤️", amt: "+1 ", apply: function() { playerHp++; playerHpMax++; } },
           { stat: "🟢", amt: "+1 ", apply: function() { playerSta++; playerStaMax++; } }];
      var picked = statPool[Math.floor(Math.random() * statPool.length)];
      picked.apply();
      displayPlayerGainedEffect();
      displayPlayerEffect(picked.stat);
      logPlayerAction(actionString, "Received a <b>"+picked.amt+picked.stat+"</b> blessing");
      redraw();
      return;
    } else if (item=="Gamble")  {
      if (skillSuccess === true){
        AchievementManager.check('gamble_win');
        displayPlayerGainedEffect();
        displayPlayerEffect("🍀");
        logPlayerAction(actionString,"<text style=color:"+colorDarkGreen+";>Lucky bastard, you actually won!</text>")
        var _prize = drachmaPrize.slice(); _prize[0]="area:"+areaName;
        pushEncounter(_prize);
        nextEncounter();
      } else {
        AchievementManager.check('gamble_lose');
        logPlayerAction(actionString,"<text style=color:"+colorRed+";>Ooops... you lost the gamble!</text>")
        var _regrets = gamblingLost.slice(); _regrets[0]="area:"+areaName;
        displayPlayerCannotEffect();
        displayPlayerEffect("❌");
        pushEncounter(_regrets);
        nextEncounter();
      }
      var _shop = drachmaShop.slice(); _shop[0]="area:"+areaName;
      pushEncounter(_shop);
      return;
    } else {
      AchievementManager.check('buy_level');
      displayPlayerGainedEffect();
      logPlayerAction(actionString,"Sure, grow stronger as you need");
      playerXP+=playerXPThreshold;
      playerRest(true);
      return;
    }
    return;
  } else {
    logAction("👤 ▸ ⁉️ "+"<text style=color:"+colorRed+";>You don't have enough 🪙 <b>Drachmae</b>!</text>")
    displayEnemyDodgeEffect();
    displayPlayerCannotEffect();
    return;
  }
}
