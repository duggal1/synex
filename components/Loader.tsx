import { Loader2 } from 'lucide-react';
import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
};

export default Loader;