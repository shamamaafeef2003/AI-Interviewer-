import React, { useState } from 'react';
import { User, Briefcase, Play, AlertCircle } from 'lucide-react';

const SetupScreen = ({ onStart }) => {
  const [studentName, setStudentName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleStart = () => {
    if (!studentName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!projectName.trim()) {
      setError('Please enter your project name');
      return;
    }

    onStart({
      studentName: studentName.trim(),
      projectName: projectName.trim(),
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI Interviewer</h1>
          <p style={styles.subtitle}>
            Present your project and let AI conduct an adaptive technical interview
          </p>
        </div>

        <div style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <User size={20} style={styles.icon} />
              Your Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Briefcase size={20} style={styles.icon} />
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError('');
              }}
              placeholder="Enter your project name"
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleStart} style={styles.startButton}>
            <Play size={20} />
            Start Interview
          </button>
        </div>

        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>What to expect:</h3>
          <ul style={styles.instructionsList}>
            <li>Share your screen to show your project</li>
            <li>AI will analyze your screen and listen to your presentation</li>
            <li>Answer questions about your project in real-time</li>
            <li>Receive detailed feedback and evaluation at the end</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '100%',
    padding: '40px',
    animation: 'fadeIn 0.5s ease-out',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#718096',
    lineHeight: '1.6',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    color: '#667eea',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: '#fff5f5',
    border: '1px solid #fc8181',
    borderRadius: '8px',
    color: '#c53030',
    fontSize: '14px',
  },
  startButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '10px',
  },
  instructions: {
    background: '#f7fafc',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  instructionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '12px',
  },
  instructionsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
};

// Add hover effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input:focus {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    button:active {
      transform: translateY(0);
    }
    ul li {
      padding-left: 20px;
      position: relative;
      color: #4a5568;
      font-size: 14px;
      line-height: 1.6;
    }
    ul li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
}

export default SetupScreen;