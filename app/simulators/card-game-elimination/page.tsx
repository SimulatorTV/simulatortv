// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

const INITIAL_CAST = [];

const DEFAULT_CHALLENGES = ["Poker", "Flop", "Flop 7", "War", "Blackjack", "Baccarat", "Bingo", "Liar's Dice", "Flush Out", "Pick A Card"];
const DEFAULT_ELIMINATIONS = ["Poker", "Flop", "War", "Blackjack", "Baccarat", "Horse Race", "31", "Flush Out"];
const SUITS = ["♠", "♥", "♦", "♣"];
const FLUSH_OUT_SUITS = ["♠", "♥", "♦", "♣", "🗡", "☘", "🟠", "☀️", "✿"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const VALUES = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 2]));
const SUIT_COLOR_CLASSES = {
  "♥": "text-red-600",
  "♦": "text-red-600",
  "♠": "text-slate-950",
  "♣": "text-slate-950",
  "🗡": "text-blue-500",
  "☘": "text-green-500",
  "🟠": "text-orange-500",
  "☀️": "text-yellow-400",
  "✿": "text-purple-500",
};

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function makeChallengeSettings() {
  return DEFAULT_CHALLENGES.map((name) => ({ name, enabled: true, maxPlayers: "" }));
}

function makeEliminationSettings() {
  return DEFAULT_ELIMINATIONS.map((name) => ({ name, enabled: true }));
}

function makeDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: VALUES[rank], id: `${rank}${suit}-${deck.length}-${Math.random()}` });
    }
  }
  return shuffleArray(deck);
}

function makeShoe(minCards = 52) {
  let cards = [];
  const decks = Math.max(1, Math.ceil(minCards / 52));
  for (let i = 0; i < decks; i++) cards = cards.concat(makeDeck());
  return shuffleArray(cards);
}

function cardLabel(card) {
  return card ? `${card.rank}${card.suit || ""}` : "";
}

function Button({ children, variant = "default", size = "default", className = "", ...props }) {
  const variants = {
    default: "bg-emerald-500 hover:bg-emerald-400 text-white",
    gold: "bg-yellow-300 hover:bg-yellow-200 text-slate-950",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    outline: "bg-transparent border border-white/20 hover:bg-white/10 text-white",
  };
  const sizes = { default: "px-4 py-2 text-sm", lg: "px-5 py-3 text-lg" };
  return <button className={`rounded-xl font-black transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
}

function CardBox({ children, className = "" }) {
  return <div className={`rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur ${className}`}>{children}</div>;
}

function Avatar({ player, size = "md", disabled = false }) {
  const sizes = { sm: "h-10 w-10", md: "h-16 w-16", lg: "h-24 w-24" };
  return (
    <img
      src={player.img}
      alt={player.name}
      className={`${sizes[size]} rounded-2xl object-cover ring-2 ring-white/60 ${disabled ? "grayscale opacity-40" : ""}`}
      onError={(e) => { e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent(player.name)}`; }}
    />
  );
}

function PlayingCard({ card, small = false, back = false }) {
  const size = small ? "h-12 w-9 rounded-lg" : "h-24 w-16 rounded-2xl";
  if (back) return <div className={`${size} flex items-center justify-center border border-white/20 bg-gradient-to-br from-blue-800 to-blue-950 text-xl font-black text-blue-100`}>★</div>;
  if (!card) return <div className={`${size} flex items-center justify-center border border-white/15 bg-slate-800 text-xl font-black text-slate-500`}>?</div>;
  if (card.rank === "22") return <div className={`${size} flex items-center justify-center border border-white/20 bg-slate-700 text-sm font-black text-white`}>22</div>;

  const colorClass = SUIT_COLOR_CLASSES[card.suit] || "text-slate-950";

  return (
    <div className={`${size} flex flex-col items-center justify-center border bg-white font-black leading-none shadow ${colorClass}`}>
      <div className={small ? "text-lg" : "text-3xl"}>{card.rank}</div>
      <div className={`${small ? "text-xl" : (card.suit === "☀️" || card.suit === "🟠" ? "text-4xl" : "text-5xl")} ${(card.suit === "🗡" || card.suit === "☀️" || card.suit === "🟠") ? "-translate-y-1" : ""}`}>{card.suit}</div>
    </div>
  );
}

function scoreFive(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);
  const counts = {};
  values.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const groups = Object.entries(counts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.count - a.count || b.value - a.value);
  const unique = [...new Set(values)].sort((a, b) => b - a);
  let straightHigh = null;
  if (unique.length >= 5) {
    for (let i = 0; i <= unique.length - 5; i++) {
      const run = unique.slice(i, i + 5);
      if (run[0] - run[4] === 4) { straightHigh = run[0]; break; }
    }
    if (!straightHigh && [14, 5, 4, 3, 2].every((v) => unique.includes(v))) straightHigh = 5;
  }
  const flush = suits.every((s) => s === suits[0]);
  if (flush && straightHigh === 14) return { name: "Royal Flush", score: [9, 14] };
  if (flush && straightHigh) return { name: "Straight Flush", score: [8, straightHigh] };
  if (groups[0].count === 4) return { name: "Four of a Kind", score: [7, groups[0].value, groups[1]?.value || 0] };
  if (groups[0].count === 3 && groups[1]?.count >= 2) return { name: "Full House", score: [6, groups[0].value, groups[1].value] };
  if (flush) return { name: "Flush", score: [5, ...values] };
  if (straightHigh) return { name: "Straight", score: [4, straightHigh] };
  if (groups[0].count === 3) return { name: "Three of a Kind", score: [3, groups[0].value, ...groups.filter((g) => g.count === 1).map((g) => g.value).sort((a, b) => b - a)] };
  if (groups[0].count === 2 && groups[1]?.count === 2) return { name: "Two Pair", score: [2, groups[0].value, groups[1].value, groups.find((g) => g.count === 1)?.value || 0] };
  if (groups[0].count === 2) return { name: "One Pair", score: [1, groups[0].value, ...groups.filter((g) => g.count === 1).map((g) => g.value).sort((a, b) => b - a)] };
  return { name: "High Card", score: [0, ...values] };
}

function combinations(items, k) {
  const out = [];
  const walk = (start, picked) => {
    if (picked.length === k) { out.push(picked); return; }
    for (let i = start; i <= items.length - (k - picked.length); i++) walk(i + 1, [...picked, items[i]]);
  };
  walk(0, []);
  return out;
}

function compareScore(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
  }
  return 0;
}

function partialPokerScore(cards) {
  if (!cards.length) return { name: "No Cards", score: [-1] };

  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const counts = {};
  values.forEach((value) => { counts[value] = (counts[value] || 0) + 1; });
  const groups = Object.entries(counts)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (groups[0].count === 4) return { name: "Four of a Kind", score: [7, groups[0].value, ...(groups.filter((g) => g.count === 1).map((g) => g.value).sort((a, b) => b - a))] };
  if (groups[0].count === 3) return { name: "Three of a Kind", score: [3, groups[0].value, ...(groups.filter((g) => g.count === 1).map((g) => g.value).sort((a, b) => b - a))] };
  if (groups[0].count === 2 && groups[1]?.count === 2) return { name: "Two Pair", score: [2, groups[0].value, groups[1].value, groups.find((g) => g.count === 1)?.value || 0] };
  if (groups[0].count === 2) return { name: "One Pair", score: [1, groups[0].value, ...(groups.filter((g) => g.count === 1).map((g) => g.value).sort((a, b) => b - a))] };

  const highCard = values[0];
  const rankName = RANKS.find((rank) => VALUES[rank] === highCard) || "High";
  return { name: `${rankName} High`, score: [0, ...values] };
}

function bestPokerScore(cards) {
  if (cards.length < 5) return partialPokerScore(cards);
  let best = null;
  for (const combo of combinations(cards, 5)) {
    const result = scoreFive(combo);
    if (!best || compareScore(result.score, best.score) > 0) best = result;
  }
  return best;
}

const POKER_STEPS = ["intro", "deal", "flop", "rank3", "turn", "rank4", "river", "finalRank", "complete"];
const FLOP7_STEPS = ["intro", "show2", "rank2", "show5", "rank5", "show6", "rank6", "show7", "rank7", "complete"];

function visibleCountFor(mode, step) {
  if (mode === "flop7") return step === "show2" || step === "rank2" ? 2 : step === "show5" || step === "rank5" ? 5 : step === "show6" || step === "rank6" ? 6 : step === "show7" || step === "rank7" || step === "complete" ? 7 : 0;
  if (mode === "flop") return step === "intro" ? 0 : step === "deal" || step === "flop" || step === "rank3" ? 3 : step === "turn" || step === "rank4" ? 4 : 5;
  return step === "deal" ? 0 : step === "flop" || step === "rank3" ? 3 : step === "turn" || step === "rank4" ? 4 : step === "river" || step === "finalRank" || step === "complete" ? 5 : 0;
}

function buttonTextFor(mode, step) {
  if (mode === "flop7") return step === "intro" ? "Reveal First 2" : step === "show2" ? "Rank First 2" : step === "rank2" ? "Reveal Next 3" : step === "show5" ? "Rank 5" : step === "rank5" ? "Reveal 6th" : step === "show6" ? "Rank 6" : step === "rank6" ? "Reveal 7th" : step === "show7" ? "Final Ranking" : "Lock Results";
  if (mode === "flop") return step === "intro" ? "Reveal First 3" : step === "deal" || step === "flop" ? "Rank First 3" : step === "rank3" ? "Reveal 4th" : step === "turn" ? "Rank 4" : step === "rank4" ? "Reveal 5th" : step === "river" ? "Final Ranking" : "Lock Results";
  return step === "intro" ? "Deal Hole Cards" : step === "deal" ? "Reveal Flop" : step === "flop" ? "Rank Flop" : step === "rank3" ? "Reveal Turn" : step === "turn" ? "Rank Turn" : step === "rank4" ? "Reveal River" : step === "river" ? "Final Ranking" : "Lock Results";
}

function createPokerGame(players, title, mode = "holdem") {
  const deck = makeShoe(players.length * 8 + 10);
  const hole = {};
  const handSize = mode === "holdem" ? 2 : mode === "flop7" ? 7 : 5;

  players.forEach((p) => {
    if (mode === "holdem") {
      hole[p.name] = Array.from({ length: handSize }, () => deck.pop());
    } else {
      const personalDeck = makeDeck();
      hole[p.name] = Array.from({ length: handSize }, () => personalDeck.pop());
    }
  });

  return {
    type: "poker",
    title,
    mode,
    players,
    hole,
    community: mode === "holdem" ? Array.from({ length: 5 }, () => deck.pop()) : [],
    stepIndex: 0,
    rankings: [],
    logs: []
  };
}

function evaluatePoker(players, hole, community, mode, visibleCount, winInfo = null) {
  return players.map((player) => {
    const cards = mode === "holdem"
      ? [...(hole[player.name] || []), ...community]
      : (hole[player.name] || []).slice(0, visibleCount);

    return {
      player,
      cards,
      ...bestPokerScore(cards),
      winPct: winInfo?.[player.name]?.pct ?? null
    };
  }).sort((a, b) => {
    const scoreCompare = compareScore(b.score, a.score);

    // For eliminations/final rankings, always keep true hand strength ordering.
    // Only use 0% sorting during live challenge previews before the final board.
    const livePreview = mode === "holdem" && visibleCount < 5;

    if (livePreview && a.winPct !== null && b.winPct !== null) {
      const aDead = a.winPct === 0;
      const bDead = b.winPct === 0;
      if (aDead !== bDead) return aDead ? 1 : -1;
    }

    return scoreCompare;
  });
}

function plainCardKey(card) {
  return `${card.rank}${card.suit}`;
}

function remainingHoldemDeck(state, visibleCommunity) {
  const used = new Set();
  state.players.forEach((player) => (state.hole[player.name] || []).forEach((card) => used.add(plainCardKey(card))));
  visibleCommunity.forEach((card) => used.add(plainCardKey(card)));
  return makeDeck().filter((card) => !used.has(plainCardKey(card)));
}

function holdemWinnerNames(players, hole, community) {
  const scored = players.map((player) => ({ player, ...bestPokerScore([...(hole[player.name] || []), ...community]) }));
  scored.sort((a, b) => compareScore(b.score, a.score));
  const best = scored[0];
  return scored.filter((entry) => compareScore(entry.score, best.score) === 0).map((entry) => entry.player.name);
}

function calculateHoldemWinInfo(state, visibleCommunity) {
  if (!state || state.mode !== "holdem") return {};

  const missing = Math.max(0, 5 - visibleCommunity.length);
  const remaining = remainingHoldemDeck(state, visibleCommunity);
  const wins = Object.fromEntries(state.players.map((player) => [player.name, 0]));
  const needed = Object.fromEntries(state.players.map((player) => [player.name, []]));
  let total = 0;

  const recordResult = (futureCards) => {
    total += 1;
    const community = [...visibleCommunity, ...futureCards];
    const winners = holdemWinnerNames(state.players, state.hole, community);
    winners.forEach((name) => { wins[name] += 1 / winners.length; });
    if (missing === 1) {
      winners.forEach((name) => needed[name].push(futureCards[0]));
    }
  };

  if (missing === 0) {
    recordResult([]);
  } else if (missing === 1) {
    remaining.forEach((card) => recordResult([card]));
  } else if (missing === 2) {
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) recordResult([remaining[i], remaining[j]]);
    }
  } else {
    const samples = Math.min(500, remaining.length * 12);
    for (let i = 0; i < samples; i++) recordResult(shuffleArray(remaining).slice(0, missing));
  }

  return Object.fromEntries(state.players.map((player) => {
    const pct = total ? Math.round((wins[player.name] / total) * 100) : 0;
    return [player.name, { pct, needed: needed[player.name] || [] }];
  }));
}

function neededCardsLabel(cards, pct) {
  if (!cards || cards.length === 0) return null;
  if (pct > 51) return "All other cards";
  const unique = [];
  const seen = new Set();
  cards.forEach((card) => {
    const key = `${card.rank}${card.suit}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(card);
    }
  });
  return unique;
}

function scoreEqual(a, b) {
  return a && b && a.score.length === b.score.length && a.score.every((value, index) => value === b.score[index]);
}

function advancePokerState(state, finish) {
  const steps = state.mode === "flop7" ? FLOP7_STEPS : POKER_STEPS;
  const nextIndex = Math.min(state.stepIndex + 1, steps.length - 1);
  const step = steps[nextIndex];
  const visible = visibleCountFor(state.mode, step);
  const shouldRank = ["rank2", "rank3", "rank4", "rank5", "rank6", "rank7", "finalRank", "complete"].includes(step);
  const community = state.mode === "holdem" ? state.community.slice(0, visible) : [];
  const winInfo = state.mode === "holdem" ? calculateHoldemWinInfo(state, community) : null;
  const rankings = shouldRank ? evaluatePoker(state.players, state.hole, community, state.mode, visible, winInfo) : state.rankings;

  if (step === "complete") {
    const finalVisible = state.mode === "holdem" ? 5 : state.mode === "flop7" ? 7 : 5;
    const finalCommunity = state.mode === "holdem" ? state.community.slice(0, 5) : [];
    const finalRankings = evaluatePoker(state.players, state.hole, finalCommunity, state.mode, finalVisible, null);
    const top = finalRankings[0];
    const bottom = finalRankings[finalRankings.length - 1];
    const topTied = finalRankings.filter((entry) => scoreEqual(entry, top));
    const bottomTied = finalRankings.filter((entry) => scoreEqual(entry, bottom));

    if (topTied.length > 1 || bottomTied.length > 1) {
      const tiedPlayersMap = new Map();
      if (topTied.length > 1) topTied.forEach((entry) => tiedPlayersMap.set(entry.player.name, entry.player));
      if (bottomTied.length > 1) bottomTied.forEach((entry) => tiedPlayersMap.set(entry.player.name, entry.player));
      const tiedPlayers = [...tiedPlayersMap.values()];
      const tieGame = createPokerGame(tiedPlayers, `${state.title} Tiebreaker`, state.mode);
      return {
        ...tieGame,
        lockedWinner: topTied.length === 1 ? top.player : state.lockedWinner || null,
        lockedLoser: bottomTied.length === 1 ? bottom.player : state.lockedLoser || null,
        logs: [`Tiebreaker: ${tiedPlayers.map((p) => p.name).join(", ")}`],
      };
    }

    const winner = state.lockedWinner || top.player;
    const lastPlace = state.lockedLoser || bottom.player;
    finish({ name: state.title.replace(" Tiebreaker", ""), winner, lastPlace, placements: finalRankings.map((r) => r.player) });
    return { ...state, stepIndex: nextIndex, rankings: finalRankings };
  }

  return { ...state, stepIndex: nextIndex, rankings };
}

function blackjackValue(card) { if (["J", "Q", "K"].includes(card.rank)) return 10; if (card.rank === "A") return 11; return Number(card.rank); }
function blackjackTotal(cards) { let total = cards.reduce((sum, card) => sum + blackjackValue(card), 0); let aces = cards.filter((card) => card.rank === "A").length; while (total > 21 && aces > 0) { total -= 10; aces--; } return total; }
function bjDecision(cards) { const total = blackjackTotal(cards); if (total <= 11) return "Hit"; if (total >= 17) return "Stand"; return Math.random() < 0.5 ? "Hit" : "Stand"; }

function makeBjRound(players) {
  const deck = makeShoe(players.length * 10 + 20);
  const dealer = [deck.pop(), deck.pop()];
  return { deck, dealer, dealerVisible: 1, dealerTotal: blackjackTotal(dealer), dealerBust: false, hands: players.map((player) => { const cards = [deck.pop(), deck.pop()]; return { player, cards, action: "Waiting", pending: null, done: false, bust: false, beatsDealer: false }; }) };
}

function allBjDone(round) { return !round || round.hands.every((h) => h.done || h.bust || h.action === "Stand" || h.action === "Bust"); }
function selectBj(round) {
  if (!round) return round;
  return {
    ...round,
    hands: round.hands.map((h) => {
      if (h.done || h.bust || h.action === "Stand") return h;
      const decision = bjDecision(h.cards);
      return { ...h, pending: decision, action: decision };
    })
  };
}
function applyBj(round) { if (!round) return round; const deck = [...round.deck]; return { ...round, deck, hands: round.hands.map((h) => { if (h.done || h.bust || h.action === "Stand") return h; if (h.pending === "Stand") return { ...h, done: true, action: "Stand", pending: null }; const cards = [...h.cards, deck.pop()]; const bust = blackjackTotal(cards) > 21; return { ...h, cards, bust, done: bust, action: bust ? "Bust" : "Waiting", pending: null }; }) }; }
function dealerStep(round) { if (!round) return round; const deck = [...round.deck]; const dealer = [...round.dealer]; let dealerVisible = round.dealerVisible || 1; if (dealerVisible < 2) dealerVisible = 2; else if (blackjackTotal(dealer) < 17) { dealer.push(deck.pop()); dealerVisible = dealer.length; } return { ...round, deck, dealer, dealerVisible, dealerTotal: blackjackTotal(dealer), dealerBust: blackjackTotal(dealer) > 21 }; }
function dealerDone(round) { return !round || ((round.dealerVisible || 1) >= 2 && blackjackTotal(round.dealer) >= 17); }
function finalizeBj(round) { if (!round) return round; const dealerTotal = blackjackTotal(round.dealer); const dealerBust = dealerTotal > 21; return { ...round, dealerTotal, dealerBust, hands: round.hands.map((h) => { const total = blackjackTotal(h.cards); const bust = total > 21; return { ...h, bust, done: true, beatsDealer: !bust && (dealerBust || total >= dealerTotal), action: bust ? "Bust" : h.action === "Waiting" ? "Stand" : h.action }; }) }; }

function createBlackjackChallenge(players) { return { type: "blackjack", title: "Blackjack", display: "matchups", round: 1, firstSplit: false, winnerPool: players, loserPool: [], winnerRound: null, loserRound: null, champion: null, lastPlace: null, message: "Everyone plays the dealer. Tie goes to player." }; }
function advanceBlackjack(state, finish) {
  if (state.display === "matchups") return { ...state, display: "actionSelect", winnerRound: state.champion ? null : makeBjRound(state.winnerPool), loserRound: state.firstSplit && !state.lastPlace ? makeBjRound(state.loserPool) : null, message: "Initial cards dealt." };
  if (state.display === "actionSelect") return { ...state, display: "actionResult", winnerRound: selectBj(state.winnerRound), loserRound: selectBj(state.loserRound), message: "Actions chosen." };
  if (state.display === "actionResult") { const wr = applyBj(state.winnerRound); const lr = applyBj(state.loserRound); return { ...state, winnerRound: wr, loserRound: lr, display: allBjDone(wr) && allBjDone(lr) ? "dealerTurn" : "actionSelect", message: allBjDone(wr) && allBjDone(lr) ? "Dealer turn." : "Hits resolved." }; }
  if (state.display === "dealerTurn") { const wr = dealerStep(state.winnerRound); const lr = dealerStep(state.loserRound); return { ...state, winnerRound: wr, loserRound: lr, display: dealerDone(wr) && dealerDone(lr) ? "dealerCompare" : "dealerTurn", message: dealerDone(wr) && dealerDone(lr) ? "Dealer done. Compare results." : "Dealer draws/reveals one card." }; }
  if (state.display === "dealerCompare") return { ...state, winnerRound: finalizeBj(state.winnerRound), loserRound: finalizeBj(state.loserRound), display: "results", message: "Results compared." };

  let champion = state.champion;
  let lastPlace = state.lastPlace;
  let winnerPool = state.winnerPool;
  let loserPool = state.loserPool;
  let firstSplit = state.firstSplit;
  if (state.winnerRound && !champion) {
    const beaters = state.winnerRound.hands.filter((h) => h.beatsDealer).map((h) => h.player);
    const nonBeaters = state.winnerRound.hands.filter((h) => !h.beatsDealer).map((h) => h.player);
    if (!firstSplit) { firstSplit = true; loserPool = nonBeaters; winnerPool = beaters.length === 0 || beaters.length === state.winnerPool.length ? state.winnerPool : beaters; }
    else winnerPool = beaters.length === 0 || beaters.length === state.winnerPool.length ? state.winnerPool : beaters;
    if (winnerPool.length === 1) champion = winnerPool[0];
  }
  if (firstSplit && state.loserRound && !lastPlace) {
    const danger = state.loserRound.hands.filter((h) => !h.beatsDealer).map((h) => h.player);
    loserPool = danger.length === 0 || danger.length === state.loserPool.length ? state.loserPool : danger;
    if (loserPool.length === 1) lastPlace = loserPool[0];
  }
  if (champion && lastPlace) finish({ name: "Blackjack", winner: champion, lastPlace, placements: [champion, ...winnerPool, ...loserPool, lastPlace] });
  return { ...state, display: "matchups", round: state.round + 1, firstSplit, winnerPool, loserPool, champion, lastPlace, winnerRound: null, loserRound: null, message: "Next Blackjack round." };
}

function rollDice(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function nextLiarDiceIndex(entries, startIndex) {
  if (!entries.some((entry) => entry.diceCount > 0)) return -1;
  let index = startIndex;
  for (let i = 0; i < entries.length; i++) {
    index = (index + 1) % entries.length;
    if (entries[index].diceCount > 0) return index;
  }
  return -1;
}

function isHigherBid(next, current) {
  if (!current) return true;
  if (next.count > current.count) return true;
  if (next.count === current.count && next.face > current.face) return true;
  return false;
}

function chooseLiarDiceBid(state, bidder) {
  const totalDice = state.entries.reduce((sum, entry) => sum + entry.diceCount, 0);
  const current = state.currentBid;

  const faceCounts = [1, 2, 3, 4, 5, 6].map((face) => {
    const own = bidder.dice.filter((die) => die === face).length;
    const unknownDice = Math.max(0, totalDice - bidder.dice.length);
    const expectedUnknown = unknownDice / 6;
    const estimatedTotal = own + expectedUnknown;
    return { face, own, estimatedTotal };
  });

  if (current) {
    const ownCurrent = bidder.dice.filter((die) => die === current.face).length;
    const unknownDice = Math.max(0, totalDice - bidder.dice.length);
    const expectedCurrent = ownCurrent + unknownDice / 6;
    const pressure = current.count - expectedCurrent;
    const callChance = pressure >= 3 ? 0.82 : pressure >= 2 ? 0.55 : pressure >= 1 ? 0.28 : 0.08;
    if (Math.random() < callChance) return { action: "call" };
  }

  const candidates = [];
  for (let count = 1; count <= Math.max(totalDice + 3, (current?.count || 0) + 5); count++) {
    for (let face = 1; face <= 6; face++) {
      const bid = { count, face };
      if (!isHigherBid(bid, current)) continue;
      const faceInfo = faceCounts.find((item) => item.face === face);
      const confidence = faceInfo.estimatedTotal - count;
      candidates.push({ bid, confidence, own: faceInfo.own });
    }
  }

  candidates.sort((a, b) => {
    const aScore = a.confidence + a.own * 0.35 - Math.random() * 0.6;
    const bScore = b.confidence + b.own * 0.35 - Math.random() * 0.6;
    return bScore - aScore;
  });

  const strong = candidates.filter((item) => item.confidence >= -0.75);
  const risky = candidates.filter((item) => item.confidence >= -1.8);
  const pool = strong.length ? strong : risky.length ? risky : candidates;
  const pickIndex = Math.min(pool.length - 1, Math.floor(Math.random() * Math.min(5, pool.length)));
  const chosen = pool[pickIndex]?.bid || { count: (current?.count || 0) + 1, face: 1 };

  return { action: "bid", bid: chosen };
}

function createLiarsDiceChallenge(players, entries = null, starterIndex = 0, firstOut = null) {
  const baseEntries = entries || players.map((player) => ({ player, diceCount: 3, dice: [], eliminated: false }));
  const liveEntries = baseEntries.map((entry) => ({ ...entry, dice: entry.diceCount > 0 ? rollDice(entry.diceCount) : [], eliminated: entry.diceCount <= 0 }));
  let start = starterIndex;
  if (!liveEntries[start] || liveEntries[start].diceCount <= 0) start = nextLiarDiceIndex(liveEntries, start - 1);

  return {
    type: "liarsDice",
    stage: "rolled",
    round: 1,
    entries: liveEntries,
    turnIndex: start,
    starterIndex: start,
    currentBid: null,
    bidHistory: [],
    caller: null,
    previousBidder: null,
    revealFaceCount: null,
    roundLoser: null,
    firstOut,
    winner: null,
    lastPlace: null,
    complete: false,
    message: `${liveEntries[start]?.player.name || "Someone"} starts the bidding.`,
  };
}

function advanceLiarsDice(state, finishChallenge) {
  if (!state) return state;
  if (state.complete) {
    finishChallenge({ name: "Liar's Dice", winner: state.winner, lastPlace: state.lastPlace, placements: [state.winner, ...state.entries.map((e) => e.player), state.lastPlace].filter(Boolean) });
    return state;
  }

  if (state.stage === "rolled" || state.stage === "bidding") {
    const bidder = state.entries[state.turnIndex];
    if (!bidder || bidder.diceCount <= 0) return { ...state, turnIndex: nextLiarDiceIndex(state.entries, state.turnIndex), stage: "bidding" };
    const choice = chooseLiarDiceBid(state, bidder);

    if (choice.action === "call" && state.currentBid) {
      const total = state.entries.reduce((sum, entry) => sum + entry.dice.filter((die) => die === state.currentBid.face).length, 0);
      // A bid is true if the actual count is at least the bid count.
      // Example: bid is four 1s and exactly four 1s exist, so the caller is wrong.
      const bidTrue = total >= state.currentBid.count;
      const loser = bidTrue ? bidder : state.previousBidder;
      return {
        ...state,
        stage: "reveal",
        caller: bidder.player,
        revealFaceCount: total,
        roundLoser: loser.player,
        message: bidTrue
          ? `${bidder.player.name} calls liar on ${state.currentBid.count} ${state.currentBid.face}s, but there are ${total}. The bid was true.`
          : `${bidder.player.name} calls liar on ${state.currentBid.count} ${state.currentBid.face}s, and there are only ${total}. The bid was false.`,
      };
    }

    const nextBid = choice.bid;
    const nextIndex = nextLiarDiceIndex(state.entries, state.turnIndex);
    return {
      ...state,
      stage: "bidding",
      currentBid: nextBid,
      previousBidder: bidder,
      turnIndex: nextIndex,
      bidHistory: [...state.bidHistory, { player: bidder.player, bid: nextBid }],
      message: `${bidder.player.name} bids at least ${nextBid.count} dice showing ${nextBid.face}.`,
    };
  }

  if (state.stage === "reveal") {
    const entries = state.entries.map((entry) => entry.player.name === state.roundLoser.name ? { ...entry, diceCount: Math.max(0, entry.diceCount - 1) } : entry);
    const lostEntry = entries.find((entry) => entry.player.name === state.roundLoser.name);
    const firstOut = state.firstOut || (lostEntry?.diceCount === 0 ? lostEntry.player : null);
    const active = entries.filter((entry) => entry.diceCount > 0);

    if (active.length === 1 && firstOut) {
      return {
        ...state,
        entries,
        firstOut,
        winner: active[0].player,
        lastPlace: firstOut,
        complete: true,
        message: `${active[0].player.name} is the last player with dice. ${firstOut.name} was first out.`,
      };
    }

    const loserIndex = entries.findIndex((entry) => entry.player.name === state.roundLoser.name);
    const nextStarter = lostEntry?.diceCount > 0 ? loserIndex : nextLiarDiceIndex(entries, loserIndex);
    const rerolled = entries.map((entry) => ({ ...entry, dice: entry.diceCount > 0 ? rollDice(entry.diceCount) : [], eliminated: entry.diceCount <= 0 }));

    return {
      ...state,
      entries: rerolled,
      firstOut,
      stage: "rolled",
      round: state.round + 1,
      turnIndex: nextStarter,
      starterIndex: nextStarter,
      currentBid: null,
      bidHistory: [],
      caller: null,
      previousBidder: null,
      revealFaceCount: null,
      roundLoser: null,
      message: `${state.roundLoser.name} loses one die. ${rerolled[nextStarter]?.player.name || "Next player"} starts the next round.`,
    };
  }

  return state;
}

function makePairs(players) { const s = shuffleArray(players); const safe = s.length % 2 ? s[s.length - 1] : null; const active = safe ? s.slice(0, -1) : s; const pairs = []; for (let i = 0; i < active.length; i += 2) pairs.push([active[i], active[i + 1]]); return { pairs, safe }; }
function warCard() { const rank = pickRandom(RANKS); const suit = pickRandom(SUITS); return { rank, suit, value: VALUES[rank], id: `${rank}${suit}-${Math.random()}` }; }
function warMatch(a, b) { let ca = warCard(), cb = warCard(); while (ca.value === cb.value) { ca = warCard(); cb = warCard(); } return { winner: ca.value > cb.value ? a : b, loser: ca.value > cb.value ? b : a, cards: { [a.name]: ca, [b.name]: cb } }; }
function createWarChallenge(players) { const p = makePairs(players); return { type: "war", display: "matchups", winnerPairs: p.pairs, winnerSafe: p.safe, loserPairs: [], loserSafe: null, winnerResults: [], loserResults: [], champion: null, lastPlace: null, winnerPool: [], loserPool: [] }; }
function advanceWar(state, finish) {
  if (state.display === "matchups") return { ...state, display: "results", winnerResults: state.winnerPairs.map(([a, b]) => ({ players: [a, b], ...warMatch(a, b) })), loserResults: state.loserPairs.map(([a, b]) => ({ players: [a, b], ...warMatch(a, b) })) };
  const winAdv = [...state.winnerResults.map((r) => r.winner), ...(state.winnerSafe ? [state.winnerSafe] : [])];
  const firstLosers = state.loserPool.length === 0 && state.loserPairs.length === 0 ? state.winnerResults.map((r) => r.loser) : [];
  const loserSurv = [...state.loserResults.map((r) => r.loser), ...(state.loserSafe ? [state.loserSafe] : [])];
  const champion = state.champion || (winAdv.length === 1 ? winAdv[0] : null);
  const loserPool = state.loserPool.length || state.loserPairs.length ? loserSurv : firstLosers;
  const lastPlace = state.lastPlace || (loserPool.length === 1 ? loserPool[0] : null);
  if (champion && lastPlace) finish({ name: "War", winner: champion, lastPlace, placements: [champion, ...winAdv, ...loserPool, lastPlace] });
  const wp = champion ? { pairs: [], safe: null } : makePairs(winAdv);
  const lp = lastPlace ? { pairs: [], safe: null } : makePairs(loserPool);
  return { ...state, display: "matchups", winnerPairs: wp.pairs, winnerSafe: wp.safe, loserPairs: lp.pairs, loserSafe: lp.safe, winnerResults: [], loserResults: [], winnerPool: winAdv, loserPool, champion, lastPlace };
}

function cardKey(card) {
  return `${card.rank}${card.suit}`;
}

const BINGO_COLUMNS = [
  { letter: "B", min: 1, max: 15 },
  { letter: "I", min: 16, max: 30 },
  { letter: "N", min: 31, max: 45 },
  { letter: "G", min: 46, max: 60 },
  { letter: "O", min: 61, max: 75 },
];

function makeBingoCalls() {
  const calls = [];
  BINGO_COLUMNS.forEach((col) => {
    for (let n = col.min; n <= col.max; n++) calls.push({ letter: col.letter, number: n, id: `${col.letter}${n}` });
  });
  return shuffleArray(calls);
}

function makeBingoBoard() {
  return BINGO_COLUMNS.map((col, colIndex) => {
    const nums = shuffleArray(Array.from({ length: col.max - col.min + 1 }, (_, i) => col.min + i)).slice(0, 5);
    return nums.map((num, rowIndex) => ({
      letter: col.letter,
      number: num,
      id: `${col.letter}${num}`,
      free: colIndex === 2 && rowIndex === 2,
    }));
  });
}

function bingoHasBingo(board, calledSet) {
  const marked = (c, r) => board[c][r].free || calledSet.has(board[c][r].id);
  for (let r = 0; r < 5; r++) if ([0,1,2,3,4].every((c) => marked(c, r))) return true;
  for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every((r) => marked(c, r))) return true;
  if ([0,1,2,3,4].every((i) => marked(i, i))) return true;
  if ([0,1,2,3,4].every((i) => marked(i, 4 - i))) return true;
  return false;
}

function createBingoChallenge(players, title = "Bingo", lockedWinner = null, lockedLoser = null, tiebreakerMode = null) {
  return {
    type: "bingo",
    title,
    calls: makeBingoCalls(),
    called: [],
    currentCall: null,
    players: players.map((player) => ({
      player,
      board: makeBingoBoard(),
      hasBingo: false,
      lockedRound: null,
    })),
    round: 0,
    lockedWinner,
    lockedLoser,
    tiebreakerMode,
    pendingWinnerTie: null,
    message: tiebreakerMode === "last"
      ? "Last-place Bingo tiebreaker. First players to hit Bingo escape until one person is left."
      : tiebreakerMode === "winner"
        ? "Winner Bingo tiebreaker. First player to hit Bingo wins."
        : "Every player has a unique Bingo board. Draw calls until someone hits Bingo.",
  };
}

function advanceBingo(state, finishChallenge) {
  if (!state) return state;
  const calls = [...state.calls];
  const currentCall = calls.pop();
  if (!currentCall) return state;

  const called = [...state.called, currentCall];
  const calledSet = new Set(called.map((call) => call.id));
  const round = state.round + 1;

  const players = state.players.map((entry) => {
    if (entry.hasBingo) return entry;
    const hasBingo = bingoHasBingo(entry.board, calledSet);
    return { ...entry, hasBingo, lockedRound: hasBingo ? round : null };
  });

  const justBingo = players.filter((entry) => entry.hasBingo && entry.lockedRound === round);
  const stillPlaying = players.filter((entry) => !entry.hasBingo);

  // Winner tiebreaker: this fresh board only exists when multiple players hit first Bingo at the same time.
  if (state.tiebreakerMode === "winner") {
    if (justBingo.length === 1) {
      const winner = justBingo[0].player;
      if (state.lockedLoser) {
        finishChallenge({ name: "Bingo", winner, lastPlace: state.lockedLoser, placements: [winner, state.lockedLoser] });
      }
      return { ...state, calls, called, currentCall, players, round, lockedWinner: winner, message: `${winner.name} wins the Bingo tiebreaker.` };
    }
    if (justBingo.length > 1) return createBingoChallenge(justBingo.map((entry) => entry.player), "Bingo Winner Tiebreaker", null, state.lockedLoser, "winner");
    return { ...state, calls, called, currentCall, players, round, message: `${currentCall.id} called.` };
  }

  // Last-place tiebreaker: first players to hit Bingo escape; only reset if the final danger group all hits Bingo together.
  if (state.tiebreakerMode === "last") {
    if (stillPlaying.length === 1 && state.lockedWinner) {
      const lastPlace = stillPlaying[0].player;
      finishChallenge({ name: "Bingo", winner: state.lockedWinner, lastPlace, placements: [state.lockedWinner, ...players.filter((entry) => entry.hasBingo).map((entry) => entry.player), lastPlace] });
      return { ...state, calls, called, currentCall, players, round, lockedLoser: lastPlace, message: `${lastPlace.name} loses the Bingo tiebreaker.` };
    }
    if (stillPlaying.length === 0) {
      const lastRoundBingos = players.filter((entry) => entry.lockedRound === round);
      return createBingoChallenge(lastRoundBingos.map((entry) => entry.player), "Bingo Last Place Tiebreaker", state.lockedWinner, null, "last");
    }
    return {
      ...state,
      calls,
      called,
      currentCall,
      players: [...players].sort((a, b) => Number(a.hasBingo) - Number(b.hasBingo) || a.player.name.localeCompare(b.player.name)),
      round,
      message: justBingo.length ? `${justBingo.map((entry) => entry.player.name).join(", ")} escaped last-place danger with Bingo.` : `${currentCall.id} called.`,
    };
  }

  const firstBingoTie = !state.lockedWinner && justBingo.length > 1;
  const pendingWinnerTie = state.pendingWinnerTie || (firstBingoTie ? justBingo.map((entry) => entry.player) : null);
  const lockedWinner = state.lockedWinner || (justBingo.length === 1 ? justBingo[0].player : null);

  if (stillPlaying.length === 1) {
    const lastPlace = state.lockedLoser || stillPlaying[0].player;

    if (pendingWinnerTie && !lockedWinner) {
      return createBingoChallenge(pendingWinnerTie, "Bingo Winner Tiebreaker", null, lastPlace, "winner");
    }

    if (lockedWinner && lastPlace) {
      finishChallenge({
        name: "Bingo",
        winner: lockedWinner,
        lastPlace,
        placements: [lockedWinner, ...players.filter((entry) => entry.hasBingo).map((entry) => entry.player), lastPlace],
      });
    }

    return { ...state, calls, called, currentCall, players, round, lockedWinner, lockedLoser: lastPlace, pendingWinnerTie, message: `${lastPlace.name} is the only player without Bingo.` };
  }

  if (stillPlaying.length === 0) {
    const lastRoundBingos = players.filter((entry) => entry.lockedRound === round);

    if (pendingWinnerTie && !lockedWinner) {
      return createBingoChallenge(pendingWinnerTie, "Bingo Winner Tiebreaker", null, null, "winner");
    }

    if (lastRoundBingos.length > 1 && lockedWinner) {
      return createBingoChallenge(lastRoundBingos.map((entry) => entry.player), "Bingo Last Place Tiebreaker", lockedWinner, null, "last");
    }

    const lastPlace = state.lockedLoser || lastRoundBingos[0]?.player;
    if (lockedWinner && lastPlace) {
      finishChallenge({
        name: "Bingo",
        winner: lockedWinner,
        lastPlace,
        placements: [lockedWinner, ...players.filter((entry) => entry.hasBingo).map((entry) => entry.player), lastPlace],
      });
    }
    return { ...state, calls, called, currentCall, players, round, lockedWinner, lockedLoser: lastPlace, pendingWinnerTie, message: "Bingo complete." };
  }

  return {
    ...state,
    calls,
    called,
    currentCall,
    players: [...players].sort((a, b) => Number(a.hasBingo) - Number(b.hasBingo) || a.player.name.localeCompare(b.player.name)),
    round,
    lockedWinner,
    pendingWinnerTie,
    message: justBingo.length ? `${justBingo.map((entry) => entry.player.name).join(", ")} hit Bingo.` : `${currentCall.id} called.`,
  };
}

function baccaratValue(card) {
  if (!card) return 0;
  if (["10", "J", "Q", "K"].includes(card.rank)) return 0;
  if (card.rank === "A") return 1;
  return Number(card.rank);
}

function baccaratTotal(cards) {
  return cards.reduce((sum, card) => sum + baccaratValue(card), 0) % 10;
}

function baccaratDrawsThird(total) {
  return total <= 5;
}

function createBaccaratContestants(players) {
  return players.map((player) => {
    const roll = Math.random();
    const bet = roll < 0.46 ? "player" : roll < 0.92 ? "banker" : "tie";
    return {
      player,
      bet,
      cards: [],
      total: 0,
      result: null,
      safe: false,
      eliminated: false,
    };
  });
}

function createBaccaratChallenge(players) {
  return {
    type: "baccarat",
    stage: "neutral",
    round: 1,
    deck: makeShoe(players.length * 8 + 20),
    banker: { cards: [], total: 0, baseTotal: 0, finalTotal: 0, needsThird: false, thirdDrawn: false },
    winnersSide: createBaccaratContestants(players),
    losersSide: [],
    lastWinnerRound: [],
    lastLoserRound: [],
    resolvedWinner: null,
    resolvedLoser: null,
    complete: false,
    message: "Baccarat round ready. Advance to reveal everyone’s bets.",
  };
}

function dealBaccaratGroupInitial(group, deck) {
  if (!group.length) return { group, deck };

  const dealt = group.map((entry) => {
    const cards = [deck.pop(), deck.pop()];
    const total = baccaratTotal(cards);
    return {
      ...entry,
      cards,
      total,
      needsThird: baccaratDrawsThird(total),
      thirdDrawn: false,
      bankerNeedsThirdForEntry: false,
      result: null,
      safe: false,
      eliminated: false,
    };
  });

  return { group: dealt, deck };
}

function drawBaccaratPlayerThirdCards(group, deck) {
  const next = group.map((entry) => {
    if (!entry.needsThird || entry.thirdDrawn) return entry;
    const card = deck.pop();
    const cards = [...entry.cards, card];
    return {
      ...entry,
      cards,
      total: baccaratTotal(cards),
      thirdDrawn: true,
      needsThird: false,
    };
  });

  return { group: next, deck };
}

function markBaccaratBankerNeeds(group, bankerTotal) {
  return group.map((entry) => ({
    ...entry,
    bankerNeedsThirdForEntry: baccaratDrawsThird(bankerTotal),
  }));
}

function resolveBaccaratGroup(group, bankerBaseTotal, bankerFinalTotal) {
  return group.map((entry) => {
    const compareTotal = entry.bankerNeedsThirdForEntry ? bankerFinalTotal : bankerBaseTotal;
    let result = "banker";
    if (entry.total > compareTotal) result = "player";
    if (entry.total === compareTotal) result = "tie";
    const correct = entry.bet === result;
    return { ...entry, compareBankerTotal: compareTotal, result, safe: correct, eliminated: !correct };
  });
}

function advanceBaccarat(state, finishChallenge) {
  if (state.complete) {
    finishChallenge({
      name: "Baccarat",
      winner: state.resolvedWinner,
      lastPlace: state.resolvedLoser,
      placements: [state.resolvedWinner, ...state.winnersSide.map((e) => e.player), ...state.losersSide.map((e) => e.player), state.resolvedLoser].filter(Boolean),
    });
    return state;
  }

  if (state.stage === "neutral") {
    return {
      ...state,
      stage: "bets",
      message: "Bets revealed. Yellow = Player, Blue = Banker, Pink = Tie.",
    };
  }

  if (state.stage === "bets") {
    let deck = [...state.deck];
    const bankerCards = [deck.pop(), deck.pop()];
    const bankerBaseTotal = baccaratTotal(bankerCards);
    const bankerNeedsThird = baccaratDrawsThird(bankerBaseTotal);

    const winnerDealt = dealBaccaratGroupInitial(state.winnersSide, deck);
    deck = winnerDealt.deck;
    const loserDealt = state.losersSide.length ? dealBaccaratGroupInitial(state.losersSide, deck) : { group: [], deck };
    deck = loserDealt.deck;

    const winnersMarked = markBaccaratBankerNeeds(winnerDealt.group, bankerBaseTotal);
    const losersMarked = markBaccaratBankerNeeds(loserDealt.group, bankerBaseTotal);
    const anyPlayerNeedsThird = [...winnersMarked, ...losersMarked].some((entry) => entry.needsThird);

    return {
      ...state,
      deck,
      banker: { cards: bankerCards, total: bankerBaseTotal, baseTotal: bankerBaseTotal, finalTotal: bankerBaseTotal, needsThird: bankerNeedsThird, thirdDrawn: false },
      winnersSide: winnersMarked,
      losersSide: losersMarked,
      stage: anyPlayerNeedsThird ? "playerThirdPending" : bankerNeedsThird ? "bankerThirdPending" : "cards",
      message: anyPlayerNeedsThird
        ? "Initial cards dealt. Some players need a third card on the next advance."
        : bankerNeedsThird
          ? "Initial cards dealt. Banker needs a third card on the next advance."
          : "Initial cards dealt. No third cards needed. Advance to resolve bets.",
    };
  }

  if (state.stage === "playerThirdPending") {
    let deck = [...state.deck];
    const winnerDraw = drawBaccaratPlayerThirdCards(state.winnersSide, deck);
    deck = winnerDraw.deck;
    const loserDraw = drawBaccaratPlayerThirdCards(state.losersSide, deck);
    deck = loserDraw.deck;

    return {
      ...state,
      deck,
      winnersSide: winnerDraw.group,
      losersSide: loserDraw.group,
      stage: state.banker.needsThird ? "bankerThirdPending" : "cards",
      message: state.banker.needsThird
        ? "Player third cards drawn. Banker needs a third card on the next advance."
        : "Player third cards drawn. Advance to resolve bets.",
    };
  }

  if (state.stage === "bankerThirdPending") {
    const deck = [...state.deck];
    const bankerCards = [...state.banker.cards, deck.pop()];
    const finalTotal = baccaratTotal(bankerCards);

    return {
      ...state,
      deck,
      banker: { ...state.banker, cards: bankerCards, total: finalTotal, finalTotal, thirdDrawn: true },
      stage: "cards",
      message: "Banker third card drawn. Advance to resolve bets.",
    };
  }

  if (state.stage === "cards") {
    const winnerRound = resolveBaccaratGroup(state.winnersSide, state.banker.baseTotal ?? state.banker.total, state.banker.finalTotal ?? state.banker.total);
    const loserRound = resolveBaccaratGroup(state.losersSide, state.banker.baseTotal ?? state.banker.total, state.banker.finalTotal ?? state.banker.total);

    return {
      ...state,
      winnersSide: winnerRound,
      losersSide: loserRound,
      stage: "results",
      message: "Results revealed. Advance to move players into their next groups.",
    };
  }

  if (state.stage === "results") {
    const winnersAdvance = state.winnersSide.filter((p) => p.safe);
    const winnersOut = state.winnersSide.filter((p) => p.eliminated);
    const losersStayInDanger = state.losersSide.filter((p) => p.eliminated);

    const nextWinnerPool = winnersAdvance.length === 0 || winnersAdvance.length === state.winnersSide.length
      ? state.winnersSide.map((e) => e.player)
      : winnersAdvance.map((e) => e.player);

    const nextLoserPool = state.losersSide.length
      ? (losersStayInDanger.length === 0 || losersStayInDanger.length === state.losersSide.length
        ? state.losersSide.map((e) => e.player)
        : losersStayInDanger.map((e) => e.player))
      : winnersOut.map((e) => e.player);

    const resolvedWinner = state.resolvedWinner || (nextWinnerPool.length === 1 ? nextWinnerPool[0] : null);
    const resolvedLoser = state.resolvedLoser || (nextLoserPool.length === 1 ? nextLoserPool[0] : null);
    const complete = !!resolvedWinner && !!resolvedLoser;

    if (complete) {
      return {
        ...state,
        resolvedWinner,
        resolvedLoser,
        complete: true,
        message: `${resolvedWinner.name} wins Baccarat. ${resolvedLoser.name} finishes last.`,
      };
    }

    return {
      ...state,
      winnersSide: createBaccaratContestants(nextWinnerPool),
      losersSide: createBaccaratContestants(nextLoserPool),
      resolvedWinner,
      resolvedLoser,
      stage: "neutral",
      round: state.round + 1,
      banker: { cards: [], total: 0, baseTotal: 0, finalTotal: 0, needsThird: false, thirdDrawn: false },
      message: "Next Baccarat round ready. Advance to reveal bets.",
    };
  }

  return state;
}

function createPickACardChallenge(players) {
  const deck = makeDeck();
  const shuffledCards = shuffleArray(makeDeck());
  const placements = {};
  players.forEach((player, index) => {
    placements[cardKey(shuffledCards[index])] = player;
  });

  return {
    type: "pickACard",
    title: "Pick A Card",
    deck,
    placements,
    drawn: [],
    eliminated: [],
    active: players,
    firstOut: null,
    winner: null,
    complete: false,
    revealEliminated: null,
    message: "Everyone secretly picked a card. Draw cards until only one player remains.",
  };
}

function advancePickACard(state, finishChallenge) {
  if (!state) return state;
  if (state.revealEliminated) {
    return {
      ...state,
      eliminated: [{ ...state.revealEliminated, eliminatedBy: state.drawn[state.drawn.length - 1] }, ...state.eliminated],
      revealEliminated: null,
      message: "Eliminated player moved to the eliminated section.",
    };
  }

  if (state.complete) {
    finishChallenge({
      name: "Pick A Card",
      winner: state.winner,
      lastPlace: state.firstOut,
      placements: [state.winner, ...state.active, ...state.eliminated].filter(Boolean),
    });
    return state;
  }

  if (state.deck.length === 0) return state;

  const deck = [...state.deck];
  const drawnCard = deck.pop();
  const drawn = [...state.drawn, drawnCard];
  const hitPlayer = state.placements[cardKey(drawnCard)];

  let active = state.active;
  let eliminated = state.eliminated;
  let firstOut = state.firstOut;
  let message = `${cardLabel(drawnCard)} was drawn. Nobody had it.`;

  if (hitPlayer && active.some((p) => p.name === hitPlayer.name)) {
    active = active.filter((p) => p.name !== hitPlayer.name);
    firstOut = firstOut || hitPlayer;
    message = `${cardLabel(drawnCard)} was drawn. ${hitPlayer.name} is eliminated.`;

    const isComplete = active.length === 1;

    return {
      ...state,
      deck,
      drawn,
      active,
      eliminated,
      revealEliminated: hitPlayer,
      firstOut,
      winner: isComplete ? active[0] : null,
      complete: isComplete,
      message: isComplete ? `${active[0].name} is the last one standing! Advance to lock results.` : message,
    };
  }

  return {
    ...state,
    deck,
    drawn,
    active,
    eliminated,
    revealEliminated: null,
    firstOut,
    winner: active.length === 1 ? active[0] : null,
    complete: active.length === 1,
    message: active.length === 1
      ? `${active[0].name} is the last one standing! Advance to lock results.`
      : message,
  };
}

function createFlushOutDeck() {
  const deck = [];
  for (const suit of FLUSH_OUT_SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, value: VALUES[rank], id: `flush-${rank}-${suit}-${Math.random()}` });
    }
  }
  return shuffleArray(deck);
}

function flushOutBestCount(cards) {
  const counts = {};
  cards.forEach((card) => { counts[card.suit] = (counts[card.suit] || 0) + 1; });
  const bestSuit = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  return { suit: bestSuit[0], count: bestSuit[1], hasFlush: bestSuit[1] >= 5 };
}

function flushOutSuitCounts(cards, suits = SUITS) {
  const counts = Object.fromEntries(suits.map((suit) => [suit, 0]));
  cards.forEach((card) => {
    if (card && card.suit in counts) counts[card.suit] += 1;
  });
  return counts;
}

function createFlushOutChallenge(players, title = "Flush Out", lockedWinner = null, lockedLoser = null, useClassicSuits = false) {
  return {
    type: "flushOut",
    title,
    step: "draw",
    round: 1,
    useClassicSuits,
    pendingWinnerTie: null,
    pendingLoserTie: null,
    players: players.map((player) => ({
      player,
      deck: useClassicSuits ? makeDeck() : createFlushOutDeck(),
      cards: [],
      status: "drawing",
      lockedRound: null,
      best: { suit: "", count: 0, hasFlush: false },
    })),
    lockedWinner,
    lockedLoser,
    logs: [],
    message: "Everyone draws from their own giant deck. First 5-card flush wins, last without a flush loses.",
  };
}

function sortFlushOutPlayers(players) {
  return [...players].sort((a, b) => {
    if (a.status !== b.status) return a.status === "drawing" ? -1 : 1;
    if (a.best.count !== b.best.count) return b.best.count - a.best.count;
    return a.player.name.localeCompare(b.player.name);
  });
}

function advanceFlushOut(state, finishChallenge) {
  if (!state) return state;

  if (state.step === "draw") {
    const round = state.round;
    const nextPlayers = state.players.map((entry) => {
      if (entry.status === "safe") return entry;
      const deck = [...entry.deck];
      const drawn = deck.pop();
      const cards = [...entry.cards, drawn];
      const best = flushOutBestCount(cards);
      const status = best.hasFlush ? "safe" : "drawing";
      return {
        ...entry,
        deck,
        cards,
        best,
        status,
        lockedRound: status === "safe" ? round : null,
      };
    });

    const justSafe = nextPlayers.filter((entry) => entry.status === "safe" && entry.lockedRound === round);
    const log = justSafe.length ? `${justSafe.map((e) => e.player.name).join(", ")} hit a flush.` : `Round ${round}: cards drawn.`;

    return {
      ...state,
      players: nextPlayers,
      step: "sort",
      logs: [...state.logs, log],
      message: "Cards drawn. Advance to sort by who is closest to a flush.",
    };
  }

  const sorted = sortFlushOutPlayers(state.players);
  const drawing = sorted.filter((entry) => entry.status !== "safe");
  const safe = sorted.filter((entry) => entry.status === "safe");

  const winnerCandidates = state.lockedWinner ? [] : safe.filter((entry) => entry.lockedRound === state.round);
  const lockedWinner = state.lockedWinner || (winnerCandidates.length === 1 ? winnerCandidates[0].player : null);
  const pendingWinnerTie = state.pendingWinnerTie || (winnerCandidates.length > 1 ? winnerCandidates.map((entry) => entry.player) : null);

  if (drawing.length === 1) {
    const lastPlace = state.lockedLoser || drawing[0].player;

    if (pendingWinnerTie) {
      return createFlushOutChallenge(
        pendingWinnerTie,
        "Flush Out Winner Tiebreaker",
        null,
        lastPlace,
        true
      );
    }

    if (lockedWinner && lastPlace) {
      finishChallenge({
        name: "Flush Out",
        winner: lockedWinner,
        lastPlace,
        placements: [lockedWinner, ...safe.map((entry) => entry.player), lastPlace],
      });
    }
    return {
      ...state,
      players: sorted,
      lockedWinner,
      lockedLoser: lastPlace,
      message: `${lastPlace.name} is the only player without a flush.`,
    };
  }

  if (drawing.length === 0) {
    const lastRoundSafe = safe.filter((entry) => entry.lockedRound === state.round);

    if (!state.lockedLoser && lastRoundSafe.length > 1) {
      if (pendingWinnerTie) {
        return createFlushOutChallenge(
          pendingWinnerTie,
          "Flush Out Winner Tiebreaker",
          null,
          null,
          true
        );
      }

      return createFlushOutChallenge(
        lastRoundSafe.map((entry) => entry.player),
        "Flush Out Last Place Tiebreaker",
        lockedWinner,
        null,
        true
      );
    }
    const lastPlace = state.lockedLoser || lastRoundSafe[0]?.player || sorted[sorted.length - 1]?.player;
    if (lockedWinner && lastPlace) {
      finishChallenge({
        name: "Flush Out",
        winner: lockedWinner,
        lastPlace,
        placements: [lockedWinner, ...safe.map((entry) => entry.player), lastPlace],
      });
    }
    return { ...state, players: sorted, lockedWinner, lockedLoser: lastPlace, message: "Flush Out complete." };
  }

  return {
    ...state,
    players: sorted,
    lockedWinner,
    pendingWinnerTie,
    step: "draw",
    round: state.round + 1,
    message: "Sorted by closest to a flush. Safe players move down and stop drawing.",
  };
}

function createFlushOutElim(a, b) {
  return {
    type: "flushOutElim",
    playerA: a,
    playerB: b,
    round: 1,
    players: [
      {
        player: a,
        deck: makeDeck(),
        cards: [],
        best: { suit: "", count: 0, hasFlush: false },
      },
      {
        player: b,
        deck: makeDeck(),
        cards: [],
        best: { suit: "", count: 0, hasFlush: false },
      },
    ],
    winner: null,
    eliminated: null,
    complete: false,
    tiePending: false,
    message: "First to a 5-card flush survives. Ties reset the round.",
  };
}

function advanceFlushOutElim(state, finish) {
  if (state.complete) {
    finish({ winner: state.winner, eliminated: state.eliminated });
    return state;
  }

  if (state.tiePending) {
    return {
      ...createFlushOutElim(state.playerA, state.playerB),
      round: state.round + 1,
      message: "Tie reset. New round started."
    };
  }

  const nextPlayers = state.players.map((entry) => {
    const deck = [...entry.deck];
    const drawn = deck.pop();
    const cards = [...entry.cards, drawn];
    return {
      ...entry,
      deck,
      cards,
      best: flushOutBestCount(cards),
    };
  });

  const flushers = nextPlayers.filter((p) => p.best.hasFlush);

  if (flushers.length === 1) {
    const winner = flushers[0].player;
    const loser = nextPlayers.find((p) => p.player.name !== winner.name)?.player;
    return {
      ...state,
      players: nextPlayers,
      winner,
      eliminated: loser,
      complete: true,
      message: `${winner.name} completed a flush first.`
    };
  }

  if (flushers.length === 2) {
    return {
      ...state,
      players: nextPlayers,
      tiePending: true,
      message: "Both players hit a flush at the same time. Advance to reset the round."
    };
  }

  return {
    ...state,
    players: nextPlayers,
    round: state.round + 1,
    message: `No flush yet. Continue drawing.`
  };
}

function createWarElim(a, b) { return { type: "warElim", playerA: a, playerB: b, scoreA: 0, scoreB: 0, complete: false, winner: null, eliminated: null, lastFlip: null }; }
function advanceWarElim(state, finish) { if (state.complete) { finish({ winner: state.winner, eliminated: state.eliminated }); return state; } const r = warMatch(state.playerA, state.playerB); const scoreA = state.scoreA + (r.winner.name === state.playerA.name ? 1 : 0); const scoreB = state.scoreB + (r.winner.name === state.playerB.name ? 1 : 0); const complete = scoreA === 2 || scoreB === 2; const winner = complete ? (scoreA > scoreB ? state.playerA : state.playerB) : null; return { ...state, scoreA, scoreB, complete, winner, eliminated: complete ? (winner.name === state.playerA.name ? state.playerB : state.playerA) : null, lastFlip: r }; }

function createBaccaratElim(a, b) {
  return {
    type: "baccaratElim",
    playerA: a,
    playerB: b,
    stage: "deal",
    deck: makeShoe(30),
    hands: [
      { player: a, cards: [], total: 0, needsThird: false, thirdDrawn: false },
      { player: b, cards: [], total: 0, needsThird: false, thirdDrawn: false },
    ],
    winner: null,
    eliminated: null,
    complete: false,
    message: "Head-to-head Baccarat. Higher total survives. Ties replay."
  };
}

function advanceBaccaratElim(state, finish) {
  if (state.complete) {
    finish({ winner: state.winner, eliminated: state.eliminated });
    return state;
  }

  if (state.stage === "deal") {
    const deck = [...state.deck];
    const hands = state.hands.map((hand) => {
      const cards = [deck.pop(), deck.pop()];
      const total = baccaratTotal(cards);
      return { ...hand, cards, total, needsThird: baccaratDrawsThird(total), thirdDrawn: false };
    });
    const anyThird = hands.some((hand) => hand.needsThird);
    return {
      ...state,
      deck,
      hands,
      stage: anyThird ? "thirdPending" : "compare",
      message: anyThird ? "Initial cards dealt. At least one player needs a third card." : "Initial cards dealt. Advance to compare totals."
    };
  }

  if (state.stage === "thirdPending") {
    const deck = [...state.deck];
    const hands = state.hands.map((hand) => {
      if (!hand.needsThird || hand.thirdDrawn) return hand;
      const card = deck.pop();
      const cards = [...hand.cards, card];
      return { ...hand, cards, total: baccaratTotal(cards), needsThird: false, thirdDrawn: true };
    });
    return {
      ...state,
      deck,
      hands,
      stage: "compare",
      message: "Third cards drawn. Advance to compare totals."
    };
  }

  if (state.stage === "compare") {
    const [aHand, bHand] = state.hands;
    if (aHand.total === bHand.total) {
      return {
        ...createBaccaratElim(state.playerA, state.playerB),
        message: `Tie at ${aHand.total}. Replay the round.`
      };
    }
    const aWins = aHand.total > bHand.total;
    return {
      ...state,
      winner: aWins ? state.playerA : state.playerB,
      eliminated: aWins ? state.playerB : state.playerA,
      complete: true,
      message: `${aWins ? state.playerA.name : state.playerB.name} wins the Baccarat elimination.`
    };
  }

  return state;
}

function createBlackjackElim(a, b) { return { type: "bjElim", playerA: a, playerB: b, display: "deal", hand: null, winner: null, eliminated: null, message: "Higher non-bust score wins. Ties replay." }; }
function makeBlackjackElimHand(player, deck) { const cards = [deck.pop(), deck.pop()]; return { player, cards, action: "Waiting", pending: null, done: false, bust: false }; }
function advanceBlackjackElim(state, finish) {
  if (state.display === "deal") { const deck = makeShoe(30); return { ...state, hand: { deck, hands: [makeBlackjackElimHand(state.playerA, deck), makeBlackjackElimHand(state.playerB, deck)] }, display: "actionSelect", message: "Cards dealt." }; }
  if (state.display === "actionSelect") {
    return {
      ...state,
      hand: {
        ...state.hand,
        hands: state.hand.hands.map((h) => {
          if (h.done || h.bust || h.action === "Stand") return h;
          const decision = bjDecision(h.cards);
          return { ...h, action: decision, pending: decision };
        })
      },
      display: "actionResult"
    };
  }
  if (state.display === "actionResult") { const deck = [...state.hand.deck]; const hands = state.hand.hands.map((h) => { if (h.done || h.bust || h.action === "Stand") return h; if (h.pending === "Stand") return { ...h, done: true, action: "Stand" }; const cards = [...h.cards, deck.pop()]; const bust = blackjackTotal(cards) > 21; return { ...h, cards, bust, done: bust, action: bust ? "Bust" : "Waiting", pending: null }; }); return { ...state, hand: { deck, hands }, display: hands.every((h) => h.done || h.bust || h.action === "Stand") ? "compare" : "actionSelect" }; }
  if (state.display === "compare") { const [x, y] = state.hand.hands; const xt = blackjackTotal(x.cards), yt = blackjackTotal(y.cards), xb = xt > 21, yb = yt > 21; if ((xb && yb) || xt === yt) return { ...state, display: "deal", hand: null, message: "Tie. Replay." }; const xwin = yb || (!xb && xt > yt); return { ...state, winner: xwin ? x.player : y.player, eliminated: xwin ? y.player : x.player, display: "complete" }; }
  if (state.display === "complete") finish({ winner: state.winner, eliminated: state.eliminated });
  return state;
}

function card31Value(card) { if (!card) return 0; if (["J", "Q", "K"].includes(card.rank)) return 10; if (card.rank === "A") return 11; if (card.rank === "22") return 22; return Number(card.rank); }
function chooseThirtyOneActor(a, b, scores) { const as = scores[a.name], bs = scores[b.name]; if (as === bs) return "both"; if (as === 31 && bs !== 31) return b; if (bs === 31 && as !== 31) return a; return as < bs ? a : b; }
function createThirtyOneElim(a, b) { const deck = makeShoe(80); const ca = deck.pop(), cb = deck.pop(); const scores = { [a.name]: card31Value(ca), [b.name]: card31Value(cb) }; return { type: "31", playerA: a, playerB: b, deck, hands: { [a.name]: [ca], [b.name]: [cb] }, scores, actor: chooseThirtyOneActor(a, b, scores), message: `Starting cards dealt. ${scores[a.name] === scores[b.name] ? "Tie — both draw next." : (scores[a.name] < scores[b.name] ? a.name : b.name) + " is lower and must hit."}`, history: [], winner: null, eliminated: null, complete: false }; }
function resetThirtyOneTo22(state, msg) { const deck = [...state.deck]; const ca = deck.pop(), cb = deck.pop(); const baseA = { rank: "22", suit: "", value: 22, id: `base22-${state.playerA.name}-${Math.random()}` }; const baseB = { rank: "22", suit: "", value: 22, id: `base22-${state.playerB.name}-${Math.random()}` }; const hands = { [state.playerA.name]: [baseA, ca], [state.playerB.name]: [baseB, cb] }; const scores = { [state.playerA.name]: 22 + card31Value(ca), [state.playerB.name]: 22 + card31Value(cb) }; return { ...state, deck, hands, scores, actor: chooseThirtyOneActor(state.playerA, state.playerB, scores), message: msg, history: [...state.history, msg] }; }
function advanceThirtyOne(state, finish) { if (state.complete) { finish({ winner: state.winner, eliminated: state.eliminated }); return state; } const a = state.playerA, b = state.playerB, an = a.name, bn = b.name; let deck = [...state.deck], hands = { ...state.hands }, scores = { ...state.scores }; const draw = (p) => { const card = deck.pop(); hands[p.name] = [...(hands[p.name] || []), card]; scores[p.name] += card31Value(card); return card; }; let msg = ""; if (state.actor === "both") { const ca = draw(a), cb = draw(b); msg = `Both draw: ${an} gets ${cardLabel(ca)}, ${bn} gets ${cardLabel(cb)}.`; if (scores[an] > 31 && scores[bn] > 31) return resetThirtyOneTo22({ ...state, deck, hands, scores }, "Both bust. Reset to 22 points and both draw a card."); if (scores[an] === 31 && scores[bn] === 31) return resetThirtyOneTo22({ ...state, deck, hands, scores }, "Both hit 31. Reset to 22 points and both draw a card."); } else { const p = state.actor; const other = p.name === an ? b : a; const card = draw(p); msg = `${p.name} hits ${cardLabel(card)} and goes to ${scores[p.name]}.`; if (scores[p.name] > 31) return { ...state, deck, hands, scores, complete: true, winner: other, eliminated: p, message: `${p.name} busts over 31. ${other.name} wins.`, history: [...state.history, msg] }; if (scores[p.name] === scores[other.name]) msg += " Scores tied, both draw next."; if (scores[p.name] === 31 && scores[other.name] !== 31) msg += ` ${other.name} must hit until 31 or bust.`; } const actor = chooseThirtyOneActor(a, b, scores); if (actor !== "both" && scores[actor.name] < 31) msg += ` ${actor.name} is lower and must hit.`; return { ...state, deck, hands, scores, actor, message: msg, history: [...state.history, msg] }; }

function createHorseRaceElimination(a, b) { const deck = makeDeck().filter((c) => c.rank !== "A"); const traps = deck.slice(0, 6).map((c, i) => ({ ...c, column: i, revealed: false })); const raceDeck = shuffleArray(deck.slice(6)); const first = pickRandom(SUITS), remaining = SUITS.filter((s) => s !== first), second = shuffleArray(remaining).slice(0, 2), last = remaining.find((s) => !second.includes(s)); return { type: "horse", playerA: a, playerB: b, display: "racing", aceCards: SUITS.map((s) => ({ rank: "A", suit: s, value: 14, id: `A${s}` })), trapCards: traps, raceDeck, positions: { "♠": 0, "♥": 0, "♦": 0, "♣": 0 }, bets: { [a.name]: [first, last], [b.name]: second }, currentDraw: null, history: [], revealedColumns: [], winner: null, eliminated: null, winningSuit: null, message: "Bets locked. Draw race cards." }; }
function advanceHorse(state, finish) { if (state.display === "complete") { finish({ winner: state.winner, eliminated: state.eliminated }); return state; } const [drawn, ...raceDeck] = state.raceDeck; let next = { ...state, raceDeck, currentDraw: drawn, positions: { ...state.positions, [drawn.suit]: state.positions[drawn.suit] + 1 }, history: [...state.history, `${cardLabel(drawn)} drawn: ${drawn.suit} advances.`], message: `${cardLabel(drawn)} drawn.` }; const col = next.revealedColumns.length; if (col < 6 && Object.values(next.positions).every((p) => p > col)) { const trap = next.trapCards[col]; next = { ...next, trapCards: next.trapCards.map((c, i) => i === col ? { ...c, revealed: true } : c), positions: { ...next.positions, [trap.suit]: Math.max(0, next.positions[trap.suit] - 1) }, revealedColumns: [...next.revealedColumns, col], history: [...next.history, `Trap ${cardLabel(trap)}: ${trap.suit} back one.`] }; } const suit = SUITS.find((s) => next.positions[s] >= 7); if (suit) { const awin = next.bets[next.playerA.name].includes(suit); next = { ...next, display: "complete", winner: awin ? next.playerA : next.playerB, eliminated: awin ? next.playerB : next.playerA, winningSuit: suit, message: `${suit} wins the race.` }; } return next; }

function runDevTests() {
  console.assert(makeDeck().length === 52, "Deck should have 52 cards");
  console.assert(partialPokerScore([{ rank: "A", suit: "♠", value: 14 }, { rank: "A", suit: "♥", value: 14 }]).name === "One Pair", "Partial poker hands should show pairs before 5 cards");
  console.assert(partialPokerScore([{ rank: "K", suit: "♠", value: 13 }]).name === "K High", "Partial poker hands should show high card before 5 cards");
  const flopTest = createPokerGame([{ name: "Test", img: "" }], "Flop", "flop");
  console.assert(new Set(flopTest.hole.Test.map((c) => `${c.rank}${c.suit}`)).size === flopTest.hole.Test.length, "Flop hands should not contain duplicate cards from the same deck");
  const holdemTest = createPokerGame([{ name: "A", img: "" }, { name: "B", img: "" }], "Poker", "holdem");
  console.assert(Object.keys(calculateHoldemWinInfo(holdemTest, holdemTest.community.slice(0, 4))).length === 2, "Poker should calculate win percentages at the turn");
  const rankingTest = evaluatePoker(
    [{ name: "Live", img: "" }, { name: "Dead", img: "" }],
    { Live: [{ rank: "2", suit: "♠", value: 2 }, { rank: "3", suit: "♠", value: 3 }], Dead: [{ rank: "A", suit: "♠", value: 14 }, { rank: "A", suit: "♥", value: 14 }] },
    [{ rank: "4", suit: "♠", value: 4 }, { rank: "5", suit: "♣", value: 5 }, { rank: "9", suit: "♦", value: 9 }, { rank: "K", suit: "♣", value: 13 }],
    "holdem",
    4,
    { Live: { pct: 10 }, Dead: { pct: 0 } }
  );
  console.assert(rankingTest[0].player.name === "Live", "Poker ranking should place 0% win chance behind anyone with a fighting chance");
  console.assert(makeChallengeSettings().every((challenge) => "maxPlayers" in challenge), "Challenge settings should include maximum player threshold");
  console.assert(DEFAULT_CHALLENGES.includes("Blackjack"), "Blackjack challenge should exist");
  console.assert(DEFAULT_CHALLENGES.includes("Flush Out"), "Flush Out challenge should exist");
  console.assert(DEFAULT_CHALLENGES.includes("Pick A Card"), "Pick A Card challenge should exist");
  console.assert(DEFAULT_CHALLENGES.includes("Bingo"), "Bingo challenge should exist");
  console.assert(DEFAULT_CHALLENGES.includes("Liar's Dice"), "Liar's Dice challenge should exist");
  console.assert(isHigherBid({ count: 4, face: 4 }, { count: 4, face: 3 }) === true, "Liar's Dice same count higher face should raise");
  console.assert(isHigherBid({ count: 3, face: 6 }, { count: 4, face: 1 }) === false, "Liar's Dice lower count should not raise");
  console.assert(4 >= 4, "Liar's Dice exact-count bid should be true, so the caller loses");
  console.assert(makeBingoCalls().length === 75, "Bingo should have 75 calls");
  console.assert(createBingoChallenge([{ name: "A", img: "" }], "Bingo", null, null, "last").tiebreakerMode === "last", "Bingo tiebreaker mode should be preserved");
  console.assert(createFlushOutDeck().length === FLUSH_OUT_SUITS.length * RANKS.length, "Flush Out deck should include all expanded suits from A through K");
  console.assert(flushOutSuitCounts([{ suit: "♠" }, { suit: "♠" }, { suit: "♥" }])["♠"] === 2, "Flush Out suit counter should count each classic suit");
  console.assert(DEFAULT_ELIMINATIONS.includes("31"), "31 elimination should exist");
  console.assert(DEFAULT_ELIMINATIONS.includes("Flush Out"), "Flush Out elimination should exist");
  console.assert(DEFAULT_ELIMINATIONS.includes("Baccarat"), "Baccarat elimination should exist");
  const testA = { name: "A", img: "" }, testB = { name: "B", img: "" };
  console.assert(Object.keys(createPickACardChallenge([testA, testB]).placements).length === 2, "Pick A Card should assign every player to one card");
  console.assert(createThirtyOneElim(testA, testB).hands.A.length === 1, "31 should start with one card each");
  console.assert(createHorseRaceElimination(testA, testB).trapCards.length === 6, "Horse Race should have six trap cards");
}
// Development tests disabled in SimulatorTV because casts load dynamically from Supabase.

export default function CardGameEliminationSimulator() {
  const router = useRouter();
  const [savedCasts, setSavedCasts] = useState([]);
  const [castPool, setCastPool] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [challenges, setChallenges] = useState(makeChallengeSettings());
  const [elims, setElims] = useState(makeEliminationSettings());
  const [phase, setPhase] = useState("setup");
  const [players, setPlayers] = useState([]);
  const [evicted, setEvicted] = useState([]);
  const [round, setRound] = useState(1);
  const [challenge, setChallenge] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [elim, setElim] = useState(null);
  const [pending, setPending] = useState(null);
  const [elimResult, setElimResult] = useState(null);
  const [bottom3, setBottom3] = useState(false);

  useEffect(() => {
    loadAvailableCasts();
  }, []);

  async function loadAvailableCasts() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: favoriteData } = await supabase
      .from("favorite_casts")
      .select("cast_id")
      .eq("user_id", userData.user.id);

    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (userCastsError) {
      alert(userCastsError.message);
      setLoadingCasts(false);
      return;
    }

    let officialCasts = [];

    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase
        .from("casts")
        .select("id, name, show_name, created_at, is_official")
        .in("id", favoriteOfficialCastIds)
        .eq("is_official", true)
        .order("name", { ascending: true });

      if (officialError) {
        alert(officialError.message);
        setLoadingCasts(false);
        return;
      }

      officialCasts = officialData || [];
    }

    setSavedCasts([...officialCasts, ...(userCasts || [])]);
    setLoadingCasts(false);
  }

  async function addCastToRoster(castId) {
    if (!castId) return;

    const { data, error } = await supabase
      .from("contestants")
      .select("id, name, image_url")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    const additions = (data || []).map((person) => ({
      id: `${castId}-${person.id}`,
      name: person.name,
      img: person.image_url || "",
      sourceCastId: castId,
    }));

    setCastPool((current) => {
      const existing = new Set(current.map((player) => player.name));
      const next = [...current, ...additions.filter((player) => !existing.has(player.name))];
      setSelected(new Set(next.map((player) => player.name)));
      return next;
    });
  }

  function removeFromRoster(playerName) {
    setCastPool((current) => current.filter((player) => player.name !== playerName));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(playerName);
      return next;
    });
  }

  function clearRoster() {
    const confirmClear = confirm("Clear the current roster?");
    if (!confirmClear) return;
    setCastPool([]);
    setSelected(new Set());
  }

  const enabledChallenges = challenges
    .filter((c) => c.enabled)
    .filter((c) => !c.maxPlayers || players.length <= Number(c.maxPlayers))
    .map((c) => c.name);
  const enabledElims = elims.filter((e) => e.enabled).map((e) => e.name);

  function togglePlayer(name) { const next = new Set(selected); next.has(name) ? next.delete(name) : next.add(name); setSelected(next); }
  function startSeason() { const chosen = shuffleArray(castPool.filter((p) => selected.has(p.name))); if (chosen.length < 3) return; setPlayers(chosen); setEvicted([]); setRound(1); setPhase("roundStart"); }
  function reset() { setPhase("setup"); setPlayers([]); setEvicted([]); setRound(1); setChallenge(null); setRoundResult(null); setElim(null); setPending(null); setElimResult(null); }
  function finishChallenge(result) { setRoundResult(result); setPhase("nomination"); }

  function startChallenge() {
    const pool = enabledChallenges.length ? enabledChallenges : DEFAULT_CHALLENGES;
    const game = pickRandom(pool);
    if (game === "Poker") setChallenge(createPokerGame(players, "Poker", "holdem"));
    else if (game === "Flop") setChallenge(createPokerGame(players, "Flop", "flop"));
    else if (game === "Flop 7") setChallenge(createPokerGame(players, "Flop 7", "flop7"));
    else if (game === "War") setChallenge(createWarChallenge(players));
    else if (game === "Flush Out") setChallenge(createFlushOutChallenge(players));
    else if (game === "Pick A Card") setChallenge(createPickACardChallenge(players));
    else if (game === "Baccarat") setChallenge(createBaccaratChallenge(players));
    else if (game === "Bingo") setChallenge(createBingoChallenge(players));
    else if (game === "Liar's Dice") setChallenge(createLiarsDiceChallenge(players));
    else setChallenge(createBlackjackChallenge(players));
    setPhase(game === "War" ? "war" : game === "Blackjack" ? "blackjack" : game === "Flush Out" ? "flushOut" : game === "Pick A Card" ? "pickACard" : game === "Baccarat" ? "baccarat" : game === "Bingo" ? "bingo" : game === "Liar's Dice" ? "liarsDice" : "poker");
  }

  function advanceChallenge() { if (phase === "poker") setChallenge((s) => advancePokerState(s, finishChallenge)); if (phase === "war") setChallenge((s) => advanceWar(s, finishChallenge)); if (phase === "blackjack") setChallenge((s) => advanceBlackjack(s, finishChallenge)); if (phase === "flushOut") setChallenge((s) => advanceFlushOut(s, finishChallenge)); if (phase === "pickACard") setChallenge((s) => advancePickACard(s, finishChallenge)); if (phase === "baccarat") setChallenge((s) => advanceBaccarat(s, finishChallenge)); if (phase === "bingo") setChallenge((s) => advanceBingo(s, finishChallenge)); if (phase === "liarsDice") setChallenge((s) => advanceLiarsDice(s, finishChallenge)); }
  function eligibleNominees() { if (!roundResult) return []; const base = players.filter((p) => p.name !== roundResult.winner.name && p.name !== roundResult.lastPlace.name); if (!bottom3 || !roundResult.placements) return base; return [...roundResult.placements].reverse().filter((p) => p.name !== roundResult.winner.name && p.name !== roundResult.lastPlace.name).slice(0, 3); }

  function sendIn(player) {
    const pool = enabledElims.length ? enabledElims : DEFAULT_ELIMINATIONS;
    const game = pickRandom(pool);
    setPending({ lastPlace: roundResult.lastPlace, sentIn: player, game });
    if (game === "Poker") setElim(createPokerGame([roundResult.lastPlace, player], "Poker", "holdem"));
    else if (game === "Flop") setElim(createPokerGame([roundResult.lastPlace, player], "Flop", "flop"));
    else if (game === "War") setElim(createWarElim(roundResult.lastPlace, player));
    else if (game === "Blackjack") setElim(createBlackjackElim(roundResult.lastPlace, player));
    else if (game === "Baccarat") setElim(createBaccaratElim(roundResult.lastPlace, player));
    else if (game === "31") setElim(createThirtyOneElim(roundResult.lastPlace, player));
    else if (game === "Flush Out") setElim(createFlushOutElim(roundResult.lastPlace, player));
    else setElim(createHorseRaceElimination(roundResult.lastPlace, player));
    setPhase(game === "War" ? "elimWar" : game === "Blackjack" ? "elimBlackjack" : game === "Baccarat" ? "elimBaccarat" : game === "Horse Race" ? "elimHorse" : game === "31" ? "elim31" : game === "Flush Out" ? "elimFlushOut" : "elimPoker");
  }

  function finishElimination(result) { const winner = result.winner; const eliminated = result.eliminated || (winner.name === pending.lastPlace.name ? pending.sentIn : pending.lastPlace); setElimResult({ winner, eliminated, game: pending.game }); setPhase("elimResult"); }
  function continueAfterElimination() { const { winner, eliminated, game } = elimResult; const remaining = players.filter((p) => p.name !== eliminated.name); setEvicted((old) => [{ ...eliminated, round, game, by: winner.name }, ...old]); setPlayers(remaining); setRound((r) => r + 1); setPending(null); setElim(null); setElimResult(null); setRoundResult(null); setPhase(remaining.length <= 2 ? "finale" : "roundStart"); }
  function advanceElim() { if (phase === "elimPoker") setElim((s) => advancePokerState(s, (r) => finishElimination({ winner: r.winner, eliminated: r.lastPlace }))); if (phase === "elimWar") setElim((s) => advanceWarElim(s, finishElimination)); if (phase === "elimBlackjack") setElim((s) => advanceBlackjackElim(s, finishElimination)); if (phase === "elimBaccarat") setElim((s) => advanceBaccaratElim(s, finishElimination)); if (phase === "elimHorse") setElim((s) => advanceHorse(s, finishElimination)); if (phase === "elim31") setElim((s) => advanceThirtyOne(s, finishElimination)); if (phase === "elimFlushOut") setElim((s) => advanceFlushOutElim(s, finishElimination)); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white overflow-x-hidden">
      <Navbar />

      <div className="mx-auto max-w-7xl space-y-4 p-3 sm:p-6">
        <Header phase={phase} count={phase === "setup" ? selected.size : players.length} out={evicted.length} round={round} />
        {phase === "setup" && <Setup selected={selected} togglePlayer={togglePlayer} challenges={challenges} setChallenges={setChallenges} elims={elims} setElims={setElims} bottom3={bottom3} setBottom3={setBottom3} startSeason={startSeason} savedCasts={savedCasts} castPool={castPool} loadingCasts={loadingCasts} addCastToRoster={addCastToRoster} removeFromRoster={removeFromRoster} clearRoster={clearRoster} setSelected={setSelected} />}
        {phase === "roundStart" && <RoundStart round={round} players={players} start={startChallenge} reset={reset} />}
        {phase === "poker" && <PokerScreen state={challenge} advance={advanceChallenge} />}
        {phase === "war" && <WarScreen state={challenge} advance={advanceChallenge} />}
        {phase === "blackjack" && <BlackjackScreen state={challenge} advance={advanceChallenge} />}
        {phase === "flushOut" && <FlushOutScreen state={challenge} advance={advanceChallenge} />}
        {phase === "pickACard" && <PickACardScreen state={challenge} advance={advanceChallenge} />}
        {phase === "baccarat" && <BaccaratScreen state={challenge} advance={advanceChallenge} />}
        {phase === "bingo" && <BingoScreen state={challenge} advance={advanceChallenge} />}
        {phase === "liarsDice" && <LiarsDiceScreen state={challenge} advance={advanceChallenge} />}
        {phase === "nomination" && <Nomination result={roundResult} eligible={eligibleNominees()} sendIn={sendIn} />}
        {phase === "elimPoker" && <PokerScreen state={elim} advance={advanceElim} />}
        {phase === "elimWar" && <WarElimScreen state={elim} advance={advanceElim} />}
        {phase === "elimBlackjack" && <BlackjackElimScreen state={elim} advance={advanceElim} />}
        {phase === "elimBaccarat" && <BaccaratElimScreen state={elim} advance={advanceElim} />}
        {phase === "elimHorse" && <HorseScreen state={elim} advance={advanceElim} />}
        {phase === "elim31" && <ThirtyOneScreen state={elim} advance={advanceElim} />}
        {phase === "elimFlushOut" && <FlushOutElimScreen state={elim} advance={advanceElim} />}
        {phase === "elimResult" && <EliminationResultScreen result={elimResult} advance={continueAfterElimination} />}
        {phase === "finale" && <Finale players={players} reset={reset} />}
      </div>
    </div>
  );
}

function Header({ phase, count, out, round }) { return <CardBox className="bg-white/10 p-5"><h1 className="text-4xl font-black">Card Game Elimination Simulator</h1><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Stat label="Cast" value={count} /><Stat label="Out" value={out} /><Stat label="Round" value={phase === "setup" ? "-" : phase === "finale" ? "Finale" : round} /></div></CardBox>; }
function Stat({ label, value }) { return <div className="rounded-2xl bg-black/25 p-3"><div className="text-2xl font-black">{value}</div><div className="text-xs uppercase tracking-widest text-slate-300">{label}</div></div>; }
function Pool({ title, items, onClick, onMaxChange, showMax = false }) {
  return (
    <div className="mt-3 rounded-2xl bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black">{title}</h3>
        {showMax && <div className="text-xs uppercase tracking-widest text-slate-400">Max Players</div>}
      </div>

      {items.map((x) => (
        <div key={x.name} className={`mt-1 flex items-center gap-2 rounded-xl px-3 py-2 ${x.enabled ? "bg-emerald-400/20" : "bg-white/5 text-slate-500"}`}>
          <button onClick={() => onClick(x.name)} className={`flex-1 text-left font-black ${x.enabled ? "" : "line-through"}`}>
            {x.enabled ? "✅" : "⬛"} {x.name}
          </button>

          {showMax && (
            <input
              type="number"
              min="2"
              value={x.maxPlayers || ""}
              onChange={(e) => onMaxChange?.(x.name, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Any"
              className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-center text-sm font-black text-white placeholder:text-slate-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}
function Setup({ selected, togglePlayer, challenges, setChallenges, elims, setElims, bottom3, setBottom3, startSeason, savedCasts, castPool, loadingCasts, addCastToRoster, removeFromRoster, clearRoster, setSelected }) {
  const toggleItem = (items, setter, name) => setter(items.map((x) => x.name === name ? { ...x, enabled: !x.enabled } : x));
  const updateChallengeMax = (name, value) => {
    const clean = value === "" ? "" : String(Math.max(2, Number(value) || 2));
    setChallenges(challenges.map((x) => x.name === name ? { ...x, maxPlayers: clean } : x));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
      <CardBox className="bg-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Current Cast</h2>
            <p className="text-sm text-slate-300">Add from your custom casts or official casts you favorited.</p>
          </div>
          {castPool.length > 0 && <Button variant="outline" onClick={clearRoster}>Clear Roster</Button>}
        </div>

        {loadingCasts ? (
          <div className="mt-4 rounded-2xl bg-black/25 p-4 text-slate-300">Loading casts...</div>
        ) : savedCasts.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-rose-500/20 p-4 text-rose-100">
            No casts available. Favorite official casts first, or create a custom cast.
          </div>
        ) : (
          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
            <select
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black text-white"
              onChange={(e) => addCastToRoster(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Add a cast...</option>
              {savedCasts.map((cast) => (
                <option key={cast.id} value={cast.id}>
                  {cast.is_official ? "★ " : ""}{cast.name}{cast.show_name ? ` (${cast.show_name})` : ""}
                </option>
              ))}
            </select>
            <Link href="/official-casts" className="rounded-2xl bg-yellow-400 px-4 py-3 text-center font-black text-slate-950 hover:bg-yellow-300">
              Favorite Official Casts
            </Link>
          </div>
        )}

        {castPool.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-black/25 p-4 text-slate-300">No cast members added yet.</div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => setSelected(new Set(castPool.map((p) => p.name)))}>Select All</Button>
              <Button variant="outline" onClick={() => setSelected(new Set())}>Select None</Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8">
              {castPool.map((p) => (
                <div key={p.name} className={`relative rounded-3xl border p-2 ${selected.has(p.name) ? "border-emerald-300 bg-emerald-400/20" : "border-white/10 bg-black/20 opacity-50 grayscale"}`}>
                  <button onClick={() => togglePlayer(p.name)} className="w-full">
                    <div className="flex justify-center"><Avatar player={p} disabled={!selected.has(p.name)} /></div>
                    <div className="mt-2 truncate text-sm font-black">{p.name}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromRoster(p.name)}
                    className="absolute right-1 top-1 h-7 w-7 rounded-full bg-rose-600 text-sm font-black hover:bg-rose-500"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardBox>

      <CardBox className="bg-white/10 p-4">
        <h2 className="text-2xl font-black">Game Pool</h2>
        <Pool title="Challenges" items={challenges} onClick={(n) => toggleItem(challenges, setChallenges, n)} onMaxChange={updateChallengeMax} showMax />
        <Pool title="Eliminations" items={elims} onClick={(n) => toggleItem(elims, setElims, n)} />
        <button onClick={() => setBottom3(!bottom3)} className="mt-3 w-full rounded-2xl bg-black/25 p-3 text-left font-black">{bottom3 ? "✅" : "⬛"} Bottom 3 nomination format</button>
        <Button className="mt-4 w-full" size="lg" onClick={startSeason}>Start Season</Button>
      </CardBox>
    </div>
  );
}
function RoundStart({ round, players, start, reset }) { return <CardBox className="bg-white/10 p-4"><div className="flex justify-between"><h2 className="text-3xl font-black">Round {round}</h2><div className="flex gap-2"><Button onClick={start}>Start Challenge</Button><Button variant="outline" onClick={reset}>Menu</Button></div></div><PlayerGrid players={players} /></CardBox>; }
function PlayerGrid({ players }) { return <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11">{players.map((p) => <div key={p.name} className="rounded-3xl bg-black/25 p-2 text-center"><div className="flex justify-center"><Avatar player={p} /></div><div className="mt-2 truncate text-sm font-black">{p.name}</div></div>)}</div>; }

function PokerScreen({ state, advance }) { if (!state) return null; const steps = state.mode === "flop7" ? FLOP7_STEPS : POKER_STEPS; const step = steps[state.stepIndex]; const visible = visibleCountFor(state.mode, step); const visibleCommunity = state.mode === "holdem" ? state.community.slice(0, visible) : []; const winInfo = state.mode === "holdem" ? calculateHoldemWinInfo(state, visibleCommunity) : {}; const showNeeded = state.mode === "holdem" && visibleCommunity.length === 4; return <CardBox className="bg-white/10 p-4"><div className="flex justify-between"><div><h2 className="text-3xl font-black">{state.title}</h2><p>{state.logs?.slice(-1)[0]}</p></div><Button onClick={advance}>{buttonTextFor(state.mode, step)}</Button></div>{state.mode === "holdem" && <div className="my-4 flex gap-2">{state.community.map((c, i) => <PlayingCard key={i} card={i < visible ? c : null} small />)}</div>}<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">{(state.rankings.length ? state.rankings.map((r) => r.player) : state.players).map((p) => { const rank = state.rankings.findIndex((r) => r.player.name === p.name) + 1; const cards = state.mode === "holdem" ? state.hole[p.name] : (state.hole[p.name] || []).slice(0, visible); return <div key={p.name} className="rounded-3xl bg-black/25 p-2 text-center"><div className="flex justify-center"><Avatar player={p} /></div><div className="font-black">{rank ? `#${rank} ` : ""}{p.name}</div><div className="flex flex-wrap justify-center gap-1">{cards.map((c) => <PlayingCard key={c.id} card={c} small />)}</div><div className="text-xs text-emerald-100">{state.rankings.find((r) => r.player.name === p.name)?.name}</div>
              {state.mode === "holdem" && winInfo[p.name] && (
                <div className="mt-2 rounded-2xl bg-black/30 p-2 text-xs font-black">
                  <div className="text-emerald-200">Win: {winInfo[p.name].pct}%</div>
                  {showNeeded && winInfo[p.name].pct < 50 && (
                    <div className="mt-2">
                      <div className="mb-1 text-slate-200">Needs:</div>
                      {neededCardsLabel(winInfo[p.name].needed, winInfo[p.name].pct) === "All other cards" ? (
                        <div className="text-slate-200">All other cards</div>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-1">
                          {(neededCardsLabel(winInfo[p.name].needed, winInfo[p.name].pct) || []).map((card, i) => (
                            <PlayingCard key={`${card.rank}${card.suit}-${i}`} card={card} small />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}</div>; })}</div></CardBox>; }
function WarScreen({ state, advance }) { return <CardBox className="bg-white/10 p-4"><div className="flex justify-between"><h2 className="text-3xl font-black">War</h2><Button onClick={advance}>{state.display === "matchups" ? "Reveal Cards" : "Next Matchups"}</Button></div><WarSection title="Winner Side" pairs={state.winnerPairs} results={state.winnerResults} safe={state.winnerSafe} show={state.display === "results"} /><WarSection title="Loser Side" pairs={state.loserPairs} results={state.loserResults} safe={state.loserSafe} show={state.display === "results"} danger /></CardBox>; }
function WarSection({ title, pairs, results, safe, show, danger }) { if (!pairs?.length && !safe) return null; return <div className="mt-4 rounded-3xl bg-black/20 p-3"><h3 className="text-2xl font-black">{title}</h3>{safe && <div className="rounded-xl bg-white/10 p-2">{safe.name} advances automatically</div>}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{pairs.map((pair, i) => <div key={i} className="grid grid-cols-2 gap-2 rounded-3xl bg-black/25 p-3">{pair.map((p) => { const res = show ? results[i] : null; const card = res?.cards?.[p.name]; const good = res && (danger ? res.loser.name === p.name : res.winner.name === p.name); return <div key={p.name} className={`rounded-2xl p-2 text-center ${good ? "bg-emerald-500/25" : "bg-white/5"}`}><div className="flex justify-center"><Avatar player={p} /></div><div>{p.name}</div><PlayingCard card={card} small /></div>; })}</div>)}</div></div>; }
function BlackjackScreen({ state, advance }) { const btn = state.display === "matchups" ? "Deal Cards" : state.display === "actionSelect" ? "Show Actions" : state.display === "actionResult" ? "Resolve Actions" : state.display === "dealerTurn" ? "Dealer Draw" : state.display === "dealerCompare" ? "Compare Results" : "Process Results"; const renderRound = (round, title, danger = false) => { if (!round) return null; const dealerVisible = round.dealerVisible || 1; const dealerShown = round.dealer.slice(0, dealerVisible); const resolved = state.display === "results" || state.display === "dealerCompare"; return <div className="mt-4 rounded-3xl bg-black/20 p-3"><h3 className="mb-3 text-2xl font-black">{title}</h3><div className="mb-4 rounded-2xl bg-black/30 p-3"><div className="mb-2 text-lg font-black">Dealer Score Showing: {blackjackTotal(dealerShown)}</div><div className="flex flex-wrap gap-2">{round.dealer.map((card, i) => <PlayingCard key={`${title}-dealer-${i}`} card={i < dealerVisible ? card : null} back={i >= dealerVisible} small />)}</div></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">{round.hands.map((hand) => { const green = resolved ? hand.beatsDealer : hand.action === "Stand"; const orange = !resolved && hand.action === "Hit"; const red = hand.bust || (resolved && !green); const color = green ? "bg-emerald-500/25" : orange ? "bg-orange-500/25" : red ? "bg-rose-500/25" : "bg-white/5"; return <div key={hand.player.name} className={`rounded-3xl p-3 text-center ${color}`}><div className="flex justify-center"><Avatar player={hand.player} /></div><div className="mt-2 font-black">{hand.player.name}</div><div className="text-sm">{hand.bust ? "Bust" : blackjackTotal(hand.cards)}</div><div className="mt-2 flex flex-wrap justify-center gap-1">{hand.cards.map((card) => <PlayingCard key={card.id} card={card} small />)}</div><div className="mt-2 text-xs font-black uppercase tracking-wider">{resolved ? (green ? (danger ? "Escapes" : "Advances") : (danger ? "Still In Danger" : "Out")) : hand.action}</div></div>; })}</div></div>; }; return <CardBox className="bg-white/10 p-4"><div className="flex justify-between gap-3"><div><h2 className="text-3xl font-black">Blackjack</h2><p>{state.message}</p></div><Button onClick={advance}>{btn}</Button></div>{state.display === "matchups" && <div className="mt-4 space-y-4"><div className="rounded-3xl bg-black/20 p-3"><h3 className="text-2xl font-black">Winner Side Active</h3>{state.champion ? <p className="mt-2 font-black text-emerald-300">{state.champion.name} is locked as winner.</p> : <PlayerGrid players={state.winnerPool || []} />}</div>{state.firstSplit && <div className="rounded-3xl bg-black/20 p-3"><h3 className="text-2xl font-black">Loser Side Active</h3>{state.lastPlace ? <p className="mt-2 font-black text-rose-300">{state.lastPlace.name} is locked as last place.</p> : <PlayerGrid players={state.loserPool || []} />}</div>}</div>}{state.display !== "matchups" && renderRound(state.winnerRound, "Winner Side")}{state.display !== "matchups" && renderRound(state.loserRound, "Loser Side", true)}</CardBox>; }
function DieFace({ value, small = false }) {
  const dotPositions = {
    1: ["center"],
    2: ["top-left", "bottom-right"],
    3: ["top-left", "center", "bottom-right"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
  };
  const posClasses = {
    "top-left": "left-1.5 top-1.5",
    "top-right": "right-1.5 top-1.5",
    "middle-left": "left-1.5 top-1/2 -translate-y-1/2",
    "middle-right": "right-1.5 top-1/2 -translate-y-1/2",
    "center": "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    "bottom-left": "bottom-1.5 left-1.5",
    "bottom-right": "bottom-1.5 right-1.5",
  };
  const size = small ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const dotSize = small ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <div className={`relative ${size} bg-white shadow-inner ring-1 ring-black/20`}>
      {(dotPositions[value] || []).map((pos, i) => (
        <span key={i} className={`absolute ${dotSize} rounded-full bg-slate-950 ${posClasses[pos]}`} />
      ))}
    </div>
  );
}

function liarsDiceFaceTotals(entries) {
  const totals = Object.fromEntries([1, 2, 3, 4, 5, 6].map((face) => [face, 0]));
  entries.forEach((entry) => entry.dice.forEach((die) => { totals[die] += 1; }));
  return totals;
}

function LiarsDiceScreen({ state, advance }) {
  if (!state) return null;
  const current = state.entries[state.turnIndex];
  const active = state.entries.filter((entry) => entry.diceCount > 0);
  const out = state.entries.filter((entry) => entry.diceCount <= 0);

  const buttonText = state.complete ? "Lock Results" : state.stage === "reveal" ? "Apply Dice Loss" : state.stage === "rolled" ? "Start Bidding" : "Next Bid / Call";

  return (
    <CardBox className="bg-indigo-500/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Liar's Dice</h2>
          <p className="text-slate-200">{state.message}</p>
          <p className="mt-1 text-sm text-slate-400">Round {state.round} • Active: {active.length}</p>
        </div>
        <Button onClick={advance}>{buttonText}</Button>
      </div>

      <div className="mt-4 rounded-3xl bg-black/25 p-3">
        <div className="mb-2 text-center text-xs font-black uppercase tracking-widest text-slate-400">Actual Dice Totals</div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((face) => {
            const totals = liarsDiceFaceTotals(state.entries);
            return (
              <div key={face} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 p-2">
                <DieFace value={face} small />
                <div className="text-2xl font-black">{totals[face]}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-black/25 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Current Turn</div>
          <div className="mt-2 text-2xl font-black">{current?.player.name || "—"}</div>
        </div>
        <div className="rounded-3xl bg-black/25 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Current Bid</div>
          <div className="mt-2 text-2xl font-black">{state.currentBid ? `${state.currentBid.count} dice showing ${state.currentBid.face}` : "No bid yet"}</div>
        </div>
        <div className="rounded-3xl bg-black/25 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">First Out</div>
          <div className="mt-2 text-2xl font-black text-rose-300">{state.firstOut?.name || "—"}</div>
        </div>
      </div>

      {state.stage === "reveal" && (
        <div className="mt-4 rounded-3xl bg-yellow-300/15 p-4 text-center ring-2 ring-yellow-300/40">
          <div className="text-sm font-black uppercase tracking-widest text-yellow-100">Callout Reveal</div>
          <div className="mt-2 text-2xl font-black">{state.caller?.name} called liar</div>
          <div className="mt-1 text-lg">Bid was {state.currentBid.count} dice showing {state.currentBid.face}</div>
          <div className="mt-1 text-lg">Actual count: {state.revealFaceCount}</div>
          <div className="mt-2 text-3xl font-black text-rose-200">{state.roundLoser?.name} loses a die</div>
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-black/20 p-3">
        <h3 className="text-2xl font-black">Players</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          {state.entries.map((entry, index) => {
            const isTurn = index === state.turnIndex && entry.diceCount > 0 && state.stage !== "reveal";
            const isLoser = state.stage === "reveal" && state.roundLoser?.name === entry.player.name;
            return (
              <div key={entry.player.name} className={`rounded-3xl p-3 text-center ${isLoser ? "bg-rose-500/25 ring-2 ring-rose-300/50" : isTurn ? "bg-orange-500/25 ring-2 ring-orange-300/50" : entry.diceCount <= 0 ? "bg-black/20 opacity-50" : "bg-black/25"}`}>
                <div className="flex justify-center"><Avatar player={entry.player} disabled={entry.diceCount <= 0} /></div>
                <div className="mt-2 font-black">{entry.player.name}</div>
                <div className="text-sm text-slate-300">Dice Left: {entry.diceCount}</div>
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {entry.dice.map((die, i) => <DieFace key={i} value={die} />)}
                </div>
                {entry.diceCount <= 0 && <div className="mt-2 font-black text-rose-300">OUT</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-black/25 p-3">
        <div className="text-xs uppercase tracking-widest text-slate-300">Bid History</div>
        <div className="mt-2 max-h-40 overflow-auto text-sm text-slate-200">
          {state.bidHistory.length ? state.bidHistory.slice().reverse().map((entry, i) => (
            <div key={i}>{entry.player.name}: at least {entry.bid.count} dice showing {entry.bid.face}</div>
          )) : "No bids yet."}
        </div>
      </div>

      {out.length > 0 && (
        <div className="mt-4 rounded-3xl bg-black/25 p-3">
          <h3 className="text-xl font-black text-rose-300">Out</h3>
          <div className="mt-2 flex flex-wrap gap-2">{out.map((entry) => <div key={entry.player.name} className="rounded-xl bg-black/30 px-3 py-2 text-sm">{entry.player.name}</div>)}</div>
        </div>
      )}
    </CardBox>
  );
}

function BingoScreen({ state, advance }) {
  if (!state) return null;
  const calledSet = new Set(state.called.map((call) => call.id));
  const active = state.players.filter((entry) => !entry.hasBingo || entry.lockedRound === state.round);
  const safe = state.players.filter((entry) => entry.hasBingo && entry.lockedRound !== state.round);

  const renderBoard = (entry) => (
    <div key={entry.player.name} className={`rounded-3xl p-3 ${entry.hasBingo ? "bg-emerald-500/25 ring-2 ring-emerald-300/50" : "bg-black/25"}`}>
      <div className="flex items-center gap-3">
        <Avatar player={entry.player} size="sm" />
        <div>
          <div className="font-black">{entry.player.name}</div>
          <div className="text-xs uppercase tracking-widest text-slate-300">{entry.hasBingo ? "BINGO" : "Playing"}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {BINGO_COLUMNS.map((col) => <div key={col.letter} className="rounded bg-white/10 py-1 text-center text-xs font-black">{col.letter}</div>)}
        {[0,1,2,3,4].map((row) => BINGO_COLUMNS.map((col, colIndex) => {
          const cell = entry.board[colIndex][row];
          const marked = cell.free || calledSet.has(cell.id);
          return (
            <div key={cell.id} className={`flex h-9 items-center justify-center rounded text-xs font-black ${marked ? "bg-yellow-300 text-slate-950" : "bg-white/10 text-white"}`}>
              {cell.free ? "FREE" : cell.number}
            </div>
          );
        }))}
      </div>
    </div>
  );

  return (
    <CardBox className="bg-white/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Bingo</h2>
          <p className="text-slate-200">{state.message}</p>
          <p className="mt-1 text-sm text-slate-400">Calls: {state.called.length}/75</p>
        </div>
        <Button onClick={advance}>Draw Bingo Call</Button>
      </div>

      <div className="mt-4 rounded-3xl bg-black/25 p-4 text-center">
        <div className="text-sm font-black uppercase tracking-widest text-slate-400">Current Call</div>
        <div className="mt-2 text-5xl font-black text-yellow-300">{state.currentCall ? state.currentCall.id : "—"}</div>
      </div>

      {state.lockedWinner && (
        <div className="mt-4 rounded-3xl bg-yellow-300/15 p-3 text-center font-black text-yellow-100">
          🏆 {state.lockedWinner.name} locked as winner
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-black/20 p-3">
        <h3 className="text-2xl font-black">Still Playing</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {active.map(renderBoard)}
        </div>
      </div>

      {safe.length > 0 && (
        <div className="mt-4 rounded-3xl bg-black/20 p-3">
          <h3 className="text-2xl font-black">Bingo / Locked</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {safe.map(renderBoard)}
          </div>
        </div>
      )}
    </CardBox>
  );
}

function BaccaratScreen({ state, advance }) {
  const buttonText =
    state.complete ? "Lock Results" :
    state.stage === "neutral" ? "Reveal Bets" :
    state.stage === "bets" ? "Deal Cards" :
    state.stage === "playerThirdPending" ? "Draw Player 3rd Cards" :
    state.stage === "bankerThirdPending" ? "Draw Banker 3rd Card" :
    state.stage === "cards" ? "Resolve Bets" :
    "Move Groups";

  const betColor = (bet) => {
    if (state.stage === "neutral") return "bg-black/25";
    if (state.stage === "results") return "";
    if (bet === "player") return "bg-yellow-300/25 ring-2 ring-yellow-300/50";
    if (bet === "banker") return "bg-blue-500/25 ring-2 ring-blue-300/50";
    return "bg-pink-500/25 ring-2 ring-pink-300/50";
  };

  const resultColor = (entry) => {
    if (state.stage !== "results") return betColor(entry.bet);
    return entry.safe ? "bg-emerald-500/25 ring-2 ring-emerald-300/50" : "bg-rose-500/25 ring-2 ring-rose-300/50";
  };

  const showBets = state.stage !== "neutral";
  const showCards = state.stage === "playerThirdPending" || state.stage === "bankerThirdPending" || state.stage === "cards" || state.stage === "results";
  const showBanker = showCards && state.banker.cards.length > 0;

  const renderEntry = (entry, danger = false) => (
    <div key={entry.player.name} className={`rounded-3xl p-3 ${resultColor(entry) || "bg-black/25"}`}>
      <div className="flex justify-center"><Avatar player={entry.player} size="md" /></div>
      <div className="mt-2 text-center text-lg font-black">{entry.player.name}</div>
      {showBets && <div className="text-center text-xs font-black uppercase tracking-widest">Bet: {entry.bet}</div>}
      {showCards && (
        <>
          <div className="mt-2 flex flex-wrap justify-center gap-1">{entry.cards.map((card, i) => <PlayingCard key={i} card={card} small />)}</div>
          <div className="mt-2 text-center text-2xl font-black">{entry.total}</div>
          {state.stage === "playerThirdPending" && entry.needsThird && (
            <div className="mt-2 rounded-xl bg-orange-500/25 px-2 py-1 text-center text-xs font-black uppercase tracking-widest text-orange-100">Needs 3rd Card</div>
          )}
          {state.stage === "bankerThirdPending" && entry.bankerNeedsThirdForEntry && (
            <div className="mt-2 rounded-xl bg-blue-500/25 px-2 py-1 text-center text-xs font-black uppercase tracking-widest text-blue-100">Uses Banker 3rd</div>
          )}
          {state.stage === "results" && entry.compareBankerTotal !== undefined && (
            <div className="mt-1 text-center text-xs text-slate-300">vs Banker {entry.compareBankerTotal}</div>
          )}
        </>
      )}
      {state.stage === "results" && (
        <div className="mt-2 text-center text-sm font-black uppercase tracking-widest">
          {entry.safe ? (danger ? "Escapes" : "Advances") : (danger ? "Still In Danger" : "Out")}
        </div>
      )}
    </div>
  );

  return (
    <CardBox className="bg-red-500/10 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Baccarat</h2>
          <p className="text-slate-300">{state.message}</p>
        </div>
        <Button onClick={advance}>{buttonText}</Button>
      </div>

      {showBanker && (
        <div className="mt-4 rounded-3xl bg-black/25 p-4 text-center">
          <div className="text-sm font-black uppercase tracking-widest text-slate-400">Banker</div>
          <div className="mt-2 flex justify-center gap-2">{state.banker.cards.map((card, i) => <PlayingCard key={i} card={card} small />)}</div>
          <div className="mt-2 text-2xl font-black">{state.banker.total}</div>
          {state.stage === "bankerThirdPending" && state.banker.needsThird && (
            <div className="mt-2 rounded-xl bg-blue-500/25 px-2 py-1 text-xs font-black uppercase tracking-widest text-blue-100">Banker Needs 3rd Card</div>
          )}
        </div>
      )}

      <div className="mt-4 space-y-6">
        <div>
          <h3 className="text-2xl font-black text-emerald-300">Winners Side</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {state.winnersSide.map((entry) => renderEntry(entry, false))}
          </div>
        </div>

        {state.losersSide.length > 0 && (
          <div>
            <h3 className="text-2xl font-black text-rose-300">Losers Side</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {state.losersSide.map((entry) => renderEntry(entry, true))}
            </div>
          </div>
        )}
      </div>
    </CardBox>
  );
}

function PickACardScreen({ state, advance }) {
  if (!state) return null;
  const drawnKeys = new Set(state.drawn.map(cardKey));
  const lastDraw = state.drawn[state.drawn.length - 1];
  const revealEliminated = state.revealEliminated;

  return (
    <CardBox className="bg-white/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Pick A Card</h2>
          <p className="text-slate-200">{state.message}</p>
          <p className="mt-1 text-sm text-slate-400">Active: {state.active.length} • Drawn: {state.drawn.length}/52</p>
        </div>
        <Button onClick={advance}>{state.complete ? "Lock Results" : "Draw Card"}</Button>
      </div>

      {lastDraw ? (
        <div className="mt-4 flex items-center justify-center gap-6 rounded-3xl bg-black/25 p-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-black uppercase tracking-widest text-slate-300">Last Draw</div>
            <PlayingCard card={lastDraw} small />
          </div>

          <div className="h-12 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="text-sm font-black uppercase tracking-widest text-slate-300">Eliminated</div>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {revealEliminated ? (
                <img
                  src={revealEliminated.img}
                  alt={revealEliminated.name}
                  className="h-full w-full object-cover grayscale"
                />
              ) : (
                <div className="text-xl text-slate-600">—</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-center gap-6 rounded-3xl bg-black/25 p-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-black uppercase tracking-widest text-slate-300">Last Draw</div>
            <div className="flex h-12 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-600">—</div>
          </div>

          <div className="h-12 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="text-sm font-black uppercase tracking-widest text-slate-300">Eliminated</div>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <div className="text-xl text-slate-600">—</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-3xl bg-black/25 p-3">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[54px_repeat(13,minmax(58px,1fr))] gap-1">
            <div />
            {RANKS.map((rank) => (
              <div key={rank} className="rounded-xl bg-white/10 p-2 text-center text-sm font-black">{rank}</div>
            ))}

            {SUITS.map((suit) => (
              <React.Fragment key={suit}>
                <div className={`flex items-center justify-center rounded-xl bg-white/90 text-3xl font-black ${SUIT_COLOR_CLASSES[suit] || "text-slate-950"}`}>{suit}</div>
                {RANKS.map((rank) => {
                  const key = `${rank}${suit}`;
                  const occupant = state.placements[key];
                  const drawn = drawnKeys.has(key);
                  const eliminated = occupant && state.eliminated.some((p) => p.name === occupant.name);
                  return (
                    <div key={key} className={`relative flex h-20 items-center justify-center rounded-xl border p-1 ${drawn ? "border-yellow-300 bg-yellow-300/20" : "border-white/10 bg-white/5"}`}>
                      {drawn && <div className="absolute inset-1 flex items-center justify-center opacity-80"><PlayingCard card={{ rank, suit, value: VALUES[rank], id: key }} small /></div>}
                      {occupant && (
                        <img
                          src={occupant.img}
                          alt={occupant.name}
                          className={`absolute inset-0 h-full w-full rounded-xl object-cover ${eliminated ? "grayscale opacity-40" : ""}`}
                          onError={(e) => { e.currentTarget.src = `https://placehold.co/200x200?text=${encodeURIComponent(occupant.name)}`; }}
                        />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {state.eliminated.length > 0 && (
        <div className="mt-4 rounded-3xl bg-black/25 p-3">
          <h3 className="text-2xl font-black">Eliminated</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {state.eliminated.map((player) => (
              <div key={player.name} className="rounded-3xl bg-black/25 p-2 text-center">
                <div className="flex justify-center"><Avatar player={player} disabled /></div>
                <div className="mt-2 truncate text-sm font-black text-slate-400">{player.name}</div>
                {player.eliminatedBy && <div className="mt-1 text-xs text-slate-500">{cardLabel(player.eliminatedBy)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </CardBox>
  );
}

function FlushOutScreen({ state, advance }) {
  if (!state) return null;
  const buttonText = state.step === "draw" ? "Draw Cards" : "Sort / Check Flushes";
  const active = state.players.filter((entry) => entry.status !== "safe" || entry.lockedRound === state.round);
  const safe = state.players.filter((entry) => entry.status === "safe" && entry.lockedRound !== state.round);

  const renderEntry = (entry) => (
    <div key={entry.player.name} className={`rounded-3xl p-3 text-center ${entry.status === "safe" ? "bg-emerald-500/25 ring-2 ring-emerald-300/50" : "bg-black/25"}`}>
      <div className="flex justify-center"><Avatar player={entry.player} /></div>
      <div className="mt-2 font-black">{entry.player.name}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-slate-300">
        Best: {entry.best.suit || "-"} {entry.best.count}/5
      </div>
      {entry.status === "safe" && <div className="mt-1 text-sm font-black text-emerald-200">SAFE</div>}
      <div className="mt-3 flex flex-wrap justify-center gap-1">
        {entry.cards.map((card) => <PlayingCard key={card.id} card={card} small />)}
      </div>
    </div>
  );

  return (
    <CardBox className="bg-white/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Flush Out</h2>
          <p className="text-slate-200">{state.message}</p>
          <p className="mt-1 text-sm text-slate-400">{state.useClassicSuits ? `Tiebreaker deck: ${SUITS.join(" ")}` : `Expanded suits: ${FLUSH_OUT_SUITS.join(" ")}`}</p>
        </div>
        <Button onClick={advance}>{buttonText}</Button>
      </div>

      {state.lockedWinner && (
        <div className="mt-4 rounded-3xl bg-yellow-300/15 p-3 text-center font-black text-yellow-100">
          🏆 {state.lockedWinner.name} locked as winner
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-black/20 p-3">
        <h3 className="text-2xl font-black">Still Drawing</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {active.map(renderEntry)}
        </div>
      </div>

      {safe.length > 0 && (
        <div className="mt-4 rounded-3xl bg-black/20 p-3">
          <h3 className="text-2xl font-black">Safe / Locked</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {safe.map(renderEntry)}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-3xl bg-black/25 p-3">
        <div className="text-xs uppercase tracking-widest text-slate-300">Log</div>
        <div className="mt-2 max-h-32 overflow-auto text-sm text-slate-200">
          {state.logs.length ? state.logs.slice().reverse().map((log, i) => <div key={i}>{log}</div>) : "No cards drawn yet."}
        </div>
      </div>
    </CardBox>
  );
}

function Nomination({ result, eligible, sendIn }) { return <CardBox className="bg-amber-500/15 p-4"><h2 className="text-3xl font-black">{result.winner.name} Won {result.name}</h2><p>{result.lastPlace.name} is automatically in elimination.</p><Button className="mt-3" variant="gold" onClick={() => sendIn(pickRandom(eligible))}>🎲 Random Pick</Button><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">{eligible.map((player) => <button key={player.name} onClick={() => sendIn(player)} className="rounded-3xl bg-black/25 p-2 transition hover:bg-white/10"><div className="flex justify-center"><Avatar player={player} /></div><div className="font-black">{player.name}</div></button>)}</div></CardBox>; }
function WarElimScreen({ state, advance }) {
  const cardA = state.lastFlip?.cards?.[state.playerA.name];
  const cardB = state.lastFlip?.cards?.[state.playerB.name];

  return (
    <CardBox className="bg-rose-500/15 p-4 text-center">
      <h2 className="text-3xl font-black">War Elimination</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ElimPlayer p={state.playerA} score={state.scoreA} card={cardA} winner={state.lastFlip?.winner?.name === state.playerA.name} />
        <ElimPlayer p={state.playerB} score={state.scoreB} card={cardB} winner={state.lastFlip?.winner?.name === state.playerB.name} />
      </div>
      {state.lastFlip && <div className="mt-4 rounded-3xl bg-black/25 p-3">Last flip winner: {state.lastFlip.winner.name}</div>}
      <Button className="mt-4" onClick={advance}>{state.complete ? "Lock Result" : "Reveal War Flip"}</Button>
    </CardBox>
  );
}
function ElimPlayer({ p, score, card, winner }) {
  return (
    <div className={`rounded-3xl p-4 ${winner ? "bg-emerald-500/25" : "bg-black/25"}`}>
      <div className="flex justify-center"><Avatar player={p} size="lg" /></div>
      <div className="text-2xl font-black">{p.name}</div>
      <div className="text-5xl font-black">{score}</div>
      <div className="mt-3 flex justify-center"><PlayingCard card={card} small /></div>
    </div>
  );
}

function BaccaratElimScreen({ state, advance }) {
  const buttonText = state.complete ? "Lock Result" : state.stage === "deal" ? "Deal Cards" : state.stage === "thirdPending" ? "Draw Third Cards" : "Compare Totals";

  return (
    <CardBox className="bg-red-500/15 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Baccarat Elimination</h2>
          <p className="text-slate-200">{state.message}</p>
        </div>
        <Button onClick={advance}>{buttonText}</Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {state.hands.map((hand) => {
          const isWinner = state.complete && state.winner?.name === hand.player.name;
          const isOut = state.complete && state.eliminated?.name === hand.player.name;
          const needs = state.stage === "thirdPending" && hand.needsThird;
          return (
            <div key={hand.player.name} className={`rounded-[2rem] p-4 text-center ${isWinner ? "bg-emerald-500/25 ring-2 ring-emerald-300/50" : isOut ? "bg-rose-500/25 ring-2 ring-rose-300/50" : needs ? "bg-orange-500/25 ring-2 ring-orange-300/50" : "bg-black/25"}`}>
              <div className="flex justify-center"><Avatar player={hand.player} size="lg" /></div>
              <div className="mt-2 text-2xl font-black">{hand.player.name}</div>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {hand.cards.map((card, i) => <PlayingCard key={i} card={card} small />)}
              </div>
              <div className="mt-3 text-5xl font-black">{hand.cards.length ? hand.total : "-"}</div>
              <div className="mt-2 text-sm font-black uppercase tracking-widest">
                {isWinner ? "SAFE" : isOut ? "ELIMINATED" : needs ? "Needs 3rd Card" : "Waiting"}
              </div>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
}

function BlackjackElimScreen({ state, advance }) { const btn = state.display === "deal" ? "Deal" : state.display === "actionSelect" ? "Show Actions" : state.display === "actionResult" ? "Resolve" : state.display === "compare" ? "Compare" : "Lock Result"; return <CardBox className="bg-rose-500/15 p-4"><div className="flex justify-between gap-3"><h2 className="text-3xl font-black">Blackjack Elimination</h2><Button onClick={advance}>{btn}</Button></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{(state.hand?.hands || [{ player: state.playerA, cards: [], action: "Waiting" }, { player: state.playerB, cards: [], action: "Waiting" }]).map((hand) => <div key={hand.player.name} className="rounded-3xl bg-black/25 p-4 text-center"><div className="flex justify-center"><Avatar player={hand.player} size="lg" /></div><div className="text-2xl font-black">{hand.player.name}</div><div className="text-xl font-black">{hand.cards?.length ? blackjackTotal(hand.cards) > 21 ? "Bust" : blackjackTotal(hand.cards) : "-"}</div><div className="mt-2 flex flex-wrap justify-center gap-1">{hand.cards?.map((card) => <PlayingCard key={card.id} card={card} small />)}</div><div className="mt-2 text-sm font-black">{hand.action}</div></div>)}</div></CardBox>; }
function ThirtyOneScreen({ state, advance }) { return <CardBox className="bg-purple-500/15 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-3xl font-black">31 Elimination</h2><p className="text-slate-200">{state.message}</p></div><Button onClick={advance}>{state.complete ? "Lock Result" : "Advance 31"}</Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><ThirtyOnePlayer player={state.playerA} cards={state.hands[state.playerA.name] || []} score={state.scores[state.playerA.name]} active={state.actor === "both" || state.actor?.name === state.playerA.name} winner={state.winner} eliminated={state.eliminated} /><ThirtyOnePlayer player={state.playerB} cards={state.hands[state.playerB.name] || []} score={state.scores[state.playerB.name]} active={state.actor === "both" || state.actor?.name === state.playerB.name} winner={state.winner} eliminated={state.eliminated} /></div><div className="mt-4 rounded-3xl bg-black/25 p-3"><div className="text-xs uppercase tracking-widest text-slate-300">Log</div><div className="mt-2 max-h-36 overflow-auto text-sm text-slate-200">{state.history.length ? state.history.slice().reverse().map((entry, i) => <div key={i}>{entry}</div>) : "No moves yet."}</div></div></CardBox>; }
function ThirtyOnePlayer({ player, cards, score, active, winner, eliminated }) { const isWinner = winner?.name === player.name; const isOut = eliminated?.name === player.name; const bust = score > 31; const exact = score === 31; const color = isWinner || exact ? "bg-emerald-500/25 ring-2 ring-emerald-300/60" : isOut || bust ? "bg-rose-500/25" : active ? "bg-orange-500/25 ring-2 ring-orange-300/50" : "bg-black/25"; return <div className={`rounded-[2rem] p-4 text-center ${color}`}><div className="flex justify-center"><Avatar player={player} size="lg" /></div><div className="mt-2 text-2xl font-black">{player.name}</div><div className="mt-1 text-sm uppercase tracking-widest text-slate-300">Score</div><div className="text-5xl font-black">{bust ? "Bust" : score}</div><div className="mt-3 flex flex-wrap justify-center gap-1">{cards.map((card, i) => <PlayingCard key={card.id || i} card={card} small />)}</div><div className="mt-3 font-black">{isWinner ? "Wins" : isOut ? "Eliminated" : active ? "Must Hit" : exact ? "31" : "Waiting"}</div></div>; }
function FlushOutElimScreen({ state, advance }) {
  return (
    <CardBox className="bg-purple-500/15 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black">Flush Out Elimination</h2>
          <p>{state.message}</p>
        </div>
        <Button onClick={advance}>{state.complete ? "Lock Result" : state.tiePending ? "Reset Round" : "Draw Cards"}</Button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {state.players.map((entry) => {
          const done = state.complete && state.winner?.name === entry.player.name;
          const out = state.complete && state.eliminated?.name === entry.player.name;
          return (
            <div key={entry.player.name} className={`rounded-[2rem] p-4 text-center ${done ? "bg-emerald-500/25" : out ? "bg-rose-500/25" : "bg-black/25"}`}>
              <div className="flex justify-center"><Avatar player={entry.player} size="lg" /></div>
              <div className="mt-2 text-2xl font-black">{entry.player.name}</div>
              <div className="mt-1 text-sm uppercase tracking-widest text-slate-300">
                Best: {entry.best.suit || "-"} {entry.best.count}/5
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {SUITS.map((suit) => {
                  const counts = flushOutSuitCounts(entry.cards);
                  return <div key={suit} className={`rounded-2xl bg-white/90 px-3 py-2 text-lg font-black shadow ${SUIT_COLOR_CLASSES[suit] || "text-slate-950"}`}><span className="text-2xl">{suit}</span> {counts[suit]}/5</div>;
                })}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {entry.cards.map((card) => <PlayingCard key={card.id} card={card} small />)}
              </div>
              <div className="mt-3 font-black">{done ? "SAFE" : out ? "ELIMINATED" : "DRAWING"}</div>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
}

function HorseScreen({ state, advance }) { const spaces = [0, 1, 2, 3, 4, 5, 6, 7]; return <CardBox className="bg-amber-500/10 p-4"><div className="flex justify-between gap-3"><div><h2 className="text-3xl font-black">Horse Race Elimination</h2><p>{state.message}</p></div><Button variant="gold" onClick={advance}>{state.display === "complete" ? "Lock Result" : "Draw Card"}</Button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-3xl bg-black/25 p-3 text-center"><div className="flex justify-center"><Avatar player={state.playerA} /></div><div>{state.playerA.name}: {state.bets[state.playerA.name].join(" ")}</div></div><div className="rounded-3xl bg-black/25 p-3 text-center"><div className="flex justify-center"><Avatar player={state.playerB} /></div><div>{state.playerB.name}: {state.bets[state.playerB.name].join(" ")}</div></div></div><div className="mt-4 overflow-x-auto rounded-3xl bg-black/25 p-3"><div className="min-w-[760px] space-y-2">{state.aceCards.map((ace) => <div key={ace.id} className="grid grid-cols-9 gap-2"><PlayingCard card={ace} small />{spaces.map((_, i) => <div key={i} className={`relative flex h-14 items-center justify-center rounded-xl border ${i === 7 ? "border-yellow-300 bg-yellow-300/20" : "border-white/10 bg-white/5"}`}>{i === 7 && <span className="absolute -top-2 rounded-full bg-yellow-300 px-2 text-[9px] font-black text-slate-950">FINISH</span>}{state.positions[ace.suit] === i && <span className="text-4xl font-black">{ace.suit}</span>}</div>)}</div>)}<div className="grid grid-cols-9 gap-2 pt-4"><div className="text-xs font-black">Trap</div>{state.trapCards.map((card) => <PlayingCard key={card.id} card={card.revealed ? card : null} back={!card.revealed} small />)}<div /><div /></div></div></div>{state.currentDraw && <div className="mt-4 flex justify-center"><PlayingCard card={state.currentDraw} /></div>}{state.display === "complete" && <div className="mt-4 rounded-3xl bg-emerald-500/20 p-4 text-center text-3xl font-black">{state.winner.name} survives — {state.winningSuit}</div>}</CardBox>; }
function EliminationResultScreen({ result, advance }) { return <CardBox className="bg-emerald-500/15 p-6 text-center"><h2 className="text-4xl font-black">{result.game} Result</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-[2rem] bg-emerald-500/25 p-4"><div className="text-sm uppercase tracking-widest text-emerald-100">Winner</div><div className="mt-2 flex justify-center"><Avatar player={result.winner} size="lg" /></div><div className="mt-2 text-3xl font-black">{result.winner.name}</div></div><div className="rounded-[2rem] bg-rose-500/25 p-4"><div className="text-sm uppercase tracking-widest text-rose-100">Eliminated</div><div className="mt-2 flex justify-center"><Avatar player={result.eliminated} size="lg" /></div><div className="mt-2 text-3xl font-black">{result.eliminated.name}</div></div></div><Button className="mt-6" size="lg" onClick={advance}>Continue</Button></CardBox>; }
function Finale({ players, reset }) { const winner = players[0]; return <CardBox className="bg-yellow-400/20 p-8 text-center"><h2 className="text-5xl font-black">{winner?.name} Wins</h2>{winner && <div className="mt-4 flex justify-center"><Avatar player={winner} size="lg" /></div>}<Button className="mt-6" onClick={reset}>Back to Menu</Button></CardBox>; }
