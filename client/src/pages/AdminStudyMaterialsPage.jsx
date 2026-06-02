import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiBook } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminStudyMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic: '',
    category: 'quantitative',
    type: 'notes',
    video_url: '',
    file_url: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await api.get('/study');
      setMaterials(res.data.materials);
    } catch (error) {
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        content: material.content,
        topic: material.topic,
        category: material.category,
        type: material.type,
        video_url: material.video_url || '',
        file_url: material.file_url || ''
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        title: '',
        content: '',
        topic: '',
        category: 'quantitative',
        type: 'notes',
        video_url: '',
        file_url: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        await api.put(`/admin/study-materials/${editingMaterial.id}`, formData);
        toast.success('Material updated successfully');
      } else {
        await api.post('/admin/study-materials', formData);
        toast.success('Material created successfully');
      }
      setShowModal(false);
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save material');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await api.delete(`/admin/study-materials/${id}`);
        toast.success('Material deleted');
        fetchMaterials();
      } catch (error) {
        toast.error('Failed to delete material');
      }
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="admin-page fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Study Materials</h1>
          <p>Manage notes, videos, and practice content</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <FiPlus /> Add Material
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Topic</th>
                <th>Category</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map(mat => (
                <tr key={mat.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiBook /> {mat.title}
                    </div>
                  </td>
                  <td><span className="badge badge-info">{mat.topic}</span></td>
                  <td><span className="badge badge-primary">{mat.category}</span></td>
                  <td><span className="badge badge-warning">{mat.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => handleOpenModal(mat)} title="Edit">
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(mat.id)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No study materials found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '100%', maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{editingMaterial ? 'Edit Material' : 'Add Material'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="quantitative">Quantitative</option>
                    <option value="logical">Logical Reasoning</option>
                    <option value="verbal">Verbal Ability</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Topic</label>
                  <input required type="text" className="form-input" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Type</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="notes">Notes</option>
                    <option value="video">Video</option>
                    <option value="practice">Practice</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea required rows="5" className="form-input" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Material</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
