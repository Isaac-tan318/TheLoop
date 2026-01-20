import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import EventCard from '../components/events/EventCard';
import * as eventsApi from '../api/events';
import { trackSearch } from '../api/analytics';
import { useAuth } from '../context/AuthContext';

const SearchPage = ({ eventsProps }) => {
  const { signUpForEvent, cancelSignup, isSignedUp, loading: eventsLoading = false } = eventsProps || {};
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));

  const performSearch = useCallback(
    async (term, { track = true } = {}) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await eventsApi.getAllEvents({ searchQuery: trimmed });
        if (response.success) {
          setResults(response.data);
          if (track && isAuthenticated) {
            trackSearch(trimmed);
          }
        } else {
          setError(response.error || 'Failed to fetch events.');
        }
      } catch (err) {
        setError('Something went wrong while searching.');
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, { track: false });
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [initialQuery, performSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
      await performSearch(trimmed);
    } else {
      setSearchParams({});
      setResults([]);
      setHasSearched(false);
      setError(null);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton
            aria-label="Go back"
            onClick={() => navigate(-1)}
            sx={{ border: '1px solid #e5e7eb', color: '#374151' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Search Events
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 4,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by title, description, or location"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ px: 4, py: 1.5, backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}
          >
            Search
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#dc2626' }} />
          </Box>
        ) : results.length > 0 ? (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Showing {results.length} result{results.length === 1 ? '' : 's'} for "{query.trim() || initialQuery}"
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              {results.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  signUpForEvent={signUpForEvent}
                  cancelSignup={cancelSignup}
                  isSignedUp={isSignedUp}
                  loading={eventsLoading}
                />
              ))}
            </Box>
          </>
        ) : hasSearched ? (
          <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography color="textSecondary">No events found. Try a different search term.</Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography color="textSecondary">
              Enter a keyword above to search our event catalog.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SearchPage;
