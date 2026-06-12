// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getImage(player) {
  return player?.image || player?.img || player?.image_url || "";
}

function getPlayer(players, id) {
  return players.find((p) => p.id === id);
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}


const HIGHLIGHT_GROUPS = [
  { dark: "#991b1b", light: "#fecaca", border: "#ef4444" },
  { dark: "#166534", light: "#bbf7d0", border: "#22c55e" },
  { dark: "#1d4ed8", light: "#bfdbfe", border: "#3b82f6" },
  { dark: "#7e22ce", light: "#e9d5ff", border: "#a855f7" },
  { dark: "#c2410c", light: "#fed7aa", border: "#f97316" },
  { dark: "#0f766e", light: "#99f6e4", border: "#14b8a6" },
  { dark: "#be185d", light: "#fbcfe8", border: "#ec4899" },
  { dark: "#854d0e", light: "#fef08a", border: "#eab308" },
];

function getVoteCountEntries(players, counts) {
  return Object.entries(counts)
    .map(([id, count]) => ({
      id,
      player: getPlayer(players, id),
      count,
    }))
    .filter((entry) => entry.player)
    .sort((a, b) => b.count - a.count || String(a.player.name).localeCompare(String(b.player.name)));
}

function getFinalVoteHighlightMap(players, votes) {
  if (!votes.length || votes.some((vote) => !vote.revealed)) {
    return { targetColors: {}, voterColors: {}, tiedTargetIds: [] };
  }

  const counts = {};
  votes.forEach((vote) => {
    counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  });

  const entries = getVoteCountEntries(players, counts);
  const highest = entries[0]?.count || 0;
  const tiedTargets = entries.filter((entry) => entry.count === highest && highest > 0);
  const targetColors = {};
  const voterColors = {};

  tiedTargets.forEach((entry, index) => {
    const group = HIGHLIGHT_GROUPS[index % HIGHLIGHT_GROUPS.length];
    targetColors[entry.id] = {
      dark: group.dark,
      light: group.light,
      border: group.border,
    };

    votes
      .filter((vote) => String(vote.targetId) === String(entry.id))
      .forEach((vote) => {
        if (!voterColors[vote.voterId]) voterColors[vote.voterId] = [];
        voterColors[vote.voterId].push(group.light);
      });
  });

  return {
    targetColors,
    voterColors,
    tiedTargetIds: tiedTargets.map((entry) => entry.id),
  };
}

function getVoteCardHighlightStyle(playerId, finalHighlights) {
  const targetColor = finalHighlights.targetColors[playerId];
  const voterColors = finalHighlights.voterColors[playerId] || [];
  const colors = [];

  if (targetColor?.dark) colors.push(targetColor.dark);
  voterColors.forEach((color) => {
    if (!colors.includes(color)) colors.push(color);
  });

  if (colors.length === 0) return {};

  if (colors.length === 1) {
    const isLight = colors[0].startsWith("#f") || colors[0].startsWith("#e") || colors[0].startsWith("#b") || colors[0].startsWith("#a") || colors[0].startsWith("#9");
    return {
      background: colors[0],
      borderColor: targetColor?.border || colors[0],
      color: isLight && !targetColor?.dark ? "#111827" : "white",
    };
  }

  const step = 100 / colors.length;
  const gradient = colors
    .map((color, index) => `${color} ${index * step}%, ${color} ${(index + 1) * step}%`)
    .join(", ");

  return {
    background: `linear-gradient(90deg, ${gradient})`,
    borderColor: targetColor?.border || "#ffffff",
    color: "white",
  };
}

function VoteCountCard({ player, count }) {
  const image = getImage(player);

  return (
    <div
      style={{
        width: 86,
        height: 112,
        minWidth: 86,
        maxWidth: 86,
        background: "#242424",
        border: "2px solid #555",
        borderRadius: 12,
        padding: 6,
        display: "grid",
        gridTemplateRows: "50px 26px 24px",
        justifyItems: "center",
        alignItems: "center",
        gap: 2,
        overflow: "hidden",
        boxSizing: "border-box",
        flex: "0 0 86px",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          minWidth: 48,
          minHeight: 48,
          maxWidth: 48,
          maxHeight: 48,
          overflow: "hidden",
          borderRadius: 9,
          background: "#111827",
          border: "2px solid rgba(255,255,255,.35)",
          boxSizing: "border-box",
          display: "block",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={player.name}
            style={{
              width: 48,
              height: 48,
              minWidth: 48,
              minHeight: 48,
              maxWidth: 48,
              maxHeight: 48,
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              borderRadius: 7,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              display: "grid",
              placeItems: "center",
              color: "#94a3b8",
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            ?
          </div>
        )}
      </div>

      <div
        style={{
          width: "100%",
          height: 24,
          fontSize: 10,
          fontWeight: 900,
          lineHeight: 1.05,
          textAlign: "center",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {player.name}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 950,
          lineHeight: 1,
          color: "#ff1493",
        }}
      >
        {count}
      </div>
    </div>
  );
}


function makeAlliances(players, oldAlliances = []) {
  const livingIds = players.filter((p) => !p.eliminated).map((p) => p.id);

  const keptAlliances = oldAlliances
    .map((alliance) =>
      alliance
        .filter((id) => livingIds.includes(id))
        .filter(() => Math.random() > 0.03)
    )
    .filter((alliance) => alliance.length >= 2);

  const alreadyAllied = new Set(keptAlliances.flat());
  const freePlayers = livingIds.filter((id) => !alreadyAllied.has(id));
  const shuffled = [...freePlayers].sort(() => Math.random() - 0.5);
  const newAlliances = [...keptAlliances];

  let i = 0;
  while (i < shuffled.length) {
    if (Math.random() < 0.35) {
      i++;
      continue;
    }

    const size = Math.floor(Math.random() * 5) + 2;
    const group = shuffled.slice(i, i + size);

    if (group.length >= 2) newAlliances.push(group);
    i += size;
  }

  return newAlliances;
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
        className={`w-full rounded-2xl px-4 py-3 text-left font-black ${
          modalCastId === cast.id
            ? "bg-pink-500 text-white"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
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
                <button type="button" onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl bg-pink-500 px-4 py-2 font-black text-white hover:bg-pink-400 disabled:opacity-40">Add Selected</button>
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
                        active ? "border-pink-300 ring-2 ring-pink-300/60" : "border-white/10 opacity-45 grayscale"
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

function PlayerCard({ player, eliminated, compact, tiny, status, highlightStyle = null }) {
  if (!player) return null;
  const image = getImage(player);

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 8,
        position: "relative",
        width: tiny ? 70 : compact ? 120 : 150,
        border:
          highlightStyle?.borderColor
            ? `4px solid ${highlightStyle.borderColor}`
            : status === "win"
              ? "4px solid #18d45b"
              : status === "lose" || status === "different"
                ? "4px solid #ff3333"
                : "2px solid #555",
        background:
          highlightStyle?.background ||
          (status === "win"
            ? "#0f3d20"
            : status === "lose" || status === "different"
              ? "#401111"
              : "#222"),
        color: highlightStyle?.color || "white",
        opacity: eliminated ? 0.35 : 1,
      }}
    >
      {image ? (
        <img
          src={image}
          alt={player.name}
          style={{
            width: "100%",
            height: tiny ? 64 : compact ? 110 : 145,
            objectFit: "cover",
            borderRadius: 8,
            filter: eliminated || status === "lose" ? "grayscale(1)" : "none",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: compact ? 110 : 145, borderRadius: 8, background: "#111827", display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900, fontSize: 12 }}>
          No Image
        </div>
      )}
      <div style={{ fontWeight: "bold", marginTop: tiny ? 4 : 8, fontSize: tiny ? 10 : undefined, lineHeight: tiny ? 1.05 : undefined }}>{player.name}</div>
      {status === "win" && !tiny && <div style={styles.winText}>WINNER</div>}
      {status === "lose" && !tiny && <div style={styles.loseText}>ELIMINATED</div>}
      {eliminated && !status && !tiny && <div style={styles.loseText}>ELIMINATED</div>}
    </div>
  );
}

export default function CallOutSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [players, setPlayers] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [votes, setVotes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [screen, setScreen] = useState("cast");
  const [history, setHistory] = useState([]);
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const active = players.filter((p) => !p.eliminated);
  const winner = active.length === 1 ? active[0] : null;
  const currentMatch = matches[matchIndex];

  useEffect(() => {
    loadSavedCasts();
  }, []);

  function addHistory(nextScreen, nextPlayers = players, nextAlliances = alliances, nextVotes = votes, nextMatches = matches, nextMatchIndex = matchIndex) {
    setHistory((prev) => [
      ...prev,
      {
        screen: nextScreen,
        round,
        players: cloneData(nextPlayers),
        alliances: cloneData(nextAlliances),
        votes: cloneData(nextVotes),
        matches: cloneData(nextMatches),
        matchIndex: nextMatchIndex,
      },
    ]);
  }

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
    if (!modalCastId && availableCasts.length > 0) await loadContestantsForModal(availableCasts[0].id);
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
      eliminated: false,
    }));

    setPlayers((current) => {
      const existing = new Set(current.map((player) => player.id));
      return [...current, ...additions.filter((person) => !existing.has(person.id))];
    });

    setScreen("cast");
    setHistory([]);
    setVotes([]);
    setMatches([]);
    setAlliances([]);
    setMatchIndex(0);
    setRound(1);
    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function removePlayer(id) {
    if (screen !== "cast" || round !== 1 || votes.length || matches.length) return;
    setPlayers((old) => old.filter((p) => p.id !== id));
  }

  function clearRoster() {
    if (!confirm("Clear Call Out roster?")) return;
    setPlayers([]);
    setAlliances([]);
    setVotes([]);
    setMatches([]);
    setMatchIndex(0);
    setRound(1);
    setScreen("cast");
    setHistory([]);
  }

  function resetGame() {
    setPlayers((old) => old.map((p) => ({ ...p, eliminated: false })));
    setAlliances([]);
    setVotes([]);
    setMatches([]);
    setMatchIndex(0);
    setRound(1);
    setScreen("cast");
    setHistory([]);
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
  }

  function allianceOf(id) {
    return alliances.find((a) => a.includes(id)) || [];
  }

  function generateVotes(currentPlayers) {
    const alliancePlans = {};
    for (const alliance of alliances) {
      const livingAlliance = alliance.filter((id) => currentPlayers.some((p) => p.id === id));
      if (livingAlliance.length < 2) continue;
      const possibleTargets = currentPlayers.filter((p) => !livingAlliance.includes(p.id));
      if (possibleTargets.length) alliancePlans[livingAlliance.join("-")] = rand(possibleTargets).id;
    }

    return currentPlayers.map((voter) => {
      const allies = allianceOf(voter.id).filter((id) => id !== voter.id);
      const possibleTargets = currentPlayers.filter((p) => p.id !== voter.id);
      const planKey = Object.keys(alliancePlans).find((key) => key.split("-").includes(String(voter.id)));
      let targetId;
      if (planKey && Math.random() < 0.75) {
        targetId = alliancePlans[planKey];
      } else {
        const nonAllies = possibleTargets.filter((p) => !allies.includes(p.id));
        targetId = rand(nonAllies.length ? nonAllies : possibleTargets).id;
      }
      return { voterId: voter.id, targetId, revealed: false };
    });
  }

  function startRound() {
    if (active.length < 2) return;
    addHistory("cast");

    if (active.length === 2) {
      const [a, b] = active;
      const nextMatches = [{ sentInId: a.id, voterIds: [], unavailableVoterIds: [], eligibleCallOutIds: [b.id], callOutId: b.id, safe: false, callOutRevealed: true }];
      setMatches(nextMatches);
      setMatchIndex(0);
      setScreen("elimination");
      addHistory("elimination", players, alliances, [], nextMatches, 0);
      return;
    }

    const nextAlliances = makeAlliances(players, alliances);
    setAlliances(nextAlliances);
    setScreen("alliances");
    addHistory("alliances", players, nextAlliances, [], [], 0);
  }

  function advanceFromAlliances() {
    const nextVotes = generateVotes(active);
    setVotes(nextVotes);
    setScreen("votes");
    addHistory("votes", players, alliances, nextVotes, [], 0);
  }

  function revealVote(voterId) {
    setVotes((old) => old.map((v) => (v.voterId === voterId ? { ...v, revealed: true } : v)));
  }

  function revealAllVotes() {
    setVotes((old) => old.map((v) => ({ ...v, revealed: true })));
  }

  const revealedVoteCounts = useMemo(() => {
    const counts = {};
    votes.forEach((v) => {
      if (v.revealed) counts[v.targetId] = (counts[v.targetId] || 0) + 1;
    });
    return counts;
  }, [votes]);

  const voteCountEntries = useMemo(
    () => getVoteCountEntries(players, revealedVoteCounts),
    [players, revealedVoteCounts]
  );

  const allVotesRevealed = votes.length > 0 && votes.every((vote) => vote.revealed);

  const finalVoteHighlights = useMemo(
    () => getFinalVoteHighlightMap(players, votes),
    [players, votes]
  );


  function advanceFromVotes() {
    const counts = {};
    votes.forEach((v) => {
      counts[v.targetId] = (counts[v.targetId] || 0) + 1;
    });

    const highest = Math.max(...Object.values(counts));
    const sentInIds = Object.entries(counts).filter(([, count]) => count === highest).map(([id]) => id);

    if (sentInIds.length > Math.floor(active.length / 2)) {
      const nextVotes = generateVotes(active);
      setVotes(nextVotes);
      addHistory("votes", players, alliances, nextVotes, [], 0);
      return;
    }

    const alreadyInElimination = new Set(sentInIds);
    const newMatches = [];

    sentInIds.forEach((sentInId) => {
      const allVotersAgainstThem = votes.filter((v) => v.targetId === sentInId).map((v) => v.voterId);
      const unavailableVoterIds = allVotersAgainstThem.filter((id) => alreadyInElimination.has(id));
      const eligibleCallOutIds = allVotersAgainstThem.filter((id) => !alreadyInElimination.has(id));
      const finalEligible = eligibleCallOutIds;
      const callOutId = finalEligible.length > 0 ? rand(finalEligible) : null;
      const safe = finalEligible.length === 0;

      if (callOutId) alreadyInElimination.add(callOutId);

      newMatches.push({
        sentInId,
        voterIds: allVotersAgainstThem,
        unavailableVoterIds,
        eligibleCallOutIds: finalEligible,
        callOutId,
        safe,
        callOutRevealed: safe ? true : false,
      });
    });

    setMatches(newMatches);
    setMatchIndex(0);
    setScreen("callout");
    addHistory("callout", players, alliances, votes.map((v) => ({ ...v, revealed: true })), newMatches, 0);
  }

  function revealCallOut() {
    const nextMatches = matches.map((m, i) => i === matchIndex ? { ...m, callOutRevealed: true } : m);
    setMatches(nextMatches);
    addHistory("callout", players, alliances, votes, nextMatches, matchIndex);
  }

  function advanceFromCallOut() {
    const match = matches[matchIndex];

    if (match?.safe) {
      if (matchIndex < matches.length - 1) {
        const nextIndex = matchIndex + 1;
        setMatchIndex(nextIndex);
        setScreen("callout");
        addHistory("callout", players, alliances, votes, matches, nextIndex);
        return;
      }

      const remainingAfterRound = players.filter((p) => !p.eliminated);

      if (remainingAfterRound.length <= 1) {
        setScreen("winner");
        addHistory("winner", players, alliances, votes, matches, matchIndex);
      } else {
        setRound((r) => r + 1);
        setVotes([]);
        setMatches([]);
        setMatchIndex(0);
        setScreen("cast");
      }

      return;
    }

    setScreen("elimination");
    addHistory("elimination", players, alliances, votes, matches, matchIndex);
  }

  function revealEliminationResult() {
    const match = matches[matchIndex];
    if (!match || match.safe || !match.callOutId) return;
    const winnerId = Math.random() < 0.5 ? match.sentInId : match.callOutId;
    const loserId = winnerId === match.sentInId ? match.callOutId : match.sentInId;
    const nextMatches = matches.map((m, i) => i === matchIndex ? { ...m, winnerId, loserId, resultRevealed: true } : m);
    const nextPlayers = players.map((p) => (p.id === loserId ? { ...p, eliminated: true } : p));
    setMatches(nextMatches);
    setPlayers(nextPlayers);
    addHistory("elimination", nextPlayers, alliances, votes, nextMatches, matchIndex);
  }

  function advanceFromElimination() {
    const currentMatch = matches[matchIndex];
    if (!currentMatch?.resultRevealed) {
      revealEliminationResult();
      return;
    }
    if (matchIndex < matches.length - 1) {
      const nextIndex = matchIndex + 1;
      setMatchIndex(nextIndex);
      setScreen("callout");
      addHistory("callout", players, alliances, votes, matches, nextIndex);
      return;
    }
    const remainingAfterRound = players.filter((p) => !p.eliminated);
    if (remainingAfterRound.length <= 1) {
      setScreen("winner");
      addHistory("winner", players, alliances, votes, matches, matchIndex);
    } else {
      setRound((r) => r + 1);
      setVotes([]);
      setMatches([]);
      setMatchIndex(0);
      setScreen("cast");
    }
  }

  async function saveSeason() {
    if (!winner) {
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
        simulator_type: "call-out",
        title: seasonTitle.trim() || "Call Out Season",
        summary: seasonSummary.trim() || `${winner.name} won a Call Out simulation with ${players.length} players.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: { simulator_type: "call-out", history, players, winner, rounds: round },
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

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Call Out</h1>
          <h2 style={styles.subtitle}>Round {round}</h2>
        </div>
        <div style={styles.headerButtons}>
          {screen === "cast" && (
            <>
              <button style={styles.hotButton} onClick={openAddCastModal}>Add Cast Members</button>
              {players.length > 0 && <button style={styles.darkButton} onClick={clearRoster}>Clear Roster</button>}
              <Link href="/custom-casts" style={styles.linkButton}>Manage Casts</Link>
            </>
          )}
        </div>
      </div>

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

      {screen === "cast" && (
        <>
          <h2>Cast Remaining: {active.length}</h2>

          <div style={styles.topButtonRow}>
            <button style={styles.button} onClick={startRound} disabled={active.length < 2}>Advance</button>
          </div>

          {players.length === 0 ? <div style={styles.emptyBox}>Add cast members to begin.</div> : (
            <div style={styles.castGridSmall}>
              {players.map((p) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <PlayerCard player={p} eliminated={!!p.eliminated} tiny />
                  {round === 1 && !votes.length && !matches.length && <button style={styles.removeButtonSmall} onClick={() => removePlayer(p.id)}>×</button>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {screen === "alliances" && (
        <>
          <h2>Alliances</h2>
          <div style={styles.topButtonRow}>
            <button style={styles.button} onClick={advanceFromAlliances}>Advance to Votes</button>
          </div>
          {alliances.length === 0 && <h3>No alliances this round</h3>}
          <div style={styles.allianceGrid}>
            {alliances.map((alliance, i) => (
              <div key={i} style={styles.allianceBox}>
                <h3>Alliance {i + 1}</h3>
                <div style={styles.miniRow}>{alliance.map((id) => { const p = getPlayer(players, id); return p ? <PlayerCard key={id} player={p} compact /> : null; })}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {screen === "votes" && (
        <>
          <h2>Vote Reveal</h2>

          <div style={styles.topButtonRow}>
            <button style={styles.button} onClick={revealAllVotes}>Reveal All</button>
            <button style={styles.button} onClick={advanceFromVotes}>Advance</button>
          </div>

          <div style={styles.liveCountGrid}>
            {voteCountEntries.length === 0 ? (
              <div style={styles.noVotesBox}>No votes revealed yet</div>
            ) : (
              voteCountEntries.map(({ id, player, count }) => (
                <VoteCountCard key={id} player={player} count={count} />
              ))
            )}
          </div>

          <div style={styles.voteGrid}>
            {active.map((p) => {
              const vote = votes.find((v) => v.voterId === p.id);
              const target = getPlayer(players, vote?.targetId);
              const highlightStyle = allVotesRevealed ? getVoteCardHighlightStyle(p.id, finalVoteHighlights) : {};

              return (
                <div key={p.id} style={{ ...styles.voteCard, ...highlightStyle }}>
                  <PlayerCard player={p} compact highlightStyle={highlightStyle} />

                  <button style={styles.revealBox} onClick={() => revealVote(p.id)}>
                    {vote?.revealed && target ? <div style={styles.revealedVote}><img src={getImage(target)} style={styles.voteImg} /><strong>{target.name}</strong></div> : "?"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {screen === "callout" && currentMatch && (
        <>
          <h2>Call Out {matchIndex + 1} of {matches.length}</h2>

          <div style={styles.topButtonRow}>
            <button
              style={{ ...styles.button, opacity: currentMatch.callOutRevealed || currentMatch.safe ? 1 : 0.5 }}
              onClick={currentMatch.callOutRevealed || currentMatch.safe ? advanceFromCallOut : undefined}
            >
              {currentMatch.safe ? "Advance - Safe" : "Advance to Elimination"}
            </button>
          </div>

          <h3>People who voted them in</h3>
          <div style={styles.topLine}>
            {currentMatch.voterIds.map((id) => {
              const p = getPlayer(players, id);
              if (!p) return null;
              const inDifferentElimination = currentMatch.unavailableVoterIds.includes(id);
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
              <div style={styles.safeSubtext}>
                Everyone who voted for them is already in another elimination.
              </div>
            </div>
          )}

          <h3>Voted Into Elimination</h3>
          <div style={styles.callOutMain}>
            <PlayerCard player={getPlayer(players, currentMatch.sentInId)} compact />

            {!currentMatch.safe && (
              <button style={styles.revealBox} onClick={revealCallOut}>
                {currentMatch.callOutRevealed && currentMatch.callOutId ? <div style={styles.revealedVote}><img src={getImage(getPlayer(players, currentMatch.callOutId))} style={styles.voteImg} /><strong>{getPlayer(players, currentMatch.callOutId)?.name}</strong></div> : "?"}
              </button>
            )}
          </div>
        </>
      )}

      {screen === "elimination" && currentMatch && (
        <>
          <h2>Elimination {matchIndex + 1} of {matches.length}</h2>

          <div style={styles.topButtonRow}>
            <button style={styles.button} onClick={advanceFromElimination}>{currentMatch.resultRevealed ? "Advance" : "Reveal Result"}</button>
          </div>

          <div style={styles.duelRow}>
            <PlayerCard player={getPlayer(players, currentMatch.sentInId)} compact status={currentMatch.resultRevealed ? currentMatch.winnerId === currentMatch.sentInId ? "win" : "lose" : undefined} />
            <strong style={styles.vs}>VS</strong>
            <PlayerCard player={getPlayer(players, currentMatch.callOutId)} compact status={currentMatch.resultRevealed ? currentMatch.winnerId === currentMatch.callOutId ? "win" : "lose" : undefined} />
          </div>
        </>
      )}

      {screen === "winner" && winner && (
        <>
          <h2>Winner</h2>
          <div style={{ maxWidth: 260, margin: "0 auto" }}><PlayerCard player={winner} /></div>
          <div style={styles.saveBox}>
            <input value={seasonTitle} onChange={(e) => setSeasonTitle(e.target.value)} placeholder="Season title" style={styles.input} />
            <textarea value={seasonSummary} onChange={(e) => setSeasonSummary(e.target.value)} placeholder="Season summary" style={styles.textarea} />
            <label style={styles.checkboxLabel}><input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} /> Public season</label>
            <button style={styles.hotButton} onClick={saveSeason} disabled={savingSeason}>{savingSeason ? "Saving..." : "Save Season"}</button>
          </div>
          <button style={styles.button} onClick={resetGame}>Main Menu</button>
        </>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#111", color: "white", padding: 20, fontFamily: "Arial, sans-serif", textAlign: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", maxWidth: 1200, margin: "0 auto 18px" },
  headerButtons: { display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  title: { fontSize: 46, margin: 0, color: "#ff1493", fontWeight: 900 },
  subtitle: { marginTop: 6, color: "#ddd" },
  emptyBox: { background: "#1f1f1f", border: "2px dashed #555", borderRadius: 16, padding: 28, maxWidth: 700, margin: "20px auto", color: "#ddd", fontWeight: 900 },
  grid: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 20 },
  castGridSmall: { display: "grid", gridTemplateColumns: "repeat(14, 70px)", justifyContent: "center", gap: 8, marginTop: 18 },
  topButtonRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "8px auto 18px" },
  winText: { color: "#5cff91", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  loseText: { color: "#ff7777", fontSize: 12, fontWeight: "bold", marginTop: 4 },
  button: { margin: 12, padding: "12px 22px", fontSize: 18, fontWeight: "bold", borderRadius: 10, cursor: "pointer", border: "none" },
  hotButton: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#ff1493", color: "white" },
  darkButton: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#374151", color: "white" },
  linkButton: { margin: 6, padding: "12px 18px", fontSize: 16, fontWeight: "bold", borderRadius: 999, cursor: "pointer", border: "none", background: "#4b5563", color: "white", textDecoration: "none" },
  removeButton: { position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: 999, border: "none", background: "#ef4444", color: "#fff", fontWeight: 900, cursor: "pointer" },
  removeButtonSmall: { position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: 999, border: "none", background: "#ef4444", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 12, lineHeight: "20px", padding: 0 },
  allianceGrid: { display: "flex", flexDirection: "column", gap: 18, alignItems: "center" },
  allianceBox: { background: "#202020", border: "2px solid #555", borderRadius: 14, padding: 14, width: "min(900px, 95%)" },
  miniRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 },
  voteGrid: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12, margin: "20px auto", maxWidth: 1380 },
  voteCard: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "#1d1d1d", border: "2px solid #444", borderRadius: 14, padding: 10 },
  revealBox: { width: 120, height: 120, borderRadius: 12, fontSize: 46, fontWeight: "bold", cursor: "pointer", border: "3px solid white", background: "#333", color: "white" },
  revealedVote: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: 14, gap: 5 },
  voteImg: { width: 70, height: 70, objectFit: "cover", borderRadius: 8 },
  countBox: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, margin: "10px auto", maxWidth: 850 },
  countItem: { background: "#333", padding: "8px 12px", borderRadius: 8 },
  liveCountGrid: { display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, margin: "14px auto 18px", maxWidth: 1050 },
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
  saveBox: { margin: "24px auto", maxWidth: 520, display: "grid", gap: 10, background: "#1f1f1f", border: "1px solid #333", borderRadius: 18, padding: 18 },
  input: { padding: 12, borderRadius: 10, border: "1px solid #444", background: "#111", color: "white", fontWeight: 700 },
  textarea: { padding: 12, borderRadius: 10, border: "1px solid #444", background: "#111", color: "white", fontWeight: 700, minHeight: 90 },
  checkboxLabel: { display: "flex", justifyContent: "center", gap: 8, alignItems: "center", fontWeight: 800 },
};
