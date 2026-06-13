# 🌍 Supabase Setup Guide

## 1️⃣ Crea Progetto Supabase

1. Vai a [https://supabase.com](https://supabase.com)
2. Accedi o crea account
3. Crea nuovo progetto
4. Copia **Project URL** e **Anon Key** (da Settings → API)

## 2️⃣ Variabili di Ambiente (.env)

Crea o aggiorna il file `.env` nella root del progetto:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auth
SECRET_KEY=your-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# Admin
ADMIN_EMAILS=mario@example.com,lucia@example.com
```

## 3️⃣ Crea Tabelle in Supabase

Copia e incolla questo SQL nel Supabase Editor (SQL Editor):

```sql
-- Weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  wedding_date TIMESTAMP NOT NULL,
  venue TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id BIGSERIAL PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  rsvp_status TEXT DEFAULT 'pending', -- pending | confirmed | declined
  table_num INTEGER,
  dietary TEXT,
  invite_sent BOOLEAN DEFAULT false,
  google_id TEXT,
  password_hash TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  guest_id BIGINT REFERENCES guests(id) ON DELETE CASCADE,
  content TEXT,
  audio_path TEXT,
  type TEXT DEFAULT 'text', -- text | audio | both
  created_at TIMESTAMP DEFAULT now()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  guest_id BIGINT REFERENCES guests(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  caption TEXT,
  drive_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  course TEXT NOT NULL, -- antipasto | primo | secondo | dessert | drink
  name TEXT NOT NULL,
  description TEXT,
  allergens TEXT,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Menu choices table
CREATE TABLE IF NOT EXISTS menu_choices (
  id BIGSERIAL PRIMARY KEY,
  guest_id BIGINT REFERENCES guests(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(guest_id, item_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP NOT NULL,
  location TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  ip TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_messages_guest_id ON messages(guest_id);
CREATE INDEX idx_photos_guest_id ON photos(guest_id);
CREATE INDEX idx_menu_choices_guest_id ON menu_choices(guest_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

## 4️⃣ Seed dati iniziali

Copia i dati dai CSV nel SQL Editor (opzionale):

```sql
-- Insert a wedding
INSERT INTO weddings (slug, title, bride_name, groom_name, wedding_date, venue)
VALUES ('mario-e-lucia', 'Mario & Lucia', 'Lucia', 'Mario', '2026-09-12', 'Villa Roma');

-- Poi inserirai gli ospiti tramite l'app di registrazione
```

## 5️⃣ Installa dipendenze

```bash
pip install -r requirements.txt
```

## 6️⃣ Avvia l'app

```bash
python main.py
```

---

# 📧 Email & Password Registration (Produzione)

## Flusso Attuale (Localhost)

- ✅ Gli utenti si registrano con **email/password**
- ✅ La password viene **hashata con bcrypt** (12 rounds)
- ✅ Nessuna verifica email (dev)

## Per Produzione 🚀

### Opzione 1️⃣: Usare Supabase Auth

**Vantaggi**: Gestione completa, JWT, 2FA, email verification

```python
# Cambia routers/auth.py per usare Supabase Auth
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/register")
async def register(req: RegisterRequest):
    try:
        # Supabase gestisce tutto (hash, verifica, JWT)
        res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        # res.user contiene l'utente creato
        # res.session contiene il JWT
        return TokenOut(access_token=res.session.access_token)
    except Exception as e:
        raise HTTPException(400, str(e))
```

### Opzione 2️⃣: Verifica Email (Simple)

**Vantaggi**: Controllo totale, Email verification link

```python
import uuid
import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@matrimonio.it")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")

@router.post("/register")
async def register(req: RegisterRequest, request: Request):
    # Salva guest con password hashata
    guest = create_guest(req.name, req.email, password_hash=hash_password(req.password))
    
    # Genera token di verifica
    verify_token = str(uuid.uuid4())
    update_guest(guest["id"], {"email_verify_token": verify_token})
    
    # Invia email
    verify_url = f"http://yourapp.com/api/auth/verify?token={verify_token}"
    send_verification_email(req.email, verify_url)
    
    return {"message": "Check your email to verify account"}

@router.get("/verify")
async def verify_email(token: str):
    """Verifica email tramite token"""
    guest = supabase.table("guests").select("*").eq("email_verify_token", token).execute()
    if guest.data:
        update_guest(guest.data[0]["id"], {
            "email_verified": True,
            "email_verify_token": None
        })
        return {"message": "Email verified! ✅"}
    raise HTTPException(400, "Invalid token")

def send_verification_email(to_email: str, verify_url: str):
    """Invia email di verifica"""
    try:
        msg = MIMEText(f"""
        Clicca qui per verificare la tua email:
        {verify_url}
        """)
        msg["Subject"] = "Verifica la tua email - Wedding App"
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        logger.error(f"Email send error: {e}")
```

### Opzione 3️⃣: SendGrid / Mailgun

```python
# pip install sendgrid

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

def send_verification_email(to_email: str, verify_url: str):
    message = Mail(
        from_email='noreply@matrimonio.it',
        to_emails=to_email,
        subject='Verifica la tua email',
        html_content=f'<a href="{verify_url}">Clicca qui</a>')
    
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    sg.send(message)
```

## ✅ Checklist Produzione

- [ ] Setup HTTPS (letsencrypt)
- [ ] Configura SMTP (Gmail, SendGrid, etc)
- [ ] Email verification enabled
- [ ] Rate limiting su endpoints auth
- [ ] CORS configured properly
- [ ] Environment variables in production
- [ ] Database backups automated
- [ ] Monitor audit_log
- [ ] 2FA per admin users

---

## 🔗 Link Utili

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Python Client](https://github.com/supabase/supabase-py)
- [bcrypt docs](https://github.com/pyca/bcrypt)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
