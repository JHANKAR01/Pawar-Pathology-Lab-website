import React, { useState } from 'react';
import { Search, Zap, ChevronRight, Clock, ShieldCheck, FlaskConical, CheckCircle } from 'lucide-react';
import { Test } from '../types';
import { CATEGORIES } from '../lib/constants';

interface TestSearchProps {
  tests: Test[];
  onSelect: (test: Test) => void;
  selectedIds?: string[];
}

const TestSearch: React.FC<TestSearchProps> = ({ tests, onSelect, selectedIds = [] }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTests = tests.filter(test => {
    const matchesQuery = test.title.toLowerCase().includes(query.toLowerCase()) || 
                         test.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === 'All' || test.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12" id="directory">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 lg:gap-12 mb-16 md:mb-24">
        <div className="max-w-3xl">
          <span className="text-rose-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mb-4 md:mb-6 block">Investigation Registry</span>
          <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6 md:mb-8">Laboratory <br /> <span className="text-rose-600">Diagnostics</span></h2>
          <p className="text-slate-500 text-base md:text-xl font-medium leading-relaxed max-w-2xl">Access our comprehensive catalog of molecular and clinical investigations overseen by MD pathology specialists.</p>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-6">
          <div className="flex -space-x-4">
            {[1,2,3,4,5].map(i => <div key={i} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-[4px] md:border-[5px] border-white bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm">P{i}</div>)}
          </div>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accredited Processing Hub</p>
        </div>
      </div>

      <div className="sticky top-24 md:top-28 z-40 mb-16 md:mb-24">
        <div className="glass-pro p-3 md:p-4 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col xl:flex-row gap-4 md:gap-5 border border-white/80">
          <div className="relative flex-1">
            <Search className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 md:w-6 md:h-6" />
            <input 
              type="text" 
              placeholder="Search by title, code or category..." 
              className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-5 md:py-7 bg-slate-50 border-0 rounded-[2rem] md:rounded-[2.5rem] focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm md:text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar p-1 xl:max-w-4xl">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 md:px-10 py-3 md:py-5 rounded-[1.8rem] md:rounded-[2.2rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-xl scale-105' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {filteredTests.length === 0 ? (
          <div className="col-span-full py-24 md:py-40 text-center glass-pro rounded-[3rem] md:rounded-[4rem] border-2 border-dashed border-slate-200">
            <FlaskConical className="w-16 h-16 md:w-20 md:h-20 text-slate-200 mx-auto mb-6 md:mb-8" />
            <p className="text-slate-400 font-black text-lg md:text-xl tracking-tight">No investigations match your query.</p>
          </div>
        ) : (
          filteredTests.map(test => {
            const isSelected = selectedIds.includes(test.id);
            return (
              <div key={test.id} className={`group bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 md:hover:-translate-y-3 transition-all duration-500 border border-slate-50 relative overflow-hidden ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}>
                <div className="absolute top-0 right-0 w-40 h-40 md:w-48 md:h-48 bg-rose-50 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000 opacity-40 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-10 md:mb-14 relative z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 text-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm">
                    <Zap className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1 md:mb-2">Investigative Fee</span>
                    <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter group-hover:text-rose-600 transition-colors">₹{test.price}</span>
                  </div>
                </div>

                <h3 className="font-heading text-2xl md:text-3xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1] relative z-10">{test.title}</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed mb-8 md:mb-12 h-12 md:h-16 overflow-hidden relative z-10">{test.description}</p>
                
                <div className="flex flex-wrap gap-2 md:gap-3 mb-10 md:mb-14 relative z-10">
                  {test.fastingRequired && (
                    <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-amber-100/50">
                      <Clock className="w-3 h-3 md:w-4 md:h-4" /> Fasting
                    </div>
                  )}
                  {test.isHomeCollectionAvailable && (
                    <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 md:px-5 py-2 md:py-3 rounded-lg md:rounded-xl border border-blue-100/50">
                      <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> Home Collection
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => onSelect(test)}
                  disabled={isSelected}
                  className={`w-full py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.2rem] font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em] flex items-center justify-center gap-3 md:gap-4 transition-all active:scale-95 shadow-lg md:shadow-xl ${isSelected ? 'bg-emerald-50 text-emerald-600 cursor-default shadow-none' : 'bg-slate-900 text-white hover:bg-rose-600 shadow-slate-100 hover:shadow-rose-200'}`}
                >
                  {isSelected ? (
                    <><CheckCircle className="w-4 h-4" /> Added to Cart</>
                  ) : (
                    <>Schedule Analysis <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TestSearch;