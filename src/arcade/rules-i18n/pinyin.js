/** Mei ge youxi de wanfa, yong pinyin. Buzhou he rules.js de yingwen xiangtong, shunxu ye xiangtong. (Hanzi ban zai tools/guides/zh.mjs.) */
export default {
  'flying-chit': {
    steps: ['Tuodong yaogan, huo yong fangxiangjian, W A S D, shoubing, rang zhitiao xiang shang, xiang xia, xiang zuo, xiang you fei.', 'Yi ge yuanhuan hui xianshi zhitiao jiang cong nali chuanguo xia yi ge shouzhuo, miao zhun shi hui bian cheng lüse. Kaojin shouzhuo shi, zhitiao hui bei qingqing xi xiang zhongxin.', 'Chuanguo jin shouzhuo keyi zhaohui yixie shengli. Fenshu xiafang de tiao xianshi hai sheng duoshao.', 'Lianxu chuanguo shouzhuo hui xingcheng lianji: mei ge ×2, ×3, zuigao ×5 fen.', 'Cuoguo shouzhuo hui daduan lianji. Zhuang shang fengshan huo shu dui hui sunshi henduo shengli.', 'Shengli yong wan shi, zhitiao hui hua luo dao di shang, zhe ci feixing jiu jieshu le.', 'Mei ge xin guanka dou cong yi ge da jin shouzhuo kaishi: 10 fen, shengli jia man.'],
    win: 'Yi ge ren wan shi tiaozhan ziji de zuigao fen. Duo ren yiqi wan shi dajia tongshi fei, fenshu zuigao de ren huosheng.',
    scoring: 'Mei ge shouzhuo an lianji jifen: lianji chixu shi yici de 1, 2, 3, 4, 5 fen. 50, 200, 500, 1000 fen ke huode jiangpai.',
  },
  'tunnel-race': {
    steps: ['Xiang zuo huo xiang you tuodong yaogan, huo yong A he D, fangxiangjian, shoubing, raozhe suidao neibi feixing.', 'Hong qiang dangzhu suidao de yi bufen: cong pangbian rao guoqu. Cheng qiang zhi liu yi ge quekou: cong quekou chuan guoqu.', 'Shouji shanliang de baoshi, mei ke 10 fen.', 'Pengdao qiang jiu jieshu. Yue wang qian suidao yue kuai, mei ge xin guanka dou hui chuxian xin de qiang.'],
    win: 'Yi ge ren wan shi shuaxin ziji de zuigao fen. Duo ren yiqi wan shi dajia tongshi bisai, fenshu zuigao de ren huosheng.',
    scoring: 'An feixing juli defen, mei ke baoshi 10 fen. 50, 150, 300, 600 fen ke huode jiangpai.',
  },
  'turbo-tunnel': {
    steps: ['Xiang zuo huo xiang you tuodong yaogan, huo yong A he D, fangxiangjian, shoubing, raozhe suidao neibi zhuanxiang.', 'Pengdao zhuitong, hulan, qiche, kache huo yanshi, bisai jiu jieshu. Ni de che jijiang zhuang shang de zhang\'aiwu xiafang hui liang qi hong guang.', 'Suidao de mei yi pai dou yiding you yi tiao lai de ji gandao de tonglu. Lumian shang dandan de lüse jiantou hui biao chu ta.', 'Jinbi 10 fen. Lanse danqi ban rang juli fenshu fanbei san miao. Lüse hudun neng ti ni dang yi ci zhuangji.', 'Youwu bu hui rang ni tingxia, dan che hui dahua, yi xiaohuir fangxiangpan fanying bian man.', 'Cabian jingxian tongguo jiao "xian guo", jiangli 5 fen.'],
    win: 'Yi ge ren wan shi shuaxin ziji de zuigao fen. He pengyou yiqi shi, dajia tongshi zai tong yi tiao suidao li bisai: zuihou hai zai pao de che huosheng; ruguo quanbu zhuang che, fenshu zuigao de ren huosheng.',
    scoring: 'An xingshi juli defen (danqi shi fanbei), mei mei jinbi 10 fen, mei ci xian guo 5 fen. 100, 300, 700, 1500 fen ke huode jiangpai.',
  },
  'reaction-time': {
    steps: ["Pingmu shi hongse shi qing dengdai. Bian cheng lüse shi, jinkuai dianji renyi weizhi (ye keyi an kongge, huiche huo shoubing anjian).","Lüse chuxian qian dianji, huo zai di 3, 4 huihe de lanse jia xinhao shi dianji, dou suan qiang pao, zhe yi huihe bu defen.","Ni de shijian zai ni ziji de shouji shang jisuan, cong lüse chuxian zai ni pingmu shang dao ni dianji wei zhi, suoyi wangsu man ye bu hui rang ni bian man. Diyu 100 haomiao suanzuo cai de.","Yigong wu ge huihe. Mei huihe hou dou hui xianshi suoyou ren de shijian, zhuo shang zui kuai de ren jiangli 50 fen."],
    win: "Wu ge huihe hou fenshu zuiduo de ren huosheng. Yi ge ren wan shi shuaxin ziji de jilu, yingqu jiangpai.",
    scoring: "Mei huihe defen shi 500 jianqu ni de haomiao shu: 250 haomiao de 250 fen. Qiang pao he mei dianji de huihe de 0 fen. 600, 900, 1100, 1300 fen ke huode jiangpai.",
  },
  'stroop-test': {
    steps: ["Kapian shang hui chuxian yong caise moshui xie de yanse mingcheng. Dianji moshui yanse duiying de anniu (ye keyi an anniu shang biao de fangxiangjian).","Cong di 6 zhang ka kaishi, you xie ka hui xie \"dianji wenzi\": zhe shi yao an wenzi suo shuo de yanse zuoda.","Mei zhang ka zhi suan ni de di yi ci dianji, suoyi queding le zai dian. Di 11 dao 15 zhang ka shijian geng duan.","Ni de shijian cong kapian chuxian zai ni ziji shouji shang de na yi ke kaishi jisuan, suoyi he yuanfang de pengyou zaixian bisai ye hen gongping."],
    win: "Shiwu zhang ka hou fenshu zuiduo de ren huosheng. Yi ge ren wan shi shuaxin ziji de jilu, yingqu jiangpai.",
    scoring: "Da dui yue kuai fen yue gao: yong 2000 jianqu ni de haomiao shu zai chuyi shi, zuishao 10 fen. Da cuo huo mei da de 0 fen. He pengyou yiqi shi, mei zhang ka zui kuai de zhengque daan zai jia 20 fen. 600, 1200, 1700, 2100 fen ke huode jiangpai.",
  },
  'number-memory': {
    steps: ["Yi ge shuzi hui chuxian pianke. Xiamian de jindutiao xianshi ta hai hui tingliu duojiu.","Shuzi xiaoshi hou, zai shuzi jianpan (huo diannao jianpan) shang shuru bing an ✓. Ni zuiduo you 15 miao.","Da dui: xia yi ge shuzi duo yi wei. Da cuo: shiqu yi ke xin. San ke xin dou mei le jiu chuju.","Mei bu shouji baocun ziji wanjia de shuru, an ✓ shi fasong wanzheng daan; zuoda qijian pengyou de shouji bu hui shoudao zhege shuzi."],
    win: "Yi ge ren wan shi, tiaozhan ni neng jizhu de zui chang shuzi. He pengyou yiqi shi fenshu zuiduo de ren huosheng; suoyou ren chuju, huo zuihou sheng xia de ren yijing lingxian shi, youxi jieshu.",
    scoring: "Da dui mei yi wei de shi fen: 7 wei shu de 70 fen. 70, 150, 250, 400 fen ke huode jiangpai.",
  },
  'word-guess': {
    steps: ["Ni hui kandao yi tiao tishi (liru Fruit huo Sport) he yong kongge biaoshi de danci, kaishi shi zhi lou chu yi ge zimu.","Mei ge yi miao ban zai jiekai yi ge zimu. Zuihou yi ge zimu yongyuan bu hui jiekai, suoyi zong de kao cai.","Zai zimu jianpan (huo diannao jianpan) shang shuru zhengge danci bing an ✓. Mei ge danci zhi neng cai yi ci.","Mei bu shouji wei ziji de wanjia jishi, pengyou de shouji zhi hui shoudao yijing jiekai de zimu, jue bu hui shoudao zhengge danci."],
    win: "Ba ge danci jieshu hou, fenshu zuiduo de ren huosheng.",
    scoring: "Cai dui de 10 fen, tijiao shi mei ge reng yincang de zimu zai jia 10 fen. He pengyou yiqi shi, mei ge danci zui kuai cai dui de ren zai jia 10 fen. Cai cuo ze gai danci bu de fen. 80, 160, 240, 320 fen ke huode jiangpai.",
  },
  'fast-typing': {
    steps: ["Xian xianshi yi miao \"Get ready\", ranhou chuxian danci.","Zai zimu jianpan (huo diannao jianpan) shang shuru danci bing an ✓. Mei ge danci zhi you yi ci jihui.","Danci xiafang de jindutiao shi shengyu shijian: si miao, zai jia mei ge zimu yi miao.","Mei bu shouji cong danci chuxian zai ziji pingmu shang de na yi ke kaishi wei wanjia jishi, suoyi wangsu man ye bu hui yingxiang ni de sudu."],
    win: "Shi ge danci jieshu hou, fenshu zuiduo de ren huosheng.",
    scoring: "Da dui de danci an \"mei miao zimu shu x 10 fen\" jifen: liang miao da wan liu ge zimu de 30 fen. Mei ge da dui de danci zhishao 5 fen, zuiduo 60 fen. Cuo yi ge zimu, zhe ge danci jiu bu de fen. 120, 200, 280, 360 fen ke huode jiangpai.",
  },
  'bingo': {
    steps: ["Mei wei wanjia na dao yi zhang kapian, 1 dao 25 an butong shunxu pailie. Ni de kapian zhiyou ni neng kandao.","Lun dao ni shi, shuru yi ge hai mei bao guo de 1 dao 25 de shuzi bing an ✓. Ni you 15 miao, fouze hui zidong ti ni bao yi ge shu.","Bao chu de shuzi hui zai suoyou ren de kapian shang hua diao, baokuo ni he pengyou de.","Mei tian man yi hang, yi lie huo yi tiao duijiaoxian jiu suan yi tiao xian, bing dianliang B-I-N-G-O de xia yi ge zimu."],
    win: "Zui xian lian cheng wu tiao xian de ren huosheng. Ruguo yi ge shuzi tongshi rang liang zhang kapian wancheng, xian duo de ren huosheng; ruguo rengran xiangtong, bao zhe ge shuzi de ren huosheng.",
    scoring: "Dingbu de tiao xianshi mei wei wanjia yi dianliang BINGO de ji ge zimu. Yi zhang kapian gong you shi'er tiao keneng de xian: wu hang, wu lie he liang tiao duijiaoxian.",
  },
  'unblock-puzzle': {
    steps: ["Mei ge tingchechang dou hui xianshi sanlunche (lüse cheshen, huangse dingpeng), zhouwei de che, yiji ta na yi pai youce de chukou.","Yong shouzhi huo shubiao tuodong cheliang lai huadong ta. Tuo duo yuan jiu zou duo yuan, zhidao pengdao di yi ge zhang'ai.","Ye keyi yong fangxiangjian xuan che, an Hold zhuazhu, zai yong fangxiangjian huadong. Zai an yi ci Hold songkai.","Dang sanlunche he chukou zhijian meiyou renhe dongxi shi, ba ta xiang you hua jiu neng kai chuqu. Mei ge tingchechang you liang fen zhong."],
    win: "Wu ge tingchechang jieshu hou, fenshu zuiduo de ren huosheng.",
    scoring: "Kai chuqu de 50 fen, bushu shao zai jia zuiduo 50 fen: mei bi zuishao bushu duo yi bu shao 5 fen. He pengyou yiqi shi, mei ge tingchechang di yi ge kai chuqu de ren zai jia 20 fen. 200, 300, 400, 470 fen ke huode jiangpai.",
  },
  'hoop-flick': {
    steps: ['Xiang dangong yiyang ba yaogan wang hou la: qiu hui chao fan fangxiang fei. La de yue yuan, tou de yue yongli.', 'Songkai yaogan jiu hui tou chu. Yong jianpan shi, zuo you fangxiangjian miaozhun, shang xia jian tiao lidu, kongge jian toulan.', 'Rang qiu cong shangfang luo jin xia yi ge lankuang.', 'Mei ge lankuang you shi\'er miao: shijian kuai dao shi hong tiao hui tixing ni.', 'Mei tou jin, qiu jiu hui diao chu qiuchang, youxi jieshu.', 'Mei jin wu ge qiu jiu shi xin guanka: xian shi yidong de lankuang, ranhou shi feng, zai ranhou liang zhe dou you.'],
    win: 'Yi ge ren wan shi shuaxin ziji de jilu. He pengyou wan shi, gezi zai ziji de ban chang toulan, fenshu gao de ren huosheng.',
    scoring: 'Pengdao lanquan jin qiu de 1 fen. Kongxin jin qiu de 2 fen, lianxu kongxin jin qiu fenshu geng gao, mei qiu zuiduo 5 fen. 20, 50, 100, 200 fen ke huode jiangpai.',
  },
  'ghost-hostel': {
    steps: ['Ni de chuang mei miao dou hui zhuan jinbi. Chuang yue hao, zhuan de yue duo.', 'Yong fangxiangjian huo anniu xuanze chuang, men, fengshan huo xiuli, ranhou dian goumai.', 'Men: geng jiangu, bing xiufu dao xin de naijiudu. Xiuli: xiu hao men de yi bufen, zhihou yao deng ji miao cai neng zai xiu.', 'Gui zai ni menkou shi, fengshan hui chao ta chui feng. Shanghai gou le, ta jiu hui piao hui jiaoluo xiuxi.', 'Gui mei sanshi miao bian qiang yi ci, zuihou sishi miao geng jia fennu. Men bei dapo, ni jiu bei zhuazhu chuju.'],
    win: 'Richu shi reng zai ziji fangjian li de ren dou huosheng. Ba gui chedi ganzou, yewan jiu hui tiqian jieshu. Ruguo suoyou ren dou bei zhua, gui huosheng.',
    scoring: 'Ni de chuang zhuan dao de mei mei jinbi dou suan fen, cheng dao tian liang zai jia 100, chedi ganzou gui zai jia 150.',
  },
  'pin-spin': {
    steps: ['Dianji pingmu, huo an tuding anniu, kongge, huiche, shoubing anjian fashe tuding. Tuding zongshi zhizhi xiang shang, zha jin banzi dibu.', 'Deng yi ge kongxi: ruguo ni de tuding pengdao yijing zhazhe de tuding, youxi jieshu.', 'Yong wan pingmu xiafang xianshi de suoyou tuding jiu neng guoguan.', 'Zha zhong jinse xingxing tiezhi jiangli 5 fen.', 'Mei di wu guan shi yi kuai da ban: ta hui gaibian sudu he fangxiang.', 'Mei guan dou you shijian xianzhi (dibu de xi tiao): zai shijian yong wan qian yong wan suoyou tuding.'],
    win: 'Yi ge ren wan shi shuaxin ziji de jilu. Duo ren yiqi wan shi, gezi tongshi wang ziji de ban shang zha tuding, fenshu zuigao de ren huosheng.',
    scoring: 'Mei zha wen yi mei tuding 1 fen, mei ke xing 5 fen, guo yi guan de guanka bianhao liang bei de fen. 25, 60, 120, 250 fen ke huode jiangpai.',
  },
  'bull-fight': {
    steps: ['Tuodong yaogan, huo yong W A S D, fangxiangjian, shoubing yidong ni de niu.', 'An chongzhuang xiang qian mengchong. Ruguo duifang de niu dazhi zai ni qianmian, chongzhuang hui zidong miaozhun ta. Ranhou deng tiao shang zaici chuxian CHARGE READY.', 'Mei tou niu jiao xia de yuanquan he jiantou xianshi ta shi shei de, chao nage fangxiang. Kaojin bianyuan shi niu ti hui zhua jin shadi, suoyi zhiyou bei tui cai hui chu jie; li bianyuan hen jin shi bianyuan hui fa hong, bing chuxian EDGE!.', 'Chongzhuang zhong zhuang dao duifang de niu, hui ba ta zhuang fei bing rang ta yun yihuir.', 'Bei tui chu bai xian de yi fang shu diao zhe yi huihe. Guo yi zhenzi, changdi hui kaishi suoxiao.'],
    win: 'Xian ying san huihe de yi fang yingde bisai.',
    scoring: 'Ba duifang de niu tui chuqu jiu yingde zhe yi huihe.',
  },
  'spin-duel': {
    steps: ['Zai san miao fashe shijian nei, chao duishou kuaisu huadong. Ye keyi yong fashe anniu.', 'Hua de yue chang yue kuai, tuoluo de liliang yue da. Mei huihe fashe yi ci.', 'Daoshu jieshu hou, tuoluo hui ziji xuanzhuan, pengzhuang. Rang ni de tuoluo liu zai chang nei bing yizhi zhuan.', 'Zuihou hai zai zhuan de tuoluo yingde zhe yi huihe. Tongshi ting xia jiu shi pingju.', 'Xian ying san huihe de yi fang yingde bisai. Ruguo shuangfang dou cuoguo san huihe, bisai yi pingju jieshu.'],
    win: 'Keyi yi ge ren dui diannao, zai tong yi pingmu, fujin huo zaixian wan. Wan youxi zhuan jinbi, jiesuo tuoluo he changdi de yangshi.',
    scoring: 'Ba duifang tuoluo zhuang chu chang huo bi ta zhuan de geng jiu jiu ying yi huihe. Xian ying san huihe de yi fang yingde bisai.',
  },
  'pen-fight': {
    steps: ['San miao nei chao duishou huadong. Ye keyi yong tan bi anniu.', 'Hua de yue kuai, bi tan de yue yongli; fangxiang jueding ta de luxian.', 'Bi hui ziji huadong, pengzhuang. Diao xia zhuozi huo bei zhuang dao de bi shu diao zhe yi huihe.', 'Ruguo liang zhi bi dou liu zai zhuo shang, zuihou weizhi geng hao de yi fang huosheng; feichang jiejin shi suan pingju.', 'Xian ying san huihe de yi fang yingde bisai. Shuangfang dou shishou de huihe you san ci, bisai yi pingju jieshu.'],
    win: 'Keyi yi ge ren dui diannao, he pengyou zai tong yi pingmu, fujin huo zaixian wan. Yong zhuan dao de jinbi jiesuo bi he zhuozi de waiguan; yangshi zhi shi waiguan.',
    scoring: 'Ba duifang de bi tan xia zhuozi, yong meng zhuang ba ta zhuang dao, huo bi ta jianchi geng jiu, jiu ying yi huihe. Xian ying san huihe de yi fang yingde bisai.',
  },
  'lapa-chupi': {
    steps: ['Mei ju you butong de wanjia lai zhao. Zhao de ren bizhe yan zai qiang bian deng, qita ren you wu miao zhong duo qilai.', 'Yong yaogan huo fangxiangjian zai 3D caochang li zoudong. Anzhu chongci keyi pao de geng kuai, dan dayue yi miao hou jiu hui chuan bu guo qi.', 'Zai guanmu, changyi huo youle sheshi pang tingxia bing baochi bu dong jiu neng duo qilai. Luan dong huo rang zhao de ren kaojin jiu hui baolu.', 'Zhao de ren zhaodao suoyou ren jiu ying. Shijian jieshu shi hai duozhe de ren yiqi huosheng.', 'Zai zaixian fangjian li, duo qilai de wanjia weizhi bu hui fasong gei qita wanjia.'],
    win: 'Keyi he diannao wanjia, he pengyou zai tong yi pingmu, fujin huo zaixian wan. Kongwei you diannao bu shang.',
    scoring: 'Zhao de ren mei zhaodao yi ren de 1 fen, quanbu zhaodao jiu ying. Shijian jieshu shi hai duozhe de ren yiqi huosheng, defen bi renhe zhaodao renshu dou duo.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani xuyao san dao si ren: yi ge zhua ren de he ji ge taopao de. Kongwei you diannao bu shang, mei ju zhua ren de dou hui huan.', 'Zhua ren de zai yuanzi zhongjian shu dao san, taopao de sisan pao kai. Ranhou zhuizhu kaishi.', 'Yong yaogan huo fangxiangjian yidong. Anzhu chongci keyi jiasu; dayue yi miao hou jiu hui chuan bu guo qi, yao zou yihuir.', 'Bei zhua ren de pengdao, jiu hui dong zhu (baraf!). Ziyou de ren pengdao bei dong zhu de huoban, jiu neng ba ta jiedong (pani!).', 'Suoyou taopao de ren tongshi bei dong zhu, zhua ren de huosheng. Shijian jieshu shi zhiyao hai you yi ren ziyou, taopao de yi fang huosheng.'],
    win: 'Keyi yi ge ren dui diannao taopaozhe, he pengyou zai tong yi pingmu, fujin huo zaixian wan. Kongwei you diannao bu shang.',
    scoring: 'An duiwu huosheng: zhua ren de dong zhu suoyou ren jiu ying, taopao de jianchi dao shijian jieshu hai you yi ren ziyou jiu ying. Huosheng fang ge de 1 fen.',
  },
  'pakda-padi': {
    steps: ['Yong yaogan huo fangxiangjian zai caochang li yidong. Anzhu chongci keyi jiasu; dayue yi miao hou jiu hui chuan bu guo qi, yao zou yihuir.', 'Biaozhe IT de wanjia shu dao san, ranhou qu zhui qita ren. Kao de gou jin jiu neng ba "gui" chuan chuqu.', 'Bei zhua dao hou, zhuanshen qu zhui bieren. Bu neng mashang zhua huiqu: liang miao nei bu neng zhua ganggang zhua ni de ren.', 'Shijian jieshu shi, dang IT shijian zuiduan de ren huosheng. Ye keneng pingju.'],
    win: 'Keyi he diannao wanjia, he pengyou zai tong yi pingmu, fujin huo zaixian wan. Kongwei you diannao bu shang.',
    scoring: 'Dang IT shijian zuiduan de ren huosheng. Zhua ren de cishu hui xianshi zai jifenban shang.',
  },
  'ship-fight': {
    steps: ['Zai ni na yi ban haimian shang suiyi yidong chuan. Dapao dayue mei miao zidong chao duifang de chuan kaihuo.', 'Mei sou chuan neng chengshou wu ci mingzhong. Jiaoshi neng dangzhu paodan, keyi na lai dang yanhu.', 'Zhongjian hui chuxian xiangzi: aixin xiuli ni de chuan, dapao xiang gei ni wu ci san lianfa.', 'Ruguo yi huihe tuo de tai jiu, baofengyu hui xueruo chuanzhi, cong xue shao de na sou kaishi.'],
    win: 'Xian ying san huihe de yi fang yingde bisai.',
    scoring: 'Jichen duifang de chuan jiu yingde zhe yi huihe.',
  },
  'road-dash': {
    steps: ['An zuo huo you (tuodong yaogan, A he D huo fangxiangjian) huan chedao.', 'Duo kai niu, keng\'wa, gongjiaoche he qita sanlunche.', 'Shouji jinbi huode ewai fenshu.', 'Jianchi yue jiu lu yue kuai, dayue mei 100 fen jinru xin guanka, chuxian xin de cheliu. Zhuang yi ci jiu jieshu.'],
    win: 'Yi ge ren wan shi shuaxin ziji de zuigao fen. Duo ren yiqi wan shi, fenshu zuigao de ren huosheng.',
    scoring: 'An xingshi juli defen, mei mei jinbi 5 fen.',
  },
  'backyard-rally': {
    steps: ['Shang xia yidong ni de qiupai.', 'Ba qiu da huiqu. Mei da yi ci, qiu jiu kuai yidian.', 'Yong qiupai bianyuan da, qiu hui yi geng da de jiaodu fei chu.', 'Qiu yueguo ni de qiupai, duifang jiu defen.'],
    win: 'Xian de qi fen de ren huosheng.',
    scoring: 'Qiu mei yueguo duifang yi ci de 1 fen.',
  },
  'hungry-snake': {
    steps: ['Rang ni de she xiang shang, xiang xia, xiang zuo huo xiang you zou. Ta cong bu ting xia.', 'Chi yi fen dianxin de 1 fen, shenti bian chang.', 'Zhuang dao qiang, ziji huo bie de she, youxi jieshu.', 'Duo ren yiqi wan shi, zuihou hai zai dong de she jiangli 3 fen.'],
    win: 'Yi ge ren wan shi shuaxin ziji de zuigao fen. Duo ren yiqi wan shi, fenshu zuigao de ren huosheng.',
    scoring: 'Mei fen dianxin 1 fen, zuihou sheng xia de zai jia 3 fen.',
  },
  ludo: {
    steps: ['Lun dao ni shi dian "zhi tou". Yao zhi chu liu dian cai neng ba qizi cong jia li fang dao qidian ge.', 'Dianji faguang de qizi huo ta de anniu, an zhi chu de dianshu qianjin. Jishi zhiyou yi mei qizi neng zou, ye yao ni ziji dian; meiyou qizi neng zou, zhe yi lun jiu jieshu.', 'Ting zai duishou qizi de gezi shang, ta jiu hui jia. Qidian ge he xingxing ge shi anquan ge, zai nali bu hui bei chi.', 'Rao qipan yi quan hou, qizi hui guai jin ni ziji de zhongdian lu. Daoda zhongdian xuyao zhenghao de dianshu.', 'Zhi chu liu dian, chi diao qizi, qizi daoda zhongdian, dou neng zai zhi yi ci. Lianxu san ge liu dian hui shiqu zhe yi lun.'],
    win: 'Putong moshi: zuixian rang si mei qizi quanbu dao jia de ren huosheng. Jifen moshi: 15 huihe jieshu huo you ren rang si mei qizi quanbu dao jia shi, fenshu zuiduo de ren huosheng.',
    scoring: 'Kaishi qian xuanze moshi. Putong moshi bu jifen: jieguo biao xianshi mei ren song hui jia de qizi. Jifen moshi zhong mei zou yi ge 1 fen, chi diao yi mei 20 fen, yi mei dao jia 30 fen, zuixian si mei quanbu dao jia jiangli 50 fen.',
    house: [['Luzhang', 'Tong se liang mei qizi zai luxian de tong yi ge shang hui xingcheng luzhang. Bieren ji bu neng chuanguo ye bu neng ting zai nali, zhe liang mei qizi ye bu hui bei chi.'], ['Chi zi cai neng hui jia', 'Zhiyou chi diao zhishao yi mei duishou qizi hou, qizi cai neng guai jin zhongdian lu. Zai na zhiqian ta hui zai rao yi quan.'], ['Kuaisu kaiju', 'Mei ren kaishi shi jiu you yi mei qizi zai qidian ge shang, youxi mashang jiu neng dong qilai.'], ['Jixu zheng mingci', 'San ren huo si ren shi, chuxian guanjun hou youxi bu hui ting: qiyu ren jixu zheng di er, di san ming, zuihou xianshi wansai shunxu.']],
  },
  carrom: {
    steps: ['Yi hao zuowei yong bai zi, er hao zuowei yong hei zi. Ge jiu mei, zhongjian hai you yi mei hongse huanghou.', 'Yong jiqiuzi huakuai ba jiqiuzi fang zai dixian shang, yong miaozhun xuan fangxiang, yong lidu xuan liliang, ranhou jida.', 'Da jin ziji de zi jiu zai da yi ci. Mei da jin jiu huan ren.', 'Huanghou bixu "yanhu". Da jin huanghou hou, yao zai tong yi gan huo xia yi gan da jin yi mei ziji de zi, fouze huanghou hui dao zhongjian.', 'Jiqiuzi diao jin daikou suan fangui: ni yi da jin de yi mei zi hui dao zhongjian, zhe yi lun jieshu.', 'Zai renhe ren de zuihou yi mei zi liu zai dai li zhiqian, huanghou bixu xian bei da diao.'],
    win: 'Zai huanghou yi bei yanhu de qingkuang xia, zuixian da jin ziji suoyou zi de ren huosheng. Chaoguo 80 gan shi, sheng zi jiao shao de ren huosheng.',
    scoring: 'Huoshengzhe an duishou liu zai pan shang de mei mei zi de 1 fen, nadao huanghou zai jia 3 fen.',
  },
  chess: {
    steps: ['Bai fang xian zou, zhihou shuangfang lunliu zou. Dian yi ge qizi, zai dian yi ge biao chu de gezi.', 'Che zou zhixian, xiang zou xiexian, hou liang zhong dou keyi, ma zou "ri" zi, wang zou yi ge.', 'Bing xiang qian zou yi ge, di yi bu ke zou liang ge, chi zi shi xie xiang qian yi ge. Zou dao zuihou yi hang shi shengbian wei hou, che, xiang huo ma.', 'Wang che yiwei: wang he yi zhi che dou mei dong guo, zhongjian de gezi shi kong de, wang bu jingguo bei jiangjun de gezi shi, wang xiang che de fangxiang zou liang ge, che tiao dao wang de ling yi bian.', 'Chi guolu bing: duifang de bing gang zou liang ge ting zai ni de bing pangbian shi, ni keyi xiang ta zhi zou le yi ge nayang chi diao ta.', 'Wang bei gongji jiu shi bei jiangjun. Lun dao ni shi bixu jiechu jiangjun.'],
    win: 'Jiangsi huosheng: wang bei jiangjun qie wu lu ke tao. Bihe (wu hefa zhaofa qie wei bei jiangjun), tong yi jumian chuxian san ci, shuangfang ge wushi bu meiyou chi zi ye meiyou zou bing, huo sheng xia de zili bu gou jiangsi, dou suan heqi.',
    scoring: 'Yi ju yi sheng huo he jieshu. Jieguo biao zhong huoshengzhe ji 1.',
  },
  'snakes-and-ladders': {
    steps: ['Suoyou ren cong qipan wai, di 1 ge zhiqian chufa, lunliu zhi touzi.', 'An qipan shang de shuzi shunxu, ba qizi xiang qian zou zhi chu de dianshu.', 'Ting zai tizi dibu jiu pa dao ding shang, ting zai she tou shang jiu hua dao she wei.', 'Zhi chu liu dian keyi zai zhi yi ci.', 'Di 100 ge xuyao zhenghao de dianshu. Ruguo dianshu hui chaoguo, qizi yuandi bu dong.'],
    win: 'Zuixian zhenghao ting zai di 100 ge de ren huosheng.',
    scoring: 'Youxi zhong bu jifen. Jieguo biao xianshi mei ren daoda de gezi.',
    house: [['Liu dian chufa', 'Qizi zai qipan wai deng, zhidao zhi chu 6. 6 dian ba ta fang dao di 1 ge, zhege ren zai zhi yi ci.'], ['Fantan', 'Chaoguo 100 de dianshu hui fantan: cong 97 zhi chu 5, xian dao 100 zai tui hui liang ge, ting zai 98. Ting xia de gezi shang de she he tizi zhaochang youxiao.'], ['San ge liu', 'Lianxu san ge liu dian hui rang qizi hui dao zhe yi lun kaishi shi de weizhi, bing lun dao xia yi ge ren.']],
  },
  'color-clash': {
    steps: ['Mei ren fa qi zhang pai, fan kai yi zhang zuowei qishi.', 'Lun dao ni shi, chu yi zhang yu zui shangmian na zhang yanse, shuzi huo fuhao xiangtong de pai.', 'Tiaoguo (⊘) tiaoguo xia yi ge ren. Fanzhuan (⇄) gaibian fangxiang; liang ren shi dengtong tiaoguo. +2 rang xia yi ge ren mo liang zhang bing ting yi lun.', 'Caihong pai keyi chu zai renhe pai shang, you ni xuan xia yi ge yanse. Caihong +4 ye yiyang, xia yi ge ren mo si zhang bing ting yi lun.', 'Meiyou neng chu de pai? Mo yi zhang. Heshi jiu keyi chu, bu heshi jiu guo.'],
    win: 'Zuixian dadao 150 fen de ren huosheng. Wu ju nei mei ren dadao, ze fenshu zuigao de ren huosheng.',
    scoring: 'Chu wan shoupai de ren dedao qita ren shou li sheng pai de fenshu: shuzi pai an dianshu, gongneng pai 20 fen, caihong pai 50 fen.',
    house: [['Diejia', 'Bei +2 da zhong? Zai shangmian chu ni ziji de +2 huo caihong +4, chengfa bian da bing chuan gei xia yi ge ren. +4 zhi neng yong ling yi zhang +4 huiying. Chu bu liao (huo bu xiang chu) de ren mo xia quanbu bing ting yi lun.'], ['Mo dao neng chu wei zhi', 'Meiyou neng chu de pai shi, yizhi mo dao heshi de pai, ranhou keyi chu.']],
  },
  'call-break': {
    steps: ['52 zhang pai quanbu fa wan, mei ren 13 zhang.', 'Cong fapairen de xiajia kaishi, mei ren yici jiao chu yao ying de dun shu, 1 dao 8.', 'Di yi ge ren chu renyi yi zhang pai. Yici lunliu, mei ren bixu gen tong huase, neng ya guo dangqian zui da de pai jiu bixu ya.', 'Meiyou gai huase shi bixu chu heitao, neng ya guo zui da de heitao jiu bixu ya. Heitao ye meiyou, jiu suibian chu.', 'Zui da de heitao ying zhe yi dun; meiyou heitao shi, shou chu huase zhong zui da de pai ying. Ying de ren xia yi dun xian chu.'],
    win: 'Wu ju hou zongfen zuigao de ren huosheng.',
    scoring: 'Wancheng jiao pai jiu de jiao de fenshu, mei duo ying yi dun jia 0.1 fen. Mei wancheng jiu kou diao jiao de fenshu.',
  },
  'crazy-eights': {
    steps: ['Liang ren shi mei ren qi zhang, duo ren shi mei ren wu zhang, fan kai yi zhang zuowei qishi.', 'Lun dao ni shi, chu yi zhang yu zui shangmian na zhang huase huo dianshu xiangtong de pai.', '8 keyi chu zai renhe pai shang, you ni zhiding jiexialai de huase.', 'Mei pai ke chu jiu mo yi zhang. Neng chu jiu chu, bu neng chu jiu guo.', 'You ren chu wan shoupai, zhe yi ju jiu jieshu.'],
    win: 'San ju hou fafen zongshu zuishao de ren huosheng.',
    scoring: 'Liu zai shou li de pai suan fafen: 8 suan 50, K, Q, J suan 10, A suan 1, qita pai an dianshu.',
    house: [['2 mo liang zhang', 'Chu 2 rang xia yi ge ren mo liang zhang bing ting yi lun, chufei ta ye chu 2: na jiu you zai xia yi ge ren mo si zhang, yici leitui.'], ['J tiaoguo', 'Chu J rang xia yi ge ren ting yi lun.'], ['A fanzhuan', 'Chu A rang chu pai fangxiang fanzhuan. Liang ren shi jiu shi ni zai chu yi ci.']],
  },
  checkers: {
    steps: ['Qizi xiezhe xiang qian zou yi ge, zou dao kongzhe de shense ge. Dian yi ge qizi, zai dian yi ge biao chu de gezi.', 'Chi zi shi, xiezhe tiao guo duifang de qizi, luo dao ta houmian de kong ge. Bei chi de qizi na diao.', 'Neng chi jiu bixu chi, ruguo tong yi mei qizi hai neng jixu tiao, jiu bixu jixu tiao.', 'Zou dao zuihou yi hang de qizi sheng wei wang, zhe yi lun jiu ci jieshu. Wang keyi xiezhe xiang qian huo xiang hou zou he tiao.'],
    win: 'Duifang meiyou qizi huo meiyou hefa zhaofa shi ni huosheng. Shuangfang ge sishi bu meiyou chi zi ye meiyou putong qizi yidong, jiu shi heqi.',
    scoring: 'Yi ju yi sheng huo he jieshu. Jieguo biao zhong huoshengzhe ji 1.',
  },
  'four-in-a-row': {
    steps: ['Lunliu ba yi mei qizi tou jin renhe hai you kongwei de yi lie.', 'Qizi hui luo dao na yi lie zui xiamian de kongwei.', 'Ba si mei ziji de qizi lian cheng heng, shu huo xie de yi tiao xian, like huosheng.'],
    win: 'Zuixian lian cheng si zi de ren huosheng. Qipan xia man reng meiyou lianxian jiu shi pingju.',
    scoring: 'Yi ju yi sheng huo ping jieshu. Jieguo biao zhong huoshengzhe ji 1.',
  },
  'tic-tac-toe': {
    steps: ['Yi ge ren shi ✕, ling yi ge shi ◯. ✕ xian zou.', 'Lunliu zhan yi ge kong ge.', 'Ziji de san ge jihao lian cheng heng, shu huo xie xian jiu huosheng.'],
    win: 'Zuixian lian cheng san zi de ren huosheng. Jiu ge xia man meiyou lianxian jiu shi pingju.',
    scoring: 'Yi ju yi sheng huo ping jieshu. Jieguo biao zhong huoshengzhe ji 1.',
  },
  reversi: {
    steps: ['Kaiju zhongjian fang si mei qizi. Hei fang xian zou.', 'Ba qizi fang zai biao chu de gezi shang. Zhe yi bu bixu yong xin qizi he ni de ling yi mei qizi, yan zhixian jiazhu zhishao yi mei duifang qizi.', 'Bei jiazhu de qizi zai suoyou fangxiang shang tongshi fan cheng ni de yanse.', 'Meiyou hefa zhaofa jiu tiaoguo zhe yi lun. Shuangfang dou bu neng zou shi youxi jieshu.'],
    win: 'Zuihou qizi duo de yi fang huosheng. Shuliang xiangtong jiu shi pingju.',
    scoring: 'Zuihou ni yanse de qizi shu jiu shi ni de fenshu.',
  },
  'dots-and-boxes': {
    steps: ['Lunliu zai liang ge xianglin de dian zhijian hua yi tiao xian.', 'Ruguo ni de xian feng zhu le yi ge gezi de di si tiao bian, zhege gezi gui ni, bingqie ni bixu zai hua yi tiao.', 'Suoyou xian dou hua wan shi youxi jieshu.'],
    win: 'Gezi zuiduo de ren huosheng. Ruguo dajia yiyang duo jiu shi pingju.',
    scoring: 'Ni feng zhu de mei ge gezi 1 fen.',
  },
  mancala: {
    steps: ['Mei ren ziji zhebian you liu ge keng, you duan you yi ge cang. Dian yi ge zhuang you zhongzi de ziji de keng.', 'Ba zhege keng li de suoyou zhongzi, ni shizhen yi li yi li bo dao houmian de keng li. Jingguo ziji de cang shi fang yi li, tiaoguo duifang de cang.', 'Zuihou yi li luo jin ziji de cang, jiu zai zou yi ci.', 'Zuihou yi li luo jin ziji zhebian de kong keng, er duimian de keng li you zhongzi, jiu ba naxie zhongzi liantong ziji zhe yi li quanbu na zou.', 'Yi fang de zhongzi quanbu meiyou shi, ling yi fang na zou ziji zhebian sheng xia de zhongzi.'],
    win: 'Cang li zhongzi zuiduo de ren huosheng. Shuliang xiangtong jiu shi pingju.',
    scoring: 'Cang li mei li zhongzi 1 fen.',
  },
  'nine-mens-morris': {
    steps: ['Fang zi: lunliu ba qizi fang zai renyi kong dian shang, zhidao mei ren fang man jiu mei.', 'Zou zi: zhihou lunliu ba yi mei qizi yan xian yi dao xianglin de kong dian.', 'Meidang ni xin lian cheng yi tiao san zi xian (mo), jiu na diao duifang yi mei qizi. Mo li de qizi shou baohu, chufei duifang suoyou qizi dou zai mo li.', 'Fei zi: zhi sheng san mei qizi shi, ni de qizi keyi fei dao renyi kong dian.'],
    win: 'Duifang zhi sheng liang mei qizi huo meiyou hefa zhaofa shi ni huosheng. Shuangfang ge wushi bu meiyou chi zi jiu shi heqi.',
    scoring: 'Yi ju yi sheng huo he jieshu. Jieguo biao zhong huoshengzhe ji 1.',
  },
  'memory-match': {
    steps: ['Lun dao ni shi, dian liang zhang pai fan kai. Suoyou wanjia dou kan de dao.', 'Ruguo peidui, ni na zou zhe yi dui bing zai fan yi ci.', 'Ruguo bu peidui, xia yi wei wanjia kaishi shi tamen hui fan huiqu, lun dao xia yi ge ren.'],
    win: 'Quanbu peidui zhaodao hou, peidui zuiduo de ren huosheng. Dajia yiyang duo jiu shi pingju.',
    scoring: 'Mei yi dui 1 fen.',
  },
  yacht: {
    steps: ['Zhi quanbu wu ke touzi. Dian ni xiang liu xia de, chong zhi qiyu de. Mei lun zuiduo zhi san ci.', 'Renhe yi ci zhi wan hou, dou keyi ting xia, ba fenshu tian jin yi ge hai mei yong guo de xiangmu.', 'Yi dian dao liu dian xiangmu ji gai dianshu de zonghe. Quanxuan ji suoyou touzi de zonghe.', 'Si tiao ji na si ke touzi de zonghe. Hulu (san ge xiangtong jia liang ge xiangtong) ji wu ke de zonghe.', 'Xiao shun (1–5) he da shun (2–6) ji 30 fen. Kuaiting (wu ke dou xiangtong) ji 50 fen.', 'Shenme dou bu heshi shi, ye bixu xuan yi ge xiangmu, napa ji 0 fen.'],
    win: 'Mei ren zou wan shi\'er lun hou, zongfen zuigao de ren huosheng.',
    scoring: 'Ni de zongfen shi quanbu shi\'er ge xiangmu de he.',
    house: [['Shang ban qu jiangli', 'Yi dian dao liu dian xiangmu heji dadao 63 fen yishang (xiangdang yu mei ge dianshu san ke), zuihou jiangli 35 fen.']],
  },
  pig: {
    steps: ['Lun dao ni shi zhi touzi. 2 dao 6 dian dou jia dao zhe yi lun de leiji li.', 'Xiang zhi duoshao ci dou xing, ye keyi ting xia, ba zhe yi lun de leiji cun qilai.', 'Zhi chu 1 dian, zhe yi lun de leiji jiu mei le, lun dao xia yi ge ren.'],
    win: 'Dadao mubiao (kuaisu 50, jingdian he shuang tou 100) hou, qita suoyou ren hai you zuihou yi lun jihui chaoguo ni. Zhihou cun fen zuiduo de ren huosheng.',
    scoring: 'Zhiyou cun qilai de fen cai suan.',
  },
  werewolf: {
    steps: ['Mei ren toutou kan ziji de shenfen: langren, yuyanjia, yisheng huo cunmin.', 'Yewan: langren xuan yi ge yao zhua de ren, yuyanjia xuan yi ge ren chakan shenfen, yisheng xuan yi ge ren baohu.', 'Zaochen: ruguo yisheng meiyou baohu, cunzi hui zhidao ye li shei bei zhua le.', 'Baitian: zai liaotian li taolun, ranhou suoyou hai zai chang de ren toupiao gei ziji renwei shi langren de ren. De piao zuiduo de ren chuju bing gongkai shenfen. Ping piao ze mei ren chuju.', 'Yewan zaici jianglin, youxi yizhi jinxing dao yi fang huosheng.'],
    win: 'Suoyou langren dou bei toupiao chuju, cunmin huosheng. Langren shuliang he qita ren yiyang duo shi, langren huosheng.',
    scoring: 'Huosheng yi fang de suoyou ren dou huosheng: langren yiqi, huo yuyanjia, yisheng he cunmin yiqi. Jiu ren ji yishang shi you liang ge langren.',
  },
  'who-is-the-spy': {
    steps: ['Mei wei wanjia toutou kan ziji de ci.', 'Yici lunliu, mei ren wei ziji de ci chu yi zhang tishi ka.', 'Kan wan tishi hou, suoyou ren mimi toupiao gei huaiyi de ren.', 'De piao zuiduo de ren bei zhiren. Ping piao ze mei ren bei zhiren, wodi taotuo.', 'Ruguo wodi bei zhua, ta keyi cong si ge xuanxiang li cai yi ci qita ren de ci.'],
    win: 'San lun hou fenshu zuiduo de ren huosheng.',
    scoring: 'Taotuo de wodi de 3 fen. Bei zhua dan cai zhong ci de wodi de 2 fen; cai cuo ze qita suoyou ren ge de 1 fen. Ba ren ji yishang shi you liang ge wodi.',
  },
  'truth-or-dare': {
    steps: ['Lun dao ni shi xuanze zhenxinhua huo damaoxian.', 'Du chu timu, ranhou dasheng huida huozhe qu zuo.', 'Dian "wancheng" de 1 fen, ye keyi dian "tiaoguo". Tiaoguo cong bu shou fa.', 'Lun dao xia yi ge ren.'],
    win: 'Zuihou yi lun hou fenshu zuiduo de ren huosheng, buguo zhenzheng de mudi shi dajia kaixin daxiao.',
    scoring: 'Mei shuo yi ju zhenxinhua, wancheng yi ci damaoxian de 1 fen. Tiaoguo bu kou fen.',
  },
  'riddle-chits': {
    steps: ['Zhitiao shang dakai yi dao miyu, suoyou ren dou neng kan.', 'Xuan ni renwei zhengque de daan. Suoyou ren dou da wan zhiqian, shei ye kan bu dao ni de xuanze.', 'Mei bawo? Da ti qian keyi kan tishi. Zhe dao miyu de fenshu hui jiangdi.', 'Ranhou xianshi daan he mei ge ren de xuanze, xia yi zhang zhitiao dakai.'],
    win: 'Zuihou yi dao miyu hou fenshu zuiduo de ren huosheng.',
    scoring: 'Da dui de 2 fen, kan le tishi de 1 fen. Da cuo bu defen.',
  },
  'majority-vote': {
    steps: ['Chuxian yi ge you ji ge daan de wenti.', 'Mei ren toutou xuan ziji renwei da duoshu ren hui xuan de daan.', 'Suoyou ren xuan wan hou, yong tiaoxing tu xianshi zongshu.', 'Xuan le zui shou huanying daan de ren mei ren de 1 fen.'],
    win: 'Zuihou yi ge wenti hou fenshu zuiduo de ren huosheng.',
    scoring: 'Mei ci xuan zhong duoshu ren de daan de 1 fen. Ruguo liang ge daan binglie di yi, dou suan.',
  },
  consequences: {
    steps: ['Yici lunliu, mei ren wei xianshi de bufen jia yi ju hua, kan bu dao qianmian de juzi.', 'He pengyou wan shi ziji shuru juzi. He moshengren tong zhuo shi, cong women xie hao de juzi li xuan, zheyang shei ye bu neng fa bu youshan de hua.', 'Qi ge bufen zucheng yi ge gushi: shei, yujian le shei, zai nali, gezi shuo le shenme, fasheng le shenme, yiji shiren zenme shuo.', 'Zuihou gushi zhankai, dajia yiqi du.'],
    win: 'Gushi rang quan zhuo dou xiao qilai, dajia jiu dou ying le.',
    scoring: 'Bu jifen: zui hao de gushi yingde quanchang.',
  },
};
