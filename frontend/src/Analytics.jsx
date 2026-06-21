import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { API, CAUSE_LABELS } from './constants'

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7']

function CauseBreakdown() {
  const [data, setData] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/analytics/cause_breakdown`).then(r => setData(r.data.slice(0,10)))
  }, [])
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="card" style={{padding:'20px'}}>
      <div className="label" style={{marginBottom:14}}>Events by Cause</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {data.map((d,i) => (
          <div key={d.cause} style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:110,fontSize:'0.72rem',color:'var(--text-secondary)',textAlign:'right',flexShrink:0}}>
              {CAUSE_LABELS[d.cause] || d.cause}
            </div>
            <div className="mini-bar-track">
              <div className="mini-bar-fill" style={{width:`${(d.count/max)*100}%`,background:COLORS[i%COLORS.length]}}/>
            </div>
            <div style={{width:36,fontSize:'0.72rem',fontWeight:700,color:'var(--text-primary)',flexShrink:0}}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HourlyProfile() {
  const [data, setData] = useState([])
  const [corridor, setCorridor] = useState('Mysore Road')
  const [corridors, setCorridors] = useState([])

  useEffect(() => {
    axios.get(`${API}/api/analytics/corridors`).then(r => setCorridors(r.data.slice(0,12)))
  }, [])

  useEffect(() => {
    axios.get(`${API}/api/analytics/corridor_profile?corridor=${encodeURIComponent(corridor)}`)
      .then(r => setData(r.data))
  }, [corridor])

  return (
    <div className="card" style={{padding:'20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:8,flexWrap:'wrap'}}>
        <div className="label">Peak Hours — </div>
        <select
          className="form-select"
          style={{width:'auto',fontSize:'0.75rem',padding:'4px 10px'}}
          value={corridor}
          onChange={e => setCorridor(e.target.value)}
        >
          {corridors.map(c => <option key={c.corridor}>{c.corridor}</option>)}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{top:4,right:4,left:-20,bottom:0}}>
          <XAxis dataKey="hour" tick={{fontSize:9}} tickFormatter={h => h%4===0?`${h}h`:''} />
          <YAxis tick={{fontSize:9}} />
          <Tooltip formatter={(v)=>[v,'Events']} labelFormatter={h=>`${h}:00`}
            contentStyle={{background:'#1e2d3d',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,fontSize:12}} />
          <Bar dataKey="count" radius={[3,3,0,0]}>
            {data.map((d,i) => (
              <Cell key={i} fill={d.count > 40 ? '#ef4444' : d.count > 20 ? '#f59e0b' : '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:12,marginTop:8,fontSize:'0.68rem',color:'var(--text-muted)'}}>
        <span style={{color:'#ef4444'}}>■ High (&gt;40)</span>
        <span style={{color:'#f59e0b'}}>■ Medium</span>
        <span style={{color:'#3b82f6'}}>■ Low</span>
      </div>
    </div>
  )
}

function HotspotList() {
  const [data, setData] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/analytics/hotspots?top=10`).then(r => setData(r.data))
  }, [])

  const rankColors = ['#f59e0b','#94a3b8','#b45309','#3b82f6','#3b82f6']
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="card" style={{padding:'20px'}}>
      <div className="label" style={{marginBottom:14}}>Junction Hotspots</div>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {data.map(d => (
          <div key={d.junction} className="hotspot-row">
            <div className="hotspot-rank" style={{
              background: d.rank <= 3 ? `${rankColors[d.rank-1]}22` : 'rgba(255,255,255,0.04)',
              color: d.rank <= 3 ? rankColors[d.rank-1] : 'var(--text-muted)'
            }}>#{d.rank}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.78rem',fontWeight:600,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.junction}</div>
              <div className="mini-bar-track" style={{marginTop:4}}>
                <div className="mini-bar-fill" style={{width:`${(d.count/max)*100}%`,background:d.rank<=3?rankColors[d.rank-1]:'#3b82f6'}}/>
              </div>
            </div>
            <div style={{fontSize:'0.8rem',fontWeight:800,color:'var(--text-primary)',flexShrink:0}}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ZoneSummary() {
  const [data, setData] = useState([])
  useEffect(() => {
    axios.get(`${API}/api/analytics/zone_summary`).then(r => setData(r.data))
  }, [])

  return (
    <div className="card" style={{padding:'20px'}}>
      <div className="label" style={{marginBottom:14}}>Zone Summary</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {data.map(z => {
          const hiPct = z.total ? Math.round(z.high_priority/z.total*100) : 0
          return (
            <div key={z.zone} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:'0.8rem',fontWeight:600}}>{z.zone}</span>
                <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{z.total} events</span>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div className="progress-bar" style={{flex:1}}>
                  <div className="progress-fill" style={{width:`${hiPct}%`,background:'#ef4444'}}/>
                </div>
                <span style={{fontSize:'0.68rem',color:'#f87171',width:40,textAlign:'right'}}>{hiPct}% Hi</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [overview, setOverview] = useState(null)
  useEffect(() => {
    axios.get(`${API}/api/analytics/overview`).then(r => setOverview(r.data))
  }, [])

  const stats = overview ? [
    { label:'Total Events', value: overview.total_events.toLocaleString(), color:'#3b82f6', bg:'rgba(59,130,246,0.12)' },
    { label:'Active Now',   value: overview.active_events,                  color:'#10b981', bg:'rgba(16,185,129,0.12)' },
    { label:'High Priority',value: overview.high_priority.toLocaleString(), color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
    { label:'Road Closures',value: overview.road_closures,                  color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
  ] : []

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:20}}>
      <div>
        <h2 style={{fontSize:'1rem',fontWeight:800,color:'var(--text-primary)',marginBottom:4}}>Analytics Dashboard</h2>
        <p style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>8,173 historical ASTraM events · Bengaluru</p>
      </div>

      {/* Overview KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{padding:'14px 16px'}}>
            <div className="label" style={{marginBottom:6}}>{s.label}</div>
            <div style={{fontSize:'1.6rem',fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      <CauseBreakdown />
      <HourlyProfile />
      <HotspotList />
      <ZoneSummary />
    </div>
  )
}
