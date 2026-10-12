import hashlib
import json
import logging
import os
import time
from typing import Optional, Dict, Any
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

class NoSQLCacheService:
    """
    Production-grade NoSQL storage and caching service.
    Primary engine: MongoDB (using PyMongo).
    Automatic zero-setup fallback: TinyDB (file-based NoSQL document database).
    Supports TTL expiration, deterministic query hashing, and document persistence.
    """

    def __init__(self):
        self.use_mongo = False
        self.mongo_client = None
        self.db = None
        self.tinydb_instance = None
        self._init_database()

    def _init_database(self):
        # 1. Attempt MongoDB connection
        try:
            import pymongo
            client = pymongo.MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Test connection
            client.admin.command('ping')
            self.mongo_client = client
            self.db = client[settings.MONGODB_DB_NAME]
            # Ensure indexes
            self.db.weather_cache.create_index("cache_key", unique=True)
            self.db.analysis_cache.create_index("cache_key", unique=True)
            self.use_mongo = True
            logger.info("Successfully connected to primary MongoDB NoSQL database.")
            return
        except Exception as e:
            logger.info(f"MongoDB not reachable ({e}). Falling back to TinyDB file-based NoSQL document engine.")

        # 2. Fallback to TinyDB
        try:
            from tinydb import TinyDB, Query
            db_dir = Path(settings.TINYDB_PATH).parent
            db_dir.mkdir(parents=True, exist_ok=True)
            self.tinydb_instance = TinyDB(settings.TINYDB_PATH)
            self.tinydb_weather = self.tinydb_instance.table("weather_cache")
            self.tinydb_analysis = self.tinydb_instance.table("analysis_cache")
            self.Query = Query()
            self.use_mongo = False
            logger.info(f"Initialized TinyDB NoSQL document store at {settings.TINYDB_PATH}")
        except Exception as err:
            logger.error(f"Failed to initialize TinyDB: {err}")

    @staticmethod
    def generate_weather_key(latitude: float, longitude: float, start_year: int, end_year: int) -> str:
        raw_key = f"weather_{round(latitude, 3)}_{round(longitude, 3)}_{start_year}_{end_year}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    @staticmethod
    def generate_analysis_key(
        latitude: float,
        longitude: float,
        start_year: int,
        end_year: int,
        hazard_type: str,
        threshold_percentile: float,
        min_duration_days: int
    ) -> str:
        raw_key = (
            f"analysis_{round(latitude, 3)}_{round(longitude, 3)}_{start_year}_{end_year}_"
            f"{hazard_type}_{threshold_percentile}_{min_duration_days}"
        )
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def get_weather(self, cache_key: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        try:
            if self.use_mongo and self.db is not None:
                doc = self.db.weather_cache.find_one({"cache_key": cache_key})
                if doc and (now - doc.get("created_at", 0) < settings.CACHE_EXPIRATION_SECONDS):
                    return doc.get("payload")
            elif self.tinydb_instance:
                results = self.tinydb_weather.search(self.Query.cache_key == cache_key)
                if results:
                    doc = results[0]
                    if now - doc.get("created_at", 0) < settings.CACHE_EXPIRATION_SECONDS:
                        return doc.get("payload")
        except Exception as e:
            logger.error(f"Error reading weather cache: {e}")
        return None

    def save_weather(self, cache_key: str, payload: Dict[str, Any]) -> None:
        doc = {
            "cache_key": cache_key,
            "created_at": time.time(),
            "payload": payload
        }
        try:
            if self.use_mongo and self.db is not None:
                self.db.weather_cache.update_one(
                    {"cache_key": cache_key},
                    {"$set": doc},
                    upsert=True
                )
            elif self.tinydb_instance:
                self.tinydb_weather.upsert(doc, self.Query.cache_key == cache_key)
        except Exception as e:
            logger.error(f"Error saving weather cache: {e}")

    def get_analysis(self, cache_key: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        try:
            if self.use_mongo and self.db is not None:
                doc = self.db.analysis_cache.find_one({"cache_key": cache_key})
                if doc and (now - doc.get("created_at", 0) < settings.CACHE_EXPIRATION_SECONDS):
                    return doc.get("payload")
            elif self.tinydb_instance:
                results = self.tinydb_analysis.search(self.Query.cache_key == cache_key)
                if results:
                    doc = results[0]
                    if now - doc.get("created_at", 0) < settings.CACHE_EXPIRATION_SECONDS:
                        return doc.get("payload")
        except Exception as e:
            logger.error(f"Error reading analysis cache: {e}")
        return None

    def save_analysis(self, cache_key: str, payload: Dict[str, Any]) -> None:
        doc = {
            "cache_key": cache_key,
            "created_at": time.time(),
            "payload": payload
        }
        try:
            if self.use_mongo and self.db is not None:
                self.db.analysis_cache.update_one(
                    {"cache_key": cache_key},
                    {"$set": doc},
                    upsert=True
                )
            elif self.tinydb_instance:
                self.tinydb_analysis.upsert(doc, self.Query.cache_key == cache_key)
        except Exception as e:
            logger.error(f"Error saving analysis cache: {e}")

    def get_database_status(self) -> Dict[str, Any]:
        return {
            "engine": "MongoDB" if self.use_mongo else "TinyDB (NoSQL Document Fallback)",
            "status": "connected",
            "is_persistent": True,
            "ttl_seconds": settings.CACHE_EXPIRATION_SECONDS
        }

# Global singleton
cache_service = NoSQLCacheService()
