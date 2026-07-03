// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const ALL_COLORS = [
  "red", "orange", "yellow", "green", "blue", "purple",
  "gray", "brown", "black", "white", "salmon", "gold", "lime", "forest",
  "cyan", "navy", "magenta", "lavender", "silver", "tan", "charcoal"
];

const COLOR_STYLE = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  gray: "#9ca3af",
  brown: "#92400e",
  black: "#111827",
  white: "#ffffff",
  salmon: "#fb7185",
  gold: "#f59e0b",
  lime: "#84cc16",
  forest: "#166534",
  cyan: "#06b6d4",
  navy: "#1e3a8a",
  magenta: "#d946ef",
  lavender: "#c4b5fd",
  silver: "#d1d5db",
  tan: "#d6b48c",
  charcoal: "#374151",
};

const DEFAULT_ACTIVE = ["red", "orange", "yellow", "green", "blue", "purple"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n) || 0));
}

function makeStats(activeColors, ranges, pointTotal) {
  const stats = {};
  const cleanRanges = activeColors.map((color) => {
    const r = ranges[color] || { min: 0, max: 10 };
    const min = clamp(r.min, 0, 99);
    const max = Math.max(min, clamp(r.max, 0, 99));
    return { color, min, max };
  });

  const minTotal = cleanRanges.reduce((sum, r) => sum + r.min, 0);
  const maxTotal = cleanRanges.reduce((sum, r) => sum + r.max, 0);
  let remaining = clamp(pointTotal, minTotal, maxTotal) - minTotal;

  cleanRanges.forEach(({ color, min }) => {
    stats[color] = min;
  });

  const order = shuffle(cleanRanges);
  while (remaining > 0) {
    let moved = false;
    for (const { color, max } of order) {
      const room = max - stats[color];
      if (room <= 0) continue;
      const add = randInt(0, Math.min(room, remaining));
      if (add > 0) {
        stats[color] += add;
        remaining -= add;
        moved = true;
      }
      if (remaining <= 0) break;
    }
    if (!moved) break;
  }

  return stats;
}

function buildPlayers(roster, activeColors, ranges, pointTotal) {
  return roster.map((person, index) => ({
    id: `${person.id || person.name}-${index}`,
    name: person.name,
    image: getImage(person),
    stats: makeStats(activeColors, ranges, pointTotal),
    alive: true,
    placement: null,
  }));
}

function makeRound(players) {
  const alive = shuffle(players.filter((p) => p.alive));
  const matches = [];
  for (let i = 0; i < alive.length; i += 2) {
    matches.push({
      a: alive[i],
      b: alive[i + 1] || null,
      rolled: null,
      winnerId: null,
      loserId: null,
      tied: false,
    });
  }
  return matches;
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
    const active = modalCastId === cast.id;

    return (
      <button
        type="button"
        onClick={() => onChooseCast(cast.id)}
        className={`w-full rounded-2xl border-0 px-4 py-3 text-left font-black ${
          active ? "bg-rose-400 text-black" : "bg-zinc-950 text-white hover:bg-zinc-900"
        }`}
      >
        <div>{cast.name}</div>
        <div className="text-xs font-bold opacity-70">
          {cast.show_name || (cast.is_full_cast ? "Full Custom Cast" : cast.is_official ? "Official Cast" : "Custom Cast")}
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
            <p className="text-sm text-zinc-300">
              Pick individual contestants from custom casts or favorited official casts.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-white/10 p-4">
            {loadingCasts ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-zinc-300">
                Loading casts...
              </div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4 text-rose-100">
                No casts available yet.
              </div>
            ) : (
              <>
                {officialCasts.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                      Favorite Official Casts
                    </div>
                    <div className="space-y-2">
                      {officialCasts.map((cast) => (
                        <CastButton key={cast.id} cast={cast} />
                      ))}
                    </div>
                  </div>
                )}

                {customCasts.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                      Custom Casts
                    </div>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <CastButton key={cast.id} cast={cast} />
                      ))}
                    </div>
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
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={onSelectNone}
                  className="rounded-2xl border-0 bg-white/10 px-4 py-2 font-black text-white hover:bg-white/20"
                >
                  Select None
                </button>

                <button
                  type="button"
                  onClick={onAddSelected}
                  disabled={modalSelectedIds.size === 0}
                  className="rounded-2xl border-0 bg-rose-400 px-4 py-2 font-black text-black hover:bg-rose-300 disabled:opacity-40"
                >
                  Add Selected
                </button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">
                Loading contestants...
              </div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-zinc-300">
                No contestants found for this cast.
              </div>
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
                        active
                          ? "border-rose-300 ring-2 ring-rose-300/60"
                          : "border-white/10 opacity-45 grayscale"
                      }`}
                    >
                      {person.image_url ? (
                        <img
                          src={person.image_url}
                          className="h-full w-full object-cover"
                          alt={person.name}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-zinc-900 p-1 text-center text-xs font-black text-zinc-400">
                          No Image
                        </div>
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


export default function BattleFighters() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);
  const [roster, setRoster] = useState([]);

  const [screen, setScreen] = useState("menu");
  const [activeColors, setActiveColors] = useState(DEFAULT_ACTIVE);
  const [ranges, setRanges] = useState(
    Object.fromEntries(ALL_COLORS.map((c) => [c, { min: 0, max: 10 }]))
  );
  const [pointTotal, setPointTotal] = useState(35);

  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [roundNum, setRoundNum] = useState(1);
  const [log, setLog] = useState([]);
  const [champion, setChampion] = useState(null);
  const [competedIds, setCompetedIds] = useState([]);
  const [eliminatedOrder, setEliminatedOrder] = useState([]);

  const currentMatch = matches[matchIndex];

  const eliminatedRows = useMemo(() => {
    const ordered = eliminatedOrder
      .map((id) => players.find((p) => p.id === id))
      .filter(Boolean);

    const rows = [];

    for (let i = 0; i < ordered.length; i += 8) {
      rows.push(ordered.slice(i, i + 8));
    }

    return rows;
  }, [eliminatedOrder, players]);

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
      .select("id, name, show_name, created_at, is_official, is_full_cast")
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

    const selectedCast = availableCasts.find((cast) => cast.id === castId);

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

    if ((data || []).length > 0 || !selectedCast?.is_full_cast) {
      setModalContestants(data || []);
      setLoadingModalContestants(false);
      return;
    }

    const linkedContestants = await loadFullCustomCastContestants(castId);

    setModalContestants(linkedContestants);
    setLoadingModalContestants(false);
  }

  async function loadFullCustomCastContestants(castId) {
    const possibleLinks = [
      { table: "full_cast_members", castColumn: "full_cast_id" },
      { table: "full_cast_members", castColumn: "cast_id" },
      { table: "cast_members", castColumn: "full_cast_id" },
      { table: "cast_members", castColumn: "cast_id" },
    ];

    for (const link of possibleLinks) {
      const { data: linkRows, error: linkError } = await supabase
        .from(link.table)
        .select("contestant_id")
        .eq(link.castColumn, castId);

      if (linkError || !linkRows || linkRows.length === 0) continue;

      const contestantIds = [...new Set(linkRows.map((row) => row.contestant_id).filter(Boolean))];

      if (contestantIds.length === 0) continue;

      const { data: contestants, error: contestantsError } = await supabase
        .from("contestants")
        .select("id, name, image_url, cast_id")
        .in("id", contestantIds);

      if (!contestantsError && contestants?.length) {
        const byId = new Map(contestants.map((person) => [person.id, person]));
        return contestantIds.map((id) => byId.get(id)).filter(Boolean);
      }
    }

    return [];
  }

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));

    if (selectedPeople.length === 0) return;

    const additions = selectedPeople.map((person) => ({
      id: `${modalCastId}-${person.id}`,
      name: person.name,
      image: person.image_url || "",
    }));

    setRoster((current) => {
      const existing = new Set(current.map((player) => player.id));
      return [...current, ...additions.filter((person) => !existing.has(person.id))];
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function removeRosterPlayer(id) {
    setRoster((current) => current.filter((player) => player.id !== id));
  }

  function clearRoster() {
    if (!confirm("Clear Battle Fighters roster?")) return;
    setRoster([]);
    setPlayers([]);
    setMatches([]);
    setChampion(null);
    setCompetedIds([]);
    setEliminatedOrder([]);
    setLog([]);
    setScreen("menu");
  }



  function handlePrimaryAction() {
    if (screen === "roundPreview") {
      beginRound();
      return;
    }

    if (screen === "battle" && currentMatch) {
      if (!currentMatch.rolled || currentMatch.tied) {
        rollMatch();
        return;
      }

      if (currentMatch.winnerId && !currentMatch.tied) {
        advanceMatch();
        return;
      }
    }

    if (screen === "winner") {
      resetToMenu();
    }
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code !== "Space") return;

      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || showAddCastModal) return;

      e.preventDefault();
      handlePrimaryAction();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, currentMatch, showAddCastModal, matchIndex, matches, players, champion]);

  function statOutcomeFor(color, playerId) {
    if (!currentMatch || !currentMatch.b) return "neutral";
    const aScore = currentMatch.a.stats[color];
    const bScore = currentMatch.b.stats[color];
    if (aScore === bScore) return "tie";
    const winningId = aScore > bScore ? currentMatch.a.id : currentMatch.b.id;
    return winningId === playerId ? "win" : "lose";
  }

  function isTieColor(color) {
    if (!currentMatch || !currentMatch.b) return false;
    return currentMatch.a.stats[color] === currentMatch.b.stats[color];
  }

  const placements = useMemo(
    () => [...players].filter((p) => p.placement).sort((a, b) => b.placement - a.placement),
    [players]
  );

  const colorLimitReached = activeColors.length >= 20;
  const minPossibleTotal = activeColors.reduce((sum, color) => sum + clamp(ranges[color]?.min ?? 0, 0, 99), 0);
  const maxPossibleTotal = activeColors.reduce((sum, color) => sum + Math.max(clamp(ranges[color]?.min ?? 0, 0, 99), clamp(ranges[color]?.max ?? 10, 0, 99)), 0);
  const appliedPointTotal = clamp(pointTotal, minPossibleTotal, maxPossibleTotal);

  function toggleColor(color) {
    setActiveColors((prev) => {
      if (prev.includes(color)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== color);
      }
      if (prev.length >= 20) return prev;
      return [...prev, color];
    });
  }

  function updateRange(color, key, value) {
    setRanges((prev) => {
      const next = { ...prev, [color]: { ...prev[color], [key]: clamp(value, 0, 99) } };
      if (Number(next[color].min) > Number(next[color].max)) {
        if (key === "min") next[color].max = next[color].min;
        else next[color].min = next[color].max;
      }
      return next;
    });
  }

  function startGame() {
    if (roster.length < 2) {
      alert("Add at least 2 cast members first.");
      return;
    }

    const fixedPlayers = buildPlayers(roster, activeColors, ranges, pointTotal);
    const firstRound = makeRound(fixedPlayers);
    setPlayers(fixedPlayers);
    setMatches(firstRound);
    setMatchIndex(0);
    setRoundNum(1);
    setChampion(null);
    setCompetedIds([]);
    setEliminatedOrder([]);
    setLog([`Battle Fighters begins with ${fixedPlayers.length} fighters. Stat total: ${appliedPointTotal}.`]);
    setScreen("roundPreview");
  }

  function rollMatch() {
    if (!currentMatch) return;
    if (!currentMatch.b) {
      const updated = [...matches];
      updated[matchIndex] = {
        ...currentMatch,
        rolled: "bye",
        winnerId: currentMatch.a.id,
        loserId: null,
      };
      setMatches(updated);
      setLog((l) => [`${currentMatch.a.name} gets a bye and advances.`, ...l]);
      return;
    }

    const rolled = activeColors[randInt(0, activeColors.length - 1)];
    const aScore = currentMatch.a.stats[rolled];
    const bScore = currentMatch.b.stats[rolled];

    let winner = null;
    let loser = null;
    let tied = false;

    if (aScore > bScore) {
      winner = currentMatch.a;
      loser = currentMatch.b;
    } else if (bScore > aScore) {
      winner = currentMatch.b;
      loser = currentMatch.a;
    } else {
      tied = true;
    }

    const updated = [...matches];
    updated[matchIndex] = {
      ...currentMatch,
      rolled,
      winnerId: winner?.id || null,
      loserId: loser?.id || null,
      tied,
    };
    setMatches(updated);

    if (tied) {
      setLog((l) => [`${rolled.toUpperCase()} roll is a tie: ${currentMatch.a.name} ${aScore} - ${currentMatch.b.name} ${bScore}. Re-roll the tie.`, ...l]);
    } else {
      setLog((l) => [`${rolled.toUpperCase()} roll: ${winner.name} beats ${loser.name}, ${winner.stats[rolled]} to ${loser.stats[rolled]}.`, ...l]);
    }
  }

  function advanceMatch() {
    if (!currentMatch || !currentMatch.winnerId || currentMatch.tied) return;

    const remainingBefore = players.filter((p) => p.alive).length;
    let updatedPlayers = players.map((p) => {
      if (p.id === currentMatch.loserId) {
        return { ...p, alive: false, placement: remainingBefore };
      }
      return p;
    });

    const roundCompetitors = [currentMatch.a.id, currentMatch.b?.id].filter(Boolean);
    const aliveAfter = updatedPlayers.filter((p) => p.alive);
    setPlayers(updatedPlayers);
    setCompetedIds((prev) => Array.from(new Set([...prev, ...roundCompetitors])));

    if (currentMatch.loserId) {
      setEliminatedOrder((prev) => {
        if (prev.includes(currentMatch.loserId)) return prev;
        return [...prev, currentMatch.loserId];
      });
    }

    if (aliveAfter.length === 1) {
      setChampion(aliveAfter[0]);
      setScreen("winner");
      setLog((l) => [`${aliveAfter[0].name} is the Battle Fighters champion!`, ...l]);
      return;
    }

    if (matchIndex < matches.length - 1) {
      setMatchIndex(matchIndex + 1);
      return;
    }

    const nextRound = makeRound(updatedPlayers);
    setMatches(nextRound);
    setMatchIndex(0);
    setRoundNum(roundNum + 1);
    setCompetedIds([]);
    setScreen("roundPreview");
    setLog((l) => [`Round ${roundNum + 1} begins with ${aliveAfter.length} fighters.`, ...l]);
  }

  function beginRound() {
    setScreen("battle");
  }

  function resetToMenu() {
    setScreen("menu");
  }

  const StatPills = ({ player, highlightColor = null }) => (
    <div className="statGrid">
      {activeColors.map((color) => (
        <div
          key={color}
          className={`statPill ${highlightColor === color ? "rolledStat" : ""}`}
          title={color}
          style={{
            borderColor: highlightColor === color ? COLOR_STYLE[color] : "rgba(17,24,39,.18)",
          }}
        >
          <b
            className="statNumber"
            style={{ color: COLOR_STYLE[color] }}
          >
            {player.stats[color]}
          </b>
        </div>
      ))}
    </div>
  );

  const OutcomeBoxes = ({ playerId = null, mode = "player" }) => (
    <div className={`outcomeGrid ${mode}`}>
      {activeColors.map((color) => {
        const outcome = mode === "tie" ? (isTieColor(color) ? "tieOn" : "off") : statOutcomeFor(color, playerId);
        const lit = outcome === "win" || outcome === "tieOn";
        return (
          <div
            key={color}
            className={`outcomeBox ${lit ? "lit" : ""} ${outcome === "lose" ? "dim" : ""}`}
            title={mode === "tie" ? `${color} tie` : `${color} matchup`}
            style={{
              background: lit ? COLOR_STYLE[color] : "rgba(255,255,255,.15)",
              borderColor: COLOR_STYLE[color],
            }}
          />
        );
      })}
    </div>
  );

  const PlayerCard = ({ player, big = false, result = "", showOutcome = false, highlightColor = null, competedRound = false, currentlyBattling = false }) => (
    <div className={`card ${!player.alive ? "dead" : ""} ${currentlyBattling && player.alive ? "currentlyBattling" : ""} ${competedRound && player.alive && !currentlyBattling ? "competedRound" : ""} ${big ? "big" : ""} ${result}`}>
      {showOutcome && <OutcomeBoxes playerId={player.id} />}
      <img src={getImage(player)} alt={player.name} />
      <div className="name">{player.name}</div>
      <StatPills player={player} highlightColor={highlightColor} />
      {!player.alive && <div className="placement">#{player.placement}</div>}
    </div>
  );

  return (
    <div className="bfWrap">
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
          onToggleContestant={(id) =>
            setModalSelectedIds((current) => {
              const next = new Set(current);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
          onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))}
          onSelectNone={() => setModalSelectedIds(new Set())}
          onAddSelected={addSelectedContestantsToRoster}
        />
      )}

      <style>{`
        .bfWrap {
          min-height: 100vh;
          background: radial-gradient(circle at top, #2f2f46, #111118 58%, #050507);
          color: white;
          padding: 18px;
          font-family: Arial, Helvetica, sans-serif;
        }
        .panel {
          max-width: 1180px;
          margin: 0 auto;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
        }
        h1 {
          margin: 0 0 8px;
          font-size: 42px;
          letter-spacing: -1px;
          text-align: center;
        }
        h2 { margin: 8px 0 14px; }
        .sub {
          color: #d6d6e7;
          text-align: center;
          margin-bottom: 18px;
        }
        .bfGame button {
          border: 0;
          border-radius: 12px;
          padding: 11px 16px;
          font-weight: 800;
          cursor: pointer;
          background: #facc15;
          color: #111;
          box-shadow: 0 5px 0 #a16207;
        }
        .bfGame button:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }
        .menuGrid {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 16px;
        }
        .box {
          background: rgba(0,0,0,.24);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 18px;
          padding: 14px;
        }
        .colorToggles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .toggle {
          padding: 8px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.2);
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          user-select: none;
        }
        .toggle.on {
          outline: 2px solid #facc15;
          background: rgba(250,204,21,.14);
        }
        .swatch, .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: inline-block;
        }
        .rangeRows {
          max-height: 430px;
          overflow: auto;
          padding-right: 6px;
        }
        .rangeRow {
          display: grid;
          grid-template-columns: 95px 1fr 1fr;
          gap: 8px;
          align-items: center;
          margin-bottom: 7px;
        }
        .bfGame input {
          width: 100%;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,.18);
          padding: 8px;
          background: rgba(255,255,255,.08);
          color: white;
        }
        .castGrid {
          display: grid;
          grid-template-columns: repeat(8, minmax(90px, 1fr));
          gap: 10px;
        }
        .eliminatedShelf {
          display: flex;
          flex-direction: column-reverse;
          gap: 10px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 2px dashed rgba(255,255,255,.18);
        }
        .eliminatedShelfRow {
          display: grid;
          grid-template-columns: repeat(8, minmax(90px, 1fr));
          gap: 10px;
        }
        .card {
          position: relative;
          background: #f8fafc;
          color: #111827;
          border-radius: 14px;
          padding: 8px;
          text-align: center;
          border: 3px solid transparent;
          overflow: hidden;
        }
        .card.big {
          max-width: 300px;
          width: 100%;
          padding: 12px;
        }
        .card.win { border-color: #22c55e; box-shadow: 0 0 28px rgba(34,197,94,.45); }
        .card.lose { border-color: #ef4444; box-shadow: 0 0 28px rgba(239,68,68,.4); }
        .card.competedRound {
          border-color: #22c55e;
          background: #dcfce7;
          box-shadow: 0 0 18px rgba(34,197,94,.45);
        }
        .card.currentlyBattling {
          border-color: #f97316;
          background: #fed7aa;
          box-shadow: 0 0 20px rgba(249,115,22,.55);
        }
        .card.dead {
          background: #111;
          color: #eee;
        }
        .card.dead img {
          filter: grayscale(1);
          opacity: .45;
        }
        .card img {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 10px;
          background: #ddd;
        }
        .name {
          font-weight: 900;
          margin: 6px 0;
        }
        .statGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 3px;
          width: 100%;
        }
        .statPill {
          background: rgba(17,24,39,.08);
          border-radius: 4px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 27px;
          height: 27px;
          line-height: 1;
          border: 1px solid rgba(17,24,39,.18);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
          overflow: hidden;
        }
        .statPill.rolledStat {
          background: rgba(255,255,255,.82);
          transform: scale(1.04);
          box-shadow: 0 0 12px rgba(0,0,0,.35);
          z-index: 2;
        }
        .statNumber {
          font-size: 32px;
          line-height: .82;
          font-weight: 1000;
          letter-spacing: -1.5px;
          -webkit-text-stroke: 1.35px #111;
          text-shadow: 1px 0 #111, -1px 0 #111, 0 1px #111, 0 -1px #111, 1px 1px #111;
          display: block;
          transform: translateY(-1px);
        }
        .card.big .statGrid {
          gap: 3px;
        }
        .card.big .statPill {
          min-height: 31px;
          height: 31px;
          border-radius: 4px;
          padding: 0;
          border-width: 1px;
        }
        .card.big .statNumber {
          font-size: 36px;
          line-height: .82;
          letter-spacing: -1.8px;
          -webkit-text-stroke: 1.45px #111;
        }
        .outcomeGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
          margin-bottom: 8px;
          width: 100%;
        }
        .outcomeGrid.tie {
          margin: 0 0 10px;
        }
        .outcomeBox {
          height: 16px;
          border-radius: 5px;
          border: 2px solid;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.3);
          opacity: .5;
        }
        .outcomeBox.lit {
          opacity: 1;
          box-shadow: 0 0 12px currentColor, inset 0 0 0 1px rgba(0,0,0,.35);
        }
        .outcomeBox.dim {
          opacity: .18;
        }
        .placement {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #111;
          color: #fff;
          border-radius: 999px;
          padding: 4px 7px;
          font-weight: 900;
        }
        .topBar {
          max-width: 1180px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .battleArea {
          display: grid;
          grid-template-columns: 1fr 220px 1fr;
          gap: 16px;
          align-items: center;
          justify-items: center;
        }
        .diceStack {
          width: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dice {
          width: 170px;
          min-height: 170px;
          border-radius: 26px;
          background: #fff;
          color: #111;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: inset 0 -8px 0 rgba(0,0,0,.18), 0 10px 30px rgba(0,0,0,.35);
          padding: 12px;
          border: 3px solid #111;
          transition: background .2s ease, color .2s ease, transform .15s ease;
          cursor: pointer;
          user-select: none;
        }
        .dice.canRoll:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .dice.locked {
          cursor: default;
        }
        .diceColor {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          border: 2px solid #111;
          margin-bottom: 8px;
        }
        .versus {
          font-size: 22px;
          font-weight: 1000;
          margin: 0 0 12px;
        }
        .actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .log {
          max-height: 180px;
          overflow: auto;
          font-size: 13px;
          color: #e5e7eb;
        }
        .bottomMenu {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,.12);
        }
        .bfLinkButton {
          border: 0;
          border-radius: 12px;
          padding: 11px 16px;
          font-weight: 800;
          cursor: pointer;
          background: #fb7185;
          color: #111;
          box-shadow: 0 5px 0 #9f1239;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .emptyCastBox {
          border: 2px dashed rgba(255,255,255,.2);
          border-radius: 16px;
          padding: 28px;
          color: #d6d6e7;
          font-weight: 900;
          text-align: center;
        }
        .rosterCard {
          position: relative;
        }
        .removeRoster {
          position: absolute;
          top: -7px;
          right: -7px;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: #ef4444 !important;
          color: white !important;
          box-shadow: none !important;
          padding: 0 !important;
          z-index: 3;
        }
        .winner {
          text-align: center;
        }
        .winner .card {
          margin: 0 auto;
          border-color: #facc15;
          box-shadow: 0 0 50px rgba(250,204,21,.45);
        }
        @media (max-width: 850px) {
          .menuGrid, .battleArea { grid-template-columns: 1fr; }
          .castGrid { grid-template-columns: repeat(4, 1fr); }
          .eliminatedShelfRow { grid-template-columns: repeat(8, minmax(70px, 1fr)); }
          h1 { font-size: 32px; }
        }
      `}</style>

      <div className="bfGame">
      {screen === "menu" && (
        <div className="panel">
          <h1>Battle Fighters</h1>
          <div className="sub">Random 1v1 stat battles. Roll a color. Higher stat survives.</div>

          <div className="menuGrid">
            <div className="box">
              <h2>Choose Active Stats ({activeColors.length}/20)</h2>
              <div className="colorToggles">
                {ALL_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`toggle ${activeColors.includes(color) ? "on" : ""}`}
                    onClick={() => toggleColor(color)}
                    title={!activeColors.includes(color) && colorLimitReached ? "20 stat max" : ""}
                  >
                    <span
                      className="swatch"
                      style={{
                        background: COLOR_STYLE[color],
                        border: color === "white" ? "1px solid #111" : "none",
                      }}
                    />
                    {color}
                  </div>
                ))}
              </div>

              <h2 style={{ marginTop: 18 }}>Starting Cast ({roster.length})</h2>
              <div className="actions" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
                <button onClick={openAddCastModal}>Add Cast Members</button>
                {roster.length > 0 && <button onClick={clearRoster}>Clear Roster</button>}
                <Link href="/custom-casts" className="bfLinkButton">Manage Casts</Link>
              </div>

              {roster.length === 0 ? (
                <div className="emptyCastBox">No cast members added yet.</div>
              ) : (
                <div className="castGrid">
                  {roster.map((player) => (
                    <div className="card rosterCard" key={player.id}>
                      <button
                        className="removeRoster"
                        onClick={() => removeRosterPlayer(player.id)}
                        title="Remove"
                      >
                        ×
                      </button>
                      <img src={getImage(player)} alt={player.name} />
                      <div className="name">{player.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="box">
              <h2>Total Points</h2>
              <p className="sub" style={{ textAlign: "left", marginTop: -6 }}>
                Default is 35. If the total is outside the current min/max limits, the game uses the closest possible total.
              </p>
              <input
                type="number"
                value={pointTotal}
                onChange={(e) => setPointTotal(clamp(e.target.value, 0, 999))}
                min="0"
              />
              <div className="sub" style={{ textAlign: "left", marginTop: 8, marginBottom: 14 }}>
                Current possible total: {minPossibleTotal}-{maxPossibleTotal}. This game will use {appliedPointTotal}.
              </div>

              <h2>Range Per Stat</h2>
              <p className="sub" style={{ textAlign: "left", marginTop: -6 }}>
                Defaults are 0-10. Stats stay fixed for the whole simulation.
              </p>
              <div className="rangeRows">
                {activeColors.map((color) => (
                  <div className="rangeRow" key={color}>
                    <div>
                      <span
                        className="swatch"
                        style={{
                          background: COLOR_STYLE[color],
                          border: color === "white" ? "1px solid #111" : "none",
                        }}
                      />{" "}
                      {color}
                    </div>
                    <input
                      type="number"
                      value={ranges[color]?.min ?? 0}
                      onChange={(e) => updateRange(color, "min", e.target.value)}
                      min="0"
                    />
                    <input
                      type="number"
                      value={ranges[color]?.max ?? 10}
                      onChange={(e) => updateRange(color, "max", e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
              <div className="actions">
                <button onClick={startGame} disabled={roster.length < 2}>Start Battle ({roster.length})</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {screen === "roundPreview" && (
        <div className="panel">
          <h1>Round {roundNum}</h1>
          <div className="sub">
            {players.filter((p) => p.alive).length} fighters remain. Preview the field, then advance to the next set of battles.
          </div>
          <div className="castGrid">
            {players.filter((p) => p.alive).map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
          <div className="actions">
            <button onClick={beginRound}>Advance to Battles</button>
          </div>
          <div className="actions bottomMenu">
            <button onClick={resetToMenu}>Main Menu</button>
          </div>
        </div>
      )}

      {screen === "battle" && currentMatch && (
        <>
          <div className="topBar">
            <h1 style={{ margin: 0 }}>Battle Fighters</h1>
            <div>
              Round {roundNum} · Match {matchIndex + 1}/{matches.length} · Alive:{" "}
              {players.filter((p) => p.alive).length} · Spacebar rolls/advances
            </div>
          </div>

          <div className="panel">
            <div className="battleArea">
              <PlayerCard
                player={currentMatch.a}
                big
                showOutcome={!!currentMatch.b}
                highlightColor={currentMatch.rolled && currentMatch.rolled !== "bye" ? currentMatch.rolled : null}
                result={currentMatch.winnerId === currentMatch.a.id ? "win" : currentMatch.loserId === currentMatch.a.id ? "lose" : ""}
              />

              <div className="diceStack">
                {currentMatch.b && <OutcomeBoxes mode="tie" />}
                <div
                  className={`dice ${(!currentMatch.rolled || currentMatch.tied) ? "canRoll" : "locked"}`}
                  onClick={() => {
                    if (!currentMatch.rolled || currentMatch.tied) rollMatch();
                  }}
                  style={{
                    background: currentMatch.rolled && currentMatch.rolled !== "bye" ? COLOR_STYLE[currentMatch.rolled] : "#fff",
                    color: currentMatch.rolled === "black" || currentMatch.rolled === "navy" || currentMatch.rolled === "forest" || currentMatch.rolled === "charcoal" ? "#fff" : "#111",
                  }}
                >
                  {currentMatch.rolled && currentMatch.rolled !== "bye" ? (
                    <>
                      <b>{currentMatch.rolled.toUpperCase()}</b>
                      {currentMatch.b && (
                        <div style={{ marginTop: 8, fontWeight: 900 }}>
                          {currentMatch.a.stats[currentMatch.rolled]} - {currentMatch.b.stats[currentMatch.rolled]}
                        </div>
                      )}
                    </>
                  ) : currentMatch.rolled === "bye" ? (
                    <b>BYE</b>
                  ) : (
                    <b>Roll Dice</b>
                  )}
                </div>
              </div>

              {currentMatch.b ? (
                <PlayerCard
                  player={currentMatch.b}
                  big
                  showOutcome={!!currentMatch.b}
                  highlightColor={currentMatch.rolled && currentMatch.rolled !== "bye" ? currentMatch.rolled : null}
                  result={currentMatch.winnerId === currentMatch.b.id ? "win" : currentMatch.loserId === currentMatch.b.id ? "lose" : ""}
                />
              ) : (
                <div className="card big">
                  <div style={{ padding: 40, fontWeight: 900 }}>No opponent<br />Automatic bye</div>
                </div>
              )}
            </div>

            <div className="actions">
              {currentMatch.tied && (
                <button onClick={rollMatch}>Re-Roll Tie</button>
              )}
              <button
                onClick={advanceMatch}
                disabled={!currentMatch.winnerId || currentMatch.tied}
              >
                Advance
              </button>
            </div>

            <div className="box" style={{ marginTop: 16 }}>
              <h2>Battle Log</h2>
              <div className="log">
                {log.map((item, i) => (
                  <div key={i}>• {item}</div>
                ))}
              </div>
            </div>

            <div className="box" style={{ marginTop: 16 }}>
              <h2>Full Cast</h2>
              <div className="castGrid aliveGrid">
                {players
                  .filter((p) => p.alive)
                  .map((p) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      competedRound={competedIds.includes(p.id)}
                      currentlyBattling={p.id === currentMatch.a.id || p.id === currentMatch.b?.id}
                    />
                  ))}
              </div>

              {eliminatedRows.length > 0 && (
                <div className="eliminatedShelf">
                  {eliminatedRows.map((row, rowIndex) => (
                    <div className="eliminatedShelfRow" key={`elim-row-${rowIndex}`}>
                      {row.map((p, slotIndex) => (
                        <div
                          key={p.id}
                          style={{ gridColumn: `${8 - slotIndex} / ${9 - slotIndex}` }}
                        >
                          <PlayerCard player={p} competedRound={false} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="actions bottomMenu">
              <button onClick={resetToMenu}>Main Menu</button>
            </div>
          </div>
        </>
      )}

      {screen === "winner" && champion && (
        <div className="panel winner">
          <h1>🏆 Battle Fighters Champion 🏆</h1>
          <PlayerCard player={champion} big />
          <div className="actions">
            <button onClick={resetToMenu}>Back to Main Menu</button>
            <button onClick={startGame}>Run Again</button>
          </div>

          <div className="box" style={{ marginTop: 18 }}>
            <h2>Placements</h2>
            <div className="castGrid">
              {[champion, ...placements].map((p) => <PlayerCard key={p.id} player={p} />)}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
