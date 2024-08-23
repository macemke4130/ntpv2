import sqlite3 from "sqlite3";
const sql3 = sqlite3.verbose();

const connected = (error) => {
  if (error) {
    console.log(error.message);
    return;
  }
};

export const db = new sql3.Database("./namethatpart.db", sqlite3.OPEN_READWRITE, connected);

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY UNIQUE, 
  uuid TEXT,
  player_names TEXT
);

CREATE TABLE IF NOT EXISTS stats (
  id INTEGER PRIMARY KEY UNIQUE, 
  correct_answers INTEGER,
  final_score INTEGER,
  total_parts INTEGER,
  game_duration_in_seconds INTEGER,
  device_info TEXT,
  display_name TEXT,
  game_end_type TEXT,
  game_end_date_time TEXT NOT NULL DEFAULT current_timestamp,
  local_time TEXT,
  uuid TEXT
);
`;

db.run(sql, [], (error) => {
  if (error) {
    console.log(error.message);
    return;
  }
});
