import React from 'react'
import { EVENT_CAUSES, VEH_TYPES, CORRIDORS, CAUSE_LABELS } from '../constants'

export default function SidebarForm({ form, setForm, loading, submit, DEFAULT_FORM, setResults }) {
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const handle = e => set(e.target.name, e.target.value)

  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1"
  const inputClass = "w-full rounded-md border border-gray-300 bg-white text-gray-900 text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"

  return (
    <form onSubmit={submit} className="p-6 flex flex-col gap-5 flex-1">
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {['unplanned','planned'].map(t=>(
          <button key={t} type="button" className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${form.event_type===t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            onClick={()=>set('event_type',t)}>
            {t==='unplanned'?'🔴 Unplanned':'📅 Planned'}
          </button>
        ))}
      </div>

      <div>
        <label className={labelClass}>Event Cause</label>
        <select name="event_cause" value={form.event_cause} onChange={handle} className={inputClass}>
          {EVENT_CAUSES.map(c=><option key={c} value={c}>{CAUSE_LABELS[c]||c}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Corridor</label>
        <select name="corridor" value={form.corridor} onChange={handle} className={inputClass}>
          {CORRIDORS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Priority</label>
        <div className="flex gap-2">
          {['Low','Medium','High'].map(p=>(
            <button key={p} type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-md border transition-all ${form.priority===p ? 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow-sm' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              onClick={()=>set('priority',p)}>{p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Vehicle Type</label>
        <select name="veh_type" value={form.veh_type} onChange={handle} className={inputClass}>
          {VEH_TYPES.map(v=><option key={v} value={v}>{v.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Latitude</label>
          <input name="latitude" type="number" step="any" value={form.latitude} onChange={handle} className={inputClass}/>
        </div>
        <div>
          <label className={labelClass}>Longitude</label>
          <input name="longitude" type="number" step="any" value={form.longitude} onChange={handle} className={inputClass}/>
        </div>
      </div>

      <div>
        <label className={labelClass}>Event Time</label>
        <input type="datetime-local" name="time" value={form.time} onChange={handle} className={inputClass}/>
      </div>

      <div>
        <label className={labelClass}>Police Station</label>
        <input name="police_station" value={form.police_station} onChange={handle}
          placeholder="e.g. Cubbon Park" className={inputClass}/>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={form.requires_road_closure}
          onChange={e=>set('requires_road_closure',e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
        <span className="text-sm font-bold text-gray-700">Requires Road Closure</span>
      </label>

      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" value={form.description} onChange={handle}
          placeholder="Describe the incident…" className={`${inputClass} min-h-[80px] resize-y`}/>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading
          ? <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Analyzing…
            </>
          : '⚡ Generate Intelligence'
        }
      </button>
    </form>
  )
}
