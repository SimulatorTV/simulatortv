// @ts-nocheck

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const ALL_COLORS = [
  "Red",
  "Maroon",
  "Orange",
  "Gold",
  "Yellow",
  "Lime",
  "Green",
  "Forest",
  "Olive",
  "Cyan",
  "Teal",
  "Blue",
  "Navy",
  "Indigo",
  "Purple",
  "Lavender",
  "Magenta",
  "Pink",
  "Salmon",
  "Brown",
  "Tan",
  "Gray",
  "Silver",
  "White",
  "Black",
  "Rainbow",
  "Negative",
];

const COLOR_MAP = {
  forest: "#006400",
  rainbow: "linear-gradient(to bottom, red, orange, yellow, green, blue, indigo, violet)",
  negative: "#333333",
};

const ELEMENTS = ["Earth", "Water", "Fire"];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickElement() {
  return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

function teamBgStyle(color) {
  if (color === "rainbow") return { background: COLOR_MAP.rainbow };
  return { backgroundColor: COLOR_MAP[color] || color };
}

function teamTextColor(color) {
  return ["black", "maroon", "indigo", "navy", "forest", "negative"].includes(color)
    ? "white"
    : "black";
}

function teamBorderStyle(color) {
  return color === "white" ? { border: "2px solid black" } : {};
}

function teamIconForElement(element) {
  if (element === "Fire") return "🔥";
  if (element === "Water") return "💧";
  return "🌳";
}

function chooseKUnique(total, k) {
  const arr = shuffle(Array.from({ length: total }, (_, i) => i));
  return arr.slice(0, k).sort((a, b) => a - b);
}

function choosePieceCount(maxPlayable, boxCount) {
  const minPlayable = 1;
  const capped = Math.max(minPlayable, Math.min(maxPlayable, boxCount - 1));
  return Math.floor(Math.random() * (capped - minPlayable + 1)) + minPlayable;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function EnduranceSim() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeCast, setActiveCast] = useState([]);
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

  const [selectedColors, setSelectedColors] = useState([...ALL_COLORS]);
  const [teams, setTeams] = useState([]);
  const [phase, setPhase] = useState("cast");
  const [episode, setEpisode] = useState(1);
  const [winner, setWinner] = useState(null);
  const [missionWinner, setMissionWinner] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [log, setLog] = useState([]);
  const [customTeamsMode, setCustomTeamsMode] = useState(false);
  const [draftTeams, setDraftTeams] = useState({});
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [randomCast, setRandomCast] = useState(false);
  const [templeState, setTempleState] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [teamPieces, setTeamPieces] = useState({});
  const [pieceTransferState, setPieceTransferState] = useState(null);
  const [finalTempleState, setFinalTempleState] = useState(null);
  const [preGameState, setPreGameState] = useState(null);
  const [targetBias, setTargetBias] = useState({});
  const [donationBias, setDonationBias] = useState({});

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
      img: person.image_url || "",
    }));

    setPlayers((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const next = [...current, ...additions.filter((person) => !existingIds.has(person.id))];
      setActiveCast(next.map((p) => p.name));
      return next;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function removeFromRoster(playerName) {
    if (phase !== "cast" || customTeamsMode) return;
    setPlayers((current) => {
      const next = current.filter((player) => player.name !== playerName);
      setActiveCast(next.map((p) => p.name));
      return next;
    });
  }

  function clearRoster() {
    if (phase !== "cast") return;
    const confirmClear = confirm("Clear the current Endurance roster?");
    if (!confirmClear) return;
    setPlayers([]);
    setActiveCast([]);
    setDraftTeams({});
    setDraggedPlayer(null);
  }


  const orderedSelectedColors = useMemo(
    () => ALL_COLORS.filter((c) => selectedColors.includes(c)),
    [selectedColors]
  );

  function initialize() {
    setPhase("cast");
    setEpisode(1);
    setWinner(null);
    setMissionWinner(null);
    setPlacements([]);
    setLog([]);
    setTempleState(null);
    setTeamPieces({});
    setPieceTransferState(null);
    setFinalTempleState(null);
    setPreGameState(null);
    setTargetBias({});
    setDonationBias({});
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
    setSavingSeason(false);
  }

  function addTargetBias(fromTeamName, toTeamName, amount = 1) {
    if (!fromTeamName || !toTeamName || fromTeamName === toTeamName) return;
    setTargetBias((curr) => ({
      ...curr,
      [fromTeamName]: {
        ...(curr[fromTeamName] || {}),
        [toTeamName]: ((curr[fromTeamName] || {})[toTeamName] || 0) + amount,
      },
    }));
  }

  function setDonationAvoidance(fromTeamName, toTeamName, amount = 3) {
    if (!fromTeamName || !toTeamName || fromTeamName === toTeamName) return;
    setDonationBias((curr) => ({
      ...curr,
      [fromTeamName]: {
        ...(curr[fromTeamName] || {}),
        [toTeamName]: amount,
      },
    }));
  }

  function pickTempleTeamsWithBias(activeTeams, winnerTeam) {
    const others = activeTeams.filter((t) => t.name !== winnerTeam.name);
    const biasMap = targetBias[winnerTeam.name] || {};
    const weighted = others.map((team) => ({
      team,
      weight: 1 + (biasMap[team.name] || 0) * 4,
    }));

    const pickOne = (pool) => {
      const total = pool.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.random() * total;
      for (const item of pool) {
        roll -= item.weight;
        if (roll <= 0) return item.team;
      }
      return pool[pool.length - 1].team;
    };

    const first = pickOne(weighted);
    const remaining = weighted.filter((item) => item.team.name !== first.name);
    const second = pickOne(remaining);
    return [first, second];
  }

  function pickDonationTargetWithBias(loserName, options, challengeWinnerName) {
    const avoidMap = donationBias[loserName] || {};
    const weighted = options.map((team) => {
      const avoid = avoidMap[team.name] || 0;
      const weight = Math.max(0.2, team.name === challengeWinnerName ? 0.2 / (avoid + 1) : 1 + avoid);
      return { team, weight };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.team;
    }
    return weighted[weighted.length - 1].team;
  }

  function selectAllCast() {
    setActiveCast(players.map((p) => p.name));
  }

  function deselectAllCast() {
    setActiveCast([]);
  }

  function selectAllTeams() {
    setSelectedColors([...ALL_COLORS]);
  }

  function deselectAllTeams() {
    setSelectedColors([]);
  }

  function applyDefaultSetup() {
    setSelectedColors([
      "Red",
      "Orange",
      "Yellow",
      "Green",
      "Lime",
      "Cyan",
      "Blue",
      "Purple",
      "Magenta",
      "Brown",
      "Gray",
      "White",
      "Black",
      "Rainbow",
    ]);
    setActiveCast(players.slice(0, 30).map((p) => p.name));
  }

  function toggleCast(name) {
    if (customTeamsMode) return;
    setActiveCast((curr) =>
      curr.includes(name) ? curr.filter((n) => n !== name) : [...curr, name]
    );
  }

  function toggleTeamColor(color) {
    if (customTeamsMode) return;
    setSelectedColors((curr) =>
      curr.includes(color) ? curr.filter((c) => c !== color) : [...curr, color]
    );
  }

  function toggleCustomTeams() {
    setCustomTeamsMode((v) => !v);
    setDraftTeams({});
    setDraggedPlayer(null);
  }

  function onDragStart(name) {
    if (!customTeamsMode) return;
    setDraggedPlayer(name);
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  function removePlayerFromDraft(name) {
    setDraftTeams((curr) => {
      const next = {};
      Object.entries(curr).forEach(([color, names]) => {
        next[color] = names.filter((n) => n !== name);
      });
      return next;
    });
  }

  function onDropToTeam(color) {
    if (!customTeamsMode || !draggedPlayer) return;
    setDraftTeams((curr) => {
      const cleaned = {};
      Object.entries(curr).forEach(([c, names]) => {
        cleaned[c] = names.filter((n) => n !== draggedPlayer);
      });
      const target = cleaned[color] || [];
      if (target.length >= 2) return cleaned;
      cleaned[color] = [...target, draggedPlayer];
      return cleaned;
    });
    setDraggedPlayer(null);
  }

  function getUnassignedPlayers() {
    const assigned = new Set(Object.values(draftTeams).flat());
    return players.filter((p) => !assigned.has(p.name));
  }

  function buildNormalStartPool() {
    const pool = players.filter((p) => activeCast.includes(p.name));
    const teamColors = orderedSelectedColors;
    const targetCount = teamColors.length * 2 + 2;
    const sampled = shuffle(pool).slice(0, targetCount);
    return { pool: sampled, teamColors };
  }

  function buildInitialPieces(builtTeams) {
    const next = {};
    builtTeams.forEach((team) => {
      next[team.name] = 1;
    });
    return next;
  }

  function transferPieces(fromTeamName, toTeamName) {
    setTeamPieces((curr) => {
      const amount = curr[fromTeamName] || 0;
      return {
        ...curr,
        [fromTeamName]: 0,
        [toTeamName]: (curr[toTeamName] || 0) + amount,
      };
    });
  }

  function autoResolvePieceTransfer(randomTeam) {
    const loser = pieceTransferState.loser;
    transferPieces(loser.name, randomTeam.name);
    setTeams((curr) => curr.map((t) => (t.name === loser.name ? { ...t, eliminated: true } : t)));
    setPlacements((curr) => [
      {
        team: loser,
        madeBy: pieceTransferState.templeWinner,
        challengeWinner: missionWinner,
        place: teams.filter((t) => !t.eliminated).length,
      },
      ...curr,
    ]);
    setLog([
      `Episode ${episode}: Temple`,
      ...templeState.rounds,
      `${loser.name} eliminated`,
      `${loser.name} randomly gave their temple pieces to ${randomTeam.name}`,
    ]);
    setEpisode((e) => e + 1);
    setMissionWinner(null);
    setTempleState(null);
    setPieceTransferState(null);
    setPhase("mission");
  }

  function startPreGameDraft(pool, teamColors) {
    const draftTeamsSeed = teamColors.map((c) => ({
      name: `${c} Team`,
      color: c.toLowerCase(),
      members: [],
      eliminated: false,
    }));
    setPreGameState({
      teamColors,
      candidates: pool,
      ranked: [],
      survivors: [],
      draftTeams: draftTeamsSeed,
      available: [],
      currentWinner: null,
      partner: null,
      chosenTeam: null,
      step: null,
      round: 0,
    });
    setPhase("rightToStayIntro");
    setLog(["Right to Stay", `${pool.length} contestants enter. Two will be eliminated.`]);
  }

  function resolveRightToStay() {
    if (!preGameState) return;
    const ranked = shuffle(preGameState.candidates);
    const needed = preGameState.teamColors.length * 2;
    const survivors = ranked.slice(0, needed);
    setPreGameState({ ...preGameState, ranked, survivors });
    setPhase("rightToStayResult");
    setLog([
      "Right to Stay Results",
      `${ranked[ranked.length - 2]?.name || ""} and ${ranked[ranked.length - 1]?.name || ""} are eliminated.`,
    ]);
  }

  function startDraftChallenge() {
    if (!preGameState) return;
    const available = [...preGameState.survivors];
    const currentWinner = randomChoice(available);
    setPreGameState({
      ...preGameState,
      available,
      currentWinner,
      partner: null,
      chosenTeam: null,
      step: null,
      round: 1,
    });
    setPhase("draftChallenge");
    setLog([
      "Team Picking Challenge",
      `${currentWinner.name} wins and will choose a team and partner.`,
    ]);
  }

  function advanceDraftChallenge() {
    if (!preGameState?.currentWinner) return;
    const state = preGameState;

    if (!state.step) {
      const remaining = state.available.filter((p) => p.name !== state.currentWinner.name);
      const partner = randomChoice(remaining);
      setPreGameState({ ...state, partner, step: "showPartner" });
      setLog([
        "Team Picking Challenge",
        `${state.currentWinner.name} wins and will choose a team and partner.`,
      ]);
      return;
    }

    if (state.step === "showPartner") {
      const emptyTeams = state.draftTeams.filter((t) => t.members.length === 0);
      const chosenTeam = randomChoice(emptyTeams);
      setPreGameState({ ...state, chosenTeam, step: "showColor" });
      setLog([
        "Team Picking Challenge",
        `${state.currentWinner.name} chose ${state.partner.name} as partner.`,
      ]);
      return;
    }

    if (state.step === "showColor") {
      const winnerPlayer = state.currentWinner;
      const partner = state.partner;
      const chosenTeam = state.chosenTeam;
      const remainingAfter = state.available.filter(
        (p) => p.name !== winnerPlayer.name && p.name !== partner.name
      );
      const nextDraftTeams = state.draftTeams.map((t) =>
        t.name === chosenTeam.name ? { ...t, members: [winnerPlayer, partner] } : t
      );

      if (remainingAfter.length === 0) {
        setTeams(nextDraftTeams);
        setTeamPieces(buildInitialPieces(nextDraftTeams));
        setPreGameState({
          ...state,
          draftTeams: nextDraftTeams,
          available: [],
          currentWinner: null,
          partner: null,
          chosenTeam: null,
          step: null,
        });
        setPhase("teamsFormed");
        setLog([
          "Teams Formed",
          `${winnerPlayer.name} and ${partner.name} joined ${chosenTeam.name.replace(" Team", "")}.`,
        ]);
        return;
      }

      const nextWinner = randomChoice(remainingAfter);
      setPreGameState({
        ...state,
        draftTeams: nextDraftTeams,
        available: remainingAfter,
        currentWinner: nextWinner,
        partner: null,
        chosenTeam: null,
        step: null,
        round: state.round + 1,
      });
      setLog([
        "Team Picking Challenge",
        `${winnerPlayer.name} and ${partner.name} joined ${chosenTeam.name.replace(" Team", "")}.`,
        `${nextWinner.name} wins the next challenge and will choose next.`,
      ]);
    }
  }

  function runMission() {
    const active = teams.filter((t) => !t.eliminated);
    if (active.length <= 2) {
      setFinalTempleState(null);
      setPhase("finalTwo");
      return;
    }

    const results = shuffle(active);
    const challengeWinner = results[0];
    const templeTeams = pickTempleTeamsWithBias(active, challengeWinner);
    setMissionWinner(challengeWinner);
    setTeamPieces((curr) => ({
      ...curr,
      [challengeWinner.name]: (curr[challengeWinner.name] || 0) + 1,
    }));
    setTempleState({
      teams: templeTeams,
      scoreA: 0,
      scoreB: 0,
      rounds: [],
      started: false,
      finished: false,
      winner: null,
      loser: null,
      lastA: null,
      lastB: null,
      lastRoundWinner: null,
    });
    templeTeams.forEach((team) => {
      addTargetBias(team.name, challengeWinner.name, 4);
      addTargetBias(challengeWinner.name, team.name, 2);
    });

    setLog([`Episode ${episode}: Mission`, `${challengeWinner.name} wins`]);
    setPhase("missionResult");
  }

  function advanceTemple() {
    if (!templeState) return;
    const [teamA, teamB] = templeState.teams;

    if (!templeState.started) {
      setTempleState({ ...templeState, started: true });
      setLog([
        `Episode ${episode}: Temple of Fate`,
        `${teamA.name} vs ${teamB.name}`,
        `Score: ${templeState.scoreA}-${templeState.scoreB}`,
      ]);
      return;
    }

    if (templeState.finished) {
      setPhase("templeResult");
      setLog([
        `Episode ${episode}: Temple Result`,
        `${templeState.winner.name} ✅`,
        `${templeState.loser.name} ❌`,
      ]);
      return;
    }

    let scoreA = templeState.scoreA;
    let scoreB = templeState.scoreB;
    let choiceA = null;
    let choiceB = null;
    let roundWinner = null;

    while (!roundWinner) {
      choiceA = pickElement();
      choiceB = pickElement();
      if (
        (choiceA === "Water" && choiceB === "Fire") ||
        (choiceA === "Fire" && choiceB === "Earth") ||
        (choiceA === "Earth" && choiceB === "Water")
      ) {
        scoreA += 1;
        roundWinner = teamA;
      } else if (
        (choiceB === "Water" && choiceA === "Fire") ||
        (choiceB === "Fire" && choiceA === "Earth") ||
        (choiceB === "Earth" && choiceA === "Water")
      ) {
        scoreB += 1;
        roundWinner = teamB;
      }
    }

    const rounds = [
      ...templeState.rounds,
      `${teamA.name} (${choiceA}) vs ${teamB.name} (${choiceB}) — ${roundWinner.name} scores`,
    ];
    const finished = scoreA >= 2 || scoreB >= 2;
    const winnerTeam = finished ? (scoreA > scoreB ? teamA : teamB) : null;
    const loserTeam = finished ? (scoreA > scoreB ? teamB : teamA) : null;

    setTempleState({
      ...templeState,
      scoreA,
      scoreB,
      rounds,
      finished,
      winner: winnerTeam,
      loser: loserTeam,
      lastA: choiceA,
      lastB: choiceB,
      lastRoundWinner: roundWinner.name,
    });

    setLog([
      `Episode ${episode}: Temple of Fate`,
      `${teamA.name}: ${scoreA}`,
      `${teamB.name}: ${scoreB}`,
      `${teamA.name} (${choiceA}) vs ${teamB.name} (${choiceB}) — ${roundWinner.name} scores`,
    ]);
  }

  function finalizeTemple() {
    if (!templeState?.winner || !templeState?.loser) return;
    const loser = templeState.loser;
    const templeWinner = templeState.winner;
    const transferOptions = teams.filter((t) => !t.eliminated && t.name !== loser.name);

    if (transferOptions.length > 0) {
      setDonationAvoidance(loser.name, missionWinner?.name, 5);
      setPieceTransferState({ loser, templeWinner, options: transferOptions });
      setPhase("pieceTransfer");
      setLog([
        `${loser.name} has been eliminated.`,
        `${loser.name} must give their temple pieces to another team.`,
      ]);
      return;
    }

    setTeams((curr) => curr.map((t) => (t.name === loser.name ? { ...t, eliminated: true } : t)));
    setPlacements((curr) => [
      {
        team: loser,
        madeBy: templeWinner,
        challengeWinner: missionWinner,
        place: teams.filter((t) => !t.eliminated).length,
      },
      ...curr,
    ]);
    setLog([`Episode ${episode}: Temple`, ...templeState.rounds, `${loser.name} eliminated`]);
    setEpisode((e) => e + 1);
    setMissionWinner(null);
    setTempleState(null);
    setPieceTransferState(null);
    setPhase("mission");
  }

  function startFinalTempleGame() {
    const finalTeams = teams.filter((t) => !t.eliminated);
    if (finalTeams.length !== 2) return;
    const [teamA, teamB] = finalTeams;
    setFinalTempleState({
      teams: [teamA, teamB],
      round: 1,
      boxCount: 3,
      stage: "board",
      lowTeam: null,
      highTeam: null,
      lowPieces: 0,
      highPieces: 0,
      lowClaimed: [],
      highClaimed: [],
      goldIndex: null,
      winnerOfRound: null,
      totalPot: 0,
    });
    setLog([
      "Final Temple Pieces Showdown",
      `${teamA.name}: ${teamPieces[teamA.name] || 0} pieces`,
      `${teamB.name}: ${teamPieces[teamB.name] || 0} pieces`,
    ]);
  }

  function advanceFinalTemple() {
    if (!finalTempleState) return;

    const [teamA, teamB] = finalTempleState.teams;
    const piecesA = teamPieces[teamA.name] || 0;
    const piecesB = teamPieces[teamB.name] || 0;

    if (piecesA <= 0 || piecesB <= 0) {
      const finalWinner = piecesA > 0 ? teamA : teamB;
      setWinner(finalWinner);
      setLog([
        "Final Temple Pieces Showdown",
        `${finalWinner.name} has all the temple pieces and wins the game!`,
      ]);
      setPhase("finished");
      return;
    }

    if (finalTempleState.stage === "board") {
      const lowTeam = piecesA <= piecesB ? teamA : teamB;
      const highTeam = lowTeam.name === teamA.name ? teamB : teamA;
      const lowMax = Math.min(teamPieces[lowTeam.name] || 0, finalTempleState.boxCount - 1);
      const lowPieces = choosePieceCount(lowMax, finalTempleState.boxCount);
      const remainingSlots = finalTempleState.boxCount - lowPieces;
      const highPieces = remainingSlots;
      setFinalTempleState({
        ...finalTempleState,
        lowTeam,
        highTeam,
        lowPieces,
        highPieces,
        lowClaimed: [],
        highClaimed: [],
        goldIndex: null,
        winnerOfRound: null,
        totalPot: lowPieces + highPieces,
        stage: "lowMove",
      });
      setLog([
        `Final Temple Round ${finalTempleState.round}`,
        `${lowTeam.name} has fewer pieces and moves first.`,
      ]);
      return;
    }

    if (finalTempleState.stage === "lowMove") {
      const claimed = chooseKUnique(finalTempleState.boxCount, finalTempleState.lowPieces);
      setFinalTempleState({ ...finalTempleState, lowClaimed: claimed, stage: "highMove" });
      setLog([
        `Final Temple Round ${finalTempleState.round}`,
        `${finalTempleState.lowTeam.name} placed ${finalTempleState.lowPieces} piece(s).`,
      ]);
      return;
    }

    if (finalTempleState.stage === "highMove") {
      const remaining = Array.from({ length: finalTempleState.boxCount }, (_, i) => i).filter(
        (i) => !finalTempleState.lowClaimed.includes(i)
      );
      const claimed = remaining.slice(0, finalTempleState.highPieces);
      setFinalTempleState({ ...finalTempleState, highClaimed: claimed, stage: "reveal" });
      setLog([
        `Final Temple Round ${finalTempleState.round}`,
        `${finalTempleState.highTeam.name} filled the open spaces.`,
      ]);
      return;
    }

    if (finalTempleState.stage === "reveal") {
      const goldIndex = Math.floor(Math.random() * finalTempleState.boxCount);
      const lowHas = finalTempleState.lowClaimed.includes(goldIndex);
      const winnerOfRound = lowHas ? finalTempleState.lowTeam : finalTempleState.highTeam;
      setFinalTempleState({ ...finalTempleState, goldIndex, winnerOfRound, stage: "collect" });
      setLog([
        `Final Temple Round ${finalTempleState.round}`,
        `The gold pyramid was under slot ${goldIndex + 1}.`,
        `${winnerOfRound.name} claimed it!`,
      ]);
      return;
    }

    if (finalTempleState.stage === "collect") {
      const lowName = finalTempleState.lowTeam.name;
      const highName = finalTempleState.highTeam.name;
      const totalPot = finalTempleState.totalPot;
      const winnerName = finalTempleState.winnerOfRound.name;

      setTeamPieces((curr) => {
        const next = { ...curr };
        next[lowName] = Math.max(0, (next[lowName] || 0) - finalTempleState.lowPieces);
        next[highName] = Math.max(0, (next[highName] || 0) - finalTempleState.highPieces);
        next[winnerName] = (next[winnerName] || 0) + totalPot;
        return next;
      });

      const nextPiecesA =
        winnerName === teamA.name
          ? piecesA -
            (finalTempleState.lowTeam.name === teamA.name ? finalTempleState.lowPieces : 0) -
            (finalTempleState.highTeam.name === teamA.name ? finalTempleState.highPieces : 0) +
            totalPot
          : piecesA -
            (finalTempleState.lowTeam.name === teamA.name ? finalTempleState.lowPieces : 0) -
            (finalTempleState.highTeam.name === teamA.name ? finalTempleState.highPieces : 0);
      const nextPiecesB =
        winnerName === teamB.name
          ? piecesB -
            (finalTempleState.lowTeam.name === teamB.name ? finalTempleState.lowPieces : 0) -
            (finalTempleState.highTeam.name === teamB.name ? finalTempleState.highPieces : 0) +
            totalPot
          : piecesB -
            (finalTempleState.lowTeam.name === teamB.name ? finalTempleState.lowPieces : 0) -
            (finalTempleState.highTeam.name === teamB.name ? finalTempleState.highPieces : 0);

      if (nextPiecesA <= 0 || nextPiecesB <= 0) {
        const finalWinner = nextPiecesA > 0 ? teamA : teamB;
        setWinner(finalWinner);
        setLog([
          `Final Temple Round ${finalTempleState.round}`,
          `${finalTempleState.winnerOfRound.name} collected ${totalPot} piece(s).`,
          `${finalWinner.name} now has all the temple pieces and wins the game!`,
        ]);
        setPhase("finished");
        return;
      }

      setFinalTempleState({
        ...finalTempleState,
        round: finalTempleState.round + 1,
        boxCount: finalTempleState.boxCount + 1,
        stage: "board",
        lowTeam: null,
        highTeam: null,
        lowPieces: 0,
        highPieces: 0,
        lowClaimed: [],
        highClaimed: [],
        goldIndex: null,
        winnerOfRound: null,
        totalPot: 0,
      });
      setLog([
        `Final Temple Round ${finalTempleState.round}`,
        `${finalTempleState.winnerOfRound.name} collected ${totalPot} piece(s).`,
        `Next round: ${finalTempleState.boxCount + 1} slots.`,
      ]);
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
        simulator_type: "endurance",
        title: seasonTitle.trim() || "Endurance Season",
        summary:
          seasonSummary.trim() ||
          `${winner.name} won an Endurance simulation with ${players.length} cast members.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "endurance",
          players,
          teams,
          placements,
          winner,
          log,
          teamPieces,
          episode,
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

  function advance() {
    if (phase === "cast") {
      if (players.length < 4) {
        alert("Add at least 4 cast members first.");
        return;
      }

      if (customTeamsMode) {
        const validColors = ALL_COLORS.filter((color) => (draftTeams[color] || []).length === 2);
        const builtTeams = validColors.map((color) => ({
          name: `${color} Team`,
          color: color.toLowerCase(),
          members: (draftTeams[color] || [])
            .map((name) => players.find((p) => p.name === name))
            .filter(Boolean),
          eliminated: false,
        }));
        setTeams(builtTeams);
        setTeamPieces(buildInitialPieces(builtTeams));
        setPieceTransferState(null);
        setFinalTempleState(null);
        setPreGameState(null);
        setPhase("mission");
      } else {
        if (orderedSelectedColors.length < 1) {
          alert("Select at least one team color.");
          return;
        }

        const { pool, teamColors } = buildNormalStartPool();

        if (pool.length < teamColors.length * 2) {
          alert("Not enough selected cast members for the selected team colors. Select more cast members or fewer team colors.");
          return;
        }

        startPreGameDraft(pool, teamColors);
      }
      return;
    }
    if (phase === "rightToStayIntro") {
      resolveRightToStay();
      return;
    }
    if (phase === "rightToStayResult") {
      startDraftChallenge();
      return;
    }
    if (phase === "draftChallenge") {
      advanceDraftChallenge();
      return;
    }
    if (phase === "teamsFormed") {
      setPhase("mission");
      return;
    }
    if (phase === "mission") {
      runMission();
      return;
    }
    if (phase === "missionResult") {
      setLog([
        `Episode ${episode}: Mission`,
        `${missionWinner.name} wins`,
        `${templeState.teams[0].name} vs ${templeState.teams[1].name} in Temple`,
      ]);
      setPhase("preTemple");
      return;
    }
    if (phase === "preTemple") {
      if (templeState) setPhase("temple");
      return;
    }
    if (phase === "temple") {
      advanceTemple();
      return;
    }
    if (phase === "templeResult") {
      finalizeTemple();
      return;
    }
    if (phase === "pieceTransfer" && pieceTransferState) {
      const options = pieceTransferState.options;
      const randomTeam = pickDonationTargetWithBias(pieceTransferState.loser.name, options, missionWinner?.name);
      autoResolvePieceTransfer(randomTeam);
      return;
    }
    if (phase === "finalTwo") {
      if (!finalTempleState) startFinalTempleGame();
      else advanceFinalTemple();
    }
  }

  const visibleTeams = useMemo(() => {
    if ((phase === "temple" || phase === "templeResult") && templeState) return templeState.teams;
    return teams.filter((t) => !t.eliminated);
  }, [phase, templeState, teams]);

  const templeElementsVisible =
    phase === "temple" && templeState?.started && templeState?.lastA && templeState?.lastB;

  function renderTeamCard(team, index) {
    const color = team.color;
    const isNegative = color === "negative";
    const isTempleTeam = phase === "preTemple" && templeState?.teams.includes(team);
    const showQuestion = isTempleTeam;
    const showStar = (phase === "missionResult" || phase === "preTemple") && missionWinner === team;
    const showTrophy = phase === "finished" && winner === team;
    const showCheck = phase === "templeResult" && templeState?.winner === team;
    const showX = phase === "templeResult" && templeState?.loser === team;
    const pieceCount = teamPieces[team.name] || 0;

    return (
      <div
        key={team.name + index}
        style={{
          ...teamBgStyle(color),
          ...teamBorderStyle(color),
          color: teamTextColor(color),
          position: "relative",
          padding: "5px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "6px",
            left: "6px",
            fontWeight: "bold",
            fontSize: isMobile ? "16px" : "20px",
            WebkitTextStroke: "1px black",
          }}
        >
          <span style={{ color: "saddlebrown", WebkitTextStroke: "1px black" }}>▲ {pieceCount}</span>
        </div>
        <h3 style={{ textAlign: "center", fontWeight: "bold" }}>{team.name.replace(" Team", "")}</h3>
        <div style={{ display: "flex", alignItems: "center", paddingRight: "80px", flexWrap: "wrap" }}>
          {team.members.map((m) => (
            <div
              key={m.name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "8px" }}
            >
              <img
                src={m.img}
                width={70}
                style={{
                  backgroundColor: "white",
                  margin: "2px",
                  filter: isNegative ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "",
                }}
              />
              <div style={{ fontWeight: "bold" }}>{m.name}</div>
            </div>
          ))}
        </div>

        {showQuestion && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: isMobile ? "56px" : "90px",
              color: "red",
              WebkitTextStroke: "2px black",
            }}
          >
            ?
          </div>
        )}

        {showStar && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: isMobile ? "56px" : "90px",
              color: "yellow",
              WebkitTextStroke: "2px black",
            }}
          >
            ★
          </div>
        )}

        {showTrophy && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: isMobile ? "56px" : "90px",
              color: "gold",
              WebkitTextStroke: "2px black",
            }}
          >
            🏆
          </div>
        )}

        {showCheck && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: isMobile ? "56px" : "90px",
              color: "limegreen",
              WebkitTextStroke: "2px black",
            }}
          >
            ✓
          </div>
        )}

        {showX && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: isMobile ? "56px" : "90px",
              color: "red",
              WebkitTextStroke: "2px black",
            }}
          >
            ✕
          </div>
        )}

        {templeElementsVisible && phase === "temple" && templeState?.teams.includes(team) && (
          <>
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {[0, 1].map((boxIndex) => {
                const wins = index === 0 ? templeState.scoreA : templeState.scoreB;
                const litColor = team.color === "lime" ? "yellow" : "limegreen";
                return (
                  <div
                    key={boxIndex}
                    style={{
                      width: "18px",
                      height: "18px",
                      border: team.color === "black" ? "2px solid white" : "2px solid black",
                      backgroundColor: wins > boxIndex ? litColor : "transparent",
                    }}
                  ></div>
                );
              })}
            </div>
            <div
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                fontSize: "70px",
                textAlign: "center",
              }}
            >
              <div>{index === 0 ? teamIconForElement(templeState.lastA) : teamIconForElement(templeState.lastB)}</div>
              {templeState.lastRoundWinner === team.name && (
                <div
                  style={{
                    borderBottom: `4px solid ${team.color === "black" ? "white" : "black"}`,
                    width: "60%",
                    margin: "0 auto",
                  }}
                ></div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderFinalTempleBoard() {
    if (!finalTempleState) return null;
    const [teamA, teamB] = finalTempleState.teams;
    const aPieces = teamPieces[teamA.name] || 0;
    const bPieces = teamPieces[teamB.name] || 0;

    const committedByTeam = (team) => {
      if (finalTempleState.stage === "lowMove") {
        return finalTempleState.lowTeam === team ? finalTempleState.lowPieces : 0;
      }
      if (finalTempleState.stage === "highMove") {
        const lowPart = finalTempleState.lowTeam === team ? finalTempleState.lowPieces : 0;
        const highPart = finalTempleState.highTeam === team ? finalTempleState.highPieces : 0;
        return lowPart + highPart;
      }
      if (finalTempleState.stage === "reveal" || finalTempleState.stage === "collect") {
        const lowPart = finalTempleState.lowTeam === team ? finalTempleState.lowPieces : 0;
        const highPart = finalTempleState.highTeam === team ? finalTempleState.highPieces : 0;
        return lowPart + highPart;
      }
      return 0;
    };

    const visibleAPieces = Math.max(0, aPieces - committedByTeam(teamA));
    const visibleBPieces = Math.max(0, bPieces - committedByTeam(teamB));

    const renderPieceStash = (count) => (
      <div style={{ display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap", minHeight: "24px" }}>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} style={{ color: "saddlebrown", WebkitTextStroke: "1px black", fontSize: "22px", lineHeight: 1 }}>
            ▲
          </span>
        ))}
      </div>
    );

    return (
      <div>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
          Final Temple Pieces Showdown — Round {finalTempleState.round}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "start" }}>
          <div style={{ ...teamBgStyle(teamA.color), ...teamBorderStyle(teamA.color), color: teamTextColor(teamA.color), padding: "10px", minHeight: "220px" }}>
            <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "8px" }}>{teamA.name.replace(" Team", "")}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              {teamA.members.map((m) => (
                <div key={m.name} style={{ textAlign: "center" }}>
                  <img src={m.img} width={80} style={{ backgroundColor: "white", filter: teamA.color === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                  <div style={{ fontWeight: "bold" }}>{m.name}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontWeight: "bold" }}>Temple Pieces: {visibleAPieces}</div>
            {renderPieceStash(visibleAPieces)}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", minWidth: isMobile ? "90px" : "140px", marginTop: "16px" }}>
            {Array.from({ length: finalTempleState.boxCount }, (_, i) => {
              const lowHas = finalTempleState.lowClaimed.includes(i);
              const highHas = finalTempleState.highClaimed.includes(i);
              const lowIsLeft = finalTempleState.lowTeam?.name === teamA.name;
              const leftHas = lowIsLeft ? lowHas : highHas;
              const rightHas = lowIsLeft ? highHas : lowHas;
              const leftColor = lowIsLeft ? finalTempleState.lowTeam?.color : finalTempleState.highTeam?.color;
              const rightColor = lowIsLeft ? finalTempleState.highTeam?.color : finalTempleState.lowTeam?.color;
              const showGold = finalTempleState.stage === "reveal" || finalTempleState.stage === "collect";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: isMobile ? "18px" : "26px", textAlign: "center", fontWeight: "bold" }}>
                    {leftHas ? <span style={{ color: leftColor, WebkitTextStroke: "1px black" }}>▲</span> : ""}
                  </div>
                  <div style={{ width: isMobile ? "36px" : "52px", height: isMobile ? "36px" : "52px", border: "2px solid black", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "22px" : "28px", backgroundColor: showGold && finalTempleState.goldIndex === i ? "#f7d24c" : "transparent" }}>
                    {showGold && finalTempleState.goldIndex === i ? "🔺" : ""}
                  </div>
                  <div style={{ width: isMobile ? "18px" : "26px", textAlign: "center", fontWeight: "bold" }}>
                    {rightHas ? <span style={{ color: rightColor, WebkitTextStroke: "1px black" }}>▲</span> : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...teamBgStyle(teamB.color), ...teamBorderStyle(teamB.color), color: teamTextColor(teamB.color), padding: "10px", minHeight: "220px" }}>
            <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "8px" }}>{teamB.name.replace(" Team", "")}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              {teamB.members.map((m) => (
                <div key={m.name} style={{ textAlign: "center" }}>
                  <img src={m.img} width={80} style={{ backgroundColor: "white", filter: teamB.color === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                  <div style={{ fontWeight: "bold" }}>{m.name}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontWeight: "bold" }}>Temple Pieces: {visibleBPieces}</div>
            {renderPieceStash(visibleBPieces)}
          </div>
        </div>
      </div>
    );
  }

  function renderRightToStayGrid(list, eliminatedNames = []) {
    return (
      <div className="grid grid-cols-14 gap-1">
        {list.map((p) => {
          const isOut = eliminatedNames.includes(p.name);
          return (
            <div key={p.name} style={{ border: "1px solid black", padding: "6px", textAlign: "center", opacity: isOut ? 0.35 : 1, position: "relative" }}>
              <img src={p.img} width={80} style={{ backgroundColor: "white", margin: "0 auto 6px auto" }} />
              <div style={{ fontWeight: "bold" }}>{p.name}</div>
              {isOut && <div style={{ position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", fontSize: "56px", color: "red", WebkitTextStroke: "2px black" }}>✕</div>}
            </div>
          );
        })}
      </div>
    );
  }

  function renderDraftChallenge() {
    if (!preGameState) return null;
    const state = preGameState;
    const availableWithoutWinner = state.available.filter(
      (p) => p.name !== state.currentWinner?.name && p.name !== state.partner?.name
    );

    return (
      <div>
        <div style={{ marginBottom: "12px", fontWeight: "bold" }}>Team Picking Challenge</div>
        {state.currentWinner && (
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Winner</div>
            <div
              style={{
                display: "inline-flex",
                gap: "10px",
                padding: state.step === "showColor" && state.chosenTeam ? "10px" : 0,
                borderRadius: state.step === "showColor" && state.chosenTeam ? "8px" : 0,
                ...(state.step === "showColor" && state.chosenTeam ? teamBgStyle(state.chosenTeam.color) : {}),
                color: state.step === "showColor" && state.chosenTeam ? teamTextColor(state.chosenTeam.color) : "inherit",
                ...(state.step === "showColor" && state.chosenTeam ? teamBorderStyle(state.chosenTeam.color) : {}),
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {state.step === "showColor" && state.chosenTeam && (
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {state.chosenTeam.name.replace(" Team", "")}
                </div>
              )}
              <div style={{ display: "inline-flex", gap: "10px" }}>
                <div>
                  <img src={state.currentWinner.img} width={100} style={{ backgroundColor: "white" }} />
                  <div style={{ fontWeight: "bold" }}>{state.currentWinner.name}</div>
                </div>
                {state.partner && (
                  <div>
                    <img src={state.partner.img} width={100} style={{ backgroundColor: "white" }} />
                    <div style={{ fontWeight: "bold" }}>{state.partner.name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: "12px", fontWeight: "bold" }}>Unassigned Contestants</div>
        <div className="grid grid-cols-14 gap-1" style={{ marginBottom: "16px" }}>
          {availableWithoutWinner.map((p) => (
            <div key={p.name} style={{ textAlign: "center" }}>
              <img src={p.img} width={70} style={{ backgroundColor: "white", margin: "0 auto 4px auto" }} />
              <div style={{ fontWeight: "bold", fontSize: "12px" }}>{p.name}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {state.draftTeams.map((team, index) => (
            <div key={team.name + index} style={{ ...teamBgStyle(team.color), ...teamBorderStyle(team.color), color: teamTextColor(team.color), padding: "5px" }}>
              <h3 style={{ textAlign: "center", fontWeight: "bold" }}>{team.name.replace(" Team", "")}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "100px" }}>
                {team.members.map((m) => (
                  <div key={m.name} style={{ textAlign: "center" }}>
                    <img src={m.img} width={70} style={{ backgroundColor: "white", filter: team.color === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                    <div style={{ fontWeight: "bold" }}>{m.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <div className="p-4">
        <h1>Endurance Simulator</h1>

      {phase !== "finished" ? (
        <button style={{ border: "2px solid black", padding: "6px 12px" }} onClick={advance}>Advance</button>
      ) : (
        <button onClick={initialize}>Resimulate</button>
      )}

      {phase === "cast" ? (
        <div>
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button onClick={openAddCastModal} style={{ border: "2px solid black", padding: "6px 12px", fontWeight: "bold" }}>
              Add Cast Members
            </button>

            {players.length > 0 && (
              <button onClick={clearRoster} style={{ border: "2px solid black", padding: "6px 12px", fontWeight: "bold" }}>
                Clear Roster
              </button>
            )}

            <Link href="/custom-casts" style={{ border: "2px solid black", padding: "6px 12px", fontWeight: "bold", color: "black", textDecoration: "none" }}>
              Manage Casts
            </Link>

            <label style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={customTeamsMode} onChange={toggleCustomTeams} />
              custom teams
            </label>
          </div>

          {!customTeamsMode ? (
            <div>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                  <button onClick={selectAllTeams} style={{ border: "1px solid black" }}>All</button>
                  <button onClick={deselectAllTeams} style={{ border: "1px solid black" }}>None</button>
                </div>
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Teams Playing</div>
                <div className="grid grid-cols-5 gap-2">
                  {ALL_COLORS.map((color) => (
                    <button key={color} onClick={() => toggleTeamColor(color)} style={{ padding: "6px", border: "1px solid black", background: selectedColors.includes(color) ? "#ddd" : "#fff", fontWeight: "bold" }}>{color}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button onClick={applyDefaultSetup} style={{ border: "1px solid black" }}>Default</button>
                <button onClick={selectAllCast} style={{ border: "1px solid black" }}>All</button>
                <button onClick={deselectAllCast} style={{ border: "1px solid black" }}>None</button>
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="checkbox" checked={randomCast} onChange={() => setRandomCast((v) => !v)} /> random
                </label>
              </div>

              {players.length === 0 ? (
                <div style={{ border: "1px solid black", padding: "16px", fontWeight: "bold" }}>
                  No cast members added yet. Click Add Cast Members to build your roster.
                </div>
              ) : (
                <div className="grid grid-cols-14 gap-1">
                  {players.map((p) => (
                    <div key={p.name} style={{ position: "relative" }}>
                      <div onClick={() => toggleCast(p.name)} style={{ padding: "4px", textAlign: "center", cursor: "pointer", opacity: activeCast.includes(p.name) ? 1 : 0.35, background: "transparent", aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <img src={p.img} width={58} style={{ backgroundColor: "white", margin: "0 auto 4px auto" }} />
                        <div style={{ fontWeight: "bold", fontSize: "12px", lineHeight: "14px" }}>{p.name}</div>
                      </div>
                      <button onClick={() => removeFromRoster(p.name)} style={{ position: "absolute", top: 0, right: 0, border: "1px solid black", background: "red", color: "white", fontWeight: "bold", width: "20px", height: "20px", lineHeight: "16px" }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Unassigned Cast</div>
              <div className="grid grid-cols-14 gap-1" style={{ marginBottom: "16px" }}>
                {getUnassignedPlayers().map((p) => (
                  <div key={p.name} draggable onDragStart={() => onDragStart(p.name)} style={{ padding: "4px", textAlign: "center", cursor: "grab", background: "transparent" }}>
                    <img src={p.img} width={50} style={{ backgroundColor: "white", margin: "0 auto" }} />
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Drag 2 cast members into any teams you want</div>
              <div className="grid grid-cols-6 gap-1">
                {ALL_COLORS.map((color) => {
                  const members = (draftTeams[color] || []).map((name) => players.find((p) => p.name === name)).filter(Boolean);
                  return (
                    <div key={color} onDragOver={allowDrop} onDrop={() => onDropToTeam(color)} style={{ ...teamBgStyle(color.toLowerCase()), ...teamBorderStyle(color.toLowerCase()), color: teamTextColor(color.toLowerCase()), padding: "3px", position: "relative", minHeight: "90px" }}>
                      <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "2px", fontSize: "12px" }}>{color}</div>
                      <div style={{ display: "flex", alignItems: "center", paddingRight: "80px", gap: "8px" }}>
                        {members.map((m) => (
                          <div key={m.name} style={{ textAlign: "center" }} onDoubleClick={() => removePlayerFromDraft(m.name)}>
                            <img src={m.img} width={70} style={{ backgroundColor: "white", margin: "2px", filter: color.toLowerCase() === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : phase === "rightToStayIntro" && preGameState ? (
        renderRightToStayGrid(preGameState.candidates)
      ) : phase === "rightToStayResult" && preGameState ? (
        renderRightToStayGrid(preGameState.ranked, preGameState.ranked.slice(-2).map((p) => p.name))
      ) : phase === "draftChallenge" ? (
        renderDraftChallenge()
      ) : phase === "teamsFormed" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {teams.map((team, index) => renderTeamCard(team, index))}
        </div>
      ) : phase === "pieceTransfer" && pieceTransferState ? (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "10px" }}>{pieceTransferState.loser.name} must give their temple pieces away.</div>
          <button
            onClick={() => {
              const options = pieceTransferState.options;
              const randomTeam = pickDonationTargetWithBias(pieceTransferState.loser.name, options, missionWinner?.name)
              autoResolvePieceTransfer(randomTeam);
            }}
            style={{ marginBottom: "10px", border: "2px solid black", padding: "6px 12px" }}
          >
            Random
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {pieceTransferState.options.map((team, index) => (
              <div key={team.name}>
                {renderTeamCard(team, index)}
                <button
                  onClick={() => {
                    const loser = pieceTransferState.loser;
                    transferPieces(loser.name, team.name);
                    setTeams((curr) => curr.map((t) => (t.name === loser.name ? { ...t, eliminated: true } : t)));
                    setPlacements((curr) => [
                      {
                        team: loser,
                        madeBy: pieceTransferState.templeWinner,
                        challengeWinner: missionWinner,
                        place: teams.filter((t) => !t.eliminated).length,
                      },
                      ...curr,
                    ]);
                    setLog([
                      `Episode ${episode}: Temple`,
                      ...templeState.rounds,
                      `${loser.name} eliminated`,
                      `${loser.name} gave their temple pieces to ${team.name}`,
                    ]);
                    setEpisode((e) => e + 1);
                    setMissionWinner(null);
                    setTempleState(null);
                    setPieceTransferState(null);
                    setPhase("mission");
                  }}
                  style={{ marginTop: "8px", border: "1px solid black", padding: "6px 10px" }}
                >
                  Give pieces here
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "20px", overflowX: "auto" }}>
            {[
              {
                team: pieceTransferState.loser,
                madeBy: pieceTransferState.templeWinner,
                challengeWinner: missionWinner,
                place: teams.filter((t) => !t.eliminated).length,
              },
              ...placements,
            ].map((p, i) => (
              <div key={`${p.team.name}-${i}`} style={{ display: "flex", alignItems: "center", margin: "2px", minWidth: "fit-content" }}>
                <div style={{ marginRight: "5px" }}>{p.place}</div>
                <div style={{ display: "flex", border: "2px solid black", ...teamBgStyle(p.team.color), padding: isMobile ? "6px 24px" : "6px 160px" }}>
                  {p.team.members.map((m) => (
                    <img key={m.name} src={m.img} width={100} style={{ marginRight: "4px", filter: p.team.color === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                  ))}
                </div>
                <div style={{ width: isMobile ? "70px" : "100px", height: isMobile ? "70px" : "100px", ...teamBgStyle(p.madeBy.color), marginLeft: "5px", border: "2px solid black" }} />
                <div style={{ width: isMobile ? "50px" : "70px", height: isMobile ? "50px" : "70px", ...(p.challengeWinner ? teamBgStyle(p.challengeWinner.color) : { backgroundColor: "transparent" }), marginLeft: "5px", border: "2px solid black" }} />
              </div>
            ))}
          </div>
        </div>
      ) : phase === "finalTwo" && finalTempleState ? (
        renderFinalTempleBoard()
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {visibleTeams.map((team, index) => renderTeamCard(team, index))}
        </div>
      )}

      <div>{log.map((line, i) => <div key={i}>{line}</div>)}</div>

      {!(phase === "temple" || phase === "templeResult" || phase === "finalTwo" || phase === "draftChallenge") && (
        <div style={{ display: "flex", flexDirection: "column", marginTop: "20px", overflowX: "auto" }}>
          {placements.map((p, i) => (
            <div key={`${p.team.name}-${i}`} style={{ display: "flex", alignItems: "center", margin: "2px", minWidth: "fit-content" }}>
              <div style={{ marginRight: "5px" }}>{p.place}</div>
              <div style={{ display: "flex", border: "2px solid black", ...teamBgStyle(p.team.color), padding: isMobile ? "6px 24px" : "6px 160px" }}>
                {p.team.members.map((m) => (
                  <img key={m.name} src={m.img} width={100} style={{ marginRight: "4px", filter: p.team.color === "negative" ? "invert(1) hue-rotate(180deg) contrast(1.2)" : "" }} />
                ))}
              </div>
              <div style={{ width: isMobile ? "70px" : "100px", height: isMobile ? "70px" : "100px", ...teamBgStyle(p.madeBy.color), marginLeft: "5px", border: "2px solid black" }} />
              <div style={{ width: isMobile ? "50px" : "70px", height: isMobile ? "50px" : "70px", ...(p.challengeWinner ? teamBgStyle(p.challengeWinner.color) : { backgroundColor: "transparent" }), marginLeft: "5px", border: "2px solid black" }} />
            </div>
          ))}
        </div>
      )}

      {winner && (
        <div style={{ marginTop: "20px", border: "2px solid black", padding: "12px" }}>
          <h2>Winner: {winner.name}</h2>

          <div style={{ display: "grid", gap: "8px", maxWidth: "520px" }}>
            <input
              value={seasonTitle}
              onChange={(e) => setSeasonTitle(e.target.value)}
              placeholder="Season title"
              style={{ border: "1px solid black", padding: "8px" }}
            />

            <textarea
              value={seasonSummary}
              onChange={(e) => setSeasonSummary(e.target.value)}
              placeholder="Season summary"
              rows={3}
              style={{ border: "1px solid black", padding: "8px" }}
            />

            <label style={{ display: "flex", gap: "6px", alignItems: "center", fontWeight: "bold" }}>
              <input
                type="checkbox"
                checked={isPublicSeason}
                onChange={(e) => setIsPublicSeason(e.target.checked)}
              />
              Post publicly
            </label>

            <button
              onClick={saveSeason}
              disabled={savingSeason}
              style={{ border: "2px solid black", padding: "8px 12px", fontWeight: "bold", background: savingSeason ? "#ddd" : "#93c5fd" }}
            >
              {savingSeason ? "Saving..." : "Save Season"}
            </button>
          </div>
        </div>
      )}

      {phase !== "finished" && (
        <div style={{ marginTop: "20px" }}>
          <button style={{ border: "2px solid black", padding: "6px 12px" }} onClick={advance}>Advance</button>
        </div>
      )}

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
            <p className="text-slate-400 text-sm">
              Pick an official or custom cast, select people, then add them to this Endurance roster.
            </p>
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
                {Object.keys(groupedOfficial).length > 0 && (
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
                )}

                {customCasts.length > 0 && (
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
                )}
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
