# WARZINE

**v1.1** — Beat 'em up 2D con estética de tinta negra / fotocopia / fanzine punk. Construido con [Kaplay 3001](https://kaplayjs.com/).

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
- **Mid-game join:** Si un jugador no empezó la partida, puede unirse durante el juego presionando su tecla Start (J para P1, 1 para P2) y eligiendo personaje.
- **Pausa:** ESC para pausar, C para ver controles.

### Sistema de revive y continuación

Cuando un jugador cae a **0 HP** y hay un compañero vivo:

1. **Estado "downed":** El jugador cae al suelo con un temporizador de **10 segundos**.
2. **Revivir:** Presionar la tecla Start (J / 1) revive al jugador con **50% de HP** e invulnerabilidad temporal (1.5s).
3. **Vuelve a la acción:** El jugador revivido se reincorpora cerca del centro del escenario.
4. **Timer expira:** Si nadie revive a tiempo, el jugador muere permanentemente. Puede **reingresar** seleccionando un nuevo personaje a través del sistema de join.

> Si solo hay un jugador, no hay oportunidad de revive — cae directamente con muerte permanente y game over.

### Oleadas y enemigos

| Oleada | Enemigos |
|--------|----------|
| **WAVE 1** | 3 Grunts + 1 Punk |
| **WAVE 2** | 2 Grunts + 2 Punks + 1 Tough |
| **WAVE 3** | 3 Grunts + 3 Punks + 2 Toughs |
| **Boss**   | Jefe de 250 HP, 2 fases |

**Modo endless:** Después del boss, las oleadas continúan infinitamente con dificultad creciente.

#### Tipos de enemigos

| Tipo   | HP  | Velocidad | Daño | Notas |
|--------|:---:|:---------:|:----:|-------|
| Grunt  | 30  | 150       | 8    | Básico, rápido |
| Punk   | 55  | 170       | 10   | Mohawk, agresivo |
| Tough  | 90  | 130       | 18   | Alto HP, lento, pegada fuerte |
| Boss   | 250 | 100       | 12-18| 2 fases, 3 patrones de ataque |

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
| Wave / Boss     | Centro superior | "WAVE 1" o "BOSS FIGHT" |
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
| Lenguaje | JavaScript (1 archivo, ~2600 líneas) |
| Sprites | Generados proceduralmente con `rect()` + `outline()` |
| Fondos | Canvas API, parallax de 3 capas (calle / azotea) |
| Texturas | Ruido procedural + papel fotocopia |
| Despliegue | GitHub Pages (auto-deploy con workflow custom) |
| Dependencias | 0 externas |

### Controles técnicos

- **Scenas:** title → select → game → gameover
- **Tags Kaplay:** `char`, `player`, `enemy`, `boss`, `playerHitbox`, `enemyHitbox`
- **Colisiones:** `area()` + chequeo manual en hitboxes enemigas (evita bugs con mid-game join)
- **High score:** `localStorage` ("warzine_high"), mejor wave alcanzada
- **Event bus:** Sistema de eventos interno para comunicación entre subsistemas

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
