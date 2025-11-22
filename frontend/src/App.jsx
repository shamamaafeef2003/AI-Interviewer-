import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import EvaluationScreen from './components/EvaluationScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('setup'); // setup, interview, evaluation
  const [sessionId, setSessionId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [evaluation, setEvaluation] = useState(null);

  const handleStart = (info) => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setStudentInfo(info);
    setCurrentScreen('interview');
  };

  const handleComplete = (evaluationData) => {
    setEvaluation(evaluationData);
    setCurrentScreen('evaluation');
  };

  const handleRestart = () => {
    setSessionId(null);
    setStudentInfo(null);
    setEvaluation(null);
    setCurrentScreen('setup');
  };

  return (
    <div className="App">
      {currentScreen === 'setup' && <SetupScreen onStart={handleStart} />}
      
      {currentScreen === 'interview' && (
        <InterviewScreen
          sessionId={sessionId}
          studentInfo={studentInfo}
          onComplete={handleComplete}
        />
      )}
      
      {currentScreen === 'evaluation' && (
        <EvaluationScreen
          evaluation={evaluation}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;