"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CreateProfilePage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  async function saveUsername() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: userData.user.id,
      username: username.trim(),
    });

    if (error) {
      alert("Username already taken or invalid.");
    } else {
      router.push("/simulators");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-10 rounded-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Create Username
        </h1>

        <input
          className="w-full p-4 rounded-xl bg-gray-800 mb-4"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          onClick={saveUsername}
          className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold"
        >
          Save Username
        </button>
      </div>
    </main>
  );
}