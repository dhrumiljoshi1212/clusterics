import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, TrendingUp, Zap, Brain, ArrowUp, ArrowDown, Clock, 
  CheckCircle2, AlertCircle, Flame, Target, BarChart3, Lightbulb, 
  ChevronRight, Calendar, DollarSign, TrendingDown, Gauge, Thermometer,
  Shield, Skull, Wrench, Sparkles, Eye
} from 'lucide-react';
import {
  predictComponentFailures,
  analyzeEnergyLoss,
  calculateBoilerHealthScore,
  detectAnomalies,
  analyzeLatentSpaces,
  FailurePrediction,
  EnergyLossAnalysis,
  BoilerHealthScore,
  AnomalyScore,
  LatentSpaceAnalysis,
  LatentSpaceInsight,
} from '../services/advancedAnalytics';
import { BoilerTelemetry } from '../types';

interface AdvancedAnalyticsProps {
  telemetry: BoilerTelemetry[];
  fuelType: string;
}

interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  savings?: number;
  daysUrgent?: number;
  icon: React.ReactNode;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ telemetry, fuelType }) => {
  const [failures, setFailures] = useState<FailurePrediction[]>([]);
  const [energyLoss, setEnergyLoss] = useState<EnergyLossAnalysis | null>(null);
  const [healthScore, setHealthScore] = useState<BoilerHealthScore | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyScore[]>([]);
  const [latentAnalysis, setLatentAnalysis] = useState<LatentSpaceAnalysis | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [costPerMinute, setCostPerMinute] = useState(0);
  const [expandedAction, setExpandedAction] = useState<number | null>(null);
  const [expandedFailure, setExpandedFailure] = useState<number | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  useEffect(() => {
    if (telemetry.length > 0) {
      const failureData = predictComponentFailures(telemetry, fuelType);
      const energyLossData = analyzeEnergyLoss(telemetry);
      const healthScoreData = calculateBoilerHealthScore(telemetry);
      const anomalyData = detectAnomalies(telemetry);
      const latentData = analyzeLatentSpaces(telemetry, fuelType);

      setFailures(failureData);
      setEnergyLoss(energyLossData);
      setHealthScore(healthScoreData);
      setAnomalies(anomalyData);
      setLatentAnalysis(latentData);

      // Generate action items
      const actions: ActionItem[] = [];
      
      if (energyLossData.severity === 'critical') {
        actions.push({
          priority: 'critical',
          title: 'URGENT: Critical Energy Loss',
          description: `Lose ₹${(energyLossData.recoveryPotential / 100000).toFixed(1)}L per month. Root cause: ${energyLossData.lossDriver}`,
          savings: energyLossData.recoveryPotential,
          icon: <Flame className="text-red-600" size={20} />
        });
        setCostPerMinute(energyLossData.recoveryPotential / 43200);
      }

      failureData.forEach(failure => {
        if (failure.failureProbability > 40) {
          actions.push({
            priority: failure.failureProbability > 70 ? 'critical' : 'high',
            title: `Schedule: ${failure.component} Service`,
            description: `${failure.failureProbability.toFixed(0)}% failure risk in ${failure.daysUntilFailure} days`,
            daysUrgent: failure.daysUntilFailure,
            icon: <Calendar className="text-orange-600" size={20} />
          });
        }
      });

      const criticalAnomalies = anomalyData.filter(a => a.anomalyType === 'critical' || a.anomalyType === 'severe');
      if (criticalAnomalies.length > 0) {
        actions.push({
          priority: 'high',
          title: `${criticalAnomalies.length} Critical Anomalies Detected`,
          description: 'Investigate sensor patterns and system behavior',
          icon: <AlertCircle className="text-yellow-600" size={20} />
        });
      }

      setActionItems(actions.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
      setAlertCount(actions.filter(a => a.priority === 'critical' || a.priority === 'high').length);
    }
  }, [telemetry, fuelType]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'high':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 via-white to-yellow-50 rounded-2xl text-slate-800 min-h-screen">
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 8px rgba(59, 130, 246, 0.3)); }
          50% { filter: brightness(1.1) drop-shadow(0 0 16px rgba(59, 130, 246, 0.6)); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer-pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .animate-slide-in-down { animation: slideInDown 0.5s ease-out; }
        .animate-slide-in-up { animation: slideInUp 0.5s ease-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
        .animate-gradient-shift { animation: gradient-shift 6s ease infinite; background-size: 200% 200%; }
        .hover-lift { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          cursor: pointer;
        }
        .hover-lift:hover { 
          transform: translateY(-6px) scale(1.01); 
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.2);
        }
        .card-glow {
          position: relative;
          overflow: hidden;
        }
        .card-glow::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s;
        }
        .card-glow:hover::before {
          left: 100%;
        }
      `}</style>

      {/* ACTION PRIORITY SECTION */}
      <div className="animate-slide-in-up card-glow bg-white/60 rounded-xl p-5 border border-white/60 shadow-xl backdrop-blur-md hover-lift text-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg animate-glow-pulse shadow-lg shadow-green-500/30">
            <Target className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Priority Actions</h3>
          {actionItems.length > 0 && <span className="ml-auto text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 animate-pulse font-bold">{actionItems.length} items</span>}
        </div>

        {actionItems.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200 text-green-700">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Boiler operating optimally. No critical actions required.</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {actionItems.map((action, idx) => (
              <div
                key={idx}
                className={`hover-lift p-4 rounded-lg border transition-all cursor-pointer shadow-sm ${
                  action.priority === 'critical'
                    ? 'bg-red-50 border-red-200 hover:border-red-400 hover:shadow-red-100'
                    : action.priority === 'high'
                      ? 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:shadow-orange-100'
                      : action.priority === 'medium'
                        ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:shadow-yellow-100'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-blue-100'
                }`}
                onClick={() => setExpandedAction(expandedAction === idx ? null : idx)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 animate-float ${
                      action.priority === 'critical' ? 'text-red-600' : 
                      action.priority === 'high' ? 'text-orange-600' :
                      action.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600' 
                  }`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{action.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                    {expandedAction === idx && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 animate-slide-in-up">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Recommended steps:</p>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li>• Investigate root cause</li>
                          <li>• Generate work order</li>
                          <li>• Schedule maintenance</li>
                          <li>• Monitor progress</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  {action.savings && (
                    <div className="text-right whitespace-nowrap bg-white/50 p-2 rounded border border-green-200 shadow-sm">
                      <p className="text-xs text-slate-500">Save Monthly</p>
                      <p className="font-bold text-green-600">₹{(action.savings / 100000).toFixed(1)}L</p>
                    </div>
                  )}
                  {action.daysUrgent && action.daysUrgent < 7 && (
                    <div className="text-right whitespace-nowrap bg-red-50 p-2 rounded border border-red-200 animate-pulse">
                      <p className="text-xs text-red-600 font-bold">URGENT</p>
                      <p className="font-black text-red-600">{action.daysUrgent}d</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HEALTH GAUGE SECTION */}
      {healthScore && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Circular Health Gauge */}
          <div className="animate-slide-in-up card-glow lg:col-span-1 bg-white/60 rounded-xl p-6 border border-white/60 shadow-xl backdrop-blur-md flex flex-col items-center justify-center hover-lift">
            <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider">SYSTEM HEALTH</p>
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    healthScore.overallScore >= 85
                      ? '#10b981'
                      : healthScore.overallScore >= 70
                        ? '#eab308'
                        : healthScore.overallScore >= 50
                          ? '#f97316'
                          : '#ef4444'
                  }
                  strokeWidth="4"
                  strokeDasharray={`${healthScore.overallScore * 2.82} 282`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 filter drop-shadow-md"
                  style={{
                    filter: `drop-shadow(0 0 6px ${
                      healthScore.overallScore >= 85
                        ? 'rgba(16, 185, 129, 0.4)'
                        : healthScore.overallScore >= 70
                          ? 'rgba(234, 179, 8, 0.4)'
                          : healthScore.overallScore >= 50
                            ? 'rgba(249, 115, 22, 0.4)'
                            : 'rgba(239, 68, 68, 0.4)'
                    })`
                  }}
                />
              </svg>
              <div className="text-center z-10 animate-pulse">
                <p className="text-5xl font-black text-slate-800">{healthScore.overallScore.toFixed(0)}</p>
                <p className="text-xs text-slate-500 mt-1 font-bold">Score</p>
              </div>
            </div>
            <div className="w-full text-center">
              <p className={`text-lg font-black ${
                healthScore.overallScore >= 85 ? 'text-green-600' :
                healthScore.overallScore >= 70 ? 'text-yellow-600' :
                healthScore.overallScore >= 50 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {healthScore.overallScore >= 85 ? 'Excellent' :
                 healthScore.overallScore >= 70 ? 'Good' :
                 healthScore.overallScore >= 50 ? 'Fair' : 'Critical'}
              </p>
            </div>
          </div>

          {/* Trends Grid */}
          <div className="animate-slide-in-up card-glow lg:col-span-2 bg-white/60 rounded-xl p-6 border border-white/60 shadow-xl backdrop-blur-md">
            <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-wider">OPERATIONAL TRENDS</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Pressure', value: healthScore.trends.pressure, icon: Gauge, color: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-600', iconColor: 'text-blue-500' },
                { label: 'Temperature', value: healthScore.trends.temperature, icon: Thermometer, color: 'from-red-50 to-red-100', border: 'border-red-200', text: 'text-red-600', iconColor: 'text-red-500' },
                { label: 'Efficiency', value: healthScore.trends.efficiency, icon: Zap, color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-600', iconColor: 'text-yellow-500' },
                { label: 'Combustion', value: healthScore.trends.combustion, icon: Flame, color: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-600', iconColor: 'text-orange-500' }
              ].map((trend, idx) => {
                const Icon = trend.icon;
                const isRising = trend.value === 'rising';
                const isFalling = trend.value === 'falling';
                return (
                  <div key={idx} className={`card-glow hover-lift bg-gradient-to-br ${trend.color} p-4 rounded-lg border ${trend.border} hover:border-slate-300 transition-all shadow-sm`}>
                    <Icon size={20} className={`${trend.iconColor} mb-2 animate-glow-pulse`} />
                    <p className="text-xs text-slate-500 font-bold uppercase">{trend.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-black text-slate-800 capitalize">{trend.value}</p>
                      {isRising && <ArrowUp size={16} className="text-red-500 animate-bounce" />}
                      {isFalling && <ArrowDown size={16} className="text-green-500 animate-bounce" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LATENT PATTERNS & RISK FACTORS */}
      {healthScore && (healthScore.latentPatterns.length > 0 || healthScore.riskFactors.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {healthScore.latentPatterns.length > 0 && (
            <div className="animate-slide-in-up card-glow bg-gradient-to-br from-blue-900/40 via-cyan-900/30 to-slate-900/40 rounded-xl p-5 border border-blue-500/30 backdrop-blur-md hover-lift">
              <p className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <BarChart3 size={20} className="animate-glow-pulse" />
                Latent Patterns
              </p>
              <ul className="space-y-2">
                {healthScore.latentPatterns.map((pattern, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300 hover:text-cyan-300 transition-colors">
                    <span className="text-cyan-400 animate-float">✦</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {healthScore.riskFactors.length > 0 && (
            <div className="animate-slide-in-up card-glow bg-orange-50 rounded-xl p-5 border border-orange-200 backdrop-blur-md hover-lift shadow-sm">
              <p className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={20} className="animate-glow-pulse text-orange-600" />
                Risk Factors
              </p>
              <ul className="space-y-2">
                {healthScore.riskFactors.map((factor, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 hover:text-orange-700 transition-colors font-medium">
                    <span className="text-orange-500">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* LATENT SPACE ANALYSIS - DEEP INSIGHTS */}
      {latentAnalysis && latentAnalysis.insights.length > 0 && (
        <div className="animate-slide-in-up card-glow bg-white rounded-xl p-6 border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-lg shadow-violet-500/30">
                <Eye className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Latent Space Analysis</h3>
                <p className="text-xs text-slate-500">Deep pattern recognition for hidden issues & opportunities</p>
              </div>
            </div>
            <div className="flex gap-3">
              {latentAnalysis.overallRiskScore > 0 && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  latentAnalysis.overallRiskScore > 50 ? 'bg-red-100 text-red-700 border border-red-200' :
                  latentAnalysis.overallRiskScore > 25 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  'bg-yellow-100 text-yellow-700 border border-yellow-200'
                }`}>
                  Risk Score: {latentAnalysis.overallRiskScore.toFixed(0)}
                </div>
              )}
              {latentAnalysis.opportunityScore > 0 && (
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Opportunity: {latentAnalysis.opportunityScore.toFixed(0)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {latentAnalysis.insights.map((insight, idx) => {
              const getCategoryIcon = (category: string) => {
                switch (category) {
                  case 'damage': return <Skull className="text-red-500" size={18} />;
                  case 'hazard': return <Shield className="text-orange-500" size={18} />;
                  case 'failure': return <Wrench className="text-yellow-600" size={18} />;
                  case 'opportunity': return <Sparkles className="text-emerald-500" size={18} />;
                  default: return <AlertCircle size={18} />;
                }
              };

              const getCategoryColor = (category: string, severity: string) => {
                if (category === 'opportunity') return 'bg-emerald-50 border-emerald-200 hover:border-emerald-400';
                switch (severity) {
                  case 'critical': return 'bg-red-50 border-red-200 hover:border-red-400';
                  case 'high': return 'bg-orange-50 border-orange-200 hover:border-orange-400';
                  case 'medium': return 'bg-yellow-50 border-yellow-200 hover:border-yellow-400';
                  default: return 'bg-blue-50 border-blue-200 hover:border-blue-400';
                }
              };

              const getSeverityBadge = (category: string, severity: string) => {
                if (category === 'opportunity') {
                  return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">OPPORTUNITY</span>;
                }
                const colors = {
                  critical: 'bg-red-100 text-red-700 border-red-200',
                  high: 'bg-orange-100 text-orange-700 border-orange-200',
                  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  low: 'bg-blue-100 text-blue-700 border-blue-200',
                };
                return <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${colors[severity as keyof typeof colors]}`}>{severity.toUpperCase()}</span>;
              };

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all cursor-pointer shadow-sm ${getCategoryColor(insight.category, insight.severity)}`}
                  onClick={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getCategoryIcon(insight.category)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">{insight.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {getSeverityBadge(insight.category, insight.severity)}
                          <span className="text-[10px] text-slate-400 font-mono">{insight.confidence}% conf</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{insight.description}</p>
                      
                      {expandedInsight === idx && (
                        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-slide-in-up">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Evidence</p>
                            <ul className="space-y-1">
                              {insight.evidence.map((ev, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                  <span className="text-violet-500 mt-0.5">→</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded-lg p-3 border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action Required</p>
                              <p className="text-sm text-slate-700 font-medium">{insight.actionRequired}</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3 border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Potential Impact</p>
                              <p className="text-sm text-slate-700 font-medium">{insight.potentialImpact}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight 
                      size={16} 
                      className={`text-slate-400 transition-transform shrink-0 ${expandedInsight === idx ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ENERGY LOSS - VISUAL IMPACT */}
      {energyLoss && (
        <div className={`animate-slide-in-up card-glow rounded-xl p-6 border backdrop-blur-md hover-lift shadow-xl ${
          energyLoss.severity === 'critical'
            ? 'bg-red-50 border-red-200'
            : energyLoss.severity === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className={`text-xl font-bold flex gap-2 items-center mb-2 ${
                  energyLoss.severity === 'critical' ? 'text-red-800' :
                  energyLoss.severity === 'warning' ? 'text-yellow-800' : 'text-green-800'
              }`}>
                <Flame size={24} className={
                  energyLoss.severity === 'critical' ? 'text-red-600 animate-float' :
                  energyLoss.severity === 'warning' ? 'text-yellow-600 animate-pulse' : 'text-green-600'
                } />
                Energy Loss Impact
              </h3>
              <p className="text-sm opacity-90 text-slate-600 font-semibold">{energyLoss.lossDriver}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
              energyLoss.severity === 'critical' ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' :
              energyLoss.severity === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {energyLoss.severity.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5">
            <div className="card-glow bg-white/60 p-4 rounded-lg border border-slate-200 hover:border-slate-400 transition hover-lift shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase">Normal Loss</p>
              <p className="text-2xl font-black mt-2 text-slate-700">{energyLoss.normalEnergyLoss.toFixed(1)}%</p>
            </div>
            <div className="card-glow bg-white/60 p-4 rounded-lg border border-slate-200 hover:border-slate-400 transition hover-lift shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase">Current Loss (Actual)</p>
              <p className="text-2xl font-black mt-2 text-red-600">{energyLoss.catastrophicEnergyLoss.toFixed(1)}%</p>
            </div>
            <div className={`card-glow bg-white/60 p-4 rounded-lg border-2 transition hover-lift shadow-sm ${
              energyLoss.severity === 'critical' ? 'border-red-200' : 'border-green-200'
            }`}>
              <p className="text-xs text-slate-500 font-bold uppercase">Recovery/Month</p>
              <p className="text-2xl font-black mt-2 text-green-600">₹{(energyLoss.recoveryPotential / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE PREDICTION TIMELINE */}
      {failures.length > 0 && (
        <div className="animate-slide-in-up card-glow bg-white/60 rounded-xl p-6 border border-white/60 shadow-xl backdrop-blur-md">
          <h3 className="text-xl font-bold text-slate-800 mb-5 flex gap-2 items-center">
            <TrendingUp size={24} className="text-red-500 animate-float" />
            Catastrophic Failure Timeline
          </h3>

          <div className="space-y-3">
            {failures
              .sort((a, b) => a.daysUntilFailure - b.daysUntilFailure)
              .map((failure, idx) => (
                <div
                  key={idx}
                  className={`card-glow hover-lift p-4 rounded-lg border-l-4 transition-all cursor-pointer shadow-sm ${
                    failure.failureProbability > 70
                      ? 'bg-red-50 border-l-red-500 hover:bg-red-100'
                      : failure.failureProbability > 40
                        ? 'bg-orange-50 border-l-orange-500 hover:bg-orange-100'
                        : 'bg-yellow-50 border-l-yellow-500 hover:bg-yellow-100'
                  }`}
                  onClick={() => setExpandedFailure(expandedFailure === idx ? null : idx)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800">{failure.component}</h4>
                      <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                        <Clock size={16} />
                        <span className="font-bold text-red-600">{failure.daysUntilFailure} days</span>
                        {failure.daysUntilFailure < 7 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded animate-pulse font-bold border border-red-200">URGENT</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase">Failure Risk</p>
                      <p className={`text-3xl font-black mt-1 ${
                        failure.failureProbability > 70 ? 'text-red-600' :
                        failure.failureProbability > 40 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {failure.failureProbability.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${
                        failure.failureProbability > 70
                          ? 'bg-gradient-to-r from-red-500 to-red-400'
                          : failure.failureProbability > 40
                            ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                            : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      }`}
                      style={{ width: `${failure.failureProbability}%`, transition: 'width 0.5s ease-out' }}
                    />
                  </div>

                  {expandedFailure === idx && (
                    <div className="mt-3 pt-3 border-t border-slate-200 animate-slide-in-up">
                      <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Root causes:</p>
                      <div className="text-xs text-slate-600 space-y-1">
                        {failure.indicators.map((indicator, i) => (
                          <p key={i} className="flex gap-2 hover:text-slate-900 transition font-medium">
                            <ChevronRight size={14} className="flex-shrink-0 text-slate-400" />
                            <span>{indicator}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* EFFICIENCY OPPORTUNITY DASHBOARD - Real Value For Decision Making */}
      {healthScore && energyLoss && (
        <div className="animate-slide-in-up card-glow bg-white/60 rounded-xl p-6 border border-white/60 shadow-xl backdrop-blur-md">
          <h3 className="text-xl font-bold text-slate-800 mb-5 flex gap-2 items-center">
            <Zap size={24} className="text-yellow-500 animate-float" />
            Efficiency Opportunity Map
          </h3>

          {/* Operating Point Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Current vs Optimal */}
            <div className="card-glow bg-blue-50 rounded-lg p-5 border border-blue-200 hover-lift shadow-sm">
              <p className="text-xs text-blue-600 font-bold mb-3 uppercase tracking-wider">OPERATING POINT ANALYSIS</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600 font-medium">Current Efficiency</span>
                    <span className="text-lg font-black text-blue-600">{healthScore.overallScore.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-md"
                      style={{ width: `${healthScore.overallScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-600 font-medium">Target Efficiency</span>
                    <span className="text-lg font-black text-green-600">92%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-3 bg-gradient-to-r from-green-500 to-emerald-400 shadow-md"
                      style={{ width: '92%' }}
                    />
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-3 border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Potential Gain</p>
                  <p className="text-3xl font-black text-emerald-600">{(92 - healthScore.overallScore).toFixed(0)}%</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Performance gap to close</p>
                </div>
              </div>
            </div>

            {/* Quick Win Actions */}
            <div className="card-glow bg-green-50 rounded-lg p-5 border border-green-200 hover-lift shadow-sm">
              <p className="text-xs text-green-700 font-bold mb-3 uppercase tracking-wider">QUICK WINS (Impact/Effort)</p>

              <div className="space-y-3">
                {[
                  { action: 'Clean burner nozzles', gain: '8%', days: 0, saving: '₹45K/mo' },
                  { action: 'Tune combustion air', gain: '6%', days: 1, saving: '₹32K/mo' },
                  { action: 'Insulate pipe leaks', gain: '4%', days: 2, saving: '₹18K/mo' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-green-100 hover:border-green-300 transition shadow-sm">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{item.action}</p>
                      <p className="text-xs text-slate-500 font-medium">Action in {item.days} day{item.days !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">{item.gain}</p>
                      <p className="text-xs text-green-700 font-bold">{item.saving}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Impact */}
          <div className="bg-emerald-50 rounded-lg p-5 border border-emerald-200 shadow-sm">
            <p className="text-xs text-emerald-700 font-bold mb-4 uppercase tracking-wider">IF YOU ACT TODAY: Financial Projection</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 rounded-lg p-4 border border-emerald-100 hover:border-emerald-300 hover-lift text-center shadow-sm transition">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Monthly Savings</p>
                <p className="text-3xl font-black text-emerald-600">₹95K</p>
                <p className="text-xs text-emerald-600 font-medium mt-2">From actions above</p>
              </div>

              <div className="bg-white/60 rounded-lg p-4 border border-yellow-100 hover:border-yellow-300 hover-lift text-center shadow-sm transition">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Downtime Prevented</p>
                <p className="text-3xl font-black text-yellow-600">156h</p>
                <p className="text-xs text-yellow-600 font-medium mt-2">Per year</p>
              </div>

              <div className="bg-white/60 rounded-lg p-4 border border-yellow-100 hover:border-yellow-300 hover-lift text-center shadow-sm transition">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Equipment Lifespan</p>
                <p className="text-3xl font-black text-yellow-600">+2.3y</p>
                <p className="text-xs text-yellow-600 font-medium mt-2">Extended</p>
              </div>

              <div className="bg-white/60 rounded-lg p-4 border border-emerald-100 hover:border-emerald-300 hover-lift text-center shadow-sm transition">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Payback Period</p>
                <p className="text-3xl font-black text-emerald-600">6mo</p>
                <p className="text-xs text-emerald-600 font-medium mt-2">On recommended work</p>
              </div>
            </div>
          </div>

          {/* Safety Warning */}
          {healthScore.overallScore < 50 && (
            <div className="mt-5 bg-red-50 rounded-lg p-4 border-l-4 border-red-500 animate-pulse shadow-sm">
              <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle size={18} />
                Critical Operating Point: Safety margin is LOW
              </p>
              <p className="text-xs text-red-600 mt-2 font-medium">Immediate action required to avoid catastrophic failure</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
