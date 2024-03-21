import { Schema, model, SchemaTypes } from "mongoose";

const notificationSchema = new Schema({
	title: {
		type: SchemaTypes.String,
		required: true,
	},
	body: {
		type: SchemaTypes.String,
		required: true,
	},
	expoPushTokens: {
		type: [SchemaTypes.String],
		required: true,
	},
	icon: {
		type: SchemaTypes.String,
		default: null,
	},
	action: {
		type: SchemaTypes.String,
		default: null,
	},
	createdAt: {
		type: SchemaTypes.Date,
		required: true,
		default: Date.now,
	},
});

export default model("Notification", notificationSchema);
