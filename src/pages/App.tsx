// Re-add Mikrotik template modules and OTT template function


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PhoneConfig from './PhoneConfig';
import ExpansionModules from './ExpansionModules';
import Reference from './Reference';
import FullConfig from './FullConfig';
import FBPXImport from './FBPXImport';
import VPBXImport from './VPBXImport';
import MikrotikTemplates from './MikrotikTemplates';
import SwitchTemplates from './SwitchTemplates';
import OrderTracker from './OrderTracker';
import StrettoImport from './StrettoImport';
import '../styles/App.css'; // eslint-disable-line



function App() {
  return (
    <Router>
      <MainLayout>
        <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Link to="/phone">Phone Configs</Link>
          <Link to="/expansion">Expansion Modules</Link>
          <Link to="/reference">Reference</Link>
          <Link to="/fullconfig">Full Config</Link>
          <Link to="/fbpx">FBPX Import</Link>
          <Link to="/vpbx">VPBX Import</Link>
          <Link to="/mikrotik">Mikrotik Templates</Link>
          <Link to="/switch">Switch Templates</Link>
          <Link to="/ordertracker">Order Tracker</Link>
          <Link to="/stretto">Stretto Import</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/phone" replace />} />
          <Route path="/phone" element={<PhoneConfig />} />
          <Route path="/expansion" element={<ExpansionModules />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/fullconfig" element={<FullConfig />} />
          <Route path="/fbpx" element={<FBPXImport />} />
          <Route path="/vpbx" element={<VPBXImport />} />
          <Route path="/mikrotik" element={<MikrotikTemplates />} />
          <Route path="/switch" element={<SwitchTemplates />} />
          <Route path="/ordertracker" element={<OrderTracker />} />
          <Route path="/stretto" element={<StrettoImport />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;