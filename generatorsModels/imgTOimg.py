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
    desc = prompt.split()
    desc.pop()
    
    description = ' '.join(desc)
    
    decoded_image = base64.b64decode(path)

    # Convert the bytes back to a PIL image
    imag = Image.open(BytesIO(decoded_image))
    imag.save("decoded_img.png")
    init_image = imag.resize((512, 512))
    # negative_prompt="ugly, deformed, disfigured, poor details, bad anatomy, null"
    
    image = pipe(description, image=init_image, num_inference_steps=1, strength=0.85, guidance_scale=0.75).images[0]
    image.save("3D_design.png")

    # Convert the PIL image to bytes
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()

    # Encode the image bytes to base64
    base64_image = base64.b64encode(img_bytes)
    
    return base64_image  #return image  or base64_image

# out = generate(prompt,path)
# out 

if __name__ == "__main__":
    prompt = ' '.join(sys.argv[1])
    path  = ' '.join(sys.argv[2])
    output = generate(prompt, path)
    print(output) 



