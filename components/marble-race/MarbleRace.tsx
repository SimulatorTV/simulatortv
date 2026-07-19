"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Matter, {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Mouse,
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
  image: HTMLImageElement | null;
};

type LevelId = "paddle-bowl" | "rising-resets" | "moving-bridge" | "plinko";

type LevelDefinition = {
  id: LevelId;
  name: string;
  description: string;
  build: () => ObstacleBody[];
};

type ObstacleBody = Matter.Body & {
  plugin: {
    kind?: "stage" | "red-reset" | "green-finish" | "floor";
    rotateSpeed?: number;
    moveAxis?: "x" | "y";
    moveOriginX?: number;
    moveOriginY?: number;
    moveAmplitude?: number;
    moveSpeed?: number;
    movePhase?: number;
    wrapVertical?: boolean;
    wrapMinY?: number;
    wrapMaxY?: number;
    wrapSpeed?: number;
  };
};

const WIDTH = 1100;
const HEIGHT = 820;
const FLOOR_Y = HEIGHT - 42;
const MARBLE_RADIUS = 24;
const START_X = 42;
const START_Y = 30;
const START_WIDTH = WIDTH - 84;
const START_HEIGHT = 190;
const CATEGORY_MARBLE = 0x0001;
const CATEGORY_STAGE = 0x0002;
const CATEGORY_SENSOR = 0x0004;

const buttonStyle: React.CSSProperties = {
  minWidth: 112,
  padding: "12px 18px",
  border: "2px solid #111827",
  borderRadius: 12,
  background: "linear-gradient(180deg, #475569 0%, #1e293b 100%)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 4px 0 #0f172a, 0 8px 18px rgba(0,0,0,.3)",
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)",
  color: "#052e16",
  boxShadow: "0 4px 0 #166534, 0 8px 18px rgba(0,0,0,.3)",
};

function ordinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

function shuffled<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeWall(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Matter.IChamferableBodyDefinition = {},
) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    friction: 0,
    frictionStatic: 0,
    restitution: 0.94,
    collisionFilter: {
      category: CATEGORY_STAGE,
      mask: CATEGORY_MARBLE | CATEGORY_STAGE,
    },
    render: {
      fillStyle: "#cbd5e1",
      strokeStyle: "#1e293b",
      lineWidth: 3,
    },
    ...options,
  }) as ObstacleBody;

  body.plugin = { ...body.plugin, kind: body.plugin?.kind || "stage" };
  return body;
}

function makeSpinner(
  x: number,
  y: number,
  length: number,
  speed: number,
  color = "#fbbf24",
) {
  const body = Bodies.rectangle(x, y, length, 18, {
    isStatic: true,
    friction: 0,
    restitution: 1.06,
    collisionFilter: { category: CATEGORY_STAGE, mask: CATEGORY_MARBLE },
    render: { fillStyle: color, strokeStyle: "#422006", lineWidth: 3 },
  }) as ObstacleBody;

  body.plugin = { kind: "stage", rotateSpeed: speed };
  return body;
}

function makePeg(x: number, y: number, radius = 10) {
  const body = Bodies.circle(x, y, radius, {
    isStatic: true,
    friction: 0,
    frictionStatic: 0,
    restitution: 1.08,
    collisionFilter: {
      category: CATEGORY_STAGE,
      mask: CATEGORY_MARBLE,
    },
    render: {
      fillStyle: "#8b5cf6",
      strokeStyle: "#312e81",
      lineWidth: 2,
    },
  }) as ObstacleBody;

  body.plugin = { kind: "stage" };
  return body;
}

function makeRedReset(x: number, y: number, width: number, height: number) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    isSensor: true,
    chamfer: { radius: Math.min(12, height / 2) },
    collisionFilter: { category: CATEGORY_SENSOR, mask: CATEGORY_MARBLE },
    render: { fillStyle: "#ef4444", strokeStyle: "#7f1d1d", lineWidth: 3 },
  }) as ObstacleBody;

  body.plugin = { kind: "red-reset" };
  return body;
}

function makeGreenFinish(x: number, y: number, width: number, height: number) {
  const body = Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    isSensor: true,
    chamfer: { radius: Math.min(14, height / 2) },
    collisionFilter: { category: CATEGORY_SENSOR, mask: CATEGORY_MARBLE },
    render: { fillStyle: "#22c55e", strokeStyle: "#14532d", lineWidth: 3 },
  }) as ObstacleBody;

  body.plugin = { kind: "green-finish" };
  return body;
}

function makeFullFloorZone(kind: "red-reset" | "green-finish") {
  const isGreen = kind === "green-finish";
  const body = Bodies.rectangle(WIDTH / 2, FLOOR_Y - 9, WIDTH - 72, 38, {
    isStatic: true,
    isSensor: true,
    collisionFilter: { category: CATEGORY_SENSOR, mask: CATEGORY_MARBLE },
    render: {
      fillStyle: isGreen ? "#22c55e" : "#ef4444",
      strokeStyle: isGreen ? "#14532d" : "#7f1d1d",
      lineWidth: 3,
    },
  }) as ObstacleBody;

  body.plugin = { kind };
  return body;
}

function makeResetBall(
  x: number,
  y: number,
  minY: number,
  maxY: number,
  speed: number,
) {
  const body = Bodies.circle(x, y, 29, {
    isStatic: true,
    isSensor: true,
    collisionFilter: { category: CATEGORY_SENSOR, mask: CATEGORY_MARBLE },
    render: { fillStyle: "#ef4444", strokeStyle: "#7f1d1d", lineWidth: 3 },
  }) as ObstacleBody;

  body.plugin = {
    kind: "red-reset",
    wrapVertical: true,
    wrapMinY: minY,
    wrapMaxY: maxY,
    wrapSpeed: speed,
  };

  return body;
}

function makeMovingWall(
  x: number,
  y: number,
  width: number,
  height: number,
  amplitude: number,
  speed: number,
) {
  const body = makeWall(x, y, width, height, {
    render: { fillStyle: "#94a3b8", strokeStyle: "#334155", lineWidth: 3 },
  });

  body.plugin = {
    kind: "stage",
    moveAxis: "x",
    moveOriginX: x,
    moveOriginY: y,
    moveAmplitude: amplitude,
    moveSpeed: speed,
    movePhase: 0,
  };

  return body;
}

function makeBaseStage() {
  const bodies: ObstacleBody[] = [];
  const leftWall = makeWall(18, HEIGHT / 2, 36, HEIGHT);
  const rightWall = makeWall(WIDTH - 18, HEIGHT / 2, 36, HEIGHT);
  const ceiling = makeWall(WIDTH / 2, 16, WIDTH, 32);
  const floor = makeWall(WIDTH / 2, FLOOR_Y + 22, WIDTH, 44, {
    render: { fillStyle: "#111827", strokeStyle: "#111827", lineWidth: 1 },
  });
  floor.plugin = { kind: "floor" };

  const gate = makeWall(WIDTH / 2, START_Y + START_HEIGHT, WIDTH - 72, 24, {
    render: { fillStyle: "#3b82f6", strokeStyle: "#172554", lineWidth: 3 },
  });
  gate.label = "start-gate";

  bodies.push(leftWall, rightWall, ceiling, floor, gate);
  return bodies;
}

function buildPaddleBowl() {
  const bodies = makeBaseStage();

  // Broad upper ramps leave a very wide central opening.
  bodies.push(
    makeWall(205, 335, 315, 20, { angle: 0.22 }),
    makeWall(895, 335, 315, 20, { angle: -0.22 }),
  );

  // Smaller paddles with generous spacing so marbles cannot become wedged.
  const paddleData = [
    { x: 245, y: 500, angle: -0.7, speed: 0.075 },
    { x: 440, y: 545, angle: 0.65, speed: -0.075 },
    { x: 660, y: 545, angle: -0.65, speed: 0.075 },
    { x: 855, y: 500, angle: 0.7, speed: -0.075 },
  ];

  paddleData.forEach(({ x, y, angle, speed }) => {
    const spinner = makeSpinner(x, y, 118, speed, "#a3a3a3");
    Body.setAngle(spinner, angle);
    bodies.push(spinner);
  });

  // Short low ramps accelerate marbles toward the full green floor.
  bodies.push(
    makeWall(165, 645, 210, 18, { angle: 0.16 }),
    makeWall(390, 670, 180, 18, { angle: -0.14 }),
    makeWall(710, 670, 180, 18, { angle: 0.14 }),
    makeWall(935, 645, 210, 18, { angle: -0.16 }),
    makeFullFloorZone("green-finish"),
  );

  return bodies;
}

function buildRisingResets() {
  const bodies = makeBaseStage();

  // Two separate side ramps create an open middle lane instead of a blocking X.
  bodies.push(
    makeWall(235, 390, 360, 26, { angle: 0.28 }),
    makeWall(865, 390, 360, 26, { angle: -0.28 }),
    makeWall(275, 585, 330, 24, { angle: 0.12 }),
    makeWall(825, 585, 330, 24, { angle: -0.12 }),
    makeWall(550, 510, 190, 22, { angle: 0.08 }),
    makeResetBall(385, 690, 500, 700, 2.0),
    makeResetBall(715, 570, 500, 700, 2.0),
    makeFullFloorZone("green-finish"),
  );

  return bodies;
}

function buildMovingBridge() {
  const bodies = makeBaseStage();
  bodies.push(
    makeWall(145, 385, 310, 42, { angle: 0.48 }),
    makeWall(955, 385, 310, 42, { angle: -0.48 }),
    makeWall(320, 650, 300, 38, { angle: -0.58 }),
    makeWall(780, 650, 300, 38, { angle: 0.58 }),
    makeWall(550, 455, 280, 24, {
      render: { fillStyle: "#9ca3af", strokeStyle: "#374151", lineWidth: 3 },
    }),
    makeWall(500, 430, 120, 24, {
      angle: -0.62,
      render: { fillStyle: "#9ca3af", strokeStyle: "#374151", lineWidth: 3 },
    }),
    makeWall(600, 430, 120, 24, {
      angle: 0.62,
      render: { fillStyle: "#9ca3af", strokeStyle: "#374151", lineWidth: 3 },
    }),
    makeMovingWall(550, 575, 255, 22, 205, 0.0032),
    makeGreenFinish(145, 745, 220, 42),
    makeRedReset(550, 730, 210, 42),
    makeGreenFinish(955, 745, 220, 42),
  );
  return bodies;
}

function buildPlinko() {
  const bodies = makeBaseStage();

  // Funnel the pack toward the peg field.
  bodies.push(
    makeWall(155, 295, 260, 20, { angle: 0.18 }),
    makeWall(945, 295, 260, 20, { angle: -0.18 }),
  );

  const pegStartY = 330;
  const rowGap = 68;
  const colGap = 82;
  const pegRows = 6;

  for (let row = 0; row < pegRows; row += 1) {
    const offset = row % 2 === 0 ? 0 : colGap / 2;
    const y = pegStartY + row * rowGap;

    for (let x = 95 + offset; x <= WIDTH - 95; x += colGap) {
      bodies.push(makePeg(x, y, 10));
    }
  }

  // Slots are slightly wider than a 48px marble.
  const innerLeft = 36;
  const innerRight = WIDTH - 36;
  const slotCount = 16;
  const slotWidth = (innerRight - innerLeft) / slotCount;
  const dividerTop = 686;
  const dividerHeight = FLOOR_Y - dividerTop + 18;

  for (let index = 0; index <= slotCount; index += 1) {
    const x = innerLeft + index * slotWidth;

    bodies.push(
      makeWall(x, dividerTop + dividerHeight / 2, 8, dividerHeight, {
        render: {
          fillStyle: "#64748b",
          strokeStyle: "#1e293b",
          lineWidth: 2,
        },
      }),
    );
  }

  for (let index = 0; index < slotCount; index += 1) {
    const centerX = innerLeft + slotWidth * index + slotWidth / 2;
    const zoneWidth = slotWidth - 9;
    const isGreen = index % 2 === 0;

    bodies.push(
      isGreen
        ? makeGreenFinish(centerX, FLOOR_Y - 9, zoneWidth, 38)
        : makeRedReset(centerX, FLOOR_Y - 9, zoneWidth, 38),
    );
  }

  return bodies;
}

const LEVELS: LevelDefinition[] = [
  {
    id: "paddle-bowl",
    name: "Paddle Bowl",
    description: "Four fast paddles feed a lower bowl with two green exits.",
    build: buildPaddleBowl,
  },
  {
    id: "rising-resets",
    name: "Rising Resets",
    description: "Two red reset balls circulate through a broad obstacle bowl.",
    build: buildRisingResets,
  },
  {
    id: "moving-bridge",
    name: "Moving Bridge",
    description:
      "A moving center bridge splits the course between three exits.",
    build: buildMovingBridge,
  },
  {
    id: "plinko",
    name: "Plinko",
    description:
      "Marbles bounce through a peg board into alternating red and green slots.",
    build: buildPlinko,
  },
];

function makeSpawnPositions(count: number) {
  const columns = Math.max(
    1,
    Math.floor((START_WIDTH - 80) / (MARBLE_RADIUS * 2 + 14)),
  );
  const positions: Array<{ x: number; y: number }> = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions.push({
      x: START_X + 55 + column * (MARBLE_RADIUS * 2 + 14),
      y: START_Y + 48 + row * (MARBLE_RADIUS * 2 + 12),
    });
  }

  return shuffled(positions);
}

export default function MarbleRace({
  contestants,
  onSeasonFinished,
}: MarbleRaceProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const renderRef = useRef<Render | null>(null);
  const runnerRef = useRef<Runner | null>(null);
  const marblesRef = useRef<Map<number, MarbleMeta>>(new Map());
  const gateRef = useRef<Matter.Body | null>(null);
  const remainingRef = useRef<MarbleContestant[]>(contestants);
  const eliminatedRef = useRef<MarbleContestant[]>([]);
  const qualifiedRef = useRef<Set<string>>(new Set());
  const roundStartedRef = useRef(false);
  const roundResolvingRef = useRef(false);
  const mountedRef = useRef(true);
  const levelQueueRef = useRef<LevelDefinition[]>([]);
  const lastLevelIdRef = useRef<LevelId | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rebuildFrameRef = useRef<number | null>(null);

  const [enabledLevelIds, setEnabledLevelIds] = useState<Set<LevelId>>(
    () => new Set(LEVELS.map((level) => level.id)),
  );
  const enabledLevelIdsRef = useRef(enabledLevelIds);
  const [remaining, setRemaining] = useState(contestants);
  const [eliminated, setEliminated] = useState<MarbleContestant[]>([]);
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [eliminationNotice, setEliminationNotice] = useState<string | null>(
    null,
  );
  const [winner, setWinner] = useState<MarbleContestant | null>(null);
  const [currentLevelName, setCurrentLevelName] = useState("");
  const [seasonStarted, setSeasonStarted] = useState(false);

  useEffect(() => {
    enabledLevelIdsRef.current = enabledLevelIds;
  }, [enabledLevelIds]);

  const clearTransitionWork = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (rebuildFrameRef.current !== null) {
      cancelAnimationFrame(rebuildFrameRef.current);
      rebuildFrameRef.current = null;
    }
  }, []);

  const destroyWorld = useCallback(() => {
    clearTransitionWork();
    const runner = runnerRef.current;
    const render = renderRef.current;
    const engine = engineRef.current;

    if (runner) Runner.stop(runner);
    if (render) Render.stop(render);
    if (engine) {
      World.clear(engine.world, false);
      Engine.clear(engine);
    }
    if (render) {
      render.textures = {};
      const canvas = render.canvas;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    engineRef.current = null;
    renderRef.current = null;
    runnerRef.current = null;
    gateRef.current = null;
    marblesRef.current.clear();
  }, [clearTransitionWork]);

  const refillLevelQueue = useCallback(() => {
    const enabled = LEVELS.filter((level) =>
      enabledLevelIdsRef.current.has(level.id),
    );
    if (!enabled.length) return [];

    const nextQueue = shuffled(enabled);
    if (
      nextQueue.length > 1 &&
      lastLevelIdRef.current &&
      nextQueue[0].id === lastLevelIdRef.current
    ) {
      [nextQueue[0], nextQueue[1]] = [nextQueue[1], nextQueue[0]];
    }

    levelQueueRef.current = nextQueue;
    return nextQueue;
  }, []);

  const takeNextLevel = useCallback(() => {
    if (!levelQueueRef.current.length) refillLevelQueue();
    const next = levelQueueRef.current.shift() || null;
    if (next) lastLevelIdRef.current = next.id;
    return next;
  }, [refillLevelQueue]);

  const resetMarble = useCallback((meta: MarbleMeta, index: number) => {
    const positions = makeSpawnPositions(
      Math.max(remainingRef.current.length, index + 1),
    );
    const position = positions[index] || { x: WIDTH / 2, y: START_Y + 60 };
    Body.setPosition(meta.body, position);
    Body.setVelocity(meta.body, {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 2,
    });
    Body.setAngularVelocity(meta.body, (Math.random() - 0.5) * 0.2);
  }, []);

  const resolveEliminationRef = useRef<(loser: MarbleContestant) => void>(
    () => {},
  );

  const buildRound = useCallback(
    (roundContestants: MarbleContestant[], roundNumber: number) => {
      if (!sceneRef.current || !roundContestants.length) return;
      destroyWorld();

      const level = takeNextLevel();
      if (!level) {
        setAnnouncement("Turn on at least one custom level.");
        return;
      }

      setCurrentLevelName(level.name);
      setStarted(false);
      setPaused(false);
      setQualifiedCount(0);
      setAnnouncement(null);
      setEliminationNotice(null);
      qualifiedRef.current.clear();
      roundStartedRef.current = false;
      roundResolvingRef.current = false;

      const engine = Engine.create({
        gravity: { x: 0, y: 1.18, scale: 0.001 },
      });
      engine.positionIterations = 10;
      engine.velocityIterations = 8;
      engine.constraintIterations = 4;

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
      const runner = Runner.create();

      engineRef.current = engine;
      renderRef.current = render;
      runnerRef.current = runner;

      const stageBodies = level.build();
      gateRef.current =
        stageBodies.find((body) => body.label === "start-gate") || null;
      Composite.add(engine.world, stageBodies);

      const positions = makeSpawnPositions(roundContestants.length);
      const marbleMap = new Map<number, MarbleMeta>();

      roundContestants.forEach((contestant, index) => {
        const position = positions[index];
        const marble = Bodies.circle(position.x, position.y, MARBLE_RADIUS, {
          restitution: 0.9,
          friction: 0,
          frictionStatic: 0,
          frictionAir: 0.0015,
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
        const image = contestant.imageUrl ? new Image() : null;
        if (image) {
          image.crossOrigin = "anonymous";
          image.src = contestant.imageUrl;
        }

        marbleMap.set(marble.id, { contestant, body: marble, image });
        Composite.add(engine.world, marble);
      });

      marblesRef.current = marbleMap;
      const mouse = Mouse.create(render.canvas);

      Events.on(engine, "beforeUpdate", () => {
        const timestamp = engine.timing.timestamp;

        for (const body of Composite.allBodies(
          engine.world,
        ) as ObstacleBody[]) {
          if (body.plugin?.rotateSpeed) {
            Body.setAngle(body, body.angle + body.plugin.rotateSpeed);
          }

          if (
            body.plugin?.moveAxis &&
            body.plugin.moveOriginX !== undefined &&
            body.plugin.moveOriginY !== undefined &&
            body.plugin.moveAmplitude !== undefined &&
            body.plugin.moveSpeed !== undefined
          ) {
            const offset =
              Math.sin(
                timestamp * body.plugin.moveSpeed +
                  (body.plugin.movePhase || 0),
              ) * body.plugin.moveAmplitude;

            Body.setPosition(body, {
              x:
                body.plugin.moveAxis === "x"
                  ? body.plugin.moveOriginX + offset
                  : body.plugin.moveOriginX,
              y:
                body.plugin.moveAxis === "y"
                  ? body.plugin.moveOriginY + offset
                  : body.plugin.moveOriginY,
            });
          }

          if (
            body.plugin?.wrapVertical &&
            body.plugin.wrapMinY !== undefined &&
            body.plugin.wrapMaxY !== undefined &&
            body.plugin.wrapSpeed !== undefined
          ) {
            let nextY = body.position.y - body.plugin.wrapSpeed;
            if (nextY < body.plugin.wrapMinY) nextY = body.plugin.wrapMaxY;
            Body.setPosition(body, { x: body.position.x, y: nextY });
          }
        }

        if (!roundStartedRef.current) {
          for (const meta of marblesRef.current.values()) {
            Body.applyForce(meta.body, meta.body.position, {
              x: (Math.random() - 0.5) * 0.0008,
              y: (Math.random() - 0.5) * 0.00025,
            });
          }
        } else {
          for (const meta of marblesRef.current.values()) {
            if (qualifiedRef.current.has(meta.contestant.id)) continue;

            // Small continuous downward force helps marbles accelerate on ramps
            // without making collisions look unnatural.
            Body.applyForce(meta.body, meta.body.position, {
              x: 0,
              y: 0.00014,
            });
          }
        }
      });

      Events.on(engine, "collisionStart", (event) => {
        for (const pair of event.pairs) {
          const bodyA = pair.bodyA as ObstacleBody;
          const bodyB = pair.bodyB as ObstacleBody;
          const marbleBody = [bodyA, bodyB].find((body) =>
            body.label.startsWith("marble:"),
          );
          const sensorBody = [bodyA, bodyB].find(
            (body) =>
              body.plugin?.kind === "red-reset" ||
              body.plugin?.kind === "green-finish",
          );

          if (
            !marbleBody ||
            !sensorBody ||
            !roundStartedRef.current ||
            roundResolvingRef.current
          ) {
            continue;
          }

          const meta = marblesRef.current.get(marbleBody.id);
          if (!meta || qualifiedRef.current.has(meta.contestant.id)) continue;

          if (sensorBody.plugin.kind === "red-reset") {
            const activeMetas = [...marblesRef.current.values()].filter(
              (item) => !qualifiedRef.current.has(item.contestant.id),
            );
            const index = activeMetas.findIndex(
              (item) => item.contestant.id === meta.contestant.id,
            );
            resetMarble(meta, Math.max(index, 0));
            continue;
          }

          if (sensorBody.plugin.kind === "green-finish") {
            qualifiedRef.current.add(meta.contestant.id);
            setQualifiedCount(qualifiedRef.current.size);
            Composite.remove(engine.world, marbleBody);

            if (
              qualifiedRef.current.size === roundContestants.length - 1 &&
              !roundResolvingRef.current
            ) {
              roundResolvingRef.current = true;
              const loser = [...marblesRef.current.values()].find(
                (item) => !qualifiedRef.current.has(item.contestant.id),
              );
              if (loser) {
                transitionTimerRef.current = setTimeout(() => {
                  resolveEliminationRef.current(loser.contestant);
                }, 650);
              }
            }
          }
        }
      });

      Events.on(render, "afterRender", () => {
        const context = render.context;
        const pointer = mouse.position;
        let hovered: MarbleMeta | null = null;

        for (const meta of marblesRef.current.values()) {
          if (qualifiedRef.current.has(meta.contestant.id)) continue;
          const x = meta.body.position.x;
          const y = meta.body.position.y;

          context.save();
          context.beginPath();
          context.arc(x, y, MARBLE_RADIUS - 2, 0, Math.PI * 2);
          context.clip();

          if (meta.image?.complete && meta.image.naturalWidth > 0) {
            const sourceSize = Math.min(
              meta.image.naturalWidth,
              meta.image.naturalHeight,
            );
            const sourceX = (meta.image.naturalWidth - sourceSize) / 2;
            const sourceY = (meta.image.naturalHeight - sourceSize) / 2;
            context.drawImage(
              meta.image,
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
            context.fillStyle = "#dbeafe";
            context.fillRect(
              x - MARBLE_RADIUS,
              y - MARBLE_RADIUS,
              MARBLE_RADIUS * 2,
              MARBLE_RADIUS * 2,
            );
          }
          context.restore();

          context.save();
          context.beginPath();
          context.arc(x, y, MARBLE_RADIUS, 0, Math.PI * 2);
          context.strokeStyle = "#111827";
          context.lineWidth = 3;
          context.stroke();
          context.restore();

          const deltaX = pointer.x - x;
          const deltaY = pointer.y - y;
          if (
            deltaX * deltaX + deltaY * deltaY <=
            MARBLE_RADIUS * MARBLE_RADIUS
          ) {
            hovered = meta;
          }
        }

        if (hovered) {
          const label = hovered.contestant.name;
          context.save();
          context.font = "700 16px system-ui, sans-serif";
          const labelWidth = context.measureText(label).width + 22;
          const x = Math.max(
            8,
            Math.min(
              WIDTH - labelWidth - 8,
              hovered.body.position.x - labelWidth / 2,
            ),
          );
          const y = hovered.body.position.y - MARBLE_RADIUS - 39;
          context.fillStyle = "rgba(17,24,39,.95)";
          context.beginPath();
          context.roundRect(x, y, labelWidth, 30, 8);
          context.fill();
          context.fillStyle = "#fff";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(label, x + labelWidth / 2, y + 15);
          context.restore();
        }
      });

      Render.run(render);
      Runner.run(runner, engine);
    },
    [destroyWorld, resetMarble, takeNextLevel],
  );

  const resolveElimination = useCallback(
    (loser: MarbleContestant) => {
      const engine = engineRef.current;
      if (!engine) return;

      for (const body of [
        ...Composite.allBodies(engine.world),
      ] as ObstacleBody[]) {
        const isLoser = body.label === `marble:${loser.id}`;
        const isFloor = body.plugin?.kind === "floor";
        if (!isLoser && !isFloor) Composite.remove(engine.world, body);
      }

      const loserMeta = [...marblesRef.current.values()].find(
        (meta) => meta.contestant.id === loser.id,
      );
      if (loserMeta) {
        Body.setStatic(loserMeta.body, false);
        Body.setVelocity(loserMeta.body, { x: 0, y: 3 });
        Body.setAngularVelocity(loserMeta.body, 0.08);
      }

      const place = remainingRef.current.length;
      const eliminationMessage = `${loser.name} is eliminated, finishing in ${ordinal(place)} place.`;
      setAnnouncement(eliminationMessage);
      setEliminationNotice(eliminationMessage);

      transitionTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        const nextRemaining = remainingRef.current.filter(
          (contestant) => contestant.id !== loser.id,
        );
        const nextEliminated = [loser, ...eliminatedRef.current];
        remainingRef.current = nextRemaining;
        eliminatedRef.current = nextEliminated;
        setRemaining(nextRemaining);
        setEliminated(nextEliminated);

        if (nextRemaining.length === 1) {
          const seasonWinner = nextRemaining[0];
          setWinner(seasonWinner);
          setEliminationNotice(null);
          setAnnouncement(`${seasonWinner.name} wins the Marble Race!`);
          onSeasonFinished?.(seasonWinner, [seasonWinner, ...nextEliminated]);
          return;
        }

        const nextRound = round + 1;
        setRound(nextRound);
        rebuildFrameRef.current = requestAnimationFrame(() => {
          rebuildFrameRef.current = null;
          if (!mountedRef.current) return;
          buildRound(nextRemaining, nextRound);
        });
      }, 3000);
    },
    [buildRound, onSeasonFinished, round],
  );

  useEffect(() => {
    resolveEliminationRef.current = resolveElimination;
  }, [resolveElimination]);

  const beginSeason = useCallback(() => {
    const enabled = LEVELS.filter((level) =>
      enabledLevelIdsRef.current.has(level.id),
    );
    if (!enabled.length) {
      setAnnouncement("Turn on at least one custom level.");
      return;
    }

    remainingRef.current = contestants;
    eliminatedRef.current = [];
    levelQueueRef.current = shuffled(enabled);
    lastLevelIdRef.current = null;
    setRemaining(contestants);
    setEliminated([]);
    setRound(1);
    setWinner(null);
    setAnnouncement(null);
    setEliminationNotice(null);
    setSeasonStarted(true);
    buildRound(contestants, 1);
  }, [buildRound, contestants]);

  const startRound = useCallback(() => {
    if (!engineRef.current || started || winner || !seasonStarted) return;
    roundStartedRef.current = true;
    setStarted(true);
    setAnnouncement(null);

    if (gateRef.current) {
      Composite.remove(engineRef.current.world, gateRef.current);
      gateRef.current = null;
    }

    for (const meta of marblesRef.current.values()) {
      Body.setVelocity(meta.body, {
        x: (Math.random() - 0.5) * 3,
        y: 1 + Math.random() * 2,
      });
    }
  }, [seasonStarted, started, winner]);

  const togglePause = useCallback(() => {
    if (!runnerRef.current || !engineRef.current || winner || !seasonStarted) {
      return;
    }

    if (paused) {
      Runner.run(runnerRef.current, engineRef.current);
      setPaused(false);
    } else {
      Runner.stop(runnerRef.current);
      setPaused(true);
    }
  }, [paused, seasonStarted, winner]);

  const restartSeason = useCallback(() => {
    destroyWorld();
    levelQueueRef.current = [];
    lastLevelIdRef.current = null;
    setSeasonStarted(false);
    setStarted(false);
    setPaused(false);
    setWinner(null);
    setAnnouncement(null);
    setEliminationNotice(null);
    setRound(1);
    setQualifiedCount(0);
    remainingRef.current = contestants;
    eliminatedRef.current = [];
    setRemaining(contestants);
    setEliminated([]);
  }, [contestants, destroyWorld]);

  useEffect(() => {
    mountedRef.current = true;
    remainingRef.current = contestants;
    eliminatedRef.current = [];
    setRemaining(contestants);
    setEliminated([]);

    return () => {
      mountedRef.current = false;
      destroyWorld();
    };
  }, [contestants, destroyWorld]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "BUTTON" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      if (!seasonStarted) beginSeason();
      else if (!started && !winner) startRound();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [beginSeason, seasonStarted, startRound, started, winner]);

  function toggleLevel(levelId: LevelId) {
    if (seasonStarted) return;
    setEnabledLevelIds((current) => {
      const next = new Set(current);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }

  if (contestants.length < 2) {
    return (
      <div className={styles.emptyState}>
        Add and select at least two contestants to start Marble Race.
      </div>
    );
  }

  if (winner) {
    const finalPlacements = [
      winner,
      ...eliminated,
    ];

    return (
      <div className={styles.page}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "24px 18px 40px",
          }}
        >
          <div
            style={{
              padding: 28,
              border: "4px solid #facc15",
              borderRadius: 24,
              background:
                "linear-gradient(180deg, #422006 0%, #111827 100%)",
              textAlign: "center",
              boxShadow: "0 18px 45px rgba(0,0,0,.4)",
            }}
          >
            <div
              style={{
                color: "#fde68a",
                fontSize: 18,
                fontWeight: 1000,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Marble Race Winner
            </div>

            <h1
              style={{
                margin: "10px 0 18px",
                color: "#ffffff",
                fontSize: "clamp(2.4rem, 6vw, 5rem)",
                fontWeight: 1000,
              }}
            >
              {winner.name}
            </h1>

            <div
              style={{
                width: 190,
                height: 190,
                margin: "0 auto 18px",
                overflow: "hidden",
                border: "8px solid #facc15",
                borderRadius: "999px",
                background: "#ffffff",
                boxShadow:
                  "0 0 0 8px rgba(250,204,21,.2), 0 16px 34px rgba(0,0,0,.45)",
              }}
            >
              <img
                src={winner.imageUrl}
                alt={winner.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <div
              style={{
                color: "#fef3c7",
                fontSize: 28,
                fontWeight: 1000,
              }}
            >
              1st Place
            </div>

            <button
              type="button"
              onClick={restartSeason}
              style={{
                ...primaryButtonStyle,
                marginTop: 24,
                minWidth: 180,
              }}
            >
              Play Again
            </button>
          </div>

          <section
            style={{
              marginTop: 22,
              padding: 20,
              border: "1px solid #334155",
              borderRadius: 18,
              background: "#111827",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#ffffff",
                textAlign: "center",
              }}
            >
              Final Placements
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
              }}
            >
              {finalPlacements.map((contestant, index) => (
                <div
                  key={contestant.id}
                  style={{
                    padding: 10,
                    border:
                      index === 0
                        ? "3px solid #facc15"
                        : "2px solid #475569",
                    borderRadius: 14,
                    background:
                      index === 0 ? "#713f12" : "#1e293b",
                    color: "#ffffff",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      margin: "0 auto 8px",
                      overflow: "hidden",
                      border:
                        index === 0
                          ? "4px solid #facc15"
                          : "3px solid #94a3b8",
                      borderRadius: "999px",
                      background: "#ffffff",
                    }}
                  >
                    <img
                      src={contestant.imageUrl}
                      alt={contestant.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: 18,
                    }}
                  >
                    {ordinal(index + 1)}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: 3,
                      overflow: "hidden",
                      fontWeight: 900,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contestant.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
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
          {currentLevelName && seasonStarted && (
            <p>Current level: {currentLevelName}</p>
          )}
        </div>

        <div className={styles.controls}>
          {!seasonStarted && (
            <button
              className={styles.startButton}
              style={primaryButtonStyle}
              onClick={beginSeason}
              disabled={enabledLevelIds.size === 0}
            >
              Load Season
            </button>
          )}

          {seasonStarted && !started && !winner && (
            <button
              className={styles.startButton}
              style={primaryButtonStyle}
              onClick={startRound}
            >
              Start Round
            </button>
          )}

          {seasonStarted && (
            <button
              style={buttonStyle}
              onClick={togglePause}
              disabled={!!winner}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}

          <button style={buttonStyle} onClick={restartSeason}>
            Reset
          </button>
        </div>
      </div>

      {!seasonStarted && (
        <section
          style={{
            maxWidth: 1180,
            margin: "0 auto 14px",
            padding: 16,
            border: "1px solid #334155",
            borderRadius: 18,
            background: "#111827",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Custom Levels</h2>
          <p style={{ color: "#cbd5e1" }}>
            Turn levels on or off. Enabled levels are shuffled into a new order
            for each season and reshuffled when all enabled levels have been
            used.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 12,
            }}
          >
            {LEVELS.map((level) => {
              const enabled = enabledLevelIds.has(level.id);
              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => toggleLevel(level.id)}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    minHeight: 116,
                    boxShadow: enabled
                      ? "0 5px 0 #052e16, 0 9px 20px rgba(0,0,0,.32)"
                      : "0 5px 0 #0f172a, 0 9px 20px rgba(0,0,0,.32)",
                    border: enabled ? "3px solid #22c55e" : "3px solid #475569",
                    background: enabled ? "#14532d" : "#1e293b",
                    color: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    opacity: enabled ? 1 : 0.5,
                  }}
                >
                  <strong style={{ display: "block", fontSize: 18 }}>
                    {enabled ? "✓ " : "○ "}
                    {level.name}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: 6,
                      color: "#dbeafe",
                    }}
                  >
                    {level.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.statusRow}>
        <strong>
          Qualified: {qualifiedCount}/{Math.max(remaining.length - 1, 0)}
        </strong>
        <span>
          {!seasonStarted
            ? "Choose the custom levels for this season."
            : started
              ? "The final marble that has not qualified is eliminated."
              : "Marbles are shuffling inside the holding chamber."}
        </span>
      </div>

      <div className={styles.raceShell}>
        <div className={styles.canvas} ref={sceneRef} />

        {paused && <div className={styles.pauseOverlay}>PAUSED</div>}

        {announcement && (
          <div className={styles.announcement}>
            <div>{announcement}</div>
          </div>
        )}

        {eliminationNotice && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 22,
              transform: "translateX(-50%)",
              zIndex: 12,
              maxWidth: "90%",
              padding: "12px 20px",
              border: "3px solid #111827",
              borderRadius: 12,
              background: "#ffffff",
              color: "#000000",
              fontSize: 20,
              fontWeight: 1000,
              textAlign: "center",
              boxShadow: "0 7px 20px rgba(0,0,0,.35)",
            }}
          >
            {eliminationNotice}
          </div>
        )}

        {!seasonStarted && (
          <div className={styles.announcement}>
            <div>Select your levels, then click Load Season.</div>
          </div>
        )}
      </div>

      <div className={styles.bottomGrid}>
        <section>
          <h2>Still Racing</h2>
          <div className={styles.castGrid}>
            {remaining.map((contestant) => (
              <div className={styles.castCard} key={contestant.id}>
                <img src={contestant.imageUrl} alt="" />
                <span>{contestant.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Placements</h2>
          <div className={styles.placements}>
            {eliminated.map((contestant, index) => {
              const place =
                contestants.length - eliminated.length + 1 + index;

              return (
                <div
                  key={contestant.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "54px 54px minmax(0, 1fr)",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 64,
                    padding: 8,
                    borderRadius: 12,
                    background: "#1e293b",
                  }}
                >
                  <strong
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {ordinal(place)}
                  </strong>

                  <div
                    style={{
                      width: 52,
                      height: 52,
                      overflow: "hidden",
                      border: "3px solid #94a3b8",
                      borderRadius: "999px",
                      background: "#ffffff",
                    }}
                  >
                    <img
                      src={contestant.imageUrl}
                      alt={contestant.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      overflow: "hidden",
                      color: "#ffffff",
                      fontWeight: 900,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {contestant.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}