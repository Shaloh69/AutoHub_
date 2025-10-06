import os
import uuid
from typing import Optional
from PIL import Image
import io
from app.config import settings
from fastapi import UploadFile


class FileService:
    """File upload and management service"""
    
    @staticmethod
    async def upload_image(file: UploadFile, folder: str = "cars") -> dict:
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
        
        # Open image with Pillow
        try:
            image = Image.open(io.BytesIO(content))
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
        
        # Get original dimensions
        original_width, original_height = image.size
        
        if settings.USE_LOCAL_STORAGE:
            # Save locally
            result = FileService._save_local(
                image, unique_filename, folder, content
            )
        else:
            # Upload to S3
            result = FileService._upload_to_s3(
                image, unique_filename, folder, content
            )
        
        # Add metadata
        result.update({
            "file_name": file.filename,
            "file_size": file_size,
            "width": original_width,
            "height": original_height
        })
        
        return result
    
    @staticmethod
    def _save_local(image: Image, filename: str, folder: str, content: bytes) -> dict:
        """Save images locally"""
        # Create directories
        base_path = os.path.join(settings.LOCAL_UPLOAD_DIR, folder)
        os.makedirs(base_path, exist_ok=True)
        os.makedirs(os.path.join(base_path, "thumbnails"), exist_ok=True)
        os.makedirs(os.path.join(base_path, "medium"), exist_ok=True)
        
        # Save original
        original_path = os.path.join(base_path, filename)
        with open(original_path, 'wb') as f:
            f.write(content)
        
        # Create thumbnail (200x200)
        thumbnail = FileService._resize_image(image, (200, 200))
        thumbnail_filename = f"thumb_{filename}"
        thumbnail_path = os.path.join(base_path, "thumbnails", thumbnail_filename)
        thumbnail.save(thumbnail_path, quality=85, optimize=True)
        
        # Create medium size (800x600)
        medium = FileService._resize_image(image, (800, 600))
        medium_filename = f"medium_{filename}"
        medium_path = os.path.join(base_path, "medium", medium_filename)
        medium.save(medium_path, quality=90, optimize=True)
        
        # Generate URLs
        base_url = f"/uploads/{folder}"
        
        return {
            "file_url": f"{base_url}/{filename}",
            "thumbnail_url": f"{base_url}/thumbnails/{thumbnail_filename}",
            "medium_url": f"{base_url}/medium/{medium_filename}",
            "large_url": f"{base_url}/{filename}"
        }
    
    @staticmethod
    def _upload_to_s3(image: Image, filename: str, folder: str, content: bytes) -> dict:
        """Upload images to AWS S3"""
        import boto3
        from botocore.exceptions import ClientError
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        bucket = settings.AWS_S3_BUCKET
        
        try:
            # Upload original
            original_key = f"{folder}/{filename}"
            s3_client.put_object(
                Bucket=bucket,
                Key=original_key,
                Body=content,
                ContentType='image/jpeg',
                ACL='public-read'
            )
            
            # Upload thumbnail
            thumbnail = FileService._resize_image(image, (200, 200))
            thumbnail_buffer = io.BytesIO()
            thumbnail.save(thumbnail_buffer, format='JPEG', quality=85, optimize=True)
            thumbnail_key = f"{folder}/thumbnails/thumb_{filename}"
            s3_client.put_object(
                Bucket=bucket,
                Key=thumbnail_key,
                Body=thumbnail_buffer.getvalue(),
                ContentType='image/jpeg',
                ACL='public-read'
            )
            
            # Upload medium
            medium = FileService._resize_image(image, (800, 600))
            medium_buffer = io.BytesIO()
            medium.save(medium_buffer, format='JPEG', quality=90, optimize=True)
            medium_key = f"{folder}/medium/medium_{filename}"
            s3_client.put_object(
                Bucket=bucket,
                Key=medium_key,
                Body=medium_buffer.getvalue(),
                ContentType='image/jpeg',
                ACL='public-read'
            )
            
            # Generate URLs
            base_url = settings.S3_BASE_URL
            
            return {
                "file_url": f"{base_url}/{original_key}",
                "thumbnail_url": f"{base_url}/{thumbnail_key}",
                "medium_url": f"{base_url}/{medium_key}",
                "large_url": f"{base_url}/{original_key}"
            }
            
        except ClientError as e:
            raise ValueError(f"S3 upload failed: {str(e)}")
    
    @staticmethod
    def _resize_image(image: Image, size: tuple) -> Image:
        """Resize image while maintaining aspect ratio"""
        # Convert RGBA to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Calculate aspect ratio
        image.thumbnail(size, Image.Resampling.LANCZOS)
        return image
    
    @staticmethod
    def delete_image(file_url: str) -> bool:
        """Delete image file"""
        if settings.USE_LOCAL_STORAGE:
            return FileService._delete_local(file_url)
        else:
            return FileService._delete_from_s3(file_url)
    
    @staticmethod
    def _delete_local(file_url: str) -> bool:
        """Delete local file"""
        try:
            # Extract path from URL
            path = file_url.replace("/uploads/", settings.LOCAL_UPLOAD_DIR + "/")
            if os.path.exists(path):
                os.remove(path)
            
            # Delete thumbnails and medium sizes
            if "/thumbnails/" not in path and "/medium/" not in path:
                base_name = os.path.basename(path)
                folder = os.path.dirname(path)
                
                thumb_path = os.path.join(folder, "thumbnails", f"thumb_{base_name}")
                if os.path.exists(thumb_path):
                    os.remove(thumb_path)
                
                medium_path = os.path.join(folder, "medium", f"medium_{base_name}")
                if os.path.exists(medium_path):
                    os.remove(medium_path)
            
            return True
        except Exception as e:
            print(f"Error deleting local file: {e}")
            return False
    
    @staticmethod
    def _delete_from_s3(file_url: str) -> bool:
        """Delete file from S3"""
        import boto3
        
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            
            # Extract key from URL
            key = file_url.replace(settings.S3_BASE_URL + "/", "")
            
            s3_client.delete_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=key
            )
            
            # Delete related files
            if "/thumbnails/" not in key and "/medium/" not in key:
                base_name = os.path.basename(key)
                folder = os.path.dirname(key)
                
                thumb_key = f"{folder}/thumbnails/thumb_{base_name}"
                s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=thumb_key)
                
                medium_key = f"{folder}/medium/medium_{base_name}"
                s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=medium_key)
            
            return True
        except Exception as e:
            print(f"Error deleting S3 file: {e}")
            return False