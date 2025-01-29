import express from "express";
import { query, apiRoute, prepData } from "./dbConnect.js";
import { publicIpv4 } from "public-ip";
import quiz from "./quiz.json" with {type: "json"};
import { UAParser } from "ua-parser-js";
import config from "./config/index.js";
import * as jsonwebtoken from 'jsonwebtoken';

const allParts = quiz.parts;
const correctAnswers = allParts.map(part => part.answers[0]);
const wrongAnswers = [];

const correctAnswerSet = new Set();
const wrongAnswerSet = new Set();

correctAnswers.forEach(answer => {
  correctAnswerSet.add(answer);
});

allParts.forEach(part => {

  // Index 0 is the correct answer so skip it and start at 1.
  for (let index = 1; index < part.answers.length; index++) {
    const answer = part.answers[index];
    const isNotMatchingCorrectAnswer = !correctAnswerSet.has(answer);

    if (isNotMatchingCorrectAnswer && answer !== "") {
      wrongAnswerSet.add(answer);
    }
  }
});

wrongAnswerSet.forEach(answer => {
  wrongAnswers.push(answer);
});

const privateKey = config.keys.jwt;

// const app = express();
const router = express.Router();

router.get('*', (req, res, next) => {
  console.log(`Protocol: ${req.headers["x-forwarded-proto"]}`);
  // if (req.headers['x-forwarded-proto'] !== 'https') {
  //   // res.redirect(301, `https://${req.headers.host}${req.url}`);
  // } else {
  //   next(); 
  // }
  next();
});

router.get(`${apiRoute}/parts/date-updated`, async (req, res) => {
  const response = {
    message: "Date last updated.",
    status: 200,
    data: allParts.length,
  };

  res.json(response);
});

router.get(`${apiRoute}/parts/size`, async (req, res) => {
  const response = {
    message: "Number of parts in game.",
    status: 200,
    data: quiz.parts.length,
  };

  res.json(response);
});

router.get(`${apiRoute}/parts/info`, async (req, res) => {
  const response = {
    message: "Number of parts in game and date last updated",
    status: 200,
    data: {
      size: quiz.parts.length,
      dateLastUpdated: quiz.dateLastUpdated
    }
  };

  res.json(response);
});

router.get(`${apiRoute}/parts/`, async (req, res) => {
  const shuffledParts = allParts.sort(() => 0.5 - Math.random());

  const response = {
    message: "All parts and answers.",
    status: 200,
    data: shuffledParts,
  };

  res.json(response);
});

router.get(`${apiRoute}/parts/correct-answers`, async (req, res) => {
  const response = {
    message: "All correct answers.",
    status: 200,
    data: correctAnswers,
  };

  res.json(response);
});

router.get(`${apiRoute}/parts/wrong-answers`, async (req, res) => {
  const response = {
    message: "All wrong answers without matching correct answers or duplicates.",
    status: 200,
    data: wrongAnswers,
  };

  res.json(response);
});

const addIPAddressToGameData = async (gameData) => {
  try {
    const gameDataObject = gameData;

    const deviceInfoObject = JSON.parse(gameData.device_info);
    deviceInfoObject.ipAddress = await publicIpv4();
    gameDataObject.device_info = JSON.stringify(deviceInfoObject);

    return gameDataObject;
  } catch (error) {
    console.log(error);
    return null;
  }
};

router.get(`${apiRoute}/greet/`, async (req, res) => {
  const response = {
    message: "Greeting.",
    status: 200,
    data: "Hello, Mace!",
  };

  res.json(response);
});

router.post(`${apiRoute}/admin/jwt`, async (req, res) => {
  const tokenFromFrontEnd = req.body.token;

  let response = {};

  const auth = await jsonwebtoken.default.verify(tokenFromFrontEnd, privateKey, function (err, decoded) {
    if (err) {
      response = {
        message: "Invalid JWT",
        status: 401,
        data: { valid: false }
      };
    } else {
      response = {
        message: "Valid JWT",
        status: 200,
        data: { valid: true }
      };
    }

    res.json(response);
  });
});

router.post(`${apiRoute}/admin/games`, async (req, res) => {
  const tokenFromFrontEnd = req.body.token;
  
  let response = {};
  let validJWT = false;

  try {
    const auth = await jsonwebtoken.default.verify(tokenFromFrontEnd, privateKey, function (err, decoded) {
      validJWT = err ? false : true;
    });

    const resultLimit = 50;

    if (validJWT) {
      const gameData = await query(`SELECT id, uuid, game_mode, correct_answers, final_score, total_parts, game_duration_in_seconds, display_name, game_end_type, losing_part, game_end_date_time, device_info FROM stats ORDER BY id DESC LIMIT ${resultLimit};`);
      const userData = await query(`SELECT * FROM users ORDER BY id DESC LIMIT ${resultLimit};`);

        response = {
          message: `Most recent ${resultLimit} game stats.`,
          status: 200,
          data: { 
            valid: true,
            games: gameData,
            users: userData
           }
        };
    }

    res.json(response);
  } catch (error) {
    response = {
      message: `Error.`,
      status: error.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Log in to admin
router.post(`${apiRoute}/admin/login-attempt`, async (req, res) => {
  const loginData = req.body;

  let response = {};

  try {
    const sql = await query(`SELECT password, permissions FROM admin WHERE email_address = "${loginData.emailAddress}"`);
    
    // Email address not found.
    if (!sql.length) {
      response = {
        message: `Login failed.`,
        status: 200,
        data: { login: false },
      };

      res.json(response);
      return;
    }

    const passwordFromDatabase = sql[0].password;
    const loginSuccess = loginData.password === passwordFromDatabase;

    if (loginSuccess) {
      const dataForToken = {
        emailAddress: loginData.emailAddress,
        permissions: sql[0].permissions
      }

      const token = await jsonwebtoken.default.sign({ data: dataForToken }, privateKey, { expiresIn: '1d' });

      // const usersData = await query(`SELECT * FROM users ORDER BY id DESC LIMIT 1000;`);
      

      response = {
        message: `Login Success and JSON Web Token.`,
        status: 200,
        data: { login: true, token },
      };
    } else {
      response = {
        message: `Login failed.`,
        status: 200,
        data: { login: false },
      };
    }

    res.json(response);
  } catch (e) {
    response = {
      message: `Login failed.`,
      status: 200,
      data: { login: false },
    };

    res.json(response);
    console.log(e);
  }
});

router.get(`${apiRoute}/users/`, async (req, res) => {
  try {
    const sql = await query(`SELECT * FROM users;`);

    const response = {
      message: "All Users.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

router.post(`${apiRoute}/users/new-user`, async (req, res) => {
  const data = prepData(req.body);

  try {
    const sql = await query(`INSERT INTO users (${data.columns}) VALUES (${data.marks})`, data.values);

    const response = {
      message: "New user successfully inserted.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Checks to see if user exists in database already.
router.get(`${apiRoute}/users/exists/:uuid`, async (req, res) => {
  const uuid = req.params.uuid;

  try {
    const sql = await query(`SELECT uuid FROM users WHERE uuid = "${uuid}" LIMIT 1`);

    // If sql has a response with zero length, user does not yet exist.
    const userExists = !!sql.length;

    const response = {
      message: `User does ${userExists ? "" : "not "}already exist in database.`,
      status: 200,
      data: userExists,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Updates player list for uuid.
router.post(`${apiRoute}/users/new-players`, async (req, res) => {
  try {
    const sql = await query(`UPDATE users SET player_names = ? WHERE uuid = "${req.body.uuid}"`, [req.body.player_names]);

    const response = {
      message: `User updated.`,
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Total number of games played
router.get(`${apiRoute}/stats/total-games`, async (req, res) => {
  try {
    const sql = await query(`SELECT COUNT(id) AS total FROM stats`);

    const response = {
      message: "Total number of games played.",
      status: 200,
      data: sql[0].total.toLocaleString()
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
  }
});

// Gets top scoreboard entries
router.get(`${apiRoute}/stats/scoreboard`, async (req, res) => {
  try {
    const sql = await query(
      `SELECT id, correct_answers, total_parts, display_name, final_score, game_end_local_time FROM stats WHERE game_mode = "v" AND final_score > 0 ORDER BY final_score DESC LIMIT 100;`
    );

    const response = {
      message: "Scoreboard.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
  }
});

// Update stat record for game just finished to include scoreboard name after user prompt.
router.post(`${apiRoute}/stats/display-name`, async (req, res) => {
  const { display_name, id } = req.body;

  try {
    const sql = await query(`UPDATE stats SET display_name = ? WHERE id = ?`, [display_name, id]);

    const response = {
      message: "Display Name successfully logged.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    console.log(e);
  }
});

// Update stat record for game just finished to include local time if user reached scoreboard.
// We don't care about loggin local_time if it won't be displayed since game_end_date_time takes care of this.
router.post(`${apiRoute}/stats/local-time`, async (req, res) => {
  const { game_end_local_time, id } = req.body;

  try {
    const sql = await query(`UPDATE stats SET game_end_local_time = ? WHERE id = ?`, [game_end_local_time, id]);

    const response = {
      message: "Local Time successfully logged.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    console.log(e);
  }
});

// Increment user's total games played.
router.post(`${apiRoute}/users/game-played`, async (req, res) => {
  const data = req.body;

  try {
    const sql = await query(`UPDATE users SET games_played = games_played + 1 WHERE uuid = ?`, data.uuid);

    const response = {
      message: "Games played incremented.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

const addUserAgentInfo = (gameData) => {
  const deviceInfoString = gameData.device_info;
  const deviceInfoObject = JSON.parse(deviceInfoString);
  
  const uap = UAParser(deviceInfoObject.userAgentInfo);
  
  deviceInfoObject.browserName = uap.browser.name;
  deviceInfoObject.browserVersion = uap.browser.version;
  deviceInfoObject.browserType = uap.browser.type;
  
  deviceInfoObject.cpuChip = uap.cpu.architecture;

  deviceInfoObject.device = `${uap.device.type ? uap.device.type + " - " : ""}${uap.device.vendor} ${uap.device.model}`;

  deviceInfoObject.engine = `${uap.engine.name} - ${uap.engine.version}`;

  deviceInfoObject.os = `${uap.os.name} - ${uap.os.version}`;

  delete deviceInfoObject.userAgentInfo;

  gameData.device_info = JSON.stringify(deviceInfoObject);

  return gameData;
};

// Log new veteran game.
router.post(`${apiRoute}/stats/log-game`, async (req, res) => {
  const gameDataWithIpAddress = await addIPAddressToGameData(req.body);
  const gameDataWithUAInfo = addUserAgentInfo(gameDataWithIpAddress);

  const data = prepData(gameDataWithUAInfo);

  try {
    const sql = await query(`INSERT INTO stats (${data.columns}) VALUES (${data.marks})`, data.values);

    const response = {
      message: "New game successfully inserted.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Log new rookie game.
router.post(`${apiRoute}/stats/log-rookie-game`, async (req, res) => {
  const gameData = await addIPAddressToGameData(req.body);
  const data = prepData(gameData);

  try {
    const sql = await query(`INSERT INTO stats (${data.columns}) VALUES (${data.marks})`, data.values);

    const response = {
      message: "New game successfully inserted.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

// Play Again
router.post(`${apiRoute}/users/play-again`, async (req, res) => {
  const data = prepData(req.body);

  try {
    const sql = await query(`UPDATE users SET play_again_count = play_again_count + 1 WHERE uuid = ${data.marks}`, [data.values]);

    const response = {
      message: "Play again count updated.",
      status: 200,
      data: sql,
    };

    res.json(response);
  } catch (e) {
    const response = {
      message: e.sqlMessage,
      status: e.errno,
      data: null,
    };

    res.json(response);
    console.log(e);
  }
});

export default router;
