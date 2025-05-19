from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
import pytesseract
import re

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB
CORS(app)

@app.route("/auto-scale", methods=["POST"])
def auto_scale():
    try:
        data = request.get_json()

        x = int(data['x'])
        y = int(data['y'])
        w = int(data['width'])
        h = int(data['height'])
        image_base64 = data['image']
        invert = data['invert']

        # Convert to numpy
        image_data = image_base64.split(',')[1]
        img_bytes = base64.b64decode(image_data)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        #Crop
        height, width = img.shape[:2]
        w = min(w, width - x)
        h = min(h, height - y)
        crop = img[y:y+h, x:x+w]

        grayscale = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) #mandatory grayscale for thresholding
        if invert:
            # if background is clear (white)
            grayscale = cv2.bitwise_not(grayscale)

        #object to be found must be white, no black scales
        _, binary = cv2.threshold(grayscale, 200, 255, cv2.THRESH_BINARY) #binary img
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            rx, ry, rw, rh = cv2.boundingRect(cnt) #countour bounding boxes
            # Search for horizontal countors not comprising the whole image (borders)
            if rw / rh > 3 and w*0.99 > rw:
                # OCR (Tesseract)
                config = '--psm 6 -c tessedit_char_whitelist=0123456789unµ.'
                ocr_result = pytesseract.image_to_string(grayscale, config=config)

                # Buscar valores como "10 µm", "5um", etc.
                match = re.search(r'(\d+\.?\d*)\s*(n|µ|u)', ocr_result.lower())
                if match:
                    img_contours = crop.copy()
                    cv2.drawContours(img_contours, [cnt], -1, (0, 0, 255), 2)
                    _, buffer = cv2.imencode('.png', img_contours)
                    countour_b64 = base64.b64encode(buffer).decode('utf-8')
                    #cv2.imwrite("debug_imagen.png", img_contours)
                    number = float(match.group(1))
                    scale = number / rw
                    unit = match.group(2)+"m"
                    return jsonify({
                                "number": number,
                                "pixels": rw,
                                "unit": unit,
                                "scale": round(scale, 4),
                                "ocr": match.group(1).strip() + " " + unit,
                                "image": f"data:image/png;base64,{countour_b64}"
                            })

        return jsonify({"error": "Scale bar not detected"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(port=5050)
