---
target: backend/routers/guests.py (invite email template)
total_score: 9
p0_count: 2
p1_count: 2
timestamp: 2026-07-20T09-35-53Z
slug: backend-routers-guests-py-invite-email-template
---
## Design Health Score

Scala adattata: 4/10 euristici Nielsen applicabili a un'email transazionale one-shot (gli altri 6 richiedono stato applicativo persistente, non pertinente qui).

| # | Euristica | Punteggio | Nota chiave |
|---|-----------|-------|-------------|
| 3 | Consistency and Standards | 0-1 | Palette completamente diversa dai token del brand reale |
| 6 | Recognition Rather Than Recall | 3 | Password isolata e ben etichettata, CTA chiaro |
| 8 | Aesthetic and Minimalist Design | 2 | Sovraccarico decorativo (gradiente + ombre multiple + bordo tratteggiato) |
| 2 | Match Between System and Real World | 3 | Metafora "cartolina Polaroid" e "voucher password" funzionano |
| **Totale (4 applicabili)** | | **8-9/16** | **Accettabile, con un P0 grave** |

## Anti-Patterns Verdict

Sì, parziale-forte. LLM review + scan deterministico (`detect.mjs`, exit 2, `single-font: "only font used is georgia"` riga 2) convergono sullo stesso sintomo: struttura da newsletter generica, Georgia ovunque senza pairing serif/sans, bordo tratteggiato caramello che richiama l'anti-reference "template matrimonio rustico 2015" vietato da PRODUCT.md.

## Overall Impression

L'idea concettuale (cartolina Polaroid inclinata che sfonda in un badge nome) è un vero momento-regalo, non il solito clichè. Il problema è l'esecuzione cromatica/tipografica: l'email sembra appartenere a un brand diverso da quello dell'app reale (caramello/terracotta rustico vs rosa cipria moderno Airbnb/Apple-Invites).

## What's Working

1. Cartolina inclinata (-4°) con bordo bianco stile Polaroid che sfonda nel badge nome — idea distintiva.
2. Password isolata in un box dedicato — ottima recognition-over-recall.
3. Apertura calorosa ("We're overjoyed to invite you...") — tono genuino.

## Priority Issues

**[P0] Palette completamente fuori brand** — colori (#c8956c, #e8bfa0, #a9765a, #fdf6f0) senza relazione con i token reali (--rose #C76B8B, --rose-deep #A63D63, --ivory #FFFFF0). Fix: sostituire con i token reali. Comando: /impeccable polish

**[P0] Contrasto WCAG AA fallito** — #c8956c su bianco ~2.6:1 su nome sposi/CTA/password; #888 ~3.5:1 su label/istruzioni. Fix: usare --rose-deep, scurire fill bottone. Comando: /impeccable polish

**[P1] Font Georgia ovunque (confermato da detect.mjs)** — nessun pairing serif-display/sans-body. Fix: stack email-safe a due famiglie. Comando: /impeccable typeset

**[P1/P2] Gradiente diagonale + bordo tratteggiato** — anti-reference esplicito in PRODUCT.md. Fix: sfondo piatto, hairline solido. Comando: /impeccable quieter

**[P2] Leve di brand non sfruttate** — niente countdown/urgenza RSVP/esclusività; copy CTA finale in registro prodotto dentro un momento brand. Comando: /impeccable delight

## Email-client compatibility (Outlook)

linear-gradient non supportato dal motore Word (sfondo cade piatto); transform:rotate ignorato (immagine torna dritta, degrado morbido); border-radius/box-shadow ignorati (tutto diventa rettangoli squadrati, bottone perde forma pillola). Nessun crash, ma su Outlook si perde ogni segnale premium. Gmail/Apple Mail/mobile renderanno correttamente.

## Persona Red Flags

**Jordan**: dissonanza tra cartolina caramello nell'email e app rosa cipria dopo il click sul CTA.
**Sam (contrasto ridotto)**: nome sposi, testo CTA e password — i 3 elementi più importanti — tutti sotto soglia AA.

## Minor Observations

- Footer #bbb su #fdf6f0 quasi illeggibile (basso impatto, testo secondario)
- width="200" + max-width:55% sull'immagine è doppia costrizione ridondante
- Solo htmlContent nel payload Brevo, nessun textContent dedicato

## Questions to Consider

- Il "qui c'è la tua password" (registro prodotto) dovrebbe avere un trattamento visivo separato da "sei invitato" (registro brand)?
- I colori/font dell'email non dovrebbero derivare dagli stessi token CSS dell'app, per evitare che questo drift di palette si ripeta in futuro?
