import { useState, useEffect, useRef } from 'react';
import { Video, Camera, PlayCircle, PauseCircle, AlertCircle, CheckCircle, Plus, X, Grid3x3, Zap } from 'lucide-react';
import { addVehicle, addNotification, addAnalysisResult } from '../../lib/localDb';

interface Detection {
  id: string;
  timestamp: Date;
  licensePlate: string;
  confidence: number;
  occupantCount: number;
  violations: string[];
}

interface CameraFeed {
  id: string;
  name: string;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function MonitoringView() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraSource, setCameraSource] = useState('');
  const [gridLayout, setGridLayout] = useState<1 | 2 | 4>(1);
  const [detectedPlates, setDetectedPlates] = useState<string[]>([]);
  const [showRegisterPlate, setShowRegisterPlate] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState<string>('');
  const [frameAnalysisActive, setFrameAnalysisActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        const mockPlates = ['KBE 100A', 'KCA 200B', 'KDA 300C', 'KAA 400D', 'KBB 500E', 'KCC 600F'];
        const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
        const occupants = Math.floor(Math.random() * 15) + 1;
        const confidence = Math.random() * 0.3 + 0.7;

        const violations: string[] = [];
        if (occupants > 14) violations.push('overcrowding');
        if (Math.random() > 0.7) violations.push('expired_license');

        const detection: Detection = {
          id: Date.now().toString(),
          timestamp: new Date(),
          licensePlate: randomPlate,
          confidence: confidence,
          occupantCount: occupants,
          violations: violations,
        };

        setDetectedPlates((prev) => {
          if (!prev.includes(randomPlate)) {
            return [randomPlate, ...prev.slice(0, 19)];
          }
          return prev;
        });

        setDetections((prev) => [detection, ...prev.slice(0, 9)]);
      }, 5000);

      return () => clearInterval(interval);
    } else {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
      setFrameAnalysisActive(false);
    }
  }, [isMonitoring]);

  const addCamera = async () => {
    if (!cameraSource.trim()) return;

    const newCamera: CameraFeed = {
      id: Date.now().toString(),
      name: cameraSource,
      stream: null,
      videoRef: { current: null } as React.RefObject<HTMLVideoElement>,
    };

    try {
      if (cameraSource === 'webcam') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        newCamera.stream = stream;
      }

      setCameras((prev) => [...prev, newCamera]);
      setCameraSource('');
      setShowAddCamera(false);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Make sure permissions are granted.');
    }
  };

  const removeCamera = (id: string) => {
    const camera = cameras.find((c) => c.id === id);
    if (camera?.stream) {
      camera.stream.getTracks().forEach((track) => track.stop());
    }
    setCameras(cameras.filter((c) => c.id !== id));
  };

  const registerLicensePlate = async () => {
    if (!selectedPlate.trim()) return;

    try {
      await addVehicle({
        license_plate: selectedPlate.toUpperCase(),
        owner_name: 'Vehicle Owner',
        owner_phone: '+254700000000',
        vehicle_type: 'sedan',
        vehicle_capacity: 5,
        license_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        inspection_expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      setSelectedPlate('');
      setShowRegisterPlate(false);
      alert('License plate registered successfully');
    } catch (error) {
      console.error('Error registering plate:', error);
      alert('Could not register plate. It may already exist.');
    }
  };

  const captureFrameFromCamera = async () => {
    if (cameras.length === 0) return;

    setAnalyzing(true);
    try {
      const camera = cameras[0];
      if (!camera.videoRef.current) return;

      const canvas = document.createElement('canvas');
      canvas.width = camera.videoRef.current.videoWidth || 1280;
      canvas.height = camera.videoRef.current.videoHeight || 720;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(camera.videoRef.current, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      // Try Supabase edge function if env vars are present, fall back to local mock
      let result: any = null;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/analyze-frame`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageBase64, cameraId: cameras[0].id }),
            }
          );
          if (response.ok) result = await response.json();
        } catch {
          // fall through to mock
        }
      }

      // Offline mock analysis
      if (!result) {
        const mockPlates = ['KBE 100A', 'KCA 200B', 'KDA 300C', 'KCN 400D', 'KBC 500E'];
        const licensePlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
        const occupantCount = Math.floor(Math.random() * 16) + 1;
        const violations: string[] = [];
        if (occupantCount > 14) violations.push('overcrowding');
        if (Math.random() > 0.85) violations.push('wrong_lane');
        result = {
          licensePlate,
          plateConfidence: Math.floor(Math.random() * 15) + 82,
          occupantCount,
          occupantConfidence: Math.floor(Math.random() * 15) + 80,
          violations,
        };
      }

      await addAnalysisResult({
        license_plate: result.licensePlate,
        plate_confidence: result.plateConfidence,
        occupant_count: result.occupantCount,
        occupant_confidence: result.occupantConfidence,
        violations: result.violations,
        analysis_metadata: result,
        camera_id: cameras[0].id,
        analyzed_at: new Date().toISOString(),
      });

      if (result.violations.length > 0) {
        const violationLabels: Record<string, string> = {
          overcrowding: 'Overcrowding',
          wrong_lane: 'Wrong Lane',
          parking_violation: 'Parking Violation',
          unsafe_loading: 'Unsafe Loading',
        };

        const violationText = result.violations
          .map((v: string) => violationLabels[v] || v)
          .join(', ');

        await addNotification({
          type: 'violation_detected',
          title: 'Live Detection: Violation Found',
          message: `${result.licensePlate ? `Vehicle ${result.licensePlate}: ` : ''}${violationText}`,
          severity: result.violations.includes('overcrowding') ? 'critical' : 'high',
          read: false,
        });
      }
    } catch (error) {
      console.error('Frame analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleFrameAnalysis = () => {
    if (!frameAnalysisActive) {
      setFrameAnalysisActive(true);
      captureIntervalRef.current = setInterval(() => {
        captureFrameFromCamera();
      }, 3000);
    } else {
      setFrameAnalysisActive(false);
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    }
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[gridLayout];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Live Monitoring</h3>
          <p className="text-slate-600 mt-1">Multi-camera surveillance system</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setGridLayout(1)}
              className={`p-2 rounded transition-colors ${gridLayout === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className="w-4 h-4 border-2" />
            </button>
            <button
              onClick={() => setGridLayout(2)}
              className={`p-2 rounded transition-colors ${gridLayout === 2 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridLayout(4)}
              className={`p-2 rounded transition-colors ${gridLayout === 4 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Video className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddCamera(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Camera
          </button>

          {isMonitoring && cameras.length > 0 && (
            <button
              onClick={toggleFrameAnalysis}
              disabled={analyzing}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                frameAnalysisActive
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-400 hover:bg-slate-500 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Zap className="w-5 h-5" />
              {frameAnalysisActive ? 'Analyzing' : 'Analyze'}
            </button>
          )}

          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? (
              <>
                <PauseCircle className="w-5 h-5" />
                Stop
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      {cameras.length > 0 ? (
        <div className={`grid ${gridColsClass} gap-4`}>
          {cameras.map((camera) => (
            <div key={camera.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
                {camera.stream ? (
                  <video
                    ref={camera.videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      if (camera.videoRef.current) {
                        camera.videoRef.current.srcObject = camera.stream;
                      }
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">{camera.name}</p>
                  </div>
                )}

                {isMonitoring && (
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">LIVE</span>
                  </div>
                )}

                <button
                  onClick={() => removeCamera(camera.id)}
                  className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-800 truncate">{camera.name}</p>
                <p className="text-xs text-slate-500 mt-1">{camera.stream ? 'Connected' : 'Ready'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 border-dashed py-16 text-center">
          <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">No cameras connected</p>
          <p className="text-slate-500 text-sm mb-4">Add webcams to start monitoring</p>
          <button
            onClick={() => setShowAddCamera(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Camera
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Detection History</h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {detections.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No detections yet</p>
              </div>
            ) : (
              detections.map((detection) => (
                <div key={detection.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{detection.licensePlate}</span>
                      <span className="text-xs text-slate-500">{(detection.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-slate-500">{detection.timestamp.toLocaleTimeString('en-KE')}</p>
                  </div>
                  {detection.violations.length > 0 ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-slate-800">Detected Plates</h4>
            <button
              onClick={() => setShowRegisterPlate(true)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              Register
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {detectedPlates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Camera className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No plates detected</p>
              </div>
            ) : (
              detectedPlates.map((plate) => (
                <div key={plate} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="font-semibold text-slate-800 font-mono">{plate}</span>
                  <button
                    onClick={() => {
                      setSelectedPlate(plate);
                      setShowRegisterPlate(true);
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Register
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Add Camera Feed</h3>
              <button onClick={() => setShowAddCamera(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Source</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setCameraSource('webcam')}
                    className={`w-full p-4 border-2 rounded-lg text-left font-medium transition-colors ${
                      cameraSource === 'webcam'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Camera className="w-5 h-5 inline mr-2" />
                    Built-in Webcam
                  </button>

                  <input
                    type="text"
                    placeholder="RTSP/HTTP URL (optional)"
                    value={cameraSource === 'webcam' ? '' : cameraSource}
                    onChange={(e) => setCameraSource(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddCamera(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addCamera}
                  disabled={!cameraSource}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterPlate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-800">Register License Plate</h3>
              <button onClick={() => setShowRegisterPlate(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">License Plate</label>
                <input
                  type="text"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value.toUpperCase())}
                  placeholder="e.g., KBE 100A"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg text-center"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowRegisterPlate(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={registerLicensePlate}
                  disabled={!selectedPlate.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg transition-colors font-medium"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
