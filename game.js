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
// SOUND SYSTEM (Web Audio API — sin archivos externos)
// ============================================================

let soundCtx = null;
let soundEnabled = true;
let musicNodes = [];

function initAudio() {
  if (!soundCtx) {
    try {
      soundCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      soundEnabled = false;
    }
  }
  if (soundCtx && soundCtx.state === "suspended") soundCtx.resume();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) stopMusic();
  return soundEnabled;
}

function playNoise(duration, volume, filterFreq, filterType) {
  if (!soundEnabled) return;
  initAudio();
  const bufSize = soundCtx.sampleRate * duration;
  const buf = soundCtx.createBuffer(1, bufSize, soundCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = soundCtx.createBufferSource();
  src.buffer = buf;
  const gain = soundCtx.createGain();
  gain.gain.setValueAtTime(volume, soundCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, soundCtx.currentTime + duration);
  const filter = soundCtx.createBiquadFilter();
  filter.type = filterType || "lowpass";
  filter.frequency.setValueAtTime(filterFreq || 2000, soundCtx.currentTime);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(soundCtx.destination);
  src.start();
  src.stop(soundCtx.currentTime + duration);
}

function playTone(freq, duration, volume, type, sweep) {
  if (!soundEnabled) return;
  initAudio();
  const osc = soundCtx.createOscillator();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(freq, soundCtx.currentTime);
  if (sweep) osc.frequency.exponentialRampToValueAtTime(sweep, soundCtx.currentTime + duration);
  const gain = soundCtx.createGain();
  gain.gain.setValueAtTime(volume || 0.3, soundCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, soundCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(soundCtx.destination);
  osc.start();
  osc.stop(soundCtx.currentTime + duration);
}

// Sound effects
function sfxHit() { playNoise(0.08, 0.4, 3000, "lowpass"); playTone(80, 0.06, 0.3, "square"); }

function sfxHitPlayer() { playNoise(0.06, 0.3, 1500, "lowpass"); playTone(60, 0.08, 0.25, "sawtooth"); }

function sfxJump() { playTone(200, 0.15, 0.2, "square", 600); }

function sfxSuper() {
  playNoise(0.2, 0.5, 4000, "bandpass");
  playTone(120, 0.25, 0.4, "sawtooth", 40);
  playTone(80, 0.15, 0.3, "square");
}

function sfxDodge() { playNoise(0.12, 0.2, 800, "highpass"); }

function sfxKill() { playNoise(0.15, 0.5, 500, "lowpass"); playTone(50, 0.2, 0.4, "sine"); }

function sfxPlayerDeath() { playTone(400, 0.3, 0.3, "sawtooth", 40); playTone(200, 0.2, 0.2, "square"); }

function sfxRevive() {
  playTone(300, 0.12, 0.25, "square", 600);
  setTimeout(() => playTone(500, 0.12, 0.25, "square", 800), 80);
  setTimeout(() => playTone(700, 0.15, 0.3, "square", 900), 160);
}

function sfxWave() { playTone(600, 0.1, 0.2, "square"); setTimeout(() => playTone(800, 0.15, 0.3, "square"), 120); }

function sfxBossWarning() {
  playTone(100, 0.4, 0.5, "sawtooth", 50);
  setTimeout(() => playTone(80, 0.5, 0.5, "sawtooth"), 300);
  playNoise(0.6, 0.3, 300, "lowpass");
}

function sfxBossDeath() { playTone(300, 0.3, 0.4, "square", 900); setTimeout(() => sfxVictory(), 200); }

function sfxVictory() {
  [400, 500, 600, 800].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 0.3, "square"), i * 120);
  });
}

function sfxGameOver() {
  playTone(300, 0.3, 0.3, "sawtooth", 50);
  setTimeout(() => playTone(200, 0.3, 0.25, "sawtooth", 30), 250);
  setTimeout(() => playTone(100, 0.5, 0.2, "sawtooth"), 500);
}

function sfxItemPickup() { playTone(800, 0.08, 0.2, "square"); setTimeout(() => playTone(1000, 0.1, 0.25, "square"), 60); }

function sfxCombo() { playTone(500 + Math.random() * 400, 0.08, 0.15, "square"); }

function sfxMenuSelect() { playTone(700, 0.06, 0.15, "square"); }

// Background music: drum & bass loop
let musicInterval = null;

function startMusic() {
  if (!soundEnabled || musicInterval) return;
  initAudio();
  let beat = 0;
  const BPM = 120;
  const interval = (60 / BPM) * 1000;

  function kick() {
    const osc = soundCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, soundCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, soundCtx.currentTime + 0.1);
    const gain = soundCtx.createGain();
    gain.gain.setValueAtTime(0.4, soundCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, soundCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(soundCtx.destination);
    osc.start();
    osc.stop(soundCtx.currentTime + 0.2);
  }

  function snare() {
    playNoise(0.08, 0.25, 2000, "highpass");
    playTone(180, 0.06, 0.15, "triangle");
  }

  function hihat() {
    playNoise(0.03, 0.1, 8000, "highpass");
  }

  musicNodes = [kick, snare, hihat];
  musicInterval = setInterval(() => {
    if (!soundEnabled) return;
    if (soundCtx.state === "suspended") soundCtx.resume();
    // 4/4 beat
    if (beat % 4 === 0) kick();
    if (beat % 4 === 2) kick();
    if (beat % 8 === 3 || beat % 8 === 7) snare();
    if (beat % 2 === 1) hihat();
    // Bass on every 4th beat
    if (beat % 8 === 0) playTone(110, 0.3, 0.1, "square");
    if (beat % 8 === 4) playTone(82, 0.3, 0.1, "square");
    beat = (beat + 1) % 16;
  }, interval / 2);
}

function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

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
// PARALLAX BACKGROUND GENERATORS
// ============================================================

const BG_W = 1600;

function bgCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.ctx = c.getContext("2d");
  return c;
}

function generateBgLayer(type, layer) {
  const c = bgCanvas(BG_W, H);
  const ctx = c.ctx;

  if (type === "street") {
    if (layer === 0) {
      // Far: sky + silhouette distant buildings
      ctx.fillStyle = "#dad5c5";
      ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#e6e0d0";
      const bldgs = [
        [30, 30, 100, 180], [180, 50, 80, 160], [300, 20, 130, 190],
        [470, 40, 90, 170], [600, 60, 90, 150], [750, 25, 120, 185],
        [920, 45, 80, 165], [1050, 35, 110, 175], [1220, 55, 80, 155],
        [1380, 30, 100, 180],
      ];
      for (const [bx, by, bw, bh] of bldgs) {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        for (let wy = by + 15; wy < by + bh - 15; wy += 25) {
          for (let wx = bx + 8; wx < bx + bw - 12; wx += 20) {
            ctx.strokeRect(wx, wy, 8, 12);
          }
        }
      }
    } else if (layer === 1) {
      // Mid: closer buildings with details
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.fillStyle = "#f5f0e0";
      const bldgs = [
        [-20, 15, 140, 195], [150, 35, 110, 175], [290, 10, 160, 200],
        [480, 25, 100, 185], [610, 45, 110, 165], [760, 20, 140, 190],
        [940, 30, 100, 180], [1080, 15, 130, 195], [1260, 40, 100, 170],
        [1400, 25, 120, 185],
      ];
      for (const [bx, by, bw, bh] of bldgs) {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        for (let wy = by + 18; wy < by + bh - 18; wy += 32) {
          for (let wx = bx + 12; wx < bx + bw - 18; wx += 28) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(wx, wy, 14, 18);
            ctx.strokeRect(wx, wy, 14, 18);
            ctx.fillStyle = "#f5f0e0";
          }
        }
        // Rooftop antenna
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2 - 5, by);
        ctx.lineTo(bx + bw / 2 - 5, by - 20);
        ctx.lineTo(bx + bw / 2 + 5, by - 20);
        ctx.lineTo(bx + bw / 2 + 5, by);
        ctx.stroke();
        ctx.strokeRect(bx + bw / 2 - 3, by - 25, 6, 5);
      }
    } else if (layer === 2) {
      // Foreground: ground, road, details
      ctx.fillStyle = "#d4cfc0";
      ctx.fillRect(0, H - 80, BG_W, 80);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, H - 80, BG_W, 80);
      // Road lines
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, H - 40);
      ctx.lineTo(BG_W, H - 40);
      ctx.stroke();
      ctx.setLineDash([]);
      // Graffiti
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const gx = 40 + i * 140;
        const gy = H - 130 + (i % 3) * 10;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + 20, gy - 15);
        ctx.lineTo(gx + 40, gy + 5);
        ctx.lineTo(gx + 60, gy - 10);
        ctx.lineTo(gx + 80, gy + 10);
        ctx.stroke();
      }
      // Manhole covers
      for (let i = 0; i < 4; i++) {
        const mx = 120 + i * 350;
        ctx.strokeRect(mx, H - 55, 30, 30);
        ctx.strokeRect(mx + 2, H - 53, 26, 26);
      }
    }
  } else if (type === "rooftop") {
    if (layer === 0) {
      // Far: night sky + distant city silhouette
      ctx.fillStyle = "#c8c4b4";
      ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#ddd8c8";
      const bldgs = [
        [20, 60, 90, 150], [140, 80, 80, 130], [250, 50, 110, 160],
        [390, 70, 80, 140], [500, 55, 100, 155], [640, 75, 90, 135],
        [760, 45, 120, 165], [920, 65, 90, 145], [1050, 50, 100, 160],
        [1200, 70, 80, 140], [1320, 55, 110, 155], [1460, 65, 100, 145],
      ];
      for (const [bx, by, bw, bh] of bldgs) {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        for (let wy = by + 12; wy < by + bh - 12; wy += 22) {
          for (let wx = bx + 6; wx < bx + bw - 10; wx += 18) {
            ctx.strokeRect(wx, wy, 8, 12);
          }
        }
      }
      // Moon
      ctx.beginPath();
      ctx.arc(200, 80, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(190, 75, 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (layer === 1) {
      // Mid: rooftop structures, water towers
      ctx.fillStyle = "#f0ebda";
      ctx.fillRect(0, H - 180, BG_W, 180);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      // Roof edge line
      ctx.beginPath();
      ctx.moveTo(0, H - 180);
      ctx.lineTo(BG_W, H - 180);
      ctx.stroke();
      // Rooftop structures
      const structs = [
        [20, H - 200, 80, 20], [130, H - 210, 60, 30], [220, H - 195, 100, 15],
        [360, H - 215, 70, 35], [470, H - 200, 90, 20], [590, H - 205, 70, 25],
        [700, H - 195, 110, 15], [850, H - 210, 70, 30], [960, H - 200, 80, 20],
        [1080, H - 215, 60, 35], [1200, H - 195, 90, 15], [1330, H - 205, 80, 25],
        [1450, H - 200, 100, 20],
      ];
      for (const [sx, sy, sw, sh] of structs) {
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
      }
      // Water tower
      for (let i = 0; i < 3; i++) {
        const wx = 50 + i * 500;
        ctx.strokeRect(wx, H - 235, 40, 50);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx + 4, H - 235);
        ctx.lineTo(wx + 4, H - 250);
        ctx.moveTo(wx + 36, H - 235);
        ctx.lineTo(wx + 36, H - 250);
        ctx.moveTo(wx - 5, H - 250);
        ctx.lineTo(wx + 45, H - 250);
        ctx.stroke();
        ctx.lineWidth = 3;
      }
      // Clothes lines
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const lx = 40 + i * 350;
        ctx.beginPath();
        ctx.moveTo(lx, H - 160);
        ctx.lineTo(lx + 70, H - 155);
        ctx.stroke();
        ctx.strokeRect(lx + 10, H - 162, 8, 10);
        ctx.strokeRect(lx + 30, H - 158, 8, 12);
        ctx.strokeRect(lx + 50, H - 160, 8, 8);
      }
      ctx.lineWidth = 3;
    } else if (layer === 2) {
      // Foreground: roof tiles + edge
      ctx.fillStyle = "#d4cfc0";
      ctx.fillRect(0, 0, BG_W, H);
      // Roof tiles pattern
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 20; col++) {
          const tx = col * 80 + (row % 2) * 40;
          const ty = row * 20 + H - 160;
          ctx.strokeRect(tx, ty, 80, 20);
        }
      }
      ctx.lineWidth = 3;
      // AC units
      for (let i = 0; i < 5; i++) {
        const ax = 60 + i * 320;
        ctx.strokeRect(ax, H - 130, 50, 30);
        ctx.lineWidth = 1;
        for (let f = 0; f < 4; f++) {
          ctx.strokeRect(ax + 5 + f * 11, H - 125, 8, 20);
        }
        ctx.lineWidth = 3;
      }
      // Railing edge
      ctx.beginPath();
      ctx.moveTo(0, H - 80);
      ctx.lineTo(BG_W, H - 80);
      ctx.stroke();
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 55, H - 80);
        ctx.lineTo(i * 55, H - 65);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, H - 65);
      ctx.lineTo(BG_W, H - 65);
      ctx.stroke();
      ctx.fillStyle = "#e0dbcb";
      ctx.fillRect(0, H - 65, BG_W, 65);
      ctx.strokeRect(0, H - 65, BG_W, 65);
    }
  } else if (type === "factory") {
    if (layer === 0) {
      ctx.fillStyle = "#c0baaa";
      ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#d5d0c0";
      const chimneys = [
        [40, 40, 60, 170], [140, 70, 50, 140], [230, 30, 80, 180],
        [360, 55, 60, 155], [470, 45, 70, 165], [580, 35, 90, 175],
        [720, 60, 50, 150], [820, 40, 80, 170], [950, 50, 60, 160],
        [1060, 30, 90, 180], [1200, 55, 60, 155], [1320, 40, 80, 170],
        [1450, 50, 70, 160],
      ];
      for (const [cx, cy, cw, ch] of chimneys) {
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeRect(cx, cy, cw, ch);
        ctx.strokeRect(cx - 5, cy - 10, cw + 10, 10);
        ctx.lineWidth = 1;
        for (let s = 0; s < 3; s++) {
          const sx = cx + cw / 2 + rand(-15, 15);
          const sy = cy - 15 - s * 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 8 + s * 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.lineWidth = 2;
      }
    } else if (layer === 1) {
      ctx.fillStyle = "#e8e3d3";
      ctx.fillRect(0, H - 200, BG_W, 200);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, H - 200);
      ctx.lineTo(BG_W, H - 200);
      ctx.stroke();
      const buildings = [
        [30, H - 230, 100, 30], [170, H - 245, 70, 45], [280, H - 225, 120, 25],
        [440, H - 240, 80, 40], [560, H - 230, 90, 30], [690, H - 250, 70, 50],
        [800, H - 225, 110, 25], [950, H - 240, 80, 40], [1070, H - 230, 90, 30],
        [1200, H - 245, 70, 45], [1320, H - 225, 100, 25], [1460, H - 235, 80, 35],
      ];
      for (const [bx, by, bw, bh] of buildings) {
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
      }
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        const px = 40 + i * 260;
        ctx.beginPath();
        ctx.moveTo(px, H - 200);
        ctx.lineTo(px + 30, H - 230 - (i % 3) * 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px + 30, H - 230 - (i % 3) * 15, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const cvx = 20 + i * 320;
        ctx.strokeRect(cvx, H - 160, 120, 10);
        ctx.lineWidth = 1;
        for (let r = 0; r < 10; r++) {
          ctx.beginPath();
          ctx.moveTo(cvx + 5 + r * 12, H - 160);
          ctx.lineTo(cvx + 5 + r * 12, H - 150);
          ctx.stroke();
        }
        ctx.lineWidth = 3;
      }
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const svx = 100 + i * 380;
        ctx.strokeRect(svx, H - 190, 20, 10);
        ctx.beginPath();
        ctx.moveTo(svx + 4, H - 190);
        ctx.lineTo(svx + 4, H - 210);
        ctx.moveTo(svx + 10, H - 190);
        ctx.lineTo(svx + 10, H - 215);
        ctx.moveTo(svx + 16, H - 190);
        ctx.lineTo(svx + 16, H - 208);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
    } else if (layer === 2) {
      ctx.fillStyle = "#d4cfc0";
      ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 16; col++) {
          const gx = col * 100 + (row % 2) * 50;
          const gy = row * 48 + H - 480;
          ctx.strokeRect(gx, gy, 100, 48);
        }
      }
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const dgx = 60 + i * 280;
        ctx.strokeRect(dgx, H - 50, 40, 20);
        ctx.lineWidth = 1;
        for (let s = 0; s < 3; s++) {
          ctx.beginPath();
          ctx.moveTo(dgx + 6 + s * 14, H - 50);
          ctx.lineTo(dgx + 6 + s * 14, H - 30);
          ctx.stroke();
        }
        ctx.lineWidth = 3;
      }
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const wx = i * 32;
        ctx.fillStyle = i % 2 === 0 ? "#000" : "#d4cfc0";
        ctx.fillRect(wx, H - 8, 32, 8);
      }
      ctx.strokeRect(0, H - 8, BG_W, 8);
      ctx.lineWidth = 3;
    }
  }

  return c;
}

const bgSprites = {};
function loadBgType(type) {
  bgSprites[type] = [];
  for (let layer = 0; layer < 3; layer++) {
    const name = type + "_" + layer;
    loadSprite(name, generateBgLayer(type, layer));
    bgSprites[type].push(name);
  }
}
loadBgType("street");
loadBgType("rooftop");
loadBgType("factory");

const LEVELS = [
  { name: "NIVEL 1", bgType: "street", bgLabel: "THE STREETS", preMidCount: 2, postMidCount: 1 },
  { name: "NIVEL 2", bgType: "rooftop", bgLabel: "THE ROOFTOP", preMidCount: 2, postMidCount: 2 },
  { name: "NIVEL 3", bgType: "factory", bgLabel: "THE FACTORY", preMidCount: 3, postMidCount: 3 },
];
const WAVE_CONFIGS = [
  { enemies: [{ type: "grunt", count: 3 }, { type: "punk", count: 1 }], title: "WAVE 1" },
  { enemies: [{ type: "grunt", count: 2 }, { type: "punk", count: 2 }, { type: "tough", count: 1 }], title: "WAVE 2" },
  { enemies: [{ type: "grunt", count: 3 }, { type: "punk", count: 3 }, { type: "tough", count: 2 }], title: "WAVE 3" },
  { enemies: [{ type: "grunt", count: 4 }, { type: "punk", count: 2 }], title: "WAVE 4" },
  { enemies: [{ type: "punk", count: 3 }, { type: "tough", count: 2 }], title: "WAVE 5" },
  { enemies: [{ type: "grunt", count: 2 }, { type: "punk", count: 3 }, { type: "tough", count: 2 }], title: "WAVE 6" },
  { enemies: [{ type: "punk", count: 4 }, { type: "tough", count: 3 }], title: "WAVE 7" },
  { enemies: [{ type: "punk", count: 3 }, { type: "tough", count: 2 }], title: "WAVE 8" },
  { enemies: [{ type: "grunt", count: 3 }, { type: "punk", count: 3 }, { type: "tough", count: 3 }], title: "WAVE 9" },
  { enemies: [{ type: "tough", count: 4 }, { type: "punk", count: 2 }], title: "WAVE 10" },
  { enemies: [{ type: "grunt", count: 4 }, { type: "punk", count: 4 }, { type: "tough", count: 2 }], title: "WAVE 11" },
  { enemies: [{ type: "punk", count: 3 }, { type: "tough", count: 4 }], title: "WAVE 12" },
  { enemies: [{ type: "tough", count: 5 }, { type: "punk", count: 3 }], title: "WAVE 13" },
];
(function computeBoundaries() {
  let idx = 0;
  for (const l of LEVELS) {
    l.preMidStart = idx;
    l.preMidEnd = idx + l.preMidCount - 1;
    idx += l.preMidCount;
    l.postMidStart = idx;
    l.postMidEnd = idx + l.postMidCount - 1;
    idx += l.postMidCount;
  }
})();

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
    z(10),
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
      lastComboMilestone: 0,
      kills: 0,
      downed: false,
      reviveTimer: 0,
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

  // --- IMPROVED BODY STRUCTURE ---
  // Neck
  const neck = char.add([
    rect(4 * DS, 4 * DS), outline(3), color(WHITE),
    pos(0, -bh / 2), anchor("center"),
  ]);

  // Head
  const head = char.add([
    rect(hw, hh),
    outline(5),
    color(WHITE),
    pos(0, -bh / 2 - hh + 2),
    anchor("center"),
  ]);
  char.parts.push({ name: "head", obj: head, x0: 0, y0: -bh / 2 - hh + 2 });

  // Upper body (shoulders/torso, wider)
  const upperBody = char.add([
    rect(bw + 4 * DS, Math.floor(bh * 0.55)),
    outline(5), color(WHITE),
    pos(0, -Math.floor(bh * 0.22)),
    anchor("center"),
  ]);
  char.parts.push({ name: "upperBody", obj: upperBody, x0: 0, y0: -Math.floor(bh * 0.22) });

  // Lower body (waist/hips, narrower)
  const lowerBody = char.add([
    rect(bw - 2 * DS, Math.floor(bh * 0.5)),
    outline(5), color(WHITE),
    pos(0, Math.floor(bh * 0.27)),
    anchor("center"),
  ]);
  char.parts.push({ name: "lowerBody", obj: lowerBody, x0: 0, y0: Math.floor(bh * 0.27) });

  // Left arm (attached to shoulder)
  const lArm = char.add([
    rect(aw, ah),
    outline(5),
    color(WHITE),
    pos(-bw / 2 - aw / 2 - 1, -bh / 2 + 6),
    anchor("left"),
  ]);
  char.parts.push({ name: "lArm", obj: lArm, x0: -bw / 2 - aw / 2 - 1, y0: -bh / 2 + 6 });

  // Right arm
  const rArm = char.add([
    rect(aw, ah),
    outline(5),
    color(WHITE),
    pos(bw / 2 + aw / 2 + 1, -bh / 2 + 6),
    anchor("right"),
  ]);
  char.parts.push({ name: "rArm", obj: rArm, x0: bw / 2 + aw / 2 + 1, y0: -bh / 2 + 6 });

  // Left leg (attached to hip)
  const lLeg = char.add([
    rect(lw, lh),
    outline(5),
    color(WHITE),
    pos(-lw / 2 - 2, Math.floor(bh * 0.5)),
    anchor("top"),
  ]);
  char.parts.push({ name: "lLeg", obj: lLeg, x0: -lw / 2 - 2, y0: Math.floor(bh * 0.5) });

  // Right leg
  const rLeg = char.add([
    rect(lw, lh),
    outline(5),
    color(WHITE),
    pos(lw / 2 + 2, Math.floor(bh * 0.5)),
    anchor("top"),
  ]);
  char.parts.push({ name: "rLeg", obj: rLeg, x0: lw / 2 + 2, y0: Math.floor(bh * 0.5) });

  // --- PER-TYPE DETAILS ---
  const hx = -bh / 2 - hh + 2;

  if (type === "punkette") {
    // Spiky hair (3 spikes + side tail)
    const spikeL = char.add([
      polygon([vec2(-8*DS, -2*DS), vec2(-16*DS, -12*DS), vec2(-4*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeL", obj: spikeL, x0: 0, y0: hx });
    const spikeT = char.add([
      polygon([vec2(0, -4*DS), vec2(0, -16*DS), vec2(5*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeT", obj: spikeT, x0: 0, y0: hx });
    const spikeR = char.add([
      polygon([vec2(8*DS, -2*DS), vec2(16*DS, -12*DS), vec2(4*DS, -4*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "spikeR", obj: spikeR, x0: 0, y0: hx });
    // Side tail (ponytail hanging right)
    const tail = char.add([
      polygon([vec2(6*DS, 0), vec2(14*DS, -4*DS), vec2(10*DS, 8*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "tail", obj: tail, x0: 0, y0: hx });
    // Open jacket (inner layer visible)
    char.add([rect(bw - 4, Math.floor(bh * 0.6)), outline(2), color(WHITE), pos(0, -2), anchor("center")]);
    // Choker
    char.add([rect(bw * 0.5, 3 * DS), outline(3), color(INK), pos(0, -bh/2 - 2), anchor("center")]);
    // Angry eye
    const eye = char.add([
      rect(6*DS, 2*DS), color(INK),
      pos(4*DS, hx + 3*DS), anchor("center"), rotate(-15),
    ]);
    char.parts.push({ name: "eye", obj: eye, x0: 4*DS, y0: hx + 3*DS });
    // Fishnet arm detail (lines on arms)
    char.add([rect(aw + 2, 2*DS), outline(1), color(INK), pos(-bw/2 - aw/2 - 1, -bh/2 + 8), anchor("center")]);
    char.add([rect(aw + 2, 2*DS), outline(1), color(INK), pos(-bw/2 - aw/2 - 1, -bh/2 + 14), anchor("center")]);
    // Belt
    char.add([rect(bw - 2, 3*DS), outline(2), color(WHITE), pos(0, 0), anchor("center")]);
    // Boots (taller)
    const by = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 4, Math.ceil(lh * 0.4)), outline(3), color(WHITE), pos(-lw/2 - 2, by), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.4)), outline(3), color(WHITE), pos(lw/2 + 2, by), anchor("center")]);
    // Boot sole line
    char.add([rect(lw + 6, 2*DS), outline(2), color(INK), pos(-lw/2 - 2, by + Math.ceil(lh * 0.2)), anchor("center")]);
    char.add([rect(lw + 6, 2*DS), outline(2), color(INK), pos(lw/2 + 2, by + Math.ceil(lh * 0.2)), anchor("center")]);
  }

  if (type === "antagonic") {
    // Gas mask visor (full face plate)
    char.add([rect(hw - 2, hh - 4), outline(3), color(WHITE), pos(0, hx + 1), anchor("center")]);
    // Visor line across eyes
    char.add([rect(hw, 3*DS), outline(3), color(INK), pos(0, hx - 2*DS), anchor("center")]);
    // Eye pieces (two circles)
    for (const ex of [-5*DS, 5*DS]) {
      char.add([circle(3*DS), outline(3), color(WHITE), pos(ex, hx - 2*DS), anchor("center")]);
      // Eye cross
      char.add([rect(4*DS, 1), color(WHITE), pos(ex, hx - 2*DS), anchor("center")]);
      char.add([rect(1, 4*DS), color(WHITE), pos(ex, hx - 2*DS), anchor("center")]);
    }
    // Filter canister (on cheek)
    char.add([circle(4*DS), outline(3), color(WHITE), pos(8*DS, hx + 5*DS), anchor("center")]);
    // Breathing tube from mask to filter
    char.add([rect(2*DS, 6*DS), outline(2), color(WHITE), pos(6*DS, hx + 2*DS), anchor("center"), rotate(15)]);
    // Left tube (hanging)
    char.add([rect(2*DS, 8*DS), outline(2), color(WHITE), pos(-hw/2 - 2*DS, hx + 2*DS), anchor("center"), rotate(-20)]);
    // Shoulder pads (armored)
    char.add([rect(10*DS, 10*DS), outline(3), color(WHITE), pos(-bw/2 - 6*DS, -bh/2 + 2), anchor("center")]);
    char.add([rect(10*DS, 10*DS), outline(3), color(WHITE), pos(bw/2 + 6*DS, -bh/2 + 2), anchor("center")]);
    // Shoulder pad detail lines
    char.add([rect(8*DS, 2*DS), outline(1), color(INK), pos(-bw/2 - 6*DS, -bh/2 + 1), anchor("center")]);
    char.add([rect(8*DS, 2*DS), outline(1), color(INK), pos(bw/2 + 6*DS, -bh/2 + 1), anchor("center")]);
    // Utility vest pockets
    char.add([rect(6*DS, 5*DS), outline(2), color(WHITE), pos(-7*DS, 3), anchor("center")]);
    char.add([rect(6*DS, 5*DS), outline(2), color(WHITE), pos(7*DS, 3), anchor("center")]);
    // Belt with buckle
    char.add([rect(bw, 3*DS), outline(3), color(WHITE), pos(0, bh/2 - 2), anchor("center")]);
    char.add([rect(4*DS, 5*DS), outline(2), color(WHITE), pos(0, bh/2 - 2), anchor("center")]);
    // Pants (lower body is already there, add knee pads)
    char.add([rect(lw + 2, 3*DS), outline(2), color(WHITE), pos(-lw/2 - 2, Math.floor(bh * 0.5) + Math.floor(lh * 0.3)), anchor("center")]);
    char.add([rect(lw + 2, 3*DS), outline(2), color(WHITE), pos(lw/2 + 2, Math.floor(bh * 0.5) + Math.floor(lh * 0.3)), anchor("center")]);
    // Combat boots
    const by = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 6, Math.ceil(lh * 0.45)), outline(3), color(WHITE), pos(-lw/2 - 2, by), anchor("center")]);
    char.add([rect(lw + 6, Math.ceil(lh * 0.45)), outline(3), color(WHITE), pos(lw/2 + 2, by), anchor("center")]);
    // Boot sole
    char.add([rect(lw + 8, 2*DS), outline(2), color(INK), pos(-lw/2 - 2, by + Math.ceil(lh * 0.25)), anchor("center")]);
    char.add([rect(lw + 8, 2*DS), outline(2), color(INK), pos(lw/2 + 2, by + Math.ceil(lh * 0.25)), anchor("center")]);
  }

  if (type === "xero") {
    // Visor (full width of face)
    const visor = char.add([
      rect(hw + 4, 5*DS), outline(3), color(WHITE),
      pos(0, hx + 2*DS), anchor("center"),
    ]);
    char.parts.push({ name: "visor", obj: visor, x0: 0, y0: hx + 2*DS });
    // Visor shine line
    char.add([rect(hw + 2, 1), color(WHITE), pos(0, hx + 1*DS), anchor("center")]);
    // Cyber eye (glowing red dot)
    const cEye = char.add([circle(3*DS), color(INK), pos(3*DS, hx + 2*DS), anchor("center")]);
    char.parts.push({ name: "cEye", obj: cEye, x0: 3*DS, y0: hx + 2*DS });
    // Cyber lines on face
    char.add([rect(2*DS, 6*DS), outline(1), color(WHITE), pos(-hw/2, hx + 4*DS), anchor("center"), rotate(-10)]);
    // Body cyber lines (circuit pattern)
    char.add([rect(4*DS, bh - 8), outline(2), color(WHITE), pos(-6*DS, 1), anchor("center")]);
    char.add([rect(4*DS, bh - 8), outline(2), color(WHITE), pos(6*DS, 1), anchor("center")]);
    // Horizontal circuit lines
    char.add([rect(2*DS, 2*DS), outline(1), color(WHITE), pos(-6*DS, -6), anchor("center")]);
    char.add([rect(2*DS, 2*DS), outline(1), color(WHITE), pos(6*DS, 6), anchor("center")]);
    // Bigger right arm (cyborg) with detail
    rArm.width = aw * 1.6;
    rArm.height = ah * 1.3;
    char.parts.find((p) => p.name === "rArm").obj.width = aw * 1.6;
    char.parts.find((p) => p.name === "rArm").obj.height = ah * 1.3;
    // Cyborg arm panel lines
    const rAx = bw / 2 + aw * 0.8 + 1;
    const rAy = -bh / 2 + 6;
    char.add([rect(4*DS, ah * 0.6), outline(1), color(INK), pos(rAx, rAy + 4), anchor("center")]);
    char.add([rect(2*DS, ah * 0.3), outline(1), color(INK), pos(rAx, rAy + ah * 0.8), anchor("center")]);
    // Belt
    char.add([rect(bw - 2, 3*DS), outline(2), color(WHITE), pos(0, bh/2 - 2), anchor("center")]);
    // Sleek boots
    const bx = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(-lw/2 - 2, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(lw/2 + 2, bx), anchor("center")]);
    // Boot tech lines
    char.add([rect(lw + 2, 2*DS), outline(1), color(INK), pos(-lw/2 - 2, bx + 2), anchor("center")]);
    char.add([rect(lw + 2, 2*DS), outline(1), color(INK), pos(lw/2 + 2, bx + 2), anchor("center")]);
  }

  if (type === "grunt") {
    // Spiky hair
    const h1 = char.add([
      polygon([vec2(-6*DS, -hh/2), vec2(-10*DS, -hh/2 - 8*DS), vec2(-2*DS, -hh/2)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "h1", obj: h1, x0: 0, y0: hx });
    const h2 = char.add([
      polygon([vec2(6*DS, -hh/2), vec2(10*DS, -hh/2 - 8*DS), vec2(2*DS, -hh/2)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "h2", obj: h2, x0: 0, y0: hx });
    // Simple boots
    const bx = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(-lw/2 - 2, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(lw/2 + 2, bx), anchor("center")]);
  }

  if (type === "punk") {
    // Tall mohawk
    const m1 = char.add([
      rect(8*DS, 18*DS), outline(3), color(WHITE),
      pos(0, hx - 9*DS), anchor("center"),
    ]);
    char.parts.push({ name: "mohawk", obj: m1, x0: 0, y0: hx - 9*DS });
    // Mohawk line detail
    char.add([rect(6*DS, 16*DS), outline(1), color(INK), pos(0, hx - 9*DS), anchor("center")]);
    // Earring
    char.add([circle(2*DS), outline(2), color(WHITE), pos(-hw/2 - 1, hx + 3*DS), anchor("center")]);
    // Boots
    const bx = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(-lw/2 - 2, bx), anchor("center")]);
    char.add([rect(lw + 4, Math.ceil(lh * 0.35)), outline(3), color(WHITE), pos(lw/2 + 2, bx), anchor("center")]);
  }

  if (type === "tough") {
    // Forehead wrinkle
    char.add([rect(6*DS, 2*DS), color(INK), pos(0, hx + 2*DS), anchor("center")]);
    // Angry eyes
    char.add([rect(4*DS, 2*DS), color(INK), pos(-5*DS, hx + 5*DS), anchor("center"), rotate(-10)]);
    char.add([rect(4*DS, 2*DS), color(INK), pos(5*DS, hx + 5*DS), anchor("center"), rotate(10)]);
    // Big chest scar (X shape)
    char.add([rect(2*DS, 10*DS), outline(2), color(WHITE), pos(0, 2), anchor("center"), rotate(20)]);
    char.add([rect(2*DS, 10*DS), outline(2), color(WHITE), pos(0, 2), anchor("center"), rotate(-20)]);
    // Bandolier across chest
    char.add([rect(bw + 4, 3*DS), outline(2), color(WHITE), pos(0, -2), anchor("center")]);
    // Knuckle wraps on hands
    char.add([rect(aw + 1, 3*DS), outline(2), color(WHITE), pos(-bw/2 - aw/2 - 1, -bh/2 + 6 + ah), anchor("center")]);
    char.add([rect(aw + 1, 3*DS), outline(2), color(WHITE), pos(bw/2 + aw/2 + 1, -bh/2 + 6 + ah), anchor("center")]);
    // Boots
    const bx = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 6, Math.ceil(lh * 0.4)), outline(3), color(WHITE), pos(-lw/2 - 2, bx), anchor("center")]);
    char.add([rect(lw + 6, Math.ceil(lh * 0.4)), outline(3), color(WHITE), pos(lw/2 + 2, bx), anchor("center")]);
  }

  if (type === "boss") {
    // Big horns
    const hornL = char.add([
      polygon([vec2(-8*DS, -6*DS), vec2(-14*DS, -20*DS), vec2(-4*DS, -10*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "hornL", obj: hornL, x0: 0, y0: hx });
    const hornR = char.add([
      polygon([vec2(8*DS, -6*DS), vec2(14*DS, -20*DS), vec2(4*DS, -10*DS)]),
      outline(3), color(WHITE), pos(0, hx), anchor("center"),
    ]);
    char.parts.push({ name: "hornR", obj: hornR, x0: 0, y0: hx });
    // Horn rings
    char.add([rect(4*DS, 2*DS), outline(1), color(INK), pos(-12*DS, hx - 12*DS), anchor("center"), rotate(30)]);
    char.add([rect(4*DS, 2*DS), outline(1), color(INK), pos(12*DS, hx - 12*DS), anchor("center"), rotate(-30)]);
    // Angry eyes
    char.add([rect(6*DS, 2*DS), color(INK), pos(-6*DS, hx + 4*DS), anchor("center"), rotate(-12)]);
    char.add([rect(6*DS, 2*DS), color(INK), pos(6*DS, hx + 4*DS), anchor("center"), rotate(12)]);
    // Scar over eye
    char.add([rect(8*DS, 1), color(WHITE), pos(-4*DS, hx + 3*DS), anchor("center"), rotate(-25)]);
    // Large chest scar
    char.add([rect(4*DS, 16*DS), outline(2), color(WHITE), pos(0, 2), anchor("center")]);
    // Shoulder spikes
    char.add([polygon([vec2(-4*DS, 0), vec2(-6*DS, -6*DS), vec2(0, 0)]), outline(3), color(WHITE), pos(-bw/2 - 6*DS, -bh/2 + 2), anchor("center")]);
    char.add([polygon([vec2(4*DS, 0), vec2(6*DS, -6*DS), vec2(0, 0)]), outline(3), color(WHITE), pos(bw/2 + 6*DS, -bh/2 + 2), anchor("center")]);
    // Belt with skull buckle
    char.add([rect(bw + 4, 4*DS), outline(3), color(WHITE), pos(0, bh/2 - 2), anchor("center")]);
    char.add([circle(3*DS), outline(2), color(WHITE), pos(0, bh/2 - 2), anchor("center")]);
    // Boots (bigger)
    const bx = Math.floor(bh * 0.5) + lh - 2;
    char.add([rect(lw + 8, Math.ceil(lh * 0.5)), outline(3), color(WHITE), pos(-lw/2 - 2, bx), anchor("center")]);
    char.add([rect(lw + 8, Math.ceil(lh * 0.5)), outline(3), color(WHITE), pos(lw/2 + 2, bx), anchor("center")]);
    // Boot spikes
    char.add([polygon([vec2(-2*DS, 0), vec2(-6*DS, -4*DS), vec2(0, -2*DS)]), outline(2), color(WHITE), pos(-lw/2 - 4, bx + Math.ceil(lh * 0.25)), anchor("center")]);
    char.add([polygon([vec2(2*DS, 0), vec2(6*DS, -4*DS), vec2(0, -2*DS)]), outline(2), color(WHITE), pos(lw/2 + 4, bx + Math.ceil(lh * 0.25)), anchor("center")]);
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
  const ub = char.parts.find((p) => p.name === "upperBody");
  const lb = char.parts.find((p) => p.name === "lowerBody");
  if (ub) ub.obj.pos = vec2(ub.x0 + 6, ub.y0);
  if (lb) lb.obj.pos = vec2(lb.x0 + 4, lb.y0);
}

function setKickPose(char) {
  resetPose(char);
  const rLeg = char.parts.find((p) => p.name === "rLeg");
  if (rLeg) {
    rLeg.obj.pos = vec2(rLeg.x0 + 12, rLeg.y0 - 12);
    rLeg.obj.angle = 30;
  }
  // Lean back
  const ub = char.parts.find((p) => p.name === "upperBody");
  const lb = char.parts.find((p) => p.name === "lowerBody");
  if (ub) ub.obj.pos = vec2(ub.x0 - 6, ub.y0);
  if (lb) lb.obj.pos = vec2(lb.x0 - 4, lb.y0);
}

function setHitPose(char) {
  resetPose(char);
  const ub = char.parts.find((p) => p.name === "upperBody");
  const lb = char.parts.find((p) => p.name === "lowerBody");
  if (ub) ub.obj.pos = vec2(ub.x0, ub.y0 + 4);
  if (lb) lb.obj.pos = vec2(lb.x0, lb.y0 + 4);
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
  const ub = char.parts.find((p) => p.name === "upperBody");
  const lb = char.parts.find((p) => p.name === "lowerBody");
  const breath = Math.sin(t * 0.05) * 2;
  if (ub) ub.obj.pos = vec2(ub.x0, ub.y0 + breath);
  if (lb) lb.obj.pos = vec2(lb.x0, lb.y0 + breath * 0.5);
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
        hitEnemy(enemy, damage, knockback, dir, owner);
      });
      hb.onCollide("boss", (boss) => {
        if (boss.invincible > 0 || boss.dead) return;
        hitEnemy(boss, damage, knockback, dir, owner);
      });
  } else {
    hb.onUpdate(() => {
      if (!curState) return;
      for (const player of curState.players) {
        if (player.dead || player.downed || player === owner || player.invincible > 0) continue;
        if (hb.isColliding(player)) {
          player.hp -= damage;
          player.invincible = 0.3;
          player.hitTimer = 0.15;
          setHitPose(player);
          screenShake(4, 0.12);
          curState.hitPause = 0.04;
          sfxHitPlayer();
          spawnDamagePopup(player.pos.x, player.pos.y - 15, damage, dir);
          wait(0.02, () => {
            if (!player.dead) player.pos.x += -dir * knockback;
          });
          break;
        }
      }
    });
  }

  return hb;
}

function hitEnemy(enemy, damage, knockback, dir, attacker) {
  // Player damage multiplier
  if (attacker && attacker.kills !== undefined && curState && curState.diffMul) {
    damage = Math.round(damage * curState.diffMul.playerDmg);
  }
  enemy.hp -= damage;
  enemy.invincible = 0.3;
  enemy.hitTimer = 0.15;
  setHitPose(enemy);
  screenShake(3, 0.1);
  sfxHit();

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
  spawnDamagePopup(enemy.pos.x, enemy.pos.y - 15, damage, dir);

  if (enemy.hp <= 0) {
    enemy.dead = true;
    if (!enemy.is("player")) sfxKill();
    if (attacker && attacker.kills !== undefined) attacker.kills++;
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
      z(15),
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
      z(15),
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
      z(15),
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
    z(15),
  ]);
}

function spawnDamagePopup(x, y, damage, dir) {
  const pop = add([
    text(damage.toString(), { size: 14, font: "sans-serif" }),
    pos(x + rand(-8, 8), y - 10),
    anchor("center"),
    color(INK),
    z(20),
    opacity(1),
    move(vec2(dir * rand(30, 60), -rand(60, 100))),
    lifespan(0.6),
  ]);
  tween(1, 0, 0.5, (v) => pop.opacity = v);
}

function spawnBurstText(text) {
  sfxCombo();
  const b = add([
    text(text, { size: 28, font: "sans-serif" }),
    pos(W / 2, H / 2 - 40),
    anchor("center"),
    color(INK),
    z(30),
    opacity(1),
    scale(0.5),
  ]);
  tween(0.5, 1.3, 0.5, (v) => b.scale = vec2(v, v), _ => destroy(b));
  tween(1, 0, 0.6, (v) => b.opacity = v);
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

// ---- ITEM DROP ----
const ITEM_TYPES = ["health"];

function spawnItemDrop(x, y) {
  const type = "health";
  const item = add([
    rect(16, 16),
    color(WHITE),
    outline(3, INK),
    pos(x, y),
    area(),
    anchor("center"),
    z(25),
    "item",
    { itemType: type, bob: rand(0, Math.PI * 2) },
  ]);
  // Red cross for health
  item.add([rect(10, 3), color(INK), pos(-5, -1.5), anchor("center")]);
  item.add([rect(3, 10), color(INK), pos(-1.5, -5), anchor("center")]);
  if (curState && curState.items) curState.items.push(item);
}

function checkItemPickups() {
  if (!curState || !curState.items) return;
  for (let i = curState.items.length - 1; i >= 0; i--) {
    const item = curState.items[i];
    if (!item.exists()) { curState.items.splice(i, 1); continue; }
    // Bob
    item.bob += dt() * 3;
    item.pos.y += Math.sin(item.bob * 2) * 0.5;
    for (const p of curState.players) {
      if (p.dead) continue;
      if (p.pos.dist(item.pos) < 30) {
        p.hp = Math.min(p.maxHp, p.hp + 30);
        sfxItemPickup();
        destroy(item);
        curState.items.splice(i, 1);
        // Flash heal effect
        const flash = add([rect(20, 30), color(WHITE), pos(p.pos.x, p.pos.y - 15), anchor("center"), z(50), opacity(0.6)]);
        tween(0.6, 0, 0.3, (v) => flash.opacity = v, () => destroy(flash));
        break;
      }
    }
  }
}

// ============================================================
// TITLE SCENE
// ============================================================

scene("title", () => {
  stopMusic();
  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);

  // Background
  add([rect(W, H), color(PAPER), fixed()]);

  let titleTime = 0;
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

  // Push Start prompts
  let blink = 0;
  const p1Start = add([
    text("1 - PUSH START", { size: 18, font: "sans-serif" }),
    pos(W / 2, H * 0.6),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);
  const p2Start = add([
    text("2 - PUSH START", { size: 18, font: "sans-serif" }),
    pos(W / 2, H * 0.66),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Controls
  const ctrlText = add([
    text("P1: WASD+J/K+L  P2: ARROWS+1/2+3", { size: 12, font: "sans-serif" }),
    pos(W / 2, H * 0.78),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Difficulty selector
  const diffText = add([
    text("< DIFFICULTY: NORMAL >", { size: 14, font: "sans-serif" }),
    pos(W / 2, H * 0.84),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  // Decorative lines
  add([rect(180, 3), color(INK), pos(W / 2 - 90, H * 0.73), fixed(), z(10)]);
  add([rect(140, 2), color(INK), pos(W / 2 - 70, H * 0.85), fixed(), z(10)]);

  // Version
  add([
    text("v1.0", { size: 10, font: "sans-serif" }),
    pos(W - 30, H - 15), anchor("center"), color(INK), fixed(), z(10),
  ]);

  let p1Ready = false, p2Ready = false;

  onUpdate(() => {
    titleTime += dt();
    blink += dt();
    p1Start.opacity = blink % 1 < 0.6 ? 1 : 0.3;
    p2Start.opacity = p2Ready ? 0.15 : (blink % 1 < 0.6 ? 1 : 0.3);
    ctrlText.opacity = 0.5 + Math.sin(blink * 0.3) * 0.3;
    title.pos.x = W / 2 + Math.sin(titleTime * 0.5) * 3;
    title.pos.y = H / 3 - 20 + Math.sin(titleTime * 0.7) * 2;
    diffText.text = "< DIFFICULTY: " + DIFFICULTIES[gameDifficulty] + " >";
    diffText.opacity = 0.5 + Math.sin(blink * 0.3) * 0.3;
  });

  // Difficulty change
  onKeyPress("a", () => { gameDifficulty = (gameDifficulty - 1 + 3) % 3; sfxMenuSelect(); });
  onKeyPress("d", () => { gameDifficulty = (gameDifficulty + 1) % 3; sfxMenuSelect(); });

  onKeyPress("j", () => { sfxMenuSelect(); if (!p1Ready) { p1Ready = true; go("select", { p1: true, p2: p2Ready }); } });
  onKeyPress("1", () => { sfxMenuSelect(); if (!p2Ready) { p2Ready = true; go("select", { p1: p1Ready, p2: true }); } });
});

// ============================================================
// SELECT SCENE
// ============================================================

const CHAR_OPTIONS = ["punkette", "antagonic", "xero"];
const CHAR_NAMES = { punkette: "PUNKETTE", antagonic: "ANTAGONIC", xero: "X-ERO" };

const DIFFICULTIES = ["EASY", "NORMAL", "HARD"];
let gameDifficulty = 1; // 0=easy, 1=normal, 2=hard

const VIGNETTES = [
  [
    "THE CITY IS A CANCER.",
    "THE STREETS BELONG TO NO ONE.",
    "BUT TONIGHT, TWO FIGHTERS",
    "WILL WRITE THEIR OWN LAW.",
    "",
    "NO MERCY. NO SURRENDER.",
    "JUST BLOOD AND INK.",
  ],
  [
    "THE GROUND IS NOT ENOUGH.",
    "THE ROOFTOPS CALL.",
    "UP THERE, THE RULES CHANGE.",
    "GRAVITY IS THE ONLY JUDGE.",
  ],
  [
    "THE FACTORY BREATHES FIRE.",
    "SMOKE AND STEEL.",
    "IN THE BELLY OF THE BEAST,",
    "THE FINAL BATTLE AWAITS.",
    "",
    "NO TURNING BACK NOW.",
  ],
];

scene("select", (opts) => {
  if (!opts) opts = {};
  let p1Active = opts.p1 !== false;
  let p2Active = opts.p2 === true;

  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);
  add([rect(W, H), color(PAPER), fixed()]);

  add([
    text("SELECT YOUR CHARACTER", { size: 18, font: "sans-serif" }),
    pos(W / 2, 40), anchor("center"), color(INK), fixed(), z(10),
  ]);

  let p1Choice = 0, p2Choice = p1Active ? 1 : 0;
  let p1Locked = false, p2Locked = false;
  let started = false;

  function nextAvail(current, dir, taken) {
    let c = current;
    for (let tries = 0; tries < CHAR_OPTIONS.length; tries++) {
      c = (c + dir + CHAR_OPTIONS.length) % CHAR_OPTIONS.length;
      if (CHAR_OPTIONS[c] !== taken) return c;
    }
    return current;
  }

  const previews = [];
  function renderSelect() {
    for (const p of previews) destroy(p);
    previews.length = 0;

    const p1Taken = p2Locked ? CHAR_OPTIONS[p2Choice] : null;
    const p2Taken = p1Locked ? CHAR_OPTIONS[p1Choice] : null;

    if (p1Active) {
      const p1Label = add([
        text("P1: " + CHAR_NAMES[CHAR_OPTIONS[p1Choice]] + (p1Locked ? " (LOCKED)" : " (A/D)"), { size: 12, font: "sans-serif" }),
        pos(W / 2, 80), anchor("center"), color(INK), fixed(), z(10),
      ]);
      previews.push(p1Label);

      const p1Char = createCharacter(200, 250, CHAR_OPTIONS[p1Choice], "preview");
      p1Char.scale.x = 1;
      previews.push(p1Char);
    }

    if (p2Active) {
      const p2LabelTxt = (p2Locked && p2Taken === CHAR_OPTIONS[p1Choice])
        ? "P2: " + CHAR_NAMES[CHAR_OPTIONS[p2Choice]] + " (LOCKED)"
        : "P2: " + CHAR_NAMES[CHAR_OPTIONS[p2Choice]] + (p2Locked ? " (LOCKED)" : " (< >)");
      const p2Label = add([
        text(p2LabelTxt, { size: 12, font: "sans-serif" }),
        pos(W / 2, 130), anchor("center"), color(INK), fixed(), z(10),
      ]);
      previews.push(p2Label);

      const p2Char = createCharacter(600, 250, CHAR_OPTIONS[p2Choice], "preview");
      p2Char.scale.x = -1;
      if (p2Locked && p2Taken === CHAR_OPTIONS[p1Choice]) p2Char.opacity = 0.3;
      previews.push(p2Char);
    }

    // Available characters bar
    const barY = 340;
    add([text("--- CHARACTERS ---", { size: 10, font: "sans-serif" }), pos(W / 2, barY - 15), anchor("center"), color(INK), fixed(), z(10)]);
    for (let i = 0; i < CHAR_OPTIONS.length; i++) {
      const taken = (p1Active && p1Locked && CHAR_OPTIONS[i] === CHAR_OPTIONS[p1Choice]) ||
                    (p2Active && p2Locked && CHAR_OPTIONS[i] === CHAR_OPTIONS[p2Choice]);
      const bx = W / 2 - 130 + i * 90;
      const bg = add([rect(70, 20), outline(2), color(taken ? GRAY : WHITE), pos(bx, barY), anchor("center"), fixed(), z(10)]);
      previews.push(bg);
      const tx = add([
        text(CHAR_NAMES[CHAR_OPTIONS[i]], { size: 7, font: "sans-serif" }),
        pos(bx, barY), anchor("center"), color(taken ? GRAY : INK), fixed(), z(11),
      ]);
      previews.push(tx);
      if (taken) {
        const xMark = add([
          text("X", { size: 10, font: "sans-serif" }),
          pos(bx + 25, barY - 8), anchor("center"), color(INK), fixed(), z(11),
        ]);
        previews.push(xMark);
      }
    }

    let msg = "";
    if (started) msg = "STARTING...";
    else if (p1Active && p2Active) {
      if (p1Locked && p2Locked) msg = "STARTING...";
      else if (p1Locked) msg = "P2: 1 to lock";
      else msg = "P1: J to lock | P2: 1 to lock";
    } else if (p1Active) {
      if (p1Locked) msg = "STARTING...";
      else msg = "P1: J to lock";
    } else if (p2Active) {
      if (p2Locked) msg = "STARTING...";
      else msg = "P2: 1 to lock";
    }
    const instr = add([
      text(msg, { size: 12, font: "sans-serif" }),
      pos(W / 2, 380), anchor("center"), color(INK), fixed(), z(10),
    ]);
    previews.push(instr);
  }

  renderSelect();

  // P1 Navigation & lock (always register, guard at runtime)
  onKeyPress("a", () => {
    if (!p1Active || p1Locked || started) return;
    const taken = (p2Active && p2Locked) ? CHAR_OPTIONS[p2Choice] : null;
    p1Choice = nextAvail(p1Choice, -1, taken);
    if (p2Active && !p2Locked && p1Choice === p2Choice) p1Choice = nextAvail(p1Choice, -1, null);
    sfxMenuSelect();
    renderSelect();
  });
  onKeyPress("d", () => {
    if (!p1Active || p1Locked || started) return;
    const taken = (p2Active && p2Locked) ? CHAR_OPTIONS[p2Choice] : null;
    p1Choice = nextAvail(p1Choice, 1, taken);
    if (p2Active && !p2Locked && p1Choice === p2Choice) p1Choice = nextAvail(p1Choice, 1, null);
    sfxMenuSelect();
    renderSelect();
  });
  onKeyPress("j", () => {
    if (started) return;
    // Late join for P1
    if (!p1Active) { p1Active = true; p1Choice = nextAvail(p1Choice, 0, p2Locked ? CHAR_OPTIONS[p2Choice] : null); sfxMenuSelect(); renderSelect(); return; }
    if (p1Locked) return;
    p1Locked = true;
    sfxMenuSelect();
    renderSelect();
  });

  // P2 Navigation & lock (always register, guard at runtime)
  onKeyPress("left", () => {
    if (!p2Active || p2Locked || started) return;
    const taken = (p1Active && p1Locked) ? CHAR_OPTIONS[p1Choice] : null;
    p2Choice = nextAvail(p2Choice, -1, taken);
    if (p1Active && !p1Locked && p2Choice === p1Choice) p2Choice = nextAvail(p2Choice, -1, null);
    sfxMenuSelect();
    renderSelect();
  });
  onKeyPress("right", () => {
    if (!p2Active || p2Locked || started) return;
    const taken = (p1Active && p1Locked) ? CHAR_OPTIONS[p1Choice] : null;
    p2Choice = nextAvail(p2Choice, 1, taken);
    if (p1Active && !p1Locked && p2Choice === p1Choice) p2Choice = nextAvail(p2Choice, 1, null);
    sfxMenuSelect();
    renderSelect();
  });
  onKeyPress("1", () => {
    if (started) return;
    // Late join for P2
    if (!p2Active) { p2Active = true; p2Choice = nextAvail(p2Choice, 0, p1Locked ? CHAR_OPTIONS[p1Choice] : null); sfxMenuSelect(); renderSelect(); return; }
    if (p2Locked) return;
    p2Locked = true;
    sfxMenuSelect();
    renderSelect();
  });

  // Start game
  function startGame() {
    if (started) return;
    started = true;
    go("game", p1Active ? CHAR_OPTIONS[p1Choice] : null, p2Active && p2Locked ? CHAR_OPTIONS[p2Choice] : null);
  }

  onKeyPress("space", startGame);

  // Auto-start when all active players locked, or single player locked
  onUpdate(() => {
    if (started) return;
    if (p1Active && p2Active && p1Locked && p2Locked) startGame();
    else if (p1Active && !p2Active && p1Locked) startGame();
    else if (p2Active && !p1Active && p2Locked) startGame();
  });
});

// ============================================================
// GAME SCENE
// ============================================================

scene("game", (p1Type, p2Type) => {
  if (!p2Type) p2Type = null;
  events.clear();

  // ---- STATE ----
  const state = {
    wave: 1,
    waveActive: false,
    enemiesThisWave: 0,
    enemiesKilled: 0,
    enemiesInWave: 0,
    currentLevel: 0,
    waveConfigIdx: 0,
    miniBossSpawned: false,
    miniBoss: null,
    miniBossDefeated: false,
    bossSpawned: false,
    bossDefeated: false,
    gameOver: false,
    victory: false,
    hitPause: 0,
    paused: false,
    players: [],
    enemies: [],
    items: [],
    boss: null,
    time: 0,
  };
  curState = state;

  // ---- DIFFICULTY MULTIPLIERS ----
  state.diffMul = (() => {
    if (gameDifficulty === 0) return { enemyHp: 0.7, enemyDmg: 0.7, playerDmg: 1.3, waveCount: 0.75, label: "EASY" };
    if (gameDifficulty === 2) return { enemyHp: 1.5, enemyDmg: 1.5, playerDmg: 0.8, waveCount: 1.25, label: "HARD" };
    return { enemyHp: 1, enemyDmg: 1, playerDmg: 1, waveCount: 1, label: "NORMAL" };
  })();
  const diffMul = state.diffMul;

  // ---- VIGNETTE SYSTEM ----
  let vignetteActive = false;
  let vignetteCallback = null;

  function showVignette(lines, onComplete) {
    vignetteActive = true;
    vignetteCallback = onComplete;
    const overlay = add([fixed(), z(200)]);
    overlay.add([rect(W, H), color(PAPER), opacity(1)]);
    // Comic border
    overlay.add([rect(W - 20, H - 20), outline(4, INK), pos(10, 10), color(PAPER)]);
    // Inner border
    overlay.add([rect(W - 34, H - 34), outline(2, INK), pos(17, 17), color(PAPER)]);
    // Decorative corners
    for (const [cx, cy] of [[17, 17], [W - 17, 17], [17, H - 17], [W - 17, H - 17]]) {
      overlay.add([rect(10, 10), color(INK), pos(cx - 5, cy - 5)]);
    }

    // Ink splatters
    for (let i = 0; i < 3; i++) {
      const sx = rand(40, W - 40);
      const sy = rand(40, H - 40);
      for (let j = 0; j < 4; j++) {
        overlay.add([circle(rand(2, 6)), color(INK), pos(sx + rand(-15, 15), sy + rand(-15, 15)), opacity(rand(0.1, 0.3))]);
      }
    }

    // Story title
    overlay.add([
      text("WARZINE", { size: 14, font: "sans-serif" }),
      pos(W / 2, 50), anchor("center"), color(INK), opacity(0.4), z(201),
    ]);

    // Horizontal dividers
    overlay.add([rect(W - 80, 1), color(INK), pos(40, 68), opacity(0.5)]);
    overlay.add([rect(W - 80, 1), color(INK), pos(40, H - 90), opacity(0.5)]);

    // Text lines
    const startY = H / 2 - (lines.length * 14) / 2;
    const textObjs = [];
    lines.forEach((line, i) => {
      const t = overlay.add([
        text(line, { size: line === "" ? 8 : 14, font: "sans-serif" }),
        pos(W / 2, startY + i * 18),
        anchor("center"), color(INK), z(201), opacity(0),
      ]);
      textObjs.push(t);
    });

    // Animate text appearing
    textObjs.forEach((t, i) => {
      wait(0.15 + i * 0.12, () => { if (t.exists()) t.opacity = 1; });
    });

    // Continue prompt
    const prompt = overlay.add([
      text("[ SPACE / ENTER ]", { size: 12, font: "sans-serif" }),
      pos(W / 2, H - 55),
      anchor("center"), color(INK), z(201), opacity(0),
    ]);
    let promptBlink = 0;

    const updateFn = onUpdate(() => {
      promptBlink += dt();
      prompt.opacity = promptBlink % 1 < 0.6 ? 0.7 : 0.2;
    });

    const onDone = () => {
      updateFn.cancel();
      destroy(overlay);
      vignetteActive = false;
      if (vignetteCallback) vignetteCallback();
    };

    onKeyPress("space", () => { if (vignetteActive) { sfxMenuSelect(); onDone(); } });
    onKeyPress("enter", () => { if (vignetteActive) { sfxMenuSelect(); onDone(); } });
  }

  // ---- BACKGROUND (parallax layers) ----
  state.bgType = "street";
  const bgLayers = [];
  for (let i = 0; i < 3; i++) {
    const name = bgSprites[state.bgType][i];
    const layer = add([sprite(name), pos(0, 0), z(i)]);
    if (!layer) console.warn("bg layer " + i + " failed to create");
    bgLayers.push(layer);
  }
  add([sprite("paperTex"), opacity(0.18), z(90), fixed()]);

  // ---- PLAYER CREATION ----
  function createPlayer(type, x, y, controls, tag, reviveKey) {
    const char = createCharacter(x, y, type, tag);
    state.players.push(char);

    char.controls = controls;
    char.reviveKey = reviveKey || controls.punch;
    char.attackCooldown = 0;
    char.walkTime = 0;
    char.isWalking = false;
    char.dodgeTimer = 0;
    char.dodgeCooldown = 0;

    // Keep within bounds
    char.onUpdate(() => {
      if (char.dead || char.downed || state.hitPause > 0) return;
      char.pos.x = clamp(char.pos.x, 30, W - 30);
      if (!char.isAirborne) {
        char.pos.y = clamp(char.pos.y, H - 180, H - 60);
      }
    });

    // Gravity
    const gravityHandler = char.onUpdate(() => {
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
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
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.dodgeTimer > 0) return;
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
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.attackCooldown > 0) return;
      if (char.dodgeTimer > 0) return;

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
        sfxSuper();
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

      // Milestone burst
      const milestones = [3, 5, 8, 10, 15, 20, 30, 50];
      const lastM = char.lastComboMilestone || 0;
      for (const m of milestones) {
        if (char.comboCount >= m && lastM < m) {
          char.lastComboMilestone = m;
          spawnBurstText(m + " HITS!");
          break;
        }
      }

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
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.isAirborne) return;

      char.isAirborne = true;
      char.jumpVy = JUMP_FORCE;
      char.jumpStartY = char.pos.y;
      sfxJump();
    });

    // Dodge / roll
    onKeyPress(controls.dodge, () => {
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.isAirborne) return;
      if (char.dodgeTimer > 0) return;
      if (char.dodgeCooldown > 0) return;

      char.dodgeTimer = 0.3;
      char.dodgeCooldown = 1.0;
      char.invincible = 0.35;
      char.move(char.facing * 200, 0);
      // Squish effect
      char.scale.y = 0.6;
      char.scale.x = char.facing * 1.3;
      spawnWalkDust(char.pos.x, char.pos.y, char.facing);
      sfxDodge();
      tween(0.3, 0, 0.2, (v) => {
        if (char.dead) return;
        char.scale.y = 1 - v * 0.4;
        char.scale.x = (char.facing > 0 ? 1 : -1) * (1 + v * 0.3);
      }, () => {
        if (!char.dead) { char.scale.y = 1; char.scale.x = char.facing > 0 ? 1 : -1; }
      });
    });

    // Combo timer
    char.comboTimer = 0;

    const comboHandler = char.onUpdate(() => {
      if (state.hitPause > 0) return;
      if (char.comboTimer > 0) {
        char.comboTimer -= dt();
        if (char.comboTimer <= 0) {
          char.comboCount = 0;
          char.lastComboMilestone = 0;
        }
      }
      if (char.attackCooldown > 0) char.attackCooldown -= dt();
      if (char.dodgeTimer > 0) char.dodgeTimer -= dt();
      if (char.dodgeCooldown > 0) char.dodgeCooldown -= dt();
    });

    // Combo counter text
    const comboText = add([
      text("", { size: 16, font: "sans-serif" }),
      pos(0, 0),
      anchor("center"),
      color(INK),
      z(20),
      opacity(0),
    ]);
    char.onUpdate(() => {
      if (!char.dead && char.comboCount > 1 && char.comboTimer > 0) {
        comboText.pos = vec2(char.pos.x, char.pos.y - 65);
        comboText.text = char.comboCount + " HITS";
        comboText.opacity = Math.min(1, char.comboTimer * 5);
        const s = 1 + Math.min(char.comboCount - 1, 5) * 0.04;
        comboText.scale = vec2(s, s);
      } else {
        comboText.opacity = 0;
      }
    });

    // Downed / Death handler
    char.onUpdate(() => {
      if (char.dead) return;
      if (char.hp <= 0 && !char.downed) {
        char.downed = true;
        char.reviveTimer = 10;
        char.invincible = 999;
        tween(0, 90, 0.3, (v) => {
          if (!char.downed) return;
          char.angle = v;
          char.pos.y += 1;
        });
        spawnInkSplat(char.pos.x, char.pos.y - 10);
      }
      if (char.downed) {
        if (state.paused || state.victory || vignetteActive) return;
        char.reviveTimer -= dt();
        if (char.reviveTimer <= 0) {
          char.downed = false;
          char.dead = true;
          sfxPlayerDeath();
          const idx = state.players.indexOf(char);
          if (idx >= 0) state.players.splice(idx, 1);
          if (char === p1) { p1 = null; p1Type = null; }
          if (char === p2) { p2 = null; p2Type = null; }
          destroy(char);
          checkGameOver();
        }
      }
    });

    // Revive key
    onKeyPress(char.reviveKey, () => {
      if (!char.downed || char.dead || state.gameOver || state.victory) return;
      char.downed = false;
      char.hp = Math.floor(char.maxHp * 0.5);
      char.invincible = 1.5;
      char.reviveTimer = 0;
      char.pos.x = char.facing > 0 ? W / 2 - 40 : W / 2 + 40;
      char.pos.y = H - 100;
      screenShake(5, 0.25);
      sfxRevive();
      // Get-up animation: rotate back upright from current angle
      const startAngle = char.angle;
      tween(startAngle, 0, 0.25, (v) => {
        if (char.dead) return;
        char.angle = v;
        char.pos.y -= 1;
      }, () => {
        if (!char.dead) char.angle = 0;
      });
      // Ink burst on revive
      for (let i = 0; i < 8; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = rand(80, 160);
        add([
          circle(rand(2, 5)),
          color(INK),
          pos(char.pos.x, char.pos.y),
          opacity(0.7),
          move(vec2(Math.cos(a), Math.sin(a)).scale(sp)),
          lifespan(rand(0.3, 0.6)),
          anchor("center"),
          z(20),
        ]);
      }
    });

    return char;
  }

  // Create players from selection
  let p1 = null;
  if (p1Type) {
    p1 = createPlayer(p1Type, 150, H - 100, {
      left: "a", right: "d", up: "w", down: "s",
      punch: "j", jump: "k", dodge: "l",
    }, "player", "j");
    p1.playerId = 1;
  }

  let p2 = null;
  if (p2Type) {
    p2 = createPlayer(p2Type, 250, H - 100, {
      left: "left", right: "right", up: "up", down: "down",
      punch: "1", jump: "2", dodge: "3",
    }, "player", "1");
    p2.playerId = 2;
  }

  // ---- MID-GAME JOIN (symmetrical for P1 and P2) ----
  const joinSlots = [];
  joinSlots.push({ key: "j", playerId: 1, label: "P1", spawnX: 150, controls: { left: "a", right: "d", up: "w", down: "s", punch: "j", jump: "k", dodge: "l" } });
  joinSlots.push({ key: "1", playerId: 2, label: "P2", spawnX: 250, controls: { left: "left", right: "right", up: "up", down: "down", punch: "1", jump: "2", dodge: "3" } });

  if (joinSlots.length > 0) {
    let joinChoice = 0;
    let joinAvail = [];
    let joinOverlay = null;
    let joinTarget = null;

    function getTakenType() {
      if (!joinTarget) return null;
      return joinTarget.playerId === 1 ? (p2 ? p2.type : p2Type) : (p1 ? p1.type : p1Type);
    }

    function destroyJoinOverlay() {
      if (joinOverlay) {
        for (const o of joinOverlay) { if (o.exists()) destroy(o); }
        joinOverlay = null;
      }
    }

    function showJoinOverlay() {
      destroyJoinOverlay();
      joinOverlay = [];
      joinAvail = CHAR_OPTIONS.filter((c) => c !== getTakenType());
      if (joinChoice >= joinAvail.length) joinChoice = 0;
      const baseY = 51;
      const bar = add([rect(W, 24), color(INK), pos(0, baseY), fixed(), z(95), opacity(0.85)]);
      joinOverlay.push(bar);
      const label = add([
        text(joinTarget.label + " JOIN  ", { size: 10, font: "sans-serif" }),
        pos(W / 2 - 80, baseY + 6), anchor("left"), color(WHITE), fixed(), z(96),
      ]);
      joinOverlay.push(label);
      const charNames = joinAvail.map((c) => CHAR_NAMES[c]);
      const charsText = charNames.map((n, i) => i === joinChoice ? ">" + n : " " + n).join("  ");
      const chars = add([
        text(charsText, { size: 10, font: "sans-serif" }),
        pos(W / 2 - 40, baseY + 6), anchor("left"), color(WHITE), fixed(), z(96),
      ]);
      joinOverlay.push(chars);
      const hint = add([
        text("< > choose  " + joinTarget.key.toUpperCase() + " - JOIN", { size: 8, font: "sans-serif" }),
        pos(W / 2 + 60, baseY + 7), anchor("left"), color(WHITE), fixed(), z(96),
      ]);
      joinOverlay.push(hint);
    }

    onKeyPress("left", () => {
      if (joinOverlay && joinAvail.length > 0) { joinChoice = (joinChoice - 1 + joinAvail.length) % joinAvail.length; showJoinOverlay(); }
    });
    onKeyPress("right", () => {
      if (joinOverlay && joinAvail.length > 0) { joinChoice = (joinChoice + 1) % joinAvail.length; showJoinOverlay(); }
    });

    for (const slot of joinSlots) {
      onKeyPress(slot.key, () => {
        if (joinOverlay && joinTarget === slot) {
          const chosenType = joinAvail[joinChoice];
          destroyJoinOverlay();
          const player = createPlayer(chosenType, slot.spawnX, H - 100, slot.controls, "player", slot.key);
          player.playerId = slot.playerId;
          if (slot.playerId === 1) { p1 = player; p1Type = chosenType; }
          else { p2 = player; p2Type = chosenType; }
          joinTarget = null;
        } else if (!joinOverlay) {
          const alreadyExists = slot.playerId === 1 ? p1 : p2;
          if (!alreadyExists && !state.gameOver && !state.victory) {
            joinTarget = slot;
            joinChoice = 0;
            showJoinOverlay();
          }
        }
      });
    }
  }

  // ---- ENEMY SYSTEM ----
  function spawnEnemy(type, x, y) {
    const enemy = createCharacter(x, y, type, "enemy");
    enemy.hp = Math.round(enemy.hp * diffMul.enemyHp);
    enemy.maxHp = enemy.hp;
    state.enemies.push(enemy);
    state.enemiesThisWave++;

    enemy.attackCooldown = rand(0.5, 1.5);
    enemy.attackRange = type === "tough" ? 35 : 28;
    enemy.damage = Math.round((type === "tough" ? 18 : type === "punk" ? 10 : 8) * diffMul.enemyDmg);
    enemy.speed = type === "tough" ? 130 : type === "punk" ? 170 : 150;
    enemy.aiState = "chase";
    enemy.aiTimer = 0;
    enemy.facing = -1;
    enemy.walkTime = rand(0, 100);
    enemy.isAirborne = false;
    enemy.jumpVy = 0;
    enemy.jumpStartY = y;
    enemy.jumpTimer = 0;

    // Clamp position
    enemy.onUpdate(() => {
      if (enemy.dead || state.hitPause > 0) return;
      enemy.pos.x = clamp(enemy.pos.x, 30, W - 30);
      if (!enemy.isAirborne) {
        enemy.pos.y = clamp(enemy.pos.y, H - 180, H - 60);
      }
    });

    // Gravity
    enemy.onUpdate(() => {
      if (enemy.dead || state.hitPause > 0) return;
      if (enemy.isAirborne) {
        enemy.jumpVy += GRAVITY * dt();
        enemy.pos.y += enemy.jumpVy * dt();
        if (enemy.pos.y >= enemy.jumpStartY) {
          enemy.pos.y = enemy.jumpStartY;
          enemy.jumpVy = 0;
          enemy.isAirborne = false;
        }
      }
    });

    // AI
    enemy.onUpdate(() => {
      if (enemy.dead || state.gameOver || state.victory || state.hitPause > 0) return;

      if (enemy.isAirborne) return; // no AI while airborne

      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= dt();
        enemy.invincible -= dt();
        return;
      }
      enemy.invincible = Math.max(0, enemy.invincible - dt());
      enemy.attackCooldown -= dt();
      enemy.aiTimer -= dt();
      enemy.jumpTimer -= dt();

      // Find nearest player
      let target = null;
      let minDist = Infinity;
      for (const p of state.players) {
        if (p.dead || p.downed) continue;
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

      // Jump if far away and cooldown ready
      if (dist > 80 && enemy.jumpTimer <= 0 && Math.random() < 0.02) {
        enemy.isAirborne = true;
        enemy.jumpStartY = enemy.pos.y;
        enemy.jumpVy = JUMP_FORCE * rand(0.8, 1.0);
        enemy.pos.x += dx > 0 ? 20 : -20; // lunge forward
        enemy.jumpTimer = rand(2, 4);
      }

      if (dist < enemy.attackRange && enemy.attackCooldown <= 0 && !enemy.isAirborne) {
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
  function startWave(config, title) {
    state.wave = title ? parseInt(title.replace("WAVE ", "")) : 0;
    state.waveActive = true;
    state.enemiesKilled = 0;
    state.enemiesThisWave = 0;
    sfxWave();

    // Wave transition flash
    const flash = add([rect(W, H), color(INK), fixed(), opacity(0), z(45)]);
    tween(0, 0.3, 0.1, (v) => (flash.opacity = v), () => {
      tween(0.3, 0, 0.15, (v) => (flash.opacity = v), () => destroy(flash));
    });

    const waveText = add([
      text(title, { size: 32, font: "sans-serif" }),
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
      const scaled = Math.max(1, Math.round(e.count * diffMul.waveCount));
      for (let i = 0; i < scaled; i++) {
        spawnList.push(e.type);
      }
    }
    state.enemiesInWave = spawnList.length;

    spawnList.forEach((type, i) => {
      wait(0.3 + i * 0.9, () => {
        if (state.gameOver || state.victory) return;
        const side = rand(0, 1) > 0.5 ? W - 30 : 30;
        spawnEnemy(type, side, H - 80 - rand(0, 40));
      });
    });
  }

  // Switch background to a new type (destroy old, create new)
  function switchBg(type) {
    state.bgType = type;
    for (const l of bgLayers) destroy(l);
    bgLayers.length = 0;
    for (let i = 0; i < 3; i++) {
      const layer = add([sprite(bgSprites[type][i]), pos(0, 0), z(i)]);
      bgLayers.push(layer);
    }
  }

  // Advance to next level (bg swap, text, then start first wave)
  function startNextLevel() {
    state.currentLevel++;
    const lvl = state.currentLevel;
    state.miniBossSpawned = false;
    state.miniBossDefeated = false;
    state.bossSpawned = false;
    state.bossDefeated = false;
    state.boss = null;

    // Revive all downed players so they don't die during the vignette
    for (const p of state.players) {
      if (p.downed) {
        p.downed = false;
        p.angle = 0;
        p.hp = Math.floor(p.maxHp * 0.3);
        p.invincible = 2;
        p.reviveTimer = 0;
      }
    }

    const vignetteIdx = lvl; // VIGNETTES[1] for level 1→2, VIGNETTES[2] for level 2→3
    showVignette(VIGNETTES[vignetteIdx], () => {
      if (state.gameOver) return;
      const level = LEVELS[lvl];
      state.waveConfigIdx = level.preMidStart;
      switchBg(level.bgType);
      startWave(WAVE_CONFIGS[state.waveConfigIdx], WAVE_CONFIGS[state.waveConfigIdx].title);
    });
  }

  // ---- WAVE COMPLETION CHECK ----
  events.on("enemy-killed", (enemy) => {
    state.enemiesKilled++;
    // Remove from state.enemies list
    const idx = state.enemies.indexOf(enemy);
    if (idx >= 0) state.enemies.splice(idx, 1);

    // Item drop chance
    if (Math.random() < 0.3 && state.items) spawnItemDrop(enemy.pos.x, enemy.pos.y);

    if (state.enemiesKilled >= state.enemiesInWave && state.waveActive) {
      state.waveActive = false;
      const level = LEVELS[state.currentLevel];

      if (state.waveConfigIdx >= level.preMidEnd && !state.miniBossSpawned) {
        wait(2.0, () => spawnMiniBoss());
      } else if (state.waveConfigIdx >= level.postMidEnd && state.miniBossDefeated && !state.bossSpawned) {
        spawnBoss();
      } else {
        state.waveConfigIdx++;
        const next = WAVE_CONFIGS[state.waveConfigIdx];
        wait(2.0, () => { if (!state.gameOver) startWave(next, next.title); });
      }
    }
  });

  // ---- MINI-BOSS SYSTEM ----
  function spawnMiniBoss() {
    if (state.miniBossSpawned) return;
    state.miniBossSpawned = true;
    sfxBossWarning();

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
      text("EL BRUTO APPROACHING", { size: 18, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(1),
      lifespan(2),
    ]);

    wait(1.5, () => {
      const mb = createCharacter(W / 2, H - 100, "tough", "enemy");
      state.miniBoss = mb;
      state.enemies.push(mb);

      mb.hp = Math.round(250 * diffMul.enemyHp);
      mb.maxHp = mb.hp;
      mb.speed = 140;
      mb.attackCooldown = rand(1.5, 2.5);
      mb.attackRange = 45;
      mb.damage = Math.round(15 * diffMul.enemyDmg);
      mb.aiState = "chase";
      mb.scale = vec2(1.25, 1.25);
      mb.facing = -1;
      mb.scale.x = -1.25;
      mb.walkTime = rand(0, 100);

      mb.onUpdate(() => {
        if (mb.dead || state.gameOver || state.victory || state.hitPause > 0) return;

        if (mb.hitTimer > 0) {
          mb.hitTimer -= dt();
          mb.invincible -= dt();
          return;
        }
        mb.invincible = Math.max(0, mb.invincible - dt());
        mb.attackCooldown -= dt();

        // Enrage at 30% HP
        if (mb.hp < mb.maxHp * 0.3 && mb.speed === 140) {
          mb.speed = 180;
          mb.attackCooldown = 0.5;
          screenShake(6, 0.3);
          spawnHitEffect(mb.pos.x, mb.pos.y - 20);
          spawnInkSplat(mb.pos.x, mb.pos.y);
        }

        // Find nearest player
        let target = null;
        let minDist = Infinity;
        for (const p of state.players) {
          if (p.dead || p.downed) continue;
          const d = p.pos.dist(mb.pos);
          if (d < minDist) {
            minDist = d;
            target = p;
          }
        }
        if (!target) return;

        const dx = target.pos.x - mb.pos.x;
        const dy = target.pos.y - mb.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        mb.facing = dx > 0 ? 1 : -1;
        mb.scale.x = mb.facing;

        if (dist < mb.attackRange && mb.attackCooldown <= 0) {
          mb.attackCooldown = rand(1.0, 1.8);
          const pattern = Math.floor(rand(0, 2));

          if (pattern === 0) {
            // Heavy punch
            setPunchPose(mb);
            screenShake(3, 0.08);
            spawnHitbox(mb, 26, -6, 22, 18, mb.damage * 1.3, 180, 0.12);
            spawnAttackArc(mb.pos.x + 30 * mb.facing, mb.pos.y - 5, mb.facing);
          } else {
            // Charge attack
            setKickPose(mb);
            const chargeDir = mb.facing;
            mb.move(chargeDir * 120, 0);
            spawnHitbox(mb, 10, -2, 28, 20, mb.damage, 160, 0.18);
            screenShake(4, 0.1);
            spawnAttackArc(mb.pos.x + 20 * mb.facing, mb.pos.y - 5, mb.facing);
          }

          tween(0, 1, 0.08, () => {}, () => {
            if (!mb.dead) resetPose(mb);
          });
        } else if (dist > mb.attackRange * 0.5) {
          // Chase
          mb.aiState = "chase";
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            mb.move((dx / len) * mb.speed, (dy / len) * mb.speed * 0.5);
            mb.walkTime += dt();
            setWalkPose(mb, mb.walkTime * 10);
          }
        }
      });
    });
  }

  // Check mini-boss killed
  events.on("enemy-killed", (enemy) => {
    if (enemy === state.miniBoss) {
      state.miniBossDefeated = true;
      state.miniBoss = null;

      // Guaranteed health drops
      spawnItemDrop(enemy.pos.x, enemy.pos.y);
      spawnItemDrop(enemy.pos.x - 20, enemy.pos.y);

      // Advance to post-mid waves
      const level = LEVELS[state.currentLevel];
      state.waveConfigIdx = level.postMidStart;

      const l1 = add([
        text("MINIBOSS DEFEATED", { size: 24, font: "sans-serif" }),
        pos(W / 2, H / 2 - 30),
        anchor("center"),
        color(INK),
        z(60),
        fixed(),
      ]);
      const l2 = add([
        text("WAVES REMAINING: " + level.postMidCount, { size: 14, font: "sans-serif" }),
        pos(W / 2, H / 2 + 15),
        anchor("center"),
        color(INK),
        z(60),
        fixed(),
      ]);

      wait(3.0, () => {
        destroy(l1);
        destroy(l2);
        if (state.gameOver) return;
        const next = WAVE_CONFIGS[state.waveConfigIdx];
        startWave(next, next.title);
      });
    }
  });

  // ---- BOSS SYSTEM ----
  function spawnBoss() {
    if (state.bossSpawned) return;
    state.bossSpawned = true;
    sfxBossWarning();

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
      boss.damage = Math.round(20 * diffMul.enemyDmg);
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
          if (p.dead || p.downed) continue;
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
      sfxBossDeath();

      // High score
      const prev = parseInt(localStorage.getItem("warzine_high") || "0");
      const score = state.wave;
      if (score > prev) localStorage.setItem("warzine_high", String(score));

      if (state.currentLevel < LEVELS.length - 1) {
        // Not the last level — transition to next
        const nextLevel = LEVELS[state.currentLevel + 1];
        const vic1 = add([
          text("NIVEL " + (state.currentLevel + 1) + " COMPLETE", { size: 28, font: "sans-serif" }),
          pos(W / 2, H / 2 - 30),
          anchor("center"), color(INK), z(60), fixed(),
        ]);
        const vic2 = add([
          text("PROCEEDING TO " + nextLevel.bgLabel + "...", { size: 14, font: "sans-serif" }),
          pos(W / 2, H / 2 + 15),
          anchor("center"), color(INK), z(60), fixed(),
        ]);
        wait(3.0, () => {
          destroy(vic1);
          destroy(vic2);
          if (state.gameOver) return;
          state.victory = false;
          startNextLevel();
        });
      } else {
        // Last level — victory!
        const vic1 = add([
          text("VICTORY!", { size: 48, font: "sans-serif" }),
          pos(W / 2, H / 2 - 30),
          anchor("center"), color(INK), z(60), fixed(),
        ]);
        const vic2 = add([
          text("ALL LEVELS CLEARED", { size: 14, font: "sans-serif" }),
          pos(W / 2, H / 2 + 15),
          anchor("center"), color(INK), z(60), fixed(),
        ]);
        wait(3.0, () => {
          destroy(vic1);
          destroy(vic2);
          go("victory", state.wave);
        });
      }
    }
  });

  // ---- HUD ----
  function createHUD() {
    const hud = add([fixed(), z(95)]);

    // Paper strip at top
    hud.add([rect(W, 50), color(INK), pos(0, 0), opacity(0.85), fixed()]);
    hud.add([rect(W, 1), color(WHITE), pos(0, 50), fixed()]);

    // Player 1 health (hidden until P1 joins)
    const p1Label = hud.add([
      text("P1", { size: 10, font: "sans-serif" }),
      color(WHITE),
      pos(15, 6),
      fixed(),
      opacity(p1 ? 1 : 0),
    ]);
    const p1BarBg = hud.add([rect(120, 16), color(GRAY), pos(15, 20), fixed(), opacity(p1 ? 1 : 0)]);
    const p1Bar = hud.add([rect(120, 16), color(WHITE), pos(15, 20), fixed(), opacity(p1 ? 1 : 0)]);
    const p1Kills = hud.add([
      text("", { size: 9, font: "sans-serif" }),
      color(WHITE),
      pos(15, 40),
      fixed(),
      opacity(p1 ? 1 : 0),
    ]);

    // Player 2 health (hidden until P2 joins)
    const p2Label = hud.add([
      text("P2", { size: 10, font: "sans-serif" }),
      color(WHITE),
      pos(W - 135, 6),
      fixed(),
      opacity(p2 ? 1 : 0),
    ]);
    const p2BarBg = hud.add([rect(120, 16), color(GRAY), pos(W - 135, 20), fixed(), opacity(p2 ? 1 : 0)]);
    const p2Bar = hud.add([rect(120, 16), color(WHITE), pos(W - 135, 20), fixed(), opacity(p2 ? 1 : 0)]);
    const p2Kills = hud.add([
      text("", { size: 9, font: "sans-serif" }),
      color(WHITE),
      pos(W - 135, 40),
      fixed(),
      opacity(p2 ? 1 : 0),
    ]);

    // Wave indicator
    const waveLabel = hud.add([
      text("WAVE 1", { size: 12, font: "sans-serif" }),
      color(WHITE),
      pos(W / 2, 8),
      anchor("center"),
      fixed(),
    ]);

    // Difficulty indicator
    const diffLabel = hud.add([
      text(diffMul.label, { size: 9, font: "sans-serif" }),
      color(WHITE),
      pos(W / 2, 22),
      anchor("center"),
      fixed(),
      opacity(0.5),
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
    const bossPhaseLabel = hud.add([
      text("", { size: 8, font: "sans-serif" }),
      color(WHITE),
      pos(W / 2, 80),
      anchor("center"),
      fixed(),
      opacity(0),
    ]);

    // Update loop
    return {
      update() {
        if (p1) {
          p1Label.opacity = 1;
          p1BarBg.opacity = 1;
          p1Bar.opacity = 1;
          p1Kills.opacity = 1;
          if (p1.downed) {
            p1Label.text = "PRESS " + p1.reviveKey.toUpperCase() + " - " + Math.ceil(p1.reviveTimer);
            p1Bar.width = 0;
          } else if (p1.dead) {
            p1Bar.width = 0;
            p1Label.text = CHAR_NAMES[p1.type] || "P1";
          } else {
            p1Bar.width = (p1.hp / p1.maxHp) * 120;
            p1Label.text = CHAR_NAMES[p1.type] || "P1";
          }
          p1Kills.text = "KILLS: " + p1.kills;
        } else {
          p1Label.text = "P1: J TO JOIN";
          p1Label.opacity = 0.5 + Math.sin(state.time * 4) * 0.3;
          p1BarBg.opacity = 0;
          p1Bar.opacity = 0;
          p1Kills.opacity = 0;
        }

        if (p2) {
          p2Label.opacity = 1;
          p2BarBg.opacity = 1;
          p2Bar.opacity = 1;
          p2Kills.opacity = 1;
          if (p2.downed) {
            p2Label.text = "PRESS " + p2.reviveKey.toUpperCase() + " - " + Math.ceil(p2.reviveTimer);
            p2Bar.width = 0;
          } else if (p2.dead) {
            p2Bar.width = 0;
            p2Label.text = CHAR_NAMES[p2.type] || "P2";
          } else {
            p2Bar.width = (p2.hp / p2.maxHp) * 120;
            p2Label.text = CHAR_NAMES[p2.type] || "P2";
          }
          p2Kills.text = "KILLS: " + p2.kills;
        } else {
          p2Label.text = "P2: 1 TO JOIN";
          p2Label.opacity = 0.5 + Math.sin(state.time * 4 + 2) * 0.3;
          p2BarBg.opacity = 0;
          p2Bar.opacity = 0;
          p2Kills.opacity = 0;
        }

        waveLabel.text = state.bossSpawned ? "BOSS FIGHT" : `WAVE ${state.wave}`;

        // Boss health bar
        if (state.boss && !state.boss.dead) {
          bossBarBg.opacity = 1;
          bossBar.opacity = 1;
          bossLabel.opacity = 1;
          bossPhaseLabel.opacity = 1;
          bossBar.width = (state.boss.hp / state.boss.maxHp) * 300;
          bossPhaseLabel.text = "PHASE " + (state.boss.phase || 1);
        } else {
          bossBarBg.opacity = 0;
          bossBar.opacity = 0;
          bossLabel.opacity = 0;
          bossPhaseLabel.opacity = 0;
        }
      },
      destroy() {
        destroy(hud);
      },
    };
  }

  const hud = createHUD();

  // ---- CENTER REVIVE PROMPT (solo / last player) ----
  const revivePrompt = add([
    text(" ", { size: 36, font: "sans-serif" }),
    pos(W / 2, H / 2 - 30),
    anchor("center"),
    color(INK),
    z(95),
    opacity(0),
    fixed(),
  ]);
  onUpdate(() => {
    let p = null;
    for (const pl of state.players) {
      if (pl.downed) {
        const otherAlive = state.players.some((o) => o !== pl && !o.dead && !o.downed);
        if (!otherAlive) { p = pl; break; }
      }
    }
    if (p) {
      revivePrompt.text = "PRESS " + p.reviveKey.toUpperCase() + " - " + Math.ceil(p.reviveTimer);
      revivePrompt.opacity = 0.5 + Math.sin(state.time * 4) * 0.5;
    } else {
      revivePrompt.opacity = 0;
    }
  });

  // ---- GAME OVER CHECK ----
  function checkGameOver() {
    if (state.victory || state.gameOver || vignetteActive) return;
    const allDead = state.players.every((p) => p.dead);
    if (allDead && !state.gameOver) {
      state.gameOver = true;
      const prev = parseInt(localStorage.getItem("warzine_high") || "0");
      if (state.wave > prev) localStorage.setItem("warzine_high", String(state.wave));
      wait(1, () => go("gameover", state.wave));
    }
  }

  // ---- PAUSE ----
  onKeyPress("escape", () => {
    state.paused = !state.paused;
  });

  onKeyPress("m", () => {
    const on = toggleSound();
    const msg = add([
      text(on ? "SOUND: ON" : "SOUND: OFF", { size: 16, font: "sans-serif" }),
      pos(W / 2, H / 2),
      anchor("center"), color(INK), z(60), fixed(),
    ]);
    wait(1.0, () => destroy(msg));
  });

  // ---- MAIN UPDATE ----
  onUpdate(() => {
    if (state.paused) return;
    if (state.hitPause > 0) state.hitPause -= dt();
    state.time += dt();
    hud.update();

    // Items
    checkItemPickups();

    // Parallax scrolling
    if (bgLayers.length >= 3 && bgLayers[0] && bgLayers[0].pos) {
      const alive = state.players.filter((p) => !p.dead);
      if (alive.length > 0) {
        const avgX = alive.reduce((s, p) => s + p.pos.x, 0) / alive.length;
        const camX = (avgX / W - 0.5) * 2; // -1 to 1
        for (let i = 0; i < 3; i++) {
          const speed = [0.05, 0.12, 0.25][i];
          bgLayers[i].pos.x = -camX * speed * (BG_W - W) / 2;
        }
      }
    }
  });

  // Pause overlay
  onKeyPress("c", () => {
    if (!state.paused) return;
    state.showControls = !state.showControls;
  });

  onUpdate(() => {
    if (state.paused) {
      if (!state.pauseUI) {
        state.showControls = false;
        state.pauseUI = add([fixed(), z(100)]);
        state.pauseUI.add([rect(W, H), color(INK), opacity(0.7)]);
        state.pauseUI.add([
          text("PAUSED", { size: 48, font: "sans-serif" }),
          pos(W / 2, H / 2 - 80), anchor("center"), color(WHITE), fixed(), z(101),
        ]);
        state.pauseUI.add([
          text("ESC: Resume     C: Controls", { size: 12, font: "sans-serif" }),
          pos(W / 2, H / 2 - 30), anchor("center"), color(WHITE), fixed(), z(101),
        ]);
      }
      // Controls sub-screen toggle
      if (state.showControls && !state.controlsUI) {
        state.controlsUI = state.pauseUI.add([fixed(), z(102)]);
        const lines = [
          "--- CONTROLS ---",
          "",
          "P1 (WASD + J/K/L):",
          "  WASD    Move",
          "  K       Jump",
          "  J       Punch",
          "  J+K     Super Attack",
          "  L       Dodge/Roll",
          "",
          "P2 (ARROWS + 1/2/3):",
          "  Arrows  Move",
          "  2       Jump",
          "  1       Punch",
          "  1+2     Super Attack",
          "  3       Dodge/Roll",
          "",
          "ESC      Pause",
          "C        Toggle Controls",
        ];
        let yOff = H / 2 - 60;
        for (const line of lines) {
          state.controlsUI.add([
            text(line, { size: 10, font: "sans-serif" }),
            pos(W / 2, yOff), anchor("center"), color(WHITE), fixed(), z(103),
          ]);
          yOff += 13;
        }
      } else if (!state.showControls && state.controlsUI) {
        destroy(state.controlsUI);
        state.controlsUI = null;
      }
    } else if (state.pauseUI) {
      destroy(state.pauseUI);
      state.pauseUI = null;
      state.controlsUI = null;
      state.showControls = false;
    }
  });

  // ---- START FIRST LEVEL ----
  state.currentLevel = 0;
  const firstLevel = LEVELS[0];
  state.waveConfigIdx = firstLevel.preMidStart;
  showVignette(VIGNETTES[0], () => {
    startMusic();
    startWave(WAVE_CONFIGS[state.waveConfigIdx], WAVE_CONFIGS[state.waveConfigIdx].title);
  });
});

// ============================================================
// GAME OVER SCENE
// ============================================================

scene("gameover", (wave) => {
  wave = wave || 1;
  stopMusic();
  sfxGameOver();

  // High score
  const prev = parseInt(localStorage.getItem("warzine_high") || "0");
  const score = wave;
  if (score > prev) localStorage.setItem("warzine_high", String(score));
  const high = Math.max(prev, score);

  add([sprite("paperTex"), opacity(0.15), z(100), fixed()]);
  add([rect(W, H), color(PAPER), fixed()]);

  add([
    text("X", { size: 120, font: "sans-serif" }),
    pos(W / 2, H / 3 - 20),
    anchor("center"), color(INK), fixed(), z(10),
  ]);

  add([
    text("GAME OVER", { size: 36, font: "sans-serif" }),
    pos(W / 2, H / 2 + 10),
    anchor("center"), color(INK), fixed(), z(10),
  ]);

  add([
    text("WAVE " + wave, { size: 14, font: "sans-serif" }),
    pos(W / 2, H * 0.58),
    anchor("center"), color(INK), fixed(), z(10),
  ]);

  add([
    text("BEST: WAVE " + high, { size: 12, font: "sans-serif" }),
    pos(W / 2, H * 0.63),
    anchor("center"), color(INK), fixed(), z(10), opacity(0.6),
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

  onKeyPress("space", () => { sfxMenuSelect(); go("select"); });
});

// ============================================================
// VICTORY SCENE
// ============================================================

scene("victory", (wave) => {
  wave = wave || 3;
  stopMusic();

  // High score
  const prev = parseInt(localStorage.getItem("warzine_high") || "0");
  const score = wave;
  if (score > prev) localStorage.setItem("warzine_high", String(score));
  const high = Math.max(prev, score);

  add([sprite("paperTex"), opacity(0.2), fixed()]);
  add([rect(W, H), color(PAPER), fixed()]);

  // Scanline overlay
  const scanCanvas = document.createElement("canvas");
  scanCanvas.width = W; scanCanvas.height = H;
  const sctx = scanCanvas.getContext("2d");
  sctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let y = 0; y < H; y += 3) sctx.fillRect(0, y, W, 1);
  loadSprite("scanlines", scanCanvas);
  add([sprite("scanlines"), opacity(0.3), fixed(), z(5)]);

  // Top border line
  add([rect(W - 80, 2), color(INK), pos(40, 60), fixed(), z(10)]);
  add([rect(W - 80, 2), color(INK), pos(40, H - 60), fixed(), z(10)]);

  // Main header
  add([
    text("> //////////////////////////////", { size: 10, font: "sans-serif" }),
    pos(60, 90), color(INK), fixed(), z(10),
  ]);
  add([
    text("> //  SYSTEM.PURGE: COMPLETE  //", { size: 16, font: "sans-serif" }),
    pos(60, 108), color(INK), fixed(), z(10),
  ]);
  add([
    text("> //////////////////////////////", { size: 10, font: "sans-serif" }),
    pos(60, 130), color(INK), fixed(), z(10),
  ]);

  // Status lines
  const lines = [
    "> THREAT.LEVEL:  NEUTRALIZED",
    "> CITY.STATUS:  SECURE",
    "> WAVES.CLEARED:  " + wave,
    "> HIGH.SCORE:  WAVE " + high,
  ];
  lines.forEach((line, i) => {
    add([
      text(line, { size: 12, font: "sans-serif" }),
      pos(60, 170 + i * 22), color(INK), fixed(), z(10),
    ]);
  });

  // Quote
  add([
    text('"the streets may run black,', { size: 14, font: "sans-serif" }),
    pos(W / 2, H * 0.62), anchor("center"), color(INK), fixed(), z(10),
  ]);
  add([
    text(' but tonight they run clean."', { size: 14, font: "sans-serif" }),
    pos(W / 2, H * 0.62 + 20), anchor("center"), color(INK), fixed(), z(10),
  ]);

  // Bottom divider
  add([rect(W - 80, 1), color(INK), pos(40, H * 0.73), fixed(), z(10)]);

  // Pulsing retry
  let blink = 0;
  const retry = add([
    text("[ SPACE ]  RETRY        [ ENTER ]  TITLE", { size: 13, font: "sans-serif" }),
    pos(W / 2, H * 0.80),
    anchor("center"), color(INK), fixed(), z(10),
  ]);

  onUpdate(() => {
    blink += dt();
    retry.opacity = blink % 1 < 0.6 ? 1 : 0.3;
  });

  onKeyPress("space", () => { sfxMenuSelect(); go("select"); });
  onKeyPress("enter", () => { sfxMenuSelect(); go("title"); });
});

// ============================================================
// START
// ============================================================

go("title");
