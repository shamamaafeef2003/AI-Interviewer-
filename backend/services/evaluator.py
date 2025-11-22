import os
from openai import OpenAI
from typing import Dict, List
import json
from datetime import datetime

class Evaluator:
    """Service for evaluating student performance and generating feedback"""
    
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or os.getenv('OPENAI_API_KEY'))
        self.evaluation_criteria = {
            'technical_depth': {
                'weight': 0.30,
                'description': 'Understanding of technical concepts and implementation details'
            },
            'clarity': {
                'weight': 0.25,
                'description': 'Ability to explain concepts clearly and coherently'
            },
            'originality': {
                'weight': 0.20,
                'description': 'Innovation and creative problem-solving'
            },
            'implementation_understanding': {
                'weight': 0.25,
                'description': 'Deep understanding of how the project is implemented'
            }
        }
    
    def evaluate_interview(self, conversation_history: List[Dict], 
                          project_context: Dict) -> Dict:
        """
        Evaluate the complete interview and generate comprehensive feedback
        
        Args:
            conversation_history: List of all questions and responses
            project_context: Context about the project (screens, transcripts)
            
        Returns:
            Complete evaluation with scores and detailed feedback
        """
        
        # Prepare conversation for analysis
        conversation_text = self._format_conversation(conversation_history)
        
        prompt = f"""You are an expert technical evaluator assessing a student's project presentation and interview.

EVALUATION CRITERIA:
1. Technical Depth (30%): Understanding of technical concepts, architecture, algorithms
2. Clarity of Explanation (25%): Ability to communicate ideas clearly and logically
3. Originality (20%): Innovation, creativity, unique approaches
4. Implementation Understanding (25%): Deep knowledge of how code works, design decisions

INTERVIEW TRANSCRIPT:
{conversation_text}

PROJECT CONTEXT:
- Screen content analyzed: {len(project_context.get('screen_content', []))} captures
- Speech segments: {len(project_context.get('speech_transcripts', []))} segments

Provide a comprehensive evaluation in JSON format:
{{
    "overall_score": 0-100,
    "criteria_scores": {{
        "technical_depth": {{
            "score": 0-100,
            "feedback": "specific feedback",
            "strengths": ["strength 1", "strength 2"],
            "weaknesses": ["weakness 1", "weakness 2"]
        }},
        "clarity": {{
            "score": 0-100,
            "feedback": "specific feedback",
            "strengths": [],
            "weaknesses": []
        }},
        "originality": {{
            "score": 0-100,
            "feedback": "specific feedback",
            "strengths": [],
            "weaknesses": []
        }},
        "implementation_understanding": {{
            "score": 0-100,
            "feedback": "specific feedback",
            "strengths": [],
            "weaknesses": []
        }}
    }},
    "summary": "2-3 sentence overall assessment",
    "detailed_feedback": "paragraph of detailed feedback",
    "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "notable_moments": ["positive moment 1", "area for improvement 1"]
}}

Be specific, constructive, and fair in your evaluation."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for consistent evaluation
                response_format={"type": "json_object"}
            )
            
            evaluation = json.loads(response.choices[0].message.content)
            
            # Add metadata
            evaluation['timestamp'] = datetime.now().isoformat()
            evaluation['interview_length'] = len(conversation_history)
            evaluation['grade'] = self._calculate_grade(evaluation['overall_score'])
            
            return {
                'success': True,
                'evaluation': evaluation
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'evaluation': self._generate_fallback_evaluation()
            }
    
    def evaluate_single_response(self, question: str, response: str, 
                                screen_context: str = "") -> Dict:
        """
        Evaluate a single response in real-time
        
        Args:
            question: The question that was asked
            response: Student's response
            screen_context: What was visible on screen
            
        Returns:
            Quick evaluation of the response
        """
        
        prompt = f"""Evaluate this single response from a student during a technical interview.

QUESTION: {question}

STUDENT RESPONSE: {response}

SCREEN CONTEXT: {screen_context}

Provide a quick assessment in JSON:
{{
    "quality_score": 0-10,
    "strengths": ["what they did well"],
    "gaps": ["what could be improved"],
    "technical_accuracy": "accurate|partially accurate|inaccurate",
    "clarity_rating": "clear|somewhat clear|unclear"
}}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            assessment = json.loads(response.choices[0].message.content)
            
            return {
                'success': True,
                'assessment': assessment
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'assessment': {}
            }
    
    def generate_final_report(self, evaluation: Dict) -> str:
        """Generate a formatted final report"""
        
        report = f"""
╔══════════════════════════════════════════════════════════════════╗
║           AI INTERVIEWER - EVALUATION REPORT                     ║
╚══════════════════════════════════════════════════════════════════╝

📊 OVERALL SCORE: {evaluation['overall_score']}/100 (Grade: {evaluation['grade']})
📅 Date: {evaluation['timestamp'][:10]}
🎯 Interview Length: {evaluation['interview_length']} exchanges

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 DETAILED SCORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
        
        criteria = evaluation.get('criteria_scores', {})
        for criterion_name, criterion_data in criteria.items():
            title = criterion_name.replace('_', ' ').title()
            score = criterion_data.get('score', 0)
            report += f"\n🔹 {title}: {score}/100\n"
            report += f"   {criterion_data.get('feedback', 'No feedback')}\n"
            
            strengths = criterion_data.get('strengths', [])
            if strengths:
                report += f"   ✅ Strengths: {', '.join(strengths)}\n"
            
            weaknesses = criterion_data.get('weaknesses', [])
            if weaknesses:
                report += f"   ⚠️  Areas for Improvement: {', '.join(weaknesses)}\n"
        
        report += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💭 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{evaluation.get('summary', 'No summary available')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 DETAILED FEEDBACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{evaluation.get('detailed_feedback', 'No detailed feedback available')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        recommendations = evaluation.get('recommendations', [])
        for i, rec in enumerate(recommendations, 1):
            report += f"\n{i}. {rec}"
        
        notable = evaluation.get('notable_moments', [])
        if notable:
            report += "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            report += "⭐ NOTABLE MOMENTS\n"
            report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            for moment in notable:
                report += f"\n• {moment}"
        
        report += "\n\n╚══════════════════════════════════════════════════════════════════╝\n"
        
        return report
    
    def _format_conversation(self, conversation_history: List[Dict]) -> str:
        """Format conversation history for evaluation"""
        formatted = []
        for i, exchange in enumerate(conversation_history, 1):
            exchange_type = exchange.get('type', 'unknown').upper()
            content = exchange.get('content', '')
            formatted.append(f"[{i}] {exchange_type}:\n{content}\n")
        return "\n".join(formatted)
    
    def _calculate_grade(self, score: float) -> str:
        """Convert numerical score to letter grade"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"
    
    def _generate_fallback_evaluation(self) -> Dict:
        """Generate a basic evaluation if API fails"""
        return {
            'overall_score': 0,
            'criteria_scores': {},
            'summary': 'Evaluation could not be completed due to an error.',
            'detailed_feedback': 'Please try again.',
            'recommendations': [],
            'notable_moments': [],
            'timestamp': datetime.now().isoformat(),
            'interview_length': 0,
            'grade': 'N/A'
        }