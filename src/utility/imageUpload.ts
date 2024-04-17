import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'ndmorsalin', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:  process.env.CLOUDINARY_API_SECRET
});


export const uploadToCloudinary = async (imageBase64: string) => {
  try {
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBase64}`,{
        folder: 'ai-art',
        use_filename: true,
        unique_filename: true,
    });
    return result.secure_url;
  } catch (error) {
    throw error;
  }
};
