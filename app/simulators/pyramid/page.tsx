// @ts-nocheck

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getImage(player) {
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
}) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) onChooseCast(firstCastId);
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    const active = modalCastId === cast.id;

    return (
      <button
        type="button"
        onClick={() => onChooseCast(cast.id)}
        className={`w-full rounded-2xl border-0 px-4 py-3 text-left font-black ${
          active ? "bg-yellow-400 text-black" : "bg-zinc-950 text-white hover:bg-zinc-900"
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
          <button type="button" onClick={onClose} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Close</button>
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
                <button type="button" onClick={onSelectAll} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select All</button>
                <button type="button" onClick={onSelectNone} className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20">Select None</button>
                <button type="button" onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl border-0 bg-yellow-400 px-4 py-2 font-black text-black hover:bg-yellow-300 disabled:opacity-40">Add Selected</button>
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
                      className={`relative aspect-square overflow-hidden rounded-2xl border ${active ? "border-yellow-300 ring-2 ring-yellow-300/60" : "border-white/10 opacity-45 grayscale"}`}
                    >
                      {person.image_url ? <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} /> : <div className="grid h-full w-full place-items-center bg-zinc-900 p-1 text-center text-xs font-black text-zinc-400">No Image</div>}
                      <div className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1 py-1 text-center text-xs font-black text-white">{person.name}</div>
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

function tierCapacities(count) {
  const n = Math.max(2, Number(count) || 2);
  const top = [1, 2, 4, 8];
  const middle = [];
  let current = n;
  while (current > 16) {
    current = Math.ceil(current / 2);
    if (current > 8) middle.push(current);
  }
  const caps = [...top];
  middle.reverse().forEach((c) => {
    if (!caps.includes(c)) caps.push(c);
  });
  caps.push(n);
  caps.push(n);
  return caps;
}

function startingTierIndex(count, caps) {
  const bottom = caps.length - 1;
  const second = Math.max(0, bottom - 1);
  return caps[second] >= count ? second : bottom;
}

function colsFor(cap) {
  if (cap >= 20) return 20;
  if (cap >= 12) return 12;
  return Math.max(1, Math.min(cap, 8));
}

export default function PyramidSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [roster, setRoster] = useState([]);
  const [players, setPlayers] = useState([]);
  const [seasonSize, setSeasonSize] = useState(0);
  const [phase, setPhase] = useState("setup");
  const [round, setRound] = useState(1);
  const [moveUp, setMoveUp] = useState(5);
  const [moveDown, setMoveDown] = useState(5);
  const [elimCount, setElimCount] = useState(1);
  const [lastLog, setLastLog] = useState(["Add cast members and start the Pyramid."]);
  const [plannedMove, setPlannedMove] = useState({});
  const [lastMove, setLastMove] = useState({});
  const [pendingPlayers, setPendingPlayers] = useState(null);
  const [elimPool, setElimPool] = useState([]);
  const [elimOrder, setElimOrder] = useState([]);
  const [safeRevealed, setSafeRevealed] = useState([]);
  const [loserIds, setLoserIds] = useState([]);
  const [champion, setChampion] = useState(null);

  useEffect(() => {
    loadSavedCasts();
  }, []);

  useEffect(() => {
    function keyHandler(e) {
      if (e.code !== "Space") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const button = document.querySelector("[data-pyramid-advance='true']");
      if (button) {
        e.preventDefault();
        button.click();
      }
    }
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [phase, players, plannedMove, pendingPlayers, elimPool, elimOrder, safeRevealed, loserIds]);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official, is_full_cast")
      .eq("user_id", userData.user.id)
      .eq("is_full_cast", false)
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
        .select("id, name, show_name, created_at, is_official, is_full_cast")
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
      img: person.image_url || "",
      active: true,
    }));

    setRoster((current) => {
      const existing = new Set(current.map((player) => player.id));
      return [...current, ...additions.filter((person) => !existing.has(person.id))];
    });

    resetGameStateOnly();
    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function resetGameStateOnly() {
    setPlayers([]);
    setSeasonSize(0);
    setPhase("setup");
    setRound(1);
    setLastLog(["Add cast members and start the Pyramid."]);
    setPlannedMove({});
    setLastMove({});
    setPendingPlayers(null);
    setElimPool([]);
    setElimOrder([]);
    setSafeRevealed([]);
    setLoserIds([]);
    setChampion(null);
  }

  function clearRoster() {
    if (!confirm("Clear Pyramid roster?")) return;
    setRoster([]);
    resetGameStateOnly();
  }

  function removeRosterPlayer(id) {
    setRoster((current) => current.filter((player) => player.id !== id));
  }

  function toggleRoster(id) {
    setRoster((current) => current.map((player) => player.id === id ? { ...player, active: !player.active } : player));
  }

  function activeRoster() {
    return roster.filter((player) => player.active);
  }

  function livePlayers(source = players) {
    return source.filter((player) => !player.eliminated);
  }

  function currentTierCapacities(sourcePlayers = players) {
    const base = tierCapacities(Math.max(seasonSize || activeRoster().length, 2));
    const liveCount = livePlayers(sourcePlayers).length || seasonSize || 2;
    if (base.length >= 3) {
      const floor = base[base.length - 3];
      const shrink = Math.max(floor, liveCount);
      base[base.length - 2] = shrink;
      base[base.length - 1] = shrink;
    }
    return base;
  }

  function candidateTier(sourcePlayers = players) {
    const occupied = [...new Set(sourcePlayers.filter((player) => !player.eliminated).map((player) => player.tier))].sort((a, b) => b - a);
    return occupied.length ? occupied[0] : null;
  }

  function startGame() {
    const selected = activeRoster();
    if (selected.length < 2) {
      alert("Select at least 2 players.");
      return;
    }

    const caps = tierCapacities(selected.length);
    const startTier = startingTierIndex(selected.length, caps);
    const nextPlayers = shuffle(selected).map((player, index) => ({ ...player, eliminated: false, tier: startTier, placement: null, rank: index + 1 }));

    setPlayers(nextPlayers);
    setSeasonSize(selected.length);
    setRound(1);
    setPhase("ready");
    setChampion(null);
    setPlannedMove({});
    setLastMove({});
    setPendingPlayers(null);
    setLoserIds([]);
    setSafeRevealed([]);
    setElimOrder([]);
    setElimPool([]);
    setLastLog([`The Pyramid begins with ${selected.length} players.`, `Everyone starts on Tier ${caps.length - startTier}, with an empty ${selected.length}-slot tier below them.`]);
  }

  function resetAll() {
    resetGameStateOnly();
  }

  function planChallenge() {
    const live = livePlayers();
    if (live.length <= 1) return;

    const caps = currentTierCapacities();
    const ranked = shuffle(live).map((player, index) => ({ ...player, rank: index + 1 }));
    const baseUp = Number(moveUp) || 0;
    const baseDown = Number(moveDown) || 0;
    const totalMoves = baseUp + baseDown;
    const forceEveryone = totalMoves > 0 && live.length <= totalMoves;
    const upWanted = forceEveryone ? Math.floor(live.length / 2) : Math.min(baseUp, Math.floor(live.length / 2));
    const downWanted = forceEveryone ? Math.ceil(live.length / 2) : Math.min(baseDown, Math.floor(live.length / 2));

    const upCandidates = ranked.slice(0, upWanted);
    const downCandidates = ranked.slice(-downWanted).reverse();

    const nextTierById = {};
    const rankById = {};
    ranked.forEach((player) => {
      nextTierById[player.id] = player.tier;
      rankById[player.id] = player.rank;
    });

    const occupancy = Array(caps.length).fill(0);
    live.forEach((player) => (occupancy[player.tier] += 1));

    const nextPlannedMove = {};
    live.forEach((player) => (nextPlannedMove[player.id] = "still"));

    function findOpenTier(fromTier, direction) {
      let tier = fromTier + direction;
      while (tier >= 0 && tier < caps.length) {
        if (occupancy[tier] < caps[tier]) return tier;
        tier += direction;
      }
      return null;
    }

    function movePlayer(player, direction, label, fallbackDirection, forceFallback) {
      const from = nextTierById[player.id];
      let target = findOpenTier(from, direction);
      let usedLabel = label;
      if (target === null && forceFallback) {
        target = findOpenTier(from, fallbackDirection);
        usedLabel = fallbackDirection < 0 ? "up" : "down";
      }
      if (target !== null && target !== from) {
        occupancy[from] -= 1;
        nextTierById[player.id] = target;
        occupancy[target] += 1;
        nextPlannedMove[player.id] = usedLabel;
        return true;
      }
      return false;
    }

    const blockedUp = [];
    upCandidates.forEach((player) => {
      if (!movePlayer(player, -1, "up", 1, forceEveryone)) blockedUp.push(player);
    });

    const blockedDown = [];
    downCandidates.forEach((player) => {
      if (!movePlayer(player, 1, "down", -1, forceEveryone)) blockedDown.push(player);
    });

    const nextPendingPlayers = players.map((player) => player.eliminated ? player : { ...player, tier: nextTierById[player.id], rank: rankById[player.id] || player.rank });
    const actuallyUp = ranked.filter((player) => nextPlannedMove[player.id] === "up");
    const actuallyDown = ranked.filter((player) => nextPlannedMove[player.id] === "down");

    setPlannedMove(nextPlannedMove);
    setPendingPlayers(nextPendingPlayers);
    setLastMove({});
    setPhase("challengeReveal");
    setLastLog([
      `Round ${round} challenge ranking:`,
      ranked.map((player) => `${player.rank}. ${player.name}`).join(" · "),
      actuallyUp.length ? `${actuallyUp.map((player) => player.name).join(", ")} will move up.` : "No one could move up.",
      actuallyDown.length ? `${actuallyDown.map((player) => player.name).join(", ")} will move down.` : "No one could move down.",
      blockedUp.length ? `Could not move up because of full tiers: ${blockedUp.map((player) => player.name).join(", ")}.` : "",
      blockedDown.length ? `Could not move down because of full tiers: ${blockedDown.map((player) => player.name).join(", ")}.` : "",
    ].filter(Boolean));
  }

  function applyMovement() {
    const nextPlayers = pendingPlayers || players;
    const check = candidateTier(nextPlayers);
    const pool = nextPlayers.filter((player) => !player.eliminated && player.tier === check);

    setPlayers(nextPlayers);
    setPendingPlayers(null);
    setLastMove(plannedMove);
    setPlannedMove({});
    setElimPool(pool.map((player) => player.id));
    setPhase("movementDone");
    setLastLog(["Movement complete.", `Elimination floor: ${pool.map((player) => player.name).join(", ")}.`]);
  }

  function openElimination() {
    const pool = players.filter((player) => elimPool.includes(player.id) && !player.eliminated);
    if (pool.length === 0) {
      setPhase("ready");
      setLastLog(["No elimination pool was found. Run another challenge."]);
      return;
    }

    const howMany = pool.length === 1 ? 1 : Math.min(Number(elimCount) || 1, pool.length - 1 || 1);
    const randomized = shuffle(pool);
    const losers = randomized.slice(-howMany);
    const safe = randomized.filter((player) => !losers.some((loser) => loser.id === player.id));

    setPhase("elimScreen");
    setElimOrder([...safe.map((player) => player.id), ...losers.map((player) => player.id)]);
    setSafeRevealed([]);
    setLoserIds(losers.map((player) => player.id));
    setLastLog([pool.length === 1 ? `${pool[0].name} is alone on the elimination floor.` : `${pool.map((player) => player.name).join(", ")} enter the free-for-all elimination.`]);
  }

  function revealElimStep() {
    const safeIds = elimOrder.filter((id) => !loserIds.includes(id));
    if (safeRevealed.length < safeIds.length) {
      const next = safeIds[safeRevealed.length];
      const player = players.find((p) => p.id === next);
      setSafeRevealed((current) => [...current, next]);
      setLastLog([`${player?.name} is safe.`]);
      return;
    }
    if (phase === "elimScreen") {
      const losers = players.filter((player) => loserIds.includes(player.id));
      setPhase("elimLoserShown");
      setLastLog([`${losers.map((player) => player.name).join(", ")} is the last not safe and is eliminated.`]);
    }
  }

  function returnToPyramid() {
    const loserSet = new Set(loserIds);
    const newLiveCount = players.filter((player) => !player.eliminated).length - loserIds.length;
    const nextPlayers = players.map((player) => loserSet.has(player.id) ? { ...player, eliminated: true, placement: newLiveCount + 1 } : player);
    const remaining = nextPlayers.filter((player) => !player.eliminated);
    const nextChampion = remaining.length === 1 ? remaining[0] : null;

    setPlayers(nextPlayers);
    setElimPool([]);
    setElimOrder([]);
    setSafeRevealed([]);
    setLoserIds([]);
    setLastMove({});
    setPlannedMove({});
    setPendingPlayers(null);
    setChampion(nextChampion);
    setPhase(remaining.length === 1 ? "finished" : "elimination");
    setLastLog([remaining.length === 1 ? `${remaining[0].name} wins The Pyramid!` : `The eliminated player is gone from the pyramid. ${remaining.length} players remain.`]);
  }

  function nextRound() {
    const remaining = livePlayers();
    if (remaining.length === 1) {
      setPhase("finished");
      setChampion(remaining[0]);
      return;
    }
    setRound((current) => current + 1);
    setPhase("ready");
    setLastMove({});
    setPlannedMove({});
    setLastLog([`Round ${round + 1}. Run the next challenge.`]);
  }

  function currentPhaseName() {
    return ({ ready: "Challenge Ready", challengeReveal: "Challenge Results", movementDone: "Movement Complete", elimScreen: "Elimination", elimLoserShown: "Loser Revealed", elimination: "Elimination Complete", finished: "Winner Crowned" }[phase] || phase);
  }

  function renderAdvanceButton() {
    if (phase === "ready") return <button data-pyramid-advance="true" className="btn" onClick={planChallenge}>Run Challenge</button>;
    if (phase === "challengeReveal") return <button data-pyramid-advance="true" className="btn" onClick={applyMovement}>Move Players Up/Down</button>;
    if (phase === "movementDone") return <button data-pyramid-advance="true" className="btn" onClick={openElimination}>Go To Elimination</button>;
    if (phase === "elimScreen") return <button data-pyramid-advance="true" className="btn" onClick={revealElimStep}>Reveal Safe Player</button>;
    if (phase === "elimLoserShown") return <button data-pyramid-advance="true" className="btn" onClick={returnToPyramid}>Return To Pyramid</button>;
    if (phase === "elimination") return <button data-pyramid-advance="true" className="btn" onClick={nextRound}>Next Round</button>;
    if (phase === "finished") return <button className="btn" onClick={resetAll}>Back to Main Menu</button>;
    return null;
  }

  function renderCard(player, extraClass = "") {
    return (
      <div key={player.id} className={`card ${extraClass}`}>
        <img className="pic" src={getImage(player)} alt={player.name} />
        <div className="name">{player.name}</div>
      </div>
    );
  }

  function renderPyramid() {
    const caps = players.length ? currentTierCapacities(players) : tierCapacities(Math.max(activeRoster().length, 1));
    const bottomOcc = candidateTier(players);

    return (
      <div className="pyramidWrap">
        {caps.map((cap, tier) => {
          const list = players.filter((player) => !player.eliminated && player.tier === tier).sort((a, b) => a.rank - b.rank);
          const isTop = tier === 0;
          const isElim = bottomOcc === tier && (phase === "movementDone" || phase === "challengeReveal");
          const cols = colsFor(cap);

          return (
            <div key={tier} className={`tier ${isTop ? "safe" : ""} ${isElim ? "elim" : ""}`}>
              <div className="tierHeader">
                <span>Tier {caps.length - tier}{isTop ? " · TOP SAFE" : ""}{isElim ? " · ELIMINATION FLOOR" : ""}</span>
                <span>{list.length}/{cap}</span>
              </div>
              <div className="tierGrid" style={{ "--cols": cols, "--mobile-cols": Math.min(cols, 6) }}>
                {list.map((player) => {
                  const cls = [
                    plannedMove[player.id] === "up" ? "upPick" : "",
                    plannedMove[player.id] === "down" ? "downPick" : "",
                    lastMove[player.id] === "up" ? "movedUp" : "",
                    lastMove[player.id] === "down" ? "movedDown" : "",
                    elimPool.includes(player.id) && phase === "movementDone" ? "elimCandidate" : "",
                    champion?.id === player.id ? "champion" : "",
                  ].join(" ");

                  return (
                    <div key={player.id} className={`card ${cls}`}>
                      <img className="pic" src={getImage(player)} alt={player.name} />
                      {(plannedMove[player.id] === "up" || lastMove[player.id] === "up") && <div className="badge">↑</div>}
                      {(plannedMove[player.id] === "down" || lastMove[player.id] === "down") && <div className="badge">↓</div>}
                      <div className="name">{player.name}</div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, cap - list.length) }).map((_, index) => <div key={`empty-${tier}-${index}`} className="emptySlot" />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderElimScreen() {
    const pool = players.filter((player) => elimOrder.includes(player.id) && !player.eliminated);
    return (
      <div className="elimScreen">
        <div className="elimTitle">FREE-FOR-ALL ELIMINATION</div>
        <div className="subtitle">Advance to reveal safe players. The last one not green goes red and black-and-white.</div>
        <div className="elimGrid">
          {pool.map((player) => {
            let cls = "";
            if (safeRevealed.includes(player.id)) cls = "safeReveal";
            if (phase === "elimLoserShown" && loserIds.includes(player.id)) cls = "loser";
            return renderCard(player, cls);
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />

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
          onToggleContestant={(id) => setModalSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; })}
          onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))}
          onSelectNone={() => setModalSelectedIds(new Set())}
          onAddSelected={addSelectedContestantsToRoster}
        />
      )}

      <style>{`
        *{box-sizing:border-box}
        .app{min-height:100vh;padding:18px;background:radial-gradient(circle at top,rgba(255,215,0,.16),transparent 30%),linear-gradient(180deg,#181818,#050505);color:white;font-family:Arial,Helvetica,sans-serif}
        .title{text-align:center;font-size:38px;font-weight:900;letter-spacing:1px;margin:18px 0 4px;color:#ffd95a;text-shadow:0 2px 16px rgba(255,217,90,.28)}
        .subtitle{text-align:center;color:#ddd;margin-bottom:14px}
        .panel,.log{max-width:1250px;margin:0 auto 14px;padding:14px;border:1px solid #333;background:rgba(0,0,0,.42);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
        .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:end;justify-content:center}
        .control{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#ccc;min-width:120px}
        .control input{border-radius:9px;border:1px solid #555;background:#101010;color:white;padding:9px;width:100%}
        .btn{border:none;border-radius:12px;padding:10px 15px;font-weight:900;cursor:pointer;background:#ffd95a;color:#111;box-shadow:0 4px 0 #a77e00;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
        .btn:active{transform:translateY(2px);box-shadow:0 2px 0 #a77e00}
        .btn.secondary{background:#eee;box-shadow:0 4px 0 #777;color:#111}
        .btn.dark{color:white;background:#333;box-shadow:0 4px 0 #111}
        .status{text-align:center;font-size:18px;font-weight:800;min-height:28px;margin-bottom:10px}
        .phaseText{color:#ffd95a}
        .pyramidWrap{max-width:1500px;margin:0 auto;display:flex;flex-direction:column;gap:10px;align-items:center}
        .tier{width:100%;max-width:1500px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.055);border-radius:15px;padding:8px;position:relative}
        .tierHeader{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px;color:#eee;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:.5px}
        .tier.safe{border-color:rgba(70,255,120,.75);box-shadow:0 0 18px rgba(70,255,120,.08)}
        .tier.elim{border-color:rgba(255,60,60,.8);box-shadow:0 0 20px rgba(255,60,60,.13)}
        .tierGrid{display:grid;gap:7px;justify-content:center;grid-template-columns:repeat(var(--cols),minmax(42px,64px))}
        .card{background:white;color:black;border:3px solid transparent;border-radius:12px;overflow:hidden;min-width:0;box-shadow:0 3px 10px rgba(0,0,0,.35);transition:transform .18s ease,border-color .18s ease,filter .18s ease,background .18s ease;position:relative}
        .emptySlot{background:rgba(255,255,255,.08);border:2px dashed rgba(255,255,255,.18);border-radius:12px;aspect-ratio:1/1;min-width:0;position:relative}
        .emptySlot:after{content:"";position:absolute;inset:8px;border-radius:8px;background:rgba(255,255,255,.045)}
        .card.upPick{border-color:#39ff75;background:#b8ffc8}
        .card.downPick{border-color:#ff3f3f;background:#ffb8b8}
        .card.movedUp{border-color:#39ff75;transform:translateY(-3px)}
        .card.movedDown{border-color:#ff3f3f;transform:translateY(3px)}
        .card.elimCandidate{outline:4px solid #ff2d2d;outline-offset:-4px}
        .card.loser{filter:grayscale(1);background:#111;color:white;border-color:#ff2d2d}
        .card.winner,.card.safeReveal{background:#87ff98;border-color:#16df3c;box-shadow:0 0 22px rgba(70,255,120,.45)}
        .card.champion{background:#ffd95a;border-color:#fff;box-shadow:0 0 28px rgba(255,217,90,.55)}
        .elimScreen{max-width:1250px;margin:0 auto;padding:16px;border:1px solid rgba(255,60,60,.55);border-radius:18px;background:rgba(70,0,0,.25)}
        .elimTitle{text-align:center;color:#ff7777;font-size:28px;font-weight:900;margin:4px 0 6px}
        .elimGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,140px));gap:12px;justify-content:center;margin-top:12px}
        .pic{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#ddd}
        .name{font-size:11px;font-weight:900;text-align:center;padding:4px 2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .badge{position:absolute;top:3px;right:3px;background:rgba(0,0,0,.74);color:white;border-radius:999px;font-size:10px;padding:2px 5px;font-weight:900}
        .log{color:#ddd;line-height:1.45;max-height:170px;overflow:auto}
        .setupGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:9px;max-height:390px;overflow:auto;padding:8px;border:1px solid #333;border-radius:14px;background:rgba(0,0,0,.22);margin-top:12px}
        .setupCard{border:2px solid #444;background:white;color:black;border-radius:12px;overflow:hidden;cursor:pointer;position:relative}
        .setupCard.off{opacity:.35;filter:grayscale(1)}
        .setupCard img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
        .check{position:absolute;top:5px;left:5px;background:#111;color:white;padding:2px 6px;border-radius:999px;font-size:12px;font-weight:900}
        .removeBtn{position:absolute;top:5px;right:5px;background:#ef4444;color:white;border:none;width:24px;height:24px;border-radius:999px;font-weight:900;cursor:pointer}
        @media(max-width:760px){.app{padding:10px}.title{font-size:30px}.tierGrid{grid-template-columns:repeat(var(--mobile-cols),minmax(31px,1fr));gap:4px}.name{font-size:8px;padding:3px 1px}.tier{padding:6px}.tierHeader{font-size:11px}.controls{align-items:stretch}.control{min-width:95px;flex:1}.btn{width:100%}.elimGrid{grid-template-columns:repeat(auto-fit,minmax(75px,1fr))}}
      `}</style>

      <div className="title">Pyramid ⭐⭐⭐⭐⭐</div>
      <div className="subtitle">Move up. Fall down. Survive the bottom.</div>

      <div className="panel">
        {phase === "setup" ? (
          <>
            <div className="controls">
              <button className="btn" onClick={startGame}>Start Pyramid ({activeRoster().length})</button>
              <button className="btn" onClick={openAddCastModal}>Add Cast Members</button>
              {roster.length > 0 && <button className="btn dark" onClick={clearRoster}>Clear Roster</button>}
              <Link href="/custom-casts" className="btn dark">Manage Casts</Link>
              <button className="btn secondary" onClick={() => setRoster((current) => current.map((player) => ({ ...player, active: true })))}>Select All</button>
              <button className="btn dark" onClick={() => setRoster((current) => current.map((player) => ({ ...player, active: false })))}>Select None</button>
              <label className="control">Move Up<input type="number" min="1" value={moveUp} onChange={(e) => setMoveUp(e.target.value)} /></label>
              <label className="control">Move Down<input type="number" min="1" value={moveDown} onChange={(e) => setMoveDown(e.target.value)} /></label>
              <label className="control">Eliminated<input type="number" min="1" value={elimCount} onChange={(e) => setElimCount(e.target.value)} /></label>
            </div>

            <div className="setupGrid">
              {roster.length === 0 ? (
                <div className="subtitle" style={{ gridColumn: "1 / -1", padding: 30 }}>No cast members added yet.</div>
              ) : roster.map((player) => (
                <div key={player.id} className={`setupCard ${player.active ? "" : "off"}`} onClick={() => toggleRoster(player.id)}>
                  <div className="check">{player.active ? "✓" : "×"}</div>
                  <button className="removeBtn" onClick={(e) => { e.stopPropagation(); removeRosterPlayer(player.id); }}>×</button>
                  <img src={getImage(player)} alt={player.name} />
                  <div className="name">{player.name}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="controls">
            <label className="control">Move Up<input type="number" min="1" value={moveUp} onChange={(e) => setMoveUp(e.target.value)} /></label>
            <label className="control">Move Down<input type="number" min="1" value={moveDown} onChange={(e) => setMoveDown(e.target.value)} /></label>
            <label className="control">Eliminated<input type="number" min="1" value={elimCount} onChange={(e) => setElimCount(e.target.value)} /></label>
            {renderAdvanceButton()}
            <button className="btn dark" onClick={resetAll}>Reset</button>
          </div>
        )}
      </div>

      {phase !== "setup" && (
        <>
          <div className="status">Round {round} · <span className="phaseText">{currentPhaseName()}</span></div>
          {phase === "elimScreen" || phase === "elimLoserShown" ? renderElimScreen() : renderPyramid()}
        </>
      )}

      <div className="log">{lastLog.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}</div>
    </div>
  );
}
