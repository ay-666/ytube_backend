import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const postTweet = asyncHandler(async(req , res)=>{
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Content is required!");
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user
    });
    if(!tweet){
        throw new ApiError(400,"Error in generating tweet");
    }
    return res.status(200).json(new ApiResponse(200,tweet,"Tweet created successfully."));
}) ;

export const updateTweet = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params;
    const {content} = req.body;

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    if(!tweet.isOwner(req.user?._id)){
        throw new ApiError(401,"Unauthorized request");
    }

    tweet.content = content;
    await tweet.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,{},"Updated successfully"));


});

export const getUserTweets = asyncHandler(async (req,res)=>{
    const userId = req.user?._id;
    const tweet = await Tweet.find({owner: userId});
    if(!tweet){
        throw new ApiError(404,"No tweets found!");
    }
    return res.status(200).json(new ApiResponse(200,tweet,"Fetched user\'s tweets"));
});

export const deleteTweet = asyncHandler(async(req,res) =>{
    const {tweetId} = req.params;

    const tweet = await Tweet.findById(tweetId);


    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }
    if(!tweet.isOwner(req.user?._id)){
        throw new ApiError(401,"Unauthorized request");
    }

    await Tweet.deleteOne({_id:tweetId});

    return res.status(200).json(new ApiResponse(200,{},"Tweet deleted"));
});


