import { Router } from "express";
import notes from "./notes";
import planning from "./planning";
import information from "./information";

const router = Router();

router.get("/", (req, res) => res.sendStatus(200));
router.use("/notes", notes);
router.use("/planning", planning);
router.use("/information", information);

export default router;
