import { Toast } from '@heroui/react'
import { PlayerCard } from './features/player/ui/PlayerCard'

function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-12 sm:py-16">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Local · v1</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Audio <span className="text-accent">Analyzer</span>
          </h1>
          <p className="max-w-md text-sm text-muted">
            Drop in a local track. Watch its spectrum. Listen with intent.
          </p>
        </div>
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <span className="eyebrow">Engine</span>
          <span className="numeric text-sm text-foreground">
            Web Audio · 48k
          </span>
        </div>
      </header>

      <PlayerCard />

      <footer className="mt-auto flex flex-col gap-2 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          All processing happens in your browser. Nothing is uploaded.
        </p>
        <p className="numeric">audio · analyzer · 0.1.0</p>
      </footer>

      <Toast.Provider />
    </main>
  )
}

export default App
