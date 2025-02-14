import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken';



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

    const user = await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
            refreshToken:undefined,
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