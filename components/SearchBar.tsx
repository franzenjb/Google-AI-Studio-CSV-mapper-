import React, { useState, useMemo, useEffect } from 'react';

interface SearchBarProps {
    onSearch: (searchTerm: string) => void;
    searchTerm: string;
}

// Basic debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
};


const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchTerm }) => {
    const [inputValue, setInputValue] = useState(searchTerm);

    useEffect(() => {
        setInputValue(searchTerm);
    }, [searchTerm]);

    const debouncedSearch = useMemo(() => debounce(onSearch, 300), [onSearch]);
    
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
        debouncedSearch(event.target.value);
    };

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                placeholder="Search any field..."
            />
        </div>
    );
};

export default SearchBar;