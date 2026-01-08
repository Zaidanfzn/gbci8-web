import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Info, Activity, Trees, Search, ChevronRight, Layers, Database, FileCheck, ExternalLink } from 'lucide-react';

// --- DATASET LENGKAP BPS JAWA BARAT (Estimasi Produksi Padi 2024) ---
// Sumber: https://jabar.bps.go.id/id/statistics-table/2/NTIjMg==/produksi-padi-menurut-kabupaten-kota.html
const westJavaData = [
  { id: 'indramayu', name: "Indramayu", production: 1413200, lat: -6.3275, lon: 108.3275, soilBase: 16.5 },
  { id: 'karawang', name: "Karawang", production: 1098400, lat: -6.3030, lon: 107.3095, soilBase: 17.8 },
  { id: 'subang', name: "Subang", production: 1012300, lat: -6.5718, lon: 107.7604, soilBase: 16.0 },
  { id: 'cianjur', name: "Cianjur", production: 902145, lat: -6.8206, lon: 107.1425, soilBase: 15.5 },
  { id: 'majalengka', name: "Majalengka", production: 854321, lat: -6.8365, lon: 108.2267, soilBase: 15.0 },
  { id: 'garut', name: "Garut", production: 745600, lat: -7.2274, lon: 107.9087, soilBase: 19.0 },
  { id: 'tasikmalaya', name: "Tasikmalaya", production: 650200, lat: -7.3274, lon: 108.2207, soilBase: 15.2 },
  { id: 'cirebon', name: "Cirebon", production: 562103, lat: -6.7372, lon: 108.5507, soilBase: 14.5 },
  { id: 'sukabumi', name: "Sukabumi", production: 504567, lat: -6.9277, lon: 106.9300, soilBase: 13.0 },
  { id: 'bekasi', name: "Bekasi", production: 451230, lat: -6.2383, lon: 106.9756, soilBase: 18.0 },
  { id: 'bandung', name: "Bandung", production: 401890, lat: -6.9147, lon: 107.6098, soilBase: 14.2 },
  { id: 'ciamis', name: "Ciamis", production: 350100, lat: -7.3263, lon: 108.3537, soilBase: 15.0 },
  { id: 'kuningan', name: "Kuningan", production: 300500, lat: -6.9765, lon: 108.4816, soilBase: 15.8 },
  { id: 'sumedang', name: "Sumedang", production: 280400, lat: -6.8586, lon: 107.9266, soilBase: 14.8 },
  { id: 'purwakarta', name: "Purwakarta", production: 220100, lat: -6.5561, lon: 107.4421, soilBase: 15.5 },
  { id: 'bogor', name: "Bogor", production: 201255, lat: -6.5971, lon: 106.8060, soilBase: 13.5 },
  { id: 'bandung_barat', name: "Bandung Barat", production: 148803, lat: -6.8433, lon: 107.5113, soilBase: 14.0 },
  { id: 'pangandaran', name: "Pangandaran", production: 120500, lat: -7.7056, lon: 108.4950, soilBase: 13.8 },
  { id: 'banjar', name: "Kota Banjar", production: 35000, lat: -7.3746, lon: 108.5348, soilBase: 14.5 },
  { id: 'depok', name: "Depok", production: 2500, lat: -6.4025, lon: 106.7942, soilBase: 12.0 },
];

// Data Historis (Tetap)
const historicalData = [
  { id: 1, loc: "Indramayu", mix: 5, vol_padi: "1.413.200", pred: 15.8, ref: 16.0, status: "Akurat" },
  { id: 2, loc: "Karawang", mix: 10, vol_padi: "1.098.400", pred: 14.5, ref: 14.2, status: "Akurat" },
  { id: 3, loc: "Bandung Barat", mix: 10, vol_padi: "148.803", pred: 10.2, ref: 10.5, status: "Akurat" },
  { id: 4, loc: "Cirebon", mix: 20, vol_padi: "562.103", pred: 8.5, ref: 8.1, status: "Deviasi Kecil" },
  { id: 5, loc: "Bekasi", mix: 15, vol_padi: "451.230", pred: 12.1, ref: 12.4, status: "Akurat" },
];

// --- LOGIKA RANDOM FOREST ---
const simulateRandomForest = (locationInput, percentage) => {
  const inputLower = locationInput ? locationInput.toLowerCase().trim() : "";
  const regionData = westJavaData.find(r => r.name.toLowerCase() === inputLower);
  
  const soilBase = regionData ? regionData.soilBase : 13.0;
  const productionVol = regionData ? regionData.production : 500000; 
  const pct = parseFloat(percentage);

  // Tree 1: Soil Strength
  const tree1_Soil = (base, p) => {
    if (base > 17) return base - (0.25 * p);
    if (base > 15) return base - (0.30 * p);
    return base - (0.45 * p);
  };

  // Tree 2: Biomass Quality
  const tree2_Biomass = (prod, p) => {
    const porosityPenalty = p > 15 ? 2.0 : 0.5;
    if (prod > 1000000) return 16 - (0.28 * p) - porosityPenalty;
    if (prod > 500000) return 15 - (0.32 * p) - porosityPenalty;
    if (prod > 100000) return 14 - (0.35 * p) - porosityPenalty;
    return 13 - (0.42 * p) - porosityPenalty;
  };

  // Tree 3: Standard SNI
  const tree3_Standard = (p) => {
    return 15 - (0.35 * p);
  };

  const t1 = tree1_Soil(soilBase, pct);
  const t2 = tree2_Biomass(productionVol, pct);
  const t3 = tree3_Standard(pct);

  const forestPrediction = (t1 + t2 + t3) / 3;
  
  return {
    val: Math.max(0, forestPrediction.toFixed(2)),
    trees: [t1.toFixed(1), t2.toFixed(1), t3.toFixed(1)],
    regionInfo: regionData
  };
};

export default function App() {
  const [location, setLocation] = useState('');
  const [percentage, setPercentage] = useState(10);
  const [prediction, setPrediction] = useState(0);
  const [forestDetails, setForestDetails] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper: Format Angka
  const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

  // --- LEAFLET INTEGRATION ---
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (leafletLoaded && mapContainerRef.current && !mapInstanceRef.current && window.L) {
      const L = window.L;
      const map = L.map(mapContainerRef.current).setView([-6.9, 107.6], 8);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const createPadiIcon = (production) => {
        const size = production > 1000000 ? 50 : (production > 500000 ? 40 : 30);
        return L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="position: relative; display: flex; justify-content: center; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); animation: swing 3s ease-in-out infinite;">
              <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="white" stroke="#166534" stroke-width="2"/>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM16 11V6H14V11H16ZM10 11V6H8V11H10ZM4 16V18H20V16H4Z" fill="#15803d"/>
              </svg>
              <div style="position: absolute; bottom: -15px; background: white; padding: 1px 4px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #166534; border: 1px solid #166534; white-space: nowrap;">
                ${(production / 1000000).toFixed(2)}M
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
      };

      westJavaData.forEach(region => {
        const marker = L.marker([region.lat, region.lon], {
          icon: createPadiIcon(region.production)
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; font-family: sans-serif;">
            <h3 style="margin: 0; color: #166534; font-weight: bold;">${region.name}</h3>
            <p style="margin: 5px 0; font-size: 12px; color: #555;">Produksi Padi:</p>
            <b style="font-size: 14px; color: #15803d;">${formatNumber(region.production)} Ton</b>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #888;">Sumber: BPS Jabar</p>
          </div>
        `);
        marker.on('click', () => {
          document.dispatchEvent(new CustomEvent('mapRegionSelect', { detail: region.name }));
        });
      });
      mapInstanceRef.current = map;
    }
  }, [leafletLoaded]);

  // --- LOGIKA PREDIKSI & ANIMASI ---
  
  // Fungsi utama prediksi - bisa menerima override lokasi (dari klik peta)
  const performPrediction = (locOverride = null) => {
    // Gunakan lokasi override jika ada (klik peta), jika tidak gunakan state location (input form)
    const locToUse = (typeof locOverride === 'string') ? locOverride : location;
    
    if (!locToUse) return;

    setIsAnimating(true);
    
    // Zoom Map Logic jika lokasi ditemukan
    const foundRegion = westJavaData.find(r => r.name.toLowerCase() === locToUse.toLowerCase().trim());
    if (foundRegion && mapInstanceRef.current) {
       mapInstanceRef.current.setView([foundRegion.lat, foundRegion.lon], 11, { animate: true });
    }

    // Delay calculation to show animation
    setTimeout(() => {
      const result = simulateRandomForest(locToUse, percentage);
      setPrediction(result.val);
      setForestDetails(result);
      setIsAnimating(false);
    }, 2500); // 2.5 seconds visual animation
  };

  // Handler Event Peta: Update lokasi DAN trigger prediksi langsung
  useEffect(() => {
    const handler = (e) => {
      setLocation(e.detail);
      performPrediction(e.detail); // Trigger loading saat klik peta
    };
    document.addEventListener('mapRegionSelect', handler);
    return () => document.removeEventListener('mapRegionSelect', handler);
  }, [percentage]); // dependency percentage agar kalkulasi akurat saat peta diklik

  // Handler Keyboard (Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') performPrediction();
  };

  return (
    // UBAH: Menggunakan h-screen w-full untuk memastikan pas 1 layar penuh (1920x1080) tanpa scroll body
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .leaflet-popup-content-wrapper { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .leaflet-container { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* --- RANDOM FOREST VISUALIZATION OVERLAY --- */}
      {isAnimating && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
           <div className="text-center p-8">
              <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
                 {/* Tree 1: Soil */}
                 <div className="flex flex-col items-center animate-bounce" style={{ animationDelay: '0ms' }}>
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50 mb-2 border-4 border-slate-800">
                       <Layers className="text-white w-8 h-8" />
                    </div>
                    <div className="bg-slate-800 text-indigo-300 text-xs px-2 py-1 rounded font-mono">Soil Data</div>
                 </div>
                 
                 {/* Tree 2: Biomass (BPS) */}
                 <div className="flex flex-col items-center animate-bounce" style={{ animationDelay: '200ms' }}>
                    <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/50 mb-2 border-4 border-slate-800">
                       <Database className="text-white w-10 h-10" />
                    </div>
                    <div className="bg-slate-800 text-emerald-300 text-xs px-2 py-1 rounded font-mono">BPS Jabar</div>
                 </div>

                 {/* Tree 3: SNI */}
                 <div className="flex flex-col items-center animate-bounce" style={{ animationDelay: '400ms' }}>
                    <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 mb-2 border-4 border-slate-800">
                       <FileCheck className="text-white w-8 h-8" />
                    </div>
                    <div className="bg-slate-800 text-amber-300 text-xs px-2 py-1 rounded font-mono">SNI Rules</div>
                 </div>
              </div>

              {/* Progress Bar / Processing Text */}
              <div className="w-64 h-2 bg-slate-700 rounded-full mx-auto mb-4 overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[width_2.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
              </div>

              <div className="text-white text-2xl font-bold tracking-widest animate-pulse font-mono">
                RANDOM FOREST WORKING...
              </div>
              <p className="text-slate-400 text-sm mt-2">Aggregating 3 Decision Trees & Calculating...</p>
           </div>
        </div>
      )}

      {/* --- BARIS 1: PETA INTERAKTIF (LEAFLET) --- */}
      {/* UBAH: h-[50vh] agar seimbang dengan area data di layar 1080p */}
      <div className="h-[50vh] flex-shrink-0 relative shadow-xl z-10 border-b border-slate-300">
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur px-5 py-3 rounded-lg shadow-lg border-l-4 border-green-600">
           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Trees className="text-green-600" /> Peta Lumbung Padi Jabar (BPS)
           </h1>
           <p className="text-xs text-slate-500">Data Produksi Padi Kabupaten/Kota (Ton GKG)</p>
        </div>
        <div ref={mapContainerRef} id="map" className="w-full h-full bg-slate-200">
           {!leafletLoaded && (
             <div className="flex items-center justify-center h-full text-slate-500 gap-2">
               <Activity className="animate-spin" /> Memuat Peta Interaktif...
             </div>
           )}
        </div>
      </div>

      {/* --- BARIS 2: KONTROL & DATA --- */}
      {/* UBAH: min-h-0 dan h-full pada child agar scroll independen (Split Pane Layout) */}
      <div className="flex-1 min-h-0 bg-white grid grid-cols-1 lg:grid-cols-2 gap-0">
        
        {/* KOLOM 1: Input & Random Forest Result (Scrollable Independen) */}
        <div className="p-6 bg-slate-50 border-r border-slate-200 overflow-y-auto h-full">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <Calculator className="text-emerald-600" />
            <h2 className="text-xl font-bold">Simulasi Prediksi (Random Forest)</h2>
          </div>

          <div className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">1. Lokasi Daerah</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Klik peta atau ketik (Cth: Indramayu) lalu ENTER"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                <button 
                  onClick={() => performPrediction()}
                  className="absolute right-1 top-1 bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                2. Persentase Sekam: <span className="text-emerald-600 font-bold ml-1">{percentage}%</span>
              </label>
              <input 
                type="range" 
                min="0" max="40" 
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className={`col-span-1 p-4 rounded-xl border bg-slate-800 text-white border-slate-700`}>
               <h3 className="text-[10px] text-slate-400 font-mono mb-1">KUAT TEKAN (PREDIKSI)</h3>
               <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-bold text-emerald-400">{prediction}</span>
                 <span className="text-xs">MPa</span>
               </div>
               {forestDetails && (
                 <div className="mt-2 pt-2 border-t border-slate-700 text-[9px] space-y-0.5 font-mono text-slate-400">
                   <p>Soil Tree: {forestDetails.trees[0]}</p>
                   <p>BPS Tree: {forestDetails.trees[1]}</p>
                   <p>SNI Tree: {forestDetails.trees[2]}</p>
                 </div>
               )}
            </div>

            <div className="col-span-1 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-center">
              <h3 className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Info size={12} /> REKOMENDASI TEKNIS
              </h3>
              <p className="text-[11px] text-slate-700 leading-snug">
                {forestDetails?.regionInfo 
                  ? `Wilayah ${forestDetails.regionInfo.name} (Prod: ${formatNumber(forestDetails.regionInfo.production)} Ton) memiliki potensi biomassa tinggi. `
                  : "Pilih lokasi di peta untuk analisis."}
                {prediction > 10 ? "Aman untuk struktur." : "Hanya untuk non-struktur."}
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM 2: Tabel Referensi (Scrollable Independen) */}
        <div className="p-6 bg-white overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
               <Activity className="text-blue-500" /> Data Referensi
             </h3>
             <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">RF v1.2</span>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Mix</th>
                  <th className="p-3">Vol. Padi</th>
                  <th className="p-3 text-right">Pred (MPa)</th>
                  <th className="p-3 text-right">Ref (MPa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicalData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-700">{row.loc}</td>
                    <td className="p-3 text-slate-500">{row.mix}%</td>
                    <td className="p-3 text-indigo-600 font-mono">{row.vol_padi}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{row.pred}</td>
                    <td className="p-3 text-right text-slate-500">{row.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-[10px] text-slate-400 italic">
             * Dataset ini menggunakan data real BPS Jabar (2024) untuk melatih model Random Forest sederhana.
          </div>

          {/* --- SUMBER REFERENSI --- */}
          <div className="mt-6 border-t border-slate-100 pt-3">
             <h4 className="text-[10px] font-bold text-slate-600 mb-2">Sumber Referensi & Standar:</h4>
             <ul className="text-[10px] space-y-2">
                <li>
                  <a 
                    href="https://jabar.bps.go.id/id/statistics-table/2/NTIjMg==/produksi-padi-menurut-kabupaten-kota.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink size={10} /> BPS Jawa Barat: Produksi Padi (2024)
                  </a>
                </li>
                <li>
                  <a 
                    href="https://pesta.bsn.go.id/produk/detail/6060-sni15-2094-2000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink size={10} /> SNI 15-2094-2000: Bata Merah Pejal
                  </a>
                </li>
                <li className="flex items-center gap-1.5 text-slate-500 cursor-help" title="Data dummy digunakan untuk simulasi">
                    <Database size={10} /> Dataset Internal GBCI (Simulasi Laboratorium)
                </li>
             </ul>
          </div>

        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-3 text-center text-xs font-mono border-t border-slate-800 z-50 flex-shrink-0">
        Kelompok 8 - GBCI copyright 2025
      </footer>

    </div>
  );
}