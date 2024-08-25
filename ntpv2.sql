CREATE SCHEMA ntpv2;
USE ntpv2;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  uuid CHAR(8) NOT NULL,
  player_names TEXT,
  device_info TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS stats (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  correct_answers SMALLINT NOT NULL,
  final_score MEDIUMINT NOT NULL,
  total_parts SMALLINT NOT NULL,
  game_duration_in_seconds SMALLINT NOT NULL,
  display_name VARCHAR(32),
  game_end_type ENUM("w", "s", "t") NOT NULL,
  game_end_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  uuid CHAR(8) NOT NULL
);

SELECT * FROM stats;