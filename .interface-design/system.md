# Interface Design System — Audio Analyzer

## Direction

**Studio instrument.** Calm, focused, technical. The visualizer canvas is the product — it should read as the centerpiece of a single panel, not a side effect of a generic music player.

Aesthetic reference: backlit mastering-grade converters, VU meters, plasma signal displays. One signal accent applied only to live state. Everything else is grayscale structure.

**Reject defaults:**
- Centered single-card layout with stacked sections → replaced with status-bar / instrument-screen / content-pane vertical panel.
- Default Tailwind purple buttons → only the live-playing state, the seek fill, and the play button own the accent color. Everything else is muted.
- `text-muted` / `bg-default` HeroUI utilities work but signal nothing — keep them for chrome (eyebrows, ticks) and let the accent own the action layer.
- Decorative borders and gradients → all accents carry meaning (signal = live; danger = muted; default = idle).

## Palette

| Token | Role | Value |
|---|---|---|
| `--background` | Page ground | `oklch(0.145 0.012 285)` — deep cool-neutral |
| `--surface` | Card / panel | `oklch(0.18 0.014 285)` |
| `--surface-secondary` | Status bar, idle prompts | `oklch(0.22 0.012 285)` |
| `--surface-tertiary` | Hover of secondary | `oklch(0.26 0.012 285)` |
| `--foreground` | Primary text | `oklch(0.965 0.004 286)` |
| `--muted` | Eyebrows, ticks, time labels | `oklch(0.62 0.014 286)` |
| `--border` | Hairlines | `oklch(0.32 0.012 286)` |
| `--accent` | Signal / live state | `oklch(0.72 0.21 295)` — plasma violet |
| `--accent-soft` | Drop-zone hover | accent @ 16% over transparent |
| `--success` | "Live" pill, ready state | `oklch(0.74 0.17 160)` |
| `--danger` | Muted indicator | `oklch(0.68 0.22 25)` |

Page background layers two soft radial gradients (top + bottom-right) of the accent at 14% / 6% over the base — adds atmosphere without decoration.

## Depth

Borders-first on flat surfaces, layered shadows on the instrument panel:

- **Page / cards:** single low-contrast hairline border + the surface-shadow (`surface-shadow` includes inner white inset, deep outer shadow, and a soft accent ring).
- **Instrument screen:** insets darker than the panel with `inset 0 1px 0 rgba(255,255,255,0.06)` and `inset 0 -1px 0 rgba(0,0,0,0.5)`, plus an `inset 0 0 60px -10px` accent glow. Reads as a lit display inside a darker housing.
- **Drop zone:** animates `bg-surface-secondary → bg-surface-tertiary` on hover, plus `border-accent ring-1 ring-accent` when dragging.

Commit to one accent in the entire app. Do not introduce a second.

## Typography

- **Sans:** `"Inter Tight", "Inter", ui-sans-serif, system-ui, …`
- **Mono (numerics + eyebrows):** `ui-monospace, "JetBrains Mono", …`, always with `font-variant-numeric: tabular-nums` and `letter-spacing: -0.01em`.
- **Eyebrow class:** uppercase, `letter-spacing: 0.14em`, 11px, muted.
- **Numeric class:** mono with tabular nums — used for time displays, dB readouts, status text. Mono everywhere a number appears.

Numeric is the app's signature: it makes the visualizer feel like a measurement tool, not a music player.

## Spacing

Base unit: Tailwind's 4px scale (no custom step). Use existing classes:
- Internal canvas margin: `px-5 pt-5 pb-4`
- Between status bar / screen / content: collapse (no gutter) for unified panel feel
- Transport row: `gap-4`
- Vertical sections inside Card.Content: `gap-5`

## Signature element

**The instrument screen** — a dedicated panel inside the player card holding the visualizer, with:
- Left axis: frequency ticks (`60`, `250`, `1k`, `4k`, `16k`)
- Right axis: dB ticks (`0`, `-20`, `-40`, `-60`)
- Canvas sized to `wrapperWidth - 2 × 28px` so the drawing area never collides with the tick labels.
- Pulsing live indicator (top-left of the status bar) — animated `bg-accent` dot with `animate-ping` ring, only while `status === 'playing'`.
- Eyebrow "Spectrum" in the top-left, mode toggle (`ToggleButtonGroup size="sm"`) in the top-right.

## Component patterns

These are the patterns worth reusing across the codebase; not exhaustive.

### HeroUI v3 quirks confirmed

- `ToggleButton.variant` is **only** `"default" | "ghost"` — not the full Button variant set. Don't pass `primary`/`danger`.
- `Slider.formatOptions` accepts `Intl.NumberFormatOptions` — used at the root level, not inside `Slider.Output`.
- `Slider.Output`, `Slider.Track`, `Slider.Fill`, `Slider.Thumb` are compound slots — className on each drives the visual treatment (e.g. `Thumb` is the only place to put shadow / border).
- `Surface.variant` is `"default" | "secondary" | "tertiary" | "transparent"`.
- `Tooltip` wraps the trigger + `<Tooltip.Content showArrow>` as siblings — no separate `Tooltip.Trigger` needed when the trigger is the only direct child.
- `Toast.Provider` must be mounted somewhere persistent (App root) — placement is irrelevant; it portals.
- `Divider` doesn't exist; use `Separator`.
- No `HeroUIProvider` required.

### Visualizer drawing

- One pre-built `createLinearGradient(0, height, 0, 0)` per frame (canvas size changes infrequently; rebuild per frame is fine, ~1µs) — palette from `--accent` step (bottom) to a lighter top stop.
- `shadowBlur` + `shadowColor` on the canvas context for a glow effect. Reset both to 0 at the end of the draw to avoid leaking state into next frame.
- The draw functions test-contract: emit one primitive per data bin, even when amplitude is 0. Don't skip empty bins inside the draw loop.

### Status pill

A pulsing `bg-accent` dot with `animate-ping` overlay signals playback. Apply only when `status === 'playing'`, not while merely "ready". Keeps the affordance trustworthy — pulse = something is happening right now.

### Drop zone

`Surface variant="transparent"` with a conditional class on `isDraggingOver`. The base state uses `bg-surface-secondary hover:bg-surface-tertiary`; the active state adds `border-accent bg-accent-soft ring-1 ring-accent`. Avoid changing the variant prop mid-drag — class-based overrides stay composable.

### Mono time displays

Pair every `Slider.Output` with a `numeric text-xs text-muted` class. Seek bar uses the Output slot to show `current / total`. Volume slider uses it for `dB` (or `−∞ dB` when muted). Timecode is the app's language; consistency matters.

## What NOT to do

- Don't widen `--accent` usage beyond live state, primary action, and signal-aware controls (seek fill, play button, drop-zone active, mode-toggle selected). It's a signal color, not a brand color.
- Don't introduce a separate warning/info semantic — HeroUI's `warning` and `success` are reserved for actual status (muted, ready). Use `--muted` chrome instead.
- Don't dark-mode-toggle from the user. The app is dark-by-default and the choice made at session start.
- Don't redesign the page bg between sessions — the radial-gradient backdrop is the visual signature.
