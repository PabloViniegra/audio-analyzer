import { Toast } from '@heroui/react'
import { PlayerCard } from './features/player/ui/PlayerCard'

function App() {

  return (
    <>
      <section className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-6">
        <h1 className="text-3xl font-bold">Audio Analyzer</h1>
        <PlayerCard />
      </section>
      <Toast.Provider />
    </>
  )
}

export default App
