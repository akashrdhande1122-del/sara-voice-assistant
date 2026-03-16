# Sara Voice Assistant

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Voice assistant named Sara with female voice (Web Speech API)
- Listens to user voice commands via microphone
- Recognizes Hindi/English commands (en-IN language)
- Responds to: hello, time, stop
- Sara speaks responses aloud using TTS with female voice
- Displays conversation log (Sara + user messages)
- Visual listening indicator

### Modify
None

### Remove
None

## Implementation Plan
1. Backend: minimal, no backend logic needed
2. Frontend: single-page app with Web Speech API
   - SpeechRecognition for voice input (en-IN)
   - SpeechSynthesis for voice output (female voice)
   - Conversation log display
   - Mic button to start/stop listening
   - Handle commands: hello, time, stop
