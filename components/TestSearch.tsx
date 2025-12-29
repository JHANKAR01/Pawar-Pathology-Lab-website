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
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-20 md:py-32 bg-white" id="directory">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 lg:gap-12 mb-16 md:mb-24">
        <div className="max-w-3xl">
          <span className="text-clinical-rose text-xs md:text-sm font-black uppercase tracking-[0.4em] md:tracking-[0.5em] mb-4 md:mb-6 block">Investigation Registry</span>
          <h2 className="font-heading text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6 md:mb-8">Laboratory <br /> <span className="text-clinical-rose">Diagnostics</span></h2>
          <p className="text-slate-600 text-base md:text-xl font-medium leading-relaxed max-w-2xl">Access our comprehensive catalog of molecular and clinical investigations overseen by MD pathology specialists.</p>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-6">
          <div className="flex -space-x-4">
            {[1,2,3,4,5].map(i => <div key={i} className="w-14 h-14 md:w-16 md:h-16 rounded-full border-4 border-white bg-clinical-rose-light flex items-center justify-center font-bold text-clinical-rose text-sm shadow-soft">P{i}</div>)}
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Accredited Processing Hub</p>
        </div>
      </div>

      <div className="sticky top-24 md:top-28 z-40 mb-16 md:mb-24">
        <div className="glass-pro p-4 md:p-5 rounded-3xl md:rounded-4xl shadow-large flex flex-col xl:flex-row gap-4 md:gap-5 border border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 md:w-6 md:h-6" />
            <input 
              type="text" 
              placeholder="Search by title, code or category..." 
              className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-5 md:py-6 bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl focus:ring-2 focus:ring-clinical-rose focus:border-clinical-rose outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400 text-sm md:text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar p-1 xl:max-w-4xl">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-clinical-rose text-white shadow-rose scale-105' 
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {filteredTests.length === 0 ? (
          <div className="col-span-full py-24 md:py-40 text-center bg-slate-50 rounded-4xl border-2 border-dashed border-slate-300">
            <FlaskConical className="w-20 h-20 md:w-24 md:h-24 text-slate-300 mx-auto mb-6 md:mb-8" />
            <p className="text-slate-500 font-black text-lg md:text-xl tracking-tight">No investigations match your query.</p>
          </div>
        ) : (
          filteredTests.map(test => {
            const isSelected = selectedIds.includes(test._id);
            return (
              <div key={test._id} className={`card-premium p-8 md:p-10 relative overflow-hidden ${isSelected ? 'ring-2 ring-success' : ''}`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-clinical-rose-light rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000 opacity-30 pointer-events-none" />
                
                <div className="flex justify-between items-start mb-8 md:mb-10 relative z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-clinical-rose-light text-clinical-rose rounded-2xl flex items-center justify-center transition-all duration-500 shadow-soft">
                    <Zap className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Fee</span>
                    <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">₹{test.price}</span>
                  </div>
                </div>

                <h3 className="font-heading text-2xl md:text-3xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight leading-[1.1] relative z-10">{test.title}</h3>
                <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-8 md:mb-10 h-16 md:h-20 overflow-hidden relative z-10">{test.description}</p>
                
                <button 
                  onClick={() => onSelect(test)}
                  disabled={isSelected}
                  className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    isSelected 
                      ? 'bg-success/10 text-success cursor-default border-2 border-success' 
                      : 'bg-clinical-rose text-white hover:bg-clinical-rose-dark shadow-rose hover:shadow-rose-lg'
                  }`}
                >
                  {isSelected ? (
                    <><CheckCircle className="w-5 h-5" /> Added to Cart</>
                  ) : (
                    <>Schedule Analysis <ChevronRight className="w-5 h-5" /></>
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