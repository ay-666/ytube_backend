import { asyncHandler } from "../utils/asyncHandler.js";

import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.models.js";

export const toggleVideoLike = asyncHandler(async(req , res)=>{
  const {videoId} = req.params;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(400,"Invalid request. video not found!");
  }

  const existingLike = await Like.findOne({video:videoId,likedBy: req.user?._id});

  if(existingLike){
    await Like.findByIdAndDelete(existingLike._id);

    return res.status(200).json(new ApiResponse(200,{},"Video unliked."));
  }

  
  

  await Like.create({
    video: videoId,
    likedBy: req.user?._id
  });

  return res.status(200).json(new ApiResponse(200,{},"Video liked."));
  
});

export const toggleCommentLike = asyncHandler(async(req , res)=>{
  const {commentId} = req.params;
  const comment = await Comment.findById(commentId);
  if(!comment){
    throw new ApiError(400,"Invalid request. Comment not found!");
  }

  const existingLike = await Like.findOne({$comment:commentId,likedBy: req.user?._id});

  if(existingLike){
    await Like.findByIdAndDelete(existingLike._id);

    return res.status(200).json(new ApiResponse(200,{},"Comment unliked."));
  }




  await Like.create({
    comment: commentId,
    likedBy: req.user?._id
  });

  return res.status(200).json(new ApiResponse(200,{},"Comment liked."));
  
});

export const toggleTweetLike = asyncHandler(async(req , res)=>{
  const {tweetId} = req.params;
  const tweet = await Tweet.findById(tweetId);
  if(!tweet){
    throw new ApiError(400,"Invalid request. Tweet not found!");
  }

  const existingLike = await Like.findOne({tweet:tweetId,likedBy: req.user?._id});

  if(existingLike){
    await Like.findByIdAndDelete(existingLike._id);

    return res.status(200).json(new ApiResponse(200,{},"Tweet unliked."));
  }




  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id
  });

  return res.status(200).json(new ApiResponse(200,{},"Tweet liked."));

});


export const getLikedVideos = asyncHandler(async(req , res)=>{
  const userId = req.user?._id;

  const likedVideos = await Like.find({likedBy:userId, video:{
    $ne : null
  }}).select("video -_id");

  if(!likedVideos){
    throw new ApiError(400,"Error fetching liked videos.");
  }

  const videoIds = likedVideos.map((like) => like.video);

  return res.status(200).json(new ApiResponse(200,videoIds,"liked videos fetched successfully."));

  
});