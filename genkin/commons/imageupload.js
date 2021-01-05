const multer = require('multer');
const { resolve } = require('q');
/*
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
   const S3_BUCKET = "genkin-storage",
          AWS_ACCESS_KEY_ID = "******************************",
          AWS_SECRET_ACCESS_KEY = "********************************",
          REGION = "us-east-2",
          s3 = new aws.S3();
    
    aws.config.update({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    });
    aws.config.region = REGION;
  
const upload = multer({
  fileFilter,
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
});
*/
let filefilter = (req, file, callback)=>{
  if (file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    return callback(null, true);
  } else {
    console.log(`bad format`);
    return callback({ success: false, message: "BAD REQUEST" }, false
    );
  }
};

let storage = multer.diskStorage({
  destination: function (req, file,callback){
    return callback(null, './public/images')
  },
  filename: function(req, file, callback){
    return callback(null, file.originalname);
  }
});


let upload = multer({
  storage: storage,
  limits: {fileSize: 1024 * 1024 * 24},
  fileFilter: filefilter
});
 module.exports = upload;
