from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import json
import os
from dotenv import load_dotenv

from services.ocr_service import OCRService
from services.stt_service import STTService
from services.ai_interviewer import AIInterviewer
from services.evaluator import Evaluator

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI Interviewer API",
    description="AI-Driven Automated Interviewer for Project Presentations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
stt_service = STTService()
ai_interviewer = AIInterviewer()
evaluator = Evaluator()

# Store active interview sessions
active_sessions: Dict[str, Dict] = {}

# Pydantic models
class ScreenCaptureRequest(BaseModel):
    session_id: str
    image_base64: str
    timestamp: float

class AudioTranscriptionRequest(BaseModel):
    session_id: str
    audio_base64: str
    format: str = "webm"

class InterviewStartRequest(BaseModel):
    session_id: str
    student_name: Optional[str] = None
    project_name: Optional[str] = None

class ResponseSubmitRequest(BaseModel):
    session_id: str
    response_text: str
    screen_context: Optional[str] = None

# Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "AI Interviewer API",
        "version": "1.0.0"
    }

@app.post("/api/interview/start")
async def start_interview(request: InterviewStartRequest):
    """Start a new interview session"""
    try:
        session_id = request.session_id
        
        # Initialize session
        active_sessions[session_id] = {
            'student_name': request.student_name,
            'project_name': request.project_name,
            'interviewer': AIInterviewer(),
            'started_at': None,
            'question_count': 0,
            'responses': []
        }
        
        # Generate first question
        question_result = active_sessions[session_id]['interviewer'].generate_initial_question()
        
        if question_result['success']:
            active_sessions[session_id]['question_count'] = 1
            return {
                'success': True,
                'session_id': session_id,
                'question': question_result['question'],
                'question_type': question_result['question_type'],
                'message': 'Interview started successfully'
            }
        else:
            raise HTTPException(status_code=500, detail=question_result.get('error', 'Failed to generate question'))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/screen/analyze")
async def analyze_screen(request: ScreenCaptureRequest):
    """Analyze screen capture using OCR"""
    try:
        # Extract text from screen
        ocr_result = ocr_service.extract_text_from_base64(request.image_base64)
        
        # Detect UI elements
        ui_result = ocr_service.detect_ui_elements(request.image_base64)
        
        # Update interview context if session exists
        if request.session_id in active_sessions:
            interviewer = active_sessions[request.session_id]['interviewer']
            interviewer.update_context(screen_text=ocr_result.get('text', ''))
        
        return {
            'success': True,
            'session_id': request.session_id,
            'ocr': ocr_result,
            'ui_elements': ui_result,
            'timestamp': request.timestamp
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio/transcribe")
async def transcribe_audio(request: AudioTranscriptionRequest):
    """Transcribe audio using Whisper"""
    try:
        # Transcribe audio
        transcript_result = stt_service.transcribe_base64_audio(
            request.audio_base64,
            request.format
        )
        
        # Update interview context if session exists
        if request.session_id in active_sessions:
            interviewer = active_sessions[request.session_id]['interviewer']
            if transcript_result['success']:
                interviewer.update_context(speech_text=transcript_result.get('text', ''))
        
        return {
            'success': True,
            'session_id': request.session_id,
            'transcription': transcript_result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/respond")
async def submit_response(request: ResponseSubmitRequest):
    """Submit student response and get next question"""
    try:
        session_id = request.session_id
        
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[session_id]
        interviewer = session['interviewer']
        
        # Store response
        session['responses'].append({
            'response': request.response_text,
            'screen_context': request.screen_context,
            'question_number': session['question_count']
        })
        
        # Generate next question
        next_question = interviewer.generate_followup_question(
            request.response_text,
            request.screen_context or ""
        )
        
        if next_question['success']:
            session['question_count'] += 1
            
            # Check if we should end the interview
            max_questions = int(os.getenv('MAX_QUESTIONS', 10))
            should_end = session['question_count'] >= max_questions
            
            return {
                'success': True,
                'question': next_question['question'],
                'question_type': next_question['question_type'],
                'question_number': session['question_count'],
                'should_end': should_end,
                'focus_areas': next_question.get('focus_areas', [])
            }
        else:
            raise HTTPException(status_code=500, detail=next_question.get('error', 'Failed to generate question'))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/evaluate/{session_id}")
async def evaluate_interview(session_id: str):
    """Evaluate the completed interview"""
    try:
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[session_id]
        interviewer = session['interviewer']
        
        # Get conversation history
        conversation_history = interviewer.get_conversation_history()
        project_context = interviewer.project_context
        
        # Evaluate interview
        evaluation_result = evaluator.evaluate_interview(
            conversation_history,
            project_context
        )
        
        if evaluation_result['success']:
            # Generate formatted report
            report_text = evaluator.generate_final_report(
                evaluation_result['evaluation']
            )
            
            return {
                'success': True,
                'evaluation': evaluation_result['evaluation'],
                'report': report_text,
                'session_id': session_id
            }
        else:
            raise HTTPException(status_code=500, detail=evaluation_result.get('error', 'Evaluation failed'))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interview/status/{session_id}")
async def get_interview_status(session_id: str):
    """Get current interview status"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    return {
        'success': True,
        'session_id': session_id,
        'student_name': session.get('student_name'),
        'project_name': session.get('project_name'),
        'question_count': session['question_count'],
        'response_count': len(session['responses'])
    }

@app.delete("/api/interview/end/{session_id}")
async def end_interview(session_id: str):
    """End and cleanup interview session"""
    if session_id in active_sessions:
        del active_sessions[session_id]
        return {
            'success': True,
            'message': 'Interview session ended'
        }
    else:
        raise HTTPException(status_code=404, detail="Session not found")

# WebSocket endpoint for real-time communication
@app.websocket("/ws/interview/{session_id}")
async def websocket_interview(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time interview communication"""
    await websocket.accept()
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message['type'] == 'screen_capture':
                result = ocr_service.extract_text_from_base64(message['data'])
                await websocket.send_json({
                    'type': 'screen_analysis',
                    'result': result
                })
            
            elif message['type'] == 'audio_chunk':
                result = stt_service.transcribe_base64_audio(message['data'])
                await websocket.send_json({
                    'type': 'transcription',
                    'result': result
                })
            
            elif message['type'] == 'ping':
                await websocket.send_json({'type': 'pong'})
    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )