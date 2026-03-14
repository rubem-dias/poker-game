# 🃏 Poker - Texas Hold'em Multiplayer

Jogo de poker Texas Hold'em multiplayer em tempo real, construído com Next.js, Socket.io e Framer Motion.

## Como jogar

### Iniciar o servidor

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Para jogar com amigos na mesma rede

1. Descubra seu IP local (ex: `192.168.1.100`)
2. Seus amigos acessam `http://192.168.1.100:3000`
3. Crie uma mesa e compartilhe o código de 6 letras

## Funcionalidades

- **Texas Hold'em** completo (pre-flop, flop, turn, river, showdown)
- **Multiplayer real-time** via WebSockets (Socket.io)
- **2 a 9 jogadores** por mesa
- **Animações** de cartas, fichas e ações
- **Timer de turno** (30 segundos por jogada)
- **Chat** na mesa
- **Confetti** quando você ganha! 🎉
- **8 avatares** diferentes
- **Folha rara**, flush, straight, four of a kind e muito mais detectados automaticamente

## Stack

- **Next.js 14** (App Router)
- **Socket.io** (WebSockets em tempo real)
- **Framer Motion** (animações)
- **Zustand** (gerenciamento de estado)
- **Tailwind CSS** (estilização)
- **TypeScript** (tipagem completa)
- **Zod** (validação de eventos)

## Estrutura

```
server/          # Servidor Node.js customizado
  game/          # Engine do poker (pura lógica, sem I/O)
    Deck.ts      # Baralho e embaralhamento
    HandEvaluator.ts  # Avaliação de mãos (7 cartas)
    PokerEngine.ts    # Máquina de estados do jogo
    RoomManager.ts    # Gerenciamento de salas
  socket/        # Handlers do Socket.io
    handlers/
      roomHandlers.ts  # criar/entrar/sair de sala
      gameHandlers.ts  # ações do jogo

components/      # Componentes React
  cards/         # PlayingCard com animação de flip 3D
  chips/         # ChipStack animado
  player/        # PlayerSeat, TurnTimer
  table/         # PokerTable, GameRoom
  controls/      # ActionBar, ChatPanel
  lobby/         # LobbyPage
  ui/            # WinnerOverlay

stores/          # Zustand store (estado global)
hooks/           # useSocket, usePlayerActions
types/           # Tipos TypeScript compartilhados
lib/             # Utilitários (cardUtils, chipUtils)
```
