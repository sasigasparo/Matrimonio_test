import { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   DATI — modifica qui le domande reali
   ═══════════════════════════════════════════════════════════════════ */

const QUIZ_SPOSO = {
  id: 'sposo',
  title: 'Quanto conosci Marco?',
  emoji: '🤵',
  color: '#5a7a9c',
  bg: 'rgba(90,122,156,0.1)',
  domande: [
    { testo: 'Qual è il piatto preferito di Marco?', opzioni: ['Carbonara', 'Pizza margherita', 'Lasagne', 'Sushi'], corretta: 0 },
    { testo: 'Dove ha studiato Marco?', opzioni: ['Bologna', 'Milano', 'Roma', 'Torino'], corretta: 1 },
    { testo: 'Qual è il suo sport preferito?', opzioni: ['Calcio', 'Tennis', 'Nuoto', 'Ciclismo'], corretta: 0 },
    { testo: 'Come si chiama il suo migliore amico di infanzia?', opzioni: ['Luca', 'Andrea', 'Matteo', 'Davide'], corretta: 2 },
    { testo: 'Qual è il film preferito di Marco?', opzioni: ['Il Padrino', 'Interstellar', 'Forrest Gump', 'Titanic'], corretta: 1 },
    { testo: 'In che anno ha conosciuto Sofia?', opzioni: ['2018', '2019', '2020', '2021'], corretta: 1 },
    { testo: 'Qual è il suo gruppo musicale preferito?', opzioni: ['Coldplay', 'Radiohead', 'Muse', 'U2'], corretta: 0 },
    { testo: 'Qual è stata la sua prima macchina?', opzioni: ['Fiat 500', 'Volkswagen Golf', 'Ford Fiesta', 'Renault Clio'], corretta: 3 },
    { testo: 'Dove vorrebbe andare in viaggio di nozze?', opzioni: ['Giappone', 'Maldive', 'New York', 'Islanda'], corretta: 0 },
    { testo: 'Qual è il suo hobby segreto?', opzioni: ['Cucina', 'Fotografia', 'Chitarra', 'Pittura'], corretta: 2 },
  ],
}

const QUIZ_SPOSA = {
  id: 'sposa',
  title: 'Quanto conosci Sofia?',
  emoji: '👰',
  color: '#c8826a',
  bg: 'rgba(200,130,106,0.1)',
  domande: [
    { testo: 'Qual è il fiore preferito di Sofia?', opzioni: ['Rosa', 'Peonia', 'Orchidea', 'Girasole'], corretta: 1 },
    { testo: 'Qual è la sua serie TV preferita?', opzioni: ['Friends', 'Fleabag', 'Breaking Bad', 'The Crown'], corretta: 3 },
    { testo: 'Dove è nata Sofia?', opzioni: ['Firenze', 'Siena', 'Napoli', 'Venezia'], corretta: 0 },
    { testo: 'Qual è la sua materia preferita al liceo?', opzioni: ['Matematica', 'Storia dell\'arte', 'Letteratura', 'Filosofia'], corretta: 2 },
    { testo: 'Come si chiama la sua migliore amica?', opzioni: ['Giulia', 'Chiara', 'Valentina', 'Sara'], corretta: 1 },
    { testo: 'Qual è il suo dolce preferito?', opzioni: ['Tiramisù', 'Panna cotta', 'Cannolo', 'Crostata'], corretta: 0 },
    { testo: 'Qual è la sua destinazione da sogno?', opzioni: ['Parigi', 'Tokyo', 'Bali', 'Santorini'], corretta: 3 },
    { testo: 'Quanti anni aveva quando ha iniziato a ballare?', opzioni: ['4', '6', '8', '10'], corretta: 1 },
    { testo: 'Quale artista vorrebbe incontrare?', opzioni: ['Beyoncé', 'Taylor Swift', 'Adele', 'Lady Gaga'], corretta: 2 },
    { testo: 'Qual è il suo libro preferito?', opzioni: ['Jane Eyre', 'Orgoglio e Pregiudizio', 'Anna Karenina', 'Cime Tempestose'], corretta: 1 },
  ],
}

const CRUCIVERBA_DATA = {
  id: 'cruciv',
  title: 'Cruciverba della Coppia',
  emoji: '📝',
  color: '#8a9e8c',
  bg: 'rgba(138,158,140,0.1)',
  parole: [
    { parola: 'SIENA',      indizio: '→ La città del loro matrimonio',           riga: 0, col: 2, dir: 'h' },
    { parola: 'AMORE',      indizio: '→ Quello che li unisce',                   riga: 2, col: 0, dir: 'h' },
    { parola: 'SOFIA',      indizio: '→ La sposa',                               riga: 4, col: 1, dir: 'h' },
    { parola: 'MARCO',      indizio: '→ Lo sposo',                               riga: 6, col: 3, dir: 'h' },
    { parola: 'TOSCA',      indizio: '↓ La regione del matrimonio (prime 5 lettere)', riga: 0, col: 3, dir: 'v' },
    { parola: 'SOLE',       indizio: '↓ Illumina la loro vita',                  riga: 1, col: 6, dir: 'v' },
    { parola: 'MARTE',      indizio: '↓ Pianeta del coraggio — anagramma dello sposo', riga: 2, col: 0, dir: 'v' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════
   LEADERBOARD (localStorage)
   ═══════════════════════════════════════════════════════════════════ */

const LS_KEY = 'wedding_quiz_lb_v1'

function loadLB() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function saveLB(lb) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(lb)) } catch {}
}

function addScore(gameId, name, score, total) {
  const lb = loadLB()
  if (!lb[gameId]) lb[gameId] = []
  lb[gameId].push({ name, score, total, date: Date.now() })
  lb[gameId].sort((a, b) => b.score - a.score || a.date - b.date)
  lb[gameId] = lb[gameId].slice(0, 20)
  saveLB(lb)
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTI UI
   ═══════════════════════════════════════════════════════════════════ */

function ProgressBar({ current, total, color }) {
  return (
    <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{
        height: '100%', borderRadius: 99,
        background: color,
        width: `${(current / total) * 100}%`,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   GIOCO 1 & 2 — Quiz a risposta multipla
   ═══════════════════════════════════════════════════════════════════ */

function QuizGame({ quiz, playerName, onFinish }) {
  const [idx, setIdx]       = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore]   = useState(0)
  const [answered, setAnswered] = useState(false)

  const q = quiz.domande[idx]
  const isLast = idx === quiz.domande.length - 1

  const choose = (i) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.corretta) setScore(s => s + 1)
  }

  const next = () => {
    const newScore = selected === q.corretta ? score : score
    if (isLast) {
      const finalScore = selected === q.corretta ? score + 1 : score
      addScore(quiz.id, playerName, finalScore, quiz.domande.length)
      onFinish(finalScore, quiz.domande.length)
    } else {
      setIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const optColors = (i) => {
    if (!answered) return {
      bg: 'var(--white)', border: '2px solid rgba(200,162,168,0.25)',
      color: 'var(--charcoal)',
    }
    if (i === q.corretta) return { bg: 'rgba(138,158,140,0.15)', border: '2px solid #8a9e8c', color: '#2d5a2e' }
    if (i === selected)   return { bg: 'rgba(200,130,106,0.12)', border: '2px solid #c8826a', color: '#8b3a2a' }
    return { bg: 'var(--ivory)', border: '2px solid rgba(200,162,168,0.15)', color: 'var(--warm-gray)' }
  }

  return (
    <div>
      <ProgressBar current={idx + 1} total={quiz.domande.length} color={quiz.color} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: '.8rem', color: 'var(--warm-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {idx + 1} / {quiz.domande.length}
        </span>
        <span style={{
          background: quiz.bg, color: quiz.color,
          padding: '3px 12px', borderRadius: 99, fontSize: '.8rem', fontWeight: 700,
        }}>
          ✓ {score}
        </span>
      </div>

      <div style={{
        background: quiz.bg, border: `1.5px solid ${quiz.color}30`,
        borderRadius: 'var(--radius-lg)', padding: '24px 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>{quiz.emoji}</div>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: '1.15rem',
          color: 'var(--charcoal)', lineHeight: 1.5, margin: 0,
        }}>
          {q.testo}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {q.opzioni.map((opt, i) => {
          const c = optColors(i)
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              style={{
                width: '100%', padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: c.bg, border: c.border, color: c.color,
                fontFamily: 'inherit', fontSize: '.97rem',
                textAlign: 'left', cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: answered && i === q.corretta ? '#8a9e8c' : answered && i === selected ? '#c8826a' : 'rgba(200,162,168,0.2)',
                color: answered && (i === q.corretta || i === selected) ? '#fff' : 'var(--warm-gray)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.75rem', fontWeight: 700,
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {answered && i === q.corretta && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {answered && i === selected && i !== q.corretta && <span style={{ marginLeft: 'auto' }}>✕</span>}
            </button>
          )
        })}
      </div>

      {answered && (
        <button
          className="btn btn-primary"
          onClick={next}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isLast ? '🏆 Vedi risultato' : 'Prossima →'}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   GIOCO 3 — Cruciverba
   ═══════════════════════════════════════════════════════════════════ */

function buildGrid(parole) {
  let rows = 0, cols = 0
  parole.forEach(p => {
    if (p.dir === 'h') { rows = Math.max(rows, p.riga + 1); cols = Math.max(cols, p.col + p.parola.length) }
    else               { rows = Math.max(rows, p.riga + p.parola.length); cols = Math.max(cols, p.col + 1) }
  })
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null))
  parole.forEach(p => {
    for (let k = 0; k < p.parola.length; k++) {
      const r = p.dir === 'h' ? p.riga : p.riga + k
      const c = p.dir === 'h' ? p.col + k : p.col
      grid[r][c] = p.parola[k]
    }
  })
  return grid
}

function CruciverbGame({ playerName, onFinish }) {
  const { parole } = CRUCIVERBA_DATA
  const grid = buildGrid(parole)
  const ROWS = grid.length
  const COLS = grid[0].length

  const [inputs, setInputs] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  )
  const [checked, setChecked] = useState(false)
  const [score, setScore]     = useState(null)
  const refs = useRef([])

  const setCell = (r, c, val) => {
    const v = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
    const next = inputs.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? v : cell))
    setInputs(next)
    // auto-advance
    if (v && refs.current[r]?.[c + 1]?.cell) refs.current[r][c + 1].cell.focus()
  }

  const check = () => {
    let correct = 0
    parole.forEach(p => {
      let ok = true
      for (let k = 0; k < p.parola.length; k++) {
        const r = p.dir === 'h' ? p.riga : p.riga + k
        const c = p.dir === 'h' ? p.col + k : p.col
        if (inputs[r][c] !== p.parola[k]) ok = false
      }
      if (ok) correct++
    })
    setScore(correct)
    setChecked(true)
    addScore(CRUCIVERBA_DATA.id, playerName, correct, parole.length)
  }

  const cellState = (r, c) => {
    if (!checked || grid[r][c] === null) return 'neutral'
    return inputs[r][c] === grid[r][c] ? 'correct' : inputs[r][c] ? 'wrong' : 'empty'
  }

  const cellStyle = (r, c) => {
    const s = cellState(r, c)
    const base = {
      width: 34, height: 34, border: 'none', outline: 'none',
      textAlign: 'center', fontSize: '.9rem', fontWeight: 700,
      fontFamily: 'var(--font-serif)', textTransform: 'uppercase',
      borderRadius: 4, cursor: 'text', transition: 'background 0.2s',
    }
    if (s === 'correct') return { ...base, background: 'rgba(138,158,140,0.3)', color: '#2d5a2e', border: '1.5px solid #8a9e8c' }
    if (s === 'wrong')   return { ...base, background: 'rgba(200,130,106,0.2)', color: '#8b3a2a', border: '1.5px solid #c8826a' }
    return { ...base, background: 'rgba(200,162,168,0.12)', color: 'var(--charcoal)', border: '1.5px solid rgba(200,162,168,0.3)' }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--charcoal)', marginBottom: 6 }}>
          📝 Cruciverba della Coppia
        </h3>
        <p style={{ color: 'var(--warm-gray)', fontSize: '.88rem' }}>
          Riempi le caselle basandoti sugli indizi. Premi Controlla quando hai finito.
        </p>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', padding: 4, background: 'var(--ivory)', borderRadius: 8 }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => (
                cell !== null ? (
                  <input
                    key={c}
                    maxLength={1}
                    value={inputs[r][c]}
                    onChange={e => setCell(r, c, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !inputs[r][c] && refs.current[r]?.[c - 1]?.cell)
                        refs.current[r][c - 1].cell.focus()
                    }}
                    ref={el => {
                      if (!refs.current[r]) refs.current[r] = []
                      if (!refs.current[r][c]) refs.current[r][c] = {}
                      refs.current[r][c].cell = el
                    }}
                    disabled={checked}
                    style={cellStyle(r, c)}
                  />
                ) : (
                  <div key={c} style={{ width: 34, height: 34, background: 'transparent' }} />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Indizi */}
      <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        {parole.map((p, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '10px 14px', background: 'var(--ivory)',
            borderRadius: 8, fontSize: '.85rem',
          }}>
            <span style={{ color: CRUCIVERBA_DATA.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ color: 'var(--charcoal)' }}>{p.indizio}</span>
            {checked && (() => {
              let ok = true
              for (let k = 0; k < p.parola.length; k++) {
                const r = p.dir === 'h' ? p.riga : p.riga + k
                const c = p.dir === 'h' ? p.col + k : p.col
                if (inputs[r][c] !== p.parola[k]) ok = false
              }
              return <span style={{ marginLeft: 'auto', color: ok ? '#8a9e8c' : '#c8826a' }}>{ok ? '✓' : '✕'}</span>
            })()}
          </div>
        ))}
      </div>

      {!checked ? (
        <button className="btn btn-primary" onClick={check} style={{ width: '100%', justifyContent: 'center' }}>
          🔍 Controlla
        </button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'rgba(138,158,140,0.1)', border: '1.5px solid rgba(138,158,140,0.3)',
            borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 16,
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>
              {score === parole.length ? '🏆' : score > parole.length / 2 ? '🌟' : '💪'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--charcoal)' }}>
              {score} / {parole.length} parole corrette
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onFinish(score, parole.length)} style={{ justifyContent: 'center' }}>
            🏆 Vedi classifica
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA RISULTATO
   ═══════════════════════════════════════════════════════════════════ */

function ResultScreen({ score, total, gameId, gameName, gameEmoji, gameColor, gameBg, playerName, onLeaderboard, onBack }) {
  const pct = Math.round((score / total) * 100)
  const msg = pct === 100 ? ['🏆', 'Perfetto!', 'Conosci ogni segreto!'] :
              pct >= 70   ? ['🌟', 'Ottimo!', 'Li conosci proprio bene!'] :
              pct >= 40   ? ['👍', 'Non male!', 'Ma c\'è ancora qualcosa da scoprire…'] :
                            ['💪', 'Ci vuole più allenamento!', 'Ma l\'importante è esserci!']

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '4rem', marginBottom: 12 }}>{msg[0]}</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--charcoal)', marginBottom: 4 }}>
        {msg[1]}
      </h2>
      <p style={{ color: 'var(--warm-gray)', marginBottom: 32 }}>{msg[2]}</p>

      <div style={{
        background: gameBg, border: `2px solid ${gameColor}40`,
        borderRadius: 'var(--radius-xl)', padding: '32px 24px', marginBottom: 32,
        display: 'inline-block', minWidth: 200,
      }}>
        <div style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', color: gameColor, lineHeight: 1 }}>
          {score}<span style={{ fontSize: '1.5rem', color: 'var(--warm-gray)' }}>/{total}</span>
        </div>
        <div style={{ color: 'var(--warm-gray)', fontSize: '.85rem', marginTop: 6 }}>risposte corrette</div>
        <div style={{
          height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99,
          marginTop: 16, overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: `${pct}%`, background: gameColor, borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onLeaderboard}>🏆 Classifica</button>
        <button className="btn btn-outline" onClick={onBack}>← Torna ai giochi</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LEADERBOARD
   ═══════════════════════════════════════════════════════════════════ */

const GAMES_META = {
  sposo:  { name: 'Marco Quiz',             emoji: '🤵', color: '#5a7a9c' },
  sposa:  { name: 'Sofia Quiz',             emoji: '👰', color: '#c8826a' },
  cruciv: { name: 'Cruciverba della Coppia',emoji: '📝', color: '#8a9e8c' },
}

function Leaderboard({ activeId, onClose }) {
  const lb = loadLB()
  const [tab, setTab] = useState(activeId || 'sposo')
  const entries = lb[tab] || []

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(GAMES_META).map(([id, g]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`btn btn-sm ${tab === id ? 'btn-primary' : 'btn-outline'}`}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--warm-gray)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎮</div>
          <p>Ancora nessun punteggio per questo gioco.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: i === 0 ? 'rgba(200,169,106,0.12)' : i === 1 ? 'rgba(180,180,180,0.1)' : i === 2 ? 'rgba(160,88,64,0.08)' : 'var(--ivory)',
              border: i === 0 ? '1.5px solid rgba(200,169,106,0.4)' : '1.5px solid rgba(200,162,168,0.15)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? 'rgba(200,169,106,0.25)' : i === 1 ? 'rgba(180,180,180,0.2)' : i === 2 ? 'rgba(160,88,64,0.15)' : 'rgba(200,162,168,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i < 3 ? '1rem' : '.8rem', fontWeight: 700,
                color: i === 0 ? '#c8a96a' : i === 1 ? '#888' : i === 2 ? '#a05840' : 'var(--warm-gray)',
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ flex: 1, fontWeight: i < 3 ? 600 : 400, color: 'var(--charcoal)' }}>
                {e.name}
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
                color: GAMES_META[tab].color, fontWeight: 700,
              }}>
                {e.score}<span style={{ fontSize: '.75rem', color: 'var(--warm-gray)', fontWeight: 400 }}>/{e.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline" onClick={onClose} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
        ← Torna ai giochi
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   HUB — scelta del gioco
   ═══════════════════════════════════════════════════════════════════ */

function Hub({ playerName, onSelect, onLeaderboard }) {
  const lb = loadLB()
  const games = [
    { ...QUIZ_SPOSO,        id: 'sposo',  total: QUIZ_SPOSO.domande.length },
    { ...QUIZ_SPOSA,        id: 'sposa',  total: QUIZ_SPOSA.domande.length },
    { ...CRUCIVERBA_DATA,   id: 'cruciv', total: CRUCIVERBA_DATA.parole.length },
  ]

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎮</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--charcoal)', marginBottom: 8 }}>
          Quanto ci conosci?
        </h1>
        <p style={{ color: 'var(--warm-gray)' }}>
          Ciao <strong>{playerName}</strong>! Scegli un gioco 👇
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {games.map(g => {
          const best = (lb[g.id] || []).find(e => e.name === playerName)
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 'var(--radius-lg)',
                background: g.bg, border: `2px solid ${g.color}35`,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: `${g.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', flexShrink: 0,
              }}>
                {g.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '1rem', marginBottom: 2 }}>
                  {g.title}
                </div>
                <div style={{ fontSize: '.82rem', color: 'var(--warm-gray)' }}>
                  {g.total} {g.id === 'cruciv' ? 'parole' : 'domande'}
                </div>
                {best && (
                  <div style={{ fontSize: '.78rem', color: g.color, marginTop: 4, fontWeight: 600 }}>
                    Il tuo record: {best.score}/{best.total}
                  </div>
                )}
              </div>
              <span style={{ color: g.color, fontSize: '1.3rem' }}>→</span>
            </button>
          )
        })}
      </div>

      <button
        className="btn btn-outline"
        onClick={onLeaderboard}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        🏆 Classifica generale
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA NOME
   ═══════════════════════════════════════════════════════════════════ */

function NameScreen({ onStart }) {
  const [name, setName] = useState('')

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 20px',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>💍</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal)', marginBottom: 8 }}>
        Quanto ci conosci?
      </h1>
      <p style={{ color: 'var(--warm-gray)', maxWidth: 380, marginBottom: 40, lineHeight: 1.6 }}>
        3 minigiochi su Sofia &amp; Marco. Sfida gli altri invitati e scala la classifica!
      </p>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ textAlign: 'left', fontWeight: 600, fontSize: '.9rem', color: 'var(--charcoal)' }}>
          Come ti chiami?
        </label>
        <input
          className="input"
          placeholder="Il tuo nome"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onStart(name.trim())}
          autoFocus
          style={{ fontSize: '1.1rem', padding: '14px 16px' }}
        />
        <button
          className="btn btn-primary btn-lg"
          disabled={!name.trim()}
          onClick={() => onStart(name.trim())}
          style={{ justifyContent: 'center', opacity: name.trim() ? 1 : 0.5 }}
        >
          Inizia a giocare →
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════ */

export default function Quiz() {
  const [screen, setScreen]       = useState('name')   // name | hub | game | result | board
  const [playerName, setPlayerName] = useState('')
  const [activeGame, setActiveGame] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const startGame = (name) => { setPlayerName(name); setScreen('hub') }
  const selectGame = (id)  => { setActiveGame(id); setScreen('game') }
  const finishGame = (score, total) => {
    setLastResult({ score, total, gameId: activeGame })
    setScreen('result')
  }

  const gameMeta = activeGame ? GAMES_META[activeGame] : null

  return (
    <div className="page-enter" style={{ padding: '60px 0 120px' }}>
      <div className="container-sm" style={{ padding: '0 20px' }}>

        {screen === 'name' && <NameScreen onStart={startGame} />}

        {screen === 'hub' && (
          <Hub
            playerName={playerName}
            onSelect={selectGame}
            onLeaderboard={() => setScreen('board')}
          />
        )}

        {screen === 'game' && activeGame && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setScreen('hub')}
                style={{ padding: '6px 10px' }}
              >← Giochi</button>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
                color: 'var(--charcoal)', margin: 0,
              }}>
                {gameMeta?.emoji} {gameMeta?.name}
              </h2>
            </div>

            {activeGame === 'sposo' && (
              <QuizGame quiz={QUIZ_SPOSO} playerName={playerName} onFinish={finishGame} />
            )}
            {activeGame === 'sposa' && (
              <QuizGame quiz={QUIZ_SPOSA} playerName={playerName} onFinish={finishGame} />
            )}
            {activeGame === 'cruciv' && (
              <CruciverbGame playerName={playerName} onFinish={finishGame} />
            )}
          </div>
        )}

        {screen === 'result' && lastResult && gameMeta && (
          <ResultScreen
            score={lastResult.score}
            total={lastResult.total}
            gameId={lastResult.gameId}
            gameName={gameMeta.name}
            gameEmoji={gameMeta.emoji}
            gameColor={gameMeta.color}
            gameBg={activeGame ? (activeGame === 'sposo' ? QUIZ_SPOSO.bg : activeGame === 'sposa' ? QUIZ_SPOSA.bg : CRUCIVERBA_DATA.bg) : ''}
            playerName={playerName}
            onLeaderboard={() => setScreen('board')}
            onBack={() => setScreen('hub')}
          />
        )}

        {screen === 'board' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 24 }}>
              🏆 Classifica
            </h2>
            <Leaderboard
              activeId={lastResult?.gameId || 'sposo'}
              onClose={() => setScreen('hub')}
            />
          </div>
        )}

      </div>
    </div>
  )
}
