/** Cómo jugar a cada juego, en español. Los mismos pasos, en el mismo orden, que el inglés de rules.js. */
export default {
  'flying-chit': {
    steps: ['Arrastra el stick, o usa las flechas, W A S D o un mando, para guiar el papelito arriba, abajo, a la izquierda y a la derecha.', 'Un anillo muestra por dónde cruzará tu papelito la próxima pulsera: se pone verde cuando apuntas bien. Cerca de una pulsera, el papelito se desliza suavemente hacia su centro.', 'Atraviesa una pulsera dorada para recuperar algo de impulso. La barra bajo tu puntuación muestra cuánto te queda.', 'Pulseras seguidas forman un combo: ×2, ×3, hasta ×5 puntos cada una.', 'Fallar una pulsera corta el combo. Chocar con un ventilador o una pila de libros te quita mucho impulso.', 'Cuando se acaba el impulso, el papelito planea hasta el suelo y tu vuelo termina.', 'Cada nivel nuevo empieza con una gran pulsera dorada: 10 puntos e impulso completo.'],
    win: 'Solo, persigues tu mejor puntuación. Con otros, todos vuelan a la vez y gana la puntuación más alta.',
    scoring: 'Cada pulsera da los puntos de su combo: 1, luego 2, 3, 4 y 5 mientras dure la cadena. Medallas a los 50, 200, 500 y 1000 puntos.',
  },
  'tunnel-race': {
    steps: ['Arrastra el stick a la izquierda o a la derecha, o usa A y D, las flechas o un mando, para volar por dentro del túnel.', 'Los muros rojos tapan una parte del túnel: rodéalos. Los muros naranjas lo tapan todo menos un hueco: pasa por el hueco.', 'Recoge las gemas brillantes: 10 puntos cada una.', 'Tocar un muro termina tu partida. El túnel va más rápido cuanto más avanzas, y cada nivel trae un tipo de muro nuevo.'],
    win: 'Solo, supera tu mejor puntuación. Con otros, todos corren a la vez y gana la puntuación más alta.',
    scoring: 'Puntos por la distancia que vuelas y 10 por cada gema. Medallas a los 50, 150, 300 y 600 puntos.',
  },
  'turbo-tunnel': {
    steps: ['Arrastra el stick a la izquierda o a la derecha, o usa A y D, las flechas o un mando, para girar por dentro del túnel.', 'Conos, barreras, coches, camiones y rocas terminan tu carrera si los tocas. El siguiente con el que vas a chocar brilla en rojo por debajo.', 'Cada fila del túnel tiene siempre un paso libre al que puedes llegar a tiempo. Unas flechas verdes suaves en la carretera lo marcan.', 'Las monedas valen 10 puntos. Una placa azul de nitro duplica tus puntos de distancia durante tres segundos. Un escudo verde aguanta un golpe por ti.', 'El aceite no te detiene, pero el coche derrapa y responde despacio al volante durante un momento.', 'Pasar algo por un pelo es un casi-choque: 5 puntos extra.'],
    win: 'Solo, supera tu mejor puntuación. Con amigos, todos corren el mismo túnel a la vez: gana el último coche que sigue en pie, y si todos chocan, la puntuación más alta.',
    scoring: 'Puntos por la distancia recorrida (el doble con nitro), 10 por cada moneda y 5 por cada casi-choque. Medallas a los 100, 300, 700 y 1500 puntos.',
  },
  'reaction-time': {
    steps: ["Espera mientras la pantalla está roja. Cuando se ponga verde, toca en cualquier sitio (o pulsa Espacio, Enter o un botón del mando) lo más rápido que puedas.","Tocar antes del verde, o con la señal falsa azul de las rondas 3 y 4, es una salida en falso y no suma nada en esa ronda.","Tu tiempo se mide en tu propio teléfono, desde que el verde aparece en tu pantalla hasta tu toque, así que una conexión lenta nunca te hace más lento. Menos de 100 ms cuenta como adivinar.","Hay cinco rondas. Después de cada una ves el tiempo de todos, y el más rápido de la mesa gana 50 puntos extra."],
    win: "Gana quien tenga más puntos tras cinco rondas. Solo, supera tu mejor marca y gana las medallas.",
    scoring: "Cada ronda suma 500 menos tu tiempo en milisegundos: una reacción de 250 ms suma 250. Las salidas en falso y las rondas sin toque suman 0. Medallas a los 600, 900, 1100 y 1300 puntos.",
  },
  'stroop-test': {
    steps: ["Aparece en una tarjeta el nombre de un color escrito en tinta de color. Toca el botón del color de la TINTA (o pulsa la flecha que lleva).","Desde la tarjeta 6, algunas dicen «Toca la PALABRA»: entonces responde con lo que dice la palabra.","Solo cuenta tu primer toque en cada tarjeta, así que toca cuando estés seguro. De la 11 a la 15 tienes menos tiempo.","Tu tiempo se mide en tu propio teléfono desde que aparece la tarjeta, así que jugar en línea con amigos lejanos es justo."],
    win: "Tras quince tarjetas, gana quien tenga más puntos. Solo, supera tu mejor marca y gana las medallas.",
    scoring: "Una respuesta correcta suma más cuanto más rápida: 2000 menos tu tiempo en milisegundos, dividido entre diez, nunca menos de 10. Fallar o no responder suma 0. Con amigos, la respuesta correcta más rápida de cada tarjeta gana 20 más. Medallas a los 600, 1200, 1700 y 2100 puntos.",
  },
  'number-memory': {
    steps: ["Aparece un número un momento. La barra de abajo muestra cuánto tiempo se quedará.","Cuando se esconda, escribe el número en el teclado (o en tu teclado) y pulsa ✓. Tienes hasta 15 segundos.","Acierto: el siguiente número tiene una cifra más. Fallo: pierdes un corazón. Con tres, quedas fuera.","Cada teléfono guarda lo que escribe su jugador y envía la respuesta entera al pulsar ✓; los teléfonos de los amigos nunca ven el número mientras se responde."],
    win: "Solo, recuerda el número más largo que puedas. Con amigos, gana quien más puntos tenga; la partida acaba cuando todos quedan fuera o cuando el último en pie ya va ganando.",
    scoring: "Cada acierto suma diez puntos por cifra: un número de 7 cifras vale 70. Medallas a los 70, 150, 250 y 400 puntos.",
  },
  'word-guess': {
    steps: ["Ves una pista (como Fruit o Sport) y la palabra en casillas vacías, con una letra a la vista.","Cada segundo y medio aparece otra letra. La última nunca aparece, así que siempre hay que adivinar.","Escribe la palabra entera en el teclado de letras (o en tu teclado) y pulsa ✓. Tienes un solo intento por palabra.","Cada teléfono cronometra a su jugador, y los teléfonos de tus amigos solo reciben las letras ya visibles, nunca la palabra."],
    win: "Tras ocho palabras, gana quien tenga más puntos.",
    scoring: "Un acierto vale 10, más 10 por cada letra aún oculta al enviarlo. Con amigos, el acierto más rápido de cada palabra gana 10 más. Un fallo no suma nada en esa palabra. Medallas a los 80, 160, 240 y 320 puntos.",
  },
  'fast-typing': {
    steps: ["Durante un segundo aparece \"Get ready\" y luego la palabra.","Escribe la palabra en el teclado de letras (o en tu teclado) y pulsa ✓. Tienes un solo intento por palabra.","La barra bajo la palabra muestra el tiempo que queda: cuatro segundos más uno por letra.","Cada teléfono cronometra a su jugador desde que la palabra apareció en él, así que una conexión lenta nunca te quita velocidad."],
    win: "Tras diez palabras, gana quien tenga más puntos.",
    scoring: "Una palabra correcta vale diez puntos por cada letra por segundo: seis letras en dos segundos son 30. Mínimo 5 por palabra correcta, máximo 60. Una letra mal y esa palabra no vale nada. Medallas a los 120, 200, 280 y 360 puntos.",
  },
  'bingo': {
    steps: ["Cada jugador recibe un cartón con 1 a 25 en un orden distinto. Solo tú ves el tuyo.","En tu turno, escribe un número del 1 al 25 que aún no se haya cantado y pulsa ✓. Tienes 15 segundos o se canta uno por ti.","El número cantado se tacha en todos los cartones, el tuyo y los de tus amigos.","Cada fila, columna o diagonal completa es una línea y enciende la siguiente letra de B-I-N-G-O."],
    win: "Gana quien complete cinco líneas primero. Si un número completa dos cartones a la vez, gana quien tenga más líneas; si siguen igualados, gana quien lo cantó.",
    scoring: "La barra de arriba muestra cuántas letras de BINGO lleva cada jugador. Un cartón tiene doce líneas posibles: cinco filas, cinco columnas y dos diagonales.",
  },
  'unblock-puzzle': {
    steps: ["Cada aparcamiento muestra el mototaxi (verde, techo amarillo), los vehículos que lo rodean y la salida a la derecha de su fila.","Arrastra un vehículo con el dedo o el ratón para deslizarlo. Va tan lejos como arrastres, hasta lo primero que lo bloquee.","O elige un vehículo con las flechas, pulsa Hold y deslízalo con las flechas. Pulsa Hold otra vez para soltarlo.","Cuando no quede nada entre el mototaxi y la salida, deslízalo a la derecha y sale. Tienes dos minutos por aparcamiento."],
    win: "Tras cinco aparcamientos, gana quien tenga más puntos.",
    scoring: "Salir vale 50, más hasta 50 por hacerlo en pocos movimientos: 5 menos por cada movimiento por encima del mejor. Con amigos, el primero en salir de cada aparcamiento gana 20 más. Medallas a los 200, 300, 400 y 470 puntos.",
  },
  'hoop-flick': {
    steps: ['Arrastra el stick hacia atrás, como un tirachinas: la pelota saldrá hacia el lado contrario. Cuanto más tiras, más fuerte el lanzamiento.', 'Suelta el stick para lanzar. Con teclas, usa las flechas izquierda y derecha para apuntar, arriba y abajo para la fuerza, y Espacio para lanzar.', 'Haz que la pelota caiga por el siguiente aro desde arriba.', 'Cada aro tiene doce segundos: la barra roja avisa cuando se acaba el tiempo.', 'Si fallas, la pelota sale de la pista y la partida termina.', 'Cada cinco canastas hay un nivel nuevo: aros que se mueven, luego viento, luego las dos cosas.'],
    win: 'Solo, supera tu mejor marca. Con un amigo, cada uno juega su mitad de la pista y gana la puntuación más alta.',
    scoring: 'Una canasta que toca el aro vale 1. Una canasta limpia vale 2, y varias limpias seguidas valen más: hasta 5 puntos cada una. Medallas a los 20, 50, 100 y 200 puntos.',
  },
  'ghost-hostel': {
    steps: ['Tu cama gana monedas cada segundo. Una cama mejor gana más.', 'Usa las flechas o los botones para elegir Cama, Puerta, Ventilador o Arreglar, y pulsa Comprar.', 'Puerta: más resistencia, y queda reparada hasta su nueva resistencia. Arreglar: repara parte de la puerta y luego necesita unos segundos antes del siguiente arreglo.', 'Los ventiladores soplan al fantasma mientras está en tu puerta. Si le haces bastante daño, vuelve flotando a su rincón para recuperarse.', 'El fantasma se hace más fuerte cada treinta segundos, y se enfada más en los últimos cuarenta. Si tu puerta se rompe, te atrapa y quedas fuera.'],
    win: 'Gana todo el que siga en su habitación al amanecer. Si echas al fantasma del todo, la noche termina antes. Si atrapa a todos, gana el fantasma.',
    scoring: 'Sumas cada moneda que ganó tu cama, más 100 por aguantar hasta el amanecer y 150 más si echas al fantasma para siempre.',
  },
  'pin-spin': {
    steps: ['Toca la pantalla, pulsa el botón Chincheta, Espacio o Enter, o un botón del mando para lanzar una chincheta. Siempre sube recta hasta la parte de abajo del tablero.', 'Espera un hueco: si tu chincheta toca otra que ya está clavada, la partida termina.', 'Usa todas las chinchetas que aparecen abajo para terminar el nivel.', 'Clava una pegatina de estrella dorada para ganar 5 puntos extra.', 'Cada quinto nivel es un tablero grande: cambia de velocidad y de sentido.', 'Cada nivel tiene un tiempo límite (la barra fina de abajo): usa todas sus chinchetas antes de que se acabe.'],
    win: 'Solo, supera tu mejor marca. Con otros, cada uno clava en su propio tablero a la vez y gana la puntuación más alta.',
    scoring: 'Cada chincheta que se queda clavada vale 1, cada estrella 5, y terminar un nivel vale el doble del número del nivel. Medallas a los 25, 60, 120 y 250 puntos.',
  },
  'bull-fight': {
    steps: ['Arrastra el stick, o usa W A S D, las flechas o un mando, para mover tu toro.', 'Pulsa Embestir para lanzarte hacia delante. Si el otro toro está más o menos delante, la embestida apunta sola hacia él. Luego espera a que la barra vuelva a decir CHARGE READY.', 'El círculo y la flecha bajo cada toro muestran de quién es y hacia dónde mira. Cerca del borde las pezuñas se agarran a la arena, así que solo sales si te empujan; el borde brilla en rojo y aparece EDGE! cuando estás cerca.', 'Un toro que embiste y golpea al otro lo manda volando y lo deja mareado un momento.', 'Quien es empujado fuera de la línea blanca pierde la ronda. Al cabo de un rato el círculo empieza a encogerse.'],
    win: 'El primero en ganar tres rondas gana la partida.',
    scoring: 'Sacar al otro toro del círculo gana la ronda.',
  },
  'spin-duel': {
    steps: ['Desliza rápido hacia tu rival dentro de los tres segundos de lanzamiento. El botón Lanzar es una alternativa accesible.', 'Un deslizamiento más largo y rápido da más fuerza a tu peonza. Un lanzamiento por ronda.', 'Después del contador, las peonzas giran y chocan solas. Mantén la tuya dentro de la arena y girando.', 'La última peonza que sigue girando gana la ronda. Si las dos se paran a la vez, es empate.', 'El primero en ganar tres rondas gana la partida. Si los dos fallan tres rondas, la partida termina en empate.'],
    win: 'Juega solo contra un bot, en una pantalla, cerca o en línea. Gana monedas jugando y úsalas para desbloquear estilos de peonza y de arena.',
    scoring: 'Ganas una ronda sacando a la otra peonza o girando más tiempo que ella. Gana la partida el primero que gana tres rondas.',
  },
  'pen-fight': {
    steps: ['Desliza hacia tu rival dentro de tres segundos. El botón Golpe es una alternativa accesible.', 'Un deslizamiento más rápido lanza tu bolígrafo con más fuerza; tu dirección marca su camino.', 'Los bolígrafos se deslizan y chocan solos. El que cae por el borde o vuelca tras un choque pierde la ronda.', 'Si los dos siguen en la mesa, gana el que queda en mejor posición; las rondas muy igualadas son empate.', 'El primero en ganar tres rondas gana la partida. Tres rondas en las que fallan los dos terminan en empate.'],
    win: 'Juega solo contra un bot, con un amigo en una pantalla, cerca o en línea. Desbloquea aspectos de bolígrafo y de mesa con las monedas que ganes; los estilos son solo decorativos.',
    scoring: 'Ganas una ronda tirando el bolígrafo rival de la mesa, volcándolo con un choque fuerte o aguantando más que él. Gana la partida el primero que gana tres rondas.',
  },
  'lapa-chupi': {
    steps: ['En cada partida busca un jugador distinto. Quien busca espera junto a la pared con los ojos cerrados mientras los demás tienen cinco segundos para esconderse.', 'Usa el joystick o las flechas para moverte por el patio en 3D. Mantén Sprint para correr más rápido, pero solo un segundo o así antes de quedarte sin aliento.', 'Párate junto a un arbusto, un banco o un juego del patio y quédate quieto para esconderte. Moverte, o dejar que quien busca se acerque, te delata.', 'Quien busca gana si encuentra a todos. Los que siguen escondidos cuando se acaba el tiempo ganan juntos.', 'En las salas en línea, la posición de los jugadores escondidos no se envía a los demás.'],
    win: 'Juega con jugadores de la computadora, con amigos en una pantalla, cerca o en línea. Los bots ocupan los asientos libres.',
    scoring: 'Quien busca suma uno por cada jugador que encuentra y gana si los encuentra a todos. Los que siguen escondidos al acabar el tiempo ganan juntos y suman más que cualquier número de hallazgos.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani necesita tres o cuatro jugadores: uno que la liga y los que corren. Los jugadores de la computadora ocupan los huecos, y quien la liga cambia en cada partida.', 'Quien la liga cuenta hasta tres en el centro del patio mientras los demás se dispersan. Entonces empieza la persecución.', 'Muévete con el joystick o las flechas. Mantén Sprint para un acelerón; tras un segundo o así te quedas sin aliento y tienes que andar un rato.', 'Cuando quien la liga toca a alguien, ese jugador se congela (¡baraf!). Un jugador libre que toca a un amigo congelado lo descongela (¡pani!).', 'Quien la liga gana si todos los demás están congelados a la vez. Los que corren ganan si al menos uno sigue libre cuando se acaba el tiempo.'],
    win: 'Juega solo contra corredores de la computadora, con amigos en una pantalla, cerca o en línea. Los bots ocupan los asientos libres.',
    scoring: 'Se gana por equipos: quien la liga, congelando a todos; los que corren, manteniendo al menos a uno libre hasta el final. Los ganadores suman 1.',
  },
  'pakda-padi': {
    steps: ['Muévete por el patio con el joystick o las flechas. Mantén Sprint para un acelerón; tras un segundo o así te quedas sin aliento y tienes que andar un rato.', 'El jugador marcado como IT cuenta hasta tres y luego persigue a los demás. Acércate lo bastante para pasarle la pillada.', 'Si te pillan, date la vuelta y persigue a otro. No vale devolverla: durante dos segundos no puedes pillar a quien te acaba de pillar.', 'Cuando se acaba el tiempo, gana el jugador que menos tiempo ha pasado siendo IT. Puede haber empate.'],
    win: 'Juega con jugadores de la computadora, con amigos en una pantalla, cerca o en línea. Los bots ocupan los asientos libres.',
    scoring: 'Gana quien menos tiempo ha pasado siendo IT. Las pilladas se cuentan en el marcador.',
  },
  'ship-fight': {
    steps: ['Mueve tu barco por toda tu mitad del mar. Su cañón dispara solo al otro barco cada segundo, más o menos.', 'Cada barco aguanta cinco impactos. Las rocas paran los disparos: úsalas para cubrirte.', 'En el centro aparecen cajas: un corazón repara tu barco, y la caja de cañón da cinco disparos triples.', 'Si una ronda dura demasiado, una tormenta desgasta los barcos, empezando por el que tiene menos vida.'],
    win: 'El primero en ganar tres rondas gana la partida.',
    scoring: 'Hundir el otro barco gana la ronda.',
  },
  'road-dash': {
    steps: ['Pulsa izquierda o derecha (arrastra el stick, A y D, o las flechas) para cambiar de carril.', 'Esquiva las vacas, los baches, los autobuses y los otros rickshaws.', 'Recoge monedas para ganar puntos extra.', 'La carretera va más rápido cuanto más aguantas, y cada 100 puntos o así hay un nivel nuevo con tráfico nuevo. Un solo choque termina tu partida.'],
    win: 'Solo, supera tu mejor puntuación. Con otros, gana la puntuación más alta.',
    scoring: 'Sumas puntos por la distancia recorrida y 5 por cada moneda.',
  },
  'backyard-rally': {
    steps: ['Mueve tu pala arriba y abajo.', 'Devuelve la pelota. Cada golpe la hace un poco más rápida.', 'El borde de la pala manda la pelota con un ángulo más cerrado.', 'Si la pelota pasa tu pala, el otro jugador suma un punto.'],
    win: 'El primero en llegar a siete puntos gana.',
    scoring: 'Un punto cada vez que la pelota pasa al otro jugador.',
  },
  'hungry-snake': {
    steps: ['Guía tu serpiente arriba, abajo, a la izquierda o a la derecha. Nunca deja de moverse.', 'Cómete un bocado para sumar un punto y crecer.', 'Chocar con un muro, contigo misma o con otra serpiente termina tu partida.', 'Con otros, la última serpiente en movimiento gana 3 puntos extra.'],
    win: 'Solo, supera tu mejor puntuación. Con otros, gana la puntuación más alta.',
    scoring: 'Un punto por bocado, más 3 por ser la última que queda.',
  },
  ludo: {
    steps: ['Pulsa Tirar en tu turno. Necesitas un seis para sacar una ficha de casa a tu casilla de salida.', 'Toca una ficha que brille, o su botón, para avanzarla lo que salió en el dado. Aunque solo pueda moverse una ficha, la tocas tú; si ninguna puede moverse, tu turno termina.', 'Si caes en una ficha rival, vuelve a su casa. Las casillas de salida y las de estrella son seguras: ahí no se come a nadie.', 'Tras dar la vuelta al tablero, la ficha sube por tu pasillo de llegada. Para llegar a la meta necesitas el número exacto.', 'Un seis, comerse una ficha y llevar una ficha a la meta te dan otra tirada. Tres seises seguidos te hacen perder el turno.'],
    win: 'Modo Normal: gana el primero que lleva sus cuatro fichas a la meta. Modo Puntos: gana quien tenga más puntos cuando terminan las 15 rondas o cuando alguien lleva sus cuatro fichas a la meta.',
    scoring: 'Elige el modo antes de jugar. En el modo Normal no hay puntos: la tabla final muestra las fichas que cada jugador llevó a la meta. En el modo Puntos cada casilla avanzada vale 1, comerse una ficha 20, llevar una ficha a la meta 30, y terminar primero con las cuatro, un extra de 50.',
    house: [['Barreras', 'Dos fichas del mismo color en la misma casilla del recorrido forman una barrera. Nadie más puede pasarla ni caer en ella, y sus fichas no se pueden comer.'], ['Comer para llegar', 'Una ficha solo puede entrar en su pasillo de llegada cuando su jugador ya se ha comido al menos una ficha rival. Hasta entonces sigue dando vueltas.'], ['Salida rápida', 'Cada jugador empieza con una ficha ya en su casilla de salida, para que el juego arranque enseguida.'], ['Jugar por los puestos', 'Con tres o cuatro jugadores el juego no se detiene con el ganador: los demás siguen por el segundo y el tercer puesto, y al final se muestra el orden de llegada.']],
  },
  carrom: {
    steps: ['El asiento 1 juega con las fichas blancas y el asiento 2 con las negras. Hay nueve de cada color, más la reina roja en el centro.', 'Coloca tu golpeador en la línea base con el control Golpeador, elige la dirección con Apuntar y la fuerza con Potencia, y luego tira.', 'Si metes una de tus fichas, vuelves a tirar. Si no, pasa el turno.', 'La reina hay que cubrirla. Después de meterla, mete una de tus fichas en el mismo tiro o en el siguiente, o vuelve al centro.', 'Si el golpeador entra en una tronera es falta: una de tus fichas metidas vuelve al centro y tu turno termina.', 'La reina tiene que estar fuera antes de que la última ficha de alguien pueda quedarse dentro.'],
    win: 'Gana el primero que mete todas sus fichas con la reina cubierta. Si pasan 80 tiros, gana quien tenga menos fichas en el tablero.',
    scoring: 'El ganador suma 1 punto por cada ficha que el otro jugador aún tiene en el tablero, más 3 por tener la reina.',
  },
  chess: {
    steps: ['Las blancas mueven primero y luego se alternan los turnos. Toca una pieza y después una casilla marcada.', 'La torre se mueve en línea recta, el alfil en diagonal, la dama de las dos formas, el caballo salta en forma de L y el rey avanza una casilla.', 'El peón avanza una casilla, o dos en su primer movimiento, y captura una casilla en diagonal hacia delante. Al llegar a la última fila se convierte en dama, torre, alfil o caballo.', 'Enroque: si el rey y una torre no se han movido, las casillas entre ellos están vacías y el rey no pasa por jaque, el rey se mueve dos casillas hacia la torre, que salta por encima de él.', 'Al paso: justo después de que un peón avance dos casillas y quede junto al tuyo, puedes capturarlo como si hubiera avanzado una.', 'Un rey atacado está en jaque. En tu movimiento tienes que salir del jaque.'],
    win: 'Gana el jaque mate: el rey está en jaque y no tiene salida. Es tablas por ahogado (sin movimiento legal y sin jaque), la misma posición tres veces, cincuenta movimientos por bando sin capturas ni movimientos de peón, o material insuficiente para dar mate.',
    scoring: 'Una partida termina en victoria o en tablas. La tabla final muestra 1 para el ganador.',
  },
  'snakes-and-ladders': {
    steps: ['Todos empiezan fuera del tablero, antes de la casilla 1. Se tira el dado por turnos.', 'Avanza tu ficha lo que salió en el dado, siguiendo los números por el tablero.', 'Si caes al pie de una escalera, subes hasta arriba. Si caes en la cabeza de una serpiente, bajas hasta su cola.', 'Un seis te da otra tirada.', 'La casilla 100 necesita el número exacto. Si la tirada te haría pasarte, tu ficha se queda donde está.'],
    win: 'Gana el primero que cae justo en la casilla 100.',
    scoring: 'No hay puntos durante la partida. La tabla final muestra la casilla a la que llegó cada jugador.',
    house: [['Empezar con un 6', 'Una ficha espera fuera del tablero hasta que su jugador saca un 6. El 6 la pone en la casilla 1, y ese jugador vuelve a tirar.'], ['Rebote', 'Una tirada que se pasa de 100 rebota: desde el 97, un 5 llega al 100 y retrocede dos casillas, hasta el 98. Las serpientes y escaleras cuentan donde cae.'], ['Tres seises', 'Tres seises seguidos devuelven la ficha a donde estaba al empezar ese turno, y el turno pasa.']],
  },
  'color-clash': {
    steps: ['Cada uno recibe siete cartas. Una carta empieza el montón.', 'En tu turno, juega una carta que coincida con la de arriba en color, en número o en símbolo.', 'Salto (⊘) se salta al siguiente jugador. Cambio de sentido (⇄) invierte el orden; con dos jugadores funciona como un salto. +2 hace que el siguiente robe dos y pierda su turno.', 'Una carta Arcoíris vale sobre cualquiera y eliges el siguiente color. Arcoíris +4 hace lo mismo, y el siguiente roba cuatro y pierde su turno.', '¿No puedes jugar? Roba una carta. Puedes jugarla si encaja; si no, pasa.'],
    win: 'Gana el primero que llega a 150 puntos. Si nadie llega en cinco rondas, gana la puntuación más alta.',
    scoring: 'Quien se queda sin cartas suma las cartas que quedan en la mano de los demás: los números valen lo que marcan, las cartas de acción 20 y las Arcoíris 50.',
    house: [['Acumular', '¿Te cae un +2? Juega tu propio +2 o un Arcoíris +4 encima y el castigo pasa al siguiente jugador, más grande. A un +4 solo se responde con otro +4. Quien no puede (o no quiere) roba todo y pierde su turno.'], ['Robar hasta poder jugar', 'Si no tienes carta para jugar, sigues robando hasta conseguir una que encaje, y entonces puedes jugarla.']],
  },
  'call-break': {
    steps: ['Se reparten las 52 cartas, 13 a cada jugador.', 'Cada jugador apuesta un número de bazas del 1 al 8, empezando por el que está después del que reparte.', 'El primero sale con cualquier carta. Por turnos, cada jugador debe jugar el mismo palo y superar la mejor carta hasta ese momento si puede.', 'Si no tienes del palo que salió, debes jugar una pica, y superar la pica más alta si puedes. Sin picas, juega cualquier carta.', 'La pica más alta gana la baza; sin picas, la carta más alta del palo que salió. El ganador sale en la siguiente.'],
    win: 'Tras cinco rondas, gana el total más alto.',
    scoring: 'Si cumples tu apuesta, sumas el número que dijiste, más 0,1 por cada baza de más. Si no la cumples, pierdes el número que dijiste.',
  },
  'crazy-eights': {
    steps: ['Cada jugador recibe siete cartas con dos jugadores, cinco con más. Una carta empieza el montón.', 'En tu turno juega una carta que coincida con la de arriba en palo o en valor.', 'Un ocho se puede jugar sobre cualquier carta, y tú dices el palo que tiene que seguir.', 'Si no tienes nada que jugar, roba una carta. Juégala si puedes; si no, pasa.', 'La ronda termina cuando alguien se queda sin cartas.'],
    win: 'Tras tres rondas, gana el jugador con menos puntos de castigo.',
    scoring: 'Las cartas que te quedan en la mano cuentan en contra: un ocho vale 50, un rey, una reina o una jota 10, un as 1, y cualquier otra carta su número.',
    house: [['Los doses roban dos', 'Un 2 hace que el siguiente robe dos cartas y pierda su turno, salvo que juegue su propio 2: entonces el siguiente roba cuatro, y así sucesivamente.'], ['Las jotas saltan', 'Una jota hace que el siguiente jugador pierda su turno.'], ['Los ases cambian de sentido', 'Un as invierte el sentido del juego. Con dos jugadores, vuelves a jugar tú.']],
  },
  checkers: {
    steps: ['Las piezas avanzan una casilla en diagonal hacia una casilla oscura libre. Toca una pieza y después una casilla marcada.', 'Para capturar, salta en diagonal sobre una pieza rival hasta la casilla libre de detrás. La pieza capturada sale del tablero.', 'Si puedes capturar, debes hacerlo, y si la misma pieza puede volver a saltar, tiene que seguir.', 'Una pieza que llega a la última fila se corona como dama y ahí termina el turno. Las damas se mueven y saltan en diagonal hacia delante y hacia atrás.'],
    win: 'Ganas cuando el otro jugador se queda sin piezas o sin movimientos legales. Cuarenta movimientos por bando sin capturas ni movimientos de una pieza sin coronar es tablas.',
    scoring: 'Una partida termina en victoria o en tablas. La tabla final muestra 1 para el ganador.',
  },
  'four-in-a-row': {
    steps: ['Por turnos, cada jugador deja caer una ficha en cualquier columna que tenga sitio.', 'La ficha cae hasta el hueco libre más bajo de esa columna.', 'Haz una línea de cuatro fichas tuyas, en horizontal, vertical o diagonal, y ganas al instante.'],
    win: 'Gana la primera línea de cuatro. Si la cuadrícula se llena sin ninguna línea, es empate.',
    scoring: 'Una partida termina en victoria o en empate. La tabla final muestra 1 para el ganador.',
  },
  'tic-tac-toe': {
    steps: ['Un jugador es ✕ y el otro ◯. Empieza ✕.', 'Por turnos, cada uno marca una casilla libre.', 'Tres marcas tuyas en línea, en horizontal, vertical o diagonal, ganan.'],
    win: 'Gana el primero que hace una línea de tres. Si las nueve casillas se llenan sin ninguna línea, es empate.',
    scoring: 'Una partida termina en victoria o en empate. La tabla final muestra 1 para el ganador.',
  },
  reversi: {
    steps: ['La partida empieza con cuatro fichas en el centro. Mueven primero las negras.', 'Coloca una ficha en una casilla marcada. Un movimiento debe encerrar al menos una ficha rival en línea recta entre la ficha nueva y otra tuya.', 'Todas las fichas encerradas se dan la vuelta a tu color, en todas las direcciones a la vez.', 'Si no tienes movimiento legal, pierdes el turno. La partida termina cuando ninguno de los dos puede mover.'],
    win: 'Gana quien tenga más fichas al final. Con el mismo número, es empate.',
    scoring: 'Tu puntuación es el número de fichas de tu color al final.',
  },
  'dots-and-boxes': {
    steps: ['Por turnos, dibuja una línea entre dos puntos vecinos.', 'Si tu línea cierra el cuarto lado de un cuadrado, es tuyo, y tienes que volver a dibujar.', 'La partida termina cuando se han dibujado todas las líneas.'],
    win: 'Gana el jugador con más cuadrados. Si todos empatan, es empate.',
    scoring: 'Cada cuadrado que cierras vale un punto.',
  },
  mancala: {
    steps: ['Cada jugador tiene seis hoyos en su lado y un almacén en el extremo derecho. Toca uno de tus hoyos que tenga semillas.', 'Todas las semillas de ese hoyo se siembran una a una, en sentido contrario a las agujas del reloj, en los hoyos siguientes. Pasas por tu almacén dejando una, pero te saltas el del otro jugador.', 'Si tu última semilla cae en tu almacén, vuelves a jugar.', 'Si tu última semilla cae en un hoyo vacío de tu lado y el hoyo de enfrente tiene semillas, te las llevas todas, más tu propia semilla.', 'Cuando un lado se queda sin semillas, el otro jugador se queda con las que quedan en su lado.'],
    win: 'Gana quien tenga más semillas en su almacén. Con el mismo número, es empate.',
    scoring: 'Cada semilla en tu almacén vale un punto.',
  },
  'nine-mens-morris': {
    steps: ['Colocar: por turnos, coloca una pieza en cualquier punto libre hasta que cada jugador haya puesto nueve.', 'Mover: después, por turnos, desliza una pieza por una línea hasta un punto vecino libre.', 'Cada vez que formas una nueva línea de tres, un molino, quitas una pieza rival. Las piezas en un molino están protegidas, salvo que todas estén en molinos.', 'Volar: cuando solo te quedan tres piezas, pueden saltar a cualquier punto libre.'],
    win: 'Ganas cuando al otro jugador le quedan dos piezas o no tiene movimiento legal. Cincuenta movimientos por bando sin capturas es tablas.',
    scoring: 'Una partida termina en victoria o en tablas. La tabla final muestra 1 para el ganador.',
  },
  'memory-match': {
    steps: ['En tu turno, toca dos fichas para darles la vuelta. Todos los jugadores las ven.', 'Si son pareja, te la quedas y vuelves a jugar.', 'Si no lo son, se vuelven a tapar al empezar el turno del siguiente jugador, y el turno pasa.'],
    win: 'Cuando se han encontrado todas las parejas, gana quien tenga más. Si todos empatan, es empate.',
    scoring: 'Cada pareja vale un punto.',
  },
  yacht: {
    steps: ['Tira los cinco dados. Toca los que quieras guardar y vuelve a tirar los demás. Puedes hacerlo hasta tres tiradas por turno.', 'Después de cualquier tirada, puedes parar y anotar en una categoría que aún no hayas usado.', 'Unos a Seises suman el total de ese número. Elección suma el total de todos los dados.', 'Póquer suma el total de esos cuatro dados. Full (tres de uno y dos de otro) suma el total de los cinco.', 'Escalera pequeña (1–5) y Escalera grande (2–6) valen 30. Yacht (los cinco iguales) vale 50.', 'Si nada encaja, igualmente tienes que elegir una categoría, aunque valga 0.'],
    win: 'Tras doce turnos cada uno, gana el total más alto.',
    scoring: 'Tu total es la suma de las doce categorías.',
    house: [['Bonus de arriba', 'Si sumas 63 o más entre Unos y Seises (eso es tres de cada número), ganas 35 puntos extra al final.']],
  },
  pig: {
    steps: ['En tu turno, tira el dado. Cualquier número del 2 al 6 se suma a tu total de este turno.', 'Vuelve a tirar tantas veces como quieras, o plántate para guardar el total del turno.', 'Si sacas un 1, pierdes el total de este turno y el turno pasa.'],
    win: 'Llega a la meta (50 en Rápido, 100 en Clásico y en Dos dados) y todos los demás tienen un último turno para superarte. Después gana quien tenga más guardado.',
    scoring: 'Solo cuentan los puntos guardados.',
  },
  werewolf: {
    steps: ['Cada uno lee en secreto su papel: Lobo, Vidente, Doctor o Aldeano.', 'Noche: los lobos eligen a un jugador para atraparlo, la Vidente elige a un jugador para conocer su papel y el Doctor elige a un jugador para protegerlo.', 'Mañana: el pueblo descubre a quién atraparon por la noche, salvo que el Doctor lo protegiera.', 'Día: hablad en el chat y luego todos los que siguen votan al jugador que creen que es lobo. El más votado se va y se muestra su papel. Si hay empate, no se va nadie.', 'Vuelve a caer la noche, y el juego sigue hasta que gana un bando.'],
    win: 'El pueblo gana en cuanto todos los lobos han sido expulsados. Los lobos ganan cuando son tantos como el resto.',
    scoring: 'Gana todo el bando ganador: los lobos juntos, o la Vidente, el Doctor y los Aldeanos juntos. Con nueve o más jugadores hay dos lobos.',
  },
  'who-is-the-spy': {
    steps: ['Cada jugador lee en secreto su palabra.', 'Por turnos, cada jugador juega una carta de pista para su palabra.', 'Leed las pistas y luego todos votan en secreto al jugador del que sospechan.', 'El más votado queda acusado. Si hay empate, no se acusa a nadie y el espía se escapa.', 'Si atrapan al espía, tiene un intento para adivinar la palabra de los demás entre cuatro opciones.'],
    win: 'Tras tres rondas, gana el jugador con más puntos.',
    scoring: 'Un espía que se escapa suma 3. Un espía atrapado que adivina la palabra suma 2; si falla, todos los demás suman 1. Con ocho o más jugadores hay dos espías.',
  },
  'truth-or-dare': {
    steps: ['En tu turno, elige Verdad o Reto.', 'Lee lo que te toca y respóndelo en voz alta o hazlo.', 'Pulsa Hecho para ganar un punto, o pulsa Saltar. Saltar nunca tiene castigo.', 'El turno pasa al siguiente jugador.'],
    win: 'Gana quien tenga más puntos tras el último turno, aunque lo importante son las risas.',
    scoring: 'Cada verdad contada y cada reto cumplido vale 1 punto. Saltar no cuesta nada.',
  },
  'riddle-chits': {
    steps: ['Se abre una adivinanza en el papelito para que todos la lean.', 'Elige la respuesta que creas correcta. Nadie ve tu elección hasta que todos han respondido.', '¿No estás seguro? Pide una pista antes de responder. Baja tus puntos de esa adivinanza.', 'Después se muestran la respuesta y lo que eligió cada uno, y se abre el siguiente papelito.'],
    win: 'Gana el jugador con más puntos tras la última adivinanza.',
    scoring: 'Una respuesta correcta vale 2 puntos, o 1 si pediste la pista. Una respuesta incorrecta no suma nada.',
  },
  'majority-vote': {
    steps: ['Se abre una pregunta con varias respuestas posibles.', 'Cada uno elige en secreto la respuesta que cree que elegirá la mayoría.', 'Cuando todos han elegido, los totales aparecen como barras.', 'Todos los que eligieron la respuesta más popular suman un punto.'],
    win: 'Gana el jugador con más puntos tras la última pregunta.',
    scoring: 'Un punto cada vez que eliges la respuesta de la mayoría. Si dos respuestas empatan como las más elegidas, cuentan las dos.',
  },
  consequences: {
    steps: ['Por turnos, cada jugador añade una frase para la parte que se muestra, sin ver las anteriores.', 'Con amigos, escribes tus propias frases. En una mesa con desconocidos, eliges entre frases escritas por nosotros, para que nadie pueda enviar nada desagradable.', 'Siete partes forman una historia: quién, con quién se encontró, dónde, qué dijo cada uno, qué pasó y qué dijo el mundo.', 'Después la historia se despliega para que todos la lean.'],
    win: 'Ganan todos cuando la historia hace reír a toda la mesa.',
    scoring: 'No hay puntos: la mejor historia se gana a la sala.',
  },
};
