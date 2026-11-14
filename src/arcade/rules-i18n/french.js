/** Comment jouer à chaque jeu, en français. Les mêmes étapes, dans le même ordre, que l'anglais de rules.js. */
export default {
  'flying-chit': {
    steps: ['Fais glisser le stick, ou utilise les flèches, W A S D ou une manette, pour diriger le papier vers le haut, le bas, la gauche et la droite.', 'Un anneau montre où ton papier va traverser le prochain bracelet : il devient vert quand tu vises juste. Près d\'un bracelet, le papier est doucement attiré vers son centre.', 'Passe dans un bracelet doré pour regagner un peu de portance. La barre sous ton score montre ce qu\'il en reste.', 'Des bracelets à la suite font un combo : ×2, ×3, jusqu\'à ×5 points chacun.', 'Rater un bracelet casse le combo. Toucher un ventilateur ou une pile de livres fait perdre beaucoup de portance.', 'Quand la portance est épuisée, le papier plane jusqu\'au sol et ton vol est terminé.', 'Chaque nouveau niveau commence par un grand bracelet doré : 10 points et la portance au maximum.'],
    win: 'Seul, tu cours après ton meilleur score. À plusieurs, tout le monde vole en même temps et le meilleur score gagne.',
    scoring: 'Chaque bracelet rapporte son combo : 1, puis 2, 3, 4 et 5 points tant que la série dure. Médailles à 50, 200, 500 et 1000 points.',
  },
  'tunnel-race': {
    steps: ['Fais glisser le stick à gauche ou à droite, ou utilise A et D, les flèches ou une manette, pour voler tout autour de l\'intérieur du tunnel.', 'Les murs rouges bloquent une partie du tunnel : contourne-les. Les murs orange bouchent tout sauf une ouverture : passe par l\'ouverture.', 'Ramasse les gemmes brillantes : 10 points chacune.', 'Toucher un mur termine ta partie. Le tunnel accélère à mesure que tu avances, et chaque niveau apporte un nouveau type de mur.'],
    win: 'Seul, bats ton meilleur score. À plusieurs, tout le monde fait la course en même temps et le meilleur score gagne.',
    scoring: 'Des points pour la distance parcourue, et 10 par gemme. Médailles à 50, 150, 300 et 600 points.',
  },
  'turbo-tunnel': {
    steps: ['Fais glisser le stick à gauche ou à droite, ou utilise A et D, les flèches ou une manette, pour tourner autour de l\'intérieur du tunnel.', 'Cônes, barrières, voitures, camions et rochers mettent fin à ta course si tu les touches. Le prochain que ta voiture va percuter brille en rouge en dessous.', 'Chaque rangée du tunnel a toujours un passage libre que tu peux atteindre à temps. De discrètes flèches vertes sur la route l\'indiquent.', 'Les pièces valent 10 points. Une plaque de nitro bleue double tes points de distance pendant trois secondes. Un bouclier vert encaisse un choc à ta place.', 'L\'huile ne t\'arrête pas, mais la voiture glisse et répond lentement au volant pendant un moment.', 'Frôler un obstacle de justesse, c\'est un « presque » : 5 points de bonus.'],
    win: 'Seul, bats ton meilleur score. Avec des amis, tout le monde roule dans le même tunnel en même temps : la dernière voiture encore en course gagne, et si tout le monde s\'écrase, le meilleur score gagne.',
    scoring: 'Des points pour la distance parcourue (doublés avec la nitro), 10 par pièce et 5 par « presque ». Médailles à 100, 300, 700 et 1500 points.',
  },
  'reaction-time': {
    steps: ["Attends tant que l'écran est rouge. Quand il devient vert, touche n'importe où (ou appuie sur Espace, Entrée ou un bouton de manette) le plus vite possible.","Toucher avant le vert, ou sur le faux signal bleu des manches 3 et 4, est un faux départ et ne rapporte rien pour cette manche.","Ton temps est mesuré sur ton propre téléphone, du moment où le vert apparaît sur ton écran jusqu'à ta touche : une connexion lente ne te ralentit jamais. Moins de 100 ms compte comme une devinette.","Il y a cinq manches. Après chacune, tu vois le temps de tout le monde, et le plus rapide de la table gagne 50 points de bonus."],
    win: "Le plus de points après cinq manches gagne. Seul, bats ton record et gagne les médailles.",
    scoring: "Chaque manche rapporte 500 moins ton temps en millisecondes : une réaction de 250 ms rapporte 250. Les faux départs et les manches ratées rapportent 0. Médailles à 600, 900, 1100 et 1300 points.",
  },
  'stroop-test': {
    steps: ["Une carte affiche le nom d'une couleur écrit dans une encre colorée. Touche le bouton de la couleur de l'ENCRE (ou la flèche indiquée dessus).","À partir de la carte 6, certaines disent « Touche le MOT » : réponds alors avec ce que dit le mot.","Seule ta première touche sur chaque carte compte, alors sois sûr avant de toucher. Les cartes 11 à 15 laissent moins de temps.","Ton temps est mesuré sur ton propre téléphone dès que la carte y apparaît : jouer en ligne avec des amis éloignés est donc équitable."],
    win: "Après quinze cartes, le plus de points gagne. Seul, bats ton record et gagne les médailles.",
    scoring: "Une bonne réponse rapporte d'autant plus qu'elle est rapide : 2000 moins ton temps en millisecondes, divisé par dix, jamais moins de 10. Une erreur ou une absence de réponse rapporte 0. Entre amis, la bonne réponse la plus rapide de chaque carte gagne 20 de plus. Médailles à 600, 1200, 1700 et 2100 points.",
  },
  'number-memory': {
    steps: ["Un nombre apparaît un instant. La barre en dessous montre combien de temps il reste.","Quand il disparaît, tape le nombre sur le pavé (ou ton clavier) et appuie sur ✓. Tu as jusqu'à 15 secondes.","Juste : le nombre suivant a un chiffre de plus. Faux : tu perds un cœur. Trois cœurs perdus, et tu es éliminé.","Chaque téléphone garde ce que tape son joueur et envoie la réponse entière sur ✓ ; les téléphones des amis ne voient jamais le nombre pendant qu'on répond."],
    win: "Seul, retiens le plus long nombre possible. Entre amis, le plus de points gagne ; la partie s'arrête quand tout le monde est éliminé ou quand le dernier en lice mène déjà.",
    scoring: "Une bonne réponse vaut dix points par chiffre : un nombre de 7 chiffres vaut 70. Médailles à 70, 150, 250 et 400 points.",
  },
  'word-guess': {
    steps: ["Tu vois un indice (comme Fruit ou Sport) et le mot en cases vides, avec une lettre visible.","Une nouvelle lettre apparaît toutes les secondes et demie. La dernière n'apparaît jamais : il faut toujours deviner.","Tape le mot entier sur le clavier de lettres (ou ton clavier) et appuie sur ✓. Un seul essai par mot.","Chaque téléphone chronomètre son joueur, et les téléphones des amis ne reçoivent que les lettres déjà visibles, jamais le mot."],
    win: "Après huit mots, le joueur qui a le plus de points gagne.",
    scoring: "Une bonne réponse vaut 10, plus 10 pour chaque lettre encore cachée au moment de l'envoi. Entre amis, la bonne réponse la plus rapide sur chaque mot rapporte 10 de plus. Une erreur ne rapporte rien pour ce mot. Médailles à 80, 160, 240 et 320 points.",
  },
  'fast-typing': {
    steps: ["« Get ready » s'affiche une seconde, puis le mot apparaît.","Tape le mot sur le clavier de lettres (ou ton clavier) et appuie sur ✓. Un seul essai par mot.","La barre sous le mot montre le temps restant : quatre secondes plus une par lettre.","Chaque téléphone chronomètre son joueur à partir du moment où le mot y est apparu : une connexion lente ne te fait jamais perdre de vitesse."],
    win: "Après dix mots, le joueur qui a le plus de points gagne.",
    scoring: "Un mot juste rapporte dix points par lettre par seconde : six lettres en deux secondes font 30. Au moins 5 par mot juste, au plus 60. Une lettre fausse et le mot ne rapporte rien. Médailles à 120, 200, 280 et 360 points.",
  },
  'bingo': {
    steps: ["Chaque joueur reçoit une grille avec 1 à 25 dans un ordre différent. Toi seul vois la tienne.","À ton tour, tape un nombre de 1 à 25 pas encore annoncé et appuie sur ✓. Tu as 15 secondes, sinon un nombre est annoncé pour toi.","Le nombre annoncé est barré sur toutes les grilles, la tienne et celles de tes amis.","Chaque ligne, colonne ou diagonale complète compte comme une ligne et allume la lettre suivante de B-I-N-G-O."],
    win: "Le premier à finir cinq lignes gagne. Si un nombre complète deux grilles en même temps, celui qui a le plus de lignes gagne ; en cas d'égalité, celui qui l'a annoncé gagne.",
    scoring: "La barre du haut montre combien de lettres de BINGO chaque joueur a allumées. Une grille compte douze lignes possibles : cinq lignes, cinq colonnes et deux diagonales.",
  },
  'unblock-puzzle': {
    steps: ["Chaque parking montre le tuk-tuk (vert, toit jaune), les véhicules autour et la sortie à droite de sa rangée.","Fais glisser un véhicule du doigt ou à la souris. Il va aussi loin que ton geste, jusqu'au premier obstacle.","Ou choisis un véhicule avec les flèches, appuie sur Hold et fais-le glisser avec les flèches. Appuie de nouveau sur Hold pour le lâcher.","Quand plus rien ne sépare le tuk-tuk de la sortie, glisse-le à droite et il sort. Tu as deux minutes par parking."],
    win: "Après cinq parkings, le joueur qui a le plus de points gagne.",
    scoring: "Sortir rapporte 50, plus jusqu'à 50 si tu le fais en peu de coups : 5 de moins par coup au-delà du meilleur. Entre amis, le premier sorti de chaque parking gagne 20 de plus. Médailles à 200, 300, 400 et 470 points.",
  },
  'hoop-flick': {
    steps: ['Tire le stick vers l\'arrière, comme un lance-pierre : le ballon partira dans l\'autre sens. Plus tu tires, plus le tir est fort.', 'Lâche le stick pour tirer. Au clavier, utilise les flèches gauche et droite pour viser, haut et bas pour la puissance, et Espace pour tirer.', 'Fais tomber le ballon dans le panier suivant par le haut.', 'Chaque panier a douze secondes : la barre rouge montre quand le temps s\'épuise.', 'Si tu rates, le ballon sort du terrain et la partie est terminée.', 'Tous les cinq paniers, un nouveau niveau : des paniers qui bougent, puis du vent, puis les deux.'],
    win: 'Seul, bats ton record. Avec un ami, chacun joue sa moitié du terrain et le meilleur score gagne.',
    scoring: 'Un panier qui touche le cercle vaut 1. Un panier propre vaut 2, et plusieurs paniers propres d\'affilée valent plus : jusqu\'à 5 points chacun. Médailles à 20, 50, 100 et 200 points.',
  },
  'ghost-hostel': {
    steps: ['Ton lit rapporte des pièces chaque seconde. Un meilleur lit rapporte plus.', 'Utilise les flèches ou les boutons pour choisir Lit, Porte, Ventilateur ou Réparer, puis appuie sur Acheter.', 'Porte : plus de solidité, et elle est réparée jusqu\'à sa nouvelle solidité. Réparer : répare une partie de la porte, puis il faut attendre quelques secondes avant la réparation suivante.', 'Les ventilateurs soufflent sur le fantôme tant qu\'il est à ta porte. Blesse-le assez et il repart en flottant dans son coin pour récupérer.', 'Le fantôme devient plus fort toutes les trente secondes, et plus furieux pendant les quarante dernières. Si ta porte cède, tu es attrapé et éliminé.'],
    win: 'Tous ceux qui sont encore dans leur chambre au lever du soleil gagnent. Chasse complètement le fantôme et la nuit se termine plus tôt. Si tout le monde est attrapé, le fantôme gagne.',
    scoring: 'Tu marques chaque pièce gagnée par ton lit, plus 100 pour avoir tenu jusqu\'à l\'aube et 150 de plus si le fantôme est chassé pour de bon.',
  },
  'pin-spin': {
    steps: ['Touche l\'écran, appuie sur le bouton Punaise, Espace ou Entrée, ou un bouton de manette pour lancer une punaise. Elle monte toujours tout droit jusqu\'au bas du tableau.', 'Attends un trou : si ta punaise touche une punaise déjà plantée, la partie est terminée.', 'Utilise toutes les punaises affichées en bas de l\'écran pour finir le niveau.', 'Plante un autocollant étoile dorée pour 5 points de bonus.', 'Un niveau sur cinq est un grand tableau : il change de vitesse et de sens.', 'Chaque niveau a une limite de temps (la fine barre en bas) : utilise toutes ses punaises avant la fin.'],
    win: 'Seul, bats ton record. À plusieurs, chacun plante sur son propre tableau en même temps et le meilleur score gagne.',
    scoring: 'Chaque punaise plantée vaut 1, chaque étoile 5, et finir un niveau rapporte deux fois le numéro du niveau. Médailles à 25, 60, 120 et 250 points.',
  },
  'bull-fight': {
    steps: ['Fais glisser le stick, ou utilise W A S D, les flèches ou une manette, pour déplacer ton taureau.', 'Appuie sur Charger pour foncer. Si l\'autre taureau est à peu près devant toi, la charge vise toute seule droit sur lui. Puis attends que la barre affiche de nouveau CHARGE READY.', 'Le cercle et la flèche sous chaque taureau montrent à qui il est et dans quelle direction il regarde. Près du bord, les sabots s\'accrochent au sable, donc tu ne sors que si on te pousse ; le bord brille en rouge et EDGE! s\'affiche quand tu es tout près.', 'Un taureau qui charge et touche l\'autre l\'envoie valser et le laisse étourdi un instant.', 'Celui qui est poussé au-delà de la ligne blanche perd la manche. Au bout d\'un moment, l\'arène commence à rétrécir.'],
    win: 'Le premier à gagner trois manches remporte le match.',
    scoring: 'Pousser l\'autre taureau dehors gagne la manche.',
  },
  'spin-duel': {
    steps: ['Glisse vite vers ton adversaire pendant les trois secondes de lancement. Le bouton Lancer est une alternative accessible.', 'Un geste plus long et plus rapide donne plus de puissance à ta toupie. Un seul lancer par manche.', 'Après le compte à rebours, les toupies tournent et se heurtent toutes seules. Garde la tienne dans l\'arène, et en train de tourner.', 'La dernière toupie qui tourne gagne la manche. Si les deux s\'arrêtent ensemble, la manche est nulle.', 'Le premier à gagner trois manches remporte le match. Si les deux joueurs ratent trois manches, le match se termine sur une égalité.'],
    win: 'Joue seul contre un bot, sur un écran, à proximité ou en ligne. Gagne des pièces en jouant et débloque des styles de toupie et d\'arène.',
    scoring: 'Tu gagnes une manche en sortant l\'autre toupie ou en tournant plus longtemps qu\'elle. Le match va au premier qui gagne trois manches.',
  },
  'pen-fight': {
    steps: ['Glisse vers ton adversaire dans les trois secondes. Le bouton Pichenette est une alternative accessible.', 'Un geste plus rapide envoie ton stylo plus fort ; ta direction choisit sa trajectoire.', 'Les stylos glissent et se heurtent tout seuls. Un stylo qui tombe du bureau ou se renverse après un choc perd la manche.', 'Si les deux stylos restent sur le bureau, celui qui finit dans la meilleure position gagne ; les manches très serrées sont nulles.', 'Le premier à gagner trois manches remporte le match. Trois manches où les deux joueurs ratent se terminent sur une égalité.'],
    win: 'Joue seul contre un bot, avec un ami sur un écran, à proximité ou en ligne. Débloque des looks de stylo et de bureau avec les pièces gagnées ; les styles sont seulement décoratifs.',
    scoring: 'Tu gagnes une manche en faisant tomber le stylo adverse du bureau, en le renversant d\'un choc puissant ou en tenant plus longtemps que lui. Le match va au premier qui gagne trois manches.',
  },
  'lapa-chupi': {
    steps: ['À chaque partie, un joueur différent cherche. Le chercheur attend contre le mur les yeux fermés pendant que les autres ont cinq secondes pour se cacher.', 'Utilise le joystick ou les flèches pour te déplacer dans la cour en 3D. Maintiens Sprint pour courir plus vite, mais seulement une seconde environ avant d\'être essoufflé.', 'Arrête-toi près d\'un buisson, d\'un banc ou d\'un jeu de la cour et ne bouge plus pour te cacher. Bouger, ou laisser le chercheur s\'approcher, te trahit.', 'Le chercheur gagne s\'il trouve tout le monde. Ceux qui sont encore cachés à la fin du temps gagnent ensemble.', 'Dans les salons en ligne, la position des joueurs cachés n\'est pas envoyée aux autres.'],
    win: 'Joue avec des joueurs ordinateur, des amis sur un écran, à proximité ou en ligne. Les bots occupent les places libres.',
    scoring: 'Le chercheur marque un point par joueur trouvé et gagne s\'il les trouve tous. Ceux qui sont encore cachés à la fin du temps gagnent ensemble et marquent plus que n\'importe quel nombre de trouvailles.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani se joue à trois ou quatre : un chat et les coureurs. Les joueurs ordinateur prennent les places libres, et le chat change à chaque partie.', 'Le chat compte jusqu\'à trois au milieu de la cour pendant que les coureurs se dispersent. Puis la poursuite commence.', 'Déplace-toi avec le joystick ou les flèches. Maintiens Sprint pour une accélération ; après une seconde environ tu es essoufflé et tu dois marcher un moment.', 'Quand le chat touche un coureur, celui-ci se fige (baraf !). Un coureur libre qui touche un ami figé le délivre (pani !).', 'Le chat gagne si tous les coureurs sont figés en même temps. Les coureurs gagnent si au moins l\'un d\'eux est encore libre à la fin du temps.'],
    win: 'Joue seul contre des coureurs ordinateur, avec des amis sur un écran, à proximité ou en ligne. Les bots occupent les places libres.',
    scoring: 'On gagne en équipe : le chat en figeant tous les coureurs, les coureurs en gardant au moins un joueur libre jusqu\'à la fin. Les gagnants marquent 1.',
  },
  'pakda-padi': {
    steps: ['Déplace-toi dans la cour avec le joystick ou les flèches. Maintiens Sprint pour une accélération ; après une seconde environ tu es essoufflé et tu dois marcher un moment.', 'Le joueur marqué IT compte jusqu\'à trois, puis poursuit les autres. Approche-toi assez pour lui passer le « chat ».', 'Une fois touché, retourne-toi et poursuis quelqu\'un d\'autre. Pas de retour immédiat : pendant deux secondes, tu ne peux pas toucher celui qui vient de te toucher.', 'À la fin du temps, le joueur qui a passé le moins de temps à être IT gagne. Une égalité est possible.'],
    win: 'Joue avec des joueurs ordinateur, des amis sur un écran, à proximité ou en ligne. Les bots occupent les places libres.',
    scoring: 'Le joueur qui a passé le moins de temps à être IT gagne. Les touches sont comptées au tableau des scores.',
  },
  'ship-fight': {
    steps: ['Déplace ton navire n\'importe où dans ta moitié de la mer. Son canon tire tout seul sur l\'autre navire, à peu près chaque seconde.', 'Chaque navire encaisse cinq tirs. Les rochers arrêtent les boulets : sers-t\'en comme abri.', 'Des caisses apparaissent au milieu : un cœur répare ton navire, et la caisse canon donne cinq tirs triples.', 'Si une manche dure trop longtemps, une tempête use les navires, en commençant par celui qui a le moins de vie.'],
    win: 'Le premier à gagner trois manches remporte le match.',
    scoring: 'Couler l\'autre navire gagne la manche.',
  },
  'road-dash': {
    steps: ['Appuie à gauche ou à droite (fais glisser le stick, A et D, ou les flèches) pour changer de voie.', 'Évite les vaches, les nids-de-poule, les bus et les autres rickshaws.', 'Ramasse des pièces pour des points en plus.', 'La route accélère à mesure que tu tiens, et environ tous les 100 points arrive un nouveau niveau avec une nouvelle circulation. Un seul accident termine ta partie.'],
    win: 'Seul, bats ton meilleur score. À plusieurs, le meilleur score gagne.',
    scoring: 'Tu marques pour la distance parcourue, et 5 par pièce.',
  },
  'backyard-rally': {
    steps: ['Déplace ta raquette vers le haut et vers le bas.', 'Renvoie la balle. Chaque coup la rend un peu plus rapide.', 'Le bord de la raquette renvoie la balle avec un angle plus fermé.', 'Si la balle passe ta raquette, l\'autre joueur marque.'],
    win: 'Le premier à sept points gagne.',
    scoring: 'Un point chaque fois que la balle passe l\'autre joueur.',
  },
  'hungry-snake': {
    steps: ['Dirige ton serpent vers le haut, le bas, la gauche ou la droite. Il n\'arrête jamais d\'avancer.', 'Mange un en-cas pour marquer un point et grandir.', 'Heurter un mur, toi-même ou un autre serpent termine ta partie.', 'À plusieurs, le dernier serpent encore en mouvement gagne 3 points de bonus.'],
    win: 'Seul, bats ton meilleur score. À plusieurs, le meilleur score gagne.',
    scoring: 'Un point par en-cas, plus 3 pour le dernier restant.',
  },
  ludo: {
    steps: ['Touche Lancer à ton tour. Il faut un six pour sortir un pion de l\'écurie et le poser sur ta case de départ.', 'Touche un pion qui brille, ou son bouton, pour l\'avancer du nombre obtenu. Même quand un seul pion peut bouger, c\'est toi qui le touches ; si aucun ne peut bouger, ton tour se termine.', 'Tombe sur un pion adverse et il retourne à son écurie. Les cases de départ et les cases étoile sont protégées : personne ne peut y être pris.', 'Après le tour du plateau, le pion remonte ta colonne d\'arrivée. Pour arriver, il faut le nombre exact.', 'Un six, une prise et un pion arrivé donnent chacun un nouveau lancer. Trois six d\'affilée font perdre le tour.'],
    win: 'Mode Normal : le premier à ramener ses quatre pions gagne. Mode Points : le plus de points gagne, quand les 15 tours sont finis ou quand quelqu\'un a ramené ses quatre pions.',
    scoring: 'Choisis le mode avant de jouer. En mode Normal il n\'y a pas de points : le tableau final montre les pions ramenés par chaque joueur. En mode Points, chaque case avancée vaut 1, une prise 20, un pion arrivé 30, et finir ses quatre pions en premier rapporte un bonus de 50.',
    house: [['Barrages', 'Deux pions de la même couleur sur la même case du parcours forment un barrage. Personne d\'autre ne peut le franchir ni s\'y arrêter, et ses pions ne peuvent pas être pris.'], ['Prendre pour rentrer', 'Un pion ne peut entrer dans sa colonne d\'arrivée qu\'après que son joueur a pris au moins un pion adverse. D\'ici là, il refait le tour du plateau.'], ['Départ rapide', 'Chaque joueur commence avec un pion déjà sur sa case de départ, pour que la partie démarre tout de suite.'], ['Jouer pour les places', 'À trois ou quatre joueurs, la partie ne s\'arrête pas au gagnant : les autres continuent pour la deuxième et la troisième place, et l\'ordre d\'arrivée s\'affiche à la fin.']],
  },
  carrom: {
    steps: ['La place 1 joue les pions blancs et la place 2 les noirs. Il y en a neuf de chaque, plus la reine rouge au centre.', 'Place ton palet sur la ligne de base avec le curseur Palet, choisis la direction avec Viser et la force avec Puissance, puis tire.', 'Empoche un de tes pions et tu rejoues. Sinon, la main passe.', 'La reine doit être couverte. Après l\'avoir empochée, empoche un de tes pions dans le même coup ou le suivant, sinon elle retourne au centre.', 'Si le palet tombe dans une poche, c\'est une faute : un de tes pions empochés revient au centre et ton tour se termine.', 'La reine doit être sortie avant que le dernier pion de quelqu\'un puisse rester empoché.'],
    win: 'Le premier à empocher tous ses pions, avec la reine couverte, gagne. Après 80 coups, celui à qui il reste le moins de pions gagne.',
    scoring: 'Le gagnant marque 1 point par pion encore sur le plateau chez l\'autre joueur, plus 3 s\'il a la reine.',
  },
  chess: {
    steps: ['Les Blancs jouent en premier, puis les joueurs alternent. Touche une pièce, puis une case marquée.', 'La tour se déplace en ligne droite, le fou en diagonale, la dame des deux façons, le cavalier saute en L et le roi avance d\'une case.', 'Le pion avance d\'une case, ou de deux à son premier coup, et prend en diagonale d\'une case vers l\'avant. Sur la dernière rangée, il devient dame, tour, fou ou cavalier.', 'Roque : si le roi et une tour n\'ont pas bougé, que les cases entre eux sont vides et que le roi ne traverse pas d\'échec, le roi se déplace de deux cases vers la tour, qui saute par-dessus lui.', 'Prise en passant : juste après qu\'un pion avance de deux cases à côté du tien, tu peux le prendre comme s\'il n\'avait avancé que d\'une.', 'Un roi attaqué est en échec. À ton coup, tu dois sortir de l\'échec.'],
    win: 'L\'échec et mat gagne : le roi est en échec sans échappatoire. La partie est nulle par pat (aucun coup légal sans être en échec), la même position trois fois, cinquante coups chacun sans prise ni coup de pion, ou trop peu de pièces pour mater.',
    scoring: 'Une partie se termine par une victoire ou une nulle. Le tableau final affiche 1 pour le gagnant.',
  },
  'snakes-and-ladders': {
    steps: ['Tout le monde commence hors du plateau, avant la case 1. Les joueurs lancent le dé chacun à leur tour.', 'Avance ton pion du nombre obtenu, en suivant les numéros du plateau.', 'Tombe au pied d\'une échelle et tu grimpes en haut. Tombe sur la tête d\'un serpent et tu glisses jusqu\'à sa queue.', 'Un six donne un nouveau lancer.', 'La case 100 demande le nombre exact. Si le lancer te ferait la dépasser, ton pion reste où il est.'],
    win: 'Le premier à tomber exactement sur la case 100 gagne.',
    scoring: 'Il n\'y a pas de points pendant la partie. Le tableau final montre la case atteinte par chaque joueur.',
    house: [['Commencer avec un 6', 'Un pion attend hors du plateau jusqu\'à ce que son joueur fasse un 6. Le 6 le pose sur la case 1, et ce joueur relance.'], ['Rebond', 'Un lancer qui dépasse 100 rebondit : depuis 97, un 5 va à 100 puis recule de deux cases jusqu\'à 98. Les serpents et les échelles comptent là où il s\'arrête.'], ['Trois six', 'Trois six d\'affilée renvoient le pion là où il était au début du tour, et la main passe.']],
  },
  'color-clash': {
    steps: ['Chacun reçoit sept cartes. Une carte commence la pile.', 'À ton tour, joue une carte de la même couleur, du même chiffre ou du même symbole que celle du dessus.', 'Passe (⊘) saute le joueur suivant. Demi-tour (⇄) inverse le sens ; à deux joueurs, il agit comme Passe. +2 fait piocher deux cartes au joueur suivant, qui passe son tour.', 'Une carte Arc-en-ciel se pose sur n\'importe quoi et tu choisis la couleur suivante. Arc-en-ciel +4 fait pareil, et le joueur suivant pioche quatre cartes et passe son tour.', 'Rien à jouer ? Pioche une carte. Tu peux la jouer si elle va ; sinon, passe.'],
    win: 'Le premier à 150 points gagne. Si personne n\'y arrive en cinq manches, le meilleur score gagne.',
    scoring: 'Celui qui vide sa main marque les cartes restées dans la main des autres : les chiffres valent leur valeur, les cartes action 20, les cartes Arc-en-ciel 50.',
    house: [['Cumul', 'Touché par un +2 ? Pose ton propre +2 ou un Arc-en-ciel +4 dessus et la sanction passe au joueur suivant, plus grosse. Un +4 ne peut être contré que par un autre +4. Celui qui ne peut pas (ou ne veut pas) pioche tout et passe son tour.'], ['Piocher jusqu\'à pouvoir jouer', 'Sans carte à jouer, tu continues de piocher jusqu\'à en avoir une qui va, puis tu peux la jouer.']],
  },
  'call-break': {
    steps: ['Les 52 cartes sont distribuées, 13 par joueur.', 'Chaque joueur annonce un nombre de plis de 1 à 8, en commençant par le joueur après le donneur.', 'Le premier joueur entame avec n\'importe quelle carte. Dans l\'ordre, chacun doit fournir la même couleur, et battre la meilleure carte jouée s\'il le peut.', 'Sans la couleur demandée, tu dois jouer un pique, et battre le plus fort pique si tu le peux. Sans pique, joue n\'importe quoi.', 'Le plus fort pique remporte le pli ; sans pique, la plus forte carte de la couleur demandée. Le gagnant entame le pli suivant.'],
    win: 'Après cinq manches, le meilleur total gagne.',
    scoring: 'Réussis ton annonce et tu marques le nombre annoncé, plus 0,1 par pli en trop. Rate-la et tu perds le nombre annoncé.',
  },
  'crazy-eights': {
    steps: ['Chaque joueur reçoit sept cartes à deux, cinq à plus. Une carte commence la pile.', 'À ton tour, joue une carte de la même couleur ou de la même valeur que celle du dessus.', 'Un huit se joue sur n\'importe quelle carte, et tu annonces la couleur qui doit suivre.', 'Rien à jouer ? Pioche une carte. Joue-la si tu peux ; sinon, passe.', 'La manche se termine quand quelqu\'un n\'a plus de cartes.'],
    win: 'Après trois manches, le joueur avec le moins de points de pénalité gagne.',
    scoring: 'Les cartes qui restent dans ta main comptent contre toi : un huit vaut 50, un roi, une dame ou un valet 10, un as 1, et toute autre carte sa valeur.',
    house: [['Les deux font piocher deux', 'Un 2 fait piocher deux cartes au joueur suivant, qui passe son tour, sauf s\'il joue lui aussi un 2 : alors le suivant pioche quatre, et ainsi de suite.'], ['Les valets sautent', 'Un valet fait passer son tour au joueur suivant.'], ['Les as inversent', 'Un as inverse le sens du jeu. À deux joueurs, tu rejoues.']],
  },
  checkers: {
    steps: ['Les pions avancent d\'une case en diagonale vers une case foncée libre. Touche un pion, puis une case marquée.', 'Pour prendre, saute en diagonale par-dessus un pion adverse jusqu\'à la case libre derrière. Le pion pris est retiré.', 'Si tu peux prendre, tu dois prendre, et si le même pion peut sauter encore, il doit continuer.', 'Un pion qui atteint la dernière rangée devient une dame, et le tour s\'arrête là. Les dames se déplacent et sautent en diagonale vers l\'avant comme vers l\'arrière.'],
    win: 'Tu gagnes quand l\'autre joueur n\'a plus de pions ou plus de coup légal. Quarante coups chacun sans prise ni coup de pion simple, c\'est nul.',
    scoring: 'Une partie se termine par une victoire ou une nulle. Le tableau final affiche 1 pour le gagnant.',
  },
  'four-in-a-row': {
    steps: ['Les joueurs lâchent à tour de rôle un jeton dans une colonne où il reste de la place.', 'Le jeton tombe jusqu\'à la case libre la plus basse de cette colonne.', 'Aligne quatre de tes jetons, en ligne, en colonne ou en diagonale, et tu gagnes aussitôt.'],
    win: 'Le premier alignement de quatre gagne. Si la grille se remplit sans alignement, c\'est nul.',
    scoring: 'Une partie se termine par une victoire ou une nulle. Le tableau final affiche 1 pour le gagnant.',
  },
  'tic-tac-toe': {
    steps: ['Un joueur a les ✕ et l\'autre les ◯. Les ✕ commencent.', 'Chacun à son tour prend une case libre.', 'Trois de tes marques alignées, en ligne, en colonne ou en diagonale, et tu gagnes.'],
    win: 'Le premier à aligner trois marques gagne. Si les neuf cases se remplissent sans alignement, c\'est nul.',
    scoring: 'Une partie se termine par une victoire ou une nulle. Le tableau final affiche 1 pour le gagnant.',
  },
  reversi: {
    steps: ['La partie commence avec quatre pions au centre. Les Noirs jouent en premier.', 'Pose un pion sur une case marquée. Un coup doit encadrer au moins un pion adverse en ligne droite entre le nouveau pion et un autre des tiens.', 'Tous les pions encadrés se retournent à ta couleur, dans toutes les directions à la fois.', 'Si tu n\'as aucun coup légal, ton tour est passé. La partie se termine quand aucun joueur ne peut jouer.'],
    win: 'Le joueur avec le plus de pions à la fin gagne. À égalité, c\'est nul.',
    scoring: 'Ton score est le nombre de pions de ta couleur à la fin.',
  },
  'dots-and-boxes': {
    steps: ['Chacun à son tour trace un trait entre deux points voisins.', 'Si ton trait ferme le quatrième côté d\'une case, elle est à toi, et tu dois rejouer.', 'La partie se termine quand tous les traits sont tracés.'],
    win: 'Le joueur avec le plus de cases gagne. Si tout le monde est à égalité, c\'est nul.',
    scoring: 'Chaque case que tu fermes vaut un point.',
  },
  mancala: {
    steps: ['Chaque joueur a six trous de son côté et un grenier au bout, à droite. Touche un de tes trous qui contient des graines.', 'Toutes les graines de ce trou sont semées une par une, dans le sens inverse des aiguilles d\'une montre, dans les trous suivants. Tu passes par ton grenier en y déposant une graine, mais tu sautes celui de l\'adversaire.', 'Si ta dernière graine tombe dans ton grenier, tu rejoues.', 'Si ta dernière graine tombe dans un trou vide de ton côté et que le trou d\'en face contient des graines, tu les prends toutes, plus ta propre graine.', 'Quand un côté n\'a plus de graines, l\'autre joueur garde celles qui restent de son côté.'],
    win: 'Le joueur avec le plus de graines dans son grenier gagne. À égalité, c\'est nul.',
    scoring: 'Chaque graine dans ton grenier vaut un point.',
  },
  'nine-mens-morris': {
    steps: ['Pose : chacun à son tour pose un pion sur un point libre jusqu\'à ce que chaque joueur en ait posé neuf.', 'Déplacement : ensuite, chacun à son tour glisse un pion le long d\'une ligne vers un point voisin libre.', 'Chaque fois que tu formes un nouvel alignement de trois, un moulin, retire un pion adverse. Les pions d\'un moulin sont protégés, sauf si tous sont dans des moulins.', 'Vol : quand il ne te reste que trois pions, ils peuvent sauter sur n\'importe quel point libre.'],
    win: 'Tu gagnes quand l\'autre joueur n\'a plus que deux pions ou plus de coup légal. Cinquante coups chacun sans prise, c\'est nul.',
    scoring: 'Une partie se termine par une victoire ou une nulle. Le tableau final affiche 1 pour le gagnant.',
  },
  'memory-match': {
    steps: ['À ton tour, touche deux cartes pour les retourner. Tous les joueurs peuvent les voir.', 'Si elles vont ensemble, tu gardes la paire et tu rejoues.', 'Sinon, elles se retournent au début du tour du joueur suivant, et la main passe.'],
    win: 'Quand toutes les paires sont trouvées, le joueur qui en a le plus gagne. Si tout le monde est à égalité, c\'est nul.',
    scoring: 'Chaque paire vaut un point.',
  },
  yacht: {
    steps: ['Lance les cinq dés. Touche ceux que tu veux garder, puis relance les autres. Tu peux le faire jusqu\'à trois lancers par tour.', 'Après n\'importe quel lancer, tu peux t\'arrêter et marquer dans une catégorie pas encore utilisée.', 'Les As à Six marquent le total de ce nombre. Chance marque le total de tous les dés.', 'Carré marque le total de ces quatre dés. Full (trois d\'un et deux d\'un autre) marque le total des cinq.', 'Petite suite (1–5) et Grande suite (2–6) valent 30. Yacht (les cinq identiques) vaut 50.', 'Si rien ne va, tu dois quand même choisir une catégorie, même à 0.'],
    win: 'Après douze tours chacun, le meilleur total gagne.',
    scoring: 'Ton total est la somme des douze catégories.',
    house: [['Bonus du haut', 'Fais 63 ou plus des As aux Six réunis (soit trois de chaque nombre) et tu gagnes 35 points de plus à la fin.']],
  },
  pig: {
    steps: ['À ton tour, lance le dé. Tout nombre de 2 à 6 s\'ajoute à ton total du tour.', 'Relance autant que tu veux, ou arrête-toi pour mettre en banque le total du tour.', 'Si tu fais 1, tu perds le total du tour et la main passe.'],
    win: 'Atteins l\'objectif (50 en Rapide, 100 en Classique et en Deux dés) et tous les autres ont encore un dernier tour pour te battre. Ensuite, la plus grosse banque gagne.',
    scoring: 'Seuls les points mis en banque comptent.',
  },
  werewolf: {
    steps: ['Chacun lit en secret son rôle : Loup-garou, Voyante, Docteur ou Villageois.', 'Nuit : les loups-garous choisissent un joueur à attraper, la Voyante choisit un joueur dont elle découvre le rôle, et le Docteur choisit un joueur à protéger.', 'Matin : le village apprend qui a été attrapé pendant la nuit, sauf si le Docteur l\'a protégé.', 'Jour : discutez dans le chat, puis tous ceux qui sont encore en jeu votent contre le joueur qu\'ils croient loup-garou. Le plus désigné quitte la partie et son rôle est révélé. En cas d\'égalité, personne ne part.', 'La nuit retombe, et la partie continue jusqu\'à ce qu\'un camp gagne.'],
    win: 'Le village gagne dès que tous les loups-garous ont été éliminés par le vote. Les loups-garous gagnent quand ils sont aussi nombreux que les autres.',
    scoring: 'Tout le camp gagnant gagne : les loups-garous ensemble, ou la Voyante, le Docteur et les Villageois ensemble. À neuf joueurs ou plus, il y a deux loups-garous.',
  },
  'who-is-the-spy': {
    steps: ['Chaque joueur lit son mot secret.', 'Chacun son tour autour de la table, chaque joueur joue une carte indice pour son mot.', 'Lisez les indices, puis tout le monde vote en secret pour le joueur qu\'il soupçonne.', 'Le joueur avec le plus de voix est accusé. En cas d\'égalité, personne ne l\'est, et l\'espion s\'en sort.', 'Si l\'espion est démasqué, il a une seule chance de deviner le mot des autres parmi quatre propositions.'],
    win: 'Après trois manches, le joueur avec le plus de points gagne.',
    scoring: 'Un espion qui s\'en sort marque 3. Un espion démasqué qui devine le mot marque 2 ; s\'il se trompe, tous les autres marquent 1. À huit joueurs ou plus, il y a deux espions.',
  },
  'truth-or-dare': {
    steps: ['À ton tour, choisis Action ou Vérité.', 'Lis le défi, puis réponds à voix haute ou fais-le.', 'Touche Fait pour un point, ou touche Passer. Passer n\'est jamais pénalisé.', 'Le tour passe au joueur suivant.'],
    win: 'Le joueur avec le plus de points après le dernier tour gagne, même si le vrai but, ce sont les fous rires.',
    scoring: 'Chaque vérité dite et chaque action faite rapporte 1 point. Passer ne coûte rien.',
  },
  'riddle-chits': {
    steps: ['Une devinette s\'ouvre sur le papier, pour que tout le monde la lise.', 'Choisis la réponse que tu crois juste. Personne ne voit ton choix avant que tout le monde ait répondu.', 'Pas sûr ? Demande un indice avant de répondre. Il réduit tes points pour cette devinette.', 'La réponse et les choix de chacun s\'affichent, puis le papier suivant s\'ouvre.'],
    win: 'Le joueur avec le plus de points après la dernière devinette gagne.',
    scoring: 'Une bonne réponse rapporte 2 points, ou 1 si tu as pris l\'indice. Une mauvaise réponse ne rapporte rien.',
  },
  'majority-vote': {
    steps: ['Une question s\'ouvre avec quelques réponses possibles.', 'Chacun choisit en secret la réponse qu\'il pense que la majorité va choisir.', 'Quand tout le monde a choisi, les totaux s\'affichent en barres.', 'Tous ceux qui ont choisi la réponse la plus populaire marquent un point.'],
    win: 'Le joueur avec le plus de points après la dernière question gagne.',
    scoring: 'Un point chaque fois que tu choisis la réponse de la majorité. Si deux réponses sont à égalité en tête, les deux comptent.',
  },
  consequences: {
    steps: ['Chacun son tour, chaque joueur ajoute une phrase pour la partie affichée, sans voir les précédentes.', 'Entre amis, tu tapes tes propres phrases. À une table avec des inconnus, tu choisis parmi des phrases écrites par nous, pour que personne ne puisse envoyer quelque chose de méchant.', 'Sept parties font une histoire : qui, a rencontré qui, où, ce que chacun a dit, ce qui s\'est passé, et ce qu\'en a dit le monde.', 'Ensuite, l\'histoire se déplie pour que tout le monde la lise.'],
    win: 'Tout le monde gagne quand l\'histoire fait rire toute la table.',
    scoring: 'Il n\'y a pas de points : la meilleure histoire remporte la salle.',
  },
};
