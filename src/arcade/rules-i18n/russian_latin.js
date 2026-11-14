/** Kak igrat v kazhduyu igru, po-russki latinitsei. Made by tools/make-latin-rules.mjs from tools/guides/ru.mjs: edit that file, not this one. */
export default {
 "flying-chit": {
  "steps": [
   "Dvigai stik ili ispolzui strelki, W A S D ili geimpad, chtoby napravlyat zapisku vverkh, vniz, vlevo i vpravo.",
   "Koltso pokazyvaet, gde tvoya zapiska peresechet sleduyushchii braslet: ono stanovitsya zelenym, kogda ty tselishsya tochno. Ryadom s brasletom zapisku myagko tyanet k ego tsentru.",
   "Proleti skvoz zolotoi braslet, chtoby vernut nemnogo podemnoi sily. Poloska pod schetom pokazyvaet, skolko ee ostalos.",
   "Braslety podryad dayut kombo: ×2, ×3, do ×5 ochkov za kazhdyi.",
   "Propushchennyi braslet obryvaet kombo. Udar o ventilyator ili stopku knig otnimaet mnogo podemnoi sily.",
   "Kogda podemnaya sila konchaetsya, zapiska planiruet na pol, i polet okonchen.",
   "Kazhdyi novyi uroven nachinaetsya s bolshogo zolotogo brasleta: 10 ochkov i polnaya podemnaya sila."
  ],
  "win": "V odinochku ty gonishsya za svoim rekordom. S drugimi vse letyat odnovremenno, i pobezhdaet luchshii schet.",
  "scoring": "Kazhdyi braslet prinosit ochki svoego kombo: 1, zatem 2, 3, 4 i 5, poka dlitsya seriya. Medali za 50, 200, 500 i 1000 ochkov."
 },
 "tunnel-race": {
  "steps": [
   "Dvigai stik vlevo ili vpravo, ili ispolzui A i D, strelki ili geimpad, chtoby letat po krugu vnutri tonnelya.",
   "Krasnye steny perekryvayut chast tonnelya: obletai ikh. Oranzhevye steny zakryvayut vse, krome odnogo proema: proletai v proem.",
   "Sobirai sverkayushchie kristally, po 10 ochkov za kazhdyi.",
   "Kosnulsya steny — zabeg okonchen. Chem dalshe, tem bystree tonnel, i kazhdyi novyi uroven prinosit novyi vid sten."
  ],
  "win": "V odinochku pobei svoi rekord. S drugimi vse letyat odnovremenno, i pobezhdaet luchshii schet.",
  "scoring": "Ochki za proidennoe rasstoyanie i 10 za kazhdyi kristall. Medali za 50, 150, 300 i 600 ochkov."
 },
 "turbo-tunnel": {
  "steps": [
   "Dvigai stik vlevo ili vpravo, ili ispolzui A i D, strelki ili geimpad, chtoby povorachivat po krugu vnutri tonnelya.",
   "Konusy, ograzhdeniya, mashiny, gruzoviki i kamni zakanchivayut gonku, esli ikh zadet. Sleduyushchee prepyatstvie, v kotoroe vrezhetsya tvoya mashina, podsvecheno krasnym snizu.",
   "V kazhdom ryadu tonnelya vsegda est svobodnyi proezd, do kotorogo mozhno uspet. Ego pokazyvayut blednye zelenye strelki na doroge.",
   "Monety dayut 10 ochkov. Sinyaya nitro-ploshchadka na tri sekundy udvaivaet ochki za rasstoyanie. Zelenyi shchit prinimaet odin udar na sebya.",
   "Maslo ne ostanavlivaet, no mashinu zanosit, i kakoe-to vremya ona medlenno slushaetsya rulya.",
   "Proskochit mimo prepyatstviya vpritirku — eto \"chut ne vrezalsya\": 5 bonusnykh ochkov."
  ],
  "win": "V odinochku pobei svoi rekord. S druzyami vse edut v odnom tonnele odnovremenno: pobezhdaet poslednyaya mashina, chto eshche edet, a esli razbilis vse — luchshii schet.",
  "scoring": "Ochki za proidennoe rasstoyanie (vdvoe bolshe na nitro), 10 za kazhduyu monetu i 5 za kazhdoe \"chut ne vrezalsya\". Medali za 100, 300, 700 i 1500 ochkov."
 },
 "reaction-time": {
  "steps": [
   "Zhdi, poka ekran krasnyi. Kogda on stanet zelenym, kak mozhno bystree nazhmi v lyubom meste (ili Probel, Enter, knopku geimpada).",
   "Nazhatie do zelenogo ili na sinii lozhnyi signal v raundakh 3 i 4 — falstart, i v etom raunde ochkov net.",
   "Tvoe vremya izmeryaetsya na tvoem zhe telefone, ot poyavleniya zelenogo na tvoem ekrane do nazhatiya, tak chto medlennyi internet nikogda ne delaet tebya medlennee. Menshe 100 ms schitaetsya ugadyvaniem.",
   "Vsego pyat raundov. Posle kazhdogo vidno vremya vsekh, a samyi bystryi za stolom poluchaet 50 bonusnykh ochkov."
  ],
  "win": "Pobezhdaet tot, u kogo bolshe vsego ochkov posle pyati raundov. V odinochku pobei svoi rekord i soberi medali.",
  "scoring": "Kazhdyi raund prinosit 500 minus tvoe vremya v millisekundakh: reaktsiya 250 ms prinosit 250. Falstarty i propushchennye raundy — 0. Medali za 600, 900, 1100 i 1300 ochkov."
 },
 "stroop-test": {
  "steps": [
   "Na kartochke poyavlyaetsya nazvanie tsveta, napisannoe tsvetnymi chernilami. Nazhmi knopku tsveta ChERNIL (ili strelku, ukazannuyu na nei).",
   "S 6-i kartochki na nekotorykh napisano \"Nazhmi SLOVO\": togda otvechai tem tsvetom, kotoryi nazvan slovom.",
   "Na kazhdoi kartochke zaschityvaetsya tolko pervoe nazhatie, tak chto zhmi, kogda uveren. Na kartochkakh 11–15 vremeni menshe.",
   "Tvoe vremya izmeryaetsya na tvoem zhe telefone s momenta, kogda tam poyavilas kartochka, poetomu igrat onlain s dalekimi druzyami chestno."
  ],
  "win": "Posle pyatnadtsati kartochek pobezhdaet tot, u kogo bolshe ochkov. V odinochku pobei svoi rekord i soberi medali.",
  "scoring": "Pravilnyi otvet stoit tem bolshe, chem on bystree: 2000 minus tvoe vremya v millisekundakh, delennoe na desyat, no ne menshe 10. Oshibka ili otsutstvie otveta — 0. S druzyami samyi bystryi pravilnyi otvet na kazhdoi kartochke poluchaet eshche 20. Medali za 600, 1200, 1700 i 2100 ochkov."
 },
 "number-memory": {
  "steps": [
   "Chislo poyavlyaetsya na mgnovenie. Poloska pod nim pokazyvaet, skolko ono proderzhitsya.",
   "Kogda ono ischeznet, naberi chislo na klaviature ekrana (ili na svoei) i nazhmi ✓. U tebya do 15 sekund.",
   "Verno: sleduyushchee chislo na tsifru dlinnee. Neverno: teryaesh serdechko. Tri serdechka — i ty vybyl.",
   "Kazhdyi telefon khranit nabrannoe svoim igrokom i otpravlyaet ves otvet po ✓; poka vse otvechayut, telefony druzei ne poluchayut samo chislo."
  ],
  "win": "V odinochku zapomni samoe dlinnoe chislo, kakoe smozhesh. S druzyami pobezhdaet bolshe vsego ochkov; igra zakanchivaetsya, kogda vybyli vse ili poslednii ostavshiisya uzhe vperedi.",
  "scoring": "Vernyi otvet prinosit desyat ochkov za tsifru: 7-znachnoe chislo stoit 70. Medali za 70, 150, 250 i 400 ochkov."
 },
 "word-guess": {
  "steps": [
   "Ty vidish podskazku (naprimer, Fruit ili Sport) i slovo v vide pustykh kletok, odna bukva otkryta.",
   "Kazhdye poltory sekundy otkryvaetsya eshche odna bukva. Poslednyaya ne otkryvaetsya nikogda, tak chto ugadyvat pridetsya vsegda.",
   "Naberi slovo tselikom na bukvennoi klaviature (ili na svoei) i nazhmi ✓. Na kazhdoe slovo odna popytka.",
   "Kazhdyi telefon sam zasekaet vremya svoego igroka, a telefony druzei poluchayut tolko uzhe otkrytye bukvy, no nikogda samo slovo."
  ],
  "win": "Posle vosmi slov pobezhdaet tot, u kogo bolshe vsego ochkov.",
  "scoring": "Vernyi otvet prinosit 10 ochkov i eshche po 10 za kazhduyu bukvu, skrytuyu v moment otpravki. S druzyami samyi bystryi vernyi otvet na kazhdoe slovo daet eshche 10. Nevernyi otvet nichego ne prinosit za eto slovo. Medali za 80, 160, 240 i 320 ochkov."
 },
 "fast-typing": {
  "steps": [
   "Na sekundu poyavlyaetsya \"Get ready\", zatem slovo.",
   "Naberi slovo na bukvennoi klaviature (ili na svoei) i nazhmi ✓. Na kazhdoe slovo odna popytka.",
   "Poloska pod slovom pokazyvaet ostavsheesya vremya: chetyre sekundy plyus po odnoi na bukvu.",
   "Kazhdyi telefon zasekaet vremya svoego igroka s momenta, kogda slovo poyavilos na ego ekrane, tak chto medlennaya svyaz ne otnimaet skorost."
  ],
  "win": "Posle desyati slov pobezhdaet tot, u kogo bolshe vsego ochkov.",
  "scoring": "Vernoe slovo prinosit desyat ochkov za kazhduyu bukvu v sekundu: shest bukv za dve sekundy — eto 30. Minimum 5 za vernoe slovo, maksimum 60. Odna nevernaya bukva — i slovo nichego ne prinosit. Medali za 120, 200, 280 i 360 ochkov."
 },
 "bingo": {
  "steps": [
   "Kazhdyi poluchaet kartochku s chislami ot 1 do 25 v svoem poryadke. Tvoyu kartochku vidish tolko ty.",
   "V svoi khod naberi chislo ot 1 do 25, kotoroe eshche ne nazyvali, i nazhmi ✓. U tebya 15 sekund, inache chislo nazovut za tebya.",
   "Nazvannoe chislo zacherkivaetsya na vsekh kartochkakh — tvoei i druzei.",
   "Kazhdyi zapolnennyi ryad, stolbets ili diagonal — eto liniya, ona zazhigaet sleduyushchuyu bukvu B-I-N-G-O."
  ],
  "win": "Pobezhdaet tot, kto pervym soberet pyat linii. Esli odno chislo zakryvaet dve kartochki srazu, pobezhdaet tot, u kogo bolshe linii; pri ravenstve — tot, kto nazval chislo.",
  "scoring": "Poloska sverkhu pokazyvaet, skolko bukv BINGO zazheg kazhdyi igrok. Na kartochke dvenadtsat vozmozhnykh linii: pyat ryadov, pyat stolbtsov i dve diagonali."
 },
 "unblock-puzzle": {
  "steps": [
   "Na kazhdoi parkovke vidno rikshu (zelenaya, s zheltym tentom), mashiny vokrug i vorota sprava v ee ryadu.",
   "Peretashchi mashinu paltsem ili myshyu, chtoby sdvinut. Ona edet nastolko, naskolko tyanesh, do pervogo prepyatstviya.",
   "Ili vyberi mashinu strelkami, nazhmi Hold i dvigai strelkami. Nazhmi Hold eshche raz, chtoby otpustit.",
   "Kogda mezhdu rikshei i vorotami nichego net, sdvin ee vpravo — i ona uedet. Na kazhduyu parkovku dve minuty."
  ],
  "win": "Posle pyati parkovok pobezhdaet tot, u kogo bolshe vsego ochkov.",
  "scoring": "Vyezd prinosit 50 ochkov i do 50 sverkhu za maloe chislo khodov: na 5 menshe za kazhdyi khod sverkh luchshego. S druzyami pervyi vyekhavshii s kazhdoi parkovki poluchaet eshche 20. Medali za 200, 300, 400 i 470 ochkov."
 },
 "hoop-flick": {
  "steps": [
   "Ottyani stik nazad, kak rogatku: myach poletit v obratnuyu storonu. Chem silnee ottyanesh, tem silnee brosok.",
   "Otpusti stik, chtoby brosit. S klaviatury strelkami vlevo i vpravo tselsya, vverkh i vniz zadavai silu, a Probelom brosai.",
   "Sdelai tak, chtoby myach upal v sleduyushchee koltso sverkhu.",
   "Na kazhdoe koltso dvenadtsat sekund: krasnaya poloska pokazyvaet, kogda vremya na iskhode.",
   "Promakhnulsya — myach padaet s ploshchadki, i igra okonchena.",
   "Kazhdye pyat popadanii — novyi uroven: dvizhushchiesya koltsa, potom veter, potom i to i drugoe."
  ],
  "win": "V odinochku pobei svoi rekord. S drugom kazhdyi igraet na svoei polovine ploshchadki, i pobezhdaet bolshii schet.",
  "scoring": "Brosok, zadevshii duzhku, prinosit 1. Chistoe popadanie — 2, a chistye podryad — bolshe: do 5 ochkov za kazhdoe. Medali za 20, 50, 100 i 200 ochkov."
 },
 "ghost-hostel": {
  "steps": [
   "Tvoya krovat prinosit monety kazhduyu sekundu. Krovat poluchshe prinosit bolshe.",
   "Strelkami ili knopkami vyberi Krovat, Dver, Ventilyator ili Remont i nazhmi Kupit.",
   "Dver: bolshe prochnosti, i ee chinyat do novoi prochnosti. Remont: chinit chast dveri, posle chego nuzhno podozhdat neskolko sekund do sleduyushchego remonta.",
   "Ventilyatory duyut na prizraka, poka on u tvoei dveri. Nanesi emu dostatochno urona, i on uletit v svoi ugol vosstanavlivatsya.",
   "Prizrak stanovitsya silnee kazhdye tridtsat sekund, a v poslednie sorok zlitsya eshche bolshe. Esli dver slomaetsya, tebya poimayut, i ty vybyvaesh."
  ],
  "win": "Pobezhdayut vse, kto k rassvetu eshche v svoei komnate. Progoni prizraka sovsem — i noch zakonchitsya ranshe. Esli poimayut vsekh, pobezhdaet prizrak.",
  "scoring": "Ty poluchaesh kazhduyu monetu, chto zarabotala krovat, plyus 100 za to, chto dozhil do utra, i eshche 150, esli prizrak izgnan navsegda."
 },
 "pin-spin": {
  "steps": [
   "Kosnis ekrana, nazhmi knopku Knopka, Probel, Enter ili knopku geimpada, chtoby zapustit kantselyarskuyu knopku. Ona vsegda letit pryamo vverkh, v niz doski.",
   "Dozhdis prosveta: esli tvoya knopka zadenet uzhe votknutuyu, igra okonchena.",
   "Ispolzui vse knopki, pokazannye vnizu ekrana, chtoby proiti uroven.",
   "Popadi v nakleiku s zolotoi zvezdoi — 5 bonusnykh ochkov.",
   "Kazhdyi pyatyi uroven — bolshaya doska: ona menyaet skorost i napravlenie.",
   "U kazhdogo urovnya est limit vremeni (tonkaya poloska vnizu): istrat vse knopki, poka on ne konchilsya."
  ],
  "win": "V odinochku pobei svoi rekord. S drugimi kazhdyi odnovremenno vtykaet knopki v svoyu dosku, i pobezhdaet luchshii schet.",
  "scoring": "Kazhdaya votknutaya knopka — 1 ochko, kazhdaya zvezda — 5, a proidennyi uroven prinosit udvoennyi nomer urovnya. Medali za 25, 60, 120 i 250 ochkov."
 },
 "bull-fight": {
  "steps": [
   "Dvigai stik ili ispolzui W A S D, strelki ili geimpad, chtoby upravlyat bykom.",
   "Nazhmi Ryvok, chtoby brositsya vpered. Esli drugoi byk primerno pered toboi, ryvok sam napravitsya pryamo na nego. Potom dozhdis, poka na poloske snova poyavitsya CHARGE READY.",
   "Koltso i strelka pod kazhdym bykom pokazyvayut, chei on i kuda smotrit. U kraya kopyta tseplyayutsya za pesok, tak chto vyletish, tolko esli tebya vytolknut; krai svetitsya krasnym i poyavlyaetsya EDGE!, kogda ty blizko.",
   "Byk, kotoryi v ryvke vrezaetsya v drugogo, otbrasyvaet ego i nenadolgo oglushaet.",
   "Kogo vytolknuli za beluyu liniyu, tot proigryvaet raund. Cherez nekotoroe vremya krug nachinaet suzhatsya."
  ],
  "win": "Kto pervym vyigraet tri raunda, tot vyigryvaet match.",
  "scoring": "Vytolknut drugogo byka — znachit vyigrat raund."
 },
 "spin-duel": {
  "steps": [
   "Za tri sekundy zapuska bystro provedi paltsem v storonu sopernika. Knopka Zapusk — dostupnaya alternativa.",
   "Dlinnoe i bystroe dvizhenie daet volchku bolshe sily. Odin zapusk za raund.",
   "Posle otscheta volchki sami krutyatsya i stalkivayutsya. Uderzhi svoi na arene i vo vrashchenii.",
   "Poslednii krutyashchiisya volchok vyigryvaet raund. Esli oba ostanovyatsya odnovremenno — nichya.",
   "Kto pervym vyigraet tri raunda, tot vyigryvaet match. Esli oba igroka propustyat tri raunda, match zakanchivaetsya vnichyu."
  ],
  "win": "Igrai odin protiv bota, na odnom ekrane, ryadom ili onlain. Zarabatyvai monety v igre i otkryvai stili volchkov i aren.",
  "scoring": "Raund vyigryvaet tot, kto vybet chuzhoi volchok ili prokrutitsya dolshe. Match — do trekh vyigrannykh raundov."
 },
 "pen-fight": {
  "steps": [
   "Za tri sekundy provedi paltsem v storonu sopernika. Knopka Shchelchok — dostupnaya alternativa.",
   "Chem bystree dvizhenie, tem silnee letit ruchka; napravlenie zadaet ee put.",
   "Ruchki sami skolzyat i stalkivayutsya. Ruchka, upavshaya so stola ili oprokinutaya udarom, proigryvaet raund.",
   "Esli obe ruchki ostalis na stole, pobezhdaet ta, chto zanyala luchshee polozhenie; ochen ravnye raundy — nichya.",
   "Kto pervym vyigraet tri raunda, tot vyigryvaet match. Tri raunda, gde promakhnulis oba, zakanchivayutsya nichei."
  ],
  "win": "Igrai odin protiv bota, s drugom na odnom ekrane, ryadom ili onlain. Otkryvai oblik ruchek i stolov za zarabotannye monety; stili — tolko dlya krasoty.",
  "scoring": "Raund vyigryvaet tot, kto sbrosit ruchku sopernika so stola, oprokinet ee silnym udarom ili proderzhitsya dolshe. Match — do trekh vyigrannykh raundov."
 },
 "lapa-chupi": {
  "steps": [
   "V kazhdom matche vodit drugoi igrok. Vodyashchii zhdet u steny s zakrytymi glazami, a u ostalnykh est pyat sekund, chtoby spryatatsya.",
   "Khodi po 3D-ploshchadke dzhoistikom ili strelkami. Uderzhivai Sprint, chtoby bezhat bystree, no lish okolo sekundy, potom sbivaetsya dykhanie.",
   "Vstan u kusta, skameiki ili gorki i zamri, chtoby spryatatsya. Dvizhenie ili podpushchennyi blizko vodyashchii vydayut tebya.",
   "Vodyashchii pobezhdaet, esli naidet vsekh. Kto ostalsya spryatannym, kogda vremya vyshlo, pobezhdaet vmeste.",
   "V onlain-komnatakh mestopolozhenie spryatavshikhsya igrokov ne otpravlyaetsya ostalnym."
  ],
  "win": "Igrai s kompyuternymi igrokami, s druzyami na odnom ekrane, ryadom ili onlain. Boty zanimayut svobodnye mesta.",
  "scoring": "Vodyashchii poluchaet ochko za kazhdogo naidennogo i pobezhdaet, esli naidet vsekh. Kto ostalsya spryatannym k kontsu vremeni, pobezhdaet vmeste i poluchaet bolshe, chem lyuboe chislo nakhodok."
 },
 "baraf-pani": {
  "steps": [
   "V Baraf Pani igrayut vtroem ili vchetverom: odin vodyashchii i beguny. Kompyuternye igroki zanimayut svobodnye mesta, a vodyashchii menyaetsya kazhdyi match.",
   "Vodyashchii schitaet do trekh v tsentre dvora, poka beguny razbegayutsya. Potom nachinaetsya pogonya.",
   "Dvigaisya dzhoistikom ili strelkami. Uderzhivai Sprint dlya ryvka; primerno cherez sekundu sbivaetsya dykhanie, i kakoe-to vremya pridetsya idti.",
   "Kogda vodyashchii kasaetsya beguna, tot zamiraet (baraf!). Svobodnyi begun, kosnuvshiisya zamershego druga, raskoldovyvaet ego (pani!).",
   "Vodyashchii pobezhdaet, esli vse beguny zamerli odnovremenno. Beguny pobezhdayut, esli k kontsu vremeni khot odin svoboden."
  ],
  "win": "Igrai odin protiv kompyuternykh begunov, s druzyami na odnom ekrane, ryadom ili onlain. Boty zanimayut svobodnye mesta.",
  "scoring": "Pobezhdayut komandoi: vodyashchii — zamoroziv vsekh begunov, beguny — uderzhav khotya by odnogo svobodnym do kontsa vremeni. Pobediteli poluchayut 1 ochko."
 },
 "pakda-padi": {
  "steps": [
   "Dvigaisya po ploshchadke dzhoistikom ili strelkami. Uderzhivai Sprint dlya ryvka; primerno cherez sekundu sbivaetsya dykhanie, i kakoe-to vremya pridetsya idti.",
   "Igrok s otmetkoi IT schitaet do trekh i brosaetsya dogonyat ostalnykh. Podberis dostatochno blizko, chtoby peredat \"salku\".",
   "Tebya osalili — razvorachivaisya i dogonyai drugogo. Bez obratnoi salki: dve sekundy nelzya osalit togo, kto tolko chto osalil tebya.",
   "Kogda vremya vykhodit, pobezhdaet tot, kto menshe vsego probyl IT. Vozmozhna nichya."
  ],
  "win": "Igrai s kompyuternymi igrokami, s druzyami na odnom ekrane, ryadom ili onlain. Boty zanimayut svobodnye mesta.",
  "scoring": "Pobezhdaet tot, kto menshe vsekh probyl IT. Salki schitayutsya na tablo."
 },
 "ship-fight": {
  "steps": [
   "Vodi svoi korabl gde ugodno v svoei polovine morya. Ego pushka sama strelyaet po drugomu korablyu primerno raz v sekundu.",
   "Kazhdyi korabl vyderzhivaet pyat popadanii. Skaly ostanavlivayut vystrely, tak chto pryachsya za nimi.",
   "V tsentre poyavlyayutsya yashchiki: serdtse chinit korabl, a yashchik s pushkoi daet pyat troinykh vystrelov.",
   "Esli raund zatyagivaetsya, shtorm nachinaet izmatyvat korabli, nachinaya s togo, u kogo menshe zhizni."
  ],
  "win": "Kto pervym vyigraet tri raunda, tot vyigryvaet match.",
  "scoring": "Potopit drugoi korabl — znachit vyigrat raund."
 },
 "road-dash": {
  "steps": [
   "Nazhimai vlevo ili vpravo (dvigai stik, A i D ili strelki), chtoby menyat polosu.",
   "Obezzhai korov, yamy, avtobusy i drugie rikshi.",
   "Sobirai monety radi dopolnitelnykh ochkov.",
   "Chem dolshe derzhishsya, tem bystree doroga, i primerno kazhdye 100 ochkov — novyi uroven s novym dvizheniem. Odna avariya zakanchivaet zabeg."
  ],
  "win": "V odinochku pobei svoi rekord. S drugimi pobezhdaet luchshii schet.",
  "scoring": "Ochki za proidennoe rasstoyanie i 5 za kazhduyu monetu."
 },
 "backyard-rally": {
  "steps": [
   "Dvigai raketku vverkh i vniz.",
   "Otbivai myach. Kazhdyi udar delaet ego chut bystree.",
   "Krai raketki otpravlyaet myach pod bolee ostrym uglom.",
   "Esli myach proskochil mimo tvoei raketki, ochko poluchaet sopernik."
  ],
  "win": "Pobezhdaet tot, kto pervym naberet sem ochkov.",
  "scoring": "Odno ochko kazhdyi raz, kogda myach prokhodit mimo sopernika."
 },
 "hungry-snake": {
  "steps": [
   "Napravlyai zmeiku vverkh, vniz, vlevo ili vpravo. Ona nikogda ne ostanavlivaetsya.",
   "Sesh ugoshchenie, chtoby poluchit ochko i vyrasti.",
   "Vrezalsya v stenu, v sebya ili v druguyu zmeiku — igra okonchena.",
   "S drugimi poslednyaya zmeika, chto eshche dvizhetsya, poluchaet 3 bonusnykh ochka."
  ],
  "win": "V odinochku pobei svoi rekord. S drugimi pobezhdaet luchshii schet.",
  "scoring": "Odno ochko za ugoshchenie i eshche 3 za to, chto ostalsya poslednim."
 },
 "ludo": {
  "steps": [
   "V svoi khod nazhmi Brosit. Chtoby vyvesti fishku iz doma na startovuyu kletku, nuzhna shesterka.",
   "Nazhmi na podsvechennuyu fishku ili ee knopku, chtoby sdvinut ee na vypavshee chislo. Dazhe esli khodit mozhet tolko odna fishka, nazhimaesh ty sam; esli khodit nechem, khod okonchen.",
   "Vstal na fishku sopernika — ona vozvrashchaetsya domoi. Startovye kletki i kletki so zvezdoi bezopasny: tam nikogo ne byut.",
   "Oboidya dosku, fishka svorachivaet na tvoyu finishnuyu dorozhku. Chtoby doiti do finisha, nuzhno tochnoe chislo.",
   "Shesterka, vzyatie i fishka na finishe dayut eshche odin brosok. Tri shesterki podryad — i khod poteryan."
  ],
  "win": "Obychnyi rezhim: pobezhdaet tot, kto pervym privedet domoi vse chetyre fishki. Rezhim ochkov: pobezhdaet bolshe vsekh ochkov, kogda proidut 15 raundov ili kto-to privedet vse chetyre fishki.",
  "scoring": "Vyberi rezhim pered igroi. V obychnom rezhime ochkov net: v tablitse itogov vidno, skolko fishek privel kazhdyi. V rezhime ochkov kazhdaya proidennaya kletka — 1, vzyatie — 20, fishka na finishe — 30, a kto pervym privedet vse chetyre — bonus 50.",
  "house": [
   [
    "Bloki",
    "Dve fishki odnogo tsveta na odnoi kletke puti obrazuyut blok. Nikto drugoi ne mozhet ego proiti ili na nego vstat, i eti fishki nelzya pobit."
   ],
   [
    "Snachala pobei",
    "Fishka mozhet svernut na finishnuyu dorozhku, tolko kogda ee igrok pobil khotya by odnu chuzhuyu fishku. Do tekh por ona idet eshche krug."
   ],
   [
    "Bystryi start",
    "Kazhdyi nachinaet s odnoi fishkoi uzhe na startovoi kletke, chtoby igra nachalas srazu."
   ],
   [
    "Igra za mesta",
    "Vtroem ili vchetverom igra ne zakanchivaetsya na pobeditele: ostalnye prodolzhayut za vtoroe i trete mesto, a poryadok finisha pokazyvaetsya v kontse."
   ]
  ]
 },
 "carrom": {
  "steps": [
   "Mesto 1 igraet belymi shashkami, mesto 2 — chernymi. Ikh po devyat, plyus krasnaya koroleva v tsentre.",
   "Postav bitok na bazovuyu liniyu polzunkom Bitok, vyberi napravlenie knopkoi Pritsel i silu knopkoi Sila, zatem bei.",
   "Zabil svoyu shashku — besh snova. Esli net, khod perekhodit.",
   "Korolevu nuzhno prikryt. Zabiv ee, zabei svoyu shashku tem zhe udarom ili sleduyushchim, inache ona vernetsya v tsentr.",
   "Esli bitok upal v luzu, eto fol: odna iz tvoikh zabitykh shashek vozvrashchaetsya v tsentr, i khod zakanchivaetsya.",
   "Koroleva dolzhna uiti ranshe, chem chya-to poslednyaya shashka smozhet ostatsya v luze."
  ],
  "win": "Pobezhdaet tot, kto pervym zabet vse svoi shashki pri prikrytoi koroleve. Esli proshlo 80 udarov, pobezhdaet tot, u kogo ostalos menshe shashek.",
  "scoring": "Pobeditel poluchaet 1 ochko za kazhduyu shashku sopernika, ostavshuyusya na doske, i eshche 3, esli koroleva u nego."
 },
 "chess": {
  "steps": [
   "Belye khodyat pervymi, potom igroki khodyat po ocheredi. Kosnis figury, zatem otmechennoi kletki.",
   "Ladya khodit po pryamoi, slon po diagonali, ferz i tak i tak, kon prygaet bukvoi G, a korol khodit na odnu kletku.",
   "Peshka khodit na odnu kletku vpered, pervym khodom — na dve, a bet na odnu kletku po diagonali vpered. Na poslednei gorizontali ona prevrashchaetsya v ferzya, ladyu, slona ili konya.",
   "Rokirovka: esli korol i ladya eshche ne khodili, kletki mezhdu nimi pusty i korol ne prokhodit cherez shakh, korol sdvigaetsya na dve kletki k lade, a ta pereprygivaet cherez nego.",
   "Vzyatie na prokhode: srazu posle togo, kak peshka proshla dve kletki i vstala ryadom s tvoei, ee mozhno vzyat, budto ona proshla odnu.",
   "Korol pod udarom stoit pod shakhom. Svoim khodom ty obyazan uiti ot shakha."
  ],
  "win": "Pobezhdaet mat: korol pod shakhom, i spaseniya net. Nichya — pat (net dopustimykh khodov, no i shakha net), troekratnoe povtorenie pozitsii, po pyatdesyat khodov bez vzyatii i khodov peshkami ili nedostatochno figur dlya mata.",
  "scoring": "Partiya zakanchivaetsya pobedoi ili nichei. V tablitse itogov u pobeditelya 1."
 },
 "snakes-and-ladders": {
  "steps": [
   "Vse nachinayut vne doski, pered kletkoi 1. Kubik brosayut po ocheredi.",
   "Sdvin fishku na vypavshee chislo, sleduya nomeram po doske.",
   "Popal k podnozhiyu lestnitsy — podnimaeshsya naverkh. Popal na golovu zmei — sezzhaesh k ee khvostu.",
   "Shesterka daet eshche odin brosok.",
   "Na kletku 100 nuzhno tochnoe chislo. Esli brosok uvodit dalshe, fishka stoit na meste."
  ],
  "win": "Pobezhdaet tot, kto pervym vstanet rovno na kletku 100.",
  "scoring": "Vo vremya igry ochkov net. V tablitse itogov vidno, do kakoi kletki doshel kazhdyi.",
  "house": [
   [
    "Start s shesterki",
    "Fishka zhdet vne doski, poka ee igrok ne vybrosit 6. Shesterka stavit ee na kletku 1, i etot igrok brosaet snova."
   ],
   [
    "Otskok",
    "Brosok dalshe 100 otskakivaet: s 97 pyaterka dovodit do 100 i otkatyvaet na dve kletki, do 98. Zmei i lestnitsy deistvuyut tam, gde fishka ostanovilas."
   ],
   [
    "Tri shesterki",
    "Tri shesterki podryad vozvrashchayut fishku tuda, gde ona byla v nachale khoda, i khod perekhodit."
   ]
  ]
 },
 "color-clash": {
  "steps": [
   "Kazhdyi poluchaet sem kart. Odna karta nachinaet sbros.",
   "V svoi khod sygrai kartu, sovpadayushchuyu s verkhnei po tsvetu, chislu ili simvolu.",
   "Propusk (⊘) propuskaet sleduyushchego igroka. Razvorot (⇄) menyaet napravlenie; vdvoem on rabotaet kak propusk. +2 zastavlyaet sleduyushchego vzyat dve karty i propustit khod.",
   "Raduzhnuyu kartu mozhno polozhit na lyubuyu, i ty vybiraesh sleduyushchii tsvet. Raduga +4 delaet to zhe, a sleduyushchii beret chetyre karty i propuskaet khod.",
   "Nechem khodit? Vozmi kartu. Esli podkhodit, mozhesh sygrat ee; esli net, pas."
  ],
  "win": "Pobezhdaet pervyi, kto naberet 150 ochkov. Esli za pyat raundov nikto ne doshel, pobezhdaet luchshii schet.",
  "scoring": "Tot, kto izbavilsya ot kart, poluchaet ochki za karty na rukakh u ostalnykh: chisla — po nominalu, karty deistviya — 20, raduzhnye — 50.",
  "house": [
   [
    "Nakoplenie",
    "Priletel +2? Polozhi sverkhu svoi +2 ili Radugu +4, i nakazanie, stav bolshe, ukhodit sleduyushchemu. Na +4 mozhno otvetit tolko drugim +4. Kto ne mozhet (ili ne khochet), beret vse i propuskaet khod."
   ],
   [
    "Tyanut do khoda",
    "Esli nechem khodit, prodolzhai brat karty, poka ne popadetsya podkhodyashchaya, — ee mozhno sygrat."
   ]
  ]
 },
 "call-break": {
  "steps": [
   "Sdayutsya vse 52 karty, po 13 kazhdomu.",
   "Kazhdyi zayavlyaet chislo vzyatok ot 1 do 8, nachinaya s igroka posle sdayushchego.",
   "Pervyi igrok khodit lyuboi kartoi. Po krugu kazhdyi obyazan klast tu zhe mast i, esli mozhet, perebivat luchshuyu kartu.",
   "Esli nuzhnoi masti net, nuzhno polozhit piku i, esli mozhesh, perebit starshuyu piku. Net pik — kladi chto ugodno.",
   "Vzyatku beret starshaya pika; bez pik — starshaya karta masti khoda. Vzyavshii khodit sleduyushchim."
  ],
  "win": "Posle pyati raundov pobezhdaet naibolshaya summa.",
  "scoring": "Vypolnil zayavku — poluchaesh zayavlennoe chislo plyus 0,1 za kazhduyu lishnyuyu vzyatku. Ne vypolnil — teryaesh zayavlennoe chislo."
 },
 "crazy-eights": {
  "steps": [
   "Vdvoem kazhdyi poluchaet sem kart, esli igrokov bolshe — pyat. Odna karta nachinaet sbros.",
   "V svoi khod sygrai kartu, sovpadayushchuyu s verkhnei po masti ili dostoinstvu.",
   "Vosmerku mozhno polozhit na chto ugodno, i ty nazyvaesh mast, kotoraya dolzhna idti dalshe.",
   "Nechem khodit — vozmi kartu. Sygrai ee, esli mozhesh; esli net, pas.",
   "Raund zakanchivaetsya, kogda u kogo-to ne ostaetsya kart."
  ],
  "win": "Posle trekh raundov pobezhdaet igrok s naimenshei summoi shtrafnykh ochkov.",
  "scoring": "Karty, ostavshiesya na ruke, idut v minus: vosmerka — 50, korol, dama ili valet — 10, tuz — 1, lyubaya drugaya karta — po nominalu.",
  "house": [
   [
    "Dvoiki berut dve",
    "Dvoika zastavlyaet sleduyushchego vzyat dve karty i propustit khod, esli tolko on ne polozhit svoyu dvoiku: togda sleduyushchii beret chetyre, i tak dalee."
   ],
   [
    "Valety propuskayut",
    "Valet zastavlyaet sleduyushchego igroka propustit khod."
   ],
   [
    "Tuzy razvorachivayut",
    "Tuz menyaet napravlenie igry. Vdvoem eto znachit, chto ty khodish snova."
   ]
  ]
 },
 "checkers": {
  "steps": [
   "Shashki khodyat na odnu kletku po diagonali vpered na svobodnoe temnoe pole. Kosnis shashki, zatem otmechennoi kletki.",
   "Chtoby bit, pereprygni po diagonali cherez shashku sopernika na svobodnuyu kletku za nei. Pobitaya shashka snimaetsya.",
   "Esli mozhesh bit — obyazan, i esli ta zhe shashka mozhet prygnut snova, ona dolzhna prodolzhat.",
   "Shashka, doshedshaya do poslednego ryada, stanovitsya damkoi, i na etom khod zakanchivaetsya. Damki khodyat i byut po diagonali vpered i nazad."
  ],
  "win": "Ty pobezhdaesh, kogda u sopernika ne ostalos shashek ili dopustimykh khodov. Sorok khodov u kazhdogo bez vzyatii i khodov prostymi shashkami — nichya.",
  "scoring": "Partiya zakanchivaetsya pobedoi ili nichei. V tablitse itogov u pobeditelya 1."
 },
 "four-in-a-row": {
  "steps": [
   "Igroki po ocheredi brosayut po fishke v lyubuyu kolonku, gde est mesto.",
   "Fishka padaet na samoe nizhnee svobodnoe mesto v kolonke.",
   "Soberi liniyu iz chetyrekh svoikh fishek po gorizontali, vertikali ili diagonali — i srazu pobedish."
  ],
  "win": "Pobezhdaet pervaya liniya iz chetyrekh. Esli pole zapolnilos bez linii — nichya.",
  "scoring": "Partiya zakanchivaetsya pobedoi ili nichei. V tablitse itogov u pobeditelya 1."
 },
 "tic-tac-toe": {
  "steps": [
   "Odin igrok — ✕, drugoi — ◯. Pervymi khodyat ✕.",
   "Po ocheredi zanimaite po odnoi svobodnoi kletke.",
   "Tri svoikh znaka v ryad — po gorizontali, vertikali ili diagonali — i pobeda."
  ],
  "win": "Pobezhdaet tot, kto pervym vystroit tri v ryad. Esli vse devyat kletok zapolneny bez ryada — nichya.",
  "scoring": "Partiya zakanchivaetsya pobedoi ili nichei. V tablitse itogov u pobeditelya 1."
 },
 "reversi": {
  "steps": [
   "Igra nachinaetsya s chetyrekh fishek v tsentre. Pervymi khodyat chernye.",
   "Postav fishku na otmechennuyu kletku. Khod dolzhen zazhat khotya by odnu fishku sopernika po pryamoi mezhdu novoi fishkoi i drugoi tvoei.",
   "Vse zazhatye fishki perevorachivayutsya v tvoi tsvet, vo vsekh napravleniyakh srazu.",
   "Esli dopustimogo khoda net, khod propuskaetsya. Igra zakanchivaetsya, kogda ne mozhet khodit ni odin igrok."
  ],
  "win": "Pobezhdaet tot, u kogo v kontse bolshe fishek. Pri ravenstve — nichya.",
  "scoring": "Tvoi schet — chislo fishek tvoego tsveta v kontse igry."
 },
 "dots-and-boxes": {
  "steps": [
   "Po ocheredi provodite liniyu mezhdu dvumya sosednimi tochkami.",
   "Esli tvoya liniya zamknula chetvertuyu storonu kvadrata, on tvoi, i ty obyazan provesti eshche odnu liniyu.",
   "Igra zakanchivaetsya, kogda provedeny vse linii."
  ],
  "win": "Pobezhdaet igrok s naibolshim chislom kvadratov. Esli u vsekh porovnu — nichya.",
  "scoring": "Kazhdyi zamknutyi toboi kvadrat — odno ochko."
 },
 "mancala": {
  "steps": [
   "U kazhdogo igroka shest lunok na svoei storone i ambar na pravom krayu. Kosnis svoei lunki, v kotoroi est semena.",
   "Vse semena iz etoi lunki po odnomu raskladyvayutsya protiv chasovoi strelki v sleduyushchie lunki. V svoi ambar ty kladesh odno, a ambar sopernika propuskaesh.",
   "Esli poslednee semya upalo v tvoi ambar, ty khodish snova.",
   "Esli poslednee semya upalo v pustuyu lunku na tvoei storone, a v lunke naprotiv est semena, ty zabiraesh ikh vse i svoe semya tozhe.",
   "Kogda na odnoi storone ne ostalos semyan, drugoi igrok zabiraet ostavshiesya na svoei storone."
  ],
  "win": "Pobezhdaet tot, u kogo v ambare bolshe semyan. Pri ravenstve — nichya.",
  "scoring": "Kazhdoe semya v tvoem ambare — odno ochko."
 },
 "nine-mens-morris": {
  "steps": [
   "Rasstanovka: po ocheredi stavte po fishke na lyubuyu svobodnuyu tochku, poka kazhdyi ne postavit devyat.",
   "Khody: zatem po ocheredi sdvigaite fishku po linii na sosednyuyu svobodnuyu tochku.",
   "Kazhdyi raz, kogda sobiraesh novyi ryad iz trekh — melnitsu, — snimai odnu fishku sopernika. Fishki v melnitse zashchishcheny, esli tolko vse ego fishki ne stoyat v melnitsakh.",
   "Polet: kogda u tebya ostayutsya tolko tri fishki, oni mogut prygat na lyubuyu svobodnuyu tochku."
  ],
  "win": "Ty pobezhdaesh, kogda u sopernika ostayutsya dve fishki ili net dopustimogo khoda. Pyatdesyat khodov u kazhdogo bez vzyatii — nichya.",
  "scoring": "Partiya zakanchivaetsya pobedoi ili nichei. V tablitse itogov u pobeditelya 1."
 },
 "memory-match": {
  "steps": [
   "V svoi khod kosnis dvukh kartochek, chtoby perevernut ikh. Ikh vidyat vse igroki.",
   "Esli oni sovpali, para tvoya, i ty khodish snova.",
   "Esli net, v nachale khoda sleduyushchego igroka oni perevorachivayutsya obratno, i khod perekhodit."
  ],
  "win": "Kogda vse pary naideny, pobezhdaet tot, u kogo ikh bolshe. Esli u vsekh porovnu — nichya.",
  "scoring": "Kazhdaya para — odno ochko."
 },
 "yacht": {
  "steps": [
   "Bros vse pyat kubikov. Kosnis tekh, chto khochesh ostavit, i perebros ostalnye. Za khod mozhno brosat do trekh raz.",
   "Posle lyubogo broska mozhno ostanovitsya i zapisat ochki v eshche ne ispolzovannuyu kategoriyu.",
   "Ot Edinits do Shesterok zapisyvaetsya summa etogo chisla. Shans — summa vsekh kubikov.",
   "Kare — summa etikh chetyrekh kubikov. Full-khaus (tri odinakovykh i dva odinakovykh) — summa vsekh pyati.",
   "Malyi strit (1–5) i Bolshoi strit (2–6) dayut 30. Yakhta (vse pyat odinakovykh) — 50.",
   "Esli nichego ne podkhodit, kategoriyu vse ravno nuzhno vybrat, dazhe esli v nei budet 0."
  ],
  "win": "Posle dvenadtsati khodov u kazhdogo pobezhdaet naibolshaya summa.",
  "scoring": "Tvoi itog — summa vsekh dvenadtsati kategorii.",
  "house": [
   [
    "Verkhnii bonus",
    "Naberi 63 ili bolshe v Edinitsakh–Shesterkakh vmeste (eto po tri kazhdogo chisla) — i poluchish v kontse 35 dopolnitelnykh ochkov."
   ]
  ]
 },
 "pig": {
  "steps": [
   "V svoi khod bros kubik. Lyuboe chislo ot 2 do 6 pribavlyaetsya k summe etogo khoda.",
   "Brosai snova skolko khochesh ili ostanovis, chtoby polozhit summu khoda v kopilku.",
   "Vypala edinitsa — summa etogo khoda sgoraet, i khod perekhodit."
  ],
  "win": "Doidi do tseli (50 v Bystroi, 100 v Klassike i v Dvukh kubikakh), i u vsekh ostalnykh budet eshche odin poslednii khod, chtoby oboiti tebya. Posle etogo pobezhdaet samaya bolshaya kopilka.",
  "scoring": "Schitayutsya tolko ochki v kopilke."
 },
 "werewolf": {
  "steps": [
   "Kazhdyi taino chitaet svoyu rol: Oboroten, Providitsa, Doktor ili Zhitel.",
   "Noch: oborotni vybirayut, kogo poimat, Providitsa vybiraet igroka, chyu rol uznaet, a Doktor vybiraet, kogo zashchitit.",
   "Utro: derevnya uznaet, kogo poimali nochyu, esli tolko Doktor ego ne zashchitil.",
   "Den: obsudite vse v chate, zatem vse ostavshiesya golosuyut za togo, kogo schitayut oborotnem. Nabravshii bolshe vsekh golosov vybyvaet, i ego rol raskryvaetsya. Pri ravenstve nikto ne vybyvaet.",
   "Snova nastupaet noch, i igra prodolzhaetsya, poka ne pobedit odna iz storon."
  ],
  "win": "Derevnya pobezhdaet, kak tolko vse oborotni izgnany golosovaniem. Oborotni pobezhdayut, kogda ikh stanovitsya stolko zhe, skolko ostalnykh.",
  "scoring": "Pobezhdaet vsya komanda: oborotni vmeste ili Providitsa, Doktor i Zhiteli vmeste. Pri devyati igrokakh i bolshe oborotnei dvoe."
 },
 "who-is-the-spy": {
  "steps": [
   "Kazhdyi igrok taino chitaet svoe slovo.",
   "Po krugu kazhdyi igrok vykladyvaet kartu-podskazku k svoemu slovu.",
   "Prochitaite podskazki, zatem vse taino golosuyut za togo, kogo podozrevayut.",
   "Nabravshii bolshe vsekh golosov obvinen. Pri ravenstve golosov ne obvinen nikto, i shpion ukhodit.",
   "Esli shpiona poimali, u nego est odna popytka ugadat slovo ostalnykh iz chetyrekh variantov."
  ],
  "win": "Posle trekh raundov pobezhdaet igrok s naibolshim chislom ochkov.",
  "scoring": "Ushedshii shpion poluchaet 3. Poimannyi shpion, ugadavshii slovo, poluchaet 2; esli ne ugadal, vse ostalnye poluchayut po 1. Pri vosmi igrokakh i bolshe shpionov dvoe."
 },
 "truth-or-dare": {
  "steps": [
   "V svoi khod vyberi Pravdu ili Deistvie.",
   "Prochitai zadanie, zatem otvet vslukh ili vypolni ego.",
   "Nazhmi Gotovo radi ochka ili Propustit. Za propusk nikogda net shtrafa.",
   "Khod perekhodit k sleduyushchemu igroku."
  ],
  "win": "Pobezhdaet tot, u kogo bolshe vsekh ochkov posle poslednego khoda, khotya glavnoe zdes — smekh.",
  "scoring": "Kazhdaya rasskazannaya pravda i kazhdoe vypolnennoe deistvie prinosyat 1 ochko. Propusk nichego ne stoit."
 },
 "riddle-chits": {
  "steps": [
   "Na zapiske otkryvaetsya zagadka, chtoby vse mogli ee prochitat.",
   "Vyberi otvet, kotoryi schitaesh vernym. Nikto ne vidit tvoi vybor, poka ne otvetyat vse.",
   "Ne uveren? Vozmi podskazku pered otvetom. Ona umenshaet ochki za etu zagadku.",
   "Zatem pokazyvayut otvet i vybor kazhdogo, i otkryvaetsya sleduyushchaya zapiska."
  ],
  "win": "Pobezhdaet igrok s naibolshim chislom ochkov posle poslednei zagadki.",
  "scoring": "Vernyi otvet prinosit 2 ochka, ili 1, esli bral podskazku. Nevernyi otvet ne prinosit nichego."
 },
 "majority-vote": {
  "steps": [
   "Otkryvaetsya vopros s neskolkimi variantami otveta.",
   "Kazhdyi taino vybiraet otvet, kotoryi, po ego mneniyu, vyberet bolshinstvo.",
   "Kogda vse vybrali, itogi pokazyvayutsya stolbikami.",
   "Vse, kto vybral samyi populyarnyi otvet, poluchayut ochko."
  ],
  "win": "Pobezhdaet igrok s naibolshim chislom ochkov posle poslednego voprosa.",
  "scoring": "Odno ochko kazhdyi raz, kogda vybiraesh otvet bolshinstva. Esli dva otveta porovnu lidiruyut, zaschityvayutsya oba."
 },
 "consequences": {
  "steps": [
   "Kazhdyi igrok po ocheredi dobavlyaet strochku dlya pokazannoi chasti, ne vidya predydushchikh.",
   "S druzyami ty pishesh svoi strochki. Za stolom s neznakomtsami vybiraesh iz strochek, napisannykh nami, chtoby nikto ne mog prislat nichego obidnogo.",
   "Sem chastei sostavlyayut istoriyu: kto, vstretil kogo, gde, chto skazal kazhdyi, chto sluchilos i chto skazal mir.",
   "Zatem istoriya razvorachivaetsya, i ee chitayut vse."
  ],
  "win": "Pobezhdayut vse, kogda istoriya smeshit ves stol.",
  "scoring": "Ochkov net: luchshaya istoriya pokoryaet vsyu komnatu."
 }
};
