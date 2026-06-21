import { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { API, CAUSE_LABELS } from './constants'

const MONTHS = ['All Months','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const HOUR_LABELS = Array.from({length:24}, (_,h) => {
  if (h === 0) return '12am'; if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h-12}pm`
})
const COLORS = ['#3b82f6','#f59e0b','#ef4444','#10b981','#8b5cf6','#06b6d4','#f97316']

// Color scale: blue → cyan → green → amber → red → dark red
function densityColor(count, maxCount) {
  const ratio = Math.min(count / Math.max(maxCount, 1), 1)
  if (ratio < 0.10) return ['#3b82f6', 0.25]
  if (ratio < 0.25) return ['#06b6d4', 0.35]
  if (ratio < 0.45) return ['#84cc16', 0.42]
  if (ratio < 0.65) return ['#f59e0b', 0.55]
  if (ratio < 0.82) return ['#ef4444', 0.65]
  return ['#7f1d1d', 0.80]
}

// ── Legend ───────────────────────────────────────────────────────────────────
function Legend({ maxCount }) {
  return (
    <div style={{
      background:'rgba(10,14,26,0.88)', backdropFilter:'blur(8px)',
      border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px',
    }}>
      <div className="label" style={{marginBottom:7}}>Incident Density</div>
      {[
        ['< 10%', '#3b82f6', 0.5],
        ['10–25%', '#06b6d4', 0.6],
        ['25–45%', '#84cc16', 0.65],
        ['45–65%', '#f59e0b', 0.75],
        ['65–82%', '#ef4444', 0.8],
        ['> 82%',  '#7f1d1d', 0.9],
      ].map(([label, fill, opacity]) => (
        <div key={label} style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
          <div style={{width:18,height:10,borderRadius:3,background:fill,opacity,flexShrink:0,border:'1px solid rgba(255,255,255,0.12)'}}/>
          <span style={{fontSize:'0.68rem',color:'var(--text-secondary)'}}>
            {label} of peak ({maxCount})
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Stats Panel ───────────────────────────────────────────────────────────────
function StatsPanel({ cell, detail, onClose }) {
  if (!cell) return null

  const causeData = Object.entries(detail?.cause_breakdown || cell.cause_breakdown)
    .map(([k,v]) => ({ name: CAUSE_LABELS[k]||k, value: v }))
    .slice(0, 5)

  const hourData = detail?.hour_distribution
    ? detail.hour_distribution.map((c,h) => ({ h: HOUR_LABELS[h], count: c }))
    : null

  return (
    <div className="fade-in-up" style={{
      position:'absolute', top:12, right:12, zIndex:1000,
      width:280, maxHeight:'calc(100% - 24px)', overflowY:'auto',
      background:'rgba(10,14,26,0.95)', backdropFilter:'blur(16px)',
      border:'1px solid var(--border)', borderRadius:14,
      boxShadow:'0 8px 40px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',
        display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:'0.9rem',lineHeight:1.2}}>Grid Cell</div>
          <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:3}}>
            {cell.center_lat.toFixed(4)}°N · {cell.center_lng.toFixed(4)}°E
          </div>
          {cell.zone && cell.zone !== 'unknown' && (
            <span className="badge badge-blue" style={{marginTop:5,fontSize:'0.65rem'}}>{cell.zone}</span>
          )}
        </div>
        <button onClick={onClose} style={{
          background:'rgba(255,255,255,0.08)',border:'none',color:'var(--text-secondary)',
          borderRadius:6,width:26,height:26,cursor:'pointer',fontSize:'1rem',
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
        }}>✕</button>
      </div>

      {/* KPI */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1,background:'var(--border)'}}>
        {[
          { label:'Events',    value: cell.count,         color:'#3b82f6' },
          { label:'High Pri',  value: cell.high_priority, color:'#ef4444' },
          { label:'Closures',  value: cell.road_closures, color:'#f59e0b' },
        ].map(k => (
          <div key={k.label} style={{background:'var(--bg-card)',padding:'10px 6px',textAlign:'center'}}>
            <div className="label" style={{marginBottom:4,fontSize:'0.62rem'}}>{k.label}</div>
            <div style={{fontSize:'1.4rem',fontWeight:900,color:k.color,lineHeight:1}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:10}}>
        {/* Planned / Unplanned */}
        <div>
          <div className="label" style={{marginBottom:6}}>Event Type Split</div>
          <div style={{display:'flex',gap:8}}>
            {[
              { label:'Unplanned', value: cell.unplanned, color:'#f87171', bg:'rgba(239,68,68,0.1)', border:'rgba(239,68,68,0.25)' },
              { label:'Planned',   value: cell.planned,   color:'#60a5fa', bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.25)' },
            ].map(t => (
              <div key={t.label} style={{flex:1,padding:'8px',borderRadius:8,
                background:t.bg,border:`1px solid ${t.border}`,textAlign:'center'}}>
                <div style={{fontSize:'1.1rem',fontWeight:900,color:t.color}}>{t.value}</div>
                <div style={{fontSize:'0.65rem',color:'var(--text-muted)'}}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg duration */}
        {(cell.avg_duration || detail?.avg_duration) && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)'}}>
            <span style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>Avg Clearance</span>
            <span style={{fontWeight:700,color:'#60a5fa'}}>
              {Math.round(detail?.avg_duration || cell.avg_duration)} min
            </span>
          </div>
        )}

        {/* Top causes chart */}
        <div>
          <div className="label" style={{marginBottom:6}}>Top Causes</div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={causeData} margin={{top:0,right:0,left:-20,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:8}} />
              <YAxis tick={{fontSize:8}} />
              <Tooltip contentStyle={{background:'#1e2d3d',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:11}}/>
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {causeData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly chart */}
        {hourData && (
          <div>
            <div className="label" style={{marginBottom:6}}>Events by Hour</div>
            <ResponsiveContainer width="100%" height={72}>
              <BarChart data={hourData} margin={{top:0,right:0,left:-20,bottom:0}}>
                <XAxis dataKey="h" tick={{fontSize:7}} interval={5}/>
                <YAxis tick={{fontSize:7}}/>
                <Tooltip contentStyle={{background:'#1e2d3d',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:11}}/>
                <Bar dataKey="count" fill="#8b5cf6" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Junctions */}
        {detail?.junctions && Object.keys(detail.junctions).length > 0 && (
          <div>
            <div className="label" style={{marginBottom:6}}>Junctions in Cell</div>
            {Object.entries(detail.junctions).slice(0,5).map(([j,c]) => (
              <div key={j} style={{display:'flex',justifyContent:'space-between',
                padding:'5px 0',borderBottom:'1px solid var(--border)',fontSize:'0.75rem'}}>
                <span style={{color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,paddingRight:8}}>{j}</span>
                <span style={{fontWeight:700,color:'var(--text-primary)',flexShrink:0}}>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GridMap() {
  const mapRef      = useRef(null)
  const mapInst     = useRef(null)
  const layersRef   = useRef([])

  const [cells, setCells]         = useState([])
  const [maxCount, setMaxCount]   = useState(1)
  const [totalFiltered, setTotal] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [selectedCell, setSelected] = useState(null)
  const [detail, setDetail]         = useState(null)
  const [hourStart, setHS] = useState(0)
  const [hourEnd,   setHE] = useState(23)
  const [month,     setMo] = useState(0)

  // ── Init Leaflet map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current || !mapRef.current || !window.L) return
    mapInst.current = window.L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 11,
      zoomControl: true,
    })
    // OpenStreetMap tiles (dark style via CartoDB)
    window.L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap · © CartoDB', maxZoom: 19 }
    ).addTo(mapInst.current)
  }, [])

  // ── Fetch grid data ──────────────────────────────────────────────────────
  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/analytics/grid_density`, {
        params: { hour_start: hourStart, hour_end: hourEnd, month }
      })
      setCells(data.cells || [])
      setMaxCount(data.max_count || 1)
      setTotal(data.total_filtered || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [hourStart, hourEnd, month])

  useEffect(() => { fetchGrid() }, [fetchGrid])

  // ── Draw rectangles on map ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current || !window.L) return

    // Clear old layers
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    cells.forEach(cell => {
      const [fill, opacity] = densityColor(cell.count, maxCount)
      const rect = window.L.rectangle(
        [[cell.lat_min, cell.lng_min], [cell.lat_max, cell.lng_max]],
        {
          fillColor:   fill,
          fillOpacity: opacity,
          color:       'rgba(255,255,255,0.12)',
          weight:      0.5,
          opacity:     0.7,
        }
      )
      rect.on('click', () => {
        setSelected(cell)
        setDetail(null)
        axios.get(`${API}/api/analytics/grid_cell_detail`, {
          params: { grid_id: cell.grid_id, hour_start: hourStart, hour_end: hourEnd, month }
        }).then(r => setDetail(r.data)).catch(console.error)
      })
      rect.addTo(mapInst.current)
      layersRef.current.push(rect)
    })
  }, [cells, maxCount])

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0}}>
      {/* Filter Bar */}
      <div style={{
        padding:'10px 16px',flexShrink:0,
        background:'rgba(13,20,36,0.95)', backdropFilter:'blur(10px)',
        borderBottom:'1px solid var(--border)',
        display:'flex', gap:20, alignItems:'center', flexWrap:'wrap'
      }}>
        <div style={{display:'flex',flexDirection:'column',gap:4,minWidth:220}}>
          <div className="label">Hour: {HOUR_LABELS[hourStart]} — {HOUR_LABELS[hourEnd]}</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="range" min={0} max={23} value={hourStart}
              onChange={e => setHS(Number(e.target.value))}
              style={{flex:1,accentColor:'#3b82f6',height:4}}/>
            <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>to</span>
            <input type="range" min={0} max={23} value={hourEnd}
              onChange={e => setHE(Number(e.target.value))}
              style={{flex:1,accentColor:'#8b5cf6',height:4}}/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <div className="label">Month</div>
          <select value={month} onChange={e => setMo(Number(e.target.value))}
            className="form-select" style={{width:130,fontSize:'0.8rem',padding:'5px 10px'}}>
            {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          {loading && (
            <span className="spinner" style={{
              width:14,height:14,border:'2px solid rgba(255,255,255,0.15)',
              borderTopColor:'#3b82f6',borderRadius:'50%',display:'inline-block'
            }}/>
          )}
          <div style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>
            <span style={{fontWeight:700,color:'#f1f5f9'}}>{totalFiltered.toLocaleString()}</span> events
            {' · '}
            <span style={{fontWeight:700,color:'#3b82f6'}}>{cells.length}</span> cells
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{flex:1,position:'relative',minHeight:400}}>
        <div ref={mapRef} style={{width:'100%',height:'100%',minHeight:400}}/>

        {/* Legend overlay */}
        <div style={{position:'absolute',bottom:20,left:12,zIndex:1000}}>
          <Legend maxCount={maxCount}/>
        </div>

        {/* Stats panel overlay */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:999}}>
          <div style={{pointerEvents:'auto',position:'relative',height:'100%'}}>
            <StatsPanel
              cell={selectedCell}
              detail={detail}
              onClose={() => { setSelected(null); setDetail(null) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
