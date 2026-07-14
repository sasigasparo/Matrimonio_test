# TODO

## 📧 Email / invii
- [ ] **Creare nuovo account Brevo** per l'invio delle email (al momento il backend usa SMTP Gmail — `backend/routers/guests.py:19-22`, host `smtp.gmail.com`)
  - Creare l'account su Brevo e generare una **SMTP key** dedicata
  - Aggiornare `SMTP_HOST` (`smtp-relay.brevo.com`), `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASSWORD` nel `.env` locale
  - Aggiungere le stesse variabili nelle **env vars di Render** (attualmente `render.yaml` non le dichiara — vanno impostate a mano nella dashboard Render, `sync: false`)
  - Fare un invio di prova (a se stessi) prima di lanciare gli inviti veri, per verificare che arrivino e non finiscano in spam

## 👥 Ospiti
- [ ] Aggiungere manualmente dal pannello Admin i 2 ospiti senza email: **Vasiliki Kontotoli** e **Jonathan Kauffmann** (non possono fare login da soli, RSVP va gestito per loro conto)
- [ ] Confermare nome ed email dei 2 posti ancora **TBU** (#28, #29) e aggiungerli allo script/DB quando pronti

## ✉️ Inviti
- [ ] Verificare/testare l'invio inviti dal pannello Admin (`send_invite` / `send_all_invites`) dopo il cambio a Brevo, prima dell'invio massivo reale
