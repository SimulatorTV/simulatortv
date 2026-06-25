// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const NOMINEE_COLORS = ["#ef4444", "#facc15", "#3b82f6", "#22c55e"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
}

function AddCastMembersModal({ casts, modalCastId, modalContestants, modalSelectedIds, loadingCasts, loadingContestants, onClose, onChooseCast, onToggleContestant, onSelectAll, onSelectNone, onAddSelected }) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) onChooseCast(firstCastId);
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    const active = modalCastId === cast.id;
    return (
      <button type="button" onClick={() => onChooseCast(cast.id)} className={`w-full rounded-2xl border-0 px-4 py-3 text-left font-black ${active ? "bg-blue-950 text-white" : "bg-zinc-950 text-white hover:bg-zinc-900"}`}>
        <div>{cast.name}</div>
        <div className="text-xs font-bold opacity-70">{cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}</div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 text-white">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-sm text-zinc-300">Pick individual contestants from custom casts or favorited official casts.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Close</button>
        </div>
        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-white/10 p-4">
            {loadingCasts ? <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300">Loading casts...</div> : casts.length === 0 ? <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-rose-100">No casts available yet.</div> : <>
              {officialCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Favorite Official Casts</div><div className="space-y-2">{officialCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
              {customCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Custom Casts</div><div className="space-y-2">{customCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
            </>}
          </div>
          <div className="overflow-auto p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-2xl font-black text-white">Contestants</h3><p className="text-sm text-zinc-300">{modalSelectedIds.size} selected</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onSelectAll} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select All</button>
                <button type="button" onClick={onSelectNone} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select None</button>
                <button type="button" onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl border-0 bg-blue-950 px-4 py-2 font-black text-white hover:bg-blue-900 disabled:opacity-40">Add Selected</button>
              </div>
            </div>
            {loadingContestants ? <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">Loading contestants...</div> : modalContestants.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">No contestants found for this cast.</div> : <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {modalContestants.map((person) => {
                const active = modalSelectedIds.has(person.id);
                return <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative aspect-square overflow-hidden rounded-2xl border ${active ? "border-blue-300 ring-2 ring-blue-300/60" : "border-white/10 opacity-45 grayscale"}`}>{person.image_url ? <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} /> : <div className="grid h-full w-full place-items-center bg-zinc-900 p-1 text-center text-xs font-black text-zinc-400">No Image</div>}<div className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1 py-1 text-center text-xs font-black text-white">{person.name}</div></button>;
              })}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TheChampionSimulator() {
  const router = useRouter();
  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [phase, setPhase] = useState("main");
  const [players, setPlayers] = useState([]);
  const [championId, setChampionId] = useState(null);
  const [challengeRanking, setChallengeRanking] = useState([]);
  const [chosenFour, setChosenFour] = useState([]);
  const [revealedNominees, setRevealedNominees] = useState([]);
  const [votes, setVotes] = useState([]);
  const [revealedVoterIds, setRevealedVoterIds] = useState([]);
  const [tiedNominees, setTiedNominees] = useState([]);
  const [tiePickRevealed, setTiePickRevealed] = useState(false);
  const [challengerId, setChallengerId] = useState(null);
  const [championRoll, setChampionRoll] = useState(null);
  const [challengerRoll, setChallengerRoll] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  const alivePlayers = players.filter((p) => !p.eliminated);
  const champion = players.find((p) => p.id === championId);
  const challenger = players.find((p) => p.id === challengerId);
  const revealedVoteList = votes.filter((v) => revealedVoterIds.includes(v.voterId));
  const voteCounter = useMemo(() => chosenFour.map((nom) => ({ ...nom, voteCount: revealedVoteList.filter((v) => v.voteId === nom.id).length })).filter((p) => p.voteCount > 0).sort((a, b) => b.voteCount - a.voteCount), [chosenFour, revealedVoteList]);

  useEffect(() => { loadSavedCasts(); }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);
    const { data: userCasts, error: userCastsError } = await supabase.from("casts").select("id, name, show_name, created_at, is_official, is_full_cast").eq("user_id", userData.user.id).eq("is_full_cast", false).order("created_at", { ascending: false });
    if (userCastsError) { alert(userCastsError.message); setLoadingCasts(false); return; }
    let officialCasts = [];
    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase.from("casts").select("id, name, show_name, created_at, is_official, is_full_cast").in("id", favoriteOfficialCastIds).eq("is_official", true).order("name", { ascending: true });
      if (officialError) { alert(officialError.message); setLoadingCasts(false); return; }
      officialCasts = officialData || [];
    }
    setAvailableCasts([...officialCasts, ...(userCasts || [])].filter((cast) => !cast.is_full_cast));
    setLoadingCasts(false);
  }

  async function openAddCastModal() { setShowAddCastModal(true); if (!modalCastId && availableCasts.length > 0) await loadContestantsForModal(availableCasts[0].id); }
  async function loadContestantsForModal(castId) {
    setModalCastId(castId); setModalSelectedIds(new Set()); setLoadingModalContestants(true);
    const { data, error } = await supabase.from("contestants").select("id, name, image_url, cast_id").eq("cast_id", castId).order("created_at", { ascending: true });
    if (error) { alert(error.message); setLoadingModalContestants(false); return; }
    setModalContestants(data || []); setLoadingModalContestants(false);
  }
  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));
    if (selectedPeople.length === 0) return;
    const additions = selectedPeople.map((person) => ({ id: `${person.cast_id || modalCastId}-${person.id}`, name: person.name, image: person.image_url || "", eliminated: false }));
    setPlayers((current) => { const existing = new Set(current.map((player) => player.id)); return [...current, ...additions.filter((person) => !existing.has(person.id))]; });
    setShowAddCastModal(false); setModalSelectedIds(new Set());
  }
  function removePlayer(id) { if (phase !== "main") return; setPlayers((old) => old.filter((p) => p.id !== id)); }
  function clearRoster() { if (!confirm("Clear The Champion roster?")) return; setPlayers([]); hardResetToMain(); }
  function hardResetToMain() { setPhase("main"); setChampionId(null); setChallengeRanking([]); setChosenFour([]); setRevealedNominees([]); setVotes([]); setRevealedVoterIds([]); setTiedNominees([]); setTiePickRevealed(false); setChallengerId(null); setChampionRoll(null); setChallengerRoll(null); setResultMessage(""); setPlayers((old) => old.map((p) => ({ ...p, eliminated: false }))); }
  function startGame() { if (players.length < 2) { alert("Add at least 2 cast members first."); return; } hardResetToMain(); setPhase("cast"); }
  function runChallenge() { const ranked = shuffle(alivePlayers); setChallengeRanking(ranked); setChampionId(ranked[0].id); setPhase("challengeResults"); }
  function createChosenFour() {
    const options = alivePlayers.filter((p) => p.id !== championId);
    const colors = shuffle(NOMINEE_COLORS);
    const selected = alivePlayers.length <= 5 ? options : shuffle(options).slice(0, Math.min(4, options.length));
    const picked = selected.map((p, index) => ({ ...p, voteColor: colors[index % colors.length] }));
    setChosenFour(picked); setRevealedNominees([]); setTiedNominees([]); setTiePickRevealed(false);
    const autoVote = alivePlayers.length <= 5;
    if (autoVote) { createVotesFromPicked(picked); return; }
    setVotes([]); setRevealedVoterIds([]); setPhase("chosenFour");
  }
  function revealNominee(id) { setRevealedNominees((prev) => [...new Set([...prev, id])]); }
  function revealAllNominees() { setRevealedNominees(chosenFour.map((p) => p.id)); }
  function createVotesFromPicked(picked) {
    const voters = alivePlayers.filter((p) => p.id !== championId);
    const madeVotes = voters.map((voter) => { const options = picked.filter((p) => p.id !== voter.id); const vote = shuffle(options.length ? options : picked)[0]; return { voterId: voter.id, voteId: vote.id }; });
    setVotes(madeVotes); setRevealedVoterIds([]); setPhase("voteReveal");
  }
  function createVotes() { createVotesFromPicked(chosenFour); }
  function revealVoteFor(voterId) { setRevealedVoterIds((prev) => [...new Set([...prev, voterId])]); }
  function revealAllVotes() { setRevealedVoterIds(votes.map((v) => v.voterId)); }
  function advanceFromVotes() {
    const counts = {}; votes.forEach((v) => { counts[v.voteId] = (counts[v.voteId] || 0) + 1; });
    const highest = Math.max(...chosenFour.map((p) => counts[p.id] || 0));
    const tied = chosenFour.filter((p) => (counts[p.id] || 0) === highest);
    const picked = shuffle(tied)[0];
    setTiedNominees(tied); setChallengerId(picked.id); setTiePickRevealed(false); setChampionRoll(null); setChallengerRoll(null); setPhase(tied.length > 1 ? "tieChoice" : "elimination");
  }
  function rollChampion() { setChampionRoll(randomNumber(26, 125)); }
  function rollChallenger() { setChallengerRoll(randomNumber(1, 100)); }
  function resolveElimination() {
    if (championRoll >= challengerRoll) { setPlayers((prev) => prev.map((p) => (p.id === challengerId ? { ...p, eliminated: true } : p))); setResultMessage(`${champion.name} defended the throne. ${challenger.name} is eliminated.`); }
    else { setChampionId(challengerId); setResultMessage(`${challenger.name} defeated ${champion.name} and is the new Champion.`); }
    setPhase("eliminationResult");
  }
  function nextRound() {
    if (players.filter((p) => !p.eliminated).length <= 1) { setPhase("winner"); return; }
    setChosenFour([]); setRevealedNominees([]); setVotes([]); setRevealedVoterIds([]); setTiedNominees([]); setTiePickRevealed(false); setChallengerId(null); setChampionRoll(null); setChallengerRoll(null); setResultMessage(""); createChosenFour();
  }

  return <div style={styles.page}><Navbar />{showAddCastModal && <AddCastMembersModal casts={availableCasts} modalCastId={modalCastId} modalContestants={modalContestants} modalSelectedIds={modalSelectedIds} loadingCasts={loadingCasts} loadingContestants={loadingModalContestants} onClose={() => setShowAddCastModal(false)} onChooseCast={loadContestantsForModal} onToggleContestant={(id) => setModalSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; })} onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))} onSelectNone={() => setModalSelectedIds(new Set())} onAddSelected={addSelectedContestantsToRoster} />}
    <h1 style={styles.title}>The Champion</h1>
    {phase === "main" && <div><h2>Main Menu</h2><p style={styles.text}>One challenge crowns the first Champion. Then the throne is defended until only one remains.</p><div style={styles.mainButtonRow}><button style={styles.button} onClick={openAddCastModal}>Add Cast Members</button>{players.length > 0 && <button style={styles.darkButton} onClick={clearRoster}>Clear Roster</button>}<Link href="/custom-casts" style={{ ...styles.darkButton, textDecoration: "none", display: "inline-block" }}>Manage Casts</Link><button style={styles.button} onClick={startGame} disabled={players.length < 2}>Start Game ({players.length})</button></div>{players.length === 0 ? <div style={styles.emptyBox}>No cast members added yet.</div> : <CastGrid players={players} championId={null} columns={8} canRemove onRemove={removePlayer} />}</div>}
    {phase === "cast" && <div><h2>Full Cast</h2><CastGrid players={players} championId={championId} columns={8} /><button style={styles.button} onClick={runChallenge}>Advance to Challenge</button></div>}
    {phase === "challengeResults" && <div><h2>Challenge Results</h2><div style={styles.rankingBox}>{challengeRanking.map((p, index) => <div key={p.id} style={{ ...styles.rankRow, ...(index === 0 ? styles.goldRow : {}) }}><strong>#{index + 1}</strong><img src={getImage(p)} style={styles.rankImage} /><strong>{p.name}</strong>{index === 0 && <strong>The Champion</strong>}</div>)}</div><button style={styles.button} onClick={createChosenFour}>Advance</button></div>}
    {phase === "chosenFour" && champion && <div><h2>{champion.name} Selects 4 Throne Challengers</h2><div style={styles.nominationLayout}><PlayerCard player={champion} champion />{chosenFour.map((p) => revealedNominees.includes(p.id) ? <PlayerCard key={p.id} player={p} /> : <button key={p.id} style={styles.questionCard} onClick={() => revealNominee(p.id)}>?</button>)}</div>{revealedNominees.length < chosenFour.length && <button style={styles.button} onClick={revealAllNominees}>Reveal All</button>}<h2>Remaining Cast</h2><CastGrid players={alivePlayers.filter((p) => p.id !== championId && !revealedNominees.includes(p.id))} championId={null} columns={8} />{revealedNominees.length === chosenFour.length && <button style={styles.button} onClick={createVotes}>Advance to House Vote</button>}</div>}
    {phase === "voteReveal" && <div><h2>House Vote</h2><div style={styles.counterWrap}>{voteCounter.length === 0 ? <div style={styles.noVotes}>No votes revealed yet</div> : voteCounter.map((p) => <div key={p.id} style={{ ...styles.counterCard, background: p.voteColor }}><img src={getImage(p)} style={styles.counterImage} /><strong style={styles.smallText}>{p.name}</strong><div style={styles.voteNumber}>{p.voteCount}</div></div>)}</div>{revealedVoterIds.length < votes.length && <button style={styles.button} onClick={revealAllVotes}>Reveal All Votes</button>}<div style={styles.voteGrid}>{votes.map((v) => { const voter = players.find((p) => p.id === v.voterId); const vote = chosenFour.find((p) => p.id === v.voteId); const revealed = revealedVoterIds.includes(v.voterId); return <div key={v.voterId} style={{ ...styles.votePlayerCard, ...(revealed ? { background: vote.voteColor } : {}) }}><img src={getImage(voter)} style={styles.squareImage} /><div style={styles.name}>{voter.name}</div>{revealed ? <div style={styles.revealedVoteBox}><div style={styles.votedForText}>voted for</div><img src={getImage(vote)} style={styles.voteMiniImage} /><strong style={styles.smallText}>{vote.name}</strong></div> : <button style={styles.smallQuestion} onClick={() => revealVoteFor(v.voterId)}>?</button>}</div>; })}</div>{revealedVoterIds.length === votes.length && <button style={styles.button} onClick={advanceFromVotes}>Advance</button>}</div>}
    {phase === "tieChoice" && champion && <div><h2>Vote Tie</h2><p style={styles.text}>The Champion will break the tie. Reveal who {champion.name} chooses to face.</p><div style={styles.tieChoiceLayout}><div><PlayerCard player={champion} champion /></div><div style={styles.tieNomineeGrid}>{tiedNominees.map((p) => <div key={p.id} style={{ ...styles.tieNomineeCard, ...(tiePickRevealed && p.id === challengerId ? styles.tiePickedCard : {}) }}><PlayerCard player={p} />{tiePickRevealed && p.id === challengerId && <div style={styles.tiePickedLabel}>Chosen to Face The Champion</div>}</div>)}</div></div>{!tiePickRevealed ? <button style={styles.button} onClick={() => setTiePickRevealed(true)}>Reveal Champion Pick</button> : <button style={styles.button} onClick={() => setPhase("elimination")}>Advance to Elimination</button>}</div>}
    {phase === "elimination" && champion && challenger && <div><h2>Throne Elimination</h2><div style={styles.duelWrap}><div><PlayerCard player={champion} champion /><h3>Champion Dice: 26–125</h3><button style={styles.button} onClick={rollChampion} disabled={championRoll !== null}>Roll Champion</button><div style={styles.rollNumber}>{championRoll ?? "?"}</div></div><div><PlayerCard player={challenger} danger /><h3>Challenger Dice: 1–100</h3><button style={styles.button} onClick={rollChallenger} disabled={challengerRoll !== null}>Roll Challenger</button><div style={styles.rollNumber}>{challengerRoll ?? "?"}</div></div></div>{championRoll !== null && challengerRoll !== null && <button style={styles.button} onClick={resolveElimination}>Advance to Result</button>}</div>}
    {phase === "eliminationResult" && <div><h2>{resultMessage}</h2><CastGrid players={players} championId={championId} columns={8} /><button style={styles.button} onClick={nextRound}>{players.filter((p) => !p.eliminated).length <= 1 ? "Show Winner" : "Next Round"}</button></div>}
    {phase === "winner" && champion && <div><h2>Winner of The Champion</h2><div style={styles.winnerCard}><PlayerCard player={champion} champion /></div><button style={styles.button} onClick={hardResetToMain}>Main Menu</button></div>}
  </div>;
}

function CastGrid({ players, championId, columns, canRemove = false, onRemove = null }) {
  const compactMaxWidth = columns < 5 ? Math.max(columns * 210, 210) : "100%";
  return <div style={{ ...styles.castGrid, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, maxWidth: compactMaxWidth }}>{players.map((p) => <div key={p.id} style={{ position: "relative" }}><PlayerCard player={p} champion={p.id === championId} eliminated={p.eliminated} />{canRemove && <button onClick={() => onRemove?.(p.id)} style={styles.removeButton}>×</button>}</div>)}</div>;
}

function PlayerCard({ player, champion, eliminated, danger }) {
  return <div style={{ ...styles.card, ...(champion ? styles.championCard : {}), ...(danger ? styles.dangerCard : {}), ...(eliminated ? styles.eliminatedCard : {}) }}><img src={getImage(player)} style={{ ...styles.squareImage, ...(eliminated ? styles.eliminatedImage : {}) }} /><div style={styles.name}>{player.name}</div>{champion && <div style={styles.tag}>The Champion</div>}{eliminated && <div style={styles.eliminatedTag}>Eliminated</div>}</div>;
}

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "white", fontFamily: "Arial, sans-serif", padding: 20, textAlign: "center", boxSizing: "border-box" },
  title: { fontSize: 48, color: "gold", margin: "24px 0 20px" },
  text: { fontSize: 18, maxWidth: 700, margin: "0 auto 20px", lineHeight: 1.5 },
  mainButtonRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  button: { background: "gold", color: "black", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 17, fontWeight: "bold", cursor: "pointer", margin: "12px 8px" },
  darkButton: { background: "#0f172a", color: "white", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 17, fontWeight: "bold", cursor: "pointer", margin: "12px 8px" },
  emptyBox: { background: "#1f1f1f", border: "2px dashed #555", borderRadius: 18, padding: 30, color: "#ccc", maxWidth: 700, margin: "20px auto", fontWeight: "bold" },
  removeButton: { position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: 999, border: "none", background: "#ef4444", color: "white", fontWeight: 900, cursor: "pointer" },
  castGrid: { display: "grid", gap: 12, width: "100%", margin: "20px auto" },
  card: { background: "white", color: "black", borderRadius: 10, padding: 8, border: "4px solid transparent", fontWeight: "bold", boxSizing: "border-box", minWidth: 0 },
  squareImage: { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 7, display: "block" },
  name: { marginTop: 7, fontWeight: "bold", fontSize: 13, textAlign: "center", lineHeight: 1.15, minHeight: 30, display: "flex", alignItems: "center", justifyContent: "center" },
  smallText: { fontSize: 13, textAlign: "center", display: "block" },
  championCard: { background: "gold", borderColor: "white", boxShadow: "0 0 16px gold" },
  dangerCard: { background: "#ffd6d6", borderColor: "red" },
  eliminatedCard: { background: "#222", color: "white", opacity: 0.65 },
  eliminatedImage: { filter: "grayscale(100%)" },
  tag: { marginTop: 5, fontSize: 11, textTransform: "uppercase" },
  eliminatedTag: { marginTop: 5, fontSize: 11, textTransform: "uppercase", color: "#ff5555" },
  rankingBox: { maxWidth: 780, margin: "0 auto" },
  rankRow: { display: "grid", gridTemplateColumns: "60px 70px 1fr 170px", alignItems: "center", gap: 10, background: "white", color: "black", borderRadius: 10, padding: 8, margin: "7px 0", fontSize: 14 },
  goldRow: { background: "gold" },
  rankImage: { width: 60, height: 60, objectFit: "cover", borderRadius: 8 },
  nominationLayout: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14, width: "100%", maxWidth: 1200, margin: "20px auto", alignItems: "stretch" },
  questionCard: { width: "100%", aspectRatio: "1 / 1", background: "white", color: "black", borderRadius: 10, border: "4px solid gold", fontSize: 64, fontWeight: "bold", cursor: "pointer" },
  counterWrap: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, maxWidth: 760, margin: "20px auto" },
  counterCard: { color: "black", borderRadius: 10, padding: 8, fontWeight: "bold", border: "3px solid white" },
  noVotes: { gridColumn: "1 / -1", background: "#222", border: "2px dashed #555", color: "#ddd", borderRadius: 12, padding: 18, fontWeight: "bold" },
  counterImage: { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8 },
  voteNumber: { fontSize: 34, fontWeight: "bold" },
  voteGrid: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, margin: "20px auto", width: "100%" },
  votePlayerCard: { background: "white", color: "black", borderRadius: 10, padding: 8, fontWeight: "bold", boxSizing: "border-box", border: "4px solid transparent", transition: "background 0.2s ease" },
  smallQuestion: { marginTop: 8, width: "100%", height: 52, borderRadius: 8, border: "none", background: "#111", color: "white", fontSize: 30, fontWeight: "bold", cursor: "pointer" },
  revealedVoteBox: { marginTop: 8, borderRadius: 8, padding: 6, color: "black", background: "rgba(255,255,255,0.55)", border: "2px solid black" },
  votedForText: { fontSize: 11, textTransform: "uppercase", marginBottom: 4 },
  voteMiniImage: { width: 48, height: 48, objectFit: "cover", borderRadius: 6, display: "block", margin: "0 auto 4px" },
  tieChoiceLayout: { display: "grid", gridTemplateColumns: "180px minmax(0, 1fr)", justifyContent: "center", alignItems: "start", gap: 24, maxWidth: 760, margin: "20px auto" },
  tieNomineeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 180px))", justifyContent: "center", gap: 14 },
  tieNomineeCard: { borderRadius: 12, padding: 6, border: "4px solid transparent", boxSizing: "border-box" },
  tiePickedCard: { borderColor: "gold", background: "rgba(255, 215, 0, 0.25)" },
  tiePickedLabel: { marginTop: 8, background: "gold", color: "black", borderRadius: 8, padding: "8px 6px", fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  duelWrap: { display: "grid", gridTemplateColumns: "repeat(2, 190px)", justifyContent: "center", gap: 36, maxWidth: 460, margin: "25px auto" },
  rollNumber: { fontSize: 46, fontWeight: "bold", background: "white", color: "black", borderRadius: 12, padding: 12, marginTop: 10 },
  winnerCard: { width: 210, margin: "20px auto" },
};
