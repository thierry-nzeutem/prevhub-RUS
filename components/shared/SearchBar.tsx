'use client';

// ============================================
// PREV'HUB - Composant Recherche Avancée
// Barre de recherche avec filtres intelligents
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  Clock,
  Building2,
  Users,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Star,
  History,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type SearchScope = 'all' | 'etablissements' | 'groupements' | 'prescriptions' | 'visites' | 'commissions';

interface SearchResult {
  id: string;
  type: SearchScope;
  title: string;
  subtitle?: string;
  icon?: any;
  url: string;
  metadata?: Record<string, any>;
}

interface SearchBarProps {
  placeholder?: string;
  scope?: SearchScope;
  onScopeChange?: (scope: SearchScope) => void;
  className?: string;
  showFilters?: boolean;
  onSearch?: (query: string, scope: SearchScope) => void;
}

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
}

// ============================================
// Utilitaires
// ============================================

function getScopeIcon(scope: SearchScope) {
  switch (scope) {
    case 'etablissements':
      return Building2;
    case 'groupements':
      return Users;
    case 'prescriptions':
      return AlertTriangle;
    case 'visites':
      return Calendar;
    case 'commissions':
      return FileText;
    default:
      return Search;
  }
}

function getScopeLabel(scope: SearchScope): string {
  switch (scope) {
    case 'etablissements':
      return 'Établissements';
    case 'groupements':
      return 'Groupements';
    case 'prescriptions':
      return 'Prescriptions';
    case 'visites':
      return 'Visites';
    case 'commissions':
      return 'Commissions';
    default:
      return 'Tout';
  }
}

function getScopeColor(scope: SearchScope): string {
  switch (scope) {
    case 'etablissements':
      return 'text-blue-600 bg-blue-100';
    case 'groupements':
      return 'text-purple-600 bg-purple-100';
    case 'prescriptions':
      return 'text-orange-600 bg-orange-100';
    case 'visites':
      return 'text-green-600 bg-green-100';
    case 'commissions':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// ============================================
// Composant Principal
// ============================================

export function SearchBar({
  placeholder = 'Rechercher...',
  scope = 'all',
  onScopeChange,
  className,
  showFilters = true,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showScopeSelector, setShowScopeSelector] = useState(false);

  // Charger les recherches récentes
  useEffect(() => {
    const stored = localStorage.getItem('prevhub_recent_searches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Sauvegarder une recherche récente
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('prevhub_recent_searches', JSON.stringify(updated));
  };

  // Recherche avec debounce
  const searchDebounced = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);

      try {
        // Appel API de recherche
        const params = new URLSearchParams({
          q: searchQuery,
          scope: scope,
          limit: '10',
        });

        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Erreur recherche:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [scope]
  );

  // Effect pour le debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchDebounced(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchDebounced]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowScopeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourci clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      onSearch?.(query, scope);
      router.push(`/search?q=${encodeURIComponent(query)}&scope=${scope}`);
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    searchDebounced(recentQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('prevhub_recent_searches');
  };

  const scopes: SearchScope[] = ['all', 'etablissements', 'groupements', 'prescriptions', 'visites', 'commissions'];

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl transition-all',
            isFocused ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'
          )}
        >
          {/* Sélecteur de scope */}
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowScopeSelector(!showScopeSelector)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-colors',
                getScopeColor(scope)
              )}
            >
              {(() => {
                const Icon = getScopeIcon(scope);
                return <Icon className="w-4 h-4" />;
              })()}
              <span className="hidden sm:inline">{getScopeLabel(scope)}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* Input */}
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setIsFocused(true);
                setIsOpen(true);
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="flex-1 outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Actions */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {isLoading && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}

          {/* Raccourci clavier */}
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
          {/* Sélecteur de scope */}
          {showScopeSelector && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {scopes.map((s) => {
                  const Icon = getScopeIcon(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        onScopeChange?.(s);
                        setShowScopeSelector(false);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        scope === s ? getScopeColor(s) : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {getScopeLabel(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Résultats */}
          {results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => {
                const Icon = getScopeIcon(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', getScopeColor(result.type))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Recherches récentes */}
          {!query && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500 uppercase">Recherches récentes</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Effacer
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{recent}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {query && results.length === 0 && !isLoading && (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aucun résultat pour "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Essayez avec d'autres termes</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Composant Filtres avancés
// ============================================

export function SearchFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres avancés
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Période */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateDebut || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateDebut: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <input
                type="date"
                value={filters.dateFin || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFin: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Catégorie ERP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie ERP</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    const categories = filters.categories || [];
                    const newCategories = categories.includes(cat)
                      ? categories.filter((c: number) => c !== cat)
                      : [...categories, cat];
                    onFiltersChange({ ...filters, categories: newCategories });
                  }}
                  className={cn(
                    'w-10 h-10 rounded-lg font-bold transition-colors',
                    (filters.categories || []).includes(cat)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
            <input
              type="text"
              placeholder="ex: 77, 75, 93..."
              value={filters.departement || ''}
              onChange={(e) => onFiltersChange({ ...filters, departement: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-100">
          <button
            onClick={() => onFiltersChange({})}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default SearchBar;
