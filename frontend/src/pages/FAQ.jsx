import { useState } from 'react'
const FAQS = [
  {
    categoria: 'Ospiti',
    icon: '👥',
    domande: [
      {
        q: 'Posso portare un accompagnatore non invitato?',
        a: 'Per motivi organizzativi il numero di posti è limitato e la lista degli invitati è stata definita con grande cura. Se hai una richiesta particolare, contattaci e faremo il possibile per aiutarti.',
      },
      {
        q: 'I bambini sono invitati?',
        a: 'Assolutamente sì, i più piccoli sono i benvenuti! Abbiamo previsto un menù dedicato e alcuni spazi dove potranno divertirsi in serenità. Ti chiediamo di indicare la loro presenza durante la conferma dell’invito.',
      },
      {
        q: 'Posso portare il mio animale domestico?',
        a: 'Ci dispiace, ma per ragioni organizzative e nel rispetto della struttura che ci ospita, non sarà possibile portare animali domestici.',
      },
    ],
  },

  {
    categoria: 'Dress code',
    icon: '👗',
    domande: [
      {
        q: 'Qual è il dress code del matrimonio?',
        a: 'L’abbigliamento richiesto è elegante. Per gli uomini suggeriamo abito o completo con giacca; per le donne un abito elegante o un tailleur. Vi chiediamo gentilmente di evitare il bianco, riservato alla sposa.',
      },
      {
        q: 'Che scarpe consigliate?',
        a: 'La cerimonia si svolgerà in una basilica nel centro storico di Napoli, mentre il ricevimento sarà in una villa con spazi esterni panoramici. Consigliamo scarpe eleganti ma comode, soprattutto per chi desidera godersi la festa fino a tarda notte.',
      },
    ],
  },

  {
    categoria: 'Logistica',
    icon: '🚗',
    domande: [
      {
        q: 'A che ora iniziano la cerimonia e il ricevimento?',
        a: 'La cerimonia inizierà alle ore 15:00. A seguire ci sposteremo per il ricevimento, che avrà inizio intorno alle 17:00 con aperitivo, cena e festa fino a tarda sera.',
      },
      {
        q: 'Dove posso parcheggiare?',
        a: 'La location del ricevimento dispone di un parcheggio riservato agli invitati. Sono inoltre disponibili servizi di taxi e navetta dalle principali zone del centro di Napoli.',
      },
      {
        q: 'È previsto un servizio navetta?',
        a: 'Sì, sarà disponibile un servizio navetta da e verso il centro di Napoli in orari prestabiliti. Ti consigliamo di prenotare il posto durante la conferma della presenza.',
      },
      {
        q: 'Cosa succede in caso di maltempo?',
        a: 'Nessuna preoccupazione: la location dispone di splendidi spazi interni che permetteranno di vivere la giornata senza alcuna modifica al programma.',
      },
    ],
  },

  {
    categoria: 'Cibo & bevande',
    icon: '🍽️',
    domande: [
      {
        q: 'Sono disponibili menù vegetariani o vegani?',
        a: 'Certamente. Abbiamo previsto alternative vegetariane e vegane per permettere a tutti gli ospiti di godersi il pranzo o la cena al meglio.',
      },
      {
        q: 'Ci sono opzioni per allergie, intolleranze o esigenze particolari?',
        a: 'Sì. La cucina della struttura è preparata a gestire allergie, intolleranze alimentari e altre esigenze specifiche. Ti chiediamo di comunicarcele in anticipo.',
      },
      {
        q: 'Come posso comunicare le mie esigenze alimentari?',
        a: 'Durante la conferma della presenza troverai una sezione dedicata alle esigenze alimentari, dove potrai indicare allergie, intolleranze o preferenze come menù vegetariano, vegano o senza glutine.',
        link: {
          label: '🍽️ Conferma presenza e indica le tue preferenze',
          href: 'https://sasigasparo.github.io/Matrimonio_test/rsvp'
        }
      },
      {
        q: 'È previsto un open bar?',
        a: 'Sì! Dopo il ricevimento e fino al termine della serata sarà disponibile un open bar con cocktail, vini selezionati, bollicine e bevande analcoliche.',
      },
    ],
  },

  {
    categoria: 'Regalo',
    icon: '🎁',
    domande: [
      {
        q: 'Cosa possiamo regalare agli sposi?',
        a: 'La vostra presenza nel nostro giorno speciale è già il regalo più bello. Per chi desiderasse farci un pensiero, abbiamo organizzato una lista nozze e altre informazioni saranno comunicate direttamente agli invitati.',
      },
      {
        q: 'È possibile fare un regalo in denaro?',
        a: 'Sì, sarà molto gradito e contribuirà a realizzare il viaggio di nozze dei nostri sogni. Grazie di cuore per il vostro affetto.',
      },
    ],
  },
]



function FaqItem({ domanda, risposta, link }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--cream)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>
          {domanda}
        </span>
        <span
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
            transition: 'transform .25s',
            color: 'var(--rose)',
            fontSize: '1.2rem',
          }}
        >
          ＋
        </span>
      </button>

      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height .3s ease',
        }}
      >
        <p style={{ padding: '0 20px 10px', color: 'var(--warm-gray)' }}>
          {risposta}
        </p>

        {link && (
          <div style={{ padding: '0 20px 20px' }}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              {link.label}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FAQ() {
  const [categoriaAttiva, setCategoriaAttiva] = useState(null)

  const categorieVisibili = categoriaAttiva
    ? FAQS.filter(c => c.categoria === categoriaAttiva)
    : FAQS

  return (
    <div style={{ padding: '60px 20px 120px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>
        Domande frequenti
      </h1>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 30 }}>
        <button onClick={() => setCategoriaAttiva(null)}>Tutte</button>
        {FAQS.map(c => (
          <button
            key={c.categoria}
            onClick={() =>
              setCategoriaAttiva(prev => prev === c.categoria ? null : c.categoria)
            }
          >
            {c.icon} {c.categoria}
          </button>
        ))}
      </div>

      {categorieVisibili.map(cat => (
        <div key={cat.categoria} style={{ marginBottom: 20 }}>
          <h2>{cat.icon} {cat.categoria}</h2>
          {cat.domande.map((faq, i) => (
            <FaqItem
              key={i}
              domanda={faq.q}
              risposta={faq.a}
              link={faq.link}
            />
          ))}
        </div>
      ))}
    </div>
  )
}