import numpy as np
from app.services.decision_engine import DecisionEngine
from app.services.pipeline import InferencePipeline


def test_decision_engine():
    engine = DecisionEngine()

    # Test plastic bottle
    decision = engine.evaluate(label="plastic bottle", material="PET", confidence=0.9)
    assert decision["disposal_bin"] == "Recyclable"
    assert decision["recyclable"] == "Yes"

    # Test organic waste
    decision = engine.evaluate(label="apple core", material="organic", confidence=0.85)
    assert decision["disposal_bin"] == "Organic"

    # Test hazardous battery
    decision = engine.evaluate(label="battery", material="lithium", confidence=0.95)
    assert decision["disposal_bin"] == "Hazardous"


def test_inference_pipeline_execution():
    pipeline = InferencePipeline()
    # Create blank test image (100x100 RGB)
    dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
    result = pipeline.process_image(dummy_img, filename="test.jpg")

    assert "total_objects" in result
    assert "primary_bin" in result
    assert "annotated_image" in result
    assert "processing_time_ms" in result
    assert isinstance(result["items"], list)
