# TODO

## 📧 Email / invii
- [ ] **Le email via Brevo risultano "Bloccate" (90%) nelle statistiche**, nonostante l'API risponda 201 e la blocklist contatti sia vuota. Causa più probabile: dominio del sender non autenticato (SPF/DKIM) su Brevo → Settings → Senders, Domains & Dedicated IPs → verificare/autenticare il dominio di `BREVO_SENDER_EMAIL`.
  - Aggiunto endpoint `/api/webhooks/brevo` per ricevere gli eventi reali di consegna (delivered/blocked/bounce/spam) con il motivo — da configurare su Brevo (Transactional → Settings → Webhooks) puntando a `{APP_URL}/api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET>`
  - Impostare la env var `BREVO_WEBHOOK_SECRET` su Render (valore a piacere, usato per validare le chiamate in arrivo dal webhook)
  - Una volta configurato il webhook, rifare un invio di prova e controllare i log per il motivo esatto del blocco

## 👥 Ospiti
- [ ] Aggiungere manualmente dal pannello Admin i 2 ospiti senza email: **Vasiliki Kontotoli** e **Jonathan Kauffmann** (non possono fare login da soli, RSVP va gestito per loro conto)
- [ ] Confermare nome ed email dei 2 posti ancora **TBU** (#28, #29) e aggiungerli allo script/DB quando pronti

## ✉️ Inviti
- [ ] Verificare/testare l'invio inviti dal pannello Admin (`send_invite` / `send_all_invites`) dopo il cambio a Brevo, prima dell'invio massivo reale
