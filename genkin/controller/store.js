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
        create: async (req, res)=>{

            let payload = req.decoded;
            Owner.findOne({_id: payload.owner}, (error, staff)=>{
                if(error){
                    return res
                        .status(502)
                        .json(ERR('Problem encountered while searching for staff'));
                }
                else{
                    Store.findOne({_ownerId:  staff._id}, (error, store)=>{
                        console.log(staff._id);
                        if(error){
                            return res
                                .status(502)
                                .json(ERR('Error encountered while checking if you owned a store already'))
                        }
                        if(store){
                            return res
                                .status(403)
                                .json(ERR('No one can have more than 1 store at a time'));
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
                }if(staff){
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
                        .json(ERR('Problem encountered while searching for staff'));
                }else{
                  Store.findOne({$or:[{_ownerId: staff._id},{workers: staff._id}]}, (error, person)=>{
                    if(error){
                        return res
                            .status(402)
                            .json(ERR('Search for worker status failed'));
                    }  
                    if(person){
                        return res
                            .status(200)
                            .json(SUCCESS('You already belong to a store'));
                    }else{
                        Store.findOne({hirekey: req.body.hirekey}, (error, key)=>{
                            if(error){
                                return res
                                    .status(402)
                                    .json(ERR('Problem encountered while verifying your key'));
                            }if(key){
                                Store.updateOne({hirekey: req.body.hirekey}, {$addToSet:{workers: staff._id}, $pull:{hirekey: req.body.hirekey}}, (error, update)=>{
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
        }
    }