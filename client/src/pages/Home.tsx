import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <Box sx={{maxWidth: "600px", margin: "1.5rem auto", padding: "0 1rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Box
        component="img"
        src="/images/logo.png"
        alt="ASL logo"
        sx={{width: "80%", height: "auto", display: "block", margin: "0 auto"}}
      />
      <Box>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ textTransform: "none", width: "40%" }} 
          component={Link}
          to="/fs/practice"
        >
          Finger Spelling
        </Button>
      </Box>
      <Box>
        <Button 
          variant="contained" 
          color="primary"
          sx={{ textTransform: "none", width: "40%" }} 
          component={Link}
          to="/voca/wordlist"
        >
          Basic Vocabulary
        </Button>
      </Box>
    </Box>
  )
}

export default Home;