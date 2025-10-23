
import React from 'react';

interface VariableSelectorProps {
  headers: string[];
  onVariableSelect: (variable: string) => void;
  disabled: boolean;
}

const VariableSelector: React.FC<VariableSelectorProps> = ({ headers, onVariableSelect, disabled }) => {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value) {
      onVariableSelect(event.target.value);
    }
  };

  return (
    <div className="w-full">
      <select
        onChange={handleSelectChange}
        disabled={disabled}
        className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition duration-150 ease-in-out dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 disabled:dark:bg-gray-600"
      >
        <option value="">-- Select a column --</option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VariableSelector;