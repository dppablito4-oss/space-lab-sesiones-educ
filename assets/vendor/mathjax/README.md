# MathJax local para exportación PDF

- Versión: `mathjax@3.2.2`, distribución `es5/tex-svg.js`.
- Fuente: https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js
- SHA-256: `d4295dc33744836935c1399feece5159577b34c5c8ffb9f1c6324cd82e03a882`.
- Licencia: Apache-2.0, conservada en `LICENSE`.

`backend/pdf_security.py` comprueba el digest antes de ejecutar este recurso
local mediante DevTools. Los scripts del documento están deshabilitados y el
contexto no tiene acceso a la red. No se habilitan `require`, autoload ni HTML
en las expresiones TeX. Una actualización debe cambiar el archivo y el digest,
y pasar las pruebas PDF de seguridad y fórmulas.
