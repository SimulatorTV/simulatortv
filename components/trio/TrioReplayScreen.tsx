// @ts-nocheck

"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../Navbar";

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
}

function clonePlayer(player) {
  return { ...player };
}

function getColorInfo(colorName, colors) {
  return (
    (colors || []).find((c) => c.name === colorName) || {
      name: colorName || "Team",
      hex: "#64748b",
      text: "#ffffff",
    }
  );
}

function textFor(hex, fallback = "#ffffff") {
  if (!hex) return fallback;
  const clean = String(hex).replace("#", "");
  if (clean.length !== 6) return fallback;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? "#111111" : "#ffffff";
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function PlayerCard({ player, color = null, small = false, grayscale = false, marked = false }) {
  if (!player) return null;

  const hex = marked ? "#111111" : color?.hex || "#ffffff";
  const text = marked ? "#ffffff" : color?.text || textFor(hex, "#111111");
  const image = getImage(player);

  return (
    <div
      className={`${small ? "rounded-xl p-1.5" : "rounded-2xl p-2"} text-center shadow-lg`}
      style={{
        background: hex,
        color: text,
        border: `${small ? 3 : 4}px solid ${hex}`,
      }}
    >
      <div className={`w-full overflow-hidden bg-neutral-900 ${small ? "rounded-lg aspect-square" : "rounded-xl aspect-[3/4]"}`}>
        {image ? (
          <img
            src={image}
            alt={player.name}
            className="h-full w-full object-cover"
            style={{
              filter: grayscale || marked ? "grayscale(100%) brightness(0.55)" : "none",
            }}
            draggable={false}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-white/50">
            No Image
          </div>
        )}
      </div>

      <div className={`${small ? "pt-1 text-[11px] sm:text-xs" : "pt-2 text-sm sm:text-base"} font-black leading-tight`}>
        {player.name}
      </div>
    </div>
  );
}

function TeamPanel({ team, title = null }) {
  if (!team) return null;

  const color = {
    name: team.name,
    hex: team.hex || "#64748b",
    text: team.text || textFor(team.hex),
  };

  return (
    <div
      className="rounded-3xl p-4 shadow-2xl"
      style={{
        background: color.hex,
        color: color.text,
        border: `2px solid ${color.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)"}`,
      }}
    >
      <div className="mb-3">
        <h3 className="text-xl font-extrabold">
          {title || `${team.name} Team`}
        </h3>
        <p className="text-xs sm:text-sm font-semibold opacity-85">
          {team.members?.length || 0} players
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(team.members || []).map((player) => (
          <div
            key={`${team.id || team.name}-${player.id}`}
            className="rounded-2xl bg-black/20 p-2 text-center"
            style={{
              border: `2px solid ${color.text === "#111111" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.28)"}`,
            }}
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-black/20">
              {getImage(player) ? (
                <img
                  src={getImage(player)}
                  alt={player.name}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="pt-1 text-xs font-bold leading-tight">
              {player.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedTeamsList({ ranked = [], winnerTeam, lastPlaceTeam, selectedTeam, isFinal }) {
  return (
    <div className="grid gap-4 md:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {ranked.map((team) => {
        let label = "Safe";
        if (team.id === winnerTeam?.id) label = isFinal ? "Finalist" : "SAFE — won";
        if (team.id === lastPlaceTeam?.id) label = "LAST — elimination";
        if (!isFinal && selectedTeam && team.id === selectedTeam.id) label = "CHOSEN — elimination";

        return (
          <div
            key={`${team.rank}-${team.id}`}
            className="rounded-3xl p-4 shadow-2xl"
            style={{
              background: team.hex,
              color: team.text,
              border: `2px solid ${team.text === "#111111" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.35)"}`,
            }}
          >
            <div className="mb-2">
              <div className="text-xl font-extrabold">
                #{team.rank} {team.name} Team
              </div>
              <div className="text-sm font-semibold opacity-85">
                {label}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(team.members || []).map((player) => (
                <div
                  key={`${team.id}-${player.id}`}
                  className="rounded-2xl bg-black/20 p-2 text-center"
                  style={{
                    border: `2px solid ${team.text === "#111111" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.28)"}`,
                  }}
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-black/20">
                    {getImage(player) ? (
                      <img
                        src={getImage(player)}
                        alt={player.name}
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="pt-1 text-xs font-bold leading-tight">
                    {player.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EliminationGrid({ players = [], eliminated = null, colors = [], recolorTo = null }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {players.map((player) => {
        const colorName = recolorTo || player.currentColor;
        const color = getColorInfo(colorName, colors);
        const marked = eliminated && String(eliminated.id) === String(player.id);

        return (
          <PlayerCard
            key={`elim-${player.id}-${colorName}-${marked ? "marked" : "live"}`}
            player={player}
            color={color}
            marked={marked}
            grayscale={marked}
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
  if (!data) return null;

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
            {(data.rounds || []).map((round) => (
              <th key={round} className="px-3 py-2 text-center">
                {round}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {(data.rows || []).map((row) => (
            <tr key={row.player.id}>
              <td className="px-3 py-2 font-bold whitespace-nowrap">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-block h-3 w-5 rounded-sm" style={swatchStyle(row.roundColors?.[0] || null)} />
                  {row.player.name}
                </div>
              </td>

              {(row.results || []).map((result, index) => (
                <td key={index} className={`px-3 py-2 text-center font-bold ${statusCellClass(result)}`}>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-5 rounded-sm" style={swatchStyle(row.roundColors?.[index] || null)} />
                    {result || "-"}
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

function CastGrid({ players = [], colors = [] }) {
  const allPlayers = players.map(clonePlayer);

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {allPlayers.map((player) => (
        <PlayerCard
          key={player.id || player.name}
          player={player}
          color={getColorInfo(player.currentColor, colors)}
        />
      ))}
    </div>
  );
}

function StepRenderer({ step, colors }) {
  if (!step) {
    return (
      <Card className="p-6">
        <p className="text-white/70">No replay step data found.</p>
      </Card>
    );
  }

  if (step.kind === "challenge") {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Challenge Results"}</h2>
        <RankedTeamsList
          ranked={step.ranked || []}
          winnerTeam={step.winnerTeam}
          lastPlaceTeam={step.lastPlaceTeam}
          selectedTeam={step.selectedTeam}
          isFinal={step.isFinal}
        />
      </Card>
    );
  }

  if (step.kind?.startsWith("selection")) {
    const showMystery = step.kind === "selection-mystery";
    const showReveal = step.kind === "selection-reveal" || step.kind === "selection-final";

    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Selection"}</h2>

        <div className="grid gap-5 lg:grid-cols-3">
          <TeamPanel team={step.winnerTeam} title="Challenge Winner" />

          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-center">
            <div className="text-sm font-black uppercase tracking-widest text-white/50">
              Chooses
            </div>
            <div className="mt-8 text-7xl font-black">
              {showMystery ? "?" : "→"}
            </div>
            <div className="mt-8 text-white/60 font-bold">
              {showMystery ? "Opponent hidden" : "Opponent revealed"}
            </div>
          </div>

          {showMystery ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 grid place-items-center">
              <div className="text-8xl font-black">?</div>
            </div>
          ) : (
            <TeamPanel team={step.selectedTeam} title="Chosen Opponent" />
          )}
        </div>

        {showReveal && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <TeamPanel team={step.selectedTeam} title="Chosen Team" />
            <TeamPanel team={step.lastPlaceTeam} title="Last Place Team" />
          </div>
        )}
      </Card>
    );
  }

  if (step.kind === "elim-start" || step.kind?.startsWith("elim-mark")) {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Elimination"}</h2>
        <EliminationGrid
          players={step.eliminationRound?.stableOrderBeforeMark || step.eliminationRound?.markedPlayers || []}
          eliminated={step.kind === "elim-start" ? null : step.eliminationRound?.eliminated}
          colors={colors}
        />
      </Card>
    );
  }

  if (step.kind?.startsWith("elim-remove")) {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Elimination Result"}</h2>
        <EliminationGrid
          players={step.eliminationRound?.remainingPlayers || []}
          colors={colors}
        />
        {step.eliminationRound?.eliminated && (
          <div className="mt-6 rounded-3xl border border-red-400/40 bg-red-500/10 p-5">
            <div className="mb-3 text-sm font-black uppercase tracking-widest text-red-300">
              Eliminated
            </div>
            <div className="max-w-[220px]">
              <PlayerCard
                player={step.eliminationRound.eliminated}
                color={{ hex: "#111111", text: "#ffffff" }}
                grayscale
              />
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (step.kind === "survivors-old-colors") {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Survivors"}</h2>
        <EliminationGrid
          players={step.elimination?.survivors || step.elimination?.newTeam?.members || []}
          colors={colors}
        />
      </Card>
    );
  }

  if (step.kind === "new-team") {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "New Team Formed"}</h2>
        <div className="mx-auto max-w-2xl">
          <TeamPanel team={step.elimination?.newTeam} title="New Combined Team" />
        </div>
      </Card>
    );
  }

  if (step.kind === "teams-overview") {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Updated Teams"}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(step.teamsAfterRound || []).map((team) => (
            <TeamPanel key={team.id || team.name} team={team} />
          ))}
        </div>
      </Card>
    );
  }

  if (step.kind === "winners") {
    return (
      <Card className="border-yellow-300/40 bg-yellow-400/10 p-6">
        <div className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-300">
          Season Winners
        </div>
        <TeamPanel team={step.elimination?.newTeam} title="Winning Team" />
      </Card>
    );
  }

  if (step.kind === "chart") {
    return (
      <Card className="p-5">
        <h2 className="mb-5 text-3xl font-black">{step.title || "Elimination Chart"}</h2>
        <EliminationChart data={step.chartData} colors={colors} />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="mb-5 text-3xl font-black">{step.title || "Trio Replay Step"}</h2>
      <pre className="overflow-auto rounded-2xl bg-black/40 p-4 text-left text-xs text-white/70">
        {JSON.stringify(step, null, 2)}
      </pre>
    </Card>
  );
}

export default function TrioReplayScreen({ seasonData = {}, onExit }) {
  const steps = seasonData?.seasonSteps || [];
  const colors = seasonData?.colors || [];
  const finalWinners = seasonData?.finalWinners || null;
  const startingCast = seasonData?.shuffledCast || seasonData?.players || [];
  const startingTeams = seasonData?.teams || [];
  const [index, setIndex] = useState(0);

  const replaySteps = useMemo(() => {
    const intro = [];

    if (startingCast.length) {
      intro.push({
        kind: "intro-cast",
        title: "Starting Cast",
      });
    }

    if (startingTeams.length) {
      intro.push({
        kind: "intro-teams",
        title: "Starting Teams",
      });
    }

    return [...intro, ...steps];
  }, [startingCast, startingTeams, steps]);

  const current = replaySteps[index] || null;

  function renderCurrent() {
    if (current?.kind === "intro-cast") {
      return (
        <Card className="p-5">
          <h2 className="mb-5 text-3xl font-black">Starting Cast</h2>
          <CastGrid players={startingCast} colors={colors} />
        </Card>
      );
    }

    if (current?.kind === "intro-teams") {
      return (
        <Card className="p-5">
          <h2 className="mb-5 text-3xl font-black">Starting Teams</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {startingTeams.map((team) => (
              <TeamPanel key={team.id || team.name} team={team} />
            ))}
          </div>
        </Card>
      );
    }

    return <StepRenderer step={current} colors={colors} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 text-sm font-black uppercase tracking-widest text-blue-300">
                Saved Trio Replay
              </div>
              <h1 className="text-4xl font-black sm:text-5xl">
                Trio
              </h1>
              <p className="mt-2 text-white/65">
                Step {Math.min(index + 1, replaySteps.length || 1)} / {Math.max(replaySteps.length, 1)}
                {finalWinners?.name ? ` • Winner: ${finalWinners.name} Team` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onExit}
                className="rounded-2xl bg-white/10 px-5 py-3 font-black hover:bg-white/20"
              >
                Back to Cast
              </button>

              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index <= 0}
                className="rounded-2xl bg-slate-700 px-5 py-3 font-black hover:bg-slate-600 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() => setIndex((i) => Math.min(replaySteps.length - 1, i + 1))}
                disabled={index >= replaySteps.length - 1}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        {renderCurrent()}
      </section>
    </main>
  );
}
