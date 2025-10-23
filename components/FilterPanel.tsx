import React, { useMemo } from 'react';
import { CsvRow } from '../types';
import { getUniqueColumnValues } from '../utils/csvUtils';

interface FilterPanelProps {
  headers: string[];
  rows: CsvRow[];
  filters: Record<string, string>;
  onFilterChange: (newFilters: Record<string, string>) => void;
  iconCategory: string;
  onIconCategoryChange: (category: string) => void;
  onResetFilters: () => void;
  searchTerm: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ headers, rows, filters, onFilterChange, iconCategory, onIconCategoryChange, onResetFilters, searchTerm }) => {

  const handleFilterChange = (header: string, value: string) => {
    onFilterChange({ ...filters, [header]: value });
  };
  
  const optionsCache = useMemo(() => {
    const cache: Record<string, string[]> = {};
    headers.forEach(header => {
      cache[header] = getUniqueColumnValues(rows, header);
    });
    return cache;
  }, [headers, rows]);
  
  const areFiltersActive = useMemo(() => {
    return Object.values(filters).some(value => value !== '') || searchTerm.trim() !== '';
  }, [filters, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label htmlFor="icon-category-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Color Icons By Category
        </label>
        {areFiltersActive && (
          <button 
            onClick={onResetFilters}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-200 dark:text-blue-800 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        )}
      </div>
      <select
        id="icon-category-select"
        value={iconCategory}
        onChange={(e) => onIconCategoryChange(e.target.value)}
        className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
      >
        <option value="">Default Icons</option>
        {headers.map(header => (
          <option key={header} value={header}>{header}</option>
        ))}
      </select>
      
      {headers.map(header => {
        const uniqueValues = optionsCache[header];
        if (uniqueValues.length === 0 || uniqueValues.length > 200) return null; // Don't show filters for unique ID columns

        return (
          <div key={header}>
            <label htmlFor={`filter-${header}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by {header}
            </label>
            <select
              id={`filter-${header}`}
              value={filters[header] || ''}
              onChange={(e) => handleFilterChange(header, e.target.value)}
              className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
            >
              <option value="">All</option>
              {uniqueValues.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  );
};

export default FilterPanel;