import mongoose from "mongoose";

export default function connect() {
	return mongoose.connect(
		`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}.mongodb.net/${process.env.MONGODB_TABLE}?retryWrites=true&w=majority&appName=upecinfo`
	);
}
