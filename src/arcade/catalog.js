/**
 * Every game, as the home screen's list and the rules pages see it. Small on purpose: the home
 * screen loads this, and each game's own logic loads only when somebody opens that game.
 * `seats` is how many sit down by default when bots fill the table. All names are traditional or
 * plain descriptions, and every board and piece is drawn by us.
 */
export const VIDEO_GAMES = [
  { slug: 'flying-chit', video: true, hot: true, aka: 'flappy chit wings endless udti bangle', name: 'Flying Chit', icon: '📨', min: 1, max: 4, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#e8a317', medals: [40, 120, 250, 500], blurb: 'Steer a winged chit through bangles in an endless classroom. Chain them for combos.' },
  { slug: 'tunnel-race', video: true, hot: true, aka: 'paper plane tunnel 3d endless race hawai jahaz', name: 'Tunnel Race', icon: '✈️', min: 1, max: 4, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#7b3fe4', medals: [50, 150, 300, 600], blurb: 'A paper plane in an endless tunnel. Steer round the walls and grab the gems.' },
  { slug: 'hoop-flick', video: true, hot: true, aka: 'basketball dunk shot hoop throw swish ball endless', name: 'Hoop Flick', icon: '🏀', min: 1, max: 2, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#e8742a', medals: [20, 50, 100, 200], blurb: 'Pull back, let go, and drop the ball through the next hoop. Swish them in a row for combos.' },
  { slug: 'ghost-hostel', video: true, hot: true, aka: 'haunted dorm ghost defense survive night bed door upgrade tower', name: 'Ghost Hostel', icon: '👻', min: 1, max: 4, seats: 4, minutes: '3', kind: 'Arcade', accent: '#6b4fd8', blurb: 'One night in a haunted hostel. Sleep for coins, build up your door and fans, and last till sunrise.' },
  { slug: 'pin-spin', video: true, aka: 'pin spin push pin corkboard spinning board timing levels stars', name: 'Pin Spin', icon: '📌', min: 1, max: 4, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#2f7d5a', medals: [25, 60, 120, 250], blurb: 'Push pins into a spinning corkboard without touching the others. Fill board after board.' },
  { slug: 'ship-fight', video: true, hot: true, aka: 'boat battleship navy jahaz', name: 'Ship Fight', icon: '🚢', min: 2, max: 2, seats: 2, minutes: '2–5', kind: 'Arcade', accent: '#1f7ab8', blurb: 'Two ships, cannons firing non-stop. Dodge, line up your shots and sink your friend.' },
  { slug: 'bull-fight', video: true, hot: true, aka: 'bull saand sumo push ring jallikattu', name: 'Bull Fight', icon: '🐂', min: 2, max: 2, seats: 2, minutes: '2–5', kind: 'Arcade', accent: '#b5651d', blurb: 'Two bulls, one sand ring. Charge, lock horns and push the other one out.' },
  { slug: 'road-dash', video: true, hot: true, aka: 'auto rickshaw car lane endless race', name: 'Road Dash', icon: '🛺', min: 1, max: 4, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#c7502a', medals: [40, 100, 200, 400], blurb: 'An auto-rickshaw on a road that never ends. Dodge cows and buses, grab the coins.' },
  { slug: 'backyard-rally', video: true, aka: 'pong tennis bat ball paddle', name: 'Backyard Rally', icon: '🎾', min: 2, max: 2, seats: 2, minutes: '2–4', kind: 'Arcade', accent: '#2f8f4a', blurb: 'Bat and ball in the backyard. The rally keeps getting faster. First to seven.' },
  { slug: 'hungry-snake', video: true, aka: 'snake saanp samosa', name: 'Hungry Snake', icon: '🐍', min: 1, max: 4, seats: 1, minutes: '1–5', kind: 'Arcade', accent: '#4c9a2a', medals: [10, 25, 50, 80], blurb: 'Eat the snacks, grow longer, and don’t bite anything. Faster with every bite.' },
];
export const GAMES = [
  { slug: 'ludo', aka: 'pachisi goti pasa', skill: true, name: 'Ludo', icon: '🎲', min: 2, max: 4, seats: 4, minutes: '20–40', kind: 'Board', accent: '#c62828', blurb: 'Race your four tokens home. Roll a six to start, and send rivals back.',
    modes: [['normal', 'Normal', 'First to bring all four tokens home wins.'], ['score', 'Score', 'Every square, capture and token home scores points. Most points after 15 rounds wins.']],
    rules: [['block', '🧱 Blockades', 'Two of your tokens on one square block everyone else.'], ['capture', '⚔️ Capture to go home', 'A token can only go up its home path after you have captured one.'], ['quick', '⚡ Quick start', 'Everyone starts with one token already out.']] },
  { slug: 'carrom', aka: 'carom karam striker', name: 'Carrom', icon: '🎯', min: 2, max: 2, seats: 2, minutes: '10–20', kind: 'Board', accent: '#a9713a', blurb: 'Flick the striker, pocket your coins, and cover the queen.' },
  { slug: 'chess', aka: 'shatranj', skill: true, name: 'Chess', icon: '♟️', min: 2, max: 2, seats: 2, minutes: '10–40', kind: 'Board', accent: '#6d5a3f', blurb: 'The full game: castling, en passant, promotion and checkmate.' },
  { slug: 'snakes-and-ladders', aka: 'saap seedi saanp sidi moksha patam', name: 'Snakes and Ladders', icon: '🎢', min: 2, max: 4, seats: 4, minutes: '10–20', kind: 'Board', accent: '#2e7d32', blurb: 'Climb the ladders, dodge the snakes, land exactly on 100.' },
  { slug: 'color-clash', aka: 'color colour card game wild draw four skip reverse matching', hot: true, skill: true, name: 'Color Clash', icon: '🌈', min: 2, max: 4, seats: 4, minutes: '10–20', kind: 'Cards', accent: '#e53935', blurb: 'Match the colour or the number, hit them with +2 and Rainbow +4, and empty your hand first.' },
  { slug: 'call-break', aka: 'callbreak taash cards spades', skill: true, name: 'Call Break', icon: '♠️', min: 4, max: 4, seats: 4, minutes: '15–25', kind: 'Cards', accent: '#1f3f77', blurb: 'Call your tricks, then make them. Spades are always trumps.' },
  { slug: 'crazy-eights', aka: 'mau taash cards', skill: true, name: 'Crazy Eights', icon: '🃏', min: 2, max: 4, seats: 4, minutes: '10–15', kind: 'Cards', accent: '#8e244d', blurb: 'Match the suit or rank, and use wild eights to empty your hand first.' },
  { slug: 'checkers', aka: 'draughts dama', skill: true, name: 'Checkers', icon: '⛀', min: 2, max: 2, seats: 2, minutes: '10–20', kind: 'Board', accent: '#7b1f1f', blurb: 'Jump the other side’s pieces and crown your kings.' },
  { slug: 'four-in-a-row', aka: 'connect discs', skill: true, name: 'Four in a Row', icon: '🔴', min: 2, max: 2, seats: 2, minutes: '5–10', kind: 'Board', accent: '#1565c0', blurb: 'Drop discs and line up four before the other player does.' },
  { slug: 'tic-tac-toe', aka: 'noughts crosses zero kata katam', skill: true, name: 'Tic-Tac-Toe', icon: '⭕', min: 2, max: 2, seats: 2, minutes: '1–3', kind: 'Puzzle', accent: '#00796b', blurb: 'Three in a line. A minute to learn, and always ready for a rematch.' },
  { slug: 'reversi', aka: 'flip discs', skill: true, name: 'Reversi', icon: '⚫', min: 2, max: 2, seats: 2, minutes: '10–15', kind: 'Board', accent: '#2f6b3a', blurb: 'Trap the other colour between yours and flip it to your side.' },
  { slug: 'dots-and-boxes', aka: 'dabba line pen paper', skill: true, name: 'Dots and Boxes', icon: '🔳', min: 2, max: 4, seats: 2, minutes: '5–10', kind: 'Puzzle', accent: '#3949ab', blurb: 'Draw lines, close boxes, and take another turn each time you do.' },
  { slug: 'mancala', aka: 'pallanguzhi seeds', skill: true, name: 'Mancala', icon: '🌰', min: 2, max: 2, seats: 2, minutes: '5–15', kind: 'Board', accent: '#8d5a2b', blurb: 'Sow your seeds round the board, and capture to fill your store.' },
  { slug: 'nine-mens-morris', aka: 'navakankari mill', skill: true, name: 'Nine Men’s Morris', icon: '🧿', min: 2, max: 2, seats: 2, minutes: '10–20', kind: 'Board', accent: '#5d4037', blurb: 'Make lines of three to take pieces in this very old strategy game.' },
  { slug: 'memory-match', aka: 'pairs jodi', skill: true, name: 'Memory Match', icon: '🧠', min: 2, max: 4, seats: 2, minutes: '5–10', kind: 'Puzzle', accent: '#6a1b9a', blurb: 'Turn two tiles and remember what you saw. Pairs go to the sharpest.' },
  { slug: 'yacht', aka: 'dice paasa', name: 'Yacht', icon: '🎰', min: 2, max: 4, seats: 2, minutes: '10–20', kind: 'Dice', accent: '#00695c', blurb: 'Five dice, three rolls, twelve categories. Pick your scores wisely.' },
  { slug: 'pig', aka: 'dice paasa', name: 'Pig', icon: '🐷', min: 2, max: 4, seats: 3, minutes: '5–10', kind: 'Dice', accent: '#ad5a78', blurb: 'Keep rolling or bank your points, but a 1 loses the whole turn.' },
  { slug: 'who-is-the-spy', aka: 'jasoos undercover word', name: 'Who Is the Spy?', icon: '🕵️', min: 4, max: 10, seats: 4, minutes: '10–20', kind: 'Party', accent: '#37474f', blurb: 'Everyone shares a secret word except the spy. Find them from the clues.' },
  { slug: 'werewolf', aka: 'werewolf mafia village seer doctor night day vote social deduction', name: 'Werewolf Night', icon: '🐺', min: 5, max: 10, seats: 6, minutes: '10–20', kind: 'Party', accent: '#3b3f6b', blurb: 'Secret roles, quiet nights and loud mornings. Find the werewolves before they take the village.' },
  { slug: 'truth-or-dare', aka: 'sach himmat', name: 'Truth or Dare', icon: '🗣️', min: 2, max: 10, seats: 4, minutes: '10–30', kind: 'Party', accent: '#d84315', blurb: 'Friendly truths and fun dares for every age. Skip any prompt.' },
  { slug: 'riddle-chits', aka: 'paheli paheliyan', name: 'Riddle Chits', icon: '🧩', min: 2, max: 10, seats: 4, minutes: '5–15', kind: 'Party', accent: '#2c6e91', blurb: 'Open a riddle and pick the answer. A hint costs you a point.' },
  { slug: 'majority-vote', aka: 'poll vote', name: 'Majority Vote', icon: '🗳️', min: 3, max: 10, seats: 4, minutes: '5–10', kind: 'Party', accent: '#558b2f', blurb: 'Guess what most of the table will choose. Think like the crowd.' },
  { slug: 'consequences', aka: 'kahani story paper', name: 'Consequences', icon: '📜', min: 3, max: 8, seats: 4, minutes: '5–10', kind: 'Party', accent: '#a1672b', blurb: 'Write a story one folded line at a time, then unfold the whole tale.' },
];
/** Everything on the home screen. */
export const ALL_GAMES = [...VIDEO_GAMES, ...GAMES];
/** Old names that links or saved lists may still use. */
const RENAMED = { 'rang-patti': 'color-clash', 'gully-rally': 'backyard-rally', 'knife-throw': 'pin-spin' };
export const gameBySlug = (slug) => ALL_GAMES.find(g => g.slug === (RENAMED[slug] || slug)) || null;
/** The categories, in the order the home screen shows them. Cops and Robbers is in Party too. */
/** The Hot row on a first visit: five quick, come-back-for-more games. Players can change it. */
export const HOT_DEFAULT = ['ludo', 'flying-chit', 'color-clash', 'tunnel-race', 'road-dash'];
export const CATEGORIES = ['Arcade', 'Board', 'Cards', 'Dice', 'Party', 'Puzzle'];
