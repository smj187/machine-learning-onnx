from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from segment_anything import SamPredictor, sam_model_registry
import cv2
import torch
import torchvision
import numpy as np
import io

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
sam = sam_model_registry["default"](checkpoint="sam_vit_h_4b8939.pth")
sam.to(device=device)
predictor = SamPredictor(sam)

@app.get("/")
def test():
    return "hello world"

@app.post("/sam", response_class=StreamingResponse)
async def sam(image: UploadFile = File(...)):
    print("PyTorch version:", torch.__version__)
    print("Torchvision version:", torchvision.__version__)
    print("CUDA is available:", torch.cuda.is_available())

    # Read the image file
    contents = await image.read()
    nparr = np.fromstring(contents, np.uint8)
    img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_np = cv2.cvtColor(img_np, cv2.COLOR_BGR2RGB)

    predictor.set_image(img_np)
    image_embedding = predictor.get_image_embedding().cpu().numpy()

    # Save the numpy array to a BytesIO object
    byte_stream = io.BytesIO()
    np.save(byte_stream, image_embedding)
    byte_stream.seek(0)

    # Return the numpy array as a file
    return StreamingResponse(byte_stream, media_type="application/octet-stream", headers={'Content-Disposition': 'attachment; filename=embedding.npy'})
