import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <header className="App-header">
              <h1>CityTech Store</h1>
              <p>Electronics E-Commerce Platform</p>
              <p>Project initialized successfully!</p>
              <a href="/register" className="get-started-btn">Get Started</a>
            </header>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
