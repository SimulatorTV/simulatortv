"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";


function getAnyPlayerImage(player: any) {
  return player?.image || player?.img || player?.image_url || "";
}

function uniquePreviewPlayers(players: any[]) {
  const seen = new Set();

  return (players || [])
    .filter(Boolean)
    .filter((player: any) => getAnyPlayerImage(player))
    .filter((player: any) => {
      const key = player.id || player.name || getAnyPlayerImage(player);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

function getUniversalSeasonPreviewPlayers(season: any) {
  const data = season?.data_json || {};

  const pools = [
    data.selectedCast,
    data.startingCast,
    data.players,
    data.preview?.startingCast,
    data.seasonFlow?.rounds?.[0]?.castGrid,
    data.season?.[0]?.tribes?.flatMap((tribe: any) => tribe.members || []),
    data.season?.[0]?.mergeTribe?.members,
    data.startingTeams?.flatMap((team: any) => team.players || []),
    data.finalTeams?.flatMap((team: any) => team.players || []),
    data.history?.[0]?.teams?.flatMap((team: any) => team.players || []),
    data.history?.find((entry: any) => entry?.players?.length)?.players,
    data.history?.find((entry: any) => entry?.teams?.length)?.teams?.flatMap((team: any) => team.players || []),
  ];

  for (const pool of pools) {
    const preview = uniquePreviewPlayers(pool || []);
    if (preview.length > 0) return preview;
  }

  return [];
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [savedSeasons, setSavedSeasons] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const currentUserId = userData.user.id;
    setUserId(currentUserId);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single();

    setProfile(data || null);

    const { data: seasonsData } = await supabase
      .from("saved_seasons")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    setSavedSeasons(seasonsData || []);

    const { data: incomingRequests } = await supabase
      .from("friendships")
      .select("*")
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    const requestUserIds = (incomingRequests || []).map(
      (request) => request.requester_id
    );

    let requestProfiles: any[] = [];

    if (requestUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", requestUserIds);

      requestProfiles = profilesData || [];
    }

    const mergedRequests = (incomingRequests || []).map((request) => ({
      ...request,
      requesterProfile:
        requestProfiles.find((person) => person.id === request.requester_id) ||
        null,
    }));

    setFriendRequests(mergedRequests);

    const { data: acceptedFriendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    const friendIds = (acceptedFriendships || []).map((friendship) =>
      friendship.requester_id === currentUserId
        ? friendship.receiver_id
        : friendship.requester_id
    );

    let friendProfiles: any[] = [];

    if (friendIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", friendIds);

      friendProfiles = profilesData || [];
    }

    setFriends(friendProfiles);
    setLoading(false);
  }

  async function acceptFriendRequest(friendshipId: string) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (error) {
      alert(error.message);
      return;
    }

    loadProfile();
  }

  async function declineFriendRequest(friendshipId: string) {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      alert(error.message);
      return;
    }

    loadProfile();
  }

  function getSeasonWinner(season: any) {
    return (
      season?.data_json?.winner?.name ||
      season?.data_json?.winnerName ||
      "Unknown Winner"
    );
  }

  function getSeasonCastPreview(season: any) {
    return getUniversalSeasonPreviewPlayers(season);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-2xl font-bold">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-6xl mx-auto p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8">
          <div className="flex justify-between items-start gap-6 mb-8">
            <div>
              <h1 className="text-5xl font-black">
                {profile?.username || "Unnamed User"}
              </h1>

              <p className="text-gray-400 mt-2">Your SimulatorTV dashboard</p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/users/${userId}`}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold"
              >
                View Public Profile
              </Link>

              <Link
                href="/profile/edit"
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 h-48 rounded-3xl overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
                  No Avatar
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black mb-3">Bio</h2>

              <p className="text-gray-300 whitespace-pre-wrap text-lg">
                {profile?.bio || "No bio yet."}
              </p>
            </div>
          </div>
        </div>

        {friendRequests.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-8">
            <h2 className="text-3xl font-black mb-4">Friend Requests</h2>

            <div className="space-y-3">
              {friendRequests.map((request) => {
                const requester = request.requesterProfile;

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-4 bg-gray-800 rounded-2xl p-4"
                  >
                    <Link
                      href={`/users/${request.requester_id}`}
                      className="flex items-center gap-4"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-700">
                        {requester?.avatar_url ? (
                          <img
                            src={requester.avatar_url}
                            alt={requester.username || "Avatar"}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div>
                        <div className="font-black text-lg">
                          {requester?.username || "Unnamed User"}
                        </div>

                        <div className="text-gray-400 text-sm">
                          wants to be friends
                        </div>
                      </div>
                    </Link>

                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptFriendRequest(request.id)}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl font-bold"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => declineFriendRequest(request.id)}
                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">Friends</h2>

            {friends.length === 0 ? (
              <p className="text-gray-400">No friends yet.</p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    href={`/users/${friend.id}`}
                    className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-2xl p-3"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-700">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.username || "Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="font-bold">
                      {friend.username || "Unnamed User"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:col-span-2">
            <h2 className="text-3xl font-black mb-4">Saved Seasons</h2>

            {savedSeasons.length === 0 ? (
              <p className="text-gray-400">No saved seasons yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {savedSeasons.map((savedSeason) => {
                  const preview = getSeasonCastPreview(savedSeason);

                  return (
                    <Link
                      key={savedSeason.id}
                      href={`/seasons/${savedSeason.id}`}
                      className="block bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 border border-gray-700"
                    >
                      <div className="flex justify-between gap-3 mb-3">
                        <div>
                          <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">
                            {savedSeason.simulator_type}
                          </div>

                          <h3 className="text-xl font-black leading-tight">
                            {savedSeason.title}
                          </h3>
                        </div>

                        <div
                          className={
                            savedSeason.is_public
                              ? "text-xs bg-green-600 h-fit px-2 py-1 rounded-lg font-bold"
                              : "text-xs bg-gray-600 h-fit px-2 py-1 rounded-lg font-bold"
                          }
                        >
                          {savedSeason.is_public ? "Public" : "Private"}
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {savedSeason.summary || "No summary."}
                      </p>

                      <div className="text-yellow-400 font-black mb-4">
                        Winner: {getSeasonWinner(savedSeason)}
                      </div>

                      {preview.length > 0 && (
                        <div className="flex -space-x-3">
                          {preview.map((player: any, index: number) => (
                            <div
                              key={`${player.id || player.name}-${index}`}
                              className="w-12 h-12 rounded-xl overflow-hidden border-2 border-gray-900 bg-gray-700"
                            >
                              <img
                                src={getAnyPlayerImage(player)}
                                alt={player.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-2">My Casts</h2>

            <Link
              href="/custom-casts"
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              Manage Custom Casts
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h2 className="text-3xl font-black mb-4">Account Tools</h2>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/official-casts"
              className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl font-bold"
            >
              Favorite Official Casts
            </Link>

            <Link
              href="/simulators"
              className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl font-bold"
            >
              Open Simulators
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
