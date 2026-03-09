import { useEffect, useState } from 'react';
import { AlertTriangle, Search, Filter, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { getViolations, updateViolation, deleteViolation } from '../../lib/localDb';
import type { Violation } from '../../lib/localDb';

export function ViolationsView() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  useEffect(() => {
    loadViolations();
  }, []);

  async function loadViolations() {
    try {
      const data = await getViolations(100);
      setViolations(data);
    } catch (error) {
      console.error('Error loading violations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateViolationStatus(id: string, status: 'pending' | 'resolved' | 'dismissed') {
    try {
      await updateViolation(id, { status });
      setViolations((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
      if (selectedViolation?.id === id) {
        setSelectedViolation((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (error) {
      console.error('Error updating violation:', error);
      alert('Failed to update violation status');
    }
  }

  async function handleDeleteViolation(id: string) {
    if (!confirm('Delete this violation record?')) return;
    try {
      await deleteViolation(id);
      setViolations((prev) => prev.filter((v) => v.id !== id));
      if (selectedViolation?.id === id) setSelectedViolation(null);
    } catch (error) {
      console.error('Error deleting violation:', error);
    }
  }

  const filteredViolations = violations.filter((v) => {
    const matchesSearch =
      v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.violation_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesType = typeFilter === 'all' || v.violation_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const violationTypes = Array.from(new Set(violations.map((v) => v.violation_type)));

  const violationTypeColors: Record<string, string> = {
    expired_license: 'bg-red-100 text-red-800',
    overdue_inspection: 'bg-orange-100 text-orange-800',
    overcrowding: 'bg-yellow-100 text-yellow-800',
    no_valid_inspection: 'bg-purple-100 text-purple-800',
    wrong_lane: 'bg-blue-100 text-blue-800',
    unsafe_loading: 'bg-pink-100 text-pink-800',
    parking_violation: 'bg-indigo-100 text-indigo-800',
  };

  const pendingCount = violations.filter((v) => v.status === 'pending').length;
  const resolvedCount = violations.filter((v) => v.status === 'resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading violations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Violations History</h3>
          <p className="text-slate-600 mt-1">Track and manage detected safety violations</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-600">Total:</span>
            <span className="text-lg font-bold text-slate-800">{violations.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
            <span className="text-sm font-medium text-red-600">Pending:</span>
            <span className="text-lg font-bold text-red-800">{pendingCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-600">Resolved:</span>
            <span className="text-lg font-bold text-green-800">{resolvedCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search violations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="all">All Types</option>
              {violationTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">License Plate</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Violation Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Confidence</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No violations found</p>
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => (
                  <tr key={violation.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 font-mono">{violation.license_plate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          violationTypeColors[violation.violation_type] ||
                          'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {violation.violation_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {new Date(violation.timestamp).toLocaleString('en-KE')}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {violation.location || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {violation.confidence_score != null ? (
                        <span className="text-slate-700 font-medium">
                          {(violation.confidence_score * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          violation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : violation.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {violation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedViolation(violation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteViolation(violation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedViolation && (
        <ViolationDetailsModal
          violation={selectedViolation}
          onClose={() => setSelectedViolation(null)}
          onUpdateStatus={(status) => handleUpdateViolationStatus(selectedViolation.id, status as 'pending' | 'resolved' | 'dismissed')}
        />
      )}
    </div>
  );
}

interface ViolationDetailsModalProps {
  violation: Violation;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}

function ViolationDetailsModal({ violation, onClose, onUpdateStatus }: ViolationDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Violation Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">License Plate</label>
              <p className="text-lg font-semibold text-slate-800 font-mono">{violation.license_plate}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">
                Violation Type
              </label>
              <p className="text-lg font-semibold text-slate-800 capitalize">
                {violation.violation_type.replace(/_/g, ' ')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Severity</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {violation.severity}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Current Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                violation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                violation.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {violation.status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Date & Time</label>
              <p className="text-slate-800">
                {new Date(violation.timestamp).toLocaleString('en-KE')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Location</label>
              <p className="text-slate-800">{violation.location || 'Not specified'}</p>
            </div>

            {violation.occupant_count != null && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Occupant Count
                </label>
                <p className="text-slate-800">{violation.occupant_count} persons</p>
              </div>
            )}

            {violation.confidence_score != null && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">
                  Detection Confidence
                </label>
                <p className="text-slate-800">
                  {(violation.confidence_score * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {violation.description && (
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Description</label>
              <p className="text-slate-800 bg-slate-50 p-4 rounded-lg">{violation.description}</p>
            </div>
          )}

          {violation.notes && (
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Notes</label>
              <p className="text-slate-800 bg-slate-50 p-4 rounded-lg">{violation.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">
                Update Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateStatus('resolved')}
                  disabled={violation.status === 'resolved'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </button>
                <button
                  onClick={() => onUpdateStatus('dismissed')}
                  disabled={violation.status === 'dismissed'}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss
                </button>
                {violation.status !== 'pending' && (
                  <button
                    onClick={() => onUpdateStatus('pending')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
