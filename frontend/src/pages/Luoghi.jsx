import { useState } from 'react'
const CERIMONIA = {
  nome: 'Basilica di Santa Chiara',
  indirizzo: 'Via Santa Chiara, 49/C – Napoli (NA)',
  orario: 'Sabato 14 Giugno 2025 · ore 15:00',
  note: 'Vi preghiamo di essere presenti almeno 15 minuti prima dell’inizio della cerimonia.',
  coords: { lat: 40.8476, lng: 14.2522 },
}

const RICEVIMENTO = {
  nome: 'Villa Domi',
  indirizzo: 'Salita Scudillo, 19/A – Napoli (NA)',
  orario: 'A seguire · ore 17:00',
  note: 'Il ricevimento si terrà negli splendidi giardini panoramici della villa. In caso di pioggia, l’evento si svolgerà negli eleganti saloni interni.',
  coords: { lat: 40.8660, lng: 14.2450 },
}

const PARCHEGGI = [
  {
    icon: '🅿️',
    titolo: 'Parcheggio Villa',
    desc: 'Parcheggio gratuito disponibile all’interno della struttura con accesso riservato agli invitati.',
  },
  {
    icon: '🚌',
    titolo: 'Servizio navetta',
    desc: 'Navetta gratuita dal centro di Napoli (Piazza Municipio) con partenze ogni 30 minuti dalle 16:00.',
  },
  {
    icon: '🚕',
    titolo: 'Taxi / NCC',
    desc: 'Consigliamo di prenotare in anticipo. Radio Taxi Napoli: +39 081 8888.',
  },
]

const FUORI_CITTA = [
  {
    icon: '🚂',
    titolo: 'In treno',
    desc: 'La stazione più vicina è Napoli Centrale (Piazza Garibaldi). È collegata con l’alta velocità da Roma, Firenze e Milano. Dalla stazione potete raggiungere la location in taxi o con il servizio navetta.',
  },
  {
    icon: '✈️',
    titolo: 'In aereo',
    desc: 'L’Aeroporto Internazionale di Napoli Capodichino dista circa 8 km dalla cerimonia e dalla location. Sono disponibili taxi, NCC e servizi di transfer privati.',
  },
  {
    icon: '🏨',
    titolo: 'Dove dormire',
    desc: 'Consigliamo di soggiornare nel centro storico di Napoli, nella zona di Chiaia o sul Lungomare Caracciolo, dove troverete numerosi hotel e B&B a pochi minuti dalle location.',
  },
]