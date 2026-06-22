# Wedding App — Sofia & Marco

Sito web interattivo per matrimoni con chat in tempo reale, galleria foto, gestione ospiti, quiz e molto altro. Stack: **FastAPI** (backend) + **React/Vite** (frontend), storage su **Supabase**, deploy su **Render** + **GitHub Pages**.

---

## Struttura del progetto

```
wedding_app_Copia/
├── backend/                  # API Python (FastAPI)
│   ├── main.py               # Entry point, CORS, middleware, logging
│   ├── auth_config.py        # JWT auth, Google OAuth
│   ├── database.py           # Client Supabase
│   ├── drive_utils.py        # Upload su Google Drive
│   ├── image_utils.py        # Compressione immagini (Pillow)
│   └── routers/
│       ├── auth.py           # Login, JWT, Google OAuth
│       ├── guests.py         # Gestione ospiti, RSVP, email
│       ├── messages.py       # Chat (testo, audio, foto, video)
│       ├── photos.py         # Galleria foto
│       ├── menu.py           # Menu e scelte dietetiche
│       ├── quiz.py           # Quiz e classifiche
│       ├── tables.py         # Disposizione tavoli
│       ├── chatbot.py        # Chatbot AI (Groq / Llama)
│       └── admin.py          # Dashboard admin
├── frontend/                 # SPA React (Vite)
│   ├── src/
│   │   ├── pages/            # 14 pagine (vedi sotto)
│   │   ├── components/       # Componenti riutilizzabili
│   │   │   ├── chat/         # Bubble, AudioBubble, CameraModal…
│   │   │   ├── WeddingChatbot.jsx
│   │   │   └── LanguageSwitch.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx
│   │   │   ├── useLanguage.jsx
│   │   │   └── useToast.jsx
│   │   ├── config/
│   │   │   └── wedding.js    # Config centrale (nomi, date, sedi, colori…)
│   │   └── utils/
│   │       └── translations.js  # Stringhe IT / EN
│   └── index.css             # Design system (variabili CSS, componenti)
├── requirements.txt
├── render.yaml               # Deploy Render (backend)
├── setup_drive.py            # Setup Google Drive OAuth (one-time)
└── README.md
```

---

## Funzionalità

| Sezione | Cosa fa |
|---|---|
| **Home** | Countdown al matrimonio, info coppia, meteo a 3 giorni, playlist Spotify |
| **Chat** | Messaggi testo, vocali (WebM/MP3), foto (compressa) e video (Drive) |
| **Galleria** | Upload e visualizzazione foto condivise dagli ospiti |
| **RSVP** | Conferma presenza, preferenze dietetiche |
| **Menu** | Visualizzazione portate con filtri allergenici |
| **Quiz** | Giochi a tema matrimonio con classifica |
| **Tavoli** | Disposizione posti (accesso con password) |
| **Luoghi** | Cerimonia e ricevimento con info logistiche |
| **Regali** | Lista nozze e IBAN |
| **FAQ** | Domande frequenti (IT/EN) |
| **Chatbot** | Assistente AI basato su Groq (Llama 3.1) |
| **Admin** | Gestione ospiti, statistiche RSVP, audit log, inviti email |

---

## Stack tecnico

### Backend

- **FastAPI** 0.115 + **Uvicorn**
- **Supabase** — database PostgreSQL + Storage per media (foto, audio)
- **Google Drive API** — archivio video
- **Groq API** (Llama 3.1-8B) — chatbot AI gratuito
- **SMTP** — inviti email
- **Pillow** — compressione immagini lato server
- **JWT** (HS256, 30 giorni) + **bcrypt** (12 rounds) per l'autenticazione
- **Google OAuth 2.0** — login con Google

### Frontend

- **React 18** + **React Router 6**
- **Vite 5** — build tool
- **Supabase JS** — accesso diretto a Storage da frontend
- Stili inline + design system CSS (variabili in `index.css`)
- i18n manuale IT/EN via `useLanguage` hook

---

## Autenticazione

Il sistema supporta due tipologie di utenti:

- **Ospiti registrati** — login con email/password o Google OAuth, ricevono un JWT valido 30 giorni
- **Ospiti anonimi** — accedono alla chat e alla gallery inserendo solo il nome (nessun account)

L'admin è determinato dalla lista `ADMIN_EMAILS` nel `.env`.

---

## Variabili d'ambiente (backend)

Creare un file `.env` nella root del backend:

```env
# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<service_role_key>
SUPABASE_BUCKET=wedding-photos

# Auth
SECRET_KEY=<chiave_jwt_sicura>
ADMIN_EMAILS=admin@example.com,altro@example.com

# Google Drive (video)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...

# Chatbot AI
GROQ_API_KEY=...

# Email inviti
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Dati matrimonio (per template email)
COUPLE_NAMES=Sofia & Marco
WEDDING_DATE=14 Giugno 2027
WEDDING_VENUE=Villa Doria d'Angri, Napoli
APP_URL=https://tuosito.github.io
```

### Variabili d'ambiente (frontend)

Creare `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000   # dev
# VITE_API_URL=https://matrimonio-test.onrender.com  # prod
```

---

## Avvio in locale

### Backend

```bash
cd wedding_app_Copia
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

API disponibile su `http://localhost:8000`. Docs interattivi: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponibile su `http://localhost:5173`

---

## Deploy

### Backend — Render

Il file `render.yaml` configura il deploy automatico su [Render](https://render.com):

- Runtime: Python 3.11.9
- Build: `pip install -r requirements.txt`
- Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

Impostare le variabili d'ambiente nel dashboard Render.

### Frontend — GitHub Pages

Push su `main` → GitHub Actions compila il frontend e lo pubblica su GitHub Pages automaticamente (vedi `.github/workflows/`).

---

## Tabelle Supabase

| Tabella | Contenuto |
|---|---|
| `guests` | Ospiti, credenziali, preferenze dietetiche, RSVP |
| `messages` | Messaggi chat (testo, audio, foto, video) |
| `photos` | Foto galleria con URL Supabase Storage |
| `menu_items` | Portate del menu con flag allergenici |
| `quiz_scores` | Punteggi quiz per classifica |
| `audit_log` | Log azioni admin |

---

## Configurazione matrimonio

Tutto il contenuto specifico del matrimonio si trova in `frontend/src/config/wedding.js`:
nomi sposi, data, sedi, coordinate GPS, IBAN, ID playlist Spotify, colori tema, password admin.

Per adattare l'app a un altro matrimonio basta modificare quel file.

---

## Sicurezza

- Solo il proprietario di un messaggio/foto può eliminarlo (controllo `guest_id` + `sub` lato backend)
- Gli ospiti anonimi (`guest_id = NULL`) **non possono** eliminare contenuti altrui
- Solo gli admin (via `ADMIN_EMAILS`) hanno accesso alle API admin e alla dashboard
- Audit log di tutte le azioni sensibili
- JWT con scadenza 30 giorni, segreto configurabile
