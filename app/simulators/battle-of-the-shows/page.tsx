// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const TEAM_COLORS = [
  "red",
  "orange",
  "yellow",
  "lime",
  "green",
  "cyan",
  "blue",
  "navy",
  "indigo",
  "purple",
  "pink",
  "gray",
  "white",
  "brown",
  "tan",
  "black",
  "salmon",
  "maroon",
  "gold",
  "olive",
  "teal",
  "magenta",
  "lavender",
];

const COLOR_STYLES = {
  red: "bg-red-600 border-red-400 text-white",
  orange: "bg-orange-500 border-orange-300 text-white",
  yellow: "bg-yellow-400 border-yellow-200 text-black",
  lime: "bg-lime-500 border-lime-300 text-black",
  green: "bg-green-600 border-green-300 text-white",
  cyan: "bg-cyan-500 border-cyan-300 text-black",
  blue: "bg-blue-600 border-blue-300 text-white",
  navy: "bg-slate-800 border-slate-500 text-white",
  indigo: "bg-indigo-600 border-indigo-300 text-white",
  purple: "bg-purple-600 border-purple-300 text-white",
  pink: "bg-pink-500 border-pink-300 text-white",
  gray: "bg-gray-500 border-gray-300 text-white",
  white: "bg-white border-zinc-300 text-black",
  brown: "bg-amber-800 border-amber-500 text-white",
  tan: "bg-amber-200 border-amber-300 text-black",
  black: "bg-black border-zinc-600 text-white",
  salmon: "bg-rose-300 border-rose-400 text-black",
  maroon: "bg-red-900 border-red-700 text-white",
  gold: "bg-yellow-300 border-yellow-500 text-black",
  olive: "bg-lime-700 border-lime-500 text-white",
  teal: "bg-teal-600 border-teal-400 text-white",
  magenta: "bg-fuchsia-600 border-fuchsia-400 text-white",
  lavender: "bg-purple-200 border-purple-300 text-black",
};

const STAGE_LABELS = {
  setup: "Setup",
  overview: "Teams",
  ranking: "Challenge Rankings",
  choose: "Mystery Team",
  selection: "Opponent Revealed",
  voting: "Voting",
  voting_results: "Nominees Revealed",
  lineup: "Elimination Lineup",
  assignment: "Numbers Assigned",
  matchups: "Matchups",
  duel: "Matchup",
  duel_result: "Result",
  champion: "Champion",
};

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickOne(items) {
  if (!items?.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function colorClass(color) {
  return COLOR_STYLES[color] || COLOR_STYLES.gray;
}

function fallbackAvatar(name) {
  const initials = String(name || "?")
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' font-size='82' fill='white' font-family='Arial' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function aliveTeams(teams) {
  return teams.filter((team) => team.players.length > 0);
}

function createTeams(selectedNames, manualColors, inactiveColors, sourceTeams, teamSize) {
  const chosen = sourceTeams.filter((team) => selectedNames.includes(team.name));
  const assigned = Object.values(manualColors).filter(Boolean);
  const pool = shuffle(
    TEAM_COLORS.filter((color) => !inactiveColors.includes(color) && !assigned.includes(color))
  );

  return chosen.map((teamData, teamIndex) => {
    const id = `team-${slugify(teamData.name)}`;
    const color =
      manualColors[teamData.name] ||
      pool[teamIndex % Math.max(pool.length, 1)] ||
      TEAM_COLORS[teamIndex % TEAM_COLORS.length];

    const chosenPlayers = shuffle(teamData.players).slice(0, teamSize);

    return {
      id,
      name: teamData.name,
      color,
      players: chosenPlayers.map((player, playerIndex) => ({
        id: `${id}-${slugify(player.name)}-${playerIndex}`,
        name: player.name,
        image: player.image,
        teamId: id,
      })),
    };
  });
}

function rankTeams(teams) {
  const active = aliveTeams(teams);
  if (active.length <= 2) return { ranking: active, finalTwo: true };
  const ranking = shuffle(active);
  return {
    ranking,
    winnerTeamId: ranking[0].id,
    losingTeamId: ranking[ranking.length - 1].id,
    finalTwo: false,
  };
}

function voteTeam(team, count) {
  const tally = Object.fromEntries(team.players.map((player) => [player.id, 0]));

  team.players.forEach((voter) => {
    const options = team.players.filter((player) => player.id !== voter.id);
    const target = options.length ? pickOne(options) : voter;
    tally[target.id] += 1;
  });

  const nominees = [...team.players]
    .sort((a, b) => {
      const diff = tally[b.id] - tally[a.id];
      return diff || Math.random() - 0.5;
    })
    .slice(0, Math.min(count, team.players.length));

  return { tally, nominees };
}

function createVoting(teams, losingTeamId, challengerTeamId, finalTwo) {
  const active = aliveTeams(teams);
  const teamA = finalTwo ? active[0] : teams.find((team) => team.id === losingTeamId);
  const teamB = finalTwo ? active[1] : teams.find((team) => team.id === challengerTeamId);

  if (!teamA || !teamB) return null;

  const single = teamA.players.length === 1 || teamB.players.length === 1;
  const count = single ? 1 : 2;

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    teamAVote: voteTeam(teamA, count),
    teamBVote: voteTeam(teamB, count),
    singleEliminationRound: single,
  };
}

function createMatchups(voting) {
  const left = shuffle(voting.teamAVote.nominees);
  const right = shuffle(voting.teamBVote.nominees);
  const count = Math.min(left.length, right.length);

  return {
    pairs: Array.from({ length: count }, (_, index) => ({
      slot: index + 1,
      a: left[index],
      b: right[index],
    })),
  };
}

function createResults(matchups) {
  return {
    results: matchups.pairs.map((pair) => {
      const leftWins = Math.random() < 0.5;
      return {
        ...pair,
        winner: leftWins ? pair.a : pair.b,
        loser: leftWins ? pair.b : pair.a,
      };
    }),
  };
}

function removeLosers(teams, results) {
  const loserIds = new Set(results.results.map((result) => result.loser.id));
  return teams
    .map((team) => ({
      ...team,
      players: team.players.filter((player) => !loserIds.has(player.id)),
    }))
    .filter((team) => team.players.length > 0);
}

function Card({ className = "", children }) {
  return <div className={`rounded-2xl ${className}`}>{children}</div>;
}

function CardHeader({ className = "", children }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }) {
  return <div className={`text-2xl font-bold ${className}`}>{children}</div>;
}

function Button({ className = "", variant, disabled, onClick, children, type = "button" }) {
  const base =
    variant === "outline"
      ? "border border-zinc-700 bg-transparent text-white hover:bg-white/10"
      : "bg-white text-black hover:bg-zinc-200";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 font-bold ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ className = "", children }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function PlayerTile({ player, votes = 0, badge, gray = false, selected = false }) {
  return (
    <div
      className={`rounded-2xl border bg-black/20 p-1.5 shadow-lg sm:p-3 ${
        selected ? "scale-105 border-red-500 ring-2 ring-red-400" : "border-white/15"
      }`}
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={player.image || fallbackAvatar(player.name)}
          alt={player.name}
          className={`h-full w-full object-cover ${gray ? "grayscale" : ""}`}
          onError={(event) => {
            event.currentTarget.src = fallbackAvatar(player.name);
          }}
        />
      </div>
      <div className="mt-2 text-center">
        <div className="truncate text-[10px] font-bold sm:text-base">{player.name}</div>
        {votes > 0 ? <div className="mt-1 text-xs opacity-90">Votes: {votes}</div> : null}
        {badge ? <div className="mt-1 text-xs font-bold uppercase tracking-wide">{badge}</div> : null}
      </div>
    </div>
  );
}

function TeamPanel({ team, subtitle, children }) {
  return (
    <Card className={`overflow-hidden border-2 ${colorClass(team.color)} shadow-2xl`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-xl sm:text-2xl">{team.name}</CardTitle>
          <Badge className="border border-black/10 bg-black/20 text-inherit">
            {team.players.length} left
          </Badge>
        </div>
        {subtitle ? <div className="text-sm opacity-90">{subtitle}</div> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TeamGrid({ team, subtitle, voteData }) {
  const nominees = new Set((voteData?.nominees || []).map((player) => player.id));
  return (
    <TeamPanel team={team} subtitle={subtitle}>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {team.players.map((player) => (
          <PlayerTile
            key={player.id}
            player={player}
            votes={voteData?.tally?.[player.id] || 0}
            badge={nominees.has(player.id) ? "Selected" : undefined}
            selected={nominees.has(player.id)}
          />
        ))}
      </div>
    </TeamPanel>
  );
}

function DuelCard({ pair, result, teams }) {
  const leftTeam = teams.find((team) => team.id === pair.a.teamId);
  const rightTeam = teams.find((team) => team.id === pair.b.teamId);
  const leftLost = result?.loser?.id === pair.a.id;
  const rightLost = result?.loser?.id === pair.b.id;

  return (
    <Card className="overflow-hidden border border-zinc-800 bg-zinc-950/90 text-white shadow-xl">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
          <div className={`rounded-2xl border-2 p-2 sm:p-3 ${colorClass(leftTeam?.color)}`}>
            <PlayerTile
              player={pair.a}
              badge={result ? (leftLost ? "Eliminated" : "Winner") : `${pair.slot}`}
              gray={leftLost}
            />
          </div>
          <div className="text-center text-sm font-black text-zinc-400 md:text-2xl">VS</div>
          <div className={`rounded-2xl border-2 p-2 sm:p-3 ${colorClass(rightTeam?.color)}`}>
            <PlayerTile
              player={pair.b}
              badge={result ? (rightLost ? "Eliminated" : "Winner") : `${pair.slot}`}
              gray={rightLost}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BattleOfTheShowsSimulator() {
  const router = useRouter();

  const [sourceTeams, setSourceTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [manualColors, setManualColors] = useState({});
  const [inactiveColors, setInactiveColors] = useState([]);
  const [draggedColor, setDraggedColor] = useState(null);
  const [mobileColor, setMobileColor] = useState(null);
  const [teamSize, setTeamSize] = useState(10);

  const [stage, setStage] = useState("setup");
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);
  const [seasonHistory, setSeasonHistory] = useState([]);
  const [season, setSeason] = useState({
    teams: [],
    round: 0,
    ranking: null,
    challengerTeamId: null,
    voting: null,
    matchups: null,
    results: null,
    currentMatchIndex: 0,
    champion: null,
  });

  const activeTeams = useMemo(() => aliveTeams(season.teams), [season.teams]);
  const assignedColors = Object.values(manualColors).filter(Boolean);
  const availableColors = TEAM_COLORS.filter(
    (color) => !inactiveColors.includes(color) && !assignedColors.includes(color)
  );

  const eligibleTeams = useMemo(
    () => sourceTeams.filter((team) => team.players.length >= teamSize),
    [sourceTeams, teamSize]
  );

  useEffect(() => {
    loadShowTeams();
  }, []);

  async function loadShowTeams() {
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
      setLoadingTeams(false);
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
        setLoadingTeams(false);
        return;
      }

      officialCasts = officialData || [];
    }

    const allCasts = [...officialCasts, ...(userCasts || [])];

    if (allCasts.length === 0) {
      setSourceTeams([]);
      setSelectedTeams([]);
      setLoadingTeams(false);
      return;
    }

    const { data: contestants, error: contestantsError } = await supabase
      .from("contestants")
      .select("id, name, image_url, cast_id")
      .in("cast_id", allCasts.map((cast) => cast.id))
      .order("created_at", { ascending: true });

    if (contestantsError) {
      alert(contestantsError.message);
      setLoadingTeams(false);
      return;
    }

    const castById = new Map(allCasts.map((cast) => [cast.id, cast]));
    const grouped = new Map();

    (contestants || []).forEach((person) => {
      const cast = castById.get(person.cast_id);
      const teamName = cast?.show_name || cast?.name || "Unknown Show";

      if (!grouped.has(teamName)) {
        grouped.set(teamName, {
          id: slugify(teamName),
          name: teamName,
          players: [],
          castNames: new Set(),
        });
      }

      grouped.get(teamName).players.push({
        id: `${person.cast_id}-${person.id}`,
        name: person.name,
        image: person.image_url || "",
      });

      if (cast?.name) grouped.get(teamName).castNames.add(cast.name);
    });

    const teams = Array.from(grouped.values())
      .map((team) => ({
        ...team,
        castNames: Array.from(team.castNames),
      }))
      .filter((team) => team.players.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    setSourceTeams(teams);
    setSelectedTeams(teams.filter((team) => team.players.length >= teamSize).map((team) => team.name));
    setLoadingTeams(false);
  }

  function selectAllTeams() {
    setSelectedTeams(eligibleTeams.map((team) => team.name));
  }

  function selectNoTeams() {
    setSelectedTeams([]);
  }

  function toggleTeam(teamName) {
    const team = sourceTeams.find((item) => item.name === teamName);
    if (!team || team.players.length < teamSize) return;

    setSelectedTeams((current) =>
      current.includes(teamName) ? current.filter((name) => name !== teamName) : [...current, teamName]
    );
  }

  function assignColor(teamName, color) {
    if (!color) return;
    setInactiveColors((current) => current.filter((item) => item !== color));
    setManualColors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((name) => {
        if (next[name] === color) delete next[name];
      });
      next[teamName] = color;
      return next;
    });
  }

  function deactivateColor(color) {
    if (!color) return;
    setManualColors((current) => {
      const next = { ...current };
      Object.keys(next).forEach((name) => {
        if (next[name] === color) delete next[name];
      });
      return next;
    });
    setInactiveColors((current) => (current.includes(color) ? current : [...current, color]));
  }

  function clearColor(teamName) {
    setManualColors((current) => {
      const next = { ...current };
      delete next[teamName];
      return next;
    });
  }

  function recordHistory(nextStage, nextSeason) {
    setSeasonHistory((current) => [
      ...current,
      {
        stage: nextStage,
        round: nextSeason.round,
        teams: nextSeason.teams,
        ranking: nextSeason.ranking,
        challengerTeamId: nextSeason.challengerTeamId,
        voting: nextSeason.voting,
        matchups: nextSeason.matchups,
        results: nextSeason.results,
        currentMatchIndex: nextSeason.currentMatchIndex,
        champion: nextSeason.champion,
      },
    ]);
  }

  function startSeason() {
    if (selectedTeams.length < 2) return;

    const createdTeams = createTeams(selectedTeams, manualColors, inactiveColors, sourceTeams, teamSize);

    const nextSeason = {
      teams: createdTeams,
      round: 1,
      ranking: null,
      challengerTeamId: null,
      voting: null,
      matchups: null,
      results: null,
      currentMatchIndex: 0,
      champion: null,
    };

    setSeason(nextSeason);
    setSeasonHistory([{ stage: "overview", round: 1, teams: createdTeams }]);
    setStage("overview");
  }

  function resetSeason() {
    setStage("setup");
    setSeason({
      teams: [],
      round: 0,
      ranking: null,
      challengerTeamId: null,
      voting: null,
      matchups: null,
      results: null,
      currentMatchIndex: 0,
      champion: null,
    });
    setSeasonHistory([]);
  }

  function advance() {
    if (stage === "overview") {
      const ranking = rankTeams(season.teams);
      if (ranking.finalTwo) {
        const nextSeason = { ...season, ranking, voting: createVoting(season.teams, null, null, true) };
        setSeason(nextSeason);
        setStage("voting");
        recordHistory("voting", nextSeason);
      } else {
        const nextSeason = { ...season, ranking, challengerTeamId: null };
        setSeason(nextSeason);
        setStage("ranking");
        recordHistory("ranking", nextSeason);
      }
      return;
    }

    if (stage === "ranking") {
      const options = season.ranking.ranking.filter(
        (team) => team.id !== season.ranking.winnerTeamId && team.id !== season.ranking.losingTeamId
      );
      const challenger = pickOne(options);
      const nextSeason = { ...season, challengerTeamId: challenger.id };
      setSeason(nextSeason);
      setStage("choose");
      recordHistory("choose", nextSeason);
      return;
    }

    if (stage === "choose") {
      setStage("selection");
      recordHistory("selection", season);
      return;
    }

    if (stage === "selection") {
      const nextSeason = {
        ...season,
        voting: createVoting(season.teams, season.ranking.losingTeamId, season.challengerTeamId, false),
      };
      setSeason(nextSeason);
      setStage("voting");
      recordHistory("voting", nextSeason);
      return;
    }

    if (stage === "voting") {
      setStage("voting_results");
      recordHistory("voting_results", season);
      return;
    }

    if (stage === "voting_results") {
      setStage("lineup");
      recordHistory("lineup", season);
      return;
    }

    if (stage === "lineup") {
      const nextSeason = { ...season, matchups: createMatchups(season.voting), currentMatchIndex: 0 };
      setSeason(nextSeason);
      setStage("assignment");
      recordHistory("assignment", nextSeason);
      return;
    }

    if (stage === "assignment") {
      setStage("matchups");
      recordHistory("matchups", season);
      return;
    }

    if (stage === "matchups") {
      const nextSeason = { ...season, results: createResults(season.matchups), currentMatchIndex: 0 };
      setSeason(nextSeason);
      setStage("duel");
      recordHistory("duel", nextSeason);
      return;
    }

    if (stage === "duel") {
      setStage("duel_result");
      recordHistory("duel_result", season);
      return;
    }

    if (stage === "duel_result") {
      const pairCount = season.matchups?.pairs.length || 0;
      if (season.currentMatchIndex + 1 < pairCount) {
        const nextSeason = { ...season, currentMatchIndex: season.currentMatchIndex + 1 };
        setSeason(nextSeason);
        setStage("duel");
        recordHistory("duel", nextSeason);
        return;
      }

      const nextTeams = removeLosers(season.teams, season.results);
      const remaining = aliveTeams(nextTeams);

      if (remaining.length === 1) {
        const nextSeason = { ...season, teams: nextTeams, champion: remaining[0] };
        setSeason(nextSeason);
        setStage("champion");
        recordHistory("champion", nextSeason);
        return;
      }

      const nextSeason = {
        ...season,
        teams: nextTeams,
        round: season.round + 1,
        ranking: null,
        challengerTeamId: null,
        voting: null,
        matchups: null,
        results: null,
        currentMatchIndex: 0,
      };

      setSeason(nextSeason);
      setStage("overview");
      recordHistory("overview", nextSeason);
    }
  }

  async function saveSeason() {
    if (stage !== "champion" || !season.champion) {
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
        simulator_type: "battle-of-the-shows",
        title: seasonTitle.trim() || "Battle of the Shows Season",
        summary:
          seasonSummary.trim() ||
          `${season.champion.name} won Battle of the Shows with ${season.champion.players.length} players remaining.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "battle-of-the-shows",
          teamSize,
          startingTeams: seasonHistory[0]?.teams || [],
          history: seasonHistory,
          finalTeams: season.teams,
          winner: season.champion,
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

  const winnerTeam = season.teams.find((team) => team.id === season.ranking?.winnerTeamId);
  const loserTeam = season.teams.find((team) => team.id === season.ranking?.losingTeamId);
  const challengerTeam = season.teams.find((team) => team.id === season.challengerTeamId);
  const votingTeamA = season.teams.find((team) => team.id === season.voting?.teamAId);
  const votingTeamB = season.teams.find((team) => team.id === season.voting?.teamBId);
  const currentPair = season.matchups?.pairs[season.currentMatchIndex];
  const currentResult = season.results?.results[season.currentMatchIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        <div>
          <Card className="border border-zinc-800 bg-zinc-950/90 text-white shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-3xl font-black tracking-tight sm:text-5xl">Battle of the Shows</div>
                  <div className="mt-2 text-sm text-zinc-300 sm:text-base">
                    {stage === "setup"
                      ? "Teams are grouped by show from your saved casts."
                      : `Round ${season.round} • ${STAGE_LABELS[stage] || stage}`}
                  </div>
                </div>
                {stage !== "setup" ? (
                  <div className="flex gap-2">
                    <Button onClick={advance} className="rounded-2xl px-6 py-6 font-bold">
                      Advance
                    </Button>
                    <Button variant="outline" onClick={resetSeason} className="rounded-2xl border-zinc-700 bg-transparent">
                      Main Menu
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {stage === "setup" && loadingTeams ? (
          <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
            <CardContent>
              <div className="text-2xl font-black">Loading shows...</div>
            </CardContent>
          </Card>
        ) : null}

        {stage === "setup" && !loadingTeams ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
              <CardHeader>
                <CardTitle>Select Shows</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceTeams.length === 0 ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">
                    No casts found. Add/favorite casts first, and make sure they have a show name.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sourceTeams.map((teamItem) => {
                      const eligible = teamItem.players.length >= teamSize;
                      const active = selectedTeams.includes(teamItem.name);
                      const assignedColor = manualColors[teamItem.name];

                      return (
                        <div
                          key={teamItem.name}
                          role="button"
                          tabIndex={0}
                          className={`rounded-2xl border p-4 text-left ${
                            !eligible
                              ? "opacity-35 grayscale border-zinc-900 bg-zinc-950"
                              : active
                                ? "border-white bg-white/10"
                                : "border-zinc-800 bg-zinc-900"
                          }`}
                          onClick={() => {
                            if (!eligible) return;
                            if (mobileColor) {
                              assignColor(teamItem.name, mobileColor);
                              setMobileColor(null);
                            } else {
                              toggleTeam(teamItem.name);
                            }
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (!eligible) return;
                            assignColor(teamItem.name, draggedColor);
                            setDraggedColor(null);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-bold">{teamItem.name}</div>
                              <div className="text-sm text-zinc-400">
                                {teamItem.players.length} available • starts with {Math.min(teamSize, teamItem.players.length)}
                              </div>
                              {!eligible ? (
                                <div className="text-xs font-bold text-red-300">Needs at least {teamSize}</div>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {assignedColor ? (
                                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${colorClass(assignedColor)}`}>
                                    {assignedColor}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold uppercase text-zinc-400">
                                    Random active color
                                  </span>
                                )}
                                {assignedColor ? (
                                  <span
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      clearColor(teamItem.name);
                                    }}
                                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold uppercase text-zinc-300"
                                  >
                                    Clear
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded border ${active ? "bg-white" : "bg-transparent"}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
              <CardHeader>
                <CardTitle>Season Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="text-sm text-zinc-400">Selected teams</div>
                  <div className="text-3xl font-black">{selectedTeams.length}</div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" onClick={selectAllTeams} className="rounded-xl">
                      Select All
                    </Button>
                    <Button variant="outline" onClick={selectNoTeams} className="rounded-xl">
                      Select None
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="text-sm text-zinc-400 mb-2">Characters per team</div>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={teamSize}
                    onChange={(e) => {
                      const next = Math.max(1, Number(e.target.value) || 1);
                      setTeamSize(next);
                      setSelectedTeams((current) =>
                        current.filter((name) => sourceTeams.find((team) => team.name === name)?.players.length >= next)
                      );
                    }}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                  />
                  <div className="mt-2 text-xs text-zinc-400">
                    Each team is one show. A show must have this many characters available to start.
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                  <div className="text-sm text-zinc-400">Available colors</div>
                  {mobileColor ? (
                    <div className="mt-2 text-xs text-zinc-400">
                      Selected on mobile: <b>{mobileColor}</b>
                    </div>
                  ) : null}
                  <div className="mt-3 flex min-h-[64px] flex-wrap gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-3">
                    {availableColors.map((color) => (
                      <span
                        key={color}
                        draggable
                        onDragStart={() => setDraggedColor(color)}
                        onDragEnd={() => setDraggedColor(null)}
                        onClick={() => setMobileColor(mobileColor === color ? null : color)}
                        className={`cursor-grab rounded-full border px-3 py-1 text-xs font-bold uppercase ${colorClass(color)} ${
                          mobileColor === color ? "ring-2 ring-white" : ""
                        }`}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-zinc-400">Not active</div>
                  <div
                    onClick={() => {
                      if (mobileColor) {
                        deactivateColor(mobileColor);
                        setMobileColor(null);
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      deactivateColor(draggedColor);
                      setDraggedColor(null);
                    }}
                    className="mt-3 flex min-h-[64px] flex-wrap gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-3"
                  >
                    {inactiveColors.map((color) => (
                      <span
                        key={color}
                        draggable
                        onDragStart={() => setDraggedColor(color)}
                        onDragEnd={() => setDraggedColor(null)}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMobileColor(mobileColor === color ? null : color);
                        }}
                        className={`cursor-grab rounded-full border px-3 py-1 text-xs font-bold uppercase opacity-80 ${colorClass(color)} ${
                          mobileColor === color ? "ring-2 ring-white" : ""
                        }`}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                <Button onClick={startSeason} disabled={selectedTeams.length < 2 || loadingTeams} className="w-full rounded-2xl py-6 text-lg font-bold">
                  Start Simulator
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {stage === "overview" ? (
          <div className="grid gap-4">{activeTeams.map((team) => <TeamGrid key={team.id} team={team} />)}</div>
        ) : null}

        {stage === "ranking" ? (
          <div className="grid gap-4">
            {season.ranking.ranking.map((team, index) => (
              <div key={team.id} className="space-y-2">
                <Badge className="bg-white/10 text-white">#{index + 1}</Badge>
                <TeamGrid
                  team={team}
                  subtitle={
                    team.id === season.ranking.winnerTeamId
                      ? "Challenge Winner"
                      : team.id === season.ranking.losingTeamId
                        ? "Last Place"
                        : `Rank ${index + 1}`
                  }
                />
              </div>
            ))}
          </div>
        ) : null}

        {stage === "choose" ? (
          <div className="space-y-4">
            {winnerTeam ? <TeamGrid team={winnerTeam} subtitle="Winner" /> : null}
            <Card className="border-dashed border-2 border-zinc-600 bg-zinc-900 text-white">
              <CardContent className="p-6 text-center text-3xl font-black">?</CardContent>
            </Card>
            {loserTeam ? <TeamGrid team={loserTeam} subtitle="Last Place" /> : null}
            <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
              <CardContent className="p-4">
                <div className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">
                  Available to be called out
                </div>
                <div className="flex flex-wrap gap-2">
                  {season.ranking.ranking
                    .filter((team) => team.id !== season.ranking.winnerTeamId && team.id !== season.ranking.losingTeamId)
                    .map((team) => (
                      <span key={team.id} className={`rounded-full border px-3 py-1 text-xs font-bold ${colorClass(team.color)}`}>
                        {team.name}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {stage === "selection" ? (
          <div className="space-y-4">
            {winnerTeam ? <TeamGrid team={winnerTeam} subtitle="Winner" /> : null}
            {challengerTeam ? <TeamGrid team={challengerTeam} subtitle="Called Out" /> : null}
            {loserTeam ? <TeamGrid team={loserTeam} subtitle="Last Place" /> : null}
          </div>
        ) : null}

        {stage === "voting" ? (
          <div className="grid gap-4">
            {votingTeamA ? <TeamGrid team={votingTeamA} subtitle="Voting Team" /> : null}
            {votingTeamB ? (
              <TeamGrid team={votingTeamB} subtitle={season.voting?.singleEliminationRound ? "One Match Round" : "Voting Team"} />
            ) : null}
          </div>
        ) : null}

        {stage === "voting_results" ? (
          <div className="grid gap-4">
            {votingTeamA ? <TeamGrid team={votingTeamA} voteData={season.voting.teamAVote} subtitle="Selected for elimination" /> : null}
            {votingTeamB ? <TeamGrid team={votingTeamB} voteData={season.voting.teamBVote} subtitle="Selected for elimination" /> : null}
          </div>
        ) : null}

        {stage === "lineup" ? (
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {[votingTeamA, votingTeamB].map((team, index) => {
              const vote = index === 0 ? season.voting?.teamAVote : season.voting?.teamBVote;
              return team ? (
                <Card key={team.id} className={`border-2 ${colorClass(team.color)}`}>
                  <CardContent className="p-4">
                    <div className="mb-3 text-center text-lg font-black sm:text-2xl">{team.name}</div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {vote.nominees.map((player) => (
                        <PlayerTile key={player.id} player={player} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })}
          </div>
        ) : null}

        {stage === "assignment" ? (
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {[votingTeamA, votingTeamB].map((team, index) =>
              team ? (
                <Card key={team.id} className={`border-2 ${colorClass(team.color)}`}>
                  <CardContent className="p-4">
                    <div className="mb-3 text-center text-lg font-black sm:text-2xl">{team.name}</div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {season.matchups.pairs.map((pair) => (
                        <PlayerTile key={index === 0 ? pair.a.id : pair.b.id} player={index === 0 ? pair.a : pair.b} badge={`${pair.slot}`} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        ) : null}

        {stage === "matchups" ? (
          <div className="grid gap-4">
            {season.matchups.pairs.map((pair) => (
              <div key={pair.slot}>
                <div className="mb-2 px-1 text-base font-black sm:text-lg">Match {pair.slot}</div>
                <DuelCard pair={pair} teams={season.teams} />
              </div>
            ))}
          </div>
        ) : null}

        {stage === "duel" && currentPair ? (
          <>
            <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
              <CardContent className="p-4">
                <div className="text-lg font-bold">Matchup {currentPair.slot}</div>
              </CardContent>
            </Card>
            <DuelCard pair={currentPair} teams={season.teams} />
          </>
        ) : null}

        {stage === "duel_result" && currentPair && currentResult ? (
          <>
            <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
              <CardContent className="p-4">
                <div className="text-lg font-bold">Result {currentResult.slot}</div>
              </CardContent>
            </Card>
            <DuelCard pair={currentPair} result={currentResult} teams={season.teams} />
          </>
        ) : null}

        {stage === "champion" && season.champion ? (
          <>
            <Card className="overflow-hidden border border-yellow-500 bg-gradient-to-br from-yellow-500/20 via-zinc-950 to-zinc-950 text-white shadow-2xl">
              <CardContent className="p-6 text-center sm:p-10">
                <div className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">Winner</div>
                <div className="mt-3 text-4xl font-black sm:text-6xl">{season.champion.name}</div>
                <div className="mt-2 text-lg text-zinc-300 sm:text-2xl">Battle of the Shows Champion</div>
              </CardContent>
            </Card>
            <TeamGrid team={season.champion} subtitle="Final surviving team" />
          </>
        ) : null}

        {stage === "champion" && season.champion ? (
          <Card className="border border-zinc-800 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle>Save Season</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                placeholder="Season title"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              />

              <textarea
                value={seasonSummary}
                onChange={(e) => setSeasonSummary(e.target.value)}
                placeholder="Season summary"
                rows={3}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              />

              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" checked={isPublicSeason} onChange={(e) => setIsPublicSeason(e.target.checked)} />
                Post publicly
              </label>

              <Button onClick={saveSeason} disabled={savingSeason} className="rounded-2xl px-6 py-4">
                {savingSeason ? "Saving..." : "Save Season"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
