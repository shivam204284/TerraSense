// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  Droplets, Thermometer, CloudRain, Layers, 
  Play, Activity, AlertTriangle, CheckCircle, Gauge 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';

export default function App() {
  // Input Form States
  const [soilType, setSoilType] = useState('Loam');
  const [soilMoisture, setSoilMoisture] = useState(20);
  const [temperature, setTemperature] = useState(32);
  const [rainfallChance, setRainfallChance] = useState(10);

  // Response State
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const fetchIrrigationData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/predict-irrigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soil_type: soilType,
          soil_moisture: parseFloat(soilMoisture),
          temperature: parseFloat(temperature),
          rainfall_chance: parseFloat(rainfallChance)
        })
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error("Failed to connect to backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIrrigationData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
            <Droplets className="h-8 w-8 text-emerald-400" />
            TerraSense Smart Zoning Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time Field Zoning & Water Supply Rate Optimizer
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700">
          <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Environmental Inputs */}
        <section className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
            <Layers className="h-5 w-5 text-indigo-400" />
            Sensor & Weather Inputs
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); fetchIrrigationData(); }} className="space-y-5">
            {/* Soil Type Select */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">SOIL CLASSIFICATION</label>
              <select 
                value={soilType} 
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Sandy">Sandy Soil (High Drainage)</option>
                <option value="Loam">Loamy Soil (Balanced)</option>
                <option value="Clay">Clay Soil (High Retention)</option>
              </select>
            </div>

            {/* Soil Moisture Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span className="flex items-center gap-1"><Droplets className="h-4 w-4 text-blue-400"/> Soil Moisture</span>
                <span className="text-blue-400 font-bold">{soilMoisture}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={soilMoisture}
                onChange={(e) => setSoilMoisture(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span className="flex items-center gap-1"><Thermometer className="h-4 w-4 text-amber-400"/> Ambient Temperature</span>
                <span className="text-amber-400 font-bold">{temperature}°C</span>
              </div>
              <input 
                type="range" min="10" max="50" value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Rainfall Chance Slider */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span className="flex items-center gap-1"><CloudRain className="h-4 w-4 text-teal-400"/> Rain Probability</span>
                <span className="text-teal-400 font-bold">{rainfallChance}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={rainfallChance}
                onChange={(e) => setRainfallChance(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
            >
              <Play className="h-4 w-4 fill-current"/>
              {loading ? 'Computing Micro-Zones...' : 'Calculate Irrigation Metrics'}
            </button>
          </form>
        </section>

        {/* Right Columns: Output Analytics & Spatial Visualization */}
        <section className="lg:col-span-2 space-y-6">
          
          {/* Status Bar */}
          {prediction && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Gauge className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">AVG FIELD WATER DEMAND</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {prediction.total_water_liters_per_m2} <span className="text-sm font-normal text-slate-400">L/m²</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                <div className={`p-3 rounded-lg ${prediction.overall_status === 'CRITICAL' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                  {prediction.overall_status === 'CRITICAL' ? (
                    <AlertTriangle className="h-6 w-6 text-rose-400" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">SYSTEM STATUS</p>
                  <p className={`text-xl font-bold ${prediction.overall_status === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {prediction.overall_status === 'CRITICAL' ? 'CRITICAL WATER STRESS' : 'OPTIMAL CONDITIONS'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pictorial Flow Rate Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-md font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              Pictorial Water Supply Rate by Zone (Liters / min)
            </h3>
            <div className="h-64 w-full">
              {prediction ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prediction.zones}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="zone_name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: 'Rate (LPM)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar dataKey="water_flow_rate_lpm" radius={[6, 6, 0, 0]}>
                      {prediction.zones.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : index === 1 ? '#818cf8' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Execute calculation to render telemetry chart.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Zone Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediction && prediction.zones.map((zone) => (
              <div key={zone.zone_id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                <h4 className="font-bold text-slate-200 text-sm mb-1">{zone.zone_name}</h4>
                <p className="text-xs text-slate-400 mb-4">Soil: {zone.soil_type}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Moisture:</span>
                    <span className="font-semibold text-slate-200">{zone.soil_moisture}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Water Demand:</span>
                    <span className="font-semibold text-blue-400">{zone.water_needed_liters_per_m2} L/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold text-amber-400">{zone.irrigation_duration_mins} mins</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500">STATUS</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    zone.status === 'CRITICAL_WATER_STRESS' ? 'bg-rose-500/20 text-rose-300' :
                    zone.status === 'IRRIGATION_REQUIRED' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {zone.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </section>
      </main>
    </div>
  );
}