import React, { useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL;

function AdminDashboard({ schools, addSchool }) {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [message, setMessage] = useState('');

  const handleDownloadExcel = () => {
    if (selectedSchool) {
      window.open(`${API_URL}/api/admin/download/excel/${encodeURIComponent(selectedSchool)}`, '_blank');
    }
  };

  const handleDownloadPhotos = () => {
    if (selectedSchool) {
      window.open(`${API_URL}/api/admin/download/photos/${encodeURIComponent(selectedSchool)}`, '_blank');
    }
  };

  const toggleAddSchool = () => {
    setShowAddSchool(prev => !prev);
    setNewSchoolName('');
    setMessage('');
  };

  const handleAddSchool = async (e) => {
    e.preventDefault();
    const trimmedName = newSchoolName.trim();
    if (!trimmedName) {
      setMessage('Please enter a valid school name.');
      return;
    }
    if (schools.includes(trimmedName)) {
      setMessage('This school already exists.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/schools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: trimmedName }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.message || 'Failed to add school.');
        return;
      }

      addSchool(trimmedName);
      setMessage(`School "${trimmedName}" added successfully!`);
      setNewSchoolName('');
      setShowAddSchool(false);
    } catch {
      setMessage('Error adding school, please try again.');
    }
  };

  return (
    <div className="card admin-card">
      <h2>Admin Dashboard</h2>

      <button className="primary-btn" onClick={toggleAddSchool}>
        {showAddSchool ? 'Cancel' : 'Add New School'}
      </button>

      {showAddSchool && (
        <form onSubmit={handleAddSchool} style={{ marginTop: '12px' }}>
          <input
            type="text"
            placeholder="Enter new school name"
            value={newSchoolName}
            onChange={e => setNewSchoolName(e.target.value)}
            autoFocus
            required
            style={{
              padding: '8px 12px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid #667eea',
              marginRight: '8px',
            }}
          />
          <button type="submit" className="secondary-btn">Add</button>
        </form>
      )}

      <div className="selector-row" style={{ marginTop: '20px' }}>
        <label htmlFor="admin-school-select"><strong>Select School:</strong></label>
        <select
          id="admin-school-select"
          value={selectedSchool}
          onChange={e => setSelectedSchool(e.target.value)}
        >
          <option value="">-- Choose a School --</option>
          {schools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </select>
      </div>

      {selectedSchool && (
        <div className="admin-actions" style={{ marginTop: '20px' }}>
          <button className="secondary-btn" onClick={handleDownloadExcel}>Download Student Data (Excel)</button>
          <button className="secondary-btn" onClick={handleDownloadPhotos}>Download Student Photos (ZIP)</button>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #9cc4ff',
            borderRadius: '8px',
            color: '#1557ff',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
