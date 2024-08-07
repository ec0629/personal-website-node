CREATE TABLE users (
  id INTEGER PRIMARY KEY NOT NULL,
  username TEXT UNIQUE NOT NULL,
  salt_key TEXT NOT NULL
);

CREATE TABLE nfl_team (
  id INTEGER PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  abbr VARCHAR(3) NOT NULL
);

INSERT INTO nfl_team (abbr, name) VALUES
  ('Min', 'Minnesota Vikings'), ('SF', 'San Francisco 49ers'), ('Cin', 'Cincinnati Bengals'),
  ('LAC', 'Los Angeles Chargers'), ('LAR', 'Los Angeles Rams'), ('Mia', 'Miami Dolphins'),
  ('Cle', 'Cleveland Browns'), ('Atl', 'Atlanta Falcons'), ('Buf', 'Buffalo Bills'),
  ('KC', 'Kansas City Chiefs'), ('NYG', 'New York Giants'), ('Dal', 'Dallas Cowboys'),
  ('Phi', 'Philadelphia Eagles'), ('Ten', 'Tennessee Titans'), ('Ind', 'Indianapolis Colts'),
  ('LV', 'Las Vegas Raiders'), ('Det', 'Detroit Lions'), ('NYJ', 'New York Jets'),
  ('Pit', 'Pittsburgh Steelers'), ('NO', 'New Orleans Saints'), ('Jax', 'Jacksonville Jaguars'),
  ('GB', 'Green Bay Packers'), ('NE', 'New England Patriots'), ('Sea', 'Seattle Seahawks'),
  ('Bal', 'Baltimore Ravens'), ('Hou', 'Houston Texans'), ('Car', 'Carolina Panthers'),
  ('Was', 'Washington Commanders'), ('Chi', 'Chicago Bears'), ('Ari', 'Arizona Cardinals'),
  ('Den', 'Denver Broncos'), ('TB', 'Tampa Bay Buccaneers');

CREATE TABLE player_position (
  id INTEGER PRIMARY KEY NOT NULL,
  abbr VARCHAR(3) NOT NULL
);

INSERT INTO player_position (id, abbr) VALUES (1, 'WR'), (2, 'RB'), (3, 'TE'), (4, 'QB'), (5, 'DEF'), (6, 'K');

CREATE TABLE player (
  id INTEGER PRIMARY KEY NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  uniform_number INTEGER,
  team_id INTEGER NOT null,
  position_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES nfl_team (id),
  FOREIGN KEY (position_id) REFERENCES player_position (id),
  UNIQUE (first_name, last_name)
);

CREATE TABLE player_adp (
  id INTEGER PRIMARY KEY NOT NULL,
  player_id INTEGER NOT NULL,
  adp NUMERIC(4, 1) NOT NULL,
  source VARCHAR(10) NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE (player_id, created_on, source)
);

CREATE TABLE player_rank (
  id INTEGER PRIMARY KEY NOT NULL,
  player_id INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  source VARCHAR(10) NOT NULL,
  created_on TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE (player_id, created_on)
);