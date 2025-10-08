import os
import uuid
from typing import Optional, Dict
from PIL import Image
import io
from app.config import settings
from fastapi import UploadFile
from app.utils.helpers import sanitize_filename


class FileService:
    """File upload and management service"""
    
    @staticmethod
    async def upload_image(
        file: UploadFile,
        folder: str = "cars",
        resize: bool = True
    ) -> Dict[str, str]:
        """
        Upload and process image file
        Returns dict with URLs for different sizes
        """
        # Validate file type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise ValueError(f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}")
        
        # Read file content
        content = await file.read()
        
        # Validate file size
        file_size = len(content)
        if file_size > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise ValueError(f"File too large. Max size: {settings.MAX_IMAGE_SIZE_MB}MB")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create folder if it doesn't exist
        upload_path = os.path.join(settings.LOCAL_UPLOAD_DIR, folder)
        os.makedirs(upload_path, exist_ok=True)
        
        # Save original
        original_path = os.path.join(upload_path, unique_filename)
        
        result = {
            "file_url": f"/uploads/{folder}/{unique_filename}",
            "file_name": unique_filename,
            "file_size": file_size
        }
        
        if resize:
            # Open image with Pillow
            image = Image.open(io.BytesIO(content))
            
            # Convert RGBA to RGB if necessary
            if image.mode == 'RGBA':
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background
            
            # Save original
            image.save(original_path, quality=90, optimize=True)
            
            # Create thumbnail
            thumbnail = image.copy()
            thumbnail.thumbnail(settings.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
            thumbnail_filename = f"thumb_{unique_filename}"
            thumbnail_path = os.path.join(upload_path, thumbnail_filename)
            thumbnail.save(thumbnail_path, quality=85, optimize=True)
            result["thumbnail_url"] = f"/uploads/{folder}/{thumbnail_filename}"
            
            # Create medium size
            medium = image.copy()
            medium.thumbnail(settings.MEDIUM_SIZE, Image.Resampling.LANCZOS)
            medium_filename = f"medium_{unique_filename}"
            medium_path = os.path.join(upload_path, medium_filename)
            medium.save(medium_path, quality=85, optimize=True)
            result["medium_url"] = f"/uploads/{folder}/{medium_filename}"
            
            # Store dimensions
            result["width"] = image.width
            result["height"] = image.height
        else:
            # Save without resizing
            with open(original_path, 'wb') as f:
                f.write(content)
        
        return result
    
    @staticmethod
    def delete_image(file_path: str) -> bool:
        """Delete image file"""
        try:
            # Remove leading slash if present
            if file_path.startswith('/'):
                file_path = file_path[1:]
            
            full_path = os.path.join(settings.LOCAL_UPLOAD_DIR, file_path.replace('/uploads/', ''))
            
            if os.path.exists(full_path):
                os.remove(full_path)
                
                # Also delete thumbnail and medium if they exist
                directory = os.path.dirname(full_path)
                filename = os.path.basename(full_path)
                
                thumb_path = os.path.join(directory, f"thumb_{filename}")
                if os.path.exists(thumb_path):
                    os.remove(thumb_path)
                
                medium_path = os.path.join(directory, f"medium_{filename}")
                if os.path.exists(medium_path):
                    os.remove(medium_path)
                
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    @staticmethod
    def get_file_url(file_path: str) -> str:
        """Get full URL for file"""
        if file_path.startswith('http'):
            return file_path
        
        if not file_path.startswith('/'):
            file_path = '/' + file_path
        
        return file_path