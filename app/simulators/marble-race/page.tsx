// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import MarbleRace from "../../../components/marble-race/MarbleRace";
import { supabase } from "../../../lib/supabase";

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

const COLOR_BALLS = [
  { name: "Salmon", hex: "#FA8072" },
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FDE047" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Green", hex: "#22C55E" },
  { name: "Dark Green", hex: "#166534" },
  { name: "Cyan", hex: "#22D3EE" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Navy", hex: "#172554" },
  { name: "Lavender", hex: "#C4B5FD" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Pink", hex: "#F472B6" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Brown", hex: "#92400E" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gray", hex: "#6B7280" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#111111" },
  { name: "Rainbow", hex: "rainbow" },
] as const;

function colorBallId(name: string) {
  return `color-ball-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

function colorBallBackground(person: any) {
  return person.rainbow
    ? "conic-gradient(#ef4444, #f97316, #fde047, #22c55e, #22d3ee, #3b82f6, #a855f7, #ef4444)"
    : person.marbleColor || "#dbeafe";
}

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
}: any) {
  const official = casts.filter((cast: CastRecord) => cast.is_official);
  const custom = casts.filter((cast: CastRecord) => !cast.is_official);

  useEffect(() => {
    if (!castId && casts[0]?.id) onChooseCast(casts[0].id);
  }, [castId, casts, onChooseCast]);

  function CastList({ items, title }: any) {
    if (!items.length) return null;

    return (
      <div className="mrCastGroup">
        <h4>{title}</h4>
        {items.map((cast: CastRecord) => (
          <button
            key={cast.id}
            type="button"
            className={castId === cast.id ? "mrCastChoice active" : "mrCastChoice"}
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
    <div className="mrModalBackdrop">
      <div className="mrModal">
        <div className="mrModalHeader">
          <div>
            <h2>Add Cast Members</h2>
            <p>Choose contestants from your casts.</p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mrModalBody">
          <div className="mrCastSidebar">
            {loadingCasts ? (
              <p>Loading casts...</p>
            ) : (
              <>
                <CastList items={official} title="Favorite Official Casts" />
                <CastList items={custom} title="Custom Casts" />
              </>
            )}
          </div>

          <div className="mrContestantPane">
            <div className="mrModalActions">
              <b>{selectedIds.size} selected</b>
              <button type="button" onClick={onSelectAll}>
                Select All
              </button>
              <button type="button" onClick={onSelectNone}>
                Select None
              </button>
              <button type="button" onClick={onAdd} disabled={!selectedIds.size}>
                Add Selected
              </button>
            </div>

            {loadingContestants ? (
              <p>Loading contestants...</p>
            ) : (
              <div className="mrModalContestantGrid">
                {contestants.map((person: ContestantRecord) => (
                  <button
                    key={person.id}
                    type="button"
                    className={selectedIds.has(person.id) ? "mrModalPerson active" : "mrModalPerson"}
                    onClick={() => onToggle(person.id)}
                  >
                    {person.image_url ? (
                      <img src={person.image_url} alt={person.name} />
                    ) : (
                      <div className="mrNoImage">No Image</div>
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

function AddColorBallsModal({
  selectedNames,
  onToggle,
  onSelectAll,
  onSelectNone,
  onAdd,
  onClose,
}: any) {
  return (
    <div className="mrModalBackdrop">
      <div className="mrColorModal">
        <div className="mrModalHeader">
          <div>
            <h2>Add Color Marbles</h2>
            <p>Each selected color becomes its own contestant.</p>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="mrColorModalBody">
          <div className="mrModalActions">
            <b>{selectedNames.size} selected</b>
            <button type="button" onClick={onSelectAll}>Select All</button>
            <button type="button" onClick={onSelectNone}>Select None</button>
            <button type="button" onClick={onAdd} disabled={!selectedNames.size}>
              Add Selected
            </button>
          </div>

          <div className="mrColorGrid">
            {COLOR_BALLS.map((color) => {
              const selected = selectedNames.has(color.name);
              const background =
                color.hex === "rainbow"
                  ? "conic-gradient(#ef4444, #f97316, #fde047, #22c55e, #22d3ee, #3b82f6, #a855f7, #ef4444)"
                  : color.hex;

              return (
                <button
                  key={color.name}
                  type="button"
                  className={selected ? "mrColorChoice active" : "mrColorChoice"}
                  onClick={() => onToggle(color.name)}
                >
                  <span className="mrColorBall" style={{ background }} />
                  <b>{color.name}</b>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarbleRacePage() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState<CastRecord[]>([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [showColorBallsModal, setShowColorBallsModal] = useState(false);
  const [modalSelectedColorNames, setModalSelectedColorNames] = useState<Set<string>>(
    () => new Set(),
  );
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState<ContestantRecord[]>([]);
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [raceContestants, setRaceContestants] = useState<any[]>([]);
  const [raceKey, setRaceKey] = useState(0);

  const selectedRoster = roster.filter((person) => selectedIds.has(person.id));

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

    const favoriteIds = (favoriteData || []).map((favorite: any) => favorite.cast_id);

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

    let officialCasts: CastRecord[] = [];

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

  async function loadContestantsForModal(castId: string) {
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

  async function loadFullCustomCastContestants(castId: string) {
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

      const ids = [...new Set(rows.map((row: any) => row.contestant_id).filter(Boolean))];

      if (!ids.length) continue;

      const { data: people, error: peopleError } = await supabase
        .from("contestants")
        .select("id,name,image_url,cast_id")
        .in("id", ids);

      if (!peopleError && people?.length) {
        const byId = new Map(people.map((person: any) => [person.id, person]));
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
      imageUrl: person.image_url || "",
    }));

    setRoster((current) => {
      const existing = new Set(current.map((person) => person.id));
      const fresh = additions.filter((person) => !existing.has(person.id));

      setSelectedIds((currentSelected) => {
        const next = new Set(currentSelected);
        fresh.forEach((person) => next.add(person.id));
        return next;
      });

      return [...current, ...fresh];
    });

    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function addSelectedColorBallsToRoster() {
    const additions = COLOR_BALLS.filter((color) =>
      modalSelectedColorNames.has(color.name),
    ).map((color) => ({
      id: colorBallId(color.name),
      sourceId: colorBallId(color.name),
      name: color.name,
      imageUrl: "",
      marbleColor: color.hex === "rainbow" ? undefined : color.hex,
      rainbow: color.hex === "rainbow",
      isColorBall: true,
    }));

    setRoster((current) => {
      const existing = new Set(current.map((person) => person.id));
      const fresh = additions.filter((person) => !existing.has(person.id));

      setSelectedIds((currentSelected) => {
        const next = new Set(currentSelected);
        additions.forEach((person) => next.add(person.id));
        return next;
      });

      return [...current, ...fresh];
    });

    setShowColorBallsModal(false);
    setModalSelectedColorNames(new Set());
  }

  function removeRosterPlayer(id: string) {
    setRoster((current) => current.filter((person) => person.id !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }

  function toggleRosterPlayer(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startRace() {
    if (selectedRoster.length < 2) {
      alert("Select at least 2 marbles.");
      return;
    }

    setRaceContestants(
      selectedRoster.map((person) => ({
        id: person.id,
        name: person.name,
        imageUrl: person.imageUrl,
        marbleColor: person.marbleColor,
        rainbow: person.rainbow,
      }))
    );
    setRaceKey((value) => value + 1);
  }

  function returnToSetup() {
    setRaceContestants([]);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {showColorBallsModal && (
        <AddColorBallsModal
          selectedNames={modalSelectedColorNames}
          onClose={() => setShowColorBallsModal(false)}
          onToggle={(name: string) =>
            setModalSelectedColorNames((current) => {
              const next = new Set(current);
              next.has(name) ? next.delete(name) : next.add(name);
              return next;
            })
          }
          onSelectAll={() =>
            setModalSelectedColorNames(
              new Set(COLOR_BALLS.map((color) => color.name)),
            )
          }
          onSelectNone={() => setModalSelectedColorNames(new Set())}
          onAdd={addSelectedColorBallsToRoster}
        />
      )}

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
          onToggle={(id: string) =>
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
        .mrSetup {
          max-width: 1220px;
          margin: 0 auto;
          padding: 26px 18px 40px;
        }
        .mrSetupHeader {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:16px;
          flex-wrap:wrap;
          margin-bottom:18px;
        }
        .mrSetupHeader h1 {
          margin:0;
          color:#f59e0b;
          font-size:clamp(2.2rem,5vw,4.6rem);
          font-weight:1000;
        }
        .mrSetupHeader p { color:#a1a1aa; margin:6px 0 0; }
        .mrButtons { display:flex; gap:10px; flex-wrap:wrap; }
        .mrButtons button,.mrButtons a,.mrStartButton,.mrBackButton {
          border:0;
          border-radius:12px;
          padding:12px 17px;
          background:#27272a;
          color:white;
          font-weight:900;
          text-decoration:none;
          cursor:pointer;
        }
        .mrButtons button:hover,.mrButtons a:hover,.mrBackButton:hover { background:#3f3f46; }
        .mrStartButton {
          display:block;
          margin:20px auto 0;
          background:#f59e0b;
          color:#111827;
          font-size:1.15rem;
          padding:14px 25px;
        }
        .mrStartButton:disabled { opacity:.4; cursor:not-allowed; }
        .mrRoster {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
          gap:12px;
        }
        .mrRosterCard {
          position:relative;
          overflow:hidden;
          border:3px solid #f59e0b;
          border-radius:14px;
          background:white;
          color:#111;
          cursor:pointer;
        }
        .mrRosterCard.off { opacity:.35; filter:grayscale(1); border-color:#52525b; }
        .mrRosterCard img {
          display:block;
          width:100%;
          aspect-ratio:1;
          object-fit:cover;
        }
        .mrRosterCard span {
          display:block;
          padding:8px 5px;
          text-align:center;
          font-weight:900;
        }
        .mrRemove {
          position:absolute;
          top:5px;
          right:5px;
          width:27px;
          height:27px;
          border:0;
          border-radius:999px;
          background:#ef4444;
          color:white;
          font-weight:1000;
          cursor:pointer;
          z-index:2;
        }
        .mrEmpty {
          padding:34px;
          border:2px dashed #3f3f46;
          border-radius:16px;
          color:#a1a1aa;
          text-align:center;
          font-weight:900;
        }
        .mrRacePage {
          max-width:1240px;
          margin:0 auto;
          padding:20px 18px 40px;
        }
        .mrBackButton { margin-bottom:14px; }
        .mrModalBackdrop {
          position:fixed;
          inset:0;
          z-index:9999;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:14px;
          background:rgba(0,0,0,.86);
        }
        .mrColorModal {
          width:min(920px,100%);
          max-height:90vh;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          border:1px solid #3f3f46;
          border-radius:20px;
          background:#09090b;
        }
        .mrColorModalBody {
          min-height:0;
          overflow-y:auto;
          padding:16px;
        }
        .mrColorGrid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
          gap:10px;
        }
        .mrColorChoice {
          display:flex;
          align-items:center;
          gap:10px;
          padding:11px;
          border:3px solid #3f3f46;
          border-radius:13px;
          background:#18181b;
          color:white;
          cursor:pointer;
          opacity:.45;
        }
        .mrColorChoice.active {
          border-color:#f59e0b;
          background:#3f2b08;
          opacity:1;
        }
        .mrColorBall,.mrRosterColorBall {
          display:block;
          border:3px solid #111827;
          border-radius:999px;
        }
        .mrColorBall {
          width:42px;
          height:42px;
          flex:0 0 42px;
        }
        .mrRosterColorWrap {
          display:grid;
          place-items:center;
          width:100%;
          aspect-ratio:1;
          background:#e5e7eb;
        }
        .mrRosterColorBall {
          width:72%;
          aspect-ratio:1;
          box-shadow:inset -10px -12px 18px rgba(0,0,0,.22);
        }
        .mrModal {
          width:min(1100px,100%);
          height:90vh;
          display:flex;
          flex-direction:column;
          overflow:hidden;
          border:1px solid #3f3f46;
          border-radius:20px;
          background:#09090b;
        }
        .mrModalHeader {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:16px;
          border-bottom:1px solid #27272a;
        }
        .mrModalHeader h2,.mrModalHeader p { margin:0; }
        .mrModalHeader button,.mrModalActions button {
          border:0;
          border-radius:10px;
          padding:10px 14px;
          background:#f59e0b;
          color:#111827;
          font-weight:900;
          cursor:pointer;
        }
        .mrModalBody {
          display:grid;
          grid-template-columns:310px minmax(0,1fr);
          flex:1;
          min-height:0;
          overflow:hidden;
        }
        .mrCastSidebar,.mrContestantPane {
          min-height:0;
          overflow-y:auto;
          padding:14px;
          overscroll-behavior:contain;
        }
        .mrCastSidebar { border-right:1px solid #27272a; }
        .mrCastGroup h4 { color:#a1a1aa; }
        .mrCastChoice {
          display:block;
          width:100%;
          margin:5px 0;
          padding:11px;
          border:0;
          border-radius:11px;
          background:#18181b;
          color:white;
          text-align:left;
          cursor:pointer;
        }
        .mrCastChoice.active { background:#f59e0b; color:#111827; }
        .mrCastChoice small { display:block; margin-top:3px; opacity:.7; }
        .mrModalActions {
          display:flex;
          align-items:center;
          gap:8px;
          flex-wrap:wrap;
          margin-bottom:12px;
        }
        .mrModalActions button:disabled { opacity:.4; cursor:not-allowed; }
        .mrModalContestantGrid {
          display:grid;
          grid-template-columns:repeat(6,minmax(0,1fr));
          gap:9px;
        }
        .mrModalPerson {
          overflow:hidden;
          padding:0;
          border:2px solid transparent;
          border-radius:11px;
          background:#18181b;
          color:white;
          cursor:pointer;
        }
        .mrModalPerson:not(.active) { opacity:.38; filter:grayscale(1); }
        .mrModalPerson.active { border-color:#fbbf24; }
        .mrModalPerson img,.mrNoImage {
          width:100%;
          aspect-ratio:1;
          object-fit:cover;
        }
        .mrModalPerson span { display:block; padding:6px 3px; font-size:12px; }
        @media(max-width:700px) {
          .mrModalBody {
            grid-template-columns:1fr;
            grid-template-rows:220px minmax(0,1fr);
          }
          .mrCastSidebar {
            border-right:0;
            border-bottom:1px solid #27272a;
          }
          .mrModalContestantGrid { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .mrRoster { grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
      `}</style>

      {!raceContestants.length ? (
        <section className="mrSetup">
          <div className="mrSetupHeader">
            <div>
              <h1>Marble Race</h1>
              <p>Add contestants, then release them through a new Matter.js course every round.</p>
            </div>

            <div className="mrButtons">
              <button type="button" onClick={openAddCastModal}>
                Add Cast Members
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalSelectedColorNames(new Set());
                  setShowColorBallsModal(true);
                }}
              >
                Add Color Marbles
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(roster.map((person) => person.id)))}
              >
                Select All
              </button>
              <button type="button" onClick={() => setSelectedIds(new Set())}>
                Select None
              </button>
              <Link href="/custom-casts">Manage Casts</Link>
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="mrEmpty">No cast members or color marbles added yet.</div>
          ) : (
            <div className="mrRoster">
              {roster.map((person) => (
                <div
                  key={person.id}
                  className={selectedIds.has(person.id) ? "mrRosterCard" : "mrRosterCard off"}
                  onClick={() => toggleRosterPlayer(person.id)}
                >
                  <button
                    type="button"
                    className="mrRemove"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeRosterPlayer(person.id);
                    }}
                  >
                    ×
                  </button>
                  {person.imageUrl ? (
                    <img src={person.imageUrl} alt={person.name} />
                  ) : (
                    <div className="mrRosterColorWrap">
                      <span
                        className="mrRosterColorBall"
                        style={{ background: colorBallBackground(person) }}
                        aria-label={`${person.name} marble`}
                      />
                    </div>
                  )}
                  <span>{person.name}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="mrStartButton"
            disabled={selectedRoster.length < 2}
            onClick={startRace}
          >
            Load Marble Race ({selectedRoster.length})
          </button>
        </section>
      ) : (
        <section className="mrRacePage">
          <button type="button" className="mrBackButton" onClick={returnToSetup}>
            ← Back to Cast Setup
          </button>

          <MarbleRace
            key={raceKey}
            contestants={raceContestants}
          />
        </section>
      )}
    </main>
  );
}