/**
 * Country editions of the chit game. Every edition maps onto the same four
 * internal role slots, then customises names, points, who guesses, rule twists,
 * player names, room theme and language.
 *
 * Slots:  king   — top royal, always scores
 *         queen  — second royal (Rani / Wazir / Mantri / Doctor…)
 *         detective — the investigator (Police / Sipahi / Sheriff…)
 *         thief  — the one hiding (Chor / Mafia / Robber…)
 *
 * rules.guesser: which slot makes the accusation ('detective' or 'queen').
 * rules.onWrong: 'swap' (guesser and thief swap points) | 'thief' (thief takes
 *   their full escape value) | 'penalty' (guesser loses rules.penalty).
 * rules.hint: guesser gets one innocent cleared before guessing.
 * rules.night: Mafia-style night — thief attacks one player, the queen slot
 *   (Doctor) tries to save; an unsaved victim scores 0 this round.
 * rules.secondChance: guesser gets a second try for half points.
 * rules.alibi: every suspect gives an alibi before the guess.
 * rules.fine: when caught, the thief pays this to the guesser.
 */

export const COUNTRIES = {
  IN: {
    id: 'IN', flag: '🇮🇳', name: 'India', game: 'Chor Police Raja Rani', lang: 'hinglish',
    roles: {
      king:      { name: 'Raja',   emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Rani',   emoji: '👸', acc: 'tiara', color: '#9f3269', points: 800 },
      detective: { name: 'Police', emoji: '👮', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: 'Chor',   emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'swap' },
    ruleText: 'Police ko 3 me se Chor pakadna hai. Galat guess kiya to Police aur Chor ke points aapas me badal jaate hain.',
    cast: ['Monu', 'Pinky', 'Golu', 'Chinki'],
    parent: 'Mummy',
    outage: { off: '🕯️ Light chali gayi…', on: '💡 Light aa gayi!' },
    theme: {
      floor: 'redoxide', mat: 'woven', wall: ['#e6dcc6', '#7fae95', '#4f7f68'],
      month: 'JUNE 1998', ball: 'cricket', skins: ['#c58c5c', '#a86f45', '#d9a273', '#8d5a35'],
    },
  },
  PK: {
    id: 'PK', flag: '🇵🇰', name: 'Pakistan', game: 'Raja Wazir Chor Sipahi', lang: 'urdu',
    roles: {
      king:      { name: 'Raja',   emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Wazir',  emoji: '🧔', acc: 'turban', color: '#1f6b3a', points: 800 },
      detective: { name: 'Sipahi', emoji: '💂', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: 'Chor',   emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'queen', onWrong: 'swap' },
    ruleText: 'Sirf Wazir samne aata hai, baqi koi apni parchi nahi batata. Wazir ko baqi 3 me se Chor dhundhna hai. Galat guess kiya to Wazir aur Chor ke points swap ho jaate hain.',
    cast: ['Ahmed', 'Ayesha', 'Bilal', 'Sana'],
    parent: 'Ammi',
    outage: { off: '🕯️ Load shedding shuru…', on: '💡 Bijli aa gayi!' },
    theme: {
      floor: 'terrazzo', mat: 'dari', wall: ['#e8e2cf', '#6f9e84', '#3f6f55'],
      month: 'JUNE 1998', ball: 'cricket', skins: ['#c99a6c', '#b07a50', '#d6a77a', '#9c6a42'],
    },
  },
  NP: {
    id: 'NP', flag: '🇳🇵', name: 'Nepal', game: 'Raja Mantri Chor Sipahi', lang: 'nepali',
    roles: {
      king:      { name: 'Raja',   emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Mantri', emoji: '🎩', acc: 'dhaka', color: '#6b3a8a', points: 800 },
      detective: { name: 'Sipahi', emoji: '💂', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: 'Chor',   emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'queen', onWrong: 'swap' },
    ruleText: 'Mantri matra aafno parichaya dinchha, aru kasaile bhandaina. Mantri le baaki 3 madhye Chor chinnu parchha. Galat bhaye Mantri ra Chor ko number saatinchha.',
    cast: ['Bibek', 'Sita', 'Ramesh', 'Gita'],
    parent: 'Aama',
    outage: { off: '🕯️ Load shedding bhayo…', on: '💡 Batti aayo!' },
    theme: {
      floor: 'mud', mat: 'gundri', wall: ['#efe6d2', '#b9876a', '#7a4f38'],
      month: 'JESTHA 2055', ball: 'cricket', skins: ['#c99a6c', '#d6a77a', '#b07a50', '#e0b48a'],
    },
  },
  JP: {
    id: 'JP', flag: '🇯🇵', name: 'Japan', game: '殿様と泥棒', lang: 'japanese',
    roles: {
      king:      { name: '殿様', emoji: '🏯', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: '家老', emoji: '🎎', acc: 'tiara', color: '#9f3269', points: 800 },
      detective: { name: '岡っ引き', emoji: '🔎', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: '泥棒', emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', hint: true, escape: 1000 },
    ruleText: '岡っ引きは手がかりを一つもらい、無実の人を一人はずせます。残り二人から泥棒を当てよう。泥棒が逃げ切ったら1000点！',
    cast: ['Kenta', 'Yui', 'Haruto', 'Sakura'],
    kidsLocal: ['けんた', 'ゆい', 'はると', 'さくら'],
    parent: 'お母さん',
    outage: { off: '🌩️ 停電だ！台風…', on: '💡 電気がついた！' },
    theme: {
      floor: 'wood', mat: 'tatami', wall: ['#efe7d6', '#c9b48a', '#8a6f45'],
      month: '6月 1998', ball: 'baseball', skins: ['#f1c9a5', '#e8b994', '#f3d0b0', '#e2b28c'],
    },
  },
  KR: {
    id: 'KR', flag: '🇰🇷', name: 'South Korea', game: '마피아 게임', lang: 'korean',
    roles: {
      king:      { name: '시민', emoji: '🧑', acc: null,     color: '#5a5a5a', points: 600 },
      queen:     { name: '의사',  emoji: '🩺', acc: 'doctor', color: '#1f7a6b', points: 800 },
      detective: { name: '경찰',  emoji: '👮', acc: 'cap',    color: '#23617a', points: 500 },
      thief:     { name: '마피아',   emoji: '🕶️', acc: 'mask',   color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', night: true, escape: 1000 },
    ruleText: '밤에 마피아가 한 명을 공격하고, 의사는 한 명을 살리려고 해요. 못 살린 사람은 이번 판 0점! 낮에는 경찰이 범인을 지목해요. 마피아가 도망치면 1000점!',
    cast: ['Minjun', 'Jiwoo', 'Seojun', 'Hayoon'],
    kidsLocal: ['민준', '지우', '서준', '하윤'],
    parent: '엄마',
    outage: { off: '🌩️ 정전이다! 천둥 번개…', on: '💡 불 들어왔다!' },
    theme: {
      floor: 'jangpan', mat: 'yo', wall: ['#f1ead8', '#a8c4cf', '#6f8f9c'],
      month: '6월 1998', ball: 'baseball', skins: ['#f1c9a5', '#e8b994', '#f3d0b0', '#e5bb95'],
    },
  },
  US: {
    id: 'US', flag: '🇺🇸', name: 'USA', game: 'Cops and Robbers', lang: 'american',
    roles: {
      king:      { name: 'Mayor',   emoji: '🎩', acc: 'tophat', color: '#3a3a8a', points: 1000 },
      queen:     { name: 'Banker',  emoji: '💰', acc: 'visor',  color: '#1f6b3a', points: 800 },
      detective: { name: 'Sheriff', emoji: '🤠', acc: 'cowboy', color: '#8a5a23', points: 500 },
      thief:     { name: 'Robber',  emoji: '🦹', acc: 'mask',   color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', secondChance: true, escape: 1000 },
    ruleText: 'The Sheriff gets two shots. Catching the Robber on the first try is worth 500, on the second try 250. Miss twice and the Robber escapes with 1000.',
    cast: ['Jake', 'Emily', 'Tyler', 'Ashley'],
    parent: 'Mom',
    outage: { off: '🌩️ Power’s out! Big storm…', on: '💡 Power’s back!' },
    theme: {
      floor: 'carpet', mat: 'rug', wall: ['#e9e1cf', '#9b7b5b', '#6a4f36'],
      month: 'JUNE 1998', ball: 'baseball', skins: ['#f0c8a8', '#8d5a35', '#e2b28c', '#c58c5c'],
    },
  },
  UK: {
    id: 'UK', flag: '🇬🇧', name: 'United Kingdom', game: 'Cops and Robbers', lang: 'british',
    roles: {
      king:      { name: 'King',   emoji: '👑', acc: 'crown',  color: '#9a6a09', points: 1000 },
      queen:     { name: 'Queen',  emoji: '👸', acc: 'tiara',  color: '#9f3269', points: 800 },
      detective: { name: 'Bobby',  emoji: '👮', acc: 'helmet', color: '#1f2f6b', points: 500 },
      thief:     { name: 'Robber', emoji: '🦹', acc: 'mask',   color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'penalty', penalty: 200, alibi: true, escape: 1000 },
    ruleText: 'Everyone gives an alibi, then the Bobby makes an arrest. A wrong arrest costs the Bobby 200 and the Robber gets away with 1000.',
    cast: ['Oliver', 'Amelia', 'Harry', 'Isla'],
    parent: 'Mum',
    outage: { off: '🕯️ Power cut! Fuse has gone…', on: '💡 Lights are back!' },
    theme: {
      floor: 'carpet', mat: 'tartan', wall: ['#e6e0d2', '#7a8f6f', '#4f5f45'],
      month: 'JUNE 1998', ball: 'cricket', skins: ['#f1d0b5', '#e8bf9f', '#a86f45', '#f3d6bd'],
    },
  },
  CN: {
    id: 'CN', flag: '🇨🇳', name: 'China', game: '警察抓小偷', lang: 'chinese',
    roles: {
      king:      { name: '皇帝', emoji: '🐉', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: '宰相', emoji: '📜', acc: 'tiara', color: '#9f3269', points: 800 },
      detective: { name: '警察', emoji: '👮', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: '小偷', emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', fine: 200, escape: 1000 },
    ruleText: '警察要从另外三个人里找出小偷。抓到了，小偷要罚给警察200分；小偷逃掉了，就得1000分！',
    cast: ['Xiaoming', 'Lili', 'Wei', 'Meimei'],
    kidsLocal: ['小明', '丽丽', '伟伟', '美美'],
    parent: '妈妈',
    outage: { off: '🕯️ 停电了！', on: '💡 来电了！' },
    theme: {
      floor: 'terrazzo', mat: 'bamboo', wall: ['#ece6d6', '#8fb0a0', '#5a7f6c'],
      month: '六月 1998', ball: 'pingpong', skins: ['#f1c9a5', '#e8b994', '#f3d0b0', '#e2b28c'],
    },
  },
  BD: {
    id: 'BD', flag: '🇧🇩', name: 'Bangladesh', game: 'Raja Mantri Chor Police', lang: 'bangla',
    roles: {
      king:      { name: 'Raja',   emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Mantri', emoji: '🎩', acc: 'tiara', color: '#6b3a8a', points: 800 },
      detective: { name: 'Police', emoji: '👮', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: 'Chor',   emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'swap' },
    ruleText: 'Shudhu Police nijer porichoy dey, ar keu bole na. Police ke baki 3 jon theke Chor dhorte hobe. Bhul hole Police ar Chor er number bodle jay.',
    cast: ['Rafi', 'Nusrat', 'Tanvir', 'Mim'],
    parent: 'Ammu',
    outage: { off: '🕯️ Current chole gelo…', on: '💡 Current eshe gese!' },
    theme: {
      floor: 'redoxide', mat: 'shitalpati', wall: ['#eae2cc', '#7fa88f', '#4f7f68'],
      month: 'JOISHTHO 1405', ball: 'cricket', skins: ['#b98055', '#a86f45', '#c99a6c', '#9c6a42'],
    },
  },
  RU: {
    id: 'RU', flag: '🇷🇺', name: 'Russia', game: 'Мафия (Mafia)', lang: 'russian',
    roles: {
      king:      { name: 'Мирный',   emoji: '🧑', acc: 'ushanka', color: '#5a5a5a', points: 600 },
      queen:     { name: 'Доктор',   emoji: '🩺', acc: 'doctor',  color: '#1f7a6b', points: 800 },
      detective: { name: 'Комиссар', emoji: '🕵️', acc: 'cap',     color: '#23617a', points: 500 },
      thief:     { name: 'Мафия',    emoji: '🕶️', acc: 'mask',    color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', check: true, escape: 1000 },
    ruleText: 'Ночью Комиссар тайно проверяет одного игрока: иногда находит Мафию сразу, иногда только снимает подозрение. Днём он обвиняет. Если Мафия уходит, она получает 1000.',
    cast: ['Vanya', 'Masha', 'Dima', 'Katya'],
    kidsLocal: ['Ваня', 'Маша', 'Дима', 'Катя'],
    parent: 'Мама',
    outage: { off: '🕯️ Свет вырубили!', on: '💡 Свет дали!' },
    theme: {
      floor: 'parquet', mat: 'carpetwall', wall: ['#e8dfc8', '#9a7a5a', '#6a4f36'],
      month: 'ИЮНЬ 1998', ball: 'football', skins: ['#f1d0b5', '#ecc6a8', '#f3d6bd', '#e8bf9f'],
    },
  },
  DE: {
    id: 'DE', flag: '🇩🇪', name: 'Germany', game: 'Räuber und Gendarm', lang: 'german',
    roles: {
      king:      { name: 'König',   emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Königin', emoji: '👸', acc: 'tiara', color: '#9f3269', points: 800 },
      detective: { name: 'Gendarm', emoji: '👮', acc: 'helmet', color: '#2f4f2f', points: 500 },
      thief:     { name: 'Räuber',  emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', witness: true, escape: 1000 },
    ruleText: 'Ein Zeuge gibt dem Gendarm einen Tipp, aber Zeugen irren sich manchmal! Dann wird verhaftet. Entkommt der Räuber, bekommt er 1000.',
    cast: ['Lukas', 'Lena', 'Felix', 'Hanna'],
    parent: 'Mama',
    outage: { off: '🌩️ Stromausfall! Gewitter…', on: '💡 Der Strom ist wieder da!' },
    theme: {
      floor: 'wood', mat: 'rug', wall: ['#ece6d6', '#a8b89a', '#6f7f5f'],
      month: 'JUNI 1998', ball: 'football', skins: ['#f1d0b5', '#e8bf9f', '#c58c5c', '#f3d6bd'],
    },
  },
  FR: {
    id: 'FR', flag: '🇫🇷', name: 'France', game: 'Gendarmes et Voleurs', lang: 'french',
    roles: {
      king:      { name: 'Roi',      emoji: '👑', acc: 'crown',  color: '#9a6a09', points: 1000 },
      queen:     { name: 'Reine',    emoji: '👸', acc: 'tiara',  color: '#9f3269', points: 800 },
      detective: { name: 'Gendarme', emoji: '👮', acc: 'kepi',   color: '#1f2f6b', points: 500 },
      thief:     { name: 'Voleur',   emoji: '🦹', acc: 'beret',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', finalDouble: true, escape: 1000 },
    ruleText: 'Le Gendarme cherche le Voleur parmi les trois autres. Au dernier tour, tous les points comptent double ! Si le Voleur s’échappe, il gagne 1000.',
    cast: ['Lucas', 'Chloé', 'Hugo', 'Manon'],
    parent: 'Maman',
    outage: { off: '🌩️ Panne de courant ! L’orage…', on: '💡 Le courant est revenu !' },
    theme: {
      floor: 'tiles', mat: 'rug', wall: ['#efe6d4', '#b9a3c9', '#7a6a8a'],
      month: 'JUIN 1998', ball: 'football', skins: ['#f1d0b5', '#a86f45', '#e8bf9f', '#f3d6bd'],
    },
  },
  BR: {
    id: 'BR', flag: '🇧🇷', name: 'Brazil', game: 'Polícia e Ladrão', lang: 'portuguese',
    roles: {
      king:      { name: 'Rei',     emoji: '👑', acc: 'crown', color: '#9a6a09', points: 1000 },
      queen:     { name: 'Rainha',  emoji: '👸', acc: 'tiara', color: '#9f3269', points: 800 },
      detective: { name: 'Polícia', emoji: '👮', acc: 'cap',   color: '#23617a', points: 500 },
      thief:     { name: 'Ladrão',  emoji: '🦹', acc: 'mask',  color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', steal: 300, escape: 1000 },
    ruleText: 'A Polícia tem que achar o Ladrão entre os outros três. Se o Ladrão fugir, ganha 1000 e ainda rouba 300 do Rei!',
    cast: ['Pedro', 'Ana', 'Gabriel', 'Júlia'],
    parent: 'Mãe',
    outage: { off: '🌩️ Acabou a luz! Temporal…', on: '💡 A luz voltou!' },
    theme: {
      floor: 'tiles', mat: 'rug', wall: ['#f1e7cf', '#7fc0a0', '#3f8f6a'],
      month: 'JUNHO 1998', ball: 'football', skins: ['#c58c5c', '#8d5a35', '#e2b28c', '#a86f45'],
    },
  },
  MX: {
    id: 'MX', flag: '🇲🇽', name: 'Mexico', game: 'Policías y Ladrones', lang: 'spanish',
    roles: {
      king:      { name: 'Rey',     emoji: '👑', acc: 'crown',    color: '#9a6a09', points: 1000 },
      queen:     { name: 'Reina',   emoji: '👸', acc: 'tiara',    color: '#9f3269', points: 800 },
      detective: { name: 'Policía', emoji: '👮', acc: 'cap',      color: '#23617a', points: 500 },
      thief:     { name: 'Ladrón',  emoji: '🦹', acc: 'sombrero', color: '#9b2435', points: 0 },
    },
    rules: { guesser: 'detective', onWrong: 'thief', tell: true, escape: 1000 },
    ruleText: 'Alguien no aguanta la risa… ¡casi siempre es el Ladrón, pero no siempre! La Policía decide a quién arrestar. Si el Ladrón escapa, gana 1000.',
    cast: ['Diego', 'Sofía', 'Mateo', 'Valeria'],
    parent: 'Mamá',
    outage: { off: '🌩️ ¡Se fue la luz!', on: '💡 ¡Ya volvió la luz!' },
    theme: {
      floor: 'tiles', mat: 'sarape', wall: ['#f3e2c6', '#e08a5a', '#a8503a'],
      month: 'JUNIO 1998', ball: 'football', skins: ['#c58c5c', '#b07a50', '#d6a77a', '#9c6a42'],
    },
  },
};

/*
 * Two text modes per edition:
 *   'en'    — default: English UI, English role names and English dialogue
 *             (South Asian / European editions share an international English
 *             pack; Japan/Korea/China keep their own flavoured English).
 *   'local' — the country's own language for UI, roles, rules and dialogue.
 */
const ENGLISH = {
  IN: { game: 'Thief, Police, King, Queen', roles: ['King', 'Queen', 'Police', 'Thief'], parent: 'Mom',
    ruleText: 'The Police must find the Thief among the other three. Guess wrong and the Police and the Thief swap points.',
    outage: { off: '🕯️ Power cut!', on: '💡 The power is back!' } },
  PK: { game: 'King, Minister, Thief, Soldier', roles: ['King', 'Minister', 'Soldier', 'Thief'], parent: 'Mom',
    ruleText: 'Only the Minister steps forward; nobody else says who they are. The Minister must find the Thief among the other three. Guess wrong and the Minister and the Thief swap points.',
    outage: { off: '🕯️ Load shedding again…', on: '💡 The power is back!' } },
  NP: { game: 'King, Minister, Thief, Soldier', roles: ['King', 'Minister', 'Soldier', 'Thief'], parent: 'Mom',
    ruleText: 'Only the Minister steps forward; nobody else says who they are. The Minister must find the Thief among the other three. Guess wrong and the Minister and the Thief swap points.',
    outage: { off: '🕯️ Load shedding again…', on: '💡 The lights are back!' } },
  BD: { game: 'King, Minister, Thief, Police', roles: ['King', 'Minister', 'Police', 'Thief'], parent: 'Mom',
    ruleText: 'Only the Police steps forward; nobody else says who they are. The Police must find the Thief among the other three. Guess wrong and the Police and the Thief swap points.',
    outage: { off: '🕯️ The power’s gone…', on: '💡 The power is back!' } },
  JP: { game: 'The Lord and the Thief', roles: ['Lord', 'Retainer', 'Constable', 'Thief'], parent: 'Mom',
    ruleText: 'The Constable gets one character clue that clears an innocent, then picks the Thief from the last two. If the Thief escapes, they take 1000.',
    outage: { off: '🌩️ Blackout! Typhoon…', on: '💡 The lights are back!' } },
  KR: { game: 'Mafia Game', roles: ['Citizen', 'Doctor', 'Police', 'Mafia'], parent: 'Mom',
    ruleText: 'At night the Mafia attacks someone and the Doctor tries to save one player. An unsaved victim scores 0 this round. By day, the Police accuses. If the Mafia escapes, they take 1000.',
    outage: { off: '🌩️ Blackout! Thunderstorm…', on: '💡 The power is back!' } },
  CN: { game: 'Police Catch the Thief', roles: ['Emperor', 'Minister', 'Police', 'Thief'], parent: 'Mom',
    ruleText: 'The Police picks the Thief from the other three. If caught, the Thief pays a 200 fine to the Police. If the Thief escapes, they take 1000.',
    outage: { off: '🕯️ Power cut!', on: '💡 The power is back!' } },
  US: null, UK: null,
  RU: { game: 'Mafia', roles: ['Civilian', 'Doctor', 'Commissar', 'Mafia'], parent: 'Mom',
    ruleText: 'At night the Commissar secretly checks one player: sometimes that catches the Mafia straight away, sometimes it only clears someone. By day, the Commissar accuses. If the Mafia escapes, they take 1000.',
    outage: { off: '🕯️ The power’s out!', on: '💡 The power is back!' } },
  DE: { game: 'Robbers and Gendarmes', roles: ['King', 'Queen', 'Gendarme', 'Robber'], parent: 'Mom',
    ruleText: 'A witness gives the Gendarme a tip, but witnesses are sometimes wrong! Then comes the arrest. If the Robber escapes, they get 1000.',
    outage: { off: '🌩️ Blackout! Thunderstorm…', on: '💡 The power is back!' } },
  FR: { game: 'Cops and Thieves', roles: ['King', 'Queen', 'Gendarme', 'Thief'], parent: 'Mom',
    ruleText: 'The Gendarme looks for the Thief among the other three. In the last round every point counts double! If the Thief escapes, they win 1000.',
    outage: { off: '🌩️ Power cut! The storm…', on: '💡 The power is back!' } },
  BR: { game: 'Cops and Robbers', roles: ['King', 'Queen', 'Police', 'Robber'], parent: 'Mom',
    ruleText: 'The Police must find the Robber among the other three. If the Robber escapes, they win 1000 and steal 300 from the King too!',
    outage: { off: '🌩️ The power went out! Big storm…', on: '💡 The power is back!' } },
  MX: { game: 'Cops and Robbers', roles: ['King', 'Queen', 'Police', 'Robber'], parent: 'Mom',
    ruleText: 'Somebody can’t stop giggling. It’s usually the Robber, but not always! The Police decides who to arrest. If the Robber escapes, they win 1000.',
    outage: { off: '🌩️ The power went out!', on: '💡 The power is back!' } },
};

// Dialogue pack per mode, and the label for the "local language" button.
const PACKS = {
  IN: ['english', 'hinglish', 'Hinglish'], PK: ['english', 'urdu', 'Urdu'], NP: ['english', 'nepali', 'नेपाली'], BD: ['english', 'bangla', 'বাংলা'],
  JP: ['japanese', 'japanese_native', '日本語'], KR: ['korean', 'korean_native', '한국어'], CN: ['chinese', 'chinese_native', '中文'],
  US: ['american', 'american', null], UK: ['british', 'british', null],
  RU: ['english', 'russian', 'Русский'], DE: ['english', 'german', 'Deutsch'], FR: ['english', 'french', 'Français'],
  BR: ['english', 'portuguese', 'Português'], MX: ['english', 'spanish', 'Español'],
};

// Text-to-speech languages to try, best first, for each mode.
const VOICES = {
  IN: [['en-IN', 'en-GB'], ['en-IN', 'hi-IN']], PK: [['en-IN', 'en-GB'], ['en-IN', 'ur-PK']], NP: [['en-IN', 'en-GB'], ['en-IN', 'ne-NP']], BD: [['en-IN', 'en-GB'], ['en-IN', 'bn-IN']],
  JP: [['en-US', 'en-GB'], ['ja-JP']], KR: [['en-US', 'en-GB'], ['ko-KR']], CN: [['en-US', 'en-GB'], ['zh-CN', 'zh-TW']],
  US: [['en-US'], ['en-US']], UK: [['en-GB', 'en-AU'], ['en-GB', 'en-AU']],
  RU: [['en-GB', 'en-US'], ['ru-RU']], DE: [['en-GB', 'en-US'], ['de-DE', 'de-AT']], FR: [['en-GB', 'en-US'], ['fr-FR', 'fr-CA']],
  BR: [['en-US', 'en-GB'], ['pt-BR', 'pt-PT']], MX: [['en-US', 'en-GB'], ['es-MX', 'es-US', 'es-ES']],
};

const SLOT_ORDER = ['king', 'queen', 'detective', 'thief'];
Object.keys(COUNTRIES).forEach(id => {
  const c = COUNTRIES[id];
  const [enPack, localPack, label] = PACKS[id];
  c.packs = { en: enPack, local: localPack };
  c.localLabel = label;          // null = the local language is already English
  c.voices = { en: VOICES[id][0], local: VOICES[id][1] };
  c.english = ENGLISH[id];
});

/**
 * The edition as shown in a given text mode: same rules and theme, with the
 * role names, title, rule text, captions and dialogue pack in that language.
 */
export function localize(country, mode = 'en') {
  const local = mode === 'local' || !country.english;
  const en = country.english;
  const roles = {};
  SLOT_ORDER.forEach((slot, i) => {
    roles[slot] = { ...country.roles[slot], name: local ? country.roles[slot].name : en.roles[i] };
  });
  return {
    ...country,
    mode: local ? 'local' : 'en',
    roles,
    // English-speaking editions have no "local" title of their own
    game: local && en ? country.game : (GAME_NAME_EN[country.id] || country.game),
    ruleText: local ? country.ruleText : en.ruleText,
    outage: local ? country.outage : en.outage,
    parent: local ? country.parent : en.parent,
    cast: country.cast,
    lang: local ? country.packs.local : country.packs.en,
    voice: local ? country.voices.local : country.voices.en,
  };
}

// The one name each game is shown under, in Latin letters so anyone can read it.
export const GAME_NAME_EN = {
  IN: 'Raja Rani Chor Police', PK: 'Raja Wazir Chor Sipahi', NP: 'Raja Mantri Chor Sipahi', BD: 'Raja Mantri Chor Police',
  JP: 'Tonosama to Dorobo', KR: 'Mafia Game', CN: 'Jingcha Zhua Xiaotou', RU: 'Mafia: Commissar',
  US: 'Cops and Robbers', UK: 'King, Queen, Bobby & Robber', DE: 'Räuber und Gendarm', FR: 'Gendarmes et Voleurs',
  BR: 'Polícia e Ladrão', MX: 'Policías y Ladrones',
};
// Each game's own role names in Latin letters (king, queen, detective, thief),
// shown with the English meaning so every game looks like itself.
export const ROLE_LATIN = {
  IN: ['Raja', 'Rani', 'Police', 'Chor'], PK: ['Raja', 'Wazir', 'Sipahi', 'Chor'],
  NP: ['Raja', 'Mantri', 'Sipahi', 'Chor'], BD: ['Raja', 'Mantri', 'Police', 'Chor'],
  JP: ['Tonosama', 'Karō', 'Okappiki', 'Dorobō'], KR: ['Simin', 'Uisa', 'Gyeongchal', 'Mafia'],
  CN: ['Huángdì', 'Zǎixiàng', 'Jǐngchá', 'Xiǎotōu'], RU: ['Mirny', 'Doktor', 'Komissar', 'Mafiya'],
  US: ['Mayor', 'Banker', 'Sheriff', 'Robber'], UK: ['King', 'Queen', 'Bobby', 'Robber'],
  DE: ['König', 'Königin', 'Gendarm', 'Räuber'], FR: ['Roi', 'Reine', 'Gendarme', 'Voleur'],
  BR: ['Rei', 'Rainha', 'Polícia', 'Ladrão'], MX: ['Rey', 'Reina', 'Policía', 'Ladrón'],
};

// A role emoji that represents each game on its picker card
export const GAME_ICON = {
  IN: '👑', PK: '🧔', NP: '🎩', BD: '👮', JP: '🏯', KR: '🕶️', CN: '🐉', RU: '🕵️', US: '🤠', UK: '💂', DE: '🦹', FR: '🥖', BR: '⚽', MX: '🌮',
};

// Every name people actually search for, per game (local script + English).
export const GAME_AKA = {
  IN: ['Raja Rani Chor Police', 'Raja Mantri Chor Sipahi', 'Chor Police', 'Raja Rani Chor Sipahi', 'राजा रानी चोर पुलिस', 'राजा मंत्री चोर सिपाही', 'King Queen Thief Police', 'Paper chit game'],
  PK: ['Raja Wazir Chor Sipahi', 'Badshah Wazir Chor Sipahi', 'راجہ وزیر چور سپاہی', 'بادشاہ وزیر چور سپاہی', 'King Minister Thief Soldier', 'Parchi game'],
  NP: ['Raja Mantri Chor Sipahi', 'राजा मन्त्री चोर सिपाही', 'Raja Mantri Chor Police', 'King Minister Thief Soldier', 'Chit game'],
  BD: ['Raja Mantri Chor Police', 'রাজা মন্ত্রী চোর পুলিশ', 'Chor Police', 'চোর পুলিশ খেলা', 'King Minister Thief Police'],
  JP: ['殿様と泥棒', 'Tonosama to Dorobo', '泥棒ゲーム', 'The Lord and the Thief', '紙くじゲーム'],
  KR: ['마피아 게임', 'Mafia game', '마피아 게임 규칙', 'Citizen Doctor Police Mafia', '종이 마피아 게임'],
  CN: ['警察抓小偷', 'Jingcha Zhua Xiaotou', 'Police Catch the Thief', '皇帝宰相警察小偷', '抽纸条游戏'],
  RU: ['Мафия', 'Игра Мафия', 'Mafia game', 'Мафия комиссар доктор', 'Mafia party game'],
  US: ['Cops and Robbers', 'Cops and Robbers game', 'Mayor Banker Sheriff Robber', 'Paper slip detective game'],
  UK: ['Cops and Robbers', 'King Queen Bobby Robber', 'Cops and Robbers paper game', 'Detective party game'],
  DE: ['Räuber und Gendarm', 'Räuber und Gendarm Spiel', 'Räuber und Polizei', 'König Königin Gendarm Räuber'],
  FR: ['Gendarmes et voleurs', 'Jeu gendarmes et voleurs', 'Roi Reine Gendarme Voleur', 'Gendarme et voleur'],
  BR: ['Polícia e Ladrão', 'Polícia e ladrão jogo', 'Rei Rainha Polícia Ladrão', 'Polícia e ladrão de papel'],
  MX: ['Policías y ladrones', 'Juego de policías y ladrones', 'Rey Reina Policía Ladrón', 'Policías y rateros'],
};

// URL-friendly game names (used by ?game=… deep links and the SEO landing pages)
export const GAME_SLUGS = {
  IN: 'raja-rani-chor-police', PK: 'raja-wazir-chor-sipahi', NP: 'raja-mantri-chor-sipahi', BD: 'raja-mantri-chor-police',
  JP: 'tonosama-to-dorobo', KR: 'mafia-game-korean', CN: 'jingcha-zhua-xiaotou', RU: 'mafia-game',
  US: 'cops-and-robbers', UK: 'cops-and-robbers-uk', DE: 'rauber-und-gendarm', FR: 'gendarmes-et-voleurs',
  BR: 'policia-e-ladrao', MX: 'policias-y-ladrones',
};

export const COUNTRY_ORDER =['IN', 'PK', 'NP', 'BD', 'JP', 'KR', 'CN', 'RU', 'US', 'UK', 'DE', 'FR', 'BR', 'MX'];

const TZ_MAP = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Kathmandu': 'NP', 'Asia/Katmandu': 'NP',
  'Asia/Dhaka': 'BD', 'Asia/Dacca': 'BD',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN', 'PRC': 'CN',
  'Europe/London': 'UK', 'Europe/Belfast': 'UK',
  'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE',
  'Europe/Paris': 'FR',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX', 'America/Cancun': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX',
};

const NO_REAL_TZ = /^(UTC|GMT|Etc\/|Universal|Zulu|Greenwich)/;

/**
 * Which game to show first: the one from the country the device is in.
 * - The device's own timezone decides (no location permission, no network).
 * - If the browser hides its timezone (UTC), the region in its language is used (en-IN → India).
 * - Any country without its own game gets Cops and Robbers (USA).
 * Returns { id, source } where source is 'timezone' | 'language' | 'default'.
 */
export function detectCountryInfo() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
  if (TZ_MAP[tz]) return { id: TZ_MAP[tz], source: 'timezone' };
  if (!tz || NO_REAL_TZ.test(tz)) {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
    for (const l of langs) {
      const region = (String(l).split(/[-_]/)[1] || '').toUpperCase();
      const id = region === 'GB' ? 'UK' : region;
      if (COUNTRIES[id]) return { id, source: 'language' };
    }
  }
  return { id: 'US', source: 'default' };
}

export function detectCountry() {
  return detectCountryInfo().id;
}
