import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { deleteOldFile, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";


const createAccessAndRefreshToken= async (userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        

        user.refreshToken = refreshToken;
        
        await user.save({ validateBeforeSave: false });

        
        

        return {accessToken ,refreshToken};

    }catch(err){
        throw new ApiError(500 ,"Server error while generating token");
    }
}

// to recreate new access token

export const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"Refresh token is expired");
        }
    
        const cookiesOptions = {
            httpOnly:true,
            secure:true
        }
        const {accessToken:newAccessToken,refreshToken:newRefreshToken} = await createAccessAndRefreshToken(user._id);
        return res.status(200).cookie("accessToken",newAccessToken,cookiesOptions)
        .cookie("refreshToken",newRefreshToken,cookiesOptions)
        .json(new ApiResponse(201,{accessToken:newAccessToken,refreshToken:newRefreshToken},"Access token refreshed successfully."));
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }


});



export const registerUser = asyncHandler(async (req, res) => {
    //1. get user details from front-end
    //2. validation -not empty
    //3.check user already exists(username and email)
    //4.check image files(avatar & cover )
    //5.upload to cloudinary
    //6.create user object and store in db
    //7.check user object and send response to front-end.


    const { username , email, password, fullName} = req.body;

    if([username,email,password,fullName].some((field) => field === '')){
        //res.status(400);
        throw new ApiError(400,"Please fill all fields");
    };

    const existingUser = await  User.findOne({
        $or: [{username},{email}]
    });

    if(existingUser){
        throw new ApiError(409,"User already exists");
    }
    

    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
    //console.log(req.files?.avatar[0]?.path);

    

    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    let coverImageLocalPath ;
    let coverImage;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
        coverImage = await uploadOnCloudinary(coverImageLocalPath);

        

    }
    

    if(!avatar){
        throw new ApiError(400,"Please upload avatar");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.secure_url || "",
        email,
        username: username.toLowerCase(),
        password
        
    });

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registring a user");
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User created successfully."));
        
    
});

export const loginUser = asyncHandler(async (req,res) =>{
    //1.check fields empty or not
    //2.find user with email or username
    //3.passcheck
    //4.access and refresh token generation
    //5.cookies

    const {username,email,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Username or email is required");
    }

    const user = await  User.findOne({
        $or:[{email},{username}]
    });

    if(!user){
        throw new ApiError(401,"User not found");
    }
    if(!password){
        throw new ApiError(400,"Password is required");
    }
    
    

    if(!user.isPasswordCorrect(password)){
        throw new ApiError(401,"Invalid credentials");
    }
    const {accessToken, refreshToken} = await createAccessAndRefreshToken(user._id);

    
    

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");

    const cookiesOptions = {
        httpOnly:true,
        secure:true
    }
    res.status(200).
    cookie("accessToken",accessToken,cookiesOptions).
    cookie("refreshToken",refreshToken,cookiesOptions).
    json(new ApiResponse(200,
        {
            loggedInUser,
            accessToken:accessToken,
            refreshToken:refreshToken
        },
        "User logged In successfully"));




});

export const logoutUser = asyncHandler(async (req,res)=>{

    const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $unset:{
            refreshToken:1,
        }
    },
    {
        new:true
    });

    const cookiesOptions = {
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",cookiesOptions).
    clearCookie("refreshToken",cookiesOptions).json(new ApiResponse(200,{},"User logged out successfully"));



     
});

export const changeCurrentpassword = asyncHandler(async (req,res) =>{
    const {currentPassword,newPassword} = req.body;
    
    if(!currentPassword || !newPassword){
        throw new ApiError(401,"Enter valid password");
    }
    if(currentPassword === newPassword){
        throw new ApiError(401,"Current and New password can't be same")
    }
    const user = await User.findById(req.user?.id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Enter valid password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200,"","Password changed successfully"));
});

export const getCurrentUser =asyncHandler(async(req , res)=>{
    if(!req?.user){
        throw new ApiError(401,"User unavailable");
    }
    return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"));
});


export const updateAccountDetails = asyncHandler(async (req , res)=>{
   const {fullName,email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required.");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set: {fullName : fullName,email : email}
    },{new : true}).select("-password");
    if(!user){
        throw new ApiError(400,"User not found!");
    }
    return res.status(200).json(new ApiResponse(200,"","Details updated successfully"));
})


export const updateUserAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is missing.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(401,"Error uploading avatar");
    }

    const user = await User.findById(req.user?._id);
    
    await deleteOldFile(user.avatar);

    user.avatar = avatar;

    await user.save({validateBeforeSave:false});


    // const user =await User.findByIdAndUpdate(req.user?._id,{
    //     $set:{avatar:avatar.secure_url}
    // },{
    //     new:true
    // });

    

    return res.status(200)
        .json(new ApiResponse(200,user,"User avatar updated successfully."));
})

export const updateUserCoverImage= asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover Image is missing.")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage){
        throw new ApiError(401,"Error uploading cover image");
    }

    const user = await User.findById(req.user?._id);
    if(user.coverImage)
        await deleteOldFile(user.coverImage);

    user.coverImage = coverImage;

    await user.save({validateBeforeSave:false});


    // const user = await User.findByIdAndUpdate(req.user?._id,{
    //     $set:{avatar:avatar.secure_url}
    // },{
    //     new:true
    // });
    return res.status(200)
    .json(new ApiResponse(200,user,"User cover image updated successfully."));
})


export const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const username = req.params.username;
    console.log(username)
    if(!username?.trim){
        throw new ApiError(400,"Invalid username");
    }
    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField:"_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                subscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if: {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then: true ,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                emai: 1,
                username:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ]);

    console.log(channel)

    if(!channel?.length){
        throw new ApiError(401,"channel doesn't exists");
    }

    return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"));
});


export const getWatchHistory = asyncHandler(async (req,res)=>{
    
    if(!req.user){
        throw new ApiError(400,"Invalid request");
    }
    
    const user = await User.aggregate([
        {
            $match:
            {
                _id: new mongoose.Types.ObjectId(String(req.user?._id))
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'watchHistory',
                foreignField:'_id',
                as:'watchHistory',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"));
});
