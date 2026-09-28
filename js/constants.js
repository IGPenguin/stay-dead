// ── Debug / Version ───────────────────────────────────────────────────────────
var versionCode = "ver. 09/27/26 @ 03:31 PM"

var TUTORIAL_SKIP_INDEX = 6; // linesStory index where returning players resume; update when tutorial rows change
var SPLASH_DISABLED_LOCALHOST = true;
var TUTORIAL_SKIP_LOCALHOST = true;
var RANKINGS_DISABLED_LOCALHOST = false;
var TELEMETRY_DISABLED_LOCALHOST = true;

// ── Colors ────────────────────────────────────────────────────────────────────
var colorWhite         = "#FFFFFF";
var colorGold          = "#FFD940";
var colorDarkGold      = "#4d4112";
var colorGreen         = "#22BF22";
var colorSoftGreen     = "#62a862ff";
var colorDarkGreen     = "#509920";
var colorFamiliarGreen = "#364f25";
var colorLime          = "#91bf08";
var colorGrapefruit    = "#db432c";
var colorRed           = "#FF0000";
var colorSoftRed       = "#ef4646ff";
var colorDarkRed       = "#690000";
var colorDarkRedSubtle = "#3d0404";
var colorGrey          = "#CCCCCC";
var colorDarkGrey      = "#888888";
var colorSemiDarkGrey  = "#999999";
var colorSuperDarkGrey = "rgb(80, 80, 80)";
var colorOrange        = "orange";
var colorDarkOrange    = "#523501";
var colorYellow        = "#F7D147";
var colorDarkYellow    = "#d6b53c";
var colorBlue          = "#1059AA";
var colorLightBlue     = "#487bb5";
var colorDarkBlue      = "#072a52";
var colorPurple        = "#BF40BF";
var colorDarkPurple    = "#381338";
var colorInvader       = "#D040D8";
var colorDarkInvader   = "#2E083A";
var colorPink          = "#c9594f";
var colorLightPink     = "#e38aac";
var colorDarkPink      = "#a1111a";
var colorShadeBlue     = "#556f90";
var colorLightShadeBlue = "#7193bf";
var colorDarkShadeBlue = "rgb(40,57,79)";
var colorCardBackground = "#202020";
var colorPaper         = "#d1bd91";
var colorDarkPaper     = "#8c7f61";
var colorFairy         = "#2cc176";
var colorDarkFairy = "#115935";

// ── UI Symbols ────────────────────────────────────────────────────────────────
var fullSymbol  = "<span class=\"ui-rect full\" style=\"color:"+colorGrey+"\"></span>";
var emptySymbol = "<span class=\"ui-rect empty\" style=\"color:"+colorGrey+"\"></span>";
//var fullSymbol  = "<p class=\"ui-symbol\" style=\"color:"+colorGrey+";font-size:18px;display:inline;\">●</p>";
//var emptySymbol = "<p class=\"ui-symbol\" style=\"color:"+colorGrey+";font-size:18px;display:inline;\">○</p>";
//var fullSymbol  = "<p class=\"ui-symbol\" style=\"color:"+colorGrey+";font-size:18px;display:inline;\">◼︎</p>";
//var emptySymbol = "<p class=\"ui-symbol\" style=\"color:"+colorGrey+";font-size:18px;display:inline;\">◻︎</p>";
var enemyStatusString = "";
var newline    = "<br>";
var emptySpace = "&nbsp";
var narrowSpace = "&#8239;";
var arrowSymbol = "▸";

// -- Functions ────────────────────────────────────────────────────────────────
var _segmenter = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter() : null;
function countEmoji(str) {
  var s = String(str || '');
  if (_segmenter) return [..._segmenter.segment(s)].length;
  return [...s].length; // fallback: counts code points, not grapheme clusters
}

function isLocalhost() {
  return location.hostname.includes("localhost")
      || location.hostname.includes("127.0.0.1")
      || location.hostname.includes("192.168");
}

function isAuthorizedHost() {
  return location.hostname === 'igpenguin.github.io'
      || (typeof SD_LOCAL_AUTH !== 'undefined' && !!SD_LOCAL_AUTH);
}

function getPlatform() {
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/android/i.test(ua)) return "android";
  return "other";
}

// ── Identity ──────────────────────────────────────────────────────────────────
function _makeUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
var userId = (function () {
  try {
    var stored = localStorage.getItem('sd_user_id');
    if (stored) return stored;
    var id = _makeUUID();
    localStorage.setItem('sd_user_id', id);
    return id;
  } catch (e) { return _makeUUID(); }
})();
var sessionId = _makeUUID();

var fontPreference = 'Pixel';
try { fontPreference = localStorage.getItem('sd_font_pref') || 'Pixel'; } catch (e) {}

function applyFontPreference() {
  var useGelasio = (fontPreference === 'Gelasio');
  var usePixel   = (fontPreference === 'Pixel');

  if (useGelasio) {
    document.documentElement.classList.add('gelasio-font');
    document.documentElement.classList.remove('pixel-font');
  } else if (usePixel) {
    document.documentElement.classList.add('pixel-font');
    document.documentElement.classList.remove('gelasio-font');
  } else {
    document.documentElement.classList.remove('gelasio-font');
    document.documentElement.classList.remove('pixel-font');
  }
}