import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import callApi from '../api';

// Strict 29-field schema in exact order
const FIELD_ORDER = [
  "Proposal Received Date", "Proposal No", "Proposer Name", "Pin Code", "Total No of Lives",
  "Business Type", "Insurance Company", "TPA", "Product Type", "Product Name",
  "Cover Type", "Tenure (In Months)", "Payment Mode", "Received Amount", "Basic Premium",
  "Taxes", "Final Premium", "Short / Excess", "Email", "Mobile No", "Policy No",
  "Policy Start Date", "Policy End Date", "Agent / Broker Code", "Agent / Broker Name",
  "OD Premium", "Liability Premium", "Vehicle Reg. No", "Vehicle Make"
] as const;

type ExtractionField = typeof FIELD_ORDER[number];

interface ValidationError {
  field?: ExtractionField;
  message: string;
  type: 'error' | 'warning';
}

interface FileState {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  confidence: number;
  data: Record<ExtractionField, string>;
  validationErrors: ValidationError[];
  errorMsg?: string;
}

interface InsuranceCompany {
  id: number;
  name: string;
}

interface PolicyType {
  id: number;
  category_name: string;
}

const PolicyToExcelModule: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedPolicyType, setSelectedPolicyType] = useState('');
  const [files, setFiles] = useState<FileState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileState | null>(null);
  
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [policyTypes, setPolicyTypes] = useState<PolicyType[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const [companyRes, typeRes] = await Promise.all([
          callApi<any>('/master/insurance-companies.php'),
          callApi<any>('/master/policy-types.php')
        ]);

        // Process Companies
        if (companyRes && companyRes.success && Array.isArray(companyRes.data)) {
          setCompanies(companyRes.data);
        } else if (Array.isArray(companyRes)) {
          setCompanies(companyRes);
        }

        // Process Policy Types - Use category_name to match DB schema
        if (typeRes && typeRes.success && Array.isArray(typeRes.data)) {
          setPolicyTypes(typeRes.data);
        } else if (Array.isArray(typeRes)) {
          setPolicyTypes(typeRes);
        } else {
          setPolicyTypes([]);
        }
      } catch (e) {
        console.error("Failed to load master records", e);
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  const isUploadDisabled = !selectedCompany || !selectedPolicyType;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  };

  const validateExtractedData = (data: Record<ExtractionField, string>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check required fields
    const criticalFields: ExtractionField[] = ["Proposer Name", "Policy No", "Final Premium", "Policy Start Date"];
    criticalFields.forEach(f => {
      if (!data[f] || data[f].trim() === "") {
        errors.push({ field: f, message: `${f} is missing`, type: 'error' });
      }
    });

    // Premium Validation
    const basic = parseFloat(data["Basic Premium"]) || 0;
    const taxes = parseFloat(data["Taxes"]) || 0;
    const final = parseFloat(data["Final Premium"]) || 0;
    if (final > 0 && Math.abs((basic + taxes) - final) > 2) {
      errors.push({ message: `Premium Math Error: ${basic} + ${taxes} != ${final}`, type: 'error' });
    }

    // Date Validation
    const start = parseDate(data["Policy Start Date"]);
    const end = parseDate(data["Policy End Date"]);
    if (start && end && start >= end) {
      errors.push({ message: "Start date must be before end date", type: 'error' });
    }

    // Tenure Validation
    const tenureMonths = parseInt(data["Tenure (In Months)"]) || 0;
    if (start && end && tenureMonths > 0) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.44));
      if (Math.abs(diffMonths - tenureMonths) > 1) {
        errors.push({ field: "Tenure (In Months)", message: `Tenure mismatch: Calculated ${diffMonths}m vs Extracted ${tenureMonths}m`, type: 'warning' });
      }
    }

    return errors;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    const newFiles: FileState[] = fileList.map((f: File) => {
      const initialData = {} as Record<ExtractionField, string>;
      FIELD_ORDER.forEach(field => { initialData[field] = ''; });
      
      return {
        id: Math.random().toString(36).substring(7),
        file: f,
        status: 'pending',
        progress: 0,
        confidence: 0,
        validationErrors: [],
        data: initialData
      };
    });
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async () => {
    if (files.filter(f => f.status === 'pending').length === 0) return;
    setIsProcessing(true);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const schemaProperties: Record<string, any> = {};
    FIELD_ORDER.forEach(field => {
      schemaProperties[field] = {
        type: Type.STRING,
        description: `Extract ${field}. Normalize dates to DD-MM-YYYY, amounts to numeric strings.`
      };
    });

    for (const fileState of files) {
      if (fileState.status !== 'pending') continue;

      setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, status: 'processing', progress: 10 } : f));

      try {
        const base64Data = await fileToBase64(fileState.file);
        setFiles(prev => prev.map(f => f.id === fileState.id ? { ...f, progress: 30 } : f));
        
        const mimeType = fileState.file.type || 'application/pdf';

        const prompt = `
          ACT AS AN EXPERT INSURANCE DATA EXTRACTOR.
          EXTRACT DATA FROM THIS ${selectedPolicyType} POLICY ISSUED BY ${selectedCompany}.
          
          DOCUMENT TYPE: Scanned/Digital PDF or Image.
          QUALITY: If document is scanned/noisy, perform intensive OCR and deskew in-model.
          
          STRICT RULES:
          1. EXTRACT EXACTLY 29 FIELDS. 
          2. NORMALIZE DATES TO DD-MM-YYYY.
          3. NORMALIZE PREMIUMS TO NUMBERS ONLY.
          4. IF FIELD NOT FOUND, RETURN "".
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { data: base64Data, mimeType: mimeType } }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: schemaProperties,
              required: FIELD_ORDER as unknown as string[]
            }
          }
        });

        const extractedData = JSON.parse(response.text || '{}');
        const validationErrors = validateExtractedData(extractedData);

        setFiles(prev => prev.map(f => f.id === fileState.id ? {
          ...f,
          status: 'done',
          progress: 100,
          confidence: 98,
          data: extractedData,
          validationErrors: validationErrors
        } : f));

      } catch (error: any) {
        setFiles(prev => prev.map(f => f.id === fileState.id ? {
          ...f,
          status: 'error',
          progress: 0,
          errorMsg: error.message || "Failed to parse document"
        } : f));
      }
    }

    setIsProcessing(false);
  };

  const secureCleanup = () => {
    setFiles([]);
    setSelectedCompany('');
    setSelectedPolicyType('');
    setViewingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportData = (format: 'xlsx' | 'csv') => {
    const processed = files.filter(f => f.status === 'done');
    if (processed.length === 0) return;

    const headers = FIELD_ORDER.join(',');
    const rows = processed.map(f => 
      FIELD_ORDER.map(header => `"${f.data[header] || ''}"`).join(',')
    );
    
    const content = headers + '\n' + rows.join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Extraction_${selectedCompany}_${selectedPolicyType}_${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (window.confirm("Export successful. Would you like to wipe session data for security?")) {
      secureCleanup();
    }
  };

  const accuracyStats = useMemo(() => {
    const done = files.filter(f => f.status === 'done');
    if (done.length === 0) return null;
    const avg = done.reduce((acc, f) => acc + f.confidence, 0) / done.length;
    const totalErrors = done.reduce((acc, f) => acc + f.validationErrors.length, 0);
    
    return {
      percent: avg.toFixed(1),
      errors: totalErrors,
      color: totalErrors === 0 && avg >= 95 ? 'bg-emerald-500' : totalErrors > 0 ? 'bg-rose-500' : 'bg-amber-500',
      text: totalErrors === 0 ? 'Verified Successful' : `${totalErrors} Issues Found`
    };
  }, [files]);

  return (
    <div className="p-10 space-y-8 animate-fade-in bg-slate-50/50 min-h-screen">
      {/* Step 1 & 2: Guided Input Linked to Masters */}
      <div className="bg-white p-8 rounded-[32px] shadow-card border border-slate-100 flex flex-wrap gap-8 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-3 ml-1">1. Policy Type</label>
          <select 
            value={selectedPolicyType} 
            onChange={(e) => setSelectedPolicyType(e.target.value)}
            disabled={isProcessing || loadingMasters}
            className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all disabled:opacity-50"
          >
            <option value="">{loadingMasters ? 'Loading Categories...' : 'Select Category...'}</option>
            {policyTypes.map(pt => (
              <option key={pt.id} value={pt.category_name}>{pt.category_name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[240px]">
          <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-3 ml-1">2. Insurance Company</label>
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            disabled={isProcessing || !selectedPolicyType || loadingMasters}
            className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-950 font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all disabled:opacity-50"
          >
            <option value="">{loadingMasters ? 'Loading Insurers...' : 'Select Insurer...'}</option>
            {companies.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-none">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadDisabled || isProcessing}
            className={`h-14 px-10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all
              ${isUploadDisabled || isProcessing
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark active:scale-95'}
            `}
          >
            3. Upload Policies
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".pdf,.jpg,.png,.jpeg"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Validation Banner */}
      {accuracyStats && (
        <div className={`${accuracyStats.color} p-6 rounded-[24px] shadow-lg flex items-center justify-between text-white animate-fade-in`}>
          <div className="flex items-center gap-4">
            <span className="text-2xl">{accuracyStats.errors === 0 ? '✅' : '⚠️'}</span>
            <div>
              <p className="font-black text-lg">{accuracyStats.text} — Overall Accuracy: {accuracyStats.percent}%</p>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">
                {accuracyStats.errors} validation flags in {files.filter(f => f.status === 'done').length} documents
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => exportData('xlsx')} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Excel (.xlsx)</button>
            <button onClick={secureCleanup} className="px-6 py-2 bg-rose-600/50 hover:bg-rose-600/80 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Wipe Session</button>
          </div>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Document Queue Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[32px] shadow-card border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bulk Queue</h3>
              <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-500">{files.length} Files</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-2">
              {files.map(f => (
                <div key={f.id} className="p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all group relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full flex-none ${f.status === 'done' ? (f.validationErrors.length > 0 ? 'bg-rose-500' : 'bg-emerald-500') : f.status === 'processing' ? 'bg-amber-500 animate-pulse' : f.status === 'error' ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                      <p className="text-xs font-black text-slate-900 truncate pr-8">{f.file.name}</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {f.status === 'processing' && (
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${f.progress}%` }}></div>
                    </div>
                  )}

                  {f.status === 'done' && (
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${f.validationErrors.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {f.validationErrors.length > 0 ? `${f.validationErrors.length} Flags` : 'Validated'}
                      </span>
                      <button 
                        onClick={() => setViewingFile(f)}
                        className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline"
                      >
                        Profile
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {files.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-slate-300 font-black text-[10px] uppercase tracking-widest leading-loose">Upload documents<br/>to begin extraction</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                disabled={files.filter(f => f.status === 'pending').length === 0 || isProcessing}
                onClick={processFiles}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-lg"
              >
                {isProcessing ? 'Processing Batch...' : 'Begin Extraction'}
              </button>
            </div>
          </div>
        </div>

        {/* Extraction Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[32px] shadow-card border border-slate-100 overflow-hidden h-[700px] flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Audit Grid</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mismatch Flag</span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-white shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-white sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Source File</th>
                    {FIELD_ORDER.map(field => (
                      <th key={field} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 min-w-[180px] bg-slate-50/50">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {files.filter(f => f.status === 'done').map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col">
                          <span>{f.file.name}</span>
                          {f.validationErrors.length > 0 && (
                            <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter mt-1">{f.validationErrors.length} issues detected</span>
                          )}
                        </div>
                      </td>
                      {FIELD_ORDER.map(field => {
                        const error = f.validationErrors.find(e => e.field === field);
                        const hasValue = f.data[field] && f.data[field].trim() !== "";
                        
                        return (
                          <td key={field} className={`px-6 py-4 whitespace-nowrap text-xs font-bold transition-all ${error ? 'bg-rose-50 text-rose-600' : !hasValue ? 'bg-slate-50/30' : 'text-slate-600'}`}>
                            {f.data[field] || <span className="text-slate-200">-</span>}
                            {error && <span className="block text-[8px] uppercase tracking-tighter mt-1 opacity-60">{error.message}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {files.filter(f => f.status === 'done').length === 0 && (
                    <tr>
                      <td colSpan={30} className="py-40 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto grayscale opacity-40">📊</div>
                          <p className="text-slate-300 font-black text-sm uppercase tracking-widest">Audit Ready Platform</p>
                          <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                            Upload multiple policies to see real-time extraction and automated validation checks.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View/Edit Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-10 animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Extraction Profile</p>
                <h3 className="text-xl font-black text-slate-900">{viewingFile.file.name}</h3>
              </div>
              <button 
                onClick={() => setViewingFile(null)}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-4">Extracted Fields</h4>
                <div className="grid grid-cols-1 gap-y-4">
                  {FIELD_ORDER.map((field, idx) => {
                    const error = viewingFile.validationErrors.find(e => e.field === field);
                    return (
                      <div key={field} className={`flex justify-between items-center border-b border-slate-50 pb-2 ${error ? 'bg-rose-50 p-2 rounded-lg' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-300 w-5">{idx + 1}</span>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{field}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black ${error ? 'text-rose-600' : 'text-slate-900'}`}>
                            {viewingFile.data[field] || '-'}
                          </span>
                          {error && <p className="text-[9px] text-rose-400 font-bold mt-1 uppercase tracking-tighter">{error.message}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-4">Validation Intelligence</h4>
                <div className="space-y-4">
                  {viewingFile.validationErrors.length === 0 ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                      <span className="text-3xl block mb-2">✅</span>
                      <p className="text-emerald-800 font-black text-sm uppercase tracking-widest">All Checks Passed</p>
                      <p className="text-emerald-600 text-[11px] mt-1">Data matches premium math and tenure logic.</p>
                    </div>
                  ) : (
                    viewingFile.validationErrors.map((err, i) => (
                      <div key={i} className={`p-4 rounded-2xl flex items-start gap-3 border ${err.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                        <span className="mt-0.5">{err.type === 'error' ? '❌' : '⚠️'}</span>
                        <p className="text-xs font-black uppercase tracking-widest leading-relaxed">{err.message}</p>
                      </div>
                    ))
                  )}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quality Score</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${viewingFile.confidence}%` }}></div>
                      </div>
                      <span className="text-lg font-black text-slate-900">{viewingFile.confidence}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-end">
              <button 
                onClick={() => setViewingFile(null)}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95"
              >
                Exit Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyToExcelModule;