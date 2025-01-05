CREATE SCHEMA ntpv2;
USE ntpv2;

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'rootroot';
GRANT ALL ON ntpv2.* TO 'root'@'localhost';
flush privileges;

DROP TABLE users;
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
ALTER TABLE users DROP COLUMN device_info;

DROP TABLE stats;
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

ALTER TABLE stats ADD device_info text;

SELECT * FROM stats ORDER BY id DESC LIMIT 2;
SELECT * FROM users;

CREATE TABLE IF NOT EXISTS admin (
id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
email_address VARCHAR(128) UNIQUE NOT NULL,
password VARCHAR(32) NOT NULL,
permissions VARCHAR(32)
);
