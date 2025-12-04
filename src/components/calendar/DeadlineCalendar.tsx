/**
 * Calendrier des Échéances
 * Affiche les factures à payer/recevoir et les événements fiscaux
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'invoice-pay' | 'invoice-receive' | 'tax' | 'deadline';
  amount?: number;
  description?: string;
}

interface DeadlineCalendarProps {
  companyId: string;
  events?: CalendarEvent[];
}

export function DeadlineCalendar({ companyId, events = [] }: DeadlineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Obtenir le premier jour du mois
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Obtenir le nombre de jours dans le mois
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Obtenir le jour de la semaine du premier jour (0 = Dimanche, 1 = Lundi, etc.)
  const getStartDayOfMonth = (date: Date) => {
    const day = getFirstDayOfMonth(date).getDay();
    // Convertir pour avoir Lundi = 0
    return day === 0 ? 6 : day - 1;
  };

  const firstDay = getFirstDayOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getStartDayOfMonth(currentDate);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Vérifier si une date a des événements
  const getEventsForDate = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => 
      event.date.getDate() === day &&
      event.date.getMonth() === currentDate.getMonth() &&
      event.date.getFullYear() === currentDate.getFullYear()
    );
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Couleur de l'événement selon le type
  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'invoice-pay': return 'bg-red-500';
      case 'invoice-receive': return 'bg-green-500';
      case 'tax': return 'bg-yellow-500';
      case 'deadline': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'invoice-pay': return '💸';
      case 'invoice-receive': return '💰';
      case 'tax': return '🏛️';
      case 'deadline': return '📅';
      default: return '📌';
    }
  };

  // Générer les jours du calendrier
  const calendarDays = [];
  
  // Jours vides avant le début du mois
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg" />);
  }

  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDate(day);
    const isCurrentDay = isToday(day);

    calendarDays.push(
      <div
        key={day}
        className={`h-24 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
          isCurrentDay
            ? 'bg-primary-50 border-primary-500 font-bold'
            : 'bg-white border-gray-200 hover:border-primary-300'
        }`}
        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
      >
        <div className="p-2 h-full flex flex-col">
          <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? 'text-primary-600' : 'text-gray-700'}`}>
            {day}
          </div>
          
          <div className="flex-1 overflow-hidden space-y-1">
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div
                key={idx}
                className={`text-xs px-2 py-1 rounded text-white truncate ${getEventColor(event.type)}`}
                title={event.title}
              >
                {getEventIcon(event.type)} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 px-2">
                +{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {monthName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {events.length} événement{events.length > 1 ? 's' : ''} ce mois
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <button className="ml-2 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-gray-600">À payer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-gray-600">À recevoir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-gray-600">Fiscal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-gray-600">Échéance</span>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays}
      </div>

      {/* Détails du jour sélectionné */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">
            📅 {selectedDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          
          {getEventsForDate(selectedDate.getDate()).length === 0 ? (
            <p className="text-sm text-gray-500">Aucun événement ce jour</p>
          ) : (
            <div className="space-y-2">
              {getEventsForDate(selectedDate.getDate()).map(event => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {getEventIcon(event.type)} {event.title}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      )}
                    </div>
                    {event.amount && (
                      <span className="text-sm font-bold text-gray-900">
                        {event.amount.toLocaleString('fr-FR', { 
                          style: 'currency', 
                          currency: 'EUR' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

