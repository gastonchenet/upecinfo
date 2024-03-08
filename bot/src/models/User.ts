import { Schema, model } from "mongoose";

const UserSchema = new Schema({
	discordId: {
		type: String,
		required: true,
		unique: true,
	},
	promoRoleId: {
		type: String,
		required: true,
		unique: false,
	},
	email: {
		type: String,
		required: false,
		unique: false,
	},
	notifyByDiscord: {
		type: Boolean,
		required: true,
		unique: false,
		default: false,
	},
	notifyByEmail: {
		type: Boolean,
		required: true,
		unique: false,
		default: false,
	},
});

export default model("User", UserSchema);
