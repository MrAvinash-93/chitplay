/** Her oyun nasıl oynanır, Türkçe. rules.js içindeki İngilizceyle aynı adımlar, aynı sırayla. */
export default {
  'flying-chit': {
    steps: ['Kâğıdı yukarı, aşağı, sola ve sağa yönlendirmek için çubuğu sürükle ya da ok tuşlarını, W A S D\'yi veya bir oyun kumandasını kullan.', 'Bir halka, kâğıdının bir sonraki bilezikten nereden geçeceğini gösterir: tam isabetteysen yeşile döner. Bileziğe yaklaşınca kâğıt yavaşça ortasına doğru çekilir.', 'Biraz kaldırma gücü kazanmak için altın bir bilezikten geç. Puanının altındaki çubuk ne kadar kaldığını gösterir.', 'Art arda bilezikler kombo yapar: her biri ×2, ×3, ×5\'e kadar puan.', 'Bir bileziği kaçırmak komboyu bitirir. Bir vantilatöre ya da kitap yığınına çarpmak çok kaldırma gücü kaybettirir.', 'Kaldırma gücü bitince kâğıt süzülerek yere iner ve uçuşun sona erer.', 'Her yeni seviye büyük bir altın bilezikle başlar: 10 puan ve tam kaldırma gücü.'],
    win: 'Tek başına kendi en iyi puanının peşindesin. Başkalarıyla herkes aynı anda uçar ve en yüksek puan kazanır.',
    scoring: 'Her bilezik kombosu kadar puan verir: seri sürdükçe 1, sonra 2, 3, 4 ve 5. 50, 200, 500 ve 1000 puanda madalya.',
  },
  'tunnel-race': {
    steps: ['Tünelin içinde çepeçevre uçmak için çubuğu sola ya da sağa sürükle veya A ve D\'yi, ok tuşlarını ya da bir oyun kumandasını kullan.', 'Kırmızı duvarlar tünelin bir kısmını kapatır: etrafından dolaş. Turuncu duvarlar bir boşluk dışında her yeri kapatır: boşluktan geç.', 'Parlayan mücevherleri topla, her biri 10 puan.', 'Bir duvara değmek koşunu bitirir. İlerledikçe tünel hızlanır ve her yeni seviye yeni bir duvar türü getirir.'],
    win: 'Tek başına kendi rekorunu kır. Başkalarıyla herkes aynı anda yarışır ve en yüksek puan kazanır.',
    scoring: 'Uçtuğun mesafe için puan, her mücevher için 10. 50, 150, 300 ve 600 puanda madalya.',
  },
  'turbo-tunnel': {
    steps: ['Tünelin içinde çepeçevre direksiyon kırmak için çubuğu sola ya da sağa sürükle veya A ve D\'yi, ok tuşlarını ya da bir oyun kumandasını kullan.', 'Dubalar, bariyerler, arabalar, kamyonlar ve kayalar dokunursan yarışını bitirir. Arabanın çarpmak üzere olduğu bir sonraki engelin altı kırmızı yanar.', 'Tünelin her sırasında her zaman zamanında ulaşabileceğin boş bir geçit vardır. Yoldaki soluk yeşil oklar onu gösterir.', 'Altınlar 10 puan değerindedir. Mavi nitro pedi üç saniye boyunca mesafe puanını ikiye katlar. Yeşil kalkan senin yerine bir çarpmayı karşılar.', 'Yağ seni durdurmaz ama araba kayar ve bir süre direksiyona yavaş tepki verir.', 'Bir şeyin kılpayı yanından geçmek ramaktır: 5 bonus puan.'],
    win: 'Tek başına kendi rekorunu kır. Arkadaşlarınla herkes aynı tünelde aynı anda yarışır: hâlâ giden son araba kazanır, herkes çarparsa en yüksek puan kazanır.',
    scoring: 'Gittiğin mesafe için puan (nitroda iki kat), her altın için 10 ve her ramak için 5. 100, 300, 700 ve 1500 puanda madalya.',
  },
  'reaction-time': {
    steps: ["Ekran kırmızıyken bekle. Yeşil olunca herhangi bir yere dokun (ya da Boşluk, Enter veya bir kumanda tuşuna bas), olabildiğince hızlı.","Yeşilden önce ya da 3. ve 4. turlardaki mavi sahte sinyalde dokunmak hatalı çıkıştır ve o turda puan getirmez.","Süren kendi telefonunda ölçülür, yeşil ekranında göründüğü andan dokunuşuna kadar; yani yavaş bağlantı seni asla yavaşlatmaz. 100 ms altı tahmin sayılır.","Beş tur vardır. Her turdan sonra herkesin süresini görürsün ve masadaki en hızlı kişi 50 bonus puan alır."],
    win: "Beş turun sonunda en çok puanı olan kazanır. Tek başına rekorunu kır ve madalyaları kazan.",
    scoring: "Her tur 500 eksi milisaniye cinsinden süren kadar puan verir: 250 ms tepki 250 puan. Hatalı çıkışlar ve kaçırılan turlar 0. 600, 900, 1100 ve 1300 puanda madalya.",
  },
  'stroop-test': {
    steps: ["Bir kartta renkli mürekkeple yazılmış bir renk adı çıkar. MÜREKKEP renginin düğmesine dokun (ya da üzerindeki ok tuşuna bas).","6. karttan itibaren bazı kartlar \"KELİMEYE dokun\" der: o zaman kelimenin yazdığı rengi seç.","Her kartta yalnızca ilk dokunuşun sayılır, o yüzden emin olunca dokun. 11 ile 15 arasındaki kartlar daha az süre verir.","Süren, kartın kendi telefonunda göründüğü andan ölçülür; uzaktaki arkadaşlarla çevrimiçi oynamak da adildir."],
    win: "On beş kartın sonunda en çok puanı olan kazanır. Tek başına rekorunu kır ve madalyaları kazan.",
    scoring: "Doğru cevap ne kadar hızlıysa o kadar puan getirir: 2000 eksi milisaniye cinsinden süren, ona bölünür, en az 10. Yanlış ya da cevapsız 0. Arkadaşlarla her kartta en hızlı doğru cevap 20 puan daha alır. 600, 1200, 1700 ve 2100 puanda madalya.",
  },
  'number-memory': {
    steps: ["Bir sayı kısa bir an görünür. Altındaki çubuk ne kadar kalacağını gösterir.","Kaybolunca sayıyı tuş takımına (ya da klavyene) yaz ve ✓'ye bas. 15 saniyeye kadar vaktin var.","Doğru: sonraki sayı bir hane daha uzun. Yanlış: bir kalp gider. Üç kalp gidince oyundan çıkarsın.","Her telefon kendi oyuncusunun yazdığını saklar ve ✓ ile cevabın tamamını gönderir; cevap verilirken arkadaşların telefonları sayıyı hiç görmez."],
    win: "Tek başına, hatırlayabildiğin en uzun sayıyı tut. Arkadaşlarla en çok puan kazanır; herkes elendiğinde ya da ayakta kalan son oyuncu zaten öndeyken oyun biter.",
    scoring: "Doğru cevap hane başına on puan getirir: 7 haneli bir sayı 70 eder. 70, 150, 250 ve 400 puanda madalya.",
  },
  'word-guess': {
    steps: ["Bir ipucu (Fruit ya da Sport gibi) ve kelimeyi boş kareler olarak görürsün; bir harf açıktır.","Her bir buçuk saniyede bir harf daha açılır. Son harf hiç açılmaz, yani her zaman tahmin etmen gerekir.","Kelimenin tamamını harf tuş takımına (ya da klavyene) yaz ve ✓ tuşuna bas. Her kelime için tek tahmin hakkın var.","Her telefon kendi oyuncusunun süresini ölçer ve arkadaşların telefonlarına yalnızca açılmış harfler gider, kelime asla gitmez."],
    win: "Sekiz kelimenin sonunda en çok puanı olan kazanır.",
    scoring: "Doğru tahmin 10 puan, gönderdiğin anda gizli kalan her harf için de 10 puan daha getirir. Arkadaşlarla her kelimedeki en hızlı doğru tahmin 10 puan daha alır. Yanlış tahmin o kelimeden puan getirmez. 80, 160, 240 ve 320 puanda madalya.",
  },
  'fast-typing': {
    steps: ["Bir saniye \"Get ready\" görünür, sonra kelime çıkar.","Kelimeyi harf tuş takımına (ya da klavyene) yaz ve ✓ tuşuna bas. Her kelime için tek hakkın var.","Kelimenin altındaki çubuk kalan süreyi gösterir: dört saniye artı her harf için bir saniye.","Her telefon kendi oyuncusunun süresini kelimenin o ekranda göründüğü andan ölçer, yani yavaş bağlantı hızından hiçbir şey götürmez."],
    win: "On kelimenin sonunda en çok puanı olan kazanır.",
    scoring: "Doğru kelime, saniyede yazılan her harf için on puan getirir: iki saniyede altı harf 30 eder. Her doğru kelime en az 5, en çok 60. Tek bir yanlış harf, o kelimeden puan yok demek. 120, 200, 280 ve 360 puanda madalya.",
  },
  'bingo': {
    steps: ["Her oyuncu 1'den 25'e kadar sayıların farklı sırada olduğu bir kart alır. Kartını yalnızca sen görürsün.","Sıran gelince 1 ile 25 arasında henüz söylenmemiş bir sayı yaz ve ✓ tuşuna bas. 15 saniyen var, yoksa senin yerine bir sayı söylenir.","Söylenen sayı herkesin kartında, seninkinde ve arkadaşlarınınkinde, çizilir.","Dolan her satır, sütun ya da çapraz bir çizgidir ve B-I-N-G-O'nun sıradaki harfini yakar."],
    win: "Beş çizgiyi ilk tamamlayan kazanır. Bir sayı iki kartı aynı anda tamamlarsa çizgisi çok olan kazanır; yine eşitse sayıyı söyleyen kazanır.",
    scoring: "Üstteki çubuk her oyuncunun BINGO'dan kaç harf yaktığını gösterir. Bir kartta on iki olası çizgi vardır: beş satır, beş sütun ve iki çapraz.",
  },
  'unblock-puzzle': {
    steps: ["Her otopark taksiyi (yeşil, sarı tente), çevresindeki araçları ve kendi sırasının sağındaki kapıyı gösterir.","Bir aracı parmağınla ya da fareyle sürükleyerek kaydır. Sürüklediğin kadar, önündeki ilk engele kadar gider.","Ya da oklarla bir araç seç, Hold'a bas ve oklarla kaydır. Bırakmak için yine Hold'a bas.","Taksiyle kapı arasında bir şey kalmayınca sağa kaydır, taksi çıkar. Her otopark için iki dakikan var."],
    win: "Beş otoparkın sonunda en çok puanı olan kazanır.",
    scoring: "Çıkmak 50 puan, az hamleyle çıkmak 50 puana kadar daha getirir: en iyiden fazla her hamle için 5 eksik. Arkadaşlarla her otoparktan ilk çıkan 20 puan daha alır. 200, 300, 400 ve 470 puanda madalya.",
  },
  'hoop-flick': {
    steps: ['Çubuğu sapan gibi geriye çek: top ters yöne uçar. Ne kadar çok çekersen atış o kadar güçlü olur.', 'Atmak için çubuğu bırak. Klavyede nişan için sol ve sağ okları, güç için yukarı ve aşağıyı, atmak için Boşluk tuşunu kullan.', 'Topu bir sonraki potadan yukarıdan geçecek şekilde düşür.', 'Her potanın on iki saniyesi var: süre bitmek üzereyken kırmızı çubuk uyarır.', 'Kaçırırsan top sahadan düşer ve oyun biter.', 'Her beş basket yeni bir seviyedir: hareket eden potalar, sonra rüzgâr, sonra ikisi birden.'],
    win: 'Tek başına rekorunu kır. Bir arkadaşınla her biriniz sahanın kendi yarısında oynar ve yüksek puan kazanır.',
    scoring: 'Çembere değen basket 1 sayıdır. Temiz basket 2 sayıdır, art arda temiz basketler daha fazla değerlidir: her biri 5 puana kadar. 20, 50, 100 ve 200 puanda madalya.',
  },
  'ghost-hostel': {
    steps: ['Yatağın her saniye altın kazandırır. Daha iyi bir yatak daha çok kazandırır.', 'Oklarla ya da düğmelerle Yatak, Kapı, Vantilatör veya Tamir seç ve Satın Al\'a bas.', 'Kapı: daha fazla dayanıklılık ve yeni dayanıklılığına kadar onarılır. Tamir: kapının bir kısmını onarır, sonraki tamir için birkaç saniye beklemek gerekir.', 'Hayalet kapındayken vantilatörler ona üfler. Yeterince hasar verirsen toparlanmak için köşesine süzülerek geri döner.', 'Hayalet her otuz saniyede güçlenir, son kırk saniyede daha da öfkelenir. Kapın kırılırsa yakalanırsın ve oyundan çıkarsın.'],
    win: 'Güneş doğduğunda hâlâ odasında olan herkes kazanır. Hayaleti tamamen kovarsan gece erken biter. Herkes yakalanırsa hayalet kazanır.',
    scoring: 'Yatağının kazandığı her altını alırsın, sabaha kadar dayandığın için 100 ve hayalet sonsuza dek kovulursa 150 daha.',
  },
  'pin-spin': {
    steps: ['Bir raptiye göndermek için ekrana dokun, Raptiye düğmesine, Boşluk\'a, Enter\'a ya da bir kumanda düğmesine bas. Raptiye her zaman dümdüz yukarı, tahtanın alt kısmına uçar.', 'Bir boşluk bekle: raptiyen tahtada zaten olan birine değerse oyun biter.', 'Seviyeyi bitirmek için ekranın altında gösterilen tüm raptiyeleri kullan.', '5 bonus puan için altın bir yıldız çıkartmasını vur.', 'Her beşinci seviye büyük bir tahtadır: hızı ve yönü değişir.', 'Her seviyenin bir süre sınırı vardır (alttaki ince çubuk): süre bitmeden tüm raptiyeleri kullan.'],
    win: 'Tek başına rekorunu kır. Başkalarıyla herkes aynı anda kendi tahtasına raptiye çakar ve en yüksek puan kazanır.',
    scoring: 'Saplanan her raptiye 1, her yıldız 5 puandır, bir seviyeyi bitirmek de seviye numarasının iki katı puan verir. 25, 60, 120 ve 250 puanda madalya.',
  },
  'bull-fight': {
    steps: ['Boğanı hareket ettirmek için çubuğu sürükle ya da W A S D\'yi, ok tuşlarını veya bir oyun kumandasını kullan.', 'İleri atılmak için Hücum\'a bas. Öteki boğa aşağı yukarı önündeyse hücum kendiliğinden ona yönelir. Sonra çubukta yeniden CHARGE READY yazmasını bekle.', 'Her boğanın altındaki halka ve ok, kimin olduğunu ve nereye baktığını gösterir. Kenara yakınken toynaklar kuma tutunur, yani ancak itilirsen dışarı çıkarsın; yakınken kenar kırmızı parlar ve EDGE! yazar.', 'Hücum eden ve ötekine çarpan boğa onu savurur ve bir anlığına sersemletir.', 'Beyaz çizginin dışına itilen turu kaybeder. Bir süre sonra arena küçülmeye başlar.'],
    win: 'Üç turu ilk kazanan maçı alır.',
    scoring: 'Öteki boğayı dışarı itmek turu kazandırır.',
  },
  'spin-duel': {
    steps: ['Üç saniyelik fırlatma süresi içinde rakibine doğru hızlıca kaydır. Fırlat düğmesi erişilebilir bir alternatiftir.', 'Daha uzun ve hızlı bir kaydırma topacına daha fazla güç verir. Her turda bir fırlatma.', 'Sayaçtan sonra topaçlar kendiliğinden döner ve çarpışır. Topacını arenada ve dönerken tut.', 'Dönmeye devam eden son topaç turu kazanır. İkisi birlikte durursa tur berabere biter.', 'Üç turu ilk kazanan maçı alır. İki oyuncu da üç turu kaçırırsa maç berabere biter.'],
    win: 'Tek başına bir bota karşı, tek ekranda, yakında ya da çevrimiçi oyna. Oynayarak altın kazan ve topaç ile arena stillerinin kilidini aç.',
    scoring: 'Rakip topacı dışarı atarak ya da ondan uzun dönerek turu kazanırsın. Maçı üç turu ilk alan kazanır.',
  },
  'pen-fight': {
    steps: ['Üç saniye içinde rakibine doğru kaydır. Fiske düğmesi erişilebilir bir alternatiftir.', 'Daha hızlı bir kaydırma kalemini daha sert gönderir; yönün izleyeceği yolu belirler.', 'Kalemler kendiliğinden kayar ve çarpışır. Masanın kenarından düşen ya da bir çarpmayla devrilen kalem turu kaybeder.', 'İki kalem de masada kalırsa sonunda daha iyi konumda olan kazanır; çok yakın turlar berabere biter.', 'Üç turu ilk kazanan maçı alır. İki oyuncunun da ıskaladığı üç tur beraberlikle biter.'],
    win: 'Tek başına bir bota karşı, bir arkadaşla tek ekranda, yakında ya da çevrimiçi oyna. Kazandığın altınlarla kalem ve masa görünümlerinin kilidini aç; stiller sadece görünüştür.',
    scoring: 'Rakip kalemi masadan düşürerek, sert bir çarpmayla devirerek ya da ondan uzun dayanarak turu kazanırsın. Maçı üç turu ilk alan kazanır.',
  },
  'lapa-chupi': {
    steps: ['Her maçta farklı bir oyuncu ebe olur. Ebe gözleri kapalı duvarın yanında beklerken diğerlerinin saklanmak için beş saniyesi vardır.', '3D oyun bahçesinde dolaşmak için joystick\'i ya da ok tuşlarını kullan. Daha hızlı koşmak için Koş\'u basılı tut, ama nefesin kesilmeden önce yalnızca bir saniye kadar.', 'Saklanmak için bir çalının, bankın ya da bahçedeki bir oyuncağın yanında dur ve kıpırdama. Hareket etmek ya da ebenin yaklaşmasına izin vermek seni ele verir.', 'Ebe herkesi bulursa kazanır. Süre bittiğinde hâlâ saklı olanlar birlikte kazanır.', 'Çevrimiçi odalarda saklanan oyuncuların konumu diğer oyunculara gönderilmez.'],
    win: 'Bilgisayar oyuncularıyla, tek ekranda arkadaşlarınla, yakında ya da çevrimiçi oyna. Botlar boş koltukları doldurur.',
    scoring: 'Ebe bulduğu her oyuncu için bir puan alır ve hepsini bulursa kazanır. Süre bittiğinde hâlâ saklı olanlar birlikte kazanır ve kaç kişi bulunursa bulunsun daha fazla puan alır.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani üç ya da dört oyuncuyla oynanır: bir ebe ve kaçanlar. Bilgisayar oyuncuları boş yerleri doldurur ve ebe her maçta değişir.', 'Kaçanlar dağılırken ebe bahçenin ortasında üçe kadar sayar. Sonra kovalamaca başlar.', 'Joystick ya da ok tuşlarıyla hareket et. Hızlanmak için Koş\'u basılı tut; bir saniye kadar sonra nefesin kesilir ve bir süre yürümen gerekir.', 'Ebe birine dokunduğunda o oyuncu donar (baraf!). Serbest bir oyuncu donmuş bir arkadaşına dokunursa onu çözer (pani!).', 'Tüm kaçanlar aynı anda donarsa ebe kazanır. Süre bittiğinde en az biri hâlâ serbestse kaçanlar kazanır.'],
    win: 'Tek başına bilgisayar kaçanlara karşı, tek ekranda arkadaşlarınla, yakında ya da çevrimiçi oyna. Botlar boş koltukları doldurur.',
    scoring: 'Takım olarak kazanılır: ebe tüm kaçanları dondurarak, kaçanlar süre bitene kadar en az bir kişiyi serbest tutarak. Kazananlar 1 puan alır.',
  },
  'pakda-padi': {
    steps: ['Oyun bahçesinde joystick ya da ok tuşlarıyla dolaş. Hızlanmak için Koş\'u basılı tut; bir saniye kadar sonra nefesin kesilir ve bir süre yürümen gerekir.', 'IT olarak işaretlenen oyuncu üçe kadar sayar, sonra diğerlerini kovalar. Ebeliği geçirmek için yeterince yaklaş.', 'Ebelendiğinde dön ve başka birini kovala. Hemen geri vermek yok: iki saniye boyunca seni yeni ebeleyeni ebeleyemezsin.', 'Süre bittiğinde en az süre IT olarak kalan kazanır. Beraberlik olabilir.'],
    win: 'Bilgisayar oyuncularıyla, tek ekranda arkadaşlarınla, yakında ya da çevrimiçi oyna. Botlar boş koltukları doldurur.',
    scoring: 'IT olarak en az süre geçiren kazanır. Ebelemeler skor tablosunda sayılır.',
  },
  'ship-fight': {
    steps: ['Gemini denizin kendi yarısında istediğin yere götür. Topu kendiliğinden, yaklaşık her saniye öteki gemiye ateş eder.', 'Her gemi beş isabete dayanır. Kayalar atışları durdurur, onları siper olarak kullan.', 'Ortada sandıklar çıkar: kalp gemini onarır, top sandığı beş üçlü atış verir.', 'Bir tur çok uzarsa bir fırtına gemileri yıpratmaya başlar, canı az olandan başlayarak.'],
    win: 'Üç turu ilk kazanan maçı alır.',
    scoring: 'Öteki gemiyi batırmak turu kazandırır.',
  },
  'road-dash': {
    steps: ['Şerit değiştirmek için sola ya da sağa bas (çubuğu sürükle, A ve D ya da ok tuşları).', 'İneklerden, çukurlardan, otobüslerden ve diğer çekçeklerden kaç.', 'Ekstra puan için altın topla.', 'Ne kadar dayanırsan yol o kadar hızlanır ve yaklaşık her 100 puanda yeni trafikle yeni bir seviye gelir. Tek bir kaza koşunu bitirir.'],
    win: 'Tek başına kendi rekorunu kır. Başkalarıyla en yüksek puan kazanır.',
    scoring: 'Gittiğin mesafe için puan alırsın, her altın için de 5.',
  },
  'backyard-rally': {
    steps: ['Raketini yukarı ve aşağı hareket ettir.', 'Topa geri vur. Her vuruş onu biraz hızlandırır.', 'Raketin kenarı topu daha dik bir açıyla gönderir.', 'Top raketini geçerse öteki oyuncu sayı alır.'],
    win: 'Yedi sayıya ilk ulaşan kazanır.',
    scoring: 'Top öteki oyuncuyu her geçtiğinde bir sayı.',
  },
  'hungry-snake': {
    steps: ['Yılanını yukarı, aşağı, sola ya da sağa yönlendir. Hiç durmaz.', 'Bir puan almak ve uzamak için bir atıştırmalık ye.', 'Bir duvara, kendine ya da başka bir yılana çarpmak oyununu bitirir.', 'Başkalarıyla hareket eden son yılan 3 bonus puan alır.'],
    win: 'Tek başına kendi rekorunu kır. Başkalarıyla en yüksek puan kazanır.',
    scoring: 'Her atıştırmalık için bir puan, son kalan olmak için de 3.',
  },
  ludo: {
    steps: ['Sıran gelince Zar At\'a dokun. Bir piyonu evden başlangıç karene çıkarmak için altı gerekir.', 'Atılan sayı kadar ilerletmek için parlayan bir piyona ya da düğmesine dokun. Tek bir piyon oynayabilse bile ona sen dokunursun; hiçbiri oynayamazsa sıran biter.', 'Rakip bir piyonun üstüne gelirsen o evine döner. Başlangıç kareleri ve yıldızlı kareler güvenlidir: orada kimse yenmez.', 'Tahtayı dolaştıktan sonra piyon kendi bitiş yoluna girer. Bitişe ulaşmak için tam sayı gerekir.', 'Altı atmak, piyon yemek ve bir piyonu bitişe ulaştırmak her biri bir zar hakkı daha verir. Art arda üç altı sıranı kaybettirir.'],
    win: 'Normal mod: dört piyonunu ilk bitişe getiren kazanır. Puan modu: 15 tur bittiğinde ya da biri dört piyonunu bitişe getirdiğinde en çok puanı olan kazanır.',
    scoring: 'Oynamadan önce modu seç. Normal modda puan yoktur: sonuç tablosu herkesin bitişe getirdiği piyonları gösterir. Puan modunda her ilerlenen kare 1, piyon yemek 20, bitişe ulaşan piyon 30, dört piyonu ilk bitirmek de 50 bonus puan değerindedir.',
    house: [['Barikatlar', 'Aynı renkten iki piyon yolun aynı karesinde barikat oluşturur. Başka kimse onu geçemez ya da üstüne gelemez, piyonları da yenemez.'], ['Eve dönmek için ye', 'Bir piyon, oyuncusu en az bir rakip piyon yemeden bitiş yoluna giremez. O zamana kadar tahtayı bir tur daha dolaşır.'], ['Hızlı başlangıç', 'Herkes bir piyonu zaten başlangıç karesinde başlar, böylece oyun hemen başlar.'], ['Sıralama için devam', 'Üç ya da dört oyuncuyla oyun kazananla bitmez: diğerleri ikincilik ve üçüncülük için devam eder, bitiş sırası sonunda gösterilir.']],
  },
  carrom: {
    steps: ['1. koltuk beyaz taşları, 2. koltuk siyah taşları oynar. Her renkten dokuz taş, bir de ortada kırmızı kraliçe vardır.', 'Vurucuyu Vurucu kaydırıcısıyla taban çizgisine yerleştir, Nişan ile yönü ve Güç ile kuvveti seç, sonra vur.', 'Kendi taşlarından birini sokarsan yeniden vurursun. Sokamazsan sıra geçer.', 'Kraliçe örtülmelidir. Onu soktuktan sonra aynı atışta ya da bir sonrakinde kendi taşından birini sok, yoksa kraliçe ortaya geri döner.', 'Vurucu cebe düşerse faul olur: soktuğun taşlardan biri ortaya geri döner ve sıran biter.', 'Birinin son taşının cepte kalabilmesi için kraliçenin önce gitmiş olması gerekir.'],
    win: 'Kraliçe örtülmüş şekilde tüm taşlarını ilk sokan kazanır. 80 atış geçerse taşı daha az kalan kazanır.',
    scoring: 'Kazanan, öteki oyuncunun tahtada kalan her taşı için 1 puan, kraliçe kendisindeyse 3 puan daha alır.',
  },
  chess: {
    steps: ['Önce beyaz oynar, sonra oyuncular sırayla oynar. Bir taşa, sonra işaretli bir kareye dokun.', 'Kale düz çizgilerde, fil çaprazlarda, vezir her ikisinde gider, at L şeklinde sıçrar ve şah bir kare gider.', 'Piyon bir kare ileri, ilk hamlesinde iki kare gider ve çapraz olarak bir kare ileriden alır. Son sırada vezir, kale, fil ya da ata dönüşür.', 'Rok: şah ve bir kale hiç oynamamışsa, aralarındaki kareler boşsa ve şah şahtan geçmiyorsa, şah kaleye doğru iki kare gider, kale de onun üstünden atlar.', 'Geçerken alma: bir piyon iki kare ilerleyip senin piyonunun yanına geldiği hemen sonraki hamlede, onu tek kare ilerlemiş gibi alabilirsin.', 'Saldırı altındaki şah, şah çekilmiş durumdadır. Hamlende şahtan kurtulmalısın.'],
    win: 'Şah mat kazandırır: şaha şah çekilmiştir ve kaçış yoktur. Pat (geçerli hamle yok ama şah da yok), aynı pozisyonun üç kez tekrarı, iki taraf için de elli hamle boyunca alma ya da piyon hamlesi olmaması veya mat için yetersiz taş beraberliktir.',
    scoring: 'Oyun galibiyet ya da beraberlikle biter. Sonuç tablosu kazanan için 1 gösterir.',
  },
  'snakes-and-ladders': {
    steps: ['Herkes tahtanın dışında, 1. kareden önce başlar. Oyuncular sırayla zar atar.', 'Piyonunu tahtadaki sayıları izleyerek atılan sayı kadar ilerlet.', 'Bir merdivenin dibine gelirsen tepesine çıkarsın. Bir yılanın başına gelirsen kuyruğuna kayarsın.', 'Altı bir zar hakkı daha verir.', '100. kare için tam sayı gerekir. Zar seni ötesine götürecekse piyonun olduğu yerde kalır.'],
    win: 'Tam 100. kareye ilk gelen kazanır.',
    scoring: 'Oyun sırasında puan yoktur. Sonuç tablosu her oyuncunun ulaştığı kareyi gösterir.',
    house: [['6 ile başla', 'Bir piyon, oyuncusu 6 atana kadar tahtanın dışında bekler. 6 onu 1. kareye koyar ve o oyuncu yeniden atar.'], ['Geri sekme', '100\'ü geçen zar geri seker: 97\'den 5 atan 100\'e gider ve iki kare geri, 98\'e döner. Yılanlar ve merdivenler indiği yerde geçerlidir.'], ['Üç altı', 'Art arda üç altı piyonu o sıranın başındaki yerine geri gönderir ve sıra geçer.']],
  },
  'color-clash': {
    steps: ['Herkes yedi kart alır. Bir kart desteyi başlatır.', 'Sıran gelince en üstteki kartla rengi, sayısı ya da sembolü uyan bir kart oyna.', 'Atla (⊘) sonraki oyuncuyu atlar. Yön Değiştir (⇄) yönü çevirir; iki oyuncuda atla gibi çalışır. +2 sonraki oyuncuya iki kart çektirir ve sırasını kaybettirir.', 'Gökkuşağı kartı her şeyin üstüne oynanır ve sonraki rengi sen seçersin. Gökkuşağı +4 de aynısını yapar, sonraki oyuncu dört kart çeker ve sırasını kaybeder.', 'Oynayacak bir şey yok mu? Bir kart çek. Uyarsa oynayabilirsin; uymazsa pas geç.'],
    win: '150 puana ilk ulaşan kazanır. Beş turda kimse ulaşamazsa en yüksek puan kazanır.',
    scoring: 'Elini bitiren, diğer herkesin elinde kalan kartların puanını alır: sayılar kendi değerinde, aksiyon kartları 20, gökkuşağı kartları 50.',
    house: [['Biriktirme', '+2 mi yedin? Üstüne kendi +2\'ni ya da bir Gökkuşağı +4 oyna, ceza büyüyerek sonraki oyuncuya geçer. +4\'e ancak başka bir +4 ile karşılık verilir. Veremeyen (ya da vermek istemeyen) hepsini çeker ve sırasını kaybeder.'], ['Oynayana kadar çek', 'Oynayacak kartın yoksa uyan bir kart gelene kadar çekmeye devam edersin, sonra onu oynayabilirsin.']],
  },
  'call-break': {
    steps: ['52 kartın tamamı dağıtılır, her oyuncuya 13.', 'Dağıtandan sonraki oyuncudan başlayarak herkes 1 ile 8 arasında bir el sayısı söyler.', 'İlk oyuncu herhangi bir kartla açar. Sırayla herkes aynı türü oynamak ve yapabiliyorsa o ana kadarki en iyi kartı geçmek zorundadır.', 'Açılan türden kartın yoksa maça oynamalı ve yapabiliyorsan en yüksek maçayı geçmelisin. Maça da yoksa herhangi bir kart oyna.', 'En yüksek maça eli alır; maça yoksa açılan türün en yüksek kartı alır. Kazanan bir sonraki eli açar.'],
    win: 'Beş turun sonunda en yüksek toplam kazanır.',
    scoring: 'Söylediğini tutturursan söylediğin sayıyı, fazladan aldığın her el için de 0,1 alırsın. Tutturamazsan söylediğin sayıyı kaybedersin.',
  },
  'crazy-eights': {
    steps: ['İki oyuncuda herkes yedi, daha fazlasında beş kart alır. Bir kart desteyi başlatır.', 'Sıran gelince en üstteki kartla türü ya da değeri uyan bir kart oyna.', 'Sekiz her kartın üstüne oynanabilir ve ardından gelmesi gereken türü sen söylersin.', 'Oynayacak bir şey yoksa bir kart çek. Oynayabiliyorsan oyna; yoksa pas geç.', 'Biri kartsız kaldığında tur biter.'],
    win: 'Üç turun sonunda en az ceza puanı olan kazanır.',
    scoring: 'Elinde kalan kartlar aleyhine sayılır: sekiz 50, papaz, kız ya da vale 10, as 1, diğer kartlar kendi sayısı kadar.',
    house: [['İkiler iki çektirir', 'Bir 2, sonraki oyuncuya iki kart çektirir ve sırasını kaybettirir, o da bir 2 oynamazsa: o zaman sonraki dört çeker, böyle devam eder.'], ['Valeler atlatır', 'Bir vale sonraki oyuncunun sırasını kaybettirir.'], ['Aslar yön değiştirir', 'Bir as oyunun yönünü çevirir. İki oyuncuda yeniden sen oynarsın demektir.']],
  },
  checkers: {
    steps: ['Taşlar çapraz olarak bir kare ileri, boş bir koyu kareye gider. Bir taşa, sonra işaretli bir kareye dokun.', 'Almak için rakip bir taşın üstünden çapraz atlayıp arkasındaki boş kareye geç. Alınan taş tahtadan kalkar.', 'Alabiliyorsan almak zorundasın ve aynı taş yeniden atlayabiliyorsa devam etmek zorundadır.', 'Son sıraya ulaşan taş dama olur ve sıra orada biter. Damalar çapraz olarak hem ileri hem geri gider ve atlar.'],
    win: 'Rakibin taşı ya da geçerli hamlesi kalmadığında kazanırsın. İki taraf için de kırk hamle boyunca alma ya da normal taş hamlesi olmazsa berabere.',
    scoring: 'Oyun galibiyet ya da beraberlikle biter. Sonuç tablosu kazanan için 1 gösterir.',
  },
  'four-in-a-row': {
    steps: ['Oyuncular sırayla yeri olan herhangi bir sütuna bir pul bırakır.', 'Pul o sütundaki en alttaki boş yere düşer.', 'Yatay, dikey ya da çapraz olarak dört pulunu yan yana getir ve hemen kazan.'],
    win: 'İlk dörtlü sıra kazanır. Izgara sırasız dolarsa berabere.',
    scoring: 'Oyun galibiyet ya da beraberlikle biter. Sonuç tablosu kazanan için 1 gösterir.',
  },
  'tic-tac-toe': {
    steps: ['Bir oyuncu ✕, öteki ◯ olur. ✕ başlar.', 'Sırayla boş bir kareyi alın.', 'Yatay, dikey ya da çapraz bir çizgide üç işaretin kazanır.'],
    win: 'Üçlü çizgiyi ilk yapan kazanır. Dokuz kare çizgisiz dolarsa berabere.',
    scoring: 'Oyun galibiyet ya da beraberlikle biter. Sonuç tablosu kazanan için 1 gösterir.',
  },
  reversi: {
    steps: ['Oyun ortada dört taşla başlar. Önce siyah oynar.', 'İşaretli bir kareye taş koy. Hamle, yeni taşla senin başka bir taşın arasında düz bir çizgide en az bir rakip taşı sıkıştırmalıdır.', 'Sıkışan tüm taşlar her yönde aynı anda senin rengine döner.', 'Geçerli hamlen yoksa sıran atlanır. Hiçbir oyuncu oynayamadığında oyun biter.'],
    win: 'Sonunda en çok taşı olan kazanır. Eşit sayı beraberliktir.',
    scoring: 'Puanın, sonunda senin renginde görünen taşların sayısıdır.',
  },
  'dots-and-boxes': {
    steps: ['Sırayla iki komşu nokta arasına bir çizgi çekin.', 'Çizgin bir kutunun dördüncü kenarını kapatırsa kutu senindir ve yeniden çizmen gerekir.', 'Tüm çizgiler çekildiğinde oyun biter.'],
    win: 'En çok kutusu olan kazanır. Herkes eşitse berabere.',
    scoring: 'Kapattığın her kutu bir puandır.',
  },
  mancala: {
    steps: ['Her oyuncunun kendi tarafında altı çukuru ve sağ uçta bir hazinesi vardır. Tohum olan çukurlarından birine dokun.', 'O çukurdaki tüm tohumlar saat yönünün tersine sonraki çukurlara birer birer ekilir. Kendi hazinenden geçerken bir tohum bırakırsın ama rakibinkini atlarsın.', 'Son tohumun kendi hazinene düşerse yeniden oynarsın.', 'Son tohumun kendi tarafındaki boş bir çukura düşerse ve karşısındaki çukurda tohum varsa, hepsini artı kendi tohumunu alırsın.', 'Bir taraf tohumsuz kalınca öteki oyuncu kendi tarafında kalan tohumları alır.'],
    win: 'Hazinesinde en çok tohum olan kazanır. Eşit sayı beraberliktir.',
    scoring: 'Hazinendeki her tohum bir puandır.',
  },
  'nine-mens-morris': {
    steps: ['Yerleştirme: her oyuncu dokuz taş koyana kadar sırayla boş bir noktaya taş koyun.', 'Hareket: sonra sırayla bir taşı çizgi boyunca komşu boş bir noktaya kaydırın.', 'Her yeni üçlü sıra, yani değirmen kurduğunda rakipten bir taş al. Değirmendeki taşlar korunur, meğer ki hepsi değirmende olsun.', 'Uçma: yalnızca üç taşın kaldığında taşların herhangi bir boş noktaya atlayabilir.'],
    win: 'Rakibin iki taşa düştüğünde ya da geçerli hamlesi kalmadığında kazanırsın. İki taraf için de elli hamle boyunca alma olmazsa berabere.',
    scoring: 'Oyun galibiyet ya da beraberlikle biter. Sonuç tablosu kazanan için 1 gösterir.',
  },
  'memory-match': {
    steps: ['Sıran gelince çevirmek için iki karta dokun. Tüm oyuncular onları görebilir.', 'Eşleşirlerse çifti alırsın ve yeniden oynarsın.', 'Eşleşmezlerse sonraki oyuncunun sırası başlarken geri dönerler ve sıra geçer.'],
    win: 'Tüm çiftler bulunduğunda en çok çifti olan kazanır. Herkes eşitse berabere.',
    scoring: 'Her çift bir puandır.',
  },
  yacht: {
    steps: ['Beş zarın hepsini at. Tutmak istediklerine dokun, sonra geri kalanları yeniden at. Bunu bir sırada üç atışa kadar yapabilirsin.', 'Herhangi bir atıştan sonra durup henüz kullanmadığın bir kategoriye yazabilirsin.', 'Birler\'den Altılar\'a kadar o sayının toplamını yazar. Şans tüm zarların toplamını yazar.', 'Dörtlü o dört zarın toplamını yazar. Full (bir sayıdan üç, başkasından iki) beşinin toplamını yazar.', 'Küçük kent (1–5) ve Büyük kent (2–6) 30 puandır. Yacht (beşi de aynı) 50 puandır.', 'Hiçbir şey uymazsa 0 bile olsa bir kategori seçmek zorundasın.'],
    win: 'Herkes on iki sıra oynadıktan sonra en yüksek toplam kazanır.',
    scoring: 'Toplamın on iki kategorinin hepsinin toplamıdır.',
    house: [['Üst bonus', 'Birler\'den Altılar\'a kadar toplamda 63 ya da daha fazla yaparsan (yani her sayıdan üçer tane), sonunda 35 ekstra puan alırsın.']],
  },
  pig: {
    steps: ['Sıran gelince zarı at. 2 ile 6 arasındaki her sayı bu sıranın toplamına eklenir.', 'İstediğin kadar yeniden at ya da bu sıranın toplamını kasaya koymak için dur.', '1 atarsan bu sıranın toplamını kaybedersin ve sıra geçer.'],
    win: 'Hedefe ulaş (Hızlı\'da 50, Klasik ve İki zar\'da 100), diğer herkesin seni geçmek için son bir sırası daha olur. Ardından kasası en yüksek olan kazanır.',
    scoring: 'Yalnızca kasaya konan puanlar sayılır.',
  },
  werewolf: {
    steps: ['Herkes gizli rolünü kendisi okur: Kurt Adam, Kâhin, Doktor ya da Köylü.', 'Gece: kurt adamlar yakalayacakları bir oyuncu seçer, Kâhin rolünü öğreneceği bir oyuncu seçer ve Doktor koruyacağı bir oyuncu seçer.', 'Sabah: köy, Doktor korumadıysa gece kimin yakalandığını öğrenir.', 'Gündüz: sohbette konuşun, sonra oyunda kalan herkes kurt adam sandığı oyuncuya oy verir. En çok oy alan ayrılır ve rolü gösterilir. Beraberlikte kimse ayrılmaz.', 'Gece yeniden çöker ve oyun bir taraf kazanana kadar sürer.'],
    win: 'Tüm kurt adamlar oyla dışarı atıldığı anda köy kazanır. Kurt adamlar, sayıları geri kalanlarla eşitlendiğinde kazanır.',
    scoring: 'Kazanan tarafın tamamı kazanır: kurt adamlar birlikte ya da Kâhin, Doktor ve Köylüler birlikte. Dokuz ya da daha fazla oyuncuda iki kurt adam vardır.',
  },
  'who-is-the-spy': {
    steps: ['Her oyuncu gizli kelimesini kendisi okur.', 'Masada sırayla her oyuncu kendi kelimesi için bir ipucu kartı oynar.', 'İpuçlarını okuyun, sonra herkes şüphelendiği oyuncuya gizlice oy verir.', 'En çok oy alan suçlanır. Beraberlikte kimse suçlanmaz ve casus kurtulur.', 'Casus yakalanırsa, diğerlerinin kelimesini dört seçenek arasından tahmin etmek için bir hakkı olur.'],
    win: 'Üç turun sonunda en çok puanı olan kazanır.',
    scoring: 'Kurtulan casus 3 alır. Yakalanıp kelimeyi bilen casus 2 alır; bilemezse diğer herkes 1 alır. Sekiz ya da daha fazla oyuncuda iki casus vardır.',
  },
  'truth-or-dare': {
    steps: ['Sıran gelince Doğruluk ya da Cesaret\'i seç.', 'Gelen görevi oku, sonra yüksek sesle cevap ver ya da yap.', 'Bir puan için Tamam\'a ya da Atla\'ya dokun. Atlamanın hiçbir cezası yoktur.', 'Sıra bir sonraki oyuncuya geçer.'],
    win: 'Son sıradan sonra en çok puanı olan kazanır, ama asıl mesele kahkahalardır.',
    scoring: 'Anlatılan her doğruluk ve yapılan her cesaret 1 puan kazandırır. Atlamak hiçbir şeye mal olmaz.',
  },
  'riddle-chits': {
    steps: ['Herkesin okuması için kâğıtta bir bilmece açılır.', 'Doğru olduğunu düşündüğün cevabı seç. Herkes cevaplayana kadar kimse seçimini görmez.', 'Emin değil misin? Cevaplamadan önce ipucu iste. O bilmecedeki puanını düşürür.', 'Sonra cevap ve herkesin seçimi gösterilir, sıradaki kâğıt açılır.'],
    win: 'Son bilmeceden sonra en çok puanı olan kazanır.',
    scoring: 'Doğru cevap 2 puan, ipucu aldıysan 1 puan kazandırır. Yanlış cevap hiçbir şey kazandırmaz.',
  },
  'majority-vote': {
    steps: ['Birkaç olası cevapla bir soru açılır.', 'Herkes, çoğunluğun seçeceğini düşündüğü cevabı gizlice seçer.', 'Herkes seçince toplamlar çubuk olarak gösterilir.', 'En popüler cevabı seçen herkes bir puan alır.'],
    win: 'Son sorudan sonra en çok puanı olan kazanır.',
    scoring: 'Çoğunluğun cevabını her seçişinde bir puan. İki cevap en çok seçilen olarak berabere kalırsa ikisi de sayılır.',
  },
  consequences: {
    steps: ['Her oyuncu sırayla, öncekileri görmeden, gösterilen bölüm için bir cümle ekler.', 'Arkadaşlarınla kendi cümlelerini yazarsın. Yabancılarla bir masada, kimse kötü bir şey gönderemesin diye bizim yazdığımız cümleler arasından seçersin.', 'Yedi bölüm bir hikâye oluşturur: kim, kiminle karşılaştı, nerede, her biri ne dedi, ne oldu ve dünya ne dedi.', 'Sonra hikâye herkes okusun diye açılır.'],
    win: 'Hikâye tüm masayı güldürdüğünde herkes kazanır.',
    scoring: 'Puan yoktur: en iyi hikâye salonu kazanır.',
  },
};
