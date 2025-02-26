import { asyncHandler} from "../utils/asyncHandler.js";

import { Comment } from "../models/comment.models.js";

import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";



// 1.postComment - content from body , videoId from params , user 

export const postComment = asyncHandler(async (req,res)=>{
  const {videoId} = req.params;
  const {content} = req.body;

  if(!content){
    throw new ApiError(400,"comment can\'t be blank!'");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(400,"Invalid videoId");
  }

  const comment = await Comment.create({
    content,
    owner: req.user?._id,
    video: videoId
  });

  if(!comment){
    throw new ApiError(400,"Error commenting on video!");
  }

  return res.status(200).json(new ApiResponse(200,comment,"commented"));


  
});

export const updateComment = asyncHandler(async (req,res)=>{
  const {commentId} = req.params;
  const {content} = req.body;

  if(!content){
    throw new ApiError(400,"comment can\'t be blank!'");
  }
  const comment = await Comment.findById(commentId);
  
  if(!comment){
    throw new ApiError(404,"comment not found ");
  }

  if(!comment.isOwner(req.user?._id)){
    throw new ApiError(400,"Unauthorized request!");
  }

  comment.content = content;
  await comment.save({validateBeforeSave: false});
  

  

  return res.status(200).json(new ApiResponse(200,{},"comment updated"));



});

export const deleteComment = asyncHandler(async (req,res)=>{
  const {commentId} = req.params;

  const comment = await Comment.findById(commentId);

  if(!comment){
    throw new ApiError(404,"comment not found ");
  }

  if(!comment.isOwner(req.user?._id)){
    throw new ApiError(404,"Unauthorized request!");
  }

  
  await Comment.deleteOne({_id:commentId});

  




  return res.status(200).json(new ApiResponse(200,{},"comment deleted"));

});

export const getVideoComment = asyncHandler(async (req,res)=>{
  const {videoId} = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  

  
  const video = await Video.findById(videoId);
  
  if(!video){
    throw new ApiError(404,"Video not found ");
  }

  

  const allCommentsQuery =  Comment.aggregate([
    {$match :{
      video : new mongoose.Types.ObjectId(String(videoId))
    }},
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[{
          $unset:["password","refreshToken","watchHistory","updatedAt","coverImage",
                 "createdAt"]
        }]
      }
    }

  ]);
  const options = { page , limit };

  const result = await Comment.aggregatePaginate(allCommentsQuery,options);

  return res.status(200).json(new ApiResponse(200,result,"comments fetched"));

  



});