// @ts-nocheck

"use client";

import { useMemo, useState } from "react";
import Navbar from "../Navbar";

const PHASE_LABELS = {
  pregame: "Pregame",
  colorReveal: "Team Colors",
  teamSort: "Teams Sorted",
  rankings: "Challenge Rankings",
  losingTeamOnly: "Last Place Team",
  teamVoteResult: "Last Place Team Vote",
  crossVoteResult: "Cross-Team Vote",
  eliminationShow: "Elimination Matchup",
  eliminationResult: "Elimination Result",
  resetView: "Cast Reset",
  gameOver: "Game Over",
};

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function isDarkTextColor(color) {
  return ["#ffffff", "#ffff00", "#f59e0b", "#d2b48c", "#fa8072", "#9ca3af"].includes(color);
}

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
}

function SimulatorCard({ player, borderColor = "#fff", dim = false, badge = null, grayscale = false }) {
  const darkText = isDarkTextColor(borderColor);
  const image = getImage(player);

  return (
    <div
      style={{
        background: borderColor,
        border: `4px solid ${borderColor}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,.35)",
        opacity: dim ? 0.5 : 1,
        position: "relative",
      }}
    >
      <div style={{ aspectRatio: "1 / 1", background: "#1f2937" }}>
        {image ? (
          <img
            src={image}
            alt={player?.name || "player"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: grayscale ? "grayscale(100%) brightness(0.55)" : "none",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#94a3b8",
              fontWeight: 900,
              fontSize: 12,
              textAlign: "center",
              padding: 8,
              filter: grayscale ? "grayscale(100%) brightness(0.55)" : "none",
            }}
          >
            No Image
          </div>
        )}
      </div>

      <div
        style={{
          background: borderColor,
          color: darkText ? "#111827" : "#ffffff",
          fontWeight: 800,
          fontSize: 13,
          textAlign: "center",
          padding: "8px 6px",
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1.1,
        }}
      >
        {player?.name}
      </div>

      {badge ? (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(0,0,0,.78)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            padding: "4px 7px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.25)",
          }}
        >
          {badge}
        </div>
      ) : null}
    </div>
  );
}

export default function FreeAgentsReplayScreen({ history = [], winner, onExit }) {
  const cleanHistory = useMemo(() => {
    const entries = Array.isArray(history) ? history.filter(Boolean) : [];
    if (entries.length) return entries;
    return [{ phase: "gameOver", champion: winner, players: winner ? [winner] : [] }];
  }, [history, winner]);

  const [index, setIndex] = useState(0);
  const entry = cleanHistory[index] || cleanHistory[0];

  const players = entry?.players || [];
  const roundData = entry?.roundData || {};
  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));
  const phase = entry?.phase || entry?.stage || "pregame";
  const isMobile = false;

  const activePlayers = players.filter((p) => !p.eliminated);
  const eliminatedOrdered = players
    .filter((p) => p.eliminated)
    .sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999));

  function teamForPlayer(playerId) {
    if (!roundData?.teams) return null;
    return roundData.teams.find((t) => t.members.includes(playerId)) || null;
  }

  function getCardBorder(player) {
    if (player.eliminated) return "#000000";
    if (["colorReveal", "teamSort", "rankings", "losingTeamOnly", "teamVoteResult", "crossVoteResult"].includes(phase)) {
      const team = teamForPlayer(player.id);
      if (team) return team.color;
    }
    return "#ffffff";
  }

  function orderedActivePlayers() {
    const order = entry?.initialOrder || players.map((p) => p.id);
    const orderMap = new Map(order.map((id, idx) => [id, idx]));
    return [...activePlayers].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }

  function getOrderedPlayersAll() {
    return [...orderedActivePlayers(), ...eliminatedOrdered];
  }

  function renderFullCastGrid() {
    const ordered = getOrderedPlayersAll();

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {ordered.map((player) => (
          <SimulatorCard
            key={player.id}
            player={player}
            borderColor={getCardBorder(player)}
            dim={player.eliminated}
            badge={player.eliminated && player.placement ? ordinal(player.placement) : null}
            grayscale={player.eliminated}
          />
        ))}
      </div>
    );
  }

  function renderTeamsView(showOnlyLosing = false) {
    const teamsToShowRaw = showOnlyLosing
      ? roundData?.teams?.filter((t) => t.id === roundData.losingTeamId) || []
      : roundData?.teams || [];

    const teamsToShow =
      !showOnlyLosing && phase === "rankings"
        ? [...teamsToShowRaw].sort((a, b) => (a.rank || 0) - (b.rank || 0))
        : [...teamsToShowRaw];

    return (
      <div style={{ display: "grid", gap: 16 }}>
        {teamsToShow.map((team) => {
          const isWinner = team.id === roundData?.winningTeamId;
          const isLoser = team.id === roundData?.losingTeamId;
          const centeredTeam = team.members.length <= 5;
          const smallWidth = isMobile ? 120 : 160;

          return (
            <div
              key={team.id}
              style={{
                border: `3px solid ${team.color}`,
                borderRadius: 18,
                overflow: "hidden",
                background: team.color,
                boxShadow: "0 8px 24px rgba(0,0,0,.28)",
              }}
            >
              <div
                style={{
                  background: team.color,
                  color: ["#ffffff", "#ffff00"].includes(team.color) ? "#111827" : "#ffffff",
                  fontWeight: 900,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>{team.name}</div>

                <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span>{team.members.length} players</span>
                  {team.rank ? <span>Rank: {team.rank}</span> : null}
                  {isWinner ? <span>WINNER</span> : null}
                  {isLoser ? <span>LAST</span> : null}
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  display: "grid",
                  justifyContent: centeredTeam ? "center" : "stretch",
                  gridTemplateColumns: centeredTeam
                    ? `repeat(${team.members.length}, ${smallWidth}px)`
                    : isMobile
                      ? "repeat(4, minmax(0, 1fr))"
                      : "repeat(8, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {team.members.map((id) => {
                  let badge = null;
                  if (phase === "teamVoteResult" && roundData?.sentInId === id) badge = "VOTED IN";
                  if (phase === "crossVoteResult") {
                    if (roundData?.sentInId === id) badge = "VOTED IN";
                    if (roundData?.challengerId === id) badge = "OPPONENT";
                  }

                  return (
                    <div key={id} style={{ width: centeredTeam ? smallWidth : "100%", justifySelf: "center" }}>
                      <SimulatorCard player={playersById[id]} borderColor={team.color} badge={badge} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderEliminationView(showResult = false) {
    const ids = [roundData?.sentInId, roundData?.challengerId].filter(Boolean);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {ids.map((id) => {
          const player = playersById[id];
          if (!player) return null;

          let borderColor = "#ffffff";
          let badge = null;

          if (showResult && id === roundData?.eliminationWinnerId) {
            borderColor = "#22c55e";
            badge = "STAYS";
          }

          if (showResult && id === roundData?.eliminationLoserId) {
            borderColor = "#000000";
            badge = "OUT";
          }

          return (
            <SimulatorCard
              key={id}
              player={player}
              borderColor={borderColor}
              dim={showResult && id === roundData?.eliminationLoserId}
              badge={badge}
              grayscale={showResult && id === roundData?.eliminationLoserId}
            />
          );
        })}
      </div>
    );
  }

  function renderRemainingOnly() {
    const remaining = orderedActivePlayers();

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {remaining.map((player) => {
          let borderColor = "#ffffff";
          let badge = null;

          if (phase === "rankings") {
            if (player.id === roundData?.winnerId) {
              borderColor = "#22c55e";
              badge = "WIN";
            }
            if (player.id === roundData?.sentInId) {
              borderColor = "#ef4444";
              badge = "LAST";
            }
          }

          if (phase === "crossVoteResult") {
            if (player.id === roundData?.winnerId) {
              borderColor = "#22c55e";
              badge = "WIN";
            }
            if (player.id === roundData?.sentInId) {
              borderColor = "#ef4444";
              badge = "LAST";
            }
            if (player.id === roundData?.challengerId) {
              borderColor = "#f59e0b";
              badge = "OPPONENT";
            }
          }

          return <SimulatorCard key={player.id} player={player} borderColor={borderColor} badge={badge} />;
        })}
      </div>
    );
  }

  function renderMainArea() {
    if (["pregame", "colorReveal", "resetView", "gameOver"].includes(phase)) return renderFullCastGrid();

    if (roundData?.mode === "teams") {
      if (phase === "teamSort") return renderTeamsView(false);
      if (phase === "rankings") return renderTeamsView(false);
      if (["losingTeamOnly", "teamVoteResult", "crossVoteResult"].includes(phase)) return renderTeamsView(true);
      if (phase === "eliminationShow") return renderEliminationView(false);
      if (phase === "eliminationResult") return renderEliminationView(true);
    }

    if (roundData?.mode === "ffa" || roundData?.mode === "final5") {
      if (phase === "teamSort") return renderFullCastGrid();
      if (["rankings", "crossVoteResult"].includes(phase)) return renderRemainingOnly();
      if (phase === "eliminationShow") return renderEliminationView(false);
      if (phase === "eliminationResult") return renderEliminationView(true);
    }

    return renderFullCastGrid();
  }

  function summaryText() {
    if (phase === "pregame") return "Starting cast.";
    if (phase === "colorReveal") return "Team colors applied on the full cast grid.";
    if (phase === "teamSort") return roundData?.mode === "teams" ? "Cast is sorted into teams." : "Free-for-all challenge has begun.";
    if (phase === "rankings") return roundData?.mode === "teams" ? "Teams ranked from winner to last place." : `${playersById[roundData?.winnerId]?.name || "A player"} wins and ${playersById[roundData?.sentInId]?.name || "A player"} finishes last.`;
    if (phase === "losingTeamOnly") return "Only the last place team is shown.";
    if (phase === "teamVoteResult") return `${playersById[roundData?.sentInId]?.name || "A player"} was voted in by the losing team.`;
    if (phase === "crossVoteResult") return `${playersById[roundData?.challengerId]?.name || "A player"} is the opponent in elimination.`;
    if (phase === "eliminationShow") return "The two elimination players are shown.";
    if (phase === "eliminationResult") return `${playersById[roundData?.eliminationWinnerId]?.name || "A player"} stays. ${playersById[roundData?.eliminationLoserId]?.name || "A player"} is out.`;
    if (phase === "resetView") return "Back to the full cast with eliminated players at the bottom.";
    if (phase === "gameOver") return `${entry?.champion?.name || winner?.name || "A player"} wins the season.`;
    return "";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gap: 18, padding: 20 }}>
        <div
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 22,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
          }}
        >
          <div style={{ display: "flex", gap: 14, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: ".02em" }}>Free Agents</div>
              <div style={{ color: "#cbd5e1", marginTop: 6, fontSize: 15 }}>
                Saved Replay • {PHASE_LABELS[phase] || phase}
                {entry?.roundNumber ? ` • Round ${entry.roundNumber}` : ""}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={onExit}
                style={{
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  fontWeight: 900,
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                Back to Cast
              </button>

              <button
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index <= 0}
                style={{
                  background: "#475569",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  fontWeight: 900,
                  padding: "12px 18px",
                  cursor: index <= 0 ? "not-allowed" : "pointer",
                  opacity: index <= 0 ? 0.45 : 1,
                  fontSize: 15,
                }}
              >
                Previous
              </button>

              <div
                style={{
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 999,
                  fontWeight: 900,
                  padding: "12px 18px",
                  fontSize: 15,
                }}
              >
                {index + 1} / {cleanHistory.length}
              </div>

              <button
                onClick={() => setIndex((i) => Math.min(cleanHistory.length - 1, i + 1))}
                disabled={index >= cleanHistory.length - 1}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  fontWeight: 900,
                  padding: "12px 18px",
                  cursor: index >= cleanHistory.length - 1 ? "not-allowed" : "pointer",
                  opacity: index >= cleanHistory.length - 1 ? 0.45 : 1,
                  fontSize: 15,
                }}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, color: "#e5e7eb", fontSize: 16, fontWeight: 700 }}>{summaryText()}</div>
        </div>

        <div>{renderMainArea()}</div>
      </div>
    </div>
  );
}