import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { API, CAUSE_LABELS } from './constants'

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1']
const HOUR_LABELS = Array.from({length:24}, (_,h) => h===0?'12am':h===12?'12pm':h<12?`${h}am`:`${h-12}pm`)

export default function Analytics({ filters, selectedGridId, onClearCell }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/analytics/summary`, {
        params: {
          hour_start: filters.hourStart,
          hour_end:   filters.hourEnd,
          month:      filters.month,
          grid_id:    selectedGridId || '',
        }
      })
      setData(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [filters, selectedGridId])

  useEffect(() => { fetch() }, [fetch])

  if (!data) return (
    <div style={{padding:'20px',color:'var(--text-muted)',fontSize:'0.8rem'}}>
      Loading analytics…
    </div>
  )

  const { overview, causes, hotspots, zones, hour_distribution, is_filtered, cell_info } = data
  const maxCause = Math.max(...(causes.map(c => c.count)), 1)
  const maxZone  = Math.max(...(zones.map(z => z.total)), 1)
  const hourData = hour_distribution.map((c,h) => ({ h: HOUR_LABELS[h], count: c }))

  return (
    <div style={{padding:'16px 18px', display:'flex', flexDirection:'column', gap:14}}>
      {/* ── Context banners ── */}
      {cell_info && (
        <div style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',
          borderRadius:10,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:'0.75rem',fontWeight:700,color:'#60a5fa'}}>📍 Grid Cell View</div>
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:1}}>
              {cell_info.center_lat.toFixed(4)}°N · {cell_info.center_lng.toFixed(4)}°E
            </div>
          </div>
          <button onClick={onClearCell} style={{
            background:'rgba(255,255,255,0.08)',border:'1px solid var(--border)',
            color:'var(--text-secondary)',borderRadius:6,padding:'3px 8px',
            cursor:'pointer',fontSize:'0.72rem',fontFamily:'inherit',fontWeight:600,
          }}>✕ Clear</button>
        </div>
      )}
      {is_filtered && !cell_info && (
        <div style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.3)',
          borderRadius:10,padding:'8px 12px',fontSize:'0.72rem',color:'#a78bfa',fontWeight:600}}>
          ⏱ Showing filtered period only
        </div>
      )}

      {/* ── Overview KPIs ── */}
      <div>
        <div className="label" style={{marginBottom:8}}>
          {cell_info ? 'Cell Summary' : 'Overview'}
          {loading && <span style={{marginLeft:8,color:'var(--text-muted)',fontWeight:400}}>Updating…</span>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            { label:'Events',      value: overview.total_events.toLocaleString(),  color:'#3b82f6' },
            { label:'Active',      value: overview.active_events,                  color:'#10b981' },
            { label:'High Priority', value: overview.high_priority.toLocaleString(), color:'#ef4444' },
            { label:'Road Closures', value: overview.road_closures,                color:'#f59e0b' },
          ].map(k => (
            <div key={k.label} className="card" style={{padding:'12px 14px'}}>
              <div className="label" style={{marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:'1.5rem',fontWeight:900,color:k.color,lineHeight:1}}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Events by Cause ── */}
      <div className="card" style={{padding:'14px 16px'}}>
        <div className="label" style={{marginBottom:10}}>Events by Cause</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {causes.map((c,i) => (
            <div key={c.cause} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:100,fontSize:'0.68rem',color:'var(--text-secondary)',textAlign:'right',flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {CAUSE_LABELS[c.cause]||c.cause}
              </div>
              <div className="mini-bar-track" style={{flex:1}}>
                <div className="mini-bar-fill" style={{width:`${c.count/maxCause*100}%`,background:COLORS[i%COLORS.length]}}/>
              </div>
              <div style={{width:32,fontSize:'0.7rem',fontWeight:700,color:'var(--text-primary)',flexShrink:0,textAlign:'right'}}>{c.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Peak Hours ── */}
      <div className="card" style={{padding:'14px 16px'}}>
        <div className="label" style={{marginBottom:8}}>Peak Hours</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={hourData} margin={{top:0,right:0,left:-24,bottom:0}}>
            <XAxis dataKey="h" tick={{fontSize:8}} interval={5}/>
            <YAxis tick={{fontSize:8}}/>
            <Tooltip contentStyle={{background:'#1e2d3d',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:11}}/>
            <Bar dataKey="count" radius={[2,2,0,0]}>
              {hourData.map((d,i) => (
                <Cell key={i} fill={d.count > 80 ? '#ef4444' : d.count > 40 ? '#f59e0b' : '#3b82f6'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Junction Hotspots ── */}
      {hotspots.length > 0 && (
        <div className="card" style={{padding:'14px 16px'}}>
          <div className="label" style={{marginBottom:8}}>Junction Hotspots</div>
          {hotspots.map(h => (
            <div key={h.junction} className="hotspot-row">
              <div className="hotspot-rank" style={{
                background: h.rank<=3 ? ['#f59e0b22','#94a3b822','#b4530922'][h.rank-1] : 'rgba(255,255,255,0.04)',
                color: h.rank<=3 ? ['#f59e0b','#94a3b8','#b45309'][h.rank-1] : 'var(--text-muted)',
                width:26,height:26,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:800,flexShrink:0
              }}>#{h.rank}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.75rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.junction}</div>
                <div className="mini-bar-track" style={{marginTop:3}}>
                  <div className="mini-bar-fill" style={{width:`${h.count/hotspots[0].count*100}%`,background:'#3b82f6'}}/>
                </div>
              </div>
              <div style={{fontSize:'0.78rem',fontWeight:800,flexShrink:0}}>{h.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Zone Summary ── */}
      {zones.length > 0 && (
        <div className="card" style={{padding:'14px 16px'}}>
          <div className="label" style={{marginBottom:8}}>Zone Summary</div>
          {zones.map(z => {
            const hiPct = z.total ? Math.round(z.high_priority/z.total*100) : 0
            return (
              <div key={z.zone} style={{paddingBottom:8,marginBottom:8,borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:'0.75rem',fontWeight:600}}>{z.zone}</span>
                  <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>{z.total} events</span>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div className="progress-bar" style={{flex:1,height:6}}>
                    <div className="progress-fill" style={{width:`${z.total/maxZone*100}%`,background:'#3b82f6'}}/>
                  </div>
                  <span style={{fontSize:'0.65rem',color:'#f87171',width:42,textAlign:'right',flexShrink:0}}>{hiPct}% Hi-Pri</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
