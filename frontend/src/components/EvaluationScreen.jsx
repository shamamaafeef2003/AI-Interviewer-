import React from 'react';
import { Award, TrendingUp, TrendingDown, Download, RotateCcw, CheckCircle } from 'lucide-react';

const EvaluationScreen = ({ evaluation, onRestart }) => {
  const { evaluation: evalData } = evaluation;

  const downloadReport = () => {
    const reportText = evaluation.report || 'No report available';
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-evaluation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#ecc94b';
    return '#f56565';
  };

  const getGradeEmoji = (grade) => {
    const emojiMap = {
      'A': '🌟',
      'B': '✨',
      'C': '👍',
      'D': '📚',
      'F': '💪',
    };
    return emojiMap[grade] || '📊';
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header with Overall Score */}
        <div style={styles.header}>
          <div style={styles.scoreCircle}>
            <div style={styles.scoreValue}>{evalData.overall_score}</div>
            <div style={styles.scoreLabel}>Overall Score</div>
          </div>
          <div style={styles.gradeSection}>
            <div style={styles.gradeEmoji}>{getGradeEmoji(evalData.grade)}</div>
            <div style={styles.grade}>Grade: {evalData.grade}</div>
          </div>
        </div>

        {/* Summary Section */}
        <div style={styles.summaryCard}>
          <h3 style={styles.sectionTitle}>
            <Award size={20} /> Summary
          </h3>
          <p style={styles.summaryText}>{evalData.summary}</p>
        </div>

        {/* Detailed Scores */}
        <div style={styles.scoresGrid}>
          {Object.entries(evalData.criteria_scores || {}).map(([key, data]) => (
            <div key={key} style={styles.criteriaCard}>
              <div style={styles.criteriaHeader}>
                <h4 style={styles.criteriaTitle}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h4>
                <div
                  style={{
                    ...styles.criteriaScore,
                    color: getScoreColor(data.score),
                  }}
                >
                  {data.score}/100
                </div>
              </div>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${data.score}%`,
                    background: getScoreColor(data.score),
                  }}
                />
              </div>

              <p style={styles.criteriaFeedback}>{data.feedback}</p>

              {data.strengths && data.strengths.length > 0 && (
                <div style={styles.listSection}>
                  <div style={styles.listTitle}>
                    <TrendingUp size={16} color="#48bb78" /> Strengths
                  </div>
                  <ul style={styles.list}>
                    {data.strengths.map((item, idx) => (
                      <li key={idx} style={styles.listItem}>
                        <CheckCircle size={14} color="#48bb78" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.weaknesses && data.weaknesses.length > 0 && (
                <div style={styles.listSection}>
                  <div style={styles.listTitle}>
                    <TrendingDown size={16} color="#f56565" /> Areas for Improvement
                  </div>
                  <ul style={styles.list}>
                    {data.weaknesses.map((item, idx) => (
                      <li key={idx} style={styles.listItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed Feedback */}
        <div style={styles.feedbackCard}>
          <h3 style={styles.sectionTitle}>📝 Detailed Feedback</h3>
          <p style={styles.feedbackText}>{evalData.detailed_feedback}</p>
        </div>

        {/* Recommendations */}
        {evalData.recommendations && evalData.recommendations.length > 0 && (
          <div style={styles.recommendationsCard}>
            <h3 style={styles.sectionTitle}>🎯 Recommendations</h3>
            <ol style={styles.recommendationsList}>
              {evalData.recommendations.map((rec, idx) => (
                <li key={idx} style={styles.recommendationItem}>
                  {rec}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Notable Moments */}
        {evalData.notable_moments && evalData.notable_moments.length > 0 && (
          <div style={styles.notableCard}>
            <h3 style={styles.sectionTitle}>⭐ Notable Moments</h3>
            <ul style={styles.notableList}>
              {evalData.notable_moments.map((moment, idx) => (
                <li key={idx} style={styles.notableItem}>
                  {moment}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button onClick={downloadReport} style={styles.downloadButton}>
            <Download size={20} />
            Download Full Report
          </button>
          <button onClick={onRestart} style={styles.restartButton}>
            <RotateCcw size={20} />
            Start New Interview
          </button>
        </div>

        {/* Metadata */}
        <div style={styles.metadata}>
          Interview Date: {new Date(evalData.timestamp).toLocaleString()} | 
          Questions Asked: {evalData.interview_length}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    animation: 'fadeIn 0.5s ease-out',
  },
  scoreCircle: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: '14px',
    marginTop: '5px',
    opacity: 0.9,
  },
  gradeSection: {
    textAlign: 'center',
  },
  gradeEmoji: {
    fontSize: '64px',
    marginBottom: '10px',
  },
  grade: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
  },
  summaryCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  summaryText: {
    fontSize: '16px',
    color: '#4a5568',
    lineHeight: '1.8',
  },
  scoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  criteriaCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  criteriaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  criteriaTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
  },
  criteriaScore: {
    fontSize: '20px',
    fontWeight: '700',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.5s ease-out',
    borderRadius: '4px',
  },
  criteriaFeedback: {
    fontSize: '14px',
    color: '#4a5568',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  listSection: {
    marginTop: '15px',
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listItem: {
    fontSize: '13px',
    color: '#4a5568',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: '1.5',
  },
  feedbackCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  feedbackText: {
    fontSize: '15px',
    color: '#4a5568',
    lineHeight: '1.8',
  },
  recommendationsCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  recommendationsList: {
    paddingLeft: '20px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  recommendationItem: {
    fontSize: '15px',
    color: '#4a5568',
    lineHeight: '1.7',
  },
  notableCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  notableList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  notableItem: {
    fontSize: '14px',
    color: '#4a5568',
    padding: '10px',
    background: '#f7fafc',
    borderRadius: '6px',
    borderLeft: '3px solid #667eea',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '20px',
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  restartButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    background: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  metadata: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'white',
    opacity: 0.9,
    marginTop: '10px',
  },
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    button:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

export default EvaluationScreen;