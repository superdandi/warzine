// ============================================================
// WARZINE - Beat 'em Up de tinta negra / fanzine punk
// ============================================================

const W = 640;
const H = 480;

kaplay({
  width: W,
  height: H,
  background: [230, 222, 210],
  letterbox: true,
  stretch: true,
});

const PAPER = rgb(230, 222, 210);
const INK = rgb(0, 0, 0);
const WHITE = rgb(255, 255, 255);
const RED = rgb(180, 30, 30);
const GRAY = rgb(160, 150, 140);

// ============================================================
// PAPER TEXTURE OVERLAY (efecto fotocopia)
// ============================================================

function generatePaperTexture() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const imgData = ctx.createImageData(W, H);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = Math.random() * 30;
    imgData.data[i] = noise;
    imgData.data[i + 1] = noise;
    imgData.data[i + 2] = noise;
    imgData.data[i + 3] = Math.random() < 0.15 ? 8 : 0;
  }
  ctx.putImageData(imgData, 0, 0);
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.lineTo(Math.random() * W, Math.random() * H);
    ctx.stroke();
  }
  return c;
}

loadSprite("paperTex", generatePaperTexture());

// ============================================================
// STREET BACKGROUND
// ============================================================

function generateStreetBg() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  // Sky / upper area
  ctx.fillStyle = "#e6e6d6";
  ctx.fillRect(0, 0, W, H);

  // Buildings silhouette
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#f0ede0";

  const bldgs = [
    [10, 20, 120, 200],
    [150, 40, 100, 180],
    [270, 10, 140, 210],
    [430, 30, 90, 190],
    [540, 50, 90, 170],
  ];
  for (const [bx, by, bw, bh] of bldgs) {
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    // Windows
    for (let wy = by + 15; wy < by + bh - 15; wy += 30) {
      for (let wx = bx + 10; wx < bx + bw - 15; wx += 25) {
        ctx.strokeRect(wx, wy, 12, 16);
      }
    }
  }

  // Ground
  ctx.fillStyle = "#d4cfc0";
  ctx.fillRect(0, H - 80, W, 80);
  ctx.strokeRect(0, H - 80, W, 80);

  // Road lines
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(0, H - 40);
  ctx.lineTo(W, H - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Graffiti details
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";
  for (let i = 0; i < 5; i++) {
    const gx = 50 + i * 120;
    const gy = H - 130 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 20, gy - 15);
    ctx.lineTo(gx + 40, gy + 5);
    ctx.lineTo(gx + 60, gy - 10);
    ctx.lineTo(gx + 80, gy + 10);
    ctx.stroke();
  }

  // Manhole cover
  ctx.strokeRect(300, H - 55, 30, 30);
  ctx.strokeRect(302, H - 53, 26, 26);

  return c;
}

loadSprite("streetBg", generateStreetBg());

// ============================================================
// HELPERS
// ============================================================

function inkPart(w, h) {
  return [rect(w, h), outline(3), color(WHITE)];
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randi(min, max) {
  return Math.floor(rand(min, max + 1));
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function screenShake(intensity = 4, duration = 0.15) {
  shake(intensity, duration);
}

// ============================================================
// CHARACTER FACTORY
// ============================================================

function createCharacter(x, y, type, tag) {
  const F = tag === "boss" ? 2 : 1;

  const cfg = CHAR_CONFIG[type];

  const char = add([
    pos(x, y),
    area({ width: 28 * F, height: 48 * F }),
    anchor("center"),
    "char",
    tag,
    {
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed,
      facing: 1,
      attackTimer: 0,
      comboTimer: 0,
      comboCount: 0,
      hitTimer: 0,
      dead: false,
      invincible: 0,
      type,
      parts: [],
      bodyW: cfg.bodyW * F,
      bodyH: cfg.bodyH * F,
      headW: cfg.headW * F,
      headH: cfg.headH * F,
      armW: cfg.armW * F,
      armH: cfg.armH * F,
      legW: cfg.legW * F,
      legH: cfg.legH * F,
    },
  ]);

  const bw = char.bodyW, bh = char.bodyH;
  const hw = char.headW, hh = char.headH;
  const aw = char.armW, ah = char.armH;
  const lw = char.legW, lh = char.legH;

  // Head
  const head = char.add([
    rect(hw, hh),
    outline(3),
    color(WHITE),
    pos(-hw / 2, -bh / 2 - hh + 2),
    anchor("center"),
  ]);
  char.parts.push({ name: "head", obj: head, x0: 0, y0: -bh / 2 - hh + 2 });

  // Body
  const body = char.add([
    rect(bw, bh),
    outline(3),
    color(WHITE),
    pos(0, 0),
    anchor("center"),
  ]);
  char.parts.push({ name: "body", obj: body, x0: 0, y0: 0 });

  // Left arm
  const lArm = char.add([
    rect(aw, ah),
    outline(3),
    color(WHITE),
    pos(-bw / 2 - aw / 2 + 1, -bh / 2 + 4),
    anchor("left"),
  ]);
  char.parts.push({
    name: "lArm",
    obj: lArm,
    x0: -bw / 2 - aw / 2 + 1,
    y0: -bh / 2 + 4,
  });

  // Right arm
  const rArm = char.add([
    rect(aw, ah),
    outline(3),
    color(WHITE),
    pos(bw / 2 + aw / 2 - 1, -bh / 2 + 4),
    anchor("right"),
  ]);
  char.parts.push({
    name: "rArm",
    obj: rArm,
    x0: bw / 2 + aw / 2 - 1,
    y0: -bh / 2 + 4,
  });

  // Left leg
  const lLeg = char.add([
    rect(lw, lh),
    outline(3),
    color(WHITE),
    pos(-lw / 2 - 1, bh / 2),
    anchor("top"),
  ]);
  char.parts.push({
    name: "lLeg",
    obj: lLeg,
    x0: -lw / 2 - 1,
    y0: bh / 2,
  });

  // Right leg
  const rLeg = char.add([
    rect(lw, lh),
    outline(3),
    color(WHITE),
    pos(lw / 2 + 1, bh / 2),
    anchor("top"),
  ]);
  char.parts.push({
    name: "rLeg",
    obj: rLeg,
    x0: lw / 2 + 1,
    y0: bh / 2,
  });

  // Extra details per type
  if (type === "punkette") {
    // Hair spikes
    const spike = char.add([
      polygon([vec2(-8, -2), vec2(-14, -10), vec2(-4, -4)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "spikeL", obj: spike, x0: 0, y0: -bh / 2 - hh + 2 });
    const spike2 = char.add([
      polygon([vec2(0, -4), vec2(0, -14), vec2(4, -4)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "spikeT", obj: spike2, x0: 0, y0: -bh / 2 - hh + 2 });
    const spike3 = char.add([
      polygon([vec2(8, -2), vec2(14, -10), vec2(4, -4)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "spikeR", obj: spike3, x0: 0, y0: -bh / 2 - hh + 2 });
    // Jacket line
    const jacket = char.add([
      rect(bw - 6, bh - 4),
      outline(1),
      color(WHITE),
      pos(0, 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "jacket", obj: jacket, x0: 0, y0: 2 });
  }

  if (type === "antagonic") {
    // Gas mask lines
    const mask = char.add([
      rect(hw - 4, 3),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2 - 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "mask", obj: mask, x0: 0, y0: -bh / 2 - hh + 2 - 2 });
    const filter = char.add([
      circle(4),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2 + 4),
      anchor("center"),
    ]);
    char.parts.push({ name: "filter", obj: filter, x0: 0, y0: -bh / 2 - hh + 2 + 4 });
    // Shoulder pads
    const sp1 = char.add([
      rect(6, 6),
      outline(2),
      color(WHITE),
      pos(-bw / 2 - 4, -bh / 2 + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "sp1", obj: sp1, x0: -bw / 2 - 4, y0: -bh / 2 + 2 });
    const sp2 = char.add([
      rect(6, 6),
      outline(2),
      color(WHITE),
      pos(bw / 2 + 4, -bh / 2 + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "sp2", obj: sp2, x0: bw / 2 + 4, y0: -bh / 2 + 2 });
  }

  if (type === "xero") {
    // Visor
    const visor = char.add([
      rect(hw + 2, 5),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2 + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "visor", obj: visor, x0: 0, y0: -bh / 2 - hh + 2 + 2 });
    // Cyber lines on body
    const line1 = char.add([
      rect(3, bh - 6),
      outline(1),
      color(WHITE),
      pos(-4, 1),
      anchor("center"),
    ]);
    char.parts.push({ name: "line1", obj: line1, x0: -4, y0: 1 });
    const line2 = char.add([
      rect(3, bh - 6),
      outline(1),
      color(WHITE),
      pos(4, 1),
      anchor("center"),
    ]);
    char.parts.push({ name: "line2", obj: line2, x0: 4, y0: 1 });
    // Bigger right arm (cyborg)
    rArm.width = aw * 1.5;
    rArm.height = ah * 1.2;
    char.parts.find((p) => p.name === "rArm").obj.width = aw * 1.5;
    char.parts.find((p) => p.name === "rArm").obj.height = ah * 1.2;
  }

  if (type === "grunt") {
    // Simple spiky hair
    const h1 = char.add([
      polygon([vec2(-6, -hh / 2), vec2(-8, -hh / 2 - 6), vec2(-2, -hh / 2)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "h1", obj: h1, x0: 0, y0: -bh / 2 - hh + 2 });
  }

  if (type === "punk") {
    // Mohawk
    const m1 = char.add([
      rect(4, 12),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2 - 6),
      anchor("center"),
    ]);
    char.parts.push({ name: "mohawk", obj: m1, x0: 0, y0: -bh / 2 - hh + 2 - 6 });
  }

  if (type === "boss") {
    // Horns
    const hornL = char.add([
      polygon([vec2(-8, -6), vec2(-12, -16), vec2(-4, -8)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "hornL", obj: hornL, x0: 0, y0: -bh / 2 - hh + 2 });
    const hornR = char.add([
      polygon([vec2(8, -6), vec2(12, -16), vec2(4, -8)]),
      outline(2),
      color(WHITE),
      pos(0, -bh / 2 - hh + 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "hornR", obj: hornR, x0: 0, y0: -bh / 2 - hh + 2 });
    // Chest scar
    const scar = char.add([
      rect(3, 10),
      outline(1),
      color(WHITE),
      pos(0, 2),
      anchor("center"),
    ]);
    char.parts.push({ name: "scar", obj: scar, x0: 0, y0: 2 });
  }

  return char;
}

// ============================================================
// CHARACTER CONFIGURATIONS
// ============================================================

const CHAR_CONFIG = {
  punkette: {
    hp: 100,
    speed: 220,
    bodyW: 18,
    bodyH: 22,
    headW: 14,
    headH: 13,
    armW: 6,
    armH: 14,
    legW: 6,
    legH: 14,
  },
  antagonic: {
    hp: 120,
    speed: 190,
    bodyW: 22,
    bodyH: 24,
    headW: 18,
    headH: 14,
    armW: 7,
    armH: 16,
    legW: 7,
    legH: 15,
  },
  xero: {
    hp: 110,
    speed: 200,
    bodyW: 20,
    bodyH: 23,
    headW: 15,
    headH: 14,
    armW: 6,
    armH: 15,
    legW: 6,
    legH: 14,
  },
  grunt: {
    hp: 30,
    speed: 140,
    bodyW: 14,
    bodyH: 18,
    headW: 12,
    headH: 11,
    armW: 5,
    armH: 11,
    legW: 5,
    legH: 11,
  },
  punk: {
    hp: 50,
    speed: 170,
    bodyW: 16,
    bodyH: 19,
    headW: 13,
    headH: 12,
    armW: 6,
    armH: 12,
    legW: 6,
    legH: 12,
  },
  tough: {
    hp: 80,
    speed: 110,
    bodyW: 20,
    bodyH: 22,
    headW: 16,
    headH: 13,
    armW: 7,
    armH: 14,
    legW: 7,
    legH: 13,
  },
  boss: {
    hp: 250,
    speed: 130,
    bodyW: 26,
    bodyH: 28,
    headW: 20,
    headH: 16,
    armW: 9,
    armH: 18,
    legW: 9,
    legH: 17,
  },
};

// ============================================================
// ANIMATION / POSE HELPERS
// ============================================================

function resetPose(char) {
  for (const p of char.parts) {
    p.obj.pos = vec2(p.x0, p.y0);
    p.obj.angle = 0;
  }
}

function setPunchPose(char) {
  resetPose(char);
  const rArm = char.parts.find((p) => p.name === "rArm");
  if (rArm) {
    rArm.obj.pos = vec2(rArm.x0 + 12, rArm.y0 - 2);
    rArm.obj.angle = 0;
  }
  const lArm = char.parts.find((p) => p.name === "lArm");
  if (lArm) {
    lArm.obj.pos = vec2(lArm.x0, lArm.y0 + 4);
  }
  // Lean forward slightly
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0 + 3, body.y0);
}

function setKickPose(char) {
  resetPose(char);
  const rLeg = char.parts.find((p) => p.name === "rLeg");
  if (rLeg) {
    rLeg.obj.pos = vec2(rLeg.x0 + 6, rLeg.y0 - 6);
    rLeg.obj.angle = 30;
  }
  // Lean back
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0 - 3, body.y0);
}

function setHitPose(char) {
  resetPose(char);
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0, body.y0 + 2);
  const head = char.parts.find((p) => p.name === "head");
  if (head) head.obj.pos = vec2(head.x0, head.y0 + 2);
}

function setWalkPose(char, t) {
  const lLeg = char.parts.find((p) => p.name === "lLeg");
  const rLeg = char.parts.find((p) => p.name === "rLeg");
  const lArm = char.parts.find((p) => p.name === "lArm");
  const rArm = char.parts.find((p) => p.name === "rArm");
  const swing = Math.sin(t * 0.15) * 6;
  if (lLeg) lLeg.obj.pos = vec2(lLeg.x0, lLeg.y0 + swing);
  if (rLeg) rLeg.obj.pos = vec2(rLeg.x0, rLeg.y0 - swing);
  if (lArm) lArm.obj.pos = vec2(lArm.x0, lArm.y0 - swing * 0.5);
  if (rArm) rArm.obj.pos = vec2(rArm.x0, rArm.y0 + swing * 0.5);
}

function setIdlePose(char, t) {
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0, body.y0 + Math.sin(t * 0.05) * 1);
}

// ============================================================
// SPAWN HITBOX
// ============================================================

function spawnHitbox(owner, offsetX, offsetY, w, h, damage, knockback, duration) {
  const dir = owner.facing;
  const isPlayer = owner.is("player");
  const hb = add([
    rect(w, h),
    area(),
    pos(owner.pos.x + offsetX * dir, owner.pos.y + offsetY),
    anchor("center"),
    opacity(0),
    isPlayer ? "playerHitbox" : "enemyHitbox",
    { damage, knockback, owner },
  ]);

  wait(duration || 0.1, () => {
    destroy(hb);
  });

  if (isPlayer) {
    hb.onCollide("enemy", (enemy) => {
      if (enemy.invincible > 0 || enemy.dead) return;
      hitEnemy(enemy, damage, knockback, dir);
    });
    hb.onCollide("boss", (boss) => {
      if (boss.invincible > 0 || boss.dead) return;
      hitEnemy(boss, damage, knockback, dir);
    });
  } else {
    hb.onCollide("player", (player) => {
      if (player === owner) return;
      if (player.invincible > 0 || player.dead) return;
      player.hp -= damage;
      player.invincible = 0.3;
      player.hitTimer = 0.15;
      setHitPose(player);
      player.pos.x += -dir * knockback;
      screenShake(4, 0.12);
    });
  }

  return hb;
}

function hitEnemy(enemy, damage, knockback, dir) {
  enemy.hp -= damage;
  enemy.invincible = 0.3;
  enemy.hitTimer = 0.15;
  setHitPose(enemy);
  enemy.pos.x += -dir * knockback;
  screenShake(3, 0.1);

  // Hit flash - blink the character white
  let flash = 0;
  const flashInterval = enemy.onUpdate(() => {
    flash += dt();
    if (flash < 0.1) {
      for (const p of enemy.parts) {
        p.obj.color = flash % 0.05 < 0.025 ? INK : WHITE;
      }
    } else {
      for (const p of enemy.parts) {
        p.obj.color = WHITE;
      }
      flashInterval.cancel();
    }
  });

  // Hit spark effect
  spawnHitEffect(enemy.pos.x, enemy.pos.y - 10);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    events.emit("enemy-killed", enemy);
    destroy(enemy);
  }
}

function spawnHitEffect(x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(40, 100);
    const p = add([
      rect(4, 4),
      outline(2),
      color(INK),
      pos(x, y),
      move(vec2(Math.cos(angle), Math.sin(angle)).scale(speed)),
      lifespan(rand(0.15, 0.3)),
      anchor("center"),
    ]);
  }
}

// ============================================================
// EVENTS BUS
// ============================================================

const events = (() => {
  const listeners = {};
  return {
    on: (ev, fn) => {
      if (!listeners[ev]) listeners[ev] = [];
      listeners[ev].push(fn);
    },
    emit: (ev, data) => {
      if (listeners[ev]) for (const fn of listeners[ev]) fn(data);
    },
    clear: () => {
      for (const ev in listeners) delete listeners[ev];
    },
  };
})();

// ============================================================
// TITLE SCENE
// ============================================================

scene("title", () => {
  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);

  // Background
  add([rect(W, H), color(PAPER), fixed()]);

  // Decorative lines
  for (let i = 0; i < 8; i++) {
    add([
      rect(W - 40, 1),
      color(INK),
      pos(20, 30 + i * 55),
      opacity(0.2),
      fixed(),
    ]);
  }

  // Title
  add([
    text("WARZINE", { size: 80, font: "sans-serif" }),
    pos(W / 2, H / 3 - 20),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Subtitle
  add([
    text("BEAT 'EM UP", { size: 18, font: "sans-serif" }),
    pos(W / 2, H / 3 + 40),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Press SPACE
  let blink = 0;
  const pressText = add([
    text("PRESS SPACE TO FIGHT", { size: 16, font: "sans-serif" }),
    pos(W / 2, H * 0.65),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Controls
  add([
    text("P1: WASD + J/K     P2: ARROWS + 1/2", { size: 12, font: "sans-serif" }),
    pos(W / 2, H * 0.78),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // "Fanzine" decorative elements
  add([
    rect(160, 3),
    color(INK),
    pos(W / 2 - 80, H * 0.7),
    fixed(),
    z(10),
  ]);
  add([
    rect(120, 2),
    color(INK),
    pos(W / 2 - 60, H * 0.85),
    fixed(),
    z(10),
  ]);

  onUpdate(() => {
    blink += dt();
    pressText.opacity = blink % 1 < 0.6 ? 1 : 0.3;
  });

  onKeyPress("space", () => {
    go("game");
  });
});

// ============================================================
// GAME SCENE
// ============================================================

scene("game", () => {
  events.clear();

  // ---- STATE ----
  const state = {
    wave: 0,
    waveActive: false,
    enemiesThisWave: 0,
    enemiesKilled: 0,
    enemiesInWave: 0,
    bossSpawned: false,
    bossDefeated: false,
    gameOver: false,
    victory: false,
    paused: false,
    players: [],
    enemies: [],
    boss: null,
    time: 0,
  };

  // ---- BACKGROUND ----
  add([sprite("streetBg"), z(0)]);
  add([sprite("paperTex"), opacity(0.12), z(90), fixed()]);

  // ---- PLAYER CREATION ----
  function createPlayer(type, x, y, controls, tag) {
    const char = createCharacter(x, y, type, tag);
    state.players.push(char);

    char.controls = controls;
    char.attackCooldown = 0;
    char.walkTime = 0;
    char.isWalking = false;

    // Keep within bounds
    char.onUpdate(() => {
      if (char.dead) return;
      char.pos.x = clamp(char.pos.x, 30, W - 30);
      char.pos.y = clamp(char.pos.y, H - 180, H - 60);
    });

    // Movement
    const moveHandler = char.onUpdate(() => {
      if (char.dead || state.gameOver || state.victory) return;
      const c = controls;
      let dx = 0,
        dy = 0;
      if (keyIsDown(c.left)) dx -= 1;
      if (keyIsDown(c.right)) dx += 1;
      if (keyIsDown(c.up)) dy -= 1;
      if (keyIsDown(c.down)) dy += 1;

      if (char.hitTimer > 0) {
        char.hitTimer -= dt();
        char.invincible -= dt();
        return;
      }

      char.invincible = Math.max(0, char.invincible - dt());

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        char.move((dx / len) * char.speed, (dy / len) * char.speed);
        char.facing = dx < 0 ? -1 : dx > 0 ? 1 : char.facing;
        char.isWalking = true;
        char.walkTime += dt();
        setWalkPose(char, char.walkTime * 10);
      } else {
        char.isWalking = false;
        setIdlePose(char, state.time);
      }

      // Flip body parts based on facing
      for (const p of char.parts) {
        p.obj.pos.x = Math.abs(p.x0 - 0) * char.facing + (p.x0 < 0 ? -1 : 1 > 0 ? 1 : 1) * 0;
        // Actually simpler: just mirror the whole thing visually
      }
      char.scale.x = char.facing > 0 ? 1 : -1;
    });

    // Attack cooldown
    char.attackCooldown = 0;

    // Punch
    onKeyPress(c.punch, () => {
      if (char.dead || state.gameOver || state.victory) return;
      if (char.hitTimer > 0) return;
      if (char.attackCooldown > 0) return;

      char.attackCooldown = 0.3;
      char.comboCount++;
      char.comboTimer = 0.4;

      const dmg = char.comboCount >= 3 ? 25 : 12;
      setPunchPose(char);

      spawnHitbox(
        char,
        20,
        -5,
        18,
        14,
        dmg,
        char.comboCount >= 3 ? 200 : 100,
        0.08,
      );

      tween(0, 1, 0.06, () => {}, () => {
        if (!char.dead) resetPose(char);
      });
    });

    // Kick
    onKeyPress(c.kick, () => {
      if (char.dead || state.gameOver || state.victory) return;
      if (char.hitTimer > 0) return;
      if (char.attackCooldown > 0) return;

      char.attackCooldown = 0.4;
      char.comboCount = 0;
      setKickPose(char);

      const dmg = 18;
      spawnHitbox(char, 10, 10, 14, 20, dmg, 150, 0.1);

      tween(0, 1, 0.08, () => {}, () => {
        if (!char.dead) resetPose(char);
      });
    });

    // Combo timer
    char.comboTimer = 0;

    const comboHandler = char.onUpdate(() => {
      if (char.comboTimer > 0) {
        char.comboTimer -= dt();
        if (char.comboTimer <= 0) {
          char.comboCount = 0;
        }
      }
      if (char.attackCooldown > 0) char.attackCooldown -= dt();
    });

    return char;
  }

  // Create players
  const p1 = createPlayer("punkette", 150, H - 100, {
    left: "a", right: "d", up: "w", down: "s",
    punch: "j", kick: "k",
  }, "player");

  p1.playerId = 1;

  const p2 = createPlayer("antagonic", 250, H - 100, {
    left: "left", right: "right", up: "up", down: "down",
    punch: "1", kick: "2",
  }, "player");
  p2.playerId = 2;

  // ---- ENEMY SYSTEM ----
  function spawnEnemy(type, x, y) {
    const enemy = createCharacter(x, y, type, "enemy");
    state.enemies.push(enemy);
    state.enemiesThisWave++;

    enemy.attackCooldown = rand(0.5, 1.5);
    enemy.attackRange = type === "tough" ? 35 : 28;
    enemy.damage = type === "tough" ? 15 : type === "punk" ? 10 : 8;
    enemy.aiState = "chase";
    enemy.aiTimer = 0;
    enemy.facing = -1;
    enemy.walkTime = rand(0, 100);

    // Clamp position
    enemy.onUpdate(() => {
      if (enemy.dead) return;
      enemy.pos.x = clamp(enemy.pos.x, 30, W - 30);
      enemy.pos.y = clamp(enemy.pos.y, H - 180, H - 60);
    });

    // AI
    enemy.onUpdate(() => {
      if (enemy.dead || state.gameOver || state.victory) return;

      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= dt();
        enemy.invincible -= dt();
        return;
      }
      enemy.invincible = Math.max(0, enemy.invincible - dt());
      enemy.attackCooldown -= dt();
      enemy.aiTimer -= dt();

      // Find nearest player
      let target = null;
      let minDist = Infinity;
      for (const p of state.players) {
        if (p.dead) continue;
        const d = p.pos.dist(enemy.pos);
        if (d < minDist) {
          minDist = d;
          target = p;
        }
      }
      if (!target) return;

      const dx = target.pos.x - enemy.pos.x;
      const dy = target.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < enemy.attackRange && enemy.attackCooldown <= 0) {
        // Attack!
        enemy.aiState = "attack";
        enemy.attackCooldown = rand(0.8, 1.8);
        enemy.facing = dx > 0 ? 1 : -1;
        enemy.scale.x = enemy.facing;

        setPunchPose(enemy);
        spawnHitbox(
          enemy,
          16,
          -4,
          14,
          12,
          enemy.damage,
          80,
          0.08,
        );

        tween(0, 1, 0.05, () => {}, () => {
          if (!enemy.dead) resetPose(enemy);
        });
      } else {
        // Chase
        enemy.aiState = "chase";
        enemy.facing = dx > 0 ? 1 : -1;
        enemy.scale.x = enemy.facing;

        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          enemy.move((dx / len) * enemy.speed, (dy / len) * enemy.speed * 0.6);
          enemy.walkTime += dt();
          setWalkPose(enemy, enemy.walkTime * 10);
        }
      }
    });

    return enemy;
  }

  // ---- WAVE MANAGER ----
  const waveConfigs = [
    { enemies: [{ type: "grunt", count: 3 }], title: "WAVE 1" },
    { enemies: [{ type: "grunt", count: 2 }, { type: "punk", count: 2 }], title: "WAVE 2" },
    { enemies: [{ type: "grunt", count: 2 }, { type: "punk", count: 2 }, { type: "tough", count: 1 }], title: "WAVE 3" },
  ];

  function startWave(index) {
    if (index >= waveConfigs.length) {
      spawnBoss();
      return;
    }

    state.wave = index + 1;
    state.waveActive = true;
    state.enemiesKilled = 0;
    state.enemiesThisWave = 0;
    const config = waveConfigs[index];
    state.enemiesInWave = config.enemies.reduce((a, e) => a + e.count, 0);

    const waveText = add([
      text(config.title, { size: 32, font: "sans-serif" }),
      pos(W / 2, H / 2 - 30),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(1),
    ]);
    wait(1.5, () => destroy(waveText));
    tween(1, 0, 1.2, (v) => (waveText.opacity = v), undefined, easings.easeInQuad);

    const subText = add([
      text("GET READY", { size: 16, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
    ]);
    wait(1.5, () => destroy(subText));
    tween(1, 0, 1.2, (v) => (subText.opacity = v), undefined, easings.easeInQuad);

    const spawnList = [];
    for (const e of config.enemies) {
      for (let i = 0; i < e.count; i++) {
        spawnList.push(e.type);
      }
    }

    spawnList.forEach((type, i) => {
      wait(0.3 + i * 0.9, () => {
        if (state.gameOver || state.victory) return;
        const side = rand(0, 1) > 0.5 ? W - 30 : 30;
        spawnEnemy(type, side, H - 80 - rand(0, 40));
      });
    });
  }

  // ---- WAVE COMPLETION CHECK ----
  events.on("enemy-killed", (enemy) => {
    state.enemiesKilled++;
    // Remove from state.enemies list
    const idx = state.enemies.indexOf(enemy);
    if (idx >= 0) state.enemies.splice(idx, 1);

    if (state.enemiesKilled >= state.enemiesInWave && state.waveActive) {
      state.waveActive = false;

      if (state.wave < waveConfigs.length) {
        const w = state.wave;
        wait(2.0, () => {
          if (!state.bossSpawned) startWave(w);
        });
      } else {
        spawnBoss();
      }
    }
  });

  // ---- BOSS SYSTEM ----
  function spawnBoss() {
    if (state.bossSpawned) return;
    state.bossSpawned = true;

    // Warning text
    add([
      text("WARNING!", { size: 36, font: "sans-serif" }),
      pos(W / 2, H / 2 - 40),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      lifespan(2),
    ]);
    add([
      text("BOSS INCOMING", { size: 24, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      lifespan(2),
    ]);

    wait(1.5, () => {
      const boss = createCharacter(W / 2, H - 100, "boss", "boss");
      state.boss = boss;
      state.enemies.push(boss);

      boss.attackCooldown = rand(1.0, 2.0);
      boss.attackRange = 50;
      boss.damage = 20;
      boss.aiState = "chase";
      boss.facing = -1;
      boss.scale.x = -1;
      boss.walkTime = rand(0, 100);
      boss.phase = 1; // Phase 1 = normal, Phase 2 = enraged (< 50% HP)
      boss.attackPattern = 0;

      // Boss health bar (created in HUD)

      // Boss AI
      boss.onUpdate(() => {
        if (boss.dead || state.gameOver || state.victory) return;

        if (boss.hitTimer > 0) {
          boss.hitTimer -= dt();
          boss.invincible -= dt();
          return;
        }
        boss.invincible = Math.max(0, boss.invincible - dt());
        boss.attackCooldown -= dt();

        // Phase change
        if (boss.hp < boss.maxHp * 0.5 && boss.phase === 1) {
          boss.phase = 2;
          boss.speed *= 1.3;
          boss.attackCooldown = 0.5;
          // Visual feedback - flash
          screenShake(8, 0.3);
          spawnHitEffect(boss.pos.x, boss.pos.y - 20);
        }

        // Find nearest player
        let target = null;
        let minDist = Infinity;
        for (const p of state.players) {
          if (p.dead) continue;
          const d = p.pos.dist(boss.pos);
          if (d < minDist) {
            minDist = d;
            target = p;
          }
        }
        if (!target) return;

        const dx = target.pos.x - boss.pos.x;
        const dy = target.pos.y - boss.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        boss.facing = dx > 0 ? 1 : -1;
        boss.scale.x = boss.facing;

        if (dist < boss.attackRange && boss.attackCooldown <= 0) {
          boss.attackCooldown = boss.phase === 2 ? rand(0.6, 1.2) : rand(1.2, 2.0);
          boss.attackPattern = (boss.attackPattern + 1) % 3;

          if (boss.attackPattern === 0) {
            // Heavy punch
            setPunchPose(boss);
            screenShake(2, 0.05);
            spawnHitbox(boss, 28, -6, 24, 18, boss.damage * 1.2, 200, 0.12);
          } else if (boss.attackPattern === 1) {
            // Ground slam (area attack)
            setKickPose(boss);
            screenShake(5, 0.1);
            spawnHitbox(boss, 0, 16, 40, 20, boss.damage * 0.8, 120, 0.15);
            // Also spawn hitbox behind
            spawnHitbox(boss, -20, 16, 30, 20, boss.damage * 0.6, 100, 0.12);
          } else {
            // Charge attack
            const chargeDir = boss.facing;
            boss.move(chargeDir * 150, 0);
            spawnHitbox(boss, 10, -2, 30, 20, boss.damage, 180, 0.2);
            screenShake(3, 0.08);
          }

          tween(0, 1, 0.08, () => {}, () => {
            if (!boss.dead) resetPose(boss);
          });
        } else if (dist > boss.attackRange * 0.6) {
          // Chase
          boss.aiState = "chase";
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const spd = boss.phase === 2 ? boss.speed * 1.3 : boss.speed;
            boss.move((dx / len) * spd, (dy / len) * spd * 0.5);
            boss.walkTime += dt();
            setWalkPose(boss, boss.walkTime * 10);
          }
        }
      });

    });
  }

  // Check boss killed
  events.on("enemy-killed", (enemy) => {
    if (enemy === state.boss) {
      state.bossDefeated = true;
      state.boss = null;
      state.victory = true;

      add([
        text("VICTORY!", { size: 48, font: "sans-serif" }),
        pos(W / 2, H / 2 - 20),
        anchor("center"),
        color(INK),
        z(60),
        fixed(),
      ]);
      add([
        text("THE STREETS ARE FREE... FOR NOW", { size: 14, font: "sans-serif" }),
        pos(W / 2, H / 2 + 30),
        anchor("center"),
        color(INK),
        z(60),
        fixed(),
      ]);

      wait(3, () => go("title"));
    }
  });

  // ---- HUD ----
  function createHUD() {
    const hud = add([fixed(), z(95)]);

    // Paper strip at top
    hud.add([rect(W, 50), color(INK), pos(0, 0), opacity(0.85), fixed()]);
    hud.add([rect(W, 1), color(WHITE), pos(0, 50), fixed()]);

    // Player 1 health
    hud.add([
      text("PUNKETTE", { size: 10, font: "sans-serif" }),
      color(WHITE),
      pos(15, 6),
      fixed(),
    ]);
    const p1BarBg = hud.add([rect(120, 16), color(GRAY), pos(15, 20), fixed()]);
    const p1Bar = hud.add([rect(120, 16), color(WHITE), pos(15, 20), fixed()]);

    // Player 2 health
    hud.add([
      text("ANTAGONIC", { size: 10, font: "sans-serif" }),
      color(WHITE),
      pos(W - 135, 6),
      fixed(),
    ]);
    const p2BarBg = hud.add([rect(120, 16), color(GRAY), pos(W - 135, 20), fixed()]);
    const p2Bar = hud.add([rect(120, 16), color(WHITE), pos(W - 135, 20), fixed()]);

    // Wave indicator
    const waveLabel = hud.add([
      text("WAVE 1", { size: 12, font: "sans-serif" }),
      color(WHITE),
      pos(W / 2, 8),
      anchor("center"),
      fixed(),
    ]);

    // Boss health bar (hidden until boss spawns)
    const bossBarBg = hud.add([rect(300, 20), color(GRAY), pos(W / 2 - 150, 56), fixed(), opacity(0)]);
    const bossBar = hud.add([rect(300, 20), color(WHITE), pos(W / 2 - 150, 56), fixed(), opacity(0)]);
    const bossLabel = hud.add([
      text("BOSS", { size: 10, font: "sans-serif" }),
      color(WHITE),
      pos(W / 2, 50),
      anchor("center"),
      fixed(),
      opacity(0),
    ]);

    // Update loop
    return {
      update() {
        if (p1.dead) {
          p1Bar.width = 0;
        } else {
          p1Bar.width = (p1.hp / p1.maxHp) * 120;
        }

        if (p2.dead) {
          p2Bar.width = 0;
        } else {
          p2Bar.width = (p2.hp / p2.maxHp) * 120;
        }

        waveLabel.text = state.bossSpawned ? "BOSS FIGHT" : `WAVE ${state.wave}`;

        // Boss health bar
        if (state.boss && !state.boss.dead) {
          bossBarBg.opacity = 1;
          bossBar.opacity = 1;
          bossLabel.opacity = 1;
          bossBar.width = (state.boss.hp / state.boss.maxHp) * 300;
        } else {
          bossBarBg.opacity = 0;
          bossBar.opacity = 0;
          bossLabel.opacity = 0;
        }
      },
      destroy() {
        destroy(hud);
      },
    };
  }

  const hud = createHUD();

  // ---- GAME OVER CHECK ----
  function checkGameOver() {
    const allDead = state.players.every((p) => p.dead);
    if (allDead && !state.gameOver) {
      state.gameOver = true;
      wait(1, () => go("gameover"));
    }
  }

  // Player death handling
  for (const p of state.players) {
    p.onUpdate(() => {
      if (p.hp <= 0 && !p.dead) {
        p.dead = true;
        tween(0, 90, 0.3, (v) => {
          p.angle = v;
          p.pos.y += 1;
        });
        checkGameOver();
      }
    });
  }

  // ---- MAIN UPDATE ----
  onUpdate(() => {
    state.time += dt();
    hud.update();
  });

  // ---- START FIRST WAVE ----
  startWave(0);
});

// ============================================================
// GAME OVER SCENE
// ============================================================

scene("gameover", () => {
  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);
  add([rect(W, H), color(PAPER), fixed()]);

  // X mark
  add([
    text("X", { size: 120, font: "sans-serif" }),
    pos(W / 2, H / 3),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  add([
    text("GAME OVER", { size: 36, font: "sans-serif" }),
    pos(W / 2, H / 2 + 20),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  add([
    text("THE CITY HAS FALLEN", { size: 14, font: "sans-serif" }),
    pos(W / 2, H * 0.6),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  let blink = 0;
  const retry = add([
    text("PRESS SPACE TO RETRY", { size: 16, font: "sans-serif" }),
    pos(W / 2, H * 0.75),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  onUpdate(() => {
    blink += dt();
    retry.opacity = blink % 1 < 0.6 ? 1 : 0.3;
  });

  onKeyPress("space", () => go("game"));
});

// ============================================================
// START
// ============================================================

go("title");
