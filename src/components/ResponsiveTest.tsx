export default function ResponsiveTest() {
  return (
    <div className="p-4">
      <div className="bg-red-500 text-white p-4 mb-4 block sm:hidden">
        📱 Mobile View (under 640px)
      </div>
      <div className="bg-blue-500 text-white p-4 mb-4 hidden sm:block md:hidden">
        📱 Tablet View (640px - 768px)
      </div>
      <div className="bg-green-500 text-white p-4 mb-4 hidden md:block lg:hidden">
        💻 Desktop View (768px - 1024px)
      </div>
      <div className="bg-purple-500 text-white p-4 mb-4 hidden lg:block">
        🖥️ Large Desktop View (over 1024px)
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-gray-200 p-4 rounded">Column 1</div>
        <div className="bg-gray-200 p-4 rounded">Column 2</div>
        <div className="bg-gray-200 p-4 rounded">Column 3</div>
        <div className="bg-gray-200 p-4 rounded">Column 4</div>
      </div>
    </div>
  );
}