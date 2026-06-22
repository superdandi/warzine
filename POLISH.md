# WARZINE — Checklist de pulido

> Prioridad: 🔥 crítica | ⚡ alta | 💧 media | 🌱 futura
> Estado: ⬜ pendiente | 🔄 en proceso | ✅ completado

---

## 🎮 JUGABILIDAD / GAME FEEL

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Hitpause (frames de pausa al conectar golpe) | ⬜ | Congelar todo ~3-4 frames por impacto |
| 🔥 | Tiempo de ataque enemigo menos aleatorio | ⬜ | Que el timing sea justo, no spam |
| ⚡ | Knockback más dramático en combos | ⬜ | Que el 3er golpe mande volando |
| ⚡ | Velocidad de caída del salto (tuning) | ⬜ | GRAVITY=800, probar 600-1000 |
| ⚡ | Hitbox de ataques más generosa | ⬜ | Que cubra mejor el rango visual del brazo |
| ⚡ | Combo: ventana de 0.4s → 0.25s | ⬜ | Más tight, más skill |
| 💧 | Super attack: animación especial | ⬜ | Que no sea solo el mismo punch pose |
| 💧 | Invulnerabilidad después de hit (tuning) | ⬜ | 0.3s, probar 0.15-0.4 |
| 💧 | Ataque en aire: que golpee hacia abajo | ⬜ | Hitbox más abajo del personaje |
| 🌱 | Agarres / throws | ⬜ | Clásico del género |
| 🌱 | Armas arrojadizas (botellas, bates) | ⬜ | Pickups en el escenario |
| 🌱 | Movimientos especiales por personaje | ⬜ | Diferenciar Punkette de Antagonic |
| 🌱 | Dodge / roll | ⬜ | Botón de esquivar con i-frames |

---

## 👾 ENEMIGOS / WAVES

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Más variedad de enemigos por wave | ⬜ | Combinaciones más interesantes |
| ⚡ | Enemigos que atacan en grupo | ⬜ | No esperar turno, coordinación básica |
| ⚡ | Tough: que sea realmente amenazante | ⬜ | Daño alto pero predecible |
| 💧 | Que los enemigos puedan saltar | ⬜ | AI con salto básico |
| 💧 | Indicador visual de wave (número grande) | ⬜ | Más dramático que el texto actual |
| 🌱 | Enemigo con escudo | ⬜ | Romper escudo con combo o super |
| 🌱 | Enemigo que spawnea otros | ⬜ | "Líder" de wave |
| 🌱 | Wave 4+ / Endless mode | ⬜ | Después del boss, modo sin fin |

---

## 🧠 BOSS

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Más ataques en fase 2 | ⬜ | Agregar 1-2 patrones nuevos al enojarse |
| ⚡ | Boss invulnerable brevemente entre fases | ⬜ | Transición visible con flash |
| 💧 | Ataque de boss que el jugador tenga que saltar | ⬜ | Ground pound, onda expansiva |
| 💧 | Hitbox del boss ajustada al sprite grande | ⬜ | Que no sea injusto |
| 🌱 | Múltiples bosses | ⬜ | 2 jefes a la vez |
| 🌱 | Barra de fase (P1 / P2) en HUD | ⬜ | Indicador visual del enrage |

---

## 🖼️ VISUAL / SPRITES

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| 🔥 | Sprite sheets para personajes (futuro) | ⬜ | Reemplazar rect() por bitmaps dibujados |
| ⚡ | Background con parallax | ⬜ | 2-3 capas a distinta velocidad |
| ⚡ | Más variedad de fondos | ⬜ | Callejón, azotea, club, etc. |
| 💧 | Efecto de sangre / tinta al golpear | ⬜ | Mancha negra que se esparce |
| 💧 | Partículas al caminar (polvo) | ⬜ | Pequeños cuadrados detrás de los pies |
| 💧 | Transición entre waves (corte / viñeta) | ⬜ | Estilo cómic / fanzine |
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
| ⚡ | Pantalla de título más vistosa | ⬜ | Animación, título más grande |
| ⚡ | Pausa (ESC / P) | ⬜ | Freeze + overlay |
| 💧 | Pantalla de controles | ⬜ | Antes del juego o en pausa |
| 💧 | Character select (Punkette / Antagonic vs random) | ⬜ | Elegir personaje antes de empezar |
| 🌱 | High score / records | ⬜ | localStorage |
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
| 🔥 | Limpiar listeners al cambiar de scene | ⬜ | Los `onKeyPress` quedan colgados? |
| ⚡ | Resetear estado del juego al hacer retry | ⬜ | Que no queden enemigos vivos |
| 💧 | FPS drop con muchos enemigos | ⬜ | Optimizar partículas |
| 💧 | Colisiones entre enemigos | ⬜ | Que no se stackeen |
| 🌱 | Responsive / escalado mobile | ⬜ | Touch + viewport |
| 🌱 | Prevenir que P1 y P2 se empujen | ⬜ | O habilitar friendly fire toggle |

---

## 📐 NIVELES / CONTENIDO

| Prio | Item | Estado | Notas |
|------|------|--------|-------|
| ⚡ | Segundo nivel (escenario diferente) | ⬜ | Azotea, club nocturno |
| 💧 | Tercer nivel + boss final verdadero | ⬜ | Secuencia de jefes |
| 🌱 | Power-ups (comida, 1UP) | ⬜ | Clásico beat 'em up |
| 🌱 | Secretos / áreas ocultas | ⬜ | Puertas, callejones |

---

## ✅ HECHO (v1.0)

- [x] Movimiento 8 direcciones
- [x] Salto (K / 2)
- [x] Golpe (J / 1)
- [x] Super ataque A+B (J+K / 1+2)
- [x] Golpe en aire
- [x] 3 waves + boss con 2 fases
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
