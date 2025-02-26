import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";

export const createPlaylist = asyncHandler(async (req , res)=>{
    const {name,description,videos} = req.body;


    if(!name || !description){
        throw new ApiError(400,"name & description are required.");
    }
    const playlist = await Playlist.create({
        name:name,
        description:description,
        videos:videos ? videos:[],
        owner: req.user?._id
    });

    if(!playlist){
        throw new ApiError(400,"Error creating playlist.");
    }

    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully."));
});

export const getUserPlaylists = asyncHandler(async (req,res)=>{
    const {userId} = req.params;

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found!");
    }
    const playlists = await Playlist.find({owner:userId});
    if(!playlists){
        throw new ApiError(400,"Error getting playlist.");
    }
    return res.status(200).json(new ApiResponse(200,playlists,"Playlists frtched successfully."));
});