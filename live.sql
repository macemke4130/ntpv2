use z0zddkiug99fvykz;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  uuid CHAR(8) NOT NULL,
  player_names TEXT,
  device_info TEXT,
  play_again_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE users ADD games_played int default 0;
ALTER TABLE users MODIFY COLUMN games_played int DEFAULT 1;

CREATE TABLE IF NOT EXISTS stats (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
  connection VARCHAR(8),
  game_mode ENUM("r", "v") NOT NULL,
  correct_answers SMALLINT NOT NULL,
  final_score MEDIUMINT NOT NULL,
  total_parts SMALLINT NOT NULL,
  game_duration_in_seconds SMALLINT NOT NULL,
  display_name VARCHAR(32),
  game_end_type ENUM("w", "s", "t") NOT NULL,
  losing_part VARCHAR(64),
  game_end_local_time VARCHAR(32),
  game_end_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  uuid CHAR(8) NOT NULL
);

select * from users;
select * from stats order by id desc limit 10;
DELETE FROM stats WHERE display_name IS NULL;
-- DELETE FROM stats WHERE display_name = "Lucas Mace";