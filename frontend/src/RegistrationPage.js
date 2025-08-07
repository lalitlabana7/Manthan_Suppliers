import React, { useState, useRef, useEffect } from 'react';
const API_URL = process.env.REACT_APP_API_URL;

function RegistrationPage({ schools }) {
  const [selectedSchool, setSelectedSchool] = useState(() => localStorage.getItem('selectedSchool') || '');

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    class: '',
    srNo: '',
    uniqueId: '',
    contactNo: '',
    address: '',
    bloodGroup: '',
    dateOfBirth: '',
  });

  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fields = [
    { name: 'studentName', label: "Full Name", type: "text", required: true },
    { name: 'fatherName', label: "Father's Name", type: "text", required: true },
    { name: 'motherName', label: "Mother's Name", type: "text", required: true },
    { name: 'class', label: "Class", type: "text", required: true },
    { name: 'srNo', label: "SR.NO", type: "text", required: true },  // Changed label
    { name: 'uniqueId', label: "Unique ID", type: "text", required: false },
    { name: 'contactNo', label: "Contact Number", type: "text", required: false },
    { name: 'address', label: "Address", type: "text", required: false },
    { name: 'bloodGroup', label: "Blood Group", type: "text", required: false },
    { name: 'dateOfBirth', label: "Date of Birth", type: "date", required: false }, // New field
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setMessage('Using front camera as fallback.');
      } catch {
        setMessage('Camera access denied. Please allow permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      canvas.toBlob((blob) => {
        setPhoto(blob);
        setMessage('Photo captured! You can now submit the form.');
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setMessage('');
    startCamera();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool || !formData.studentName || !photo) {
      setMessage('Please fill all required fields and capture a photo.');
      return;
    }

    const submissionData = new FormData();
    submissionData.append('schoolName', selectedSchool);
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        submissionData.append(key, formData[key]);
      }
    });
    submissionData.append('studentPhoto', photo, 'photo.jpg');

    try {
      const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        body: submissionData,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(result.message || 'Student registered successfully!');
        setFormData({
          studentName: '',
          fatherName: '',
          motherName: '',
          class: '',
          srNo: '',
          uniqueId: '',
          contactNo: '',
          address: '',
          bloodGroup: '',
          dateOfBirth: '',
        });
        setPhoto(null);
        stopCamera();
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Registration failed. Please try again.');
      }
    } catch {
      setMessage('Failed to submit form due to network error.');
    }
  };

  useEffect(() => {
    localStorage.setItem('selectedSchool', selectedSchool);
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedSchool && !photo) {
      startCamera();
    }
    return () => stopCamera();
  }, [selectedSchool, photo]);

  return (
    <div className="card main-card">
      <div className="selector-row">
        <label htmlFor="school-select"><strong>Select a School:</strong></label>
        <select
          id="school-select"
          value={selectedSchool}
          onChange={e => {
            setSelectedSchool(e.target.value);
            setPhoto(null);
            setMessage('');
          }}
        >
          <option value="">-- Choose a School --</option>
          {schools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </select>
      </div>

      {selectedSchool && (
        <form className="register-form" onSubmit={handleSubmit}>
          <section className="camera-section">
            <div className="camera-preview">
              {!photo ? (
                <video ref={videoRef} autoPlay playsInline muted />
              ) : (
                <img src={URL.createObjectURL(photo)} alt="Captured" />
              )}
            </div>
            {!photo ? (
              <button type="button" className="capture-btn" onClick={capturePhoto}>
                Capture Photo
              </button>
            ) : (
              <button type="button" className="capture-btn" onClick={handleRetake}>
                Retake Photo
              </button>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </section>

          <div className="form-fields">
            {fields.map(field => (
              <div className="form-group" key={field.name}>
                <label htmlFor={field.name}>{field.label}:</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  autoComplete="off"
                  required={field.required}
                />
              </div>
            ))}
            <button
              type="submit"
              className="primary-btn"
              disabled={!photo}
              title={photo ? "Ready to submit" : "Capture photo first"}
            >
              Submit Registration
            </button>
          </div>
          {message && <div className="message">{message}</div>}
        </form>
      )}
    </div>
  );
}

export default RegistrationPage;
