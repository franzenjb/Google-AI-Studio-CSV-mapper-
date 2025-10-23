import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CsvData, MapMarker, CsvRow, Theme } from './types';
import { geocodeLocations } from './services/geminiService';
import { detectLatLngColumns } from './utils/csvUtils';
import FileUpload from './components/FileUpload';
import MapDisplay from './components/MapDisplay';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import VariableSelector from './components/VariableSelector';

const App: React.FC = () => {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [allMarkers, setAllMarkers] = useState<MapMarker[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [latLngColumns, setLatLngColumns] = useState<{ lat: string | null; lng: string | null }>({ lat: null, lng: null });
  
  // State for new features
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const resetState = () => {
    setCsvData(null);
    setAllMarkers([]);
    setFilteredMarkers([]);
    setError(null);
    setLatLngColumns({ lat: null, lng: null });
    setFilters({});
    setSearchTerm('');
    setFilterCategory('');
  };
  
  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const processData = useCallback((data: CsvData) => {
    const detected = detectLatLngColumns(data.headers);
    setLatLngColumns(detected);
    setCsvData(data);

    if (detected.lat && detected.lng) {
      const markers = data.rows.map((row, index) => {
        const lat = parseFloat(row[detected.lat!]);
        const lng = parseFloat(row[detected.lng!]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { id: `marker-${index}`, lat, lng, data: row };
        }
        return null;
      }).filter((marker): marker is MapMarker => marker !== null);
      setAllMarkers(markers);
    }
  }, []);

  const handleGeocode = useCallback(async (variable: string) => {
    if (!csvData) return;

    setIsLoading(true);
    setError(null);

    try {
      const locations = csvData.rows.map(row => row[variable]).filter(Boolean);
      if (locations.length === 0) throw new Error("No locations found in the selected column.");
      
      const geocodedData = await geocodeLocations(locations);
      
      const locationMap = new Map(geocodedData.map(item => [item.location, { lat: item.lat, lng: item.lng }]));
      
      const markers = csvData.rows.map((row, index) => {
        const locationString = row[variable];
        const coords = locationMap.get(locationString);
        if (coords) {
          return { id: `marker-${index}`, lat: coords.lat, lng: coords.lng, data: row };
        }
        return null;
      }).filter((marker): marker is MapMarker => marker !== null);

      setAllMarkers(markers);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during geocoding.');
    } finally {
      setIsLoading(false);
    }
  }, [csvData]);


  // Effect to apply filters and search
  useEffect(() => {
    let markers = [...allMarkers];

    // Apply filters
    const activeFilters = Object.entries(filters).filter(([, value]) => value !== '');
    if (activeFilters.length > 0) {
      markers = markers.filter(marker => 
        activeFilters.every(([key, value]) => marker.data[key] === value)
      );
    }

    // Apply search
    if (searchTerm.trim() !== '') {
      const lowercasedFilter = searchTerm.toLowerCase();
      markers = markers.filter(marker => 
        Object.values(marker.data).some(value => 
          String(value).toLowerCase().includes(lowercasedFilter)
        )
      );
    }

    setFilteredMarkers(markers);
  }, [allMarkers, filters, searchTerm]);
  
  const filterableHeaders = useMemo(() => {
    if (!csvData) return [];
    return csvData.headers.filter(h => h !== latLngColumns.lat && h !== latLngColumns.lng);
  }, [csvData, latLngColumns]);


  const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2 p-4">
      <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600"></div>
      <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-4 h-4 rounded-full animate-pulse bg-blue-600" style={{ animationDelay: '0.4s' }}></div>
      <span className="text-gray-500 dark:text-gray-400">Geocoding locations with Gemini...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-80 h-screen bg-white dark:bg-gray-800 shadow-xl p-6 space-y-6 self-start overflow-y-auto transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">Controls</h2>
          <FileUpload onFileUpload={processData} onClear={resetState} />
        </div>

        {!csvData && (
           <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
              <p>Upload a CSV file to begin. The app will automatically detect <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">latitude</code> and <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">longitude</code> columns. If not found, you'll be prompted to select a column for geocoding.</p>
          </div>
        )}

        {csvData && !latLngColumns.lat && (
           <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Geocode Locations</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">We couldn't find coordinate columns. Please select the column containing addresses or place names to geocode.</p>
              <VariableSelector 
                  headers={csvData.headers} 
                  onVariableSelect={handleGeocode} 
                  disabled={isLoading}
              />
              {isLoading && <LoadingSpinner />}
           </div>
        )}

        {allMarkers.length > 0 && (
          <>
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Search</h3>
              <SearchBar onSearch={setSearchTerm} searchTerm={searchTerm} />
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Filter & Style</h3>
               <FilterPanel 
                headers={filterableHeaders}
                rows={csvData!.rows}
                filters={filters}
                onFilterChange={setFilters}
                iconCategory={filterCategory}
                onIconCategoryChange={setFilterCategory}
                onResetFilters={handleResetFilters}
                searchTerm={searchTerm}
               />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:pl-80' : 'pl-0'}`}>
        <div className="flex flex-col h-screen p-4">
            <header className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 mr-4 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Advanced CSV Mapper</h1>
                    <p className="text-md text-gray-600 dark:text-gray-400 mt-1">Auto-detection, powerful filtering, and dynamic icons</p>
                 </div>
              </div>

              <button 
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900"
              >
                {theme === 'light' ? (
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            </header>
            
            <main className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-inner relative flex items-center justify-center">
               <MapDisplay 
                  markers={filteredMarkers} 
                  iconCategoryField={filterCategory}
                  theme={theme}
                />
                {csvData && allMarkers.length === 0 && !isLoading && (
                  <div className="absolute inset-0 bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-2xl text-center max-w-md">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No Locations Found</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        We've processed your file, but couldn't find any locations to plot on the map.
                      </p>
                      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Please ensure your latitude/longitude columns are correctly formatted, or that the location names selected for geocoding are recognizable.
                      </p>
                    </div>
                  </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default App;