CREATE TABLE nfl_team (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  abbr VARCHAR(3) NOT NULL
);

INSERT INTO nfl_team (id, abbr, name) VALUES
(1, 'Ari', 'Arizona Cardinals'),(2, 'Atl', 'Atlanta Falcons'),(3, 'Bal', 'Baltimore Ravens'),
(4, 'Buf', 'Buffalo Bills'),(5, 'Car', 'Carolina Panthers'),(6, 'Chi', 'Chicago Bears'),
(7, 'Cin', 'Cincinnati Bengals'),(8, 'Cle', 'Cleveland Browns'),(9, 'Dal', 'Dallas Cowboys'),
(10, 'Den', 'Denver Broncos'),(11, 'Det', 'Detroit Lions'),(12, 'GB', 'Green Bay Packers'),
(13, 'Hou', 'Houston Texans'),(14, 'Ind', 'Indianapolis Colts'),(15, 'Jax', 'Jacksonville Jaguars'),
(16, 'KC', 'Kansas City Chiefs'),(17, 'LV', 'Las Vegas Raiders'),(18, 'LAC', 'Los Angeles Chargers'),
(19, 'LAR', 'Los Angeles Rams'),(20, 'Mia', 'Miami Dolphins'),(21, 'Min', 'Minnesota Vikings'),
(22, 'NE', 'New England Patriots'),(23, 'NO', 'New Orleans Saints'),(24, 'NYG', 'New York Giants'),
(25, 'NYJ', 'New York Jets'),(26, 'Phi', 'Philadelphia Eagles'),(27, 'Pit', 'Pittsburgh Steelers'),
(28, 'SF', 'San Francisco 49ers'),(29, 'Sea', 'Seattle Seahawks'),(30, 'TB', 'Tampa Bay Buccaneers'),
(31, 'Ten', 'Tennessee Titans'),(32, 'Was', 'Washington Commanders');
   

CREATE TABLE player_position (
  id INTEGER PRIMARY KEY NOT NULL,
  abbr VARCHAR(3) NOT NULL
);

INSERT INTO player_position (id, abbr) VALUES (1, 'WR'), (2, 'RB'), (3, 'TE'), (4, 'QB'), (5, 'DEF'), (6, 'K');

CREATE TABLE player (
  id INTEGER PRIMARY KEY NOT NULL,
  first_name VARCHAR(127) NOT NULL,
  last_name VARCHAR(127),
  name_matcher VARCHAR(255) NOT NULL,
  uniform_number INTEGER,
  team_id INTEGER NOT null,
  position_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES nfl_team (id),
  FOREIGN KEY (position_id) REFERENCES player_position (id),
  UNIQUE (first_name, last_name)
);

CREATE TABLE yahoo_player_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  adp REAL NOT NULL,
  rank INTEGER NOT NULL,
  created_on TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE (player_id, created_on)
);

CREATE TABLE underdog_player_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  adp REAL NOT NULL,
  created_on TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE (player_id, created_on)
);

CREATE TABLE etr_player_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  created_on TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE (player_id, created_on)
);