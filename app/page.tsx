import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="w-full border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-500">
          SimulatorTV
        </Link>

        <div className="flex gap-4 items-center">
          <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold">
            Login
          </Link>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center pt-32 px-6">
        <h1 className="text-7xl font-extrabold mb-6">SimulatorTV</h1>

        <p className="text-2xl text-gray-400 max-w-2xl mb-10">
          Create custom casts, run simulations, and watch unpredictable reality show madness unfold.
        </p>

        <Link href="/login" className="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-2xl text-lg font-bold">
          Go To Login
        </Link>
      </section>
    </main>
  );
}