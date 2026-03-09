import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard as Edit2, CheckCircle } from 'lucide-react';
import { DemoScenario, saveDemoScenario, getDemoScenarios } from '../lib/localDb';

export function DemoScenarioManager() {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<DemoScenario>>({
    name: '',
    licensePlate: null,
    occupantCount: 5,
    violations: [],
    plateConfidence: 85,
    occupantConfidence: 90,
    description: '',
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await getDemoScenarios();
      setScenarios(data);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const violations = [
    'overcrowding',
    'wrong_lane',
    'parking_violation',
    'unsafe_loading',
  ];

  const toggleViolation = (v: string) => {
    const current = formData.violations || [];
    setFormData({
      ...formData,
      violations: current.includes(v)
        ? current.filter((vi) => vi !== v)
        : [...current, v],
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.licensePlate) {
      alert('Please fill all required fields');
      return;
    }

    const scenario: DemoScenario = {
      id: editingId || `scenario-${Date.now()}`,
      name: formData.name,
      licensePlate: formData.licensePlate,
      occupantCount: formData.occupantCount || 5,
      violations: formData.violations || [],
      plateConfidence: formData.plateConfidence || 85,
      occupantConfidence: formData.occupantConfidence || 90,
      description: formData.description || '',
    };

    try {
      await saveDemoScenario(scenario);
      await loadScenarios();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        licensePlate: null,
        occupantCount: 5,
        violations: [],
        plateConfidence: 85,
        occupantConfidence: 90,
        description: '',
      });
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Failed to save scenario');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800">Frame Analysis Profiles</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: '',
              licensePlate: null,
              occupantCount: 5,
              violations: [],
              plateConfidence: 85,
              occupantConfidence: 90,
              description: '',
            });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Profile
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Profile Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., High-Capacity Minibus"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                License Plate
              </label>
              <input
                type="text"
                value={formData.licensePlate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, licensePlate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., KBE 100A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Occupant Count
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={formData.occupantCount || 5}
                onChange={(e) =>
                  setFormData({ ...formData, occupantCount: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plate Confidence %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.plateConfidence || 85}
                onChange={(e) =>
                  setFormData({ ...formData, plateConfidence: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Expected Violations (if detected)
            </label>
            <div className="flex flex-wrap gap-2">
              {violations.map((v) => {
                const labels: Record<string, string> = {
                  overcrowding: 'Overcrowding',
                  wrong_lane: 'Wrong Lane',
                  parking_violation: 'Parking Violation',
                  unsafe_loading: 'Unsafe Loading',
                };
                return (
                  <button
                    key={v}
                    onClick={() => toggleViolation(v)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      (formData.violations || []).includes(v)
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    }`}
                  >
                    {labels[v] || v}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Brief description of this scenario"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              {editingId ? 'Update Profile' : 'Save Profile'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex-1 px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading scenarios...</div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No profiles configured yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800">{scenario.name}</h4>
                  <p className="text-sm text-slate-600">{scenario.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(scenario.id);
                      setFormData(scenario);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div className="border-l-2 border-slate-300 pl-3">
                  <span className="text-slate-500 text-xs uppercase tracking-wide">License Plate</span>
                  <p className="font-mono font-bold text-lg text-slate-800">{scenario.licensePlate}</p>
                </div>
                <div className="border-l-2 border-slate-300 pl-3">
                  <span className="text-slate-500 text-xs uppercase tracking-wide">Capacity</span>
                  <p className="font-bold text-lg text-slate-800">{scenario.occupantCount} persons</p>
                </div>
              </div>

              {scenario.violations.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {scenario.violations.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
