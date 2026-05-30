"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

type OfficialCast = {
  id: string;
  name: string;
  show_name: string | null;
};

type Contestant = {
  id: string;
  cast_id: string;
  name: string;
  image_url: string | null;
};

type FavoriteCast = {
  cast_id: string;
};

export default function OfficialCastsPage() {
  const [casts, setCasts] = useState<OfficialCast[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    const { data: userData } = await supabase.auth.getUser();
    setUserId(userData.user?.id || null);

    const { data: castData, error: castError } = await supabase
      .from("casts")
      .select("id, name, show_name")
      .eq("is_official", true);

    if (castError) {
      alert(castError.message);
      return;
    }

    setCasts(castData || []);

    const officialCastIds = (castData || []).map((cast) => cast.id);

    if (officialCastIds.length > 0) {
      const { data: contestantData } = await supabase
        .from("contestants")
        .select("id, cast_id, name, image_url")
        .in("cast_id", officialCastIds);

      setContestants(contestantData || []);
    }

    const { data: favoriteData } = await supabase
      .from("favorite_casts")
      .select("cast_id");

    const counts: Record<string, number> = {};

    (favoriteData || []).forEach((fav: FavoriteCast) => {
      counts[fav.cast_id] = (counts[fav.cast_id] || 0) + 1;
    });

    setFavoriteCounts(counts);

    if (userData.user) {
      const { data: userFavorites } = await supabase
        .from("favorite_casts")
        .select("cast_id")
        .eq("user_id", userData.user.id);

      setFavoriteIds(new Set((userFavorites || []).map((fav) => fav.cast_id)));
    }
  }

  async function toggleFavorite(castId: string) {
    if (!userId) {
      alert("Log in first.");
      return;
    }

    if (favoriteIds.has(castId)) {
      const { error } = await supabase
        .from("favorite_casts")
        .delete()
        .eq("user_id", userId)
        .eq("cast_id", castId);

      if (error) {
        alert(error.message);
        return;
      }

      const next = new Set(favoriteIds);
      next.delete(castId);
      setFavoriteIds(next);

      setFavoriteCounts((prev) => ({
        ...prev,
        [castId]: Math.max((prev[castId] || 1) - 1, 0),
      }));
    } else {
      const { error } = await supabase.from("favorite_casts").insert({
        user_id: userId,
        cast_id: castId,
      });

      if (error) {
        alert(error.message);
        return;
      }

      const next = new Set(favoriteIds);
      next.add(castId);
      setFavoriteIds(next);

      setFavoriteCounts((prev) => ({
        ...prev,
        [castId]: (prev[castId] || 0) + 1,
      }));
    }
  }

  const filteredCasts = useMemo(() => {
    return [...casts]
      .filter((cast) => {
        const lower = search.toLowerCase();

        return (
          cast.name.toLowerCase().includes(lower) ||
          (cast.show_name || "").toLowerCase().includes(lower)
        );
      })
      .sort(
        (a, b) =>
          (favoriteCounts[b.id] || 0) - (favoriteCounts[a.id] || 0)
      );
  }, [casts, search, favoriteCounts]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="p-8 max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">Official Casts</h1>

        <p className="text-gray-400 mb-8">
          Favorite casts to use them in simulators.
        </p>

        <input
          type="text"
          placeholder="Search casts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 mb-8 text-white outline-none focus:border-blue-500"
        />

        <div className="flex flex-col gap-5">
          {filteredCasts.map((cast) => {
            const members = contestants.filter(
              (person) => person.cast_id === cast.id
            );

            const isFavorite = favoriteIds.has(cast.id);

            return (
              <div
                key={cast.id}
                className="bg-gray-900 border border-gray-800 rounded-3xl p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center"
              >
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-3xl font-bold">{cast.name}</h2>

                    <span className="bg-gray-800 px-3 py-1 rounded-xl text-sm text-gray-300">
                      {cast.show_name || "Other"}
                    </span>

                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-xl text-sm font-bold">
                      ★ {favoriteCounts[cast.id] || 0}
                    </span>
                  </div>

                  <p className="text-gray-400 mt-2">
                    {members.length} characters
                  </p>

                  <button
                    onClick={() => toggleFavorite(cast.id)}
                    className={
                      isFavorite
                        ? "mt-5 bg-yellow-500 text-black px-5 py-3 rounded-2xl font-bold"
                        : "mt-5 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-bold"
                    }
                  >
                    {isFavorite ? "Favorited" : "Favorite Cast"}
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto max-w-full pb-2">
                  {members.map((person) => (
                    <div key={person.id} className="min-w-[90px] max-w-[90px]">
                      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-800">
                        {person.image_url ? (
                          <img
                            src={person.image_url}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-center mt-2 truncate">
                        {person.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}