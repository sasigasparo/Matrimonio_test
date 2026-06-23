import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Home, MessageCircle, Images, UtensilsCrossed, LayoutGrid } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

/*
 * Floating, iOS-style bottom navigation — the primary mobile nav.
 * Four destinations + a "More" tab that opens the overflow drawer.
 * The active pill animates between tabs via a shared layoutId.
 */
const TABS = [
  { key: 'home',    to: '/',        Icon: Home },
  { key: 'chat',    to: '/chat',    Icon: MessageCircle },
  { key: 'gallery', to: '/gallery', Icon: Images },
  { key: 'menu',    to: '/menu',    Icon: UtensilsCrossed },
  { key: 'more',    to: '__more__', Icon: LayoutGrid },
]

export default function BottomNav({ onMore, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const reduce = useReducedMotion()

  // Hidden on full-screen immersive views that carry their own bottom bar.
  if (location.pathname === '/login' || location.pathname === '/chat') return null

  // Routes that live under the "More" sheet keep that tab visually active.
  const moreRoutes = ['/luoghi', '/faq', '/rsvp', '/tables', '/quiz', '/regali', '/admin']
  const activeKey = (() => {
    const direct = TABS.find(tb => tb.to === location.pathname)
    if (direct) return direct.key
    if (moreRoutes.includes(location.pathname)) return 'more'
    return null
  })()

  const handle = (tab) => {
    if (tab.key === 'more') { onMore?.(); return }
    if (location.pathname === tab.to) return
    onNavigate ? onNavigate(tab.to, navigate) : navigate(tab.to)
  }

  return (
    <nav className="bottomnav hide-mobile-show" aria-label={t('nav.home')}>
      <div className="bottomnav__bar">
        {TABS.map(tab => {
          const active = activeKey === tab.key
          const { Icon } = tab
          return (
            <button
              key={tab.key}
              className={`bottomnav__item${active ? ' is-active' : ''}`}
              onClick={() => handle(tab)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="bottomnav__iconwrap">
                {active && (
                  <motion.span
                    layoutId={reduce ? undefined : 'bottomnav-pill'}
                    className="bottomnav__pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 38, mass: 0.7 }}
                  />
                )}
                <Icon size={22} strokeWidth={active ? 2.4 : 2} className="bottomnav__icon" />
              </span>
              <span className="bottomnav__label">{t(`nav.${tab.key}`)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
