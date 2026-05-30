"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

type Contestant = {
  id: number;
  name: string;
  imageFile: File | null;
  previewUrl: string;
};

export default function CastCreatorPage() {
  const router = useRouter();

  const [castName, setCastName] = useState("");
  const [showName, setShowName] = useState("");
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [name, setName] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");

  function handleImageChange(file: File | null) {
    setImageFile(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  }

  function addContestant() {
    if (!name.trim()) return;

    setContestants([
      ...contestants,
      {
        id: Date.now(),
        name,
        imageFile,
        previewUrl: imageUrlInput || previewUrl,
      },
    ]);

    setName("");
    setImageFile(null);
    setPreviewUrl("");
    setImageUrlInput("");
  }

  async function uploadImage(file: File, userId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("contestant-images")
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("contestant-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function saveCast() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    if (!castName.trim()) {
      alert("Give your cast a name first.");
      return;
    }

    const { data: cast, error: castError } = await supabase
      .from("casts")
      .insert({
        user_id: userData.user.id,
        name: castName.trim(),
        show_name: showName.trim() || null,
        is_official: false,
      })
      .select()
      .single();

    if (castError || !cast) {
      alert("Error saving cast.");
      return;
    }

    const contestantRows = [];

    for (const person of contestants) {
      let imageUrl = null;

      if (person.imageFile) {
        imageUrl = await uploadImage(person.imageFile, userData.user.id);
      } else if (person.previewUrl) {
        imageUrl = person.previewUrl;
      }

      contestantRows.push({
        cast_id: cast.id,
        name: person.name,
        image_url: imageUrl,
      });
    }

    if (contestantRows.length > 0) {
      const { error: contestantsError } = await supabase
        .from("contestants")
        .insert(contestantRows);

      if (contestantsError) {
        alert("Cast saved, but contestants failed to save.");
        return;
      }
    }

    alert("Cast saved!");
    router.push("/custom-casts");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold">
            Cast Creator
          </h1>

          <button
            onClick={saveCast}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
          >
            Save Cast
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl max-w-2xl mb-8">
          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            placeholder="Cast name"
            value={castName}
            onChange={(e) => setCastName(e.target.value)}
          />

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            placeholder="Show name / category"
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
          />

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            placeholder="Contestant name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="file"
            accept="image/*"
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
          />

          <input
            className="w-full p-4 rounded-xl bg-gray-800 mb-4"
            placeholder="Or paste image URL"
            value={imageUrlInput}
            onChange={(e) => {
              setImageUrlInput(e.target.value);
              setPreviewUrl(e.target.value);
            }}
          />

          {previewUrl && (
            <div className="aspect-square w-32 overflow-hidden rounded-xl bg-gray-800 mb-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <button
            onClick={addContestant}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-bold"
          >
            Add Contestant
          </button>
        </div>

        <h2 className="text-3xl font-bold mb-4">
          {castName || "Untitled Cast"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contestants.map((person) => (
            <div
              key={person.id}
              className="bg-gray-900 p-4 rounded-2xl"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-800 mb-3">
                {person.previewUrl ? (
                  <img
                    src={person.previewUrl}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-center">
                {person.name}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}