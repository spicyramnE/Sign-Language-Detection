import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { WordListItem } from '../types/common';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const QuizResult: React.FC = () => {
  const location = useLocation();
  const { selectedWordList = [] } = location.state || {};

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
      <Typography variant="h1" color="primary" sx={{ fontSize: "2rem", fontWeight: 900 }}>Quiz results:</Typography>
      <List sx={{ width: "70%", margin: "0 auto" }}>
        {selectedWordList.map((item: WordListItem, index: number) => (
          <ListItem key={index} sx={{ gap: '0.5rem' }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              {item.isCorrect ? (
                <CheckCircleIcon sx={{ color: "success.main", fontSize: '2rem' }} />
              ) : (
                <CancelIcon sx={{ color: "error.main", fontSize: '2rem' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: '1.5rem', color: item.isCorrect ? "success.main" : "error.main", textAlign: "center" }}>
                  <strong>{item.sign}</strong>
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", justifyContent: "center"}}>
        {/* <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/wordlist"
          sx={{ textTransform: "none", width: "25%" }}
        >
          Try again
        </Button> */}
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
          sx={{ textTransform: "none", width: "25%" }}
        >
          Home
        </Button>
      </Box>
    </Box>
  );
}

export default QuizResult;