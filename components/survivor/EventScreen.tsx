"use client";

// @ts-nocheck

import { useEffect, useState } from "react";
import Navbar from "../Navbar";

const COLOR_STYLES = {
  red: { bg: "#ef4444", text: "#ffffff" },
  orange: { bg: "#f97316", text: "#111827" },
  yellow: { bg: "#ffff00", text: "#111827" },
  teal: { bg: "#14b8a6", text: "#111827" },
  lime: { bg: "#84cc16", text: "#111827" },
  green: { bg: "#22c55e", text: "#111827" },
  "forest green": { bg: "#166534", text: "#ffffff" },
  cyan: { bg: "#22d3ee", text: "#111827" },
  blue: { bg: "#3b82f6", text: "#ffffff" },
  navy: { bg: "#1e3a8a", text: "#ffffff" },
  indigo: { bg: "#4f46e5", text: "#ffffff" },
  purple: { bg: "#9333ea", text: "#ffffff" },
  magenta: { bg: "#d946ef", text: "#ffffff" },
  pink: { bg: "#ec4899", text: "#ffffff" },
  gold: { bg: "#d4af37", text: "#111827" },
  tan: { bg: "#d2b48c", text: "#111827" },
  brown: { bg: "#8b5e3c", text: "#ffffff" },
  white: { bg: "#f8fafc", text: "#111827", border: "#cbd5e1" },
  gray: { bg: "#6b7280", text: "#ffffff" },
  black: { bg: "#111827", text: "#ffffff" },
};


function getColorStyle(color) { return COLOR_STYLES[color] || { bg: "#334155", text: "#ffffff" }; }
function flattenTribes(tribes) { return tribes.flatMap((tribe) => tribe.members); }
function PlayerCard({ player, badge, borderColor = "#334155", dim = false, compact = false, bgColor = null, textColor = null, glow = false }) {
  const getCount = (val) => typeof val === "number" ? val : (val ? 1 : 0);

  const getAdvCount = (val) => Number(val || 0);
  const icons = [
    ...Array(getCount(player.hasShotInTheDark)).fill("🎲"),
    ...Array(getCount(player.hasIdol)).fill("🗿"),
    ...Array(getCount(player.hasStealVote)).fill("✌️"),
    ...Array(getCount(player.hasSafetyWithoutPower)).fill("🚪"),
    ...Array(getCount(player.hasVoteBlock)).fill("⛔"),
    ...Array(getCount(player.hasExtraVote)).fill("🧾"),
    ...Array(getCount(player.hasKnowledgeIsPower)).fill("🧠"),
    ...Array(getCount(player.hasRockDrawPower)).fill("🪨"),
    ...Array(getCount(player.hasSuperIdol)).fill("🩵"),
  ];

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg border-4 ${dim ? "opacity-60 grayscale" : ""} ${glow ? "ring-4 ring-yellow-400 shadow-yellow-400/60 shadow-2xl" : ""} relative`}
      style={{ borderColor, backgroundColor: bgColor || "#0f172a", color: textColor || "#ffffff" }}
    >
      <img src={player.image} alt={player.name} className="w-full aspect-square object-cover" />
      <div className={compact ? "p-2 text-center" : "p-3 text-center"}>
        <div className={compact ? "font-bold text-[11px] leading-tight" : "font-bold text-sm leading-tight"}>{player.name}</div>
        {badge ? <div className={compact ? "text-[10px] mt-1 opacity-90" : "text-xs mt-1 opacity-90"}>{badge}</div> : null}
      </div>
      {icons.length ? (
        <>
          <div className="absolute bottom-1 left-1 flex gap-1 text-sm pointer-events-none">
            {icons.filter((i) => i === "🎲").map((icon, idx) => <span key={`l_${idx}`}>{icon}</span>)}
          </div>
          <div className="absolute bottom-1 right-1 flex gap-1 text-sm pointer-events-none">
            {icons.filter((i) => i !== "🎲").map((icon, idx) => <span key={`r_${idx}`}>{icon}</span>)}
          </div>
        </>
      ) : null}
      <div className="flex w-full h-2">
        {player.tribeHistory && player.tribeHistory.length > 0 ? player.tribeHistory.map((color, idx) => {
          const style = getColorStyle(color);
          return <div key={idx} style={{ backgroundColor: style.bg, flex: 1 }} />;
        }) : <div style={{ backgroundColor: "rgba(255,255,255,0.12)", flex: 1 }} />}
      </div>
    </div>
  );
}

function TribeSection({ tribe, subtitle, compact = false, ranked = false, dimId = null, dimIds = [] }) {
  const style = getColorStyle(tribe.color);
  const dimSet = new Set([...(dimId ? [dimId] : []), ...dimIds]);
  return (
    <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900/80 shadow-xl">
      <div className="px-5 py-4" style={{ backgroundColor: style.bg, color: style.text, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="text-2xl font-extrabold">{tribe.name}</div>
        <div className="text-sm opacity-90 capitalize">{tribe.color}{subtitle ? ` • ${subtitle}` : ""}</div>
      </div>
      <div className={compact ? "p-3 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" : "p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"}>
        {tribe.members.map((player, idx) => <PlayerCard key={player.id} player={player} borderColor={style.border || style.bg} compact={compact} bgColor={style.bg} textColor={style.text} badge={dimSet.has(player.id) ? "Voted out" : ranked ? `#${idx + 1}` : undefined} dim={dimSet.has(player.id)} />)}
      </div>
    </div>
  );
}

function AdvantageRevealPanel({ vote, advantagesRevealed, setAdvantagesRevealed }) {
  const advantageLines = [
    ...(vote?.rockDrawPowerPlay ? [`${vote.rockDrawPowerPlay.byPlayerName} uses Rock Draw and Tribal Council goes straight to rocks.`] : []),
    ...(vote?.knowledgeIsPowerPlay ? [`${vote.knowledgeIsPowerPlay.byPlayerName} uses Knowledge Is Power on ${vote.knowledgeIsPowerPlay.targetName}${vote.knowledgeIsPowerPlay.success ? ` and steals ${vote.knowledgeIsPowerPlay.guessed}.` : " but fails."}`] : []),
    ...(vote?.safetyWithoutPowerPlay ? [`${vote.safetyWithoutPowerPlay.playerName} uses Safety Without Power and leaves Tribal Council.`] : []),
    ...(vote?.voteBlockPlay ? [`${vote.voteBlockPlay.byPlayerName} uses Vote Block on ${vote.voteBlockPlay.blockedPlayerName}.`] : []),
    ...(vote?.extraVotePlay ? [`${vote.extraVotePlay.byPlayerName} uses Extra Vote.`] : []),
    ...(vote?.superIdolPlay ? [`${vote.superIdolPlay.byPlayerName} plays a Super Idol for ${vote.superIdolPlay.targetName} after the votes are read.`] : []),
    ...((vote?.shotInDarkPlays || []).map((play) => `${play.byPlayerName} plays Shot in the Dark${play.safe ? " and is SAFE." : " and is NOT SAFE."}`)),
    ...(vote?.stealVotePlay ? [`${vote.stealVotePlay.byPlayerName} secretly uses Steal a Vote and takes ${vote.stealVotePlay.stolenFromName}'s vote.`] : []),
    ...((vote?.idolPlays || []).map((play) => `${play.byPlayerName} plays a Hidden Immunity Idol for ${play.targetName}.`)),
  ];
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <div className="text-lg font-bold mb-3">Advantages</div>
      {advantagesRevealed ? (advantageLines.length ? <div className="space-y-2 text-slate-200">{advantageLines.map((line, idx) => <div key={idx}>{line}</div>)}</div> : <div className="text-slate-400 text-sm">No advantages were used.</div>) : <button type="button" onClick={() => setAdvantagesRevealed(true)} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 font-semibold">Reveal advantages used</button>}
    </div>
  );
}

function VoteRevealBoard({ tribe, votes, revealedIds, setRevealedIds, immuneId = null, targetPlayers = null, safetyWithoutPowerPlay = null }) {
  const normalizedVotes = votes.map((vote, index) => ({ ...vote, revealKey: vote.revealKey || `${vote.voterId}_${index}` }));
  const groupedVotes = [];
  const groupMap = new Map();

  normalizedVotes.forEach((vote) => {
    const key = vote.voterId;
    if (!groupMap.has(key)) {
      const group = { voterId: vote.voterId, voterName: vote.voterName, voterVotes: [] };
      groupMap.set(key, group);
      groupedVotes.push(group);
    }
    groupMap.get(key).voterVotes.push(vote);
  });

  const visibleVotes = normalizedVotes.filter((vote) => revealedIds.includes(vote.revealKey));
  const counts = visibleVotes.reduce((acc, vote) => {
    acc[vote.targetName || "No vote"] = (acc[vote.targetName || "No vote"] || 0) + 1;
    return acc;
  }, {});
  const counterEntries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const style = tribe ? getColorStyle(tribe.color) : { bg: "#334155", text: "#ffffff" };
  const sourceMembers = tribe?.members || [];
  const targetSource = targetPlayers || sourceMembers;
  const memberMap = new Map(sourceMembers.map((player) => [player.id, player]));
  const targetMap = new Map(targetSource.map((player) => [player.id, player]));

  const revealSpecific = (revealKey) => {
    if (revealedIds.includes(revealKey)) return;
    setRevealedIds((current) => [...current, revealKey]);
  };

  const revealAll = () => {
    setRevealedIds(normalizedVotes.map((vote) => vote.revealKey));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-lg font-bold">Votes revealed</div>
          {visibleVotes.length < normalizedVotes.length ? (
            <button
              type="button"
              onClick={revealAll}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 hover:bg-slate-700 text-sm font-semibold"
            >
              Reveal all
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {counterEntries.length ? counterEntries.map(([name, count]) => <div key={name} className="px-3 py-2 rounded-xl font-semibold" style={{ backgroundColor: style.bg, color: style.text }}>{name}: {count}</div>) : <div className="text-slate-400 text-sm">No votes revealed yet.</div>}
        </div>
        <div className="text-sm text-slate-400">Revealed {visibleVotes.length} of {normalizedVotes.length} votes</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groupedVotes.map((group, index) => {
          const voter = memberMap.get(group.voterId) || { id: group.voterId, name: group.voterName, image: sourceMembers[0]?.image || "" };
          const voterStyle = getColorStyle(voter?.currentTribeColor || tribe.color);
          const hasStolenVote = group.voterVotes.some((vote) => vote.voterName.includes("stolen vote"));
          return (
            <div key={`${group.voterId}_${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
              <div className="w-24 shrink-0">
                <PlayerCard player={voter} compact borderColor={voterStyle.border || voterStyle.bg} bgColor={voterStyle.bg} textColor={voterStyle.text} badge={hasStolenVote ? "Steal a Vote" : voter.id === immuneId ? "Immune" : "Voter"} glow={voter.id === immuneId} />
              </div>
              <div className="text-2xl font-black text-slate-500">→</div>
              <div className="flex gap-2 flex-wrap">
                {group.voterVotes.map((vote, voteIndex) => {
                  const target = revealedIds.includes(vote.revealKey) ? targetMap.get(vote.targetId) : null;
                  return (
                    <div key={`${vote.revealKey}_${voteIndex}`} className="w-24 shrink-0">
                      {target ? (
                        <div className="relative">
                          <PlayerCard player={target} compact borderColor={style.border || style.bg} bgColor={style.bg} textColor={style.text} badge={vote.doesNotCount ? "Does not count" : "Vote"} />
                          {vote.doesNotCount ? <div className="absolute inset-0 flex items-center justify-center text-red-500 text-6xl font-black pointer-events-none">✕</div> : null}
                        </div>
                      ) : vote.noVote ? (
                        <div className={`w-full aspect-square rounded-2xl border-4 ${vote.targetName === "Vote Blocked" ? "border-red-500 text-red-200" : "border-slate-600"} bg-slate-900 flex items-center justify-center text-center text-xs font-bold px-2`}>{vote.targetName || "No vote"}</div>
                      ) : (
                        <button type="button" onClick={() => revealSpecific(vote.revealKey)} className="w-full aspect-square rounded-2xl border-4 border-dashed border-slate-500 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-5xl font-black">?</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {safetyWithoutPowerPlay ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
            <div className="w-24 shrink-0 relative">
              <PlayerCard player={memberMap.get(safetyWithoutPowerPlay.playerId) || { id: safetyWithoutPowerPlay.playerId, name: safetyWithoutPowerPlay.playerName, image: sourceMembers[0]?.image || "" }} compact borderColor="#475569" badge="Left tribal" dim />
              <div className="absolute inset-0 flex items-center justify-center text-red-500 text-6xl font-black pointer-events-none">✕</div>
            </div>
            <div className="text-2xl font-black text-slate-500">→</div>
            <div className="w-24 shrink-0">
              <div className="w-full aspect-square rounded-2xl border-4 border-slate-600 bg-slate-900 flex items-center justify-center text-center text-xs font-bold px-2">Left tribal</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RockDrawBoard({ participants, revealedIds, setRevealedIds }) {
  const revealSpecific = (playerId) => {
    if (revealedIds.includes(playerId)) return;
    setRevealedIds((current) => [...current, playerId]);
  };
  const visible = participants.filter((participant) => revealedIds.includes(participant.playerId));
  const redCount = visible.filter((participant) => participant.rockColor === "red").length;
  const blackCount = visible.filter((participant) => participant.rockColor === "black").length;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        <div className="text-lg font-bold mb-3">Rock draw</div>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="px-3 py-2 rounded-xl font-semibold bg-red-600 text-white">Red rocks: {redCount}</div>
          <div className="px-3 py-2 rounded-xl font-semibold bg-slate-800 text-white">Black rocks: {blackCount}</div>
        </div>
        <div className="text-sm text-slate-400">Click any player’s rock to reveal it.</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {participants.map((participant) => {
          const isRevealed = revealedIds.includes(participant.playerId);
          return (
            <div key={participant.playerId} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3">
              <div className="w-24 shrink-0"><PlayerCard player={{ id: participant.playerId, name: participant.playerName, image: participant.playerImage }} compact borderColor="#475569" badge="Draw" /></div>
              <div className="text-2xl font-black text-slate-500">→</div>
              <div className="w-24 shrink-0">
                {isRevealed ? <div className="w-full aspect-square rounded-full border-4 flex items-center justify-center font-black uppercase text-xs text-center px-2" style={{ backgroundColor: participant.rockColor === "red" ? "#dc2626" : "#111827", borderColor: participant.rockColor === "red" ? "#fca5a5" : "#6b7280", color: "#ffffff" }}>{participant.rockColor} rock</div> : <button type="button" onClick={() => revealSpecific(participant.playerId)} className="w-full aspect-square rounded-full border-4 border-dashed border-slate-500 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-5xl font-black">?</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BootSummary({ entry }) {
  const eliminatedList = entry?.eliminatedPlayers?.length ? entry.eliminatedPlayers : entry?.eliminated ? [entry.eliminated] : [];
  if (!eliminatedList.length) return null;
  const names = eliminatedList.map((player) => player.name);
  return <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">{names.length === 1 ? `${names[0]} has been voted out.` : `${names.join(" and ")} have been voted out.`}</div>;
}

function FullCastScreen({ tribes, eliminatedId = null, eliminatedIds = [] }) {
  return <div className="space-y-6">{tribes.map((tribe) => <TribeSection key={tribe.id} tribe={tribe} subtitle="tribe status" compact dimId={eliminatedId} dimIds={eliminatedIds} />)}</div>;
}
function FullCastEliminationBoard({ tribes, eliminated, eliminatedPlayers = [] }) {
  const allEliminated = eliminatedPlayers.length ? eliminatedPlayers : eliminated ? [eliminated] : [];
  if (!allEliminated.length) return <FullCastScreen tribes={tribes} />;
  return <div className="space-y-6"><BootSummary entry={{ eliminated, eliminatedPlayers: allEliminated }} />{tribes.map((tribe) => <TribeSection key={tribe.id} tribe={tribe} subtitle="tribe status" compact dimIds={allEliminated.map((player) => player.id)} />)}</div>;
}


function JuryVoteScreen({ entry, revealedIds, setRevealedIds }) {
  const tiebreakPool = entry.finalTie && entry.tiebreakJuror ? [entry.tiebreakJuror] : [];
  return (
    <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5"><div className="text-xl font-bold mb-4">Final 3</div><div className="grid grid-cols-3 gap-3">{entry.finalists.map((player) => <PlayerCard key={player.id} player={player} compact borderColor="#f59e0b" badge="Finalist" />)}</div></div>
        {entry.finalTie ? <div className="rounded-2xl border border-amber-600 bg-amber-950/30 p-4 text-sm text-amber-100">The jury vote tied between {entry.tiebreakFinalists.map((p) => p.name).join(" and ")}. {entry.tiebreakJuror?.name} finished third and now casts the deciding vote.</div> : null}
        <VoteRevealBoard tribe={{ id: "jury", name: "Jury", color: "gray", members: entry.jury }} votes={entry.juryVotes} revealedIds={revealedIds} setRevealedIds={setRevealedIds} targetPlayers={entry.finalists} />
        {entry.finalTie ? <div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5 space-y-4"><div className="text-xl font-bold">Tiebreak vote</div><VoteRevealBoard tribe={{ id: "tiebreak", name: "Tiebreak Juror", color: "gray", members: tiebreakPool }} votes={entry.tiebreakVote ? [entry.tiebreakVote] : []} revealedIds={revealedIds} setRevealedIds={setRevealedIds} targetPlayers={entry.tiebreakFinalists} /></div> : null}
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4"><div className="text-lg font-bold mb-2">Jury of {entry.jury.length}</div><div className="text-sm text-slate-300">Each juror casts exactly one vote.</div></div>
    </div>
  );
}


export default function EventScreen({
  entry,
  season,
  currentIndex,
  onNext,
  onRestart,
  headerLabel = "Survivor simulator",
  restartLabel = "New season",
}) {
  const progress = `${currentIndex + 1} / ${season.length}`;
  const [revealedIds, setRevealedIds] = useState([]);
  const [rockRevealedIds, setRockRevealedIds] = useState([]);
  const [advantagesRevealed, setAdvantagesRevealed] = useState(false);
  useEffect(() => {
    setRevealedIds([]);
    setRockRevealedIds([]);
    setAdvantagesRevealed(false);
  }, [currentIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-950 text-white overflow-x-hidden">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              {headerLabel}
            </div>

            <h1 className="text-4xl md:text-5xl font-black">
              {entry.title}
            </h1>
          </div>

          <div className="flex gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm">
              Step {progress}
            </div>

            <button
              onClick={onRestart}
              className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:bg-slate-800"
            >
              {restartLabel}
            </button>

            {currentIndex < season.length - 1 ? (
              <button
                onClick={onNext}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
              >
                Advance
              </button>
            ) : null}
          </div>
        </div>
        {entry.text ? <div className="mb-6 rounded-2xl border border-emerald-700/40 bg-slate-950/70 p-5 text-lg text-slate-200">{entry.text}</div> : null}
        {entry.textLines?.length ? <div className="mb-6 rounded-2xl border border-emerald-700/40 bg-slate-950/70 p-5 space-y-2 text-lg text-slate-200">{entry.textLines.map((line, idx) => <div key={idx}>{line}</div>)}</div> : null}

        {entry.type === "start" ? <FullCastScreen tribes={entry.tribes} /> : null}
        {entry.type === "swap" ? <FullCastScreen tribes={entry.tribes} /> : null}
        {entry.type === "tribe_events" ? <div className="space-y-6">{entry.eventLines?.length ? <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 space-y-2 text-lg text-slate-200">{entry.eventLines.map((line, idx) => <div key={idx}>{line}</div>)}</div> : null}{entry.tribes ? <FullCastScreen tribes={entry.tribes} /> : null}{entry.mergeTribe ? <TribeSection tribe={entry.mergeTribe} subtitle="camp status" compact /> : null}</div> : null}
        {entry.type === "journey_arrive" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5"><div className="text-xl font-bold mb-4">Journey</div><div className="text-sm text-slate-400 mb-4">{entry.riskJourney ? "Each player decides whether to risk their vote or leave." : "Everyone competes. Nobody risks their vote."}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{entry.participants.map((player) => { const style = getColorStyle(player.currentTribeColor || "gray"); return <div key={player.id} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 flex items-center gap-3"><div className="w-24 shrink-0"><PlayerCard player={player} compact borderColor={style.border || style.bg} bgColor={style.bg} textColor={style.text} badge="Journey" /></div>{entry.riskJourney ? <><div className="text-2xl font-black text-slate-500">→</div><div className="w-24 shrink-0"><button type="button" onClick={() => setRevealedIds((current) => current.includes(player.id) ? current : [...current, player.id])} className="w-full aspect-square rounded-2xl border-4 border-dashed border-slate-500 bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-5xl font-black">{revealedIds.includes(player.id) ? (() => { const choice = entry.decisions.find((d) => d.playerId === player.id)?.choice; return choice === "risk" ? "R" : "L"; })() : "?"}</button></div></> : null}</div>; })}</div></div></div> : null}
        {entry.type === "journey_risk" && entry.riskJourney ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5"><div className="text-xl font-bold mb-4">{entry.riskJourney ? "Risking their vote" : "Competing for the power"}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{entry.riskers.map((player) => { const style = getColorStyle(player.currentTribeColor || "gray"); return <PlayerCard key={player.id} player={player} compact borderColor={style.border || style.bg} bgColor={style.bg} textColor={style.text} badge={entry.riskJourney ? "Risked" : "Competing"} />; })}</div></div></div> : null}
        {entry.type === "journey_result" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5"><div className="text-xl font-bold mb-4">Journey result</div><div className="grid md:grid-cols-[1fr_1fr] gap-6 items-start"><div>{entry.winner ? <div className="max-w-sm mx-auto"><PlayerCard player={entry.winner} borderColor="#a855f7" badge={entry.powerType === "safety_without_power" ? "Won Safety Without Power" : entry.powerType === "steal_a_vote" ? "Won Steal a Vote" : entry.powerType === "vote_block" ? "Won Vote Block" : entry.powerType === "extra_vote" ? "Won Extra Vote" : entry.powerType === "super_idol" ? "Won Super Idol" : entry.powerType === "knowledge_is_power" ? "Won Knowledge Is Power" : entry.powerType === "rock_draw" ? "Won Rock Draw" : "Won power"} /></div> : <div className="text-slate-400">Nobody risked.</div>}</div><div className="grid grid-cols-2 gap-3">{entry.losers.map((player) => { const style = getColorStyle(player.currentTribeColor || "gray"); const lost = entry.losersLoseVoteIds?.includes(player.id); return <PlayerCard key={player.id} player={player} compact borderColor={style.border || style.bg} bgColor={style.bg} textColor={style.text} badge={lost ? "Lost vote" : "Missed out"} />; })}</div></div></div></div> : null}
        {entry.type === "tribe_rankings" ? <div className="space-y-6">{entry.tribes.map((tribe) => <TribeSection key={tribe.id} tribe={tribe} subtitle={tribe.id === entry.losingTribeId ? `#${tribe.rank} • tribal council` : `#${tribe.rank} finish`} compact ranked />)}</div> : null}
        {entry.type === "merge" ? <TribeSection tribe={entry.mergeTribe} subtitle="merged tribe" compact /> : null}
        {entry.type === "individual_rankings" ? <div className="space-y-6"><div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5"><div className="text-xl font-bold mb-4">Challenge standings</div><div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">{entry.rankings.map((player, idx) => <PlayerCard key={player.id} player={player} borderColor={player.id === entry.immune.id ? "#facc15" : "#334155"} compact badge={idx === 0 ? "Immune" : `#${idx + 1}`} />)}</div></div><TribeSection tribe={entry.mergeTribe} subtitle="merged tribe" compact /></div> : null}
        {entry.type === "tribal_reveal" ? <div className="space-y-6"><AdvantageRevealPanel vote={entry.vote} advantagesRevealed={advantagesRevealed} setAdvantagesRevealed={setAdvantagesRevealed} /><VoteRevealBoard tribe={entry.tribe} votes={entry.vote.votes} revealedIds={revealedIds} setRevealedIds={setRevealedIds} safetyWithoutPowerPlay={entry.vote.safetyWithoutPowerPlay} /></div> : null}
        {entry.type === "tribal_revote" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">Revote between {entry.vote.tiedPlayers.map((p) => p.name).join(" and ")}</div><VoteRevealBoard tribe={entry.tribe} votes={entry.vote.revote} revealedIds={revealedIds} setRevealedIds={setRevealedIds} /></div> : null}
        {entry.type === "tribal_rocks" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">Rock draw: {entry.vote.tiedPlayers.map((p) => p.name).join(" and ")} are safe. Everyone else draws.</div><RockDrawBoard participants={entry.vote.rockResult} revealedIds={rockRevealedIds} setRevealedIds={setRockRevealedIds} /></div> : null}
        {entry.type === "merged_vote_reveal" ? <div className="space-y-6"><AdvantageRevealPanel vote={entry.vote} advantagesRevealed={advantagesRevealed} setAdvantagesRevealed={setAdvantagesRevealed} /><VoteRevealBoard tribe={entry.mergeTribe} votes={entry.vote.votes} revealedIds={revealedIds} setRevealedIds={setRevealedIds} immuneId={entry.immune?.id} safetyWithoutPowerPlay={entry.vote.safetyWithoutPowerPlay} /></div> : null}
        {entry.type === "merged_revote" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">Revote between {entry.vote.tiedPlayers.map((p) => p.name).join(" and ")}</div><VoteRevealBoard tribe={entry.mergeTribe} votes={entry.vote.revote} revealedIds={revealedIds} setRevealedIds={setRevealedIds} immuneId={entry.immune?.id} /></div> : null}
        {entry.type === "merged_rocks" ? <div className="space-y-6"><div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-lg font-bold">Rock draw: {entry.vote.tiedPlayers.map((p) => p.name).join(" and ")} are safe. Everyone else draws.</div><RockDrawBoard participants={entry.vote.rockResult} revealedIds={rockRevealedIds} setRevealedIds={setRockRevealedIds} /></div> : null}
        {entry.type === "post_vote_tribes" ? <FullCastEliminationBoard tribes={entry.tribes} eliminated={entry.eliminated} eliminatedPlayers={entry.eliminatedPlayers || []} /> : null}
        {entry.type === "next_week_tribes" ? <FullCastScreen tribes={entry.tribes} /> : null}
        {entry.type === "post_merge_vote" ? <FullCastEliminationBoard tribes={[entry.mergeTribe]} eliminated={entry.eliminated} /> : null}
        {entry.type === "next_week_merge" ? <TribeSection tribe={entry.mergeTribe} subtitle="players remaining" compact /> : null}
        {entry.type === "jury_vote_reveal" ? <JuryVoteScreen entry={entry} revealedIds={revealedIds} setRevealedIds={setRevealedIds} /> : null}
        {entry.type === "winner_screen" ? <div className="space-y-6"><div className="rounded-3xl bg-slate-900/80 border border-emerald-600 p-5"><div className="text-2xl font-black mb-4">Sole Survivor</div><div className="max-w-sm"><PlayerCard player={entry.winner} borderColor="#10b981" badge="Winner" /></div></div><div className="grid lg:grid-cols-[1fr_1fr] gap-6"><div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5"><div className="text-xl font-bold mb-4">Final vote</div><div className="space-y-2 text-sm">{entry.counts.map((count) => <div key={count.finalist.id} className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3 border border-slate-700"><span>{count.finalist.name}</span><span>{count.votes} vote{count.votes === 1 ? "" : "s"}</span></div>)}</div></div><div className="rounded-3xl bg-slate-900/80 border border-slate-700 p-5"><div className="text-xl font-bold mb-4">Season statistics</div><div className="space-y-2 text-sm"><div className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3 border border-slate-700"><span>Starting cast</span><span>{season[0]?.tribes ? flattenTribes(season[0].tribes).length : 0}</span></div><div className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3 border border-slate-700"><span>Jurors</span><span>{entry.jury.length}</span></div><div className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3 border border-slate-700"><span>Finalists</span><span>{entry.finalists.length}</span></div><div className="flex justify-between rounded-xl bg-slate-950/70 px-4 py-3 border border-slate-700"><span>Total steps</span><span>{season.length}</span></div></div></div></div></div> : null}
      </div>
    </div>
  );
}

