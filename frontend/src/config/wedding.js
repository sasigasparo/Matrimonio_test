// src/config/wedding.js

export const WEDDING_CONFIG = {
  couple: {
    groom: "Marco",
    bride: "Sofia",
  },

  date: "14-06-2027",

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

  theme: {
    primary: "#c8826a",
    secondary: "#5a7a9c",
    background: "#fdf7f2",
  },

  app: {
    name: "Sofia & Marco Wedding",
    version: "1.0.0",
  }
}