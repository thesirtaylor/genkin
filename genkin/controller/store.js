const { async } = require('q');
const { Console } = require('console');
const { url } = require('inspector');
const { owner } = require('../model/owner');

var Owner = require('../model/owner').owner,
    Store = require('../model/owner').store,
    Product = require('../model/product').product,
    ERR = require('../commons/errorResponse'),
    SUCCESS = require('../commons/successResponse'),
    sgMail = require('@sendgrid/mail'),
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10,
    uploadCloudinary = require('../commons/cloudinary'),
    fs = require('fs'),
    crypto = require('crypto');
    var mailKey = process.env.SGMAIL_APIKEY;

/**
 * After hirecode creation, automatically mail codes to workers who then
 * click the code link in their mails that then automatically adds them
 * to workers
 **/
    module.exports = {
        create: (req, res)=>{

            let payload = req.decoded;
            Owner.findOne({_id: payload.owner}, (error, staff)=>{
                if(error){
                    return res
                        .status(502)
                        .json(ERR('Problem encountered while searching for staff'));
                }if(!staff){
                    return res
                        .status(502)
                        .json(ERR('Staff does not exist'));
                }
                else{
                    Store.findOne({$or:[{_ownerId:  staff._id}, {workers: staff._id}]}, (error, store)=>{
                        console.log(staff._id);
                        if(error){
                            return res
                                .status(502)
                                .json(ERR('Error encountered while checking if you owned a store already'))
                        }
                        if(store){
                            return res
                                .status(403)
                                .json(ERR('No one can belong to more than 1 store at a time'));
                        }
                        else{
                            Store.findOne({name: req.body.name}, (error, storee)=>{
                                if(error){
                                    return res
                                    .status(404)
                                    .json(ERR('Error encountered while searching for store.'));
                                }
                                if(storee){
                                    return res
                                    .status(404)
                                    .json(ERR('Store name already in use, use something unique'));
                                }
                                else{
                                    //var id = Mongoose.Types.ObjectId(staff._id)
                                    //console.log(id);
                                Store.create({ _ownerId: staff._id, name: req.body.name, desc: req.body.desc},(error, store)=>{
                                        if(error){
                                            return res
                                                .status(404)
                                                .json(ERR('Error encountered while creating store.'));
                                        } if(!store){
                                            return res
                                                .status(404)
                                                .json(ERR('No store created.'));
                                        } if(store){
                                            staff.isAdmin = true;
                                            //test to see if save callback is necessary
                                            staff.save((error)=>{
                                                if(error){
                                                    return res
                                                        .status(404)
                                                        .json(ERR("Error while trying  to upgrade worker to Admin"))
                                                }
                                                return res
                                                    .status(200)
                                                    .json(SUCCESS('You are now the Admin for ' + store.name))
                                            }); 
                                        };
                                     })    
                                    }
                                })
                            }
                        })
                    }
            })
        },
        hireKey:(req, res)=>{
            //Only store owner can generate hirekeys
            let payload = req.decoded;
            Owner.findOne({_id: payload.owner}, (error, staff)=>{
                if(error){
                    return res
                        .status(502)
                        .json(ERR('Problem encountered while searching for staff'));
                }if(!staff){
                    return res
                        .status(502)
                        .json(ERR('Staff does not exist'));
                }else{
                    Store.findOne({_ownerId: staff._id}, (error, store)=>{
                        //codeArray
                        if(error){
                            return res
                                .status(404)
                                .json(ERR("Error encountered when searching for store"));
                        }if(store){
                                let codeArray = store.hirekey;
                                let limit = req.body.limit;
                                for (let num = 0; num < limit; num++) {
                                    let key = crypto.randomBytes(16).toString('hex');
                                    codeArray.push(key);
                                }
                                store.save(err=>{
                                    if(err){
                                        return res 
                                            .status(402)
                                            .json(ERR("New hire keys could not be saved."));
                                    }
                                    return res
                                        .status(200)
                                        .json(SUCCESS("These are the generated codes " + codeArray))
                                
                                })
                            }
                            else{
                                return res
                                .status(406)
                                .json(ERR("Only store owners can generate hire codes"))
                            }
                     })
                }
            })
        },
        joinstore: (req, res)=>{
            let payload = req.decoded;
            Owner.findOne({_id: payload.owner}, (error, staff)=>{
                if(error){
                    return res
                        .status(502)
                        .json(ERR("Problem encountered while searching for staff"));
                }
                if(staff.isAdmin === true){
                    return res
                        .status(502)
                        .json(ERR("You already own your own store"));
                }else{
                  Store.findOne({$or:[{_ownerId: staff._id},{workers: staff._id}]}, (error, person)=>{
                    if(error){
                        return res
                            .status(402)
                            .json(ERR('Search for worker status failed'));
                    }  
                    if(person){
                        return res
                            .status(401)
                            .json(ERR('You already belong to a store'));
                    }else{
                        Store.findOne({hirekey: req.body.hirekey}, (error, key)=>{
                            if(error){
                                return res
                                    .status(402)
                                    .json(ERR('Problem encountered while verifying your key'));
                            }if(key){
                                Store.updateOne({hirekey: req.body.hirekey},
                                                 {$addToSet:{workers: staff._id}, $pull:{hirekey: req.body.hirekey}},
                                                 (error, update)=>{
                                    if(error){
                                        return res
                                           .status(401)
                                           .json(ERR("Error occured while saving new staff"));
                                       }else{  
                                           return res
                                                .status(200)
                                               .json(SUCCESS("You just joined " + key.name+ " as a worker"));
                                       }
                                }) 
                            }else{
                                return res
                                    .status(402)
                                    .json(ERR('Incorrect key!'));
                            }
                        })
                     }
                  })
                }

            })
        },
        uploadproduct: async(req, res, next)=>{
            //make upload async, prevent upload if file already exist
            //check with file name and price

            let payload = req.decoded;
            const files = req.files;
            try {
                let urls = [];
                //secure_url is the cloudinary key for the returned image url
                let multiple = async (path) => await uploadCloudinary(path);
                for(const file of files){
                    const {path} = file;

                const newPath = await multiple(path);
                urls.push(newPath);
                fs.unlinkSync(path);
                }
                if(urls){
                    Owner.findOne({_id: payload.owner}, (error, staff)=>{   
                        if(error){
                            return res
                                .status(400)
                                .json(ERR("Error encountered while fetching staff's Identity"));  
                        }
                        if(staff){
                            Store.findOne({$or:[{_ownerId: staff._id},{workers: staff._id}]}, (error, store)=>{
                                if(error){
                                    return res
                                        .status(400)
                                        .json(ERR('Problems experienced while trying to find existing store'));
                                }
                                if(store){
                                    //return res.status(200).json(SUCCESS(staff.username));
                                    
                                    Product.create({name: req.body.name,
                                                    desc: req.body.desc,
                                                    images: urls, 
                                                    price: req.body.price,
                                                    category: req.body.category,
                                                    uploadedby: staff.username,
                                                    store: store._id},
                                                    (error, product)=>{
                                        if(error){
                            console.log(error);
                                            return res
                                                .status(400)
                                                .json(ERR('Problems experienced while trying to create product'));
                                        }
                                        if(product){
                                            return res
                                                .status(200)
                                                .json(SUCCESS(product));
                                        }else{
                                            return res
                                                .status(400)
                                                .json(ERR('No product created'));
                                        }
                                    });
                                    
                                }else{
                                    return res
                                        .status(400)
                                        .json((ERR("You don't belong to any store.")));
                                }
                            })
                        }
                    })
                }else{
                    return res
                        .status(400)
                        .json(ERR("No urls created therefore nothing created or uploaded."));
                }
            } catch (e) {
                console.log("err:", e);
                return next(e);
            }
        },
        //remove product from store
        removeproduct:(req, res)=>{
                let payload = req.decoded;
                Owner.findOne({_id:payload.owner}, (error, staff)=>{
                    if(error){
                        return res
                            .status(400)
                            .json(ERR("Error fetching identity."));
                    }
                    if(staff.isAdmin === true){
                        Store.findOne({_ownerId: staff._id}, (error, store_admin)=>{
                            if(error){
                                return res
                                    .status(400)
                                    .json(ERR("Error encountered while searching for store Admin."));
                            }
                            if(store_admin){
                                Product.findOneAndRemove({$and:[{name: req.body.name}, {store: store_admin._id}]}, (error, product)=>{
                                    if(error){
                                        return res
                                            .status(400)
                                            .json(ERR("Error encountered while trying to remove product."));
                                    }if(product){
                                        return res
                                            .status(200)
                                            .json(SUCCESS(product.name + " removed from " + store_admin.name));
                                    }else{
                                        return res
                                            .status(400)
                                            .json(ERR("Product does not exist"));   
                                    }
                                })
                            }else{
                                return res
                                    .status(400)
                                    .json(ERR("You are not the Admin for the store you're trying to access."))
                            }
                        })
                    }else{
                        return res
                            .status(400)
                            .json(ERR("Only store admins can carry out this function."))
                    }
                })
        },
        removeworker:(req, res) =>{
            let payload = req.decoded;
            Owner.findOne({_id: payload.owner}, (error, owner)=>{//find signed in entity
                if(error){
                    return res
                        .status(400)
                        .json(ERR("Error encountered while fetching Identity."));
                }if(owner.isAdmin === true){ //is the signed in entity an admin whatsoever?
                    Owner.findOne({username: req.body.username}, (error, staff)=>{ //find the guy we're removing
                        if(error){
                            return res
                                .status(400)
                                .json(ERR("Error encountered while fetching Identity."));
                        }if(!staff){
                            return res
                                .status(400)
                                .json(ERR("The worker you intend to remove does not exist."));
                        }
                        if(staff.isAdmin === false){
                            Store.update({_ownerId: owner._id}, //signed in entity is store owner
                                            {$pull:{workers: staff._id}},
                                             (error, unstaffed)=>{
                                if(error){
                                    return res
                                        .status(400)
                                        .json(ERR("Error encountered while trying to remove worker"))
                                }if(unstaffed){
                                    sgMail.setApiKey(mailKey);
                                        var mail = {
                                                    from: owner.username+'@genkins.com',
                                                    to: staff.email,
                                                    subject: 'Work Relieve Notification',
                                                    text: 'Hello, '+ staff.username + '\n\n' + 'This is to officially inform you that you have been officially relieved of your official duties at '+unstaffed.name + '.' + '\n\n' + 'Thanks, Management.',
                                            };
                                    sgMail.send(mail, (error)=>{
                                        if(error){
                                            return res
                                                .status(401)
                                                .status(ERR("there's a problem in mail sending"))
                                        }
                                            return res
                                                .status(200)
                                                .json(SUCCESS(staff.username + ' has been relieved of their official duties and staff relieve mail has been sent to them, ' + staff.email))
                                    });
                                }else{
                                    return res
                                        .status(400)
                                        .json(ERR(staff.username + " never worked for you, so you can't remove them."))
                                }
                            })
                        }else{
                            return res
                                .status(400)
                                .json(ERR("Store owners can't be kicked out of their own store."));
                        }
                    })
                }else{
                    return res
                        .status(400)
                        .json(ERR("You do not have the privilege you intend to exercise"))
                }
            })
        }
    }