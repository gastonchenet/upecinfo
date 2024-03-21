import { Router } from "express";
import v1 from "./v1";
import v2 from "./v2";

const router = Router();

router.use("/", v2);
router.use("/v1", v1);
router.use("/v2", v2);

export default router;
