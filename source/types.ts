export type Part = {
  answers: Array<string>;
  images: Array<string>;
};

export type Stat = {
  uuid: string;
  correct_answers: number;
  display_name: string;
  final_score: number;
  total_parts: number;
  game_duration_in_seconds: number;
  game_end_date_time: string;
  game_end_local_time: string;
  local_time: string;
  game_end_type: "s" | "t" | "w";
  id: number;
};

export type DBResponse = {
  message: string;
  status: number;
  data: any;
};
