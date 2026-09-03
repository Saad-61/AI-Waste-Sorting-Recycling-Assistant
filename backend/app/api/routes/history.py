import json
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.db_models import ScanRecord, DetectedItem
from app.utils.export import export_records_to_csv

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/")
def get_history(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    bin_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns past scans with associated detected items and telemetry"""
    query = db.query(ScanRecord)
    if bin_filter:
        query = query.filter(ScanRecord.primary_disposal_bin == bin_filter)

    total_scans = query.count()
    records = query.order_by(ScanRecord.created_at.desc()).offset(offset).limit(limit).all()

    items_data = []
    for r in records:
        items_data.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "filename": r.filename,
            "total_objects": r.total_objects,
            "primary_bin": r.primary_disposal_bin,
            "processing_time_ms": r.processing_time_ms,
            "detected_items": [
                {
                    "label": it.label,
                    "confidence": it.confidence,
                    "material": it.material_type,
                    "bin": it.disposal_bin,
                    "recyclable": it.recyclable,
                    "instructions": it.instructions,
                    "bbox": json.loads(it.bbox_coordinates) if it.bbox_coordinates else []
                }
                for it in r.detected_items
            ]
        })

    return {
        "total": total_scans,
        "limit": limit,
        "offset": offset,
        "records": items_data
    }


@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """Exports all scan records into downloadable CSV format"""
    records = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).all()
    csv_content = export_records_to_csv(records)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=waste_scan_history.csv"}
    )
