import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Zap, Thermometer } from 'lucide-react';
import { AreaSearchResult } from '../../types/nowcast';

interface SearchBarProps {
  onSelectArea: (lat: number, lon: number, label: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectArea,
  className = '',
  placeholder = 'Search area, suburb, city in India...'
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<AreaSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/nowcast/search?query=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal
      })
        .then((res) => {
          if (!res.ok) throw new Error('Search failed');
          return res.json();
        })
        .then((data: AreaSearchResult[]) => {
          setResults(data);
          setIsOpen(true);
          setSelectedIndex(-1);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Search error:', err);
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = useCallback((item: AreaSearchResult) => {
    setQuery(item.name || item.display_name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectArea(item.lat, item.lon, item.display_name || item.name);
  }, [onSelectArea]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative font-sans text-xs ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/40 rounded-lg transition-all shadow-inner">
        <div className="pl-2.5 pr-1.5 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent py-1.5 pr-7 text-slate-100 placeholder-slate-400 font-mono text-xs focus:outline-none tracking-wide"
        />

        {/* Right action: Loading spinner or Clear button */}
        <div className="absolute right-2 flex items-center">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={clearSearch}
              className="p-0.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Autocomplete Dropdown - Wide and Clear */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[340px] sm:w-[420px] md:w-[460px] max-w-[92vw] bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80 max-h-84 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {results.length > 0 ? (
            <>
              <div className="px-3.5 py-2 bg-slate-950/90 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
                <span>Matching Areas & Suburbs</span>
                <span className="text-cyan-400 font-bold">{results.length} found</span>
              </div>
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const hasStorm = item.impact_status === 'ACTIVE_NOW' || item.condition?.toLowerCase().includes('thunder');

                return (
                  <button
                    key={`${item.lat}-${item.lon}-${idx}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between space-x-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 text-cyan-100'
                        : 'hover:bg-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {hasStorm ? (
                          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        ) : (
                          <MapPin className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-white truncate">
                            {item.name}
                          </span>
                          {item.is_monitored_station && (
                            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] px-1.5 py-0.2 rounded font-mono font-medium flex-shrink-0">
                              Live Stn
                            </span>
                          )}
                          {hasStorm && (
                            <span className="bg-red-950 text-red-300 border border-red-800 text-[9px] px-1.5 py-0.2 rounded font-mono font-medium animate-pulse flex-shrink-0">
                              ⚡ Active
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.district && item.district !== item.name ? `${item.district}, ` : ''}
                          {item.state}
                        </div>

                        {item.condition && (
                          <div className="text-[10px] text-cyan-300/90 font-mono mt-0.5 flex items-center space-x-1.5">
                            <span>{item.condition}</span>
                            {item.humidity_pct !== undefined && (
                              <span className="text-slate-400">• RH {item.humidity_pct}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side real-time data */}
                    <div className="text-right flex flex-col items-end flex-shrink-0 font-mono text-[10px] text-slate-400 pl-2">
                      {item.temp_c !== undefined ? (
                        <span className="text-amber-300 font-bold text-xs flex items-center bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/80">
                          <Thermometer className="w-3 h-3 mr-0.5 text-amber-400" />
                          {item.temp_c}°C
                        </span>
                      ) : (
                        <span>{item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°</span>
                      )}
                      {item.eta_time_ist ? (
                        <span className="text-cyan-300 text-[9px] mt-1 font-semibold">
                          ETA {item.eta_time_ist}
                        </span>
                      ) : item.wind_kmh !== undefined ? (
                        <span className="text-slate-400 text-[9px] mt-1">
                          💨 {item.wind_kmh} km/h
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </>
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-slate-400 font-mono text-xs">
              <p>No matches found for <span className="text-slate-200 font-bold">"{query}"</span></p>
              <p className="text-[11px] text-slate-500 mt-1">Try another town, suburb name, or click directly on the map.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
