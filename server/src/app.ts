import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import connect from "./utils/connect";
import fs from "fs";
import path from "path";
import moment from "moment";
import "moment/locale/fr";
import os from "os";

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
	console.log(`[${moment().format("HH:mm:ss")}] <${req.method}> ${req.path}`);
	next();
});

app.use(routes);

const networkInterfaces = os.networkInterfaces();
const ipAddress = networkInterfaces["Ethernet"]?.at(-1)?.address;

app.listen(process.env.PORT, () => {
	console.log(
		`[${moment().format(
			"HH:mm:ss"
		)}] Server is running on http://${ipAddress}:${process.env.PORT}`
	);
});
