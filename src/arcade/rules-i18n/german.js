/** So spielst du jedes Spiel, auf Deutsch. Dieselben Schritte in derselben Reihenfolge wie das Englische in rules.js. */
export default {
  'flying-chit': {
    steps: ['Zieh den Stick, oder nimm die Pfeiltasten, W A S D oder ein Gamepad, um den Zettel nach oben, unten, links und rechts zu lenken.', 'Ein Ring zeigt, wo dein Zettel den nächsten Armreif durchfliegt: Er wird grün, wenn du genau zielst. In der Nähe eines Armreifs wird der Zettel sanft zu seiner Mitte gezogen.', 'Flieg durch einen goldenen Armreif, um etwas Auftrieb zurückzubekommen. Der Balken unter deinem Punktestand zeigt, wie viel noch übrig ist.', 'Armreifen hintereinander bilden eine Kombo: ×2, ×3, bis zu ×5 Punkte pro Armreif.', 'Verpasst du einen Armreif, endet die Kombo. Ein Ventilator oder ein Bücherstapel kostet viel Auftrieb.', 'Ist der Auftrieb aufgebraucht, gleitet der Zettel zu Boden und dein Flug ist vorbei.', 'Jedes neue Level beginnt mit einem großen goldenen Armreif: 10 Punkte und voller Auftrieb.'],
    win: 'Allein jagst du deinen eigenen Rekord. Mit anderen fliegen alle gleichzeitig, und die höchste Punktzahl gewinnt.',
    scoring: 'Jeder Armreif bringt seine Kombo: 1, dann 2, 3, 4 und 5 Punkte, solange die Serie hält. Medaillen bei 50, 200, 500 und 1000 Punkten.',
  },
  'tunnel-race': {
    steps: ['Zieh den Stick nach links oder rechts, oder nimm A und D, die Pfeiltasten oder ein Gamepad, um innen rund um den Tunnel zu fliegen.', 'Rote Wände versperren einen Teil des Tunnels: Flieg daran vorbei. Orange Wände füllen alles bis auf eine Lücke: Flieg durch die Lücke.', 'Sammle die leuchtenden Edelsteine, je 10 Punkte.', 'Berührst du eine Wand, ist dein Lauf vorbei. Der Tunnel wird schneller, je weiter du kommst, und jedes neue Level bringt eine neue Art Wand.'],
    win: 'Allein schlägst du deinen eigenen Rekord. Mit anderen fliegen alle gleichzeitig, und die höchste Punktzahl gewinnt.',
    scoring: 'Punkte für die geflogene Strecke und 10 für jeden Edelstein. Medaillen bei 50, 150, 300 und 600 Punkten.',
  },
  'turbo-tunnel': {
    steps: ['Zieh den Stick nach links oder rechts, oder nimm A und D, die Pfeiltasten oder ein Gamepad, um innen rund um den Tunnel zu lenken.', 'Hütchen, Absperrungen, Autos, Lastwagen und Felsen beenden dein Rennen, wenn du sie berührst. Das Nächste, in das dein Auto gleich kracht, leuchtet unten rot.', 'Jede Reihe im Tunnel hat immer eine freie Durchfahrt, die du rechtzeitig erreichen kannst. Dezente grüne Pfeile auf der Fahrbahn zeigen sie an.', 'Münzen bringen 10 Punkte. Ein blaues Nitro-Feld verdoppelt drei Sekunden lang deine Streckenpunkte. Ein grünes Schild fängt einen Aufprall für dich ab.', 'Öl hält dich nicht auf, aber das Auto rutscht und reagiert einen Moment lang träge aufs Lenkrad.', 'Haarscharf an etwas vorbei ist ein Beinahe-Crash: 5 Bonuspunkte.'],
    win: 'Allein schlägst du deinen eigenen Rekord. Mit Freunden fahren alle gleichzeitig im selben Tunnel: Das letzte Auto, das noch fährt, gewinnt, und wenn alle crashen, die höchste Punktzahl.',
    scoring: 'Punkte für die gefahrene Strecke (doppelt mit Nitro), 10 für jede Münze und 5 für jeden Beinahe-Crash. Medaillen bei 100, 300, 700 und 1500 Punkten.',
  },
  'reaction-time': {
    steps: ["Warte, solange der Bildschirm rot ist. Wird er grün, tippe irgendwo (oder drück Leertaste, Enter oder eine Gamepad-Taste), so schnell du kannst.","Tippen vor Grün oder beim blauen Fake-Signal in Runde 3 und 4 ist ein Fehlstart und bringt in dieser Runde nichts.","Deine Zeit wird auf deinem eigenen Handy gemessen, vom Erscheinen von Grün auf deinem Bildschirm bis zu deinem Tipp: Eine langsame Verbindung macht dich nie langsamer. Unter 100 ms zählt als Raten.","Es gibt fünf Runden. Nach jeder siehst du die Zeiten aller, und der Schnellste am Tisch bekommt 50 Bonuspunkte."],
    win: "Die meisten Punkte nach fünf Runden gewinnen. Allein schlägst du deinen Rekord und holst die Medaillen.",
    scoring: "Jede Runde bringt 500 minus deine Zeit in Millisekunden: Eine Reaktion von 250 ms bringt 250. Fehlstarts und verpasste Runden bringen 0. Medaillen bei 600, 900, 1100 und 1300 Punkten.",
  },
  'stroop-test': {
    steps: ["Eine Karte zeigt ein Farbwort in farbiger Tinte. Tippe die Taste der TINTEN-Farbe (oder drück den Pfeil, der darauf steht).","Ab Karte 6 steht auf manchen Karten „Tippe das WORT“: Dann antworte mit dem, was das Wort sagt.","Nur dein erster Tipp pro Karte zählt, also sei dir sicher. Die Karten 11 bis 15 geben dir weniger Zeit.","Deine Zeit wird auf deinem eigenen Handy gemessen, ab dem Moment, in dem die Karte dort erscheint: Online gegen Freunde weit weg ist also fair."],
    win: "Nach fünfzehn Karten gewinnen die meisten Punkte. Allein schlägst du deinen Rekord und holst die Medaillen.",
    scoring: "Eine richtige Antwort zählt umso mehr, je schneller sie ist: 2000 minus deine Zeit in Millisekunden, geteilt durch zehn, mindestens 10. Falsch oder keine Antwort zählt 0. Mit Freunden bekommt die schnellste richtige Antwort jeder Karte 20 extra. Medaillen bei 600, 1200, 1700 und 2100 Punkten.",
  },
  'number-memory': {
    steps: ["Eine Zahl erscheint kurz. Der Balken darunter zeigt, wie lange sie bleibt.","Ist sie weg, tippe die Zahl auf dem Ziffernfeld (oder der Tastatur) und drück ✓. Du hast bis zu 15 Sekunden.","Richtig: Die nächste Zahl hat eine Ziffer mehr. Falsch: Du verlierst ein Herz. Drei Herzen weg, und du bist raus.","Jedes Handy behält, was sein Spieler tippt, und sendet die ganze Antwort mit ✓; die Handys der Freunde sehen die Zahl nie, während geantwortet wird."],
    win: "Allein merkst du dir die längste Zahl, die du kannst. Mit Freunden gewinnen die meisten Punkte; das Spiel endet, wenn alle raus sind oder der Letzte im Spiel schon vorn liegt.",
    scoring: "Eine richtige Antwort bringt zehn Punkte pro Ziffer: Eine 7-stellige Zahl ist 70 wert. Medaillen bei 70, 150, 250 und 400 Punkten.",
  },
  'word-guess': {
    steps: ["Du siehst einen Hinweis (etwa Fruit oder Sport) und das Wort als leere Felder, ein Buchstabe ist sichtbar.","Alle anderthalb Sekunden erscheint ein weiterer Buchstabe. Der letzte erscheint nie, raten musst du also immer.","Tippe das ganze Wort auf der Buchstabentastatur (oder deiner Tastatur) und drücke ✓. Pro Wort gibt es nur einen Versuch.","Jedes Handy misst die Zeit seines Spielers selbst, und die Handys der Freunde bekommen nur die schon sichtbaren Buchstaben, nie das Wort."],
    win: "Nach acht Wörtern gewinnt, wer die meisten Punkte hat.",
    scoring: "Ein Treffer bringt 10, plus 10 für jeden Buchstaben, der beim Absenden noch versteckt war. Mit Freunden bekommt der schnellste Treffer pro Wort 10 extra. Ein falscher Versuch bringt für dieses Wort nichts. Medaillen bei 80, 160, 240 und 320 Punkten.",
  },
  'fast-typing': {
    steps: ["Eine Sekunde lang steht „Get ready“ da, dann erscheint das Wort.","Tippe das Wort auf der Buchstabentastatur (oder deiner Tastatur) und drücke ✓. Pro Wort gibt es nur einen Versuch.","Der Balken unter dem Wort zeigt die Restzeit: vier Sekunden plus eine pro Buchstabe.","Jedes Handy misst die Zeit seines Spielers ab dem Moment, in dem das Wort dort erschien, eine langsame Verbindung kostet also nie Tempo."],
    win: "Nach zehn Wörtern gewinnt, wer die meisten Punkte hat.",
    scoring: "Ein richtiges Wort bringt zehn Punkte pro Buchstabe pro Sekunde: sechs Buchstaben in zwei Sekunden sind 30. Mindestens 5 pro richtigem Wort, höchstens 60. Ein falscher Buchstabe und das Wort bringt nichts. Medaillen bei 120, 200, 280 und 360 Punkten.",
  },
  'bingo': {
    steps: ["Jeder bekommt eine Karte mit 1 bis 25 in eigener Reihenfolge. Nur du siehst deine Karte.","Wenn du dran bist, tippe eine Zahl von 1 bis 25, die noch nicht gerufen wurde, und drücke ✓. Du hast 15 Sekunden, sonst wird eine Zahl für dich gerufen.","Die gerufene Zahl wird auf allen Karten gestrichen, auf deiner und auf denen deiner Freunde.","Jede volle Reihe, Spalte oder Diagonale ist eine Linie und lässt den nächsten Buchstaben von B-I-N-G-O aufleuchten."],
    win: "Wer zuerst fünf Linien hat, gewinnt. Schließt eine Zahl zwei Karten zugleich ab, gewinnt, wer mehr Linien hat; bei Gleichstand gewinnt, wer sie gerufen hat.",
    scoring: "Die Leiste oben zeigt, wie viele Buchstaben von BINGO jeder schon hat. Eine Karte hat zwölf mögliche Linien: fünf Reihen, fünf Spalten und zwei Diagonalen.",
  },
  'unblock-puzzle': {
    steps: ["Jeder Parkplatz zeigt die Rikscha (grün, gelbes Dach), die Fahrzeuge drumherum und das Tor rechts in ihrer Reihe.","Zieh ein Fahrzeug mit dem Finger oder der Maus, um es zu schieben. Es fährt so weit du ziehst, bis zum ersten Hindernis.","Oder wähle ein Fahrzeug mit den Pfeilen, drücke Hold und schiebe es mit den Pfeilen. Drücke Hold erneut zum Loslassen.","Ist nichts mehr zwischen Rikscha und Tor, schieb sie nach rechts und sie fährt hinaus. Pro Parkplatz hast du zwei Minuten."],
    win: "Nach fünf Parkplätzen gewinnt, wer die meisten Punkte hat.",
    scoring: "Herauskommen bringt 50, dazu bis zu 50 für wenige Züge: 5 weniger für jeden Zug über dem besten. Mit Freunden bekommt, wer zuerst draußen ist, 20 extra. Medaillen bei 200, 300, 400 und 470 Punkten.",
  },
  'hoop-flick': {
    steps: ['Zieh den Stick nach hinten wie eine Steinschleuder: Der Ball fliegt in die Gegenrichtung. Je weiter du ziehst, desto kräftiger der Wurf.', 'Lass den Stick los, um zu werfen. Mit Tasten drehst du mit Links und Rechts das Ziel, stellst mit Hoch und Runter die Kraft ein und wirfst mit der Leertaste.', 'Bring den Ball dazu, von oben durch den nächsten Korb zu fallen.', 'Jeder Korb hat zwölf Sekunden: Der rote Balken zeigt, wenn die Zeit knapp wird.', 'Daneben, und der Ball fällt aus dem Feld: Der Lauf ist vorbei.', 'Alle fünf Körbe kommt ein neues Level: Körbe, die sich bewegen, dann Wind, dann beides.'],
    win: 'Allein schlägst du deinen Rekord. Mit einem Freund spielt jeder auf seiner Hälfte des Felds, und die höhere Punktzahl gewinnt.',
    scoring: 'Ein Korb, der den Ring berührt, zählt 1. Ein sauberer Korb zählt 2, und saubere Körbe hintereinander zählen mehr: bis zu 5 Punkte pro Korb. Medaillen bei 20, 50, 100 und 200 Punkten.',
  },
  'ghost-hostel': {
    steps: ['Dein Bett bringt jede Sekunde Münzen. Ein besseres Bett bringt mehr.', 'Wähle mit den Pfeilen oder den Tasten Bett, Tür, Ventilator oder Reparieren und drück auf Kaufen.', 'Tür: mehr Stärke, und sie wird bis zur neuen Stärke repariert. Reparieren: flickt einen Teil der Tür und braucht danach ein paar Sekunden bis zur nächsten Reparatur.', 'Ventilatoren pusten den Geist an, solange er an deiner Tür ist. Setzt du ihm genug zu, schwebt er zurück in seine Ecke, um sich zu erholen.', 'Der Geist wird alle dreißig Sekunden stärker und in den letzten vierzig wütender. Bricht deine Tür, bist du gefangen und raus.'],
    win: 'Alle, die bei Sonnenaufgang noch in ihrem Zimmer sind, gewinnen. Vertreibst du den Geist ganz, endet die Nacht früher. Werden alle gefangen, gewinnt der Geist.',
    scoring: 'Du bekommst jede Münze, die dein Bett verdient hat, dazu 100 fürs Durchhalten bis zum Morgen und noch 150, wenn der Geist für immer vertrieben ist.',
  },
  'pin-spin': {
    steps: ['Tipp auf den Bildschirm, drück die Pin-Taste, Leertaste oder Enter oder eine Gamepad-Taste, um eine Pinnnadel abzuschießen. Sie fliegt immer gerade nach oben in die Unterseite der Scheibe.', 'Warte auf eine Lücke: Berührt deine Nadel eine, die schon steckt, ist der Lauf vorbei.', 'Verbrauche alle Nadeln unten am Bildschirm, um das Level zu schaffen.', 'Triff einen goldenen Stern-Sticker für 5 Bonuspunkte.', 'Jedes fünfte Level ist eine große Scheibe: Sie ändert Tempo und Richtung.', 'Jedes Level hat ein Zeitlimit (der dünne Balken unten): Verbrauche alle Nadeln, bevor es abläuft.'],
    win: 'Allein schlägst du deinen Rekord. Mit anderen pinnt jeder gleichzeitig auf seine eigene Scheibe, und die höchste Punktzahl gewinnt.',
    scoring: 'Jede Nadel, die steckt, zählt 1, jeder Stern 5, und ein geschafftes Level zählt das Doppelte seiner Nummer. Medaillen bei 25, 60, 120 und 250 Punkten.',
  },
  'bull-fight': {
    steps: ['Zieh den Stick, oder nimm W A S D, die Pfeiltasten oder ein Gamepad, um deinen Stier zu bewegen.', 'Drück Angriff, um nach vorn zu stürmen. Steht der andere Stier ungefähr vor dir, zielt der Angriff von selbst genau auf ihn. Dann warte, bis der Balken wieder CHARGE READY zeigt.', 'Der Ring und der Pfeil unter jedem Stier zeigen, wem er gehört und wohin er schaut. Am Rand krallen sich die Hufe in den Sand, du fliegst also nur raus, wenn du geschoben wirst; der Rand leuchtet rot und EDGE! erscheint, wenn du nah dran bist.', 'Ein Stier, der beim Angriff den anderen trifft, schleudert ihn weg und macht ihn kurz benommen.', 'Wer über die weiße Linie geschoben wird, verliert die Runde. Nach einer Weile beginnt der Ring zu schrumpfen.'],
    win: 'Wer zuerst drei Runden gewinnt, gewinnt das Match.',
    scoring: 'Den anderen Stier hinauszuschieben gewinnt die Runde.',
  },
  'spin-duel': {
    steps: ['Wisch innerhalb des Drei-Sekunden-Startfensters schnell zu deinem Gegner. Die Starten-Taste ist eine barrierefreie Alternative.', 'Ein längerer, schnellerer Wisch gibt deinem Kreisel mehr Startkraft. Ein Start pro Runde.', 'Nach dem Countdown drehen sich die Kreisel und stoßen von selbst zusammen. Halte deinen in der Arena und am Drehen.', 'Der letzte Kreisel, der sich noch dreht, gewinnt die Runde. Bleiben beide gleichzeitig stehen, ist die Runde unentschieden.', 'Wer zuerst drei Runden gewinnt, gewinnt das Match. Verpassen beide drei Runden, endet das Match unentschieden.'],
    win: 'Spiel allein gegen einen Bot, auf einem Bildschirm, in der Nähe oder online. Verdiene beim Spielen Münzen und schalte damit Kreisel- und Arena-Stile frei.',
    scoring: 'Du gewinnst eine Runde, indem du den anderen Kreisel hinausstößt oder dich länger drehst. Das Match gewinnt, wer zuerst drei Runden holt.',
  },
  'pen-fight': {
    steps: ['Wisch innerhalb von drei Sekunden zu deinem Gegner. Die Schnipsen-Taste ist eine barrierefreie Alternative.', 'Ein schnellerer Wisch schickt deinen Stift kräftiger los; deine Richtung bestimmt seinen Weg.', 'Die Stifte gleiten und stoßen von selbst zusammen. Ein Stift, der über die Kante fällt oder durch einen Stoß umkippt, verliert die Runde.', 'Bleiben beide Stifte auf dem Tisch, gewinnt der mit der besseren Endposition; sehr knappe Runden sind unentschieden.', 'Wer zuerst drei Runden gewinnt, gewinnt das Match. Drei Runden, in denen beide danebenliegen, enden unentschieden.'],
    win: 'Spiel allein gegen einen Bot, mit einem Freund auf einem Bildschirm, in der Nähe oder online. Schalte mit verdienten Münzen Stift- und Tisch-Looks frei; die Stile sind nur Optik.',
    scoring: 'Du gewinnst eine Runde, indem du den gegnerischen Stift vom Tisch stößt, ihn mit einem harten Stoß umwirfst oder länger durchhältst. Das Match gewinnt, wer zuerst drei Runden holt.',
  },
  'lapa-chupi': {
    steps: ['In jedem Match sucht ein anderer Spieler. Der Sucher wartet mit geschlossenen Augen an der Wand, während alle anderen fünf Sekunden haben, sich zu verstecken.', 'Bewege dich mit dem Joystick oder den Pfeiltasten über den 3D-Spielplatz. Halte Sprint gedrückt, um schneller zu laufen, aber nur etwa eine Sekunde lang, dann bist du außer Atem.', 'Bleib an einem Busch, einer Bank oder einem Spielgerät stehen und halt still, um dich zu verstecken. Bewegung, oder den Sucher nah heranlassen, verrät dich.', 'Der Sucher gewinnt, wenn er alle findet. Wer noch versteckt ist, wenn die Zeit abläuft, gewinnt gemeinsam.', 'In Online-Räumen wird der Standort versteckter Spieler nicht an die anderen geschickt.'],
    win: 'Spiel mit Computerspielern, mit Freunden auf einem Bildschirm, in der Nähe oder online. Bots füllen freie Plätze.',
    scoring: 'Der Sucher bekommt einen Punkt für jeden Gefundenen und gewinnt, wenn er alle findet. Wer bei Zeitablauf noch versteckt ist, gewinnt gemeinsam und bekommt mehr als jede Zahl an Funden.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani braucht drei oder vier Spieler: einen Fänger und die Läufer. Computerspieler füllen freie Plätze, und der Fänger wechselt von Match zu Match.', 'Der Fänger zählt in der Mitte des Hofs bis drei, während die Läufer sich verteilen. Dann geht die Jagd los.', 'Beweg dich mit dem Joystick oder den Pfeiltasten. Halte Sprint für einen Spurt gedrückt; nach etwa einer Sekunde bist du außer Atem und musst eine Weile gehen.', 'Berührt der Fänger einen Läufer, erstarrt dieser (baraf!). Ein freier Läufer, der einen erstarrten Freund berührt, erlöst ihn (pani!).', 'Der Fänger gewinnt, wenn alle Läufer gleichzeitig erstarrt sind. Die Läufer gewinnen, wenn bei Zeitablauf noch mindestens einer frei ist.'],
    win: 'Spiel allein gegen Computer-Läufer, mit Freunden auf einem Bildschirm, in der Nähe oder online. Bots füllen freie Plätze.',
    scoring: 'Gewonnen wird als Team: der Fänger, indem er alle Läufer erstarren lässt, die Läufer, indem bis zum Schluss mindestens einer frei bleibt. Die Gewinner bekommen 1 Punkt.',
  },
  'pakda-padi': {
    steps: ['Beweg dich mit dem Joystick oder den Pfeiltasten über den Spielplatz. Halte Sprint für einen Spurt gedrückt; nach etwa einer Sekunde bist du außer Atem und musst eine Weile gehen.', 'Der als IT markierte Spieler zählt bis drei und jagt dann die anderen. Komm nah genug heran, um weiterzugeben.', 'Bist du dran, dreh dich um und jag jemand anderen. Kein Zurückschlagen: Zwei Sekunden lang kannst du den Spieler nicht fangen, der dich gerade gefangen hat.', 'Wenn die Zeit abläuft, gewinnt, wer am kürzesten IT war. Ein Unentschieden ist möglich.'],
    win: 'Spiel mit Computerspielern, mit Freunden auf einem Bildschirm, in der Nähe oder online. Bots füllen freie Plätze.',
    scoring: 'Wer am kürzesten IT war, gewinnt. Die Fänge werden auf der Anzeigetafel gezählt.',
  },
  'ship-fight': {
    steps: ['Fahr dein Schiff überall in deiner Hälfte des Meeres herum. Seine Kanone feuert ungefähr jede Sekunde von selbst auf das andere Schiff.', 'Jedes Schiff hält fünf Treffer aus. Felsen halten Schüsse auf, also nutze sie als Deckung.', 'In der Mitte tauchen Kisten auf: Ein Herz repariert dein Schiff, und die Kanonenkiste gibt fünf Dreifachschüsse.', 'Dauert eine Runde zu lange, zermürbt ein Sturm die Schiffe, angefangen bei dem mit weniger Leben.'],
    win: 'Wer zuerst drei Runden gewinnt, gewinnt das Match.',
    scoring: 'Das andere Schiff zu versenken gewinnt die Runde.',
  },
  'road-dash': {
    steps: ['Drück links oder rechts (zieh den Stick, A und D oder die Pfeiltasten), um die Spur zu wechseln.', 'Weich den Kühen, Schlaglöchern, Bussen und anderen Rikschas aus.', 'Sammle Münzen für Extrapunkte.', 'Die Straße wird schneller, je länger du durchhältst, und etwa alle 100 Punkte kommt ein neues Level mit neuem Verkehr. Ein Unfall beendet deinen Lauf.'],
    win: 'Allein schlägst du deinen Rekord. Mit anderen gewinnt die höchste Punktzahl.',
    scoring: 'Du bekommst Punkte für die gefahrene Strecke und 5 für jede Münze.',
  },
  'backyard-rally': {
    steps: ['Beweg deinen Schläger hoch und runter.', 'Schlag den Ball zurück. Jeder Schlag macht ihn ein bisschen schneller.', 'Mit der Kante des Schlägers fliegt der Ball in einem steileren Winkel ab.', 'Kommt der Ball an deinem Schläger vorbei, punktet der andere Spieler.'],
    win: 'Wer zuerst sieben Punkte hat, gewinnt.',
    scoring: 'Ein Punkt, jedes Mal wenn der Ball am anderen Spieler vorbeigeht.',
  },
  'hungry-snake': {
    steps: ['Lenk deine Schlange nach oben, unten, links oder rechts. Sie bleibt nie stehen.', 'Friss einen Snack für einen Punkt und werd länger.', 'Stößt du gegen eine Wand, dich selbst oder eine andere Schlange, ist dein Spiel vorbei.', 'Mit anderen bekommt die letzte Schlange, die sich noch bewegt, 3 Bonuspunkte.'],
    win: 'Allein schlägst du deinen Rekord. Mit anderen gewinnt die höchste Punktzahl.',
    scoring: 'Ein Punkt pro Snack, dazu 3 für die letzte übrige Schlange.',
  },
  ludo: {
    steps: ['Tipp in deinem Zug auf Würfeln. Du brauchst eine Sechs, um eine Figur aus dem Haus auf dein Startfeld zu bringen.', 'Tipp auf eine leuchtende Figur oder ihre Taste, um sie um die gewürfelte Zahl vorzurücken. Auch wenn nur eine Figur ziehen kann, tippst du sie selbst an; kann keine ziehen, endet dein Zug.', 'Landest du auf einer gegnerischen Figur, muss sie zurück ins Haus. Startfelder und Sternfelder sind sicher: Dort wird niemand geschlagen.', 'Nach einer Runde über das Brett biegt die Figur in deine Zielspalte ein. Ins Ziel kommst du nur mit der genauen Zahl.', 'Eine Sechs, ein Schlag und eine Figur im Ziel bringen jeweils einen weiteren Wurf. Drei Sechsen hintereinander kosten dich den Zug.'],
    win: 'Normalmodus: Wer zuerst alle vier Figuren ins Ziel bringt, gewinnt. Punktemodus: Die meisten Punkte gewinnen, wenn 15 Runden vorbei sind oder jemand alle vier Figuren im Ziel hat.',
    scoring: 'Wähl den Modus vor dem Spiel. Im Normalmodus gibt es keine Punkte: Die Ergebnistabelle zeigt, wie viele Figuren jeder ins Ziel gebracht hat. Im Punktemodus zählt jedes gezogene Feld 1, ein Schlag 20, eine Figur im Ziel 30, und wer als Erster alle vier im Ziel hat, bekommt 50 Bonuspunkte.',
    house: [['Sperren', 'Zwei Figuren derselben Farbe auf demselben Feld der Laufbahn bilden eine Sperre. Niemand sonst kann sie überspringen oder darauf landen, und ihre Figuren können nicht geschlagen werden.'], ['Erst schlagen, dann heim', 'Eine Figur darf erst in ihre Zielspalte, wenn ihr Spieler mindestens eine gegnerische Figur geschlagen hat. Bis dahin läuft sie noch eine Runde.'], ['Schneller Start', 'Jeder beginnt mit einer Figur schon auf seinem Startfeld, damit das Spiel sofort losgeht.'], ['Weiterspielen um die Plätze', 'Mit drei oder vier Spielern endet das Spiel nicht beim Sieger: Die anderen spielen um Platz zwei und drei weiter, und am Ende wird die Reihenfolge angezeigt.']],
  },
  carrom: {
    steps: ['Platz 1 spielt die weißen Steine, Platz 2 die schwarzen. Es gibt je neun, dazu die rote Königin in der Mitte.', 'Setz deinen Striker mit dem Striker-Regler auf die Grundlinie, wähl mit Zielen die Richtung und mit Kraft die Stärke, dann schieß.', 'Versenkst du einen eigenen Stein, bist du noch mal dran. Sonst geht der Zug weiter.', 'Die Königin muss gedeckt werden. Nachdem du sie versenkt hast, versenk im selben oder im nächsten Schuss einen eigenen Stein, sonst kommt sie zurück in die Mitte.', 'Fällt der Striker in ein Loch, ist das ein Foul: Einer deiner versenkten Steine kommt zurück in die Mitte, und dein Zug endet.', 'Die Königin muss weg sein, bevor der letzte Stein eines Spielers versenkt bleiben darf.'],
    win: 'Wer zuerst alle seine Steine versenkt hat, mit gedeckter Königin, gewinnt. Nach 80 Schüssen gewinnt, wer weniger Steine übrig hat.',
    scoring: 'Der Sieger bekommt 1 Punkt für jeden Stein, den der andere noch auf dem Brett hat, plus 3 für die Königin.',
  },
  chess: {
    steps: ['Weiß zieht zuerst, dann wechseln sich die Spieler ab. Tipp auf eine Figur, dann auf ein markiertes Feld.', 'Der Turm zieht gerade, der Läufer diagonal, die Dame beides, der Springer springt im L und der König zieht ein Feld.', 'Ein Bauer zieht ein Feld vorwärts, beim ersten Zug auch zwei, und schlägt ein Feld schräg nach vorn. Auf der letzten Reihe wird er zu Dame, Turm, Läufer oder Springer.', 'Rochade: Haben König und ein Turm noch nicht gezogen, sind die Felder dazwischen frei und zieht der König nicht durch ein Schach, zieht der König zwei Felder zum Turm, und der Turm springt über ihn.', 'En passant: Direkt nachdem ein Bauer zwei Felder neben deinen Bauern gezogen ist, darfst du ihn schlagen, als wäre er nur eins gezogen.', 'Ein angegriffener König steht im Schach. Mit deinem Zug musst du das Schach aufheben.'],
    win: 'Schachmatt gewinnt: Der König steht im Schach und hat keinen Ausweg. Remis gibt es durch Patt (kein legaler Zug, aber kein Schach), dreimal dieselbe Stellung, fünfzig Züge je Seite ohne Schlag oder Bauernzug, oder zu wenig Material zum Mattsetzen.',
    scoring: 'Eine Partie endet mit Sieg oder Remis. Die Ergebnistabelle zeigt 1 für den Sieger.',
  },
  'snakes-and-ladders': {
    steps: ['Alle beginnen vor dem Brett, vor Feld 1. Gewürfelt wird reihum.', 'Zieh deine Figur um die gewürfelte Zahl vor, den Zahlen auf dem Brett nach.', 'Landest du am Fuß einer Leiter, kletterst du nach oben. Landest du auf dem Kopf einer Schlange, rutschst du bis zu ihrem Schwanz.', 'Eine Sechs bringt einen weiteren Wurf.', 'Feld 100 braucht die genaue Zahl. Würdest du darüber hinausziehen, bleibt deine Figur stehen.'],
    win: 'Wer zuerst genau auf Feld 100 landet, gewinnt.',
    scoring: 'Während des Spiels gibt es keine Punkte. Die Ergebnistabelle zeigt, welches Feld jeder erreicht hat.',
    house: [['Start mit einer 6', 'Eine Figur wartet vor dem Brett, bis ihr Spieler eine 6 würfelt. Die 6 setzt sie auf Feld 1, und der Spieler würfelt noch einmal.'], ['Zurückprallen', 'Ein Wurf über 100 hinaus prallt zurück: Von 97 kommt man mit einer 5 auf 100 und zwei Felder zurück auf 98. Schlangen und Leitern zählen dort, wo man landet.'], ['Drei Sechsen', 'Drei Sechsen hintereinander schicken die Figur dahin zurück, wo sie zu Beginn des Zuges stand, und der Zug geht weiter.']],
  },
  'color-clash': {
    steps: ['Jeder bekommt sieben Karten. Eine Karte beginnt den Stapel.', 'Spiel in deinem Zug eine Karte, die in Farbe, Zahl oder Symbol zur obersten Karte passt.', 'Aussetzen (⊘) überspringt den nächsten Spieler. Richtungswechsel (⇄) dreht die Richtung um; zu zweit wirkt er wie Aussetzen. +2 lässt den Nächsten zwei Karten ziehen und aussetzen.', 'Eine Regenbogenkarte passt auf alles, und du wählst die nächste Farbe. Regenbogen +4 genauso, und der Nächste zieht vier Karten und setzt aus.', 'Nichts zu spielen? Zieh eine Karte. Du darfst sie spielen, wenn sie passt; sonst passe.'],
    win: 'Wer zuerst 150 Punkte hat, gewinnt. Schafft das niemand in fünf Runden, gewinnt die höchste Punktzahl.',
    scoring: 'Wer seine Hand leert, bekommt die Karten, die alle anderen noch auf der Hand haben: Zahlen zählen ihren Wert, Aktionskarten 20, Regenbogenkarten 50.',
    house: [['Stapeln', 'Ein +2 abbekommen? Leg dein eigenes +2 oder ein Regenbogen +4 drauf, und die Strafe wandert größer zum Nächsten. Auf ein +4 kann man nur mit einem weiteren +4 antworten. Wer nicht kann (oder nicht will), zieht alles und setzt aus.'], ['Ziehen, bis es passt', 'Hast du keine spielbare Karte, ziehst du weiter, bis eine passt, und darfst sie dann spielen.']],
  },
  'call-break': {
    steps: ['Alle 52 Karten werden verteilt, 13 an jeden.', 'Jeder sagt eine Zahl von Stichen zwischen 1 und 8 an, beginnend beim Spieler nach dem Geber.', 'Der erste Spieler spielt eine beliebige Karte aus. Reihum muss jeder dieselbe Farbe bedienen und, wenn möglich, die bisher beste Karte übertreffen.', 'Hast du die ausgespielte Farbe nicht, musst du ein Pik spielen und, wenn möglich, das höchste Pik übertreffen. Ohne Pik spielst du irgendetwas.', 'Das höchste Pik gewinnt den Stich; ohne Pik die höchste Karte der ausgespielten Farbe. Der Gewinner spielt als Nächster aus.'],
    win: 'Nach fünf Runden gewinnt die höchste Gesamtpunktzahl.',
    scoring: 'Schaffst du deine Ansage, bekommst du die angesagte Zahl plus 0,1 für jeden zusätzlichen Stich. Schaffst du sie nicht, verlierst du die angesagte Zahl.',
  },
  'crazy-eights': {
    steps: ['Zu zweit bekommt jeder sieben Karten, mit mehr Spielern fünf. Eine Karte beginnt den Stapel.', 'Spiel in deinem Zug eine Karte, die in Farbe oder Wert zur obersten Karte passt.', 'Eine Acht darf auf alles, und du bestimmst die Farbe, die folgen muss.', 'Nichts zu spielen? Zieh eine Karte. Spiel sie, wenn du kannst; sonst passe.', 'Die Runde endet, wenn jemand keine Karten mehr hat.'],
    win: 'Nach drei Runden gewinnt, wer die wenigsten Strafpunkte hat.',
    scoring: 'Karten, die du noch auf der Hand hast, zählen gegen dich: eine Acht 50, König, Dame oder Bube 10, ein Ass 1 und jede andere Karte ihren Wert.',
    house: [['Zweien ziehen zwei', 'Eine 2 lässt den Nächsten zwei Karten ziehen und aussetzen, außer er legt selbst eine 2: Dann zieht der Nächste vier, und so weiter.'], ['Buben setzen aus', 'Ein Bube lässt den nächsten Spieler aussetzen.'], ['Asse drehen um', 'Ein Ass dreht die Spielrichtung um. Zu zweit heißt das: Du bist noch mal dran.']],
  },
  checkers: {
    steps: ['Steine ziehen ein Feld schräg vorwärts auf ein freies dunkles Feld. Tipp auf einen Stein, dann auf ein markiertes Feld.', 'Zum Schlagen springst du schräg über einen gegnerischen Stein auf das freie Feld dahinter. Der geschlagene Stein kommt vom Brett.', 'Wenn du schlagen kannst, musst du, und kann derselbe Stein danach noch einmal springen, muss er weiter.', 'Ein Stein, der die letzte Reihe erreicht, wird zur Dame, und der Zug endet dort. Damen ziehen und springen schräg vorwärts und rückwärts.'],
    win: 'Du gewinnst, wenn der andere keine Steine oder keinen legalen Zug mehr hat. Vierzig Züge je Seite ohne Schlag oder Zug eines einfachen Steins sind ein Remis.',
    scoring: 'Eine Partie endet mit Sieg oder Remis. Die Ergebnistabelle zeigt 1 für den Sieger.',
  },
  'four-in-a-row': {
    steps: ['Abwechselnd wirft jeder eine Scheibe in eine Spalte, in der noch Platz ist.', 'Die Scheibe fällt auf den untersten freien Platz dieser Spalte.', 'Bilde eine Reihe aus vier deiner Scheiben, waagerecht, senkrecht oder diagonal, und du gewinnst sofort.'],
    win: 'Die erste Viererreihe gewinnt. Ist das Gitter voll ohne Reihe, ist es unentschieden.',
    scoring: 'Eine Partie endet mit Sieg oder Unentschieden. Die Ergebnistabelle zeigt 1 für den Sieger.',
  },
  'tic-tac-toe': {
    steps: ['Ein Spieler ist ✕, der andere ◯. ✕ fängt an.', 'Abwechselnd besetzt jeder ein freies Feld.', 'Drei deiner Zeichen in einer Reihe, waagerecht, senkrecht oder diagonal, gewinnen.'],
    win: 'Wer zuerst drei in einer Reihe hat, gewinnt. Sind alle neun Felder voll ohne Reihe, ist es unentschieden.',
    scoring: 'Eine Partie endet mit Sieg oder Unentschieden. Die Ergebnistabelle zeigt 1 für den Sieger.',
  },
  reversi: {
    steps: ['Das Spiel beginnt mit vier Steinen in der Mitte. Schwarz zieht zuerst.', 'Setz einen Stein auf ein markiertes Feld. Ein Zug muss mindestens einen gegnerischen Stein in gerader Linie zwischen dem neuen und einem anderen eigenen Stein einschließen.', 'Alle eingeschlossenen Steine werden in deine Farbe umgedreht, in allen Richtungen gleichzeitig.', 'Hast du keinen legalen Zug, wird dein Zug übersprungen. Das Spiel endet, wenn keiner mehr ziehen kann.'],
    win: 'Wer am Ende die meisten Steine hat, gewinnt. Gleich viele sind ein Unentschieden.',
    scoring: 'Deine Punktzahl ist die Zahl der Steine in deiner Farbe am Ende.',
  },
  'dots-and-boxes': {
    steps: ['Abwechselnd zeichnet jeder eine Linie zwischen zwei benachbarten Punkten.', 'Schließt deine Linie die vierte Seite eines Kästchens, gehört es dir, und du musst noch einmal zeichnen.', 'Das Spiel endet, wenn alle Linien gezeichnet sind.'],
    win: 'Wer die meisten Kästchen hat, gewinnt. Liegen alle gleichauf, ist es unentschieden.',
    scoring: 'Jedes Kästchen, das du schließt, zählt einen Punkt.',
  },
  mancala: {
    steps: ['Jeder hat sechs Mulden auf seiner Seite und einen Speicher am rechten Ende. Tipp auf eine deiner Mulden mit Samen.', 'Alle Samen aus dieser Mulde werden einzeln gegen den Uhrzeigersinn in die nächsten Mulden gesät. In deinen eigenen Speicher legst du einen, den des anderen überspringst du.', 'Landet dein letzter Samen in deinem Speicher, bist du noch mal dran.', 'Landet dein letzter Samen in einer leeren Mulde auf deiner Seite und liegen gegenüber Samen, nimmst du sie alle, dazu deinen eigenen Samen.', 'Hat eine Seite keine Samen mehr, behält der andere Spieler die Samen auf seiner Seite.'],
    win: 'Wer die meisten Samen im Speicher hat, gewinnt. Gleich viele sind ein Unentschieden.',
    scoring: 'Jeder Samen in deinem Speicher zählt einen Punkt.',
  },
  'nine-mens-morris': {
    steps: ['Setzen: Abwechselnd setzt jeder einen Stein auf einen freien Punkt, bis beide je neun gesetzt haben.', 'Ziehen: Danach schiebt jeder abwechselnd einen Stein entlang einer Linie auf einen freien Nachbarpunkt.', 'Immer wenn du eine neue Dreierreihe bildest, eine Mühle, nimmst du einen gegnerischen Stein weg. Steine in einer Mühle sind geschützt, außer alle stehen in Mühlen.', 'Springen: Hast du nur noch drei Steine, dürfen sie auf jeden freien Punkt springen.'],
    win: 'Du gewinnst, wenn der andere nur noch zwei Steine oder keinen legalen Zug hat. Fünfzig Züge je Seite ohne Schlag sind ein Remis.',
    scoring: 'Eine Partie endet mit Sieg oder Remis. Die Ergebnistabelle zeigt 1 für den Sieger.',
  },
  'memory-match': {
    steps: ['Tipp in deinem Zug auf zwei Karten, um sie umzudrehen. Alle Spieler können sie sehen.', 'Passen sie zusammen, behältst du das Paar und bist noch mal dran.', 'Passen sie nicht, drehen sie sich zu Beginn des nächsten Zuges wieder um, und der Nächste ist dran.'],
    win: 'Sind alle Paare gefunden, gewinnt, wer die meisten hat. Liegen alle gleichauf, ist es unentschieden.',
    scoring: 'Jedes Paar zählt einen Punkt.',
  },
  yacht: {
    steps: ['Wirf alle fünf Würfel. Tipp auf die, die du behalten willst, und wirf den Rest neu. Das geht bis zu dreimal pro Zug.', 'Nach jedem Wurf darfst du aufhören und in einer noch freien Kategorie eintragen.', 'Einer bis Sechser zählen die Summe dieser Zahl. Chance zählt die Summe aller Würfel.', 'Vierling zählt die Summe dieser vier Würfel. Full House (drei gleiche und zwei gleiche) zählt die Summe aller fünf.', 'Kleine Straße (1–5) und Große Straße (2–6) zählen 30. Yacht (alle fünf gleich) zählt 50.', 'Passt nichts, musst du trotzdem eine Kategorie wählen, auch wenn sie 0 bringt.'],
    win: 'Nach je zwölf Zügen gewinnt die höchste Gesamtpunktzahl.',
    scoring: 'Deine Gesamtpunktzahl ist die Summe aller zwölf Kategorien.',
    house: [['Bonus oben', 'Kommst du bei Einern bis Sechsern zusammen auf 63 oder mehr (das sind drei von jeder Zahl), bekommst du am Ende 35 Extrapunkte.']],
  },
  pig: {
    steps: ['Würfle in deinem Zug. Jede Zahl von 2 bis 6 kommt zu deiner Summe für diesen Zug.', 'Würfle so oft du willst weiter, oder hör auf und sichere die Summe dieses Zuges.', 'Würfelst du eine 1, verlierst du die Summe dieses Zuges, und der Nächste ist dran.'],
    win: 'Erreich das Ziel (50 bei Schnell, 100 bei Klassisch und Zwei Würfel), und alle anderen bekommen noch einen letzten Zug, um dich zu schlagen. Danach gewinnt die höchste gesicherte Summe.',
    scoring: 'Nur gesicherte Punkte zählen.',
  },
  werewolf: {
    steps: ['Jeder liest geheim seine Rolle: Werwolf, Seherin, Arzt oder Dorfbewohner.', 'Nacht: Die Werwölfe wählen einen Spieler, den sie fangen, die Seherin wählt einen Spieler, dessen Rolle sie erfährt, und der Arzt wählt einen Spieler, den er schützt.', 'Morgen: Das Dorf erfährt, wer in der Nacht gefangen wurde, außer der Arzt hat ihn geschützt.', 'Tag: Besprecht euch im Chat, dann stimmen alle, die noch dabei sind, für den Spieler, den sie für einen Werwolf halten. Wer die meisten Stimmen hat, scheidet aus, und seine Rolle wird gezeigt. Bei Gleichstand scheidet niemand aus.', 'Die Nacht bricht wieder an, und das Spiel geht weiter, bis eine Seite gewinnt.'],
    win: 'Das Dorf gewinnt, sobald alle Werwölfe hinausgewählt sind. Die Werwölfe gewinnen, wenn sie so viele sind wie alle anderen.',
    scoring: 'Die ganze Siegerseite gewinnt: die Werwölfe zusammen, oder die Seherin, der Arzt und die Dorfbewohner zusammen. Ab neun Spielern gibt es zwei Werwölfe.',
  },
  'who-is-the-spy': {
    steps: ['Jeder liest geheim sein Wort.', 'Reihum spielt jeder eine Hinweiskarte zu seinem Wort.', 'Lest die Hinweise, dann stimmt jeder geheim für den Spieler, den er verdächtigt.', 'Wer die meisten Stimmen hat, wird beschuldigt. Bei Gleichstand niemand, und der Spion kommt davon.', 'Wird der Spion erwischt, hat er einen Versuch, das Wort der anderen aus vier Möglichkeiten zu erraten.'],
    win: 'Nach drei Runden gewinnt, wer die meisten Punkte hat.',
    scoring: 'Ein Spion, der davonkommt, bekommt 3. Ein erwischter Spion, der das Wort errät, bekommt 2; liegt er falsch, bekommen alle anderen 1. Ab acht Spielern gibt es zwei Spione.',
  },
  'truth-or-dare': {
    steps: ['Wähl in deinem Zug Wahrheit oder Pflicht.', 'Lies die Aufgabe, dann beantworte sie laut oder mach sie.', 'Tipp auf Fertig für einen Punkt, oder tipp auf Überspringen. Überspringen wird nie bestraft.', 'Dann ist der nächste Spieler dran.'],
    win: 'Wer nach dem letzten Zug die meisten Punkte hat, gewinnt, auch wenn es eigentlich ums Lachen geht.',
    scoring: 'Jede erzählte Wahrheit und jede erfüllte Pflicht bringt 1 Punkt. Überspringen kostet nichts.',
  },
  'riddle-chits': {
    steps: ['Ein Rätsel öffnet sich auf dem Zettel, damit alle es lesen können.', 'Wähl die Antwort, die du für richtig hältst. Niemand sieht deine Wahl, bis alle geantwortet haben.', 'Nicht sicher? Hol dir vor dem Antworten einen Tipp. Er senkt deine Punkte für dieses Rätsel.', 'Dann werden die Lösung und die Wahl aller gezeigt, und der nächste Zettel öffnet sich.'],
    win: 'Wer nach dem letzten Rätsel die meisten Punkte hat, gewinnt.',
    scoring: 'Eine richtige Antwort bringt 2 Punkte, oder 1, wenn du den Tipp genommen hast. Eine falsche Antwort bringt nichts.',
  },
  'majority-vote': {
    steps: ['Eine Frage öffnet sich mit ein paar möglichen Antworten.', 'Jeder wählt geheim die Antwort, von der er glaubt, dass die meisten sie wählen.', 'Wenn alle gewählt haben, werden die Summen als Balken gezeigt.', 'Alle, die die beliebteste Antwort gewählt haben, bekommen einen Punkt.'],
    win: 'Wer nach der letzten Frage die meisten Punkte hat, gewinnt.',
    scoring: 'Ein Punkt jedes Mal, wenn du die Antwort der Mehrheit wählst. Liegen zwei Antworten gleichauf vorn, zählen beide.',
  },
  consequences: {
    steps: ['Reihum fügt jeder einen Satz für den gezeigten Teil hinzu, ohne die vorherigen zu sehen.', 'Mit Freunden tippst du deine eigenen Sätze. An einem Tisch mit Fremden wählst du aus Sätzen, die wir geschrieben haben, damit niemand etwas Gemeines schicken kann.', 'Sieben Teile ergeben eine Geschichte: wer, traf wen, wo, was jeder sagte, was passierte und was die Welt dazu sagte.', 'Dann entfaltet sich die Geschichte, und alle lesen sie.'],
    win: 'Alle gewinnen, wenn die Geschichte den ganzen Tisch zum Lachen bringt.',
    scoring: 'Es gibt keine Punkte: Die beste Geschichte gewinnt den Raum.',
  },
};
