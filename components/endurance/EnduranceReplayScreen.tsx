// @ts-nocheck

"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../Navbar";

function getImage(player) {
  return player?.img || player?.image || player?.image_url || "";
}

const COLOR_MAP = {
  forest: "#006400",
  rainbow: "linear-gradient(to bottom, red, orange, yellow, green, blue, indigo, violet)",
  negative: "#333333",
};

function teamBgStyle(color) {
  if (color === "rainbow") return { background: COLOR_MAP.rainbow };
  return { backgroundColor: COLOR_MAP[color] || color || "#444" };
}

function teamTextColor(color) {
  return ["black", "maroon", "indigo", "navy", "forest", "negative"].includes(color)
    ? "white"
    : "black";
}

function teamBorderStyle(color) {
  return color === "white" ? { border: "2px solid black" } : {};
}

function teamIconForElement(element) {
  if (element === "Fire") return "🔥";
  if (element === "Water") return "💧";
  if (element === "Earth") return "🌳";
  return "?";
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function PlayerCard({ player, small = false, gray = false }) {
  if (!player) return null;
  const image = getImage(player);

  return (
    <div className={`${small ? "w-24" : "w-36"} rounded-2xl border border-zinc-700 bg-zinc-900 p-2 text-center`}>
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-800">
        {image ? (
          <img
            src={image}
            alt={player.name}
            className={`h-full w-full object-cover ${gray ? "grayscale opacity-50" : ""}`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-zinc-500">No Image</div>
        )}
      </div>
      <div className="mt-2 truncate text-xs font-black text-white">{player.name}</div>
    </div>
  );
}

function TeamCard({ team, pieceCount = 0, status = "", templeState = null, templeIndex = -1 }) {
  if (!team) return null;
  const color = team.color || String(team.name || "").replace(" Team", "").toLowerCase();
  const isNegative = color === "negative";
  const textColor = teamTextColor(color);
  const templeActive =
    templeState?.started &&
    templeState?.teams?.some((t) => t.name === team.name) &&
    templeIndex >= 0;

  return (
    <div
      className="relative rounded-3xl p-4 shadow-2xl"
      style={{
        ...teamBgStyle(color),
        ...teamBorderStyle(color),
        color: textColor,
      }}
    >
      <div className="absolute left-3 top-3 font-black" style={{ color: "saddlebrown", WebkitTextStroke: "1px black" }}>
        ▲ {pieceCount || 0}
      </div>

      <h3 className="mb-3 text-center text-2xl font-black">
        {String(team.name || "Team").replace(" Team", "")}
      </h3>

      <div className="flex flex-wrap justify-center gap-3 pr-16">
        {(team.members || []).map((member) => (
          <div key={member.name} className="w-24 text-center">
            <div className="aspect-square overflow-hidden rounded-xl bg-white">
              {getImage(member) ? (
                <img
                  src={getImage(member)}
                  alt={member.name}
                  className="h-full w-full object-cover"
                  style={{
                    filter: isNegative ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "",
                  }}
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-zinc-500">No Image</div>
              )}
            </div>
            <div className="mt-1 text-xs font-black">{member.name}</div>
          </div>
        ))}
      </div>

      {status && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-6xl font-black" style={{ WebkitTextStroke: "2px black" }}>
          {status}
        </div>
      )}

      {templeActive && (
        <>
          <div className="absolute right-3 top-3 flex flex-col gap-1">
            {[0, 1].map((boxIndex) => {
              const wins = templeIndex === 0 ? templeState.scoreA : templeState.scoreB;
              return (
                <div
                  key={boxIndex}
                  className="h-5 w-5 border-2"
                  style={{
                    borderColor: color === "black" ? "white" : "black",
                    background: wins > boxIndex ? "limegreen" : "transparent",
                  }}
                />
              );
            })}
          </div>

          {(templeIndex === 0 ? templeState.lastA : templeState.lastB) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center text-6xl">
              <div>{teamIconForElement(templeIndex === 0 ? templeState.lastA : templeState.lastB)}</div>
              {templeState.lastRoundWinner === team.name && (
                <div
                  className="mx-auto mt-1 w-12 border-b-4"
                  style={{ borderColor: color === "black" ? "white" : "black" }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeamsGrid({ teams = [], teamPieces = {}, missionWinner = null, templeState = null, winner = null, phase = "" }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(teams || []).map((team, index) => {
        let status = "";
        if (winner?.name === team.name) status = "🏆";
        else if ((phase === "missionResult" || phase === "preTemple") && missionWinner?.name === team.name) status = "★";
        else if (phase === "preTemple" && templeState?.teams?.some((t) => t.name === team.name)) status = "?";
        else if (phase === "templeResult" && templeState?.winner?.name === team.name) status = "✓";
        else if (phase === "templeResult" && templeState?.loser?.name === team.name) status = "✕";

        const templeIndex = templeState?.teams?.findIndex((t) => t.name === team.name) ?? -1;

        return (
          <TeamCard
            key={`${team.name}-${index}`}
            team={team}
            pieceCount={teamPieces?.[team.name] || 0}
            status={status}
            templeState={templeState}
            templeIndex={templeIndex}
          />
        );
      })}
    </div>
  );
}

function LogBox({ log = [] }) {
  if (!log?.length) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-2xl font-black">Event Log</h3>
      <div className="space-y-2">
        {log.map((line, index) => (
          <div key={`${line}-${index}`} className="rounded-2xl bg-zinc-900 px-4 py-3 font-bold text-zinc-200">
            {line}
          </div>
        ))}
      </div>
    </Card>
  );
}

function PlacementsBox({ placements = [] }) {
  if (!placements?.length) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-2xl font-black">Placements</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {placements.map((entry, index) => (
          <div key={`${entry.team?.name}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-sm font-black uppercase tracking-widest text-red-300">
              {entry.place ? `${entry.place}th place` : "Eliminated"}
            </div>
            <div className="mt-1 text-xl font-black">{entry.team?.name}</div>
            {entry.madeBy && <div className="text-sm text-zinc-400">Lost to {entry.madeBy.name}</div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinalTempleBoard({ finalTempleState, teamPieces = {} }) {
  if (!finalTempleState) return null;

  const [teamA, teamB] = finalTempleState.teams || [];
  const slots = Array.from({ length: finalTempleState.boxCount || 0 }, (_, index) => index);

  function owner(index) {
    if (finalTempleState.lowClaimed?.includes(index)) return finalTempleState.lowTeam;
    if (finalTempleState.highClaimed?.includes(index)) return finalTempleState.highTeam;
    return null;
  }

  return (
    <Card className="p-5">
      <h3 className="mb-3 text-3xl font-black">Final Temple Pieces Showdown</h3>
      <p className="mb-5 text-zinc-400">
        Round {finalTempleState.round} • Stage: {String(finalTempleState.stage || "").replaceAll("_", " ")}
      </p>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        <TeamCard team={teamA} pieceCount={teamPieces?.[teamA?.name] || 0} />
        <TeamCard team={teamB} pieceCount={teamPieces?.[teamB?.name] || 0} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {slots.map((slot) => {
          const slotOwner = owner(slot);
          const revealed = finalTempleState.goldIndex === slot;
          return (
            <div
              key={slot}
              className="grid h-24 w-24 place-items-center rounded-2xl border-4 text-center font-black"
              style={{
                ...teamBgStyle(slotOwner?.color || "gray"),
                color: slotOwner ? teamTextColor(slotOwner.color) : "white",
                borderColor: revealed ? "gold" : "#ffffff55",
              }}
            >
              <div>#{slot + 1}</div>
              <div className="text-3xl">{revealed ? "🏆" : slotOwner ? "▲" : "?"}</div>
              <div className="text-[10px]">{slotOwner?.name?.replace(" Team", "") || ""}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PreGameReplay({ state }) {
  if (!state) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-3xl font-black">Right to Stay / Team Draft</h3>

      {state.candidates?.length > 0 && (
        <>
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-zinc-400">Candidates</div>
          <div className="mb-5 flex flex-wrap justify-center gap-3">
            {state.candidates.map((player) => (
              <PlayerCard key={player.name} player={player} small />
            ))}
          </div>
        </>
      )}

      {state.ranked?.length > 0 && (
        <>
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-zinc-400">Ranked Results</div>
          <div className="mb-5 flex flex-wrap justify-center gap-3">
            {state.ranked.map((player, index) => (
              <div key={player.name} className="text-center">
                <PlayerCard player={player} small gray={index >= state.ranked.length - 2} />
                <div className="mt-1 text-xs font-black text-zinc-400">#{index + 1}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {state.draftTeams?.length > 0 && (
        <>
          <div className="mb-2 text-sm font-black uppercase tracking-widest text-zinc-400">Draft Teams</div>
          <TeamsGrid teams={state.draftTeams} />
        </>
      )}
    </Card>
  );
}

function ReplayBody({ entry }) {
  const activeTeams = (entry.teams || []).filter((team) => !team.eliminated);
  const visibleTeams =
    (entry.phase === "temple" || entry.phase === "templeResult") && entry.templeState
      ? entry.templeState.teams
      : activeTeams;

  return (
    <div className="space-y-5">
      {entry.preGameState && [
        "rightToStayIntro",
        "rightToStayResult",
        "draftChallenge",
        "teamsFormed",
      ].includes(entry.phase) && (
        <PreGameReplay state={entry.preGameState} />
      )}

      {entry.phase === "finalTwo" && (
        <Card className="p-5 text-center">
          <h2 className="text-4xl font-black">Final Two</h2>
          <p className="mt-2 text-zinc-400">The last two teams enter the temple pieces showdown.</p>
        </Card>
      )}

      {entry.finalTempleState && (
        <FinalTempleBoard finalTempleState={entry.finalTempleState} teamPieces={entry.teamPieces || {}} />
      )}

      {visibleTeams?.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-4 text-3xl font-black">
            {entry.phase === "temple" || entry.phase === "templeResult" ? "Temple of Fate" : "Teams"}
          </h3>

          <TeamsGrid
            teams={visibleTeams}
            teamPieces={entry.teamPieces || {}}
            missionWinner={entry.missionWinner}
            templeState={entry.templeState}
            winner={entry.winner}
            phase={entry.phase}
          />
        </Card>
      )}

      {entry.pieceTransferState && (
        <Card className="p-5">
          <h3 className="text-3xl font-black">Temple Pieces Transfer</h3>
          <p className="mt-2 text-zinc-400">
            {entry.pieceTransferState.loser?.name} must give their temple pieces to another team.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TeamCard team={entry.pieceTransferState.loser} pieceCount={entry.teamPieces?.[entry.pieceTransferState.loser?.name] || 0} status="✕" />
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 text-sm font-black uppercase tracking-widest text-zinc-400">
                Available Teams
              </div>
              <div className="space-y-2">
                {(entry.pieceTransferState.options || []).map((team) => (
                  <div key={team.name} className="rounded-xl bg-zinc-800 px-4 py-3 font-black">
                    {team.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <LogBox log={entry.log || []} />
      <PlacementsBox placements={entry.placements || []} />
    </div>
  );
}

export default function EnduranceReplayScreen({ history = [], seasonData = {}, onExit }) {
  const derivedHistory = useMemo(() => {
    const clean = Array.isArray(history) ? history.filter(Boolean) : [];
    if (clean.length) return clean;

    return [
      {
        phase: "finished",
        episode: seasonData.episode || 1,
        players: seasonData.players || [],
        teams: seasonData.teams || [],
        placements: seasonData.placements || [],
        winner: seasonData.winner,
        log: seasonData.log || [],
        teamPieces: seasonData.teamPieces || {},
      },
    ];
  }, [history, seasonData]);

  const [index, setIndex] = useState(0);
  const entry = derivedHistory[index] || derivedHistory[0] || {};

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 text-sm font-black uppercase tracking-widest text-emerald-300">
                Saved Endurance Replay
              </div>
              <h1 className="text-4xl font-black sm:text-5xl">
                Endurance
              </h1>
              <p className="mt-2 text-zinc-400">
                Step {Math.min(index + 1, derivedHistory.length || 1)} / {Math.max(derivedHistory.length, 1)}
                {entry.episode ? ` • Episode ${entry.episode}` : ""}
                {entry.phase ? ` • ${String(entry.phase).replaceAll("_", " ")}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onExit}
                className="rounded-2xl bg-zinc-800 px-5 py-3 font-black hover:bg-zinc-700"
              >
                Back to Cast
              </button>

              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index <= 0}
                className="rounded-2xl bg-zinc-700 px-5 py-3 font-black hover:bg-zinc-600 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                onClick={() => setIndex((i) => Math.min(derivedHistory.length - 1, i + 1))}
                disabled={index >= derivedHistory.length - 1}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-black hover:bg-emerald-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        <ReplayBody entry={entry} />
      </section>
    </main>
  );
}
