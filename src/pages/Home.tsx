import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to E-Commerce</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">New Arrivals</h2>
          <p>Check out our latest products.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Best Sellers</h2>
          <p>Our most popular items.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Special Offers</h2>
          <p>Limited time deals.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;