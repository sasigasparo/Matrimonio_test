import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../hooks/useLanguage'

const API = `${(import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')}/api`

/* ═══════════════════════════════════════════════════════════════════
   DATI STRUTTURALI — testi e domande vengono da translations.js,
   qui restano solo i dati "di forma" (colori, griglia cruciverba, ecc.)
   ═══════════════════════════════════════════════════════════════════ */

const META_SPOSO  = { id: 'sposo',  emoji: '🤵', color: '#5a7a9c', bg: 'rgba(90,122,156,0.1)' }
const META_SPOSA  = { id: 'sposa',  emoji: '👰', color: '#c8826a', bg: 'rgba(200,130,106,0.1)' }
const META_CRUCIV = { id: 'cruciv', emoji: '📝', color: '#8a9e8c', bg: 'rgba(138,158,140,0.1)' }

// Le parole del cruciverba sono nomi propri (Marco, Sofia, Napoli, Lara, Daniele, Cruise):
// restano identiche in entrambe le lingue, cambia solo il testo dell'indizio (tradotto).
const CRUCIVERBA_PAROLE = [
  { numero: 1, parola: 'DANIELE', riga: 0, col: 1, dir: 'h' },
  { numero: 5, parola: 'SOFIA',   riga: 3, col: 2, dir: 'h' },
  { numero: 6, parola: 'CRUISE',  riga: 5, col: 0, dir: 'h' },
  { numero: 2, parola: 'NAPOLI',  riga: 0, col: 3, dir: 'v' },
  { numero: 3, parola: 'LARA',    riga: 0, col: 6, dir: 'v' },
  { numero: 4, parola: 'MARCO',   riga: 2, col: 0, dir: 'v' },
]

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

  fetch(`${API}/quiz/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, player_name: name, score, total }),
  }).catch(() => {})
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

function QuizGame({ meta, domande, playerName, onFinish }) {
  const { t } = useLanguage()
  const [idx, setIdx]       = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore]   = useState(0)
  const [answered, setAnswered] = useState(false)

  const q = domande[idx]
  const isLast = idx === domande.length - 1

  const choose = (i) => {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.corretta) setScore(s => s + 1)
  }

  const next = () => {
    if (isLast) {
      const finalScore = selected === q.corretta ? score + 1 : score
      addScore(meta.id, playerName, finalScore, domande.length)
      onFinish(finalScore, domande.length)
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
      <ProgressBar current={idx + 1} total={domande.length} color={meta.color} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: '.8rem', color: 'var(--warm-gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {idx + 1} / {domande.length}
        </span>
        <span style={{
          background: meta.bg, color: meta.color,
          padding: '3px 12px', borderRadius: 99, fontSize: '.8rem', fontWeight: 700,
        }}>
          ✓ {score}
        </span>
      </div>

      <div style={{
        background: meta.bg, border: `1.5px solid ${meta.color}30`,
        borderRadius: 'var(--radius-lg)', padding: '24px 20px', marginBottom: 20,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: 10 }}>{meta.emoji}</div>
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
          {isLast ? t('quiz.seeResult') : t('quiz.nextQuestion')}
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
  const numbers = Array.from({ length: rows }, () => Array(cols).fill(null))
  parole.forEach(p => {
    for (let k = 0; k < p.parola.length; k++) {
      const r = p.dir === 'h' ? p.riga : p.riga + k
      const c = p.dir === 'h' ? p.col + k : p.col
      grid[r][c] = p.parola[k]
      if (k === 0) numbers[r][c] = p.numero
    }
  })
  return { grid, numbers }
}

function isWordCorrect(p, inputs) {
  for (let k = 0; k < p.parola.length; k++) {
    const r = p.dir === 'h' ? p.riga : p.riga + k
    const c = p.dir === 'h' ? p.col + k : p.col
    if (inputs[r][c] !== p.parola[k]) return false
  }
  return true
}

function CruciverbGame({ playerName, onFinish }) {
  const { t } = useLanguage()
  const parole = CRUCIVERBA_PAROLE
  const { grid, numbers } = buildGrid(parole)
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
      if (isWordCorrect(p, inputs)) correct++
    })
    setScore(correct)
    setChecked(true)
    addScore(META_CRUCIV.id, playerName, correct, parole.length)
  }

  const cellState = (r, c) => {
    if (!checked || grid[r][c] === null) return 'neutral'
    return inputs[r][c] === grid[r][c] ? 'correct' : inputs[r][c] ? 'wrong' : 'empty'
  }

  const cellStyle = (r, c) => {
    const s = cellState(r, c)
    const base = {
      width: '100%', height: '100%', border: 'none', outline: 'none',
      textAlign: 'center', fontSize: '.9rem', fontWeight: 700,
      fontFamily: 'var(--font-serif)', textTransform: 'uppercase',
      borderRadius: 4, cursor: 'text', transition: 'background 0.2s',
    }
    if (s === 'correct') return { ...base, background: 'rgba(138,158,140,0.3)', color: '#2d5a2e', border: '1.5px solid #8a9e8c' }
    if (s === 'wrong')   return { ...base, background: 'rgba(200,130,106,0.2)', color: '#8b3a2a', border: '1.5px solid #c8826a' }
    return { ...base, background: 'rgba(200,162,168,0.12)', color: 'var(--charcoal)', border: '1.5px solid rgba(200,162,168,0.3)' }
  }

  const orizzontali = parole.filter(p => p.dir === 'h').sort((a, b) => a.numero - b.numero)
  const verticali   = parole.filter(p => p.dir === 'v').sort((a, b) => a.numero - b.numero)

  const CLUE_CELL = 36

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--charcoal)', marginBottom: 6 }}>
          📝 {t('quiz.cruciverba.title')}
        </h3>
        <p style={{ color: 'var(--warm-gray)', fontSize: '.88rem' }}>
          {t('quiz.crosswordInstructions')}
        </p>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', padding: 4, background: 'var(--ivory)', borderRadius: 8 }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => (
                cell !== null ? (
                  <div key={c} style={{ position: 'relative', width: CLUE_CELL, height: CLUE_CELL }}>
                    {numbers[r][c] != null && (
                      <span style={{
                        position: 'absolute', top: 1, left: 3,
                        fontSize: '.55rem', fontWeight: 700,
                        color: META_CRUCIV.color, lineHeight: 1,
                        zIndex: 2, pointerEvents: 'none',
                      }}>
                        {numbers[r][c]}
                      </span>
                    )}
                    <input
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
                  </div>
                ) : (
                  <div key={c} style={{ width: CLUE_CELL, height: CLUE_CELL, background: 'transparent' }} />
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Indizi */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{
          fontFamily: 'var(--font-serif)', color: META_CRUCIV.color,
          fontSize: '.95rem', margin: '0 0 10px',
        }}>
          {t('quiz.across')}
        </h4>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {orizzontali.map(p => (
            <div key={`h-${p.numero}`} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', background: 'var(--ivory)',
              borderRadius: 8, fontSize: '.85rem',
            }}>
              <span style={{ color: META_CRUCIV.color, fontWeight: 700, flexShrink: 0 }}>{p.numero}.</span>
              <span style={{ color: 'var(--charcoal)' }}>{t(`quiz.cruciverba.clues.${p.numero}`)}</span>
              {checked && (
                <span style={{ marginLeft: 'auto', color: isWordCorrect(p, inputs) ? '#8a9e8c' : '#c8826a' }}>
                  {isWordCorrect(p, inputs) ? '✓' : '✕'}
                </span>
              )}
            </div>
          ))}
        </div>

        <h4 style={{
          fontFamily: 'var(--font-serif)', color: META_CRUCIV.color,
          fontSize: '.95rem', margin: '0 0 10px',
        }}>
          {t('quiz.down')}
        </h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {verticali.map(p => (
            <div key={`v-${p.numero}`} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', background: 'var(--ivory)',
              borderRadius: 8, fontSize: '.85rem',
            }}>
              <span style={{ color: META_CRUCIV.color, fontWeight: 700, flexShrink: 0 }}>{p.numero}.</span>
              <span style={{ color: 'var(--charcoal)' }}>{t(`quiz.cruciverba.clues.${p.numero}`)}</span>
              {checked && (
                <span style={{ marginLeft: 'auto', color: isWordCorrect(p, inputs) ? '#8a9e8c' : '#c8826a' }}>
                  {isWordCorrect(p, inputs) ? '✓' : '✕'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!checked ? (
        <button className="btn btn-primary" onClick={check} style={{ width: '100%', justifyContent: 'center' }}>
          {t('quiz.checkButton')}
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
              {t('quiz.wordsCorrect', { score, total: parole.length })}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onFinish(score, parole.length)} style={{ justifyContent: 'center' }}>
            {t('quiz.seeLeaderboard')}
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA RISULTATO
   ═══════════════════════════════════════════════════════════════════ */

function ResultScreen({ score, total, gameColor, gameBg, onLeaderboard, onBack }) {
  const { t } = useLanguage()
  const pct = Math.round((score / total) * 100)
  const rm = t('quiz.resultMessages')
  const msg = pct === 100 ? rm.perfect :
              pct >= 70   ? rm.great :
              pct >= 40   ? rm.good :
                            rm.low

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
        <div style={{ color: 'var(--warm-gray)', fontSize: '.85rem', marginTop: 6 }}>{t('quiz.correctAnswers')}</div>
        <div style={{
          height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99,
          marginTop: 16, overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: `${pct}%`, background: gameColor, borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onLeaderboard}>{t('quiz.leaderboardButton')}</button>
        <button className="btn btn-outline" onClick={onBack}>{t('quiz.backToGames')}</button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   LEADERBOARD
   ═══════════════════════════════════════════════════════════════════ */

function Leaderboard({ activeId, gamesMeta, onClose }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState(activeId || 'sposo')
  const [remoteScores, setRemoteScores] = useState(null)

  useEffect(() => {
    fetch(`${API}/quiz/scores`)
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        const grouped = {}
        for (const r of rows) {
          if (!grouped[r.game_id]) grouped[r.game_id] = []
          grouped[r.game_id].push({ name: r.player_name, score: r.score, total: r.total, date: new Date(r.created_at).getTime() })
        }
        setRemoteScores(grouped)
      })
      .catch(() => setRemoteScores(loadLB()))
  }, [])

  const lb = remoteScores ?? loadLB()
  const entries = lb[tab] || []

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(gamesMeta).map(([id, g]) => (
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
          <p>{t('quiz.noScoresYet')}</p>
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
                color: gamesMeta[tab].color, fontWeight: 700,
              }}>
                {e.score}<span style={{ fontSize: '.75rem', color: 'var(--warm-gray)', fontWeight: 400 }}>/{e.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline" onClick={onClose} style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
        {t('quiz.backToGames')}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   HUB — scelta del gioco
   ═══════════════════════════════════════════════════════════════════ */

function Hub({ playerName, gamesMeta, onSelect, onLeaderboard }) {
  const { t } = useLanguage()
  const lb = loadLB()
  const games = [
    { ...META_SPOSO,  title: gamesMeta.sposo.name,  total: t('quiz.sposo.domande').length },
    { ...META_SPOSA,  title: gamesMeta.sposa.name,  total: t('quiz.sposa.domande').length },
    { ...META_CRUCIV, title: gamesMeta.cruciv.name, total: CRUCIVERBA_PAROLE.length },
  ]

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎮</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--charcoal)', marginBottom: 8 }}>
          {t('quiz.pageTitle')}
        </h1>
        <p style={{ color: 'var(--warm-gray)' }}>
          {t('quiz.hubGreeting', { name: playerName }).split(playerName).map((part, i, arr) => (
            <span key={i}>
              {part}{i < arr.length - 1 && <strong>{playerName}</strong>}
            </span>
          ))}
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
                  {g.total} {g.id === 'cruciv' ? t('quiz.wordsUnit') : t('quiz.questionsUnit')}
                </div>
                {best && (
                  <div style={{ fontSize: '.78rem', color: g.color, marginTop: 4, fontWeight: 600 }}>
                    {t('quiz.yourRecord', { score: best.score, total: best.total })}
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
        {t('quiz.generalLeaderboard')}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SCHERMATA NOME
   ═══════════════════════════════════════════════════════════════════ */

function NameScreen({ onStart }) {
  const { t } = useLanguage()
  const [name, setName] = useState('')

  return (
    <div style={{
      minHeight: '70vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '0 20px',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>💍</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--charcoal)', marginBottom: 8 }}>
        {t('quiz.pageTitle')}
      </h1>
      <p style={{ color: 'var(--warm-gray)', maxWidth: 380, marginBottom: 40, lineHeight: 1.6 }}>
        {t('quiz.nameIntro')}
      </p>

      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ textAlign: 'left', fontWeight: 600, fontSize: '.9rem', color: 'var(--charcoal)' }}>
          {t('quiz.nameLabel')}
        </label>
        <input
          className="input"
          placeholder={t('quiz.namePlaceholder')}
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
          {t('quiz.startButton')}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════ */

export default function Quiz() {
  const { t } = useLanguage()
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

  const gamesMeta = {
    sposo:  { ...META_SPOSO,  name: t('quiz.gamesMeta.sposo.name') },
    sposa:  { ...META_SPOSA,  name: t('quiz.gamesMeta.sposa.name') },
    cruciv: { ...META_CRUCIV, name: t('quiz.gamesMeta.cruciv.name') },
  }
  const gameMeta = activeGame ? gamesMeta[activeGame] : null

  return (
    <div className="page-enter" style={{ padding: '60px 0 120px' }}>
      <div className="container-sm" style={{ padding: '0 20px' }}>

        {screen === 'name' && <NameScreen onStart={startGame} />}

        {screen === 'hub' && (
          <Hub
            playerName={playerName}
            gamesMeta={gamesMeta}
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
              >{t('quiz.backToGamesShort')}</button>
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
                color: 'var(--charcoal)', margin: 0,
              }}>
                {gameMeta?.emoji} {gameMeta?.name}
              </h2>
            </div>

            {activeGame === 'sposo' && (
              <QuizGame meta={gamesMeta.sposo} domande={t('quiz.sposo.domande')} playerName={playerName} onFinish={finishGame} />
            )}
            {activeGame === 'sposa' && (
              <QuizGame meta={gamesMeta.sposa} domande={t('quiz.sposa.domande')} playerName={playerName} onFinish={finishGame} />
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
            gameColor={gameMeta.color}
            gameBg={gameMeta.bg}
            onLeaderboard={() => setScreen('board')}
            onBack={() => setScreen('hub')}
          />
        )}

        {screen === 'board' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 24 }}>
              {t('quiz.leaderboardTitle')}
            </h2>
            <Leaderboard
              activeId={lastResult?.gameId || 'sposo'}
              gamesMeta={gamesMeta}
              onClose={() => setScreen('hub')}
            />
          </div>
        )}

      </div>
    </div>
  )
}