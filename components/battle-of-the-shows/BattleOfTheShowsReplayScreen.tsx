// @ts-nocheck

"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../Navbar";

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

function colorClass(color) {
  return COLOR_STYLES[color] || COLOR_STYLES.gray;
}

function fallbackAvatar(name) {
  const initials = String(name || "?").split(" ").map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' font-size='82' fill='white' font-family='Arial' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function aliveTeams(teams = []) {
  return teams.filter((team) => (team.players || []).length > 0);
}

function Card({ className = "", children }) {
  return <div className={`rounded-2xl ${className}`}>{children}</div>;
}

function CardContent({ className = "", children }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }) {
  return <div className={`text-2xl font-bold ${className}`}>{children}</div>;
}

function Badge({ className = "", children }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${className}`}>{children}</span>;
}

function ButtonLike({ className = "", variant, disabled, onClick, children }) {
  const base = variant === "outline" ? "border border-zinc-700 bg-transparent text-white hover:bg-white/10" : "bg-white text-black hover:bg-zinc-200";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl px-5 py-3 font-bold ${className}`}>
      {children}
    </button>
  );
}

function PlayerTile({ player, votes = 0, badge, gray = false, selected = false }) {
  if (!player) return null;
  return (
    <div className={`rounded-2xl border bg-black/20 p-1.5 shadow-lg sm:p-3 ${selected ? "scale-105 border-red-500 ring-2 ring-red-400" : "border-white/15"}`}>
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <img src={player.image || player.img || fallbackAvatar(player.name)} alt={player.name} className={`h-full w-full object-cover ${gray ? "grayscale" : ""}`} onError={(event) => { event.currentTarget.src = fallbackAvatar(player.name); }} />
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
  if (!team) return null;
  return (
    <Card className={`overflow-hidden border-2 ${colorClass(team.color)} shadow-2xl`}>
      <div className="p-4 sm:p-6 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-xl sm:text-2xl">{team.name}</CardTitle>
          <Badge className="border border-black/10 bg-black/20 text-inherit">{(team.players || []).length} left</Badge>
        </div>
        {subtitle ? <div className="text-sm opacity-90">{subtitle}</div> : null}
      </div>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TeamGrid({ team, subtitle, voteData }) {
  if (!team) return null;
  const nominees = new Set((voteData?.nominees || []).map((player) => player.id));
  return (
    <TeamPanel team={team} subtitle={subtitle}>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {(team.players || []).map((player) => (
          <PlayerTile key={player.id} player={player} votes={voteData?.tally?.[player.id] || 0} badge={nominees.has(player.id) ? "Selected" : undefined} selected={nominees.has(player.id)} />
        ))}
      </div>
    </TeamPanel>
  );
}

function DuelCard({ pair, result, teams }) {
  if (!pair) return null;
  const leftTeam = teams.find((team) => team.id === pair.a?.teamId);
  const rightTeam = teams.find((team) => team.id === pair.b?.teamId);
  const leftLost = result?.loser?.id === pair.a?.id;
  const rightLost = result?.loser?.id === pair.b?.id;

  return (
    <Card className="overflow-hidden border border-zinc-800 bg-zinc-950/90 text-white shadow-xl">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
          <div className={`rounded-2xl border-2 p-2 sm:p-3 ${colorClass(leftTeam?.color)}`}>
            <PlayerTile player={pair.a} badge={result ? (leftLost ? "Eliminated" : "Winner") : `${pair.slot}`} gray={leftLost} />
          </div>
          <div className="text-center text-sm font-black text-zinc-400 md:text-2xl">VS</div>
          <div className={`rounded-2xl border-2 p-2 sm:p-3 ${colorClass(rightTeam?.color)}`}>
            <PlayerTile player={pair.b} badge={result ? (rightLost ? "Eliminated" : "Winner") : `${pair.slot}`} gray={rightLost} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTeamsForEntry(entry, history, index) {
  if (entry?.teams?.length) return entry.teams;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (history[i]?.teams?.length) return history[i].teams;
  }
  return [];
}

function ReplayBody({ entry, history, index }) {
  const stage = entry?.stage || "overview";
  const teams = getTeamsForEntry(entry, history, index);
  const activeTeams = aliveTeams(teams);
  const winnerTeam = teams.find((team) => team.id === entry?.ranking?.winnerTeamId);
  const loserTeam = teams.find((team) => team.id === entry?.ranking?.losingTeamId);
  const challengerTeam = teams.find((team) => team.id === entry?.challengerTeamId);
  const votingTeamA = teams.find((team) => team.id === entry?.voting?.teamAId);
  const votingTeamB = teams.find((team) => team.id === entry?.voting?.teamBId);
  const currentPair = entry?.matchups?.pairs?.[entry?.currentMatchIndex || 0];
  const currentResult = entry?.results?.results?.[entry?.currentMatchIndex || 0];

  if (!entry) return <Card className="border border-zinc-800 bg-zinc-950/90 text-white"><CardContent>No replay data found.</CardContent></Card>;

  if (stage === "overview") return <div className="grid gap-4">{activeTeams.map((team) => <TeamGrid key={team.id} team={team} />)}</div>;

  if (stage === "ranking") return <div className="grid gap-4">{(entry.ranking?.ranking || []).map((team, idx) => <div key={team.id} className="space-y-2"><Badge className="bg-white/10 text-white">#{idx + 1}</Badge><TeamGrid team={team} subtitle={team.id === entry.ranking?.winnerTeamId ? "Challenge Winner" : team.id === entry.ranking?.losingTeamId ? "Last Place" : `Rank ${idx + 1}`} /></div>)}</div>;

  if (stage === "choose") return <div className="space-y-4"><TeamGrid team={winnerTeam} subtitle="Winner" /><Card className="border-dashed border-2 border-zinc-600 bg-zinc-900 text-white"><CardContent className="p-6 text-center text-3xl font-black">?</CardContent></Card><TeamGrid team={loserTeam} subtitle="Last Place" /><Card className="border border-zinc-800 bg-zinc-950/90 text-white"><CardContent className="p-4"><div className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-400">Available to be called out</div><div className="flex flex-wrap gap-2">{(entry.ranking?.ranking || []).filter((team) => team.id !== entry.ranking?.winnerTeamId && team.id !== entry.ranking?.losingTeamId).map((team) => <span key={team.id} className={`rounded-full border px-3 py-1 text-xs font-bold ${colorClass(team.color)}`}>{team.name}</span>)}</div></CardContent></Card></div>;

  if (stage === "selection") return <div className="space-y-4"><TeamGrid team={winnerTeam} subtitle="Winner" /><TeamGrid team={challengerTeam} subtitle="Called Out" /><TeamGrid team={loserTeam} subtitle="Last Place" /></div>;

  if (stage === "voting") return <div className="grid gap-4"><TeamGrid team={votingTeamA} subtitle="Voting Team" /><TeamGrid team={votingTeamB} subtitle={entry.voting?.singleEliminationRound ? "One Match Round" : "Voting Team"} /></div>;

  if (stage === "voting_results") return <div className="grid gap-4"><TeamGrid team={votingTeamA} voteData={entry.voting?.teamAVote} subtitle="Selected for elimination" /><TeamGrid team={votingTeamB} voteData={entry.voting?.teamBVote} subtitle="Selected for elimination" /></div>;

  if (stage === "lineup") return <div className="grid gap-3 md:gap-4 md:grid-cols-2">{[votingTeamA, votingTeamB].map((team, idx) => { const vote = idx === 0 ? entry.voting?.teamAVote : entry.voting?.teamBVote; return team ? <Card key={team.id} className={`border-2 ${colorClass(team.color)}`}><CardContent className="p-4"><div className="mb-3 text-center text-lg font-black sm:text-2xl">{team.name}</div><div className="grid grid-cols-2 gap-2 sm:gap-4">{(vote?.nominees || []).map((player) => <PlayerTile key={player.id} player={player} />)}</div></CardContent></Card> : null; })}</div>;

  if (stage === "assignment") return <div className="grid gap-3 md:gap-4 md:grid-cols-2">{[votingTeamA, votingTeamB].map((team, idx) => team ? <Card key={team.id} className={`border-2 ${colorClass(team.color)}`}><CardContent className="p-4"><div className="mb-3 text-center text-lg font-black sm:text-2xl">{team.name}</div><div className="grid grid-cols-2 gap-2 sm:gap-4">{(entry.matchups?.pairs || []).map((pair) => <PlayerTile key={idx === 0 ? pair.a.id : pair.b.id} player={idx === 0 ? pair.a : pair.b} badge={`${pair.slot}`} />)}</div></CardContent></Card> : null)}</div>;

  if (stage === "matchups") return <div className="grid gap-4">{(entry.matchups?.pairs || []).map((pair) => <div key={pair.slot}><div className="mb-2 px-1 text-base font-black sm:text-lg">Match {pair.slot}</div><DuelCard pair={pair} teams={teams} /></div>)}</div>;

  if (stage === "duel") return <><Card className="border border-zinc-800 bg-zinc-950/90 text-white"><CardContent className="p-4"><div className="text-lg font-bold">Matchup {currentPair?.slot}</div></CardContent></Card><DuelCard pair={currentPair} teams={teams} /></>;

  if (stage === "duel_result") return <><Card className="border border-zinc-800 bg-zinc-950/90 text-white"><CardContent className="p-4"><div className="text-lg font-bold">Result {currentResult?.slot}</div></CardContent></Card><DuelCard pair={currentPair} result={currentResult} teams={teams} /></>;

  if (stage === "champion") { const champion = entry.champion || activeTeams[0]; return <><Card className="overflow-hidden border border-yellow-500 bg-gradient-to-br from-yellow-500/20 via-zinc-950 to-zinc-950 text-white shadow-2xl"><CardContent className="p-6 text-center sm:p-10"><div className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300">Winner</div><div className="mt-3 text-4xl font-black sm:text-6xl">{champion?.name}</div><div className="mt-2 text-lg text-zinc-300 sm:text-2xl">Battle of the Shows Champion</div></CardContent></Card><TeamGrid team={champion} subtitle="Final surviving team" /></>; }

  return <Card className="border border-zinc-800 bg-zinc-950/90 text-white"><CardContent>Unknown replay screen: {stage}</CardContent></Card>;
}

export default function BattleOfTheShowsReplayScreen({ history = [], winner, onExit }) {
  const [index, setIndex] = useState(0);
  const cleanHistory = useMemo(() => {
    const entries = Array.isArray(history) ? history.filter(Boolean) : [];
    if (entries.length === 0 && winner) return [{ stage: "champion", champion: winner, teams: winner ? [winner] : [] }];
    return entries;
  }, [history, winner]);
  const entry = cleanHistory[index] || cleanHistory[0] || null;
  const progress = cleanHistory.length ? `${index + 1} / ${cleanHistory.length}` : "0 / 0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
        <Card className="border border-zinc-800 bg-zinc-950/90 text-white shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight sm:text-5xl">Battle of the Shows</div>
                <div className="mt-2 text-sm text-zinc-300 sm:text-base">Saved replay • Round {entry?.round || 1} • {STAGE_LABELS[entry?.stage] || entry?.stage || "Replay"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLike onClick={onExit} variant="outline">Back to Cast</ButtonLike>
                <ButtonLike onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index <= 0} variant="outline">Previous</ButtonLike>
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-black">{progress}</div>
                <ButtonLike onClick={() => setIndex((current) => Math.min(cleanHistory.length - 1, current + 1))} disabled={index >= cleanHistory.length - 1}>Next</ButtonLike>
              </div>
            </div>
          </CardContent>
        </Card>
        <ReplayBody entry={entry} history={cleanHistory} index={index} />
      </div>
    </div>
  );
}
