import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

import RegistrationPage from './RegistrationPage';
import AdminDashboard from './AdminDashboard';
import LoginPage from './LoginPage';
import './App.css';
const API_URL = process.env.REACT_APP_API_URL;
function App() {
  const [schools, setSchools] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/schools`)
      .then(res => res.json())
      .then(data => setSchools(data))
      .catch(() => setSchools([]));
  }, []);

  const addSchool = (newSchool) => {
    setSchools(prevSchools => [...prevSchools, newSchool]);
  };

  return (
    <Router>
      <header>
        <h1>Manthan Suppliers</h1>
        <p style={{ 
          fontSize: '1rem', 
          fontWeight: '500', 
          marginTop: '8px', 
          color: '#ffffffcc', 
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
        }}>
          All types of ID works | Email: manthansuppliers@Gmail.com | Contact: 7073217005, 9351865429
        </p>
        <nav>
          <NavLink to="/" end>Registration</NavLink>
          <NavLink to="/admin">Admin Dashboard</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<RegistrationPage schools={schools} />} />
        <Route
          path="/admin"
          element={
            isLoggedIn
              ? <AdminDashboard schools={schools} addSchool={addSchool} />
              : <LoginPage onLogin={() => setIsLoggedIn(true)} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
