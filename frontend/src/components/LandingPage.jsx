import React, { useState } from 'react';

export default function LandingPage({ onScenarioSelect }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Taskbar / Navbar */}
      <header className="bg-blue-600 text-white flex items-center justify-between p-4 px-8 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
            🛒
          </div>
          <div className="text-2xl font-extrabold tracking-tight leading-none">
            Flipkart Traffic Hub
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-sm font-bold bg-blue-700 hover:bg-blue-800 transition-colors px-4 py-2 rounded-lg"
          >
            ℹ️ About App
          </button>
          <a 
            href="https://github.com" target="_blank" rel="noreferrer"
            className="text-sm font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row p-8 gap-12 max-w-7xl mx-auto w-full items-center">
        
        {/* Left Side: Image */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <img 
            src="/hero-image.png" 
            alt="Futuristic Smart Traffic" 
            className="w-full max-w-[600px] rounded-2xl shadow-2xl border-4 border-white"
          />
          <h1 className="text-4xl font-extrabold text-blue-900 mt-8 mb-4 text-center leading-tight">
            AI-Powered Traffic <br/> Intelligence Engine
          </h1>
          <p className="text-gray-600 text-lg text-center max-w-lg">
            ASTraM (Actionable Intelligence for Sustainable Traffic Management) built for Bengaluru. Predict clearance times and coordinate deployment instantly.
          </p>
        </div>

        {/* Right Side: Quick Pitch Scenarios */}
        <div className="flex-1 flex flex-col gap-6 w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Launch Quick Pitch</h2>
            <p className="text-sm text-gray-500 mb-6">Select a scenario to instantly load the dashboard with prefilled data.</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => onScenarioSelect('water_logging')}
                className="w-full text-left bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 text-gray-800 p-4 rounded-xl transition-all shadow-sm flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center text-2xl transition-colors">🌧️</div>
                <div>
                  <div className="font-bold text-lg">Waterlogging</div>
                  <div className="text-sm text-gray-500">Hosur Road Flyover</div>
                </div>
              </button>

              <button 
                onClick={() => onScenarioSelect('accident')}
                className="w-full text-left bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-400 text-gray-800 p-4 rounded-xl transition-all shadow-sm flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center text-2xl transition-colors">🚛</div>
                <div>
                  <div className="font-bold text-lg">Truck Crash</div>
                  <div className="text-sm text-gray-500">Mysore Road Collision</div>
                </div>
              </button>

              <button 
                onClick={() => onScenarioSelect('vip_movement')}
                className="w-full text-left bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-400 text-gray-800 p-4 rounded-xl transition-all shadow-sm flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center text-2xl transition-colors">🚨</div>
                <div>
                  <div className="font-bold text-lg">VIP Convoy</div>
                  <div className="text-sm text-gray-500">Bellary Road / Airport</div>
                </div>
              </button>

              <button 
                onClick={() => onScenarioSelect('manual')}
                className="w-full text-left bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 text-gray-800 p-4 rounded-xl transition-all shadow-sm flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">✍️</div>
                <div>
                  <div className="font-bold text-lg">Manual Entry</div>
                  <div className="text-sm text-gray-500">Start from a blank form</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* About Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-extrabold text-blue-600 mb-6 flex items-center gap-3">
              <span className="text-3xl">🚀</span> About the Architecture
            </h2>
            
            <div className="space-y-6 text-gray-700">
              <div>
                <h3 className="font-bold text-gray-900 text-lg border-b pb-1 mb-2">Goal</h3>
                <p>ASTraM aims to revolutionize urban traffic management by providing actionable intelligence. Our goal is to reduce congestion, optimize resource allocation, and minimize the ripple effects of localized traffic incidents across the broader city grid.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-lg border-b pb-1 mb-2">Architecture & Tech Stack</h3>
                <p><strong>Frontend:</strong> Built with React 19 and Tailwind CSS v4, utilizing Recharts for data visualization and the Mappls SDK for geospatial mapping and routing.</p>
                <p className="mt-2"><strong>Backend:</strong> Powered by a FastAPI (Python) server that handles requests asynchronously and orchestrates the machine learning pipeline.</p>
                <p className="mt-2"><strong>AI/ML Engine:</strong> Uses a Scikit-Learn Random Forest Regressor trained on historical incident data. It predicts clearance times and road closure probabilities based on coordinates, event priority, and vehicle types.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-lg border-b pb-1 mb-2">Core Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Predictive Engine:</strong> Calculates ETA for incident clearance and resource requirements (Police & Barricades).</li>
                  <li><strong>Diversion Logic:</strong> Integrates spatial awareness to calculate optimal route diversions via Maps.</li>
                  <li><strong>Analytics:</strong> Aggregates historical density mapping to visualize high-risk zones across Bengaluru.</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
