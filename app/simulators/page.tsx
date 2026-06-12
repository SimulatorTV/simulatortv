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
            description="Fast-paced color survival chaos with eliminations, rotations, and custom rules."
            href="/simulators/color-blitz"
            buttonText="Open Color Blitz"
            buttonClass="bg-blue-600 hover:bg-blue-500"
          />

          <SimulatorCard
            title="Survivor Simulator"
            description="Tribes, idols, swaps, merges, twists, jury votes, and total chaos."
            href="/simulators/survivor"
            buttonText="Open Survivor"
            buttonClass="bg-green-600 hover:bg-green-500"
          />

          <SimulatorCard
            title="Big Brother"
            description="HOHs, nominations, vetoes, twists, split houses, battle backs, and jury votes."
            href="/simulators/big-brother"
            buttonText="Open Big Brother"
            buttonClass="bg-cyan-600 hover:bg-cyan-500"
          />

<SimulatorCard
  title="The Duel"
  description="Daily challenges, safety chains, duels, double duels, poker, blackjack, popularity votes, and dozens of elimination games."
  href="/simulators/the-duel"
  buttonText="Open The Duel"
  buttonClass="bg-red-600 hover:bg-red-500"
/>

          <SimulatorCard
            title="Free Agents"
            description="Random teams, challenge rankings, elimination battles, and constantly shifting formats."
            href="/simulators/free-agents"
            buttonText="Open Free Agents"
            buttonClass="bg-yellow-500 hover:bg-yellow-400 text-black"
          />

          <SimulatorCard
            title="Endurance"
            description="Team colors, Temple of Fate, temple pieces, missions, and final showdown."
            href="/simulators/endurance"
            buttonText="Open Endurance"
            buttonClass="bg-purple-600 hover:bg-purple-500"
          />

          <SimulatorCard
  title="Battle of the Shows"
  description="Shows battle as teams through challenges, call-outs, voting, matchups, and eliminations until one show remains."
  href="/simulators/battle-of-the-shows"
  buttonText="Open Battle of the Shows"
  buttonClass="bg-teal-600 hover:bg-teal-500 text-white"
/>

<SimulatorCard
  title="Russian Roulette"
  description="Spin the gun, survive the chamber, manage bullets and clip size, and play normal or tournament mode."
  href="/simulators/russian-roulette"
  buttonText="Open Russian Roulette"
  buttonClass="bg-zinc-300 hover:bg-zinc-200 text-black"
/>

<SimulatorCard
  title="Redneck Island"
  description="Spin the gun, survive the chamber, manage bullets and clip size, and play normal or tournament mode."
  href="/simulators/redneck-island"
  buttonText="Open Redneck Island"
  buttonClass="bg-green-900 hover:bg-green-800 text-white"
/>

          <SimulatorCard
            title="Trio"
            description="Teams of three battle through challenges and eliminations until one trio remains."
            href="/simulators/trio"
            buttonText="Open Trio"
            buttonClass="bg-orange-600 hover:bg-orange-500"
          />

          <SimulatorCard
  title="Call Out"
  description="Form alliances, vote players into elimination, call out your voters, and survive head-to-head eliminations."
  href="/simulators/call-out"
  buttonText="Open Call Out"
  buttonClass="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
/>

          <SimulatorCard
  title="The Traitors"
  description="Faithfuls, Traitors, murders, shields, recruitments, ultimatums, round tables, and endgame mind games."
  href="/simulators/the-traitors"
  buttonText="Open The Traitors"
  buttonClass="bg-white hover:bg-gray-200 text-black"
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
            description="Poker, Blackjack, Baccarat, Bingo, War, Liar's Dice, and more."
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