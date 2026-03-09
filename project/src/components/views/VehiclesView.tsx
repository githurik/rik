import { useEffect, useState } from 'react';
import { Car, Plus, Search, Edit2, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../lib/localDb';
import type { Vehicle } from '../../lib/localDb';

export function VehiclesView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      const data = await getVehicles();
      // Sort by created_at descending
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVehicle(id: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await deleteVehicle(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (date: string) => new Date(date) < new Date();
  const expiringSoon = (date: string) => {
    const d = new Date(date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return d >= new Date() && d <= soon;
  };

  const expiredCount = vehicles.filter(
    (v) => isExpired(v.license_expiry_date) || isExpired(v.inspection_expiry_date)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Vehicle Management</h3>
          <p className="text-slate-600 mt-1">
            Manage registered vehicles and their compliance status
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{vehicles.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Car className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Compliant</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {vehicles.length - expiredCount}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Non-Compliant</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{expiredCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by license plate or owner name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">License Plate</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Owner</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Capacity</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">License Expiry</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Inspection Expiry</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Car className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500">No vehicles found</p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800 font-mono">{vehicle.license_plate}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{vehicle.owner_name}</td>
                    <td className="py-4 px-4 text-slate-600 text-sm">{vehicle.owner_phone}</td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium capitalize">
                        {vehicle.vehicle_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{vehicle.vehicle_capacity}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isExpired(vehicle.license_expiry_date)
                            ? 'bg-red-100 text-red-800'
                            : expiringSoon(vehicle.license_expiry_date)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {new Date(vehicle.license_expiry_date).toLocaleDateString('en-KE')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isExpired(vehicle.inspection_expiry_date)
                            ? 'bg-red-100 text-red-800'
                            : expiringSoon(vehicle.inspection_expiry_date)
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {new Date(vehicle.inspection_expiry_date).toLocaleDateString('en-KE')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingVehicle(vehicle);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
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

      {showAddModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
            loadVehicles();
          }}
        />
      )}
    </div>
  );
}

interface VehicleModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: () => void;
}

function VehicleModal({ vehicle, onClose, onSave }: VehicleModalProps) {
  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || '',
    owner_name: vehicle?.owner_name || '',
    owner_phone: vehicle?.owner_phone || '',
    vehicle_type: vehicle?.vehicle_type || 'sedan',
    vehicle_capacity: vehicle?.vehicle_capacity || 5,
    license_expiry_date: vehicle?.license_expiry_date || '',
    inspection_expiry_date: vehicle?.inspection_expiry_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await addVehicle(formData);
      }
      onSave();
    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      setError(err?.message || 'Failed to save vehicle. License plate may already exist.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">
            {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Plate *
              </label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="KBE 100A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle Type *
              </label>
              <select
                required
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sedan">Sedan</option>
                <option value="matatu">Matatu</option>
                <option value="truck">Truck</option>
                <option value="suv">SUV</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bus">Bus</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Owner Name *</label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254700000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle Capacity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.vehicle_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_capacity: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                License Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.license_expiry_date}
                onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Inspection Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.inspection_expiry_date}
                onChange={(e) =>
                  setFormData({ ...formData, inspection_expiry_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
