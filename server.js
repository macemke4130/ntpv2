import express from "express";
import path from "path";
import cors from "cors";
import routes from "./api.js";

const __dirname = path.resolve();
const app = express();

const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:5500/"];

// app.use(cors());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error("Origin not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use(express.static("./dist"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "./dist"));
});

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`\n ❤️  Server listening on port: ${port} ❤️ \n`));

export default app;
