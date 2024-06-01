from flask import Flask, request, jsonify
from diffusers import AutoPipelineForText2Image , AutoPipelineForImage2Image 
from diffusers.utils import load_image
import torch
from torchvision import transforms
import sys
import base64
from PIL import Image
from io import BytesIO
import io
import os
import numpy as np
import cv2
from generatorsFunctions import edit
from generatorsFunctions import generate


app = Flask(__name__)

# pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo")  

# pipe2 = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo")

def decriptionValidation():
    
    
    return


@app.route('/generateDesign', methods=['POST'])
def generateDesign():
    data = request.get_json()
    model_type = data['model_type']
    prompt = data['prompt']
    # print(model_type)
    
    
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo")  

    try:
        
        model_type = model_type+" floorplan design"
        # negative_prompt="ugly, deformed, disfigured, poor details, bad anatomy, null"

        image = pipe(model_type + prompt, num_inference_steps=3,guidance_scale=0.75).images[0]

        image.save("2D_design.png")

        # Convert the PIL image to bytes
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()

        # Encode the image bytes to base64
        base64_image = base64.b64encode(img_bytes)
        print("The length of the encoded_image is",len(base64_image))

        return jsonify({'image': base64_image.decode('utf-8')})

    except Exception as e:
        app.logger.error(f"Error generating image: {str(e)}")
        return jsonify({'error': 'Error generating image'}), 500


@app.route('/editDesign', methods=['POST'])
def editDesign():
    pipe2 = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo")
    
    data = request.get_json()
    prompt = data['prompt']
    path = data['path']
    print("The length of the encoded_image is",len(path))

    desc = prompt.split()
    desc.pop()
    description = ' '.join(desc)

    try:    
        
        # Decode the base64 string to bytes
        decoded_image = base64.b64decode(path)
        print("The length of the decoded_image is",len(decoded_image))
        
        img = Image.open(BytesIO(decoded_image))
        img.save("decoded_img.png")

        init_image = load_image("2D_design.png").resize((512, 512))
        
        # init_image = img.resize((512, 512))

        image = pipe2(description, image=init_image, num_inference_steps=3, strength=1, guidance_scale=75).images[0]

        image.save("3D_design.png")

        # Convert the PIL image to bytes
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_bytes = buffered.getvalue()

        # Encode the image bytes to base64
        base64Image = base64.b64encode(img_bytes)
        
        
        return jsonify({'image': base64Image.decode('utf-8')})

    except ValueError as e:
        print(f"Error decoding image: {e}")
        return jsonify({"error": "Invalid image data"}), 400
    except IOError as e:
        print(f"Error opening image: {e}")
        return jsonify({"error": "Unable to open image"}), 400
    except Exception as e:
        print(f"Error editing image: {e}")
        return jsonify({"error": "Error editing image"}), 500

if __name__ == '__main__':
    # Set the log level to ERROR to reduce noise during development
    app.logger.setLevel(os.environ.get('LOG_LEVEL', 'ERROR'))
    app.run(debug=False)