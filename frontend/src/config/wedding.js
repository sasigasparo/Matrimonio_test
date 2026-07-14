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
  // Identificativo del matrimonio (multi-tenant). Deve combaciare con lo
  // `slug` nella tabella `matrimoni` su Supabase. Inviato al backend via
  // header X-Matrimonio-Slug per filtrare tutti i dati per questo matrimonio.
  slug: "antonios-petronia",

  couple: {
    groom: "Antonios",
    bride: "Petronia",
    displayName: "Antonios & Petronia",   // usato nell'UI ovunque si mostra il nome coppia
  },

  date: "17-10-2026",        // formato DD-MM-YYYY, parsato da Home.jsx e formattato da useLanguage.jsx
  dateLabel: "17 October 2026",  // etichetta UI (aggiorna insieme a date)

  // Unica fonte di verità per indirizzi/coordinate: prima erano duplicati
  // (e in parte sbagliati) dentro Luoghi.jsx e translations.js.
  venue: {
    city: "Zürich",
    weatherCoords: "47.3769,8.5417",   // coordinate centro città per le previsioni meteo

    ceremony: {
      name: "Stadthaus Zürich",
      address: "Stadthausquai 17, 8001 Zürich",
      time: "11:00",
      coords: { lat: 47.3665, lng: 8.5410 },   // approssimative — verifica su Google Maps
    },

    reception: {
      name: "Estia Home of Taste",
      address: "Hohlstrasse 365, 8004 Zürich",
      time: "17:00",
      coords: { lat: 47.3765, lng: 8.5107 },   // approssimative — verifica su Google Maps
    },
  },

  // ── Dress code ──────────────────────────────────────────────────────────
  dressCode: {
    style: "Elegant",
    avoid: ["white"],   // colori da evitare — solo bianco, riservato alla sposa
  },

  // ── Logistica / trasporti ───────────────────────────────────────────────
  logistics: {
    parking: {
      available: true,
      note: "Paid parking available near both venues in central Zürich",
    },
    taxi: {
      name: "Taxi Zürich",
      phone: "",   // nessun numero specifico fornito — copy usa app di prenotazione
    },
    shuttle: {
      available: false,   // nessuno shuttle confermato — Zürich ha ottimi trasporti pubblici
      from: "",
    },
    airport: {
      name: "Zürich Airport",
      code: "ZRH",
      distanceFromCenter: "circa 15 min dal centro città in treno",
    },
    trainStation: {
      name: "Zürich Hauptbahnhof (Zürich HB)",
      location: "Bahnhofplatz",
    },
    recommendedAreas: ["Altstadt", "Seefeld", "Kreis 4/5"],
  },

  // ── Regalo / lista nozze ────────────────────────────────────────────────
  // Due conti separati: famiglia della sposa (UBS) e famiglia dello sposo (Piraeus).
  gift: {
    bankTransfer: [
      {
        label: "Petronia",
        accountHolder: "Petronia Charalampopoulou",
        bank: "UBS Switzerland",
        iban: "CH06 0021 5215 2874 3440 X",
        bic: "UBSWCHZH80A",
        reference: "Wedding gift for Antonios & Petronia",
      },
      {
        label: "Antonios",
        accountHolder: "Antonios Stougias",
        bank: "Piraeus Bank",
        iban: "GR74 0172 1040 0051 0408 6642 539",
        bic: "PIRBGRAAXXX",
        reference: "Wedding gift for Antonios & Petronia",
      },
    ],
  },

  // ── Contatti e social ───────────────────────────────────────────────────
  contacts: {
    email: "stougiasantony@hotmail.com, petroniachar@gmail.com",
    phone: "",                                    // opzionale
  },

  social: {
    instagram: "",   // es. "https://instagram.com/antoniosepetronia"
    hashtag: "",      // nessun hashtag fornito
  },

  // ── Spotify ────────────────────────────────────────────────────────────────
  // Playlist condivisa separatamente dalla coppia — vuoto finché non arriva l'ID.
  spotify: {
    playlistId: "",   // ID della playlist su open.spotify.com (es. "04hXZMm6GPheiarj7Ib9xo")
  },

  // ── Supabase (storage foto/audio) ──────────────────────────────────────────
  supabase: {
    projectId: "wzwtwbnjcxrwxgiurgqa",
    bucket: "wedding-photos",
  },

  // ── Password di accesso sezioni protette ───────────────────────────────────
  admin: {
    tablePassword: "SPOSA",   // password pagina tavoli
    menuPassword:  "menu",    // password per sbloccare il menù
  },

  // Nota: questi valori sono solo documentazione — i colori effettivi vivono
  // nelle CSS var in frontend/index.css (--rose, --bg, ecc.), non letti da qui.
  theme: {
    primary: "#C76B8B",     // dusty rosewood — vedi frontend/index.css (--rose)
    secondary: "#FBDCE6",   // blush
    background: "#FFFFF0",   // ivory — vedi frontend/index.css (--bg)
  },

  app: {
    name: "Antonios & Petronia Wedding",
    version: "1.0.0",
    siteUrl: "https://matrimonio-test.pages.dev",
    // Foto hero (skyline di Zürich) e foto della cartolina d'invito ufficiale.
    // Metti i file in frontend/public/foto_sfondo/ con questi nomi esatti.
    heroImage: "foto_sfondo/zurich-hero.jpg",
    inviteCardImage: "foto_sfondo/invite-card.jpg",
    luoghiBannerImage: "foto_sfondo/zurich-dusk.jpg",
  },
}