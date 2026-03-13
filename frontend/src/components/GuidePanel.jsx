function StepItem({ step, index }) {
  return (
    <div className={`step-item ${step.status}`}>
      <div className="step-badge">
        {step.status === "done" ? "✓" : index + 1}
      </div>

      <div className="step-content">
        <div className="step-label">
          {step.status === "current"
            ? "Current step"
            : step.status === "done"
              ? "Completed"
              : "Upcoming"}
        </div>
        <div className="step-title">{step.title}</div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }) {
  const normalized = (value || "Medium").toLowerCase();
  return (
    <span className={`confidence-badge ${normalized}`}>
      {value || "Medium"} confidence
    </span>
  );
}

export default function GuidePanel({ data, loading }) {
  const steps = Array.isArray(data.steps) ? data.steps : [];

  return (
    <aside className="guide-panel">
      <div className="guide-panel-top">
        <div>
          <div className="panel-title">AI Guide</div>
          <h2 className="guide-heading">Live task guidance</h2>
        </div>

        <ConfidenceBadge value={data.confidence} />
      </div>

      {loading ? (
        <div className="card">Analyzing...</div>
      ) : (
        <>
          <div className="guide-summary-card">
            <div className="guide-summary-label">Current task</div>
            <div className="guide-summary-value">
              {data.taskGuess || "Waiting for a task..."}
            </div>
          </div>

          <div className="card">
            <h3>Guided steps</h3>
            <div className="steps-list">
              {steps.length ? (
                steps.map((step, index) => (
                  <StepItem
                    key={`${step.title}-${index}`}
                    step={step}
                    index={index}
                  />
                ))
              ) : (
                <p>No steps available yet.</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3>What I see</h3>
            <p>{data.screenSummary || "No analysis yet."}</p>
          </div>

          <div className="card highlight-card">
            <h3>Next action</h3>
            <p>{data.nextAction || "Send a message or use voice to begin."}</p>
          </div>

          <div className="card warning-card">
            <h3>Warning</h3>
            <p>{data.warning || "No important warning detected."}</p>
          </div>
        </>
      )}
    </aside>
  );
}
