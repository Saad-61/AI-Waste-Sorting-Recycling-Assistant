import json
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.services.pipeline import InferencePipeline
from app.utils.image_processing import bytes_to_cv2, base64_to_cv2
from app.models.db_models import ScanRecord, DetectedItem

router = APIRouter(prefix="/analyze", tags=["Analyze"])
pipeline = InferencePipeline()


class Base64AnalyzeRequest(BaseModel):
    image_base64: str
    filename: Optional[str] = "webcam_snapshot.jpg"


@router.post("/")
async def analyze_upload(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Accepts either multipart file upload or form/base64 encoded image.
    Executes detection, material classification, XAI saliency generation, and bin recommendation.
    Logs record to SQLite database.
    """
    cv2_image = None
    filename = "uploaded_item.jpg"

    if file is not None:
        contents = await file.read()
        cv2_image = bytes_to_cv2(contents)
        filename = file.filename or filename
    elif image_base64 is not None:
        cv2_image = base64_to_cv2(image_base64)
        filename = "base64_capture.jpg"
    else:
        raise HTTPException(status_code=400, detail="No image file or base64 data provided.")

    if cv2_image is None or cv2_image.size == 0:
        raise HTTPException(status_code=400, detail="Failed to decode image.")

    # Process through pipeline
    result = pipeline.process_image(cv2_image, filename=filename)

    # Persist scan in database
    scan_entry = ScanRecord(
        filename=result["filename"],
        total_objects=result["total_objects"],
        primary_disposal_bin=result["primary_bin"],
        processing_time_ms=result["processing_time_ms"],
        image_base64=result.get("annotated_image")
    )
    db.add(scan_entry)
    db.flush()

    for item in result["items"]:
        detected_entry = DetectedItem(
            scan_id=scan_entry.id,
            label=item["label"],
            confidence=item["confidence"],
            material_type=item.get("material"),
            disposal_bin=item["bin"],
            recyclable=item["recyclable"],
            instructions=item.get("instructions"),
            bbox_coordinates=json.dumps(item["bbox"]),
            xai_saliency_available=1 if item.get("heatmap") else 0
        )
        db.add(detected_entry)

    db.commit()
    db.refresh(scan_entry)

    result["scan_id"] = scan_entry.id
    result["created_at"] = scan_entry.created_at.isoformat()

    return result


@router.post("/base64")
async def analyze_base64(
    payload: Base64AnalyzeRequest,
    db: Session = Depends(get_db)
):
    """JSON API endpoint accepting raw base64 data (ideal for WebcamCapture snapshots)"""
    try:
        cv2_image = base64_to_cv2(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

    if cv2_image is None or cv2_image.size == 0:
        raise HTTPException(status_code=400, detail="Failed to decode image data.")

    result = pipeline.process_image(cv2_image, filename=payload.filename or "webcam.jpg")

    scan_entry = ScanRecord(
        filename=result["filename"],
        total_objects=result["total_objects"],
        primary_disposal_bin=result["primary_bin"],
        processing_time_ms=result["processing_time_ms"],
        image_base64=result.get("annotated_image")
    )
    db.add(scan_entry)
    db.flush()

    for item in result["items"]:
        detected_entry = DetectedItem(
            scan_id=scan_entry.id,
            label=item["label"],
            confidence=item["confidence"],
            material_type=item.get("material"),
            disposal_bin=item["bin"],
            recyclable=item["recyclable"],
            instructions=item.get("instructions"),
            bbox_coordinates=json.dumps(item["bbox"]),
            xai_saliency_available=1 if item.get("heatmap") else 0
        )
        db.add(detected_entry)

    db.commit()
    db.refresh(scan_entry)

    result["scan_id"] = scan_entry.id
    result["created_at"] = scan_entry.created_at.isoformat()

    return result
