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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DROP TABLE stats;
CREATE TABLE IF NOT EXISTS stats (
  id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
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

SELECT * FROM stats;
SELECT * FROM users;
SELECT * FROM users WHERE uuid = "poiuytre";

INSERT INTO users (uuid, player_names, device_info) VALUES ("jdieydji", "Lucas, Billy, Tony", "Laptop");

insert into stats (correct_answers, final_score, total_parts, game_duration_in_seconds, display_name, game_end_type, uuid) values (9, 6000, 9, 20, "Lucas Mace", "w", "poiuytre");