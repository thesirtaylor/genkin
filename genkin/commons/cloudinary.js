const cloudinary = require("cloudinary");

module.exports = {
  upload: (file, folderPath)=>{
    cloudinary.config({
      cloud_name: "genkin",
      api_key: process.env.CLOUDINARYKEY,
      api_secret: process.env.CLOUDINARYSECRET,
    });
    return new Promise(async (resolve, reject) => {
      try {
             let cloud = await cloudinary.v2.uploader.upload(file, { folder: folderPath });
             if (cloud) {
                return resolve (cloud);
             }else {return res.status(400).send({success:false, message:'BAD REQUEST'})}
      } catch (error) {
        console.log(error)
        return reject(error)
      }
    });
  }
}