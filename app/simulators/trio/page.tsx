"use client";

// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const TEAM_COLORS = [
  { name: "Red", hex: "#e53935", text: "#ffffff" },
  { name: "Salmon", hex: "#fa8072", text: "#111111" },
  { name: "Orange", hex: "#fb8c00", text: "#ffffff" },
  { name: "Tan", hex: "#d2b48c", text: "#111111" },
  { name: "Yellow", hex: "#ffff00", text: "#111111" },
  { name: "Gold", hex: "#f59e0b", text: "#111111" },
  { name: "Lime", hex: "#bfff00", text: "#111111" },
  { name: "Green", hex: "#43a047", text: "#ffffff" },
  { name: "Mint", hex: "#34d399", text: "#111111" },
  { name: "Teal", hex: "#008080", text: "#ffffff" },
  { name: "Cyan", hex: "#00ffff", text: "#111111" },
  { name: "Sky Blue", hex: "#38bdf8", text: "#111111" },
  { name: "Blue", hex: "#1e88e5", text: "#ffffff" },
  { name: "Navy", hex: "#000080", text: "#ffffff" },
  { name: "Indigo", hex: "#4b0082", text: "#ffffff" },
  { name: "Purple", hex: "#8e24aa", text: "#ffffff" },
  { name: "Lavender", hex: "#c084fc", text: "#111111" },
  { name: "Magenta", hex: "#ff00ff", text: "#ffffff" },
  { name: "Pink", hex: "#ff69b4", text: "#111111" },
  { name: "Maroon", hex: "#7f1d1d", text: "#ffffff" },
  { name: "Brown", hex: "#8d6e63", text: "#ffffff" },
  { name: "Charcoal", hex: "#374151", text: "#ffffff" },
  { name: "Gray", hex: "#757575", text: "#ffffff" },
  { name: "Silver", hex: "#c0c0c0", text: "#111111" },
  { name: "White", hex: "#f5f5f5", text: "#111111" },
];

const DEFAULT_ENABLED_COLORS = TEAM_COLORS.map((color) => color.name);

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample(array) {
  if (!array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
}

function clonePlayer(player) {
  return { ...player };
}

function cloneTeam(team) {
  return { ...team, members: team.members.map(clonePlayer) };
}

function cloneTeams(teams) {
  return teams.map(cloneTeam);
}

function getColorInfo(colorName, colors) {
  return colors.find((c) => c.name === colorName) || colors[0] || TEAM_COLORS[0];
}

function sortTeamsByGradient(teams, colors) {
  const order = colors.map((c) => c.name);
  return [...teams].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

function buildTeamShells(colors) {
  return colors.map((team, idx) => ({
    id: idx + 1,
    name: team.name,
    hex: team.hex,
    text: team.text,
    members: [],
  }));
}

function buildInitialSimulation(cast, colors) {
  const shuffledCast = shuffle(cast.map(clonePlayer));
  const teams = buildTeamShells(colors);
  const assigned = shuffle(shuffledCast);
  let cursor = 0;

  teams.forEach((team) => {
    for (let i = 0; i < 3; i += 1) {
      const player = assigned[cursor];
      cursor += 1;
      if (player) team.members.push({ ...player, currentColor: team.name });
    }
  });

  return {
    shuffledCast,
    teams,
    seasonSteps: [],
    currentSeasonStep: 0,
    finalWinners: null,
    colors,
  };
}

function buildSimulationFromCustomTeams(customTeams, colors) {
  const orderedTeams = sortTeamsByGradient(customTeams.map(cloneTeam), colors);

  return {
    shuffledCast: orderedTeams.flatMap((team) => team.members.map(clonePlayer)),
    teams: orderedTeams,
    seasonSteps: [],
    currentSeasonStep: 0,
    finalWinners: null,
    colors,
  };
}

function rankTeams(teams) {
  return shuffle(cloneTeams(teams)).map((team, index) => ({ ...team, rank: index + 1 }));
}

function runElimination(selectedTeam, lastPlaceTeam, roundNumber, colors) {
  const initialOrder = [
    ...selectedTeam.members.map((m) => ({ ...m, sourceTeam: selectedTeam.name })),
    ...lastPlaceTeam.members.map((m) => ({ ...m, sourceTeam: lastPlaceTeam.name })),
  ];

  let activeIds = initialOrder.map((p) => p.id);
  const rounds = [];

  [6, 5, 4].forEach((size) => {
    const activePlayers = initialOrder.filter((p) => activeIds.includes(p.id)).map(clonePlayer);
    const ordered = shuffle(activePlayers);
    const eliminated = clonePlayer(ordered[ordered.length - 1]);
    const remainingIds = activeIds.filter((id) => id !== eliminated.id);

    rounds.push({
      size,
      stableOrderBeforeMark: initialOrder.filter((p) => activeIds.includes(p.id)).map(clonePlayer),
      markedPlayers: initialOrder.filter((p) => activeIds.includes(p.id)).map(clonePlayer),
      eliminated,
      remainingPlayers: initialOrder.filter((p) => remainingIds.includes(p.id)).map(clonePlayer),
    });

    activeIds = remainingIds;
  });

  const survivors = initialOrder.filter((p) => activeIds.includes(p.id)).map(clonePlayer);
  const colorCounts = survivors.reduce((acc, player) => {
    acc[player.currentColor] = (acc[player.currentColor] || 0) + 1;
    return acc;
  }, {});

  const majorityColorName = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || survivors[0]?.currentColor || colors[0]?.name;
  const colorInfo = getColorInfo(majorityColorName, colors);
  const needsRecolor = survivors.some((player) => player.currentColor !== majorityColorName);

  const newTeam = {
    id: `${roundNumber}-${majorityColorName}-${Math.random().toString(36).slice(2, 8)}`,
    name: majorityColorName,
    hex: colorInfo.hex,
    text: colorInfo.text,
    members: survivors.map((player) => ({ ...clonePlayer(player), currentColor: majorityColorName })),
  };

  return {
    selectedTeam: cloneTeam(selectedTeam),
    lastPlaceTeam: cloneTeam(lastPlaceTeam),
    rounds,
    survivors,
    majorityColorName,
    needsRecolor,
    newTeam,
  };
}

function addEliminationSteps({ seasonSteps, roundNumber, isFinal, ranked, winnerTeam, selectedTeam, lastPlaceTeam, elimination }) {
  elimination.rounds.forEach((round, index) => {
    if (index === 0) {
      seasonSteps.push({
        kind: "elim-start",
        roundNumber,
        isFinal,
        title: isFinal ? "Final Elimination (6 Players)" : `Round ${roundNumber} Elimination (6 Players)`,
        ranked: ranked.map(cloneTeam),
        winnerTeam,
        selectedTeam,
        lastPlaceTeam,
        elimination,
        eliminationRound: round,
      });
    }

    seasonSteps.push({
      kind: `elim-mark-${round.size}`,
      roundNumber,
      isFinal,
      title: isFinal ? `Final Elimination (${round.size} Players)` : `Round ${roundNumber} Elimination (${round.size} Players)`,
      ranked: ranked.map(cloneTeam),
      winnerTeam,
      selectedTeam,
      lastPlaceTeam,
      elimination,
      eliminationRound: round,
    });

    seasonSteps.push({
      kind: `elim-remove-${round.size}`,
      roundNumber,
      isFinal,
      title: isFinal ? `Final Elimination (${round.size - 1} Remain)` : `Round ${roundNumber} Elimination (${round.size - 1} Remain)`,
      ranked: ranked.map(cloneTeam),
      winnerTeam,
      selectedTeam,
      lastPlaceTeam,
      elimination,
      eliminationRound: round,
    });
  });
}

function buildEliminationChart(seasonSteps, allPlayers) {
  const rounds = [];
  const resultMap = new Map(allPlayers.map((p) => [p.id, []]));
  const colorMap = new Map(allPlayers.map((p) => [p.id, []]));

  seasonSteps.forEach((step) => {
    if (step.kind === "challenge") {
      rounds.push(`R${step.roundNumber}`);
      const teamByPlayer = new Map();
      step.ranked.forEach((team) => team.members.forEach((member) => teamByPlayer.set(member.id, team.name)));

      const winIds = new Set(step.winnerTeam.members.map((p) => p.id));
      const dangerIds = new Set([
        ...step.selectedTeam.members.map((p) => p.id),
        ...step.lastPlaceTeam.members.map((p) => p.id),
      ]);

      allPlayers.forEach((player) => {
        let status = "";
        if (winIds.has(player.id)) status = "WIN";
        else if (dangerIds.has(player.id)) status = "IN";
        else if (teamByPlayer.has(player.id)) status = "SAFE";
        resultMap.get(player.id).push(status);
        colorMap.get(player.id).push(teamByPlayer.get(player.id) || null);
      });
    }

    if (step.kind.startsWith("elim-remove-")) {
      const eliminated = step.eliminationRound?.eliminated;
      if (eliminated) {
        const row = resultMap.get(eliminated.id);
        if (row && row.length) row[row.length - 1] = "OUT";
      }
    }

    if (step.kind === "winners") {
      const winners = new Set(step.elimination.newTeam.members.map((p) => p.id));
      allPlayers.forEach((player) => {
        if (winners.has(player.id)) {
          const row = resultMap.get(player.id);
          if (row && row.length) row[row.length - 1] = "WINNER";
        }
      });
    }
  });

  return {
    rounds,
    rows: allPlayers
      .map((player) => ({
        player,
        results: resultMap.get(player.id) || [],
        roundColors: colorMap.get(player.id) || [],
      }))
      .sort((a, b) => {
        const aWinner = a.results.includes("WINNER") ? 1 : 0;
        const bWinner = b.results.includes("WINNER") ? 1 : 0;
        if (aWinner !== bWinner) return bWinner - aWinner;
        return b.results.lastIndexOf("OUT") - a.results.lastIndexOf("OUT");
      }),
  };
}

function buildSeasonSteps(initialTeams, colors, allPlayers) {
  let teams = cloneTeams(initialTeams);
  const seasonSteps = [];
  let roundNumber = 1;

  while (teams.length > 2) {
    const ranked = rankTeams(teams);
    const winnerTeam = cloneTeam(ranked[0]);
    const lastPlaceTeam = cloneTeam(ranked[ranked.length - 1]);
    const eligibleChoices = ranked.filter((team) => team.id !== winnerTeam.id && team.id !== lastPlaceTeam.id);
    const selectedTeam = cloneTeam(sample(eligibleChoices) || ranked[1]);
    const elimination = runElimination(selectedTeam, lastPlaceTeam, roundNumber, colors);

    seasonSteps.push({ kind: "challenge", roundNumber, isFinal: false, title: `Round ${roundNumber} Challenge Results`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });
    seasonSteps.push({ kind: "selection-initial", roundNumber, isFinal: false, title: `Round ${roundNumber} — Results`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });
    seasonSteps.push({ kind: "selection-mystery", roundNumber, isFinal: false, title: `Round ${roundNumber} — Winner Chooses Opponent`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });
    seasonSteps.push({ kind: "selection-reveal", roundNumber, isFinal: false, title: `Round ${roundNumber} — Opponent Revealed`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });
    seasonSteps.push({ kind: "selection-final", roundNumber, isFinal: false, title: `Round ${roundNumber} — Elimination Set`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });

    addEliminationSteps({ seasonSteps, roundNumber, isFinal: false, ranked, winnerTeam, selectedTeam, lastPlaceTeam, elimination });

    seasonSteps.push({ kind: "survivors-old-colors", roundNumber, isFinal: false, title: `Round ${roundNumber} — Survivors`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination });

    teams = teams.filter((team) => team.id !== selectedTeam.id && team.id !== lastPlaceTeam.id);
    const newTeam = cloneTeam(elimination.newTeam);
    const order = colors.map((c) => c.name);
    const insertIndex = teams.findIndex((t) => order.indexOf(t.name) > order.indexOf(newTeam.name));
    if (insertIndex === -1) teams.push(newTeam);
    else teams.splice(insertIndex, 0, newTeam);

    teams = sortTeamsByGradient(teams, colors);

    seasonSteps.push({ kind: "new-team", roundNumber, isFinal: false, title: `Round ${roundNumber} New Team Formed`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination, teamsAfterRound: cloneTeams(teams) });
    seasonSteps.push({ kind: "teams-overview", roundNumber, isFinal: false, title: `Round ${roundNumber} Updated Teams`, ranked: ranked.map(cloneTeam), winnerTeam, selectedTeam, lastPlaceTeam, elimination, teamsAfterRound: cloneTeams(teams) });

    roundNumber += 1;
  }

  const finalRanked = rankTeams(teams);
  const finalistA = cloneTeam(finalRanked[0]);
  const finalistB = cloneTeam(finalRanked[1]);
  const finalElimination = runElimination(finalistA, finalistB, roundNumber, colors);

  seasonSteps.push({ kind: "challenge", roundNumber, isFinal: true, title: "Final Two Teams", ranked: finalRanked.map(cloneTeam), winnerTeam: finalistA, selectedTeam: finalistA, lastPlaceTeam: finalistB, elimination: finalElimination });
  addEliminationSteps({ seasonSteps, roundNumber, isFinal: true, ranked: finalRanked, winnerTeam: finalistA, selectedTeam: finalistA, lastPlaceTeam: finalistB, elimination: finalElimination });
  seasonSteps.push({ kind: "survivors-old-colors", roundNumber, isFinal: true, title: "Final Survivors", ranked: finalRanked.map(cloneTeam), winnerTeam: finalistA, selectedTeam: finalistA, lastPlaceTeam: finalistB, elimination: finalElimination });
  seasonSteps.push({ kind: "winners", roundNumber, isFinal: true, title: "Season Winners", ranked: finalRanked.map(cloneTeam), winnerTeam: finalistA, selectedTeam: finalistA, lastPlaceTeam: finalistB, elimination: finalElimination });
  seasonSteps.push({ kind: "chart", roundNumber, isFinal: true, title: "Elimination Chart", chartData: buildEliminationChart(seasonSteps, allPlayers) });

  return { seasonSteps, finalWinners: cloneTeam(finalElimination.newTeam) };
}

function CastCard({ player, border = "#ffffff", nameColor = "#000000", small = false, grayscale = false }) {
  const isWhite = border.toLowerCase() === "#ffffff";

  return (
    <div className={`${small ? "rounded-xl p-1.5" : "rounded-2xl p-2"} shadow-lg`} style={{ background: isWhite ? "#ffffff" : border, border: `${small ? 3 : 4}px solid ${border}` }}>
      <div className={`w-full overflow-hidden bg-neutral-900 ${small ? "rounded-lg aspect-square" : "rounded-xl aspect-[3/4]"}`}>
        {player.image ? (
          <img src={player.image} alt={player.name} className="h-full w-full object-cover" style={{ filter: grayscale ? "grayscale(100%) brightness(0.55)" : "none" }} draggable={false} />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-white/50">No Image</div>
        )}
      </div>
      <div className={`${small ? "pt-1 text-[11px] sm:text-xs" : "pt-2 text-sm sm:text-base"} text-center font-bold leading-tight`} style={{ color: nameColor }}>
        {player.name}
      </div>
    </div>
  );
}

function TeamPanel({ team, title, dragEnabled = false, onDropPlayer, onDragStart }) {
  const borderColor = team.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)";

  return (
    <div
      className={`${dragEnabled ? "rounded-2xl p-3" : "rounded-3xl p-4"} shadow-2xl`}
      style={{ background: team.hex, color: team.text, border: `2px solid ${borderColor}` }}
      onDragOver={dragEnabled ? (e) => e.preventDefault() : undefined}
      onDrop={dragEnabled ? (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/player-id");
        if (id) onDropPlayer?.(id, team.name);
      } : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className={`${dragEnabled ? "text-base" : "text-xl"} font-extrabold`}>{title}</h3>
          <p className="text-xs sm:text-sm font-semibold opacity-85">{team.name} Team</p>
        </div>
        {dragEnabled && <div className="text-xs font-bold opacity-80">{team.members.length}/3</div>}
      </div>

      <div className={`grid grid-cols-3 ${dragEnabled ? "gap-2 min-h-[105px]" : "gap-3"}`}>
        {team.members.map((player) => (
          <div
            key={`${team.id}-${player.id}`}
            draggable={dragEnabled}
            onDragStart={dragEnabled ? (e) => {
              e.dataTransfer.setData("text/player-id", String(player.id));
              e.dataTransfer.effectAllowed = "move";
              onDragStart?.(player.id);
            } : undefined}
            className={`${dragEnabled ? "rounded-xl p-1.5" : "rounded-2xl p-2"} bg-black/20 cursor-grab active:cursor-grabbing`}
            style={{ border: `2px solid ${borderColor}` }}
          >
            <div className={`${dragEnabled ? "rounded-lg" : "rounded-xl"} aspect-[3/4] overflow-hidden bg-black/20`}>
              {player.image ? (
                <img src={player.image} alt={player.name} className="h-full w-full object-cover" draggable={false} />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs">No Image</div>
              )}
            </div>
            <div className={`${dragEnabled ? "pt-1 text-[10px]" : "pt-2 text-sm"} text-center font-bold leading-tight`}>
              {player.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedTeamsList({ ranked, winnerTeam, lastPlaceTeam, isFinal }) {
  return (
    <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {ranked.map((team) => (
        <div key={`${team.rank}-${team.id}`} className="rounded-3xl p-4 shadow-2xl" style={{ background: team.hex, color: team.text, border: `2px solid ${team.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)"}` }}>
          <div className="mb-2">
            <div className="text-xl font-extrabold">#{team.rank} {team.name} Team</div>
            <div className="text-sm font-semibold opacity-85">{team.id === winnerTeam.id ? (isFinal ? "Finalist" : "SAFE — won") : team.id === lastPlaceTeam.id ? "LAST — elimination" : "Safe"}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {team.members.map((player) => (
              <div key={`${team.id}-${player.id}`} className="rounded-2xl bg-black/20 p-2 text-center" style={{ border: `2px solid ${team.text === "#111111" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.28)"}` }}>
                <div className="aspect-square overflow-hidden rounded-xl bg-black/20">
                  {player.image ? (
                    <img src={player.image} alt={player.name} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs">No Image</div>
                  )}
                </div>
                <div className="pt-1 text-xs font-bold leading-tight">{player.name}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EliminationGrid({ players, markedId = null, recolorTo = null, colors }) {
  return (
    <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-6">
      {players.map((player) => {
        const colorName = recolorTo || player.currentColor;
        const colorInfo = getColorInfo(colorName, colors);
        const isMarked = player.id === markedId;

        return (
          <CastCard
            key={`elim-${player.id}-${colorName}-${isMarked ? "marked" : "live"}`}
            player={player}
            border={isMarked ? "#111111" : colorInfo.hex}
            nameColor={isMarked ? "#ffffff" : "#000000"}
            grayscale={isMarked}
          />
        );
      })}
    </div>
  );
}

function statusCellClass(status) {
  switch (status) {
    case "WINNER": return "bg-yellow-300 text-black";
    case "WIN": return "bg-green-500 text-white";
    case "SAFE": return "bg-slate-500 text-white";
    case "IN": return "bg-orange-500 text-white";
    case "OUT": return "bg-red-600 text-white";
    default: return "bg-white/5 text-white/30";
  }
}

function EliminationChart({ data, colors }) {
  const swatchStyle = (colorName) => {
    const color = colorName ? getColorInfo(colorName, colors) : null;
    return {
      background: color ? color.hex : "transparent",
      border: color ? `1px solid ${color.text === "#111111" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.35)"}` : "1px solid transparent",
    };
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/20 p-4">
      <table className="min-w-full text-xs sm:text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left">Player</th>
            {data.rounds.map((r) => <th key={r} className="px-3 py-2 text-center">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.player.id}>
              <td className="px-3 py-2 font-bold whitespace-nowrap">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-5 rounded-sm" style={swatchStyle(row.roundColors[0] || null)} />
                  {row.player.name}
                </div>
              </td>
              {row.results.map((res, i) => (
                <td key={i} className={`px-3 py-2 text-center font-bold ${statusCellClass(res)}`}>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-5 rounded-sm" style={swatchStyle(row.roundColors[i] || null)} />
                    {res || "-"}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomTeamsBuilder({ colors, customTeams, customPool, onDragStart, onDropToTeam, onDropToPool, onStartSimulation, onAutoFill }) {
  const canStart = customPool.length === 0 && customTeams.length >= 2 && customTeams.every((team) => team.members.length === 3);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onAutoFill} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">
            Auto Fill
          </button>
          <button onClick={onStartSimulation} disabled={!canStart} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-40">
            Start Custom
          </button>
        </div>
        <p className="mt-2 text-xs text-white/75">
          Drag players into any starting team. Every enabled team needs exactly 3 players.
        </p>
      </div>

      <div
        className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-xl"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/player-id");
          if (id) onDropToPool(id);
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-extrabold">Unassigned Players</h2>
          <div className="text-xs font-semibold text-white/75">{customPool.length} left</div>
        </div>
        <div className="grid gap-1 grid-cols-3 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-12 min-h-[96px]">
          {customPool.map((player) => (
            <div key={`pool-${player.id}`} draggable onDragStart={(e) => {
              e.dataTransfer.setData("text/player-id", String(player.id));
              e.dataTransfer.effectAllowed = "move";
              onDragStart(player.id);
            }}>
              <CastCard player={player} small />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {customTeams.map((team) => (
          <TeamPanel key={`custom-${team.id}`} team={team} title={`${team.name} Team`} dragEnabled onDropPlayer={onDropToTeam} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

function AddCastMembersModal({
  casts,
  modalCastId,
  modalContestants,
  modalSelectedIds,
  loadingCasts,
  loadingContestants,
  onClose,
  onChooseCast,
  onToggleContestant,
  onSelectAll,
  onSelectNone,
  onAddSelected,
}) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const selectedCount = modalSelectedIds.size;

  const groupedOfficial = officialCasts.reduce((groups, cast) => {
    const groupName = cast.show_name || "Official Casts";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(cast);
    return groups;
  }, {});

  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) {
      onChooseCast(firstCastId);
    }
  }, [modalCastId, firstCastId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-slate-400 text-sm">Pick an official or custom cast, select people, then add them to this Trio roster.</p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] min-h-0 flex-1 overflow-hidden">
          <div className="border-r border-slate-800 p-4 overflow-auto space-y-4">
            {loadingCasts ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 text-slate-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {Object.keys(groupedOfficial).length > 0 && (
                  <div>
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Favorite Official Casts</div>
                    <div className="space-y-2">
                      {Object.entries(groupedOfficial).map(([groupName, groupCasts]) => (
                        <div key={groupName}>
                          <div className="text-slate-500 text-xs font-bold mb-1">{groupName}</div>
                          {groupCasts.map((cast) => (
                            <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black mb-2 ${modalCastId === cast.id ? "bg-blue-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                              {cast.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customCasts.length > 0 && (
                  <div>
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Custom Casts</div>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black ${modalCastId === cast.id ? "bg-blue-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                          <div>{cast.name}</div>
                          <div className="text-xs opacity-70 font-bold">{cast.show_name || "Custom Cast"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-slate-400 text-sm">{selectedCount} selected</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">Select None</button>
                <button onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 font-black text-white">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-300">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-300">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);

                  return (
                    <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative rounded-2xl overflow-hidden border aspect-square ${active ? "border-white ring-2 ring-white/60" : "border-slate-700 opacity-45 grayscale"}`}>
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-1 bg-slate-800">No Image</div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-center text-xs font-black py-1 truncate px-1">
                        {person.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrioSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [enabledColorNames, setEnabledColorNames] = useState(DEFAULT_ENABLED_COLORS);

  const enabledColors = useMemo(
    () => TEAM_COLORS.filter((color) => enabledColorNames.includes(color.name)),
    [enabledColorNames]
  );

  const selectedRoster = useMemo(
    () => roster.filter((player) => selectedRosterIds.includes(player.id)),
    [roster, selectedRosterIds]
  );

  const playableCount = Math.floor(selectedRoster.length / 3) * 3;
  const playableTeamCount = playableCount / 3;
  const activeColorsForStart = enabledColors.slice(0, playableTeamCount);
  const canStart = playableCount >= 6 && activeColorsForStart.length >= 2;

  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [simData, setSimData] = useState(() => buildInitialSimulation([], TEAM_COLORS.slice(0, 2)));
  const [step, setStep] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customState, setCustomState] = useState(() => ({
    teams: buildTeamShells(TEAM_COLORS.slice(0, 2)),
    pool: [],
  }));

  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const { shuffledCast, teams, seasonSteps, currentSeasonStep, finalWinners, colors } = simData;
  const currentSeasonView = seasonSteps[currentSeasonStep] || null;

  const playerToTeam = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => team.members.forEach((member) => map.set(member.id, team)));
    return map;
  }, [teams]);

  const phaseLabel = useMemo(() => {
    if (customMode) return "Custom Teams Setup";
    if (step === 0) return "Setup";
    if (step === 1) return "Cast Reveal";
    if (step === 2) return "Teams Sorted";
    return currentSeasonView?.title || "Season";
  }, [customMode, step, currentSeasonView]);

  useEffect(() => {
    loadSavedCasts();
  }, []);

  async function loadSavedCasts() {
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

    setAvailableCasts([...officialCasts, ...(userCasts || [])]);
    setLoadingCasts(false);
  }

  async function openAddCastModal() {
    setShowAddCastModal(true);

    if (!modalCastId && availableCasts.length > 0) {
      await loadContestantsForModal(availableCasts[0].id);
    }
  }

  async function loadContestantsForModal(castId) {
    setModalCastId(castId);
    setModalSelectedIds(new Set());
    setLoadingModalContestants(true);

    const { data, error } = await supabase
      .from("contestants")
      .select("id, name, image_url, cast_id")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      setLoadingModalContestants(false);
      return;
    }

    setModalContestants(data || []);
    setLoadingModalContestants(false);
  }

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));

    if (selectedPeople.length === 0) return;

    const additions = selectedPeople.map((person) => ({
      id: `${person.cast_id || modalCastId}-${person.id}`,
      name: person.name,
      image: person.image_url || "",
    }));

    setRoster((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const next = [...current, ...additions.filter((person) => !existingIds.has(person.id))];
      setSelectedRosterIds(next.map((p) => p.id));
      return next;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function clearRoster() {
    const ok = confirm("Clear the current Trio roster?");
    if (!ok) return;

    setRoster([]);
    setSelectedRosterIds([]);
    setStep(0);
    setCustomMode(false);
    setSimData(buildInitialSimulation([], TEAM_COLORS.slice(0, 2)));
  }

  function toggleRosterPlayer(id) {
    if (step !== 0 || customMode) return;

    setSelectedRosterIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return [...current, id];
    });
  }

  function toggleColor(name) {
    if (step !== 0 || customMode) return;

    setEnabledColorNames((current) => {
      if (current.includes(name)) {
        if (current.length <= 2) return current;
        return current.filter((x) => x !== name);
      }

      return TEAM_COLORS.filter((c) => current.includes(c.name) || c.name === name).map((c) => c.name);
    });
  }

  function startRandom() {
    if (!canStart) return;

    const chosenPlayers = shuffle(selectedRoster).slice(0, playableCount);
    const chosenColors = activeColorsForStart;

    setSimData(buildInitialSimulation(chosenPlayers, chosenColors));
    setStep(1);
    setCustomMode(false);
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
  }

  function openCustomTeams() {
    if (!canStart) return;

    const chosenPlayers = selectedRoster.slice(0, playableCount).map(clonePlayer);
    const teamsForCustom = buildTeamShells(activeColorsForStart);

    setCustomState({
      teams: teamsForCustom,
      pool: chosenPlayers,
    });
    setCustomMode(true);
    setStep(0);
  }

  function movePlayer(playerId, targetTeamName = null) {
    setCustomState((current) => {
      const allPlayers = [...current.pool, ...current.teams.flatMap((t) => t.members)];
      const player = allPlayers.find((p) => String(p.id) === String(playerId));
      if (!player) return current;

      const pool = current.pool.filter((p) => String(p.id) !== String(playerId));
      const teams = current.teams.map((team) => ({
        ...team,
        members: team.members.filter((p) => String(p.id) !== String(playerId)),
      }));

      if (!targetTeamName) {
        return { teams, pool: [...pool, clonePlayer(player)] };
      }

      const teamIndex = teams.findIndex((team) => team.name === targetTeamName);
      if (teamIndex === -1 || teams[teamIndex].members.length >= 3) return current;

      teams[teamIndex] = {
        ...teams[teamIndex],
        members: [...teams[teamIndex].members, { ...clonePlayer(player), currentColor: targetTeamName }],
      };

      return { teams, pool };
    });
  }

  function autoFillCustom() {
    const shuffled = shuffle(selectedRoster.slice(0, playableCount));
    const nextTeams = buildTeamShells(activeColorsForStart);
    let cursor = 0;

    nextTeams.forEach((team) => {
      for (let i = 0; i < 3; i += 1) {
        const player = shuffled[cursor];
        cursor += 1;
        if (player) team.members.push({ ...player, currentColor: team.name });
      }
    });

    setCustomState({ teams: nextTeams, pool: [] });
  }

  function startCustomSimulation() {
    const valid =
      customState.pool.length === 0 &&
      customState.teams.length >= 2 &&
      customState.teams.every((team) => team.members.length === 3);

    if (!valid) return;

    setCustomMode(false);
    setSimData(buildSimulationFromCustomTeams(customState.teams, activeColorsForStart));
    setStep(2);
  }

  function advance() {
    if (customMode) return;

    if (step === 0) {
      startRandom();
      return;
    }

    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }

    if (step === 2) {
      const result = buildSeasonSteps(teams, colors, shuffledCast);

      setSimData((current) => ({
        ...current,
        seasonSteps: result.seasonSteps,
        currentSeasonStep: 0,
        finalWinners: result.finalWinners,
      }));
      setStep(3);
      return;
    }

    if (currentSeasonStep < seasonSteps.length - 1) {
      setSimData((current) => ({
        ...current,
        currentSeasonStep: current.currentSeasonStep + 1,
      }));
    }
  }

  function goBack() {
    if (customMode) {
      setCustomMode(false);
      return;
    }

    if (step < 3) {
      setStep((current) => Math.max(current - 1, 0));
      return;
    }

    if (currentSeasonStep > 0) {
      setSimData((current) => ({
        ...current,
        currentSeasonStep: current.currentSeasonStep - 1,
      }));
      return;
    }

    setStep(2);
  }

  function restart() {
    setCustomMode(false);
    setStep(0);
    setSimData(buildInitialSimulation([], TEAM_COLORS.slice(0, 2)));
    setSeasonTitle("");
    setSeasonSummary("");
  }

  async function saveSeason() {
    if (!finalWinners) {
      alert("Finish the season first.");
      return;
    }

    setSavingSeason(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("You must be logged in.");
      setSavingSeason(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_seasons")
      .insert({
        user_id: userData.user.id,
        simulator_type: "trio",
        title: seasonTitle.trim() || "Trio Season",
        summary: seasonSummary.trim() || `${finalWinners.name} Team won a Trio season.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "trio",
          shuffledCast,
          teams,
          seasonSteps,
          currentSeasonStep,
          finalWinners,
          colors,
        },
      })
      .select()
      .single();

    setSavingSeason(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/seasons/${data.id}`);
  }

  const isLastStep =
    !customMode &&
    step === 3 &&
    seasonSteps.length > 0 &&
    currentSeasonStep === seasonSteps.length - 1;

  const introGridCols = playableCount > 36
    ? "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9"
    : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Trio</h1>
              <p className="mt-2 text-sm text-white/75 sm:text-base">
                {selectedRoster.length} selected • {playableCount} will play • {activeColorsForStart.length} teams of 3
              </p>
              <p className="mt-1 text-sm font-semibold text-white/90">Current Phase: {phaseLabel}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {step === 0 && !customMode && (
                <>
                  <button onClick={openAddCastModal} className="rounded-2xl border border-white/15 bg-blue-500 px-4 py-2 font-semibold text-white transition hover:scale-[1.02] hover:bg-blue-400">
                    Add Cast Members
                  </button>

                  <button onClick={clearRoster} className="rounded-2xl border border-white/15 bg-red-500 px-4 py-2 font-semibold text-white transition hover:scale-[1.02] hover:bg-red-400">
                    Clear Roster
                  </button>

                  <Link href="/custom-casts" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/15">
                    Manage Casts
                  </Link>

                  <button onClick={openCustomTeams} disabled={!canStart} className="rounded-2xl border border-white/15 bg-fuchsia-400 px-4 py-2 font-semibold text-black transition hover:scale-[1.02] hover:bg-fuchsia-300 disabled:opacity-40">
                    Custom Teams
                  </button>
                </>
              )}

              <button onClick={goBack} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40" disabled={step === 0 && !customMode}>
                Back
              </button>

              {!customMode && (
                <button onClick={advance} className="rounded-2xl border border-white/15 bg-white px-4 py-2 font-semibold text-black transition hover:scale-[1.02] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40" disabled={isLastStep || (step === 0 && !canStart)}>
                  {step === 0 ? "Start Random Trio" : "Advance"}
                </button>
              )}

              {!customMode && (
                <button onClick={restart} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/15">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {step === 0 && !customMode && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">Cast</h2>
                  <p className="text-sm text-white/70">
                    Select any amount. The simulator will only start with the largest multiple of 3.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelectedRosterIds(roster.map((p) => p.id))} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">
                    Select All
                  </button>
                  <button onClick={() => setSelectedRosterIds([])} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">
                    Select None
                  </button>
                </div>
              </div>

              {roster.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-white/70">
                  No cast members added yet. Click Add Cast Members.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-2">
                  {roster.map((player) => {
                    const selected = selectedRosterIds.includes(player.id);

                    return (
                      <button key={player.id} type="button" onClick={() => toggleRosterPlayer(player.id)} className={`transition ${selected ? "opacity-100 scale-[1.02]" : "opacity-35 grayscale"}`}>
                        <CastCard player={player} small />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h2 className="text-2xl font-extrabold">Team Colors</h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEnabledColorNames(TEAM_COLORS.map((color) => color.name))}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnabledColorNames([])}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold"
                  >
                    Select None
                  </button>
                </div>
              </div>

              <p className="text-sm text-white/70 mb-4">
                Enable colors you want available. The first {playableTeamCount || 0} enabled colors will be used.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {TEAM_COLORS.map((color) => {
                  const enabled = enabledColorNames.includes(color.name);
                  const willUse = activeColorsForStart.some((c) => c.name === color.name);

                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => toggleColor(color.name)}
                      className={`rounded-2xl p-3 text-left font-black border-2 transition ${enabled ? "opacity-100" : "opacity-35 grayscale"} ${willUse ? "ring-4 ring-white/60" : ""}`}
                      style={{ background: color.hex, color: color.text, borderColor: color.text === "#111111" ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.35)" }}
                    >
                      {color.name}
                      <div className="text-xs font-bold opacity-75">
                        {willUse ? "Will Use" : enabled ? "Enabled" : "Disabled"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!canStart && (
                <div className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/15 p-4 text-sm font-bold text-red-100">
                  Add/select at least 6 players and enable enough team colors to start.
                </div>
              )}
            </div>
          </div>
        )}

        {customMode && (
          <CustomTeamsBuilder
            colors={activeColorsForStart}
            customTeams={customState.teams}
            customPool={customState.pool}
            onDragStart={() => {}}
            onDropToTeam={(playerId, teamName) => movePlayer(playerId, teamName)}
            onDropToPool={(playerId) => movePlayer(playerId, null)}
            onStartSimulation={startCustomSimulation}
            onAutoFill={autoFillCustom}
          />
        )}

        {!customMode && step > 0 && step < 2 && (
          <>
            <div className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">
              The full cast appears in a random order with white boxes around each player.
            </div>
            <div className={`grid gap-2 ${introGridCols}`}>
              {shuffledCast.map((player) => {
                const team = playerToTeam.get(player.id);
                return <CastCard key={player.id} player={player} border={step === 1 ? "#ffffff" : team?.hex || "#ffffff"} nameColor="#000000" small />;
              })}
            </div>
          </>
        )}

        {!customMode && step === 2 && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">
              The cast is now sorted into teams of three. Advance again to go to the first challenge results page.
            </div>
            <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => <TeamPanel key={team.id} team={team} title={`${team.name} Team`} />)}
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "challenge" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">
              {currentSeasonView.isFinal ? "Only two teams remain. They now enter the final elimination path." : "This page ranks the teams in the challenge. First place is safe, and last place is automatically sent into elimination."}
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="mb-3 text-2xl font-extrabold">{currentSeasonView.title}</h2>
              <RankedTeamsList ranked={currentSeasonView.ranked} winnerTeam={currentSeasonView.winnerTeam} lastPlaceTeam={currentSeasonView.lastPlaceTeam} isFinal={currentSeasonView.isFinal} />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "selection-initial" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The winning team is safe. The last place team is automatically sent to elimination.</div>
            <div className="grid gap-5 xl:grid-cols-2">
              <TeamPanel team={currentSeasonView.winnerTeam} title="Winning Team" />
              <TeamPanel team={currentSeasonView.lastPlaceTeam} title="Last Place Team" />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "selection-mystery" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The winning team must now choose another team to send into elimination...</div>
            <div className="grid gap-5 xl:grid-cols-2">
              <TeamPanel team={currentSeasonView.winnerTeam} title="Winning Team" />
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 text-xl font-extrabold flex items-center justify-center">???</div>
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "selection-reveal" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The chosen team has been revealed.</div>
            <div className="grid gap-5 xl:grid-cols-2">
              <TeamPanel team={currentSeasonView.winnerTeam} title="Winning Team" />
              <TeamPanel team={currentSeasonView.selectedTeam} title="Chosen Team" />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "selection-final" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">These two teams will face off in elimination.</div>
            <div className="grid gap-5 xl:grid-cols-2">
              <TeamPanel team={currentSeasonView.selectedTeam} title="Chosen Team" />
              <TeamPanel team={currentSeasonView.lastPlaceTeam} title="Last Place Team" />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "elim-start" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The elimination round begins. Everyone is still in, and nobody has been eliminated yet.</div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="mb-3 text-2xl font-extrabold">{currentSeasonView.title}</h2>
              <EliminationGrid players={currentSeasonView.eliminationRound.stableOrderBeforeMark} colors={colors} />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind?.startsWith("elim-mark-") && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">One player is marked for elimination.</div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="mb-3 text-2xl font-extrabold">{currentSeasonView.title}</h2>
              <EliminationGrid players={currentSeasonView.eliminationRound.markedPlayers} markedId={currentSeasonView.eliminationRound.eliminated.id} colors={colors} />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind?.startsWith("elim-remove-") && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The eliminated player is gone. The rest move on.</div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="mb-3 text-2xl font-extrabold">{currentSeasonView.title}</h2>
              <EliminationGrid players={currentSeasonView.eliminationRound.remainingPlayers} colors={colors} />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "survivors-old-colors" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">Three players remain. They still show their original team colors.</div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <h2 className="mb-3 text-2xl font-extrabold">{currentSeasonView.title}</h2>
              <EliminationGrid players={currentSeasonView.elimination.survivors} colors={colors} />
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "new-team" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">The surviving trio becomes the new team moving forward.</div>
            <div className="rounded-3xl p-5 shadow-2xl" style={{ background: currentSeasonView.elimination.newTeam.hex, color: currentSeasonView.elimination.newTeam.text, border: `2px solid ${currentSeasonView.elimination.newTeam.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)"}` }}>
              <div className="mb-2 text-sm font-bold uppercase tracking-[0.18em] opacity-80">{currentSeasonView.elimination.needsRecolor ? "New Team Formed" : `${currentSeasonView.elimination.newTeam.name} Team Stays ${currentSeasonView.elimination.newTeam.name} Team`}</div>
              <h2 className="text-3xl font-extrabold">{currentSeasonView.elimination.newTeam.name} Team</h2>
              <p className="mt-2 text-sm font-semibold opacity-85">This team returns to the game with 3 players.</p>
            </div>
            <EliminationGrid players={currentSeasonView.elimination.newTeam.members} recolorTo={currentSeasonView.elimination.newTeam.name} colors={colors} />
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "teams-overview" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">Here are the full current teams before the next challenge begins.</div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {currentSeasonView.teamsAfterRound.map((team) => <TeamPanel key={`overview-${currentSeasonView.roundNumber}-${team.id}`} team={team} title={`${team.name} Team`} />)}
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "winners" && finalWinners && (
          <div className="space-y-6">
            <div className="rounded-3xl p-6 shadow-2xl" style={{ background: finalWinners.hex, color: finalWinners.text, border: `2px solid ${finalWinners.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)"}` }}>
              <div className="mb-2 text-sm font-bold uppercase tracking-[0.2em] opacity-80">Season Winners</div>
              <h2 className="text-4xl font-extrabold">{finalWinners.name} Team Wins</h2>
              <p className="mt-2 text-base font-semibold opacity-85">The final surviving trio gives the season victory to the {finalWinners.name.toLowerCase()} color.</p>
            </div>

            <EliminationGrid players={finalWinners.members} recolorTo={finalWinners.name} colors={colors} />

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h3 className="mb-3 text-2xl font-extrabold">Save Season</h3>

              <div className="grid gap-3 max-w-xl">
                <input value={seasonTitle} onChange={(e) => setSeasonTitle(e.target.value)} placeholder="Season title" className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" />
                <textarea value={seasonSummary} onChange={(e) => setSeasonSummary(e.target.value)} placeholder="Season summary" rows={3} className="rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white" />

                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} />
                  Post publicly
                </label>

                <button onClick={saveSeason} disabled={savingSeason} className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-40">
                  {savingSeason ? "Saving..." : "Save Season"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!customMode && step === 3 && currentSeasonView?.kind === "chart" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-xl">Here is the full elimination chart for the completed simulation.</div>
            <EliminationChart data={currentSeasonView.chartData} colors={colors} />
          </div>
        )}

        {showAddCastModal && (
          <AddCastMembersModal
            casts={availableCasts}
            modalCastId={modalCastId}
            modalContestants={modalContestants}
            modalSelectedIds={modalSelectedIds}
            loadingCasts={loadingCasts}
            loadingContestants={loadingModalContestants}
            onClose={() => setShowAddCastModal(false)}
            onChooseCast={loadContestantsForModal}
            onToggleContestant={(id) =>
              setModalSelectedIds((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              })
            }
            onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))}
            onSelectNone={() => setModalSelectedIds(new Set())}
            onAddSelected={addSelectedContestantsToRoster}
          />
        )}
      </div>
    </div>
  );
}
