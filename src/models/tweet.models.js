import mongoose,{Schema} from "mongoose";

const tweetSchema = new Schema(
    {
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        content:{
            type:String,
            reqired:true
        }

    },{timestamps:true});


    tweetSchema.methods.isOwner =  function (userId){
        return this.owner.equals(userId);
    }

export const Tweet = mongoose.model("Tweet",tweetSchema);