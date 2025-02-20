import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, 
  changeCurrentpassword, getCurrentUser , updateUserAvatar, updateUserCoverImage,
  updateAccountDetails, getUserChannelProfile, getWatchHistory} from "../controllers/user.controllers.js";
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

router.route('/change-password').post(verifyJWT,changeCurrentpassword);
router.route('/current-user').get(verifyJWT,getCurrentUser);

router.route('/update-user-account').patch(verifyJWT,updateAccountDetails);
router.route('/update-user-avatar').patch(verifyJWT,upload.single('avatar') , updateUserAvatar );

router.route('/update-user-cover').patch(verifyJWT,upload.single('coverImage') , updateUserCoverImage );

router.route('/channel/:username').get(verifyJWT,getUserChannelProfile);
router.route('/history').get(verifyJWT,getWatchHistory);

export default router;

// ThunderClient for api testing... 