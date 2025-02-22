import React from 'react';


const BottomBar = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bottom-0 w-full bg-gray-100 text-center py-2 border-t border-gray-300">
      <div className="flex flex-row items-center justify-center max-w-7xl mx-auto px-4">
        <p className="text-gray-700 font-bold">&copy; {currentYear} Green Guage. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default BottomBar;