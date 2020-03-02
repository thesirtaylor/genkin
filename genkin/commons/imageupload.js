const multer = require('multer');
/*
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
   const S3_BUCKET = "genkin-storage",
          AWS_ACCESS_KEY_ID = "AKIAJKBOLSB2MGY3Z73Q",
          AWS_SECRET_ACCESS_KEY = "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",
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
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
    callback(null, true)
  } else{
    cb({message: 'Unsupported file format'}, false)
  }
};

let storage = multer.diskStorage({
  destination: function (req, file,callback){
    callback(null, '')
  },
  filename: function(req, file, callback){
    callback(null, file.originalname);
  }
});


let upload = multer({
  storage: storage,
  limits: {fileSize: 1024 * 1024 * 8},
  filefilter: filefilter
});
 module.exports = upload;