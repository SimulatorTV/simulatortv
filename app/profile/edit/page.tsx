"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const user = userData.user;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.username || "");
      setAvatarUrl(data.avatar_url || "");
      setBio(data.bio || "");
    }

    setLoading(false);
  }

  async function saveProfile() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const user = userData.user;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username,
        avatar_url: avatarUrl,
        bio,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile saved!");
    router.push("/profile");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="p-8 text-2xl font-bold">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="max-w-5xl mx-auto p-8">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 rounded-3xl overflow-hidden bg-gray-800 border border-gray-700">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
                    No Avatar
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 w-full">
              <h1 className="text-5xl font-black mb-6">
                Your Profile
              </h1>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-300 font-bold">
                    Username
                  </label>

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-300 font-bold">
                    Avatar URL
                  </label>

                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Paste image URL"
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-gray-300 font-bold">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people about yourself..."
                    rows={5}
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  onClick={saveProfile}
                  className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black text-lg"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">
              Friends
            </h2>

            <p className="text-gray-400">
              Friends system coming soon.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="text-3xl font-black mb-4">
              Saved Seasons
            </h2>

            <p className="text-gray-400">
              Saved simulator seasons coming soon.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}