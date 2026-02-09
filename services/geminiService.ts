
import { GoogleGenAI, Type } from "@google/genai";
import { AUDIT_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, IOT_ANALYSIS_PROMPT } from "../constants";
import { AuditResult, BoilerTelemetry, MaintenancePrediction, BoilerInfo, FailureRisk } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL = 'gemini-3-flash-preview';
const VISION_MODEL = 'gemini-3-flash-preview'; 
const REASONING_MODEL = 'gemini-3-pro-preview';

// --- Error Handling Helpers ---

const isSuppressedError = (e: any) => {
    // Check nested error object (standard Google JSON error structure)
    if (e?.error) {
        if (e.error.code === 429 || e.error.status === 'RESOURCE_EXHAUSTED') return true;
        if (e.error.code === 500 || e.error.code === 503) return true;
    }
    
    // Check top level properties
    const code = e?.status || e?.code;
    const msg = e?.message || '';
    
    if (code === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) return true;
    if (code === 500 || code === 503 || msg.includes('500') || msg.includes('Rpc failed')) return true;
    
    return false;
};

// --- Local Fallback Logic (Offline Mode) ---

const generateOfflinePrediction = (telemetry: BoilerTelemetry[], fuelType: string): MaintenancePrediction => {
    const latest = telemetry[telemetry.length - 1];
    let score = 100;
    const risks: FailureRisk[] = [];
    let summary = "System operating within parameters.";

    // Pressure Logic
    if (latest.steamPressure > 70) {
        score -= 25;
        risks.push({
            component: "Safety Valve",
            probability: "95%",
            severity: "Critical",
            timeHorizon: "Immediate",
            description: "Pressure > MAWP. Manual relief required."
        });
        summary = "CRITICAL: Overpressure condition detected.";
    } else if (latest.steamPressure > 68) {
        score -= 10;
        risks.push({
            component: "Pressure Controller",
            probability: "40%",
            severity: "Medium",
            timeHorizon: "4 Hours",
            description: "Pressure approaching safety limit."
        });
    }

    // Temperature Logic
    if (latest.stackTemp > 190) {
        score -= 15;
        risks.push({
            component: "Economizer",
            probability: "75%",
            severity: "High",
            timeHorizon: "24 Hours",
            description: "High stack temp indicates fouling."
        });
    } else if (latest.stackTemp > 180) {
        score -= 5;
        risks.push({
            component: "Soot Blower",
            probability: "30%",
            severity: "Low",
            timeHorizon: "48 Hours",
            description: "Efficiency drop detected."
        });
    }

    // Default healthy state
    if (risks.length === 0) {
        risks.push({
            component: "General",
            probability: "Low",
            severity: "Low",
            timeHorizon: "N/A",
            description: "Parameters nominal. Monitoring active."
        });
    }

    return {
        healthScore: Math.max(0, score),
        summary: summary + " (Offline Mode)",
        risks: risks
    };
};

const generateOfflineAnalysis = (telemetry: BoilerTelemetry[], fuelType: string): string => {
    const latest = telemetry[telemetry.length - 1];
    const alerts = [];
    if (latest.steamPressure > 68) alerts.push("High Pressure");
    if (latest.stackTemp > 180) alerts.push("High Stack Temp");
    if (latest.o2Level < 2) alerts.push("Low O2");

    if (alerts.length > 0) {
        return `⚠️ **Alert (Offline)**: Detected ${alerts.join(', ')}. Check gauges immediately.`;
    }
    return `✅ **Stable (Offline)**: Connection to AI limited. Local monitoring indicates nominal operation.`;
};

// --- API Services ---

export const chatWithLumen = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: TEXT_MODEL,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error: any) {
    if (isSuppressedError(error)) {
         return "I'm currently offline due to high traffic. Please check the dashboard for manual readings.";
    }
    console.error("Chat Error:", error);
    return "Communication link unstable.";
  }
};

export const chatWithLumenStream = async (
  history: {role: string, parts: {text: string}[]}[], 
  message: string,
  onChunk: (chunk: string) => void
) => {
  try {
    const chat = ai.chats.create({
      model: TEXT_MODEL,
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
      },
      history: history
    });

    const stream = await chat.sendMessageStream({ message });
    
    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.text || '';
      fullText += text;
      onChunk(fullText);
    }
    
    return fullText;
  } catch (error: any) {
    if (isSuppressedError(error)) {
      const errorMsg = "I'm currently offline due to high traffic. Please check the dashboard for manual readings.";
      onChunk(errorMsg);
      return errorMsg;
    }
    console.error("Chat Error:", error);
    const errorMsg = "Communication link unstable.";
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const analyzeImageForAudit = async (base64Image: string, mimeType: string): Promise<AuditResult> => {
  try {
    const auditSchema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['component', 'insulation', 'combustion', 'safety'] },
              efficiencyRating: { type: Type.STRING, enum: ['Optimal', 'Average', 'Critical', 'Unknown'] },
              estimatedConsumption: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            },
            required: ["name", "type", "efficiencyRating", "estimatedConsumption", "recommendation"]
          }
        },
        overallSummary: { type: Type.STRING },
        potentialSavings: { type: Type.STRING }
      },
      required: ["items", "overallSummary", "potentialSavings"]
    };

    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: "Analyze this industrial boiler image. Return JSON." }
        ]
      },
      config: {
        systemInstruction: AUDIT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: auditSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AuditResult;
    } else {
      throw new Error("No response text generated");
    }

  } catch (error: any) {
    if (isSuppressedError(error)) {
        throw new Error("AI services currently unavailable (Rate Limit). Try again in 1 minute.");
    }
    console.error("Audit Error:", error);
    throw new Error("Failed to analyze the image.");
  }
};

export const analyzeBoilerIoT = async (telemetryWindow: BoilerTelemetry[], fuelType: string) => {
    const dataString = JSON.stringify(telemetryWindow);
    const prompt = `Analyze this boiler telemetry window (JSON): ${dataString}. The boiler is currently running on ${fuelType} fuel. \n${IOT_ANALYSIS_PROMPT}`;

    try {
        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });
        return response.text;
    } catch (error: any) {
        // Only log errors that are NOT rate limits or standard server errors
        if (!isSuppressedError(error)) {
             console.warn(`Primary IoT Analysis failed: ${error?.message}`);
        }

        try {
            // Short delay to avoid hammering if it's a transient network issue
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const fallbackResponse = await ai.models.generateContent({
                model: TEXT_MODEL,
                contents: prompt,
            });
            return fallbackResponse.text;
        } catch (fbError: any) {
            // Silent fallback to heuristics - do not log here to prevent console noise
            return generateOfflineAnalysis(telemetryWindow, fuelType);
        }
    }
};

export const predictMaintenance = async (telemetryWindow: BoilerTelemetry[], boilerContext: BoilerInfo): Promise<MaintenancePrediction> => {
    const dataString = JSON.stringify(telemetryWindow);
    const contextString = JSON.stringify({
        id: boilerContext.id,
        type: boilerContext.type,
        fuel: boilerContext.fuelType,
        history: boilerContext.maintenanceHistory,
        components: boilerContext.components
    });

    const schema = {
        type: Type.OBJECT,
        properties: {
            healthScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            risks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        component: { type: Type.STRING },
                        probability: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        timeHorizon: { type: Type.STRING },
                        description: { type: Type.STRING }
                    }
                }
            }
        },
        required: ["healthScore", "summary", "risks"]
    };

    const prompt = `
    Analyze boiler telemetry & history.
    Context: ${contextString}
    Telemetry: ${dataString}
    Task: Calculate Health Score (0-100), predict failures, identify 2 risks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: REASONING_MODEL, 
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 2048 } 
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as MaintenancePrediction;
        }
        throw new Error("No prediction generated");
    } catch (e: any) {
        // Use helper to suppress known API errors
        if (!isSuppressedError(e)) {
             console.error("Prediction Error (Non-API):", e);
        }
        
        // Fallback to local heuristic
        return generateOfflinePrediction(telemetryWindow, boilerContext.fuelType);
    }
};

export interface OptimizationInsight {
    status: 'Optimal' | 'Action Required' | 'Warning';
    headline: string;
    analysis: string;
    recommendation: string;
}

export const generateOptimizationInsight = async (telemetry: BoilerTelemetry[], fuelType: string): Promise<OptimizationInsight> => {
    const latest = telemetry[telemetry.length - 1];
    const avgEfficiency = telemetry.reduce((sum, t) => sum + t.efficiency, 0) / telemetry.length;
    
    const prompt = `
    Analyze this industrial boiler telemetry context for IMMEDIATE operational optimization.
    
    Fuel: ${fuelType}
    Latest Reading: 
    - Pressure: ${latest.steamPressure} bar
    - Temp: ${latest.stackTemp} °C
    - O2: ${latest.o2Level}%
    - Efficiency: ${latest.efficiency}%
    
    Recent Avg Efficiency: ${avgEfficiency.toFixed(1)}%
    
    Provide a JSON response with:
    1. status: "Optimal", "Action Required", or "Warning"
    2. headline: Short 3-5 word summary (e.g., "O2 Excess Causing Heat Loss")
    3. analysis: One sentence explaining the physics.
    4. recommendation: One specific control room action (e.g., "Reduce O2 trim by 0.5%").
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: ["Optimal", "Action Required", "Warning"] },
            headline: { type: Type.STRING },
            analysis: { type: Type.STRING },
            recommendation: { type: Type.STRING }
        },
        required: ["status", "headline", "analysis", "recommendation"]
    };

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL, // Fast model is sufficient for tips
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as OptimizationInsight;
        }
        throw new Error("No insight generated");
    } catch (e) {
        // Fallback
        return {
            status: 'Warning',
            headline: 'AI Connection Unavailable',
            analysis: 'Unable to process real-time optimization logic.',
            recommendation: 'Monitor standard parameters per SOP.'
        };
    }
};
