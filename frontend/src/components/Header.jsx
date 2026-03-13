export default function Header({ sessionId, sessionMeta, onResetSession }) {
  const confidence = sessionMeta?.confidence || "Medium";
  const currentTask = sessionMeta?.currentTask || "No active task yet";

  return (
    <header className="header">
      <div>
        <h1>GuideLens AI</h1>
        <p>Screen-aware AI assistant for live guidance</p>

        <div className="session-meta">
          <span className="session-chip">Session: {sessionId.slice(0, 8)}</span>
          <span className="session-chip">Memory: active</span>
          <span className="session-chip">{confidence} confidence</span>
        </div>

        <div className="session-task-line">
          <strong>Current task:</strong> {currentTask}
        </div>
      </div>

      <div className="status-group">
        <span className="badge live">Live Agent Mode</span>
        <span className="badge success">Memory Enabled</span>
        <span className="badge">Gemini Vision</span>
        <span className="badge">Voice Enabled</span>
        <button className="header-reset-btn" onClick={onResetSession}>
          Reset Session
        </button>
      </div>
    </header>
  );
}
