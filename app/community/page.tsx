"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabase";

export default function CommunityPage() {
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<any[]>([]);

  useEffect(() => {
    loadCommunityFeed();
  }, []);

  async function loadCommunityFeed() {
    const { data: seasonData } = await supabase
      .from("saved_seasons")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (!seasonData || seasonData.length === 0) {
      setSeasons([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(seasonData.map((s) => s.user_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    const merged = seasonData.map((season) => ({
      ...season,
      creator:
        profiles?.find((p) => p.id === season.user_id) || null,
    }));

    setSeasons(merged);
    setLoading(false);
  }

  function getWinner(season: any): string {
    return (
      season?.data_json?.winner?.name ||
      season?.data_json?.winnerName ||
      "Unknown Winner"
    );
  }

  function getPreviewPlayers(season: any): any[] {
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

        <div className="p-8 text-3xl font-black">
          Loading Community...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto p-8">
        <div className="mb-10">
          <h1 className="text-6xl font-black mb-4">
            Community Seasons
          </h1>

          <p className="text-gray-400 text-xl">
            Browse public simulator seasons from the community.
          </p>
        </div>

        {seasons.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-gray-400">
            No public seasons yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {seasons.map((season) => {
              const previewPlayers = getPreviewPlayers(season);

              return (
                <Link
                  key={season.id}
                  href={`/seasons/${season.id}`}
                  className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-3xl p-6 transition-all"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-700">
                      {season.creator?.avatar_url ? (
                        <img
                          src={season.creator.avatar_url}
                          alt={season.creator.username || "Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div>
                      <div className="font-black text-lg">
                        {season.creator?.username ||
                          "Unnamed User"}
                      </div>

                      <div className="text-gray-400 text-sm">
                        {season.simulator_type}
                      </div>
                    </div>
                  </div>

                  <h2 className="text-3xl font-black mb-3 leading-tight">
                    {season.title}
                  </h2>

                  <p className="text-gray-400 mb-4 line-clamp-3">
                    {season.summary ||
                      "Replay this saved simulator season."}
                  </p>

                  

                  {previewPlayers.length > 0 && (
                    <div className="flex -space-x-3 mb-5">
                      {previewPlayers.map(
                        (player: any, index: number) => (
                          <div
                            key={`${player.id || player.name}-${index}`}
                            className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-gray-900 bg-gray-700"
                          >
                            <img
                              src={player.image}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="text-blue-400 font-black">
                    View Replay →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}