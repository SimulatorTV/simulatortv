"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

export default function PublicUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendship, setFriendship] = useState<any>(null);
  const [savedSeasons, setSavedSeasons] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const loggedInId = userData.user?.id || null;

    setCurrentUserId(loggedInId);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data);

    const { data: publicSeasons } = await supabase
      .from("saved_seasons")
      .select("*")
      .eq("user_id", userId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    setSavedSeasons(publicSeasons || []);

    if (loggedInId && loggedInId !== userId) {
      const { data: friendshipData } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(requester_id.eq.${loggedInId},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${loggedInId})`
        )
        .maybeSingle();

      setFriendship(friendshipData || null);
    }

    setLoading(false);
  }

  async function sendFriendRequest() {
    if (!currentUserId) {
      alert("Log in first.");
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUserId,
      receiver_id: userId,
      status: "pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    loadProfile();
  }

  async function acceptFriendRequest() {
    if (!friendship) return;

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendship.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadProfile();
  }

  async function removeFriendship() {
    if (!friendship) return;

    const confirmRemove = confirm("Remove this friendship/request?");
    if (!confirmRemove) return;

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendship.id);

    if (error) {
      alert(error.message);
      return;
    }

    setFriendship(null);
  }

  function friendshipButton() {
    if (!currentUserId || currentUserId === userId) return null;

    if (!friendship) {
      return (
        <button
          onClick={sendFriendRequest}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
        >
          Add Friend
        </button>
      );
    }

    if (friendship.status === "accepted") {
      return (
        <button
          onClick={removeFriendship}
          className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold"
        >
          Friends
        </button>
      );
    }

    if (
      friendship.status === "pending" &&
      friendship.receiver_id === currentUserId
    ) {
      return (
        <div className="flex gap-3">
          <button
            onClick={acceptFriendRequest}
            className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold"
          >
            Accept Friend
          </button>

          <button
            onClick={removeFriendship}
            className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold"
          >
            Decline
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={removeFriendship}
        className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold"
      >
        Request Sent
      </button>
    );
  }

  function getSeasonWinner(season: any) {
    return (
      season?.data_json?.winner?.name ||
      season?.data_json?.winnerName ||
      "Unknown Winner"
    );
  }

  function getSeasonCastPreview(season: any) {
    const firstEntry = season?.data_json?.season?.[0];

    if (!firstEntry?.tribes?.length) return [];

    return firstEntry.tribes
      .flatMap((tribe: any) => tribe.members || [])
      .filter((player: any) => player?.image)
      .slice(0, 6);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-2xl font-bold">Loading profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-2xl font-bold">Profile not found.</div>
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
                {profile.username || "Unnamed User"}
              </h1>

              <p className="text-gray-400 mt-2">
                SimulatorTV Profile
              </p>
            </div>

            {friendshipButton()}
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-48 h-48 rounded-3xl overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || "Profile avatar"}
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
                {profile.bio || "No bio yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">Friends</h2>

            <p className="text-gray-400">
              Friends list coming soon.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">
              Public Saved Seasons
            </h2>

            {savedSeasons.length === 0 ? (
              <p className="text-gray-400">
                No public saved seasons yet.
              </p>
            ) : (
              <div className="space-y-4">
                {savedSeasons.map((savedSeason) => {
                  const preview = getSeasonCastPreview(savedSeason);

                  return (
                    <Link
                      key={savedSeason.id}
                      href={`/seasons/${savedSeason.id}`}
                      className="block bg-gray-800 hover:bg-gray-700 rounded-2xl p-4 border border-gray-700"
                    >
                      <div className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">
                        {savedSeason.simulator_type}
                      </div>

                      <h3 className="text-2xl font-black mb-2">
                        {savedSeason.title}
                      </h3>

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
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
                                src={player.image}
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
        </div>
      </section>
    </main>
  );
}
