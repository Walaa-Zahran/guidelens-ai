export default function Header() {
  return (
    <header className="header">
      <div>
        <h1>GuideLens AI</h1>
        <p>Screen-aware AI assistant for live guidance</p>
      </div>

      <div className="status-group">
        <span className="badge live">Live</span>
        <span className="badge">Day 1 Build</span>
      </div>
    </header>
  );
}
