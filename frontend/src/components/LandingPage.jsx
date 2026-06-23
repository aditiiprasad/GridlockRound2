import React, { useState } from 'react';

export default function LandingPage({ onScenarioSelect, onLiveFeedSelect }) {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden flex flex-col md:flex-row">
      
      {/* Left Side: Content & Scenarios */}
      <div className="flex-1 p-8 md:p-16 flex flex-col items-start fade-in-up">
        
        {/* Massive Typography */}
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.05] mb-6 max-w-xl">
          Helping Bengaluru <span className="text-fk-blue">move smarter</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-xl mb-12 leading-relaxed">
          ASTraM powered by Flipkart AI. Select a scenario below to launch the intelligence dashboard, or connect to the live event streams.
        </p>

        {/* 3 Scenario Cards (Vertical Stack on Left) */}
        <div className="flex flex-col gap-6 w-full max-w-xl">
          
          {/* Card 1 */}
          <div 
            onClick={() => onScenarioSelect('water_logging')}
            className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all w-full flex items-start gap-6"
          >
            <div className="w-16 h-16 shrink-0 bg-blue-50 text-fk-blue rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🌧️
            </div>
            <div>
              <div className="text-[0.65rem] font-black text-fk-blue uppercase tracking-widest mb-1">SCENARIO 1</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Waterlogging</h3>
              <p className="text-gray-500 font-medium text-sm mb-4">Hosur Road Flyover</p>
              <ul className="text-xs text-gray-600 space-y-2 font-medium">
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">1</span> <span>Predict clearance time for severe flooding.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">2</span> <span>Deploy pumping units and barricades.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">3</span> <span>Calculate ripple effect on nearby tech parks.</span></li>
              </ul>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onScenarioSelect('accident')}
            className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-red-200 transition-all w-full flex items-start gap-6"
          >
            <div className="w-16 h-16 shrink-0 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🚛
            </div>
            <div>
              <div className="text-[0.65rem] font-black text-red-500 uppercase tracking-widest mb-1">SCENARIO 2</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">Truck Crash</h3>
              <p className="text-gray-500 font-medium text-sm mb-4">Mysore Road Collision</p>
              <ul className="text-xs text-gray-600 space-y-2 font-medium">
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">1</span> <span>Analyze multi-vehicle commercial collision.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">2</span> <span>Trigger Mappls-powered diversion mapping.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">3</span> <span>Generate automated WhatsApp advisories.</span></li>
              </ul>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => onScenarioSelect('vip_movement')}
            className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-yellow-300 transition-all w-full flex items-start gap-6"
          >
            <div className="w-16 h-16 shrink-0 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🚨
            </div>
            <div>
              <div className="text-[0.65rem] font-black text-yellow-600 uppercase tracking-widest mb-1">SCENARIO 3</div>
              <h3 className="text-xl font-black text-gray-900 mb-1">VIP Convoy</h3>
              <p className="text-gray-500 font-medium text-sm mb-4">Bellary Road / Airport</p>
              <ul className="text-xs text-gray-600 space-y-2 font-medium">
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">1</span> <span>Simulate rolling road closures for VIPs.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">2</span> <span>Forecast commuter delay spikes.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold text-gray-900">3</span> <span>Estimate personnel needed per junction.</span></li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Right Side: Massive Blue CTA Banner */}
      <div className="flex-1 p-8 md:p-16 flex items-center justify-center bg-gray-50 border-l border-gray-100 fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="bg-fk-blue rounded-[2.5rem] p-12 text-center flex flex-col items-center shadow-2xl w-full max-w-xl relative overflow-hidden">
          
          <div className="text-xs font-black text-blue-200 uppercase tracking-widest mb-10">
            INTELLIGENCE DASHBOARD
          </div>
          
          <button 
            onClick={onLiveFeedSelect}
            className="bg-fk-yellow hover:bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-black text-xl shadow-xl hover:scale-105 transition-all flex items-center gap-3 mb-10"
          >
            Launch Live Feeds <span>→</span>
          </button>

          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
            Monitor real-time city events and predict traffic disruptions.
          </h2>

          <p className="text-blue-200 font-medium text-sm opacity-80">
            Simulated streams · Connects to BookMyShow & Weather APIs
          </p>

        </div>
      </div>

    </div>
  );
}
