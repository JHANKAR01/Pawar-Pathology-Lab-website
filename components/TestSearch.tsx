
import React, { useState } from 'react';
import { Search, Info, FlaskConical, MapPin } from 'lucide-react';
import { Test } from '../types';
import { CATEGORIES } from '../constants';

interface TestSearchProps {
  tests: Test[];
  onSelect: (test: Test) => void;
}

const TestSearch: React.FC<TestSearchProps> = ({ tests, onSelect }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTests = tests.filter(test => {
    const matchesQuery = test.title.toLowerCase().includes(query.toLowerCase()) || 
                         test.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'All' || test.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4" id="tests">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">Find Your Diagnostic Test</h2>
        <p className="text-gray-500 mt-2">Browse through 500+ clinical and specialized tests</p>
      </div>

      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search CBC, Diabetes, Thyroid..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map(test => (
          <div key={test.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg bg-red-50 text-red-600">
                <FlaskConical className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-red-600">₹{test.price}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">{test.title}</h3>
            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{test.description}</p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {test.fastingRequired && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded">
                  <Info className="w-3 h-3" /> Fasting Required
                </span>
              )}
              {test.isHomeCollectionAvailable && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                  <MapPin className="w-3 h-3" /> Home Collection
                </span>
              )}
            </div>

            <button 
              onClick={() => onSelect(test)}
              className="mt-6 w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              Add to Booking
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSearch;
