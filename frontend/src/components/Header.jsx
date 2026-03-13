export default function Header() {
  return (
    <header className="header">
      <div>
        <h1>GuideLens AI</h1>
        <p>Screen-aware AI assistant for live guidance</p>
      </div>

      <div className="status-group">
        <span className="badge live">Live Agent Mode</span>
        <span className="badge success">Screen Ready</span>
        <span className="badge">Gemini Vision</span>
        <span className="badge">Voice Enabled</span>
      </div>
    </header>
  );
}
