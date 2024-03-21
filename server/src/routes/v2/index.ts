import { Router } from "express";
import notes from "./notes";
import planning from "./planning";
import info from "./info";
import notif from "./notif";

const router = Router();

router.get("/", (req, res) => res.sendStatus(200));
router.use("/notes", notes);
router.use("/planning", planning);
router.use("/info", info);
router.use("/notif", notif);

export default router;
