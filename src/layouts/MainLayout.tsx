import React from 'react';
import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      {/* You can add a header, sidebar, or footer here if needed */}
      {children}
    </div>
  );
};

export default MainLayout;
