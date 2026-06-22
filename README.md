# WARZINE

Beat 'em up 2D con estética de tinta negra / fotocopia / fanzine punk. Construido con [Kaplay](https://kaplayjs.com/).

**Jugar ahora:** https://superdandi.github.io/warzine/

---

## Controles

| Acción      | Player 1  | Player 2  |
|-------------|-----------|-----------|
| Movimiento  | WASD      | Flechas   |
| Golpe       | J         | 1         |
| Patada      | K         | 2         |

**Combo:** J → J → K (3er golpe potenciado, escala el daño por combo).

---

## Características

- **3 oleadas** de enemigos (grunts, punks, toughs) con dificultad creciente
- **Boss final** con 2 fases (se enfurece al 50% HP) y 3 patrones de ataque (golpe pesado, ground slam, charge)
- **2 jugadores locales** en el mismo teclado
- **Sistema de combos** — golpes consecutivos aumentan daño y knockback
- **HUD** — barras de vida, indicador de oleada, barra de boss
- **Efectos** — screen shake, partículas de impacto, flashes, muerte con rotación

---

## Personajes

| Personaje  | Tipo        | Notas                          |
|------------|-------------|---------------------------------|
| Punkette   | Player 1    | Spikes en cabeza                |
| Antagonic  | Player 2    | Máscara antigás                 |
| X-ERO      | (oculto)    | Visor de cyborg, sin implementar aún |
| Grunt      | Enemigo     | Bajo HP, rápido                 |
| Punk       | Enemigo     | Mohawk, medio                   |
| Tough      | Enemigo     | Alto HP, lento, daño alto       |
| Boss       | Boss final  | 250 HP, cuernos, 2 fases        |

---

## Técnico

- **Motor:** Kaplay 3001.0.19 (CDN)
- **Dependencias:** 0 externas (todo es Canvas API + Kaplay)
- **Sprites:** Generados proceduralmente con rectángulos + outlines (estilo ink-on-paper)
- **Texturas:** Paper texture generada por ruido procedural + background de calle con edificios
- **Archivos:** 1 archivo HTML + 1 archivo JS (~1470 líneas)

---

## Desarrollo

```
git clone https://github.com/superdandi/warzine.git
cd warzine
# Servir localmente:
python3 -m http.server 8080
# Abrir http://localhost:8080
```

---

## Licencia

MIT
