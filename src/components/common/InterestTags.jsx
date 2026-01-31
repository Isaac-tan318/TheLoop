// Interest Tags Component
// Reusable component for selecting interest tags

import { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Typography,
  Autocomplete,
  FormHelperText,
  Button,
} from '@mui/material';

const InterestTags = ({
  selected = [],
  onChange,
  interests = [],
  label = 'Interests',
  error,
  helperText,
  maxSelections = 10,
  allowCreate = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleChange = (event, newValue) => {
    if (newValue.length <= maxSelections) {
      onChange(newValue);
    }
  };

  return (
    <Box>
      <Autocomplete
        multiple
        options={interests}
        value={selected}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        freeSolo={allowCreate}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && allowCreate && inputValue) {
            event.preventDefault();
            if (!selected.includes(inputValue)) {
              onChange([...selected, inputValue]);
            }
            setInputValue('');
          }
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option}
                {...tagProps}
                sx={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  '& .MuiChip-deleteIcon': {
                    color: 'white',
                    '&:hover': { color: '#fecaca' },
                  },
                }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={selected.length < maxSelections ? 'Select interests...' : ''}
            error={error}
            helperText={helperText}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#dc2626',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#dc2626',
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...restProps } = props;
          return (
            <li key={key} {...restProps}>
              <Chip
                label={option}
                size="small"
                sx={{
                  backgroundColor: selected.includes(option) ? '#dc2626' : '#f3f4f6',
                  color: selected.includes(option) ? 'white' : 'black',
                  mr: 1,
                }}
              />
              {option}
            </li>
          );
        }}
      />
      {allowCreate && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="contained"
            size="small"
            disabled={
              !inputValue ||
              selected.includes(inputValue) ||
              selected.length >= maxSelections
            }
            onClick={() => {
              if (!selected.includes(inputValue) && inputValue) {
                onChange([...selected, inputValue]);
                setInputValue('');
              }
            }}
            sx={{
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' },
            }}
          >
            Add Interest
          </Button>
        </Box>
      )}
      {selected.length >= maxSelections && (
        <FormHelperText>
          Maximum {maxSelections} interests can be selected
        </FormHelperText>
      )}
    </Box>
  );
};

export default InterestTags;
