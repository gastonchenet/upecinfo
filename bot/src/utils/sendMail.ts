import "dotenv/config";
import { MailPayload } from "../types";
import nodemailer from "nodemailer";
import fs from "fs";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_ADDRESS,
		pass: process.env.EMAIL_PASSWORD,
	},
});

export default async function sendMail(
	to: string[],
	{ subject, html }: MailPayload
) {
	return transporter.sendMail({ to: to.join(","), subject, html });
}
