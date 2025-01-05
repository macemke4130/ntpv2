export type GameMode = "r" | "v";

export type Part = {
  answers: Array<string>;
  images: Array<string>;
};

export type Stat = {
  id?: number;
  uuid: string;
  game_end_date_time?: string;
  game_end_local_time?: string;
  display_name?: string;
  game_end_type?: "s" | "t" | "w";
  losing_part?: string;
  correct_answers: number;
  final_score: number;
  total_parts: number;
  connection: string;
  game_mode: "v" | "r";
  device_info: string;
  game_duration_in_seconds: number;
};

export type DBResponse = {
  message: string;
  status: number;
  data: any;
};

export type RookieScoreObject = {
  correct: boolean;
  partName: string;
  images: string;
};
