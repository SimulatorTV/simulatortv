// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const COLORS = [
  ["Red", "#e6194b"], ["Orange", "#f58231"], ["Yellow", "#ffe119"], ["Lime", "#bfef45"], ["Green", "#3cb44b"],
  ["Teal", "#469990"], ["Cyan", "#42d4f4"], ["Blue", "#4363d8"], ["Navy", "#000075"], ["Purple", "#911eb4"],
  ["Magenta", "#f032e6"], ["Pink", "#fabed4"], ["Salmon", "#ff7f7f"], ["Maroon", "#800000"], ["Olive", "#808000"],
  ["Mint", "#aaffc3"], ["Lavender", "#dcbeff"], ["Brown", "#9a6324"], ["Tan", "#d2b48c"], ["Black", "#111111"],
  ["Gray", "#808080"], ["Sky", "#87ceeb"], ["Gold", "#ffd700"], ["Coral", "#ff6f61"], ["Indigo", "#4b0082"],
  ["Turquoise", "#40e0d0"], ["Forest", "#228b22"], ["Rose", "#c71585"], ["Slate", "#708090"], ["White", "#f8f8f8"]
].map(([name, hex]) => ({ name, hex }));

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

function textForBg(hex) {
  if (!hex) return "black";
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? "black" : "white";
}

function darken(hex) {
  if (!hex) return "#222";
  const c = hex.replace("#", "");
  const r = Math.max(0, Math.floor(parseInt(c.slice(0, 2), 16) * 0.55));
  const g = Math.max(0, Math.floor(parseInt(c.slice(2, 4), 16) * 0.55));
  const b = Math.max(0, Math.floor(parseInt(c.slice(4, 6), 16) * 0.55));
  return `rgb(${r},${g},${b})`;
}

function fallbackAvatar(name) {
  const initials = String(name || "?").split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' font-size='82' fill='white' font-family='Arial' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl ${className}`}>{children}</div>;
}

function PlayerCard({ player, small = false, teamColor = "#f8f8f8", sideALabel = "Side A", sideBLabel = "Side B", gray = false, large = false }) {
  const bg = teamColor || "#f8f8f8";
  const fg = textForBg(bg);
  const sideText = player?.side === "A" ? sideALabel : player?.side === "B" ? sideBLabel : "";
  const sizeClass = large ? "w-32 sm:w-40" : small ? "w-20 sm:w-24" : "w-24 sm:w-28";

  return (
    <div className={`${sizeClass} shrink-0 rounded-2xl p-1.5 text-center shadow-lg`} style={{ background: bg, color: fg, border: `3px solid ${darken(bg)}` }}>
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <img src={player?.image || fallbackAvatar(player?.name)} alt={player?.name} className={`h-full w-full object-cover ${gray ? "grayscale opacity-60" : ""}`} onError={(e) => (e.currentTarget.src = fallbackAvatar(player?.name))} />
      </div>
      <div className="mt-1 truncate text-[10px] font-black sm:text-xs">{player?.name}</div>
      {sideText ? <div className="mx-auto mt-1 w-fit rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">{sideText}</div> : null}
    </div>
  );
}

function TeamMini({ team, sideALabel, sideBLabel, compact = false }) {
  if (!team) return null;
  return (
    <div className={`overflow-hidden rounded-3xl border-4 bg-zinc-950 ${compact ? "max-w-xs" : ""}`} style={{ borderColor: team.color?.hex || "#555" }}>
      <div className="px-3 py-2 text-center font-black" style={{ background: team.color?.hex || "#777", color: textForBg(team.color?.hex) }}>{team.color?.name || "Team"}</div>
      <div className="flex flex-wrap justify-center gap-2 p-3">
        {(team.players || []).map((p) => <PlayerCard key={p.id || p.name} player={p} small teamColor={team.color?.hex} sideALabel={sideALabel} sideBLabel={sideBLabel} />)}
      </div>
    </div>
  );
}


function CompactVoteTeam({ team }) {
  if (!team) return null;

  return (
    <div
      className="mt-2 rounded-xl border-2 p-2"
      style={{
        background: team.color?.hex || "#777",
        color: textForBg(team.color?.hex),
        borderColor: darken(team.color?.hex),
      }}
    >
      <div className="mb-1 text-center text-xs font-black">
        {team.color?.name || "Team"} Team
      </div>

      <div className="flex items-start justify-center gap-2">
        {(team.players || []).map((player) => (
          <div key={player.id || player.name} className="w-12 text-center sm:w-14">
            <div className="aspect-square overflow-hidden rounded-lg bg-zinc-900">
              <img
                src={player.image || fallbackAvatar(player.name)}
                alt={player.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = fallbackAvatar(player.name);
                }}
              />
            </div>
            <div className="mt-1 truncate text-[9px] font-black leading-tight sm:text-[10px]">
              {player.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function AddCastMembersModal({ casts, modalCastId, modalContestants, modalSelectedIds, loadingCasts, loadingContestants, onClose, onChooseCast, onToggleContestant, onSelectAll, onSelectNone, onAddSelected }) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) onChooseCast(firstCastId);
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    return <button type="button" onClick={() => onChooseCast(cast.id)} className={`w-full rounded-2xl px-4 py-3 text-left font-black ${modalCastId === cast.id ? "bg-orange-700 text-white" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}><div>{cast.name}</div><div className="text-xs font-bold opacity-70">{cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}</div></button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
          <div><h2 className="text-3xl font-black text-white">Add Cast Members</h2><p className="text-sm text-zinc-400">Pick from custom casts or favorited official casts.</p></div>
          <button onClick={onClose} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Close</button>
        </div>
        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-zinc-800 p-4">
            {loadingCasts ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-300">Loading casts...</div> : casts.length === 0 ? <div className="rounded-2xl border border-red-300/40 bg-red-500/15 p-4 text-red-100">No casts available yet.</div> : <>
              {officialCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Favorite Official Casts</div><div className="space-y-2">{officialCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
              {customCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Custom Casts</div><div className="space-y-2">{customCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
            </>}
          </div>
          <div className="overflow-auto p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-2xl font-black text-white">Contestants</h3><p className="text-sm text-zinc-400">{modalSelectedIds.size} selected</p></div><div className="flex flex-wrap gap-2"><button onClick={onSelectAll} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select All</button><button onClick={onSelectNone} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select None</button><button onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl bg-orange-700 px-4 py-2 font-black text-white hover:bg-orange-600 disabled:opacity-40">Add Selected</button></div></div>
            {loadingContestants ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">Loading contestants...</div> : modalContestants.length === 0 ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">No contestants found for this cast.</div> : <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">{modalContestants.map((person) => { const active = modalSelectedIds.has(person.id); return <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative aspect-square overflow-hidden rounded-2xl border ${active ? "border-white ring-2 ring-white/60" : "border-zinc-700 opacity-45 grayscale"}`}>{person.image_url ? <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} /> : <div className="grid h-full w-full place-items-center bg-zinc-800 p-1 text-center text-xs font-black text-zinc-400">No Image</div>}<div className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1 py-1 text-center text-xs font-black text-white">{person.name}</div></button>; })}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedneckIslandSimulator() {
  const router = useRouter();
  const [availableCasts, setAvailableCasts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [screen, setScreen] = useState("menu");
  const [separateSides, setSeparateSides] = useState(false);
  const [sideALabel, setSideALabel] = useState("Side A");
  const [sideBLabel, setSideBLabel] = useState("Side B");
  const [customTeams, setCustomTeams] = useState(false);
  const [finaleTeams, setFinaleTeams] = useState(2);
  const [enabledColors, setEnabledColors] = useState(COLORS.map((c) => c.name));
  const [teams, setTeams] = useState([]);
  const [rankedTeams, setRankedTeams] = useState([]);
  const [winningTeam, setWinningTeam] = useState(null);
  const [lastPlaceTeam, setLastPlaceTeam] = useState(null);
  const [votedTeam, setVotedTeam] = useState(null);
  const [voteLog, setVoteLog] = useState([]);
  const [revealedVotes, setRevealedVotes] = useState([]);
  const [pendingElim, setPendingElim] = useState(null);
  const [elimStep, setElimStep] = useState("matchups");
  const [history, setHistory] = useState([]);
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const selectedPlayers = useMemo(() => players.filter((p) => selectedPlayerIds.includes(p.id)), [players, selectedPlayerIds]);
  const colorPool = useMemo(() => COLORS.filter((c) => enabledColors.includes(c.name)), [enabledColors]);

  function selectExactColors() {
    const activeCount = selectedPlayers.length;
    const neededTeams = Math.floor(activeCount / 2);

    const tier1 = ["Red", "Orange", "Yellow", "Blue", "Green", "Purple"];
    const tier2 = ["Pink", "Brown", "Black", "Gray", "White"];
    const tier3 = ["Salmon", "Lime", "Forest", "Cyan", "Navy", "Magenta", "Maroon", "Tan", "Gold"];
    const usedTierColors = [...tier1, ...tier2, ...tier3];
    const tier4 = COLORS.map((color) => color.name).filter((name) => !usedTierColors.includes(name));
    const tiers = [tier1, tier2, tier3, tier4];

    let selected = [];

    for (const tier of tiers) {
      if (selected.length >= neededTeams) break;
      const shuffledTier = shuffle(tier);
      const stillNeeded = neededTeams - selected.length;
      selected = [...selected, ...shuffledTier.slice(0, stillNeeded)];
    }

    setEnabledColors(selected);
  }

  useEffect(() => { loadSavedCasts(); }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }
    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);
    const { data: userCasts, error: userCastsError } = await supabase.from("casts").select("id, name, show_name, created_at, is_official").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    if (userCastsError) { alert(userCastsError.message); setLoadingCasts(false); return; }
    let officialCasts = [];
    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase.from("casts").select("id, name, show_name, created_at, is_official").in("id", favoriteOfficialCastIds).eq("is_official", true).order("name", { ascending: true });
      if (officialError) { alert(officialError.message); setLoadingCasts(false); return; }
      officialCasts = officialData || [];
    }
    setAvailableCasts([...officialCasts, ...(userCasts || [])]);
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
    const additions = selectedPeople.map((person) => ({ id: `${person.cast_id || modalCastId}-${person.id}`, name: person.name, image: person.image_url || "", side: null, customTeam: null }));
    setPlayers((current) => { const existing = new Set(current.map((p) => p.id)); const next = [...current, ...additions.filter((p) => !existing.has(p.id))]; setSelectedPlayerIds(next.map((p) => p.id)); return next; });
    setShowAddCastModal(false); setModalSelectedIds(new Set());
  }

  function record(stage, data = {}) { setHistory((current) => [...current, { stage, ...data }]); }
  function resetRoundState() { setRankedTeams([]); setWinningTeam(null); setLastPlaceTeam(null); setVotedTeam(null); setVoteLog([]); setRevealedVotes([]); setPendingElim(null); setElimStep("matchups"); }
  function togglePlayer(id) { setSelectedPlayerIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]); }
  function setSide(id, side) { setPlayers((current) => current.map((p) => p.id === id ? { ...p, side } : p)); }
  function setCustomTeam(id, customTeam) { setPlayers((current) => current.map((p) => p.id === id ? { ...p, customTeam: Number(customTeam) || null } : p)); }
  function toggleColor(name) { setEnabledColors((current) => current.includes(name) ? current.filter((x) => x !== name) : [...current, name]); }

  function autoAssignSides() {
    let countA = selectedPlayers.filter((p) => p.side === "A").length;
    let countB = selectedPlayers.filter((p) => p.side === "B").length;
    const updates = new Map();
    shuffle(selectedPlayers.filter((p) => p.side !== "A" && p.side !== "B")).forEach((p) => {
      let side = countA <= countB ? "A" : "B";
      if (side === "A") countA++; else countB++;
      updates.set(p.id, side);
    });
    const next = players.map((p) => updates.has(p.id) ? { ...p, side: updates.get(p.id) } : p);
    setPlayers(next);
    return next.filter((p) => selectedPlayerIds.includes(p.id));
  }

  function startCastScreen() { if (selectedPlayers.length < 4) { alert("Add and select at least 4 players."); return; } if (separateSides) autoAssignSides(); setScreen("cast"); record("cast", { players: selectedPlayers, separateSides, sideALabel, sideBLabel, customTeams, finaleTeams }); }

  function createTeams() {
    let active = separateSides ? autoAssignSides() : selectedPlayers;
    const colors = shuffle(colorPool.length ? colorPool : COLORS);
    let index = 0;
    const newTeams = [];
    if (customTeams) {
      for (let n = 1; n <= 20; n++) {
        const group = active.filter((p) => p.customTeam === n);
        if (group.length >= 2 && colors[index]) newTeams.push({ id: makeId(), players: shuffle(group).slice(0, 2), color: colors[index++] });
      }
    } else if (separateSides) {
      const a = shuffle(active.filter((p) => p.side === "A"));
      const b = shuffle(active.filter((p) => p.side === "B"));
      const count = Math.min(a.length, b.length, colors.length);
      for (let i = 0; i < count; i++) newTeams.push({ id: makeId(), players: [a[i], b[i]], color: colors[index++] });
    } else {
      const s = shuffle(active);
      const count = Math.min(Math.floor(s.length / 2), colors.length);
      for (let i = 0; i < count * 2; i += 2) newTeams.push({ id: makeId(), players: [s[i], s[i + 1]], color: colors[index++] });
    }
    setTeams(newTeams); setScreen("teams"); record("teams", { teams: newTeams, sideALabel, sideBLabel });
  }

  function runChallenge() {
    const ranked = shuffle(teams);
    const winner = ranked[0];
    const last = ranked[ranked.length - 1];
    setRankedTeams(ranked); setWinningTeam(winner); setLastPlaceTeam(last);
    setScreen("challenge"); record("challenge", { teams, rankedTeams: ranked, winningTeam: winner, lastPlaceTeam: last, finaleTeams, sideALabel, sideBLabel });
  }

  function runVote() {
    const activePlayers = teams.flatMap((t) => t.players);
    const eligible = teams.filter((t) => t.id !== winningTeam.id && t.id !== lastPlaceTeam.id);
    function makeVotes(voters, options) { return voters.map((voter, index) => { const voterTeam = teams.find((t) => t.players.some((p) => p.id === voter.id)); const opts = options.filter((t) => !voterTeam || t.id !== voterTeam.id); return { voter, team: pick(opts.length ? opts : options), index }; }); }
    let votes = makeVotes(activePlayers, eligible);
    const counts = {}; votes.forEach((v) => counts[v.team.id] = (counts[v.team.id] || 0) + 1);
    const max = Math.max(...Object.values(counts));
    const tied = eligible.filter((t) => counts[t.id] === max);
    let chosen = tied[0]; let note = tied.length > 1 ? "Tie vote. Revote triggered behind the scenes." : "Most votes.";
    if (tied.length > 1) {
      votes = makeVotes(activePlayers, tied);
      const rv = {}; votes.forEach((v) => rv[v.team.id] = (rv[v.team.id] || 0) + 1);
      const rMax = Math.max(...Object.values(rv)); const still = tied.filter((t) => rv[t.id] === rMax);
      chosen = pick(still); note = still.length > 1 ? "Second tie. Random draw between tied teams." : "Revote decided it.";
    }
    const finalVotes = votes.map((v, index) => ({ ...v, index, finalChosen: chosen, note }));
    setVoteLog(finalVotes); setRevealedVotes([]); setVotedTeam(chosen); setScreen("vote"); record("vote", { teams, rankedTeams, winningTeam, lastPlaceTeam, votedTeam: chosen, voteLog: finalVotes, sideALabel, sideBLabel });
  }

  function runEliminationWithTeams(teamOne, teamTwo) {
    const pairings = separateSides && teamOne.players.some((p) => p.side === "A") && teamTwo.players.some((p) => p.side === "A")
      ? [[teamOne.players.find((p) => p.side === "A"), teamTwo.players.find((p) => p.side === "A")], [teamOne.players.find((p) => p.side === "B"), teamTwo.players.find((p) => p.side === "B")]]
      : [[...shuffle(teamOne.players)][0], [...shuffle(teamTwo.players)][0]] && (() => { const a = shuffle(teamOne.players); const b = shuffle(teamTwo.players); return [[a[0], b[0]], [a[1], b[1]]]; })();
    const winners = pairings.map(([p1, p2]) => pick([p1, p2]));
    const eliminated = pairings.map(([p1, p2], i) => winners[i]?.id === p1?.id ? p2 : p1);
    const sameTeam = (teamOne.players.some((p) => p.id === winners[0]?.id) && teamOne.players.some((p) => p.id === winners[1]?.id)) || (teamTwo.players.some((p) => p.id === winners[0]?.id) && teamTwo.players.some((p) => p.id === winners[1]?.id));
    const newTeam = { id: makeId(), players: winners, color: sameTeam ? (teamOne.players.some((p) => p.id === winners[0]?.id) ? teamOne.color : teamTwo.color) : pick(shuffle([teamOne.color, teamTwo.color])) };
    const separatePreviewTeams = winners.map((winner) => ({ id: makeId(), players: [winner], color: teamOne.players.some((p) => p.id === winner?.id) ? teamOne.color : teamTwo.color }));
    const updated = [...teams.filter((t) => t.id !== teamOne.id && t.id !== teamTwo.id), newTeam];
    const result = { pairings, winners, eliminated, newTeam, separatePreviewTeams, updated, teamOne, teamTwo, finalist: teams.length === 2 };
    setPendingElim(result); setElimStep("matchups"); setScreen("elim"); record("elim", { teams, elimStep: "matchups", elimResult: result, sideALabel, sideBLabel });
  }
  function runElimination() { runEliminationWithTeams(lastPlaceTeam, votedTeam); }
  function runThreeTeamElimination() { const eliminationTeams = teams.filter((t) => t.id !== winningTeam.id); runEliminationWithTeams(eliminationTeams[0], eliminationTeams[1]); }

  function advanceElimStep() {
    if (!pendingElim) return;
    const order = ["matchups", "matchup1", "result1", "matchup2", "result2", "winnersSeparate", "combined"];
    const next = order[order.indexOf(elimStep) + 1];
    if (next) { setElimStep(next); record("elim", { teams, elimStep: next, elimResult: pendingElim, sideALabel, sideBLabel }); return; }
    setTeams(pendingElim.updated);
    if (pendingElim.updated.length === 1) { setScreen("winner"); record("winner", { teams: pendingElim.updated, winner: pendingElim.updated[0], sideALabel, sideBLabel }); }
    else { resetRoundState(); setScreen("teams"); record("teams", { teams: pendingElim.updated, sideALabel, sideBLabel }); }
  }

  function getPlayerTeamColor(playerId) { return teams.find((t) => t.players.some((p) => p.id === playerId))?.color?.hex || "#f8f8f8"; }
  function teamPlacement(teamId) { const index = rankedTeams.findIndex((t) => t.id === teamId); return index === -1 ? null : index + 1; }
  function currentVoteCounts() { const counts = {}; voteLog.forEach((v) => { if (revealedVotes.includes(v.index)) counts[v.team.id] = (counts[v.team.id] || 0) + 1; }); return counts; }

  function orderedVoteLogByChallengeRank() {
    return [...voteLog].sort((a, b) => {
      const teamA = teams.find((team) => team.players.some((player) => player.id === a.voter.id));
      const teamB = teams.find((team) => team.players.some((player) => player.id === b.voter.id));
      const placeA = teamPlacement(teamA?.id) || 999;
      const placeB = teamPlacement(teamB?.id) || 999;
      return placeA - placeB;
    });
  }

  function teamPlacementBadge(team) {
    if (!team || !winningTeam || !lastPlaceTeam) return null;

    if (team.id === winningTeam.id) {
      return (
        <div className="mt-2 rounded-full bg-green-500 px-3 py-1 text-xs font-black uppercase text-black">
          Immune
        </div>
      );
    }

    if (team.id === lastPlaceTeam.id) {
      return (
        <div className="mt-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">
          Last Place
        </div>
      );
    }

    return null;
  }

  function isFinaleChallenge() { return rankedTeams.length > 0 && rankedTeams.length <= finaleTeams; }
  function revealAllVotes() { setRevealedVotes(voteLog.map((v) => v.index)); }
  function renderMatchup(index, showResult) {
    if (!pendingElim) return null;
    const pair = (pendingElim.pairings[index] || []).filter(Boolean);
    const winner = pendingElim.winners[index];
    const loser = pendingElim.eliminated[index];

    return (
      <div className="my-5 flex flex-wrap items-start justify-center gap-4 sm:gap-8">
        {pair.map((p) => (
          <div key={p.id} className="flex w-36 flex-col items-center sm:w-44">
            <div className={showResult && p.id === loser?.id ? "opacity-55 grayscale" : ""}>
              <PlayerCard
                player={p}
                large
                teamColor={getPlayerTeamColor(p.id)}
                sideALabel={sideALabel}
                sideBLabel={sideBLabel}
              />
            </div>
            {showResult && p.id === winner?.id ? (
              <div className="mt-2 w-full rounded-full bg-green-500 px-3 py-1 text-center font-black text-black">Winner</div>
            ) : null}
            {showResult && p.id === loser?.id ? (
              <div className="mt-2 w-full rounded-full bg-red-600 px-3 py-1 text-center font-black text-white">Eliminated</div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  async function saveSeason() {
    const winner = teams[0]; if (!winner) return;
    setSavingSeason(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { alert("You must be logged in."); setSavingSeason(false); return; }
    const { data, error } = await supabase.from("saved_seasons").insert({ user_id: userData.user.id, simulator_type: "redneck-island", title: seasonTitle.trim() || "Redneck Island Season", summary: seasonSummary.trim() || `${winner.color.name} Team won Redneck Island.`, is_public: isPublicSeason, allow_comments: true, data_json: { simulator_type: "redneck-island", startingCast: selectedPlayers, history, winner, finalTeams: teams, settings: { separateSides, sideALabel, sideBLabel, customTeams, finaleTeams } } }).select().single();
    setSavingSeason(false); if (error) { alert(error.message); return; } router.push(`/seasons/${data.id}`);
  }

  return <main className="min-h-screen bg-[#151515] text-white"><Navbar /><section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6"><Card className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-4xl font-black sm:text-5xl">Redneck Island</h1><p className="mt-2 text-zinc-400">Random duo teams, challenges, votes, eliminations, and finale winners.</p></div>{screen !== "menu" ? <button onClick={() => { setScreen("menu"); setTeams([]); setHistory([]); resetRoundState(); }} className="rounded-2xl border border-zinc-700 px-5 py-3 font-black hover:bg-white/10">Main Menu</button> : null}</div></Card>

  {screen === "menu" && <div className="space-y-5"><Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-3xl font-black">Cast</h2><p className="text-zinc-400">{selectedPlayers.length} selected / {players.length} added</p></div><div className="flex flex-wrap gap-2"><button onClick={openAddCastModal} className="rounded-2xl bg-orange-700 px-5 py-3 font-black hover:bg-orange-600">Add Cast Members</button><button onClick={() => setSelectedPlayerIds(players.map((p) => p.id))} className="rounded-2xl bg-zinc-800 px-4 py-3 font-black hover:bg-zinc-700">Select All</button><button onClick={() => setSelectedPlayerIds([])} className="rounded-2xl bg-zinc-800 px-4 py-3 font-black hover:bg-zinc-700">Select None</button><button onClick={() => { setPlayers([]); setSelectedPlayerIds([]); }} className="rounded-2xl bg-red-900 px-4 py-3 font-black hover:bg-red-800">Clear</button><Link href="/custom-casts" className="rounded-2xl border border-zinc-700 px-4 py-3 font-black hover:bg-white/10">Manage Casts</Link></div></div>{players.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-400">No cast members added yet.</div> : <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">{players.map((p) => <button type="button" key={p.id} onClick={() => togglePlayer(p.id)} className={`rounded-2xl border border-white/10 bg-black/20 p-1.5 ${selectedPlayerIds.includes(p.id) ? "opacity-100" : "opacity-35 grayscale"}`}><div className="aspect-square overflow-hidden rounded-xl"><img src={p.image || fallbackAvatar(p.name)} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = fallbackAvatar(p.name))}/></div><div className="mt-1 truncate text-[10px] font-black">{p.name}</div></button>)}</div>}</Card>
  <div className="grid gap-5 lg:grid-cols-2"><Card className="space-y-4 p-5"><h2 className="text-2xl font-black">Settings</h2><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={separateSides} onChange={(e) => setSeparateSides(e.target.checked)} /> Separate sides mode</label>{separateSides && <div className="grid gap-3 sm:grid-cols-2"><input value={sideALabel} onChange={(e) => setSideALabel(e.target.value)} className="rounded-xl bg-zinc-900 px-4 py-3"/><input value={sideBLabel} onChange={(e) => setSideBLabel(e.target.value)} className="rounded-xl bg-zinc-900 px-4 py-3"/></div>}<label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={customTeams} onChange={(e) => setCustomTeams(e.target.checked)} /> Custom duo teams before start</label><label className="font-bold">Finale Teams <input type="number" min={2} max={10} value={finaleTeams} onChange={(e) => setFinaleTeams(Math.max(2, Number(e.target.value) || 2))} className="ml-3 w-24 rounded-xl bg-zinc-900 px-4 py-3" /></label>{separateSides && <div><h3 className="mb-2 font-black">Assign Sides</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{selectedPlayers.map((p) => <div key={p.id} className="rounded-xl bg-zinc-900 p-2"><div className="truncate text-sm font-bold">{p.name}</div><div className="mt-2 flex gap-1"><button onClick={() => setSide(p.id, "A")} className={`rounded-lg px-2 py-1 text-xs font-bold ${p.side === "A" ? "bg-green-500 text-black" : "bg-zinc-800"}`}>{sideALabel}</button><button onClick={() => setSide(p.id, "B")} className={`rounded-lg px-2 py-1 text-xs font-bold ${p.side === "B" ? "bg-green-500 text-black" : "bg-zinc-800"}`}>{sideBLabel}</button></div></div>)}</div></div>}{customTeams && <div><h3 className="mb-2 font-black">Custom Teams</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{selectedPlayers.map((p) => <div key={p.id} className="rounded-xl bg-zinc-900 p-2"><div className="truncate text-sm font-bold">{p.name}</div><select value={p.customTeam || ""} onChange={(e) => setCustomTeam(p.id, e.target.value)} className="mt-2 w-full rounded-lg bg-black p-2"><option value="">None</option>{Array.from({length:20},(_,i)=>i+1).map((n)=><option key={n} value={n}>Team {n}</option>)}</select></div>)}</div></div>}<button onClick={startCastScreen} disabled={selectedPlayers.length < 4} className="w-full rounded-2xl bg-orange-700 px-6 py-4 text-lg font-black hover:bg-orange-600 disabled:opacity-40">Start</button></Card><Card className="p-5"><h2 className="mb-3 text-2xl font-black">Team Colors</h2><div className="mb-3 flex flex-wrap gap-2"><button onClick={() => setEnabledColors(COLORS.map((c) => c.name))} className="rounded-xl bg-zinc-800 px-3 py-2 font-bold">Select All</button><button onClick={() => setEnabledColors([])} className="rounded-xl bg-zinc-800 px-3 py-2 font-bold">Select None</button><button onClick={selectExactColors} className="rounded-xl bg-green-900 px-3 py-2 font-bold text-white hover:bg-green-800">Exact</button></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{COLORS.map((c) => <button key={c.name} onClick={() => toggleColor(c.name)} className={`rounded-xl border-2 p-2 text-sm font-black ${enabledColors.includes(c.name) ? "opacity-100" : "opacity-25 grayscale"}`} style={{ background: c.hex, color: textForBg(c.hex) }}>{c.name}</button>)}</div></Card></div></div>}

  {screen === "cast" && <Card className="p-5"><h2 className="mb-4 text-3xl font-black">Cast</h2>{!separateSides ? <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">{selectedPlayers.map((p) => <PlayerCard key={p.id} player={p}/>)}</div> : <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-zinc-900 p-4"><h3 className="mb-3 text-2xl font-black">{sideALabel}</h3><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{players.filter((p) => selectedPlayerIds.includes(p.id) && p.side === "A").map((p) => <PlayerCard key={p.id} player={p}/>)}</div></div><div className="rounded-2xl bg-zinc-900 p-4"><h3 className="mb-3 text-2xl font-black">{sideBLabel}</h3><div className="grid grid-cols-3 gap-3 sm:grid-cols-5">{players.filter((p) => selectedPlayerIds.includes(p.id) && p.side === "B").map((p) => <PlayerCard key={p.id} player={p}/>)}</div></div></div>}<button onClick={createTeams} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Split Into Teams</button></Card>}

  {screen === "teams" && <Card className="p-5"><h2 className="mb-4 text-3xl font-black">{teams.length === 2 ? "Final 2 Teams" : "Current Teams"}</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{teams.map((t) => <TeamMini key={t.id} team={t} sideALabel={sideALabel} sideBLabel={sideBLabel}/>)}</div><button onClick={runChallenge} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Run Challenge</button></Card>}

  {screen === "challenge" && <Card className="p-5"><h2 className="mb-3 text-3xl font-black">{teams.length <= finaleTeams ? "Finale Challenge Results" : "Challenge Results"}</h2>{rankedTeams.length === 3 && rankedTeams.length > finaleTeams ? <div className="mb-4 font-black text-yellow-300">Final 3 teams: winners are safe. The other teams go straight to elimination.</div> : null}<div className="space-y-4">{rankedTeams.map((t,i)=><div key={t.id} className="rounded-3xl border-4 p-3" style={{background:t.color.hex,color:textForBg(t.color.hex),borderColor:darken(t.color.hex)}}><div className="flex flex-wrap items-center justify-center gap-4"><span className="text-2xl font-black">#{i+1}</span><TeamMini team={t} sideALabel={sideALabel} sideBLabel={sideBLabel} compact/>{i===0 && <b className="rounded-full bg-green-500 px-3 py-1 text-black">{teams.length <= finaleTeams ? "Winners" : "Immune"}</b>}{i===rankedTeams.length-1 && teams.length > finaleTeams && rankedTeams.length > 3 && <b className="rounded-full bg-red-600 px-3 py-1 text-white">Last Place</b>}</div></div>)}</div>{teams.length <= finaleTeams ? <button onClick={() => { setTeams([rankedTeams[0]]); setScreen("winner"); record("winner", { teams:[rankedTeams[0]], winner: rankedTeams[0], sideALabel, sideBLabel }); }} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Crown Winners</button> : rankedTeams.length === 3 ? <button onClick={runThreeTeamElimination} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Advance To Elimination</button> : <button onClick={runVote} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Advance To Vote</button>}</Card>}

  {screen === "vote" && <Card className="p-5"><h2 className="text-3xl font-black">House Vote</h2><p className="mt-2 text-zinc-400">{voteLog[0]?.note}</p><div className="my-4 flex flex-wrap justify-center gap-2">{rankedTeams.filter((t) => winningTeam && lastPlaceTeam && t.id !== winningTeam.id && t.id !== lastPlaceTeam.id).map((t) => <div key={t.id} className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 font-black"><span className="mr-2 inline-block h-5 w-5 rounded" style={{ background: t.color.hex }} />#{teamPlacement(t.id)} • {currentVoteCounts()[t.id] || 0}</div>)}</div><button onClick={revealAllVotes} className="mb-5 rounded-xl bg-zinc-800 px-4 py-2 font-black hover:bg-zinc-700">Reveal All Votes</button><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{orderedVoteLogByChallengeRank().map((v) => { const shown = revealedVotes.includes(v.index); const voterTeam = teams.find((t) => t.players.some((p) => p.id === v.voter.id)); return <div key={v.index} className="rounded-2xl border-4 p-3 text-center" style={{background:voterTeam?.color.hex,color:textForBg(voterTeam?.color.hex),borderColor:darken(voterTeam?.color.hex)}}><div className="font-black">#{teamPlacement(voterTeam?.id) || ""}</div>{teamPlacementBadge(voterTeam)}<div className="mt-2 flex justify-center"><PlayerCard player={v.voter} small teamColor={voterTeam?.color.hex}/></div>{!shown ? <><div className="my-3 rounded-xl bg-black/70 p-3 text-white">Vote Hidden</div><button onClick={() => setRevealedVotes((cur) => cur.includes(v.index) ? cur : [...cur, v.index])} className="rounded-xl bg-white px-3 py-2 font-black text-black">Reveal Vote</button></> : <div className="mt-3 rounded-xl border-4 p-3" style={{background:v.team.color.hex,color:textForBg(v.team.color.hex),borderColor:darken(v.team.color.hex)}}><b>Voted For</b><CompactVoteTeam team={v.team} /></div>}</div>; })}</div>{revealedVotes.length === voteLog.length && <div className="mt-5"><h3 className="mb-3 text-2xl font-black">Team Voted Into Elimination</h3><TeamMini team={votedTeam} sideALabel={sideALabel} sideBLabel={sideBLabel}/><button onClick={runElimination} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Advance To Elimination</button></div>}</Card>}

  {screen === "elim" && pendingElim && <Card className="p-5"><h2 className="mb-4 text-3xl font-black">{pendingElim.finalist ? "Finale Elimination" : "Elimination"}</h2>{elimStep === "matchups" && <><h3 className="text-2xl font-black">Matchups</h3>{renderMatchup(0,false)}{renderMatchup(1,false)}</>}{elimStep === "matchup1" && <><h3 className="text-2xl font-black">Matchup 1</h3>{renderMatchup(0,false)}</>}{elimStep === "result1" && <><h3 className="text-2xl font-black">Matchup 1 Result</h3>{renderMatchup(0,true)}</>}{elimStep === "matchup2" && <><h3 className="text-2xl font-black">Matchup 2</h3>{renderMatchup(1,false)}</>}{elimStep === "result2" && <><h3 className="text-2xl font-black">Matchup 2 Result</h3>{renderMatchup(1,true)}</>}{elimStep === "winnersSeparate" && <><h3 className="text-2xl font-black">Winners Before Combining</h3><div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">{pendingElim.separatePreviewTeams.map((t) => <TeamMini key={t.id} team={t} sideALabel={sideALabel} sideBLabel={sideBLabel}/>)}</div></>}{elimStep === "combined" && <><h3 className="text-2xl font-black">New Combined Team</h3><div className="mx-auto max-w-md"><TeamMini team={pendingElim.newTeam} sideALabel={sideALabel} sideBLabel={sideBLabel}/></div></>}<button onClick={advanceElimStep} className="mt-5 rounded-2xl bg-orange-700 px-8 py-4 text-lg font-black hover:bg-orange-600">Advance</button></Card>}

  {screen === "winner" && teams[0] && <Card className="border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-zinc-950 p-6 text-center"><h2 className="mb-4 text-4xl font-black text-yellow-300">Winning Team</h2><TeamMini team={teams[0]} sideALabel={sideALabel} sideBLabel={sideBLabel}/><div className="mx-auto mt-6 max-w-xl space-y-3 text-left"><input value={seasonTitle} onChange={(e)=>setSeasonTitle(e.target.value)} placeholder="Season title" className="w-full rounded-xl bg-zinc-900 px-4 py-3"/><textarea value={seasonSummary} onChange={(e)=>setSeasonSummary(e.target.value)} placeholder="Season summary" rows={3} className="w-full rounded-xl bg-zinc-900 px-4 py-3"/><label className="flex gap-2 font-bold"><input type="checkbox" checked={isPublicSeason} onChange={(e)=>setIsPublicSeason(e.target.checked)}/> Post publicly</label><button onClick={saveSeason} disabled={savingSeason} className="w-full rounded-2xl bg-yellow-500 px-5 py-3 font-black text-black disabled:opacity-40">{savingSeason ? "Saving..." : "Save Season"}</button></div></Card>}

  {showAddCastModal && <AddCastMembersModal casts={availableCasts} modalCastId={modalCastId} modalContestants={modalContestants} modalSelectedIds={modalSelectedIds} loadingCasts={loadingCasts} loadingContestants={loadingModalContestants} onClose={()=>setShowAddCastModal(false)} onChooseCast={loadContestantsForModal} onToggleContestant={(id)=>setModalSelectedIds((prev)=>{const next=new Set(prev); next.has(id)?next.delete(id):next.add(id); return next;})} onSelectAll={()=>setModalSelectedIds(new Set(modalContestants.map((p)=>p.id)))} onSelectNone={()=>setModalSelectedIds(new Set())} onAddSelected={addSelectedContestantsToRoster}/>} </section></main>;
}
