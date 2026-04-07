"""Site config API - static/site configuration for frontend"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from config import SITE_CONFIG_FILE

router = APIRouter()


def _load_site_config() -> dict:
    path = Path(SITE_CONFIG_FILE)
    if not path.exists():
        return {
            "appName": "Kazakh Hub",
            "contact": {"email": "", "phone": "", "address": "", "addressEn": "Kazakhstan"},
            "externalLinks": [],
            "fileConfig": {
                "maxFileSizeBytes": 31457280,
                "maxFileSizeMB": 30,
                "supportedExtensions": [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".h", ".html", ".css", ".json", ".md", ".xml", ".yaml", ".yml"]
            },
            "apiDisplayUrl": "http://127.0.0.1:3000/api"
        }
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to load site config: {e}")


@router.get("/config", response_model=dict)
async def get_config():
    """Return site configuration (app name, contact, external links, file limits) for frontend."""
    return _load_site_config()
