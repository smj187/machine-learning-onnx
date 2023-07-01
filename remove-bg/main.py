from fastapi import FastAPI, UploadFile, HTTPException, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from rembg import new_session, remove
import io
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# model_name = "models/isnet-general-use.onnx"
model_name = "models/u2net.onnx"
session = new_session(model_name)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.post("/", responses={200: {"content": {"image/png": {}}}})
async def create_upload_file(file: UploadFile = File(...)):
    logger.info("Received file: %s", file.filename)

    # Check file format
    if not file.filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Use 'png', 'jpg', 'jpeg' or 'webp'",
        )

    try:
        input_image = await file.read()
        output = remove(
            input_image, 
            session=session, 
            alpha_matting_foreground_threshold=270,
            
            )

        # Convert output bytes to a byte stream
        output_stream = io.BytesIO(output)

        return StreamingResponse(output_stream, media_type="image/png")
    except Exception as e:
        logger.error("Error processing image: %s", str(e))
        raise HTTPException(status_code=500, detail="Error processing image")

