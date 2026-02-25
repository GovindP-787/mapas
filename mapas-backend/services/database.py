"""MongoDB database connections and operations."""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import settings
from models import Announcement
from datetime import datetime
from typing import List, Optional


class MongoDBClient:
    """MongoDB client wrapper."""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize MongoDB connection."""
        if self._client is None:
            try:
                self._client = MongoClient(settings.MONGODB_URL)
                self._db = self._client[settings.MONGODB_DB_NAME]
                # Verify connection
                self._client.admin.command('ping')
                print(f"✓ Connected to MongoDB: {settings.MONGODB_URL}")
            except ConnectionFailure as e:
                print(f"✗ Failed to connect to MongoDB: {e}")
                raise
    
    def get_db(self):
        """Get database instance."""
        return self._db
    
    def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None


class AnnouncementRepository:
    """Repository for announcement operations."""
    
    def __init__(self):
        self.client = MongoDBClient()
        self.db = self.client.get_db()
        self.collection = self.db[settings.MONGODB_ANNOUNCEMENTS_COLLECTION]
    
    def create_announcement(self, announcement: Announcement) -> str:
        """Create a new announcement and store in MongoDB."""
        doc = announcement.model_dump()
        result = self.collection.insert_one(doc)
        return str(result.inserted_id)
    
    def get_all_announcements(self, limit: int = 50) -> List[dict]:
        """Get all announcements with pagination."""
        announcements = list(self.collection.find().sort("created_at", -1).limit(limit))
        # Convert ObjectId to string and map _id to id for Pydantic
        for doc in announcements:
            doc['id'] = str(doc['_id'])
            if '_id' in doc:
                del doc['_id']
        return announcements
    
    def get_announcement_by_id(self, announcement_id: str) -> Optional[dict]:
        """Get announcement by ID."""
        from bson.objectid import ObjectId
        try:
            doc = self.collection.find_one({"_id": ObjectId(announcement_id)})
            if doc:
                doc['id'] = str(doc['_id'])
                if '_id' in doc:
                    del doc['_id']
            return doc
        except:
            return None
    
    def get_announcements_by_type(self, announcement_type: str, limit: int = 50) -> List[dict]:
        """Get announcements filtered by type."""
        announcements = list(
            self.collection.find({"announcement_type": announcement_type})
            .sort("created_at", -1)
            .limit(limit)
        )
        for doc in announcements:
            doc['id'] = str(doc['_id'])
            if '_id' in doc:
                del doc['_id']
        return announcements
    
    def delete_announcement(self, announcement_id: str) -> bool:
        """Delete announcement by ID."""
        from bson.objectid import ObjectId
        from logger import get_logger
        log = get_logger("mapas.database")
        
        try:
            log.info(f"Attempting to delete announcement with ID: {announcement_id}")
            obj_id = ObjectId(announcement_id)
            log.info(f"Converted to ObjectId: {obj_id}")
            
            result = self.collection.delete_one({"_id": obj_id})
            log.info(f"Delete result - Deleted count: {result.deleted_count}")
            
            if result.deleted_count > 0:
                log.info(f"✅ Successfully deleted announcement: {announcement_id}")
            else:
                log.warning(f"❌ No announcement found with ID: {announcement_id}")
            
            return result.deleted_count > 0
        except Exception as e:
            log.error(f"❌ Error deleting announcement {announcement_id}: {str(e)}")
            return False

class CustomerFaceRepository:
    """Repository for customer face operations."""
    
    def __init__(self):
        self.client = MongoDBClient()
        self.db = self.client.get_db()
        self.collection = self.db["customer_faces"]
    
    def create_customer_face(self, customer_face: dict) -> str:
        """Create a new customer face record."""
        result = self.collection.insert_one(customer_face)
        return str(result.inserted_id)
    
    def get_all_customers(self) -> List[dict]:
        """Get all enrolled customers."""
        customers = list(self.collection.find({"is_active": True}).sort("enrollment_date", -1))
        for doc in customers:
            doc['id'] = str(doc['_id'])
            if '_id' in doc:
                del doc['_id']
        return customers
    
    def get_customer_by_id(self, customer_id: str) -> Optional[dict]:
        """Get customer by ID."""
        from bson.objectid import ObjectId
        try:
            doc = self.collection.find_one({"_id": ObjectId(customer_id), "is_active": True})
            if doc:
                doc['id'] = str(doc['_id'])
                if '_id' in doc:
                    del doc['_id']
            return doc
        except:
            return None
    
    def update_face_embedding(self, customer_id: str, face_embedding: str) -> bool:
        """Update customer face embedding."""
        from bson.objectid import ObjectId
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": {"face_embedding": face_embedding}}
            )
            return result.modified_count > 0
        except:
            return False
    
    def delete_customer(self, customer_id: str) -> bool:
        """Soft delete customer by marking as inactive."""
        from bson.objectid import ObjectId
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(customer_id)},
                {"$set": {"is_active": False}}
            )
            return result.modified_count > 0
        except:
            return False


class OperationLogRepository:
    """Repository for operation logs."""
    
    def __init__(self):
        self.client = MongoDBClient()
        self.db = self.client.get_db()
        self.collection = self.db["operation_logs"]
    
    def create_log(self, operation_type: str, level: str, message: str) -> str:
        """Create a new operation log."""
        doc = {
            "operation_type": operation_type,
            "level": level,
            "message": message,
            "timestamp": datetime.now()
        }
        result = self.collection.insert_one(doc)
        return str(result.inserted_id)
    
    def get_logs_by_operation(self, operation_type: str, limit: int = 50) -> List[dict]:
        """Get logs filtered by operation type."""
        logs = list(
            self.collection.find({"operation_type": operation_type})
            .sort("timestamp", -1)
            .limit(limit)
        )
        for doc in logs:
            doc['_id'] = str(doc['_id'])
            if hasattr(doc.get('timestamp'), 'isoformat'):
                doc['timestamp'] = doc['timestamp'].isoformat()
        return logs
    
    def get_all_logs(self, limit: int = 100) -> List[dict]:
        """Get all operation logs."""
        logs = list(self.collection.find().sort("timestamp", -1).limit(limit))
        for doc in logs:
            doc['_id'] = str(doc['_id'])
            if hasattr(doc.get('timestamp'), 'isoformat'):
                doc['timestamp'] = doc['timestamp'].isoformat()
        return logs