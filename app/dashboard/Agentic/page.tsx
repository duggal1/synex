import React from 'react';

const Page = () => {
  return (
    <div className="flex flex-col justify-center items-center bg-black h-screen">
      <div className="flex flex-col justify-center items-center text-center">
        <h1 className="mb-2 font-black text-white/90 text-4xl tracking-tight">
          Agentic
        </h1>
        <p className="mt-2 mb-12 text-gray-400 text-xl">
          A platform for creating Powerful  AI Invoices
        </p>
      </div>
      
      <div className="flex flex-col justify-center items-center mt-4">
        <div className="bg-gray-900 shadow-lg p-8 border border-gray-800 hover:border-blue-500 rounded-xl transition-all duration-300">
          <header className="flex flex-col justify-center items-center">
            <h2 className="mb-4 font-black text-white text-4xl">⚠️ COMING SOON</h2>
          </header>
        </div>
      </div>
      
      <div className="mt-12 text-gray-600 text-sm">
        © 2025 Agentic • All rights reserved
      </div>
    </div>
  );
};

export default Page;