import { Toast } from "@heroui/react"
import { domAnimation, LazyMotion, MotionConfig } from "framer-motion"
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
              <h1 className="text-[clamp(2.25rem,5vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground">
                Audio <span className="text-accent">Analyzer</span>
              </h1>
              <p className="max-w-md text-[0.95rem] leading-relaxed text-muted">
                Drop a local track. Watch the spectrum move. Listen with intent.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 self-end sm:flex sm:flex-col sm:items-end sm:gap-1">
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

          <footer className="mt-auto flex flex-col gap-3 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              All processing happens in your browser. Nothing is uploaded, ever.
            </p>
            <p className="numeric flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block size-1 rounded-full bg-muted-foreground/60"
              />
              <span>audio · analyzer · 0.1.0</span>
            </p>
          </footer>

          <Toast.Provider />
        </main>
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
