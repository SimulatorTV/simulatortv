// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const MONEY_OPTIONS = [8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomItem(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatMoney(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

function buildInitialPlayers(roster) {
  const shuffled = shuffle(roster);
  const traitorCount = Math.min(4, Math.max(1, Math.floor(shuffled.length / 6)));
  const traitorIndexes = shuffle([...Array(shuffled.length).keys()]).slice(0, traitorCount);

  return shuffled.map((p, i) => ({
    id: p.id || `${i + 1}`,
    name: p.name,
    image: p.image || p.img || "",
    role: traitorIndexes.includes(i) ? "Traitor" : "Faithful",
    alive: true,
  }));
}

function runSelfTests() {
  console.assert(formatMoney(12000) === "$12,000", "formatMoney should format thousands");
  console.assert(randomItem([]) === null, "randomItem should return null for empty arrays");
}

function MysteryCard({ label = "?", subtitle = "Mystery" }) {
  return (
    <div className="bg-zinc-900 border-2 border-dashed border-zinc-600 rounded-2xl overflow-hidden">
      <div className="aspect-square flex flex-col items-center justify-center text-center bg-zinc-950 text-zinc-400 px-2">
        <div className="text-5xl font-black">{label}</div>
        <div className="text-xs font-bold mt-2 tracking-wide">{subtitle}</div>
      </div>
      <div className="min-h-11 flex items-center justify-center text-center text-xs font-bold text-zinc-300 px-2 py-2">
        Unknown
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  eliminated = false,
  revealTraitorBadge = false,
  redGlow = false,
  shielded = false,
  voteCount = null,
  votedFor = null,
}) {
  return (
    <div
      className={`bg-zinc-900 rounded-2xl overflow-hidden border-2 ${
        redGlow ? "border-red-700 shadow-[0_0_22px_rgba(220,38,38,0.65)]" : "border-zinc-700"
      } ${eliminated ? "opacity-50" : "opacity-100"}`}
    >
      <div className="relative">
        {shielded && (
          <div className="absolute top-2 left-2 right-2 z-10 rounded-full bg-blue-600 text-white text-[11px] font-bold py-1 text-center">
            SHIELD
          </div>
        )}
        <img
          src={player.image}
          alt={player.name}
          className={`w-full aspect-square object-cover ${eliminated ? "grayscale" : ""}`}
        />
      </div>
      <div className="min-h-11 flex flex-col items-center justify-center text-center text-xs font-bold text-white px-2 py-2 gap-1">
        <div>{player.name}</div>
        {revealTraitorBadge && (
          <div className="rounded-full bg-red-800 px-3 py-0.5 text-[10px] font-black tracking-widest text-white">
            TRAITOR
          </div>
        )}
        {votedFor && <div className="text-[10px] text-zinc-300 font-semibold">Voted: {votedFor}</div>}
        {voteCount !== null && (
          <div className="text-[10px] text-zinc-400 font-semibold">
            {voteCount} vote{voteCount === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-3 text-center">
      <div className="text-sm text-zinc-400 mb-1">{label}</div>
      <div className="text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
}

export default function TheTraitorsSimulator() {
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

  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);
  const [seasonEvents, setSeasonEvents] = useState([]);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [eliminationOrder, setEliminationOrder] = useState([]);
  const [recruitmentsUsed, setRecruitmentsUsed] = useState(0);

  const [players, setPlayers] = useState([]);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [pot, setPot] = useState(0);
  const [shieldId, setShieldId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [presentation, setPresentation] = useState({ mode: "cast", pending: null });
  const autoRef = useRef(null);

  useEffect(() => {
    runSelfTests();
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

    setRoster((current) => {
      const existingIds = new Set(current.map((player) => player.id));
      const next = [...current, ...additions.filter((person) => !existingIds.has(person.id))];
      setSelectedRosterIds(next.map((p) => p.id));
      return next;
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function clearRoster() {
    const ok = confirm("Clear the current Traitors roster?");
    if (!ok) return;

    stopAuto();
    setRoster([]);
    setSelectedRosterIds([]);
    setPlayers([]);
    setStarted(false);
    setGameOver(false);
    setRound(0);
    setPot(0);
    setShieldId(null);
    setLogs([]);
    setSeasonEvents([]);
    setWinnerInfo(null);
    setEliminationOrder([]);
    setRecruitmentsUsed(0);
    setPresentation({ mode: "cast", pending: null });
  }

  function toggleRosterPlayer(id) {
    if (started) return;

    setSelectedRosterIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return [...current, id];
    });
  }

  const selectedRoster = useMemo(
    () => roster.filter((player) => selectedRosterIds.includes(player.id)),
    [roster, selectedRosterIds]
  );

  async function saveSeason() {
    if (!gameOver || !winnerInfo) {
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
        simulator_type: "the-traitors",
        title: seasonTitle.trim() || "The Traitors Season",
        summary:
          seasonSummary.trim() ||
          `${winnerInfo.title} — Prize pot: ${formatMoney(pot)}.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "the-traitors",
          startingCast: players,
          finalPlayers: players,
          events: seasonEvents,
          logs,
          eliminationOrder,
          winner: winnerInfo,
          prizePot: pot,
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

  const alivePlayers = useMemo(() => players.filter((p) => p.alive), [players]);
  const eliminatedPlayers = useMemo(() => players.filter((p) => !p.alive), [players]);
  const aliveTraitors = useMemo(() => alivePlayers.filter((p) => p.role === "Traitor"), [alivePlayers]);

  const addLog = (text) => {
    setLogs((prev) => [text, ...prev]);
    setSeasonEvents((prev) => [...prev, { round, text }]);
  };

  const stopAuto = () => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  };

  const endGame = (title, detail) => {
    setGameOver(true);
    setWinnerInfo({ title, detail, prizePot: pot });
    stopAuto();
    addLog(`${title} — ${detail}`);
    setPresentation({ mode: "cast", pending: null });
  };

  const resolveFinal2 = (currentPlayers, currentPot) => {
    const alive = currentPlayers.filter((p) => p.alive);
    const traitors = alive.filter((p) => p.role === "Traitor");
    if (traitors.length > 0) {
      endGame("TRAITORS WIN", `Final 2 reached with at least one Traitor still alive. Prize pot: ${formatMoney(currentPot)}.`);
    } else {
      endGame("FAITHFULS WIN", `Final 2 reached with no Traitors left. Prize pot: ${formatMoney(currentPot)}.`);
    }
  };

  const startGame = () => {
    stopAuto();

    if (selectedRoster.length < 6) {
      alert("Add and select at least 6 players to start The Traitors.");
      return;
    }

    const init = buildInitialPlayers(selectedRoster);
    setPlayers(init);
    setStarted(true);
    setGameOver(false);
    setRound(1);
    setPot(0);
    setShieldId(null);
    setLogs([]);
    setSeasonEvents([]);
    setWinnerInfo(null);
    setEliminationOrder([]);
    setRecruitmentsUsed(0);
    setPresentation({ mode: "cast", pending: null });

    const traitorNames = init
      .filter((p) => p.role === "Traitor")
      .map((p) => p.name)
      .join(", ");

    setTimeout(() => {
      addLog("Game Started. 4 Traitors have been secretly selected.");
      addLog(`Secret Traitors: ${traitorNames}`);
    }, 0);
  };

  const prepareStandardRound = () => {
    const snapshotPlayers = players.map((p) => ({ ...p }));
    const alive = snapshotPlayers.filter((p) => p.alive);
    const moneyWon = randomItem(MONEY_OPTIONS) ?? 0;
    const nextPot = pot + moneyWon;
    const shieldWinner = randomItem(alive);
    const nextShieldId = shieldWinner?.id ?? null;
    const livingTraitors = snapshotPlayers.filter((p) => p.alive && p.role === "Traitor");
    const faithfulsBeforeNight = snapshotPlayers.filter((p) => p.alive && p.role === "Faithful");

    let nightAction = "murder";
    let murderTarget = null;
    let murderBlocked = false;
    let recruitedPlayer = null;
    let recruitmentAccepted = false;

    if (faithfulsBeforeNight.length > 0) {
      if (livingTraitors.length === 2 && alive.length >= 11 && recruitmentsUsed < 2 && Math.random() < 0.4) {
        nightAction = "recruit";
        recruitedPlayer = randomItem(faithfulsBeforeNight);
        recruitmentAccepted = Math.random() < 0.65;
      } else if (livingTraitors.length === 1 && Math.random() < 0.7) {
        nightAction = "ultimatum";
        recruitedPlayer = randomItem(faithfulsBeforeNight);
        recruitmentAccepted = true;
      } else {
        nightAction = "murder";
        murderTarget = randomItem(faithfulsBeforeNight);
        murderBlocked = !!(murderTarget && murderTarget.id === nextShieldId);
      }
    }

    const aliveAfterNight = snapshotPlayers
      .map((p) => {
        if (nightAction === "recruit" || nightAction === "ultimatum") {
          if (recruitedPlayer && recruitmentAccepted && p.id === recruitedPlayer.id) {
            return { ...p, role: "Traitor" };
          }
          return { ...p };
        }

        if (nightAction === "murder" && murderTarget && !murderBlocked && p.id === murderTarget.id) {
          return { ...p, alive: false };
        }

        return { ...p };
      })
      .filter((p) => p.alive);

    const voteCounts = {};
    const individualVotes = {};
    aliveAfterNight.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    aliveAfterNight.forEach((voter) => {
      let options = aliveAfterNight.filter((p) => p.id !== voter.id);
      if (voter.role === "Traitor") {
        if (Math.random() < 0.58) {
          const faithfulOptions = options.filter((p) => p.role === "Faithful");
          if (faithfulOptions.length) options = faithfulOptions;
        }
      } else {
        const maybeTraitors = options.filter((p) => p.role === "Traitor");
        if (maybeTraitors.length && Math.random() < 0.1) {
          options = maybeTraitors;
        }
      }
      const target = randomItem(options);
      if (!target) return;
      voteCounts[target.id] += 1;
      individualVotes[voter.id] = target.id;
    });

    let highest = 0;
    let topTargets = [];
    aliveAfterNight.forEach((p) => {
      const votes = voteCounts[p.id];
      if (votes > highest) {
        highest = votes;
        topTargets = [p];
      } else if (votes === highest) {
        topTargets.push(p);
      }
    });

    let finalVoteCounts = { ...voteCounts };
    let finalIndividualVotes = { ...individualVotes };
    let revoteCount = 0;

    while (topTargets.length > 1 && revoteCount < 10) {
      revoteCount += 1;
      const tiedIds = topTargets.map((p) => p.id);
      const tiedPlayers = aliveAfterNight.filter((p) => tiedIds.includes(p.id));
      const revoteCounts = {};
      const revoteIndividualVotes = {};

      tiedPlayers.forEach((p) => {
        revoteCounts[p.id] = 0;
      });

      aliveAfterNight.forEach((voter) => {
        let options = tiedPlayers.filter((p) => p.id !== voter.id);
        if (options.length === 0) {
          options = tiedPlayers;
        }

        if (voter.role === "Traitor") {
          if (Math.random() < 0.58) {
            const faithfulOptions = options.filter((p) => p.role === "Faithful");
            if (faithfulOptions.length) options = faithfulOptions;
          }
        } else {
          const maybeTraitors = options.filter((p) => p.role === "Traitor");
          if (maybeTraitors.length && Math.random() < 0.1) {
            options = maybeTraitors;
          }
        }

        const target = randomItem(options);
        if (!target) return;
        revoteCounts[target.id] += 1;
        revoteIndividualVotes[voter.id] = target.id;
      });

      highest = 0;
      topTargets = [];
      tiedPlayers.forEach((p) => {
        const votes = revoteCounts[p.id] ?? 0;
        if (votes > highest) {
          highest = votes;
          topTargets = [p];
        } else if (votes === highest) {
          topTargets.push(p);
        }
      });

      finalVoteCounts = { ...revoteCounts };
      finalIndividualVotes = { ...revoteIndividualVotes };
    }

    const banished = topTargets[0] || randomItem(aliveAfterNight);

    return {
      type: "standard",
      round,
      snapshotPlayers,
      nextPot,
      moneyWon,
      shieldWinner,
      nextShieldId,
      traitors: snapshotPlayers.filter((p) => p.alive && p.role === "Traitor"),
      nightAction,
      murderTarget,
      murderBlocked,
      recruitedPlayer,
      recruitmentAccepted,
      voteCounts: finalVoteCounts,
      individualVotes: finalIndividualVotes,
      banished,
    };
  };

  const prepareEndgameRound = () => {
    const alive = players.filter((p) => p.alive).map((p) => ({ ...p }));
    const traitorsLeft = alive.filter((p) => p.role === "Traitor").length;
    const allFaithful = traitorsLeft === 0;

    let unanimousEndChance = 0.34;
    if (alive.length === 4) unanimousEndChance = 0.42;
    if (alive.length === 3) unanimousEndChance = 0.52;
    if (allFaithful) unanimousEndChance += 0.18;
    if (traitorsLeft >= 2) unanimousEndChance -= 0.08;
    unanimousEndChance = Math.max(0.08, Math.min(0.88, unanimousEndChance));

    if (Math.random() < unanimousEndChance) {
      return { type: "endgame-end", alive, traitorsLeft };
    }

    const voteCounts = {};
    const individualVotes = {};
    alive.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    alive.forEach((voter) => {
      let options = alive.filter((p) => p.id !== voter.id);
      if (voter.role === "Traitor") {
        if (Math.random() < 0.58) {
          const faithfulOptions = options.filter((p) => p.role === "Faithful");
          if (faithfulOptions.length) options = faithfulOptions;
        }
      } else {
        const maybeTraitors = options.filter((p) => p.role === "Traitor");
        if (maybeTraitors.length && Math.random() < 0.1) {
          options = maybeTraitors;
        }
      }
      const target = randomItem(options);
      if (!target) return;
      voteCounts[target.id] += 1;
      individualVotes[voter.id] = target.id;
    });

    let highest = 0;
    let topTargets = [];
    alive.forEach((p) => {
      const votes = voteCounts[p.id];
      if (votes > highest) {
        highest = votes;
        topTargets = [p];
      } else if (votes === highest) {
        topTargets.push(p);
      }
    });

    let finalVoteCounts = { ...voteCounts };
    let finalIndividualVotes = { ...individualVotes };
    let revoteCount = 0;

    while (topTargets.length > 1 && revoteCount < 10) {
      revoteCount += 1;
      const tiedIds = topTargets.map((p) => p.id);
      const tiedPlayers = alive.filter((p) => tiedIds.includes(p.id));
      const revoteCounts = {};
      const revoteIndividualVotes = {};

      tiedPlayers.forEach((p) => {
        revoteCounts[p.id] = 0;
      });

      alive.forEach((voter) => {
        let options = tiedPlayers.filter((p) => p.id !== voter.id);
        if (options.length === 0) {
          options = tiedPlayers;
        }

        if (voter.role === "Traitor") {
          if (Math.random() < 0.58) {
            const faithfulOptions = options.filter((p) => p.role === "Faithful");
            if (faithfulOptions.length) options = faithfulOptions;
          }
        } else {
          const maybeTraitors = options.filter((p) => p.role === "Traitor");
          if (maybeTraitors.length && Math.random() < 0.1) options = maybeTraitors;
        }

        const target = randomItem(options);
        if (!target) return;
        revoteCounts[target.id] += 1;
        revoteIndividualVotes[voter.id] = target.id;
      });

      highest = 0;
      topTargets = [];
      tiedPlayers.forEach((p) => {
        const votes = revoteCounts[p.id] ?? 0;
        if (votes > highest) {
          highest = votes;
          topTargets = [p];
        } else if (votes === highest) {
          topTargets.push(p);
        }
      });

      finalVoteCounts = { ...revoteCounts };
      finalIndividualVotes = { ...revoteIndividualVotes };
    }

    return {
      type: "endgame-vote",
      alive,
      voteCounts: finalVoteCounts,
      individualVotes: finalIndividualVotes,
      eliminated: topTargets[0] || randomItem(alive),
    };
  };

  const finishStandardRound = (data) => {
    if (!data?.banished) return;

    let nextPlayers = players.map((p) => ({ ...p }));

    if (data.nightAction === "murder") {
      if (!data.murderBlocked && data.murderTarget) {
        nextPlayers = nextPlayers.map((p) =>
          p.id === data.murderTarget.id ? { ...p, alive: false } : p
        );
        addLog(`Murdered: ${data.murderTarget.name} reveals they were a Faithful.`);
        setEliminationOrder((prev) => [...prev, data.murderTarget.id]);
      } else if (data.murderTarget) {
        addLog(`The Traitors attempt to murder ${data.murderTarget.name}, but the Shield blocks it.`);
      }
    }

    if (data.nightAction === "recruit" && data.recruitedPlayer) {
      setRecruitmentsUsed((count) => count + 1);
      if (data.recruitmentAccepted) {
        nextPlayers = nextPlayers.map((p) =>
          p.id === data.recruitedPlayer.id ? { ...p, role: "Traitor" } : p
        );
        addLog(`The Traitors choose to recruit ${data.recruitedPlayer.name}. ${data.recruitedPlayer.name} accepts and becomes a Traitor.`);
      } else {
        addLog(`The Traitors choose to recruit ${data.recruitedPlayer.name}, but ${data.recruitedPlayer.name} refuses. No one is murdered tonight.`);
      }
    }

    if (data.nightAction === "ultimatum" && data.recruitedPlayer) {
      nextPlayers = nextPlayers.map((p) =>
        p.id === data.recruitedPlayer.id ? { ...p, role: "Traitor" } : p
      );
      addLog(`The lone Traitor gives ${data.recruitedPlayer.name} an ultimatum: join the Traitors or be murdered. ${data.recruitedPlayer.name} joins the Traitors.`);
    }

    nextPlayers = nextPlayers.map((p) =>
      p.id === data.banished.id ? { ...p, alive: false } : p
    );

    addLog(`Round ${data.round} Challenge: The group adds ${formatMoney(data.moneyWon)} to the prize pot.`);
    if (data.shieldWinner) {
      addLog(`${data.shieldWinner.name} finds the Shield.`);
    }
    addLog(`Banished: ${data.banished.name} receives the most votes and reveals they were a ${data.banished.role}.`);
    setEliminationOrder((prev) => [...prev, data.banished.id]);

    setPlayers(nextPlayers);
    setPot(data.nextPot);
    setShieldId(null);
    setPresentation({
      mode: "reveal",
      pending: null,
      eliminatedId: data.banished.id,
      revealRole: data.banished.role,
      hiddenRole: false,
    });

    const survivors = nextPlayers.filter((p) => p.alive);
    if (survivors.length <= 2) {
      setTimeout(() => resolveFinal2(nextPlayers, data.nextPot), 0);
      return;
    }

    setRound((r) => r + 1);
  };

  const finishEndgameVote = (data) => {
    if (!data?.eliminated) return;

    const nextPlayers = players.map((p) =>
      p.id === data.eliminated.id ? { ...p, alive: false } : { ...p }
    );
    addLog(`Final ${data.alive.length}: the group does not unanimously agree to end the game.`);
    addLog(`Eliminated: ${data.eliminated.name} is voted out. Their role is not revealed.`);
    setEliminationOrder((prev) => [...prev, data.eliminated.id]);
    setPlayers(nextPlayers);
    setShieldId(null);
    setPresentation({
      mode: "reveal",
      pending: null,
      eliminatedId: data.eliminated.id,
      revealRole: null,
      hiddenRole: true,
    });

    const survivors = nextPlayers.filter((p) => p.alive);
    if (survivors.length <= 2) {
      setTimeout(() => resolveFinal2(nextPlayers, pot), 0);
      return;
    }

    setRound((r) => r + 1);
  };

  const runAdvance = () => {
    if (!started || gameOver) return;

    if (presentation.mode === "traitors") {
      setPresentation((prev) => ({ ...prev, mode: "traitors-mystery" }));
      return;
    }

    if (presentation.mode === "traitors-mystery") {
      setPresentation((prev) => ({ ...prev, mode: "murder" }));
      return;
    }

    if (presentation.mode === "murder") {
      setPresentation((prev) => ({ ...prev, mode: "votes" }));
      return;
    }

    if (presentation.mode === "votes") {
      const pending = presentation.pending;
      if (!pending) return;
      if (pending.type === "standard") finishStandardRound(pending);
      if (pending.type === "endgame-vote") finishEndgameVote(pending);
      return;
    }

    if (presentation.mode === "reveal") {
      setPresentation({ mode: "cast", pending: null });
      return;
    }

    const alive = players.filter((p) => p.alive);
    if (alive.length <= 2) {
      resolveFinal2(players, pot);
      return;
    }

    if (alive.length > 5) {
      const pending = prepareStandardRound();
      setShieldId(pending.nextShieldId);
      setPot(pending.nextPot);
      setPresentation({ mode: "traitors", pending });
      return;
    }

    const pending = prepareEndgameRound();
    if (pending.type === "endgame-end") {
      addLog(`Final ${pending.alive.length}: the group unanimously agrees to end the game.`);
      if (pending.traitorsLeft > 0) {
        endGame("TRAITORS WIN", `At least one Traitor remained when the game ended. Prize pot: ${formatMoney(pot)}.`);
      } else {
        endGame("FAITHFULS WIN", `All remaining players were Faithful. Prize pot: ${formatMoney(pot)}.`);
      }
      return;
    }

    setPresentation({ mode: "votes", pending });
  };

  const autoPlay = () => {
    if (!started || gameOver) return;
    stopAuto();
    autoRef.current = setInterval(() => {
      runAdvance();
    }, 650);
  };

  const renderMainPanel = () => {
    if (!started) {
      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4">
            Add cast members, select who is playing, then start the season. The simulator secretly assigns Traitors.
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={openAddCastModal} className="px-4 py-2 rounded-xl bg-blue-700 border border-blue-500 hover:bg-blue-600">
              Add Cast Members
            </button>
            <button onClick={() => setSelectedRosterIds(roster.map((p) => p.id))} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700">
              Select All
            </button>
            <button onClick={() => setSelectedRosterIds([])} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700">
              Select None
            </button>
            <button onClick={clearRoster} className="px-4 py-2 rounded-xl bg-red-900 border border-red-700 hover:bg-red-800">
              Clear Roster
            </button>
            <Link href="/custom-casts" className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700">
              Manage Casts
            </Link>
          </div>

          {roster.length === 0 ? (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6 text-zinc-400">
              No cast members added yet.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
              {roster.map((p) => {
                const selected = selectedRosterIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleRosterPlayer(p.id)}
                    className={selected ? "opacity-100" : "opacity-35 grayscale"}
                  >
                    <PlayerCard player={p} />
                  </button>
                );
              })}
            </div>
          )}
        </>
      );
    }

    const alive = players.filter((p) => p.alive);
    const pending = presentation.pending;

    if (presentation.mode === "traitors") {
      const traitors = pending?.traitors || [];
      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4">
            The Traitors meet in secret.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {traitors.map((p) => (
              <PlayerCard key={p.id} player={p} redGlow revealTraitorBadge />
            ))}
            <MysteryCard label="?" subtitle={pending?.nightAction === "murder" ? "Murder Target" : "Night Target"} />
          </div>
        </>
      );
    }

    if (presentation.mode === "traitors-mystery") {
      const traitors = pending?.traitors || [];
      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4">
            The Traitors consider their move.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {traitors.map((p) => (
              <PlayerCard key={p.id} player={p} redGlow revealTraitorBadge />
            ))}
            <MysteryCard label="?" subtitle={pending?.nightAction === "murder" ? "Murder Target" : pending?.nightAction === "ultimatum" ? "Ultimatum Target" : "Recruit Target"} />
          </div>
        </>
      );
    }

    if (presentation.mode === "murder") {
      const traitors = pending?.traitors || [];
      const victim = pending?.murderTarget;
      const recruit = pending?.recruitedPlayer;
      const extraPlayer = pending?.nightAction === "murder" ? victim : recruit;
      const subtitle = pending?.nightAction === "murder"
        ? pending?.murderBlocked
          ? "The Shield blocks the murder."
          : "The Traitors choose their victim."
        : pending?.nightAction === "ultimatum"
          ? "The lone Traitor delivers an ultimatum."
          : pending?.recruitmentAccepted
            ? "The Traitors choose to recruit a new member."
            : "The Traitors attempt a recruitment, but it may fail.";

      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4 text-center">
            {subtitle}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {traitors.map((p) => (
              <PlayerCard key={p.id} player={p} redGlow revealTraitorBadge />
            ))}
            {extraPlayer ? (
              <PlayerCard
                key={`night-${extraPlayer.id}`}
                player={extraPlayer}
                shielded={pending?.nightAction === "murder" && pending?.murderBlocked}
                redGlow={pending?.nightAction !== "murder" && (pending?.recruitmentAccepted || pending?.nightAction === "ultimatum")}
                revealTraitorBadge={pending?.nightAction !== "murder" && (pending?.recruitmentAccepted || pending?.nightAction === "ultimatum")}
              />
            ) : (
              <MysteryCard label="?" subtitle="Night Result" />
            )}
          </div>
        </>
      );
    }

    if (presentation.mode === "votes") {
      const votePool = pending?.type === "standard"
        ? pending.snapshotPlayers.filter((p) => p.alive && (!pending.murderTarget || pending.murderBlocked || p.id !== pending.murderTarget.id))
        : pending?.alive || [];

      const sortedVotePool = [...votePool].sort((a, b) => {
        const voteDiff = (pending?.voteCounts?.[b.id] ?? 0) - (pending?.voteCounts?.[a.id] ?? 0);
        if (voteDiff !== 0) return voteDiff;
        return String(a.name).localeCompare(String(b.name));
      });

      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4 text-center">
            Everyone votes at the round table.
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
            {sortedVotePool.map((p) => {
              const votedForId = pending?.individualVotes?.[p.id];
              const votedFor =
                votePool.find((x) => x.id === votedForId)?.name ||
                players.find((x) => x.id === votedForId)?.name ||
                null;
              return (
                <PlayerCard
                  key={p.id}
                  player={p}
                  redGlow={p.role === "Traitor"}
                  revealTraitorBadge={p.role === "Traitor"}
                  voteCount={pending?.voteCounts?.[p.id] ?? 0}
                  votedFor={votedFor}
                />
              );
            })}
          </div>
        </>
      );
    }

    if (presentation.mode === "reveal") {
      const eliminated = players.find((p) => p.id === presentation.eliminatedId);
      return (
        <>
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4 text-center">
            Eliminated player reveal.
          </div>
          <div className="max-w-xs mx-auto">
            {eliminated && (
              <div>
                <PlayerCard
                  player={eliminated}
                  redGlow={eliminated.role === "Traitor"}
                  revealTraitorBadge={eliminated.role === "Traitor"}
                />
                <div className="mt-3 rounded-2xl border border-zinc-700 bg-zinc-800 p-3 text-center font-bold text-white">
                  {presentation.hiddenRole ? "Role not revealed" : `${eliminated.name} was a ${presentation.revealRole}`}
                </div>
              </div>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 text-sm text-zinc-200 mb-4">
          {!gameOver && alive.length > 5 &&
            "Advance through: Traitors reveal → Traitors + mystery target → Night result → Voting results → Elimination reveal → Back to cast."}
          {!gameOver && alive.length <= 5 && alive.length > 2 &&
            "Endgame active: no more murders. Remaining players can end the game unanimously or vote somebody out with no role reveal."}
          {gameOver && "This game has ended. Start a new game for another run."}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {alive.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              shielded={shieldId === p.id}
              redGlow={p.role === "Traitor"}
              revealTraitorBadge={p.role === "Traitor"}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold">The Traitors</h1>
          <p className="text-zinc-400 mt-2">4 Traitors. Daily challenge. Shield. Murder. 2-traitor recruit only with 11+ players left. 1-traitor ultimatum after that. Round table. Final 5 endgame.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button onClick={startGame} disabled={selectedRoster.length < 6} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-40">
            Start New Game
          </button>
          <button
            onClick={runAdvance}
            disabled={!started || gameOver}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-40"
          >
            Advance
          </button>
          <button
            onClick={autoPlay}
            disabled={!started || gameOver}
            className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 disabled:opacity-40"
          >
            Auto Play
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatBox label="Players Left" value={alivePlayers.length} />
          <StatBox label="Traitors Left" value={aliveTraitors.length} />
          <StatBox label="Prize Pot" value={formatMoney(pot)} />
          <StatBox label="Round" value={round} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <h2 className="text-2xl font-bold mb-3">Main Screen</h2>
            {renderMainPanel()}

            <h2 className="text-2xl font-bold mt-6 mb-3">Eliminated</h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3 [direction:rtl] items-end">
              {eliminationOrder
                .map((id) => players.find((p) => p.id === id))
                .filter(Boolean)
                .map((p) => (
                  <div key={p.id} className="[direction:ltr]">
                    <PlayerCard
                      player={p}
                      eliminated
                      redGlow={p.role === "Traitor"}
                      revealTraitorBadge={p.role === "Traitor"}
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <h2 className="text-2xl font-bold mb-3">Game Log</h2>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 h-[500px] xl:h-[860px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-zinc-500">No events yet.</div>
              ) : (
                logs.map((entry, i) => (
                  <div key={i} className="border-b border-zinc-800 pb-2 mb-2 text-sm leading-6">
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <h2 className="text-2xl font-bold mb-3">Save Season</h2>

            <div className="grid gap-3 max-w-xl">
              <input
                value={seasonTitle}
                onChange={(e) => setSeasonTitle(e.target.value)}
                placeholder="Season title"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />

              <textarea
                value={seasonSummary}
                onChange={(e) => setSeasonSummary(e.target.value)}
                placeholder="Season summary"
                rows={3}
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />

              <label className="flex items-center gap-2 font-bold">
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
                className="rounded-2xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-600 disabled:opacity-40"
              >
                {savingSeason ? "Saving..." : "Save Season"}
              </button>
            </div>
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
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-zinc-400 text-sm">Pick an official or custom cast, select people, then add them to The Traitors roster.</p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 font-black text-white">
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] min-h-0 flex-1 overflow-hidden">
          <div className="border-r border-zinc-800 p-4 overflow-auto space-y-4">
            {loadingCasts ? (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-4 text-zinc-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {Object.keys(groupedOfficial).length > 0 && (
                  <div>
                    <div className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Favorite Official Casts</div>
                    <div className="space-y-2">
                      {Object.entries(groupedOfficial).map(([groupName, groupCasts]) => (
                        <div key={groupName}>
                          <div className="text-zinc-500 text-xs font-bold mb-1">{groupName}</div>
                          {groupCasts.map((cast) => (
                            <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black mb-2 ${modalCastId === cast.id ? "bg-red-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-white"}`}>
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
                    <div className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Custom Casts</div>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <button key={cast.id} onClick={() => onChooseCast(cast.id)} className={`w-full text-left rounded-2xl px-4 py-3 font-black ${modalCastId === cast.id ? "bg-red-700 text-white" : "bg-zinc-900 hover:bg-zinc-800 text-white"}`}>
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
                <p className="text-zinc-400 text-sm">{selectedCount} selected</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 font-black text-white">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-zinc-800 hover:bg-zinc-700 px-4 py-2 font-black text-white">Select None</button>
                <button onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl bg-red-700 hover:bg-red-600 disabled:opacity-40 px-4 py-2 font-black text-white">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-6 text-zinc-300">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-6 text-zinc-300">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);

                  return (
                    <button key={person.id} type="button" onClick={() => onToggleContestant(person.id)} className={`relative rounded-2xl overflow-hidden border aspect-square ${active ? "border-white ring-2 ring-white/60" : "border-zinc-700 opacity-45 grayscale"}`}>
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-zinc-400 text-xs font-black text-center p-1 bg-zinc-800">No Image</div>
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
