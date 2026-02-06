import { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { Waterbody } from './types';

function App() {
  const [selectedWaterbody, setSelectedWaterbody] = useState<Waterbody | null>(null);

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-20 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Florida Waterbody Water Quality Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Click on any waterbody to view water quality information
        </p>
      </div>

      {/* Map */}
      <div className="absolute top-20 left-0 right-0 bottom-0">
        <MapComponent onWaterbodySelect={setSelectedWaterbody} />
      </div>

      {/* Sidebar */}
      {selectedWaterbody && (
        <Sidebar
          waterbody={selectedWaterbody}
          onClose={() => setSelectedWaterbody(null)}
        />
      )}
    </div>
  );
}

export default App;
