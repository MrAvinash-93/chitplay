/** How to play every game, in Hinglish. Same steps, in the same order, as the English in rules.js. */
export default {
  'flying-chit': {
    steps: ['Stick ko drag karo, ya arrow keys, W A S D ya gamepad se chit ko upar, neeche, left aur right ghumao.', 'Ek ring dikhata hai ki chit agli chudi ko kahan se paar karegi: sahi nishane pe ho to woh hari ho jaati hai. Chudi ke paas chit apne aap uske beech ki taraf khinchti hai.', 'Sunehri chudi se nikal ke thodi udaan wapas pao. Score ke neeche wali bar batati hai kitni bachi hai.', 'Ek ke baad ek chudiyan combo banati hain: ×2, ×3, ×5 tak points har ek.', 'Chudi chhooti to combo khatam. Pankha ya kitabon ka dher lagne se bahut udaan kam hoti hai.', 'Udaan khatam hui to chit fisal ke zameen pe aa jaati hai aur tumhari flight khatam.', 'Har naya level ek badi sunehri chudi se shuru hota hai: 10 points aur poori udaan.'],
    win: 'Akele ho to apna best score todo. Doosron ke saath sab ek saath udte hain aur sabse zyada score jeetta hai.',
    scoring: 'Har chudi apna combo deti hai: 1, phir 2, 3, 4 aur 5 points jab tak chain chale. Medal 50, 200, 500 aur 1000 points pe.',
  },
  'tunnel-race': {
    steps: ['Stick ko left ya right drag karo, ya A aur D, arrow keys ya gamepad se tunnel ke andar gol ghoomo.', 'Laal deewar tunnel ka hissa rokti hai: uske bagal se jao. Narangi deewar sab bhar deti hai bas ek gap chhod ke: gap se niklo.', 'Chamakte gems uthao, har ek ke 10 points.', 'Deewar chhooi to run khatam. Jitna aage jaoge tunnel utni tez hoti jaati hai, aur har naye level mein nayi tarah ki deewar aati hai.'],
    win: 'Akele ho to apna best score todo. Doosron ke saath sab ek saath race karte hain aur sabse zyada score jeetta hai.',
    scoring: 'Jitna udo utne points, aur har gem ke 10. Medal 50, 150, 300 aur 600 points pe.',
  },
  'turbo-tunnel': {
    steps: ['Stick ko left ya right drag karo, ya A aur D, arrow keys ya gamepad se gaadi ko tunnel ke andar gol ghumao.', 'Cone, barrier, gaadi, truck aur patthar chhoo liya to run khatam. Jis cheez se tumhari gaadi takraane wali hai, uske neeche laal roshni chamakti hai.', 'Tunnel ki har line mein hamesha ek saaf raasta hota hai jahan tum time pe pahunch sakte ho. Sadak pe halke hare teer use dikhate hain.', 'Coin ke 10 points. Neela nitro pad teen second tak distance ke points double karta hai. Hari shield ek takkar khud jhel leti hai.', 'Tel se run khatam nahi hota, par gaadi fisalti hai aur thodi der steering dheere maanti hai.', 'Kisi cheez ke bilkul paas se nikle to close call: 5 bonus points.'],
    win: 'Akele ho to apna best score todo. Doston ke saath sab ek hi tunnel mein race karte hain: jo gaadi aakhir tak chalti rahe woh jeetti hai, aur sab takra jaayein to sabse zyada score jeetta hai.',
    scoring: 'Jitna chalao utne points (nitro pe double), har coin ke 10 aur har close call ke 5. Medal 100, 300, 700 aur 1500 points pe.',
  },
  'reaction-time': {
    steps: ["Screen laal rahe tab tak ruko. Hari hote hi kahin bhi tap karo (ya Space, Enter ya gamepad button dabao), jitna jaldi ho sake.","Hare se pehle, ya round 3 aur 4 ke neele nakli signal pe tap karna galat shuruaat hai aur us round mein kuch nahi milta.","Tumhara time tumhare apne phone pe naapa jaata hai, screen pe hara dikhne se tap tak, isliye slow internet tumhe slow nahi banata. 100 ms se kam ka time andaaza maana jaata hai.","Paanch round hote hain. Har round ke baad sabka time dikhta hai, aur table pe sabse tez ko 50 bonus points milte hain."],
    win: "Paanch round ke baad sabse zyada points wala jeetta hai. Akele ho to apna best todo aur medal kamao.",
    scoring: "Har round mein 500 mein se tumhara time (milliseconds) ghatta hai: 250 ms pe 250 points. Galat shuruaat aur chhoote round ke 0. Medal 600, 900, 1100 aur 1300 points pe.",
  },
  'stroop-test': {
    steps: ["Card pe ek rang ka naam rangeen syahi mein likha aata hai. Syahi ke rang wala button dabao (ya us pe dikhi arrow key).","Card 6 se kuch card pe \"WORD chuno\" likha hota hai: tab jo shabd kehta hai wahi chuno.","Har card pe sirf tumhara pehla tap gina jaata hai, isliye pakka hoke dabao. Card 11 se 15 mein time kam milta hai.","Tumhara time tumhare apne phone pe card dikhne ke pal se naapa jaata hai, isliye door ke doston se online khelna bhi fair hai."],
    win: "Pandrah card ke baad sabse zyada points wala jeetta hai. Akele ho to apna best todo aur medal kamao.",
    scoring: "Sahi jawab jitna tez, utne zyada points: 2000 mein se tumhara time (milliseconds) ghata ke das se bhaag, kam se kam 10. Galat ya koi jawab nahi to 0. Doston ke saath har card pe sabse tez sahi jawab ko 20 aur. Medal 600, 1200, 1700 aur 2100 points pe.",
  },
  'number-memory': {
    steps: ["Ek number pal bhar ke liye dikhta hai. Uske neeche ki patti batati hai ki woh kitni der rahega.","Chhupte hi keypad (ya keyboard) pe number type karo aur ✓ dabao. Tumhare paas 15 second tak hain.","Sahi: agla number ek digit lamba. Galat: ek dil gaya. Teen dil gaye to tum bahar.","Har phone apni typing apne paas rakhta hai aur ✓ pe poora jawab bhejta hai; jawab dete waqt doston ke phone pe number nahi dikhta."],
    win: "Akele ho to jitna lamba number yaad rakh sako rakho. Doston ke saath sabse zyada points jeette hain; sab bahar hon ya aakhri bacha player pehle se aage ho to game khatam.",
    scoring: "Sahi jawab pe har digit ke das points: 7 digit ka number 70 ka. Medal 70, 150, 250 aur 400 points pe.",
  },
  'word-guess': {
    steps: ["Tumhe ek ishaara (jaise Fruit ya Sport) aur khaali tiles mein shabd dikhta hai, jismein ek akshar khula hota hai.","Har dedh second mein ek aur akshar khulta hai. Aakhri akshar kabhi nahi khulta, isliye andaaza lagana hi padta hai.","Letters waale keypad (ya keyboard) pe poora shabd type karo aur ✓ dabao. Har shabd pe ek hi koshish milti hai.","Har phone apne player ka time khud naapta hai, aur doston ke phone pe sirf khule hue akshar jaate hain, poora shabd kabhi nahi."],
    win: "Aath shabdon ke baad sabse zyada points waala jeetta hai.",
    scoring: "Sahi jawab pe 10 points, aur bhejte waqt jitne akshar chhupe the har ek ke 10 aur. Doston ke saath har shabd ka sabse tez sahi jawab 10 points zyada paata hai. Galat jawab pe us shabd ke koi points nahi. Medal 80, 160, 240 aur 320 points pe.",
  },
  'fast-typing': {
    steps: ["Ek second ke liye \"Get ready\" dikhta hai, phir shabd aata hai.","Letters waale keypad (ya keyboard) pe shabd type karo aur ✓ dabao. Har shabd pe ek hi koshish milti hai.","Shabd ke neeche ki patti bacha time dikhati hai: chaar second aur har akshar ka ek second.","Har phone apne player ka time usi pal se naapta hai jab shabd us pe dikha, isliye slow internet tumhari speed nahi ghatata."],
    win: "Das shabdon ke baad sabse zyada points waala jeetta hai.",
    scoring: "Sahi shabd pe har second mein type kiye har akshar ke das points: chhe akshar do second mein yaani 30. Har sahi shabd pe kam se kam 5, zyada se zyada 60. Ek bhi galat akshar to us shabd ke koi points nahi. Medal 120, 200, 280 aur 360 points pe.",
  },
  'bingo': {
    steps: ["Har player ko 1 se 25 tak alag order waala card milta hai. Tumhara card sirf tum dekh sakte ho.","Apni baari pe 1 se 25 ke beech aisa number type karo jo abhi tak na bola gaya ho, aur ✓ dabao. 15 second hain, warna tumhari jagah koi number bol diya jaata hai.","Bola gaya number sabke card pe kat jaata hai, tumhare aur doston ke bhi.","Har poori row, column ya tirchhi line ek line hai aur B-I-N-G-O ka agla akshar jalaati hai."],
    win: "Paanch lines pehle poori karne waala jeetta hai. Agar ek hi number se do card saath poore hon to zyada lines waala jeetta hai; phir bhi barabar ho to jisne number bola woh jeetta hai.",
    scoring: "Upar ki patti dikhati hai ki har player ke BINGO ke kitne akshar jale hain. Ek card pe baarah lines ban sakti hain: paanch rows, paanch columns aur do tirchhi.",
  },
  'unblock-puzzle': {
    steps: ["Har parking mein rickshaw (hara, peeli chhat), aas-paas ki gaadiyan aur uski line ke daayein taraf gate dikhta hai.","Kisi gaadi ko ungli ya mouse se kheench ke khisakao. Jitna kheencho utni jaati hai, raaste ki pehli rukawat tak.","Ya arrows se gaadi chuno, Hold dabao aur arrows se khisakao. Chhodne ke liye phir Hold dabao.","Jab rickshaw aur gate ke beech kuch na bache, use daayein khisakao aur woh bahar nikal jaata hai. Har parking ke liye do minute hain."],
    win: "Paanch parking ke baad sabse zyada points waala jeetta hai.",
    scoring: "Bahar nikalne pe 50 points, aur kam chaalon mein karne pe 50 tak aur: sabse kam chaalon se har ek zyada chaal pe 5 kam. Doston ke saath har parking se pehle nikalne waale ko 20 aur. Medal 200, 300, 400 aur 470 points pe.",
  },
  'hoop-flick': {
    steps: ['Stick ko gulel ki tarah peeche kheencho: ball ulti taraf udegi. Jitna kheencho, utna zor se.', 'Phenkne ke liye stick chhod do. Keys se: left aur right arrow se nishana ghumao, upar-neeche se zor, aur Space se phenko.', 'Ball ko agle hoop mein upar se girao.', 'Har hoop ke paas baarah second hain: laal bar batati hai ki time khatam ho raha hai.', 'Chooka to ball court se bahar: run khatam.', 'Har paanch basket pe naya level: hilte hoop, phir hawa, phir dono.'],
    win: 'Akele ho to apna best todo. Dost ke saath har koi court ke apne aadhe hisse mein khelta hai aur zyada score jeetta hai.',
    scoring: 'Rim chhoo ke gayi basket ka 1 point. Saaf swish ke 2, aur lagaataar swish pe zyada: har ek 5 tak. Medal 20, 50, 100 aur 200 points pe.',
  },
  'ghost-hostel': {
    steps: ['Tumhara bistar har second sikke kamata hai. Achha bistar zyada kamata hai.', 'Arrow ya pad se Bed, Door, Fan ya Fix chuno, aur Buy dabao.', 'Door: zyada taakat, aur nayi taakat tak theek ho jaata hai. Fix: darwaze ka kuch hissa theek karta hai, phir agle fix se pehle kuch second lagte hain.', 'Bhoot darwaze pe ho to pankhe use hawa maarte hain. Kaafi chot lagi to woh apne kone mein wapas tair jaata hai.', 'Bhoot har tees second mein taakatwar hota hai, aur aakhri chaalees second mein aur gussa. Darwaza toota to tum pakde gaye aur bahar.'],
    win: 'Subah tak jo apne kamre mein hai woh jeetta hai. Bhoot ko poora uda diya to raat jaldi khatam. Sab pakde gaye to bhoot jeet gaya.',
    scoring: 'Bistar ke kamaye saare sikke tumhare score mein, subah tak tikne ke 100 aur bhoot ko hamesha ke liye udaane ke 150 aur.',
  },
  'pin-spin': {
    steps: ['Screen tap karo, Pin button, Space ya Enter, ya gamepad button dabao: pin seedha upar board ke neeche ghus jaati hai.', 'Gap ka intezaar karo: tumhari pin pehle se lagi pin se takrai to run khatam.', 'Level poora karne ke liye screen ke neeche dikhi saari pins lagao.', 'Sunehra star sticker pin karo to 5 bonus points.', 'Har paanchva level bada board hai: woh speed aur disha badalta hai.', 'Har level ki time limit hai (neeche patli bar): time khatam hone se pehle saari pins lagao.'],
    win: 'Akele ho to apna best todo. Doosron ke saath sab apne apne board pe ek saath pin lagate hain aur sabse zyada score jeetta hai.',
    scoring: 'Har lagi pin ka 1, har star ka 5, aur level poora karne pe level number ka double. Medal 25, 60, 120 aur 250 points pe.',
  },
  'bull-fight': {
    steps: ['Stick drag karo, ya W A S D, arrow keys ya gamepad se apna bail chalao.', 'Charge dabao aage daudne ke liye. Doosra bail lagbhag saamne ho to charge seedha uski taraf jaata hai. Phir bar pe CHARGE READY aane ka intezaar karo.', 'Har bail ke neeche ring aur teer batate hain ki kiska hai aur kis taraf dekh raha hai. Kinare pe khur ret pakad lete hain, isliye dhakka lage tabhi bahar jaoge; paas ho to kinara laal chamakta hai aur EDGE! dikhta hai.', 'Charge karta bail doosre se takraye to use uda deta hai aur thodi der chakkar aate hain.', 'Jo safed line ke bahar dhakela gaya woh round haara. Thodi der baad ring chhoti hone lagti hai.'],
    win: 'Jo pehle teen round jeete, match uska.',
    scoring: 'Doosre bail ko bahar dhakelo, round jeeto.',
  },
  'spin-duel': {
    steps: ['Teen second ke andar rival ki taraf tezi se swipe karo. Launch button bhi hai agar swipe mushkil ho.', 'Lamba aur tez swipe lattu ko zyada taakat deta hai. Har round mein ek hi launch.', 'Timer ke baad lattu apne aap ghoomte aur takraate hain. Apna lattu arena mein aur ghoomta hua rakho.', 'Jiska lattu aakhir tak ghoome, round uska. Dono saath ruke to round barabar.', 'Jo pehle teen round jeete, match uska. Dono ne teen round chhoote to match barabar.'],
    win: 'Bot ke saath akele, ek screen pe, paas mein ya online khelo. Khel ke sikke kamao aur unse lattu aur arena ke style kholo.',
    scoring: 'Doosre lattu ko bahar maaro ya usse zyada der ghoomo, round tumhara. Match teen round jeetne tak.',
  },
  'pen-fight': {
    steps: ['Teen second ke andar rival ki taraf swipe karo. Flick button bhi hai agar swipe mushkil ho.', 'Tez swipe pen ko zor se bhejta hai; disha tum chuno.', 'Pen apne aap fisalte aur takraate hain. Jo pen kinare se gira ya takkar se palat gaya, woh round haara.', 'Dono pen desk pe rahe to jiski jagah behtar, woh jeeta; bahut kareeb ho to barabar.', 'Jo pehle teen round jeete, match uska. Teen round dono chooke to barabar.'],
    win: 'Bot ke saath akele, dost ke saath ek screen pe, paas mein ya online khelo. Kamaaye sikkon se pen aur desk ke look kholo; style sirf dikhaawe ke liye hain.',
    scoring: 'Rival ka pen desk se girao, zor ki takkar se palto ya usse zyada tik ke round jeeto. Match teen round jeetne tak.',
  },
  'lapa-chupi': {
    steps: ['Har match mein alag player dhoondhne wala banta hai. Woh deewar ke paas aankhein band karke rukta hai aur baaki sabko chhupne ke liye paanch second milte hain.', 'Joystick ya arrow keys se 3D maidan mein ghoomo. Sprint dabake tez bhaago, par second bhar mein saans phool jaati hai.', 'Jhaadi, bench ya kisi cheez ke paas ruk ke hilna band karo, tab chhupoge. Hilna, ya dhoondhne wale ko paas aane dena, tumhe pakdwa dega.', 'Sabko dhoondh liya to dhoondhne wala jeeta. Time khatam hone tak jo chhupe rahe, woh saath mein jeete.', 'Online room mein chhupe players ki jagah doosron se chhupaayi jaati hai.'],
    win: 'Computer players, ek screen pe dost, paas mein ya online khelo. Khaali seat bot bharte hain.',
    scoring: 'Dhoondhne wale ko har mile hider ka ek point, aur sabko dhoondhe to jeet. Time khatam hone tak chhupe hiders saath jeette hain aur kitne bhi finds se zyada score paate hain.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani teen ya chaar log khelte hain: ek IT aur baaki bhaagne wale. Khaali jagah computer bharta hai, aur IT har match badalta hai.', 'IT maidan ke beech teen tak ginta hai aur baaki bhaagte hain. Phir pakdam-pakdai shuru.', 'Joystick ya arrow keys se chalo. Sprint se thodi der tez bhaago; second bhar mein saans phool jaati hai aur thoda chalna padta hai.', 'IT ne chhua to woh jam gaya (baraf!). Azaad dost ne jame hue ko chhua to woh phir azaad (pani!).', 'Sab ek saath jam gaye to IT jeeta. Time khatam hone tak ek bhi azaad raha to bhaagne wale jeete.'],
    win: 'Computer runners ke saath akele, ek screen pe dost, paas mein ya online khelo. Khaali seat bot bharte hain.',
    scoring: 'Team ki tarah jeeta jaata hai: IT sabko jamaa ke, bhaagne wale ek ko bhi time tak azaad rakh ke. Jeetne walon ko 1 point.',
  },
  'pakda-padi': {
    steps: ['Joystick ya arrow keys se maidan mein ghoomo. Sprint se thodi der tez bhaago; second bhar mein saans phool jaati hai aur thoda chalna padta hai.', 'IT wala teen tak ginta hai, phir sabko pakadta hai. Paas jaake chhoo lo to baari aage.', 'Chhua gaya to palat ke kisi aur ko pakdo. Wapas nahi: do second tak jisne abhi chhua, use nahi chhoo sakte.', 'Time khatam hone pe jo sabse kam der IT raha, woh jeeta. Barabari bhi ho sakti hai.'],
    win: 'Computer players, ek screen pe dost, paas mein ya online khelo. Khaali seat bot bharte hain.',
    scoring: 'Jo sabse kam der IT raha woh jeeta. Kitni baar chhua, scoreboard pe ginta hai.',
  },
  'ship-fight': {
    steps: ['Apna jahaz samandar ke apne aadhe hisse mein kahin bhi le jao. Uski top har second khud doosre jahaz pe fire karti hai.', 'Har jahaz paanch goliyan jhel sakta hai. Chattanein goliyan rokti hain, unke peeche chhupo.', 'Beech mein dibbe aate hain: dil jahaz theek karta hai, aur top wala dibba paanch triple shot deta hai.', 'Round bahut lamba chala to toofan jahazon ko ghisne lagta hai, pehle us jahaz ko jiski health kam hai.'],
    win: 'Jo pehle teen round jeete, match uska.',
    scoring: 'Doosra jahaz duba do, round tumhara.',
  },
  'road-dash': {
    steps: ['Left ya right dabao (stick drag karo, A aur D, ya arrow keys) lane badalne ke liye.', 'Gaayon, gaddhon, buson aur doosre rickshaw se bacho.', 'Extra points ke liye sikke uthao.', 'Jitni der tiko sadak utni tez, aur lagbhag har 100 points pe naya level naye traffic ke saath. Ek takkar aur run khatam.'],
    win: 'Akele ho to apna best score todo. Doosron ke saath sabse zyada score jeetta hai.',
    scoring: 'Jitna chalo utne points, aur har sikke ke 5.',
  },
  'backyard-rally': {
    steps: ['Apna bat upar-neeche karo.', 'Ball wapas maaro. Har shot use thoda tez karta hai.', 'Bat ka kinara ball ko zyada tirchha bhejta hai.', 'Ball tumhare bat se nikal gayi to doosre ka point.'],
    win: 'Jo pehle saat points banaye, woh jeeta.',
    scoring: 'Har baar ball doosre player se nikle to ek point.',
  },
  'hungry-snake': {
    steps: ['Apne saanp ko upar, neeche, left ya right mod do. Woh kabhi rukta nahi.', 'Snack khao, point pao aur lambe ho jao.', 'Deewar, khud se ya doosre saanp se takraye to game khatam.', 'Doosron ke saath jo saanp aakhir tak chale use 3 bonus points.'],
    win: 'Akele ho to apna best todo. Doosron ke saath sabse zyada score jeetta hai.',
    scoring: 'Har snack ka ek point, aur aakhir tak bache rehne ke 3.',
  },
  ludo: {
    house: [["Blockade", "Ek rang ki do gotiyan track ke ek khaane pe blockade banati hain. Koi aur use paar nahi kar sakta, uspe utar nahi sakta, aur woh gotiyan kat nahi sakti."], ["Pehle kaato phir ghar", "Goti apni home line mein tabhi mud sakti hai jab uske player ne kam se kam ek rival goti kaati ho. Tab tak woh board ka ek aur chakkar lagaati hai."], ["Quick start", "Har player ki ek goti pehle se start khaane pe hoti hai, taaki game turant chal pade."], ["Places ke liye khelo", "Teen ya chaar players mein game winner pe nahi rukta: baaki doosre aur teesre number ke liye khelte hain, aur aakhir mein poora order dikhta hai."]],
    steps: ['Apni baari pe Roll dabao. Goti ghar se bahar nikaalne ke liye chhakka chahiye.', 'Chamakti goti ya uska button dabao, jitna dice aaya utna aage chalegi. Ek hi goti chal sakti ho tab bhi use tum khud dabaoge; koi goti na chal sake to baari khatam.', 'Rival ki goti pe utro, woh wapas ghar. Start aur star wale khaane safe hain: wahan koi nahi kat sakta.', 'Board ka chakkar laga ke goti apni home line mein mudti hai. Ghar pahunchne ke liye exact number chahiye.', 'Chhakka, goti kaatna aur goti ghar pahunchana, har ek pe ek aur chance. Lagaatar teen chhakke aaye to baari gayi.'],
    win: 'Normal mode: jo pehle chaaron gotiyan ghar le aaye woh jeeta. Score mode: 15 round ke baad, ya jab koi chaaron gotiyan ghar le aaye, sabse zyada points wala jeeta.',
    scoring: 'Khelne se pehle mode chuno. Normal mode mein points nahi: result mein dikhta hai kisne kitni gotiyan ghar pahunchaayi. Score mode mein har khaana 1, goti kaatna 20, goti ghar 30, aur sabse pehle chaaron khatam karne ka bonus 50.',
  },
  carrom: {
    steps: ['Seat 1 safed gotiyan khelta hai aur seat 2 kaali. Har rang ki nau, aur beech mein laal rani.', 'Striker slider se striker ko baseline pe rakho, Aim se disha aur Power se zor chuno, phir shot maaro.', 'Apni goti pocket mein daali to phir se shot. Nahi daali to baari aage.', 'Rani ko cover karna zaroori hai. Rani daalne ke baad usi shot ya agle shot mein apni ek goti daalo, warna rani beech mein wapas.', 'Striker pocket mein gaya to foul: tumhari daali hui ek goti beech mein wapas aur baari khatam.', 'Kisi ki aakhri goti tabhi andar reh sakti hai jab rani ja chuki ho.'],
    win: 'Jo pehle apni saari gotiyan daale, rani cover karke, woh jeeta. 80 shot ho gaye to jiski kam gotiyan bachi woh jeeta.',
    scoring: 'Jeetne wale ko doosre ki board pe bachi har goti ka 1 point, aur rani ke 3.',
  },
  chess: {
    steps: ['Safed pehle chalta hai, phir baari baari. Mohra dabao, phir nishaan wala khaana.', 'Haathi seedhi line mein chalta hai, oont tirchha, wazir dono, ghoda dhaai ghar (L shape) koodta hai aur raja ek khaana.', 'Pyada ek khaana aage chalta hai, pehli chaal mein do bhi, aur tirchha ek khaana aage maarta hai. Aakhri line pe pahunch ke wazir, haathi, oont ya ghoda ban jaata hai.', 'Castling: raja aur haathi na chale hon, beech ke khaane khaali hon aur raja check se na guzre, to raja haathi ki taraf do khaane chalta hai aur haathi uske upar se kood jaata hai.', 'En passant: tumhare pyade ke bagal se rival ka pyada do khaane chale, to agli hi chaal mein use aise maar sakte ho jaise woh ek khaana chala ho.', 'Raja pe hamla ho to woh check (shah) mein hai. Apni chaal mein check se nikalna zaroori hai.'],
    win: 'Checkmate (shah-maat) jeetta hai: raja check mein aur bachne ka koi raasta nahi. Draw hota hai stalemate pe (koi chaal nahi, check bhi nahi), wahi position teen baar, pachaas chaal bina kaate ya pyada chalaaye, ya mohre itne kam ki maat ho hi na sake.',
    scoring: 'Game jeet ya draw pe khatam. Result mein jeetne wale ko 1.',
  },
  'snakes-and-ladders': {
    house: [["6 se shuru", "Goti board ke bahar rukti hai jab tak uska player 6 na laaye. 6 use khaana 1 pe rakhta hai, aur woh player phir dice phenkta hai."], ["Bounce back", "100 se aage jaane wala dice wapas uchhalta hai: 97 se 5 aaye to 100 tak jaake do khaane peeche 98 pe. Jahan utre wahan saanp-seedhi lagti hai."], ["Teen chhakke", "Lagaatar teen chhakke goti ko us jagah wapas bhejte hain jahan woh baari ki shuruaat mein thi, aur baari aage."]],
    steps: ['Sab board ke bahar, khaana 1 se pehle shuru karte hain. Baari baari dice phenko.', 'Jitna dice aaya utna aage chalo, board pe number ke hisaab se upar.', 'Seedhi ke neeche utre to upar chadh jao. Saanp ke munh pe utre to uski poonch tak neeche.', 'Chhakka aaye to ek aur chance.', 'Khaana 100 pe exact number chahiye. Dice zyada aaya to goti wahin rukti hai.'],
    win: 'Jo pehle theek 100 pe pahunche, woh jeeta.',
    scoring: 'Khel ke dauraan points nahi. Result mein dikhta hai kaun kahan tak pahuncha.',
  },
  'color-clash': {
    house: [["Stacking", "+2 laga? Uspe apna +2 ya Rainbow +4 chalo aur dher bada hoke agle player pe chala jaata hai. +4 ka jawab sirf +4. Jo na de sake (ya na de) woh saare patte uthata hai aur baari khota hai."], ["Chalne tak uthao", "Chalne ko patta na ho to tab tak uthate raho jab tak fit hone wala na mile, phir chal sakte ho."]],
    steps: ['Sabko saat patte milte hain. Ek patta dher shuru karta hai.', 'Apni baari pe aisa patta chalo jo upar wale se rang, number ya nishaan mein mile.', 'Skip (⊘) agle player ko chhod deta hai. Turn Around (⇄) disha badalta hai; do players mein yeh skip jaisa hai. +2 agle se do patte uthwaata hai aur uski baari jaati hai.', 'Rainbow patta kisi pe bhi chal sakta hai aur agla rang tum chunte ho. Rainbow +4 bhi yahi karta hai, aur agla chaar patte uthaata hai aur baari khota hai.', 'Chalne ko kuch nahi? Ek patta uthao. Fit ho to chal sakte ho; warna pass.'],
    win: 'Jo pehle 150 points pahunche woh jeeta. Paanch round mein koi na pahunche to sabse zyada wala.',
    scoring: 'Jo haath khaali kare use baaki sabke haath ke patton ke points: number wale apna number, action patte 20, rainbow 50.',
  },
  'call-break': {
    steps: ['Saare 52 patte baante jaate hain, har player ko 13.', 'Dealer ke baad wale se shuru karke har player 1 se 8 tak haath (trick) bolta hai.', 'Pehla player koi bhi patta chalta hai. Ghoomte hue har player ko wahi rang chalna hai, aur ho sake to ab tak ke sabse bade se bada.', 'Wo rang na ho to hukum (spade) chalna padega, aur ho sake to sabse bade hukum se bada. Hukum bhi na ho to kuch bhi.', 'Sabse bada hukum haath jeetta hai; hukum na ho to chale gaye rang ka sabse bada patta. Jeetne wala agla chalta hai.'],
    win: 'Paanch round ke baad sabse zyada total wala jeeta.',
    scoring: 'Bola utna banaya to bola hua number milta hai, aur har extra haath ka 0.1. Kam bana to bola hua number kat jaata hai.',
  },
  'crazy-eights': {
    house: [["Do pe do uthao", "2 agle player se do patte uthwaata hai aur uski baari jaati hai, jab tak woh apna 2 na chale: tab agla chaar uthata hai, aur aise hi."], ["Gulaam skip", "Gulaam agle player ki baari chhudwa deta hai."], ["Ikka palat", "Ikka khel ki disha palat deta hai. Do players mein iska matlab tum phir chalte ho."]],
    steps: ['Do players ho to har ek ko saat patte, zyada ho to paanch. Ek patta dher shuru karta hai.', 'Apni baari pe aisa patta chalo jo upar wale se rang ya number mein mile.', 'Aath kisi pe bhi chal sakta hai, aur agla rang tum bolte ho.', 'Chalne ko kuch nahi to ek patta uthao. Chal sake to chalo; nahi to pass.', 'Kisi ke patte khatam to round khatam.'],
    win: 'Teen round ke baad sabse kam penalty wala jeeta.',
    scoring: 'Haath mein bache patte tumhare khilaaf ginte hain: aath ke 50, badshah, begum ya gulaam ke 10, ikka 1, aur baaki apna number.',
  },
  checkers: {
    steps: ['Gotiyan ek khaana tirchha aage khaali kaale khaane pe chalti hain. Goti dabao, phir nishaan wala khaana.', 'Maarne ke liye rival goti ke upar se tirchha kood ke peeche khaali khaane pe jao. Maari hui goti hat jaati hai.', 'Maar sakte ho to maarna zaroori hai, aur wahi goti phir kood sake to kood-ti rahegi.', 'Aakhri line pe pahunchi goti raja ban jaati hai aur baari khatam. Raja aage aur peeche dono taraf tirchha chalta aur koodta hai.'],
    win: 'Doosre ke paas goti ya koi chaal na bache to tum jeete. Chaalees chaal har ek bina maare ya aam goti chalaaye ho to draw.',
    scoring: 'Game jeet ya draw pe khatam. Result mein jeetne wale ko 1.',
  },
  'four-in-a-row': {
    steps: ['Baari baari kisi bhi khaali column mein ek goti daalo.', 'Goti us column ki sabse neeche khaali jagah pe girti hai.', 'Apni chaar gotiyan line mein laao, aadi, khadi ya tirchhi, aur turant jeeto.'],
    win: 'Pehli chaar ki line jeetti hai. Grid bhar gaya aur line nahi bani to draw.',
    scoring: 'Game jeet ya draw pe khatam. Result mein jeetne wale ko 1.',
  },
  'tic-tac-toe': {
    steps: ['Ek player ✕ hai aur doosra ◯. ✕ pehle chalta hai.', 'Baari baari ek khaali khaana lo.', 'Apne teen nishaan line mein, aade, khade ya tirchhe, aur jeet.'],
    win: 'Jo pehle teen ki line banaye woh jeeta. Nau khaane bhar gaye aur line nahi bani to draw.',
    scoring: 'Game jeet ya draw pe khatam. Result mein jeetne wale ko 1.',
  },
  reversi: {
    steps: ['Game beech mein chaar gotiyon se shuru hota hai. Kaala pehle chalta hai.', 'Nishaan wale khaane pe goti rakho. Chaal mein kam se kam ek rival goti nayi goti aur tumhari doosri goti ke beech seedhi line mein phansni chahiye.', 'Phansi hui saari gotiyan tumhare rang mein palat jaati hain, har disha mein ek saath.', 'Koi chaal nahi to tumhari baari chhoot jaati hai. Dono na chal sakein to game khatam.'],
    win: 'Aakhir mein jiski zyada gotiyan woh jeeta. Barabar ho to draw.',
    scoring: 'Tumhara score aakhir mein tumhare rang ki gotiyon ki ginti hai.',
  },
  'dots-and-boxes': {
    steps: ['Baari baari do paas wale dots ke beech ek line kheencho.', 'Tumhari line ne dabbe ki chauthi line poori ki to dabba tumhara, aur tumhe phir line kheenchni hai.', 'Saari lines khinch gayi to game khatam.'],
    win: 'Jiske sabse zyada dabbe woh jeeta. Sab barabar to draw.',
    scoring: 'Har band kiya dabba ek point.',
  },
  mancala: {
    steps: ['Har player ke paas apni taraf chhe gaddhe aur right side pe ek godaam hai. Apna koi bhara gaddha dabao.', 'Us gaddhe ke saare beej ek ek karke ulti ghadi ki disha mein agle gaddhon mein daale jaate hain. Apne godaam mein ek daalte ho, par doosre ka godaam chhod dete ho.', 'Aakhri beej apne godaam mein gira to phir se baari.', 'Aakhri beej apni taraf ke khaali gaddhe mein gira, aur saamne wale gaddhe mein beej hain, to woh saare aur tumhara beej tumhare.', 'Ek taraf ke beej khatam to doosra player apni taraf ke bache beej rakh leta hai.'],
    win: 'Jiske godaam mein sabse zyada beej woh jeeta. Barabar ho to draw.',
    scoring: 'Godaam ka har beej ek point.',
  },
  'nine-mens-morris': {
    steps: ['Rakhna: baari baari kisi khaali point pe goti rakho, jab tak dono nau nau na rakh dein.', 'Chalna: phir baari baari goti ko line ke saath paas ke khaali point pe khiskao.', 'Jab bhi teen ki nayi line (mill) bane, rival ki ek goti hatao. Mill ki gotiyan safe hain, jab tak saari mill mein na hon.', 'Udna: sirf teen gotiyan bachi to tumhari gotiyan kisi bhi khaali point pe kood sakti hain.'],
    win: 'Doosre ki do gotiyan bachein ya koi chaal na ho to tum jeete. Pachaas chaal har ek bina maare ho to draw.',
    scoring: 'Game jeet ya draw pe khatam. Result mein jeetne wale ko 1.',
  },
  'memory-match': {
    steps: ['Apni baari pe do tiles dabake palto. Sab players unhe dekh sakte hain.', 'Match hua to jodi tumhari aur phir se baari.', 'Match nahi hua to agle player ki baari shuru hote hi woh palat jaate hain, aur baari aage.'],
    win: 'Saari jodiyan mil gayi to jiske paas sabse zyada woh jeeta. Sab barabar to draw.',
    scoring: 'Har jodi ek point.',
  },
  yacht: {
    house: [["Upar ka bonus", "Ones se Sixes milake 63 ya zyada (yaani har number ke teen) banao to aakhir mein 35 extra points."]],
    steps: ['Paanchon dice phenko. Jo rakhne hain unhe dabao, baaki phir phenko. Ek baari mein teen baar tak.', 'Kisi bhi phenk ke baad ruk ke kisi aisi category mein score likho jo abhi use nahi hui.', 'Ones se Sixes us number ka total dete hain. Choice saare dice ka total.', 'Four of a kind un chaar dice ka total. Full house (teen ek jaise, do doosre jaise) paanchon ka total.', 'Little straight (1–5) aur Big straight (2–6) ke 30. Yacht (paanchon ek jaise) ke 50.', 'Kuch fit na ho tab bhi koi category chunni hi padegi, chahe 0 mile.'],
    win: 'Har ek ki baarah baari ke baad sabse zyada total jeetta hai.',
    scoring: 'Tumhara total saari baarah categories ka jod hai.',
  },
  pig: {
    steps: ['Apni baari pe dice phenko. 2 se 6 tak jo aaye, is baari ke total mein judta hai.', 'Jitni baar chaho phir phenko, ya hold karke is baari ka total bank karo.', '1 aaya to is baari ka total gaya aur baari aage.'],
    win: 'Target pe pahuncho (Quick mein 50, Classic aur Two dice mein 100), phir baaki sabko tumhe peeche chhodne ki ek aakhri baari milti hai. Uske baad sabse zyada bank wala jeeta.',
    scoring: 'Sirf bank kiye points tumhare score mein ginte hain.',
  },
  werewolf: {
    steps: ['Sab chupke se apna secret role padhte hain: Werewolf, Seer, Doctor ya Villager.', 'Raat: werewolves ek player ko pakadne ke liye chunte hain, Seer kisi ka role jaanne ke liye ek player chunta hai, aur Doctor ek player ko bachaata hai.', 'Subah: gaon ko pata chalta hai raat mein kaun pakda gaya, agar Doctor ne bachaaya na ho.', 'Din: chat mein baat karo, phir jo bache hain woh us player ko vote dete hain jo unhe werewolf lagta hai. Sabse zyada vote wala bahar aur uska role dikhta hai. Barabar vote to koi bahar nahi.', 'Phir raat aati hai, aur game tab tak chalta hai jab tak ek taraf na jeete.'],
    win: 'Saare werewolf vote se bahar ho gaye to gaon jeeta. Werewolf baaki sabke barabar ho gaye to werewolf jeete.',
    scoring: 'Jeetne wali taraf ke sab jeette hain: werewolves saath, ya Seer, Doctor aur Villagers saath. Nau ya zyada players mein do werewolf hote hain.',
  },
  'who-is-the-spy': {
    steps: ['Har player chupke se apna secret word padhta hai.', 'Table pe ghoomte hue har player apne word ke liye ek clue card chalta hai.', 'Clue padho, phir sab chupke se us player ko vote do jis pe shak hai.', 'Sabse zyada vote wale pe ilzaam. Vote barabar to kisi pe nahi, aur jasoos bach nikalta hai.', 'Jasoos pakda gaya to use chaar options mein se doosron ka word ek baar guess karne ka mauka milta hai.'],
    win: 'Teen round ke baad sabse zyada points wala jeeta.',
    scoring: 'Bach nikla jasoos 3 pata hai. Pakda gaya jasoos sahi word guess kare to 2; galat ho to baaki sabko 1. Aath ya zyada players mein do jasoos hote hain.',
  },
  'truth-or-dare': {
    steps: ['Apni baari pe Truth ya Dare chuno.', 'Sawaal padho, phir zor se jawab do ya kaam karo.', 'Point ke liye Done dabao, ya Skip dabao. Skip karne ki koi saza nahi.', 'Baari agle player ki.'],
    win: 'Aakhri baari ke baad sabse zyada points wala jeeta, waise asli jeet toh hansi hai.',
    scoring: 'Har sach bataane aur har dare karne ka 1 point. Skip ka kuch nahi jaata.',
  },
  'riddle-chits': {
    steps: ['Chit pe ek paheli khulti hai jo sab padhte hain.', 'Jo jawab sahi lage woh chuno. Jab tak sab jawab na de dein, koi tumhara jawab nahi dekhta.', 'Pakka nahi? Jawab se pehle hint dabao. Usse us paheli ke points kam ho jaate hain.', 'Phir jawab aur sabki choice dikhti hai, aur agli chit khulti hai.'],
    win: 'Aakhri paheli ke baad sabse zyada points wala jeeta.',
    scoring: 'Sahi jawab ke 2 points, hint li to 1. Galat jawab ka kuch nahi.',
  },
  'majority-vote': {
    steps: ['Ek sawaal kuch jawabon ke saath khulta hai.', 'Sab chupke se woh jawab chunte hain jo unhe lagta hai zyada log chunenge.', 'Sabne chun liya to total bar ki tarah dikhte hain.', 'Jisne sabse popular jawab chuna use ek point.'],
    win: 'Aakhri sawaal ke baad sabse zyada points wala jeeta.',
    scoring: 'Har baar majority wala jawab chuno to ek point. Do jawab barabar sabse zyada hon to dono ginte hain.',
  },
  consequences: {
    steps: ['Har player baari baari dikhaaye gaye hisse ke liye ek line likhta hai, pichhli lines dekhe bina.', 'Doston ke saath apni lines type karo. Anjaan logon ke saath hamari likhi lines mein se chuno, taaki koi kuch bura na bheje.', 'Saat hisson se kahani banti hai: kaun, kisse mila, kahan, kisne kya kaha, kya hua, aur duniya ne kya kaha.', 'Phir kahani sabke padhne ke liye khulti hai.'],
    win: 'Kahani poore table ko hansaaye to sab jeete.',
    scoring: 'Points nahi hain: sabse achhi kahani mehfil jeet leti hai.',
  },
};
