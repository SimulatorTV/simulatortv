// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function one(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function fallbackAvatar(name) {
  const initials = String(name || "?").split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#18181b'/><text x='50%' y='50%' font-size='82' fill='white' font-family='Arial' font-weight='700' dominant-baseline='middle' text-anchor='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


function BulletIcons({ count }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        <span
          key={index}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-500 bg-zinc-900 text-2xl shadow-lg"
          title="Bullet remaining"
        >
          🔫
        </span>
      ))}
    </div>
  );
}

function CastTile({ player, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border p-1 shadow-lg transition ${active ? "border-white bg-white/10 scale-[1.02]" : "border-white/10 bg-white/5 opacity-35 grayscale"}`}
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <img src={player.image || fallbackAvatar(player.name)} alt={player.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = fallbackAvatar(player.name))} />
      </div>
      <div className="px-1 pb-1 pt-2 text-center text-[10px] font-black leading-tight sm:text-xs">{player.name}</div>
    </button>
  );
}

function PlayerCard({ player, status = "", numbers = "" }) {
  const cardStyle = status === "challenge"
    ? "border-green-500 bg-green-500 text-black shadow-[0_0_18px_rgba(34,197,94,.75)]"
    : status === "danger" || status === "both"
      ? "border-red-600 bg-red-600 text-white shadow-[0_0_18px_rgba(220,38,38,.75)]"
      : "border-white bg-white text-black";

  const numberStyle = status === "danger" || status === "both"
    ? "text-white"
    : status === "challenge"
      ? "text-black"
      : "text-green-700";

  return (
    <div className={`overflow-hidden rounded-2xl border-4 p-1 transition ${cardStyle}`}>
      <div className="aspect-square overflow-hidden rounded-xl bg-zinc-200">
        <img src={player.image || fallbackAvatar(player.name)} alt={player.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = fallbackAvatar(player.name))} />
      </div>
      <div className="mt-1 flex min-h-[30px] items-center justify-center text-center text-[11px] font-black leading-tight sm:text-xs">{player.name}</div>
      {numbers ? <div className={`text-center text-sm font-black ${numberStyle}`}>#{numbers}</div> : null}
    </div>
  );
}

function Grid({ players, status, nums }) {
  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
      {players.map((p) => <PlayerCard key={p.id} player={p} status={status(p)} numbers={nums(p.id)} />)}
    </div>
  );
}

function AddCastMembersModal({ casts, modalCastId, modalContestants, modalSelectedIds, loadingCasts, loadingContestants, onClose, onChooseCast, onToggleContestant, onSelectAll, onSelectNone, onAddSelected }) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) onChooseCast(firstCastId);
  }, [modalCastId, firstCastId]);

  function CastButton({ cast }) {
    return (
      <button onClick={() => onChooseCast(cast.id)} className={`w-full rounded-2xl px-4 py-3 text-left font-black ${modalCastId === cast.id ? "bg-zinc-200 text-black" : "bg-zinc-900 text-white hover:bg-zinc-800"}`}>
        <div>{cast.name}</div>
        <div className="text-xs font-bold opacity-70">{cast.show_name || (cast.is_official ? "Official Cast" : "Custom Cast")}</div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-sm text-zinc-400">Pick from your custom casts or favorited official casts.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Close</button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-zinc-800 p-4">
            {loadingCasts ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-300">Loading casts...</div> : casts.length === 0 ? <div className="rounded-2xl border border-red-300/40 bg-red-500/15 p-4 text-red-100">No casts available yet.</div> : (
              <>
                {officialCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Favorite Official Casts</div><div className="space-y-2">{officialCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
                {customCasts.length > 0 && <div><div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Custom Casts</div><div className="space-y-2">{customCasts.map((cast) => <CastButton key={cast.id} cast={cast} />)}</div></div>}
              </>
            )}
          </div>

          <div className="overflow-auto p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-sm text-zinc-400">{modalSelectedIds.size} selected</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select None</button>
                <button onClick={onAddSelected} disabled={modalSelectedIds.size === 0} className="rounded-2xl bg-zinc-200 px-4 py-2 font-black text-black hover:bg-white disabled:opacity-40">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">Loading contestants...</div> : modalContestants.length === 0 ? <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">No contestants found for this cast.</div> : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);
                  return (
                    <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative aspect-square overflow-hidden rounded-2xl border ${active ? "border-white ring-2 ring-white/60" : "border-zinc-700 opacity-45 grayscale"}`}>
                      {person.image_url ? <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} /> : <div className="grid h-full w-full place-items-center bg-zinc-800 p-1 text-center text-xs font-black text-zinc-400">No Image</div>}
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

export default function RussianRouletteSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [roster, setRoster] = useState([]);
  const [selectedRosterIds, setSelectedRosterIds] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [clip, setClip] = useState(6);
  const [bullets, setBullets] = useState(1);
  const [tournament, setTournament] = useState(false);
  const [alive, setAlive] = useState([]);
  const [eliminated, setEliminated] = useState([]);
  const [screen, setScreen] = useState("setup");
  const [picks, setPicks] = useState([]);
  const [pickIndex, setPickIndex] = useState(0);
  const [elimGroup, setElimGroup] = useState([]);
  const [shots, setShots] = useState([]);
  const [bulletsLeft, setBulletsLeft] = useState(1);
  const [revenge, setRevenge] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupIndex, setGroupIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [gunRot, setGunRot] = useState(180);
  const [spinning, setSpinning] = useState(false);
  const [selectedShooter, setSelectedShooter] = useState(null);
  const [shotReady, setShotReady] = useState(false);
  const [shotResolved, setShotResolved] = useState(false);
  const [seasonEvents, setSeasonEvents] = useState([]);
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const selectedRoster = useMemo(() => roster.filter((p) => selectedRosterIds.includes(p.id)), [roster, selectedRosterIds]);
  const aliveSet = useMemo(() => new Set(alive.map((p) => p.id)), [alive]);
  const winner = alive[0];

  useEffect(() => { loadSavedCasts(); }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.push("/login"); return; }

    const { data: favoriteData } = await supabase.from("favorite_casts").select("cast_id").eq("user_id", userData.user.id);
    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

    const { data: userCasts, error: userCastsError } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at, is_official")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (userCastsError) { alert(userCastsError.message); setLoadingCasts(false); return; }

    let officialCasts = [];
    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase
        .from("casts")
        .select("id, name, show_name, created_at, is_official")
        .in("id", favoriteOfficialCastIds)
        .eq("is_official", true)
        .order("name", { ascending: true });

      if (officialError) { alert(officialError.message); setLoadingCasts(false); return; }
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

    if (error) { alert(error.message); setLoadingModalContestants(false); return; }
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

    setRoster((current) => {
      const existingIds = new Set(current.map((p) => p.id));
      const next = [...current, ...additions.filter((p) => !existingIds.has(p.id))];
      setSelectedRosterIds(next.map((p) => p.id));
      return next;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function logEvent(type, detail) {
    setSeasonEvents((current) => [...current, { type, round, screen, detail }]);
  }

  function reset() {
    setAlive([]);
    setEliminated([]);
    setScreen("setup");
    setPicks([]);
    setPickIndex(0);
    setElimGroup([]);
    setShots([]);
    setBulletsLeft(bullets);
    setRevenge({});
    setGroups([]);
    setGroupIndex(0);
    setRound(1);
    setGunRot(180);
    setSpinning(false);
    setSelectedShooter(null);
    setShotReady(false);
    setShotResolved(false);
    setSeasonEvents([]);
    setSeasonTitle("");
    setSeasonSummary("");
  }

  function startGame() {
    if (selectedRoster.length < 2) { alert("Add and select at least 2 cast members."); return; }
    const cast = shuffle(selectedRoster);
    setAlive(cast);
    setEliminated([]);
    setScreen("cast");
    setPicks([]);
    setPickIndex(0);
    setElimGroup([]);
    setShots([]);
    setBulletsLeft(bullets);
    setRevenge({});
    setGroups([]);
    setGroupIndex(0);
    setRound(1);
    setGunRot(180);
    setSpinning(false);
    setSelectedShooter(null);
    setShotReady(false);
    setShotResolved(false);
    setSeasonEvents([{ type: "start", round: 1, detail: { cast, clip, bullets, tournament } }]);
  }

  function startNormalRound() {
    if (alive.length <= 1) { setScreen("winner"); return; }
    if (alive.length <= clip) { startRoulette(alive); return; }

    const newPicks = [];
    for (let i = 1; i <= clip; i++) newPicks.push({ rank: i, pickerId: one(alive)?.id });
    setPicks(newPicks);
    setPickIndex(0);
    setElimGroup([]);
    setScreen("challenge");
    logEvent("challenge_picks", { picks: newPicks });
  }

  function startTournamentRound(players) {
    if (players.length <= 1) { setScreen("winner"); return; }
    const shuffled = shuffle(players);
    const newGroups = [];
    for (let i = 0; i < shuffled.length; i += clip) newGroups.push(shuffled.slice(i, i + clip));
    if (newGroups.length > 1 && newGroups[newGroups.length - 1].length === 1) newGroups[newGroups.length - 2].push(...newGroups.pop());
    setGroups(newGroups);
    setGroupIndex(0);
    logEvent("tournament_groups", { groups: newGroups });
    startRoulette(newGroups[0]);
  }

  function startRoulette(group) {
    const clean = group.filter((p) => aliveSet.has(p.id));
    const adjustedBullets = clean.length <= bullets ? Math.max(1, clean.length - 1) : bullets;
    setElimGroup(clean);
    setShots([]);
    setBulletsLeft(Math.min(adjustedBullets, clean.length));
    setScreen("roulette");
    setGunRot(180);
    setSpinning(false);
    setSelectedShooter(null);
    setShotReady(false);
    setShotResolved(false);
    logEvent("roulette_start", { group: clean });
  }

  function finishRoulette(currentAlive = alive) {
    if (currentAlive.length <= 1) { setScreen("winner"); return; }

    if (tournament) {
      const next = groupIndex + 1;
      if (next < groups.length) {
        setGroupIndex(next);
        startRoulette(groups[next].filter((p) => currentAlive.some((a) => a.id === p.id)));
      } else {
        setRound((r) => r + 1);
        startTournamentRound(currentAlive);
      }
    } else {
      setScreen("cast");
      setPicks([]);
      setPickIndex(0);
      setElimGroup([]);
      setShots([]);
      setRound((r) => r + 1);
    }
  }

  function advance() {
    if (screen === "setup") { startGame(); return; }
    if (screen === "cast") { tournament ? startTournamentRound(alive) : startNormalRound(); return; }
    if (screen === "challenge") { setScreen("picks"); return; }

    if (screen === "picks") {
      const order = [...picks].sort((a, b) => b.rank - a.rank);
      const current = order[pickIndex];
      if (!current) { startRoulette(elimGroup); return; }

      const picker = alive.find((p) => p.id === current.pickerId);
      if (!picker) { setPickIndex((i) => i + 1); return; }

      const inElim = new Set(elimGroup.map((p) => p.id));
      const possible = alive.filter((p) => p.id !== picker.id && !inElim.has(p.id));
      const revengeTargets = (revenge[picker.id] || []).map((id) => alive.find((p) => p.id === id)).filter(Boolean).filter((p) => p.id !== picker.id && !inElim.has(p.id));
      const target = revengeTargets.length && Math.random() < 0.8 ? one(revengeTargets) : one(possible.length ? possible : alive.filter((p) => !inElim.has(p.id)));

      if (target) {
        setPicks((prev) => prev.map((p) => p.rank === current.rank ? { ...p, targetId: target.id } : p));
        setElimGroup((prev) => [...prev, target]);
        setRevenge((prev) => ({ ...prev, [target.id]: [...(prev[target.id] || []), picker.id] }));
        logEvent("pick", { rank: current.rank, picker, target });
      }

      setPickIndex((i) => i + 1);
    }
  }

  function spinGun() {
    if (spinning || shotReady) return;
    const pending = elimGroup.filter((p) => !shots.some((s) => s.playerId === p.id));
    if (pending.length === 0 || bulletsLeft <= 0) { finishRoulette(); return; }

    const shooter = one(pending);
    const idx = elimGroup.findIndex((p) => p.id === shooter.id);
    const targetAngle = (idx / elimGroup.length) * 360 + 180;

    setSelectedShooter(shooter);
    setShotResolved(false);
    setSpinning(true);

    setGunRot((previous) => {
      const current = ((previous % 360) + 360) % 360;
      const target = ((targetAngle % 360) + 360) % 360;
      const forwardDelta = (target - current + 360) % 360;
      return previous + 1440 + forwardDelta;
    });

    setTimeout(() => {
      setSpinning(false);
      setShotReady(true);
    }, 1120);
  }

  function shootGun() {
    if (spinning || !shotReady || !selectedShooter) return;
    const pending = elimGroup.filter((p) => !shots.some((s) => s.playerId === p.id));
    const shooter = selectedShooter;
    const dies = Math.random() < bulletsLeft / pending.length;

    if (dies) {
      const newAlive = alive.filter((p) => p.id !== shooter.id);
      setAlive(newAlive);
      setEliminated((prev) => [shooter, ...prev]);
      setShots((prev) => [...prev, { playerId: shooter.id, result: "dead" }]);
      setBulletsLeft((current) => current - 1);
      setShotReady(false);
      setShotResolved(true);
      logEvent("shot", { player: shooter, result: "dead" });
      if (newAlive.length <= 1) setTimeout(() => setScreen("winner"), 650);
      return;
    }

    setShots((prev) => [...prev, { playerId: shooter.id, result: "safe" }]);
    setShotReady(false);
    setShotResolved(true);
    logEvent("shot", { player: shooter, result: "safe" });
  }

  function continueRoulette() {
    if (alive.length <= 1) { setScreen("winner"); return; }
    const lastShot = shots[shots.length - 1];
    const nextGroup = lastShot ? elimGroup.filter((p) => p.id !== lastShot.playerId) : elimGroup;
    const pending = nextGroup.filter((p) => !shots.some((s) => s.playerId === p.id));

    if (pending.length === 0 || bulletsLeft <= 0) { finishRoulette(); return; }

    setElimGroup(nextGroup);
    setSelectedShooter(null);
    setShotReady(false);
    setShotResolved(false);
  }

  function status(p) {
    const hasPick = picks.some((x) => x.pickerId === p.id);
    const inElim = elimGroup.some((x) => x.id === p.id);
    if (hasPick && inElim) return "both";
    if (inElim) return "danger";
    if (hasPick) return "challenge";
    return "";
  }

  function nums(id) {
    return picks.filter((p) => p.pickerId === id).map((p) => p.rank).sort((a, b) => a - b).join(", ");
  }

  function toggleRosterPlayer(id) {
    if (screen !== "setup") return;
    setSelectedRosterIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  function clearRoster() {
    if (screen !== "setup") return;
    if (!confirm("Clear the Russian Roulette roster?")) return;
    setRoster([]);
    setSelectedRosterIds([]);
  }

  async function saveSeason() {
    if (screen !== "winner" || !winner) { alert("Finish the season first."); return; }
    setSavingSeason(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { alert("You must be logged in."); setSavingSeason(false); return; }

    const { data, error } = await supabase.from("saved_seasons").insert({
      user_id: userData.user.id,
      simulator_type: "russian-roulette",
      title: seasonTitle.trim() || "Russian Roulette Season",
      summary: seasonSummary.trim() || `${winner.name} survived Russian Roulette with ${selectedRoster.length} players.`,
      is_public: isPublicSeason,
      allow_comments: true,
      data_json: {
        simulator_type: "russian-roulette",
        startingCast: selectedRoster,
        winner,
        eliminated,
        clip,
        bullets,
        tournament,
        events: seasonEvents,
      },
    }).select().single();

    setSavingSeason(false);
    if (error) { alert(error.message); return; }
    router.push(`/seasons/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-[#161616] text-white">
      <Navbar />
      <section className="mx-auto max-w-7xl p-4 text-center sm:p-6">
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">Russian Roulette</h1>

        {screen === "setup" && (
          <>
            <div className="mx-auto mb-6 max-w-2xl rounded-3xl bg-[#242424] p-6 shadow-2xl">
              <h2 className="mb-4 text-3xl font-black">Setup</h2>
              <div className="space-y-4 text-left">
                <label className="flex items-center justify-between gap-4 text-xl font-black"><span>Clip Size</span><input type="number" min={2} max={20} value={clip} onChange={(e) => { const v = Math.max(2, Number(e.target.value) || 2); setClip(v); if (bullets > v) setBullets(v); }} className="w-24 rounded-xl border-0 bg-white px-3 py-2 text-center text-black" /></label>
                <label className="flex items-center justify-between gap-4 text-xl font-black"><span>Bullets</span><input type="number" min={1} max={clip} value={bullets} onChange={(e) => setBullets(Math.max(1, Math.min(clip, Number(e.target.value) || 1)))} className="w-24 rounded-xl border-0 bg-white px-3 py-2 text-center text-black" /></label>
                <label className="flex items-center justify-between gap-4 text-xl font-black"><span>Tournament Mode</span><input type="checkbox" checked={tournament} onChange={(e) => setTournament(e.target.checked)} className="scale-125" /></label>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button onClick={openAddCastModal} className="rounded-2xl bg-zinc-200 px-5 py-3 font-black text-black hover:bg-white">Add Cast Members</button>
                <button onClick={() => setSelectedRosterIds(roster.map((p) => p.id))} className="rounded-2xl bg-zinc-800 px-5 py-3 font-black text-white hover:bg-zinc-700">Select All</button>
                <button onClick={() => setSelectedRosterIds([])} className="rounded-2xl bg-zinc-800 px-5 py-3 font-black text-white hover:bg-zinc-700">Select None</button>
                <button onClick={clearRoster} className="rounded-2xl bg-red-900 px-5 py-3 font-black text-white hover:bg-red-800">Clear</button>
                <button onClick={startGame} disabled={selectedRoster.length < 2} className="rounded-2xl bg-red-700 px-8 py-3 font-black text-white shadow-[0_5px_0_#7f1d1d] hover:bg-red-600 disabled:opacity-40">Start Game</button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-left">
              <h2 className="text-2xl font-black">Added Cast: {selectedRoster.length} selected / {roster.length} added</h2>
              <Link href="/custom-casts" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold hover:bg-white/10">Manage Casts</Link>
            </div>

            {roster.length === 0 ? <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-8 text-zinc-400">No cast members added yet.</div> : (
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 md:grid-cols-10 xl:grid-cols-12">
                {roster.map((player) => <CastTile key={player.id} player={player} active={selectedRosterIds.includes(player.id)} onClick={() => toggleRosterPlayer(player.id)} />)}
              </div>
            )}
          </>
        )}

        {screen === "cast" && <><h2 className="text-3xl font-black">Remaining Cast: {alive.length}</h2><p className="mx-auto mb-4 max-w-3xl text-zinc-300">Advance to begin the next round.</p><Grid players={alive} status={status} nums={nums} /><button onClick={advance} className="mt-6 rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">Advance</button></>}

        {screen === "challenge" && <><h2 className="text-3xl font-black">Challenge Results</h2><p className="mx-auto mb-4 max-w-3xl text-zinc-300">The clip has {clip} nomination picks. Picks can stack on the same player.</p><Grid players={alive} status={status} nums={nums} /><button onClick={advance} className="mt-6 rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">Start Picks</button></>}

        {screen === "picks" && <><h2 className="text-3xl font-black">Pick Ceremony</h2><p className="mx-auto mb-4 max-w-3xl text-zinc-300">Picks are made from highest number down to lowest.</p><Grid players={alive} status={status} nums={nums} /><div className="mx-auto mt-5 max-w-3xl rounded-2xl bg-[#242424] p-4 text-left leading-8">{[...picks].sort((a,b)=>b.rank-a.rank).map((p,i)=>{ const picker=alive.find(x=>x.id===p.pickerId)||selectedRoster.find(x=>x.id===p.pickerId); const target=alive.find(x=>x.id===p.targetId)||selectedRoster.find(x=>x.id===p.targetId); return <div key={p.rank} className={i===pickIndex ? "font-black text-yellow-300" : i<pickIndex ? "text-zinc-200" : "text-zinc-500"}><b>#{p.rank}</b> {picker?.name} {target ? `sent in ${target.name}` : ""}</div>; })}</div><button onClick={advance} className="mt-6 rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">{pickIndex >= picks.length ? "Go To Roulette" : "Advance Pick"}</button></>}

        {screen === "roulette" && (
          <>
            <h2 className="text-3xl font-black">
              {tournament ? `Tournament Round ${round} - Group ${groupIndex + 1}/${groups.length}` : "Roulette Round"}
            </h2>

            <BulletIcons count={bulletsLeft} />

            <div className="flex min-h-[420px] items-center justify-center md:min-h-[650px]">
              <div className="relative h-[360px] w-[360px] rounded-full border-8 border-zinc-600 bg-[radial-gradient(circle,#343434,#101010_72%)] shadow-[inset_0_0_60px_#000,0_0_25px_#000] md:h-[570px] md:w-[570px]">
                <div className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center md:h-32 md:w-32">
                  <div
                    className="flex h-full w-full items-center justify-center text-5xl leading-none drop-shadow-xl transition-transform duration-[1100ms] ease-out md:text-[82px]"
                    style={{ transform: `rotate(${gunRot}deg)`, transformOrigin: "50% 50%" }}
                  >
                    🔫
                  </div>
                </div>
                {elimGroup.map((p,i)=>{ const shot=shots.find(s=>s.playerId===p.id); const isFlashing=selectedShooter?.id===p.id && shotReady; const finalDeathSettled=shotResolved && bulletsLeft<=0 && shots.some(s=>s.result==="dead") && !shot; const ang=(i/Math.max(1,elimGroup.length))*Math.PI*2; const center=285; const radius=typeof window !== "undefined" && window.innerWidth < 768 ? 135 : 220; const small=typeof window !== "undefined" && window.innerWidth < 768; const x=(small?180:center)+Math.cos(ang)*radius; const y=(small?180:center)+Math.sin(ang)*radius; return <div key={p.id} className={`absolute z-30 w-[63px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 p-1 text-[9px] font-black transition md:w-[92px] md:text-xs ${shot?.result==="safe" || finalDeathSettled ? "border-green-500 bg-green-500 text-black shadow-[0_0_18px_rgba(34,197,94,.85)]" : shot?.result==="dead" ? "border-red-600 bg-red-600 text-white grayscale shadow-[0_0_18px_rgba(220,38,38,.85)]" : isFlashing ? "animate-pulse border-yellow-300 bg-yellow-300 text-black shadow-[0_0_25px_rgba(250,204,21,.9)]" : "border-white bg-white text-black"}`} style={{ left:x, top:y }}><img src={p.image || fallbackAvatar(p.name)} alt={p.name} className="aspect-square w-full rounded-lg object-cover" onError={(e)=>(e.currentTarget.src=fallbackAvatar(p.name))}/><span>{p.name}</span></div>; })}
              </div>
            </div>

            <div className="mt-2">
              {spinning && <button disabled className="rounded-2xl bg-zinc-700 px-8 py-4 text-xl font-black opacity-60">Spinning...</button>}
              {!spinning && !shotReady && !shotResolved && <button onClick={spinGun} className="rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">Spin</button>}
              {!spinning && shotReady && !shotResolved && <button onClick={shootGun} className="rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">Shoot</button>}
              {!spinning && shotResolved && <button onClick={continueRoulette} className="rounded-2xl bg-red-700 px-8 py-4 text-xl font-black shadow-[0_5px_0_#7f1d1d] hover:bg-red-600">Advance</button>}
            </div>

            <div className="mx-auto mt-4 max-w-3xl rounded-2xl bg-[#242424] p-4 text-left leading-8">
              {shots.length === 0 ? <div className="text-zinc-400">No shots yet.</div> : shots.map((s)=>{ const p=selectedRoster.find(x=>x.id===s.playerId)||eliminated.find(x=>x.id===s.playerId); return <div key={`${s.playerId}-${s.result}`} className={s.result==="dead" ? "font-black text-red-400" : "font-black text-green-400"}>{p?.name} is {s.result==="dead" ? "eliminated" : "safe"}</div>; })}
              {selectedShooter && shotReady && <div className="font-black text-yellow-300">{selectedShooter.name} is in the chamber. Press Shoot.</div>}
            </div>
          </>
        )}

        {screen === "winner" && winner && (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-6 text-black shadow-[0_0_35px_rgba(250,204,21,.8)]">
            <h2 className="text-3xl font-black">Winner</h2>
            <img src={winner.image || fallbackAvatar(winner.name)} alt={winner.name} className="mx-auto mt-4 h-[270px] w-[270px] rounded-2xl border-8 border-yellow-300 object-cover" onError={(e)=>(e.currentTarget.src=fallbackAvatar(winner.name))}/>
            <h3 className="mt-4 text-4xl font-black">{winner.name}</h3>
            <div className="mt-6 space-y-3 text-left">
              <input value={seasonTitle} onChange={(e)=>setSeasonTitle(e.target.value)} placeholder="Season title" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-black"/>
              <textarea value={seasonSummary} onChange={(e)=>setSeasonSummary(e.target.value)} placeholder="Season summary" rows={3} className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-black"/>
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={isPublicSeason} onChange={(e)=>setIsPublicSeason(e.target.checked)}/> Post publicly</label>
              <button onClick={saveSeason} disabled={savingSeason} className="w-full rounded-2xl bg-zinc-900 px-5 py-3 font-black text-white hover:bg-zinc-700 disabled:opacity-40">{savingSeason ? "Saving..." : "Save Season"}</button>
              <button onClick={reset} className="w-full rounded-2xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-600">Resimulate</button>
            </div>
          </div>
        )}

        {showAddCastModal && <AddCastMembersModal casts={availableCasts} modalCastId={modalCastId} modalContestants={modalContestants} modalSelectedIds={modalSelectedIds} loadingCasts={loadingCasts} loadingContestants={loadingModalContestants} onClose={()=>setShowAddCastModal(false)} onChooseCast={loadContestantsForModal} onToggleContestant={(id)=>setModalSelectedIds((prev)=>{const next=new Set(prev); next.has(id)?next.delete(id):next.add(id); return next;})} onSelectAll={()=>setModalSelectedIds(new Set(modalContestants.map((p)=>p.id)))} onSelectNone={()=>setModalSelectedIds(new Set())} onAddSelected={addSelectedContestantsToRoster}/>}
      </section>
    </main>
  );
}
