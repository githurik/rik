import { useState, useRef, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, X, Settings } from 'lucide-react';
import { DemoScenarioManager } from '../DemoScenarioManager';
import {
  addAnalysisResult,
  getAnalysisResults,
  addNotification,
  getDemoScenarios,
  getDemoScenarioById,
} from '../../lib/localDb';

interface AnalysisResult {
  licensePlate: string | null;
  plateConfidence: number;
  occupantCount: number;
  occupantConfidence: number;
  violations: string[];
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

export function AnalysisView() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [results, setResults] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDemoManager, setShowDemoManager] = useState(false);
  const [demoScenarios, setDemoScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const violationLabels: Record<string, { label: string; color: string }> = {
    overcrowding: { label: 'Overcrowding', color: 'bg-red-100 text-red-800' },
    wrong_lane: { label: 'Wrong Lane', color: 'bg-orange-100 text-orange-800' },
    parking_violation: { label: 'Parking Violation', color: 'bg-yellow-100 text-yellow-800' },
    unsafe_loading: { label: 'Unsafe Loading', color: 'bg-pink-100 text-pink-800' },
  };

  useEffect(() => {
    loadResults();
    loadDemoScenarios();
  }, []);

  const loadDemoScenarios = async () => {
    try {
      const scenarios = await getDemoScenarios();
      setDemoScenarios(scenarios);
    } catch (error) {
      console.error('Error loading demo scenarios:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      const result: AnalysisResult = {
        licensePlate: null,
        plateConfidence: 85,
        occupantCount: 5,
        occupantConfidence: 90,
        violations: [],
        timestamp: new Date().toISOString(),
      };

      if (selectedScenarioId && demoScenarios.length > 0) {
        const scenario = await getDemoScenarioById(selectedScenarioId);
        if (scenario) {
          result.licensePlate = scenario.licensePlate;
          result.plateConfidence = scenario.plateConfidence;
          result.occupantCount = scenario.occupantCount;
          result.occupantConfidence = scenario.occupantConfidence;
          result.violations = scenario.violations;
        }
      }

      setAnalysisResult(result);

      await addAnalysisResult({
        license_plate: result.licensePlate,
        plate_confidence: result.plateConfidence,
        occupant_count: result.occupantCount,
        occupant_confidence: result.occupantConfidence,
        violations: result.violations,
        analysis_metadata: result,
        camera_id: 'manual-upload',
        analyzed_at: result.timestamp,
      });

      if (result.violations.length > 0) {
        const violationText = result.violations
          .map((v) => violationLabels[v]?.label || v)
          .join(', ');

        await addNotification({
          type: 'violation_detected',
          title: 'Violation Detected',
          message: `${result.licensePlate ? `Vehicle ${result.licensePlate}: ` : ''}${violationText}`,
          severity: result.violations.includes('overcrowding') ? 'critical' : 'high',
          read: false,
        });
      }

      await loadResults();
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await getAnalysisResults(10);
      setResults(data as StoredAnalysis[]);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showDemoManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-slate-800">Analysis Profiles</h3>
          <button
            onClick={() => {
              setShowDemoManager(false);
              loadDemoScenarios();
            }}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Back to Analysis
          </button>
        </div>
        <p className="text-slate-600 text-sm mb-4">Create and manage vehicle analysis profiles for different scenarios.</p>
        <DemoScenarioManager />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Frame Analysis</h3>
          <p className="text-slate-600 mt-1">Analyze frames for violation detection and compliance monitoring</p>
        </div>
        <button
          onClick={() => setShowDemoManager(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium text-sm"
          title="Manage analysis profiles"
        >
          <Settings className="w-4 h-4" />
          Profiles
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Upload Image</h4>

          {selectedImage ? (
            <div className="space-y-4">
              <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {demoScenarios.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Apply Profile (Optional)
                    </label>
                    <select
                      value={selectedScenarioId}
                      onChange={(e) => setSelectedScenarioId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Auto-detect</option>
                      {demoScenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={analyzeImage}
                    disabled={analyzing}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-1">Click to upload image</p>
              <p className="text-slate-500 text-sm">PNG, JPG, or WebP</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {analysisResult && (
            <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-300">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-slate-800">Detection Results</h5>
                <span className="text-xs text-slate-500">
                  {new Date(analysisResult.timestamp).toLocaleTimeString('en-KE')}
                </span>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">License Plate</p>
                    <span className="text-xs text-slate-500">Confidence</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono font-bold text-2xl text-slate-800">
                      {analysisResult.licensePlate || '—'}
                    </span>
                    {analysisResult.licensePlate && (
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${analysisResult.plateConfidence}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{analysisResult.plateConfidence}%</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Occupant Count</p>
                    <span className="text-xs text-slate-500">Confidence</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-bold text-2xl text-slate-800">
                      {analysisResult.occupantCount}
                    </span>
                    <span className="text-xs text-slate-600">persons</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${analysisResult.occupantConfidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{analysisResult.occupantConfidence}%</p>
                    </div>
                  </div>
                </div>

                {analysisResult.violations.length > 0 ? (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Violations Detected</p>
                    <div className="space-y-2">
                      {analysisResult.violations.map((v) => {
                        const label = violationLabels[v];
                        return (
                          <div key={v} className={`text-sm px-3 py-2 rounded font-medium ${label?.color || 'bg-gray-100 text-gray-800'}`}>
                            {label?.label || v}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">Compliant - No violations detected</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Recent Analysis</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No analysis results yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-bold text-slate-800">
                        {result.license_plate || 'No plate detected'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(result.analyzed_at).toLocaleString('en-KE')}
                      </p>
                    </div>
                    {result.violations.length > 0 ? (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {result.occupant_count} occupants ({result.occupant_confidence}%)
                    </span>
                    {result.violations.length > 0 && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                        {result.violations.length} violation
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={loadResults}
            className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Refresh Results
          </button>
        </div>
      </div>
    </div>
  );
}
