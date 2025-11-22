class MediaCaptureService {
  constructor() {
    this.screenStream = null;
    this.audioStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  // Request screen sharing permission
  async startScreenCapture() {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'window',
        },
        audio: false,
      });

      return {
        success: true,
        stream: this.screenStream,
      };
    } catch (error) {
      console.error('Error starting screen capture:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Capture a screenshot from the screen stream
  async captureScreenshot() {
    if (!this.screenStream) {
      throw new Error('Screen capture not started');
    }

    try {
      const video = document.createElement('video');
      video.srcObject = this.screenStream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/png');

      return {
        success: true,
        imageBase64: imageBase64,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Start audio recording
  async startAudioRecording() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm',
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      return {
        success: true,
        message: 'Audio recording started',
      };
    } catch (error) {
      console.error('Error starting audio recording:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Stop audio recording and get the audio data
  async stopAudioRecording() {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioBase64 = await this.blobToBase64(audioBlob);

          this.isRecording = false;
          this.audioChunks = [];

          resolve({
            success: true,
            audioBase64: audioBase64,
            format: 'webm',
          });
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Stop all media streams
  stopAllCapture() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    this.isRecording = false;
    this.audioChunks = [];
  }

  // Check if browser supports required APIs
  static checkBrowserSupport() {
    const support = {
      screenCapture: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      audioCapture: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      mediaRecorder: !!window.MediaRecorder,
    };

    support.allSupported = support.screenCapture && support.audioCapture && support.mediaRecorder;

    return support;
  }
}

export default new MediaCaptureService();