import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Flame, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { analyzeImageForAudit } from '../services/geminiService';
import { AuditResult } from '../types';

export const Auditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        handleAnalyze(base64String, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64Full: string, mimeType: string) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      // Extract base64 data part
      const base64Data = base64Full.split(',')[1];
      const auditResult = await analyzeImageForAudit(base64Data, mimeType);
      setResult(auditResult);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
          Visual Boiler Inspection
        </h2>
        <p className="text-slate-500">
          Upload photos of burner flames, tube banks, or refractory lining for AI grading.
        </p>
      </div>

      {!image ? (
        <div 
          onClick={triggerFileInput}
          className="flex-1 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-slate-50 transition-all group min-h-[300px] bg-white"
        >
          <div className="p-4 rounded-full bg-slate-100 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors mb-4 text-slate-400">
            <Flame size={48} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800">Start Visual Audit</h3>
          <p className="text-slate-500 mt-2 text-center max-w-xs">
            Capture burner view, water gauge glass, or steam traps.
          </p>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white group">
            <img src={image} alt="Analyzed" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" onClick={reset} icon={<RefreshCw size={16}/>}>
                    New Scan
                </Button>
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-orange-600 font-medium animate-pulse">Processing Flame Pattern...</p>
              </div>
            )}
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {result ? (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-orange-600 mb-1">Audit Report</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{result.overallSummary}</p>
                    <div className="mt-3 flex items-center text-sm font-medium text-green-700 bg-green-50 border border-green-100 py-2 px-3 rounded-lg w-fit">
                        <CheckCircle size={16} className="mr-2" />
                        Savings Opportunity: {result.potentialSavings}
                    </div>
                </div>

                <div className="space-y-3">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900">{item.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          item.efficiencyRating === 'Optimal' ? 'bg-green-50 border-green-200 text-green-600' :
                          item.efficiencyRating === 'Average' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' :
                          'bg-red-50 border-red-200 text-red-600'
                        }`}>
                          {item.efficiencyRating}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mb-3 space-x-3">
                         <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded capitalize">{item.type}</span>
                         <span>{item.estimatedConsumption}</span>
                      </div>
                      <div className="flex items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-600">{item.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border border-slate-200 border-dashed rounded-xl bg-slate-50">
                <Flame size={32} className="mb-3 opacity-50" />
                <p>Waiting for visual data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};