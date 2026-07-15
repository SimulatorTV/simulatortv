// @ts-nocheck

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

const HIGH_CASE_POOL = [100000, 125000, 150000, 175000, 200000, 250000, 300000, 350000, 400000, 500000, 600000, 750000, 850000, 1000000, 1100000, 1250000, 1500000, 1750000, 2000000, 2250000, 2500000, 3000000, 3500000, 4000000, 5000000];
const LOW_CASE_POOL = [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 2500, 5000, 7500, 10000, 25000, 50000, 75000];
const BANKER_LOW_BOARD_POOL = [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000];

function buildLowBoardValues(count, takenValues = []) {
  if (count <= 0) return [];
  const taken = new Set(takenValues.map(v => String(v)));
  const pool = BANKER_LOW_BOARD_POOL.filter(v => !taken.has(String(v)));
  if (count === 1) return [pool[0] ?? 1];
  const picks = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round(i * (pool.length - 1) / Math.max(1, count - 1));
    const value = pool[idx];
    if (value != null && !picks.includes(value)) picks.push(value);
  }
  let cursor = 0;
  while (picks.length < count && cursor < pool.length) {
    if (!picks.includes(pool[cursor])) picks.push(pool[cursor]);
    cursor++;
  }
  let filler = 1250;
  while (picks.length < count) {
    if (!taken.has(String(filler)) && !picks.includes(filler)) picks.push(filler);
    filler += 250;
  }
  return picks.slice(0, count).sort((a,b)=>a-b);
}

function buildOfferSchedule(totalCases) {
  const openable = Math.max(0, totalCases - 2);
  if (openable <= 0) return [];
  if (openable === 1) return [1];
  if (openable === 2) return [1, 1];
  const first = Math.max(1, Math.ceil(openable * 0.45));
  const second = Math.max(1, Math.ceil((openable - first) * 0.70));
  const third = Math.max(1, openable - first - second);
  return [first, second, third].filter(n => n > 0);
}

function buildFinaleOfferSchedule(totalCases) {
  const wonAmountCount = Math.max(0, totalCases - 1);
  const openable = Math.max(0, totalCases - 2);

  if (openable <= 0) return [];

  if (wonAmountCount < 6) {
    return Array.from({ length: openable }, () => 1);
  }

  const offerRounds = Math.min(5, openable);
  const schedule = [];
  let remainingCases = openable;

  for (let roundIndex = 0; roundIndex < offerRounds; roundIndex++) {
    const remainingRounds = offerRounds - roundIndex;
    const casesThisRound = Math.ceil(remainingCases / remainingRounds);
    schedule.push(casesThisRound);
    remainingCases -= casesThisRound;
  }

  return schedule;
}
const INTERACTION_RESULTS = [
  { word: "very good", delta: 16, emoji: "🌟" },
  { word: "good", delta: 8, emoji: "🙂" },
  { word: "neutral", delta: 0, emoji: "😐" },
  { word: "bad", delta: -8, emoji: "😬" },
  { word: "very bad", delta: -16, emoji: "💀" },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const money = n => n === 0.01 ? "$0.01" : "$" + Math.round(n).toLocaleString();
const avg = arr => arr.reduce((a,b)=>a+b,0) / Math.max(1, arr.length);
const relKey = (a,b) => [a,b].sort().join("__");
const relValue = (map,a,b) => map[relKey(a,b)] || 0;
const changeRel = (map,a,b,d) => ({ ...map, [relKey(a,b)]: clamp((map[relKey(a,b)] || 0) + d, -100, 100) });
const personality = () => ({ social:rand(10,100), loyalty:rand(10,100), risk:rand(10,100), greed:rand(10,100), revenge:rand(10,100), nerves:rand(10,100) });

function makePlayers(cast) {
  return cast.map((person, i) => ({
    id: uid(),
    sourceId: person.id,
    name: person.name,
    image: person.image || person.img || person.image_url || "",
    originalIndex: i + 1,
    placement: null,
    eliminations: 0,
    personality: personality(),
  }));
}
function makeTeams(active) {
  const s = shuffle(active); const teams=[];
  for (let i=0;i<s.length;i+=2) teams.push({ id:uid(), members:s.slice(i,i+2), caseValue:null, displayCase:null, rawCase:null, revealed:false, rank:null, stole:false, mega:false });
  return teams;
}

function makeIndividuals(active) {
  return shuffle(active).map(player => ({
    id:uid(),
    members:[player],
    caseValue:null,
    displayCase:null,
    rawCase:null,
    revealed:false,
    rank:null,
    stole:false,
    mega:false,
    individual:true
  }));
}
function makeTwoTeams(active) {
  const s = shuffle(active);
  const half = s.length / 2;
  return [
    { id:uid(), members:s.slice(0, half), caseValue:null, displayCase:null, rawCase:null, revealed:false, rank:null, stole:false, mega:true, label:"Team A" },
    { id:uid(), members:s.slice(half), caseValue:null, displayCase:null, rawCase:null, revealed:false, rank:null, stole:false, mega:true, label:"Team B" }
  ];
}
function buildChallengeCases(count) {
  const highCount = Math.max(1, count - 2);
  const roll = Math.random();
  const roundMax =
    roll < 0.52 ? 1000000 :
    roll < 0.78 ? 1500000 :
    roll < 0.93 ? 2000000 :
    roll < 0.985 ? 3000000 :
    5000000;

  const available = HIGH_CASE_POOL.filter(v => v <= roundMax && v >= 100000);
  const selectedHighs = shuffle(available).slice(0, highCount);
  while (selectedHighs.length < highCount) selectedHighs.push(rand(4, Math.round(roundMax / 25000)) * 25000);
  const specials = [];
  if (count >= 3) {
    const redCaseRoll = Math.random();
    if (redCaseRoll < 0.34) {
      // One red case: equally likely to be STEAL or the penny.
      specials.push(Math.random() < 0.5 ? "STEAL" : "NOTHING");
    } else if (redCaseRoll < 0.58) {
      // Two red cases: one STEAL and one penny.
      specials.push("STEAL", "NOTHING");
    }
    // Otherwise, this round has no red cases.
  }
  const neededHighs = Math.max(0, count - specials.length);
  const highs = shuffle(available).slice(0, neededHighs);
  while (highs.length < neededHighs) highs.push(rand(4, Math.round(roundMax / 25000)) * 25000);
  return shuffle([...highs, ...specials]).slice(0, count);
}
function bankerOffer(values, round, player, personalityOn) {
  const mult = [0.58, 0.72, 0.84, 0.94][Math.min(round,3)] || 0.82;
  let offer = avg(values) * mult * (0.86 + Math.random()*0.28);
  if (personalityOn) offer *= 1 + (player.personality.nerves - 50) / 650;
  return Math.max(1, Math.round(offer / 1000) * 1000);
}
function acceptDeal(offer, remaining, player, personalityOn) {
  // Decision logic intentionally does NOT use the hidden value inside the player's chosen case.
  // It only reacts to the visible board, the offer, and the player's personality.
  const boardAverage = avg(remaining);
  let threshold = boardAverage * 0.86;
  if (personalityOn) {
    threshold += (player.personality.greed - 50) * 2600;
    threshold += (player.personality.risk - 50) * 1700;
    threshold -= (player.personality.nerves - 50) * 2300;
  }
  const remainingHigh = Math.max(...remaining);
  const remainingLow = Math.min(...remaining);
  const offerStrength = offer / Math.max(1, boardAverage);
  const dangerGap = remainingHigh / Math.max(1, remainingLow);
  return offer >= threshold || (offerStrength > 0.92 && dangerGap > 1000);
}


function AddCastMembersModal({ casts, castId, contestants, selectedIds, loadingCasts, loadingContestants, onClose, onChooseCast, onToggle, onSelectAll, onSelectNone, onAdd }) {
  const official = casts.filter(c=>c.is_official);
  const custom = casts.filter(c=>!c.is_official);
  useEffect(()=>{ if(!castId && casts[0]?.id) onChooseCast(casts[0].id); },[castId,casts]);
  const CastList=({items,title})=>items.length ? <div><h4>{title}</h4>{items.map(c=><button key={c.id} className={castId===c.id?"castChoice active":"castChoice"} onClick={()=>onChooseCast(c.id)}><b>{c.name}</b><small>{c.show_name || (c.is_full_cast?"Full Custom Cast":c.is_official?"Official Cast":"Custom Cast")}</small></button>)}</div>:null;
  return <div className="castModalBackdrop"><div className="castModal">
    <div className="castModalHeader"><div><h2>Add Cast Members</h2><p>Choose individual players from your casts.</p></div><button onClick={onClose}>Close</button></div>
    <div className="castModalBody">
      <div className="castSidebar">{loadingCasts?<p>Loading casts...</p>:<><CastList items={official} title="Favorite Official Casts"/><CastList items={custom} title="Custom Casts"/></>}</div>
      <div className="contestantPane">
        <div className="modalActions"><b>{selectedIds.size} selected</b><button onClick={onSelectAll}>Select All</button><button onClick={onSelectNone}>Select None</button><button onClick={onAdd} disabled={!selectedIds.size}>Add Selected</button></div>
        {loadingContestants?<p>Loading contestants...</p>:<div className="modalContestantGrid">{contestants.map(p=><button key={p.id} className={selectedIds.has(p.id)?"modalPerson active":"modalPerson"} onClick={()=>onToggle(p.id)}>{p.image_url?<img src={p.image_url} alt={p.name}/>:<div className="noImage">No Image</div>}<span>{p.name}</span></button>)}</div>}
      </div>
    </div>
  </div></div>;
}

export default function DealOrNoDealIslandSimulator() {
  const router = useRouter();
  const [availableCasts,setAvailableCasts]=useState([]);
  const [loadingCasts,setLoadingCasts]=useState(true);
  const [showAddCastModal,setShowAddCastModal]=useState(false);
  const [modalCastId,setModalCastId]=useState("");
  const [modalContestants,setModalContestants]=useState([]);
  const [modalSelectedIds,setModalSelectedIds]=useState(()=>new Set());
  const [loadingModalContestants,setLoadingModalContestants]=useState(false);
  const [roster,setRoster]=useState([]);
  const [selectedIds,setSelectedIds]=useState(()=>new Set());
  const [personalityOn, setPersonalityOn] = useState(true);
  const [relationsOn, setRelationsOn] = useState(true);
  const [controlElim, setControlElim] = useState(false);
  const [chooseDeals, setChooseDeals] = useState(false);
  const [screen, setScreen] = useState("menu");
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(1);
  const [rels, setRels] = useState({});
  const [interactions, setInteractions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [immuneIds, setImmuneIds] = useState([]);
  const [bottomTeam, setBottomTeam] = useState(null);
  const [bankerPlayer, setBankerPlayer] = useState(null);
  const [bankerChoiceLit, setBankerChoiceLit] = useState(false);
  const [elim, setElim] = useState(null);
  const [dealsTaken, setDealsTaken] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [winner, setWinner] = useState(null);
  const [targetReveal, setTargetReveal] = useState(false);
  const [pendingEliminated, setPendingEliminated] = useState(null);
  const [stealEvent, setStealEvent] = useState(null);
  const [challengeMode, setChallengeMode] = useState("pairs");
  const [decisionBanner, setDecisionBanner] = useState("");

  const active = players.filter(p=>!p.placement);
  const selectedCast = roster.filter(p=>selectedIds.has(p.id));
  const allCasesRevealed = teams.length > 0 && teams.every(t=>t.revealed);
  const rankedTeams = [...teams].sort((a,b)=>b.caseValue-a.caseValue);
  const currentWinnerTeam = rankedTeams[0];
  const currentBottomTeam = [...teams].sort((a,b)=>a.caseValue-b.caseValue)[0];
  const displayPlayers = [
    ...players.filter(p=>!p.placement),
    ...players.filter(p=>p.placement).sort((a,b)=>a.placement-b.placement)
  ];


  useEffect(()=>{ loadSavedCasts(); },[]);

  async function loadSavedCasts(){
    const {data:userData}=await supabase.auth.getUser();
    if(!userData.user){ router.push("/login"); return; }
    const {data:favs}=await supabase.from("favorite_casts").select("cast_id").eq("user_id",userData.user.id);
    const favIds=(favs||[]).map(f=>f.cast_id);
    const {data:userCasts,error:userErr}=await supabase.from("casts").select("id,name,show_name,created_at,is_official,is_full_cast").eq("user_id",userData.user.id).order("created_at",{ascending:false});
    if(userErr){ alert(userErr.message); setLoadingCasts(false); return; }
    let official=[];
    if(favIds.length){
      const {data,error}=await supabase.from("casts").select("id,name,show_name,created_at,is_official,is_full_cast").in("id",favIds).eq("is_official",true).order("name",{ascending:true});
      if(error){ alert(error.message); setLoadingCasts(false); return; }
      official=data||[];
    }
    setAvailableCasts([...official,...(userCasts||[])]);
    setLoadingCasts(false);
  }

  async function openAddCastModal(){
    setShowAddCastModal(true);
    if(!modalCastId && availableCasts[0]?.id) await loadContestantsForModal(availableCasts[0].id);
  }

  async function loadContestantsForModal(castId){
    setModalCastId(castId); setModalSelectedIds(new Set()); setLoadingModalContestants(true);
    const cast=availableCasts.find(c=>c.id===castId);
    const {data,error}=await supabase.from("contestants").select("id,name,image_url,cast_id").eq("cast_id",castId).order("created_at",{ascending:true});
    if(error){ alert(error.message); setLoadingModalContestants(false); return; }
    if((data||[]).length || !cast?.is_full_cast){ setModalContestants(data||[]); setLoadingModalContestants(false); return; }
    setModalContestants(await loadFullCustomCastContestants(castId));
    setLoadingModalContestants(false);
  }

  async function loadFullCustomCastContestants(castId){
    const links=[
      ["full_cast_members","full_cast_id"],["full_cast_members","cast_id"],
      ["cast_members","full_cast_id"],["cast_members","cast_id"]
    ];
    for(const [table,column] of links){
      const {data:rows,error}=await supabase.from(table).select("contestant_id").eq(column,castId);
      if(error || !rows?.length) continue;
      const ids=[...new Set(rows.map(r=>r.contestant_id).filter(Boolean))];
      if(!ids.length) continue;
      const {data:people,error:peopleErr}=await supabase.from("contestants").select("id,name,image_url,cast_id").in("id",ids);
      if(!peopleErr && people?.length){
        const byId=new Map(people.map(p=>[p.id,p]));
        return ids.map(id=>byId.get(id)).filter(Boolean);
      }
    }
    return [];
  }

  function addSelectedContestantsToRoster(){
    const picked=modalContestants.filter(p=>modalSelectedIds.has(p.id));
    if(!picked.length) return;
    const additions=picked.map(p=>({id:`${modalCastId}-${p.id}`,name:p.name,image:p.image_url||""}));
    setRoster(current=>{
      const existing=new Set(current.map(p=>p.id));
      const fresh=additions.filter(p=>!existing.has(p.id));
      setSelectedIds(s=>{ const next=new Set(s); fresh.forEach(p=>next.add(p.id)); return next; });
      return [...current,...fresh];
    });
    setShowAddCastModal(false); setModalSelectedIds(new Set());
  }

  function toggleRosterPlayer(id){ setSelectedIds(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;}); }
  function removeRosterPlayer(id){ setRoster(r=>r.filter(p=>p.id!==id)); setSelectedIds(s=>{const next=new Set(s);next.delete(id);return next;}); }
  function selectAllRoster(){ setSelectedIds(new Set(roster.map(p=>p.id))); }
  function selectNoneRoster(){ setSelectedIds(new Set()); }
  function clearRoster(){ if(!confirm("Clear Deal or No Deal Island roster?")) return; setRoster([]); setSelectedIds(new Set()); }

  function startGame() {
    if(selectedCast.length < 4){ alert("Select at least 4 cast members."); return; }
    const cast=selectedCast.slice(0,26);
    setPlayers(makePlayers(cast)); setRound(1); setRels({}); setInteractions([]); setDealsTaken([]); setPlacements([]); setWinner(null); setStealEvent(null); setChallengeMode("pairs"); setDecisionBanner(""); setScreen("cast");
  }

  function runInteractions() {
    let r = { ...rels }; const ev=[];
    if (relationsOn) active.forEach(p => {
      const pool = active.filter(x=>x.id!==p.id); if (!pool.length) return;
      const target = personalityOn ? [...pool].sort((a,b)=>(relValue(r,p.id,b.id)+Math.random()*80)-(relValue(r,p.id,a.id)+Math.random()*80))[0] : pick(pool);
      const roll = Math.random();
      const res = roll < .13 ? INTERACTION_RESULTS[0] : roll < .35 ? INTERACTION_RESULTS[1] : roll < .65 ? INTERACTION_RESULTS[2] : roll < .87 ? INTERACTION_RESULTS[3] : INTERACTION_RESULTS[4];
      r = changeRel(r, p.id, target.id, res.delta);
      ev.push({ actor:p, target, result:res });
    });
    setRels(r); setInteractions(ev); setScreen("interactions");
  }

  function setupChallenge() {
    const individualRound = active.length <= 10;
    const twoTeamRound = !individualRound && active.length > 6 && active.length % 2 === 0 && Math.random() < 0.28;
    const mode = individualRound ? "individual" : twoTeamRound ? "twoTeams" : "pairs";
    setChallengeMode(mode);
    let ts = individualRound ? makeIndividuals(active) : twoTeamRound ? makeTwoTeams(active) : makeTeams(active);
    const cases = buildChallengeCases(ts.length);
    ts = ts.map((t,i)=>({ ...t, rawCase:cases[i], displayCase:cases[i], caseValue: typeof cases[i] === "number" ? cases[i] : cases[i] === "NOTHING" ? 0.01 : 10000 }));
    const stealTeam = ts.find(t=>t.rawCase === "STEAL");

    if (stealTeam) {
      setStealEvent({
        stealTeamId: stealTeam.id,
        take: true,
        resolved: false,
      });
    } else {
      setStealEvent(null);
    }
    setTeams(ts); setImmuneIds([]); setBottomTeam(null); setBankerPlayer(null); setBankerChoiceLit(false); setScreen("challengeReveal");
  }

  function revealCase(id, ev) {
    if (ev) { ev.preventDefault(); ev.currentTarget.blur(); }
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    setTeams(ts=>ts.map(t=>t.id===id?{...t,revealed:true}:t));
    requestAnimationFrame(()=>{ if (typeof window !== 'undefined') window.scrollTo(0,y); });
  }
  function revealAllCases(ev) {
    if (ev) { ev.preventDefault(); ev.currentTarget.blur(); }
    const y = typeof window !== 'undefined' ? window.scrollY : 0;
    setTeams(ts=>ts.map(t=>({...t,revealed:true})));
    requestAnimationFrame(()=>{ if (typeof window !== 'undefined') window.scrollTo(0,y); });
  }

  function advanceFromChallengeReveal() {
    if (!allCasesRevealed) return;
    if (stealEvent && !stealEvent.resolved) {
      resolveSteal();
      return;
    }
    finalizeChallengeRanks();
  }

  function resolveSteal() {
    let eventCopy = null;

    setTeams(ts => {
      const copy = ts.map(t => ({ ...t }));
      const stealTeam = copy.find(t => t.id === stealEvent?.stealTeamId);

      if (!stealTeam) return copy;

      const victims = copy.filter(
        t => t.id !== stealTeam.id && typeof t.rawCase === "number"
      );

      const victim = pick(victims);
      const stolenValue = victim.caseValue;

      stealTeam.caseValue = stolenValue;
      stealTeam.displayCase = `STOLE ${money(stolenValue)}`;
      stealTeam.stole = true;

      victim.caseValue = 0;
      victim.displayCase = "STOLEN";

      eventCopy = {
        ...stealEvent,
        take: true,
        victimTeamId: victim.id,
        stolenValue,
        resolved: true,
      };

      stealTeam.members.forEach(s =>
        victim.members.forEach(v =>
          setRels(prev => changeRel(prev, s.id, v.id, -14))
        )
      );

      return copy;
    });

    setStealEvent(eventCopy || { ...stealEvent, take: true, resolved: true });
  }

  function finalizeChallengeRanks() {
    setTeams(ts => {
      const ranked = [...ts].sort((a,b)=>b.caseValue-a.caseValue);
      const rankMap = new Map(ranked.map((t,i)=>[t.id,i+1]));
      const winner = ranked[0];
      const bottom = challengeMode === "individual"
        ? {
            id:"individual-bottom-two",
            members:ranked.slice(-2).flatMap(t=>t.members),
            teamIds:ranked.slice(-2).map(t=>t.id)
          }
        : [...ts].sort((a,b)=>a.caseValue-b.caseValue)[0];
      setImmuneIds(winner.members.map(m=>m.id));
      setBottomTeam(bottom);
      return ts.map(t=>({...t, rank: rankMap.get(t.id)}));
    });
    setScreen("challengeOutcome");
  }

  function chooseBankerPlayer() {
    const chooser = currentWinnerTeam;
    const options = bottomTeam.members;
    let chosen = options[0];
    if (options.length > 1) chosen = [...options].sort((a,b)=>(avg(chooser.members.map(c=>relValue(rels,c.id,a.id)))+Math.random()*40)-(avg(chooser.members.map(c=>relValue(rels,c.id,b.id)))+Math.random()*40))[0];
    setBankerPlayer(chosen); setScreen("bankerChoice");
  }
  function lightBankerChoice() { setBankerChoiceLit(true); }

  function beginBanker() {
    const right = teams.map(t=>t.caseValue).sort((a,b)=>a-b);
    const left = buildLowBoardValues(right.length, right);
    const values = shuffle([...left, ...right]);
    const cases = values.map((value,i)=>({ id:i+1, value, open:false, selected:false, playerCase:false }));
    setDecisionBanner("");
    setElim({ player:bankerPlayer, cases, playerCase:null, playerCaseId:null, phase:"chooseOwnCase", round:0, openedThisOfferRound:0, offerSchedule:buildOfferSchedule(values.length), offer:null, selectedCaseId:null, openingCase:null, lastOpened:null, acceptedDeal:null, finalOther:null, result:null, resultText:"", prizeAdded:null, ownCaseOpened:false, autoChoice:null, isFinale:false });
    setScreen("banker");
  }

  function casesToOpen(e) {
    const notPlayer = e.cases.filter(c=>!c.open && !c.playerCase).length;
    if (notPlayer <= 1) return 0;
    const schedule = e.offerSchedule || buildOfferSchedule(e.cases.length);
    const target = schedule[Math.min(e.round || 0, schedule.length - 1)] || 1;
    return Math.max(0, Math.min(target - (e.openedThisOfferRound || 0), notPlayer - 1));
  }

  function selectCase(id) {
    setElim(e=> {
      if (!e) return e;
      if (e.phase === "chooseOwnCase") {
        const chosen = e.cases.find(c=>c.id===id);
        return { ...e, playerCase:chosen.value, playerCaseId:id, phase:"pick", cases:e.cases.map(c=>({...c, playerCase:c.id===id, selected:false})) };
      }
      if (e.phase === "pick") return { ...e, selectedCaseId:id, cases:e.cases.map(c=>({...c, selected:c.id===id})) };
      if (e.phase === "caseRevealWait" && id === e.playerCaseId) return { ...e, ownCaseOpened:true, phase:"caseReveal" };
      return e;
    });
  }

  function autoSelectCase() {
    const e = elim; if (!e) return;
    if (e.phase === "chooseOwnCase") {
      const options = e.cases.filter(c=>!c.open);
      selectCase(pick(options).id);
    } else if (e.phase === "pick") {
      const options = e.cases.filter(c=>!c.open && !c.playerCase);
      selectCase(pick(options).id);
    } else if (e.phase === "caseRevealWait") {
      selectCase(e.playerCaseId);
    }
  }

  function advanceBanker() {
    if (elim?.phase === "decision") { autoDecision(); return; }
    setElim(e=>{
      if (!e) return e;
      if ((e.phase === "chooseOwnCase" || e.phase === "pick") && !e.selectedCaseId && e.phase !== "chooseOwnCase") return e;
      if (e.phase === "pick" && e.selectedCaseId) {
        const opening = e.cases.find(c=>c.id===e.selectedCaseId);
        return { ...e, phase:"opening", openingCase:opening, cases:e.cases.map(c=>c.id===e.selectedCaseId?{...c,selected:true}:c) };
      }
      if (e.phase === "opening") {
        const cases = e.cases.map(c=>c.id===e.openingCase.id?{...c,open:true,selected:false}:c);
        const lastOpened = e.openingCase;
        const openedThisOfferRound = (e.openedThisOfferRound || 0) + 1;
        const notPlayer = cases.filter(c=>!c.open && !c.playerCase).length;
        const schedule = e.offerSchedule || buildOfferSchedule(e.cases.length);
        const target = schedule[Math.min(e.round || 0, schedule.length - 1)] || 1;
        if (notPlayer > 1 && openedThisOfferRound < target) return { ...e, cases, lastOpened, openedThisOfferRound, selectedCaseId:null, openingCase:null, phase:"pick" };
        const remaining = cases.filter(c=>!c.open).map(c=>c.value);
        const offer = bankerOffer(remaining, e.round, e.player, personalityOn);
        return { ...e, cases, lastOpened, openedThisOfferRound:0, selectedCaseId:null, openingCase:null, offer, phase:"offer", round:e.round+1 };
      }
      if (e.phase === "offer") {
        const remaining = e.cases.filter(c=>!c.open).map(c=>c.value);
        const autoChoice = acceptDeal(e.offer, remaining, e.player, personalityOn);
        return { ...e, phase:"decision", autoChoice };
      }
      return e;
    });
  }

  function makeDecision(take) {
    const e = elim;
    if (!e) return;

    setDecisionBanner(take ? "DEAL" : "NO DEAL");

    if (take) {
      const win = e.offer > e.playerCase;
      const prizeAdded = e.offer || 0;
      if (!e.isFinale) setDealsTaken(d => [...d, prizeAdded]);

      setElim({
        ...e,
        acceptedDeal: e.offer,
        prizeAdded,
        result: win ? "WIN" : "LOSE",
        resultText: win
          ? "Good deal — the offer beat their case."
          : "Bad deal — their case was higher than the offer.",
        phase: "caseRevealWait",
      });
      return;
    }

    const unopened = e.cases.filter(c => !c.open && !c.playerCase);
    if (unopened.length <= 1) {
      const other = unopened[0]?.value || 0;
      const win = e.playerCase > other;
      const prizeAdded = e.playerCase || 0;
      if (!e.isFinale) setDealsTaken(d => [...d, prizeAdded]);

      setElim({
        ...e,
        finalOther: other,
        prizeAdded,
        result: win ? "WIN" : "LOSE",
        resultText: win
          ? "Their case was higher than the final case."
          : "Their case was lower than the final case.",
        phase: "caseRevealWait",
      });
    } else {
      setElim({ ...e, phase: "pick", offer: null, autoChoice: null });
    }
  }

  function autoDecision() {
    const e = elim;
    if (!e) return;
    if (typeof e.autoChoice === "boolean") makeDecision(e.autoChoice);
    else {
      const remaining = e.cases.filter(c=>!c.open).map(c=>c.value);
      makeDecision(acceptDeal(e.offer, remaining, e.player, personalityOn));
    }
  }

  function chooseEliminationTarget() {
    const e = elim;
    if (e.result === "LOSE") { setPendingEliminated(e.player); setScreen("eliminationLose"); return; }
    const eligible = active.filter(p=>!immuneIds.includes(p.id) && p.id !== e.player.id);
    const actor = e.player;
    const chosen = personalityOn ? [...eligible].sort((a,b)=>(relValue(rels,actor.id,a.id)-actor.personality.revenge*.25+Math.random()*60)-(relValue(rels,actor.id,b.id)-actor.personality.revenge*.25+Math.random()*60))[0] : pick(eligible);
    setPendingEliminated(chosen); setTargetReveal(false); setScreen("eliminationWin");
  }

  function finalizeElimination() {
    const eliminated = pendingEliminated; const place = active.length;
    const newPlayers = players.map(p=>p.id===eliminated.id?{...p,placement:place}:p.id===elim.player.id && elim.result==="WIN"?{...p,eliminations:p.eliminations+1}:p);
    setPlayers(newPlayers); setPlacements(pl=>[{...eliminated,placement:place,eliminatedBy:elim.result==="LOSE"?"The Banker":elim.player.name},...pl]);
    const remain = newPlayers.filter(p=>!p.placement);
    if (remain.length === 1) { setWinner(remain[0]); setScreen("finale"); } else { setRound(r=>r+1); setScreen("cast"); }
  }

  function runFinale() {
    const player = winner;
    if (!player) return;

    const wonValues = dealsTaken.length ? [...dealsTaken] : [0.01];
    const grandPrize = wonValues.reduce((sum, value) => sum + value, 0);
    const values = shuffle([...wonValues, grandPrize]);
    const cases = values.map((value, index) => ({
      id: index + 1,
      value,
      open: false,
      selected: false,
      playerCase: false,
    }));

    setDecisionBanner("");
    setElim({
      player,
      cases,
      playerCase: null,
      playerCaseId: null,
      phase: "chooseOwnCase",
      round: 0,
      openedThisOfferRound: 0,
      offerSchedule: buildFinaleOfferSchedule(values.length),
      offer: null,
      selectedCaseId: null,
      openingCase: null,
      lastOpened: null,
      acceptedDeal: null,
      finalOther: null,
      result: null,
      resultText: "",
      prizeAdded: null,
      ownCaseOpened: false,
      autoChoice: null,
      isFinale: true,
      grandPrize,
    });
    setScreen("banker");
  }

  const PlayerCard = ({p, small=false, glow=false, danger=false}) => <div className={`player ${small?"small":""} ${p.placement?"out":""} ${glow?"glow":""} ${danger?"danger":""}`}><img src={p.image}/><b>{p.name}</b></div>;
  const TeamCard = ({t, showRanks=false}) => {
    const stolenFrom = stealEvent?.resolved && stealEvent?.victimTeamId && stealEvent?.stealTeamId === t.id ? teams.find(x=>x.id===stealEvent.victimTeamId) : null;
    const isBottom = challengeMode === "individual"
      ? showRanks && bottomTeam?.teamIds?.includes(t.id)
      : showRanks && bottomTeam?.id === t.id;
    return <div className={`team ${showRanks && t.rank===1?"immune":""} ${isBottom?"bottom":""} ${stealEvent?.resolved && stealEvent?.stealTeamId===t.id?"stealResolved":""}`}>
      <h3>{showRanks && t.rank ? `#${t.rank}` : (t.label || "Team")}</h3>
      <div className="teamMembers">{t.members.map(m=><PlayerCard key={m.id} p={m} small />)}</div>
      {t.revealed ? <div className="caseAmount">{typeof t.displayCase === "number" ? money(t.displayCase) : t.displayCase === "NOTHING" ? "$0.01" : t.displayCase === "STEAL" ? "STEAL" : t.displayCase}</div> : <button className={t.rawCase === "STEAL" || t.rawCase === "NOTHING" ? "redReveal" : ""} onClick={(ev)=>revealCase(t.id, ev)}>Reveal Case</button>}
      {stolenFrom && <div className="stolenFrom"><b>Stole from:</b><div className="rowCards">{stolenFrom.members.map(m=><PlayerCard key={m.id} p={m} small />)}</div></div>}
      {showRanks && t.rank===1 && <b className="tag good">IMMUNE</b>}
      {isBottom && <b className="tag bad">{challengeMode === "individual" ? "BOTTOM TWO" : "BOTTOM TEAM"}</b>}
    </div>;
  };
  const Board = ({e}) => { const vals=[...e.cases].sort((a,b)=>a.value-b.value); const mid=Math.ceil(vals.length/2); return <div className="dondBoard"><div>{vals.slice(0,mid).map(c=><div key={c.id} className={`money ${c.open?"gone":""}`}>{money(c.value)}</div>)}</div><div>{vals.slice(mid).map(c=><div key={c.id} className={`money high ${c.open?"gone":""}`}>{money(c.value)}</div>)}</div></div>; };
  const eligibleTargets = active.filter(p=>!immuneIds.includes(p.id) && p.id !== elim?.player?.id);

  return <div className="sim-wrap">
    <Navbar />
    {showAddCastModal && <AddCastMembersModal
      casts={availableCasts}
      castId={modalCastId}
      contestants={modalContestants}
      selectedIds={modalSelectedIds}
      loadingCasts={loadingCasts}
      loadingContestants={loadingModalContestants}
      onClose={()=>setShowAddCastModal(false)}
      onChooseCast={loadContestantsForModal}
      onToggle={id=>setModalSelectedIds(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next;})}
      onSelectAll={()=>setModalSelectedIds(new Set(modalContestants.map(p=>p.id)))}
      onSelectNone={()=>setModalSelectedIds(new Set())}
      onAdd={addSelectedContestantsToRoster}
    />}
    <style>{css}</style><h1>Deal or No Deal Island</h1>
    {screen === "menu" && <div className="panel"><h2>Main Menu</h2>
      <div className="toggles"><label><input type="checkbox" checked={personalityOn} onChange={e=>setPersonalityOn(e.target.checked)}/> Personality System</label><label><input type="checkbox" checked={relationsOn} onChange={e=>setRelationsOn(e.target.checked)}/> Relationships</label><label><input type="checkbox" checked={controlElim} onChange={e=>setControlElim(e.target.checked)}/> Control Case Selection</label><label><input type="checkbox" checked={chooseDeals} onChange={e=>setChooseDeals(e.target.checked)}/> Show Suggested Decision</label></div>
      <div className="buttons"><button onClick={openAddCastModal}>Add Cast Members</button><button onClick={selectAllRoster}>Select All</button><button onClick={selectNoneRoster}>Select None</button>{roster.length>0&&<button onClick={clearRoster}>Clear Roster</button>}<Link href="/custom-casts" className="manageLink">Manage Casts</Link></div>
      {roster.length===0?<div className="emptyRoster">No cast members added yet.</div>:<div className="castSelect">{roster.map(person=><div key={person.id} className={`selectCard ${selectedIds.has(person.id)?"":"unselected"}`} onClick={()=>toggleRosterPlayer(person.id)}><div className="selectionBadge">{selectedIds.has(person.id)?"✓":"×"}</div><button className="removeCastButton" onClick={e=>{e.stopPropagation();removeRosterPlayer(person.id)}}>×</button><img src={person.image}/><span>{person.name}</span></div>)}</div>}
      <button className="big" disabled={selectedCast.length<4} onClick={startGame}>Start Game ({selectedCast.length})</button>
    </div>}

    {screen === "cast" && <div className="panel"><h2>Round {round} — Remaining Cast</h2><div className="moneyline">Finale Board Money Added: {dealsTaken.length ? dealsTaken.map(money).join(" • ") : "None yet"}</div><div className="grid">{displayPlayers.map(p=><PlayerCard key={p.id} p={p}/>)}</div><button className="big" onClick={runInteractions}>Camp Interactions</button></div>}

    {screen === "interactions" && <div className="panel"><h2>Camp Interactions</h2><div className="interactionGrid">{interactions.map((x,i)=><div className="interaction" key={i}><PlayerCard p={x.actor} small/><div className="interactionText">{x.result.emoji}<br/><b>{x.actor.name}</b> had a <b>{x.result.word}</b> interaction with <b>{x.target.name}</b>.</div><PlayerCard p={x.target} small/></div>)}</div><button className="big" onClick={setupChallenge}>Start Team Challenge</button></div>}

    {screen === "challengeReveal" && <div className="panel"><h2>Challenge Case Reveal</h2><p className="centerText">{challengeMode === "individual" ? "Individual challenge. The highest case is immune and chooses which of the bottom two faces the Banker." : challengeMode === "twoTeams" ? "Two-team round. The winning team is safe; one player from the losing team faces the Banker." : "Cases are not ranked until every team has revealed."}</p><button className="big" onClick={(ev)=>revealAllCases(ev)}>Reveal All Cases</button>{stealEvent && allCasesRevealed && !stealEvent.resolved && <p className="centerText">A STEAL case is in play. Resolve it here before rankings are shown.</p>}{stealEvent?.resolved && <p className="centerText">The STEAL case has been resolved on this board.</p>}<div className="teams">{teams.map(t=><TeamCard key={t.id} t={t} showRanks={false}/>)}</div><button className="big" disabled={!allCasesRevealed} onClick={advanceFromChallengeReveal}>{stealEvent && !stealEvent.resolved ? "Resolve Steal Case" : "Advance to Results"}</button></div>}

    {screen === "stealCase" && <div className="panel result"><h2>Red Steal Case</h2>{(() => { const st = teams.find(t=>t.id===stealEvent?.stealTeamId); return st ? <><div className="rowCards">{st.members.map(p=><PlayerCard key={p.id} p={p} small glow />)}</div><p>{st.members.map(m=>m.name).join(" / ")} found the STEAL case.</p><p>They use the STEAL and randomly take another player or team&apos;s numbered money case.</p></> : null; })()}<button className="big" onClick={resolveSteal}>Advance — Resolve Steal</button></div>}

    {screen === "challengeOutcome" && <div className="panel"><h2>Challenge Results</h2><div className="teams">{teams.map(t=><TeamCard key={t.id} t={t} showRanks={true}/>)}</div><button className="big" onClick={chooseBankerPlayer}>Advance to Winner and Bottom Team</button></div>}

    {screen === "bankerChoice" && <div className="panel"><h2>{challengeMode === "individual" ? "Challenge Winner Chooses From The Bottom Two" : challengeMode === "twoTeams" ? "Winning Team Votes From The Losing Team" : "Winning Team Chooses From The Bottom Team"}</h2><div className="choiceLayout"><div><h3>Challenge Winners / Immune</h3><div className="rowCards">{currentWinnerTeam.members.map(p=><PlayerCard key={p.id} p={p} small glow />)}</div></div><div><h3>{challengeMode === "individual" ? "Bottom Two" : "Bottom Team"}</h3><div className="rowCards">{bottomTeam.members.map(p=><PlayerCard key={p.id} p={p} small danger={bankerChoiceLit && p.id===bankerPlayer?.id}/>)}</div></div></div>{!bankerChoiceLit ? <button className="big" onClick={lightBankerChoice}>Advance — Light Up Banker Player</button> : <button className="big" onClick={beginBanker}>Advance to Deal or No Deal</button>}</div>}

    {screen === "banker" && elim && <div className="panel bankerPanel"><div className="bankerHeaderBox"><h2>{elim.isFinale ? "Final Deal or No Deal" : `${elim.player.name} vs The Banker`}</h2>{decisionBanner && <div className="decisionBanner">{decisionBanner}</div>}</div><div className="topDond"><PlayerCard p={elim.player} small/><div className="ownCase">Their Case<br/><span>{elim.playerCaseId ? elim.playerCaseId : "?"}</span></div></div><div className="bankerLayout"><Board e={elim}/><div><div className="caseRack">{elim.cases.map(c=><button key={c.id} disabled={c.open || (c.playerCase && elim.phase!=="caseRevealWait") || (!["chooseOwnCase","pick","caseRevealWait"].includes(elim.phase)) || (elim.phase==="caseRevealWait" && c.id!==elim.playerCaseId)} onClick={()=>selectCase(c.id)} className={`case ${c.open?"open":""} ${c.selected?"lit":""} ${c.playerCase?"own":""} ${elim.phase==="caseRevealWait" && c.playerCase?"revealOwn":""}`}>{c.open ? "✓" : c.id}</button>)}</div>{elim.phase === "chooseOwnCase" && <div className="centerText">{controlElim ? "Pick the player's case." : "The player chooses a case."}</div>}{elim.phase === "pick" && <div className="centerText">{controlElim ? "Select one grey case, then advance." : "A case is selected."} Cases left to open before the next offer: <b>{casesToOpen(elim)}</b></div>}{elim.phase === "opening" && <div className="openingAnim">{money(elim.openingCase.value)}</div>}{elim.phase === "offer" && <div className="offer"><h2>Banker Offer</h2><div className="offerMoney">{money(elim.offer)}</div><p>Advance to Deal or No Deal.</p></div>}{elim.phase === "decision" && <div className="offer"><h2>Deal or No Deal?</h2><div className="offerMoney">{money(elim.offer)}</div>{chooseDeals && <><h3 className="decisionPick">{elim.autoChoice ? "DEAL" : "NO DEAL"}</h3><p>Advance follows this decision, or choose below to override it.</p></>}<button onClick={()=>makeDecision(true)}>Deal</button><button onClick={()=>makeDecision(false)}>No Deal</button></div>}{elim.phase === "caseRevealWait" && <div className="offer"><h2>Open Their Case</h2><p>Click case #{elim.playerCaseId} to reveal it.</p></div>}{elim.phase === "caseReveal" && <div className="offer"><h2>Case Reveal</h2><p>Their case was <b>{money(elim.playerCase)}</b>.</p>{elim.acceptedDeal && <p>Accepted deal: <b>{money(elim.acceptedDeal)}</b></p>}{elim.finalOther != null && <p>Final other case: <b>{money(elim.finalOther)}</b></p>}{!elim.isFinale && <p>Money added to the finale board: <b>{money(elim.prizeAdded || 0)}</b></p>}{elim.isFinale && <p>Final winnings: <b>{money(elim.acceptedDeal || elim.playerCase || 0)}</b></p>}<h3>{elim.resultText}</h3></div>}{["chooseOwnCase","pick"].includes(elim.phase) && !controlElim && <button className="big" onClick={autoSelectCase}>Random</button>}{["pick","opening","offer","decision","caseReveal"].includes(elim.phase) && <button className="big fixedAdvance" disabled={elim.phase==="pick" && !elim.selectedCaseId} onClick={()=>{
  if(elim.phase==="caseReveal"){
    if(elim.isFinale){
      setWinner({
        ...elim.player,
        grandPrize: elim.grandPrize || dealsTaken.reduce((a,b)=>a+b,0),
        finaleCase: elim.playerCase,
        finaleOffer: elim.acceptedDeal || 0,
        tookFinalDeal: Boolean(elim.acceptedDeal),
        finalPrize: elim.acceptedDeal || elim.playerCase || 0,
      });
      setScreen("winner");
    } else {
      chooseEliminationTarget();
    }
  } else {
    advanceBanker();
  }
}}>Advance</button>}</div></div></div>}

    {screen === "eliminationLose" && pendingEliminated && <div className="panel result"><h2>{elim.player.name} Lost To The Banker</h2><PlayerCard p={pendingEliminated}/><p>They lose and are eliminated.</p><button className="big" onClick={finalizeElimination}>Advance</button></div>}

    {screen === "eliminationWin" && pendingEliminated && <div className="panel"><h2>{elim.player.name} Beat The Banker</h2><div className="targetReveal"><PlayerCard p={elim.player} small/><div className="mystery" onClick={()=>setTargetReveal(true)}>{targetReveal ? <PlayerCard p={pendingEliminated} small/> : "?"}</div></div><h3>Eligible Players To Eliminate</h3><div className="grid smallGrid">{eligibleTargets.map(p=><PlayerCard key={p.id} p={p}/>)}</div>{!targetReveal ? <button className="big" onClick={()=>setTargetReveal(true)}>Reveal Who They Chose</button> : <button className="big" onClick={finalizeElimination}>Eliminate {pendingEliminated.name}</button>}</div>}

    {screen === "finale" && winner && <div className="panel"><h2>Finale</h2><PlayerCard p={winner}/><p>{winner.name} is the last player standing and must play one final Deal or No Deal against the Banker.</p><p>The board contains every dollar amount won during elimination rounds, plus one grand-prize case equal to all of those amounts added together.</p><button className="big" onClick={runFinale}>Start Final Deal or No Deal</button></div>}
    {screen === "winner" && winner && <div className="panel winner"><h2>🏆 {winner.name} Wins!</h2><PlayerCard p={winner}/><p>Grand-prize case total: <b>{money(winner.grandPrize || 0)}</b></p><p>Their final case: <b>{money(winner.finaleCase || 0)}</b></p>{winner.tookFinalDeal && <p>Accepted final offer: <b>{money(winner.finaleOffer || 0)}</b></p>}<h2>Final Winnings: {money(winner.finalPrize || 0)}</h2><h3>Placements</h3><div className="placements">{placements.map(p=><p key={p.id}>#{p.placement} {p.name} — eliminated by {p.eliminatedBy}</p>)}</div><button onClick={()=>setScreen("menu")}>Back to Main Menu</button></div>}
  </div>;
}

const css = `
.sim-wrap{font-family:Arial,Helvetica,sans-serif;background:#071323;color:white;min-height:100vh;padding:18px}h1{text-align:center;color:#ffd76a}.panel{max-width:1220px;margin:0 auto;background:#10243b;border:2px solid #31506f;border-radius:16px;padding:18px;box-shadow:0 0 22px #0008}.sim-wrap .big,.sim-wrap .panel button{background:#d6a632;color:#111;border:0;border-radius:10px;font-weight:900;padding:12px 16px;margin:8px;cursor:pointer}.redReveal{background:#b62525!important;color:white!important;box-shadow:0 0 12px #ff4848;border:2px solid #ff9b9b!important}.sim-wrap .big:disabled,.sim-wrap .panel button:disabled{opacity:.35;cursor:not-allowed}.castSelect,.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(125px,1fr));gap:10px}.selectCard,.player{background:#fff;color:#111;border-radius:12px;padding:8px;text-align:center;border:2px solid #222}.selectCard img,.player img{width:100%;height:105px;object-fit:cover;border-radius:9px}.selectCard{display:flex;flex-direction:column;gap:4px}.player.out{filter:grayscale(1);background:#111;color:#aaa}.player.small{width:92px;display:inline-block;margin:4px;vertical-align:top}.player.small img{height:70px}.player.glow{box-shadow:0 0 16px #43ff77;border-color:#43ff77}.player.danger{box-shadow:0 0 16px #ff3b3b;border-color:#ff3b3b;background:#ffecec}.toggles,.buttons{text-align:center;margin:10px}.toggles label{margin:12px;display:inline-block}.moneyline{text-align:center;color:#ffd76a;margin:10px}.interactionGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px}.interaction{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#071323;border:1px solid #31506f;border-radius:14px;padding:8px}.interactionText{text-align:center;line-height:1.35}.teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.team{background:#0b1829;border:2px solid #4b6684;border-radius:14px;padding:10px;text-align:center}.team.immune{border-color:#37d66b;box-shadow:0 0 16px #37d66b66}.team.bottom{border-color:#ff4d4d;box-shadow:0 0 16px #ff4d4d66}.team.stealResolved{border-color:#ff3b3b;box-shadow:0 0 18px #ff3b3b88}.stolenFrom{background:#230b0b;border:1px solid #ff5555;border-radius:10px;margin:8px 0;padding:8px;color:#ffe0e0}.teamMembers{min-height:98px}.caseAmount{font-size:26px;font-weight:1000;color:#ffe28a;margin:10px}.tag{display:inline-block;margin:5px;padding:5px 8px;border-radius:8px}.tag.good{background:#1f8b3e}.tag.bad{background:#9f2323}.choiceLayout{display:grid;grid-template-columns:1fr 1fr;gap:18px;text-align:center}.rowCards{display:flex;justify-content:center;flex-wrap:wrap}.topDond{display:flex;align-items:center;justify-content:center;gap:16px}.ownCase{width:120px;height:105px;background:#eee;color:#111;border:4px solid #999;border-radius:12px;text-align:center;font-weight:1000;padding-top:14px}.ownCase span{font-size:48px}.bankerLayout{display:grid;grid-template-columns:330px 1fr;gap:18px;align-items:start;position:relative}.bankerLayout .dondBoard{position:sticky;top:12px;align-self:start;transform:none;margin-top:-205px;z-index:5}.dondBoard{display:grid;grid-template-columns:1fr 1fr;background:#050b13;border:4px solid #b98924;border-radius:14px;padding:10px;gap:8px}.money{background:#203c62;margin:6px 0;padding:8px;border-radius:6px;text-align:right;font-weight:1000;color:#cbe6ff}.money.high{background:#6b4b08;color:#ffe394}.money.gone{opacity:.22;text-decoration:line-through}.caseRack{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:8px;margin-top:12px}.case{background:#c9c9c9;color:#111;border:3px solid #777;border-radius:9px;padding:15px 5px;text-align:center;font-weight:1000;font-size:22px;min-height:58px}.case.lit{box-shadow:0 0 18px #fff;border-color:#fff;background:#efefef}.case.open{background:#444;color:#fff;border-color:#222}.case.own{background:#e9e9e9;border-style:dashed;color:#111}.case.revealOwn{box-shadow:0 0 18px #ffd76a;border-color:#ffd76a}.centerText{text-align:center;margin:12px;color:#ffe28a}.openingAnim{background:#050505;color:#fff;font-size:34px;font-weight:1000;border:3px solid #fff;border-radius:12px;max-width:280px;margin:16px auto;padding:24px;text-align:center;animation:pop .45s ease}.offer{text-align:center;background:#06111f;border:2px solid #ffd76a;border-radius:14px;padding:14px;margin-top:12px}.offerMoney{font-size:42px;font-weight:1000;color:#ffd76a}.bankerPanel{position:relative}.bankerHeaderBox{min-height:92px;display:flex;flex-direction:column;align-items:center;justify-content:center}.decisionBanner{margin-top:6px;background:#d6a632;color:#111;border-radius:999px;padding:8px 18px;font-size:22px;font-weight:1000;letter-spacing:1px}.fixedAdvance{display:block!important;min-width:160px;margin:18px auto 4px!important;position:sticky;bottom:12px;z-index:20;box-shadow:0 5px 18px #0009}.decisionPick{font-size:30px;color:#ffd76a;letter-spacing:1px;margin:10px 0}.result{text-align:center}.result>.player{max-width:150px;margin:12px auto}.targetReveal{display:flex;align-items:center;justify-content:center;gap:18px}.mystery{width:125px;min-height:125px;background:#071323;border:3px dashed #ffd76a;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:70px;font-weight:1000;cursor:pointer}.mystery .player.small{width:105px;margin:0;font-size:12px}.mystery .player.small b{display:block;font-size:12px;line-height:1.1;overflow-wrap:anywhere;word-break:normal}.mystery .player.small img{height:74px}.smallGrid{grid-template-columns:repeat(auto-fill,minmax(105px,1fr))}.winner{text-align:center}.placements{max-width:500px;margin:auto;text-align:left}@keyframes pop{0%{transform:scale(.75);opacity:.2}100%{transform:scale(1);opacity:1}}@media(max-width:700px){.bankerLayout,.choiceLayout{grid-template-columns:1fr}.bankerLayout .dondBoard{position:relative;top:auto;margin-top:0;transform:none}.castSelect,.grid{grid-template-columns:repeat(3,1fr)}.selectCard img,.player img{height:80px}.sim-wrap{padding:8px}.panel{padding:10px}.interactionGrid{grid-template-columns:1fr}.interaction{flex-direction:column}.offerMoney{font-size:30px}}.castModalBackdrop{position:fixed;inset:0;background:#000d;z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px}.castModal{width:min(1100px,100%);max-height:90vh;overflow:hidden;background:#101010;border:1px solid #444;border-radius:20px;color:white}.castModalHeader{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #333}.castModalHeader h2,.castModalHeader p{margin:0}.castModalBody{display:grid;grid-template-columns:300px 1fr;height:72vh;max-height:72vh;min-height:0;overflow:hidden}.castSidebar,.contestantPane{min-height:0;overflow-y:auto;overflow-x:hidden;padding:14px;overscroll-behavior:contain}.castSidebar{border-right:1px solid #333;scrollbar-gutter:stable}.castChoice{display:block;width:100%;text-align:left;background:#191919!important;color:white!important;margin:5px 0!important}.castChoice.active{background:#d6a632!important;color:#111!important}.castChoice small{display:block;opacity:.7}.modalActions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.modalContestantGrid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.modalPerson{padding:0!important;margin:0!important;background:#222!important;color:white!important;overflow:hidden;border:2px solid transparent!important}.modalPerson.active{border-color:#ffd76a!important}.modalPerson:not(.active){opacity:.4;filter:grayscale(1)}.modalPerson img,.noImage{width:100%;aspect-ratio:1/1;object-fit:cover}.modalPerson span{display:block;padding:5px;font-size:12px}.selectCard{position:relative;cursor:pointer}.selectCard.unselected{opacity:.35;filter:grayscale(1)}.selectionBadge{position:absolute;left:5px;top:5px;background:#071323;color:white;border-radius:999px;padding:2px 7px;font-weight:900;z-index:2}.removeCastButton{position:absolute!important;right:-5px;top:-5px;width:25px;height:25px;padding:0!important;margin:0!important;border-radius:999px!important;background:#ef4444!important;color:white!important;z-index:3}.manageLink{display:inline-flex;background:#d6a632;color:#111;padding:12px 16px;border-radius:10px;font-weight:900;text-decoration:none;margin:8px}.emptyRoster{padding:28px;border:2px dashed #31506f;border-radius:14px;text-align:center;font-weight:900;color:#b9cae0}@media(max-width:700px){.castModalBody{grid-template-columns:1fr;height:76vh;max-height:76vh;grid-template-rows:minmax(150px,220px) minmax(0,1fr)}.castSidebar{max-height:none;border-right:0;border-bottom:1px solid #333}.modalContestantGrid{grid-template-columns:repeat(3,1fr)}}
`;