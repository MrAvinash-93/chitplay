/**
 * The cheat scenes. Each one is a small conversation that makes sense as a whole:
 *   caught:    [the opponent accuses, the cheater replies, someone else teases]
 *   closeCall: [the opponent asks, the cheater denies, the opponent apologises]
 *
 * Lines are dealt from a shuffled deck kept on this device, so a scene can't come
 * back until every other one has been played: 24 catches, 24 different scenes.
 * {name} is the cheater, {other} the opponent.
 */
const CAUGHT = {
  english: [
    ['{name}, your eyes are on my chit! 😠', 'What? I was only looking at the fan!', 'The fan is on the ceiling, genius 😂'],
    ['Caught you! Eyes off my paper!', 'I was checking if your chit was folded properly', 'So helpful! Minus 100 for that kindness'],
    ['Why is your neck suddenly so long, {name}?', 'I was just stretching, my back hurts!', 'That is the most suspicious stretch ever 🦒'],
    ['I saw that! You leaned right over!', 'I dropped my pencil, that’s all', 'What pencil? You are holding nothing 😂'],
    ['Cheater! You tried to read my chit!', 'I can’t even read that handwriting!', 'So you did try to read it! 🤣'],
    ['Oh, so that’s how you play, {name}?', 'Play? I don’t know what you mean 😇', 'That innocent face won’t save you'],
    ['Hands where I can see them, {name}!', 'There was a mosquito on your hand!', 'A very convenient mosquito 🦟'],
    ['{name} is peeking, everybody look!', 'Lies! I have never peeked in my life', 'You peeked last round too, I saw 👀'],
    ['Take your eyes back, they’re on my chit!', 'My eyes wander on their own, I swear', 'Then tie them up! 😂'],
    ['Do you need my glasses to see it better?', 'No thanks, I saw noth— I mean, I saw nothing!', 'That was almost a confession! 🤭'],
    ['Stop right there, {name}! I felt you looking!', 'You felt it? Are you a magician?', 'Magician or not, you’re still caught'],
    ['Nice try, {name}. Next time be quieter!', 'I wasn’t trying anything, I was yawning', 'A yawn with both eyes wide open? 😆'],
    ['Whose chit is that you’re staring at?', 'I thought it was mine, they all look the same!', 'Yours is in your hand 🤦'],
    ['{name}, this is not an exam, stop copying!', 'Old habit from school, sorry!', 'Some things never change 📚'],
    ['Oho! Detective work with the eyes, is it?', 'It’s called being observant', 'It’s called cheating, my friend'],
    ['I’m telling everyone, {name} was peeking!', 'Who will believe you?', 'I believe them. I saw it too 😏'],
    ['Why did you turn so quickly just now?', 'A cramp! It was a sudden cramp!', 'Cramps never last this long 😂'],
    ['Look at my face, not my fingers, {name}!', 'Your fingers looked so interesting today', 'Hahaha, what an excuse!'],
    ['You think I can’t see you sneaking a look?', 'I was admiring the room, nice curtains', 'You’ve seen those curtains a thousand times 😂'],
    ['Red-handed! Sit straight, {name}!', 'I am sitting straight, the floor is crooked', 'The floor is crooked now! 🤣'],
    ['That’s it, no more looking at anybody’s chit!', 'Fine, but I saw nothing anyway', 'And you’ve lost points for nothing!'],
    ['Trying to steal a look, {name}? Shame!', 'I’m not ashamed, I’m just unlucky 😅', 'Honest at last! 🏆'],
    ['My chit isn’t a newspaper, stop reading it!', 'Any good news in there though?', 'The news is: you lost 100 points 📰'],
    ['What was that? You almost fell on my lap!', 'I lost my balance, very slippery mat', 'Slippery mat, slippery player 😏'],
    ['Eyes on the game, {name}, not on my hands!', 'Your hands ARE the game right now', 'That’s a confession, write it down ✍️'],
    ['Caught again? You’re not even good at this!', 'Practice makes perfect, give me time', 'Practise after you pay the 100 😂'],
  ],
  hinglish: [
    ['{name}, teri nazar meri chit pe hai! 😠', 'Kya? Main to bas pankha dekh raha tha!', 'Pankha upar hai, chit neeche hai 😂'],
    ['Pakad liya! Nazar hata meri parchi se!', 'Main dekh raha tha ki chit theek se mudi hai ya nahi', 'Wah kya seva hai! Le minus 100'],
    ['Teri gardan achanak itni lambi kaise ho gayi, {name}?', 'Bas stretching kar raha tha, kamar dukh rahi hai!', 'Aisi stretching maine kabhi nahi dekhi 🦒'],
    ['Maine dekha! Tu poora jhuk gaya tha!', 'Meri pencil gir gayi thi, bas', 'Kaunsi pencil? Haath to khaali hai 😂'],
    ['Cheater! Meri chit padhne ki koshish kar raha tha!', 'Teri handwriting to main padh hi nahi sakta!', 'Matlab padhne ki koshish ki thi! 🤣'],
    ['Accha, to aise khelte ho aap, {name}?', 'Khelna? Kya bol rahe ho, mujhe kuch nahi pata 😇', 'Ye bhola chehra nahi bachayega'],
    ['Haath dikhao apne, {name}!', 'Tere haath pe machhar baitha tha!', 'Bada samajhdar machhar hai 🦟'],
    ['{name} chupke se dekh raha hai, sab dekho!', 'Jhooth! Maine zindagi me kabhi nahi dekha', 'Pichhle round bhi dekha tha, mujhe pata hai 👀'],
    ['Apni aankhen wapas le, meri chit pe hain!', 'Aankhen apne aap ghoom jaati hain, kasam se', 'To unhe baandh ke rakh! 😂'],
    ['Mera chashma de doon, aur achhe se dikhega?', 'Nahi nahi, maine kuch dekh— matlab kuch nahi dekha!', 'Abhi sab bol deta! 🤭'],
    ['Ruk ja {name}! Mujhe pata chal gaya tu dekh raha hai!', 'Pata chal gaya? Jaadugar hai kya tu?', 'Jaadugar ho ya na ho, tu pakda gaya'],
    ['Achhi koshish thi {name}, agli baar dhyan se!', 'Koshish kaisi? Main to ubaasi le raha tha', 'Khuli aankhon se ubaasi? 😆'],
    ['Kiski chit ko itna ghoor raha hai?', 'Mujhe laga meri hai, sab ek jaisi dikhti hain!', 'Teri to tere haath me hai 🤦'],
    ['{name}, ye exam nahi hai, copy mat kar!', 'School ki purani aadat hai, sorry!', 'Aadat nahi gayi abhi tak 📚'],
    ['Oho! Aankhon se jasoosi chal rahi hai?', 'Ise dhyan dena kehte hain', 'Ise cheating kehte hain mere dost'],
    ['Sabko bataunga, {name} chupke se dekh raha tha!', 'Tera yakeen kaun karega?', 'Main karunga, maine bhi dekha 😏'],
    ['Abhi itni tezi se kyun ghooma?', 'Nas chadh gayi! Achanak nas chadh gayi!', 'Itni der tak nas nahi chadhti 😂'],
    ['Mere chehre ko dekh, ungliyon ko nahi, {name}!', 'Aaj teri ungliyan bahut sundar lag rahi hain', 'Hahaha kya bahana hai!'],
    ['Tujhe lagta hai mujhe dikhta nahi?', 'Main to kamra dekh raha tha, parde achhe hain', 'Ye parde hazaar baar dekh chuka hai 😂'],
    ['Range haath pakda gaya! Seedha baith {name}!', 'Main seedha hi hoon, farsh tedha hai', 'Ab farsh tedha ho gaya! 🤣'],
    ['Bas! Ab kisi ki chit nahi dekhni!', 'Theek hai, waise bhi kuch dikha nahi', 'Aur points bhi gaye faltu me!'],
    ['Chori se dekhna, {name}? Sharam karo!', 'Sharam nahi, kismet kharab hai bas 😅', 'Chalo sach to bola! 🏆'],
    ['Meri chit akhbaar nahi hai, mat padh!', 'Koi achhi khabar hai usme?', 'Khabar ye hai: tere 100 point gaye 📰'],
    ['Ye kya tha? Meri god me hi gir jaata!', 'Balance bigad gaya, chatai bahut chikni hai', 'Chatai chikni, khiladi usse zyada 😏'],
    ['Game pe dhyan de {name}, mere haathon pe nahi!', 'Abhi tere haath hi game hain', 'Ye to sach bol diya, likh lo ✍️'],
    ['Phir pakda gaya? Tujhse cheating bhi nahi hoti!', 'Practice se aayegi, thoda time de', 'Pehle 100 point to de 😂'],
  ],
};

const CLOSE_CALL = {
  english: [
    ['{name}, are you looking at my chit?', 'No! Why would I?', 'Oh, sorry. I thought you were looking 😅'],
    ['Hey, were you trying to see that?', 'Me? I’m just sitting here', 'Sorry, my mistake'],
    ['Why are you looking this way, {name}?', 'I was looking at the clock behind you', 'Oh right, sorry!'],
    ['You’re not peeking, are you?', 'Never. I play fair', 'Sorry, I’m just nervous today'],
    ['{name}, did you see my chit just now?', 'Not at all, I swear', 'Okay okay, sorry for doubting you'],
    ['I feel like someone’s watching my hands…', 'Don’t look at me, I’m thinking', 'Yeah, sorry. It must be nothing'],
    ['Wait, were your eyes on my paper?', 'No, on the wall behind it', 'Ah, sorry, my bad 🙏'],
    ['You moved closer, {name}. Why?', 'My leg went numb, that’s all', 'Oh sorry, go ahead and stretch'],
    ['Is something interesting over here?', 'Only your nervous face 😄', 'Haha, sorry, I thought you were peeking'],
    ['No peeking, right, {name}?', 'Of course not!', 'Sorry, I trust you'],
    ['Did you just glance at my hand?', 'I glanced at your watch', 'I’m not wearing a… never mind, sorry'],
    ['Why so quiet? You’re not spying, are you?', 'I’m only concentrating', 'True, sorry, carry on'],
    ['Hmm, I thought I saw you lean in', 'I was fixing my sitting position', 'Sorry, I’m imagining things'],
    ['{name}, keep your eyes to yourself, okay?', 'They’re right here, look', 'Fine, fine, sorry'],
    ['Were you reading something just now?', 'Reading what? I left my glasses at home', 'Oh, sorry about that'],
    ['Be honest, did you see anything?', 'Nothing at all', 'Alright, I believe you. Sorry!'],
    ['Something feels fishy, {name}…', 'Nothing’s fishy, relax', 'You’re right, sorry, I’m tense'],
    ['Are you trying to look over here?', 'I was just scratching my neck', 'Oh! Sorry, I thought you were looking'],
    ['Your eyes keep coming this way', 'That’s because you’re sitting there', 'Fair point, sorry 😅'],
    ['Hey! …Oh, were you looking at me?', 'Only at the fan above you', 'Sorry, sorry, false alarm'],
    ['Did you see what I’m holding?', 'How could I? You’re hiding it so well', 'Ha, true. Sorry!'],
    ['You wouldn’t cheat on me, would you, {name}?', 'Me? Never in my life', 'Sorry, I shouldn’t have asked'],
  ],
  hinglish: [
    ['{name}, tu meri chit dekh raha hai kya?', 'Nahi to! Main kyun dekhunga?', 'Are sorry, mujhe laga tu dekh raha hai 😅'],
    ['Oye, tu ye dekhne ki koshish kar raha tha?', 'Main? Main to bas baitha hoon', 'Sorry yaar, galti ho gayi'],
    ['Idhar kya dekh raha hai, {name}?', 'Tere peeche ghadi dekh raha tha', 'Accha, sorry!'],
    ['Tu chupke se dekh to nahi raha na?', 'Bilkul nahi, main imaandaar hoon', 'Sorry, aaj thoda nervous hoon'],
    ['{name}, abhi meri chit dekhi tune?', 'Bilkul nahi, kasam se', 'Theek hai, sorry shak kiya'],
    ['Lag raha hai koi mere haath dekh raha hai…', 'Mujhe mat dekh, main soch raha hoon', 'Haan sorry, kuch nahi hoga'],
    ['Ruk, teri nazar meri parchi pe thi kya?', 'Nahi, uske peeche deewar pe thi', 'Accha sorry, meri galti 🙏'],
    ['Paas kyun khisak raha hai, {name}?', 'Pair so gaya tha, bas', 'Are sorry, aaram se baith'],
    ['Idhar kuch khaas hai kya?', 'Bas tera ghabraya hua chehra 😄', 'Haha sorry, mujhe laga tu dekh raha hai'],
    ['Chupke se dekhna mana hai, theek hai {name}?', 'Haan haan, pata hai!', 'Sorry, mujhe tujhpe bharosa hai'],
    ['Abhi mere haath ko dekha tune?', 'Teri ghadi dekh raha tha', 'Maine to ghadi pehni hi… chhod, sorry'],
    ['Itna chup kyun hai? Jasoosi to nahi kar raha?', 'Dhyan laga raha hoon bas', 'Sahi hai, sorry, chal khel'],
    ['Mujhe laga tu aage jhuka tha', 'Baithne ka tarika theek kar raha tha', 'Sorry, mere dimaag ka vehem hai'],
    ['{name}, apni nazar apne paas rakh, theek?', 'Yahin to hai, dekh le', 'Accha accha, sorry'],
    ['Abhi kuch padh raha tha kya?', 'Kya padhunga? Chashma ghar pe hai', 'Oh, sorry yaar'],
    ['Sach bata, kuch dekha kya?', 'Kuch bhi nahi', 'Chal maan liya, sorry!'],
    ['Kuch gadbad lag rahi hai, {name}…', 'Kuch gadbad nahi, aaram se', 'Tu sahi hai, sorry, tension me hoon'],
    ['Tu idhar dekhne ki koshish kar raha hai kya?', 'Gardan khuja raha tha bas', 'Are sorry, mujhe laga tu dekh raha hai'],
    ['Teri nazar baar baar idhar aa rahi hai', 'Kyunki tu wahi baitha hai', 'Baat to sahi hai, sorry 😅'],
    ['Oye! …Tu mujhe dekh raha tha kya?', 'Nahi, tere upar pankha dekh raha tha', 'Sorry sorry, kuch nahi'],
    ['Dekha mere haath me kya hai?', 'Kaise dekhunga? Itna chhupa ke rakha hai', 'Haha sahi hai. Sorry!'],
    ['Tu mere saath cheating nahi karega na, {name}?', 'Main? Kabhi nahi', 'Sorry, poochna nahi chahiye tha'],
  ],
};

const DECK_KEY = 'chitplay.cheatDeck.v1';
const readDecks = () => { try { return JSON.parse(localStorage.getItem(DECK_KEY)) || {}; } catch { return {}; } };
const saveDecks = (d) => { try { localStorage.setItem(DECK_KEY, JSON.stringify(d)); } catch { /* storage blocked: the deck lasts this visit */ } };
let memory = null;

function shuffledIndexes(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(table, kind, lang, vars) {
  const set = table[lang] ? lang : 'english';
  const lines = table[set];
  const decks = memory || (memory = readDecks());
  const key = `${kind}.${set}`;
  if (!Array.isArray(decks[key]) || !decks[key].length || decks[key].some(i => !lines[i])) {
    // a new deck: the scenes seen most recently go to the back, so none repeats right after the reshuffle
    const recent = (Array.isArray(decks[`${key}.recent`]) ? decks[`${key}.recent`] : []).filter(i => lines[i]).slice(-Math.floor(lines.length / 2));
    const fresh = shuffledIndexes(lines.length).filter(i => !recent.includes(i));
    decks[key] = fresh.concat(recent);   // oldest first, the very last one at the very end
  }
  const index = decks[key].shift();
  decks[`${key}.recent`] = (decks[`${key}.recent`] || []).filter(i => i !== index).concat(index).slice(-lines.length);
  const scene = lines[index];
  saveDecks(decks);
  return scene.map(t => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ''));
}

/** [accuse, reply, tease] for this language pack (English when it has none of its own). */
export const nextCaughtScene = (lang, vars = {}) => deal(CAUGHT, 'caught', lang, vars);
/** [ask, deny, apologise] */
export const nextCloseCall = (lang, vars = {}) => deal(CLOSE_CALL, 'close', lang, vars);
/** Start both decks over, as on a first visit (used by the tests). */
export function resetSceneDecks() { memory = {}; saveDecks(memory); }
export const SCENE_COUNTS ={ caught: CAUGHT.english.length, closeCall: CLOSE_CALL.english.length };
