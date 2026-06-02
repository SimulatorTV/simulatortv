// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

export default function HotSeatSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [rosterPlayers, setRosterPlayers] = useState([]);
  const [selectedCastNames, setSelectedCastNames] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);
  const [eliminationOrder, setEliminationOrder] = useState([]);

  const ALL_CAST = rosterPlayers;

  const createPlayersFromNames = (names) =>
    ALL_CAST.filter((p) => names.includes(p.name)).map((p, i) => ({
      id: p.id || `${p.name}-${i}`,
      name: p.name,
      image: p.image || p.img || "",
    }));

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const [weeklyPlanner, setWeeklyPlanner] = useState(Array.from({ length: 40 }, () => 1));
  const [finalCount, setFinalCount] = useState(2);
  const [finaleElims, setFinaleEliminationCount] = useState(1);

  const [phase, setPhase] = useState("setup");
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(1);
  const [winnerId, setWinnerId] = useState(null);
  const [pickerId, setPickerId] = useState(null);
  const [seatAssignments, setSeatAssignments] = useState([]);
  const [deadlySeats, setDeadlySeats] = useState([]);
  const [safeFinalSeat, setSafeFinalSeat] = useState(null);
  const [pickedThisRound, setPickedThisRound] = useState([]);
  const [eliminatedThisRound, setEliminatedThisRound] = useState([]);
  const [finaleOrder, setFinaleOrder] = useState([]);
  const [roundMessage, setRoundMessage] = useState("Choose your cast and settings.");
  const [gameWinnerId, setGameWinnerId] = useState(null);

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

    setRosterPlayers((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const next = [...current, ...additions.filter((person) => !existingIds.has(person.id))];
      setSelectedCastNames(next.map((player) => player.name));
      return next;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function clearRoster() {
    if (phase !== "setup") return;
    const ok = confirm("Clear all added Hot Seat cast members?");
    if (!ok) return;
    setRosterPlayers([]);
    setSelectedCastNames([]);
  }

  async function saveSeason() {
    if (!gameWinner) {
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
        simulator_type: "hot-seat",
        title: seasonTitle.trim() || "Hot Seat Season",
        summary:
          seasonSummary.trim() ||
          `${gameWinner.name} won Hot Seat with ${rosterPlayers.length} players.` ,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "hot-seat",
          startingCast: rosterPlayers,
          selectedCastNames,
          weeklyPlanner,
          finalCount: effectiveFinalCount,
          finaleElims,
          eliminationOrder,
          winner: gameWinner,
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

  const clampFinalCount = (count, selectedCount) => {
    const maxAllowed = Math.max(2, selectedCount || 2);
    return Math.max(2, Math.min(count, maxAllowed));
  };

  const effectiveFinalCount = clampFinalCount(finalCount, selectedCastNames.length);

  const buildWeeklyPlan = (count, planner, finalePlayers, requestedFinaleElims) => {
    const plan = [];
    if (count < 2) return plan;

    let remaining = count;
    let week = 1;
    const finalTarget = Math.max(2, Math.min(finalePlayers, count));

    while (remaining > finalTarget) {
      const requested = Number(planner[week - 1] || 1);
      const maxThisWeek = remaining - finalTarget;
      const eliminations = Math.max(1, Math.min(requested, maxThisWeek));
      plan.push({
        week,
        type: "normal",
        players: remaining,
        eliminations,
        after: remaining - eliminations,
      });
      remaining -= eliminations;
      week += 1;
    }

    if (remaining >= 2) {
      const finaleEliminations = Math.max(1, Math.min(Number(requestedFinaleElims || remaining - 1), remaining - 1));
      plan.push({
        week,
        type: "finale",
        players: remaining,
        eliminations: finaleEliminations,
        after: remaining - finaleEliminations,
      });
    }

    return plan;
  };

  const setupPlan = useMemo(
    () => buildWeeklyPlan(selectedCastNames.length, weeklyPlanner, effectiveFinalCount, finaleElims),
    [selectedCastNames.length, weeklyPlanner, effectiveFinalCount, finaleElims]
  );

  const seasonPlan = useMemo(
    () => buildWeeklyPlan(selectedCastNames.length, weeklyPlanner, effectiveFinalCount, finaleElims),
    [selectedCastNames.length, weeklyPlanner, effectiveFinalCount, finaleElims]
  );

  const currentWeekConfig = seasonPlan[round - 1] || null;
  const currentWinner = players.find((p) => p.id === winnerId) || null;
  const currentPicker = players.find((p) => p.id === pickerId) || null;
  const gameWinner = players.find((p) => p.id === gameWinnerId) || null;

  const castGridPlayers = useMemo(() => {
    if (!seatAssignments.length) return players;
    const seatedIds = new Set(seatAssignments.filter((s) => s.playerId).map((s) => s.playerId));
    return players.filter((p) => !seatedIds.has(p.id));
  }, [players, seatAssignments]);

  const remainingUnseatedPickers = useMemo(() => {
    const seatedIds = new Set(seatAssignments.filter((s) => s.playerId).map((s) => s.playerId));
    return players.filter((p) => {
      if (phase === "pick" && winnerId && p.id === winnerId) return false;
      if (pickedThisRound.includes(p.id)) return false;
      if (seatedIds.has(p.id)) return false;
      return true;
    });
  }, [players, seatAssignments, pickedThisRound, winnerId, phase]);

  const setPlannerValue = (weekIndex, value) => {
    setWeeklyPlanner((prev) => {
      const next = [...prev];
      next[weekIndex] = Number(value);
      return next;
    });
  };

  const toggleCast = (name) => {
    if (phase !== "setup") return;
    setSelectedCastNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const applyDefaultCast = () => {
    if (phase !== "setup") return;
    setSelectedCastNames(ALL_CAST.map((p) => p.name));
  };

  const selectAllCast = () => {
    if (phase !== "setup") return;
    setSelectedCastNames(ALL_CAST.map((p) => p.name));
  };

  const clearCast = () => {
    if (phase !== "setup") return;
    setSelectedCastNames([]);
  };

  const resetToSetup = () => {
    setPhase("setup");
    setPlayers([]);
    setRound(1);
    setWinnerId(null);
    setPickerId(null);
    setSeatAssignments([]);
    setDeadlySeats([]);
    setSafeFinalSeat(null);
    setPickedThisRound([]);
    setEliminatedThisRound([]);
    setFinaleOrder([]);
    setRoundMessage("Choose your cast and settings.");
    setGameWinnerId(null);
    setEliminationOrder([]);
  };

  const chooseNextNormalPicker = () => {
    if (!remainingUnseatedPickers.length) return null;
    return remainingUnseatedPickers[Math.floor(Math.random() * remainingUnseatedPickers.length)];
  };

  const startNormalRound = (currentPlayers, roundNumber) => {
    setPhase("cast");
    setWinnerId(null);
    setPickerId(null);
    setSeatAssignments([]);
    setDeadlySeats([]);
    setSafeFinalSeat(null);
    setPickedThisRound([]);
    setEliminatedThisRound([]);
    setFinaleOrder([]);
    const cfg = seasonPlan[roundNumber - 1];
    setRoundMessage(`Press Advance to begin Round ${roundNumber}. ${cfg?.eliminations || 1} elimination chair${cfg?.eliminations === 1 ? "" : "s"}.`);
  };

  const startFinaleRound = (currentPlayers, roundNumber) => {
    const order = shuffle(currentPlayers).map((p) => p.id);
    const seats = Array.from({ length: currentPlayers.length }, (_, i) => ({
      seatNumber: i,
      label: String(i + 1),
      playerId: null,
      status: "empty",
    }));
    const finaleConfig = seasonPlan[roundNumber - 1];
    const safeSeatChoices = shuffle(Array.from({ length: currentPlayers.length }, (_, i) => i)).slice(
      0,
      Math.max(1, currentPlayers.length - (finaleConfig?.eliminations || currentPlayers.length - 1))
    );
    const safeSeat = safeSeatChoices[0];

    setPhase("finale");
    setWinnerId(null);
    setSeatAssignments(seats);
    setDeadlySeats(seats.map((s) => s.seatNumber).filter((n) => !safeSeatChoices.includes(n)));
    setSafeFinalSeat(safeSeat);
    setPickedThisRound([]);
    setEliminatedThisRound([]);
    setFinaleOrder(order);
    setPickerId(order[0] || null);
    setRoundMessage("Finale: no challenge winner. Adjusted deadly seats apply, and one safe seat still wins the game.");
  };

  const startGame = () => {
    if (selectedCastNames.length < 2) return;
    const fresh = createPlayersFromNames(selectedCastNames);
    setPlayers(fresh);
    setRound(1);
    setGameWinnerId(null);
    setEliminationOrder([]);
    const plan = seasonPlan;
    if (plan[0]?.type === "finale") {
      startFinaleRound(fresh, 1);
    } else {
      startNormalRound(fresh, 1);
    }
  };

  const advance = () => {
    if (phase === "finale" && gameWinnerId) {
      setPhase("finished");
      const winner = players.find((p) => p.id === gameWinnerId);
      setRoundMessage(`${winner?.name || "Winner"} wins the game.`);
      return;
    }

    if (phase === "cast") {
      const selectedWinner = players[Math.floor(Math.random() * players.length)];
      setWinnerId(selectedWinner.id);
      setPhase("winner-revealed");
      setRoundMessage(`${selectedWinner.name} wins the challenge and is safe.`);
      return;
    }

    if (phase === "winner-revealed") {
      const seatCount = players.length;
      const seats = Array.from({ length: seatCount }, (_, i) => ({
        seatNumber: i,
        label: i === 0 ? "Winner" : String(i),
        playerId: i === 0 ? winnerId : null,
        status: i === 0 ? "winner" : "empty",
      }));

      const eliminationCount = currentWeekConfig?.eliminations || 1;
      const availableSeatNumbers = Array.from({ length: seatCount - 1 }, (_, i) => i + 1);
      const chosenDeadlySeats = [];
      const pool = [...availableSeatNumbers];
      for (let i = 0; i < eliminationCount; i += 1) {
        const index = Math.floor(Math.random() * pool.length);
        chosenDeadlySeats.push(pool[index]);
        pool.splice(index, 1);
      }

      setSeatAssignments(seats);
      setDeadlySeats(chosenDeadlySeats);
      setPickedThisRound([]);
      setEliminatedThisRound([]);

      const nextPickerPool = players.filter((p) => p.id !== winnerId);
      const nextPicker = nextPickerPool[Math.floor(Math.random() * nextPickerPool.length)];
      setPickerId(nextPicker?.id || null);
      setPhase("pick");
      setRoundMessage(`${nextPicker?.name || "A player"} must choose a seat.`);
      return;
    }

    if (phase === "round-over") {
      const survivingIds = new Set(players.map((p) => p.id).filter((id) => !eliminatedThisRound.includes(id)));
      const remaining = players.filter((p) => survivingIds.has(p.id));
      setPlayers(remaining);

      if (remaining.length <= 1) {
        setGameWinnerId(remaining[0]?.id || null);
        setPhase("finished");
        setRoundMessage(`${remaining[0]?.name || "Winner"} wins the game.`);
        return;
      }

      const nextRound = round + 1;
      setRound(nextRound);
      const nextPlanItem = seasonPlan[nextRound - 1];
      if (nextPlanItem?.type === "finale") {
        startFinaleRound(remaining, nextRound);
      } else {
        startNormalRound(remaining, nextRound);
      }
    }
  };

  const handleNormalSeatClick = (seatNumber) => {
    if (phase !== "pick") return;
    if (seatNumber === 0) return;
    const seat = seatAssignments.find((s) => s.seatNumber === seatNumber);
    if (!seat || seat.playerId) return;
    if (!pickerId) return;

    const isDeadly = deadlySeats.includes(seatNumber);
    const updatedSeats = seatAssignments.map((s) =>
      s.seatNumber === seatNumber
        ? { ...s, playerId: pickerId, status: isDeadly ? "eliminated" : "safe" }
        : s
    );
    const nextPicked = [...pickedThisRound, pickerId];
    const nextEliminated = isDeadly ? [...eliminatedThisRound, pickerId] : eliminatedThisRound;

    setSeatAssignments(updatedSeats);
    setPickedThisRound(nextPicked);
    setEliminatedThisRound(nextEliminated);
    if (isDeadly) {
      setEliminationOrder((prev) => [...prev, pickerId]);
    }

    if (nextEliminated.length >= (currentWeekConfig?.eliminations || 1)) {
      setPickerId(null);
      setPhase("round-over");
      setRoundMessage(`Round over. ${nextEliminated.length} player${nextEliminated.length === 1 ? "" : "s"} eliminated.`);
      return;
    }

    const seatedIds = new Set(updatedSeats.filter((s) => s.playerId).map((s) => s.playerId));
    const nextPool = players.filter((p) => p.id !== winnerId && !nextPicked.includes(p.id) && !seatedIds.has(p.id));
    const nextPicker = nextPool[Math.floor(Math.random() * nextPool.length)];
    setPickerId(nextPicker?.id || null);
    setRoundMessage(`${(players.find((p) => p.id === pickerId) && players.find((p) => p.id === pickerId).name) || "Player"} is seated. ${(nextPicker && nextPicker.name) || "Next player"} must choose a seat.`);
  };

  const handleFinaleSeatClick = (seatNumber) => {
    if (phase !== "finale") return;
    const seat = seatAssignments.find((s) => s.seatNumber === seatNumber);
    if (!seat || seat.playerId) return;
    if (!pickerId) return;

    const isSafe = seatNumber === safeFinalSeat;
    const updatedSeats = seatAssignments.map((s) =>
      s.seatNumber === seatNumber
        ? { ...s, playerId: pickerId, status: isSafe ? "safe" : "eliminated" }
        : s
    );
    setSeatAssignments(updatedSeats);

    if (isSafe) {
      setGameWinnerId(pickerId);
      const winner = players.find((p) => p.id === pickerId);
      setPickerId(null);
      setRoundMessage(`${winner?.name || "Winner"} found the safe seat. Press Advance to reveal the winner.`);
      return;
    }

    const currentIndex = finaleOrder.indexOf(pickerId);
    const nextId = finaleOrder[currentIndex + 1] || null;
    const nextEliminated = [...eliminatedThisRound, pickerId];
    setEliminatedThisRound(nextEliminated);
    setEliminationOrder((prev) => [...prev, pickerId]);
    setPickedThisRound([...pickedThisRound, pickerId]);
    setPickerId(nextId);

    const eliminatedPlayer = players.find((p) => p.id === pickerId);
    const nextPlayer = players.find((p) => p.id === nextId);
    setRoundMessage(`${eliminatedPlayer?.name || "Player"} is out. ${nextPlayer?.name || "Next player"} must choose a seat.`);
  };

  const cardClass = (playerId) => {
    if (phase === "finished" && gameWinnerId === playerId) return "ring-4 ring-green-500 bg-green-950/40";
    if (winnerId === playerId && ["winner-revealed", "pick"].includes(phase)) return "ring-4 ring-green-500 bg-green-950/40";
    if (pickerId === playerId && ["pick", "finale"].includes(phase)) return "ring-4 ring-yellow-400 bg-yellow-950/30";
    return "ring-1 ring-white/10 bg-white/5";
  };

  const setupCardClass = (name) =>
    selectedCastNames.includes(name)
      ? "ring-2 ring-blue-400 bg-blue-950/25"
      : "ring-1 ring-white/10 bg-white/5 opacity-60";

  const seatClass = (seat) => {
    if (seat.status === "winner") return "border-green-500 bg-green-950/35";
    if (seat.status === "safe") return "border-green-500 bg-green-950/25";
    if (seat.status === "eliminated") return "border-red-500 bg-red-950/35";
    return "border-white/15 bg-white/5 hover:bg-white/10";
  };

  const maxFinalistChoice = Math.max(2, selectedCastNames.length || 2);
  const maxFinaleElimsChoice = Math.max(1, selectedCastNames.length - 1);

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Hot Seat Simulator</h1>
                  <p className="mt-1 text-sm text-white/70">Choose your cast, set weekly eliminations, then start.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={openAddCastModal} className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold transition hover:bg-orange-500">Add Cast Members</button>
                  <button onClick={applyDefaultCast} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500">Select Added</button>
                  <button onClick={selectAllCast} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">Select All</button>
                  <button onClick={clearCast} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">Select None</button>
                  <button onClick={clearRoster} className="rounded-2xl border border-red-500/40 bg-red-950/40 px-5 py-3 text-sm font-semibold transition hover:bg-red-900/60">Clear Roster</button>
                  <button
                    onClick={startGame}
                    disabled={selectedCastNames.length < 2}
                    className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Start Game
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Selected Cast</div>
                  <div className="mt-2 text-2xl font-bold">{selectedCastNames.length}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Finalists Before Finale</div>
                  <select
                    value={effectiveFinalCount}
                    onChange={(e) => setFinalCount(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                  >
                    {Array.from({ length: maxFinalistChoice - 1 }, (_, i) => i + 2).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Finale Elimination Chairs</div>
                  <select
                    value={Math.max(1, Math.min(finaleElims, maxFinaleElimsChoice))}
                    onChange={(e) => setFinaleEliminationCount(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                  >
                    {Array.from({ length: maxFinaleElimsChoice }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">Planned Weeks</div>
                  <div className="mt-2 text-2xl font-bold">{setupPlan.length}</div>
                </div>
              </div>
            </div>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Cast Selection</h2>
                <div className="text-sm text-white/50">Click any card to select or deselect it</div>
              </div>
              {ALL_CAST.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/60">
                  No cast members added yet. Click Add Cast Members to build the roster.
                </div>
              ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {ALL_CAST.map((player) => (
                  <button
                    key={player.name}
                    onClick={() => toggleCast(player.name)}
                    className={`overflow-hidden rounded-2xl border p-1 text-left shadow-lg transition ${setupCardClass(player.name)}`}
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-black/30">
                      <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="px-1 pb-1 pt-3 text-center text-sm font-semibold leading-tight">{player.name}</div>
                  </button>
                ))}
              </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Weekly Planner</h2>
                <div className="text-sm text-white/50">Set elimination chairs for each week. Normal weeks stay adjustable, and the finale row is gold.</div>
              </div>

              <div className="grid gap-3">
                {setupPlan.map((week, index) => (
                  <div key={week.week} className={`grid items-center gap-3 rounded-2xl border p-4 md:grid-cols-[100px_1fr_160px_160px_160px] ${week.type === "finale" ? "border-yellow-500/40 bg-yellow-900/30" : "border-white/10 bg-black/20"}`}>
                    <div className="text-sm font-semibold">Week {week.week}</div>
                    <div className="text-sm text-white/70">
                      {week.type === "finale"
                        ? `Finale with ${week.players} players. Adjust the deadly seats here.`
                        : `${week.players} players start this week.`}
                    </div>
                    <div className="text-sm text-white/70">After week: {week.after}</div>
                    <div>
                      {week.type === "finale" ? (
                        <select
                          value={Math.max(1, Math.min(finaleElims, Math.max(1, week.players - 1)))}
                          onChange={(e) => setFinaleEliminationCount(Number(e.target.value))}
                          className="w-full rounded-xl border border-yellow-500/30 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-100"
                        >
                          {Array.from({ length: Math.max(1, week.players - 1) }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n} elim</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={weeklyPlanner[index] || 1}
                          onChange={(e) => setPlannerValue(index, e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm"
                        >
                          {Array.from({ length: Math.max(1, week.players - 1) }, (_, i) => i + 1).map((n) => (
                            <option key={n} value={n}>{n} elim</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="text-sm font-semibold">
                      {week.type === "finale" ? `${week.eliminations} deadly` : `${week.eliminations} deadly chair${week.eliminations === 1 ? "" : "s"}`}
                    </div>
                  </div>
                ))}
              </div>
            </section>

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
      </div>
    );
  }

  if (phase === 'finished' && gameWinner) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Hot Seat Simulator</h1>
                <p className="mt-1 text-sm text-white/70">Season complete.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetToSetup}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  Main Menu
                </button>
              </div>
            </div>
          </div>

          <section className="mt-8 flex justify-center">
            <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-green-500/40 bg-green-950/20 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between px-1 pt-1">
                <span className="text-xs uppercase tracking-[0.2em] text-green-200/80">Season Winner</span>
                <span className="text-xs font-bold text-green-300">WINNER</span>
              </div>
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-black/30">
                <img src={gameWinner.image} alt={gameWinner.name} className="h-full w-full object-cover" />
              </div>
              <div className="px-1 pb-1 pt-4 text-center text-3xl font-bold leading-tight">{gameWinner.name}</div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold">Save Season</h2>
            <div className="grid gap-3 max-w-xl">
              <input
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                placeholder="Season title"
                className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white"
              />
              <textarea
                value={seasonSummary}
                onChange={(e) => setSeasonSummary(e.target.value)}
                placeholder="Season summary"
                rows={3}
                className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white"
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} />
                Post publicly
              </label>
              <button
                onClick={saveSeason}
                disabled={savingSeason}
                className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold transition hover:bg-orange-500 disabled:opacity-40"
              >
                {savingSeason ? "Saving..." : "Save Season"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hot Seat Simulator</h1>
              <p className="mt-1 text-sm text-white/70">One bad seat ends the week.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={advance}
                disabled={!['cast', 'winner-revealed', 'round-over', 'finale'].includes(phase)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Advance
              </button>
              <button
                onClick={resetToSetup}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Main Menu
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Round</div>
              <div className="mt-2 text-2xl font-bold">{round}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Players Left</div>
              <div className="mt-2 text-2xl font-bold">{players.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Challenge Winner</div>
              <div className="mt-2 text-lg font-semibold">{currentWinner?.name || (phase === 'finale' ? 'No winner' : '—')}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">Current Picker</div>
              <div className="mt-2 text-lg font-semibold">{currentPicker?.name || (phase === 'round-over' ? 'Round Over' : '—')}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/85">{roundMessage}</div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cast Grid</h2>
            <div className="text-sm text-white/50">Players disappear from the cast grid once seated below</div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {castGridPlayers.map((player) => (
              <div key={player.id} className={`overflow-hidden rounded-2xl border p-1 shadow-lg transition ${cardClass(player.id)}`}>
                <div className="aspect-[4/5] overflow-hidden rounded-xl bg-black/30">
                  <img src={player.image} alt={player.name} className="h-full w-full object-cover" />
                </div>
                <div className="px-1 pb-1 pt-3 text-center text-sm font-semibold leading-tight">{player.name}</div>
              </div>
            ))}
          </div>
        </section>

        {seatAssignments.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Seat Grid</h2>
              <div className="text-sm text-white/50">
                {phase === 'pick' || phase === 'finale' ? 'Click a numbered seat to place the current picker' : 'Seat view'}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {seatAssignments.map((seat) => {
                const seatedPlayer = players.find((p) => p.id === seat.playerId) || null;
                const clickable = (phase === 'pick' || phase === 'finale') && !seat.playerId && (phase === 'finale' || seat.seatNumber !== 0);
                return (
                  <button
                    key={seat.seatNumber}
                    onClick={() => (phase === 'finale' ? handleFinaleSeatClick(seat.seatNumber) : handleNormalSeatClick(seat.seatNumber))}
                    disabled={!clickable}
                    className={`overflow-hidden rounded-2xl border p-1 text-left shadow-lg transition ${seatClass(seat)} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="mb-2 flex items-center justify-between px-1 pt-1">
                      <span className="text-xs uppercase tracking-[0.2em] text-white/55">
                        {phase === 'finale' ? `Seat ${seat.label}` : seat.seatNumber === 0 ? 'Seat 0' : `Seat ${seat.label}`}
                      </span>
                      {seat.status === 'eliminated' && <span className="text-xs font-bold text-red-300">OUT</span>}
                      {seat.status === 'safe' && <span className="text-xs font-bold text-green-300">SAFE</span>}
                      {seat.status === 'winner' && <span className="text-xs font-bold text-green-300">WINNER</span>}
                    </div>
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-black/30">
                      {seatedPlayer ? (
                        <img src={seatedPlayer.image} alt={seatedPlayer.name} className={`h-full w-full object-cover ${seat.status === 'eliminated' ? 'grayscale' : ''}`} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-bold text-white/25">{seat.label}</div>
                      )}
                    </div>
                    <div className="px-1 pb-1 pt-3 text-center text-sm font-semibold leading-tight">
                      {seatedPlayer ? seatedPlayer.name : phase === 'finale' ? 'Empty' : seat.seatNumber === 0 ? currentWinner?.name || 'Winner' : 'Empty'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
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
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) {
      onChooseCast(firstCastId);
    }
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    return (
      <button
        key={cast.id}
        onClick={() => onChooseCast(cast.id)}
        className={`w-full text-left rounded-2xl px-4 py-3 font-black ${
          modalCastId === cast.id
            ? "bg-orange-600 text-white"
            : "bg-neutral-900 hover:bg-neutral-800 text-white"
        }`}
      >
        <div>{cast.name}</div>
        <div className="text-xs opacity-70 font-bold">{cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}</div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-white/50 text-sm">Pick a cast, select people, and add them to the Hot Seat roster.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 font-black text-white">Close</button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] min-h-0 flex-1 overflow-hidden">
          <div className="border-r border-white/10 p-4 overflow-auto space-y-4">
            {loadingCasts ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white/70">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {officialCasts.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs font-black uppercase tracking-widest mb-2">Favorite Official Casts</div>
                    <div className="space-y-2">{officialCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div>
                  </div>
                )}
                {customCasts.length > 0 && (
                  <div>
                    <div className="text-white/50 text-xs font-black uppercase tracking-widest mb-2">Custom Casts</div>
                    <div className="space-y-2">{customCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-white/50 text-sm">{selectedCount} selected</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 font-black text-white">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2 font-black text-white">Select None</button>
                <button onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 px-4 py-2 font-black text-white">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white/70">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white/70">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);
                  return (
                    <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative rounded-2xl overflow-hidden border aspect-square ${active ? "border-white ring-2 ring-white/60" : "border-white/10 opacity-45 grayscale"}`}>
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-white/40 text-xs font-black text-center p-1 bg-white/5">No Image</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-center text-xs font-black py-1 truncate px-1">{person.name}</div>
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
