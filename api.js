import * as express from "express";
import { query, apiRoute, prepData } from "./dbConnect.js";

const router = express.Router();

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
    const sql = await query(`SELECT * FROM users WHERE uuid = "${uuid}" LIMIT 1`);

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

router.get(`${apiRoute}/stats/`, async (req, res) => {
  try {
    const sql = await query(`SELECT * FROM stats ORDER BY final_score DESC;`);

    const response = {
      message: "All games in database.",
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

// Log new game.
router.post(`${apiRoute}/stats/log-game`, async (req, res) => {
  const data = prepData(req.body);

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

export default router;
