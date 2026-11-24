# Tirajes

Una carpeta por lote de producción. La crea la skill `fabrica-cartas-animas` con `ficha.py --lote <lote> <ids…> --escribir`.

```
tirajes/<lote>/
  encargo.json   cartas del lote, modo (arte o montaje) y cartas que quedan fuera del tiraje
  <id>.md        ficha completa de cada carta: es la que se pega en ChatGPT con sus imágenes
```

Las fichas se generan una vez y después se completan a mano. El script no las sobrescribe. Para saber en qué va un lote:

```
python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py estado <lote>
```

Instrucciones completas: [`.agents/skills/fabrica-cartas-animas/SKILL.md`](../../.agents/skills/fabrica-cartas-animas/SKILL.md).
