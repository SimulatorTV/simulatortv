"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

type SourceContestant = {
  id: string;
  name: string;
  image_url: string | null;
  cast_id: string;
  cast_name: string;
  show_name: string | null;
  is_official: boolean;
};

type ExistingCast = {
  id: string;
  name: string;
  show_name: string | null;
};

function CreateFullCastPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCastId = searchParams.get("edit");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [existingCast, setExistingCast] = useState<ExistingCast | null>(null);
  const [existingContestantKeys, setExistingContestantKeys] = useState<Set<string>>(new Set());

  const [castName, setCastName] = useState("");
  const [showName, setShowName] = useState("Full Cast");
  const [search, setSearch] = useState("");
  const [selectedShow, setSelectedShow] = useState("All");
  const [contestants, setContestants] = useState<SourceContestant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isEditMode = Boolean(editCastId);

  useEffect(() => {
    loadContestants();
  }, [editCastId]);

  function contestantKey(person: { name: string; image_url: string | null }) {
    return `${person.name.trim().toLowerCase()}|||${person.image_url || ""}`;
  }

  async function loadContestants() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    let existingKeys = new Set<string>();

    if (editCastId) {
      const { data: castData, error: castError } = await supabase
        .from("casts")
        .select("id, name, show_name")
        .eq("id", editCastId)
        .eq("user_id", userData.user.id)
        .single();

      if (castError || !castData) {
        alert("Cast not found.");
        router.push("/custom-casts");
        return;
      }

      setExistingCast(castData);

      const { data: existingPeople, error: existingError } = await supabase
        .from("contestants")
        .select("name, image_url")
        .eq("cast_id", editCastId);

      if (existingError) {
        alert(existingError.message);
        setLoading(false);
        return;
      }

      existingKeys = new Set(
        (existingPeople || []).map((person) => contestantKey(person))
      );

      setExistingContestantKeys(existingKeys);
    }

    const { data: favoriteData } = await supabase
      .from("favorite_casts")
      .select("cast_id")
      .eq("user_id", userData.user.id);

    const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

    const { data: userCasts, error: userCastError } = await supabase
      .from("casts")
      .select("id, name, show_name, is_official, is_full_cast")
      .eq("user_id", userData.user.id)
      .eq("is_full_cast", false)
      .order("name", { ascending: true });

    if (userCastError) {
      alert(userCastError.message);
      setLoading(false);
      return;
    }

    let officialCasts: any[] = [];

    if (favoriteOfficialCastIds.length > 0) {
      const { data: officialData, error: officialError } = await supabase
        .from("casts")
        .select("id, name, show_name, is_official, is_full_cast")
        .in("id", favoriteOfficialCastIds)
        .eq("is_official", true)
        .order("name", { ascending: true });

      if (officialError) {
        alert(officialError.message);
        setLoading(false);
        return;
      }

      officialCasts = officialData || [];
    }

    const casts = [...officialCasts, ...(userCasts || [])]
      .filter((cast) => !cast.is_full_cast)
      .filter((cast) => cast.id !== editCastId);

    if (casts.length === 0) {
      setContestants([]);
      setLoading(false);
      return;
    }

    const castIds = casts.map((cast) => cast.id);

    const { data: contestantData, error: contestantError } = await supabase
      .from("contestants")
      .select("id, name, image_url, cast_id")
      .in("cast_id", castIds)
      .order("created_at", { ascending: true });

    if (contestantError) {
      alert(contestantError.message);
      setLoading(false);
      return;
    }

    const castById = new Map(casts.map((cast) => [cast.id, cast]));

    const merged = (contestantData || [])
      .map((person) => {
        const cast = castById.get(person.cast_id);

        return {
          ...person,
          cast_name: cast?.name || "Unknown Cast",
          show_name: cast?.show_name || cast?.name || "Other",
          is_official: Boolean(cast?.is_official),
        };
      })
      .filter((person) => !existingKeys.has(contestantKey(person)));

    setContestants(merged);
    setLoading(false);
  }

  const showTabs = useMemo(() => {
    const shows = new Set<string>();

    contestants.forEach((person) => {
      shows.add(person.show_name || person.cast_name || "Other");
    });

    return ["All", ...Array.from(shows).sort()];
  }, [contestants]);

  const filteredContestants = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return contestants.filter((person) => {
      const show = person.show_name || person.cast_name || "Other";

      const matchesShow =
        selectedShow === "All" ||
        show === selectedShow;

      const matchesSearch =
        !lowerSearch ||
        person.name.toLowerCase().includes(lowerSearch) ||
        person.cast_name.toLowerCase().includes(lowerSearch) ||
        show.toLowerCase().includes(lowerSearch);

      return matchesShow && matchesSearch;
    });
  }, [contestants, search, selectedShow]);

  function toggleContestant(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function selectFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      filteredContestants.forEach((person) => {
        next.add(person.id);
      });

      return next;
    });
  }

  function clearFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);

      filteredContestants.forEach((person) => {
        next.delete(person.id);
      });

      return next;
    });
  }

  async function saveFullCast() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const selectedPeople = contestants.filter((person) => selectedIds.has(person.id));

    if (selectedPeople.length === 0) {
      alert("Select at least one cast member.");
      return;
    }

    if (!isEditMode && !castName.trim()) {
      alert("Name the full cast first.");
      return;
    }

    setSaving(true);

    let targetCastId = editCastId;

    if (!isEditMode) {
      const { data: newCast, error: castError } = await supabase
        .from("casts")
        .insert({
          user_id: userData.user.id,
          name: castName.trim(),
          show_name: showName.trim() || "Full Cast",
          is_official: false,
          is_full_cast: true,
        })
        .select("id")
        .single();

      if (castError || !newCast) {
        alert(castError?.message || "Could not create full cast.");
        setSaving(false);
        return;
      }

      targetCastId = newCast.id;
    }

    if (!targetCastId) {
      alert("No cast selected.");
      setSaving(false);
      return;
    }

    const copiedContestants = selectedPeople
      .filter((person) => !existingContestantKeys.has(contestantKey(person)))
      .map((person) => ({
        cast_id: targetCastId,
        name: person.name,
        image_url: person.image_url,
      }));

    if (copiedContestants.length === 0) {
      alert("Those cast members are already in this cast.");
      setSaving(false);
      return;
    }

    const { error: contestantError } = await supabase
      .from("contestants")
      .insert(copiedContestants);

    if (contestantError) {
      alert(contestantError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/custom-casts/${targetCastId}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="p-8 text-3xl font-black">
          Loading cast members...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-7xl mx-auto p-6 md:p-8">
        <Link
          href={isEditMode && existingCast ? `/custom-casts/${existingCast.id}` : "/custom-casts"}
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to {isEditMode && existingCast ? existingCast.name : "Custom Casts"}
        </Link>

        <div className="mt-6 mb-8 bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <h1 className="text-5xl font-black mb-3">
            {isEditMode ? "Add Existing Cast Members" : "Create Full Cast"}
          </h1>

          <p className="text-gray-400 mb-6">
            {isEditMode
              ? `Select existing website cast members to copy into ${existingCast?.name || "this cast"}. They will still stay in their original shows too.`
              : "Select any cast members already on the website and copy them into one new custom cast. They will still stay in their original shows too."}
          </p>

          {!isEditMode && (
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <input
                className="w-full p-4 rounded-xl bg-gray-800"
                value={castName}
                onChange={(e) => setCastName(e.target.value)}
                placeholder="Full cast name, like The Challenge Mega Cast"
              />

              <input
                className="w-full p-4 rounded-xl bg-gray-800"
                value={showName}
                onChange={(e) => setShowName(e.target.value)}
                placeholder="Category/tab name, like Full Cast"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveFullCast}
              disabled={saving || selectedIds.size === 0}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 px-6 py-3 rounded-xl font-black"
            >
              {saving
                ? "Saving..."
                : isEditMode
                  ? `Add Selected (${selectedIds.size})`
                  : `Save Full Cast (${selectedIds.size})`}
            </button>

            <button
              onClick={selectFiltered}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-black"
            >
              Select Visible
            </button>

            <button
              onClick={clearFiltered}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-black"
            >
              Clear Visible
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 mb-6">
          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or show..."
          />

          <div className="flex flex-wrap gap-2">
            {showTabs.map((show) => (
              <button
                key={show}
                onClick={() => setSelectedShow(show)}
                className={`px-4 py-2 rounded-full font-black ${
                  selectedShow === show
                    ? "bg-pink-600 text-white"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                }`}
              >
                {show}
              </button>
            ))}
          </div>
        </div>

        {filteredContestants.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-gray-400">
            No cast members found.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {filteredContestants.map((person) => {
              const selected = selectedIds.has(person.id);

              return (
                <button
                  key={person.id}
                  onClick={() => toggleContestant(person.id)}
                  className={`relative text-left bg-gray-900 border rounded-2xl p-2 transition ${
                    selected
                      ? "border-pink-400 ring-2 ring-pink-400"
                      : "border-gray-800 hover:border-gray-500 opacity-60"
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-800">
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

                  <div className="mt-2 text-sm font-black truncate">
                    {person.name}
                  </div>

                  <div className="text-xs text-gray-400 truncate">
                    {person.show_name || person.cast_name}
                  </div>

                  {selected && (
                    <div className="absolute top-2 right-2 bg-pink-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-black">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function CreateFullCastPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white">
          <Navbar />
          <div className="p-8 text-3xl font-black">
            Loading cast members...
          </div>
        </main>
      }
    >
      <CreateFullCastPageContent />
    </Suspense>
  );
}
