export default function GuidePanel({ data, loading }) {
  return (
    <aside className="guide-panel">
      <div className="panel-title">AI Guide</div>

      {loading ? (
        <div className="card">Analyzing...</div>
      ) : (
        <>
          <div className="card">
            <h3>What I see</h3>
            <p>{data.screenSummary || "No analysis yet."}</p>
          </div>

          <div className="card">
            <h3>Task guess</h3>
            <p>{data.taskGuess || "Waiting for your request."}</p>
          </div>

          <div className="card">
            <h3>Next action</h3>
            <p>{data.nextAction || "Send a message to begin."}</p>
          </div>

          <div className="card">
            <h3>Warning</h3>
            <p>{data.warning || "None"}</p>
          </div>
        </>
      )}
    </aside>
  );
}
