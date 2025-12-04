/**
 * Centre de Notifications
 * Affiche les notifications importantes (échéances, rappels, etc.)
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, Calendar } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'deadline';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationCenterProps {
  companyId?: string;
}

export function NotificationCenter({ companyId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger les notifications
  useEffect(() => {
    if (companyId) {
      loadNotifications();
    }
  }, [companyId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Simuler des notifications (à remplacer par un vrai appel API)
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'warning',
          title: 'TVA Trimestrielle',
          message: 'Déclaration de TVA à faire avant le 30 novembre',
          date: new Date('2024-11-25'),
          read: false,
        },
        {
          id: '2',
          type: 'deadline',
          title: 'Facture à payer',
          message: 'Facture #1234 - Échéance dans 3 jours',
          date: new Date('2024-11-23'),
          read: false,
        },
        {
          id: '3',
          type: 'info',
          title: 'Nouvelle fonctionnalité',
          message: 'Découvrez la vue calendrier pour vos échéances',
          date: new Date('2024-11-20'),
          read: true,
        },
        {
          id: '4',
          type: 'success',
          title: 'Analyse terminée',
          message: 'Toutes vos factures ont été analysées avec succès',
          date: new Date('2024-11-22'),
          read: true,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'deadline':
        return <Calendar className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'deadline': return 'bg-red-50 border-red-200';
      case 'info':
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative">
      {/* Bouton Cloche */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notifications */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500">{unreadCount} non lues</p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-3">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notif.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            {new Intl.DateTimeFormat('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).format(notif.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // TODO: Rediriger vers page notifications complète
                  }}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  Voir toutes les notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

