# Space Lab Interface System

Source of truth for the web application shell. The printable session document keeps its own presentation contract because it must remain compatible with Word and MINEDU output.

## Product Direction

- Product: AI-assisted educational planning workspace.
- Audience: Peruvian teachers preparing, editing, and exporting learning sessions.
- Style: sober document workspace inspired by familiar file-management tools, document-first, compact and operational.
- Brand signal: accessible OneDrive-like blue for primary actions, plus restrained functional accents for workflow recognition.
- Avoid: admin-dashboard composition, nested cards, pure black, decorative gradients, purple AI tropes, excessive glow, and ornamental motion.

## Theme Strategy

- User preference supports `system`, `light`, and `dark`.
- `system` is the default and reacts to `prefers-color-scheme` changes.
- Application chrome follows the selected theme; the printable A4 document remains a white artifact.
- All application colors use semantic tokens. Components must not introduce theme-specific hardcoded colors.

## Semantic Colors — Dark

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-background` | `#111315` | Level 0: editor canvas |
| `--color-card` | `#191B1D` | Level 1: app chrome and navigation |
| `--color-card-surface` | `#202326` | Level 2: contextual panels |
| `--color-elevated` | `#292D31` | Level 3: controls and raised surfaces |
| `--color-popover` | `#303438` | Level 4: hover and overlay surfaces |
| `--color-border` | `#3B3F43` | Standard separation |
| `--color-foreground` | `#F5F5F5` | Primary text |
| `--color-muted-foreground` | `#C8C8C8` | Supporting text |
| `--color-primary` | `#4CA0E0` | Primary CTA and active state |
| `--color-primary-hover` | `#62ABE4` | Primary hover |

## Semantic Colors — Light

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-background` | `#F5F6F8` | Level 0: editor canvas |
| `--color-card` | `#FFFFFF` | Level 1: app chrome and navigation |
| `--color-card-surface` | `#F1F3F5` | Level 2: contextual panels |
| `--color-elevated` | `#FFFFFF` | Level 3: controls and raised surfaces |
| `--color-popover` | `#FFFFFF` | Level 4: hover and overlay surfaces |
| `--color-border` | `#D0D4D9` | Standard separation |
| `--color-foreground` | `#1B1A19` | Primary text |
| `--color-muted-foreground` | `#4F4D4B` | Supporting text |
| `--color-primary` | `#0F6CBD` | Primary CTA and active state |
| `--color-primary-hover` | `#115EA3` | Primary hover |

Normal text must meet 4.5:1 contrast. Interactive boundaries and meaningful icons must meet 3:1.

## Typography

- Interface: Inter.
- Technical metadata and step numbers: JetBrains Mono.
- Base: 14px / 1.5.
- Workspace title: 28px, 700.
- Section title: 14px, 700.
- Field label: 11px, 600.
- Helper text: 11px, 400, never below 10px.
- Letter spacing remains zero except short uppercase metadata labels.

## Spacing And Shape

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48.
- Radius: 4px controls, 6px compact surfaces, 8px panels, 12px overlays only.
- Do not place cards inside cards. Use borders and full-width bands for structural hierarchy.
- Stable control heights: 34px standard, 40px primary CTA.

## Application Layout

- Dual Layout Architecture:
  - Landing View (`#landing-view`): Public onboarding, CNEB 3-step pedagogical flow, hybrid local engine architecture overview, multi-model AI catalog, interactive theme selector, and teacher FAQs.
  - Workspace View (`#app-view`): Primary creation shell for curriculum planning and document compilation.
- Topbar: brand and session context left, save status centered, commands right.
- Creation navigation: permanent 68px icon rail on the left; its labels expand on logo activation or desktop hover.
- Creation panel: temporary contextual drawer that opens from the selected rail item.
- Primary generation action: persistent footer of the inspector.
- Workspace: document/editor receives all width except the compact permanent rail.
- Empty state: full-width Level 1 band with a cyan-tinted introduction surface and four functional color modules.
- The creation drawer is closed by default at every breakpoint and uses a scrim while open.

## States And Motion

- Workflow accents: Copiloto cyan, Datos blue, Propósitos amber, Diseño emerald, Alumnos coral.
- Workspace stages: Prepare amber, Generate blue, Review emerald, Deliver coral. Their filled surfaces must remain visibly distinct from the surrounding shell.
- Active workflow step: tinted surface, colored vector icon, side rail, and explicit `En curso` label.
- Completed step: green status and explicit `Completado` label.
- Pending step: muted label.
- Transitions: 100-180ms for controls and drawer state.
- No layout-shifting hover effects.
- Respect `prefers-reduced-motion` and render final states immediately.

## Accessibility

- All icon-only buttons require an accessible name and tooltip.
- Keyboard arrows, Home, and End navigate the vertical workflow tabs.
- Focus uses a visible 2px cyan outline.
- Status changes use live regions where appropriate.
- Color is never the sole workflow indicator.

## Document Boundary

The application chrome uses this dark system. The A4 session remains a white print artifact. User-selected document colors, fonts, density, and spacing must flow through the shared session JSON so the web preview and Word export render the same presentation settings.
