import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Monitor, Send, Loader, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import mediaCapture from '../services/mediaCapture';

const InterviewScreen = ({ sessionId, studentInfo, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [responseText, setResponseText] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenCaptureActive, setScreenCaptureActive] = useState(false);
  const [lastScreenText, setLastScreenText] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [status, setStatus] = useState('');
  
  const screenCaptureInterval = useRef(null);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    initializeInterview();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeInterview = async () => {
    try {
      setStatus('Starting interview...');
      const result = await api.startInterview(
        sessionId,
        studentInfo.studentName,
        studentInfo.projectName
      );

      if (result.success) {
        setCurrentQuestion(result.question);
        setQuestionNumber(1);
        setConversation([
          {
            type: 'question',
            content: result.question,
            timestamp: new Date().toISOString(),
          },
        ]);
        setStatus('Interview started! Please share your screen and start presenting.');
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      setStatus('Error starting interview. Please try again.');
    }
  };

  const startScreenShare = async () => {
    const result = await mediaCapture.startScreenCapture();
    if (result.success) {
      setScreenCaptureActive(true);
      setStatus('Screen sharing active');
      startPeriodicScreenCapture();
    } else {
      setStatus('Failed to start screen sharing: ' + result.error);
    }
  };

  const startPeriodicScreenCapture = () => {
    // Capture screen every 5 seconds
    screenCaptureInterval.current = setInterval(async () => {
      try {
        const screenshot = await mediaCapture.captureScreenshot();
        if (screenshot.success) {
          const analysis = await api.analyzeScreen(
            sessionId,
            screenshot.imageBase64,
            screenshot.timestamp
          );
          
          if (analysis.success && analysis.ocr.text) {
            setLastScreenText(analysis.ocr.text);
          }
        }
      } catch (error) {
        console.error('Error during screen capture:', error);
      }
    }, 5000);
  };

  const startRecording = async () => {
    const result = await mediaCapture.startAudioRecording();
    if (result.success) {
      setIsRecording(true);
      setIsSpeaking(true);
      setStatus('Recording your response...');
    } else {
      setStatus('Failed to start recording: ' + result.error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsSpeaking(false);
      setIsProcessing(true);
      setStatus('Processing your response...');

      const audioResult = await mediaCapture.stopAudioRecording();
      
      if (audioResult.success) {
        const transcription = await api.transcribeAudio(
          sessionId,
          audioResult.audioBase64,
          audioResult.format
        );

        if (transcription.success && transcription.transcription.text) {
          setResponseText(transcription.transcription.text);
          setStatus('Transcription complete. Click Submit to continue.');
        } else {
          setStatus('Failed to transcribe audio. Please type your response.');
        }
      }

      setIsRecording(false);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
      setStatus('Error processing audio. Please type your response.');
    }
  };

  const submitResponse = async () => {
    if (!responseText.trim()) {
      setStatus('Please provide a response');
      return;
    }

    setIsProcessing(true);
    setStatus('Generating next question...');

    try {
      // Add response to conversation
      setConversation(prev => [
        ...prev,
        {
          type: 'response',
          content: responseText,
          timestamp: new Date().toISOString(),
        },
      ]);

      const result = await api.submitResponse(
        sessionId,
        responseText,
        lastScreenText
      );

      if (result.success) {
        if (result.should_end) {
          setStatus('Interview complete! Generating evaluation...');
          setTimeout(() => {
            completeInterview();
          }, 1000);
        } else {
          setCurrentQuestion(result.question);
          setQuestionNumber(result.question_number);
          setConversation(prev => [
            ...prev,
            {
              type: 'question',
              content: result.question,
              timestamp: new Date().toISOString(),
            },
          ]);
          setResponseText('');
          setStatus(`Question ${result.question_number} asked`);
        }
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      setStatus('Error submitting response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeInterview = async () => {
    try {
      const evaluation = await api.evaluateInterview(sessionId);
      if (evaluation.success) {
        cleanup();
        onComplete(evaluation);
      }
    } catch (error) {
      console.error('Error getting evaluation:', error);
      setStatus('Error completing interview');
    }
  };

  const cleanup = () => {
    if (screenCaptureInterval.current) {
      clearInterval(screenCaptureInterval.current);
    }
    mediaCapture.stopAllCapture();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <h2 style={styles.studentName}>{studentInfo.studentName}</h2>
          <p style={styles.projectName}>{studentInfo.projectName}</p>
        </div>
        <div style={styles.questionCounter}>
          Question {questionNumber}
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.conversationPanel}>
          <h3 style={styles.panelTitle}>Interview Conversation</h3>
          <div style={styles.conversationList}>
            {conversation.map((item, index) => (
              <div
                key={index}
                style={{
                  ...styles.conversationItem,
                  ...(item.type === 'question' ? styles.questionItem : styles.responseItem),
                }}
              >
                <div style={styles.itemLabel}>
                  {item.type === 'question' ? '🤖 AI Interviewer' : '👤 You'}
                </div>
                <div style={styles.itemContent}>{item.content}</div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>

        <div style={styles.controlPanel}>
          <div style={styles.statusBar}>
            <div style={styles.statusItem}>
              <Monitor size={16} />
              <span>
                {screenCaptureActive ? (
                  <><CheckCircle size={14} color="#48bb78" /> Screen Active</>
                ) : (
                  <><XCircle size={14} color="#f56565" /> Screen Inactive</>
                )}
              </span>
            </div>
            {lastScreenText && (
              <div style={styles.statusItem}>
                <Eye size={16} />
                <span>Analyzing screen content</span>
              </div>
            )}
          </div>

          {!screenCaptureActive && (
            <button onClick={startScreenShare} style={styles.screenButton}>
              <Monitor size={20} />
              Start Screen Share
            </button>
          )}

          <div style={styles.currentQuestion}>
            <div style={styles.questionLabel}>Current Question:</div>
            <p style={styles.questionText}>{currentQuestion}</p>
          </div>

          <div style={styles.responseArea}>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Type your response here or record audio..."
              style={styles.textarea}
              disabled={isProcessing}
            />

            <div style={styles.controlButtons}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={styles.micButton}
                  disabled={isProcessing}
                >
                  <Mic size={20} />
                  Record Answer
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{ ...styles.micButton, ...styles.recordingButton }}
                  className="pulse"
                >
                  <MicOff size={20} />
                  Stop Recording
                </button>
              )}

              <button
                onClick={submitResponse}
                style={styles.submitButton}
                disabled={isProcessing || !responseText.trim()}
              >
                {isProcessing ? (
                  <><Loader size={20} className="spin" /> Processing...</>
                ) : (
                  <><Send size={20} /> Submit Response</>
                )}
              </button>
            </div>
          </div>

          <div style={styles.statusMessage}>{status}</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  header: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  headerInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
  },
  projectName: {
    fontSize: '16px',
    color: '#718096',
    margin: '5px 0 0 0',
  },
  questionCounter: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '20px',
    fontWeight: '600',
    fontSize: '14px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    minHeight: 'calc(100vh - 140px)',
  },
  conversationPanel: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  conversationItem: {
    padding: '15px',
    borderRadius: '8px',
    animation: 'fadeIn 0.3s ease-out',
  },
  questionItem: {
    background: '#edf2f7',
    borderLeft: '4px solid #667eea',
  },
  responseItem: {
    background: '#e6fffa',
    borderLeft: '4px solid #38b2ac',
  },
  itemLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '8px',
  },
  itemContent: {
    fontSize: '14px',
    color: '#2d3748',
    lineHeight: '1.6',
  },
  controlPanel: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statusBar: {
    display: 'flex',
    gap: '15px',
    padding: '10px',
    background: '#f7fafc',
    borderRadius: '8px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4a5568',
  },
  screenButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    background: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  currentQuestion: {
    padding: '15px',
    background: '#f7fafc',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
  },
  questionLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#718096',
    marginBottom: '8px',
  },
  questionText: {
    fontSize: '16px',
    color: '#2d3748',
    margin: 0,
    lineHeight: '1.6',
  },
  responseArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flex: 1,
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
  },
  controlButtons: {
    display: 'flex',
    gap: '10px',
  },
  micButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
  },
  recordingButton: {
    background: '#f56565',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    flex: 1,
  },
  statusMessage: {
    fontSize: '14px',
    color: '#718096',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

// Add CSS for spin animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .spin {
      animation: spin 1s linear infinite;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    textarea:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    @media (max-width: 768px) {
      .mainContent {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default InterviewScreen;