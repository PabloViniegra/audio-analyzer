# Audio Analyzer

Client-side audio player with a real-time frequency visualizer. Everything runs in the browser against local files — no backend, no streaming.

## Language

**Player**:
The feature owning audio playback — decoding, transport (play/pause/seek/volume/loop), and the Web Audio graph. Holds a single Track at a time; loading a new file replaces the current one.
_Avoid_: Engine, Playlist (out of scope — no queue or multi-file support)

**Visualizer**:
The feature that renders the currently playing Track's audio data to a canvas, in one of two modes. Consumes playback data only — has no transport or playback responsibilities of its own.
_Avoid_: Waveform (that's one mode of the Visualizer, not the concept itself)

**Track**:
The single audio file currently loaded into the Player. Loading a new Track replaces the previous one; there is no queue.
_Avoid_: File, Song, Clip

**Bars mode**:
Visualizer mode showing frequency-domain data (amplitude per frequency bin) as vertical bars.
_Avoid_: Spectrum, Equalizer display (implies audio processing, which this doesn't do)

**Waveform mode**:
Visualizer mode showing time-domain data (raw signal amplitude over time) as a continuous trace.
_Avoid_: Oscilloscope

**Speed**:
Playback rate multiplier for the current Track (0.5x–2x, 0.25x steps), adjusted via the Player's
stepper control. Backed by the native `AudioBufferSourceNode.playbackRate` — changes pitch along
with rate, no time-stretching. Persists across Track loads, same as volume/loop.
_Avoid_: Rate (ambiguous with sample rate), Tempo (implies musical BPM)
