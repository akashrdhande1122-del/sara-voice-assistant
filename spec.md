# Sara Voice Assistant

## Current State
Sara is a HUD-style voice assistant React app with:
- Aura AI HUD Interface (spinning rings, scanline, dot grid, clock)
- Web Speech API for voice recognition (en-IN) and TTS (female voice)
- Commands: hello, time, date, joke, weather, alarm, naam, family, kaun hoon, stop
- Personalized for Akash Dhande
- Chat history memory
- SCAN / AI VOICE / LOGS buttons
- Sara avatar image overlay on ring
- PWA manifest + service worker

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Full clean rebuild of Sara with all existing features intact
- Ensure Android mobile layout works correctly (no overflow clipping, proper scroll)
- Ensure the HUD animations are all preserved

### Remove
- Nothing

## Implementation Plan
1. Rebuild App.tsx with full Sara logic, HUD layout, all voice commands
2. Ensure index.css has all HUD custom styles + Tailwind config
3. Ensure manifest.json and index.html are correct for PWA
4. Ensure useSpeech.ts hook is clean and correct
