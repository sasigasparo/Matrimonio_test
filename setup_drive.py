"""
Script una-volta-sola per ottenere il Google Drive refresh token.
Esegui:  python setup_drive.py
"""
import os
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

load_dotenv("backend/.env")

CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI  = "http://localhost:9999/callback"

if not CLIENT_ID or not CLIENT_SECRET:
    print("❌ GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET mancanti nel backend/.env")
    exit(1)

from google_auth_oauthlib.flow import Flow

flow = Flow.from_client_config(
    {
        "web": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=["https://www.googleapis.com/auth/drive.file"],
    redirect_uri=REDIRECT_URI,
)

auth_url, _ = flow.authorization_url(access_type="offline", prompt="consent")

print("\n🔗 Apro il browser per l'autorizzazione Google...")
print(f"   Se il browser non si apre, vai su:\n   {auth_url}\n")
webbrowser.open(auth_url)

refresh_token_result = {}

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        code = params.get("code", [None])[0]
        if not code:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Errore: nessun codice ricevuto.")
            return

        flow.fetch_token(code=code)
        token = flow.credentials.refresh_token
        refresh_token_result["token"] = token

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            f"<h2>✅ Autorizzazione completata!</h2>"
            f"<p>Torna al terminale per il prossimo step.</p>".encode()
        )

    def log_message(self, *args):
        pass  # silenzia i log HTTP

print("⏳ Aspetto che tu autorizzi nel browser...")
server = HTTPServer(("localhost", 9999), CallbackHandler)
server.handle_request()

token = refresh_token_result.get("token")
if not token:
    print("❌ Nessun refresh token ricevuto.")
    exit(1)

print(f"\n✅ Refresh token ottenuto!\n")

env_path = "backend/.env"
with open(env_path, "r") as f:
    content = f.read()

if "GOOGLE_REFRESH_TOKEN=" in content:
    lines = content.splitlines()
    new_lines = [
        f"GOOGLE_REFRESH_TOKEN={token}" if line.startswith("GOOGLE_REFRESH_TOKEN=") else line
        for line in lines
    ]
    with open(env_path, "w") as f:
        f.write("\n".join(new_lines))
    print(f"✅ GOOGLE_REFRESH_TOKEN aggiornato automaticamente in {env_path}")
else:
    print(f"⚠️  Aggiungi manualmente al backend/.env:")
    print(f"   GOOGLE_REFRESH_TOKEN={token}")
