import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import ScreenStage from "./components/ScreenStage";
import GuidePanel from "./components/GuidePanel";
import VoiceControls from "./components/VoiceControls";
import { analyzeMessage, analyzeScreen } from "./api";
import "./styles.css";

const initialGuideData = {
  screenSummary: "",
  taskGuess: "",
  nextAction: "",
  warning: "",
};

export default function App() {
  const [message, setMessage] = useState(
    "Help me understand what is on this screen and what I should do next.",
  );
  const [guideData, setGuideData] = useState(initialGuideData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speakingEnabled, setSpeakingEnabled] = useState(true);
  const transcriptRef = useRef("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleAnalyzeTextOnly = async (customMessage) => {
    try {
      setLoading(true);
      setError("");

      const finalMessage = customMessage || message;
      const response = await analyzeMessage(finalMessage);

      if (response.ok) {
        setGuideData(response.result);

        if (speakingEnabled) {
          speakGuideResponse(response.result);
        }
      } else {
        setError("The backend returned an error.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSharing = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
      }

      const [track] = stream.getVideoTracks();

      if (track) {
        track.onended = () => {
          handleStopSharing();
        };
      }

      setIsSharing(true);
    } catch (err) {
      setError(err.message || "Failed to start screen sharing.");
    }
  };

  const handleStopSharing = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsSharing(false);
  };

  const captureFrameAsBase64 = () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error("Screen video is not ready yet.");
    }

    const canvas = document.createElement("canvas");
    const maxWidth = 1280;

    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.floor(video.videoWidth * scale);
    canvas.height = Math.floor(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.split(",")[1];
  };

  const speakText = (text) => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const buildSpeechText = (data) => {
    const parts = [
      data.screenSummary ? `I see: ${data.screenSummary}` : "",
      data.nextAction ? `Next action: ${data.nextAction}` : "",
      data.warning ? `Warning: ${data.warning}` : "",
    ].filter(Boolean);

    return parts.join(". ");
  };

  const speakGuideResponse = (data) => {
    const text = buildSpeechText(data);
    speakText(text);
  };

  const handleSpeakLastResponse = () => {
    speakGuideResponse(guideData);
  };

  const handleAnalyzeScreen = async (customMessage) => {
    try {
      setLoading(true);
      setError("");

      const finalMessage = customMessage || message;

      if (!isSharing) {
        throw new Error("Start screen sharing first.");
      }

      const imageBase64 = captureFrameAsBase64();

      const response = await analyzeScreen({
        message: finalMessage,
        imageBase64,
        mimeType: "image/png",
      });

      if (response.ok) {
        setGuideData(response.result);

        if (speakingEnabled) {
          speakGuideResponse(response.result);
        }
      } else {
        setError("The backend returned an error.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Screen analysis failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      setError("");
      setTranscript("");
      transcriptRef.current = "";
      window.speechSynthesis?.cancel();

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i += 1) {
          finalTranscript += event.results[i][0].transcript + " ";
        }

        finalTranscript = finalTranscript.trim();
        transcriptRef.current = finalTranscript;
        setTranscript(finalTranscript);
        setMessage(finalTranscript);
      };

      recognition.onerror = (event) => {
        setError(event.error || "Speech recognition failed.");
        setIsListening(false);
      };

      recognition.onend = async () => {
        setIsListening(false);

        const finalTranscript = transcriptRef.current.trim() || message.trim();
        if (!finalTranscript) return;

        if (isSharing) {
          await handleAnalyzeScreen(finalTranscript);
        } else {
          await handleAnalyzeTextOnly(finalTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError(err.message || "Unable to start speech recognition.");
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="app-shell">
      <Header />

      <main className="main-layout">
        <ScreenStage
          videoRef={videoRef}
          isSharing={isSharing}
          onStartSharing={handleStartSharing}
          onStopSharing={handleStopSharing}
        />
        <GuidePanel data={guideData} loading={loading} />
      </main>

      <VoiceControls
        isListening={isListening}
        transcript={transcript}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        onSpeakLastResponse={handleSpeakLastResponse}
        speakingEnabled={speakingEnabled}
        setSpeakingEnabled={setSpeakingEnabled}
      />

      <section className="composer">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your current task..."
        />

        <button onClick={() => handleAnalyzeTextOnly()} disabled={loading}>
          Text Only
        </button>

        <button onClick={() => handleAnalyzeScreen()} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Screen"}
        </button>
      </section>

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
