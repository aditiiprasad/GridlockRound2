import { useState } from 'react'
import axios from 'axios'
import { Activity, Clock, Users, ShieldAlert, Navigation, Map as MapIcon, CheckCircle2, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import MapplsMap from './MapplsMap'

function App() {
  const [formData, setFormData] = useState({
    event_cause: 'vehicle_breakdown',
    veh_type: 'heavy_vehicle',
    corridor: 'Hosur Road',
    priority: 'High',
    time: new Date().toISOString().slice(0, 16), // default current time
    requires_road_closure: false,
    event_type: 'unplanned',
    latitude: 12.9716, // Default Bangalore latitude
    longitude: 77.5946, // Default Bangalore longitude
    police_station: 'Cubbon Park',
    description: ''
  })

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [showDeploymentToast, setShowDeploymentToast] = useState(false)

  const handleDeploy = () => {
    setShowDeploymentToast(true)
    setTimeout(() => setShowDeploymentToast(false), 3000)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Convert local datetime-local to ISO string for backend
    const submissionData = {
      ...formData,
      time: new Date(formData.time).toISOString()
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/predict', submissionData)
      setResults(response.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch intelligence data. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // Chart Data preparation
  const chartData = results ? [
    { name: 'Personnel', value: results.personnel_needed, color: '#2563eb' }, // blue-600
    { name: 'Barricades', value: results.barricades_needed, color: '#facc15' } // yellow-400
  ] : []

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-sm shadow-yellow-200"></div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Traffic Intelligence Engine</h1>
        </div>
        <div className="text-sm font-bold text-slate-600 hidden sm:flex items-center gap-2">
          Powered by <span className="text-blue-600 font-black tracking-wider">ASTraM</span> & <span className="text-emerald-600 font-black tracking-wider">MapmyIndia</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Panel */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              New Event Simulation
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Event Cause</label>
                <select 
                  name="event_cause" 
                  value={formData.event_cause} 
                  onChange={handleChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  <option value="vehicle_breakdown">Vehicle Breakdown</option>
                  <option value="accident">Accident</option>
                  <option value="water_logging">Water Logging</option>
                  <option value="tree_fall">Tree Fall</option>
                  <option value="pot_holes">Pot Holes</option>
                  <option value="congestion">Congestion</option>
                  <option value="construction">Construction</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Vehicle Type</label>
                <select 
                  name="veh_type" 
                  value={formData.veh_type} 
                  onChange={handleChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  <option value="heavy_vehicle">Heavy Vehicle</option>
                  <option value="lcv">LCV</option>
                  <option value="bmtc_bus">BMTC Bus</option>
                  <option value="private_bus">Private Bus</option>
                  <option value="private_car">Private Car</option>
                  <option value="auto">Auto</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Corridor</label>
                <select 
                  name="corridor" 
                  value={formData.corridor} 
                  onChange={handleChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  <option value="Hosur Road">Hosur Road</option>
                  <option value="ORR East 1">ORR East 1</option>
                  <option value="Tumkur Road">Tumkur Road</option>
                  <option value="Bellary Road 1">Bellary Road 1</option>
                  <option value="Mysore Road">Mysore Road</option>
                  <option value="Non-corridor">Non-corridor</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Corridor Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`py-2 px-3 rounded-full text-sm font-bold transition-all border ${
                        formData.priority === p 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Event Time</label>
                <input 
                  type="datetime-local" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input 
                  type="checkbox" 
                  id="requires_road_closure"
                  name="requires_road_closure"
                  checked={formData.requires_road_closure}
                  onChange={(e) => setFormData({ ...formData, requires_road_closure: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="requires_road_closure" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Requires Road Closure
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Event Type</label>
                <select 
                  name="event_type" 
                  value={formData.event_type} 
                  onChange={handleChange}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  <option value="unplanned">Unplanned</option>
                  <option value="planned">Planned</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Police Station (Jurisdiction)</label>
                <input 
                  type="text" 
                  name="police_station"
                  value={formData.police_station}
                  onChange={handleChange}
                  placeholder="e.g. Cubbon Park"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Incident Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the incident (e.g., severe accident, tree fallen)"
                  rows="2"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 animate-spin" /> Analyzing...
                  </span>
                ) : 'Generate Intelligence'}
              </button>

              {error && (
                <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Right Column: Intelligence Output */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {!results && !loading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 border-dashed rounded-2xl p-10">
               <Navigation className="w-16 h-16 mb-4 text-slate-300" />
               <p className="text-lg font-semibold text-slate-500">Awaiting Simulation Data</p>
               <p className="text-sm text-slate-400 max-w-sm text-center mt-2">Submit an event on the left panel to generate predictive intelligence and resource recommendations.</p>
            </div>
          ) : results ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-300 transition-all">
                  <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 p-2 rounded-full">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 z-10">Clearance Time</h3>
                  <div className="text-5xl md:text-6xl font-black text-blue-600 z-10 tracking-tighter">
                    {results.predicted_duration_minutes}
                    <span className="text-xl font-bold text-blue-400 ml-1">m</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-300 transition-all">
                  <div className="absolute top-4 right-4 bg-yellow-50 text-yellow-600 p-2 rounded-full">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 z-10">Personnel Needed</h3>
                  <div className="text-5xl md:text-6xl font-black text-blue-600 z-10 tracking-tighter">
                    {results.personnel_needed}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-300 transition-all">
                  <div className="absolute top-4 right-4 bg-slate-50 text-slate-600 p-2 rounded-full">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 z-10">Barricades Needed</h3>
                  <div className="text-5xl md:text-6xl font-black text-blue-600 z-10 tracking-tighter">
                    {results.barricades_needed}
                  </div>
                </div>

              </div>

              {/* Ripple Effect Warning */}
              {results.ripple_effect_warning && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-amber-800 font-bold mb-1">ASTraM Ripple Effect Alert</h3>
                    <p className="text-amber-700 text-sm font-medium">{results.ripple_effect_warning}</p>
                  </div>
                </div>
              )}

              {/* MapmyIndia Visualization */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    MapmyIndia Diversion Route
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <MapIcon className="w-4 h-4 text-emerald-600" /> Live Mappls SDK
                  </div>
                </div>
                
                <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative min-h-[300px]">
                  <MapplsMap 
                    center={{ lat: formData.latitude, lng: formData.longitude }} 
                    diversionRoute={results.diversion_route} 
                  />
                </div>
                
                {/* Deploy Action */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-500 font-medium">
                    Route optimization calculated via MapmyIndia matrix.
                  </div>
                  <button 
                    onClick={handleDeploy}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2"
                  >
                    Deploy ASTraM Field Units
                  </button>
                </div>
              </div>

            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Activity className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          )}
        </section>

      </main>

      {/* Deployment Toast Notification */}
      {showDeploymentToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h4 className="font-bold">ASTraM Units Deployed!</h4>
            <p className="text-sm text-slate-400">Personnel and barricades dispatched to location.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
