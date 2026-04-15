import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPlus, LuMapPin, LuWheat, LuTractor, LuSun, LuDroplet } from 'react-icons/lu';

// --- Placeholder Component for a single field/crop ---
const CropCard = ({ fieldName, cropName, stage, health }) => {
  // Determine health color
  const healthColor = health === 'Healthy' ? 'text-green-600' : health === 'Needs Attention' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 transition-transform duration-300 hover:scale-[1.03] cursor-pointer">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-bold text-gray-800 flex items-center">
          <LuMapPin className="mr-2 text-gray-400" /> {fieldName}
        </h4>
        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${healthColor.replace('text-', 'bg-').replace('600', '-100')} ${healthColor}`}>
          {health}
        </span>
      </div>
      <div className="flex items-center space-x-3 mb-4">
        <LuWheat className="text-3xl text-green-600" />
        <div>
          <p className="font-semibold text-gray-700">{cropName}</p>
          <p className="text-xs text-gray-500">Stage: {stage}</p>
        </div>
      </div>
      {/* Placeholder for Next Action */}
      <div className="text-xs text-gray-500 flex items-center justify-end">
         <LuDroplet className="mr-1"/> Next Action: Watering due tomorrow
      </div>
      {/* Progress Bar (Simple Placeholder) */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '60%' }}></div> {/* Example progress */}
      </div>
    </div>
  );
};


// --- Main My Crops Page ---
function MyCropsPage() {
  // We'll use dummy data for now. Later, this will come from a backend.
  const [crops, setCrops] = useState([
    { id: 1, fieldName: 'Khet 1 (Uttar)', cropName: 'Gehoon (Wheat)', stage: 'Flowering', health: 'Healthy' },
    { id: 2, fieldName: 'Bagicha (Paschim)', cropName: 'Tamatar (Tomato)', stage: 'Fruiting', health: 'Needs Attention' },
    { id: 3, fieldName: 'Nadi Kinara', cropName: 'Chawal (Rice)', stage: 'Vegetative', health: 'Healthy' },
  ]);

  return (
    <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto pb-20 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">
          Mera Khet Dashboard 🌱
        </h2>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md flex items-center transition-transform duration-200 hover:scale-105">
          <LuPlus className="mr-2" /> Naya Khet/Fasal Jodein
        </button>
      </div>

      {/* --- Visual Layout (Placeholder - can be improved) --- */}
      {/* Using a simple grid for now. Can be replaced with a map-like view later */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crops.map(crop => (
          <CropCard 
            key={crop.id}
            fieldName={crop.fieldName}
            cropName={crop.cropName}
            stage={crop.stage}
            health={crop.health}
          />
        ))}

        {/* Placeholder for adding more */}
         <div className="border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[150px] text-gray-400 hover:border-green-400 hover:text-green-500 cursor-pointer transition-colors">
            <div className="text-center">
                <LuPlus className="mx-auto text-4xl mb-2"/>
                <p className="font-medium">Naya Khet Jodein</p>
            </div>
         </div>
      </div>

       {/* --- Section for Next Actions (Optional) --- */}
       <div className="mt-10">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Aane Wale Kaam</h3>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 space-y-3">
             <p className="text-sm text-gray-600 flex items-center"><LuDroplet className="mr-2 text-blue-500"/> Bagicha (Paschim) - Tamatar ko kal paani dena hai.</p>
             <p className="text-sm text-gray-600 flex items-center"><LuTractor className="mr-2 text-orange-500"/> Khet 1 (Uttar) - Gehoon mein khaad 3 din baad daalna hai.</p>
          </div>
       </div>

    </main>
  );
}

export default MyCropsPage;