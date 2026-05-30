"use client";

// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";
import EventScreen from "../../../components/survivor/EventScreen";



const CAST = [];

const TRIBE_COLORS = [
  "red", "orange", "yellow", "teal", "lime", "green", "forest green", "cyan", "blue",
  "navy", "indigo", "purple", "magenta", "pink", "gold", "tan", "brown", "white", "gray", "black",
];

const COLOR_STYLES = {
  red: { bg: "#ef4444", text: "#ffffff" },
  orange: { bg: "#f97316", text: "#111827" },
  yellow: { bg: "#ffff00", text: "#111827" },
  teal: { bg: "#14b8a6", text: "#111827" },
  lime: { bg: "#84cc16", text: "#111827" },
  green: { bg: "#22c55e", text: "#111827" },
  "forest green": { bg: "#166534", text: "#ffffff" },
  cyan: { bg: "#22d3ee", text: "#111827" },
  blue: { bg: "#3b82f6", text: "#ffffff" },
  navy: { bg: "#1e3a8a", text: "#ffffff" },
  indigo: { bg: "#4f46e5", text: "#ffffff" },
  purple: { bg: "#9333ea", text: "#ffffff" },
  magenta: { bg: "#d946ef", text: "#ffffff" },
  pink: { bg: "#ec4899", text: "#ffffff" },
  gold: { bg: "#d4af37", text: "#111827" },
  tan: { bg: "#d2b48c", text: "#111827" },
  brown: { bg: "#8b5e3c", text: "#ffffff" },
  white: { bg: "#f8fafc", text: "#111827", border: "#cbd5e1" },
  gray: { bg: "#6b7280", text: "#ffffff" },
  black: { bg: "#111827", text: "#ffffff" },
};

const FIJIAN_WORDS = ["Bula", "Vinaka", "Moce", "Yadra", "Sota", "Kerekere", "Sega", "Sautu", "Loma", "Wasawasa", "Vatu", "Wai", "Koro", "Vanua", "Kalou", "Drodro", "Mata", "Cagi", "Rarama", "Tadra"];
const MERGE_WORDS = ["Sautu", "Rarama", "Tadra", "Vanua", "Lomani", "Lagi", "Drodro"];
const CHALLENGE_TYPES = ["Obstacle + puzzle", "Swimming relay", "Memory challenge", "Balance course", "Maze + slide puzzle", "Sandbag target toss", "Strength gauntlet", "Blindfold caller challenge", "Endurance perch", "Water retrieval race"];

const PREMERGE_TWIST_OPTIONS = [
  { value: "normal", label: "Normal week" },
  { value: "tribe_swap", label: "Tribe swap" },
  { value: "double_tribal", label: "Double tribal" },
  { value: "joint_tribal", label: "Joint tribal" },
  { value: "rock_draw", label: "Rock Draw" },
  { value: "immunity_skip", label: "No tribal / all tribes safe" },
];
const POSTMERGE_TWIST_OPTIONS = [
  { value: "normal", label: "Normal week" },
  { value: "double_boot", label: "Double boot" },
  { value: "rock_draw", label: "Rock Draw" },
  { value: "safe_week", label: "No vote / everyone safe" },
];
const WEEKLY_POWER_OPTIONS = [
  { value: "none", label: "None" },
  { value: "steal_a_vote", label: "Steal a vote" },
  { value: "safety_without_power", label: "Safety Without Power" },
  { value: "vote_block", label: "Vote Block" },
  { value: "extra_vote", label: "Extra Vote" },
  { value: "super_idol", label: "Super Idol" },
  { value: "knowledge_is_power", label: "Knowledge Is Power" },
  { value: "rock_draw", label: "Rock Draw" },
];

const FINAL_THREE_SIZE = 3;
const DEFAULT_JURY_SIZE = 8;
const DEFAULT_IDOLS_ENABLED = true;
const DEFAULT_SITD_ENABLED = true;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function sample(array, count) { return shuffle(array).slice(0, count); }
function chunkEven(players, count) {
  const groups = Array.from({ length: count }, () => []);
  players.forEach((player, index) => groups[index % count].push(player));
  return groups;
}
function getColorStyle(color) { return COLOR_STYLES[color] || { bg: "#334155", text: "#ffffff" }; }
function flattenTribes(tribes) { return tribes.flatMap((tribe) => tribe.members); }
function countRemainingTribes(tribes) { return tribes.filter((tribe) => tribe.members.length > 0).length; }
function removeEmptyTribes(tribes) { return tribes.filter((tribe) => tribe.members.length > 0); }
function ordinal(num) {
  if (num % 100 >= 11 && num % 100 <= 13) return `${num}th`;
  if (num % 10 === 1) return `${num}st`;
  if (num % 10 === 2) return `${num}nd`;
  if (num % 10 === 3) return `${num}rd`;
  return `${num}th`;
}

function clonePlayer(player) {
  return {
    ...player,
    hasIdol: Number(player.hasIdol || 0),
    hasShotInTheDark: Number(player.hasShotInTheDark || 0),
    hasStealVote: Number(player.hasStealVote || 0),
    hasSafetyWithoutPower: Number(player.hasSafetyWithoutPower || 0),
    hasVoteBlock: Number(player.hasVoteBlock || 0),
    hasExtraVote: Number(player.hasExtraVote || 0),
    hasKnowledgeIsPower: Number(player.hasKnowledgeIsPower || 0),
    hasRockDrawPower: Number(player.hasRockDrawPower || 0),
    hasSuperIdol: Number(player.hasSuperIdol || 0),
    lostVote: Number(player.lostVote || 0),
    tribeHistory: player.tribeHistory ? [...player.tribeHistory] : [],
  };
}
function cloneTribe(tribe) { return { ...tribe, members: tribe.members.map(clonePlayer) }; }
function cloneTribes(tribes) { return tribes.map(cloneTribe); }

function getSelectedCastCount(settings) { return settings.enabledCastIds?.length || 0; }
function normalizeJurySizeForSettings(settings) {
  const castCount = Math.max(4, getSelectedCastCount(settings));
  return Math.max(1, Math.min(Number(settings.jurySize) || DEFAULT_JURY_SIZE, castCount - FINAL_THREE_SIZE));
}
function getMaxPremergeSwapTribeCount(settings) {
  const counts = (settings.preMergeTwists || []).filter((t) => t.type === "tribe_swap").map((t) => Math.max(2, Math.min(10, Number(t.tribeCount) || 2)));
  return Math.max(settings.startingTribes, ...counts, 2);
}

function computeWeekPlan(settings) {
  const castCount = Math.max(4, getSelectedCastCount(settings));
  const mergeAt = Math.max(FINAL_THREE_SIZE + 1, Math.min(Number(settings.mergeAt) || 12, castCount - 1));
  let players = castCount;
  let phase = players <= mergeAt ? "postmerge" : "premerge";
  let preWeek = 0;
  let postWeek = 0;
  const weeks = [];

  while (players > FINAL_THREE_SIZE) {
    if (phase === "premerge" && players <= mergeAt) phase = "postmerge";
    const globalWeek = weeks.length + 1;

    if (phase === "premerge") {
      preWeek += 1;
      const twist = (settings.preMergeTwists || []).find((item) => item.week === preWeek) || { type: "normal", tribeCount: settings.startingTribes };
      const powers = (settings.weeklyPowers || []).filter((item) => item.week === globalWeek);
      let boots = 1;
      if (twist.type === "double_tribal") boots = 2;
      if (twist.type === "immunity_skip") boots = 0;
      boots = Math.min(boots, Math.max(0, players - FINAL_THREE_SIZE));
      weeks.push({
        globalWeek,
        phase: "premerge",
        phaseWeek: preWeek,
        playersStart: players,
        playersEnd: players - boots,
        twistType: twist.type,
        twistLabel: PREMERGE_TWIST_OPTIONS.find((o) => o.value === twist.type)?.label || "Normal week",
        powers: powers.length ? powers : [{ id: `power_${globalWeek}_0`, week: globalWeek, type: "none", riskJourney: true }],
        tribeCount: Math.max(2, Math.min(10, Number(twist.tribeCount) || settings.startingTribes)),
      });
      players -= boots;
      if (players <= mergeAt) phase = "postmerge";
    } else {
      postWeek += 1;
      const twist = (settings.postMergeTwists || []).find((item) => item.week === postWeek) || { type: "normal" };
      const powers = (settings.weeklyPowers || []).filter((item) => item.week === globalWeek);
      let boots = 1;
      if (twist.type === "double_boot") boots = 2;
      if (twist.type === "safe_week") boots = 0;
      boots = Math.min(boots, Math.max(0, players - FINAL_THREE_SIZE));
      weeks.push({
        globalWeek,
        phase: "postmerge",
        phaseWeek: postWeek,
        playersStart: players,
        playersEnd: players - boots,
        twistType: twist.type,
        twistLabel: POSTMERGE_TWIST_OPTIONS.find((o) => o.value === twist.type)?.label || "Normal week",
        powers: powers.length ? powers : [{ id: `power_${globalWeek}_0`, week: globalWeek, type: "none", riskJourney: true }],
        tribeCount: null,
      });
      players -= boots;
    }

    if (weeks.length > 100) break;
  }

  return { weeks, mergeAt };
}

function createTribes(players, tribeCount, tribeDefinitions = null) {
  const realCount = Math.max(1, Math.min(tribeCount, players.length));
  const grouped = chunkEven(shuffle(players), realCount);
  let definitions = tribeDefinitions;
  if (!definitions) {
    const names = sample(FIJIAN_WORDS, realCount);
    const colors = sample(TRIBE_COLORS, realCount);
    definitions = Array.from({ length: realCount }, (_, i) => ({ id: `tribe_${i + 1}`, name: names[i], color: colors[i] }));
  }
  return grouped.filter((members) => members.length > 0).map((members, index) => {
    const def = definitions[index];
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      members: members.map((player) => ({
        ...player,
        currentTribe: def.id,
        currentTribeColor: def.color,
        originalTribe: player.originalTribe || def.id,
        tribeHistory: player.tribeHistory ? [...player.tribeHistory] : [],
      })),
    };
  });
}

function reassignAcrossTribes(activePlayers, tribeCount, activeDefinitions, allDefinitions) {
  const realCount = Math.max(1, Math.min(tribeCount, activePlayers.length));
  const grouped = chunkEven(shuffle(activePlayers), realCount);
  const activeIds = new Set(activeDefinitions.map((tribe) => tribe.id));
  const inactiveDefinitions = allDefinitions.filter((tribe) => !activeIds.has(tribe.id));
  const nextDefinitions = realCount <= activeDefinitions.length ? shuffle(activeDefinitions).slice(0, realCount) : [...activeDefinitions, ...inactiveDefinitions.slice(0, realCount - activeDefinitions.length)];

  return grouped.filter((members) => members.length > 0).map((members, index) => {
    const def = nextDefinitions[index];
    return {
      id: def.id,
      name: def.name,
      color: def.color,
      members: members.map((player) => ({
        ...player,
        currentTribe: def.id,
        currentTribeColor: def.color,
        tribeHistory: player.currentTribeColor ? [...(player.tribeHistory || []), player.currentTribeColor] : [...(player.tribeHistory || [])],
      })),
    };
  });
}

function createMergeTribe(tribes) {
  const usedColors = tribes.map((tribe) => tribe.color);
  const usedNames = tribes.map((tribe) => tribe.name);
  const mergeColor = sample(TRIBE_COLORS.filter((c) => !usedColors.includes(c)), 1)[0] || TRIBE_COLORS[0];
  const mergeName = sample(MERGE_WORDS.filter((n) => !usedNames.includes(n)), 1)[0] || "Merge";
  return {
    id: "merge",
    name: mergeName,
    color: mergeColor,
    members: flattenTribes(tribes).map((player) => ({
      ...player,
      currentTribe: "merge",
      currentTribeColor: mergeColor,
      tribeHistory: player.currentTribeColor ? [...(player.tribeHistory || []), player.currentTribeColor] : [...(player.tribeHistory || [])],
    })),
  };
}

function getWeekTwist(settings, phase, phaseWeek) {
  const list = phase === "premerge" ? settings.preMergeTwists : settings.postMergeTwists;
  return list.find((item) => item.week === phaseWeek) || null;
}
function getWeeklyPowers(settings, globalWeek) {
  const powers = (settings.weeklyPowers || []).filter((item) => item.week === globalWeek);
  return powers.length ? powers : [];
}

function initIdolState(tribeDefinitions) {
  return { camps: new Map(tribeDefinitions.map((tribe) => [tribe.id, { holderId: null, available: true }])), mergeActive: false };
}
function ensureMergeIdol(idolState) {
  if (!idolState.camps.has("merge")) idolState.camps.set("merge", { holderId: null, available: true });
  idolState.mergeActive = true;
}
function getIdolHolderCampId(playerId, idolState) {
  for (const [campId, camp] of idolState.camps.entries()) if (camp.holderId === playerId) return campId;
  return null;
}
function syncIdolFlags(players, idolState) {
  const holderIds = new Set(Array.from(idolState.camps.values()).map((camp) => camp.holderId).filter(Boolean));
  players.forEach((player) => {
    player.hasIdol = holderIds.has(player.id) ? 1 : 0;
  });
}
function searchForIdols(players, campIds, idolState) {
  const events = [];
  campIds.forEach((campId) => {
    const camp = idolState.camps.get(campId);
    if (!camp || !camp.available || camp.holderId) return;
    const eligible = players.filter((player) => player.currentTribe === campId || (campId === "merge" && player.currentTribe === "merge"));
    if (!eligible.length) return;
    if (Math.random() < 0.33) {
      const finder = eligible[Math.floor(Math.random() * eligible.length)];
      camp.holderId = finder.id;
      camp.available = false;
      syncIdolFlags(players, idolState);
      events.push({ finderName: finder.name });
    }
  });
  return events;
}
function releaseIdolFromPlayer(playerId, idolState, players = []) {
  for (const camp of idolState.camps.values()) {
    if (camp.holderId === playerId) {
      camp.holderId = null;
      camp.available = true;
    }
  }
  syncIdolFlags(players, idolState);
}

function createVoteContext(players, history, phase) {
  const recentTargets = new Map();
  const recentVotersAgainst = new Map();
  const trustPairs = new Map();
  const chaosIds = new Set();
  players.forEach((player) => {
    recentTargets.set(player.id, new Set(history.targetedByWinner.get(player.id) || []));
    recentVotersAgainst.set(player.id, new Set(history.votedAgainst.get(player.id) || []));
    trustPairs.set(player.id, new Set(history.votedWith.get(player.id) || []));
    if ((history.timesTargeted.get(player.id) || 0) >= 2) chaosIds.add(player.id);
  });
  return { sameTribe: phase === "premerge", postMerge: phase === "postmerge", recentTargets, recentVotersAgainst, trustPairs, chaosIds };
}

function scoreTargetForVoter(voter, target, relationships, context = {}) {
  const direct = relationships.get(`${voter.id}::${target.id}`) || 0;
  const reverse = relationships.get(`${target.id}::${voter.id}`) || 0;
  let score = 50 - (direct + reverse * 0.35) * 1.8;
  if (context.sameTribe && voter.currentTribe === target.currentTribe) score -= 5;
  if (context.postMerge && voter.originalTribe === target.originalTribe) score -= 3;
  if ((context.recentTargets?.get(voter.id) || new Set()).has(target.id)) score += 14;
  if ((context.recentVotersAgainst?.get(voter.id) || new Set()).has(target.id)) score += 18;
  if ((context.trustPairs?.get(voter.id) || new Set()).has(target.id)) score -= 12;
  if ((context.chaosIds || new Set()).has(target.id)) score += 4;
  score += Math.random() * 10;
  return score;
}

function buildVoteEntries(voters, targets, protectedIds = [], relationships = new Map(), context = {}) {
  const targetPool = targets.filter((player) => !protectedIds.includes(player.id));
  const votes = [];
  voters.forEach((voter) => {
    if (voter.noVoteLocked) {
      votes.push({
        revealKey: `vote_${voter.id}`,
        voterId: voter.id,
        voterName: voter.name,
        targetId: null,
        targetName: voter.voteBlocked ? "Vote Blocked" : "No vote",
        doesNotCount: false,
        noVote: true,
      });
      return;
    }
    const eligibleTargets = targetPool.filter((target) => target.id !== voter.id);
    if (!eligibleTargets.length) return;
    let bestTarget = eligibleTargets[0];
    let bestScore = -Infinity;
    eligibleTargets.forEach((target) => {
      const score = scoreTargetForVoter(voter, target, relationships, context);
      if (score > bestScore) { bestScore = score; bestTarget = target; }
    });
    votes.push({
      revealKey: `vote_${voter.id}`,
      voterId: voter.id,
      voterName: voter.name,
      targetId: bestTarget.id,
      targetName: bestTarget.name,
      doesNotCount: false,
      noVote: false,
    });
  });
  return votes;
}

function tallyVotes(voters, targets, protectedIds = [], relationships = new Map(), context = {}) {
  const votes = buildVoteEntries(voters, targets, protectedIds, relationships, context);
  const counts = new Map();
  votes.filter((vote) => !vote.noVote && vote.targetId).forEach((vote) => counts.set(vote.targetId, (counts.get(vote.targetId) || 0) + 1));
  const maxVotes = counts.size ? Math.max(...Array.from(counts.values())) : 0;
  const topIds = Array.from(counts.entries()).filter(([, count]) => count === maxVotes).map(([id]) => id);
  return { votes, maxVotes, topIds };
}

function countValidVotes(votes, protectedIds = []) {
  const counts = new Map();
  const validVotes = votes.filter((vote) => !vote.doesNotCount && !vote.noVote && vote.targetId && !protectedIds.includes(vote.targetId));
  validVotes.forEach((vote) => counts.set(vote.targetId, (counts.get(vote.targetId) || 0) + 1));
  const maxVotes = counts.size ? Math.max(...Array.from(counts.values())) : 0;
  const topIds = Array.from(counts.entries()).filter(([, count]) => count === maxVotes).map(([id]) => id);
  return { validVotes, counts, maxVotes, topIds };
}

function buildRockResult(participants, victim) {
  return participants.map((player) => ({ playerId: player.id, playerName: player.name, playerImage: player.image, rockColor: victim && player.id === victim.id ? "red" : "black" }));
}

function decideShotInTheDarkPlays(voters, voteList, playersRemaining) {
  if (playersRemaining < 7) return [];
  const current = countValidVotes(voteList, []);
  const plays = [];
  voters.forEach((player) => {
    if (Number(player.hasShotInTheDark || 0) <= 0) return;
    const threat = current.counts.get(player.id) || 0;
    const shouldPlay = threat >= 2 ? Math.random() < 0.32 : threat >= 1 ? Math.random() < 0.08 : false;
    if (!shouldPlay) return;
    const ownVote = voteList.find((vote) => vote.voterId === player.id);
    if (ownVote) {
      ownVote.noVote = true;
      ownVote.targetId = null;
      ownVote.targetName = "Shot in the Dark";
    }
    const safe = Math.floor(Math.random() * 6) === 0;
    player.hasShotInTheDark = Math.max(0, Number(player.hasShotInTheDark || 0) - 1);
    const real = voters.find(p => p.id === player.id);
    if (real) real.hasShotInTheDark = Math.max(0, Number(real.hasShotInTheDark || 0) - 1);
    plays.push({ byPlayerId: player.id, byPlayerName: player.name, safe });
  });
  return plays;
}

function decideIdolPlays(voters, voteList, idolState, relationships, playersRemaining) {
  if (playersRemaining < 5) return [];
  const idolHolders = voters.filter((player) => getIdolHolderCampId(player.id, idolState));
  const plays = [];
  idolHolders.forEach((holder) => {
    const current = countValidVotes(voteList, []);
    if (!current.validVotes.length) return;
    const threatened = voters.map((player) => ({ player, votes: current.counts.get(player.id) || 0 })).filter((item) => item.votes > 0).sort((a, b) => b.votes - a.votes);
    const selfThreat = threatened.find((item) => item.player.id === holder.id);
    let target = null;
    if (selfThreat) {
      if (selfThreat.votes >= 3 && Math.random() < 0.75) target = holder;
      else if (selfThreat.votes >= 2 && Math.random() < 0.65) target = holder;
      else if (selfThreat.votes >= 1 && Math.random() < 0.35) target = holder;
    } else {
      const avgTrust = voters.reduce((sum, p) => p.id === holder.id ? sum : sum + (relationships.get(`${holder.id}::${p.id}`) || 0), 0) / Math.max(1, voters.length - 1);
      if (Math.random() < (avgTrust < 0 ? 0.12 : 0.05)) target = holder;
    }
    if (!target && !selfThreat) {
      let bestAlly = null;
      let bestScore = 10;
      threatened.forEach((item) => {
        if (item.player.id === holder.id || item.votes < 2) return;
        const rel = (relationships.get(`${holder.id}::${item.player.id}`) || 0) + (relationships.get(`${item.player.id}::${holder.id}`) || 0);
        const score = rel * 2 + item.votes;
        if (rel >= 6 && score > bestScore && Math.random() < 0.08) { bestScore = score; bestAlly = item.player; }
      });
      target = bestAlly;
    }
    if (!target) return;
    const holderVote = voteList.find((vote) => vote.voterId === holder.id);
    if (holderVote && holderVote.targetId === target.id) {
      const alternatives = voters.filter((player) => player.id !== holder.id && player.id !== target.id);
      if (alternatives.length) {
        let bestAlt = alternatives[0];
        let bestAltScore = -Infinity;
        alternatives.forEach((candidate) => {
          const score = scoreTargetForVoter(holder, candidate, relationships, { sameTribe: false, postMerge: false, recentTargets: new Map(), recentVotersAgainst: new Map(), trustPairs: new Map(), chaosIds: new Set() });
          if (score > bestAltScore) { bestAltScore = score; bestAlt = candidate; }
        });
        holderVote.targetId = bestAlt.id;
        holderVote.targetName = bestAlt.name;
      }
    }
    voteList.forEach((vote) => { if (vote.targetId === target.id) vote.doesNotCount = true; });
    const camp = idolState.camps.get(getIdolHolderCampId(holder.id, idolState));
    if (camp) { camp.holderId = null; camp.available = true; }
    syncIdolFlags(voters, idolState);
    plays.push({ byPlayerId: holder.id, byPlayerName: holder.name, targetId: target.id, targetName: target.name });
  });
  return plays;
}

function createStealAVoteJourneyParticipants(tribes) {
  return tribes.map((tribe) => tribe.members.length ? tribe.members[Math.floor(Math.random() * tribe.members.length)] : null).filter(Boolean);
}
function resolveStealAVoteJourney(participants, riskJourney = true) {
  const decisions = participants.map((player) => ({
    playerId: player.id,
    playerName: player.name,
    choice: riskJourney ? (Math.random() < 0.62 ? "risk" : "leave") : "compete",
  }));
  const competitors = riskJourney ? decisions.filter((item) => item.choice === "risk") : decisions;
  const winnerId = competitors.length ? competitors[Math.floor(Math.random() * competitors.length)].playerId : null;
  return {
    participants: participants.map(clonePlayer),
    decisions,
    winnerId,
    losersLoseVoteIds: riskJourney ? competitors.filter((item) => item.playerId !== winnerId).map((item) => item.playerId) : [],
    riskJourney,
  };
}

function applyWeeklyPowerResult(result, players, powerType = "steal_a_vote") {
  if (!result) return;
  players.forEach((player) => {
    if (result.winnerId === player.id) {
      if (powerType === "steal_a_vote") player.hasStealVote = Number(player.hasStealVote || 0) + 1;
      if (powerType === "safety_without_power") player.hasSafetyWithoutPower = Number(player.hasSafetyWithoutPower || 0) + 1;
      if (powerType === "vote_block") player.hasVoteBlock = Number(player.hasVoteBlock || 0) + 1;
      if (powerType === "extra_vote") player.hasExtraVote = Number(player.hasExtraVote || 0) + 1;
      if (powerType === "super_idol") player.hasSuperIdol = Number(player.hasSuperIdol || 0) + 1;
      if (powerType === "knowledge_is_power") player.hasKnowledgeIsPower = Number(player.hasKnowledgeIsPower || 0) + 1;
      if (powerType === "rock_draw") player.hasRockDrawPower = Number(player.hasRockDrawPower || 0) + 1;
    }
    if (result.losersLoseVoteIds?.includes(player.id)) player.lostVote = Number(player.lostVote || 0) + 1;
  });
}
function maybeUseStealVote(voters, targets, relationships, context, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasStealVote || 0) > 0);
  for (const holder of holders) {
    if (Math.random() >= 0.28) continue;
    const stealFromPool = voters.filter((player) => player.id !== holder.id && !player.noVoteLocked);
    if (!stealFromPool.length) continue;
    const stolenPlayer = stealFromPool[Math.floor(Math.random() * stealFromPool.length)];
    const holderTargets = targets.filter((player) => player.id !== holder.id);
    if (!holderTargets.length) continue;
    let bestTarget = holderTargets[0];
    let bestScore = -Infinity;
    holderTargets.forEach((candidate) => {
      const score = scoreTargetForVoter(holder, candidate, relationships, context);
      if (score > bestScore) { bestScore = score; bestTarget = candidate; }
    });
    holder.hasStealVote = Math.max(0, Number(holder.hasStealVote || 0) - 1);
    return { byPlayerId: holder.id, byPlayerName: holder.name, stolenFromId: stolenPlayer.id, stolenFromName: stolenPlayer.name, extraTargetId: bestTarget.id, extraTargetName: bestTarget.name };
  }
  return null;
}

function maybeUseSafetyWithoutPower(voters, relationships, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasSafetyWithoutPower || 0) > 0);
  if (!holders.length) return null;

  let bestHolder = null;
  let bestChance = 0;
  holders.forEach((holder) => {
    const avgTrust = voters.reduce((sum, p) => (p.id === holder.id ? sum : sum + (relationships.get(`${holder.id}::${p.id}`) || 0)), 0) / Math.max(1, voters.length - 1);
    const paranoiaBoost = avgTrust < 0 ? 0.18 : 0.08;
    const chance = 0.18 + paranoiaBoost;
    if (Math.random() < chance && chance > bestChance) {
      bestHolder = holder;
      bestChance = chance;
    }
  });

  if (!bestHolder) return null;
  bestHolder.hasSafetyWithoutPower = Math.max(0, Number(bestHolder.hasSafetyWithoutPower || 0) - 1);
  return { playerId: bestHolder.id, playerName: bestHolder.name };
}

function maybeUseVoteBlock(voters, targets, relationships, context, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasVoteBlock || 0) > 0);
  for (const holder of holders) {
    if (Math.random() >= 0.28) continue;
    const candidates = voters.filter((player) => player.id !== holder.id);
    if (!candidates.length) continue;
    let bestTarget = candidates[0];
    let bestScore = -Infinity;
    candidates.forEach((candidate) => {
      const score = scoreTargetForVoter(holder, candidate, relationships, context);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = candidate;
      }
    });
    holder.hasVoteBlock = Math.max(0, Number(holder.hasVoteBlock || 0) - 1);
    return {
      byPlayerId: holder.id,
      byPlayerName: holder.name,
      blockedPlayerId: bestTarget.id,
      blockedPlayerName: bestTarget.name,
    };
  }
  return null;
}

function maybeUseExtraVote(voters, targets, relationships, context, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasExtraVote || 0) > 0);
  for (const holder of holders) {
    if (Math.random() >= 0.28) continue;
    const options = targets.filter((target) => target.id !== holder.id);
    if (!options.length) continue;
    let bestTarget = options[0];
    let bestScore = -Infinity;
    options.forEach((candidate) => {
      const score = scoreTargetForVoter(holder, candidate, relationships, context);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = candidate;
      }
    });
    holder.hasExtraVote = Math.max(0, Number(holder.hasExtraVote || 0) - 1);
    return {
      byPlayerId: holder.id,
      byPlayerName: holder.name,
      targetId: bestTarget.id,
      targetName: bestTarget.name,
    };
  }
  return null;
}

function maybeUseKnowledgeIsPower(voters, players, relationships, context, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasKnowledgeIsPower || 0) > 0);
  if (!holders.length) return null;

  for (const holder of holders) {
    if (Math.random() > 0.35) continue;
    const candidates = players.filter((player) => player.id !== holder.id);
    if (!candidates.length) continue;

    let best = null;
    let bestScore = -Infinity;
    candidates.forEach((candidate) => {
      const rel = relationships.get(`${holder.id}::${candidate.id}`) || 0;
      const threat = (context?.chaosIds?.has(candidate.id) ? 3 : 0) + ((context?.recentTargets?.get(holder.id) || new Set()).has(candidate.id) ? 2 : 0);
      const score = (-rel) + threat + Math.random();
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });
    if (!best) continue;

    const guessPool = [
      "hasIdol", "hasIdol", "hasIdol",
      "hasSuperIdol",
      "hasExtraVote",
      "hasVoteBlock",
      "hasStealVote",
      "hasSafetyWithoutPower",
      "hasKnowledgeIsPower",
    ];
    const guessed = guessPool[Math.floor(Math.random() * guessPool.length)];
    const success = Number(best[guessed] || 0) > 0;

    if (success) {
      if (guessed === "hasIdol") {
        best.hasIdol = false;
        holder.hasIdol = true;
      } else {
        best[guessed] = Math.max(0, Number(best[guessed] || 0) - 1);
        holder[guessed] = Number(holder[guessed] || 0) + 1;
      }
    }

    holder.hasKnowledgeIsPower = Math.max(0, Number(holder.hasKnowledgeIsPower || 0) - 1);
    return {
      byPlayerId: holder.id,
      byPlayerName: holder.name,
      targetId: best.id,
      targetName: best.name,
      guessed,
      success,
    };
  }

  return null;
}

function maybeUseRockDrawPower(voters, playersRemaining) {
  if (playersRemaining <= 6) return null;
  const holders = voters.filter((player) => Number(player.hasRockDrawPower || 0) > 0);
  for (const holder of holders) {
    if (Math.random() > 0.28) continue;
    holder.hasRockDrawPower = Math.max(0, Number(holder.hasRockDrawPower || 0) - 1);
    return { byPlayerId: holder.id, byPlayerName: holder.name };
  }
  return null;
}

function decideRockProtectionPlays(voters, idolState, relationships, playersRemaining) {
  const idolPlays = [];
  let superIdolPlay = null;
  const safeIds = [];

  voters.forEach((holder) => {
    const hasRegularIdol = !!getIdolHolderCampId(holder.id, idolState);
    const hasSuperIdol = Number(holder.hasSuperIdol || 0) > 0;
    if (!hasRegularIdol && !hasSuperIdol) return;

    let target = null;
    if (Math.random() < 0.65) {
      target = holder;
    } else {
      let bestAlly = null;
      let bestRel = -Infinity;
      voters.forEach((candidate) => {
        if (candidate.id === holder.id) return;
        const rel = (relationships.get(`${holder.id}::${candidate.id}`) || 0) + (relationships.get(`${candidate.id}::${holder.id}`) || 0);
        if (rel > bestRel) {
          bestRel = rel;
          bestAlly = candidate;
        }
      });
      if (bestAlly && bestRel >= 8 && Math.random() < 0.2) target = bestAlly;
    }

    if (!target) return;

    if (hasRegularIdol) {
      const camp = idolState.camps.get(getIdolHolderCampId(holder.id, idolState));
      if (camp) {
        camp.holderId = null;
        camp.available = true;
      }
      idolPlays.push({ byPlayerId: holder.id, byPlayerName: holder.name, targetId: target.id, targetName: target.name });
      safeIds.push(target.id);
      return;
    }

    if (!superIdolPlay && hasSuperIdol) {
      holder.hasSuperIdol = Math.max(0, Number(holder.hasSuperIdol || 0) - 1);
      superIdolPlay = { byPlayerId: holder.id, byPlayerName: holder.name, targetId: target.id, targetName: target.name };
      safeIds.push(target.id);
    }
  });

  return { idolPlays, superIdolPlay, safeIds: [...new Set(safeIds)] };
}

function resolveForcedRockDraw({ players, immuneIds = [], relationships = new Map(), idolState = null }) {
  const baseSafeIds = [...new Set(immuneIds)];
  const rockProtection = idolState ? decideRockProtectionPlays(players, idolState, relationships, players.length) : { idolPlays: [], superIdolPlay: null, safeIds: [] };
  const allSafeIds = [...new Set([...baseSafeIds, ...rockProtection.safeIds])];
  const rockParticipants = players.filter((player) => !allSafeIds.includes(player.id));
  const victim = rockParticipants[Math.floor(Math.random() * rockParticipants.length)] || null;
  if (idolState) syncIdolFlags(players, idolState);
  return {
    votes: [],
    revote: [],
    initialTie: false,
    revoteUsed: true,
    rockDraw: true,
    rockDrawPowerPlay: null,
    tieNames: [],
    tieVoteCount: 0,
    tiedPlayers: [],
    rockParticipants,
    rockResult: buildRockResult(rockParticipants, victim),
    eliminated: victim,
    autoElimination: false,
    idolPlays: rockProtection.idolPlays,
    superIdolPlay: rockProtection.superIdolPlay,
    shotInDarkPlays: [],
    safeIds: allSafeIds,
    stealVotePlay: null,
    safetyWithoutPowerPlay: null,
    voteBlockPlay: null,
    extraVotePlay: null,
    knowledgeIsPowerPlay: null,
  };
}

function maybeUseSuperIdol(voters, counts, targets, relationships, playersRemaining) {
  if (playersRemaining < 6) return null;
  const holders = voters.filter((player) => Number(player.hasSuperIdol || 0) > 0);
  if (!holders.length || !counts.size) return null;

  const maxVotes = Math.max(...Array.from(counts.values()));
  if (maxVotes <= 0) return null;
  const topTargets = targets.filter((player) => counts.get(player.id) === maxVotes);
  if (!topTargets.length) return null;

  for (const holder of holders) {
    const selfVotes = counts.get(holder.id) || 0;
    if (selfVotes === maxVotes && selfVotes > 0) {
      
      return { byPlayerId: holder.id, byPlayerName: holder.name, targetId: holder.id, targetName: holder.name };
    }
  }

  for (const holder of holders) {
    let bestAlly = null;
    let bestRel = -Infinity;
    topTargets.forEach((candidate) => {
      if (candidate.id === holder.id) return;
      const rel = (relationships.get(`${holder.id}::${candidate.id}`) || 0) + (relationships.get(`${candidate.id}::${holder.id}`) || 0);
      if (rel > bestRel) {
        bestRel = rel;
        bestAlly = candidate;
      }
    });
    if (bestAlly && bestRel >= 10 && Math.random() < 0.2) {
      
      return { byPlayerId: holder.id, byPlayerName: holder.name, targetId: bestAlly.id, targetName: bestAlly.name };
    }
  }
  return null;
}

function finalizeVoteFromVotes({ voters, targets, votes, immuneId = null, extraSafeIds = [], relationships = new Map(), context = {} }) {
  const protectedIds = [...(immuneId ? [immuneId] : []), ...extraSafeIds];
  const eligibleTargets = targets.filter((player) => !protectedIds.includes(player.id));
  const base = { votes, revote: [], initialTie: false, revoteUsed: false, rockDraw: false, tieNames: [], tieVoteCount: 0, tiedPlayers: [], rockParticipants: [], rockResult: [], eliminated: null, autoElimination: false };
  if (eligibleTargets.length === 0) return base;
  if (eligibleTargets.length === 1) return { ...base, eliminated: eligibleTargets[0], autoElimination: true, tiedPlayers: [eligibleTargets[0]] };
  const first = countValidVotes(votes, protectedIds);
  if (first.topIds.length <= 1) {
    const eliminated = first.topIds.length === 1 ? targets.find((player) => player.id === first.topIds[0]) || null : eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
    return { ...base, eliminated, tieVoteCount: first.maxVotes };
  }
  const tiedPlayers = targets.filter((player) => first.topIds.includes(player.id));
  const allEligibleTied = tiedPlayers.length === eligibleTargets.length;
  const revoters = voters.filter((player) => !first.topIds.includes(player.id));
  if (allEligibleTied || revoters.length === 0) {
    const rockParticipants = allEligibleTied ? eligibleTargets.filter((player) => !protectedIds.includes(player.id)) : voters.filter((player) => !first.topIds.includes(player.id) && !protectedIds.includes(player.id));
    const victim = rockParticipants[Math.floor(Math.random() * rockParticipants.length)] || null;
    return { ...base, initialTie: true, revoteUsed: true, rockDraw: true, tieNames: tiedPlayers.map((p) => p.name), tieVoteCount: first.maxVotes, tiedPlayers, rockParticipants, rockResult: buildRockResult(rockParticipants, victim), eliminated: victim };
  }
  const revoteTally = tallyVotes(revoters, tiedPlayers, protectedIds, relationships, context);
  const revoteCounts = new Map();
  revoteTally.votes.filter((vote) => vote.targetId).forEach((vote) => revoteCounts.set(vote.targetId, (revoteCounts.get(vote.targetId) || 0) + 1));
  const revoteMax = revoteCounts.size ? Math.max(...Array.from(revoteCounts.values())) : 0;
  const revoteTopIds = Array.from(revoteCounts.entries()).filter(([, count]) => count === revoteMax).map(([id]) => id);
  if (revoteTopIds.length === 1) {
    return { ...base, revote: revoteTally.votes, initialTie: true, revoteUsed: true, tieNames: tiedPlayers.map((p) => p.name), tieVoteCount: first.maxVotes, tiedPlayers, eliminated: tiedPlayers.find((player) => player.id === revoteTopIds[0]) || null };
  }
  const rockParticipants = voters.filter((player) => !revoteTopIds.includes(player.id) && !protectedIds.includes(player.id));
  const victim = rockParticipants[Math.floor(Math.random() * rockParticipants.length)] || null;
  return { ...base, revote: revoteTally.votes, initialTie: true, revoteUsed: true, rockDraw: true, tieNames: tiedPlayers.map((p) => p.name), tieVoteCount: first.maxVotes, tiedPlayers, rockParticipants, rockResult: buildRockResult(rockParticipants, victim), eliminated: victim };
}

function resolveVote({ voters, targets, immuneId = null, relationships = new Map(), context = {}, idolState = null, playersRemaining = 99 }) {
  const protectedIds = immuneId ? [immuneId] : [];
  const eligibleTargets = targets.filter((player) => !protectedIds.includes(player.id));
  const empty = { votes: [], revote: [], initialTie: false, revoteUsed: false, rockDraw: false, rockDrawPowerPlay: null, tieNames: [], tieVoteCount: 0, tiedPlayers: [], rockParticipants: [], rockResult: [], eliminated: null, autoElimination: false, idolPlays: [], superIdolPlay: null, shotInDarkPlays: [], safeIds: [], stealVotePlay: null, safetyWithoutPowerPlay: null, voteBlockPlay: null, extraVotePlay: null, knowledgeIsPowerPlay: null };
  if (eligibleTargets.length === 0) return empty;
  if (eligibleTargets.length === 1) return { ...empty, eliminated: eligibleTargets[0], autoElimination: true, tiedPlayers: [eligibleTargets[0]] };
  if (eligibleTargets.length === 2) {
    const victim = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
    return { ...empty, initialTie: true, revoteUsed: true, rockDraw: true, tieNames: eligibleTargets.map((p) => p.name), tieVoteCount: 1, tiedPlayers: eligibleTargets, rockParticipants: eligibleTargets, rockResult: buildRockResult(eligibleTargets, victim), eliminated: victim };
  }

  const realVoters = voters;
  const workingVoters = voters.map((player) => ({ ...player, noVoteLocked: Number(player.lostVote || 0) > 0, voteBlocked: false }));
  const safetyWithoutPowerPlay = maybeUseSafetyWithoutPower(workingVoters, relationships, playersRemaining);
  let adjustedTargets = targets;
  if (safetyWithoutPowerPlay) {
    adjustedTargets = targets.filter((player) => player.id !== safetyWithoutPowerPlay.playerId);
    const index = workingVoters.findIndex((player) => player.id === safetyWithoutPowerPlay.playerId);
    if (index !== -1) workingVoters.splice(index, 1);
    const realHolder = realVoters.find((player) => player.id === safetyWithoutPowerPlay.playerId);
    if (realHolder) realHolder.hasSafetyWithoutPower = Math.max(0, Number(realHolder.hasSafetyWithoutPower || 0) - 1);
  }

  const rockDrawPowerPlay = maybeUseRockDrawPower(workingVoters, playersRemaining);
  if (rockDrawPowerPlay) {
    const realHolder = realVoters.find((player) => player.id === rockDrawPowerPlay.byPlayerId);
    if (realHolder) realHolder.hasRockDrawPower = Math.max(0, Number(realHolder.hasRockDrawPower || 0) - 1);
  }

  const voteBlockPlay = rockDrawPowerPlay ? null : maybeUseVoteBlock(workingVoters, adjustedTargets, relationships, context, playersRemaining);
  const knowledgeIsPowerPlay = rockDrawPowerPlay ? null : maybeUseKnowledgeIsPower(workingVoters, adjustedTargets, relationships, context, playersRemaining);

  if (knowledgeIsPowerPlay) {
    const realHolder = realVoters.find((player) => player.id === knowledgeIsPowerPlay.byPlayerId);
    const realTarget = realVoters.find((player) => player.id === knowledgeIsPowerPlay.targetId);
    if (realHolder) realHolder.hasKnowledgeIsPower = Math.max(0, Number(realHolder.hasKnowledgeIsPower || 0) - 1);
    if (knowledgeIsPowerPlay.success && realHolder && realTarget) {
      if (knowledgeIsPowerPlay.guessed === "hasIdol") {
        realTarget.hasIdol = false;
        realHolder.hasIdol = true;
      } else {
        realTarget[knowledgeIsPowerPlay.guessed] = Math.max(0, Number(realTarget[knowledgeIsPowerPlay.guessed] || 0) - 1);
        realHolder[knowledgeIsPowerPlay.guessed] = Number(realHolder[knowledgeIsPowerPlay.guessed] || 0) + 1;
      }
    }
  }
  if (voteBlockPlay) {
    const blocked = workingVoters.find((player) => player.id === voteBlockPlay.blockedPlayerId);
    if (blocked) {
      blocked.noVoteLocked = true;
      blocked.voteBlocked = true;
    }
    const realHolder = realVoters.find((player) => player.id === voteBlockPlay.byPlayerId);
    if (realHolder) realHolder.hasVoteBlock = Math.max(0, Number(realHolder.hasVoteBlock || 0) - 1);
  }

  const extraVotePlay = maybeUseExtraVote(workingVoters, adjustedTargets, relationships, context, playersRemaining);
  if (extraVotePlay) {
    const realHolder = realVoters.find((player) => player.id === extraVotePlay.byPlayerId);
    if (realHolder) {
      realHolder.hasExtraVote = Math.max(0, Number(realHolder.hasExtraVote || 0) - 1);
    }
    const workingHolder = workingVoters.find((player) => player.id === extraVotePlay.byPlayerId);
    if (workingHolder) {
      workingHolder.hasExtraVote = false;
    }
  }

  if (rockDrawPowerPlay) {
    const forcedSafeIds = [rockDrawPowerPlay.byPlayerId, ...(immuneId ? [immuneId] : [])];
    const rockProtection = idolState ? decideRockProtectionPlays(workingVoters, idolState, relationships, playersRemaining) : { idolPlays: [], superIdolPlay: null, safeIds: [] };
    const allSafeIds = [...new Set([...forcedSafeIds, ...rockProtection.safeIds])];
    const rockParticipants = adjustedTargets.filter((player) => !allSafeIds.includes(player.id));
    const victim = rockParticipants[Math.floor(Math.random() * rockParticipants.length)] || null;
    syncIdolFlags(realVoters, idolState || { camps: new Map() });
    return {
      ...empty,
      rockDraw: true,
      revoteUsed: true,
      rockDrawPowerPlay,
      idolPlays: rockProtection.idolPlays,
      superIdolPlay: rockProtection.superIdolPlay,
      safeIds: allSafeIds,
      rockParticipants,
      rockResult: buildRockResult(rockParticipants, victim),
      eliminated: victim,
    };
  }

  const stealVotePlay = maybeUseStealVote(workingVoters, adjustedTargets, relationships, context, playersRemaining);
  if (stealVotePlay) {
    const stolen = workingVoters.find((player) => player.id === stealVotePlay.stolenFromId);
    if (stolen) stolen.noVoteLocked = true;
    const realHolder = realVoters.find((player) => player.id === stealVotePlay.byPlayerId);
    if (realHolder) realHolder.hasStealVote = Math.max(0, Number(realHolder.hasStealVote || 0) - 1);
  }
  realVoters.forEach((player) => {
    const currentLostVote = Number(player.lostVote || 0);
    if (currentLostVote > 0) player.lostVote = currentLostVote - 1;
  });

  const initialTally = tallyVotes(workingVoters, adjustedTargets, protectedIds, relationships, context);
  const markedVotes = initialTally.votes.map((vote) => ({ ...vote, doesNotCount: false, noVote: !!vote.noVote }));
  if (stealVotePlay) {
    markedVotes.push({ revealKey: `stolen_${stealVotePlay.byPlayerId}_${stealVotePlay.stolenFromId}`, voterId: stealVotePlay.byPlayerId, voterName: `${stealVotePlay.byPlayerName} (stolen vote)`, targetId: stealVotePlay.extraTargetId, targetName: stealVotePlay.extraTargetName, doesNotCount: false, noVote: false });
  }
  if (extraVotePlay) {
    markedVotes.push({ revealKey: `extra_${extraVotePlay.byPlayerId}`, voterId: extraVotePlay.byPlayerId, voterName: `${extraVotePlay.byPlayerName} (extra vote)`, targetId: extraVotePlay.targetId, targetName: extraVotePlay.targetName, doesNotCount: false, noVote: false });
  }
  const shotInDarkPlays = decideShotInTheDarkPlays(workingVoters, markedVotes, playersRemaining);
  shotInDarkPlays.forEach((play) => {
    const realPlayer = realVoters.find((player) => player.id === play.byPlayerId);
    if (realPlayer) realPlayer.hasShotInTheDark = false;
  });
  const sitdSafeIds = shotInDarkPlays.filter((play) => play.safe).map((play) => play.byPlayerId);
  markedVotes.forEach((vote) => { if (sitdSafeIds.includes(vote.targetId)) vote.doesNotCount = true; });
  const idolPlays = idolState ? decideIdolPlays(workingVoters, markedVotes, idolState, relationships, playersRemaining) : [];
  let safeIds = [...new Set([...sitdSafeIds, ...idolPlays.map((play) => play.targetId)])];
  let finalVote = finalizeVoteFromVotes({ voters: workingVoters, targets: adjustedTargets, votes: markedVotes, immuneId, extraSafeIds: safeIds, relationships, context });

  const postCounts = countValidVotes(markedVotes, [...protectedIds, ...safeIds]);
  const superIdolPlay = maybeUseSuperIdol(workingVoters, postCounts.counts, adjustedTargets, relationships, playersRemaining);
  if (superIdolPlay) {
    safeIds = [...new Set([...safeIds, superIdolPlay.targetId])];
    markedVotes.forEach((vote) => {
      if (vote.targetId === superIdolPlay.targetId) vote.doesNotCount = true;
    });
    finalVote = finalizeVoteFromVotes({ voters: workingVoters, targets: adjustedTargets, votes: markedVotes, immuneId, extraSafeIds: safeIds, relationships, context });
    const realHolder = realVoters.find((player) => player.id === superIdolPlay.byPlayerId);
    if (realHolder) {
      realHolder.hasSuperIdol = Math.max(0, Number(realHolder.hasSuperIdol || 0) - 1);
    }
  }

  return { ...finalVote, idolPlays, superIdolPlay, shotInDarkPlays, safeIds, stealVotePlay, safetyWithoutPowerPlay, voteBlockPlay, extraVotePlay, knowledgeIsPowerPlay, rockDrawPowerPlay };
}

function eliminatedMeta(eliminated, placementNumber, juryStartsAtPlacement) {
  if (!eliminated) return null;
  return { ...eliminated, placement: ordinal(placementNumber), status: placementNumber <= juryStartsAtPlacement && placementNumber > FINAL_THREE_SIZE ? "jury" : "out" };
}

function buildFullCastWithEliminated(tribes, eliminated, tribeId = null) {
  if (!eliminated) return tribes.map((tribe) => ({ ...tribe }));
  return tribes.map((tribe) => {
    if (tribeId && tribe.id !== tribeId) return { ...tribe };
    const hasAlready = tribe.members.some((player) => player.id === eliminated.id);
    return { ...tribe, members: hasAlready ? [...tribe.members] : [...tribe.members, eliminated] };
  });
}

function initRelationships(players) {
  const map = new Map();
  players.forEach((a) => players.forEach((b) => { if (a.id !== b.id) map.set(`${a.id}::${b.id}`, Math.floor(Math.random() * 7) - 3); }));
  return map;
}
function applyVoteRelationshipEffects(relationships, voters, vote, eliminatedId = null) {
  vote.votes.filter((item) => item.targetId).forEach((item) => {
    relationships.set(`${item.voterId}::${item.targetId}`, Math.max(-12, Math.min(12, (relationships.get(`${item.voterId}::${item.targetId}`) || 0) - 2)));
    relationships.set(`${item.targetId}::${item.voterId}`, Math.max(-12, Math.min(12, (relationships.get(`${item.targetId}::${item.voterId}`) || 0) - 3)));
  });
  if (eliminatedId) voters.forEach((voter) => { if (voter.id !== eliminatedId) relationships.set(`${eliminatedId}::${voter.id}`, Math.max(-12, Math.min(12, (relationships.get(`${eliminatedId}::${voter.id}`) || 0) - 1))); });
}
function updateVoteHistory(history, vote, voters, eliminatedId = null) {
  vote.votes.filter((item) => item.targetId).forEach((item) => {
    if (!history.votedAgainst.has(item.targetId)) history.votedAgainst.set(item.targetId, new Set());
    history.votedAgainst.get(item.targetId).add(item.voterId);
    history.timesTargeted.set(item.targetId, (history.timesTargeted.get(item.targetId) || 0) + 1);
  });
  voters.forEach((a) => voters.forEach((b) => {
    if (a.id >= b.id) return;
    const aVote = vote.votes.find((item) => item.voterId === a.id)?.targetId;
    const bVote = vote.votes.find((item) => item.voterId === b.id)?.targetId;
    if (aVote && bVote && aVote === bVote) {
      if (!history.votedWith.has(a.id)) history.votedWith.set(a.id, new Set());
      if (!history.votedWith.has(b.id)) history.votedWith.set(b.id, new Set());
      history.votedWith.get(a.id).add(b.id);
      history.votedWith.get(b.id).add(a.id);
    }
  }));
  if (eliminatedId) voters.forEach((voter) => {
    if (voter.id === eliminatedId) return;
    if (!history.targetedByWinner.has(voter.id)) history.targetedByWinner.set(voter.id, new Set());
    history.targetedByWinner.get(voter.id).add(eliminatedId);
  });
}

function buildJuryVoteReveal(jury, finalists, relationships = new Map()) {
  return jury.map((juror) => {
    let bestTarget = finalists[0];
    let bestScore = -Infinity;
    finalists.forEach((finalist) => {
      const score = (relationships.get(`${juror.id}::${finalist.id}`) || 0) + (relationships.get(`${finalist.id}::${juror.id}`) || 0) * 0.25 + Math.random() * 2;
      if (score > bestScore) { bestScore = score; bestTarget = finalist; }
    });
    return { voterId: juror.id, voterName: juror.name, targetId: bestTarget.id, targetName: bestTarget.name };
  });
}

function resolveFinalJuryOutcome(jury, finalists, relationships = new Map()) {
  const initialVotes = buildJuryVoteReveal(jury, finalists, relationships);
  const initialCounts = finalists.map((finalist) => ({ finalist, votes: initialVotes.filter((vote) => vote.targetId === finalist.id).length }));
  const maxVotes = Math.max(...initialCounts.map((count) => count.votes));
  const leaders = initialCounts.filter((count) => count.votes === maxVotes);
  if (leaders.length !== 2) {
    const winner = leaders[Math.floor(Math.random() * leaders.length)]?.finalist || finalists[0];
    return { jury, juryVotes: initialVotes, counts: initialCounts, winner, finalTie: false, tiebreakJuror: null, tiebreakVote: null, tiebreakFinalists: [] };
  }
  const nonTied = initialCounts.filter((count) => !leaders.some((leader) => leader.finalist.id === count.finalist.id));
  if (nonTied.length !== 1) {
    const winner = leaders[Math.floor(Math.random() * leaders.length)]?.finalist || finalists[0];
    return { jury, juryVotes: initialVotes, counts: initialCounts, winner, finalTie: false, tiebreakJuror: null, tiebreakVote: null, tiebreakFinalists: [] };
  }
  const tiebreakJuror = nonTied[0].finalist;
  const tiebreakFinalists = leaders.map((leader) => leader.finalist);
  const chosenFinalist = tiebreakFinalists[Math.floor(Math.random() * tiebreakFinalists.length)];
  const tiebreakVote = { voterId: tiebreakJuror.id, voterName: tiebreakJuror.name, targetId: chosenFinalist.id, targetName: chosenFinalist.name };
  const finalVotes = [...initialVotes, tiebreakVote];
  const finalCounts = finalists.map((finalist) => ({ finalist, votes: finalVotes.filter((vote) => vote.targetId === finalist.id).length }));
  return { jury: [...jury, tiebreakJuror], juryVotes: finalVotes, counts: finalCounts, winner: chosenFinalist, finalTie: true, tiebreakJuror, tiebreakVote, tiebreakFinalists };
}


function createCustomStartingTribes(players, tribeCount, tribeDefinitions, customAssignments = {}) {
  const realCount = Math.max(1, Math.min(tribeCount, players.length));
  const groups = Array.from({ length: realCount }, () => []);

  players.forEach((player, index) => {
    const assignedIndex = Number(customAssignments?.[player.id]);
    const safeIndex = Number.isInteger(assignedIndex) && assignedIndex >= 0 && assignedIndex < realCount ? assignedIndex : index % realCount;
    groups[safeIndex].push(player);
  });

  return groups
    .map((members, index) => {
      const def = tribeDefinitions[index] || {
        id: `tribe_${index + 1}`,
        name: FIJIAN_WORDS[index % FIJIAN_WORDS.length] || `Tribe ${index + 1}`,
        color: TRIBE_COLORS[index % TRIBE_COLORS.length] || "gray",
      };

      return {
        id: def.id,
        name: def.name || `Tribe ${index + 1}`,
        color: def.color || TRIBE_COLORS[index % TRIBE_COLORS.length] || "gray",
        members: members.map((player) => ({
          ...player,
          currentTribe: def.id,
          currentTribeColor: def.color || "gray",
          originalTribe: player.originalTribe || def.id,
          tribeHistory: player.tribeHistory ? [...player.tribeHistory] : [],
        })),
      };
    })
    .filter((tribe) => tribe.members.length > 0);
}

function simulateSeason(settings) {
  const seasonCast = settings.castPool?.length ? settings.castPool : CAST;
  const enabledIds = settings.enabledCastIds?.length ? settings.enabledCastIds : seasonCast.map((player) => player.id);
  const allPlayers = seasonCast.filter((player) => enabledIds.includes(player.id)).map((player) => ({ ...player, hasIdol: 0, hasShotInTheDark: settings.shotInTheDarkEnabled !== false ? 1 : 0, hasStealVote: 0, hasSafetyWithoutPower: 0, hasVoteBlock: 0, hasExtraVote: 0, hasKnowledgeIsPower: 0, hasRockDrawPower: 0, hasSuperIdol: 0, lostVote: 0, tribeHistory: [] }));
  const relationships = initRelationships(allPlayers);
  const idolsEnabled = settings.idolsEnabled !== false;
  const shotInTheDarkEnabled = settings.shotInTheDarkEnabled !== false;
  const voteHistory = { votedAgainst: new Map(), votedWith: new Map(), targetedByWinner: new Map(), timesTargeted: new Map() };

  const startTribeCount = Math.min(settings.startingTribes, Math.max(2, Math.min(10, allPlayers.length)));
  const jurySize = Math.max(1, Math.min(Number(settings.jurySize) || DEFAULT_JURY_SIZE, Math.max(1, allPlayers.length - FINAL_THREE_SIZE)));
  const juryStartsAtPlacement = FINAL_THREE_SIZE + jurySize;
  const reservedTribeCount = Math.min(getMaxPremergeSwapTribeCount(settings), Math.max(2, Math.min(10, allPlayers.length)));
  const reservedNames = sample(FIJIAN_WORDS, reservedTribeCount);
  const reservedColors = sample(TRIBE_COLORS, reservedTribeCount);
  const customDefs = settings.customTribeDefinitions || [];
  const allTribeDefinitions = Array.from({ length: reservedTribeCount }, (_, index) => ({
    id: `tribe_${index + 1}`,
    name: settings.useCustomTribes && customDefs[index]?.name ? customDefs[index].name : reservedNames[index],
    color: settings.useCustomTribes && customDefs[index]?.color ? customDefs[index].color : reservedColors[index],
  }));
  const idolState = idolsEnabled ? initIdolState(allTribeDefinitions) : { camps: new Map(), mergeActive: false };

  let activeDefinitions = allTribeDefinitions.slice(0, startTribeCount);
  let tribes = settings.useCustomTribes
    ? createCustomStartingTribes(allPlayers, startTribeCount, activeDefinitions, settings.customTribeAssignments || {})
    : createTribes(allPlayers, startTribeCount, activeDefinitions);
  activeDefinitions = tribes.map((tribe) => ({ id: tribe.id, name: tribe.name, color: tribe.color }));
  if (idolsEnabled) syncIdolFlags(flattenTribes(tribes), idolState);
  let merged = false;
  let mergeTribe = null;
  let preMergeWeek = 0;
  let postMergeWeek = 0;
  let swapCounter = 0;
  let globalWeek = 0;
  const log = [];

  const mergeThreshold = Math.min(Math.max(FINAL_THREE_SIZE + 1, allPlayers.length - 1), Math.max(Math.min(settings.mergeAt, allPlayers.length - 1), FINAL_THREE_SIZE + 1));
  log.push({ type: "start", title: "Season begins", tribes: cloneTribes(tribes), text: `The game starts with ${tribes.length} tribes.` });

  while (true) {
    const activePlayers = merged ? mergeTribe.members : flattenTribes(tribes);

    if (!merged && (activePlayers.length <= mergeThreshold || countRemainingTribes(tribes) <= 1)) {
      merged = true;
      if (idolsEnabled) ensureMergeIdol(idolState);
      mergeTribe = createMergeTribe(tribes);
      if (idolsEnabled) syncIdolFlags(mergeTribe.members, idolState);
      log.push({ type: "merge", title: "Merge", mergeTribe: cloneTribe(mergeTribe), text: `${mergeTribe.members.length} players remain. They merge into ${mergeTribe.name}.` });
      continue;
    }

    globalWeek += 1;
    
    if (!merged) {
      preMergeWeek += 1;
      const weekTwist = getWeekTwist(settings, "premerge", preMergeWeek);
      const twistType = weekTwist?.type || "normal";
      const twistTribeCount = Math.max(2, Math.min(10, Number(weekTwist?.tribeCount) || tribes.length));

      if (twistType === "tribe_swap") {
        swapCounter += 1;
        const targetCount = Math.min(twistTribeCount, Math.max(2, flattenTribes(tribes).length));
        tribes = reassignAcrossTribes(flattenTribes(tribes), targetCount, activeDefinitions, allTribeDefinitions);
        activeDefinitions = tribes.map((tribe) => ({ id: tribe.id, name: tribe.name, color: tribe.color }));
        if (idolsEnabled) syncIdolFlags(flattenTribes(tribes), idolState);
        log.push({ type: "swap", title: "Pre-merge twist: Tribe swap", swapNumber: swapCounter, tribes: cloneTribes(tribes), text: `Week ${preMergeWeek} twist: the players swap into ${tribes.length} tribes using the existing tribe set.` });
      }

      const weeklyPowers = getWeeklyPowers(settings, globalWeek);

      weeklyPowers.forEach((weeklyPower, powerIndex) => {
        const riskJourney = weeklyPower.riskJourney !== false;
        if (weeklyPower.type === "none") return;
        if (weeklyPower.type === "steal_a_vote" || weeklyPower.type === "safety_without_power" || weeklyPower.type === "vote_block" || weeklyPower.type === "extra_vote" || weeklyPower.type === "super_idol" || weeklyPower.type === "knowledge_is_power" || weeklyPower.type === "rock_draw") {
          const journeyParticipants = createStealAVoteJourneyParticipants(tribes);
          const journeyResult = resolveStealAVoteJourney(journeyParticipants, riskJourney);
          applyWeeklyPowerResult(journeyResult, flattenTribes(tribes), weeklyPower.type);
          const journeyTitle = weeklyPowers.filter((p) => p.type !== "none").length > 1 ? `Journey ${powerIndex + 1}` : "Journey";
          log.push({ type: "journey_arrive", title: journeyTitle, participants: journeyResult.participants, decisions: journeyResult.decisions, riskJourney });
          if (riskJourney) {
            log.push({ type: "journey_risk", title: journeyTitle, riskJourney, riskers: journeyResult.participants.filter((p) => {
              const choice = journeyResult.decisions.find((d) => d.playerId === p.id)?.choice;
              return choice === "risk";
            }) });
          }
          log.push({ type: "journey_result", title: journeyTitle, riskJourney, powerType: weeklyPower.type, winner: journeyResult.participants.find((p) => p.id === journeyResult.winnerId) || null, losers: journeyResult.participants.filter((p) => p.id !== journeyResult.winnerId), losersLoseVoteIds: journeyResult.losersLoseVoteIds || [] });
        }
      });

      const idolEvents = idolsEnabled ? searchForIdols(flattenTribes(tribes), tribes.map((tribe) => tribe.id), idolState) : [];
      log.push({ type: "tribe_events", title: "Tribe events", tribes: cloneTribes(tribes), eventLines: idolEvents.length ? idolEvents.map((event) => `${event.finderName} finds a Hidden Immunity Idol.`) : ["No idol is found."] });

      if (twistType === "immunity_skip") {
        log.push({ type: "twist_announcement", title: `Pre-merge week ${preMergeWeek}`, text: "This week uses the no tribal twist. Nobody is voted out." });
        log.push({ type: "next_week_tribes", title: "Back at camp", tribes: cloneTribes(tribes), text: "Everyone survives the week." });
        continue;
      }

      const rankedTribes = shuffle(tribes);
      const challenge = sample(CHALLENGE_TYPES, 1)[0];
      const rankings = rankedTribes.map((tribe, index) => ({ ...tribe, rank: index + 1 }));
      const losingTribes = twistType === "double_tribal" ? rankedTribes.slice(-Math.min(2, rankedTribes.length)) : twistType === "joint_tribal" ? rankedTribes.slice(-Math.min(twistTribeCount, rankedTribes.length)) : [rankedTribes[rankedTribes.length - 1]];
      log.push({ type: "tribe_rankings", title: "Immunity challenge results", tribes: cloneTribes(rankings), losingTribeId: losingTribes[0]?.id, challenge, weekTwist: twistType, text: `${rankings[0].name} wins ${challenge}.` });

      const eliminatedPlayers = [];
      if (twistType === "joint_tribal") {
        const jointMembers = losingTribes.flatMap((tribe) => tribe.members);
        const jointTribal = { id: `joint_${preMergeWeek}`, name: "Joint Tribal", color: "gray", members: jointMembers };
        const vote = resolveVote({ voters: shotInTheDarkEnabled ? jointMembers : jointMembers.map((p) => ({ ...p, hasShotInTheDark: false })), targets: jointMembers, relationships, context: createVoteContext(jointMembers, voteHistory, "premerge"), idolState: idolsEnabled ? idolState : null, playersRemaining: flattenTribes(tribes).length });
        const eliminated = eliminatedMeta(vote.eliminated, flattenTribes(tribes).length, juryStartsAtPlacement);
        eliminatedPlayers.push(eliminated);
        log.push({ type: "tribal_reveal", title: "Joint Tribal Council", tribe: cloneTribe(jointTribal), vote, eliminated, textLines: vote.autoElimination ? ["Only one eligible player remains."] : [] });
        if (vote.revoteUsed && vote.revote.length) log.push({ type: "tribal_revote", title: "Joint Tribal Revote", tribe: cloneTribe(jointTribal), vote, eliminated, textLines: [] });
        if (vote.rockDraw && vote.rockResult.length) log.push({ type: "tribal_rocks", title: "Joint Tribal Rock Draw", tribe: cloneTribe(jointTribal), vote, eliminated, textLines: [] });
        applyVoteRelationshipEffects(relationships, jointMembers, vote, vote.eliminated?.id || null);
        updateVoteHistory(voteHistory, vote, jointMembers, vote.eliminated?.id || null);
        if (idolsEnabled) releaseIdolFromPlayer(vote.eliminated?.id || "", idolState, flattenTribes(tribes));
        tribes = tribes.map((tribe) => ({ ...tribe, members: tribe.members.filter((player) => player.id !== vote.eliminated?.id) }));
        tribes = removeEmptyTribes(tribes);
        if (idolsEnabled) syncIdolFlags(flattenTribes(tribes), idolState);
        activeDefinitions = tribes.map((tribe) => ({ id: tribe.id, name: tribe.name, color: tribe.color }));
      } else if (twistType === "rock_draw") {
        const atRiskTribe = losingTribes[0];
        const vote = resolveForcedRockDraw({ players: atRiskTribe.members, immuneIds: [], relationships, idolState: idolsEnabled ? idolState : null });
        const eliminated = eliminatedMeta(vote.eliminated, flattenTribes(tribes).length, juryStartsAtPlacement);
        eliminatedPlayers.push(eliminated);
        log.push({ type: "tribal_reveal", title: `${atRiskTribe.name} Rock Draw`, tribe: cloneTribe(atRiskTribe), vote, eliminated, textLines: ["Voting is skipped. The losing tribe goes straight to rocks."] });
        if (vote.rockDraw && vote.rockResult.length) log.push({ type: "tribal_rocks", title: `${atRiskTribe.name} Rock Draw`, tribe: cloneTribe(atRiskTribe), vote, eliminated, textLines: [] });
        if (idolsEnabled) releaseIdolFromPlayer(vote.eliminated?.id || "", idolState, flattenTribes(tribes));
        tribes = tribes.map((tribe) => tribe.id === atRiskTribe.id ? { ...tribe, members: tribe.members.filter((player) => player.id !== vote.eliminated?.id) } : tribe);
        tribes = removeEmptyTribes(tribes);
        if (idolsEnabled) syncIdolFlags(flattenTribes(tribes), idolState);
        activeDefinitions = tribes.map((tribe) => ({ id: tribe.id, name: tribe.name, color: tribe.color }));
      } else {
        for (const tribeAtRisk of losingTribes) {
          const vote = resolveVote({ voters: shotInTheDarkEnabled ? tribeAtRisk.members : tribeAtRisk.members.map((p) => ({ ...p, hasShotInTheDark: false })), targets: tribeAtRisk.members, relationships, context: createVoteContext(tribeAtRisk.members, voteHistory, "premerge"), idolState: idolsEnabled ? idolState : null, playersRemaining: flattenTribes(tribes).length });
          const eliminated = eliminatedMeta(vote.eliminated, flattenTribes(tribes).length, juryStartsAtPlacement);
          eliminatedPlayers.push(eliminated);
          log.push({ type: "tribal_reveal", title: `${tribeAtRisk.name} Tribal Council`, tribe: cloneTribe(tribeAtRisk), vote, eliminated, textLines: vote.autoElimination ? ["Only one eligible player remains."] : [] });
          if (vote.revoteUsed && vote.revote.length) log.push({ type: "tribal_revote", title: `${tribeAtRisk.name} Revote`, tribe: cloneTribe(tribeAtRisk), vote, eliminated, textLines: [] });
          if (vote.rockDraw && vote.rockResult.length) log.push({ type: "tribal_rocks", title: `${tribeAtRisk.name} Rock Draw`, tribe: cloneTribe(tribeAtRisk), vote, eliminated, textLines: [] });
          applyVoteRelationshipEffects(relationships, tribeAtRisk.members, vote, vote.eliminated?.id || null);
          updateVoteHistory(voteHistory, vote, tribeAtRisk.members, vote.eliminated?.id || null);
          if (idolsEnabled) releaseIdolFromPlayer(vote.eliminated?.id || "", idolState, flattenTribes(tribes));
          tribes = tribes.map((tribe) => tribe.id === tribeAtRisk.id ? { ...tribe, members: tribe.members.filter((player) => player.id !== vote.eliminated?.id) } : tribe);
          tribes = removeEmptyTribes(tribes);
          if (idolsEnabled) syncIdolFlags(flattenTribes(tribes), idolState);
          activeDefinitions = tribes.map((tribe) => ({ id: tribe.id, name: tribe.name, color: tribe.color }));
          if (countRemainingTribes(tribes) <= 1) break;
        }
      }

      const tribesWithElims = eliminatedPlayers.reduce((acc, elim) => buildFullCastWithEliminated(acc, elim, elim?.currentTribe || null), tribes);
      log.push({ type: "post_vote_tribes", title: "Votes read", eliminated: eliminatedPlayers[eliminatedPlayers.length - 1] || null, eliminatedPlayers, tribes: cloneTribes(tribesWithElims), text: "Tribal Council ends." });
      if (countRemainingTribes(tribes) <= 1) {
        merged = true;
        if (idolsEnabled) ensureMergeIdol(idolState);
        mergeTribe = createMergeTribe(tribes);
        if (idolsEnabled) syncIdolFlags(mergeTribe.members, idolState);
        log.push({ type: "merge", title: "Merge", mergeTribe: cloneTribe(mergeTribe), text: `Only one tribe remains, so the game merges automatically into ${mergeTribe.name}.` });
        continue;
      }
      log.push({ type: "next_week_tribes", title: "Back at camp", tribes: cloneTribes(tribes), text: "The game moves on." });
      continue;
    }

    if (mergeTribe.members.length === FINAL_THREE_SIZE) {
      const finalists = [...mergeTribe.members];
      const juryMap = new Map();
      log.forEach((entry) => { if (entry.eliminated?.status === "jury") juryMap.set(entry.eliminated.id, entry.eliminated); });
      const baseJury = Array.from(juryMap.values()).slice(0, jurySize);
      const finalResult = resolveFinalJuryOutcome(baseJury, finalists, relationships);
      log.push({ type: "jury_vote_reveal", title: "Final Tribal Council", finalists, jury: finalResult.jury, juryVotes: finalResult.juryVotes, finalTie: finalResult.finalTie, tiebreakJuror: finalResult.tiebreakJuror, tiebreakVote: finalResult.tiebreakVote, tiebreakFinalists: finalResult.tiebreakFinalists, text: `${finalists.map((player) => player.name).join(", ")} face the jury.` });
      log.push({ type: "winner_screen", title: "Sole Survivor", finalists, jury: finalResult.jury, juryVotes: finalResult.juryVotes, counts: finalResult.counts, winner: finalResult.winner, finalTie: finalResult.finalTie, tiebreakJuror: finalResult.tiebreakJuror, tiebreakVote: finalResult.tiebreakVote, tiebreakFinalists: finalResult.tiebreakFinalists, text: `${finalResult.winner.name} wins the season.` });
      break;
    }

    postMergeWeek += 1;
    const weekTwist = getWeekTwist(settings, "postmerge", postMergeWeek);
    const twistType = weekTwist?.type || "normal";
    const weeklyPowers = getWeeklyPowers(settings, globalWeek);

    
    weeklyPowers.forEach((weeklyPower, powerIndex) => {
      const riskJourney = weeklyPower.riskJourney !== false;
      if (weeklyPower.type === "none") return;
      if (weeklyPower.type === "steal_a_vote" || weeklyPower.type === "safety_without_power" || weeklyPower.type === "vote_block" || weeklyPower.type === "extra_vote" || weeklyPower.type === "super_idol" || weeklyPower.type === "knowledge_is_power") {
        const journeyParticipants = mergeTribe.members;
        const journeyResult = resolveStealAVoteJourney(journeyParticipants, riskJourney);
        applyWeeklyPowerResult(journeyResult, mergeTribe.members, weeklyPower.type);
        const journeyTitle = weeklyPowers.filter((p) => p.type !== "none").length > 1 ? `Journey ${powerIndex + 1}` : "Journey";
        log.push({ type: "journey_arrive", title: journeyTitle, participants: journeyResult.participants, decisions: journeyResult.decisions, riskJourney });
        if (riskJourney) {
          log.push({ type: "journey_risk", title: journeyTitle, riskJourney, riskers: journeyResult.participants.filter((p) => {
            const choice = journeyResult.decisions.find((d) => d.playerId === p.id)?.choice;
            return choice === "risk";
          }) });
        }
        log.push({ type: "journey_result", title: journeyTitle, riskJourney, powerType: weeklyPower.type, winner: journeyResult.participants.find((p) => p.id === journeyResult.winnerId) || null, losers: journeyResult.participants.filter((p) => p.id !== journeyResult.winnerId), losersLoseVoteIds: journeyResult.losersLoseVoteIds || [] });
      }
    });

    const idolEvents = idolsEnabled ? searchForIdols(mergeTribe.members, ["merge"], idolState) : [];
    log.push({ type: "tribe_events", title: "Camp life", mergeTribe: cloneTribe(mergeTribe), eventLines: idolEvents.length ? idolEvents.map((event) => `${event.finderName} finds a Hidden Immunity Idol.`) : ["No idol is found."] });

    if (twistType === "safe_week") {
      log.push({ type: "twist_announcement", title: `Post-merge week ${postMergeWeek}`, text: "This week uses the no vote twist. Nobody is voted out." });
      log.push({ type: "post_merge_vote", title: "After Tribal Council", mergeTribe: cloneTribe(mergeTribe), eliminated: null, text: "Everyone survives the week." });
      log.push({ type: "next_week_merge", title: "Back at camp", mergeTribe: cloneTribe(mergeTribe), text: "The game moves on." });
      continue;
    }

    const rankings = shuffle(mergeTribe.members);
    const immune = rankings[0];
    const challenge = sample(CHALLENGE_TYPES, 1)[0];
    log.push({ type: "individual_rankings", title: "Individual immunity challenge", mergeTribe: cloneTribe(mergeTribe), rankings: rankings.map(clonePlayer), immune: clonePlayer(immune), challenge, weekTwist: twistType, text: `${immune.name} wins immunity in ${challenge}.` });

    if (twistType === "rock_draw") {
      const vote = resolveForcedRockDraw({ players: mergeTribe.members, immuneIds: immune ? [immune.id] : [], relationships, idolState: idolsEnabled ? idolState : null });
      const eliminated = eliminatedMeta(vote.eliminated, mergeTribe.members.length, juryStartsAtPlacement);
      log.push({ type: "merged_vote_reveal", title: `${mergeTribe.name} Rock Draw`, mergeTribe: cloneTribe(mergeTribe), immune: clonePlayer(immune), vote, eliminated, textLines: ["Voting is skipped. The tribe goes straight to rocks."] });
      if (vote.rockDraw && vote.rockResult.length) log.push({ type: "merged_rocks", title: `${mergeTribe.name} Rock Draw`, mergeTribe: cloneTribe(mergeTribe), immune: clonePlayer(immune), vote, eliminated, textLines: [] });
      if (idolsEnabled) releaseIdolFromPlayer(vote.eliminated?.id || "", idolState, mergeTribe.members);
      mergeTribe = { ...mergeTribe, members: mergeTribe.members.filter((player) => player.id !== vote.eliminated?.id) };
      if (idolsEnabled) syncIdolFlags(mergeTribe.members, idolState);
      log.push({ type: "post_merge_vote", title: "After Tribal Council", mergeTribe: eliminated ? cloneTribe({ ...mergeTribe, members: [...mergeTribe.members, eliminated] }) : cloneTribe(mergeTribe), eliminated, text: "The tribe went straight to rocks." });
      log.push({ type: "next_week_merge", title: "Back at camp", mergeTribe: cloneTribe(mergeTribe), text: "The game moves on." });
      continue;
    }

    const bootsThisWeek = twistType === "double_boot" ? 2 : 1;
    let lastMergedEliminated = null;
    for (let bootIndex = 0; bootIndex < bootsThisWeek; bootIndex += 1) {
      if (mergeTribe.members.length <= FINAL_THREE_SIZE) break;
      const currentImmune = bootIndex === 0 ? immune : sample(mergeTribe.members.filter((player) => player.id !== immune.id), 1)[0] || immune;
      const vote = resolveVote({ voters: shotInTheDarkEnabled ? mergeTribe.members : mergeTribe.members.map((p) => ({ ...p, hasShotInTheDark: false })), targets: mergeTribe.members, immuneId: currentImmune.id, relationships, context: createVoteContext(mergeTribe.members, voteHistory, "postmerge"), idolState: idolsEnabled ? idolState : null, playersRemaining: mergeTribe.members.length });
      const eliminated = eliminatedMeta(vote.eliminated, mergeTribe.members.length, juryStartsAtPlacement);
      lastMergedEliminated = eliminated;
      log.push({ type: "merged_vote_reveal", title: `${mergeTribe.name} Tribal Council${bootsThisWeek === 2 ? ` ${bootIndex + 1}` : ""}`, mergeTribe: cloneTribe(mergeTribe), immune: clonePlayer(currentImmune), vote, eliminated, textLines: vote.autoElimination ? ["Only one eligible player remains."] : [] });
      if (vote.revoteUsed && vote.revote.length) log.push({ type: "merged_revote", title: `${mergeTribe.name} Revote${bootsThisWeek === 2 ? ` ${bootIndex + 1}` : ""}`, mergeTribe: cloneTribe(mergeTribe), immune: clonePlayer(currentImmune), vote, eliminated, textLines: [] });
      if (vote.rockDraw && vote.rockResult.length) log.push({ type: "merged_rocks", title: `${mergeTribe.name} Rock Draw${bootsThisWeek === 2 ? ` ${bootIndex + 1}` : ""}`, mergeTribe: cloneTribe(mergeTribe), immune: clonePlayer(currentImmune), vote, eliminated, textLines: [] });
      applyVoteRelationshipEffects(relationships, mergeTribe.members, vote, vote.eliminated?.id || null);
      updateVoteHistory(voteHistory, vote, mergeTribe.members, vote.eliminated?.id || null);
      if (idolsEnabled) releaseIdolFromPlayer(vote.eliminated?.id || "", idolState, mergeTribe.members);
      mergeTribe = { ...mergeTribe, members: mergeTribe.members.filter((player) => player.id !== vote.eliminated?.id) };
      if (idolsEnabled) syncIdolFlags(mergeTribe.members, idolState);
    }

    log.push({ type: "post_merge_vote", title: "After Tribal Council", mergeTribe: lastMergedEliminated ? cloneTribe({ ...mergeTribe, members: [...mergeTribe.members, lastMergedEliminated] }) : cloneTribe(mergeTribe), eliminated: lastMergedEliminated, text: bootsThisWeek === 2 ? "Two players were voted out this week." : "One player was voted out this week." });
    log.push({ type: "next_week_merge", title: "Back at camp", mergeTribe: cloneTribe(mergeTribe), text: "The game moves on." });
  }

  return log;
}

function PlayerCard({ player, badge, borderColor = "#334155", dim = false, compact = false, bgColor = null, textColor = null, glow = false }) {
  const getCount = (val) => typeof val === "number" ? val : (val ? 1 : 0);

  const getAdvCount = (val) => Number(val || 0);
  const icons = [
    ...Array(getCount(player.hasShotInTheDark)).fill("🎲"),
    ...Array(getCount(player.hasIdol)).fill("🗿"),
    ...Array(getCount(player.hasStealVote)).fill("✌️"),
    ...Array(getCount(player.hasSafetyWithoutPower)).fill("🚪"),
    ...Array(getCount(player.hasVoteBlock)).fill("⛔"),
    ...Array(getCount(player.hasExtraVote)).fill("🧾"),
    ...Array(getCount(player.hasKnowledgeIsPower)).fill("🧠"),
    ...Array(getCount(player.hasRockDrawPower)).fill("🪨"),
    ...Array(getCount(player.hasSuperIdol)).fill("🩵"),
  ];

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg border-4 ${dim ? "opacity-60 grayscale" : ""} ${glow ? "ring-4 ring-yellow-400 shadow-yellow-400/60 shadow-2xl" : ""} relative`}
      style={{ borderColor, backgroundColor: bgColor || "#0f172a", color: textColor || "#ffffff" }}
    >
      <img src={player.image} alt={player.name} className="w-full aspect-square object-cover" />
      <div className={compact ? "p-2 text-center" : "p-3 text-center"}>
        <div className={compact ? "font-bold text-[11px] leading-tight" : "font-bold text-sm leading-tight"}>{player.name}</div>
        {badge ? <div className={compact ? "text-[10px] mt-1 opacity-90" : "text-xs mt-1 opacity-90"}>{badge}</div> : null}
      </div>
      {icons.length ? (
        <>
          <div className="absolute bottom-1 left-1 flex gap-1 text-sm pointer-events-none">
            {icons.filter((i) => i === "🎲").map((icon, idx) => <span key={`l_${idx}`}>{icon}</span>)}
          </div>
          <div className="absolute bottom-1 right-1 flex gap-1 text-sm pointer-events-none">
            {icons.filter((i) => i !== "🎲").map((icon, idx) => <span key={`r_${idx}`}>{icon}</span>)}
          </div>
        </>
      ) : null}
      <div className="flex w-full h-2">
        {player.tribeHistory && player.tribeHistory.length > 0 ? player.tribeHistory.map((color, idx) => {
          const style = getColorStyle(color);
          return <div key={idx} style={{ backgroundColor: style.bg, flex: 1 }} />;
        }) : <div style={{ backgroundColor: "rgba(255,255,255,0.12)", flex: 1 }} />}
      </div>
    </div>
  );
}

function TribeSection({ tribe, subtitle, compact = false, ranked = false, dimId = null, dimIds = [] }) {
  const style = getColorStyle(tribe.color);
  const dimSet = new Set([...(dimId ? [dimId] : []), ...dimIds]);
  return (
    <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900/80 shadow-xl">
      <div className="px-5 py-4" style={{ backgroundColor: style.bg, color: style.text, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="text-2xl font-extrabold">{tribe.name}</div>
        <div className="text-sm opacity-90 capitalize">{tribe.color}{subtitle ? ` • ${subtitle}` : ""}</div>
      </div>
      <div className={compact ? "p-3 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" : "p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"}>
        {tribe.members.map((player, idx) => <PlayerCard key={player.id} player={player} borderColor={style.border || style.bg} compact={compact} bgColor={style.bg} textColor={style.text} badge={dimSet.has(player.id) ? "Voted out" : ranked ? `#${idx + 1}` : undefined} dim={dimSet.has(player.id)} />)}
      </div>
    </div>
  );
}

function AdvantageRevealPanel({ vote, advantagesRevealed, setAdvantagesRevealed }) {
  const advantageLines = [
    ...(vote?.rockDrawPowerPlay ? [`${vote.rockDrawPowerPlay.byPlayerName} uses Rock Draw and Tribal Council goes straight to rocks.`] : []),
    ...(vote?.knowledgeIsPowerPlay ? [`${vote.knowledgeIsPowerPlay.byPlayerName} uses Knowledge Is Power on ${vote.knowledgeIsPowerPlay.targetName}${vote.knowledgeIsPowerPlay.success ? ` and steals ${vote.knowledgeIsPowerPlay.guessed}.` : " but fails."}`] : []),
    ...(vote?.safetyWithoutPowerPlay ? [`${vote.safetyWithoutPowerPlay.playerName} uses Safety Without Power and leaves Tribal Council.`] : []),
    ...(vote?.voteBlockPlay ? [`${vote.voteBlockPlay.byPlayerName} uses Vote Block on ${vote.voteBlockPlay.blockedPlayerName}.`] : []),
    ...(vote?.extraVotePlay ? [`${vote.extraVotePlay.byPlayerName} uses Extra Vote.`] : []),
    ...(vote?.superIdolPlay ? [`${vote.superIdolPlay.byPlayerName} plays a Super Idol for ${vote.superIdolPlay.targetName} after the votes are read.`] : []),
    ...((vote?.shotInDarkPlays || []).map((play) => `${play.byPlayerName} plays Shot in the Dark${play.safe ? " and is SAFE." : " and is NOT SAFE."}`)),
    ...(vote?.stealVotePlay ? [`${vote.stealVotePlay.byPlayerName} secretly uses Steal a Vote and takes ${vote.stealVotePlay.stolenFromName}'s vote.`] : []),
    ...((vote?.idolPlays || []).map((play) => `${play.byPlayerName} plays a Hidden Immunity Idol for ${play.targetName}.`)),
  ];
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <div className="text-lg font-bold mb-3">Advantages</div>
      {advantagesRevealed ? (advantageLines.length ? <div className="space-y-2 text-slate-200">{advantageLines.map((line, idx) => <div key={idx}>{line}</div>)}</div> : <div className="text-slate-400 text-sm">No advantages were used.</div>) : <button type="button" onClick={() => setAdvantagesRevealed(true)} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 font-semibold">Reveal advantages used</button>}
    </div>
  );
}

function VoteRevealBoard({ tribe, votes, revealedIds, setRevealedIds, immuneId = null, targetPlayers = null, safetyWithoutPowerPlay = null }) {
  const normalizedVotes = votes.map((vote, index) => ({ ...vote, revealKey: vote.revealKey || `${vote.voterId}_${index}` }));
  const groupedVotes = [];
  const groupMap = new Map();

  normalizedVotes.forEach((vote) => {
    const key = vote.voterId;
    if (!groupMap.has(key)) {
      const group = { voterId: vote.voterId, voterName: vote.voterName, voterVotes: [] };
      groupMap.set(key, group);
      groupedVotes.push(group);
    }
    groupMap.get(key).voterVotes.push(vote);
  });

  const visibleVotes = normalizedVotes.filter((vote) => revealedIds.includes(vote.revealKey));
  const counts = visibleVotes.reduce((acc, vote) => {
    acc[vote.targetName || "No vote"] = (acc[vote.targetName || "No vote"] || 0) + 1;
    return acc;
  }, {});
  const counterEntries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const style = tribe ? getColorStyle(tribe.color) : { bg: "#334155", text: "#ffffff" };
  const sourceMembers = tribe?.members || [];
  const targetSource = targetPlayers || sourceMembers;
  const memberMap = new Map(sourceMembers.map((player) => [player.id, player]));
  const targetMap = new Map(targetSource.map((player) => [player.id, player]));

  const revealSpecific = (revealKey) => {
    if (revealedIds.includes(revealKey)) return;
    setRevealedIds((current) => [...current, revealKey]);
  };

  const revealAll = () => {
    setRevealedIds(normalizedVotes.map((vote) => vote.revealKey));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-lg font-bold">Votes revealed</div>
          {visibleVotes.length < normalizedVotes.length ? (
            <button
              type="button"
              onClick={revealAll}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 text-sm font-semibold"
            >
              Reveal all
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {counterEntries.length ? counterEntries.map(([name, count]) => <div key={name} className="px-3 py-2 rounded-xl font-semibold" style={{ backgroundColor: style.bg, color: style.text }}>{name}: {count}</div>) : <div className="text-slate-400 text-sm">No votes revealed yet.</div>}
        </div>
        <div className="text-sm text-slate-400">Revealed {visibleVotes.length} of {normalizedVotes.length} votes</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groupedVotes.map((group, index) => {
          const voter = memberMap.get(group.voterId) || { id: group.voterId, name: group.voterName, image: sourceMembers[0]?.image || "" };
          const voterStyle = getColorStyle(voter?.currentTribeColor || tribe.color);
          const hasStolenVote = group.voterVotes.some((vote) => vote.voterName.includes("stolen vote"));
          return (
            <div key={`${group.voterId}_${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
              <div className="w-24 shrink-0">
                <PlayerCard player={voter} compact borderColor={voterStyle.border || voterStyle.bg} bgColor={voterStyle.bg} textColor={voterStyle.text} badge={hasStolenVote ? "Steal a Vote" : voter.id === immuneId ? "Immune" : "Voter"} glow={voter.id === immuneId} />
              </div>
              <div className="text-2xl font-black text-slate-500">→</div>
              <div className="flex gap-2 flex-wrap">
                {group.voterVotes.map((vote, voteIndex) => {
                  const target = revealedIds.includes(vote.revealKey) ? targetMap.get(vote.targetId) : null;
                  return (
                    <div key={`${vote.revealKey}_${voteIndex}`} className="w-24 shrink-0">
                      {target ? (
                        <div className="relative">
                          <PlayerCard player={target} compact borderColor={style.border || style.bg} bgColor={style.bg} textColor={style.text} badge={vote.doesNotCount ? "Does not count" : "Vote"} />
                          {vote.doesNotCount ? <div className="absolute inset-0 flex items-center justify-center text-red-500 text-6xl font-black pointer-events-none">✕</div> : null}
                        </div>
                      ) : vote.noVote ? (
                        <div className={`w-full aspect-square rounded-2xl border-4 ${vote.targetName === "Vote Blocked" ? "border-red-500 text-red-200" : "border-slate-600"} bg-slate-900 flex items-center justify-center text-center text-xs font-bold px-2`}>{vote.targetName || "No vote"}</div>
                      ) : (
                        <button type="button" onClick={() => revealSpecific(vote.revealKey)} className="w-full aspect-square rounded-2xl border-4 border-dashed border-slate-500 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-5xl font-black">?</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {safetyWithoutPowerPlay ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
            <div className="w-24 shrink-0 relative">
              <PlayerCard player={memberMap.get(safetyWithoutPowerPlay.playerId) || { id: safetyWithoutPowerPlay.playerId, name: safetyWithoutPowerPlay.playerName, image: sourceMembers[0]?.image || "" }} compact borderColor="#475569" badge="Left tribal" dim />
              <div className="absolute inset-0 flex items-center justify-center text-red-500 text-6xl font-black pointer-events-none">✕</div>
            </div>
            <div className="text-2xl font-black text-slate-500">→</div>
            <div className="w-24 shrink-0">
              <div className="w-full aspect-square rounded-2xl border-4 border-slate-600 bg-slate-900 flex items-center justify-center text-center text-xs font-bold px-2">Left tribal</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RockDrawBoard({ participants, revealedIds, setRevealedIds }) {
  const revealSpecific = (playerId) => {
    if (revealedIds.includes(playerId)) return;
    setRevealedIds((current) => [...current, playerId]);
  };
  const visible = participants.filter((participant) => revealedIds.includes(participant.playerId));
  const redCount = visible.filter((participant) => participant.rockColor === "red").length;
  const blackCount = visible.filter((participant) => participant.rockColor === "black").length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="text-lg font-bold mb-3">Rock draw</div>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="px-3 py-2 rounded-xl font-semibold bg-red-600 text-white">Red rocks: {redCount}</div>
          <div className="px-3 py-2 rounded-xl font-semibold bg-slate-800 text-white">Black rocks: {blackCount}</div>
        </div>
        <div className="text-sm text-slate-400">Click any player’s rock to reveal it.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {participants.map((participant) => {
          const isRevealed = revealedIds.includes(participant.playerId);
          return (
            <div key={participant.playerId} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
              <div className="w-24 shrink-0"><PlayerCard player={{ id: participant.playerId, name: participant.playerName, image: participant.playerImage }} compact borderColor="#475569" badge="Draw" /></div>
              <div className="text-2xl font-black text-slate-500">→</div>
              <div className="w-24 shrink-0">
                {isRevealed ? <div className="w-full aspect-square rounded-full border-4 flex items-center justify-center font-black uppercase text-xs text-center px-2" style={{ backgroundColor: participant.rockColor === "red" ? "#dc2626" : "#111827", borderColor: participant.rockColor === "red" ? "#fca5a5" : "#6b7280", color: "#ffffff" }}>{participant.rockColor} rock</div> : <button type="button" onClick={() => revealSpecific(participant.playerId)} className="w-full aspect-square rounded-full border-4 border-dashed border-slate-500 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-5xl font-black">?</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BootSummary({ entry }) {
  const eliminatedList = entry?.eliminatedPlayers?.length ? entry.eliminatedPlayers : entry?.eliminated ? [entry.eliminated] : [];
  if (!eliminatedList.length) return null;
  const names = eliminatedList.map((player) => player.name);
  return <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">{names.length === 1 ? `${names[0]} has been voted out.` : `${names.join(" and ")} have been voted out.`}</div>;
}

function FullCastScreen({ tribes, eliminatedId = null, eliminatedIds = [] }) {
  return <div className="space-y-6">{tribes.map((tribe) => <TribeSection key={tribe.id} tribe={tribe} subtitle="tribe status" compact dimId={eliminatedId} dimIds={eliminatedIds} />)}</div>;
}
function FullCastEliminationBoard({ tribes, eliminated, eliminatedPlayers = [] }) {
  const allEliminated = eliminatedPlayers.length ? eliminatedPlayers : eliminated ? [eliminated] : [];
  if (!allEliminated.length) return <FullCastScreen tribes={tribes} />;
  return <div className="space-y-6"><BootSummary entry={{ eliminated, eliminatedPlayers: allEliminated }} />{tribes.map((tribe) => <TribeSection key={tribe.id} tribe={tribe} subtitle="tribe status" compact dimIds={allEliminated.map((player) => player.id)} />)}</div>;
}

function CastSelector({ enabledIds, onChange, castPool, setCastPool, savedCasts, loadCastMembers }) {
  const [modalOpen, setModalOpen] = useState(false);
  const togglePlayer = (playerId) => {
    if (enabledIds.includes(playerId)) {
      if (enabledIds.length <= 4) return;
      onChange(enabledIds.filter((id) => id !== playerId));
      return;
    }
    onChange([...enabledIds, playerId]);
  };

  function removePlayer(playerId) {
    if (enabledIds.length <= 4) return;
    setCastPool((players) => players.filter((player) => player.id !== playerId));
    onChange(enabledIds.filter((id) => id !== playerId));
  }

  function clearRoster() {
    setCastPool([]);
    onChange([]);
  }

  function addPlayers(playersToAdd) {
    setCastPool((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const newPlayers = playersToAdd.filter((player) => !existingIds.has(player.id));
      const next = [...current, ...newPlayers];
      onChange(next.map((player) => player.id));
      return next;
    });
  }

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-2xl font-bold">Cast</div>
          <div className="text-sm text-slate-400">Selected: {enabledIds.length} players</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModalOpen(true)} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold">Add Cast Members</button>
          <button onClick={() => onChange(castPool.map((player) => player.id))} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700">Select all</button>
          <button onClick={() => onChange(castPool.slice(0, 4).map((player) => player.id))} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700">Min 4</button>
          <button onClick={clearRoster} className="px-3 py-2 rounded-xl bg-red-700 hover:bg-red-600">Clear</button>
        </div>
      </div>

      {castPool.length < 4 ? (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/15 p-4 text-red-100 mb-4">
          Add at least 4 cast members before starting a season.
        </div>
      ) : null}

      <div className="max-h-[80vh] overflow-auto pr-1 grid grid-cols-2 gap-3">
        {castPool.map((player) => {
          const enabled = enabledIds.includes(player.id);
          return (
            <div key={player.id} className={`rounded-2xl border p-3 flex items-center gap-3 text-left transition ${enabled ? "bg-slate-900 border-emerald-500" : "bg-slate-950 border-slate-800 opacity-50"}`}>
              <button type="button" onClick={() => togglePlayer(player.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                <img src={player.image} alt={player.name} className={`w-12 h-12 rounded-xl object-cover ${enabled ? "" : "grayscale"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight truncate">{player.name}</div>
                  <div className={`text-xs mt-1 ${enabled ? "text-emerald-300" : "text-slate-500"}`}>{enabled ? "On cast" : "Off cast"}</div>
                </div>
              </button>
              <button type="button" onClick={() => removePlayer(player.id)} className="px-2 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-xs font-bold">X</button>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <AddCastMembersModal
          savedCasts={savedCasts}
          loadCastMembers={loadCastMembers}
          onClose={() => setModalOpen(false)}
          onAdd={(players) => {
            addPlayers(players);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AddCastMembersModal({ savedCasts, loadCastMembers, onClose, onAdd }) {
  const [selectedCastId, setSelectedCastId] = useState(savedCasts[0]?.id || "");
  const [members, setMembers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!selectedCastId) return;
      setLoading(true);
      const players = await loadCastMembers(selectedCastId);
      setMembers(players);
      setSelectedIds(new Set(players.map((player) => player.id)));
      setLoading(false);
    }
    load();
  }, [selectedCastId]);

  const selectedCast = savedCasts.find((cast) => cast.id === selectedCastId);
  const categories = [...new Set(savedCasts.map((cast) => cast.show_name || (cast.is_official ? "Official" : "My Custom Casts")))];

  function toggleMember(playerId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(playerId) ? next.delete(playerId) : next.add(playerId);
      return next;
    });
  }

  function addSelected() {
    const selectedPlayers = members.filter((player) => selectedIds.has(player.id));
    onAdd(selectedPlayers);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-[2rem] border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-3xl font-black">Add Cast Members</h2>
            <p className="text-slate-400">Pick an official show or one of your custom casts, then add all or specific characters.</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">Close</button>
        </div>

        {savedCasts.length === 0 ? (
          <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">
            No casts found. Add universal casts in Supabase or create a custom cast first.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-[260px_1fr] gap-4 mb-5">
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-3">
                <div className="text-sm text-slate-400 font-bold uppercase tracking-wide">Categories</div>
                {categories.map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="text-emerald-300 font-black">{category}</div>
                    {savedCasts.filter((cast) => (cast.show_name || (cast.is_official ? "Official" : "My Custom Casts")) === category).map((cast) => (
                      <button
                        key={cast.id}
                        onClick={() => setSelectedCastId(cast.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl border ${selectedCastId === cast.id ? "bg-emerald-500 text-slate-950 border-emerald-300 font-black" : "bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
                      >
                        {cast.name}
                        {cast.is_official ? " ⭐" : ""}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="text-2xl font-black">{selectedCast?.name || "Choose a cast"}</div>
                    <div className="text-slate-400 text-sm">{selectedIds.size} selected</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIds(new Set(members.map((player) => player.id)))} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">Select All</button>
                    <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold">Select None</button>
                    <button onClick={addSelected} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black">Add Selected</button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-slate-400">Loading members...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {members.map((person) => {
                      const selected = selectedIds.has(person.id);
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => toggleMember(person.id)}
                          className={`rounded-2xl overflow-hidden border bg-slate-950 ${selected ? "border-emerald-400 ring-2 ring-emerald-300/50" : "border-slate-700 opacity-50 grayscale"}`}
                        >
                          <div className="aspect-square bg-slate-800 overflow-hidden">
                            {person.image ? <img src={person.image} alt={person.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-500 text-xs">No Image</div>}
                          </div>
                          <div className="p-2 text-xs font-black truncate">{person.name}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WeekPlanner({ settings, setSettings }) {
  const { weeks } = computeWeekPlan(settings);
  const setTwistForWeek = (phase, phaseWeek, key, value) => {
    const listKey = phase === "premerge" ? "preMergeTwists" : "postMergeTwists";
    const currentList = settings[listKey] || [];
    const existing = currentList.find((item) => item.week === phaseWeek);
    const nextItem = { week: phaseWeek, type: existing?.type || "normal", tribeCount: existing?.tribeCount || settings.startingTribes, ...existing, [key]: value };
    const nextList = [...currentList.filter((item) => item.week !== phaseWeek), nextItem].sort((a, b) => a.week - b.week);
    setSettings((prev) => ({ ...prev, [listKey]: nextList }));
  };
  const setPowerForWeek = (powerId, key, value) => {
    const currentList = settings.weeklyPowers || [];
    const existing = currentList.find((item) => item.id === powerId);
    const derivedWeek = Number((powerId.split("_")[1]) || 0);
    const nextItem = existing
      ? { ...existing, [key]: value }
      : { id: powerId, week: derivedWeek, type: "none", riskJourney: true, [key]: value };
    const nextList = [...currentList.filter((item) => item.id !== powerId), nextItem].sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
    setSettings((prev) => ({ ...prev, weeklyPowers: nextList }));
  };
  const addPowerForWeek = (globalWeek) => {
    const currentList = settings.weeklyPowers || [];
    const nextItem = { id: `power_${globalWeek}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, week: globalWeek, type: "none", riskJourney: true };
    const nextList = [...currentList, nextItem].sort((a, b) => a.week - b.week || a.id.localeCompare(b.id));
    setSettings((prev) => ({ ...prev, weeklyPowers: nextList }));
  };
  const removePowerForWeek = (powerId) => {
    setSettings((prev) => ({ ...prev, weeklyPowers: (prev.weeklyPowers || []).filter((item) => item.id !== powerId) }));
  };
  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 shadow-2xl p-6 space-y-4">
      <div><div className="text-xl font-bold">Weekly twists</div><div className="text-sm text-slate-400">Every round is listed automatically and updates live based on cast size, merge point, and twist formats.</div></div>
      <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
        {weeks.map((week) => {
          const isPre = week.phase === "premerge";
          const options = isPre ? PREMERGE_TWIST_OPTIONS : POSTMERGE_TWIST_OPTIONS;
          return (
            <div key={`${week.phase}-${week.phaseWeek}`} className="rounded-2xl bg-slate-900 border border-slate-700 p-4 grid md:grid-cols-[90px_110px_1fr_170px_160px] gap-3 items-end">
              <div><div className="text-xs text-slate-400 mb-1">Week</div><div className="font-bold">{week.globalWeek}</div><div className="text-xs text-slate-500">{isPre ? `Pre ${week.phaseWeek}` : `Post ${week.phaseWeek}`}</div></div>
              <div><div className="text-xs text-slate-400 mb-1">Players</div><div className="text-sm font-semibold">{week.playersStart} → {week.playersEnd}</div></div>
              <label className="text-sm"><div className="text-slate-400 mb-1">Format</div><select value={week.twistType} onChange={(e) => setTwistForWeek(week.phase, week.phaseWeek, "type", e.target.value)} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="text-sm"><div className="text-slate-400 mb-1">Details</div>{isPre && (week.twistType === "tribe_swap" || week.twistType === "joint_tribal") ? <select value={week.tribeCount} onChange={(e) => setTwistForWeek(week.phase, week.phaseWeek, "tribeCount", Number(e.target.value))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => <option key={num} value={num}>{num} tribes</option>)}</select> : <div className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-slate-500">{week.twistLabel}</div>}</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-slate-400 text-sm">Powers</div>
                  <button type="button" onClick={() => addPowerForWeek(week.globalWeek)} className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700 text-xs font-semibold">+ Add</button>
                </div>
                {week.powers.map((power, idx) => (
                  <div key={power.id} className="rounded-xl border border-slate-700 bg-slate-800/70 p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <select value={power.type || "none"} onChange={(e) => setPowerForWeek(power.id, "type", e.target.value)} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm">{WEEKLY_POWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                      {week.powers.length > 1 ? <button type="button" onClick={() => removePowerForWeek(power.id)} className="px-2 py-2 rounded-xl bg-slate-900 border border-slate-600 hover:bg-slate-700 text-xs font-semibold">Remove</button> : idx === 0 && power.type !== "none" ? <button type="button" onClick={() => removePowerForWeek(power.id)} className="px-2 py-2 rounded-xl bg-slate-900 border border-slate-600 hover:bg-slate-700 text-xs font-semibold">Remove</button> : null}
                    </div>
                    {power.type !== "none" ? <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={power.riskJourney !== false} onChange={(e) => setPowerForWeek(power.id, "riskJourney", e.target.checked)} className="rounded border-slate-600 bg-slate-800" /><span>Risk journey</span></label> : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function CustomTribeBuilder({ settings, setSettings }) {
  const activePlayers = (settings.castPool || []).filter((player) => (settings.enabledCastIds || []).includes(player.id));
  const tribeCount = Math.max(2, Math.min(Number(settings.startingTribes) || 2, Math.max(2, activePlayers.length || 2)));

  const getDefinition = (index) => {
    const existing = settings.customTribeDefinitions?.[index] || {};
    return {
      name: existing.name || FIJIAN_WORDS[index % FIJIAN_WORDS.length] || `Tribe ${index + 1}`,
      color: existing.color || TRIBE_COLORS[index % TRIBE_COLORS.length] || "gray",
    };
  };

  const getAssignment = (player, index) => {
    const value = Number(settings.customTribeAssignments?.[player.id]);
    return Number.isInteger(value) && value >= 0 && value < tribeCount ? value : index % tribeCount;
  };

  const updateDefinition = (index, key, value) => {
    setSettings((current) => {
      const nextDefinitions = Array.from({ length: tribeCount }, (_, i) => ({
        name: current.customTribeDefinitions?.[i]?.name || FIJIAN_WORDS[i % FIJIAN_WORDS.length] || `Tribe ${i + 1}`,
        color: current.customTribeDefinitions?.[i]?.color || TRIBE_COLORS[i % TRIBE_COLORS.length] || "gray",
      }));

      nextDefinitions[index] = {
        ...nextDefinitions[index],
        [key]: value,
      };

      return {
        ...current,
        customTribeDefinitions: nextDefinitions,
      };
    });
  };

  const assignPlayer = (playerId, tribeIndex) => {
    setSettings((current) => ({
      ...current,
      customTribeAssignments: {
        ...(current.customTribeAssignments || {}),
        [playerId]: tribeIndex,
      },
    }));
  };

  const evenlyAssign = () => {
    setSettings((current) => {
      const players = (current.castPool || []).filter((player) => (current.enabledCastIds || []).includes(player.id));
      const shuffled = shuffle(players);
      const assignments = {};

      shuffled.forEach((player, index) => {
        assignments[player.id] = index % tribeCount;
      });

      return {
        ...current,
        customTribeAssignments: assignments,
      };
    });
  };

  const clearAssignments = () => {
    setSettings((current) => ({
      ...current,
      customTribeAssignments: {},
    }));
  };

  const groupedPlayers = Array.from({ length: tribeCount }, () => []);
  activePlayers.forEach((player, index) => {
    groupedPlayers[getAssignment(player, index)].push(player);
  });

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="text-2xl font-black">Custom Starting Tribes</div>
          <div className="text-sm text-slate-400">Optional: manually choose who starts on each tribe before the simulation begins.</div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 font-bold">
          <input
            type="checkbox"
            checked={settings.useCustomTribes || false}
            onChange={(e) => setSettings((current) => ({ ...current, useCustomTribes: e.target.checked }))}
          />
          Use Custom Tribes
        </label>
      </div>

      {!settings.useCustomTribes ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-slate-400">
          Custom tribes are off. The simulator will randomly divide the selected cast like normal.
        </div>
      ) : activePlayers.length < 2 ? (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/15 p-4 text-red-100">
          Add and select cast members first, then assign them to starting tribes.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={evenlyAssign} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black">
              Random Even Assignment
            </button>

            <button type="button" onClick={clearAssignments} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 font-bold">
              Reset Assignments
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: tribeCount }, (_, index) => {
              const definition = getDefinition(index);
              const style = getColorStyle(definition.color);

              return (
                <div key={index} className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
                  <div className="p-4" style={{ backgroundColor: style.bg, color: style.text }}>
                    <input
                      value={definition.name}
                      onChange={(e) => updateDefinition(index, "name", e.target.value)}
                      className="w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2 font-black text-xl outline-none placeholder-current"
                      placeholder={`Tribe ${index + 1}`}
                    />

                    <select
                      value={definition.color}
                      onChange={(e) => updateDefinition(index, "color", e.target.value)}
                      className="mt-3 w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2 font-bold outline-none"
                    >
                      {TRIBE_COLORS.map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-wide">
                      {groupedPlayers[index].length} players
                    </div>

                    {groupedPlayers[index].length === 0 ? (
                      <div className="text-slate-500 text-sm">No players assigned.</div>
                    ) : (
                      groupedPlayers[index].map((player) => (
                        <div key={player.id} className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-800 p-2">
                          <img src={player.image} alt={player.name} className="w-12 h-12 rounded-xl object-cover bg-slate-800" />
                          <div className="font-bold text-sm leading-tight truncate">{player.name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
            <div className="text-xl font-black mb-3">Assign Players</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activePlayers.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-800 p-3">
                  <img src={player.image} alt={player.name} className="w-14 h-14 rounded-xl object-cover bg-slate-800" />
                  <div className="min-w-0 flex-1">
                    <div className="font-black truncate">{player.name}</div>
                    <select
                      value={getAssignment(player, index)}
                      onChange={(e) => assignPlayer(player.id, Number(e.target.value))}
                      className="mt-2 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
                    >
                      {Array.from({ length: tribeCount }, (_, tribeIndex) => {
                        const definition = getDefinition(tribeIndex);
                        return <option key={tribeIndex} value={tribeIndex}>{definition.name || `Tribe ${tribeIndex + 1}`}</option>;
                      })}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Menu({ settings, setSettings, onStart, savedCasts, loadCastMembers }) {
  return (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-white overflow-x-hidden">
    <Navbar />

    <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-emerald-700/40 bg-slate-950/80 shadow-2xl p-8">
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300 mb-3">Survivor simulator</div>
            <h1 className="text-5xl font-black leading-none mb-4">Build your season</h1>
            <p className="text-slate-300 text-lg mb-8">Choose tribes, merge point, jury size, idols, shot in the dark, cast, and set each week’s format in real time.</p>
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <label className="rounded-2xl bg-slate-900 border border-slate-700 p-4"><div className="text-sm text-slate-400 mb-2">Starting tribes</div><select value={settings.startingTribes} onChange={(e) => setSettings((current) => ({ ...current, startingTribes: Number(e.target.value) }))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">{[2,3,4,5,6,7,8,9,10].map((num) => <option key={num} value={num}>{num}</option>)}</select></label>
              <label className="rounded-2xl bg-slate-900 border border-slate-700 p-4"><div className="text-sm text-slate-400 mb-2">Merge at</div><select value={settings.mergeAt} onChange={(e) => setSettings((current) => ({ ...current, mergeAt: Number(e.target.value) }))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">{Array.from({ length: Math.max(1, Math.max(4, settings.enabledCastIds.length) - 4) }, (_, i) => i + 4).map((num) => <option key={num} value={num}>{num} players</option>)}</select></label>
              <label className="rounded-2xl bg-slate-900 border border-slate-700 p-4"><div className="text-sm text-slate-400 mb-2">Jury size</div><select value={settings.jurySize} onChange={(e) => setSettings((current) => ({ ...current, jurySize: Number(e.target.value) }))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2">{[4,5,6,7,8,9,10,11,12].map((num) => <option key={num} value={num}>{num} jurors</option>)}</select></label>
              <label className="rounded-2xl bg-slate-900 border border-slate-700 p-4"><div className="text-sm text-slate-400 mb-2">Idols</div><select value={settings.idolsEnabled ? "on" : "off"} onChange={(e) => setSettings((current) => ({ ...current, idolsEnabled: e.target.value === "on" }))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2"><option value="on">On</option><option value="off">Off</option></select></label>
              <label className="rounded-2xl bg-slate-900 border border-slate-700 p-4"><div className="text-sm text-slate-400 mb-2">Shot in the Dark</div><select value={settings.shotInTheDarkEnabled ? "on" : "off"} onChange={(e) => setSettings((current) => ({ ...current, shotInTheDarkEnabled: e.target.value === "on" }))} className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2"><option value="on">On</option><option value="off">Off</option></select></label>
            </div>
            <button onClick={onStart} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-xl">Start season</button>
          </div>
          <WeekPlanner settings={settings} setSettings={setSettings} />
        </div>
        <CastSelector enabledIds={settings.enabledCastIds} onChange={(enabledCastIds) => setSettings((current) => ({ ...current, enabledCastIds }))} castPool={settings.castPool || []} setCastPool={(updater) => setSettings((current) => ({ ...current, castPool: typeof updater === "function" ? updater(current.castPool || []) : updater }))} savedCasts={savedCasts} loadCastMembers={loadCastMembers} />
        <CustomTribeBuilder settings={settings} setSettings={setSettings} />
      </div>
    </div>
  );
}

function JuryVoteScreen({ entry, revealedIds, setRevealedIds }) {
  const tiebreakPool = entry.finalTie && entry.tiebreakJuror ? [entry.tiebreakJuror] : [];
  return (
    <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5"><div className="text-xl font-bold mb-4">Final 3</div><div className="grid grid-cols-3 gap-3">{entry.finalists.map((player) => <PlayerCard key={player.id} player={player} compact borderColor="#f59e0b" badge="Finalist" />)}</div></div>
        {entry.finalTie ? <div className="rounded-2xl border border-amber-600 bg-amber-950/30 p-4 text-sm text-amber-100">The jury vote tied between {entry.tiebreakFinalists.map((p) => p.name).join(" and ")}. {entry.tiebreakJuror?.name} finished third and now casts the deciding vote.</div> : null}
        <VoteRevealBoard tribe={{ id: "jury", name: "Jury", color: "gray", members: entry.jury }} votes={entry.juryVotes} revealedIds={revealedIds} setRevealedIds={setRevealedIds} targetPlayers={entry.finalists} />
        {entry.finalTie ? <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5 space-y-4"><div className="text-xl font-bold">Tiebreak vote</div><VoteRevealBoard tribe={{ id: "tiebreak", name: "Tiebreak Juror", color: "gray", members: tiebreakPool }} votes={entry.tiebreakVote ? [entry.tiebreakVote] : []} revealedIds={revealedIds} setRevealedIds={setRevealedIds} targetPlayers={entry.tiebreakFinalists} /></div> : null}
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4"><div className="text-lg font-bold mb-2">Jury of {entry.jury.length}</div><div className="text-sm text-slate-300">Each juror casts exactly one vote.</div></div>
    </div>
  );
}



// Sanity checks disabled in SimulatorTV because casts load dynamically from Supabase.

export default function SurvivorSimulator() {
  const router = useRouter();
  const [savedCasts, setSavedCasts] = useState([]);
  const [settings, setSettings] = useState({
    startingTribes: 2,
    mergeAt: 12,
    jurySize: DEFAULT_JURY_SIZE,
    idolsEnabled: DEFAULT_IDOLS_ENABLED,
    shotInTheDarkEnabled: DEFAULT_SITD_ENABLED,
    weeklyPowers: [],
    preMergeTwists: [],
    postMergeTwists: [],
    castPool: [],
    enabledCastIds: [],
    useCustomTribes: false,
    customTribeDefinitions: [],
    customTribeAssignments: {},
  });

  const [season, setSeason] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveSummary, setSaveSummary] = useState("");
  const [savePublic, setSavePublic] = useState(true);
  const [savedSeasonUrl, setSavedSeasonUrl] = useState("");

  const currentEntry = useMemo(
    () => season?.[currentIndex] || null,
    [season, currentIndex]
  );

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

    const favoriteOfficialCastIds = (favoriteData || []).map(
      (fav) => fav.cast_id
    );

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (userCastsError) {
      alert(userCastsError.message);
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
        return;
      }

      officialCasts = officialData || [];
    }

    const castData = [...officialCasts, ...(userCasts || [])];

    setSavedCasts(castData || []);
  }

  async function loadCastMembers(castId) {
    const { data, error } = await supabase
      .from("contestants")
      .select("id, name, image_url")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      return [];
    }

    return (data || []).map((person) => ({
      id: `${castId}-${person.id}`,
      name: person.name,
      image: person.image_url || "",
    }));
  }

  useEffect(() => {
    setSettings((current) => {
      const castCount = Math.max(4, current.enabledCastIds.length);
      const maxMerge = Math.max(FINAL_THREE_SIZE + 1, castCount - 1);
      const nextMergeAt = Math.min(current.mergeAt, maxMerge);
      const nextJurySize = normalizeJurySizeForSettings(current);

      if (
        nextMergeAt === current.mergeAt &&
        nextJurySize === current.jurySize
      ) {
        return current;
      }

      return {
        ...current,
        mergeAt: nextMergeAt,
        jurySize: nextJurySize,
      };
    });
  }, [settings.enabledCastIds.length]);

  const startSeason = () => {
    const log = simulateSeason(settings);

    setSeason(log);
    setCurrentIndex(0);
    setSaveTitle("");
    setSaveSummary("");
    setSavePublic(true);
    setSavedSeasonUrl("");
  };

  const resetSeason = () => {
    setSeason(null);
    setCurrentIndex(0);
    setSavedSeasonUrl("");
  };

  async function saveSeason() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("Log in first.");
      return;
    }

    if (!season || season.length === 0) {
      alert("No season to save yet.");
      return;
    }

    const winnerEntry = season.find((entry) => entry.type === "winner_screen");
    const winnerName = winnerEntry?.winner?.name || "Unknown winner";

    const title =
      saveTitle.trim() ||
      `Survivor Season - ${winnerName} Wins`;

    const summary =
      saveSummary.trim() ||
      `A Survivor simulation where ${winnerName} became the Sole Survivor.`;

    const { data, error } = await supabase
      .from("saved_seasons")
      .insert({
        user_id: userData.user.id,
        simulator_type: "survivor",
        title,
        summary,
        is_public: savePublic,
        allow_comments: true,
        data_json: {
          simulator_type: "survivor",
          title,
          summary,
          settings,
          season,
          winner: winnerEntry?.winner || null,
          finalists: winnerEntry?.finalists || [],
          jury: winnerEntry?.jury || [],
          counts: winnerEntry?.counts || [],
        },
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setSavedSeasonUrl(`/seasons/${data.id}`);
    alert("Season saved!");
  }

  if (!season || !currentEntry) {
    return (
      <Menu
        settings={settings}
        setSettings={setSettings}
        onStart={startSeason}
        savedCasts={savedCasts}
        loadCastMembers={loadCastMembers}
      />
    );
  }

  return (
    <div>
      <EventScreen
        entry={currentEntry}
        season={season}
        currentIndex={currentIndex}
        onNext={() =>
          setCurrentIndex((index) =>
            Math.min(index + 1, season.length - 1)
          )
        }
        onRestart={resetSeason}
      />

      {currentEntry.type === "winner_screen" && (
        <div className="bg-black text-white px-8 pb-10">
          <div className="max-w-5xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">
              Save This Season
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Season title"
                className="bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
              />

              <label className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 font-bold">
                <input
                  type="checkbox"
                  checked={savePublic}
                  onChange={(e) => setSavePublic(e.target.checked)}
                />
                Post publicly on profile
              </label>
            </div>

            <textarea
              value={saveSummary}
              onChange={(e) => setSaveSummary(e.target.value)}
              placeholder="Season summary"
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 resize-none mb-4"
            />

            <button
              onClick={saveSeason}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
            >
              Save Season
            </button>

            {savedSeasonUrl && (
              <a
                href={savedSeasonUrl}
                className="inline-block ml-4 text-blue-400 hover:text-blue-300 font-bold"
              >
                View Saved Season
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}