import { useState } from 'react'
import axios from 'axios'
import Header from './components/Header'
import SidebarForm from './components/SidebarForm'
import ResultsPanel from './components/ResultsPanel'
import LandingPage from './components/LandingPage'
import Analytics from './Analytics'
import GridMap from './GridMap'
import { API } from './constants'

const DEFAULT_FORM = {
  event_cause:'vehicle_breakdown', veh_type:'heavy_vehicle',
  corridor:'Mysore Road', priority:'High',
  time: new Date().toISOString().slice(0,16),
  requires_road_closure:false, event_type:'unplanned',
  latitude:12.9716, longitude:77.5946,
  police_station:'Cubbon Park', description:'',
  event_scale: 'Medium',
  crowd_size: 0
}

export default function App() {
  const [view, setView] = useState('landing') // 'landing' | 'dashboard'
  const [tab, setTab] = useState('predict')
  
  // Predict App State
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await axios.post(`${API}/api/predict`,{
        ...form, time: new Date(form.time).toISOString()
      })
      setResults({data: res.data, form})
    } catch {
      setError('Backend error — check server is running.')
    } finally { setLoading(false) }
  }

  const handleScenarioSelect = (scenario) => {
    if (scenario === 'water_logging') {
      setForm({ ...DEFAULT_FORM, event_cause: 'water_logging', corridor: 'Hosur Road', veh_type: 'unknown', priority: 'High', latitude: 12.9279, longitude: 77.6271, police_station: 'Madiwala', description: 'Severe waterlogging under the flyover causing multi-km backup.', requires_road_closure: true })
    } else if (scenario === 'accident') {
      setForm({ ...DEFAULT_FORM, event_cause: 'accident', corridor: 'Mysore Road', veh_type: 'heavy_vehicle', priority: 'High', latitude: 12.9716, longitude: 77.5946, police_station: 'Cubbon Park', description: 'Multi-vehicle collision involving a commercial truck.', requires_road_closure: true })
    } else if (scenario === 'vip_movement') {
      setForm({ ...DEFAULT_FORM, event_cause: 'vip_movement', corridor: 'Bellary Road 1', veh_type: 'others', priority: 'Medium', latitude: 13.0285, longitude: 77.5896, police_station: 'Hebbal', description: 'Scheduled VIP convoy movement towards the airport.', requires_road_closure: false })
    } else if (scenario === 'manual') {
      setForm(DEFAULT_FORM)
    }
    setResults(null)
    setView('dashboard')
  }

  if (view === 'landing') {
    return <LandingPage onScenarioSelect={handleScenarioSelect} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Header setView={setView} />

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-96 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          {/* Tab nav */}
          <div className="p-6 pb-0">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              <button 
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab==='predict' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} 
                onClick={() => setTab('predict')}
              >
                ⚡ Predict
              </button>
              <button 
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab==='analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`} 
                onClick={() => setTab('analytics')}
              >
                📊 Analytics
              </button>
            </div>
          </div>

          {tab === 'analytics' && <Analytics />}
          {tab === 'predict'  && (
            <>
              <SidebarForm 
                form={form} 
                setForm={setForm} 
                loading={loading} 
                submit={submit} 
                DEFAULT_FORM={DEFAULT_FORM}
                setResults={setResults} 
              />
              {error && (
                <div className="mx-6 mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex gap-2">
                  <span>⚠️</span>{error}
                </div>
              )}
            </>
          )}
        </aside>

        {/* RIGHT MAIN */}
        <main className="flex-1 bg-gray-50 overflow-y-auto flex flex-col">
          {tab === 'predict'   && <ResultsPanel results={results} />}
          {tab === 'analytics' && (
            <div className="flex flex-col h-full">
              <div className="p-4 px-6 border-b border-gray-200 bg-white shrink-0">
                <div className="font-extrabold text-gray-900">Incident Density Grid</div>
                <div className="text-xs text-gray-500 mt-1">
                  Bengaluru divided into ~0.5 km² cells · Click any shaded cell for stats
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <GridMap />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
