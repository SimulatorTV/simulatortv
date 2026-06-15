// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../Navbar";

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
}

function getPlayer(players, id) {
  return (players || []).find((p) => String(p.id) === String(id));
}

const COLORS = [
  { dark: "#991b1b", light: "#fecaca", border: "#ef4444" },
  { dark: "#166534", light: "#bbf7d0", border: "#22c55e" },
  { dark: "#1d4ed8", light: "#bfdbfe", border: "#3b82f6" },
  { dark: "#7e22ce", light: "#e9d5ff", border: "#a855f7" },
  { dark: "#c2410c", light: "#fed7aa", border: "#f97316" },
  { dark: "#0f766e", light: "#99f6e4", border: "#14b8a6" },
  { dark: "#be185d", light: "#fbcfe8", border: "#ec4899" },
  { dark: "#854d0e", light: "#fef08a", border: "#eab308" },
];

function voteCounts(votes = [], revealedOnly = true) {
  const counts = {};
  votes.forEach((vote) => {
    if (revealedOnly && !vote.revealed) return;
    if (!vote.targetId) return;
    counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  });
  return counts;
}

function voteCountEntries(players, votes, revealedOnly = true) {
  const counts = voteCounts(votes, revealedOnly);
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count, player: getPlayer(players, id) }))
    .filter((entry) => entry.player)
    .sort((a, b) => b.count - a.count || String(a.player.name).localeCompare(String(b.player.name)));
}

function finalVoteHighlights(players, votes) {
  if (!votes.length || votes.some((vote) => !vote.revealed)) return { targetColors: {}, voterColors: {} };

  const entries = voteCountEntries(players, votes, false);
  const top = entries[0]?.count || 0;
  const tied = entries.filter((entry) => entry.count === top && top > 0);
  const targetColors = {};
  const voterColors = {};

  tied.forEach((entry, index) => {
    const group = COLORS[index % COLORS.length];
    targetColors[entry.id] = group;
    votes
      .filter((vote) => String(vote.targetId) === String(entry.id))
      .forEach((vote) => {
        if (!voterColors[vote.voterId]) voterColors[vote.voterId] = [];
        voterColors[vote.voterId].push(group.light);
      });
  });

  return { targetColors, voterColors };
}

function highlightStyle(playerId, highlights) {
  const target = highlights.targetColors[playerId];
  const voters = highlights.voterColors[playerId] || [];
  const colors = [];

  if (target?.dark) colors.push(target.dark);
  voters.forEach((color) => {
    if (!colors.includes(color)) colors.push(color);
  });

  if (!colors.length) return {};

  if (colors.length === 1) {
    return {
      background: colors[0],
      borderColor: target?.border || colors[0],
      color: target?.dark ? "white" : "#111827",
    };
  }

  const step = 100 / colors.length;
  const gradient = colors.map((color, i) => `${color} ${i * step}%, ${color} ${(i + 1) * step}%`).join(", ");

  return {
    background: `linear-gradient(90deg, ${gradient})`,
    borderColor: target?.border || "#ffffff",
    color: "white",
  };
}

function VoteCountCard({ player, count }) {
  const image = getImage(player);

  return (
    <div style={styles.liveCountCard}>
      <div style={styles.liveCountImageWrap}>
        {image ? <img src={image} alt={player.name} style={styles.liveCountImage} /> : <div style={styles.noImageSmall}>?</div>}
      </div>
      <div style={styles.liveCountName}>{player.name}</div>
      <div style={styles.liveCountNumber}>{count}</div>
    </div>
  );
}

function PlayerCard({ player, eliminated, compact, tiny, status, styleOverride = {} }) {
  if (!player) return null;
  const image = getImage(player);

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 8,
        position: "relative",
        width: tiny ? 92 : compact ? 120 : 150,
        border:
          styleOverride?.borderColor
            ? `4px solid ${styleOverride.borderColor}`
            : status === "win"
              ? "4px solid #18d45b"
              : status === "lose" || status === "different"
                ? "4px solid #ff3333"
                : "2px solid #555",
        background:
          styleOverride?.background ||
          (status === "win"
            ? "#0f3d20"
            : status === "lose" || status === "different"
              ? "#401111"
              : "#222"),
        color: styleOverride?.color || "white",
        opacity: eliminated ? 0.35 : 1,
      }}
    >
      {image ? (
        <img
          src={image}
          alt={player.name}
          style={{
            width: "100%",
            height: tiny ? 86 : compact ? 110 : 145,
            objectFit: "cover",
            borderRadius: 8,
            filter: eliminated || status === "lose" ? "grayscale(1)" : "none",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: tiny ? 86 : compact ? 110 : 145, borderRadius: 8, background: "#111827", display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>
          No Image
        </div>
      )}

      <div style={{ fontWeight: "bold", marginTop: tiny ? 4 : 8, fontSize: tiny ? 12 : undefined, lineHeight: tiny ? 1.05 : undefined }}>{player.name}</div>
      {status === "win" && !tiny && <div style={styles.winText}>WINNER</div>}
      {status === "lose" && !tiny && <div style={styles.loseText}>ELIMINATED</div>}
      {eliminated && !status && !tiny && <div style={styles.loseText}>ELIMINATED</div>}
    </div>
  );
}

export default function CallOutReplayScreen({ history = [], winner, onExit }) {
  const cleanHistory = useMemo(() => {
    const entries = Array.isArray(history) ? history.filter(Boolean) : [];
    return entries.length ? entries : [{ screen: "winner", players: winner ? [winner] : [], round: 1 }];
  }, [history, winner]);

  const [index, setIndex] = useState(0);
  const entry = cleanHistory[index] || cleanHistory[0] || {};
  const players = entry.players || [];
  const active = players.filter((p) => !p.eliminated);
  const alliances = entry.alliances || [];
  const matches = entry.matches || [];
  const matchIndex = entry.matchIndex || 0;
  const currentMatch = matches[matchIndex];
  const screen = entry.screen || "cast";

  const [replayVotes, setReplayVotes] = useState([]);
  const [replayMatches, setReplayMatches] = useState([]);

  useEffect(() => {
    setReplayVotes((entry.votes || []).map((vote) => ({ ...vote })));
    setReplayMatches((entry.matches || []).map((match) => ({ ...match })));
  }, [index]);

  const votes = replayVotes;
  const displayMatches = replayMatches.length ? replayMatches : matches;
  const displayCurrentMatch = displayMatches[matchIndex];
  const counts = voteCountEntries(players, votes, true);
  const allRevealed = votes.length > 0 && votes.every((vote) => vote.revealed);
  const highlights = finalVoteHighlights(players, votes);

  function revealReplayVote(voterId) {
    setReplayVotes((old) =>
      old.map((vote) =>
        String(vote.voterId) === String(voterId)
          ? { ...vote, revealed: true }
          : vote
      )
    );
  }

  function revealAllReplayVotes() {
    setReplayVotes((old) => old.map((vote) => ({ ...vote, revealed: true })));
  }

  function revealReplayCallOut() {
    setReplayMatches((old) =>
      old.map((match, i) =>
        i === matchIndex ? { ...match, callOutRevealed: true } : match
      )
    );
  }

  function renderCast() {
    return (
      <>
        <h2>Cast Remaining: {active.length}</h2>
        <div style={styles.castGridSmall}>
          {players.map((p) => (
            <PlayerCard key={p.id} player={p} eliminated={!!p.eliminated} tiny />
          ))}
        </div>
      </>
    );
  }

  function renderAlliances() {
    return (
      <>
        <h2>Alliances</h2>
        {alliances.length === 0 && <h3>No alliances this round</h3>}
        <div style={styles.allianceGrid}>
          {alliances.map((alliance, i) => (
            <div key={i} style={styles.allianceBox}>
              <h3>Alliance {i + 1}</h3>
              <div style={styles.miniRow}>
                {alliance.map((id) => {
                  const p = getPlayer(players, id);
                  return p ? <PlayerCard key={id} player={p} compact /> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderVotes() {
    return (
      <>
        <h2>Vote Reveal</h2>

        <div style={styles.topButtonRow}>
          <button style={styles.hotButton} onClick={revealAllReplayVotes}>Reveal All</button>
        </div>

        <div style={styles.liveCountGrid}>
          {counts.length === 0 ? <div style={styles.noVotesBox}>No votes revealed yet</div> : counts.map(({ id, player, count }) => <VoteCountCard key={id} player={player} count={count} />)}
        </div>

        <div style={styles.voteGrid}>
          {active.map((p) => {
            const vote = votes.find((v) => String(v.voterId) === String(p.id));
            const target = getPlayer(players, vote?.targetId);
            const style = allRevealed ? highlightStyle(p.id, highlights) : {};

            return (
              <div key={p.id} style={{ ...styles.voteCard, ...style }}>
                <PlayerCard player={p} compact styleOverride={style} />
                <button style={styles.revealBox} onClick={() => revealReplayVote(p.id)}>
                  {vote?.revealed && target ? (
                    <div style={styles.revealedVote}>
                      <img src={getImage(target)} style={styles.voteImg} />
                      <strong>{target.name}</strong>
                    </div>
                  ) : "?"}
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderCallout() {
    const currentMatch = displayCurrentMatch;
    if (!currentMatch) return renderCast();

    return (
      <>
        <h2>Call Out {matchIndex + 1} of {matches.length}</h2>

        <h3>People who voted them in</h3>
        <div style={styles.topLine}>
          {(currentMatch.voterIds || []).map((id) => {
            const p = getPlayer(players, id);
            if (!p) return null;
            const inDifferentElimination = currentMatch.unavailableVoterIds?.includes(id);
            const wasCalledOut = currentMatch.callOutRevealed && String(currentMatch.callOutId) === String(id);

            return (
              <div key={id} style={{ ...styles.voterWrap, ...(inDifferentElimination || wasCalledOut ? styles.differentElimBox : {}) }}>
                <PlayerCard player={p} compact status={inDifferentElimination || wasCalledOut ? "different" : undefined} />
                {inDifferentElimination && <div style={styles.diffElimTag}>IN DIFFERENT ELIMINATION</div>}
              </div>
            );
          })}
        </div>

        {currentMatch.safe && (
          <div style={styles.safeBox}>
            SAFE
            <div style={styles.safeSubtext}>Everyone who voted for them is already in another elimination.</div>
          </div>
        )}

        <h3>Voted Into Elimination</h3>
        <div style={styles.callOutMain}>
          <PlayerCard player={getPlayer(players, currentMatch.sentInId)} compact />

          {!currentMatch.safe && (
            <button style={styles.revealBox} onClick={revealReplayCallOut}>
              {currentMatch.callOutRevealed && currentMatch.callOutId ? (
                <div style={styles.revealedVote}>
                  <img src={getImage(getPlayer(players, currentMatch.callOutId))} style={styles.voteImg} />
                  <strong>{getPlayer(players, currentMatch.callOutId)?.name}</strong>
                </div>
              ) : "?"}
            </button>
          )}
        </div>
      </>
    );
  }

  function renderElimination() {
    const currentMatch = displayCurrentMatch;
    if (!currentMatch) return renderCast();

    return (
      <>
        <h2>Elimination {matchIndex + 1} of {matches.length}</h2>
        <div style={styles.duelRow}>
          <PlayerCard player={getPlayer(players, currentMatch.sentInId)} compact status={currentMatch.resultRevealed ? currentMatch.winnerId === currentMatch.sentInId ? "win" : "lose" : undefined} />
          <strong style={styles.vs}>VS</strong>
          <PlayerCard player={getPlayer(players, currentMatch.callOutId)} compact status={currentMatch.resultRevealed ? currentMatch.winnerId === currentMatch.callOutId ? "win" : "lose" : undefined} />
        </div>
      </>
    );
  }

  function renderWinner() {
    const finalWinner = winner || active[0] || players.find((p) => !p.eliminated);
    return (
      <>
        <h2>Winner</h2>
        <div style={{ maxWidth: 260, margin: "0 auto" }}>
          <PlayerCard player={finalWinner} />
        </div>
      </>
    );
  }

  function renderScreen() {
    if (screen === "alliances") return renderAlliances();
    if (screen === "votes") return renderVotes();
    if (screen === "callout") return renderCallout();
    if (screen === "elimination") return renderElimination();
    if (screen === "winner") return renderWinner();
    return renderCast();
  }

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Call Out</h1>
          <h2 style={styles.subtitle}>Saved Replay • Round {entry.round || 1} • {index + 1} / {cleanHistory.length}</h2>
        </div>

        <div style={styles.headerButtons}>
          <button style={styles.darkButton} onClick={onExit}>Back to Cast</button>
          <button style={{ ...styles.button, opacity: index <= 0 ? 0.45 : 1 }} disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>Previous</button>
          <button style={{ ...styles.hotButton, opacity: index >= cleanHistory.length - 1 ? 0.45 : 1 }} disabled={index >= cleanHistory.length - 1} onClick={() => setIndex((i) => Math.min(cleanHistory.length - 1, i + 1))}>Next</button>
        </div>
      </div>

      {renderScreen()}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "white", padding: 20, fontFamily: "Arial, sans-serif", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", maxWidth: 1200, margin: "0 auto 18px" },
  headerButtons: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  title: { fontSize: 46, margin: 0, color: "#ff1493", fontWeight: 900 },
  subtitle: { marginTop: 6, color: "#ddd" },
  castGridSmall: { display: "grid", gridTemplateColumns: "repeat(14, 92px)", justifyContent: "center", gap: 10, marginTop: 18, width: "100%", maxWidth: 1440, marginLeft: "auto", marginRight: "auto" },
  winText: { color: "#5cff91", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  loseText: { color: "#ff7777", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  button: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#e5e7eb", color: "#111827" },
  hotButton: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#ff1493", color: "white" },
  darkButton: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#374151", color: "white" },
  allianceGrid: { display: "flex", flexDirection: "column", gap: 18, alignItems: "center" },
  allianceBox: { background: "#202020", border: "2px solid #555", borderRadius: 14, padding: 14, width: "min(900px, 95%)" },
  miniRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 },
  voteGrid: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12, margin: "20px auto", maxWidth: 1380 },
  voteCard: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "#1d1d1d", border: "2px solid #444", borderRadius: 14, padding: 10 },
  revealBox: { width: 120, height: 120, borderRadius: 12, fontSize: 46, fontWeight: "bold", border: "3px solid white", background: "#333", color: "white", display: "grid", placeItems: "center", cursor: "pointer", padding: 0 },
  revealedVote: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: 14, gap: 5 },
  voteImg: { width: 70, height: 70, objectFit: "cover", borderRadius: 8 },
  liveCountGrid: { display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, margin: "14px auto 18px", maxWidth: 1050 },
  liveCountCard: { width: 86, height: 112, minWidth: 86, maxWidth: 86, background: "#242424", border: "2px solid #555", borderRadius: 12, padding: 6, display: "grid", gridTemplateRows: "50px 26px 24px", justifyItems: "center", alignItems: "center", gap: 2, overflow: "hidden", boxSizing: "border-box", flex: "0 0 86px" },
  liveCountImageWrap: { width: 48, height: 48, overflow: "hidden", borderRadius: 9, background: "#111827", border: "2px solid rgba(255,255,255,.35)", boxSizing: "border-box" },
  liveCountImage: { width: 48, height: 48, objectFit: "cover", objectPosition: "center", display: "block", borderRadius: 7 },
  noImageSmall: { width: 48, height: 48, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900, fontSize: 20 },
  liveCountName: { width: "100%", height: 24, fontSize: 10, fontWeight: 900, lineHeight: 1.05, textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
  liveCountNumber: { fontSize: 28, fontWeight: 950, lineHeight: 1, color: "#ff1493" },
  noVotesBox: { background: "#242424", border: "2px dashed #555", color: "#ddd", padding: "14px 20px", borderRadius: 14, fontWeight: 900 },
  topLine: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  voterWrap: { borderRadius: 12, padding: 6 },
  differentElimBox: { background: "#7d1010", border: "3px solid #ff3333" },
  diffElimTag: { marginTop: 6, background: "#b00020", color: "white", fontSize: 11, fontWeight: "bold", padding: "5px 7px", borderRadius: 6 },
  callOutMain: { display: "flex", justifyContent: "center", alignItems: "center", gap: 18, flexWrap: "wrap" },
  duelRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 22, flexWrap: "wrap", marginTop: 28 },
  vs: { fontSize: 30 },
  safeBox: { background: "#14532d", border: "4px solid #22c55e", borderRadius: 16, padding: 20, margin: "0 auto 20px", maxWidth: 720, fontSize: 30, fontWeight: 950, color: "white" },
  safeSubtext: { fontSize: 16, marginTop: 8, fontWeight: 800, color: "#dcfce7" },
};
