// Re-add Mikrotik template modules and OTT template function



import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ConfigProvider } from '../components/ConfigContext';
import { AuthProvider, useAuth } from '../components/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import UserMenu from '../components/UserMenu';
import BrandHeader from '../components/BrandHeader';
import Logo123Net from '../components/Logo123Net';
import Footer from '../components/Footer';
import PendingUserNotification from '../components/PendingUserNotification';
import PhoneConfig from './PhoneConfig';
import ExpansionModules from './ExpansionModules'; // Only default import, no named import
import Reference from './Reference';
import FullConfig from './FullConfig';
import FBPXImport from './FBPXImport';
import VPBXImport from './VPBXImport';
import MikrotikTemplates from './MikrotikTemplates';
import SwitchTemplates from './SwitchTemplates';
import OrderTracker from './OrderTracker';
import StrettoImport from './StrettoImport';
import Diagnostic from './Diagnostic';
import AdminPage from './AdminPage';
import ATA from './ATA';
import AsternicStats from './AsternicStats';
import '../styles/App.css';



function AppContent() {
  const { isAdmin } = useAuth();
  
  const navigationItems = [
    { to: '/phone', label: 'Phone Configs' },
    { to: '/expansion', label: 'Expansion Modules' },
    { to: '/ata', label: 'ATA (Fax)' },
    { to: '/asternic', label: 'Asternic Stats' },
    { to: '/reference', label: 'Reference' },
    { to: '/fullconfig', label: 'Full Config' },
    { to: '/fbpx', label: 'FBPX Import' },
    { to: '/vpbx', label: 'VPBX Import' },
    { to: '/mikrotik', label: 'Mikrotik Templates' },
    { to: '/switch', label: 'Switch Templates' },
    { to: '/ordertracker', label: 'Order Tracker' },
    { to: '/stretto', label: 'Stretto Import' },
    { to: '/diagnostic', label: 'Diagnostics' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', adminOnly: true }] : [])
  ];

  return (
    <MainLayout>
      <BrandHeader />
      {isAdmin && <PendingUserNotification />}
      <div className="app-container">
        <div className="app-header">
          <div className="app-header-logo">
            <Logo123Net size="compact" showText={false} />
          </div>
          <UserMenu />
        </div>
        
        <nav className="main-nav app-nav">
          {navigationItems.map(({ to, label, adminOnly }) => (
            <Link
              key={to}
              to={to}
              className={adminOnly ? 'nav-link admin-nav-link' : 'nav-link'}
              onMouseOver={e => {
                if (!adminOnly) {
                  e.currentTarget.style.background = '#106ebe';
                  e.currentTarget.style.color = 'var(--text-white)';
                } else {
                  e.currentTarget.style.background = '#218838';
                }
              }}
              onMouseOut={e => {
                if (!adminOnly) {
                  e.currentTarget.style.background = 'var(--brand-primary)';
                  e.currentTarget.style.color = 'var(--text-white)';
                } else {
                  e.currentTarget.style.background = 'var(--brand-secondary)';
                }
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="app-content">
          <div className="app-content-wrapper">
            <Routes>
              <Route path="/" element={<Navigate to="/phone" replace />} />
              <Route path="/phone" element={<PhoneConfig />} />
              <Route path="/expansion" element={<ExpansionModules />} />
              <Route path="/ata" element={<ATA />} />
              <Route path="/asternic" element={<AsternicStats />} />
              <Route path="/reference" element={<Reference />} />
              <Route path="/fullconfig" element={<FullConfig />} />
              <Route path="/fbpx" element={<FBPXImport />} />
              <Route path="/vpbx" element={<VPBXImport />} />
              <Route path="/mikrotik" element={<MikrotikTemplates />} />
              <Route path="/switch" element={<SwitchTemplates />} />
              <Route path="/ordertracker" element={<OrderTracker />} />
              <Route path="/stretto" element={<StrettoImport />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </div>
      <Footer />
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <Router>
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        </Router>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;