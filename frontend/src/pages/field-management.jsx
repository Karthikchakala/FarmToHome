import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import agriToolsAPI from '../services/agriToolsAPI';

const emptyForm = {
  name: '',
  area: '',
  location: '',
  soilType: '',
  soilPh: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  waterSource: '',
  currentCrop: '',
  cropStatus: 'planned',
  plantingDate: '',
  expectedHarvestDate: '',
  notes: ''
};

const FieldManagement = () => {
  const [fields, setFields] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchFields = async () => {
    try {
      const response = await agriToolsAPI.getFields();
      if (response.data.success) {
        setFields(response.data.data || []);
      }
    } catch (error) {
      toast.error('Error fetching fields');
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingField(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        area: parseFloat(formData.area)
      };

      const response = editingField
        ? await agriToolsAPI.updateField(editingField.id, payload)
        : await agriToolsAPI.createField(payload);

      if (response.data.success) {
        toast.success(editingField ? 'Field updated successfully' : 'Field created successfully');
        await fetchFields();
        resetForm();
      } else {
        toast.error(response.data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving field');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name || '',
      area: field.area || '',
      location: field.location || '',
      soilType: field.soilType || '',
      soilPh: field.soilPh || '',
      nitrogen: field.nitrogen || '',
      phosphorus: field.phosphorus || '',
      potassium: field.potassium || '',
      waterSource: field.waterSource || '',
      currentCrop: field.currentCrop || '',
      cropStatus: field.cropStatus || 'planned',
      plantingDate: field.plantingDate ? field.plantingDate.split('T')[0] : '',
      expectedHarvestDate: field.expectedHarvestDate ? field.expectedHarvestDate.split('T')[0] : '',
      notes: field.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    try {
      const response = await agriToolsAPI.deleteField(fieldId);
      if (response.data.success) {
        toast.success('Field deleted successfully');
        fetchFields();
      } else {
        toast.error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting field');
    }
  };

  return (
    <Layout showSidebar>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Farm</h1>
            <p className="text-gray-600 mt-2">Track field conditions, crop plans, soil metrics, and harvest timing.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Add New Field
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editingField ? 'Edit Field' : 'Add New Field'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-6">
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Field Name" className="w-full p-3 border rounded-lg" required />
                <input name="area" type="number" value={formData.area} onChange={handleInputChange} placeholder="Area (hectares)" className="w-full p-3 border rounded-lg" required />
                <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Village, District" className="w-full p-3 border rounded-lg" required />
                <input name="soilType" value={formData.soilType} onChange={handleInputChange} placeholder="Soil Type" className="w-full p-3 border rounded-lg" />
                <input name="soilPh" type="number" value={formData.soilPh} onChange={handleInputChange} placeholder="Soil pH" className="w-full p-3 border rounded-lg" />
                <input name="waterSource" value={formData.waterSource} onChange={handleInputChange} placeholder="Water Source" className="w-full p-3 border rounded-lg" />
                <input name="currentCrop" value={formData.currentCrop} onChange={handleInputChange} placeholder="Current Crop" className="w-full p-3 border rounded-lg" />
                <select name="cropStatus" value={formData.cropStatus} onChange={handleInputChange} className="w-full p-3 border rounded-lg">
                  <option value="planned">Planned</option>
                  <option value="sowed">Sowed</option>
                  <option value="growing">Growing</option>
                  <option value="harvested">Harvested</option>
                </select>
                <input name="plantingDate" type="date" value={formData.plantingDate} onChange={handleInputChange} className="w-full p-3 border rounded-lg" />
                <input name="expectedHarvestDate" type="date" value={formData.expectedHarvestDate} onChange={handleInputChange} className="w-full p-3 border rounded-lg" />
                <input name="nitrogen" type="number" value={formData.nitrogen} onChange={handleInputChange} placeholder="Nitrogen" className="w-full p-3 border rounded-lg" />
                <input name="phosphorus" type="number" value={formData.phosphorus} onChange={handleInputChange} placeholder="Phosphorus" className="w-full p-3 border rounded-lg" />
                <input name="potassium" type="number" value={formData.potassium} onChange={handleInputChange} placeholder="Potassium" className="w-full p-3 border rounded-lg" />
              </div>

              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" className="w-full p-3 border rounded-lg mb-4" placeholder="Notes about the field, crop plan, or issues..." />

              <div className="flex gap-1">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                  {loading ? 'Saving...' : (editingField ? 'Update Field' : 'Create Field')}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Your Fields</h2>
          </div>

          {fields.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No fields added yet. Click "Add New Field" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Field Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Area</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {fields.map((field) => (
                    <tr key={field.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.area} ha</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.currentCrop || 'None'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{field.cropStatus || 'planned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(field)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                        <button onClick={() => handleDelete(field.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FieldManagement;
