# AI-Driven Automated Interviewer-- by Syeda shamama Afeef

An AI-powered system that conducts adaptive technical interviews by analyzing screen content and speech during project presentations.

## Features

* **Real-time Screen Analysis** : OCR-based content extraction from presentations
* **Speech-to-Text Transcription** : Converts student responses to text using OpenAI Whisper
* **Adaptive Questioning** : AI generates context-aware follow-up questions
* **Comprehensive Evaluation** : Scores students on technical depth, clarity, originality, and implementation understanding
* **Detailed Feedback** : Provides actionable recommendations and insights

## Prerequisites

* **Node.js** (v18 or higher)
* **Python** (3.9 or higher)
* **OpenAI API Key** (required for AI features)
* **Tesseract OCR** (for screen text extraction)

## Installation

### Step 1: Install Tesseract OCR

**Windows:**

```bash
# Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR
```

**macOS:**

```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

### Step 2: Clone and Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your OpenAI API key
# Edit .env and replace with your actual API key
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Setup Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Terminal 1 - Start Backend Server

```bash
cd backend
# Activate virtual environment first
python main.py
```

Backend will run on: `http://localhost:8000`

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

## Usage Guide

### 1. **Setup Phase**

* Enter your name and project name
* Click "Start Interview"

### 2. **Interview Phase**

* Click "Start Screen Share" to share your presentation
* The system will periodically capture and analyze your screen
* Click "Record Answer" to speak your response
* Or type your answer directly in the text area
* Click "Submit Response" to continue

### 3. **Evaluation Phase**

* View your overall score and grade
* Review detailed feedback for each criterion
* See strengths and areas for improvement
* Download the full evaluation report
* Start a new interview if desired

## 🏗️ Project Structure

```
ai-interviewer/
├── backend/
│   ├── services/
│   │   ├── ocr_service.py          # Screen text extraction
│   │   ├── stt_service.py          # Speech-to-text
│   │   ├── ai_interviewer.py       # Question generation
│   │   └── evaluator.py            # Performance evaluation
│   ├── main.py                     # FastAPI server
│   ├── requirements.txt
│   └── .env                        # API keys
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SetupScreen.jsx     # Initial setup
│   │   │   ├── InterviewScreen.jsx # Main interview UI
│   │   │   └── EvaluationScreen.jsx # Results display
│   │   ├── services/
│   │   │   ├── api.js              # Backend API calls
│   │   │   └── mediaCapture.js     # Screen/audio capture
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## API Endpoints

### Interview Management

* `POST /api/interview/start` - Start new interview session
* `POST /api/interview/respond` - Submit student response
* `POST /api/interview/evaluate/{session_id}` - Get final evaluation
* `GET /api/interview/status/{session_id}` - Get session status
* `DELETE /api/interview/end/{session_id}` - End session

### Media Processing

* `POST /api/screen/analyze` - Analyze screen capture
* `POST /api/audio/transcribe` - Transcribe audio

## Evaluation Criteria

The system evaluates students on four key dimensions:

1. **Technical Depth (30%)** : Understanding of technical concepts and architecture
2. **Clarity of Explanation (25%)** : Ability to communicate ideas clearly
3. **Originality (20%)** : Innovation and creative problem-solving
4. **Implementation Understanding (25%)** : Deep knowledge of code and design decisions

## Configuration

Edit `backend/.env` to customize:

```env
# Maximum number of questions to ask
MAX_QUESTIONS=10

# Allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Evaluation criteria weights
EVALUATION_CRITERIA=technical_depth,clarity,originality,implementation_understanding
```

## Troubleshooting

### Tesseract Not Found

```bash
# Windows: Update path in backend/services/ocr_service.py
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### CORS Errors

* Ensure frontend and backend are running on correct ports
* Check ALLOWED_ORIGINS in .env

### Audio Recording Issues

* Grant microphone permissions in browser
* Use Chrome/Edge for best compatibility

### Screen Sharing Not Working

* Grant screen sharing permissions
* Use HTTPS in production (required by browsers)

## Security Notes

* Never commit `.env` file with API keys
* Use environment variables in production
* Implement rate limiting for API endpoints
* Add authentication for production deployment

## Future Enhancements

* [ ] Multi-language support
* [ ] Video recording of presentations
* [ ] Real-time code execution and testing
* [ ] Integration with GitHub for project analysis
* [ ] Team interview mode
* [ ] Custom evaluation rubrics

## License

MIT License - feel free to use this project for educational purposes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React, FastAPI, and OpenAI API key By syeda shamama Afeef**
