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
    obstacleKind?: "red-reset" | "green-finish" | "stage" | "corner-guard";
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
    floorZone?: boolean;
  };
};

const WIDTH = 1100;
const HEIGHT = 820;
const MARBLE_RADIUS = 24;
const START_X = 190;
const START_Y = 75;
const START_WIDTH = 720;
const START_HEIGHT = 145;
const FLOOR_Y = HEIGHT - 42;
const CATEGORY_MARBLE = 0x0001;
const CATEGORY_STAGE = 0x0002;
const CATEGORY_SENSOR = 0x0004;

const MIN_SAFE_GAP = MARBLE_RADIUS * 2 + 16;
const CORNER_GUARD_RADIUS = 15;

const controlButtonStyle: React.CSSProperties = {
  minWidth: 76,
  padding: "12px 18px",
  border: "2px solid #111827",
  borderRadius: 12,
  background: "linear-gradient(180deg, #475569 0%, #1e293b 100%)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: "0.01em",
  cursor: "pointer",
  boxShadow: "0 4px 0 #0f172a, 0 7px 16px rgba(0,0,0,.28)",
  transition: "transform .12s ease, filter .12s ease, box-shadow .12s ease",
};

const activeSpeedButtonStyle: React.CSSProperties = {
  ...controlButtonStyle,
  background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
  color: "#111827",
  boxShadow: "0 4px 0 #92400e, 0 7px 16px rgba(0,0,0,.28)",
};

const startButtonStyle: React.CSSProperties = {
  ...controlButtonStyle,
  minWidth: 138,
  background: "linear-gradient(180deg, #4ade80 0%, #16a34a 100%)",
  color: "#052e16",
  boxShadow: "0 4px 0 #166534, 0 7px 16px rgba(0,0,0,.28)",
};

const STAGE_COUNT = 16;
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

function mirroredSeed(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const mirroredX = Math.round(Math.abs(x - WIDTH / 2));
  const values = [
    mirroredX,
    Math.round(y),
    Math.round(width),
    Math.round(height),
  ];

  let hash = 2166136261;
  for (const value of values) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function areMirroredBodies(a: Matter.Body, b: Matter.Body, tolerance = 10) {
  return (
    Math.abs(a.position.y - b.position.y) <= tolerance &&
    Math.abs(a.position.x + b.position.x - WIDTH) <= tolerance
  );
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
      ? (x < WIDTH / 2 ? 1 : -1) * 0.072
      : suppliedAngle;

  return Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    friction: 0.008,
    frictionStatic: 0,
    restitution: 0.9,
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
  const shapeRoll = mirroredSeed(x, y, width, height);
  const common: Matter.IChamferableBodyDefinition = {
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
  };

  let body: ObstacleBody;

  if (shapeRoll < 0.22 && width <= 145) {
    body = Bodies.circle(
      x,
      y,
      Math.max(25, Math.min(width * 0.42, height * 1.35)),
      common,
    ) as ObstacleBody;
  } else if (shapeRoll < 0.42 && width <= 165) {
    body = Bodies.polygon(
      x,
      y,
      6,
      Math.max(28, Math.min(width * 0.42, height * 1.45)),
      common,
    ) as ObstacleBody;
  } else {
    body = Bodies.rectangle(x, y, width, height, {
      ...common,
      chamfer: { radius: Math.min(12, height / 2) },
    }) as ObstacleBody;
  }

  body.plugin = { obstacleKind: "red-reset" };
  return body;
}

function makeGreenFinish(x: number, y: number, width: number, height: number) {
  const shapeRoll = mirroredSeed(x, y, width, height);
  const common: Matter.IChamferableBodyDefinition = {
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
  };

  let body: ObstacleBody;

  if (shapeRoll < 0.22 && width <= 160) {
    body = Bodies.circle(
      x,
      y,
      Math.max(27, Math.min(width * 0.43, height * 1.4)),
      common,
    ) as ObstacleBody;
  } else if (shapeRoll < 0.42 && width <= 175) {
    body = Bodies.polygon(
      x,
      y,
      8,
      Math.max(29, Math.min(width * 0.43, height * 1.5)),
      common,
    ) as ObstacleBody;
  } else {
    body = Bodies.rectangle(x, y, width, height, {
      ...common,
      chamfer: { radius: Math.min(14, height / 2) },
    }) as ObstacleBody;
  }

  body.plugin = { obstacleKind: "green-finish" };
  return body;
}

function makeCircleZone(
  kind: "red-reset" | "green-finish",
  x: number,
  y: number,
  radius: number,
) {
  const isGreen = kind === "green-finish";
  const body = Bodies.circle(x, y, radius, {
    isStatic: true,
    isSensor: true,
    collisionFilter: {
      category: CATEGORY_SENSOR,
      mask: CATEGORY_MARBLE,
    },
    render: {
      fillStyle: isGreen ? "#22c55e" : "#ef4444",
      strokeStyle: isGreen ? "#14532d" : "#7f1d1d",
      lineWidth: 3,
    },
  }) as ObstacleBody;

  body.plugin = { obstacleKind: kind };
  return body;
}

function snapOutcomeZonesIntoFloor(bodies: ObstacleBody[]) {
  for (const body of bodies) {
    const kind = body.plugin?.obstacleKind;
    if (kind !== "green-finish" && kind !== "red-reset") continue;

    // Only convert zones intended as bottom exits. Moving hazards higher in
    // the course remain normal shapes.
    if (body.position.y < FLOOR_Y - 135 || body.plugin?.wrapVertical) continue;

    const originalWidth = body.bounds.max.x - body.bounds.min.x;
    const zoneWidth = Math.max(
      130,
      Math.min(WIDTH - 72, originalWidth * 1.28),
    );

    const replacement = Bodies.rectangle(
      body.position.x,
      FLOOR_Y - 7,
      zoneWidth,
      34,
      {
        isStatic: true,
        isSensor: true,
        angle: 0,
        collisionFilter: {
          category: CATEGORY_SENSOR,
          mask: CATEGORY_MARBLE,
        },
        render: {
          fillStyle: kind === "green-finish" ? "#22c55e" : "#ef4444",
          strokeStyle: kind === "green-finish" ? "#14532d" : "#7f1d1d",
          lineWidth: 2,
        },
      },
    ) as ObstacleBody;

    replacement.plugin = {
      obstacleKind: kind,
      floorZone: true,
    };

    const index = bodies.indexOf(body);
    if (index >= 0) bodies[index] = replacement;
  }
}

function addDeadEndOutcomeZones(bodies: ObstacleBody[]) {
  const floorZones = bodies
    .filter(
      (body) =>
        body.isSensor &&
        body.plugin?.floorZone &&
        (body.plugin?.obstacleKind === "green-finish" ||
          body.plugin?.obstacleKind === "red-reset"),
    )
    .sort((a, b) => a.bounds.min.x - b.bounds.min.x);

  const occupied: Array<{ min: number; max: number }> = floorZones.map((body) => ({
    min: Math.max(36, body.bounds.min.x),
    max: Math.min(WIDTH - 36, body.bounds.max.x),
  }));

  const merged: Array<{ min: number; max: number }> = [];
  for (const interval of occupied) {
    const previous = merged[merged.length - 1];
    if (!previous || interval.min > previous.max + 18) {
      merged.push({ ...interval });
    } else {
      previous.max = Math.max(previous.max, interval.max);
    }
  }

  const lowSolids = bodies.filter(
    (body) =>
      !body.isSensor &&
      body.label !== "start-gate" &&
      body.position.y > FLOOR_Y - 235 &&
      body.position.y < FLOOR_Y - 35,
  );

  const addRedFloor = (centerX: number, width: number) => {
    const safeWidth = Math.max(130, Math.min(width, 230));
    const zone = Bodies.rectangle(centerX, FLOOR_Y - 7, safeWidth, 34, {
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

    zone.plugin = {
      obstacleKind: "red-reset",
      floorZone: true,
    };

    bodies.push(zone);
    merged.push({
      min: centerX - safeWidth / 2,
      max: centerX + safeWidth / 2,
    });
  };

  // Any broad uncovered floor directly below a low obstacle cluster is treated
  // as a dead-end landing pocket and receives a red reset floor.
  const gaps: Array<{ min: number; max: number }> = [];
  let cursor = 36;

  for (const interval of merged.sort((a, b) => a.min - b.min)) {
    if (interval.min - cursor >= 150) {
      gaps.push({ min: cursor, max: interval.min });
    }
    cursor = Math.max(cursor, interval.max);
  }

  if (WIDTH - 36 - cursor >= 150) {
    gaps.push({ min: cursor, max: WIDTH - 36 });
  }

  for (const gap of gaps) {
    const centerX = (gap.min + gap.max) / 2;
    const gapWidth = gap.max - gap.min;

    const hasLowObstacleAbove = lowSolids.some(
      (body) =>
        body.bounds.max.x > gap.min - MARBLE_RADIUS &&
        body.bounds.min.x < gap.max + MARBLE_RADIUS,
    );

    if (!hasLowObstacleAbove) continue;

    const mirroredCenter = WIDTH - centerX;
    const zoneWidth = Math.min(gapWidth - 34, 210);

    addRedFloor(centerX, zoneWidth);

    if (Math.abs(mirroredCenter - centerX) > 70) {
      const mirroredAlreadyCovered = bodies.some(
        (body) =>
          body.isSensor &&
          body.plugin?.floorZone &&
          body.bounds.min.x <= mirroredCenter &&
          body.bounds.max.x >= mirroredCenter,
      );

      if (!mirroredAlreadyCovered) {
        addRedFloor(mirroredCenter, zoneWidth);
      }
    }
  }
}

function expandCourseVertically(bodies: ObstacleBody[]) {
  const anchorY = START_Y + START_HEIGHT;
  const scale = 1.1;

  for (const body of bodies) {
    const isOuterSideWall =
      body.isStatic &&
      !body.isSensor &&
      body.bounds.max.y - body.bounds.min.y > HEIGHT * 0.72 &&
      body.bounds.max.x - body.bounds.min.x < 70;

    const isPermanentFloor =
      body.isStatic &&
      !body.isSensor &&
      body.position.y >= FLOOR_Y;

    const isStartStructure =
      body.label === "start-gate" ||
      body.position.y <= anchorY + 14;

    if (isOuterSideWall || isPermanentFloor || isStartStructure) continue;

    const nextY = anchorY + (body.position.y - anchorY) * scale;
    Body.setPosition(body, {
      x: body.position.x,
      y: Math.min(nextY, FLOOR_Y - 28),
    });

    if (body.plugin?.moveOriginY !== undefined) {
      body.plugin.moveOriginY =
        anchorY + (body.plugin.moveOriginY - anchorY) * scale;
    }

    if (body.plugin?.wrapMinY !== undefined) {
      body.plugin.wrapMinY =
        anchorY + (body.plugin.wrapMinY - anchorY) * scale;
    }

    if (body.plugin?.wrapMaxY !== undefined) {
      body.plugin.wrapMaxY =
        anchorY + (body.plugin.wrapMaxY - anchorY) * scale;
    }
  }
}

function makeReferenceStage4() {
  const bodies: ObstacleBody[] = [];

  // Wide upper funnels feed the four spinning paddles.
  bodies.push(
    makeWall(235, 330, 430, 28, {
      angle: 0.31,
      render: { fillStyle: "#64748b", strokeStyle: "#1e293b", lineWidth: 3 },
    }),
    makeWall(865, 330, 430, 28, {
      angle: -0.31,
      render: { fillStyle: "#64748b", strokeStyle: "#1e293b", lineWidth: 3 },
    }),
  );

  const paddleXs = [270, 460, 640, 830];
  paddleXs.forEach((x, index) => {
    const speed = index < 2 ? 0.095 : -0.095;
    const paddle = makeSpinner(x, 535, 190, speed);
    paddle.render.fillStyle = "#9ca3af";
    paddle.render.strokeStyle = "#374151";
    Body.setAngle(paddle, index % 2 === 0 ? -1.2 : 1.2);
    bodies.push(paddle);
  });

  // Curved-bowl feel made from angled rails, with safe exits at both sides.
  bodies.push(
    makeWall(185, 625, 255, 22, { angle: 0.2 }),
    makeWall(390, 650, 180, 22, { angle: -0.16 }),
    makeWall(710, 650, 180, 22, { angle: 0.16 }),
    makeWall(915, 625, 255, 22, { angle: -0.2 }),
    makeGreenFinish(130, 730, 155, 40),
    makeGreenFinish(970, 730, 155, 40),
    makeRedReset(550, 708, 150, 34),
  );

  return bodies;
}

function makeReferenceStage8() {
  const bodies: ObstacleBody[] = [];

  // A broad bowl keeps the pack circulating without covering the exits.
  bodies.push(
    makeWall(185, 395, 390, 30, { angle: 0.37 }),
    makeWall(915, 395, 390, 30, { angle: -0.37 }),
    makeWall(310, 600, 360, 26, { angle: 0.16 }),
    makeWall(790, 600, 360, 26, { angle: -0.16 }),
    makeWall(550, 500, 300, 34, { angle: 0.42 }),
    makeWall(550, 500, 300, 34, { angle: -0.42 }),
  );

  const leftReset = makeCircleZone("red-reset", 390, 690, 29);
  leftReset.plugin = {
    ...leftReset.plugin,
    wrapVertical: true,
    wrapMinY: 445,
    wrapMaxY: 700,
    wrapSpeed: 2.9,
  };

  const rightReset = makeCircleZone("red-reset", 710, 690, 29);
  rightReset.plugin = {
    ...rightReset.plugin,
    wrapVertical: true,
    wrapMinY: 445,
    wrapMaxY: 700,
    wrapSpeed: 2.9,
  };

  bodies.push(
    leftReset,
    rightReset,
    makeGreenFinish(550, 735, 160, 42),
    makeWall(265, 705, 320, 24, { angle: 0.1 }),
    makeWall(835, 705, 320, 24, { angle: -0.1 }),
  );

  return bodies;
}

function makeReferenceStage9() {
  const bodies: ObstacleBody[] = [];

  // Inward side wedges and lower pyramids create three deliberate exits.
  bodies.push(
    makeWall(145, 385, 310, 42, { angle: 0.48 }),
    makeWall(955, 385, 310, 42, { angle: -0.48 }),
    makeWall(320, 650, 300, 38, { angle: -0.58 }),
    makeWall(780, 650, 300, 38, { angle: 0.58 }),
  );

  // Center cap resembling the light-gray moving blocker from the example.
  bodies.push(
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
  );

  const movingBridge = makeWall(550, 575, 255, 22, {
    render: { fillStyle: "#cbd5e1", strokeStyle: "#475569", lineWidth: 3 },
  });
  movingBridge.plugin = {
    ...movingBridge.plugin,
    obstacleKind: "stage",
    moveAxis: "x",
    moveOriginX: 550,
    moveOriginY: 575,
    moveAmplitude: 205,
    moveSpeed: 0.0032,
    movePhase: 0,
  };

  bodies.push(
    movingBridge,
    makeGreenFinish(145, 735, 180, 42),
    makeRedReset(550, 730, 190, 42),
    makeGreenFinish(955, 735, 180, 42),
  );

  return bodies;
}

function enableGentleZoneMotion(
  bodies: ObstacleBody[],
  variant: number,
) {
  const outcomeZones = bodies.filter(
    (body) =>
      body.plugin?.obstacleKind === "green-finish" ||
      body.plugin?.obstacleKind === "red-reset",
  );

  const processed = new Set<number>();
  const baseAmplitude = 22 + (variant % 3) * 7;
  const baseSpeed = 0.0011 + (variant % 4) * 0.00015;

  for (const body of outcomeZones) {
    if (processed.has(body.id)) continue;

    const mirroredPartner = outcomeZones.find(
      (candidate) =>
        candidate.id !== body.id &&
        !processed.has(candidate.id) &&
        candidate.plugin?.obstacleKind === body.plugin?.obstacleKind &&
        areMirroredBodies(body, candidate, 14),
    );

    const isCenterBody = Math.abs(body.position.x - WIDTH / 2) < 18;

    if (mirroredPartner) {
      const left =
        body.position.x <= mirroredPartner.position.x ? body : mirroredPartner;
      const right = left.id === body.id ? mirroredPartner : body;

      const axis: "x" | "y" = variant % 3 === 0 ? "y" : "x";
      const sharedPhase = variant * 0.37;

      left.plugin = {
        ...left.plugin,
        moveAxis: axis,
        moveOriginX: left.position.x,
        moveOriginY: left.position.y,
        moveAmplitude: baseAmplitude,
        moveSpeed: baseSpeed,
        movePhase: sharedPhase,
      };

      right.plugin = {
        ...right.plugin,
        moveAxis: axis,
        moveOriginX: right.position.x,
        moveOriginY: right.position.y,
        moveAmplitude: axis === "x" ? -baseAmplitude : baseAmplitude,
        moveSpeed: baseSpeed,
        movePhase: sharedPhase,
      };

      processed.add(left.id);
      processed.add(right.id);
      continue;
    }

    // A lone centered zone may move vertically, preserving mirror symmetry.
    if (isCenterBody && !body.plugin?.floorZone) {
      body.plugin = {
        ...body.plugin,
        moveAxis: "y",
        moveOriginX: body.position.x,
        moveOriginY: body.position.y,
        moveAmplitude: 12,
        moveSpeed: baseSpeed,
        movePhase: variant * 0.37,
      };
    }

    processed.add(body.id);
  }
}

function addBottomOutcomeCoverage(
  bodies: ObstacleBody[],
  variant: number,
) {
  const bottomZones = bodies
    .filter(
      (body) =>
        body.isSensor &&
        (body.plugin?.obstacleKind === "green-finish" ||
          body.plugin?.obstacleKind === "red-reset") &&
        body.position.y >= 575,
    )
    .map((body) => ({
      min: Math.max(36, body.bounds.min.x - 8),
      max: Math.min(WIDTH - 36, body.bounds.max.x + 8),
    }))
    .sort((a, b) => a.min - b.min);

  const merged: Array<{ min: number; max: number }> = [];
  for (const zone of bottomZones) {
    const previous = merged[merged.length - 1];
    if (!previous || zone.min > previous.max + 4) {
      merged.push({ ...zone });
    } else {
      previous.max = Math.max(previous.max, zone.max);
    }
  }

  let cursor = 36;
  let gapIndex = 0;

  const addGapZone = (start: number, end: number) => {
    const width = end - start;
    if (width < 22) return;

    const zone = makeRedReset(
      start + width / 2,
      707 - (gapIndex % 2) * 5,
      Math.max(24, width + 4),
      28,
    );
    Body.setAngle(zone, (gapIndex % 2 === 0 ? 1 : -1) * 0.055);
    bodies.push(zone);
    gapIndex += 1;
  };

  for (const interval of merged) {
    if (interval.min > cursor) addGapZone(cursor, interval.min);
    cursor = Math.max(cursor, interval.max);
  }

  if (cursor < WIDTH - 36) {
    addGapZone(cursor, WIDTH - 36);
  }

  // Sloped guide rails keep the lowest part of the board from acting like
  // a flat waiting room. Every rail points toward an outcome sensor.
  const guideColor = {
    fillStyle: "#94a3b8",
    strokeStyle: "#334155",
    lineWidth: 2,
  };

  bodies.push(
    makeWall(155, 674, 250, 18, {
      angle: 0.11,
      render: guideColor,
    }),
    makeWall(405, 686, 235, 18, {
      angle: -0.09,
      render: guideColor,
    }),
    makeWall(695, 686, 235, 18, {
      angle: 0.09,
      render: guideColor,
    }),
    makeWall(945, 674, 250, 18, {
      angle: -0.11,
      render: guideColor,
    }),
  );
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

function makeCornerGuard(x: number, y: number, radius = CORNER_GUARD_RADIUS) {
  const body = Bodies.circle(x, y, radius, {
    isStatic: true,
    friction: 0,
    restitution: 1.02,
    collisionFilter: { category: CATEGORY_STAGE },
    render: {
      fillStyle: "#cbd5e1",
      strokeStyle: "#334155",
      lineWidth: 2,
    },
  }) as ObstacleBody;

  body.plugin = { obstacleKind: "corner-guard" };
  return body;
}

function addRoundedWallEnds(bodies: ObstacleBody[]) {
  const guards: ObstacleBody[] = [];
  const requiredClearance = MARBLE_RADIUS * 2 + 18;

  const distanceToBodyBounds = (
    x: number,
    y: number,
    body: Matter.Body,
  ) => {
    const closestX = Math.max(body.bounds.min.x, Math.min(x, body.bounds.max.x));
    const closestY = Math.max(body.bounds.min.y, Math.min(y, body.bounds.max.y));
    return Math.hypot(x - closestX, y - closestY);
  };

  for (const body of bodies) {
    if (
      !body.isStatic ||
      body.isSensor ||
      body.plugin?.obstacleKind === "corner-guard" ||
      body.label === "start-gate"
    ) {
      continue;
    }

    const boundsWidth = body.bounds.max.x - body.bounds.min.x;
    const boundsHeight = body.bounds.max.y - body.bounds.min.y;
    const longSide = Math.max(boundsWidth, boundsHeight);
    const shortSide = Math.min(boundsWidth, boundsHeight);

    if (longSide < 170 || shortSide > 38) continue;
    if (body.position.y >= FLOOR_Y - 48) continue;
    if (body.position.y <= START_Y + START_HEIGHT + 16) continue;

    const halfLength = longSide / 2 - 6;
    const cos = Math.cos(body.angle);
    const sin = Math.sin(body.angle);

    const endpoints = [
      {
        x: body.position.x - cos * halfLength,
        y: body.position.y - sin * halfLength,
      },
      {
        x: body.position.x + cos * halfLength,
        y: body.position.y + sin * halfLength,
      },
    ];

    for (const endpoint of endpoints) {
      if (
        endpoint.x < 54 ||
        endpoint.x > WIDTH - 54 ||
        endpoint.y < START_Y + START_HEIGHT + 34 ||
        endpoint.y > FLOOR_Y - 58
      ) {
        continue;
      }

      // Never place a guard where it would narrow a route below marble width.
      const nearAnotherObstacle = bodies.some((other) => {
        if (
          other.id === body.id ||
          other.isSensor ||
          other.label === "start-gate" ||
          other.plugin?.obstacleKind === "corner-guard"
        ) {
          return false;
        }

        return (
          distanceToBodyBounds(endpoint.x, endpoint.y, other) <
          requiredClearance
        );
      });

      const nearAnotherGuard = guards.some(
        (guard) =>
          Math.hypot(
            guard.position.x - endpoint.x,
            guard.position.y - endpoint.y,
          ) <
          requiredClearance,
      );

      if (!nearAnotherObstacle && !nearAnotherGuard) {
        guards.push(makeCornerGuard(endpoint.x, endpoint.y));
      }
    }
  }

  bodies.push(...guards);
}

function removeUnsafeCornerGuards(bodies: ObstacleBody[]) {
  const requiredGap = MARBLE_RADIUS * 2 + 14;

  const stageBodies = bodies.filter(
    (body) =>
      !body.isSensor &&
      body.plugin?.obstacleKind !== "corner-guard" &&
      body.label !== "start-gate",
  );

  return bodies.filter((body) => {
    if (body.plugin?.obstacleKind !== "corner-guard") return true;

    return !stageBodies.some((other) => {
      const closestX = Math.max(
        other.bounds.min.x,
        Math.min(body.position.x, other.bounds.max.x),
      );
      const closestY = Math.max(
        other.bounds.min.y,
        Math.min(body.position.y, other.bounds.max.y),
      );

      const distance = Math.hypot(
        body.position.x - closestX,
        body.position.y - closestY,
      );

      return distance < requiredGap;
    });
  });
}

function ensureCentralDropClearance(bodies: ObstacleBody[]) {
  const chuteHalfWidth = MARBLE_RADIUS + 20;
  const chuteMinX = WIDTH / 2 - chuteHalfWidth;
  const chuteMaxX = WIDTH / 2 + chuteHalfWidth;
  const chuteTop = START_Y + START_HEIGHT + 26;
  const chuteBottom = FLOOR_Y - 44;

  const protectedBodies = new Set<number>();

  for (const body of bodies) {
    if (
      body.isSensor ||
      body.label === "start-gate" ||
      body.plugin?.obstacleKind === "corner-guard"
    ) {
      continue;
    }

    const bodyWidth = body.bounds.max.x - body.bounds.min.x;
    const bodyHeight = body.bounds.max.y - body.bounds.min.y;

    const intersectsCenterChute =
      body.bounds.max.x > chuteMinX &&
      body.bounds.min.x < chuteMaxX &&
      body.bounds.max.y > chuteTop &&
      body.bounds.min.y < chuteBottom;

    const isSpinner =
      body.plugin?.rotateSpeed !== undefined &&
      Math.abs(body.plugin.rotateSpeed) > 0;

    const isSmallCenterObject =
      bodyWidth <= MARBLE_RADIUS * 2.4 &&
      bodyHeight <= MARBLE_RADIUS * 2.4;

    // Keep center spinners and small bumpers because they can move marbles
    // through. Remove static rails, walls, and large shapes that seal the chute.
    if (intersectsCenterChute && !isSpinner && !isSmallCenterObject) {
      protectedBodies.add(body.id);
    }
  }

  for (let index = bodies.length - 1; index >= 0; index -= 1) {
    if (protectedBodies.has(bodies[index].id)) {
      bodies.splice(index, 1);
    }
  }

  // Also remove pairs whose combined bounds form a bridge across the center.
  const solids = bodies.filter(
    (body) =>
      !body.isSensor &&
      body.label !== "start-gate" &&
      body.plugin?.obstacleKind !== "corner-guard" &&
      body.plugin?.rotateSpeed === undefined,
  );

  const toRemove = new Set<number>();

  for (let i = 0; i < solids.length; i += 1) {
    for (let j = i + 1; j < solids.length; j += 1) {
      const a = solids[i];
      const b = solids[j];

      const sameBand =
        Math.abs(a.position.y - b.position.y) < MARBLE_RADIUS * 2.5;

      if (!sameBand) continue;

      const combinedMinX = Math.min(a.bounds.min.x, b.bounds.min.x);
      const combinedMaxX = Math.max(a.bounds.max.x, b.bounds.max.x);
      const overlapAcrossCenter =
        combinedMinX < chuteMinX &&
        combinedMaxX > chuteMaxX &&
        Math.min(a.bounds.max.x, b.bounds.max.x) >
          Math.max(a.bounds.min.x, b.bounds.min.x);

      if (!overlapAcrossCenter) continue;

      const removeA =
        Math.abs(a.position.x - WIDTH / 2) <
        Math.abs(b.position.x - WIDTH / 2);

      toRemove.add(removeA ? a.id : b.id);
    }
  }

  for (let index = bodies.length - 1; index >= 0; index -= 1) {
    if (toRemove.has(bodies[index].id)) {
      bodies.splice(index, 1);
    }
  }

  // Add subtle mirrored guide rails outside the protected center chute.
  const guideY = FLOOR_Y - 120;
  const guideLength = 250;
  const guideColor = {
    fillStyle: "#cbd5e1",
    strokeStyle: "#475569",
    lineWidth: 2,
  };

  const leftGuide = makeWall(WIDTH / 2 - 205, guideY, guideLength, 18, {
    angle: 0.12,
    render: guideColor,
  });
  const rightGuide = makeWall(WIDTH / 2 + 205, guideY, guideLength, 18, {
    angle: -0.12,
    render: guideColor,
  });

  // Only add the guides when they do not overlap existing outcome zones.
  const safeToAdd = (candidate: Matter.Body) =>
    !bodies.some(
      (body) =>
        body.isSensor &&
        candidate.bounds.max.x > body.bounds.min.x &&
        candidate.bounds.min.x < body.bounds.max.x &&
        candidate.bounds.max.y > body.bounds.min.y - 18 &&
        candidate.bounds.min.y < body.bounds.max.y + 18,
    );

  if (safeToAdd(leftGuide)) bodies.push(leftGuide);
  if (safeToAdd(rightGuide)) bodies.push(rightGuide);
}

function synchronizeMirroredMotion(bodies: ObstacleBody[]) {
  const processed = new Set<number>();

  for (const body of bodies) {
    if (processed.has(body.id)) continue;

    const partner = bodies.find(
      (candidate) =>
        candidate.id !== body.id &&
        !processed.has(candidate.id) &&
        candidate.plugin?.obstacleKind === body.plugin?.obstacleKind &&
        areMirroredBodies(body, candidate, 12),
    );

    if (!partner) continue;

    const left = body.position.x <= partner.position.x ? body : partner;
    const right = left.id === body.id ? partner : body;

    if (
      left.plugin?.moveAxis &&
      left.plugin.moveAmplitude !== undefined &&
      left.plugin.moveSpeed !== undefined
    ) {
      right.plugin = {
        ...right.plugin,
        moveAxis: left.plugin.moveAxis,
        moveOriginX: right.position.x,
        moveOriginY: right.position.y,
        moveAmplitude:
          left.plugin.moveAxis === "x"
            ? -Math.abs(left.plugin.moveAmplitude)
            : left.plugin.moveAmplitude,
        moveSpeed: left.plugin.moveSpeed,
        movePhase: left.plugin.movePhase ?? 0,
      };

      left.plugin.moveAmplitude =
        left.plugin.moveAxis === "x"
          ? Math.abs(left.plugin.moveAmplitude)
          : left.plugin.moveAmplitude;
    }

    if (
      left.plugin?.wrapVertical &&
      left.plugin.wrapMinY !== undefined &&
      left.plugin.wrapMaxY !== undefined &&
      left.plugin.wrapSpeed !== undefined
    ) {
      right.plugin = {
        ...right.plugin,
        wrapVertical: true,
        wrapMinY: left.plugin.wrapMinY,
        wrapMaxY: left.plugin.wrapMaxY,
        wrapSpeed: left.plugin.wrapSpeed,
      };
    }

    processed.add(left.id);
    processed.add(right.id);
  }
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
  } else if (variant === 12) {
    // SPINNER TUNNEL: alternating slopes and fast rotors create repeated pileups.
    bodies.push(...makeSpinnerTunnel());
    bodies.push(makeBumper(550, 355, 30));
    bodies.push(makeRedReset(300, 620, 105, 24));
    bodies.push(makeRedReset(550, 600, 100, 24));
    bodies.push(makeRedReset(800, 620, 105, 24));
    bodies.push(makeGreenFinish(235, 690, 145, 42));
    bodies.push(makeGreenFinish(550, 690, 155, 42));
    bodies.push(makeGreenFinish(865, 690, 145, 42));
  } else if (variant === 13) {
    // REFERENCE STAGE 4: four fast paddles, left pair clockwise and right pair counter-clockwise.
    bodies.push(...makeReferenceStage4());
  } else if (variant === 14) {
    // REFERENCE STAGE 8: looping red reset balls rise through two side corridors.
    bodies.push(...makeReferenceStage8());
  } else {
    // REFERENCE STAGE 9: a fast moving bridge pauses naturally at each side gap.
    bodies.push(...makeReferenceStage9());
  }

  // Do not blanket-cover the bottom with sensors. Routes stay open and visible.
  expandCourseVertically(bodies);
  snapOutcomeZonesIntoFloor(bodies);
  addDeadEndOutcomeZones(bodies);

  // The hand-built reference stages already contain intentional motion.
  if (variant < 13) enableGentleZoneMotion(bodies, variant);

  synchronizeMirroredMotion(bodies);
  ensureCentralDropClearance(bodies);
  addRoundedWallEnds(bodies);
  return removeUnsafeCornerGuards(bodies);
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
  const movementRef = useRef<
    Map<
      number,
      {
        x: number;
        y: number;
        lastMovedAt: number;
        lastProgressAt: number;
        lowestY: number;
        stuckCount: number;
      }
    >
  >(new Map());
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef<1 | 2 | 4>(1);
  const eliminationDisplayRef = useRef<{ name: string; place: number } | null>(
    null,
  );

  const [remaining, setRemaining] = useState<MarbleContestant[]>(contestants);
  const [eliminated, setEliminated] = useState<MarbleContestant[]>([]);
  const [round, setRound] = useState(1);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [eliminationDisplay, setEliminationDisplay] = useState<{
    name: string;
    place: number;
  } | null>(null);
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
      x: (Math.random() - 0.5) * 9,
      y: -2.5 - Math.random() * 3,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);
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
      eliminationDisplayRef.current = null;
      setEliminationDisplay(null);

      const engine = Engine.create({
        gravity: { x: 0, y: 1.05, scale: 0.001 },
      });
      engine.positionIterations = 10;
      engine.velocityIterations = 8;
      engine.constraintIterations = 4;
      engineRef.current = engine;
      engine.timing.timeScale = speedRef.current;

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
          restitution: 0.96,
          friction: 0.0015,
          frictionStatic: 0,
          frictionAir: 0.0012,
          density: 0.0038,
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
            lastProgressAt: Date.now(),
            lowestY: meta.body.position.y,
            stuckCount: 0,
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

          const moveAxis = body.plugin?.moveAxis;
          const originX = body.plugin?.moveOriginX;
          const originY = body.plugin?.moveOriginY;
          const amplitude = body.plugin?.moveAmplitude;
          const moveSpeed = body.plugin?.moveSpeed;
          const phase = body.plugin?.movePhase ?? 0;

          if (
            moveAxis &&
            originX !== undefined &&
            originY !== undefined &&
            amplitude !== undefined &&
            moveSpeed !== undefined
          ) {
            const offset =
              Math.sin(engine.timing.timestamp * moveSpeed + phase) * amplitude;

            Body.setPosition(body, {
              x: moveAxis === "x" ? originX + offset : originX,
              y: moveAxis === "y" ? originY + offset : originY,
            });
          }

          if (
            body.plugin?.wrapVertical &&
            body.plugin.wrapMinY !== undefined &&
            body.plugin.wrapMaxY !== undefined &&
            body.plugin.wrapSpeed !== undefined
          ) {
            const nextY = body.position.y - body.plugin.wrapSpeed;

            Body.setPosition(body, {
              x: body.position.x,
              y:
                nextY < body.plugin.wrapMinY
                  ? body.plugin.wrapMaxY
                  : nextY,
            });
          }
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

            const madeDownwardProgress =
              meta.body.position.y > tracking.lowestY + MARBLE_RADIUS * 0.75;

            if (madeDownwardProgress) {
              tracking.lowestY = meta.body.position.y;
              tracking.lastProgressAt = now;
            }

            if (moved > 26 || meta.body.speed > 1.8) {
              tracking.x = meta.body.position.x;
              tracking.y = meta.body.position.y;
              tracking.lastMovedAt = now;
              tracking.stuckCount = 0;
            }

            const physicallyStuck = now - tracking.lastMovedAt > 1500;
            const repeatingLoop =
              now - tracking.lastProgressAt > 5200 &&
              meta.body.position.y < FLOOR_Y - 80;

            if (physicallyStuck || repeatingLoop) {
              const activeIndex = [...marbleRefs.current.values()].findIndex(
                (entry) => entry.body.id === meta.body.id,
              );

              resetMarbleToStart(meta.body, Math.max(activeIndex, 0));

              tracking.x = meta.body.position.x;
              tracking.y = meta.body.position.y;
              tracking.lowestY = meta.body.position.y;
              tracking.lastMovedAt = now;
              tracking.lastProgressAt = now;
              tracking.stuckCount = 0;
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

        if (
          roundStartedRef.current &&
          !roundResolvingRef.current &&
          engine.timing.timestamp > 18000
        ) {
          const activeMarbles = [...marbleRefs.current.values()].filter(
            (meta) => !qualifiersRef.current.has(meta.contestant.id),
          );

          const nobodyReachedLowerCourse = activeMarbles.every(
            (meta) => meta.body.position.y < HEIGHT * 0.62,
          );

          if (activeMarbles.length > 0 && nobodyReachedLowerCourse) {
            const lowest = [...activeMarbles].sort(
              (a, b) => b.body.position.y - a.body.position.y,
            )[0];

            Body.setPosition(lowest.body, {
              x: WIDTH / 2 + (Math.random() - 0.5) * 24,
              y: HEIGHT * 0.64,
            });
            Body.setVelocity(lowest.body, {
              x: (Math.random() - 0.5) * 3,
              y: 5,
            });
          }
        }

        if (!roundStartedRef.current) {
          let index = 0;
          for (const meta of marbleRefs.current.values()) {
            if (qualifiersRef.current.has(meta.contestant.id)) continue;
            const chamberCenterX = START_X + START_WIDTH / 2;
            const horizontalPush =
              meta.body.position.x < chamberCenterX ? 1 : -1;

            Body.applyForce(meta.body, meta.body.position, {
              x:
                horizontalPush * (0.0015 + Math.random() * 0.0018) +
                (Math.random() - 0.5) * 0.0028,
              y: -0.0014 + (Math.random() - 0.5) * 0.0026,
            });

            if (Math.random() < 0.018) {
              Body.setVelocity(meta.body, {
                x: (Math.random() - 0.5) * 13,
                y: -6 + Math.random() * 11,
              });
              Body.setAngularVelocity(
                meta.body,
                (Math.random() - 0.5) * 0.9,
              );
            }

            if (
              meta.body.position.y > START_Y + START_HEIGHT - 18 ||
              meta.body.position.y < START_Y + 12 ||
              meta.body.position.x < START_X + 18 ||
              meta.body.position.x > START_X + START_WIDTH - 18
            ) {
              Body.setPosition(meta.body, {
                x: Math.min(
                  Math.max(meta.body.position.x, START_X + 36),
                  START_X + START_WIDTH - 36,
                ),
                y: Math.min(
                  Math.max(meta.body.position.y, START_Y + 30),
                  START_Y + START_HEIGHT - 38,
                ),
              });
              Body.setVelocity(meta.body, {
                x: (Math.random() - 0.5) * 11,
                y: -4 + Math.random() * 8,
              });
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
                resolveEliminationRef.current(loser.contestant);
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

        const eliminationInfo = eliminationDisplayRef.current;
        if (eliminationInfo) {
          ctx.save();
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const safeDisplayName = safeName(eliminationInfo.name);
          ctx.font = "1000 64px system-ui, sans-serif";
          ctx.fillText(safeDisplayName, WIDTH / 2, HEIGHT * 0.46);

          ctx.font = "900 34px system-ui, sans-serif";
          ctx.fillText(
            `ELIMINATED · ${ordinal(eliminationInfo.place)} PLACE`,
            WIDTH / 2,
            HEIGHT * 0.54,
          );
          ctx.restore();
        }

        if (hovered && !eliminationDisplayRef.current) {
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
    [destroyWorld, resetMarbleToStart],
  );

  const resolveElimination = useCallback(
    (loser: MarbleContestant) => {
      const engine = engineRef.current;
      if (!engine || !roundResolvingRef.current) return;

      const place = remainingRef.current.length;
      const display = { name: loser.name, place };

      eliminationDisplayRef.current = display;
      setEliminationDisplay(display);
      setAnnouncement(null);
      setPaused(false);

      const loserMeta = [...marbleRefs.current.values()].find(
        (entry) => entry.contestant.id === loser.id,
      );

      const preservedPosition = loserMeta
        ? { ...loserMeta.body.position }
        : { x: WIDTH / 2, y: START_Y + START_HEIGHT + 20 };
      const preservedVelocity = loserMeta
        ? { ...loserMeta.body.velocity }
        : { x: 0, y: 1 };
      const preservedAngularVelocity = loserMeta
        ? loserMeta.body.angularVelocity
        : 0;

      // Everything disappears immediately except the final marble.
      for (const body of [
        ...Composite.allBodies(engine.world),
      ] as ObstacleBody[]) {
        const isLoser = body.label === `marble:${loser.id}`;
        if (!isLoser) Composite.remove(engine.world, body);
      }

      qualifiersRef.current.clear();
      for (const meta of marbleRefs.current.values()) {
        if (meta.contestant.id !== loser.id) {
          qualifiersRef.current.add(meta.contestant.id);
        }
      }

      // Blank white bounce chamber with an actual visible floor.
      const wallOptions: Matter.IChamferableBodyDefinition = {
        isStatic: true,
        friction: 0,
        restitution: 0.92,
        collisionFilter: { category: CATEGORY_STAGE },
        render: {
          fillStyle: "#ffffff",
          strokeStyle: "#ffffff",
          lineWidth: 0,
        },
      };

      const visibleFloor = Bodies.rectangle(
        WIDTH / 2,
        HEIGHT - 18,
        WIDTH,
        36,
        {
          ...wallOptions,
          render: {
            fillStyle: "#111827",
            strokeStyle: "#111827",
            lineWidth: 0,
          },
        },
      );

      Composite.add(engine.world, [
        visibleFloor,
        Bodies.rectangle(18, HEIGHT / 2, 36, HEIGHT, {
          ...wallOptions,
          render: { visible: false },
        }),
        Bodies.rectangle(WIDTH - 18, HEIGHT / 2, 36, HEIGHT, {
          ...wallOptions,
          render: { visible: false },
        }),
        Bodies.rectangle(WIDTH / 2, 18, WIDTH, 36, {
          ...wallOptions,
          render: { visible: false },
        }),
      ]);

      if (loserMeta) {
        Body.setStatic(loserMeta.body, false);
        Body.setPosition(loserMeta.body, preservedPosition);
        Body.setVelocity(loserMeta.body, preservedVelocity);
        Body.setAngularVelocity(
          loserMeta.body,
          preservedAngularVelocity,
        );
      }

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
          eliminationDisplayRef.current = null;
          setEliminationDisplay(null);
          setWinner(seasonWinner);
          setAnnouncement(`${seasonWinner.name} wins the Marble Race!`);
          onSeasonFinished?.(seasonWinner, [seasonWinner, ...nextEliminated]);
          return;
        }

        const nextRound = round + 1;
        eliminationDisplayRef.current = null;
        setEliminationDisplay(null);
        setRound(nextRound);
        buildRound(nextRemaining, nextRound);
      }, 3600);
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
    if (!engineRef.current || started || winner) return;
    if (countdownTimerRef.current) return;

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
    speedRef.current = nextSpeed;
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
    eliminationDisplayRef.current = null;
    setEliminationDisplay(null);
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
            <button
              className={styles.startButton}
              style={startButtonStyle}
              onPointerDown={startRound}
            >
              Start Round
            </button>
          )}
          <button
            style={controlButtonStyle}
            onClick={togglePause}
            disabled={!!winner || countdown !== null}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            style={speed === 1 ? activeSpeedButtonStyle : controlButtonStyle}
            onClick={() => changeSpeed(1)}
            disabled={speed === 1}
          >
            1×
          </button>
          <button
            style={speed === 2 ? activeSpeedButtonStyle : controlButtonStyle}
            onClick={() => changeSpeed(2)}
            disabled={speed === 2}
          >
            2×
          </button>
          <button
            style={speed === 4 ? activeSpeedButtonStyle : controlButtonStyle}
            onClick={() => changeSpeed(4)}
            disabled={speed === 4}
          >
            4×
          </button>
          <button style={controlButtonStyle} onClick={restartSeason}>
            Restart
          </button>
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
        {eliminationDisplay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: "54px",
              color: "#000000",
              textAlign: "center",
              textShadow: "0 2px 0 rgba(255,255,255,.9)",
            }}
          >
            <div
              style={{
                maxWidth: "88%",
                fontSize: "clamp(2.3rem, 6vw, 5.6rem)",
                fontWeight: 1000,
                lineHeight: 0.95,
                overflowWrap: "anywhere",
              }}
            >
              {eliminationDisplay.name}
            </div>
            <div
              style={{
                marginTop: "16px",
                fontSize: "clamp(1.5rem, 3vw, 3rem)",
                fontWeight: 950,
              }}
            >
              Eliminated · {ordinal(eliminationDisplay.place)} Place
            </div>
          </div>
        )}
        {announcement && (
          <div className={styles.announcement}>
            <div>{announcement}</div>
          </div>
        )}
      </div>

      <div className={styles.bottomGrid}>
        <section style={{ gridColumn: "1 / -1" }}>
          <h2>Placements</h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: "14px",
            }}
          >
            {winner && (
              <div
                style={{
                  width: 76,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: MARBLE_RADIUS * 2,
                    height: MARBLE_RADIUS * 2,
                    overflow: "hidden",
                    border: "3px solid #d97706",
                    borderRadius: "50%",
                    background: "#fef3c7",
                    boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                  }}
                >
                  <img
                    src={winner.imageUrl}
                    alt=""
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <strong style={{ color: "#fbbf24", fontSize: 13 }}>1st</strong>
                <span
                  title={winner.name}
                  style={{
                    width: "100%",
                    overflow: "hidden",
                    color: "#f8fafc",
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {winner.name}
                </span>
              </div>
            )}

            {eliminated.map((contestant, index) => {
              const place = contestants.length - index;

              
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      if (!started && !winner) startRound();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, winner]);

return (
                <div
                  key={contestant.id}
                  style={{
                    width: 76,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: MARBLE_RADIUS * 2,
                      height: MARBLE_RADIUS * 2,
                      overflow: "hidden",
                      border: "3px solid #111827",
                      borderRadius: "50%",
                      background: "#dbeafe",
                      boxShadow: "0 2px 6px rgba(0,0,0,.25)",
                    }}
                  >
                    <img
                      src={contestant.imageUrl}
                      alt=""
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <strong style={{ color: "#cbd5e1", fontSize: 13 }}>
                    {ordinal(place)}
                  </strong>

                  <span
                    title={contestant.name}
                    style={{
                      width: "100%",
                      overflow: "hidden",
                      color: "#f8fafc",
                      fontSize: 11,
                      fontWeight: 800,
                      lineHeight: 1.15,
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