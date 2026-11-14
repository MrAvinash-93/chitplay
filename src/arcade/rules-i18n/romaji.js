/** Kaku geemu no asobikata, roomaji de. rules.js no eigo to onaji tejun o onaji junban de. (Nihongo moji no ban wa tools/guides/ja.mjs.) */
export default {
  'flying-chit': {
    steps: ['Sutikku o doraggu suru ka, yajirushi kii, W A S D, geemupaddo de, kamikire o jouge sayuu ni ugokashimasu.', 'Tsugi no udewa o tooru ichi ga ringu de hyouji saremasu. Nerai ga au to midori iro ni narimasu. Udewa no chikaku de wa, kamikire ga sono chuushin e yasashiku hikiyoseraremasu.', 'Kin no udewa o kuguru to furyoku ga sukoshi modorimasu. Sukoa no shita no baa de nokori ga wakarimasu.', 'Udewa o tsuzukete kuguru to konbo ni nari, hitotsu ni tsuki ×2, ×3, saidai ×5 ten desu.', 'Udewa o nogasu to konbo ga kiremasu. Senpuuki ya hon no yama ni butsukaru to furyoku o ookiku ushinaimasu.', 'Furyoku ga nakunaru to kamikire wa yuka e kakkuu shite, furaito shuuryou desu.', 'Atarashii reberu wa maikai, ookina kin no udewa kara hajimarimasu. 10 ten to furyoku mantan desu.'],
    win: 'Hitori nara jiko besuto o mezashimasu. Minna de asobu to zenin ga douji ni tobi, ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Udewa wa konbo no kazu dake ten ga hairimasu. Renzoku shite iru aida wa 1, 2, 3, 4, 5 ten. 50, 200, 500, 1000 ten de medaru desu.',
  },
  'tunnel-race': {
    steps: ['Sutikku o sayuu ni doraggu suru ka, A to D, yajirushi kii, geemupaddo de, tonneru no uchigawa o gururi to tobimasu.', 'Akai kabe wa tonneru no ichibu o fusagimasu. Yokete mawarikomimashou. Orenji no kabe wa sukima o hitotsu dake nokoshite zenbu fusagimasu. Sukima o toorinukemashou.', 'Hikaru houseki o atsumemashou. Hitotsu 10 ten desu.', 'Kabe ni fureru to soko de shuuryou desu. Susumu hodo tonneru wa hayaku nari, reberu goto ni atarashii shurui no kabe ga dete kimasu.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Minna de asobu to zenin ga douji ni reesu shi, ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Tonda kyori de ten ga hairi, houseki wa hitotsu 10 ten. 50, 150, 300, 600 ten de medaru desu.',
  },
  'turbo-tunnel': {
    steps: ['Sutikku o sayuu ni doraggu suru ka, A to D, yajirushi kii, geemupaddo de, tonneru no uchigawa o gururi to handoru o kirimasu.', 'Koon, baria, kuruma, torakku, iwa ni fureru to reesu shuuryou desu. Tsugi ni butsukarisou na mono wa, shita ga akaku hikarimasu.', 'Tonneru no dono retsu ni mo, maniau tokoro ni kanarazu toorimichi ga hitotsu arimasu. Romen no usurashita midori no yajirushi ga mejirushi desu.', 'Koin wa 10 ten. Aoi nitoro paddo wa 3 byoukan, kyori no ten o 2 bai ni shimasu. Midori no shiirudo wa ikkai dake butsukatte mo mamotte kuremasu.', 'Oiru de tomari wa shimasen ga, kuruma ga subette sukoshi no aida handoru no kiki ga waruku narimasu.', 'Girigiri de surinukeru to nia misu de, 5 ten no boonasu desu.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Tomodachi to wa zenin ga onaji tonneru de douji ni hashirimasu. Saigo made hashitte iru kuruma ga kachi, zenin kurasshu shitara ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Hashitta kyori (nitoro chuu wa 2 bai), koin ichimai 10 ten, nia misu ikkai 5 ten. 100, 300, 700, 1500 ten de medaru desu.',
  },
  'reaction-time': {
    steps: ["Gamen ga akai aida wa machimasu. Midori ni nattara, doko demo ii no de dekiru dake hayaku tappu shimasu (supeesu, entaa, geemupaddo no botan demo ka).","Midori no mae, mata wa raundo 3 to 4 no aoi feiku de tappu suru to furaingu de, sono raundo wa 0 ten desu.","Taimu wa jibun no sumaho de, gamen ni midori ga deta shunkan kara tappu made o hakaru no de, kaisen ga osokute mo furi ni narimasen. 100 ms miman wa atezuppou to minashimasu.","Zen 5 raundo desu. Maikai zenin no taimu ga hyouji sare, teeburu de ichiban hayai hito ni 50 ten no boonasu ga arimasu."],
    win: "5 raundo go ni tensuu ga ichiban ooi hito no kachi. Hitori nara jiko besuto o koushin shite medaru o atsumemashou.",
    scoring: "Kaku raundo wa 500 kara miri byou tan'i no taimu o hiita tensuu desu (250 ms nara 250 ten). Furaingu to tappu nashi wa 0 ten. 600, 900, 1100, 1300 ten de medaru desu.",
  },
  'stroop-test': {
    steps: ["Kaado ni iro no namae ga irotsuki no inku de hyouji saremasu. Inku no iro no botan o tappu shimasu (botan ni kakareta yajirushi kii demo ka).","Kaado 6 kara wa \"kotoba o erabu\" kaado mo demasu. Sono toki wa kakarete iru kotoba no iro o erabimasu.","Kaku kaado de kazoeru no wa saisho no tappu dake na no de, tashikamete kara tappu shimashou. Kaado 11-15 wa jikan ga mijikaku narimasu.","Taimu wa jibun no sumaho de kaado ga hyouji sareta shunkan kara hakaru no de, tooku no tomodachi to onrain de asonde mo kouhei desu."],
    win: "15 mai no ato, tensuu ga ichiban ooi hito no kachi. Hitori nara jiko besuto o koushin shite medaru o atsumemashou.",
    scoring: "Seikai wa hayai hodo kou tokuten: 2000 kara miri byou no taimu o hiite 10 de watta tensuu de, saitei 10 ten. Fuseikai ya mukaitou wa 0 ten. Tomodachi to nara kaku kaado de ichiban hayai seikai ni 20 ten tsuika. 600, 1200, 1700, 2100 ten de medaru desu.",
  },
  'number-memory': {
    steps: ["Suuji ga sukoshi no aida dake hyouji saremasu. Shita no baa de nokori jikan ga wakarimasu.","Kietara, kiipaddo (mata wa kiiboodo) de suuji o nyuuryoku shite ✓ o oshimasu. Saidai 15 byou desu.","Seikai nara tsugi no suuji wa 1 keta nagaku narimasu. Fuseikai nara haato ga hitotsu heri, mittsu nakunaru to datsuraku desu.","Nyuuryoku wa sorezore no sumaho ni nokori, ✓ de kotae zentai ga okuraremasu. Kotaete iru aida, tomodachi no sumaho ni wa suuji ga okuraremasen."],
    win: "Hitori nara, oboerareru saichou no suuji o mezashimasu. Tomodachi to nara tensuu ga ichiban ooi hito no kachi. Zenin datsuraku suru ka, saigo ni nokotta hito ga sude ni toppu nara shuuryou desu.",
    scoring: "Seikai wa 1 keta ni tsuki 10 ten desu (7 keta nara 70 ten). 70, 150, 250, 400 ten de medaru desu.",
  },
  'word-guess': {
    steps: ["Hinto (Fruit ya Sport nado) to, kara no masu de arawasareta tango ga miemasu. Saisho wa 1 moji dake aite imasu.","1.5 byou goto ni mou 1 moji akimasu. Saigo no 1 moji wa akanai node, kanarazu suiri ga hitsuyou desu.","Moji kiipaddo (mata wa kiiboodo) de tango zentai o nyuuryoku shite ✓ o oshimasu. Hitotsu no tango ni tsuki kotae wa 1 kai dake desu.","Jikan wa sorezore no sumaho de hakari, tomodachi no sumaho ni wa aita moji dake ga okuraremasu. Tango sono mono wa okuraremasen."],
    win: "8 tsu no tango ga owatta toki, tensuu ga ichiban ooi hito no kachi desu.",
    scoring: "Seikai wa 10 ten, sarani okutta jiten de kakurete ita moji hitotsu ni tsuki 10 ten desu. Tomodachi to nara, kaku tango de ichiban hayaku seikai shita hito ni 10 ten tsuika. Fuseikai wa sono tango de 0 ten desu. 80, 160, 240, 320 ten de medaru desu.",
  },
  'fast-typing': {
    steps: ["1 byoukan \"Get ready\" ga dete, sono ato tango ga hyouji saremasu.","Moji kiipaddo (mata wa kiiboodo) de tango o nyuuryoku shite ✓ o oshimasu. Hitotsu no tango ni tsuki 1 kai dake desu.","Tango no shita no baa wa nokori jikan desu. 4 byou + 1 moji ni tsuki 1 byou.","Jikan wa sorezore no sumaho de, tango ga sono gamen ni deta shunkan kara hakarimasu. Tsuushin ga osokute mo supiido wa furi ni narimasen."],
    win: "10 tango ga owatta toki, tensuu ga ichiban ooi hito no kachi desu.",
    scoring: "Seikai shita tango wa \"1 byou atari no mojisuu x 10 ten\" desu. 6 moji o 2 byou nara 30 ten. Seikai nara saitei 5 ten, saikou 60 ten. 1 moji demo machigaeru to sono tango wa 0 ten desu. 120, 200, 280, 360 ten de medaru desu.",
  },
  'bingo': {
    steps: ["Zenin ni, 1-25 ga betsubetsu no junban de naranda kaado ga kubararemasu. Jibun no kaado wa jibun ni shika miemasen.","Jibun no ban ni nattara, mada kooru sarete inai 1-25 no suuji o nyuuryoku shite ✓ o oshimasu. 15 byou inai ni irenai to, jidou de suuji ga kooru saremasu.","Kooru sareta suuji wa, jibun to tomodachi zenin no kaado de kesaremasu.","Tate, yoko, naname ga 1 retsu sorou goto ni, B-I-N-G-O no tsugi no moji ga hikarimasu."],
    win: "Saki ni 5 retsu soroeta hito no kachi desu. Hitotsu no suuji de 2 nin ga douji ni sorottara, retsu ga ooi hito no kachi. Sore demo onaji nara, sono suuji o kooru shita hito no kachi desu.",
    scoring: "Ue no baa ni, sorezore ga BINGO no nanmoji made hikaraseta ka ga demasu. 1 mai no kaado de sorou retsu wa zenbu de 12 hon (yoko 5, tate 5, naname 2) desu.",
  },
  'unblock-puzzle': {
    steps: ["Kaku chuushajou ni wa, rikisha (midori no shatai ni kiiroi yane), mawari no kuruma, rikisha no retsu no migi ni aru geeto ga hyouji saremasu.","Kuruma o yubi ka mausu de doraggu shite zurashimasu. Doraggu shita bun dake, butsukaru tokoro made ugokimasu.","Mata wa yajirushi de kuruma o erabi, Hold o oshite yajirushi de zurashimasu. Mou ichido Hold o osu to hanashimasu.","Rikisha to geeto no aida ni nani mo nakunattara, migi e zurasu to dete ikimasu. Hitotsu no chuushajou ni tsuki 2 fun desu."],
    win: "5 tsu no chuushajou ga owatta toki, tensuu ga ichiban ooi hito no kachi desu.",
    scoring: "Dasshutsu de 50 ten, sukunai tesuu nara sarani saidai 50 ten (saishou tesuu yori 1 te ooi goto ni 5 ten gen). Tomodachi to nara, kaku chuushajou de saisho ni deta hito ni 20 ten tsuika. 200, 300, 400, 470 ten de medaru desu.",
  },
  'hoop-flick': {
    steps: ['Sutikku o pachinko no you ni ushiro e hikimasu. Booru wa hantai houkou e tobimasu. Tsuyoku hiku hodo tsuyoku nagemasu.', 'Sutikku o hanasu to nagemasu. Kiiboodo de wa sayuu no yajirushi de nerai, jouge de tsuyosa, supeesu de nagemasu.', 'Booru o tsugi no gooru ni ue kara otoshimashou.', 'Gooru goto ni 12 byou arimasu. Jikan ga sukunaku naru to akai baa ga shirasemasu.', 'Hazusu to booru wa kooto no soto e ochi, shuuryou desu.', 'Gooru 5 kai goto ni atarashii reberu. Ugoku gooru, tsugi ni kaze, sono tsugi wa ryouhou desu.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Tomodachi to wa, sorezore jibun no hanmen de purei shi, sukoa ga takai hou no kachi desu.',
    scoring: 'Ringu ni atatte haitte 1 ten. Kirei ni hairu to 2 ten de, tsuzukete kirei ni hairu hodo ten ga agari, saidai 5 ten desu. 20, 50, 100, 200 ten de medaru desu.',
  },
  'ghost-hostel': {
    steps: ['Beddo wa maibyou koin o kasegimasu. Ii beddo hodo takusan kasegimasu.', 'Yajirushi ya botan de Beddo, Doa, Senpuuki, Shuuri o erabi, Kounyuu o oshimasu.', 'Doa: tsuyosa ga agari, atarashii tsuyosa made naorimasu. Shuuri: doa no ichibu o naoshi, tsugi no shuuri made suubyou kakarimasu.', 'Yuurei ga doa no mae ni iru aida, senpuuki ga yuurei ni kaze o okurimasu. Juubun dameeji o ataeru to, yuurei wa kaifuku no tame sumi e tadayotte modorimasu.', 'Yuurei wa 30 byou goto ni tsuyoku nari, saigo no 40 byou wa sara ni okorimasu. Doa ga kowaretara tsukamatte datsuraku desu.'],
    win: 'Hinode made heya ni irareta hito wa zenin kachi desu. Yuurei o kanzen ni oiharau to yoru wa hayaku owarimasu. Zenin tsukamattara yuurei no kachi desu.',
    scoring: 'Beddo ga kaseida koin ga sono mama ten ni nari, asa made taeru to 100 ten, yuurei o kanzen ni oiharau to sara ni 150 ten desu.',
  },
  'pin-spin': {
    steps: ['Gamen o tappu suru ka, pin botan, supeesu, entaa, geemupaddo no botan de pin o tobashimasu. Pin wa kanarazu massugu ue e, boodo no shitagawa ni sasarimasu.', 'Sukima o machimashou. Sude ni sasatte iru pin ni ataru to shuuryou desu.', 'Gamen shita ni hyouji sareta pin o zenbu tsukau to reberu kuria desu.', 'Kin no hoshi shiiru ni sasu to 5 ten boonasu desu.', '5 reberu goto ni ookina boodo ga dete, hayasa to muki ga kawarimasu.', 'Dono reberu ni mo seigen jikan (shita no hosoi baa) ga arimasu. Jikan nai ni pin o zenbu tsukaimashou.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Minna de asobu to, sorezore jibun no boodo ni douji ni pin o sashi, ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Sasatta pin wa 1 ten, hoshi wa 5 ten, reberu kuria de reberu bangou no 2 bai no ten ga hairimasu. 25, 60, 120, 250 ten de medaru desu.',
  },
  'bull-fight': {
    steps: ['Sutikku o doraggu suru ka, W A S D, yajirushi kii, geemupaddo de ushi o ugokashimasu.', 'Tosshin o osu to mae e tobidashimasu. Aite no ushi ga daitai shoumen ni ireba, tosshin wa jidou de aite e mukaimasu. Sono ato, baa ni mata CHARGE READY to deru made machimasu.', 'Ushi no shita no wa to yajirushi wa, dare no ushi ka, dochira o muite iru ka o shimeshimasu. Hashi no chikaku de wa hizume ga suna o tsukamu no de, osarenai kagiri soto e wa demasen. Chikazuku to fuchi ga akaku hikari, EDGE! to demasu.', 'Tosshin shite aite ni ataru to, aite o fukitobashite sukoshi no aida furafura ni shimasu.', 'Shiroi sen no soto e oshidasareta hou ga sono raundo no make desu. Shibaraku suru to ringu ga chiisaku nari hajimemasu.'],
    win: 'Saki ni 3 raundo katta hou ga shiai ni kachimasu.',
    scoring: 'Aite no ushi o oshidaseba raundo no kachi desu.',
  },
  'spin-duel': {
    steps: ['3 byou no hassha jikan no aida ni, aite no hou e subayaku suwaipu shimasu. Hassha botan mo tsukaemasu.', 'Nagaku hayai suwaipu hodo koma ni chikara ga norimasu. Hassha wa 1 raundo ikkai desu.', 'Kaunto no ato, koma wa jidou de mawatte butsukariaimasu. Jibun no koma o ariina no naka de mawashi tsuzukemashou.', 'Saigo made mawatte ita koma ga raundo no kachi. Douji ni tomattara hikiwake desu.', 'Saki ni 3 raundo katta hou ga shiai ni kachimasu. Futari tomo 3 raundo hassha shisokonetara, shiai wa hikiwake desu.'],
    win: 'Botto aite ni hitori de, hitotsu no gamen de, chikaku de, mata wa onrain de asobemasu. Asonde koin o atsume, koma to ariina no sutairu o kaihou shimashou.',
    scoring: 'Aite no koma o hajikidasu ka, aite yori nagaku maware ba raundo no kachi. Saki ni 3 raundo katta hou ga shiai ni kachimasu.',
  },
  'pen-fight': {
    steps: ['3 byou inai ni aite no hou e suwaipu shimasu. Hajiku botan mo tsukaemasu.', 'Hayaku suwaipu suru hodo pen ga tsuyoku tobi, muki de susumu michi ga kimarimasu.', 'Pen wa jidou de subette butsukarimasu. Tsukue kara ochitari, butsukatte taoretari shita pen wa sono raundo no make desu.', 'Ryouhou tomo tsukue ni nokottara, saigo no ichi ga ii hou no kachi. Totemo sessen nara hikiwake desu.', 'Saki ni 3 raundo katta hou ga shiai ni kachimasu. Futari tomo shippai shita raundo ga 3 kai aru to hikiwake de owarimasu.'],
    win: 'Botto aite ni hitori de, tomodachi to hitotsu no gamen de, chikaku de, mata wa onrain de asobemasu. Atsumeta koin de pen to tsukue no mitame o kaihou dekimasu. Sutairu wa mitame dake desu.',
    scoring: 'Aite no pen o tsukue kara otosu ka, tsuyoku butsukete taosu ka, aite yori nagaku nokoreba raundo no kachi. Saki ni 3 raundo katta hou ga shiai ni kachimasu.',
  },
  'lapa-chupi': {
    steps: ['Shiai goto ni oni ga kawarimasu. Oni wa kabe no mae de me o tojite machi, sono aida hoka no hito wa 5 byou de kakuremasu.', 'Joisutikku ka yajirushi kii de 3D no asobiba o ugokimasu. Dasshu o oshi tsuzukeru to hayaku hashiremasu ga, 1 byou hodo de ikigire shimasu.', 'Shigemi ya benchi, yuugu no soba de tomatte jitto sureba kakuremasu. Ugoitari, oni o chikazuketari suru to mitsukarimasu.', 'Oni wa zenin mitsukereba kachi. Jikan gire no toki mada kakurete iru hito wa minna de kachi desu.', 'Onrain no heya de wa, kakurete iru hito no ichi wa hoka no pureiyaa ni okuraremasen.'],
    win: 'Konpyuutaa no pureiyaa to, tomodachi to hitotsu no gamen de, chikaku de, mata wa onrain de asobemasu. Aita seki wa botto ga hairimasu.',
    scoring: 'Oni wa mitsuketa hito hitori ni tsuki 1 ten, zenin mitsukereba kachi desu. Jikan gire made kakurekitta hito wa minna de kachi, mitsuketa kazu yori ooku no ten ga hairimasu.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani wa 3 nin ka 4 nin de asobimasu. Oni ga hitori, hoka wa nigeru hito desu. Aita seki wa konpyuutaa ga hairi, oni wa shiai goto ni kawarimasu.', 'Oni wa niwa no mannaka de mittsu kazoe, sono aida ni nigeru hito wa chirabarimasu. Sorekara oikakekko no hajimari desu.', 'Joisutikku ka yajirushi kii de ugokimasu. Dasshu o oshi tsuzukeru to kasoku shimasu ga, 1 byou hodo de ikigire shite shibaraku aruku koto ni narimasu.', 'Oni ni tacchi sareta hito wa kourimasu (baraf!). Jiyuu na hito ga koutta nakama ni tacchi suru to, tokete ugokemasu (pani!).', 'Nigeru hito ga zenin douji ni koottara oni no kachi. Jikan gire no toki hitori demo jiyuu nara nigeru gawa no kachi desu.'],
    win: 'Konpyuutaa no nigeru hito o aite ni hitori de, tomodachi to hitotsu no gamen de, chikaku de, mata wa onrain de asobemasu. Aita seki wa botto ga hairimasu.',
    scoring: 'Chiimu de kachimasu. Oni wa zenin o koorasereba, nigeru gawa wa jikan gire made hitori demo jiyuu de ireba kachi. Katta gawa wa 1 ten desu.',
  },
  'pakda-padi': {
    steps: ['Joisutikku ka yajirushi kii de asobiba o ugokimasu. Dasshu o oshi tsuzukeru to kasoku shimasu ga, 1 byou hodo de ikigire shite shibaraku aruku koto ni narimasu.', 'IT no maaku no hito ga mittsu kazoete kara, hoka no hito o oikakemasu. Chikazuite tacchi sureba oni o watasemasu.', 'Tacchi saretara furimuite betsu no hito o oikakemashou. Sugu tacchi shikaesu no wa nashi. 2 byoukan wa, ima tacchi shite kita hito ni wa tacchi dekimasen.', 'Jikan gire no toki, IT datta jikan ga ichiban mijikai hito no kachi. Hikiwake mo arimasu.'],
    win: 'Konpyuutaa no pureiyaa to, tomodachi to hitotsu no gamen de, chikaku de, mata wa onrain de asobemasu. Aita seki wa botto ga hairimasu.',
    scoring: 'IT datta jikan ga ichiban mijikai hito no kachi. Tacchi no kaisuu wa sukoaboodo ni demasu.',
  },
  'ship-fight': {
    steps: ['Jibun gawa no umi no suki na basho ni fune o ugokashimasu. Taihou wa daitai 1 byou goto ni jidou de aite no fune o uchimasu.', 'Dono fune mo 5 hatsu made taemasu. Iwa wa tama o tomeru no de, tate ni shimashou.', 'Mannaka ni hako ga dete kimasu. Haato wa fune o shuuri shi, taihou no hako wa 3 houkou uchi ga 5 kai tsukaemasu.', 'Raundo ga nagabiku to arashi ga kite, tairyoku no sukunai fune kara kezutte ikimasu.'],
    win: 'Saki ni 3 raundo katta hou ga shiai ni kachimasu.',
    scoring: 'Aite no fune o shizumereba raundo no kachi desu.',
  },
  'road-dash': {
    steps: ['Sayuu (sutikku no doraggu, A to D, yajirushi kii) de shasen o kaemasu.', 'Ushi, ana, basu, hoka no rikisha o yokemashou.', 'Koin o atsumeru to boonasu ten desu.', 'Nagaku hashiru hodo michi wa hayaku nari, daitai 100 ten goto ni atarashii koutsuu no atarashii reberu ni narimasu. Ikkai butsukaru to shuuryou desu.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Minna de asobu to, ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Hashitta kyori de ten ga hairi, koin wa ichimai 5 ten desu.',
  },
  'backyard-rally': {
    steps: ['Raketto o jouge ni ugokashimasu.', 'Booru o uchikaeshimashou. Utsu tabi ni sukoshi zutsu hayaku narimasu.', 'Raketto no hashi de utsu to, booru ga surudoi kakudo de tobimasu.', 'Booru ga jibun no raketto o nukeru to, aite no ten ni narimasu.'],
    win: 'Saki ni 7 ten totta hou no kachi desu.',
    scoring: 'Booru ga aite o nukeru tabi ni 1 ten desu.',
  },
  'hungry-snake': {
    steps: ['Hebi o jouge sayuu ni ugokashimasu. Hebi wa tomarimasen.', 'Oyatsu o taberu to 1 ten de, karada ga nobimasu.', 'Kabe ya jibun no karada, hoka no hebi ni butsukaru to shuuryou desu.', 'Minna de asobu to, saigo made ugoite ita hebi ni 3 ten no boonasu desu.'],
    win: 'Hitori nara jiko besuto o koushin shimashou. Minna de asobu to, ichiban takai sukoa no hito ga kachi desu.',
    scoring: 'Oyatsu hitotsu ni tsuki 1 ten, saigo no ippiki ni 3 ten desu.',
  },
  ludo: {
    steps: ['Jibun no ban ni "Furu" o tappu shimasu. Koma o ie kara sutaato no masu ni dasu ni wa 6 ga hitsuyou desu.', 'Hikatte iru koma ka sono botan o tappu suru to, deta me dake susumimasu. Ugokaseru koma ga hitotsu demo jibun de tappu shimasu. Ugokaseru koma ga nakereba ban wa owari desu.', 'Aite no koma no masu ni tomaru to, sono koma wa ie ni modorimasu. Sutaato no masu to hoshi no masu wa anzen de, toraremasen.', 'Ban o isshuu suru to, koma wa jibun no gooru no retsu ni hairimasu. Gooru ni wa pittari no me ga hitsuyou desu.', '6 o dasu, koma o toru, koma ga gooru suru, no dore demo mou ikkai furemasu. 6 ga 3 kai tsuzuku to ban o ushinaimasu.'],
    win: 'Noomaru moodo: yottsu no koma o saki ni zenbu gooru saseta hito no kachi. Sukoa moodo: 15 raundo owatta toki, mata wa dareka ga yottsu tomo gooru saseta toki, tensuu ga ichiban ooi hito no kachi.',
    scoring: 'Asobu mae ni moodo o erabimasu. Noomaru moodo wa tensuu nashi de, kekka hyou ni kakuji ga gooru saseta koma ga demasu. Sukoa moodo wa 1 masu 1 ten, koma o toru to 20 ten, gooru hitotsu 30 ten, yottsu saisho ni gooru saseru to 50 ten boonasu desu.',
    house: [['Burokku', 'Onaji iro no koma futatsu ga koosu jou no onaji masu ni iru to burokku ni narimasu. Dare mo toorinuketari soko ni tomattari dekizu, sono koma wa toraremasen.'], ['Totte kara gooru', 'Aite no koma o hitotsu ijou toru made, koma wa gooru no retsu ni hairezu, mou isshuu shimasu.'], ['Kuikku sutaato', 'Zenin ga koma hitotsu o sutaato no masu ni oita joutai de hajimaru no de, sugu ni geemu ga ugokimasu.'], ['Jun\'i made tsuzukeru', '3 nin ka 4 nin no toki wa shousha ga kimatte mo owarazu, nokori no hito de 2 i to 3 i o kimemasu. Saigo ni jun\'i ga hyouji saremasu.']],
  },
  carrom: {
    steps: ['1 ban seki wa shiroi koma, 2 ban seki wa kuroi koma o tsukaimasu. Sorezore 9 ko, mannaka ni akai kuiin ga arimasu.', 'Sutoraikaa no suraidaa de beesu rain ni oki, eimu de muki, pawaa de tsuyosa o kimete uchimasu.', 'Jibun no koma o poketto ni iretara mou ichido utemasu. Hairanakereba koutai desu.', 'Kuiin wa kabaa ga hitsuyou desu. Iretara, onaji uchi ka tsugi no uchi de jibun no koma o iremashou. Dekinai to kuiin wa chuuou ni modorimasu.', 'Sutoraikaa ga poketto ni ochitara fauru. Ireta jibun no koma ga hitotsu chuuou ni modori, ban ga owarimasu.', 'Dareka no saigo no koma ga haitta mama ni naru ni wa, saki ni kuiin ga nakunatte iru hitsuyou ga arimasu.'],
    win: 'Kuiin o kabaa shita joutai de jibun no koma o zenbu ireta hito no kachi. 80 uchi o sugitara, nokori no koma ga sukunai hou no kachi desu.',
    scoring: 'Katta hito wa, aite no banjou ni nokotta koma hitotsu ni tsuki 1 ten, kuiin o motte ireba sara ni 3 ten desu.',
  },
  chess: {
    steps: ['Shiro ga saki ni sashi, ato wa kougo ni sashimasu. Koma o tappu shite kara, shirushi no tsuita masu o tappu shimasu.', 'Ruuku wa massugu, bishoppu wa naname, kuiin wa sono ryouhou, naito wa L ji ni tobi, kingu wa 1 masu ugokimasu.', 'Poon wa 1 masu zenshin, saisho no itte dake 2 masu mo ka, toru toki wa naname mae ni 1 masu. Ichiban oku no dan de kuiin, ruuku, bishoppu, naito ni shoukaku shimasu.', 'Kyasuringu: kingu to katahou no ruuku ga mada ugoite orazu, aida no masu ga aite ite, kingu ga chekku o tooranai nara, kingu ga ruuku no hou e 2 masu ugoki, ruuku ga kingu o tobikoemasu.', 'Anpassan: aite no poon ga 2 masu susunde jibun no poon no yoko ni kita chokugo nara, 1 masu susunda mono to shite toremasu.', 'Kougeki sarete iru kingu wa chekku desu. Jibun no te de chekku o hazusanakereba ikemasen.'],
    win: 'Chekkumeito de kachi. Kingu ga chekku sarete nigemichi ga nai joutai desu. Suteirumeito (gouhoushu ga naku chekku demo nai), onaji kyokumen ga 3 kai, 50 te zutsu koma tori mo poon no te mo nai, meito ni tarinai koma shika nai baai wa hikiwake desu.',
    scoring: 'Kachi ka hikiwake de owarimasu. Kekka hyou de wa katta hito ni 1 ga tsukimasu.',
  },
  'snakes-and-ladders': {
    steps: ['Zenin ga masu 1 no temae, ban no soto kara sutaato shi, junban ni saikoro o furimasu.', 'Ban no bangou ni sotte, deta me dake koma o susumemasu.', 'Hashigo no shita ni tomattara ue made nobori, hebi no atama ni tomattara o made suberi ochimasu.', '6 ga detara mou ikkai furemasu.', '100 no masu ni wa pittari no me ga hitsuyou desu. Koete shimau me nara koma wa sono mama desu.'],
    win: 'Saki ni choudo 100 no masu ni tomatta hito no kachi desu.',
    scoring: 'Geemu chuu ni tensuu wa arimasen. Kekka hyou ni wa kakuji ga tsuita masu ga demasu.',
    house: [['6 de sutaato', '6 ga deru made koma wa ban no soto de machimasu. 6 de masu 1 ni okare, sono hito wa mou ikkai furimasu.'], ['Hanekaeri', '100 o koeru me wa hanekaerimasu. 97 kara 5 nara 100 made itte 2 masu modori, 98 desu. Tomatta masu no hebi ya hashigo wa yuukou desu.'], ['6 ga 3 kai', '6 ga 3 kai tsuzuku to, koma wa sono ban no saisho no ichi ni modori, ban wa tsugi no hito e utsurimasu.']],
  },
  'color-clash': {
    steps: ['Zenin ni 7 mai kubari, ichimai o ba ni dashite hajimemasu.', 'Jibun no ban ni, ba no ichiban ue to iro ka suuji ka kigou ga onaji kaado o dashimasu.', 'Sukippu (⊘) wa tsugi no hito o tobashimasu. Ribaasu (⇄) wa junban o gyaku ni shi, futari nara sukippu to onaji desu. +2 wa tsugi no hito ni 2 mai hikase, ban o yasumasemasu.', 'Reinboo wa dono kaado ni mo daseru no de, tsugi no iro o erabemasu. Reinboo +4 mo onaji de, tsugi no hito wa 4 mai hiite ban o yasumimasu.', 'Daseru kaado ga nakereba ichimai hikimasu. Daseru nara dashite yoku, dasenakereba pasu desu.'],
    win: 'Saki ni 150 ten ni todoita hito no kachi. 5 raundo de dare mo todokanakereba, ichiban takai ten no hito no kachi desu.',
    scoring: 'Tefuda o nakushita hito ga, hoka no hito no tefuda ni nokotta kaado no ten o moraimasu. Suuji wa sono kazu, akushon kaado wa 20 ten, reinboo wa 50 ten desu.',
    house: [['Kasane dashi', '+2 o dasaretara, jibun no +2 ka reinboo +4 o kasaneru to, fueta batsu ga tsugi no hito e mawarimasu. +4 ni wa +4 de shika kaesemasen. Kaesenai (kaesanai) hito ga zenbu hiite ban o yasumimasu.'], ['Daseru made hiku', 'Daseru kaado ga nakereba, daseru kaado ga kuru made hiki tsuzuke, kitara dasemasu.']],
  },
  'call-break': {
    steps: ['52 mai o zenbu kubari, hitori 13 mai desu.', 'Kubatta hito no tsugi no hito kara jun ni, toru torikku no kazu o 1 kara 8 de sengen shimasu.', 'Saisho no hito wa suki na kaado o dashimasu. Junban ni, onaji suuto o dasanakereba narazu, daseru nara sore made no ichiban tsuyoi kaado yori tsuyoi mono o dashimasu.', 'Dasareta suuto ga nakereba supeedo o dashi, daseru nara ichiban tsuyoi supeedo yori tsuyoi mono o dashimasu. Supeedo mo nakereba nan demo dasemasu.', 'Ichiban tsuyoi supeedo ga torikku o torimasu. Supeedo ga nakereba, saisho ni dasareta suuto no ichiban tsuyoi kaado ga torimasu. Totta hito ga tsugi ni saki ni dashimasu.'],
    win: '5 raundo go, goukei ga ichiban takai hito no kachi desu.',
    scoring: 'Sengen doori toretara sengen no kazu ga ten ni nari, yobun ni totta torikku hitotsu ni tsuki 0.1 ten tsuika. Torenakattara sengen no kazu o ushinaimasu.',
  },
  'crazy-eights': {
    steps: ['Futari nara 7 mai zutsu, sore ijou nara 5 mai zutsu kubari, ichimai o ba ni dashite hajimemasu.', 'Jibun no ban ni, ba no ichiban ue to suuto ka suuji ga onaji kaado o dashimasu.', '8 wa dono kaado ni mo dasete, tsugi no suuto o shitei dekimasu.', 'Daseru kaado ga nakereba ichimai hikimasu. Daseru nara dashi, dasenakereba pasu desu.', 'Dareka no tefuda ga nakunattara raundo shuuryou desu.'],
    win: '3 raundo go, penarutii no goukei ga ichiban sukunai hito no kachi desu.',
    scoring: 'Tefuda ni nokotta kaado wa mainasu ni narimasu. 8 wa 50, kingu, kuiin, jakku wa 10, eesu wa 1, hoka wa suuji doori desu.',
    house: [['2 de 2 mai hiki', '2 o dasaretara tsugi no hito wa 2 mai hiite ban o yasumimasu. Tadashi jibun mo 2 o daseba, sono tsugi no hito ga 4 mai hiku, to tsuzukimasu.'], ['Jakku de sukippu', 'Jakku o dasu to tsugi no hito wa ban o yasumimasu.'], ['Eesu de ribaasu', 'Eesu de junban ga gyaku ni narimasu. Futari nara mou ichido jibun no ban desu.']],
  },
  checkers: {
    steps: ['Koma wa naname mae no aita kurai masu e 1 masu susumimasu. Koma o tappu shite kara, shirushi no tsuita masu o tappu shimasu.', 'Toru toki wa, aite no koma o naname ni tobikoete, sono mukou no aita masu e. Torareta koma wa ban kara hazuremasu.', 'Toreru toki wa kanarazu tori, onaji koma ga mada toberu nara tsuzukete tobanakereba narimasen.', 'Ichiban oku no dan ni tsuita koma wa kingu ni nari, sono ban wa soko de owarimasu. Kingu wa naname ni zengo dochira ni mo susumi, tobemasu.'],
    win: 'Aite no koma ga nakunaru ka, aite ni gouhoushu ga nakunareba kachi. Otagai 40 te zutsu, koma tori mo futsuu no koma no idou mo nakereba hikiwake desu.',
    scoring: 'Kachi ka hikiwake de owarimasu. Kekka hyou de wa katta hito ni 1 ga tsukimasu.',
  },
  'four-in-a-row': {
    steps: ['Koutai de, aki no aru suki na retsu ni enban o ichimai otoshimasu.', 'Enban wa sono retsu no ichiban shita no aita basho made ochimasu.', 'Jibun no enban o yoko, tate, naname no dore ka de yottsu naraberetara, sono ba de kachi desu.'],
    win: 'Saki ni yottsu narabeta hito no kachi. Ban ga umatte dare mo narabanakereba hikiwake desu.',
    scoring: 'Kachi ka hikiwake de owarimasu. Kekka hyou de wa katta hito ni 1 ga tsukimasu.',
  },
  'tic-tac-toe': {
    steps: ['Hitori ga ✕, mou hitori ga ◯ desu. ✕ ga saki desu.', 'Koutai de aite iru masu o hitotsu torimasu.', 'Jibun no shirushi ga yoko, tate, naname no dore ka de mittsu narabeba kachi desu.'],
    win: 'Saki ni mittsu narabeta hito no kachi. 9 masu ga umatte narabanakereba hikiwake desu.',
    scoring: 'Kachi ka hikiwake de owarimasu. Kekka hyou de wa katta hito ni 1 ga tsukimasu.',
  },
  reversi: {
    steps: ['Mannaka ni yottsu no ishi o oite hajimemasu. Kuro ga saki desu.', 'Shirushi no tsuita masu ni ishi o okimasu. Oita ishi to jibun no hoka no ishi de, aite no ishi o hitotsu ijou massugu hasamanakereba narimasen.', 'Hasanda ishi wa, subete no houkou de ichido ni jibun no iro ni kawarimasu.', 'Okeru basho ga nakereba pasu ni narimasu. Futari tomo okenaku nattara shuuryou desu.'],
    win: 'Saigo ni ishi ga ooi hou no kachi. Onaji kazu nara hikiwake desu.',
    scoring: 'Saigo ni jibun no iro ni natte iru ishi no kazu ga tensuu desu.',
  },
  'dots-and-boxes': {
    steps: ['Koutai de, tonariau futatsu no ten no aida ni sen o ippon hikimasu.', 'Jibun no sen de hako no 4 hen me o tojitara, sono hako wa jibun no mono de, mou ippon hikimasu.', 'Subete no sen ga hikaretara shuuryou desu.'],
    win: 'Hako ga ichiban ooi hito no kachi. Zenin onaji nara hikiwake desu.',
    scoring: 'Tojita hako hitotsu ni tsuki 1 ten desu.',
  },
  mancala: {
    steps: ['Sorezore temae ni muttsu no ana to, migi hashi ni hitotsu no kura ga arimasu. Tane ga haitte iru jibun no ana o tappu shimasu.', 'Sono ana no tane o zenbu, han-tokei mawari ni tsugi no ana e hitotsubu zutsu maite ikimasu. Jibun no kura ni wa hitotsubu ire, aite no kura wa tobashimasu.', 'Saigo no hitotsubu ga jibun no kura ni haittara, mou ikkai desu.', 'Saigo no hitotsubu ga jibun gawa no kara no ana ni hairi, mukai no ana ni tane ga areba, sono tane o zenbu to jibun no hitotsubu o moraemasu.', 'Katahou no tane ga nakunattara, mou katahou wa jibun gawa ni nokotta tane o moraimasu.'],
    win: 'Kura no tane ga ichiban ooi hito no kachi. Onaji kazu nara hikiwake desu.',
    scoring: 'Kura no tane hitotsubu ni tsuki 1 ten desu.',
  },
  'nine-mens-morris': {
    steps: ['Oku: koutai de aite iru ten ni koma o oki, sorezore 9 ko oku made tsuzukemasu.', 'Ugokasu: tsugi ni koutai de, koma o sen ni sotte tonari no aita ten e ugokashimasu.', 'Atarashiku mittsu naraberu (miru) tabi ni, aite no koma o hitotsu torimasu. Miru no naka no koma wa mamoraremasu ga, zenbu ga miru no naka nara toremasu.', 'Tobu: koma ga mittsu dake ni nattara, suki na aita ten e tobasemasu.'],
    win: 'Aite no koma ga futatsu ni naru ka, aite ni gouhoushu ga nakunareba kachi. Otagai 50 te zutsu koma tori ga nakereba hikiwake desu.',
    scoring: 'Kachi ka hikiwake de owarimasu. Kekka hyou de wa katta hito ni 1 ga tsukimasu.',
  },
  'memory-match': {
    steps: ['Jibun no ban ni, kaado o 2 mai tappu shite mekurimasu. Zenin ni miemasu.', 'Sorottara pea o morai, mou ichido mekuremasu.', 'Sorowanakereba, tsugi no hito no ban no hajime ni ura ni modori, ban ga utsurimasu.'],
    win: 'Pea ga zenbu mitsukattara, pea ga ichiban ooi hito no kachi. Zenin onaji nara hikiwake desu.',
    scoring: 'Pea hitokumi ni tsuki 1 ten desu.',
  },
  yacht: {
    steps: ['Saikoro o itsutsu zenbu furimasu. Nokoshitai mono o tappu shite, nokori o furinaoshimasu. Ikkai no ban de 3 kai made furemasu.', 'Dono furi no ato demo, mada tsukatte inai yaku ni ten o kinyuu shite tomeraremasu.', '1 kara 6 no yaku wa sono me no goukei. Choisu wa saikoro zenbu no goukei desu.', 'Foo kaado wa sono yottsu no goukei. Furu hausu (mittsu to futatsu) wa itsutsu zenbu no goukei desu.', 'Sumooru sutoreeto (1–5) to biggu sutoreeto (2–6) wa 30 ten. Yotto (itsutsu zenbu onaji) wa 50 ten desu.', 'Nani mo atehamaranakute mo, 0 ten demo dore ka no yaku o erabanakereba narimasen.'],
    win: 'Sorezore 12 kai no ban ga owattara, goukei ga ichiban takai hito no kachi desu.',
    scoring: '12 no yaku subete no goukei ga jibun no tensuu desu.',
    house: [['Joudan boonasu', '1 kara 6 no goukei ga 63 ten ijou (kaku me mittsu zutsu) nara, saigo ni 35 ten no boonasu desu.']],
  },
  pig: {
    steps: ['Jibun no ban ni saikoro o furimasu. 2 kara 6 no me wa sono ban no goukei ni tasaremasu.', 'Nankai demo furi tsuzukeru ka, tomete sono ban no goukei o chokin shimasu.', '1 ga detara sono ban no goukei wa nakunari, ban ga utsurimasu.'],
    win: 'Mokuhyou (kuikku wa 50, kurashikku to tsuu daisu wa 100) ni todoku to, hoka no zenin ni gyakuten no tame no saigo no ban ga ikkai arimasu. Sono ato, chokin ga ichiban ooi hito no kachi desu.',
    scoring: 'Chokin shita ten dake ga kazoeraremasu.',
  },
  werewolf: {
    steps: ['Zenin ga kossori jibun no yaku o mimasu. Jinrou, uranaishi, isha, murabito no dore ka desu.', 'Yoru: jinrou wa tsukamaeru hito o, uranaishi wa yaku o shiritai hito o, isha wa mamoru hito o erabimasu.', 'Asa: isha ga mamotte inakereba, yoru ni dare ga tsukamatta ka mura ni wakarimasu.', 'Hiru: chatto de hanashiai, nokotte iru zenin de jinrou da to omou hito ni touhyou shimasu. Saita hyou no hito wa taijou shi, yaku ga akasaremasu. Douhyou nara dare mo taijou shimasen.', 'Mata yoru ga kite, dochira ka ga katsu made tsuzukimasu.'],
    win: 'Jinrou o zenin touhyou de oidaseba mura no kachi. Jinrou no kazu ga hoka no hito to onaji ni nareba jinrou no kachi desu.',
    scoring: 'Katta gawa no zenin ga kachi desu. Jinrou doushi, mata wa uranaishi, isha, murabito doushi. 9 nin ijou nara jinrou wa futari desu.',
  },
  'who-is-the-spy': {
    steps: ['Zenin ga kossori jibun no odai no kotoba o mimasu.', 'Junban ni, jibun no kotoba no hinto kaado o ichimai zutsu dashimasu.', 'Hinto o yondara, zenin ga kossori ayashii to omou hito ni touhyou shimasu.', 'Saita hyou no hito ga utagawaremasu. Douhyou nara dare mo utagawarezu, supai wa nigekiri desu.', 'Supai ga tsukamattara, yottsu no sentakushi kara minna no kotoba o ikkai dake ateraremasu.'],
    win: '3 raundo go, tensuu ga ichiban ooi hito no kachi desu.',
    scoring: 'Nigekitta supai wa 3 ten. Tsukamatte mo kotoba o ateta supai wa 2 ten, hazuretara hoka no zenin ni 1 ten. 8 nin ijou nara supai wa futari desu.',
  },
  'truth-or-dare': {
    steps: ['Jibun no ban ni, shinjitsu ka chousen ka o erabimasu.', 'Odai o yonde, koe ni dashite kotaeru ka, yatte mimasu.', '"Dekita" o tappu suru to 1 ten, "Sukippu" mo dekimasu. Sukippu ni batsu wa arimasen.', 'Tsugi no hito no ban ni narimasu.'],
    win: 'Saigo no ban no ato, tensuu ga ichiban ooi hito no kachi. Demo hontou no mokuteki wa minna de warau koto desu.',
    scoring: 'Kotaeta shinjitsu to yatta chousen wa sorezore 1 ten. Sukippu shite mo nani mo ushinaimasen.',
  },
  'riddle-chits': {
    steps: ['Kami ni nazonazo ga hiraki, zenin ga yomimasu.', 'Tadashii to omou kotae o erabimasu. Zenin ga kotaeru made dare no kotae mo miemasen.', 'Jishin ga nakereba, kotaeru mae ni hinto o miraremasu. Sono nazonazo no ten ga sagarimasu.', 'Kotae to zenin no eranda mono ga hyouji sare, tsugi no kami ga hirakimasu.'],
    win: 'Saigo no nazonazo no ato, tensuu ga ichiban ooi hito no kachi desu.',
    scoring: 'Seikai wa 2 ten, hinto o mitara 1 ten. Fuseikai wa 0 ten desu.',
  },
  'majority-vote': {
    steps: ['Ikutsu ka no kotae ga aru shitsumon ga demasu.', 'Zenin ga kossori, ichiban ooku no hito ga erabisou na kotae o erabimasu.', 'Zenin ga erabu to, goukei ga bou gurafu de hyouji saremasu.', 'Ichiban ninki no kotae o eranda hito zenin ni 1 ten desu.'],
    win: 'Saigo no shitsumon no ato, tensuu ga ichiban ooi hito no kachi desu.',
    scoring: 'Tasuuha no kotae o erabu tabi ni 1 ten. Futatsu no kotae ga dousuu de toppu nara, dochira mo kazoemasu.',
  },
  consequences: {
    steps: ['Junban ni, hyouji sareta bubun no bun o hitotsu zutsu tashimasu. Mae no bun wa miemasen.', 'Tomodachi to wa jibun de bun o nyuuryoku shimasu. Shiranai hito to asobu teeburu de wa, watashitachi ga youi shita bun kara erabu no de, dare mo iya na koto o okuremasen.', '7 tsu no bubun de monogatari ga dekimasu. Dare ga, dare to atta, doko de, sorezore nan to itta, nani ga okita, seken wa nan to itta.', 'Saigo ni monogatari ga hirogerare, zenin de yomimasu.'],
    win: 'Monogatari de teeburu zentai ga waraeba, zenin no kachi desu.',
    scoring: 'Tensuu wa arimasen. Ichiban no monogatari ga heya o saraimasu.',
  },
};
