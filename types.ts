
export interface CalibrationResult {
  frequencyScan: string;
  illusionStripping: string;
  fiveSteps: string[];
  actionAnchor: string;
  recommendedBookTitle: string;
  recommendedMusicTitle: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  result: CalibrationResult;
}
