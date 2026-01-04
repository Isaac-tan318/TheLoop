/**
 * Interest Tags Component
 * Reusable component for selecting interest tags
 */

import { useState } from 'react';
import {
  Box,
  Chip,
  TextField,
  Typography,
  Autocomplete,
  FormHelperText,
} from '@mui/material';
import { useInterests } from '../../context/InterestsContext';

const InterestTags = ({
  selected = [],
  onChange,
  label = 'Interests',
  error,
  helperText,
  maxSelections = 10,
  allowCreate = false,
}) => {
  const { interests, addInterest } = useInterests();
  const [inputValue, setInputValue] = useState('');

  const handleChange = (event, newValue) => {
    if (newValue.length <= maxSelections) {
      onChange(newValue);
    }
  };

  const handleAddNew = async (value) => {
    if (allowCreate && value && !interests.includes(value)) {
      await addInterest(value);
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
            handleAddNew(inputValue);
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
      {selected.length >= maxSelections && (
        <FormHelperText>
          Maximum {maxSelections} interests can be selected
        </FormHelperText>
      )}
    </Box>
  );
};

export default InterestTags;
