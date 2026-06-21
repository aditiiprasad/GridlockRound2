import { useState } from 'react'
import Predict from './Predict'
import Analytics from './Analytics'
import GridMap from './GridMap'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('predict')

  return (
    <div className="grid-bg" style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
      {/* ── Header ── */}
      <header style={{
        borderBottom:'1px solid var(--border)',
        padding:'0 24px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:56, position:'sticky', top:0, zIndex:100,
        background:'rgba(10,14,26,0.85)', backdropFilter:'blur(16px)'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:30, height:30, borderRadius:8,
            background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'0.9rem', boxShadow:'0 0 12px rgba(59,130,246,0.4)'
          }}>🚦</div>
          <div>
            <div style={{fontSize:'0.95rem',fontWeight:900,letterSpacing:'-0.02em',lineHeight:1}}>
              Traffic Intelligence Engine
            </div>
            <div style={{fontSize:'0.65rem',color:'var(--text-muted)',letterSpacing:'0.05em'}}>
              ASTRAM · BENGALURU
            </div>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#10b981',animation:'pulse-ring 2s infinite'}}/>
          <span style={{fontSize:'0.72rem',color:'var(--text-secondary)',fontWeight:600}}>API ONLINE</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'340px 1fr',minHeight:0}}>

        {/* LEFT SIDEBAR */}
        <aside style={{
          borderRight:'1px solid var(--border)',
          overflowY:'auto', background:'#0d1424',
          display:'flex', flexDirection:'column'
        }}>
          {/* Tab nav */}
          <div style={{padding:'16px 20px 0'}}>
            <div className="tab-nav">
              <button className={`tab-btn ${tab==='predict'?'active':''}`} onClick={() => setTab('predict')}>
                ⚡ Predict
              </button>
              <button className={`tab-btn ${tab==='analytics'?'active':''}`} onClick={() => setTab('analytics')}>
                📊 Analytics
              </button>
            </div>
          </div>

          {tab === 'analytics' && <Analytics />}
          {tab === 'predict'  && (
            /* only the form part of Predict lives here */
            <PredictSidebarOnly />
          )}
        </aside>

        {/* RIGHT MAIN */}
        <main style={{
          overflowY: tab==='analytics' ? 'hidden' : 'auto',
          display:'flex', flexDirection:'column',
          height: 'calc(100vh - 56px)',
        }}>
          {tab === 'predict'   && <PredictMain />}
          {tab === 'analytics' && (
            <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
              <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',background:'#0d1424',flexShrink:0}}>
                <div style={{fontWeight:800,fontSize:'0.95rem',marginBottom:2}}>Incident Density Grid</div>
                <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                  Bengaluru divided into ~0.5 km² cells · Click any shaded cell for stats
                </div>
              </div>
              <div style={{flex:1,minHeight:0,overflow:'hidden'}}>
                <GridMap />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ── We need to split Predict into sidebar + main sections ────────────────────
// The simplest way: use a shared React context / lifting state up.
// For this refactor, we'll render Predict split via a shared state approach.

import { useState as useS } from 'react'
import axios from 'axios'
import { API, EVENT_CAUSES, VEH_TYPES, CORRIDORS, CAUSE_LABELS, RISK_CONFIG, fmt } from './constants'
import MapplsMap from './MapplsMap'

const DEFAULT_FORM = {
  event_cause:'vehicle_breakdown', veh_type:'heavy_vehicle',
  corridor:'Mysore Road', priority:'High',
  time: new Date().toISOString().slice(0,16),
  requires_road_closure:false, event_type:'unplanned',
  latitude:12.9716, longitude:77.5946,
  police_station:'Cubbon Park', description:''
}

// Shared state via module-level (simple approach for single-page app)
let _setResults = null
let _setForm_   = null
let _setLoading_= null
let _setError_  = null

function PredictSidebarOnly() {
  const [form, setForm] = useS(DEFAULT_FORM)
  const [loading, setLoading] = useS(false)
  const [error, setError] = useS(null)

  _setForm_    = setForm
  _setLoading_ = setLoading
  _setError_   = setError

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const handle = e => set(e.target.name, e.target.value)

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await axios.post(`${API}/api/predict`,{
        ...form, time: new Date(form.time).toISOString()
      })
      if (_setResults) _setResults({data: res.data, form})
    } catch {
      setError('Backend error — check server is running.')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:12,flex:1}}>
      <div className="tab-nav" style={{marginTop:4}}>
        {['unplanned','planned'].map(t=>(
          <button key={t} type="button" className={`tab-btn ${form.event_type===t?'active':''}`}
            onClick={()=>set('event_type',t)}>
            {t==='unplanned'?'🔴 Unplanned':'📅 Planned'}
          </button>
        ))}
      </div>

      <div className="form-field">
        <label className="label">Event Cause</label>
        <select name="event_cause" value={form.event_cause} onChange={handle} className="form-select">
          {EVENT_CAUSES.map(c=><option key={c} value={c}>{CAUSE_LABELS[c]||c}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label className="label">Corridor</label>
        <select name="corridor" value={form.corridor} onChange={handle} className="form-select">
          {CORRIDORS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-field">
        <label className="label">Priority</label>
        <div className="priority-group">
          {['Low','Medium','High'].map(p=>(
            <button key={p} type="button"
              className={`priority-btn ${form.priority===p?`active-${p.toLowerCase()}`:''}`}
              onClick={()=>set('priority',p)}>{p}
            </button>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="label">Vehicle Type</label>
        <select name="veh_type" value={form.veh_type} onChange={handle} className="form-select">
          {VEH_TYPES.map(v=><option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div className="form-field">
          <label className="label">Latitude</label>
          <input name="latitude" type="number" step="any" value={form.latitude} onChange={handle} className="form-input"/>
        </div>
        <div className="form-field">
          <label className="label">Longitude</label>
          <input name="longitude" type="number" step="any" value={form.longitude} onChange={handle} className="form-input"/>
        </div>
      </div>

      <div className="form-field">
        <label className="label">Event Time</label>
        <input type="datetime-local" name="time" value={form.time} onChange={handle} className="form-input"/>
      </div>

      <div className="form-field">
        <label className="label">Police Station</label>
        <input name="police_station" value={form.police_station} onChange={handle}
          placeholder="e.g. Cubbon Park" className="form-input"/>
      </div>

      <label className="toggle-row">
        <input type="checkbox" checked={form.requires_road_closure}
          onChange={e=>set('requires_road_closure',e.target.checked)}/>
        <span style={{fontSize:'0.8rem',fontWeight:600}}>Requires Road Closure</span>
      </label>

      <div className="form-field">
        <label className="label">Description</label>
        <textarea name="description" value={form.description} onChange={handle}
          placeholder="Describe the incident…" className="form-textarea"/>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading
          ? <><span className="spinner" style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block'}}/>Analyzing…</>
          : '⚡ Generate Intelligence'
        }
      </button>
      {error && <div className="alert alert-critical" style={{fontSize:'0.78rem'}}><span>⚠️</span>{error}</div>}
    </form>
  )
}

function RiskBadge({level}) {
  const cfg = RISK_CONFIG[level]||RISK_CONFIG.Low
  return (
    <span className={`badge ${cfg.cls}`} style={{border:'1px solid',fontSize:'0.75rem',padding:'4px 12px'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:cfg.dot,display:'inline-block'}}/>
      {level} Risk
    </span>
  )
}

function PredictMain() {
  const [state, setState] = useS(null)
  const [toast, setToast] = useS(false)
  _setResults = setState

  if (!state) {
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        height:'100%',gap:16,color:'var(--text-muted)',padding:40}}>
        <div style={{fontSize:'3.5rem'}}>🗺️</div>
        <div style={{fontWeight:700,fontSize:'1.1rem',color:'var(--text-secondary)'}}>Awaiting Event Data</div>
        <p style={{fontSize:'0.85rem',textAlign:'center',maxWidth:320,lineHeight:1.6}}>
          Select event parameters in the left panel and click Generate Intelligence to see AI-powered predictions, historical analysis, and resource recommendations.
        </p>
      </div>
    )
  }

  const {data:r, form} = state
  const deploy = () => { setToast(true); setTimeout(()=>setToast(false),3000) }

  return (
    <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:16}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
        <div>
          <h2 style={{fontSize:'1.1rem',fontWeight:900,marginBottom:2}}>Intelligence Report</h2>
          <p style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
            {CAUSE_LABELS[form.event_cause]||form.event_cause} · {form.corridor} · {form.event_type}
          </p>
        </div>
        <RiskBadge level={r.risk_level}/>
      </div>

      {/* 4 KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
        {[
          {label:'Clearance Time', value:`${fmt(r.predicted_duration_minutes)} min`, color:'#3b82f6', icon:'⏱️', sub:`Historical avg: ${fmt(r.historical_avg_duration)} min`},
          {label:'Personnel',      value:r.personnel_needed,  color:'#10b981', icon:'👮', sub:'Officers needed'},
          {label:'Barricades',     value:r.barricades_needed, color:'#f59e0b', icon:'🚧', sub:'Units required'},
          {label:'Road Closure',   value:`${r.road_closure_probability}%`, color:r.road_closure_probability>40?'#ef4444':'#8b5cf6', icon:'🛑', sub:'Historical probability'},
        ].map(k=>(
          <div key={k.label} className="card kpi-card fade-in-up" style={{padding:'16px'}}>
            <div className="kpi-glow" style={{background:k.color}}/>
            <div className="kpi-icon" style={{background:`${k.color}20`,color:k.color,width:34,height:34,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,fontSize:'1rem'}}>
              {k.icon}
            </div>
            <div className="label" style={{marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:'1.8rem',fontWeight:900,color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Historical context */}
      <div className="card" style={{padding:'16px 20px'}}>
        <div className="label" style={{marginBottom:10}}>Historical Context</div>
        {[
          ['Similar events (cause + corridor)', r.similar_past_events, 'var(--text-primary)'],
          ['Historical avg clearance', `${fmt(r.historical_avg_duration)} min`, '#94a3b8'],
          ['Road closure probability', `${r.road_closure_probability}%`, r.road_closure_probability>40?'#f87171':'#34d399'],
          ['AI predicted clearance', `${fmt(r.predicted_duration_minutes)} min`, '#60a5fa'],
        ].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{l}</span>
            <span style={{fontSize:'0.8rem',fontWeight:700,color:c}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Ripple effect */}
      {r.ripple_effect_warning && (
        <div className={`alert ${r.risk_level==='Critical'?'alert-critical':'alert-warning'} fade-in-up`}>
          <span style={{fontSize:'1.3rem'}}>{r.risk_level==='Critical'?'🔴':'⚠️'}</span>
          <div>
            <div style={{fontWeight:700,fontSize:'0.85rem',marginBottom:3}}>Ripple Effect Alert</div>
            <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{r.ripple_effect_warning}</div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="card" style={{padding:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div className="label">Suggested Diversion Route</div>
          <span className="badge badge-cyan">Mappls SDK</span>
        </div>
        <div style={{height:300,borderRadius:10,overflow:'hidden'}}>
          <MapplsMap
            center={{lat:form.latitude, lng:form.longitude}}
            diversionRoute={r.diversion_route}
          />
        </div>
        <button onClick={deploy} className="btn btn-primary" style={{width:'100%',marginTop:12}}>
          🚀 Deploy ASTraM Field Units
        </button>
      </div>

      {toast && (
        <div className="toast">
          <span style={{fontSize:'1.2rem'}}>✅</span>
          <div>
            <div style={{fontWeight:700,fontSize:'0.85rem'}}>Units Deployed!</div>
            <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Personnel & barricades dispatched.</div>
          </div>
        </div>
      )}
    </div>
  )
}
