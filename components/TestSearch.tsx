
import React, { useState } from 'react';
import { Search, Info, FlaskConical, MapPin, Sparkles, ChevronRight, Clock, Home, Zap, ShieldCheck } from 'lucide-react';
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
    <div className="w-full max-w-7xl mx-auto px-6" id="directory">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-20">
        <div className="max-w-2xl">
          <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.5em] mb-6 block">Investigation Matrix</span>
          <h2 className="font-heading text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6">Directory of <br /> <span className="text-rose-600">Specialized Tests</span></h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">Search through our exhaustive list of clinical investigations managed by MD Dr. Rahul Karode.</p>
        </div>
        <div className="hidden lg:flex flex-col items-end">
          <div className="flex -space-x-3 mb-4">
            {[1,2,3,4].map(i => <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200" />)}
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">12k+ Samples Processed Monthly</p>
        </div>
      </div>

      <div className="sticky top-28 z-40 mb-20">
        <div className="glass-pro p-3 rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Search by test name or category..." 
              className="w-full pl-18 pr-8 py-6 bg-slate-50 border-0 rounded-[2.5rem] focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar p-1 xl:max-w-2xl">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-4 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-xl scale-105' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredTests.map(test => (
          <div key={test.id} className="group bg-white p-10 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-50 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
            
            <div className="flex justify-between items-start mb-12 relative z-10">
              <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                <Zap className="w-7 h-7" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Standard Fee</span>
                <span className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-rose-600 transition-colors">₹{test.price}</span>
              </div>
            </div>

            <h3 className="font-heading text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight relative z-10">{test.title}</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 h-16 overflow-hidden relative z-10">{test.description}</p>
            
            <div className="flex flex-wrap gap-3 mb-12 relative z-10">
              {test.fastingRequired && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-4 py-2 rounded-xl border border-amber-100">
                  <Clock className="w-3.5 h-3.5" /> Fasting Required
                </div>
              )}
              {test.isHomeCollectionAvailable && (
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Home Collection
                </div>
              )}
            </div>

            <button 
              onClick={() => onSelect(test)}
              className="w-full py-5 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-slate-100 hover:shadow-rose-200"
            >
              Add To Request <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSearch;
