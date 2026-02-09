import React, { useState, useEffect } from 'react';
import { Settings2, Calculator, ArrowRight, IndianRupee, TrendingUp, RotateCcw, Save } from 'lucide-react';
import { FUEL_SPECS } from '../constants';

interface SimulatorProps {
  currentEfficiency: number;
  fuelType: string;
  boilerCapacity: number; // TPH (Tonnes Per Hour)
  steamPressure: number;
  stackTemp: number;
}

export const Simulator: React.FC<SimulatorProps> = ({ 
  currentEfficiency, 
  fuelType, 
  boilerCapacity,
  steamPressure,
  stackTemp
}) => {
  // --- Simulation State ---
  const [excessAirReduction, setExcessAirReduction] = useState(0); // 0-10%
  const [stackTempReduction, setStackTempReduction] = useState(0); // 0-50°C
  const [feedwaterTempIncrease, setFeedwaterTempIncrease] = useState(0); // 0-30°C
  
  // --- Results State ---
  const [simulatedEfficiency, setSimulatedEfficiency] = useState(currentEfficiency);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [fuelSavedTons, setFuelSavedTons] = useState(0);

  // --- Constants derived from fuel type ---
  const fuelSpec = FUEL_SPECS[fuelType] || FUEL_SPECS['Coal'];
  
  // --- Calculation Logic ---
  useEffect(() => {
    // 1. Efficiency Gain Calculation (Engineering Heuristics)
    // - Excess Air: ~0.1% eff gain per 1% reduction (simplified)
    // - Stack Temp: ~1% eff gain per 20°C reduction
    // - Feedwater:  ~1% fuel saving per 6°C rise (approx 1% eff gain equivalent)

    const effGainFromAir = excessAirReduction * 0.1;
    const effGainFromStack = (stackTempReduction / 20) * 1.0;
    const effGainFromFeedwater = (feedwaterTempIncrease / 6) * 1.0;
    
    const totalEffGain = effGainFromAir + effGainFromStack + effGainFromFeedwater;
    const newEfficiency = Math.min(99.9, currentEfficiency + totalEffGain);
    
    setSimulatedEfficiency(newEfficiency);

    // 2. Financial Calculation
    // Base Fuel Consumption (approximate) = (Steam Flow * Delta H) / (Calorific Value * Efficiency)
    // Let's us a simpler relative savings model:
    // Fuel Saved % = (New Eff - Old Eff) / New Eff
    
    const fuelSavingPct = (newEfficiency - currentEfficiency) / newEfficiency;
    
    // Estimated Base Consumption (if not provided, estimate based on capacity)
    // 10 TPH steam approx requires X amount of fuel depending on CV.
    // Enthalpy of steam @ ~65bar is ~2770 kJ/kg. Feedwater ~100C is ~419. Delta = 2350.
    // Heat Load (kcal/hr) = Capacity(kg/hr) * 2350 / 4.184
    // We'll use a pragmatic approximation:
    // TPH * 1000 * 600 (approx kcal/kg steam energy added) / (CV * Eff)
    
    const steamEnthalpyAdded = 600; // kcal/kg approx
    const fuelCV = fuelSpec.calorificValue; // kcal/kg
    
    // Current Fuel Consumption (kg/hr)
    const currentFuelFlow = (boilerCapacity * 1000 * steamEnthalpyAdded) / (fuelCV * (currentEfficiency/100));
    
    // New Fuel Consumption
    const newFuelFlow = (boilerCapacity * 1000 * steamEnthalpyAdded) / (fuelCV * (newEfficiency/100));
    
    const savedFuelKgHr = currentFuelFlow - newFuelFlow;
    const savedFuelMonthly = savedFuelKgHr * 24 * 30; // 30 days, 24 hrs
    
    setFuelSavedTons(savedFuelMonthly / 1000);
    setMonthlySavings(savedFuelMonthly * fuelSpec.cost);
    
  }, [excessAirReduction, stackTempReduction, feedwaterTempIncrease, currentEfficiency, fuelType, boilerCapacity]);

  const resetSimulation = () => {
    setExcessAirReduction(0);
    setStackTempReduction(0);
    setFeedwaterTempIncrease(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Calculator className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono tracking-tight text-slate-800">Efficiency Simulator</h2>
            <p className="text-xs text-slate-500 font-mono">WHAT-IF SCENARIO ANALYSIS</p>
          </div>
        </div>
        <button 
            onClick={resetSimulation}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
            <RotateCcw className="w-3 h-3" />
            Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CONTROLS */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Slider 1: Excess Air */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-slate-700">Decrease Excess Air Strategy</label>
              <span className="text-xs font-mono px-2 py-1 bg-indigo-100 text-indigo-700 rounded border border-indigo-200">
                -{excessAirReduction}% O₂ Trim
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="0.5"
              value={excessAirReduction}
              onChange={(e) => setExcessAirReduction(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-xs text-slate-500">
              Reducing excess air minimizes heat loss via stack gases. Requires O₂ trim control.
            </p>
          </div>

          {/* Slider 2: Stack Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-slate-700">Stack Temp. Recovery</label>
              <span className="text-xs font-mono px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
                -{stackTempReduction}°C Reduction
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="60" step="1"
              value={stackTempReduction}
              onChange={(e) => setStackTempReduction(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-slate-500">
              Cleaning soot/scale from heat transfer surfaces reduces flue gas exit temperature.
            </p>
          </div>

          {/* Slider 3: Feedwater Temp */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-slate-700">Feedwater Pre-heating</label>
              <span className="text-xs font-mono px-2 py-1 bg-amber-100 text-amber-700 rounded border border-amber-200">
                +{feedwaterTempIncrease}°C Increase
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="40" step="1"
              value={feedwaterTempIncrease}
              onChange={(e) => setFeedwaterTempIncrease(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-xs text-slate-500">
              Rising feedwater temp via economizer or solar reduces fuel needed for phase change.
            </p>
          </div>

        </div>

        {/* RESULTS CARD */}
        <div className="lg:col-span-5">
           <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-8 h-full flex flex-col justify-between relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

              <div className="relative z-10">
                <h3 className="text-sm uppercase tracking-wider text-slate-600 font-semibold mb-8">Projected Impact</h3>
                
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-700">Net Efficiency Gain</span>
                            <span className="text-emerald-600 font-mono font-bold">
                                +{(simulatedEfficiency - currentEfficiency).toFixed(2)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, (simulatedEfficiency - currentEfficiency) * 20)}%` }} // Visual scaling
                            ></div>
                        </div>
                         <div className="flex justify-between mt-1 text-xs font-mono">
                            <span className="text-slate-500">{currentEfficiency.toFixed(1)}%</span>
                            <span className="text-emerald-600">{simulatedEfficiency.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-slate-600 text-xs uppercase tracking-wide mb-1">Monthly Fuel Cost Savings</div>
                        <div className="text-3xl font-bold text-slate-800 tracking-tight flex items-baseline gap-1">
                            {formatCurrency(monthlySavings)}
                            <span className="text-sm font-normal text-emerald-600 font-mono">/mo</span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-700 font-mono flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Saves {fuelSavedTons.toFixed(1)} tons of {fuelType}
                        </div>
                    </div>
                </div>
              </div>

              <div className="relative z-10 mt-6 pt-6 border-t border-slate-200">
                <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group">
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Apply To Operations Plan
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                    *Estimates based on {fuelSpec.calorificValue} kcal/kg CV and current market rates.
                </p>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
};
