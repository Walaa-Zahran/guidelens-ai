function getHighlightClass(positionHint) {
  const allowed = [
    "top-left",
    "top-center",
    "top-right",
    "center-left",
    "center",
    "center-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  return allowed.includes(positionHint) ? positionHint : "center";
}

export default function ScreenStage({
  videoRef,
  isSharing,
  onStartSharing,
  onStopSharing,
  highlight,
}) {
  const highlightClass = getHighlightClass(highlight?.positionHint);
  const shouldShowHighlight = isSharing && highlight?.targetElement;

  return (
    <section className="screen-stage">
      <div className="screen-stage-header">
        <div className="panel-title">Live Screen</div>

        <div className="screen-actions">
          {!isSharing ? (
            <button className="secondary-btn" onClick={onStartSharing}>
              Share Screen
            </button>
          ) : (
            <button className="secondary-btn danger" onClick={onStopSharing}>
              Stop Sharing
            </button>
          )}
        </div>
      </div>

      <div className="screen-video-wrap">
        {!isSharing && (
          <div className="screen-placeholder">
            <span>Screen preview will appear here</span>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`screen-video ${isSharing ? "visible" : "hidden"}`}
        />

        {shouldShowHighlight ? (
          <>
            <div className={`highlight-box ${highlightClass}`}>
              <div className="highlight-pulse" />
            </div>

            <div className={`highlight-label ${highlightClass}`}>
              <span className="highlight-label-title">Focus here</span>
              <span className="highlight-label-text">
                {highlight.targetElement}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="screen-status-strip">
        <div className="screen-status-item">
          <span className="screen-status-dot" />
          {isSharing ? "Screen connected" : "No screen shared"}
        </div>

        <div className="screen-status-item">
          {highlight?.positionHint
            ? `Target area: ${highlight.positionHint}`
            : "Target area: waiting"}
        </div>
      </div>
    </section>
  );
}
