import { Router } from "express";
import notes from "./notes";
import planning from "./planning";

const router = Router();

router.get("/", (req, res) => res.sendStatus(200));
router.use("/notes", notes);
router.use("/planning", planning);

export default router;
