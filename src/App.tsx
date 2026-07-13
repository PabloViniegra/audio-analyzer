import { Toast } from "@heroui/react"
import { domAnimation, LazyMotion, MotionConfig } from "framer-motion"
import { CursorRipple } from "./features/cursor/ui/CursorRipple"
import { PlayerCard } from "./features/player/ui/PlayerCard"

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-12 sm:px-8 sm:py-16">
          <header className="grid grid-cols-1 items-end gap-8 sm:grid-cols-[1fr_auto] sm:gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]"
                />
                <p className="eyebrow">Local · Spectrum Inspector · v1</p>
              </div>
              <h1 className="font-display text-[clamp(2.75rem,7vw,4.5rem)] font-black uppercase leading-[0.9] tracking-[0.01em] text-foreground">
                Audio <span className="text-accent">Analyzer</span>
              </h1>
              <p className="max-w-md text-[0.95rem] leading-relaxed text-muted">
                Drop a local track. Watch the spectrum move. Listen with intent.
              </p>
            </div>
            <dl className="plate relative grid grid-cols-2 gap-x-8 gap-y-2.5 self-end rounded-sm px-5 py-4 sm:flex sm:flex-col sm:items-end sm:gap-1.5">
              <span aria-hidden className="rack-screw -top-1.5 -left-1.5" />
              <div className="flex items-baseline gap-3">
                <dt className="eyebrow">Engine</dt>
                <dd className="numeric text-sm text-foreground">Web Audio</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="eyebrow">Sample rate</dt>
                <dd className="numeric text-sm text-foreground">48 kHz</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="eyebrow">FFT</dt>
                <dd className="numeric text-sm text-foreground">128 · 2048</dd>
              </div>
            </dl>
          </header>

          <PlayerCard />

          <footer className="chassis relative mt-auto overflow-hidden rounded-sm">
            <span aria-hidden className="rack-screw top-2.5 left-2.5" />
            <span aria-hidden className="rack-screw top-2.5 right-2.5" />
            <span aria-hidden className="rack-screw bottom-2.5 left-2.5" />
            <span aria-hidden className="rack-screw bottom-2.5 right-2.5" />
            <div className="relative flex items-center justify-between border-b border-border bg-surface-secondary/60 px-5 py-2.5 backdrop-blur-sm">
              <p className="eyebrow">Nameplate · Specs</p>
              <p className="numeric text-[11px] uppercase tracking-[0.16em] text-muted">
                audio · analyzer · v0.1.0
              </p>
            </div>
            <dl className="grid grid-cols-1 divide-y divide-border bg-surface/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex flex-col gap-1.5 px-5 py-4">
                <dt className="eyebrow">Privacy</dt>
                <dd className="text-xs leading-relaxed text-foreground">
                  All processing happens in your browser. Nothing is uploaded,
                  ever.
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 px-5 py-4">
                <dt className="eyebrow">Stack</dt>
                <dd className="numeric text-xs text-foreground">
                  Web Audio · Canvas · React 19 · Vite
                </dd>
              </div>
              <div className="flex flex-col gap-1.5 px-5 py-4">
                <dt className="eyebrow">Build</dt>
                <dd className="numeric flex items-center gap-2 text-xs text-foreground">
                  <span
                    aria-hidden
                    className="inline-block size-1.5 rounded-full bg-signal shadow-[0_0_8px_var(--signal)]"
                  />
                  local · {new Date().getFullYear()}
                </dd>
              </div>
            </dl>
          </footer>

          <Toast.Provider />
        </main>
        <CursorRipple />
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
