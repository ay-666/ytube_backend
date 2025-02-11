import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

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


export default router;

// ThunderClient for api testing... 