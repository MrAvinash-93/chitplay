/**
 * First names by region, so every player and computer opponent has a name that
 * fits where the game was opened. The region comes from the device's timezone
 * (language as a fallback); nothing is sent anywhere. Names hold letters only.
 */
const list = (s) => s.trim().split(/\s+/);

const SOUTH_ASIA_M = 'Avinash Akash Ashish Rahul Rohan Aman Arjun Karan Vikas Nikhil Sachin Deepak Manish Rakesh Suresh Ramesh Mahesh Ajay Vijay Sanjay Anil Sunil Pankaj Gaurav Saurabh Abhishek Harsh Yash Dev Kunal Mohit Rohit Amit Sumit Vivek Nitin Tarun Varun Ishaan Aditya Pranav Siddharth Shubham Prateek Ankit Lokesh Dinesh Naveen Kartik Rajesh Mukesh Bharat Hemant Tushar Sahil Imran Farhan Arif Harpreet Gurpreet Vishal';
const SOUTH_ASIA_F = 'Priya Neha Pooja Anjali Kavita Sunita Rekha Meena Ritu Shreya Sneha Divya Nisha Aarti Swati Komal Payal Rani Sita Gita Radha Lakshmi Ananya Isha Kiran Sapna Preeti Rashmi Shweta Tanya Riya Simran Harleen Jyoti Mansi Muskan Nikita Pallavi Rupali Sakshi Tanvi Vaishali Aisha Zoya Sana Fatima Bhavna Chitra Deepika Geeta Hema Madhuri Namrata Poonam Seema Usha Varsha Yamini';

const NAMES = {
  IN: { m: list(SOUTH_ASIA_M), f: list(SOUTH_ASIA_F) },
  /* the same people, written the way each language's players read: Hindi in Devanagari, the rest in Latin letters */
  IN_DEVA: {
    m: list('आकाश राहुल रोहन अमन अर्जुन करण विकास निखिल दीपक मनीष अजय विजय संजय गौरव सौरभ अभिषेक हर्ष यश कुणाल मोहित रोहित अमित विवेक नितिन वरुण ईशान आदित्य प्रणव सिद्धार्थ शुभम'),
    f: list('प्रिया नेहा पूजा अंजलि कविता रेखा रितु श्रेया स्नेहा दिव्या निशा आरती स्वाति कोमल पायल अनन्या ईशा किरण सपना प्रीति रश्मि श्वेता रिया सिमरन ज्योति मानसी निकिता पल्लवी साक्षी तन्वी'),
  },
  CN_LATIN: {
    m: list('Wei Qiang Lei Jun Yang Yong Jie Tao Ming Chao Haoran Zixuan Yuhang Junjie Zhiqiang Tianyu Wenbo Haitao Xiaodong Jiawei Pengfei Haoyu Bowen Zihao Yichen'),
    f: list('Fang Na Min Jing Li Xiuying Xiaohong Meimei Tingting Xue Xinyi Yutong Siyu Jiayi Meiling Xiaoyan Huimin Shihan Mengyao Yulan Zihan Kexin Ruoxi Yaqi Lin'),
  },
  JP_LATIN: {
    m: list('Haruto Kenta Daiki Yuki Shota Takumi Riku Sota Ren Hiroto Takeshi Masaru Daisuke Yuma Kaito Sora Hayato Kenji Ryota Itsuki'),
    f: list('Sakura Yui Hana Aoi Miyu Riko Mei Hina Ayaka Nanami Haruka Sayaka Misaki Hinata Ai Mayumi Keiko Yumi Rin Akari'),
  },
  KR_LATIN: {
    m: list('Minjun Seojun Doyun Yejun Siwoo Hajun Juwon Jiho Jihu Junseo Hyunwoo Donghyun Sungmin Jaehyun Taehyun Sangwoo Jinwoo Woojin Gunwoo Minho'),
    f: list('Seoyeon Seoyun Jiwoo Hayun Minseo Jimin Subin Yujin Eunji Jieun Hyejin Miyoung Sujin Yeeun Daeun Soyeon Yuna Haeun Nayeon Chaewon'),
  },
  RU_LATIN: {
    m: list('Ivan Dmitry Alexey Sergey Andrey Mikhail Nikolai Pavel Maxim Artyom Kirill Egor Denis Roman Vladimir Ilya Nikita Timur Oleg Yuri'),
    f: list('Anna Maria Elena Olga Natalia Tatiana Irina Svetlana Ekaterina Darya Polina Alina Sofia Ksenia Viktoria Yulia Vera Alisa Milana Nadia'),
  },
  PK: {
    m: list('Ahmed Ali Hassan Hussain Bilal Usman Omar Hamza Zain Faisal Imran Kamran Salman Asad Tariq Waqas Adnan Shahid Junaid Fahad Rizwan Danish Saad Shoaib Yasir Nabeel Haris Talha Arslan Babar'),
    f: list('Ayesha Fatima Sana Hina Maryam Zainab Sara Nida Iqra Rabia Saba Mehwish Amna Kiran Sadia Bushra Farah Aiman Hira Noor Sidra Laiba Maham Anum Alina Rida Mahnoor Javeria Asma Samina'),
  },
  NP: {
    m: list('Bibek Ramesh Suman Prakash Dipesh Sagar Bikash Rajan Sandesh Anil Kiran Nabin Roshan Sujan Manoj Binod Hari Krishna Pawan Santosh'),
    f: list('Sita Gita Sarita Anita Sabina Puja Rina Asmita Pratima Sunita Kabita Binita Laxmi Manisha Nisha Roshni Sushma Bimala Kamala Shanti'),
  },
  BD: {
    m: list('Rafi Tanvir Rakib Sakib Tamim Mahmud Hasan Arif Nayeem Fahim Shuvo Rubel Jewel Mithun Sohel Imran Kamal Jamal Rahim Karim'),
    f: list('Nusrat Mim Tania Sumaiya Farzana Sadia Lamia Ruma Shirin Rupa Mitu Tisha Bristy Nadia Jannat Sharmin Rima Sonia Moushumi Taslima'),
  },
  LK: {
    m: list('Nuwan Kasun Chamara Sanath Dilshan Lahiru Tharindu Ruwan Saman Janaka Kusal Dinesh Ashan Nimal Sunil'),
    f: list('Nimali Sanduni Dilani Chamari Kumari Tharushi Ishara Hiruni Malsha Sachini Anusha Madhavi Rashmi Shehani Dulani'),
  },
  CN: {
    m: list('伟 强 磊 军 洋 勇 杰 涛 明 超 浩然 子轩 宇航 俊杰 志强 建国 小明 大伟 天宇 文博 海涛 晓东 嘉伟 鹏飞 浩宇'),
    f: list('芳 娜 敏 静 丽 秀英 小红 梅梅 丽丽 婷婷 雪 欣怡 雨桐 思雨 佳怡 美玲 晓燕 慧敏 诗涵 梦瑶 玉兰 淑华 亚楠 紫涵 可欣'),
  },
  JP: {
    m: list('ハルト ケンタ ダイキ ユウキ ショウタ タクミ リク ソウタ レン ヒロト たけし まさる 健太 大輔 翔太 陸 蓮 悠真 陽斗 拓海'),
    f: list('サクラ ユイ ハナ アオイ ミユ リコ メイ ヒナ アヤカ ナナミ はるか さやか 美咲 陽菜 結衣 葵 愛 真由美 恵子 由美'),
  },
  KR: {
    m: list('민준 서준 도윤 예준 시우 하준 주원 지호 지후 준서 현우 동현 성민 재현 태현 영호 상우 진우 우진 건우'),
    f: list('서연 서윤 지우 하윤 민서 지민 수빈 유진 은지 지은 혜진 미영 수진 예은 다은 소연 윤아 하은 나연 채원'),
  },
  RU: {
    m: list('Иван Дмитрий Алексей Сергей Андрей Михаил Николай Павел Максим Артём Владимир Егор Роман Кирилл Олег Юрий Виктор Денис Антон Тимур'),
    f: list('Анна Мария Елена Ольга Наталья Татьяна Ирина Светлана Екатерина Дарья Алина Полина София Юлия Вера Ксения Людмила Надежда Галина Марина'),
  },
  US: {
    m: list('Jake Tyler Ethan Mason Logan Noah Liam Aiden Caleb Hunter Ryan Justin Brandon Kevin Marcus Andre Carlos Derek Trevor Wyatt Cole Dylan Evan Gavin Isaac'),
    f: list('Emily Ashley Madison Olivia Ava Mia Chloe Grace Lily Hannah Abby Megan Kayla Zoe Natalie Taylor Brooke Jasmine Paige Sierra Riley Claire Faith Hailey Nora'),
  },
  UK: {
    m: list('Oliver Harry George Jack Charlie Alfie Archie Oscar Thomas William Henry Leo Freddie Callum Rhys Owen Liam Finlay Ewan Nathan'),
    f: list('Amelia Isla Ava Poppy Emily Grace Freya Evie Lily Ella Sophie Rosie Imogen Niamh Eilidh Megan Holly Phoebe Molly Daisy'),
  },
  DE: {
    m: list('Lukas Felix Jonas Leon Paul Max Finn Tim Jan Moritz Niklas Tobias Stefan Markus Andreas Klaus Jürgen Florian Sebastian Matthias'),
    f: list('Lena Hanna Mia Emma Lea Anna Lara Laura Julia Sarah Katharina Sabine Petra Claudia Monika Johanna Greta Nina Franziska Heike'),
  },
  FR: {
    m: list('Lucas Hugo Louis Jules Gabriel Arthur Nathan Théo Antoine Mathis Pierre Julien Nicolas Philippe Alain Baptiste Maxime Romain Clément Bastien'),
    f: list('Chloé Manon Léa Emma Camille Inès Jade Louise Sarah Lucie Marie Élodie Julie Claire Nathalie Sophie Margaux Anaïs Pauline Océane'),
  },
  ES: {
    m: list('Pablo Hugo Daniel Álvaro Adrián Javier Sergio Carlos Miguel Antonio Jorge Raúl Marcos Iván Rubén Andrés Diego Manuel Alberto Fernando'),
    f: list('Lucía Paula María Carmen Sara Marta Laura Elena Ana Claudia Alba Noelia Cristina Andrea Irene Nuria Pilar Rocío Teresa Isabel'),
  },
  IT: {
    m: list('Luca Marco Matteo Lorenzo Andrea Francesco Alessandro Giovanni Davide Simone Paolo Stefano Roberto Antonio Federico'),
    f: list('Giulia Sofia Martina Chiara Francesca Sara Aurora Alice Elena Giorgia Anna Maria Valentina Federica Paola'),
  },
  BR: {
    m: list('Pedro Gabriel Lucas Mateus Gustavo Rafael João Felipe Bruno Thiago Rodrigo Diego Caio Vinícius Leandro Marcelo Eduardo Fernando Henrique Otávio'),
    f: list('Ana Júlia Maria Beatriz Larissa Camila Fernanda Letícia Gabriela Mariana Isabela Bruna Aline Patrícia Renata Carla Vitória Luana Sabrina Tatiana'),
  },
  MX: {
    m: list('Diego Mateo Santiago Luis Carlos Jorge Miguel Fernando Alejandro Eduardo Ricardo Emiliano Sebastián Héctor Arturo Raúl Óscar Rodrigo Iván Javier'),
    f: list('Sofía Valeria Regina Camila Ximena Fernanda Daniela Guadalupe Paola Mariana Renata Andrea Lucía Alejandra Karla Natalia Itzel Rocío Citlali Monserrat'),
  },
  ARAB: {
    m: list('Ahmed Mohammed Omar Khaled Youssef Hassan Ali Ibrahim Tariq Saeed Faisal Majid Sami Nasser Karim Walid Ziad Hamza Bilal Mustafa'),
    f: list('Fatima Aisha Maryam Nour Layla Sara Huda Amira Salma Rania Yasmin Dalia Hanan Lina Zahra Reem Noura Mona Dina Samira'),
  },
  TR: {
    m: list('Mehmet Mustafa Ahmet Ali Emre Can Burak Murat Hakan Kemal Yusuf Cem Serkan Onur Eren'),
    f: list('Ayşe Fatma Zeynep Elif Merve Esra Selin Deniz Ceren Büşra Emine Derya Gül Sibel Aylin'),
  },
  ID: {
    m: list('Budi Agus Andi Dedi Rizki Fajar Bayu Eko Hendra Wahyu Yusuf Adi Dimas Galih Putra Bagus Rudi Teguh Arif Iwan'),
    f: list('Siti Dewi Ayu Putri Rina Sri Nur Indah Wulan Fitri Lestari Maya Ratna Sari Intan Mega Tari Yuni Nisa Anisa'),
  },
  PH: {
    m: list('Juan Jose Mark Paolo Miguel Rico Jomar Angelo Carlo Ramon Rey Jun Dante Efren Nestor'),
    f: list('Maria Angel Joy Grace Rose Ligaya Althea Bea Carmela Jasmine Kristine Marites Nena Rowena Tala'),
  },
  VN: {
    m: list('Minh Hùng Tuấn Dũng Nam Hải Long Quang Sơn Bảo Khoa Huy Đức Phúc Thành'),
    f: list('Lan Hương Linh Mai Trang Ngọc Thảo Hoa Anh Vy Yến Thu Hà Chi Nga'),
  },
  TH: {
    m: list('Somchai Somsak Niran Anan Prasert Kittisak Chai Arthit Thana Wichai Nattapong Ekachai Sakda Pichai Krit'),
    f: list('Somying Malee Siriporn Nok Ploy Dao Kanya Ratana Lawan Pim Mali Suda Noi Waan Anong'),
  },
  NG: {
    m: list('Chidi Emeka Tunde Femi Segun Kunle Obinna Ibrahim Musa Sani Uche Kwame Kofi Kamau Otieno'),
    f: list('Ngozi Amaka Chioma Funke Bisi Aisha Zainab Halima Adaeze Temi Abena Akosua Wanjiku Achieng Nkechi'),
  },
};

// A device's timezone says more about where it is than its language does
const TZ_REGION = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Karachi': 'PK', 'Asia/Kathmandu': 'NP', 'Asia/Katmandu': 'NP',
  'Asia/Dhaka': 'BD', 'Asia/Dacca': 'BD', 'Asia/Colombo': 'LK', 'Asia/Thimphu': 'IN',
  'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN', 'Asia/Harbin': 'CN', 'Asia/Urumqi': 'CN', PRC: 'CN', 'Asia/Hong_Kong': 'CN', 'Asia/Macau': 'CN', 'Asia/Taipei': 'CN', 'Asia/Singapore': 'CN',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Pyongyang': 'KR',
  'Europe/Moscow': 'RU', 'Asia/Yekaterinburg': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Vladivostok': 'RU', 'Europe/Minsk': 'RU', 'Asia/Almaty': 'RU',
  'Europe/London': 'UK', 'Europe/Dublin': 'UK', 'Europe/Belfast': 'UK',
  'Europe/Berlin': 'DE', 'Europe/Vienna': 'DE', 'Europe/Zurich': 'DE', 'Europe/Busingen': 'DE',
  'Europe/Paris': 'FR', 'Europe/Brussels': 'FR', 'Europe/Luxembourg': 'FR', 'Europe/Monaco': 'FR',
  'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'America/Argentina/Buenos_Aires': 'MX', 'America/Bogota': 'MX', 'America/Lima': 'MX', 'America/Santiago': 'MX', 'America/Caracas': 'MX',
  'Europe/Rome': 'IT', 'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR',
  'America/Sao_Paulo': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR', 'America/Manaus': 'BR', 'America/Belem': 'BR', 'Europe/Lisbon': 'BR',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX', 'America/Cancun': 'MX', 'America/Merida': 'MX', 'America/Chihuahua': 'MX',
  'Asia/Dubai': 'ARAB', 'Asia/Riyadh': 'ARAB', 'Asia/Qatar': 'ARAB', 'Asia/Kuwait': 'ARAB', 'Asia/Bahrain': 'ARAB', 'Asia/Muscat': 'ARAB', 'Asia/Baghdad': 'ARAB', 'Africa/Cairo': 'ARAB', 'Africa/Casablanca': 'ARAB', 'Africa/Algiers': 'ARAB', 'Asia/Amman': 'ARAB', 'Asia/Beirut': 'ARAB',
  'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID', 'Asia/Kuala_Lumpur': 'ID', 'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Bangkok': 'TH',
  'Africa/Lagos': 'NG', 'Africa/Accra': 'NG', 'Africa/Nairobi': 'NG', 'Africa/Kampala': 'NG', 'Africa/Johannesburg': 'NG',
};
const LANG_REGION = { GB: 'UK', AE: 'ARAB', SA: 'ARAB', EG: 'ARAB', QA: 'ARAB', KW: 'ARAB', TW: 'CN', HK: 'CN', SG: 'CN', AT: 'DE', CH: 'DE', BE: 'FR', PT: 'BR', AR: 'MX', CO: 'MX', CL: 'MX', PE: 'MX', MY: 'ID', KE: 'NG', GH: 'NG', ZA: 'NG', BY: 'RU', KZ: 'RU', UA: 'RU', AU: 'UK', NZ: 'UK', IE: 'UK', CA: 'US' };

/** Which name list fits this device. */
export function detectNameRegion() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
  if (TZ_REGION[tz]) return TZ_REGION[tz];
  const langs = (typeof navigator !== 'undefined' && navigator.languages?.length) ? navigator.languages : [];
  for (const l of langs) {
    const code = (String(l).split(/[-_]/)[1] || '').toUpperCase();
    const region = LANG_REGION[code] || code;
    if (NAMES[region]) return region;
  }
  return 'US';
}

/** The name list for a game language: its own script, or Latin letters for the romanised languages. */
export const NAME_REGION_FOR = { hindi: 'IN_DEVA', hinglish: 'IN', urdu: 'PK', nepali: 'NP', bangla: 'BD', romaji: 'JP_LATIN', korean_roman: 'KR_LATIN', pinyin: 'CN_LATIN', russian_latin: 'RU_LATIN', german: 'DE', french: 'FR', portuguese: 'BR', spanish: 'MX', indonesian: 'ID', turkish: 'TR', italian: 'IT' };
export const NAME_REGIONS = Object.keys(NAMES);
export const namesOf = (region) => NAMES[region] || NAMES.US;

/** Letters and single spaces only (any alphabet), at most 12 characters. */
export function cleanName(raw) {
  return String(raw ?? '').normalize('NFC').replace(/[^\p{L}\p{M} ]/gu, '').replace(/\s+/g, ' ').trimStart().slice(0, 12);
}
export const isValidName = (s) => /^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$/u.test(s) && s.length <= 12;

const pickFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomName(gender = 'm', region = detectNameRegion()) {
  const n = namesOf(region);
  return pickFrom(gender === 'f' ? n.f : n.m);
}

/**
 * `count` different opponents, none named like anyone in `exclude`. About two in three are of the
 * other gender to the person playing (`me`: 'm' or 'f'), so a table feels mixed and lively;
 * without `me` it is half and half.
 */
export function pickOpponents(count, exclude = [], region = detectNameRegion(), me = null) {
  const taken = new Set(exclude.map(n => String(n).toLowerCase()));
  const out = [];
  const other = me === 'f' ? 'm' : 'f';
  const lean = me === 'm' || me === 'f' ? 0.65 : 0.5;
  for (let i = 0; i < count; i++) {
    const gender = Math.random() < lean ? other : (other === 'f' ? 'm' : 'f');
    const all = gender === 'f' ? namesOf(region).f : namesOf(region).m;
    const pool = all.filter(n => !taken.has(n.toLowerCase()));
    const name = pickFrom(pool.length ? pool : all);
    taken.add(name.toLowerCase());
    out.push({ name, gender });
  }
  return out;
}

/**
 * Names strangers see on a public table: a name with a swear word in it (English, Hindi or Urdu
 * in Latin letters) shows as "Player" instead. Friends who join by code see the name as typed.
 */
const RUDE = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'asshole', 'bastard', 'slut', 'whore', 'rape', 'porn', 'nude', 'sexy',
  'chutiya', 'chutia', 'madarchod', 'mc', 'bhenchod', 'behenchod', 'bc', 'gandu', 'randi', 'lauda', 'lawda', 'lund', 'bhosd', 'harami', 'kamina', 'jhaant',
];
export function politeName(name) {
  const n = String(name || '').toLowerCase().replace(/[^\p{L}]/gu, '');
  if (!n) return 'Player';
  // the two-letter ones only count as the whole name
  const rude = RUDE.some(w => (w.length <= 2 ? n === w : n.includes(w)));
  return rude ? 'Player' : String(name);
}
