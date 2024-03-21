import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import connect from "./utils/connect";
import fs from "fs";
import path from "path";

const app = express();

connect();

fs.readdirSync(path.join(__dirname, "listeners")).forEach((file) => {
	const { default: listener } = require(`./listeners/${file}`);
	listener();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
	console.log(`${req.method} ${req.path}`);
	next();
});

app.use(routes);

app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});
