/**
 * Every table game's own messages. As in the chit game, phones send only a line's number, never
 * text, so nobody can send anything unpleasant, and each phone reads it in its own language.
 *
 * A line's number: 0–7 are the common lines, then come the six lines of this game, always in the
 * same order: 0–1 for a good moment, 2–3 for a bad one, 4–5 for chatting.
 * Common lines are translated into every language; Ludo's lines into most, and the other games'
 * lines into English and Hinglish so far. Anything missing is shown in English.
 */
const COMMON = {
  en: ['Good luck, everyone!', 'Nice move!', 'Well played!', 'Oh no!', 'Not again!', 'Hurry up, it’s your turn!', 'Lucky me!', 'One more game?'],
  hinglish: ['Sabko all the best!', 'Kya chaal hai!', 'Bahut badhiya khele!', 'Arre nahi!', 'Phir se nahi yaar!', 'Jaldi karo, tumhari baari hai!', 'Aaj kismat mere saath hai!', 'Ek game aur ho jaye?'],
  hindi: ['सबको शुभकामनाएँ!', 'क्या चाल है!', 'बहुत बढ़िया खेले!', 'अरे नहीं!', 'फिर से नहीं!', 'जल्दी करो, तुम्हारी बारी है!', 'आज किस्मत मेरे साथ है!', 'एक गेम और हो जाए?'],
  urdu: ['Sab ko good luck!', 'Kya chaal hai!', 'Bohat acha khele!', 'Arre nahi!', 'Phir se nahi!', 'Jaldi karo, aap ki baari hai!', 'Aaj qismat mere saath hai!', 'Ek game aur ho jaye?'],
  nepali: ['Sabailai shubhakamana!', 'Kasto ramro chaal!', 'Dherai ramro khelnubhayo!', 'Aiya!', 'Feri hoina!', 'Chito gara, timro palo!', 'Aaja bhagya mero saath chha!', 'Arko game khelne?'],
  bangla: ['Sobai ke shubhokamona!', 'Darun chal!', 'Khub bhalo khelechen!', 'Oh na!', 'Abar na!', 'Taratari koro, tomar pala!', 'Aj bhagyo amar sathe!', 'Ar ekta game hobe?'],
  romaji: ['Minna, ganbarou!', 'Ii te da ne!', 'Ii shoubu datta!', 'Aa, shimatta!', 'Mata ka!', 'Hayaku, kimi no ban da yo!', 'Kyou wa tsuiteru!', 'Mou ikkai yarou?'],
  korean_roman: ['Modu hwaiting!', 'Jal haetda!', 'Jal haesseoyo!', 'An dwae!', 'Tto?!', 'Ppalli, ne chaeryeya!', 'Oneul uni jota!', 'Han pan deo?'],
  pinyin: ['Dajia jiayou!', 'Zhe bu bucuo!', 'Da de piaoliang!', 'A, buhao!', 'You lai!', 'Kuai dian, lun dao ni le!', 'Jintian yunqi zhen hao!', 'Zai lai yi ju?'],
  russian_latin: ['Vsem udachi!', 'Khoroshiy khod!', 'Khorosho sygrali!', 'O net!', 'Opyat!', 'Bystreye, tvoy khod!', 'Segodnya mne vezyot!', 'Yeshcho odnu igru?'],
  german: ['Viel Glück, alle!', 'Guter Zug!', 'Gut gespielt!', 'Oh nein!', 'Nicht schon wieder!', 'Beeil dich, du bist dran!', 'Heute habe ich Glück!', 'Noch eine Runde?'],
  french: ['Bonne chance à tous !', 'Beau coup !', 'Bien joué !', 'Oh non !', 'Encore !', 'Vite, c’est à toi !', 'J’ai de la chance !', 'On en refait une ?'],
  portuguese: ['Boa sorte, pessoal!', 'Boa jogada!', 'Muito bem jogado!', 'Ah não!', 'De novo não!', 'Anda, é a sua vez!', 'Hoje estou com sorte!', 'Mais uma partida?'],
  spanish: ['¡Suerte a todos!', '¡Buena jugada!', '¡Bien jugado!', '¡Oh no!', '¡Otra vez no!', '¡Date prisa, te toca!', '¡Hoy tengo suerte!', '¿Otra partida?'],
  indonesian: ['Semoga beruntung!', 'Langkah bagus!', 'Main yang bagus!', 'Oh tidak!', 'Jangan lagi!', 'Cepat, giliranmu!', 'Aku beruntung!', 'Main lagi?'],
  turkish: ['Herkese bol şans!', 'Güzel hamle!', 'İyi oynadın!', 'Olamaz!', 'Yine mi!', 'Çabuk, sıra sende!', 'Bugün şanslıyım!', 'Bir oyun daha?'],
  italian: ['Buona fortuna a tutti!', 'Bella mossa!', 'Ben giocato!', 'Oh no!', 'Di nuovo!', 'Sbrigati, tocca a te!', 'Che fortuna!', 'Un’altra partita?'],
};
const GAME = {
  ludo: {
    en: ['Got you! Back to the yard!', 'I’m coming for you!', 'Oh no, my token!', 'Come on, give me a six!', 'Almost home!', 'Lucky dice today!'],
    hinglish: ['Pakda gaya! Wapas ghar jao!', 'Ab tumhari baari, aa raha hoon!', 'Arre nahi, meri goti!', 'Chal yaar, ek chhakka de!', 'Bas ghar pahunchne wala hoon!', 'Aaj dice mera dost hai!'],
    urdu: ['Pakar liya! Wapas ghar jao!', 'Ab main aa raha hoon!', 'Arre nahi, meri goti!', 'Chalo yaar, ek chhakka do!', 'Bas ghar pohanchne wala hoon!', 'Aaj dice mera dost hai!'],
    nepali: ['Samatiyo! Ghar farka!', 'Ma aundai chhu!', 'Aiya, mero goti!', 'La yaar, euta chakka de!', 'Ghar pugna lagyo!', 'Aaja dice mero sathi ho!'],
    bangla: ['Dhore felechi! Ghore fero!', 'Ami aschi!', 'Oh na, amar guti!', 'Chol, ekta chokka de!', 'Prae ghore pouche gechi!', 'Aj dice amar bondhu!'],
    romaji: ['Tsukamaeta! Modotte!', 'Ima iku yo!', 'Aa, watashi no koma ga!', 'Onegai, roku dete!', 'Mou sugu gooru!', 'Saikoro ga mikata da!'],
    korean_roman: ['Jabatda! Dorawa!', 'Ije gandal!', 'An dwae, nae mal!', 'Jebal yuk nawara!', 'Geoui da watda!', 'Juesawi uni jota!'],
    pinyin: ['Zhua dao ni le! Hui qu ba!', 'Wo lai le!', 'A, wo de qizi!', 'Lai ge liu ba!', 'Kuai dao jia le!', 'Shaizi zhen ting wo de!'],
    russian_latin: ['Popalsya! Nazad!', 'Ya idu za toboy!', 'O net, moya fishka!', 'Nu zhe, shestyorku!', 'Pochti doma!', 'Kubik segodnya za menya!'],
    german: ['Hab dich! Zurück ins Haus!', 'Ich komme dich holen!', 'Oh nein, meine Figur!', 'Komm schon, eine Sechs!', 'Fast zu Hause!', 'Der Würfel mag mich!'],
    french: ['Je t’ai eu ! Retour à la base !', 'J’arrive !', 'Oh non, mon pion !', 'Allez, un six !', 'Presque arrivé !', 'Les dés m’aiment !'],
    portuguese: ['Te peguei! Volta pra casa!', 'Estou indo atrás de você!', 'Ah não, minha peça!', 'Vamos, um seis!', 'Quase em casa!', 'O dado gosta de mim!'],
    spanish: ['¡Te pillé! ¡A casa!', '¡Voy por ti!', '¡Oh no, mi ficha!', '¡Vamos, un seis!', '¡Casi en casa!', '¡El dado me quiere!'],
  },
  carrom: { en: ['Straight in the pocket!', 'The queen is mine!', 'Missed by a hair!', 'That striker has a mind of its own!', 'Watch this shot.', 'Nice angle!'], hinglish: ['Seedha pocket mein!', 'Rani meri hai!', 'Bas zara sa reh gaya!', 'Yeh striker apni marzi ka hai!', 'Yeh shot dekhna.', 'Kya angle hai!'] },
  chess: { en: ['Check!', 'Your queen looks nervous.', 'I didn’t see that coming!', 'That was my best piece!', 'Hmm, let me think.', 'Interesting opening.'], hinglish: ['Shah!', 'Tumhari rani ghabra rahi hai.', 'Yeh toh socha hi nahi tha!', 'Woh mera sabse accha mohra tha!', 'Hmm, sochne do.', 'Dilchasp shuruaat hai.'] },
  'snakes-and-ladders': { en: ['Up the ladder I go!', 'See you at the top!', 'That snake again!', 'Sliding all the way down!', 'Just one good roll.', 'Who put a snake there?'], hinglish: ['Seedhi mil gayi!', 'Upar milte hain!', 'Phir wahi saanp!', 'Seedha neeche aa gaya!', 'Bas ek accha dice chahiye.', 'Yeh saanp yahan kisne rakha?'] },
  'call-break': { en: ['That trick is mine!', 'Spades never fail!', 'My call is in danger!', 'Who hid all the aces?', 'Call carefully this time.', 'Nice card!'], hinglish: ['Yeh haath mera!', 'Hukum kabhi dhokha nahi deta!', 'Meri call khatre mein hai!', 'Saare ikke kisne chhupaye?', 'Is baar soch kar call karna.', 'Kya patta hai!'] },
  'crazy-eights': { en: ['Eight! New suit!', 'One step from empty!', 'Draw again? Really?', 'Nothing matches!', 'Choose wisely.', 'Nice match!'], hinglish: ['Aath! Naya rang!', 'Bas thode patte bache!', 'Phir patta uthana hai?', 'Kuch match hi nahi ho raha!', 'Soch kar chalo.', 'Sahi match kiya!'] },
  checkers: { en: ['Double jump!', 'King me!', 'You got me there!', 'I walked right into that.', 'Mind your back row.', 'Forced capture, sorry!'], hinglish: ['Double jump!', 'Mera raja ban gaya!', 'Yeh toh phasa diya!', 'Main khud jaal mein aa gaya.', 'Peeche ki line sambhalo.', 'Capture zaroori hai, sorry!'] },
  'four-in-a-row': { en: ['Four in a row!', 'Two threats, one move!', 'I missed that line!', 'Blocked again!', 'Middle column, always.', 'Careful what you stack.'], hinglish: ['Chaar line mein!', 'Do khatre, ek chaal!', 'Yeh line nahi dekhi!', 'Phir rok diya!', 'Beech wala column hi best hai.', 'Soch kar disc daalo.'] },
  'tic-tac-toe': { en: ['Three in a line!', 'A perfect fork!', 'I didn’t block that!', 'Another draw?', 'Centre is mine.', 'Your move.'], hinglish: ['Teen line mein!', 'Kya jaal bichhaya!', 'Yeh rokna tha!', 'Phir barabar?', 'Beech wala mera.', 'Tumhari chaal.'] },
  reversi: { en: ['Corner taken!', 'Look at them all flip!', 'There goes my row!', 'No moves left for me!', 'It’s not over yet.', 'The board can still turn.'], hinglish: ['Kona mera!', 'Dekho sab palat gaye!', 'Meri poori line gayi!', 'Meri koi chaal hi nahi!', 'Abhi khel baaki hai.', 'Baazi abhi palat sakti hai.'] },
  'dots-and-boxes': { en: ['That box is mine!', 'A whole chain!', 'You left me nothing!', 'I shouldn’t have drawn that.', 'Every line counts.', 'Who opens the next chain?'], hinglish: ['Yeh dabba mera!', 'Poori chain mil gayi!', 'Kuch chhoda hi nahi!', 'Woh line nahi khinchni thi.', 'Har line zaroori hai.', 'Agli chain kaun kholega?'] },
  mancala: { en: ['Another turn for me!', 'Captured them all!', 'My seeds are gone!', 'You emptied my side!', 'Count before you sow.', 'My store is filling up.'], hinglish: ['Ek aur baari meri!', 'Saare beej mere!', 'Mere beej gaye!', 'Meri taraf khaali kar di!', 'Ginkar chaal chalo.', 'Mera store bhar raha hai.'] },
  'nine-mens-morris': { en: ['A mill!', 'One of yours comes off!', 'You broke my mill!', 'Down to three pieces!', 'Open it, close it again.', 'Watch the crossings.'], hinglish: ['Teen ki line!', 'Tumhari ek goti gayi!', 'Meri line tod di!', 'Sirf teen goti bachi!', 'Kholo aur phir band karo.', 'Chauraahon par nazar rakho.'] },
  'memory-match': { en: ['I knew it was there!', 'A pair for me!', 'I saw it, I swear!', 'Wrong tile again!', 'Are you watching closely?', 'It was right here…'], hinglish: ['Mujhe pata tha yahin hai!', 'Jodi mil gayi!', 'Maine dekha tha, sach mein!', 'Phir galat tile!', 'Dhyan se dekh rahe ho?', 'Yahin toh tha…'] },
  yacht: { en: ['What a roll!', 'Full house!', 'All that for nothing!', 'A zero? Really?', 'One more roll?', 'Keep or risk it?'], hinglish: ['Kya dice aaya!', 'Full house!', 'Sab bekaar gaya!', 'Zero? Sach mein?', 'Ek baar aur?', 'Rakh lun ya risk lun?'] },
  pig: { en: ['Banked!', 'Nearly there!', 'A one! Gone!', 'I should have held!', 'One more roll…', 'Feeling brave?'], hinglish: ['Bank kar liya!', 'Bas pahunch gaya!', 'Ek aa gaya! Sab gaya!', 'Ruk jana chahiye tha!', 'Bas ek baar aur…', 'Himmat hai?'] },
  'who-is-the-spy': { en: ['Got the spy!', 'I knew it was you!', 'It wasn’t me!', 'Why is everyone looking at me?', 'That clue was strange…', 'Somebody’s word is different.'], hinglish: ['Jasoos pakda gaya!', 'Mujhe pata tha tum ho!', 'Maine kuch nahi kiya!', 'Sab mujhe kyun dekh rahe ho?', 'Yeh clue ajeeb tha…', 'Kisi ka word alag hai.'] },
  'truth-or-dare': { en: ['That was brave!', 'Best answer yet!', 'That’s so embarrassing!', 'I’ll skip this one!', 'Truth or dare?', 'I want to see this!'], hinglish: ['Kya himmat hai!', 'Sabse accha jawab!', 'Yeh toh bada sharmnaak hai!', 'Yeh main skip karunga!', 'Truth ya dare?', 'Yeh toh dekhna hai!'] },
  'riddle-chits': { en: ['I knew that one!', 'Too easy!', 'It was so obvious!', 'Why didn’t I take the hint?', 'Think, think…', 'Tricky one!'], hinglish: ['Yeh mujhe aata tha!', 'Bahut aasan tha!', 'Itna seedha tha!', 'Hint le leta!', 'Socho, socho…', 'Yeh mushkil hai!'] },
  'majority-vote': { en: ['I knew the crowd!', 'We all think alike!', 'Only me? Really?', 'I don’t know this table at all!', 'What will they pick?', 'Think like the crowd.'], hinglish: ['Mujhe sabka pata tha!', 'Sab ek jaisa sochte hain!', 'Sirf main? Sach mein?', 'Is table ko samajh hi nahi paya!', 'Sab kya chunenge?', 'Sabki tarah socho.'] },
  consequences: { en: ['This story is going to be great!', 'Wait till you read mine!', 'What did you write?!', 'That makes no sense at all!', 'No peeking!', 'I can’t wait to unfold it.'], hinglish: ['Kahani mazedaar hogi!', 'Meri line padhna!', 'Yeh kya likh diya?!', 'Iska koi matlab hi nahi!', 'Jhankna mat!', 'Kholne ka intezaar hai.'] },
};
Object.assign(GAME, {
  'color-clash': { en: ['Plus four for you!', 'Rainbow time!', 'Not another plus two!', 'I can’t match anything!', 'One card left…', 'Pick a colour, any colour.'], hinglish: ['Tere liye plus four!', 'Rainbow aa gaya!', 'Phir se plus two!', 'Kuch match hi nahi ho raha!', 'Bas ek patta bacha…', 'Koi bhi rang chuno.'] },
  'flying-chit': { en: ['Look at me fly!', 'Through the gap!', 'That pencil came from nowhere!', 'My wings!', 'How far can you go?', 'Don’t look down.'], hinglish: ['Dekho kaise ud raha hoon!', 'Nikal gaya!', 'Yeh pencil kahan se aayi!', 'Mere pankh!', 'Kitna door jaoge?', 'Neeche mat dekhna.'] },
  'hoop-flick': { en: ['Swish!', 'Nothing but net!', 'Hit the rim!', 'Too hard!', 'Nice soft arc…', 'That hoop is moving!'], hinglish: ['Swish!', 'Seedha net mein!', 'Rim se takra gaya!', 'Bahut zor se!', 'Aaram se arc banao…', 'Ye hoop to hil raha hai!'] },
  'ghost-hostel': { en: ['My door holds!', 'Fans on full!', 'It’s at my door!', 'My door is breaking!', 'Sleep and earn…', 'Make it to sunrise!'], hinglish: ['Mera darwaza majboot hai!', 'Pankhe full speed pe!', 'Bhoot mere darwaze pe hai!', 'Darwaza toot raha hai!', 'So jao aur kamao…', 'Subah tak bachna hai!'] },
  'werewolf': { en: ['I knew you were a werewolf!', 'The village is safe… for now.', 'It wasn’t me, I promise!', 'Why vote for me?', 'Who was quiet last night?', 'Trust nobody.'], hinglish: ['Mujhe pata tha tu werewolf hai!', 'Gaon abhi safe hai… abhi ke liye.', 'Main nahi hoon, kasam se!', 'Mujhe vote kyun?', 'Kal raat kaun chup tha?', 'Kisi pe bharosa mat karo.'] },
  'pin-spin': { en: ['Right in the gap!', 'Got the star!', 'So close!', 'Pin clash!', 'Wait for the gap…', 'Big board!'], hinglish: ['Ekdum gap mein!', 'Star mil gaya!', 'Bas zara sa!', 'Pin takra gaya!', 'Gap ka intezaar karo…', 'Bada board!'] },
  'bull-fight': { en: ['Out of the ring!', 'Full charge!', 'He got me!', 'Too close to the edge!', 'Lock horns!', 'Stay in the middle.'], hinglish: ['Bahar ho gaya!', 'Poori takkar!', 'Usne maar diya!', 'Kinare pe aa gaya!', 'Seeng se seeng!', 'Beech mein raho.'] },
  'ship-fight': { en: ['Direct hit!', 'Your ship is sinking!', 'I’m hit!', 'Man the pumps!', 'Fire at will!', 'Watch the rocks.'], hinglish: ['Seedha nishana!', 'Tumhara jahaz doob raha hai!', 'Mujhe lag gaya!', 'Jahaz bachao!', 'Fire karo!', 'Chattanon se bacho.'] },
  'road-dash': { en: ['Too easy!', 'Coins for me!', 'Who parked a cow there?!', 'Brakes! Brakes!', 'Faster, faster!', 'Mind the pothole.'], hinglish: ['Bahut aasan!', 'Coins mere!', 'Gaay yahan kisne khadi ki?!', 'Brake! Brake!', 'Aur tez, aur tez!', 'Gaddhe se bacho.'] },
  'backyard-rally': { en: ['Too fast for you!', 'What a shot!', 'I wasn’t ready!', 'The sun was in my eyes!', 'One more rally.', 'Keep it going!'], hinglish: ['Tumhare liye tez hai!', 'Kya shot hai!', 'Main ready nahi tha!', 'Dhoop aankh mein thi!', 'Ek rally aur.', 'Chalne do!'] },
  'hungry-snake': { en: ['Yum, a snack!', 'I’m so long now!', 'I bit myself!', 'Who put that wall there?', 'So hungry…', 'Watch your tail.'], hinglish: ['Wah, samosa!', 'Kitna lamba ho gaya!', 'Khud ko kaat liya!', 'Yeh deewar kisne rakhi?', 'Bahut bhookh lagi hai…', 'Apni poonch dekho.'] },
});
/* Tunnel Race had only the shared lines */
GAME['number-memory'] = { en: ['Got it in one!', 'Too many digits!', 'Was it a seven or a one?', 'My memory just quit.', 'Say it in your head…', 'Group them in threes.'], hinglish: ['Ek baar mein yaad!', 'Bahut saare digit!', 'Saat tha ya ek?', 'Yaaddasht ne jawab de diya.', 'Mann mein dohraao…', 'Teen-teen ki jodi banao.'] };
GAME['word-guess'] = { en: ['I know this one!', 'One more letter…', 'Too early, too early!', 'It fits the clue!', 'Spell it right!', 'Big points if I go now…'], hinglish: ['Ye to pata hai!', 'Bas ek akshar aur…', 'Bahut jaldi kar diya!', 'Ishaare se match karta hai!', 'Spelling sahi likhna!', 'Abhi bola to bade points…'] };
GAME['fast-typing'] = { en: ['Fingers on fire!', 'Oops, a typo!', 'Read it first…', 'Ten letters? Easy.', 'Faster, faster!', 'Check before ✓!'], hinglish: ['Ungliyan aag pe!', 'Oops, spelling galat!', 'Pehle padh lo…', 'Das akshar? Aasaan.', 'Tez, aur tez!', '✓ se pehle check karo!'] };
GAME['bingo'] = { en: ['One more for my line!', 'Who called that?!', 'B-I-N-G… almost!', 'Take the middle!', 'That one helps me too.', 'BINGO incoming!'], hinglish: ['Bas ek aur meri line ke liye!', 'Ye number kisne bola?!', 'B-I-N-G… bas thoda sa!', 'Beech waala lo!', 'Ye to mere bhi kaam ka hai.', 'BINGO aane waala hai!'] };
GAME['unblock-puzzle'] = { en: ['Move the truck first!', 'Who parked like this?!', 'One more and I am out!', 'Think from the gate back.', 'That was a wasted move.', 'Beep beep, coming through!'], hinglish: ['Pehle truck hatao!', 'Ye kisne aise park kiya?!', 'Bas ek aur aur main bahar!', 'Gate se ulta socho.', 'Ye chaal bekaar gayi.', 'Peep peep, raasta do!'] };
GAME['stroop-test'] = { en: ['Blue! No, red!', 'I read the word again…', 'Ink, not the word!', 'My brain is tangled.', 'Focus, focus…', 'Watch for "Tap the WORD".'], hinglish: ['Neela! Nahi, laal!', 'Phir se shabd padh liya…', 'Syahi, shabd nahi!', 'Dimaag ulajh gaya.', 'Dhyaan, dhyaan…', '"WORD" wale card dekho.'] };
GAME['reaction-time'] = { en: ['Too slow!', 'Did you see that?', 'Blue! I fell for blue!', 'My finger was asleep.', 'Wait for it…', 'Eyes on the screen.'], hinglish: ['Bahut dheere!', 'Dekha kitna tez tha?', 'Neela! Neele mein phas gaya!', 'Meri ungli so gayi thi.', 'Ruko… ruko…', 'Screen pe nazar rakho.'] };
GAME['turbo-tunnel'] = { en: ['Missed it by a whisker!', 'Nitro on!', 'Where did that truck come from?!', 'My car!', 'Faster, faster!', 'Follow the green arrows.'], hinglish: ['Baal-baal bacha!', 'Nitro chalu!', 'Yeh truck kahan se aaya?!', 'Meri gaadi!', 'Aur tez, aur tez!', 'Hare teer dekho.'] };
GAME['tunnel-race'] = GAME['tunnel-race'] || { en: ['Through the gap!', 'Gem collected!', 'That wall came fast!', 'I scraped the wall!', 'Faster, faster!', 'Stay in the middle.'], hinglish: ['Gap se nikal gaya!', 'Gem mil gaya!', 'Deewar achanak aa gayi!', 'Deewar se ragad gaya!', 'Aur tez, aur tez!', 'Beech mein raho.'] };
/* the playground games: what everyone shouted in the schoolyard */
GAME['lapa-chupi'] = {
  en: ['Found you!', 'Nobody will find me here!', 'Oh no, spotted!', 'Who giggled?!', 'Ready or not, here I come!', 'Shh… don’t laugh!'],
  hinglish: ['Dhappa! Mil gaya!', 'Yahan koi nahi dhoondh payega!', 'Arre, dikh gaya!', 'Kaun hasa?!', 'Aa raha hoon, chhup jao!', 'Shh… hasna mat!'],
};
GAME['baraf-pani'] = {
  en: ['Freeze! Got you!', 'Unfrozen, I’m free!', 'Frozen solid!', 'Somebody unfreeze me!', 'Quick, come and save me!', 'Can’t catch me!'],
  hinglish: ['Baraf! Pakda gaya!', 'Pani! Main azaad!', 'Jam gaya yaar!', 'Koi mujhe pani karo!', 'Jaldi aao, bachao!', 'Pakad ke dikhao!'],
};
GAME['pakda-padi'] = {
  en: ['Tag, you’re it!', 'Too slow!', 'Aw, I’m it now!', 'Out of breath…', 'No tag-backs!', 'Can’t catch me!'],
  hinglish: ['Pakda! Ab teri baari!', 'Itna dheere?', 'Arre, ab main pakdunga!', 'Saans phool gayi…', 'Wapas nahi pakad sakte!', 'Pakad ke dikhao!'],
};
/* every game's own lines in Hindi (Devanagari) */
const HINDI = {
  "ludo": [
    "पकड़ लिया! वापस घर जाओ!",
    "अब तुम्हारी बारी, आ रहा हूँ!",
    "अरे नहीं, मेरी गोटी!",
    "चलो, एक छक्का दो!",
    "बस घर पहुँचने वाला हूँ!",
    "आज पासा मेरा दोस्त है!"
  ],
  "carrom": [
    "सीधा पॉकेट में!",
    "रानी मेरी है!",
    "बस ज़रा सा रह गया!",
    "ये स्ट्राइकर अपनी मर्ज़ी का है!",
    "ये शॉट देखना।",
    "क्या एंगल है!"
  ],
  "chess": [
    "शह!",
    "तुम्हारी रानी घबरा रही है।",
    "ये तो सोचा ही नहीं था!",
    "वो मेरा सबसे अच्छा मोहरा था!",
    "हम्म, सोचने दो।",
    "दिलचस्प शुरुआत है।"
  ],
  "snakes-and-ladders": [
    "सीढ़ी मिल गई!",
    "ऊपर मिलते हैं!",
    "फिर वही साँप!",
    "सीधा नीचे आ गया!",
    "बस एक अच्छा पासा चाहिए।",
    "ये साँप यहाँ किसने रखा?"
  ],
  "call-break": [
    "ये हाथ मेरा!",
    "हुकुम कभी धोखा नहीं देता!",
    "मेरी कॉल ख़तरे में है!",
    "सारे इक्के किसने छुपाए?",
    "इस बार सोचकर कॉल करना।",
    "क्या पत्ता है!"
  ],
  "crazy-eights": [
    "आठ! नया रंग!",
    "बस थोड़े पत्ते बचे!",
    "फिर पत्ता उठाना है?",
    "कुछ मैच ही नहीं हो रहा!",
    "सोचकर चलो।",
    "सही मैच किया!"
  ],
  "checkers": [
    "डबल जंप!",
    "मेरा राजा बन गया!",
    "ये तो फँसा दिया!",
    "मैं ख़ुद जाल में आ गया।",
    "पीछे की लाइन सँभालो।",
    "कैप्चर ज़रूरी है, माफ़ करना!"
  ],
  "four-in-a-row": [
    "चार लाइन में!",
    "दो ख़तरे, एक चाल!",
    "ये लाइन नहीं देखी!",
    "फिर रोक दिया!",
    "बीच वाला कॉलम ही सबसे अच्छा है।",
    "सोचकर डिस्क डालो।"
  ],
  "tic-tac-toe": [
    "तीन लाइन में!",
    "क्या जाल बिछाया!",
    "ये रोकना था!",
    "फिर बराबर?",
    "बीच वाला मेरा।",
    "तुम्हारी चाल।"
  ],
  "reversi": [
    "कोना मेरा!",
    "देखो सब पलट गए!",
    "मेरी पूरी लाइन गई!",
    "मेरी कोई चाल ही नहीं!",
    "अभी खेल बाक़ी है।",
    "बाज़ी अभी पलट सकती है।"
  ],
  "dots-and-boxes": [
    "ये डिब्बा मेरा!",
    "पूरी चेन मिल गई!",
    "कुछ छोड़ा ही नहीं!",
    "वो लाइन नहीं खींचनी थी।",
    "हर लाइन ज़रूरी है।",
    "अगली चेन कौन खोलेगा?"
  ],
  "mancala": [
    "एक और बारी मेरी!",
    "सारे बीज मेरे!",
    "मेरे बीज गए!",
    "मेरी तरफ़ ख़ाली कर दी!",
    "गिनकर चाल चलो।",
    "मेरा स्टोर भर रहा है।"
  ],
  "nine-mens-morris": [
    "तीन की लाइन!",
    "तुम्हारी एक गोटी गई!",
    "मेरी लाइन तोड़ दी!",
    "बस तीन गोटी बचीं!",
    "खोलो और फिर बंद करो।",
    "चौराहों पर नज़र रखो।"
  ],
  "memory-match": [
    "मुझे पता था यहीं है!",
    "जोड़ी मिल गई!",
    "मैंने देखा था, सच में!",
    "फिर ग़लत टाइल!",
    "ध्यान से देख रहे हो?",
    "यहीं तो था…"
  ],
  "yacht": [
    "क्या पासा आया!",
    "फ़ुल हाउस!",
    "सब बेकार गया!",
    "ज़ीरो? सच में?",
    "एक बार और?",
    "रख लूँ या जोखिम लूँ?"
  ],
  "pig": [
    "बैंक कर लिया!",
    "बस पहुँच गया!",
    "एक आ गया! सब गया!",
    "रुक जाना चाहिए था!",
    "बस एक बार और…",
    "हिम्मत है?"
  ],
  "who-is-the-spy": [
    "जासूस पकड़ा गया!",
    "मुझे पता था तुम हो!",
    "मैंने कुछ नहीं किया!",
    "सब मुझे क्यों देख रहे हो?",
    "ये सुराग़ अजीब था…",
    "किसी का शब्द अलग है।"
  ],
  "truth-or-dare": [
    "क्या हिम्मत है!",
    "सबसे अच्छा जवाब!",
    "ये तो बड़ा शर्मनाक है!",
    "ये मैं छोड़ूँगा!",
    "सच या हिम्मत?",
    "ये तो देखना है!"
  ],
  "riddle-chits": [
    "ये मुझे आता था!",
    "बहुत आसान था!",
    "इतना सीधा था!",
    "हिंट ले लेता!",
    "सोचो, सोचो…",
    "ये मुश्किल है!"
  ],
  "majority-vote": [
    "मुझे सबका पता था!",
    "सब एक जैसा सोचते हैं!",
    "सिर्फ़ मैं? सच में?",
    "इस टेबल को समझ ही नहीं पाया!",
    "सब क्या चुनेंगे?",
    "सबकी तरह सोचो।"
  ],
  "consequences": [
    "कहानी मज़ेदार होगी!",
    "मेरी लाइन पढ़ना!",
    "ये क्या लिख दिया?!",
    "इसका कोई मतलब ही नहीं!",
    "झाँकना मत!",
    "खोलने का इंतज़ार है।"
  ],
  "color-clash": [
    "तेरे लिए प्लस फ़ोर!",
    "रेनबो आ गया!",
    "फिर से प्लस टू!",
    "कुछ मैच ही नहीं हो रहा!",
    "बस एक पत्ता बचा…",
    "कोई भी रंग चुनो।"
  ],
  "flying-chit": [
    "देखो कैसे उड़ रहा हूँ!",
    "निकल गया!",
    "ये पंखा कहाँ से आया!",
    "मेरे पंख!",
    "कितनी दूर जाओगे?",
    "नीचे मत देखना।"
  ],
  "turbo-tunnel": [
    "बाल-बाल बचा!",
    "नाइट्रो चालू!",
    "ये ट्रक कहाँ से आया!",
    "मेरी गाड़ी!",
    "और तेज़, और तेज़!",
    "हरे तीर देखो।"
  ],
  "tunnel-race": [
    "गैप से निकल गया!",
    "जेम मिल गया!",
    "दीवार अचानक आ गई!",
    "दीवार से रगड़ गया!",
    "और तेज़, और तेज़!",
    "बीच में रहो।"
  ],
  "ship-fight": [
    "सीधा निशाना!",
    "तुम्हारा जहाज़ डूब रहा है!",
    "मुझे लग गया!",
    "जहाज़ बचाओ!",
    "फ़ायर करो!",
    "चट्टानों से बचो।"
  ],
  "bull-fight": [
    "बाहर हो गया!",
    "पूरी टक्कर!",
    "उसने मार दिया!",
    "किनारे पे आ गया!",
    "सींग से सींग!",
    "बीच में रहो।"
  ],
  "road-dash": [
    "बहुत आसान!",
    "सिक्के मेरे!",
    "गाय यहाँ किसने खड़ी की?!",
    "ब्रेक! ब्रेक!",
    "और तेज़, और तेज़!",
    "गड्ढे से बचो।"
  ],
  "backyard-rally": [
    "तुम्हारे लिए तेज़ है!",
    "क्या शॉट है!",
    "मैं तैयार नहीं था!",
    "धूप आँख में थी!",
    "एक रैली और।",
    "चलने दो!"
  ],
  "hungry-snake": [
    "वाह, स्नैक!",
    "कितना लंबा हो गया!",
    "ख़ुद को काट लिया!",
    "ये दीवार किसने रखी?",
    "बहुत भूख लगी है…",
    "अपनी पूँछ देखो।"
  ],
  "hoop-flick": ["स्विश!", "सीधा जाल में!", "रिम से टकरा गया!", "बहुत ज़ोर से!", "आराम से आर्क बनाओ…", "ये हूप तो हिल रहा है!"],
  "ghost-hostel": ["मेरा दरवाज़ा मज़बूत है!", "पंखे फ़ुल स्पीड पे!", "भूत मेरे दरवाज़े पे है!", "दरवाज़ा टूट रहा है!", "सो जाओ और कमाओ…", "सुबह तक बचना है!"],
  "werewolf": ["मुझे पता था तू भेड़िया है!", "गाँव अभी सुरक्षित है… अभी के लिए।", "मैं नहीं हूँ, क़सम से!", "मुझे वोट क्यों?", "कल रात कौन चुप था?", "किसी पे भरोसा मत करो।"],
  "lapa-chupi": ["धप्पा! मिल गया!", "यहाँ कोई नहीं ढूँढ पाएगा!", "अरे, दिख गया!", "कौन हँसा?!", "आ रहा हूँ, छुप जाओ!", "श्श… हँसना मत!"],
  "baraf-pani": ["बर्फ़! पकड़ा गया!", "पानी! मैं आज़ाद!", "जम गया यार!", "कोई मुझे पानी करो!", "जल्दी आओ, बचाओ!", "पकड़ के दिखाओ!"],
  "pakda-padi": ["पकड़ा! अब तेरी बारी!", "इतना धीरे?", "अरे, अब मैं पकड़ूँगा!", "साँस फूल गई…", "वापस नहीं पकड़ सकते!", "पकड़ के दिखाओ!"],
  "pin-spin": [
    "एकदम गैप में!",
    "स्टार मिल गया!",
    "बस ज़रा सा!",
    "पिन टकरा गया!",
    "गैप का इंतज़ार करो…",
    "बड़ा बोर्ड!"
  ]
};
Object.entries(HINDI).forEach(([slug, lines]) => { if (GAME[slug]) GAME[slug].hindi = lines; });
const n = (list, lang) => list[lang] || list.en;
/** All the lines of this game, in this language. */
export const linesFor = (slug, lang) => [...n(COMMON, lang), ...(GAME[slug] ? n(GAME[slug], lang) : [])];
export const lineCount = (slug) => COMMON.en.length + (GAME[slug]?.en.length || 0);
const G0 = COMMON.en.length;
/** Which lines suit a moment, for the computer players. */
export const MOMENT = { start: [0], good: [G0, G0 + 1, 6], bad: [G0 + 2, G0 + 3, 3, 4], chat: [G0 + 4, G0 + 5], end: [2, 7], reply: [1, 2, 6, G0 + 4, G0 + 5] };
