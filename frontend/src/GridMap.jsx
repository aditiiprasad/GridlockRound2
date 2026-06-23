import { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import { API } from './constants'

const MONTHS = ['All Months','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const HOUR_LABELS = Array.from({length:24}, (_,h) => h===0?'12am':h===12?'12pm':h<12?`${h}am`:`${h-12}pm`)

function densityColor(count, maxCount) {
  const r = Math.min(count / Math.max(maxCount,1), 1)
  if (r < 0.10) return ['#3b82f6', 0.30]
  if (r < 0.25) return ['#06b6d4', 0.40]
  if (r < 0.45) return ['#84cc16', 0.45]
  if (r < 0.65) return ['#f59e0b', 0.58]
  if (r < 0.82) return ['#ef4444', 0.68]
  return ['#dc2626', 0.82]
}

function Legend({ maxCount }) {
  return (
    <div style={{background:'rgba(10,14,26,0.9)',backdropFilter:'blur(8px)',
      border:'1px solid var(--border)',borderRadius:10,padding:'10px 12px'}}>
      <div className="label" style={{marginBottom:6}}>Density (peak={maxCount})</div>
      {[['<10%','#3b82f6'],['10–25%','#06b6d4'],['25–45%','#84cc16'],['45–65%','#f59e0b'],['65–82%','#ef4444'],['>82%','#dc2626']].map(([l,c])=>(
        <div key={l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
          <div style={{width:16,height:8,borderRadius:2,background:c,opacity:0.85,border:'1px solid rgba(255,255,255,0.1)'}}/>
          <span style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{l}</span>
        </div>
      ))}
    </div>
  )
}

export default function GridMap({
  appliedFilters, pendingFilters, setPendingFilters,
  onApply, onReset, selectedGridId, onCellSelect
}) {
  const mapRef    = useRef(null)
  const mapInst   = useRef(null)
  const layersRef = useRef([])

  const [cells, setCells]       = useState([])
  const [maxCount, setMaxCount] = useState(1)
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(false)

  const isDirty = JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters)

  // ── Init Leaflet ───────────────────────────────────────────────────────────
  useEffect(() => {
    let id = null
    const tryInit = () => {
      if (!window.L || mapInst.current || !mapRef.current) return
      const { offsetWidth, offsetHeight } = mapRef.current
      if (!offsetWidth || !offsetHeight) return
      mapInst.current = window.L.map(mapRef.current, { center:[12.9716,77.5946], zoom:11 })
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution:'© OSM · CartoDB', maxZoom:19 }).addTo(mapInst.current)
      clearInterval(id)
    }
    id = setInterval(tryInit, 200)
    return () => clearInterval(id)
  }, [])

  // ── Fetch grid data ────────────────────────────────────────────────────────
  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/analytics/grid_density`, {
        params: { hour_start: appliedFilters.hourStart, hour_end: appliedFilters.hourEnd, month: appliedFilters.month }
      })
      setCells(data.cells || [])
      setMaxCount(data.max_count || 1)
      setTotal(data.total_filtered || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [appliedFilters])

  useEffect(() => { fetchGrid() }, [fetchGrid])

  // ── Draw rectangles ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current || !window.L) return
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    cells.forEach(cell => {
      const [fill, opacity] = densityColor(cell.count, maxCount)
      const isSelected = cell.grid_id === selectedGridId
      const rect = window.L.rectangle(
        [[cell.lat_min, cell.lng_min],[cell.lat_max, cell.lng_max]],
        {
          fillColor:    fill,
          fillOpacity:  isSelected ? Math.min(opacity + 0.2, 1) : opacity,
          color:        isSelected ? '#ffffff' : 'rgba(255,255,255,0.15)',
          weight:       isSelected ? 2.5 : 0.5,
          opacity:      isSelected ? 1 : 0.7,
        }
      )
      // Hover tooltip: shows count
      rect.bindTooltip(
        `<div style="font-weight:800;font-size:13px;">${cell.count}</div><div style="font-size:10px;opacity:0.75;">incidents</div>`,
        { sticky: true, direction: 'top', opacity: 1, className: 'leaflet-grid-tooltip' }
      )
      rect.on('click', () => onCellSelect(isSelected ? null : cell.grid_id))
      rect.addTo(mapInst.current)
      layersRef.current.push(rect)
    })
  }, [cells, maxCount, selectedGridId])

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0}}>

      {/* Leaflet tooltip dark style */}
      <style>{`
        .leaflet-grid-tooltip {
          background: rgba(10,14,26,0.92) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          color: #f1f5f9 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          text-align: center !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
          font-family: Inter, sans-serif !important;
        }
        .leaflet-grid-tooltip::before { display: none !important; }
      `}</style>

      {/* ── Filter Bar ── */}
      <div style={{padding:'10px 16px',flexShrink:0,background:'rgba(13,20,36,0.96)',
        backdropFilter:'blur(10px)',borderBottom:'1px solid var(--border)',
        display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>

        {/* Hour range sliders */}
        <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:220}}>
          <div className="label">
            Hour: {HOUR_LABELS[pendingFilters.hourStart]} — {HOUR_LABELS[pendingFilters.hourEnd]}
            {isDirty && <span style={{marginLeft:6,color:'#f59e0b',fontSize:'0.65rem'}}>● unsaved</span>}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="range" min={0} max={23} value={pendingFilters.hourStart}
              onChange={e => setPendingFilters(f=>({...f, hourStart:Number(e.target.value)}))}
              style={{flex:1,accentColor:'#3b82f6'}}/>
            <span style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>—</span>
            <input type="range" min={0} max={23} value={pendingFilters.hourEnd}
              onChange={e => setPendingFilters(f=>({...f, hourEnd:Number(e.target.value)}))}
              style={{flex:1,accentColor:'#8b5cf6'}}/>
          </div>
        </div>

        {/* Month */}
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <div className="label">Month</div>
          <select value={pendingFilters.month}
            onChange={e => setPendingFilters(f=>({...f, month:Number(e.target.value)}))}
            className="form-select" style={{width:128,fontSize:'0.8rem',padding:'5px 10px'}}>
            {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:'auto'}}>
          <button onClick={onReset} className="btn btn-ghost" style={{fontSize:'0.78rem',padding:'7px 14px'}}>
            ↺ Reset All
          </button>
          <button
            onClick={onApply}
            disabled={!isDirty && !loading}
            className="btn btn-primary"
            style={{fontSize:'0.78rem',padding:'7px 14px',
              opacity: isDirty ? 1 : 0.6,
              background: isDirty ? 'var(--accent)' : 'rgba(59,130,246,0.5)'}}>
            {loading ? '…' : isDirty ? '⚡ Load' : '✓ Loaded'}
          </button>
        </div>

        {/* Stats */}
        <div style={{fontSize:'0.72rem',color:'var(--text-secondary)',borderLeft:'1px solid var(--border)',paddingLeft:12}}>
          <span style={{fontWeight:700,color:'#f1f5f9'}}>{total.toLocaleString()}</span> events
          {' · '}
          <span style={{fontWeight:700,color:'#3b82f6'}}>{cells.length}</span> cells
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{flex:1,position:'relative',minHeight:400}}>
        <div ref={mapRef} style={{width:'100%',height:'100%',minHeight:400}}/>

        {/* Legend */}
        <div style={{position:'absolute',bottom:20,left:12,zIndex:1000,pointerEvents:'none'}}>
          <Legend maxCount={maxCount}/>
        </div>

        {/* Selected cell indicator */}
        {selectedGridId && (
          <div style={{
            position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',
            zIndex:1000,pointerEvents:'none',
            background:'rgba(59,130,246,0.9)',borderRadius:20,
            padding:'5px 14px',fontSize:'0.75rem',fontWeight:700,color:'#fff',
            boxShadow:'0 4px 16px rgba(59,130,246,0.4)',
          }}>
            📍 Cell selected — see sidebar for stats
          </div>
        )}

        {loading && (
          <div style={{position:'absolute',top:10,right:10,zIndex:1000,
            background:'rgba(10,14,26,0.85)',borderRadius:8,padding:'6px 12px',
            fontSize:'0.75rem',color:'var(--text-secondary)',display:'flex',gap:6,alignItems:'center'}}>
            <span className="spinner" style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.15)',borderTopColor:'#3b82f6',borderRadius:'50%',display:'inline-block'}}/>
            Computing…
          </div>
        )}
      </div>
    </div>
  )
}
