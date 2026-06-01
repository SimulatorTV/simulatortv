// @ts-nocheck

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "../Navbar";


function Card({ className = "", children }: any) {
  return <div className={className}>{children}</div>;
}

function CardHeader({ className = "", children }: any) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }: any) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }: any) {
  return <div className={`text-2xl font-bold ${className}`}>{children}</div>;
}

function Button({
  className = "",
  variant,
  disabled,
  onClick,
  children,
  type = "button",
}: any) {
  const variantClass =
    variant === "secondary"
      ? "bg-gray-200 hover:bg-gray-300 text-black"
      : "bg-blue-600 hover:bg-blue-500 text-white";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClass} disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 font-bold ${className}`}
    >
      {children}
    </button>
  );
}

function ScrollArea({ className = "", children }: any) {
  return <div className={`overflow-auto ${className}`}>{children}</div>;
}

function Select({ value, onValueChange, children }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className="bg-black/30 border border-white/15 text-white rounded-xl px-3 py-2"
    >
      {children}
    </select>
  );
}

function SelectItem({ value, disabled, children }: any) {
  return (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );
}


const TWIST_OPTIONS = [
  { id: "normal", label: "Normal" },
  { id: "battle_of_the_block", label: "Battle of the Block" },
  { id: "three_nominees", label: "3 Nominees" },
  { id: "forced_veto", label: "Forced Veto" },
  { id: "chain_of_safety", label: "Chain of Safety" },
  { id: "survivor", label: "Survivor" },
  { id: "executioner", label: "Executioner" },
  { id: "battle_back", label: "Battle Back" },
  { id: "random_elimination", label: "Random Elimination" },
  { id: "majority_rules", label: "Majority Rules" },
  { id: "bbuk", label: "BBUK" },
  { id: "bbau", label: "BBAU" },
  { id: "split_house", label: "Split House" },
  { id: "split_house_duel", label: "Split House: Duel" },
  { id: "continued_split_house", label: "Continued Split House" },
  { id: "continued_split_house_duel", label: "Split House: Duel Cont." },
  { id: "vote_to_save", label: "Vote to Save" },
  { id: "placeholder-advantage", label: "Advantage Placeholder" },
  { id: "placeholder-format", label: "Format Twist Placeholder" },
];

const NORMAL_PHASES = [
  "cast",
  "hoh",
  "nominations",
  "vetoPlayers",
  "vetoWinner",
  "vetoCeremony",
  "voteReveal",
  "evicted",
];

const BOB_PHASES = [
  "cast",
  "doubleHoh",
  "doubleNoms",
  "battleMatch",
  "battleResult",
  "postBattle",
  "vetoPlayers",
  "vetoWinner",
  "vetoCeremony",
  "voteReveal",
  "evicted",
];

const THREE_NOMINEE_PHASES = [
  "cast",
  "hoh",
  "nominations",
  "vetoPlayers",
  "vetoWinner",
  "vetoCeremony",
  "voteReveal",
  "evicted",
];

const CHAIN_OF_SAFETY_PHASES = ["cast", "chainReveal", "voteReveal", "evicted"];
const SURVIVOR_PHASES = ["cast", "survivorImmunity", "voteReveal", "evicted"];
const EXECUTIONER_PHASES = ["cast", "executionerWinner", "voteReveal", "evicted"];
const BATTLE_BACK_PHASES = ["cast", "battleBackPlayers", "battleBackWinner", "battleBackReturn"];
const RANDOM_ELIMINATION_PHASES = ["cast", "randomEliminationReveal", "evicted"];
const MAJORITY_RULES_PHASES = ["cast", "majorityCompetition", "majorityNomination", "majorityVoteReveal", "majoritySafeLoop", "evicted", "majorityResetCast"];

const BBUK_PHASES = ["cast", "bbukNominations", "bbukNominationResults", "voteReveal", "evicted"];
const BBAU_PHASES = ["cast", "hoh", "nominations", "voteReveal", "evicted"];
const SPLIT_HOUSE_PHASES = [
  "cast",
  "splitGroups",
  "splitHoh",
  "splitNominations",
  "splitVetoPlayers",
  "splitVetoWinner",
  "splitVetoCeremony",
  "splitVoteReveal",
  "splitEvicted",
];
const SPLIT_HOUSE_DUEL_PHASES = [
  "cast",
  "splitGroups",
  "splitDuel",
  "hoh",
  "nominations",
  "vetoPlayers",
  "vetoWinner",
  "vetoCeremony",
  "voteReveal",
  "evicted",
];
const FINAL3_PHASES = ["final3Competitions", "finalHohVote", "juryVoteReveal", "winner"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample(arr, count, exclude = []) {
  const excluded = new Set(exclude.map((x) => (typeof x === "string" ? x : x.name)));
  const pool = arr.filter((item) => !excluded.has(typeof item === "string" ? item : item.name));
  return shuffle(pool).slice(0, Math.max(0, Math.min(count, pool.length)));
}

function pickOne(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeekPlan(playerCount, weekTwists = {}) {
  const plan = [];
  if (playerCount < 4) return plan;

  let remainingPlayers = playerCount;
  let week = 1;
  while (remainingPlayers > 3) {
    const twistId = weekTwists[week] || "normal";
    plan.push({ week, type: "normal", twistId });
    if (twistId === "split_house" || twistId === "continued_split_house" || twistId === "vote_to_save") {
      remainingPlayers -= 2;
    } else if (twistId === "battle_back") {
      remainingPlayers += 1;
    } else {
      remainingPlayers -= 1;
    }
    week += 1;
    if (week > 200) break;
  }

  return plan;
}

function getTopNomineeGridClass(count) {
  if (count >= 4) return "grid-cols-4";
  if (count === 3) return "grid-cols-3";
  return "grid-cols-2";
}

function pickEvictedFromNominees(finalNomineePlayers, votingTargets) {
  const counts = finalNomineePlayers.map((nominee) =>
    votingTargets.reduce((sum, target) => sum + (target === nominee.name ? 1 : 0), 0)
  );

  let maxVotes = -1;
  let tied = [];
  finalNomineePlayers.forEach((nominee, index) => {
    const count = counts[index] ?? 0;
    if (count > maxVotes) {
      maxVotes = count;
      tied = [nominee];
    } else if (count === maxVotes) {
      tied.push(nominee);
    }
  });

  return pickOne(tied);
}

function buildStandardWeekResult({
  type,
  weekNumber,
  twistId,
  castGrid,
  hohPlayer,
  nomineePlayers,
  vetoExtraPlayers,
  vetoWinner,
  vetoUsed,
  vetoSavedPlayer,
  vetoReplacementPlayer,
  finalNomineePlayers,
  votingPlayers,
  votingTargets,
  survivors,
  extra = {},
}) {
  return {
    type,
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    nomineePlayers,
    vetoExtraPlayers,
    vetoWinner,
    vetoUsed,
    vetoSavedPlayer,
    vetoReplacementPlayer,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer: castGrid.find((player) => !survivors.some((survivor) => survivor.name === player.name)) ?? null,
    survivors,
    lastHohName: hohPlayer?.name ?? null,
    ...extra,
  };
}

function computeStandardWeek({
  type,
  weekNumber,
  twistId,
  castGrid,
  hohPlayer,
  initialNominees,
  vetoExtraCount,
  outsideWinnerUseChance,
  outsideWinnerDisabled,
  extra = {},
}) {
  const nomineePlayers = [...initialNominees];
  const vetoExtraPlayers = sample(castGrid, vetoExtraCount, [hohPlayer, ...nomineePlayers]);
  const vetoCompetitionPlayers = [hohPlayer, ...nomineePlayers, ...vetoExtraPlayers].filter(Boolean);
  const vetoWinner = pickOne(vetoCompetitionPlayers);

  let vetoUsed = false;
  let vetoSavedPlayer = null;
  let vetoReplacementPlayer = null;

  if (nomineePlayers.length > 0) {
    const vetoWinnerIsNominee = nomineePlayers.some((n) => n.name === vetoWinner?.name);

    if (vetoWinnerIsNominee) {
      vetoSavedPlayer = vetoWinner;
      vetoReplacementPlayer = pickOne(
        sample(castGrid, 1, [hohPlayer, vetoWinner, vetoSavedPlayer, ...nomineePlayers])
      );
      vetoUsed = Boolean(vetoSavedPlayer && vetoReplacementPlayer);
    } else if (!outsideWinnerDisabled && Math.random() < outsideWinnerUseChance) {
      vetoSavedPlayer = pickOne(nomineePlayers);
      vetoReplacementPlayer = pickOne(
        sample(castGrid, 1, [hohPlayer, vetoWinner, vetoSavedPlayer, ...nomineePlayers])
      );
      vetoUsed = Boolean(vetoSavedPlayer && vetoReplacementPlayer);
    }
  }

  const finalNomineePlayers = vetoUsed
    ? [...nomineePlayers.filter((n) => n.name !== vetoSavedPlayer?.name), vetoReplacementPlayer].filter(Boolean)
    : nomineePlayers;

  const votingPlayers = castGrid.filter(
    (player) => player.name !== hohPlayer?.name && !finalNomineePlayers.some((n) => n.name === player.name)
  );
  const votingTargets = votingPlayers.map(() => pickOne(finalNomineePlayers)?.name ?? null);
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return buildStandardWeekResult({
    type,
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    nomineePlayers,
    vetoExtraPlayers,
    vetoWinner,
    vetoUsed,
    vetoSavedPlayer,
    vetoReplacementPlayer,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    survivors,
    extra,
  });
}

function generateNormalRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((player) => player.name !== lastHohName);
  const hohPlayer = pickOne(hohPool.length ? hohPool : activePlayers);
  const nomineePlayers = sample(activePlayers, 2, [hohPlayer]);

  return computeStandardWeek({
    type: "normal",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    initialNominees: nomineePlayers,
    vetoExtraCount: 3,
    outsideWinnerUseChance: 0.65,
    outsideWinnerDisabled: activePlayers.length === 4,
  });
}

function generateBattleOfTheBlockRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((player) => player.name !== lastHohName);
  const hohPlayers = sample(hohPool.length >= 2 ? hohPool : activePlayers, 2);
  const hohA = hohPlayers[0] ?? null;
  const hohB = hohPlayers[1] ?? null;
  const pairA = sample(activePlayers, 2, hohPlayers);
  const pairB = sample(activePlayers, 2, [...hohPlayers, ...pairA]);
  const winningPair = Math.random() < 0.5 ? pairA : pairB;
  const losingPair = winningPair === pairA ? pairB : pairA;
  const dethronedHoh = winningPair === pairA ? hohA : hohB;
  const survivingHoh = winningPair === pairA ? hohB : hohA;

  return computeStandardWeek({
    type: "battle_of_the_block",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer: survivingHoh,
    initialNominees: losingPair,
    vetoExtraCount: 3,
    outsideWinnerUseChance: 0.65,
    outsideWinnerDisabled: activePlayers.length === 4,
    extra: {
      hohPlayers,
      dethronedHoh,
      survivingHoh,
      pairA,
      pairB,
      winningPair,
      losingPair,
    },
  });
}

function generateThreeNomineeRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((player) => player.name !== lastHohName);
  const hohPlayer = pickOne(hohPool.length ? hohPool : activePlayers);
  const nomineePlayers = sample(activePlayers, 3, [hohPlayer]);

  return computeStandardWeek({
    type: "three_nominees",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    initialNominees: nomineePlayers,
    vetoExtraCount: 2,
    outsideWinnerUseChance: 0.65,
    outsideWinnerDisabled: false,
  });
}



function generateForcedVetoRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((p) => p.name !== lastHohName);
  const hohPlayer = pickOne(hohPool.length ? hohPool : activePlayers);
  const nomineePlayers = sample(activePlayers, 3, [hohPlayer]);

  const vetoExtraPlayers = sample(activePlayers, 2, [hohPlayer, ...nomineePlayers]);
  const vetoCompetitionPlayers = [hohPlayer, ...nomineePlayers, ...vetoExtraPlayers].filter(Boolean);
  const vetoWinner = pickOne(vetoCompetitionPlayers);

  // MUST use veto, NO replacement
  let vetoSavedPlayer = nomineePlayers.find(n => n.name === vetoWinner?.name) || pickOne(nomineePlayers);
  const vetoUsed = true;

  const finalNomineePlayers = nomineePlayers.filter(n => n.name !== vetoSavedPlayer?.name);

  const votingPlayers = castGrid.filter(
    (p) => p.name !== hohPlayer?.name && !finalNomineePlayers.some(n => n.name === p.name)
  );

  const votingTargets = votingPlayers.map(() => pickOne(finalNomineePlayers)?.name || null);
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter(p => p.name !== evictedPlayer?.name);

  return buildStandardWeekResult({
    type: "forced_veto",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    nomineePlayers,
    vetoExtraPlayers,
    vetoWinner,
    vetoUsed,
    vetoSavedPlayer,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    survivors,
  });
}

function generateChainOfSafetyRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const remaining = shuffle(activePlayers);
  const safeOrder = [];

  if (remaining.length > 0) {
    safeOrder.push(remaining.shift());
  }
  while (remaining.length > 2) {
    safeOrder.push(remaining.shift());
  }

  const nomineePlayers = [...remaining];
  const finalNomineePlayers = [...nomineePlayers];
  const votingPlayers = [...safeOrder];
  const votingTargets = votingPlayers.map(() => pickOne(finalNomineePlayers)?.name ?? null);
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "chain_of_safety",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer: null,
    nomineePlayers,
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    survivors,
    lastHohName: null,
    safeOrder,
  };
}

function generateSurvivorRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const immunityWinner = pickOne(activePlayers);
  const finalNomineePlayers = activePlayers.filter((player) => player.name !== immunityWinner?.name);
  const votingPlayers = [...activePlayers];
  const votingTargets = votingPlayers.map((voter) => {
    const targets = finalNomineePlayers.filter((player) => player.name !== voter.name);
    return pickOne(targets)?.name ?? null;
  });
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "survivor",
    weekNumber,
    twistId,
    castGrid,
    immunityWinner,
    hohPlayer: null,
    nomineePlayers: finalNomineePlayers,
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    survivors,
    lastHohName: null,
  };
}

function generateExecutionerRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const executionerWinner = pickOne(activePlayers);
  const finalNomineePlayers = activePlayers.filter((player) => player.name !== executionerWinner?.name);
  const votingPlayers = executionerWinner ? [executionerWinner] : [];
  const votingTargets = [pickOne(finalNomineePlayers)?.name ?? null];
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "executioner",
    weekNumber,
    twistId,
    castGrid,
    executionerWinner,
    hohPlayer: null,
    nomineePlayers: finalNomineePlayers,
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    survivors,
    lastHohName: null,
  };
}



function generateBbukRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const nominationVotes = castGrid.map((voter) => ({
    voter,
    targets: sample(castGrid, 2, [voter]),
  }));

  const nominationCounts = Object.fromEntries(castGrid.map((player) => [player.name, 0]));
  nominationVotes.forEach(({ targets }) => {
    targets.forEach((target) => {
      nominationCounts[target.name] += 1;
    });
  });

  const sortedCounts = castGrid
    .map((player) => ({ player, count: nominationCounts[player.name] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const secondHighest = sortedCounts[Math.min(1, Math.max(0, sortedCounts.length - 1))]?.count ?? 0;
  const nomineePlayers = sortedCounts.filter((entry) => entry.count >= secondHighest).map((entry) => entry.player);
  const finalNomineePlayers = [...nomineePlayers];
  const votingPlayers = castGrid.filter(
    (player) => !finalNomineePlayers.some((nominee) => nominee.name === player.name)
  );
  const votingTargets = votingPlayers.map(() => pickOne(finalNomineePlayers)?.name ?? null);
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "bbuk",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer: null,
    nomineePlayers,
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    evictedPlayers: evictedPlayer ? [evictedPlayer] : [],
    survivors,
    lastHohName: null,
    nominationVotes,
    nominationCounts,
  };
}

function generateBbAuRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((player) => player.name !== lastHohName);
  const hohPlayer = pickOne(hohPool.length ? hohPool : activePlayers);
  const nomineePlayers = sample(activePlayers, 3, [hohPlayer]);
  const finalNomineePlayers = [...nomineePlayers];
  const votingPlayers = [...castGrid];
  const votingTargets = votingPlayers.map((voter) => {
    const targets = finalNomineePlayers.filter((nominee) => nominee.name !== voter.name);
    return pickOne(targets.length ? targets : finalNomineePlayers)?.name ?? null;
  });
  const evictedPlayer = pickEvictedFromNominees(finalNomineePlayers, votingTargets);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "bbau",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    nomineePlayers,
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    survivors,
    lastHohName: hohPlayer?.name ?? null,
  };
}

function generateVoteToSaveRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const hohPool = activePlayers.filter((player) => player.name !== lastHohName);
  const hohPlayer = pickOne(hohPool.length ? hohPool : activePlayers);
  const nomineePlayers = sample(activePlayers, 3, [hohPlayer]);
  const vetoExtraPlayers = sample(activePlayers, 2, [hohPlayer, ...nomineePlayers]);
  const vetoCompetitionPlayers = [hohPlayer, ...nomineePlayers, ...vetoExtraPlayers].filter(Boolean);
  const vetoWinner = pickOne(vetoCompetitionPlayers);

  let vetoUsed = false;
  let vetoSavedPlayer = null;
  let vetoReplacementPlayer = null;

  if (nomineePlayers.length === 3 && activePlayers.length >= 5) {
    const vetoWinnerIsNominee = nomineePlayers.some((n) => n.name === vetoWinner?.name);

    if (vetoWinnerIsNominee) {
      vetoSavedPlayer = vetoWinner;
      vetoReplacementPlayer = pickOne(
        sample(castGrid, 1, [hohPlayer, vetoWinner, vetoSavedPlayer, ...nomineePlayers])
      );
      vetoUsed = Boolean(vetoSavedPlayer && vetoReplacementPlayer);
    } else if (activePlayers.length >= 7 && Math.random() < 0.65) {
      vetoSavedPlayer = pickOne(nomineePlayers);
      vetoReplacementPlayer = pickOne(
        sample(castGrid, 1, [hohPlayer, vetoWinner, vetoSavedPlayer, ...nomineePlayers])
      );
      vetoUsed = Boolean(vetoSavedPlayer && vetoReplacementPlayer);
    }
  }

  const finalNomineePlayers = vetoUsed
    ? [...nomineePlayers.filter((n) => n.name !== vetoSavedPlayer?.name), vetoReplacementPlayer].filter(Boolean)
    : nomineePlayers;

  const votingPlayers = castGrid.filter(
    (player) => player.name !== hohPlayer?.name && !finalNomineePlayers.some((n) => n.name === player.name)
  );
  const votingTargets = votingPlayers.map(() => pickOne(finalNomineePlayers)?.name ?? null);

  const saveCounts = finalNomineePlayers.map((nominee) =>
    votingTargets.reduce((sum, target) => sum + (target === nominee.name ? 1 : 0), 0)
  );
  const maxSaveVotes = Math.max(...saveCounts, 0);
  const safeCandidates = finalNomineePlayers.filter((_, index) => saveCounts[index] === maxSaveVotes);
  const safePlayer = pickOne(safeCandidates);
  const evictedPlayers = finalNomineePlayers.filter((player) => player.name !== safePlayer?.name);
  const evictedPlayer = evictedPlayers[0] ?? null;
  const survivors = castGrid.filter((player) => !evictedPlayers.some((evicted) => evicted.name === player.name));

  return {
    type: "vote_to_save",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer,
    nomineePlayers,
    vetoExtraPlayers,
    vetoWinner,
    vetoUsed,
    vetoSavedPlayer,
    vetoReplacementPlayer,
    finalNomineePlayers,
    votingPlayers,
    votingTargets,
    evictedPlayer,
    evictedPlayers,
    safePlayer,
    survivors,
    lastHohName: hohPlayer?.name ?? null,
  };
}

function generateSplitHouseRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const shuffled = shuffle(activePlayers);
  const splitIndex = Math.ceil(shuffled.length / 2);
  const groupA = shuffled.slice(0, splitIndex);
  const groupB = shuffled.slice(splitIndex);

  const sideA = generateNormalRound(groupA, weekNumber, twistId, lastHohName);
  const sideB = generateNormalRound(groupB, weekNumber, twistId, lastHohName);
  const survivors = [...sideA.survivors, ...sideB.survivors];

  return {
    type: "split_house",
    weekNumber,
    twistId,
    castGrid,
    groupA,
    groupB,
    sideA,
    sideB,
    hohPlayer: null,
    nomineePlayers: [],
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers: [],
    votingPlayers: [],
    votingTargets: [],
    evictedPlayer: null,
    survivors,
    lastHohName: null,
  };
}

function generateSplitHouseDuelRound(activePlayers, weekNumber, twistId, lastHohName) {
  const castGrid = [...activePlayers];
  const shuffled = shuffle(activePlayers);
  const splitIndex = Math.ceil(shuffled.length / 2);
  const groupA = shuffled.slice(0, splitIndex);
  const groupB = shuffled.slice(splitIndex);
  const winningSide = Math.random() < 0.5 ? groupA : groupB;
  const losingSide = winningSide === groupA ? groupB : groupA;
  const innerRound = generateNormalRound(losingSide, weekNumber, twistId, lastHohName);
  const survivors = [...winningSide, ...innerRound.survivors];

  return {
    type: "split_house_duel",
    weekNumber,
    twistId,
    castGrid,
    groupA,
    groupB,
    winningSide,
    losingSide,
    safeSide: winningSide,
    vulnerableSide: losingSide,
    sideLastHohNames: {
      A: winningSide === groupA ? null : innerRound.lastHohName,
      B: winningSide === groupB ? null : innerRound.lastHohName,
    },
    hohPlayer: innerRound.hohPlayer,
    nomineePlayers: innerRound.nomineePlayers,
    vetoExtraPlayers: innerRound.vetoExtraPlayers,
    vetoWinner: innerRound.vetoWinner,
    vetoUsed: innerRound.vetoUsed,
    vetoSavedPlayer: innerRound.vetoSavedPlayer,
    vetoReplacementPlayer: innerRound.vetoReplacementPlayer,
    finalNomineePlayers: innerRound.finalNomineePlayers,
    votingPlayers: innerRound.votingPlayers,
    votingTargets: innerRound.votingTargets,
    evictedPlayer: innerRound.evictedPlayer,
    survivors,
    lastHohName: innerRound.lastHohName,
  };
}

function generateContinuedSplitHouseDuelRound(previousRound, weekNumber, twistId) {
  const priorGroupA = previousRound?.groupA || [];
  const priorGroupB = previousRound?.groupB || [];
  const survivingNames = new Set((previousRound?.survivors || []).map((player) => player.name));
  const groupA = priorGroupA.filter((player) => survivingNames.has(player.name));
  const groupB = priorGroupB.filter((player) => survivingNames.has(player.name));
  const castGrid = [...groupA, ...groupB];

  const previousSideHohs = previousRound?.sideLastHohNames || {
    A: previousRound?.sideA?.lastHohName || null,
    B: previousRound?.sideB?.lastHohName || null,
  };

  const winningSide = Math.random() < 0.5 ? groupA : groupB;
  const losingSide = winningSide === groupA ? groupB : groupA;
  const losingSideKey = winningSide === groupA ? "B" : "A";
  const innerRound = generateNormalRound(losingSide, weekNumber, twistId, previousSideHohs[losingSideKey] || null);
  const survivors = [...winningSide, ...innerRound.survivors];

  return {
    type: "split_house_duel",
    weekNumber,
    twistId,
    castGrid,
    groupA,
    groupB,
    winningSide,
    losingSide,
    safeSide: winningSide,
    vulnerableSide: losingSide,
    sideLastHohNames: {
      A: winningSide === groupA ? previousSideHohs.A : innerRound.lastHohName,
      B: winningSide === groupB ? previousSideHohs.B : innerRound.lastHohName,
    },
    hohPlayer: innerRound.hohPlayer,
    nomineePlayers: innerRound.nomineePlayers,
    vetoExtraPlayers: innerRound.vetoExtraPlayers,
    vetoWinner: innerRound.vetoWinner,
    vetoUsed: innerRound.vetoUsed,
    vetoSavedPlayer: innerRound.vetoSavedPlayer,
    vetoReplacementPlayer: innerRound.vetoReplacementPlayer,
    finalNomineePlayers: innerRound.finalNomineePlayers,
    votingPlayers: innerRound.votingPlayers,
    votingTargets: innerRound.votingTargets,
    evictedPlayer: innerRound.evictedPlayer,
    survivors,
    lastHohName: innerRound.lastHohName,
  };
}

function generateContinuedSplitHouseRound(previousRound, weekNumber, twistId) {
  const priorGroupA = previousRound?.groupA || [];
  const priorGroupB = previousRound?.groupB || [];
  const survivingNames = new Set((previousRound?.survivors || []).map((player) => player.name));
  const groupA = priorGroupA.filter((player) => survivingNames.has(player.name));
  const groupB = priorGroupB.filter((player) => survivingNames.has(player.name));
  const castGrid = [...groupA, ...groupB];

  const sideA = generateNormalRound(groupA, weekNumber, twistId, previousRound?.sideA?.lastHohName || null);
  const sideB = generateNormalRound(groupB, weekNumber, twistId, previousRound?.sideB?.lastHohName || null);
  const survivors = [...sideA.survivors, ...sideB.survivors];

  return {
    type: "split_house",
    weekNumber,
    twistId,
    castGrid,
    groupA,
    groupB,
    sideA,
    sideB,
    continued: true,
    hohPlayer: null,
    nomineePlayers: [],
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers: [],
    votingPlayers: [],
    votingTargets: [],
    evictedPlayer: null,
    survivors,
    lastHohName: null,
  };
}

function generateBattleBackRound(activePlayers, weekNumber, twistId, battleBackPool) {
  const castGrid = [...activePlayers];
  const competitors = [...battleBackPool];
  const returnWinner = pickOne(competitors);
  const survivors = returnWinner ? [...activePlayers, returnWinner] : [...activePlayers];
  const permanentlyEliminated = competitors.filter((player) => player.name !== returnWinner?.name);

  return {
    type: "battle_back",
    weekNumber,
    twistId,
    castGrid,
    competitors,
    returnWinner,
    permanentlyEliminated,
    hohPlayer: null,
    nomineePlayers: [],
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers: [],
    votingPlayers: [],
    votingTargets: [],
    evictedPlayer: null,
    survivors,
    lastHohName: null,
  };
}

function generateRandomEliminationRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const evictedPlayer = pickOne(activePlayers);
  const survivors = castGrid.filter((player) => player.name !== evictedPlayer?.name);

  return {
    type: "random_elimination",
    weekNumber,
    twistId,
    castGrid,
    hohPlayer: null,
    nomineePlayers: [],
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers: [],
    votingPlayers: castGrid,
    votingTargets: [],
    evictedPlayer,
    survivors,
    lastHohName: null,
  };
}

function generateMajorityRulesRound(activePlayers, weekNumber, twistId) {
  const castGrid = [...activePlayers];
  const safePlayers = [];
  const loops = [];
  let evictedPlayer = null;

  while (!evictedPlayer) {
    const ineligibleNames = new Set(safePlayers.map((p) => p.name));
    const eligiblePlayers = castGrid.filter((p) => !ineligibleNames.has(p.name));
    if (eligiblePlayers.length <= 1) {
      evictedPlayer = eligiblePlayers[0] || castGrid.find((p) => !ineligibleNames.has(p.name)) || null;
      break;
    }

    const compWinner = pickOne(eligiblePlayers);
    const nomineePool = eligiblePlayers.filter((p) => p.name !== compWinner?.name);
    const nominee = pickOne(nomineePool);
    if (!nominee) {
      evictedPlayer = pickOne(eligiblePlayers);
      break;
    }

    const votingPlayers = eligiblePlayers.filter((p) => p.name !== compWinner?.name && p.name !== nominee.name);
    const votingTargets = votingPlayers.map(() => (Math.random() < 0.5 ? "evict" : "save"));
    const evictVotes = votingTargets.filter((v) => v === "evict").length;
    const saveVotes = votingTargets.filter((v) => v === "save").length;
    const outcome = evictVotes >= saveVotes ? "evicted" : "saved";

    loops.push({
      compWinner,
      nominee,
      votingPlayers,
      votingTargets,
      evictVotes,
      saveVotes,
      outcome,
      safePlayersBefore: [...safePlayers],
      safePlayersAfter: outcome === "saved" ? [...safePlayers, nominee] : [...safePlayers],
    });

    if (outcome === "saved") {
      safePlayers.push(nominee);
    } else {
      evictedPlayer = nominee;
    }
  }

  const survivors = castGrid.filter((p) => p.name !== evictedPlayer?.name);

  return {
    type: "majority_rules",
    weekNumber,
    twistId,
    castGrid,
    loops,
    hohPlayer: loops[0]?.compWinner || null,
    nomineePlayers: loops[0]?.nominee ? [loops[0].nominee] : [],
    vetoExtraPlayers: [],
    vetoWinner: null,
    vetoUsed: false,
    vetoSavedPlayer: null,
    vetoReplacementPlayer: null,
    finalNomineePlayers: loops[0]?.nominee ? [loops[0].nominee] : [],
    votingPlayers: loops[0]?.votingPlayers || [],
    votingTargets: loops[0]?.votingTargets || [],
    evictedPlayer,
    survivors,
    lastHohName: null,
  };
}

function generateFinal3Round(activePlayers, juryPlayers) {
  const castGrid = [...activePlayers];
  const orderedJuryPlayers = [...juryPlayers].reverse();
  const part1Winner = pickOne(activePlayers);
  const part2Pool = activePlayers.filter((player) => player.name !== part1Winner?.name);
  const part2Winner = pickOne(part2Pool);
  const finalHoh = pickOne([part1Winner, part2Winner].filter(Boolean));
  const protectedNames = [
    finalHoh?.name,
    finalHoh?.name === part1Winner?.name ? part2Winner?.name : part1Winner?.name,
  ];
  const finalEvictedPlayer = activePlayers.find((player) => !protectedNames.includes(player.name)) || null;
  const finalists = activePlayers.filter((player) => player.name !== finalEvictedPlayer?.name);
  const juryVotes = orderedJuryPlayers.map((juror) => ({ juror, targetName: pickOne(finalists)?.name ?? null }));

  const voteCounts = finalists.map((finalist) =>
    juryVotes.reduce((sum, vote) => sum + (vote.targetName === finalist.name ? 1 : 0), 0)
  );
  let winner = finalists[0] ?? null;
  if ((voteCounts[1] || 0) > (voteCounts[0] || 0)) winner = finalists[1] ?? null;
  if ((voteCounts[1] || 0) === (voteCounts[0] || 0)) winner = pickOne(finalists);

  return {
    type: "final3",
    castGrid,
    juryPlayers: orderedJuryPlayers,
    part1Winner,
    part2Winner,
    finalHoh,
    finalEvictedPlayer,
    finalists,
    juryVotes,
    winner,
  };
}

function generateSeasonFlow(selectedCast, weekTwists, jurySize) {
  let activePlayers = shuffle(selectedCast);
  const rounds = [];
  const juryPlayers = [];
  let weekNumber = 1;
  let lastHohName = null;
  let battleBackPool = [];

  while (activePlayers.length > 3) {
    const twistId = weekTwists[weekNumber] || "normal";
    const previousRound = rounds[rounds.length - 1] || null;
    const round = twistId === "battle_of_the_block"
      ? generateBattleOfTheBlockRound(activePlayers, weekNumber, twistId, lastHohName)
      : twistId === "three_nominees"
        ? generateThreeNomineeRound(activePlayers, weekNumber, twistId, lastHohName)
        : twistId === "forced_veto"
          ? generateForcedVetoRound(activePlayers, weekNumber, twistId, lastHohName)
          : twistId === "chain_of_safety"
            ? generateChainOfSafetyRound(activePlayers, weekNumber, twistId)
            : twistId === "survivor"
              ? generateSurvivorRound(activePlayers, weekNumber, twistId)
              : twistId === "executioner"
                ? generateExecutionerRound(activePlayers, weekNumber, twistId)
                : twistId === "bbuk"
                  ? generateBbukRound(activePlayers, weekNumber, twistId)
                  : twistId === "bbau"
                    ? generateBbAuRound(activePlayers, weekNumber, twistId, lastHohName)
                    : twistId === "split_house"
                      ? generateSplitHouseRound(activePlayers, weekNumber, twistId, lastHohName)
                      : twistId === "split_house_duel"
                        ? generateSplitHouseDuelRound(activePlayers, weekNumber, twistId, lastHohName)
                        : twistId === "continued_split_house_duel"
                          ? generateContinuedSplitHouseDuelRound(previousRound, weekNumber, twistId)
                          : twistId === "continued_split_house"
                            ? generateContinuedSplitHouseRound(previousRound, weekNumber, twistId)
                          : twistId === "vote_to_save"
                            ? generateVoteToSaveRound(activePlayers, weekNumber, twistId, lastHohName)
                            : twistId === "battle_back"
                              ? generateBattleBackRound(activePlayers, weekNumber, twistId, battleBackPool)
                              : twistId === "random_elimination"
                                ? generateRandomEliminationRound(activePlayers, weekNumber, twistId)
                                : twistId === "majority_rules"
                                  ? generateMajorityRulesRound(activePlayers, weekNumber, twistId)
                                  : generateNormalRound(activePlayers, weekNumber, twistId, lastHohName);

    rounds.push(round);
    if (round.type === "battle_back") {
      battleBackPool = [];
    } else if (round.type === "split_house") {
      if (round.sideA?.evictedPlayer) {
        juryPlayers.push(round.sideA.evictedPlayer);
        battleBackPool.push(round.sideA.evictedPlayer);
      }
      if (round.sideB?.evictedPlayer) {
        juryPlayers.push(round.sideB.evictedPlayer);
        battleBackPool.push(round.sideB.evictedPlayer);
      }
    } else if (round.type === "split_house_duel") {
      if (round.evictedPlayer) {
        juryPlayers.push(round.evictedPlayer);
        battleBackPool.push(round.evictedPlayer);
      }
    } else if (round.type === "split_house") {
      if (round.sideA?.evictedPlayer) {
        juryPlayers.push(round.sideA.evictedPlayer);
        battleBackPool.push(round.sideA.evictedPlayer);
      }
      if (round.sideB?.evictedPlayer) {
        juryPlayers.push(round.sideB.evictedPlayer);
        battleBackPool.push(round.sideB.evictedPlayer);
      }
    } else if (round.type === "split_house_duel") {
      if (round.evictedPlayer) {
        juryPlayers.push(round.evictedPlayer);
        battleBackPool.push(round.evictedPlayer);
      }
    } else if (round.type === "vote_to_save") {
      (round.evictedPlayers || []).forEach((player) => {
        juryPlayers.push(player);
        battleBackPool.push(player);
      });
    } else if (round.evictedPlayer) {
      juryPlayers.push(round.evictedPlayer);
      battleBackPool.push(round.evictedPlayer);
    }
    activePlayers = round.survivors;
    lastHohName = round.lastHohName;
    weekNumber += 1;
    if (rounds.length > 100) break;
  }

  if (activePlayers.length === 3) {
    const finalJuryPlayers = juryPlayers.slice(-Math.max(1, Math.min(jurySize || juryPlayers.length || 1, juryPlayers.length)));
    rounds.push(generateFinal3Round(activePlayers, finalJuryPlayers));
  }

  return {
    rounds,
    winner: rounds.at(-1)?.type === "final3" ? rounds.at(-1)?.winner : activePlayers[0] ?? null,
  };
}

function simulateSeason(selectedCast) {
  const flow = generateSeasonFlow(selectedCast, {}, Math.max(1, selectedCast.length - 2));
  return {
    evicted: flow.rounds
      .filter((round) => round.type !== "final3")
      .map((round) => round.evictedPlayer)
      .filter(Boolean),
    log: flow.rounds.map((round) => {
      if (round.type === "final3") {
        return {
          phase: "finale",
          finalists: round.finalists.map((p) => p.name),
          winner: round.winner?.name ?? null,
          runnerUp: round.finalists.find((p) => p.name !== round.winner?.name)?.name ?? null,
        };
      }
      return {
        phase: round.type,
        week: round.weekNumber,
        hoh: round.hohPlayer?.name ?? null,
        evicted: round.evictedPlayer?.name ?? null,
      };
    }),
  };
}


function CastTile({ player, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(player.name)}
      className={`text-left transition-all overflow-hidden ${selected ? "scale-[1.02]" : "opacity-80"}`}
    >
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md">
        <img src={player.image} alt={player.name} className={`h-full w-full object-cover ${selected ? "" : "grayscale"}`} />
      </div>
      <div className="p-1 flex items-center justify-center">
        <div className="font-semibold leading-tight text-[10px] sm:text-xs text-black text-center">{player.name}</div>
      </div>
    </button>
  );
}

function StartCastTile({ player, bgClassName = "bg-white", grayscale = false }) {
  return (
    <div className={`w-24 sm:w-28 ${bgClassName} rounded-lg p-1 transition-all mx-auto`}>
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md">
        <img src={player.image} alt={player.name} className={`h-full w-full object-cover ${grayscale ? "grayscale" : ""}`} />
      </div>
      <div className="p-1 flex items-center justify-center">
        <div className="font-semibold leading-tight text-[10px] sm:text-xs text-black text-center">{player.name}</div>
      </div>
    </div>
  );
}

function MysteryTile({ label, onClick, revealed, children, bgClassName = "bg-blue-200" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-24 sm:w-28 ${bgClassName} rounded-lg p-1 transition hover:scale-[1.02] mx-auto`}
    >
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md bg-white flex items-center justify-center">
        {revealed ? children : <div className="text-3xl sm:text-4xl text-stone-500 leading-none">?</div>}
      </div>
      <div className="p-1 flex items-center justify-center">
        <div className="font-semibold leading-tight text-[10px] sm:text-xs text-black text-center">{label}</div>
      </div>
    </button>
  );
}

function VoteRevealTile({ targetName, targetPlayer, revealed, onClick }) {
  return (
    <MysteryTile
      label={revealed ? targetName || "No vote" : "Reveal vote"}
      onClick={onClick}
      revealed={revealed}
      bgClassName="bg-blue-200"
    >
      {targetPlayer ? (
        <img src={targetPlayer.image} alt={targetPlayer.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-stone-800">No vote</div>
      )}
    </MysteryTile>
  );
}

function WeekConfigRow({ item, twistId, onChange, availableOptions, locked, onToggleLock }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[90px_1fr_80px] gap-3 items-center rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="font-medium">Week {item.week}</div>
      <Select value={twistId} onValueChange={(value) => onChange(item.week, value)}>
        
        
          {TWIST_OPTIONS.map((twist) => {
            const isDisabled = !availableOptions.includes(twist.id);
            return (
              <SelectItem key={twist.id} value={twist.id} disabled={isDisabled}>
                {twist.label}
              </SelectItem>
            );
          })}
        
      </Select>
      <label className="flex items-center gap-2 justify-self-start md:justify-self-center text-sm text-stone-900 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={locked}
          onChange={() => onToggleLock(item.week)}
          className="h-4 w-4"
        />
        Lock
      </label>
    </div>
  );
}

function SetupScreen({
  masterCast,
  selectedCast,
  selectedNames,
  weekPlan,
  effectiveWeekTwists,
  availableTwistsByWeek,
  bulkTwist,
  setBulkTwist,
  lockedWeeks,
  applyBulkTwist,
  jurySize,
  setJurySize,
  togglePlayer,
  selectAll,
  selectNone,
  clearToMinimum,
  randomizeCast,
  updateWeekTwist,
  toggleWeekLock,
  startGame,
  simulate,
  openAddCastModal,
  clearRoster,
}) {
  return (
    <>
      <div className="space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-stone-900">Big Brother</h1>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 flex-wrap text-stone-900">
              <span>1. Choose the cast</span>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" className="rounded-xl" onClick={selectAll}>Select all</Button>
                <Button variant="secondary" className="rounded-xl" onClick={selectNone}>Select none</Button>
                <Button variant="secondary" className="rounded-xl" onClick={clearToMinimum}>Minimum 4</Button>
                <Button variant="secondary" className="rounded-xl" onClick={randomizeCast}>Random cast</Button>
                <Button variant="secondary" className="rounded-xl" onClick={openAddCastModal}>Add Cast Members</Button>
                <Button variant="secondary" className="rounded-xl" onClick={clearRoster}>Clear Roster</Button>
                <Link href="/custom-casts" className="inline-flex items-center rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                  Manage Casts
                </Link>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <div className="inline-block rounded-full bg-gray-300 px-3 py-1 text-xs font-bold text-black">Selected: {selectedCast.length}</div>
              <div className="inline-block rounded-full bg-gray-300 px-3 py-1 text-xs font-bold text-black">Normal loop repeats until finale</div>
            </div>
            <ScrollArea className="h-[560px] pr-4">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {masterCast.map((player) => (
                  <CastTile key={player.name} player={player} selected={selectedNames.includes(player.name)} onToggle={togglePlayer} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
            <CardHeader><CardTitle className="text-stone-900">Week setup</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-stone-900">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="text-sm font-medium">Jury size</div>
                <Select value={String(jurySize)} onValueChange={(value) => setJurySize(Number(value))}>
                  
                  
                    {Array.from({ length: Math.max(1, selectedCast.length - 2) }, (_, i) => i + 1).map((size) => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <Select value={bulkTwist} onValueChange={setBulkTwist}>
                  
                  
                    {TWIST_OPTIONS.map((twist) => (
                      <SelectItem key={twist.id} value={twist.id}>{twist.label}</SelectItem>
                    ))}
                  
                </Select>
                <Button className="rounded-xl" onClick={applyBulkTwist}>Set All</Button>
              </div>
              <ScrollArea className="h-[420px] pr-4">
                <div className="space-y-3">
                  {weekPlan.map((item) => (
                    <WeekConfigRow
                      key={item.week}
                      item={item}
                      twistId={effectiveWeekTwists[item.week] || "normal"}
                      onChange={updateWeekTwist}
                      availableOptions={availableTwistsByWeek[item.week] || ["normal"]}
                      locked={Boolean(lockedWeeks[item.week])}
                      onToggleLock={toggleWeekLock}
                    />
                  ))}
                </div>
              </ScrollArea>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button className="w-full rounded-2xl text-base py-6" onClick={startGame}>Start game</Button>
                <Button className="w-full rounded-2xl text-base py-6" onClick={simulate}>Simulate season</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function WinnerScreen({ winner }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
        <CardHeader><CardTitle className="text-stone-900 text-3xl">Winner</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {winner ? <StartCastTile player={winner} bgClassName="bg-emerald-200" /> : null}
          <div className="text-stone-900 text-xl font-semibold">{winner?.name} wins the season!</div>
        </CardContent>
      </Card>
    </div>
  );
}

function MajoritySafeCastGrid({ round, loopIndex }) {
  const loop = round.loops[loopIndex] || round.loops[round.loops.length - 1];
  const safeNames = new Set((loop?.safePlayersAfter || []).map((p) => p.name));
  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {round.castGrid.map((player) => (
        <div key={player.name} className={safeNames.has(player.name) ? "rounded-lg ring-2 ring-lime-500" : ""}>
          <StartCastTile player={player} bgClassName="bg-white" />
          {safeNames.has(player.name) ? <div className="text-center text-[10px] text-lime-700 font-semibold">Safe</div> : null}
        </div>
      ))}
    </div>
  );
}

function StartingCastScreen({
  seasonFlow,
  roundIndex,
  phaseIndex,
  revealedNominees,
  revealedVotes,
  vetoDecisionRevealed,
  vetoReplacementRevealed,
  revealedFinal3,
  revealedFinalHohVote,
  revealedJuryVotes,
  onAdvance,
  onRevealNominee,
  onRevealVetoDecision,
  onRevealReplacement,
  onRevealVote,
  onRevealFinal3Block,
  onRevealFinalHohVote,
  onRevealJuryVote,
}) {
  const round = seasonFlow.rounds[roundIndex];
  if (!round) return null;

  const phases = round.type === "final3"
    ? FINAL3_PHASES
    : round.type === "battle_of_the_block"
      ? BOB_PHASES
      : round.type === "three_nominees" || round.type === "forced_veto" || round.type === "vote_to_save"
        ? THREE_NOMINEE_PHASES
        : round.type === "chain_of_safety"
          ? CHAIN_OF_SAFETY_PHASES
          : round.type === "survivor"
            ? SURVIVOR_PHASES
            : round.type === "executioner"
              ? EXECUTIONER_PHASES
              : round.type === "battle_back"
                ? BATTLE_BACK_PHASES
                : round.type === "random_elimination"
                  ? RANDOM_ELIMINATION_PHASES
                  : round.type === "majority_rules"
                    ? MAJORITY_RULES_PHASES
                  : round.type === "bbuk"
                    ? BBUK_PHASES
                    : round.type === "bbau"
                      ? BBAU_PHASES
                      : round.type === "split_house_duel"
                        ? SPLIT_HOUSE_DUEL_PHASES
                        : round.type === "split_house"
                          ? SPLIT_HOUSE_PHASES
                          : NORMAL_PHASES;

  const phase = phases[phaseIndex] || phases[0];
  const majorityPhaseSequence = round.type === "majority_rules"
    ? round.loops.flatMap((loop) => loop.outcome === "saved"
        ? ["majorityCompetition", "majorityNomination", "majorityVoteReveal", "majoritySafeLoop"]
        : ["majorityCompetition", "majorityNomination", "majorityVoteReveal"]
      ).concat(["evicted"])
    : null;
  const actualPhase = majorityPhaseSequence ? (majorityPhaseSequence[phaseIndex] || "evicted") : phase;
  const majorityLoopIndex = majorityPhaseSequence ? Math.min(round.loops.length - 1, majorityPhaseSequence.slice(0, phaseIndex + 1).filter((p) => p === "majorityCompetition").length - 1) : 0;
  const currentMajorityLoop = round.type === "majority_rules" ? round.loops[majorityLoopIndex] : null;
  const requiredNomineeRevealCount = round.type === "battle_of_the_block"
    ? 4
    : round.type === "chain_of_safety"
      ? Math.max(4, (round.safeOrder?.length || 0) - 1)
      : Math.max(4, round.nomineePlayers?.length || 0);
  const safeRevealCount = round.type === "chain_of_safety" ? Math.max(0, (round.safeOrder?.length || 0) - 1) : 0;
  const nomineeRevealState = Array.from({ length: requiredNomineeRevealCount }, (_, index) => revealedNominees[index] ?? false);
  const voteRevealColumns = round.type === "final3" ? 2 : Math.max(2, Math.min(4, round.finalNomineePlayers?.length || 2));

  if (actualPhase === "winner") {
    return <WinnerScreen winner={round.winner} />;
  }

  if (phase === "final3Competitions") {
    const blocks = [
      { revealed: revealedFinal3[0], player: round.part1Winner, label: revealedFinal3[0] ? round.part1Winner?.name || "Competition 1" : "Competition 1" },
      { revealed: revealedFinal3[1], player: round.part2Winner, label: revealedFinal3[1] ? round.part2Winner?.name || "Competition 2" : "Competition 2" },
      { revealed: revealedFinal3[2], player: round.finalHoh, label: revealedFinal3[2] ? `${round.finalHoh?.name || ""} (Final HoH)` : "Final HoH" },
    ];

    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Final Three Competitions</CardTitle></CardHeader>
          <CardContent className="space-y-4 flex flex-col items-center">
            {blocks.map((block, index) => (
              <MysteryTile
                key={index}
                label={block.label}
                onClick={() => onRevealFinal3Block(index)}
                revealed={block.revealed}
                bgClassName="bg-blue-200"
              >
                {block.player ? <img src={block.player.image} alt={block.player.name} className="h-full w-full object-cover" /> : null}
              </MysteryTile>
            ))}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "finalHohVote") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Final Head of Household Decision</CardTitle></CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            {round.finalHoh ? <StartCastTile player={round.finalHoh} bgClassName="bg-lime-200" /> : null}
            <MysteryTile
              label={revealedFinalHohVote ? round.finalEvictedPlayer?.name || "Reveal eviction vote" : "Reveal eviction vote"}
              onClick={onRevealFinalHohVote}
              revealed={revealedFinalHohVote}
              bgClassName="bg-blue-200"
            >
              {round.finalEvictedPlayer ? <img src={round.finalEvictedPlayer.image} alt={round.finalEvictedPlayer.name} className="h-full w-full object-cover grayscale" /> : null}
            </MysteryTile>
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "juryVoteReveal") {
    const voteCounts = round.finalists.map((finalist) =>
      revealedJuryVotes.reduce((sum, revealed, index) => sum + (revealed && round.juryVotes[index]?.targetName === finalist.name ? 1 : 0), 0)
    );

    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Finale</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid ${getTopNomineeGridClass(2)} gap-4 max-w-5xl mx-auto items-start`}>
              {round.finalists.map((finalist, index) => (
                <div key={finalist.name} className="flex items-center justify-center gap-3">
                  <StartCastTile player={finalist} bgClassName="bg-blue-200" />
                  <div className="text-3xl font-bold text-stone-900 min-w-8 text-center">{voteCounts[index]}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10 gap-2 max-w-6xl mx-auto items-start">
              {round.juryPlayers.map((player, index) => {
                const targetName = round.juryVotes[index]?.targetName || "No vote";
                const targetPlayer = round.castGrid.find((candidate) => candidate.name === targetName) || null;
                return (
                  <React.Fragment key={player.name}>
                    <StartCastTile player={player} bgClassName="bg-white" />
                    <VoteRevealTile
                      targetName={targetName}
                      targetPlayer={targetPlayer}
                      revealed={revealedJuryVotes[index]}
                      onClick={() => onRevealJuryVote(index)}
                    />
                  </React.Fragment>
                );
              })}
            </div>
            <Button onClick={onAdvance} className="rounded-xl mx-auto block">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "majorityCompetition") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{currentMajorityLoop?.compWinner?.name} has won the competition!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {currentMajorityLoop?.compWinner ? <StartCastTile player={currentMajorityLoop.compWinner} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "majorityNomination") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Majority Rules Nomination</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto items-start">
              {currentMajorityLoop?.compWinner ? <StartCastTile player={currentMajorityLoop.compWinner} bgClassName="bg-lime-200" /> : <div />}
              {currentMajorityLoop?.nominee ? (
                <MysteryTile
                  label={nomineeRevealState[0] ? currentMajorityLoop.nominee.name : ""}
                  onClick={() => onRevealNominee(0)}
                  revealed={nomineeRevealState[0]}
                  bgClassName="bg-blue-200"
                >
                  <img src={currentMajorityLoop.nominee.image} alt={currentMajorityLoop.nominee.name} className="h-full w-full object-cover" />
                </MysteryTile>
              ) : <div />}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "majorityVoteReveal") {
    const evictCount = revealedVotes.reduce((sum, revealed, index) => sum + (revealed && currentMajorityLoop?.votingTargets[index] === "evict" ? 1 : 0), 0);
    const saveCount = revealedVotes.reduce((sum, revealed, index) => sum + (revealed && currentMajorityLoop?.votingTargets[index] === "save" ? 1 : 0), 0);
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Majority Rules Vote</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-3xl font-bold text-red-600 min-w-8 text-center">{evictCount}</div>
              {currentMajorityLoop?.nominee ? <StartCastTile player={currentMajorityLoop.nominee} bgClassName="bg-blue-200" /> : null}
              <div className="text-3xl font-bold text-green-600 min-w-8 text-center">{saveCount}</div>
            </div>
            <div className="grid grid-cols-10 gap-2 max-w-6xl mx-auto items-start">
              {(currentMajorityLoop?.votingPlayers || []).map((player, index) => {
                const revealed = revealedVotes[index];
                const vote = currentMajorityLoop.votingTargets[index];
                const colorClass = !revealed
                  ? "bg-blue-200"
                  : vote === "evict"
                    ? "bg-red-200"
                    : "bg-green-200";
                return (
                  <React.Fragment key={player.name}>
                    <StartCastTile player={player} bgClassName="bg-white" />
                    <MysteryTile
                      label={revealed ? vote : "Reveal vote"}
                      onClick={() => onRevealVote(index)}
                      revealed={revealed}
                      bgClassName={colorClass}
                    >
                      <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-stone-800 uppercase">
                        {vote}
                      </div>
                    </MysteryTile>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "majorityResetCast") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 flex items-center justify-between">
            <span>Week ${round.weekNumber} • Majority Rules</span>
            <Button onClick={onAdvance} className="rounded-xl">Advance</Button>
          </CardTitle></CardHeader>
          <CardContent>
            <MajoritySafeCastGrid round={round} loopIndex={majorityLoopIndex} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "majoritySafeLoop") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">{currentMajorityLoop?.nominee?.name} is safe for the week</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <MajoritySafeCastGrid round={round} loopIndex={majorityLoopIndex} />
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "randomEliminationReveal") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Random Elimination</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-10 gap-2 max-w-6xl mx-auto items-start">
              {round.votingPlayers.map((player, index) => {
                const revealed = revealedVotes[index];
                const isEvicted = round.evictedPlayer?.name === player.name;
                return (
                  <React.Fragment key={player.name}>
                    <StartCastTile player={player} bgClassName="bg-blue-200" />
                    <MysteryTile
                      label={revealed ? (isEvicted ? "Eliminated" : "Safe") : ""}
                      onClick={() => onRevealVote(index)}
                      revealed={revealed}
                      bgClassName={revealed ? (isEvicted ? "bg-red-300" : "bg-lime-200") : "bg-blue-200"}
                    >
                      <div className={`h-full w-full flex items-center justify-center text-sm font-bold ${isEvicted ? "text-red-700" : "text-lime-700"}`}>
                        {isEvicted ? "OUT" : "SAFE"}
                      </div>
                    </MysteryTile>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "battleBackPlayers") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Battle Back</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-w-6xl mx-auto">
              {round.competitors.map((player) => (
                <StartCastTile key={player.name} player={player} bgClassName="bg-white" grayscale />
              ))}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "battleBackWinner") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.returnWinner?.name} has won the Battle Back!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.returnWinner ? <StartCastTile player={round.returnWinner} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "battleBackReturn") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.returnWinner?.name} returns to the game!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.returnWinner ? <StartCastTile player={round.returnWinner} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "executionerWinner") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.executionerWinner?.name} has won the challenge!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.executionerWinner ? <StartCastTile player={round.executionerWinner} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "survivorImmunity") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.immunityWinner?.name} has won immunity!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.immunityWinner ? <StartCastTile player={round.immunityWinner} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "chainReveal") {
    const initiallySafe = round.safeOrder?.[0] || null;
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Chain of Safety</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              {initiallySafe ? <StartCastTile player={initiallySafe} bgClassName="bg-lime-200" /> : null}
              {Array.from({ length: safeRevealCount }, (_, index) => {
                const savior = round.safeOrder[index];
                const saved = round.safeOrder[index + 1];
                const isRevealed = nomineeRevealState[index];
                return (
                  <div key={`${savior?.name || index}-${saved?.name || index}`} className="flex flex-col items-center gap-3">
                    <div className="text-stone-900 text-sm font-medium">{isRevealed ? `${savior?.name} saves...` : ""}</div>
                    <MysteryTile
                      label={isRevealed && saved ? saved.name : ""}
                      onClick={() => onRevealNominee(index)}
                      revealed={isRevealed}
                      bgClassName="bg-lime-200"
                    >
                      {saved ? <img src={saved.image} alt={saved.name} className="h-full w-full object-cover" /> : null}
                    </MysteryTile>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <div className="text-stone-900 text-center font-semibold">Still vulnerable</div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-w-6xl mx-auto">
                {round.castGrid
                  .filter((player) => {
                    const revealedSafeNames = (round.safeOrder || [])
                      .filter((_, idx) => idx === 0 || nomineeRevealState[idx - 1])
                      .map((p) => p.name);
                    return !revealedSafeNames.includes(player.name);
                  })
                  .map((player) => (
                    <StartCastTile key={player.name} player={player} bgClassName="bg-blue-200" />
                  ))}
              </div>
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitDuel") {
    const safeNames = new Set((round.safeSide || []).map((player) => player.name));
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Duel</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              <div className="space-y-3">
                <div className="text-stone-900 text-center font-semibold">Side A</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {round.groupA.map((p) => <StartCastTile key={p.name} player={p} bgClassName={safeNames.has(p.name) ? "bg-lime-200" : "bg-white"} />)}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-stone-900 text-center font-semibold">Side B</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {round.groupB.map((p) => <StartCastTile key={p.name} player={p} bgClassName={safeNames.has(p.name) ? "bg-lime-200" : "bg-white"} />)}
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitGroups") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              <div className="space-y-3">
                <div className="text-stone-900 text-center font-semibold">Side A</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{round.groupA.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-blue-200" />)}</div>
              </div>
              <div className="space-y-3">
                <div className="text-stone-900 text-center font-semibold">Side B</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{round.groupB.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-blue-200" />)}</div>
              </div>
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitHoh") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House HoHs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => (
                <div key={sideIndex} className="flex flex-col items-center gap-3">
                  <div className="text-stone-900 font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                  {side?.hohPlayer ? <StartCastTile player={side.hohPlayer} bgClassName="bg-lime-200" /> : null}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitNominations") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Nominations</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => (
                <div key={sideIndex} className="space-y-3">
                  <div className="text-stone-900 text-center font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                  <div className="grid grid-cols-3 gap-3 items-start justify-items-center">
                    {side?.hohPlayer ? <StartCastTile player={side.hohPlayer} bgClassName="bg-lime-200" /> : <div />}
                    {[0, 1].map((idx) => {
                      const nominee = side?.nomineePlayers?.[idx];
                      const revealIndex = sideIndex * 2 + idx;
                      return nominee ? (
                        <MysteryTile
                          key={`${sideIndex}-${idx}`}
                          label={nomineeRevealState[revealIndex] ? nominee.name : ""}
                          onClick={() => onRevealNominee(revealIndex)}
                          revealed={nomineeRevealState[revealIndex]}
                          bgClassName="bg-blue-200"
                        >
                          <img src={nominee.image} alt={nominee.name} className="h-full w-full object-cover" />
                        </MysteryTile>
                      ) : <div key={`${sideIndex}-${idx}`} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitVetoPlayers") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Veto Players</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => (
                <div key={sideIndex} className="space-y-4">
                  <div className="text-stone-900 text-center font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                  <div className="grid grid-cols-3 gap-2 justify-items-center">
                    {side?.hohPlayer ? <StartCastTile player={side.hohPlayer} bgClassName="bg-lime-200" /> : null}
                    {side?.nomineePlayers?.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-blue-200" />)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 justify-items-center">
                    {side?.vetoExtraPlayers?.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-pink-200" />)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitVetoWinner") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Veto Winners</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => (
                <div key={sideIndex} className="flex flex-col items-center gap-3">
                  <div className="text-stone-900 font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                  {side?.vetoWinner ? <StartCastTile player={side.vetoWinner} bgClassName="bg-pink-200" /> : null}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitVetoCeremony") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Veto Ceremony</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => {
                const replacementCanShow = side?.vetoUsed && vetoDecisionRevealed;
                return (
                  <div key={sideIndex} className="space-y-3 flex flex-col items-center">
                    <div className="text-stone-900 font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                    <div className={`grid gap-3 ${replacementCanShow ? "grid-cols-3" : "grid-cols-2"}`}>
                      {side?.vetoWinner ? <StartCastTile player={side.vetoWinner} bgClassName="bg-pink-200" /> : null}
                      <MysteryTile
                        label={vetoDecisionRevealed ? (side?.vetoUsed && side?.vetoSavedPlayer ? side.vetoSavedPlayer.name : "Veto not used") : "Click to reveal"}
                        onClick={onRevealVetoDecision}
                        revealed={vetoDecisionRevealed}
                        bgClassName="bg-blue-200"
                      >
                        {side?.vetoUsed && side?.vetoSavedPlayer ? <img src={side.vetoSavedPlayer.image} alt={side.vetoSavedPlayer.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-5xl sm:text-6xl text-red-500 font-bold leading-none">✕</div>}
                      </MysteryTile>
                      {replacementCanShow && round.type !== "forced_veto" ? (
                        <MysteryTile
                          label={vetoReplacementRevealed && side?.vetoReplacementPlayer ? side.vetoReplacementPlayer.name : "Click to reveal"}
                          onClick={onRevealReplacement}
                          revealed={vetoReplacementRevealed}
                          bgClassName="bg-blue-200"
                        >
                          {side?.vetoReplacementPlayer ? <img src={side.vetoReplacementPlayer.image} alt={side.vetoReplacementPlayer.name} className="h-full w-full object-cover" /> : null}
                        </MysteryTile>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitVoteReveal") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Vote Reveal</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-7xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              {[round.sideA, round.sideB].map((side, sideIndex) => {
                const base = sideIndex === 0 ? 0 : (round.sideA?.votingPlayers?.length || 0);
                const localVoteCounts = side.finalNomineePlayers.map((nominee) =>
                  side.votingPlayers.reduce((sum, _player, localIndex) => {
                    const globalIndex = base + localIndex;
                    return sum + (revealedVotes[globalIndex] && side.votingTargets[localIndex] === nominee.name ? 1 : 0);
                  }, 0)
                );
                return (
                  <div key={sideIndex} className="space-y-4">
                    <div className="text-stone-900 text-center font-semibold">{sideIndex === 0 ? "Side A" : "Side B"}</div>
                    <div className={`grid ${getTopNomineeGridClass(side.finalNomineePlayers.length)} gap-3 items-start`}>
                      {side.finalNomineePlayers.map((nominee, idx) => (
                        <div key={nominee.name} className="flex items-center justify-center gap-2">
                          <StartCastTile player={nominee} bgClassName="bg-blue-200" />
                          <div className="text-3xl font-bold text-stone-900 min-w-8 text-center">{localVoteCounts[idx]}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-2 items-start">
                      {side.votingPlayers.map((player, localIndex) => {
                        const globalIndex = base + localIndex;
                        const targetName = side.votingTargets[localIndex] || "No vote";
                        const targetPlayer = side.castGrid.find((candidate) => candidate.name === targetName) || null;
                        return (
                          <React.Fragment key={player.name}>
                            <StartCastTile player={player} bgClassName="bg-white" />
                            <VoteRevealTile
                              targetName={targetName}
                              targetPlayer={targetPlayer}
                              revealed={revealedVotes[globalIndex]}
                              onClick={() => onRevealVote(globalIndex)}
                            />
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "splitEvicted") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Split House Evictions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8 max-w-5xl mx-auto relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-700 -translate-x-1/2" />
              <div className="flex flex-col items-center gap-3">
                <div className="text-stone-900 font-semibold">Side A</div>
                {round.sideA?.evictedPlayer ? <StartCastTile player={round.sideA.evictedPlayer} bgClassName="bg-blue-200" grayscale /> : null}
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="text-stone-900 font-semibold">Side B</div>
                {round.sideB?.evictedPlayer ? <StartCastTile player={round.sideB.evictedPlayer} bgClassName="bg-blue-200" grayscale /> : null}
              </div>
            </div>
            <div className="flex justify-center mt-6"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "bbukNominations") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">BBUK House Nominations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-6xl mx-auto items-start">
              {round.nominationVotes.map(({ voter, targets }) => (
                <div key={voter.name} className="rounded-xl bg-white/20 border border-black/5 p-3 flex items-center justify-center gap-3">
                  <StartCastTile player={voter} bgClassName="bg-blue-200" />
                  <div className="flex flex-col gap-2">
                    {targets.map((target) => (
                      <StartCastTile key={`${voter.name}-${target.name}`} player={target} bgClassName="bg-blue-200" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "bbukNominationResults") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">BBUK Nominated Houseguests</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid ${getTopNomineeGridClass(round.finalNomineePlayers.length)} gap-4 max-w-5xl mx-auto items-start`}>
              {round.finalNomineePlayers.map((nominee) => (
                <div key={nominee.name} className="flex items-center justify-center gap-3">
                  <StartCastTile player={nominee} bgClassName="bg-blue-200" />
                  <div className="text-3xl font-bold text-stone-900 min-w-8 text-center">{round.nominationCounts[nominee.name] ?? 0}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "doubleHoh") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.hohPlayers?.[0]?.name} and {round.hohPlayers?.[1]?.name} have won Head of Household!</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center gap-4 flex-wrap">
            {round.hohPlayers?.map((player) => <StartCastTile key={player.name} player={player} bgClassName="bg-lime-200" />)}
            <div className="basis-full" />
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "doubleNoms") {
    const pairs = [
      { hoh: round.hohPlayers?.[0], noms: round.pairA },
      { hoh: round.hohPlayers?.[1], noms: round.pairB },
    ];

    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Battle of the Block Nominations</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {pairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="grid grid-cols-3 gap-4 max-w-4xl mx-auto items-start">
                {pair.hoh ? <StartCastTile player={pair.hoh} bgClassName="bg-lime-200" /> : <div />}
                {[0, 1].map((index) => {
                  const nominee = pair.noms?.[index];
                  const revealIndex = pairIndex * 2 + index;
                  return nominee ? (
                    <MysteryTile
                      key={revealIndex}
                      label={nomineeRevealState[revealIndex] ? nominee.name : ""}
                      onClick={() => onRevealNominee(revealIndex)}
                      revealed={nomineeRevealState[revealIndex]}
                      bgClassName="bg-blue-200"
                    >
                      <img src={nominee.image} alt={nominee.name} className="h-full w-full object-cover" />
                    </MysteryTile>
                  ) : <div key={revealIndex} />;
                })}
              </div>
            ))}
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "battleMatch") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Battle of the Block</CardTitle></CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4">{round.pairA?.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-blue-200" />)}</div>
            <div className="text-stone-900 text-2xl font-bold">VS</div>
            <div className="grid grid-cols-2 gap-4">{round.pairB?.map((p) => <StartCastTile key={p.name} player={p} bgClassName="bg-blue-200" />)}</div>
            <Button onClick={onAdvance} className="rounded-xl">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "battleResult") {
    const winnerNames = new Set((round.winningPair || []).map((p) => p.name));
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Battle Result</CardTitle></CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4">
              {round.pairA?.map((p) => (
                <StartCastTile
                  key={p.name}
                  player={p}
                  bgClassName={winnerNames.has(p.name) ? "bg-lime-200" : "bg-blue-200"}
                />
              ))}
            </div>
            <div className="text-stone-900 text-2xl font-bold">VS</div>
            <div className="grid grid-cols-2 gap-4">
              {round.pairB?.map((p) => (
                <StartCastTile
                  key={p.name}
                  player={p}
                  bgClassName={winnerNames.has(p.name) ? "bg-lime-200" : "bg-blue-200"}
                />
              ))}
            </div>
            <Button onClick={onAdvance} className="rounded-xl">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "postBattle") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.dethronedHoh?.name} is no longer HoH. {round.survivingHoh?.name} remains Head of Household.</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center gap-4 flex-wrap">
            {round.dethronedHoh ? <StartCastTile player={round.dethronedHoh} bgClassName="bg-blue-200" /> : null}
            {round.survivingHoh ? <StartCastTile player={round.survivingHoh} bgClassName="bg-lime-200" /> : null}
            <div className="basis-full" />
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "hoh") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.hohPlayer?.name} has won Head of Household!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.hohPlayer ? <StartCastTile player={round.hohPlayer} bgClassName="bg-lime-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "nominations") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Nomination Ceremony</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid ${round.type === "three_nominees" ? "grid-cols-4" : "grid-cols-3"} gap-4 max-w-5xl mx-auto items-start`}>
              {round.hohPlayer ? <StartCastTile player={round.hohPlayer} bgClassName="bg-lime-200" /> : <div />}
              {round.nomineePlayers.map((nominee, index) => (
                <MysteryTile
                  key={index}
                  label={nomineeRevealState[index] ? nominee.name : ""}
                  onClick={() => onRevealNominee(index)}
                  revealed={nomineeRevealState[index]}
                  bgClassName="bg-blue-200"
                >
                  <img src={nominee.image} alt={nominee.name} className="h-full w-full object-cover" />
                </MysteryTile>
              ))}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "vetoPlayers") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Power of Veto Players</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid ${round.type === "three_nominees" ? "grid-cols-4" : "grid-cols-3"} gap-4 max-w-5xl mx-auto items-start`}>
              {round.hohPlayer ? <StartCastTile player={round.hohPlayer} bgClassName="bg-lime-200" /> : <div />}
              {round.nomineePlayers.map((nominee) => <StartCastTile key={nominee.name} player={nominee} bgClassName="bg-blue-200" />)}
            </div>
            <div className={`grid ${round.type === "three_nominees" ? "grid-cols-2" : "grid-cols-3"} gap-4 max-w-4xl mx-auto items-start`}>
              {round.vetoExtraPlayers.map((player) => <StartCastTile key={player.name} player={player} bgClassName="bg-pink-200" />)}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "vetoWinner") {
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">{round.vetoWinner?.name} has won the Power of Veto!</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.vetoWinner ? <StartCastTile player={round.vetoWinner} bgClassName="bg-pink-200" /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "vetoCeremony") {
    const replacementCanShow = round.vetoUsed && vetoDecisionRevealed;
    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">Power of Veto Ceremony</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid gap-4 max-w-5xl mx-auto items-start ${replacementCanShow ? "grid-cols-3" : "grid-cols-2 max-w-2xl"}`}>
              {round.vetoWinner ? <StartCastTile player={round.vetoWinner} bgClassName="bg-pink-200" /> : <div />}
              <MysteryTile
                label={vetoDecisionRevealed ? (round.vetoUsed && round.vetoSavedPlayer ? round.vetoSavedPlayer.name : "Veto not used") : "Click to reveal"}
                onClick={onRevealVetoDecision}
                revealed={vetoDecisionRevealed}
                bgClassName="bg-blue-200"
              >
                {round.vetoUsed && round.vetoSavedPlayer ? (
                  <img src={round.vetoSavedPlayer.image} alt={round.vetoSavedPlayer.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-5xl sm:text-6xl text-red-500 font-bold leading-none">✕</div>
                )}
              </MysteryTile>
              {replacementCanShow ? (
                <MysteryTile
                  label={vetoReplacementRevealed && round.vetoReplacementPlayer ? round.vetoReplacementPlayer.name : "Click to reveal"}
                  onClick={onRevealReplacement}
                  revealed={vetoReplacementRevealed}
                  bgClassName="bg-blue-200"
                >
                  {round.vetoReplacementPlayer ? (
                    <img src={round.vetoReplacementPlayer.image} alt={round.vetoReplacementPlayer.name} className="h-full w-full object-cover" />
                  ) : null}
                </MysteryTile>
              ) : null}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "voteReveal") {
    const voteCounts = round.finalNomineePlayers.map((nominee) =>
      revealedVotes.reduce((sum, revealed, index) => sum + (revealed && round.votingTargets[index] === nominee.name ? 1 : 0), 0)
    );

    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
          <CardHeader><CardTitle className="text-stone-900 text-center text-2xl">{round.type === "vote_to_save" ? "Vote to Save" : "Vote Reveal"}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className={`grid ${round.type === "survivor" ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1" : `${getTopNomineeGridClass(voteRevealColumns)} gap-4`} max-w-5xl mx-auto items-start`}>
              {round.finalNomineePlayers.map((nominee, index) => (
                <div key={nominee.name} className="flex items-center justify-center gap-3">
                  <StartCastTile player={nominee} bgClassName="bg-blue-200" />
                  <div className="text-3xl font-bold text-stone-900 min-w-8 text-center">{voteCounts[index]}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10 gap-2 max-w-6xl mx-auto items-start">
              {round.votingPlayers.map((player, index) => {
                const targetName = round.votingTargets[index] || "No vote";
                const targetPlayer = round.castGrid.find((candidate) => candidate.name === targetName) || null;
                return (
                  <React.Fragment key={player.name}>
                    <StartCastTile player={player} bgClassName="bg-white" />
                    <VoteRevealTile
                      targetName={targetName}
                      targetPlayer={targetPlayer}
                      revealed={revealedVotes[index]}
                      onClick={() => onRevealVote(index)}
                    />
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex justify-center"><Button onClick={onAdvance} className="rounded-xl">Advance</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (actualPhase === "evicted") {
    if (round.type === "random_elimination") {
      return (
        <div className="space-y-6">
          <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
            <CardHeader><CardTitle className="text-stone-900 text-2xl">Randomly Eliminated</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {round.evictedPlayer ? <StartCastTile player={round.evictedPlayer} bgClassName="bg-blue-200" grayscale /> : null}
              <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
            </CardContent>
          </Card>
        </div>
      );
    }


    if (round.type === "vote_to_save") {
      return (
        <div className="space-y-6">
          <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
            <CardHeader><CardTitle className="text-stone-900 text-2xl">Evicted Houseguests</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center gap-6 flex-wrap">
              {(round.evictedPlayers || []).map((player) => (
                <StartCastTile key={player.name} player={player} bgClassName="bg-blue-200" grayscale />
              ))}
              <div className="basis-full" />
              <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
          <CardHeader><CardTitle className="text-stone-900 text-2xl">Evicted Houseguest</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {round.evictedPlayer ? <StartCastTile player={round.evictedPlayer} bgClassName="bg-blue-200" grayscale /> : null}
            <Button onClick={onAdvance} className="rounded-xl mt-2">Advance</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-stone-900 flex items-center justify-between">
            <span>
              {round.type === "final3"
                ? "Final Three"
                : `Week ${round.weekNumber} • ${TWIST_OPTIONS.find((tw) => tw.id === round.twistId)?.label || "Normal"}`}
            </span>
            <Button onClick={onAdvance} className="rounded-xl">Advance</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {round.castGrid.map((player) => (
              <StartCastTile key={player.name} player={player} bgClassName="bg-white" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsScreen({ seasonResult }) {
  return (
    <div className="space-y-6">
      <Card className="bg-white/25 border-white/20 rounded-3xl shadow-2xl backdrop-blur-sm">
        <CardHeader><CardTitle className="text-stone-900">Season result</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-stone-900">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="text-sm text-stone-700">Winner</div>
            <div className="text-2xl font-bold mt-1">{seasonResult.log.at(-1)?.winner}</div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white/20 p-4">
            <div className="text-sm text-stone-700">Runner-up</div>
            <div className="text-xl font-semibold mt-1">{seasonResult.log.at(-1)?.runnerUp}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



function getReplayPhasesForRound(currentRound) {
  return currentRound?.type === "final3"
    ? FINAL3_PHASES
    : currentRound?.type === "battle_of_the_block"
      ? BOB_PHASES
      : currentRound?.type === "three_nominees" || currentRound?.type === "forced_veto" || currentRound?.type === "vote_to_save"
        ? THREE_NOMINEE_PHASES
        : currentRound?.type === "chain_of_safety"
          ? CHAIN_OF_SAFETY_PHASES
          : currentRound?.type === "survivor"
            ? SURVIVOR_PHASES
            : currentRound?.type === "executioner"
              ? EXECUTIONER_PHASES
              : currentRound?.type === "battle_back"
                ? BATTLE_BACK_PHASES
                : currentRound?.type === "random_elimination"
                  ? RANDOM_ELIMINATION_PHASES
                  : currentRound?.type === "majority_rules"
                    ? MAJORITY_RULES_PHASES
                    : currentRound?.type === "bbuk"
                      ? BBUK_PHASES
                      : currentRound?.type === "bbau"
                        ? BBAU_PHASES
                        : currentRound?.type === "split_house_duel"
                          ? SPLIT_HOUSE_DUEL_PHASES
                          : currentRound?.type === "split_house"
                            ? SPLIT_HOUSE_PHASES
                            : NORMAL_PHASES;
}

export default function BigBrotherReplayScreen({
  seasonFlow,
  onExit,
  headerLabel = "Saved Big Brother Replay",
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [revealedNominees, setRevealedNominees] = useState([false, false, false, false]);
  const [vetoDecisionRevealed, setVetoDecisionRevealed] = useState(false);
  const [vetoReplacementRevealed, setVetoReplacementRevealed] = useState(false);
  const [revealedVotes, setRevealedVotes] = useState([]);
  const [revealedFinal3, setRevealedFinal3] = useState([false, false, false]);
  const [revealedFinalHohVote, setRevealedFinalHohVote] = useState(false);
  const [revealedJuryVotes, setRevealedJuryVotes] = useState([]);

  const rounds = seasonFlow?.rounds || [];
  const currentRound = rounds[roundIndex] || null;
  const phases = getReplayPhasesForRound(currentRound);
  const currentPhase = phases[phaseIndex] || phases[0] || "cast";

  function resetRevealStateForRound(round, forcedVoteCount = null) {
    const nomineeCount = round?.type === "battle_of_the_block"
      ? 4
      : round?.type === "chain_of_safety"
        ? Math.max(4, (round?.safeOrder?.length || 0) - 1)
        : Math.max(4, round?.nomineePlayers?.length || 0);

    setRevealedNominees(Array.from({ length: nomineeCount }, () => false));
    setVetoDecisionRevealed(false);
    setVetoReplacementRevealed(false);

    const voteCount = forcedVoteCount !== null
      ? forcedVoteCount
      : round?.type === "split_house"
        ? (round?.sideA?.votingPlayers?.length || 0) + (round?.sideB?.votingPlayers?.length || 0)
        : (round?.votingPlayers?.length || 0);

    setRevealedVotes(Array.from({ length: voteCount }, () => false));
    setRevealedFinal3([false, false, false]);
    setRevealedFinalHohVote(false);
    setRevealedJuryVotes(round?.juryPlayers?.map(() => false) || []);
  }

  function advanceSeasonFlow() {
    if (!seasonFlow || !currentRound) return;

    const phasesForRound = getReplayPhasesForRound(currentRound);

    if (currentRound?.type === "majority_rules") {
      const totalPhases = ["cast"].concat(
        currentRound.loops.flatMap((loop) => loop.outcome === "saved"
          ? ["majorityCompetition", "majorityNomination", "majorityVoteReveal", "majoritySafeLoop", "majorityResetCast"]
          : ["majorityCompetition", "majorityNomination", "majorityVoteReveal"]
        )
      ).concat(["evicted"]);

      if (phaseIndex < totalPhases.length - 1) {
        const nextPhaseIndex = phaseIndex + 1;
        setPhaseIndex(nextPhaseIndex);

        const competitionsSeen = totalPhases
          .slice(0, nextPhaseIndex + 1)
          .filter((phase) => phase === "majorityCompetition").length;

        const nextLoopIndex = Math.max(0, competitionsSeen - 1);
        const nextPhase = totalPhases[nextPhaseIndex];

        if (nextPhase === "majorityCompetition") {
          resetRevealStateForRound(currentRound, currentRound.loops[nextLoopIndex]?.votingPlayers?.length || 0);
        } else if (nextPhase === "majorityNomination") {
          setRevealedNominees([false, false, false, false]);
        } else if (nextPhase === "majorityVoteReveal") {
          setRevealedVotes(Array.from({ length: currentRound.loops[nextLoopIndex]?.votingPlayers?.length || 0 }, () => false));
        }

        return;
      }
    } else if (phaseIndex < phasesForRound.length - 1) {
      setPhaseIndex((previous) => previous + 1);
      return;
    }

    if (roundIndex < rounds.length - 1) {
      const nextRoundIndex = roundIndex + 1;
      const nextRound = rounds[nextRoundIndex];

      setRoundIndex(nextRoundIndex);
      setPhaseIndex(0);
      resetRevealStateForRound(nextRound);
    } else {
      setPhaseIndex(phasesForRound.length - 1);
    }
  }

  function goBackOneStep() {
    if (phaseIndex > 0) {
      setPhaseIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (roundIndex > 0) {
      const previousRoundIndex = roundIndex - 1;
      const previousRound = rounds[previousRoundIndex];
      const previousPhases = getReplayPhasesForRound(previousRound);

      setRoundIndex(previousRoundIndex);
      setPhaseIndex(Math.max(0, previousPhases.length - 1));
      resetRevealStateForRound(previousRound);
    }
  }

  const revealNominee = (index) => {
    setRevealedNominees((previous) => previous.map((value, i) => (i === index ? true : value)));
  };

  const revealVetoDecision = () => setVetoDecisionRevealed(true);
  const revealReplacement = () => setVetoReplacementRevealed(true);
  const revealVote = (index) => setRevealedVotes((previous) => previous.map((value, i) => (i === index ? true : value)));
  const revealFinal3Block = (index) => setRevealedFinal3((previous) => previous.map((value, i) => (i === index ? true : value)));
  const revealFinalHohVote = () => setRevealedFinalHohVote(true);
  const revealJuryVote = (index) => setRevealedJuryVotes((previous) => previous.map((value, i) => (i === index ? true : value)));

  if (!seasonFlow || !rounds.length) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-100 to-stone-200 text-stone-900">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8">
          <div className="rounded-3xl bg-white/50 border border-black/10 p-8 text-2xl font-black">
            Big Brother replay data not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-100 to-stone-200 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8">
        <div className="rounded-3xl border border-white/20 bg-white/25 p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-stone-600">
                {headerLabel}
              </div>

              <h1 className="text-3xl font-black text-stone-900">
                Week {currentRound?.weekNumber || "Finale"} • {currentPhase}
              </h1>

              <div className="mt-1 text-sm font-bold text-stone-700">
                Round {roundIndex + 1} / {rounds.length}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onExit}
                className="rounded-xl bg-stone-900 px-4 py-2 font-black text-white"
              >
                Back to Cast
              </button>

              <button
                onClick={goBackOneStep}
                disabled={roundIndex === 0 && phaseIndex === 0}
                className="rounded-xl bg-white/70 px-4 py-2 font-black text-stone-900 disabled:opacity-40"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <StartingCastScreen
          seasonFlow={seasonFlow}
          roundIndex={roundIndex}
          phaseIndex={phaseIndex}
          revealedNominees={revealedNominees}
          revealedVotes={revealedVotes}
          vetoDecisionRevealed={vetoDecisionRevealed}
          vetoReplacementRevealed={vetoReplacementRevealed}
          revealedFinal3={revealedFinal3}
          revealedFinalHohVote={revealedFinalHohVote}
          revealedJuryVotes={revealedJuryVotes}
          onAdvance={advanceSeasonFlow}
          onRevealNominee={revealNominee}
          onRevealVetoDecision={revealVetoDecision}
          onRevealReplacement={revealReplacement}
          onRevealVote={revealVote}
          onRevealFinal3Block={revealFinal3Block}
          onRevealFinalHohVote={revealFinalHohVote}
          onRevealJuryVote={revealJuryVote}
        />
      </div>
    </div>
  );
}
