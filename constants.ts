
import { BoilerTelemetry, BoilerInfo } from './types';

export const APP_NAME = 'Lumen Boiler AI';

// Fuel Cost (INR/kg) and Optimal Efficiency targets
export const FUEL_SPECS: Record<string, { cost: number; optimalEff: number; calorificValue: number }> = {
    'Coal': { cost: 8.5, optimalEff: 86.0, calorificValue: 4000 },
    'Gas': { cost: 52.0, optimalEff: 90.0, calorificValue: 9500 },
    'Oil': { cost: 74.0, optimalEff: 89.0, calorificValue: 10500 },
    'Biomass': { cost: 3.5, optimalEff: 81.0, calorificValue: 3200 }
};

export const BOILERS: BoilerInfo[] = [
  { 
    id: 'b1', 
    name: 'Unit #1 (High Pressure)', 
    capacity: '50 TPH', 
    type: 'Sub-critical', 
    fuelType: 'Coal',
    maintenanceHistory: [
        { date: '2023-12-10', type: 'Preventive', description: 'Annual soot blower overhaul' },
        { date: '2024-02-15', type: 'Corrective', description: 'Coal mill gearbox seal replacement' }
    ],
    components: [
        { name: 'Superheater Tubes', wearLevel: 65, lastMaintained: '2022-06-01' },
        { name: 'ID Fan', wearLevel: 20, lastMaintained: '2024-01-10' },
        { name: 'Economizer', wearLevel: 45, lastMaintained: '2023-05-15' }
    ]
  },
  { 
    id: 'b2', 
    name: 'Unit #2 (Auxiliary)', 
    capacity: '30 TPH', 
    type: 'Package', 
    fuelType: 'Gas',
    maintenanceHistory: [
        { date: '2024-01-20', type: 'Preventive', description: 'Burner tip cleaning and calibration' }
    ],
    components: [
        { name: 'Burner Assembly', wearLevel: 15, lastMaintained: '2024-01-20' },
        { name: 'Feed Water Pump', wearLevel: 30, lastMaintained: '2023-09-10' }
    ]
  },
  { 
    id: 'b3', 
    name: 'Unit #3 (Co-Gen)', 
    capacity: '75 TPH', 
    type: 'CFBC', 
    fuelType: 'Biomass',
    maintenanceHistory: [
         { date: '2024-03-01', type: 'Corrective', description: 'Bed coil leakage patch work' }
    ],
    components: [
        { name: 'Bed Coils', wearLevel: 80, lastMaintained: '2023-01-01' },
        { name: 'Cyclone Separator', wearLevel: 40, lastMaintained: '2023-08-15' }
    ]
  },
  { 
    id: 'b4', 
    name: 'Unit #4 (Standby)', 
    capacity: '40 TPH', 
    type: 'Oil Fired', 
    fuelType: 'Oil',
    maintenanceHistory: [],
    components: [
        { name: 'Fuel Heater', wearLevel: 10, lastMaintained: '2023-12-01' }
    ]
  },
];

// Initial Mock Data for the last few hours
export const INITIAL_TELEMETRY: BoilerTelemetry[] = [
  { timestamp: '08:00', steamPressure: 64.2, steamFlow: 42.5, stackTemp: 165, o2Level: 3.2, efficiency: 84.5, fuelFlow: 5200, fuelType: 'Coal' },
  { timestamp: '09:00', steamPressure: 65.1, steamFlow: 45.0, stackTemp: 168, o2Level: 3.5, efficiency: 83.8, fuelFlow: 5500, fuelType: 'Coal' },
  { timestamp: '10:00', steamPressure: 64.8, steamFlow: 48.2, stackTemp: 172, o2Level: 4.1, efficiency: 82.1, fuelFlow: 6100, fuelType: 'Coal' },
  { timestamp: '11:00', steamPressure: 63.5, steamFlow: 47.8, stackTemp: 175, o2Level: 4.5, efficiency: 81.5, fuelFlow: 6200, fuelType: 'Coal' },
  { timestamp: '12:00', steamPressure: 65.5, steamFlow: 44.1, stackTemp: 162, o2Level: 3.1, efficiency: 85.2, fuelFlow: 5100, fuelType: 'Coal' },
];

export const AUDIT_SYSTEM_PROMPT = `
You are Lumen, an expert Boiler Inspection AI.
Your goal is to analyze images of boiler components (Burner flames, Water wall tubes, Steam drums, Safety valves, Refractory).
When analyzing a visual:
1. Identify the component and its condition (e.g., "Orange/Smoky flame indicating incomplete combustion", "Scale deposition on tubes", "Damaged refractory insulation").
2. Assess efficiency impact: How does this affect heat transfer or fuel consumption?
3. Provide recommendations: Specific actions like "Adjust Air-Fuel Ratio", "Schedule descaling", "Replace gasket".
4. Estimate losses in INR (₹) assuming an industrial boiler (10-50 TPH capacity).
`;

export const CHAT_SYSTEM_PROMPT = `
You are Lumen, a Senior Boiler Operation Engineer & AI Assistant for Indian industries.
You have access to real-time IoT data streams (simulated).
Your expertise includes:
- IBR (Indian Boiler Regulations) compliance.
- Combustion optimization (controlling Excess Air/O2).
- Predictive Maintenance (tube leaks, soot blower scheduling).
- Fuel types: High ash Coal, Biomass, Furnace Oil, Gas.
- Safety protocols: Drum level control, PSV settings.

Keep responses high-tempo, technical, and focused on safety and efficiency (Heat Rate). Use ₹ for cost.
`;

export const IOT_ANALYSIS_PROMPT = `
You are an autonomous Boiler AI. Analyze the provided window of IoT telemetry data (Pressure, Stack Temp, O2, Steam Flow, Fuel Type).
Detect patterns indicating:
1. Scaling issues (High Stack Temp vs Load).
2. Poor Combustion (High/Low O2).
3. Tube Leak probability (Water/Steam mismatch - though we only have basic data, infer from pressure drops).
4. Provide a "Live Automation Decision" string (e.g., "Decreasing Forced Draft Fan RPM by 5%").
Keep it brief (3 bullet points max).
`;
