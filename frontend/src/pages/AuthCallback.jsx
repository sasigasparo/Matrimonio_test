// import { useEffect } from 'react'
// import { useNavigate, useSearchParams } from 'react-router-dom'
// import { useAuth } from '../hooks/useAuth'
// import { saveToken } from '../utils/api'

// export default function AuthCallback() {
//   const navigate = useNavigate()
//   const { handleCallback } = useAuth()
//   const [searchParams] = useSearchParams()

//   useEffect(() => {
//     const token = searchParams.get('token')
//     const error = searchParams.get('error')

//     if (error) {
//       console.error('OAuth error:', error)
//       navigate('/')
//       return
//     }

//     if (token) {
//       // Salva il token
//       saveToken(token)
//       // Carica l'utente
//       handleCallback(token).then(() => {
//         // Redirect alla home
//         navigate('/')
//       })
//     } else {
//       navigate('/')
//     }
//   }, [searchParams, navigate, handleCallback])

//   return (
//     <div style={{
//       display: 'flex',
//       justifyContent: 'center',
//       alignItems: 'center',
//       minHeight: '100dvh',
//       flexDirection: 'column',
//       gap: 24,
//       background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
//     }}>
//       <div className="spinner" style={{ width: 50, height: 50 }} />
//       <p style={{ color: 'var(--warm-gray)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
//         Accesso in corso... 💍
//       </p>
//     </div>
//   )
// }
