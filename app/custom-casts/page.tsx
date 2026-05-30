"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

type Cast = {
  id: string;
  name: string;
  show_name: string | null;
  created_at: string;
};

export default function CustomCastsPage() {
  const router = useRouter();
  const [casts, setCasts] = useState<Cast[]>([]);

  useEffect(() => {
    loadCasts();
  }, []);

  async function loadCasts() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("casts")
      .select("id, name, show_name, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCasts(data || []);
  }

  async function deleteCast(castId: string) {
    const confirmDelete = confirm("Delete this cast?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("casts")
      .delete()
      .eq("id", castId);

    if (error) {
      alert(error.message);
      return;
    }

    setCasts(casts.filter((cast) => cast.id !== castId));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-5xl font-bold mb-2">
              Custom Casts
            </h2>

            <p className="text-gray-400">
              Create and save your own casts.
            </p>
          </div>

          <Link
            href="/cast-creator"
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold"
          >
            Add Cast
          </Link>
        </div>

        {casts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-gray-400">
            No saved casts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {casts.map((cast) => (
              <div
                key={cast.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
              >
                <h3 className="text-2xl font-bold mb-2">
                  {cast.name}
                </h3>

                <p className="text-gray-400 mb-4">
                  {cast.show_name || "No show/category"}
                </p>

                <div className="flex gap-3">
                  <Link
                    href={`/custom-casts/${cast.id}`}
                    className="inline-block bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl font-bold"
                  >
                    View Cast
                  </Link>

                  <button
                    onClick={() => deleteCast(cast.id)}
                    className="bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}