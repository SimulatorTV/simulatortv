"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Matter, {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  World,
} from "matter-js";
import styles from "./MarbleRace.module.css";

export type MarbleContestant = {
  id: string;
  name: string;
  imageUrl: string;
};

type MarbleRaceProps = {
  contestants: MarbleContestant[];
  onSeasonFinished?: (
    winner: MarbleContestant,
    placements: MarbleContestant[],
  ) => void;
};

type MarbleMeta = {
  contestant: MarbleContestant;
  body: Matter.Body;
  textureUrl: string;
};

type ObstacleBody = Matter.Body & {
  plugin: {
    obstacleKind?: "red-reset" | "green-finish" | "stage";
    rotateSpeed?: number;
  };
};

const WIDTH = 1100;
const HEIGHT = 760;
const MARBLE_RADIUS = 24;
const START_X = 190;
const START_Y = 75;
const START_WIDTH = 720;
const START_HEIGHT = 145;
const FLOOR_Y = HEIGHT - 42;
const CATEGORY_MARBLE = 0x0001;
const CATEGORY_STAGE = 0x0002;
const CATEGORY_SENSOR = 0x0004;

const STAGE_COUNT = 13;
let lastStageVariant = -1;

function getRandomStageVariant() {
  if (STAGE_COUNT <= 1) return 0;

  let next = Math.floor(Math.random() * STAGE_COUNT);
  while (next === lastStageVariant) {
    next = Math.floor(Math.random() * STAGE_COUNT);
  }

  lastStageVariant = next;
  return next;
}

const safeName = (name: string) => name.replace(/[<>&"]/g, "");

function shuffled<T>(items: T[]): T[] {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function makeWall(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Matter.IChamferableBodyDefinition = {},
) {
  const suppliedAngle = typeof options.angle === "number" ? options.angle : 0;
  const isLongCoursePlatform =
    width > height * 2.5 &&
    y > START_Y + START_HEIGHT + 28 &&
    y < FLOOR_Y - 38;

  const safeAngle =
    isLongCoursePlatform && Math.abs(suppliedAngle) < 0.035
      ? (x < WIDTH / 2 ? 1 : -1) * (0.055 + Math.random() * 0.035)
      : suppliedAngle;

  return Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    friction: 0.1,
    restitution: 0.76,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#d7dbe4",
      strokeStyle: "#111827",
      lineWidth: 2,
    },
    ...options,
    angle: safeAngle,
  }) as ObstacleBody;
}

function makeRedReset(x: number, y: number, width: number, height: number) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    isSensor: true,
    collisionFilter: {
      category: CATEGORY_SENSOR,
      mask: CATEGORY_MARBLE,
    },
    render: {
      fillStyle: "#ef4444",
      strokeStyle: "#7f1d1d",
      lineWidth: 2,
    },
  }) as ObstacleBody;
  body.plugin = { obstacleKind: "red-reset" };
  return body;
}

function makeGreenFinish(x: number, y: number, width: number, height: number) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    isSensor: true,
    collisionFilter: {
      category: CATEGORY_SENSOR,
      mask: CATEGORY_MARBLE,
    },
    render: {
      fillStyle: "#22c55e",
      strokeStyle: "#14532d",
      lineWidth: 3,
    },
  }) as ObstacleBody;
  body.plugin = { obstacleKind: "green-finish" };
  return body;
}

function makeSpinner(x: number, y: number, length: number, speed: number) {
  const body = Bodies.rectangle(x, y, length, 17, {
    isStatic: true,
    friction: 0,
    restitution: 1,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#fbbf24",
      strokeStyle: "#713f12",
      lineWidth: 2,
    },
  }) as ObstacleBody;
  body.plugin = { obstacleKind: "stage", rotateSpeed: speed };
  return body;
}

function makePeg(x: number, y: number, radius = 11) {
  return Bodies.circle(x, y, radius, {
    isStatic: true,
    restitution: 1.08,
    friction: 0,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#8b5cf6",
      strokeStyle: "#312e81",
      lineWidth: 2,
    },
  }) as ObstacleBody;
}

function makeBumper(x: number, y: number, radius = 26) {
  const body = Bodies.circle(x, y, radius, {
    isStatic: true,
    friction: 0,
    restitution: 1.35,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#ec4899",
      strokeStyle: "#831843",
      lineWidth: 4,
    },
  }) as ObstacleBody;
  body.plugin = { obstacleKind: "stage" };
  return body;
}

function makeHammer(x: number, y: number, length = 260, speed = 0.045) {
  const arm = Bodies.rectangle(x, y, length, 22, {
    isStatic: true,
    friction: 0,
    restitution: 1.08,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#fb7185",
      strokeStyle: "#881337",
      lineWidth: 3,
    },
  }) as ObstacleBody;
  arm.plugin = { obstacleKind: "stage", rotateSpeed: speed };
  return arm;
}

function makeFunnel(
  centerX: number,
  topY: number,
  topWidth = 760,
  bottomWidth = 170,
  height = 190,
) {
  const leftX = centerX - (topWidth + bottomWidth) / 4;
  const rightX = centerX + (topWidth + bottomWidth) / 4;
  const angle = Math.atan2(height, (topWidth - bottomWidth) / 2);
  const wallLength = Math.hypot(height, (topWidth - bottomWidth) / 2);

  return [
    makeWall(leftX, topY + height / 2, wallLength, 22, {
      angle: angle,
      render: { fillStyle: "#38bdf8", strokeStyle: "#0c4a6e", lineWidth: 3 },
    }),
    makeWall(rightX, topY + height / 2, wallLength, 22, {
      angle: -angle,
      render: { fillStyle: "#38bdf8", strokeStyle: "#0c4a6e", lineWidth: 3 },
    }),
  ];
}


function makeRotatingCross(
  x: number,
  y: number,
  length = 260,
  speed = 0.04,
) {
  const horizontal = makeSpinner(x, y, length, speed);
  const vertical = makeSpinner(x, y, length, speed);
  Body.setAngle(vertical, Math.PI / 2);
  horizontal.render.fillStyle = "#a78bfa";
  horizontal.render.strokeStyle = "#4c1d95";
  vertical.render.fillStyle = "#a78bfa";
  vertical.render.strokeStyle = "#4c1d95";
  return [horizontal, vertical];
}

function makeZigZagWalls() {
  return [
    makeWall(275, 325, 430, 20, {
      angle: 0.12,
      render: { fillStyle: "#34d399", strokeStyle: "#064e3b", lineWidth: 3 },
    }),
    makeWall(825, 415, 430, 20, {
      angle: -0.12,
      render: { fillStyle: "#34d399", strokeStyle: "#064e3b", lineWidth: 3 },
    }),
    makeWall(275, 505, 430, 20, {
      angle: 0.12,
      render: { fillStyle: "#34d399", strokeStyle: "#064e3b", lineWidth: 3 },
    }),
    makeWall(825, 595, 430, 20, {
      angle: -0.12,
      render: { fillStyle: "#34d399", strokeStyle: "#064e3b", lineWidth: 3 },
    }),
  ];
}

function makeSplitPath() {
  return [
    makeWall(550, 365, 26, 220, {
      angle: 0.45,
      render: { fillStyle: "#fb923c", strokeStyle: "#7c2d12", lineWidth: 3 },
    }),
    makeWall(550, 365, 26, 220, {
      angle: -0.45,
      render: { fillStyle: "#fb923c", strokeStyle: "#7c2d12", lineWidth: 3 },
    }),
    makeWall(360, 510, 300, 20, {
      angle: -0.1,
      render: { fillStyle: "#fb923c", strokeStyle: "#7c2d12", lineWidth: 3 },
    }),
    makeWall(740, 510, 300, 20, {
      angle: 0.1,
      render: { fillStyle: "#fb923c", strokeStyle: "#7c2d12", lineWidth: 3 },
    }),
  ];
}


function makeDiamondMaze() {
  const pieces: ObstacleBody[] = [];
  const centers = [
    [300, 370],
    [550, 450],
    [800, 370],
  ];

  centers.forEach(([x, y], index) => {
    const size = index === 1 ? 170 : 145;
    pieces.push(
      makeWall(x, y - size / 2, size, 18, {
        angle: Math.PI / 4,
        render: { fillStyle: "#22d3ee", strokeStyle: "#164e63", lineWidth: 3 },
      }),
      makeWall(x + size / 2, y, size, 18, {
        angle: -Math.PI / 4,
        render: { fillStyle: "#22d3ee", strokeStyle: "#164e63", lineWidth: 3 },
      }),
      makeWall(x, y + size / 2, size, 18, {
        angle: Math.PI / 4,
        render: { fillStyle: "#22d3ee", strokeStyle: "#164e63", lineWidth: 3 },
      }),
      makeWall(x - size / 2, y, size, 18, {
        angle: -Math.PI / 4,
        render: { fillStyle: "#22d3ee", strokeStyle: "#164e63", lineWidth: 3 },
      }),
    );
  });

  return pieces;
}

function makeSpinnerTunnel() {
  return [
    makeWall(155, 380, 250, 18, {
      angle: 0.12,
      render: { fillStyle: "#fde047", strokeStyle: "#713f12", lineWidth: 3 },
    }),
    makeWall(945, 380, 250, 18, {
      angle: -0.12,
      render: { fillStyle: "#fde047", strokeStyle: "#713f12", lineWidth: 3 },
    }),
    makeSpinner(280, 430, 190, 0.065),
    makeSpinner(550, 500, 230, -0.058),
    makeSpinner(820, 430, 190, 0.065),
    makeWall(250, 595, 300, 18, {
      angle: 0.14,
      render: { fillStyle: "#fde047", strokeStyle: "#713f12", lineWidth: 3 },
    }),
    makeWall(850, 595, 300, 18, {
      angle: -0.14,
      render: { fillStyle: "#fde047", strokeStyle: "#713f12", lineWidth: 3 },
    }),
  ];
}

function makeStageLayout(round: number) {
  const bodies: ObstacleBody[] = [];

  // Outer side walls and permanent floor.
  bodies.push(makeWall(18, HEIGHT / 2, 36, HEIGHT));
  bodies.push(makeWall(WIDTH - 18, HEIGHT / 2, 36, HEIGHT));
  bodies.push(
    makeWall(WIDTH / 2, FLOOR_Y + 22, WIDTH, 44, {
      render: { fillStyle: "#111827" },
    }),
  );

  // Starting chamber side walls and removable gate.
  bodies.push(
    makeWall(START_X - 16, START_Y + START_HEIGHT / 2, 32, START_HEIGHT),
  );
  bodies.push(
    makeWall(
      START_X + START_WIDTH + 16,
      START_Y + START_HEIGHT / 2,
      32,
      START_HEIGHT,
    ),
  );

  const gate = makeWall(
    START_X + START_WIDTH / 2,
    START_Y + START_HEIGHT,
    START_WIDTH + 32,
    24,
    { render: { fillStyle: "#3b82f6", strokeStyle: "#172554", lineWidth: 3 } },
  );
  gate.label = "start-gate";
  bodies.push(gate);

  // Every round chooses a random stage family. Immediate repeats are prevented.\n  // Courses may contain several green exits and several red reset hazards.
  const variant = getRandomStageVariant();

  if (variant === 0) {
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const offset = row % 2 ? 48 : 0;
        bodies.push(makePeg(145 + col * 115 + offset, 285 + row * 72));
      }
    }
    bodies.push(makeSpinner(285, 590, 210, 0.035));
    bodies.push(makeSpinner(815, 590, 210, -0.04));
    bodies.push(makeRedReset(365, 575, 105, 24));
    bodies.push(makeRedReset(735, 575, 105, 24));
    bodies.push(makeGreenFinish(305, 690, 170, 42));
    bodies.push(makeGreenFinish(550, 690, 150, 42));
    bodies.push(makeGreenFinish(795, 690, 170, 42));
  } else if (variant === 1) {
    bodies.push(makeWall(250, 345, 380, 24, { angle: 0.18 }));
    bodies.push(makeWall(850, 345, 380, 24, { angle: -0.18 }));
    bodies.push(makeSpinner(550, 430, 300, 0.045));
    bodies.push(makeSpinner(310, 565, 210, -0.055));
    bodies.push(makeSpinner(790, 565, 210, 0.055));
    bodies.push(makeRedReset(300, 535, 125, 24));
    bodies.push(makeRedReset(800, 535, 125, 24));
    bodies.push(makeGreenFinish(380, 690, 190, 42));
    bodies.push(makeGreenFinish(720, 690, 190, 42));
  } else if (variant === 2) {
    bodies.push(makeWall(195, 335, 300, 22, { angle: 0.35 }));
    bodies.push(makeWall(905, 335, 300, 22, { angle: -0.35 }));
    bodies.push(makeWall(410, 475, 290, 20, { angle: -0.3 }));
    bodies.push(makeWall(690, 475, 290, 20, { angle: 0.3 }));
    for (let i = 0; i < 8; i += 1) {
      bodies.push(makePeg(165 + i * 110, 590 + (i % 2) * 28, 14));
    }
    bodies.push(makeRedReset(180, 650, 150, 26));
    bodies.push(makeRedReset(550, 615, 120, 24));
    bodies.push(makeRedReset(920, 650, 150, 26));
    bodies.push(makeGreenFinish(350, 690, 170, 42));
    bodies.push(makeGreenFinish(750, 690, 170, 42));
  } else if (variant === 3) {
    bodies.push(makeSpinner(250, 330, 250, 0.06));
    bodies.push(makeSpinner(550, 410, 330, -0.045));
    bodies.push(makeSpinner(850, 330, 250, 0.06));
    bodies.push(makeWall(250, 535, 330, 22, { angle: -0.22 }));
    bodies.push(makeWall(850, 535, 330, 22, { angle: 0.22 }));
    bodies.push(makeRedReset(270, 605, 120, 24));
    bodies.push(makeRedReset(550, 585, 110, 24));
    bodies.push(makeRedReset(830, 605, 120, 24));
    bodies.push(makeGreenFinish(230, 690, 150, 42));
    bodies.push(makeGreenFinish(550, 690, 150, 42));
    bodies.push(makeGreenFinish(870, 690, 150, 42));
  } else if (variant === 4) {
    // PINBALL BUMPER FIELD: large high-bounce bumpers create pileups and ricochets.
    const bumperPositions = [
      [220, 330],
      [430, 320],
      [670, 320],
      [880, 330],
      [320, 455],
      [550, 440],
      [780, 455],
      [220, 575],
      [430, 565],
      [670, 565],
      [880, 575],
    ];
    bumperPositions.forEach(([x, y], index) =>
      bodies.push(makeBumper(x, y, index === 5 ? 34 : 26)),
    );
    bodies.push(makeWall(175, 635, 280, 20, { angle: 0.17 }));
    bodies.push(makeWall(925, 635, 280, 20, { angle: -0.17 }));
    bodies.push(makeRedReset(350, 620, 105, 24));
    bodies.push(makeRedReset(750, 620, 105, 24));
    bodies.push(makeGreenFinish(235, 690, 150, 42));
    bodies.push(makeGreenFinish(550, 690, 175, 42));
    bodies.push(makeGreenFinish(865, 690, 150, 42));
  } else if (variant === 5) {
    // HAMMER GAUNTLET: three offset rotating hammer arms sweep across the lanes.
    bodies.push(makeWall(170, 300, 250, 20, { angle: 0.16 }));
    bodies.push(makeWall(930, 300, 250, 20, { angle: -0.16 }));
    bodies.push(makeHammer(300, 390, 300, 0.05));
    bodies.push(makeHammer(550, 485, 350, -0.042));
    bodies.push(makeHammer(800, 390, 300, 0.055));
    bodies.push(makePeg(550, 350, 18));
    bodies.push(makeRedReset(160, 610, 150, 26));
    bodies.push(makeRedReset(550, 600, 115, 24));
    bodies.push(makeRedReset(940, 610, 150, 26));
    bodies.push(makeGreenFinish(355, 690, 175, 42));
    bodies.push(makeGreenFinish(745, 690, 175, 42));
  } else if (variant === 6) {
    // FUNNEL DROP: two broad funnels compress the pack before a final spinner.
    bodies.push(...makeFunnel(550, 270, 880, 190, 175));
    bodies.push(makeBumper(430, 475, 24));
    bodies.push(makeBumper(670, 475, 24));
    bodies.push(makeSpinner(550, 555, 300, round % 2 === 0 ? 0.048 : -0.048));
    bodies.push(makeWall(235, 625, 330, 22, { angle: 0.16 }));
    bodies.push(makeWall(865, 625, 330, 22, { angle: -0.16 }));
    bodies.push(makeRedReset(430, 620, 90, 24));
    bodies.push(makeRedReset(670, 620, 90, 24));
    bodies.push(makeGreenFinish(250, 690, 160, 42));
    bodies.push(makeGreenFinish(550, 690, 145, 42));
    bodies.push(makeGreenFinish(850, 690, 160, 42));
  } else if (variant === 7) {
    // DOUBLE ROTATING CROSS: two large crosses sweep opposite directions.
    bodies.push(...makeRotatingCross(330, 400, 280, 0.038));
    bodies.push(...makeRotatingCross(770, 400, 280, -0.043));
    bodies.push(makeBumper(550, 535, 36));
    bodies.push(makeWall(250, 620, 330, 20, { angle: 0.16 }));
    bodies.push(makeWall(850, 620, 330, 20, { angle: -0.16 }));
    bodies.push(makeRedReset(290, 610, 105, 24));
    bodies.push(makeRedReset(550, 575, 105, 24));
    bodies.push(makeRedReset(810, 610, 105, 24));
    bodies.push(makeGreenFinish(360, 690, 180, 42));
    bodies.push(makeGreenFinish(740, 690, 180, 42));
  } else if (variant === 8) {
    // ZIG-ZAG RUN: alternating shelves create traffic jams and sudden drops.
    bodies.push(...makeZigZagWalls());
    bodies.push(makeBumper(180, 405, 22));
    bodies.push(makeBumper(920, 495, 22));
    bodies.push(makeSpinner(550, 635, 240, 0.05));
    bodies.push(makeRedReset(165, 645, 140, 24));
    bodies.push(makeRedReset(935, 645, 140, 24));
    bodies.push(makeGreenFinish(325, 690, 175, 42));
    bodies.push(makeGreenFinish(550, 690, 145, 42));
    bodies.push(makeGreenFinish(775, 690, 175, 42));
  } else if (variant === 9) {
    // SPLIT PATH: marbles divide left and right, then collide again near the finish.
    bodies.push(...makeSplitPath());
    bodies.push(makeSpinner(330, 565, 190, 0.052));
    bodies.push(makeSpinner(770, 565, 190, -0.052));
    bodies.push(makeRedReset(550, 555, 115, 24));
    bodies.push(makeRedReset(245, 625, 95, 24));
    bodies.push(makeRedReset(855, 625, 95, 24));
    bodies.push(makeGreenFinish(305, 690, 180, 42));
    bodies.push(makeGreenFinish(795, 690, 180, 42));
  } else if (variant === 10) {
    // BUMPER CHUTE: dense staggered bumpers make a fast, chaotic pinball descent.
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        const offset = row % 2 === 0 ? 0 : 75;
        bodies.push(makeBumper(175 + col * 150 + offset, 315 + row * 88, row === 2 ? 22 : 25));
      }
    }
    bodies.push(makeRotatingCross(550, 635, 210, -0.055)[0]);
    bodies.push(makeRedReset(165, 650, 135, 24));
    bodies.push(makeRedReset(550, 620, 105, 24));
    bodies.push(makeRedReset(935, 650, 135, 24));
    bodies.push(makeGreenFinish(280, 690, 155, 42));
    bodies.push(makeGreenFinish(550, 690, 145, 42));
    bodies.push(makeGreenFinish(820, 690, 155, 42));
  } else if (variant === 11) {
    // DIAMOND MAZE: three open diamonds redirect the pack into several crossing lanes.
    bodies.push(...makeDiamondMaze());
    bodies.push(makeBumper(550, 330, 25));
    bodies.push(makeSpinner(550, 610, 230, 0.052));
    bodies.push(makeRedReset(165, 650, 130, 24));
    bodies.push(makeRedReset(430, 620, 95, 24));
    bodies.push(makeRedReset(670, 620, 95, 24));
    bodies.push(makeRedReset(935, 650, 130, 24));
    bodies.push(makeGreenFinish(350, 690, 170, 42));
    bodies.push(makeGreenFinish(750, 690, 170, 42));
  } else {
    // SPINNER TUNNEL: alternating slopes and fast rotors create repeated pileups.
    bodies.push(...makeSpinnerTunnel());
    bodies.push(makeBumper(550, 355, 30));
    bodies.push(makeRedReset(300, 620, 105, 24));
    bodies.push(makeRedReset(550, 600, 100, 24));
    bodies.push(makeRedReset(800, 620, 105, 24));
    bodies.push(makeGreenFinish(235, 690, 145, 42));
    bodies.push(makeGreenFinish(550, 690, 155, 42));
    bodies.push(makeGreenFinish(865, 690, 145, 42));
  }

  return bodies;
}

export default function MarbleRace({
  contestants,
  onSeasonFinished,
}: MarbleRaceProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const renderRef = useRef<Render | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const marbleRefs = useRef<Map<number, MarbleMeta>>(new Map());
  const remainingRef = useRef<MarbleContestant[]>([]);
  const qualifiersRef = useRef<Set<string>>(new Set());
  const eliminatedRef = useRef<MarbleContestant[]>([]);
  const roundStartedRef = useRef(false);
  const roundResolvingRef = useRef(false);
  const gateRef = useRef<Matter.Body | null>(null);
  const hoverRef = useRef<MarbleMeta | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const movementRef = useRef<Map<number, { x: number; y: number; lastMovedAt: number }>>(
    new Map(),
  );
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [remaining, setRemaining] = useState<MarbleContestant[]>(contestants);
  const [eliminated, setEliminated] = useState<MarbleContestant[]>([]);
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [winner, setWinner] = useState<MarbleContestant | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);

  const placementNumber = remaining.length;

  const destroyWorld = useCallback(() => {
    if (renderRef.current) {
      Render.stop(renderRef.current);
      renderRef.current.canvas.remove();
      renderRef.current.textures = {};
    }
    if (runnerRef.current) Runner.stop(runnerRef.current);
    if (engineRef.current) {
      World.clear(engineRef.current.world, false);
      Engine.clear(engineRef.current);
    }

    renderRef.current = null;
    runnerRef.current = null;
    engineRef.current = null;
    marbleRefs.current.clear();
    movementRef.current.clear();
    gateRef.current = null;
    hoverRef.current = null;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const resetMarbleToStart = useCallback((body: Matter.Body, index: number) => {
    const columns = Math.max(
      5,
      Math.floor(START_WIDTH / (MARBLE_RADIUS * 2.35)),
    );
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = START_X + 45 + col * (MARBLE_RADIUS * 2.25);
    const y = START_Y + 38 + row * (MARBLE_RADIUS * 2.15);

    Body.setPosition(body, {
      x: Math.min(x, START_X + START_WIDTH - 45),
      y: Math.min(y, START_Y + START_HEIGHT - 35),
    });
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 5,
      y: (Math.random() - 0.5) * 2,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
  }, []);

  const buildRound = useCallback(
    (roundContestants: MarbleContestant[], roundNumber: number) => {
      if (!sceneRef.current || roundContestants.length < 1) return;
      destroyWorld();

      qualifiersRef.current.clear();
      roundStartedRef.current = false;
      roundResolvingRef.current = false;
      setStarted(false);
      setPaused(false);
      setQualifiedCount(0);
      setAnnouncement(null);

      const engine = Engine.create({
        gravity: { x: 0, y: 1.05, scale: 0.001 },
      });
      engine.positionIterations = 10;
      engine.velocityIterations = 8;
      engine.constraintIterations = 4;
      engineRef.current = engine;
      engine.timing.timeScale = speed;

      const render = Render.create({
        element: sceneRef.current,
        engine,
        options: {
          width: WIDTH,
          height: HEIGHT,
          wireframes: false,
          background: "#f8fafc",
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        },
      });
      renderRef.current = render;

      const stageBodies = makeStageLayout(roundNumber);
      gateRef.current =
        stageBodies.find((body) => body.label === "start-gate") ?? null;
      Composite.add(engine.world, stageBodies);

      const ordered = shuffled(roundContestants);
      const marbleMap = new Map<number, MarbleMeta>();

      ordered.forEach((contestant, index) => {
        const columns = Math.max(
          5,
          Math.floor(START_WIDTH / (MARBLE_RADIUS * 2.35)),
        );
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = START_X + 45 + col * (MARBLE_RADIUS * 2.25);
        const y = START_Y + 38 + row * (MARBLE_RADIUS * 2.15);

        const marble = Bodies.circle(x, y, MARBLE_RADIUS, {
          restitution: 0.86,
          friction: 0.016,
          frictionAir: 0.005,
          density: 0.004,
          collisionFilter: {
            category: CATEGORY_MARBLE,
            mask: CATEGORY_MARBLE | CATEGORY_STAGE | CATEGORY_SENSOR,
          },
          render: {
            fillStyle: "#dbeafe",
            strokeStyle: "#111827",
            lineWidth: 3,
          },
        });
        marble.label = `marble:${contestant.id}`;
        Composite.add(engine.world, marble);
        marbleMap.set(marble.id, {
          contestant,
          body: marble,
          textureUrl: contestant.imageUrl,
        });

        if (
          contestant.imageUrl &&
          !imageCacheRef.current.has(contestant.imageUrl)
        ) {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.src = contestant.imageUrl;
          imageCacheRef.current.set(contestant.imageUrl, image);
        }
      });

      marbleRefs.current = marbleMap;
      movementRef.current = new Map(
        [...marbleMap.values()].map((meta) => [
          meta.body.id,
          {
            x: meta.body.position.x,
            y: meta.body.position.y,
            lastMovedAt: Date.now(),
          },
        ]),
      );

      // Invisible mouse constraint is used only for accurate hover coordinates.
      const mouse = Mouse.create(render.canvas);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0, render: { visible: false } },
      });
      Composite.add(engine.world, mouseConstraint);

      Events.on(engine, "beforeUpdate", () => {
        for (const body of Composite.allBodies(
          engine.world,
        ) as ObstacleBody[]) {
          const rotateSpeed = body.plugin?.rotateSpeed;
          if (rotateSpeed) Body.setAngle(body, body.angle + rotateSpeed);
        }

        if (roundStartedRef.current && !roundResolvingRef.current) {
          const now = Date.now();

          for (const meta of marbleRefs.current.values()) {
            if (qualifiersRef.current.has(meta.contestant.id)) continue;

            const tracking = movementRef.current.get(meta.body.id);
            if (!tracking) continue;

            const dx = meta.body.position.x - tracking.x;
            const dy = meta.body.position.y - tracking.y;
            const moved = Math.hypot(dx, dy);

            if (moved > 18 || meta.body.speed > 1.1) {
              tracking.x = meta.body.position.x;
              tracking.y = meta.body.position.y;
              tracking.lastMovedAt = now;
            } else if (now - tracking.lastMovedAt > 4200) {
              Body.applyForce(meta.body, meta.body.position, {
                x: (Math.random() - 0.5) * 0.012,
                y: -0.008 - Math.random() * 0.006,
              });
              Body.setAngularVelocity(meta.body, (Math.random() - 0.5) * 0.45);
              tracking.lastMovedAt = now;
            }

            if (
              meta.body.position.y > HEIGHT + 80 ||
              meta.body.position.x < -80 ||
              meta.body.position.x > WIDTH + 80
            ) {
              const activeIndex = [...marbleRefs.current.values()].findIndex(
                (entry) => entry.body.id === meta.body.id,
              );
              resetMarbleToStart(meta.body, Math.max(activeIndex, 0));
              tracking.lastMovedAt = now;
            }
          }
        }

        if (!roundStartedRef.current) {
          let index = 0;
          for (const meta of marbleRefs.current.values()) {
            if (qualifiersRef.current.has(meta.contestant.id)) continue;
            Body.applyForce(meta.body, meta.body.position, {
              x: (Math.random() - 0.5) * 0.0009,
              y: (Math.random() - 0.5) * 0.00035,
            });
            if (meta.body.position.y > START_Y + START_HEIGHT - 20) {
              resetMarbleToStart(meta.body, index);
            }
            index += 1;
          }
        }
      });

      Events.on(engine, "collisionStart", (event) => {
        for (const pair of event.pairs) {
          const bodies = [
            pair.bodyA as ObstacleBody,
            pair.bodyB as ObstacleBody,
          ];
          const marbleBody = bodies.find((body) =>
            body.label.startsWith("marble:"),
          );
          const sensorBody = bodies.find(
            (body) =>
              body.plugin?.obstacleKind === "red-reset" ||
              body.plugin?.obstacleKind === "green-finish",
          );

          if (!marbleBody || !sensorBody || !roundStartedRef.current) continue;
          const meta = marbleRefs.current.get(marbleBody.id);
          if (!meta || qualifiersRef.current.has(meta.contestant.id)) continue;

          if (sensorBody.plugin.obstacleKind === "red-reset") {
            const activeIndex = [...marbleRefs.current.values()].findIndex(
              (entry) => entry.body.id === marbleBody.id,
            );
            resetMarbleToStart(marbleBody, Math.max(activeIndex, 0));
          }

          if (sensorBody.plugin.obstacleKind === "green-finish") {
            qualifiersRef.current.add(meta.contestant.id);
            setQualifiedCount(qualifiersRef.current.size);
            Composite.remove(engine.world, marbleBody);

            const aliveCount = roundContestants.length;
            if (
              qualifiersRef.current.size === aliveCount - 1 &&
              !roundResolvingRef.current
            ) {
              roundResolvingRef.current = true;
              const loser = [...marbleRefs.current.values()].find(
                (entry) => !qualifiersRef.current.has(entry.contestant.id),
              );
              if (loser) {
                setTimeout(
                  () => resolveEliminationRef.current(loser.contestant),
                  700,
                );
              }
            }
          }
        }
      });

      Events.on(render, "afterRender", () => {
        const ctx = render.context;
        const bounds = render.bounds;
        const mousePosition = mouse.position;
        let hovered: MarbleMeta | null = null;

        for (const meta of marbleRefs.current.values()) {
          if (qualifiersRef.current.has(meta.contestant.id)) continue;
          const dx = mousePosition.x - meta.body.position.x;
          const dy = mousePosition.y - meta.body.position.y;
          if (dx * dx + dy * dy <= MARBLE_RADIUS * MARBLE_RADIUS) {
            hovered = meta;
            break;
          }
        }
        hoverRef.current = hovered;

        // Draw each contestant image inside a truly circular marble.
        for (const meta of marbleRefs.current.values()) {
          if (qualifiersRef.current.has(meta.contestant.id)) continue;

          const { x, y } = meta.body.position;
          const image = imageCacheRef.current.get(meta.textureUrl);

          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, MARBLE_RADIUS - 2, 0, Math.PI * 2);
          ctx.clip();

          if (image?.complete && image.naturalWidth > 0) {
            const sourceSize = Math.min(
              image.naturalWidth,
              image.naturalHeight,
            );
            const sourceX = (image.naturalWidth - sourceSize) / 2;
            const sourceY = (image.naturalHeight - sourceSize) / 2;

            ctx.drawImage(
              image,
              sourceX,
              sourceY,
              sourceSize,
              sourceSize,
              x - MARBLE_RADIUS,
              y - MARBLE_RADIUS,
              MARBLE_RADIUS * 2,
              MARBLE_RADIUS * 2,
            );
          } else {
            ctx.fillStyle = "#dbeafe";
            ctx.fillRect(
              x - MARBLE_RADIUS,
              y - MARBLE_RADIUS,
              MARBLE_RADIUS * 2,
              MARBLE_RADIUS * 2,
            );
          }

          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, MARBLE_RADIUS, 0, Math.PI * 2);
          ctx.strokeStyle = "#111827";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        if (hovered) {
          const label = safeName(hovered.contestant.name);
          ctx.save();
          ctx.font = "700 16px system-ui, sans-serif";
          const width = ctx.measureText(label).width + 22;
          const x = Math.max(
            8,
            Math.min(WIDTH - width - 8, hovered.body.position.x - width / 2),
          );
          const y = hovered.body.position.y - MARBLE_RADIUS - 40;
          ctx.fillStyle = "rgba(17,24,39,.94)";
          ctx.beginPath();
          ctx.roundRect(x, y, width, 30, 8);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, x + width / 2, y + 15);
          ctx.restore();
        }
      });

      const runner = Runner.create();
      runnerRef.current = runner;
      Render.run(render);
      Runner.run(runner, engine);
    },
    [destroyWorld, resetMarbleToStart, speed],
  );

  const resolveElimination = useCallback(
    (loser: MarbleContestant) => {
      const engine = engineRef.current;
      if (!engine) return;

      // Remove every temporary stage object except the dark floor, then let the loser fall.
      for (const body of [
        ...Composite.allBodies(engine.world),
      ] as ObstacleBody[]) {
        const isLoser = body.label === `marble:${loser.id}`;
        const isFloor =
          body.isStatic &&
          body.position.y >= FLOOR_Y &&
          body.render.fillStyle === "#111827";
        if (!isLoser && !isFloor) Composite.remove(engine.world, body);
      }

      const loserMeta = [...marbleRefs.current.values()].find(
        (entry) => entry.contestant.id === loser.id,
      );
      if (loserMeta) {
        Body.setStatic(loserMeta.body, false);
        Body.setVelocity(loserMeta.body, { x: 0, y: 2 });
        Body.setAngularVelocity(loserMeta.body, 0.08);
      }

      const place = remainingRef.current.length;
      const message = `${loser.name} is eliminated, finishing in ${ordinal(place)} place.`;
      setAnnouncement(message);

      setTimeout(() => {
        const nextRemaining = remainingRef.current.filter(
          (contestant) => contestant.id !== loser.id,
        );
        const nextEliminated = [loser, ...eliminatedRef.current];
        eliminatedRef.current = nextEliminated;
        remainingRef.current = nextRemaining;
        setEliminated(nextEliminated);
        setRemaining(nextRemaining);

        if (nextRemaining.length === 1) {
          const seasonWinner = nextRemaining[0];
          setWinner(seasonWinner);
          setAnnouncement(`${seasonWinner.name} wins the Marble Race!`);
          onSeasonFinished?.(seasonWinner, [seasonWinner, ...nextEliminated]);
          return;
        }

        const nextRound = round + 1;
        setRound(nextRound);
        buildRound(nextRemaining, nextRound);
      }, 3200);
    },
    [buildRound, onSeasonFinished, round],
  );

  // Keep callback reachable inside Matter collision event without stale state.
  const resolveEliminationRef = useRef(resolveElimination);
  useEffect(() => {
    resolveEliminationRef.current = resolveElimination;
  }, [resolveElimination]);

  useEffect(() => {
    remainingRef.current = contestants;
    eliminatedRef.current = [];
    setRemaining(contestants);
    setEliminated([]);
    setRound(1);
    setWinner(null);
    if (contestants.length > 0) buildRound(contestants, 1);
    return destroyWorld;
  }, [contestants, buildRound, destroyWorld]);

  const releaseGate = () => {
    if (!engineRef.current || winner) return;

    roundStartedRef.current = true;
    setStarted(true);
    setCountdown(null);
    setAnnouncement(null);

    if (gateRef.current) {
      Composite.remove(engineRef.current.world, gateRef.current);
      gateRef.current = null;
    }

    for (const meta of marbleRefs.current.values()) {
      Body.setVelocity(meta.body, {
        x: (Math.random() - 0.5) * 3,
        y: 1 + Math.random() * 2,
      });
    }
  };

  const startRound = () => {
    if (!engineRef.current || started || winner || countdown !== null) return;

    let value = 3;
    setCountdown(value);

    countdownTimerRef.current = setInterval(() => {
      value -= 1;

      if (value > 0) {
        setCountdown(value);
        return;
      }

      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      setCountdown(0);
      setTimeout(releaseGate, 350);
    }, 700);
  };

  const togglePause = () => {
    if (!runnerRef.current || !engineRef.current || winner) return;
    if (paused) {
      Runner.run(runnerRef.current, engineRef.current);
      setPaused(false);
    } else {
      Runner.stop(runnerRef.current);
      setPaused(true);
    }
  };

  const changeSpeed = (nextSpeed: 1 | 2 | 4) => {
    setSpeed(nextSpeed);
    if (engineRef.current) {
      engineRef.current.timing.timeScale = nextSpeed;
    }
  };

  const restartSeason = () => {
    remainingRef.current = contestants;
    eliminatedRef.current = [];
    setRemaining(contestants);
    setEliminated([]);
    setRound(1);
    setWinner(null);
    setAnnouncement(null);
    buildRound(contestants, 1);
  };

  if (contestants.length < 2) {
    return (
      <div className={styles.emptyState}>
        Add and select at least two contestants to start Marble Race.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>SimulatorTV</p>
          <h1>Marble Race</h1>
          <p>
            Round {round} · {remaining.length} marble
            {remaining.length === 1 ? "" : "s"} remaining
          </p>
        </div>

        <div className={styles.controls}>
          {!started && !winner && (
            <button className={styles.startButton} onClick={startRound}>
              Start Round
            </button>
          )}
          <button onClick={togglePause} disabled={!!winner || countdown !== null}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button onClick={() => changeSpeed(1)} disabled={speed === 1}>
            1×
          </button>
          <button onClick={() => changeSpeed(2)} disabled={speed === 2}>
            2×
          </button>
          <button onClick={() => changeSpeed(4)} disabled={speed === 4}>
            4×
          </button>
          <button onClick={restartSeason}>Restart</button>
        </div>
      </div>

      <div className={styles.statusRow}>
        <strong>
          Qualified: {qualifiedCount}/{Math.max(remaining.length - 1, 0)}
        </strong>
        <span>
          {started
            ? "Last marble to reach green is eliminated."
            : "Marbles are shuffling inside the starting chamber."}
        </span>
      </div>

      <div className={styles.raceShell}>
        <div className={styles.canvas} ref={sceneRef} />
        {countdown !== null && (
          <div className={styles.pauseOverlay}>
            {countdown === 0 ? "GO!" : countdown}
          </div>
        )}
        {paused && <div className={styles.pauseOverlay}>PAUSED</div>}
        {announcement && (
          <div className={styles.announcement}>
            <div>{announcement}</div>
          </div>
        )}
      </div>

      <div className={styles.bottomGrid}>
        <section style={{ gridColumn: "1 / -1" }}>
          <h2>Placements</h2>
          <div className={styles.placements}>
            {winner && (
              <div className={styles.winnerRow}>
                <strong>1st</strong>
                <img src={winner.imageUrl} alt="" />
                <span>{winner.name}</span>
              </div>
            )}
            {eliminated.map((contestant, index) => {
              const place = contestants.length - index;
              return (
                <div key={contestant.id}>
                  <strong>{ordinal(place)}</strong>
                  <img src={contestant.imageUrl} alt="" />
                  <span>{contestant.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}