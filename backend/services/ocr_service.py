import pytesseract
from PIL import Image
import io
import base64
import cv2
import numpy as np
from typing import Dict, List

class OCRService:
    """Service for extracting text from images using OCR"""
    
    def __init__(self):
        # Configure Tesseract if needed (update path for Windows)
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        pass
    
    def extract_text_from_base64(self, base64_image: str) -> Dict[str, any]:
        """
        Extract text from a base64 encoded image
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Dictionary containing extracted text and confidence
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            # Decode base64 to image
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)
            
            # Extract text with detailed data
            ocr_data = pytesseract.image_to_data(processed_image, output_type=pytesseract.Output.DICT)
            
            # Filter and combine text
            text_blocks = self._extract_text_blocks(ocr_data)
            
            full_text = pytesseract.image_to_string(processed_image)
            
            return {
                'success': True,
                'text': full_text.strip(),
                'text_blocks': text_blocks,
                'confidence': self._calculate_average_confidence(ocr_data)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'text_blocks': [],
                'confidence': 0
            }
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Convert PIL Image to OpenCV format
        img_array = np.array(image)
        
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply thresholding to make text clearer
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Convert back to PIL Image
        return Image.fromarray(thresh)
    
    def _extract_text_blocks(self, ocr_data: Dict) -> List[Dict]:
        """Extract meaningful text blocks with positions"""
        text_blocks = []
        n_boxes = len(ocr_data['text'])
        
        for i in range(n_boxes):
            if int(ocr_data['conf'][i]) > 30:  # Only include confident detections
                text = ocr_data['text'][i].strip()
                if text:
                    text_blocks.append({
                        'text': text,
                        'confidence': int(ocr_data['conf'][i]),
                        'position': {
                            'x': ocr_data['left'][i],
                            'y': ocr_data['top'][i],
                            'width': ocr_data['width'][i],
                            'height': ocr_data['height'][i]
                        }
                    })
        
        return text_blocks
    
    def _calculate_average_confidence(self, ocr_data: Dict) -> float:
        """Calculate average confidence score"""
        confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) > 0]
        return sum(confidences) / len(confidences) if confidences else 0
    
    def detect_ui_elements(self, base64_image: str) -> Dict:
        """Detect UI elements like buttons, forms, etc."""
        try:
            # Decode image
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            img_array = np.array(image)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect edges for UI elements
            edges = cv2.Canny(gray, 50, 150)
            
            # Find contours (potential UI elements)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            ui_elements = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                if w > 50 and h > 20:  # Filter small noise
                    ui_elements.append({
                        'type': 'unknown',
                        'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)}
                    })
            
            return {
                'success': True,
                'elements': ui_elements,
                'count': len(ui_elements)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'elements': [],
                'count': 0
            }