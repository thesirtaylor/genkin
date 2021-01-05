const { async } = require("q");

var Owner = require("../model/owner").owner,
  Store = require("../model/owner").store,
  Product = require("../model/product").product,
  ERR = require("../commons/errorResponse"),
  SUCCESS = require("../commons/successResponse"),
  sgMail = require("@sendgrid/mail"),
  bcrypt = require("bcryptjs"),
  SALT_WORK_FACTOR = 10,
  uploadCloudinary = require("../commons/cloudinary").upload,
  fs = require("fs"),
  crypto = require("crypto");
var mailKey = process.env.SGMAIL_APIKEY;

module.exports = {
  upload: async (req, res) => {
      let payload = req.decoded;
      let files = req.files;
      try {
        let owner = await Owner.findOne({_id: payload.owner});
        if(owner){
            let store = await Store.findOne({$or:[{_ownerId: owner._id},{workers: owner._id}]});
            if(store){
              //prevent multiple upload of same asset
                  let urls = [];
                  let newPath
                  let folder = store.name;
                  let multipleUploads = async (path) => await uploadCloudinary(path, `genkin/productImages/${folder}/`);
                  for (const file of files){
                    const {path} = file;

                  newPath = await multipleUploads(path);
                  urls.push(newPath);
                  fs.unlinkSync(path);
                  }
                 // console.log(newPath)
                  if(urls){
                    let product = await Product.create({name: req.body.name,
                                                    desc: req.body.desc,
                                                    images: urls, 
                                                    price: req.body.price,
                                                    category: req.body.category,
                                                    uploadedby: owner.username,
                                                    store: store._id});
                        if (product) {
                          return res.status(200).json(SUCCESS(product));
                        }else{
                          return res.status(400)
                            .json(ERR("No product created"));
                        }
                  }
            }else{
                    return res.status(400)
                              .json((ERR("You don't belong to any store.")));}
        }
      } catch (error) {
        console.log(error);
                 return res.status(400).json(ERR("Error occured."));
      }
  }
}