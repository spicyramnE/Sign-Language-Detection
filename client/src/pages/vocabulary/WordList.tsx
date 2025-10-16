import { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, Checkbox, FormControlLabel, Chip, Snackbar, IconButton } from '@mui/material';
import { useTheme, useMediaQuery } from "@mui/material";
import { useNavigate, Link } from 'react-router-dom';
import { WordListItem } from '../../types/common';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SERVER_ADDRESS = import.meta.env.VITE_SERVER_ADDRESS;
const API_URL = SERVER_ADDRESS + import.meta.env.VITE_VOCAB_API_CONTENTS
const MAX_WORD_NUM = import.meta.env.VITE_VOCAB_WORD_NUM;

const WordList: React.FC = () => {
  const navigate = useNavigate();
  const [wordList, setWordList] = useState<WordListItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchWordList = async () => {
      try{
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch vocabulary list");
        }
        const result: {[key: string] : WordListItem} = await response.json();
        const wordlist = Object.entries(result).map(([key, value]) => ({
          id: parseInt(key, 10),
          sign: value["sign"],
          yt_embedId: value["yt_embedId"],
        }));
        setWordList(wordlist);
      } catch (error) {
        console.error(error);
      }
    }
    fetchWordList();
  }, []);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedWords((prevSelectedWords) => {
      const newSelectedWords = new Set(prevSelectedWords);
      if (newSelectedWords.has(id)) {
        newSelectedWords.delete(id);
      } else {
        if (newSelectedWords.size < MAX_WORD_NUM) {
          newSelectedWords.add(id);
        } else {
          setSnackbarOpen(true);
        }
      }
      return newSelectedWords;
    });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handlePracticeButttonClick = () => {
    console.log(selectedWordList);
    navigate('/voca/practice', { state: { selectedWordList: selectedWordList } });
  };

  const handleDeleteChipClick = (id: number) => {
    setSelectedWords((prevSelectedWords) => {
      const newSelectedWords = new Set(prevSelectedWords);
      newSelectedWords.delete(id);
      return newSelectedWords;
    });
  };

  const filteredWordList = wordList.filter((item) =>
    item.sign.toLowerCase().includes(filter.toLowerCase())
  );

  const selectedWordList = wordList.filter((item) => 
    selectedWords.has(item.id)
  );

  return (
    <Box sx={{
      maxWidth: "600px", 
      margin: "1.5rem auto", 
      padding: "0 1rem", 
      textAlign: "center", 
      display: "flex", 
      flexDirection: "column", 
      gap: "1rem",
      position: "relative", }}
    >
      <IconButton 
        component={Link}
        to="/"
        aria-label="back"
        sx={{ position: "absolute", top: "0rem", left: "0.5rem" }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h1" color="primary" sx={{ fontSize: '2rem', fontWeight: 900 }}>Word List</Typography>
      
      {/* Section 1: Selected Words */}
      <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Typography variant="h6" color="textSecondary">Select up to {MAX_WORD_NUM} words and start practice</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-start' }}>
          {selectedWordList.map((item) => (
            <Chip 
              key={item.id}
              label={item.sign} 
              sx={{ backgroundColor: 'white', fontSize: "1rem", boxShadow: 3 }} 
              onDelete={() => handleDeleteChipClick(item.id)}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePracticeButttonClick}
            disabled={selectedWords.size === 0}
            sx={{ textTransform: "none", width: '25%' }}
          >
            Practice
          </Button>
        </Box>
      </Box>

      {/* Section 2: Word List */}
      <Box sx={{ marginTop: "1.5rem", textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Typography variant="h6" color="textSecondary">Word List</Typography>
        <TextField
          label="Filter"
          variant="outlined"
          value={filter}
          onChange={handleFilterChange}
          sx={{ width: '100%' }}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flexDirection: 'row', justifyContent: 'space-between'  }}>
          {filteredWordList.map((item) => (
            item.yt_embedId && (
              <Box key={item.id} sx={{ flex: `1 1 calc(${isMobile ? '50%' : '33.333%'} - 1rem)`, boxSizing: 'border-box' }}>
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      checked={selectedWords.has(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                    />
                  }
                  label={item.sign}
                  sx={{ marginLeft: 0, width: 'auto' }}
                />
              </Box>
          )))}
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={`You can select up to ${MAX_WORD_NUM} words.`}
      />
    </Box>
  );
};

export default WordList;