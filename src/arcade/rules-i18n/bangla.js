/** Protiti game kibhabe khelbe, Roman Bangla-y. rules.js-er English-er moto ek-i dhap, ek-i krome. (Bangla horofe tools/guides/bn.mjs-e.) */
export default {
  'flying-chit': {
    steps: ['Stick tano, ba arrow key, W A S D ba gamepad diye chirkut-ke upore, niche, bame ar dane nao.', 'Ekta ring dekhay chirkut porer churir kotha diye jabe: nishana thik hole seta sobuj hoy. Churir kache chirkut aste tar majhkhaner dike tene jay.', 'Sonali churir bhetor diye gele kichuta orar shokti phere. Score-er nicher bar dekhay kotota baki.', 'Porpor churi par hole combo hoy: protitay ×2, ×3, sorbochcho ×5 point.', 'Churi phoskale combo shesh. Pakha ba boi-er stupe dhakka lagle onekta orar shokti jay.', 'Orar shokti phurole chirkut mejhete neme ase ar uran shesh.', 'Protita notun level shuru hoy ekta boro sonali churi diye: 10 point ar puro orar shokti.'],
    win: 'Eka hole nijer sera score chhariye jao. Onyoder songe sobai ekshonge ore, sobcheye beshi score jar se jete.',
    scoring: 'Protita churi tar combo-r point dey: series cholar somoy 1, tarpor 2, 3, 4 ar 5. 50, 200, 500 ar 1000 point-e medal.',
  },
  'tunnel-race': {
    steps: ['Stick bame ba dane tano, ba A ar D, arrow key ba gamepad diye shuronger bhetore gol kore oro.', 'Lal deyal shuronger ekta ongsho atkay: pash diye ghure jao. Komla deyal ekta phak rekhe sob atkay: phak diye beroo.', 'Jhalmole rotno jogar koro, protita 10 point.', 'Deyal chhulei khela shesh. Joto egobe shurongo toto jore chole, ar protita notun level-e notun dhoroner deyal ase.'],
    win: 'Eka hole nijer sera score chhariye jao. Onyoder songe sobai ekshonge dourai, sobcheye beshi score jar se jete.',
    scoring: 'Jotota urbe toto point, ar protita rotne 10. 50, 150, 300 ar 600 point-e medal.',
  },
  'turbo-tunnel': {
    steps: ['Stick bame ba dane tano, ba A ar D, arrow key ba gamepad diye gari-ke shuronger bhetore gol kore ghorao.', 'Cone, barrier, gari, truck ar pathor chhule race shesh. Tomar gari jetay dhakka khete choleche, tar niche lal alo jole.', 'Shuronger protita sarite sobsomoy ekta khola poth thake jekhane somoymoto pouchano jay. Rastay halka sobuj tir seta dekhay.', 'Coin 10 point. Nil nitro pad tin second durotter point digun kore. Sobuj dhal ekbar dhakka nije samle ney.', 'Tele race shesh hoy na, kintu gari pichlay ar kichukkhon steering dhire sara dey.', 'Kichur ekdom ga ghenshe berole olper jonno bacha: 5 bonus point.'],
    win: 'Eka hole nijer sera score chhariye jao. Bondhuder songe sobai ek-i shurongge ekshonge dourai: shesh porjonto je gari chole se jete, ar sobai dhakka khele sobcheye beshi score jete.',
    scoring: 'Jotota chalabe toto point (nitro-te digun), protita coin-e 10 ar protibar olper jonno bachay 5. 100, 300, 700 ar 1500 point-e medal.',
  },
  'reaction-time': {
    steps: ["Screen lal thaka porjonto opekkha koro. Sobuj holei jekono jaygay tap koro (ba Space, Enter ba gamepad button chapo), joto druto paro.","Sobujer age, ba round 3 ar 4-er nil nokol shongkete tap kora bhul shuru, ar oi round-e kichhu mele na.","Tomar somoy tomar nijer phone-ei mapa hoy, screen-e sobuj dekha theke tap porjonto, tai dhir internet tomake dhir kore na. 100 ms-er kom somoy andaj dhora hoy.","Panchta round. Protita round-er por sobar somoy dekhay, ar table-e sobcheye druto jon 50 bonus point pay."],
    win: "Panch round por sobcheye beshi point jar se jete. Eka hole nijer sera bhango ar medal jeto.",
    scoring: "Proti round-e 500 theke tomar somoy (millisecond) bad jay: 250 ms hole 250 point. Bhul shuru ar phoskano round-e 0. 600, 900, 1100 ar 1300 point-e medal.",
  },
  'stroop-test': {
    steps: ["Card-e ekta ronger naam rongin kalite lekha ase. Kalir ronger button chapo (ba tar upor dekhano arrow key).","Card 6 theke kichhu card-e lekha thake \"shobdota bachho\": tokhon shobdo je rong bole seta bachho.","Protita card-e shudhu tomar prothom tap gona hoy, tai nishchit hoye chapo. Card 11 theke 15-e somoy kom pabe.","Tomar somoy tomar nijer phone-e card dekha dewar muhurto theke mapa hoy, tai durer bondhuder songe online-e khelao nyajyo."],
    win: "Ponerota card-er por sobcheye beshi point jar se jete. Eka hole nijer sera bhango ar medal jeto.",
    scoring: "Thik uttor joto druto toto beshi point: 2000 theke tomar somoy (millisecond) bad diye dosh diye bhag, komopokkhe 10. Bhul ba kono uttor na hole 0. Bondhuder songe proti card-e sobcheye druto thik uttor aro 20 pay. 600, 1200, 1700 ar 2100 point-e medal.",
  },
  'number-memory': {
    steps: ["Ekta number muhurter jonno dekha jay. Nicher bar dekhay seta kotokkhon thakbe.","Lukolei keypad-e (ba keyboard-e) number-ta type kore ✓ chapo. Tomar hate 15 second porjonto.","Thik: porer number ek onko boro. Bhul: ekta heart gelo. Tinte heart gele tumi bad.","Protita phone nijer type nijer kache rakhe ar ✓-e puro uttor pathay; uttor dewar somoy bondhuder phone-e number-ta jay na."],
    win: "Eka hole joto lomba number paro mone rakho. Bondhuder songe sobcheye beshi point jete; sobai bad porle ba shesh tike thaka kheloyar agei egiye thakle khela shesh.",
    scoring: "Thik uttore proti onke dosh point: 7 onker number 70. 70, 150, 250 ar 400 point-e medal.",
  },
  'word-guess': {
    steps: ["Tumi ekta sutro (jemon Fruit ba Sport) ar faka ghore shobdo-ta dekho, jekhane ekta okkhor khola thake.","Proti der second-e arekta okkhor khole. Shesh okkhor-ta kokhono khole na, tai andaj kortei hoy.","Okkhorer keypad-e (ba keyboard-e) puro shobdo-ta type kore ✓ chapo. Proti shobde ekbari chesta.","Protita phone nijer kheloyarer somoy nijei mape, ar bondhuder phone-e shudhu khola okkhorgulo jay, puro shobdo kokhono na."],
    win: "Aatta shobder pore jar point sobcheye beshi se jete.",
    scoring: "Thik uttore 10 point, ar pathanor somoy jotogulo okkhor lukono chhilo protitar jonno aro 10. Bondhuder songe proti shobde sobcheye druto thik uttor aro 10 pay. Bhul uttore shei shobde kono point nei. 80, 160, 240 ar 320 point-e medal.",
  },
  'fast-typing': {
    steps: ["Ek second-er jonno \"Get ready\" dekhay, tarpor shobdo-ta ase.","Okkhorer keypad-e (ba keyboard-e) shobdo-ta type kore ✓ chapo. Proti shobde ekbari chesta.","Shobder nicher bar baki somoy dekhay: char second ar proti okkhore ek second.","Protita phone nijer kheloyarer somoy mape thik jokhon shobdo-ta shei screen-e elo tokhon theke, tai dhir internet tomar gati komay na."],
    win: "Doshta shobder pore jar point sobcheye beshi se jete.",
    scoring: "Thik shobde proti second-e type kora protita okkhorer jonno dosh point: dui second-e chhoy okkhor mane 30. Proti thik shobde komopokkhe 5, boro jor 60. Ekta okkhor bhul hole shei shobde kono point nei. 120, 200, 280 ar 360 point-e medal.",
  },
  'bingo': {
    steps: ["Prottekey 1 theke 25 alada krome sajano ekta card pay. Tomar card shudhu tumii dekhte pao.","Nijer palay 1 theke 25-er moddhe emon ekta number type koro ja ekhono bola hoyni, tarpor ✓ chapo. 15 second ache, noile tomar hoye ekta number bola hoye jay.","Bola number-ta sobar card-e kata jay, tomar ar bondhudero.","Protita purno sari, column ba konakuni ekta line, ar seta B-I-N-G-O-r porer okkhor jalay."],
    win: "Prothome panchta line puron korle joy. Ekta number-e duto card ekshonge purno hole jar line beshi se jete; tobuo soman hole je number-ta bolechhilo se jete.",
    scoring: "Uporer bar dekhay kar BINGO-r kota okkhor jolechhe. Ekta card-e barota line hote pare: panchta sari, panchta column ar duto konakuni.",
  },
  'unblock-puzzle': {
    steps: ["Protita parking-e riksha (sobuj, holud chhauni), charpasher gari ar tar sarir dan dike gate dekha jay.","Kono gari angul ba mouse diye tene sorao. Jotota tano totota jay, pother prothom badha porjonto.","Othoba tir diye gari bachho, Hold chapo ar tir diye sorao. Charte abar Hold chapo.","Riksha ar gate-er majhe kichhu na thakle dane sorao, seta beriye jabe. Proti parking-e dui minute."],
    win: "Panchta parking-er pore jar point sobcheye beshi se jete.",
    scoring: "Berole 50 point, kom chale korle aro 50 porjonto: sobcheye kom chaler cheye protita beshi chale 5 kom. Bondhuder songe proti parking theke prothom je beroy se aro 20 pay. 200, 300, 400 ar 470 point-e medal.",
  },
  'hoop-flick': {
    steps: ['Gultir moto stick pechhone tano: ball ulto dike urbe. Joto tanbe toto jore.', 'Chhurte stick chhere dao. Keyboard-e bam ar dan arrow-e nishana, upor-niche jor, ar Space-e chhoro.', 'Ball-ta-ke porer hoop-e upor theke phelo.', 'Protita hoop-er baro second: lal bar janay somoy phuriye asche.', 'Phoskale ball court-er baire pore ar khela shesh.', 'Proti panch basket-e notun level: nora hoop, tarpor batash, tarpor duto-i.'],
    win: 'Eka hole nijer record bhango. Bondhur songe prottek-e court-er nijer ordheke khele ar beshi score jete.',
    scoring: 'Rim chhuye dhukle 1 point. Porishkar dhukle 2, ar porpor porishkar dhukle aro beshi: protitay 5 porjonto. 20, 50, 100 ar 200 point-e medal.',
  },
  'ghost-hostel': {
    steps: ['Tomar bichhana proti second-e coin kamay. Bhalo bichhana beshi kamay.', 'Arrow ba button diye bichhana, dorja, pakha ba meramot bechhe Kino chapo.', 'Dorja: beshi mojbut, ar notun mojbuti porjonto sarano hoy. Meramot: dorjar kichhuta saray, tarpor porer meramoter age koyek second lage.', 'Bhut tomar dorjay thakle pakha take hawa dey. Jotheshto aghat pele se sere uthte nijer kone bhese phire jay.', 'Bhut proti tirish second-e shoktishali hoy, ar shesh chollish second-e aro rege jay. Dorja bhangle tumi dhora pore bad.'],
    win: 'Surjo othar somoy jara nijer ghore ache sobai jete. Bhut-ke puro tarale raat taratari shesh. Sobai dhora porle bhut jete.',
    scoring: 'Bichhanar kamano protita coin tomar score, sokal porjonto tikle 100, ar bhut-ke chirotore tarale aro 150.',
  },
  'pin-spin': {
    steps: ['Screen-e tap koro, ba Pin button, Space, Enter ba gamepad-er button diye pin pathao. Seta sobsomoy soja upore board-er niche giye bindhe.', 'Phaker opekkha koro: tomar pin age theke gantha pin chhule khela shesh.', 'Level shesh korte screen-er niche dekhano sob pin kaje lagao.', 'Sonali tarar sticker-e pin ganthle 5 bonus point.', 'Proti ponchom level ekta boro board: tar goti ar dik bodlay.', 'Protita level-e somoyshima ache (nicher soru bar): somoy phuronor age sob pin kaje lagao.'],
    win: 'Eka hole nijer record bhango. Onyoder songe sobai ekshonge nijer board-e pin ganthe, sobcheye beshi score jete.',
    scoring: 'Protita gantha pin-e 1, protita taray 5, ar level shesh korle level number-er digun. 25, 60, 120 ar 250 point-e medal.',
  },
  'bull-fight': {
    steps: ['Stick tano, ba W A S D, arrow key ba gamepad diye tomar shanr chalao.', 'Samne jhanpate Akromon chapo. Onyo shanr motamuti samne thakle akromon nijei tar dike jay. Tarpor bar-e abar CHARGE READY asa porjonto opekkha koro.', 'Protita shanrer nicher britto ar tir dekhay se kar ar kon dike mukh. Kinarar kache khur bali ankre dhore, tai dhakka na khele baire jabe na; kache ele kinara lal jole ar EDGE! dekhay.', 'Akromone thaka shanr onyo-ta-ke dhakka dile take chhitke dey ar kichukkhon matha ghuriye dey.', 'Jake sada dager baire thele dewa hoy se round hare. Kichukkhon por britto chhoto hote thake.'],
    win: 'Je age tin round jete se match jete.',
    scoring: 'Onyo shanr-ke baire thele dilei round jeta.',
  },
  'spin-duel': {
    steps: ['Tin second-er launch somoye protipokkher dike jore swipe koro. Launch button-o ekta sohoj bikolpo.', 'Lomba ar druto swipe latim-ke beshi shokti dey. Proti round-e ekbar launch.', 'Timer-er por latimgulo nijerai ghore ar dhakka khay. Tomar-ta-ke mathe ar ghuronto rakho.', 'Shesh porjonto je latim ghore se round jete. Duto ekshonge thamle draw.', 'Je age tin round jete se match jete. Dujonei tin round phoskale match draw.'],
    win: 'Bot-er biruddhe eka, ek screen-e, kachhe ba online-e khelo. Khele coin kamao ar latim ar mather style kholo.',
    scoring: 'Protipokkher latim chhitke diye ba tar cheye beshikkhon ghure round jeto. Match jete je age tin round jete.',
  },
  'pen-fight': {
    steps: ['Tin second-er moddhe protipokkher dike swipe koro. Toka button-o ekta sohoj bikolpo.', 'Druto swipe-e kolom jore jay; dik thik kore se kon pothe jabe.', 'Kolomgulo nijerai pichlay ar dhakka khay. Table theke pore jawa ba dhakkay ulte jawa kolom round hare.', 'Duto-i table-e thakle sheshe jar obosthan bhalo se jete; khub kachakachi hole draw.', 'Je age tin round jete se match jete. Dujonei phoskano tin round hole match draw.'],
    win: 'Bot-er biruddhe eka, bondhur songe ek screen-e, kachhe ba online-e khelo. Kamano coin-e kolom ar table-er chehara kholo; style shudhu dekhar jonno.',
    scoring: 'Protipokkher kolom table theke phele, jor dhakkay ulte, ba beshikkhon tike round jeto. Match jete je age tin round jete.',
  },
  'lapa-chupi': {
    steps: ['Proti match-e khonjar lok bodlay. Se chokh bondho kore deyaler kache opekkha kore, ar bakira panch second-e lukay.', 'Joystick ba arrow key diye 3D khelar mathe ghoro. Jore dourate Sprint chepe rakho, kintu mote ek second-er moto, tarpor hanpiye jabe.', 'Jhop, bench ba dolnar pashe theme chupchap thakle lukano jay. Norle ba khonjar lok-ke kache aste dile dhora porbe.', 'Khonjar lok sobaike khunje pele jete. Somoy sheshe jara lukiye thake tara ekshonge jete.', 'Online room-e lukano kheloyarder jayga onyoder pathano hoy na.'],
    win: 'Computer kheloyarder songe, bondhuder songe ek screen-e, kachhe ba online-e khelo. Khali jayga bot bhoray.',
    scoring: 'Khonjar lok prottek-ke khunje pele ek point pay ar sobaike pele jete. Somoy shesh porjonto jara lukiye thake tara ekshonge jete ar jekono songkhok khonjar cheye beshi point pay.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani tin ba charjoner khela: ekjon dhore ar bakira palay. Khali jayga computer bhoray, ar je dhore se proti match-e bodlay.', 'Je dhore se uthoner majhkhane tin gone, palanor lokera chhoriye pore. Tarpor dhoradhori shuru.', 'Joystick ba arrow key diye cholo. Goti barate Sprint chepe rakho; ek second-er moto pore hanpiye jabe ar kichukkhon hantte hobe.', 'Je dhore se kauke chhule se jome jay (baraf!). Mukto keu jome thaka bondhu-ke chhule take goliye dey (pani!).', 'Sob palanor lok ekshonge jome gele je dhore se jete. Somoy sheshe ekjon-o mukto thakle palanor dol jete.'],
    win: 'Computer-er palanor lokder biruddhe eka, bondhuder songe ek screen-e, kachhe ba online-e khelo. Khali jayga bot bhoray.',
    scoring: 'Dol hisebe jeta hoy: je dhore se sobaike jomiye, palanor dol somoy shesh porjonto ekjon-ke mukto rekhe. Joyira 1 point pay.',
  },
  'pakda-padi': {
    steps: ['Joystick ba arrow key diye khelar mathe cholo. Goti barate Sprint chepe rakho; ek second-er moto pore hanpiye jabe ar kichukkhon hantte hobe.', 'IT chihnowala kheloyar tin gune bakider tara kore. Chhoya dite jotheshto kache jao.', 'Dhora porle ghure onyo kauke tara koro. Shonge shonge pherot chhoya cholbe na: dui second tumi take chhute parbe na je eimatro tomake chhuyechhe.', 'Somoy sheshe je sobcheye kom somoy IT chhilo se jete. Draw-o hote pare.'],
    win: 'Computer kheloyarder songe, bondhuder songe ek screen-e, kachhe ba online-e khelo. Khali jayga bot bhoray.',
    scoring: 'Je sobcheye kom somoy IT chhilo se jete. Chhoyar songkha scoreboard-e gona hoy.',
  },
  'ship-fight': {
    steps: ['Somudrer nijer ordheke jekono jaygay jahaj chalao. Tar kaman motamuti proti second-e nijei onyo jahaje gola chhore.', 'Protita jahaj panchta gola soite pare. Pathor gola atkay, tai aral hisebe kaje lagao.', 'Majhkhane baksho ase: heart jahaj saray, ar kamaner baksho panchta tinmukhi gola dey.', 'Round khub lomba hole jhor jahajgulo khoy kore, kom pran jar tar theke shuru kore.'],
    win: 'Je age tin round jete se match jete.',
    scoring: 'Onyo jahaj dobalei round jeta.',
  },
  'road-dash': {
    steps: ['Lane bodlate bam ba dan chapo (stick tano, A ar D, ba arrow key).', 'Goru, gorto, bus ar onyo riksha erao.', 'Barti point-er jonno coin jogar koro.', 'Joto tikbe rasta toto jore chole, ar motamuti proti 100 point-e notun traffic niye notun level. Ekbar dhakkay khela shesh.'],
    win: 'Eka hole nijer sera score chhariye jao. Onyoder songe sobcheye beshi score jete.',
    scoring: 'Jotota poth gechho toto point, ar protita coin-e 5.',
  },
  'backyard-rally': {
    steps: ['Tomar bat upore-niche chalao.', 'Ball phiriye maro. Protita mare ball ektu jore hoy.', 'Bat-er kinaray lagle ball tikkhno kone jay.', 'Ball tomar bat periye gele onyojon point pay.'],
    win: 'Je age shat point kore se jete.',
    scoring: 'Ball protibar onyojon-ke perole ek point.',
  },
  'hungry-snake': {
    steps: ['Tomar shap-ke upore, niche, bame ba dane chalao. Se kokhono thame na.', 'Ekta khabar khele ek point ar shap lomba hoy.', 'Deyal, nijer shorir ba onyo shape dhakka khele khela shesh.', 'Onyoder songe shesh porjonto chola shap 3 bonus point pay.'],
    win: 'Eka hole nijer sera score chhariye jao. Onyoder songe sobcheye beshi score jete.',
    scoring: 'Protita khabare ek point, ar shesh porjonto tike thakle 3.',
  },
  ludo: {
    steps: ['Nijer dane Roll chapo. Ghunti ghor theke shurur ghore ante chhokka lage.', 'Jholjhole ghunti ba tar button chapo, chhokkay joto poreche toto egobe. Ektai ghunti cholte parleo tumi nijei chapbe; konota na chole dan shesh.', 'Protipokkher ghuntite namle seta ghore phere. Shurur ghor ar tarar ghor nirapod: sekhane keu kata pore na.', 'Board ghure ghunti tomar ghore pherar sarite dhoke. Ghore pouchate thik songkha lage.', 'Chhokka, ghunti kata ar ghunti ghore pouchano, protitay arekta dan. Porpor tin chhokkay dan jay.'],
    win: 'Normal mode: je age charta ghunti ghore ane se jete. Score mode: 15 round sheshe, ba keu charta ghunti ghore anle, sobcheye beshi point jar se jete.',
    scoring: 'Khelar age mode beche nao. Normal mode-e point nei: phalaphole dekhay ke kota ghunti ghore enechhe. Score mode-e protita ghor 1, ghunti kata 20, ghunti ghore 30, ar sobar age charta shesh korle bonus 50.',
    house: [['Atok', 'Ek-i ronger duto ghunti pother ek-i ghore thakle atok toiri hoy. Ar keu seta perote ba sekhane namte pare na, ar oi ghuntigulo kata jay na.'], ['Katle tobei ghor', 'Kheloyar ontoto ekta protipokkho ghunti na kata porjonto ghunti ghore pherar sarite dhukte pare na. Totokkhon se arek pak ghore.'], ['Druto shuru', 'Sobai ekta ghunti age thekei shurur ghore niye shuru kore, jate khela shonge shonge chole.'], ['Sthaner jonno khela chole', 'Tin ba charjone bijoyi paoar poro khela thame na: bakira dwitiyo ar tritiyo sthaner jonno khele, ar sheshe krom dekhano hoy.']],
  },
  carrom: {
    steps: ['Seat 1 sada ghunti ar seat 2 kalo ghunti khele. Protita ronger noyta, ar majhe lal rani.', 'Striker slider-e striker baseline-e rakho, nishanay dik ar jore shokti beche maro.', 'Nijer ghunti pocket-e phelle abar maro. Na hole dan jay.', 'Rani-ke cover korte hoy. Rani phelar por ek-i shot-e ba porer-tay nijer ekta ghunti phelo, noile rani majhe phere.', 'Striker pocket-e gele foul: tomar phela ekta ghunti majhe phere ar dan shesh.', 'Karo shesh ghunti pocket-e thakte parar age rani-ke chole jete hobe.'],
    win: 'Rani cover kora obosthay je age nijer sob ghunti phele se jete. 80 shot-er por jar kom ghunti baki se jete.',
    scoring: 'Bijoyi onyojoner board-e thaka protita ghuntite 1 point pay, rani tar hole aro 3.',
  },
  chess: {
    steps: ['Sada age chale, tarpor pala kore. Ghunti chapo, tarpor chihnito ghor.', 'Nouka soja chole, hati konakuni, montri dubhabei, ghora L akare laphay ar raja ek ghor.', 'Bore ek ghor samne jay, prothom chale dui ghor-o, ar konakuni ek ghor samne kate. Shesh sarite gele montri, nouka, hati ba ghora hoye jay.', 'Castling: raja ar ekta nouka na chole, majher ghor khali thakle ar raja kistir ghor na perole, raja noukar dike dui ghor jay ar nouka tar upor diye laphiye jay.', 'En passant: protipokkher bore dui ghor egiye tomar borer pashe ele, thik porer chalei take emonbhabe katte paro jeno se ek ghor gechhe.', 'Akromoner mukhe raja kistite ache. Nijer chale kisti theke berotei hobe.'],
    win: 'Kistimat hole jeta: raja kistite ar bachar poth nei. Draw hoy stalemate-e (boidho chal nei kintu kisti-o nei), ek-i obosthan tinbar, dupokkher ponchash chal kata ba bore chal chhara, ba mat dewar moto ghunti na thakle.',
    scoring: 'Khela joy ba draw-te shesh. Phalaphole bijoyi 1 pay.',
  },
  'snakes-and-ladders': {
    steps: ['Sobai board-er baire, ghor 1-er age theke shuru kore. Pala kore chhokka chale.', 'Board-er number dhore chhokkay joto pore toto ghunti egao.', 'Moi-er niche namle upore otho. Shaper mathay namle lej porjonto pichhle namo.', 'Chhokka porle arekbar chalo.', 'Ghor 100-e thik songkha lage. Chal periye gele ghunti jekhane ache sekhanei thake.'],
    win: 'Je age thik ghor 100-e name se jete.',
    scoring: 'Khelar moddhe point nei. Phalaphole dekhay ke kon ghore pouchechhe.',
    house: [['Chhokkay shuru', 'Kheloyar 6 na paoa porjonto ghunti board-er baire opekkha kore. 6 porle se ghor 1-e ase ar oi kheloyar abar chale.'], ['Phire laphano', '100 perono chal phire laphay: 97 theke 5 porle 100-e giye dui ghor phire 98. Jekhane thame sekhane shap ar moi chole.'], ['Tin chhokka', 'Porpor tin chhokkay ghunti daner shurur jaygay phere, ar dan jay.']],
  },
  'color-clash': {
    steps: ['Sobai shatta kore tash pay. Ekta tash diye stup shuru hoy.', 'Nijer dane uporer tasher songe rong, number ba chihno mele emon tash dao.', 'Skip (⊘) porer jon-ke bad dey. Reverse (⇄) dik ultay; dujone skip-er moto. +2 porer jon-ke duto tash tolay ar dan kere ney.', 'Rainbow tash jekono tashe dewa jay ar porer rong tumi bachho. Rainbow +4-o tai, ar porer jon charta tole ar dan haray.', 'Dewar kichhu nei? Ekta tash tolo. Mille dite paro, na mille pass.'],
    win: 'Je age 150 point-e pouchay se jete. Panch round-e keu na pouchale sobcheye beshi score jete.',
    scoring: 'Jar tash shesh, se bakider hate thaka tasher point pay: number tash tar maan, action tash 20, rainbow tash 50.',
    house: [['Jomano', '+2 kheyechho? Tar upor nijer +2 ba Rainbow +4 dao, bere jawa shasti porer joner kache jay. +4-er jobab shudhu arekta +4. Je pare na (ba dey na) se sob tole ar dan haray.'], ['Mela porjonto tolo', 'Dewar tash na thakle mela tash na asa porjonto tulte thako, tarpor seta dite paro.']],
  },
  'call-break': {
    steps: ['52-ta tash sob banta hoy, prottek-e 13-ta.', 'Je bante tar porer jon theke shuru kore prottek-e 1 theke 8 haat dake.', 'Prothom jon jekono tash dey. Pala kore sobaike ek-i ronger tash dite hoy, ar parle ekhonkar sera tash-ke harate hoy.', 'Oi rong na thakle iskapon dite hoy, ar parle sobcheye boro iskapon-ke harate hoy. Iskapon-o na thakle ja khushi dao.', 'Sobcheye boro iskapon haat jete; iskapon na thakle prothom ronger sobcheye boro tash. Joyi porer haat shuru kore.'],
    win: 'Panch round por sobcheye beshi mot jar se jete.',
    scoring: 'Dak puron hole daker soman point, ar protita barti haate 0.1. Puron na hole daker soman kata jay.',
  },
  'crazy-eights': {
    steps: ['Dujone prottek-e shatta, beshi hole panchta tash. Ekta tash diye stup shuru hoy.', 'Nijer dane uporer tasher songe rong ba maan mele emon tash dao.', 'Aath jekono tashe dewa jay, ar porer rong tumi bole dao.', 'Dewar kichhu na thakle ekta tash tolo. Parle dao, na parle pass.', 'Karo tash shesh hole round shesh.'],
    win: 'Tin round por jar shastir point sobcheye kom se jete.',
    scoring: 'Hate thaka tash tomar bipokkhe gona hoy: aath 50, saheb, bibi ba golam 10, tekka 1, bakira tader number.',
    house: [['Duri duto tolay', 'Duri porer jon-ke duto tash tolay ar dan kere ney, jodi na se nijer duri dey: tokhon tar porer jon charta tole, ebhabe chole.'], ['Golam bad dey', 'Golam porer kheloyarer dan kere ney.'], ['Tekka dik bodlay', 'Tekka khelar dik ulte dey. Dujone mane abar tomar dan.']],
  },
  checkers: {
    steps: ['Ghunti konakuni ek ghor samne khali garho ghore jay. Ghunti chapo, tarpor chihnito ghor.', 'Katte protipokkher ghuntir upor diye konakuni laphiye pechhoner khali ghore jao. Kata ghunti uthe jay.', 'Katte parle katte-i hobe, ar ek-i ghunti abar laphate parle chaliye jete hobe.', 'Shesh sarite pouchano ghunti raja hoy, ar dan sekhanei shesh. Raja konakuni samne-pechhone dudikei chole ar laphay.'],
    win: 'Protipokkher ghunti ba boidho chal na thakle tumi jeto. Dupokkher chollish chal kata ba sadharon ghunti chala chhara hole draw.',
    scoring: 'Khela joy ba draw-te shesh. Phalaphole bijoyi 1 pay.',
  },
  'four-in-a-row': {
    steps: ['Pala kore jekono khali column-e ekta chakti phelo.', 'Chakti oi column-er sobcheye nicher khali jaygay pore.', 'Nijer charta chakti araari, khara ba konakuni sarite ano ar shonge shonge jeto.'],
    win: 'Prothom charer sari jete. Ghor bhore giyeo sari na hole draw.',
    scoring: 'Khela joy ba draw-te shesh. Phalaphole bijoyi 1 pay.',
  },
  'tic-tac-toe': {
    steps: ['Ekjon ✕, onyojon ◯. ✕ age chale.', 'Pala kore ekta khali ghor nao.', 'Nijer tinte chihno araari, khara ba konakuni sarite holei jeta.'],
    win: 'Je age tiner sari banay se jete. Noyta ghor bhore-o sari na hole draw.',
    scoring: 'Khela joy ba draw-te shesh. Phalaphole bijoyi 1 pay.',
  },
  reversi: {
    steps: ['Majhe charta chakti diye khela shuru. Kalo age chale.', 'Chihnito ghore chakti rakho. Chale ontoto ekta protipokkher chakti notun chakti ar tomar arekta chaktir majhe soja line-e atkate hobe.', 'Sob atkano chakti sob dike ekshonge tomar ronge ulte jay.', 'Boidho chal na thakle dan bad jay. Keu chalte na parle khela shesh.'],
    win: 'Sheshe jar beshi chakti se jete. Soman hole draw.',
    scoring: 'Sheshe tomar ronger chaktir songkhai tomar score.',
  },
  'dots-and-boxes': {
    steps: ['Pala kore duto pashapashi bindur majhe ekta dag tano.', 'Tomar dag kono bakser chaturtho dik bondho korle baksho-ta tomar, ar tomake abar tante hobe.', 'Sob dag tana hole khela shesh.'],
    win: 'Jar sobcheye beshi baksho se jete. Sobai soman hole draw.',
    scoring: 'Protita bondho kora bakshe ek point.',
  },
  mancala: {
    steps: ['Prottek-er nijer dike chhoyta gorto ar dan prante ekta gola. Bij ache emon nijer gorto chapo.', 'Oi gorter sob bij ekta ekta kore, ghorir ulto dike, porer gortogulote chhorano hoy. Nijer golay ekta phelo, protipokkher-ta bad dao.', 'Shesh bij nijer golay porle abar dan.', 'Shesh bij tomar diker khali gorte porle ar ultodiker gorte bij thakle, segulo sob ar nijer bij-tao niye nao.', 'Ek diker bij shesh hole onyojon nijer diker baki bij rekhe dey.'],
    win: 'Golay sobcheye beshi bij jar se jete. Soman hole draw.',
    scoring: 'Golar protita bije ek point.',
  },
  'nine-mens-morris': {
    steps: ['Bosano: pala kore jekono khali bindute ghunti bosao, jotokkhon na prottek-e noyta bosay.', 'Chalano: tarpor pala kore dag dhore pasher khali bindute ghunti sorao.', 'Jokhoni notun tiner sari (mill) banao, protipokkher ekta ghunti tule nao. Mill-er ghunti surokkhito, jodi na sobgulo-i mill-e thake.', 'Ora: matro tinte ghunti thakle segulo jekono khali bindute laphate pare.'],
    win: 'Protipokkher duto ghunti thakle ba boidho chal na thakle tumi jeto. Dupokkher ponchash chal kata chhara hole draw.',
    scoring: 'Khela joy ba draw-te shesh. Phalaphole bijoyi 1 pay.',
  },
  'memory-match': {
    steps: ['Nijer dane duto tile chepe ultao. Sob kheloyar dekhte pay.', 'Jora mille seta tomar, ar abar dan.', 'Na mille porer kheloyarer dan shurur somoy abar ulte jay, ar dan jay.'],
    win: 'Sob jora paoa gele jar sobcheye beshi jora se jete. Sobai soman hole draw.',
    scoring: 'Protita joray ek point.',
  },
  yacht: {
    steps: ['Panchta chhokka-i chalo. Jegulo rakhte chao chapo, bakigulo abar chalo. Ek dane tinbar porjonto.', 'Jekono chaler por theme ekhono na-lekha kono ghore score likhte paro.', 'Ek theke chhoyer ghore oi songkhar jogphol. Choice sob chhokkar jogphol.', 'Charte ek-i oi charter jogphol. Full house (tinte ek-i ar duto ek-i) panchtar jogphol.', 'Chhoto sinri (1–5) ar boro sinri (2–6) 30. Yacht (panchtai ek-i) 50.', 'Kichhu na mileo ekta ghor bachhtei hobe, jodio 0 hoy.'],
    win: 'Prottek-er baroti daner por sobcheye beshi mot jete.',
    scoring: 'Tomar mot holo baroti ghorer jogphol.',
    house: [['Uporer bonus', 'Ek theke chhoy miliye 63 ba beshi hole (mane protita songkhar tinte) sheshe 35 barti point.']],
  },
  pig: {
    steps: ['Nijer dane chhokka chalo. 2 theke 6 ja pore ei daner mote jog hoy.', 'Jotobar khushi chalo, ba theme ei daner mot joma koro.', '1 porle ei daner mot jay ar dan arekjoner.'],
    win: 'Lokkhye pouchale (Quick-e 50, Classic ar dui chhokkay 100) baki sobai tomake chharate ekta shesh dan pay. Tarpor jar joma sobcheye beshi se jete.',
    scoring: 'Shudhu joma kora point-i gona hoy.',
  },
  werewolf: {
    steps: ['Sobai chupichupi nijer bhumika pore: nekremanush, jyotishi, daktar ba grambashi.', 'Raat: nekrera dhorar jonno ekjon-ke bachhe, jyotishi karo bhumika jante ekjon-ke bachhe, ar daktar rokkha korte ekjon-ke bachhe.', 'Sokal: daktar rokkha na korle gram jante pare raate ke dhora poreche.', 'Din: chat-e kotha bolo, tarpor jara ache sobai jake nekre mone hoy take vote dey. Sobcheye beshi vote jar se beriye jay ar tar bhumika janano hoy. Soman vote-e keu jay na.', 'Abar raat name, ar ek pokkho na jeta porjonto khela chole.'],
    win: 'Sob nekre-ke vote-e ber korlei gram jete. Nekrer songkha bakider soman hole nekrera jete.',
    scoring: 'Joyi pokkher sobai jete: nekrera ekshonge, ba jyotishi, daktar ar grambashira ekshonge. Noy ba beshi kheloyare duto nekre.',
  },
  'who-is-the-spy': {
    steps: ['Prottek kheloyar chupichupi nijer shobdo pore.', 'Table ghure prottek-e nijer shobder jonno ekta ingit card dey.', 'Ingit poro, tarpor sobai gopone jake sondeho hoy take vote dey.', 'Sobcheye beshi vote jar take obhijukto kora hoy. Soman vote-e kauke noy, ar guptochor paliye jay.', 'Guptochor dhora porle charta bikolpo theke bakider shobdo ekbar andaj korar sujog pay.'],
    win: 'Tin round por sobcheye beshi point jar se jete.',
    scoring: 'Palano guptochor 3 pay. Dhora pore shobdo andaj korte parle 2; bhul hole baki sobai 1. Aath ba beshi kheloyare duto guptochor.',
  },
  'truth-or-dare': {
    steps: ['Nijer dane Shotti ba Shahosh bachho.', 'Proshno poro, tarpor jore uttor dao ba kore dekhao.', 'Point-er jonno Hoye gechhe chapo, ba Bad dao chapo. Bad dile kokhono shasti nei.', 'Dan jay porer kheloyarer kache.'],
    win: 'Shesh daner por sobcheye beshi point jar se jete, jodio asol moja hashite.',
    scoring: 'Protita bola shotti ar kora shahose 1 point. Bad dile kichhu kate na.',
  },
  'riddle-chits': {
    steps: ['Chirkute ekta dhandha khole, sobai porar jonno.', 'Je uttor thik mone hoy seta bachho. Sobai uttor dewar age keu tomar bachai dekhe na.', 'Nishchit nao? Uttorer age ingit nao. Oi dhandhar point kome jay.', 'Tarpor uttor ar sobar bachai dekhay, ar porer chirkut khole.'],
    win: 'Shesh dhandhar por sobcheye beshi point jar se jete.',
    scoring: 'Thik uttore 2 point, ingit nile 1. Bhul uttore kichhu noy.',
  },
  'majority-vote': {
    steps: ['Koyekta sombhabbo uttor niye ekta proshno khole.', 'Sobai chupichupi sei uttor bachhe jeta tar mone hoy beshirbhag bachhbe.', 'Sobai bachhle mot songkha bar hisebe dekhay.', 'Jara sobcheye jonopriyo uttor bechhechhe tara sobai ek point pay.'],
    win: 'Shesh proshner por sobcheye beshi point jar se jete.',
    scoring: 'Protibar beshirbhager uttor bachhle ek point. Duto uttor soman vote-e sobar age thakle duto-i gona hoy.',
  },
  consequences: {
    steps: ['Pala kore prottek-e dekhano ongsher jonno ekta line jog kore, ager line na dekhe.', 'Bondhuder songe nijer line lekho. Ochenader table-e amader lekha line theke bachho, jate keu kharap kichhu pathate na pare.', 'Shatta ongshe ekta golpo hoy: ke, kar songe dekha holo, kothay, ke ki bollo, ki ghotlo, ar duniya ki bollo.', 'Tarpor golpo-ta khule jay ar sobai pore.'],
    win: 'Golpo puro table-ke hashale sobai jete.',
    scoring: 'Point nei: sera golpo ashor matay.',
  },
};
