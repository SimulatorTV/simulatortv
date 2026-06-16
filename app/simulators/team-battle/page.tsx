// @ts-nocheck

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type TeamKey = "A" | "B";
type Format = "team-vs-team" | "team-vs-self";
type Phase =
  | "setup"
  | "weekStart"
  | "challenge"
  | "winnerVote"
  | "loserVote"
  | "elimination"
  | "result"
  | "returnWithElim"
  | "winner";

type Player = {
  id: string;
  name: string;
  img: string;
  team: TeamKey;
  eliminated: boolean;
};

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

function getImage(player: any) {
  return player?.img || player?.image || player?.image_url || "";
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
}: any) {
  const officialCasts = casts.filter((cast: any) => cast.is_official);
  const customCasts = casts.filter((cast: any) => !cast.is_official);
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) {
      onChooseCast(firstCastId);
    }
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }: any) {
    const active = modalCastId === cast.id;

    return (
      <button
        type="button"
        onClick={() => onChooseCast(cast.id)}
        style={{
          width: "100%",
          borderRadius: 16,
          border: active ? "3px solid #fca5a5" : "2px solid #3f3f46",
          background: active ? "#dc2626" : "#18181b",
          color: "white",
          padding: 12,
          textAlign: "left",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 16 }}>{cast.name}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}
        </div>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,.86)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        color: "white",
      }}
    >
      <div
        style={{
          width: "min(1180px, 100%)",
          maxHeight: "90vh",
          background: "#09090b",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 80px rgba(0,0,0,.75)",
        }}
      >
        <div
          style={{
            padding: 18,
            borderBottom: "1px solid rgba(255,255,255,.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 950 }}>
              Add Cast Members
            </h2>
            <p style={{ margin: "6px 0 0", color: "#d4d4d8", fontWeight: 700 }}>
              Pick a cast, then click individual players to add.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: 16,
              background: "#27272a",
              color: "white",
              padding: "10px 16px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            minHeight: 0,
            flex: 1,
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderRight: "1px solid rgba(255,255,255,.12)",
              padding: 14,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {loadingCasts ? (
              <div style={{ color: "#d4d4d8", fontWeight: 800 }}>Loading casts...</div>
            ) : casts.length === 0 ? (
              <div style={{ color: "#fecaca", fontWeight: 800 }}>No casts available yet.</div>
            ) : (
              <>
                {officialCasts.length > 0 && (
                  <div>
                    <div style={{ color: "#a1a1aa", fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>
                      FAVORITE OFFICIAL CASTS
                    </div>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {officialCasts.map((cast: any) => (
                        <CastButton key={cast.id} cast={cast} />
                      ))}
                    </div>
                  </div>
                )}

                {customCasts.length > 0 && (
                  <div>
                    <div style={{ color: "#a1a1aa", fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>
                      CUSTOM CASTS
                    </div>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {customCasts.map((cast: any) => (
                        <CastButton key={cast.id} cast={cast} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ padding: 14, overflow: "auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>Contestants</h3>
                <div style={{ color: "#d4d4d8", fontWeight: 800 }}>
                  {modalSelectedIds.size} selected
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={onSelectAll} style={modalSmallButtonStyle}>
                  Select All
                </button>
                <button type="button" onClick={onSelectNone} style={modalSmallButtonStyle}>
                  Select None
                </button>
                <button
                  type="button"
                  onClick={onAddSelected}
                  disabled={modalSelectedIds.size === 0}
                  style={{
                    ...modalSmallButtonStyle,
                    background: modalSelectedIds.size === 0 ? "#3f3f46" : "#dc2626",
                    opacity: modalSelectedIds.size === 0 ? 0.45 : 1,
                  }}
                >
                  Add Selected
                </button>
              </div>
            </div>

            {loadingContestants ? (
              <div style={{ color: "#d4d4d8", fontWeight: 800 }}>Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div style={{ color: "#d4d4d8", fontWeight: 800 }}>No contestants found for this cast.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))",
                  gap: 12,
                }}
              >
                {modalContestants.map((person: any) => {
                  const active = modalSelectedIds.has(person.id);

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onToggleContestant(person.id)}
                      style={{
                        position: "relative",
                        borderRadius: 16,
                        overflow: "hidden",
                        border: active ? "4px solid #fca5a5" : "2px solid #3f3f46",
                        background: active ? "#7f1d1d" : "#18181b",
                        padding: 0,
                        color: "white",
                        cursor: "pointer",
                        opacity: active ? 1 : 0.62,
                      }}
                    >
                      <div style={{ aspectRatio: "1 / 1", background: "#111827" }}>
                        {person.image_url ? (
                          <img
                            src={person.image_url}
                            alt={person.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              filter: active ? "none" : "grayscale(1)",
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
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          minHeight: 38,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "5px 6px",
                          fontSize: 12,
                          fontWeight: 950,
                          lineHeight: 1.05,
                        }}
                      >
                        {person.name}
                      </div>

                      {active && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            background: "#dc2626",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 950,
                            border: "2px solid white",
                          }}
                        >
                          ✓
                        </div>
                      )}
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

const modalSmallButtonStyle = {
  border: "none",
  borderRadius: 16,
  background: "#27272a",
  color: "white",
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

export default function TeamBattleSimulator() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("setup");
  const [week, setWeek] = useState(1);
  const [customTeams, setCustomTeams] = useState(false);
  const [teamNames, setTeamNames] = useState({ A: "Team A", B: "Team B" });
  const [players, setPlayers] = useState<Player[]>([]);

  const maxWeeks = Math.max(players.length - 1, 1);
  const [planner, setPlanner] = useState(
    Array.from({ length: 50 }, () => ({
      format: "team-vs-team" as Format,
      locked: false,
      daily: "No Challenge",
      dailyLocked: false,
    }))
  );

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [winningTeam, setWinningTeam] = useState<TeamKey | null>(null);
  const [losingTeam, setLosingTeam] = useState<TeamKey | null>(null);
  const [winnerVotes, setWinnerVotes] = useState<Record<string, string>>({});
  const [winnerRevealed, setWinnerRevealed] = useState<Record<string, boolean>>({});
  const [winnerVoteOptions, setWinnerVoteOptions] = useState<string[]>([]);
  const [winnerRevote, setWinnerRevote] = useState(0);
  const [loserVotes, setLoserVotes] = useState<Record<string, string>>({});
  const [loserRevealed, setLoserRevealed] = useState<Record<string, boolean>>({});
  const [loserVoteOptions, setLoserVoteOptions] = useState<string[]>([]);
  const [loserRevote, setLoserRevote] = useState(0);
  const [winnerPick, setWinnerPick] = useState<string | null>(null);
  const [loserPick, setLoserPick] = useState<string | null>(null);
  const [eliminatedId, setEliminatedId] = useState<string | null>(null);

  const [availableCasts, setAvailableCasts] = useState<any[]>([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState<any[]>([]);
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const currentFormat = planner[week - 1]?.format ?? "team-vs-team";
  const alive = players.filter((p) => !p.eliminated);
  const aliveA = players.filter((p) => p.team === "A" && !p.eliminated);
  const aliveB = players.filter((p) => p.team === "B" && !p.eliminated);
  const winnerTeamName = aliveA.length > 0 && aliveB.length === 0 ? teamNames.A : aliveB.length > 0 && aliveA.length === 0 ? teamNames.B : null;
  const getPlayer = (id: string | null) => players.find((p) => p.id === id);

  useEffect(() => { loadSavedCasts(); }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav: any) => fav.cast_id);

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official, is_full_cast")
      .eq("user_id", userData.user.id)
      .eq("is_full_cast", false)
      .order("created_at", { ascending: false });

    if (userCastsError) { alert(userCastsError.message); setLoadingCasts(false); return; }

    let officialCasts: any[] = [];
    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase
        .from("casts")
        .select("id, name, show_name, created_at, is_official, is_full_cast")
        .in("id", favoriteOfficialCastIds)
        .eq("is_official", true)
        .order("name", { ascending: true });
      if (officialError) { alert(officialError.message); setLoadingCasts(false); return; }
      officialCasts = officialData || [];
    }

    setAvailableCasts([...officialCasts, ...(userCasts || [])].filter((cast) => !cast.is_full_cast));
    setLoadingCasts(false);
  }

  async function openAddCastModal() {
    setShowAddCastModal(true);
    if (!modalCastId && availableCasts.length > 0) await loadContestantsForModal(availableCasts[0].id);
  }

  async function loadContestantsForModal(castId: string) {
    setModalCastId(castId);
    setModalSelectedIds(new Set());
    setLoadingModalContestants(true);
    const { data, error } = await supabase.from("contestants").select("id, name, image_url, cast_id").eq("cast_id", castId).order("created_at", { ascending: true });
    if (error) { alert(error.message); setLoadingModalContestants(false); return; }
    setModalContestants(data || []);
    setLoadingModalContestants(false);
  }

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person: any) => modalSelectedIds.has(person.id));
    if (selectedPeople.length === 0) return;
    const additions: Player[] = selectedPeople.map((person: any, index: number) => ({
      id: `${person.cast_id || modalCastId}-${person.id}`,
      name: person.name,
      img: person.image_url || "",
      team: (players.length + index) % 2 === 0 ? "A" : "B",
      eliminated: false,
    }));
    setPlayers((current) => {
      const existing = new Set(current.map((player) => player.id));
      return [...current, ...additions.filter((person) => !existing.has(person.id))];
    });
    setPhase("setup");
    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function clearRoster() { if (confirm("Clear Team Battle roster?")) setPlayers([]); }
  function removePlayer(id: string) { if (phase === "setup") setPlayers((old) => old.filter((p) => p.id !== id)); }
  function movePlayer(id: string, team: TeamKey) { if (customTeams) setPlayers((old) => old.map((p) => p.id === id ? { ...p, team } : p)); }

  function startGame() {
    if (players.length < 2) return;
    if (!customTeams) {
      const randomized = shuffle(players);
      setPlayers(randomized.map((p, i) => ({ ...p, team: i % 2 === 0 ? "A" : "B", eliminated: false })));
    } else {
      setPlayers(players.map((p) => ({ ...p, eliminated: false })));
    }
    setWeek(1); setWinnerVotes({}); setWinnerRevealed({}); setLoserVotes({}); setLoserRevealed({}); setWinnerPick(null); setLoserPick(null); setEliminatedId(null); setWinnerRevote(0); setLoserRevote(0); setPhase("weekStart");
  }

  function setAllFormats(format: Format) { setPlanner((old) => old.map((w) => w.locked ? w : { ...w, format })); }
  function beginChallenge() { const win: TeamKey = Math.random() < 0.5 ? "A" : "B"; const lose: TeamKey = win === "A" ? "B" : "A"; setWinningTeam(win); setLosingTeam(lose); setPhase("challenge"); }
  function makeVote(voters: Player[], optionIds: string[]) { const votes: Record<string, string> = {}; voters.forEach((v) => { const options = optionIds.filter((id) => id !== v.id); votes[v.id] = rand(options.length ? options : optionIds); }); return votes; }

  function setupWinnerVote() {
    if (!winningTeam || !losingTeam) return;
    const voters = players.filter((p) => p.team === winningTeam && !p.eliminated);
    const options = currentFormat === "team-vs-team" ? players.filter((p) => p.team === winningTeam && !p.eliminated).map((p) => p.id) : players.filter((p) => p.team === losingTeam && !p.eliminated).map((p) => p.id);
    setWinnerVoteOptions(options); setWinnerVotes(makeVote(voters, options)); setWinnerRevealed({}); setWinnerPick(null); setWinnerRevote(0); setPhase("winnerVote");
  }

  function finishWinnerVote() {
    const counts: Record<string, number> = {}; Object.values(winnerVotes).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    const high = Math.max(...Object.values(counts)); const tied = Object.keys(counts).filter((id) => counts[id] === high);
    if (tied.length > 1) { const voters = players.filter((p) => p.team === winningTeam && !p.eliminated); setWinnerVoteOptions(tied); setWinnerVotes(makeVote(voters, tied)); setWinnerRevealed({}); setWinnerRevote((r) => r + 1); return; }
    setWinnerPick(tied[0]); setupLoserVote(tied[0], currentFormat === "team-vs-self"); setPhase("loserVote");
  }

  function setupLoserVote(blockedPick: string, hasBlockedPlayer: boolean) {
    if (!losingTeam) return;
    const voters = players.filter((p) => p.team === losingTeam && !p.eliminated);
    const options = voters.filter((p) => !hasBlockedPlayer || p.id !== blockedPick).map((p) => p.id);
    setLoserVoteOptions(options); setLoserVotes(makeVote(voters.filter((p) => p.id !== blockedPick || !hasBlockedPlayer), options)); setLoserRevealed({}); setLoserPick(null); setLoserRevote(0);
  }

  function finishLoserVote() {
    const counts: Record<string, number> = {}; Object.values(loserVotes).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    const high = Math.max(...Object.values(counts)); const tied = Object.keys(counts).filter((id) => counts[id] === high);
    if (tied.length > 1) { const voters = players.filter((p) => p.team === losingTeam && !p.eliminated && !(currentFormat === "team-vs-self" && p.id === winnerPick)); setLoserVoteOptions(tied); setLoserVotes(makeVote(voters, tied)); setLoserRevealed({}); setLoserRevote((r) => r + 1); return; }
    setLoserPick(tied[0]); setPhase("elimination");
  }

  function revealElimination() { if (winnerPick && loserPick) { setEliminatedId(rand([winnerPick, loserPick])); setPhase("result"); } }
  function returnToTeams() { if (!eliminatedId) return; setPlayers((old) => old.map((p) => p.id === eliminatedId ? { ...p, eliminated: true } : p)); setPhase("returnWithElim"); }
  function nextWeekOrWinner() {
    const nextPlayers = players.map((p) => p.id === eliminatedId ? { ...p, eliminated: true } : p);
    const nextA = nextPlayers.filter((p) => p.team === "A" && !p.eliminated); const nextB = nextPlayers.filter((p) => p.team === "B" && !p.eliminated);
    setWinnerVotes({}); setWinnerRevealed({}); setLoserVotes({}); setLoserRevealed({}); setWinnerPick(null); setLoserPick(null); setEliminatedId(null); setWinnerRevote(0); setLoserRevote(0);
    if (nextA.length === 0 || nextB.length === 0) setPhase("winner"); else { setWeek((w) => w + 1); setPhase("weekStart"); }
  }

  function voteCounts(votes: Record<string, string>, revealed: Record<string, boolean>) { const counts: Record<string, number> = {}; Object.entries(votes).forEach(([voter, target]) => { if (revealed[voter]) counts[target] = (counts[target] || 0) + 1; }); return counts; }

  function PlayerCard({ p, draggable = false, faded = false, red = false, big = false }: { p: Player; draggable?: boolean; faded?: boolean; red?: boolean; big?: boolean; }) {
    return <div className={`card ${p.eliminated || faded ? "out" : ""} ${red ? "redCard" : ""} ${big ? "big" : ""}`} draggable={draggable} onDragStart={() => draggable && setDraggedId(p.id)}>{getImage(p) ? <img src={getImage(p)} alt={p.name} /> : <div className="noImg">No Image</div>}<div>{p.name}</div></div>;
  }

  function VoteTracker({ optionIds, counts }: { optionIds: string[]; counts: Record<string, number>; }) {
    const entries = optionIds.map((id) => ({ id, count: counts[id] || 0, player: getPlayer(id) })).filter((entry) => entry.player && entry.count > 0).sort((a, b) => b.count - a.count);
    return <div className="voteTracker">{entries.length === 0 && <div className="emptyTracker">No votes revealed yet</div>}{entries.map(({ id, count, player }) => <div className="trackerBox" key={id}><img src={getImage(player)} alt={player.name} /><div>{player.name}</div><strong>{count}</strong></div>)}</div>;
  }

  function TeamGrid({ team }: { team: TeamKey }) {
    return <div className={`team team${team}`} onDragOver={(e) => e.preventDefault()} onDrop={() => draggedId && movePlayer(draggedId, team)}><input value={teamNames[team]} onChange={(e) => setTeamNames((old) => ({ ...old, [team]: e.target.value }))} /><div className="grid">{players.filter((p) => p.team === team && (!p.eliminated || phase === "returnWithElim")).map((p) => <PlayerCard key={p.id} p={p} draggable={phase === "setup" && customTeams} />)}</div></div>;
  }

  function CastSetupGrid() {
    return <div className="castSetupGrid">{players.length === 0 ? <div className="emptyRoster">No cast members added yet.</div> : players.map((p) => <div className="setupCardWrap" key={p.id}><PlayerCard p={p} /><button className="removeBtn" onClick={() => removePlayer(p.id)}>×</button></div>)}</div>;
  }

  function VoteRevealRow({ voter, target, revealed, blocked, reveal }: { voter: Player; target: Player | undefined; revealed: boolean; blocked?: boolean; reveal: () => void; }) {
    return <div className={`voteRow ${blocked ? "redCard" : ""}`}><PlayerCard p={voter} /><div className="voteRight">{blocked ? <strong>Already Sent In</strong> : revealed && target ? <div className="voteTarget"><img src={getImage(target)} alt={target.name} /><div>{target.name}</div></div> : <div className="question" onClick={reveal}>?</div>}</div></div>;
  }

  const winnerVoteCounts = voteCounts(winnerVotes, winnerRevealed);
  const loserVoteCounts = voteCounts(loserVotes, loserRevealed);
  const matchupPlayers = players.filter((p) => p.id === winnerPick || p.id === loserPick);

  return (
    <div className="app">
      <Navbar />
      <style>{`
        body { margin:0; background:#eef6ff; font-family:Arial,sans-serif; }
        .app { min-height:100vh; padding:18px; text-align:center; background:#eef6ff; }
        .gameArea button, .gameArea select, .gameArea input { padding:8px 10px; border-radius:10px; border:1px solid #999; }
        .gameArea button { background:white; font-weight:bold; cursor:pointer; }
        .gameArea label { font-weight:bold; margin:0 10px; }
        .topButtons { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin:12px 0 18px; }
        .redMain { background:#ef233c; color:white; border-color:#a30014; }
        .darkMain { background:#1f2937; color:white; border-color:#111827; }
        .teams { display:grid; grid-template-columns:1fr 1fr; gap:18px; max-width:1200px; margin:auto; }
        .team { background:white; padding:14px; border-radius:18px; box-shadow:0 3px 12px #0002; min-height:260px; }
        .teamA { border:5px solid #2f80ed; }
        .teamB { border:5px solid #eb5757; }
        .team input { font-size:22px; font-weight:900; text-align:center; margin-bottom:12px; width:80%; }
        .grid { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; }
        .card { width:105px; background:white; border:2px solid #222; border-radius:12px; overflow:hidden; font-weight:bold; transition:all .7s ease; }
        .card img, .noImg { width:100%; height:95px; object-fit:cover; display:block; }
        .noImg { background:#111827; color:#94a3b8; display:grid; place-items:center; font-size:12px; }
        .card div { min-height:34px; padding:5px; display:flex; align-items:center; justify-content:center; font-size:13px; }
        .card.out { filter:grayscale(1); opacity:.35; background:#111; color:white; }
        .redCard { background:#ffdddd; border-color:#c00; }
        .big { width:190px; }
        .big img, .big .noImg { height:180px; }
        .planner { max-width:1050px; margin:0 auto 18px; background:white; padding:14px; border-radius:16px; box-shadow:0 3px 12px #0002; }
        .weekRow { display:grid; grid-template-columns:70px 1fr 80px 1fr 80px; gap:8px; align-items:center; margin:6px 0; }
        .voteTracker { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin:15px; }
        .emptyTracker { background:white; border:2px dashed #999; border-radius:12px; padding:14px 18px; font-weight:bold; color:#555; }
        .trackerBox { background:white; border:2px solid #222; border-radius:12px; padding:6px; font-weight:bold; width:90px; }
        .trackerBox img { width:78px; height:65px; object-fit:cover; border-radius:8px; }
        .voteGridRows { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; max-width:1150px; margin:20px auto 0; }
        .voteRow { display:flex; align-items:center; justify-content:center; gap:10px; background:white; border:2px solid #222; border-radius:14px; padding:8px; font-weight:bold; }
        .voteRow .card { width:95px; }
        .voteRow .card img, .voteRow .card .noImg { height:82px; }
        .voteRight { width:95px; min-height:100px; display:grid; place-items:center; border-left:1px solid #ccc; padding-left:8px; }
        .voteTarget img { width:70px; height:60px; object-fit:cover; border-radius:8px; }
        .question { font-size:32px; padding:16px; cursor:pointer; }
        .castSetupGrid { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; max-width:1200px; margin:18px auto; }
        .setupCardWrap { position:relative; }
        .removeBtn { position:absolute; top:-8px; right:-8px; background:#dc2626; color:white; border:none; border-radius:999px; width:26px; height:26px; padding:0; }
        .matchup { display:flex; justify-content:center; align-items:center; gap:35px; flex-wrap:wrap; margin:30px; }
        .vs { font-size:42px; font-weight:900; }
        .winnerBox { margin:auto; max-width:700px; background:white; border-radius:20px; padding:30px; box-shadow:0 3px 15px #0003; }
        .winnerText { font-size:42px; font-weight:900; color:#d49b00; }
        @media(max-width:900px){ .voteGridRows { grid-template-columns:1fr; } }
        @media(max-width:750px){ .teams { grid-template-columns:1fr; } .weekRow { grid-template-columns:1fr; } .card { width:82px; } .card img, .card .noImg { height:75px; } }
      `}</style>

      {showAddCastModal && <AddCastMembersModal casts={availableCasts} modalCastId={modalCastId} modalContestants={modalContestants} modalSelectedIds={modalSelectedIds} loadingCasts={loadingCasts} loadingContestants={loadingModalContestants} onClose={() => setShowAddCastModal(false)} onChooseCast={loadContestantsForModal} onToggleContestant={(id: string) => setModalSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; })} onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person: any) => person.id)))} onSelectNone={() => setModalSelectedIds(new Set())} onAddSelected={addSelectedContestantsToRoster} />}

      <div className="gameArea">
        <h1>Team Battle</h1>

      {phase === "setup" && <><div className="topButtons"><button className="redMain" onClick={openAddCastModal}>Add Cast Members</button>{players.length > 0 && <button className="darkMain" onClick={clearRoster}>Clear Roster</button>}<Link href="/custom-casts"><button className="darkMain">Manage Casts</button></Link></div><CastSetupGrid /><div className="planner"><h2>Settings</h2><label><input type="checkbox" checked={customTeams} onChange={(e) => setCustomTeams(e.target.checked)} /> Custom Teams</label></div><div className="planner"><h2>Weekly Planner</h2><div><select onChange={(e) => setAllFormats(e.target.value as Format)}><option value="team-vs-team">Team vs Team</option><option value="team-vs-self">Team vs Self</option></select> <button type="button">Set All Formats</button> <select disabled><option>No Challenge</option></select> <button type="button">Set All Daily Challenges</button></div>{planner.slice(0, Math.max(maxWeeks, 1)).map((w, i) => <div className="weekRow" key={i}><strong>Week {i + 1}</strong><select value={w.format} disabled={w.locked} onChange={(e) => setPlanner((old) => old.map((x, idx) => idx === i ? { ...x, format: e.target.value as Format } : x))}><option value="team-vs-team">Team vs Team</option><option value="team-vs-self">Team vs Self</option></select><button onClick={() => setPlanner((old) => old.map((x, idx) => idx === i ? { ...x, locked: !x.locked } : x))}>{w.locked ? "Locked" : "Lock"}</button><select disabled><option>No Challenge</option></select><button disabled>Lock</button></div>)}</div>{customTeams ? <><h2>Drag Players Into Custom Teams</h2><div className="teams"><TeamGrid team="A" /><TeamGrid team="B" /></div></> : <h2>Teams will randomize when the game starts</h2>}<br /><button className="redMain" onClick={startGame} disabled={players.length < 2}>Start Game</button></>}

      {phase === "weekStart" && <><h2>Week {week}</h2><h3>{currentFormat === "team-vs-team" ? "Team vs Team" : "Team vs Self"}</h3><div className="teams"><TeamGrid team="A" /><TeamGrid team="B" /></div><br /><button onClick={beginChallenge}>Advance to Challenge</button></>}
      {phase === "challenge" && winningTeam && <><h2>Challenge Result</h2><h3>{teamNames[winningTeam]} wins safety!</h3><div className="teams"><TeamGrid team={winningTeam} /></div><br /><button onClick={setupWinnerVote}>Advance to Voting</button></>}
      {phase === "winnerVote" && winningTeam && <><h2>{teamNames[winningTeam]} Vote</h2>{winnerRevote > 0 && <h3>Revote between tied players</h3>}<VoteTracker optionIds={winnerVoteOptions} counts={winnerVoteCounts} /><button onClick={() => setWinnerRevealed(Object.fromEntries(Object.keys(winnerVotes).map((id) => [id, true])))}>Reveal All</button><div className="voteGridRows">{players.filter((p) => p.team === winningTeam && !p.eliminated).map((p) => <VoteRevealRow key={p.id} voter={p} target={getPlayer(winnerVotes[p.id])} revealed={!!winnerRevealed[p.id]} reveal={() => setWinnerRevealed((old) => ({ ...old, [p.id]: true }))} />)}</div><br /><button onClick={finishWinnerVote}>Advance</button></>}
      {phase === "loserVote" && losingTeam && <><h2>{teamNames[losingTeam]} Vote</h2>{loserRevote > 0 && <h3>Revote between tied players</h3>}<VoteTracker optionIds={loserVoteOptions} counts={loserVoteCounts} /><button onClick={() => setLoserRevealed(Object.fromEntries(Object.keys(loserVotes).map((id) => [id, true])))}>Reveal All</button><div className="voteGridRows">{players.filter((p) => p.team === losingTeam && !p.eliminated).map((p) => { const blocked = currentFormat === "team-vs-self" && p.id === winnerPick; return <VoteRevealRow key={p.id} voter={p} target={getPlayer(loserVotes[p.id])} blocked={blocked} revealed={!!loserRevealed[p.id]} reveal={() => setLoserRevealed((old) => ({ ...old, [p.id]: true }))} />; })}</div><br /><button onClick={finishLoserVote}>Advance to Elimination</button></>}
      {phase === "elimination" && <><h2>Elimination Matchup</h2><div className="matchup">{matchupPlayers.map((p, i) => <React.Fragment key={p.id}><PlayerCard p={p} big />{i === 0 && <div className="vs">VS</div>}</React.Fragment>)}</div><button onClick={revealElimination}>Reveal Result</button></>}
      {phase === "result" && <><h2>Elimination Result</h2><div className="matchup">{matchupPlayers.map((p, i) => <React.Fragment key={p.id}><PlayerCard p={p} big faded={p.id === eliminatedId} />{i === 0 && <div className="vs">VS</div>}</React.Fragment>)}</div><button onClick={returnToTeams}>Return to Teams</button></>}
      {phase === "returnWithElim" && <><h2>Week {week} Complete</h2><div className="teams"><TeamGrid team="A" /><TeamGrid team="B" /></div><br /><button onClick={nextWeekOrWinner}>Advance</button></>}
      {phase === "winner" && <div className="winnerBox"><div className="winnerText">{winnerTeamName || "Winning Team"} Wins!</div><br /><div className="grid">{alive.map((p) => <PlayerCard key={p.id} p={p} />)}</div><br /><button onClick={() => { setPlayers((old) => old.map((p) => ({ ...p, eliminated: false }))); setPhase("setup"); }}>Back to Main Menu</button></div>}
      </div>
    </div>
  );
}
