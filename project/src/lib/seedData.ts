import {
  addAnalysisResult,
  addViolation,
  addNotification,
  getAnalysisResults,
  getDemoScenarios,
} from './localDb';

const sampleVehicles = [
  { plate: 'KBE 100A', name: 'Minibus - Route 5', occupants: 14 },
  { plate: 'KCA 200B', name: 'Pickup Truck', occupants: 8 },
  { plate: 'KDA 300C', name: 'Public Service Vehicle', occupants: 18 },
  { plate: 'KCN 400D', name: 'Delivery Van', occupants: 3 },
  { plate: 'KBC 500E', name: 'Long-distance Coach', occupants: 56 },
];

const violationTypes = [
  { type: 'overcrowding', severity: 'critical', description: 'Vehicle exceeds approved capacity' },
  { type: 'wrong_lane', severity: 'high', description: 'Vehicle traveling in wrong lane' },
  { type: 'parking_violation', severity: 'medium', description: 'Illegal parking detected' },
  { type: 'unsafe_loading', severity: 'high', description: 'Load not properly secured' },
];

export async function seedInitialData() {
  try {
    const existing = await getAnalysisResults(1);
    if (existing.length > 0) {
      return;
    }

    const now = new Date();

    const analysisHistory = [
      {
        license_plate: 'KBE 100A',
        plate_confidence: 94,
        occupant_count: 14,
        occupant_confidence: 92,
        violations: ['overcrowding'],
        camera_id: 'camera-01',
        analyzed_at: new Date(now.getTime() - 25 * 60000).toISOString(),
        analysis_metadata: { frame_quality: 'excellent', processing_time: '127ms' },
      },
      {
        license_plate: 'KCA 200B',
        plate_confidence: 87,
        occupant_count: 5,
        occupant_confidence: 85,
        violations: [],
        camera_id: 'camera-01',
        analyzed_at: new Date(now.getTime() - 45 * 60000).toISOString(),
        analysis_metadata: { frame_quality: 'good', processing_time: '112ms' },
      },
      {
        license_plate: 'KDA 300C',
        plate_confidence: 91,
        occupant_count: 18,
        occupant_confidence: 88,
        violations: ['overcrowding', 'unsafe_loading'],
        camera_id: 'camera-02',
        analyzed_at: new Date(now.getTime() - 62 * 60000).toISOString(),
        analysis_metadata: { frame_quality: 'excellent', processing_time: '134ms' },
      },
      {
        license_plate: 'KCN 400D',
        plate_confidence: 93,
        occupant_count: 3,
        occupant_confidence: 90,
        violations: [],
        camera_id: 'camera-01',
        analyzed_at: new Date(now.getTime() - 93 * 60000).toISOString(),
        analysis_metadata: { frame_quality: 'excellent', processing_time: '118ms' },
      },
      {
        license_plate: 'KBC 500E',
        plate_confidence: 89,
        occupant_count: 56,
        occupant_confidence: 87,
        violations: ['overcrowding', 'wrong_lane'],
        camera_id: 'camera-03',
        analyzed_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
        analysis_metadata: { frame_quality: 'good', processing_time: '145ms' },
      },
    ];

    for (const analysis of analysisHistory) {
      await addAnalysisResult(analysis);
    }

    const notificationHistory = [
      {
        type: 'violation_detected',
        title: 'Critical Violation: Overcrowding',
        message: 'Vehicle KBE 100A: Exceeds approved capacity (14/7 persons)',
        severity: 'critical' as const,
        read: false,
      },
      {
        type: 'violation_detected',
        title: 'Multiple Violations',
        message: 'Vehicle KDA 300C: Overcrowding and unsafe loading detected',
        severity: 'high' as const,
        read: false,
      },
      {
        type: 'violation_detected',
        title: 'Lane Violation',
        message: 'Vehicle KBC 500E: Detected traveling in wrong lane',
        severity: 'high' as const,
        read: true,
      },
      {
        type: 'system_check',
        title: 'System Status',
        message: 'All cameras operational. Last sync: 3 min ago',
        severity: 'low' as const,
        read: true,
      },
    ];

    for (const notification of notificationHistory) {
      await addNotification(notification);
    }

    const scenarios = await getDemoScenarios();
    if (scenarios.length === 0) {
      const defaultScenarios = [
        {
          id: 'scenario-overcrowding',
          name: 'Overcrowded Minibus',
          licensePlate: 'KBE 100A',
          occupantCount: 14,
          violations: ['overcrowding'],
          plateConfidence: 94,
          occupantConfidence: 92,
          description: 'Minibus exceeding approved passenger capacity',
        },
        {
          id: 'scenario-compliant',
          name: 'Compliant Vehicle',
          licensePlate: 'KCA 200B',
          occupantCount: 5,
          violations: [],
          plateConfidence: 87,
          occupantConfidence: 85,
          description: 'Vehicle operating within all compliance standards',
        },
        {
          id: 'scenario-multiple-violations',
          name: 'Multiple Violations',
          licensePlate: 'KDA 300C',
          occupantCount: 18,
          violations: ['overcrowding', 'unsafe_loading'],
          plateConfidence: 91,
          occupantConfidence: 88,
          description: 'Vehicle with multiple detected violations',
        },
      ];

      for (const scenario of defaultScenarios) {
        const { saveDemoScenario } = await import('./localDb');
        await saveDemoScenario(scenario);
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
