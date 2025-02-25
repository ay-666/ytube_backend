import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js";
import {
  postComment , updateComment , deleteComment , getVideoComment
} from "../controllers/comment.controllers.js"


const router = Router();

router.use(verifyJWT);

router.route("/c/:commentId").patch(updateComment)
  .delete(deleteComment);
router.route("/:videoId").get(getVideoComment)
  .post(postComment);;


export default router;