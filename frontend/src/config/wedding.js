// src/config/wedding.js
//
// Unica fonte di verità per TUTTE le informazioni del matrimonio.
// Cambia un valore qui e si propaga automaticamente in tutto il sito
// (traduzioni, countdown, RSVP, FAQ, regali, luoghi, chatbot...).
//
// Le traduzioni in src/i18n/translations.js usano placeholder come
// {{date}}, {{time}}, {{brideName}} ecc. che vengono sostituiti a runtime
// da useLanguage.jsx con i valori presi da qui.

export const WEDDING_CONFIG = {
  couple: {
    groom: "Marco",
    bride: "Sofia",
  },

  date: "14-06-2027",   // formato DD-MM-YYYY, parsato da Home.jsx e formattato da useLanguage.jsx

  // Unica fonte di verità per indirizzi/coordinate: prima erano duplicati
  // (e in parte sbagliati) dentro Luoghi.jsx e translations.js.
  venue: {
    city: "Napoli",

    ceremony: {
      name: "Duomo di Napoli",
      address: "Via Duomo – 80138 Napoli (NA)",
      time: "15:00",
      coords: { lat: 40.8529, lng: 14.2616 },
    },

    reception: {
      name: "Villa Doria d'Angri",
      address: "Via Francesco Petrarca, 80 – Posillipo, Napoli (NA)",
      time: "17:00",
      coords: { lat: 40.8296, lng: 14.2156 },
    },
  },

  // ── Dress code ──────────────────────────────────────────────────────────
  dressCode: {
    style: "Elegante",
    avoid: ["bianco"],   // colori da evitare — solo bianco, riservato alla sposa
  },

  // ── Logistica / trasporti ───────────────────────────────────────────────
  logistics: {
    parking: {
      available: true,
      note: "Parcheggio gratuito disponibile in loco",
    },
    taxi: {
      name: "Radio Taxi Napoli",
      phone: "+39 081 8888",
    },
    shuttle: {
      available: true,
      from: "centro di Napoli",
    },
    airport: {
      name: "Aeroporto di Napoli Capodichino",
      code: "NAP",
      distanceFromCenter: "15/20 min dal centro città",
    },
    trainStation: {
      name: "Napoli Centrale",
      location: "Piazza Garibaldi",
    },
    recommendedAreas: ["Chiaia", "Mergellina", "Centro Storico"],
  },

  // ── Regalo / lista nozze ────────────────────────────────────────────────
  gift: {
    bankTransfer: {
      accountHolder: "Sofia Rossi e Marco Bianchi",   // ← personalizza con i veri nomi/cognomi
      iban: "IT00X0000000000000000000000",            // ← inserisci l'IBAN reale
      bic: "XXXXXXXX",                                  // ← inserisci il BIC/SWIFT reale
      reference: "Regalo di nozze Sofia & Marco",
    },
  },

  // ── Contatti e social ───────────────────────────────────────────────────
  contacts: {
    email: "sofia.marco.wedding@example.com",   // ← personalizza
    phone: "",                                    // opzionale
  },

  social: {
    instagram: "",   // es. "https://instagram.com/sofiaemarco"
    hashtag: "#SofiaEMarco2027",
  },

  theme: {
    primary: "#c8826a",
    secondary: "#5a7a9c",
    background: "#fdf7f2",
  },

  app: {
    name: "Sofia & Marco Wedding",
    version: "1.0.0",
    siteUrl: "https://matrimonio-test.pages.dev",
  },
}