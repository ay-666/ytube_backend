import {Router} from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js";
import { getAllVideos, publishVideo , getVideoById , updateVideo , deleteVideo , togglePublishStatus } from "../controllers/video.controllers.js";

const multipleFilesUpload = upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]);



const router = Router();


router.route('/').get(verifyJWT,getAllVideos);

router.route('/').post(verifyJWT,multipleFilesUpload,publishVideo);

router.route('/:videoId')
.get(verifyJWT,getVideoById)
.patch(verifyJWT,upload.single("thumbnail"),updateVideo)
.delete(verifyJWT,deleteVideo);


router.route('/toggle/publish/:videoId').patch(verifyJWT,togglePublishStatus);
export default router;