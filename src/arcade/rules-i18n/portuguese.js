/** Como jogar cada jogo, em português. Os mesmos passos, na mesma ordem, que o inglês de rules.js. */
export default {
  'flying-chit': {
    steps: ['Arraste o direcional, ou use as setas, W A S D ou um controle, para guiar o bilhetinho para cima, para baixo, para a esquerda e para a direita.', 'Um anel mostra por onde o bilhetinho vai cruzar a próxima pulseira: ele fica verde quando você está na mira. Perto de uma pulseira, o bilhetinho é puxado de leve para o meio dela.', 'Passe por uma pulseira dourada para recuperar um pouco de impulso. A barra embaixo da sua pontuação mostra quanto resta.', 'Pulseiras seguidas formam um combo: ×2, ×3, até ×5 pontos cada uma.', 'Errar uma pulseira acaba com o combo. Bater num ventilador ou numa pilha de livros tira muito impulso.', 'Quando o impulso acaba, o bilhetinho plana até o chão e o seu voo termina.', 'Cada nível novo começa com uma grande pulseira dourada: 10 pontos e impulso completo.'],
    win: 'Sozinho, você corre atrás da sua melhor pontuação. Com outros, todos voam ao mesmo tempo e vence a maior pontuação.',
    scoring: 'Cada pulseira vale os pontos do combo: 1, depois 2, 3, 4 e 5 enquanto a sequência durar. Medalhas com 50, 200, 500 e 1000 pontos.',
  },
  'tunnel-race': {
    steps: ['Arraste o direcional para a esquerda ou para a direita, ou use A e D, as setas ou um controle, para voar por dentro do túnel.', 'As paredes vermelhas bloqueiam parte do túnel: dê a volta nelas. As paredes laranja fecham tudo menos uma abertura: passe pela abertura.', 'Pegue as gemas brilhantes: 10 pontos cada.', 'Encostar numa parede termina a sua corrida. O túnel fica mais rápido quanto mais você avança, e cada nível traz um tipo novo de parede.'],
    win: 'Sozinho, bata a sua melhor pontuação. Com outros, todos correm ao mesmo tempo e vence a maior pontuação.',
    scoring: 'Pontos pela distância que você voa, e 10 por gema. Medalhas com 50, 150, 300 e 600 pontos.',
  },
  'turbo-tunnel': {
    steps: ['Arraste o direcional para a esquerda ou para a direita, ou use A e D, as setas ou um controle, para girar por dentro do túnel.', 'Cones, barreiras, carros, caminhões e pedras acabam com a sua corrida se você encostar neles. O próximo em que o seu carro vai bater brilha em vermelho por baixo.', 'Cada fileira do túnel sempre tem uma passagem livre que dá para alcançar a tempo. Setas verdes suaves na pista mostram onde ela está.', 'Moedas valem 10 pontos. Uma placa azul de nitro dobra os seus pontos de distância por três segundos. Um escudo verde aguenta uma batida por você.', 'O óleo não para você, mas o carro derrapa e responde devagar ao volante por um momento.', 'Passar raspando por alguma coisa é um quase-acidente: 5 pontos de bônus.'],
    win: 'Sozinho, bata a sua melhor pontuação. Com amigos, todos correm no mesmo túnel ao mesmo tempo: vence o último carro que continua andando, e se todos baterem, vence a maior pontuação.',
    scoring: 'Pontos pela distância percorrida (em dobro com nitro), 10 por moeda e 5 por quase-acidente. Medalhas com 100, 300, 700 e 1500 pontos.',
  },
  'reaction-time': {
    steps: ["Espere enquanto a tela está vermelha. Quando ficar verde, toque em qualquer lugar (ou aperte Espaço, Enter ou um botão do controle) o mais rápido que puder.","Tocar antes do verde, ou no sinal falso azul das rodadas 3 e 4, é queimar a largada e não vale nada naquela rodada.","O seu tempo é medido no seu próprio celular, de quando o verde aparece na sua tela até o toque, então uma conexão lenta nunca deixa você mais lento. Menos de 100 ms conta como chute.","São cinco rodadas. Depois de cada uma você vê o tempo de todos, e o mais rápido da mesa ganha 50 pontos de bônus."],
    win: "Vence quem tiver mais pontos depois de cinco rodadas. Sozinho, bata o seu recorde e ganhe as medalhas.",
    scoring: "Cada rodada vale 500 menos o seu tempo em milissegundos: uma reação de 250 ms vale 250. Largadas queimadas e rodadas sem toque valem 0. Medalhas com 600, 900, 1100 e 1300 pontos.",
  },
  'stroop-test': {
    steps: ["Um cartão mostra o nome de uma cor escrito numa tinta colorida. Toque no botão da cor da TINTA (ou aperte a seta mostrada nele).","A partir do cartão 6, alguns dizem \"Toque na PALAVRA\": aí responda com o que a palavra diz.","Só o seu primeiro toque em cada cartão conta, então toque com certeza. Do 11 ao 15 você tem menos tempo.","O seu tempo é medido no seu próprio celular a partir de quando o cartão apareceu, então jogar on-line com amigos distantes é justo."],
    win: "Depois de quinze cartões, vence quem tiver mais pontos. Sozinho, bata o seu recorde e ganhe as medalhas.",
    scoring: "Uma resposta certa vale mais quanto mais rápida: 2000 menos o seu tempo em milissegundos, dividido por dez, nunca menos de 10. Errar ou não responder vale 0. Com amigos, a resposta certa mais rápida de cada cartão ganha mais 20. Medalhas com 600, 1200, 1700 e 2100 pontos.",
  },
  'number-memory': {
    steps: ["Um número aparece por um instante. A barra embaixo mostra quanto tempo ele vai ficar.","Quando ele sumir, digite o número no teclado da tela (ou no seu teclado) e toque em ✓. Você tem até 15 segundos.","Acertou: o próximo número tem um dígito a mais. Errou: perde um coração. Com três, você está fora.","Cada celular guarda o que o seu jogador digita e envia a resposta inteira no ✓; os celulares dos amigos nunca veem o número enquanto todos respondem."],
    win: "Sozinho, guarde o número mais longo que conseguir. Com amigos, vence quem tiver mais pontos; o jogo acaba quando todos saem ou quando o último que sobrou já está na frente.",
    scoring: "Cada acerto vale dez pontos por dígito: um número de 7 dígitos vale 70. Medalhas com 70, 150, 250 e 400 pontos.",
  },
  'word-guess': {
    steps: ["Você vê uma dica (como Fruit ou Sport) e a palavra em quadrados vazios, com uma letra à mostra.","A cada segundo e meio aparece outra letra. A última nunca aparece, então sempre é preciso adivinhar.","Digite a palavra inteira no teclado de letras (ou no seu teclado) e toque em ✓. Há só uma tentativa por palavra.","Cada celular cronometra o seu jogador, e os celulares dos amigos só recebem as letras já à mostra, nunca a palavra."],
    win: "Depois de oito palavras, vence quem tiver mais pontos.",
    scoring: "Um acerto vale 10, mais 10 por cada letra ainda escondida quando você enviou. Com amigos, o acerto mais rápido de cada palavra ganha mais 10. Um erro não vale nada naquela palavra. Medalhas com 80, 160, 240 e 320 pontos.",
  },
  'fast-typing': {
    steps: ["\"Get ready\" aparece por um segundo e depois vem a palavra.","Digite a palavra no teclado de letras (ou no seu teclado) e toque em ✓. Há só uma tentativa por palavra.","A barra sob a palavra mostra o tempo restante: quatro segundos mais um por letra.","Cada celular cronometra o seu jogador a partir do momento em que a palavra apareceu nele, então uma conexão lenta nunca tira sua velocidade."],
    win: "Depois de dez palavras, vence quem tiver mais pontos.",
    scoring: "Uma palavra certa vale dez pontos por letra por segundo: seis letras em dois segundos são 30. No mínimo 5 por palavra certa, no máximo 60. Uma letra errada e a palavra não vale nada. Medalhas com 120, 200, 280 e 360 pontos.",
  },
  'bingo': {
    steps: ["Cada jogador recebe uma cartela com 1 a 25 numa ordem diferente. Só você vê a sua.","Na sua vez, digite um número de 1 a 25 que ainda não foi cantado e toque em ✓. Você tem 15 segundos, ou um número é cantado por você.","O número cantado é riscado em todas as cartelas, na sua e nas dos amigos.","Cada linha, coluna ou diagonal completa conta como uma linha e acende a próxima letra de B-I-N-G-O."],
    win: "Vence quem fechar cinco linhas primeiro. Se um número fechar duas cartelas ao mesmo tempo, vence quem tiver mais linhas; se ainda empatar, vence quem cantou.",
    scoring: "A barra no topo mostra quantas letras de BINGO cada jogador acendeu. Uma cartela tem doze linhas possíveis: cinco horizontais, cinco verticais e duas diagonais.",
  },
  'unblock-puzzle': {
    steps: ["Cada estacionamento mostra o tuk-tuk (verde, teto amarelo), os veículos em volta e a saída à direita da fila dele.","Arraste um veículo com o dedo ou o mouse para deslizá-lo. Ele vai até onde você arrastar, até o primeiro obstáculo.","Ou escolha um veículo com as setas, toque em Hold e deslize com as setas. Toque em Hold de novo para soltar.","Quando nada estiver entre o tuk-tuk e a saída, deslize-o para a direita e ele sai. Você tem dois minutos por estacionamento."],
    win: "Depois de cinco estacionamentos, vence quem tiver mais pontos.",
    scoring: "Sair vale 50, mais até 50 por fazer em poucos movimentos: 5 a menos por movimento acima do melhor. Com amigos, o primeiro a sair de cada estacionamento ganha mais 20. Medalhas com 200, 300, 400 e 470 pontos.",
  },
  'hoop-flick': {
    steps: ['Puxe o direcional para trás, como um estilingue: a bola vai voar para o lado contrário. Quanto mais você puxa, mais forte o arremesso.', 'Solte o direcional para arremessar. No teclado, use as setas esquerda e direita para mirar, para cima e para baixo para a força, e Espaço para arremessar.', 'Faça a bola cair por dentro da próxima cesta, de cima para baixo.', 'Cada cesta tem doze segundos: a barra vermelha avisa quando o tempo está acabando.', 'Errou, a bola sai da quadra e a partida termina.', 'A cada cinco cestas vem um nível novo: cestas que se mexem, depois vento, depois os dois.'],
    win: 'Sozinho, bata o seu recorde. Com um amigo, cada um joga na sua metade da quadra e vence a maior pontuação.',
    scoring: 'Uma cesta que encosta no aro vale 1. Uma cesta limpa vale 2, e cestas limpas seguidas valem mais: até 5 pontos cada. Medalhas com 20, 50, 100 e 200 pontos.',
  },
  'ghost-hostel': {
    steps: ['A sua cama ganha moedas a cada segundo. Uma cama melhor ganha mais.', 'Use as setas ou os botões para escolher Cama, Porta, Ventilador ou Consertar, e aperte Comprar.', 'Porta: mais resistência, e ela fica consertada até a nova resistência. Consertar: arruma parte da porta e depois precisa de alguns segundos até o próximo conserto.', 'Os ventiladores sopram o fantasma enquanto ele está na sua porta. Machuque-o o bastante e ele volta flutuando para o canto dele para se recuperar.', 'O fantasma fica mais forte a cada trinta segundos, e mais bravo nos últimos quarenta. Se a sua porta quebrar, você é pego e sai do jogo.'],
    win: 'Vence quem ainda estiver no quarto ao amanhecer. Espante o fantasma de vez e a noite termina mais cedo. Se todos forem pegos, o fantasma vence.',
    scoring: 'Você soma cada moeda que a sua cama ganhou, mais 100 por aguentar até o amanhecer e mais 150 se o fantasma for espantado de vez.',
  },
  'pin-spin': {
    steps: ['Toque na tela, aperte o botão Tachinha, Espaço ou Enter, ou um botão do controle para lançar uma tachinha. Ela sempre sobe reta até a parte de baixo do quadro.', 'Espere um espaço: se a sua tachinha encostar numa que já está no quadro, a partida termina.', 'Use todas as tachinhas mostradas embaixo da tela para terminar o nível.', 'Acerte um adesivo de estrela dourada para ganhar 5 pontos de bônus.', 'A cada cinco níveis vem um quadro grande: ele muda de velocidade e de sentido.', 'Cada nível tem um tempo limite (a barra fina embaixo): use todas as tachinhas antes que ele acabe.'],
    win: 'Sozinho, bata o seu recorde. Com outros, cada um prega no seu próprio quadro ao mesmo tempo e vence a maior pontuação.',
    scoring: 'Cada tachinha que fica vale 1, cada estrela 5, e terminar um nível vale o dobro do número do nível. Medalhas com 25, 60, 120 e 250 pontos.',
  },
  'bull-fight': {
    steps: ['Arraste o direcional, ou use W A S D, as setas ou um controle, para mover o seu touro.', 'Aperte Investir para avançar com tudo. Se o outro touro estiver mais ou menos na sua frente, a investida mira sozinha nele. Depois espere a barra mostrar CHARGE READY de novo.', 'O círculo e a seta embaixo de cada touro mostram de quem ele é e para onde está virado. Perto da borda os cascos se firmam na areia, então você só sai se for empurrado; a borda brilha em vermelho e aparece EDGE! quando você está perto.', 'Um touro que investe e acerta o outro o arremessa longe e o deixa tonto por um momento.', 'Quem é empurrado para fora da linha branca perde a rodada. Depois de um tempo o círculo começa a encolher.'],
    win: 'O primeiro a vencer três rodadas leva a partida.',
    scoring: 'Empurrar o outro touro para fora vence a rodada.',
  },
  'spin-duel': {
    steps: ['Deslize rápido na direção do rival dentro dos três segundos de lançamento. O botão Lançar é uma alternativa acessível.', 'Um deslize mais longo e rápido dá mais força ao seu pião. Um lançamento por rodada.', 'Depois do cronômetro, os piões giram e se chocam sozinhos. Mantenha o seu na arena e girando.', 'O último pião girando vence a rodada. Se os dois pararem juntos, a rodada empata.', 'O primeiro a vencer três rodadas leva a partida. Se os dois errarem três rodadas, a partida termina empatada.'],
    win: 'Jogue sozinho contra um bot, numa tela, por perto ou on-line. Ganhe moedas jogando e use-as para liberar estilos de pião e de arena.',
    scoring: 'Você vence a rodada derrubando o outro pião para fora ou girando mais tempo que ele. Leva a partida quem vencer três rodadas primeiro.',
  },
  'pen-fight': {
    steps: ['Deslize na direção do rival dentro de três segundos. O botão Peteleco é uma alternativa acessível.', 'Um deslize mais rápido manda a sua caneta com mais força; a direção define o caminho dela.', 'As canetas deslizam e se chocam sozinhas. A caneta que cai da beirada ou tomba com uma batida perde a rodada.', 'Se as duas continuarem na mesa, vence a que terminar em melhor posição; rodadas muito parelhas empatam.', 'O primeiro a vencer três rodadas leva a partida. Três rodadas em que os dois erram terminam em empate.'],
    win: 'Jogue sozinho contra um bot, com um amigo numa tela, por perto ou on-line. Libere visuais de caneta e de mesa com as moedas que ganhar; os estilos são só decorativos.',
    scoring: 'Você vence a rodada derrubando a caneta rival da mesa, tombando-a com uma batida forte ou durando mais que ela. Leva a partida quem vencer três rodadas primeiro.',
  },
  'lapa-chupi': {
    steps: ['Em cada partida, um jogador diferente procura. Quem procura espera na parede de olhos fechados enquanto os outros têm cinco segundos para se esconder.', 'Use o joystick ou as setas para andar pelo pátio em 3D. Segure Correr para ir mais rápido, mas só por um segundo, mais ou menos, antes de perder o fôlego.', 'Pare perto de um arbusto, de um banco ou de um brinquedo do pátio e fique parado para se esconder. Mexer-se, ou deixar quem procura chegar perto, entrega você.', 'Quem procura vence se achar todo mundo. Quem ainda estiver escondido quando o tempo acabar vence junto.', 'Nas salas on-line, a posição dos jogadores escondidos não é enviada aos outros.'],
    win: 'Jogue com jogadores do computador, com amigos numa tela, por perto ou on-line. Bots ocupam os lugares vagos.',
    scoring: 'Quem procura marca um ponto por jogador achado e vence se achar todos. Quem ainda estiver escondido quando o tempo acabar vence junto e marca mais do que qualquer número de achados.',
  },
  'baraf-pani': {
    steps: ['Baraf Pani precisa de três ou quatro jogadores: um pegador e os que fogem. Jogadores do computador ocupam os lugares vagos, e o pegador muda a cada partida.', 'O pegador conta até três no meio do pátio enquanto os outros se espalham. Aí começa a perseguição.', 'Mova-se com o joystick ou as setas. Segure Correr para uma arrancada; depois de um segundo, mais ou menos, você perde o fôlego e precisa andar um pouco.', 'Quando o pegador encosta em alguém, essa pessoa congela (baraf!). Quem está livre e encosta num amigo congelado o descongela (pani!).', 'O pegador vence se todos os outros estiverem congelados ao mesmo tempo. Os que fogem vencem se pelo menos um ainda estiver livre quando o tempo acabar.'],
    win: 'Jogue sozinho contra corredores do computador, com amigos numa tela, por perto ou on-line. Bots ocupam os lugares vagos.',
    scoring: 'Vence-se em equipe: o pegador, congelando todos; os que fogem, mantendo pelo menos um livre até o fim. Os vencedores marcam 1.',
  },
  'pakda-padi': {
    steps: ['Ande pelo pátio com o joystick ou as setas. Segure Correr para uma arrancada; depois de um segundo, mais ou menos, você perde o fôlego e precisa andar um pouco.', 'O jogador marcado como IT conta até três e depois persegue os outros. Chegue perto o bastante para passar o pique.', 'Pegou você? Vire-se e corra atrás de outro. Não vale devolver: por dois segundos você não pode pegar quem acabou de pegar você.', 'Quando o tempo acaba, vence quem passou menos tempo como IT. Pode haver empate.'],
    win: 'Jogue com jogadores do computador, com amigos numa tela, por perto ou on-line. Bots ocupam os lugares vagos.',
    scoring: 'Vence quem passou menos tempo como IT. As pegadas aparecem no placar.',
  },
  'ship-fight': {
    steps: ['Mova o seu navio por toda a sua metade do mar. O canhão dele atira sozinho no outro navio, mais ou menos a cada segundo.', 'Cada navio aguenta cinco tiros. As pedras bloqueiam os tiros, então use-as como proteção.', 'Caixas aparecem no meio: um coração conserta o seu navio, e a caixa de canhão dá cinco tiros triplos.', 'Se uma rodada demorar demais, uma tempestade vai desgastando os navios, começando pelo que tem menos vida.'],
    win: 'O primeiro a vencer três rodadas leva a partida.',
    scoring: 'Afundar o outro navio vence a rodada.',
  },
  'road-dash': {
    steps: ['Aperte esquerda ou direita (arraste o direcional, A e D, ou as setas) para trocar de faixa.', 'Desvie das vacas, dos buracos, dos ônibus e dos outros riquixás.', 'Pegue moedas para ganhar pontos extras.', 'A estrada fica mais rápida quanto mais você aguenta, e a cada 100 pontos, mais ou menos, vem um nível novo com trânsito novo. Uma batida termina a sua corrida.'],
    win: 'Sozinho, bata a sua melhor pontuação. Com outros, vence a maior pontuação.',
    scoring: 'Você marca pela distância percorrida, e 5 por moeda.',
  },
  'backyard-rally': {
    steps: ['Mova a sua raquete para cima e para baixo.', 'Rebata a bola. Cada rebatida a deixa um pouco mais rápida.', 'A ponta da raquete manda a bola num ângulo mais fechado.', 'Se a bola passar pela sua raquete, o outro jogador marca.'],
    win: 'O primeiro a chegar a sete pontos vence.',
    scoring: 'Um ponto cada vez que a bola passa pelo outro jogador.',
  },
  'hungry-snake': {
    steps: ['Guie a sua cobra para cima, para baixo, para a esquerda ou para a direita. Ela nunca para.', 'Coma um petisco para marcar um ponto e crescer.', 'Bater numa parede, em si mesma ou em outra cobra termina o seu jogo.', 'Com outros, a última cobra em movimento ganha 3 pontos de bônus.'],
    win: 'Sozinho, bata a sua melhor pontuação. Com outros, vence a maior pontuação.',
    scoring: 'Um ponto por petisco, mais 3 por ser a última que sobrou.',
  },
  ludo: {
    steps: ['Toque em Jogar na sua vez. Você precisa de um seis para tirar um peão da base e colocá-lo na sua casa de saída.', 'Toque num peão que brilha, ou no botão dele, para andar o número tirado. Mesmo quando só um peão pode andar, você mesmo toca nele; se nenhum puder, a sua vez termina.', 'Caia em cima de um peão rival e ele volta para a base. As casas de saída e as casas de estrela são seguras: ali ninguém é capturado.', 'Depois de dar a volta no tabuleiro, o peão entra na sua reta final. Para chegar em casa é preciso o número exato.', 'Um seis, uma captura e um peão chegando em casa dão outra jogada cada. Três seis seguidos fazem você perder a vez.'],
    win: 'Modo Normal: vence quem levar os quatro peões para casa primeiro. Modo Pontos: vence quem tiver mais pontos quando acabarem as 15 rodadas ou quando alguém levar os quatro peões para casa.',
    scoring: 'Escolha o modo antes de jogar. No modo Normal não há pontos: a tabela final mostra quantos peões cada um levou para casa. No modo Pontos, cada casa andada vale 1, uma captura 20, um peão em casa 30, e terminar os quatro primeiro vale um bônus de 50.',
    house: [['Bloqueios', 'Dois peões da mesma cor na mesma casa do percurso formam um bloqueio. Ninguém mais pode passar nem parar ali, e esses peões não podem ser capturados.'], ['Capturar para entrar', 'Um peão só pode entrar na reta final depois que o seu jogador capturar pelo menos um peão rival. Até lá, ele dá outra volta no tabuleiro.'], ['Começo rápido', 'Cada jogador começa com um peão já na casa de saída, para o jogo andar logo.'], ['Jogar pelas colocações', 'Com três ou quatro jogadores o jogo não para no vencedor: os outros continuam pelo segundo e terceiro lugares, e a ordem de chegada aparece no final.']],
  },
  carrom: {
    steps: ['O lugar 1 joga com as peças brancas e o lugar 2 com as pretas. São nove de cada, mais a rainha vermelha no meio.', 'Posicione o seu atirador na linha de base com o controle Atirador, escolha a direção com Mirar e a força com Força, e depois atire.', 'Encaçapou uma peça sua? Atire de novo. Se não, a vez passa.', 'A rainha precisa ser coberta. Depois de encaçapá-la, encaçape uma peça sua na mesma tacada ou na seguinte, ou ela volta para o centro.', 'Se o atirador cair numa caçapa é falta: uma das suas peças encaçapadas volta para o centro e a sua vez termina.', 'A rainha tem que sair antes que a última peça de alguém possa ficar na caçapa.'],
    win: 'Vence quem encaçapar todas as suas peças, com a rainha coberta. Se passarem 80 tacadas, vence quem tiver menos peças no tabuleiro.',
    scoring: 'O vencedor marca 1 ponto por peça que o outro jogador ainda tem no tabuleiro, mais 3 por estar com a rainha.',
  },
  chess: {
    steps: ['As brancas jogam primeiro, depois os jogadores se alternam. Toque numa peça e depois numa casa marcada.', 'A torre anda em linha reta, o bispo nas diagonais, a dama dos dois jeitos, o cavalo pula em L e o rei anda uma casa.', 'O peão anda uma casa para a frente, ou duas no primeiro lance, e captura uma casa na diagonal para a frente. Na última fileira ele vira dama, torre, bispo ou cavalo.', 'Roque: se o rei e uma torre não se mexeram, as casas entre eles estão vazias e o rei não passa por xeque, o rei anda duas casas em direção à torre, que pula por cima dele.', 'En passant: logo depois que um peão anda duas casas e para ao lado do seu, você pode capturá-lo como se ele tivesse andado uma.', 'Um rei atacado está em xeque. No seu lance, você precisa sair do xeque.'],
    win: 'Xeque-mate vence: o rei está em xeque e não tem saída. A partida empata por afogamento (sem lance legal e sem xeque), a mesma posição três vezes, cinquenta lances de cada lado sem captura nem lance de peão, ou peças insuficientes para dar mate.',
    scoring: 'A partida termina em vitória ou empate. A tabela final mostra 1 para o vencedor.',
  },
  'snakes-and-ladders': {
    steps: ['Todos começam fora do tabuleiro, antes da casa 1. Os jogadores jogam o dado na sua vez.', 'Ande com o seu peão o número tirado, seguindo os números pelo tabuleiro.', 'Caiu no pé de uma escada? Suba até o topo. Caiu na cabeça de uma cobra? Escorregue até o rabo dela.', 'Um seis dá outra jogada.', 'A casa 100 precisa do número exato. Se o dado levaria você para além dela, o peão fica onde está.'],
    win: 'Vence quem cair exatamente na casa 100 primeiro.',
    scoring: 'Não há pontos durante o jogo. A tabela final mostra a casa a que cada jogador chegou.',
    house: [['Começar com 6', 'Um peão espera fora do tabuleiro até o seu jogador tirar um 6. O 6 o coloca na casa 1, e esse jogador joga de novo.'], ['Voltar', 'Um dado que passa de 100 volta: do 97, um 5 chega ao 100 e volta duas casas, até o 98. Cobras e escadas valem onde ele parar.'], ['Três seis', 'Três seis seguidos mandam o peão de volta para onde estava no começo da vez, e a vez passa.']],
  },
  'color-clash': {
    steps: ['Cada um recebe sete cartas. Uma carta começa a pilha.', 'Na sua vez, jogue uma carta que combine com a de cima na cor, no número ou no símbolo.', 'Pular (⊘) pula o próximo jogador. Inverter (⇄) muda o sentido; com dois jogadores funciona como pular. +2 faz o próximo comprar duas e perder a vez.', 'Uma carta Arco-íris vale em cima de qualquer uma e você escolhe a próxima cor. Arco-íris +4 faz o mesmo, e o próximo compra quatro e perde a vez.', 'Nada para jogar? Compre uma carta. Pode jogá-la se combinar; se não, passe.'],
    win: 'Vence quem chegar primeiro a 150 pontos. Se ninguém chegar em cinco rodadas, vence a maior pontuação.',
    scoring: 'Quem esvazia a mão marca as cartas que sobraram na mão dos outros: números valem o que mostram, cartas de ação 20 e cartas Arco-íris 50.',
    house: [['Acumular', 'Levou um +2? Jogue o seu +2 ou um Arco-íris +4 em cima e a punição passa para o próximo, maior. Um +4 só pode ser respondido com outro +4. Quem não puder (ou não quiser) compra tudo e perde a vez.'], ['Comprar até poder jogar', 'Sem carta para jogar, você continua comprando até tirar uma que combine, e então pode jogá-la.']],
  },
  'call-break': {
    steps: ['As 52 cartas são distribuídas, 13 para cada jogador.', 'Cada jogador aposta um número de vazas de 1 a 8, começando pelo jogador depois de quem deu as cartas.', 'O primeiro sai com qualquer carta. Na sequência, cada um precisa jogar o mesmo naipe, e superar a melhor carta até ali se puder.', 'Sem o naipe que saiu, você precisa jogar uma de espadas, e superar a espada mais alta se puder. Sem espadas, jogue qualquer carta.', 'A espada mais alta leva a vaza; sem espadas, a carta mais alta do naipe que saiu. Quem ganha sai na próxima.'],
    win: 'Depois de cinco rodadas, vence o maior total.',
    scoring: 'Cumpriu a aposta? Marca o número apostado, mais 0,1 por vaza extra. Não cumpriu? Perde o número apostado.',
  },
  'crazy-eights': {
    steps: ['Cada jogador recebe sete cartas com dois jogadores, cinco com mais. Uma carta começa a pilha.', 'Na sua vez, jogue uma carta que combine com a de cima no naipe ou no valor.', 'Um oito pode ser jogado em cima de qualquer carta, e você diz o naipe que vem a seguir.', 'Sem nada para jogar, compre uma carta. Jogue-a se puder; se não, passe.', 'A rodada termina quando alguém fica sem cartas.'],
    win: 'Depois de três rodadas, vence quem tiver o menor total de pontos de castigo.',
    scoring: 'As cartas que sobram na sua mão contam contra você: um oito vale 50, rei, dama ou valete 10, ás 1, e qualquer outra carta vale o seu número.',
    house: [['Dois compra dois', 'Um 2 faz o próximo comprar duas cartas e perder a vez, a não ser que jogue um 2 também: aí o seguinte compra quatro, e assim por diante.'], ['Valete pula', 'Um valete faz o próximo jogador perder a vez.'], ['Ás inverte', 'Um ás inverte o sentido do jogo. Com dois jogadores, você joga de novo.']],
  },
  checkers: {
    steps: ['As peças andam uma casa na diagonal para a frente, para uma casa escura livre. Toque numa peça e depois numa casa marcada.', 'Para capturar, pule na diagonal por cima de uma peça rival até a casa livre atrás dela. A peça capturada sai do tabuleiro.', 'Se puder capturar, você é obrigado, e se a mesma peça puder pular de novo, ela tem que continuar.', 'Uma peça que chega à última fileira vira dama, e a vez termina ali. As damas andam e pulam na diagonal para a frente e para trás.'],
    win: 'Você vence quando o outro jogador fica sem peças ou sem lance legal. Quarenta lances de cada lado sem captura nem lance de peça comum é empate.',
    scoring: 'A partida termina em vitória ou empate. A tabela final mostra 1 para o vencedor.',
  },
  'four-in-a-row': {
    steps: ['Os jogadores se revezam soltando uma ficha em qualquer coluna que ainda tenha espaço.', 'A ficha cai até o espaço livre mais baixo daquela coluna.', 'Faça uma linha de quatro fichas suas, na horizontal, na vertical ou na diagonal, e você vence na hora.'],
    win: 'A primeira linha de quatro vence. Se a grade encher sem nenhuma linha, é empate.',
    scoring: 'A partida termina em vitória ou empate. A tabela final mostra 1 para o vencedor.',
  },
  'tic-tac-toe': {
    steps: ['Um jogador é ✕ e o outro é ◯. O ✕ começa.', 'Revezem-se marcando uma casa livre.', 'Três marcas suas em linha, na horizontal, na vertical ou na diagonal, vencem.'],
    win: 'Vence quem fizer uma linha de três primeiro. Se as nove casas encherem sem linha, dá velha (empate).',
    scoring: 'A partida termina em vitória ou empate. A tabela final mostra 1 para o vencedor.',
  },
  reversi: {
    steps: ['O jogo começa com quatro peças no meio. As pretas jogam primeiro.', 'Coloque uma peça numa casa marcada. A jogada precisa prender pelo menos uma peça rival em linha reta entre a peça nova e outra sua.', 'Todas as peças presas viram para a sua cor, em todas as direções ao mesmo tempo.', 'Se você não tiver lance legal, perde a vez. O jogo termina quando nenhum dos dois pode jogar.'],
    win: 'Vence quem tiver mais peças no final. Com o mesmo número, é empate.',
    scoring: 'A sua pontuação é o número de peças da sua cor no final.',
  },
  'dots-and-boxes': {
    steps: ['Revezem-se traçando uma linha entre dois pontos vizinhos.', 'Se a sua linha fechar o quarto lado de um quadrado, ele é seu, e você precisa traçar de novo.', 'O jogo termina quando todas as linhas forem traçadas.'],
    win: 'Vence quem tiver mais quadrados. Se todos empatarem, é empate.',
    scoring: 'Cada quadrado que você fecha vale um ponto.',
  },
  mancala: {
    steps: ['Cada jogador tem seis covas do seu lado e um depósito na ponta direita. Toque numa cova sua que tenha sementes.', 'Todas as sementes daquela cova são semeadas uma a uma, no sentido anti-horário, nas covas seguintes. Você passa pelo seu depósito deixando uma, mas pula o do outro jogador.', 'Se a sua última semente cair no seu depósito, você joga de novo.', 'Se a sua última semente cair numa cova vazia do seu lado e a cova da frente tiver sementes, você captura todas, mais a sua própria semente.', 'Quando um lado fica sem sementes, o outro jogador fica com as que sobraram do lado dele.'],
    win: 'Vence quem tiver mais sementes no depósito. Com o mesmo número, é empate.',
    scoring: 'Cada semente no seu depósito vale um ponto.',
  },
  'nine-mens-morris': {
    steps: ['Colocação: revezem-se colocando uma peça em qualquer ponto livre até cada jogador ter colocado nove.', 'Movimento: depois, revezem-se deslizando uma peça por uma linha até um ponto vizinho livre.', 'Sempre que você formar uma nova linha de três, um moinho, tire uma peça rival. Peças num moinho estão protegidas, a não ser que todas estejam em moinhos.', 'Voo: com só três peças sobrando, as suas podem pular para qualquer ponto livre.'],
    win: 'Você vence quando o outro jogador fica com duas peças ou sem lance legal. Cinquenta lances de cada lado sem captura é empate.',
    scoring: 'A partida termina em vitória ou empate. A tabela final mostra 1 para o vencedor.',
  },
  'memory-match': {
    steps: ['Na sua vez, toque em duas peças para virá-las. Todos os jogadores podem vê-las.', 'Se formarem par, você fica com ele e joga de novo.', 'Se não formarem, elas desviram no começo da vez do próximo jogador, e a vez passa.'],
    win: 'Quando todos os pares forem achados, vence quem tiver mais. Se todos empatarem, é empate.',
    scoring: 'Cada par vale um ponto.',
  },
  yacht: {
    steps: ['Jogue os cinco dados. Toque nos que quiser guardar e jogue os outros de novo. Dá para fazer isso até três vezes por vez.', 'Depois de qualquer jogada, você pode parar e marcar numa categoria que ainda não usou.', 'Uns a Seis marcam a soma daquele número. Escolha marca a soma de todos os dados.', 'Quadra marca a soma desses quatro dados. Full house (três de um e dois de outro) marca a soma dos cinco.', 'Sequência baixa (1–5) e Sequência alta (2–6) valem 30. Yacht (os cinco iguais) vale 50.', 'Se nada encaixar, você ainda precisa escolher uma categoria, mesmo que marque 0.'],
    win: 'Depois de doze vezes cada um, vence o maior total.',
    scoring: 'O seu total é a soma das doze categorias.',
    house: [['Bônus de cima', 'Some 63 ou mais de Uns a Seis juntos (isso é três de cada número) e você ganha 35 pontos extras no final.']],
  },
  pig: {
    steps: ['Na sua vez, jogue o dado. Qualquer número de 2 a 6 vai para o seu total desta vez.', 'Jogue de novo quantas vezes quiser, ou pare para guardar o total da vez.', 'Se tirar 1, você perde o total desta vez e a vez passa.'],
    win: 'Chegue à meta (50 no Rápido, 100 no Clássico e no Dois dados) e todos os outros ainda têm uma última vez para passar você. Depois vence quem tiver mais guardado.',
    scoring: 'Só os pontos guardados contam.',
  },
  werewolf: {
    steps: ['Cada um lê em segredo o seu papel: Lobisomem, Vidente, Médico ou Aldeão.', 'Noite: os lobisomens escolhem um jogador para pegar, a Vidente escolhe um jogador para descobrir o papel dele, e o Médico escolhe um jogador para proteger.', 'Manhã: a vila descobre quem foi pego à noite, a não ser que o Médico tenha protegido essa pessoa.', 'Dia: conversem no chat, depois todos que continuam no jogo votam em quem acham que é lobisomem. O mais votado sai e o seu papel é revelado. Empate significa que ninguém sai.', 'A noite cai de novo, e o jogo continua até um lado vencer.'],
    win: 'A vila vence assim que todos os lobisomens forem expulsos. Os lobisomens vencem quando forem tantos quanto o resto.',
    scoring: 'Todo o lado vencedor ganha: os lobisomens juntos, ou a Vidente, o Médico e os Aldeões juntos. Com nove ou mais jogadores há dois lobisomens.',
  },
  'who-is-the-spy': {
    steps: ['Cada jogador lê em segredo a sua palavra.', 'Na sequência da mesa, cada jogador joga uma carta de pista para a sua palavra.', 'Leiam as pistas e depois todos votam em segredo em quem suspeitam.', 'O mais votado é acusado. Um empate significa que ninguém é acusado, e o espião escapa.', 'Se o espião for pego, ele tem um palpite para adivinhar a palavra dos outros entre quatro opções.'],
    win: 'Depois de três rodadas, vence quem tiver mais pontos.',
    scoring: 'Um espião que escapa marca 3. Um espião pego que adivinha a palavra marca 2; se errar, todos os outros marcam 1. Com oito ou mais jogadores há dois espiões.',
  },
  'truth-or-dare': {
    steps: ['Na sua vez, escolha Verdade ou Desafio.', 'Leia o que caiu para você e responda em voz alta ou faça.', 'Toque em Feito para ganhar um ponto, ou em Pular. Pular nunca tem castigo.', 'A vez passa para o próximo jogador.'],
    win: 'Vence quem tiver mais pontos depois da última vez, mas o que vale mesmo são as risadas.',
    scoring: 'Cada verdade contada e cada desafio cumprido vale 1 ponto. Pular não custa nada.',
  },
  'riddle-chits': {
    steps: ['Uma charada abre no bilhetinho para todos lerem.', 'Escolha a resposta que você acha certa. Ninguém vê a sua escolha até todos responderem.', 'Na dúvida? Peça uma dica antes de responder. Ela diminui os seus pontos nessa charada.', 'Depois aparecem a resposta e a escolha de cada um, e o próximo bilhetinho abre.'],
    win: 'Vence quem tiver mais pontos depois da última charada.',
    scoring: 'Uma resposta certa vale 2 pontos, ou 1 se você pediu a dica. Uma resposta errada não vale nada.',
  },
  'majority-vote': {
    steps: ['Abre uma pergunta com algumas respostas possíveis.', 'Cada um escolhe em segredo a resposta que acha que a maioria vai escolher.', 'Quando todos escolherem, os totais aparecem em barras.', 'Todo mundo que escolheu a resposta mais popular marca um ponto.'],
    win: 'Vence quem tiver mais pontos depois da última pergunta.',
    scoring: 'Um ponto cada vez que você escolhe a resposta da maioria. Se duas respostas empatarem como as mais escolhidas, as duas contam.',
  },
  consequences: {
    steps: ['Cada jogador, na sua vez, escreve uma frase para a parte mostrada, sem ver as anteriores.', 'Com amigos, você digita as suas próprias frases. Numa mesa com desconhecidos, você escolhe entre frases escritas por nós, para que ninguém possa mandar nada maldoso.', 'Sete partes formam uma história: quem, encontrou quem, onde, o que cada um disse, o que aconteceu e o que o mundo disse.', 'Depois a história se desdobra para todos lerem.'],
    win: 'Todo mundo ganha quando a história faz a mesa inteira rir.',
    scoring: 'Não há pontos: a melhor história conquista a sala.',
  },
};
