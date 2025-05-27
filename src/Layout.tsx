import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <main className="flex-grow">
        <Outlet />
      </main>
    
    </div>
  );
};

export default Layout;