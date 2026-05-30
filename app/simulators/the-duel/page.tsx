// @ts-nocheck

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { supabase } from "../../../lib/supabase";

export default function TheDuelSimulator() {
  const router = useRouter();

  const [availableCasts, setAvailableCasts] = useState([]);
  const [loadingCasts, setLoadingCasts] = useState(true);
  const [showAddCastModal, setShowAddCastModal] = useState(false);
  const [modalCastId, setModalCastId] = useState("");
  const [modalContestants, setModalContestants] = useState([]);
  const [modalSelectedIds, setModalSelectedIds] = useState(() => new Set());
  const [loadingModalContestants, setLoadingModalContestants] = useState(false);

  const [seasonTitle, setSeasonTitle] = useState("");
  const [seasonSummary, setSeasonSummary] = useState("");
  const [isPublicSeason, setIsPublicSeason] = useState(true);
  const [savingSeason, setSavingSeason] = useState(false);

  const INITIAL_CAST = [];

  const DEFAULT_DUELS = [
    {
      id: "fill-the-board",
      name: "Fill The Board",
      description: "Roll D20s to fill all numbers 1-20. First to complete wins.",
    },
    {
      id: "poison-cup",
      name: "Poison Cup",
      description: "Each player has 16 cups. One is poisoned by opponent. Pick cups until someone drinks poison.",
    },
    {
      id: "coin-flip",
      name: "Coin Flip",
      description: "One picks heads, one picks tails, then a coin flip decides the winner.",
    },
    {
      id: "rock-paper-scissors",
      name: "Rock, Paper, Scissors",
      description: "Both players throw rock, paper, or scissors. Ties are skipped until someone wins.",
    },
    {
      id: "tug-of-war",
      name: "Tug Of War",
      description: "Both players pull each round (+1 to +6). The rope shifts by the difference until someone pulls it all the way.",
    },
    {
      id: "popularity",
      name: "Popularity",
      description: "The house votes between the two duelers. Challenge winner only votes to break a tie.",
    },
    {
      id: "high-roller",
      name: "High Roller",
      description: "Each dueler gets 5 D100 rolls. Highest total wins. If tied, one sudden-death 6th roll decides it.",
    },
    {
      id: "keep-it-up",
      name: "Keep It Up",
      description: "Both duelers try to hold on. Stamina starts at 10, drop chance rises as stamina falls, and slips can reduce stamina further.",
    },
    {
      id: "the-tower",
      name: "The Tower",
      description: "Each dueler secretly has one death rope among 6 colors. Round winner cuts one rope at a time until a death rope is cut.",
    },
    {
      id: "life-points",
      name: "Life Points",
      description: "Both duelers start at 1500 health. Each round they roll 0-500 damage against themselves until someone hits 0 or below.",
    },
    {
      id: "poker",
      name: "Poker",
      description: "Each dueler gets 2 cards and shares 5 community cards. Best poker hand wins.",
    },
    {
      id: "double-duel",
      name: "Double Duel",
      description: "Break the duel pair into two separate duels. Two players go home this round.",
    },
    {
      id: "safe-cracker",
      name: "Safe Cracker",
      description: "Each dueler tries to crack a 4-digit safe code. Correct digits in the correct spots lock in green.",
    },
    {
      id: "standoff",
      name: "Standoff",
      description: "Both duelers choose shoot, reload, or shield at the same time. First to lose all 3 hearts is out.",
    },
    {
      id: "4d-tic-tac-toe",
      name: "4D Tic Tac Toe",
      description: "Play on a 9-board tic tac toe grid. Your move sends the next player to that matching board. Win small boards to claim the main board.",
    },
    {
      id: "word-scramble",
      name: "Word Scramble",
      description: "A 10x10 letter grid feeds both duelers random letters. After 15 advances, longest real word wins. Ties re-deal and go again.",
    },
    {
      id: "knight-moves",
      name: "Knight Moves",
      description: "Duelers move like chess knights across an 8x8 board. Red tiles are burned and cannot be used again. If you have no move, you lose.",
    },
    {
      id: "marathon-roll-duel",
      name: "Marathon Roll",
      description: "Both duelers keep rolling 1-100. The duel ends once first place is more than 100 ahead of second place.",
    },
  ];

  const DEFAULT_DAILIES = [
  {
    id: "daily-high-roller",
    name: "High Roller",
    description: "Everyone rolls 5 D100s. Highest total wins the daily challenge and becomes safe.",
  },
  {
    id: "daily-marathon-roll",
    name: "Marathon Roll",
    description: "Everyone keeps rolling D100s until only one player is not more than 100 behind first place.",
  },
  {
    id: "daily-blackjack",
    name: "Black Jack",
    description: "Free-for-all blackjack. Players tied for the best non-bust total advance until one player remains.",
  },
  {
    id: "daily-four-corners",
    name: "Four Corners",
    description: "Players are randomly sorted into 4 colored corners, then a spinner eliminates one color each round until one player remains.",
  },
  {
    id: "daily-poker",
    name: "Poker",
    description: "Everyone gets a 5-card poker hand from 3 combined decks. Best full poker hand advances; ties replay with only the tied players.",
  },
  {
    id: "daily-hide",
    name: "Hide",
    description: "Players hide under a 7x7 grid (1–49). Take turns revealing squares—if you uncover someone, they’re eliminated. Last one standing wins.",
  },
  {
    id: "daily-ten",
    name: "Ten",
    description: "Each round, players roll 1-10 until they hit 10 and lock in safe for that round. The last player left without a 10 is eliminated.",
  },
  {
    id: "daily-dont-match",
    name: "Don't Match",
    description: "Everyone rolls 1 to X each round, where X is players still in minus 1, with a minimum cap of 5. Any matching numbers are eliminated. Final 2 use one 1-20 roll to decide the winner.",
  },
  {
    id: "daily-count-down",
    name: "Count Down",
    description: "Everyone starts at 21 and rolls a D10 down toward 0. Hit exactly 0 to win, go below 0 and you're out. If everyone busts, it restarts. Tied winners go to a 10-point tiebreak.",
  },
  {
    id: "daily-last-straw",
    name: "Last Straw",
    description: "Everyone has 3 lives. Roll D8 each round. Lowest (including ties) loses a life. If all tie for lowest, reroll. Last player standing wins.",
  },
  {
    id: "daily-majority-loses",
    name: "Majority Loses",
    description: "Everyone rolls 1–5 together. The majority number is eliminated, including ties for majority. If everyone is unique or everyone would go out, reroll. Final 2 use a D20 high-roll.",
  },
  {
    id: "daily-snipe",
    name: "Snipe!",
    description: "A hidden 4-digit code sits up top. Everyone guesses their own 4-digit number, and whoever ends up numerically closest wins the daily.",
  },
  {
    id: "daily-only-up",
    name: "Only Up",
    description: "Everyone starts at 1%. Each advance that number goes up by 1 and becomes their individual chance to be eliminated that turn. Last one standing wins.",
  },
  {
    id: "daily-call-out",
    name: "Call Out",
    description: "Two players face off with D100 rolls. The winner stays in control and calls out the next matchup until one player remains.",
  },
  {
    id: "daily-dont-be-last",
    name: "Don't Be Last",
    description: "Roll each player's D100 one at a time in any order. Lowest score each round is eliminated until one player remains.",
  },
];

  const WORD_SCRAMBLE_DICTIONARY = [
    "a","able","ace","acid","acorn","acre","acres","acted","actor","actors","adore","adored","adorn","adorns","after","again","age","aged","ages","agent","agents","agile","ago","air","airs","alarm","alarms","alert","alerts","alien","align","aligned","aligns","alike","alive","all","allow","allows","alone","along","alter","alters","always","amber","angel","angels","angle","angles","ant","ants","apple","apples","apt","arc","arch","arches","area","areas","arena","arenas","argue","argues","arm","arms","art","arts","ash","ashes","ask","asked","ate","atom","atoms","attend","aunt","aunts","awake","award","awards","aware","away",
    "badge","badges","baker","bakers","bale","bales","ball","balls","band","bands","bank","banks","bare","bared","barn","barns","base","based","bases","basic","basil","beach","beam","beams","bean","beans","bear","bears","beast","beat","beats","become","bed","beds","bee","been","beer","beers","begin","belt","belts","bend","bends","best","better","between","beyond","bird","birds","birth","bit","bits","black","blade","blades","bland","blank","blaze","board","boards","boat","boats","bold","bone","bones","book","books","boost","boots","bore","born","both","bother","bottle","bottles","bound","bow","bowl","bowls","box","boxes","brace","braces","brain","brains","brand","brands","brave","bread","break","breaks","breeze","brick","bricks","bridge","bridges","bright","bring","broad","broads","brother","brown","brush","bubble","build","builds","built","bunch","burn","burns","burst","bus","buses","bush","bushes","busy","butter","button","buttons","buyer","buyers","by",
    "cable","cables","cake","cakes","call","calls","calm","came","camera","camp","camps","can","candle","candles","candy","cap","cape","caps","car","card","cards","care","cares","career","careers","cars","case","cases","cask","cast","casts","cater","caters","cave","caves","cell","cells","center","centers","chain","chains","chair","chairs","chalk","chance","change","changes","charge","charges","chart","charts","chase","chases","cheap","check","cheeks","chess","chest","chief","child","children","choice","choices","choose","chose","circle","circles","claim","claims","class","classes","clean","cleans","clear","clears","clerk","click","cliff","climb","clock","close","closes","cloud","clouds","club","clubs","coach","coast","coat","coats","code","codes","coin","coins","cold","color","colors","come","comes","comfort","common","cook","cooks","cool","cope","copy","cord","cords","core","corn","corner","corners","cost","costs","could","count","counts","course","courses","court","cover","covers","crack","cracker","craft","crafts","crate","crates","create","creates","crew","crews","crisp","cross","crowd","crown","crowns","crystal","cup","cups","curve","curves","cut","cuts","cycle","cycles",
    "danger","dangers","dare","dares","dark","data","date","dates","dealer","dealers","dear","dears","debate","debt","deck","decks","deep","deer","defend","degree","delay","delays","demand","dense","dent","depends","desk","detail","details","device","dices","dine","diner","dinners","direct","dirt","dive","diver","divers","dock","doctor","does","dog","dogs","door","doors","dose","down","draft","drafts","drag","draw","dream","dreams","dress","drew","drift","drink","drive","drives","drop","drops","drove","drum","drums","dry","duck","ducks","during","dust","duty",
    "each","eager","eagle","ear","earned","earns","earth","earths","ease","eases","east","easy","eat","eats","edge","edges","edit","edits","elder","elect","else","end","ends","engine","enjoy","enjoys","enlist","enter","enters","entry","equal","era","eras","error","escape","escapes","estate","even","event","events","ever","every","exact","example","exit","exits","extra","eye","eyes",
    "face","faces","fact","facts","fade","fades","fail","fails","fair","faith","fall","falls","false","fame","family","farm","farms","fast","father","fault","favor","fear","fears","feature","fed","feed","feeds","feel","feels","feet","fell","felt","few","field","fields","fight","file","files","fill","fills","final","find","finder","finders","finds","fine","finger","fingers","finish","fire","fires","firm","first","fish","fits","five","flag","flags","flash","flat","flavor","flee","fleet","flesh","flight","float","floor","floors","flow","flows","flower","flowers","fluid","fly","focus","fold","folds","food","fool","fools","foot","for","force","forces","forest","form","forms","found","frame","frames","free","fresh","friend","friends","from","front","fruit","full","fun","fund","funds","future",
    "gain","gains","game","games","garden","gardens","gas","gate","gates","gather","gave","gear","gears","general","gentle","get","gets","gift","gifts","girl","give","gives","glad","glance","glare","glared","glares","glass","glide","glides","glow","glows","go","goal","goals","goes","gold","gone","good","goods","grade","grades","grain","grains","grand","grant","grants","grape","grapes","graph","graphs","grass","gray","great","green","greet","greets","grind","ground","group","groups","grow","grows","guard","guards","guess","guest","guide","guides",
    "habit","habits","had","hall","halls","hand","hands","hang","happen","happy","hard","harm","has","hat","hater","haters","hats","have","he","head","heads","hear","heard","heart","hearts","heat","heavy","held","hello","help","helps","her","here","hero","high","hill","hills","him","hint","hints","hire","hires","his","hold","holds","home","honor","hope","hopes","horse","horses","hot","hour","hours","house","houses","how","huge","human","humans","humble","hunt","hunts","hurry",
    "ice","idea","ideas","ideal","if","image","images","in","inch","into","iron","is","island","issue","issues","it","item","items",
    "jazz","job","jobs","join","joins","joke","jokes","joy","judge","judges","jump","jumps","just",
    "keep","keeps","kept","key","keys","kind","king","kings","kitchen","knee","knees","knew","knife","knives","know","known","knows",
    "label","labels","labor","lace","laces","lack","ladder","land","lands","lane","lanes","large","larger","laser","lasers","last","late","later","laugh","layer","layers","lead","leader","leaders","leads","leaf","league","lean","leans","learn","learns","least","leave","leaves","led","left","leg","legs","lend","lens","less","lesson","let","letter","letters","level","levels","liberal","life","lift","light","lights","like","liked","line","lines","link","links","lion","list","listen","lists","little","live","lives","load","loads","local","lock","locks","logic","long","look","looks","loose","lord","lose","loses","loss","lost","lot","lots","loud","love","loved","loves","low","lower","luck","lunch","lung","lungs",
    "machine","machines","made","magic","main","major","make","maker","makers","makes","male","many","map","maps","march","mark","marks","market","markets","mask","masks","mass","master","mat","match","matches","mate","mates","matter","matters","may","meal","meals","mean","means","meant","measure","measures","meat","media","meet","meets","member","members","memory","men","metal","meter","meters","middle","might","mild","mile","miles","milk","mind","minds","minor","mint","mirror","mix","mixed","model","models","modern","moment","moments","money","month","months","moon","more","most","motion","motor","mount","mounts","mouse","mouth","move","moves","much","music","must","my",
    "name","names","near","nears","neck","need","needs","nerve","nest","nests","never","new","news","next","nice","night","nine","node","nodes","noise","none","north","nose","note","notes","nothing","notice","noun","number","numbers","nurse",
    "oak","oaks","oar","oars","object","objects","ocean","odd","of","off","offer","offers","office","often","oil","old","on","once","one","ones","only","open","opens","option","options","orange","order","orders","other","our","ours","out","outer","over","own","owner","owners",
    "pace","pack","packs","page","pages","paid","paint","pair","pairs","panel","panels","paper","papers","part","parts","party","pass","passes","past","path","paths","pattern","patterns","pause","pay","peace","peak","peaks","pen","pens","people","per","phase","phone","phones","photo","photos","pick","picks","piece","pieces","pile","piles","pilot","pin","pins","pipe","pipes","pitch","place","places","plain","plan","plans","plane","planes","plant","plants","plate","plates","play","plays","please","plot","plots","plus","point","points","pole","poles","pool","poor","popular","port","ports","pose","poses","post","posts","power","powers","press","price","prices","pride","prime","print","prints","prize","prizes","proof","proper","prove","public","pull","pulls","pulse","pure","push","pushes","put","puts",
    "queen","queens","quick","quiet","quite",
    "race","races","radio","rail","rails","rain","rains","raise","raises","ran","range","ranged","ranger","rangers","rank","ranks","rapid","rare","rate","rates","rather","reach","react","reacts","read","reader","readers","reads","ready","real","reals","reason","reasons","recall","recent","record","records","red","refer","refers","refresh","region","relate","relates","relation","relations","relax","remain","remains","remove","removes","rent","repair","repeat","repeats","reply","rest","rests","retain","retainer","retainers","retains","retail","retails","return","returns","reveal","reveals","review","reviews","rich","ride","rides","right","ring","rings","rise","rises","risk","risks","road","roads","rock","rocks","role","roles","roll","rolls","roof","room","rooms","root","roots","rose","roses","round","rounds","route","routes","row","rows","royal","rule","rules","run","runs","rural","rush",
    "safe","safes","said","sail","sails","salt","same","sample","sand","save","saves","scale","scales","scare","scared","scar","scars","scene","scenes","school","score","scores","screen","screens","sea","seal","seals","search","seat","seats","second","seconds","secret","secure","see","seed","seeds","seek","seeks","seem","seems","seen","select","sense","sent","series","serve","serves","set","sets","settle","settler","settlers","shade","shades","shake","shakes","shall","shape","shapes","share","shares","she","shear","shears","sheet","sheets","shelf","shell","shelter","shift","shifts","shine","ship","ships","shirt","shirts","shock","shoe","shoes","shoot","shore","short","shot","shots","should","show","shows","shut","side","sides","signal","signals","silent","silver","simple","since","sing","single","singles","sit","site","sites","size","sizes","skill","skills","skin","skip","sky","slate","slates","sleep","slide","slides","slight","slow","small","smart","smile","smiles","smoke","smooth","snake","snow","so","social","soft","soil","sold","solid","solve","solves","some","song","songs","soon","sore","sort","sorts","sound","sounds","source","sources","south","space","spaces","speak","speaks","speed","spell","spend","spent","spice","spices","spin","spins","spirit","split","sport","sports","spot","spots","spring","square","squares","stable","staff","stage","stages","stair","stairs","stake","stakes","stand","stands","star","stare","stared","stares","stars","start","started","starter","starters","starts","state","stated","stater","states","stay","stays","steam","steel","steep","steer","step","steps","stick","sticks","still","stock","stone","stones","stood","stop","stops","store","stores","storm","story","stove","strain","strains","strand","strands","strange","street","streets","strength","strike","strikes","string","strings","strong","study","stuff","style","styles","subject","such","sudden","suit","suits","summer","sun","super","sure","surface","surfaces","surprise","swear","sweet","sword","swords","symbol","symbols","system","systems",
    "table","tables","tackle","tail","tails","take","takes","tale","tales","talk","talks","tall","tank","tanks","tap","tape","tapes","target","targets","task","tasks","taste","tax","teach","team","teams","tear","tears","tease","tech","tell","teller","tellers","tells","tend","term","terms","test","tests","text","than","thank","thanks","that","the","their","them","then","there","these","they","thick","thing","things","think","thinks","third","this","those","though","thread","threads","three","through","throw","throws","tide","tied","ties","tight","tile","tiles","time","times","tiny","tip","tips","title","titles","today","tone","tones","too","took","tool","tools","top","tops","topic","topics","total","totals","touch","tower","towers","town","trace","traces","track","tracks","trade","trader","trail","trails","train","trains","travel","treat","treats","tree","trees","trial","trials","triangle","triangles","trick","tricks","trip","trips","true","trust","try","tune","turn","turns","twelve","twice","two","type","types",
    "under","unit","units","until","up","upon","upper","urban","use","used","uses","usual","utility",
    "value","values","vast","veal","verb","verbs","very","view","views","village","visit","visits","voice","voices","vote","votes",
    "wait","walk","walks","wall","walls","want","wants","war","warm","warn","warns","was","wash","washes","watch","watches","water","waters","wave","waves","way","ways","we","weak","wear","wears","weather","week","weeks","weight","weights","well","went","west","wet","what","wheel","wheels","when","where","which","while","white","who","whole","why","wide","wife","wild","will","win","wind","winds","window","windows","wine","wines","wing","wings","winner","winners","winter","wire","wires","wise","wish","with","within","without","wolf","wolves","woman","women","wonder","wood","woods","word","words","work","worker","workers","works","world","worlds","would","write","writer","writers","writes","wrong",
    "yard","yards","year","years","yellow","yes","yet","yield","you","young","your","yours", 
"ability","absence","academy","account","achieve","acquire","address","advance","advice","affair",
"affect","afford","against","agency","agenda","almost","already","alright","amazing","amount",
"ancient","animal","annual","answer","anxiety","anybody","apology","appeal","appear","around",
"arrival","article","aspect","assess","assist","assume","attack","attempt","attend","author",
"backup","balance","barrier","battery","because","become","benefit","between","billion","border",
"bother","branch","breath","bridge","bright","broken","budget","burden","camera","cancel",
"cancer","cannot","carbon","career","castle","casual","center","chance","change","charge",
"choice","choose","circle","client","closed","closer","coffee","column","combat","coming",
"common","company","compare","comply","concern","conduct","confirm","connect","consent","consist",
"contact","contain","content","contest","context","control","convert","corner","correct","costly",
"council","counter","country","couple","course","create","credit","crisis","custom","damage",
"danger","dealer","debate","decade","decide","declare","decline","default","defense","deliver",
"demand","depend","deputy","derive","design","desire","detail","detect","device","differ",
"dinner","direct","doctor","dollar","domain","double","driven","driver","during","easily",
"eating","editor","effect","effort","either","enable","ending","energy","engage","engine",
"enough","ensure","entire","entity","equity","escape","estate","ethics","evening","evident",
"exactly","example","except","excess","expand","expect","expert","export","extend","extent",
"fabric","facing","factor","failed","fairly","family","famous","father","fellow","female",
"figure","filter","finale","finger","finish","flight","flower","follow","forced","forest",
"forget","formal","format","former","foster","future","galaxy","garden","gather","gender",
"gentle","global","golden","ground","growth","handle","happen","hardly","health","height",
"hidden","holder","honest","impact","import","income","indeed","injury","inside","intend",
"invest","island","itself","jacket","jungle","keeper","kernel","ladder","latest","launch",
"lawyer","leader","league","learned","legacy","length","lesson","letter","likely","linear",
"listen","little","living","locate","luxury","mainly","manage","manual","margin","marine",
"market","master","matter","medium","member","memory","mental","method","middle","minute",
"mirror","mobile","modern","module","moment","mostly","motion","mother","muscle","mutual",
"myself","native","nature","nearby","nearly","nobody","normal","notice","number","object",
"obtain","office","offset","online","option","orange","origin","output","oxygen","packed",
"palace","parent","partly","people","period","permit","person","phrase","planet","player",
"please","plenty","pocket","policy","prefer","pretty","prince","prison","profit","proper",
"proven","public","pursue","random","rarely","rather","rating","reader","really","reason",
"recall","recent","record","reduce","reflect","reform","regard","region","relate","relief",
"remain","remote","remove","repair","repeat","replace","report","rescue","resist","resolve",
"respect","result","retain","return","reveal","review","reward","rising","robust","rocket",
"rotate","roughly","runner","safety","salary","sample","saving","scheme","school","screen",
"search","season","second","secret","sector","secure","seeing","select","seller","senior",
"series","server","settle","severe","shadow","should","signal","simple","single","sister",
"slight","smooth","social","solely","source","speech","spirit","spread","spring","square",
"stable","status","steady","strain","stream","street","stress","strict","strike","string",
"strong","studio","submit","sudden","suffer","summer","supply","surely","survey","switch",
"symbol","system","taking","talent","target","tenant","tender","tennis","thanks","theory",
"thirty","though","thread","threat","ticket","timing","tissue","toward","travel","treat",
"trying","tunnel","unable","unique","united","unless","update","useful","vacuum","valley",
"value","varied","vendor","versus","vessel","victim","vision","visual","volume","walker",
"wealth","weekly","weight","window","winner","winter","within","wonder","worker","writer",
"yellow","zealous","anchor","beacon","candle","dragon","eagle","falcon","giant","hunter",
"isolate","jester","knight","legend","mystic","oracle","pirate","quest","ranger","shadowy",
"spartan","titan","viking","warden","wander","whisper","wizard","zombie","artifact","battle",
"chaotic","crimson","destiny","element","fantasy","glimmer","horizon","illusion","journey",
"kingdom","lantern","miracle","nebula","omen","phantom","quartz","ritual","sacred","temple",
"unseen","vortex","warrior","xenial","yearly","zenith"
  ];

  const WORD_SCRAMBLE_WEIGHTED_LETTERS = [
    ...Array(12).fill("E"), ...Array(9).fill("A"), ...Array(8).fill("I"), ...Array(8).fill("O"), ...Array(7).fill("N"),
    ...Array(7).fill("R"), ...Array(7).fill("T"), ...Array(6).fill("L"), ...Array(6).fill("S"), ...Array(6).fill("U"),
    ...Array(5).fill("D"), ...Array(4).fill("G"), ...Array(4).fill("H"), ...Array(4).fill("M"), ...Array(4).fill("C"),
    ...Array(4).fill("P"), ...Array(3).fill("F"), ...Array(3).fill("Y"), ...Array(3).fill("W"), ...Array(3).fill("B"),
    ...Array(2).fill("V"), ...Array(2).fill("K"), "J", "X", "Q", "Z"
  ];

  const buildWordScrambleBoard = () => Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => randomFrom(WORD_SCRAMBLE_WEIGHTED_LETTERS)));

  const pullRandomLetterFromBoard = (board) => {
    const flat = (board || []).flatMap((letter, idx) => []);
    const available = [];
    (board || []).forEach((row, rowIndex) => {
      (row || []).forEach((cell, colIndex) => {
        if (cell) available.push({ letter: cell, rowIndex, colIndex });
      });
    });
    if (!available.length) return null;
    return randomFrom(available);
  };

  const getLetterCounts = (letters) => {
    const counts = {};
    (letters || []).forEach((letter) => {
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  };

  const canSpellWord = (word, counts) => {
    const need = {};
    for (const ch of word.toUpperCase()) {
      need[ch] = (need[ch] || 0) + 1;
      if ((counts[ch] || 0) < need[ch]) return false;
    }
    return true;
  };

  const getUnusedLettersForWord = (letters, word) => {
    const remaining = [...(letters || [])];
    for (const ch of word.toUpperCase()) {
      const idx = remaining.indexOf(ch);
      if (idx >= 0) remaining.splice(idx, 1);
    }
    return remaining;
  };

  const getBestWordFromLetters = (letters) => {
    const counts = getLetterCounts(letters);
    const valid = WORD_SCRAMBLE_DICTIONARY.filter((word) => canSpellWord(word, counts));
    if (!valid.length) {
      const shortValid = WORD_SCRAMBLE_DICTIONARY.filter((word) => word.length >= 2 && canSpellWord(word, counts));
      if (!shortValid.length) return { word: "NO WORD", unused: [...(letters || [])] };
      shortValid.sort((a, b) => b.length - a.length || a.localeCompare(b));
      const bestShort = shortValid[0].toUpperCase();
      return { word: bestShort, unused: getUnusedLettersForWord(letters, bestShort) };
    }
    valid.sort((a, b) => b.length - a.length || a.localeCompare(b));
    const best = valid[0].toUpperCase();
    return { word: best, unused: getUnusedLettersForWord(letters, best) };
  };

  const makePlayers = (rows) =>
    rows
      .map((row, index) => ({
        id: "p-" + index + "-" + row[0],
        name: row[0],
        image: row[1],
      }))
      .filter((p) => p.name && p.image);

  const shuffle = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  };

  const randomFrom = (arr) => (Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);

  const parseCastText = (text) => {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const parsed = [];

    for (const line of lines) {
      const tabParts = line.split("\t").map((x) => x.trim()).filter(Boolean);
      if (tabParts.length >= 2) {
        parsed.push([tabParts.slice(0, -1).join(" "), tabParts[tabParts.length - 1]]);
        continue;
      }
      const httpIndex = line.indexOf("http");
      if (httpIndex > 0) {
        parsed.push([line.slice(0, httpIndex).trim(), line.slice(httpIndex).trim()]);
      }
    }

    return parsed;
  };

  const [castText, setCastText] = useState("");
  const [duels, setDuels] = useState(DEFAULT_DUELS);
  const [dailies] = useState(DEFAULT_DAILIES);
  const [useDailies, setUseDailies] = useState(false);
  const [enabledDailies, setEnabledDailies] = useState(() => Object.fromEntries(DEFAULT_DAILIES.map((daily) => [daily.id, true])));
  const [enabledDuels, setEnabledDuels] = useState(() => Object.fromEntries(DEFAULT_DUELS.map((duel) => [duel.id, true])));
  const [started, setStarted] = useState(false);
  const DEFAULT_SELECTED_CAST_NAMES = new Set([]);

  const [selectedCastNames, setSelectedCastNames] = useState(() => new Set());
  const [players, setPlayers] = useState([]);
  const [eliminated, setEliminated] = useState([]);
  const [screen, setScreen] = useState("setup");
  const [roundNumber, setRoundNumber] = useState(1);
  const [challengeWinnerId, setChallengeWinnerId] = useState(null);
  const [safetyOrder, setSafetyOrder] = useState([]);
  const [revealedSafeCount, setRevealedSafeCount] = useState(1);
  const [duelAId, setDuelAId] = useState(null);
  const [duelBId, setDuelBId] = useState(null);
  const [shuffledDuelOptions, setShuffledDuelOptions] = useState([]);
  const [currentDuel, setCurrentDuel] = useState(null);
  const [duelResult, setDuelResult] = useState(null);
  const [coinFlipState, setCoinFlipState] = useState(null);
  const [rpsState, setRpsState] = useState(null);
  const [tugState, setTugState] = useState(null);
  const [popularityState, setPopularityState] = useState(null);
  const [highRollerState, setHighRollerState] = useState(null);
  const [dailyHighRollerState, setDailyHighRollerState] = useState(null);
  const [dailyMarathonRollState, setDailyMarathonRollState] = useState(null);
  const [dailyBlackjackState, setDailyBlackjackState] = useState(null);
  const [dailyFourCornersState, setDailyFourCornersState] = useState(null);
  const [dailyPokerState, setDailyPokerState] = useState(null);
  const [dailyHideState, setDailyHideState] = useState(null);
  const [dailyTenState, setDailyTenState] = useState(null);
  const [dailyDontMatchState, setDailyDontMatchState] = useState(null);
  const [dailyCountDownState, setDailyCountDownState] = useState(null);
  const [dailyMajorityLosesState, setDailyMajorityLosesState] = useState(null);
  const [dailyLastStrawState, setDailyLastStrawState] = useState(null);
  const [dailySnipeState, setDailySnipeState] = useState(null);
  const [dailyOnlyUpState, setDailyOnlyUpState] = useState(null);
  const [dailyCallOutState, setDailyCallOutState] = useState(null);
  const [dailyDontBeLastState, setDailyDontBeLastState] = useState(null);
  const [keepItUpState, setKeepItUpState] = useState(null);
  const [towerState, setTowerState] = useState(null);
  const [lifePointsState, setLifePointsState] = useState(null);
  const [pokerState, setPokerState] = useState(null);
  const [poisonCupState, setPoisonCupState] = useState(null);
  const [fourDTicTacToeState, setFourDTicTacToeState] = useState(null);
  const [fillTheBoardState, setFillTheBoardState] = useState(null);
  const [doubleDuelState, setDoubleDuelState] = useState(null);
  const [safeCrackerState, setSafeCrackerState] = useState(null);
  const [standoffState, setStandoffState] = useState(null);
  const [wordScrambleState, setWordScrambleState] = useState(null);
  const [knightMovesState, setKnightMovesState] = useState(null);
  const [marathonRollDuelState, setMarathonRollDuelState] = useState(null);
  const [duelLog, setDuelLog] = useState([]);
  const [finalSeriesScore, setFinalSeriesScore] = useState(null);
  const [finalSeriesRemainingDuels, setFinalSeriesRemainingDuels] = useState([]);
  const [winnerId, setWinnerId] = useState(null);
  const [calloutRevealDone, setCalloutRevealDone] = useState(false);
  const [currentDailyChoice, setCurrentDailyChoice] = useState(null);
  const [fourCornersSpinTick, setFourCornersSpinTick] = useState(0);
  const [coinLoserReveal, setCoinLoserReveal] = useState(false);
  const currentLowestDontBeLast = useMemo(() => {
    const activeIds = dailyDontBeLastState?.activeIds || [];
    const roundRolls = dailyDontBeLastState?.roundRolls || {};
    const revealedScores = activeIds
      .map((id) => roundRolls[id])
      .filter((score) => typeof score === "number");
    return revealedScores.length ? Math.min(...revealedScores) : null;
  }, [dailyDontBeLastState]);


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
      setLoadingCasts(false);
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
        setLoadingCasts(false);
        return;
      }

      officialCasts = officialData || [];
    }

    setAvailableCasts([...officialCasts, ...(userCasts || [])]);
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

  function addSelectedContestantsToRoster() {
    const selectedPeople = modalContestants.filter((person) => modalSelectedIds.has(person.id));

    if (selectedPeople.length === 0) return;

    const additions = selectedPeople.map((person) => ({
      id: `${person.cast_id || modalCastId}-${person.id}`,
      name: person.name,
      image: person.image_url || "",
    }));

    const currentPlayers = makePlayers(parseCastText(castText));
    const existingKeys = new Set(currentPlayers.map((player) => player.id));
    const uniqueAdditions = additions.filter((person) => !existingKeys.has(person.id));

    const nextPlayers = [...currentPlayers, ...uniqueAdditions];
    setCastText(nextPlayers.map((player) => `${player.name}\t${player.image}`).join("\n"));
    setSelectedCastNames(new Set(nextPlayers.map((player) => player.name)));
    setShowAddCastModal(false);
    setModalSelectedIds(new Set());
  }

  function clearRoster() {
    if (started) return;
    const confirmClear = confirm("Clear the current Duel roster?");
    if (!confirmClear) return;

    setCastText("");
    setSelectedCastNames(new Set());
  }

  useEffect(() => {
    if (screen === "duelResult" && duelResult?.duelName === "Coin Flip") {
      setCoinLoserReveal(false);
      const timer = setTimeout(() => setCoinLoserReveal(true), 1500);
      return () => clearTimeout(timer);
    }
    setCoinLoserReveal(false);
  }, [screen, duelResult?.duelName, duelResult?.loser?.id]);

  useEffect(() => {
    if (screen !== "dailyFourCorners") return;
    if (dailyFourCornersState?.phase !== "spinning") return;

    const timer = setTimeout(() => {
      setDailyFourCornersState((prev) => {
        if (!prev || prev.phase !== "spinning") return prev;
        return {
          ...prev,
          phase: "eliminate",
        };
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [screen, dailyFourCornersState?.phase]);

  const enabledDuelList = useMemo(() => duels.filter((d) => enabledDuels[d.id]), [duels, enabledDuels]);
  const enabledDailyList = useMemo(() => dailies.filter((d) => enabledDailies[d.id]), [dailies, enabledDailies]);
  const regularSelectableDuels = useMemo(
    () => enabledDuelList.filter((d) => d.id !== "double-duel" || players.filter((p) => p.id !== challengeWinnerId).length >= 4),
    [enabledDuelList, players, challengeWinnerId]
  );
  const doubleDuelSelectableDuels = useMemo(() => enabledDuelList.filter((d) => d.id !== "double-duel"), [enabledDuelList]);
  const setupPlayers = makePlayers(parseCastText(castText));
  const filteredSetupPlayers = setupPlayers.filter((player) => selectedCastNames.has(player.name));
  const livingPlayers = players;
  const challengeWinner = livingPlayers.find((p) => p.id === challengeWinnerId) || null;
  const duelA = livingPlayers.find((p) => p.id === duelAId) || null;
  const duelB = livingPlayers.find((p) => p.id === duelBId) || null;
  const champion = livingPlayers.find((p) => p.id === winnerId) || null;
  const revealedSafeIds = safetyOrder.slice(0, revealedSafeCount);
  const safePlayers = revealedSafeIds.map((id) => livingPlayers.find((p) => p.id === id)).filter(Boolean);
  const unsavedPlayers = livingPlayers.filter((p) => !revealedSafeIds.includes(p.id));
  const duelEligibleCast = livingPlayers.filter((p) => p.id !== duelAId && p.id !== challengeWinnerId);
  const dailyWinner = livingPlayers.find((p) => p.id === (dailyHighRollerState?.winnerId || dailyMarathonRollState?.winnerId || dailyBlackjackState?.winnerId || dailyFourCornersState?.winnerId || dailyPokerState?.winnerId || dailyHideState?.winnerId || dailyTenState?.winnerId || dailyDontMatchState?.winnerId || dailyCountDownState?.winnerId || dailyMajorityLosesState?.winnerId || dailyLastStrawState?.winnerId || dailySnipeState?.winnerId || dailyOnlyUpState?.winnerId || dailyCallOutState?.winnerId || dailyDontBeLastState?.winnerId)) || null;

  const resetRoundState = () => {
    setChallengeWinnerId(null);
    setSafetyOrder([]);
    setRevealedSafeCount(1);
    setDuelAId(null);
    setDuelBId(null);
    setShuffledDuelOptions([]);
    setCurrentDuel(null);
    setDuelResult(null);
    setCoinFlipState(null);
    setRpsState(null);
    setTugState(null);
    setPopularityState(null);
    setHighRollerState(null);
    setDailyHighRollerState(null);
    setDailyMarathonRollState(null);
    setDailyBlackjackState(null);
    setDailyFourCornersState(null);
    setDailyPokerState(null);
    setDailyHideState(null);
    setDailyTenState(null);
    setDailyDontMatchState(null);
    setDailyCountDownState(null);
    setDailyMajorityLosesState(null);
    setDailyLastStrawState(null);
    setDailySnipeState(null);
    setDailyOnlyUpState(null);
    setDailyCallOutState(null);
    setDailyDontBeLastState(null);
    setKeepItUpState(null);
    setTowerState(null);
    setLifePointsState(null);
    setPokerState(null);
    setFourDTicTacToeState(null);
    setFillTheBoardState(null);
    setDoubleDuelState(null);
    setSafeCrackerState(null);
    setStandoffState(null);
    setWordScrambleState(null);
    setKnightMovesState(null);
    setMarathonRollDuelState(null);
    setDuelLog([]);
    setFinalSeriesScore(null);
    setFinalSeriesRemainingDuels([]);
    setCurrentDailyChoice(null);
    setCalloutRevealDone(false);
    setFourCornersSpinTick(0);
  };

  const startSeason = () => {
    const nextPlayers = makePlayers(parseCastText(castText)).filter((player) => selectedCastNames.has(player.name));
    if (nextPlayers.length < 2 || enabledDuelList.length === 0 || (useDailies && enabledDailyList.length === 0)) return;
    setPlayers(nextPlayers);
    setEliminated([]);
    setStarted(true);
    setWinnerId(null);
    setSeasonTitle("");
    setSeasonSummary("");
    setIsPublicSeason(true);
    setRoundNumber(1);
    resetRoundState();
    setScreen("roundStart");
  };

  const goToNextRoundOrEnd = (survivors) => {
    if (survivors.length === 1) {
      setPlayers(survivors);
      setWinnerId(survivors[0].id);
      setScreen("winner");
      return;
    }
    setPlayers(survivors);
    setRoundNumber((n) => n + 1);
    resetRoundState();
    setScreen("roundStart");
  };

  const buildSafetyOrder = (winner) => {
    const others = shuffle(livingPlayers.filter((p) => p.id !== winner.id));
    const ids = [winner.id];
    while (ids.length < livingPlayers.length - 1) {
      ids.push(others[ids.length - 1].id);
    }
    return ids;
  };

  const runCoinFlip = (player1, player2) => {
    const resultPlayer = Math.random() < 0.5 ? player1 : player2;
    const winner = resultPlayer;
    const loser = winner.id === player1.id ? player2 : player1;
    return {
      duelName: "Coin Flip",
      resultPlayer,
      winner,
      loser,
      text: "The coin landed on " + resultPlayer.name + ".",
    };
  };

  const runRockPaperScissors = (player1, player2) => {
    const options = ["Rock", "Paper", "Scissors"];
    const emojiMap = { Rock: "🪨", Paper: "📄", Scissors: "✂️" };
    let p1Pick = null;
    let p2Pick = null;

    do {
      p1Pick = randomFrom(options);
      p2Pick = randomFrom(options);
    } while (p1Pick === p2Pick);

    const p1Wins =
      (p1Pick === "Rock" && p2Pick === "Scissors") ||
      (p1Pick === "Paper" && p2Pick === "Rock") ||
      (p1Pick === "Scissors" && p2Pick === "Paper");

    const winner = p1Wins ? player1 : player2;
    const loser = p1Wins ? player2 : player1;

    return {
      duelName: "Rock, Paper, Scissors",
      p1Pick,
      p2Pick,
      p1Emoji: emojiMap[p1Pick],
      p2Emoji: emojiMap[p2Pick],
      winner,
      loser,
      text: player1.name + " threw " + p1Pick + ". " + player2.name + " threw " + p2Pick + ".",
    };
  };

  const makeDeck = (numDecks = 1) => {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
    for (let d = 0; d < numDecks; d += 1) {
      for (const suit of suits) {
        for (const rank of ranks) deck.push({ rank, suit, deck: d });
      }
    }
    return shuffle(deck);
  };

  const rankValue = (rank) => {
    const map = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13, A: 14 };
    return map[rank];
  };

  const getStraightHigh = (values) => {
    const uniq = [...new Set(values)].sort((a, b) => b - a);
    if (uniq.includes(14)) uniq.push(1);
    for (let i = 0; i <= uniq.length - 5; i += 1) {
      let ok = true;
      for (let j = 0; j < 4; j += 1) {
        if (uniq[i + j] - 1 !== uniq[i + j + 1]) ok = false;
      }
      if (ok) return uniq[i] === 1 ? 5 : uniq[i];
    }
    return null;
  };

  const evaluatePokerHand = (cards) => {
    const safeCards = (cards || []).filter((c) => c && c.rank && c.suit);
    const values = safeCards.map((c) => rankValue(c.rank)).filter((v) => Number.isFinite(v)).sort((a, b) => b - a);
    const counts = {};
    const suits = {};
    values.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    safeCards.forEach((c) => {
      const v = rankValue(c.rank);
      if (!Number.isFinite(v)) return;
      suits[c.suit] = (suits[c.suit] || []).concat(v);
    });

    const byCount = Object.entries(counts)
      .map(([v, c]) => ({ value: Number(v), count: c }))
      .sort((a, b) => b.count - a.count || b.value - a.value);

    let flushSuit = null;
    Object.entries(suits).forEach(([s, vals]) => { if (vals.length >= 5) flushSuit = s; });
    const straightHigh = getStraightHigh(values);
    let straightFlushHigh = null;
    if (flushSuit) straightFlushHigh = getStraightHigh(suits[flushSuit]);

    if (straightFlushHigh) return { score: [8, straightFlushHigh], name: "Straight Flush" };
    if (byCount[0]?.count === 4) {
      const kicker = values.find((v) => v !== byCount[0].value) || 0;
      return { score: [7, byCount[0].value, kicker], name: "Four of a Kind" };
    }
    if (byCount[0]?.count === 3 && byCount[1]?.count >= 2) return { score: [6, byCount[0].value, byCount[1].value], name: "Full House" };
    if (flushSuit) return { score: [5, ...suits[flushSuit].sort((a, b) => b - a).slice(0, 5)], name: "Flush" };
    if (straightHigh) return { score: [4, straightHigh], name: "Straight" };
    if (byCount[0]?.count === 3) {
      const kickers = values.filter((v) => v !== byCount[0].value).slice(0, 2);
      return { score: [3, byCount[0].value, ...kickers], name: "Three of a Kind" };
    }
    if (byCount[0]?.count === 2 && byCount[1]?.count === 2) {
      const highPair = Math.max(byCount[0].value, byCount[1].value);
      const lowPair = Math.min(byCount[0].value, byCount[1].value);
      const kicker = values.find((v) => v !== highPair && v !== lowPair) || 0;
      return { score: [2, highPair, lowPair, kicker], name: "Two Pair" };
    }
    if (byCount[0]?.count === 2) {
      const kickers = values.filter((v) => v !== byCount[0].value).slice(0, 3);
      return { score: [1, byCount[0].value, ...kickers], name: "Pair" };
    }
    return { score: [0, ...values.slice(0, 5)], name: "High Card" };
  };

  const comparePokerScores = (a, b) => {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const av = a[i] || 0;
      const bv = b[i] || 0;
      if (av > bv) return 1;
      if (bv > av) return -1;
    }
    return 0;
  };

  const blackjackCardValue = (rank) => {
    if (!rank) return 0;
    if (rank === "A") return 11;
    if (["K", "Q", "J"].includes(rank)) return 10;
    const n = Number(rank);
    return Number.isFinite(n) ? n : 0;
  };

  const getBlackjackTotal = (cards) => {
    const safeCards = (cards || []).filter((card) => card && card.rank);
    let total = safeCards.reduce((sum, card) => sum + blackjackCardValue(card.rank), 0);
    let aces = safeCards.filter((card) => card.rank === "A").length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return total;
  };

  const isBlackjack = (cards) => {
    const safeCards = (cards || []).filter((card) => card && card.rank);
    return safeCards.length === 2 && getBlackjackTotal(safeCards) === 21;
  };
  const isBust = (cards) => getBlackjackTotal(cards) > 21;

  const makeBlackjackRound = (participantIds, headToHead = false) => {
    const deck = makeDeck(2);
    let index = 0;
    const draw = () => deck[index++] || null;
    const playerHands = {};
    participantIds.forEach((id) => {
      playerHands[id] = [draw(), draw()].filter(Boolean);
    });
    const doneMap = Object.fromEntries(
      participantIds.map((id) => [id, isBlackjack(playerHands[id]) || isBust(playerHands[id])])
    );
    const standingIds = participantIds.filter((id) => isBlackjack(playerHands[id]));
    return {
      participantIds,
      playerHands,
      phase: "players",
      doneMap,
      standingIds,
      lastDraws: {},
      deck,
      deckIndex: index,
      headToHead,
      roundEliminatedIds: [],
      message: participantIds.length === 2
        ? "Final two blackjack. Advance to let both players act."
        : "Free-for-all blackjack. Advance to let all active players act.",
    };
  };

  const decidePokerWinner = (playerA, playerB, evalA, evalB) => {
    const cmp = comparePokerScores(evalA.score, evalB.score);
    if (cmp > 0) return { winner: playerA, loser: playerB, tied: false };
    if (cmp < 0) return { winner: playerB, loser: playerA, tied: false };
    const winner = Math.random() < 0.5 ? playerA : playerB;
    const loser = winner.id === playerA.id ? playerB : playerA;
    return { winner, loser, tied: true };
  };

  const cardKey = (card) => (card && card.rank && card.suit ? card.rank + card.suit : "missing-card");

  const getPokerProgressStats = (holeA, holeB, revealedBoard) => {
    const evalCurrentA = evaluatePokerHand([...holeA, ...revealedBoard]);
    const evalCurrentB = evaluatePokerHand([...holeB, ...revealedBoard]);

    const fullDeck = [];
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    for (const suit of suits) {
      for (const rank of ranks) fullDeck.push({ rank, suit });
    }

    const known = new Set([...(holeA || []), ...(holeB || []), ...(revealedBoard || [])].filter(Boolean).map(cardKey));
    const remainingDeck = fullDeck.filter((card) => !known.has(cardKey(card)));
    const unknownCount = 5 - revealedBoard.length;

    let winsA = 0;
    let winsB = 0;
    let ties = 0;
    let total = 0;

    const scoreRunout = (runout) => {
      const finalBoard = [...revealedBoard, ...runout];
      const evalA = evaluatePokerHand([...holeA, ...finalBoard]);
      const evalB = evaluatePokerHand([...holeB, ...finalBoard]);
      const cmp = comparePokerScores(evalA.score, evalB.score);
      total += 1;
      if (cmp > 0) winsA += 1;
      else if (cmp < 0) winsB += 1;
      else ties += 1;
    };

    if (unknownCount === 0) {
      scoreRunout([]);
    } else if (unknownCount === 1) {
      remainingDeck.forEach((card) => scoreRunout([card]));
    } else if (unknownCount === 2) {
      for (let i = 0; i < remainingDeck.length; i += 1) {
        for (let j = i + 1; j < remainingDeck.length; j += 1) {
          scoreRunout([remainingDeck[i], remainingDeck[j]]);
        }
      }
    } else {
      const samples = 3000;
      for (let i = 0; i < samples; i += 1) {
        const shuffled = shuffle(remainingDeck);
        scoreRunout(shuffled.slice(0, unknownCount));
      }
    }

    const pctA = total ? Math.round((winsA / total) * 100) : 50;
    const pctB = total ? Math.round((winsB / total) * 100) : 50;

    let neededLabel = null;
    let neededCards = [];
    if (revealedBoard.length === 4) {
      const trailing = pctA === pctB ? null : (pctA < pctB ? "A" : "B");
      if (trailing) {
        const candidates = [];
        for (const suit of suits) {
          for (const rank of ranks) {
            const river = { rank, suit };
            const finalBoard = [...revealedBoard, river];
            const evalA = evaluatePokerHand([...holeA, ...finalBoard]);
            const evalB = evaluatePokerHand([...holeB, ...finalBoard]);
            const cmp = comparePokerScores(evalA.score, evalB.score);
            if ((trailing === "A" && cmp > 0) || (trailing === "B" && cmp < 0)) {
              candidates.push(rank + suit);
            }
          }
        }
        neededLabel = trailing;
        neededCards = [...new Set(candidates)];
      }
    }

    return {
      currentHandA: evalCurrentA.name,
      currentHandB: evalCurrentB.name,
      winPctA: pctA,
      winPctB: pctB,
      tiePct: total ? Math.round((ties / total) * 100) : 0,
      neededLabel,
      neededCards,
    };
  };

  const getDailyPokerStageLabel = (revealCount) => {
    if (revealCount <= 0) return "predeal";
    if (revealCount <= 2) return "preflop";
    if (revealCount === 5) return "flop";
    if (revealCount === 6) return "turn";
    if (revealCount >= 7) return "river";
    return "preflop";
  };

  const dealDailyPokerRound = (participantIds) => {
    const deck = makeDeck(3);
    const holeCards = {};
    participantIds.forEach((id, idx) => {
      holeCards[id] = [deck[idx * 2], deck[idx * 2 + 1]].filter(Boolean);
    });
    const boardStart = participantIds.length * 2;
    const board = deck.slice(boardStart, boardStart + 5);
    const currentHands = {};
    participantIds.forEach((id) => {
      currentHands[id] = evaluatePokerHand([...(holeCards[id] || []), ...[]]).name;
    });
    return {
      holeCards,
      board,
      revealCount: 0,
      stage: "predeal",
      currentHands,
      evaluations: {},
      tiedIds: [],
      winnerId: null,
    };
  };

  const resolveDailyPokerShowdown = (participantIds, holeCards, board) => {
    const evaluations = {};
    participantIds.forEach((id) => {
      evaluations[id] = evaluatePokerHand([...(holeCards[id] || []), ...(board || [])]);
    });
    let bestId = participantIds[0] || null;
    participantIds.forEach((id) => {
      if (!bestId) bestId = id;
      else if (comparePokerScores(evaluations[id].score, evaluations[bestId].score) > 0) bestId = id;
    });
    const tiedIds = participantIds.filter((id) => comparePokerScores(evaluations[id].score, evaluations[bestId].score) === 0);
    return {
      evaluations,
      tiedIds,
      winnerId: tiedIds.length === 1 ? tiedIds[0] : null,
    };
  };

  const multiDeckCardKey = (card) => (card && card.rank && card.suit ? `${card.rank}${card.suit}-${card.deck ?? 0}` : "missing-card");

  const buildOrderedDeck = (numDecks = 1) => {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
    for (let d = 0; d < numDecks; d += 1) {
      for (const suit of suits) {
        for (const rank of ranks) deck.push({ rank, suit, deck: d });
      }
    }
    return deck;
  };

  const getDailyPokerProgressStats = (participantIds, holeCards, revealedBoard) => {
    const board = revealedBoard || [];
    const unknownCount = Math.max(0, 5 - board.length);
    const known = new Set([
      ...participantIds.flatMap((id) => holeCards[id] || []),
      ...board,
    ].filter(Boolean).map(multiDeckCardKey));
    const remainingDeck = buildOrderedDeck(3).filter((card) => !known.has(multiDeckCardKey(card)));

    const currentEvaluations = {};
    participantIds.forEach((id) => {
      currentEvaluations[id] = evaluatePokerHand([...(holeCards[id] || []), ...board]);
    });

    const winCounts = Object.fromEntries(participantIds.map((id) => [id, 0]));
    const winningCards = Object.fromEntries(participantIds.map((id) => [id, new Set()]));
    let totalRuns = 0;

    const scoreRunout = (runout) => {
      const finalBoard = [...board, ...runout];
      const evaluations = {};
      participantIds.forEach((id) => {
        evaluations[id] = evaluatePokerHand([...(holeCards[id] || []), ...finalBoard]);
      });
      let bestId = participantIds[0] || null;
      participantIds.forEach((id) => {
        if (!bestId) bestId = id;
        else if (comparePokerScores(evaluations[id].score, evaluations[bestId].score) > 0) bestId = id;
      });
      const tiedBest = participantIds.filter((id) => comparePokerScores(evaluations[id].score, evaluations[bestId].score) === 0);
      tiedBest.forEach((id) => {
        winCounts[id] += 1 / tiedBest.length;
        if (runout.length === 1) winningCards[id].add(runout[0].rank + runout[0].suit);
      });
      totalRuns += 1;
    };

    if (unknownCount === 0) {
      scoreRunout([]);
    } else if (unknownCount === 1) {
      remainingDeck.forEach((card) => scoreRunout([card]));
    } else if (unknownCount === 2) {
      for (let i = 0; i < remainingDeck.length; i += 1) {
        for (let j = i + 1; j < remainingDeck.length; j += 1) {
          scoreRunout([remainingDeck[i], remainingDeck[j]]);
        }
      }
    } else {
      const samples = unknownCount >= 5 ? 1800 : 1400;
      for (let i = 0; i < samples; i += 1) {
        scoreRunout(shuffle(remainingDeck).slice(0, unknownCount));
      }
    }

    const winPcts = {};
    participantIds.forEach((id) => {
      winPcts[id] = totalRuns ? Math.round((winCounts[id] / totalRuns) * 100) : 0;
    });

    const deadIds = participantIds.filter((id) => winPcts[id] === 0 && unknownCount <= 2);
    const needCards = {};
    participantIds.forEach((id) => {
      if (unknownCount === 1) {
        needCards[id] = winPcts[id] > 50 ? ["all other cards"] : Array.from(winningCards[id]);
      } else {
        needCards[id] = [];
      }
    });

    return {
      currentEvaluations,
      winPcts,
      deadIds,
      needCards,
    };
  };

  const createEmptyFourDBoards = () => Array.from({ length: 9 }, () => Array(9).fill(null));

  const getThreeInRowWinner = (cells) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) return cells[a];
    }
    return null;
  };

  const getMajorityWinner = (cells) => {
    const aCount = cells.filter((v) => v === "A").length;
    const bCount = cells.filter((v) => v === "B").length;
    if (aCount > bCount) return "A";
    if (bCount > aCount) return "B";
    return Math.random() < 0.5 ? "A" : "B";
  };

  const resolveMiniBoardWinner = (cells) => {
    const lineWinner = getThreeInRowWinner(cells);
    if (lineWinner) return lineWinner;
    if (cells.every(Boolean)) return getMajorityWinner(cells);
    return null;
  };

  const getAvailableFourDMoves = (state) => {
    if (!state) return [];
    const target = state.forcedBoard;
    if (target !== null && state.boards[target].some((cell) => cell === null)) {
      return state.boards[target]
        .map((cell, cellIndex) => (cell === null ? { boardIndex: target, cellIndex } : null))
        .filter(Boolean);
    }
    const moves = [];
    state.boards.forEach((board, boardIndex) => {
      board.forEach((cell, cellIndex) => {
        if (cell === null) moves.push({ boardIndex, cellIndex });
      });
    });
    return moves;
  };

  const chooseBestFourDMove = (state) => {
    const moves = getAvailableFourDMoves(state);
    if (!moves.length) return null;
    const player = state.currentPlayer;
    const opponent = player === "A" ? "B" : "A";

    const scoreMove = (move) => {
      let score = 0;
      const board = [...state.boards[move.boardIndex]];
      board[move.cellIndex] = player;

      const miniWinNow = getThreeInRowWinner(board) === player;
      if (miniWinNow) score += 1000;

      const boardResolved = resolveMiniBoardWinner(board);
      if (boardResolved === player && !state.mainBoard[move.boardIndex]) score += 800;

      const nextMain = [...state.mainBoard];
      if (boardResolved && !nextMain[move.boardIndex]) nextMain[move.boardIndex] = boardResolved;
      if (getThreeInRowWinner(nextMain) === player) score += 5000;

      const oppCanWinSmall = () => {
        const targetBoardIndex = move.cellIndex;
        const targetBoard = [...state.boards[targetBoardIndex]];
        if (!targetBoard.some((c) => c === null)) return false;
        for (let i = 0; i < 9; i += 1) {
          if (targetBoard[i] === null) {
            const test = [...targetBoard];
            test[i] = opponent;
            if (getThreeInRowWinner(test) === opponent) return true;
          }
        }
        return false;
      };
      if (oppCanWinSmall()) score -= 350;

      const oppThreatsBefore = (() => {
        const currentBoard = state.boards[move.boardIndex];
        let threats = 0;
        for (let i = 0; i < 9; i += 1) {
          if (currentBoard[i] === null) {
            const test = [...currentBoard];
            test[i] = opponent;
            if (getThreeInRowWinner(test) === opponent) threats += 1;
          }
        }
        return threats;
      })();
      const oppThreatsAfter = (() => {
        let threats = 0;
        for (let i = 0; i < 9; i += 1) {
          if (board[i] === null) {
            const test = [...board];
            test[i] = opponent;
            if (getThreeInRowWinner(test) === opponent) threats += 1;
          }
        }
        return threats;
      })();
      score += (oppThreatsBefore - oppThreatsAfter) * 120;

      return score + Math.random() * 5;
    };

    let bestMove = moves[0];
    let bestScore = scoreMove(bestMove);
    for (let i = 1; i < moves.length; i += 1) {
      const s = scoreMove(moves[i]);
      if (s > bestScore) {
        bestScore = s;
        bestMove = moves[i];
      }
    }
    return bestMove;
  };

  const resolveMainBoardWinner = (mainBoard) => {
    const lineWinner = getThreeInRowWinner(mainBoard);
    if (lineWinner) return lineWinner;
    if (mainBoard.every(Boolean)) return getMajorityWinner(mainBoard);
    return null;
  };

  const KNIGHT_DELTAS = [
    [1, 2], [2, 1], [2, -1], [1, -2],
    [-1, -2], [-2, -1], [-2, 1], [-1, 2],
  ];

  const toKnightKey = (r, c) => `${r},${c}`;

  const getKnightLegalMoves = (position, burnedKeys, otherPosition) => {
    if (!position) return [];
    const [r, c] = position;
    return KNIGHT_DELTAS
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8)
      .filter(([nr, nc]) => {
        const key = toKnightKey(nr, nc);
        const occupiedByOther = otherPosition && otherPosition[0] === nr && otherPosition[1] === nc;
        return !burnedKeys.includes(key) && !occupiedByOther;
      });
  };

  const getKnightAllTargets = (position) => {
    if (!position) return [];
    const [r, c] = position;
    return KNIGHT_DELTAS
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8);
  };

  const chooseKnightMove = (moves) => randomFrom(moves);

  const DONT_MATCH_COLOR_POOL = [
    "bg-red-500 text-white border-red-300",
    "bg-blue-500 text-white border-blue-300",
    "bg-yellow-400 text-black border-yellow-200",
    "bg-purple-500 text-white border-purple-300",
    "bg-pink-500 text-white border-pink-300",
    "bg-cyan-500 text-black border-cyan-200",
    "bg-orange-500 text-white border-orange-300",
    "bg-lime-400 text-black border-lime-200",
  ];

  const resolveSelectedDuel = () => {
    startSelectedDuel(currentDuel, false);
  };

  const finalizeDuel = () => {
    if (!duelResult) return;
    const survivors = livingPlayers.filter((p) => p.id !== duelResult.loser.id);
    const eliminatedPlayer = livingPlayers.find((p) => p.id === duelResult.loser.id);
    if (eliminatedPlayer) setEliminated((prev) => [...prev, eliminatedPlayer]);
    goToNextRoundOrEnd(survivors);
  };

  const setupFinalSeries = () => {
    const a = livingPlayers[0];
    const b = livingPlayers[1];
    setDuelAId(a.id);
    setDuelBId(b.id);
    setFinalSeriesScore({ [a.id]: 0, [b.id]: 0, target: 3, round: 1 });
    setFinalSeriesRemainingDuels(shuffle(enabledDuelList.filter((duel) => duel.id !== "popularity" && duel.id !== "double-duel")));
    setCurrentDuel(null);
    setDuelLog([]);
  };

  const startSelectedDuel = (duel, isFinalSeries = false) => {
    if (!duel || !duelA || !duelB) return;

    if (duel.id === "double-duel") {
      setDoubleDuelState({
        stage: "callout1",
        firstCallerId: duelA.id,
        secondCallerId: duelB.id,
        firstTargetId: null,
        secondTargetId: null,
        firstDuel: null,
        secondDuel: null,
      });
      setScreen("doubleDuelCallout1");
      return;
    }

    if (duel.id === "coin-flip") {
      const outcome = runCoinFlip(duelA, duelB);
      setCoinFlipState({
        stage: "intro",
        resultPlayer: outcome.resultPlayer,
        winner: outcome.winner,
        loser: outcome.loser,
        isFinalSeries,
      });
      setDuelResult(outcome);
      setScreen("coinFlipDuel");
      return;
    }

    if (duel.id === "rock-paper-scissors") {
      const outcome = runRockPaperScissors(duelA, duelB);
      setRpsState({
        stage: "intro",
        p1Pick: outcome.p1Pick,
        p2Pick: outcome.p2Pick,
        p1Emoji: outcome.p1Emoji,
        p2Emoji: outcome.p2Emoji,
        winner: outcome.winner,
        loser: outcome.loser,
        isFinalSeries,
      });
      setDuelResult(outcome);
      setScreen("rpsDuel");
      return;
    }

    if (duel.id === "tug-of-war") {
      setTugState({
        position: 5,
        lastPullA: 0,
        lastPullB: 0,
        isFinalSeries,
      });
      setScreen("tugDuel");
      return;
    }

    if (duel.id === "popularity") {
      const voters = livingPlayers.filter((p) => p.id !== duelA.id && p.id !== duelB.id && p.id !== challengeWinnerId);
      const shuffledVoters = shuffle(voters);
      const votes = {};
      shuffledVoters.forEach((voter) => {
        votes[voter.id] = Math.random() < 0.5 ? duelA.id : duelB.id;
      });
      let countA = Object.values(votes).filter((id) => id === duelA.id).length;
      let countB = Object.values(votes).filter((id) => id === duelB.id).length;
      let tiebreakVote = null;
      if (countA === countB && challengeWinner && !isFinalSeries) {
        tiebreakVote = Math.random() < 0.5 ? duelA.id : duelB.id;
      }
      if (countA === countB && isFinalSeries) {
        tiebreakVote = Math.random() < 0.5 ? duelA.id : duelB.id;
      }
      setPopularityState({
        voters: shuffledVoters,
        votes,
        revealedVoterIds: [],
        countA: 0,
        countB: 0,
        tiebreakVote,
        tiebreakRevealed: false,
        finalWinnerId: tiebreakVote ? tiebreakVote : (countA > countB ? duelB.id : duelA.id),
        isFinalSeries,
      });
      setScreen("popularityDuel");
      return;
    }

    if (duel.id === "high-roller") {
      setHighRollerState({
        totalA: 0,
        totalB: 0,
        rollsA: [],
        rollsB: [],
        suddenDeathRound: 0,
        finished: false,
        isFinalSeries,
      });
      setScreen("highRollerDuel");
      return;
    }

    if (duel.id === "keep-it-up") {
      setKeepItUpState({
        staminaA: 10,
        staminaB: 10,
        droppedA: false,
        droppedB: false,
        regainedA: false,
        regainedB: false,
        slippedA: false,
        slippedB: false,
        round: 1,
        finished: false,
        isFinalSeries,
      });
      setScreen("keepItUpDuel");
      return;
    }

    if (duel.id === "the-tower") {
      const colors = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple"];
      setTowerState({
        stage: "intro",
        colors,
        deathA: randomFrom(colors),
        deathB: randomFrom(colors),
        cutA: [],
        cutB: [],
        currentWinnerId: null,
        currentTargetId: null,
        currentCutColor: null,
        finished: false,
        loserId: null,
        round: 1,
        isFinalSeries,
      });
      setScreen("towerDuel");
      return;
    }

    if (duel.id === "life-points") {
      setLifePointsState({
        healthA: 1500,
        healthB: 1500,
        history: [],
        lastRollA: null,
        lastRollB: null,
        round: 1,
        finished: false,
        loserId: null,
        isFinalSeries,
      });
      setScreen("lifePointsDuel");
      return;
    }

    if (duel.id === "poker") {
      const deck = makeDeck();
      const holeA = [deck[0], deck[1]];
      const holeB = [deck[2], deck[3]];
      const board = [deck[4], deck[5], deck[6], deck[7], deck[8]];
      const evalA = evaluatePokerHand([...holeA, ...board]);
      const evalB = evaluatePokerHand([...holeB, ...board]);
      const { winner, loser, tied } = decidePokerWinner(duelA, duelB, evalA, evalB);
      const progress = getPokerProgressStats(holeA, holeB, []);
      setPokerState({
        stage: "intro",
        holeA,
        holeB,
        board,
        revealCount: 0,
        handNameA: evalA.name,
        handNameB: evalB.name,
        currentHandA: progress.currentHandA,
        currentHandB: progress.currentHandB,
        winPctA: progress.winPctA,
        winPctB: progress.winPctB,
        tiePct: progress.tiePct,
        neededLabel: progress.neededLabel,
        neededCards: progress.neededCards,
        winnerId: winner?.id || null,
        loserId: loser?.id || null,
        tied,
        isFinalSeries,
      });
      setDuelResult({
        duelName: "Poker",
        winner,
        loser,
        text: tied ? (winner?.name + " wins the tiebreak after an exact poker tie.") : (winner?.name + " wins with the better hand."),
      });
      setScreen("pokerDuel");
      return;
    }

    if (duel.id === "safe-cracker") {
      const makeCode = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
      setSafeCrackerState({
        codeA: makeCode(),
        codeB: makeCode(),
        lockedA: [null, null, null, null],
        lockedB: [null, null, null, null],
        guessA: [null, null, null, null],
        guessB: [null, null, null, null],
        historyA: [],
        historyB: [],
        finished: false,
        winnerId: null,
        loserId: null,
        isFinalSeries,
      });
      setScreen("safeCrackerDuel");
      return;
    }

    if (duel.id === "standoff") {
      setStandoffState({
        livesA: 3,
        livesB: 3,
        bulletsA: 1,
        bulletsB: 1,
        actionA: null,
        actionB: null,
        history: [],
        round: 1,
        finished: false,
        winnerId: null,
        loserId: null,
        isFinalSeries,
      });
      setScreen("standoffDuel");
      return;
    }

    if (duel.id === "poison-cup") {
      const makeCups = (count = 16) => {
        const poisonIndex = Math.floor(Math.random() * count);
        return Array.from({ length: 16 }, (_, i) => ({
          id: i,
          label: i < count ? String(i + 1) : "",
          active: i < count,
          selected: false,
          revealed: false,
          safeGone: false,
          poison: i === poisonIndex,
        }));
      };

      setPoisonCupState({
        cupsA: makeCups(16),
        cupsB: makeCups(16),
        pickA: null,
        pickB: null,
        stage: "pick",
        finished: false,
        loserId: null,
        isFinalSeries,
      });
      setScreen("poisonCupDuel");
      return;
    }

    if (duel.id === "fill-the-board") {
      setFillTheBoardState({
        filledA: [],
        filledB: [],
        rollsA: [],
        rollsB: [],
        animating: false,
        pendingA: [],
        pendingB: [],
        duplicateFlashA: [],
        duplicateFlashB: [],
        finished: false,
        winnerId: null,
        loserId: null,
        isFinalSeries,
      });
      setScreen("fillTheBoardDuel");
      return;
    }

    if (duel.id === "4d-tic-tac-toe") {
      setFourDTicTacToeState({
        boards: createEmptyFourDBoards(),
        mainBoard: Array(9).fill(null),
        currentPlayer: "A",
        forcedBoard: null,
        moveNumber: 1,
        lastMove: null,
        winnerId: null,
        loserId: null,
        finished: false,
        isFinalSeries,
      });
      setScreen("fourDTicTacToeDuel");
      return;
    }

    if (duel.id === "word-scramble") {
      setWordScrambleState({
        board: buildWordScrambleBoard(),
        collectedA: [],
        collectedB: [],
        advances: 0,
        round: 1,
        stage: "collect",
        wordA: "",
        wordB: "",
        unusedA: [],
        unusedB: [],
        winnerId: null,
        loserId: null,
        finished: false,
        isFinalSeries,
      });
      setScreen("wordScrambleDuel");
      return;
    }

    if (duel.id === "knight-moves") {
      setKnightMovesState({
        posA: [0, 0],
        posB: [7, 7],
        burned: [],
        currentPlayer: "A",
        moveNumber: 1,
        legalMoves: getKnightLegalMoves([0, 0], [], [7, 7]),
        finished: false,
        winnerId: null,
        loserId: null,
        lastMove: null,
        isFinalSeries,
      });
      setScreen("knightMovesDuel");
      return;
    }

    if (duel.id === "marathon-roll-duel") {
      setMarathonRollDuelState({
        totalA: 0,
        totalB: 0,
        rollsA: [],
        rollsB: [],
        lastRollA: null,
        lastRollB: null,
        round: 1,
        finished: false,
        winnerId: null,
        loserId: null,
        isFinalSeries,
      });
      setScreen("marathonRollDuel");
      return;
    }
  };

  const completeFinalSeriesDuel = (outcome, duelId) => {
    if (!duelA || !duelB || !finalSeriesScore || !outcome) return;
    const nextScore = {
      ...finalSeriesScore,
      [outcome.winner.id]: finalSeriesScore[outcome.winner.id] + 1,
      round: finalSeriesScore.round + 1,
    };

    setDuelLog((prev) => [...prev, { ...outcome, round: finalSeriesScore.round, duelId }]);
    setFinalSeriesScore(nextScore);
    setFinalSeriesRemainingDuels((prev) => prev.filter((d) => d.id !== duelId));
    setCurrentDuel(null);

    if (nextScore[outcome.winner.id] >= nextScore.target) {
      setWinnerId(outcome.winner.id);
      setScreen("winner");
    } else {
      setScreen("finalSeries");
    }
  };

  const playFinalSeriesRound = () => {
    if (!currentDuel) return;
    startSelectedDuel(currentDuel, true);
  };

  const advance = () => {
    if (screen === "roundStart") {
      if (livingPlayers.length === 2) {
        setupFinalSeries();
        setScreen("finalSeries");
        return;
      }
      if (useDailies) {
        setCurrentDailyChoice(randomFrom(enabledDailyList));
        setScreen("dailySelection");
      } else {
        setCurrentDailyChoice(null);
        setScreen("challenge");
      }
      return;
    }

    if (screen === "dailySelection") {
      const selectedDaily = currentDailyChoice || randomFrom(enabledDailyList);
      if (selectedDaily?.id === "daily-high-roller") {
        const totals = livingPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
        const rolls = livingPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {});
        setDailyHighRollerState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          players: livingPlayers.map((p) => p.id),
          totals,
          rolls,
          currentRoll: 1,
          finished: false,
          winnerId: null,
        });
        setScreen("dailyHighRoller");
        return;
      }
      if (selectedDaily?.id === "daily-marathon-roll") {
        const totals = livingPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
        const rolls = livingPlayers.reduce((acc, p) => ({ ...acc, [p.id]: [] }), {});
        setDailyMarathonRollState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          players: livingPlayers.map((p) => p.id),
          activeIds: livingPlayers.map((p) => p.id),
          eliminatedIds: [],
          totals,
          rolls,
          currentRoll: 1,
          finished: false,
          winnerId: null,
        });
        setScreen("dailyMarathonRoll");
        return;
      }
      if (selectedDaily?.id === "daily-blackjack") {
        const participantIds = livingPlayers.map((p) => p.id);
        setDailyBlackjackState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds: participantIds,
          eliminatedIds: [],
          round: 1,
          finished: false,
          winnerId: null,
          roundState: makeBlackjackRound(participantIds, participantIds.length === 2),
        });
        setScreen("dailyBlackjack");
        return;
      }
      if (selectedDaily?.id === "daily-four-corners") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyFourCornersState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          cornerMap: {},
          currentSpinColor: null,
          lastEliminatedColor: null,
          phase: "sort",
          round: 1,
          finished: false,
          winnerId: null,
        });
        setScreen("dailyFourCorners");
        return;
      }
      if (selectedDaily?.id === "daily-poker") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyPokerState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          holeCards: {},
          board: [],
          revealCount: 0,
          stage: "predeal",
          currentHands: {},
          currentEvaluations: {},
          winPcts: {},
          needCards: {},
          deadIds: [],
          evaluations: {},
          round: 1,
          finished: false,
          winnerId: null,
          message: "Advance to deal the hole cards.",
        });
        setScreen("dailyPoker");
        return;
      }
      if (selectedDaily?.id === "daily-hide") {
        const turnOrder = shuffle(livingPlayers.map((p) => p.id));
        const openNumbers = shuffle(Array.from({ length: 49 }, (_, i) => i + 1));
        const hidingMap = {};
        turnOrder.forEach((id, index) => {
          hidingMap[openNumbers[index]] = id;
        });
        setDailyHideState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          turnOrder,
          hidingMap,
          revealedMap: {},
          eliminatedIds: [],
          pendingRemovalIds: [],
          turnIndex: 0,
          currentPickerId: null,
          currentPickNumber: null,
          stage: "intro",
          round: 1,
          finished: false,
          winnerId: null,
          message: "Advance to begin the Hide daily.",
        });
        setScreen("dailyHide");
        return;
      }
      if (selectedDaily?.id === "daily-ten") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyTenState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          lockedIds: [],
          rollValues: {},
          round: 1,
          stage: "rolling",
          pendingEliminatedId: null,
          finished: false,
          winnerId: null,
          message: "Advance to roll 1-10 for everyone still in the round.",
        });
        setScreen("dailyTen");
        return;
      }
      if (selectedDaily?.id === "daily-dont-match") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyDontMatchState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          rollValues: {},
          matchColorMap: {},
          round: 1,
          finished: false,
          winnerId: null,
          message: "Advance to roll. Any matching numbers are eliminated.",
        });
        setScreen("dailyDontMatch");
        return;
      }
      if (selectedDaily?.id === "daily-count-down") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyCountDownState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          mode: "main",
          targetStart: 21,
          totals: Object.fromEntries(activeIds.map((id) => [id, 21])),
          roundRolls: {},
          round: 1,
          finished: false,
          winnerId: null,
          message: "Click each player's D10 to count down toward 0.",
        });
        setScreen("dailyCountDown");
        return;
      }
      if (selectedDaily?.id === "daily-majority-loses") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyMajorityLosesState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          rollValues: {},
          majorityIds: [],
          round: 1,
          finished: false,
          winnerId: null,
          message: "Advance to roll 1-5 for everyone. The majority loses.",
        });
        setScreen("dailyMajorityLoses");
        return;
      }
      if (selectedDaily?.id === "daily-last-straw") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyLastStrawState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          lives: Object.fromEntries(activeIds.map((id) => [id, 3])),
          rollValues: {},
          lowestIds: [],
          stage: "rolling",
          round: 1,
          finished: false,
          winnerId: null,
          message: "Roll D8. Lowest loses a life.",
        });
        setScreen("dailyLastStraw");
        return;
      }
      if (selectedDaily?.id === "daily-snipe") {
        const mystery = String(Math.floor(Math.random() * 10000)).padStart(4, "0").split("");
        const guesses = {};
        livingPlayers.forEach((player) => {
          guesses[player.id] = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
        });
        setDailySnipeState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          mysteryDigits: mystery,
          revealedDigits: [false, false, false, false],
          guesses,
          finished: false,
          winnerId: null,
          message: "Click any ? card up top to reveal digits in any order.",
        });
        setScreen("dailySnipe");
        return;
      }
      if (selectedDaily?.id === "daily-only-up") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyOnlyUpState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          justEliminatedIds: [],
          odds: Object.fromEntries(activeIds.map((id) => [id, 1])),
          round: 1,
          stage: "rolling",
          finished: false,
          winnerId: null,
          message: "Advance to raise the odds and see who gets eliminated.",
        });
        setScreen("dailyOnlyUp");
        return;
      }
      if (selectedDaily?.id === "daily-call-out") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyCallOutState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          currentPair: [],
          lastRolls: {},
          chooserId: null,
          round: 1,
          stage: "intro",
          finished: false,
          winnerId: null,
          message: "Advance to randomly select the first two players.",
        });
        setScreen("dailyCallOut");
        return;
      }
      if (selectedDaily?.id === "daily-dont-be-last") {
        const activeIds = livingPlayers.map((p) => p.id);
        setDailyDontBeLastState({
          dailyId: selectedDaily.id,
          dailyName: selectedDaily.name,
          activeIds,
          eliminatedIds: [],
          round: 1,
          roundRolls: {},
          lastEliminatedId: null,
          finished: false,
          winnerId: null,
          message: "Click each D100 to reveal rolls in any order. Lowest score is eliminated.",
        });
        setScreen("dailyDontBeLast");
        return;
      }
      setScreen("challenge");
      return;
    }

    if (screen === "dailyHighRoller") {
      if (!dailyHighRollerState) return;
      if (dailyHighRollerState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyHighRollerState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const nextRollNumber = dailyHighRollerState.currentRoll;
      const nextTotals = { ...dailyHighRollerState.totals };
      const nextRolls = { ...dailyHighRollerState.rolls };
      livingPlayers.forEach((p) => {
        const roll = Math.floor(Math.random() * 100) + 1;
        nextTotals[p.id] = (nextTotals[p.id] || 0) + roll;
        nextRolls[p.id] = [...(nextRolls[p.id] || []), roll];
      });

      if (nextRollNumber >= 5) {
        const maxTotal = Math.max(...livingPlayers.map((p) => nextTotals[p.id] || 0));
        const tied = livingPlayers.filter((p) => (nextTotals[p.id] || 0) === maxTotal);
        const winner = randomFrom(tied);
        setDailyHighRollerState((prev) => ({
          ...prev,
          totals: nextTotals,
          rolls: nextRolls,
          currentRoll: nextRollNumber,
          finished: true,
          winnerId: winner?.id || null,
        }));
        return;
      }

      setDailyHighRollerState((prev) => ({
        ...prev,
        totals: nextTotals,
        rolls: nextRolls,
        currentRoll: nextRollNumber + 1,
      }));
      return;
    }

    if (screen === "dailyMarathonRoll") {
      if (!dailyMarathonRollState) return;
      if (dailyMarathonRollState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyMarathonRollState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const nextRollNumber = dailyMarathonRollState.currentRoll;
      const nextTotals = { ...dailyMarathonRollState.totals };
      const nextRolls = { ...dailyMarathonRollState.rolls };
      const activeIds = [...dailyMarathonRollState.activeIds];

      activeIds.forEach((id) => {
        const roll = Math.floor(Math.random() * 100) + 1;
        nextTotals[id] = (nextTotals[id] || 0) + roll;
        nextRolls[id] = [...(nextRolls[id] || []), roll];
      });

      const leaderScore = Math.max(...activeIds.map((id) => nextTotals[id] || 0));
      const stillActive = activeIds.filter((id) => leaderScore - (nextTotals[id] || 0) <= 100);
      const newlyEliminated = activeIds.filter((id) => !stillActive.includes(id));
      const eliminatedIds = [...dailyMarathonRollState.eliminatedIds, ...newlyEliminated];

      if (stillActive.length <= 1) {
        setDailyMarathonRollState((prev) => ({
          ...prev,
          totals: nextTotals,
          rolls: nextRolls,
          activeIds: stillActive,
          eliminatedIds,
          currentRoll: nextRollNumber,
          finished: true,
          winnerId: stillActive[0] || null,
        }));
        return;
      }

      setDailyMarathonRollState((prev) => ({
        ...prev,
        totals: nextTotals,
        rolls: nextRolls,
        activeIds: stillActive,
        eliminatedIds,
        currentRoll: nextRollNumber + 1,
      }));
      return;
    }

    if (screen === "dailyBlackjack") {
      if (!dailyBlackjackState) return;
      if (dailyBlackjackState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyBlackjackState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const roundState = dailyBlackjackState.roundState;
      if (!roundState) return;

      if (roundState.phase === "players") {
        const unresolved = roundState.participantIds.filter((id) => !roundState.doneMap[id]);
        if (!unresolved.length) {
          setDailyBlackjackState((prev) => ({
            ...prev,
            roundState: {
              ...prev.roundState,
              phase: "resolve",
              message: "All remaining players are standing or busted. Advance to resolve the round.",
            },
          }));
          return;
        }

        let deckIndex = roundState.deckIndex;
        const nextHands = { ...roundState.playerHands };
        const nextDoneMap = { ...roundState.doneMap };
        const nextStandingIds = [...(roundState.standingIds || [])];
        const nextLastDraws = {};
        const actionParts = [];

        unresolved.forEach((actorId) => {
          const hand = nextHands[actorId] || [];
          const total = getBlackjackTotal(hand);
          const actorName = livingPlayers.find((p) => p.id === actorId)?.name || "Player";

          const lockedBest = Math.max(
            0,
            ...roundState.participantIds
              .filter((id) => id !== actorId && (nextStandingIds.includes(id) || nextDoneMap[id]))
              .map((id) => {
                const otherHand = nextHands[id] || [];
                return isBust(otherHand) ? 0 : getBlackjackTotal(otherHand);
              })
          );

          const shouldForceHitFor21 = lockedBest === 21 && total < 21;
          if (total >= 17 && !shouldForceHitFor21) {
            nextDoneMap[actorId] = true;
            if (!nextStandingIds.includes(actorId)) nextStandingIds.push(actorId);
            actionParts.push(actorName + " stands on " + total);
            return;
          }

          const nextCard = roundState.deck[deckIndex] || null;
          if (!nextCard) {
            nextDoneMap[actorId] = true;
            if (!nextStandingIds.includes(actorId)) nextStandingIds.push(actorId);
            actionParts.push(actorName + " stands (deck empty)");
            return;
          }

          deckIndex += 1;
          const nextHand = [...hand, nextCard];
          nextHands[actorId] = nextHand;
          nextLastDraws[actorId] = nextCard;
          const busted = isBust(nextHand);
          const newTotal = getBlackjackTotal(nextHand);
          nextDoneMap[actorId] = busted;
          if (busted) {
            actionParts.push(actorName + " busts on " + newTotal);
          } else {
            actionParts.push(actorName + " hits to " + newTotal);
          }
        });

        setDailyBlackjackState((prev) => ({
          ...prev,
          roundState: {
            ...prev.roundState,
            playerHands: nextHands,
            deckIndex,
            doneMap: nextDoneMap,
            standingIds: nextStandingIds,
            lastDraws: nextLastDraws,
            message: actionParts.length ? actionParts.join(" • ") : "Advance to continue.",
          },
        }));
        return;
      }

      if (roundState.phase === "resolve") {
        const nonBustIds = roundState.participantIds.filter((id) => !isBust(roundState.playerHands[id] || []));
        if (!nonBustIds.length) {
          setDailyBlackjackState((prev) => ({
            ...prev,
            round: prev.round + 1,
            roundState: makeBlackjackRound(prev.activeIds, prev.activeIds.length === 2),
          }));
          return;
        }

        const bestTotal = Math.max(...nonBustIds.map((id) => getBlackjackTotal(roundState.playerHands[id] || [])));
        const survivors = nonBustIds.filter((id) => getBlackjackTotal(roundState.playerHands[id] || []) === bestTotal);
        const roundOut = roundState.participantIds.filter((id) => !survivors.includes(id));

        if (survivors.length === 1) {
          setDailyBlackjackState((prev) => ({
            ...prev,
            activeIds: survivors,
            eliminatedIds: [...prev.eliminatedIds, ...roundOut],
            finished: true,
            winnerId: survivors[0],
            roundState: {
              ...prev.roundState,
              message: (livingPlayers.find((p) => p.id === survivors[0])?.name || "A player") + " wins the blackjack daily.",
            },
          }));
          return;
        }

        setDailyBlackjackState((prev) => ({
          ...prev,
          activeIds: survivors,
          eliminatedIds: [...prev.eliminatedIds, ...roundOut],
          round: prev.round + 1,
          roundState: makeBlackjackRound(survivors, survivors.length === 2),
        }));
        return;
      }
      return;
    }

    if (screen === "dailyFourCorners") {
      if (!dailyFourCornersState) return;
      if (dailyFourCornersState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyFourCornersState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const colors = ["blue", "green", "red", "yellow"];

      if (dailyFourCornersState.phase === "sort") {
        const shuffledIds = shuffle(dailyFourCornersState.activeIds);
        const cornerMap = {};
        shuffledIds.forEach((id, index) => {
          cornerMap[id] = colors[index % 4];
        });
        setDailyFourCornersState((prev) => ({
          ...prev,
          cornerMap,
          currentSpinColor: null,
          lastEliminatedColor: null,
          phase: "spin",
        }));
        return;
      }

      if (dailyFourCornersState.phase === "spin") {
        const currentSpinColor = randomFrom(colors);
        setFourCornersSpinTick((t) => t + 1);
        setDailyFourCornersState((prev) => ({
          ...prev,
          currentSpinColor,
          lastEliminatedColor: currentSpinColor,
          phase: "spinning",
        }));
        return;
      }

      if (dailyFourCornersState.phase === "spinning") {
        return;
      }

      if (dailyFourCornersState.phase === "eliminate") {
        const currentSpinColor = dailyFourCornersState.currentSpinColor;
        const knockedOut = dailyFourCornersState.activeIds.filter((id) => dailyFourCornersState.cornerMap[id] === currentSpinColor);
        const survivors = dailyFourCornersState.activeIds.filter((id) => dailyFourCornersState.cornerMap[id] !== currentSpinColor);
        if (survivors.length <= 1) {
          setDailyFourCornersState((prev) => ({
            ...prev,
            activeIds: survivors,
            eliminatedIds: [...prev.eliminatedIds, ...knockedOut],
            finished: true,
            winnerId: survivors[0] || null,
            phase: "result",
          }));
          return;
        }
        setDailyFourCornersState((prev) => ({
          ...prev,
          activeIds: survivors,
          eliminatedIds: [...prev.eliminatedIds, ...knockedOut],
          round: prev.round + 1,
          phase: "sort",
        }));
        return;
      }
      return;
    }

    if (screen === "dailyPoker") {
      if (!dailyPokerState) return;
      if (dailyPokerState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyPokerState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      if (dailyPokerState.stage === "predeal") {
        const roundData = dealDailyPokerRound(dailyPokerState.activeIds);
        const progress = getDailyPokerProgressStats(dailyPokerState.activeIds, roundData.holeCards, []);
        const currentHands = {};
        dailyPokerState.activeIds.forEach((id) => {
          currentHands[id] = progress.currentEvaluations[id]?.name || roundData.currentHands[id] || "High Card";
        });
        setDailyPokerState((prev) => ({
          ...prev,
          holeCards: roundData.holeCards,
          board: roundData.board,
          revealCount: 2,
          stage: "preflop",
          currentHands,
          currentEvaluations: progress.currentEvaluations,
          winPcts: progress.winPcts,
          needCards: progress.needCards,
          deadIds: progress.deadIds,
          evaluations: {},
          message: "Hole cards dealt. Advance to reveal the flop.",
        }));
        return;
      }

      if (dailyPokerState.stage === "preflop") {
        const revealBoard = dailyPokerState.board.slice(0, 3);
        const progress = getDailyPokerProgressStats(dailyPokerState.activeIds, dailyPokerState.holeCards, revealBoard);
        const currentHands = {};
        dailyPokerState.activeIds.forEach((id) => {
          currentHands[id] = progress.currentEvaluations[id]?.name || "High Card";
        });
        setDailyPokerState((prev) => ({
          ...prev,
          revealCount: 5,
          stage: "flop",
          currentHands,
          currentEvaluations: progress.currentEvaluations,
          winPcts: progress.winPcts,
          needCards: progress.needCards,
          deadIds: progress.deadIds,
          message: "Flop revealed. Advance to reveal the turn.",
        }));
        return;
      }

      if (dailyPokerState.stage === "flop") {
        const revealBoard = dailyPokerState.board.slice(0, 4);
        const progress = getDailyPokerProgressStats(dailyPokerState.activeIds, dailyPokerState.holeCards, revealBoard);
        const currentHands = {};
        dailyPokerState.activeIds.forEach((id) => {
          currentHands[id] = progress.currentEvaluations[id]?.name || "High Card";
        });
        setDailyPokerState((prev) => ({
          ...prev,
          revealCount: 6,
          stage: "turn",
          currentHands,
          currentEvaluations: progress.currentEvaluations,
          winPcts: progress.winPcts,
          needCards: progress.needCards,
          deadIds: progress.deadIds,
          message: "Turn revealed. Advance to reveal the river.",
        }));
        return;
      }

      if (dailyPokerState.stage === "turn") {
        const revealBoard = dailyPokerState.board.slice(0, 5);
        const progress = getDailyPokerProgressStats(dailyPokerState.activeIds, dailyPokerState.holeCards, revealBoard);
        const currentHands = {};
        dailyPokerState.activeIds.forEach((id) => {
          currentHands[id] = progress.currentEvaluations[id]?.name || "High Card";
        });
        setDailyPokerState((prev) => ({
          ...prev,
          revealCount: 7,
          stage: "river",
          currentHands,
          currentEvaluations: progress.currentEvaluations,
          winPcts: progress.winPcts,
          needCards: progress.needCards,
          deadIds: progress.deadIds,
          message: "River revealed. Advance for showdown.",
        }));
        return;
      }

      if (dailyPokerState.stage === "river") {
        const result = resolveDailyPokerShowdown(dailyPokerState.activeIds, dailyPokerState.holeCards, dailyPokerState.board);
        if (result.winnerId) {
          const roundLosers = dailyPokerState.activeIds.filter((id) => id !== result.winnerId);
          setDailyPokerState((prev) => ({
            ...prev,
            evaluations: result.evaluations,
            currentEvaluations: result.evaluations,
            winPcts: Object.fromEntries(prev.activeIds.map((id) => [id, id === result.winnerId ? 100 : 0])),
            needCards: {},
            deadIds: prev.activeIds.filter((id) => id !== result.winnerId),
            eliminatedIds: [...prev.eliminatedIds, ...roundLosers],
            activeIds: [result.winnerId],
            stage: "showdown",
            finished: true,
            winnerId: result.winnerId,
            message: (livingPlayers.find((p) => p.id === result.winnerId)?.name || "A player") + " wins the poker daily.",
          }));
          return;
        }
        const roundOut = dailyPokerState.activeIds.filter((id) => !result.tiedIds.includes(id));
        setDailyPokerState((prev) => ({
          ...prev,
          evaluations: result.evaluations,
          currentEvaluations: result.evaluations,
          winPcts: Object.fromEntries(prev.activeIds.map((id) => [id, result.tiedIds.includes(id) ? Math.round(100 / result.tiedIds.length) : 0])),
          needCards: {},
          deadIds: prev.activeIds.filter((id) => !result.tiedIds.includes(id)),
          eliminatedIds: [...prev.eliminatedIds, ...roundOut],
          activeIds: result.tiedIds,
          stage: "showdown",
          message: result.tiedIds.length + " players tied for best hand. Advance to redeal only the tied players.",
        }));
        return;
      }

      if (dailyPokerState.stage === "showdown") {
        const roundData = dealDailyPokerRound(dailyPokerState.activeIds);
        setDailyPokerState((prev) => ({
          ...prev,
          holeCards: roundData.holeCards,
          board: roundData.board,
          revealCount: 2,
          stage: "preflop",
          currentHands: roundData.currentHands,
          currentEvaluations: {},
          winPcts: {},
          needCards: {},
          deadIds: [],
          evaluations: {},
          round: prev.round + 1,
          message: "Tiebreak round dealt. Advance to reveal the flop.",
        }));
        return;
      }
      return;
    }

    if (screen === "dailyTen") {
      if (!dailyTenState) return;
      if (dailyTenState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyTenState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      if (dailyTenState.stage === "roundResult") {
        setDailyTenState((prev) => ({
          ...prev,
          lockedIds: [],
          rollValues: {},
          pendingEliminatedId: null,
          round: prev.round + 1,
          stage: "rolling",
          message: "Advance to roll 1-10 for everyone still in the round.",
        }));
        return;
      }

      const rollingIds = dailyTenState.activeIds.filter((id) => !dailyTenState.lockedIds.includes(id));
      const nextRollValues = { ...dailyTenState.rollValues };
      const nextLockedIds = [...dailyTenState.lockedIds];
      rollingIds.forEach((id) => {
        const roll = Math.floor(Math.random() * 10) + 1;
        nextRollValues[id] = roll;
        if (roll === 10 && !nextLockedIds.includes(id)) nextLockedIds.push(id);
      });

      const remainingUnlocked = dailyTenState.activeIds.filter((id) => !nextLockedIds.includes(id));

      if (remainingUnlocked.length === 1) {
        const eliminatedId = remainingUnlocked[0];
        const nextActiveIds = dailyTenState.activeIds.filter((id) => id !== eliminatedId);
        if (nextActiveIds.length <= 1) {
          setDailyTenState((prev) => ({
            ...prev,
            activeIds: nextActiveIds,
            eliminatedIds: [...prev.eliminatedIds, eliminatedId],
            lockedIds: [],
            rollValues: nextRollValues,
            pendingEliminatedId: eliminatedId,
            finished: true,
            winnerId: nextActiveIds[0] || null,
            message: (livingPlayers.find((p) => p.id === eliminatedId)?.name || "A player") + " was last to hit 10 and was eliminated.",
          }));
          return;
        }
        setDailyTenState((prev) => ({
          ...prev,
          activeIds: nextActiveIds,
          eliminatedIds: [...prev.eliminatedIds, eliminatedId],
          lockedIds: nextLockedIds,
          rollValues: nextRollValues,
          pendingEliminatedId: eliminatedId,
          stage: "roundResult",
          message: (livingPlayers.find((p) => p.id === eliminatedId)?.name || "A player") + " was last to hit 10 and is eliminated.",
        }));
        return;
      }

      if (remainingUnlocked.length === 0) {
        setDailyTenState((prev) => ({
          ...prev,
          lockedIds: [],
          rollValues: {},
          message: "Everybody left rolled a 10. The same players keep going until one person is last.",
        }));
        return;
      }

      setDailyTenState((prev) => ({
        ...prev,
        lockedIds: nextLockedIds,
        rollValues: nextRollValues,
        message: remainingUnlocked.length + " players still need a 10.",
      }));
      return;
    }

    if (screen === "dailyDontMatch") {
      if (!dailyDontMatchState) return;
      if (dailyDontMatchState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyDontMatchState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const activeIds = [...(dailyDontMatchState.activeIds || [])];
      if (activeIds.length <= 1) {
        setDailyDontMatchState((prev) => ({
          ...prev,
          finished: true,
          winnerId: activeIds[0] || null,
          message: (livingPlayers.find((p) => p.id === (activeIds[0] || null))?.name || "A player") + " wins Don't Match.",
        }));
        return;
      }

      if (activeIds.length === 2) {
        let rollA = Math.floor(Math.random() * 20) + 1;
        let rollB = Math.floor(Math.random() * 20) + 1;
        while (rollA === rollB) {
          rollA = Math.floor(Math.random() * 20) + 1;
          rollB = Math.floor(Math.random() * 20) + 1;
        }
        const winnerId = rollA > rollB ? activeIds[0] : activeIds[1];
        const loserId = winnerId === activeIds[0] ? activeIds[1] : activeIds[0];
        setDailyDontMatchState((prev) => ({
          ...prev,
          rollValues: { [activeIds[0]]: rollA, [activeIds[1]]: rollB },
          matchColorMap: {},
          activeIds: [winnerId],
          eliminatedIds: [...prev.eliminatedIds, loserId],
          finished: true,
          winnerId,
          message: (livingPlayers.find((p) => p.id === winnerId)?.name || "A player") + " wins the final 1-20 roll.",
        }));
        return;
      }

      const maxRoll = Math.max(5, activeIds.length - 1);
      const rollValues = {};
      activeIds.forEach((id) => {
        rollValues[id] = Math.floor(Math.random() * maxRoll) + 1;
      });

      const groups = {};
      Object.entries(rollValues).forEach(([id, value]) => {
        if (!groups[value]) groups[value] = [];
        groups[value].push(id);
      });

      const matchedGroups = Object.values(groups).filter((ids) => ids.length > 1);
      const matchedIds = matchedGroups.flat();
      const matchColorMap = {};
      matchedGroups.forEach((ids, index) => {
        const colorClass = DONT_MATCH_COLOR_POOL[index % DONT_MATCH_COLOR_POOL.length];
        ids.forEach((id) => {
          matchColorMap[id] = colorClass;
        });
      });

      const nextActiveIds = activeIds.filter((id) => !matchedIds.includes(id));

      if (nextActiveIds.length === 0) {
        setDailyDontMatchState((prev) => ({
          ...prev,
          rollValues,
          matchColorMap,
          message: "Everyone matched. Redoing the same round with the same players.",
        }));
        return;
      }

      if (nextActiveIds.length === 1) {
        setDailyDontMatchState((prev) => ({
          ...prev,
          rollValues,
          matchColorMap,
          activeIds: nextActiveIds,
          eliminatedIds: [...prev.eliminatedIds, ...matchedIds],
          finished: true,
          winnerId: nextActiveIds[0] || null,
          message: (livingPlayers.find((p) => p.id === nextActiveIds[0])?.name || "A player") + " survives the final unmatched roll.",
        }));
        return;
      }

      setDailyDontMatchState((prev) => ({
        ...prev,
        rollValues,
        matchColorMap,
        activeIds: nextActiveIds,
        eliminatedIds: [...prev.eliminatedIds, ...matchedIds],
        round: prev.round + 1,
        message: matchedIds.length
          ? (matchedIds.length + " players matched and will fade out next round.")
          : "No matches this round. Everyone remaining survives to the next roll.",
      }));
      return;
    }

    if (screen === "dailyLastStraw") {
      if (!dailyLastStrawState) return;
      if (dailyLastStrawState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyLastStrawState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const activeIds = dailyLastStrawState.activeIds.filter((id) => (dailyLastStrawState.lives[id] ?? 0) > 0);
      if (activeIds.length <= 1) {
        setDailyLastStrawState((prev) => ({
          ...prev,
          finished: true,
          winnerId: activeIds[0] || null,
          message: (livingPlayers.find((p) => p.id === (activeIds[0] || null))?.name || "A player") + " wins Last Straw.",
        }));
        return;
      }

      if (dailyLastStrawState.stage === "result") {
        const nextLives = { ...dailyLastStrawState.lives };
        dailyLastStrawState.lowestIds.forEach((id) => {
          nextLives[id] = Math.max(0, (nextLives[id] ?? 0) - 1);
        });
        const nextActiveIds = activeIds.filter((id) => (nextLives[id] ?? 0) > 0);
        if (nextActiveIds.length <= 1) {
          setDailyLastStrawState((prev) => ({
            ...prev,
            lives: nextLives,
            activeIds: nextActiveIds,
            finished: true,
            winnerId: nextActiveIds[0] || null,
            message: (livingPlayers.find((p) => p.id === (nextActiveIds[0] || null))?.name || "A player") + " wins Last Straw.",
          }));
          return;
        }
        setDailyLastStrawState((prev) => ({
          ...prev,
          lives: nextLives,
          activeIds: nextActiveIds,
          rollValues: {},
          lowestIds: [],
          stage: "rolling",
          round: prev.round + 1,
          message: "Next round. Roll D8.",
        }));
        return;
      }

      // rolling complete check
      const allRolled = activeIds.every((id) => typeof dailyLastStrawState.rollValues[id] === "number");
      if (!allRolled) return;

      const values = activeIds.map((id) => dailyLastStrawState.rollValues[id]);
      const min = Math.min(...values);
      const lowestIds = activeIds.filter((id) => dailyLastStrawState.rollValues[id] === min);

      // if everyone tied for lowest, reroll
      if (lowestIds.length === activeIds.length) {
        setDailyLastStrawState((prev) => ({
          ...prev,
          rollValues: {},
          lowestIds: [],
          message: "Everyone tied for lowest. Reroll.",
        }));
        return;
      }

      setDailyLastStrawState((prev) => ({
        ...prev,
        lowestIds,
        stage: "result",
        message: lowestIds.length + " player(s) lose a life.",
      }));
      return;
    }

    if (screen === "dailyMajorityLoses") {
      if (!dailyMajorityLosesState) return;
      if (dailyMajorityLosesState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyMajorityLosesState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const activeIds = [...(dailyMajorityLosesState.activeIds || [])];
      if (activeIds.length <= 1) {
        setDailyMajorityLosesState((prev) => ({
          ...prev,
          finished: true,
          winnerId: activeIds[0] || null,
          message: (livingPlayers.find((p) => p.id === (activeIds[0] || null))?.name || "A player") + " wins Majority Loses.",
        }));
        return;
      }

      if (activeIds.length === 2) {
        let rollA = Math.floor(Math.random() * 20) + 1;
        let rollB = Math.floor(Math.random() * 20) + 1;
        while (rollA === rollB) {
          rollA = Math.floor(Math.random() * 20) + 1;
          rollB = Math.floor(Math.random() * 20) + 1;
        }
        const winnerId = rollA > rollB ? activeIds[0] : activeIds[1];
        const loserId = winnerId === activeIds[0] ? activeIds[1] : activeIds[0];
        setDailyMajorityLosesState((prev) => ({
          ...prev,
          rollValues: { [activeIds[0]]: rollA, [activeIds[1]]: rollB },
          majorityIds: [loserId],
          activeIds: [winnerId],
          eliminatedIds: [...prev.eliminatedIds, loserId],
          finished: true,
          winnerId,
          message: (livingPlayers.find((p) => p.id === winnerId)?.name || "A player") + " wins the final D20 roll.",
        }));
        return;
      }

      const rollValues = {};
      activeIds.forEach((id) => {
        rollValues[id] = Math.floor(Math.random() * 5) + 1;
      });
      const groups = {};
      Object.entries(rollValues).forEach(([id, value]) => {
        if (!groups[value]) groups[value] = [];
        groups[value].push(id);
      });
      const counts = Object.values(groups).map((ids) => ids.length);
      const highestCount = Math.max(...counts);

      if (highestCount < 2) {
        setDailyMajorityLosesState((prev) => ({
          ...prev,
          rollValues,
          majorityIds: [],
          message: "No majority this round. Rerolling everyone still in.",
        }));
        return;
      }

      const majorityGroups = Object.values(groups).filter((ids) => ids.length === highestCount);
      const majorityIds = majorityGroups.flat();
      const nextActiveIds = activeIds.filter((id) => !majorityIds.includes(id));

      if (nextActiveIds.length === 0) {
        setDailyMajorityLosesState((prev) => ({
          ...prev,
          rollValues,
          majorityIds,
          message: "Everyone would be eliminated. Rerolling the same players.",
        }));
        return;
      }

      if (nextActiveIds.length === 1) {
        setDailyMajorityLosesState((prev) => ({
          ...prev,
          rollValues,
          majorityIds,
          activeIds: nextActiveIds,
          eliminatedIds: [...prev.eliminatedIds, ...majorityIds],
          finished: true,
          winnerId: nextActiveIds[0] || null,
          message: (livingPlayers.find((p) => p.id === nextActiveIds[0])?.name || "A player") + " survives the final majority and wins.",
        }));
        return;
      }

      setDailyMajorityLosesState((prev) => ({
        ...prev,
        rollValues,
        majorityIds,
        activeIds: nextActiveIds,
        eliminatedIds: [...prev.eliminatedIds, ...majorityIds],
        round: prev.round + 1,
        message: majorityIds.length + " players were in the majority and are eliminated.",
      }));
      return;
    }

    if (screen === "dailyCountDown") {
      if (!dailyCountDownState) return;
      if (dailyCountDownState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyCountDownState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const allRolled = (dailyCountDownState.activeIds || []).every((id) => typeof dailyCountDownState.roundRolls?.[id] === "number");
      if (!allRolled) return;

      const activeIds = [...(dailyCountDownState.activeIds || [])];
      const winners = activeIds.filter((id) => (dailyCountDownState.totals?.[id] ?? 0) === 0);
      const busted = activeIds.filter((id) => (dailyCountDownState.totals?.[id] ?? 0) < 0);
      const survivors = activeIds.filter((id) => (dailyCountDownState.totals?.[id] ?? 0) > 0);

      if (dailyCountDownState.mode === "main") {
        if (winners.length === 1) {
          setDailyCountDownState((prev) => ({
            ...prev,
            activeIds: [winners[0]],
            finished: true,
            winnerId: winners[0],
            message: (livingPlayers.find((p) => p.id === winners[0])?.name || "A player") + " hit exactly 0 and wins Count Down.",
          }));
          return;
        }
        if (winners.length > 1) {
          setDailyCountDownState((prev) => ({
            ...prev,
            activeIds: winners,
            eliminatedIds: [...prev.eliminatedIds, ...activeIds.filter((id) => !winners.includes(id))],
            mode: "tiebreak",
            targetStart: 10,
            totals: Object.fromEntries(winners.map((id) => [id, 10])),
            roundRolls: {},
            round: prev.round + 1,
            message: winners.length + " players hit 0 together. Tiebreak starts at 10.",
          }));
          return;
        }
        if (!survivors.length) {
          const resetIds = [...activeIds];
          setDailyCountDownState((prev) => ({
            ...prev,
            activeIds: resetIds,
            totals: Object.fromEntries(resetIds.map((id) => [id, 21])),
            roundRolls: Object.fromEntries(resetIds.map((id) => [id, undefined])),
            round: prev.round + 1,
            message: "Everyone went below 0. Restarting the round at 21 for everyone still in.",
          }));
          return;
        }
        setDailyCountDownState((prev) => ({
          ...prev,
          activeIds: survivors,
          eliminatedIds: [...prev.eliminatedIds, ...busted],
          roundRolls: {},
          round: prev.round + 1,
          message: busted.length ? (busted.length + " players went below 0 and were eliminated.") : "Nobody busted. Keep counting down.",
        }));
        return;
      }

      if (dailyCountDownState.mode === "tiebreak") {
        if (winners.length === 1) {
          setDailyCountDownState((prev) => ({
            ...prev,
            activeIds: [winners[0]],
            finished: true,
            winnerId: winners[0],
            message: (livingPlayers.find((p) => p.id === winners[0])?.name || "A player") + " wins the Count Down tiebreak.",
          }));
          return;
        }
        const resetIds = activeIds.map((id) => ((dailyCountDownState.totals?.[id] ?? 0) < 0 ? id : null)).filter(Boolean);
        const nextTotals = { ...dailyCountDownState.totals };
        resetIds.forEach((id) => {
          nextTotals[id] = 10;
        });
        setDailyCountDownState((prev) => ({
          ...prev,
          totals: nextTotals,
          roundRolls: {},
          round: prev.round + 1,
          message: resetIds.length ? "Anyone who went below 0 resets to 10. Keep going until exactly one hits 0." : "Keep going until exactly one hits 0.",
        }));
        return;
      }
      return;
    }

    if (screen === "dailySnipe") {
      if (!dailySnipeState) return;
      if (dailySnipeState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailySnipeState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }
      return;
    }

    if (screen === "dailyOnlyUp") {
      if (!dailyOnlyUpState) return;
      if (dailyOnlyUpState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyOnlyUpState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      if (dailyOnlyUpState.stage === "result") {
        const survivors = (dailyOnlyUpState.activeIds || []).filter((id) => !dailyOnlyUpState.justEliminatedIds.includes(id));
        if (survivors.length <= 1) {
          setDailyOnlyUpState((prev) => ({
            ...prev,
            activeIds: survivors,
            justEliminatedIds: [],
            finished: true,
            winnerId: survivors[0] || null,
            message: (livingPlayers.find((p) => p.id === (survivors[0] || null))?.name || "A player") + " wins Only Up.",
          }));
          return;
        }
        setDailyOnlyUpState((prev) => ({
          ...prev,
          activeIds: survivors,
          justEliminatedIds: [],
          stage: "rolling",
          round: prev.round + 1,
          message: "Advance to raise the odds and see who gets eliminated.",
        }));
        return;
      }

      const activeIds = [...(dailyOnlyUpState.activeIds || [])];
      const nextOdds = { ...(dailyOnlyUpState.odds || {}) };
      activeIds.forEach((id) => {
        nextOdds[id] = (nextOdds[id] || 0) + 1;
      });

      const hitIds = activeIds.filter((id) => {
        const pct = Math.max(0, Math.min(100, nextOdds[id] || 0));
        return Math.random() * 100 < pct;
      });

      if (hitIds.length === activeIds.length) {
        setDailyOnlyUpState((prev) => ({
          ...prev,
          odds: nextOdds,
          justEliminatedIds: [],
          message: "Everyone would be eliminated. Replay that turn with the same players.",
        }));
        return;
      }

      if (hitIds.length === 0) {
        if (activeIds.length <= 1) {
          setDailyOnlyUpState((prev) => ({
            ...prev,
            odds: nextOdds,
            finished: true,
            winnerId: activeIds[0] || null,
            message: (livingPlayers.find((p) => p.id === (activeIds[0] || null))?.name || "A player") + " wins Only Up.",
          }));
          return;
        }
        setDailyOnlyUpState((prev) => ({
          ...prev,
          odds: nextOdds,
          message: "Nobody was eliminated this turn.",
        }));
        return;
      }

      const survivors = activeIds.filter((id) => !hitIds.includes(id));
      setDailyOnlyUpState((prev) => ({
        ...prev,
        odds: nextOdds,
        eliminatedIds: [...prev.eliminatedIds, ...hitIds],
        justEliminatedIds: hitIds,
        stage: "result",
        message: hitIds.length + " player(s) were eliminated.",
      }));
      return;
    }

    if (screen === "dailyHide") {
      if (!dailyHideState) return;
      if (dailyHideState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyHideState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const activeIds = dailyHideState.turnOrder.filter((id) => !dailyHideState.eliminatedIds.includes(id));
      if (activeIds.length <= 1) {
        setDailyHideState((prev) => ({
          ...prev,
          finished: true,
          winnerId: activeIds[0] || null,
          message: (livingPlayers.find((p) => p.id === (activeIds[0] || null))?.name || "A player") + " wins Hide.",
        }));
        return;
      }

      if (dailyHideState.stage === "removeFound") {
        const pendingRemovalIds = dailyHideState.pendingRemovalIds || [];
        const cleanedTurnOrder = dailyHideState.turnOrder.filter((id) => !pendingRemovalIds.includes(id));
        const nextActiveIds = cleanedTurnOrder.filter((id) => !dailyHideState.eliminatedIds.includes(id));
        if (nextActiveIds.length <= 1) {
          setDailyHideState((prev) => ({
            ...prev,
            turnOrder: cleanedTurnOrder,
            pendingRemovalIds: [],
            finished: true,
            winnerId: nextActiveIds[0] || null,
            message: (livingPlayers.find((p) => p.id === (nextActiveIds[0] || null))?.name || "A player") + " wins Hide.",
          }));
          return;
        }
        const currentActiveIndex = nextActiveIds.indexOf(dailyHideState.currentPickerId);
        const nextTurnIndex = currentActiveIndex >= 0 ? (currentActiveIndex + 1) % nextActiveIds.length : 0;
        setDailyHideState((prev) => ({
          ...prev,
          turnOrder: cleanedTurnOrder,
          pendingRemovalIds: [],
          turnIndex: nextTurnIndex,
          currentPickerId: null,
          currentPickNumber: null,
          stage: "intro",
          round: prev.round + 1,
        }));
        return;
      }

      if (dailyHideState.stage === "intro") {
        const nextPickerId = activeIds[dailyHideState.turnIndex % activeIds.length];
        setDailyHideState((prev) => ({
          ...prev,
          currentPickerId: nextPickerId,
          currentPickNumber: null,
          stage: "pick",
          message: "Advance to have the highlighted player pick a number.",
        }));
        return;
      }

      if (dailyHideState.stage === "pick") {
        const pickerId = dailyHideState.currentPickerId;
        const ownNumber = Number(Object.keys(dailyHideState.hidingMap).find((n) => dailyHideState.hidingMap[n] === pickerId));
        const availableNumbers = Array.from({ length: 49 }, (_, i) => i + 1).filter((n) => !dailyHideState.revealedMap[n] && n !== ownNumber);
        const pickNumber = randomFrom(availableNumbers);
        setDailyHideState((prev) => ({
          ...prev,
          currentPickNumber: pickNumber,
          stage: "reveal",
          message: "Selected number " + pickNumber,
        }));
        return;
      }

      if (dailyHideState.stage === "reveal") {
        const pickNumber = dailyHideState.currentPickNumber;
        const foundId = dailyHideState.hidingMap[pickNumber] || null;
        const nextEliminatedIds = foundId ? [...dailyHideState.eliminatedIds, foundId] : [...dailyHideState.eliminatedIds];
        const nextActiveIds = dailyHideState.turnOrder.filter((id) => !nextEliminatedIds.includes(id));
        if (nextActiveIds.length <= 1) {
          setDailyHideState((prev) => ({
            ...prev,
            eliminatedIds: nextEliminatedIds,
            pendingRemovalIds: foundId ? [foundId] : [],
            revealedMap: { ...prev.revealedMap, [pickNumber]: foundId || "X" },
            finished: true,
            winnerId: nextActiveIds[0] || null,
            message: foundId
              ? ((livingPlayers.find((p) => p.id === foundId)?.name || "A player") + " was found. " + (livingPlayers.find((p) => p.id === (nextActiveIds[0] || null))?.name || "A player") + " wins Hide.")
              : ((livingPlayers.find((p) => p.id === (nextActiveIds[0] || null))?.name || "A player") + " wins Hide."),
          }));
          return;
        }
        const currentActiveIndex = nextActiveIds.indexOf(dailyHideState.currentPickerId);
        const nextTurnIndex = currentActiveIndex >= 0 ? (currentActiveIndex + 1) % nextActiveIds.length : 0;
        setDailyHideState((prev) => ({
          ...prev,
          eliminatedIds: nextEliminatedIds,
          pendingRemovalIds: foundId ? [foundId] : [],
          revealedMap: { ...prev.revealedMap, [pickNumber]: foundId || "X" },
          stage: foundId ? "removeFound" : "intro",
          round: foundId ? prev.round : prev.round + 1,
          turnIndex: foundId ? prev.turnIndex : nextTurnIndex,
          currentPickerId: foundId ? prev.currentPickerId : null,
          currentPickNumber: foundId ? prev.currentPickNumber : null,
          message: foundId
            ? ((livingPlayers.find((p) => p.id === foundId)?.name || "A player") + " was found and eliminated.")
            : "Nobody was hiding there.",
        }));
        return;
      }
      return;
    }

    if (screen === "dailyCallOut") {
      if (!dailyCallOutState) return;
      if (dailyCallOutState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyCallOutState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      if (dailyCallOutState.stage === "intro") {
        const pair = shuffle(dailyCallOutState.activeIds).slice(0, 2);
        setDailyCallOutState((prev) => ({
          ...prev,
          currentPair: pair,
          lastRolls: {},
          chooserId: null,
          stage: "pair",
          message: "Two players were selected. Advance for the roll-off.",
        }));
        return;
      }

      if (dailyCallOutState.stage === "pair") {
        const [aId, bId] = dailyCallOutState.currentPair;
        if (!aId || !bId) return;
        let rollA = Math.floor(Math.random() * 100) + 1;
        let rollB = Math.floor(Math.random() * 100) + 1;
        while (rollA === rollB) {
          rollA = Math.floor(Math.random() * 100) + 1;
          rollB = Math.floor(Math.random() * 100) + 1;
        }
        const winnerId = rollA > rollB ? aId : bId;
        const loserId = winnerId === aId ? bId : aId;
        setDailyCallOutState((prev) => ({
          ...prev,
          lastRolls: { [aId]: rollA, [bId]: rollB },
          activeIds: prev.activeIds.filter((id) => id !== loserId),
          eliminatedIds: [...prev.eliminatedIds, loserId],
          chooserId: winnerId,
          stage: "result",
          message: (livingPlayers.find((p) => p.id === winnerId)?.name || "A player") + " wins and calls out the next matchup.",
        }));
        return;
      }

      if (dailyCallOutState.stage === "result") {
        if (dailyCallOutState.activeIds.length <= 1) {
          setDailyCallOutState((prev) => ({
            ...prev,
            finished: true,
            winnerId: prev.activeIds[0] || prev.chooserId || null,
            message: (livingPlayers.find((p) => p.id === (prev.activeIds[0] || prev.chooserId))?.name || "A player") + " wins the Call Out daily.",
          }));
          return;
        }
        const pool = dailyCallOutState.activeIds.filter((id) => id !== dailyCallOutState.chooserId);
        const pair = (pool.length >= 2 ? shuffle(pool).slice(0, 2) : shuffle(dailyCallOutState.activeIds).slice(0, 2));
        setDailyCallOutState((prev) => ({
          ...prev,
          currentPair: pair,
          lastRolls: {},
          round: prev.round + 1,
          stage: "pair",
          message: (livingPlayers.find((p) => p.id === prev.chooserId)?.name || "Winner") + " called out the next two players.",
        }));
        return;
      }
      return;
    }

    if (screen === "dailyDontBeLast") {
      if (!dailyDontBeLastState) return;
      if (dailyDontBeLastState.finished) {
        const winner = livingPlayers.find((p) => p.id === dailyDontBeLastState.winnerId);
        if (!winner) return;
        setChallengeWinnerId(winner.id);
        setSafetyOrder([winner.id]);
        setRevealedSafeCount(1);
        setScreen("winnerPicked");
        return;
      }

      const allRolled = dailyDontBeLastState.activeIds.every((id) => typeof dailyDontBeLastState.roundRolls[id] === "number");
      if (!allRolled) return;

      const scored = dailyDontBeLastState.activeIds.map((id) => ({ id, score: dailyDontBeLastState.roundRolls[id] ?? 0 }));
      const low = Math.min(...scored.map((x) => x.score));
      const lastPlaceIds = scored.filter((x) => x.score === low).map((x) => x.id);
      const eliminatedId = randomFrom(lastPlaceIds);
      const nextActive = dailyDontBeLastState.activeIds.filter((id) => id !== eliminatedId);

      if (nextActive.length <= 1) {
        setDailyDontBeLastState((prev) => ({
          ...prev,
          activeIds: nextActive,
          eliminatedIds: [...prev.eliminatedIds, eliminatedId],
          lastEliminatedId: eliminatedId,
          finished: true,
          winnerId: nextActive[0] || null,
          message: (livingPlayers.find((p) => p.id === (nextActive[0] || null))?.name || "A player") + " wins Don't Be Last.",
        }));
        return;
      }

      setDailyDontBeLastState((prev) => ({
        ...prev,
        activeIds: nextActive,
        eliminatedIds: [...prev.eliminatedIds, eliminatedId],
        lastEliminatedId: eliminatedId,
        round: prev.round + 1,
        roundRolls: {},
        message: (livingPlayers.find((p) => p.id === eliminatedId)?.name || "A player") + " was last and eliminated. Click rolls for the next round.",
      }));
      return;
    }

    if (screen === "challenge") {
      const winner = randomFrom(livingPlayers);
      setChallengeWinnerId(winner.id);
      setSafetyOrder([winner.id]);
      setRevealedSafeCount(1);
      setScreen("winnerPicked");
      return;
    }

    if (screen === "winnerPicked") {
      if (!challengeWinner) return;
      setSafetyOrder(buildSafetyOrder(challengeWinner));
      setRevealedSafeCount(1);
      setScreen("safetyChain");
      return;
    }

    if (screen === "safetyChain") {
      if (revealedSafeCount < safetyOrder.length) {
        setRevealedSafeCount((n) => n + 1);
        return;
      }
      const safeSet = new Set(safetyOrder);
      const leftForDuel = livingPlayers.find((p) => !safeSet.has(p.id));
      const eligibleCalls = livingPlayers.filter((p) => p.id !== leftForDuel.id && p.id !== challengeWinnerId);
      const calledOut = randomFrom(eligibleCalls);
      setDuelAId(leftForDuel.id);
      setDuelBId(calledOut.id);
      setCalloutRevealDone(false);
      setScreen("callout");
      return;
    }

    if (screen === "callout") {
      if (!calloutRevealDone) {
        setCalloutRevealDone(true);
      } else {
        revealCallout();
      }
      return;
    }

    if (screen === "duelSelection") {
      if (!currentDuel) return;
      startSelectedDuel(currentDuel, false);
      return;
    }

    if (screen === "doubleDuelCallout1") {
      if (!doubleDuelState?.firstTargetId) {
        revealDoubleDuelCallout(1);
        return;
      }
      setScreen("doubleDuelCallout2");
      return;
    }

    if (screen === "doubleDuelCallout2") {
      if (!doubleDuelState?.secondTargetId) {
        revealDoubleDuelCallout(2);
        return;
      }
      setDuelAId(doubleDuelState.firstCallerId);
      setDuelBId(doubleDuelState.firstTargetId);
      setCurrentDuel(null);
      setShuffledDuelOptions(shuffle(doubleDuelSelectableDuels));
      setDoubleDuelState((prev) => prev ? { ...prev, stage: "selection1" } : prev);
      setScreen("doubleDuelSelection1");
      return;
    }

    if (screen === "doubleDuelSelection1" && currentDuel) {
      startSelectedDuel(currentDuel, false);
      return;
    }

    if (screen === "doubleDuelSelection2" && currentDuel) {
      startSelectedDuel(currentDuel, false);
      return;
    }

    if (screen === "coinFlipDuel") {
      if (!coinFlipState) return;
      if (coinFlipState.stage === "intro") {
        setCoinFlipState((prev) => ({ ...prev, stage: "calls" }));
        return;
      }
      if (coinFlipState.stage === "calls") {
        setCoinFlipState((prev) => ({ ...prev, stage: "result" }));
        setScreen("duelResult");
        return;
      }
    }

    if (screen === "rpsDuel") {
      if (!rpsState) return;
      if (rpsState.stage === "intro") {
        setRpsState((prev) => ({ ...prev, stage: "throws" }));
        return;
      }
      if (rpsState.stage === "throws") {
        setScreen("duelResult");
        return;
      }
    }

    if (screen === "tugDuel") {
      if (!tugState) return;
      const pullA = Math.floor(Math.random() * 6) + 1;
      const pullB = Math.floor(Math.random() * 6) + 1;
      const diff = pullA - pullB;
      let newPos = tugState.position - diff;
      if (newPos < 0) newPos = 0;
      if (newPos > 10) newPos = 10;

      const updated = { position: newPos, lastPullA: pullA, lastPullB: pullB };
      setTugState(updated);

      if (newPos === 0 || newPos === 10) {
        const winner = newPos === 0 ? duelA : duelB;
        const loser = newPos === 0 ? duelB : duelA;
        setDuelResult({ duelName: "Tug Of War", winner, loser, text: "Final pull!" });
        setScreen("duelResult");
      }
      return;
    }

    if (screen === "popularityDuel") {
      if (!popularityState) return;
      const allRegularRevealed = popularityState.revealedVoterIds.length === popularityState.voters.length;
      const tiebreakNeeded = !!popularityState.tiebreakVote;
      const allDone = allRegularRevealed && (!tiebreakNeeded || popularityState.tiebreakRevealed);
      if (allDone) {
        const winner = popularityState.finalWinnerId === duelA?.id ? duelA : duelB;
        const loser = popularityState.finalWinnerId === duelA?.id ? duelB : duelA;
        setDuelResult({
          duelName: "Popularity",
          winner,
          loser,
          text: winner?.name + " survived the vote.",
        });
        setScreen("duelResult");
      }
      return;
    }

    if (screen === "highRollerDuel") {
      if (highRollerState?.finished) {
        const winner = highRollerState.totalA > highRollerState.totalB ? duelA : duelB;
        const loser = winner?.id === duelA?.id ? duelB : duelA;
        setDuelResult({
          duelName: "High Roller",
          winner,
          loser,
          text: winner?.name + " won with a higher total.",
        });
        setScreen("duelResult");
      }
      return;
    }

    if (screen === "keepItUpDuel") {
      if (!keepItUpState) return;
      if (keepItUpState.finished) {
        const winner = keepItUpState.droppedA ? duelB : duelA;
        const loser = keepItUpState.droppedA ? duelA : duelB;
        setDuelResult({
          duelName: "Keep It Up",
          winner,
          loser,
          text: loser?.name + " dropped the contraption.",
        });
        setScreen("duelResult");
        return;
      }

      const processPlayer = (stamina) => {
        let nextStamina = stamina;
        let regained = false;
        let slipped = false;
        let dropped = false;

        if (Math.floor(Math.random() * 15) === 0 && nextStamina < 10) {
          nextStamina += 1;
          regained = true;
        }

        const dropChance = Math.max(0, 10 - nextStamina);
        if (Math.floor(Math.random() * 10) < dropChance) {
          dropped = true;
        }

        if (Math.floor(Math.random() * 3) === 0 && nextStamina > 0) {
          nextStamina -= 1;
          slipped = true;
        }

        return { stamina: nextStamina, regained, slipped, dropped };
      };

      const a = processPlayer(keepItUpState.staminaA);
      const b = processPlayer(keepItUpState.staminaB);
      let droppedA = a.dropped;
      let droppedB = b.dropped;

      if (droppedA && droppedB) {
        if (a.stamina < b.stamina) {
          droppedB = false;
        } else if (b.stamina < a.stamina) {
          droppedA = false;
        } else if (Math.random() < 0.5) {
          droppedB = false;
        } else {
          droppedA = false;
        }
      }

      setKeepItUpState({
        staminaA: a.stamina,
        staminaB: b.stamina,
        droppedA,
        droppedB,
        regainedA: a.regained,
        regainedB: b.regained,
        slippedA: a.slipped,
        slippedB: b.slipped,
        round: keepItUpState.round + 1,
        finished: droppedA || droppedB,
      });
      return;
    }

    if (screen === "towerDuel") {
      if (!towerState) return;
      if (towerState.finished) {
        const loser = towerState.loserId === duelA?.id ? duelA : duelB;
        const winner = towerState.loserId === duelA?.id ? duelB : duelA;
        setDuelResult({
          duelName: "The Tower",
          winner,
          loser,
          text: loser?.name + " lost after their death rope was cut.",
        });
        setScreen("duelResult");
        return;
      }

      if (towerState.stage === "intro") {
        setTowerState((prev) => ({ ...prev, stage: "winnerReveal" }));
        return;
      }

      if (towerState.stage === "winnerReveal") {
        const currentWinnerId = Math.random() < 0.5 ? duelA?.id : duelB?.id;
        const currentTargetId = currentWinnerId === duelA?.id ? duelB?.id : duelA?.id;
        setTowerState((prev) => ({ ...prev, currentWinnerId, currentTargetId, stage: "cutReveal" }));
        return;
      }

      if (towerState.stage === "cutReveal") {
        const targetCuts = towerState.currentTargetId === duelA?.id ? towerState.cutA : towerState.cutB;
        const remainingColors = towerState.colors.filter((c) => !targetCuts.includes(c));
        const currentCutColor = randomFrom(remainingColors);
        setTowerState((prev) => ({
          ...prev,
          currentCutColor,
          stage: "cutChosen",
        }));
        return;
      }

      if (towerState.stage === "cutChosen") {
        const nextCutA = towerState.currentTargetId === duelA?.id ? [...towerState.cutA, towerState.currentCutColor] : towerState.cutA;
        const nextCutB = towerState.currentTargetId === duelB?.id ? [...towerState.cutB, towerState.currentCutColor] : towerState.cutB;
        const deathColor = towerState.currentTargetId === duelA?.id ? towerState.deathA : towerState.deathB;
        const finished = towerState.currentCutColor === deathColor;
        const loserId = finished ? towerState.currentTargetId : null;
        setTowerState((prev) => ({
          ...prev,
          cutA: nextCutA,
          cutB: nextCutB,
          finished,
          loserId,
          stage: finished ? "finished" : "roundEnd",
        }));
        return;
      }

      if (towerState.stage === "roundEnd") {
        setTowerState((prev) => ({
          ...prev,
          currentWinnerId: null,
          currentTargetId: null,
          currentCutColor: null,
          stage: "winnerReveal",
          round: prev.round + 1,
        }));
        return;
      }
    }

    if (screen === "lifePointsDuel") {
      if (!lifePointsState) return;
      if (lifePointsState.finished) {
        const loser = lifePointsState.loserId === duelA?.id ? duelA : duelB;
        const winner = lifePointsState.loserId === duelA?.id ? duelB : duelA;
        setDuelResult({
          duelName: "Life Points",
          winner,
          loser,
          text: loser?.name + " hit 0 life first.",
        });
        setScreen("duelResult");
        return;
      }

      const rollA = Math.floor(Math.random() * 501);
      const rollB = Math.floor(Math.random() * 501);
      const nextHealthA = lifePointsState.healthA - rollA;
      const nextHealthB = lifePointsState.healthB - rollB;
      let loserId = null;
      let finished = false;

      if (nextHealthA <= 0 || nextHealthB <= 0) {
        finished = true;
        if (nextHealthA <= 0 && nextHealthB <= 0) {
          if (nextHealthA < nextHealthB) loserId = duelA?.id;
          else if (nextHealthB < nextHealthA) loserId = duelB?.id;
          else loserId = Math.random() < 0.5 ? duelA?.id : duelB?.id;
        } else if (nextHealthA <= 0) {
          loserId = duelA?.id;
        } else {
          loserId = duelB?.id;
        }
      }

      setLifePointsState((prev) => ({
        ...prev,
        healthA: nextHealthA,
        healthB: nextHealthB,
        lastRollA: rollA,
        lastRollB: rollB,
        history: [...prev.history, { round: prev.round, rollA, rollB, healthA: nextHealthA, healthB: nextHealthB }],
        round: prev.round + 1,
        finished,
        loserId,
      }));
      return;
    }

    if (screen === "poisonCupDuel") {
      if (!poisonCupState) return;

      if (poisonCupState.finished) {
        const loser = poisonCupState.loserId === duelA?.id ? duelA : duelB;
        const winner = poisonCupState.loserId === duelA?.id ? duelB : duelA;
        setDuelResult({
          duelName: "Poison Cup",
          winner,
          loser,
          text: loser?.name + " drank the poison.",
        });
        setScreen("duelResult");
        return;
      }

      const getActiveChoices = (cups) => cups.map((cup, idx) => (cup.active && !cup.safeGone && !cup.revealed && !cup.selected ? idx : null)).filter((v) => v !== null);

      if (poisonCupState.stage === "pick") {
        const choicesA = getActiveChoices(poisonCupState.cupsA);
        const choicesB = getActiveChoices(poisonCupState.cupsB);
        if (!choicesA.length || !choicesB.length) return;
        const pickA = randomFrom(choicesA);
        const pickB = randomFrom(choicesB);
        const cupsA = poisonCupState.cupsA.map((cup, idx) => ({ ...cup, selected: idx === pickA }));
        const cupsB = poisonCupState.cupsB.map((cup, idx) => ({ ...cup, selected: idx === pickB }));
        setPoisonCupState((prev) => ({ ...prev, cupsA, cupsB, pickA, pickB, stage: "reveal" }));
        return;
      }

      if (poisonCupState.stage === "reveal") {
        const cupsA = poisonCupState.cupsA.map((cup) => ({ ...cup }));
        const cupsB = poisonCupState.cupsB.map((cup) => ({ ...cup }));
        const a = cupsA[poisonCupState.pickA];
        const b = cupsB[poisonCupState.pickB];
        a.selected = false;
        b.selected = false;
        a.revealed = true;
        b.revealed = true;

        const bothPoison = a.poison && b.poison;
        const aPoison = a.poison;
        const bPoison = b.poison;

        if (bothPoison) {
          const remainingA = cupsA.filter((cup) => cup.active && !cup.safeGone).length;
          const nextCount = remainingA <= 1 ? 5 : remainingA;
          const makeCups = (count) => {
            const poisonIndex = Math.floor(Math.random() * count);
            return Array.from({ length: 16 }, (_, i) => ({
              id: i,
              label: i < count ? String(i + 1) : "",
              active: i < count,
              selected: false,
              revealed: false,
              safeGone: false,
              poison: i === poisonIndex,
            }));
          };
          setPoisonCupState((prev) => ({
            ...prev,
            cupsA: makeCups(nextCount),
            cupsB: makeCups(nextCount),
            pickA: null,
            pickB: null,
            stage: "pick",
            finished: false,
            loserId: null,
          }));
          return;
        }

        if (aPoison || bPoison) {
          setPoisonCupState((prev) => ({ ...prev, cupsA, cupsB, finished: true, loserId: aPoison ? duelA?.id : duelB?.id }));
          return;
        }

        a.safeGone = true;
        b.safeGone = true;
        a.revealed = false;
        b.revealed = false;
        setPoisonCupState((prev) => ({
          ...prev,
          cupsA,
          cupsB,
          pickA: null,
          pickB: null,
          stage: "pick",
        }));
        return;
      }
    }

    if (screen === "pokerDuel") {
      if (!pokerState) return;
      if (pokerState.stage === "intro") {
        const progress = getPokerProgressStats(pokerState.holeA, pokerState.holeB, []);
        setPokerState((prev) => ({ ...prev, stage: "hole", revealCount: 0, ...progress }));
        return;
      }
      if (pokerState.stage === "hole") {
        const revealedBoard = pokerState.board.slice(0, 3);
        const progress = getPokerProgressStats(pokerState.holeA, pokerState.holeB, revealedBoard);
        setPokerState((prev) => ({ ...prev, stage: "flop", revealCount: 3, ...progress }));
        return;
      }
      if (pokerState.stage === "flop") {
        const revealedBoard = pokerState.board.slice(0, 4);
        const progress = getPokerProgressStats(pokerState.holeA, pokerState.holeB, revealedBoard);
        setPokerState((prev) => ({ ...prev, stage: "turn", revealCount: 4, ...progress }));
        return;
      }
      if (pokerState.stage === "turn") {
        const revealedBoard = pokerState.board.slice(0, 5);
        const progress = getPokerProgressStats(pokerState.holeA, pokerState.holeB, revealedBoard);
        setPokerState((prev) => ({ ...prev, stage: "river", revealCount: 5, ...progress }));
        return;
      }
      if (pokerState.stage === "river") {
        const revealedBoard = pokerState.board.slice(0, 5);
        const progress = getPokerProgressStats(pokerState.holeA, pokerState.holeB, revealedBoard);
        setPokerState((prev) => ({ ...prev, stage: "showdown", ...progress }));
        return;
      }
      if (pokerState.stage === "showdown") {
        setScreen("duelResult");
        return;
      }
    }

    if (screen === "fourDTicTacToeDuel") {
      if (!fourDTicTacToeState) return;
      if (fourDTicTacToeState.finished) {
        const winner = fourDTicTacToeState.winnerId === duelA?.id ? duelA : duelB;
        const loser = fourDTicTacToeState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "4D Tic Tac Toe",
          winner,
          loser,
          text: winner?.name + " wins the main board.",
        });
        setScreen("duelResult");
        return;
      }

      const availableMoves = getAvailableFourDMoves(fourDTicTacToeState);
      if (!availableMoves.length) {
        const mainWinner = resolveMainBoardWinner(fourDTicTacToeState.mainBoard);
        if (mainWinner) {
          const winner = mainWinner === "A" ? duelA : duelB;
          const loser = mainWinner === "A" ? duelB : duelA;
          setFourDTicTacToeState((prev) => ({ ...prev, finished: true, winnerId: winner?.id || null, loserId: loser?.id || null }));
        }
        return;
      }

      const move = chooseBestFourDMove(fourDTicTacToeState) || randomFrom(availableMoves);
      const nextBoards = fourDTicTacToeState.boards.map((board) => [...board]);
      nextBoards[move.boardIndex][move.cellIndex] = fourDTicTacToeState.currentPlayer;
      const nextMainBoard = [...fourDTicTacToeState.mainBoard];
      const miniWinner = resolveMiniBoardWinner(nextBoards[move.boardIndex]);
      if (miniWinner && !nextMainBoard[move.boardIndex]) nextMainBoard[move.boardIndex] = miniWinner;
      const mainWinner = resolveMainBoardWinner(nextMainBoard);
      const nextPlayer = fourDTicTacToeState.currentPlayer === "A" ? "B" : "A";
      const winner = mainWinner === "A" ? duelA : mainWinner === "B" ? duelB : null;
      const loser = mainWinner === "A" ? duelB : mainWinner === "B" ? duelA : null;

      setFourDTicTacToeState((prev) => ({
        ...prev,
        boards: nextBoards,
        mainBoard: nextMainBoard,
        currentPlayer: nextPlayer,
        forcedBoard: move.cellIndex,
        moveNumber: prev.moveNumber + 1,
        lastMove: {
          player: prev.currentPlayer,
          boardIndex: move.boardIndex,
          cellIndex: move.cellIndex,
          claimedBoard: miniWinner && !prev.mainBoard[move.boardIndex] ? move.boardIndex : null,
        },
        finished: !!mainWinner,
        winnerId: winner?.id || null,
        loserId: loser?.id || null,
      }));
      return;
    }

    if (screen === "fillTheBoardDuel") {
      if (!fillTheBoardState) return;
      if (fillTheBoardState.finished) {
        const winner = fillTheBoardState.winnerId === duelA?.id ? duelA : duelB;
        const loser = fillTheBoardState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Fill The Board",
          winner,
          loser,
          text: winner?.name + " filled the entire board first.",
        });
        setScreen("duelResult");
        return;
      }

      if (!fillTheBoardState.animating) {
        const pendingA = Array.from({ length: 3 }, () => Math.floor(Math.random() * 20) + 1);
        const pendingB = Array.from({ length: 3 }, () => Math.floor(Math.random() * 20) + 1);
        setFillTheBoardState((prev) => ({
          ...prev,
          animating: true,
          pendingA,
          pendingB,
          rollsA: pendingA,
          rollsB: pendingB,
          duplicateFlashA: [],
          duplicateFlashB: [],
        }));
        setTimeout(() => {
          setFillTheBoardState((prev) => {
            if (!prev) return prev;

            const seenA = new Set(prev.filledA);
            const seenB = new Set(prev.filledB);
            const duplicateFlashA = [];
            const duplicateFlashB = [];
            const newA = [];
            const newB = [];

            prev.pendingA.forEach((n) => {
              if (seenA.has(n)) duplicateFlashA.push(n);
              else {
                seenA.add(n);
                newA.push(n);
              }
            });
            prev.pendingB.forEach((n) => {
              if (seenB.has(n)) duplicateFlashB.push(n);
              else {
                seenB.add(n);
                newB.push(n);
              }
            });

            const filledA = [...prev.filledA, ...newA].sort((a, b) => a - b);
            const filledB = [...prev.filledB, ...newB].sort((a, b) => a - b);
            const doneA = filledA.length === 20;
            const doneB = filledB.length === 20;
            let winnerId = null;
            let loserId = null;
            let finished = false;
            if (doneA || doneB) {
              finished = true;
              if (doneA && doneB) {
                winnerId = Math.random() < 0.5 ? duelA?.id : duelB?.id;
                loserId = winnerId === duelA?.id ? duelB?.id : duelA?.id;
              } else if (doneA) {
                winnerId = duelA?.id;
                loserId = duelB?.id;
              } else {
                winnerId = duelB?.id;
                loserId = duelA?.id;
              }
            }
            return {
              ...prev,
              filledA,
              filledB,
              animating: false,
              pendingA: [],
              pendingB: [],
              duplicateFlashA,
              duplicateFlashB,
              finished,
              winnerId,
              loserId,
            };
          });

          setTimeout(() => {
            setFillTheBoardState((prev) => prev ? { ...prev, duplicateFlashA: [], duplicateFlashB: [] } : prev);
          }, 500);
        }, 1000);
        return;
      }
      return;
    }

    if (screen === "safeCrackerDuel") {
      if (!safeCrackerState) return;
      if (safeCrackerState.finished) {
        const winner = safeCrackerState.winnerId === duelA?.id ? duelA : duelB;
        const loser = safeCrackerState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Safe Cracker",
          winner,
          loser,
          text: winner?.name + " cracked the safe first.",
        });
        setScreen("duelResult");
        return;
      }

      const nextGuess = (code, locked) => code.map((digit, i) => {
        if (locked[i] !== null) return locked[i];
        return Math.floor(Math.random() * 10);
      });

      const guessA = nextGuess(safeCrackerState.codeA, safeCrackerState.lockedA);
      const guessB = nextGuess(safeCrackerState.codeB, safeCrackerState.lockedB);
      const lockedA = safeCrackerState.lockedA.map((digit, i) => digit !== null ? digit : (guessA[i] === safeCrackerState.codeA[i] ? guessA[i] : null));
      const lockedB = safeCrackerState.lockedB.map((digit, i) => digit !== null ? digit : (guessB[i] === safeCrackerState.codeB[i] ? guessB[i] : null));
      const doneA = lockedA.every((v) => v !== null);
      const doneB = lockedB.every((v) => v !== null);
      let finished = false;
      let winnerId = null;
      let loserId = null;
      if (doneA || doneB) {
        finished = true;
        if (doneA && doneB) {
          winnerId = Math.random() < 0.5 ? duelA?.id : duelB?.id;
          loserId = winnerId === duelA?.id ? duelB?.id : duelA?.id;
        } else if (doneA) {
          winnerId = duelA?.id;
          loserId = duelB?.id;
        } else {
          winnerId = duelB?.id;
          loserId = duelA?.id;
        }
      }

      setSafeCrackerState((prev) => ({
        ...prev,
        guessA,
        guessB,
        lockedA,
        lockedB,
        historyA: [...prev.historyA, guessA],
        historyB: [...prev.historyB, guessB],
        finished,
        winnerId,
        loserId,
      }));
      return;
    }

    if (screen === "standoffDuel") {
      if (!standoffState) {
        setStandoffState({
          livesA: 3,
          livesB: 3,
          bulletsA: 1,
          bulletsB: 1,
          actionA: null,
          actionB: null,
          history: [],
          round: 1,
          finished: false,
          winnerId: null,
          loserId: null,
          isFinalSeries,
        });
        return;
      }
      if (standoffState.finished) {
        const winner = standoffState.winnerId === duelA?.id ? duelA : duelB;
        const loser = standoffState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Standoff",
          winner,
          loser,
          text: winner?.name + " won the standoff.",
        });
        setScreen("duelResult");
        return;
      }

      const chooseAction = (bullets) => {
        const options = bullets > 0 ? ["shoot", "reload", "shield"] : ["reload", "shield"];
        return options[Math.floor(Math.random() * options.length)];
      };

      const actionA = chooseAction(standoffState.bulletsA);
      const actionB = chooseAction(standoffState.bulletsB);
      let bulletsA = standoffState.bulletsA;
      let bulletsB = standoffState.bulletsB;
      let livesA = standoffState.livesA;
      let livesB = standoffState.livesB;

      if (actionA === "reload") bulletsA = Math.min(3, bulletsA + 1);
      if (actionB === "reload") bulletsB = Math.min(3, bulletsB + 1);

      if (actionA === "shoot" && standoffState.bulletsA > 0) {
        bulletsA -= 1;
        if (actionB !== "shield") livesB -= 1;
      }
      if (actionB === "shoot" && standoffState.bulletsB > 0) {
        bulletsB -= 1;
        if (actionA !== "shield") livesA -= 1;
      }

      let finished = false;
      let winnerId = null;
      let loserId = null;
      if (livesA <= 0 || livesB <= 0) {
        finished = true;
        if (livesA <= 0 && livesB <= 0) {
          winnerId = Math.random() < 0.5 ? duelA?.id : duelB?.id;
          loserId = winnerId === duelA?.id ? duelB?.id : duelA?.id;
        } else if (livesA <= 0) {
          winnerId = duelB?.id;
          loserId = duelA?.id;
        } else {
          winnerId = duelA?.id;
          loserId = duelB?.id;
        }
      }

      setStandoffState((prev) => ({
        ...prev,
        livesA,
        livesB,
        bulletsA,
        bulletsB,
        actionA,
        actionB,
        round: prev.round + 1,
        history: [...prev.history, { round: prev.round, actionA, actionB, livesA, livesB, bulletsA, bulletsB }],
        finished,
        winnerId,
        loserId,
      }));
      return;
    }

    if (screen === "wordScrambleDuel") {
      if (!wordScrambleState) return;
      if (wordScrambleState.finished) {
        const winner = wordScrambleState.winnerId === duelA?.id ? duelA : duelB;
        const loser = wordScrambleState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Word Scramble",
          winner,
          loser,
          text: `${winner?.name || "Winner"} made the longer word.`
        });
        setScreen("duelResult");
        return;
      }

      if (wordScrambleState.stage === "collect") {
        let nextBoard = (wordScrambleState.board || []).map((row) => [...row]);
        let nextCollectedA = [...(wordScrambleState.collectedA || [])];
        let nextCollectedB = [...(wordScrambleState.collectedB || [])];

        if (Math.random() < 0.8) {
          const pickA = pullRandomLetterFromBoard(nextBoard);
          if (pickA) {
            nextCollectedA.push(pickA.letter);
            nextBoard[pickA.rowIndex][pickA.colIndex] = null;
          }
        }

        if (Math.random() < 0.8) {
          const pickB = pullRandomLetterFromBoard(nextBoard);
          if (pickB) {
            nextCollectedB.push(pickB.letter);
            nextBoard[pickB.rowIndex][pickB.colIndex] = null;
          }
        }

        const nextAdvances = wordScrambleState.advances + 1;
        if (nextAdvances >= 15) {
          const bestA = getBestWordFromLetters(nextCollectedA);
          const bestB = getBestWordFromLetters(nextCollectedB);
          let winnerId = null;
          let loserId = null;
          let finished = false;
          if (bestA.word.length !== bestB.word.length) {
            winnerId = bestA.word.length > bestB.word.length ? duelA?.id : duelB?.id;
            loserId = winnerId === duelA?.id ? duelB?.id : duelA?.id;
            finished = true;
          }
          setWordScrambleState((prev) => ({
            ...prev,
            board: nextBoard,
            collectedA: nextCollectedA,
            collectedB: nextCollectedB,
            advances: nextAdvances,
            stage: "reveal",
            wordA: bestA.word,
            wordB: bestB.word,
            unusedA: bestA.unused,
            unusedB: bestB.unused,
            winnerId,
            loserId,
            finished,
          }));
          return;
        }
        setWordScrambleState((prev) => ({
          ...prev,
          board: nextBoard,
          collectedA: nextCollectedA,
          collectedB: nextCollectedB,
          advances: nextAdvances,
        }));
        return;
      }

      if (wordScrambleState.stage === "reveal") {
        if (wordScrambleState.finished) {
          const winner = wordScrambleState.winnerId === duelA?.id ? duelA : duelB;
          const loser = wordScrambleState.loserId === duelA?.id ? duelA : duelB;
          setDuelResult({
            duelName: "Word Scramble",
            winner,
            loser,
            text: `${winner?.name || "Winner"} made the longer word.`
          });
          setScreen("duelResult");
          return;
        }
        setWordScrambleState((prev) => ({
          ...prev,
          board: buildWordScrambleBoard(),
          collectedA: [],
          collectedB: [],
          advances: 0,
          round: prev.round + 1,
          stage: "collect",
          wordA: "",
          wordB: "",
          unusedA: [],
          unusedB: [],
        }));
        return;
      }
      return;
    }

    if (screen === "knightMovesDuel") {
      if (!knightMovesState) return;
      if (knightMovesState.finished) {
        const winner = knightMovesState.winnerId === duelA?.id ? duelA : duelB;
        const loser = knightMovesState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Knight Moves",
          winner,
          loser,
          text: `${loser?.name || "A player"} had no legal knight move left.`
        });
        setScreen("duelResult");
        return;
      }

      const isA = knightMovesState.currentPlayer === "A";
      const currentPos = isA ? knightMovesState.posA : knightMovesState.posB;
      const otherPos = isA ? knightMovesState.posB : knightMovesState.posA;
      const legalMoves = getKnightLegalMoves(currentPos, knightMovesState.burned, otherPos);

      if (!legalMoves.length) {
        setKnightMovesState((prev) => ({
          ...prev,
          legalMoves: [],
          finished: true,
          winnerId: isA ? duelB?.id : duelA?.id,
          loserId: isA ? duelA?.id : duelB?.id,
        }));
        return;
      }

      const chosen = chooseKnightMove(legalMoves);
      const nextBurned = [...knightMovesState.burned, toKnightKey(currentPos[0], currentPos[1])];
      const nextPosA = isA ? chosen : knightMovesState.posA;
      const nextPosB = isA ? knightMovesState.posB : chosen;
      const nextPlayer = isA ? "B" : "A";
      const nextCurrentPos = nextPlayer === "A" ? nextPosA : nextPosB;
      const nextOtherPos = nextPlayer === "A" ? nextPosB : nextPosA;
      const nextLegal = getKnightLegalMoves(nextCurrentPos, nextBurned, nextOtherPos);

      setKnightMovesState((prev) => ({
        ...prev,
        posA: nextPosA,
        posB: nextPosB,
        burned: nextBurned,
        currentPlayer: nextPlayer,
        moveNumber: prev.moveNumber + 1,
        legalMoves: nextLegal,
        lastMove: {
          player: prev.currentPlayer,
          from: currentPos,
          to: chosen,
        },
      }));
      return;
    }

    if (screen === "marathonRollDuel") {
      if (!marathonRollDuelState) return;
      if (marathonRollDuelState.finished) {
        const winner = marathonRollDuelState.winnerId === duelA?.id ? duelA : duelB;
        const loser = marathonRollDuelState.loserId === duelA?.id ? duelA : duelB;
        setDuelResult({
          duelName: "Marathon Roll",
          winner,
          loser,
          text: `${winner?.name || "A player"} pulled more than 100 ahead.`
        });
        setScreen("duelResult");
        return;
      }

      const rollA = Math.floor(Math.random() * 100) + 1;
      const rollB = Math.floor(Math.random() * 100) + 1;
      const totalA = (marathonRollDuelState.totalA || 0) + rollA;
      const totalB = (marathonRollDuelState.totalB || 0) + rollB;
      let finished = false;
      let winnerId = null;
      let loserId = null;
      if (Math.abs(totalA - totalB) > 100) {
        finished = true;
        winnerId = totalA > totalB ? duelA?.id : duelB?.id;
        loserId = winnerId === duelA?.id ? duelB?.id : duelA?.id;
      }

      setMarathonRollDuelState((prev) => ({
        ...prev,
        totalA,
        totalB,
        rollsA: [...prev.rollsA, rollA],
        rollsB: [...prev.rollsB, rollB],
        lastRollA: rollA,
        lastRollB: rollB,
        round: prev.round + 1,
        finished,
        winnerId,
        loserId,
      }));
      return;
    }

    if (screen === "duelResult") {
      if (doubleDuelState?.stage === "resolving1" && duelResult) {
        const firstLoser = duelResult.loser;
        const survivorsAfterFirst = livingPlayers.filter((p) => p.id !== firstLoser.id);
        setEliminated((prev) => [...prev, firstLoser]);
        setPlayers(survivorsAfterFirst);
        setChallengeWinnerId(challengeWinnerId);
        setDuelAId(doubleDuelState.secondCallerId);
        setDuelBId(doubleDuelState.secondTargetId);
        setCurrentDuel(null);
        setDuelResult(null);
        setCoinFlipState(null);
        setRpsState(null);
        setTugState(null);
        setPopularityState(null);
        setHighRollerState(null);
        setKeepItUpState(null);
        setTowerState(null);
        setLifePointsState(null);
        setPokerState(null);
        setPoisonCupState(null);
        setFourDTicTacToeState(null);
        setFillTheBoardState(null);
        setShuffledDuelOptions(shuffle(doubleDuelSelectableDuels));
        setDoubleDuelState((prev) => prev ? { ...prev, stage: "selection2" } : prev);
        setScreen("doubleDuelSelection2");
        return;
      }

      if (doubleDuelState?.stage === "resolving2" && duelResult) {
        const secondLoser = duelResult.loser;
        const survivors = livingPlayers.filter((p) => p.id !== secondLoser.id);
        setEliminated((prev) => [...prev, secondLoser]);
        setDoubleDuelState(null);
        goToNextRoundOrEnd(survivors);
        return;
      }

      const finalSeriesActive =
        coinFlipState?.isFinalSeries ||
        rpsState?.isFinalSeries ||
        tugState?.isFinalSeries ||
        popularityState?.isFinalSeries ||
        highRollerState?.isFinalSeries ||
        keepItUpState?.isFinalSeries ||
        towerState?.isFinalSeries ||
        lifePointsState?.isFinalSeries ||
        pokerState?.isFinalSeries;

      if (finalSeriesActive && duelResult && currentDuel) {
        completeFinalSeriesDuel(duelResult, currentDuel.id);
      } else {
        finalizeDuel();
      }
      return;
    }

    if (screen === "finalSeries") {
      if (currentDuel) {
        playFinalSeriesRound();
      }
    }
  };

  const revealCallout = () => {
    setShuffledDuelOptions(shuffle(regularSelectableDuels));
    setCurrentDuel(null);
    setScreen("duelSelection");
  };

  const chooseManualCallout = (playerId) => {
    if (!playerId) return;
    setDuelBId(playerId);
    setCalloutRevealDone(true);
  };

  const revealDuel = (duel) => {
    setCurrentDuel(duel);
    if (screen === "doubleDuelSelection1") {
      setDoubleDuelState((prev) => prev ? { ...prev, firstDuel: duel, stage: "resolving1" } : prev);
    }
    if (screen === "doubleDuelSelection2") {
      setDoubleDuelState((prev) => prev ? { ...prev, secondDuel: duel, stage: "resolving2" } : prev);
    }
  };

  const revealDoubleDuelCallout = (which) => {
    if (!doubleDuelState) return;
    const callerId = which === 1 ? doubleDuelState.firstCallerId : doubleDuelState.secondCallerId;
    const excludeIds = [
      callerId,
      challengeWinnerId,
      which === 1 ? doubleDuelState.secondCallerId : doubleDuelState.firstCallerId,
      ...(which === 2 && doubleDuelState.firstTargetId ? [doubleDuelState.firstTargetId] : []),
    ].filter(Boolean);
    const eligible = livingPlayers.filter((p) => !excludeIds.includes(p.id));
    const target = randomFrom(eligible);
    if (!target) return;
    if (which === 1) {
      setDoubleDuelState((prev) => prev ? { ...prev, firstTargetId: target.id, stage: "callout2" } : prev);
      setScreen("doubleDuelCallout2");
    } else {
      setDoubleDuelState((prev) => prev ? { ...prev, secondTargetId: target.id, stage: "callout2-revealed" } : prev);
    }
  };

  const chooseManualDoubleDuelCallout = (which, playerId) => {
    if (!doubleDuelState || !playerId) return;
    if (which === 1) {
      setDoubleDuelState((prev) => prev ? { ...prev, firstTargetId: playerId, stage: "callout2" } : prev);
      setScreen("doubleDuelCallout2");
      return;
    }
    setDoubleDuelState((prev) => prev ? { ...prev, secondTargetId: playerId, stage: "callout2-revealed" } : prev);
  };

  const revealFinalSeriesDuel = (duel) => {
    setCurrentDuel(duel);
  };

  const toggleDuel = (id) => {
    setEnabledDuels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDaily = (id) => {
    setEnabledDailies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllDuels = () => {
    setEnabledDuels(Object.fromEntries(duels.map((duel) => [duel.id, true])));
  };

  const selectNoDuels = () => {
    setEnabledDuels(Object.fromEntries(duels.map((duel) => [duel.id, false])));
  };

  const selectAllCastMembers = () => {
    setSelectedCastNames(new Set(setupPlayers.map((player) => player.name)));
  };

  const selectNoCastMembers = () => {
    setSelectedCastNames(new Set());
  };

  const toggleCastMember = (name) => {
    setSelectedCastNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size === 1) return prev;
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };


  async function saveSeason() {
    if (!champion) {
      alert("Finish the season first.");
      return;
    }

    setSavingSeason(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("You must be logged in.");
      setSavingSeason(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_seasons")
      .insert({
        user_id: userData.user.id,
        simulator_type: "the-duel",
        title: seasonTitle.trim() || "The Duel Season",
        summary:
          seasonSummary.trim() ||
          `${champion.name} won The Duel against ${eliminated.length} eliminated players.`,
        is_public: isPublicSeason,
        allow_comments: true,
        data_json: {
          simulator_type: "the-duel",
          players,
          eliminated,
          champion,
          winnerId,
          roundNumber,
          useDailies,
          enabledDuels,
          enabledDailies,
        },
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

  const addCustomDuel = () => {
    const name = window.prompt("Enter the duel name:");
    if (!name) return;
    const description = window.prompt("Enter a short description:") || "Custom duel";
    const id = "custom-" + Date.now();
    setDuels((prev) => [...prev, { id, name, description }]);
    setEnabledDuels((prev) => ({ ...prev, [id]: true }));
  };

  const borderClass = (variant) => {
    if (variant === "winner") return "ring-4 ring-green-500";
    if (variant === "safe") return "ring-4 ring-sky-400";
    if (variant === "duelist") return "ring-4 ring-red-500";
    if (variant === "challenger") return "ring-4 ring-orange-400";
    if (variant === "eliminated") return "ring-4 ring-zinc-700 grayscale opacity-60";
    if (variant === "champion") return "ring-4 ring-yellow-400";
    return "ring-1 ring-white/10";
  };

  function PlayerCard({ player, label, variant = "default", compact = false, small = false }) {
  return (
    <div className={(small ? "max-w-[220px] mx-auto " : "") + "rounded-2xl bg-zinc-900/90 shadow-xl overflow-hidden " + borderClass(variant)}>
      <div className={"relative " + (compact || small ? "aspect-[4/5]" : "aspect-[3/4]")}>
        <img src={player.image} alt={player.name} className={"h-full w-full object-cover " + (variant === "eliminated" ? "transition-all duration-500 [transition-delay:1500ms] grayscale" : "")} />
        {label ? <div className="absolute left-2 top-2 rounded-full bg-black/75 px-3 py-1 text-xs font-bold tracking-wide text-white">{label}</div> : null}
      </div>
      <div className="p-2">
        <div className="font-bold text-white text-sm text-center">{player.name}</div>
      </div>
    </div>
  );
}

function CoinFace({ playerA, playerB, winner }) {
  if (!playerA || !playerB || !winner) return null;

  const landsOnA = winner.id === playerA.id;
  const animationName = landsOnA ? "coinflipToA" : "coinflipToB";

  return (
    <div className="mx-auto flex items-center justify-center [perspective:1200px]">
      <div className="relative h-40 w-40 [transform-style:preserve-3d]" style={{ animation: `${animationName} 1.2s ease-in-out forwards` }}>
        <div className="absolute inset-0 overflow-hidden rounded-full border-8 border-yellow-300 bg-yellow-500 shadow-2xl [backface-visibility:hidden]">
          <img src={playerA.image} alt={playerA.name} className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-full border-8 border-yellow-300 bg-yellow-500 shadow-2xl [backface-visibility:hidden] [transform:rotateX(180deg)]">
          <img src={playerB.image} alt={playerB.name} className="h-full w-full object-cover" />
        </div>
      </div>
      <style>{`
        @keyframes coinflipToA {
          0% { transform: rotateX(0deg) scaleY(1); }
          20% { transform: rotateX(360deg) scaleY(0.72); }
          40% { transform: rotateX(720deg) scaleY(1); }
          60% { transform: rotateX(1080deg) scaleY(0.72); }
          80% { transform: rotateX(1440deg) scaleY(1); }
          100% { transform: rotateX(1800deg) scaleY(1); }
        }
        @keyframes coinflipToB {
          0% { transform: rotateX(0deg) scaleY(1); }
          20% { transform: rotateX(360deg) scaleY(0.72); }
          40% { transform: rotateX(720deg) scaleY(1); }
          60% { transform: rotateX(1080deg) scaleY(0.72); }
          80% { transform: rotateX(1440deg) scaleY(1); }
          100% { transform: rotateX(1980deg) scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function HiddenCard({ tall = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-white/15 bg-zinc-950/80 shadow-xl transition hover:scale-[1.02]"
    >
      <div className={"flex items-center justify-center " + (tall ? "aspect-[3/4]" : "aspect-[4/5]")}>
        <div className="text-4xl font-black text-zinc-500">?</div>
      </div>
      <div className="p-3 text-xs font-bold tracking-[0.2em] text-zinc-500">HIDDEN</div>
    </button>
  );
}

function FlipCard({ front, back, flipped, onClick, tall = false }) {
  return (
    <div className="w-full [perspective:1000px]">
      <div className={tall ? "relative aspect-[3/4]" : "relative aspect-[4/5]"}>
        <div
          onClick={onClick}
          className={
            "absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] " +
            (flipped ? "[transform:rotateY(180deg)]" : "") +
            (onClick ? " cursor-pointer" : "")
          }
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">{front}</div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
        </div>
      </div>
    </div>
  );
}

function VoteCounterCard({ player, votes, variant }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0">
          <PlayerCard player={player} variant={variant} small />
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Votes</div>
          <div className="mt-2 text-5xl font-black text-white">{votes}</div>
        </div>
      </div>
    </div>
  );
}

function TotalCounterCard({ player, total, variant, rolls }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0">
          <PlayerCard player={player} variant={variant} small />
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Total</div>
          <div className="mt-2 text-5xl font-black text-white">{total}</div>
          <div className="mt-2 text-xs text-zinc-400">Rolls: {rolls.length ? rolls.join(", ") : "—"}</div>
        </div>
      </div>
    </div>
  );
}

function RopeGrid({ colors, cutColors }) {
  const colorMap = {
    Red: "bg-red-500",
    Orange: "bg-orange-500",
    Yellow: "bg-yellow-400",
    Green: "bg-green-500",
    Blue: "bg-blue-500",
    Purple: "bg-purple-500",
  };
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 max-w-[150px] mx-auto">
      {colors.map((color) => {
        const cut = cutColors.includes(color);
        return (
          <div
            key={color}
            className={
              "flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-[9px] font-bold text-white mx-auto " +
              (cut ? "bg-black" : colorMap[color])
            }
          >
            {color}
          </div>
        );
      })}
    </div>
  );
}

function PokerCard({ card }) {
  if (!card) {
    return (
      <div className="flex aspect-[3/4] max-w-[60px] mx-auto items-center justify-center rounded-md border border-white/10 bg-black/40 text-xl font-black text-zinc-500">
        ?
      </div>
    );
  }
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div className="flex aspect-[3/4] max-w-[60px] mx-auto flex-col justify-between rounded-md border border-white/10 bg-white p-0.5 shadow">
      <div className={"text-lg leading-none font-black " + (red ? "text-red-600" : "text-black")}>
        {card.rank}{card.suit}
      </div>
      <div className={"text-center text-6xl leading-none font-black " + (red ? "text-red-600" : "text-black")}>
        {card.suit}
      </div>
      <div className={"text-right text-lg leading-none font-black " + (red ? "text-red-600" : "text-black")}>
        {card.rank}{card.suit}
      </div>
    </div>
  );
}

function HiddenPokerCard() {
  return (
    <div className="flex h-[80px] w-[60px] shrink-0 items-center justify-center rounded-md border border-white/10 bg-zinc-900 shadow">
      <div className="text-3xl font-black text-zinc-500">?</div>
    </div>
  );
}

function DealerShowingCard({ card }) {
  return card ? <PokerCard card={card} /> : <HiddenPokerCard />;
}

function FourDTicTacToeCell({ marker, playerA, playerB, highlight = false, small = false }) {
  return (
    <div className={"relative flex aspect-square items-center justify-center rounded-md border " + (highlight ? "border-green-400 bg-green-500/10" : "border-white/10 bg-black/30")}>
      {marker === "A" ? <img src={playerA?.image} alt={playerA?.name} className={"h-full w-full object-cover rounded-md " + (small ? "p-0.5" : "p-1")} /> : null}
      {marker === "B" ? <img src={playerB?.image} alt={playerB?.name} className={"h-full w-full object-cover rounded-md " + (small ? "p-0.5" : "p-1")} /> : null}
    </div>
  );
}

function FourDBoard({ cells, playerA, playerB, highlight = false, small = false }) {
  return (
    <div className={"grid grid-cols-3 gap-1 rounded-xl p-1 " + (highlight ? "bg-green-500/15 ring-2 ring-green-400" : "bg-black/20")}>
      {cells.map((cell, idx) => (
        <FourDTicTacToeCell key={idx} marker={cell} playerA={playerA} playerB={playerB} highlight={false} small={small} />
      ))}
    </div>
  );
}

function D20Die({ value, rolling = false }) {
  return (
    <div className="flex flex-col items-center">
      <div className={("flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-2xl font-black text-white shadow-lg " + (rolling ? "animate-pulse" : ""))}>
        {value ?? "—"}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">D20</div>
    </div>
  );
}

function FillBoardGrid({ filled, duplicateFlash = [] }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 20 }).map((_, i) => {
        const n = i + 1;
        const on = filled.includes(n);
        const flash = duplicateFlash.includes(n);
        return (
          <div
            key={n}
            className={
              "flex aspect-square items-center justify-center rounded-lg border text-lg font-black transition-all duration-300 " +
              (flash
                ? "border-yellow-300 bg-yellow-400 text-black"
                : on
                  ? "border-green-400 bg-green-500 text-black"
                  : "border-white/10 bg-black/30 text-white")
            }
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}

function SafeCodeRow({ guess, locked }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {guess.map((digit, i) => {
        const isLocked = locked[i] !== null;
        return (
          <div
            key={i}
            className={"flex h-14 items-center justify-center rounded-lg border text-2xl font-black " + (isLocked ? "border-green-400 bg-green-500 text-black" : "border-white/10 bg-black/30 text-white")}
          >
            {digit ?? "—"}
          </div>
        );
      })}
    </div>
  );
}

function HeartRow({ lives }) {
  return <div className="flex justify-center gap-2 text-3xl">{Array.from({ length: 3 }).map((_, i) => <span key={i} className={i < lives ? "" : "opacity-20 grayscale"}>❤️</span>)}</div>;
}

function ActionEmoji({ action }) {
  const map = { shoot: "🔫", reload: "🔄", shield: "🛡️" };
  return <div className="text-5xl">{action ? map[action] : "•"}</div>;
}

function FourCornersSpinner({ color, spinTick, spinning = false }) {
  const sliceOrder = ["blue", "green", "red", "yellow"];
  const colorToCenterAngle = {
    blue: 45,
    green: 135,
    red: 225,
    yellow: 315,
  };
  const pointerAngle = 0;
  const targetCenter = color ? colorToCenterAngle[color] ?? 45 : 45;
  const finalRotation = color ? 1080 + (pointerAngle - targetCenter) : 0;

  return (
    <div className="relative flex flex-col items-center">
      <div className="mb-2 text-3xl leading-none text-white">▼</div>
      <div
        key={spinTick}
        className="relative h-52 w-52 rounded-full overflow-hidden shadow-2xl"
        style={{
          background: `conic-gradient(from 0deg, ${sliceOrder.map((sliceColor, i) => {
            const colorMap = {
              blue: "#3b82f6",
              green: "#22c55e",
              red: "#ef4444",
              yellow: "#eab308",
            };
            return `${colorMap[sliceColor]} ${i * 90}deg ${(i + 1) * 90}deg`;
          }).join(", ")})`,
          transform: `rotate(${spinning ? 0 : finalRotation}deg)`,
          animation: spinning ? `fourCornersSpin 3s ease-out forwards` : "none",
        }}
      >
        <div className="absolute inset-0 rounded-full border-8 border-white/15 pointer-events-none" />
        <div className="absolute inset-[22%] rounded-full border border-white/10 bg-black/80 pointer-events-none" />
      </div>
      <style>{`@keyframes fourCornersSpin { from { transform: rotate(0deg); } to { transform: rotate(${finalRotation}deg); } }`}</style>
    </div>
  );
}

  const castGrid = (list, compact = false, mode = "default") => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
      {list.map((player) => {
        let variant = "default";
        let label = null;
        if (player.id === challengeWinnerId) variant = "winner";
        if (mode === "remaining") variant = player.id === duelAId ? "duelist" : variant;
        return <PlayerCard key={player.id} player={player} label={label} variant={variant} compact={compact} />;
      })}
    </div>
  );

  const revealPopularityVote = (voterId) => {
    if (!popularityState || popularityState.revealedVoterIds.includes(voterId)) return;
    const votedFor = popularityState.votes[voterId];
    setPopularityState((prev) => ({
      ...prev,
      revealedVoterIds: [...prev.revealedVoterIds, voterId],
      countA: prev.countA + (votedFor === duelAId ? 1 : 0),
      countB: prev.countB + (votedFor === duelBId ? 1 : 0),
    }));
  };

  const revealPopularityTiebreak = () => {
    if (!popularityState || !popularityState.tiebreakVote || popularityState.tiebreakRevealed) return;
    setPopularityState((prev) => ({
      ...prev,
      tiebreakRevealed: true,
      countA: prev.countA + (prev.tiebreakVote === duelAId ? 1 : 0),
      countB: prev.countB + (prev.tiebreakVote === duelBId ? 1 : 0),
    }));
  };

  const handleHighRollerRoll = (side) => {
    if (!highRollerState || highRollerState.finished) return;
    const roll = Math.floor(Math.random() * 100) + 1;

    setHighRollerState((prev) => {
      if (!prev || prev.finished) return prev;

      const limit = 5 + (prev.suddenDeathRound || 0);
      let next = { ...prev };

      if (side === "A") {
        if (prev.rollsA.length >= limit) return prev;
        next.rollsA = [...prev.rollsA, roll];
        next.totalA = prev.totalA + roll;
      } else {
        if (prev.rollsB.length >= limit) return prev;
        next.rollsB = [...prev.rollsB, roll];
        next.totalB = prev.totalB + roll;
      }

      const bothFinishedThisStage = next.rollsA.length >= limit && next.rollsB.length >= limit;
      if (bothFinishedThisStage) {
        if (next.totalA !== next.totalB) {
          next.finished = true;
        } else {
          next.suddenDeathRound = (prev.suddenDeathRound || 0) + 1;
          next.finished = false;
        }
      }

      return next;
    });
  };

  const handleDontBeLastRoll = (playerId) => {
    if (!dailyDontBeLastState || dailyDontBeLastState.finished) return;
    if (!dailyDontBeLastState.activeIds.includes(playerId)) return;
    if (typeof dailyDontBeLastState.roundRolls[playerId] === "number") return;
    const roll = Math.floor(Math.random() * 101);
    setDailyDontBeLastState((prev) => ({
      ...prev,
      roundRolls: { ...prev.roundRolls, [playerId]: roll },
      message: "Keep rolling everyone in any order. Lowest revealed score is currently last place.",
    }));
  };

  const handleCountDownRoll = (playerId) => {
    if (!dailyCountDownState || dailyCountDownState.finished) return;
    if (!dailyCountDownState.activeIds.includes(playerId)) return;
    if (typeof dailyCountDownState.roundRolls?.[playerId] === "number") return;
    const roll = Math.floor(Math.random() * 10) + 1;
    setDailyCountDownState((prev) => {
      const nextTotal = (prev.totals?.[playerId] ?? prev.targetStart ?? 21) - roll;
      return {
        ...prev,
        roundRolls: { ...prev.roundRolls, [playerId]: roll },
        totals: { ...prev.totals, [playerId]: nextTotal },
        message: "Keep rolling everyone in any order.",
      };
    });
  };

  const revealSnipeDigit = (index) => {
    if (!dailySnipeState || dailySnipeState.finished) return;
    if (dailySnipeState.revealedDigits?.[index]) return;
    const nextRevealed = [...(dailySnipeState.revealedDigits || [false, false, false, false])];
    nextRevealed[index] = true;
    const fullyRevealed = nextRevealed.every(Boolean);
    if (!fullyRevealed) {
      setDailySnipeState((prev) => ({
        ...prev,
        revealedDigits: nextRevealed,
        message: "Keep revealing the mystery code.",
      }));
      return;
    }

    const mysteryValue = Number((dailySnipeState.mysteryDigits || []).join(""));
    const ranked = livingPlayers
      .map((player) => ({
        id: player.id,
        diff: Math.abs(Number(dailySnipeState.guesses?.[player.id] || 0) - mysteryValue),
        guess: Number(dailySnipeState.guesses?.[player.id] || 0),
      }))
      .sort((a, b) => a.diff - b.diff || a.guess - b.guess);
    const bestDiff = ranked[0]?.diff ?? 0;
    const tied = ranked.filter((entry) => entry.diff === bestDiff);
    const winnerId = tied[0]?.id || null;

    setDailySnipeState((prev) => ({
      ...prev,
      revealedDigits: nextRevealed,
      finished: true,
      winnerId,
      message: (livingPlayers.find((p) => p.id === winnerId)?.name || "A player") + " is closest to the mystery code.",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-900 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">The Duel</h1>
              <p className="mt-2 text-sm text-zinc-300 md:text-base">Advance one screen at a time through the challenge, safety chain, duel callout, duel selection, and elimination.</p>
            </div>
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStarted(false);
                    setScreen("setup");
                    setPlayers([]);
                    setEliminated([]);
                    setWinnerId(null);
                    resetRoundState();
                  }}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                >
                  Main Menu
                </button>

                <button
                  onClick={() => {
                    if (!players.length) return;
                    const samePlayers = [...players, ...eliminated];
                    setPlayers(samePlayers);
                    setEliminated([]);
                    setWinnerId(null);
                    setRoundNumber(1);
                    resetRoundState();
                    setScreen("roundStart");
                  }}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                >
                  Quick Restart
                </button>
              </div>

              <div>
                {started && screen !== "winner" ? (
                  <button
                    onClick={advance}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                  >
                    Advance
                  </button>
                ) : !started ? (
                  <button
                    onClick={startSeason}
                    disabled={enabledDuelList.length === 0 || filteredSetupPlayers.length < 2 || (useDailies && enabledDailyList.length === 0)}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start Season
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {!started ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="mb-3 text-xl font-bold">Daily Challenges

<button
  onClick={() => setEnabledDailies(Object.fromEntries(dailies.map((daily) => [daily.id, false]))) }
  className="mb-3 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-700"
>
  Select None
</button></div>
                <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <input type="checkbox" checked={useDailies} onChange={() => setUseDailies((v) => !v)} className="h-5 w-5" />
                  <div>
                    <div className="font-bold">Use Dailies</div>
                    <div className="text-sm text-zinc-300">If off, the simulation proceeds as normal. If on, a daily challenge is selected before the safety chain.</div>
                  </div>
                </label>
                <div className="space-y-3">
                  {dailies.map((daily) => (
                    <label key={daily.id} className={("flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 ") + (!useDailies ? "opacity-60" : "")}>
                      <input type="checkbox" checked={!!enabledDailies[daily.id]} onChange={() => toggleDaily(daily.id)} className="mt-1 h-5 w-5" disabled={!useDailies} />
                      <div>
                        <div className="font-bold">{daily.name}</div>
                        <div className="text-sm text-zinc-300">{daily.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xl font-bold">Active Duels</div>
                    <div className="text-sm text-zinc-300">Choose which duels can appear in the random duel selection.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={selectAllDuels}
                      className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-black"
                    >
                      Select All
                    </button>
                    <button
                      onClick={selectNoDuels}
                      className="rounded-2xl bg-zinc-700 px-3 py-2 text-sm font-bold text-white"
                    >
                      Select None
                    </button>
                    
                  </div>
                </div>
                <div className="space-y-3">
                  {duels.map((duel) => (
                    <label
                      key={duel.id}
                      className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <input
                        type="checkbox"
                        checked={!!enabledDuels[duel.id]}
                        onChange={() => toggleDuel(duel.id)}
                        className="mt-1 h-5 w-5"
                      />
                      <div>
                        <div className="font-bold">{duel.name}</div>
                        <div className="text-sm text-zinc-300">{duel.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-bold">Cast Selection</div>
                  <div className="text-sm text-zinc-300">Use your shared official and custom casts.</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openAddCastModal}
                    className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-black"
                  >
                    Add Cast Members
                  </button>

                  <button
                    onClick={selectAllCastMembers}
                    className="rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-bold text-black"
                  >
                    Select All
                  </button>

                  <button
                    onClick={selectNoCastMembers}
                    className="rounded-2xl bg-zinc-700 px-3 py-2 text-sm font-bold text-white"
                  >
                    Select None
                  </button>

                  <button
                    onClick={clearRoster}
                    className="rounded-2xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Clear Roster
                  </button>

                  <Link
                    href="/custom-casts"
                    className="rounded-2xl bg-zinc-800 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-700"
                  >
                    Manage Casts
                  </Link>
                </div>
              </div>
              <div className="mb-4 text-sm text-zinc-300">{filteredSetupPlayers.length} players selected</div>
              {setupPlayers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-zinc-300">
                  No cast members added yet. Click Add Cast Members to build your Duel roster.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                  {setupPlayers.map((player) => {
                    const selected = selectedCastNames.has(player.name);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleCastMember(player.name)}
                        className={"rounded-2xl text-left transition " + (selected ? "hover:scale-[1.02]" : "opacity-50 grayscale hover:opacity-80")}
                      >
                        <PlayerCard player={player} compact variant={selected ? "default" : "eliminated"} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {started && screen !== "winner" ? (
          <div className="grid gap-6">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">Round {roundNumber}</div>
                    <div className="text-2xl font-black">{screen === "finalSeries" ? "Final Duel Series" : "Main Arena"}</div>
                  </div>
                  <div className="rounded-2xl bg-black/40 px-4 py-2 text-sm text-zinc-200">{livingPlayers.length} remaining • {eliminated.length} eliminated</div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
                {screen === "roundStart" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">
                      {livingPlayers.length === 2 ? "Final Duel Series" : `Round ${roundNumber} Start`}
                    </div>
                    <div className="mb-4 text-zinc-300">
                      {livingPlayers.length === 2
                        ? "Two players remain. Advance to begin the final duel series."
                        : "Advance to begin this round."}
                    </div>
                    {castGrid(livingPlayers)}
                  </div>
                ) : null}

                {screen === "dailySelection" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily Challenge</div>
                    <div className="mb-4 text-zinc-300">This round's daily challenge has been selected.</div>
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-center">
                      <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">Selected Daily</div>
                      <div className="mt-3 text-3xl font-black">{currentDailyChoice?.name || "Daily Challenge"}</div>
                      <div className="mt-2 text-zinc-300">{currentDailyChoice?.description || "Advance to begin the daily challenge."}</div>
                    </div>
                    <div className="mt-5">{castGrid(livingPlayers)}</div>
                  </div>
                ) : null}

                {screen === "dailyHighRoller" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — High Roller</div>
                    <div className="mb-5 text-zinc-300">Everyone rolls one D100 per advance. After 5 rolls each, highest total wins the daily and becomes safe.</div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                      {[...livingPlayers].sort((a, b) => ((dailyHighRollerState?.totals?.[b.id] || 0) - (dailyHighRollerState?.totals?.[a.id] || 0))).map((player) => {
                        const total = dailyHighRollerState?.totals?.[player.id] || 0;
                        const rolls = dailyHighRollerState?.rolls?.[player.id] || [];
                        const winner = dailyHighRollerState?.winnerId === player.id;
                        return (
                          <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                            <PlayerCard player={player} variant={winner ? "winner" : "default"} small />
                            <div className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Total</div>
                            <div className="mt-1 text-center text-4xl font-black text-white">{total}</div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 px-2 py-2 text-center text-sm font-bold text-white">
                                  {rolls[i] ?? "—"}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      {dailyHighRollerState?.finished
                        ? ((dailyWinner?.name || "A player") + " wins the daily. Hit Advance to lock them in as safe.")
                        : ("Roll " + (dailyHighRollerState?.currentRoll || 1) + " of 5")}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyMarathonRoll" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Marathon Roll</div>
                    <div className="mb-5 text-zinc-300">Everyone rolls one D100 per advance. After every roll, anyone more than 100 behind first place is eliminated. Last one standing wins the daily.</div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                      {[...livingPlayers].sort((a, b) => ((dailyMarathonRollState?.totals?.[b.id] || 0) - (dailyMarathonRollState?.totals?.[a.id] || 0))).map((player) => {
                        const total = dailyMarathonRollState?.totals?.[player.id] || 0;
                        const rolls = dailyMarathonRollState?.rolls?.[player.id] || [];
                        const winner = dailyMarathonRollState?.winnerId === player.id;
                        const eliminatedPlayer = dailyMarathonRollState?.eliminatedIds?.includes(player.id);
                        const active = dailyMarathonRollState?.activeIds?.includes(player.id);
                        return (
                          <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                            <div className="scale-75 origin-top"><PlayerCard player={player} variant={winner ? "winner" : eliminatedPlayer ? "eliminated" : active ? "default" : "default"} small /></div>
                            <div className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Total</div>
                            <div className="mt-1 text-center text-4xl font-black text-white">{total}</div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {rolls.map((roll, i) => <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 px-2 py-2 text-center text-sm font-bold text-white">{roll}</div>)}
                            </div>
                            <div className="mt-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">{winner ? "Winner" : eliminatedPlayer ? "Eliminated" : "Active"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      {dailyMarathonRollState?.finished
                        ? ((dailyWinner?.name || "A player") + " wins the daily. Hit Advance to lock them in as safe.")
                        : ("Roll " + (dailyMarathonRollState?.currentRoll || 1) + " • " + (dailyMarathonRollState?.activeIds?.length || 0) + " still active")}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyBlackjack" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Black Jack</div>
                    <div className="mb-5 text-zinc-300">Free-for-all blackjack. Everyone still in the round acts at the same time. Players tied for the best non-bust total advance.</div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {[...livingPlayers]
                        .filter((player) => dailyBlackjackState?.activeIds?.includes(player.id) || dailyBlackjackState?.eliminatedIds?.includes(player.id))
                        .sort((a, b) => {
                          const activeDiff = (dailyBlackjackState?.activeIds?.includes(b.id) ? 1 : 0) - (dailyBlackjackState?.activeIds?.includes(a.id) ? 1 : 0);
                          if (activeDiff !== 0) return activeDiff;
                          const totalB = dailyBlackjackState?.roundState?.playerHands?.[b.id] ? getBlackjackTotal(dailyBlackjackState.roundState.playerHands[b.id]) : 0;
                          const totalA = dailyBlackjackState?.roundState?.playerHands?.[a.id] ? getBlackjackTotal(dailyBlackjackState.roundState.playerHands[a.id]) : 0;
                          return totalB - totalA;
                        })
                        .map((player) => {
                          const hand = dailyBlackjackState?.roundState?.playerHands?.[player.id] || [];
                          const total = hand.length ? getBlackjackTotal(hand) : 0;
                          const eliminatedPlayer = dailyBlackjackState?.eliminatedIds?.includes(player.id);
                          const active = dailyBlackjackState?.activeIds?.includes(player.id);
                          const standing = !!dailyBlackjackState?.roundState?.standingIds?.includes(player.id);
                          const busted = active && !!dailyBlackjackState?.roundState?.doneMap?.[player.id] && !standing;
                          return (
                            <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4">
                              <PlayerCard player={player} variant={dailyBlackjackState?.winnerId === player.id ? "winner" : eliminatedPlayer ? "eliminated" : active ? "default" : "default"} small />
                              <div className="mt-3 flex flex-wrap justify-center gap-2">{hand.length ? hand.map((card, i) => <PokerCard key={player.id + "-bj-" + i + "-" + (card?.rank || "x") + (card?.suit || "x")} card={card} />) : <HiddenPokerCard />}</div>
                              <div className="mt-3 text-center text-2xl font-black text-white">{hand.length ? total : "—"}</div>
                              <div className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">{dailyBlackjackState?.winnerId === player.id ? "Winner" : eliminatedPlayer ? "Eliminated" : standing ? "Standing" : busted ? "Busted" : active ? "Active" : "Waiting"}</div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {dailyBlackjackState?.round || 1}</div>
                      <div className="mt-2">{dailyBlackjackState?.roundState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyBlackjackState?.activeIds?.length || 0} still active</div>
                      {dailyBlackjackState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyFourCorners" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Four Corners</div>
                    <div className="mb-5 text-zinc-300">Players are randomly sorted into the 4 colored corners. Then the spinner lands on a color and everyone in that corner is eliminated. Repeat until one player remains.</div>
                    <div className="grid gap-4 lg:grid-cols-[1fr_300px_1fr] lg:grid-rows-2">
                      {[
                        { color: "blue", label: "Blue", cls: "border-blue-400 bg-blue-500/10" },
                        { color: "green", label: "Green", cls: "border-green-400 bg-green-500/10" },
                        { color: "yellow", label: "Yellow", cls: "border-yellow-400 bg-yellow-500/10" },
                        { color: "red", label: "Red", cls: "border-red-400 bg-red-500/10" },
                      ].map((corner, index) => {
                        const playersInCorner = (dailyFourCornersState?.activeIds || []).filter((id) => dailyFourCornersState?.cornerMap?.[id] === corner.color).map((id) => livingPlayers.find((p) => p.id === id)).filter(Boolean);
                        const isLosingCorner = dailyFourCornersState?.currentSpinColor === corner.color && (dailyFourCornersState?.phase === "eliminate" || dailyFourCornersState?.phase === "result");
                        const positionClass = index === 0 ? "lg:col-start-1 lg:row-start-1" : index === 1 ? "lg:col-start-3 lg:row-start-1" : index === 2 ? "lg:col-start-1 lg:row-start-2" : "lg:col-start-3 lg:row-start-2";
                        return (
                          <div key={corner.color} className={`${positionClass} rounded-3xl border p-4 ${corner.cls} ${isLosingCorner ? "ring-4 ring-white/70" : ""}`}>
                            <div className="mb-3 text-center text-lg font-black">{corner.label}</div>
                            <div className="grid grid-cols-5 gap-2">
                              {playersInCorner.length ? playersInCorner.map((player) => <PlayerCard key={player.id} player={player} small compact variant={isLosingCorner ? "eliminated" : "default"} />) : <div className="col-span-5 text-center text-sm text-zinc-300">Empty</div>}
                            </div>
                          </div>
                        );
                      })}
                      <div className="rounded-3xl border border-white/10 bg-black/40 p-5 lg:col-start-2 lg:row-span-2 flex flex-col items-center justify-center">
                        <div className="mb-3 text-sm uppercase tracking-[0.2em] text-zinc-400">Spinner</div>
                        <FourCornersSpinner color={dailyFourCornersState?.currentSpinColor} spinTick={fourCornersSpinTick} spinning={dailyFourCornersState?.phase === "spinning"} />
                        <div className="mt-4 text-center text-zinc-300">
                          {dailyFourCornersState?.phase === "sort" ? "Advance to randomize everyone into the 4 corners." : dailyFourCornersState?.phase === "spin" ? "Advance to spin the wheel." : dailyFourCornersState?.phase === "spinning" ? "The wheel is spinning..." : dailyFourCornersState?.phase === "eliminate" ? "The losing corner turns black and white. Hit Advance to remove them." : dailyFourCornersState?.finished ? `${dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.` : "Advance to continue."}
                        </div>
                        <div className="mt-3 text-sm text-zinc-400">Round {dailyFourCornersState?.round || 1} • {dailyFourCornersState?.activeIds?.length || 0} active</div>
                      </div>
                    </div>
                    {dailyFourCornersState?.eliminatedIds?.length ? (
                      <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                        <div className="mb-3 text-lg font-bold">Eliminated In Daily</div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                          {dailyFourCornersState.eliminatedIds.map((id) => {
                            const player = livingPlayers.find((p) => p.id === id) || eliminated.find((p) => p.id === id);
                            return player ? <PlayerCard key={id} player={player} compact small variant="eliminated" /> : null;
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {screen === "dailyPoker" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Poker</div>
                    <div className="mb-5 text-zinc-300">Everyone gets 2 hole cards and shares 5 community cards, just like the poker duel. Best hand advances. If players tie for best hand, only the tied players are re-dealt.</div>
                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 text-center text-lg font-bold">Community Cards</div>
                      <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => { const visible = i < Math.max(0, (dailyPokerState?.revealCount || 0) - 2); return <PokerCard key={"daily-board-" + i} card={visible ? dailyPokerState?.board?.[i] : null} />; })}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                      {[...livingPlayers].filter((player) => dailyPokerState?.activeIds?.includes(player.id) || dailyPokerState?.eliminatedIds?.includes(player.id)).sort((a, b) => {
                        const deadA = !!dailyPokerState?.deadIds?.includes(a.id); const deadB = !!dailyPokerState?.deadIds?.includes(b.id); if (deadA !== deadB) return deadA ? 1 : -1;
                        const activeDiff = (dailyPokerState?.activeIds?.includes(b.id) ? 1 : 0) - (dailyPokerState?.activeIds?.includes(a.id) ? 1 : 0); if (activeDiff !== 0) return activeDiff;
                        const currentEvalA = dailyPokerState?.currentEvaluations?.[a.id]; const currentEvalB = dailyPokerState?.currentEvaluations?.[b.id];
                        if (currentEvalA && currentEvalB) { const cmp = comparePokerScores(currentEvalB.score, currentEvalA.score); if (cmp !== 0) return cmp; }
                        const pctDiff = (dailyPokerState?.winPcts?.[b.id] || 0) - (dailyPokerState?.winPcts?.[a.id] || 0); if (pctDiff !== 0) return pctDiff; return 0;
                      }).map((player) => {
                        const hole = dailyPokerState?.holeCards?.[player.id] || []; const evaluation = dailyPokerState?.evaluations?.[player.id]; const currentHand = dailyPokerState?.currentHands?.[player.id];
                        const eliminatedPlayer = dailyPokerState?.eliminatedIds?.includes(player.id); const active = dailyPokerState?.activeIds?.includes(player.id); const winner = dailyPokerState?.winnerId === player.id; const dead = !!dailyPokerState?.deadIds?.includes(player.id); const winPct = dailyPokerState?.winPcts?.[player.id]; const needs = dailyPokerState?.needCards?.[player.id] || [];
                        return <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2"><div className="mx-auto w-[72px] sm:w-[78px]"><PlayerCard player={player} variant={winner ? "winner" : eliminatedPlayer || dead ? "eliminated" : active ? "default" : "default"} small compact /></div><div className="mt-2 grid grid-cols-2 gap-1"><PokerCard card={(dailyPokerState?.revealCount || 0) >= 2 ? hole[0] : null} /><PokerCard card={(dailyPokerState?.revealCount || 0) >= 2 ? hole[1] : null} /></div><div className="mt-2 text-center text-[11px] font-bold text-white">{evaluation?.name || currentHand || "Waiting for deal"}</div><div className="mt-1 text-center text-[11px] font-black text-emerald-300">{typeof winPct === "number" ? `${winPct}% to win` : ""}</div><div className="mt-1 text-center text-[10px] uppercase tracking-[0.15em] text-zinc-400">{winner ? "Winner" : eliminatedPlayer ? "Eliminated" : dead ? "Dead" : active ? "Still In" : "Waiting"}</div>{dailyPokerState?.revealCount === 6 && active && !eliminatedPlayer ? (
                          needs.length ? (
                            needs[0] === "all other cards" ? (
                              <div className="mt-1 min-h-[24px] px-1 text-center text-xs font-bold text-amber-300">all other cards</div>
                            ) : (
                              <div className="mt-2 flex flex-wrap justify-center gap-1">
                                {needs.map((label, i) => {
                                  const match = String(label).match(/^(10|[2-9JQKA])([♠♥♦♣])$/);
                                  return match ? <PokerCard key={label + i} card={{ rank: match[1], suit: match[2] }} /> : null;
                                })}
                              </div>
                            )
                          ) : null
                        ) : null}</div>;
                      })}
                    </div>
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300"><div>Round {dailyPokerState?.round || 1}</div><div className="mt-2">{dailyPokerState?.message || "Advance to continue."}</div><div className="mt-2 text-sm text-zinc-400">{dailyPokerState?.activeIds?.length || 0} still active</div>{dailyPokerState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}</div>
                  </div>
                ) : null}

                {screen === "dailyTen" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Ten</div>
                    <div className="mb-4 text-zinc-300">Everyone still in rolls 1-10 together each advance. Rolling a 10 locks you in green for the round. The last player without a 10 is eliminated.</div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {dailyTenState?.round || 1}</div>
                      <div className="mt-2">{dailyTenState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyTenState?.activeIds?.length || 0} still active</div>
                      {dailyTenState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    {dailyTenState?.stage === "roundResult" && dailyTenState?.pendingEliminatedId ? (
                      <div className="mb-5 rounded-3xl border border-red-400 bg-red-500/10 p-5 text-center">
                        <div className="mb-3 text-lg font-bold text-red-300">Eliminated</div>
                        {(() => {
                          const player = livingPlayers.find((p) => p.id === dailyTenState.pendingEliminatedId) || eliminated.find((p) => p.id === dailyTenState.pendingEliminatedId);
                          return player ? <div className="mx-auto w-[180px]"><PlayerCard player={player} variant="duelist" small /></div> : null;
                        })()}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-10">
                      {[...livingPlayers]
                        .filter((player) => dailyTenState?.activeIds?.includes(player.id) || dailyTenState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const active = dailyTenState?.activeIds?.includes(player.id);
                          const out = dailyTenState?.eliminatedIds?.includes(player.id);
                          const locked = dailyTenState?.lockedIds?.includes(player.id);
                          const rollValue = dailyTenState?.rollValues?.[player.id];
                          const isPendingOut = dailyTenState?.pendingEliminatedId === player.id && dailyTenState?.stage === "roundResult";
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard player={player} compact small variant={isPendingOut ? "duelist" : out ? "eliminated" : locked ? "winner" : "default"} />
                              <div className={("mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black ") + (isPendingOut ? "border-red-400 bg-red-500 text-white" : out ? "border-zinc-700 bg-zinc-900 text-zinc-500" : locked ? "border-emerald-400 bg-emerald-500 text-black" : "border-white/10 bg-zinc-900 text-white")}>
                                {typeof rollValue === "number" ? rollValue : "-"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyDontMatch" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Don't Match</div>
                    <div className="mb-4 text-zinc-300">Everyone rolls together. Any players who match numbers are eliminated. Final 2 switch to one 1–20 winner roll.</div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {dailyDontMatchState?.round || 1}</div>
                      <div className="mt-2">{dailyDontMatchState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyDontMatchState?.activeIds?.length || 0} still active</div>
                      {dailyDontMatchState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .filter((player) => dailyDontMatchState?.activeIds?.includes(player.id) || dailyDontMatchState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const out = dailyDontMatchState?.eliminatedIds?.includes(player.id);
                          const winner = dailyDontMatchState?.winnerId === player.id;
                          const rollValue = dailyDontMatchState?.rollValues?.[player.id];
                          const matchColor = dailyDontMatchState?.matchColorMap?.[player.id] || "";
                          const freshlyMatched = !!matchColor && out;
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <div className={freshlyMatched ? `rounded-2xl p-1 ${matchColor}` : "rounded-2xl"}>
                                <PlayerCard player={player} compact small variant={winner ? "winner" : freshlyMatched ? "default" : out ? "eliminated" : "default"} />
                              </div>
                              <div className={(
                                "mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black " +
                                (winner
                                  ? "border-emerald-400 bg-emerald-500 text-black"
                                  : freshlyMatched
                                    ? matchColor
                                    : out
                                      ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                                      : "border-white/10 bg-zinc-900 text-white")
                              )}>
                                {typeof rollValue === "number" ? rollValue : "-"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyLastStraw" ? (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-2xl font-black">Daily — Last Straw</div>
                      <button
                        onClick={() => {
                          (dailyLastStrawState?.activeIds || []).forEach((id) => {
                            if (typeof dailyLastStrawState?.rollValues?.[id] !== "number") {
                              const roll = Math.floor(Math.random() * 8) + 1;
                              setDailyLastStrawState((prev) => ({
                                ...prev,
                                rollValues: { ...prev.rollValues, [id]: roll },
                              }));
                            }
                          });
                        }}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black"
                      >
                        Roll All
                      </button>
                    </div>

                    <div className="mb-4 text-zinc-300">Roll D8. Lowest loses a life. 3 lives each.</div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .filter((p) => dailyLastStrawState?.activeIds?.includes(p.id) || (dailyLastStrawState?.lives?.[p.id] ?? 0) > 0)
                        .map((player) => {
                          const lives = dailyLastStrawState?.lives?.[player.id] ?? 0;
                          const roll = dailyLastStrawState?.rollValues?.[player.id];
                          const isLowest = dailyLastStrawState?.lowestIds?.includes(player.id);
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard player={player} compact small variant={lives <= 0 ? "eliminated" : isLowest ? "duelist" : "default"} />
                              <div className={("mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black ") + (isLowest ? "border-red-400 bg-red-500 text-white" : "border-white/10 bg-zinc-900 text-white")}>
                                {typeof roll === "number" ? roll : "-"}
                              </div>
                              <div className="mt-2 flex justify-center gap-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                  <div key={i} className={"h-3 w-3 rounded-full " + (i < lives ? "bg-red-500" : "bg-zinc-700")} />
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  if (typeof roll === "number" || lives <= 0) return;
                                  const r = Math.floor(Math.random() * 8) + 1;
                                  setDailyLastStrawState((prev) => ({
                                    ...prev,
                                    rollValues: { ...prev.rollValues, [player.id]: r },
                                  }));
                                }}
                                disabled={typeof roll === "number" || lives <= 0}
                                className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
                              >
                                Roll
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyMajorityLoses" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Majority Loses</div>
                    <div className="mb-4 text-zinc-300">Everyone rolls 1–5 together. The majority is eliminated. Ties for majority eliminate all tied groups. Final 2 use a D20 high roll.</div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {dailyMajorityLosesState?.round || 1}</div>
                      <div className="mt-2">{dailyMajorityLosesState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyMajorityLosesState?.activeIds?.length || 0} still active</div>
                      {dailyMajorityLosesState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .filter((player) => dailyMajorityLosesState?.activeIds?.includes(player.id) || dailyMajorityLosesState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const out = dailyMajorityLosesState?.eliminatedIds?.includes(player.id);
                          const winner = dailyMajorityLosesState?.winnerId === player.id;
                          const rollValue = dailyMajorityLosesState?.rollValues?.[player.id];
                          const inMajority = dailyMajorityLosesState?.majorityIds?.includes(player.id);
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard player={player} compact small variant={winner ? "winner" : out ? "eliminated" : inMajority ? "duelist" : "default"} />
                              <div className={"mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black " + (winner ? "border-emerald-400 bg-emerald-500 text-black" : inMajority ? "border-red-400 bg-red-500 text-white" : out ? "border-zinc-700 bg-zinc-900 text-zinc-500" : "border-white/10 bg-zinc-900 text-white")}>
                                {typeof rollValue === "number" ? rollValue : "-"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyCountDown" ? (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black">Daily — Count Down</div>
                        <div className="mt-1 text-zinc-300">Start at {dailyCountDownState?.targetStart || 21}. Hit exactly 0 to win. Go below 0 and you're out. Click each D10 individually or roll all.</div>
                      </div>
                      <button
                        onClick={() => {
                          (dailyCountDownState?.activeIds || []).forEach((id) => {
                            if (typeof dailyCountDownState?.roundRolls?.[id] !== "number") handleCountDownRoll(id);
                          });
                        }}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                      >
                        Roll All
                      </button>
                    </div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>{dailyCountDownState?.mode === "tiebreak" ? "Tiebreak" : "Main Game"} • Round {dailyCountDownState?.round || 1}</div>
                      <div className="mt-2">{dailyCountDownState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyCountDownState?.activeIds?.length || 0} still active</div>
                      {dailyCountDownState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .filter((player) => dailyCountDownState?.activeIds?.includes(player.id) || dailyCountDownState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const active = dailyCountDownState?.activeIds?.includes(player.id);
                          const out = dailyCountDownState?.eliminatedIds?.includes(player.id);
                          const winner = dailyCountDownState?.winnerId === player.id;
                          const total = dailyCountDownState?.totals?.[player.id];
                          const rollValue = dailyCountDownState?.roundRolls?.[player.id];
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard player={player} compact small variant={winner ? "winner" : out ? "eliminated" : "default"} />
                              <div className={"mt-2 rounded-xl border px-3 py-2 text-center text-3xl font-black " + (winner ? "border-emerald-400 bg-emerald-500 text-black" : out ? "border-zinc-700 bg-zinc-900 text-zinc-500" : total === 0 ? "border-emerald-400 bg-emerald-500 text-black" : total < 0 ? "border-red-400 bg-red-500 text-white" : "border-white/10 bg-zinc-900 text-white")}>
                                {typeof total === "number" ? total : (dailyCountDownState?.targetStart || 21)}
                              </div>
                              <button
                                onClick={() => handleCountDownRoll(player.id)}
                                disabled={!active || out || typeof rollValue === "number" || dailyCountDownState?.finished}
                                className={"mt-2 w-full rounded-xl px-3 py-3 text-sm font-black transition " + (!active || out || typeof rollValue === "number" || dailyCountDownState?.finished ? "bg-zinc-800/60 text-zinc-500 cursor-not-allowed" : "bg-white text-black hover:scale-[1.02]")}
                              >
                                {typeof rollValue === "number" ? `-${rollValue}` : "Roll D10"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailySnipe" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Snipe!</div>
                    <div className="mb-4 text-zinc-300">Reveal the 4 mystery digits in any order. Whoever guessed the closest 4-digit code wins the daily.</div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 text-center text-lg font-bold">Mystery Code</div>
                      <div className="grid grid-cols-4 gap-3 max-w-[420px] mx-auto">
                        {Array.from({ length: 4 }).map((_, i) => {
                          const revealed = dailySnipeState?.revealedDigits?.[i];
                          return (
                            <button
                              key={i}
                              onClick={() => revealSnipeDigit(i)}
                              disabled={revealed || dailySnipeState?.finished}
                              className={"flex h-24 items-center justify-center rounded-2xl border text-4xl font-black transition " + (revealed ? "border-emerald-400 bg-emerald-500 text-black" : "border-white/10 bg-zinc-900 text-white hover:scale-[1.02]")}
                            >
                              {revealed ? (dailySnipeState?.mysteryDigits?.[i] || "0") : "?"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div className="mt-2">{dailySnipeState?.message || "Reveal the mystery code."}</div>
                      {dailySnipeState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .sort((a, b) => {
                          const aGuess = Number(dailySnipeState?.guesses?.[a.id] || 0);
                          const bGuess = Number(dailySnipeState?.guesses?.[b.id] || 0);
                          return bGuess - aGuess;
                        })
                        .map((player) => {
                          const guess = dailySnipeState?.guesses?.[player.id] || "0000";
                          const winner = dailySnipeState?.winnerId === player.id;
                          const mysteryValue = Number((dailySnipeState?.mysteryDigits || ["0", "0", "0", "0"]).join(""));
                          const diff = Math.abs(Number(guess) - mysteryValue);
                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard player={player} compact small variant={winner ? "winner" : "default"} />
                              <div className={"mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black " + (winner ? "border-emerald-400 bg-emerald-500 text-black" : "border-white/10 bg-zinc-900 text-white")}>
                                {guess}
                              </div>
                              <div className="mt-1 text-center text-[11px] font-bold text-zinc-400">
                                {dailySnipeState?.finished ? (`off by ${diff}`) : "guess"}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyOnlyUp" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Only Up</div>
                    <div className="mb-4 text-zinc-300">Every advance raises each active player's number by 1. That number is their individual percent chance to be eliminated that turn.</div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Turn {dailyOnlyUpState?.round || 1}</div>
                      <div className="mt-2">{dailyOnlyUpState?.message || "Advance to continue."}</div>
                      <div className="mt-2 text-sm text-zinc-400">{dailyOnlyUpState?.activeIds?.length || 0} still active</div>
                      {dailyOnlyUpState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {[...livingPlayers]
                        .filter((player) => dailyOnlyUpState?.activeIds?.includes(player.id) || dailyOnlyUpState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const active = dailyOnlyUpState?.activeIds?.includes(player.id);
                          const out = dailyOnlyUpState?.eliminatedIds?.includes(player.id);
                          const justOut = dailyOnlyUpState?.justEliminatedIds?.includes(player.id);
                          const winner = dailyOnlyUpState?.winnerId === player.id;
                          const odd = dailyOnlyUpState?.odds?.[player.id] ?? 1;
                          return (
                            <div key={player.id} className={"rounded-2xl border p-2 " + (winner ? "border-emerald-400 bg-emerald-500/10" : justOut ? "border-red-400 bg-red-500/10" : out ? "border-zinc-700 bg-black/30" : "border-white bg-white text-black")}>
                              <PlayerCard player={player} compact small variant={winner ? "winner" : justOut ? "duelist" : out ? "eliminated" : "default"} />
                              <div className={"mt-2 rounded-xl border px-3 py-3 text-center text-2xl font-black " + (winner ? "border-emerald-400 bg-emerald-500 text-black" : justOut ? "border-red-400 bg-red-500 text-white" : out ? "border-zinc-700 bg-zinc-900 text-zinc-500" : "border-zinc-300 bg-white text-black")}>
                                {odd}
                              </div>
                              <div className={"mt-1 text-center text-[11px] font-bold " + (winner ? "text-emerald-200" : justOut ? "text-red-200" : out ? "text-zinc-500" : "text-zinc-700")}>
                                % chance to lose
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "dailyHide" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Hide</div>
                    <div className="mb-4 text-zinc-300">Players hide under the numbered grid. The highlighted player picks a number each turn.</div>

                    <div className="mb-5 grid grid-cols-12 gap-2">
                      {(dailyHideState?.turnOrder || []).map((id) => {
                        const player = livingPlayers.find((p) => p.id === id) || eliminated.find((p) => p.id === id);
                        const isTurn = dailyHideState?.stage === "pick" && dailyHideState?.currentPickerId === id;
                        const isFound = dailyHideState?.eliminatedIds?.includes(id);
                        const isPendingRemoval = dailyHideState?.pendingRemovalIds?.includes(id);
                        return (
                          <div key={id} className={isTurn ? "rounded-2xl ring-4 ring-yellow-300" : "rounded-2xl"}>
                            {player ? <PlayerCard player={player} compact small variant={isPendingRemoval ? "eliminated" : isFound ? "default" : "default"} /> : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mx-auto grid w-fit grid-cols-7 gap-1 rounded-2xl border border-white/10 bg-black/30 p-3">
                      {Array.from({ length: 49 }, (_, i) => i + 1).map((n) => {
                        const reveal = dailyHideState?.revealedMap?.[n];
                        const foundPlayer = reveal && reveal !== "X"
                          ? (livingPlayers.find((p) => p.id === reveal) || eliminated.find((p) => p.id === reveal))
                          : null;
                        return (
                          <div key={n} className={"flex h-12 w-12 items-center justify-center rounded-md border text-sm font-bold " + ((dailyHideState?.stage === "reveal" && dailyHideState?.currentPickNumber === n) ? "border-red-400 bg-red-500/30 text-white" : "border-white/10 bg-zinc-900 text-white")}>
                            {reveal ? (
                              reveal === "X" ? (
                                <span className="text-xl font-black text-red-400">X</span>
                              ) : foundPlayer ? (
                                <img src={foundPlayer.image} alt={foundPlayer.name} className="h-10 w-10 rounded object-cover grayscale" />
                              ) : null
                            ) : (
                              <span>{n}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 text-center text-zinc-300">
                      {dailyHideState?.stage === "pick" && dailyHideState?.currentPickerId
                        ? ((livingPlayers.find((p) => p.id === dailyHideState.currentPickerId)?.name || "Player") + " is choosing a number.")
                        : dailyHideState?.stage === "reveal" && dailyHideState?.currentPickNumber
                          ? ("Selected number " + dailyHideState.currentPickNumber)
                          : (dailyHideState?.message || "Advance to continue.")}
                    </div>

                    {dailyHideState?.finished ? <div className="mt-2 text-center text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}
                  </div>
                ) : null}

                {screen === "dailyCallOut" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Daily — Call Out</div>
                    <div className="mb-5 text-zinc-300">Two players face off with D100 rolls. The winner stays in control and calls out the next matchup until one player remains and wins immunity.</div>
                    <div className="mb-6 grid gap-5 md:grid-cols-2">{Array.from({ length: 2 }).map((_, index) => { const id = dailyCallOutState?.currentPair?.[index] || null; const player = livingPlayers.find((p) => p.id === id) || eliminated.find((p) => p.id === id) || null; const loser = !!(player && dailyCallOutState?.eliminatedIds?.includes(player.id) && dailyCallOutState?.lastRolls?.[player.id]); const chooser = !!(player && dailyCallOutState?.chooserId === player.id && dailyCallOutState?.stage === "result"); return player ? <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[150px]"><PlayerCard player={player} variant={loser ? "eliminated" : chooser ? "winner" : "default"} small /></div><div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Roll</div><div className="mt-2 text-5xl font-black text-white">{dailyCallOutState?.lastRolls?.[player.id] || "—"}</div><div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">{loser ? "Eliminated" : chooser ? "Calls Next" : "In Matchup"}</div></div> : <div key={index} className="flex aspect-[4/5] items-center justify-center rounded-3xl border-2 border-dashed border-white/15 bg-black/20 text-zinc-500">Open Spot</div>; })}</div>
                    {dailyCallOutState?.chooserId ? <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Current Caller</div><div className="mt-2 flex justify-center">{(() => { const chooser = livingPlayers.find((p) => p.id === dailyCallOutState.chooserId) || eliminated.find((p) => p.id === dailyCallOutState.chooserId); return chooser ? <div className="w-[140px]"><PlayerCard player={chooser} variant="winner" small /></div> : null; })()}</div></div> : null}
                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300"><div>Round {dailyCallOutState?.round || 1}</div><div className="mt-2">{dailyCallOutState?.message || "Advance to continue."}</div><div className="mt-2 text-sm text-zinc-400">{dailyCallOutState?.activeIds?.length || 0} still active</div>{dailyCallOutState?.finished ? <div className="mt-2 text-emerald-300">{dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.</div> : null}</div>
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-5"><div className="mb-3 text-lg font-bold">Players Still In</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">{[...livingPlayers].filter((player) => dailyCallOutState?.activeIds?.includes(player.id) || dailyCallOutState?.eliminatedIds?.includes(player.id)).sort((a, b) => { const outA = dailyCallOutState?.eliminatedIds?.includes(a.id) ? 1 : 0; const outB = dailyCallOutState?.eliminatedIds?.includes(b.id) ? 1 : 0; return outA - outB; }).map((player) => <PlayerCard key={player.id} player={player} compact small variant={dailyCallOutState?.eliminatedIds?.includes(player.id) ? "eliminated" : dailyCallOutState?.chooserId === player.id ? "winner" : "default"} />)}</div></div>
                  </div>
                ) : null}

                {screen === "dailyDontBeLast" ? (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black">Daily — Don't Be Last</div>
                        <div className="mt-1 text-zinc-300">Click each active player's D100 in any order. Once everyone rolls, hit Advance and the lowest score is eliminated.</div>
                      </div>
                      <button
                        onClick={() => {
                          (dailyDontBeLastState?.activeIds || []).forEach((id) => {
                            if (typeof dailyDontBeLastState?.roundRolls?.[id] !== "number") {
                              handleDontBeLastRoll(id);
                            }
                          });
                        }}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                      >
                        Roll All
                      </button>
                    </div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {dailyDontBeLastState?.round || 1}</div>
                      {(() => {
                        const scored = (dailyDontBeLastState?.activeIds || [])
                          .filter((id) => typeof dailyDontBeLastState?.roundRolls?.[id] === "number")
                          .map((id) => ({ id, score: dailyDontBeLastState.roundRolls[id] }));
                        const last = scored.length
                          ? scored.reduce((low, cur) => (cur.score < low.score ? cur : low), scored[0])
                          : null;
                        const player = last ? livingPlayers.find((p) => p.id === last.id) : null;
                        return last ? (
                          <div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Currently In Last Place</div>
                            <div className="mt-2 text-2xl font-black text-red-300">{player?.name || "Player"}</div>
                            <div className="mt-2 text-lg font-bold text-yellow-300">Score to beat: {last.score}</div>
                          </div>
                        ) : (
                          <div className="mt-2 text-lg font-bold text-yellow-300">Score to beat: —</div>
                        );
                      })()}

                      <div className="mt-3 text-sm text-zinc-400">{dailyDontBeLastState?.message || "Click the dice to reveal rolls."}</div>

                      {dailyDontBeLastState?.lastEliminatedId ? (
                        <div className="mt-2 text-sm text-red-300">
                          Last out: {(livingPlayers.find((p) => p.id === dailyDontBeLastState.lastEliminatedId) || eliminated.find((p) => p.id === dailyDontBeLastState.lastEliminatedId))?.name}
                        </div>
                      ) : null}

                      {dailyDontBeLastState?.finished ? (
                        <div className="mt-2 text-emerald-300">
                          {dailyWinner?.name || "A player"} wins the daily. Hit Advance to lock them in as safe.
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                      {[...livingPlayers]
                        .filter((player) => dailyDontBeLastState?.activeIds?.includes(player.id) || dailyDontBeLastState?.eliminatedIds?.includes(player.id))
                        .map((player) => {
                          const active = dailyDontBeLastState?.activeIds?.includes(player.id);
                          const out = dailyDontBeLastState?.eliminatedIds?.includes(player.id);
                          const rolled = typeof dailyDontBeLastState?.roundRolls?.[player.id] === "number";
                          const score = rolled ? dailyDontBeLastState.roundRolls[player.id] : null;
                          const isLowest = active && rolled && score === currentLowestDontBeLast;

                          return (
                            <div key={player.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                              <PlayerCard
                                player={player}
                                compact
                                small
                                variant={out ? "eliminated" : dailyDontBeLastState?.winnerId === player.id ? "winner" : "default"}
                              />

                              <button
                                onClick={() => handleDontBeLastRoll(player.id)}
                                disabled={!active || out || rolled || dailyDontBeLastState?.finished}
                                className={
                                  "mt-2 w-full rounded-xl px-3 py-3 text-sm font-black transition " +
                                  (isLowest
                                    ? "bg-red-500 text-white ring-2 ring-red-300"
                                    : !active || out || rolled || dailyDontBeLastState?.finished
                                    ? "bg-zinc-800/60 text-zinc-500 cursor-not-allowed"
                                    : "bg-white text-black hover:scale-[1.02]")
                                }
                              >
                                {rolled ? score : "Roll D100"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {screen === "challenge" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Challenge</div>
                    <div className="mb-4 text-zinc-300">Advance to reveal who wins the challenge and becomes safe.</div>
                    {castGrid(livingPlayers)}
                  </div>
                ) : null}

                {screen === "winnerPicked" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Challenge Winner</div>
                    <div className="mb-4 text-zinc-300">{challengeWinner ? `${challengeWinner.name} wins the challenge and is safe.` : "Challenge winner revealed."}</div>
                    {challengeWinner ? <div className="mx-auto max-w-[260px]"><PlayerCard player={challengeWinner} variant="winner" /></div> : null}
                  </div>
                ) : null}

                {screen === "safetyChain" ? (
                  <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black">Chain of Safety</div>
                        <div className="mt-1 text-zinc-300">Advance to reveal the next safe player.</div>
                      </div>
                      <button
                        onClick={() => setRevealedSafeCount(safetyOrder.length)}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black shadow-lg transition hover:scale-[1.02]"
                      >
                        Reveal All
                      </button>
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {Array.from({ length: safetyOrder.length }).map((_, i) => {
                        const player = safePlayers[i] || null;
                        return player ? (
                          <PlayerCard key={player.id + "-safe-slot-" + i} player={player} variant="safe" compact />
                        ) : (
                          <HiddenCard key={"safe-slot-" + i} />
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-12">
                      {unsavedPlayers.map((player) => <PlayerCard key={player.id} player={player} compact />)}
                    </div>
                  </div>
                ) : null}

                {screen === "callout" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Call Out</div>
                    <div className="mb-4 text-zinc-300">
                      {calloutRevealDone
                        ? "The opponent has been called out. Advance to reveal duel options."
                        : "Advance to reveal who was called out to duel, or click someone below to choose them manually."}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {duelA ? <div className="mx-auto w-[180px]"><PlayerCard player={duelA} variant="duelist" small /></div> : null}
                      {calloutRevealDone ? (
                        duelB ? <div className="mx-auto w-[180px]"><PlayerCard player={duelB} variant="challenger" small /></div> : null
                      ) : (
                        <div className="mx-auto w-[180px]"><HiddenCard tall /></div>
                      )}
                    </div>
                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 text-lg font-bold">Eligible To Be Called Out</div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                        {livingPlayers
                          .filter((p) => p.id !== duelAId && p.id !== challengeWinnerId && (!calloutRevealDone || p.id !== duelBId))
                          .map((player) => (
                            <button key={player.id} onClick={() => chooseManualCallout(player.id)} disabled={calloutRevealDone} className={calloutRevealDone ? "cursor-default" : "transition hover:scale-[1.02]"}>
                              <PlayerCard player={player} compact small />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {screen === "duelSelection" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Choose Duel</div>
                    <div className="mb-4 text-zinc-300">Click a hidden card to reveal a duel, then Advance to play it.</div>
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      {duelA ? <div className="mx-auto w-[180px]"><PlayerCard player={duelA} variant="duelist" small /></div> : null}
                      {duelB ? <div className="mx-auto w-[180px]"><PlayerCard player={duelB} variant="challenger" small /></div> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                      {(shuffledDuelOptions || []).map((duel) => currentDuel?.id === duel.id ? (
                        <div key={duel.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="font-bold">{duel.name}</div>
                          <div className="mt-2 text-sm text-zinc-300">{duel.description}</div>
                        </div>
                      ) : (
                        <HiddenCard key={duel.id} onClick={() => revealDuel(duel)} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {screen === "finalSeries" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Final Duel Series</div>
                    <div className="mb-4 text-zinc-300">First to {finalSeriesScore?.target || 3} wins. Reveal a duel and advance to play it.</div>
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      {duelA ? <div className="mx-auto w-[180px]"><PlayerCard player={duelA} variant="duelist" small /></div> : null}
                      {duelB ? <div className="mx-auto w-[180px]"><PlayerCard player={duelB} variant="challenger" small /></div> : null}
                    </div>
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      {[duelA, duelB].filter(Boolean).map((p) => <div key={p.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center"><div className="font-bold">{p.name}</div><div className="mt-2 text-4xl font-black">{finalSeriesScore?.[p.id] || 0}</div></div>)}
                    </div>
                    {!currentDuel ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">{(finalSeriesRemainingDuels.length ? finalSeriesRemainingDuels : enabledDuelList.filter((d) => d.id !== "popularity" && d.id !== "double-duel")).map((duel) => <HiddenCard key={duel.id + "-final"} onClick={() => revealFinalSeriesDuel(duel)} />)}</div> : <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="font-bold">{currentDuel.name}</div><div className="mt-2 text-sm text-zinc-300">{currentDuel.description}</div></div>}
                  </div>
                ) : null}

                {screen === "doubleDuelCallout1" || screen === "doubleDuelCallout2" ? (
  <div>
    <div className="mb-4 text-2xl font-black">Double Duel</div>

    <div className="mb-4 text-zinc-300">
      {screen === "doubleDuelCallout1"
        ? (doubleDuelState?.firstTargetId
            ? "First matchup revealed. Advance to move to the second callout."
            : "Advance to reveal the first called out player, or click someone below to choose them manually.")
        : (doubleDuelState?.secondTargetId
            ? "Second matchup revealed. Advance to choose the first duel."
            : "Advance to reveal the second called out player, or click someone below to choose them manually.")}
    </div>

    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Matchup 1</div>
        <div className="grid grid-cols-2 gap-4 items-start">
          {doubleDuelState?.firstCallerId && (
            <div className="mx-auto w-[180px]">
              <PlayerCard
                player={livingPlayers.find((p) => p.id === doubleDuelState.firstCallerId)}
                variant="duelist"
                small
              />
            </div>
          )}

          {doubleDuelState?.firstTargetId ? (
            <div className="mx-auto w-[180px]">
              <PlayerCard
                player={livingPlayers.find((p) => p.id === doubleDuelState.firstTargetId)}
                variant="challenger"
                small
              />
            </div>
          ) : (
            <div className="mx-auto w-[180px]">
              <HiddenCard tall />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Matchup 2</div>
        <div className="grid grid-cols-2 gap-4 items-start">
          {doubleDuelState?.secondCallerId && (
            <div className="mx-auto w-[180px]">
              <PlayerCard
                player={livingPlayers.find((p) => p.id === doubleDuelState.secondCallerId)}
                variant="duelist"
                small
              />
            </div>
          )}

          {doubleDuelState?.secondTargetId ? (
            <div className="mx-auto w-[180px]">
              <PlayerCard
                player={livingPlayers.find((p) => p.id === doubleDuelState.secondTargetId)}
                variant="challenger"
                small
              />
            </div>
          ) : (
            <div className="mx-auto w-[180px]">
              <HiddenCard tall />
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <div className="mb-3 text-lg font-bold">Eligible To Be Called Out</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {livingPlayers
          .filter((p) => ![
            challengeWinnerId,
            doubleDuelState?.firstCallerId,
            doubleDuelState?.secondCallerId,
            doubleDuelState?.firstTargetId,
            doubleDuelState?.secondTargetId,
          ].includes(p.id))
          .map((player) => {
            const isClickable = (screen === "doubleDuelCallout1" && !doubleDuelState?.firstTargetId) || (screen === "doubleDuelCallout2" && !doubleDuelState?.secondTargetId);
            const which = screen === "doubleDuelCallout1" ? 1 : 2;
            return (
              <button
                key={player.id}
                onClick={() => isClickable ? chooseManualDoubleDuelCallout(which, player.id) : null}
                disabled={!isClickable}
                className={isClickable ? "transition hover:scale-[1.02]" : "cursor-default"}
              >
                <PlayerCard player={player} compact small />
              </button>
            );
          })}
      </div>
    </div>
  </div>
) : null}

                {screen === "doubleDuelSelection1" || screen === "doubleDuelSelection2" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Choose Duel</div>
                    <div className="mb-4 text-zinc-300">Select the duel for this Double Duel matchup.</div>
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      {duelA ? <div className="mx-auto w-[180px]"><PlayerCard player={duelA} variant="duelist" small /></div> : null}
                      {duelB ? <div className="mx-auto w-[180px]"><PlayerCard player={duelB} variant="challenger" small /></div> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                      {(shuffledDuelOptions || []).map((duel) => currentDuel?.id === duel.id ? <div key={duel.id} className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="font-bold">{duel.name}</div><div className="mt-2 text-sm text-zinc-300">{duel.description}</div></div> : <HiddenCard key={duel.id} onClick={() => revealDuel(duel)} />)}
                    </div>
                  </div>
                ) : null}

                {screen === "coinFlipDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Coin Flip</div>
                    <div className="mb-4 text-zinc-300">Advance through the flip.</div>
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      {duelA ? <div className="mx-auto w-[180px]"><PlayerCard player={duelA} variant={duelResult?.loser?.id === duelA.id ? (coinLoserReveal ? "eliminated" : "default") : "winner"} small /></div> : null}
                      {duelB ? <div className="mx-auto w-[180px]"><PlayerCard player={duelB} variant={duelResult?.loser?.id === duelB.id ? (coinLoserReveal ? "eliminated" : "default") : "winner"} small /></div> : null}
                    </div>
                    <CoinFace playerA={duelA} playerB={duelB} winner={duelResult?.winner} />
                  </div>
                ) : null}

                {screen === "rpsDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Rock, Paper, Scissors</div>
                    <div className="mb-4 text-zinc-300">Advance to reveal the throws.</div>
                    <div className="grid grid-cols-2 gap-4">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={rpsState?.winner?.id === duelA.id ? "winner" : "duelist"} small /></div><div className="text-6xl">{rpsState?.stage === "throws" ? (rpsState?.p1Emoji || "❔") : "❔"}</div><div className="mt-2 text-lg font-bold">{rpsState?.stage === "throws" ? (rpsState?.p1Pick || "") : "Hidden"}</div></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={rpsState?.winner?.id === duelB.id ? "winner" : "challenger"} small /></div><div className="text-6xl">{rpsState?.stage === "throws" ? (rpsState?.p2Emoji || "❔") : "❔"}</div><div className="mt-2 text-lg font-bold">{rpsState?.stage === "throws" ? (rpsState?.p2Pick || "") : "Hidden"}</div></div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "tugDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Tug Of War</div>
                    <div className="mb-4 text-zinc-300">Each advance pulls the rope based on both players' rolls.</div>
                    <div className="mb-5 grid grid-cols-2 gap-4">
                      {duelA ? <TotalCounterCard player={duelA} total={tugState?.lastPullA || 0} variant="duelist" rolls={tugState?.lastPullA ? [tugState.lastPullA] : []} /> : null}
                      {duelB ? <TotalCounterCard player={duelB} total={tugState?.lastPullB || 0} variant="challenger" rolls={tugState?.lastPullB ? [tugState.lastPullB] : []} /> : null}
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-center">
                      <div className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-400">Rope</div>
                      <div className="relative mx-auto max-w-3xl">
                        <div className="h-4 rounded-full bg-zinc-800" />
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-4">
                          <div className="relative h-0">
                            <div className="absolute -top-4 h-8 w-8 rounded-full border-4 border-white bg-red-500 shadow-lg" style={{ left: `${((tugState?.position ?? 5) / 10) * 100}%`, transform: 'translateX(-50%)' }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-lg font-bold text-white">Position: {tugState?.position ?? 5} / 10</div>
                    </div>
                  </div>
                ) : null}

                {screen === "popularityDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Popularity</div>
                    <div className="mb-4 text-zinc-300">Reveal the votes one by one.</div>

                    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-[140px] shrink-0">
                              <PlayerCard player={duelA} variant="duelist" small />
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Votes</div>
                              <div className="mt-2 text-6xl font-black text-red-400">{popularityState?.countA ?? 0}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {duelB ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-[140px] shrink-0">
                              <PlayerCard player={duelB} variant="challenger" small />
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Votes</div>
                              <div className="mt-2 text-6xl font-black text-red-400">{popularityState?.countB ?? 0}</div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {(popularityState?.voters || []).map((voter) => {
                        const revealed = popularityState?.revealedVoterIds?.includes(voter.id);
                        const votedFor = popularityState?.votes?.[voter.id];
                        const target = votedFor === duelAId ? duelA : duelB;
                        return (
                          <div key={voter.id} className="rounded-2xl border border-white/10 bg-black/30 p-2">
                            <div className="grid grid-cols-[1fr_88px] items-center gap-2">
                              <PlayerCard player={voter} compact small />
                              {revealed ? (
                                <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/80 px-2 text-center text-sm font-bold text-white">
                                  {target?.name || "—"}
                                </div>
                              ) : (
                                <HiddenCard onClick={() => revealPopularityVote(voter.id)} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {popularityState?.tiebreakVote && !popularityState?.tiebreakRevealed ? (
                      <div className="mt-5 max-w-[240px]">
                        <HiddenCard onClick={() => revealPopularityTiebreak()} />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {screen === "highRollerDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">High Roller</div>
                    <div className="mb-4 text-zinc-300">Click each die to roll. Highest total wins.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant="duelist" small /></div><div className="mb-4 flex justify-center"><D20Die value={highRollerState?.rollsA?.[highRollerState?.rollsA?.length - 1] || null} /></div><div className="mb-3 text-center text-4xl font-black text-white">{highRollerState?.totalA || 0}</div><div className="grid grid-cols-3 gap-2">{Array.from({ length: Math.max(5, (highRollerState?.suddenDeathRound || 0) + 5) }).map((_, i) => <button key={i} onClick={() => handleHighRollerRoll("A")} disabled={i !== (highRollerState?.rollsA?.length || 0) || (highRollerState?.finished)} className={("rounded-xl border px-2 py-2 text-center text-sm font-bold ") + (i < (highRollerState?.rollsA?.length || 0) ? "border-emerald-400 bg-emerald-500 text-black" : i === (highRollerState?.rollsA?.length || 0) && !highRollerState?.finished ? "border-white/10 bg-white text-black" : "border-white/10 bg-zinc-900 text-zinc-500")}>{highRollerState?.rollsA?.[i] ?? "Roll"}</button>)}</div></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant="challenger" small /></div><div className="mb-4 flex justify-center"><D20Die value={highRollerState?.rollsB?.[highRollerState?.rollsB?.length - 1] || null} /></div><div className="mb-3 text-center text-4xl font-black text-white">{highRollerState?.totalB || 0}</div><div className="grid grid-cols-3 gap-2">{Array.from({ length: Math.max(5, (highRollerState?.suddenDeathRound || 0) + 5) }).map((_, i) => <button key={i} onClick={() => handleHighRollerRoll("B")} disabled={i !== (highRollerState?.rollsB?.length || 0) || (highRollerState?.finished)} className={("rounded-xl border px-2 py-2 text-center text-sm font-bold ") + (i < (highRollerState?.rollsB?.length || 0) ? "border-emerald-400 bg-emerald-500 text-black" : i === (highRollerState?.rollsB?.length || 0) && !highRollerState?.finished ? "border-white/10 bg-white text-black" : "border-white/10 bg-zinc-900 text-zinc-500")}>{highRollerState?.rollsB?.[i] ?? "Roll"}</button>)}</div></div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "keepItUpDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Keep It Up</div>
                    <div className="mb-4 text-zinc-300">Each round stamina drops and slips can end the duel.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[{ player: duelA, variant: 'duelist', stamina: keepItUpState?.staminaA, regained: keepItUpState?.regainedA, slipped: keepItUpState?.slippedA, dropped: keepItUpState?.droppedA }, { player: duelB, variant: 'challenger', stamina: keepItUpState?.staminaB, regained: keepItUpState?.regainedB, slipped: keepItUpState?.slippedB, dropped: keepItUpState?.droppedB }].map(({ player, variant, stamina, regained, slipped, dropped }) => player ? <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={player} variant={dropped ? 'eliminated' : variant} small /></div><div className="text-5xl font-black text-white">{stamina ?? 10}</div><div className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Stamina</div><div className="mt-4 flex justify-center gap-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className={("h-3 w-5 rounded-full ") + (i < (stamina ?? 0) ? 'bg-emerald-400' : 'bg-zinc-700')} />)}</div><div className="mt-3 text-sm text-zinc-300">{dropped ? 'Dropped' : regained ? 'Regained strength' : slipped ? 'Slipped' : 'Holding on'}</div></div> : null)}
                    </div>
                  </div>
                ) : null}

                {screen === "towerDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">The Tower</div>
                    <div className="mb-4 text-zinc-300">Round winner cuts one of the opponent's ropes.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={towerState?.loserId === duelA.id ? 'eliminated' : 'duelist'} small /></div><RopeGrid colors={towerState?.colors || []} cutColors={towerState?.cutA || []} /><div className="mt-3 text-sm text-zinc-300">Death rope hidden</div></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={towerState?.loserId === duelB.id ? 'eliminated' : 'challenger'} small /></div><RopeGrid colors={towerState?.colors || []} cutColors={towerState?.cutB || []} /><div className="mt-3 text-sm text-zinc-300">Death rope hidden</div></div> : null}
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-center text-zinc-300">{towerState?.stage === 'winnerReveal' ? 'Advance to reveal who won the round.' : towerState?.stage === 'cutReveal' ? ((livingPlayers.find((p) => p.id === towerState?.currentWinnerId)?.name || 'Winner') + ' is cutting a rope.') : towerState?.stage === 'cutChosen' ? ('Cut color: ' + (towerState?.currentCutColor || '?')) : ('Round ' + (towerState?.round || 1))}</div>
                  </div>
                ) : null}

                {screen === "lifePointsDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Life Points</div>
                    <div className="mb-4 text-zinc-300">Each advance both players roll self-damage from 0–500.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[{ player: duelA, variant: 'duelist', health: lifePointsState?.healthA, last: lifePointsState?.lastRollA }, { player: duelB, variant: 'challenger', health: lifePointsState?.healthB, last: lifePointsState?.lastRollB }].map(({ player, variant, health, last }) => player ? <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={player} variant={variant} small /></div><div className="text-5xl font-black text-white">{health ?? 1500}</div><div className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-400">Health</div><div className="mt-3 text-lg font-bold text-red-300">Last hit: {typeof last === 'number' ? last : '—'}</div></div> : null)}
                    </div>
                  </div>
                ) : null}

                {screen === "pokerDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Poker</div>
                    <div className="mb-5 text-zinc-300">Advance through hole cards, flop, turn, river, then showdown.</div>
                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 text-center text-lg font-bold">Community Cards</div>
                      <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <PokerCard key={i} card={i < (pokerState?.revealCount || 0) ? pokerState?.board?.[i] : null} />)}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={pokerState?.winnerId === duelA.id ? 'winner' : 'duelist'} small /></div><div className="grid grid-cols-2 gap-2">{(pokerState?.holeA || []).map((card, i) => <PokerCard key={i} card={card} />)}</div><div className="mt-3 text-lg font-bold text-white">{pokerState?.currentHandA || 'High Card'}</div><div className="mt-1 text-sm text-emerald-300">{pokerState?.winPctA ?? 50}% to win</div>{pokerState?.neededLabel === 'A' ? (pokerState?.neededCards?.length > 25 ? <div className="mt-1 text-xs text-amber-300">all other cards</div> : <div className="mt-2 flex flex-wrap justify-center gap-1">{(pokerState?.neededCards || []).map((label, i) => { const match = String(label).match(/^(10|[2-9JQKA])([♠♥♦♣])$/); return match ? <PokerCard key={label + i} card={{ rank: match[1], suit: match[2] }} /> : null; })}</div>) : null}</div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={pokerState?.winnerId === duelB.id ? 'winner' : 'challenger'} small /></div><div className="grid grid-cols-2 gap-2">{(pokerState?.holeB || []).map((card, i) => <PokerCard key={i} card={card} />)}</div><div className="mt-3 text-lg font-bold text-white">{pokerState?.currentHandB || 'High Card'}</div><div className="mt-1 text-sm text-emerald-300">{pokerState?.winPctB ?? 50}% to win</div>{pokerState?.neededLabel === 'B' ? (pokerState?.neededCards?.length > 25 ? <div className="mt-1 text-xs text-amber-300">all other cards</div> : <div className="mt-2 flex flex-wrap justify-center gap-1">{(pokerState?.neededCards || []).map((label, i) => { const match = String(label).match(/^(10|[2-9JQKA])([♠♥♦♣])$/); return match ? <PokerCard key={label + i} card={{ rank: match[1], suit: match[2] }} /> : null; })}</div>) : null}</div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "poisonCupDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Poison Cup</div>
                    <div className="mb-4 text-zinc-300">Each side has one poisoned cup hidden by the opponent.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[{ player: duelA, variant: 'duelist', cups: poisonCupState?.cupsA }, { player: duelB, variant: 'challenger', cups: poisonCupState?.cupsB }].map(({ player, variant, cups }) => player ? <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={player} variant={variant} small /></div><div className="grid grid-cols-4 gap-2">{(cups || []).map((cup, i) => cup.active ? <div key={i} className={("flex aspect-square items-center justify-center rounded-lg border text-sm font-black ") + (cup.selected ? 'border-yellow-300 bg-yellow-400 text-black' : cup.revealed && cup.poison ? 'border-red-400 bg-red-500 text-white' : cup.safeGone ? 'border-zinc-700 bg-zinc-900 text-zinc-500' : 'border-white/10 bg-black/20 text-white')}>{cup.label}</div> : <div key={i} className="aspect-square" />)}</div></div> : null)}
                    </div>
                  </div>
                ) : null}

                {screen === "fourDTicTacToeDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">4D Tic Tac Toe</div>
                    <div className="mb-4 text-zinc-300">Your move sends the next player to the matching board.</div>
                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 text-center text-lg font-bold">Main Board</div>
                      <FourDBoard cells={fourDTicTacToeState?.mainBoard || Array(9).fill(null)} playerA={duelA} playerB={duelB} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {(fourDTicTacToeState?.boards || []).map((board, idx) => <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Board {idx + 1}</div><FourDBoard cells={board} playerA={duelA} playerB={duelB} highlight={fourDTicTacToeState?.forcedBoard === idx} small /></div>)}
                    </div>
                  </div>
                ) : null}

                {screen === "fillTheBoardDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Fill The Board</div>
                    <div className="mb-4 text-zinc-300">Roll D20s and fill all numbers from 1 to 20 first.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={fillTheBoardState?.winnerId === duelA.id ? 'winner' : 'duelist'} small /></div><div className="mb-4 flex justify-center gap-2">{(fillTheBoardState?.rollsA || []).map((v, i) => <D20Die key={i} value={v} rolling={fillTheBoardState?.animating} />)}</div><FillBoardGrid filled={fillTheBoardState?.filledA || []} duplicateFlash={fillTheBoardState?.duplicateFlashA || []} /></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={fillTheBoardState?.winnerId === duelB.id ? 'winner' : 'challenger'} small /></div><div className="mb-4 flex justify-center gap-2">{(fillTheBoardState?.rollsB || []).map((v, i) => <D20Die key={i} value={v} rolling={fillTheBoardState?.animating} />)}</div><FillBoardGrid filled={fillTheBoardState?.filledB || []} duplicateFlash={fillTheBoardState?.duplicateFlashB || []} /></div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "safeCrackerDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Safe Cracker</div>
                    <div className="mb-4 text-zinc-300">Correct digits in the correct spots lock in green.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={safeCrackerState?.winnerId === duelA.id ? 'winner' : 'duelist'} small /></div><SafeCodeRow guess={safeCrackerState?.guessA || [null,null,null,null]} locked={safeCrackerState?.lockedA || [null,null,null,null]} /><div className="mt-3 space-y-1">{(safeCrackerState?.historyA || []).slice(-5).reverse().map((row, i) => <div key={i} className="text-center text-xs text-zinc-400">{row.join(' ')}</div>)}</div></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={safeCrackerState?.winnerId === duelB.id ? 'winner' : 'challenger'} small /></div><SafeCodeRow guess={safeCrackerState?.guessB || [null,null,null,null]} locked={safeCrackerState?.lockedB || [null,null,null,null]} /><div className="mt-3 space-y-1">{(safeCrackerState?.historyB || []).slice(-5).reverse().map((row, i) => <div key={i} className="text-center text-xs text-zinc-400">{row.join(' ')}</div>)}</div></div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "standoffDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Standoff</div>
                    <div className="mb-4 text-zinc-300">Both duelers choose shoot, reload, or shield at the same time.</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[{ player: duelA, variant: 'duelist', lives: standoffState?.livesA, bullets: standoffState?.bulletsA, action: standoffState?.actionA }, { player: duelB, variant: 'challenger', lives: standoffState?.livesB, bullets: standoffState?.bulletsB, action: standoffState?.actionB }].map(({ player, variant, lives, bullets, action }) => player ? <div key={player.id} className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[180px]"><PlayerCard player={player} variant={standoffState?.winnerId === player.id ? 'winner' : standoffState?.loserId === player.id ? 'eliminated' : variant} small /></div><HeartRow lives={lives ?? 3} /><div className="mt-4"><ActionEmoji action={action} /></div><div className="mt-3 text-lg font-bold text-white">Bullets: {bullets ?? 1}</div></div> : null)}
                    </div>
                  </div>
                ) : null}

                {screen === "wordScrambleDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Word Scramble</div>
                    <div className="mb-4 text-zinc-300">Advance 15 times to collect letters. Then both duelers reveal their best word.</div>

                    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={wordScrambleState?.winnerId === duelA.id ? 'winner' : 'duelist'} small /></div>
                          <div className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Collected Letters</div>
                          <div className="flex min-h-[48px] flex-wrap justify-center gap-2">
                            {(wordScrambleState?.collectedA || []).map((letter, i) => <div key={duelA.id + '-letter-' + i} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-lg font-black text-white">{letter}</div>)}
                          </div>
                          {wordScrambleState?.stage === 'reveal' ? (
                            <div>
                              <div className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Best Word</div>
                              <div className="mt-2 text-center text-3xl font-black text-emerald-300">{wordScrambleState?.wordA || '—'}</div>
                              <div className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Unused Letters</div>
                              <div className="mt-2 flex min-h-[40px] flex-wrap justify-center gap-2">
                                {(wordScrambleState?.unusedA || []).length ? (wordScrambleState?.unusedA || []).map((letter, i) => <div key={duelA.id + '-unused-' + i} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-sm font-black text-zinc-300">{letter}</div>) : <div className="text-sm text-zinc-500">None</div>}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {duelB ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={wordScrambleState?.winnerId === duelB.id ? 'winner' : 'challenger'} small /></div>
                          <div className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Collected Letters</div>
                          <div className="flex min-h-[48px] flex-wrap justify-center gap-2">
                            {(wordScrambleState?.collectedB || []).map((letter, i) => <div key={duelB.id + '-letter-' + i} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-lg font-black text-white">{letter}</div>)}
                          </div>
                          {wordScrambleState?.stage === 'reveal' ? (
                            <div>
                              <div className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Best Word</div>
                              <div className="mt-2 text-center text-3xl font-black text-emerald-300">{wordScrambleState?.wordB || '—'}</div>
                              <div className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Unused Letters</div>
                              <div className="mt-2 flex min-h-[40px] flex-wrap justify-center gap-2">
                                {(wordScrambleState?.unusedB || []).length ? (wordScrambleState?.unusedB || []).map((letter, i) => <div key={duelB.id + '-unused-' + i} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-zinc-950 text-sm font-black text-zinc-300">{letter}</div>) : <div className="text-sm text-zinc-500">None</div>}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-lg font-bold">Letter Grid</div>
                        <div className="text-sm text-zinc-400">Round {wordScrambleState?.round || 1} • {wordScrambleState?.stage === 'collect' ? `${wordScrambleState?.advances || 0}/15 advances` : 'Word reveal'}</div>
                      </div>
                      <div className="mx-auto grid w-fit grid-cols-10 gap-[1px]">
                        {(wordScrambleState?.board || []).flat().map((letter, i) => (
                          <div key={'grid-' + i} className="flex h-5 w-5 items-center justify-center rounded-[2px] border border-white/10 bg-zinc-900 text-[15px] font-black tracking-tight text-white leading-none sm:h-6 sm:w-6 sm:text-[18px]">{letter || ""}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {screen === "knightMovesDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Knight Moves</div>
                    <div className="mb-4 text-zinc-300">Move like a chess knight. Red tiles are burned forever. If you have no legal move, you lose.</div>

                    <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[160px]"><PlayerCard player={duelA} variant={knightMovesState?.winnerId === duelA.id ? "winner" : knightMovesState?.currentPlayer === "A" ? "safe" : "duelist"} small /></div><div className="text-sm text-zinc-300">{knightMovesState?.currentPlayer === "A" ? "Current turn" : "Waiting"}</div></div> : null}
                      {duelB ? <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-center"><div className="mx-auto mb-3 w-[160px]"><PlayerCard player={duelB} variant={knightMovesState?.winnerId === duelB.id ? "winner" : knightMovesState?.currentPlayer === "B" ? "safe" : "challenger"} small /></div><div className="text-sm text-zinc-300">{knightMovesState?.currentPlayer === "B" ? "Current turn" : "Waiting"}</div></div> : null}
                    </div>

                    <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-lg font-bold">Board</div>
                        <div className="text-sm text-zinc-400">Move {knightMovesState?.moveNumber || 1}</div>
                      </div>
                      <div className="mx-auto grid w-fit grid-cols-8 gap-[2px]">
                        {Array.from({ length: 8 }).flatMap((_, row) => Array.from({ length: 8 }).map((__, col) => {
                          const key = toKnightKey(row, col);
                          const isBurned = (knightMovesState?.burned || []).includes(key);
                          const isA = knightMovesState?.posA?.[0] === row && knightMovesState?.posA?.[1] === col;
                          const isB = knightMovesState?.posB?.[0] === row && knightMovesState?.posB?.[1] === col;
                          const currentPos = knightMovesState?.currentPlayer === "A" ? knightMovesState?.posA : knightMovesState?.posB;
                          const legal = (knightMovesState?.legalMoves || []).some(([r, c]) => r === row && c === col);
                          const targetable = getKnightAllTargets(currentPos).some(([r, c]) => r === row && c === col);
                          const blockedTarget = targetable && !legal && !isA && !isB && !isBurned;
                          const isCurrent = (knightMovesState?.currentPlayer === "A" && isA) || (knightMovesState?.currentPlayer === "B" && isB);
                          const base = isBurned ? "bg-red-600" : ((row + col) % 2 === 0 ? "bg-zinc-100" : "bg-zinc-800");
                          const overlay = isCurrent ? "ring-4 ring-green-400" : legal ? "ring-4 ring-yellow-300" : blockedTarget ? "ring-4 ring-orange-400" : "";
                          return (
                            <div key={key} className={`relative flex h-12 w-12 items-center justify-center rounded-sm border border-black/20 ${base} ${overlay}`}>
                              {isA ? <img src={duelA?.image} alt={duelA?.name} className="h-10 w-10 rounded object-cover" /> : null}
                              {isB ? <img src={duelB?.image} alt={duelB?.name} className="h-10 w-10 rounded object-cover" /> : null}
                            </div>
                          );
                        }))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      {knightMovesState?.finished
                        ? ((knightMovesState?.loserId === duelA?.id ? duelA?.name : duelB?.name) || "A player") + " has no legal knight move left."
                        : ((knightMovesState?.currentPlayer === "A" ? duelA?.name : duelB?.name) || "A player") + " to move."}
                    </div>
                  </div>
                ) : null}

                {screen === "marathonRollDuel" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Marathon Roll</div>
                    <div className="mb-4 text-zinc-300">Both duelers keep rolling 1–100. Once one player is more than 100 ahead, they win the duel.</div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {duelA ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelA} variant={marathonRollDuelState?.winnerId === duelA.id ? "winner" : "duelist"} small /></div>
                          <div className="text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Total</div>
                          <div className="mt-1 text-center text-5xl font-black text-white">{marathonRollDuelState?.totalA || 0}</div>
                          <div className="mt-3 text-center text-lg font-bold text-zinc-300">Last roll: {marathonRollDuelState?.lastRollA ?? "—"}</div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {(marathonRollDuelState?.rollsA || []).map((roll, i) => <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 px-2 py-2 text-center text-sm font-bold text-white">{roll}</div>)}
                          </div>
                        </div>
                      ) : null}

                      {duelB ? (
                        <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                          <div className="mx-auto mb-3 w-[180px]"><PlayerCard player={duelB} variant={marathonRollDuelState?.winnerId === duelB.id ? "winner" : "challenger"} small /></div>
                          <div className="text-center text-xs uppercase tracking-[0.2em] text-zinc-400">Total</div>
                          <div className="mt-1 text-center text-5xl font-black text-white">{marathonRollDuelState?.totalB || 0}</div>
                          <div className="mt-3 text-center text-lg font-bold text-zinc-300">Last roll: {marathonRollDuelState?.lastRollB ?? "—"}</div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {(marathonRollDuelState?.rollsB || []).map((roll, i) => <div key={i} className="rounded-xl border border-white/10 bg-zinc-900 px-2 py-2 text-center text-sm font-bold text-white">{roll}</div>)}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5 text-center text-zinc-300">
                      <div>Round {marathonRollDuelState?.round || 1}</div>
                      <div className="mt-2">Gap: {Math.abs((marathonRollDuelState?.totalA || 0) - (marathonRollDuelState?.totalB || 0))}</div>
                      {marathonRollDuelState?.finished ? <div className="mt-2 text-emerald-300">{duelResult?.winner?.name || (marathonRollDuelState?.winnerId === duelA?.id ? duelA?.name : duelB?.name) || "A player"} is over 100 ahead.</div> : null}
                    </div>
                  </div>
                ) : null}

                {screen === "duelResult" ? (
                  <div>
                    <div className="mb-4 text-2xl font-black">Duel Result</div>
                    <div className="mb-4 text-zinc-300">{duelResult?.text || "Advance to continue."}</div>
                    <div className="grid grid-cols-2 gap-4">
                      {duelResult?.winner ? <div className="mx-auto w-[180px]"><PlayerCard player={duelResult.winner} variant="winner" small /></div> : null}
                      {duelResult?.loser ? <div className="mx-auto w-[180px]"><PlayerCard player={duelResult.loser} variant="eliminated" small /></div> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {started && screen === "winner" ? (
          <div className="rounded-3xl border border-yellow-400/30 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
            <div className="mb-4 text-sm uppercase tracking-[0.2em] text-yellow-300">Winner</div>
            {champion ? (
              <div className="mx-auto max-w-[260px]">
                <PlayerCard player={champion} variant="champion" />
              </div>
            ) : null}

            {champion ? (
              <div className="mx-auto mt-6 grid max-w-xl gap-3 text-left">
                <input
                  value={seasonTitle}
                  onChange={(e) => setSeasonTitle(e.target.value)}
                  placeholder="Season title"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                />

                <textarea
                  value={seasonSummary}
                  onChange={(e) => setSeasonSummary(e.target.value)}
                  placeholder="Season summary"
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
                />

                <label className="flex items-center gap-2 text-sm font-bold text-zinc-200">
                  <input
                    type="checkbox"
                    checked={isPublicSeason}
                    onChange={(e) => setIsPublicSeason(e.target.checked)}
                  />
                  Post publicly
                </label>

                <button
                  onClick={saveSeason}
                  disabled={savingSeason}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingSeason ? "Saving..." : "Save Season"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {showAddCastModal ? (
          <AddCastMembersModal
            casts={availableCasts}
            modalCastId={modalCastId}
            modalContestants={modalContestants}
            modalSelectedIds={modalSelectedIds}
            loadingCasts={loadingCasts}
            loadingContestants={loadingModalContestants}
            onClose={() => setShowAddCastModal(false)}
            onChooseCast={loadContestantsForModal}
            onToggleContestant={(id) =>
              setModalSelectedIds((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              })
            }
            onSelectAll={() => setModalSelectedIds(new Set(modalContestants.map((person) => person.id)))}
            onSelectNone={() => setModalSelectedIds(new Set())}
            onAddSelected={addSelectedContestantsToRoster}
          />
        ) : null}
      </div>
    </div>
  );
}


function AddCastMembersModal({
  casts,
  modalCastId,
  modalContestants,
  modalSelectedIds,
  loadingCasts,
  loadingContestants,
  onClose,
  onChooseCast,
  onToggleContestant,
  onSelectAll,
  onSelectNone,
  onAddSelected,
}) {
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
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
          <div>
            <h2 className="text-3xl font-black text-white">Add Cast Members</h2>
            <p className="text-sm text-zinc-400">
              Pick an official or custom cast, select people, then add them to The Duel.
            </p>
          </div>

          <button onClick={onClose} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="space-y-4 overflow-auto border-r border-zinc-800 p-4">
            {loadingCasts ? (
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-zinc-300">Loading casts...</div>
            ) : casts.length === 0 ? (
              <div className="rounded-2xl border border-red-300/40 bg-red-500/15 p-4 text-red-100">No casts available yet.</div>
            ) : (
              <>
                {Object.keys(groupedOfficial).length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Favorite Official Casts</div>
                    <div className="space-y-2">
                      {Object.entries(groupedOfficial).map(([groupName, groupCasts]) => (
                        <div key={groupName}>
                          <div className="mb-1 text-xs font-bold text-zinc-500">{groupName}</div>
                          {groupCasts.map((cast) => (
                            <button
                              key={cast.id}
                              onClick={() => onChooseCast(cast.id)}
                              className={`mb-2 w-full rounded-2xl px-4 py-3 text-left font-black ${
                                modalCastId === cast.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-zinc-900 text-white hover:bg-zinc-800"
                              }`}
                            >
                              {cast.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {customCasts.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-widest text-zinc-400">Custom Casts</div>
                    <div className="space-y-2">
                      {customCasts.map((cast) => (
                        <button
                          key={cast.id}
                          onClick={() => onChooseCast(cast.id)}
                          className={`w-full rounded-2xl px-4 py-3 text-left font-black ${
                            modalCastId === cast.id
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-900 text-white hover:bg-zinc-800"
                          }`}
                        >
                          <div>{cast.name}</div>
                          <div className="text-xs font-bold opacity-70">{cast.show_name || "Custom Cast"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="overflow-auto p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-white">Contestants</h3>
                <p className="text-sm text-zinc-400">{selectedCount} selected</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={onSelectAll} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select All</button>
                <button onClick={onSelectNone} className="rounded-2xl bg-zinc-800 px-4 py-2 font-black text-white hover:bg-zinc-700">Select None</button>
                <button onClick={onAddSelected} disabled={selectedCount === 0} className="rounded-2xl bg-blue-600 px-4 py-2 font-black text-white hover:bg-blue-500 disabled:opacity-40">Add Selected</button>
              </div>
            </div>

            {loadingContestants ? (
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">Loading contestants...</div>
            ) : modalContestants.length === 0 ? (
              <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-zinc-300">No contestants found for this cast.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {modalContestants.map((person) => {
                  const active = modalSelectedIds.has(person.id);

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onToggleContestant(person.id)}
                      className={`relative aspect-square overflow-hidden rounded-2xl border ${
                        active ? "border-white ring-2 ring-white/60" : "border-zinc-700 opacity-45 grayscale"
                      }`}
                    >
                      {person.image_url ? (
                        <img src={person.image_url} className="h-full w-full object-cover" alt={person.name} />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-zinc-800 p-1 text-center text-xs font-black text-zinc-400">No Image</div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 truncate bg-black/75 px-1 py-1 text-center text-xs font-black text-white">
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
