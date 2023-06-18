import { Router } from "express";
import { getCheckin } from "../controllers/checkin.controller.js"

const checkinRouter = Router();

checkinRouter.get('/flightId/:id/passengers', getCheckin);

export default checkinRouter;