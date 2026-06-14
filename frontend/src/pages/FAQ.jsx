import { useState } from 'react'

const FAQS = [
  {
    categoria: 'Ospiti',
    icon: '👥',
    domande: [
      {
        q: 'Posso portare un accompagnatore non invitato?',
        a: 'Purtroppo il numero di posti è limitato e abbiamo definito la lista con cura. Se vorresti aggiungere qualcuno, contattaci direttamente prima del 1° maggio così valutiamo insieme.',
      },
      {
        q: 'I bambini sono invitati?',
        a: 'Sì, i bambini sono i benvenuti! Abbiamo previsto un\'area giochi nel giardino della villa e un menù dedicato ai più piccoli. Vi chiediamo di segnalarcelo nella sezione RSVP così organizziamo al meglio.',
      },
      {
        q: 'Posso portare il mio animale domestico?',
        a: 'Ci dispiace, ma per rispetto di tutti gli ospiti e delle norme della villa, non è possibile portare animali domestici.',
      },
    ],
  },
  {
    categoria: 'Dress code',
    icon: '👗',
    domande: [
      {
        q: 'C\'è un dress code?',
        a: 'Sì: elegante. Giacca e cravatta per gli uomini, abito o tailleur per le donne. Vi chiediamo gentilmente di evitare il bianco (riservato alla sposa) e il nero totale.',
      },
      {
        q: 'Cosa consigliate per le scarpe? Il terreno è sconnesso?',
        a: 'La cerimonia si svolge in chiesa (pavimento), mentre il ricevimento in parte nei giardini della villa (erba e ciottoli). Consigliamo tacchi non troppo a spillo o, in alternativa, zeppe e sandali flat.',
      },
    ],
  },
  {
    categoria: 'Logistica',
    icon: '🗓️',
    domande: [
      {
        q: 'A che ora inizia e finisce la festa?',
        a: 'La cerimonia è alle 15:00. Il ricevimento inizia alle 17:00 con l\'aperitivo e si concluderà intorno all\'1:00 di notte con il taglio della torta e il brindisi finale.',
      },
      {
        q: 'Dove posso parcheggiare?',
        a: 'La villa dispone di un ampio parcheggio gratuito all\'interno della proprietà. Sono disponibili anche 3 navette gratuite da Piazza del Campo (Siena) con partenze alle 16:00, 16:30 e 17:00.',
      },
      {
        q: 'C\'è un servizio di navetta per tornare in città la sera?',
        a: 'Sì! Organizziamo navette di rientro verso Siena centro alle 23:30 e all\'1:00. Vi chiediamo di prenotare il posto nel form RSVP.',
      },
      {
        q: 'Cosa succede se piove?',
        a: 'Non preoccupatevi: la villa dispone di un elegante salone interno che può ospitare tutti gli invitati. L\'evento si svolgerà comunque senza variazioni di orario.',
      },
    ],
  },
  {
    categoria: 'Cibo & bevande',
    icon: '🍽️',
    domande: [
      {
        q: 'Ci sono opzioni vegetariane o vegane?',
        a: 'Assolutamente sì. Il menù completo è disponibile nella sezione Menù del sito. Abbiamo predisposto portate vegetariane e vegane per ogni corso. Segnalate le vostre preferenze nell\'RSVP.',
      },
      {
        q: 'Ci sono opzioni senza glutine o per allergie?',
        a: 'Sì, la cucina della villa è attrezzata per gestire celiachia e le allergie più comuni. Indicate le vostre esigenze specifiche nell\'RSVP o scriveteci direttamente: faremo il possibile per accontentarvi.',
      },
      {
        q: 'Come segnalo le mie esigenze alimentari?',
        a: 'Puoi farlo direttamente nella sezione Inviti: seleziona il tuo nome, conferma la presenza e troverai la sezione "Esigenze alimentari" dove indicare vegetariano, vegano, senza glutine, senza lattosio o allergie specifiche.',
        link: {
          label: '🍽️ Consulta il menù e segnala le tue esigenze',
          href: 'https://sasigasparo.github.io/Matrimonio_test/rsvp'
        }
      },
      {
        q: 'È previsto un open bar?',
        a: 'Sì! Dall\'aperitivo fino alla fine della serata avrete a disposizione un open bar con vini toscani, cocktail e bevande analcoliche. I vini selezionati provengono direttamente dalle cantine del Chianti.',
      },
    ],
  },
  {
    categoria: 'Regalo',
    icon: '🎁',
    domande: [
      {
        q: 'Cosa possiamo regalare agli sposi?',
        a: 'La vostra presenza è già il regalo più bello. Se volete comunque farci un dono, abbiamo predisposto una lista nozze presso La Rinascente di Firenze. Trovate il codice lista nella busta dell\'invito cartaceo.',
      },
      {
        q: 'È gradita una busta con contanti?',
        a: 'Sì, è assolutamente ben accetta. Ci aiuterà a realizzare il viaggio di nozze che sogniamo.',
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