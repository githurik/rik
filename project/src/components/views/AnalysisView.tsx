import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Key,
  Car,
  Users,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  addAnalysisResult,
  getAnalysisResults,
  addNotification,
  addViolation,
  getVehicleByPlate,
} from '../../lib/localDb';
import type { Vehicle } from '../../lib/localDb';
import { analyzeImageWithAI, hasApiKey } from '../../lib/ai';
import { ApiKeySetup } from '../ApiKeySetup';

interface AnalysisResult {
  licensePlate: string | null;
  plateConfidence: number;
  occupantCount: number;
  occupantConfidence: number;
  violations: string[];
  rawDescription: string;
  timestamp: string;
}

interface StoredAnalysis {
  id: string;
  license_plate: string | null;
  plate_confidence: number;
  occupant_count: number;
  occupant_confidence: number;
  violations: string[];
  analyzed_at: string;
}

const VIOLATION_META: Record<string, { label: string; color: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = {
  overcrowding:      { label: 'Overcrowding',      color: 'bg-red-100 text-red-800 border-red-200',         severity: 'critical' },
  wrong_lane:        { label: 'Wrong Lane',         color: 'bg-orange-100 text-orange-800 border-orange-200', severity: 'high' },
  parking_violation: { label: 'Parking Violation',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200', severity: 'medium' },
  unsafe_loading:    { label: 'Unsafe Loading',     color: 'bg-pink-100 text-pink-800 border-pink-200',       severity: 'high' },
  no_seatbelt:       { label: 'No Seatbelt',        color: 'bg-purple-100 text-purple-800 border-purple-200', severity: 'medium' },
  overloading:       { label: 'Overloading',        color: 'bg-rose-100 text-rose-800 border-rose-200',       severity: 'high' },
};

export function AnalysisView() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [results, setResults] = useState<StoredAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(hasApiKey());
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [matchedVehicle, setMatchedVehicle] = useState<Vehicle | null | 'not_found'>('not_found');
  const [vehicleLookupDone, setVehicleLookupDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getAnalysisResults(15);
      setResults(data as StoredAnalysis[]);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setAnalysisResult(null);
      setAnalysisError(null);
      setMatchedVehicle('not_found');
      setVehicleLookupDone(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageSelect(file);
  };

  const lookupVehicle = useCallback(async (plate: string | null) => {
    if (!plate) {
      setMatchedVehicle(null);
      setVehicleLookupDone(true);
      return;
    }
    try {
      const vehicle = await getVehicleByPlate(plate);
      setMatchedVehicle(vehicle ?? null);
    } catch {
      setMatchedVehicle(null);
    } finally {
      setVehicleLookupDone(true);
    }
  }, []);

  const analyzeImage = async () => {
    if (!selectedImage) return;

    if (!apiKeyAvailable) {
      setShowApiKeySetup(true);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setMatchedVehicle('not_found');
    setVehicleLookupDone(false);

    try {
      const result = await analyzeImageWithAI(selectedImage);

      setAnalysisResult(result);

      // Look up plate in local vehicle registry
      await lookupVehicle(result.licensePlate);

      // Save to IndexedDB
      await addAnalysisResult({
        license_plate: result.licensePlate,
        plate_confidence: result.plateConfidence,
        occupant_count: result.occupantCount,
        occupant_confidence: result.occupantConfidence,
        violations: result.violations,
        analysis_metadata: { rawDescription: result.rawDescription },
        camera_id: 'manual-upload',
        analyzed_at: result.timestamp,
      });

      // Auto-record each violation
      if (result.violations.length > 0) {
        const violationText = result.violations
          .map((v) => VIOLATION_META[v]?.label || v)
          .join(', ');

        // Highest severity of all violations
        const topSeverity = result.violations.reduce<'critical' | 'high' | 'medium' | 'low'>((acc, v) => {
          const s = VIOLATION_META[v]?.severity || 'low';
          const order = { critical: 4, high: 3, medium: 2, low: 1 };
          return order[s] > order[acc] ? s : acc;
        }, 'low');

        for (const v of result.violations) {
          const meta = VIOLATION_META[v];
          await addViolation({
            license_plate: result.licensePlate || 'UNKNOWN',
            violation_type: v,
            severity: meta?.severity || 'medium',
            status: 'pending',
            description: meta?.label || v,
            location: 'Manual Upload',
            confidence_score: result.plateConfidence / 100,
            occupant_count: result.occupantCount,
            timestamp: result.timestamp,
          });
        }

        await addNotification({
          type: 'violation_detected',
          title: `${topSeverity === 'critical' ? 'Critical' : 'High'} Violation Detected`,
          message: `${result.licensePlate ? `Vehicle ${result.licensePlate}: ` : ''}${violationText}`,
          severity: topSeverity,
          read: false,
        });
      }

      await loadHistory();
    } catch (error: any) {
      if (error?.message === 'NO_API_KEY') {
        setApiKeyAvailable(false);
        setShowApiKeySetup(true);
      } else if (error?.message === 'INVALID_API_KEY') {
        setAnalysisError('Invalid API key. Please check your Anthropic API key in settings.');
        setApiKeyAvailable(false);
      } else if (error?.message === 'RATE_LIMITED') {
        setAnalysisError('Rate limited by Anthropic API. Please wait a moment and try again.');
      } else {
        setAnalysisError(`Analysis failed: ${error?.message || 'Unknown error'}`);
      }
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">AI Frame Analysis</h3>
          <p className="text-slate-600 mt-1">
            Upload a vehicle photo — AI detects licence plates, counts occupants, and flags violations
          </p>
        </div>
        <button
          onClick={() => { setShowApiKeySetup(true); setApiKeyAvailable(hasApiKey()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border ${
            apiKeyAvailable
              ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          <Key className="w-4 h-4" />
          {apiKeyAvailable ? 'API Key Set' : 'Set API Key'}
        </button>
      </div>

      {/* No API key banner */}
      {!apiKeyAvailable && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">API key required for real analysis</p>
            <p className="text-sm text-amber-800 mt-0.5">
              You need a free Anthropic API key to use AI-powered licence plate reading and violation detection.
            </p>
          </div>
          <button
            onClick={() => setShowApiKeySetup(true)}
            className="flex-shrink-0 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Set Key
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload + Results */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Upload Vehicle Image</h4>

            {!selectedImage ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold mb-1">Drop image here or click to upload</p>
                <p className="text-slate-500 text-sm">PNG, JPG, WebP — photos of vehicles, matatus, trucks</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Vehicle"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                      setAnalysisError(null);
                      setMatchedVehicle('not_found');
                      setVehicleLookupDone(false);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {analysisError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Error: </span>{analysisError}
                      {(analysisError.includes('API key') || analysisError.includes('Invalid')) && (
                        <button
                          onClick={() => setShowApiKeySetup(true)}
                          className="ml-2 underline font-medium"
                        >
                          Fix key
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analysing...
                      </>
                    ) : (
                      <>Analyse Image</>
                    )}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between">
                <h5 className="font-bold text-white">Detection Results</h5>
                <span className="text-xs text-slate-300">
                  {new Date(analysisResult.timestamp).toLocaleTimeString('en-KE')}
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Licence Plate */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Licence Plate</p>
                    <p className="font-mono font-bold text-2xl text-slate-900 tracking-wider">
                      {analysisResult.licensePlate || <span className="text-slate-400 text-lg font-normal">Not detected</span>}
                    </p>
                    {analysisResult.licensePlate && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Confidence</span>
                          <span className="font-medium">{analysisResult.plateConfidence}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              analysisResult.plateConfidence >= 80 ? 'bg-green-500' :
                              analysisResult.plateConfidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysisResult.plateConfidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Registry Lookup */}
                {vehicleLookupDone && analysisResult.licensePlate && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                    matchedVehicle && matchedVehicle !== 'not_found'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Car className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      matchedVehicle && matchedVehicle !== 'not_found' ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Registry Lookup</p>
                      {matchedVehicle && matchedVehicle !== 'not_found' ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-800">{(matchedVehicle as Vehicle).owner_name}</p>
                          <p className="text-sm text-slate-600">{(matchedVehicle as Vehicle).vehicle_type} · Capacity {(matchedVehicle as Vehicle).vehicle_capacity}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isExpired((matchedVehicle as Vehicle).license_expiry_date)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              Licence: {isExpired((matchedVehicle as Vehicle).license_expiry_date) ? 'EXPIRED' : 'Valid'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isExpired((matchedVehicle as Vehicle).inspection_expiry_date)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              Inspection: {isExpired((matchedVehicle as Vehicle).inspection_expiry_date) ? 'EXPIRED' : 'Valid'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">
                          Plate <span className="font-mono font-semibold not-italic text-slate-700">{analysisResult.licensePlate}</span> not found in local registry
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Occupant Count */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Occupants</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-3xl text-slate-900">{analysisResult.occupantCount}</span>
                      <span className="text-slate-500 text-sm">people detected</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Confidence</span>
                        <span className="font-medium">{analysisResult.occupantConfidence}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${analysisResult.occupantConfidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Violations */}
                {analysisResult.violations.length > 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <p className="font-bold text-red-800">
                        {analysisResult.violations.length} Violation{analysisResult.violations.length > 1 ? 's' : ''} Detected
                      </p>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.violations.map((v) => {
                        const meta = VIOLATION_META[v];
                        return (
                          <div key={v} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${meta?.color || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {meta?.label || v}
                            <span className="ml-auto text-xs opacity-70 uppercase">{meta?.severity}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-red-700 mt-3 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Violations have been automatically recorded in the system
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">All Clear — No Violations Detected</p>
                      <p className="text-sm text-green-700">Vehicle appears compliant</p>
                    </div>
                  </div>
                )}

                {/* AI Description */}
                {analysisResult.rawDescription && (
                  <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
                    <p className="italic">{analysisResult.rawDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Analysis History */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-800">Recent Analysis</h4>
            <button
              onClick={loadHistory}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No analysis results yet</p>
              <p className="text-slate-400 text-xs mt-1">Upload a vehicle image to get started</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-xl border transition-colors hover:shadow-sm ${
                    result.violations.length > 0
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : 'bg-green-50 border-green-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-slate-800 truncate">
                        {result.license_plate || <span className="font-sans font-normal text-slate-400 italic text-sm">No plate</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(result.analyzed_at).toLocaleString('en-KE')}
                      </p>
                    </div>
                    {result.violations.length > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full flex-shrink-0">
                        <AlertCircle className="w-3 h-3" />
                        {result.violations.length}
                      </span>
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {result.occupant_count} occupants
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      {result.plate_confidence}%
                    </span>
                  </div>

                  {result.violations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.violations.map((v) => (
                        <span key={v} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${VIOLATION_META[v]?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {VIOLATION_META[v]?.label || v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeySetup && (
        <ApiKeySetup
          onClose={() => {
            setShowApiKeySetup(false);
            setApiKeyAvailable(hasApiKey());
          }}
        />
      )}
    </div>
  );
}
