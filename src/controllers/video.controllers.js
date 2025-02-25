import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteCloudinaryFile, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";


export const getAllVideos = asyncHandler(async(req , res)=>{
    //const {page,limit,query,sortBy,sortType,userId} = req.query;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit )|| 5;
        const query = req.query.query ? JSON.parse(req.query.query) : {};
        const sortBy = req.query.sortBy || "createdAt";
        const sortType = req.query.sortType === "desc" ? -1 : 1 ;
        const userId = req.query.userId || "";
    
    
    
        const options ={
            page:page,
            limit:limit,
            
        }
    
        let filter = {...query};
        if(userId){
            filter.userId = new mongoose.Types.ObjectId(String(userId));
        }
        
        const aggergateQuery =  Video.aggregate([
            {
                $match:filter,
            },{
                $sort:{
                    [sortBy]: sortType
                }
            }
        ]);
        
        const result = await Video.aggregatePaginate(aggergateQuery,options);
        if(!result){
            throw new ApiError(400,"Pagination error");
        }
        console.log(result)

        return res.status(200).json(new ApiResponse(200,result,"Videos fetched successfully"));
    
        
    } catch (error) {
        throw new ApiError(400,`Error fetching videos : ${error}` );
    }


});

export const publishVideo = asyncHandler(async(req , res)=>{
    const {title, description} = req.body;

    if( !title || !description){
        throw new ApiError(401,"All fields are required.");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path || "";
    //console.log("req files:",req.files?.video)

    const thumbnailLocalPath = req.files?.thumbnail?.[0].path || "";

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(401,"Video and thumbnail are required");
    }

    const videoResponse = await uploadOnCloudinary(videoLocalPath);
    const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);


    await Video.create({
        videoFile: videoResponse?.secure_url || "",
        thumbnail: thumbnailResponse?.secure_url || "",
        title: title,
        description: description,
        duration: videoResponse?.duration,
        owner: req?.user

    });

    return res.status(200).json(new ApiResponse(200,videoResponse?.secure_url,"Video uploaded successfully"));



    //console.log(cloudinaryResponse);

});


export const getVideoById = asyncHandler( async(req , res) =>{
    const {videoId} = req.params;
    console.log(videoId);
    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(String(videoId))
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $unset:["password","refreshToken","watchHistory","updatedAt"]
                    }
                ]
            }
        }
    ]
    );

    if(!video){
        throw new ApiError(404,"Video not found!");
    }

    return res.status(200).json(new ApiResponse(200,video[0],"video fetched successfully"));


});


export const updateVideo = asyncHandler(async (req , res)=>{
    const {videoId} = req.params;

    const {title,description} = req.body;

    const thumbnailLocalPath = req.file?.path || "";

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400,"Provide updated details");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found!");
    }

    if(!video.isOwner(req.user._id)){
        throw new ApiError(401,"Unauthorized request");
    }

    if(title) video.title = title;
    if(description) video.description = description;

    if(thumbnailLocalPath){
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(!thumbnail){
            throw new ApiError(400,"Error uploading file");
        }
        await deleteCloudinaryFile(video.thumbnail,"image");

        video.thumbnail = thumbnail?.secure_url;
    }

    await video.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,{},"Details updated successfully."));

    
});

export const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Error deleting video");
    }
    if(!video.isOwner(req.user._id)){
        throw new ApiError(401,"Unauthorized request");
    }
    await deleteCloudinaryFile(video.videoFile,"video");
    await deleteCloudinaryFile(video.thumbnail,"image");
    await video.deleteOne({_id:videoId});
    return res.status(200).json(new ApiResponse(200,{},"Video deleted..."));
});

export const togglePublishStatus = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }
    if(!video.isOwner(req.user._id)){
        throw new ApiError(401,"Unauthorized request");
    }
    video.isPublished = !video.isPublished;
    await video.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,{},"Video status changed."));
});