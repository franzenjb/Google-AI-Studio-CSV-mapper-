import React, { useState, useCallback, useRef } from 'react';
import { CsvData, CsvRow } from '../types';

interface FileUploadProps {
  onFileUpload: (data: CsvData) => void;
  onClear: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onClear }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      alert("CSV file must contain a header row and at least one data row.");
      return;
    }

    // This regex handles quoted fields, commas within quotes, and escaped quotes.
    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
      let match;
      regex.lastIndex = 0;
      
      while ((match = regex.exec(line)) && match[0]) {
        const value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        values.push(value);
      }
       
      if (line.endsWith(',')) {
          values.push('');
      }

      return values;
    };

    const headers = parseLine(lines[0]).map(h => h.trim());
    const rows: CsvRow[] = lines.slice(1).map(line => {
      const values = parseLine(line);
      const row: CsvRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      return row;
    });

    if (rows.length === 0) {
      alert("Could not parse any data rows from the CSV file.");
      return;
    }
    onFileUpload({ headers, rows });
  };


  const handleFile = (file: File) => {
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid .csv file.");
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleClear = () => {
    setFileName(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onClear();
  }

  if (fileName) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">Loaded: {fileName}</p>
            <button 
                onClick={handleClear}
                className="ml-4 px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-200 dark:text-red-800 dark:hover:bg-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Clear
            </button>
        </div>
    )
  }

  return (
    <label
        htmlFor="csv-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-700 border-2 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none`}>
        <span className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-medium text-gray-600 dark:text-gray-400">
            Drop CSV file here, or <span className="text-blue-600 underline">browse</span>
          </span>
        </span>
        <input 
          ref={fileInputRef}
          type="file" 
          id="csv-upload" 
          name="csv-upload" 
          className="hidden" 
          accept=".csv"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </label>
  );
};

export default FileUpload;