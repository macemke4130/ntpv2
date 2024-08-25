import express from "express";
import path from "path";
import cors from "cors";
import routes from "./api.js";
// import { db } from "./dbConnect.js";
const __dirname = path.resolve();

const app = express();

// const allowedOrigins = ["http://127.0.0.1:5500/", "http://localhost:5500/"];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         return callback(null, true);
//       } else {
//         return callback(new Error("Origin not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

// app.get("/api/stat/:id", (req, res) => {
//   res.set("content-type", "application/json");

//   const sql = `SELECT * FROM stats WHERE id = ?`;

//   try {
//     db.get(sql, [req.params.id], (error, record) => {
//       if (error) throw error;

//       if (!record) {
//         return res.status(404).send("Record not found");
//       }

//       res.status(200);
//       res.send(JSON.stringify(record));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// app.get("/api/stats", (req, res) => {
//   res.set("content-type", "application/json");

//   const sql = `SELECT * FROM stats ORDER BY final_score DESC, id DESC LIMIT 20`;
//   const result = [];

//   try {
//     db.all(sql, [], (error, rows) => {
//       if (error) throw error;

//       rows.forEach((row) => result.push(row));

//       res.status(200);
//       res.send(JSON.stringify(result));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// app.post("/api/loggame", (req, res) => {
//   res.set("content-type", "application/json");

//   // Replace some device info with info only available from the server.
//   const deviceInfo = JSON.parse(req.body.device_info);
//   deviceInfo.headers = req.headers;
//   deviceInfo.ip = req.ip;

//   delete req.body.device_info;
//   req.body.device_info = JSON.stringify(deviceInfo);

//   const formValues = Object.values(req.body);
//   const databaseFields = Object.keys(req.body).join(", ");
//   const numberOfQuestionMarks = Array(formValues.length).fill("?").join(", ");

//   const sql = `INSERT INTO stats(${databaseFields}) VALUES(${numberOfQuestionMarks})`;

//   try {
//     db.run(sql, formValues, function (error) {
//       if (error) throw error;

//       const result = {
//         insertId: this.lastID,
//         data: {
//           headers: req.headers,
//           ip: req.ip,
//         },
//       };

//       res.status(200);
//       res.send(JSON.stringify(result));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// app.post("/api/player-name", (req, res) => {
//   res.set("content-type", "application/json");

//   const sql = `UPDATE stats SET display_name = "${req.body.playerName}" WHERE id = ?;`;
//   const recordId = req.body.databaseRecord;

//   try {
//     db.run(sql, recordId, function (error) {
//       if (error) throw error;

//       res.status(200);
//       res.send(JSON.stringify("Success"));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// // Update users table with new player name on UUID
// app.post("/api/user/players", (req, res) => {
//   res.set("content-type", "application/json");

//   const sql = `UPDATE users SET player_names = "${req.body.playerNames}" WHERE uuid = ?;`;
//   const uuid = req.body.uuid;

//   try {
//     db.run(sql, uuid, function (error) {
//       if (error) throw error;

//       res.status(200);
//       res.send(JSON.stringify("Success"));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// app.post("/api/user/new-user", (req, res) => {
//   res.set("content-type", "application/json");

//   const bodyValues = Object.values(req.body);

//   const sql = `INSERT INTO users(uuid, player_names) VALUES(?, ?)`;

//   try {
//     db.run(sql, bodyValues, function (error) {
//       if (error) throw error;

//       res.status(200);
//       res.send(JSON.stringify("Success"));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

// // Checks to see if UUID exists in database already.
// app.get("/api/user/:uuid", (req, res) => {
//   res.set("content-type", "application/json");

//   const sql = `SELECT * FROM users WHERE uuid = ?`;

//   try {
//     db.get(sql, [req.params.uuid], (error, record) => {
//       if (error) throw error;

//       res.send(JSON.stringify(record ? true : false));
//     });
//   } catch (error) {
//     res.status(400);
//     res.send(`{"code":400, "status":"${error.message}"}`);
//   }
// });

app.use(express.static("./dist"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "./dist"));
});

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`\n ❤️  Server listening on port: ${port} ❤️ \n`));

export default app;
