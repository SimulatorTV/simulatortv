"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleAuth() {
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/create-profile");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/simulators");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-gray-900 p-10 rounded-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {mode === "login" ? "Login" : "Create Account"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 rounded-xl bg-gray-800 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl bg-gray-800 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-xl font-bold mb-4"
        >
          {mode === "login" ? "Login" : "Create Account"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-gray-400 hover:text-white"
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Log in"}
        </button>
      </div>
    </main>
  );
}