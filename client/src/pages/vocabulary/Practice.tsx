
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Box, 
  Button, 
  Typography,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import YouTubeEmbed from "../../components/YouTubeEmbed";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { ButtonGroupProps } from 'react-multi-carousel/lib/types';
import { WordListItem } from "../../types/common";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const responsive = {
  mobile: {
    breakpoint: { max: 3000, min: 0 },
    items: 1,
    slidesToSlide: 1
  }
};

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedWordList = [] } = location.state || {};

  const handleQuizButttonClick = () => {
    navigate('/voca/quiz', { state: { selectedWordList: selectedWordList } });
  };

  const ButtonGroup = ({ next, previous }: ButtonGroupProps) => {
    return (
      <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "1rem"}}>
        <Button 
          onClick={previous}
          variant="contained" 
          color="primary"
          sx={{ textTransform: "none", width: "25%" }}
        >
          Prev
        </Button>
        <Button
          onClick={next}
          variant="contained" 
          color="primary"
          sx={{ textTransform: "none", width: "25%" }}
        >
          Next
        </Button>
      </Box>
    );
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
        to="/voca/wordlist"
        aria-label="back"
        sx={{ position: "absolute", top: "0rem", left: "0.5rem" }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h1" color="primary" sx={{ fontSize: "2rem", fontWeight: 900 }}>Practice</Typography>
      <Carousel 
        responsive={responsive}
        infinite={true}
        arrows={false}
        renderButtonGroupOutside={true}
        customButtonGroup={<ButtonGroup next={() => {}} previous={() => {}} />}
      >
        { selectedWordList.map((item: WordListItem) => (
          item.yt_embedId && (
            <Box key={item.id} sx={{ display: "flex", flexDirection: "column", gap: "1rem"}}>
              <Card>
                <CardContent>
                  <Typography variant="h3" sx={{ fontSize: "1.5rem" }}>
                    {item.sign}
                  </Typography>
                </CardContent>
              </Card>
              <YouTubeEmbed embedId={item.yt_embedId} />
            </Box>
          )
        ))}
      </Carousel>
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

