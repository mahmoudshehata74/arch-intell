from flask import Flask, request, jsonify
from diffusers import AutoPipelineForImage2Image
from diffusers.utils import load_image
import sys
import base64
from PIL import Image
from io import BytesIO

app = Flask(__name__)

pipe = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt = data['prompt']
    path = data['path']

    desc = prompt.split()
    desc.pop()
    description = ' '.join(desc)

    decoded_image = base64.b64decode(path)
    imag = Image.open(BytesIO(decoded_image))
    imag.save("decoded_img.png")
    init_image = imag.resize((512, 512))

    image = pipe(description, image=init_image, num_inference_steps=1, strength=0.85, guidance_scale=0.75).images[0]
    image.save("3D_design.png")

    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    base64_image = base64.b64encode(img_bytes)

    return jsonify({'image': base64_image.decode('utf-8')})

if __name__ == '__main__':
    app.run(debug=True)