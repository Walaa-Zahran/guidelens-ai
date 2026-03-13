import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function analyzeMessage(message, sessionId) {
  const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
    message,
    sessionId
  });

  return response.data;
}

export async function analyzeScreen({
  message,
  imageBase64,
  mimeType = "image/png",
  sessionId
}) {
  const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
    message,
    imageBase64,
    mimeType,
    sessionId
  });

  return response.data;
}

export async function resetSession(sessionId) {
  const response = await axios.post(`${API_BASE_URL}/api/analyze/reset-session`, {
    sessionId
  });

  return response.data;
}