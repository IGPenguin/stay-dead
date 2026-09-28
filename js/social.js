//Social features
function generateCharacterShareString(){
  var characterShareString="";
    characterShareString+="<b>"+playerName+"</b> "+"•  Lvl "+playerLevel;
    characterShareString+="\n❤️ "+playerHpMax+"  🟢 "+playerStaMax+"  ⚔️ " +playerAtk;
    if (playerMgkMax>0) characterShareString+="  🔵 " + playerMgkMax;
    characterShareString+="  🍀 " + playerLck;
    characterShareString+="  🧠 " + playerInt;
    if ((playerPartyString.length+playerLootString.length)>0) characterShareString+="\n";
    if (playerPartyString.length > 0) characterShareString += playerPartyString;
    if (playerLootString.length > 0) characterShareString += playerLootString;
    characterShareString += "\nLifetime: "+adventureStartTime;
    characterShareString += "\n"+emptySpace+"→ "+adventureEndTime;
    characterShareString += " (✞"+playerKarma+")";
    //characterShareString += "\nKillcount: "+playerKills;
    characterShareString += adventureEndReason+" (#"+adventureEncounterCount+")";
  return characterShareString;
}

function generateCharacterLegend(logLength=0) {
  var characterLegend="";
  characterLegend = adventureLog.replaceAll("<br>","\n");
  var tempString = characterLegend.split("\n").slice(2);
  characterLegend = tempString.join("\n");
  characterLegend = characterLegend.replaceAll("&nbsp;"," ").replace(/^\n/, '');
  if (parseInt(logLength)>0) {
    characterLegend="Limited to last "+logLength+" events...\n"+characterLegend.split("\n").slice(-logLength-1).join("\n");
  }

  characterLegend=generateCharacterShareString()+"\n\n"+characterLegend+"\n";
  characterLegend += "https://igpenguin.github.io/stay-dead";
  characterLegend +=  "\n"+ versionCode + " ("+window.screen.availHeight+"x"+window.screen.availWidth+")"

  return characterLegend;
}

function copyAdventureToClipboard(){
  var adventureLogClipboard = generateCharacterLegend();
  displayPlayerEffect("📜");
  logPlayerAction(actionString,"Recapped your legendary story.");

  //Copy to clipboard
  navigator.clipboard.writeText(adventureLogClipboard);

  //Download as .txt
  var fileName = "Stay-Dead-"+playerName.replaceAll(" ","-")+"-"+adventureEndTime.replaceAll(" at ","-").replaceAll(":","-")+".txt";
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(adventureLogClipboard));
  element.setAttribute('download', fileName);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);

  //Open in new window
  var legendTab = window.open('about:blank','data:text/plain;charset=utf-8,');
  legendTab.document.write("<p style=\"background-color:#272727;padding:8px;padding-left:24px;overflow:auto;height:100%;margin:-8px;color:"+colorWhite+"\">" + adventureLogClipboard.replaceAll("\n","<br>")+"</p>");
  legendTab.document.close();
}

function redirectToTweet(){
  var tweetUrl = "http://twitter.com/intent/tweet?url=https://igpenguin.github.io/stay-dead&text=";
  window.open(tweetUrl+encodeURIComponent("Yo @IGPenguin, check out my Stay Dead run!"+"\n\n"+generateCharacterShareString().replaceAll("&nbsp"," ").replaceAll("<b>","").replaceAll("</b>","")+"\n"));
}

function shareLinkedIn(){
  var shareText = "I just finished another Stay Dead playthrough!"+"\nIt's a data-driven roguelike RPG written in JS.\nCheck it out at: https://igpenguin.github.io/stay-dead\n\n"+generateCharacterShareString().replaceAll("&nbsp"," ").replaceAll("<b>","").replaceAll("</b>","");
  navigator.clipboard.writeText(shareText);
  window.open("https://www.linkedin.com/shareArticle?mini=true&url="+encodeURIComponent("https://igpenguin.github.io/stay-dead"));
}

function visitLinkedIn(){
  var profileUrl = "https://www.linkedin.com/in/igpenguin/";
  window.open(profileUrl);
}

// Shared entry point — accepts any pre-built plain text string.
// Google Forms answers 400 once the prefilled URL passes ~8 KB
var FEEDBACK_LOG_MAX_ENCODED = 5000;

function openFeedbackForm(text) {
  var lines = text.replace(/<[^>]*>/g, '').replaceAll(emptySpace, '   ').split('\n');
  var bodyStart = Math.max(0, lines.indexOf('') + 1);
  while (encodeURIComponent(lines.join('\n')).length > FEEDBACK_LOG_MAX_ENCODED && lines.length > bodyStart + 1) {
    lines.splice(bodyStart, 1);
  }
  var gameLog = encodeURIComponent(lines.join('\n'));
  var nickname = '';
  try { nickname = localStorage.getItem('playerNickname') || ''; } catch (e) {}

  var url = 'https://docs.google.com/forms/d/e/1FAIpQLSc46BJ-S_EBmXxZgzVYLCC8l2Wece0hWXJESiRMpuMlXTC3Cw/viewform?usp=pp_url' +
            '&entry.1788435593=' + gameLog +
            '&entry.1492415838=' + encodeURIComponent(nickname) +
            '&entry.1255791188=' + encodeURIComponent(userId) +
            '&entry.1345067948=' + encodeURIComponent(sessionId);

  window.open(url);
}

function redirectToFeedback(){
  openFeedbackForm(generateCharacterLegend(50));
}

function showDonatePopup() {
  var mockLink = 'https://revolut.me/igpenguin?currency=EUR&amount=200&note=Stay%20Dead%20-%20Coffee';

  var existing = document.getElementById('donate_popup_overlay');
  if (existing) existing.parentNode.removeChild(existing);

  var overlay = document.createElement('div');
  overlay.id = 'donate_popup_overlay';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column;';

  var card = document.createElement('div');
  card.style.cssText = 'background-color:#202020; padding:20px; max-width:290px; width:90%; box-shadow:0 0 0 3px #000; text-align:center;';

  var title = document.createElement('h3');
  title.style.cssText = 'margin:-4px 0px 14px; font-size:18px; -webkit-text-stroke:4px black; paint-order:stroke fill;';
  title.innerHTML = "☕ Support IGPenguin's family!";

  var subtitle = document.createElement('p');
  subtitle.style.cssText = 'margin:8px 0 8px 0; font-size:13px; color:#888;';
  subtitle.innerHTML = 'ℹ️ Voluntary donation, no extra content provided.';

  var qrWrap = document.createElement('div');
  qrWrap.style.cssText = 'width:284px; height:284px; margin:0 auto 0 auto; box-shadow:0 0 0 3px #000;';

  var qrImg = document.createElement('img');
  qrImg.src = 'assets/img/Donate.jpg';
  qrImg.alt = 'Revolut QR Code';
  qrImg.style.cssText = 'width:284px; height:284px; display:block;';

  qrWrap.appendChild(qrImg);

  var linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.readOnly = true;
  linkInput.value = mockLink;
  linkInput.style.cssText = 'width:286px; box-sizing:border-box; font-size:12.2px; padding:10px; background:#2a2a2a; border:none; outline:2px solid #444; color:#aaa; font-family:inherit; margin-bottom:10px; text-align:center; cursor:text;';
  linkInput.addEventListener('click', function () { this.select(); });

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:4px;';

  var donateBtn = document.createElement('button');
  donateBtn.className = 'menu-btn';
  donateBtn.style.cssText = 'flex:1; margin-top:0; color:#FFD940;';
  donateBtn.innerHTML = '💸 Donate';

  var copyBtn = document.createElement('button');
  copyBtn.className = 'menu-btn';
  copyBtn.style.cssText = 'flex:1; margin-top:0; color:white;';
  copyBtn.innerHTML = '🔗 Share';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'menu-btn';
  closeBtn.style.cssText = 'flex:1; margin-top:0; color:#ff6666;';
  closeBtn.innerHTML = '✕ Close';

  donateBtn.addEventListener('click', function () {
    window.open(mockLink, '_blank');
  });

  copyBtn.addEventListener('click', function () {
    function _onCopied() {
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(function () { copyBtn.innerHTML = '🔗 Share'; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mockLink).then(_onCopied).catch(function () {
        linkInput.select(); document.execCommand('copy'); _onCopied();
      });
    } else {
      linkInput.select(); document.execCommand('copy'); _onCopied();
    }
  });

  function _closePopup() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  closeBtn.addEventListener('click', _closePopup);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) _closePopup(); });

  btnRow.appendChild(donateBtn);
  btnRow.appendChild(copyBtn);
  btnRow.appendChild(closeBtn);
  card.appendChild(title);
  card.appendChild(qrWrap);
  card.appendChild(subtitle);
  card.appendChild(linkInput);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

function showSharePopup() {
  var shareUrl = 'https://igpenguin.github.io/stay-dead';

  var existing = document.getElementById('share_popup_overlay');
  if (existing) existing.parentNode.removeChild(existing);

  var overlay = document.createElement('div');
  overlay.id = 'share_popup_overlay';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column;';

  var card = document.createElement('div');
  card.id = 'share_popup_card';
  card.style.cssText = 'background-color:#202020; padding:20px; max-width:290px; width:90%; box-shadow:0 0 0 3px #000; text-align:center;';

  var title = document.createElement('h3');
  title.style.cssText = 'margin:0 0 14px 0; font-size:18px; -webkit-text-stroke:4px black; paint-order:stroke fill;';
  title.innerHTML = '🔗 Share to your friends!';

  var qr = document.createElement('img');
  qr.src = 'assets/img/QR.png';
  qr.alt = 'QR Code';
  qr.style.cssText = 'width:284px; height:284px; image-rendering:pixelated; display:block; margin:0 auto 14px auto; box-shadow:0 0 0 3px #000;';

  var urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.readOnly = true;
  urlInput.value = shareUrl;
  urlInput.style.cssText = 'width:286px; box-sizing:border-box; font-size:16px; padding:10px 10px; background:#2a2a2a; border:none; outline:2px solid #444; color:#aaa; font-family:inherit; margin-bottom:10px; text-align:center; cursor:text;';
  urlInput.addEventListener('click', function () { this.select(); });

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex; gap:4px;';

  var copyBtn = document.createElement('button');
  copyBtn.className = 'menu-btn';
  copyBtn.style.cssText = 'flex:1; margin-top:0; color:#FFD940;';
  copyBtn.innerHTML = '📋 Copy Link';

  var closeBtn = document.createElement('button');
  closeBtn.className = 'menu-btn';
  closeBtn.style.cssText = 'flex:0.6; margin-top:0; color:#ff6666;';
  closeBtn.innerHTML = '✕ Close';

  copyBtn.addEventListener('click', function () {
    function _onCopied() {
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(function () { copyBtn.innerHTML = '📋 Copy Link'; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(_onCopied).catch(function () {
        urlInput.select(); document.execCommand('copy'); _onCopied();
      });
    } else {
      urlInput.select(); document.execCommand('copy'); _onCopied();
    }
  });

  function _closePopup() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  closeBtn.addEventListener('click', _closePopup);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) _closePopup(); });

  btnRow.appendChild(copyBtn);
  btnRow.appendChild(closeBtn);
  card.appendChild(title);
  card.appendChild(qr);
  card.appendChild(urlInput);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}
