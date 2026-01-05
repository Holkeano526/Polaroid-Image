
export interface PolaroidImage {
  id: string;
  url: string;
  caption: string;
  timestamp: number;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GenerationState {
  status: GenerationStatus;
  error?: string;
  currentImage?: string;
}
