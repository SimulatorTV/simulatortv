// @ts-nocheck

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import EventScreen from "../../../components/survivor/EventScreen";
import BigBrotherReplayScreen from "../../../components/big-brother/BigBrotherReplayScreen";
import BattleOfTheShowsReplayScreen from "../../../components/battle-of-the-shows/BattleOfTheShowsReplayScreen";
import { supabase } from "../../../lib/supabase";

function getPlayersFromEntry(entry: any) {
  if (!entry) return [];

  if (entry.tribes?.length) {
    return entry.tribes.flatMap((tribe) => tribe.members || []);
  }

  if (entry.mergeTribe?.members?.length) {
    return entry.mergeTribe.members;
  }

  if (entry.finalists?.length) {
    return entry.finalists;
  }

  return [];
}

function shufflePlayers(players) {
  const copy = [...players];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function PlayerTile({ player }) {
  const image = player.image || player.img || "";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-3">
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-700 mb-3">
        {image ? (
          <img
            src={image}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>

      <div className="text-center font-black truncate">
        {player.name}
      </div>
    </div>
  );
}

function ColorSwatch({ color }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl border-2 border-white/20 shrink-0"
      style={{
        background: color?.cssHex || color?.hex || "#334155",
        backgroundSize: color?.backgroundSize || undefined,
      }}
      title={color?.name || "Color"}
    />
  );
}

function ordinalLabel(index) {
  const number = index + 1;
  if (number % 100 >= 11 && number % 100 <= 13) return `${number}th eliminated`;
  if (number % 10 === 1) return `${number}st eliminated`;
  if (number % 10 === 2) return `${number}nd eliminated`;
  if (number % 10 === 3) return `${number}rd eliminated`;
  return `${number}th eliminated`;
}


function getPlayerImage(player) {
  return player?.image || player?.img || "";
}

function MiniPlayerCard({ player, label = "" }) {
  if (!player) return null;
  const image = getPlayerImage(player);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-3 text-center">
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-700 mb-2">
        {image ? (
          <img src={image} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
        )}
      </div>
      {label && <div className="text-blue-300 text-xs font-black uppercase tracking-wider mb-1">{label}</div>}
      <div className="font-black text-sm truncate">{player.name}</div>
    </div>
  );
}

function BigBrotherPlayerGrid({ title, players = [], label = "" }) {
  const cleanPlayers = (players || []).filter(Boolean);

  if (cleanPlayers.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
      <h3 className="text-2xl font-black mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {cleanPlayers.map((player, index) => (
          <MiniPlayerCard key={`${player.id || player.name}-${index}`} player={player} label={label} />
        ))}
      </div>
    </div>
  );
}

function BigBrotherVoteList({ round }) {
  const votingPlayers = round?.votingPlayers || [];
  const votingTargets = round?.votingTargets || [];
  const playerPool = [
    ...(round?.castGrid || []),
    ...(round?.finalNomineePlayers || []),
    ...(round?.finalists || []),
  ];

  if (votingPlayers.length === 0 && !(round?.juryVotes || []).length) return null;

  if (round?.type === "final3") {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
        <h3 className="text-2xl font-black mb-4">Jury Votes</h3>
        <div className="space-y-3">
          {(round.juryVotes || []).map((vote, index) => {
            const target = (round.finalists || []).find((p) => p.name === vote.targetName);
            return (
              <div key={`jury-${index}`} className="bg-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="font-black">{vote.juror?.name || "Juror"}</div>
                <div className="text-gray-400">votes for</div>
                <div className="flex items-center gap-3 font-black text-blue-300">
                  {getPlayerImage(target) && <img src={getPlayerImage(target)} alt={target.name} className="w-12 h-12 rounded-xl object-cover" />}
                  {vote.targetName || "Unknown"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">
      <h3 className="text-2xl font-black mb-4">Vote Reveal</h3>
      <div className="space-y-3">
        {votingPlayers.map((voter, index) => {
          const targetName = votingTargets[index];
          const target = playerPool.find((p) => p.name === targetName);
          return (
            <div key={`${voter.name}-${index}`} className="bg-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {getPlayerImage(voter) && <img src={getPlayerImage(voter)} alt={voter.name} className="w-12 h-12 rounded-xl object-cover" />}
                <div className="font-black truncate">{voter.name}</div>
              </div>
              <div className="text-gray-400 shrink-0">votes</div>
              <div className="flex items-center gap-3 font-black text-red-300 min-w-0">
                {getPlayerImage(target) && <img src={getPlayerImage(target)} alt={target.name} className="w-12 h-12 rounded-xl object-cover" />}
                <span className="truncate">{targetName || "No vote"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BigBrotherRoundReplay({ round, rounds, currentIndex, onNext, onRestart }) {
  const progress = `${currentIndex + 1} / ${rounds.length}`;
  const twistLabel = round?.twistId ? String(round.twistId).replaceAll("_", " ") : round?.type?.replaceAll("_", " ");
  const isFinale = round?.type === "final3";

  const evictedPlayers = round?.evictedPlayers || (round?.evictedPlayer ? [round.evictedPlayer] : []);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row justify-between gap-5">
          <div>
            <div className="text-blue-400 font-black uppercase tracking-widest mb-2">Saved Big Brother Replay</div>
            <h1 className="text-5xl font-black mb-2">
              {isFinale ? "Finale" : `Week ${round?.weekNumber || currentIndex + 1}`}
            </h1>
            <p className="text-gray-400 text-lg capitalize">{twistLabel || "Big Brother"}</p>
          </div>

          <div className="flex flex-wrap gap-3 items-start">
            <div className="bg-gray-800 rounded-2xl px-5 py-3 font-black">{progress}</div>
            <button onClick={onRestart} className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-2xl font-black">Back to Cast</button>
            <button onClick={onNext} disabled={currentIndex >= rounds.length - 1} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-5 py-3 rounded-2xl font-black">Next</button>
          </div>
        </div>

        {isFinale ? (
          <>
            <BigBrotherPlayerGrid title="Final 3" players={round.castGrid || []} />
            <div className="grid md:grid-cols-3 gap-4">
              <MiniPlayerCard player={round.part1Winner} label="Part 1 Winner" />
              <MiniPlayerCard player={round.part2Winner} label="Part 2 Winner" />
              <MiniPlayerCard player={round.finalHoh} label="Final HOH" />
            </div>
            <BigBrotherPlayerGrid title="Finalists" players={round.finalists || []} />
            {round.finalEvictedPlayer && <BigBrotherPlayerGrid title="Final Evicted" players={[round.finalEvictedPlayer]} />}
            <BigBrotherVoteList round={round} />
            {round.winner && (
              <div className="bg-yellow-400/15 border border-yellow-300/50 rounded-3xl p-8">
                <div className="text-yellow-300 font-black uppercase tracking-widest mb-2">Winner</div>
                <div className="flex items-center gap-5">
                  {getPlayerImage(round.winner) && <img src={getPlayerImage(round.winner)} alt={round.winner.name} className="w-28 h-28 rounded-3xl object-cover border-2 border-yellow-300" />}
                  <div className="text-5xl font-black">{round.winner.name}</div>
                </div>
              </div>
            )}
          </>
        ) : round?.type === "battle_back" ? (
          <>
            <BigBrotherPlayerGrid title="Current House" players={round.castGrid || []} />
            <BigBrotherPlayerGrid title="Battle Back Competitors" players={round.competitors || []} />
            {round.returnWinner && <BigBrotherPlayerGrid title="Returns to the Game" players={[round.returnWinner]} />}
            <BigBrotherPlayerGrid title="Permanently Eliminated" players={round.permanentlyEliminated || []} />
          </>
        ) : round?.type === "split_house" ? (
          <>
            <BigBrotherPlayerGrid title="Group A" players={round.groupA || []} />
            <BigBrotherPlayerGrid title="Group B" players={round.groupB || []} />
            <div className="grid lg:grid-cols-2 gap-6">
              {round.sideA && (
                <div className="space-y-4 bg-gray-950 border border-gray-800 rounded-3xl p-5">
                  <h3 className="text-3xl font-black">Group A Results</h3>
                  <BigBrotherPlayerGrid title="HOH" players={round.sideA.hohPlayer ? [round.sideA.hohPlayer] : []} />
                  <BigBrotherPlayerGrid title="Nominees" players={round.sideA.nomineePlayers || []} />
                  <BigBrotherPlayerGrid title="Evicted" players={round.sideA.evictedPlayer ? [round.sideA.evictedPlayer] : []} />
                </div>
              )}
              {round.sideB && (
                <div className="space-y-4 bg-gray-950 border border-gray-800 rounded-3xl p-5">
                  <h3 className="text-3xl font-black">Group B Results</h3>
                  <BigBrotherPlayerGrid title="HOH" players={round.sideB.hohPlayer ? [round.sideB.hohPlayer] : []} />
                  <BigBrotherPlayerGrid title="Nominees" players={round.sideB.nomineePlayers || []} />
                  <BigBrotherPlayerGrid title="Evicted" players={round.sideB.evictedPlayer ? [round.sideB.evictedPlayer] : []} />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <BigBrotherPlayerGrid title="Houseguests" players={round?.castGrid || []} />
            {round?.groupA?.length > 0 && <BigBrotherPlayerGrid title="Group A" players={round.groupA} />}
            {round?.groupB?.length > 0 && <BigBrotherPlayerGrid title="Group B" players={round.groupB} />}
            {round?.safeSide?.length > 0 && <BigBrotherPlayerGrid title="Safe Side" players={round.safeSide} />}
            {round?.vulnerableSide?.length > 0 && <BigBrotherPlayerGrid title="Vulnerable Side" players={round.vulnerableSide} />}
            {round?.hohPlayers?.length > 0 ? <BigBrotherPlayerGrid title="Heads of Household" players={round.hohPlayers} /> : <BigBrotherPlayerGrid title="Head of Household" players={round?.hohPlayer ? [round.hohPlayer] : []} />}
            {round?.immunityWinner && <BigBrotherPlayerGrid title="Immunity Winner" players={[round.immunityWinner]} />}
            {round?.executionerWinner && <BigBrotherPlayerGrid title="Executioner" players={[round.executionerWinner]} />}
            {round?.safeOrder?.length > 0 && <BigBrotherPlayerGrid title="Chain of Safety" players={round.safeOrder} />}
            {round?.pairA?.length > 0 && <BigBrotherPlayerGrid title="Battle of the Block Pair A" players={round.pairA} />}
            {round?.pairB?.length > 0 && <BigBrotherPlayerGrid title="Battle of the Block Pair B" players={round.pairB} />}
            {round?.winningPair?.length > 0 && <BigBrotherPlayerGrid title="Winning Pair" players={round.winningPair} />}
            {round?.dethronedHoh && <BigBrotherPlayerGrid title="Dethroned HOH" players={[round.dethronedHoh]} />}
            <BigBrotherPlayerGrid title="Initial Nominees" players={round?.nomineePlayers || []} />
            <BigBrotherPlayerGrid title="Veto Players" players={[round?.hohPlayer, ...(round?.nomineePlayers || []), ...(round?.vetoExtraPlayers || [])].filter(Boolean)} />
            <BigBrotherPlayerGrid title="Veto Winner" players={round?.vetoWinner ? [round.vetoWinner] : []} />
            {round?.vetoUsed && (
              <div className="grid md:grid-cols-2 gap-4">
                <MiniPlayerCard player={round.vetoSavedPlayer} label="Saved by Veto" />
                <MiniPlayerCard player={round.vetoReplacementPlayer} label="Replacement Nominee" />
              </div>
            )}
            <BigBrotherPlayerGrid title="Final Nominees" players={round?.finalNomineePlayers || []} />
            <BigBrotherVoteList round={round} />
            <BigBrotherPlayerGrid title="Evicted" players={evictedPlayers} />
          </>
        )}
      </section>
    </main>
  );
}

function ColorBlitzEliminationList({ season }) {
  const data = season?.data_json || {};
  const eliminated = data.eliminated || [];
  const colors = data.colors || [];
  const winner = data.winner || null;
  const players = data.players || data.preview?.startingCast || [];

  function getColor(colorName) {
    return (
      colors.find((color) => color.name === colorName) || {
        name: colorName || "Unknown Color",
        hex: "#334155",
      }
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8">
      <h2 className="text-4xl font-black mb-6">
        Color Blitz Results
      </h2>

      {winner && (
        <div className="bg-yellow-400/15 border border-yellow-300/50 rounded-3xl p-6 mb-8 flex items-center gap-5">
          {winner.img ? (
            <img
              src={winner.img}
              alt={winner.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-yellow-300"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-yellow-300 text-black flex items-center justify-center text-4xl font-black">
              🏆
            </div>
          )}

          <div>
            <div className="text-yellow-300 font-black uppercase tracking-widest text-sm mb-1">
              Winner
            </div>

            <div className="text-4xl font-black">
              {winner.name}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-black mb-4">
          Starting Cast
        </h3>

        {players.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {players.map((player, index) => (
              <PlayerTile
                key={`${player.name}-${index}`}
                player={player}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">
            No cast data found.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-black mb-4">
          Eliminated Colors In Order
        </h3>

        

        {eliminated.length === 0 ? (
          <p className="text-gray-400">
            No eliminations were saved for this season.
          </p>
        ) : (
          <div className="space-y-3">
            {eliminated.map((entry, index) => {
              const color = getColor(entry.color);
              const player = entry.player || null;
              const playerImage = player?.img || player?.image || "";

              return (
                <div
                  key={`${entry.color}-${index}`}
                  className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-28 shrink-0">
                    <div className={index === 0 ? "text-red-300 font-black text-sm uppercase tracking-wider" : "text-gray-400 font-black text-sm uppercase tracking-wider"}>
                      {ordinalLabel(index)}
                    </div>

                    <div className="text-gray-500 text-xs">
                      Color #{index + 1}
                    </div>
                  </div>

                  <ColorSwatch color={color} />

                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-black truncate">
                      {color.name}
                    </div>

                    <div className="text-gray-400">
                      {player
                        ? `${player.name} was eliminated`
                        : "Nobody was eliminated"}
                    </div>
                  </div>

                  {player ? (
                    <div className="flex items-center gap-3">
                      {playerImage ? (
                        <img
                          src={playerImage}
                          alt={player.name}
                          className="w-20 h-20 rounded-2xl object-cover border border-gray-600"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}

                      <div className="font-black hidden sm:block">
                        {player.name}
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-red-700 flex items-center justify-center text-5xl font-black">
                      ×
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SavedSeasonReplayPage() {
  const params = useParams();
  const seasonId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(null);
  const [profile, setProfile] = useState(null);

  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    loadSeason();
  }, []);

  async function loadSeason() {
    const { data: userData } = await supabase.auth.getUser();

    setCurrentUserId(userData.user?.id || null);

    const { data: seasonData, error } = await supabase
      .from("saved_seasons")
      .select("*")
      .eq("id", seasonId)
      .single();

    if (error || !seasonData) {
      setLoading(false);
      return;
    }

    setSeason(seasonData);
    setIsOwner(userData.user?.id === seasonData.user_id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", seasonData.user_id)
      .single();

    setProfile(profileData || null);

    const { data: likeData } = await supabase
      .from("saved_season_likes")
      .select("*")
      .eq("season_id", seasonId);

    setLikes(likeData || []);

    const { data: commentData } = await supabase
      .from("saved_season_comments")
      .select("*")
      .eq("season_id", seasonId)
      .order("created_at", { ascending: false });

    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map((c) => c.user_id))];

      const { data: commentProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const mergedComments = commentData.map((comment) => ({
        ...comment,
        profile:
          commentProfiles?.find((p) => p.id === comment.user_id) || null,
      }));

      setComments(mergedComments);
    } else {
      setComments([]);
    }

    setLoading(false);
  }

  async function toggleLike() {
    if (!currentUserId) {
      alert("Log in first.");
      return;
    }

    const existingLike = likes.find(
      (like) => like.user_id === currentUserId
    );

    if (existingLike) {
      await supabase
        .from("saved_season_likes")
        .delete()
        .eq("id", existingLike.id);
    } else {
      await supabase.from("saved_season_likes").insert({
        season_id: seasonId,
        user_id: currentUserId,
      });
    }

    loadSeason();
  }

  async function deleteSeason() {
    if (!isOwner) return;

    const confirmDelete = confirm("Delete this saved season?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("saved_seasons")
      .delete()
      .eq("id", seasonId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/profile";
  }

  async function postComment() {
    if (!currentUserId) {
      alert("Log in first.");
      return;
    }

    if (!commentText.trim()) return;

    await supabase.from("saved_season_comments").insert({
      season_id: seasonId,
      user_id: currentUserId,
      comment: commentText.trim(),
    });

    setCommentText("");
    loadSeason();
  }

  const isSurvivor =
    season?.simulator_type?.toLowerCase().includes("survivor");

  const isColorBlitz =
    season?.simulator_type?.toLowerCase().includes("color");

  const isBigBrother =
    season?.simulator_type?.toLowerCase().includes("big-brother") ||
    season?.simulator_type?.toLowerCase().includes("big brother");

  const isBattleOfTheShows =
    season?.simulator_type?.toLowerCase().includes("battle-of-the-shows") ||
    season?.simulator_type?.toLowerCase().includes("battle of the shows");

  const timeline = season?.data_json?.season || [];
  const bigBrotherRounds = season?.data_json?.seasonFlow?.rounds || [];

  const startingPlayers = useMemo(() => {
    if (isBigBrother) {
      return shufflePlayers(
        season?.data_json?.selectedCast ||
          bigBrotherRounds[0]?.castGrid ||
          []
      );
    }

    if (isBattleOfTheShows) {
      const startingTeams = season?.data_json?.startingTeams || season?.data_json?.history?.[0]?.teams || [];
      return shufflePlayers(startingTeams.flatMap((team) => team.players || []));
    }

    const firstEntry = timeline[0];
    return shufflePlayers(getPlayersFromEntry(firstEntry));
  }, [season, timeline, isBigBrother, isBattleOfTheShows, bigBrotherRounds]);

  const alreadyLiked = likes.some((like) => like.user_id === currentUserId);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-2xl font-bold">Loading season...</div>
      </main>
    );
  }

  if (!season) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-2xl font-bold">Season not found.</div>
      </main>
    );
  }

  if (started && isSurvivor) {
    return (
      <EventScreen
        entry={timeline[stepIndex]}
        season={timeline}
        currentIndex={stepIndex}
        headerLabel="Saved Survivor replay"
        restartLabel="Back to Cast"
        onRestart={() => {
          setStarted(false);
          setStepIndex(0);
        }}
        onNext={() =>
          setStepIndex((current) =>
            Math.min(timeline.length - 1, current + 1)
          )
        }
      />
    );
  }

  if (started && isBigBrother) {
    return (
      <BigBrotherReplayScreen
        seasonFlow={season?.data_json?.seasonFlow}
        headerLabel="Saved Big Brother replay"
        onExit={() => {
          setStarted(false);
          setStepIndex(0);
        }}
      />
    );
  }

  if (started && isBattleOfTheShows) {
    return (
      <BattleOfTheShowsReplayScreen
        history={season?.data_json?.history || []}
        winner={season?.data_json?.winner}
        onExit={() => {
          setStarted(false);
          setStepIndex(0);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
            <div>
              <div className="text-blue-400 font-bold uppercase tracking-widest mb-2">
                Saved {season.simulator_type} Season
              </div>

              <h1 className="text-5xl font-black mb-4">
                {season.title}
              </h1>

              <p className="text-gray-400 text-lg">
                {season.summary ||
                  "Replay this saved season exactly how it happened."}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={toggleLike}
                className={
                  alreadyLiked
                    ? "bg-pink-600 hover:bg-pink-500 px-6 py-3 rounded-xl font-bold h-fit"
                    : "bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold h-fit"
                }
              >
                ♥ {likes.length} Likes
              </button>

              {isOwner && (
                <button
                  onClick={deleteSeason}
                  className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold h-fit"
                >
                  Delete Season
                </button>
              )}
            </div>
          </div>

          {profile && (
            <Link
              href={`/users/${profile.id}`}
              className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 rounded-2xl p-4"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-700">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div>
                <div className="font-black text-xl">
                  {profile.username || "Unnamed User"}
                </div>

                <div className="text-gray-400">Season creator</div>
              </div>
            </Link>
          )}
        </div>

        {isColorBlitz ? (
          <ColorBlitzEliminationList season={season} />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8">
            <h2 className="text-4xl font-black mb-6">
              Starting Cast
            </h2>

            {startingPlayers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {startingPlayers.map((player, index) => (
                  <PlayerTile
                    key={`${player.id || player.name}-${index}`}
                    player={player}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 mb-8">
                No cast data found for this saved season.
              </p>
            )}

            <button
              onClick={() => {
                setStarted(true);
                setStepIndex(0);
              }}
              disabled={
                isBigBrother
                  ? !bigBrotherRounds.length
                  : isBattleOfTheShows
                    ? !(season?.data_json?.history?.length)
                    : !timeline.length
              }
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-8 py-4 rounded-2xl font-black text-lg"
            >
              Start Replay
            </button>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-3xl font-black mb-6">Comments</h2>

          {season.allow_comments && (
            <div className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 resize-none mb-4"
              />

              <button
                onClick={postComment}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
              >
                Post Comment
              </button>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-800 rounded-2xl p-4"
                >
                  <Link
                    href={`/users/${comment.user_id}`}
                    className="font-black hover:text-blue-400"
                  >
                    {comment.profile?.username || "Unnamed User"}
                  </Link>

                  <p className="text-gray-300 mt-2 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
