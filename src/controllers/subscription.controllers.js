import { Subscription } from "../models/subscription.models.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const getUserChannelSubscribers = asyncHandler(async(req , res)=>{
    const {channelId} = req.params;

    const channel = await User.findById(channelId);
    if(!channel ){
        throw new ApiError(404,"Channel not found!");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(String(channelId)) // Ensure it's a valid ObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails" // Convert array to object
        },
        {
            $addFields: {
                subscriberId: "$subscriberDetails._id",
                fullName: "$subscriberDetails.fullName",
                username: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar"
            }
        },
        {
            $project: {
                _id: 0, // Exclude subscription ID
                subscriberId: 1,
                fullName: 1,
                username: 1,
                avatar: 1
            }
        }
    ]);
    
    console.log(subscribers);
    
    if(!subscribers){
        throw new ApiError(400,"Error getting subscribers");
    }

    return res.status(200).json(new ApiResponse(200,subscribers,"Fetched subscribers"));


});

export const toggleSubscription = asyncHandler(async (req,res)=>{
    const {channelId} = req.params;

    const channel = await User.findById(channelId);
    if(!channel ){
        throw new ApiError(404,"Channel not found!");
    }

    if(channelId.toString() === req.user?._id.toString()){
        throw new ApiError(401,"Unauthorized request.");
    }

    const existingSubscription = await Subscription.findOne({channel:channelId,
        subscriber: req.user?._id
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200,{},"Unsubscribed"));
    }

    await Subscription.create({
        subscriber:req.user?._id,
        channel:channelId
    });

    return res.status(200).json(new ApiResponse(200,{},"Subscribed"));

});

export const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params;

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(String(subscriberId)) 
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails" // Convert array to object
        },
        {
            $addFields: {
                channelId: "$channelDetails._id",
                fullName: "$channelDetails.fullName",
                username: "$channelDetails.username",
                avatar: "$channelDetails.avatar"
            }
        },
        {
            $project: {
                _id: 0, // Exclude subscription ID
                channelId: 1,
                fullName: 1,
                username: 1,
                avatar: 1
            }
        }
    ]);

    if(!channels){
        throw new ApiError(400,"Error fetching channels");
    }
    return res.status(200).json(new ApiResponse(200,channels,"Subscribed channels fetched."));
});