import csv
import io
from typing import List
from app.models.db_models import ScanRecord


def export_records_to_csv(records: List[ScanRecord]) -> str:
    """Serializes scan records into CSV string format"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Scan ID",
        "Timestamp",
        "Filename",
        "Total Objects",
        "Primary Bin",
        "Processing Time (ms)",
        "Item Label",
        "Item Confidence",
        "Material Type",
        "Disposal Bin",
        "Recyclable Status",
        "Instructions"
    ])

    for record in records:
        if record.detected_items:
            for item in record.detected_items:
                writer.writerow([
                    record.id,
                    record.created_at.isoformat() if record.created_at else "",
                    record.filename or "unknown",
                    record.total_objects,
                    record.primary_disposal_bin or "",
                    f"{record.processing_time_ms:.2f}",
                    item.label,
                    f"{item.confidence:.2f}",
                    item.material_type or "N/A",
                    item.disposal_bin,
                    item.recyclable,
                    item.instructions or ""
                ])
        else:
            writer.writerow([
                record.id,
                record.created_at.isoformat() if record.created_at else "",
                record.filename or "unknown",
                record.total_objects,
                record.primary_disposal_bin or "",
                f"{record.processing_time_ms:.2f}",
                "None", "0.0", "N/A", "N/A", "N/A", "No items detected"
            ])

    return output.getvalue()
