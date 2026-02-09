import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, BellOff, X, CheckCircle, AlertCircle, Flame, Thermometer, Activity, Volume2, VolumeX } from 'lucide-react';
import { BoilerTelemetry } from '../types';

interface Alarm {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  parameter: string;
  value: number;
  threshold: number;
  message: string;
  acknowledged: boolean;
  boilerName: string;
}

interface AlarmThresholds {
  steamPressure: { critical: number; high: number; low: number };
  stackTemp: { critical: number; high: number };
  o2Level: { high: number; low: number };
  efficiency: { critical: number; low: number };
}

interface AlarmSystemProps {
  telemetry: BoilerTelemetry[];
  boilerName: string;
  onAlarmCountChange?: (count: number) => void;
}

const DEFAULT_THRESHOLDS: AlarmThresholds = {
  steamPressure: { critical: 70, high: 68, low: 58 },
  stackTemp: { critical: 200, high: 180 },
  o2Level: { high: 8, low: 1.5 },
  efficiency: { critical: 70, low: 78 }
};

export const AlarmSystem: React.FC<AlarmSystemProps> = ({ telemetry, boilerName, onAlarmCountChange }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [thresholds] = useState<AlarmThresholds>(DEFAULT_THRESHOLDS);

  // Generate alarms from telemetry
  const checkForAlarms = useCallback((data: BoilerTelemetry) => {
    const newAlarms: Alarm[] = [];
    const timestamp = new Date();

    // Steam Pressure Alarms
    if (data.steamPressure >= thresholds.steamPressure.critical) {
      newAlarms.push({
        id: `pressure-critical-${timestamp.getTime()}`,
        timestamp,
        severity: 'critical',
        parameter: 'Steam Pressure',
        value: data.steamPressure,
        threshold: thresholds.steamPressure.critical,
        message: `CRITICAL: Steam pressure ${data.steamPressure} kg/cm² exceeds MAWP limit!`,
        acknowledged: false,
        boilerName
      });
    } else if (data.steamPressure >= thresholds.steamPressure.high) {
      newAlarms.push({
        id: `pressure-high-${timestamp.getTime()}`,
        timestamp,
        severity: 'high',
        parameter: 'Steam Pressure',
        value: data.steamPressure,
        threshold: thresholds.steamPressure.high,
        message: `HIGH: Steam pressure ${data.steamPressure} kg/cm² approaching safety limit`,
        acknowledged: false,
        boilerName
      });
    } else if (data.steamPressure <= thresholds.steamPressure.low) {
      newAlarms.push({
        id: `pressure-low-${timestamp.getTime()}`,
        timestamp,
        severity: 'medium',
        parameter: 'Steam Pressure',
        value: data.steamPressure,
        threshold: thresholds.steamPressure.low,
        message: `LOW: Steam pressure ${data.steamPressure} kg/cm² below normal operating range`,
        acknowledged: false,
        boilerName
      });
    }

    // Stack Temperature Alarms
    if (data.stackTemp >= thresholds.stackTemp.critical) {
      newAlarms.push({
        id: `stacktemp-critical-${timestamp.getTime()}`,
        timestamp,
        severity: 'critical',
        parameter: 'Stack Temperature',
        value: data.stackTemp,
        threshold: thresholds.stackTemp.critical,
        message: `CRITICAL: Stack temp ${data.stackTemp}°C indicates severe fouling or tube failure!`,
        acknowledged: false,
        boilerName
      });
    } else if (data.stackTemp >= thresholds.stackTemp.high) {
      newAlarms.push({
        id: `stacktemp-high-${timestamp.getTime()}`,
        timestamp,
        severity: 'high',
        parameter: 'Stack Temperature',
        value: data.stackTemp,
        threshold: thresholds.stackTemp.high,
        message: `HIGH: Stack temp ${data.stackTemp}°C - Schedule soot blowing`,
        acknowledged: false,
        boilerName
      });
    }

    // O2 Level Alarms
    if (data.o2Level >= thresholds.o2Level.high) {
      newAlarms.push({
        id: `o2-high-${timestamp.getTime()}`,
        timestamp,
        severity: 'medium',
        parameter: 'Excess O₂',
        value: data.o2Level,
        threshold: thresholds.o2Level.high,
        message: `Excess O₂ at ${data.o2Level}% - High excess air causing heat loss`,
        acknowledged: false,
        boilerName
      });
    } else if (data.o2Level <= thresholds.o2Level.low) {
      newAlarms.push({
        id: `o2-low-${timestamp.getTime()}`,
        timestamp,
        severity: 'high',
        parameter: 'Excess O₂',
        value: data.o2Level,
        threshold: thresholds.o2Level.low,
        message: `LOW O₂ at ${data.o2Level}% - Risk of incomplete combustion & CO`,
        acknowledged: false,
        boilerName
      });
    }

    // Efficiency Alarms
    if (data.efficiency <= thresholds.efficiency.critical) {
      newAlarms.push({
        id: `eff-critical-${timestamp.getTime()}`,
        timestamp,
        severity: 'critical',
        parameter: 'Combustion Efficiency',
        value: data.efficiency,
        threshold: thresholds.efficiency.critical,
        message: `CRITICAL: Efficiency dropped to ${data.efficiency}% - Major loss event!`,
        acknowledged: false,
        boilerName
      });
    } else if (data.efficiency <= thresholds.efficiency.low) {
      newAlarms.push({
        id: `eff-low-${timestamp.getTime()}`,
        timestamp,
        severity: 'medium',
        parameter: 'Combustion Efficiency',
        value: data.efficiency,
        threshold: thresholds.efficiency.low,
        message: `Efficiency at ${data.efficiency}% - Below target, check combustion`,
        acknowledged: false,
        boilerName
      });
    }

    return newAlarms;
  }, [boilerName, thresholds]);

  // Monitor telemetry for alarms
  useEffect(() => {
    if (telemetry.length === 0) return;
    
    const latest = telemetry[telemetry.length - 1];
    const newAlarms = checkForAlarms(latest);
    
    if (newAlarms.length > 0) {
      setAlarms(prev => {
        // Avoid duplicate alarms within 30 seconds
        const recentAlarms = prev.filter(a => 
          Date.now() - a.timestamp.getTime() < 30000
        );
        
        const filteredNew = newAlarms.filter(newAlarm => 
          !recentAlarms.some(existing => 
            existing.parameter === newAlarm.parameter && 
            existing.severity === newAlarm.severity
          )
        );
        
        if (filteredNew.length > 0 && !isMuted) {
          // Play alarm sound for critical/high
          const hasCritical = filteredNew.some(a => a.severity === 'critical' || a.severity === 'high');
          if (hasCritical) {
            playAlarmSound();
          }
        }
        
        return [...filteredNew, ...prev].slice(0, 50); // Keep last 50 alarms
      });
    }
  }, [telemetry, checkForAlarms, isMuted]);

  // Update parent with alarm count
  useEffect(() => {
    const unacknowledged = alarms.filter(a => !a.acknowledged).length;
    onAlarmCountChange?.(unacknowledged);
  }, [alarms, onAlarmCountChange]);

  const playAlarmSound = () => {
    // Create audio context for alarm beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const acknowledgeAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => 
      a.id === id ? { ...a, acknowledged: true } : a
    ));
  };

  const acknowledgeAll = () => {
    setAlarms(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const clearAcknowledged = () => {
    setAlarms(prev => prev.filter(a => !a.acknowledged));
  };

  const unacknowledgedCount = alarms.filter(a => !a.acknowledged).length;
  const criticalCount = alarms.filter(a => !a.acknowledged && a.severity === 'critical').length;

  const getSeverityStyles = (severity: Alarm['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white border-red-600 animate-pulse';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600';
      case 'medium':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'low':
        return 'bg-blue-500 text-white border-blue-600';
    }
  };

  const getSeverityIcon = (severity: Alarm['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <Flame className="w-4 h-4" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4" />;
      case 'low':
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Alarm Bell Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative p-2 rounded-lg transition-all ${
          criticalCount > 0 
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' 
            : unacknowledgedCount > 0 
              ? 'bg-orange-500 text-white' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-red-500">
            {unacknowledgedCount}
          </span>
        )}
      </button>

      {/* Alarm Panel */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Alarm Management</h2>
                    <p className="text-slate-400 text-xs">
                      {unacknowledgedCount} active • {alarms.length} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    title={isMuted ? 'Unmute alarms' : 'Mute alarms'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
              <button
                onClick={acknowledgeAll}
                disabled={unacknowledgedCount === 0}
                className="flex-1 py-2 px-3 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Acknowledge All
              </button>
              <button
                onClick={clearAcknowledged}
                className="flex-1 py-2 px-3 text-xs font-medium bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Clear Acknowledged
              </button>
            </div>

            {/* Alarm List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {alarms.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No alarms</p>
                  <p className="text-sm">System operating normally</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {alarms.map(alarm => (
                    <div
                      key={alarm.id}
                      className={`p-4 transition-colors ${alarm.acknowledged ? 'bg-slate-50 opacity-60' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 p-2 rounded-lg ${getSeverityStyles(alarm.severity)}`}>
                          {getSeverityIcon(alarm.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              alarm.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              alarm.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              alarm.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {alarm.severity}
                            </span>
                            <span className="text-xs text-slate-400">
                              {alarm.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 mb-1">
                            {alarm.parameter}: {alarm.value}
                          </p>
                          <p className="text-xs text-slate-600">
                            {alarm.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {alarm.boilerName}
                          </p>
                        </div>
                        {!alarm.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlarm(alarm.id)}
                            className="shrink-0 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Acknowledge"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlarmSystem;
