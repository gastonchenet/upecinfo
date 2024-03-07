import { Schema, model, SchemaTypes } from "mongoose";

const sectorSchema = new Schema({
	sectorId: {
		type: SchemaTypes.String,
		required: true,
		unique: true,
	},
	expoPushTokens: {
		type: [SchemaTypes.String],
		required: true,
	},
});

export default model("Sector", sectorSchema);
