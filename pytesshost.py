import base64
import dataclasses
import json
import logging
import time
from functools import wraps
from io import BytesIO

import numpy as np
import pytesseract
from PIL import Image
from bottle import Bottle, request, response

HOST = '0.0.0.0'
PORT = 30101
TESSOPTS = "-c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -c load_system_dawg=false -c load_freq_dawg=false --psm 11 --oem 3"

pytesseract.pytesseract.tesseract_cmd = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'


def main():
    app = Bottle()

    def log_to_logger(fn):
        @wraps(fn)
        def _log_to_logger(*args, **kwargs):
            actual_response = fn(*args, **kwargs)
            logging.info('%s %s %s %s' % (request.remote_addr,
                                          request.method,
                                          request.url,
                                          response.status,))
            return actual_response

        return _log_to_logger

    def generate_response(obj):
        class EnhancedJSONEncoder(json.JSONEncoder):
            def default(self, o):
                if dataclasses.is_dataclass(o):
                    return dataclasses.asdict(o)
                return super().default(o)

        response.set_header("Access-Control-Allow-Origin", "*")
        response.content_type = 'application/json'
        return json.dumps(obj, ensure_ascii=False, cls=EnhancedJSONEncoder)

    @app.route('/')
    def root():
        return "it's at POST /solve, pass base64 encoded image as body"

    @app.route('/solve', method='POST')
    def backend_download_image():
        body = request.body.read().decode('utf-8')
        if len(body) == 0:
            response.status = 500
            return generate_response({'success': False, 'err': 'missing image parameter'})

        start = time.time()
        f = BytesIO(base64.b64decode(body))

        img = Image.open(f).convert('RGBA')
        img = img.resize((int(img.width * 1.3), img.height * 2), Image.Resampling.LANCZOS)
        captcha_img = Image.new("RGBA", img.size, "WHITE")
        captcha_img.paste(img, mask=img)
        captcha_img.convert("RGB")

        image_array = np.array(captcha_img)
        mask = np.min(image_array[:, :, :3], axis=2) > 215
        result_array = np.where(mask[:, :, None], [255, 255, 255], [0, 0, 0])

        array_copy = result_array.copy()
        height, width = result_array.shape[:2]
        black_pixel = np.array([0, 0, 0])
        for y in range(1, height - 1):
            for x in range(1, width - 1):
                if np.array_equal(array_copy[y, x], black_pixel):
                    result_array[y - 1:y + 1, x - 1:x + 1] = black_pixel

        captcha_img = Image.fromarray(result_array.astype(np.uint8))

        out = pytesseract.image_to_string(img, config=TESSOPTS).strip()
        end = time.time()
        return generate_response({'success': True, 'output': out, 'time': end - start})

    logging.basicConfig(format='[%(levelname)s] [%(asctime)s] %(msg)s', level=logging.INFO)
    logging.info(f"listening on {HOST}:{PORT}")
    app.install(log_to_logger)
    app.run(host=HOST, port=PORT, quiet=True)

if __name__ == '__main__':
    main()
