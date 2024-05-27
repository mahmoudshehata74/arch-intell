# import torch
from diffusers import AutoPipelineForText2Image
import sys
import base64

pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo")  

# pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
# pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")


# prompt = "a bedroom with two Double bunk bed , Wardrobe and study desk and the walls coated with dark colores "
# model_type = "2D"

def generate(model_type,prompt):
    
    model_type = model_type+" floorplan design"
    negative_prompt="ugly, deformed, disfigured, poor details, bad anatomy, null"


    image = pipe(model_type+" floorplan design "+prompt,negative_prompt, num_inference_steps=1,guidance_scale=75).images[0].tobytes()

    # image.save(f"2D_design.png")
    
  

    # with open(image, 'rb') as image_file:
        # image_data = image_file.read()

    base64_image = base64.b64encode(image)
    
    return base64_image  #return image  or base64_image


# out = generate(model_type,prompt)
# out


if __name__ == "__main__":
    prompt = ' '.join(sys.argv[1:-1])
    model_type = ' '.join(sys.argv[-1:])
    output = generate(model_type,prompt)
    output
    # print(output) 


