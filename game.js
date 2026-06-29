// ============================================================
// WARZINE - Beat 'em Up de tinta negra / fanzine punk
// ============================================================

const W = 640;
const H = 480;

kaplay({
  width: W,
  height: H,
  background: [55, 55, 62],
  letterbox: true,
  stretch: true,
});

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const touchKeys = {};
const touchPressCallbacks = {};
const touchReleaseCallbacks = {};
let isVersusMode = false;

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

let vsRematchData = null;
let paperTexEnabled = true;

function togglePaperTex() {
  paperTexEnabled = !paperTexEnabled;
  for (const obj of get("paperTex")) {
    obj.opacity = paperTexEnabled ? obj.baseOpacity : 0;
  }
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


function wilhelmScream() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.4, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(350, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(850, ctx.currentTime + 0.12);
  osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.35);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.9);
  osc.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + 1.0);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(175, ctx.currentTime);
  osc2.frequency.linearRampToValueAtTime(425, ctx.currentTime + 0.12);
  osc2.frequency.linearRampToValueAtTime(225, ctx.currentTime + 0.35);
  osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.9);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.2, ctx.currentTime);
  osc2.connect(g2);
  g2.connect(master);
  osc2.start();
  osc2.stop(ctx.currentTime + 1.0);
}

function sfxVictory() {
  [400, 500, 600, 800].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 0.3, "square"), i * 120);
  });
}

function sfxGameOver() {
  playTone(300, 0.3, 0.3, "sawtooth", 50);
  setTimeout(() => playTone(200, 0.3, 0.25, "sawtooth", 30), 250);
  setTimeout(() => playTone(100, 0.5, 0.2, "sawtooth"), 500);
  setTimeout(() => playNoise(1.5, 1.0, 500, "lowpass"), 800);
}

function sfxItemPickup() { playTone(800, 0.08, 0.2, "square"); setTimeout(() => playTone(1000, 0.1, 0.25, "square"), 60); }

function sfxCombo() { playTone(500 + Math.random() * 400, 0.08, 0.15, "square"); }

function sfxMenuSelect() { playTone(700, 0.06, 0.15, "square"); }

// Background music: drum & bass loop
let musicInterval = null;

// ============================================================
// MUSIC THEMES — cada nivel tiene su propia música para
// las oleadas normales, el miniboss y el boss
// ============================================================

const MUSIC_THEMES = {
  street:        { bpm:120, kicks:[0,2],            snares:[3,7],                hihats:[1,3,5,7,9,11,13,15], bass:[[0,110,0.3,0.1],[4,82,0.3,0.1]] },
  streetMiniboss:{ bpm:130, kicks:[0,2,4,6],        snares:[3,7,11,15],          hihats:[1,3,5,7,9,11,13,15], bass:[[0,110,0.2,0.1],[2,110,0.2,0.1],[4,82,0.2,0.1],[6,82,0.2,0.1]] },
  streetBoss:    { bpm:100, kicks:[0,2,4,6,8,10,12,14], snares:[1,3,5,7,9,11,13,15], hihats:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], bass:[[0,55,0.4,0.2],[8,55,0.4,0.2]] },

  rooftop:       { bpm:125, kicks:[0,2],            snares:[3,7],                hihats:[1,2,3,5,6,7,9,10,11,13,14,15], bass:[[0,130,0.25,0.1],[4,98,0.25,0.1]] },
  rooftopMiniboss:{bpm:140, kicks:[0,2,4,6],        snares:[3,7,11,15],          hihats:[1,3,5,7,9,11,13,15], bass:[[0,130,0.2,0.1],[2,130,0.2,0.1],[4,98,0.2,0.1],[6,98,0.2,0.1]] },
  rooftopBoss:   { bpm:110, kicks:[0,2,4,6,8,10,12,14], snares:[1,3,5,7,9,11,13,15], hihats:[0,2,4,6,8,10,12,14], bass:[[0,65,0.35,0.15],[6,65,0.35,0.15]] },

  factory:       { bpm:115, kicks:[0,2],            snares:[3,7,11],             hihats:[1,3,5,7,9,11,13,15], bass:[[0,100,0.3,0.1],[4,75,0.3,0.1]] },
  factoryMiniboss:{bpm:150, kicks:[0,3,6,9,12],     snares:[2,5,8,11,14],        hihats:[1,3,5,7,9,11,13,15], bass:[[0,100,0.15,0.1],[3,100,0.15,0.1],[6,75,0.15,0.1],[9,75,0.15,0.1],[12,100,0.15,0.1]] },
  factoryBoss:   { bpm:90,  kicks:[0,4,8,12],       snares:[2,6,10,14],          hihats:[0,2,4,6,8,10,12,14], bass:[[0,50,0.5,0.2],[8,50,0.5,0.2]] },

  tutorial: { bpm:110, kicks:[0,2,4,6],        snares:[3,7,11,15],          hihats:[1,3,5,7,9,11,13,15], bass:[[0,260,0.15,0.1],[4,260,0.15,0.1],[8,196,0.15,0.1],[12,196,0.15,0.1]] },

  versusSelect:{bpm:100, kicks:[0,6],            snares:[3,11],                hihats:[1,3,5,7,9,11,13,15], bass:[[0,110,0.3,0.1],[6,82,0.3,0.1]] },
  versusFight: {bpm:130, kicks:[0,2,4,6],        snares:[3,7,11,15],           hihats:[1,3,5,7,9,11,13,15], bass:[[0,55,0.4,0.2],[4,73,0.3,0.15],[8,82,0.3,0.15],[12,73,0.3,0.15]] },

  title: { bpm:170, kicks:[0,2,4,6,8,10,12,14], snares:[3,7,11,15], hihats:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], bass:[[0,55,0.4,0.15],[4,73,0.3,0.1],[8,55,0.4,0.15],[12,73,0.3,0.1]] },

  streetRevive:{ bpm:60,  kicks:[0,8],             snares:[],                    hihats:[3,7,11,15],          bass:[[0,55,0.5,0.3],[8,55,0.5,0.3]] },
  rooftopRevive:{bpm:55,  kicks:[0,8],             snares:[],                    hihats:[3,7,11,15],          bass:[[0,65,0.5,0.3],[8,65,0.5,0.3]] },
  factoryRevive:{bpm:50,  kicks:[0,8],             snares:[],                    hihats:[3,7,11,15],          bass:[[0,50,0.6,0.3],[8,50,0.6,0.3]] },
  gameOver: { bpm:40,  kicks:[0,8],             snares:[],                    hihats:[4,12],               bass:[[0,30,0.8,0.5],[8,25,0.8,0.5]] },
  leyenda: { bpm:70,  kicks:[0,4,8,12],         snares:[],                    hihats:[2,6,10,14],          bass:[[0,65,0.4,0.2],[8,65,0.4,0.2]] },
};

function currentLevelTheme() {
  const lvl = LEVELS[state.currentLevel];
  return lvl ? lvl.bgType : "street";
}

let currentMusicSuffix = "";

function changeMusic(suffix) {
  const theme = MUSIC_THEMES[suffix] ? suffix : currentLevelTheme() + suffix;
  const cfg = MUSIC_THEMES[theme];
  currentMusicSuffix = suffix;
  if (!cfg) return;
  stopMusic();
  if (!soundEnabled) return;
  if (!soundCtx) return;
  initAudio();
  let beat = 0;
  const BPM = cfg.bpm;
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

  musicInterval = setInterval(() => {
    if (!soundEnabled) return;
    if (soundCtx.state === "suspended") soundCtx.resume();
    if (cfg.kicks.includes(beat)) kick();
    if (cfg.snares.includes(beat)) snare();
    if (cfg.hihats.includes(beat)) hihat();
    for (const b of cfg.bass) {
      if (beat % 16 === b[0]) playTone(b[1], b[2], b[3], "square");
    }
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
loadSprite("punkette", "punkette sprite.png");
loadSprite("antagonic", "antagonic sprite.png");
loadSprite("xero", "x-ero sprite.png");
loadSprite("matonBasico", "maton basico sprite.png");
loadSprite("matonMedio", "maton medio sprite.png");
loadSprite("elBruto", "el bruto sprite.png");
loadSprite("bossDirector", "big boss 1 sprite.png");
loadSprite("bossQuimica", "big boss 2 sprite.png");
loadSprite("bossColoso", "big boss 3 sprite.png");
loadSprite("versusBg", "versus scene.png");
loadSprite("titleBg", "title-screen-640.png");
loadSprite("selectBg", "character-selection-scene.png");
loadSprite("gauntletSelectBg", "gauntlet-seleccion-bg.png");
loadSprite("gameOverBg", "game-over-scene.png");
loadSprite("leyendaBg", "leyenda-scene.png");
loadSprite("victoryBgPunkette", "victory-the-end-punkette-bg.png");
loadSprite("victoryBgXero", "victory-the-end-x-ero-bg.png");
loadSprite("victoryBgAntagonic", "victory-the-end-antagonic-bg.png");
loadSprite("victoryBgAll", "victory-the-end-scene-bg.png");
loadSprite("victoryBgCoop", "historia-co-op-ending-bg.png");
loadSprite("victoryBgFriendlyFire", "historia-friendly-fire-ending-bg.png");
loadSprite("victoryBgChampion", "versus-scene-champion-ending-bg.png");
loadSprite("optionsMenuBg", "options-menu-bg.png");

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

function createCharacter(x, y, type, tag, spriteName) {
  const F = tag === "boss" ? 3 : 2;
  const DS = F;

  const cfg = CHAR_CONFIG[type];

  // Sprite characters — no white rect, collision via explicit area
  const spriteCfg = spriteName ? { name: spriteName, w: 95, h: 125 } : CHAR_SPRITES[type];
  if (spriteCfg) {
    const scaleFactor = (48 * F) / spriteCfg.h * (isVersusMode ? 3.0 : 1.5);
    const char = add([
      pos(x, y),
      area({ shape: new Rect(vec2(-14 * F, -24 * F), 28 * F, 48 * F) }),
      anchor("center"),
      scale(1),
      z(10),
      "char",
      tag,
      {
        hp: cfg.hp, maxHp: cfg.hp, speed: cfg.speed,
        facing: 1, attackTimer: 0, comboTimer: 0,
        comboCount: 0, lastComboMilestone: 0, kills: 0,
        downed: false, reviveTimer: 0, hitTimer: 0,
        dead: false, invincible: 0, isAirborne: false,
        jumpVy: 0, jumpStartY: y, superCooldown: 0,
        type, parts: [],
        bodyW: cfg.bodyW * F, bodyH: cfg.bodyH * F,
        headW: cfg.headW * F, headH: cfg.headH * F,
        armW: cfg.armW * F, armH: cfg.armH * F,
        legW: cfg.legW * F, legH: cfg.legH * F,
        useSprite: true,
      },
    ]);
    char.add([sprite(spriteCfg.name), pos(0, 0), anchor("center"), scale(scaleFactor)]);
    return char;
  }

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

const CHAR_SPRITES = {
  punkette: { name: "punkette", w: 300, h: 450 },
  antagonic: { name: "antagonic", w: 300, h: 450 },
  xero: { name: "xero", w: 300, h: 450 },
  grunt: { name: "matonBasico", w: 95, h: 125 },
  punk: { name: "matonMedio", w: 95, h: 125 },
  tough: { name: "elBruto", w: 95, h: 125 },
};

const BOSS_SPRITE_KEYS = {
  street: "bossDirector",
  rooftop: "bossQuimica",
  factory: "bossColoso",
};

const BOSS_NAMES = {
  street: "EL DIRECTOR",
  rooftop: "LA QUIMICA",
  factory: "EL COLOSO",
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

  function hitPlayer(other) {
    if (other === owner || other.invincible > 0 || other.dead || other.downed) return;
    other.hp -= damage;
    other.invincible = 0.3;
    other.hitTimer = 0.15;
    setHitPose(other);
    screenShake(4, 0.12);
    if (curState) curState.hitPause = 0.04;
    sfxHitPlayer();
    spawnDamagePopup(other.pos.x, other.pos.y - 15, damage, dir);
    wait(0.02, () => {
      if (!other.dead) other.pos.x += -dir * knockback;
    });
  }

  if (isPlayer) {
    hb.onCollide("enemy", (enemy) => {
        if (enemy.invincible > 0 || enemy.dead) return;
        hitEnemy(enemy, damage, knockback, dir, owner);
      });
      hb.onCollide("boss", (boss) => {
        if (boss.invincible > 0 || boss.dead) return;
        hitEnemy(boss, damage, knockback, dir, owner);
      });
      if (isVersusMode || (curState && curState.friendlyFire)) {
        hb.onCollide("player", hitPlayer);
      }
  } else {
    hb.onUpdate(() => {
      if (!curState) return;
      for (const player of curState.players) {
        if (player.dead || player.downed || player === owner || player.invincible > 0) continue;
        if (hb.isColliding(player)) {
          hitPlayer(player);
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
    if (!isVersusMode) {
      enemy.dead = true;
      if (!enemy.is("player")) sfxKill();
      if (attacker && attacker.kills !== undefined) attacker.kills++;
      events.emit("enemy-killed", enemy);
      if (!enemy.isBoss) destroy(enemy);
    }
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
  for (let i = 0; i < 12; i++) {
    add([
      circle(rand(4, 12)),
      color(WHITE),
      pos(x + rand(-20, 20), y + rand(-20, 20)),
      opacity(rand(0.4, 0.8)),
      lifespan(rand(0.2, 0.6)),
      anchor("center"),
      z(15),
    ]);
  }
  const groundOffY = isVersusMode ? rand(55, 80) : rand(50, 70);
  for (let i = 0; i < 6; i++) {
    add([
      circle(rand(5, 15)),
      scale(rand(1.5, 2.5), rand(0.3, 0.6)),
      color(WHITE),
      pos(x + rand(-35, 35), y + groundOffY),
      opacity(rand(0.3, 0.6)),
      lifespan(rand(1.5, 3.0)),
      anchor("center"),
      z(5),
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
// TOUCH CONTROLS (mobile)
// ============================================================

(function() {
  if (!isTouchDevice) return;

  const container = document.getElementById('touch-controls');
  if (!container) return;
  container.style.display = 'block';

  const keyState = {};
  const activeTouches = {};

  const keyCodeMap = {
    "j":74,"k":75,"l":76,"w":87,"a":65,"s":83,"d":68,"1":49,"2":50,"3":51,
    "escape":27,"space":32,"enter":13,
    "left":37,"right":39,"up":38,"down":40,
  };

  function fireKey(key, type) {
    if (type === 'keydown' && keyState[key]) return;
    if (type === 'keyup' && !keyState[key]) return;
    keyState[key] = type === 'keydown';
    const ev = new KeyboardEvent(type, {
      key, code: key.length === 1 ? 'Key' + key.toUpperCase() : key,
      bubbles: true, cancelable: true,
    });
    const c = keyCodeMap[key];
    if (c !== undefined) {
      Object.defineProperty(ev, 'keyCode', { value: c });
      Object.defineProperty(ev, 'which', { value: c });
    }
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
  }

  function pressBtn(btn) {
    btn.classList.add('pressed');
    const key = btn.dataset.key;
    if (key) {
      touchKeys[key] = true;
      if (touchPressCallbacks[key]) touchPressCallbacks[key]();
      fireKey(key, 'keydown');
    }
    if (btn.dataset.super !== undefined) {
      touchKeys['k'] = true; touchKeys['j'] = true;
      if (touchPressCallbacks['k']) touchPressCallbacks['k']();
      if (touchPressCallbacks['j']) touchPressCallbacks['j']();
      fireKey('k', 'keydown');
      fireKey('j', 'keydown');
    }
  }

  function releaseBtn(btn) {
    btn.classList.remove('pressed');
    const key = btn.dataset.key;
    if (key) {
      touchKeys[key] = false;
      if (touchReleaseCallbacks[key]) touchReleaseCallbacks[key]();
      fireKey(key, 'keyup');
    }
    if (btn.dataset.super !== undefined) {
      touchKeys['j'] = false; touchKeys['k'] = false;
      if (touchReleaseCallbacks['j']) touchReleaseCallbacks['j']();
      if (touchReleaseCallbacks['k']) touchReleaseCallbacks['k']();
      fireKey('j', 'keyup');
      fireKey('k', 'keyup');
    }
  }

  document.querySelectorAll('#touch-controls .btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        activeTouches[touch.identifier] = btn;
      }
      pressBtn(btn);
    }, { passive: false });

    btn.addEventListener('touchmove', (e) => {
      for (const touch of e.changedTouches) {
        const currentBtn = activeTouches[touch.identifier];
        if (!currentBtn) return;
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!target || !target.closest('.btn')) {
          releaseBtn(currentBtn);
          delete activeTouches[touch.identifier];
        }
      }
    }, { passive: true });
  });

  document.addEventListener('touchend', (e) => {
    for (const touch of e.changedTouches) {
      const btn = activeTouches[touch.identifier];
      if (btn) {
        releaseBtn(btn);
        delete activeTouches[touch.identifier];
      }
    }
  }, { passive: true });

  document.addEventListener('touchcancel', (e) => {
    for (const touch of e.changedTouches) {
      const btn = activeTouches[touch.identifier];
      if (btn) {
        releaseBtn(btn);
        delete activeTouches[touch.identifier];
      }
    }
  }, { passive: true });
})();

// ============================================================
// TITLE SCENE
// ============================================================

scene("title", () => {
  document.addEventListener("keydown", () => {
    initAudio();
    stopMusic();
    changeMusic("title");
  }, { once: true });
  stopMusic();
  add([sprite("titleBg"), fixed(), z(0)]);
  // paperTex over background for ink texture
  add([sprite("paperTex"), opacity(0.12), z(100), fixed(), "paperTex"]).baseOpacity = 0.12;

  let blink = 0;

  // Menu items
  const MENU_LABELS = ["THE WARZINE", "THE GAUNTLET", "TUTORIAL", "OPTIONS"];
  const ITEM_COUNT = 4;
  const ITEM_YS = [240, 280, 320, 360];
  let menuItems = [];
  for (let i = 0; i < ITEM_COUNT; i++) {
    menuItems.push(add([
      text(MENU_LABELS[i], { size: 22, font: "sans-serif" }),
      pos(W / 2, ITEM_YS[i]),
      anchor("center"),
      color(INK),
      fixed(),
      z(10),
    ]));
  }

  // Cursors
  let cursorP1 = 1, cursorP2 = 1;
  const p1Arrow = add([
    text(">", { size: 24, font: "sans-serif" }),
    pos(W / 2 - 170, ITEM_YS[1]),
    anchor("center"),
    color(WHITE),
    outline(3),
    fixed(),
    z(10),
  ]);
  const p2Arrow = add([
    text("<", { size: 24, font: "sans-serif" }),
    pos(W / 2 + 170, ITEM_YS[1]),
    anchor("center"),
    color(WHITE),
    outline(3),
    fixed(),
    z(10),
  ]);

  // Controls
  const ctrlText = add([
    text(isTouchDevice ? "P1: TOUCH BUTTONS" : "P1: WASD+J/K/L  P2: ARROWS+1/2+3", { size: 12, font: "sans-serif" }),
    pos(W / 2, H - 15),
    anchor("center"),
    color(WHITE),
    fixed(),
    z(10),
  ]);

  // Version & dev toggles
  const paperTexLabel = add([
    text("[ P ]", { size: 10, font: "sans-serif" }),
    pos(W - 55, H - 15), anchor("center"), color(WHITE), fixed(), z(10),
  ]);

  let _lastTouchJ = false;
  let _lastTouchUp = false, _lastTouchDown = false;
  let _lastTouchLeft = false, _lastTouchRight = false;
  let started = false;

  onUpdate(() => {
    blink += dt();
    ctrlText.opacity = 0.5 + Math.sin(blink * 0.3) * 0.3;

    // Cursor arrows
    p1Arrow.pos.y = ITEM_YS[cursorP1];
    p2Arrow.pos.y = ITEM_YS[cursorP2];

    // Highlight item where either cursor is
    for (let i = 0; i < ITEM_COUNT; i++) {
      menuItems[i].opacity = (i === cursorP1 || i === cursorP2) ? 1 : 0.4;
    }

    // [P] indicator opacity
    paperTexLabel.opacity = paperTexEnabled ? 1 : 0.4;

    // Touch key press polling
    if (touchKeys['j'] && !_lastTouchJ && !started) {
      started = true; sfxMenuSelect();
      gameFriendlyFire = friendlyFireOn;
      if (cursorP1 === 0) {
        let cleared = JSON.parse(localStorage.getItem("warzine_cleared") || "[]");
        if (cleared.length >= 3) { localStorage.removeItem("warzine_cleared"); cleared = []; }
        go("select", { p1: true, p2: false, locked: cleared, storyMode: true });
      }
      else if (cursorP1 === 1) go("versus", { initiatorPid: 1 });
      else if (cursorP1 === 2) go("tutorial");
      else if (cursorP1 === 3) { started = false; go("options", { pid: 1 }); }
      else started = false;
    }
    _lastTouchJ = !!touchKeys['j'];

    if (touchKeys['up'] && !_lastTouchUp) { cursorP1 = (cursorP1 - 1 + ITEM_COUNT) % ITEM_COUNT; sfxMenuSelect(); }
    if (touchKeys['down'] && !_lastTouchDown) { cursorP1 = (cursorP1 + 1) % ITEM_COUNT; sfxMenuSelect(); }
    _lastTouchUp = !!touchKeys['up'];
    _lastTouchDown = !!touchKeys['down'];
    _lastTouchLeft = !!touchKeys['left'];
    _lastTouchRight = !!touchKeys['right'];
  });

  // --- P1 controls ---
  onKeyPress("w", () => { cursorP1 = (cursorP1 - 1 + ITEM_COUNT) % ITEM_COUNT; sfxMenuSelect(); });
  onKeyPress("s", () => { cursorP1 = (cursorP1 + 1) % ITEM_COUNT; sfxMenuSelect(); });

  onKeyPress("a", () => {
    if (cursorP1 === 3) { sfxMenuSelect(); go("options", { pid: 1 }); }
  });
  onKeyPress("d", () => {
    if (cursorP1 === 3) { sfxMenuSelect(); go("options", { pid: 1 }); }
  });

  onKeyPress("j", () => {
    if (started) return;
    started = true; sfxMenuSelect();
    gameFriendlyFire = friendlyFireOn;
    if (cursorP1 === 0) {
      let cleared = JSON.parse(localStorage.getItem("warzine_cleared") || "[]");
      if (cleared.length >= 3) { localStorage.removeItem("warzine_cleared"); cleared = []; }
      go("select", { p1: true, p2: false, locked: cleared, storyMode: true });
    }
    else if (cursorP1 === 1) go("versus", { initiatorPid: 1 });
    else if (cursorP1 === 2) go("tutorial");
    else if (cursorP1 === 3) { started = false; go("options", { pid: 1 }); }
    else started = false;
  });

  // --- P2 controls ---
  if (!isTouchDevice) {
    onKeyPress("up", () => { cursorP2 = (cursorP2 - 1 + ITEM_COUNT) % ITEM_COUNT; sfxMenuSelect(); });
    onKeyPress("down", () => { cursorP2 = (cursorP2 + 1) % ITEM_COUNT; sfxMenuSelect(); });

    onKeyPress("left", () => {
      if (cursorP2 === 3) { sfxMenuSelect(); go("options", { pid: 2 }); }
    });
    onKeyPress("right", () => {
      if (cursorP2 === 3) { sfxMenuSelect(); go("options", { pid: 2 }); }
    });

    onKeyPress("1", () => {
      if (started) return;
      started = true; sfxMenuSelect();
      gameFriendlyFire = friendlyFireOn;
      if (cursorP2 === 0) {
        let cleared = JSON.parse(localStorage.getItem("warzine_cleared") || "[]");
        if (cleared.length >= 3) { localStorage.removeItem("warzine_cleared"); cleared = []; }
        go("select", { p1: false, p2: true, locked: cleared, storyMode: true });
      }
      else if (cursorP2 === 1) go("versus", { initiatorPid: 2 });
      else if (cursorP2 === 2) go("tutorial");
      else if (cursorP2 === 3) { started = false; go("options", { pid: 2 }); }
      else started = false;
    });
  }

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// OPTIONS SCENE
// ============================================================

scene("options", (opts) => {
  const pid = (opts && opts.pid) || 1;
  stopMusic();
  changeMusic("title");
  add([sprite("optionsMenuBg"), fixed(), z(0)]);
  add([sprite("paperTex"), opacity(0.15), z(100), fixed(), "paperTex"]).baseOpacity = 0.15;

  const OPTION_LABELS = [
    () => "FF: " + (friendlyFireOn ? "FRIENDLY FIRE" : "CO-OP"),
    () => "DIFFICULTY: " + DIFFICULTIES[gameDifficulty],
    () => "CREDITOS",
  ];
  const OPTION_COUNT = 3;
  const OPTION_YS = [195, 245, 295];

  let cursor = 0;
  let items = [];

  for (let i = 0; i < OPTION_COUNT; i++) {
    items.push(add([
      text(OPTION_LABELS[i](), { size: 22, font: "sans-serif" }),
      pos(W / 2, OPTION_YS[i]),
      anchor("center"),
      color(INK),
      fixed(),
      z(10),
    ]));
  }

  function render() {
    for (let i = 0; i < OPTION_COUNT; i++) {
      items[i].text = OPTION_LABELS[i]();
      items[i].opacity = i === cursor ? 1 : 0.4;
    }
  }

  const arrow = add([
    text(">", { size: 24, font: "sans-serif" }),
    pos(W / 2 - 170, OPTION_YS[0]),
    anchor("center"),
    color(INK),
    fixed(),
    z(10),
  ]);

  function updateArrow() { arrow.pos.y = OPTION_YS[cursor]; }

  function doAction() {
    if (cursor === 2) { sfxMenuSelect(); go("credits", false, true); return; }
  }

  function changeValue(dir) {
    if (cursor === 0) friendlyFireOn = !friendlyFireOn;
    if (cursor === 1) gameDifficulty = (gameDifficulty + dir + 3) % 3;
    sfxMenuSelect();
    render();
  }

  function goBack() {
    sfxMenuSelect();
    go("title");
  }

  render();
  updateArrow();

  // Navigation
  const navUp = pid === 1 ? "w" : "up";
  const navDown = pid === 1 ? "s" : "down";
  const navLeft = pid === 1 ? "a" : "left";
  const navRight = pid === 1 ? "d" : "right";
  const backKey = pid === 1 ? "j" : "1";

  onKeyPress(navUp, () => { cursor = (cursor - 1 + OPTION_COUNT) % OPTION_COUNT; sfxMenuSelect(); render(); updateArrow(); });
  onKeyPress(navDown, () => { cursor = (cursor + 1) % OPTION_COUNT; sfxMenuSelect(); render(); updateArrow(); });

  // Both players can use arrow keys for navigation
  onKeyPress("up", () => { cursor = (cursor - 1 + OPTION_COUNT) % OPTION_COUNT; sfxMenuSelect(); render(); updateArrow(); });
  onKeyPress("down", () => { cursor = (cursor + 1) % OPTION_COUNT; sfxMenuSelect(); render(); updateArrow(); });

  // Value change and confirm
  onKeyPress(navLeft, () => changeValue(-1));
  onKeyPress(navRight, () => changeValue(1));
  onKeyPress("left", () => changeValue(-1));
  onKeyPress("right", () => changeValue(1));

  onKeyPress(backKey, () => { if (cursor === 2) doAction(); else goBack(); });
  onKeyPress("enter", () => { if (cursor === 2) doAction(); else goBack(); });
  onKeyPress("space", () => { if (cursor === 2) doAction(); else goBack(); });
  onKeyPress("escape", goBack);
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// SELECT SCENE
// ============================================================

const CHAR_OPTIONS = ["punkette", "antagonic", "xero"];
const CHAR_NAMES = { punkette: "PUNKETTE", antagonic: "ANTAGONIC", xero: "X-ERO" };

const CHAR_LORE = {
  punkette: {
    tagline: "La rebelión nació mucho antes de que alguien la llamara revolución.",
    intro: ["No vine a salvar la ciudad.", "Solo vine a recuperar lo que nos quitaron."],
    levels: [
      ["Cada muro tiene un nombre.", "Hoy van a recordar el mío."],
      ["La corporación compra silencio.", "Yo prefiero hacer ruido."],
      ["Antes pintaba murales.", "Ahora dejo cicatrices."],
      ["Cuanto más se acercan al centro,", "más miedo tienen de la verdad."],
      ["No estoy sola.", "Solo voy adelante."],
      ["Los drones vigilan el cielo.", "Nunca aprendieron a mirar abajo."],
      ["Las calles todavía recuerdan.", "Aunque ellos intenten borrarlas."],
      ["Si hoy caigo,", "que sea haciendo suficiente ruido."],
    ],
    final: ["Una ciudad no cambia por una pelea.", "Pero toda revolución empieza con la primera."],
  },
  xero: {
    tagline: "Un arma que decidió pensar por sí misma.",
    intro: ["Fui construido para obedecer.", "Hoy comienzo a decidir."],
    levels: [
      ["Cada golpe altera mis registros.", "No encuentro errores."],
      ["Empiezo a comprender el miedo.", "No me gusta."],
      ["Los humanos llaman esperanza...", "a seguir avanzando."],
      ["Mi programación insiste en detenerme.", "Mi voluntad dice otra cosa."],
      ["No quiero ser perfecto.", "Quiero ser libre."],
      ["He dejado de calcular probabilidades.", "Ahora simplemente lucho."],
      ["Cada decisión me hace menos máquina.", "Y más yo."],
      ["No puedo reescribir mi pasado.", "Pero sí mi siguiente movimiento."],
    ],
    final: ["Hoy dejaron de llamarme unidad.", "Mi nombre es X-ERO."],
  },
  antagonic: {
    tagline: "El mejor soldado de la corporación... hasta que descubrió la verdad.",
    intro: ["Juré proteger el orden.", "Nunca pregunté a quién protegía."],
    levels: [
      ["Las órdenes eran simples.", "La realidad no."],
      ["He perseguido rebeldes.", "Ahora entiendo por qué corrían."],
      ["El uniforme pesa más,", "desde que abrí los ojos."],
      ["Los viejos compañeros...", "disparan sin hacer preguntas."],
      ["Nunca imaginé que la traición", "se sintiera tan correcta."],
      ["Cada puerta que cruzo", "es una puerta que ellos cerraron."],
      ["Ya no peleo por la corporación.", "Peleo contra ella."],
      ["No busco perdón.", "Solo terminar lo que empecé."],
    ],
    final: ["El último soldado cayó.", "El primer hombre siguió caminando."],
  },
};

const DIFFICULTIES = ["EASY", "NORMAL", "HARD"];
let gameDifficulty = 1; // 0=easy, 1=normal, 2=hard
let gameFriendlyFire = false;
let friendlyFireOn = false;

scene("select", (opts) => {
  if (!opts) opts = {};
  let locked = opts.locked || [];
  const storyMode = opts.storyMode || false;
  const isLocked = (t) => storyMode && locked.includes(t);
  let p1Active = opts.p1 !== false;
  let p2Active = storyMode ? false : (opts.p2 === true);
  if (isTouchDevice) p2Active = false;

  add([sprite("selectBg"), fixed(), z(0)]);
  add([sprite("paperTex"), opacity(0.15), z(100), fixed(), "paperTex"]).baseOpacity = 0.15;

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
      if (CHAR_OPTIONS[c] !== taken && !isLocked(CHAR_OPTIONS[c])) return c;
    }
    return current;
  }

  const previews = [];
  // Skip to first unlocked char if current is locked
  if (storyMode && isLocked(CHAR_OPTIONS[p1Choice])) {
    p1Choice = nextAvail(p1Choice, 1, null);
  }
  function renderSelect() {
    for (const p of previews) destroy(p);
    previews.length = 0;

    const p1Taken = p2Locked ? CHAR_OPTIONS[p2Choice] : null;
    const p2Taken = p1Locked ? CHAR_OPTIONS[p1Choice] : null;

    if (p1Active) {
      const locked = isLocked(CHAR_OPTIONS[p1Choice]);
      const p1Label = add([
        text(locked ? "COMPLETADO" : "P1: " + CHAR_NAMES[CHAR_OPTIONS[p1Choice]] + (p1Locked ? " (LOCKED)" : " (A/D)"), { size: 12, font: "sans-serif" }),
        pos(W / 4, 80), anchor("center"), color(locked ? GRAY : INK), fixed(), z(10),
      ]);
      previews.push(p1Label);

      const p1Char = createCharacter(W / 4, 250, CHAR_OPTIONS[p1Choice], "preview");
      p1Char.scale.x = 1;
      if (locked) p1Char.opacity = 0.3;
      previews.push(p1Char);
    }

    if (p2Active) {
      const p2LabelTxt = (p2Locked && p2Taken === CHAR_OPTIONS[p1Choice])
        ? "P2: " + CHAR_NAMES[CHAR_OPTIONS[p2Choice]] + " (LOCKED)"
        : "P2: " + CHAR_NAMES[CHAR_OPTIONS[p2Choice]] + (p2Locked ? " (LOCKED)" : " (< >)");
      const p2Label = add([
        text(p2LabelTxt, { size: 12, font: "sans-serif" }),
        pos(3 * W / 4, 80), anchor("center"), color(INK), fixed(), z(10),
      ]);
      previews.push(p2Label);

      const p2Char = createCharacter(3 * W / 4, 250, CHAR_OPTIONS[p2Choice], "preview");
      p2Char.scale.x = -1;
      if (p2Locked && p2Taken === CHAR_OPTIONS[p1Choice]) p2Char.opacity = 0.3;
      previews.push(p2Char);
    }

    // Available characters bar
    const barY = 340;
    add([text("--- CHARACTERS ---", { size: 10, font: "sans-serif" }), pos(W / 2, barY - 15), anchor("center"), color(INK), fixed(), z(10)]);
    for (let i = 0; i < CHAR_OPTIONS.length; i++) {
      const locked = isLocked(CHAR_OPTIONS[i]);
      const taken = (p1Active && p1Locked && CHAR_OPTIONS[i] === CHAR_OPTIONS[p1Choice]) ||
                    (p2Active && p2Locked && CHAR_OPTIONS[i] === CHAR_OPTIONS[p2Choice]);
      const bx = W / 2 - (CHAR_OPTIONS.length - 1) * 45 + i * 90;
      const bg = add([rect(70, 20), outline(2), color(taken || locked ? GRAY : WHITE), pos(bx, barY), anchor("center"), fixed(), z(10)]);
      previews.push(bg);
      const tx = add([
        text(CHAR_NAMES[CHAR_OPTIONS[i]], { size: 7, font: "sans-serif" }),
        pos(bx, barY), anchor("center"), color(taken || locked ? GRAY : INK), fixed(), z(11),
      ]);
      previews.push(tx);
      if (taken) {
        const xMark = add([
          text("X", { size: 10, font: "sans-serif" }),
          pos(bx + 25, barY - 8), anchor("center"), color(INK), fixed(), z(11),
        ]);
        previews.push(xMark);
      }
      if (locked && !taken) {
        const done = add([
          text("COMPLETADO", { size: 6, font: "sans-serif" }),
          pos(bx, barY + 8), anchor("center"), color(GRAY), fixed(), z(11),
        ]);
        previews.push(done);
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
    if (storyMode && isLocked(CHAR_OPTIONS[p1Choice])) return;
    p1Locked = true;
    sfxMenuSelect();
    renderSelect();
  });

  // P2 Navigation & lock (always register, guard at runtime)
  if (!isTouchDevice) {
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
    if (!p2Active) {
      if (storyMode) locked = [];
      p2Active = true; p2Choice = nextAvail(p2Choice, 0, p1Locked ? CHAR_OPTIONS[p1Choice] : null); sfxMenuSelect(); renderSelect(); return;
    }
    if (p2Locked) return;
    p2Locked = true;
    sfxMenuSelect();
    renderSelect();
  });
  } // !isTouchDevice

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

  // Back to title
  onKeyPress("escape", () => { sfxMenuSelect(); go("title"); });

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// GAME SCENE
// ============================================================

scene("game", (p1Type, p2Type) => {
  if (!p2Type) p2Type = null;
  events.clear();
  const charType = p1Type || p2Type;

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
    friendlyFire: gameFriendlyFire,
  };
  curState = state;

  // ---- DIFFICULTY MULTIPLIERS ----
  state.diffMul = (() => {
    if (gameDifficulty === 0) return { enemyHp: 0.7, enemyDmg: 0.7, playerDmg: 1.3, waveCount: 0.75, label: "EASY" };
    if (gameDifficulty === 2) return { enemyHp: 1.5, enemyDmg: 1.5, playerDmg: 0.8, waveCount: 1.25, label: "HARD" };
    return { enemyHp: 1, enemyDmg: 1, playerDmg: 1, waveCount: 1, label: "NORMAL" };
  })();
  const diffMul = state.diffMul;

  // ---- LEYENDA SYSTEM ----
  function showLeyenda(lines, subtitle, onComplete, tagline) {
    changeMusic("title");
    const parts = [];

    parts.push(add([sprite("leyendaBg"), pos(0, 0), fixed(), z(200)]));

    if (tagline) {
      parts.push(add([
        text(tagline, { size: 16, font: "sans-serif", width: 420, align: "center", lineSpacing: 8 }),
        pos(W / 2, 158), anchor("center"), color(WHITE), opacity(0.5), fixed(), z(202),
      ]));
    }

    const startY = 250;
    parts.push(add([
      text(lines.join("\n"), { size: 28, font: "sans-serif", width: 420, align: "center", lineSpacing: 14 }),
      pos(W / 2, startY), anchor("center"), color(WHITE), fixed(), z(202),
    ]));

    if (subtitle) {
      parts.push(add([
        text(subtitle, { size: 16, font: "sans-serif", width: 420, align: "center", lineSpacing: 8 }),
        pos(W / 2, 345), anchor("center"), color(WHITE), opacity(0.7), fixed(), z(202),
      ]));
    }

    const kp = onKeyPress(() => {
      kp.cancel();
      parts.forEach(destroy);
      if (onComplete) onComplete();
    });
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
  add([sprite("paperTex"), opacity(0.18), z(90), fixed(), "paperTex"]).baseOpacity = 0.18;

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
      if (isKeyDown(c.left) || touchKeys[c.left]) dx -= 1;
      if (isKeyDown(c.right) || touchKeys[c.right]) dx += 1;
      if (!char.isAirborne) {
        if (isKeyDown(c.up) || touchKeys[c.up]) dy -= 1;
        if (isKeyDown(c.down) || touchKeys[c.down]) dy += 1;
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
    const punchFn = () => {
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.attackCooldown > 0) return;
      if (char.dodgeTimer > 0) return;

      // Super attack (A+B)
      if ((isKeyDown(controls.jump) || touchKeys[controls.jump]) && char.superCooldown <= 0) {
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
    };
    onKeyPress(controls.punch, punchFn);
    touchPressCallbacks[controls.punch] = punchFn;

    // Jump
    const jumpFn = () => {
      if (char.dead || char.downed || state.gameOver || state.victory || state.hitPause > 0) return;
      if (char.hitTimer > 0) return;
      if (char.isAirborne) return;

      char.isAirborne = true;
      char.jumpVy = JUMP_FORCE;
      char.jumpStartY = char.pos.y;
      sfxJump();
    };
    onKeyPress(controls.jump, jumpFn);
    touchPressCallbacks[controls.jump] = jumpFn;

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
        if (state.paused || state.victory) return;
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
      char.hp = Math.floor(char.maxHp * 1.0);
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
  if (!isTouchDevice) joinSlots.push({ key: "1", playerId: 2, label: "P2", spawnX: 250, controls: { left: "left", right: "right", up: "up", down: "down", punch: "1", jump: "2", dodge: "3" } });

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

    const level = LEVELS[lvl];
    state.waveConfigIdx = level.preMidStart;
    switchBg(level.bgType);
    changeMusic("");
    startWave(WAVE_CONFIGS[state.waveConfigIdx], WAVE_CONFIGS[state.waveConfigIdx].title);
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
    changeMusic("Miniboss");
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
      changeMusic("");

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
    changeMusic("Boss");
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
    const bossName = BOSS_NAMES[state.bgType] || "BOSS";
    add([
      text(bossName + " APPROACHING", { size: 20, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(1),
      lifespan(2),
    ]);

    wait(1.5, () => {
      const boss = createCharacter(W / 2, H - 100, "boss", "boss", BOSS_SPRITE_KEYS[state.bgType]);
      boss.isBoss = true;
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
      changeMusic("");
      tween(0, 90, 0.3, (v) => {
        enemy.angle = v;
        enemy.pos.y += 1;
      });
      wilhelmScream();
      spawnInkSplat(enemy.pos.x, enemy.pos.y - 10);

      // High score
      const prev = parseInt(localStorage.getItem("warzine_high") || "0");
      const score = state.wave;
      if (score > prev) localStorage.setItem("warzine_high", String(score));

      if (state.currentLevel < LEVELS.length - 1) {
        // Not the last level — show leyenda then transition
        wait(3, () => {
          sfxVictory();
          destroy(enemy);
          showLeyenda(
            CHAR_LORE[charType].levels[state.currentLevel],
            "- NIVEL " + (state.currentLevel + 1) + " COMPLETE -",
            () => {
              if (state.gameOver) return;
              state.victory = false;
              startNextLevel();
            }
          );
        });
      } else {
        // Last level — show level leyenda, then final leyenda, then victory
        wait(3, () => {
          sfxVictory();
          destroy(enemy);
          showLeyenda(
            CHAR_LORE[charType].levels[state.currentLevel],
            "- NIVEL " + (state.currentLevel + 1) + " COMPLETE -",
            () => {
              showLeyenda(
                CHAR_LORE[charType].final,
                "- VICTORY -",
                () => {
                  go("victory", charType, p2Type ? true : false, gameFriendlyFire);
                }
              );
            }
          );
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
      if (!state.lastAliveDowned) {
        state.prevMusicSuffix = currentMusicSuffix;
        if (!state.paused) changeMusic("Revive");
        state.lastAliveDowned = true;
      }
    } else {
      if (state.lastAliveDowned) {
        state.lastAliveDowned = false;
        if (state.prevMusicSuffix !== undefined && !state.gameOver) {
          changeMusic(state.prevMusicSuffix === "Revive" ? "" : state.prevMusicSuffix);
        }
      }
      revivePrompt.opacity = 0;
    }
  });

  // ---- GAME OVER CHECK ----
  function checkGameOver() {
    if (state.victory || state.gameOver) return;
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
  state.victory = true;
  showLeyenda(CHAR_LORE[charType].intro, "", () => {
    state.victory = false;
    changeMusic("");
    startWave(WAVE_CONFIGS[state.waveConfigIdx], WAVE_CONFIGS[state.waveConfigIdx].title);
  }, CHAR_LORE[charType].tagline);

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
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

  add([sprite("paperTex"), opacity(0.15), z(100), fixed(), "paperTex"]).baseOpacity = 0.15;
  add([sprite("gameOverBg"), fixed(), z(0)]);

  add([
    text("WAVE " + wave, { size: 20, font: "sans-serif" }),
    pos(W / 2, H * 0.65),
    anchor("center"), color(WHITE), fixed(), z(10),
  ]);

  add([
    text("BEST: WAVE " + high, { size: 16, font: "sans-serif" }),
    pos(W / 2, H * 0.72),
    anchor("center"), color(WHITE), fixed(), z(10), opacity(0.8),
  ]);

  let blink = 0;
  const retry = add([
    text("PRESS SPACE TO RETRY", { size: 20, font: "sans-serif" }),
    pos(W / 2, H * 0.85),
    anchor("center"),
    color(WHITE),
    fixed(),
    z(10),
  ]);

  onUpdate(() => {
    blink += dt();
    retry.opacity = blink % 1 < 0.6 ? 1 : 0.3;
  });

  onKeyPress("space", () => { sfxMenuSelect(); go("select"); });

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// VICTORY SCENE
// ============================================================

scene("victory", (charType, isCoop, friendlyFire) => {
  stopMusic();
  const cleared = JSON.parse(localStorage.getItem("warzine_cleared") || "[]");

  if (isCoop) {
    add([sprite(friendlyFire ? "victoryBgFriendlyFire" : "victoryBgCoop"), pos(0, 0), fixed(), z(0)]);
    onKeyPress(() => go("credits", true));
    return;
  }

  if (!cleared.includes(charType)) {
    cleared.push(charType);
    localStorage.setItem("warzine_cleared", JSON.stringify(cleared));
  }

  const bgMap = {
    punkette: "victoryBgPunkette",
    xero: "victoryBgXero",
    antagonic: "victoryBgAntagonic",
  };
  add([sprite(bgMap[charType] || "victoryBgPunkette"), pos(0, 0), fixed(), z(0)]);

  onKeyPress(() => {
    if (cleared.length >= 3) go("secretEnding");
    else go("credits");
  });
});

scene("secretEnding", () => {
  stopMusic();
  add([sprite("victoryBgAll"), pos(0, 0), fixed(), z(0)]);
  onKeyPress(() => go("credits"));
});


// ============================================================
// CREDITS SCENE
// ============================================================

scene("credits", (isCoop, fromOptions) => {
  changeMusic("title");
  add([rect(W, H), color(55, 55, 62), fixed(), z(0)]);
  add([sprite("paperTex"), opacity(0.15), fixed(), "paperTex"]).baseOpacity = 0.15;

  const lines = [
    "WARZINE",
    "UN BEAT 'EM UP DE TINTA NEGRA",
    "",
    "CONCEPTO ORIGINAL",
    "SUPERDANDI",
    "",
    "DIRECCION",
    "SUPERDANDI",
    "",
    "DISEÑO DE JUEGO",
    "SUPERDANDI",
    "",
    "PROGRAMACION",
    "SUPERDANDI + OPENCODE",
    "",
    "DISEÑO DE PERSONAJES",
    "SUPERDANDI",
    "",
    "DISEÑO DE NIVELES",
    "SUPERDANDI",
    "",
    "SISTEMA DE COMBATE",
    "SUPERDANDI",
    "",
    "INTELIGENCIA ARTIFICIAL",
    "SUPERDANDI + OPENCODE",
    "",
    "DISEÑO DE JEFES",
    "SUPERDANDI",
    "",
    "MUSICA Y FX",
    "SINTETIZADORES VIA WEBAUDIO",
    "",
    "MOTOR DE JUEGO",
    "KAPLAY 3001",
    "",
    "HERRAMIENTAS",
    "VS CODE / GIT + GITHUB / OPENCODE",
    "GOOGLE FONTS (SPECIAL ELITE)",
    "",
    "TESTING Y QA",
    "SUPERDANDI",
    "",
    "GRACIAS ESPECIALES",
    "A TI POR JUGAR",
    "",
  ];

  const SCROLL_SPEED = 35;
  const lineGap = 28;
  const objs = [];
  for (let i = 0; i < lines.length; i++) {
    const isTitle = lines[i] === "WARZINE";
    const sz = isTitle ? 28 : lines[i] === "" ? 8 : 16;
    const obj = add([
      text(lines[i], { size: sz, font: "sans-serif" }),
      pos(W / 2, H + i * lineGap),
      anchor("center"),
      color(WHITE),
      fixed(),
      z(10),
    ]);
    objs.push(obj);
  }

  // ---- END-OF-CREDITS OPTIONS ----
  let ended = false;
  let optionsShown = false;
  let selected = 0;
  let optionObjs = [];

  function backToOptions() {
    sfxMenuSelect();
    go("options", { pid: 1 });
  }

  function showOptions() {
    if (optionsShown) return;
    optionsShown = true;
    ended = true;

    if (fromOptions) {
      const txt = add([
        text("VOLVER A OPCIONES", { size: 22, font: "sans-serif" }),
        pos(W / 2, H / 2 + 70),
        anchor("center"),
        color(WHITE),
        fixed(),
        z(20),
      ]);
      optionObjs.push(txt);
      onKeyPress("j", backToOptions);
      onKeyPress("enter", backToOptions);
      onKeyPress("space", backToOptions);
      onKeyPress("escape", backToOptions);
      return;
    }

    const cleared = JSON.parse(localStorage.getItem("warzine_cleared") || "[]");
    const allCleared = cleared.length >= 3;

    const labels = ["JUGAR OTRA VEZ", "MENÚ PRINCIPAL"];

    optionObjs = labels.map((label, i) => {
      const x = W * (i === 0 ? 0.25 : 0.75);
      const txt = add([
        text(label, { size: 22, font: "sans-serif" }),
        pos(x, H / 2 + 70),
        anchor("center"),
        color(WHITE),
        opacity(i === selected ? 1 : 0.5),
        fixed(),
        z(20),
      ]);
      return txt;
    });

    let cursor = add([
      text("▶", { size: 16, font: "sans-serif" }),
      pos(W * 0.25 - 30, H / 2 + 70),
      anchor("center"),
      color(WHITE),
      fixed(),
      z(20),
    ]);
    optionObjs.push(cursor);

    onKeyPress("a", () => {
      selected = 0;
      cursor.pos.x = W * 0.25 - 30;
      optionObjs.forEach((o, i) => {
        if (i < 2) o.opacity = i === selected ? 1 : 0.5;
      });
    });
    onKeyPress("d", () => {
      selected = 1;
      cursor.pos.x = W * 0.75 - 30;
      optionObjs.forEach((o, i) => {
        if (i < 2) o.opacity = i === selected ? 1 : 0.5;
      });
    });
    onKeyPress("j", () => { confirmOption(); });
    onKeyPress("enter", () => { confirmOption(); });
    onKeyPress("space", () => { confirmOption(); });

    function confirmOption() {
      if (selected === 0) {
        if (isCoop || allCleared) {
          if (allCleared) localStorage.removeItem("warzine_cleared");
          go("select");
        } else {
          const remaining = CHAR_OPTIONS.filter(c => !cleared.includes(c));
          go("select", { locked: cleared, storyMode: true });
        }
      } else {
        go("title");
      }
    }
  }

  let scrollDone = false;
  onUpdate(() => {
    if (ended) return;
    let allOffscreen = true;
    for (const obj of objs) {
      obj.pos.y -= SCROLL_SPEED * dt();
      if (obj.pos.y > -60) allOffscreen = false;
    }
    if (allOffscreen && !scrollDone) {
      scrollDone = true;
      showOptions();
    }
  });

  if (fromOptions) {
    onKeyPress("escape", backToOptions);
  } else {
    onKeyPress("c", () => { sfxMenuSelect(); showOptions(); });
    onKeyPress("escape", () => { sfxMenuSelect(); showOptions(); });
  }
  onKeyPress("p", togglePaperTex);
});


// ============================================================
// VERSUS SCENE
// ============================================================

scene("versus", (args = {}) => {
  stopMusic();
  changeMusic("versusSelect");
  isVersusMode = true;

  const V_GRAVITY = 800;
  const V_JUMP_FORCE = -300;
  const V_GROUND_Y = H - 160;

  let phase = "select";
  let p1Choice = 0, p2Choice = 0;
  let p1Locked = false, p2Locked = false;
  let p1 = null, p2 = null;
  let p1Wins = 0, p2Wins = 0;
  let round = 1;
  let vsTime = 0;
  let selectObjs = [];

  const initiatorPid = args.initiatorPid || null;
  let otherJoined = false;
  let newChallengerActive = false;

  const vsState = { players: [], hitPause: 0, gameOver: false, victory: false, paused: false };
  curState = vsState;
  add([sprite("gauntletSelectBg"), fixed(), z(0)]);

  // Ladder mode state
  let ladderData = null;
  let isLadderFight = false;
  let cpuOpponent = null;
  let ladderHudObjs = [];
  let ladderFightResolved = false;
  let ladderHudUpdater = null;
  let isChallengePick = false;
  let isChallengeFight = false;
  let challengeState = null;
  let challengeCharChoice = 0;
  let challengeObjs = [];

  // Rematch directo — salta seleccion de personajes
  if (vsRematchData) {
    p1Choice = vsRematchData.p1;
    p2Choice = vsRematchData.p2;
    p1Locked = true;
    p2Locked = true;
    vsRematchData = null;
  }

  // Background

  function nextAvail(current, dir, taken) {
    let c = current;
    for (let tries = 0; tries < CHAR_OPTIONS.length; tries++) {
      c = (c + dir + CHAR_OPTIONS.length) % CHAR_OPTIONS.length;
      if (CHAR_OPTIONS[c] !== taken) return c;
    }
    return current;
  }

  function renderSelect() {
    for (const o of selectObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
    selectObjs.length = 0;

    const isLadderSelect = initiatorPid && !otherJoined;

    let titleTxt = "VERSUS - SELECT YOUR FIGHTER";
    if (isLadderSelect) titleTxt = "LADDER — 8 OPPONENTS AWAIT";
    const title = add([text(titleTxt, { size: 16, font: "sans-serif" }),
      pos(W / 2, 30), anchor("center"), color(INK), fixed(), z(10)]);
    selectObjs.push(title);

    let showP1, showP2;
    if (isLadderSelect) {
      showP1 = initiatorPid === 1;
      showP2 = initiatorPid === 2;
    } else if (otherJoined) {
      showP1 = true;
      showP2 = true;
    } else {
      showP1 = !p2Locked || p1Locked;
      showP2 = !p1Locked || p2Locked;
    }

    if (showP1) {
      const p1Taken = p2Locked ? CHAR_OPTIONS[p2Choice] : null;
      const p1LabelTxt = "P1: " + CHAR_NAMES[CHAR_OPTIONS[p1Choice]] + (p1Locked ? " (LOCKED)" : " (A/D)");
      const p1Label = add([text(p1LabelTxt,
        { size: 12, font: "sans-serif" }), pos(W / 4, 70), anchor("center"), color(INK), fixed(), z(10)]);
      selectObjs.push(p1Label);
      const p1Char = createCharacter(W / 4, 230, CHAR_OPTIONS[p1Choice], "preview");
      selectObjs.push(p1Char);
    }

    if (showP2) {
      const p2Taken = p1Locked && CHAR_OPTIONS[p1Choice] === CHAR_OPTIONS[p2Choice];
      const p2LabelTxt = "P2: " + CHAR_NAMES[CHAR_OPTIONS[p2Choice]] + (p2Locked ? (p2Taken ? " (TAKEN)" : " (LOCKED)") : " (< >)");
      const p2Label = add([text(p2LabelTxt, { size: 12, font: "sans-serif" }),
        pos(3 * W / 4, 70), anchor("center"), color(INK), fixed(), z(10)]);
      selectObjs.push(p2Label);
      const p2Char = createCharacter(3 * W / 4, 230, CHAR_OPTIONS[p2Choice], "preview");
      p2Char.scale.x = -1;
      if (p2Locked && p2Taken) p2Char.opacity = 0.3;
      selectObjs.push(p2Char);
    }

    for (let i = 0; i < CHAR_OPTIONS.length; i++) {
      const bx = W / 2 - (CHAR_OPTIONS.length - 1) * 45 + i * 90;
      selectObjs.push(add([rect(70, 20), outline(2), color(WHITE), pos(bx, 320), anchor("center"), fixed(), z(10)]));
      selectObjs.push(add([text(CHAR_NAMES[CHAR_OPTIONS[i]], { size: 7, font: "sans-serif" }),
        pos(bx, 320), anchor("center"), color(INK), fixed(), z(11)]));
    }

    let msg = "";
    if (isLadderSelect) {
      if (initiatorPid === 1) msg = "A/D to choose, J to lock  |  SPACE for single player  |  1 for 2 players";
      else msg = "< > to choose, 1 to lock  |  SPACE for single player  |  J for 2 players";
    } else if (p1Locked && p2Locked) msg = "FIGHT!";
    else if (p1Locked && !showP2) msg = "SPACE for single player";
    else if (p2Locked && !showP1) msg = "SPACE for single player";
    else if (p1Locked) msg = "P1 LOCKED — P2: < > to choose, 1 to lock  |  SPACE for single player";
    else if (p2Locked) msg = "P2 LOCKED — P1: A/D to choose, J to lock  |  SPACE for single player";
    else msg = "P1: A/D choose, J lock  |  P2: < > choose, 1 lock";
    selectObjs.push(add([text(msg, { size: 12, font: "sans-serif" }),
      pos(W / 2, 360), anchor("center"), color(INK), fixed(), z(10)]));
  }

  renderSelect();

  function canP1Act() { return phase === "select" && !p1Locked && (!initiatorPid || initiatorPid === 1 || otherJoined); }
  function canP2Act() { return phase === "select" && !p2Locked && (!initiatorPid || initiatorPid === 2 || otherJoined); }

  onKeyPress("a", () => {
    if (!canP1Act()) return;
    const taken = p2Locked ? CHAR_OPTIONS[p2Choice] : null;
    p1Choice = nextAvail(p1Choice, -1, taken);
    sfxMenuSelect(); renderSelect();
  });
  onKeyPress("d", () => {
    if (!canP1Act()) return;
    const taken = p2Locked ? CHAR_OPTIONS[p2Choice] : null;
    p1Choice = nextAvail(p1Choice, 1, taken);
    sfxMenuSelect(); renderSelect();
  });
  function showNewChallenger(callback) {
    const ncObjs = [];
    ncObjs.push(add([rect(W, H), color(PAPER), opacity(0.7), fixed(), z(60)]));
    ncObjs.push(add([
      text("HERE COMES A NEW CHALLENGER!", { size: 24, font: "sans-serif" }),
      pos(W / 2, H / 2), anchor("center"), color(INK), fixed(), z(61),
    ]));
    wait(2, () => {
      for (const o of ncObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
      if (callback) callback();
    });
  }

  onKeyPress("j", () => {
    if (phase !== "select" || p1Locked) {
      if (phase === "fight" && isLadderFight && ladderData && ladderData.pid === 2 && !isChallengePick && !isChallengeFight) {
        startChallenge(1);
      }
      return;
    }
    if (initiatorPid === 2 && !otherJoined) {
      otherJoined = true;
      sfxMenuSelect();
      showNewChallenger(() => renderSelect());
      return;
    }
    p1Locked = true;
    if (!p2Locked && p2Choice === p1Choice) {
      p2Choice = nextAvail(p2Choice, 1, CHAR_OPTIONS[p1Choice]);
    }
    if (p2Locked) { sfxMenuSelect(); startCountdown(); }
    else { sfxMenuSelect(); renderSelect(); }
  });

  onKeyPress("space", () => {
    if (phase !== "select") return;
    if (initiatorPid && !otherJoined) {
      sfxMenuSelect();
      startLadder(initiatorPid, initiatorPid === 1 ? CHAR_OPTIONS[p1Choice] : CHAR_OPTIONS[p2Choice]);
      return;
    }
    if (p1Locked && !p2Locked) { sfxMenuSelect(); startLadder(1, CHAR_OPTIONS[p1Choice]); }
    else if (p2Locked && !p1Locked) { sfxMenuSelect(); startLadder(2, CHAR_OPTIONS[p2Choice]); }
  });

  if (!isTouchDevice) {
    onKeyPress("left", () => {
      if (!canP2Act()) return;
      const taken = p1Locked ? CHAR_OPTIONS[p1Choice] : null;
      p2Choice = nextAvail(p2Choice, -1, taken);
      sfxMenuSelect(); renderSelect();
    });
    onKeyPress("right", () => {
      if (!canP2Act()) return;
      const taken = p1Locked ? CHAR_OPTIONS[p1Choice] : null;
      p2Choice = nextAvail(p2Choice, 1, taken);
      sfxMenuSelect(); renderSelect();
    });
    onKeyPress("1", () => {
      if (phase !== "select" || p2Locked) {
        if (phase === "fight" && isLadderFight && ladderData && ladderData.pid === 1 && !isChallengePick && !isChallengeFight) {
          startChallenge(2);
        }
        return;
      }
      if (initiatorPid === 1 && !otherJoined) {
        otherJoined = true;
        sfxMenuSelect();
        showNewChallenger(() => renderSelect());
        return;
      }
      p2Locked = true;
      if (!p1Locked && p1Choice === p2Choice) {
        p1Choice = nextAvail(p1Choice, 1, CHAR_OPTIONS[p2Choice]);
      }
      if (p1Locked) { sfxMenuSelect(); startCountdown(); }
      else { sfxMenuSelect(); renderSelect(); }
    });
  }

  function createVersusPlayer(type, x, y, controls, id) {
    const char = createCharacter(x, y, type, "player");
    vsState.players.push(char);
    char.playerId = id;
    char.controls = controls;
    char.attackCooldown = 0;
    char.walkTime = 0;
    char.isWalking = false;
    char.dodgeTimer = 0;
    char.dodgeCooldown = 0;
    char.superCooldown = 0;
    char.isAirborne = false;
    char.jumpVy = 0;
    char.jumpStartY = y;
    char.comboCount = 0;
    char.comboTimer = 0;
    char.hitTimer = 0;
    char.invincible = 0;
    char.dead = false;
    char.downed = false;

    char.onUpdate(() => {
      if (char.hp <= 0 || char.dead || vsState.hitPause > 0) return;
      char.pos.x = clamp(char.pos.x, 30, W - 30);
      if (!char.isAirborne) char.pos.y = V_GROUND_Y;
    });

    char.onUpdate(() => {
      if (char.hp <= 0 || char.dead || vsState.hitPause > 0) return;
      if (char.isAirborne) {
        char.jumpVy += V_GRAVITY * dt();
        char.pos.y += char.jumpVy * dt();
        if (char.pos.y >= char.jumpStartY) {
          char.pos.y = char.jumpStartY;
          char.jumpVy = 0;
          char.isAirborne = false;
        }
      }
      if (char.superCooldown > 0) char.superCooldown -= dt();
      if (char.attackCooldown > 0) char.attackCooldown -= dt();
      if (char.dodgeTimer > 0) char.dodgeTimer -= dt();
      if (char.dodgeCooldown > 0) char.dodgeCooldown -= dt();
    });

    char.onUpdate(() => {
      if (char.hp <= 0 || char.dead || vsState.hitPause > 0) return;
      if (char.dodgeTimer > 0) return;
      const c = controls;
      let dx = 0, dy = 0;
      if (isKeyDown(c.left) || touchKeys[c.left]) dx -= 1;
      if (isKeyDown(c.right) || touchKeys[c.right]) dx += 1;
      if (!char.isAirborne) {
        if (isKeyDown(c.up) || touchKeys[c.up]) dy -= 1;
        if (isKeyDown(c.down) || touchKeys[c.down]) dy += 1;
      }
      if (char.hitTimer > 0) {
        char.hitTimer -= dt();
        char.invincible -= dt();
        return;
      }
      char.invincible = Math.max(0, char.invincible - dt());
      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        char.move((dx/len)*char.speed, (dy/len)*char.speed);
        char.facing = dx < 0 ? -1 : dx > 0 ? 1 : char.facing;
        char.scale.x = char.facing > 0 ? 1 : -1;
        char.isWalking = true;
        char.walkTime += dt();
        setWalkPose(char, char.walkTime * 10);
      } else {
        char.isWalking = false;
        setIdlePose(char, vsTime);
      }
    });

    const punchFn = () => {
      if (char.hp <= 0 || char.dead || char.downed || vsState.hitPause > 0) return;
      if (char.hitTimer > 0 || char.attackCooldown > 0 || char.dodgeTimer > 0) return;

      if ((isKeyDown(controls.jump) || touchKeys[controls.jump]) && char.superCooldown <= 0) {
        char.superCooldown = 2;
        char.attackCooldown = 0.5;
        screenShake(10, 0.25);
        spawnHitbox(char, 0, -10, 60, 50, 25, 300, 0.2);
        spawnHitbox(char, -25, -5, 25, 35, 15, 180, 0.15);
        spawnHitbox(char, 25, -5, 25, 35, 15, 180, 0.15);
        setKickPose(char);
        tween(0, 1, 0.12, () => {}, () => { if (!char.dead) resetPose(char); });
        spawnHitEffect(char.pos.x, char.pos.y - 10);
        sfxSuper();
        return;
      }

      char.attackCooldown = 0.3;
      setPunchPose(char);
      spawnHitbox(char, 24, -5, 22, 18, 12, 100, 0.08);
      spawnAttackArc(char.pos.x + 26 * char.facing, char.pos.y - 5, char.facing);
      tween(0, 1, 0.06, () => {}, () => { if (!char.dead) resetPose(char); });
    };
    onKeyPress(controls.punch, punchFn);

    onKeyPress(controls.jump, () => {
      if (char.hp <= 0 || char.dead || char.downed || vsState.hitPause > 0) return;
      if (char.hitTimer > 0 || char.isAirborne) return;
      char.isAirborne = true;
      char.jumpVy = V_JUMP_FORCE;
      char.jumpStartY = char.pos.y;
      sfxJump();
    });

    onKeyPress(controls.dodge, () => {
      if (char.hp <= 0 || char.dead || char.downed || vsState.hitPause > 0) return;
      if (char.hitTimer > 0 || char.isAirborne || char.dodgeTimer > 0 || char.dodgeCooldown > 0) return;
      char.dodgeTimer = 0.3;
      char.dodgeCooldown = 1.0;
      char.invincible = 0.35;
      char.move(char.facing * 200, 0);
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

    return char;
  }

  function startCountdown(skipCreate) {
    changeMusic("versusFight");
    add([sprite("versusBg"), fixed(), z(0)]);
    phase = "countdown";
    for (const o of selectObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
    selectObjs.length = 0;

    if (!skipCreate) {
    p1 = createVersusPlayer(CHAR_OPTIONS[p1Choice], 150, V_GROUND_Y, {
      left: "a", right: "d", up: "w", down: "s",
      punch: "j", jump: "k", dodge: "l",
    }, 1);

    p2 = createVersusPlayer(CHAR_OPTIONS[p2Choice], W - 150, V_GROUND_Y, {
      left: "left", right: "right", up: "up", down: "down",
      punch: "1", jump: "2", dodge: "3",
    }, 2);
    p2.scale.x = -1;
    }

    // HUD
    const p1BarBg = add([rect(200, 16), outline(2), color(INK), pos(20, 20), fixed(), z(19)]);
    const p1Bar = add([rect(200, 16), color(WHITE), pos(20, 20), fixed(), z(20)]);
    add([text("P1", { size: 10, font: "sans-serif" }), pos(20, 40), fixed(), color(WHITE), z(20)]);

    const p2BarBg = add([rect(200, 16), outline(2), color(INK), pos(W - 220, 20), fixed(), z(19)]);
    const p2Bar = add([rect(200, 16), color(WHITE), pos(W - 220, 20), fixed(), z(20)]);
    add([text("P2", { size: 10, font: "sans-serif" }), pos(W - 220, 40), fixed(), color(WHITE), z(20)]);

    const scoreDisp = add([text("", { size: 12, font: "sans-serif" }),
      pos(W / 2, 20), anchor("center"), fixed(), color(WHITE), z(20)]);

    // Time tracker
    // HUD update
    onUpdate(() => {
      if (p1 && p1.exists()) p1Bar.width = 200 * Math.max(0, p1.hp / p1.maxHp);
      if (p2 && p2.exists()) p2Bar.width = 200 * Math.max(0, p2.hp / p2.maxHp);
      scoreDisp.text = "ROUND " + round + "   P1 \\[" + p1Wins + "\\]  -  \\[" + p2Wins + "\\] P2";
      vsTime += dt();
      if (vsState.hitPause > 0) vsState.hitPause -= dt();
    });

    // HP check
    onUpdate(() => {
      if (phase !== "fight") return;
      if (isLadderFight && !isChallengeFight) return;
      if (p1 && p1.hp <= 0 && !p1.dead) { p1.dead = true; sfxKill(); endRound(2); }
      if (p2 && p2.hp <= 0 && !p2.dead) { p2.dead = true; sfxKill(); endRound(1); }
    });

    // Countdown overlay
    const overlay = add([fixed(), z(100)]);
    const countText = overlay.add([
      text("3", { size: 80, font: "sans-serif" }),
      pos(W / 2, H / 2), anchor("center"), color(WHITE), z(101),
    ]);
    let count = 3;
    const ci = setInterval(() => {
      count--;
      if (count > 0) countText.text = String(count);
      else if (count === 0) countText.text = "FIGHT!";
      else { clearInterval(ci); destroy(overlay); if (p1) p1.hp = p1.maxHp; if (p2) p2.hp = p2.maxHp; if (cpuOpponent) cpuOpponent.hp = cpuOpponent.maxHp; phase = "fight"; }
    }, 800);
  }

  function startRound() {
    if (p1 && p1.exists()) {
      p1.hp = p1.maxHp; p1.pos = vec2(150, V_GROUND_Y);
      p1.dead = false; p1.downed = false; p1.invincible = 2;
      p1.isAirborne = false; p1.jumpVy = 0;
    }
    if (p2 && p2.exists()) {
      p2.hp = p2.maxHp; p2.pos = vec2(W - 150, V_GROUND_Y);
      p2.dead = false; p2.downed = false; p2.invincible = 2;
      p2.scale.x = -1; p2.isAirborne = false; p2.jumpVy = 0;
    }

    phase = "countdown";
    const overlay = add([fixed(), z(100)]);
    const countText = overlay.add([
      text("3", { size: 80, font: "sans-serif" }),
      pos(W / 2, H / 2), anchor("center"), color(WHITE), z(101),
    ]);
    let count = 3;
    const ci = setInterval(() => {
      count--;
      if (count > 0) countText.text = String(count);
      else if (count === 0) countText.text = "FIGHT!";
      else { clearInterval(ci); destroy(overlay); if (p1) p1.hp = p1.maxHp; if (p2) p2.hp = p2.maxHp; phase = "fight"; }
    }, 800);
  }

  function endRound(winner) {
    phase = "roundEnd";
    if (winner === 1) p1Wins++;
    else p2Wins++;

    const overlay = add([fixed(), z(100)]);
    overlay.add([rect(W, H), color(PAPER), opacity(0.5)]);
    const winText = add([
      text("P" + winner + " WINS THE ROUND!", { size: 44, font: "sans-serif" }),
      pos(W / 2, H / 2 - 20), anchor("center"), color(WHITE), fixed(), z(101),
    ]);
    const scoreText = add([
      text("P1 " + p1Wins + " - " + p2Wins + " P2", { size: 24, font: "sans-serif" }),
      pos(W / 2, H / 2 + 20), anchor("center"), color(WHITE), fixed(), z(101),
    ]);

    if (p1Wins >= 2 || p2Wins >= 2) {
      wait(2, () => {
        destroy(overlay); destroy(winText); destroy(scoreText);
        endMatch(p1Wins >= 2 ? 1 : 2);
      });
    } else {
      round++;
      wait(2, () => {
        destroy(overlay); destroy(winText); destroy(scoreText);
        startRound();
      });
    }
  }

  function endMatch(winner) {
    phase = "matchEnd";
    for (const o of vsState.players) {
      if (o.playerId === winner) {
        o.paused = true;
        o.invincible = 999;
      } else {
        o.dead = true;
        o.downed = true;
        o.invincible = 999;
        tween(0, 80, 0.3, (v) => {
          if (!o.exists) return;
          o.angle = v;
          o.pos.y += 0.3;
        });
        wait(1.2, () => { try { if (o && o.exists) destroy(o); } catch(e) {} });
      }
    }
    vsState.players = vsState.players.filter(o => o.playerId === winner);

    // Challenge match ladder resolution
    if (isChallengeFight) {
      add([rect(W, H), color(PAPER), fixed(), z(50)]);
      add([sprite("paperTex"), opacity(0.15), fixed(), z(51), "paperTex"]).baseOpacity = 0.15;

      const defenderPid = ladderData.pid;
      const challengerPid = defenderPid === 1 ? 2 : 1;
      const defenderWon = winner === defenderPid;

      if (defenderWon) {
        add([
          text("CHAMPION RETAINS!", { size: 24, font: "sans-serif" }),
          pos(W / 2, H / 3), anchor("center"), color(WHITE), fixed(), z(52),
        ]);
      } else {
        add([
          text("NEW CHALLENGER WINS!", { size: 24, font: "sans-serif" }),
          pos(W / 2, H / 3), anchor("center"), color(WHITE), fixed(), z(52),
        ]);
        ladderData.pid = challengerPid;
        ladderData.charType = CHAR_OPTIONS[challengeCharChoice];
      }

      add([
        text("P" + winner + " WINS " + p1Wins + "-" + p2Wins, { size: 14, font: "sans-serif" }),
        pos(W / 2, H / 2 + 10), anchor("center"), color(WHITE), fixed(), z(52),
      ]);

      isChallengeFight = false;
      wait(2.5, () => {
        if (ladderData) {
          ladderData.currentIdx++;
          spawnLadderFight();
        }
      });
      return;
    }

    add([rect(W, H), color(PAPER), fixed(), z(50)]);
    add([sprite("paperTex"), opacity(0.15), fixed(), z(51), "paperTex"]).baseOpacity = 0.15;
    add([
      text("P" + winner + " WINS!", { size: 40, font: "sans-serif" }),
      pos(W / 2, H / 3), anchor("center"), color(WHITE), fixed(), z(52),
    ]);
    add([
      text("FINAL: P1 " + p1Wins + " - " + p2Wins + " P2", { size: 20, font: "sans-serif" }),
      pos(W / 2, H / 2), anchor("center"), color(WHITE), fixed(), z(52),
    ]);

    let blink = 0;
    const rematch = add([
      text("SPACE: SELECT  |  R: REMATCH  |  ESC: MENU", { size: 12, font: "sans-serif" }),
      pos(W / 2, H * 0.75), anchor("center"), color(INK), fixed(), z(52),
    ]);
    onUpdate(() => { blink += dt(); rematch.opacity = blink % 1 < 0.6 ? 1 : 0.3; });

    onKeyPress("space", () => {
      vsRematchData = null; sfxMenuSelect(); go("versus");
    });
    onKeyPress("r", () => {
      vsRematchData = { p1: p1Choice, p2: p2Choice }; sfxMenuSelect(); go("versus");
    });
    onKeyPress("escape", () => {
      isVersusMode = false; sfxMenuSelect(); go("title");
    });
  }

  // ============================================================
  // LADDER MODE
  // ============================================================

  const LADDER_BOSSES = [
    { name: "EL DIRECTOR", spriteKey: "bossDirector", bgForAI: "street" },
    { name: "LA QUIMICA", spriteKey: "bossQuimica", bgForAI: "rooftop" },
    { name: "EL COLOSO", spriteKey: "bossColoso", bgForAI: "factory" },
  ];

  function buildLadder(pid, charType) {
    const unselected = CHAR_OPTIONS.filter(c => c !== charType);
    return {
      pid,
      opponents: [
        { type: "grunt", name: "GRUNT", isBoss: false },
        { type: "punk", name: "PUNK", isBoss: false },
        { type: "tough", name: "EL BRUTO", isBoss: false },
        { type: unselected[0], name: CHAR_NAMES[unselected[0]], isBoss: false },
        { type: unselected[1], name: CHAR_NAMES[unselected[1]], isBoss: false },
        { type: "boss", name: LADDER_BOSSES[0].name, isBoss: true, spriteKey: LADDER_BOSSES[0].spriteKey, bgForAI: LADDER_BOSSES[0].bgForAI },
        { type: "boss", name: LADDER_BOSSES[1].name, isBoss: true, spriteKey: LADDER_BOSSES[1].spriteKey, bgForAI: LADDER_BOSSES[1].bgForAI },
        { type: "boss", name: LADDER_BOSSES[2].name, isBoss: true, spriteKey: LADDER_BOSSES[2].spriteKey, bgForAI: LADDER_BOSSES[2].bgForAI },
      ],
      currentIdx: 0,
      charType,
    };
  }

  function spawnCPUOpponent(opp, x, y) {
    let char;
    if (opp.isBoss) {
      char = createCharacter(x, y, opp.type, "enemy", opp.spriteKey);
      char.hp = 250;
      char.maxHp = 250;
      char.speed = 130;
      char.damage = 20;
      char.attackRange = 55;
    } else if (opp.type === "grunt" || opp.type === "punk" || opp.type === "tough") {
      char = createCharacter(x, y, opp.type, "enemy");
      const hpMap = { grunt: 60, punk: 90, tough: 140 };
      const dmgMap = { grunt: 10, punk: 14, tough: 20 };
      const spdMap = { grunt: 140, punk: 170, tough: 120 };
      char.hp = hpMap[opp.type];
      char.maxHp = char.hp;
      char.speed = spdMap[opp.type];
      char.damage = dmgMap[opp.type];
      char.attackRange = opp.type === "tough" ? 45 : 35;
    } else {
      char = createCharacter(x, y, opp.type, "enemy");
      char.hp = 100;
      char.maxHp = 100;
      char.speed = 200;
      char.damage = 14;
      char.attackRange = 35;
    }

    char.attackCooldown = rand(0.5, 1.5);
    char.aiState = "chase";
    char.facing = ladderData.pid === 1 ? -1 : 1;
    char.walkTime = rand(0, 100);
    char.isAirborne = false;
    char.jumpVy = 0;
    char.jumpStartY = y;
    char.jumpTimer = 0;
    char.dead = false;
    char.downed = false;
    char.invincible = 0;
    char.hitTimer = 0;

    char.onUpdate(() => {
      if (char.dead || vsState.hitPause > 0) return;
      char.pos.x = clamp(char.pos.x, 30, W - 30);
      if (!char.isAirborne) char.pos.y = V_GROUND_Y;
    });

    char.onUpdate(() => {
      if (char.dead || vsState.hitPause > 0) return;
      if (char.isAirborne) {
        char.jumpVy += V_GRAVITY * dt();
        char.pos.y += char.jumpVy * dt();
        if (char.pos.y >= char.jumpStartY) {
          char.pos.y = char.jumpStartY;
          char.jumpVy = 0;
          char.isAirborne = false;
        }
      }
    });

    if (opp.isBoss) {
      addBossAI(char);
    } else {
      addEnemyAI(char);
    }

    return char;
  }

  function addEnemyAI(char) {
    char.onUpdate(() => {
      if (char.dead || vsState.hitPause > 0) return;
      if (char.isAirborne) return;
      if (char.hitTimer > 0) {
        char.hitTimer -= dt();
        char.invincible -= dt();
        return;
      }
      char.invincible = Math.max(0, char.invincible - dt());
      char.attackCooldown -= dt();
      char.jumpTimer -= dt();

      let target = null;
      let minDist = Infinity;
      for (const p of vsState.players) {
        if (p.dead || p.downed || p === char) continue;
        const d = p.pos.dist(char.pos);
        if (d < minDist) { minDist = d; target = p; }
      }
      if (!target) return;

      const dx = target.pos.x - char.pos.x;
      const dy = target.pos.y - char.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 100 && char.jumpTimer <= 0 && Math.random() < 0.02) {
        char.isAirborne = true;
        char.jumpStartY = char.pos.y;
        char.jumpVy = V_JUMP_FORCE * rand(0.8, 1.0);
        char.pos.x += dx > 0 ? 20 : -20;
        char.jumpTimer = rand(2, 4);
      }

      if (dist < char.attackRange && char.attackCooldown <= 0 && !char.isAirborne) {
        char.aiState = "attack";
        char.attackCooldown = rand(0.8, 1.5);
        char.facing = dx > 0 ? 1 : -1;
        char.scale.x = char.facing;
        setPunchPose(char);
        spawnHitbox(char, 16, -4, 14, 12, char.damage, 80, 0.08);
        spawnAttackArc(char.pos.x + 20 * char.facing, char.pos.y - 5, char.facing);
        tween(0, 1, 0.05, () => {}, () => { if (!char.dead) resetPose(char); });
      } else {
        char.aiState = "chase";
        char.facing = dx > 0 ? 1 : -1;
        char.scale.x = char.facing;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          char.move((dx / len) * char.speed, (dy / len) * char.speed * 0.6);
          char.walkTime += dt();
          setWalkPose(char, char.walkTime * 10);
        }
      }
    });
  }

  function addBossAI(char) {
    char.phase = 1;
    char.attackPattern = 0;
    char.onUpdate(() => {
      if (char.dead || vsState.hitPause > 0) return;
      if (char.hitTimer > 0) {
        char.hitTimer -= dt();
        char.invincible -= dt();
        return;
      }
      char.invincible = Math.max(0, char.invincible - dt());
      char.attackCooldown -= dt();

      if (char.hp < char.maxHp * 0.5 && char.phase === 1) {
        char.phase = 2;
        char.speed *= 1.3;
        char.attackCooldown = 0.5;
        char.invincible = 1.5;
        screenShake(10, 0.5);
        spawnHitEffect(char.pos.x, char.pos.y - 20);
        spawnInkSplat(char.pos.x, char.pos.y);
        spawnHitEffect(char.pos.x - 30, char.pos.y);
        spawnHitEffect(char.pos.x + 30, char.pos.y);
        char.attackCooldown = 1.5;
      }

      let target = null;
      let minDist = Infinity;
      for (const p of vsState.players) {
        if (p.dead || p.downed || p === char) continue;
        const d = p.pos.dist(char.pos);
        if (d < minDist) { minDist = d; target = p; }
      }
      if (!target) return;

      const dx = target.pos.x - char.pos.x;
      const dy = target.pos.y - char.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      char.facing = dx > 0 ? 1 : -1;
      char.scale.x = char.facing;

      if (dist < char.attackRange && char.attackCooldown <= 0) {
        const maxPattern = char.phase === 2 ? 4 : 2;
        char.attackCooldown = char.phase === 2 ? rand(0.6, 1.2) : rand(1.2, 2.0);
        char.attackPattern = (char.attackPattern + 1) % (maxPattern + 1);

        if (char.attackPattern === 0) {
          setPunchPose(char);
          screenShake(2, 0.05);
          spawnHitbox(char, 28, -6, 24, 18, char.damage * 1.2, 200, 0.12);
          spawnAttackArc(char.pos.x + 30 * char.facing, char.pos.y - 5, char.facing);
        } else if (char.attackPattern === 1) {
          setKickPose(char);
          screenShake(5, 0.1);
          spawnHitbox(char, 0, 16, 40, 20, char.damage * 0.8, 120, 0.15);
          spawnHitbox(char, -20, 16, 30, 20, char.damage * 0.6, 100, 0.12);
          spawnHitEffect(char.pos.x, char.pos.y + 10);
          spawnHitEffect(char.pos.x - 15, char.pos.y + 5);
          spawnHitEffect(char.pos.x + 15, char.pos.y + 5);
        } else if (char.attackPattern === 2) {
          char.move(char.facing * 150, 0);
          spawnHitbox(char, 10, -2, 30, 20, char.damage, 180, 0.2);
          screenShake(3, 0.08);
          spawnAttackArc(char.pos.x + 20 * char.facing, char.pos.y - 5, char.facing);
        } else if (char.attackPattern === 3 && char.phase === 2) {
          screenShake(8, 0.2);
          spawnHitbox(char, -30, 24, 60, 30, char.damage * 0.7, 80, 0.2);
          spawnHitEffect(char.pos.x - 20, char.pos.y + 15);
          spawnHitEffect(char.pos.x, char.pos.y + 20);
          spawnHitEffect(char.pos.x + 20, char.pos.y + 15);
        } else if (char.attackPattern === 4 && char.phase === 2) {
          setPunchPose(char);
          spawnHitbox(char, 24, -4, 20, 16, char.damage * 0.6, 120, 0.06);
          wait(0.12, () => {
            if (!char.dead) {
              setPunchPose(char);
              spawnHitbox(char, 24, -4, 20, 16, char.damage * 0.6, 120, 0.06);
            }
          });
        }

        tween(0, 1, 0.08, () => {}, () => {
          if (!char.dead) resetPose(char);
        });
      } else if (dist > char.attackRange * 0.6) {
        char.aiState = "chase";
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          const spd = char.phase === 2 ? char.speed * 1.3 : char.speed;
          char.move((dx / len) * spd, (dy / len) * spd * 0.5);
          char.walkTime += dt();
          setWalkPose(char, char.walkTime * 10);
        }
      }
    });
  }

  function createLadderHUD(oppName, fightNum, totalFights, humanPid) {
    const objs = [];
    const leftX = 20;
    const rightX = W - 220;
    const humanSide = humanPid === 1 ? leftX : rightX;
    const cpuSide = humanPid === 1 ? rightX : leftX;
    const humanLabel = humanPid === 1 ? "P1" : "P2";

    const p1BarBg = add([rect(200, 16), outline(2), color(INK), pos(humanSide, 20), fixed(), z(19)]);
    const p1Bar = add([rect(200, 16), color(WHITE), pos(humanSide, 20), fixed(), z(20)]);
    objs.push(p1BarBg, p1Bar);
    const p1Label = add([text(humanLabel, { size: 10, font: "sans-serif" }), pos(humanSide, 40), fixed(), color(WHITE), z(20)]);
    objs.push(p1Label);

    const oppBarBg = add([rect(200, 16), outline(2), color(INK), pos(cpuSide, 20), fixed(), z(19)]);
    const oppBar = add([rect(200, 16), color(WHITE), pos(cpuSide, 20), fixed(), z(20)]);
    objs.push(oppBarBg, oppBar);
    const oppLabel = add([text(oppName, { size: 10, font: "sans-serif" }), pos(cpuSide, 40), fixed(), color(WHITE), z(20)]);
    objs.push(oppLabel);

    const fightLabel = add([text("FIGHT " + fightNum + "/" + totalFights, { size: 12, font: "sans-serif" }),
      pos(W / 2, 20), anchor("center"), fixed(), color(WHITE), z(20)]);
    objs.push(fightLabel);

    return { objs, p1Bar, oppBar };
  }

  // Scene-level ladder fight monitoring
  onUpdate(() => {
    if (vsState.hitPause > 0) vsState.hitPause -= dt();
    if (!isLadderFight || isChallengeFight || isChallengePick || phase === "ladderEnd" || phase === "matchEnd" || phase === "champion") return;
    if (phase === "fight" && !ladderFightResolved) {
      if (cpuOpponent && cpuOpponent.exists && cpuOpponent.hp <= 0 && !cpuOpponent.dead) {
        ladderFightResolved = true;
        cpuOpponent.dead = true;
        sfxKill();
        endLadderFight(true);
      }
      if (p1 && p1.exists && p1.hp <= 0 && !p1.dead) {
        ladderFightResolved = true;
        p1.dead = true;
        sfxKill();
        endLadderFight(false);
      }
    }
  });

  function startLadder(pid, charType) {
    ladderData = buildLadder(pid, charType);
    isLadderFight = true;
    phase = "ladderIntro";
    for (const o of selectObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
    selectObjs.length = 0;
    add([sprite("versusBg"), fixed(), z(0)]);

    const intro = add([fixed(), z(100)]);
    intro.add([
      text("LADDER MODE", { size: 44, font: "sans-serif" }),
      pos(W / 2, H / 2 - 35), anchor("center"), color(WHITE), z(101),
    ]);
    intro.add([
      text("8 OPPONENTS AWAIT", { size: 20, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10), anchor("center"), color(WHITE), z(101),
    ]);
    const c = pid === 1 ? "J" : "1";
    intro.add([
      text("PRESS " + c + " TO START", { size: 16, font: "sans-serif" }),
      pos(W / 2, H / 2 + 40), anchor("center"), color(WHITE), z(101), opacity(0.7),
    ]);

    const key = pid === 1 ? "j" : "1";
    let introDone = false;
    onKeyPress(key, () => {
      if (introDone || phase !== "ladderIntro") return;
      introDone = true;
      sfxMenuSelect();
      destroy(intro);
      spawnLadderFight();
    });
  }

  function spawnLadderFight() {
    if (!ladderData || ladderData.currentIdx >= ladderData.opponents.length) {
      showLadderChampion();
      return;
    }

    if (p1 && p1.exists) { vsState.players = vsState.players.filter(p => p !== p1); destroy(p1); p1 = null; }
    if (cpuOpponent && cpuOpponent.exists) { destroy(cpuOpponent); cpuOpponent = null; }

    ladderFightResolved = false;
    const opp = ladderData.opponents[ladderData.currentIdx];
    const fightNum = ladderData.currentIdx + 1;
    const totalFights = ladderData.opponents.length;

    const h = createLadderHUD(opp.name, fightNum, totalFights, ladderData.pid);
    ladderHudObjs = h.objs;

    if (ladderHudUpdater) ladderHudUpdater.cancel();
    ladderHudUpdater = onUpdate(() => {
      if (p1 && p1.exists) h.p1Bar.width = 200 * Math.max(0, p1.hp / p1.maxHp);
      if (cpuOpponent && cpuOpponent.exists) h.oppBar.width = 200 * Math.max(0, cpuOpponent.hp / cpuOpponent.maxHp);
    });

    const humanPid = ladderData.pid;
    const humanX = humanPid === 1 ? 150 : W - 150;
    const humanControls = humanPid === 1
      ? { left: "a", right: "d", up: "w", down: "s", punch: "j", jump: "k", dodge: "l" }
      : { left: "left", right: "right", up: "up", down: "down", punch: "1", jump: "2", dodge: "3" };

    const human = createVersusPlayer(ladderData.charType, humanX, V_GROUND_Y, humanControls, 1);
    if (humanPid === 2) human.scale.x = -1;
    p1 = human;

    const cpuX = humanPid === 1 ? W - 150 : 150;
    cpuOpponent = spawnCPUOpponent(opp, cpuX, V_GROUND_Y);

    changeMusic("versusFight");
    startLadderCountdown(h);
  }

  function startLadderCountdown(hud) {
    phase = "countdown";

    const overlay = add([fixed(), z(100)]);
    const countText = overlay.add([
      text("3", { size: 80, font: "sans-serif" }),
      pos(W / 2, H / 2), anchor("center"), color(WHITE), z(101),
    ]);
    let count = 3;
    const ci = setInterval(() => {
      count--;
      if (count > 0) countText.text = String(count);
      else if (count === 0) countText.text = "FIGHT!";
      else { clearInterval(ci); destroy(overlay); if (p1) p1.hp = p1.maxHp; if (cpuOpponent) cpuOpponent.hp = cpuOpponent.maxHp; phase = "fight"; }
    }, 800);
  }

  function endLadderFight(humanWon) {
    phase = "ladderEnd";

    if (ladderHudUpdater) { ladderHudUpdater.cancel(); ladderHudUpdater = null; }
    for (const o of ladderHudObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
    ladderHudObjs.length = 0;

    if (humanWon) {
      const oldCPU = cpuOpponent;
      if (oldCPU && oldCPU.exists) {
        oldCPU.dead = true;
        oldCPU.downed = true;
        oldCPU.invincible = 999;
        tween(0, 80, 0.3, (v) => { if (!oldCPU.exists) return; oldCPU.angle = v; oldCPU.pos.y += 0.3; });
        wait(1.2, () => { try { if (oldCPU && oldCPU.exists) destroy(oldCPU); } catch(e) {} });
      }
      if (p1 && p1.exists) { p1.paused = true; p1.invincible = 999; }
      cpuOpponent = null;
    } else {
      if (p1 && p1.exists) {
        p1.dead = true;
        p1.downed = true;
        p1.invincible = 999;
        vsState.players = vsState.players.filter(p => p !== p1);
        tween(0, 80, 0.3, (v) => { if (!p1.exists) return; p1.angle = v; p1.pos.y += 0.3; });
        wait(1.2, () => { try { if (p1 && p1.exists) { destroy(p1); p1 = null; } } catch(e) {} });
      }
      if (cpuOpponent && cpuOpponent.exists) { cpuOpponent.dead = true; cpuOpponent.paused = true; cpuOpponent.invincible = 999; }
    }

    if (humanWon) {
      const winText = add([
        text("YOU WIN!", { size: 44, font: "sans-serif" }),
        pos(W / 2, H / 2), anchor("center"), color(WHITE), fixed(), z(100),
      ]);
      wait(1.5, () => {
        destroy(winText);
        ladderData.currentIdx++;
        spawnLadderFight();
      });
    } else {
      sfxGameOver();
      changeMusic("gameOver");

      // Phase 1: Continue countdown (10s)
      const contObjs = [];
      let contTimer = 10;
      contObjs.push(add([
        text("CONTINUE?", { size: 36, font: "sans-serif" }),
        pos(W / 2, H / 2 - 30), anchor("center"), color(WHITE), fixed(), z(53),
      ]));
      const contText = add([
        text(String(contTimer), { size: 48, font: "sans-serif" }),
        pos(W / 2, H / 2 + 20), anchor("center"), color(WHITE), fixed(), z(53),
      ]);
      contObjs.push(contText);
      const contHint = add([
        text("PRESIONA " + (ladderData.pid === 1 ? "J" : "1") + " PARA CONTINUAR", { size: 14, font: "sans-serif" }),
        pos(W / 2, H / 2 + 60), anchor("center"), color(WHITE), opacity(0.6), fixed(), z(53),
      ]);
      contObjs.push(contHint);

      let phaseDone = false;
      const actionKey = ladderData.pid === 1 ? "j" : "1";
      const contKey = onKeyPress(actionKey, () => {
        if (phaseDone) return;
        phaseDone = true;
        clearInterval(contInterval);
        contKey.cancel();
        for (const o of contObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
        sfxMenuSelect();
        spawnLadderFight();
      });

      const contInterval = setInterval(() => {
        contTimer--;
        contText.text = String(contTimer);
        if (contTimer <= 0) {
          clearInterval(contInterval);
          if (phaseDone) return;
          phaseDone = true;
          contKey.cancel();
          for (const o of contObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }

          // Phase 2: Game over screen
          const goObjs = [];
          goObjs.push(add([sprite("gameOverBg"), fixed(), z(50)]));
          const pt = add([sprite("paperTex"), opacity(0.15), fixed(), z(51), "paperTex"]);
          pt.baseOpacity = 0.15;
          goObjs.push(pt);

          goObjs.push(add([
            text("REACHED FIGHT " + (ladderData.currentIdx + 1) + "/" + ladderData.opponents.length, { size: 22, font: "sans-serif" }),
            pos(W / 2, H / 2 - 20), anchor("center"), color(WHITE), fixed(), z(52),
          ]));

          let selected = 0;
          const optTexts = [
            add([
              text("> REINTENTAR", { size: 22, font: "sans-serif" }),
              pos(W * 0.25, H / 2 + 70), anchor("center"), color(WHITE), fixed(), z(52),
            ]),
            add([
              text("  MENÚ PRINCIPAL", { size: 22, font: "sans-serif" }),
              pos(W * 0.75, H / 2 + 70), anchor("center"), color(WHITE), fixed(), z(52), opacity(0.5),
            ]),
          ];
          goObjs.push(...optTexts);

          function updateSelection() {
            optTexts[0].text = selected === 0 ? "> REINTENTAR" : "  REINTENTAR";
            optTexts[1].text = selected === 1 ? "> MENÚ PRINCIPAL" : "  MENÚ PRINCIPAL";
            optTexts[0].opacity = selected === 0 ? 1 : 0.5;
            optTexts[1].opacity = selected === 1 ? 1 : 0.5;
          }

          let choiceMade = false;
          let idleTimer = 60;
          const timeoutMsg = add([fixed(), z(53), opacity(0)]);
          const timerText = add([
            text(String(idleTimer), { size: 16, font: "sans-serif" }),
            pos(W / 2, H / 2 + 110), anchor("center"), color(WHITE), opacity(0.5), fixed(), z(53),
          ]);
          const ti = setInterval(() => {
            if (choiceMade) return;
            idleTimer--;
            timerText.text = String(idleTimer);
            if (idleTimer <= 0) {
              clearInterval(ti);
              choiceMade = true;
              destroy(timerText);
              timeoutMsg.add([
                text("VOLVIENDO AL MENÚ PRINCIPAL...", { size: 14, font: "sans-serif" }),
                pos(W / 2, H / 2 + 110), anchor("center"), color(WHITE),
              ]);
              timeoutMsg.opacity = 1;
              wait(3, () => {
                for (const o of goObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
                isVersusMode = false;
                go("title");
              });
            }
          }, 1000);

          const doAction = () => {
            if (choiceMade) return;
            choiceMade = true;
            clearInterval(ti);
            for (const o of goObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
            sfxMenuSelect();
            if (selected === 0) {
              destroy(timerText);
              spawnLadderFight();
            } else {
              isVersusMode = false;
              go("title");
            }
          };

          const doPrev = () => { if (choiceMade) return; selected = selected === 0 ? 1 : 0; updateSelection(); };
          const doNext = () => { if (choiceMade) return; selected = selected === 0 ? 1 : 0; updateSelection(); };

          onKeyPress("a", doPrev);
          onKeyPress("d", doNext);
          onKeyPress("left", doPrev);
          onKeyPress("right", doNext);
          onKeyPress(actionKey, doAction);
        }
      }, 1000);
    }
  }

  function showLadderChampion() {
    sfxVictory();
    add([sprite("victoryBgChampion"), pos(0, 0), fixed(), z(50)]);
    add([sprite("paperTex"), opacity(0.15), fixed(), z(51), "paperTex"]).baseOpacity = 0.15;
    add([
      text("LADDER CHAMPION!", { size: 36, font: "sans-serif" }),
      pos(W / 2, H / 2 - 20), anchor("center"), color(WHITE), fixed(), z(52),
    ]);
    const blink = add([
      text("SPACE: MENU", { size: 14, font: "sans-serif" }),
      pos(W / 2, H / 2 + 20), anchor("center"), color(WHITE), fixed(), z(52),
    ]);
    let b = 0;
    onUpdate(() => { b += dt(); blink.opacity = b % 1 < 0.6 ? 1 : 0.3; });
    onKeyPress("space", () => {
      isVersusMode = false;
      sfxMenuSelect();
      go("title");
    });
  }

  // ============================================================
  // CHALLENGER INTERRUPTION
  // ============================================================

  function startChallenge(challengerPid) {
    isChallengePick = true;
    phase = "challengePick";

    if (p1 && p1.exists) p1.paused = true;
    if (cpuOpponent && cpuOpponent.exists) cpuOpponent.paused = true;
    vsState.hitPause = 0;

    challengeState = { challengerPid };
    challengeCharChoice = 0;
    challengeObjs = [];
    const overlay = add([fixed(), z(100)]);
    overlay.add([sprite("gauntletSelectBg"), fixed()]);
    challengeObjs.push(overlay);

    const title = add([
      text("NEW CHALLENGER!", { size: 24, font: "sans-serif" }),
      pos(W / 2, 50), anchor("center"), color(INK), fixed(), z(101),
    ]);
    challengeObjs.push(title);
    const sub = add([
      text("P" + challengerPid + " CHALLENGES!", { size: 14, font: "sans-serif" }),
      pos(W / 2, 80), anchor("center"), color(INK), fixed(), z(101),
    ]);
    challengeObjs.push(sub);

    renderChallengePick(challengerPid);
  }

  function renderChallengePick(challengerPid) {
    while (challengeObjs.length > 3) {
      const o = challengeObjs.pop();
      try { if (o && o.exists) destroy(o); } catch(e) {}
    }

    const charPreview = createCharacter(W / 2, 230, CHAR_OPTIONS[challengeCharChoice], "preview");
    challengeObjs.push(charPreview);

    const nameLabel = add([
      text(CHAR_NAMES[CHAR_OPTIONS[challengeCharChoice]], { size: 14, font: "sans-serif" }),
      pos(W / 2, 320), anchor("center"), color(INK), fixed(), z(101),
    ]);
    challengeObjs.push(nameLabel);
    const promptLabel = add([
      text("A/D CYCLE  |  " + (challengerPid === 1 ? "J" : "1") + " CONFIRM", { size: 11, font: "sans-serif" }),
      pos(W / 2, 360), anchor("center"), color(INK), fixed(), z(101),
    ]);
    challengeObjs.push(promptLabel);
    const defLabel = add([
      text("P" + (challengerPid === 1 ? 2 : 1) + " (DEFENDER): " + CHAR_NAMES[ladderData.charType], { size: 11, font: "sans-serif" }),
      pos(W / 2, 390), anchor("center"), color(INK), fixed(), z(101),
    ]);
    challengeObjs.push(defLabel);
  }

  function startChallengeFight() {
    isChallengePick = false;
    isChallengeFight = true;

    for (const o of challengeObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
    challengeObjs.length = 0;

    if (cpuOpponent && cpuOpponent.exists) { cpuOpponent.dead = true; destroy(cpuOpponent); cpuOpponent = null; }
    if (p1 && p1.exists) { p1.dead = true; vsState.players = vsState.players.filter(p => p !== p1); destroy(p1); p1 = null; }
    vsState.players.length = 0;

    const defenderPid = ladderData.pid;
    const challengerPid = defenderPid === 1 ? 2 : 1;
    const defenderChar = ladderData.charType;
    const challengerChar = CHAR_OPTIONS[challengeCharChoice];

    const defenderControls = defenderPid === 1
      ? { left: "a", right: "d", up: "w", down: "s", punch: "j", jump: "k", dodge: "l" }
      : { left: "left", right: "right", up: "up", down: "down", punch: "1", jump: "2", dodge: "3" };

    const challengerControls = challengerPid === 1
      ? { left: "a", right: "d", up: "w", down: "s", punch: "j", jump: "k", dodge: "l" }
      : { left: "left", right: "right", up: "up", down: "down", punch: "1", jump: "2", dodge: "3" };

    p1 = createVersusPlayer(defenderChar, 150, V_GROUND_Y, defenderControls, 1);
    p2 = createVersusPlayer(challengerChar, W - 150, V_GROUND_Y, challengerControls, 2);
    p2.scale.x = -1;

    p1Wins = 0;
    p2Wins = 0;
    round = 1;

    startCountdown(true);
  }

  // Challenge pick key handlers
  onKeyPress("a", () => {
    if (!isChallengePick) return;
    challengeCharChoice = (challengeCharChoice - 1 + CHAR_OPTIONS.length) % CHAR_OPTIONS.length;
    sfxMenuSelect();
    renderChallengePick(challengeState ? challengeState.challengerPid : 1);
  });
  onKeyPress("d", () => {
    if (!isChallengePick) return;
    challengeCharChoice = (challengeCharChoice + 1) % CHAR_OPTIONS.length;
    sfxMenuSelect();
    renderChallengePick(challengeState ? challengeState.challengerPid : 1);
  });
  onKeyPress("left", () => {
    if (!isChallengePick) return;
    challengeCharChoice = (challengeCharChoice - 1 + CHAR_OPTIONS.length) % CHAR_OPTIONS.length;
    sfxMenuSelect();
    renderChallengePick(challengeState ? challengeState.challengerPid : 1);
  });
  onKeyPress("right", () => {
    if (!isChallengePick) return;
    challengeCharChoice = (challengeCharChoice + 1) % CHAR_OPTIONS.length;
    sfxMenuSelect();
    renderChallengePick(challengeState ? challengeState.challengerPid : 1);
  });
  onKeyPress("j", () => {
    if (!isChallengePick || !challengeState || challengeState.challengerPid !== 1) return;
    sfxMenuSelect();
    startChallengeFight();
  });
  onKeyPress("1", () => {
    if (!isChallengePick || !challengeState || challengeState.challengerPid !== 2) return;
    sfxMenuSelect();
    startChallengeFight();
  });

  onKeyPress("escape", () => {
    if (phase === "select" || phase === "ladderIntro") { isVersusMode = false; go("title"); }
    if (phase === "challengePick") {
      isChallengePick = false;
      phase = "fight";
      for (const o of challengeObjs) { try { if (o && o.exists) destroy(o); } catch(e) {} }
      challengeObjs.length = 0;
      challengeState = null;
      if (p1 && p1.exists) p1.paused = false;
      if (cpuOpponent && cpuOpponent.exists) cpuOpponent.paused = false;
    }
  });

  // Auto-start si ambos jugadores ya lockearon (rematch directo)
  if (p1Locked && p2Locked) startCountdown();

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// TUTORIAL SCENE
// ============================================================

scene("tutorial", () => {
  stopMusic();
  changeMusic("tutorial");
  const TF = 2;
  const T_GRAVITY = 800;
  const T_JUMP_FORCE = -300;
  const T_GROUND_Y = H - 70;

  // Background
  add([rect(W, H), color(PAPER), fixed()]);
  add([sprite("paperTex"), opacity(0.15), fixed(), "paperTex"]).baseOpacity = 0.15;

  // Ground
  add([rect(W, 4), color(INK), pos(0, T_GROUND_Y), fixed()]);

  // Decorative lines
  for (let i = 0; i < 6; i++) {
    add([rect(rand(30, 80), 1), color(INK), pos(rand(20, W - 20), rand(20, T_GROUND_Y - 40)), opacity(rand(0.05, 0.12)), fixed()]);
  }

  // Player state
  let p = {
    pos: vec2(W / 2, T_GROUND_Y),
    vy: 0, onGround: true, facing: 1,
    speed: 150, hp: 100, invincible: 0,
    dodgeCooldown: 0, superCooldown: 0,
    punchTimer: 0, punchHitbox: null, punchDir: 1, punchIsSuper: false,
  };

  const spriteCfg = CHAR_SPRITES["punkette"];
  const playerObj = add([
    pos(p.pos),
    area({ shape: new Rect(vec2(-14 * TF, -24 * TF), 28 * TF, 48 * TF) }),
    anchor("center"),
    z(10),
  ]);
  let spriteChild = null;
  if (spriteCfg) {
    const s = (48 * TF) / spriteCfg.h * 1.5;
    spriteChild = playerObj.add([
      sprite(spriteCfg.name),
      scale(s),
      anchor("center"),
    ]);
    spriteChild.flipX = false;
  }

  // Step system
  let stepIdx = -1;
  const stepObjs = [];
  let stepDone = false;
  let completedSteps = [];
  let jumpCount = 0;
  let dodgeCount = 0;
  let hasCollected = false;
  let stepStartTime = 0;
  let moveStartPos = null;
  let fightEnemies = [];

  function cleanupStep() {
    stepObjs.forEach(o => { if (o.exists()) destroy(o); });
    stepObjs.length = 0;
    fightEnemies.forEach(e => { if (e.exists()) destroy(e); });
    fightEnemies = [];
    stepDone = false;
  }

  function showStepComplete(name) {
    const txt = add([
      text("✓ " + name, { size: 18, font: "sans-serif" }),
      pos(W / 2, H / 2 - 40),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(1),
      lifespan(0.8),
    ]);
    completedSteps.push(name);
  }

  function showInstruction(msg, subtext) {
    const yOff = subtext ? 40 : 0;
    const t1 = add([
      text(msg, { size: subtext ? 14 : 20, font: "sans-serif" }),
      pos(W / 2, 30 + yOff),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(0),
    ]);
    stepObjs.push(t1);
    wait(0.1, () => { if (t1.exists()) t1.opacity = 1; });
    if (subtext) {
      const t2 = add([
        text(subtext, { size: 12, font: "sans-serif" }),
        pos(W / 2, 55),
        anchor("center"),
        color(INK),
        z(50),
        fixed(),
        opacity(0),
      ]);
      stepObjs.push(t2);
      wait(0.2, () => { if (t2.exists()) t2.opacity = 1; });
    }
  }

  function showStepCounter(current, total) {
    const t = add([
      text("STEP " + current + " / " + total, { size: 9, font: "sans-serif" }),
      pos(W - 50, 12),
      anchor("center"),
      color(INK),
      z(50),
      fixed(),
      opacity(0.4),
    ]);
    stepObjs.push(t);
  }

  function createCrate(x, y, hp, opts) {
    opts = opts || {};
    const crate = add([
      rect(opts.w || 28, opts.h || 28),
      color(WHITE),
      outline(3, INK),
      area(),
      pos(x, y),
      anchor("center"),
      z(10),
      "crate",
      { hp, maxHp: hp, superOnly: !!opts.superOnly, hitTimer: 0 },
    ]);
    stepObjs.push(crate);
    return crate;
  }

  function spawnHealthItem(x, y) {
    const item = add([
      rect(16, 16),
      color(WHITE),
      outline(3, INK),
      pos(x, y),
      area(),
      anchor("center"),
      z(25),
      "healthItem",
      { bob: rand(0, Math.PI * 2) },
    ]);
    item.add([rect(10, 3), color(INK), pos(-5, -1.5), anchor("center")]);
    item.add([rect(3, 10), color(INK), pos(-1.5, -5), anchor("center")]);
    stepObjs.push(item);
    return item;
  }

  function createProjectile(x, y, dir) {
    const proj = add([
      rect(10, 6),
      color(INK),
      area(),
      pos(x, y),
      anchor("center"),
      move(vec2(dir, 0), 120),
      z(10),
      opacity(1),
      "projectile",
      lifespan(4),
    ]);
    stepObjs.push(proj);
    return proj;
  }

  // Back to title
  onKeyPress("escape", () => { sfxMenuSelect(); go("title"); });

  // Step definitions
  const STEPS = [
    {
      name: "INTRO",
      run: () => {
        const overlay = add([fixed(), z(200)]);
        overlay.add([sprite("leyendaBg"), pos(0, 0)]);
        const lines = [
          "THE CITY IS A BATTLEFIELD.",
          "EVERY STREET, EVERY ROOFTOP,",
          "EVERY FACTORY FLOOR.",
          "",
          "BEFORE YOU FIGHT,",
          "YOU MUST LEARN.",
          "",
        ];
        const textObjs = [];
        const sy = H / 2 - (lines.length * 14) / 2;
        lines.forEach((line, i) => {
          const t = overlay.add([
            text(line, { size: line === "" ? 8 : 14, font: "sans-serif" }),
            pos(W / 2, sy + i * 18),
            anchor("center"), color(INK), z(201), opacity(0),
          ]);
          textObjs.push(t);
        });
        textObjs.forEach((t, i) => wait(0.15 + i * 0.12, () => { if (t.exists()) t.opacity = 1; }));
        const prompt = overlay.add([
          text("\[ SPACE / ENTER \]", { size: 12, font: "sans-serif" }),
          pos(W / 2, H - 55), anchor("center"), color(INK), z(201), opacity(0),
        ]);
        let blink = 0;
        const upd = onUpdate(() => { blink += dt(); prompt.opacity = blink % 1 < 0.6 ? 0.7 : 0.2; });
        stepObjs.push(overlay);
        stepObjs.push({ cancel: () => { upd.cancel(); destroy(overlay); } });
        stepDone = false;
        const handler = onKeyPress("space", () => { handler.cancel(); sfxMenuSelect(); advanceStep(); });
        const handler2 = onKeyPress("enter", () => { handler2.cancel(); sfxMenuSelect(); advanceStep(); });
        stepObjs.push(handler);
        stepObjs.push(handler2);
      },
    },
    {
      name: "MOVE",
      run: () => {
        showInstruction("USE WASD TO MOVE", "Move around to learn the streets");
        showStepCounter(1, 7);
        moveStartPos = p.pos.clone();
        stepDone = false;
      },
      check: () => p.pos.dist(moveStartPos) > 70,
    },
    {
      name: "JUMP",
      run: () => {
        showInstruction("PRESS K TO JUMP", "Jump 3 times to show your spirit");
        showStepCounter(2, 7);
        jumpCount = 0;
        stepDone = false;
      },
      check: () => {
        if (jumpCount >= 3) return true;
        return false;
      },
    },
    {
      name: "PUNCH",
      run: () => {
        showInstruction("PRESS J TO PUNCH", "Destroy both training crates");
        showStepCounter(3, 7);
        createCrate(W / 2 - 50, T_GROUND_Y - 22, 15, { w: 40, h: 40 });
        createCrate(W / 2 + 50, T_GROUND_Y - 22, 15, { w: 40, h: 40 });
        stepDone = false;
      },
      check: () => {
        const crates = get("crate");
        return crates.length === 0;
      },
    },
    {
      name: "SUPER",
      run: () => {
        showInstruction("PRESS J+K FOR SUPER ATTACK", "Destroy the reinforced crate");
        showStepCounter(4, 7);
        createCrate(W / 2, T_GROUND_Y - 22, 75, { w: 40, h: 40, superOnly: true });
        stepDone = false;
      },
      check: () => {
        const crates = get("crate");
        return crates.length === 0;
      },
    },
    {
      name: "DODGE",
      run: () => {
        showInstruction("PRESS L TO DODGE", "Dodge 3 incoming projectiles");
        showStepCounter(5, 7);
        dodgeCount = 0;

        // Turret that shoots
        let shootTimer = 0;
        const upd = onUpdate(() => {
          shootTimer += dt();
          if (shootTimer >= 1.5) {
            shootTimer = 0;
            createProjectile(20, T_GROUND_Y - 20, 1);
          }
        });
        stepObjs.push({ cancel: () => upd.cancel() });
        stepDone = false;
      },
      check: () => dodgeCount >= 3,
    },
    {
      name: "COLLECT",
      run: () => {
        showInstruction("WALK OVER ITEMS", "Collect the health pickup");
        showStepCounter(6, 7);
        spawnHealthItem(W / 2 + 120, T_GROUND_Y - 12);
        hasCollected = false;
        stepDone = false;
      },
      check: () => hasCollected,
    },
    {
      name: "FIGHT",
      run: () => {
        showInstruction("PUT IT ALL TOGETHER", "Defeat 2 enemies");
        showStepCounter(7, 7);
        stepDone = false;

        const e1 = createTutorialEnemy(100, T_GROUND_Y, "grunt");
        const e2 = createTutorialEnemy(W - 100, T_GROUND_Y, "punk");
        fightEnemies = [e1, e2];
      },
      check: () => {
        return fightEnemies.every(e => !e.exists() || e.hp <= 0);
      },
    },
  ];

  function createTutorialEnemy(x, y, type) {
    const cfg = CHAR_CONFIG[type];
    const enemy = add([
      rect(28 * TF, 48 * TF),
      color(WHITE),
      outline(3, INK),
      area({ shape: new Rect(vec2(-14 * TF, -24 * TF), 28 * TF, 48 * TF) }),
      pos(x, y),
      anchor("center"),
      z(10),
      "tutorialEnemy",
      { hp: type === "grunt" ? 30 : 40, invincible: 0, facing: -1, speed: 40, hitTimer: 0 },
    ]);
    enemy.add([rect(cfg.bodyW * TF, cfg.bodyH * TF), outline(3), color(WHITE), anchor("center")]);
    enemy.add([rect(cfg.headW * TF, cfg.headH * TF), outline(3), color(WHITE), pos(0, -cfg.bodyH * TF / 2 - cfg.headH * TF + 2), anchor("center")]);
    stepObjs.push(enemy);
    return enemy;
  }

  function advanceStep() {
    if (stepIdx >= 0 && stepObjs.length > 0) {
      // Cleanup any step-specific objects with a cancel method
      stepObjs.forEach(o => { if (o && o.cancel) o.cancel(); else if (o && o.exists) { try { destroy(o); } catch(e) {} } });
    }
    stepObjs.length = 0;
    cleanupStep();

    stepIdx++;
    if (stepIdx >= STEPS.length) {
      showTutorialEnd();
      return;
    }
    STEPS[stepIdx].run();
    stepStartTime = time();
  }

  function showTutorialEnd() {
    add([
      text("TRAINING COMPLETE", { size: 32, font: "sans-serif" }),
      pos(W / 2, H / 2 - 30),
      anchor("center"), color(INK), z(50), fixed(),
    ]);
    add([
      text("YOU ARE READY FOR WARZINE", { size: 14, font: "sans-serif" }),
      pos(W / 2, H / 2 + 10),
      anchor("center"), color(INK), z(50), fixed(),
    ]);
    let blink = 0;
    const retry = add([
      text("\[ SPACE \]  RETURN TO TITLE", { size: 13, font: "sans-serif" }),
      pos(W / 2, H / 2 + 60),
      anchor("center"), color(INK), z(50), fixed(),
    ]);
    onUpdate(() => { blink += dt(); retry.opacity = blink % 1 < 0.6 ? 1 : 0.3; });
    onKeyPress("space", () => { sfxMenuSelect(); localStorage.setItem("warzine_tutorial", "1"); go("title"); });
    onKeyPress("enter", () => { sfxMenuSelect(); localStorage.setItem("warzine_tutorial", "1"); go("title"); });
  }

  // Main update
  const TUTORIAL_STEP_COUNT = STEPS.length;

  onUpdate(() => {
    if (stepIdx < 0) return;

    // Physics
    if (!p.onGround) {
      p.vy += T_GRAVITY * dt();
    }
    p.pos.y += p.vy * dt();

    if (p.pos.y >= T_GROUND_Y) {
      p.pos.y = T_GROUND_Y;
      p.onGround = true;
      p.vy = 0;
    } else {
      p.onGround = false;
    }

    // Keep in bounds
    p.pos.x = Math.max(30, Math.min(W - 30, p.pos.x));

    // Movement
    let dx = 0;
    if (isKeyDown("a") || isKeyDown("left")) dx -= 1;
    if (isKeyDown("d") || isKeyDown("right")) dx += 1;
    p.pos.x += dx * p.speed * dt();
    if (dx !== 0) p.facing = dx > 0 ? 1 : -1;

    // Dodge cooldown
    if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt();
    if (p.invincible > 0) p.invincible -= dt();

    // Update player object position
    playerObj.pos = p.pos;
    if (spriteChild) spriteChild.flipX = p.facing < 0;

    // Step-specific logic
    const step = STEPS[stepIdx];
    if (step && step.check && !stepDone) {
      if (step.check()) {
        stepDone = true;
        showStepComplete(step.name);
        wait(0.6, () => advanceStep());
      }
    }

    // Punch hitbox collision (onUpdate to ensure collision system is ready)
    if (p.punchTimer > 0) {
      p.punchTimer -= dt();
      if (p.punchHitbox && p.punchHitbox.exists()) {
        const dir = p.punchDir;
        p.punchHitbox.pos = vec2(p.pos.x + dir * 20, p.pos.y);
        // Check crates
        let hitSomething = false;
        get("crate").forEach(c => {
          if (p.punchHitbox.isColliding(c) && (!c.superOnly || p.punchIsSuper)) {
            if (c.hitTimer <= 0) {
              if (p.punchIsSuper) c.hp -= 75;
              else c.hp -= 15;
              c.hitTimer = 0.1;
              c.color = INK;
              spawnInkSplat(c.pos.x, c.pos.y);
              if (c.hp <= 0) { destroy(c); sfxKill(); }
              else sfxHit();
              hitSomething = true;
            }
          }
        });
        // Check enemies
        get("tutorialEnemy").forEach(e => {
          if (p.punchHitbox.isColliding(e)) {
            if (e.hitTimer <= 0) {
              const dmg = p.punchIsSuper ? 40 : 15;
              e.hp -= dmg;
              e.hitTimer = 0.1;
              e.color = INK;
              spawnInkSplat(e.pos.x, e.pos.y);
              if (e.hp <= 0) { destroy(e); sfxKill(); }
              else { sfxHit(); e.invincible = 0.3; }
              hitSomething = true;
            }
          }
        });
        if (hitSomething) p.punchTimer = Math.max(p.punchTimer, 0.04); // brief hitpause
      }
      if (p.punchTimer <= 0) {
        if (p.punchHitbox && p.punchHitbox.exists()) destroy(p.punchHitbox);
        p.punchHitbox = null;
      }
    }

    // Hit flash reset
    get("crate").forEach(c => {
      if (c.hitTimer > 0) {
        c.hitTimer -= dt();
        if (c.hitTimer <= 0) c.color = WHITE;
      }
    });
    get("tutorialEnemy").forEach(e => {
      if (e.hitTimer > 0) {
        e.hitTimer -= dt();
        if (e.hitTimer <= 0) e.color = WHITE;
      }
    });
  });

  // Jump handling
  onKeyPress("k", () => {
    if (stepIdx < 0) return;
    if (p.onGround) {
      p.vy = T_JUMP_FORCE;
      p.onGround = false;
      playTone(200, 0.15, 0.2, "square", 600);
      jumpCount++;
    }
  });
  onKeyPress("up", () => {
    if (stepIdx < 0) return;
    if (p.onGround) {
      p.vy = T_JUMP_FORCE;
      p.onGround = false;
      playTone(200, 0.15, 0.2, "square", 600);
      jumpCount++;
    }
  });

  // Dodge
  onKeyPress("l", () => {
    if (p.dodgeCooldown > 0) return;
    p.dodgeCooldown = 1;
    p.invincible = 0.3;
    p.pos.x += p.facing * 60;
    playNoise(0.1, 0.2, 1000, "highpass");
    dodgeCount++;
  });
  onKeyPress("3", () => {
    if (p.dodgeCooldown > 0) return;
    p.dodgeCooldown = 1;
    p.invincible = 0.3;
    p.pos.x += p.facing * 60;
    playNoise(0.1, 0.2, 1000, "highpass");
    dodgeCount++;
  });

  // Projectile collision
  onUpdate(() => {
    if (stepIdx === 5) {
      get("projectile").forEach(proj => {
        if (proj.exists() && p.pos.dist(proj.pos) < 25) {
          if (p.invincible <= 0) {
            // Hit! This means they didn't dodge
            p.invincible = 0.5;
            // Just push back, no health loss
          }
          destroy(proj);
        }
      });
    }
  });

  // Health item collection
  onUpdate(() => {
    if (stepIdx === 6) {
      get("healthItem").forEach(item => {
        if (item.exists() && p.pos.dist(item.pos) < 25) {
          hasCollected = true;
          spawnInkSplat(item.pos.x, item.pos.y);
          destroy(item);
          sfxItemPickup();
        }
      });
    }
  });

  // Punch & Super handling — sets flag, collision processed in onUpdate
  function doPunch(isSuper) {
    if (stepIdx < 0) return;
    if (p.punchTimer > 0) return;
    p.punchDir = p.facing;
    p.punchIsSuper = isSuper && stepIdx >= 4;
    if (p.punchIsSuper) {
      playNoise(0.15, 0.3, 500, "bandpass");
      playTone(150, 0.2, 0.3, "sawtooth", 80);
      p.punchHitbox = add([pos(0, 0), rect(50, 40), area(), anchor("center"), z(15), opacity(0)]);
      p.punchTimer = 0.15;
    } else {
      playNoise(0.08, 0.4, 3000, "lowpass");
      playTone(80, 0.06, 0.3, "square");
      p.punchHitbox = add([pos(0, 0), rect(26, 22), area(), anchor("center"), z(15), opacity(0)]);
      p.punchTimer = 0.12;
    }
  }

  onKeyPress("j", () => doPunch(isKeyDown("k") || isKeyDown("2")));
  onKeyPress("1", () => doPunch(isKeyDown("k") || isKeyDown("2")));

  // Enemy AI
  onUpdate(() => {
    get("tutorialEnemy").forEach(e => {
      if (e.hp <= 0) return;
      // Simple chase
      const dir = p.pos.x > e.pos.x ? 1 : -1;
      e.facing = dir;
      e.pos.x += dir * e.speed * dt();

      // Keep in bounds
      e.pos.x = Math.max(30, Math.min(W - 30, e.pos.x));

      // Push player slightly on contact
      if (p.pos.dist(e.pos) < 30) {
        if (p.invincible <= 0) {
          p.invincible = 0.3;
        }
        // Push apart
        const pushDir = p.pos.x > e.pos.x ? 1 : -1;
        p.pos.x += pushDir * 3;
        e.pos.x -= pushDir * 3;
      }
    });
  });

  // Start
  advanceStep();

  // Paper texture toggle
  onKeyPress("p", togglePaperTex);
});

// ============================================================
// START
// ============================================================

go("title");
