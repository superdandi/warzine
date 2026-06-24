# WARZINE — Checklist de pulido

> Prioridad: 🔥 crítica | ⚡ alta | 💧 media | 🌱 futura
> Estado: ⬜ pendiente | 🔄 en proceso | ✅ completado

---

## 🎮 JUGABILIDAD / GAME FEEL

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Hitpause (frames de pausa al conectar golpe) | ✅ | 0.04s (2-3 frames), knockback delayed |
| 🔥 | Tiempo de ataque enemigo menos aleatorio | ✅ | Cooldowns acotados, grupos más agresivos |
| ⚡ | Knockback más dramático en combos | ✅ | 3er golpe: 300 knockback, super: 300 |
| ⚡ | Velocidad de caída del salto (tuning) | ✅ | GRAVITY=800, probado funcional |
| ⚡ | Hitbox de ataques más generosa | ✅ | Punches: 22x18, super: 60x50, air: 20x18 |
| ⚡ | Combo: ventana de 0.4s → 0.25s | ✅ | Más tight, más skill requerida |
| 💧 | Super attack: animación especial | ✅ | Kick pose + 6 hit effects + arc, daño 35, cooldown 2s |
| 💧 | Invulnerabilidad después de hit (tuning) | ✅ | 0.3s player, 0.3s enemy, boss 1.5s en transición de fase |
| 💧 | Ataque en aire: que golpee hacia abajo | ✅ | Hitbox a y+20 (antes y+10) |
| 💧 | Floating damage popups | ✅ | Daño numérico flotante con dirección y fade |
| 💧 | Combo counter sobre jugador | ✅ | "N HITS" + escala pulsante mientras combo activo |
| 💧 | Milestone burst texto | ✅ | "3 HITS!", "5 HITS!", etc. en centro de pantalla |
| 🌱 | Agarres / throws | ⬜ | Clásico del género |
| 🌱 | Armas arrojadizas (botellas, bates) | ⬜ | Pickups en el escenario |
| 🌱 | Movimientos especiales por personaje | ⬜ | Diferenciar Punkette de Antagonic |
| 🌱 | Dodge / roll | ✅ | L/3 key, 0.3s i-frames, squish anim, 1s cooldown |

---

## 👾 ENEMIGOS / WAVES

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Más variedad de enemigos por wave | ✅ | 13 waves configuradas en 3 niveles |
| ⚡ | Enemigos que atacan en grupo | ✅ | Anti-stacking AI, cooldowns reducidos, chase cooperativo |
| ⚡ | Tough: que sea realmente amenazante | ✅ | Daño 18 (antes 15), speed 130, range 35 |
| 💧 | Que los enemigos puedan saltar | ✅ | AI salta si distancia > 80px, con cooldown 2-4s |
| 💧 | Indicador visual de wave + transición | ✅ | Flash de tinta + texto + fade |
| 🌱 | Enemigo con escudo | ⬜ | Romper escudo con combo o super |
| 🌱 | Enemigo que spawnea otros | ⬜ | "Líder" de wave |
| 🌱 | Sistema de waves por niveles | ✅ | LEVELS data + WAVE_CONFIGS planos con boundaries computados |

---

## 🧠 BOSS

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Más ataques en fase 2 | ✅ | Ground pound (esquivable saltando) + double swipe |
| ⚡ | Boss invulnerable brevemente entre fases | ✅ | 1.5s de invulnerabilidad + flash + screen shake |
| 💧 | Ataque de boss que el jugador tenga que saltar | ✅ | Ground pound (piso: hitbox a y+24, esquivable con salto) |
| 💧 | Hitbox del boss ajustada al sprite grande | ✅ | Ataques con hitbox escaladas (28px punch, 40px slam) |
| 🌱 | Múltiples bosses | ⬜ | 2 jefes a la vez |
| 🌱 | Barra de fase (P1 / P2) en HUD | ✅ | "PHASE 1 / 2" debajo de la health bar del boss |

---

## 🖼️ VISUAL / SPRITES

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Sprite sheets para personajes (futuro) | ⬜ | Concept art listo en repo, falta integrar |
| ⚡ | Background con parallax | ✅ | 3 capas (far/mid/fore) a velocidad 0.05/0.12/0.25 |
| ⚡ | Más variedad de fondos | ✅ | Street → Rooftop → Factory (3 niveles, switchBg destroy+recreate) |
| 💧 | Fondo de fábrica (nivel 3) | ✅ | Chimeneas, tuberías, cintas transportadoras, rejillas, franjas advertencia |
| 💧 | Efecto de sangre / tinta al golpear | ✅ | spawnInkSplat: 5 círculos negros semi-transparentes |
| 💧 | Partículas al caminar (polvo) | ✅ | spawnWalkDust: rects INK que se alejan al caminar |
| 💧 | Transición entre waves (flash) | ✅ | Flash de tinta + fade antes del texto de wave |
| 💧 | Animación de revive (get-up) | ✅ | Tween de rotación 90→0 + ink burst al revivir |
| 🌱 | Viñetas de diálogo / cómic | ⬜ | Historia entre waves |
| 🌱 | Animación de victoria / derrota | ⬜ | Pose final del personaje |
| 🌱 | Efecto de fotocopia más marcado | ⬜ | Más ruido, líneas de scan |

---

## 🔊 AUDIO

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Sistema de sonido procedural (Web Audio API) | ✅ | 15 efectos con osciladores + ruido, música drum & bass loop |
| 🔥 | SFX de golpe (punch/kick) | ✅ | Noise burst + square wave, corto y seco |
| 🔥 | SFX de recibir golpe | ✅ | Sawtooth + noise, tono más grave |
| 🔥 | SFX de salto | ✅ | Ascenso rápido de tono (square wave) |
| ⚡ | SFX de super attack | ✅ | Bandpass noise + sawtooth sweep, más potente |
| ⚡ | Música de fondo (loop) | ✅ | Drum & bass: kick, snare, hi-hat, bass 120 BPM |
| 💧 | SFX de "WAVE N" | ✅ | Beep doble al iniciar wave |
| 💧 | SFX de boss | ✅ | Rumble grave + noise al aparecer; fanfare al morir |
| 💧 | SFX de game over | ✅ | Descenso cromático sawtooth |
| 💧 | SFX de victoria | ✅ | Arpegio ascendente 4 notas (cuadrado) |
| 🌱 | Banda sonora por nivel | ✅ | MUSIC_THEMES: 3 niveles × 3 fases (normal/miniboss/boss) |

---

## 🖥️ UI / UX

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Pantalla de título más vistosa | ✅ | Título con drift animado, líneas pulsantes, decoración |
| ⚡ | Pausa (ESC / P) | ✅ | ESC toggle, overlay oscuro + PAUSED + continuar |
| 💧 | Pantalla de controles | ✅ | Pausa + C toggle, lista completa de teclas |
| 💧 | Character select (Punkette / Antagonic vs random) | ✅ | 3 personajes seleccionables, preview en vivo |
| 💧 | Contador de kills por jugador en HUD | ✅ | "KILLS: N" bajo cada barra de vida |
| 💧 | Revive prompt en HUD | ✅ | "PRESS J - 8" con cuenta regresiva en barra superior |
| 💧 | Revive prompt centro pantalla | ✅ | Texto grande centrado cuando queda 1 jugador en pie |
| 💧 | High score / records | ✅ | localStorage, muestra BEST WAVE en game over y victory |
| 💧 | Pantalla de victoria | ✅ | Terminal cyberpunk, scanlines, quote, [SPACE] retry / [ENTER] título |
| 💧 | Viñetas de historia entre niveles | ✅ | Paneles comic con texto narrativo, fondo papel, splatters |
| 💧 | Selector de dificultad en título | ✅ | A/D para cambiar, Easy/Normal/Hard, multiplicadores en HP/daño/cantidad |
| 🌱 | Pantalla de créditos | ✅ | Scrolling, tecla C en título, estilo terminal |
| 🌱 | Dificultad (Fácil / Normal / Duro) | ⬜ | HP, daño, velocidad enemiga |
| 🌱 | Tutorial interactivo | ✅ | Escena separada, tecla T, 8 pasos + fight final |

---

## 🎮 CONTROLES / INPUT

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Mute toggle (tecla M) | ✅ | Activa/desactiva todos los sonidos + detiene música |
| 💧 | SFX menú / navegación | ✅ | Clic cuadrado en título, select y game over |
| 💧 | Rebind de teclas | ⬜ | Menú de configuración |
| 🌱 | Controles táctiles (mobile) | ⬜ | Botones virtuales |
| 🌱 | 3-4 jugadores | ⬜ | Más teclas o más mandos |

---

## 🧹 TÉCNICO / BUGS

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Limpiar listeners al cambiar de scene | ✅ | events.clear() al entrar a game scene |
| ⚡ | Resetear estado del juego al hacer retry | ✅ | Kaplay scene() crea estado fresco |
| ⚡ | Colisión enemigos con mid-game join | ✅ | Reemplazado onCollide por onUpdate + isColliding |
| ⚡ | Death handler para mid-game join | ✅ | Movido de bucle estático a createPlayer |
| ⚡ | Timer de revive congelado en pausa | ✅ | if (state.paused) return en downed handler |
| 💧 | FPS drop con muchos enemigos | ✅ | Partículas usan lifespan, auto-destrucción rápida |
| 💧 | Colisiones entre enemigos | ✅ | Anti-stacking: se repelen si distancia < 40px |
| 💧 | Fix: miniboss no moría (tag 'miniBoss' → isMiniBoss) | ✅ | Tag reservado, cambiado a propiedad |
| 💧 | Fix: double deploy (Pages API build_type) | ✅ | Cambiado de legacy a workflow |
| 💧 | Fix: textos transición persistentes | ✅ | destroy() en timeout del wait() |
| 💧 | Fix: fondo mostrándose tras transición | ✅ | destroy+recreate bgLayers en switchBg() |
| 💧 | Fix: jugador horizontal tras revive | ✅ | Conflicto de tweens downed/get-up resuelto |
| 🌱 | Responsive / escalado mobile | ⬜ | Touch + viewport |
| 🌱 | Prevenir que P1 y P2 se empujen | ⬜ | O habilitar friendly fire toggle |

---

## 📐 NIVELES / CONTENIDO

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Tres niveles completos | ✅ | Calle → Azotea → Fábrica, cada uno con pre-mid waves → Miniboss → post-mid waves → Boss |
| 💧 | Progresión por niveles | ✅ | Boss de nivel N → transición → nivel N+1; victoria tras nivel 3 |
| 🌱 | Pantalla de victoria (final real) | ✅ | Reemplaza endless mode, terminal cyberpunk con quote |
| 🌱 | Power-ups (comida, 1UP) | ✅ | Health drops 30% de enemigos, +30 HP |
| 🌱 | Secretos / áreas ocultas | ⬜ | Puertas, callejones |

---

## ✅ HECHO (v1.0)

- [x] Movimiento 8 direcciones
- [x] Salto (K / 2)
- [x] Golpe (J / 1)
- [x] Super ataque A+B (J+K / 1+2)
- [x] Golpe en aire
- [x] 3 waves + boss con 2 fases
- [x] Background parallax (3 capas)
- [x] Selector de personaje (Punkette / Antagonic / X-ERO)
- [x] Pantalla de pausa con controles
- [x] Enemigos saltan
- [x] Cambio de fondo: Street → Rooftop
- [x] Dodge / roll con i-frames (L / 3)
- [x] Power-ups de salud caen de enemigos
- [x] Modo endless después del boss
- [x] High score con localStorage
- [x] Indicador de fase del boss en HUD
- [x] 2 jugadores locales (mismo teclado)
- [x] Sistema de combos (J-J-J)
- [x] Personajes 2x más grandes (F=2, boss F=3)
- [x] HUD con barras de vida + wave + boss
- [x] Efectos: screen shake, partículas, arco de ataque
- [x] Estética tinta negra / fanzine
- [x] Textura de fotocopia overlay
- [x] Fondos procedurales (calle + edificios)
- [x] Modelado de personajes: ojos, botas, detalles
- [x] Escalado de detalles por tamaño (DS = F)

---

## ✅ HECHO (v1.2)

- [x] Floating damage popups numéricos al golpear
- [x] Combo counter "N HITS" sobre el jugador con escala
- [x] Milestone burst "3 HITS!", "5 HITS!" en centro
- [x] Contador de kills por jugador en HUD
- [x] **Sistema de revive** (downed 10s + revivir con 50% HP)
- [x] Revive funciona en single player y multi-player
- [x] Get-up animation (tween 90°→0°)
- [x] Ink burst visual al revivir
- [x] Centro pantalla revive prompt (último jugador en pie)
- [x] Timer de revive congelado durante pausa
- [x] Mid-game join: P2 recibe daño correctamente
- [x] Mid-game join: P2 puede morir (death handler en createPlayer)
- [x] Workflow custom GitHub Pages con nombre descriptivo
- [x] Concept art integrado al repo (punkette, x-ero, warzine, menu)
- [x] README actualizado con docs completos v1.1 + v1.2

---

## ✅ HECHO (v1.3)

- [x] **Miniboss "EL BRUTO"** después de WAVE 2
- [x] 250 HP, 2 ataques: heavy punch + charge
- [x] Enrage visual al 30% HP (más rápido + screen shake)
- [x] Drop de salud garantizado al morir
- [x] **Nivel 1 (Calle)**: W1 → W2 → Miniboss
- [x] **Nivel 2 (Azotea)**: W3 → Boss → Endless
- [x] Texto transición "LEVEL 1 CLEAR" + "ASCENDING TO THE ROOFTOP..."
- [x] Cambio de fondo Calle → Azotea post-miniboss
- [x] POLISH.md actualizado con v1.3

---

## ✅ HECHO (v1.4)

- [x] **Estructura de 3 niveles** con sistema de waves por niveles (LEVELS data + WAVE_CONFIGS)
- [x] **Nivel 1 (Calle)**: pre-mid: W1-W2 → Miniboss → post-mid: W3 → Boss → transición
- [x] **Nivel 2 (Azotea)**: pre-mid: W4-W5 → Miniboss → post-mid: W6-W7 → Boss → transición
- [x] **Nivel 3 (Fábrica)**: pre-mid: W8-W10 → Miniboss → post-mid: W11-W13 → Boss → Victoria
- [x] **Fondo de fábrica**: chimeneas, tuberías, cintas transportadoras, rejillas, franjas advertencia
- [x] **Pantalla de victoria** (terminal cyberpunk, scanlines, quote, retry/title)
- [x] **switchBg()**: destroy+recreate layers (fix fondo mostrándose)
- [x] **startNextLevel()**: avanza nivel, cambia bg, inicia primera wave
- [x] Fix: miniboss no moría (tag → propiedad)
- [x] Fix: double deploy (Pages API build_type)
- [x] Fix: textos transición persistentes
- [x] Fix: jugador horizontal tras revive

---

## ✅ HECHO (v1.5)

- [x] **Sistema de sonido procedural** con Web Audio API (sin archivos externos)
- [x] 15 efectos: hit, hitPlayer, jump, super, dodge, kill, playerDeath, revive, wave, bossWarning, bossDeath, victory, gameOver, itemPickup, combo, menuSelect
- [x] **Música de fondo** loop drum & bass (kick, snare, hi-hat, bass) a 120 BPM
- [x] **Mute toggle** con tecla M, overlay visual "SOUND: ON/OFF"
- [x] Música se detiene automáticamente en game over, victoria y título
- [x] SFX en menú: navegación (A/D/←/→), lock (J/1), start (SPACE), volver (ENTER)
- [x] SFX de combo al hacer milestone (burst text)

---

## ✅ HECHO (v1.6)

- [x] **Selector de dificultad** en título (A/D: Easy / Normal / Hard)
- [x] Easy: enemigos 70% HP/daño, jugador 130% daño, 75% enemigos por wave
- [x] Hard: enemigos 150% HP/daño, jugador 80% daño, 125% enemigos por wave
- [x] Indicador de dificultad en HUD
- [x] **Viñetas de historia** estilo comic entre niveles
- [x] Viñeta inicial: "THE CITY IS A CANCER..." antes de nivel 1
- [x] Viñeta nivel 1→2: "THE GROUND IS NOT ENOUGH..."
- [x] Viñeta nivel 2→3: "THE FACTORY BREATHES FIRE..."
- [x] Estética: fondo papel, bordes dobles, esquinas, splatters de tinta
- [x] Texto animado línea por línea + prompt [SPACE/ENTER] para continuar
