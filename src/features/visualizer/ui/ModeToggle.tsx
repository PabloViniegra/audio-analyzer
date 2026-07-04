import type { Key } from '@heroui/react'
import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import type { VisualizerMode } from './useVisualizerLoop'

interface ModeToggleProps {
  mode: VisualizerMode
  onModeChange: (mode: VisualizerMode) => void
}

/**
 * Lets the user switch the Visualizer between Bars mode and Waveform mode.
 * Purely a controlled display-preference control — takes the current mode
 * and reports changes upward, no knowledge of Player or the analyser node.
 */
export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  function handleSelectionChange(keys: Set<Key>) {
    const [next] = keys
    if (next === 'bars' || next === 'waveform') onModeChange(next)
  }

  return (
    <ToggleButtonGroup
      aria-label="Visualizer mode"
      disallowEmptySelection
      selectedKeys={[mode]}
      selectionMode="single"
      onSelectionChange={handleSelectionChange}
    >
      <ToggleButton id="bars">Bars</ToggleButton>
      <ToggleButton id="waveform">
        <ToggleButtonGroup.Separator />
        Waveform
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
