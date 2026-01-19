'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface KPIData {
  visitesMois: number;
  visitesProgression: number;
  prescriptionsUrgentes: number;
  prescriptionsProgression: number;
  verificationsRetard: number;
  verificationsProgression: number;
  prescriptionsLevees: number;
  leveesProgression: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  etablissement: string;
  meta: string;
  status: string;
  statusColor: string;
}

interface VisitePlanning {
  id: string;
  heure: string;
  periode: string;
  etablissement: string;
  adresse: string;
  trajet: string;
  types: string;
  categorie: string;
  badges: { text: string; color: string }[];
  isToday: boolean;
}

interface Activity {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}

export default function DashboardHome() {
  const [kpiData, setKpiData] = useState<KPIData>({
    visitesMois: 18,
    visitesProgression: 12,
    prescriptionsUrgentes: 27,
    prescriptionsProgression: 3,
    verificationsRetard: 12,
    verificationsProgression: -8,
    prescriptionsLevees: 156,
    leveesProgression: 24,
  });

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      icon: '🔥',
      title: 'Éclairage sécurité défaillant',
      description: 'E. Leclerc Villeparisis - Sortie Est',
      etablissement: 'E. Leclerc Villeparisis',
      meta: '12 jours restants',
      status: 'Urgent',
      statusColor: '#E53E3E',
    },
    {
      id: '2',
      type: 'warning',
      icon: '📅',
      title: 'Commission dans 45 jours',
      description: 'Grand Parc Bât 4 - 12 prescriptions en cours',
      etablissement: 'Grand Parc',
      meta: 'La Francheville',
      status: 'À préparer',
      statusColor: '#DD6B20',
    },
    {
      id: '3',
      type: 'warning',
      icon: '⚡',
      title: 'Vérification électrique',
      description: 'Woodshop - Dernière vérif +3 ans',
      etablissement: 'Woodshop',
      meta: 'Cesson',
      status: 'En retard',
      statusColor: '#DD6B20',
    },
  ]);

  const [planning, setPlanning] = useState<VisitePlanning[]>([
    {
      id: '1',
      heure: '14:30',
      periode: "Aujourd'hui",
      etablissement: '🏢 E. Leclerc - Villeparisis',
      adresse: 'Centre Commercial Bellecour',
      trajet: '25min trajet',
      types: 'Types M, N, O',
      categorie: '2ème catégorie',
      badges: [
        { text: 'Types M, N, O', color: '#EBF4FF' },
        { text: '2ème catégorie', color: '#F0FFF4' },
        { text: '✅ Matériel OK', color: '#F0FFF4' },
      ],
      isToday: true,
    },
    {
      id: '2',
      heure: '16:00',
      periode: "Aujourd'hui",
      etablissement: '🏪 Shopping Part-Dieu',
      adresse: 'Lyon Part-Dieu',
      trajet: '15min depuis précédente visite',
      types: 'Type M',
      categorie: '3ème catégorie',
      badges: [
        { text: 'Type M', color: '#EBF4FF' },
        { text: '3ème catégorie', color: '#F0FFF4' },
        { text: '📋 Planifiée', color: '#EBF4FF' },
      ],
      isToday: true,
    },
    {
      id: '3',
      heure: '17:30',
      periode: "Aujourd'hui",
      etablissement: '🛍️ Retail Park Confluence',
      adresse: 'Lyon Confluence',
      trajet: '20min depuis Part-Dieu',
      types: 'Types O, N',
      categorie: '3ème catégorie',
      badges: [
        { text: 'Types O, N', color: '#EBF4FF' },
        { text: '3ème catégorie', color: '#F0FFF4' },
        { text: '📋 Planifiée', color: '#EBF4FF' },
      ],
      isToday: true,
    },
    {
      id: '4',
      heure: '10:00',
      periode: 'Lundi',
      etablissement: '🏗️ Grand Parc Bât 4',
      adresse: 'La Francheville',
      trajet: 'Préparation commission',
      types: 'Types M, N',
      categorie: '',
      badges: [{ text: 'Types M, N', color: '#EBF4FF' }],
      isToday: false,
    },
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      icon: '✅',
      iconBg: '#F0FFF4',
      iconColor: '#38A169',
      title: 'Prescription levée',
      description: 'Extincteur CO2 remplacé - Shopping Promenade',
      time: 'Il y a 2 heures',
    },
    {
      id: '2',
      icon: '📄',
      iconBg: '#EBF4FF',
      iconColor: '#3182CE',
      title: 'Rapport généré',
      description: 'Visite Woodshop - 9 observations créées',
      time: 'Il y a 5 heures',
    },
    {
      id: '3',
      icon: '📧',
      iconBg: '#FFFAF0',
      iconColor: '#DD6B20',
      title: 'Relance envoyée',
      description: 'Vérification éclairage - E. Leclerc Villeparisis',
      time: 'Hier à 16:30',
    },
    {
      id: '4',
      icon: '🤖',
      iconBg: '#F0FFF4',
      iconColor: '#38A169',
      title: 'Attribution IA validée',
      description: "ÉLEC'SÉCU Pro assigné (confiance 95%)",
      time: 'Hier à 14:20',
    },
    {
      id: '5',
      icon: '📅',
      iconBg: '#EBF4FF',
      iconColor: '#3182CE',
      title: 'Commission planifiée',
      description: 'Grand Parc Bât 4 - Avril 2025',
      time: 'Hier à 11:00',
    },
  ]);

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">
            PREV'<span className="text-[#FF8C00]">HUB</span>
          </div>

          <div className="flex-1 max-w-[500px] mx-10 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un établissement, groupement, prescription..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition text-lg">
              ⚠️
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                7
              </span>
            </button>
            <button className="relative w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition text-lg">
              💬
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <button className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition text-lg">
              🔔
            </button>

            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-bold text-sm">
                TN
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-gray-800">Thierry Nzeutem</div>
                <div className="text-xs text-gray-600">RUS Principal</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bonjour Thierry 👋</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span>📅 {currentDate}</span>
                <span>•</span>
                <span>🌡️ 14°C à Serris</span>
                <span>•</span>
                <span>📍 9 établissements actifs</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition shadow-sm flex items-center gap-2">
                ➕ Nouvelle visite
              </button>
              <button className="px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                📊 Rapports
              </button>
              <button className="px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition">
                📋 Planning
              </button>
            </div>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#3182CE] hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">📅</div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md flex items-center gap-1">
                ↗ +{kpiData.visitesProgression}%
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{kpiData.visitesMois}</div>
            <div className="text-sm text-gray-600 mb-3">Visites ce mois</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#3182CE] rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#E53E3E] hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
              <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-md flex items-center gap-1">
                ↗ +{kpiData.prescriptionsProgression}
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{kpiData.prescriptionsUrgentes}</div>
            <div className="text-sm text-gray-600 mb-3">Prescriptions urgentes</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#E53E3E] rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#DD6B20] hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-2xl">🔔</div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md flex items-center gap-1">
                ↘ {kpiData.verificationsProgression}
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{kpiData.verificationsRetard}</div>
            <div className="text-sm text-gray-600 mb-3">Vérifications en retard</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#DD6B20] rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-[#38A169] hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">✅</div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md flex items-center gap-1">
                ↗ +{kpiData.leveesProgression}%
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-1">{kpiData.prescriptionsLevees}</div>
            <div className="text-sm text-gray-600 mb-3">Prescriptions levées</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#38A169] rounded-full" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>

        {/* Urgent Alerts */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🚨 Alertes prioritaires
            </h2>
            <a href="#" className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Voir tout (7) →
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 cursor-pointer hover:translate-x-1 transition ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-500'
                    : alert.type === 'warning'
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{alert.icon}</span>
                  <h3 className="font-bold text-sm text-gray-900">{alert.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>⏰ {alert.meta}</span>
                  <span className="font-semibold" style={{ color: alert.statusColor }}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid - Planning & Activity */}
        <div className="grid grid-cols-[2fr_1fr] gap-6 mb-8">
          {/* Planning Widget */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">📋 Planning de la semaine</h2>
              <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">
                Planning complet →
              </a>
            </div>

            <div className="flex gap-2 border-b-2 border-gray-200 mb-5">
              <button className="px-4 py-2.5 font-semibold text-[#FF8C00] border-b-3 border-[#FF8C00] -mb-0.5 text-sm">
                Aujourd'hui (3)
              </button>
              <button className="px-4 py-2.5 font-semibold text-gray-600 hover:text-gray-800 text-sm">
                Semaine (12)
              </button>
              <button className="px-4 py-2.5 font-semibold text-gray-600 hover:text-gray-800 text-sm">
                Mois (48)
              </button>
            </div>

            <div className="space-y-4">
              {planning.map((visite) => (
                <div
                  key={visite.id}
                  className={`flex gap-4 p-4 rounded-lg hover:bg-gray-100 transition cursor-pointer ${
                    visite.isToday ? 'bg-gray-50' : 'opacity-60'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center w-[70px] flex-shrink-0 bg-white rounded-lg p-2 border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{visite.heure}</div>
                    <div className="text-xs text-gray-600">{visite.periode}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{visite.etablissement}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {visite.adresse} • 🚗 {visite.trajet}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {visite.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-semibold rounded-md"
                          style={{
                            background: badge.color,
                            color: badge.color === '#EBF4FF' ? '#3182CE' : '#38A169',
                          }}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">🔔 Activité récente</h2>
              <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">
                Tout voir →
              </a>
            </div>

            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div
                  key={activity.id}
                  className={`flex gap-3 ${idx !== activities.length - 1 ? 'pb-4 border-b border-gray-200' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: activity.iconBg, color: activity.iconColor }}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 mb-1">
                      <strong>{activity.title}</strong>
                      <br />
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Access Modules */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 mb-5">🚀 Accès rapides</h2>
        </div>

        <div className="grid grid-cols-4 gap-5">
          <Link
            href="/groupements"
            className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1"
          >
            <span className="text-4xl block mb-4">🏢</span>
            <h3 className="font-bold text-gray-900 mb-2">Groupements & ERP</h3>
            <p className="text-sm text-gray-600">28 établissements • 4 groupements</p>
          </Link>

          <Link
            href="/prescriptions"
            className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1"
          >
            <span className="text-4xl block mb-4">⚠️</span>
            <h3 className="font-bold text-gray-900 mb-2">Prescriptions</h3>
            <p className="text-sm text-gray-600">27 urgentes • 156 en cours</p>
          </Link>

          <Link
            href="/commissions"
            className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1"
          >
            <span className="text-4xl block mb-4">⚖️</span>
            <h3 className="font-bold text-gray-900 mb-2">Commissions & Arrêtés</h3>
            <p className="text-sm text-gray-600">47 commissions • 12 arrêtés</p>
          </Link>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">✅</span>
            <h3 className="font-bold text-gray-900 mb-2">Vérifications</h3>
            <p className="text-sm text-gray-600">12 en retard • 45 à prévoir</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">📝</span>
            <h3 className="font-bold text-gray-900 mb-2">Observations</h3>
            <p className="text-sm text-gray-600">87 actives • 234 résolues</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">📄</span>
            <h3 className="font-bold text-gray-900 mb-2">Contrats</h3>
            <p className="text-sm text-gray-600">3 clients actifs</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">🤖</span>
            <h3 className="font-bold text-gray-900 mb-2">IA & Automatisation</h3>
            <p className="text-sm text-gray-600">95% précision attribution</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">👥</span>
            <h3 className="font-bold text-gray-900 mb-2">Contacts</h3>
            <p className="text-sm text-gray-600">47 contacts • 18 sociétés</p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer hover:-translate-y-1">
            <span className="text-4xl block mb-4">📊</span>
            <h3 className="font-bold text-gray-900 mb-2">Analyses & Stats</h3>
            <p className="text-sm text-gray-600">Tableaux de bord avancés</p>
          </div>
        </div>
      </main>
    </div>
  );
}
