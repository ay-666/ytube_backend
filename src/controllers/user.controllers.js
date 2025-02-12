import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(req.files?.avatar[0]?.path);

    

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
