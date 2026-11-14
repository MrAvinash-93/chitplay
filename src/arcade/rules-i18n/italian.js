/** Come si gioca a ogni gioco, in italiano. Gli stessi passi, nello stesso ordine, dell'inglese di rules.js. */
export default {
  'flying-chit': {
    steps: ['Trascina lo stick, o usa le frecce, W A S D o un gamepad, per guidare il bigliettino in alto, in basso, a sinistra e a destra.', 'Un anello mostra dove il bigliettino attraverserà il prossimo braccialetto: diventa verde quando la mira è giusta. Vicino a un braccialetto, il bigliettino viene attirato dolcemente verso il centro.', 'Passa in un braccialetto dorato per recuperare un po\' di spinta. La barra sotto il punteggio mostra quanta ne resta.', 'Braccialetti uno dopo l\'altro fanno una combo: ×2, ×3, fino a ×5 punti ciascuno.', 'Mancare un braccialetto interrompe la combo. Urtare un ventilatore o una pila di libri fa perdere molta spinta.', 'Quando la spinta finisce, il bigliettino plana a terra e il volo è finito.', 'Ogni nuovo livello inizia con un grande braccialetto dorato: 10 punti e spinta al massimo.'],
    win: 'Da solo, insegui il tuo record. Con altri, tutti volano insieme e vince il punteggio più alto.',
    scoring: 'Ogni braccialetto vale la sua combo: 1, poi 2, 3, 4 e 5 punti finché dura la serie. Medaglie a 50, 200, 500 e 1000 punti.',
  },
  'tunnel-race': {
    steps: ['Trascina lo stick a sinistra o a destra, o usa A e D, le frecce o un gamepad, per volare tutto intorno all\'interno del tunnel.', 'I muri rossi bloccano una parte del tunnel: giraci intorno. I muri arancioni chiudono tutto tranne un varco: passa dal varco.', 'Raccogli le gemme luccicanti, 10 punti l\'una.', 'Toccare un muro chiude la corsa. Il tunnel accelera man mano che avanzi, e ogni livello porta un nuovo tipo di muro.'],
    win: 'Da solo, batti il tuo record. Con altri, tutti corrono insieme e vince il punteggio più alto.',
    scoring: 'Punti per la distanza percorsa, e 10 per ogni gemma. Medaglie a 50, 150, 300 e 600 punti.',
  },
  'turbo-tunnel': {
    steps: ['Trascina lo stick a sinistra o a destra, o usa A e D, le frecce o un gamepad, per sterzare tutto intorno all\'interno del tunnel.', 'Coni, barriere, auto, camion e massi chiudono la corsa se li tocchi. Il prossimo ostacolo contro cui stai per andare brilla di rosso sotto.', 'Ogni fila del tunnel ha sempre un passaggio libero che puoi raggiungere in tempo. Delle tenui frecce verdi sulla strada lo indicano.', 'Le monete valgono 10 punti. Una pedana nitro blu raddoppia i punti distanza per tre secondi. Uno scudo verde prende un colpo al posto tuo.', 'L\'olio non ti ferma, ma l\'auto slitta e risponde lenta al volante per un momento.', 'Passare a un soffio da un ostacolo è un quasi-incidente: 5 punti bonus.'],
    win: 'Da solo, batti il tuo record. Con gli amici, tutti corrono nello stesso tunnel insieme: vince l\'ultima auto ancora in corsa, e se si schiantano tutti, il punteggio più alto.',
    scoring: 'Punti per la distanza percorsa (doppi col nitro), 10 per ogni moneta e 5 per ogni quasi-incidente. Medaglie a 100, 300, 700 e 1500 punti.',
  },
  'reaction-time': {
    steps: ["Aspetta finché lo schermo è rosso. Quando diventa verde, tocca ovunque (o premi Spazio, Invio o un tasto del gamepad) più veloce che puoi.","Toccare prima del verde, o sul falso segnale blu dei round 3 e 4, è una falsa partenza e in quel round non vale nulla.","Il tuo tempo si misura sul tuo telefono, da quando il verde appare sul tuo schermo al tuo tocco, quindi una connessione lenta non ti rallenta mai. Sotto i 100 ms conta come tirare a indovinare.","Ci sono cinque round. Dopo ognuno vedi il tempo di tutti, e il più veloce al tavolo prende 50 punti bonus."],
    win: "Vince chi ha più punti dopo cinque round. Da solo, batti il tuo record e vinci le medaglie.",
    scoring: "Ogni round vale 500 meno il tuo tempo in millisecondi: una reazione di 250 ms vale 250. False partenze e round mancati valgono 0. Medaglie a 600, 900, 1100 e 1300 punti.",
  },
  'stroop-test': {
    steps: ["Una carta mostra il nome di un colore scritto in un inchiostro colorato. Tocca il pulsante del colore dell'INCHIOSTRO (o premi la freccia indicata).","Dalla carta 6, alcune dicono \"Tocca la PAROLA\": allora rispondi con ciò che dice la parola.","Conta solo il tuo primo tocco su ogni carta, quindi tocca quando sei sicuro. Le carte dalla 11 alla 15 danno meno tempo.","Il tuo tempo si misura sul tuo telefono da quando la carta vi appare, quindi giocare online con amici lontani è giusto."],
    win: "Dopo quindici carte vince chi ha più punti. Da solo, batti il tuo record e vinci le medaglie.",
    scoring: "Una risposta giusta vale di più quanto è più veloce: 2000 meno il tuo tempo in millisecondi, diviso dieci, mai meno di 10. Sbagliare o non rispondere vale 0. Con gli amici, la risposta giusta più veloce di ogni carta prende 20 in più. Medaglie a 600, 1200, 1700 e 2100 punti.",
  },
  'number-memory': {
    steps: ["Un numero appare per un attimo. La barra sotto mostra quanto resterà.","Quando sparisce, scrivi il numero sul tastierino (o sulla tastiera) e premi ✓. Hai fino a 15 secondi.","Giusto: il numero dopo ha una cifra in più. Sbagliato: perdi un cuore. Tre cuori persi, e sei fuori.","Ogni telefono tiene ciò che scrive il suo giocatore e invia la risposta intera con ✓; i telefoni degli amici non vedono mai il numero mentre si risponde."],
    win: "Da solo, ricorda il numero più lungo che puoi. Con gli amici vince chi ha più punti; la partita finisce quando sono tutti fuori o quando l'ultimo rimasto è già in testa.",
    scoring: "Una risposta giusta vale dieci punti per cifra: un numero di 7 cifre vale 70. Medaglie a 70, 150, 250 e 400 punti.",
  },
  'word-guess': {
    steps: ["Vedi un indizio (come Fruit o Sport) e la parola in caselle vuote, con una lettera visibile.","Ogni secondo e mezzo compare un'altra lettera. L'ultima non compare mai, quindi bisogna sempre indovinare.","Scrivi la parola intera sulla tastiera di lettere (o sulla tua tastiera) e premi ✓. Hai un solo tentativo per parola.","Ogni telefono cronometra il proprio giocatore, e i telefoni degli amici ricevono solo le lettere già visibili, mai la parola."],
    win: "Dopo otto parole vince chi ha più punti.",
    scoring: "Una risposta giusta vale 10, più 10 per ogni lettera ancora nascosta quando l'hai inviata. Con gli amici, la risposta giusta più veloce su ogni parola vale 10 in più. Una risposta sbagliata non vale nulla per quella parola. Medaglie a 80, 160, 240 e 320 punti.",
  },
  'fast-typing': {
    steps: ["Per un secondo compare \"Get ready\", poi la parola.","Scrivi la parola sulla tastiera di lettere (o sulla tua tastiera) e premi ✓. Hai un solo tentativo per parola.","La barra sotto la parola mostra il tempo rimasto: quattro secondi più uno per lettera.","Ogni telefono cronometra il proprio giocatore dal momento in cui la parola è comparsa lì, quindi una connessione lenta non ti toglie mai velocità."],
    win: "Dopo dieci parole vince chi ha più punti.",
    scoring: "Una parola giusta vale dieci punti per ogni lettera al secondo: sei lettere in due secondi fanno 30. Almeno 5 per parola giusta, al massimo 60. Una lettera sbagliata e la parola non vale nulla. Medaglie a 120, 200, 280 e 360 punti.",
  },
  'bingo': {
    steps: ["Ogni giocatore riceve una cartella con i numeri da 1 a 25 in un ordine diverso. Solo tu vedi la tua.","Al tuo turno scrivi un numero da 1 a 25 non ancora chiamato e premi ✓. Hai 15 secondi, altrimenti un numero viene chiamato per te.","Il numero chiamato viene segnato su tutte le cartelle, la tua e quelle dei tuoi amici.","Ogni riga, colonna o diagonale completa è una linea e accende la lettera successiva di B-I-N-G-O."],
    win: "Vince chi completa per primo cinque linee. Se un numero completa due cartelle insieme, vince chi ha più linee; se sono ancora pari, vince chi l'ha chiamato.",
    scoring: "La barra in alto mostra quante lettere di BINGO ha acceso ciascun giocatore. Una cartella ha dodici linee possibili: cinque righe, cinque colonne e due diagonali.",
  },
  'unblock-puzzle': {
    steps: ["Ogni parcheggio mostra il risciò (verde, tettuccio giallo), i veicoli intorno e l'uscita a destra della sua fila.","Trascina un veicolo con il dito o il mouse per farlo scorrere. Va fin dove trascini, fino al primo ostacolo.","Oppure scegli un veicolo con le frecce, premi Hold e fallo scorrere con le frecce. Premi di nuovo Hold per lasciarlo.","Quando tra il risciò e l'uscita non c'è più nulla, spostalo a destra ed esce. Hai due minuti per parcheggio."],
    win: "Dopo cinque parcheggi vince chi ha più punti.",
    scoring: "Uscire vale 50, più fino a 50 se lo fai in poche mosse: 5 in meno per ogni mossa oltre la migliore. Con gli amici, il primo a uscire da ogni parcheggio prende 20 in più. Medaglie a 200, 300, 400 e 470 punti.",
  },
  'hoop-flick': {
    steps: ['Tira lo stick all\'indietro come una fionda: la palla volerà dalla parte opposta. Più tiri, più forte è il lancio.', 'Rilascia lo stick per tirare. Con la tastiera, frecce sinistra e destra per mirare, su e giù per la forza, e Spazio per tirare.', 'Fai cadere la palla dentro il prossimo canestro, dall\'alto.', 'Ogni canestro ha dodici secondi: la barra rossa avvisa quando il tempo sta finendo.', 'Se sbagli, la palla esce dal campo e la partita finisce.', 'Ogni cinque canestri c\'è un nuovo livello: canestri che si muovono, poi il vento, poi entrambi.'],
    win: 'Da solo, batti il tuo record. Con un amico, ognuno gioca nella sua metà campo e vince il punteggio più alto.',
    scoring: 'Un canestro che tocca il ferro vale 1. Un canestro pulito vale 2, e quelli puliti di fila valgono di più: fino a 5 punti ciascuno. Medaglie a 20, 50, 100 e 200 punti.',
  },
  'ghost-hostel': {
    steps: ['Il tuo letto guadagna monete ogni secondo. Un letto migliore ne guadagna di più.', 'Usa le frecce o i pulsanti per scegliere Letto, Porta, Ventilatore o Ripara, e premi Compra.', 'Porta: più resistenza, e viene riparata fino alla nuova resistenza. Ripara: aggiusta parte della porta, poi servono alcuni secondi prima della riparazione successiva.', 'I ventilatori soffiano sul fantasma finché è alla tua porta. Feriscilo abbastanza e torna fluttuando nel suo angolo a riprendersi.', 'Il fantasma diventa più forte ogni trenta secondi, e più arrabbiato negli ultimi quaranta. Se la porta cede, vieni preso e sei fuori.'],
    win: 'Vince chi è ancora nella sua stanza all\'alba. Caccia via del tutto il fantasma e la notte finisce prima. Se prende tutti, vince il fantasma.',
    scoring: 'Ottieni ogni moneta guadagnata dal letto, più 100 per aver resistito fino all\'alba e altri 150 se il fantasma viene cacciato per sempre.',
  },
  'pin-spin': {
    steps: ['Tocca lo schermo, premi il pulsante Puntina, Spazio o Invio, o un tasto del gamepad per lanciare una puntina. Vola sempre dritta verso l\'alto, sotto la tavola.', 'Aspetta uno spazio: se la tua puntina tocca una già piantata, la partita finisce.', 'Usa tutte le puntine mostrate in fondo allo schermo per finire il livello.', 'Pianta un adesivo stella dorata per 5 punti bonus.', 'Un livello su cinque è una tavola grande: cambia velocità e direzione.', 'Ogni livello ha un tempo limite (la barra sottile in basso): usa tutte le puntine prima che scada.'],
    win: 'Da solo, batti il tuo record. Con altri, ognuno pianta sulla propria tavola nello stesso momento e vince il punteggio più alto.',
    scoring: 'Ogni puntina piantata vale 1, ogni stella 5, e finire un livello vale il doppio del numero del livello. Medaglie a 25, 60, 120 e 250 punti.',
  },
  'bull-fight': {
    steps: ['Trascina lo stick, o usa W A S D, le frecce o un gamepad, per muovere il tuo toro.', 'Premi Carica per scattare in avanti. Se l\'altro toro è più o meno davanti a te, la carica punta da sola dritto su di lui. Poi aspetta che la barra torni a dire CHARGE READY.', 'Il cerchio e la freccia sotto ogni toro mostrano di chi è e dove guarda. Vicino al bordo gli zoccoli fanno presa sulla sabbia, quindi esci solo se ti spingono; il bordo si illumina di rosso e appare EDGE! quando sei vicino.', 'Un toro che carica e colpisce l\'altro lo scaraventa via e lo lascia stordito per un attimo.', 'Chi viene spinto oltre la linea bianca perde il round. Dopo un po\' l\'arena comincia a restringersi.'],
    win: 'Il primo a vincere tre round vince la partita.',
    scoring: 'Spingere fuori l\'altro toro vince il round.',
  },
  'spin-duel': {
    steps: ['Scorri veloce verso l\'avversario entro i tre secondi di lancio. Il pulsante Lancia è un\'alternativa accessibile.', 'Uno scorrimento più lungo e veloce dà più forza alla tua trottola. Un lancio per round.', 'Dopo il conto alla rovescia, le trottole girano e si scontrano da sole. Tieni la tua nell\'arena e in rotazione.', 'L\'ultima trottola che gira vince il round. Se si fermano insieme, il round è pari.', 'Il primo a vincere tre round vince la partita. Se entrambi mancano tre round, la partita finisce in parità.'],
    win: 'Gioca da solo contro un bot, su uno schermo, vicino o online. Guadagna monete giocando e sblocca stili di trottole e arene.',
    scoring: 'Vinci un round buttando fuori l\'altra trottola o girando più a lungo. La partita va al primo che vince tre round.',
  },
  'pen-fight': {
    steps: ['Scorri verso l\'avversario entro tre secondi. Il pulsante Schicchera è un\'alternativa accessibile.', 'Uno scorrimento più veloce manda la penna più forte; la direzione decide il percorso.', 'Le penne scivolano e si scontrano da sole. Una penna che cade dal banco o si ribalta dopo un urto perde il round.', 'Se restano entrambe sul banco, vince quella in posizione migliore alla fine; i round molto tirati sono pari.', 'Il primo a vincere tre round vince la partita. Tre round in cui sbagliano entrambi finiscono in parità.'],
    win: 'Gioca da solo contro un bot, con un amico su uno schermo, vicino o online. Sblocca look di penne e banchi con le monete guadagnate; gli stili sono solo estetici.',
    scoring: 'Vinci un round facendo cadere la penna avversaria dal banco, ribaltandola con un urto forte o resistendo più a lungo. La partita va al primo che vince tre round.',
  },
  'lapa-chupi': {
    steps: ['A ogni partita cerca un giocatore diverso. Chi cerca aspetta al muro a occhi chiusi, mentre gli altri hanno cinque secondi per nascondersi.', 'Usa il joystick o le frecce per muoverti nel cortile 3D. Tieni premuto Scatto per correre più veloce, ma solo per un secondo circa prima di restare senza fiato.', 'Fermati vicino a un cespuglio, una panchina o un gioco del cortile e resta immobile per nasconderti. Muoverti, o far avvicinare chi cerca, ti tradisce.', 'Chi cerca vince se trova tutti. Chi è ancora nascosto allo scadere del tempo vince insieme.', 'Nelle stanze online, la posizione dei giocatori nascosti non viene inviata agli altri.'],
    win: 'Gioca con giocatori del computer, con amici su uno schermo, vicino o online. I bot occupano i posti liberi.',
    scoring: 'Chi cerca prende un punto per ogni giocatore trovato e vince se li trova tutti. Chi è ancora nascosto allo scadere del tempo vince insieme e prende più di qualunque numero di ritrovamenti.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani si gioca in tre o quattro: uno che sta sotto e i corridori. I giocatori del computer occupano i posti liberi, e chi sta sotto cambia a ogni partita.', 'Chi sta sotto conta fino a tre in mezzo al cortile mentre i corridori si sparpagliano. Poi comincia l\'inseguimento.', 'Muoviti col joystick o le frecce. Tieni premuto Scatto per accelerare; dopo un secondo circa resti senza fiato e devi camminare per un po\'.', 'Quando chi sta sotto tocca un corridore, questo si congela (baraf!). Un corridore libero che tocca un amico congelato lo libera (pani!).', 'Chi sta sotto vince se tutti i corridori sono congelati insieme. I corridori vincono se allo scadere del tempo almeno uno è ancora libero.'],
    win: 'Gioca da solo contro corridori del computer, con amici su uno schermo, vicino o online. I bot occupano i posti liberi.',
    scoring: 'Si vince a squadre: chi sta sotto congelando tutti i corridori, i corridori tenendo almeno uno libero fino allo scadere del tempo. I vincitori prendono 1 punto.',
  },
  'pakda-padi': {
    steps: ['Muoviti nel cortile col joystick o le frecce. Tieni premuto Scatto per accelerare; dopo un secondo circa resti senza fiato e devi camminare per un po\'.', 'Il giocatore segnato come IT conta fino a tre, poi insegue gli altri. Avvicinati abbastanza per passargli il tocco.', 'Se ti prendono, girati e insegui qualcun altro. Niente tocco di ritorno: per due secondi non puoi toccare chi ti ha appena toccato.', 'Allo scadere del tempo vince chi è stato IT per meno tempo. Può esserci un pareggio.'],
    win: 'Gioca con giocatori del computer, con amici su uno schermo, vicino o online. I bot occupano i posti liberi.',
    scoring: 'Vince chi è stato IT per meno tempo. I tocchi sono contati nel tabellone.',
  },
  'ship-fight': {
    steps: ['Muovi la tua nave dove vuoi nella tua metà del mare. Il suo cannone spara da solo all\'altra nave, più o meno ogni secondo.', 'Ogni nave resiste a cinque colpi. Gli scogli fermano i colpi, quindi usali come riparo.', 'Al centro compaiono delle casse: un cuore ripara la nave, e la cassa cannone dà cinque colpi tripli.', 'Se un round dura troppo, una tempesta logora le navi, a partire da quella con meno vita.'],
    win: 'Il primo a vincere tre round vince la partita.',
    scoring: 'Affondare l\'altra nave vince il round.',
  },
  'road-dash': {
    steps: ['Premi sinistra o destra (trascina lo stick, A e D, o le frecce) per cambiare corsia.', 'Schiva mucche, buche, autobus e gli altri risciò.', 'Raccogli monete per punti extra.', 'La strada accelera più resisti, e ogni 100 punti circa arriva un nuovo livello con nuovo traffico. Un solo incidente chiude la corsa.'],
    win: 'Da solo, batti il tuo record. Con altri, vince il punteggio più alto.',
    scoring: 'Fai punti per la distanza percorsa, e 5 per ogni moneta.',
  },
  'backyard-rally': {
    steps: ['Muovi la racchetta su e giù.', 'Rimanda indietro la palla. Ogni colpo la rende un po\' più veloce.', 'Il bordo della racchetta manda la palla con un angolo più stretto.', 'Se la palla supera la tua racchetta, l\'altro giocatore fa punto.'],
    win: 'Vince il primo che arriva a sette punti.',
    scoring: 'Un punto ogni volta che la palla supera l\'altro giocatore.',
  },
  'hungry-snake': {
    steps: ['Guida il serpente in alto, in basso, a sinistra o a destra. Non si ferma mai.', 'Mangia uno spuntino per fare un punto e allungarti.', 'Sbattere contro un muro, te stesso o un altro serpente chiude la partita.', 'Con altri, l\'ultimo serpente ancora in movimento prende 3 punti bonus.'],
    win: 'Da solo, batti il tuo record. Con altri, vince il punteggio più alto.',
    scoring: 'Un punto per spuntino, più 3 per essere l\'ultimo rimasto.',
  },
  ludo: {
    steps: ['Tocca Tira al tuo turno. Serve un sei per portare una pedina fuori dalla base, sulla tua casella di partenza.', 'Tocca una pedina che brilla, o il suo pulsante, per avanzarla del numero uscito. Anche quando può muoversi una sola pedina, la tocchi tu; se nessuna può muoversi, il turno finisce.', 'Se finisci su una pedina avversaria, torna alla sua base. Le caselle di partenza e quelle con la stella sono sicure: lì nessuno può essere mangiato.', 'Dopo il giro del tabellone, la pedina entra nella tua colonna d\'arrivo. Per arrivare a casa serve il numero esatto.', 'Un sei, una pedina mangiata e una pedina arrivata a casa danno ciascuno un altro tiro. Tre sei di fila fanno perdere il turno.'],
    win: 'Modalità Normale: vince chi porta a casa per primo tutte e quattro le pedine. Modalità Punti: vince chi ha più punti quando finiscono i 15 round o quando qualcuno porta a casa tutte e quattro le pedine.',
    scoring: 'Scegli la modalità prima di giocare. In Normale non ci sono punti: la tabella finale mostra le pedine portate a casa da ciascuno. In Punti ogni casella percorsa vale 1, una pedina mangiata 20, una pedina a casa 30, e finire per primo tutte e quattro vale un bonus di 50.',
    house: [['Blocchi', 'Due pedine dello stesso colore sulla stessa casella del percorso formano un blocco. Nessun altro può superarlo o fermarcisi, e le sue pedine non possono essere mangiate.'], ['Mangia per entrare', 'Una pedina può entrare nella colonna d\'arrivo solo dopo che il suo giocatore ha mangiato almeno una pedina avversaria. Fino ad allora fa un altro giro.'], ['Partenza veloce', 'Ognuno comincia con una pedina già sulla casella di partenza, così il gioco parte subito.'], ['Si gioca per i posti', 'In tre o quattro il gioco non si ferma al vincitore: gli altri continuano per il secondo e il terzo posto, e alla fine si vede l\'ordine d\'arrivo.']],
  },
  carrom: {
    steps: ['Il posto 1 gioca le pedine bianche e il posto 2 le nere. Ce ne sono nove per colore, più la regina rossa al centro.', 'Metti il tuo striker sulla linea di base col cursore Striker, scegli la direzione con Mira e la forza con Potenza, poi tira.', 'Se mandi in buca una tua pedina, tiri di nuovo. Altrimenti il turno passa.', 'La regina va coperta. Dopo averla mandata in buca, manda in buca una tua pedina nello stesso tiro o nel successivo, o torna al centro.', 'Se lo striker finisce in buca è fallo: una delle tue pedine imbucate torna al centro e il turno finisce.', 'La regina deve essere uscita prima che l\'ultima pedina di qualcuno possa restare in buca.'],
    win: 'Vince il primo che manda in buca tutte le sue pedine, con la regina coperta. Dopo 80 tiri vince chi ha meno pedine sul tavolo.',
    scoring: 'Il vincitore prende 1 punto per ogni pedina che l\'altro ha ancora sul tavolo, più 3 se ha la regina.',
  },
  chess: {
    steps: ['Il Bianco muove per primo, poi si alternano. Tocca un pezzo, poi una casa segnata.', 'La torre si muove in linea retta, l\'alfiere in diagonale, la donna in entrambi i modi, il cavallo salta a L e il re si muove di una casa.', 'Il pedone avanza di una casa, o di due alla prima mossa, e cattura una casa in diagonale in avanti. Sull\'ultima traversa diventa donna, torre, alfiere o cavallo.', 'Arrocco: se re e torre non si sono mossi, le case in mezzo sono libere e il re non attraversa uno scacco, il re si sposta di due case verso la torre, che gli salta sopra.', 'En passant: subito dopo che un pedone avanza di due case accanto al tuo, puoi catturarlo come se si fosse mosso di una.', 'Un re attaccato è sotto scacco. Con la tua mossa devi uscire dallo scacco.'],
    win: 'Vince lo scacco matto: il re è sotto scacco e non ha via d\'uscita. È patta per stallo (nessuna mossa legale senza essere sotto scacco), la stessa posizione tre volte, cinquanta mosse a testa senza catture né mosse di pedone, o pezzi insufficienti per dare matto.',
    scoring: 'Una partita finisce con una vittoria o una patta. La tabella finale mostra 1 per il vincitore.',
  },
  'snakes-and-ladders': {
    steps: ['Tutti partono fuori dal tabellone, prima della casella 1. Si tira il dado a turno.', 'Avanza la pedina del numero uscito, seguendo i numeri sul tabellone.', 'Se finisci ai piedi di una scala, sali in cima. Se finisci sulla testa di un serpente, scivoli fino alla coda.', 'Un sei dà un altro tiro.', 'La casella 100 vuole il numero esatto. Se il tiro ti porterebbe oltre, la pedina resta dov\'è.'],
    win: 'Vince il primo che arriva esattamente sulla casella 100.',
    scoring: 'Durante il gioco non ci sono punti. La tabella finale mostra la casella raggiunta da ciascuno.',
    house: [['Partenza col 6', 'Una pedina aspetta fuori dal tabellone finché il suo giocatore non fa 6. Il 6 la mette sulla casella 1, e quel giocatore tira ancora.'], ['Rimbalzo', 'Un tiro che supera il 100 rimbalza: dal 97, un 5 arriva al 100 e torna indietro di due caselle, al 98. Serpenti e scale contano dove si ferma.'], ['Tre sei', 'Tre sei di fila riportano la pedina dov\'era all\'inizio del turno, e il turno passa.']],
  },
  'color-clash': {
    steps: ['Ognuno riceve sette carte. Una carta apre il mazzo degli scarti.', 'Al tuo turno gioca una carta uguale a quella in cima per colore, numero o simbolo.', 'Salta (⊘) fa saltare il giocatore successivo. Inverti (⇄) cambia il senso; in due funziona come Salta. +2 fa pescare due carte al successivo, che salta il turno.', 'Una carta Arcobaleno va su qualsiasi carta e scegli tu il prossimo colore. Arcobaleno +4 fa lo stesso, e il successivo pesca quattro carte e salta il turno.', 'Niente da giocare? Pesca una carta. Puoi giocarla se va bene; altrimenti passa.'],
    win: 'Vince il primo che arriva a 150 punti. Se nessuno ci arriva in cinque mani, vince il punteggio più alto.',
    scoring: 'Chi finisce le carte prende i punti delle carte rimaste in mano agli altri: i numeri valgono il loro valore, le carte azione 20, le carte Arcobaleno 50.',
    house: [['Accumulo', 'Ti arriva un +2? Mettici sopra il tuo +2 o un Arcobaleno +4 e la penalità passa, più grande, al successivo. A un +4 si risponde solo con un altro +4. Chi non può (o non vuole) pesca tutto e salta il turno.'], ['Pesca finché puoi giocare', 'Se non hai carte da giocare, continui a pescare finché ne trovi una che va bene, e poi puoi giocarla.']],
  },
  'call-break': {
    steps: ['Si distribuiscono tutte le 52 carte, 13 a testa.', 'Ognuno dichiara un numero di prese da 1 a 8, partendo dal giocatore dopo il mazziere.', 'Il primo giocatore apre con una carta qualsiasi. A giro, ognuno deve rispondere allo stesso seme e superare la carta migliore se può.', 'Se non hai il seme richiesto devi giocare una picche, e superare la picche più alta se puoi. Senza picche, gioca quello che vuoi.', 'La picche più alta vince la presa; senza picche, la carta più alta del seme d\'apertura. Chi vince apre la presa dopo.'],
    win: 'Dopo cinque mani vince il totale più alto.',
    scoring: 'Se rispetti la dichiarazione prendi il numero dichiarato, più 0,1 per ogni presa in più. Se la manchi, perdi il numero dichiarato.',
  },
  'crazy-eights': {
    steps: ['In due ognuno riceve sette carte, in più cinque. Una carta apre il mazzo degli scarti.', 'Al tuo turno gioca una carta uguale a quella in cima per seme o per valore.', 'Un otto va su qualsiasi carta, e scegli tu il seme che deve seguire.', 'Niente da giocare? Pesca una carta. Giocala se puoi; altrimenti passa.', 'La mano finisce quando qualcuno resta senza carte.'],
    win: 'Dopo tre mani vince chi ha meno punti di penalità.',
    scoring: 'Le carte che ti restano in mano contano contro di te: un otto vale 50, re, donna o fante 10, un asso 1, e ogni altra carta il suo numero.',
    house: [['Il due fa pescare due', 'Un 2 fa pescare due carte al successivo, che salta il turno, a meno che non giochi anche lui un 2: allora il successivo ne pesca quattro, e così via.'], ['Il fante salta', 'Un fante fa saltare il turno al giocatore successivo.'], ['L\'asso inverte', 'Un asso inverte il senso del gioco. In due significa che giochi di nuovo.']],
  },
  checkers: {
    steps: ['Le pedine si muovono di una casa in diagonale in avanti, su una casa scura libera. Tocca una pedina, poi una casa segnata.', 'Per mangiare, salta in diagonale sopra una pedina avversaria fino alla casa libera dietro. La pedina mangiata esce dal tavolo.', 'Se puoi mangiare devi farlo, e se la stessa pedina può saltare ancora, deve continuare.', 'Una pedina che arriva all\'ultima riga diventa dama, e lì il turno finisce. Le dame si muovono e saltano in diagonale avanti e indietro.'],
    win: 'Vinci quando l\'avversario resta senza pedine o senza mosse legali. Quaranta mosse a testa senza catture né mosse di pedine semplici sono patta.',
    scoring: 'Una partita finisce con una vittoria o una patta. La tabella finale mostra 1 per il vincitore.',
  },
  'four-in-a-row': {
    steps: ['A turno, ogni giocatore lascia cadere una pedina in una colonna dove c\'è ancora posto.', 'La pedina cade nello spazio libero più in basso di quella colonna.', 'Metti in fila quattro tue pedine, in orizzontale, in verticale o in diagonale, e vinci subito.'],
    win: 'Vince la prima fila da quattro. Se la griglia si riempie senza file, è pari.',
    scoring: 'Una partita finisce con una vittoria o un pareggio. La tabella finale mostra 1 per il vincitore.',
  },
  'tic-tac-toe': {
    steps: ['Un giocatore è ✕ e l\'altro ◯. Comincia ✕.', 'A turno, prendete una casella libera.', 'Tre tuoi segni in fila, in orizzontale, in verticale o in diagonale, vincono.'],
    win: 'Vince il primo che fa tris. Se le nove caselle si riempiono senza tris, è pari.',
    scoring: 'Una partita finisce con una vittoria o un pareggio. La tabella finale mostra 1 per il vincitore.',
  },
  reversi: {
    steps: ['Si parte con quattro pedine al centro. Il Nero muove per primo.', 'Metti una pedina su una casa segnata. Una mossa deve chiudere almeno una pedina avversaria in linea retta tra la nuova pedina e un\'altra tua.', 'Tutte le pedine chiuse si girano del tuo colore, in tutte le direzioni insieme.', 'Se non hai mosse legali il turno salta. La partita finisce quando nessuno dei due può muovere.'],
    win: 'Vince chi ha più pedine alla fine. A parità di numero, è pari.',
    scoring: 'Il tuo punteggio è il numero di pedine del tuo colore alla fine.',
  },
  'dots-and-boxes': {
    steps: ['A turno, traccia una linea tra due punti vicini.', 'Se la tua linea chiude il quarto lato di un quadratino, è tuo, e devi tracciare ancora.', 'La partita finisce quando sono tracciate tutte le linee.'],
    win: 'Vince chi ha più quadratini. Se sono tutti pari, è pari.',
    scoring: 'Ogni quadratino che chiudi vale un punto.',
  },
  mancala: {
    steps: ['Ogni giocatore ha sei buche dalla sua parte e un granaio all\'estremità destra. Tocca una delle tue buche che contiene semi.', 'Tutti i semi di quella buca vengono seminati uno alla volta, in senso antiorario, nelle buche successive. Passando nel tuo granaio ne lasci uno, ma salti quello dell\'avversario.', 'Se l\'ultimo seme cade nel tuo granaio, giochi ancora.', 'Se l\'ultimo seme cade in una buca vuota dalla tua parte e la buca di fronte ha semi, li prendi tutti, più il tuo seme.', 'Quando una parte resta senza semi, l\'altro giocatore tiene quelli rimasti dalla sua parte.'],
    win: 'Vince chi ha più semi nel granaio. A parità di numero, è pari.',
    scoring: 'Ogni seme nel tuo granaio vale un punto.',
  },
  'nine-mens-morris': {
    steps: ['Piazzamento: a turno, mettete una pedina su un punto libero finché ognuno ne ha messe nove.', 'Movimento: poi, a turno, fate scivolare una pedina lungo una linea fino a un punto vicino libero.', 'Ogni volta che formi una nuova fila da tre, un mulino, togli una pedina avversaria. Le pedine in un mulino sono protette, a meno che non siano tutte in mulini.', 'Volo: quando ti restano solo tre pedine, possono saltare su qualsiasi punto libero.'],
    win: 'Vinci quando l\'avversario resta con due pedine o senza mosse legali. Cinquanta mosse a testa senza catture sono patta.',
    scoring: 'Una partita finisce con una vittoria o una patta. La tabella finale mostra 1 per il vincitore.',
  },
  'memory-match': {
    steps: ['Al tuo turno, tocca due tessere per girarle. Tutti i giocatori le vedono.', 'Se sono uguali, tieni la coppia e giochi ancora.', 'Se non lo sono, si rigirano all\'inizio del turno del giocatore successivo, e il turno passa.'],
    win: 'Quando tutte le coppie sono state trovate, vince chi ne ha di più. Se sono tutti pari, è pari.',
    scoring: 'Ogni coppia vale un punto.',
  },
  yacht: {
    steps: ['Tira tutti e cinque i dadi. Tocca quelli che vuoi tenere, poi ritira gli altri. Puoi farlo fino a tre tiri per turno.', 'Dopo qualsiasi tiro puoi fermarti e segnare in una categoria non ancora usata.', 'Dagli Uno ai Sei si segna la somma di quel numero. Scelta segna la somma di tutti i dadi.', 'Poker segna la somma di quei quattro dadi. Full (tre di un numero e due di un altro) segna la somma di tutti e cinque.', 'Scala piccola (1–5) e Scala grande (2–6) valgono 30. Yacht (tutti e cinque uguali) vale 50.', 'Se non va bene niente, devi comunque scegliere una categoria, anche se vale 0.'],
    win: 'Dopo dodici turni a testa, vince il totale più alto.',
    scoring: 'Il tuo totale è la somma delle dodici categorie.',
    house: [['Bonus superiore', 'Fai 63 o più sommando dagli Uno ai Sei (cioè tre di ogni numero) e alla fine prendi 35 punti extra.']],
  },
  pig: {
    steps: ['Al tuo turno tira il dado. Ogni numero da 2 a 6 si aggiunge al totale di questo turno.', 'Ritira quante volte vuoi, oppure fermati per mettere in banca il totale del turno.', 'Se esce 1, perdi il totale di questo turno e il turno passa.'],
    win: 'Raggiungi l\'obiettivo (50 in Veloce, 100 in Classica e in Due dadi) e tutti gli altri hanno ancora un ultimo turno per batterti. Poi vince la banca più alta.',
    scoring: 'Contano solo i punti messi in banca.',
  },
  werewolf: {
    steps: ['Ognuno legge in segreto il suo ruolo: Lupo mannaro, Veggente, Dottore o Paesano.', 'Notte: i lupi mannari scelgono un giocatore da prendere, la Veggente sceglie un giocatore di cui scopre il ruolo, e il Dottore sceglie un giocatore da proteggere.', 'Mattina: il villaggio scopre chi è stato preso nella notte, a meno che il Dottore non l\'abbia protetto.', 'Giorno: parlatene in chat, poi tutti quelli ancora in gioco votano chi pensano sia un lupo mannaro. Chi ha più voti esce e il suo ruolo viene mostrato. In caso di parità non esce nessuno.', 'Torna la notte, e si continua finché una delle due parti vince.'],
    win: 'Il villaggio vince appena tutti i lupi mannari sono stati votati fuori. I lupi mannari vincono quando sono tanti quanti gli altri.',
    scoring: 'Vince tutta la parte vincente: i lupi mannari insieme, oppure la Veggente, il Dottore e i Paesani insieme. Con nove o più giocatori i lupi mannari sono due.',
  },
  'who-is-the-spy': {
    steps: ['Ogni giocatore legge in segreto la sua parola.', 'A giro, ogni giocatore gioca una carta indizio per la sua parola.', 'Leggete gli indizi, poi tutti votano in segreto il giocatore che sospettano.', 'Chi ha più voti viene accusato. In caso di parità nessuno, e la spia la fa franca.', 'Se la spia viene presa, ha un solo tentativo per indovinare la parola degli altri tra quattro opzioni.'],
    win: 'Dopo tre round vince chi ha più punti.',
    scoring: 'Una spia che la fa franca prende 3. Una spia presa che indovina la parola prende 2; se sbaglia, tutti gli altri prendono 1. Con otto o più giocatori le spie sono due.',
  },
  'truth-or-dare': {
    steps: ['Al tuo turno scegli Verità o Obbligo.', 'Leggi la richiesta, poi rispondi ad alta voce o falla.', 'Tocca Fatto per un punto, o tocca Salta. Saltare non è mai punito.', 'Il turno passa al giocatore successivo.'],
    win: 'Vince chi ha più punti dopo l\'ultimo turno, anche se il vero scopo sono le risate.',
    scoring: 'Ogni verità detta e ogni obbligo fatto vale 1 punto. Saltare non costa nulla.',
  },
  'riddle-chits': {
    steps: ['Un indovinello si apre sul bigliettino perché tutti lo leggano.', 'Scegli la risposta che credi giusta. Nessuno vede la tua scelta finché non hanno risposto tutti.', 'Non sei sicuro? Chiedi un indizio prima di rispondere. Abbassa i tuoi punti per quell\'indovinello.', 'Poi si vedono la risposta e le scelte di tutti, e si apre il bigliettino successivo.'],
    win: 'Vince chi ha più punti dopo l\'ultimo indovinello.',
    scoring: 'Una risposta giusta vale 2 punti, o 1 se hai preso l\'indizio. Una risposta sbagliata non vale nulla.',
  },
  'majority-vote': {
    steps: ['Si apre una domanda con alcune risposte possibili.', 'Ognuno sceglie in segreto la risposta che pensa sceglierà la maggioranza.', 'Quando tutti hanno scelto, i totali appaiono come barre.', 'Tutti quelli che hanno scelto la risposta più votata prendono un punto.'],
    win: 'Vince chi ha più punti dopo l\'ultima domanda.',
    scoring: 'Un punto ogni volta che scegli la risposta della maggioranza. Se due risposte sono pari in testa, contano entrambe.',
  },
  consequences: {
    steps: ['A turno, ogni giocatore aggiunge una frase per la parte mostrata, senza vedere le precedenti.', 'Con gli amici scrivi le tue frasi. A un tavolo con sconosciuti scegli tra frasi scritte da noi, così nessuno può mandare niente di cattivo.', 'Sette parti fanno una storia: chi, ha incontrato chi, dove, cosa ha detto ognuno, cosa è successo e cosa ha detto il mondo.', 'Poi la storia si apre perché tutti la leggano.'],
    win: 'Vincono tutti quando la storia fa ridere l\'intero tavolo.',
    scoring: 'Non ci sono punti: la storia migliore conquista la stanza.',
  },
};
