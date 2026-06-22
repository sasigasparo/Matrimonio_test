import { WEDDING_CONFIG } from '../../config/wedding'

export const API = `${(import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')}/api`

export const { projectId: SUPABASE_PROJECT_ID, bucket: SUPABASE_BUCKET } = WEDDING_CONFIG.supabase

export function getToken() {
  return localStorage.getItem('wedding_token') || ''
}

export function getGuestName() {
  return localStorage.getItem('wedding_guest_name') || ''
}

const MAX_PX = 1600
const JPEG_Q = 0.82

export function compressPhoto(file) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width: w, height: h } = img
      if (Math.max(w, h) > MAX_PX) {
        const r = MAX_PX / Math.max(w, h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', JPEG_Q)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export const resolvePhotoUrl = p =>
  p.url || p.photo_url ||
  (p.filename ? `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/photos/${p.filename}` : null)
