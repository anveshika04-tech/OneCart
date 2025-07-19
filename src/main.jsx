import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import HomePage from './HomePage.jsx'
import LandingPage from './LandingPage.jsx'
import GroupRoom from './GroupRoom.jsx'
import CheckoutSuccess from './CheckoutSuccess';
import AboutPage from './AboutPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/room/:roomId" element={<GroupRoom />} />
      <Route path="/checkout-success" element={<CheckoutSuccess />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  </BrowserRouter>
)
