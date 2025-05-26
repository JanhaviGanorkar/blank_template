import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-1">Name</label>
              <input 
                type="text" 
                id="name" 
                className="w-full p-2 border rounded" 
                placeholder="Your Name" 
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full p-2 border rounded" 
                placeholder="Your Email" 
              />
            </div>
            <div className="mb-4">
              <label htmlFor="message" className="block mb-1">Message</label>
              <textarea 
                id="message" 
                className="w-full p-2 border rounded" 
                rows={4} 
                placeholder="Your Message"
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send Message
            </button>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Contact Information</h2>
          <div className="mb-4">
            <h3 className="font-bold">Address</h3>
            <p>123 E-Commerce St, City, Country</p>
          </div>
          <div className="mb-4">
            <h3 className="font-bold">Email</h3>
            <p>info@ecommerce.com</p>
          </div>
          <div className="mb-4">
            <h3 className="font-bold">Phone</h3>
            <p>+1 234 567 890</p>
          </div>
          <div>
            <h3 className="font-bold">Working Hours</h3>
            <p>Monday - Friday: 9am - 5pm</p>
            <p>Saturday: 10am - 4pm</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;