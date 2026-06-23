export function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding:'20px 24px', display:'flex', gap:16, alignItems:'center' }}>
      <div style={{
        width:48, height:48, borderRadius:'var(--radius-sm)',
        background:`${color}18`, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:'1.5rem', flexShrink:0
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:'1.8rem', fontFamily:'var(--font-serif)', color:'var(--charcoal)', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:'.8rem', color:'var(--warm-gray)', textTransform:'uppercase', letterSpacing:'.04em', marginTop:3 }}>{label}</div>
      </div>
    </div>
  )
}
