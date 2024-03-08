import "dotenv/config";
import Client from "./classes/Client";

const client = new Client();

client.start(process.env.TOKEN!);

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);
process.on("uncaughtExceptionMonitor", console.log);
process.on("rejectionHandled", console.log);
process.on("warning", console.warn);
