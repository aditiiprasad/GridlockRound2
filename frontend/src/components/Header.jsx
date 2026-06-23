import React from 'react'

export default function Header({ setView }) {
  return (
    <header className="bg-blue-600 text-white flex items-center justify-between p-4 px-6 sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center font-bold shadow-sm">
          🛒
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight leading-none">
            Flipkart Traffic Hub
          </div>
          <div className="text-[0.65rem] text-blue-100 tracking-wider mt-0.5">
            ASTRAM · BENGALURU
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {setView && (
          <button 
            onClick={() => setView('landing')}
            className="text-xs font-bold text-white hover:text-blue-100 flex items-center gap-1 transition-colors"
          >
            <span className="text-sm">⬅️</span> Back to Home
          </button>
        )}
        <div className="flex items-center gap-2 bg-blue-700 px-3 py-1.5 rounded-lg border border-blue-500">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-50 tracking-wide">SYSTEM ONLINE</span>
        </div>
      </div>
    </header>
  )
}
