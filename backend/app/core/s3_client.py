import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

def get_s3_client():
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.S3_ENDPOINT,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY
    )
    return s3_client

def ensure_bucket_exists(bucket_name: str = settings.S3_BUCKET_NAME) -> bool:
    s3_client = get_s3_client()
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        return True
    except ClientError:
        try:
            s3_client.create_bucket(Bucket=bucket_name)
            return True
        except ClientError as e:
            print(f"Error creating S3 bucket '{bucket_name}': {e}")
            return False

def upload_file_to_s3(file_content: bytes, filename: str, bucket_name: str = settings.S3_BUCKET_NAME):
    s3_client = get_s3_client()
    if not ensure_bucket_exists(bucket_name):
        return False
    try:
        s3_client.put_object(Bucket=bucket_name, Key=filename, Body=file_content)
        return True
    except ClientError as e:
        print(f"Error uploading file to S3: {e}")
        return False

def download_file_from_s3(filename: str, bucket_name: str = settings.S3_BUCKET_NAME) -> bytes:
    s3_client = get_s3_client()
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=filename)
        return response['Body'].read()
    except ClientError as e:
        print(f"Error downloading file from S3: {e}")
        return None

def delete_file_from_s3(filename: str, bucket_name: str = settings.S3_BUCKET_NAME):
    s3_client = get_s3_client()
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=filename)
        return True
    except ClientError as e:
        print(f"Error deleting file from S3: {e}")
        return False