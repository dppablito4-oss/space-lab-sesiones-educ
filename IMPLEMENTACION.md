# Implementación de fórmulas matemáticas en Word

## Objetivo

La exportación DOCX conserva el HTML de la sesión y transforma únicamente las
expresiones delimitadas por `$...$`, `$$...$$`, `\(...\)` o `\[...\]`.

La estrategia es híbrida y no cambia el contrato `SessionDocument v1`:

1. **OMML nativo:** fracciones, raíces, potencias, subíndices, operadores,
   flechas y símbolos frecuentes se insertan como ecuaciones editables de Word.
2. **Imagen PNG:** si el conversor OMML no reconoce una expresión, Matplotlib
   MathText la renderiza sobre fondo transparente y se inserta dentro del mismo
   párrafo o centrada si es una fórmula de bloque.
3. **Texto original:** si tampoco puede crearse la imagen, se conserva el LaTeX
   con sus delimitadores. Nunca se elimina silenciosamente una fórmula.

## Flujo

```text
RichContent HTML
  → BeautifulSoup separa párrafos, listas y estilos
  → word_math separa texto y segmentos LaTeX
  → LaTeX compatible → OMML editable
  → LaTeX no compatible → PNG transparente
  → fallo total → texto LaTeX original
```

## Archivos

- `backend/word_math.py`: detección, parser OMML, render PNG y fallback.
- `backend/docx_builder.py`: integra el escritor matemático con el procesador
  común de HTML usado por las exportaciones Word.
- `backend/docx_builder_v1.py`: mantiene el LaTeX hasta la escritura final y
  usa el mismo escritor en campos directos del documento canónico.
- `backend/requirements.txt`: incluye Matplotlib para el fallback gráfico.
- `backend/pablitopyhost.spec`: incluye los módulos requeridos en el `.exe`.
- `tests/test_word_math.py`: valida las tres rutas y un DOCX v1 completo.

## Subconjunto OMML editable

Se convierten de forma nativa:

- `\frac{a}{b}`
- `\sqrt{x}`
- `x^2`, `x^{n+1}`
- `x_1`, `x_{i}`, `x_i^2`
- letras griegas y símbolos como `\pi`, `\theta`, `\Delta`, `\infty`
- relaciones y operadores como `\le`, `\ge`, `\neq`, `\times`, `\cdot`
- flechas como `\Rightarrow`, `\rightarrow`
- sumatoria, producto e integral simples con subíndices y superíndices

Comandos o entornos fuera de este subconjunto pasan automáticamente al render
PNG. No se ejecutan comandos de shell ni compiladores LaTeX.

## Fórmulas inline y de bloque

```html
<p>Calculamos el valor de $x = 8$ dentro del texto.</p>
<p>$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$</p>
```

- La primera ecuación queda en el mismo párrafo.
- La segunda se centra cuando ocupa por sí sola el párrafo.
- Negritas, cursivas, listas, tablas y colores existentes se conservan.

## Seguridad y estabilidad

- Longitud máxima OMML: 4000 caracteres por fórmula.
- No se admiten `\begin`, `\end` ni ejecución de comandos externos en OMML.
- El render de imágenes usa MathText local, sin enviar contenido a internet.
- Las imágenes repetidas se almacenan en una caché limitada de 128 entradas.
- Una falla del render matemático nunca cancela la exportación completa.

## Validación

Ejecutar:

```bash
python tests/test_word_math.py
python tests/test_docx_builder_v1.py
python tests/backend_smoke.py
```

Para entregar el cambio en Windows también debe recompilarse el motor local,
porque tanto `word_math.py` como Matplotlib deben quedar incluidos en el `.exe`.
