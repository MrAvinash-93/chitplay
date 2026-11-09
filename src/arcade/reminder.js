/**
 * The daily reminder, off until a player turns it on. ChitPlay has no server, so nothing can be
 * pushed from outside. What a browser allows without one:
 *  - while the site is open: a notification at your time;
 *  - on an installed app in Chrome (Android, desktop): background checks, at times the browser picks,
 *    so it comes around your time rather than exactly on it.
 * Elsewhere (Safari, most tabs) it simply doesn't arrive while the site is closed.
 */
const KEY = 'chitplay.reminder';
const LINES = {
  en: ['Your table is waiting! 🎲', 'One quick game? Flying Chit is ready to fly 📨', 'Beat your best score today 🏆'],
  hinglish: ['Aapki table intezaar kar rahi hai! 🎲', 'Ek chhota game ho jaye? Flying Chit taiyaar hai 📨', 'Aaj apna best score todo 🏆'],
  hindi: ['आपकी टेबल इंतज़ार कर रही है! 🎲', 'एक छोटा गेम हो जाए? Flying Chit तैयार है 📨', 'आज अपना बेस्ट स्कोर तोड़ें 🏆'],
  urdu: ['Aap ki table intezar kar rahi hai! 🎲', 'Ek chhota game ho jaye? Flying Chit tayyar hai 📨', 'Aaj apna best score torein 🏆'],
  nepali: ['Tapaiko table parkhiraheko chha! 🎲', 'Euta sano game khelne? Flying Chit tayar chha 📨', 'Aaja aafno best score todnuhos 🏆'],
  bangla: ['Apnar table opekkhay ache! 🎲', 'Ekta chhoto game hobe? Flying Chit toiri 📨', 'Aj nijer best score bhangun 🏆'],
  romaji: ['Teeburu ga matteru yo! 🎲', 'Sukoshi asobou? Flying Chit ga junbi OK 📨', 'Kyou wa jiko besuto o koeyou 🏆'],
  korean_roman: ['Tei beuli gidarigo isseoyo! 🎲', 'Han pan eottaeyo? Flying Chit junbi wallyo 📨', 'Oneul choego jeomsu-reul kkaeboseyo 🏆'],
  pinyin: ['Paizhuo zai deng ni! 🎲', 'Lai yi ju ma? Flying Chit zhunbei hao le 📨', 'Jintian dapo ni de jilu 🏆'],
  russian_latin: ['Tvoy stol zhdyot! 🎲', 'Odnu bystruyu igru? Flying Chit gotov 📨', 'Pobey svoy rekord segodnya 🏆'],
  german: ['Dein Tisch wartet! 🎲', 'Eine schnelle Runde? Flying Chit ist bereit 📨', 'Knack heute deinen Rekord 🏆'],
  french: ['Ta table t’attend ! 🎲', 'Une petite partie ? Flying Chit est prêt 📨', 'Bats ton record aujourd’hui 🏆'],
  portuguese: ['Sua mesa está esperando! 🎲', 'Uma partida rápida? Flying Chit está pronto 📨', 'Bata seu recorde hoje 🏆'],
  spanish: ['¡Tu mesa te espera! 🎲', '¿Una partida rápida? Flying Chit está listo 📨', 'Supera tu récord hoy 🏆'],
  indonesian: ['Mejamu menunggu! 🎲', 'Main sebentar? Flying Chit sudah siap 📨', 'Pecahkan rekormu hari ini 🏆'],
  turkish: ['Masan seni bekliyor! 🎲', 'Kısa bir oyun? Flying Chit hazır 📨', 'Bugün rekorunu kır 🏆'],
  italian: ['Il tuo tavolo ti aspetta! 🎲', 'Una partita veloce? Flying Chit è pronto 📨', 'Batti il tuo record oggi 🏆'],
};
export const reminderLines = (lang) => LINES[lang] || LINES.en;
export const reminderSupported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator;

export function reminderSettings() {
  try { return { on: false, time: '19:00', asked: false, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { on: false, time: '19:00', asked: false }; }
}
function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

/** Tell the service worker, which is what wakes up in the background. */
async function tellWorker(s, lang) {
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ t: 'reminder', on: s.on, time: s.time, lines: reminderLines(lang) });
    if (s.on && reg.periodicSync) {
      try {
        const state = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (state.state === 'granted') await reg.periodicSync.register('chitplay-reminder', { minInterval: 6 * 3600 * 1000 });
      } catch { /* this browser only reminds while the site is open */ }
    } else if (!s.on && reg.periodicSync) {
      await reg.periodicSync.unregister('chitplay-reminder').catch(() => {});
    }
  } catch { /* no service worker: reminders while the page is open still work */ }
}
let timer = 0;
/** While the site is open: a notification at your time, once a day. */
function armToday(s, lang) {
  clearTimeout(timer);
  if (!s.on) return;
  const [h, m] = s.time.split(':').map(Number);
  const at = new Date();
  at.setHours(h, m, 0, 0);
  const wait = at.getTime() - Date.now();
  if (wait < 0 || wait > 86400000) return;
  timer = setTimeout(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const list = reminderLines(lang);
      await reg.showNotification('ChitPlay', { body: list[new Date().getDate() % list.length], icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'chitplay-daily' });
    } catch {}
  }, wait);
}
/** Turn it on or off. Only ever asks for permission because the player tapped. Resolves true if it's on. */
export async function setReminder(on, lang, time) {
  const s = reminderSettings();
  s.asked = true;
  if (time) s.time = time;
  if (on) {
    if (!reminderSupported()) { s.on = false; saveSettings(s); return false; }
    const answer = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    s.on = answer === 'granted';
  } else s.on = false;
  saveSettings(s);
  tellWorker(s, lang);
  armToday(s, lang);
  return s.on;
}
/** On every visit: keep the language and today's reminder up to date. */
export function startReminder(lang) {
  const s = reminderSettings();
  if (!s.on || !reminderSupported() || Notification.permission !== 'granted') return;
  tellWorker(s, lang);
  armToday(s, lang);
}
