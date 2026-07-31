// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const TEAM_COLORS = [
  { name: "Red", bg: "#dc2626", text: "#ffffff" },
  { name: "Orange", bg: "#ea580c", text: "#ffffff" },
  { name: "Yellow", bg: "#facc15", text: "#111827" },
  { name: "Green", bg: "#16a34a", text: "#ffffff" },
  { name: "Blue", bg: "#2563eb", text: "#ffffff" },
  { name: "Purple", bg: "#7c3aed", text: "#ffffff" },
  { name: "Pink", bg: "#db2777", text: "#ffffff" },
  { name: "Brown", bg: "#78350f", text: "#ffffff" },
  { name: "Gray", bg: "#4b5563", text: "#ffffff" },
  { name: "Black", bg: "#111111", text: "#ffffff" },
  { name: "White", bg: "#f8fafc", text: "#111827", border: "#cbd5e1" },
  { name: "Teal", bg: "#0f766e", text: "#ffffff" },
  { name: "Lime", bg: "#65a30d", text: "#ffffff" },
  { name: "Cyan", bg: "#0891b2", text: "#ffffff" },
  { name: "Navy", bg: "#1e3a8a", text: "#ffffff" },
  { name: "Maroon", bg: "#7f1d1d", text: "#ffffff" },
  { name: "Gold", bg: "#b45309", text: "#ffffff" },
  { name: "Indigo", bg: "#4b0082", text: "#ffffff" },
  {
    name: "Rainbow",
    bg: "linear-gradient(120deg,#dc2626,#ea580c,#facc15,#16a34a,#2563eb,#7c3aed,#db2777)",
    text: "#ffffff",
  },
];

const STARTING_CAST = [
  ["Mario", "https://i.imgur.com/H5TWw1j.jpg"],
  ["Luigi", "https://i.imgur.com/zQTbL4j.jpg"],
  ["Peach", "https://i.imgur.com/ehq5bvl.jpg"],
  ["Daisy", "https://i.imgur.com/ZWqQrw1.jpg"],
  ["Toad", "https://i.imgur.com/g3YISRn.jpg"],
  ["Yoshi", "https://i.imgur.com/eR1XyNw.jpg"],
  ["DK", "https://i.imgur.com/Qj5oW7c.jpg"],
  ["Diddy Kong", "https://i.imgur.com/J4d8Wu4.jpg"],
  ["Birdo", "https://i.imgur.com/NeLAzvt.jpg"],
  ["Bowser", "https://i.imgur.com/eXZCeiy.jpg"],
  ["Bowser Jr.", "https://i.imgur.com/Yu9cn3l.jpg"],
  ["Wario", "https://i.imgur.com/kcb3Z1Z.jpg"],
  ["Waluigi", "https://i.imgur.com/Mbt7uRn.jpg"],
  ["Kamek", "https://i.imgur.com/uWzRpnC.jpg"],
  ["Boo", "https://i.imgur.com/NL1fFK7.jpg"],
  ["Blooper", "https://i.imgur.com/BgsfniM.jpg"],
  ["Chain Chomp", "https://i.imgur.com/dyx3kBJ.jpg"],
  ["Dry Bones", "https://i.imgur.com/pVMu7pD.jpg"],
  ["Goomba", "https://i.imgur.com/Z1wshVF.png"],
  ["Koopa Troopa", "https://i.imgur.com/AIbf4o8.jpg"],
  ["Shy Guy", "https://i.imgur.com/5IEtgFL.jpg"],
  ["Monty Mole", "https://i.imgur.com/YoNELzv.png"],
  ["Piranha Plant", "https://i.imgur.com/89B3C1c.jpg"],
  ["Pianta", "https://i.imgur.com/xuUYK52.jpg"],
  ["Wiggler", "https://i.imgur.com/Lv85AzN.png"],
  ["Toadette", "https://i.imgur.com/oHD0Txk.jpg"],
  ["Kirby", "https://i.imgur.com/xAvd6XR.jpg"],
  ["King Dedede", "https://i.imgur.com/k4igtLc.jpg"],
  ["Link", "https://i.imgur.com/61J8Io4.jpg"],
  ["Ness", "https://i.imgur.com/6Qq94IL.jpg"],
  ["Captain Olimar", "https://i.imgur.com/OJBbhAD.jpg"],
  ["Meta Knight", "https://i.imgur.com/mmLoOcG.jpg"],
  ["Lucas", "https://i.imgur.com/pebeGdc.jpg"],
  ["Game & Watch", "https://i.imgur.com/ov9yino.jpeg"],
  ["Zelda", "https://i.imgur.com/h9074mz.jpeg"],
  ["Link", "https://i.imgur.com/pqaeg9W.jpeg"],
].map(([name, image], index) => ({
  id: `player-${index + 1}`,
  name,
  image,
}));

const rollDie = (max) => Math.floor(Math.random() * max) + 1;

const shuffle = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const dailyDieMax = (playerCount) => {
  if (playerCount >= 6) return 10;
  if (playerCount === 5) return 12;
  if (playerCount === 4) return 15;
  if (playerCount === 3) return 20;
  if (playerCount === 2) return 30;
  return 60;
};

const createTeams = (enabledColorNames, selectedCast) => {
  const shuffledPlayers = shuffle(selectedCast);
  const teamCount = Math.ceil(shuffledPlayers.length / 6);
  const enabledColors = TEAM_COLORS.filter((color) =>
    enabledColorNames.includes(color.name)
  );
  const selectedColors = shuffle(enabledColors).slice(0, teamCount);

  return Array.from({ length: teamCount }, (_, teamIndex) => {
    const color = selectedColors[teamIndex];
    return {
      id: `team-${teamIndex + 1}`,
      ...color,
      players: shuffledPlayers.slice(teamIndex * 6, teamIndex * 6 + 6),
      dailyRolls: {},
      tieRolls: {},
      cumulativeScore: 0,
    };
  }).filter((team) => team.players.length > 0);
};

const createEmptyCustomTeams = (enabledColorNames, selectedCast) => {
  const teamCount = Math.ceil(selectedCast.length / 6);
  const enabledColors = TEAM_COLORS.filter((color) =>
    enabledColorNames.includes(color.name)
  );
  const selectedColors = enabledColors.slice(0, teamCount);

  return Array.from({ length: teamCount }, (_, teamIndex) => ({
    id: `team-${teamIndex + 1}`,
    ...selectedColors[teamIndex],
    players: [],
    dailyRolls: {},
    tieRolls: {},
    cumulativeScore: 0,
  }));
};


type CastRecord = {
  id: string;
  name: string;
  show_name: string | null;
  is_official: boolean;
  is_full_cast?: boolean;
};

type ContestantRecord = {
  id: string;
  name: string;
  image_url: string | null;
  cast_id?: string;
};

function AddCastMembersModal({
  casts,
  castId,
  contestants,
  selectedIds,
  loadingCasts,
  loadingContestants,
  onClose,
  onChooseCast,
  onToggle,
  onSelectAll,
  onSelectNone,
  onAdd,
}) {
  const official = casts.filter((cast) => cast.is_official);
  const custom = casts.filter((cast) => !cast.is_official);

  useEffect(() => {
    if (!castId && casts[0]?.id) onChooseCast(casts[0].id);
  }, [castId, casts, onChooseCast]);

  function CastList({ items, title }) {
    if (!items.length) return null;

    return (
      <div className="dm-cast-group">
        <h4>{title}</h4>
        {items.map((cast) => (
          <button
            key={cast.id}
            type="button"
            className={castId === cast.id ? "dm-cast-choice active" : "dm-cast-choice"}
            onClick={() => onChooseCast(cast.id)}
          >
            <b>{cast.name}</b>
            <small>
              {cast.show_name ||
                (cast.is_full_cast
                  ? "Full Custom Cast"
                  : cast.is_official
                    ? "Official Cast"
                    : "Custom Cast")}
            </small>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="dm-modal-backdrop">
      <div className="dm-modal">
        <div className="dm-modal-header">
          <div>
            <h2>Add Cast Members</h2>
            <p>Choose contestants from your favorite official or custom casts.</p>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="dm-modal-body">
          <div className="dm-cast-sidebar">
            {loadingCasts ? (
              <p>Loading casts...</p>
            ) : (
              <>
                <CastList items={official} title="Favorite Official Casts" />
                <CastList items={custom} title="Custom Casts" />
              </>
            )}
          </div>

          <div className="dm-contestant-pane">
            <div className="dm-modal-actions">
              <b>{selectedIds.size} selected</b>
              <button type="button" onClick={onSelectAll}>Select All</button>
              <button type="button" onClick={onSelectNone}>Select None</button>
              <button type="button" onClick={onAdd} disabled={!selectedIds.size}>
                Add Selected
              </button>
            </div>

            {loadingContestants ? (
              <p>Loading contestants...</p>
            ) : (
              <div className="dm-modal-grid">
                {contestants.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className={selectedIds.has(person.id) ? "dm-modal-person active" : "dm-modal-person"}
                    onClick={() => onToggle(person.id)}
                  >
                    {person.image_url ? (
                      <img src={person.image_url} alt={person.name} />
                    ) : (
                      <div className="dm-no-image">No Image</div>
                    )}
                    <span>{person.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  value,
  rolling = false,
  buttonLabel,
  onRoll,
  disabled = false,
  eliminated = false,
  currentLowest = false,
}) {
  const buttonText = rolling
    ? "Rolling..."
    : value != null
    ? value
    : buttonLabel;

  return (
    <div
      className={[
        "dm-player",
        eliminated ? "eliminated" : "",
        currentLowest ? "current-lowest" : "",
      ].join(" ")}
    >
      <img src={player.image} alt={player.name} />
      <div className="dm-player-name">{player.name}</div>
      {onRoll && (
        <button
          className={`dm-roll-button ${value != null ? "has-value" : ""}`}
          onClick={onRoll}
          disabled={disabled || rolling || value != null}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

function TeamBanner({ team, children, danger = false, winner = false }) {
  return (
    <section
      className={`dm-team-panel ${danger ? "danger" : ""} ${
        winner ? "winner" : ""
      }`}
      style={{
        "--team-bg": team.bg,
        "--team-text": team.text,
        "--team-border": team.border || "rgba(255,255,255,.35)",
      }}
    >
      <header className="dm-team-header">
        <strong>{team.name} Team</strong>
        <span>
          {team.players.length} player{team.players.length === 1 ? "" : "s"}
        </span>
      </header>
      {children}
    </section>
  );
}

export default function DiceMasterPage() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);
  const [roster, setRoster] = useState([]);
  const [selectedRosterIds, setSelectedRosterIds] = useState(() => new Set());
  const [castLocked, setCastLocked] = useState(false);

  const selectedCast = roster.filter((person) => selectedRosterIds.has(person.id));
  const requiredTeams = Math.ceil(selectedCast.length / 6);
  const [enabledColors, setEnabledColors] = useState(
    TEAM_COLORS.map((color) => color.name)
  );
  const [teams, setTeams] = useState([]);
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState("setup");
  const [lowestTeamIds, setLowestTeamIds] = useState([]);
  const [eliminationTeamId, setEliminationTeamId] = useState(null);
  const [eliminationRolls, setEliminationRolls] = useState({});
  const [eliminationTieIds, setEliminationTieIds] = useState([]);
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null);
  const [history, setHistory] = useState([]);
  const [rollingDaily, setRollingDaily] = useState({});
  const [rollingElimination, setRollingElimination] = useState({});
  const [cumulativeMode, setCumulativeMode] = useState(false);
  const [teamSetupMode, setTeamSetupMode] = useState("random");
  const [customTeams, setCustomTeams] = useState([]);
  const [customUnassigned, setCustomUnassigned] = useState([]);
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);


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

    const favoriteIds = (favoriteData || []).map((favorite) => favorite.cast_id);

    const { data: userCasts, error: userError } = await supabase
      .from("casts")
      .select("id,name,show_name,created_at,is_official,is_full_cast")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (userError) {
      alert(userError.message);
      setLoadingCasts(false);
      return;
    }

    let officialCasts = [];

    if (favoriteIds.length) {
      const { data, error } = await supabase
        .from("casts")
        .select("id,name,show_name,created_at,is_official,is_full_cast")
        .in("id", favoriteIds)
        .eq("is_official", true)
        .order("name", { ascending: true });

      if (error) {
        alert(error.message);
        setLoadingCasts(false);
        return;
      }

      officialCasts = data || [];
    }

    setAvailableCasts([...officialCasts, ...(userCasts || [])]);
    setLoadingCasts(false);
  }

  async function openAddCastModal() {
    setShowAddCastModal(true);
    if (!modalCastId && availableCasts[0]?.id) {
      await loadContestantsForModal(availableCasts[0].id);
    }
  }

  async function loadContestantsForModal(castId) {
    setModalCastId(castId);
    setModalSelectedIds(new Set());
    setLoadingModalContestants(true);

    const cast = availableCasts.find((item) => item.id === castId);
    const { data, error } = await supabase
      .from("contestants")
      .select("id,name,image_url,cast_id")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      setLoadingModalContestants(false);
      return;
    }

    if ((data || []).length || !cast?.is_full_cast) {
      setModalContestants(data || []);
      setLoadingModalContestants(false);
      return;
    }

    setModalContestants(await loadFullCustomCastContestants(castId));
    setLoadingModalContestants(false);
  }

  async function loadFullCustomCastContestants(castId) {
    const links = [
      ["full_cast_members", "full_cast_id"],
      ["full_cast_members", "cast_id"],
      ["cast_members", "full_cast_id"],
      ["cast_members", "cast_id"],
    ];

    for (const [table, column] of links) {
      const { data: rows, error } = await supabase
        .from(table)
        .select("contestant_id")
        .eq(column, castId);

      if (error || !rows?.length) continue;

      const ids = [...new Set(rows.map((row) => row.contestant_id).filter(Boolean))];
      if (!ids.length) continue;

      const { data: people, error: peopleError } = await supabase
        .from("contestants")
        .select("id,name,image_url,cast_id")
        .in("id", ids);

      if (!peopleError && people?.length) {
        const byId = new Map(people.map((person) => [person.id, person]));
        return ids.map((id) => byId.get(id)).filter(Boolean);
      }
    }

    return [];
  }

  function addSelectedContestantsToRoster() {
    const picked = modalContestants.filter((person) => modalSelectedIds.has(person.id));
    if (!picked.length) return;

    const additions = picked.map((person) => ({
      id: `${modalCastId}-${person.id}`,
      sourceId: person.id,
      name: person.name,
      image: person.image_url || "",
    }));

    setRoster((current) => {
      const existing = new Set(current.map((person) => person.id));
      const fresh = additions.filter((person) => !existing.has(person.id));

      setSelectedRosterIds((currentSelected) => {
        const next = new Set(currentSelected);
        fresh.forEach((person) => next.add(person.id));
        return next;
      });

      return [...current, ...fresh];
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function toggleRosterPlayer(id) {
    setSelectedRosterIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function removeRosterPlayer(id) {
    setRoster((current) => current.filter((person) => person.id !== id));
    setSelectedRosterIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function continueToGameSetup() {
    if (selectedCast.length < 2) {
      alert("Select at least 2 contestants.");
      return;
    }

    setCastLocked(true);
    setStage("setup");
    setCustomTeams([]);
    setCustomUnassigned([]);
  }

  const activeTeams = useMemo(
    () => teams.filter((team) => team.players.length > 0),
    [teams]
  );

  const displayedChallengeTeams = useMemo(() => {
    const current = [...activeTeams];
    if (!cumulativeMode || stage !== "daily") return current;

    return current.sort(
      (a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0)
    );
  }, [activeTeams, cumulativeMode, stage]);

  const customTeamsReady =
    teamSetupMode !== "custom" ||
    (customUnassigned.length === 0 &&
      customTeams.length > 0 &&
      customTeams.every((team) => team.players.length > 0));

  function initializeCustomTeams() {
    setCustomTeams(createEmptyCustomTeams(enabledColors, selectedCast));
    setCustomUnassigned([...selectedCast]);
  }

  function moveCustomPlayer(playerId, destinationTeamId) {
    let movingPlayer = customUnassigned.find((player) => player.id === playerId);

    if (!movingPlayer) {
      for (const team of customTeams) {
        const found = team.players.find((player) => player.id === playerId);
        if (found) {
          movingPlayer = found;
          break;
        }
      }
    }

    if (!movingPlayer) return;

    if (destinationTeamId) {
      const destination = customTeams.find((team) => team.id === destinationTeamId);
      if (!destination || destination.players.length >= 6) return;
    }

    setCustomUnassigned((current) =>
      current.filter((player) => player.id !== playerId)
    );

    setCustomTeams((current) =>
      current.map((team) => {
        const withoutPlayer = team.players.filter(
          (player) => player.id !== playerId
        );

        if (team.id === destinationTeamId) {
          return {
            ...team,
            players: [...withoutPlayer, movingPlayer],
          };
        }

        return { ...team, players: withoutPlayer };
      })
    );

    if (!destinationTeamId) {
      setCustomUnassigned((current) => {
        if (current.some((player) => player.id === playerId)) return current;
        return [...current, movingPlayer];
      });
    }
  }

  const eliminationTeam = teams.find((team) => team.id === eliminationTeamId);
  const winner = activeTeams.length === 1 ? activeTeams[0] : null;

  const allDailyRolled =
    activeTeams.length > 0 &&
    activeTeams.every(
      (team) => Object.keys(team.dailyRolls).length === team.players.length
    );

  const allTieTeamsRolled =
    lowestTeamIds.length > 1 &&
    lowestTeamIds.every((teamId) => {
      const team = teams.find((item) => item.id === teamId);
      return team && Object.keys(team.tieRolls).length === team.players.length;
    });

  const currentEliminationIds =
    eliminationTieIds.length > 0
      ? eliminationTieIds
      : eliminationTeam?.players.map((player) => player.id) || [];

  const allEliminationRolled =
    currentEliminationIds.length > 0 &&
    currentEliminationIds.every((id) => eliminationRolls[id] != null);

  const currentEliminationLowestIds = useMemo(() => {
    const rolled = currentEliminationIds
      .filter((id) => eliminationRolls[id] != null)
      .map((id) => ({ id, value: eliminationRolls[id] }));

    if (!rolled.length) return [];
    const minimum = Math.min(...rolled.map((item) => item.value));
    return rolled.filter((item) => item.value === minimum).map((item) => item.id);
  }, [currentEliminationIds, eliminationRolls]);

  const toggleColor = (name) => {
    setEnabledColors((current) => {
      const next = current.includes(name)
        ? current.filter((color) => color !== name)
        : [...current, name];

      if (teamSetupMode === "custom") {
        window.setTimeout(() => {
          const teamCount = Math.ceil(selectedCast.length / 6);
          const colors = TEAM_COLORS.filter((color) => next.includes(color.name));

          setCustomTeams((currentTeams) =>
            Array.from({ length: teamCount }, (_, index) => {
              const existing = currentTeams[index];
              return {
                id: `team-${index + 1}`,
                ...colors[index],
                players: existing?.players || [],
                dailyRolls: {},
                tieRolls: {},
                cumulativeScore: 0,
              };
            })
          );
        }, 0);
      }

      return next;
    });
  };

  const startGame = () => {
    if (enabledColors.length < requiredTeams) return;
    if (teamSetupMode === "custom" && !customTeamsReady) return;

    setTeams(
      teamSetupMode === "custom"
        ? customTeams.map((team) => ({
            ...team,
            dailyRolls: {},
            tieRolls: {},
            cumulativeScore: 0,
          }))
        : createTeams(enabledColors, selectedCast)
    );
    setRound(1);
    setStage("intro");
    setLowestTeamIds([]);
    setEliminationTeamId(null);
    setEliminationRolls({});
    setEliminationTieIds([]);
    setEliminatedPlayer(null);
    setHistory([]);
    setRollingDaily({});
    setRollingElimination({});
  };

  const performDailyRoll = (teamId, playerId, tieBreaker = false) => {
    const key = `${tieBreaker ? "tie" : "daily"}-${teamId}-${playerId}`;
    setRollingDaily((current) => ({ ...current, [key]: true }));

    window.setTimeout(() => {
      setTeams((current) =>
        current.map((team) => {
          if (team.id !== teamId) return team;
          const max = dailyDieMax(team.players.length);
          const rollKey = tieBreaker ? "tieRolls" : "dailyRolls";
          if (team[rollKey][playerId] != null) return team;
          return {
            ...team,
            [rollKey]: {
              ...team[rollKey],
              [playerId]: rollDie(max),
            },
          };
        })
      );
      setRollingDaily((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }, 300);
  };

  const rollDailyTeam = (teamId, tieBreaker = false) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return;

    const rollKey = tieBreaker ? "tieRolls" : "dailyRolls";
    const prefix = tieBreaker ? "tie" : "daily";
    const rollingKeys = {};

    team.players.forEach((player) => {
      if (team[rollKey][player.id] == null) {
        rollingKeys[`${prefix}-${team.id}-${player.id}`] = true;
      }
    });

    if (Object.keys(rollingKeys).length === 0) return;
    setRollingDaily((current) => ({ ...current, ...rollingKeys }));

    window.setTimeout(() => {
      setTeams((current) =>
        current.map((item) => {
          if (item.id !== teamId) return item;
          const max = dailyDieMax(item.players.length);
          const rolls = { ...item[rollKey] };

          item.players.forEach((player) => {
            if (rolls[player.id] == null) rolls[player.id] = rollDie(max);
          });

          return { ...item, [rollKey]: rolls };
        })
      );

      setRollingDaily((current) => {
        const next = { ...current };
        Object.keys(rollingKeys).forEach((key) => delete next[key]);
        return next;
      });
    }, 300);
  };

  const rollAllDaily = (tieBreaker = false) => {
    const eligibleTeams = tieBreaker
      ? teams.filter((team) => lowestTeamIds.includes(team.id))
      : activeTeams;

    const rollingKeys = {};
    eligibleTeams.forEach((team) => {
      const rollKey = tieBreaker ? "tieRolls" : "dailyRolls";
      team.players.forEach((player) => {
        if (team[rollKey][player.id] == null) {
          rollingKeys[
            `${tieBreaker ? "tie" : "daily"}-${team.id}-${player.id}`
          ] = true;
        }
      });
    });

    setRollingDaily((current) => ({ ...current, ...rollingKeys }));

    window.setTimeout(() => {
      setTeams((current) =>
        current.map((team) => {
          if (tieBreaker && !lowestTeamIds.includes(team.id)) return team;
          if (!tieBreaker && team.players.length === 0) return team;

          const max = dailyDieMax(team.players.length);
          const rollKey = tieBreaker ? "tieRolls" : "dailyRolls";
          const rolls = { ...team[rollKey] };

          team.players.forEach((player) => {
            if (rolls[player.id] == null) rolls[player.id] = rollDie(max);
          });

          return { ...team, [rollKey]: rolls };
        })
      );
      setRollingDaily({});
    }, 300);
  };

  const roundTeamTotal = (team, tieBreaker = false) =>
    Object.values(tieBreaker ? team.tieRolls : team.dailyRolls).reduce(
      (sum, value) => sum + value,
      0
    );

  const displayedTeamTotal = (team, tieBreaker = false) =>
    tieBreaker
      ? roundTeamTotal(team, true)
      : roundTeamTotal(team, false) + (cumulativeMode ? team.cumulativeScore || 0 : 0);

  const determineLowestDaily = (tieBreaker = false) => {
    const pool = tieBreaker
      ? teams.filter((team) => lowestTeamIds.includes(team.id))
      : activeTeams;

    const totals = pool.map((team) => ({
      id: team.id,
      total: tieBreaker
        ? roundTeamTotal(team, true)
        : displayedTeamTotal(team, false),
    }));

    if (cumulativeMode && !tieBreaker) {
      setTeams((current) =>
        current.map((team) =>
          team.players.length > 0
            ? {
                ...team,
                cumulativeScore:
                  (team.cumulativeScore || 0) + roundTeamTotal(team, false),
              }
            : team
        )
      );
    }

    const minimum = Math.min(...totals.map((item) => item.total));
    const tied = totals
      .filter((item) => item.total === minimum)
      .map((item) => item.id);

    if (tied.length > 1) {
      setLowestTeamIds(tied);
      setTeams((current) =>
        current.map((team) =>
          tied.includes(team.id) ? { ...team, tieRolls: {} } : team
        )
      );
      setStage("dailyTie");
      return;
    }

    const lastTeam = teams.find((team) => team.id === tied[0]);
    setLowestTeamIds(tied);
    setEliminationTeamId(tied[0]);

    if (lastTeam.players.length === 1) {
      const lonePlayer = lastTeam.players[0];
      setEliminatedPlayer(lonePlayer);
      setTeams((current) =>
        current.map((team) =>
          team.id === lastTeam.id ? { ...team, players: [] } : team
        )
      );
      setHistory((current) => [
        ...current,
        { round, player: lonePlayer, team: lastTeam.name },
      ]);
      setStage("eliminationResult");
    } else {
      setEliminationRolls({});
      setEliminationTieIds([]);
      setRollingElimination({});
      setStage("elimination");
    }
  };

  const performEliminationRoll = (playerId) => {
    setRollingElimination((current) => ({ ...current, [playerId]: true }));

    window.setTimeout(() => {
      setEliminationRolls((current) => {
        if (current[playerId] != null) return current;
        return { ...current, [playerId]: rollDie(100) };
      });
      setRollingElimination((current) => {
        const next = { ...current };
        delete next[playerId];
        return next;
      });
    }, 300);
  };

  const rollAllElimination = () => {
    const rolling = {};
    currentEliminationIds.forEach((id) => {
      if (eliminationRolls[id] == null) rolling[id] = true;
    });
    setRollingElimination((current) => ({ ...current, ...rolling }));

    window.setTimeout(() => {
      setEliminationRolls((current) => {
        const next = { ...current };
        currentEliminationIds.forEach((id) => {
          if (next[id] == null) next[id] = rollDie(100);
        });
        return next;
      });
      setRollingElimination({});
    }, 300);
  };

  const resolveElimination = () => {
    const values = currentEliminationIds.map((id) => ({
      id,
      value: eliminationRolls[id],
    }));
    const minimum = Math.min(...values.map((item) => item.value));
    const tied = values
      .filter((item) => item.value === minimum)
      .map((item) => item.id);

    if (tied.length > 1) {
      setEliminationTieIds(tied);
      setEliminationRolls({});
      setRollingElimination({});
      return;
    }

    const loserId = tied[0];
    const team = teams.find((item) => item.id === eliminationTeamId);
    const loser = team.players.find((player) => player.id === loserId);

    setEliminatedPlayer(loser);
    setHistory((current) => [
      ...current,
      { round, player: loser, team: team.name },
    ]);
    setTeams((current) =>
      current.map((item) =>
        item.id === eliminationTeamId
          ? {
              ...item,
              players: item.players.filter((player) => player.id !== loserId),
            }
          : item
      )
    );
    setStage("eliminationResult");
  };

  const beginNextRound = () => {
    const remaining = teams.filter((team) => team.players.length > 0);
    if (remaining.length === 1) {
      setStage("winner");
      return;
    }

    setRound((value) => value + 1);
    setTeams((current) => {
      const resetTeams = current.map((team) => ({
        ...team,
        dailyRolls: {},
        tieRolls: {},
      }));

      return cumulativeMode
        ? [...resetTeams].sort(
            (a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0)
          )
        : resetTeams;
    });
    setLowestTeamIds([]);
    setEliminationTeamId(null);
    setEliminationRolls({});
    setEliminationTieIds([]);
    setEliminatedPlayer(null);
    setRollingDaily({});
    setRollingElimination({});
    setStage("daily");
  };

  const returnToMenu = () => {
    setTeams([]);
    setStage("setup");
    setRound(1);
    setHistory([]);
  };

  const changeCast = () => {
    setTeams([]);
    setStage("setup");
    setRound(1);
    setHistory([]);
    setCustomTeams([]);
    setCustomUnassigned([]);
    setCastLocked(false);
  };

  const advance = () => {
    if (stage === "intro") setStage("daily");
    else if (stage === "daily" && allDailyRolled) determineLowestDaily(false);
    else if (stage === "dailyTie" && allTieTeamsRolled)
      determineLowestDaily(true);
    else if (stage === "elimination" && allEliminationRolled)
      resolveElimination();
    else if (stage === "eliminationResult") beginNextRound();
  };

  const anyRolling =
    Object.keys(rollingDaily).length > 0 ||
    Object.keys(rollingElimination).length > 0;

  const canAdvance =
    !anyRolling &&
    (stage === "intro" ||
      (stage === "daily" && allDailyRolled) ||
      (stage === "dailyTie" && allTieTeamsRolled) ||
      (stage === "elimination" && allEliminationRolled) ||
      stage === "eliminationResult");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (
        event.code === "Space" &&
        !["INPUT", "BUTTON", "TEXTAREA"].includes(
          document.activeElement?.tagName
        )
      ) {
        event.preventDefault();
        if (canAdvance && stage !== "winner" && stage !== "setup") advance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <>
      <Navbar />

      {showAddCastModal && (
        <AddCastMembersModal
          casts={availableCasts}
          castId={modalCastId}
          contestants={modalContestants}
          selectedIds={modalSelectedIds}
          loadingCasts={loadingCasts}
          loadingContestants={loadingModalContestants}
          onClose={() => setShowAddCastModal(false)}
          onChooseCast={loadContestantsForModal}
          onToggle={(id) =>
            setModalSelectedIds((current) => {
              const next = new Set(current);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
          onSelectAll={() =>
            setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))
          }
          onSelectNone={() => setModalSelectedIds(new Set())}
          onAdd={addSelectedContestantsToRoster}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }

        .dm-roster-page {
          min-height: calc(100vh - 70px);
          background: radial-gradient(circle at top, #312e81 0%, #111827 46%, #030712 100%);
          color: #f9fafb;
          padding: 28px 18px 50px;
        }
        .dm-roster-shell { width: min(1220px,100%); margin: 0 auto; }
        .dm-roster-header {
          display:flex; justify-content:space-between; align-items:center;
          gap:16px; flex-wrap:wrap; margin-bottom:20px;
        }
        .dm-roster-header h1 { margin:0; font-size:clamp(2.3rem,5vw,4.8rem); }
        .dm-roster-header p { margin:7px 0 0; color:#c7d2fe; }
        .dm-roster-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .dm-black-button, .dm-gray-button {
          border:2px solid #52525b; border-radius:12px; padding:12px 18px;
          color:#fff; font-weight:1000; cursor:pointer;
        }
        .dm-black-button { background:#000; box-shadow:0 5px 0 #27272a; }
        .dm-black-button:hover { background:#18181b; }
        .dm-black-button:disabled { opacity:.4; cursor:not-allowed; }
        .dm-gray-button { background:#27272a; }
        .dm-roster-grid {
          display:grid; grid-template-columns:repeat(auto-fill,minmax(125px,1fr)); gap:12px;
        }
        .dm-roster-card {
          position:relative; overflow:hidden; border:3px solid #facc15;
          border-radius:14px; background:#fff; color:#111827; cursor:pointer;
        }
        .dm-roster-card.off { opacity:.35; filter:grayscale(1); border-color:#52525b; }
        .dm-roster-card img, .dm-roster-no-image {
          display:grid; place-items:center; width:100%; aspect-ratio:1;
          object-fit:contain; background:#fff;
        }
        .dm-roster-card > span {
          display:block; padding:8px 5px; text-align:center; font-weight:1000;
        }
        .dm-roster-remove {
          position:absolute; top:5px; right:5px; z-index:2; width:28px; height:28px;
          border:0; border-radius:999px; background:#ef4444; color:#fff;
          font-weight:1000; cursor:pointer;
        }
        .dm-roster-empty {
          padding:38px; border:2px dashed #52525b; border-radius:16px;
          text-align:center; color:#a1a1aa; font-weight:900;
        }
        .dm-modal-backdrop {
          position:fixed; inset:0; z-index:9999; display:flex; align-items:center;
          justify-content:center; padding:14px; background:rgba(0,0,0,.86);
        }
        .dm-modal {
          width:min(1100px,100%); height:90vh; display:flex; flex-direction:column;
          overflow:hidden; border:1px solid #3f3f46; border-radius:20px; background:#09090b;
        }
        .dm-modal-header {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding:16px; border-bottom:1px solid #27272a;
        }
        .dm-modal-header h2,.dm-modal-header p { margin:0; }
        .dm-modal-header button,.dm-modal-actions button {
          border:0; border-radius:10px; padding:10px 14px;
          background:#000; color:#fff; font-weight:900; cursor:pointer;
        }
        .dm-modal-actions button:disabled { opacity:.4; cursor:not-allowed; }
        .dm-modal-body {
          display:grid; grid-template-columns:310px minmax(0,1fr);
          flex:1; min-height:0; overflow:hidden;
        }
        .dm-cast-sidebar,.dm-contestant-pane {
          min-height:0; overflow-y:auto; padding:14px; overscroll-behavior:contain;
        }
        .dm-cast-sidebar { border-right:1px solid #27272a; }
        .dm-cast-group h4 { color:#a1a1aa; }
        .dm-cast-choice {
          display:block; width:100%; margin:5px 0; padding:11px; border:0;
          border-radius:11px; background:#18181b; color:#fff; text-align:left; cursor:pointer;
        }
        .dm-cast-choice.active { background:#000; outline:2px solid #facc15; }
        .dm-cast-choice small { display:block; margin-top:3px; opacity:.7; }
        .dm-modal-actions {
          display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px;
        }
        .dm-modal-grid {
          display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:9px;
        }
        .dm-modal-person {
          overflow:hidden; padding:0; border:2px solid transparent; border-radius:11px;
          background:#18181b; color:#fff; cursor:pointer;
        }
        .dm-modal-person:not(.active) { opacity:.38; filter:grayscale(1); }
        .dm-modal-person.active { border-color:#fbbf24; }
        .dm-modal-person img,.dm-no-image {
          width:100%; aspect-ratio:1; object-fit:contain; background:#fff;
        }
        .dm-no-image { display:grid; place-items:center; color:#111827; }
        .dm-modal-person span { display:block; padding:6px 3px; font-size:12px; }

        body { margin: 0; }
        button { font: inherit; }
        .dm-app {
          min-height: 100vh;
          background: radial-gradient(circle at top, #312e81 0%, #111827 46%, #030712 100%);
          color: #f9fafb;
          padding: 24px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .dm-shell { width: min(1550px, 100%); margin: 0 auto; }
        .dm-topbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 20px;
        }
        .dm-title h1 { margin: 0; font-size: clamp(32px, 5vw, 62px); line-height: .95; }
        .dm-title p { margin: 8px 0 0; color: #c7d2fe; }
        .dm-round {
          padding: 12px 18px; border: 1px solid #6366f1; border-radius: 999px;
          background: rgba(49,46,129,.55); font-weight: 900; white-space: nowrap;
        }
        .dm-stage-card {
          background: rgba(17,24,39,.9); border: 1px solid #374151;
          border-radius: 22px; padding: 22px;
        }
        .dm-stage-title { text-align: center; margin: 0 0 8px; font-size: clamp(24px, 4vw, 42px); }
        .dm-stage-subtitle { text-align: center; color: #cbd5e1; margin: 0 0 22px; }
        .dm-setup { max-width: 1000px; margin: 0 auto; }
        .dm-color-grid {
          display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 12px;
          margin: 22px 0;
        }
        .dm-color-toggle {
          border: 3px solid transparent; border-radius: 14px; overflow: hidden;
          padding: 0; cursor: pointer; background: transparent;
        }
        .dm-color-toggle.active { border-color: #facc15; }
        .dm-color-sample {
          min-height: 72px; display: grid; place-items: center; padding: 10px;
          background: var(--sample-bg); color: var(--sample-text);
          font-weight: 1000; text-shadow: 0 1px 2px rgba(0,0,0,.35);
        }
        .dm-color-toggle:not(.active) .dm-color-sample {
          filter: grayscale(1); opacity: .38;
        }
        .dm-setup-count {
          text-align: center; font-weight: 900; margin: 12px 0;
        }
        .dm-warning { color: #fca5a5; text-align: center; font-weight: 900; }
        .dm-two-column {
          display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 18px;
        }
        .dm-challenge-list {
          display: grid; grid-template-columns: 1fr; gap: 18px;
        }
        .dm-mode-box {
          margin: 18px auto 6px; max-width: 760px; padding: 16px 18px;
          border: 1px solid #4f46e5; border-radius: 14px; background: rgba(49,46,129,.3);
        }
        .dm-mode-label {
          display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-weight: 1000;
        }
        .dm-mode-label input { width: 20px; height: 20px; margin-top: 2px; }
        .dm-mode-copy small { display: block; margin-top: 5px; color: #c7d2fe; font-weight: 700; line-height: 1.35; }
        .dm-team-mode-row {
          display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;
          max-width:760px; margin:18px auto;
        }
        .dm-team-mode-button {
          border:3px solid #4b5563; border-radius:14px; padding:16px;
          background:#111827; color:#fff; text-align:left; cursor:pointer;
        }
        .dm-team-mode-button.active {
          border-color:#facc15; background:#27210b;
        }
        .dm-team-mode-button strong { display:block; font-size:17px; }
        .dm-team-mode-button small {
          display:block; margin-top:5px; color:#cbd5e1; line-height:1.35;
        }
        .dm-custom-builder {
          margin:20px 0; padding:16px; border:1px solid #4f46e5;
          border-radius:18px; background:rgba(3,7,18,.55);
        }
        .dm-custom-builder-head {
          display:flex; justify-content:space-between; align-items:center;
          gap:12px; flex-wrap:wrap; margin-bottom:14px;
        }
        .dm-custom-builder-head h3 { margin:0; }
        .dm-custom-teams-grid {
          display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px;
        }
        .dm-custom-drop-team {
          min-height:190px; border:3px dashed rgba(255,255,255,.45);
          border-radius:15px; overflow:hidden; background:var(--team-bg);
          color:var(--team-text);
        }
        .dm-custom-drop-team.drag-over { outline:4px solid #facc15; }
        .dm-custom-drop-head {
          display:flex; justify-content:space-between; gap:10px;
          padding:10px 12px; background:rgba(0,0,0,.2); font-weight:1000;
        }
        .dm-custom-player-grid {
          display:grid; grid-template-columns:repeat(3,minmax(0,1fr));
          gap:8px; padding:9px;
        }
        .dm-drag-player {
          overflow:hidden; border:2px solid rgba(255,255,255,.75);
          border-radius:10px; background:#fff; color:#111827;
          cursor:grab; text-align:center;
        }
        .dm-drag-player:active { cursor:grabbing; }
        .dm-drag-player img,.dm-drag-no-image {
          display:grid; place-items:center; width:100%; aspect-ratio:1;
          object-fit:contain; background:#fff;
        }
        .dm-drag-player span {
          display:block; min-height:34px; padding:5px 4px;
          font-size:11px; font-weight:900;
        }
        .dm-unassigned-zone {
          margin-bottom:14px; min-height:135px; border:3px dashed #6b7280;
          border-radius:15px; background:#111827;
        }
        .dm-unassigned-zone h4 { margin:0; padding:10px 12px; }
        .dm-unassigned-grid {
          display:grid; grid-template-columns:repeat(8,minmax(0,1fr));
          gap:8px; padding:0 10px 10px;
        }
        .dm-custom-warning {
          margin-top:12px; color:#fca5a5; text-align:center; font-weight:1000;
        }
        .dm-score-breakdown { margin-top: 8px; font-size: 12px; font-weight: 900; text-align: center; opacity: .95; }
        .dm-team-panel {
          border: 3px solid var(--team-border); border-radius: 16px; overflow: hidden;
          background: var(--team-bg); color: var(--team-text);
        }
        .dm-team-panel.danger { outline: 5px solid #ef4444; }
        .dm-team-panel.winner { outline: 6px solid #facc15; }
        .dm-team-header {
          display: flex; align-items: center; gap: 10px; padding: 13px 15px;
          background: rgba(0,0,0,.18); color: inherit;
          border-bottom: 2px solid rgba(255,255,255,.25);
        }
        .dm-team-header strong { font-size: 21px; flex: 1; }
        .dm-team-header span { font-size: 13px; font-weight: 900; }
        .dm-player-grid {
          display: grid; grid-template-columns: repeat(3,minmax(90px,1fr)); gap: 10px; padding: 12px;
        }
        .dm-team-row-grid,
        .dm-challenge-player-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 8px;
          padding: 10px;
        }
        .dm-team-row-grid .dm-player img {
          width: 100%;
          height: 138px;
          aspect-ratio: auto;
          object-fit: contain;
          background: #ffffff;
        }
        .dm-challenge-player-grid .dm-player {
          border-width: 2px;
          border-radius: 10px;
        }
        .dm-challenge-player-grid .dm-player img {
          width: 100%;
          height: 118px;
          aspect-ratio: auto;
          object-fit: contain;
          background: #ffffff;
        }
        .dm-challenge-player-grid .dm-player-name {
          min-height: 34px;
          padding: 5px 4px;
          font-size: 12px;
        }
        .dm-challenge-player-grid .dm-roll-button {
          width: calc(100% - 8px);
          min-height: 32px;
          margin: 0 4px 5px;
          padding: 5px 3px;
          font-size: 12px;
        }
        .dm-challenge-player-grid .dm-roll-button.has-value {
          font-size: 19px;
        }
        .dm-player {
          position: relative; min-width: 0; background: #f8fafc; color: #111827;
          border-radius: 12px; overflow: hidden; text-align: center; border: 3px solid rgba(255,255,255,.8);
          transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
        }
        .dm-player.eliminated { filter: grayscale(1); opacity: .42; }
        .dm-player.current-lowest {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px #7f1d1d, 0 0 24px rgba(239,68,68,.85);
          transform: translateY(-3px);
        }
        .dm-player.current-lowest::before {
          content: "CURRENT LOWEST";
          position: absolute; top: 6px; left: 6px; right: 6px; z-index: 2;
          background: #dc2626; color: white; border-radius: 7px; padding: 4px;
          font-size: 10px; font-weight: 1000;
        }
        .dm-player img {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: contain;
          display: block;
          background: #ffffff;
        }
        .dm-player-name {
          min-height: 40px; padding: 7px 5px; display: grid; place-items: center;
          font-weight: 900; font-size: 13px; line-height: 1.05;
        }
        .dm-roll-button {
          width: calc(100% - 12px); min-height: 38px; margin: 0 6px 7px; border: 0;
          border-radius: 9px; padding: 7px; background: #312e81; color: white;
          font-weight: 1000; cursor: pointer; font-size: 14px;
        }
        .dm-roll-button.has-value {
          background: #111827; font-size: 22px;
        }
        .dm-roll-button:disabled { cursor: default; }
        .dm-daily-row {
          display: grid; grid-template-columns: minmax(0,1fr) 125px; align-items: stretch;
        }
        .dm-score-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          border-left: 2px solid rgba(255,255,255,.3); background: rgba(0,0,0,.22); padding: 12px;
          color: inherit;
        }
        .dm-score-label { font-weight: 900; font-size: 12px; text-align: center; }
        .dm-score-value { font-size: 44px; font-weight: 1000; line-height: 1; margin-top: 6px; }
        .dm-die-note { font-size: 12px; font-weight: 900; margin-top: 8px; text-align: center; }
        .dm-team-roll-button {
          width: 100%; margin-top: 12px; border: 2px solid currentColor; border-radius: 10px;
          padding: 9px 8px; background: rgba(255,255,255,.18); color: inherit;
          font-weight: 1000; cursor: pointer;
        }
        .dm-team-roll-button:hover:not(:disabled) { background: rgba(255,255,255,.3); }
        .dm-team-roll-button:disabled { opacity: .48; cursor: default; }
        .dm-actions {
          position: sticky; bottom: 12px; z-index: 10; display: flex; justify-content: center;
          flex-wrap: wrap; gap: 10px; margin-top: 20px; padding: 12px;
          background: rgba(3,7,18,.88); backdrop-filter: blur(10px); border-radius: 16px;
          border: 1px solid #374151;
        }
        .dm-main-button, .dm-secondary-button {
          border: 0; border-radius: 12px; padding: 12px 22px; font-weight: 1000; cursor: pointer;
        }
        .dm-main-button { background: #facc15; color: #111827; }
        .dm-main-button:disabled { background: #6b7280; color: #d1d5db; cursor: default; }
        .dm-secondary-button { background: #4f46e5; color: #fff; }
        .dm-danger-title { color: #fca5a5; }
        .dm-elim-wrap { max-width: 900px; margin: 0 auto; }
        .dm-elim-grid {
          display: grid; grid-template-columns: repeat(auto-fit,minmax(130px,1fr)); gap: 14px; padding: 16px;
        }
        .dm-result { max-width: 720px; margin: 0 auto; text-align: center; }
        .dm-result-card { width: min(260px,100%); margin: 20px auto; }
        .dm-history { margin-top: 24px; border-top: 1px solid #374151; padding-top: 16px; }
        .dm-history h3 { margin: 0 0 10px; }
        .dm-history-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .dm-history-chip {
          padding: 7px 10px; border-radius: 999px; background: #1f2937; color: #d1d5db;
          font-size: 12px; font-weight: 800;
        }
        .dm-winner-grid { max-width: 850px; margin: 18px auto 0; }
        @media (max-width: 1100px) {
          .dm-team-row-grid,
          .dm-challenge-player-grid {
            grid-template-columns: repeat(6, minmax(82px, 1fr));
          }
          .dm-team-row-grid .dm-player img { height: 112px; }
          .dm-challenge-player-grid .dm-player img { height: 96px; }
        }
        @media (max-width: 950px) {
          .dm-two-column { grid-template-columns: 1fr; }
          .dm-team-row-grid,
          .dm-challenge-player-grid {
            grid-template-columns: repeat(3, minmax(90px, 1fr));
          }
        }
        @media (max-width: 700px) {
          .dm-modal-body {
            grid-template-columns:1fr;
            grid-template-rows:220px minmax(0,1fr);
          }
          .dm-cast-sidebar {
            border-right:0;
            border-bottom:1px solid #27272a;
          }
          .dm-modal-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .dm-roster-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .dm-team-mode-row,.dm-custom-teams-grid { grid-template-columns:1fr; }
          .dm-unassigned-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .dm-app { padding: 12px; }
          .dm-topbar { align-items: flex-start; }
          .dm-stage-card { padding: 12px; }
          .dm-daily-row { grid-template-columns: 1fr; }
          .dm-score-box {
            border-left: 0; border-top: 2px solid rgba(255,255,255,.3);
            flex-direction: row; gap: 12px;
          }
          .dm-score-value { font-size: 34px; margin: 0; }
          .dm-player-grid { grid-template-columns: repeat(2,minmax(90px,1fr)); }
          .dm-team-row-grid,
          .dm-challenge-player-grid {
            grid-template-columns: repeat(2,minmax(90px,1fr));
          }
        }
      `}</style>

      {!castLocked ? (
        <main className="dm-roster-page">
          <div className="dm-roster-shell">
            <div className="dm-roster-header">
              <div>
                <h1>🎲 Dice Master</h1>
                <p>Add contestants, choose who is active, then continue to team settings.</p>
              </div>

              <div className="dm-roster-actions">
                <button className="dm-black-button" type="button" onClick={openAddCastModal}>
                  Add Cast Members
                </button>
                <button
                  className="dm-gray-button"
                  type="button"
                  onClick={() => setSelectedRosterIds(new Set(roster.map((person) => person.id)))}
                >
                  Select All
                </button>
                <button
                  className="dm-gray-button"
                  type="button"
                  onClick={() => setSelectedRosterIds(new Set())}
                >
                  Select None
                </button>
              </div>
            </div>

            {roster.length ? (
              <div className="dm-roster-grid">
                {roster.map((person) => (
                  <div
                    key={person.id}
                    className={selectedRosterIds.has(person.id) ? "dm-roster-card" : "dm-roster-card off"}
                    onClick={() => toggleRosterPlayer(person.id)}
                  >
                    <button
                      type="button"
                      className="dm-roster-remove"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeRosterPlayer(person.id);
                      }}
                    >
                      ×
                    </button>

                    {person.image ? (
                      <img src={person.image} alt={person.name} />
                    ) : (
                      <div className="dm-roster-no-image">No Image</div>
                    )}
                    <span>{person.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dm-roster-empty">No contestants added yet.</div>
            )}

            <button
              type="button"
              className="dm-black-button"
              style={{ display: "block", margin: "24px auto 0", fontSize: 18 }}
              onClick={continueToGameSetup}
              disabled={selectedCast.length < 2}
            >
              Continue with {selectedCast.length} Contestant{selectedCast.length === 1 ? "" : "s"}
            </button>
          </div>
        </main>
      ) : (
        <div className="dm-app">
          <div className="dm-shell">
        <div className="dm-topbar">
          <div className="dm-title">
            <h1>🎲 Dice Master</h1>
            <p>Roll together. Survive alone. Last team standing wins.</p>
          </div>
          {stage !== "setup" && (
            <div className="dm-round">
              Round {round} · {cumulativeMode ? "Cumulative" : "Standard"}
            </div>
          )}
        </div>

        <main className="dm-stage-card">
          {stage === "setup" && (
            <div className="dm-setup">
              <h2 className="dm-stage-title">Choose Active Team Colors</h2>
              <p className="dm-stage-subtitle">
                Choose enabled team colors, then use random teams or build the teams yourself.
              </p>

              <div className="dm-team-mode-row">
                <button
                  type="button"
                  className={`dm-team-mode-button ${teamSetupMode === "random" ? "active" : ""}`}
                  onClick={() => {
                    setTeamSetupMode("random");
                    setCustomTeams([]);
                    setCustomUnassigned([]);
                  }}
                >
                  <strong>Random Teams</strong>
                  <small>Shuffle all selected contestants into teams of up to six.</small>
                </button>

                <button
                  type="button"
                  className={`dm-team-mode-button ${teamSetupMode === "custom" ? "active" : ""}`}
                  onClick={() => {
                    setTeamSetupMode("custom");
                    window.setTimeout(initializeCustomTeams, 0);
                  }}
                >
                  <strong>Custom Teams</strong>
                  <small>Drag each contestant into the team you want before starting.</small>
                </button>
              </div>

              {teamSetupMode === "custom" && (
                <div className="dm-custom-builder">
                  <div className="dm-custom-builder-head">
                    <div>
                      <h3>Build Custom Teams</h3>
                      <small>Drag players between the unassigned area and team boxes.</small>
                    </div>
                    <button
                      type="button"
                      className="dm-secondary-button"
                      onClick={initializeCustomTeams}
                    >
                      Reset Teams
                    </button>
                  </div>

                  <div
                    className="dm-unassigned-zone"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const playerId =
                        event.dataTransfer.getData("text/plain") || draggedPlayerId;
                      if (playerId) moveCustomPlayer(playerId, null);
                      setDraggedPlayerId(null);
                    }}
                  >
                    <h4>Unassigned Players ({customUnassigned.length})</h4>
                    <div className="dm-unassigned-grid">
                      {customUnassigned.map((player) => (
                        <div
                          key={player.id}
                          className="dm-drag-player"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", player.id);
                            setDraggedPlayerId(player.id);
                          }}
                          onDragEnd={() => setDraggedPlayerId(null)}
                        >
                          {player.image ? (
                            <img src={player.image} alt={player.name} />
                          ) : (
                            <div className="dm-drag-no-image">No Image</div>
                          )}
                          <span>{player.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dm-custom-teams-grid">
                    {customTeams.map((team) => (
                      <section
                        key={team.id}
                        className="dm-custom-drop-team"
                        style={{
                          "--team-bg": team.bg,
                          "--team-text": team.text,
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const playerId =
                            event.dataTransfer.getData("text/plain") || draggedPlayerId;
                          if (playerId) moveCustomPlayer(playerId, team.id);
                          setDraggedPlayerId(null);
                        }}
                      >
                        <div className="dm-custom-drop-head">
                          <strong>{team.name} Team</strong>
                          <span>{team.players.length}/6</span>
                        </div>

                        <div className="dm-custom-player-grid">
                          {team.players.map((player) => (
                            <div
                              key={player.id}
                              className="dm-drag-player"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", player.id);
                                setDraggedPlayerId(player.id);
                              }}
                              onDragEnd={() => setDraggedPlayerId(null)}
                            >
                              {player.image ? (
                                <img src={player.image} alt={player.name} />
                              ) : (
                                <div className="dm-drag-no-image">No Image</div>
                              )}
                              <span>{player.name}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>

                  {!customTeamsReady && (
                    <div className="dm-custom-warning">
                      Assign every contestant and make sure every team has at least one player.
                    </div>
                  )}
                </div>
              )}

              <div className="dm-mode-box">
                <label className="dm-mode-label">
                  <input
                    type="checkbox"
                    checked={cumulativeMode}
                    onChange={(event) => setCumulativeMode(event.target.checked)}
                  />
                  <span className="dm-mode-copy">
                    Cumulative Mode
                    <small>
                      Team challenge scores carry over between rounds. After each challenge,
                      the team with the lowest overall score enters the same D100 elimination.
                    </small>
                  </span>
                </label>
              </div>

              <div className="dm-color-grid">
                {TEAM_COLORS.map((color) => {
                  const active = enabledColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      className={`dm-color-toggle ${active ? "active" : ""}`}
                      onClick={() => toggleColor(color.name)}
                      type="button"
                    >
                      <span
                        className="dm-color-sample"
                        style={{
                          "--sample-bg": color.bg,
                          "--sample-text": color.text,
                        }}
                      >
                        {color.name}
                        <small>{active ? "Enabled" : "Disabled"}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="dm-setup-count">
                {enabledColors.length} colors enabled · {requiredTeams} required
              </div>
              {enabledColors.length < requiredTeams && (
                <div className="dm-warning">
                  Enable at least {requiredTeams} colors to start.
                </div>
              )}
            </div>
          )}

          {stage === "intro" && (
            <>
              <h2 className="dm-stage-title">Meet the Teams</h2>
              <p className="dm-stage-subtitle">
                Team colors and contestants have been shuffled. {cumulativeMode ? "Cumulative scoring is on." : "Standard scoring is on."}
              </p>
              <div className="dm-challenge-list">
                {teams.map((team) => (
                  <TeamBanner key={team.id} team={team}>
                    <div className="dm-team-row-grid">
                      {team.players.map((player) => (
                        <PlayerCard key={player.id} player={player} />
                      ))}
                    </div>
                  </TeamBanner>
                ))}
              </div>
            </>
          )}

          {stage === "daily" && (
            <>
              <h2 className="dm-stage-title">Daily Competition</h2>
              <p className="dm-stage-subtitle">
                {cumulativeMode
                  ? "Teams are shown from highest to lowest cumulative score. Every player rolls, and the lowest cumulative total enters elimination."
                  : "Every player rolls. The team with the lowest combined score enters elimination."}
              </p>
              <div className="dm-challenge-list">
                {displayedChallengeTeams.map((team) => {
                  const max = dailyDieMax(team.players.length);
                  return (
                    <TeamBanner key={team.id} team={team}>
                      <div className="dm-daily-row">
                        <div className="dm-challenge-player-grid">
                          {team.players.map((player) => {
                            const key = `daily-${team.id}-${player.id}`;
                            return (
                              <PlayerCard
                                key={player.id}
                                player={player}
                                value={team.dailyRolls[player.id]}
                                rolling={Boolean(rollingDaily[key])}
                                buttonLabel={`Roll D${max}`}
                                onRoll={() =>
                                  performDailyRoll(team.id, player.id, false)
                                }
                              />
                            );
                          })}
                        </div>
                        <div className="dm-score-box" aria-live="polite">
                          <span className="dm-score-label">TEAM TOTAL</span>
                          <span className="dm-score-value">{displayedTeamTotal(team)}</span>
                          <span className="dm-die-note">Each rolls 1–{max}</span>
                          {cumulativeMode && (
                            <span className="dm-score-breakdown">
                              Previous: {team.cumulativeScore || 0} · This round: {roundTeamTotal(team)}
                            </span>
                          )}
                          <button
                            className="dm-team-roll-button"
                            onClick={() => rollDailyTeam(team.id, false)}
                            disabled={
                              team.players.every(
                                (player) => team.dailyRolls[player.id] != null
                              ) ||
                              team.players.some((player) =>
                                Boolean(rollingDaily[`daily-${team.id}-${player.id}`])
                              )
                            }
                          >
                            {team.players.some((player) =>
                              Boolean(rollingDaily[`daily-${team.id}-${player.id}`])
                            )
                              ? "Rolling Team..."
                              : team.players.every(
                                  (player) => team.dailyRolls[player.id] != null
                                )
                              ? "Team Rolled"
                              : `Roll ${team.name} Team`}
                          </button>
                        </div>
                      </div>
                    </TeamBanner>
                  );
                })}
              </div>
            </>
          )}

          {stage === "dailyTie" && (
            <>
              <h2 className="dm-stage-title dm-danger-title">Last-Place Tie</h2>
              <p className="dm-stage-subtitle">
                Tied teams reroll. The lowest new total enters elimination.
              </p>
              <div className="dm-challenge-list">
                {teams
                  .filter((team) => lowestTeamIds.includes(team.id))
                  .map((team) => {
                    const max = dailyDieMax(team.players.length);
                    return (
                      <TeamBanner key={team.id} team={team} danger>
                        <div className="dm-daily-row">
                          <div className="dm-challenge-player-grid">
                            {team.players.map((player) => {
                              const key = `tie-${team.id}-${player.id}`;
                              return (
                                <PlayerCard
                                  key={player.id}
                                  player={player}
                                  value={team.tieRolls[player.id]}
                                  rolling={Boolean(rollingDaily[key])}
                                  buttonLabel={`Reroll D${max}`}
                                  onRoll={() =>
                                    performDailyRoll(team.id, player.id, true)
                                  }
                                />
                              );
                            })}
                          </div>
                          <div className="dm-score-box" aria-live="polite">
                            <span className="dm-score-label">TIEBREAK TOTAL</span>
                            <span className="dm-score-value">
                              {roundTeamTotal(team, true)}
                            </span>
                            <button
                              className="dm-team-roll-button"
                              onClick={() => rollDailyTeam(team.id, true)}
                              disabled={
                                team.players.every(
                                  (player) => team.tieRolls[player.id] != null
                                ) ||
                                team.players.some((player) =>
                                  Boolean(rollingDaily[`tie-${team.id}-${player.id}`])
                                )
                              }
                            >
                              {team.players.some((player) =>
                                Boolean(rollingDaily[`tie-${team.id}-${player.id}`])
                              )
                                ? "Rolling Team..."
                                : team.players.every(
                                    (player) => team.tieRolls[player.id] != null
                                  )
                                ? "Team Rolled"
                                : `Roll ${team.name} Team`}
                            </button>
                          </div>
                        </div>
                      </TeamBanner>
                    );
                  })}
              </div>
            </>
          )}

          {stage === "elimination" && eliminationTeam && (
            <>
              <h2 className="dm-stage-title dm-danger-title">
                {eliminationTeam.name} Team Elimination
              </h2>
              <p className="dm-stage-subtitle">
                {eliminationTieIds.length
                  ? "The lowest players tied. Only those players reroll a D100."
                  : "Every player rolls a D100. The current lowest roll is highlighted."}
              </p>
              <div className="dm-elim-wrap">
                <TeamBanner team={eliminationTeam} danger>
                  <div className="dm-elim-grid">
                    {eliminationTeam.players.map((player) => {
                      const isInRoll =
                        eliminationTieIds.length === 0 ||
                        eliminationTieIds.includes(player.id);
                      return (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          value={eliminationRolls[player.id]}
                          rolling={Boolean(rollingElimination[player.id])}
                          buttonLabel="Roll D100"
                          onRoll={
                            isInRoll
                              ? () => performEliminationRoll(player.id)
                              : null
                          }
                          eliminated={!isInRoll}
                          currentLowest={currentEliminationLowestIds.includes(
                            player.id
                          )}
                        />
                      );
                    })}
                  </div>
                </TeamBanner>
              </div>
            </>
          )}

          {stage === "eliminationResult" && eliminatedPlayer && (
            <div className="dm-result">
              <h2 className="dm-stage-title dm-danger-title">Eliminated</h2>
              <p className="dm-stage-subtitle">
                {eliminatedPlayer.name} has been removed from Dice Master.
              </p>
              <div className="dm-result-card">
                <PlayerCard player={eliminatedPlayer} eliminated />
              </div>
              <p>
                {activeTeams.length === 1
                  ? "The final surviving team has won the game."
                  : "The remaining teams return for another daily competition."}
              </p>
            </div>
          )}

          {stage === "winner" && winner && (
            <>
              <h2 className="dm-stage-title">
                🏆 {winner.name} Team Wins Dice Master!
              </h2>
              <p className="dm-stage-subtitle">
                They are the last team standing after {round} rounds.
              </p>
              <div className="dm-winner-grid">
                <TeamBanner team={winner} winner>
                  <div className="dm-player-grid">
                    {winner.players.map((player) => (
                      <PlayerCard key={player.id} player={player} />
                    ))}
                  </div>
                </TeamBanner>
              </div>
            </>
          )}

          {history.length > 0 && (
            <div className="dm-history">
              <h3>Elimination Order</h3>
              <div className="dm-history-list">
                {history.map((entry, index) => (
                  <span
                    className="dm-history-chip"
                    key={`${entry.player.id}-${index}`}
                  >
                    {index + 1}. {entry.player.name} — {entry.team}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="dm-actions">
            {stage === "setup" && (
              <>
                <button className="dm-secondary-button" onClick={changeCast}>
                  Change Cast
                </button>
                <button
                  className="dm-secondary-button"
                  onClick={() =>
                    setEnabledColors(TEAM_COLORS.map((color) => color.name))
                  }
                >
                  Enable All
                </button>
                <button
                  className="dm-secondary-button"
                  onClick={() => setEnabledColors([])}
                >
                  Disable All
                </button>
                <button
                  className="dm-main-button"
                  onClick={startGame}
                  disabled={
                    enabledColors.length < requiredTeams ||
                    (teamSetupMode === "custom" && !customTeamsReady)
                  }
                >
                  {teamSetupMode === "custom"
                    ? "Start with Custom Teams"
                    : "Shuffle & Create Teams"}
                </button>
              </>
            )}

            {stage === "daily" && (
              <button
                className="dm-secondary-button"
                onClick={() => rollAllDaily(false)}
                disabled={anyRolling}
              >
                Roll Everyone
              </button>
            )}

            {stage === "dailyTie" && (
              <button
                className="dm-secondary-button"
                onClick={() => rollAllDaily(true)}
                disabled={anyRolling}
              >
                Roll All Tied Teams
              </button>
            )}

            {stage === "elimination" && (
              <button
                className="dm-secondary-button"
                onClick={rollAllElimination}
                disabled={anyRolling}
              >
                Roll Everyone
              </button>
            )}

            {stage !== "winner" && stage !== "setup" && (
              <button
                className="dm-main-button"
                onClick={advance}
                disabled={!canAdvance}
              >
                {stage === "intro"
                  ? "Start Round 1"
                  : stage === "daily"
                  ? "Reveal Last Place"
                  : stage === "dailyTie"
                  ? "Resolve Team Tie"
                  : stage === "elimination"
                  ? "Resolve Elimination"
                  : activeTeams.length === 1
                  ? "Reveal Winner"
                  : "Next Round"}
              </button>
            )}

            {stage !== "setup" && (
              <button className="dm-secondary-button" onClick={returnToMenu}>
                Main Menu
              </button>
            )}
          </div>
        </main>
          </div>
        </div>
      )}
    </>
  );
}