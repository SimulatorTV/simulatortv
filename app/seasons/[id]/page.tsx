"use client";

// @ts-nocheck

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import EventScreen from "../../../components/survivor/EventScreen";
import { supabase } from "../../../lib/supabase";

function getPlayersFromEntry(entry) {
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

  const timeline = season?.data_json?.season || [];

  const startingPlayers = useMemo(() => {
    const firstEntry = timeline[0];
    return shufflePlayers(getPlayersFromEntry(firstEntry));
  }, [season, timeline]);

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
              disabled={!timeline.length}
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
