import { useState } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { Waterbody } from './types';

function App() {
  const [selectedWaterbody, setSelectedWaterbody] = useState<Waterbody | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string>('Hillsborough');

  const handleWaterbodySelect = (waterbody: Waterbody) => {
    console.log('App received waterbody:', waterbody);
    setSelectedWaterbody(waterbody);
  };

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Header */}
      <div className="bg-white shadow-md z-20 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Florida Waterbody Water Quality Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Click on any waterbody to view water quality information
        </p>
      </div>

      {/* Main Content - 50/50 split on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Map - Left side on desktop, top on mobile */}
        <div className="w-full md:w-1/2 h-64 md:h-full">
          <MapComponent 
            onWaterbodySelect={handleWaterbodySelect}
            county={selectedCounty}
            onCountyChange={setSelectedCounty}
          />
        </div>

        {/* Sidebar - Right side on desktop, bottom on mobile */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto">
          <Sidebar
            waterbody={selectedWaterbody}
            onClose={() => setSelectedWaterbody(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
