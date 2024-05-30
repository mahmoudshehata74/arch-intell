# import torch
from diffusers import AutoPipelineForText2Image
import sys
import base64
from io import BytesIO

pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo")  

# pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
# pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")


# prompt = "a bedroom with two Double bunk bed , Wardrobe and study desk and the walls coated with dark colores "
# model_type = "2D"

def generate(model_type,prompt):
    
    model_type = model_type+" floorplan design"
    # negative_prompt="ugly, deformed, disfigured, poor details, bad anatomy, null"


    image = pipe(model_type + prompt, num_inference_steps=1,guidance_scale=0.75).images[0]

    image.save("2D_design.png")

    # Convert the PIL image to bytes
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()

    # Encode the image bytes to base64
    base64_image = base64.b64encode(img_bytes)
    
    return base64_image #return image  or base64_image


# out = generate(model_type,prompt)
# out


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Error: Not enough arguments", file=sys.stderr)
        sys.exit(1)
    
    model_type = sys.argv[1]
    prompt = ' '.join(sys.argv[2:])
    output = generate(model_type, prompt)
    print(output)  # This will print the result to stdout


