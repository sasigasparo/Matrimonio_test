# 🎯 Guida Setup Completa - Wedding App

## Prerequisiti

- Python 3.9+
- Node.js 16+
- Git (opzionale)
- Un account Google

## Struttura Progetto

Il codice applicativo si trova nella cartella `Wedding_App`.

- Backend Python: `Wedding_App/main.py`
- Frontend React/Vite: `Wedding_App/package.json`

I comandi sotto vanno eseguiti dentro `Wedding_App`, oppure dalla root usando gli script wrapper dove indicato.

---

## STEP 1: Google Cloud Console Setup (CRITICO)

### 1.1 Crea Progetto Google Cloud

1. Vai a **https://console.cloud.google.com**
2. Clicca **"Select a project"** → **"NEW PROJECT"**
3. Nome: `wedding-app` → Crea

### 1.2 Abilita Google+ API

1. Vai a **APIs & Services** → **Library**
2. Cerca **"Google+ API"**
3. Clicca e seleziona **ENABLE**

### 1.3 Crea OAuth 2.0 Credentials

1. Vai a **APIs & Services** → **Credentials**
2. Clicca **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Se richiesto, configura "OAuth consent screen":
   - **User Type**: External
   - **App name**: Wedding App
   - **User support email**: tua-email@gmail.com
   - **Developer contact**: tua-email@gmail.com
   - Salva e continua
4. Torna a Credentials e clicca di nuovo **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. **Application type**: "Web application"
6. **Authorized redirect URIs**: Aggiungi:
   ```
   http://localhost:8000
   http://localhost:8000/api/auth/callback
   http://localhost:5173
   http://localhost:5173/auth/callback
   ```
7. Crea → **Copia CLIENT_ID e CLIENT_SECRET**

✅ Salvati da qualche parte, li useremo subito

---

## STEP 2: Backend Python Setup

`venv`, `.venv` e cartelle simili non vanno committate nel repo: su Windows gli eseguibili dentro `Scripts/` contengono path assoluti della macchina che li ha creati.

### 2.1 Apri Terminal/PowerShell

```bash
# Naviga nella cartella del progetto
cd /path/to/wedding-app/Wedding_App

# Windows PowerShell? Usa:
cd C:\Users\YourName\Desktop\wedding-app\Wedding_App
```

### 2.2 Crea Virtual Environment

```bash
# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

Se nel repo trovi un vecchio virtualenv committato, eliminalo e ricrealo localmente prima di installare le dipendenze:

```powershell
Remove-Item -Recurse -Force .\venv -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\venvsasi -ErrorAction SilentlyContinue
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Nota:** Dovresti vedere `(venv)` all'inizio della linea di comando

### 2.3 Installa Dipendenze Python

```bash
pip install -r requirements.txt
```

Attendi che finisca (2-3 minuti)

### 2.4 Configura .env

1. Apri il file `.env.example` con un editor di testo
2. **Salva come** `.env` (stessa cartella)
3. Modifica questi campi:

```ini
# ← COPIA I VALORI DA GOOGLE CLOUD
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1a2b3c4d5e6f7g8h9i0j

# ← Generi una stringa casuale (qualsiasi cosa)
SECRET_KEY=my-super-secret-key-change-this-12345!@#$%

# ← La tua email (diventerà admin)
ADMIN_EMAILS=tuonome@gmail.com

# ← Email (opzionale per test, salta se non hai)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuonome@gmail.com
SMTP_PASSWORD=your-app-password

# ← Lascia come è per dev locale
APP_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

**Salva il file .env**

### 2.5 Avvia Backend

```bash
python -m uvicorn main:app --reload
```

Dovresti vedere:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

✅ **Backend pronto!**

Apri browser → http://localhost:8000/docs per API docs interattive

---

## STEP 3: Frontend React Setup

### 3.1 Nuovo Terminal (non chiudere il precedente!)

```bash
# Naviga nella stessa cartella
cd /path/to/wedding-app/Wedding_App
```

Alternativa dalla root del workspace:

```bash
npm run install:frontend
```

### 3.2 Installa Dipendenze Node

```bash
npm install
```

Attendi 2-3 minuti

### 3.3 Avvia Development Server

```bash
npm run dev
```

Alternativa dalla root del workspace:

```bash
cd /path/to/wedding-app
npm run dev
```

Dovresti vedere:
```
➜  Local:   http://localhost:5173/
```

✅ **Frontend pronto!**

Apri browser → http://localhost:5173

---

## STEP 4: Test Login

1. Vai a http://localhost:5173
2. Vedi pulsante **"Accedi con Google"**?
3. Clicca → Seleziona account Google
4. Verifica → Dovresti essere loggato! 🎉

**Se vedi errori:**
- Check `http://localhost:8000/docs` → tutto funziona?
- Terminal backend mostra errori?
- `.env` è configurato correttamente?

---

## STEP 5: Crea Account Admin

Il tuo account Google **è già admin** se configurato in `ADMIN_EMAILS` nel .env

Per verificare:
1. Login
2. Se vedi **Admin** nella navbar → Sei admin ✅

---

## STEP 6: Aggiungi Invitati (Prima di Inviarli Email)

### Metodo 1: Via Admin Panel (UI)

1. Login come admin
2. Clicca **Admin** ⚙️
3. Tab **Invitati**
4. Clicca **+ Aggiungi invitato**
5. Compila:
   - Nome
   - Email
   - Tavolo (opzionale)
   - Esigenze dietetiche (opzionale)
6. Clicca **Aggiungi**

### Metodo 2: Via API (Terminal)

```bash
# Assicurati backend sia in esecuzione
curl -X POST http://localhost:8000/api/guests/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario Rossi",
    "email": "mario@example.com",
    "table_num": 1
  }'
```

(Complesso, usa UI se possibile)

---

## STEP 7: Configura Email (Opzionale)

### Opzione A: Gmail (Consigliato)

1. Account Google → **Gestisci account Google**
2. **Sicurezza** (menu sinistra)
3. Abilita **Verifica in due passaggi**
4. In basso: **Password per app**
5. Seleziona **Mail** e **Windows/Mac**
6. Copia la password generata
7. Modifica `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tuonome@gmail.com
   SMTP_PASSWORD=qqqq qqqq qqqq qqqq
   ```
8. Salva e riavvia backend

### Opzione B: Brevo (FREE - 300 email/giorno)

1. Vai https://www.brevo.com
2. Registrati gratis
3. Vai **SMTP & API**
4. Copia **SMTP Credentials**
5. Modifica `.env`:
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=tuo-email@example.com
   SMTP_PASSWORD=tuo-smtp-key
   ```
6. Salva e riavvia backend

### Test Email
1. Admin Panel → Invitati
2. Seleziona invitato
3. Clicca **📧** (icona mail)
4. Controlla inbox (e spam!)

---

## STEP 8: Personalizzazione

### Cambia Nomi Sposi

Modifica `.env`:
```
COUPLE_NAMES=Sofia & Marco
WEDDING_DATE=14 Giugno 2025
WEDDING_VENUE=Villa Belvedere, Toscana
```

Riavvia backend per applicare

### Cambia Colori del Tema

Modifica `index.css` (linee 1-10):
```css
:root {
  --rose: #c8826a;      /* Colore bottoni - cambia questo */
  --sage: #8a9e8c;      /* Colore secondario */
  /* ... altri colori ... */
}
```

Salva → Browser auto-ricarica

### Aggiungi/Modifica Menù

Modifica `database.py` funzione `_seed_menu()` oppure aggiungi via API

---

## 🚨 Problemi Comuni

### "Google OAuth failed"
❌ **Causa:** CLIENT_ID/SECRET sbagliati
✅ **Soluzione:**
1. Controlla `.env` ha i valori giusti
2. Copia di nuovo da Google Cloud Console
3. Riavvia backend
4. Svuota cache browser (Ctrl+Shift+R)

### "Port 8000 already in use"
❌ **Causa:** Altro processo usa la porta
✅ **Soluzione:**
```bash
# Trova processo (macOS/Linux)
lsof -i :8000

# Termina (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Email non inviate"
❌ **Causa:** SMTP non configurato
✅ **Soluzione:**
1. Controlla `SMTP_HOST`, `USER`, `PASSWORD` in `.env`
2. Prova ad accedere manualmente (se Gmail, controlla spam)
3. Vedi `logs/wedding.log` per errori

### "Frontend non vede backend"
❌ **Causa:** CORS o URL sbagliata
✅ **Soluzione:**
1. Backend è acceso? (http://localhost:8000)
2. Controlla `vite.config.js` ha proxy corretto
3. Frontend riavvia (npm run dev)

### "Token expired dopo login"
✅ **Questo è normale.** Token valido 30 giorni. Logout e login di nuovo.

---

## 🧹 Cleanup Giornaliero

### Reset Database (ATTENZIONE: cancella tutto!)

```bash
# Opzione 1: Elimina il file
rm wedding.db

# Opzione 2: Svuota tabelle
python -c "from database import init_db; init_db()"
```

Riavvia backend → Database rigenerato con menù di default

---

## 📦 Build per Produzione

Quando tutto funziona in locale:

### Backend (Heroku Example)

```bash
# 1. Crea Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# 2. Heroku CLI install (https://devcenter.heroku.com/articles/heroku-cli)
heroku login
heroku create wedding-app-nome
heroku config:set GOOGLE_CLIENT_ID=... --app wedding-app-nome
heroku config:set GOOGLE_CLIENT_SECRET=... --app wedding-app-nome
heroku config:set SECRET_KEY=... --app wedding-app-nome
heroku config:set ADMIN_EMAILS=... --app wedding-app-nome

# 3. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 4. Controlla logs
heroku logs --tail --app wedding-app-nome
```

### Frontend (Vercel Example)

```bash
npm install -g vercel
vercel
# Segui le istruzioni
```

---

## ✅ Checklist Final

- [ ] `.env` creato e compilato
- [ ] Backend avviato (`python -m uvicorn main:app --reload`)
- [ ] Frontend avviato (`npm run dev`)
- [ ] Google OAuth funziona
- [ ] Puoi fare login
- [ ] Vedi admin panel se sei admin
- [ ] (Opzionale) Email configurata e testata

**Se tutti i check sono verdi, sei PRONTO!** 🎉

---

## 🆘 Aiuto

Errori che non capisci?

1. **Leggi i log:**
   ```bash
   # Terminal backend mostra errori
   # Oppure controlla file
   cat logs/wedding.log
   ```

2. **Controlla API docs:**
   ```
   http://localhost:8000/docs
   ```

3. **Browser console:**
   ```
   Premi F12 → Console → Vedi errori JavaScript
   ```

---

Buon matrimonio! 🌸💍

Se tutto va bene, il sito è pronto per il grande giorno.
