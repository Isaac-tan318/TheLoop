/**
 * Event Calendar Component
 * Full-featured calendar view of events
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
} from 'date-fns';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EventCalendar = ({ events = [], onEventClick }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      navigate(`/events/${event.id}`);
    }
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);
      
      // Check if the day falls within the event's date range
      return isWithinInterval(day, { start: eventStart, end: eventEnd }) ||
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd);
    });
  };

  const today = new Date();

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 200, textAlign: 'center' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Tooltip title="Go to today">
          <IconButton onClick={handleToday} sx={{ color: '#dc2626' }}>
            <TodayIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Weekday Headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEKDAYS.map((day) => (
          <Box key={day}>
            <Typography
              variant="subtitle2"
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#6b7280',
                py: 1,
              }}
            >
              {isMobile ? day.charAt(0) : day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #e5e7eb', borderRadius: 1 }}>
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);

          return (
            <Box
              key={day.toString()}
              sx={{
                minHeight: isMobile ? 60 : 100,
                borderRight: (index + 1) % 7 !== 0 ? '1px solid #e5e7eb' : 'none',
                borderBottom: index < calendarDays.length - 7 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: !isCurrentMonth ? '#f9fafb' : 'white',
                p: 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Day Number */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday ? 'bold' : 'normal',
                    color: !isCurrentMonth ? '#9ca3af' : isToday ? 'white' : 'inherit',
                    backgroundColor: isToday ? '#dc2626' : 'transparent',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 0.5,
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {/* Events */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                  {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
                    <Tooltip key={event.id} title={event.title} arrow>
                      <Chip
                        label={event.title}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        sx={{
                          width: '100%',
                          mb: 0.25,
                          height: 20,
                          fontSize: '0.65rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          cursor: 'pointer',
                          '& .MuiChip-label': {
                            px: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                          '&:hover': {
                            backgroundColor: '#b91c1c',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                  {dayEvents.length > (isMobile ? 1 : 2) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#6b7280',
                        fontSize: '0.6rem',
                        display: 'block',
                        textAlign: 'center',
                      }}
                    >
                      +{dayEvents.length - (isMobile ? 1 : 2)} more
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: '#dc2626',
              borderRadius: 0.5,
            }}
          />
          <Typography variant="caption" color="textSecondary">
            Event
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              backgroundColor: '#dc2626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
              {format(today, 'd')}
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary">
            Today
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EventCalendar;
