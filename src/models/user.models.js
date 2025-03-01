import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index: true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        min:[6,'Pass can\'t be smaller than 6 char']
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String , // cloudinary url
        required:true
    },
    coverImage:{
        type:String
    },
    refreshToken:{
        type:String
    },
    watchHistory:[
        {type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        }
    ]
},{timestamps:true});

//hook
userSchema.pre('save',async function (next) {
    
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password){
    const res= await bcrypt.compare(password,this.password);
    return res;
}

userSchema.methods.generateAccessToken =  function () {
    
    return  jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    
);
}

userSchema.methods.generateRefreshToken =  function () {
    return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
);

}

export const User = mongoose.model('User',userSchema);