// Re-add Mikrotik template modules and OTT template function



import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ConfigProvider } from '../components/ConfigContext';
import { AuthProvider, useAuth } from '../components/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import UserMenu from '../components/UserMenu';
import Footer from '../components/Footer';
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
import '../styles/App.css'; // eslint-disable-line



function AppContent() {
  const { isAdmin } = useAuth();
  
  const navigationItems = [
    { to: '/phone', label: 'Phone Configs' },
    { to: '/expansion', label: 'Expansion Modules' },
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'flex-start', background: '#f8f9fa' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px',
          padding: '20px 20px 0 20px'
        }}>
          <div></div>
          <UserMenu />
        </div>
        
        <nav
          className="main-nav"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            margin: '32px 0 32px 0',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            padding: '24px 32px',
            justifyContent: 'center',
            width: 'fit-content',
            flexWrap: 'wrap',
            maxWidth: '95vw',
          }}
        >
          {navigationItems.map(({ to, label, adminOnly }) => (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: 16,
                padding: '12px 32px',
                borderRadius: 6,
                transition: 'background 0.2s, color 0.2s',
                background: adminOnly ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
                color: adminOnly ? '#fff' : '#222',
                margin: 0,
                display: 'block',
                width: 220,
                textAlign: 'left',
              }}
              onMouseOver={e => {
                if (!adminOnly) {
                  e.currentTarget.style.background = '#0078d4';
                  e.currentTarget.style.color = '#fff';
                } else {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseOut={e => {
                if (!adminOnly) {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.color = '#222';
                } else {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ width: '100%', maxWidth: 1200, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            marginTop: 24,
          }}>
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