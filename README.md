# WARZINE

**v1.5** — Beat 'em up 2D con estética de tinta negra / fotocopia / fanzine punk. Construido con [Kaplay 3001](https://kaplayjs.com/).

[![Jugar ahora](https://img.shields.io/badge/Jugar-GitHub%20Pages-black?style=for-the-badge)](https://superdandi.github.io/warzine/)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-white?style=flat)](LICENSE)

---

## Controles

| Acción               | Player 1 (P1) | Player 2 (P2) |
|----------------------|:-------------:|:-------------:|
| Movimiento           |     WASD      |    Flechas    |
| Golpe (A)            |      J        |      1        |
| Salto (B)            |      K        |      2        |
| Super ataque (A+B)   |     J+K       |     1+2       |
| Dodge / Roll         |      L        |      3        |
| Start / Revivir      |      J        |      1        |
| Mute música/SFX     |      M        |      M        |
| Dificultad (menú)   |      A/D      |  Flechas izq/der |
| Pausa                |     ESC       |     ESC       |
| Controles (en pausa) |      C        |      C        |

### Mecánicas de combate

| Mecánica            | Descripción |
|---------------------|-------------|
| **Combo**           | J-J-J: 3 golpes consecutivos, el 3º hace 28 de daño (vs 12) y 300 de knockback |
| **Golpe en aire**   | J mientras saltás, ataque aéreo con hitbox hacia abajo (15 de daño) |
| **Super ataque**    | J+K / 1+2 simultáneo: barrido de área con 3 hitboxes, 35 de daño, screen shake |
| **Dodge / Roll**    | L / 3: esquivas con i-frames (0.3s), squish animation, 1s de reutilización |
| **Ventana de combo** | 0.25s entre golpes para mantener el combo |

---

## Gameplay

### Partida

- **1 o 2 jugadores:** P1 presiona J / P2 presiona 1 en la pantalla de título. Cada uno selecciona su personaje independientemente.
- **Dificultad:** En la pantalla de título, usa A/D (P1) o flechas (P2) para cambiar entre Easy / Normal / Hard. Afecta HP enemigo, daño recibido y cantidad de oleadas.
- **Mid-game join:** Si un jugador no empezó la partida, puede unirse durante el juego presionando su tecla Start (J para P1, 1 para P2) y eligiendo personaje.
- **Pausa:** ESC para pausar, C para ver controles.

### Sistema de revive y continuación

Cuando un jugador cae a **0 HP** y hay un compañero vivo:

1. **Estado "downed":** El jugador cae al suelo con un temporizador de **10 segundos**.
2. **Revivir:** Presionar la tecla Start (J / 1) revive al jugador con **50% de HP** e invulnerabilidad temporal (1.5s).
3. **Vuelve a la acción:** El jugador revivido se reincorpora cerca del centro del escenario.
4. **Timer expira:** Si nadie revive a tiempo, el jugador muere permanentemente. Puede **reingresar** seleccionando un nuevo personaje a través del sistema de join.

> Incluso con un solo jugador hay oportunidad de revive — caes al suelo con 10s para revivir presionando tu tecla Start. Si el timer expira, el jugador muere permanentemente y puede reingresar.

### Niveles y oleadas

Cada nivel sigue la estructura: **W1 → W2 → Miniboss → W3 → Boss**

| Nivel | Escenario | W1 | W2 | Miniboss | W3 | Boss |
|-------|-----------|:--:|:--:|:--------:|:--:|:----:|
| **1 — Street** | Ciudad | 2 Grunts | 3 Grunts + 1 Punk | EL BRUTO (250 HP) | 3 Grunts + 2 Punks + 1 Tough | Jefe (250 HP, 2 fases) |
| **2 — Rooftop** | Azotea | 3 Grunts + 1 Punk | 3 Grunts + 2 Punks | EL BRUTO (300 HP) | 4 Grunts + 3 Punks + 1 Tough | Jefe (300 HP, 2 fases) |
| **3 — Factory** | Fábrica | 4 Grunts + 1 Tough | 4 Grunts + 2 Punks + 1 Tough | EL BRUTO (350 HP) | 5 Grunts + 3 Punks + 2 Toughs | Jefe (400 HP, 2 fases) |

3 niveles con dificultad creciente. Al derrotar al jefe del nivel 3, **victoria** — pantalla final estilo terminal cyberpunk.

#### Tipos de enemigos

| Tipo     | HP  | Velocidad | Daño | Notas |
|----------|:---:|:---------:|:----:|-------|
| Grunt    | 30  | 150       | 8    | Básico, rápido |
| Punk     | 55  | 170       | 10   | Mohawk, agresivo |
| Tough    | 90  | 130       | 18   | Alto HP, lento, pegada fuerte |
| EL BRUTO | 250 | 120       | 15   | Miniboss: 2 patrones, enrage a 30% HP |
| Boss     | 250 | 100       | 12-18| 2 fases, 4 patrones de ataque |

### Personajes

| Personaje  | Tipo      | Descripción |
|------------|-----------|-------------|
| **Punkette** | Jugador   | Spikes punk, estilo callejero |
| **Antagonic** | Jugador  | Máscara antigás, look táctico |
| **X-ERO** | Jugador   | Visor de cyborg, experimental |

### HUD

| Elemento | Ubicación | Descripción |
|----------|-----------|-------------|
| Barra de vida P1 | Izquierda superior | HP del jugador 1 + nombre |
| Barra de vida P2 | Derecha superior | HP del jugador 2 + nombre |
| Contador KILLS  | Bajo cada barra | Enemigos eliminados por ese jugador |
| Dificultad      | Bajo contador KILLS | "EASY" / "NORMAL" / "HARD" |
| Wave / Boss     | Centro superior | "WAVE N", "MINIBOSS" o "BOSS FIGHT" |
| Barra de boss   | Centro (bajo HUD) | HP del boss + indicador de fase |
| Revive prompt   | En la barra de vida | "PRESS J - 8" con cuenta regresiva |
| Join prompt     | En la barra de vida | "P1: J TO JOIN" (parpadeante) |

### Efectos visuales

- **Hitpause:** Congelamiento de 0.04s al conectar un golpe
- **Screen shake:** Variable según el ataque (super: 10, normal: 3)
- **Ink splatter:** 5 círculos negros que explotan en el impacto
- **Attack arc:** Arco de tinta que acompaña cada golpe
- **Walk dust:** Partículas al caminar
- **Hit flash:** Destello blanco/negro en el enemigo al recibir daño
- **Paper texture:** Overlay de fotocopia con ruido procedural (opacidad 0.18)
- **Death animation:** Rotación del personaje + caída

---

## Técnico

### Stack

| Componente | Detalle |
|------------|---------|
| Motor de juego | [Kaplay](https://kaplayjs.com/) 3001.0.19 (CDN) |
| Lenguaje | JavaScript (1 archivo, ~3400 líneas) |
| Sprites | Generados proceduralmente con `rect()` + `outline()` |
| Fondos | Canvas API, parallax de 3 capas (calle / azotea / fábrica) |
| Audio | Web Audio API (15 SFX procedurales + música drum & bass) |
| Texturas | Ruido procedural + papel fotocopia |
| Despliegue | GitHub Pages (auto-deploy con workflow custom) |
| Dependencias | 0 externas |

### Controles técnicos

- **Scenas:** title → select → game → gameover / victory
- **Tags Kaplay:** `char`, `player`, `enemy`, `boss`, `playerHitbox`, `enemyHitbox`
- **Colisiones:** `area()` + chequeo manual en hitboxes enemigas (evita bugs con mid-game join)
- **High score:** `localStorage` ("warzine_high"), mejor wave alcanzada
- **Event bus:** Sistema de eventos interno para comunicación entre subsistemas
- **Dificultad:** Global `gameDifficulty` (0-2), multiplicadores de HP/daño/cantidad de enemigos

### Desarrollo local

```bash
git clone https://github.com/superdandi/warzine.git
cd warzine
# Servir localmente:
python3 -m http.server 8080
# Abrir http://localhost:8080
```

---

## Changelog

### v1.5 — Sonido, dificultad, viñetas, 3 niveles con victoria

- **Sound system:** 15 SFX procedurales vía Web Audio API (hit, jump, super, dodge, kill, etc.) + música drum & bass loop (120 BPM) + mute con tecla M
- **Dificultad selector:** Easy / Normal / Hard en pantalla de título (A/D o flechas), multiplicadores de HP, daño y oleadas
- **Story vignettes:** Paneles estilo cómic entre niveles con texto animado línea por línea, fondo de papel, splatters de tinta
- **3 niveles con victoria:** Street → Rooftop → Factory, cada nivel con W1→W2→Miniboss→W3→Boss. Al derrotar el jefe final, pantalla de victoria cyberpunk
- **Miniboss "EL BRUTO":** Aparece después de W2 en cada nivel, 2 patrones de ataque, enrage a 30% HP
- **Factory background:** Fondo industrial con siluetas de chimeneas, cintas transportadoras, barrotes, franjas de advertencia
- **Revive universal:** Ahora también funciona en partidas de 1 jugador (timer de 10s, revive con 50% HP)
- **Pantalla de victoria:** Estilo terminal, "SYSTEM.PURGE: COMPLETE", mensaje final, [SPACE] rejugar / [ENTER] título
- **Múltiples bugs fix:** transiciones persistentes, fondo traspasando entre niveles, rotación post-revive, game over falso durante viñetas

### v1.1 — Revive + continuación + kill counter

- **Revive system:** Cuando un jugador cae a 0 HP con compañero vivo, entra en estado downed con 10s para revivir (50% HP).
- **Muerte permanente:** Si expira el timer, el jugador muere y puede reingresar con selección de personaje.
- **Kill counter:** Contador de enemigos eliminados por cada jugador en el HUD.
- **Daño a jugadores mid-game:** Corregido — los jugadores que se unen durante la partida ahora reciben daño y pueden morir.
- **Floating damage popups:** Daño numérico flotante al golpear.
- **Combo counter:** "N HITS" sobre el jugador durante combos activos.
- **Milestone burst:** "3 HITS!", "5 HITS!" etc. en el centro de la pantalla.
- **Workflow custom:** Workflow de GitHub Pages con nombre descriptivo ("Desplegar a GitHub Pages").

### v1.0 — Release inicial

- Movimiento 8 direcciones, salto, golpe, super ataque, golpe en aire
- 3 oleadas + boss con 2 fases + modo endless
- Background parallax (3 capas), cambio de escenario (Street → Rooftop)
- Selector de personaje (Punkette / Antagonic / X-ERO)
- Dodge / roll con i-frames
- Sistema de combos (J-J-J)
- HUD completo (vida, wave, boss, fases)
- Power-ups de salud
- High score con localStorage
- Efectos: screen shake, ink splatter, attack arc, walk dust, paper texture
- 2 jugadores locales independientes con mid-game join
- Pausa + pantalla de controles

---

## Licencia

MIT
