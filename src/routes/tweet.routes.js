import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js";
import { postTweet , updateTweet, getUserTweets,deleteTweet } from "../controllers/tweet.controllers.js";
const router = Router();

router.route("/").post(verifyJWT,postTweet).get(verifyJWT,getUserTweets);



router.route("/:tweetId")
.patch(verifyJWT,updateTweet)
.delete(verifyJWT,deleteTweet);







export default router;