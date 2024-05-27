from diffusers import AutoPipelineForImage2Image
from diffusers.utils import load_image
# import torch
import sys
import base64
from PIL import Image
from io import BytesIO

pipe = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo")  

# pipe = AutoPipelineForImage2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
# pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")


# prompt = "red walls"
# path = "2D_design.png"

def generate(prompt,path):
    
    decoded_image = base64.b64decode(path)
    img = Image.open(BytesIO(decoded_image))
    
    init_image = load_image(img).resize((512, 512))
    negative_prompt="ugly, deformed, disfigured, poor details, bad anatomy, null"
    
    image = pipe(prompt,negative_prompt, image=init_image, num_inference_steps=1, strength=0.85, guidance_scale=75).images[0]
    image.save(f"3D_design.png")
        
    with open(image, 'rb') as image_file:
        image_data = image_file.read()

    base64_image = base64.b64encode(image_data)
    
    return base64_image  #return image  or base64_image

# out = generate(prompt,path)
# out 

if __name__ == "__main__":
    prompt = ' '.join(sys.argv[1:])
    path  = ' '.join(sys.argv[1:])
    output = generate(prompt, path)
    print(output) 



