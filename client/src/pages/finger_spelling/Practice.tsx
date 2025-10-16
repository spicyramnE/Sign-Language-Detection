
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box, 
  Button, 
  Typography,
  IconButton,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
} from "@mui/material";
import YouTubeEmbedWithStartEnd from "../../components/YouTubeEmbedWithStartEnd";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FingerSpellingYTData } from "../../types/common";

const SERVER_ADDRESS = import.meta.env.VITE_SERVER_ADDRESS;
const API_URL = SERVER_ADDRESS + import.meta.env.VITE_FS_API_CONTENTS;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [fsYTData, setFsYTData] = useState<FingerSpellingYTData>({ 
    yt_embedId: "", start_time: { front: {}, side: {} } 
  });
  const [startTime, setStartTime] = useState(fsYTData.start_time.front.A);
  const [uniqueParam, setUniqueParam] = useState(`&t=${Date.now()}`);
  const [view, setView] = useState<"front" | "side">("front");

  useEffect(() => {
    const fetchYTData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch finger spelling list");
        }
        const result: FingerSpellingYTData = await response.json();
        setFsYTData(result);
      } catch (error) {
        console.error(error);
      }
    };
    fetchYTData();
  }, []);

  const handleQuizButttonClick = () => {
    navigate('/fs/quiz', { state: {} });
  };

  const handleAlphabetButtonClick = (index: number) => {
    const letter = String.fromCharCode(65 + index) as keyof typeof fsYTData.start_time.front;
    const newStartTime = fsYTData.start_time[view][letter];
    setUniqueParam(`&t=${Date.now()}`);
    setStartTime(newStartTime);
  };

  const handleViewChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setView(event.target.value as "front" | "side");
  };

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
      <Typography variant="h1" color="primary" sx={{ fontSize: "2rem", fontWeight: 900 }}>Practice</Typography>
      <YouTubeEmbedWithStartEnd embedId={fsYTData.yt_embedId} startTime={startTime} uniqueParam={uniqueParam}/>
      <FormControl component="fieldset">
        <RadioGroup 
          row
          aria-label="view" 
          name="view" 
          value={view} 
          onChange={handleViewChange} 
          sx={{ justifyContent: "center", color: "text.secondary" }}
        >
          <FormControlLabel value="front" control={<Radio />} label="Front View" />
          <FormControlLabel value="side" control={<Radio />} label="Side View" />
        </RadioGroup>
      </FormControl>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
        {Array.from({ length: 26 }, (_, i) => (
          <Button
            key={i}
            variant="outlined"
            color="primary"
            onClick={() => handleAlphabetButtonClick(i)}
            sx={{ 
              width: "50px", 
              height: "50px", 
              textTransform: "none",
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              }, 
            }}
          >
            {String.fromCharCode(65 + i)}
          </Button>
        ))}
      </Box>
      <Typography variant="h6" color="textSecondary">When you are ready, try the quiz!</Typography>
      <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", justifyContent: "center"}}>
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleQuizButttonClick}
          sx={{ textTransform: "none", width: "25%" }}
        >
          Quiz
        </Button>
      </Box>
    </Box>
  )
};

export default Practice;

