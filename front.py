import requests
import json
import tkinter as tk
from tkinter import messagebox

mutation = '''
mutation CreateDesign($designInput: DesignInput!) {
  createDesign(designInput: $designInput) {
     _id
    title
    description
    model_type
    outputUrl2D
    outputUrl3D
    creator {
      _id
      username
      email
      image
    }
    comments {
      _id
      comment
      username
      createdAt
    }
    likes {
      id
      createdAt
      username
    }
    createdAt
  }
}
'''

server_url = 'http://localhost:9595/graphql'
token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imhhd2FyeSIsInVzZXJJZCI6IjY1ZDI0MjE5NmE1MjE1ZDI3M2Q1MDNlOSIsImVtYWlsIjoiaGF3YXJ5QGNzLmNvbSIsImlhdCI6MTcxNDc2NzIwNn0.z66G7FDp1_QK7TBbPUhIWEWWYTcEDMHUUL0M-e2K3_0'

def send_mutation_request(design_input):
    headers = {
        'Authorization': token
    }
    variables = {
        'designInput': design_input
    }
    payload = {
        'query': mutation,
        'variables': variables
    }
    response = requests.post(server_url, json=payload, headers=headers)
    return response.json()

def generate_image():
    model_type = model_type_entry.get()
    title = title_entry.get()
    description = description_entry.get()
    design_input = {
        'model_type': model_type,
        'title': title,
        'description': description
    }
    response = send_mutation_request(design_input)
    messagebox.showinfo('Response', json.dumps(response))

# Create the GUI window
window = tk.Tk()
window.title('Generate Image')
window.geometry('400x200')

# Model Type
model_type_label = tk.Label(window, text='Model Type:')
model_type_label.pack()
model_type_entry = tk.Entry(window)
model_type_entry.pack()

# Title
title_label = tk.Label(window, text='Title:')
title_label.pack()
title_entry = tk.Entry(window)
title_entry.pack()

# Description
description_label = tk.Label(window, text='Description:')
description_label.pack()
description_entry = tk.Entry(window)
description_entry.pack()

# Generate Image Button
generate_button = tk.Button(window, text='Generate Image', command=generate_image)
generate_button.pack()

# Run the GUI event loop
window.mainloop()