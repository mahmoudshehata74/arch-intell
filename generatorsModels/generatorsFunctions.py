from diffusers import AutoPipelineForText2Image, AutoPipelineForImage2Image
from transformers import AutoModelForCausalLM, AutoTokenizer
from diffusers.utils import load_image
import torch
import base64
from io import BytesIO
from PIL import Image

def generate (model_type,prompt):
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo")#, torch_dtype=torch.float16, variant="fp16")
    # pipe.to("cuda")

    # model_type = "2d"
    # prompt = "a bedroom with two Double bunk bed, Wardrobe and study desk and the walls coated with dark colors"

    image = pipe(model_type + " floorplan design " + prompt, num_inference_steps=1).images[0]
    image.save("2D_design.png")

    # Convert the PIL image to bytes
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    base64_image = base64.b64encode(img_bytes)
    # Encode the image bytes to base64
    return base64_image

def edit( prompt,base64_image):
    pipe2 = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo")#, torch_dtype=torch.float16, variant="fp16")
    # pipe2.to("cuda")

    # Decode the base64 image back to bytes
    decoded_image = base64.b64decode(base64_image)

    # Convert the bytes back to a PIL image
    imag = Image.open(BytesIO(decoded_image))
    imag.save("decoded_img.png")
    init_image = imag.resize(512, 512)

    # prompt = "colored walls"
    image = pipe2(prompt, image=init_image, num_inference_steps=1, strength=0.85, guidance_scale=0.75).images[0]

    image.save("3D_design.png")

    # Convert the PIL image to bytes
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()

    # Encode the image bytes to base64
    base64Image = base64.b64encode(img_bytes)
    
    return base64Image
 
 
 