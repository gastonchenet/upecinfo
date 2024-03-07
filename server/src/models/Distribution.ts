import { Schema, model, SchemaTypes } from "mongoose";

const distributionSchema = new Schema({
	evalId: {
		type: SchemaTypes.Number,
		required: true,
		unique: true,
	},
	distrib: {
		type: [SchemaTypes.Number],
		required: true,
	},
});

export default model("Distribution", distributionSchema);
