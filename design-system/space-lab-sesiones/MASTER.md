# Space Lab Interface System

Source of truth for the web application shell. The printable session document keeps its own presentation contract because it must remain compatible with Word and MINEDU output.

## Product Direction

- Product: AI-assisted educational planning workspace.
- Audience: Peruvian teachers preparing, editing, and exporting learning sessions.
- Style: premium graphite workspace, document-first, compact and operational.
- Brand signal: electric cyan used for primary actions, focus, active state, and small indicators.
- Avoid: admin-dashboard composition, nested cards, pure black, decorative gradients, purple AI tropes, excessive glow, and ornamental motion.

## Semantic Colors

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-background` | `#090C11` | Level 0: editor canvas |
| `--color-card` | `#121821` | Level 1: app chrome and navigation |
| `--color-card-surface` | `#19222D` | Level 2: contextual panels |
| `--color-elevated` | `#222E3A` | Level 3: controls and raised surfaces |
| `--color-popover` | `#2B3947` | Level 4: hover and overlay surfaces |
| `--color-border` | `#2E3A47` | Standard separation |
| `--color-foreground` | `#F4F4F6` | Primary text |
| `--color-muted-foreground` | `#B2BBC8` | Supporting text |
| `--color-subtle-foreground` | `#758192` | Metadata and pending states |
| `--color-primary` | `#2CC8EE` | Primary CTA and active state |
| `--color-primary-hover` | `#54D4F3` | Primary hover |
| `--color-success` | `#22C55E` | Completed and connected |
| `--color-warning` | `#F59E0B` | Attention |
| `--color-destructive` | `#EF4444` | Destructive action |

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

- Topbar: brand and session context left, save status centered, commands right.
- Creation panel: temporary drawer with numbered workflow rail plus contextual inspector.
- Primary generation action: persistent footer of the inspector.
- Workspace: document/editor always receives the full available width.
- Empty state: unframed two-column orientation, not a floating dashboard card.
- The creation drawer is closed by default at every breakpoint and uses a scrim while open.

## States And Motion

- Active workflow step: cyan rail and explicit `En curso` label.
- Completed step: green number and explicit `Completado` label.
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
