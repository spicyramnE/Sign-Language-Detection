import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Backdrop,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Card,
} from "@mui/material";
import { useTheme } from '@mui/material/styles';
import {
  Holistic,
  Results,
  HAND_CONNECTIONS,
} from "@mediapipe/holistic";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { io, Socket } from "socket.io-client";
import { PredictSignResponse, Landmarks } from '../../types/common';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StopIcon from '@mui/icons-material/Stop';
import VideocamIcon from '@mui/icons-material/Videocam';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import correctSound from '../../assets/quiz-correct.mp3';
import wrongSound from '../../assets/quiz-wrong.mp3';

const correctAudio = new Audio(correctSound);
const wrongAudio = new Audio(wrongSound);
const SERVER_ADDRESS = import.meta.env.VITE_SERVER_ADDRESS;
const API_URL = SERVER_ADDRESS + import.meta.env.VITE_VOCAB_API_PREDICT;
const MODE= import.meta.env.VITE_MODE;

export const VocabQuiz: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedWordList = [] } = location.state || {};
  const theme = useTheme();
  const [result, setResult] = useState<boolean>(false);
  const [predicts, setPredicts] = useState<PredictSignResponse | null>(null);
  const [answeredSign, setAnsweredSign] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);  
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [quizNumber, setQuizNumber] = useState<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holisticRef = useRef<Holistic | null>(null);

  // NOTE: This state is only for REST API mode (instead of using socket.io)
  const [allLandmarks, setAllLandmarks] = useState<Landmarks[]>([]);

  useEffect(() => {
    if (!socketRef.current && MODE === "SOCKETIO") {
      socketRef.current = io(SERVER_ADDRESS, {
        transports: ["websocket"],
        withCredentials: true,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to the server.");
      });

      socketRef.current.on("disconnect", () => {
        console.log("Disconnected from the server.");
      });
    }

    let animationFrameId: number;
    let videoElement: HTMLVideoElement | null = null;
    let frameCounter: number = 0;
    const targetFPS: number = 15;
    const interval = Math.round(60 / targetFPS);

    const onResults = (results: Results) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
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

      drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
        { color: theme.palette.primary.main, lineWidth: 4 });
      drawLandmarks(canvasCtx, results.leftHandLandmarks,
        { color: '#FF0000', radius: 4 });
      drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
        { color: theme.palette.primary.main, lineWidth: 4 });
      drawLandmarks(canvasCtx, results.rightHandLandmarks,
        { color: '#FF0000', radius: 4 });

      canvasCtx.restore();

      frameCounter++;
      if (frameCounter % interval !== 0 // Skip frames to achieve target FPS
        || !isRecordingRef.current // Skip frames if not recording
      ) return;

      const landmarks: Landmarks = {
        faceLandmarks: results.faceLandmarks || null,
        poseLandmarks: results.poseLandmarks || null,
        leftHandLandmarks: results.leftHandLandmarks || null,
        rightHandLandmarks: results.rightHandLandmarks || null,
      };

      if (MODE === "RESTAPI") {
        setAllLandmarks(prev => [...prev, landmarks]);
      } else if (MODE === "SOCKETIO") {
        socketRef.current?.emit("vocab-landmarkers", landmarks);
      } else{
        socketRef.current?.emit("vocab-landmarkers", landmarks);
      }
    };

    const processFrame = async () => {
      if (holisticRef.current && videoRef.current) {
        await holisticRef.current.send({ image: videoRef.current });
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    const startVideoStream = async () => {
      const video = videoRef.current;
      if (!video) return;

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
    
    const initHolistic = async () => {
      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });
      holisticRef.current = holistic;
      holistic.onResults(onResults);
    };
    initHolistic().then(() => startVideoStream());

    return () => {
      cancelAnimationFrame(animationFrameId);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          console.log(`Stopping track: ${track.kind}, ID: ${track.id}`);
          track.stop();
        });
        videoElement.srcObject = null;
        console.log("Video stream has been stopped.");
      }

      if (holisticRef.current) {
        holisticRef.current.close();
        holisticRef.current = null;
        console.log("Mediapipe holistic module is cleared.");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (predicts) {
      let highestConfidence = 0;
      let bestMatchedSign = null;
  
      // Find the best matched sign from the selected word list for practice.
      for (const predict of predicts) {
        for (const selectedWord of selectedWordList) {
          if (predict.sign === selectedWord.sign && predict.confidence > highestConfidence) {
            highestConfidence = predict.confidence;
            bestMatchedSign = predict.sign;
          }
        }
      }
  
      if (bestMatchedSign) {
        setAnsweredSign(bestMatchedSign);
        if (bestMatchedSign === selectedWordList[quizNumber].sign) {
          setResult(true);
          selectedWordList[quizNumber].isCorrect = true;
          playSound(correctAudio);
          console.log("Correct!");
        } else {
          setResult(false);
          selectedWordList[quizNumber].isCorrect = false;
          playSound(wrongAudio);
          console.log("Incorrect!");
        }
      } else {
        setAnsweredSign("No match found");
        setResult(false);
        selectedWordList[quizNumber].isCorrect = false;
        playSound(wrongAudio);
        console.log("No match found");
      }
    }
  }, [predicts, selectedWordList, quizNumber]);

  useEffect (() => {
    if (!isRecording) {
      if (MODE === "RESTAPI") {
        handleAllLandmarksSubmit().then((predicts: PredictSignResponse) => {
          if (predicts.length === 0) return
          setPredicts(predicts);
          setAllLandmarks([]);
        });
      } else if (MODE === "SOCKETIO") {
        socketRef.current?.emit("vocab-predict", (predicts: PredictSignResponse) => {
          if (predicts.length === 0) return
          setPredicts(predicts);
        });
      } else {
        socketRef.current?.emit("vocab-predict", (predicts: PredictSignResponse) => {
          if (predicts.length === 0) return
          setPredicts(predicts);
        });
      }
    }
  }, [isRecording])

  const handleRecordingToggle = async () => {
    setIsRecording((prev) => {
      isRecordingRef.current = !prev
      console.log("Recording:", isRecordingRef.current);
      return isRecordingRef.current;
    });
  }

  const handlePrevButtonClick = () => {
    setQuizNumber((prev) => {
      return prev - 1;
    });
    setPredicts(null);
    if (isRecordingRef.current) {
      handleRecordingToggle();
    }
  }

  const handleNextButtonClick = () => {
    if (quizNumber === selectedWordList.length - 1) {
      navigate("/quiz-result", { state: { selectedWordList: selectedWordList } });
    } else {
      setQuizNumber((prev) => {
        return prev + 1;
      });
      setPredicts(null);
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

  // This function is only for REST API mode (instead of using socket.io)
  const handleAllLandmarksSubmit = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ allLandmarks: allLandmarks }),
      });
      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Error at handleAllLandmarksSubmit():", error);
    }
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
          {selectedWordList[quizNumber].sign}
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
            : <VideocamIcon sx={{ width: "50px", height: "50px" }} />}
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
          disabled={predicts?.length === 0 || !predicts?.[0]?.sign}
          sx={{ textTransform: "none", width: '25%' }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default VocabQuiz;