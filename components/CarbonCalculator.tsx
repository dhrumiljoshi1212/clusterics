import React, { useState, useEffect } from 'react';
import { Leaf, TrendingDown, Factory, Trees, Car, Lightbulb, Download, IndianRupee, Globe, Zap, Wind } from 'lucide-react';
import { BoilerTelemetry, FuelType } from '../types';
import { FUEL_SPECS } from '../constants';

interface CarbonMetrics {
  dailyEmissions: number; // kg CO₂
  monthlyEmissions: number; // tonnes CO₂
  yearlyEmissions: number; // tonnes CO₂
  carbonCredits: number; // Potential credits (tonnes)
  creditValue: number; // ₹
  treesEquivalent: number;
  carsEquivalent: number;
  homesEquivalent: number;
}

interface CarbonCalculatorProps {
  telemetry: BoilerTelemetry[];
  fuelType: FuelType;
  boilerCapacity: number; // TPH
}

// CO₂ Emission Factors (kg CO₂ per kg fuel)
const EMISSION_FACTORS: Record<string, number> = {
  'Coal': 2.42,      // Typical bituminous coal
  'Gas': 2.75,       // per m³, but we'll normalize to kg basis
  'Oil': 3.15,       // Furnace oil
  'Biomass': 0.0     // Carbon neutral (biogenic)
};

// Carbon Credit Price (₹ per tonne CO₂) - Based on Indian market
const CARBON_CREDIT_PRICE = 1500; // ₹/tonne CO₂

export const CarbonCalculator: React.FC<CarbonCalculatorProps> = ({
  telemetry,
  fuelType,
  boilerCapacity
}) => {
  const [metrics, setMetrics] = useState<CarbonMetrics>({
    dailyEmissions: 0,
    monthlyEmissions: 0,
    yearlyEmissions: 0,
    carbonCredits: 0,
    creditValue: 0,
    treesEquivalent: 0,
    carsEquivalent: 0,
    homesEquivalent: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [reductionTarget, setReductionTarget] = useState(10); // % reduction target

  useEffect(() => {
    if (telemetry.length === 0) return;

    const latest = telemetry[telemetry.length - 1];
    const fuelSpec = FUEL_SPECS[fuelType];
    const emissionFactor = EMISSION_FACTORS[fuelType];

    // Calculate hourly fuel consumption (kg/hr) from telemetry
    const fuelFlowKgHr = latest.fuelFlow;

    // Calculate CO₂ emissions
    const hourlyEmissions = fuelFlowKgHr * emissionFactor; // kg CO₂/hr
    const dailyEmissions = hourlyEmissions * 24; // kg CO₂/day
    const monthlyEmissions = dailyEmissions * 30 / 1000; // tonnes/month
    const yearlyEmissions = monthlyEmissions * 12; // tonnes/year

    // Carbon credit potential (if efficiency improved by target %)
    const potentialSavings = yearlyEmissions * (reductionTarget / 100);
    const creditValue = potentialSavings * CARBON_CREDIT_PRICE;

    // Equivalents for visualization
    // 1 tree absorbs ~22 kg CO₂/year
    // 1 car emits ~4.6 tonnes CO₂/year
    // 1 home uses ~7.5 tonnes CO₂/year
    const treesEquivalent = Math.round(yearlyEmissions * 1000 / 22);
    const carsEquivalent = Math.round(yearlyEmissions / 4.6);
    const homesEquivalent = Math.round(yearlyEmissions / 7.5);

    setMetrics({
      dailyEmissions: parseFloat(dailyEmissions.toFixed(0)),
      monthlyEmissions: parseFloat(monthlyEmissions.toFixed(1)),
      yearlyEmissions: parseFloat(yearlyEmissions.toFixed(1)),
      carbonCredits: parseFloat(potentialSavings.toFixed(1)),
      creditValue: Math.round(creditValue),
      treesEquivalent,
      carsEquivalent,
      homesEquivalent
    });
  }, [telemetry, fuelType, reductionTarget]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ESG Score calculation (simplified)
  const getESGScore = () => {
    if (fuelType === 'Biomass') return { score: 'A+', color: 'text-green-600', bg: 'bg-green-100' };
    if (fuelType === 'Gas') return { score: 'B+', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (fuelType === 'Oil') return { score: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { score: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
  };

  const esgScore = getESGScore();

  // Download ESG Report function
  const downloadESGReport = () => {
    const reportDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const reportContent = `
================================================================================
                         ESG SUSTAINABILITY REPORT
                              CLUSTERICS
================================================================================

Report Generated: ${reportDate}
Facility: Industrial Boiler Operations
Fuel Type: ${fuelType}
Boiler Capacity: ${boilerCapacity} TPH

--------------------------------------------------------------------------------
                           CARBON EMISSIONS SUMMARY
--------------------------------------------------------------------------------

Daily CO₂ Emissions:        ${formatNumber(metrics.dailyEmissions)} kg
Monthly CO₂ Emissions:      ${formatNumber(metrics.monthlyEmissions)} tonnes
Annual CO₂ Emissions:       ${formatNumber(metrics.yearlyEmissions)} tonnes

--------------------------------------------------------------------------------
                           ENVIRONMENTAL EQUIVALENTS
--------------------------------------------------------------------------------

Trees Required to Offset:   ${formatNumber(metrics.treesEquivalent)} trees/year
Equivalent to Cars:         ${formatNumber(metrics.carsEquivalent)} vehicles/year
Equivalent to Homes:        ${formatNumber(metrics.homesEquivalent)} households/year

--------------------------------------------------------------------------------
                           CARBON CREDIT POTENTIAL
--------------------------------------------------------------------------------

Reduction Target:           ${reductionTarget}%
Potential Carbon Credits:   ${formatNumber(metrics.carbonCredits)} tonnes CO₂
Estimated Credit Value:     ${formatCurrency(metrics.creditValue)}/year

--------------------------------------------------------------------------------
                              ESG RATING
--------------------------------------------------------------------------------

Current ESG Score:          ${esgScore.score}
Fuel Type Classification:   ${fuelType}
Emission Factor:            ${EMISSION_FACTORS[fuelType]} kg CO₂/kg fuel

--------------------------------------------------------------------------------
                         RECOMMENDED ACTIONS
--------------------------------------------------------------------------------

1. COMBUSTION OPTIMIZATION
   - Reduce excess air by 5-10%
   - Potential emission reduction: 3-5%

2. HEAT RECOVERY SYSTEMS
   - Install economizer upgrades
   - Recover waste heat from flue gas
   - Potential emission reduction: 5%

3. OPERATIONAL EFFICIENCY
   - Optimize load scheduling
   - Reduce idle time and cycling losses
   - Potential emission reduction: 2-3%

4. FUEL SWITCHING (if applicable)
   - Consider biomass co-firing
   - Evaluate natural gas conversion
   - Potential emission reduction: 20-50%

--------------------------------------------------------------------------------
                           COMPLIANCE NOTES
--------------------------------------------------------------------------------

This report is generated for internal sustainability tracking purposes.
For official carbon credit certification, please consult with:
- Bureau of Energy Efficiency (BEE)
- National Clean Development Mechanism (CDM) Authority
- Verified Carbon Standard (VCS) or Gold Standard certifiers

================================================================================
                    Generated by Clusterics AI Platform
                   Powered by Google Gemini 3 Technology
================================================================================
`;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESG_Report_${fuelType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Carbon Footprint Calculator</h2>
              <p className="text-emerald-100 text-sm">ESG Compliance & Credit Estimation</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${esgScore.bg} ${esgScore.color} font-bold text-sm`}>
            ESG: {esgScore.score}
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Main Emissions Display */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 uppercase">Daily</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.dailyEmissions)}</p>
            <p className="text-xs text-slate-400">kg CO₂</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-orange-200" />
              <span className="text-xs text-orange-200 uppercase">Monthly</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.monthlyEmissions)}</p>
            <p className="text-xs text-orange-200">tonnes CO₂</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-purple-200" />
              <span className="text-xs text-purple-200 uppercase">Yearly</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(metrics.yearlyEmissions)}</p>
            <p className="text-xs text-purple-200">tonnes CO₂</p>
          </div>
        </div>

        {/* Equivalents Visualization */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200 mb-6">
          <h3 className="text-sm font-semibold text-emerald-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Annual Emissions Equivalent To:
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Trees className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{formatNumber(metrics.treesEquivalent)}</p>
              <p className="text-xs text-slate-500">Trees needed to offset</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{formatNumber(metrics.carsEquivalent)}</p>
              <p className="text-xs text-slate-500">Cars driven for a year</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">{formatNumber(metrics.homesEquivalent)}</p>
              <p className="text-xs text-slate-500">Homes powered for a year</p>
            </div>
          </div>
        </div>

        {/* Carbon Credit Potential */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-5 rounded-xl text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Carbon Credit Opportunity
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-200">Reduction Target:</span>
              <select 
                value={reductionTarget}
                onChange={(e) => setReductionTarget(Number(e.target.value))}
                className="bg-white/20 text-white text-sm rounded-lg px-2 py-1 border border-white/30 focus:outline-none"
              >
                <option value={5}>5%</option>
                <option value={10}>10%</option>
                <option value={15}>15%</option>
                <option value={20}>20%</option>
                <option value={25}>25%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-green-200 text-xs mb-1">Potential Credits</p>
              <p className="text-2xl font-bold">{metrics.carbonCredits}</p>
              <p className="text-green-200 text-xs">tonnes CO₂/year</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-green-200 text-xs mb-1">Credit Value</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.creditValue)}</p>
              <p className="text-green-200 text-xs">@ ₹{CARBON_CREDIT_PRICE}/tonne</p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-500" />
            Decarbonization Actions
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            {fuelType !== 'Biomass' && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Switch to Biomass</p>
                    <p className="text-xs text-green-600">Carbon neutral fuel option</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                  -100% CO₂
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Optimize Efficiency</p>
                  <p className="text-xs text-blue-600">Every 1% efficiency = 1% less emissions</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                -{reductionTarget}% CO₂
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wind className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">Install Economizer</p>
                  <p className="text-xs text-purple-600">Recover waste heat from flue gas</p>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                -5% CO₂
              </span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button 
          onClick={downloadESGReport}
          className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download ESG Report
        </button>
      </div>
    </div>
  );
};

export default CarbonCalculator;
