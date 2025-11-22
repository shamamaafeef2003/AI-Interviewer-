import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

class APIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Start a new interview session
  async startInterview(sessionId, studentName = null, projectName = null) {
    try {
      const response = await this.client.post('/interview/start', {
        session_id: sessionId,
        student_name: studentName,
        project_name: projectName,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  }

  // Analyze screen capture
  async analyzeScreen(sessionId, imageBase64, timestamp) {
    try {
      const response = await this.client.post('/screen/analyze', {
        session_id: sessionId,
        image_base64: imageBase64,
        timestamp: timestamp,
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing screen:', error);
      throw error;
    }
  }

  // Transcribe audio
  async transcribeAudio(sessionId, audioBase64, format = 'webm') {
    try {
      const response = await this.client.post('/audio/transcribe', {
        session_id: sessionId,
        audio_base64: audioBase64,
        format: format,
      });
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // Submit student response
  async submitResponse(sessionId, responseText, screenContext = null) {
    try {
      const response = await this.client.post('/interview/respond', {
        session_id: sessionId,
        response_text: responseText,
        screen_context: screenContext,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  // Get interview evaluation
  async evaluateInterview(sessionId) {
    try {
      const response = await this.client.post(`/interview/evaluate/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error evaluating interview:', error);
      throw error;
    }
  }

  // Get interview status
  async getInterviewStatus(sessionId) {
    try {
      const response = await this.client.get(`/interview/status/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting interview status:', error);
      throw error;
    }
  }

  // End interview session
  async endInterview(sessionId) {
    try {
      const response = await this.client.delete(`/interview/end/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error ending interview:', error);
      throw error;
    }
  }
}

export default new APIService();