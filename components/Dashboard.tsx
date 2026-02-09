
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { INITIAL_TELEMETRY, BOILERS, FUEL_SPECS } from '../constants';
import { BoilerTelemetry, FuelType, BoilerInfo, MaintenancePrediction } from '../types';
import { Zap, Activity, TrendingUp, IndianRupee, Flame, Thermometer, Wind, AlertTriangle, Wifi, Droplets, Terminal, Factory, ShieldCheck, ShieldAlert, BrainCircuit, Stethoscope, Timer, ClipboardList, X, Wrench, Calendar, AlertCircle, CheckCircle2, MessageSquareText, Sparkles, Lightbulb, Volume2, Gauge, Leaf } from 'lucide-react';
import { analyzeBoilerIoT, predictMaintenance, generateOptimizationInsight, OptimizationInsight } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { ChatInterface } from './ChatInterface';
import { Simulator } from './Simulator';
import { AlarmSystem } from './AlarmSystem';
import { OEEDashboard } from './OEEDashboard';
import { CarbonCalculator } from './CarbonCalculator';
import { useToast } from './ToastProvider';

interface InsightLog {
  id: number;
  text: string;
  timestamp: Date;
}

export const Dashboard: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    // Boiler Selection State
    const [selectedBoilerId, setSelectedBoilerId] = useState<string>(BOILERS[0].id);
    const [telemetry, setTelemetry] = useState<BoilerTelemetry[]>(INITIAL_TELEMETRY);
    
    // AI Logs & Predictions
    const [aiLogs, setAiLogs] = useState<InsightLog[]>([
      { id: 1, text: "Initializing AI Neural Link with Boiler DCS...", timestamp: new Date() }
    ]);
    const [prediction, setPrediction] = useState<MaintenancePrediction | null>(null);
    const [optimizationInsight, setOptimizationInsight] = useState<OptimizationInsight | null>(null);
    const [activeClarification, setActiveClarification] = useState<string | undefined>(undefined);
    const [isPredicting, setIsPredicting] = useState(false);
    const [showMaintenance, setShowMaintenance] = useState(false);
    
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    
    // Derived current boiler info
    const currentBoiler = BOILERS.find(b => b.id === selectedBoilerId) || BOILERS[0];
    
    // Refs to handle interval updates without stale closures
    const telemetryRef = useRef(INITIAL_TELEMETRY);
    const boilerRef = useRef<BoilerInfo>(currentBoiler);

    // Update ref when selection changes
    useEffect(() => {
        boilerRef.current = currentBoiler;
        
        // When boiler switches, we simulate a "fresh" connection or historical fetch for that unit
        // We regenerate a baseline history so the chart doesn't look broken (mixing Gas data with Coal data)
        const newBaseline = generateBaselineHistory(currentBoiler);
        setTelemetry(newBaseline);
        telemetryRef.current = newBaseline;
        setPrediction(null); // Reset prediction on switch
        
        // Add log entry for switch
        setAiLogs(prev => [
            { id: Date.now(), text: `System switched to ${currentBoiler.name}. Loading parameters...`, timestamp: new Date() },
            ...prev
        ]);
        
        // Trigger prediction immediately on switch (after small delay for data)
        setTimeout(() => triggerPrediction(), 2000);

    }, [selectedBoilerId, currentBoiler]);

    // Simulate IoT Data Ingestion
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            const lastData = telemetryRef.current[telemetryRef.current.length - 1];
            
            // Simulation Logic based on intrinsic Boiler Fuel Type
            const activeBoiler = boilerRef.current;
            const currentFuel = activeBoiler.fuelType;
            
            // Determine Optimal O2 based on fuel (Simulation Physics)
            let targetO2 = 3.5;
            let efficiencyBase = 85;
            
            if (currentFuel === 'Gas') {
                targetO2 = 2.2; 
                efficiencyBase = 88; 
            } else if (currentFuel === 'Coal') {
                targetO2 = 4.5; 
                efficiencyBase = 82;
            } else if (currentFuel === 'Biomass') {
                targetO2 = 5.5; 
                efficiencyBase = 78;
            } else if (currentFuel === 'Oil') {
                targetO2 = 3.0;
                efficiencyBase = 86;
            }

            // Drift O2 towards target (Simulating control loop adjustment)
            const o2Drift = (targetO2 - lastData.o2Level) * 0.1; 
            const o2Noise = (Math.random() - 0.5) * 0.3;
            const newO2 = Math.max(0.5, Math.min(10, lastData.o2Level + o2Drift + o2Noise));

            // Random walk for Pressure and Temp
            const newPressure = Math.max(60, Math.min(70, lastData.steamPressure + (Math.random() - 0.5) * 0.8));
            const newStackTemp = Math.max(150, Math.min(190, lastData.stackTemp + (Math.random() - 0.5) * 1.5));
            
            // Efficiency calculation approx based on stack temp & O2
            const newEfficiency = efficiencyBase - ((newStackTemp - 150) * 0.05) - (Math.abs(newO2 - targetO2) * 1.2) + (Math.random() * 0.5);

            const newData: BoilerTelemetry = {
                timestamp: timeString,
                steamPressure: parseFloat(newPressure.toFixed(1)),
                steamFlow: parseFloat((lastData.steamFlow + (Math.random() - 0.5)).toFixed(1)),
                stackTemp: Math.round(newStackTemp),
                o2Level: parseFloat(newO2.toFixed(1)),
                efficiency: parseFloat(newEfficiency.toFixed(1)),
                fuelFlow: Math.round(lastData.fuelFlow + (Math.random() - 0.5) * 50),
                fuelType: currentFuel // Stamping the packet with the boiler's fuel type
            };

            const updatedList = [...telemetryRef.current.slice(-19), newData]; // Keep last 20 points
            telemetryRef.current = updatedList;
            setTelemetry(updatedList);
            setLastUpdated(now);

        }, 3000); // New data every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const triggerPrediction = async () => {
        setIsPredicting(true);
        try {
            const windowData = telemetryRef.current.slice(-20);
            // Pass the entire boiler object to context to include history and components
            const pred = await predictMaintenance(windowData, boilerRef.current);
            setPrediction(pred);
        } catch (e) {
            console.error(e);
        } finally {
            setIsPredicting(false);
        }
    };

    // Periodic AI Analysis (Standard Logs + Prediction Check)
    useEffect(() => {
        let isMounted = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        const runAnalysis = async () => {
            if (!isMounted) return;

            // Wait 5 seconds initially to accumulate data
            const windowData = telemetryRef.current.slice(-10);
            const latestFuelType = windowData[windowData.length - 1]?.fuelType || 'Coal';
            
            try {
                const optInsight = await generateOptimizationInsight(windowData, latestFuelType);
                if (isMounted) setOptimizationInsight(optInsight);

                // Run Text Analysis (Keep for history if needed, or remove)
                const textInsight = await analyzeBoilerIoT(windowData, latestFuelType);
                if (isMounted && textInsight) {
                    setAiLogs(prev => [
                        { id: Date.now(), text: textInsight, timestamp: new Date() },
                        ...prev
                    ].slice(0, 50));
                }
            } catch (e) {
                console.error("AI Service Error:", e);
            }

            // Run Prediction Update
            if (isMounted) {
                await triggerPrediction();
            }

            // Schedule next run (Every 30s to be more responsive as user requested)
            if (isMounted) {
                timeoutId = setTimeout(runAnalysis, 30000);
            }
        };

        timeoutId = setTimeout(runAnalysis, 10000);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    // Helper to generate a realistic looking baseline history when switching boilers
    const generateBaselineHistory = (boiler: BoilerInfo): BoilerTelemetry[] => {
        const history: BoilerTelemetry[] = [];
        const now = new Date();
        
        let baseO2 = 3.5;
        let baseEff = 85;
        if (boiler.fuelType === 'Gas') { baseO2 = 2.2; baseEff = 88; }
        if (boiler.fuelType === 'Coal') { baseO2 = 4.5; baseEff = 82; }
        if (boiler.fuelType === 'Biomass') { baseO2 = 5.5; baseEff = 78; }
        if (boiler.fuelType === 'Oil') { baseO2 = 3.0; baseEff = 86; }

        for (let i = 5; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 3000);
            history.push({
                timestamp: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                steamPressure: 65 + (Math.random() - 0.5) * 2,
                steamFlow: 45 + (Math.random() - 0.5) * 2,
                stackTemp: 160 + (Math.random() - 0.5) * 5,
                o2Level: baseO2 + (Math.random() - 0.5) * 0.4,
                efficiency: baseEff + (Math.random() - 0.5),
                fuelFlow: 5000 + (Math.random() - 0.5) * 200,
                fuelType: boiler.fuelType
            });
        }
        return history;
    };

    const latest = telemetry[telemetry.length - 1];
    const latestFuelType = latest.fuelType; // Read from data, not state

    // Calculate Savings Potential
    const specs = FUEL_SPECS[latestFuelType] || FUEL_SPECS['Coal'];
    // Formula: Waste = Current Fuel Flow * (1 - (Current Efficiency / Optimal Efficiency))
    const wasteKgHr = Math.max(0, latest.fuelFlow * (1 - (latest.efficiency / specs.optimalEff)));
    const savingsPotential = wasteKgHr * specs.cost;
    const savingsFormatted = Math.round(savingsPotential).toLocaleString('en-IN');

    // Calculate IBR Compliance Status
    let ibrStatus = 'Compliant';
    let ibrColor = 'text-green-600';
    let ibrBg = 'bg-green-50';
    let IbrIcon = ShieldCheck;
    let ibrMessage = 'IBR 1950 Limits Validated';

    if (latest.steamPressure > 70.0) {
        ibrStatus = 'Violation';
        ibrColor = 'text-red-600';
        ibrBg = 'bg-red-50';
        IbrIcon = ShieldAlert;
        ibrMessage = 'Critical: Exceeds MAWP';
    } else if (latest.steamPressure > 68.0 || latest.stackTemp > 190) {
        ibrStatus = 'Warning';
        ibrColor = 'text-orange-600';
        ibrBg = 'bg-orange-50';
        IbrIcon = ShieldAlert;
        ibrMessage = 'Parameters near safety limit';
    }

    const speakStatus = () => {
        const latest = telemetry[telemetry.length - 1];
        const text = `Status Report for ${currentBoiler.name}. 
        Current efficiency is ${latest.efficiency.toFixed(1)} percent. 
        Steam Pressure is ${latest.steamPressure.toFixed(1)} bar. 
        Stack Temperature is ${latest.stackTemp.toFixed(1)} degrees Celsius. 
        ${latest.steamPressure > 68 ? 'Warning: High Pressure detected.' : ''}
        ${latest.stackTemp > 180 ? 'Warning: High Stack Temperature detected.' : ''}`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    // Toast notifications
    const { addToast } = useToast();
    
    // Alarm count state
    const [alarmCount, setAlarmCount] = useState(0);

    return (
    <div className="min-h-full max-w-[1600px] mx-auto p-4 space-y-6 dark:bg-slate-950">
      {/* Top Header / Status Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
        <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex items-center space-x-2 text-green-600 animate-pulse shrink-0">
                <Wifi size={20} />
                <span className="text-sm font-bold tracking-wider hidden sm:inline">LIVE STREAM</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600"></div>
            
            {/* Boiler Selector */}
            <div className="flex items-center space-x-2 flex-1 md:flex-none">
                <Factory size={18} className="text-slate-500 dark:text-slate-400" />
                <select 
                    value={selectedBoilerId}
                    onChange={(e) => setSelectedBoilerId(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold rounded-lg px-3 py-2 outline-none border border-slate-200 dark:border-slate-600 focus:border-energy-500 focus:ring-1 focus:ring-energy-500 cursor-pointer w-full md:w-64 shadow-sm"
                >
                    {BOILERS.map(b => (
                        <option key={b.id} value={b.id}>{b.name} • {b.capacity}</option>
                    ))}
                </select>
            </div>

            {/* Voice Assistant Button */}
            <button 
                onClick={speakStatus}
                className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2 group border border-indigo-200 dark:border-indigo-800"
                title="Announce Status"
            >
                <Volume2 size={18} className="group-hover:scale-110 transition-transform"/>
                <span className="text-xs font-bold uppercase hidden lg:inline">Audio Report</span>
            </button>

            {/* Alarm System */}
            <AlarmSystem 
                telemetry={telemetry} 
                boilerName={currentBoiler.name}
                onAlarmCountChange={setAlarmCount}
            />
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
            {/* Read-Only Fuel Indicator (Taken from IoT Data) */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center px-2 text-slate-500 dark:text-slate-400 space-x-2 border-r border-slate-200 dark:border-slate-600 mr-2 pr-2">
                    <Droplets size={14} />
                    <span className="text-xs uppercase font-bold">Fuel Source</span>
                </div>
                <span className={`text-sm font-mono font-medium px-2 ${
                    latestFuelType === 'Gas' ? 'text-blue-600 dark:text-blue-400' :
                    latestFuelType === 'Coal' ? 'text-slate-700 dark:text-slate-300' :
                    latestFuelType === 'Biomass' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                    {latestFuelType}
                </span>
            </div>
            <span className="text-slate-400 font-mono text-xs hidden lg:block">Last Pkt: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Cards - SCADA Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">IBR Status</p>
                    <h3 className={`text-lg font-bold mt-1 ${ibrColor}`}>{ibrStatus}</h3>
                </div>
                <div className={`p-2 rounded-lg ${ibrBg} ${ibrColor}`}>
                    <IbrIcon size={20} />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">{ibrMessage}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Live Savings</p>
                    <h3 className="text-lg font-bold text-green-600 mt-1">₹{savingsFormatted} <span className="text-xs text-slate-400">/hr</span></h3>
                </div>
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <IndianRupee size={20} />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">Potential recovery</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Pressure</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{latest.steamPressure} <span className="text-sm text-slate-400">kg</span></h3>
                </div>
                <div className={`p-2 rounded-lg ${latest.steamPressure > 66 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Activity size={20} />
                </div>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-3 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-500" style={{width: `${(latest.steamPressure/70)*100}%`}}></div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Stack Temp</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{latest.stackTemp} <span className="text-sm text-slate-400">°C</span></h3>
                </div>
                <div className={`p-2 rounded-lg ${latest.stackTemp > 180 ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                    <Thermometer size={20} />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">Target: &lt;160°C</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Excess O2</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{latest.o2Level}%</h3>
                </div>
                <div className="p-2 rounded-lg bg-green-50 text-green-500">
                    <Wind size={20} />
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
                {latestFuelType === 'Gas' ? 'Target: ~2.0%' : latestFuelType === 'Coal' ? 'Target: ~4.5%' : 'Target: Variable'}
            </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Combustion</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{latest.efficiency}%</h3>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500">
                    <Flame size={20} />
                </div>
            </div>
             <p className="text-xs text-slate-500 mt-2">loss method</p>
        </div>
      </div>

      {/* Main Telemetry Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[250px]">
          <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                      <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis domain={['auto', 'auto']} fontSize={11} stroke="#94a3b8" />
                      <Tooltip 
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ fontSize: '12px' }}
                          labelStyle={{ fontSize: '10px', color: '#cbd5e1' }}
                      />
                      <Area type="monotone" dataKey="stackTemp" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                  </AreaChart>
              </ResponsiveContainer>
              <p className="text-center text-xs font-semibold text-slate-400 mt-2">Stack Temperature Trend (15min)</p>
          </div>

          <div className="h-[300px] w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetry} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis yAxisId="left" domain={['auto', 'auto']} fontSize={11} stroke="#94a3b8" />
                      <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} fontSize={11} stroke="#94a3b8" />
                      <Tooltip 
                           contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                           itemStyle={{ fontSize: '12px' }}
                           labelStyle={{ fontSize: '10px', color: '#64748b' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }}/>
                      <Line yAxisId="left" type="monotone" dataKey="steamPressure" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="steamFlow" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-xs font-semibold text-slate-400 mt-2">Pressure (Red) vs Steam Flow (Blue)</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                    <Activity size={16} className="mr-2 text-blue-500"/>
                    Real-time Steam Generation (TPH) vs Pressure
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telemetry}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} tick={{dy: 10}} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} domain={['auto', 'auto']} />
                        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={12} domain={['auto', 'auto']} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="steamPressure" name="Pressure (kg/cm²)" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="steamFlow" name="Flow (TPH)" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                    <Flame size={16} className="mr-2 text-orange-500"/>
                    Combustion Quality: Efficiency vs Stack Temp
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={telemetry}>
                        <defs>
                        <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="timestamp" stroke="#64748b" fontSize={12} />
                        <YAxis yAxisId="left" stroke="#8b5cf6" domain={[70, 100]} />
                         <YAxis yAxisId="right" orientation="right" stroke="#f97316" domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area yAxisId="left" type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorEff)" isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="stackTemp" name="Stack Temp °C" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* AI & Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[1000px] space-y-4">
            
            {/* Predictive Maintenance Card (New) */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 text-slate-800 shadow-sm border border-slate-200 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BrainCircuit size={64} />
                </div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-sm font-semibold tracking-wider flex items-center text-slate-700">
                        <Stethoscope size={16} className="mr-2 text-teal-600" />
                        PREDICTIVE HEALTH
                    </h3>
                    {isPredicting && (
                        <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
                    )}
                </div>

                <div className="flex items-center space-x-6 relative z-10 mb-4">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path
                                className="text-slate-200"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            <path
                                className={`${prediction && prediction.healthScore > 90 ? 'text-green-500' : prediction && prediction.healthScore > 70 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                strokeDasharray={`${prediction?.healthScore || 0}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-bold text-slate-800">{prediction?.healthScore || '--'}</span>
                            <span className="text-[10px] text-slate-500">SCORE</span>
                        </div>
                    </div>
                    <div className="flex-1">
                         <p className="text-xs text-slate-600 leading-snug">
                            {prediction?.summary || "Analyzing telemetry stream..."}
                         </p>
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {prediction?.risks.slice(0, 2).map((risk, i) => (
                        <div key={i} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold text-slate-700">{risk.component}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    risk.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    risk.severity === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                    'bg-teal-100 text-teal-700 border border-teal-200'
                                }`}>
                                    {risk.severity.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-600 mb-1">{risk.description}</p>
                            <div className="flex items-center text-[10px] text-slate-500 space-x-3">
                                <span className="flex items-center"><Activity size={10} className="mr-1"/> Prob: {risk.probability}</span>
                                <span className="flex items-center"><Timer size={10} className="mr-1"/> In: {risk.timeHorizon}</span>
                            </div>
                        </div>
                    ))}
                    {!prediction && !isPredicting && (
                         <div className="text-center py-2 text-xs text-slate-500">
                             Waiting for sufficient data...
                         </div>
                    )}
                     {isPredicting && !prediction && (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-16 bg-slate-100 rounded-lg"></div>
                            <div className="h-16 bg-slate-100 rounded-lg"></div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowMaintenance(true)}
                        className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-teal-700 flex items-center justify-center transition-colors"
                    >
                        <ClipboardList size={14} className="mr-2" />
                        View Maintenance Logs & Wear
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col space-y-4 overflow-hidden min-h-[400px]">
                 <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <Sparkles size={20} className="text-blue-500 mr-2" />
                    Gemini Process Optimizer
                </h3>

                <div className="bg-white rounded-xl border border-slate-200 flex-1 flex flex-col relative min-h-[350px] shadow-sm overflow-hidden">
                    {/* Gemini Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
                        <div className="flex items-center space-x-2">
                            <BrainCircuit size={16} className="text-blue-600" />
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Real-time Analysis</span>
                        </div>
                        {optimizationInsight && (
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                optimizationInsight.status === 'Optimal' ? 'bg-green-50 text-green-700 border-green-200' :
                                optimizationInsight.status === 'Action Required' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                                {optimizationInsight.status}
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        {!optimizationInsight ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="text-xs font-medium animate-pulse">Connecting to Google Gemini...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-800 leading-tight mb-2">
                                        {optimizationInsight.headline}
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {optimizationInsight.analysis}
                                    </p>
                                </div>

                                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                                    <div className="flex items-start space-x-3">
                                        <Lightbulb className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                        <div>
                                            <h5 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                                                Recommended Action
                                            </h5>
                                            <p className="text-sm font-medium text-slate-800">
                                                {optimizationInsight.recommendation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer with fake actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button 
                            onClick={() => {
                                if (optimizationInsight) {
                                    setActiveClarification(`Can you explain the insight: "${optimizationInsight.headline}"? Specifically the recommendation to "${optimizationInsight.recommendation}"?`);
                                    setIsChatOpen(true);
                                }
                            }}
                            className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all hover:shadow"
                        >
                            Ask Clarification
                        </button>
                        <button 
                            onClick={() => setOptimizationInsight(null)}
                            className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={14} />
                            Acknowledge
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {showMaintenance && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <Wrench className="mr-3 text-orange-500" size={24} />
                                Maintenance & Diagnostics
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">{currentBoiler.name} • {currentBoiler.type}</p>
                        </div>
                        <button 
                            onClick={() => setShowMaintenance(false)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Component Health Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                    <Activity size={16} className="mr-2" />
                                    Component Wear Levels
                                </h3>
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {currentBoiler.components.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {currentBoiler.components.map((comp, idx) => (
                                                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-semibold text-slate-700">{comp.name}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                            comp.wearLevel > 70 ? 'bg-red-50 text-red-600' :
                                                            comp.wearLevel > 40 ? 'bg-orange-50 text-orange-600' :
                                                            'bg-green-50 text-green-600'
                                                        }`}>
                                                            {comp.wearLevel}% Wear
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2 rounded-full mb-3 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                comp.wearLevel > 70 ? 'bg-red-500' :
                                                                comp.wearLevel > 40 ? 'bg-orange-500' :
                                                                'bg-green-500'
                                                            }`} 
                                                            style={{width: `${comp.wearLevel}%`}}
                                                        ></div>
                                                    </div>
                                                    <div className="flex items-center text-xs text-slate-400">
                                                        <Calendar size={12} className="mr-1.5" />
                                                        Last Service: {comp.lastMaintained}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 italic">No component data available.</div>
                                    )}
                                </div>
                            </div>

                            {/* Maintenance History Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                    <ClipboardList size={16} className="mr-2" />
                                    Service History
                                </h3>
                                <div className="space-y-3">
                                    {currentBoiler.maintenanceHistory.length > 0 ? (
                                        currentBoiler.maintenanceHistory.map((record, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
                                                <div className={`shrink-0 p-2 rounded-full ${
                                                    record.type === 'Preventive' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
                                                }`}>
                                                    {record.type === 'Preventive' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-sm font-bold text-slate-800">{record.type} Maintenance</h4>
                                                        <span className="text-xs text-slate-400 font-mono">{record.date}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{record.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 italic">
                                            No maintenance records found for this unit.
                                        </div>
                                    )}
                                    
                                    {/* Static "Start New" for demo */}
                                    <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 transition-all text-sm font-medium flex items-center justify-center">
                                        <Wrench size={16} className="mr-2" />
                                        Schedule New Maintenance
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <button 
                            onClick={() => setShowMaintenance(false)}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
                        >
                            Close Report
                        </button>
                    </div>
                </div>
            </div>
        )}

      {/* Advanced Analytics Section */}
      <div className="mt-12 px-4 pb-24">
        <AdvancedAnalytics telemetry={telemetry} fuelType={currentBoiler.fuelType} />

        {/* OEE & Carbon Calculator Row */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OEEDashboard 
                telemetry={telemetry} 
                boilerName={currentBoiler.name}
                targetOEE={85}
            />
            <CarbonCalculator 
                telemetry={telemetry}
                fuelType={currentBoiler.fuelType}
                boilerCapacity={parseInt(currentBoiler.capacity)}
            />
        </div>

        {/* Cost Optimization Simulator */}
        <div className="mt-8">
             <Simulator 
                currentEfficiency={telemetry[telemetry.length - 1].efficiency}
                fuelType={currentBoiler.fuelType}
                boilerCapacity={parseInt(currentBoiler.capacity)}
                steamPressure={telemetry[telemetry.length - 1].steamPressure}
                stackTemp={telemetry[telemetry.length - 1].stackTemp}
             />
        </div>
      </div>

       {/* Engineering AI Chat Bot */}
       <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
        {isChatOpen && (
          <div className="mb-4 w-96 h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-in-up pointer-events-auto flex flex-col">
            <ChatInterface 
              onClose={() => {
                  setIsChatOpen(false);
                  setActiveClarification(undefined);
              }} 
              boilerContext={telemetry.slice(-5)} 
              initialQuestion={activeClarification}
              key={activeClarification ? 'clarification' : 'default'}
            />
          </div>
        )}
        
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`pointer-events-auto p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
            isChatOpen 
              ? 'bg-red-500 text-white hover:bg-red-600 rotate-90' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white hover:shadow-blue-500/30'
          }`}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquareText size={24} />}
          {!isChatOpen && <span className="font-bold pr-2">Engineering AI</span>}
        </button>
      </div>
    </div>
  );
};
