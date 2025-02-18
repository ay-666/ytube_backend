import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET // CLOUDINARY INFO FROM CLOUDINARY DASHBOARD
});

const uploadOnCloudinary = async (localFilePath) =>{

    try{

        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(
            localFilePath,{resource_type:'auto'}
        );

        // console.log('File uploaded successfully...');

        fs.unlinkSync(localFilePath);
        
        return response;


    }catch(error){
        fs.unlinkSync(localFilePath) // to remove the local saved temporary file when upload fails
        return null;
    }

    

}

const deleteOldFile = async (cloudinaryUrl) =>{
    try{
        const parts = url.split("/");
        const publicId = parts.slice(-2).join("/").split(".")[0];
    }catch(error){
        return null;
    }
}


export {uploadOnCloudinary,deleteOldFile};


