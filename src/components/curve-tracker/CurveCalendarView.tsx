import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface CurveUpdate {
  curveId: number;
  markType: string;
  markCase: string;
  location: string;
  market: string;
  expectedDate: Date;
  lastReceivedDate: Date | null;
  healthScore: number;
}

interface CurveCalendarViewProps {
  updates: CurveUpdate[];
  onUpdateSchedule: (curveId: number, newDate: Date) => Promise<void>;
}

const getEventColor = (healthScore: number): string => {
  if (healthScore >= 80) return '#22c55e'; // Green
  if (healthScore >= 60) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

const CurveCalendarView: React.FC<CurveCalendarViewProps> = ({ updates, onUpdateSchedule }) => {
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
    // Convert curve updates to calendar events
    const calendarEvents = updates.map(update => ({
      id: update.curveId.toString(),
      title: `${update.markType} - ${update.location}`,
      start: update.expectedDate,
      end: new Date(update.expectedDate.getTime() + 24 * 60 * 60 * 1000), // Add 1 day
      backgroundColor: getEventColor(update.healthScore),
      extendedProps: {
        markCase: update.markCase,
        market: update.market,
        lastUpdate: update.lastReceivedDate,
        healthScore: update.healthScore
      }
    }));
    setEvents(calendarEvents);
  }, [updates]);

  const handleEventDrop = async (info: any) => {
    const curveId = parseInt(info.event.id);
    const newDate = info.event.start;

    try {
      await onUpdateSchedule(curveId, newDate);
      toast.success('Update schedule changed successfully');
    } catch (error) {
      toast.error('Failed to update schedule');
      info.revert();
    }
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    const props = event.extendedProps;
    
    toast((t) => (
      <div className="p-4">
        <h3 className="font-bold">{event.title}</h3>
        <p>Market: {props.market}</p>
        <p>Case: {props.markCase}</p>
        <p>Health Score: {props.healthScore}%</p>
        <p>Expected: {format(event.start, 'MMM d, yyyy')}</p>
        {props.lastUpdate && (
          <p>Last Update: {format(new Date(props.lastUpdate), 'MMM d, yyyy')}</p>
        )}
      </div>
    ), {
      duration: 4000,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        events={events}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
      />
    </div>
  );
};

export default CurveCalendarView; 