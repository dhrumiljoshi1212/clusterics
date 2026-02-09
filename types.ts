
export enum MessageRole {
  User = 'user',
  Model = 'model',
  System = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface AuditItem {
  name: string;
  type: 'component' | 'insulation' | 'combustion' | 'safety';
  efficiencyRating: 'Optimal' | 'Average' | 'Critical' | 'Unknown';
  estimatedConsumption: string;
  recommendation: string;
}

export interface AuditResult {
  items: AuditItem[];
  overallSummary: string;
  potentialSavings: string;
}

export enum View {
  Dashboard = 'dashboard',
  Auditor = 'auditor',
  Chat = 'chat'
}

export type FuelType = 'Coal' | 'Gas' | 'Oil' | 'Biomass';

export interface MaintenanceRecord {
    date: string;
    type: 'Preventive' | 'Corrective';
    description: string;
}

export interface ComponentStatus {
    name: string;
    wearLevel: number; // 0 to 100% (100 is worn out)
    lastMaintained: string;
}

export interface BoilerInfo {
  id: string;
  name: string;
  capacity: string;
  type: string;
  fuelType: FuelType;
  maintenanceHistory: MaintenanceRecord[];
  components: ComponentStatus[];
}

// Boiler Specific IoT Data
export interface BoilerTelemetry {
  timestamp: string;
  steamPressure: number; // kg/cm2
  steamFlow: number; // TPH
  stackTemp: number; // Celsius
  o2Level: number; // Percentage
  efficiency: number; // Percentage
  fuelFlow: number; // kg/hr
  fuelType: FuelType; // Included in data packet
}

export interface ConsumptionData {
  time: string;
  usage: number; 
  cost: number; 
  source: 'grid' | 'solar' | 'battery';
}

// Predictive Maintenance Types
export interface FailureRisk {
  component: string;
  probability: string; // e.g. "High (85%)"
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timeHorizon: string; // e.g. "48-72 hours"
  description: string;
}

export interface MaintenancePrediction {
  healthScore: number; // 0-100
  summary: string;
  risks: FailureRisk[];
}
