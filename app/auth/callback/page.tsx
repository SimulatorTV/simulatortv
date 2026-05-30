"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        router.push("/simulators");
      } else {
        router.push("/create-profile");
      }
    }

    checkProfile();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-gray-400">Logging you in...</p>
    </main>
  );
}