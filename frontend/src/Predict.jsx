import { useState } from 'react'
import axios from 'axios'
import { API, EVENT_CAUSES, VEH_TYPES, CORRIDORS, CAUSE_LABELS, RISK_CONFIG, fmt } from './constants'
import MapplsMap from './MapplsMap'

const DEFAULT_FORM = {
  event_cause: 'vehicle_breakdown', veh_type: 'heavy_vehicle',
  corridor: 'Mysore Road', priority: 'High',
  time: new Date().toISOString().slice(0,16),
  requires_road_closure: false, event_type: 'unplanned',
  latitude: 12.9716, longitude: 77.5946,
  police_station: 'Cubbon Park', description: ''
}

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.Low
  return (
    <span className={`badge ${cfg.cls}`} style={{border:'1px solid',fontSize:'0.75rem',padding:'4px 12px'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:cfg.dot,display:'inline-block'}}/>
      {level} Risk
    </span>
  )
}

function KpiCard({ label, value, unit='', color='#3b82f6', icon, sub }) {
  return (
    <div className="card kpi-card fade-in-up">
      <div className="kpi-glow" style={{background:color}}/>
      <div className="kpi-icon" style={{background:`${color}20`,color}}>
        <span style={{fontSize:'1.1rem'}}>{icon}</span>
      </div>
      <div className="label" style={{marginBottom:6}}>{label}</div>
      <div className="value-xl" style={{color}}>{value}<span style={{fontSize:'1rem',fontWeight:600,marginLeft:4,opacity:0.7}}>{unit}</span></div>
      {sub && <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:4}}>{sub}</div>}
    </div>
  )
}

function StatRow({ label, value, color='var(--text-secondary)' }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
      <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{label}</span>
      <span style={{fontSize:'0.8rem',fontWeight:700,color}}>{value}</span>
    </div>
  )
}

export default function Predict() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(false)

  const set = (k, v) => setForm(f => ({...f, [k]: v}))
  const handle = e => set(e.target.name, e.target.value)

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await axios.post(`${API}/api/predict`, {
        ...form, time: new Date(form.time).toISOString()
      })
      setResults(res.data)
    } catch (err) {
      setError('Backend error — check server is running.')
    } finally { setLoading(false) }
  }

  const deploy = () => { setToast(true); setTimeout(() => setToast(false), 3000) }

  return (
    <>
      {/* ── FORM SIDEBAR ── */}
      <form onSubmit={submit} style={{padding:'20px',display:'flex',flexDirection:'column',gap:14}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#10b981',animation:'pulse-ring 2s infinite'}}/>
            <span style={{fontSize:'0.95rem',fontWeight:800}}>New Event</span>
          </div>
          <p style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Fill details to generate AI recommendations</p>
        </div>

        {/* Event Type toggle */}
        <div className="tab-nav" style={{marginBottom:4}}>
          {['unplanned','planned'].map(t => (
            <button key={t} type="button" className={`tab-btn ${form.event_type===t?'active':''}`}
              onClick={() => set('event_type',t)}>
              {t==='unplanned' ? '🔴 Unplanned' : '📅 Planned'}
            </button>
          ))}
        </div>

        <div className="form-field">
          <label className="label">Event Cause</label>
          <select name="event_cause" value={form.event_cause} onChange={handle} className="form-select">
            {EVENT_CAUSES.map(c => <option key={c} value={c}>{CAUSE_LABELS[c]||c}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label className="label">Corridor</label>
          <select name="corridor" value={form.corridor} onChange={handle} className="form-select">
            {CORRIDORS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label className="label">Priority</label>
          <div className="priority-group">
            {['Low','Medium','High'].map(p => (
              <button key={p} type="button"
                className={`priority-btn ${form.priority===p?`active-${p.toLowerCase()}`:''}`}
                onClick={() => set('priority',p)}>{p}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="label">Vehicle Type</label>
          <select name="veh_type" value={form.veh_type} onChange={handle} className="form-select">
            {VEH_TYPES.map(v => <option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="form-field">
            <label className="label">Latitude</label>
            <input name="latitude" type="number" step="any" value={form.latitude}
              onChange={handle} className="form-input" />
          </div>
          <div className="form-field">
            <label className="label">Longitude</label>
            <input name="longitude" type="number" step="any" value={form.longitude}
              onChange={handle} className="form-input" />
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
            onChange={e => set('requires_road_closure', e.target.checked)}/>
          <span style={{fontSize:'0.8rem',fontWeight:600}}>Requires Road Closure</span>
        </label>

        <div className="form-field">
          <label className="label">Description</label>
          <textarea name="description" value={form.description} onChange={handle}
            placeholder="Describe the incident…" className="form-textarea"/>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{marginTop:4}}>
          {loading
            ? <><span className="spinner" style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block'}}/>Analyzing…</>
            : '⚡ Generate Intelligence'
          }
        </button>

        {error && (
          <div className="alert alert-critical" style={{fontSize:'0.8rem'}}>
            <span>⚠️</span>{error}
          </div>
        )}
      </form>

      {/* ── RESULTS PANEL ── */}
      {results && (
        <div style={{padding:'24px',display:'flex',flexDirection:'column',gap:16}}>

          {/* Header row */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <div>
              <h2 style={{fontSize:'1rem',fontWeight:800}}>Intelligence Report</h2>
              <p style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                {CAUSE_LABELS[form.event_cause]||form.event_cause} · {form.corridor}
              </p>
            </div>
            <RiskBadge level={results.risk_level}/>
          </div>

          {/* KPI cards */}
          <div className="kpi-grid">
            <KpiCard label="Clearance Time" value={fmt(results.predicted_duration_minutes)} unit="min"
              color="#3b82f6" icon="⏱️" sub={`Historical avg: ${fmt(results.historical_avg_duration)}m`}/>
            <KpiCard label="Personnel" value={results.personnel_needed}
              color="#10b981" icon="👮" sub="Officers needed"/>
            <KpiCard label="Barricades" value={results.barricades_needed}
              color="#f59e0b" icon="🚧" sub="Units required"/>
            <KpiCard label="Road Closure" value={`${results.road_closure_probability}%`}
              color={results.road_closure_probability>40?"#ef4444":"#8b5cf6"} icon="🛑"
              sub="Historical probability"/>
          </div>

          {/* Historical context */}
          <div className="card" style={{padding:'16px 20px'}}>
            <div className="label" style={{marginBottom:10}}>Historical Context</div>
            <StatRow label="Similar past events (same cause + corridor)" value={results.similar_past_events}/>
            <StatRow label="Historical avg clearance" value={`${fmt(results.historical_avg_duration)} min`}/>
            <StatRow label="Road closure probability" value={`${results.road_closure_probability}%`}
              color={results.road_closure_probability>40?'#f87171':'#34d399'}/>
            <StatRow label="AI predicted clearance" value={`${fmt(results.predicted_duration_minutes)} min`} color="#60a5fa"/>
          </div>

          {/* Ripple alert */}
          {results.ripple_effect_warning && (
            <div className={`alert ${results.risk_level==='Critical'?'alert-critical':'alert-warning'} fade-in-up`}>
              <span style={{fontSize:'1.2rem'}}>{results.risk_level==='Critical'?'🔴':'⚠️'}</span>
              <div>
                <div style={{fontWeight:700,fontSize:'0.85rem',marginBottom:3}}>Ripple Effect Alert</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{results.ripple_effect_warning}</div>
              </div>
            </div>
          )}

          {/* Map */}
          <div className="card" style={{padding:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div className="label">Suggested Diversion Route</div>
              <span className="badge badge-cyan">Live Mappls SDK</span>
            </div>
            <div style={{height:280,borderRadius:10,overflow:'hidden'}}>
              <MapplsMap
                center={{lat: form.latitude, lng: form.longitude}}
                diversionRoute={results.diversion_route}
              />
            </div>
            <button onClick={deploy} className="btn btn-primary" style={{width:'100%',marginTop:12}}>
              🚀 Deploy ASTraM Field Units
            </button>
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!results && !loading && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          padding:'60px 20px',gap:16,color:'var(--text-muted)'}}>
          <div style={{fontSize:'3rem'}}>🗺️</div>
          <div style={{fontWeight:700,fontSize:'1rem',color:'var(--text-secondary)'}}>Awaiting Event Data</div>
          <div style={{fontSize:'0.8rem',textAlign:'center',maxWidth:280}}>
            Submit an event using the form to generate AI-powered traffic intelligence and resource recommendations.
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span style={{fontSize:'1.2rem'}}>✅</span>
          <div>
            <div style={{fontWeight:700,fontSize:'0.85rem'}}>ASTraM Units Deployed!</div>
            <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Personnel & barricades dispatched.</div>
          </div>
        </div>
      )}
    </>
  )
}
