# Ficha · cordura · Tarjeta de cordura (una por investigador)

> Alternativa con clip a las fichas de cordura impresas en 3D (decisión de Jonathan, 24-nov-2026).

**Tipo:** componente (no se baraja) · **Reverso:** el de las cartas de consulta
**Qué hace en el juego:** cada investigador marca su cordura de 10 a 0 con un clip en el borde derecho. Con 4 o menos lo pueden cazar.

## Ya está hecho (no lo hace la IA)

La plantilla se genera con `herramientas/tarjeta_cordura.py`:
- franja «Cordura · nombre»;
- escala del 10 al 0 pegada al borde derecho, con muescas para el clip; «inicio» en 10 y «inicio con 4» en 8;
- del 4 al 0 en guinda con el ícono de cacería;
- leyenda «Con 4 o menos, te pueden cazar.»

Vistas previas con los retratos actuales en `web/plantillas/cordura/`.

## Lo que pide a ChatGPT: el retrato

Un retrato de medio cuerpo por investigador (Inés, Rafael, Tomás, Amalia, Padre Mateo), vertical, que ocupe la zona izquierda (40 × 70 mm, proporción 4:7):
- **Identidad exacta** según [PERSONAJES.md](../PERSONAJES.md), con su objeto propio en la mano.
- **Fondo:** penumbra de la casona, muy oscuro abajo (donde la escala es guinda) y con la luz cálida de su farol o veladora arriba.
- Sin texto, sin marco, sin números.

**Adjuntar:** su retrato de `web/mesa/arte/inv_<nombre>.webp` y, de estilo, `i10` Respirar hondo y `e01` Bajo cero.

**Cómo se revisa:** con la escala puesta, el 4 se distingue de un vistazo y la cara queda arriba del 5.
