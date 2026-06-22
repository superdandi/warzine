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

const GRAVITY = 800;
const JUMP_FORCE = -300;

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
    const noise = Math.random() * 50;
    imgData.data[i] = noise;
    imgData.data[i + 1] = noise;
    imgData.data[i + 2] = noise;
    imgData.data[i + 3] = Math.random() < 0.25 ? 12 : 0;
  }
  ctx.putImageData(imgData, 0, 0);
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    ctx.lineWidth = Math.random() < 0.2 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.lineTo(Math.random() * W, Math.random() * H);
    ctx.stroke();
  }
  // Add some toner specks
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
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
  return [rect(w, h), outline(5), color(WHITE)];
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
  const F = tag === "boss" ? 3 : 2;
  const DS = F;

  const cfg = CHAR_CONFIG[type];

  const char = add([
    pos(x, y),
    rect(28 * F, 48 * F),
    area(),
    anchor("center"),
    scale(1),
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
      isAirborne: false,
      jumpVy: 0,
      jumpStartY: y,
      superCooldown: 0,
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
    outline(5),
    color(WHITE),
    pos(0, -bh / 2 - hh + 2),
    anchor("center"),
  ]);
  char.parts.push({ name: "head", obj: head, x0: 0, y0: -bh / 2 - hh + 2 });

  // Body
  const body = char.add([
    rect(bw, bh),
    outline(5),
    color(WHITE),
    pos(0, 0),
    anchor("center"),
  ]);
  char.parts.push({ name: "body", obj: body, x0: 0, y0: 0 });

  // Left arm
  const lArm = char.add([
    rect(aw, ah),
    outline(5),
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
    outline(5),
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
    outline(5),
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
    outline(5),
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
    // Hair spikes (scaled by DS)
    const hx = -bh / 2 - hh + 2;
    const spike = char.add([
      polygon([vec2(-8*DS, -2*DS), vec2(-14*DS, -10*DS), vec2(-4*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeL", obj: spike, x0: 0, y0: hx });
    const spike2 = char.add([
      polygon([vec2(0, -4*DS), vec2(0, -14*DS), vec2(4*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeT", obj: spike2, x0: 0, y0: hx });
    const spike3 = char.add([
      polygon([vec2(8*DS, -2*DS), vec2(14*DS, -10*DS), vec2(4*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeR", obj: spike3, x0: 0, y0: hx });
    // Side tail
    const tail = char.add([
      polygon([vec2(6*DS, -2*DS), vec2(12*DS, -6*DS), vec2(8*DS, 4*DS)]),
      outline(2), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "tail", obj: tail, x0: 0, y0: hx });
    // Jacket line
    char.add([rect(bw - 6, bh - 4), outline(2), color(WHITE), pos(0, 2), anchor("center")]);
    // Choker
    char.add([rect(bw * 0.5, 3 * DS), outline(2), color(WHITE), pos(0, -bh/2 - 2), anchor("center")]);
    // Angry eye
    const eye = char.add([
      rect(6*DS, 2*DS), color(INK),
      pos(4*DS, hx + 3*DS), anchor("center"), rotate(-15),
    ]);
    char.parts.push({ name: "eye", obj: eye, x0: 4*DS, y0: hx + 3*DS });
    // Boots
    const by = bh / 2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, by), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, by), anchor("center")]);
  }

  if (type === "antagonic") {
    const hx = -bh / 2 - hh + 2;
    // Gas mask visor
    char.add([rect(hw - 4, 5*DS), outline(3), color(WHITE), pos(0, hx - 2*DS), anchor("center")]);
    // Eye pieces (two circles with cross)
    for (const ex of [-4*DS, 4*DS]) {
      char.add([circle(3*DS), outline(3), color(WHITE), pos(ex, hx - 2*DS), anchor("center")]);
    }
    // Filter canister
    char.add([circle(5*DS), outline(3), color(WHITE), pos(0, hx + 5*DS), anchor("center")]);
    // Breathing tube
    char.add([rect(2*DS, 8*DS), outline(2), color(WHITE), pos(-hw/2 - 2*DS, hx), anchor("top"), rotate(20)]);
    // Shoulder pads (bigger)
    char.add([rect(8*DS, 8*DS), outline(3), color(WHITE), pos(-bw/2 - 5*DS, -bh/2 + 2), anchor("center")]);
    char.add([rect(8*DS, 8*DS), outline(3), color(WHITE), pos(bw/2 + 5*DS, -bh/2 + 2), anchor("center")]);
    // Belt pouches
    char.add([rect(6*DS, 4*DS), outline(2), color(WHITE), pos(-6*DS, bh/2), anchor("center")]);
    char.add([rect(6*DS, 4*DS), outline(2), color(WHITE), pos(6*DS, bh/2), anchor("center")]);
    // Boots
    const by = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, by), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, by), anchor("center")]);
  }

  if (type === "xero") {
    const hx = -bh / 2 - hh + 2;
    // Visor
    const visor = char.add([
      rect(hw + 2, 5*DS), outline(3), color(WHITE),
      pos(0, hx + 2*DS), anchor("center"),
    ]);
    char.parts.push({ name: "visor", obj: visor, x0: 0, y0: hx + 2*DS });
    // Cyber lines on body
    char.add([rect(4*DS, bh - 6), outline(2), color(WHITE), pos(-5*DS, 1), anchor("center")]);
    char.add([rect(4*DS, bh - 6), outline(2), color(WHITE), pos(5*DS, 1), anchor("center")]);
    // Cyber eye (red dot)
    const cEye = char.add([circle(2*DS), color(INK), pos(2*DS, hx + 2*DS), anchor("center")]);
    char.parts.push({ name: "cEye", obj: cEye, x0: 2*DS, y0: hx + 2*DS });
    // Bigger right arm (cyborg)
    rArm.width = aw * 1.5;
    rArm.height = ah * 1.2;
    char.parts.find((p) => p.name === "rArm").obj.width = aw * 1.5;
    char.parts.find((p) => p.name === "rArm").obj.height = ah * 1.2;
    // Boots
    const bx = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, bx), anchor("center")]);
  }

  if (type === "grunt") {
    const hx = -bh / 2 - hh + 2;
    // Spiky hair (scaled by DS)
    const h1 = char.add([
      polygon([vec2(-6*DS, -hh/2), vec2(-8*DS, -hh/2 - 6*DS), vec2(-2*DS, -hh/2)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "h1", obj: h1, x0: 0, y0: hx });
    // Boots
    const bx = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, bx), anchor("center")]);
  }

  if (type === "punk") {
    const hx = -bh / 2 - hh + 2;
    // Mohawk (scaled)
    const m1 = char.add([
      rect(6*DS, 14*DS), outline(3), color(WHITE),
      pos(0, hx - 7*DS), anchor("center"),
    ]);
    char.parts.push({ name: "mohawk", obj: m1, x0: 0, y0: hx - 7*DS });
    // Boots
    const bx = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, bx), anchor("center")]);
  }

  if (type === "tough") {
    const hx = -bh / 2 - hh + 2;
    // Forehead wrinkle
    char.add([rect(4*DS, 2*DS), color(INK), pos(0, hx + 2*DS), anchor("center")]);
    // Chest scar
    char.add([rect(2*DS, 8*DS), outline(2), color(WHITE), pos(0, 2), anchor("center")]);
    // Boots
    const bx = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, bx), anchor("center")]);
  }

  if (type === "boss") {
    const hx = -bh / 2 - hh + 2;
    // Horns (scaled by DS)
    const hornL = char.add([
      polygon([vec2(-8*DS, -6*DS), vec2(-12*DS, -16*DS), vec2(-4*DS, -8*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "hornL", obj: hornL, x0: 0, y0: hx });
    const hornR = char.add([
      polygon([vec2(8*DS, -6*DS), vec2(12*DS, -16*DS), vec2(4*DS, -8*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "hornR", obj: hornR, x0: 0, y0: hx });
    // Chest scar
    char.add([rect(4*DS, 12*DS), outline(2), color(WHITE), pos(0, 2), anchor("center")]);
    // Angry eyes
    char.add([rect(4*DS, 2*DS), color(INK), pos(-6*DS, hx + 4*DS), anchor("center"), rotate(-10)]);
    char.add([rect(4*DS, 2*DS), color(INK), pos(6*DS, hx + 4*DS), anchor("center"), rotate(10)]);
    // Boots
    const bx = bh/2 + lh - lh * 0.15;
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(-lw/2 - 1, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.3)), outline(3), color(WHITE), pos(lw/2 + 1, bx), anchor("center")]);
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
    rArm.obj.pos = vec2(rArm.x0 + 24, rArm.y0 - 4);
    rArm.obj.angle = 0;
  }
  const lArm = char.parts.find((p) => p.name === "lArm");
  if (lArm) {
    lArm.obj.pos = vec2(lArm.x0, lArm.y0 + 8);
  }
  // Lean forward slightly
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0 + 6, body.y0);
}

function setKickPose(char) {
  resetPose(char);
  const rLeg = char.parts.find((p) => p.name === "rLeg");
  if (rLeg) {
    rLeg.obj.pos = vec2(rLeg.x0 + 12, rLeg.y0 - 12);
    rLeg.obj.angle = 30;
  }
  // Lean back
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0 - 6, body.y0);
}

function setHitPose(char) {
  resetPose(char);
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0, body.y0 + 4);
  const head = char.parts.find((p) => p.name === "head");
  if (head) head.obj.pos = vec2(head.x0, head.y0 + 4);
}

function setWalkPose(char, t) {
  const lLeg = char.parts.find((p) => p.name === "lLeg");
  const rLeg = char.parts.find((p) => p.name === "rLeg");
  const lArm = char.parts.find((p) => p.name === "lArm");
  const rArm = char.parts.find((p) => p.name === "rArm");
  const swing = Math.sin(t * 0.15) * 12;
  if (lLeg) lLeg.obj.pos = vec2(lLeg.x0, lLeg.y0 + swing);
  if (rLeg) rLeg.obj.pos = vec2(rLeg.x0, rLeg.y0 - swing);
  if (lArm) lArm.obj.pos = vec2(lArm.x0, lArm.y0 - swing * 0.5);
  if (rArm) rArm.obj.pos = vec2(rArm.x0, rArm.y0 + swing * 0.5);
}

function setIdlePose(char, t) {
  const body = char.parts.find((p) => p.name === "body");
  if (body) body.obj.pos = vec2(body.x0, body.y0 + Math.sin(t * 0.05) * 2);
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
      screenShake(4, 0.12);
      if (curState) curState.hitPause = 0.04;
      wait(0.02, () => {
        if (!player.dead) player.pos.x += -dir * knockback;
      });
    });
  }

  return hb;
}

function hitEnemy(enemy, damage, knockback, dir) {
  enemy.hp -= damage;
  enemy.invincible = 0.3;
  enemy.hitTimer = 0.15;
  setHitPose(enemy);
  screenShake(3, 0.1);

  // Hitpause
  if (curState) curState.hitPause = 0.04;

  // Knockback (delayed slightly for hitpause feel)
  wait(0.02, () => {
    if (!enemy.dead) enemy.pos.x += -dir * knockback;
  });

  // Hit flash
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
  spawnInkSplat(enemy.pos.x, enemy.pos.y - 10);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    events.emit("enemy-killed", enemy);
    destroy(enemy);
  }
}

function spawnHitEffect(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(60, 140);
    const p = add([
      rect(8, 8),
      outline(3),
      color(INK),
      pos(x, y),
      move(vec2(Math.cos(angle), Math.sin(angle)).scale(speed)),
      opacity(1),
      lifespan(rand(0.3, 0.6)),
      anchor("center"),
    ]);
  }
}

function spawnAttackArc(x, y, dir) {
  for (let i = 0; i < 3; i++) {
    add([
      rect(20, 3),
      outline(2),
      color(INK),
      pos(x + dir * (10 + i * 6), y + rand(-4, 4)),
      anchor("center"),
      opacity(1),
      lifespan(0.1),
    ]);
  }
}

function spawnInkSplat(x, y) {
  for (let i = 0; i < 5; i++) {
    add([
      circle(rand(3, 8)),
      color(INK),
      pos(x + rand(-12, 12), y + rand(-12, 12)),
      opacity(0.6),
      lifespan(rand(0.3, 0.7)),
      anchor("center"),
    ]);
  }
}

function spawnWalkDust(x, y, dir) {
  add([
    rect(rand(3, 6), rand(3, 6)),
    color(INK),
    pos(x + dir * rand(-4, 4), y + 20),
    opacity(0.4),
    move(vec2(-dir * rand(20, 50), 0)),
    lifespan(rand(0.15, 0.3)),
    anchor("center"),
  ]);
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

let curState = null;

// ============================================================
// TITLE SCENE
// ============================================================

scene("title", () => {
  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);

  // Background
  add([rect(W, H), color(PAPER), fixed()]);

  // Animated decorative lines (scanlines style)
  for (let i = 0; i < 12; i++) {
    const y = 20 + i * 38;
    const line = add([
      rect(W - 40, 1),
      color(INK),
      pos(20, y),
      opacity(rand(0.1, 0.3)),
      fixed(),
    ]);
    // Slight drift
    onUpdate(() => {
      line.opacity = 0.15 + Math.sin(stateTime * 0.5 + i) * 0.1;
    });
  }

  // Title with drift
  const title = add([
    text("WARZINE", { size: 80, font: "sans-serif" }),
    pos(W / 2, H / 3 - 20),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);
  onUpdate(() => {
    title.pos.x = W / 2 + Math.sin(stateTime * 0.5) * 3;
    title.pos.y = H / 3 - 20 + Math.sin(stateTime * 0.7) * 2;
  });

  // Subtitle
  add([
    text("BEAT 'EM UP", { size: 18, font: "sans-serif" }),
    pos(W / 2, H / 3 + 40),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Decorative arrows
  add([text("< >", { size: 24, font: "sans-serif" }), pos(W / 2, H / 3 + 65), anchor("center"), color(INK), fixed(), z(10)]);

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
  const ctrlText = add([
    text("P1: WASD + J/K     P2: ARROWS + 1/2", { size: 12, font: "sans-serif" }),
    pos(W / 2, H * 0.78),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Decorative lines
  add([rect(180, 3), color(INK), pos(W / 2 - 90, H * 0.7), fixed(), z(10)]);
  add([rect(140, 2), color(INK), pos(W / 2 - 70, H * 0.85), fixed(), z(10)]);

  // Version
  add([
    text("v1.0", { size: 10, font: "sans-serif" }),
    pos(W - 30, H - 15), anchor("center"), color(INK), fixed(), z(10),
  ]);

  onUpdate(() => {
    blink += dt();
    pressText.opacity = blink % 1 < 0.6 ? 1 : 0.3;
    ctrlText.opacity = 0.5 + Math.sin(blink * 0.3) * 0.3;
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
    hitPause: 0,
    paused: false,
    players: [],
    enemies: [],
    boss: null,
    time: 0,
  };
  curState = state;

  // ---- BACKGROUND ----
  add([sprite("streetBg"), z(0)]);
  add([sprite("paperTex"), opacity(0.18), z(90), fixed()]);

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
      if (char.dead || state.hitPause > 0) return;
      char.pos.x = clamp(char.pos.x, 30, W - 30);
      if (!char.isAirborne) {
        char.pos.y = clamp(char.pos.y, H - 180, H - 60);
      }
    });

    // Gravity
    const gravityHandler = char.onUpdate(() => {
      if (char.dead || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.isAirborne) {
        char.jumpVy += GRAVITY * dt();
        char.pos.y += char.jumpVy * dt();
        if (char.pos.y >= char.jumpStartY) {
          char.pos.y = char.jumpStartY;
          char.jumpVy = 0;
          char.isAirborne = false;
        }
      }
      if (char.superCooldown > 0) char.superCooldown -= dt();
    });

    // Movement (8-dir)
    const moveHandler = char.onUpdate(() => {
      if (char.dead || state.gameOver || state.victory || state.hitPause > 0) return;
      const c = controls;
      let dx = 0,
        dy = 0;
      if (isKeyDown(c.left)) dx -= 1;
      if (isKeyDown(c.right)) dx += 1;
      if (!char.isAirborne) {
        if (isKeyDown(c.up)) dy -= 1;
        if (isKeyDown(c.down)) dy += 1;
      }

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
        if (!char.isAirborne && Math.random() < 0.08) {
          spawnWalkDust(char.pos.x, char.pos.y, char.facing);
        }
      } else {
        char.isWalking = false;
        setIdlePose(char, state.time);
      }

      char.scale.x = char.facing > 0 ? 1 : -1;
    });

    // Attack cooldown
    char.attackCooldown = 0;

    // Punch / Super / Air attack
    onKeyPress(controls.punch, () => {
      if (char.dead || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.attackCooldown > 0) return;

      // Super attack (A+B)
      if (isKeyDown(controls.jump) && char.superCooldown <= 0) {
        char.superCooldown = 2;
        char.attackCooldown = 0.5;
        screenShake(10, 0.25);
        spawnHitbox(char, 0, -10, 60, 50, 35, 300, 0.2);
        spawnHitbox(char, -25, -5, 25, 35, 20, 180, 0.15);
        spawnHitbox(char, 25, -5, 25, 35, 20, 180, 0.15);
        setKickPose(char);
        tween(0, 1, 0.12, () => {}, () => {
          if (!char.dead) resetPose(char);
        });
        spawnHitEffect(char.pos.x, char.pos.y - 10);
        spawnHitEffect(char.pos.x - 20, char.pos.y - 5);
        spawnHitEffect(char.pos.x + 20, char.pos.y - 5);
        spawnHitEffect(char.pos.x, char.pos.y + 10);
        spawnHitEffect(char.pos.x - 25, char.pos.y);
        spawnHitEffect(char.pos.x + 25, char.pos.y);
        spawnAttackArc(char.pos.x + 30 * char.facing, char.pos.y - 10, char.facing);
        return;
      }

      // Air attack
      if (char.isAirborne) {
        char.attackCooldown = 0.3;
        setKickPose(char);
        spawnHitbox(char, 5, 20, 20, 18, 15, 120, 0.08);
        spawnAttackArc(char.pos.x + 10 * char.facing, char.pos.y + 15, char.facing);
        tween(0, 1, 0.06, () => {}, () => {
          if (!char.dead) resetPose(char);
        });
        return;
      }

      // Normal punch (ground combo)
      char.attackCooldown = 0.3;
      char.comboCount++;
      char.comboTimer = 0.25;

      const dmg = char.comboCount >= 3 ? 28 : 12;
      setPunchPose(char);

      spawnHitbox(
        char,
        24,
        -5,
        22,
        18,
        dmg,
        char.comboCount >= 3 ? 300 : 100,
        0.08,
      );

      spawnAttackArc(char.pos.x + 26 * char.facing, char.pos.y - 5, char.facing);
      tween(0, 1, 0.06, () => {}, () => {
        if (!char.dead) resetPose(char);
      });
    });

    // Jump
    onKeyPress(controls.jump, () => {
      if (char.dead || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.isAirborne) return;

      char.isAirborne = true;
      char.jumpVy = JUMP_FORCE;
      char.jumpStartY = char.pos.y;
    });

    // Combo timer
    char.comboTimer = 0;

    const comboHandler = char.onUpdate(() => {
      if (state.hitPause > 0) return;
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
    punch: "j", jump: "k",
  }, "player");

  p1.playerId = 1;

  const p2 = createPlayer("antagonic", 250, H - 100, {
    left: "left", right: "right", up: "up", down: "down",
    punch: "1", jump: "2",
  }, "player");
  p2.playerId = 2;

  // ---- ENEMY SYSTEM ----
  function spawnEnemy(type, x, y) {
    const enemy = createCharacter(x, y, type, "enemy");
    state.enemies.push(enemy);
    state.enemiesThisWave++;

    enemy.attackCooldown = rand(0.5, 1.5);
    enemy.attackRange = type === "tough" ? 35 : 28;
    enemy.damage = type === "tough" ? 18 : type === "punk" ? 10 : 8;
    enemy.speed = type === "tough" ? 130 : type === "punk" ? 170 : 150;
    enemy.aiState = "chase";
    enemy.aiTimer = 0;
    enemy.facing = -1;
    enemy.walkTime = rand(0, 100);

    // Clamp position
    enemy.onUpdate(() => {
      if (enemy.dead || state.hitPause > 0) return;
      enemy.pos.x = clamp(enemy.pos.x, 30, W - 30);
      enemy.pos.y = clamp(enemy.pos.y, H - 180, H - 60);
    });

    // AI
    enemy.onUpdate(() => {
      if (enemy.dead || state.gameOver || state.victory || state.hitPause > 0) return;

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

      // Push away from nearby enemies (anti-stack)
      let repelX = 0, repelY = 0;
      for (const other of state.enemies) {
        if (other === enemy || other.dead) continue;
        const d = enemy.pos.dist(other.pos);
        if (d < 40) {
          repelX += (enemy.pos.x - other.pos.x) / d;
          repelY += (enemy.pos.y - other.pos.y) / d;
        }
      }

      const dx = target.pos.x - enemy.pos.x + repelX * 20;
      const dy = target.pos.y - enemy.pos.y + repelY * 20;
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
        spawnAttackArc(enemy.pos.x + 20 * enemy.facing, enemy.pos.y - 5, enemy.facing);

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
    { enemies: [{ type: "grunt", count: 3 }, { type: "punk", count: 1 }], title: "WAVE 1" },
    { enemies: [{ type: "grunt", count: 2 }, { type: "punk", count: 2 }, { type: "tough", count: 1 }], title: "WAVE 2" },
    { enemies: [{ type: "grunt", count: 3 }, { type: "punk", count: 3 }, { type: "tough", count: 2 }], title: "WAVE 3" },
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

    // Wave transition flash
    const flash = add([rect(W, H), color(INK), fixed(), opacity(0), z(45)]);
    tween(0, 0.3, 0.1, (v) => (flash.opacity = v), () => {
      tween(0.3, 0, 0.15, (v) => (flash.opacity = v), () => destroy(flash));
    });

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
      opacity(1),
      lifespan(2),
    ]);
    add([
      text("BOSS INCOMING", { size: 24, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(1),
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
        if (boss.dead || state.gameOver || state.victory || state.hitPause > 0) return;

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
          boss.invincible = 1.5;
          // Visual feedback - flash
          screenShake(10, 0.5);
          spawnHitEffect(boss.pos.x, boss.pos.y - 20);
          spawnInkSplat(boss.pos.x, boss.pos.y);
          spawnHitEffect(boss.pos.x - 30, boss.pos.y);
          spawnHitEffect(boss.pos.x + 30, boss.pos.y);
          // Brief charge-up animation
          boss.attackCooldown = 1.5;
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
          const maxPattern = boss.phase === 2 ? 4 : 2;
          boss.attackCooldown = boss.phase === 2 ? rand(0.6, 1.2) : rand(1.2, 2.0);
          boss.attackPattern = (boss.attackPattern + 1) % (maxPattern + 1);

          if (boss.attackPattern === 0) {
            // Heavy punch
            setPunchPose(boss);
            screenShake(2, 0.05);
            spawnHitbox(boss, 28, -6, 24, 18, boss.damage * 1.2, 200, 0.12);
            spawnAttackArc(boss.pos.x + 30 * boss.facing, boss.pos.y - 5, boss.facing);
          } else if (boss.attackPattern === 1) {
            // Ground slam (area attack)
            setKickPose(boss);
            screenShake(5, 0.1);
            spawnHitbox(boss, 0, 16, 40, 20, boss.damage * 0.8, 120, 0.15);
            spawnHitbox(boss, -20, 16, 30, 20, boss.damage * 0.6, 100, 0.12);
            spawnHitEffect(boss.pos.x, boss.pos.y + 10);
            spawnHitEffect(boss.pos.x - 15, boss.pos.y + 5);
            spawnHitEffect(boss.pos.x + 15, boss.pos.y + 5);
          } else if (boss.attackPattern === 2) {
            // Charge attack
            const chargeDir = boss.facing;
            boss.move(chargeDir * 150, 0);
            spawnHitbox(boss, 10, -2, 30, 20, boss.damage, 180, 0.2);
            screenShake(3, 0.08);
            spawnAttackArc(boss.pos.x + 20 * boss.facing, boss.pos.y - 5, boss.facing);
          } else if (boss.attackPattern === 3 && boss.phase === 2) {
            // Ground pound (requires jump to dodge)
            screenShake(8, 0.2);
            spawnHitbox(boss, -30, 24, 60, 30, boss.damage * 0.7, 80, 0.2);
            spawnHitEffect(boss.pos.x - 20, boss.pos.y + 15);
            spawnHitEffect(boss.pos.x, boss.pos.y + 20);
            spawnHitEffect(boss.pos.x + 20, boss.pos.y + 15);
          } else if (boss.attackPattern === 4 && boss.phase === 2) {
            // Double swipe (two quick hitboxes)
            setPunchPose(boss);
            spawnHitbox(boss, 24, -4, 20, 16, boss.damage * 0.6, 120, 0.06);
            wait(0.12, () => {
              if (!boss.dead) {
                setPunchPose(boss);
                spawnHitbox(boss, 24, -4, 20, 16, boss.damage * 0.6, 120, 0.06);
              }
            });
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

  // ---- PAUSE ----
  onKeyPress("escape", () => {
    state.paused = !state.paused;
  });

  // ---- MAIN UPDATE ----
  onUpdate(() => {
    if (state.paused) return;
    if (state.hitPause > 0) state.hitPause -= dt();
    state.time += dt();
    hud.update();
  });

  // Pause overlay
  onUpdate(() => {
    if (state.paused) {
      if (!state.pauseUI) {
        state.pauseUI = add([fixed(), z(100)]);
        state.pauseUI.add([rect(W, H), color(INK), opacity(0.5)]);
        state.pauseUI.add([
          text("PAUSED", { size: 48, font: "sans-serif" }),
          pos(W / 2, H / 2 - 20), anchor("center"), color(WHITE), fixed(), z(101),
        ]);
        state.pauseUI.add([
          text("PRESS ESC TO CONTINUE", { size: 14, font: "sans-serif" }),
          pos(W / 2, H / 2 + 30), anchor("center"), color(WHITE), fixed(), z(101),
        ]);
      }
    } else if (state.pauseUI) {
      destroy(state.pauseUI);
      state.pauseUI = null;
    }
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
