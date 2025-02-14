import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";

const router = Router();

const filesUpload = upload.fields([{
  name: 'avatar',
  maxCount: 1
},{
  name:'coverImage',
  maxCount: 1
}])


router.route('/register').post( filesUpload
  ,registerUser);

router.route('/login').post(loginUser);

router.route('/logout').post(verifyJWT,logoutUser);

router.route('/refresh-token').post(refreshAccessToken);


export default router;

// ThunderClient for api testing... 