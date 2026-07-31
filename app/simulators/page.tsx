"use client";

import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function SimulatorsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="p-8">
        <h2 className="text-5xl font-bold mb-4">Simulators</h2>

        <p className="text-gray-400 mb-8">Choose a simulator to begin.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SimulatorCard
            title="Color Blitz"
            description="Everyone picks a color. The Spinner eliminates a color. Pick a different color."
            href="/simulators/color-blitz"
            buttonText="Open Color Blitz"
            buttonClass="bg-blue-600 hover:bg-blue-500"
          />

          <SimulatorCard
            title="Survivor Simulator"
            description="Survivor simulator with custom round formats and advantages."
            href="/simulators/survivor"
            buttonText="Open Survivor"
            buttonClass="bg-green-600 hover:bg-green-500"
          />

          <SimulatorCard
            title="Big Brother"
            description="Big Brother simulator with custom weekly formats and twists"
            href="/simulators/big-brother"
            buttonText="Open Big Brother"
            buttonClass="bg-cyan-600 hover:bg-cyan-500"
          />

<SimulatorCard
  title="The Duel"
  description="The Challenge: The Duel with different toggalable daily challenges and elimination duels."
  href="/simulators/the-duel"
  buttonText="Open The Duel"
  buttonClass="bg-red-600 hover:bg-red-500"
/>

          <SimulatorCard
            title="Free Agents"
            description="Teams change every round. Last place team sends 2 players into elimination."
            href="/simulators/free-agents"
            buttonText="Open Free Agents"
            buttonClass="bg-yellow-500 hover:bg-yellow-400 text-black"
          />

          <SimulatorCard
            title="Endurance"
            description="Teams battle to collect Endurance pieces and stay out of the Temple of Fate."
            href="/simulators/endurance"
            buttonText="Open Endurance"
            buttonClass="bg-purple-600 hover:bg-purple-500"
          />

<SimulatorCard
  title="Battle Fighters"
  description="Random 1v1 stat battles where a color roll decides which stat matters and the higher stat survives."
  href="/simulators/battle-fighters"
  buttonText="Open Battle Fighters"
  buttonClass="bg-rose-400 hover:bg-rose-300 text-black"
/>


          <SimulatorCard
  title="Battle of the Shows"
  description="Teams of the same cast compete in challenges and eliminations until one team remains."
  href="/simulators/battle-of-the-shows"
  buttonText="Open Battle of the Shows"
  buttonClass="bg-teal-600 hover:bg-teal-500 text-white"
/>

<SimulatorCard
  title="Russian Roulette"
  description="Russian roulette simulator with custom clip size and bullets per clip."
  href="/simulators/russian-roulette"
  buttonText="Open Russian Roulette"
  buttonClass="bg-zinc-300 hover:bg-zinc-200 text-black"
/>

<SimulatorCard
  title="Redneck Island"
  description="Teams of two that can change in an elimination round."
  href="/simulators/redneck-island"
  buttonText="Open Redneck Island"
  buttonClass="bg-green-900 hover:bg-green-800 text-white"
/>

          <SimulatorCard
            title="Trio"
            description="Teams of three that change in elimination rounds."
            href="/simulators/trio"
            buttonText="Open Trio"
            buttonClass="bg-orange-600 hover:bg-orange-500"
          />

          <SimulatorCard
  title="Deal or No Deal Island"
  description="Compete in case challenges, face the Banker, build the finale prize board, and survive elimination."
  href="/simulators/deal-or-no-deal-island"
  buttonText="Open Deal or No Deal Island"
  buttonClass="bg-amber-500 hover:bg-amber-400 text-black"
/>

          <SimulatorCard
  title="Call Out"
  description="Most voted person(s) calls out someone that voted them in to a 1v1 elimination. Last person standing wins."
  href="/simulators/call-out"
  buttonText="Open Call Out"
  buttonClass="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
/>

<SimulatorCard
  title="Team Battle"
  description="Two teams face off through challenges, votes, eliminations, custom teams, and team survival."
  href="/simulators/team-battle"
  buttonText="Open Team Battle"
  buttonClass="bg-red-600 hover:bg-red-500 text-white"
/>


          <SimulatorCard
  title="The Traitors"
  description="The Traitors simulator"
  href="/simulators/the-traitors"
  buttonText="Open The Traitors"
  buttonClass="bg-white hover:bg-gray-200 text-black"
/>

<SimulatorCard
  title="Pyramid"
  description="Climb to the top of the pyramid."
  href="/simulators/pyramid"
  buttonText="Open Pyramid"
  buttonClass="bg-yellow-400 hover:bg-yellow-300 text-black"
/>

<SimulatorCard
  title="The Champion"
  description="A throne-holding champion faces challengers selected through nominations, votes, and dice duels."
  href="/simulators/the-champion"
  buttonText="Open The Champion"
  buttonClass="bg-blue-950 hover:bg-blue-900 text-white"
/>


<SimulatorCard
  title="Grand Eliminator"
  description="Challenge winner sends 4 into elimination. One is eliminated, the other 3 go to the next round. Last person standing wins."
  href="/simulators/grand-eliminator"
  buttonText="Open Grand Eliminator"
  buttonClass="bg-emerald-700 hover:bg-emerald-600 text-white"
/>

<SimulatorCard
  title="Marble Race"
  description="Release contestant marbles through changing physics courses where green qualifies, red resets, and the last marble is eliminated."
  href="/simulators/marble-race"
  buttonText="Open Marble Race"
  buttonClass="bg-sky-500 hover:bg-sky-400 text-black"
/>

<SimulatorCard
  title="Dice Master"
  description="Teams of 60 roll dice to not have lowest score and eliminate a player"
  href="/simulators/dice-master"
  buttonText="Open Dice Master"
  buttonClass="bg-black-700 hover:bg-black-600 text-white"
/>

<SimulatorCard
  title="Hot Seat"
  description="Choose seats, avoid elimination chairs, survive each round, and find the winning seat in the finale."
  href="/simulators/hot-seat"
  buttonText="Open Hot Seat"
  buttonClass="bg-orange-600 hover:bg-orange-500 text-white"
/>

          <SimulatorCard
            title="Card Game Elimination"
            description="Elimination game with toggleable daily challenges and eliminations based on card games. Last person standing wins."
            href="/simulators/card-game-elimination"
            buttonText="Open Simulator"
            buttonClass="bg-blue-600 hover:bg-blue-500"
          />
        </div>
      </section>
    </main>
  );
}

function SimulatorCard({
  title,
  description,
  href,
  buttonText,
  buttonClass,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  buttonClass: string;
}) {
  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
      <h3 className="text-3xl font-bold mb-3">{title}</h3>

      <p className="text-gray-400 mb-6">{description}</p>

      <Link
        href={href}
        className={`inline-block px-6 py-3 rounded-xl font-bold ${buttonClass}`}
      >
        {buttonText}
      </Link>
    </div>
  );
}