import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

import {
    getSubscribedChannels , getUserChannelSubscribers, 
    toggleSubscription, 
} from "../controllers/subscription.controllers.js";

const router = Router();

router.use(verifyJWT)

router.route("/s/:subscriberId").get(getSubscribedChannels);

router.route("/c/:channelId").get(getUserChannelSubscribers);

router.route("/t/:channelId").post(toggleSubscription);



export default router;