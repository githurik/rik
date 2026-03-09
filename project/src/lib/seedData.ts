import {
  addAnalysisResult,
  addViolation,
  addVehicle,
  addNotification,
  getAnalysisResults,
  getVehicles,
  getViolations,
  getDemoScenarios,
  saveDemoScenario,
} from './localDb';

export async function seedInitialData() {
  try {
    const existing = await getAnalysisResults(1);
    if (existing.length > 0) {
      return;
    }

    const now = new Date();

    // Seed vehicles
    const existingVehicles = await getVehicles();
    if (existingVehicles.length === 0) {
      const vehicleData = [
        {
          license_plate: 'KBE 100A',
          owner_name: 'John Kamau',
          owner_phone: '+254712345678',
          vehicle_type: 'matatu',
          vehicle_capacity: 14,
          license_expiry_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          inspection_expiry_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          license_plate: 'KCA 200B',
          owner_name: 'Mary Wanjiru',
          owner_phone: '+254723456789',
          vehicle_type: 'truck',
          vehicle_capacity: 3,
          license_expiry_date: new Date(now.getTime() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          inspection_expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          license_plate: 'KDA 300C',
          owner_name: 'Peter Ochieng',
          owner_phone: '+254734567890',
          vehicle_type: 'matatu',
          vehicle_capacity: 14,
          license_expiry_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // expired
          inspection_expiry_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          license_plate: 'KCN 400D',
          owner_name: 'Grace Muthoni',
          owner_phone: '+254745678901',
          vehicle_type: 'sedan',
          vehicle_capacity: 5,
          license_expiry_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          inspection_expiry_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          license_plate: 'KBC 500E',
          owner_name: 'David Otieno',
          owner_phone: '+254756789012',
          vehicle_type: 'truck',
          vehicle_capacity: 2,
          license_expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          inspection_expiry_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // expired
        },
      ];
      for (const v of vehicleData) {
        await addVehicle(v);
      }
    }

    // Seed analysis history
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
        occupant_count: 4,
        occupant_confidence: 87,
        violations: ['wrong_lane'],
        camera_id: 'camera-03',
        analyzed_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
        analysis_metadata: { frame_quality: 'good', processing_time: '145ms' },
      },
    ];

    for (const analysis of analysisHistory) {
      await addAnalysisResult(analysis);
    }

    // Seed violations
    const existingViolations = await getViolations(1);
    if (existingViolations.length === 0) {
      const violationData = [
        {
          license_plate: 'KBE 100A',
          violation_type: 'overcrowding',
          severity: 'critical',
          status: 'pending' as const,
          description: 'Vehicle exceeds approved capacity (14/7 persons)',
          location: 'Thika Road Junction',
          confidence_score: 0.94,
          occupant_count: 14,
          timestamp: new Date(now.getTime() - 25 * 60000).toISOString(),
        },
        {
          license_plate: 'KDA 300C',
          violation_type: 'overcrowding',
          severity: 'critical',
          status: 'pending' as const,
          description: 'Vehicle exceeds approved capacity (18/14 persons)',
          location: 'Mombasa Road',
          confidence_score: 0.91,
          occupant_count: 18,
          timestamp: new Date(now.getTime() - 62 * 60000).toISOString(),
        },
        {
          license_plate: 'KDA 300C',
          violation_type: 'unsafe_loading',
          severity: 'high',
          status: 'pending' as const,
          description: 'Load not properly secured',
          location: 'Mombasa Road',
          confidence_score: 0.88,
          timestamp: new Date(now.getTime() - 62 * 60000).toISOString(),
        },
        {
          license_plate: 'KBC 500E',
          violation_type: 'wrong_lane',
          severity: 'high',
          status: 'resolved' as const,
          description: 'Vehicle detected traveling in wrong lane',
          location: 'Ngong Road',
          confidence_score: 0.89,
          timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
        },
        {
          license_plate: 'KDA 300C',
          violation_type: 'expired_license',
          severity: 'high',
          status: 'pending' as const,
          description: 'Vehicle license plate expired 30 days ago',
          location: 'System Check',
          confidence_score: 1.0,
          timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
        },
      ];
      for (const v of violationData) {
        await addViolation(v);
      }
    }

    // Seed notifications
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

    // Seed demo scenarios
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
        await saveDemoScenario(scenario);
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
