import { useEffect, useRef } from "react";

export default function ScreenStage({
  videoRef,
  isSharing,
  onStartSharing,
  onStopSharing,
}) {
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
      </div>
    </section>
  );
}
