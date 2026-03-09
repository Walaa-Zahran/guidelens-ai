export default function VoiceControls({
  isListening,
  transcript,
  onStartListening,
  onStopListening,
  onSpeakLastResponse,
  speakingEnabled,
  setSpeakingEnabled,
}) {
  return (
    <div className="voice-controls panel-top">
      <div className="voice-controls-left">
        {!isListening ? (
          <button className="voice-btn" onClick={onStartListening}>
            Start Voice
          </button>
        ) : (
          <button className="voice-btn active" onClick={onStopListening}>
            Stop Listening
          </button>
        )}

        <button className="secondary-btn" onClick={onSpeakLastResponse}>
          Speak Last Response
        </button>
      </div>

      <div className="voice-controls-right">
        <label className="toggle-wrap">
          <input
            type="checkbox"
            checked={speakingEnabled}
            onChange={(e) => setSpeakingEnabled(e.target.checked)}
          />
          <span>Auto speak responses</span>
        </label>
      </div>

      <div className="transcript-box">
        <div className="panel-title">Voice Transcript</div>
        <p>{transcript || "No voice input yet."}</p>
      </div>
    </div>
  );
}
