const cloudinary = require('cloudinary'),
      Q = require('q');

function upload(file){
    //use env variables
    cloudinary.config({
        cloud_name: "genkin",
        api_key: "148658642175944",
        api_secret: "VoWUmPD_qVHecuxCsC_POQ-sGyw"
    });

    return new Q.Promise((resolve, reject)=>{
        //edit width and height in production
        cloudinary.v2.uploader.upload(file,{width: 200, height:200},(err, res)=>{
            if(err){
                console.log('cloudinary err:', err)
                reject(err);
            } else{
                console.log('cloudinary res:', res)
                return resolve(res.url);
            }
        });
    });
};

module.exports = upload;