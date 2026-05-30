"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  async function logOut(): Promise<void> {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="w-full border-b border-gray-800 px-8 py-4 flex justify-between items-center bg-black text-white">
      <Link href="/simulators" className="text-2xl font-bold text-blue-500">
        SimulatorTV
      </Link>

      <div className="flex gap-4 items-center flex-wrap">
        <Link href="/simulators" className="hover:text-blue-400">
          Simulators
        </Link>

        <Link href="/community" className="hover:text-blue-400">
          Community
        </Link>

        <Link href="/profile" className="hover:text-blue-400">
          Profile
        </Link>

        <Link href="/custom-casts" className="hover:text-blue-400">
          Custom Casts
        </Link>

        <Link href="/official-casts" className="hover:text-blue-400">
          Official Casts
        </Link>

        <button
          type="button"
          onClick={logOut}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}