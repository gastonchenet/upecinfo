import { Router } from "express";
import notes from "./notes";
import planning from "./planning";
import information from "./information";
import notifications from "./notifications";

const router = Router();

router.get("/", (req, res) => res.sendStatus(200));
router.use("/notes", notes);
router.use("/planning", planning);
router.use("/information", information);
router.use("/notifications", notifications);

export default router;
