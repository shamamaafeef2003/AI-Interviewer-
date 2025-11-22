import os
from openai import OpenAI
import base64
import io
from typing import Dict

class STTService:
    """Service for converting speech to text using OpenAI Whisper"""
    
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or os.getenv('OPENAI_API_KEY'))
    
    def transcribe_audio(self, audio_data: bytes, format: str = "webm") -> Dict:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Raw audio bytes
            format: Audio format (webm, mp3, wav, etc.)
            
        Returns:
            Dictionary containing transcription and metadata
        """
        try:
            # Create a file-like object from bytes
            audio_file = io.BytesIO(audio_data)
            audio_file.name = f"audio.{format}"
            
            # Transcribe using Whisper
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
            
            return {
                'success': True,
                'text': transcript.text,
                'language': transcript.language if hasattr(transcript, 'language') else 'en',
                'duration': transcript.duration if hasattr(transcript, 'duration') else 0
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'language': '',
                'duration': 0
            }
    
    def transcribe_base64_audio(self, base64_audio: str, format: str = "webm") -> Dict:
        """
        Transcribe base64 encoded audio
        
        Args:
            base64_audio: Base64 encoded audio string
            format: Audio format
            
        Returns:
            Dictionary containing transcription and metadata
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_audio:
                base64_audio = base64_audio.split(',')[1]
            
            # Decode base64 to bytes
            audio_data = base64.b64decode(base64_audio)
            
            return self.transcribe_audio(audio_data, format)
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'language': '',
                'duration': 0
            }