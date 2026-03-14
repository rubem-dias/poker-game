import { Card, GamePhase, GameState, HandResult, Player, PlayerAction, PlayerStatus, SidePot } from '../../types/game';
import { Deck } from './Deck';
import { evaluateBestHand } from './HandEvaluator';

export class PokerEngine {
  private deck: Deck;
  public state: GameState;

  constructor(smallBlind: number, bigBlind: number) {
    this.deck = new Deck();
    this.state = {
      phase: 'waiting',
      players: [],
      communityCards: [],
      pot: 0,
      sidePots: [],
      currentBet: 0,
      activePlayerId: null,
      dealerSeatIndex: 0,
      smallBlindAmount: smallBlind,
      bigBlindAmount: bigBlind,
      minRaise: bigBlind,
      maxRaise: 0,
      handResults: null,
      roundNumber: 0,
    };
  }

  addPlayer(id: string, name: string, seatIndex: number, chips: number, avatar: number): void {
    const player: Player = {
      id, name, seatIndex, chips, bet: 0, totalBet: 0,
      cards: null, status: 'waiting', isDealer: false,
      isSmallBlind: false, isBigBlind: false, lastAction: null,
      avatar, isConnected: true,
    };
    this.state.players.push(player);
    this.state.players.sort((a, b) => a.seatIndex - b.seatIndex);
  }

  removePlayer(id: string): void {
    this.state.players = this.state.players.filter(p => p.id !== id);
  }

  setPlayerConnected(id: string, connected: boolean): void {
    const p = this.getPlayer(id);
    if (p) p.isConnected = connected;
  }

  startNewHand(): void {
    const activePlayers = this.state.players.filter(p => p.chips > 0);
    if (activePlayers.length < 2) throw new Error('Need at least 2 players');

    this.deck.reset();
    this.state.communityCards = [];
    this.state.pot = 0;
    this.state.sidePots = [];
    this.state.currentBet = 0;
    this.state.handResults = null;
    this.state.roundNumber++;

    // Reset players
    for (const p of this.state.players) {
      p.bet = 0;
      p.totalBet = 0;
      p.cards = null;
      p.lastAction = null;
      p.isDealer = false;
      p.isSmallBlind = false;
      p.isBigBlind = false;
      p.status = p.chips > 0 ? 'active' : 'sitting-out';
    }

    // Move dealer button
    const seats = activePlayers.map(p => p.seatIndex);
    const currentDealerIdx = seats.indexOf(this.state.dealerSeatIndex);
    const nextDealerIdx = (currentDealerIdx + 1) % seats.length;
    this.state.dealerSeatIndex = seats[nextDealerIdx];

    // Set dealer, SB, BB
    const orderedActive = this.getOrderedActivePlayers();
    orderedActive[0].isDealer = true;

    const sbPlayer = orderedActive.length === 2 ? orderedActive[0] : orderedActive[1];
    const bbPlayer = orderedActive.length === 2 ? orderedActive[1] : orderedActive[2];

    sbPlayer.isSmallBlind = true;
    bbPlayer.isBigBlind = true;

    // Post blinds
    this.postBlind(sbPlayer, this.state.smallBlindAmount);
    this.postBlind(bbPlayer, this.state.bigBlindAmount);
    this.state.currentBet = this.state.bigBlindAmount;
    this.state.minRaise = this.state.bigBlindAmount * 2;

    // Deal hole cards
    for (const p of orderedActive) {
      p.cards = this.deck.deal(2);
    }

    this.state.phase = 'pre-flop';

    // UTG acts first pre-flop (3rd player, or SB if heads-up)
    const utgIdx = orderedActive.length === 2 ? 0 : 3;
    const firstToAct = orderedActive[utgIdx % orderedActive.length];
    this.state.activePlayerId = firstToAct.id;
    this.updateMaxRaise();
  }

  private postBlind(player: Player, amount: number): void {
    const actual = Math.min(amount, player.chips);
    player.chips -= actual;
    player.bet += actual;
    player.totalBet += actual;
    this.state.pot += actual;
    if (player.chips === 0) player.status = 'all-in';
  }

  processAction(playerId: string, action: PlayerAction, amount?: number): void {
    if (this.state.activePlayerId !== playerId) throw new Error('Not your turn');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    player.lastAction = action;

    switch (action) {
      case 'fold':
        player.status = 'folded';
        break;
      case 'check':
        if (this.state.currentBet > player.bet) throw new Error('Cannot check, must call or raise');
        break;
      case 'call': {
        const toCall = Math.min(this.state.currentBet - player.bet, player.chips);
        player.chips -= toCall;
        player.bet += toCall;
        player.totalBet += toCall;
        this.state.pot += toCall;
        if (player.chips === 0) player.status = 'all-in';
        break;
      }
      case 'raise':
      case 'all-in': {
        const raiseAmount = amount ?? player.chips;
        const totalBet = Math.min(raiseAmount, player.chips + player.bet);
        const added = totalBet - player.bet;
        player.chips -= added;
        this.state.pot += added;
        player.bet = totalBet;
        player.totalBet += added;
        this.state.currentBet = totalBet;
        this.state.minRaise = totalBet + (totalBet - this.state.currentBet);
        if (player.chips === 0) player.status = 'all-in';
        break;
      }
    }

    // Check if hand is over (all but one folded)
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.awardPot(activePlayers);
      return;
    }

    // Check if betting round is over
    if (this.isBettingRoundOver()) {
      this.advancePhase();
    } else {
      this.moveToNextPlayer();
    }
  }

  private isBettingRoundOver(): boolean {
    const playersInHand = this.state.players.filter(
      p => p.status !== 'folded' && p.status !== 'sitting-out'
    );

    for (const p of playersInHand) {
      if (p.status === 'all-in') continue;
      if (p.bet < this.state.currentBet) return false;
      // If player hasn't acted yet (status active and no lastAction in this round)
    }

    // All active (non-all-in) players have bet the same amount
    const activePlayers = playersInHand.filter(p => p.status === 'active');
    if (activePlayers.length === 0) return true;

    const bets = activePlayers.map(p => p.bet);
    const allEqual = bets.every(b => b === bets[0]);
    if (!allEqual) return false;

    // Make sure everyone has had a chance to act
    const notActed = activePlayers.filter(p => p.lastAction === null && !p.isBigBlind);
    if (this.state.phase === 'pre-flop') {
      // BB gets option even if everyone just called
      const bb = activePlayers.find(p => p.isBigBlind);
      if (bb && bb.lastAction === null && this.state.currentBet === this.state.bigBlindAmount) {
        return false;
      }
    }

    return activePlayers.every(p => p.lastAction !== null);
  }

  private advancePhase(): void {
    // Reset bets for new round
    for (const p of this.state.players) {
      p.bet = 0;
      p.lastAction = null;
    }
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlindAmount;

    const transitions: Record<string, GamePhase> = {
      'pre-flop': 'flop',
      'flop': 'turn',
      'turn': 'river',
      'river': 'showdown',
    };

    const next = transitions[this.state.phase];
    if (!next) return;

    if (next === 'showdown') {
      this.state.phase = 'showdown';
      this.computeWinners();
      return;
    }

    this.state.phase = next;

    // Deal community cards
    if (next === 'flop') this.state.communityCards = this.deck.deal(3);
    else this.state.communityCards.push(...this.deck.deal(1));

    // Set first to act (first active player left of dealer)
    const firstToAct = this.getFirstToActPostFlop();
    this.state.activePlayerId = firstToAct?.id ?? null;
    this.updateMaxRaise();

    // If all remaining players are all-in, skip to showdown
    const activePlayers = this.getActivePlayers().filter(p => p.status === 'active');
    if (activePlayers.length <= 1) {
      this.advancePhase();
    }
  }

  private computeWinners(): void {
    this.calculateSidePots();
    const results: HandResult[] = [];

    const eligiblePlayers = this.state.players.filter(
      p => p.status !== 'folded' && p.status !== 'sitting-out'
    );

    if (eligiblePlayers.length === 1) {
      this.awardPot(eligiblePlayers);
      return;
    }

    // Evaluate each player's hand
    const evaluations = eligiblePlayers.map(p => ({
      player: p,
      eval: evaluateBestHand(p.cards!, this.state.communityCards),
    }));

    if (this.state.sidePots.length > 0) {
      for (const sidePot of this.state.sidePots) {
        const eligible = evaluations.filter(e => sidePot.eligiblePlayers.includes(e.player.id));
        const maxRank = Math.max(...eligible.map(e => e.eval.rank));
        const winners = eligible.filter(e => e.eval.rank === maxRank);
        const share = Math.floor(sidePot.amount / winners.length);

        for (const w of winners) {
          w.player.chips += share;
          results.push({
            winnerId: w.player.id,
            winnerIds: winners.map(x => x.player.id),
            handName: w.eval.category,
            handRank: w.eval.rank,
            amount: share,
            sidePot: true,
          });
        }
      }
    } else {
      const maxRank = Math.max(...evaluations.map(e => e.eval.rank));
      const winners = evaluations.filter(e => e.eval.rank === maxRank);
      const share = Math.floor(this.state.pot / winners.length);

      for (const w of winners) {
        w.player.chips += share;
        results.push({
          winnerId: w.player.id,
          winnerIds: winners.map(x => x.player.id),
          handName: w.eval.category,
          handRank: w.eval.rank,
          amount: share,
        });
      }
    }

    this.state.handResults = results;
    this.state.pot = 0;
    this.state.activePlayerId = null;
  }

  private awardPot(winners: Player[]): void {
    this.state.phase = 'showdown';
    const share = Math.floor(this.state.pot / winners.length);
    const results: HandResult[] = [];

    for (const w of winners) {
      w.chips += share;
      results.push({
        winnerId: w.id,
        winnerIds: winners.map(x => x.id),
        handName: 'Winner by default',
        handRank: 0,
        amount: share,
      });
    }

    this.state.handResults = results;
    this.state.pot = 0;
    this.state.activePlayerId = null;
  }

  private calculateSidePots(): void {
    const inHand = this.state.players.filter(
      p => p.status !== 'folded' && p.status !== 'sitting-out' && p.totalBet > 0
    );

    if (!inHand.some(p => p.status === 'all-in')) {
      this.state.sidePots = [];
      return;
    }

    const bets = [...inHand].sort((a, b) => a.totalBet - b.totalBet);
    const sidePots: SidePot[] = [];
    let processed = 0;

    for (let i = 0; i < bets.length; i++) {
      const cap = bets[i].totalBet - processed;
      if (cap <= 0) continue;

      const eligible = bets.slice(i);
      const potAmount = cap * (i + eligible.length);

      sidePots.push({
        amount: potAmount,
        eligiblePlayers: eligible.map(p => p.id),
      });

      processed = bets[i].totalBet;
    }

    this.state.sidePots = sidePots;
  }

  private moveToNextPlayer(): void {
    const ordered = this.getOrderedActivePlayers();
    const currentIdx = ordered.findIndex(p => p.id === this.state.activePlayerId);

    for (let i = 1; i <= ordered.length; i++) {
      const next = ordered[(currentIdx + i) % ordered.length];
      if (next.status === 'active') {
        this.state.activePlayerId = next.id;
        this.updateMaxRaise();
        return;
      }
    }
  }

  private getFirstToActPostFlop(): Player | undefined {
    const orderedActive = this.getOrderedActivePlayers();
    return orderedActive.find(p => p.status === 'active');
  }

  private getOrderedActivePlayers(): Player[] {
    const active = this.state.players.filter(p => p.status !== 'sitting-out');
    const dealerIdx = active.findIndex(p => p.seatIndex === this.state.dealerSeatIndex);
    if (dealerIdx === -1) return active;
    return [...active.slice(dealerIdx), ...active.slice(0, dealerIdx)];
  }

  private getActivePlayers(): Player[] {
    return this.state.players.filter(
      p => p.status !== 'folded' && p.status !== 'sitting-out'
    );
  }

  private getPlayer(id: string): Player | undefined {
    return this.state.players.find(p => p.id === id);
  }

  private updateMaxRaise(): void {
    const active = this.getPlayer(this.state.activePlayerId ?? '');
    if (active) this.state.maxRaise = active.chips + active.bet;
  }

  getPublicState(forPlayerId?: string): GameState {
    return {
      ...this.state,
      players: this.state.players.map(p => {
        const cards = p.id === forPlayerId ? p.cards : (
          this.state.phase === 'showdown' && p.status !== 'folded' ? p.cards : null
        );

        let bestHand: { category: string; cardIds: string[] } | undefined;
        if (
          p.id === forPlayerId &&
          p.cards &&
          p.status !== 'folded' &&
          this.state.communityCards.length >= 3
        ) {
          const evaluation = evaluateBestHand(p.cards, this.state.communityCards);
          bestHand = { category: evaluation.category, cardIds: evaluation.cards.map(c => c.id) };
        }

        return { ...p, cards, bestHand };
      }),
    };
  }
}
