import { version } from "../../package.json";

export const HEADLESS = false; // true;
export const ARGS = ["--no-sandbox", "--disable-setuid-sandbox"];
export const USERAGENT = `InfoUPEC/${version} (com.du_cassoulet.infoupec)`;
export const EXECUTABLEPATH = undefined; // "/usr/bin/chromium-browser";
