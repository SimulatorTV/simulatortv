// @ts-nocheck

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

function Button({ children, className = "", variant, size, disabled, onClick, type = "button" }) {
  const variantClass = variant === "secondary" ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white";
  const sizeClass = size === "sm" ? "px-3 py-2 text-sm" : "px-5 py-3";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClass} ${sizeClass} font-bold disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function AnimatePresence({ children }) {
  return <>{children}</>;
}

const motion = {
  div: ({ children, initial, animate, transition, style, ...props }) => {
    const rotate = animate?.rotate ?? undefined;
    const scale = animate?.scale ?? undefined;
    const opacity = animate?.opacity ?? undefined;
    const duration = transition?.duration ?? 0;

    return (
      <div
        {...props}
        style={{
          ...style,
          transform: [
            rotate !== undefined ? `rotate(${rotate}deg)` : "",
            scale !== undefined ? `scale(${scale})` : "",
          ].join(" ").trim() || undefined,
          opacity,
          transition: duration
            ? `transform ${duration}s cubic-bezier(0.12, 0.6, 0.16, 1), opacity ${duration}s ease`
            : "none",
        }}
      >
        {children}
      </div>
    );
  },
};

function Shuffle({ className = "" }) {
  return <span className={className}>🔀</span>;
}

function RotateCw({ className = "" }) {
  return <span className={className}>🔄</span>;
}

function Trophy({ className = "" }) {
  return <span className={className}>🏆</span>;
}

function Skull({ className = "" }) {
  return <span className={className}>💀</span>;
}

const COLORS = [
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Yellow", hex: "#fff200" },
  { name: "Gold", hex: "#fbbf24" },
  { name: "Lime", hex: "#00ff00" },
  { name: "Olive", hex: "#6b8e23" },
  { name: "Green", hex: "#22c55e" },
  { name: "Dark Green", hex: "#166534" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#00f7ff" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Navy", hex: "#172554" },
  { name: "Indigo", hex: "#6a00ff" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Lavender", hex: "#d3d3ff" },
  { name: "Pink", hex: "#f675b9" },
  { name: "Magenta", hex: "#d946ef" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Brown", hex: "#8b5a2b" },
  { name: "Tan", hex: "#d2b48c" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Silver", hex: "#cbd5e1" },
  { name: "White", hex: "#ffffff" },
  { name: "Black", hex: "#020617" },
];

const COUNTRY_COLORS = [
  { name: "USA", cssHex: "radial-gradient(circle at 8% 12%, #ffffff 0 1.6%, transparent 1.8%), radial-gradient(circle at 16% 22%, #ffffff 0 1.6%, transparent 1.8%), radial-gradient(circle at 8% 32%, #ffffff 0 1.6%, transparent 1.8%), linear-gradient(to right, #3c3b6e 0 40%, transparent 40% 100%), linear-gradient(to bottom, #b22234 0 7.7%, #ffffff 7.7% 15.4%, #b22234 15.4% 23.1%, #ffffff 23.1% 30.8%, #b22234 30.8% 38.5%, #ffffff 38.5% 46.2%, #b22234 46.2% 53.9%, #ffffff 53.9% 61.6%, #b22234 61.6% 69.3%, #ffffff 69.3% 77%, #b22234 77% 84.7%, #ffffff 84.7% 92.4%, #b22234 92.4% 100%)", type: "country" },
  { name: "Ireland", cssHex: "linear-gradient(to right, #169b62 0 33%, #ffffff 33% 66%, #ff883e 66% 100%)", type: "country" },
  { name: "Canada", cssHex: "radial-gradient(ellipse at 50% 42%, #d80621 0 7%, transparent 7.5%), radial-gradient(ellipse at 43% 48%, #d80621 0 5%, transparent 5.5%), radial-gradient(ellipse at 57% 48%, #d80621 0 5%, transparent 5.5%), linear-gradient(to bottom, transparent 0 55%, #d80621 55% 75%, transparent 75% 100%), linear-gradient(to right, #d80621 0 25%, #ffffff 25% 75%, #d80621 75% 100%)", type: "country" },
  { name: "United Kingdom", cssHex: "linear-gradient(45deg, transparent 0 42%, #ffffff 42% 48%, #c8102e 48% 52%, #ffffff 52% 58%, transparent 58%), linear-gradient(-45deg, transparent 0 42%, #ffffff 42% 48%, #c8102e 48% 52%, #ffffff 52% 58%, transparent 58%), linear-gradient(to right, transparent 0 42%, #ffffff 42% 58%, transparent 58%), linear-gradient(to bottom, #012169 0 38%, #ffffff 38% 45%, #c8102e 45% 55%, #ffffff 55% 62%, #012169 62% 100%)", type: "country" },
  { name: "Mexico", cssHex: "linear-gradient(to right, #006847 0 33%, #ffffff 33% 66%, #ce1126 66% 100%)", type: "country" },
  { name: "Spain", cssHex: "linear-gradient(to bottom, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75% 100%)", type: "country" },
  { name: "France", cssHex: "linear-gradient(to right, #0055a4 0 33%, #ffffff 33% 66%, #ef4135 66% 100%)", type: "country" },
  { name: "Germany", cssHex: "linear-gradient(to bottom, #000000 0 33%, #dd0000 33% 66%, #ffce00 66% 100%)", type: "country" },
  { name: "Georgia", cssHex: "linear-gradient(to right, #ffffff 0 40%, #ff0000 40% 60%, #ffffff 60% 100%), linear-gradient(to bottom, #ffffff 0 40%, #ff0000 40% 60%, #ffffff 60% 100%), radial-gradient(circle at 24% 24%, #ff0000 0 4%, transparent 4.5%), radial-gradient(circle at 76% 24%, #ff0000 0 4%, transparent 4.5%), radial-gradient(circle at 24% 76%, #ff0000 0 4%, transparent 4.5%), radial-gradient(circle at 76% 76%, #ff0000 0 4%, transparent 4.5%), #ffffff", type: "country" },
  { name: "Czechia", cssHex: "linear-gradient(to bottom, #ffffff 0 50%, #d7141a 50% 100%)", type: "country" },
  { name: "Italy", cssHex: "linear-gradient(to right, #009246 0 33%, #ffffff 33% 66%, #ce2b37 66% 100%)", type: "country" },
  { name: "Hungary", cssHex: "linear-gradient(to bottom, #ce2939 0 33%, #ffffff 33% 66%, #477050 66% 100%)", type: "country" },
  { name: "Greece", cssHex: "repeating-linear-gradient(to bottom,#0d5eaf 0 10%,#ffffff 10% 20%)", type: "country" },
  { name: "Switzerland", cssHex: "linear-gradient(to right, transparent 0 38%, #ffffff 38% 62%, transparent 62%), linear-gradient(to bottom, #d52b1e 0 38%, #ffffff 38% 62%, #d52b1e 62%)", type: "country" },
  { name: "Brazil", cssHex: "linear-gradient(45deg, transparent 32%, #ffdf00 32% 68%, transparent 68%), linear-gradient(-45deg, transparent 32%, #ffdf00 32% 68%, transparent 68%), radial-gradient(circle at 50% 50%, #002776 0 14%, transparent 15%), #009c3b", type: "country" },
  { name: "South Africa", cssHex: "linear-gradient(to bottom, #de3831 0 33%, #ffffff 33% 40%, #007749 40% 60%, #ffffff 60% 67%, #002395 67% 100%)", type: "country" },
  { name: "Norway", cssHex: "linear-gradient(to right, transparent 0 28%, #ffffff 28% 36%, #00205b 36% 48%, #ffffff 48% 56%, transparent 56% 100%), linear-gradient(to bottom, #ba0c2f 0 35%, #ffffff 35% 43%, #00205b 43% 57%, #ffffff 57% 65%, #ba0c2f 65% 100%)", type: "country" },
  { name: "Sweden", cssHex: "linear-gradient(to right, transparent 0 30%, #fecc00 30% 45%, transparent 45% 100%), linear-gradient(to bottom, #006aa7 0 40%, #fecc00 40% 58%, #006aa7 58% 100%)", type: "country" },
  { name: "Finland", cssHex: "linear-gradient(to right, transparent 0 30%, #002f6c 30% 45%, transparent 45% 100%), linear-gradient(to bottom, #ffffff 0 40%, #002f6c 40% 58%, #ffffff 58% 100%)", type: "country" },
  { name: "Denmark", cssHex: "linear-gradient(to right, transparent 0 30%, #ffffff 30% 42%, transparent 42% 100%), linear-gradient(to bottom, #c60c30 0 42%, #ffffff 42% 56%, #c60c30 56% 100%)", type: "country" },
  { name: "India", cssHex: "radial-gradient(circle at 50% 50%, transparent 0 9%, #000080 10% 12%, transparent 13%), linear-gradient(to bottom,#ff9933 0 33%,#ffffff 33% 66%,#138808 66% 100%)", type: "country" },
  { name: "Japan", cssHex: "radial-gradient(circle,#bc002d 0 28%,#ffffff 29% 100%)", type: "country" },
  { name: "China", cssHex: "radial-gradient(circle at 24% 28%, #ffde00 0 7%, transparent 8%), #de2910", type: "country" },
  { name: "Russia", cssHex: "linear-gradient(to bottom,#ffffff 0 33%,#0039a6 33% 66%,#d52b1e 66% 100%)", type: "country" },
  { name: "South Korea", cssHex: "linear-gradient(90deg, transparent 0 18%, #111111 18% 21%, transparent 21% 79%, #111111 79% 82%, transparent 82% 100%), linear-gradient(0deg, transparent 0 18%, #111111 18% 21%, transparent 21% 79%, #111111 79% 82%, transparent 82% 100%), radial-gradient(circle at 50% 43%, #c60c30 0 15%, transparent 15.5%), radial-gradient(circle at 50% 57%, #003478 0 15%, transparent 15.5%), #ffffff", type: "country" },
  { name: "North Korea", cssHex: "radial-gradient(circle at 28% 50%, #ffffff 0 10%, #ed1c27 11% 16%, transparent 17%), linear-gradient(to bottom,#024fa2 0 20%,#ffffff 20% 24%,#ed1c27 24% 76%,#ffffff 76% 80%,#024fa2 80% 100%)", type: "country" },
  { name: "Australia", cssHex: "radial-gradient(circle at 78% 28%, #ffffff 0 4%, transparent 5%), radial-gradient(circle at 72% 58%, #ffffff 0 3%, transparent 4%), radial-gradient(circle at 86% 72%, #ffffff 0 3%, transparent 4%), linear-gradient(to right, #ffffff 0 10%, #c8102e 10% 16%, #ffffff 16% 22%, transparent 22% 100%), linear-gradient(to bottom, #012169 0 10%, #ffffff 10% 16%, #c8102e 16% 22%, #ffffff 22% 28%, #012169 28% 100%)", type: "country" },
  { name: "Turkey", cssHex: "radial-gradient(circle at 46% 50%, #e30a17 0 12%, transparent 13%), radial-gradient(circle at 40% 50%, #ffffff 0 18%, transparent 19%), #e30a17", type: "country" },
  { name: "Qatar", cssHex: "linear-gradient(to right,#ffffff 0 28%,#8a1538 28% 100%)", type: "country" },
  { name: "Saudi Arabia", cssHex: "linear-gradient(to bottom, rgba(255,255,255,0.0) 0 58%, rgba(255,255,255,0.9) 58% 64%, rgba(255,255,255,0.0) 64% 100%), radial-gradient(circle at 72% 38%, rgba(255,255,255,0.95) 0 2%, transparent 3%), #006c35", type: "country" },
  { name: "Ukraine", cssHex: "linear-gradient(to bottom,#0057b7 0 50%,#ffd700 50% 100%)", type: "country" },
  { name: "Israel", cssHex: "linear-gradient(60deg, transparent 0 44%, #0038b8 44% 48%, transparent 48% 100%), linear-gradient(-60deg, transparent 0 44%, #0038b8 44% 48%, transparent 48% 100%), linear-gradient(0deg, transparent 0 47%, #0038b8 47% 51%, transparent 51% 100%), linear-gradient(to bottom,#ffffff 0 18%,#0038b8 18% 26%,#ffffff 26% 74%,#0038b8 74% 82%,#ffffff 82% 100%)", type: "country" },
  { name: "Uganda", cssHex: "linear-gradient(to bottom,#000000 0 16%,#fcdc04 16% 32%,#d90000 32% 48%,#000000 48% 64%,#fcdc04 64% 80%,#d90000 80% 100%)", type: "country" },
  { name: "Jamaica", cssHex: "linear-gradient(35deg, transparent 0 42%, #fed100 43% 56%, transparent 57%), linear-gradient(-35deg, #009b3a 0 42%, #fed100 43% 56%, #000000 57% 100%)", type: "country" },
  { name: "Colombia", cssHex: "linear-gradient(to bottom,#fcd116 0 50%,#003893 50% 75%,#ce1126 75% 100%)", type: "country" },
];

const OTHER_COLORS = [
  { name: "Sky Blue", hex: "#87ceeb" },
  { name: "Charcoal", hex: "#36454f" },
  { name: "Salmon", hex: "#fa8072" },
  { name: "Chartreuse", hex: "#7fff00" },
  { name: "Beige", hex: "#f5f5dc" },
  { name: "Off White", hex: "#f8f7f2" },
  { name: "Scarlet", hex: "#ff2400" },
  { name: "Red Orange", hex: "#ff5349" },
  { name: "Mint", hex: "#98ff98" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Periwinkle", hex: "#ccccff" },
  { name: "Coral", hex: "#ff7f50" },
  { name: "Amber", hex: "#ffbf00" },
  { name: "Forest", hex: "#228b22" },
  { name: "Plum", hex: "#8e4585" },
  { name: "Rose", hex: "#ff007f" },
  { name: "Ice", hex: "#dff6ff" },
  { name: "Chocolate", hex: "#7b3f00" },
  { name: "Crimson", hex: "#dc143c" },
  { name: "Seafoam", hex: "#93e9be" },
  { name: "Electric Blue", hex: "#00ffff" },
  { name: "Violet", hex: "#7f00ff" },
  { name: "Peach", hex: "#ffb07c" },
  { name: "Slate", hex: "#708090" },
];

const SPECIAL_COLORS = [
  { name: "Rainbow", hex: "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #8b00ff)", type: "rainbow" },
  { name: "Negative", hex: "repeating-radial-gradient(circle at 30% 30%, #ffffff 0px, #d9d9d9 14px, #999999 26px, #ffffff 42px)", type: "negative" },
  { name: "Checkerboard", hex: "conic-gradient(#ff0000 25%, #000000 0 50%, #ff0000 0 75%, #000000 0)", cssHex: "conic-gradient(#ff0000 25%, #000000 0 50%, #ff0000 0 75%, #000000 0)", backgroundSize: "18px 18px", type: "checkerboard" },
  { name: "Static", hex: "url(#staticPattern)", cssHex: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9) 0 1px, transparent 1px 100%), radial-gradient(circle at 80% 30%, rgba(0,0,0,0.95) 0 1px, transparent 1px 100%), radial-gradient(circle at 40% 70%, rgba(180,180,180,0.9) 0 1px, transparent 1px 100%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.85) 0 1px, transparent 1px 100%), #7d7d7d", backgroundSize: "6px 6px, 7px 7px, 5px 5px, 8px 8px, auto", type: "static" },
  { name: "Camo", hex: "#556b2f", cssHex: "radial-gradient(ellipse at 18% 22%, #6b8e23 0%, #6b8e23 12%, transparent 13%), radial-gradient(ellipse at 42% 30%, #3f4f24 0%, #3f4f24 16%, transparent 17%), radial-gradient(ellipse at 70% 20%, #2f3e1f 0%, #2f3e1f 14%, transparent 15%), radial-gradient(ellipse at 82% 46%, #556b2f 0%, #556b2f 18%, transparent 19%), radial-gradient(ellipse at 26% 58%, #4b5320 0%, #4b5320 15%, transparent 16%), radial-gradient(ellipse at 58% 66%, #6b8e23 0%, #6b8e23 17%, transparent 18%), radial-gradient(ellipse at 76% 74%, #2f3e1f 0%, #2f3e1f 13%, transparent 14%), radial-gradient(ellipse at 38% 82%, #3b5323 0%, #3b5323 16%, transparent 17%), #556b2f", backgroundSize: "220px 220px", type: "camo" },
  { name: "Oil Spill", hex: "#050505", cssHex: "radial-gradient(circle at 22% 28%, rgba(0,255,255,0.95) 0%, rgba(0,255,255,0.15) 18%, transparent 32%), radial-gradient(circle at 76% 36%, rgba(255,0,255,0.9) 0%, rgba(255,0,255,0.12) 20%, transparent 34%), radial-gradient(circle at 48% 74%, rgba(255,255,0,0.85) 0%, rgba(255,255,0,0.12) 16%, transparent 30%), radial-gradient(circle at 82% 78%, rgba(0,120,255,0.75) 0%, rgba(0,120,255,0.1) 14%, transparent 26%), radial-gradient(circle at 35% 54%, rgba(0,255,120,0.72) 0%, rgba(0,255,120,0.08) 18%, transparent 30%), radial-gradient(circle at 60% 18%, rgba(255,120,0,0.65) 0%, rgba(255,120,0,0.06) 14%, transparent 26%), #050505", backgroundSize: "220% 220%, 180% 180%, 200% 200%, 240% 240%, 210% 210%, 170% 170%, auto", type: "oilspill" },
];

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function textColor(hex) {
  if (!hex || !hex.startsWith("#")) return "#ffffff";
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#111827" : "#ffffff";
}

function getSolidFill(color) {
  if (color.type === "rainbow") return "#ff00ff";
  if (color.type === "negative") return "#ffffff";
  if (color.type === "checkerboard") return "#ff0000";
  if (color.type === "static") return "#bfbfbf";
  if (color.type === "oilspill") return "#7c3aed";
  if (color.type === "camo") return "#556b2f";
  if (color.type === "country") return color.cssHex?.match(/#[0-9a-fA-F]{6}/)?.[0] || "#888888";
  return color.hex;
}

function getWheelRepeatCount(colorCount) {
  if (colorCount <= 2) return 12;
  if (colorCount === 3) return 8;
  if (colorCount <= 4) return 6;
  if (colorCount <= 6) return 4;
  if (colorCount <= 8) return 3;
  if (colorCount <= 12) return 2;
  return 1;
}

function buildWheelSlices(colors) {
  const repeatCount = getWheelRepeatCount(colors.length);
  return Array.from({ length: repeatCount }).flatMap(() => colors);
}

function uniqueNames(order) {
  return [...new Set(order.filter(Boolean))];
}

function reorderNames(order, draggedName, targetName) {
  const cleanOrder = uniqueNames(order);
  if (!draggedName || !targetName || draggedName === targetName) return cleanOrder;
  const next = [...cleanOrder];
  const from = next.indexOf(draggedName);
  const to = next.indexOf(targetName);
  if (from === -1 || to === -1) return cleanOrder;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return uniqueNames(next);
}

function getValidColorOptions(player, availableColors, previousPlayerColors, playerColorHistory, noRepeats) {
  if (!player || availableColors.length === 0) return [];

  if (!noRepeats) {
    const lastColor = previousPlayerColors[player.name];
    const nonBackToBack = availableColors.filter((c) => c.name !== lastColor);
    return nonBackToBack.length > 0 ? nonBackToBack : availableColors;
  }

  const visited = new Set(playerColorHistory[player.name] || []);
  const unvisited = availableColors.filter((c) => !visited.has(c.name));
  return unvisited.length > 0 ? unvisited : availableColors;
}

function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
}

function makeInitialGame(players = [], colors = COLORS, userPicksColors = false, sortEliminated = false, noRepeats = false) {
  return {
    round: 0,
    phase: "setup",
    players,
    colors,
    userPicksColors,
    sortEliminated,
    noRepeats,
    assignments: {},
    pickingOrder: [],
    currentPickIndex: 0,
    eliminated: [],
    lockedColorOrder: [],
    occupiedColors: {},
    previousPlayerColors: {},
    playerColorHistory: {},
    spinnerRotation: 0,
    currentSpin: null,
    revealedSpin: null,
    pendingElimination: null,
    log: [],
    winner: null,
  };
}

export default function ColorBlitzPage() {
  const router = useRouter();
  const [availableCasts, setAvailableCasts] = useState([]);
  const [castPool, setCastPool] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [selectedCast, setSelectedCast] = useState(() => new Set());
  const [selectedColors, setSelectedColors] = useState(() => new Set(COLORS.map((c) => c.name)));
  const [selectedOtherColors, setSelectedOtherColors] = useState(new Set());
  const [selectedSpecialColors, setSelectedSpecialColors] = useState(new Set());
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [colorOrder, setColorOrder] = useState(() => COLORS.map((c) => c.name));
  const [userPicksColors, setUserPicksColors] = useState(false);
  const [sortEliminated, setSortEliminated] = useState(false);
  const [noRepeats, setNoRepeats] = useState(false);
  const [game, setGame] = useState(makeInitialGame());
  const [isSpinning, setIsSpinning] = useState(false);
  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  useEffect(() => {
    loadSavedCasts();
  }, []);

  async function loadSavedCasts() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data: favoriteData } = await supabase
  .from("favorite_casts")
  .select("cast_id")
  .eq("user_id", userData.user.id);

const favoriteOfficialCastIds = (favoriteData || []).map((fav) => fav.cast_id);

const { data: userCasts, error: userCastsError } = await supabase
  .from("casts")
  .select("id, name, show_name, created_at, is_official")
  .eq("user_id", userData.user.id)
  .order("created_at", { ascending: false });

if (userCastsError) {
  alert(userCastsError.message);
  return;
}

let officialCasts = [];

if (favoriteOfficialCastIds.length > 0) {
  const { data: officialData, error: officialError } = await supabase
    .from("casts")
    .select("id, name, show_name, created_at, is_official")
    .in("id", favoriteOfficialCastIds)
    .eq("is_official", true)
    .order("name", { ascending: true });

  if (officialError) {
    alert(officialError.message);
    return;
  }

  officialCasts = officialData || [];
}

const castData = [...officialCasts, ...(userCasts || [])];

setAvailableCasts(castData || []);
    setCastPool([]);
    setSelectedCast(new Set());
    setLoadingCasts(false);
  }

  async function openAddCastModal() {
    setShowAddCastModal(true);

    if (!modalCastId && availableCasts.length > 0) {
      await loadContestantsForModal(availableCasts[0].id);
    }
  }

  async function loadContestantsForModal(castId) {
    setModalCastId(castId);
    setModalSelectedIds(new Set());
    setLoadingModalContestants(true);

    const { data, error } = await supabase
      .from("contestants")
      .select("id, name, image_url, cast_id")
      .eq("cast_id", castId)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      setLoadingModalContestants(false);
      return;
    }

    setModalContestants(data || []);
    setLoadingModalContestants(false);
  }

  function toggleModalContestant(id) {
    setModalSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllModalContestants() {
    setModalSelectedIds(new Set(modalContestants.map((person) => person.id)));
  }

  function selectNoneModalContestants() {
    setModalSelectedIds(new Set());
  }

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));

    if (selectedPeople.length === 0) return;

    setCastPool((current) => {
      const existingNames = new Set(current.map((player) => player.name));
      const additions = selectedPeople
        .filter((person) => !existingNames.has(person.name))
        .map((person) => ({
          name: person.name,
          img: person.image_url || "",
          sourceCastId: person.cast_id || modalCastId,
        }));

      const nextRoster = [...current, ...additions];
      setSelectedCast(new Set(nextRoster.map((player) => player.name)));
      return nextRoster;
    });

    setModalSelectedIds(new Set());
    setShowAddCastModal(false);
    setGame(makeInitialGame());
  }

  function removeFromRoster(playerName) {
    setCastPool((current) => current.filter((player) => player.name !== playerName));
    setSelectedCast((current) => {
      const next = new Set(current);
      next.delete(playerName);
      return next;
    });
    setGame(makeInitialGame());
  }

  function clearRoster() {
    const confirmClear = confirm("Clear the current Color Blitz roster?");
    if (!confirmClear) return;
    setCastPool([]);
    setSelectedCast(new Set());
    setGame(makeInitialGame());
  }

  const gamePlayers = game.players || castPool;
  const gameColors = game.colors || COLORS;

  const chosenCast = useMemo(() => castPool.filter((p) => selectedCast.has(p.name)), [castPool, selectedCast]);
  const chosenColors = useMemo(() => {
    const allColorMap = new Map([...COLORS, ...OTHER_COLORS, ...SPECIAL_COLORS, ...COUNTRY_COLORS].map((c) => [c.name, c]));
    const orderedSelected = colorOrder
      .filter((name) => selectedColors.has(name) || selectedOtherColors.has(name) || selectedSpecialColors.has(name) || selectedCountries.has(name))
      .map((name) => allColorMap.get(name))
      .filter(Boolean);
    const orderedNames = new Set(orderedSelected.map((c) => c.name));
    const selectedOthersNotPlaced = OTHER_COLORS.filter((c) => selectedOtherColors.has(c.name) && !orderedNames.has(c.name));
    const selectedSpecialsNotPlaced = SPECIAL_COLORS.filter((c) => selectedSpecialColors.has(c.name) && !orderedNames.has(c.name));
    const selectedCountriesNotPlaced = COUNTRY_COLORS.filter((c) => selectedCountries.has(c.name) && !orderedNames.has(c.name));
    return [...orderedSelected, ...selectedOthersNotPlaced, ...selectedSpecialsNotPlaced, ...selectedCountriesNotPlaced];
  }, [selectedColors, selectedOtherColors, selectedSpecialColors, selectedCountries, colorOrder]);

  const setupError = chosenColors.length < 2 ? "Select at least 2 colors." : chosenCast.length < 1 ? "Add at least 1 cast member to the current roster." : "";
  const eliminatedNames = useMemo(() => new Set(game.eliminated.map((e) => e.player?.name)), [game.eliminated]);
  const alivePlayers = useMemo(() => gamePlayers.filter((p) => !eliminatedNames.has(p.name)), [gamePlayers, eliminatedNames]);
  const remainingColorCount = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name)).length;

  const canBlitz = !isSpinning && !game.winner && game.phase !== "spinning" && alivePlayers.length >= 1 && remainingColorCount > 1;
  const canSpin = !isSpinning && !game.winner && game.phase === "readyToSpin";
  const canAdvance = !isSpinning && !game.winner && game.phase === "spinResult" && Boolean(game.pendingElimination);
  const canMainAction = game.phase === "setup" ? !setupError : canAdvance || canSpin || canBlitz || game.phase === "colorPicking";

  const mainActionLabel = game.phase === "setup" ? "Start Game" : game.phase === "colorPicking" ? "Random Pick" : canAdvance ? "Advance" : canSpin ? "Spin" : canBlitz ? "Color Blitz" : game.winner ? "Game Over" : "Waiting";
  const mainActionIcon = canSpin ? <RotateCw className="mr-2 h-4 w-4" /> : canAdvance ? null : <Shuffle className="mr-2 h-4 w-4" />;

  function startGame() {
    if (setupError) return;
    const colors = chosenColors;
    const players = chosenCast.length > colors.length ? shuffleArray(chosenCast).slice(0, colors.length) : shuffleArray(chosenCast);
    setIsSpinning(false);
    setGame({ ...makeInitialGame(players, colors, userPicksColors, sortEliminated, noRepeats), phase: "eliminated" });
  }

  function colorBlitz() {
    const openColors = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name));
    if (alivePlayers.length < 1 || openColors.length <= 1) return;
    const shuffledPlayers = shuffleArray(alivePlayers);

    if (game.userPicksColors) {
      setGame((g) => ({ ...g, round: g.round + 1, phase: "colorPicking", assignments: {}, pickingOrder: shuffledPlayers, currentPickIndex: 0, currentSpin: null, revealedSpin: null, pendingElimination: null, log: [`Round ${g.round + 1}: Color Blitz! Pick colors for each active player.`, ...g.log].slice(0, 20) }));
      return;
    }

    const assignments = {};
    const usedColors = new Set();
    const nextPreviousPlayerColors = {};
    shuffledPlayers.forEach((player) => {
      const availableColors = openColors.filter((c) => !usedColors.has(c.name));
      const options = getValidColorOptions(
        player,
        availableColors,
        game.previousPlayerColors,
        game.playerColorHistory,
        game.noRepeats
      );
      const chosen = options[Math.floor(Math.random() * options.length)];
      assignments[chosen.name] = player;
      nextPreviousPlayerColors[player.name] = chosen.name;
      usedColors.add(chosen.name);
    });

    setGame((g) => {
      const nextPlayerColorHistory = { ...g.playerColorHistory };
      Object.entries(assignments).forEach(([colorName, player]) => {
        const existing = new Set(nextPlayerColorHistory[player.name] || []);
        existing.add(colorName);
        nextPlayerColorHistory[player.name] = [...existing];
      });

      return {
        ...g,
        round: g.round + 1,
        phase: "readyToSpin",
        assignments,
        pickingOrder: [],
        currentPickIndex: 0,
        currentSpin: null,
        revealedSpin: null,
        pendingElimination: null,
        previousPlayerColors: nextPreviousPlayerColors,
        playerColorHistory: nextPlayerColorHistory,
        log: [`Round ${g.round + 1}: Color Blitz! Everyone randomly picked a color.`, ...g.log].slice(0, 20),
      };
    });
  }

  function pickManualColor(colorName) {
    if (game.phase !== "colorPicking") return;
    const openColors = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name));
    const usedColors = new Set(Object.keys(game.assignments));
    if (usedColors.has(colorName) || !openColors.some((c) => c.name === colorName)) return;
    const player = game.pickingOrder[game.currentPickIndex];
    if (!player) return;
    const availableColors = openColors.filter((c) => !usedColors.has(c.name));
    const validOptions = getValidColorOptions(
      player,
      availableColors,
      game.previousPlayerColors,
      game.playerColorHistory,
      game.noRepeats
    );
    if (!validOptions.some((c) => c.name === colorName)) return;

    setGame((g) => {
      const currentPlayer = g.pickingOrder[g.currentPickIndex];
      const nextAssignments = { ...g.assignments, [colorName]: currentPlayer };
      const nextPreviousPlayerColors = { ...g.previousPlayerColors, [currentPlayer.name]: colorName };
      const nextPlayerColorHistory = { ...g.playerColorHistory };
      const existing = new Set(nextPlayerColorHistory[currentPlayer.name] || []);
      existing.add(colorName);
      nextPlayerColorHistory[currentPlayer.name] = [...existing];
      const nextIndex = g.currentPickIndex + 1;
      return {
        ...g,
        assignments: nextAssignments,
        previousPlayerColors: nextPreviousPlayerColors,
        playerColorHistory: nextPlayerColorHistory,
        currentPickIndex: nextIndex,
        phase: nextIndex >= g.pickingOrder.length ? "readyToSpin" : "colorPicking",
        log: [`${currentPlayer.name} picked ${colorName}.`, ...g.log].slice(0, 20),
      };
    });
  }

  function spin() {
    if (isSpinning || game.phase !== "readyToSpin" || game.winner) return;
    const liveColorNames = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name)).map((c) => c.name);
    if (!liveColorNames.length) return;
    const wheelColors = gameColors.filter((c) => liveColorNames.includes(c.name));
    const wheelSlices = buildWheelSlices(wheelColors);
    const targetSliceIndex = Math.floor(Math.random() * wheelSlices.length);
    const targetColorName = wheelSlices[targetSliceIndex].name;
    const slice = 360 / wheelSlices.length;
    const targetAngle = (360 - (targetSliceIndex * slice + slice / 2)) % 360;
    const currentAngle = ((game.spinnerRotation % 360) + 360) % 360;
    const correction = (targetAngle - currentAngle + 360) % 360;
    const finalRotation = game.spinnerRotation + (6 + Math.floor(Math.random() * 4)) * 360 + correction;

    setIsSpinning(true);
    setGame((g) => ({ ...g, spinnerRotation: finalRotation, currentSpin: targetColorName, revealedSpin: null, phase: "spinning" }));
    setTimeout(() => {
      setIsSpinning(false);
      setTimeout(() => {
        setGame((g) => {
          const player = g.assignments[targetColorName] || null;
          const spinMessage = player ? `The spinner landed on ${targetColorName} and hit ${player.name}. Press Advance to execute it.` : `The spinner landed on ${targetColorName} with nobody on it. Press Advance to execute it.`;
          return { ...g, phase: "spinResult", revealedSpin: targetColorName, pendingElimination: { player, color: targetColorName, round: g.round }, log: [spinMessage, ...g.log].slice(0, 20) };
        });
      }, 1000);
    }, 3300);
  }

  function advanceResult() {
    if (!canAdvance) return;
    setGame((g) => {
      const result = g.pendingElimination;
      const nextEliminated = result.player ? [...g.eliminated, result] : g.eliminated;
      const nextOccupiedColors = { ...g.occupiedColors, [result.color]: result.player || null };
      const nextLockedColorOrder = g.lockedColorOrder.includes(result.color) ? g.lockedColorOrder : [...g.lockedColorOrder, result.color];
      const remainingColors = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(nextOccupiedColors, c.name));
      const remainingPlayers = gamePlayers.filter((p) => !nextEliminated.some((e) => e.player?.name === p.name));
      const winner = remainingPlayers.length === 0 ? { name: `${remainingColors[0]?.name || "No Color"} wins`, img: "" } : remainingColors.length === 1 ? (remainingPlayers[0] || { name: `${remainingColors[0].name} wins`, img: "" }) : null;
      return { ...g, phase: winner ? "finished" : "eliminated", eliminated: nextEliminated, occupiedColors: nextOccupiedColors, lockedColorOrder: nextLockedColorOrder, lastSpunColor: result.color, assignments: result.player ? { ...g.assignments, [result.color]: result.player } : g.assignments, pendingElimination: null, revealedSpin: null, winner, log: [result.player ? `${result.player.name} was eliminated on ${result.color}.` : `${result.color} was eliminated with nobody on it.`, ...g.log].slice(0, 20) };
    });
  }

  function handleMainAction() {
    if (game.phase === "setup") return startGame();
    if (game.phase === "colorPicking") {
      const currentPlayer = game.pickingOrder[game.currentPickIndex];
      if (!currentPlayer) return;
      const usedColors = new Set(Object.keys(game.assignments));
      const availableColors = gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name) && !usedColors.has(c.name));
      const options = getValidColorOptions(
        currentPlayer,
        availableColors,
        game.previousPlayerColors,
        game.playerColorHistory,
        game.noRepeats
      );
      if (options.length > 0) pickManualColor(options[Math.floor(Math.random() * options.length)].name);
      return;
    }
    if (canAdvance) return advanceResult();
    if (canSpin) return spin();
    if (canBlitz) return colorBlitz();
  }

  useEffect(() => {
    function handleSpacebar(event) {
      if (event.code !== "Space") return;
      event.preventDefault();
      if (canMainAction) handleMainAction();
    }
    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  }, [canMainAction, canAdvance, canSpin, canBlitz, game, isSpinning, selectedCast, selectedColors, selectedOtherColors, selectedSpecialColors, selectedCountries, userPicksColors, sortEliminated, noRepeats]);

  const activeWheelColors = useMemo(() => gameColors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name)), [game.occupiedColors, gameColors]);
  const wheelRepeatCount = getWheelRepeatCount(activeWheelColors.length || gameColors.length);
  const visibleWheelSlices = activeWheelColors.length ? buildWheelSlices(activeWheelColors) : gameColors;

  const displayColors = useMemo(() => {
    if (!game.sortEliminated) return gameColors;
    const lockedNames = new Set(game.lockedColorOrder || Object.keys(game.occupiedColors));
    const liveColors = gameColors.filter((c) => !lockedNames.has(c.name));
    const sortedLockedColors = [...(game.lockedColorOrder || Object.keys(game.occupiedColors))].reverse().map((name) => gameColors.find((c) => c.name === name)).filter(Boolean);
    return [...liveColors, ...sortedLockedColors];
  }, [game.sortEliminated, gameColors, game.lockedColorOrder, game.occupiedColors]);

  function restartGame() {
    setIsSpinning(false);
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
    setSavingSeason(false);
    setGame(makeInitialGame());
  }

  async function saveSeason() {
    if (!game.winner) {
      alert("Finish the game first.");
      return;
    }

    setSavingSeason(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("You must be logged in.");
      setSavingSeason(false);
      return;
    }

    const normalizeReplayPlayer = (player, eliminatedNames = new Set()) => ({
      ...player,
      name: player?.name || "Unknown",
      image: player?.image || player?.img || "",
      img: player?.img || player?.image || "",
      eliminated: eliminatedNames.has(player?.name),
    });

    const startingPlayers = gamePlayers.map((player) =>
      normalizeReplayPlayer(player)
    );

    const replaySteps = [
      {
        type: "start",
        title: "Starting Cast",
        text: `Color Blitz begins with ${startingPlayers.length} players.`,
        players: startingPlayers,
      },
    ];

    const eliminatedNames = new Set();

    game.eliminated.forEach((entry, index) => {
      if (entry?.player?.name) {
        eliminatedNames.add(entry.player.name);
      }

      replaySteps.push({
        type: "elimination",
        title: `Elimination ${index + 1}`,
        text: entry?.player?.name
          ? `${entry.player.name} was eliminated on ${entry.color}.`
          : `${entry?.color || "A color"} was eliminated with nobody on it.`,
        color: entry?.color || null,
        eliminatedPlayer: entry?.player
          ? normalizeReplayPlayer(entry.player)
          : null,
        players: startingPlayers.map((player) =>
          normalizeReplayPlayer(player, eliminatedNames)
        ),
      });
    });

    replaySteps.push({
      type: "winner",
      title: "Winner",
      text: `${game.winner.name} wins Color Blitz!`,
      winner: normalizeReplayPlayer(game.winner),
      players: startingPlayers.map((player) =>
        normalizeReplayPlayer(player, eliminatedNames)
      ),
    });

    const saveData = {
      simulator: "color-blitz",
      season: replaySteps,
      players: startingPlayers,
      colors: gameColors,
      eliminated: game.eliminated,
      winner: normalizeReplayPlayer(game.winner),
      log: game.log,
      rounds: game.round,
      occupiedColors: game.occupiedColors,
      lockedColorOrder: game.lockedColorOrder,
      settings: {
        userPicksColors,
        sortEliminated,
        noRepeats,
      },
      preview: {
        startingCast: startingPlayers,
        winner: normalizeReplayPlayer(game.winner),
      },
    };

    const { data, error } = await supabase
      .from("saved_seasons")
      .insert({
        user_id: userData.user.id,
        simulator_type: "color-blitz",
        title:
          seasonTitle.trim() ||
          `${game.winner.name} Wins Color Blitz`,
        summary:
          seasonSummary.trim() ||
          `${game.winner.name} won Color Blitz after ${game.eliminated.length} eliminations.`,
        data_json: saveData,
        is_public: isPublicSeason,
        allow_comments: true,
      })
      .select()
      .single();

    setSavingSeason(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/seasons/${data.id}`);
  }

 return (
  <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
    <Navbar />

    <div className="mx-auto max-w-[1600px] space-y-5 p-2 sm:p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-red-400 via-yellow-300 via-green-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Color Blitz</h1>
            <p className="text-slate-300 mt-1">Random colors. Brutal spinner. Last player or color standing wins.</p>
          </div>
          <Button onClick={handleMainAction} disabled={!canMainAction} className="rounded-2xl shadow-lg min-w-[145px] flex-1 sm:flex-none md:flex-none">
            {mainActionIcon} {mainActionLabel}
          </Button>
        </div>

        {game.phase === "setup" ? (
          <SetupMenu
            selectedCast={selectedCast}
            setSelectedCast={setSelectedCast}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedOtherColors={selectedOtherColors}
            setSelectedOtherColors={setSelectedOtherColors}
            selectedSpecialColors={selectedSpecialColors}
            setSelectedSpecialColors={setSelectedSpecialColors}
            selectedCountries={selectedCountries}
            setSelectedCountries={setSelectedCountries}
            colorOrder={colorOrder}
            setColorOrder={setColorOrder}
            userPicksColors={userPicksColors}
            setUserPicksColors={setUserPicksColors}
            sortEliminated={sortEliminated}
            setSortEliminated={setSortEliminated}
            noRepeats={noRepeats}
            setNoRepeats={setNoRepeats}
            chosenCast={chosenCast}
            chosenColors={chosenColors}
            setupError={setupError}
            availableCasts={availableCasts}
            loadingCasts={loadingCasts}
            castPool={castPool}
            openAddCastModal={openAddCastModal}
            removeFromRoster={removeFromRoster}
            clearRoster={clearRoster}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Round" value={game.round} />
              <StatCard label="Alive" value={alivePlayers.length} />
              <StatCard label="Eliminated" value={game.eliminated.length} />
              <StatCard label="Remaining Colors" value={remainingColorCount} />
            </div>

            <AnimatePresence>
              {game.winner && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-yellow-300/60 bg-yellow-400/15 p-4 flex items-center gap-4 shadow-2xl">
                  <Trophy className="h-10 w-10 text-yellow-300" />
                  {game.winner.img ? <img src={game.winner.img} className="h-20 w-20 rounded-2xl object-cover border-2 border-yellow-300" /> : null}
                  <div>
                    <div className="text-2xl font-black">{game.winner.name} wins Color Blitz!</div>
                    <div className="text-yellow-100">All remaining players/colors have been resolved.</div>
                    <Button onClick={restartGame} className="mt-3 rounded-2xl bg-yellow-300 text-black hover:bg-yellow-200 font-black">Restart Game</Button>

                    <div className="mt-6 space-y-3 max-w-xl">
                      <input
                        type="text"
                        value={seasonTitle}
                        onChange={(e) => setSeasonTitle(e.target.value)}
                        placeholder="Season Title"
                        className="w-full rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-white"
                      />

                      <textarea
                        value={seasonSummary}
                        onChange={(e) => setSeasonSummary(e.target.value)}
                        placeholder="Season Summary"
                        className="w-full rounded-2xl bg-slate-900 border border-slate-700 px-4 py-3 text-white min-h-[120px]"
                      />

                      <label className="flex items-center gap-3 font-bold">
                        <input
                          type="checkbox"
                          checked={isPublicSeason}
                          onChange={(e) => setIsPublicSeason(e.target.checked)}
                        />
                        Post publicly to community
                      </label>

                      <Button
                        onClick={saveSeason}
                        disabled={savingSeason}
                        className="rounded-2xl bg-blue-600 hover:bg-blue-500"
                      >
                        {savingSeason ? "Saving..." : "Save Season"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {game.phase === "readyToSpin" || game.phase === "spinning" || game.phase === "spinResult" ? (
              <SpinnerPanel wheelSlices={visibleWheelSlices} rotation={game.spinnerRotation} currentSpin={game.currentSpin} isSpinning={isSpinning} pendingElimination={game.pendingElimination} activeWheelColors={activeWheelColors} wheelRepeatCount={wheelRepeatCount} visibleSliceCount={visibleWheelSlices.length} canSpin={canSpin} onSpin={spin} />
            ) : (
              <CastGrid players={gamePlayers} eliminatedNames={eliminatedNames} />
            )}

            {game.phase === "colorPicking" && <ManualPickerPanel game={game} colors={gameColors} />}
            <ColorBoard game={game} colors={displayColors} onPickColor={pickManualColor} />

            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
                <CardContent className="p-4">
                  <h2 className="text-xl font-black mb-3 flex items-center gap-2"><Skull className="h-5 w-5" /> Elimination Order</h2>
                  {game.eliminated.length === 0 ? <p className="text-slate-400">No one has been eliminated yet.</p> : (
                    <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {[...game.eliminated].reverse().map((e, i) => (
                        <div key={`${e.player?.name || "empty"}-${i}`} className="flex items-center gap-2 rounded-2xl bg-slate-800 p-2 border border-slate-700 w-fit">
                          <div className="text-slate-400 font-black w-8">#{gamePlayers.length - game.eliminated.length + i + 1}</div>
                          <EliminatedPortrait entry={e} colors={gameColors} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
                <CardContent className="p-4">
                  <h2 className="text-xl font-black mb-3">Game Log</h2>
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {game.log.length === 0 ? <p className="text-slate-400">Game events will appear here.</p> : game.log.map((line, i) => <div key={i} className="rounded-2xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200">{line}</div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {showAddCastModal && (
        <AddCastMembersModal
          casts={availableCasts}
          modalCastId={modalCastId}
          modalContestants={modalContestants}
          modalSelectedIds={modalSelectedIds}
          loadingCasts={loadingCasts}
          loadingContestants={loadingModalContestants}
          onClose={() => setShowAddCastModal(false)}
          onChooseCast={loadContestantsForModal}
          onToggleContestant={toggleModalContestant}
          onSelectAll={selectAllModalContestants}
          onSelectNone={selectNoneModalContestants}
          onAddSelected={addSelectedContestantsToRoster}
        />
      )}
    </div>
  );
}

function SetupMenu(props) {
  const { selectedCast, setSelectedCast, selectedColors, setSelectedColors, selectedOtherColors, setSelectedOtherColors, selectedSpecialColors, setSelectedSpecialColors, selectedCountries, setSelectedCountries, colorOrder, setColorOrder, userPicksColors, setUserPicksColors, sortEliminated, setSortEliminated, noRepeats, setNoRepeats, chosenCast, chosenColors, setupError, availableCasts, loadingCasts, castPool, openAddCastModal, removeFromRoster, clearRoster } = props;
  const [draggedColor, setDraggedColor] = useState(null);
  const allColorMap = useMemo(() => new Map([...COLORS, ...OTHER_COLORS, ...SPECIAL_COLORS, ...COUNTRY_COLORS].map((c) => [c.name, c])), []);
  const orderedColors = colorOrder.map((name) => allColorMap.get(name)).filter(Boolean);
  const orderedSet = new Set(colorOrder);

  function toggleCast(name) {
    setSelectedCast((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function toggleColor(color) {
    if (OTHER_COLORS.some((c) => c.name === color.name)) {
      setSelectedOtherColors((prev) => {
        const next = new Set(prev);
        next.has(color.name) ? next.delete(color.name) : next.add(color.name);
        return next;
      });
    } else if (color.type === "country") {
      setSelectedCountries((prev) => {
        const next = new Set(prev);
        next.has(color.name) ? next.delete(color.name) : next.add(color.name);
        return next;
      });
    } else if (color.type) {
      setSelectedSpecialColors((prev) => {
        const next = new Set(prev);
        next.has(color.name) ? next.delete(color.name) : next.add(color.name);
        return next;
      });
    } else {
      setSelectedColors((prev) => {
        const next = new Set(prev);
        next.has(color.name) ? next.delete(color.name) : next.add(color.name);
        return next;
      });
    }
  }

  function isSelected(color) {
    if (OTHER_COLORS.some((c) => c.name === color.name)) return selectedOtherColors.has(color.name);
    if (color.type === "country") return selectedCountries.has(color.name);
    if (color.type) return selectedSpecialColors.has(color.name);
    return selectedColors.has(color.name);
  }

  function addToOrderDuringDrag(targetName) {
    setColorOrder((order) => {
      if (!draggedColor) return order;
      if (!order.includes(draggedColor)) {
        const targetIndex = order.indexOf(targetName);
        const next = uniqueNames(order.filter((name) => name !== draggedColor));
        next.splice(targetIndex === -1 ? next.length : targetIndex, 0, draggedColor);
        return uniqueNames(next);
      }
      return reorderNames(order, draggedColor, targetName);
    });
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
        <CardContent className="p-4 space-y-2">
          <div className="text-2xl font-black">Main Menu</div>
          <p className="text-slate-300">Choose active cast/colors. Drag colors, specials, or countries into the Color Select order.</p>
          <div className={`rounded-2xl p-3 font-bold ${setupError ? "bg-red-500/15 text-red-100 border border-red-300/40" : "bg-green-500/15 text-green-100 border border-green-300/40"}`}>
            {setupError || `${chosenColors.length} colors selected · ${chosenCast.length} cast selected · ready to start`}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 font-black text-white">
              <input type="checkbox" checked={userPicksColors} onChange={(e) => setUserPicksColors(e.target.checked)} className="h-5 w-5 accent-white" /> User picks colors
            </label>
            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 font-black text-white">
              <input type="checkbox" checked={sortEliminated} onChange={(e) => setSortEliminated(e.target.checked)} className="h-5 w-5 accent-white" /> Sort eliminated
            </label>
            <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 font-black text-white">
              <input type="checkbox" checked={noRepeats} onChange={(e) => setNoRepeats(e.target.checked)} className="h-5 w-5 accent-white" /> No Repeats
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black">Current Simulator Roster ({castPool.length})</h2>
              <p className="text-slate-400 text-sm">
                Add people from official shows or your custom casts. You can mix multiple casts together.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={openAddCastModal} className="rounded-2xl">
                Add Cast Members
              </Button>

              <Link href="/custom-casts" className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-3 font-black">
                Manage Casts
              </Link>

              {castPool.length > 0 && (
                <Button variant="secondary" onClick={clearRoster} className="rounded-2xl">
                  Clear Roster
                </Button>
              )}
            </div>
          </div>

          {loadingCasts ? (
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 text-slate-300">
              Loading available casts...
            </div>
          ) : availableCasts.length === 0 ? (
            <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">
              No official or custom casts found yet.
            </div>
          ) : castPool.length === 0 ? (
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 text-slate-300">
              No one is in the current roster yet. Click Add Cast Members to choose characters.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {castPool.map((p) => (
                <div key={p.name} className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square group">
                  {p.img ? (
                    <img src={p.img} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-1">
                      No Image
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFromRoster(p.name)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-black opacity-90"
                    title="Remove from roster"
                  >
                    ×
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-center text-[10px] md:text-xs font-black py-1 truncate px-1">
                    {p.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-black">Active Cast Select ({chosenCast.length}/{castPool.length})</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setSelectedCast(new Set(castPool.map((p) => p.name)))} className="rounded-2xl">Select All</Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedCast(new Set())} className="rounded-2xl">Select None</Button>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {castPool.map((p) => {
              const active = selectedCast.has(p.name);
              return <button key={p.name} type="button" onClick={() => toggleCast(p.name)} className={`relative rounded-2xl overflow-hidden border aspect-square ${active ? "border-white ring-2 ring-white/60" : "border-slate-700 opacity-35 grayscale"}`}>{p.img ? <img src={p.img} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-1 bg-slate-800">No Image</div>}<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center text-[10px] md:text-xs font-black py-1 truncate px-1">{p.name}</div></button>;
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-black">Color Select ({chosenColors.length}/{COLORS.length + OTHER_COLORS.length + SPECIAL_COLORS.length + COUNTRY_COLORS.length})</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setSelectedColors(new Set(COLORS.map((c) => c.name))); setSelectedOtherColors(new Set(OTHER_COLORS.map((c) => c.name))); setSelectedSpecialColors(new Set(SPECIAL_COLORS.map((c) => c.name))); setSelectedCountries(new Set(COUNTRY_COLORS.map((c) => c.name))); }} className="rounded-2xl">Select All</Button>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedColors(new Set()); setSelectedOtherColors(new Set()); setSelectedSpecialColors(new Set()); setSelectedCountries(new Set()); }} className="rounded-2xl">Select None</Button>
            </div>
          </div>
          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2 min-h-[72px] rounded-2xl border border-dashed border-slate-700 p-2"
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedColor && !colorOrder.includes(draggedColor)) {
                setColorOrder((order) => uniqueNames([...order, draggedColor]));
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDraggedColor(null);
            }}
          >
            {orderedColors.map((color) => {
              const active = isSelected(color);
              return <button key={color.name} type="button" draggable onDragStart={() => setDraggedColor(color.name)} onDragOver={(e) => { e.preventDefault(); addToOrderDuringDrag(color.name); }} onDrop={(e) => { e.preventDefault(); setDraggedColor(null); }} onDragEnd={() => setDraggedColor(null)} onClick={() => toggleColor(color)} className={`h-16 rounded-2xl border-2 font-black text-xs md:text-sm shadow-lg transition overflow-hidden relative cursor-grab active:cursor-grabbing ${active ? "border-white scale-100" : "border-slate-700 opacity-35 scale-95"}`} style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, color: color.name === "White" || color.name === "Beige" || color.name === "Off White" || color.name === "Ice" || color.name === "Finland" || color.name === "Japan" || color.name === "Israel" || color.name === "Georgia" ? "#000000" : "#ffffff" }} title="Click to toggle. Drag to reorder."><div className="absolute inset-0 bg-black/10" /><div className="relative z-10 drop-shadow-lg px-1 truncate">{color.name}</div></button>;
            })}
          </div>
        </CardContent>
      </Card>

      <ColorSourceSection title="Other Colors" colors={OTHER_COLORS} selectedSet={selectedOtherColors} setSelectedSet={setSelectedOtherColors} draggedColor={draggedColor} setDraggedColor={setDraggedColor} colorOrder={colorOrder} setColorOrder={setColorOrder} />
      <ColorSourceSection title="Special Colors" colors={SPECIAL_COLORS} selectedSet={selectedSpecialColors} setSelectedSet={setSelectedSpecialColors} draggedColor={draggedColor} setDraggedColor={setDraggedColor} colorOrder={colorOrder} setColorOrder={setColorOrder} />
      <ColorSourceSection title="Countries" colors={COUNTRY_COLORS} selectedSet={selectedCountries} setSelectedSet={setSelectedCountries} draggedColor={draggedColor} setDraggedColor={setDraggedColor} colorOrder={colorOrder} setColorOrder={setColorOrder} />
    </div>
  );
}

function AddCastMembersModal({ casts, modalCastId, modalContestants, modalSelectedIds, loadingCasts, loadingContestants, onClose, onChooseCast, onToggleContestant, onSelectAll, onSelectNone, onAddSelected }) {
  const officialCasts = casts.filter((cast) => cast.is_official);
  const customCasts = casts.filter((cast) => !cast.is_official);
  const selectedCount = modalSelectedIds.size;

  const groupedOfficial = officialCasts.reduce((groups, cast) => {
    const groupName = cast.show_name || "Official Casts";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(cast);
    return groups;
  }, {});

  const firstCastId = casts[0]?.id || "";

  useEffect(() => {
    if (!modalCastId && firstCastId) {
      onChooseCast(firstCastId);
    }
  }, [modalCastId, firstCastId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-slate-400 text-sm">Pick a show or custom cast, select characters, then add them to this Color Blitz roster.</p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-black text-white">
            Close
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] min-h-0 flex-1 overflow-hidden">
          <div className="border-r border-slate-800 p-4 overflow-auto space-y-4">
            {loadingCasts ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 text-slate-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl bg-red-500/15 border border-red-300/40 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {Object.entries(groupedOfficial).map(([groupName, groupCasts]) => (
                  <div key={groupName}>
                    <h3 className="text-sm uppercase tracking-widest text-slate-400 font-black mb-2">{groupName}</h3>
                    <div className="space-y-2">
                      {groupCasts.map((cast) => (
                        <button
                          key={cast.id}
                          onClick={() => onChooseCast(cast.id)}
                          className={`w-full text-left rounded-2xl border px-4 py-3 font-black ${modalCastId === cast.id ? "bg-blue-600 border-blue-300 text-white" : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"}`}
                        >
                          <div>{cast.name}</div>
                          <div className="text-xs opacity-75">Official</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {customCasts.length > 0 && (
                  <div>
                    <h3 className="text-sm uppercase tracking-widest text-slate-400 font-black mb-2">My Custom Casts</h3>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <button
                          key={cast.id}
                          onClick={() => onChooseCast(cast.id)}
                          className={`w-full text-left rounded-2xl border px-4 py-3 font-black ${modalCastId === cast.id ? "bg-blue-600 border-blue-300 text-white" : "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"}`}
                        >
                          <div>{cast.name}</div>
                          <div className="text-xs opacity-75">{cast.show_name || "Custom Cast"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="text-slate-300 font-black">
                {loadingContestants ? "Loading characters..." : `${modalContestants.length} characters available · ${selectedCount} selected`}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={onSelectAll} className="rounded-2xl">Select All</Button>
                <Button size="sm" variant="secondary" onClick={onSelectNone} className="rounded-2xl">Select None</Button>
                <Button size="sm" onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl">Add Selected</Button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 text-slate-300">Loading characters...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 text-slate-300">No characters in this cast yet.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onToggleContestant(person.id)}
                      className={`relative overflow-hidden rounded-2xl border aspect-square bg-slate-900 ${active ? "border-white ring-2 ring-white/70" : "border-slate-700 opacity-60 hover:opacity-100"}`}
                    >
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-2">
                          No Image
                        </div>
                      )}

                      {active && (
                        <div className="absolute top-1 right-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-black text-white">
                          ✓
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-center text-[10px] md:text-xs font-black py-1 truncate px-1">
                        {person.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSourceSection({ title, colors, selectedSet, setSelectedSet, draggedColor, setDraggedColor, colorOrder, setColorOrder }) {
  const orderedSet = new Set(colorOrder);

  return (
    <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-xl font-black">{title} ({selectedSet.size}/{colors.length})</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setSelectedSet(new Set(colors.map((c) => c.name)))} className="rounded-2xl">Select All</Button>
            <Button size="sm" variant="secondary" onClick={() => setSelectedSet(new Set())} className="rounded-2xl">Select None</Button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
          {colors.filter((color) => !orderedSet.has(color.name)).map((color) => {
            const active = selectedSet.has(color.name);
            return <button key={color.name} type="button" draggable onDragStart={() => setDraggedColor(color.name)} onDragOver={(e) => { e.preventDefault(); setColorOrder((order) => {
              if (!draggedColor) return uniqueNames(order);
              if (!order.includes(draggedColor) && order.includes(color.name)) {
                const targetIndex = order.indexOf(color.name);
                const next = uniqueNames(order.filter((name) => name !== draggedColor));
                next.splice(targetIndex === -1 ? next.length : targetIndex, 0, draggedColor);
                return uniqueNames(next);
              }
              return order.includes(draggedColor) && order.includes(color.name) ? reorderNames(order, draggedColor, color.name) : uniqueNames(order);
            }); }} onDrop={(e) => { e.preventDefault(); setDraggedColor(null); }} onDragEnd={() => setDraggedColor(null)} onClick={() => setSelectedSet((prev) => { const next = new Set(prev); next.has(color.name) ? next.delete(color.name) : next.add(color.name); return next; })} className={`h-16 rounded-2xl border-2 font-black text-xs md:text-sm shadow-lg transition overflow-hidden relative cursor-grab active:cursor-grabbing ${active ? "border-white scale-100" : "border-slate-700 opacity-35 scale-95"}`} style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, color: color.name === "Finland" || color.name === "Japan" || color.name === "Israel" || color.name === "Georgia" ? "#000000" : "#ffffff" }}><div className="absolute inset-0 bg-black/10" /><div className="relative z-10 drop-shadow-lg px-1 truncate">{color.name}</div></button>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }) {
  return <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl"><CardContent className="p-4"><div className="text-slate-400 text-sm font-bold uppercase tracking-wide">{label}</div><div className="text-3xl font-black text-white">{value}</div></CardContent></Card>;
}

function CastGrid({ players, eliminatedNames }) {
  const activeCast = players.filter((p) => !eliminatedNames.has(p.name));
  return <div className="grid grid-cols-6 md:grid-cols-12 gap-2 rounded-3xl bg-slate-900 border border-slate-700 p-3 shadow-xl">{activeCast.map((p) => <div key={p.name} className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square">{p.img ? <img src={p.img} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-400 text-xs font-black text-center p-1">No Image</div>}<div className="absolute bottom-0 left-0 right-0 bg-black/65 text-center text-[10px] md:text-xs font-black py-1 truncate px-1">{p.name}</div></div>)}</div>;
}

function SpinnerPanel({ wheelSlices, rotation, currentSpin, isSpinning, pendingElimination, activeWheelColors, wheelRepeatCount, visibleSliceCount, canSpin, onSpin }) {
  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-700 p-4 shadow-xl flex flex-col md:flex-row items-center justify-center gap-6 min-h-[245px]">
      <div className="relative h-56 w-56 md:h-64 md:w-64 grid place-items-center">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 h-0 w-0 border-l-[16px] border-r-[16px] border-t-[34px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
        <motion.div animate={{ rotate: rotation }} transition={isSpinning ? { duration: 3.2, ease: [0.12, 0.6, 0.16, 1] } : { duration: 0 }} className="h-full w-full rounded-full border-8 border-white shadow-2xl overflow-hidden bg-slate-800">
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="rainbowSlice" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff0000" /><stop offset="18%" stopColor="#ff7f00" /><stop offset="34%" stopColor="#ffff00" /><stop offset="50%" stopColor="#00ff00" /><stop offset="66%" stopColor="#00ffff" /><stop offset="82%" stopColor="#0000ff" /><stop offset="100%" stopColor="#8b00ff" /></linearGradient>
              <radialGradient id="negativeSlice" cx="35%" cy="30%" r="80%"><stop offset="0%" stopColor="#ffffff" /><stop offset="35%" stopColor="#bfbfbf" /><stop offset="55%" stopColor="#ffffff" /><stop offset="75%" stopColor="#7a7a7a" /><stop offset="100%" stopColor="#ffffff" /></radialGradient>
              <pattern id="checkerSlice" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#000000" /><rect x="0" y="0" width="6" height="6" fill="#ff0000" /><rect x="12" y="0" width="6" height="6" fill="#ff0000" /><rect x="6" y="6" width="6" height="6" fill="#ff0000" /><rect x="18" y="6" width="6" height="6" fill="#ff0000" /><rect x="0" y="12" width="6" height="6" fill="#ff0000" /><rect x="12" y="12" width="6" height="6" fill="#ff0000" /><rect x="6" y="18" width="6" height="6" fill="#ff0000" /><rect x="18" y="18" width="6" height="6" fill="#ff0000" /></pattern>
              <pattern id="staticSlice" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#7d7d7d" /><rect x="1" y="2" width="1.5" height="1.5" fill="#fff" /><rect x="4" y="1" width="1.5" height="1.5" fill="#111" /><rect x="7" y="3" width="1.5" height="1.5" fill="#d4d4d4" /><rect x="10" y="2" width="1.5" height="1.5" fill="#000" /><rect x="13" y="4" width="1.5" height="1.5" fill="#f5f5f5" /><rect x="16" y="1" width="1.5" height="1.5" fill="#2a2a2a" /></pattern>
              <pattern id="camoSlice" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#556b2f" /><path d="M5 18 C22 2, 48 8, 54 24 C46 42, 22 44, 8 36 Z" fill="#6b8e23" /><path d="M62 10 C82 -2, 108 8, 114 26 C102 44, 78 42, 64 32 Z" fill="#2f3e1f" /><path d="M28 48 C46 34, 74 42, 80 60 C72 76, 42 78, 26 66 Z" fill="#3f4f24" /><path d="M84 58 C102 44, 118 50, 118 70 C108 88, 86 90, 74 76 Z" fill="#4b5320" /></pattern>
            </defs>
            {wheelSlices.map((color, i) => {
              const start = (i / wheelSlices.length) * 360;
              const end = ((i + 1) / wheelSlices.length) * 360;
              const fill = color.type === "rainbow" ? "url(#rainbowSlice)" : color.type === "negative" ? "url(#negativeSlice)" : color.type === "checkerboard" ? "url(#checkerSlice)" : color.type === "static" ? "url(#staticSlice)" : color.type === "camo" ? "url(#camoSlice)" : getSolidFill(color);

              if (color.type === "country") {
                const clipId = `countryClip-${i}`;
                const rotation = start + (end - start) / 2 - 90;
                return <g key={`${color.name}-${i}`}><defs><clipPath id={clipId}><path d={describeArc(100, 100, 100, start, end)} /></clipPath></defs><g clipPath={`url(#${clipId})`}><g transform={`translate(100 100) rotate(${rotation}) translate(-100 -100)`}><foreignObject x="15" y="50" width="170" height="100"><div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "170px", height: "100px", background: color.cssHex || getSolidFill(color) }} /></foreignObject></g></g><path d={describeArc(100, 100, 100, start, end)} fill="transparent" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" /></g>;
              }

              if (color.type === "oilspill") {
                const clipId = `oilClip-${i}`;
                return <g key={`${color.name}-${i}`}><defs><clipPath id={clipId}><path d={describeArc(100, 100, 100, start, end)} /></clipPath></defs><g clipPath={`url(#${clipId})`}><rect x="0" y="0" width="200" height="200" fill="#030303" /><ellipse cx="38" cy="42" rx="58" ry="20" fill="rgba(0,255,255,0.62)" transform={`rotate(${start + 18} 38 42)`} /><ellipse cx="136" cy="54" rx="62" ry="22" fill="rgba(255,0,255,0.58)" transform={`rotate(${end - 18} 136 54)`} /><ellipse cx="78" cy="86" rx="74" ry="24" fill="rgba(255,255,0,0.46)" transform={`rotate(${start + end + 12} 78 86)`} /><ellipse cx="154" cy="102" rx="48" ry="17" fill="rgba(0,120,255,0.48)" /></g><path d={describeArc(100, 100, 100, start, end)} fill="transparent" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" /></g>;
              }

              return <path key={`${color.name}-${i}`} d={describeArc(100, 100, 100, start, end)} fill={fill} stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />;
            })}
          </svg>
        </motion.div>
        <button type="button" onClick={canSpin ? onSpin : undefined} disabled={!canSpin} className={`absolute h-20 w-20 rounded-full bg-slate-950 border-4 border-white grid place-items-center font-black text-sm text-center px-2 shadow-xl transition ${canSpin ? "cursor-pointer hover:scale-105 hover:bg-slate-800 active:scale-95" : "cursor-default"}`}>
          <div className="leading-tight">{canSpin ? <><div>SPIN</div><div className="text-[10px] opacity-80">{visibleSliceCount} SLICES</div></> : <><div>{activeWheelColors.length ? activeWheelColors.length : 24}</div><div>COLORS</div></>}</div>
        </button>
      </div>
      <div className="text-center md:text-left max-w-md"><div className="text-sm uppercase tracking-widest text-slate-400 font-black">Spinner</div><div className="text-3xl md:text-5xl font-black mt-1">{isSpinning ? "Spinning..." : currentSpin || "Ready"}</div><p className="text-slate-300 mt-2">Only the {activeWheelColors.length || 24} active colors are on the wheel. Each appears {wheelRepeatCount} time{wheelRepeatCount === 1 ? "" : "s"}.</p>{pendingElimination && <div className="mt-4 rounded-2xl bg-red-500/15 border border-red-300/40 p-3"><div className="text-sm uppercase tracking-widest text-red-200 font-black">Landed On</div><div className="text-xl font-black text-white">{pendingElimination.color}: {pendingElimination.player ? pendingElimination.player.name : "Empty Color"}</div><div className="text-red-100 text-sm">Press Advance to lock in the elimination.</div></div>}</div>
    </div>
  );
}

function effectOverlay(color) {
  if (color.type === "negative") return <><div className="absolute inset-0 bg-white/10" /><div className="absolute inset-0 mix-blend-difference opacity-20" style={{ background: color.hex }} /></>;
  if (color.type === "checkerboard") return <><div className="absolute inset-0 mix-blend-soft-light opacity-35" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined }} /><div className="absolute inset-0 mix-blend-overlay opacity-20" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined }} /></>;
  if (color.type === "static") return <><div className="absolute inset-0 opacity-82" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "screen", filter: "contrast(1.75) brightness(1.25) saturate(0.2)" }} /><div className="absolute inset-0 opacity-58" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "difference", filter: "contrast(1.6)" }} /><div className="absolute inset-0 opacity-42" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "overlay" }} /></>;
  if (color.type === "oilspill") return <><div className="absolute inset-0 opacity-90" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "color" }} /><div className="absolute inset-0 opacity-58" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "screen", filter: "blur(5px) saturate(2.4) brightness(1.15)" }} /></>;
  if (color.type === "camo") return <><div className="absolute inset-0 opacity-88" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "multiply" }} /><div className="absolute inset-0 opacity-45" style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, mixBlendMode: "overlay" }} /></>;
  return <><div className="absolute inset-0 mix-blend-color opacity-100" style={{ background: color.cssHex || color.hex }} /><div className="absolute inset-0 bg-white/5" /><div className="absolute inset-0 mix-blend-screen opacity-30" style={{ background: color.cssHex || color.hex }} /></>;
}

function ColorBoard({ game, colors, onPickColor }) {
  const topSplit = Math.ceil(colors.length / 2);
  const squareSizeClass = colors.length > 24 ? "w-[76px] md:w-[100px]" : "w-[92px] md:w-[120px]";
  const manualPicker = game.phase === "colorPicking" ? game.pickingOrder[game.currentPickIndex] : null;
  const usedManualColors = new Set(Object.keys(game.assignments));
  const openManualColors = colors.filter((c) => !Object.prototype.hasOwnProperty.call(game.occupiedColors, c.name) && !usedManualColors.has(c.name));
  const lastManualColor = manualPicker ? game.previousPlayerColors[manualPicker.name] : null;
  const validManualOptions = manualPicker
    ? getValidColorOptions(
        manualPicker,
        openManualColors,
        game.previousPlayerColors,
        game.playerColorHistory,
        game.noRepeats
      )
    : [];

  return <div className="rounded-3xl bg-slate-900 border border-slate-700 p-2 sm:p-3 md:p-4 shadow-xl overflow-x-auto md:overflow-hidden"><div className="grid gap-0 border-4 border-slate-950 rounded-2xl overflow-hidden min-w-[1180px] md:min-w-0" style={{ gridTemplateColumns: `repeat(${topSplit}, minmax(0, 1fr))` }}>{colors.map((color, index) => {
    const assigned = game.assignments[color.name];
    const colorIsLocked = Object.prototype.hasOwnProperty.call(game.occupiedColors, color.name);
    const locked = game.occupiedColors[color.name];
    const showActiveAssignments = ["readyToSpin", "spinning", "spinResult", "colorPicking"].includes(game.phase);
    const player = locked || (showActiveAssignments ? assigned : null);
    const emptyColorEliminated = colorIsLocked && !locked;
    const topRow = index < topSplit;
    const eliminatedHere = Boolean(locked);
    const previewElimination = Boolean(game.pendingElimination && game.revealedSpin === color.name);
    const previewEmptyElimination = Boolean(previewElimination && !game.pendingElimination?.player);
    const manualColorUsed = game.phase === "colorPicking" && usedManualColors.has(color.name);
    const manualOffLimits = game.phase === "colorPicking" && !manualColorUsed && !colorIsLocked && !validManualOptions.some((c) => c.name === color.name);
    const manualCanPick = game.phase === "colorPicking" && !manualColorUsed && !colorIsLocked && !manualOffLimits;
    const imageEffectClass = eliminatedHere || previewElimination ? color.type === "negative" ? "invert contrast-125 brightness-110 opacity-100" : "saturate-0 contrast-110 brightness-110 opacity-100" : "";
    return <div key={color.name} onClick={() => manualCanPick && onPickColor?.(color.name)} className={`relative min-h-[190px] md:min-h-[270px] border border-slate-950 flex ${topRow ? "items-end" : "items-start"} justify-center ${color.name === game.revealedSpin ? "ring-4 ring-white ring-inset" : ""} ${game.phase === "colorPicking" ? (manualCanPick ? "cursor-pointer hover:ring-4 hover:ring-white/70" : "cursor-not-allowed") : ""}`} style={{ background: color.cssHex || color.hex, backgroundSize: color.backgroundSize || undefined, backgroundColor: getSolidFill(color), color: "#ffffff" }}><div className={`absolute ${topRow ? "top-2" : "bottom-2"} left-1/2 -translate-x-1/2 text-[10px] md:text-sm font-black text-center drop-shadow-sm px-1`}>{color.name}</div>{(eliminatedHere || emptyColorEliminated || previewElimination) && <div className={`absolute left-1/2 -translate-x-1/2 ${topRow ? "top-9" : "bottom-9"} text-5xl md:text-7xl opacity-80 select-none pointer-events-none`} style={{ filter: `drop-shadow(0 0 14px ${getSolidFill(color)}) grayscale(0.2)` }}>💀</div>}{manualOffLimits && !player && !emptyColorEliminated && !previewEmptyElimination && <div className="absolute inset-0 bg-black/45 grid place-items-center text-center p-2 pointer-events-none"><div className="rounded-2xl bg-red-950/80 border border-red-300/40 px-2 py-1 text-[10px] md:text-xs font-black text-white">OFF LIMITS THIS ROUND</div></div>}{player ? <div className={`absolute left-1/2 -translate-x-1/2 ${topRow ? "bottom-0" : "top-0"}`}><div className={`relative ${squareSizeClass} aspect-square overflow-hidden shadow-2xl bg-black/20`}><img src={player.img} className={`w-full h-full object-cover transition-all duration-1000 ${imageEffectClass}`} />{(eliminatedHere || previewElimination) && <motion.div initial={{ opacity: eliminatedHere ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 pointer-events-none">{effectOverlay(color)}</motion.div>}<div className={`absolute bottom-0 left-0 right-0 text-white text-center text-[9px] md:text-[11px] font-black py-[2px] truncate px-1 transition-colors duration-1000 ${eliminatedHere || previewElimination ? "bg-black/90" : "bg-black/75"}`}>{player.name}</div></div></div> : emptyColorEliminated || previewEmptyElimination ? <div className={`absolute left-1/2 -translate-x-1/2 ${topRow ? "bottom-0" : "top-0"} ${squareSizeClass} aspect-square grid place-items-center bg-black/15`}><div className="text-7xl md:text-8xl font-black text-red-600 leading-none" style={{ WebkitTextStroke: "4px black", textShadow: "0 0 10px rgba(0,0,0,0.9)" }}>X</div></div> : <div className={`absolute left-1/2 -translate-x-1/2 ${topRow ? "bottom-3" : "top-3"} ${squareSizeClass} aspect-square border-2 border-dashed border-black/30 bg-white/10`} />}</div>;
  })}</div></div>;
}

function EliminatedPortrait({ entry, colors }) {
  const color =
    colors.find((c) => c.name === entry.color) || {
      name: entry.color,
      hex: "#6b7280",
    };

  const imageSrc =
    entry.player?.img ||
    entry.player?.image_url ||
    entry.player?.image ||
    "";

  const imageEffectClass =
    color.type === "negative"
      ? "invert contrast-125 brightness-110 opacity-100"
      : "saturate-0 contrast-110 brightness-110 opacity-100";

  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-xl shadow-lg bg-black/20 shrink-0">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={entry.player?.name || "Eliminated player"}
          className={`w-full h-full object-cover transition-all duration-1000 ${imageEffectClass}`}
        />
      ) : (
        <div className="w-full h-full grid place-items-center bg-slate-800 text-slate-400 text-xs font-bold">
          No Image
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none"
      >
        {effectOverlay(color)}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-white text-center text-[11px] font-black py-[3px] truncate px-1">
        {entry.player?.name || "Empty"}
      </div>
    </div>
  );
}

function ManualPickerPanel({ game, colors }) {
  const currentPlayer = game.pickingOrder[game.currentPickIndex];
  const lastColorName = currentPlayer ? game.previousPlayerColors[currentPlayer.name] : null;
  const lastColor = colors.find((c) => c.name === lastColorName);
  if (!currentPlayer) return null;
  return <Card className="bg-slate-900 border-slate-700 rounded-3xl shadow-xl"><CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4"><img src={currentPlayer.img} className="h-20 w-20 rounded-2xl object-cover border border-slate-600" /><div className="flex-1"><div className="text-sm uppercase tracking-widest text-slate-400 font-black">User Picks Colors</div><div className="text-2xl font-black">{currentPlayer.name} is choosing</div><div className="text-slate-300">Click an open color slot on the board, or press the main button for a random valid pick.</div></div><div className="rounded-2xl bg-slate-800 border border-slate-700 p-3 min-w-[170px]"><div className="text-xs uppercase tracking-widest text-slate-400 font-black mb-2">Last Round Color</div>{lastColor ? <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-lg border border-white/70" style={{ background: lastColor.cssHex || lastColor.hex, backgroundSize: lastColor.backgroundSize || undefined }} /><div className="font-black">{lastColor.name}</div><div className="text-xs text-red-200">off limits</div></div> : <div className="text-slate-300 font-bold">None</div>}</div></CardContent></Card>;
}
