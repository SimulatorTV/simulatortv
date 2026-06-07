// @ts-nocheck

"use client";

import React, { useMemo, useState } from "react";
import Navbar from "../Navbar";

function textForBg(hex){ if(!hex) return "black"; const c=hex.replace("#",""); const r=parseInt(c.slice(0,2),16); const g=parseInt(c.slice(2,4),16); const b=parseInt(c.slice(4,6),16); return (r*299+g*587+b*114)/1000>145?"black":"white"; }
function darken(hex){ if(!hex) return "#222"; const c=hex.replace("#",""); const r=Math.max(0,Math.floor(parseInt(c.slice(0,2),16)*.55)); const g=Math.max(0,Math.floor(parseInt(c.slice(2,4),16)*.55)); const b=Math.max(0,Math.floor(parseInt(c.slice(4,6),16)*.55)); return `rgb(${r},${g},${b})`; }
function fallbackAvatar(name){ const initials=String(name||"?").split(" ").map(p=>p[0]||"").join("").slice(0,2).toUpperCase(); const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' font-size='82' fill='white' font-family='Arial' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`; return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`; }

function Card({children,className=""}){ 
  return <div className={`rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl ${className}`}>{children}</div>; 
}

function PlayerCard({player,teamColor="#f8f8f8",small=false,gray=false,large=false}){
  const bg=teamColor || "#f8f8f8";
  const sizeClass = large ? "w-32 sm:w-40" : small ? "w-20 sm:w-24" : "w-24 sm:w-28";

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-2xl p-1.5 text-center shadow-lg`}
      style={{background:bg,color:textForBg(bg),border:`3px solid ${darken(bg)}`}}
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <img
          src={player?.image||fallbackAvatar(player?.name)}
          alt={player?.name}
          className={`h-full w-full object-cover ${gray?"grayscale opacity-60":""}`}
          onError={(e)=>(e.currentTarget.src=fallbackAvatar(player?.name))}
        />
      </div>
      <div className="mt-1 truncate text-[10px] font-black sm:text-xs">{player?.name}</div>
    </div>
  );
}

function TeamMini({team,compact=false}){
  if(!team) return null;

  return (
    <div
      className={`overflow-hidden rounded-3xl border-4 bg-zinc-950 ${compact ? "max-w-xs" : ""}`}
      style={{borderColor:team.color?.hex||"#555"}}
    >
      <div
        className="px-3 py-2 text-center font-black"
        style={{background:team.color?.hex||"#777",color:textForBg(team.color?.hex)}}
      >
        {team.color?.name||"Team"}
      </div>

      <div className="flex flex-wrap justify-center gap-2 p-3">
        {(team.players||[]).map(p=>
          <PlayerCard key={p.id||p.name} player={p} small teamColor={team.color?.hex}/>
        )}
      </div>
    </div>
  );
}

function CompactVoteTeam({team}) {
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

function getTeamForPlayer(teams, playerId) {
  return (teams || []).find((team) => (team.players || []).some((player) => player.id === playerId));
}

function teamPlacement(rankedTeams, teamId) {
  const index = (rankedTeams || []).findIndex((team) => team.id === teamId);
  return index === -1 ? null : index + 1;
}

function teamPlacementBadge(team, entry) {
  if (!team || !entry?.winningTeam || !entry?.lastPlaceTeam) return null;

  if (team.id === entry.winningTeam.id) {
    return <div className="mt-2 rounded-full bg-green-500 px-3 py-1 text-xs font-black uppercase text-black">Immune</div>;
  }

  if (team.id === entry.lastPlaceTeam.id) {
    return <div className="mt-2 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">Last Place</div>;
  }

  return null;
}

function ReplayScreen({entry}){
  const stage=entry?.stage;

  if(stage==="cast") {
    return (
      <Card className="p-5">
        <h2 className="mb-4 text-3xl font-black">Cast</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {(entry.players||[]).map(p=><PlayerCard key={p.id||p.name} player={p}/>)}
        </div>
      </Card>
    );
  }

  if(stage==="teams") {
    return (
      <Card className="p-5">
        <h2 className="mb-4 text-3xl font-black">Current Teams</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(entry.teams||[]).map(t=><TeamMini key={t.id} team={t}/>)}
        </div>
      </Card>
    );
  }

  if(stage==="challenge") {
    return (
      <Card className="p-5">
        <h2 className="mb-3 text-3xl font-black">Challenge Results</h2>
        <div className="space-y-4">
          {(entry.rankedTeams||[]).map((t,i)=>
            <div
              key={t.id}
              className="rounded-3xl border-4 p-3"
              style={{background:t.color.hex,color:textForBg(t.color.hex),borderColor:darken(t.color.hex)}}
            >
              <div className="flex flex-wrap items-center justify-center gap-4">
                <span className="text-2xl font-black">#{i+1}</span>
                <TeamMini team={t} compact/>
                {i===0&&<b className="rounded-full bg-green-500 px-3 py-1 text-black">Immune</b>}
                {i===entry.rankedTeams.length-1&&entry.rankedTeams.length>3&&<b className="rounded-full bg-red-600 px-3 py-1 text-white">Last Place</b>}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if(stage==="vote") {
    const sortedVoteLog = [...(entry.voteLog || [])].sort((a, b) => {
      const teamA = getTeamForPlayer(entry.teams, a.voter?.id);
      const teamB = getTeamForPlayer(entry.teams, b.voter?.id);
      const placeA = teamPlacement(entry.rankedTeams, teamA?.id) || 999;
      const placeB = teamPlacement(entry.rankedTeams, teamB?.id) || 999;
      return placeA - placeB;
    });

    return (
      <Card className="p-5">
        <h2 className="text-3xl font-black">House Vote</h2>
        <p className="mt-2 text-zinc-400">{entry.voteLog?.[0]?.note}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedVoteLog.map(v => {
            const voterTeam = getTeamForPlayer(entry.teams, v.voter?.id);
            const placement = teamPlacement(entry.rankedTeams, voterTeam?.id);

            return (
              <div
                key={v.index}
                className="rounded-2xl border-4 p-3 text-center"
                style={{
                  background:voterTeam?.color?.hex || "#18181b",
                  color:textForBg(voterTeam?.color?.hex),
                  borderColor:darken(voterTeam?.color?.hex)
                }}
              >
                <div className="font-black">#{placement || ""}</div>
                {teamPlacementBadge(voterTeam, entry)}
                <div className="mt-2 flex justify-center">
                  <PlayerCard player={v.voter} small teamColor={voterTeam?.color?.hex}/>
                </div>

                <div
                  className="mt-3 rounded-xl border-4 p-3"
                  style={{background:v.team.color.hex,color:textForBg(v.team.color.hex),borderColor:darken(v.team.color.hex)}}
                >
                  <b>Voted For</b>
                  <CompactVoteTeam team={v.team} />
                </div>
              </div>
            );
          })}
        </div>

        {entry.votedTeam&&(
          <div className="mt-5">
            <h3 className="mb-3 text-2xl font-black">Team Voted Into Elimination</h3>
            <TeamMini team={entry.votedTeam}/>
          </div>
        )}
      </Card>
    );
  }

  if(stage==="elim") {
    const r=entry.elimResult;
    const step=entry.elimStep;

    const getColor = (player) => {
      const team =
        getTeamForPlayer(entry.teams, player?.id) ||
        getTeamForPlayer([r?.teamOne, r?.teamTwo].filter(Boolean), player?.id) ||
        getTeamForPlayer([r?.newTeam, ...(r?.separatePreviewTeams || [])].filter(Boolean), player?.id);

      return team?.color?.hex || "#f8f8f8";
    };

    const render=(idx,show)=>{
      const pair=(r?.pairings?.[idx]||[]).filter(Boolean);
      const winner=r?.winners?.[idx];
      const loser=r?.eliminated?.[idx];

      return (
        <div className="my-5 flex flex-wrap items-start justify-center gap-4 sm:gap-8">
          {pair.map(p=>
            <div key={p.id||p.name} className="flex w-36 flex-col items-center sm:w-44">
              <div className={show&&p.id===loser?.id ? "opacity-55 grayscale" : ""}>
                <PlayerCard player={p} large teamColor={getColor(p)} gray={show&&p.id===loser?.id}/>
              </div>
              {show&&p.id===winner?.id&&<div className="mt-2 w-full rounded-full bg-green-500 px-3 py-1 text-center font-black text-black">Winner</div>}
              {show&&p.id===loser?.id&&<div className="mt-2 w-full rounded-full bg-red-600 px-3 py-1 text-center font-black text-white">Eliminated</div>}
            </div>
          )}
        </div>
      );
    };

    return (
      <Card className="p-5">
        <h2 className="mb-4 text-3xl font-black">Elimination</h2>
        {step==="matchups"&&<><h3 className="text-2xl font-black">Matchups</h3>{render(0,false)}{render(1,false)}</>}
        {step==="matchup1"&&<><h3 className="text-2xl font-black">Matchup 1</h3>{render(0,false)}</>}
        {step==="result1"&&<><h3 className="text-2xl font-black">Matchup 1 Result</h3>{render(0,true)}</>}
        {step==="matchup2"&&<><h3 className="text-2xl font-black">Matchup 2</h3>{render(1,false)}</>}
        {step==="result2"&&<><h3 className="text-2xl font-black">Matchup 2 Result</h3>{render(1,true)}</>}
        {step==="winnersSeparate"&&(
          <>
            <h3 className="text-2xl font-black">Winners Before Combining</h3>
            <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
              {(r?.separatePreviewTeams||[]).map(t=><TeamMini key={t.id} team={t}/>)}
            </div>
          </>
        )}
        {step==="combined"&&(
          <>
            <h3 className="text-2xl font-black">New Combined Team</h3>
            <div className="mx-auto max-w-md">
              <TeamMini team={r?.newTeam}/>
            </div>
          </>
        )}
      </Card>
    );
  }

  if(stage==="winner") {
    return (
      <Card className="border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-zinc-950 p-6 text-center">
        <h2 className="mb-4 text-4xl font-black text-yellow-300">Winning Team</h2>
        <TeamMini team={entry.winner||entry.teams?.[0]}/>
      </Card>
    );
  }

  return <Card className="p-6">No replay data for this screen.</Card>;
}

export default function RedneckIslandReplayScreen({history=[],winner,onExit}){
  const clean=useMemo(()=>Array.isArray(history)?history.filter(Boolean):[],[history]);
  const [index,setIndex]=useState(0);
  const entry=clean[index]||{stage:"winner",winner};

  return (
    <main className="min-h-screen bg-[#151515] text-white">
      <Navbar/>
      <section className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-black sm:text-5xl">Redneck Island</h1>
              <p className="mt-2 text-zinc-400">Saved replay • {index+1} / {Math.max(clean.length,1)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={onExit} className="rounded-2xl border border-zinc-700 px-5 py-3 font-black hover:bg-white/10">Back to Cast</button>
              <button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index<=0} className="rounded-2xl bg-zinc-800 px-5 py-3 font-black hover:bg-zinc-700 disabled:opacity-40">Previous</button>
              <button onClick={()=>setIndex(i=>Math.min(clean.length-1,i+1))} disabled={index>=clean.length-1} className="rounded-2xl bg-orange-700 px-5 py-3 font-black hover:bg-orange-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        </Card>

        <ReplayScreen entry={entry}/>
      </section>
    </main>
  );
}
