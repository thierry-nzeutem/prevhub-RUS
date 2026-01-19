'use client';

// ============================================
// PREV'HUB - Page Rapports
// Génération et gestion des rapports PDF
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FilePieChart,
  FileCheck,
  Users,
  ClipboardList,
  Wrench,
  ChevronRight,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type RapportType = 
  | 'visite' 
  | 'commission' 
  | 'prescription' 
  | 'verification' 
  | 'synthese_mensuelle'
  | 'synthese_groupement'
  | 'recap_hebdomadaire';

interface RapportTemplate {
  id: RapportType;
  label: string;
  description: string;
  icon: any;
  color: string;
}

// ============================================
// Configuration
// ============================================

const RAPPORT_TEMPLATES: RapportTemplate[] = [
  {
    id: 'visite',
    label: 'Rapport de visite',
    description: 'Compte-rendu détaillé d\'une visite de prévention',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'commission',
    label: 'Préparation commission',
    description: 'Dossier de préparation pour une commission de sécurité',
    icon: FileCheck,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'prescription',
    label: 'Suivi prescriptions',
    description: 'État des prescriptions d\'un établissement ou groupement',
    icon: ClipboardList,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'verification',
    label: 'Suivi vérifications',
    description: 'Tableau de bord des vérifications périodiques',
    icon: Wrench,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'synthese_mensuelle',
    label: 'Synthèse mensuelle',
    description: 'Bilan d\'activité du mois pour un client',
    icon: FilePieChart,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'synthese_groupement',
    label: 'Synthèse groupement',
    description: 'Vue consolidée d\'un groupement d\'établissements',
    icon: Users,
    color: 'bg-teal-100 text-teal-600',
  },
  {
    id: 'recap_hebdomadaire',
    label: 'Récap hebdomadaire',
    description: 'Résumé des actions de la semaine',
    icon: Calendar,
    color: 'bg-amber-100 text-amber-600',
  },
];

// ============================================
// Composants
// ============================================

function RapportTemplateCard({ 
  template, 
  onSelect 
}: { 
  template: RapportTemplate; 
  onSelect: () => void;
}) {
  const Icon = template.icon;

  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-sm transition-all text-left w-full"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', template.color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{template.label}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
    </button>
  );
}

function RapportHistoryItem({ rapport }: { rapport: any }) {
  const template = RAPPORT_TEMPLATES.find(t => t.id === rapport.type);
  const Icon = template?.icon || FileText;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', template?.color || 'bg-gray-100 text-gray-600')}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900">{rapport.titre}</h4>
        <p className="text-sm text-gray-500">
          {rapport.entite_nom} • {formatDate(rapport.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={rapport.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </a>
        <a
          href={rapport.url}
          download
          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ============================================
// Modal génération de rapport
// ============================================

function GenerateRapportModal({ 
  template, 
  onClose,
  onGenerate,
}: { 
  template: RapportTemplate;
  onClose: () => void;
  onGenerate: (params: any) => void;
}) {
  const [entiteType, setEntiteType] = useState<'etablissement' | 'groupement'>('etablissement');
  const [entiteId, setEntiteId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        type: template.id,
        entite_type: entiteType,
        entite_id: entiteId,
        date_debut: dateDebut,
        date_fin: dateFin,
      });
      onClose();
    } catch (error) {
      console.error('Erreur génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const Icon = template.icon;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', template.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{template.label}</h2>
            <p className="text-sm text-gray-500">{template.description}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Type d'entité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'entité
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEntiteType('etablissement')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  entiteType === 'etablissement'
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                Établissement
              </button>
              <button
                type="button"
                onClick={() => setEntiteType('groupement')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  entiteType === 'groupement'
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                Groupement
              </button>
            </div>
          </div>

          {/* Sélection de l'entité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entiteType === 'etablissement' ? 'Établissement' : 'Groupement'}
            </label>
            <select
              value={entiteId}
              onChange={(e) => setEntiteId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Sélectionner...</option>
              {/* Les options seraient chargées dynamiquement */}
            </select>
          </div>

          {/* Période (pour certains types de rapports) */}
          {['synthese_mensuelle', 'recap_hebdomadaire', 'prescription'].includes(template.id) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !entiteId}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Générer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function RapportsPage() {
  const { profile } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<RapportTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RapportType | 'all'>('all');

  // Simulation de données - à remplacer par un vrai hook
  const rapportsHistory: any[] = [
    {
      id: '1',
      type: 'visite',
      titre: 'Rapport de visite - Centre commercial Les Halles',
      entite_nom: 'Centre commercial Les Halles',
      url: '#',
      created_at: '2025-01-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'commission',
      titre: 'Préparation commission - Hôtel Mercure Meaux',
      entite_nom: 'Hôtel Mercure Meaux',
      url: '#',
      created_at: '2025-01-12T14:00:00Z',
    },
    {
      id: '3',
      type: 'synthese_mensuelle',
      titre: 'Synthèse mensuelle - Décembre 2024',
      entite_nom: 'Groupement Carrefour IDF',
      url: '#',
      created_at: '2025-01-05T09:00:00Z',
    },
  ];

  const handleGenerateRapport = async (params: any) => {
    // Appel API pour générer le rapport
    const response = await fetch('/api/rapports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Erreur génération rapport');
    }

    const result = await response.json();
    
    // Ouvrir le PDF dans un nouvel onglet
    if (result.url) {
      window.open(result.url, '_blank');
    }
  };

  const filteredHistory = rapportsHistory.filter(rapport => {
    if (filterType !== 'all' && rapport.type !== filterType) return false;
    if (searchQuery && !rapport.titre.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-gray-500 mt-1">
            Générez et gérez vos rapports PDF
          </p>
        </div>
      </div>

      {/* Nouveau rapport */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Générer un nouveau rapport
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RAPPORT_TEMPLATES.map((template) => (
            <RapportTemplateCard
              key={template.id}
              template={template}
              onSelect={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      </div>

      {/* Historique */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Historique des rapports
          </h2>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un rapport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RapportType | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Tous les types</option>
            {RAPPORT_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((rapport) => (
              <RapportHistoryItem key={rapport.id} rapport={rapport} />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Aucun rapport trouvé</p>
              <p className="text-sm text-gray-400 mt-1">
                Commencez par générer votre premier rapport
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal génération */}
      {selectedTemplate && (
        <GenerateRapportModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onGenerate={handleGenerateRapport}
        />
      )}
    </div>
  );
}
