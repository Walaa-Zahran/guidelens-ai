import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function analyzeMessage(message) {
    const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        message
    });

    return response.data;
}

export async function analyzeScreen({ message, imageBase64, mimeType = "image/png" }) {
    const response = await axios.post(`${API_BASE_URL}/api/analyze`, {
        message,
        imageBase64,
        mimeType
    });

    return response.data;
}