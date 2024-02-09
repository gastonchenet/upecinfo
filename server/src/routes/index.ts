import { Router } from "express";
import notes from "./notes";

const router = Router();

router.use("/notes", notes);

export default router;
