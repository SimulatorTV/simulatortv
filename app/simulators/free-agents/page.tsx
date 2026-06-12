// @ts-nocheck

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const TIER1 = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
const TIER2 = ["Gray", "White", "Brown", "Magenta", "Cyan", "Lime", "Indigo"];
const TIER3 = ["Teal", "Gold", "Silver", "Pink", "Navy", "Tan", "Maroon", "Salmon"];

const COLOR_MAP = {
  Red: "#ef4444",
  Orange: "#f97316",
  Yellow: "#ffff00",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Purple: "#a855f7",
  Gray: "#6b7280",
  White: "#ffffff",
  Brown: "#92400e",
  Magenta: "#d946ef",
  Cyan: "#06b6d4",
  Lime: "#84cc16",
  Indigo: "#4b0082",
  Teal: "#14b8a6",
  Gold: "#f59e0b",
  Silver: "#9ca3af",
  Pink: "#ec4899",
  Navy: "#1e3a8a",
  Tan: "#d2b48c",
  Maroon: "#7f1d1d",
  Salmon: "#fa8072",
};

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function buildPlayers(castPool = []) {
  return castPool.map((person, idx) => ({
    id: person.id || idx + 1,
    name: person.name,
    image: person.image || person.img || "",
    eliminated: false,
    placement: null,
  }));
}

function buildShuffledState(castPool = []) {
  const players = shuffle(buildPlayers(castPool));
  return { players, order: players.map((p) => p.id) };
}

function chooseRoundFormat(count) {
  if (count <= 5) return { mode: "final5" };

  const perfectOptions = [];
  const imperfectOptions = [];

  for (let teams = 2; teams <= Math.min(16, count); teams += 1) {
    const size = count / teams;
    if (size < 2) continue;
    if (count % teams === 0) perfectOptions.push(teams);
    else imperfectOptions.push({ teams, remainder: count % teams });
  }

  if (perfectOptions.length > 0) {
    const sortedPerfect = [...perfectOptions].sort((a, b) => a - b);
    const favorBiggerTeams = Math.random() < 0.7;
    if (favorBiggerTeams) {
      const topHalfEnd = Math.floor((sortedPerfect.length - 1) / 2);
      const favoredPool = sortedPerfect.slice(0, topHalfEnd + 1);
      const mixedPool = [...favoredPool, ...sortedPerfect];
      return { mode: "teams", teams: sample(mixedPool) };
    }
    return { mode: "teams", teams: sample(sortedPerfect) };
  }

  const weighted = [
    ...imperfectOptions.map((o) => ({
      value: { mode: "teams", teams: o.teams },
      weight: Math.max(1, 8 - o.remainder),
    })),
    { value: { mode: "ffa" }, weight: count >= 10 ? 2 : 1 },
  ];

  const total = weighted.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;
  for (const option of weighted) {
    roll -= option.weight;
    if (roll <= 0) return option.value;
  }
  return weighted[weighted.length - 1].value;
}

function getTeamPalette(teamCount) {
  if (teamCount <= 6) return shuffle(TIER1).slice(0, teamCount);
  if (teamCount <= 12) return [...shuffle(TIER1), ...shuffle(TIER2)].slice(0, teamCount);
  return [...shuffle(TIER1), ...shuffle(TIER2), ...shuffle(TIER3)].slice(0, teamCount);
}

function assignTeams(activePlayers, teamCount) {
  const shuffled = shuffle(activePlayers);
  const palette = getTeamPalette(teamCount);
  const teams = palette.map((name, idx) => ({
    id: idx,
    name: `${name} Team`,
    color: COLOR_MAP[name],
    members: [],
    score: 0,
    rank: null,
  }));
  shuffled.forEach((player, idx) => {
    teams[idx % teamCount].members.push(player.id);
  });
  return teams;
}

function scoreTeams(teams) {
  return teams
    .map((team) => ({ ...team, score: Number((Math.random() * 100).toFixed(2)) }))
    .sort((a, b) => b.score - a.score)
    .map((team, idx) => ({ ...team, rank: idx + 1 }));
}

function scoreIndividuals(activePlayers) {
  return activePlayers
    .map((p) => ({ ...p, score: Number((Math.random() * 100).toFixed(2)) }))
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));
}

function tallyVotes(votes) {
  const counts = {};
  for (const vote of votes) counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topCount = entries[0]?.[1] || 0;
  const tied = entries.filter(([, count]) => count === topCount).map(([id]) => id);
  return { counts, winnerId: sample(tied) };
}

function isDarkTextColor(color) {
  return ["#ffffff", "#ffff00", "#f59e0b", "#d2b48c", "#fa8072", "#9ca3af"].includes(color);
}

function SimulatorCard({ player, borderColor = "#fff", dim = false, badge = null, grayscale = false }) {
  const darkText = isDarkTextColor(borderColor);
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
        {player?.image ? (
          <img
            src={player.image}
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

const statBoxStyle = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 14,
};

const statLabelStyle = {
  fontSize: 12,
  color: "#cbd5e1",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontWeight: 800,
};

const statValueStyle = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 900,
  lineHeight: 1.1,
};

export default function FreeAgentsSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [castPool, setCastPool] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const initialState = useMemo(() => buildShuffledState([]), []);
  const [players, setPlayers] = useState(initialState.players);
  const [initialOrder, setInitialOrder] = useState(initialState.order);
  const [phase, setPhase] = useState("pregame");
  const [isMobile, setIsMobile] = useState(() => (typeof window === "undefined" ? false : window.innerWidth <= 768));
  const [selectedIds, setSelectedIds] = useState([]);
  const [randomStartCount, setRandomStartCount] = useState(2);
  const [roundNumber, setRoundNumber] = useState(0);
  const [roundData, setRoundData] = useState(null);
  const [log, setLog] = useState(["Add cast members, then press Advance to begin the first round."]);
  const [history, setHistory] = useState([]);
  const [lastHistoryKey, setLastHistoryKey] = useState("");

  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const activePlayers = useMemo(() => players.filter((p) => !p.eliminated), [players]);
  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const eliminatedOrdered = useMemo(
    () => players.filter((p) => p.eliminated).sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999)),
    [players]
  );

  const selectedCount = selectedIds.length;
  const effectiveStartCount = Math.max(2, Math.min(randomStartCount, Math.max(2, selectedCount)));
  const champion = players.find((p) => p.placement === 1) || (phase === "gameOver" ? players.find((p) => !p.eliminated) : null);

  useEffect(() => {
    loadSavedCasts();
  }, []);


  useEffect(() => {
    if (phase === "pregame") return;
    const key = `${phase}-${roundNumber}-${JSON.stringify(roundData || {})}-${players.map((p) => `${p.id}:${p.eliminated ? 1 : 0}:${p.placement || ""}`).join("|")}`;
    if (key === lastHistoryKey) return;

    setLastHistoryKey(key);
    setHistory((prev) => [
      ...prev,
      {
        phase,
        roundNumber,
        players: JSON.parse(JSON.stringify(players || [])),
        roundData: JSON.parse(JSON.stringify(roundData || null)),
        initialOrder: [...(initialOrder || [])],
        champion: champion ? JSON.parse(JSON.stringify(champion)) : null,
      },
    ]);
  }, [phase, roundNumber, roundData, players]);


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

    setCastPool((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const nextRoster = [...current, ...additions.filter((person) => !existingIds.has(person.id))];
      const next = buildShuffledState(nextRoster);

      setPlayers(next.players);
      setInitialOrder(next.order);
      setSelectedIds(next.players.map((p) => p.id));
      setRandomStartCount(Math.max(2, next.players.length));
      setPhase("pregame");
      setRoundNumber(0);
      setRoundData(null);
      setLog(["Simulator ready. Press Advance to begin the first round."]);
      setHistory([]);
      setLastHistoryKey("");

      return nextRoster;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function removeFromRoster(playerId) {
    if (phase !== "pregame") return;

    setCastPool((current) => {
      const nextRoster = current.filter((player) => player.id !== playerId);
      const next = buildShuffledState(nextRoster);

      setPlayers(next.players);
      setInitialOrder(next.order);
      setSelectedIds(next.players.map((p) => p.id));
      setRandomStartCount(Math.max(2, next.players.length || 2));
      setRoundNumber(0);
      setRoundData(null);
      setLog(["Roster updated. Press Advance to begin the first round."]);

      return nextRoster;
    });
  }

  function clearRoster() {
    if (phase !== "pregame") return;
    const confirmClear = confirm("Clear the current Free Agents roster?");
    if (!confirmClear) return;

    setCastPool([]);
    setPlayers([]);
    setInitialOrder([]);
    setSelectedIds([]);
    setRandomStartCount(2);
    setRoundNumber(0);
    setRoundData(null);
    setLog(["Roster cleared. Add cast members to begin."]);
    setHistory([]);
    setLastHistoryKey("");
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setRandomStartCount((prev) => Math.max(2, Math.min(prev, Math.max(2, selectedCount))));
  }, [selectedCount]);

  function addLog(text) {
    setLog((prev) => [text, ...prev]);
  }

  function resetGame() {
    const next = buildShuffledState(castPool);
    setPlayers(next.players);
    setInitialOrder(next.order);
    setSelectedIds(next.players.map((p) => p.id));
    setRandomStartCount(Math.max(2, next.players.length || 2));
    setPhase("pregame");
    setRoundNumber(0);
    setRoundData(null);
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
    setSavingSeason(false);
    setLog(["Simulator reset. Press Advance to begin the first round."]);
    setHistory([]);
    setLastHistoryKey("");
  }

  function toggleSelected(id) {
    if (phase !== "pregame") return;
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev;
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  function startNewRound(sourcePlayers = players) {
    const active = sourcePlayers.filter((p) => !p.eliminated);
    if (active.length <= 1) {
      setPhase("gameOver");
      return;
    }

    const format = chooseRoundFormat(active.length);
    const newRound = roundNumber + 1;

    if (format.mode === "teams") {
      const teams = assignTeams(active, format.teams);
      setRoundData({ round: newRound, mode: "teams", teams, finalWinnerId: null, skippedTwoPlayerVote: false });
      setRoundNumber(newRound);
      setPhase("colorReveal");
      addLog(`Round ${newRound}: ${format.teams} random teams formed.`);
      return;
    }

    if (format.mode === "ffa") {
      setRoundData({ round: newRound, mode: "ffa", finalWinnerId: null });
      setRoundNumber(newRound);
      setPhase("teamSort");
      addLog(`Round ${newRound}: Full-cast free-for-all.`);
      return;
    }

    setRoundData({ round: newRound, mode: "final5", finalWinnerId: null });
    setRoundNumber(newRound);
    setPhase("teamSort");
    addLog(`Round ${newRound}: Final ${active.length} free-for-all.`);
  }

  function runTeamRankings() {
    if (!roundData?.teams) return;
    const rankedTeams = scoreTeams(roundData.teams);
    const winningTeam = rankedTeams[0];
    const losingTeam = rankedTeams[rankedTeams.length - 1];
    setRoundData({ ...roundData, teams: rankedTeams, winningTeamId: winningTeam.id, losingTeamId: losingTeam.id });
    setPhase("rankings");
    addLog(`${winningTeam.name} wins. ${losingTeam.name} finishes last.`);
  }

  function runLosingTeamVote() {
    const losingTeam = roundData?.teams?.find((t) => t.id === roundData.losingTeamId);
    if (!losingTeam) return;
    const members = losingTeam.members.map((id) => playersById[id]).filter(Boolean);

    if (members.length === 2) {
      setRoundData({
        ...roundData,
        sentInId: members[0].id,
        challengerId: members[1].id,
        losingTeamVotes: null,
        losingTeamVoteCounts: null,
        crossVotes: null,
        crossVoteCounts: null,
        skippedTwoPlayerVote: true,
      });
      setPhase("eliminationShow");
      addLog(`${members[0].name} and ${members[1].name} automatically face off because the last-place team only has 2 players.`);
      return;
    }

    const votes = members
      .map((voter) => {
        const options = members.filter((m) => m.id !== voter.id);
        const target = sample(options);
        if (!target) return null;
        return { voterId: voter.id, targetId: target.id };
      })
      .filter(Boolean);

    if (votes.length === 0) return;

    const result = tallyVotes(votes);
    const fallback = sample(members);
    const sentInId = result.winnerId || fallback?.id || null;

    setRoundData({ ...roundData, losingTeamVotes: votes, sentInId, losingTeamVoteCounts: result.counts, skippedTwoPlayerVote: false });
    setPhase("teamVoteResult");
    addLog(`${playersById[sentInId]?.name || "A player"} is voted in by the last-place team.`);
  }

  function runCrossTeamVote() {
    const losingTeam = roundData?.teams?.find((t) => t.id === roundData.losingTeamId);
    if (!losingTeam) return;

    const options = losingTeam.members.filter((id) => id !== roundData.sentInId).map((id) => playersById[id]).filter(Boolean);

    if (options.length === 0) {
      setPhase("eliminationShow");
      return;
    }

    const voters = players.filter((p) => !p.eliminated && !losingTeam.members.includes(p.id));

    if (voters.length === 0) {
      const chosen = sample(options);
      setRoundData({ ...roundData, crossVotes: [], challengerId: chosen?.id || null, crossVoteCounts: {} });
      setPhase("crossVoteResult");
      addLog(`${chosen?.name || "A player"} is automatically voted in.`);
      return;
    }

    const votes = voters
      .map((voter) => {
        const target = sample(options);
        if (!target) return null;
        return { voterId: voter.id, targetId: target.id };
      })
      .filter(Boolean);

    if (votes.length === 0) return;

    const result = tallyVotes(votes);
    const fallback = sample(options);
    const challengerId = result.winnerId || fallback?.id || null;

    setRoundData({ ...roundData, crossVotes: votes, challengerId, crossVoteCounts: result.counts });
    setPhase("crossVoteResult");
    addLog(`${playersById[challengerId]?.name || "A player"} is voted in by the other teams.`);
  }

  function runFFARankings() {
    const rankedIndividuals = scoreIndividuals(activePlayers);
    const winner = rankedIndividuals[0];

    if (activePlayers.length === 2) {
      const lastPlace = rankedIndividuals[1];
      setRoundData({ ...roundData, rankedIndividuals, winnerId: winner.id, sentInId: lastPlace.id, challengerId: winner.id });
      setPhase("eliminationShow");
      addLog(`${winner.name} vs ${lastPlace.name} in the final showdown.`);
      return;
    }

    const lastPlace = rankedIndividuals[rankedIndividuals.length - 1];
    setRoundData({ ...roundData, rankedIndividuals, winnerId: winner.id, sentInId: lastPlace.id, challengerId: null });
    setPhase("rankings");
    addLog(`${winner.name} wins the challenge. ${lastPlace.name} finishes last.`);
  }

  function runElimination() {
    const p1 = playersById[roundData?.sentInId];
    const p2 = playersById[roundData?.challengerId];
    if (!p1 || !p2) return;

    const score1 = Math.random() * 100;
    const score2 = Math.random() * 100;
    const winner = score1 >= score2 ? p1 : p2;
    const loser = score1 >= score2 ? p2 : p1;

    const activeCountBefore = players.filter((p) => !p.eliminated).length;
    const updatedPlayers = players.map((p) => (p.id === loser.id ? { ...p, eliminated: true, placement: activeCountBefore } : p));
    const remaining = activeCountBefore - 1;

    if (remaining <= 1) {
      const finalWinnerId = updatedPlayers.find((p) => !p.eliminated)?.id;
      const championPlayers = updatedPlayers.map((p) => (p.id === finalWinnerId ? { ...p, placement: 1 } : p));
      setPlayers(championPlayers);
      setRoundData({ ...roundData, eliminationWinnerId: winner.id, eliminationLoserId: loser.id, finalWinnerId });
      setPhase("gameOver");
      addLog(`${winner.name} wins the season!`);
      return;
    }

    setPlayers(updatedPlayers);
    setRoundData({ ...roundData, eliminationWinnerId: winner.id, eliminationLoserId: loser.id });
    setPhase("eliminationResult");
    addLog(`${winner.name} defeats ${loser.name}. ${loser.name} is eliminated in ${ordinal(activeCountBefore)} place.`);
  }

  function handleAdvance() {
    if (phase === "pregame") {
      const eligiblePlayers = players.filter((p) => selectedIds.includes(p.id));
      if (eligiblePlayers.length < 2) {
        addLog("Select at least 2 players to start.");
        return;
      }
      const requested = Math.max(2, Math.min(randomStartCount, eligiblePlayers.length));
      const chosenIds = new Set(shuffle(eligiblePlayers).slice(0, requested).map((p) => p.id));
      const seededPlayers = players.filter((p) => chosenIds.has(p.id)).map((p) => ({ ...p, eliminated: false, placement: null }));
      const chosenOrder = initialOrder.filter((id) => chosenIds.has(id));
      setPlayers(seededPlayers);
      setInitialOrder(chosenOrder);
      setLog((prev) => [`Starting game with ${requested} players from the selected pool.`, ...prev]);
      startNewRound(seededPlayers);
      return;
    }

    if (phase === "colorReveal") {
      setPhase("teamSort");
      addLog("Teams are now sorted.");
      return;
    }
    if (phase === "teamSort") {
      if (roundData?.mode === "teams") runTeamRankings();
      else runFFARankings();
      return;
    }
    if (phase === "rankings") {
      if (roundData?.mode === "teams") {
        setPhase("losingTeamOnly");
      } else {
        const pool = activePlayers.filter((p) => p.id !== roundData?.winnerId && p.id !== roundData?.sentInId);
        const chosen = sample(pool);
        if (!chosen) {
          setPhase("eliminationShow");
          return;
        }
        setRoundData({ ...roundData, challengerId: chosen.id });
        setPhase("crossVoteResult");
        addLog(`${chosen.name} is chosen for elimination.`);
      }
      return;
    }
    if (phase === "losingTeamOnly") return runLosingTeamVote();
    if (phase === "teamVoteResult") return runCrossTeamVote();
    if (phase === "crossVoteResult") return setPhase("eliminationShow");
    if (phase === "eliminationShow") return runElimination();
    if (phase === "eliminationResult") {
      setRoundData(null);
      setPhase("resetView");
      return;
    }
    if (phase === "resetView") startNewRound();
  }

  async function saveSeason() {
    if (!champion) {
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

    const placements = [...players].sort((a, b) => (a.placement || 999) - (b.placement || 999));

    const { data, error } = await supabase
      .from("saved_seasons")
      .insert({
        user_id: userData.user.id,
        simulator_type: "free-agents",
        title: seasonTitle.trim() || "Free Agents Season",
        summary: seasonSummary.trim() || `A Free Agents simulation with ${players.length} players.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "free-agents",
          history,
          players,
          placements,
          champion,
          log,
          rounds: roundNumber,
          initialOrder,
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
    const orderMap = new Map(initialOrder.map((id, idx) => [id, idx]));
    return [...players.filter((p) => !p.eliminated)].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  }

  function getOrderedPlayersAll() {
    const activeOrdered = orderedActivePlayers();
    const eliminatedForGrid = [...eliminatedOrdered].sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0));
    return [...activeOrdered, ...eliminatedForGrid];
  }

  function renderPregameSelectionGrid() {
    if (players.length === 0) {
      return (
        <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 24, color: "#cbd5e1", fontWeight: 800 }}>
          Add cast members to begin.
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))", gap: 12 }}>
        {players.map((player) => {
          const isSelected = selectedIds.includes(player.id);
          return (
            <div key={player.id} onClick={() => toggleSelected(player.id)} style={{ cursor: "pointer" }}>
              <SimulatorCard player={player} borderColor={isSelected ? "#ffffff" : "#6b7280"} dim={!isSelected} badge={isSelected ? null : "OUT"} grayscale={!isSelected} />
            </div>
          );
        })}
      </div>
    );
  }

  function renderFullCastGrid() {
    if (phase === "resetView" && roundData?.finalWinnerId) {
      const winner = playersById[roundData.finalWinnerId];
      return (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 220 }}>
            <SimulatorCard player={winner} borderColor="#eab308" />
          </div>
        </div>
      );
    }

    const ordered = getOrderedPlayersAll();
    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))", gap: 12 }}>
        {ordered.map((player) => (
          <SimulatorCard key={player.id} player={player} borderColor={getCardBorder(player)} dim={player.eliminated} badge={player.eliminated && player.placement ? ordinal(player.placement) : null} grayscale={player.eliminated} />
        ))}
      </div>
    );
  }

  function renderTeamsView(showOnlyLosing = false) {
    const teamsToShowRaw = showOnlyLosing ? roundData?.teams?.filter((t) => t.id === roundData.losingTeamId) || [] : roundData?.teams || [];
    const teamsToShow = !showOnlyLosing && phase === "rankings" ? [...teamsToShowRaw].sort((a, b) => (a.rank || 0) - (b.rank || 0)) : shuffle([...teamsToShowRaw]);

    return (
      <div style={{ display: "grid", gap: 16 }}>
        {teamsToShow.map((team) => {
          const isWinner = team.id === roundData?.winningTeamId;
          const isLoser = team.id === roundData?.losingTeamId;
          const centeredTeam = team.members.length <= 5;
          const smallWidth = isMobile ? 120 : 160;
          return (
            <div key={team.id} style={{ border: `3px solid ${team.color}`, borderRadius: 18, overflow: "hidden", background: team.color, boxShadow: "0 8px 24px rgba(0,0,0,.28)" }}>
              <div style={{ background: team.color, color: ["#ffffff", "#ffff00"].includes(team.color) ? "#111827" : "#ffffff", fontWeight: 900, padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
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
                  gridTemplateColumns: centeredTeam ? `repeat(${team.members.length}, ${smallWidth}px)` : isMobile ? "repeat(4, minmax(0, 1fr))" : "repeat(8, minmax(0, 1fr))",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 220px))", justifyContent: "center", gap: 18 }}>
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
          return <SimulatorCard key={id} player={player} borderColor={borderColor} dim={showResult && id === roundData?.eliminationLoserId} badge={badge} grayscale={showResult && id === roundData?.eliminationLoserId} />;
        })}
      </div>
    );
  }

  function renderFullCastGridRemainingOnly() {
    const remaining = orderedActivePlayers();
    return (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))", gap: 12 }}>
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
    if (phase === "pregame") return renderPregameSelectionGrid();
    if (["colorReveal", "resetView", "gameOver"].includes(phase)) return renderFullCastGrid();

    if (roundData?.mode === "teams") {
      if (phase === "teamSort") return renderTeamsView(false);
      if (phase === "rankings") return renderTeamsView(false);
      if (["losingTeamOnly", "teamVoteResult", "crossVoteResult"].includes(phase)) return renderTeamsView(true);
      if (phase === "eliminationShow") return renderEliminationView(false);
      if (phase === "eliminationResult") return renderEliminationView(true);
    }

    if (roundData?.mode === "ffa" || roundData?.mode === "final5") {
      if (phase === "teamSort") return renderFullCastGrid();
      if (["rankings", "crossVoteResult"].includes(phase)) return renderFullCastGridRemainingOnly();
      if (phase === "eliminationShow") return renderEliminationView(false);
      if (phase === "eliminationResult") return renderEliminationView(true);
    }

    return renderFullCastGrid();
  }

  function summaryText() {
    if (phase === "pregame") return `Select a pool, then start with ${effectiveStartCount} random players.`;
    if (phase === "colorReveal") return "Team colors applied on the full cast grid.";
    if (phase === "teamSort") return roundData?.mode === "teams" ? "Cast is sorted into teams." : "Free-for-all challenge has begun.";
    if (phase === "rankings") return roundData?.mode === "teams" ? "Teams ranked from winner to last place." : `${playersById[roundData?.winnerId]?.name || "A player"} wins and ${playersById[roundData?.sentInId]?.name || "A player"} finishes last.`;
    if (phase === "losingTeamOnly") return roundData?.skippedTwoPlayerVote ? "The last-place team has only 2 players, so they will automatically face off." : "Only the last place team is shown.";
    if (phase === "teamVoteResult") return `${playersById[roundData?.sentInId]?.name || "A player"} was voted in by the losing team.`;
    if (phase === "crossVoteResult") return `${playersById[roundData?.challengerId]?.name || "A player"} is the opponent in elimination.`;
    if (phase === "eliminationShow") return "The two elimination players are shown.";
    if (phase === "eliminationResult") return `${playersById[roundData?.eliminationWinnerId]?.name || "A player"} stays. ${playersById[roundData?.eliminationLoserId]?.name || "A player"} is out.`;
    if (phase === "resetView") return roundData?.finalWinnerId ? `${playersById[roundData.finalWinnerId]?.name || "A player"} is the champion.` : "Back to the full cast with eliminated players in black at the bottom right.";
    if (phase === "gameOver") return `${champion?.name || "A player"} wins the season.`;
    return "";
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)", color: "#fff", fontFamily: "Arial, sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gap: 18, padding: isMobile ? 12 : 20 }}>
        <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: isMobile ? 12 : 18, boxShadow: "0 10px 30px rgba(0,0,0,.25)" }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, letterSpacing: ".02em" }}>Free Agents</div>
              <div style={{ color: "#cbd5e1", marginTop: 6, fontSize: 15 }}>
                {PHASE_LABELS[phase]}
                {roundNumber ? ` • Round ${roundNumber}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {phase === "pregame" ? (
                <>
                  <button onClick={openAddCastModal} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 999, fontWeight: 900, padding: "12px 18px", cursor: "pointer", fontSize: 15 }}>Add Cast Members</button>
                  {castPool.length > 0 ? <button onClick={clearRoster} style={{ background: "#374151", color: "#fff", border: "none", borderRadius: 999, fontWeight: 900, padding: "12px 18px", cursor: "pointer", fontSize: 15 }}>Clear Roster</button> : null}
                  <Link href="/custom-casts" style={{ background: "#475569", color: "#fff", border: "none", borderRadius: 999, fontWeight: 900, padding: "12px 18px", cursor: "pointer", fontSize: 15, textDecoration: "none" }}>Manage Casts</Link>
                </>
              ) : null}
              <button onClick={handleAdvance} disabled={phase === "gameOver" || players.length < 2} style={{ background: phase === "gameOver" || players.length < 2 ? "#374151" : "#22c55e", color: "#06130b", border: "none", borderRadius: 999, fontWeight: 900, padding: "12px 18px", cursor: phase === "gameOver" || players.length < 2 ? "not-allowed" : "pointer", fontSize: 15 }}>Advance</button>
              <button onClick={resetGame} style={{ background: "#e5e7eb", color: "#111827", border: "none", borderRadius: 999, fontWeight: 900, padding: "12px 18px", cursor: "pointer", fontSize: 15 }}>Reset</button>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>{phase === "pregame" ? "Selected Pool" : "Players Left"}</div>
              <div style={statValueStyle}>{phase === "pregame" ? selectedCount : activePlayers.length}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>{phase === "pregame" ? "Starting Count" : "Eliminated"}</div>
              <div style={statValueStyle}>{phase === "pregame" ? effectiveStartCount : eliminatedOrdered.length}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>{phase === "pregame" ? "Random Start" : "Current Format"}</div>
              <div style={statValueStyle}>{phase === "pregame" ? effectiveStartCount : roundData?.mode === "teams" ? `${roundData.teams?.length || "?"} Teams` : roundData?.mode === "ffa" ? "Free-for-All" : roundData?.mode === "final5" ? `Final ${activePlayers.length}` : "-"}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Status</div>
              <div style={{ ...statValueStyle, fontSize: 15 }}>{summaryText()}</div>
              {phase === "pregame" && players.length >= 2 ? (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>Randomly start with this many from selected pool</label>
                  <input type="range" min={2} max={Math.max(2, selectedCount)} value={effectiveStartCount} onChange={(e) => setRandomStartCount(Number(e.target.value))} />
                  <input type="number" min={2} max={Math.max(2, selectedCount)} value={effectiveStartCount} onChange={(e) => setRandomStartCount(Number(e.target.value) || 2)} style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, padding: "8px 10px", width: 110 }} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {phase === "pregame" && castPool.length > 0 ? (
          <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: isMobile ? 12 : 18 }}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>Current Roster</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(8, minmax(0, 1fr))", gap: 10 }}>
              {castPool.map((player) => (
                <div key={player.id} style={{ position: "relative" }}>
                  <SimulatorCard player={player} borderColor="#ffffff" />
                  <button onClick={() => removeFromRoster(player.id)} style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 999, border: "none", background: "#dc2626", color: "#fff", fontWeight: 900, cursor: "pointer" }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 320px", gap: 18 }}>
          <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: isMobile ? 12 : 18, minWidth: 0 }}>
            {renderMainArea()}
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: isMobile ? 12 : 16 }}>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Event Log</div>
              <div style={{ display: "grid", gap: 8, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                {log.map((entry, idx) => (
                  <div key={`${idx}-${entry}`} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 12px", color: "#e5e7eb", fontSize: 14, lineHeight: 1.35 }}>{entry}</div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: isMobile ? 12 : 16 }}>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Placement</div>
              {champion ? (
                <div style={{ background: "rgba(34,197,94,.18)", border: "1px solid rgba(34,197,94,.45)", borderRadius: 14, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#bbf7d0", fontWeight: 800 }}>WINNER</div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>{champion.name}</div>

                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    <input value={seasonTitle} onChange={(e) => setSeasonTitle(e.target.value)} placeholder="Season title" style={{ background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.18)", color: "#fff", borderRadius: 12, padding: "10px 12px" }} />
                    <textarea value={seasonSummary} onChange={(e) => setSeasonSummary(e.target.value)} placeholder="Season summary" rows={3} style={{ background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.18)", color: "#fff", borderRadius: 12, padding: "10px 12px", resize: "vertical" }} />
                    <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#d1fae5", fontWeight: 800, fontSize: 14 }}>
                      <input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} />
                      Post publicly
                    </label>
                    <button onClick={saveSeason} disabled={savingSeason} style={{ background: savingSeason ? "#374151" : "#2563eb", color: "#fff", border: "none", borderRadius: 12, fontWeight: 900, padding: "11px 14px", cursor: savingSeason ? "not-allowed" : "pointer" }}>
                      {savingSeason ? "Saving..." : "Save Season"}
                    </button>
                  </div>
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                {eliminatedOrdered.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, background: "rgba(255,255,255,.06)", borderRadius: 12, padding: "10px 12px" }}>
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span style={{ color: "#cbd5e1" }}>{ordinal(p.placement)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showAddCastModal ? (
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
        ) : null}
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

  const groupedOfficial = officialCasts.reduce((groups, cast) => {
    const groupName = cast.show_name || "Official Casts";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(cast);
    return groups;
  }, {});

  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) {
      onChooseCast(firstCastId);
    }
  }, [modalCastId, firstCastId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-slate-400 text-sm">Pick an official or custom cast, select people, then add them to this Free Agents roster.</p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] min-h-0 flex-1 overflow-hidden">
          <div className="border-r border-slate-800 p-4 overflow-auto space-y-4">
            {loadingCasts ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 text-slate-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {Object.keys(groupedOfficial).length > 0 ? (
                  <div>
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Favorite Official Casts</div>
                    <div className="space-y-2">
                      {Object.entries(groupedOfficial).map(([groupName, groupCasts]) => (
                        <div key={groupName}>
                          <div className="text-slate-500 text-xs font-bold mb-1">{groupName}</div>
                          {groupCasts.map((cast) => (
                            <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black mb-2 ${modalCastId === cast.id ? "bg-blue-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                              {cast.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {customCasts.length > 0 ? (
                  <div>
                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Custom Casts</div>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black ${modalCastId === cast.id ? "bg-blue-600 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                          <div>{cast.name}</div>
                          <div className="text-xs opacity-70 font-bold">{cast.show_name || "Custom Cast"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="p-4 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-slate-400 text-sm">{selectedCount} selected</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">Select None</button>
                <button onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 font-black text-white">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-300">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-300">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);

                  return (
                    <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative rounded-2xl overflow-hidden border aspect-square ${active ? "border-white ring-2 ring-white/60" : "border-slate-700 opacity-45 grayscale"}`}>
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-1 bg-slate-800">No Image</div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-center text-xs font-black py-1 truncate px-1">
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
