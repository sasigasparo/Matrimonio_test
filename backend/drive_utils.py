import io
import logging
import os
import time

logger = logging.getLogger("wedding.drive")

FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "1g_UA2ZWyqBzslRA7DM-_fjnmI9cCA6H_")


def _is_configured() -> bool:
    return all([
        os.getenv("GOOGLE_CLIENT_ID"),
        os.getenv("GOOGLE_CLIENT_SECRET"),
        os.getenv("GOOGLE_REFRESH_TOKEN"),
    ])


def get_drive_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = Credentials(
        token=None,
        refresh_token=os.getenv("GOOGLE_REFRESH_TOKEN"),
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/drive.file"],
    )
    creds.refresh(Request())
    logger.debug("🔑 Drive token refreshed OK")
    return build("drive", "v3", credentials=creds)


def upload_to_drive(data: bytes, filename: str, mime_type: str, folder_id: str = None) -> str:
    """
    Upload file to Google Drive folder.
    Returns Drive file ID. Raises on failure.
    """
    if not _is_configured():
        logger.warning("⚠️  DRIVE_SKIP | variabili GOOGLE_* non configurate nel .env")
        return None

    folder = folder_id or FOLDER_ID
    size_kb = len(data) / 1024
    t0 = time.time()

    logger.info(
        "☁️  DRIVE_UPLOAD_START | filename=%s | size=%.1f KB | folder=%s",
        filename, size_kb, folder,
    )

    try:
        from googleapiclient.http import MediaIoBaseUpload

        service = get_drive_service()

        media = MediaIoBaseUpload(
            io.BytesIO(data),
            mimetype=mime_type,
            resumable=False,
        )
        metadata = {"name": filename, "parents": [folder]}

        result = service.files().create(
            body=metadata,
            media_body=media,
            fields="id, name, webViewLink",
        ).execute()

        file_id = result["id"]
        elapsed = int((time.time() - t0) * 1000)
        logger.info(
            "✅ DRIVE_UPLOAD_OK | file_id=%s | filename=%s | %.1f KB | %dms | link=%s",
            file_id, filename, size_kb, elapsed, result.get("webViewLink", ""),
        )
        return file_id

    except Exception as e:
        elapsed = int((time.time() - t0) * 1000)
        logger.error(
            "❌ DRIVE_UPLOAD_FAIL | filename=%s | %dms | %s: %s",
            filename, elapsed, type(e).__name__, e,
        )
        raise


def upload_video_to_drive(data: bytes, filename: str, mime_type: str) -> str:
    """
    Upload video to Drive, make it publicly readable via link.
    Returns webViewLink. Raises on failure.
    """
    if not _is_configured():
        raise RuntimeError("GOOGLE_* env vars non configurate")

    from googleapiclient.http import MediaIoBaseUpload

    size_mb = len(data) / (1024 * 1024)
    t0 = time.time()
    logger.info("🎬 DRIVE_VIDEO_START | filename=%s | size=%.1f MB", filename, size_mb)

    service = get_drive_service()

    media = MediaIoBaseUpload(
        io.BytesIO(data),
        mimetype=mime_type,
        resumable=True,
        chunksize=5 * 1024 * 1024,
    )
    file = service.files().create(
        body={"name": filename, "parents": [FOLDER_ID or ""]},
        media_body=media,
        fields="id, webViewLink",
    ).execute()

    file_id = file["id"]

    service.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
    ).execute()

    elapsed = int((time.time() - t0) * 1000)
    link = file.get("webViewLink", f"https://drive.google.com/file/d/{file_id}/view")
    logger.info("✅ DRIVE_VIDEO_OK | file_id=%s | %.1f MB | %dms | link=%s", file_id, size_mb, elapsed, link)
    return link


def get_auth_url(client_id: str, client_secret: str, redirect_uri: str) -> str:
    """Generate OAuth consent URL (one-time setup)."""
    from google_auth_oauthlib.flow import Flow

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=redirect_uri,
    )
    url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true",
    )
    return url, flow


def exchange_code(flow, code: str) -> str:
    """Exchange auth code for tokens. Returns refresh_token."""
    flow.fetch_token(code=code)
    return flow.credentials.refresh_token
