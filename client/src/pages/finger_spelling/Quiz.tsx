import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Backdrop,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Card,
  Button,
} from "@mui/material";
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { useTheme } from '@mui/material/styles';
import { WordListItem, PredictState } from '../../types/common';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StopIcon from '@mui/icons-material/Stop';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import correctSound from '../../assets/quiz-correct.mp3';
import wrongSound from '../../assets/quiz-wrong.mp3';

const correctAudio = new Audio(correctSound);
const wrongAudio = new Audio(wrongSound);
const NUM_OF_QUIZ = import.meta.env.VITE_FS_NUM_OF_QUIZ;

const FSQuiz: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [result, setResult] = useState<boolean>(false);
  const [predicts, setPredicts] = useState<PredictState>({
    value: null,
    timestamp: Date.now(),
  });
  const updatePredicts = (newValue: string | null) => {
    setPredicts({
      value: newValue,
      timestamp: Date.now(),
    });
  };
  const [answeredSign, setAnsweredSign] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);  
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [quizNumber, setQuizNumber] = useState<number>(0);
  const [quizCharacterList, setQuizCharacterList] = useState<WordListItem[]>([]);
  const [gestureRecognizer, setGestureRecognizer] = useState<GestureRecognizer | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);

  useEffect(() => {
    const createQuiz = async () => {
      // Select 10 random characters from A to Z. (* J and Z are excluded.)
      const characters = "ABCDEFGHILMNOPRSTUVWXY";
      const quizCharacterList = Array.from({ length: NUM_OF_QUIZ }, (_, i) => ({
        id: i,
        sign: characters[Math.floor(Math.random() * characters.length)],
        isCorrect: false,
      }));
      setQuizCharacterList(quizCharacterList);
    };
    createQuiz();

    // Completely reset web assembly module.
    const resetMediapipeGlobalContext = () => {
      if (window.Module) {
        try {
          // After loading holidtic module, loading gesture module causes conflict.
          // The root cause is not clear yet, but setting window.Module to undefined seems to work.
          window.Module = undefined;
          console.log("Mediapipe Module has been reset.");
        } catch (error) {
          console.error("Failed to delete window.Module:", error);
        }
      } else {
        console.log("No Module to delete.");
      }
    };

    const createGestureRecognizer = async () => {
      try {
        resetMediapipeGlobalContext();
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/model/asl_finger_spelling.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
        });
        setGestureRecognizer(gestureRecognizer);
        gestureRecognizerRef.current = gestureRecognizer;
        console.log("Mediapipe gesture model has been loaded.");
      } catch (error) {
        console.error("Failed to load MediaPipe gesture model:", error);
        return;
      }
    };
    createGestureRecognizer();

    return () => {
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
        gestureRecognizerRef.current = null;
        console.log("Mediapipe gesture module is cleared.");
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let videoElement: HTMLVideoElement | null = null;

    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !gestureRecognizerRef.current) return;
      videoElement = video;

      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Flip the image horizontally for a selfie-view display.
      canvasCtx.scale(-1, 1);
      canvasCtx.translate(-canvas.width, 0);
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = await gestureRecognizerRef.current.recognizeForVideo(video, Date.now());
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        const detectedGesture = results.gestures[0]?.[0]?.["categoryName"] || "No match found";
        // Ignore other than A to Z. (J and Z are also ignored.)
        updatePredicts(/^[A-Z]$/.test(detectedGesture) ? detectedGesture : "No match found");
      }
      
      const drawingUtils = new DrawingUtils(canvasCtx);
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          {
            color: theme.palette.primary.main,
            lineWidth: 4
          }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          radius: 4,
        });
      }
      canvasCtx.restore();
      animationFrameId = requestAnimationFrame(processFrame);
    };

    const startVideoStream = async () => {
      if (!gestureRecognizerRef.current || !videoRef.current) return;
      const video = videoRef.current;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            aspectRatio: 4 / 3
          }
        });
        video.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(reject);
          };
        });
        setIsVideoLoaded(true);
        processFrame();
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };
    startVideoStream();

    return () => {
      cancelAnimationFrame(animationFrameId);

      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop();
        });
        videoElement.srcObject = null;
        console.log("Video stream has been stopped.");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gestureRecognizer]);

  useEffect(() => {
    if (predicts.value) {  
      setAnsweredSign(predicts.value);
      setQuizCharacterList(prevList => {
        const newList = [...prevList];
        if (predicts.value === newList[quizNumber].sign) {
          setResult(true);
          newList[quizNumber].isCorrect = true;
          playSound(correctAudio);
        } else {
          setResult(false);
          newList[quizNumber].isCorrect = false;
          playSound(wrongAudio);
        }
        return newList;
      });
    }
  }, [predicts, quizNumber]);

  const handleRecordingToggle = () => {
    setIsRecording((prev) => {
      isRecordingRef.current = !prev;
      console.log("Recording:", isRecordingRef.current);

      if (isRecordingRef.current) {
        setTimeout(() => {
          setIsRecording(false);
          isRecordingRef.current = false;
          console.log("Recording stopped.");
        }, 100);
      }
      return isRecordingRef.current;
    });
  };

  const handlePrevButtonClick = () => {
    setQuizNumber((prev) => {
      return prev - 1;
    });
    updatePredicts(null);
    if (isRecordingRef.current) {
      handleRecordingToggle();
    }
  }

  const handleNextButtonClick = () => {
    if (quizNumber === NUM_OF_QUIZ - 1) {
      navigate("/quiz-result", { state: { selectedWordList: quizCharacterList } });
    } else {
      setQuizNumber((prev) => {
        return prev + 1;
      });
      updatePredicts(null);
      setAnsweredSign(null);
      if (isRecordingRef.current) {
        handleRecordingToggle();
      }
    }
  }

  const handleHistoryBack = () => {
   navigate(-1); 
  }

  const playSound = (audio: HTMLAudioElement) => {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
  }

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
      <Backdrop
        open={!isVideoLoaded}
        sx={{ display: "flex", flexDirection: "column", gap: "1rem", color: "#fff", zIndex: 5000, backgroundColor: "rgba(0,0,0,0.8)" }}>
        <CircularProgress color="inherit" />
        <Typography>Starting webcam...</Typography>
      </Backdrop>
      <IconButton 
        onClick={handleHistoryBack}
        aria-label="back"
        sx={{ position: "absolute", top: "0rem", left: "0.5rem" }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h1" color="primary" sx={{ fontSize: "2rem", fontWeight: 900 }}>Quiz</Typography>
      <Card sx={{ padding: "1rem", boxShadow: "4px 4px 6px rgba(0, 0, 0, 0.3)"}}>          
        <Typography variant="h3" sx={{ fontSize: "1.5rem" }}>
          {quizCharacterList[quizNumber]?.sign}
        </Typography>
      </Card>   
      <Typography variant="h6" color="textSecondary">Answer in sign language to the camera:</Typography>
      <Box>
        <video ref={videoRef} style={{ width: "100%", height: "auto", aspectRatio: "4 / 3", display: "none" }} />
        <canvas ref={canvasRef} style={{ backgroundColor: "#f0f0f0", width: "100%", height: "auto", aspectRatio: "4 / 3", display: "block" }} />
      </Box>
      <Box sx={{ padding: "1rem", border: `2px solid ${theme.palette.primary.main}` }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontSize: "1.5rem", 
            color: answeredSign ? (result ? "success.main" : "error.main") : "text.secondary",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHright: "1rem", }}
        >
          {answeredSign && (result 
            ? <CheckCircleIcon sx={{ color: "success.main", marginRight: "0.5rem" }} /> 
            : <CancelIcon sx={{ color: "error.main", marginRight: "0.5rem" }} />
          )}
          {answeredSign ? answeredSign : "Your answer is..."}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <IconButton
          onClick={handleRecordingToggle}
          aria-label={isRecordingRef.current ? "Stop Recording" : "Start Recording"}
          sx={{
            color: "#D64545",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            '&:hover': {
              backgroundColor: "rgba(255, 0, 0, 0.2)",
            },
          }}
        >
          {isRecording
            ? <StopIcon sx={{ width: "50px", height: "50px" }} />
            : <PhotoCameraIcon sx={{ width: "50px", height: "50px" }} />}
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row", gap: "1rem", justifyContent: "center"}}>
        <Button
          variant="contained" 
          color="primary"
          onClick={handlePrevButtonClick}
          disabled={quizNumber === 0}
          sx={{ textTransform: "none", width: '25%' }}
        >
          Prev
        </Button>
        <Button
          variant="contained" 
          color="primary"
          onClick={handleNextButtonClick}
          disabled={!answeredSign}
          sx={{ textTransform: "none", width: '25%' }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default FSQuiz;