export type Part = {
  answers: Array<string>;
  images: Array<string>;
};

export type Stat = {
  correct_answers: number;
  device_info: string;
  display_name: string;
  final_score: number;
  total_parts: number;
  game_duration_in_seconds: number;
  game_end_date_time: string;
  game_end_type: "s" | "t" | "w";
  id: number;
};
