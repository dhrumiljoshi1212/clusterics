
import React, { useState } from 'react';

interface BoilerSchematicProps {
  telemetry: any;
  anomalies: any[];
}

export const BoilerSchematic: React.FC<BoilerSchematicProps> = ({ telemetry, anomalies }) => {
  const latest = telemetry[telemetry.length - 1] || {};
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  // Helper to determine color based on value
  const getTempColor = (temp: number) => {
    if (temp > 180) return "#ef4444"; // red-500
    if (temp > 170) return "#f59e0b"; // amber-500
    return "#10b981"; // emerald-500
  };

  const getPressureColor = (press: number) => {
    if (press > 68) return "#ef4444";
    if (press > 66) return "#f59e0b";
    return "#3b82f6"; // blue-500
  };

  return (
    <div className="relative bg-slate-900 border border-slate-700/50 rounded-xl p-8 shadow-2xl overflow-hidden min-h-[500px] flex items-center justify-center">
       {/* Ambient Glow */}
       <div className="absolute top-[-50%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

       {/* Title Overlay */}
       <div className="absolute top-6 left-6 z-10 select-none">
         <h2 className="text-xl font-bold font-mono text-white tracking-widest uppercase flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Digital Twin v2.1
         </h2>
         <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-wider opacity-70 ml-6">REAL-TIME SCHEMATIC VISUALIZATION</p>
       </div>

       {/* Legend */}
       <div className="absolute top-6 right-6 z-10 bg-slate-900/40 backdrop-blur-md p-3 rounded-lg border border-slate-700/50 text-[10px] text-slate-300 font-mono select-none shadow-lg">
          <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> NORMAL</div>
          <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> WARNING</div>
          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span> CRITICAL</div>
       </div>

      <svg viewBox="0 0 800 500" className="w-full h-full max-w-4xl opacity-100 z-0">
        <defs>
            {/* Flames - Multi-stop gradient for realism */}
            <linearGradient id="fireGradient" x1="0.5" x2="0.5" y1="1" y2="0">
                <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0.9" /> {/* Dark Red base */}
                <stop offset="40%" stopColor="#ef4444" stopOpacity="0.8" /> {/* Red mid */}
                <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.8" /> {/* Orange tip */}
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0.6" /> {/* Yellow fade */}
            </linearGradient>

            {/* Water/Steam Gradient */}
            <linearGradient id="steamGradient" x1="0" x2="0" y1="1" y2="0">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#2563eb" stopOpacity="0.2" /> {/* Water Line */}
                <stop offset="55%" stopColor="#cbd5e1" stopOpacity="0.3" /> {/* Steam Start */}
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.6" /> {/* Steam Top */}
            </linearGradient>

             {/* Pipe Gradient */}
            <linearGradient id="pipeGrade" x1="0" x2="1" y1="0" y2="0">
                 <stop offset="0%" stopColor="#334155" /> 
                 <stop offset="50%" stopColor="#475569" />
                 <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feComposite in="coloredBlur" in2="SourceGraphic" operator="in" result="softGlow"/>
                 <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {/* --- GRID LINES (Background Context) --- */}
        <g opacity="0.1">
             <line x1="0" y1="100" x2="800" y2="100" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             <line x1="0" y1="250" x2="800" y2="250" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             <line x1="0" y1="400" x2="800" y2="400" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             <line x1="200" y1="0" x2="200" y2="500" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             <line x1="400" y1="0" x2="400" y2="500" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             <line x1="600" y1="0" x2="600" y2="500" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
        </g>

        {/* --- 1. FURNACE / BURNER AREA (Refined) --- */}
        <g 
            transform="translate(80, 280)"
            onMouseEnter={() => setHoveredPart('Furnace')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-pointer group"
        >
            {/* Furnace Box */}
            <rect x="0" y="0" width="220" height="160" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <rect x="5" y="5" width="210" height="150" rx="4" fill="url(#pipeGrade)" opacity="0.1" />

            {/* Realistic Flame Animation Layer 1 (Back) */}
            <path d="M40 140 Q 70 80 110 140 T 180 140" fill="#7f1d1d" opacity="0.6">
                 <animate attributeName="d" values="M40 140 Q 70 80 110 140 T 180 140; M40 140 Q 70 100 110 140 T 180 140; M40 140 Q 70 80 110 140 T 180 140" dur="2s" repeatCount="indefinite" />
            </path>
            
            {/* Layer 2 (Front/Bright) */}
             <path d="M50 140 Q 80 40 110 130 T 170 140" fill="url(#fireGradient)" filter="url(#glow)">
               <animate attributeName="d" 
                 values="M50 140 Q 80 40 110 130 T 170 140; M50 140 Q 90 20 110 130 T 170 140; M50 140 Q 70 60 110 130 T 170 140; M50 140 Q 80 40 110 130 T 170 140" 
                 dur="1.5s" repeatCount="indefinite" />
            </path>
            
            <text x="110" y="30" textAnchor="middle" fill="#64748b" fontSize="10" letterSpacing="1" fontFamily="monospace">COMBUSTION CHAMBER</text>
            
            {/* Hover Tooltip */}
            {hoveredPart === 'Furnace' && (
                <g transform="translate(60, -60)">
                    <rect x="0" y="0" width="100" height="50" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="20" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">AIR/FUEL</text>
                    <text x="50" y="38" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">{(latest.fuelFlow / 100).toFixed(1)}:1</text>
                </g>
            )}
        </g>

        {/* --- 2. STEAM DRUM (Refined) --- */}
        <g 
            transform="translate(250, 40)"
            onMouseEnter={() => setHoveredPart('Drum')}
            onMouseLeave={() => setHoveredPart(null)}
            className="cursor-pointer"
        >
            {/* Outer Shell */}
            <rect x="0" y="0" width="300" height="90" rx="45" fill="#1e293b" stroke={getPressureColor(latest.steamPressure)} strokeWidth="2" />
            
            {/* Inner Liquid/Steam */}
            <rect x="10" y="10" width="280" height="70" rx="35" fill="url(#steamGradient)" />
            
            {/* Water Level Indicator Line */}
            <line x1="20" y1="45" x2="280" y2="45" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
            
            {/* Gauge Graphic */}
            <circle cx="150" cy="45" r="24" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            {/* Needle */}
            <line x1="150" y1="45" x2="162" y2="35" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" 
                    from={`${(latest.steamPressure - 60) * 10} 150 45`} 
                    to={`${(latest.steamPressure - 60) * 10 + 5} 150 45`} 
                    dur="2s" repeatCount="indefinite" values={`${(latest.steamPressure - 60) * 10} 150 45; ${(latest.steamPressure - 60) * 10 + 5} 150 45; ${(latest.steamPressure - 60) * 10} 150 45`}
                />
            </line>
            
            <text x="150" y="115" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace" letterSpacing="1">STEAM DRUM</text>

            {hoveredPart === 'Drum' && (
                <g transform="translate(100, -60)">
                    <rect x="0" y="0" width="100" height="50" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="50" y="20" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">PRESSURE</text>
                    <text x="50" y="38" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">{latest.steamPressure.toFixed(1)} bar</text>
                </g>
            )}
        </g>

        {/* --- 3. PIPING NETWORK (Refined Paths) --- */}
        {/* Riser (Up to Drum) */}
        <path d="M190 280 L 190 180 Q 190 130 260 130" fill="none" stroke="#475569" strokeWidth="6" />
        <path d="M190 280 L 190 180 Q 190 130 260 130" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 6" opacity="0.6">
            <animate attributeName="stroke-dashoffset" from="12" to="0" dur="1s" repeatCount="indefinite" />
        </path>

        {/* Downcomer (From Drum) */}
        <path d="M400 130 Q 450 130 450 180 L 450 400 L 530 400" fill="none" stroke="#475569" strokeWidth="6" />
        
        {/* Steam Output (Top) */}
        <path d="M350 40 L 350 10 L 600 10" fill="none" stroke="#cbd5e1" strokeWidth="4" />
        <path d="M600 10 L 610 5 L 600 0" fill="#cbd5e1" /> {/* Arrow */}


        {/* --- 4. ECONOMIZER & STACK (Refined) --- */}
        <g 
            transform="translate(530, 180)"
             onMouseEnter={() => setHoveredPart('Stack')}
            onMouseLeave={() => setHoveredPart(null)}
             className="cursor-pointer"
        >
            {/* Stack Structure */}
            <path d="M0 280 L 0 0 L 100 0 L 100 280" fill="#1e293b" stroke={getTempColor(latest.stackTemp)} strokeWidth="2" />
            
            {/* Dynamic Smoke/Heat Haze */}
            <circle cx="50" cy="-10" r="15" fill="#64748b" opacity="0.2">
                 <animate attributeName="cy" from="-10" to="-80" dur="3s" repeatCount="indefinite" />
                 <animate attributeName="r" from="15" to="40" dur="3s" repeatCount="indefinite" />
                 <animate attributeName="opacity" from="0.2" to="0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="-30" r="10" fill="#64748b" opacity="0.15">
                 <animate attributeName="cy" from="-30" to="-100" dur="2.5s" repeatCount="indefinite" />
                 <animate attributeName="r" from="10" to="35" dur="2.5s" repeatCount="indefinite" />
                 <animate attributeName="opacity" from="0.15" to="0" dur="2.5s" repeatCount="indefinite" />
            </circle>

             {/* Heat Exchanger Zig-Zag (Economizer) */}
             <path d="M10 60 L 90 80 L 10 100 L 90 120 L 10 140 L 90 160" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
             <text x="120" y="110" fill="#64748b" fontSize="10" fontFamily="monospace">ECONOMIZER</text>
             <text x="50" y="270" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="monospace">STACK</text>

             {hoveredPart === 'Stack' && (
                <g transform="translate(-140, 60)">
                    <rect x="0" y="0" width="120" height="50" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="60" y="20" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">EXIT TEMP</text>
                    <text x="60" y="38" textAnchor="middle" fill={getTempColor(latest.stackTemp)} fontSize="14" fontWeight="bold">{latest.stackTemp.toFixed(1)} °C</text>
                </g>
            )}
        </g>
        
        {/* --- 5. Feedwater Input --- */}
        <text x="560" y="480" fill="#3b82f6" fontSize="10" fontFamily="monospace">FEEDWATER INPUT</text>
        <path d="M540 460 L 540 405" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />

      </svg>
      
      {/* HUD Overlay Stats - Glassmorphism */}
      <div className="absolute bottom-6 right-6 flex gap-4">
            <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-4 bg-slate-900 ring-1 ring-slate-800 rounded-lg flex flex-col items-center min-w-[100px]">
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest mb-1">EFFICIENCY</div>
                    <div className="text-2xl font-mono text-emerald-400 font-bold">{latest.efficiency.toFixed(1)}%</div>
                </div>
            </div>

             <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-4 bg-slate-900 ring-1 ring-slate-800 rounded-lg flex flex-col items-center min-w-[100px]">
                    <div className="text-[10px] text-slate-400 font-mono tracking-widest mb-1">LOAD</div>
                    <div className="text-2xl font-mono text-blue-400 font-bold">{latest.steamFlow.toFixed(1)} <span className="text-xs">TPH</span></div>
                </div>
            </div>
      </div>

    </div>
  );
};
