import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health():
    response = client.get("/api/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "models" in data


def test_history_empty():
    response = client.get("/api/history/")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    assert "total" in data
