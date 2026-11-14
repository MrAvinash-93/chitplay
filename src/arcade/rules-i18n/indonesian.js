/** Cara bermain setiap game, dalam bahasa Indonesia. Langkah yang sama, urutan yang sama, dengan bahasa Inggris di rules.js. */
export default {
  'flying-chit': {
    steps: ['Geser stik, atau pakai tombol panah, W A S D, atau gamepad, untuk mengarahkan kertas ke atas, bawah, kiri, dan kanan.', 'Sebuah cincin menunjukkan di mana kertasmu akan melewati gelang berikutnya: cincin jadi hijau kalau bidikanmu tepat. Di dekat gelang, kertas ditarik pelan ke tengahnya.', 'Terbang melewati gelang emas untuk mendapat kembali sebagian daya angkat. Bar di bawah skormu menunjukkan sisanya.', 'Gelang berturut-turut membentuk kombo: ×2, ×3, sampai ×5 poin per gelang.', 'Melewatkan gelang memutus kombo. Menabrak kipas angin atau tumpukan buku menguras banyak daya angkat.', 'Kalau daya angkat habis, kertas melayang turun ke lantai dan penerbanganmu selesai.', 'Setiap level baru dimulai dengan gelang emas besar: 10 poin dan daya angkat penuh.'],
    win: 'Sendirian, kejar skor terbaikmu. Bersama yang lain, semua terbang bersamaan dan skor tertinggi menang.',
    scoring: 'Setiap gelang memberi poin sesuai kombonya: 1, lalu 2, 3, 4, dan 5 selama rangkaian berlanjut. Medali di 50, 200, 500, dan 1000 poin.',
  },
  'tunnel-race': {
    steps: ['Geser stik ke kiri atau kanan, atau pakai A dan D, tombol panah, atau gamepad, untuk terbang memutari bagian dalam terowongan.', 'Dinding merah menutup sebagian terowongan: lewati dari sampingnya. Dinding oranye menutup semuanya kecuali satu celah: lewati celahnya.', 'Ambil permata yang berkilau, masing-masing 10 poin.', 'Menyentuh dinding mengakhiri permainanmu. Terowongan makin cepat semakin jauh kamu terbang, dan setiap level membawa jenis dinding baru.'],
    win: 'Sendirian, kalahkan skor terbaikmu. Bersama yang lain, semua balapan bersamaan dan skor tertinggi menang.',
    scoring: 'Poin untuk jarak terbangmu, dan 10 untuk setiap permata. Medali di 50, 150, 300, dan 600 poin.',
  },
  'turbo-tunnel': {
    steps: ['Geser stik ke kiri atau kanan, atau pakai A dan D, tombol panah, atau gamepad, untuk berbelok memutari bagian dalam terowongan.', 'Kerucut, pembatas, mobil, truk, dan batu mengakhiri balapanmu kalau tersentuh. Rintangan berikutnya yang akan kamu tabrak menyala merah di bawahnya.', 'Setiap baris terowongan selalu punya jalan kosong yang bisa kamu capai tepat waktu. Panah hijau samar di jalan menunjukkannya.', 'Koin bernilai 10 poin. Bantalan nitro biru menggandakan poin jarakmu selama tiga detik. Perisai hijau menahan satu tabrakan untukmu.', 'Oli tidak menghentikanmu, tapi mobil tergelincir dan lambat merespons setir sesaat.', 'Melewati sesuatu dengan sangat tipis adalah nyaris-tabrak: bonus 5 poin.'],
    win: 'Sendirian, kalahkan skor terbaikmu. Bersama teman, semua balapan di terowongan yang sama bersamaan: mobil terakhir yang masih melaju menang, dan kalau semua menabrak, skor tertinggi menang.',
    scoring: 'Poin untuk jarak tempuh (dua kali lipat saat nitro), 10 untuk setiap koin, dan 5 untuk setiap nyaris-tabrak. Medali di 100, 300, 700, dan 1500 poin.',
  },
  'reaction-time': {
    steps: ["Tunggu selama layar merah. Saat berubah hijau, ketuk di mana saja (atau tekan Spasi, Enter, atau tombol gamepad) secepat mungkin.","Mengetuk sebelum hijau, atau saat sinyal palsu biru di ronde 3 dan 4, adalah start salah dan tidak mendapat apa-apa di ronde itu.","Waktumu diukur di ponselmu sendiri, dari saat hijau muncul di layarmu sampai ketukanmu, jadi koneksi lambat tidak pernah membuatmu lebih lambat. Di bawah 100 ms dihitung menebak.","Ada lima ronde. Setelah tiap ronde kamu melihat waktu semua orang, dan yang tercepat di meja mendapat bonus 50 poin."],
    win: "Poin terbanyak setelah lima ronde menang. Sendirian, kalahkan rekormu dan raih medali.",
    scoring: "Tiap ronde bernilai 500 dikurangi waktumu dalam milidetik: reaksi 250 ms bernilai 250. Start salah dan ronde tanpa ketukan bernilai 0. Medali di 600, 900, 1100, dan 1300 poin.",
  },
  'stroop-test': {
    steps: ["Sebuah kartu menampilkan nama warna yang ditulis dengan tinta berwarna. Ketuk tombol warna TINTA-nya (atau tekan panah yang tertera).","Mulai kartu 6, beberapa kartu bertuliskan \"Ketuk KATA-nya\": maka jawab sesuai yang ditulis kata itu.","Hanya ketukan pertamamu di tiap kartu yang dihitung, jadi ketuk saat yakin. Kartu 11 sampai 15 memberi waktu lebih sedikit.","Waktumu diukur di ponselmu sendiri sejak kartu muncul di sana, jadi main online dengan teman yang jauh tetap adil."],
    win: "Setelah lima belas kartu, poin terbanyak menang. Sendirian, kalahkan rekormu dan raih medali.",
    scoring: "Jawaban benar bernilai makin besar makin cepat: 2000 dikurangi waktumu dalam milidetik, dibagi sepuluh, paling sedikit 10. Salah atau tidak menjawab bernilai 0. Bersama teman, jawaban benar tercepat di tiap kartu dapat tambahan 20. Medali di 600, 1200, 1700, dan 2100 poin.",
  },
  'number-memory': {
    steps: ["Sebuah angka muncul sebentar. Bar di bawahnya menunjukkan berapa lama ia tampil.","Saat angka hilang, ketik di papan angka (atau keyboard) lalu tekan ✓. Kamu punya waktu sampai 15 detik.","Benar: angka berikutnya bertambah satu digit. Salah: satu hati hilang. Tiga hati habis, kamu keluar.","Setiap ponsel menyimpan ketikan pemainnya dan mengirim jawaban utuh saat ✓; ponsel teman tidak pernah melihat angkanya saat semua menjawab."],
    win: "Sendirian, ingat angka terpanjang yang kamu bisa. Bersama teman, poin terbanyak menang; permainan selesai saat semua keluar atau pemain terakhir sudah unggul.",
    scoring: "Jawaban benar bernilai sepuluh poin per digit: angka 7 digit bernilai 70. Medali di 70, 150, 250, dan 400 poin.",
  },
  'word-guess': {
    steps: ["Kamu melihat petunjuk (seperti Fruit atau Sport) dan kata berupa kotak kosong, dengan satu huruf terlihat.","Setiap satu setengah detik muncul satu huruf lagi. Huruf terakhir tidak pernah muncul, jadi kamu selalu harus menebak.","Ketik kata lengkap di keypad huruf (atau keyboard) lalu tekan ✓. Hanya satu tebakan untuk setiap kata.","Setiap ponsel menghitung waktu pemainnya sendiri, dan ponsel teman hanya menerima huruf yang sudah terlihat, tidak pernah katanya."],
    win: "Setelah delapan kata, pemain dengan poin terbanyak menang.",
    scoring: "Tebakan benar bernilai 10, ditambah 10 untuk setiap huruf yang masih tersembunyi saat dikirim. Bersama teman, tebakan benar tercepat di setiap kata dapat 10 lagi. Tebakan salah tidak dapat apa-apa untuk kata itu. Medali di 80, 160, 240, dan 320 poin.",
  },
  'fast-typing': {
    steps: ["\"Get ready\" muncul satu detik, lalu katanya muncul.","Ketik kata itu di keypad huruf (atau keyboard) lalu tekan ✓. Hanya satu kesempatan untuk setiap kata.","Bilah di bawah kata menunjukkan sisa waktu: empat detik ditambah satu detik per huruf.","Setiap ponsel menghitung waktu pemainnya sejak kata muncul di layarnya, jadi koneksi lambat tidak mengurangi kecepatanmu."],
    win: "Setelah sepuluh kata, pemain dengan poin terbanyak menang.",
    scoring: "Kata yang benar bernilai sepuluh poin untuk setiap huruf per detik: enam huruf dalam dua detik berarti 30. Minimal 5 untuk kata yang benar, maksimal 60. Satu huruf salah, kata itu tidak dapat poin. Medali di 120, 200, 280, dan 360 poin.",
  },
  'bingo': {
    steps: ["Setiap pemain mendapat kartu berisi 1 sampai 25 dengan urutan berbeda. Hanya kamu yang bisa melihat kartumu.","Saat giliranmu, ketik angka 1 sampai 25 yang belum disebut lalu tekan ✓. Ada 15 detik, kalau tidak angka akan disebut untukmu.","Angka yang disebut dicoret di semua kartu, kartumu dan kartu temanmu.","Setiap baris, kolom, atau diagonal yang penuh adalah satu garis dan menyalakan huruf berikutnya dari B-I-N-G-O."],
    win: "Yang pertama menyelesaikan lima garis menang. Jika satu angka menyelesaikan dua kartu sekaligus, yang garisnya lebih banyak menang; jika masih sama, yang menyebut angka itu menang.",
    scoring: "Bilah di atas menunjukkan berapa huruf BINGO yang sudah menyala untuk setiap pemain. Ada dua belas garis yang mungkin di satu kartu: lima baris, lima kolom, dan dua diagonal.",
  },
  'unblock-puzzle': {
    steps: ["Setiap parkiran menampilkan bajaj (hijau, atap kuning), kendaraan di sekitarnya, dan gerbang di kanan barisnya.","Seret kendaraan dengan jari atau mouse untuk menggesernya. Kendaraan bergerak sejauh kamu menyeret, sampai rintangan pertama.","Atau pilih kendaraan dengan panah, tekan Hold, lalu geser dengan panah. Tekan Hold lagi untuk melepas.","Saat tidak ada apa-apa di antara bajaj dan gerbang, geser ke kanan dan bajaj keluar. Ada dua menit per parkiran."],
    win: "Setelah lima parkiran, pemain dengan poin terbanyak menang.",
    scoring: "Keluar bernilai 50, ditambah hingga 50 jika dengan sedikit langkah: berkurang 5 untuk setiap langkah di atas yang terbaik. Bersama teman, yang pertama keluar dari setiap parkiran dapat 20 lagi. Medali di 200, 300, 400, dan 470 poin.",
  },
  'hoop-flick': {
    steps: ['Tarik stik ke belakang seperti ketapel: bola akan terbang ke arah sebaliknya. Semakin jauh ditarik, semakin kuat lemparannya.', 'Lepaskan stik untuk melempar. Dengan keyboard, pakai panah kiri dan kanan untuk membidik, atas dan bawah untuk kekuatan, dan Spasi untuk melempar.', 'Buat bola jatuh masuk ke ring berikutnya dari atas.', 'Setiap ring punya dua belas detik: bar merah menunjukkan saat waktunya hampir habis.', 'Kalau meleset, bola jatuh keluar lapangan dan permainan selesai.', 'Setiap lima tembakan masuk ada level baru: ring bergerak, lalu angin, lalu keduanya.'],
    win: 'Sendirian, kalahkan rekormu. Bersama teman, masing-masing bermain di setengah lapangannya sendiri dan skor tertinggi menang.',
    scoring: 'Tembakan yang menyentuh ring bernilai 1. Tembakan bersih bernilai 2, dan tembakan bersih berturut-turut bernilai lebih: sampai 5 poin. Medali di 20, 50, 100, dan 200 poin.',
  },
  'ghost-hostel': {
    steps: ['Kasurmu menghasilkan koin setiap detik. Kasur yang lebih bagus menghasilkan lebih banyak.', 'Pakai tombol panah atau tombol di layar untuk memilih Kasur, Pintu, Kipas, atau Perbaiki, lalu tekan Beli.', 'Pintu: lebih kuat, dan langsung diperbaiki sampai kekuatan barunya. Perbaiki: memperbaiki sebagian pintu, lalu butuh beberapa detik sebelum bisa memperbaiki lagi.', 'Kipas meniup hantu selama ia berada di pintumu. Lukai cukup banyak dan ia melayang kembali ke pojoknya untuk pulih.', 'Hantu makin kuat setiap tiga puluh detik, dan makin marah di empat puluh detik terakhir. Kalau pintumu jebol, kamu tertangkap dan keluar.'],
    win: 'Semua yang masih di kamarnya saat matahari terbit menang. Usir hantu sepenuhnya dan malam berakhir lebih cepat. Kalau semua tertangkap, hantu yang menang.',
    scoring: 'Kamu mendapat setiap koin yang dihasilkan kasurmu, ditambah 100 karena bertahan sampai pagi dan 150 lagi kalau hantu diusir selamanya.',
  },
  'pin-spin': {
    steps: ['Ketuk layar, tekan tombol Paku, Spasi atau Enter, atau tombol gamepad untuk meluncurkan paku. Paku selalu melesat lurus ke atas ke bagian bawah papan.', 'Tunggu celah: kalau pakumu menyentuh paku yang sudah tertancap, permainan selesai.', 'Gunakan semua paku yang terlihat di bawah layar untuk menyelesaikan level.', 'Tancapkan stiker bintang emas untuk bonus 5 poin.', 'Setiap level kelima adalah papan besar: kecepatan dan arahnya berubah.', 'Setiap level punya batas waktu (bar tipis di bawah): habiskan semua pakunya sebelum waktunya habis.'],
    win: 'Sendirian, kalahkan rekormu. Bersama yang lain, masing-masing menancapkan paku di papannya sendiri bersamaan dan skor tertinggi menang.',
    scoring: 'Setiap paku yang tertancap bernilai 1, setiap bintang 5, dan menyelesaikan level bernilai dua kali nomor levelnya. Medali di 25, 60, 120, dan 250 poin.',
  },
  'bull-fight': {
    steps: ['Geser stik, atau pakai W A S D, tombol panah, atau gamepad, untuk menggerakkan bantengmu.', 'Tekan Seruduk untuk melesat ke depan. Kalau banteng lawan kira-kira ada di depanmu, serudukan otomatis mengarah ke sana. Lalu tunggu bar kembali bertuliskan CHARGE READY.', 'Lingkaran dan panah di bawah setiap banteng menunjukkan milik siapa dan ke mana ia menghadap. Di dekat tepi, kuku banteng mencengkeram pasir, jadi kamu hanya keluar kalau didorong; tepinya menyala merah dan muncul EDGE! saat kamu dekat.', 'Banteng yang menyeruduk dan mengenai lawan membuatnya terlempar dan pusing sesaat.', 'Siapa pun yang terdorong melewati garis putih kalah di ronde itu. Setelah beberapa saat, arena mulai menyempit.'],
    win: 'Yang pertama memenangkan tiga ronde memenangkan pertandingan.',
    scoring: 'Mendorong banteng lawan keluar memenangkan ronde.',
  },
  'spin-duel': {
    steps: ['Usap cepat ke arah lawan dalam tiga detik waktu peluncuran. Tombol Luncurkan adalah alternatif yang mudah diakses.', 'Usapan yang lebih panjang dan cepat memberi gasingmu tenaga lebih besar. Satu peluncuran per ronde.', 'Setelah hitungan selesai, gasing berputar dan bertabrakan sendiri. Jaga gasingmu tetap di arena dan terus berputar.', 'Gasing terakhir yang masih berputar memenangkan ronde. Kalau keduanya berhenti bersamaan, ronde seri.', 'Yang pertama memenangkan tiga ronde memenangkan pertandingan. Kalau kedua pemain gagal meluncur di tiga ronde, pertandingan berakhir seri.'],
    win: 'Main sendiri melawan bot, di satu layar, dari dekat, atau online. Kumpulkan koin dari bermain dan pakai untuk membuka gaya gasing dan arena.',
    scoring: 'Menangkan ronde dengan menjatuhkan gasing lawan keluar atau berputar lebih lama darinya. Pertandingan dimenangkan oleh yang pertama meraih tiga ronde.',
  },
  'pen-fight': {
    steps: ['Usap ke arah lawan dalam tiga detik. Tombol Sentil adalah alternatif yang mudah diakses.', 'Usapan yang lebih cepat mendorong pulpenmu lebih keras; arahmu menentukan jalurnya.', 'Pulpen meluncur dan bertabrakan sendiri. Pulpen yang jatuh dari tepi meja atau terguling karena tabrakan kalah di ronde itu.', 'Kalau kedua pulpen tetap di meja, yang posisinya lebih kuat di akhir menang; ronde yang sangat tipis berakhir seri.', 'Yang pertama memenangkan tiga ronde memenangkan pertandingan. Tiga ronde di mana kedua pemain gagal berakhir seri.'],
    win: 'Main sendiri melawan bot, bersama teman di satu layar, dari dekat, atau online. Buka tampilan pulpen dan meja dengan koin yang kamu kumpulkan; gaya hanya untuk tampilan.',
    scoring: 'Menangkan ronde dengan menjatuhkan pulpen lawan dari meja, menggulingkannya dengan tabrakan keras, atau bertahan lebih lama. Pertandingan dimenangkan oleh yang pertama meraih tiga ronde.',
  },
  'lapa-chupi': {
    steps: ['Setiap pertandingan, pemain yang berbeda menjadi pencari. Pencari menunggu di dinding dengan mata tertutup, sementara yang lain punya lima detik untuk bersembunyi.', 'Pakai joystick atau tombol panah untuk bergerak di taman bermain 3D. Tahan Lari untuk berlari lebih cepat, tapi hanya sekitar satu detik sebelum kehabisan napas.', 'Berhenti di dekat semak, bangku, atau mainan taman, lalu diam untuk bersembunyi. Bergerak, atau membiarkan pencari mendekat, akan membuatmu ketahuan.', 'Pencari menang kalau menemukan semua yang bersembunyi. Yang masih tersembunyi saat waktu habis menang bersama.', 'Di ruang online, lokasi pemain yang bersembunyi tidak dikirim ke pemain lain.'],
    win: 'Main bersama pemain komputer, teman di satu layar, dari dekat, atau online. Bot mengisi kursi kosong.',
    scoring: 'Pencari mendapat satu poin untuk setiap pemain yang ditemukan dan menang kalau menemukan semuanya. Yang masih tersembunyi saat waktu habis menang bersama dan mendapat lebih banyak daripada berapa pun hasil temuan.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani butuh tiga atau empat pemain: satu pengejar dan para pelari. Pemain komputer mengisi tempat kosong, dan pengejarnya berganti setiap pertandingan.', 'Pengejar menghitung sampai tiga di tengah lapangan sementara para pelari berpencar. Lalu kejar-kejaran dimulai.', 'Bergerak dengan joystick atau tombol panah. Tahan Lari untuk tambahan kecepatan; setelah sekitar satu detik kamu kehabisan napas dan harus berjalan sebentar.', 'Saat pengejar menyentuh pelari, pelari itu membeku (baraf!). Pelari yang masih bebas dan menyentuh teman yang membeku akan mencairkannya (pani!).', 'Pengejar menang kalau semua pelari membeku bersamaan. Para pelari menang kalau setidaknya satu masih bebas saat waktu habis.'],
    win: 'Main sendiri melawan pelari komputer, bersama teman di satu layar, dari dekat, atau online. Bot mengisi kursi kosong.',
    scoring: 'Dimenangkan per tim: pengejar dengan membekukan semua pelari, para pelari dengan menjaga setidaknya satu orang tetap bebas sampai waktu habis. Pemenang mendapat 1 poin.',
  },
  'pakda-padi': {
    steps: ['Bergerak di taman bermain dengan joystick atau tombol panah. Tahan Lari untuk tambahan kecepatan; setelah sekitar satu detik kamu kehabisan napas dan harus berjalan sebentar.', 'Pemain yang ditandai IT menghitung sampai tiga, lalu mengejar yang lain. Dekati cukup dekat untuk mengoper tangkapan.', 'Begitu tertangkap, berbaliklah dan kejar orang lain. Tidak boleh balas langsung: selama dua detik kamu tidak bisa menangkap pemain yang baru saja menangkapmu.', 'Saat waktu habis, pemain yang paling sedikit menghabiskan waktu sebagai IT menang. Bisa juga seri.'],
    win: 'Main bersama pemain komputer, teman di satu layar, dari dekat, atau online. Bot mengisi kursi kosong.',
    scoring: 'Pemain dengan waktu paling sedikit sebagai IT menang. Jumlah tangkapan dihitung di papan skor.',
  },
  'ship-fight': {
    steps: ['Gerakkan kapalmu ke mana saja di separuh lautmu. Meriamnya menembak sendiri ke kapal lawan kira-kira setiap detik.', 'Setiap kapal bisa menahan lima tembakan. Batu karang menghentikan tembakan, jadi pakai sebagai perlindungan.', 'Peti muncul di tengah: hati memperbaiki kapalmu, dan peti meriam memberi lima tembakan tiga arah.', 'Kalau ronde berlangsung terlalu lama, badai mulai merusak kapal, dimulai dari yang nyawanya lebih sedikit.'],
    win: 'Yang pertama memenangkan tiga ronde memenangkan pertandingan.',
    scoring: 'Menenggelamkan kapal lawan memenangkan ronde.',
  },
  'road-dash': {
    steps: ['Tekan kiri atau kanan (geser stik, A dan D, atau tombol panah) untuk pindah jalur.', 'Hindari sapi, lubang jalan, bus, dan bajaj lain.', 'Kumpulkan koin untuk poin tambahan.', 'Jalan makin cepat semakin lama kamu bertahan, dan kira-kira setiap 100 poin ada level baru dengan lalu lintas baru. Satu tabrakan mengakhiri permainanmu.'],
    win: 'Sendirian, kalahkan skor terbaikmu. Bersama yang lain, skor tertinggi menang.',
    scoring: 'Kamu mendapat poin dari jarak tempuh, dan 5 untuk setiap koin.',
  },
  'backyard-rally': {
    steps: ['Gerakkan pemukulmu ke atas dan ke bawah.', 'Pukul bola kembali. Setiap pukulan membuatnya sedikit lebih cepat.', 'Ujung pemukul membuat bola memantul dengan sudut lebih tajam.', 'Kalau bola melewati pemukulmu, pemain lain mendapat poin.'],
    win: 'Yang pertama mencapai tujuh poin menang.',
    scoring: 'Satu poin setiap kali bola melewati pemain lawan.',
  },
  'hungry-snake': {
    steps: ['Arahkan ularmu ke atas, bawah, kiri, atau kanan. Ia tidak pernah berhenti bergerak.', 'Makan camilan untuk mendapat satu poin dan bertambah panjang.', 'Menabrak dinding, tubuhmu sendiri, atau ular lain mengakhiri permainanmu.', 'Bersama yang lain, ular terakhir yang masih bergerak mendapat bonus 3 poin.'],
    win: 'Sendirian, kalahkan skor terbaikmu. Bersama yang lain, skor tertinggi menang.',
    scoring: 'Satu poin per camilan, ditambah 3 karena menjadi yang terakhir tersisa.',
  },
  ludo: {
    steps: ['Ketuk Lempar saat giliranmu. Kamu butuh angka enam untuk mengeluarkan bidak dari kandang ke kotak awalmu.', 'Ketuk bidak yang menyala, atau tombolnya, untuk memajukannya sesuai angka dadu. Meski hanya satu bidak yang bisa jalan, kamu sendiri yang mengetuknya; kalau tidak ada yang bisa jalan, giliranmu selesai.', 'Mendarat di bidak lawan mengirimnya kembali ke kandang. Kotak awal dan kotak bintang aman: tidak ada yang bisa dimakan di sana.', 'Setelah mengelilingi papan, bidak berbelok ke jalur rumahmu. Untuk sampai ke rumah butuh angka yang pas.', 'Angka enam, memakan bidak, dan membawa bidak sampai rumah masing-masing memberi lemparan tambahan. Tiga kali enam berturut-turut membuatmu kehilangan giliran.'],
    win: 'Mode Normal: yang pertama membawa keempat bidaknya pulang menang. Mode Skor: poin terbanyak menang, saat 15 ronde selesai atau saat seseorang membawa keempat bidaknya pulang.',
    scoring: 'Pilih mode sebelum bermain. Di mode Normal tidak ada poin: tabel hasil menunjukkan bidak yang dibawa pulang setiap pemain. Di mode Skor, setiap kotak yang dilangkahi bernilai 1, memakan bidak 20, bidak sampai rumah 30, dan menyelesaikan keempat bidak lebih dulu bonus 50.',
    house: [['Blokade', 'Dua bidak berwarna sama di kotak yang sama membentuk blokade. Tidak ada yang bisa melewati atau mendarat di sana, dan bidaknya tidak bisa dimakan.'], ['Makan dulu baru pulang', 'Bidak hanya bisa masuk jalur rumah setelah pemainnya memakan setidaknya satu bidak lawan. Sebelum itu, ia mengelilingi papan lagi.'], ['Mulai cepat', 'Setiap pemain mulai dengan satu bidak sudah di kotak awal, jadi permainan langsung berjalan.'], ['Lanjut untuk peringkat', 'Dengan tiga atau empat pemain, permainan tidak berhenti di pemenang: yang lain lanjut memperebutkan juara dua dan tiga, dan urutan akhirnya ditampilkan di akhir.']],
  },
  carrom: {
    steps: ['Kursi 1 memainkan biji putih dan kursi 2 biji hitam. Masing-masing ada sembilan, ditambah ratu merah di tengah.', 'Atur striker di garis dasar dengan penggeser Striker, pilih arah dengan Bidik dan kekuatan dengan Tenaga, lalu tembak.', 'Masukkan salah satu bijimu dan kamu menembak lagi. Kalau tidak, giliran berpindah.', 'Ratu harus ditutup. Setelah memasukkannya, masukkan salah satu bijimu di tembakan yang sama atau berikutnya, atau ratu kembali ke tengah.', 'Kalau striker masuk lubang, itu pelanggaran: salah satu bijimu yang sudah masuk kembali ke tengah dan giliranmu selesai.', 'Ratu harus sudah masuk sebelum biji terakhir siapa pun boleh tetap di lubang.'],
    win: 'Yang pertama memasukkan semua bijinya, dengan ratu sudah ditutup, menang. Kalau sudah 80 tembakan, yang sisa bijinya lebih sedikit menang.',
    scoring: 'Pemenang mendapat 1 poin untuk setiap biji lawan yang masih di papan, ditambah 3 karena memegang ratu.',
  },
  chess: {
    steps: ['Putih jalan lebih dulu, lalu pemain bergantian. Ketuk sebuah bidak, lalu ketuk kotak yang ditandai.', 'Benteng bergerak lurus, gajah bergerak diagonal, menteri bisa keduanya, kuda melompat berbentuk L, dan raja melangkah satu kotak.', 'Pion maju satu kotak, atau dua kotak di langkah pertamanya, dan memakan satu kotak diagonal ke depan. Di baris terakhir ia berubah menjadi menteri, benteng, gajah, atau kuda.', 'Rokade: kalau raja dan satu benteng belum pernah bergerak, kotak di antaranya kosong, dan raja tidak melewati skak, raja bergerak dua kotak ke arah benteng, lalu benteng melompatinya.', 'En passant: tepat setelah pion lawan maju dua kotak melewati pionmu, kamu boleh memakannya seolah ia hanya maju satu kotak.', 'Raja yang diserang sedang dalam skak. Di langkahmu, kamu wajib keluar dari skak.'],
    win: 'Skakmat menang: raja dalam skak dan tidak bisa lolos. Permainan remis karena pat (tidak ada langkah sah dan tidak sedang skak), posisi yang sama tiga kali, lima puluh langkah masing-masing tanpa memakan atau menggerakkan pion, atau bidak yang tersisa tidak cukup untuk skakmat.',
    scoring: 'Permainan berakhir menang atau remis. Tabel hasil menunjukkan 1 untuk pemenang.',
  },
  'snakes-and-ladders': {
    steps: ['Semua mulai di luar papan, sebelum kotak 1. Pemain bergiliran melempar dadu.', 'Majukan bidakmu sesuai angka dadu, mengikuti urutan angka di papan.', 'Mendarat di kaki tangga dan kamu naik ke puncaknya. Mendarat di kepala ular dan kamu turun ke ekornya.', 'Angka enam memberi lemparan tambahan.', 'Kotak 100 butuh angka yang pas. Kalau lemparan membuatmu lewat, bidakmu tetap di tempatnya.'],
    win: 'Yang pertama mendarat tepat di kotak 100 menang.',
    scoring: 'Tidak ada poin selama permainan. Tabel hasil menunjukkan kotak yang dicapai setiap pemain.',
    house: [['Mulai dengan 6', 'Bidak menunggu di luar papan sampai pemainnya mendapat angka 6. Angka 6 menaruhnya di kotak 1, dan pemain itu melempar lagi.'], ['Mantul balik', 'Lemparan yang melewati 100 memantul balik: dari 97, angka 5 sampai ke 100 lalu mundur dua kotak ke 98. Ular dan tangga tetap berlaku di tempat ia mendarat.'], ['Tiga kali enam', 'Tiga kali enam berturut-turut mengembalikan bidak ke posisinya di awal giliran itu, dan giliran berpindah.']],
  },
  'color-clash': {
    steps: ['Setiap pemain mendapat tujuh kartu. Satu kartu memulai tumpukan.', 'Di giliranmu, mainkan kartu yang cocok dengan kartu teratas dari warna, angka, atau simbolnya.', 'Lewati (⊘) melompati pemain berikutnya. Putar Balik (⇄) membalik arah; dengan dua pemain ia berfungsi seperti lewati. +2 membuat pemain berikutnya mengambil dua kartu dan kehilangan giliran.', 'Kartu Pelangi bisa ditaruh di atas kartu apa pun dan kamu memilih warna berikutnya. Pelangi +4 sama saja, dan pemain berikutnya mengambil empat kartu dan kehilangan giliran.', 'Tidak ada yang bisa dimainkan? Ambil satu kartu. Mainkan kalau cocok; kalau tidak, lewat.'],
    win: 'Yang pertama mencapai 150 poin menang. Kalau tidak ada yang sampai dalam lima ronde, skor tertinggi menang.',
    scoring: 'Pemain yang menghabiskan kartunya mendapat nilai kartu yang tersisa di tangan pemain lain: angka bernilai sesuai angkanya, kartu aksi 20, kartu Pelangi 50.',
    house: [['Menumpuk', 'Kena +2? Mainkan +2 milikmu atau Pelangi +4 di atasnya dan hukumannya pindah ke pemain berikutnya, makin besar. +4 hanya bisa dibalas dengan +4 lain. Yang tidak bisa (atau tidak mau) mengambil semuanya dan kehilangan giliran.'], ['Ambil sampai bisa main', 'Kalau tidak ada kartu yang bisa dimainkan, terus ambil kartu sampai dapat yang cocok, lalu boleh dimainkan.']],
  },
  'call-break': {
    steps: ['Semua 52 kartu dibagikan, 13 untuk setiap pemain.', 'Setiap pemain menyebut jumlah tangkapan dari 1 sampai 8, dimulai dari pemain setelah pembagi.', 'Pemain pertama membuka dengan kartu apa saja. Berkeliling, setiap pemain harus memainkan jenis yang sama, dan harus mengalahkan kartu terbaik sejauh ini kalau bisa.', 'Kalau tidak punya jenis yang dibuka, kamu harus memainkan sekop, dan mengalahkan sekop tertinggi kalau bisa. Tanpa sekop, mainkan apa saja.', 'Sekop tertinggi memenangkan tangkapan; tanpa sekop, kartu tertinggi dari jenis yang dibuka. Pemenangnya membuka berikutnya.'],
    win: 'Setelah lima ronde, total tertinggi menang.',
    scoring: 'Penuhi sebutanmu dan kamu mendapat angka yang kamu sebut, ditambah 0,1 untuk setiap tangkapan lebih. Gagal, dan kamu kehilangan angka yang kamu sebut.',
  },
  'crazy-eights': {
    steps: ['Setiap pemain mendapat tujuh kartu kalau berdua, lima kalau lebih. Satu kartu memulai tumpukan.', 'Di giliranmu, mainkan kartu yang cocok dengan kartu teratas dari jenis atau nilainya.', 'Kartu delapan bisa dimainkan di atas apa saja, dan kamu menyebut jenis yang harus diikuti.', 'Kalau tidak ada yang bisa dimainkan, ambil satu kartu. Mainkan kalau bisa; kalau tidak, lewat.', 'Ronde berakhir saat seseorang kehabisan kartu.'],
    win: 'Setelah tiga ronde, pemain dengan total poin hukuman terendah menang.',
    scoring: 'Kartu yang tersisa di tanganmu dihitung melawanmu: delapan bernilai 50, raja, ratu, atau jack 10, as 1, dan kartu lain sesuai angkanya.',
    house: [['Dua ambil dua', 'Kartu 2 membuat pemain berikutnya mengambil dua kartu dan kehilangan giliran, kecuali ia memainkan 2 juga: lalu pemain berikutnya mengambil empat, dan seterusnya.'], ['Jack melompati', 'Jack membuat pemain berikutnya kehilangan giliran.'], ['As memutar arah', 'As membalik arah permainan. Dengan dua pemain, artinya kamu jalan lagi.']],
  },
  checkers: {
    steps: ['Bidak bergerak satu kotak diagonal ke depan ke kotak gelap yang kosong. Ketuk sebuah bidak, lalu kotak yang ditandai.', 'Untuk memakan, lompati bidak lawan secara diagonal ke kotak kosong di belakangnya. Bidak yang dimakan diangkat dari papan.', 'Kalau bisa memakan, kamu wajib memakan, dan kalau bidak yang sama bisa melompat lagi, ia harus terus melompat.', 'Bidak yang mencapai baris terakhir menjadi raja, dan giliran itu berakhir. Raja bergerak dan melompat diagonal ke depan maupun ke belakang.'],
    win: 'Kamu menang saat lawan kehabisan bidak atau tidak punya langkah sah. Empat puluh langkah masing-masing tanpa memakan atau menggerakkan bidak biasa berarti seri.',
    scoring: 'Permainan berakhir menang atau seri. Tabel hasil menunjukkan 1 untuk pemenang.',
  },
  'four-in-a-row': {
    steps: ['Pemain bergiliran menjatuhkan satu keping ke kolom mana pun yang masih ada tempat.', 'Keping jatuh ke ruang kosong paling bawah di kolom itu.', 'Buat barisan empat kepingmu, mendatar, tegak, atau diagonal, dan kamu langsung menang.'],
    win: 'Barisan empat pertama menang. Kalau kisi penuh tanpa barisan, hasilnya seri.',
    scoring: 'Permainan berakhir menang atau seri. Tabel hasil menunjukkan 1 untuk pemenang.',
  },
  'tic-tac-toe': {
    steps: ['Satu pemain ✕ dan yang lain ◯. ✕ jalan lebih dulu.', 'Bergiliran mengisi satu kotak kosong.', 'Tiga tandamu dalam satu garis, mendatar, tegak, atau diagonal, menang.'],
    win: 'Yang pertama membuat garis tiga menang. Kalau kesembilan kotak penuh tanpa garis, hasilnya seri.',
    scoring: 'Permainan berakhir menang atau seri. Tabel hasil menunjukkan 1 untuk pemenang.',
  },
  reversi: {
    steps: ['Permainan dimulai dengan empat keping di tengah. Hitam jalan lebih dulu.', 'Taruh keping di kotak yang ditandai. Langkah harus menjepit setidaknya satu keping lawan dalam garis lurus di antara keping baru dan kepingmu yang lain.', 'Semua keping yang terjepit berbalik ke warnamu, ke segala arah sekaligus.', 'Kalau tidak punya langkah sah, giliranmu dilewati. Permainan selesai saat kedua pemain tidak bisa bergerak.'],
    win: 'Pemain dengan keping terbanyak di akhir menang. Jumlah sama berarti seri.',
    scoring: 'Skormu adalah jumlah keping berwarna milikmu di akhir permainan.',
  },
  'dots-and-boxes': {
    steps: ['Bergiliran menarik satu garis di antara dua titik yang bersebelahan.', 'Kalau garismu menutup sisi keempat sebuah kotak, kotak itu milikmu, dan kamu harus menarik garis lagi.', 'Permainan selesai saat semua garis sudah ditarik.'],
    win: 'Pemain dengan kotak terbanyak menang. Kalau semua sama, hasilnya seri.',
    scoring: 'Setiap kotak yang kamu tutup bernilai satu poin.',
  },
  mancala: {
    steps: ['Setiap pemain punya enam lubang di sisinya dan satu lumbung di ujung kanan. Ketuk salah satu lubangmu yang berisi biji.', 'Semua biji di lubang itu disebar satu per satu, berlawanan arah jarum jam, ke lubang-lubang berikutnya. Kamu melewati lumbungmu sambil menjatuhkan satu biji, tapi melompati lumbung lawan.', 'Kalau biji terakhirmu jatuh di lumbungmu sendiri, kamu jalan lagi.', 'Kalau biji terakhirmu jatuh di lubang kosong di sisimu dan lubang di seberangnya berisi biji, kamu mengambil semuanya, ditambah bijimu sendiri.', 'Saat satu sisi kehabisan biji, pemain lain mendapat sisa biji di sisinya.'],
    win: 'Pemain dengan biji terbanyak di lumbungnya menang. Jumlah sama berarti seri.',
    scoring: 'Setiap biji di lumbungmu bernilai satu poin.',
  },
  'nine-mens-morris': {
    steps: ['Menaruh: bergiliran menaruh satu bidak di titik kosong mana saja sampai masing-masing pemain menaruh sembilan.', 'Menggeser: lalu bergiliran menggeser bidak sepanjang garis ke titik tetangga yang kosong.', 'Setiap kali kamu membentuk barisan tiga yang baru, sebuah kincir, ambil satu bidak lawan. Bidak dalam kincir terlindungi, kecuali semua bidaknya ada dalam kincir.', 'Terbang: kalau tinggal tiga bidak, bidakmu boleh melompat ke titik kosong mana saja.'],
    win: 'Kamu menang saat lawan tinggal dua bidak atau tidak punya langkah sah. Lima puluh langkah masing-masing tanpa memakan berarti seri.',
    scoring: 'Permainan berakhir menang atau seri. Tabel hasil menunjukkan 1 untuk pemenang.',
  },
  'memory-match': {
    steps: ['Di giliranmu, ketuk dua kartu untuk membukanya. Semua pemain bisa melihatnya.', 'Kalau cocok, pasangan itu milikmu dan kamu jalan lagi.', 'Kalau tidak cocok, kartunya tertutup lagi saat giliran pemain berikutnya dimulai, dan giliran berpindah.'],
    win: 'Saat semua pasangan ditemukan, pemain dengan pasangan terbanyak menang. Kalau semua sama, hasilnya seri.',
    scoring: 'Setiap pasangan bernilai satu poin.',
  },
  yacht: {
    steps: ['Lempar kelima dadu. Ketuk dadu yang ingin disimpan, lalu lempar sisanya. Kamu bisa melempar sampai tiga kali per giliran.', 'Setelah lemparan mana pun, kamu boleh berhenti dan mencatat skor di satu kategori yang belum dipakai.', 'Satu sampai Enam mencatat jumlah angka itu. Pilihan mencatat jumlah semua dadu.', 'Empat Sama mencatat jumlah empat dadu itu. Full House (tiga sama dan dua sama) mencatat jumlah kelima dadu.', 'Seri Kecil (1–5) dan Seri Besar (2–6) bernilai 30. Yacht (kelima dadu sama) bernilai 50.', 'Kalau tidak ada yang cocok, kamu tetap harus memilih satu kategori, meski nilainya 0.'],
    win: 'Setelah masing-masing dua belas giliran, total tertinggi menang.',
    scoring: 'Totalmu adalah jumlah kedua belas kategori.',
    house: [['Bonus atas', 'Kumpulkan 63 atau lebih dari Satu sampai Enam (itu tiga dari setiap angka) dan kamu mendapat 35 poin tambahan di akhir.']],
  },
  pig: {
    steps: ['Di giliranmu, lempar dadu. Angka 2 sampai 6 ditambahkan ke total giliran ini.', 'Lempar lagi sesering yang kamu mau, atau berhenti untuk menyimpan total giliran ini.', 'Kalau dapat angka 1, total giliran ini hilang dan giliran berpindah.'],
    win: 'Capai target (50 di Cepat, 100 di Klasik dan Dua dadu) dan semua pemain lain masih mendapat satu giliran terakhir untuk mengalahkanmu. Setelah itu, simpanan tertinggi menang.',
    scoring: 'Hanya poin yang sudah disimpan yang dihitung.',
  },
  werewolf: {
    steps: ['Setiap pemain membaca peran rahasianya: Manusia Serigala, Peramal, Dokter, atau Warga.', 'Malam: manusia serigala memilih satu pemain untuk ditangkap, Peramal memilih satu pemain untuk diketahui perannya, dan Dokter memilih satu pemain untuk dilindungi.', 'Pagi: warga desa tahu siapa yang tertangkap malam itu, kecuali Dokter melindunginya.', 'Siang: diskusikan di chat, lalu semua yang masih bermain memilih pemain yang mereka kira manusia serigala. Yang paling banyak dipilih keluar dan perannya diperlihatkan. Kalau seri, tidak ada yang keluar.', 'Malam tiba lagi, dan permainan berlanjut sampai satu pihak menang.'],
    win: 'Desa menang begitu semua manusia serigala sudah dikeluarkan lewat pemungutan suara. Manusia serigala menang saat jumlah mereka sama dengan sisanya.',
    scoring: 'Semua di pihak pemenang menang: para manusia serigala bersama, atau Peramal, Dokter, dan Warga bersama. Dengan sembilan pemain atau lebih ada dua manusia serigala.',
  },
  'who-is-the-spy': {
    steps: ['Setiap pemain membaca kata rahasianya.', 'Berkeliling meja, setiap pemain memainkan satu kartu petunjuk untuk katanya.', 'Baca petunjuknya, lalu semua memilih secara rahasia pemain yang mereka curigai.', 'Pemain dengan suara terbanyak dituduh. Kalau seri, tidak ada yang dituduh dan mata-mata lolos.', 'Kalau mata-mata tertangkap, ia mendapat satu tebakan untuk kata pemain lain dari empat pilihan.'],
    win: 'Setelah tiga ronde, pemain dengan poin terbanyak menang.',
    scoring: 'Mata-mata yang lolos mendapat 3. Mata-mata yang tertangkap tapi menebak kata dengan benar mendapat 2; kalau salah, semua pemain lain mendapat 1. Dengan delapan pemain atau lebih ada dua mata-mata.',
  },
  'truth-or-dare': {
    steps: ['Di giliranmu, pilih Jujur atau Tantangan.', 'Baca soalnya, lalu jawab dengan suara keras atau lakukan.', 'Ketuk Selesai untuk mendapat poin, atau ketuk Lewati. Melewati tidak pernah dihukum.', 'Giliran pindah ke pemain berikutnya.'],
    win: 'Pemain dengan poin terbanyak setelah giliran terakhir menang, tapi yang paling penting adalah tawanya.',
    scoring: 'Setiap kejujuran yang diceritakan dan tantangan yang dilakukan bernilai 1 poin. Melewati tidak mengurangi apa pun.',
  },
  'riddle-chits': {
    steps: ['Sebuah teka-teki terbuka di kertas agar semua bisa membaca.', 'Pilih jawaban yang menurutmu benar. Tidak ada yang melihat pilihanmu sampai semua sudah menjawab.', 'Ragu? Ketuk untuk petunjuk sebelum menjawab. Itu mengurangi poinmu untuk teka-teki itu.', 'Lalu jawaban dan pilihan setiap orang ditampilkan, dan kertas berikutnya terbuka.'],
    win: 'Pemain dengan poin terbanyak setelah teka-teki terakhir menang.',
    scoring: 'Jawaban benar bernilai 2 poin, atau 1 kalau kamu memakai petunjuk. Jawaban salah tidak mendapat apa-apa.',
  },
  'majority-vote': {
    steps: ['Sebuah pertanyaan muncul dengan beberapa pilihan jawaban.', 'Setiap orang diam-diam memilih jawaban yang menurutnya akan dipilih kebanyakan orang.', 'Setelah semua memilih, totalnya ditampilkan sebagai batang.', 'Semua yang memilih jawaban paling populer mendapat satu poin.'],
    win: 'Pemain dengan poin terbanyak setelah pertanyaan terakhir menang.',
    scoring: 'Satu poin setiap kali kamu memilih jawaban mayoritas. Kalau dua jawaban sama-sama paling banyak dipilih, keduanya dihitung.',
  },
  consequences: {
    steps: ['Setiap pemain bergiliran menambahkan satu kalimat untuk bagian yang ditampilkan, tanpa melihat kalimat sebelumnya.', 'Bersama teman, kamu mengetik kalimatmu sendiri. Di meja dengan orang asing, kamu memilih dari kalimat yang kami tulis, supaya tidak ada yang bisa mengirim hal yang tidak baik.', 'Tujuh bagian membentuk cerita: siapa, bertemu siapa, di mana, apa kata masing-masing, apa yang terjadi, dan apa kata dunia.', 'Lalu ceritanya dibuka untuk dibaca semua.'],
    win: 'Semua menang saat ceritanya membuat seluruh meja tertawa.',
    scoring: 'Tidak ada poin: cerita terbaik memenangkan ruangan.',
  },
};
