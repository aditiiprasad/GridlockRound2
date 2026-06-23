import React, { useState } from 'react'
import { CAUSE_LABELS, RISK_CONFIG, fmt } from '../constants'
import MapplsMap from '../MapplsMap'

function RiskBadge({level}) {
  const cfg = RISK_CONFIG[level]||RISK_CONFIG.Low
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white shadow-sm" style={{ color: cfg.dot, borderColor: cfg.dot }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.dot }} />
      {level} Risk
    </span>
  )
}

export default function ResultsPanel({ results }) {
  const [toast, setToast] = useState(false)

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-10 bg-gray-50 text-gray-400">
        <div className="text-6xl drop-shadow-sm">🗺️</div>
        <div className="font-bold text-xl text-gray-600">Awaiting Event Data</div>
        <p className="text-sm text-center max-w-sm leading-relaxed text-gray-500">
          Select event parameters in the left panel and click Generate Intelligence to see AI-powered predictions, historical analysis, and resource recommendations.
        </p>
      </div>
    )
  }

  const {data:r, form} = results
  const deploy = () => { setToast(true); setTimeout(()=>setToast(false),3000) }

  return (
    <div className="p-8 flex flex-col gap-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Intelligence Report</h2>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {CAUSE_LABELS[form.event_cause]||form.event_cause} · {form.corridor} · {form.event_type}
          </p>
        </div>
        <RiskBadge level={r.risk_level}/>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">⏱️</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Clearance Time</div>
          </div>
          <div className="text-4xl font-extrabold text-blue-600 mb-1">{fmt(r.predicted_duration_minutes)} min</div>
          <div className="text-xs font-semibold text-gray-400">Historical avg: {fmt(r.historical_avg_duration)} min</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xl">👮</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Personnel</div>
          </div>
          <div className="text-4xl font-extrabold text-green-600 mb-1">{r.personnel_needed}</div>
          <div className="text-xs font-semibold text-gray-400">Officers needed</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-500 flex items-center justify-center text-xl">🚧</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Barricades</div>
          </div>
          <div className="text-4xl font-extrabold text-yellow-500 mb-1">{r.barricades_needed}</div>
          <div className="text-xs font-semibold text-gray-400">Units required</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl">🛑</div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Road Closure</div>
          </div>
          <div className="text-4xl font-extrabold text-purple-600 mb-1">{r.road_closure_probability}%</div>
          <div className="text-xs font-semibold text-gray-400">Historical probability</div>
        </div>
      </div>

      {/* Historical Context Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Historical Context</div>
        <div className="flex flex-col divide-y divide-gray-100">
          <div className="flex justify-between py-3">
            <span className="text-sm text-gray-600 font-medium">Similar events (cause + corridor)</span>
            <span className="text-sm font-bold text-gray-900">{r.similar_past_events}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm text-gray-600 font-medium">Historical avg clearance</span>
            <span className="text-sm font-bold text-gray-500">{fmt(r.historical_avg_duration)} min</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm text-gray-600 font-medium">Road closure probability</span>
            <span className={`text-sm font-bold ${r.road_closure_probability > 40 ? 'text-red-500' : 'text-green-500'}`}>{r.road_closure_probability}%</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-sm text-gray-600 font-medium">AI predicted clearance</span>
            <span className="text-sm font-bold text-blue-600">{fmt(r.predicted_duration_minutes)} min</span>
          </div>
        </div>
      </div>

      {/* Alert Box */}
      {r.ripple_effect_warning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-bold text-yellow-900 text-sm mb-1">Ripple Effect Alert</div>
            <div className="text-sm text-yellow-800">{r.ripple_effect_warning}</div>
          </div>
        </div>
      )}

      {/* Map Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Suggested Diversion Route</div>
          <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded text-xs font-bold">Mappls SDK</span>
        </div>
        <div className="bg-blue-100 rounded-lg min-h-[400px] overflow-hidden border border-gray-200 relative">
          <MapplsMap
            center={{lat:form.latitude, lng:form.longitude}}
            diversionRoute={r.diversion_route}
          />
        </div>
        <button onClick={deploy} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow transition-colors flex items-center justify-center gap-2">
          🚀 Deploy ASTraM Field Units
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl shadow-lg animate-bounce">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-bold text-gray-900 text-sm">Units Deployed!</div>
            <div className="text-xs text-gray-500 font-medium">Personnel & barricades dispatched.</div>
          </div>
        </div>
      )}
    </div>
  )
}
