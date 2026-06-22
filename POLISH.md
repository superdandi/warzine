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
| 🌱 | Agarres / throws | ⬜ | Clásico del género |
| 🌱 | Armas arrojadizas (botellas, bates) | ⬜ | Pickups en el escenario |
| 🌱 | Movimientos especiales por personaje | ⬜ | Diferenciar Punkette de Antagonic |
| 🌱 | Dodge / roll | ✅ | L/3 key, 0.3s i-frames, squish anim, 1s cooldown |

---

## 👾 ENEMIGOS / WAVES

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Más variedad de enemigos por wave | ✅ | Wave 1: grunts+punk, W2: +tough, W3: 3grunt+3punk+2tough |
| ⚡ | Enemigos que atacan en grupo | ✅ | Anti-stacking AI, cooldowns reducidos, chase cooperativo |
| ⚡ | Tough: que sea realmente amenazante | ✅ | Daño 18 (antes 15), speed 130, range 35 |
| 💧 | Que los enemigos puedan saltar | ✅ | AI salta si distancia > 80px, con cooldown 2-4s |
| 💧 | Indicador visual de wave + transición | ✅ | Flash de tinta + texto + fade |
| 🌱 | Enemigo con escudo | ⬜ | Romper escudo con combo o super |
| 🌱 | Enemigo que spawnea otros | ⬜ | "Líder" de wave |
| 🌱 | Wave 4+ / Endless mode | ✅ | Después del boss, waves infinitas con dificultad creciente |

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
| 🔥 | Sprite sheets para personajes (futuro) | ⬜ | Reemplazar rect() por bitmaps dibujados |
| ⚡ | Background con parallax | ✅ | 3 capas (far/mid/fore) a velocidad 0.05/0.12/0.25 |
| ⚡ | Más variedad de fondos | ✅ | Street (W1-2) → Rooftop (W3+) con parallax |
| 💧 | Efecto de sangre / tinta al golpear | ✅ | spawnInkSplat: 5 círculos negros semi-transparentes |
| 💧 | Partículas al caminar (polvo) | ✅ | spawnWalkDust: rects INK que se alejan al caminar |
| 💧 | Transición entre waves (flash) | ✅ | Flash de tinta + fade antes del texto de wave |
| 🌱 | Viñetas de diálogo / cómic | ⬜ | Historia entre waves |
| 🌱 | Animación de victoria / derrota | ⬜ | Pose final del personaje |
| 🌱 | Efecto de fotocopia más marcado | ⬜ | Más ruido, líneas de scan |

---

## 🔊 AUDIO

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | SFX de golpe (punch/kick) | ⬜ | Sample corto, crunch fanzine |
| 🔥 | SFX de recibir golpe | ⬜ | "Oof" o impacto |
| 🔥 | SFX de salto | ⬜ | "Whoosh" corto |
| ⚡ | SFX de super attack | ⬜ | Más potente, con eco |
| ⚡ | Música de fondo (loop) | ⬜ | Punk instrumental, 8-bit o grabado |
| 💧 | SFX de "WAVE N" | ⬜ | Anuncio con reverb |
| 💧 | SFX de boss | ⬜ | Risas, rugido |
| 💧 | SFX de game over | ⬜ | Derrota, estática |
| 🌱 | Banda sonora por nivel | ⬜ | Track diferente por escenario |

---

## 🖥️ UI / UX

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Pantalla de título más vistosa | ✅ | Título con drift animado, líneas pulsantes, decoración |
| ⚡ | Pausa (ESC / P) | ✅ | ESC toggle, overlay oscuro + PAUSED + continuar |
| 💧 | Pantalla de controles | ✅ | Pausa + C toggle, lista completa de teclas |
| 💧 | Character select (Punkette / Antagonic vs random) | ✅ | 3 personajes seleccionables, preview en vivo |
| 🌱 | High score / records | ✅ | localStorage, muestra BEST WAVE en game over y victory |
| 🌱 | Pantalla de créditos | ⬜ | Con scrolling tipo cine |
| 🌱 | Dificultad (Fácil / Normal / Duro) | ⬜ | HP, daño, velocidad enemiga |
| 🌱 | Tutorial interactivo | ⬜ | Primera partida guiada |

---

## 🎮 CONTROLES / INPUT

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Gamepad (mando USB) | ⬜ | API Gamepad de HTML5 |
| 💧 | Rebind de teclas | ⬜ | Menú de configuración |
| 🌱 | Controles táctiles (mobile) | ⬜ | Botones virtuales |
| 🌱 | 3-4 jugadores | ⬜ | Más teclas o más mandos |

---

## 🧹 TÉCNICO / BUGS

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Limpiar listeners al cambiar de scene | ✅ | events.clear() al entrar a game scene |
| ⚡ | Resetear estado del juego al hacer retry | ✅ | Kaplay scene() crea estado fresco |
| 💧 | FPS drop con muchos enemigos | ✅ | Partículas usan lifespan, auto-destrucción rápida |
| 💧 | Colisiones entre enemigos | ✅ | Anti-stacking: se repelen si distancia < 40px |
| 🌱 | Responsive / escalado mobile | ⬜ | Touch + viewport |
| 🌱 | Prevenir que P1 y P2 se empujen | ⬜ | O habilitar friendly fire toggle |

---

## 📐 NIVELES / CONTENIDO

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Segundo nivel (escenario diferente) | ⬜ | Azotea, club nocturno |
| 💧 | Tercer nivel + boss final verdadero | ⬜ | Secuencia de jefes |
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
