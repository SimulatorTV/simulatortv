// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const GRID_COLUMNS = 6;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(array, count, excludedIds = []) {
  const excluded = new Set(excludedIds);
  const pool = array.filter((item) => !excluded.has(item.id));
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

function weightedShuffle(array, getWeight) {
  return [...array]
    .map((item) => {
      const weight = Math.max(0.01, getWeight(item));
      const key = Math.pow(Math.random(), 1 / weight);
      return { item, key };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.item);
}

function getArenaColumns(count) {
  if (count <= 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2 md:grid-cols-4";
  return "grid-cols-3";
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
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
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) onChooseCast(firstCastId);
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    return (
      <button
        type="button"
        onClick={() => onChooseCast(cast.id)}
        className={`w-full rounded-2xl px-4 py-3 text-left font-black border-0 ${
          modalCastId === cast.id
            ? "bg-red-600 text-white"
            : "bg-zinc-950 text-white hover:bg-zinc-900"
        }`}
      >
        <div>{cast.name}</div>
        <div className="text-xs font-bold opacity-70">
          {cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}
        </div>
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

          <button type="button" onClick={onClose} className="rounded-2xl bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-white/10 p-4">
            {loadingCasts ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-rose-100">No casts available yet.</div>
            ) : (
              <>
                {officialCasts.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Favorite Official Casts</div>
                    <div className="space-y-2">{officialCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div>
                  </div>
                )}

                {customCasts.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Custom Casts</div>
                    <div className="space-y-2">{customCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="overflow-auto p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-sm text-zinc-300">{modalSelectedIds.size} selected</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onSelectAll} className="rounded-2xl bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select All</button>
                <button type="button" onClick={onSelectNone} className="rounded-2xl bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select None</button>
                <button type="button" onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl bg-red-600 px-4 py-2 font-black text-white hover:bg-red-500 disabled:opacity-40">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onToggleContestant(person.id)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border ${
                        active ? "border-red-300 ring-2 ring-red-300/60" : "border-white/10 opacity-45 grayscale"
                      }`}
                    >
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-zinc-900 p-1 text-center text-xs font-black text-zinc-400">No Image</div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1 py-1 text-center text-xs font-black text-white">
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

function PlayerCard({ player, status = "normal", compact = false, winner = false, labelOverride = null, selectable = false, selected = true, onClick = null }) {
  const statusClasses = {
    normal: "bg-white border-zinc-400",
    challenge: "bg-emerald-500 border-red-300 shadow-[0_0_18px_rgba(16,185,129,0.55)]",
    danger: "bg-red-500 border-red-300 shadow-[0_0_18px_rgba(239,68,68,0.5)]",
    eliminated: "bg-black border-zinc-800",
    winner: "bg-yellow-400 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.65)]",
    disabled: "bg-zinc-300 border-zinc-500 opacity-60",
  };

  let currentStatus = winner ? "winner" : status;
  if (selectable && !selected) currentStatus = "disabled";

  const nameColorClass = currentStatus === "eliminated" ? "text-white" : "text-black";
  const sizeClass = compact ? "p-1 sm:p-1.5 md:p-2" : "p-2 sm:p-3";
  const image = getImage(player);

  return (
    <button type="button" onClick={onClick || undefined} className={`w-full overflow-hidden rounded-2xl border-4 ${statusClasses[currentStatus]} ${sizeClass} text-left transition-all duration-300 ${selectable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}`} disabled={!onClick}>
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        {image ? (
          <img src={image} alt={labelOverride ?? player.name} className={`h-full w-full object-cover ${currentStatus === "eliminated" ? "grayscale" : ""}`} />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-black text-zinc-400">No Image</div>
        )}
      </div>
      <div className={`mt-1 sm:mt-2 text-center font-bold leading-tight ${compact ? "text-[8px] sm:text-[10px] md:text-sm" : "text-xs sm:text-sm md:text-base"} ${nameColorClass}`}>
        {labelOverride ?? player.name}
      </div>
    </button>
  );
}

export default function TeamBattleSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [vengeanceMode, setVengeanceMode] = useState(false);
  const [started, setStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [eliminationHistory, setEliminationHistory] = useState([]);
  const [screen, setScreen] = useState("setup");
  const [phase, setPhase] = useState("idle");
  const [challengeWinnerId, setChallengeWinnerId] = useState(null);
  const [nomineeIds, setNomineeIds] = useState([]);
  const [currentDuelIds, setCurrentDuelIds] = useState([]);
  const [safeIds, setSafeIds] = useState([]);
  const [pendingEliminationId, setPendingEliminationId] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [log, setLog] = useState(["Add cast members, then press Start Game."]);
  const [grudgeMap, setGrudgeMap] = useState({});
  const [winnerNominationMap, setWinnerNominationMap] = useState({});
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const eliminatedIds = eliminationHistory.map((entry) => entry.id);
  const activePlayers = players.filter((player) => !eliminatedIds.includes(player.id));
  const effectiveActivePlayers = pendingEliminationId ? activePlayers.filter((player) => player.id !== pendingEliminationId) : activePlayers;

  useEffect(() => { loadSavedCasts(); }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official, is_full_cast")
      .eq("user_id", userData.user.id)
      .eq("is_full_cast", false)
      .order("created_at", { ascending: false });

    if (userCastsError) { alert(userCastsError.message); setLoadingCasts(false); return; }

    let officialCasts = [];
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

  async function loadContestantsForModal(castId) {
    setModalCastId(castId);
    setModalSelectedIds(new Set());
    setLoadingModalContestants(true);
    const { data, error } = await supabase.from("contestants").select("id, name, image_url, cast_id").eq("cast_id", castId).order("created_at", { ascending: true });
    if (error) { alert(error.message); setLoadingModalContestants(false); return; }
    setModalContestants(data || []);
    setLoadingModalContestants(false);
  }

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));
    if (selectedPeople.length === 0) return;
    const additions = selectedPeople.map((person) => ({ id: `${person.cast_id || modalCastId}-${person.id}`, name: person.name, image: person.image_url || "" }));
    setPlayers((current) => {
      const existing = new Set(current.map((player) => player.id));
      return [...current, ...additions.filter((person) => !existing.has(person.id))];
    });
    setStarted(false);
    setScreen("setup");
    setPhase("idle");
    setEliminationHistory([]);
    setChallengeWinnerId(null);
    setNomineeIds([]);
    setCurrentDuelIds([]);
    setSafeIds([]);
    setPendingEliminationId(null);
    setWinnerId(null);
    setRoundNumber(1);
    setGrudgeMap({});
    setWinnerNominationMap({});
    setLog(["Roster updated. Press Start Game when ready."]);
    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function removePlayer(id) { if (!started) setPlayers((old) => old.filter((p) => p.id !== id)); }
  function clearRoster() { if (!confirm("Clear Team Battle roster?")) return; setPlayers([]); setEliminationHistory([]); setLog(["Add cast members, then press Start Game."]); }
  const appendLog = (text) => setLog((prev) => [text, ...prev]);
  const clearRoundVisuals = () => { setChallengeWinnerId(null); setNomineeIds([]); setCurrentDuelIds([]); setSafeIds([]); setPendingEliminationId(null); };
  const getGrudgeScore = (winnerIdValue, candidateId) => grudgeMap?.[winnerIdValue]?.[candidateId] ?? 0;
  const getRepeatTargetScore = (winnerIdValue, candidateId) => winnerNominationMap?.[winnerIdValue]?.[candidateId] ?? 0;

  const pickNomineesWithBias = (pool, count, excludedIds = [], winnerIdValue = null) => {
    const excluded = new Set(excludedIds);
    const candidates = pool.filter((player) => !excluded.has(player.id));
    if (!vengeanceMode || !winnerIdValue) return shuffle(candidates).slice(0, Math.min(count, candidates.length));
    const ordered = weightedShuffle(candidates, (candidate) => 1 + getGrudgeScore(winnerIdValue, candidate.id) * 0.22 + getRepeatTargetScore(winnerIdValue, candidate.id) * 0.12);
    return ordered.slice(0, Math.min(count, ordered.length));
  };

  const applyNominationConsequences = (winnerIdValue, nominees) => {
    if (!winnerIdValue || nominees.length === 0 || !vengeanceMode) return;
    setGrudgeMap((prev) => {
      const next = { ...prev };
      nominees.forEach((nominee) => { next[nominee.id] = { ...(next[nominee.id] || {}) }; next[nominee.id][winnerIdValue] = (next[nominee.id][winnerIdValue] || 0) + 1; });
      return next;
    });
    setWinnerNominationMap((prev) => {
      const next = { ...prev };
      next[winnerIdValue] = { ...(next[winnerIdValue] || {}) };
      nominees.forEach((nominee) => { next[winnerIdValue][nominee.id] = (next[winnerIdValue][nominee.id] || 0) + 1; });
      return next;
    });
  };

  const startGame = () => {
    if (players.length < 2) return;
    const shuffled = shuffle(players);
    setPlayers(shuffled);
    setEliminationHistory([]);
    setStarted(true);
    setScreen("grid");
    setPhase("chooseChallengeWinner");
    setChallengeWinnerId(null); setNomineeIds([]); setCurrentDuelIds([]); setSafeIds([]); setPendingEliminationId(null); setWinnerId(null);
    setRoundNumber(1); setGrudgeMap({}); setWinnerNominationMap({});
    setLog([`Game started with ${shuffled.length} players.${vengeanceMode ? " Vengeance mode is ON." : " Vengeance mode is OFF."}`]);
  };

  const resetGame = () => {
    setStarted(false); setEliminationHistory([]); setScreen("setup"); setPhase("idle"); setChallengeWinnerId(null); setNomineeIds([]); setCurrentDuelIds([]); setSafeIds([]); setPendingEliminationId(null); setWinnerId(null); setRoundNumber(1); setGrudgeMap({}); setWinnerNominationMap({}); setSeasonTitle(""); setSeasonSummary(""); setIsPublicSeason(true); setLog(["Press Start Game to run it again, or change the roster first."]);
  };

  const finalizeElimination = (playerId, placementNumber) => { if (playerId) setEliminationHistory((prev) => [...prev, { id: playerId, placementNumber }]); };

  const beginEndgameWithCount = (updatedActive) => {
    clearRoundVisuals();
    setScreen("arena");
    const ids = updatedActive.map((player) => player.id);
    setCurrentDuelIds(ids); setNomineeIds(ids);
    if (updatedActive.length === 4) { setPhase("endgameFourShown"); appendLog("Final 4 elimination has started."); }
    else if (updatedActive.length === 3) { setPhase("endgameThreeShown"); appendLog("Final 3 elimination has started."); }
    else if (updatedActive.length === 2) { setPhase("endgameTwoShown"); appendLog("Final 2 showdown has started."); }
  };

  const advanceNormalRound = () => {
    if (phase === "chooseChallengeWinner") {
      clearRoundVisuals(); const chosen = pickRandom(activePlayers, 1)[0]; if (!chosen) return;
      setChallengeWinnerId(chosen.id); setPhase("selectNominees"); appendLog(`${chosen.name} won the challenge.`); return;
    }
    if (phase === "selectNominees") {
      const nomineeCount = Math.min(4, Math.max(2, activePlayers.length - 1));
      const nominees = pickNomineesWithBias(activePlayers, nomineeCount, [challengeWinnerId], challengeWinnerId);
      const ids = nominees.map((player) => player.id);
      setNomineeIds(ids); setCurrentDuelIds(ids); setSafeIds([]); applyNominationConsequences(challengeWinnerId, nominees); setPhase("showNomineesOnGrid");
      appendLog(`${players.find((player) => player.id === challengeWinnerId)?.name} selected ${nominees.map((player) => player.name).join(", ")} for elimination.`); return;
    }
    if (phase === "showNomineesOnGrid") { setScreen("arena"); if (currentDuelIds.length === 4) setPhase("arenaFourShown"); else if (currentDuelIds.length === 3) setPhase("arenaThreeShown"); else if (currentDuelIds.length === 2) setPhase("arenaTwoShown"); return; }
    if (phase === "arenaFourShown") { const survivor = pickRandom(effectiveActivePlayers.filter((player) => currentDuelIds.includes(player.id)), 1)[0]; if (!survivor) return; setSafeIds([survivor.id]); setCurrentDuelIds((prev) => prev.filter((id) => id !== survivor.id)); setPhase("arenaFourSafeShown"); appendLog(`${survivor.name} survived the first elimination draw.`); return; }
    if (phase === "arenaFourSafeShown") { setSafeIds([]); setPhase("arenaThreeShown"); return; }
    if (phase === "arenaThreeShown") { const survivor = pickRandom(effectiveActivePlayers.filter((player) => currentDuelIds.includes(player.id)), 1)[0]; if (!survivor) return; setSafeIds([survivor.id]); setCurrentDuelIds((prev) => prev.filter((id) => id !== survivor.id)); setPhase("arenaThreeSafeShown"); appendLog(`${survivor.name} survived the second elimination draw.`); return; }
    if (phase === "arenaThreeSafeShown") { setSafeIds([]); setPhase("arenaTwoShown"); return; }
    if (phase === "arenaTwoShown") { const finalists = effectiveActivePlayers.filter((player) => currentDuelIds.includes(player.id)); const survivor = pickRandom(finalists, 1)[0]; if (!survivor) return; const eliminated = finalists.find((player) => player.id !== survivor.id); if (!eliminated) return; setSafeIds([survivor.id]); setPendingEliminationId(eliminated.id); setPhase("arenaTwoSafeShown"); appendLog(`${survivor.name} survived the final showdown. ${eliminated.name} is eliminated.`); return; }
    if (phase === "arenaTwoSafeShown") { const placementNumber = activePlayers.length; finalizeElimination(pendingEliminationId, placementNumber); setScreen("grid"); setPhase("showEliminatedOnGrid"); return; }
    if (phase === "showEliminatedOnGrid") {
      const updatedActive = players.filter((player) => !eliminationHistory.some((entry) => entry.id === player.id));
      if (updatedActive.length <= 4) { clearRoundVisuals(); setScreen("grid"); setPhase("endgameStart"); setRoundNumber((prev) => prev + 1); return; }
      clearRoundVisuals(); const chosen = pickRandom(updatedActive, 1)[0]; if (!chosen) return; setChallengeWinnerId(chosen.id); setPhase("selectNominees"); setRoundNumber((prev) => prev + 1); appendLog(`${chosen.name} won the challenge.`);
    }
  };

  const advanceEndgame = () => {
    if (phase === "endgameStart") { beginEndgameWithCount(activePlayers); return; }
    if (phase === "endgameReturnGrid") { beginEndgameWithCount(players.filter((player) => currentDuelIds.includes(player.id))); return; }
    if (phase === "endgameFourShown") { const survivor = pickRandom(effectiveActivePlayers.filter((player) => currentDuelIds.includes(player.id)), 1)[0]; if (!survivor) return; setSafeIds([survivor.id]); setCurrentDuelIds((prev) => prev.filter((id) => id !== survivor.id)); setPhase("endgameFourSafeShown"); appendLog(`${survivor.name} is safe and advances.`); return; }
    if (phase === "endgameFourSafeShown") { setSafeIds([]); setPhase("endgameThreeShown"); return; }
    if (phase === "endgameThreeShown") { const survivor = pickRandom(effectiveActivePlayers.filter((player) => currentDuelIds.includes(player.id)), 1)[0]; if (!survivor) return; setSafeIds([survivor.id]); setCurrentDuelIds((prev) => prev.filter((id) => id !== survivor.id)); setPhase("endgameThreeSafeShown"); appendLog(`${survivor.name} is safe and advances.`); return; }
    if (phase === "endgameThreeSafeShown") { setSafeIds([]); setPhase("endgameTwoShown"); return; }
    if (phase === "endgameTwoShown") { const finalists = players.filter((player) => currentDuelIds.includes(player.id)); const survivor = pickRandom(finalists, 1)[0]; if (!survivor) return; const eliminated = finalists.find((player) => player.id !== survivor.id); if (!eliminated) return; setSafeIds([survivor.id]); setPendingEliminationId(eliminated.id); setPhase("endgameTwoSafeShown"); appendLog(activePlayers.length === 2 ? `${survivor.name} wins the final showdown over ${eliminated.name}.` : `${survivor.name} survives. ${eliminated.name} is eliminated.`); return; }
    if (phase === "endgameTwoSafeShown") {
      const placementNumber = activePlayers.length;
      const futureHistory = [...eliminationHistory, { id: pendingEliminationId, placementNumber }];
      setEliminationHistory(futureHistory);
      const updatedActive = players.filter((player) => !futureHistory.some((entry) => entry.id === player.id));
      if (updatedActive.length === 1) { const champion = updatedActive[0]; if (!champion) return; clearRoundVisuals(); setWinnerId(champion.id); setPhase("winnerCrowned"); setScreen("grid"); appendLog(`${champion.name} wins the game.`); return; }
      clearRoundVisuals(); setScreen("grid"); setPhase("endgameReturnGrid"); setCurrentDuelIds(updatedActive.map((player) => player.id)); return;
    }
  };

  const handleAdvance = () => {
    if (!started || phase === "winnerCrowned") return;
    const normalRoundPhases = new Set(["chooseChallengeWinner", "selectNominees", "showNomineesOnGrid", "arenaFourShown", "arenaFourSafeShown", "arenaThreeShown", "arenaThreeSafeShown", "arenaTwoShown", "arenaTwoSafeShown", "showEliminatedOnGrid"]);
    if (normalRoundPhases.has(phase)) { advanceNormalRound(); return; }
    if (phase === "endgameStart" || String(phase).startsWith("endgame")) advanceEndgame();
  };

  const getPlayerStatus = (playerId) => {
    if (winnerId === playerId) return "winner";
    if (pendingEliminationId === playerId) return "eliminated";
    if (eliminatedIds.includes(playerId)) return "eliminated";
    const resetToWhitePhases = new Set(["chooseChallengeWinner", "selectNominees", "endgameStart", "endgameReturnGrid", "idle", "showEliminatedOnGrid", "winnerCrowned"]);
    if (resetToWhitePhases.has(phase)) { if (challengeWinnerId === playerId && phase === "selectNominees") return "challenge"; return "normal"; }
    if (safeIds.includes(playerId) || challengeWinnerId === playerId) return "challenge";
    if (nomineeIds.includes(playerId) || currentDuelIds.includes(playerId)) return "danger";
    return "normal";
  };

  const titleText = !started ? "Team Battle" : winnerId ? `${players.find((player) => player.id === winnerId)?.name} wins!` : String(phase).startsWith("endgame") || phase === "endgameStart" ? `Final ${activePlayers.length}` : `Round ${roundNumber}`;
  const subtitleText = !started ? "Add cast members, then start the season." : winnerId ? "Winner and final placements" : screen === "arena" ? "Elimination screen" : String(phase).startsWith("endgame") || phase === "endgameStart" || phase === "endgameReturnGrid" ? "Endgame in progress" : "Main cast grid";

  const fullCastSlots = (() => {
    const totalNeeded = players.length || 0;
    const rows = Math.max(1, Math.ceil(totalNeeded / GRID_COLUMNS));
    const totalSlots = rows * GRID_COLUMNS;
    const slots = Array(totalSlots).fill(null);
    const active = players.filter((player) => !eliminatedIds.includes(player.id));
    active.forEach((player, index) => { slots[index] = { player, label: null, isPlacement: false }; });
    eliminationHistory.forEach((entry, index) => { const player = players.find((item) => item.id === entry.id); const slotIndex = totalSlots - 1 - index; if (player && slotIndex >= 0) slots[slotIndex] = { player, label: String(entry.placementNumber), isPlacement: true }; });
    return slots;
  })();

  const safeRevealPhases = new Set(["arenaFourSafeShown", "arenaThreeSafeShown", "arenaTwoSafeShown", "endgameFourSafeShown", "endgameThreeSafeShown", "endgameTwoSafeShown"]);
  const baseArenaOrder = nomineeIds.length ? nomineeIds : currentDuelIds;
  const unionSet = new Set([...safeIds, ...currentDuelIds, ...(pendingEliminationId ? [pendingEliminationId] : [])]);
  const arenaVisibleIds = safeRevealPhases.has(phase) ? baseArenaOrder.filter((id) => unionSet.has(id)) : currentDuelIds;
  const arenaPlayers = arenaVisibleIds.map((id) => players.find((player) => player.id === id)).filter(Boolean);
  const winner = winnerId ? players.find((player) => player.id === winnerId) : null;

  async function saveSeason() {
    if (!winner) { alert("Finish the season first."); return; }
    setSavingSeason(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { alert("You must be logged in."); setSavingSeason(false); return; }
    const { data, error } = await supabase.from("saved_seasons").insert({ user_id: userData.user.id, simulator_type: "team-battle", title: seasonTitle.trim() || "Team Battle Season", summary: seasonSummary.trim() || `${winner.name} won a Team Battle simulation with ${players.length} players.`, is_public: isPublicSeason, allow_comments: true, data_json: { simulator_type: "team-battle", players, eliminationHistory, winner, winnerId, rounds: roundNumber, log } }).select().single();
    setSavingSeason(false);
    if (error) { alert(error.message); return; }
    router.push(`/seasons/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <Navbar />
      {showAddCastModal && <AddCastMembersModal casts={availableCasts} modalCastId={modalCastId} modalContestants={modalContestants} modalSelectedIds={modalSelectedIds} loadingCasts={loadingCasts} loadingContestants={loadingModalContestants} onClose={() => setShowAddCastModal(false)} onChooseCast={loadContestantsForModal} onToggleContestant={(id) => setModalSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; })} onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))} onSelectNone={() => setModalSelectedIds(new Set())} onAddSelected={addSelectedContestantsToRoster} />}
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-700 bg-zinc-900/80 p-5 shadow-2xl md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-black tracking-tight md:text-5xl">{titleText}</h1><p className="mt-2 text-sm text-zinc-300 md:text-base">{subtitleText}</p></div>
          <div className="flex flex-wrap gap-3">
            {started ? <><button onClick={resetGame} className="rounded-2xl bg-blue-600 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-blue-500">Restart Game</button><button onClick={handleAdvance} disabled={phase === "winnerCrowned"} className="rounded-2xl bg-red-600 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">Advance</button></> : <><button onClick={openAddCastModal} className="rounded-2xl bg-red-600 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-red-500">Add Cast Members</button>{players.length > 0 && <button onClick={clearRoster} className="rounded-2xl bg-red-700 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-red-600">Clear Roster</button>}<Link href="/custom-casts" className="rounded-2xl bg-zinc-700 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-zinc-600">Manage Casts</Link><button onClick={() => setVengeanceMode((prev) => !prev)} className={`rounded-2xl px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] ${vengeanceMode ? "bg-purple-600 hover:bg-purple-500" : "bg-zinc-700 hover:bg-zinc-600"}`}>Vengeance: {vengeanceMode ? "ON" : "OFF"}</button><button onClick={startGame} disabled={players.length < 2} className="rounded-2xl bg-red-600 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">Start Game ({players.length})</button></>}
          </div>
        </div>
        <div className="grid gap-4 md:gap-6 xl:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-zinc-700 bg-zinc-900/80 p-3 shadow-2xl sm:p-4 md:p-6">
            {!started ? <><div className="mb-5 text-center"><div className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cast Setup</div><div className="mt-2 text-xl font-bold md:text-2xl">Add cast members from your saved casts</div><div className="mt-2 text-xs text-zinc-400">Vengeance mode adds a slight revenge and repeat-target bias while keeping outcomes mostly random.</div></div>{players.length === 0 ? <div className="rounded-3xl border border-dashed border-zinc-600 bg-zinc-950/50 p-10 text-center text-zinc-300">No cast members added yet.</div> : <div className="grid grid-cols-6 gap-1 sm:gap-2">{players.map((player) => <div key={player.id} className="relative"><PlayerCard player={player} compact /><button onClick={() => removePlayer(player.id)} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-sm font-black text-white shadow-lg hover:bg-red-500">×</button></div>)}</div>}</> : screen === "arena" ? <><div className="mb-5 text-center"><div className="text-xs uppercase tracking-[0.3em] text-zinc-400">Elimination Arena</div><div className="mt-2 text-xl font-bold md:text-2xl">{arenaPlayers.length > 0 ? `${arenaPlayers.length} players on screen` : "Waiting for arena"}</div></div><div className={`grid ${getArenaColumns(arenaPlayers.length)} gap-4 md:gap-5`}>{arenaPlayers.map((player) => <PlayerCard key={player.id} player={player} status={getPlayerStatus(player.id)} />)}</div></> : <><div className="mb-5 text-center"><div className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cast Grid</div><div className="mt-2 text-xl font-bold md:text-2xl">{winnerId ? "Winner and final placements" : "Team Battle"}</div></div><div className="grid grid-cols-6 gap-1 sm:gap-2">{fullCastSlots.map((slot, index) => slot ? <PlayerCard key={`${slot.player.id}-${index}`} player={slot.player} status={slot.isPlacement ? "eliminated" : getPlayerStatus(slot.player.id)} compact winner={winnerId === slot.player.id} labelOverride={slot.label} /> : <div key={`empty-${index}`} className="rounded-2xl border-4 border-zinc-700 bg-zinc-900/40 p-1.5 opacity-20 sm:p-2"><div className="aspect-square rounded-xl bg-zinc-900" /></div>)}</div>{winner && <div className="mt-8 rounded-3xl border border-yellow-300/40 bg-yellow-400/10 p-5"><div className="text-sm font-black uppercase tracking-widest text-yellow-300">Winner</div><div className="mt-3 mx-auto max-w-[220px]"><PlayerCard player={winner} winner /></div><div className="mt-5 grid gap-3"><input value={seasonTitle} onChange={(e) => setSeasonTitle(e.target.value)} placeholder="Season title" className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white" /><textarea value={seasonSummary} onChange={(e) => setSeasonSummary(e.target.value)} placeholder="Season summary" className="min-h-[90px] rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-bold text-white" /><label className="flex items-center justify-center gap-2 font-bold"><input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} />Public season</label><button onClick={saveSeason} disabled={savingSeason} className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-500 disabled:opacity-40">{savingSeason ? "Saving..." : "Save Season"}</button></div></div>}</>}
          </div>
          <div className="space-y-6"><div className="rounded-3xl border border-zinc-700 bg-zinc-900/80 p-3 shadow-2xl sm:p-4 md:p-6"><div className="text-xs uppercase tracking-[0.3em] text-zinc-400">Event Log</div><div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-2 text-sm text-zinc-200">{log.map((entry, index) => <div key={`${entry}-${index}`} className="rounded-xl bg-zinc-800 px-3 py-2">{entry}</div>)}</div>{started && <button onClick={handleAdvance} disabled={phase === "winnerCrowned"} className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3 font-bold shadow-lg transition hover:scale-[1.02] hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">Advance</button>}</div></div>
        </div>
      </div>
    </div>
  );
}
