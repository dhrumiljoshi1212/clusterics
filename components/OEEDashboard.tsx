import React, { useState, useEffect } from 'react';
import { Gauge, Clock, Activity, TrendingUp, TrendingDown, Timer, Zap, AlertTriangle, CheckCircle, BarChart3, Target } from 'lucide-react';
import { BoilerTelemetry } from '../types';

interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface OEEDashboardProps {
  telemetry: BoilerTelemetry[];
  boilerName: string;
  targetOEE?: number;
}

export const OEEDashboard: React.FC<OEEDashboardProps> = ({ 
  telemetry, 
  boilerName,
  targetOEE = 85 
}) => {
  const [metrics, setMetrics] = useState<OEEMetrics>({
    availability: 0,
    performance: 0,
    quality: 0,
    oee: 0
  });
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [runningHours, setRunningHours] = useState({ today: 0, month: 0 });
  const [losses, setLosses] = useState({
    plannedDowntime: 0,
    unplannedDowntime: 0,
    speedLoss: 0,
    qualityLoss: 0
  });

  useEffect(() => {
    if (telemetry.length < 2) return;

    // Calculate OEE components based on telemetry patterns
    const latest = telemetry[telemetry.length - 1];
    const dataPoints = telemetry.length;

    // Availability: % of time the boiler was operating (simulated based on pressure stability)
    const operatingPoints = telemetry.filter(t => t.steamPressure > 55).length;
    const availability = Math.min(99, (operatingPoints / dataPoints) * 100 + Math.random() * 2);

    // Performance: Actual steam output vs rated capacity (simulated)
    const avgSteamFlow = telemetry.reduce((sum, t) => sum + t.steamFlow, 0) / dataPoints;
    const ratedCapacity = 50; // TPH - should come from boiler config
    const performance = Math.min(98, (avgSteamFlow / ratedCapacity) * 100 + Math.random() * 3);

    // Quality: Steam quality based on efficiency (higher efficiency = better steam quality)
    const avgEfficiency = telemetry.reduce((sum, t) => sum + t.efficiency, 0) / dataPoints;
    const quality = Math.min(99, avgEfficiency + Math.random() * 2);

    // Calculate OEE
    const oee = (availability * performance * quality) / 10000;

    setMetrics({
      availability: parseFloat(availability.toFixed(1)),
      performance: parseFloat(performance.toFixed(1)),
      quality: parseFloat(quality.toFixed(1)),
      oee: parseFloat(oee.toFixed(1))
    });

    // Determine trend
    if (latest.efficiency > avgEfficiency + 0.5) {
      setTrend('up');
    } else if (latest.efficiency < avgEfficiency - 0.5) {
      setTrend('down');
    } else {
      setTrend('stable');
    }

    // Simulate running hours
    setRunningHours({
      today: Math.floor(Math.random() * 4 + 20), // 20-24 hours
      month: Math.floor(Math.random() * 50 + 650) // 650-700 hours
    });

    // Calculate losses (simulated)
    const totalLoss = 100 - oee;
    setLosses({
      plannedDowntime: parseFloat((totalLoss * 0.3).toFixed(1)),
      unplannedDowntime: parseFloat((totalLoss * 0.25).toFixed(1)),
      speedLoss: parseFloat((totalLoss * 0.25).toFixed(1)),
      qualityLoss: parseFloat((totalLoss * 0.2).toFixed(1))
    });

  }, [telemetry]);

  const getOEEColor = (value: number) => {
    if (value >= 85) return 'text-green-500';
    if (value >= 70) return 'text-yellow-500';
    if (value >= 55) return 'text-orange-500';
    return 'text-red-500';
  };

  const getOEEBgColor = (value: number) => {
    if (value >= 85) return 'bg-green-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getOEEGradient = (value: number) => {
    if (value >= 85) return 'from-green-500 to-emerald-600';
    if (value >= 70) return 'from-yellow-500 to-amber-600';
    if (value >= 55) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-700';
  };

  const getOEEStatus = (value: number) => {
    if (value >= 85) return { label: 'World Class', icon: CheckCircle };
    if (value >= 70) return { label: 'Good', icon: TrendingUp };
    if (value >= 55) return { label: 'Average', icon: Activity };
    return { label: 'Needs Improvement', icon: AlertTriangle };
  };

  const status = getOEEStatus(metrics.oee);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">OEE Dashboard</h2>
              <p className="text-slate-400 text-sm">{boilerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300">Live</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Main OEE Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Circular Progress */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#oeeGradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(metrics.oee / 100) * 440} 440`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="oeeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={metrics.oee >= 85 ? 'text-green-500' : metrics.oee >= 70 ? 'text-yellow-500' : 'text-red-500'} stopColor="currentColor" />
                  <stop offset="100%" className={metrics.oee >= 85 ? 'text-emerald-600' : metrics.oee >= 70 ? 'text-amber-600' : 'text-red-700'} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getOEEColor(metrics.oee)}`}>
                {metrics.oee}%
              </span>
              <span className="text-sm font-medium text-slate-500">OEE</span>
              <div className="flex items-center gap-1 mt-1">
                <StatusIcon className={`w-4 h-4 ${getOEEColor(metrics.oee)}`} />
                <span className={`text-xs font-medium ${getOEEColor(metrics.oee)}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target vs Actual */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <Target className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Target: <strong>{targetOEE}%</strong></span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            metrics.oee >= targetOEE ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {metrics.oee >= targetOEE ? (
              <>
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+{(metrics.oee - targetOEE).toFixed(1)}% above target</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">{(targetOEE - metrics.oee).toFixed(1)}% below target</span>
              </>
            )}
          </div>
        </div>

        {/* OEE Components */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Availability */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase">Availability</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{metrics.availability}%</div>
            <div className="w-full h-2 bg-blue-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.availability}%` }}
              />
            </div>
          </div>

          {/* Performance */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700 uppercase">Performance</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{metrics.performance}%</div>
            <div className="w-full h-2 bg-purple-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.performance}%` }}
              />
            </div>
          </div>

          {/* Quality */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase">Quality</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900">{metrics.quality}%</div>
            <div className="w-full h-2 bg-emerald-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.quality}%` }}
              />
            </div>
          </div>
        </div>

        {/* Running Hours */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Today's Running</p>
                <p className="text-xl font-bold text-slate-900">{runningHours.today} <span className="text-sm text-slate-400">hrs</span></p>
              </div>
              <div className="p-3 bg-slate-200 rounded-lg">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Monthly Total</p>
                <p className="text-xl font-bold text-slate-900">{runningHours.month} <span className="text-sm text-slate-400">hrs</span></p>
              </div>
              <div className="p-3 bg-slate-200 rounded-lg">
                <BarChart3 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Loss Analysis */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Loss Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Planned Downtime</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${losses.plannedDowntime * 3}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-700 w-12 text-right">{losses.plannedDowntime}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Unplanned Downtime</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${losses.unplannedDowntime * 3}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-700 w-12 text-right">{losses.unplannedDowntime}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Speed Loss</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${losses.speedLoss * 3}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-700 w-12 text-right">{losses.speedLoss}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Quality Loss</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${losses.qualityLoss * 3}%` }} />
                </div>
                <span className="text-sm font-medium text-slate-700 w-12 text-right">{losses.qualityLoss}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OEEDashboard;
