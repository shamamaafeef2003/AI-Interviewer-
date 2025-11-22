import os
from openai import OpenAI
from typing import Dict, List
import json

class AIInterviewer:
    """AI-powered interviewer that generates context-aware questions"""
    
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or os.getenv('OPENAI_API_KEY'))
        self.conversation_history = []
        self.project_context = {
            'screen_content': [],
            'speech_transcripts': [],
            'identified_topics': []
        }
    
    def update_context(self, screen_text: str = None, speech_text: str = None):
        """Update the project context with new information"""
        if screen_text:
            self.project_context['screen_content'].append(screen_text)
        if speech_text:
            self.project_context['speech_transcripts'].append(speech_text)
    
    def generate_initial_question(self) -> Dict:
        """Generate the first question to start the interview"""
        prompt = """You are an expert technical interviewer evaluating a student's project presentation.
        
Generate an opening question that encourages the student to introduce their project.
The question should be friendly but professional, and should prompt them to explain:
- What the project does
- What problem it solves
- Why they built it

Return your response as JSON in this format:
{
    "question": "your question here",
    "question_type": "introduction",
    "focus_areas": ["overview", "motivation"]
}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            question_data = json.loads(response.choices[0].message.content)
            
            self.conversation_history.append({
                'type': 'question',
                'content': question_data['question']
            })
            
            return {
                'success': True,
                'question': question_data['question'],
                'question_type': question_data.get('question_type', 'general'),
                'focus_areas': question_data.get('focus_areas', [])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'question': "Could you please tell me about your project?",
                'question_type': 'fallback',
                'focus_areas': []
            }
    
    def generate_followup_question(self, student_response: str, screen_context: str = "") -> Dict:
        """Generate a follow-up question based on student's response and screen content"""
        
        # Build context for the AI
        context = self._build_context_summary()
        
        prompt = f"""You are an expert technical interviewer. Based on the conversation so far and the visual content, generate the next question.

CONVERSATION HISTORY:
{context}

LATEST STUDENT RESPONSE:
{student_response}

CURRENT SCREEN CONTENT:
{screen_context}

Generate a follow-up question that:
1. Probes deeper into technical details mentioned by the student
2. References specific elements visible on screen (code, diagrams, UI)
3. Tests their understanding of implementation details
4. Is specific and targeted (not generic)

Return your response as JSON:
{{
    "question": "your specific question here",
    "question_type": "technical|conceptual|implementation|design",
    "focus_areas": ["specific topic 1", "specific topic 2"],
    "reasoning": "why you're asking this question"
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                response_format={"type": "json_object"}
            )
            
            question_data = json.loads(response.choices[0].message.content)
            
            self.conversation_history.append({
                'type': 'student_response',
                'content': student_response
            })
            self.conversation_history.append({
                'type': 'question',
                'content': question_data['question']
            })
            
            return {
                'success': True,
                'question': question_data['question'],
                'question_type': question_data.get('question_type', 'general'),
                'focus_areas': question_data.get('focus_areas', []),
                'reasoning': question_data.get('reasoning', '')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'question': "Can you explain more about that?",
                'question_type': 'fallback',
                'focus_areas': []
            }
    
    def generate_code_specific_question(self, code_snippet: str, student_response: str) -> Dict:
        """Generate question specifically about visible code"""
        
        prompt = f"""You are reviewing code with a student. Based on this code snippet and their explanation, ask a targeted technical question.

CODE VISIBLE:
{code_snippet}

STUDENT'S EXPLANATION:
{student_response}

Ask a specific question about:
- The implementation approach
- Why they chose specific methods/functions
- Potential edge cases or improvements
- How it integrates with other parts

Return JSON:
{{
    "question": "your question",
    "question_type": "code_review",
    "focus_areas": ["specific aspects"]
}}"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            question_data = json.loads(response.choices[0].message.content)
            
            return {
                'success': True,
                'question': question_data['question'],
                'question_type': 'code_review',
                'focus_areas': question_data.get('focus_areas', [])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'question': "Can you walk me through this code?",
                'question_type': 'fallback'
            }
    
    def _build_context_summary(self) -> str:
        """Build a summary of the conversation for context"""
        summary = []
        for i, exchange in enumerate(self.conversation_history[-6:], 1):  # Last 6 exchanges
            summary.append(f"{exchange['type'].upper()}: {exchange['content']}")
        return "\n".join(summary)
    
    def get_conversation_history(self) -> List[Dict]:
        """Get the full conversation history"""
        return self.conversation_history
    
    def reset(self):
        """Reset the interview session"""
        self.conversation_history = []
        self.project_context = {
            'screen_content': [],
            'speech_transcripts': [],
            'identified_topics': []
        }