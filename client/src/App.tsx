import Home from './pages/Home'
import VocaWordList from './pages/vocabulary/WordList'
import VocaPractice from './pages/vocabulary/Practice'
import VocabQuiz from './pages/vocabulary/Quiz'
import QuizResult from './pages/QuizResult'
import FSPractice from './pages/finger_spelling/Practice'
import FSQuiz from './pages/finger_spelling/Quiz'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    primary: {
      main: '#217178',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f57c00',
      contrastText: '#ffffff', 
    },
    success: {
      main: '#388e3c',
      contrastText: '#ffffff', 
    },
    error: {
      main: '#d32f2f',
      contrastText: '#ffffff', 
    },
    warning: {
      main: '#ffa000',
      contrastText: '#000000',
    },
    info: {
      main: '#8e24aa',
      contrastText: '#ffffff', 
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#3c4043',
      secondary: '#3c4043',
    }
  },
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/voca/wordlist" element={<VocaWordList />} />
      <Route path="/voca/practice" element={<VocaPractice />} />
      <Route path="/voca/quiz" element={<VocabQuiz />} />
      <Route path="/fs/practice" element={<FSPractice />} />
      <Route path="/fs/quiz" element={<FSQuiz />} />
      <Route path="/quiz-result" element={<QuizResult />} />
    </>
  )
);

const App: React.FC = () => {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </>
  );
}

export default App
