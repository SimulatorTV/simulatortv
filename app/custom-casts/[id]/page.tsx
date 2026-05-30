"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

type Cast = {
  id: string;
  name: string;
  show_name: string | null;
};

type Contestant = {
  id: string;
  name: string;
  image_url: string | null;
};

export default function CastDetailPage() {
  const router = useRouter();
  const params = useParams();
  const castId = params.id as string;

  const [cast, setCast] = useState<Cast | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);

  const [castName, setCastName] = useState("");
  const [showName, setShowName] = useState("");
  const [newName, setNewName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    loadCast();
  }, []);

  async function loadCast() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: castData, error: castError } = await supabase
      .from("casts")
      .select("id, name, show_name")
      .eq("id", castId)
      .eq("user_id", userData.user.id)
      .single();

    if (castError || !castData) {
      alert("Cast not found.");
      router.push("/custom-casts");
      return;
    }

    setCast(castData);
    setCastName(castData.name);
    setShowName(castData.show_name || "");

    const { data: contestantData } = await supabase
      .from("contestants")
      .select("id, name, image_url")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    setContestants(contestantData || []);
  }

  async function saveCastInfo() {
    const { error } = await supabase
      .from("casts")
      .update({
        name: castName.trim(),
        show_name: showName.trim() || null,
      })
      .eq("id", castId);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Cast updated!");
    loadCast();
  }

  async function addContestant() {
    if (!newName.trim()) return;

    const { error } = await supabase.from("contestants").insert({
      cast_id: castId,
      name: newName.trim(),
      image_url: newImageUrl.trim() || null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewName("");
    setNewImageUrl("");
    loadCast();
  }

  async function deleteContestant(contestantId: string) {
    const confirmDelete = confirm("Delete this contestant?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("contestants")
      .delete()
      .eq("id", contestantId);

    if (error) {
      alert(error.message);
      return;
    }

    setContestants(contestants.filter((person) => person.id !== contestantId));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="p-8">
        <Link
          href="/custom-casts"
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to Custom Casts
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-6 mb-8 max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">
            Edit Cast
          </h1>

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            value={castName}
            onChange={(e) => setCastName(e.target.value)}
            placeholder="Cast name"
          />

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
            placeholder="Show/category"
          />

          <button
            onClick={saveCastInfo}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
          >
            Save Cast Info
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Add Contestant
          </h2>

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contestant name"
          />

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Image URL"
          />

          <button
            onClick={addContestant}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-bold"
          >
            Add Contestant
          </button>
        </div>

        <h2 className="text-4xl font-bold mb-6">
          {cast?.name || "Loading..."}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {contestants.map((person) => (
            <div
              key={person.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-800 mb-3">
                {person.image_url ? (
                  <img
                    src={person.image_url}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-center mb-3">
                {person.name}
              </h3>

              <button
                onClick={() => deleteContestant(person.id)}
                className="w-full bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}