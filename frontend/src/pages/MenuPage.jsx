import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useToast, ToastContainer } from '../hooks/useToast'
import { useLanguage } from '../hooks/useLanguage'

/* ── Course icon map ──────────────────────────────────────────────── */
const COURSE_ICONS = {
  'Benvenuto':   { icon: '🥂', color: '#C76B8B', bg: 'rgba(199,107,139,.1)' },
  'Antipasto':   { icon: '🥗', color: '#43A047', bg: 'rgba(67,160,71,.1)' },
  'Starter':     { icon: '🥗', color: '#43A047', bg: 'rgba(67,160,71,.1)' },
  'Primo':       { icon: '🍝', color: '#C9A36A', bg: 'rgba(200,169,106,.1)' },
  'Secondo':     { icon: '🥩', color: '#a05840', bg: 'rgba(160,88,64,.1)'   },
  'Main Course': { icon: '🥩', color: '#a05840', bg: 'rgba(160,88,64,.1)'   },
  'Dessert':     { icon: '🎂', color: '#C76B8B', bg: 'rgba(199,107,139,.1)' },
  'Drink':       { icon: '🍷', color: '#43A047', bg: 'rgba(67,160,71,.1)' },
}

/* Courses where the guest must pick exactly one item */
const CHOICE_COURSES = new Set(['Secondo', 'Main Course'])

function DietBadge({ isVegan, isGlutenFree }) {
  const { t } = useLanguage()
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {isVegan      && <span className="badge" style={{ background: '#d4edda', color: '#2d6a4f', fontSize: '.7rem' }}>{t('menu.vegan')}</span>}
      {isGlutenFree && <span className="badge" style={{ background: '#fff3cd', color: '#7a5820', fontSize: '.7rem' }}>{t('menu.glutenFree')}</span>}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function MenuPage() {
  const toast = useToast()
  const { t } = useLanguage()

  const [menu, setMenu]     = useState({ courses: {}, items: [] })
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null) // scelta corrente nell'interfaccia, non ancora per forza salvata
  const [savedId, setSavedId]       = useState(null) // ultima scelta confermata sul server
  const [saving, setSaving]         = useState(false)
  const [justSaved, setJustSaved]   = useState(false)

  useEffect(() => { loadMenu(); loadMyChoice() }, [])

  const loadMenu = async () => {
    try {
      const data = await api.getMenu()
      setMenu(data)
    } catch { toast.error(t('menu.loadError')) }
    setLoading(false)
  }

  const loadMyChoice = async () => {
    try {
      const { item_ids } = await api.myChoices()
      if (item_ids?.length) {
        setSelectedId(item_ids[0])
        setSavedId(item_ids[0])
      }
    } catch { /* guest not logged in yet or no choice saved */ }
  }

  const pickMainCourse = (itemId) => {
    if (saving) return
    setSelectedId(itemId)
  }

  const confirmChoice = async () => {
    if (!selectedId || selectedId === savedId || saving) return
    setSaving(true)
    try {
      await api.saveChoices([selectedId])
      setSavedId(selectedId)
      toast.success(t('menu.choiceSaved'))
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch {
      toast.error(t('menu.choiceSaveError'))
    }
    setSaving(false)
  }

  const courseOrder  = ['Benvenuto', 'Antipasto', 'Starter', 'Primo', 'Secondo', 'Main Course', 'Dessert', 'Drink']
  const visibleCourses = courseOrder.filter(c => menu.courses[c])

  return (
    <div className="page-enter" style={{ paddingBottom: 100 }}>
      <style>{`@keyframes menu-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--charcoal) 0%, #46243a 100%)',
        padding: '80px 20px 60px', textAlign: 'center', color: 'var(--white)',
        position: 'relative',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🍽️</div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,6vw,3.5rem)',
          fontWeight: 300, letterSpacing: '.05em', marginBottom: 12,
        }}>
          {t('menu.title')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem' }}>
          {t('menu.subtitle')}
        </p>
      </div>

      {/* Menu courses — read only */}
      <div className="container" style={{ padding: '48px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : visibleCourses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--warm-gray)', padding: 60 }}>
            {t('menu.notAvailable')}
          </p>
        ) : visibleCourses.map((course, ci) => {
          const info  = COURSE_ICONS[course] || { icon: '🍴', color: 'var(--rose)', bg: 'rgba(199,107,139,.1)' }
          const items = menu.courses[course] || []
          return (
            <div key={course} style={{ marginBottom: 48 }}>
              {/* Course header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: info.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                }}>
                  {info.icon}
                </div>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
                    color: 'var(--charcoal)', fontWeight: 400,
                  }}>
                    {t(`menu.courses.${course}`)}
                  </h2>
                  <div style={{ height: 2, width: 40, background: info.color, borderRadius: 99, marginTop: 4 }} />
                </div>
              </div>

              {CHOICE_COURSES.has(course) && (
                <p style={{ color: 'var(--warm-gray)', fontSize: '.85rem', fontStyle: 'italic', marginBottom: 16 }}>
                  {t('menu.chooseOne')}
                </p>
              )}

              {/* Items */}
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(item => {
                  const isChoice  = CHOICE_COURSES.has(course)
                  const isSelected = isChoice && selectedId === item.id
                  return (
                    <div
                      key={item.id}
                      role={isChoice ? 'button' : undefined}
                      tabIndex={isChoice ? 0 : undefined}
                      onClick={isChoice ? () => pickMainCourse(item.id) : undefined}
                      onKeyDown={isChoice ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickMainCourse(item.id) } } : undefined}
                      style={{
                        background: 'var(--white)',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1.5px solid var(--rose, #C76B8B)' : '1.5px solid rgba(207,165,181,.15)',
                        padding: '18px 20px',
                        boxShadow: 'var(--shadow-sm)',
                        cursor: isChoice ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        opacity: saving && isChoice ? 0.7 : 1,
                        transition: 'border-color .2s',
                      }}
                    >
                      {isChoice && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          border: `2px solid ${isSelected ? 'var(--rose, #C76B8B)' : 'rgba(154,128,112,.4)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--rose, #C76B8B)' }} />}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h3 style={{
                            fontFamily: 'var(--font-serif)', fontSize: '1.15rem',
                            color: 'var(--charcoal)', fontWeight: 400, margin: 0,
                          }}>
                            {item.name}
                          </h3>
                          <DietBadge isVegan={item.is_vegan} isGlutenFree={item.is_gluten_free} />
                        </div>
                        {item.description && (
                          <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem', marginTop: 6, lineHeight: 1.6, margin: '6px 0 0' }}>
                            {item.description}
                          </p>
                        )}
                        {item.allergens && (
                          <p style={{ color: 'var(--blush)', fontSize: '.78rem', marginTop: 6, margin: '6px 0 0' }}>
                            {t('menu.allergens', { list: item.allergens })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {CHOICE_COURSES.has(course) && (
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={confirmChoice}
                    disabled={!selectedId || selectedId === savedId || saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 24px', borderRadius: 99, border: 'none',
                      fontSize: '.9rem', fontWeight: 600, fontFamily: 'inherit',
                      cursor: (!selectedId || selectedId === savedId || saving) ? 'default' : 'pointer',
                      background: justSaved
                        ? 'var(--sage, #43A047)'
                        : (!selectedId || selectedId === savedId)
                          ? 'rgba(154,128,112,.25)'
                          : 'var(--rose, #C76B8B)',
                      color: '#fff',
                      opacity: saving ? .8 : 1,
                      transition: 'background .2s',
                    }}
                  >
                    {saving ? (
                      <>
                        <span style={{
                          width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
                          display: 'inline-block', animation: 'menu-spin .7s linear infinite',
                        }} />
                        {t('menu.savingChoice')}
                      </>
                    ) : justSaved ? (
                      <>✓ {t('menu.choiceConfirmed')}</>
                    ) : (
                      t('menu.confirmChoice')
                    )}
                  </button>
                  {savedId && selectedId === savedId && !justSaved && (
                    <span style={{ color: 'var(--warm-gray)', fontSize: '.82rem' }}>
                      ✓ {t('menu.currentChoice')}
                    </span>
                  )}
                </div>
              )}

              {ci < visibleCourses.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32, opacity: .3 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
                  <span style={{ fontSize: '1.2rem' }}>✿</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}