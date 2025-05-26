import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <p className="mb-4">
          Welcome to E-Commerce, your number one source for all products. We're dedicated 
          to providing you the very best of products, with an emphasis on quality, 
          customer service, and uniqueness.
        </p>
        <p className="mb-4">
          Founded in 2023, E-Commerce has come a long way from its beginnings. 
          We hope you enjoy our products as much as we enjoy offering them to you. 
          If you have any questions or comments, please don't hesitate to contact us.
        </p>
      </div>
      
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p>
          Our mission is to provide high-quality products at affordable prices while 
          ensuring an excellent shopping experience for all our customers.
        </p>
      </div>
    </div>
  );
};

export default About;