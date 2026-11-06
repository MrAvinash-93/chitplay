import { el, clear } from '../../utils/dom.js';
import { GAME_PHASES } from '../../app/config.js?v=20261105-story';
import { settingsStore } from '../../persistence/settings-store.js?v=20261014-profile-v4';
import { audioManager } from '../../audio/audio-manager.js';
import { loadWorld } from '../../world/world-loader.js?v=20261105-world';
import { COUNTRIES, COUNTRY_ORDER, detectCountryInfo, localize, GAME_SLUGS, GAME_AKA, GAME_NAME_EN, GAME_ICON, ROLE_LATIN } from '../../world/countries.js?v=20261108-prod';
import { Dialogue, loadPack, CHAT_LANGUAGES } from '../../world/dialogue.js?v=20261108-prod';
import { Match, CHEAT_PENALTY } from '../../world/match.js?v=20261110-awards';
import { voiceBox } from '../../world/voice.js?v=20261106-more';
import { NearbyHost, NearbyGuest, nearbyError, isCode, newToken } from '../../net/nearby.js?v=20261110-nearby3';


/**
 * ChitPlay 3D — the whole game. Pick a country edition, then the kids play a
 * full match on their own: deal, pick, peek, bluff, investigate, react. The
 * human (when playing) taps to open their chit, may sneakily cheat, and taps
 * the kid they suspect when it's their turn to guess.
 */

const HUMAN_SEAT = 3;
const SHIRTS = ['#d4a017', '#e91e63', '#2196f3', '#43a047'];
const CANCEL = Symbol('cancel');
const ROUND_OPTIONS = [3, 5, 7, 10, 20];

const UI = {
  sa: {
    roundOf: 'Round {n} / {m}', aka: 'Ise ye bhi kehte hain', howto: '📖 Kaise khelein', resumed: '👋 Wapas aa gaye! Round {n} wahi se chalu', loading: '3D kamra load ho raha hai…', you: 'Tum', play: '▶ Khud Khelo', playSub: 'Tum bhi bachchon ke saath baitho',
    watch: '👀 Sirf Dekho', watchSub: 'Charon bachche khud khelenge', rounds: 'Rounds',
    chit: 'Teri chit aa gayi!', chitTap: 'Tap karke kholo, kisi ko dikhana mat 🤫', youAre: 'Tum {role} ho!', close: 'Tap karke band karo',
    accuse: '{icon} Tum {role} ho! {thief} kaun hai? Kisi bachche pe tap karo', second: 'Ek aur mauka! Doosra bachcha chuno',
    cheat: '🤫 Cheat', cheatSub: 'Chupke se ek ka role dekho', peekResult: 'Psst… {name} {role} hai {emoji}',
    caught: 'Pakde gaye! −{n} 😬', safe: 'Kisi ne nahi dekha 😏',
    nightClear: '🌙 Raat ki jaanch: {name} innocent hai', nightThief: '🌙 Raat ki jaanch: {name} hi {thief} hai! 😱',
    over: 'Match khatam!', won: '{name} jeet gaya! 🏆', youWon: 'Tum jeet gaye! 🎉', again: '🔁 Ek aur match', againSub: 'Isi desh me phir se',
    change: '🌏 Desh badlo', changeSub: 'Doosre desh ka game khelo', points: 'points', noGl: 'Is device pe 3D nahi chal paaya 😕',
    auto: '📍 Tumhara desh: {c}', pinned: '✋ Tumne chuna: {c}', useMine: '📍 Mera desh ({c})', voiceOff: 'Is device pe is bhasha ki awaaz nahi mili, sirf bubbles',
  },
  en: {
    roundOf: 'Round {n} / {m}', aka: 'Also called', howto: '📖 How to play', resumed: '👋 Welcome back! Carrying on with round {n}', loading: 'Loading the 3D room…', you: 'You', play: '▶ Play', playSub: 'Sit down with the kids',
    watch: '👀 Just Watch', watchSub: 'All four kids play on their own', rounds: 'Rounds',
    chit: 'Your slip has arrived!', chitTap: 'Tap to open it, don’t show anyone 🤫', youAre: 'You are the {role}!', close: 'Tap to close',
    accuse: '{icon} You are the {role}! Who is the {thief}? Tap a kid', second: 'One more chance! Pick another kid',
    cheat: '🤫 Cheat', cheatSub: 'Sneak a peek at one kid', peekResult: 'Psst… {name} is the {role} {emoji}',
    caught: 'Caught! −{n} 😬', safe: 'Nobody noticed 😏',
    nightClear: '🌙 Night check: {name} is innocent', nightThief: '🌙 Night check: {name} is the {thief}! 😱',
    over: 'Match over!', won: '{name} wins! 🏆', youWon: 'You win! 🎉', again: '🔁 Play again', againSub: 'Same game, new match',
    change: '🎮 Change game', changeSub: 'Swipe to another game',
    sharpEye: '🕵️ Sharp Eye', sharpEyeSub: '{n} catches', escape: '🦊 Escape Artist', escapeSub: 'got away {n}×',
    share: '📤 Share', shareSub: 'Challenge a friend', copied: 'Link copied! 📋',
    statsLine: '🏆 {w} wins · {m} matches · best {b}',
    nearby: '📶 Nearby Play', nearbySub: 'Friends on their own phones, up to 4 players',
    invite: '📤 Share invite link', inviteSub: 'WhatsApp, SMS, anywhere', inviteText: 'Join my ChitPlay game! Code {code}', qrLabel: 'QR code to join this game',
    reconnecting: '📶 Reconnecting…', reconnectSub: 'Getting you back into the game. Keep this page open.',
    backNext: 'You’re back! 🎉 You play again from the next round', rejoined: '{name} is back 🎉 Plays from the next round', rejoinFail: 'Couldn’t get back into that game 😕',
    host: '🏠 Host a game', hostSub: '{game} · {n} rounds', join: '🔗 Join a game', joinSub: 'Enter the host’s 6-digit code',
    yourName: 'Your name', hostName: 'Host', back: '‹ Back', connecting: 'Connecting…', codeIs: 'Game code',
    codeHelp: 'Friends scan this, open the invite link, or type the code in 📶 Nearby Play → 🔗 Join a game',
    waiting: '⏳ Waiting for a friend…', bot: '🤖 Computer kid', youHost: '(you, host)',
    startN: '▶ Start with {n} players', startNeedOne: 'At least one friend has to join', cancel: '✕ Close room',
    enterCode: '6-digit code', joinBtn: '🔗 Join', joined: '✅ Joined {host}’s game', waitStart: 'Waiting for the host to start…',
    hostLeft: 'The host closed the game 👋', lostConn: 'Connection lost 📶', left: '{name} left, a computer kid takes over',
    choosing: '⏳ {name} is choosing…', waitHostAgain: 'Waiting for the host to start the next match…',
    againNearby: 'Same friends, new match', leave: '🚪 Leave', leaveSub: 'Back to the games', changeNearby: 'Closes this room',
    nearbyNote: 'Connecting needs internet for a moment; the game itself goes phone to phone.', points: 'points', noGl: '3D isn’t available on this device 😕',
    auto: '📍 Your country: {c}', pinned: '✋ You picked: {c}', useMine: '📍 My country ({c})', voiceOff: 'No voice for this language on this device, bubbles only',
  },
  ru: {
    roundOf: 'Раунд {n} / {m}', aka: 'Ещё называют', howto: '📖 Правила', resumed: '👋 С возвращением! Продолжаем раунд {n}', loading: 'Загружаем 3D-комнату…', you: 'Ты', play: '▶ Играть', playSub: 'Садись к ребятам',
    watch: '👀 Смотреть', watchSub: 'Ребята играют сами', rounds: 'Раунды',
    chit: 'Тебе бумажка!', chitTap: 'Нажми, чтобы открыть, никому не показывай 🤫', youAre: 'Ты — {role}!', close: 'Нажми, чтобы закрыть',
    accuse: '{icon} Ты — {role}! Кто {thief}? Нажми на игрока', second: 'Ещё шанс! Выбери другого',
    cheat: '🤫 Подсмотреть', cheatSub: 'Тайком узнать одну роль', peekResult: 'Тсс… {name} — {role} {emoji}',
    caught: 'Попался! −{n} 😬', safe: 'Никто не заметил 😏',
    nightClear: '🌙 Ночная проверка: {name} мирный', nightThief: '🌙 Ночная проверка: {name} — {thief}! 😱',
    over: 'Игра окончена!', won: '{name} победил! 🏆', youWon: 'Ты победил! 🎉', again: '🔁 Ещё партия', againSub: 'Та же страна, новая игра',
    change: '🌏 Сменить страну', changeSub: 'Игра другой страны', points: 'очков', noGl: '3D не работает на этом устройстве 😕',
    auto: '📍 Твоя страна: {c}', pinned: '✋ Выбрано тобой: {c}', useMine: '📍 Моя страна ({c})', voiceOff: 'Нет голоса для этого языка, только реплики',
  },
  de: {
    roundOf: 'Runde {n} / {m}', aka: 'Auch genannt', howto: '📖 Spielregeln', resumed: '👋 Willkommen zurück! Weiter mit Runde {n}', loading: 'Das 3D-Zimmer lädt…', you: 'Du', play: '▶ Mitspielen', playSub: 'Setz dich zu den Kindern',
    watch: '👀 Zuschauen', watchSub: 'Die vier spielen allein', rounds: 'Runden',
    chit: 'Dein Zettel ist da!', chitTap: 'Tippen zum Öffnen, keinem zeigen 🤫', youAre: 'Du bist der {role}!', close: 'Tippen zum Schließen',
    accuse: '{icon} Du bist der {role}! Wer ist der {thief}? Tippe ein Kind an', second: 'Noch eine Chance! Wähl ein anderes Kind',
    cheat: '🤫 Spicken', cheatSub: 'Heimlich eine Rolle sehen', peekResult: 'Psst… {name} ist {role} {emoji}',
    caught: 'Erwischt! −{n} 😬', safe: 'Keiner hat’s gemerkt 😏',
    nightClear: '🌙 {name} ist unschuldig', nightThief: '🌙 {name} ist der {thief}! 😱',
    over: 'Spiel vorbei!', won: '{name} gewinnt! 🏆', youWon: 'Du gewinnst! 🎉', again: '🔁 Nochmal', againSub: 'Gleiches Land, neues Spiel',
    change: '🌏 Land wechseln', changeSub: 'Das Spiel eines anderen Landes', points: 'Punkte', noGl: '3D läuft auf diesem Gerät nicht 😕',
    auto: '📍 Dein Land: {c}', pinned: '✋ Von dir gewählt: {c}', useMine: '📍 Mein Land ({c})', voiceOff: 'Keine Stimme für diese Sprache, nur Sprechblasen',
  },
  fr: {
    roundOf: 'Tour {n} / {m}', aka: 'Aussi appelé', howto: '📖 Règles du jeu', resumed: '👋 Te revoilà ! On reprend le tour {n}', loading: 'Chargement de la chambre 3D…', you: 'Toi', play: '▶ Jouer', playSub: 'Assieds-toi avec les enfants',
    watch: '👀 Regarder', watchSub: 'Les quatre jouent tout seuls', rounds: 'Tours',
    chit: 'Voici ton papier !', chitTap: 'Touche pour l’ouvrir, ne le montre à personne 🤫', youAre: 'Tu es le {role} !', close: 'Touche pour fermer',
    accuse: '{icon} Tu es le {role} ! Qui est le {thief} ? Touche un enfant', second: 'Encore une chance ! Choisis un autre enfant',
    cheat: '🤫 Tricher', cheatSub: 'Regarder un rôle en douce', peekResult: 'Psst… {name} est {role} {emoji}',
    caught: 'Attrapé ! −{n} 😬', safe: 'Personne n’a rien vu 😏',
    nightClear: '🌙 {name} est innocent', nightThief: '🌙 {name} est le {thief} ! 😱',
    over: 'Partie terminée !', won: '{name} gagne ! 🏆', youWon: 'Tu gagnes ! 🎉', again: '🔁 Rejouer', againSub: 'Même pays, nouvelle partie',
    change: '🌏 Changer de pays', changeSub: 'Le jeu d’un autre pays', points: 'points', noGl: 'La 3D ne marche pas sur cet appareil 😕',
    auto: '📍 Ton pays : {c}', pinned: '✋ Choisi par toi : {c}', useMine: '📍 Mon pays ({c})', voiceOff: 'Pas de voix pour cette langue, bulles seulement',
  },
  pt: {
    roundOf: 'Rodada {n} / {m}', aka: 'Também chamado', howto: '📖 Como jogar', resumed: '👋 Voltou! Continuando a rodada {n}', loading: 'Carregando o quarto 3D…', you: 'Você', play: '▶ Jogar', playSub: 'Senta com a galera',
    watch: '👀 Só assistir', watchSub: 'Os quatro jogam sozinhos', rounds: 'Rodadas',
    chit: 'Chegou seu papelzinho!', chitTap: 'Toque para abrir, não mostra pra ninguém 🤫', youAre: 'Você é o {role}!', close: 'Toque para fechar',
    accuse: '{icon} Você é a {role}! Quem é o {thief}? Toque numa criança', second: 'Mais uma chance! Escolha outra criança',
    cheat: '🤫 Espiar', cheatSub: 'Ver um papel escondido', peekResult: 'Psiu… {name} é {role} {emoji}',
    caught: 'Pego! −{n} 😬', safe: 'Ninguém viu 😏',
    nightClear: '🌙 {name} é inocente', nightThief: '🌙 {name} é o {thief}! 😱',
    over: 'Fim de jogo!', won: '{name} ganhou! 🏆', youWon: 'Você ganhou! 🎉', again: '🔁 Jogar de novo', againSub: 'Mesmo país, nova partida',
    change: '🌏 Trocar país', changeSub: 'O jogo de outro país', points: 'pontos', noGl: '3D não funciona neste aparelho 😕',
    auto: '📍 Seu país: {c}', pinned: '✋ Você escolheu: {c}', useMine: '📍 Meu país ({c})', voiceOff: 'Sem voz para este idioma, só balões',
  },
  es: {
    roundOf: 'Ronda {n} / {m}', aka: 'También llamado', howto: '📖 Cómo jugar', resumed: '👋 ¡Volviste! Seguimos en la ronda {n}', loading: 'Cargando el cuarto 3D…', you: 'Tú', play: '▶ Jugar', playSub: 'Siéntate con los niños',
    watch: '👀 Solo ver', watchSub: 'Los cuatro juegan solos', rounds: 'Rondas',
    chit: '¡Llegó tu papelito!', chitTap: 'Toca para abrirlo, no se lo enseñes a nadie 🤫', youAre: '¡Eres el {role}!', close: 'Toca para cerrar',
    accuse: '{icon} ¡Eres la {role}! ¿Quién es el {thief}? Toca a un niño', second: '¡Otra oportunidad! Elige a otro niño',
    cheat: '🤫 Hacer trampa', cheatSub: 'Ver un papel a escondidas', peekResult: 'Psst… {name} es {role} {emoji}',
    caught: '¡Te cacharon! −{n} 😬', safe: 'Nadie se dio cuenta 😏',
    nightClear: '🌙 {name} es inocente', nightThief: '🌙 ¡{name} es el {thief}! 😱',
    over: '¡Se acabó!', won: '¡{name} gana! 🏆', youWon: '¡Ganaste! 🎉', again: '🔁 Otra partida', againSub: 'Mismo país, nueva partida',
    change: '🌏 Cambiar país', changeSub: 'El juego de otro país', points: 'puntos', noGl: 'El 3D no funciona en este aparato 😕',
    auto: '📍 Tu país: {c}', pinned: '✋ Lo elegiste tú: {c}', useMine: '📍 Mi país ({c})', voiceOff: 'No hay voz para este idioma, solo globos',
  },
};
UI.ja = {
  roundOf: 'ラウンド {n} / {m}', aka: 'べつの名前', howto: '📖 あそびかた', resumed: '👋 おかえり！ラウンド{n}のつづきから', loading: '3Dのへやを読みこみ中…', you: 'きみ', play: '▶ あそぶ', playSub: 'みんなといっしょにすわろう',
  watch: '👀 みるだけ', watchSub: '4人だけであそぶよ', rounds: 'ラウンド',
  chit: 'きみの紙がきたよ！', chitTap: 'タップしてひらこう、だれにも見せないで 🤫', youAre: 'きみは{role}！', close: 'タップしてとじる',
  accuse: '{icon} きみは{role}！{thief}はだれ？子どもをタップしよう', second: 'もう一回チャンス！ほかの子をえらぼう',
  cheat: '🤫 ズルする', cheatSub: 'こっそり一人の役を見る', peekResult: 'ないしょ… {name}は{role} {emoji}',
  caught: 'バレた！−{n} 😬', safe: 'だれも気づかなかった 😏',
  nightClear: '🌙 {name}は無実', nightThief: '🌙 {name}が{thief}だ！😱',
  over: 'しあい終了！', won: '{name}の勝ち！🏆', youWon: 'きみの勝ち！🎉', again: '🔁 もう一回', againSub: '同じ国でもう一度',
  change: '🌏 国をかえる', changeSub: 'ほかの国のゲーム', points: '点', noGl: 'このデバイスでは3Dが使えません 😕',
  auto: '📍 きみの国：{c}', pinned: '✋ えらんだ国：{c}', useMine: '📍 自分の国（{c}）', voiceOff: 'この言語の声がないので、ふきだしだけ',
};
UI.ko = {
  roundOf: '{n} / {m} 라운드', aka: '다른 이름', howto: '📖 게임 방법', resumed: '👋 다시 왔구나! {n}라운드 이어서 할게', loading: '3D 방 불러오는 중…', you: '나', play: '▶ 같이 하기', playSub: '친구들 옆에 앉아',
  watch: '👀 구경하기', watchSub: '네 명이 알아서 해', rounds: '라운드',
  chit: '네 종이가 왔어!', chitTap: '눌러서 펴 봐, 아무한테도 보여주지 마 🤫', youAre: '너는 {role}야!', close: '눌러서 닫기',
  accuse: '{icon} 너는 {role}야! {thief}는 누구? 친구를 눌러', second: '한 번 더! 다른 친구를 골라',
  cheat: '🤫 반칙', cheatSub: '몰래 한 명 역할 보기', peekResult: '쉿… {name}은(는) {role} {emoji}',
  caught: '걸렸다! −{n} 😬', safe: '아무도 못 봤어 😏',
  nightClear: '🌙 {name}은(는) 결백', nightThief: '🌙 {name}이(가) {thief}야! 😱',
  over: '게임 끝!', won: '{name} 승리! 🏆', youWon: '네가 이겼어! 🎉', again: '🔁 한 판 더', againSub: '같은 나라, 새 게임',
  change: '🌏 나라 바꾸기', changeSub: '다른 나라 게임', points: '점', noGl: '이 기기에서는 3D가 안 돼 😕',
  auto: '📍 너의 나라: {c}', pinned: '✋ 직접 고름: {c}', useMine: '📍 내 나라 ({c})', voiceOff: '이 언어 음성이 없어서 말풍선만 나와',
};
UI.zh = {
  roundOf: '第 {n} / {m} 回合', aka: '也叫', howto: '📖 玩法说明', resumed: '👋 欢迎回来！继续第{n}回合', loading: '正在加载3D房间…', you: '你', play: '▶ 一起玩', playSub: '和小伙伴们坐在一起',
  watch: '👀 只看', watchSub: '四个小朋友自己玩', rounds: '回合',
  chit: '你的纸条来了！', chitTap: '点一下打开，别给别人看 🤫', youAre: '你是{role}！', close: '点一下关闭',
  accuse: '{icon} 你是{role}！谁是{thief}？点一个小朋友', second: '再来一次机会！选另一个小朋友',
  cheat: '🤫 作弊', cheatSub: '偷看一个人的身份', peekResult: '嘘… {name}是{role} {emoji}',
  caught: '被发现了！−{n} 😬', safe: '没人发现 😏',
  nightClear: '🌙 {name}是无辜的', nightThief: '🌙 {name}就是{thief}！😱',
  over: '比赛结束！', won: '{name}赢了！🏆', youWon: '你赢了！🎉', again: '🔁 再来一局', againSub: '同一个国家，新的一局',
  change: '🌏 换国家', changeSub: '玩别的国家的游戏', points: '分', noGl: '这台设备不支持3D 😕',
  auto: '📍 你的国家：{c}', pinned: '✋ 你选的：{c}', useMine: '📍 我的国家（{c}）', voiceOff: '没有这种语言的声音，只有对话气泡',
};
const UI_FOR = {
  hinglish: 'sa', urdu: 'sa', nepali: 'sa', bangla: 'sa', russian: 'ru', german: 'de', french: 'fr', portuguese: 'pt', spanish: 'es',
  japanese_native: 'ja', korean_native: 'ko', chinese_native: 'zh',
};

// How each kind of line should sound
const EMOTION = {
  intro: 'excited', introReply: 'happy', deal: 'happy', waiting: 'neutral', banter: 'happy', pick: 'happy', peek: 'whisper',
  kingAnnounce: 'excited', askGuesser: 'happy', announce: 'excited', nervous: 'scared', outage: 'scared', restore: 'excited',
  night: 'whisper', victim: 'scared', saved: 'happy', notSaved: 'sad', thinking: 'sly', plead: 'scared',
  accuse: 'angry', accusedReply: 'scared', show: 'excited', guesserWin: 'excited', guesserLose: 'sad',
  thiefWin: 'excited', thiefLose: 'sad', royal: 'happy', nextRound: 'happy', winner: 'excited', loser: 'sad',
  cheatCaught: 'angry', cheatDeny: 'scared', cheatLaugh: 'excited', giggle: 'happy', tellNotice: 'sly', witness: 'whisper',
  checkThief: 'excited', checkClear: 'neutral', hint: 'sly', alibi: 'neutral', fine: 'happy', penalty: 'sad',
  steal: 'excited', missOnce: 'sad', secondTry: 'angry',
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

/* Lifetime stats for the human player (this device only). */
const STATS_KEY = 'chitplay.stats.v1';
function readStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY) || 'null');
    if (s && Number.isFinite(s.matches)) return s;
  } catch { /* storage blocked or corrupt */ }
  return { matches: 0, wins: 0, catches: 0, escapes: 0, best: 0, games: {} };
}
function recordStats({ won, score, catches, escapes, gameId }) {
  const s = readStats();
  s.matches++; if (won) s.wins++;
  s.catches += catches; s.escapes += escapes;
  s.best = Math.max(s.best || 0, score);
  s.games = s.games || {}; s.games[gameId] = (s.games[gameId] || 0) + 1;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}

/** Share the game (native share sheet on phones, clipboard elsewhere). */
async function shareGame({ title, text, url }) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared'; }
  } catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied'; } catch { /* clipboard blocked: try the old way */ }
  try {
    const ta = Object.assign(document.createElement('textarea'), { value: `${text} ${url}` });
    ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    return ok ? 'copied' : 'failed';
  } catch { return 'failed'; }
}

/* ─── Saved match (survives an accidental refresh) ─────────── */
const SAVE_KEY = 'chitplay.match3d.v1';
const SAVE_MAX_AGE = 7 * 24 * 3600 * 1000;
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1 && COUNTRIES[s.country] && Match.isValidSnapshot(s.match)
      && Array.isArray(s.players) && s.players.length === 4 && Date.now() - s.at < SAVE_MAX_AGE) return s;
  } catch {}
  return null;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }

/* Nearby Play: a friend's ticket back into the game after a dropped connection or a reload */
const REJOIN_KEY = 'chitplay.nearby.v1';
const REJOIN_MAX_AGE = 3 * 3600 * 1000;
const REJOIN_AFTER_DROP_MS = 120000;   // the page stayed open: keep trying for a while
const REJOIN_AFTER_LOAD_MS = 20000;    // a fresh page load may just be an old, finished game
function loadRejoin() {
  try {
    const s = JSON.parse(localStorage.getItem(REJOIN_KEY));
    if (s && isCode(s.code) && s.token && Date.now() - s.at < REJOIN_MAX_AGE) return s;
  } catch {}
  return null;
}
function saveRejoin(s) { try { localStorage.setItem(REJOIN_KEY, JSON.stringify({ ...s, at: Date.now() })); } catch {} }
function clearRejoin() { try { localStorage.removeItem(REJOIN_KEY); } catch {} }

/** ?join=123456 from an invite link or QR code */
function readUrlJoin() {
  try {
    const c = new URLSearchParams(location.search).get('join');
    return isCode(c) ? c : null;
  } catch { return null; }
}
function clearUrlJoin() {
  try {
    const url = new URL(location.href);
    if (!url.searchParams.has('join')) return;
    url.searchParams.delete('join');
    history.replaceState(null, '', url);
  } catch {}
}
function inviteUrl(code) {
  const url = new URL(location.href);
  url.search = `?join=${code}`;
  url.hash = '';
  return url.toString();
}

/** ?game=raja-rani-chor-police (or ?game=IN) and optional &lang=local|en */
function readUrlGame() {
  try {
    const q = new URLSearchParams(location.search);
    const g = (q.get('game') || '').trim();
    if (!g) return null;
    const id = COUNTRIES[g.toUpperCase()] ? g.toUpperCase() : Object.keys(GAME_SLUGS).find(k => GAME_SLUGS[k] === g.toLowerCase());
    if (!id) return null;
    const lang = q.get('lang');
    return { country: COUNTRIES[id], lang: lang === 'local' || lang === 'en' ? lang : null };
  } catch { return null; }
}
/** Keep the address bar shareable: ?game=<slug> for the chosen edition. */
function setUrlGame(c) {
  try {
    const url = new URL(location.href);
    if (url.searchParams.get('game') === GAME_SLUGS[c.id]) return;
    url.searchParams.set('game', GAME_SLUGS[c.id]);
    history.replaceState(null, '', url);
  } catch {}
}

/** Country to open with: the device's own country, unless the player pinned one. */
function startingCountry() {
  // every visit opens on the game of the country the player is in (Cops and Robbers elsewhere)
  const detected = COUNTRIES[detectCountryInfo().id] || COUNTRIES.US;
  return { country: detected, detected, pinned: false };
}

export function BachpanScreen({ transition }) {
  let alive = true;
  let world = null;
  const timers = new Set();
  let tapHandler = null;

  const sleep = (ms) => new Promise((resolve, reject) => {
    if (!alive) { reject(CANCEL); return; }
    const t = setTimeout(() => { timers.delete(t); alive ? resolve() : reject(CANCEL); }, ms);
    timers.add(t);
  });
  // a wait that never rejects (safe to lose a Promise.race)
  const idle = (ms) => new Promise((resolve) => {
    const t = setTimeout(() => { timers.delete(t); resolve(); }, ms);
    timers.add(t);
  });
  const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const others = (...ex) => [0, 1, 2, 3].filter(i => !ex.includes(i));

  const start = startingCountry();
  let base = start.country;                 // the raw edition
  let pinned = start.pinned;
  const detected = start.detected;
  const mode = 'en';                        // menus, rules and voices are always English
  // the kids' chat can be read in the player's own language (Latin letters); English by default
  let chatLang = CHAT_LANGUAGES.some(l => l.id === settingsStore.get('chatLang')) ? settingsStore.get('chatLang') : 'en';
  const chatPack = () => (chatLang === 'en' ? country.lang : chatLang);
  let country = localize(base, mode);       // the edition as shown in the current text mode
  const uiFor = () => UI.en;
  let ui = uiFor();
  let players = [];        // { name, color, isHuman (this phone), remote (a friend's phone id) }
  let match = null;
  let net = null;          // Nearby Play: { role: 'host', room } or { role: 'guest', room, seat }
  let guestTotals = [0, 0, 0, 0];
  const isHost = () => net?.role === 'host';
  const tell = (msg) => { if (isHost()) net.room.broadcast(msg); };
  const tellSeat = (seat, msg) => { const id = players[seat]?.remote; if (isHost() && id) net.room.send(id, msg); };
  // while one player decides, the other phones say who everybody is waiting for
  const noteOthers = (seat, text) => players.forEach((_, i) => { if (i !== seat) tellSeat(i, { t: 'note', text }); });
  // sounds go to every phone in a Nearby match
  const sfx = {
    play(n) { if (match) tell({ t: 'sfx', n }); audioManager.play(n); },
    fanStart() { tell({ t: 'fan', on: true }); audioManager.fanStart(); },
    fanStop() { tell({ t: 'fan', on: false }); audioManager.fanStop(); },
  };
  let talks = {};                           // one no-repeat memory per language, per match
  const roleNamesOf = (c) => ({
    king: c.roles.king.name, queen: c.roles.queen.name,
    det: c.roles.detective.name, thief: c.roles.thief.name,
    guesser: c.roles[c.rules.guesser].name,
  });
  // in the player's own language the roles keep this game's own names (Raja, Chor, Huángdì…)
  const latinNames = () => {
    const L = ROLE_LATIN[base.id];
    if (!L) return roleNamesOf(country);
    const slots = ['king', 'queen', 'detective', 'thief'];
    return { king: L[0], queen: L[1], det: L[2], thief: L[3], guesser: L[slots.indexOf(country.rules.guesser)] };
  };
  const namesFor = (pack) => (pack === country.lang ? roleNamesOf(country) : latinNames());
  const talkNow = () => { const p = chatPack(); return (talks[p] ||= new Dialogue(p, namesFor(p), country.lang)); };
  let onModeChange = null;                  // the start sheet re-renders itself on a switch

  /* ─── HUD ─────────────────────────────────────────────── */
  const roundEl = el('span', { className: 'bachpan__round' }, ['ChitPlay 3D']);
  const scoreRow = el('div', { className: 'bachpan__scores' });
  const prompt = el('div', { className: 'bachpan__prompt', attrs: { 'aria-live': 'polite' } });
  const toast = el('div', { className: 'bachpan__toast', attrs: { 'aria-live': 'polite' } });
  const sheet = el('div', { className: 'bachpan__sheet' });
  const iconBtn = (label, text, onClick) => el('button', { className: 'bachpan__exit', type: 'button', attrs: { 'aria-label': label }, onClick }, [text]);
  // ✕ is a deliberate "leave this match", unlike an accidental refresh
  const exitBtn = iconBtn('Back to start', '✕', () => { clearSave(); clearRejoin(); transition(GAME_PHASES.HOME); });
  const soundBtn = iconBtn('Toggle sound', settingsStore.get('soundEnabled') ? '🔊' : '🔇', () => {
    const next = !settingsStore.get('soundEnabled');
    settingsStore.set('soundEnabled', next);
    audioManager.setEnabled(next);
    if (next) { audioManager.unlock(); sfx.play('select'); }
    soundBtn.textContent = next ? '🔊' : '🔇';
  });
  const voiceOn = () => settingsStore.get('voiceEnabled') !== false;
  const voiceBtn = iconBtn('Toggle kid voices', voiceOn() ? '🗣️' : '🤐', () => {
    const next = !voiceOn();
    settingsStore.set('voiceEnabled', next);
    voiceBox.setEnabled(next);
    voiceBtn.textContent = next ? '🗣️' : '🤐';
  });
  voiceBox.setEnabled(voiceOn());

  /* ─── Mobile comfort: rotate to landscape, keep the screen awake, haptics ─── */
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  const isLandscape = () => window.matchMedia('(orientation: landscape)').matches;
  const rotateBtn = iconBtn('Rotate to landscape', '🔄', () => toggleLandscape());
  rotateBtn.classList.add('bachpan__rotate');
  rotateBtn.hidden = !isTouch;
  async function toggleLandscape() {
    haptic(15);
    const fs = document.fullscreenElement;
    try {
      if (fs && screen.orientation?.type?.startsWith('landscape')) {
        screen.orientation.unlock?.();
        await document.exitFullscreen?.();
        return;
      }
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
      await screen.orientation.lock('landscape');
    } catch {
      // iPhones (and some browsers) can't rotate for us: show a friendly nudge
      if (!isLandscape()) showRotateHint(true);
    }
  }
  const rotateHint = el('div', { className: 'bachpan__rotatehint', attrs: { 'aria-live': 'polite' } }, [
    el('span', { className: 'bachpan__rotatehint-phone', attrs: { 'aria-hidden': 'true' } }, ['📱']),
    el('span', {}, ['Turn your phone sideways for a bigger view']),
  ]);
  function showRotateHint(on) {
    rotateHint.classList.toggle('bachpan__rotatehint--show', !!on);
    clearTimeout(rotateHint._t);
    if (on) rotateHint._t = setTimeout(() => rotateHint.classList.remove('bachpan__rotatehint--show'), 3800);
  }
  window.matchMedia('(orientation: landscape)').addEventListener?.('change', (e) => { if (e.matches) showRotateHint(false); });

  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch {}
  }
  // a friend's phone has no match of its own, only a room
  const onVisible = () => { if (document.visibilityState === 'visible' && (match || net) && alive) keepAwake(true); };
  document.addEventListener('visibilitychange', onVisible);

  function haptic(pattern) {
    if (settingsStore.get('hapticsEnabled') === false) return;
    // browsers refuse (and log an error) until the first tap, e.g. a match resumed after a refresh
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }


  const screen = el('div', { className: 'screen bachpan', attrs: { 'aria-label': 'ChitPlay 3D' } }, [
    el('div', { className: 'bachpan__top' }, [exitBtn, roundEl, el('div', { className: 'bachpan__top-right' }, [rotateBtn, voiceBtn, soundBtn])]),
    scoreRow, prompt, toast, rotateHint, sheet,
  ]);
  screen.addEventListener('pointerdown', (e) => { if (tapHandler && e.target === screen) tapHandler(e); });

  function renderScores(gains = null) {
    clear(scoreRow);
    const totals = net?.role === 'guest' ? guestTotals : match?.totals;
    if (match) tell({ t: 'scores', totals: match.totals, gains });
    players.forEach((p, i) => {
      const gain = gains?.[i];
      scoreRow.appendChild(el('div', {
        className: `bachpan__score${p.isHuman ? ' bachpan__score--me' : ''}`,
        style: { '--chip': p.color },
      }, [
        el('span', { className: 'bachpan__score-name' }, [p.isHuman ? `${p.name} ⭐` : p.name]),
        el('span', { className: 'bachpan__score-pts' }, [String(totals?.[i] ?? 0)]),
        gain ? el('span', { className: `bachpan__gain${gain < 0 ? ' bachpan__gain--neg' : ''}` }, [gain > 0 ? `+${gain}` : String(gain)]) : null,
      ]));
    });
  }

  function setRound(text) {
    roundEl.textContent = text;
    if (match) tell({ t: 'round', text });
  }
  function showPrompt(text) {
    prompt.textContent = text || '';
    prompt.classList.toggle('bachpan__prompt--show', !!text);
  }
  function showToast(text, ms = 2600) {
    toast.textContent = text;
    toast.classList.add('bachpan__toast--show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('bachpan__toast--show'), ms);
  }

  /* ─── Speech (never repeats; kids are silent if a pool runs dry) ─── */
  // the browser's speech voice (the narrator borrows the deepest kid voice)
  function voice(seat, parts, emotion) {
    tell({ t: 'voice', seat, text: parts.text, emotion });
    return voiceBox.speak(seat === 'narrator' ? 2 : seat, parts.text, emotion);
  }

  function say(i, key, vars) {
    const talk = talkNow();
    const text = talk.line(key, vars);
    if (!text) return { dur: 0, done: Promise.resolve() };
    const dur = S().say(i, text);
    return { dur, done: voice(i, talk.last, EMOTION[key] || 'neutral') };
  }
  async function sayWait(i, key, vars, extra = 250) {
    const { dur, done } = say(i, key, vars);
    if (!dur) return;
    // wait for the voice to finish, but never less than the bubble needs, and never forever
    await Promise.race([
      Promise.all([done, idle(dur * 0.6)]),
      idle(Math.max(dur * 0.75, 7000)),
    ]);
    if (!alive) throw CANCEL;
    await sleep(extra);
  }
  async function narrate(key, vars, { parent = false, wait = 1800 } = {}) {
    const talk = talkNow();
    const text = talk.line(key, vars);
    if (!text) return;
    S().narrate(parent ? `${country.parent}: ${text}` : text);
    // the narrator / parent voice (falls back to the deepest kid voice, a little slower)
    voice('narrator', talk.last, parent ? 'sad' : 'whisper');
    await sleep(wait);
  }
  // In a Nearby match every 3D story call is replayed on the friends' phones too
  const LOCAL_ONLY = new Set(['kidAt', 'country', 'active']);
  let mirror = null;
  let dark = null;   // 'power' or 'night' while the room is dark, so a returning phone matches it
  const S = () => {
    if (!isHost()) return world.story;
    return (mirror ||= new Proxy(world.story, {
      get(t, k) {
        const v = t[k];
        if (typeof v !== 'function' || LOCAL_ONLY.has(k)) return v;
        return (...a) => {
          if (k === 'begin') dark = null;
          if (k === 'power') dark = a[0] ? null : 'power';
          if (k === 'night') dark = a[0] ? 'night' : null;
          tell({ t: 'story', m: k, a: k === 'setCountry' ? [base.id] : a });
          return v.apply(t, a);
        };
      },
    }));
  };
  const act = (i, pose, emoji, mood) => {
    if (pose) S().pose(i, pose);
    if (emoji) S().emote(i, emoji, 2.2);
    if (mood) S().mood(i, mood, 2.5);
  };

  /* ─── Start sheet: swipe through the games, then play ─── */
  function chooseSetup() {
    return new Promise((resolve) => {
      const order = [detected.id, ...COUNTRY_ORDER.filter(id => id !== detected.id)];  // own game first
      setRound('🎬 ChitPlay');
      clear(sheet);
      sheet.className = 'bachpan__sheet bachpan__sheet--show bachpan__sheet--start';

      // 1) The game carousel: one big card per game, swipe (or ‹ ›) to the next
      const cards = new Map();
      const track = el('div', { className: 'bachpan__carousel', attrs: { role: 'listbox', 'aria-label': 'Choose a game', tabindex: '0' } },
        order.map((id) => {
          const g = COUNTRIES[id];
          const card = el('button', {
            className: 'bachpan__bigcard', type: 'button',
            style: { '--accent': g.theme.wall[1], '--accent2': g.roles.king.color },
            attrs: { role: 'option', 'aria-label': GAME_NAME_EN[id], 'data-id': id },
            onClick: () => { if (id !== base.id) centerOn(id, true); },
          }, [
            id === detected.id ? el('span', { className: 'bachpan__bigcard-badge' }, ['⭐ Your game']) : null,
            el('span', { className: 'bachpan__bigcard-icon', attrs: { 'aria-hidden': 'true' } }, [GAME_ICON[id]]),
            el('strong', { className: 'bachpan__bigcard-name' }, [GAME_NAME_EN[id]]),
            el('span', { className: 'bachpan__bigcard-roles' }, [(ROLE_LATIN[id] || []).join(' · ')]),
          ]);
          cards.set(id, card);
          return card;
        }));
      const arrow = (dir, label) => el('button', {
        className: `bachpan__arrow bachpan__arrow--${dir < 0 ? 'prev' : 'next'}`, type: 'button',
        attrs: { 'aria-label': label }, onClick: () => step(dir),
      }, [dir < 0 ? '‹' : '›']);
      const dots = el('div', { className: 'bachpan__dots', attrs: { 'aria-hidden': 'true' } }, order.map(id => el('span', { attrs: { 'data-id': id } })));
      const carousel = el('div', { className: 'bachpan__carouselwrap' }, [arrow(-1, 'Previous game'), track, arrow(1, 'Next game')]);

      // 2) Everything about the chosen game (re-filled on every swipe)
      const details = el('div', { className: 'bachpan__chosen' });

      // 3) Start buttons + options (built once)
      const opt = (label, sub, value, primary) => el('button', {
        className: `bachpan__choice${primary ? ' bachpan__choice--primary' : ''}`, type: 'button',
        onClick: () => {
          audioManager.unlock(); sfx.play('select'); haptic(15);
          document.removeEventListener('keydown', onKey);
          sheet.className = 'bachpan__sheet'; onModeChange = null; resolve(value);
        },
      }, [el('strong', {}, [label]), el('span', {}, [sub])]);
      const roundsNow = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : 5);
      const rounds = el('div', { className: 'bachpan__rounds' }, [
        el('span', {}, [ui.rounds]),
        ...ROUND_OPTIONS.map(n => el('button', {
          className: `bachpan__pill${n === roundsNow() ? ' bachpan__pill--on' : ''}`, type: 'button', attrs: { 'data-n': String(n) },
          onClick: () => {
            settingsStore.set('matchRounds', n);
            rounds.querySelectorAll('.bachpan__pill').forEach(p => p.classList.toggle('bachpan__pill--on', p.dataset.n === String(n)));
          },
        }, [String(n)])),
      ]);
      const chatSelect = el('select', {
        className: 'bachpan__select', attrs: { 'aria-label': 'Chat language' },
        onChange: (e) => { chatLang = e.target.value; settingsStore.set('chatLang', chatLang); loadPack(chatPack()); },
      }, CHAT_LANGUAGES.map(l => el('option', { attrs: { value: l.id, ...(l.id === chatLang ? { selected: 'selected' } : {}) } }, [l.label])));
      const chat = el('label', { className: 'bachpan__chatlang' }, [el('span', {}, ['🗣️ Chat']), chatSelect]);

      const st = readStats();
      sheet.append(
        carousel,
        dots,
        details,
        ...(st.matches > 0 ? [el('p', { className: 'bachpan__stats' }, [fmt(ui.statsLine, { w: st.wins, m: st.matches, b: st.best })])] : []),
        el('div', { className: 'bachpan__modes' }, [opt(ui.play, ui.playSub, 'play', true), opt(ui.watch, ui.watchSub, 'watch', false)]),
        el('div', { className: 'bachpan__modes bachpan__modes--one' }, [opt(ui.nearby, ui.nearbySub, 'nearby', false)]),
        el('div', { className: 'bachpan__row' }, [rounds, chat]),
      );

      function fillDetails() {
        clear(details);
        const roles = el('div', { className: 'bachpan__roles' }, ['king', 'queen', 'detective', 'thief'].map((slot, i) => {
          const r = country.roles[slot];
          const own = ROLE_LATIN[base.id]?.[i] || r.name;
          const meaning = own.toLowerCase() === r.name.toLowerCase() ? null : r.name;
          return el('span', { className: 'bachpan__role', style: { '--chip': r.color } }, [
            `${r.emoji} ${own}`, meaning ? el('em', {}, [meaning]) : null,
            el('small', {}, [slot === 'thief' ? '0 / ?' : String(r.points)]),
          ]);
        }));
        details.append(
          el('h2', { className: 'bachpan__title sr-only' }, [country.game]),
          roles,
          el('details', { className: 'bachpan__about' }, [
            el('summary', {}, [ui.howto || '📖 How to play']),
            el('p', { className: 'bachpan__sub' }, [country.ruleText]),
            el('p', { className: 'bachpan__aka' }, [
              `${(GAME_AKA[base.id] || []).slice(0, 5).join(' · ')} · `,
              el('a', { className: 'bachpan__howto', attrs: { href: `games/${GAME_SLUGS[base.id]}/` } }, ['→']),
            ]),
            seoIntro,
          ]),
          // always visible, so visitors and ad-network reviewers can find these pages
          el('nav', { className: 'bachpan__legal', attrs: { 'aria-label': 'About ChitPlay' } }, [
            ['about/', 'About'], ['contact/', 'Contact'], ['privacy/', 'Privacy'], ['terms/', 'Terms'],
          ].map(([href, label]) => el('a', { attrs: { href } }, [label]))),
        );
      }

      function select(id) {
        base = COUNTRIES[id];
        country = localize(base, mode);
        ui = uiFor();
        voiceBox.setLanguages(country.voice);
        // the start sheet shows instantly; the 3D room catches up when it's loaded
        world?.story?.setCountry(country);
        world?.story?.preview(country.kids);
        // a plain visit keeps its clean / address: analytics counts a rewrite as a second page view
        if (base.id !== detected.id || new URLSearchParams(location.search).has('game')) setUrlGame(base);
        loadPack(chatPack());
        cards.forEach((c, cid) => { c.classList.toggle('bachpan__bigcard--on', cid === id); c.setAttribute('aria-selected', String(cid === id)); });
        dots.querySelectorAll('span').forEach(d => d.classList.toggle('on', d.dataset.id === id));
        fillDetails();
      }

      function centerOn(id, smooth) {
        const card = cards.get(id);
        if (!card) return;
        // 'instant', not 'auto': the track's CSS is scroll-behavior:smooth, and a slow opening glide
        // would let the scroll handler below pick a card it merely passes through
        track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: smooth ? 'smooth' : 'instant' });
        if (!smooth) select(id);
      }
      function step(dir) {
        const i = order.indexOf(base.id);
        const next = order[(i + dir + order.length) % order.length];
        haptic(10);
        centerOn(next, true);
      }
      // whichever card ends up in the middle after a swipe becomes the game
      let scrollTimer = 0;
      track.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const mid = track.scrollLeft + track.clientWidth / 2;
          let best = null, bestD = Infinity;
          cards.forEach((c, id) => { const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < bestD) { bestD = d; best = id; } });
          if (best && best !== base.id) { sfx.play('select'); haptic(8); select(best); }
        }, 110);
      }, { passive: true });
      const onKey = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      };
      document.addEventListener('keydown', onKey);

      onModeChange = () => select(base.id);
      requestAnimationFrame(() => centerOn(base.id, false));
    });
  }

  /* ─── Human interactions ──────────────────────────────── */
  function humanPeek(slot) {
    return new Promise((resolve) => {
      const r = country.roles[slot];
      clear(sheet);
      sheet.className = 'bachpan__sheet bachpan__sheet--show';
      let opened = false;
      let auto;
      const card = el('button', { className: 'bachpan__chit', type: 'button' }, [
        el('span', { className: 'bachpan__chit-emoji' }, ['📜']),
        el('strong', {}, [ui.chit]),
        el('span', {}, [ui.chitTap]),
      ]);
      const close = () => {
        clearTimeout(auto);
        // something newer took over the sheet (e.g. "Reconnecting…"): leave it alone
        if (card.isConnected) { sheet.className = 'bachpan__sheet'; clear(sheet); }
        resolve();
      };
      card.addEventListener('click', () => {
        if (opened) { close(); return; }
        opened = true;
        haptic(25);
        sfx.play('chit-unfold');
        card.classList.add('bachpan__chit--open');
        card.style.setProperty('--role', r.color);
        clear(card);
        const pts = slot === 'thief' ? `0 / ${country.rules.escape ?? country.roles[country.rules.guesser].points}` : String(r.points);
        card.append(
          el('span', { className: 'bachpan__chit-emoji' }, [r.emoji]),
          el('strong', {}, [fmt(ui.youAre, { role: r.name })]),
          el('span', {}, [`${pts} ${ui.points}`]),
          el('em', {}, [ui.close]),
        );
        sfx.play('reveal');
        clearTimeout(auto);
        auto = setTimeout(close, 5000);
      });
      auto = setTimeout(() => card.click(), 9000);
      sheet.appendChild(card);
    });
  }

  /** Someone notices the cheating: accusation, denial, teasing. */
  async function cheatCaughtScene(h) {
    const catcher = pickOne(others(h));
    haptic([60, 40, 60]);
    S().look(catcher, h);
    act(catcher, 'point', '💢', 'angry');
    await sayWait(catcher, 'cheatCaught', {}, 150);
    act(h, 'deny', '💧', 'worried');
    await sayWait(h, 'cheatDeny', {}, 150);
    const teaser = pickOne(others(h, catcher));
    act(teaser, 'laugh', '😂');
    say(teaser, 'cheatLaugh');
    sfx.play('wrong');
    const caughtText = `${players[h].isHuman ? '' : `${players[h].name}: `}${fmt(ui.caught, { n: CHEAT_PENALTY })}`;
    showToast(caughtText, 2600);
    tell({ t: 'toast', text: `${players[h].name}: ${fmt(ui.caught, { n: CHEAT_PENALTY })}`, ms: 2600 });
    renderScores({ [h]: -CHEAT_PENALTY });
    await sleep(1200);
    others(h).forEach(i => S().pose(i, 'nervous'));
    S().pose(h, 'think');
  }

  function humanAccuse(allowed, text, { canCheat = false } = {}) {
    return new Promise((resolve) => {
      let pool = allowed.slice();
      let busy = false;
      const h = HUMAN_SEAT;
      const done = (idx) => {
        if (busy || !pool.includes(idx)) return;
        tapHandler = null;
        showPrompt('');
        noteOthers(h, '');
        sheet.className = 'bachpan__sheet';
        clear(sheet);
        sfx.play('confirm');
        resolve(idx);
      };
      const renderChips = () => {
        clear(sheet);
        sheet.className = 'bachpan__sheet bachpan__sheet--show bachpan__sheet--chips';
        pool.forEach(i => {
          sheet.appendChild(el('button', {
            className: 'bachpan__suspect', type: 'button',
            style: { '--chip': players[i].color }, onClick: () => done(i),
          }, [players[i].name]));
        });
        if (canCheat && !match.cheated && pool.some(s => s !== match.thief)) {
          sheet.appendChild(el('button', {
            className: 'bachpan__cheat', type: 'button',
            attrs: { title: ui.cheatSub },
            onClick: async () => {
              if (busy) return;
              busy = true;
              const res = match.cheat();
              if (!res) { busy = false; return; }
              saveGame('inRound');   // refreshing can't undo a cheat (or its fine)
              sfx.play('select');
              S().sneak(h, res.seat);
              S().emote(h, '🤫', 2);
              const role = country.roles[res.slot];
              showToast(fmt(ui.peekResult, { name: players[res.seat].name, role: role.name, emoji: role.emoji }), 4200);
              pool = pool.filter(s => s !== res.seat);
              renderChips();
              await sleep(1600).catch(() => {});
              if (res.caught && alive) await cheatCaughtScene(h).catch(() => {});
              else if (alive) { showToast(ui.safe, 1800); S().pose(h, 'think'); }
              busy = false;
              if (pool.length === 1) showPrompt(text);
            },
          }, [el('strong', {}, [ui.cheat]), el('span', {}, [ui.cheatSub])]));
        }
      };
      showPrompt(text);
      noteOthers(h, fmt(ui.choosing, { name: players[h].name }));
      tapHandler = (e) => done(S().kidAt(e.clientX, e.clientY));
      renderChips();
    });
  }

  /* ─── Nearby Play: the host waits for a friend's phone ───── */
  const pending = new Map();   // seat -> { type, allowed?, resolve, fallback, busy }
  function ask(seat, msg, type, { timeout, fallback, ...extra }) {
    return new Promise((resolve) => {
      const done = (v) => {
        if (pending.get(seat)?.resolve !== finish) return;
        pending.delete(seat);
        clearTimeout(timer);
        resolve(v);
      };
      const finish = done;
      const timer = setTimeout(() => { tellSeat(seat, { t: 'cancelAsk' }); done(fallback()); }, timeout);
      pending.set(seat, { type, resolve: finish, fallback, ...extra });
      tellSeat(seat, msg);
    });
  }
  // a friend opens their own chit on their own phone
  const remotePeek = (seat, slot) => ask(seat, { t: 'peek', slot }, 'peek', { timeout: 15000, fallback: () => null });

  function remoteAccuse(seat, allowed, text, { canCheat = false } = {}) {
    const fallback = () => match.aiGuess(match.suspects().filter(s => !allowed.includes(s) && s !== match.guesser));
    if (!players[seat].remote) return Promise.resolve(fallback());   // they dropped earlier this round
    const waitText = fmt(ui.choosing, { name: players[seat].name });
    showPrompt(waitText);
    noteOthers(seat, waitText);
    const cheatOk = canCheat && !match.cheated && allowed.some(s => s !== match.thief);
    return ask(seat, { t: 'accuse', allowed, text, canCheat: cheatOk }, 'accuse', {
      timeout: 90000, allowed: allowed.slice(), canCheat: cheatOk, fallback,
    }).then((idx) => { showPrompt(''); noteOthers(seat, ''); return idx; });
  }

  async function onGuestMessage(id, msg) {
    const seat = players.findIndex(p => p.remote === id);
    const job = pending.get(seat);
    if (seat < 0 || !job) return;
    if (msg.t === 'peeked' && job.type === 'peek') job.resolve(null);
    else if (msg.t === 'accused' && job.type === 'accuse' && !job.busy && job.allowed.includes(msg.idx)) {
      sfx.play('confirm');
      job.resolve(msg.idx);
    } else if (msg.t === 'cheat' && job.type === 'accuse' && job.canCheat && !job.busy) {
      job.busy = true;
      job.canCheat = false;
      const res = match.cheat();
      if (!res) { job.busy = false; tellSeat(seat, { t: 'cheatDone' }); return; }
      sfx.play('select');
      S().sneak(seat, res.seat);
      S().emote(seat, '🤫', 2);
      const role = country.roles[res.slot];
      tellSeat(seat, { t: 'cheatResult', seat: res.seat, text: fmt(ui.peekResult, { name: players[res.seat].name, role: role.name, emoji: role.emoji }) });
      job.allowed = job.allowed.filter(s => s !== res.seat);
      await sleep(1600).catch(() => {});
      if (res.caught && alive) await cheatCaughtScene(seat).catch(() => {});
      else if (alive) { tellSeat(seat, { t: 'toast', text: ui.safe, ms: 1800 }); S().pose(seat, 'think'); }
      job.busy = false;
      tellSeat(seat, { t: 'cheatDone' });
    }
  }

  // a friend's phone dropped: a computer kid takes their seat
  function onGuestLeave(id, name) {
    const seat = players.findIndex(p => p.remote === id || p.back === id);
    if (seat < 0) return;
    const wasPlaying = players[seat].remote === id;
    players[seat].remote = null;
    players[seat].back = null;
    const job = wasPlaying ? pending.get(seat) : null;
    if (job) job.resolve(job.fallback());
    const text = fmt(ui.left, { name: players[seat].name || name });
    showToast(text, 3200);
    tell({ t: 'toast', text, ms: 3200 });
  }

  // a friend's phone came back: bring it up to date; its seat returns at the next round,
  // because the computer kid already holds this round's chit
  function onGuestBack(id, token) {
    const room = net.room;
    const seat = net.seats.findIndex(s => s.token === token);
    room.send(id, { t: 'lobby', rejoin: true, host: net.name, game: base.id, rounds: match?.rounds || 0, players: [] });
    if (seat < 0 || !match || !players[seat]) return;   // still starting: startMatch will include them
    players[seat].back = id;
    room.send(id, { t: 'start', rejoin: true, game: base.id, rounds: match.rounds, seat, players: players.map(x => ({ name: x.name })) });
    room.send(id, { t: 'story', m: 'begin', a: [] });
    if (dark) room.send(id, { t: 'story', m: dark, a: [dark === 'night'] });
    room.send(id, { t: 'round', text: roundEl.textContent });
    room.send(id, { t: 'scores', totals: match.totals });
    if (net.lastEnd) room.send(id, { t: 'end', ...net.lastEnd });
    const text = fmt(ui.rejoined, { name: players[seat].name });
    showToast(text, 3200);
    players.forEach((p, i) => { if (i !== seat) tellSeat(i, { t: 'toast', text, ms: 3200 }); });
  }

  /* ─── Nearby Play on a friend's phone: replay what the host sends ─── */
  function guestAccuse({ allowed, text, canCheat }) {
    let pool = allowed.slice();
    let locked = false;
    const pick = (idx) => {
      if (locked || !pool.includes(idx)) return;
      tapHandler = null; showPrompt(''); sheet.className = 'bachpan__sheet'; clear(sheet);
      audioManager.play('confirm');
      net?.room.send({ t: 'accused', idx });
      guestAsk = null;
    };
    const render = () => {
      clear(sheet);
      sheet.className = 'bachpan__sheet bachpan__sheet--show bachpan__sheet--chips';
      pool.forEach(i => sheet.appendChild(el('button', {
        className: 'bachpan__suspect', type: 'button', style: { '--chip': players[i].color }, onClick: () => pick(i),
      }, [players[i].name])));
      if (canCheat) {
        sheet.appendChild(el('button', {
          className: 'bachpan__cheat', type: 'button', attrs: { title: ui.cheatSub },
          onClick: () => { if (locked) return; locked = true; canCheat = false; audioManager.play('select'); net?.room.send({ t: 'cheat' }); render(); },
        }, [el('strong', {}, [ui.cheat]), el('span', {}, [ui.cheatSub])]));
      }
    };
    guestAsk = {
      cheatResult(m) { pool = pool.filter(s => s !== m.seat); showToast(m.text, 4200); render(); },
      cheatDone() { locked = false; showPrompt(text); },
      cancel() { tapHandler = null; showPrompt(''); sheet.className = 'bachpan__sheet'; clear(sheet); guestAsk = null; },
    };
    haptic([20, 30, 20]);
    showPrompt(text);
    tapHandler = (e) => pick(world.story.kidAt(e.clientX, e.clientY));
    render();
  }
  let guestAsk = null;

  function guestStart(m) {
    S().stopCelebrate?.();
    base = COUNTRIES[m.game] || COUNTRIES.US;
    country = localize(base, mode);
    ui = uiFor();
    net.seat = m.seat;
    players = m.players.map((p, i) => ({ name: String(p.name).slice(0, 16), color: SHIRTS[i], isHuman: i === m.seat, remote: null }));
    guestTotals = [0, 0, 0, 0];
    clear(sheet); sheet.className = 'bachpan__sheet'; showPrompt('');
    voiceBox.setLanguages(country.voice);
    world.story.setCountry(country);
    renderScores();
    keepAwake(true);
    if (isTouch && !isLandscape()) setTimeout(() => { if (alive && !isLandscape()) showRotateHint(true); }, 2500);
  }

  function guestApply(m) {
    const st = world.story;
    switch (m.t) {
      case 'start': guestStart(m); if (m.rejoin) showToast(ui.backNext, 4200); break;
      case 'story': {
        if (m.m === 'setCountry') { st.setCountry(localize(COUNTRIES[m.a[0]] || base, mode)); break; }
        if (m.m === 'begin') {
          // the host's own labels say "(You)" about the host, so each phone writes its own
          st.begin(players.map(p => ({ name: p.name, color: p.color, isHuman: p.isHuman, label: p.isHuman ? `${p.name} (${ui.you})` : p.name })));
          break;
        }
        if (typeof st[m.m] === 'function' && !LOCAL_ONLY.has(m.m)) st[m.m](...(Array.isArray(m.a) ? m.a : []));
        break;
      }
      case 'voice': voiceBox.speak(m.seat === 'narrator' ? 2 : m.seat, String(m.text || ''), m.emotion); break;
      case 'sfx': audioManager.play(m.n); break;
      case 'fan': if (m.on) audioManager.fanStart(); else audioManager.fanStop(); break;
      case 'round': roundEl.textContent = m.text; break;
      case 'scores': guestTotals = m.totals.slice(); renderScores(m.gains); break;
      case 'toast': showToast(m.text, m.ms || 2600); break;
      case 'note': showPrompt(String(m.text || '')); break;
      case 'peek': humanPeek(m.slot).then(() => net?.room.send({ t: 'peeked' })); haptic(25); break;
      case 'accuse': guestAccuse(m); break;
      case 'cheatResult': guestAsk?.cheatResult(m); break;
      case 'cheatDone': guestAsk?.cheatDone(); break;
      case 'cancelAsk': guestAsk?.cancel(); break;
      case 'end': setRound(`🏆 ${ui.over}`); keepAwake(false); showEnd(m); break;
      default: break;
    }
  }

  /* ─── Nearby Play lobby ─────────────────────────────────── */
  const myName = () => {
    const n = settingsStore.get('playerName') || '';
    return /^Player-/.test(n) ? '' : n.slice(0, 12);
  };
  /**
   * Resolves 'host' (room open, Start pressed), 'guest' (joined; the host drives from here) or 'back'.
   * Opens on the normal menu, on the join page for an invite link (code) or on "Reconnecting…" (rejoin).
   */
  function nearbyFlow({ code: linkCode = null, rejoin = null } = {}) {
    return new Promise((resolve) => {
      const nameInput = el('input', {
        className: 'bachpan__input', attrs: { type: 'text', maxlength: '12', placeholder: ui.yourName, 'aria-label': ui.yourName, autocomplete: 'nickname', enterkeyhint: 'done' },
        value: myName(),
      });
      const nameNow = () => {
        const n = nameInput.value.trim().slice(0, 12);
        if (n) settingsStore.set('playerName', n);
        return n;   // no name: the host is "Host", a friend gets "Player 2" and so on, never "You" on other phones
      };
      const rounds = () => (ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : 5);
      const big = (label, sub, onClick, primary) => el('button', {
        className: `bachpan__choice${primary ? ' bachpan__choice--primary' : ''}`, type: 'button', onClick,
      }, [el('strong', {}, [label]), el('span', {}, [sub])]);
      const backBtn = (fn) => el('button', { className: 'bachpan__back', type: 'button', onClick: fn }, [ui.back]);
      const status = el('p', { className: 'bachpan__netstatus', attrs: { 'aria-live': 'polite' } });
      const page = (...kids) => {
        clear(sheet);
        sheet.className = 'bachpan__sheet bachpan__sheet--show bachpan__sheet--start bachpan__sheet--nearby';
        sheet.append(...kids.filter(Boolean));
      };

      function menu() {
        status.textContent = '';
        page(
          el('h2', { className: 'bachpan__title' }, [ui.nearby]),
          el('p', { className: 'bachpan__sub' }, [ui.nearbySub]),
          el('label', { className: 'bachpan__field' }, [el('span', {}, [ui.yourName]), nameInput]),
          big(ui.host, fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() }), hostLobby, true),
          big(ui.join, ui.joinSub, () => joinPage()),
          el('p', { className: 'bachpan__netnote' }, [ui.nearbyNote]),
          backBtn(() => resolve('back')),
        );
      }

      async function hostLobby() {
        const name = nameNow() || ui.hostName;
        const codeEl = el('div', { className: 'bachpan__code', attrs: { 'aria-label': ui.codeIs } }, ['······']);
        const list = el('ol', { className: 'bachpan__lobby' });
        const qrBox = el('div', { className: 'bachpan__qr' });
        const inviteSub = el('span', {}, [ui.inviteSub]);
        const inviteBtn = el('button', { className: 'bachpan__choice', type: 'button', onClick: async () => {
          const r = await shareGame({ title: 'ChitPlay', text: fmt(ui.inviteText, { code: room.code }), url: inviteUrl(room.code) });
          if (r === 'copied') inviteSub.textContent = ui.copied;
          else if (r === 'failed') inviteSub.textContent = inviteUrl(room.code);
        } }, [el('strong', {}, [ui.invite]), inviteSub]);
        inviteBtn.hidden = true;
        const startBtn = big(ui.startNeedOne, GAME_NAME_EN[base.id], () => {
          if (!room.guests.size) return;
          // each friend keeps this seat for the whole room, even if their phone drops
          net.seats = room.list.slice(0, 3).map(g => ({ token: g.token, name: g.name }));
          room.lock();
          resolve('host');
        }, true);
        startBtn.disabled = true;
        const room = new NearbyHost({
          onChange: () => paint(),
          onMessage: (id, msg) => onGuestMessage(id, msg),
          onLeave: (id, gname) => onGuestLeave(id, gname),
          onRejoin: (id, token) => onGuestBack(id, token),
        });
        net = { role: 'host', room, name, seats: [], lastEnd: null };
        const paint = () => {
          if (room.locked) return;   // the lobby is over: never paint it on friends' phones mid-match
          clear(list);
          const g = room.list;
          list.append(el('li', { className: 'bachpan__lobby-me' }, [`⭐ ${name} ${ui.youHost}`]));
          for (let i = 0; i < 3; i++) {
            list.append(el('li', { className: g[i] ? 'on' : '' }, [g[i] ? `✅ ${g[i].name}` : (i === g.length ? ui.waiting : ui.bot)]));
          }
          const n = g.length + 1;
          startBtn.disabled = g.length === 0;
          startBtn.querySelector('strong').textContent = g.length ? fmt(ui.startN, { n }) : ui.startNeedOne;
          if (g.length) haptic(15);
          room.broadcast({ t: 'lobby', host: name, game: base.id, rounds: rounds(), players: [name, ...g.map(x => x.name)] });
        };
        page(
          el('h2', { className: 'bachpan__title' }, [ui.host]),
          el('p', { className: 'bachpan__sub' }, [fmt(ui.hostSub, { game: GAME_NAME_EN[base.id], n: rounds() })]),
          el('p', { className: 'bachpan__codelabel' }, [ui.codeIs]),
          codeEl,
          qrBox,
          el('p', { className: 'bachpan__netnote' }, [ui.codeHelp]),
          inviteBtn,
          list,
          status,
          startBtn,
          backBtn(() => { room.close(); net = null; menu(); }),
        );
        paint();
        status.textContent = ui.connecting;
        try {
          const code = await room.open();
          if (net?.room !== room) return;   // Back was pressed while connecting
          codeEl.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
          status.textContent = '';
          inviteBtn.hidden = false;
          keepAwake(true);
          import('../../net/qr.js?v=20261110-nearby3').then(({ qrSvg }) => {
            const svg = qrSvg(inviteUrl(code), ui.qrLabel);
            if (svg) qrBox.append(svg);
          }).catch(() => {});   // no QR: the link and the code still work
        } catch (e) {
          if (net?.room !== room) return;
          room.close();
          net = null;
          status.textContent = nearbyError(e);
          codeEl.textContent = '✕';
        }
      }

      /** A friend's room: keeps playing what the host sends; a dropped connection tries to come back. */
      function guestRoom(code, token, name) {
        let started = false;
        return new NearbyGuest({
          onMessage: (m) => {
            if (m.t === 'lobby') { if (!started && !m.rejoin) waitingPaint(m); return; }
            if (m.t === 'start' && !started) { started = true; resolve('guest'); }
            guestQueue(m);
          },
          onClose: (reason) => {
            if (reason === 'lost') {
              tapHandler = null;
              showPrompt('');
              guestAsk = null;
              nearbyFlow({ rejoin: { code, token, name, ms: REJOIN_AFTER_DROP_MS } });
              return;
            }
            clearRejoin();
            showToast(reason === 'host-left' || reason === 'kicked' ? ui.hostLeft : ui.lostConn, 3500);
            setTimeout(() => { if (alive) transition(GAME_PHASES.HOME); }, 2600);
          },
        });
      }

      function rejoinPage({ code, token, name, ms = REJOIN_AFTER_LOAD_MS }) {
        const until = Date.now() + ms;
        let stop = false;
        const leave = () => {
          stop = true;
          clearRejoin();
          net?.room.close();
          net = null;
          transition(GAME_PHASES.HOME);
        };
        page(
          el('h2', { className: 'bachpan__title' }, [ui.reconnecting]),
          el('p', { className: 'bachpan__sub' }, [ui.reconnectSub]),
          el('button', { className: 'bachpan__back', type: 'button', onClick: leave }, [ui.leave]),
        );
        keepAwake(true);
        (async () => {
          while (alive && !stop) {
            const room = guestRoom(code, token, name);
            net = { role: 'guest', room, seat: -1 };
            try {
              const lobby = await room.join(code, name, token);
              if (net?.room !== room) return;
              saveRejoin({ code, token, name });
              clearUrlJoin();
              if (!lobby.rejoin) waitingPaint(lobby);   // the match hadn't started yet: back in the lobby
              haptic([20, 40, 20]);
              return;
            } catch (e) {
              if (net?.room !== room) return;
              net = null;
              if (['started', 'full', 'kicked'].includes(e?.type) || Date.now() > until) {
                clearRejoin();
                showToast(ui.rejoinFail, 3500);
                setTimeout(() => { if (alive) transition(GAME_PHASES.HOME); }, 2600);
                return;
              }
              await idle(3000);
            }
          }
        })();
      }

      function joinPage(prefill = null) {
        nameNow();
        const codeInput = el('input', {
          className: 'bachpan__input bachpan__input--code',
          attrs: { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '7', placeholder: '000 000', 'aria-label': ui.enterCode, autocomplete: 'one-time-code', enterkeyhint: 'go' },
          value: isCode(prefill) ? `${prefill.slice(0, 3)} ${prefill.slice(3)}` : '',
        });
        const go = big(ui.joinBtn, ui.joinSub, () => connect(), true);
        let busy = false;
        codeInput.addEventListener('input', () => {
          const d = codeInput.value.replace(/\D/g, '').slice(0, 6);
          codeInput.value = d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
          if (d.length === 6) connect();
        });
        codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
        async function connect() {
          const code = codeInput.value.replace(/\D/g, '');
          if (busy || !isCode(code)) { if (!isCode(code)) status.textContent = ui.enterCode; return; }
          busy = true;
          go.disabled = true;
          status.textContent = ui.connecting;
          audioManager.unlock();
          const name = nameNow();
          const saved = loadRejoin();
          const token = saved?.code === code ? saved.token : newToken();
          const room = guestRoom(code, token, name);
          net = { role: 'guest', room, seat: -1 };   // set now, so Back or ✕ can cancel a join in progress
          try {
            const lobby = await room.join(code, name, token);
            if (net?.room !== room) return;
            saveRejoin({ code, token, name });
            clearUrlJoin();
            if (!lobby.rejoin) waitingPaint(lobby);
            keepAwake(true);
            haptic([20, 40, 20]);
          } catch (e) {
            if (net?.room !== room) return;
            net = null;
            status.textContent = nearbyError(e);
            busy = false;
            go.disabled = false;
          }
        }
        page(
          el('h2', { className: 'bachpan__title' }, [ui.join]),
          // an invite link skips the menu, so the name is asked here
          prefill ? el('label', { className: 'bachpan__field' }, [el('span', {}, [ui.yourName]), nameInput]) : null,
          el('label', { className: 'bachpan__field' }, [el('span', {}, [ui.enterCode]), codeInput]),
          status,
          go,
          backBtn(() => { net?.room.close(); net = null; clearUrlJoin(); menu(); }),
        );
        setTimeout(() => (prefill ? nameInput : codeInput).focus(), 60);
      }

      function waitingPaint(m) {
        const g = COUNTRIES[m.game] ? m.game : base.id;
        page(
          el('h2', { className: 'bachpan__title' }, [fmt(ui.joined, { host: m.host })]),
          el('p', { className: 'bachpan__sub' }, [`${GAME_NAME_EN[g]} · ${m.rounds} rounds`]),
          el('ol', { className: 'bachpan__lobby' }, m.players.map((n, i) => el('li', { className: 'on' }, [`${i === 0 ? '⭐' : '✅'} ${n}`]))),
          el('p', { className: 'bachpan__netstatus' }, [ui.waitStart]),
          backBtn(() => { net?.room.close(); net = null; clearRejoin(); menu(); }),
        );
        // the room behind the sheet shows the game the host picked
        if (g !== base.id) { base = COUNTRIES[g]; country = localize(base, mode); world?.story?.setCountry(country); world?.story?.preview(country.kids); }
      }

      if (rejoin) rejoinPage(rejoin);
      else if (linkCode) joinPage(linkCode);
      else menu();
    });
  }
  // the guest replays messages in order, once the 3D room is ready
  let guestChain = Promise.resolve();
  function guestQueue(m) {
    guestChain = guestChain.then(async () => {
      if (!world?.story) await ensureWorld();
      if (alive && net?.role === 'guest') guestApply(m);
    }).catch(onError);
  }

  /* ─── One round ───────────────────────────────────────── */
  async function playRound(round, { resume = false } = {}) {
    const R = country.rules;
    // friends who came back during the last round get their seats again
    players.forEach((p) => { if (p.back) { p.remote = p.back; p.back = null; } });
    setRound(fmt(ui.roundOf, { n: round, m: match.rounds }));
    // after a refresh the round is replayed with the very same chits (no re-rolling roles)
    if (!resume) match.startRound();
    saveGame('inRound');
    const name = (i) => players[i].name;

    if (R.finalDouble && match.isFinal) {
      players.forEach((_, i) => S().emote(i, '✨', 2.5));
      await narrate('doubleRound', {}, { wait: 2200 });
    }

    // Deal
    const dealer = (round - 1) % 4;
    S().deal(dealer);
    say(dealer, 'deal');
    await sleep(900);
    await sayWait(pickOne(others(dealer)), 'waiting');
    if (Math.random() < 0.3) await sayWait(pickOne(others(dealer)), 'banter');
    await sleep(300);

    // Everyone picks and peeks (only some speak, so lines stay fresh)
    for (let n = 1; n <= 4; n++) {
      const i = (dealer + n) % 4;
      S().focus(i);
      S().pick(i);
      S().allLook(i);
      if (Math.random() < 0.55) say(i, 'pick');
      await sleep(1300);
      if (players[i].isHuman) await humanPeek(match.slotOf(i));
      else if (players[i].remote) await remotePeek(i, match.slotOf(i));
      else if (Math.random() < 0.6) {
        if (Math.random() < 0.4) S().emote(i, pickOne(['🤭', '😏', '😐', '🙄']), 1.6);
        await sayWait(i, 'peek', {}, 300);
      } else await sleep(700);
      S().hold(i);
    }
    S().focus(null);
    await sleep(400);

    const g = match.guesser;
    const thief = match.thief;
    const guesserRole = country.roles[R.guesser];
    const local = players[g].isHuman;               // the guesser is on this phone
    const remote = !!players[g].remote;             // … or on a friend's phone
    const human = local || remote;
    let lean = null;          // a clue the computer guesser can lean on
    let forced = null;         // Russia: the night check found the Mafia

    // Korea: the night comes first
    if (R.night) {
      S().night(true);
      sfx.fanStop();
      sfx.play('crickets');
      await narrate('night', {}, { wait: 2200 });
      const nr = match.playNight();
      S().allLook(nr.victim);
      act(nr.victim, 'surprised', '😱');
      await narrate('victim', { name: name(nr.victim) }, { wait: 2000 });
      if (nr.saved) {
        act(nr.victim, 'jump', '😮‍💨');
        await narrate('saved', { name: name(nr.victim) }, { wait: 2000 });
      } else {
        act(nr.victim, 'cry', '😭');
        await narrate('notSaved', { name: name(nr.victim) }, { wait: 2000 });
      }
      S().night(false);
      sfx.fanStart();
      S().hold(nr.victim);
      await sleep(500);
    }

    // Classic opening: "Raja kaun?" … "Mera Wazir kaun?"
    if (R.announce) {
      const k = match.announcer;
      S().showOne(k, R.announce);
      S().emote(k, country.roles[R.announce].emoji, 2);
      await sayWait(k, 'kingAnnounce');
      await sayWait(k, 'askGuesser');
      S().showOne(g, R.guesser);
    }
    S().investigate(g, guesserRole.acc);
    S().emote(g, '😎', 1.8);
    await sayWait(g, 'announce');
    const nervousKid = pickOne(match.suspects());
    act(nervousKid, 'nervous', '💧');
    await sayWait(nervousKid, 'nervous');

    // Power cut (the night already did the dark in Korea)
    let powerOff = false;
    if (!R.night) {
      S().power(false);
      powerOff = true;
      sfx.fanStop();
      if (country.outage.off.includes('🌩️')) { sfx.play('thunder'); sfx.play('rain'); }
      await sleep(700);
      const scared = pickOne([0, 1, 2, 3]);
      act(scared, 'surprised', '😱');
      await sayWait(scared, 'outage');
      S().pose(scared, 'hold');
    }
    S().focus(g, { y: 1.05, back: 2.4, lift: 0.1 });
    if (Math.random() < 0.35) await narrate('parent', {}, { parent: true, wait: 1600 });

    // Russia: the Komissar's night check
    if (R.check) {
      sfx.play('crickets');
      await narrate('night', {}, { wait: 1800 });
      const c = match.nightCheck();
      const secret = fmt(c.isThief ? ui.nightThief : ui.nightClear, { name: name(c.seat), thief: country.roles.thief.name });
      if (local) showToast(secret, 4000);
      else if (remote) tellSeat(g, { t: 'toast', text: secret, ms: 4000 });
      else {
        S().look(g, c.seat);
        await sayWait(g, c.isThief ? 'checkThief' : 'checkClear', { name: name(c.seat) }, 300);
      }
      act(c.seat, c.isThief ? 'surprised' : 'shrug', c.isThief ? '❗' : '😇');
      if (c.isThief) forced = c.seat;
    }

    // Japan: a clue clears one innocent
    if (R.hint) {
      const cleared = match.giveHint();
      if (cleared != null) {
        act(cleared, 'cheer', '😇');
        await sayWait(g, 'hint', { name: name(cleared) }, 500);
        S().hold(cleared);
      }
    }

    // Germany: a witness gives a (not always right) tip
    if (R.witness) {
      const w = match.witness();
      S().look(w.who, w.tip);
      act(w.who, 'point', '👀');
      await sayWait(w.who, 'witness', { name: name(w.tip) }, 300);
      act(w.tip, 'deny', '❗');
      S().hold(w.who);
      lean = w.tip;
    }

    // UK: every suspect gives an alibi
    if (R.alibi) {
      for (const s of match.suspects()) {
        S().look(g, s);
        act(s, 'shrug');
        await sayWait(s, 'alibi', {}, 300);
        S().pose(s, 'hold');
      }
    }

    // Mexico: someone can't hold in the giggles
    if (R.tell) {
      const t = match.tell();
      act(t, 'laugh', '🤭');
      await sayWait(t, 'giggle', {}, 200);
      S().look(g, t);
      S().emote(g, '🤨', 1.8);
      await sayWait(g, 'tellNotice', { name: name(t) }, 300);
      S().pose(t, 'hold');
      lean = t;
    }

    // The guess
    const guesses = [];
    const accusePrompt = fmt(ui.accuse, { icon: guesserRole.emoji, role: guesserRole.name, thief: country.roles.thief.name });
    if (human) {
      const pleader = pickOne(match.suspects());
      act(pleader, 'nervous');
      say(pleader, 'plead');
      guesses.push(local
        ? await humanAccuse(match.suspects(), accusePrompt, { canCheat: true })
        : await remoteAccuse(g, match.suspects(), accusePrompt, { canCheat: true }));
    } else {
      const sus = match.suspects();
      const a = pickOne(sus);
      S().emote(g, '🤔', 2);
      await sayWait(g, 'thinking', { name: name(a) });
      if (Math.random() < 0.6) { act(a, 'nervous', '💧'); await sayWait(a, 'plead'); }
      if (sus.length > 1) await sayWait(g, 'thinking', { name: name(pickOne(sus.filter(s => s !== a))) });
      guesses.push(forced ?? match.aiGuess([], lean));
    }

    if (powerOff) {
      S().power(true);
      sfx.fanStart();
      await sleep(900);
      say(pickOne([0, 1, 2, 3]), 'restore');
      await sleep(900);
    }
    S().view('result');

    S().point(g, guesses[0]);
    act(guesses[0], 'surprised', '❗');
    await sayWait(g, 'accuse', { name: name(guesses[0]) }, 400);
    act(guesses[0], 'deny');
    await sayWait(guesses[0], 'accusedReply');

    // USA: a second shot after a miss
    if (R.secondChance && guesses[0] !== thief) {
      S().showOne(guesses[0], match.slotOf(guesses[0]));
      sfx.play('wrong');
      act(g, 'facepalm', '😬');
      await sayWait(g, 'missOnce', {}, 300);
      const left = match.suspects().filter(s => s !== guesses[0]);
      const second = local ? await humanAccuse(left, ui.second)
        : remote ? await remoteAccuse(g, left, ui.second)
          : match.aiGuess([guesses[0]], lean);
      guesses.push(second);
      S().point(g, second);
      act(second, 'surprised', '❗');
      await sayWait(g, 'secondTry', { name: name(second) }, 400);
    }

    const res = match.resolve(guesses);
    saveGame('between');     // round scored: a refresh now continues with the next round

    // Everyone shows their chit
    say(pickOne(others(g)), 'show');
    await sleep(700);
    S().reveal(match.roles);
    haptic(30);
    await sleep(1500);

    // Reactions
    others(g, thief).forEach(i => act(i, 'clap', null, 'happy'));
    if (res.correct) {
      act(g, 'jump', '🎉');
      act(thief, 'cry', '😭');
      S().look(thief, null);
      sfx.play('correct');
      haptic([20, 40, 20]);
      say(g, 'guesserWin');
      await sleep(900);
      say(thief, 'thiefLose');
      if (R.fine) { await sleep(1400); say(g, 'fine', { name: name(thief) }); }
    } else {
      act(thief, 'laugh', '😂');
      act(g, 'facepalm', '💢');
      S().look(g, null);
      sfx.play('wrong');
      say(thief, 'thiefWin');
      await sleep(900);
      say(g, 'guesserLose');
      if (R.onWrong === 'penalty') { await sleep(1400); say(g, 'penalty'); }
      if (R.steal) {
        await sleep(1400);
        const k = match.seatOf('king');
        act(k, 'cry', '💸');
        say(thief, 'steal', { name: name(k) });
      }
    }
    await sleep(1400);
    const royals = others(g, thief);
    if (royals.length) say(pickOne(royals), 'royal');
    renderScores(res.points);
    sfx.play('score');
    await sleep(3200);
  }

  /* ─── The match ───────────────────────────────────────── */
  let playMode = 'play';
  const seoIntro = document.querySelector('.seo-intro');

  function saveGame(phase) {
    if (!match || net) return;   // a Nearby match lives on four phones, it can't be resumed from one
    try {
      const spoken = {};
      Object.entries(talks).forEach(([lang, d]) => { spoken[lang] = d.exportSpoken().slice(-600); });
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, at: Date.now(), phase, country: base.id, playMode,
        match: match.snapshot(),
        players: players.map(p => ({ name: p.name, isHuman: p.isHuman })),
        spoken,
      }));
    } catch {}
  }

  async function ensureWorld() {
    if (!world) showPrompt(ui.loading);
    world = await worldReady;
    showPrompt('');
    if (!alive) throw CANCEL;
    if (!world?.story) { showPrompt(ui.noGl); throw CANCEL; }
  }

  let worldReady = null;
  async function run() {
    // the 3D room loads in the background; the start screen doesn't wait for it
    worldReady = loadWorld().then((w) => {
      world = w;
      if (w?.story && alive && !match) { w.story.setCountry(country); w.story.preview(country.kids); }
      return w;
    });
    loadPack('english');               // every language falls back to it for rule-specific moments
    loadPack(chatPack());

    // an invite link, or a friend's phone coming back after a reload, goes straight to Nearby Play
    const urlJoin = readUrlJoin();
    const ticket = loadRejoin();
    let nearbyStart = ticket && (!urlJoin || urlJoin === ticket.code) ? { rejoin: ticket } : urlJoin ? { code: urlJoin } : null;
    if (nearbyStart?.rejoin) {
      // a reload has no tap to unlock sound yet: the first touch does it
      screen.addEventListener('pointerdown', () => audioManager.unlock(), { once: true });
    }

    const saved = nearbyStart ? null : loadSave();
    const fromUrl = readUrlGame();
    if (saved && (!fromUrl || fromUrl.country.id === saved.country)) {
      base = COUNTRIES[saved.country];
      country = localize(base, mode);
      ui = uiFor();
      setRound(fmt(ui.roundOf, { n: saved.match.round, m: saved.match.rounds }));
      await ensureWorld();
      await startMatch(saved.playMode === 'watch' ? 'watch' : 'play', saved);
      return;
    }
    if (fromUrl) {
      base = fromUrl.country;
      country = localize(base, mode);
      ui = uiFor();
    }

    let pm;
    for (;;) {
      pm = nearbyStart ? 'nearby' : await chooseSetup();
      if (!alive) return;
      if (pm !== 'nearby') break;
      const r = await nearbyFlow(nearbyStart || {});
      nearbyStart = null;
      if (!alive) return;
      if (r === 'host') break;           // room full enough and Start pressed
      if (r === 'guest') return;         // a friend's phone: the host drives from here
    }
    await ensureWorld();
    await startMatch(pm);
  }

  async function startMatch(pm, saved = null) {
    playMode = pm;
    clearSave();
    if (saved) {
      players = saved.players.map((p, i) => ({ name: String(p.name).slice(0, 16), color: SHIRTS[i], isHuman: !!p.isHuman }));
      match = Match.restore(base, saved.match);
    } else {
      players = country.kids.map((n, i) => ({ name: n, color: SHIRTS[i], isHuman: false, remote: null }));
      if (pm === 'play' || pm === 'nearby') {
        const n = settingsStore.get('playerName') || '';
        players[HUMAN_SEAT] = { ...players[HUMAN_SEAT], name: /^Player-/.test(n) ? ui.you : n.slice(0, 12), isHuman: true };
      }
      // Nearby: friends take seats 0, 1, 2 in the order they joined; empty seats stay computer kids
      if (pm === 'nearby' && isHost()) {
        players[HUMAN_SEAT].name = net.name;   // the name the friends already saw in the lobby
        net.lastEnd = null;
        const online = net.room.list;
        net.seats.forEach((s, k) => {
          // a friend who is away keeps name and seat; a computer kid plays until they're back
          players[k] = { name: s.name, color: SHIRTS[k], isHuman: false, remote: online.find(g => g.token === s.token)?.id || null };
        });
      }
      const rounds = ROUND_OPTIONS.includes(settingsStore.get('matchRounds')) ? settingsStore.get('matchRounds') : 5;
      match = new Match(base, 4, rounds, { humanSeat: pm === 'play' || pm === 'nearby' ? HUMAN_SEAT : -1 });
      if (isHost()) {
        pending.clear();
        players.forEach((p, seat) => {
          if (p.remote) net.room.send(p.remote, { t: 'start', game: base.id, rounds, seat, players: players.map(x => ({ name: x.name })) });
        });
      }
    }
    talks = {};
    await Promise.all([loadPack('english'), loadPack(country.lang), loadPack(chatPack())]);
    if (saved?.spoken) {
      // remember what was already said, so nothing repeats after the refresh
      await Promise.all(Object.keys(saved.spoken).map(loadPack));
      Object.entries(saved.spoken).forEach(([lang, list]) => {
        talks[lang] = new Dialogue(lang, namesFor(lang), country.lang);
        talks[lang].importSpoken(list);
      });
    }
    if (!alive) return;
    voiceBox.setLanguages(country.voice);
    sfx.fanStart();
    renderScores();

    S().setCountry(country);
    S().begin(players.map(p => ({
      name: p.name, color: p.color, isHuman: p.isHuman,
      label: p.isHuman && p.name !== ui.you ? `${p.name} (${ui.you})` : p.name,
    })));
    if (voiceOn() && !voiceBox.available) showToast(ui.voiceOff, 3500);
    keepAwake(true);
    if (isTouch && !isLandscape()) setTimeout(() => { if (alive && !isLandscape()) showRotateHint(true); }, 2500);
    await sleep(800);

    let first = 1, resumeRound = false;
    if (saved) {
      resumeRound = saved.phase === 'inRound';
      first = resumeRound ? match.round : match.round + 1;
      showToast(fmt(ui.resumed, { n: Math.min(first, match.rounds) }), 3200);
      saveGame(resumeRound ? 'inRound' : 'between');
    } else {
      act(0, 'wave', '👋');
      await sayWait(0, 'intro');
      await sayWait(1, 'introReply');
    }

    for (let r = first; r <= match.rounds; r++) {
      await playRound(r, { resume: resumeRound && r === first });
      if (r < match.rounds) {
        await sayWait(pickOne([0, 1, 2, 3]), 'nextRound');
        renderScores();
      }
    }
    clearSave();    // the match is finished: a refresh now goes back to the start screen

    // Game over
    const w = match.winner();
    setRound(`🏆 ${ui.over}`);
    S().celebrate(w);
    S().emote(w, '🏆', 4);
    sfx.play('victory');
    haptic([30, 50, 30, 50, 90]);
    keepAwake(false);
    await sayWait(w, 'winner');
    others(w).forEach(i => { say(i, 'loser'); S().emote(i, pickOne(['👏', '😅', '😤']), 2.5); });
    await sleep(1800);
    await narrate('parentEnd', {}, { parent: true, wait: 1500 });

    const result = {
      w, totals: match.totals.slice(), order: match.standings(), awards: match.awards(),
      rounds: match.rounds, game: base.id, catches: match.catches.slice(), escapes: match.escapes.slice(),
    };
    if (net?.role === 'host') { net.lastEnd = result; net.room.broadcast({ t: 'end', ...result }); }
    showEnd(result);
  }

  /** The end-of-match sheet (same on the host and on every guest phone). */
  function showEnd({ w, totals, order, awards, rounds, game, catches, escapes }) {
    const guest = net?.role === 'guest';
    const me = players.findIndex(p => p.isHuman);
    if (me >= 0) {
      recordStats({ won: w === me, score: totals[me], catches: catches?.[me] || 0, escapes: escapes?.[me] || 0, gameId: game });
    }
    const MEDALS = ['🥇', '🥈', '🥉', '4'];
    const standings = el('ol', { className: 'bachpan__standings' }, order.map((seat, place) => el('li', {
      className: `bachpan__standing${players[seat].isHuman ? ' bachpan__standing--me' : ''}`,
      style: { '--chip': players[seat].color },
    }, [
      el('span', { className: 'bachpan__medal' }, [MEDALS[place]]),
      el('strong', {}, [players[seat].isHuman ? `${players[seat].name} (${ui.you})` : players[seat].name]),
      el('span', { className: 'bachpan__pts' }, [String(totals[seat])]),
    ])));
    const awardRow = awards.length ? el('div', { className: 'bachpan__awards' }, awards.map(a => el('span', { className: 'bachpan__award' }, [
      el('strong', {}, [ui[a.id]]),
      el('span', {}, [`${players[a.seat].name} · ${fmt(ui[`${a.id}Sub`], { n: a.count })}`]),
    ]))) : null;
    const shareMsg = el('span', {}, [ui.shareSub]);
    const shareBtn = el('button', {
      className: 'bachpan__choice', type: 'button',
      onClick: async () => {
        const url = new URL(location.href);
        url.search = `?game=${GAME_SLUGS[game]}`; url.hash = '';
        const score = me >= 0 ? totals[me] : totals[w];
        const text = me >= 0
          ? `I scored ${score} in ${GAME_NAME_EN[game]}${w === me ? ' and won 🏆' : ''}! Can you beat me?`
          : `Play ${GAME_NAME_EN[game]} online in 3D, free!`;
        const r = await shareGame({ title: `${GAME_NAME_EN[game]} – ChitPlay`, text, url: url.toString() });
        if (r === 'copied') shareMsg.textContent = ui.copied;
        else if (r === 'failed') shareMsg.textContent = url.toString();   // at least show the link to copy by hand
      },
    }, [el('strong', {}, [ui.share]), shareMsg]);

    clear(sheet);
    sheet.className = 'bachpan__sheet bachpan__sheet--show bachpan__sheet--start';
    sheet.append(
      el('h2', { className: 'bachpan__title' }, [players[w].isHuman ? ui.youWon : fmt(ui.won, { name: players[w].name })]),
      el('p', { className: 'bachpan__sub' }, [`${GAME_NAME_EN[game]} · ${rounds} rounds${net ? ' · 📶 Nearby' : ''}`]),
      standings,
      ...(awardRow ? [awardRow] : []),
      guest
        ? el('p', { className: 'bachpan__stats' }, [ui.waitHostAgain])
        : el('button', {
          className: 'bachpan__choice bachpan__choice--primary', type: 'button',
          onClick: () => { S().stopCelebrate(); sheet.className = 'bachpan__sheet'; startMatch(playMode).catch(onError); },
        }, [el('strong', {}, [ui.again]), el('span', {}, [net ? ui.againNearby : ui.againSub])]),
      el('button', {
        className: 'bachpan__choice', type: 'button',
        onClick: () => { clearRejoin(); transition(GAME_PHASES.HOME); },
      }, guest ? [el('strong', {}, [ui.leave]), el('span', {}, [ui.leaveSub])] : [el('strong', {}, [ui.change]), el('span', {}, [net ? ui.changeNearby : ui.changeSub])]),
      shareBtn,
    );
  }

  function onError(e) {
    if (e !== CANCEL) console.error('[ChitPlay3D]', e);
  }

  return {
    element: screen,
    onEnter() { run().catch(onError); },
    onExit() {
      alive = false;
      tapHandler = null;
      timers.forEach(clearTimeout);
      timers.clear();
      voiceBox.stop();
      sfx.fanStop();
      keepAwake(false);
      document.removeEventListener('visibilitychange', onVisible);
      onModeChange = null;
      net?.room.close();
      net = null;
      world?.story?.end();
    },
  };
}
