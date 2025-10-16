import { LandmarkList } from '@mediapipe/holistic';

export type Landmarks = {
  faceLandmarks: LandmarkList | null;
  poseLandmarks: LandmarkList | null;
  leftHandLandmarks: LandmarkList | null;
  rightHandLandmarks: LandmarkList | null;
};

export type PredictState = {
  value: string | null;
  timestamp: number;
};

export interface PredictionResult {
  sign_id: number;
  sign: string;
  confidence: number;
}

export type PredictSignResponse = PredictionResult[];

export interface YouTubeEmbedProps {
  embedId: string;
}

export interface YouTubeEmbedWithStartEndProps {
  embedId: string;
  startTime: number;
  uniqueParam: string;
}

export interface WordListItem {
  id: number;
  sign: string;
  yt_embedId?: string;
  isCorrect?: boolean;
}

export interface StartTime {
  [key: string]: number;
}

export interface ViewStartTime {
  front: StartTime;
  side: StartTime;
}

export interface FingerSpellingYTData {
  yt_embedId: string;
  start_time: ViewStartTime;
}

declare global {
  interface Window {
    Module?: Record<string, unknown>;
  }
}