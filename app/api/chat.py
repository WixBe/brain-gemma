import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.agent import run_agent

router = APIRouter()

@router.post("/chat")
async def chat_endpoint(
    message: str = Form(..., description="The user's text question or prompt to the MedGemma agent."),
    image: UploadFile = File(None, description="Optional scan image for the agent to analyze (multipart/form-data).")
):
    image_path = None
    
    if image is not None:
        try:
            file_extension = image.filename.split('.')[-1]
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            image_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            
            with open(image_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
                
            print(f"Saved incoming image to {image_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process image upload: {str(e)}")
            
    try:
        final_answer = run_agent(user_query=message, image_path=image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MedGemma Agent Logic Failed: {str(e)}")
        
    return JSONResponse(content={
        "status": "success",
        "response": final_answer,
        "image_processed": bool(image_path)
    })
