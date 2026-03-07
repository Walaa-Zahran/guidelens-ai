import { useState } from "react";
import Header from "./components/Header";
import ScreenStage from "./components/ScreenStage";
import GuidePanel from "./components/GuidePanel";
import { analyzeMessage } from "./api";
import "./styles.css";

const initialGuideData = {
  screenSummary: "",
  taskGuess: "",
  nextAction: "",
  warning: "",
};

export default function App() {
  const [message, setMessage] = useState(
    "Help me fix a React form that is not submitting.",
  );
  const [guideData, setGuideData] = useState(initialGuideData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await analyzeMessage(message);

      if (response.ok) {
        setGuideData(response.result);
      } else {
        setError("The backend returned an error.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="main-layout">
        <ScreenStage />
        <GuidePanel data={guideData} loading={loading} />
      </main>

      <section className="composer">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your current task..."
        />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </section>

      {error && <div className="error-box">{error}</div>}
    </div>
  );
}
