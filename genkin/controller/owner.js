/*
Controller for owner and staff
> sign up (max 5 accounts)
> log in 
> account verification 
> password reset
> logout
*/

var Owner = require('../model/owner').owner,
    Token = require('../model/owner').ownerverificationtoken,
    PasswordToken = require('../model/owner').ownerpasswordresettoken,
    ERR = require('../commons/errorResponse'),
    SUCCESS = require('../commons/successResponse'),
    sgMail = require('@sendgrid/mail'),
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10,
    crypto = require('crypto'),
    jwt = require('jsonwebtoken'),
    jwtsecret = require('../commons/jwtconfig').secret,
    jwtchecktoken = require('../commons/jwt').checkToken;


    module.exports = {

        signup:(req, res)=>{
            Owner.findOne({username: req.body.username}, (error, data)=>{
                if(error){
                    console.log('Error encountered while checking username');
                    return res
                        .status(400)
                        .json(ERR('Error encountered while checking username'));
                }else{
                    if(data){
                        console.log('Username already in use, try another.');
                        return res
                            .status(400)
                            .json(ERR('Username already in use, try another.'));
                    }
                    if (!data){
                        Owner.findOne({email: req.body.email}, (error, data)=>{
                            if(error){
                                console.log('Error encountered while checking email.');
                                return res
                                    .status(400)
                                    .json(ERR('Error encountered while checking email'));
                            }else{
                                if(data){
                                    console.log('You already signed up, reset password if forgotten.');
                                    return res
                                        .status(400)
                                        .json(ERR('You already signed up, reset password if forgotten.'))
                                }
                                if(!data){
                                    Owner.countDocuments({},(error, count) =>{
                                        if(error){
                                            console.log('Error occured while trying to count');
                                            return res
                                                .status(400)
                                                .json(ERR('Error occured while trying to count'));
                                        }else{
                                            if(count === 6){
                                                console.log('Maximum staff number reached, talk to the Director or CEO');
                                                return res
                                                    .status(400)
                                                    .json(ERR('Maximum staff number reached, talk to the Director or CEO'))
                                            }else{
                                                if(count < 5){
                                                    Owner.countDocuments({isAdmin: true}, (error, data)=>{
                                                        if(error){
                                                            console.log('Error occured while trying to count isAdmin');
                                                            return res
                                                                .status(400)
                                                                .json(ERR('Error occured while trying to count isAdmin'));  
                                                        }
                                                        if(data > 0){
                                                            Owner.create({email: req.body.email, password: req.body.password, username: req.body.username, isAdmin: false}, (error, data)=>{
                                                                if(error){
                                                                    return res
                                                                       .status(500)
                                                                       .json(ERR('Error occured while saving file'))
                                                                };
                                                                //if no error occured while trying to save file
                                                                Token.create({_ownerId: data._id, token: crypto.randomBytes(16).toString('hex')}, (error)=>{
                                                                   if(error){//if error occur while trying to send mail
                                                                        return res
                                                                           .status(500)
                                                                           .json(ERR('Error in token creation'));
                                                                   };
                                                                    //send the email  if no error occur 
                                                                    sgMail.setApiKey('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');  
                                                                   var mail = { from: 'no-reply@genkins.com',
                                                                                        to: req.body.email,
                                                                                        subject: 'Staff Account Verification Token',
                                                                                        text: 'Hello,\n\n' + 'Please verify your staff account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'};
                                                                   sgMail.send(mail, (error)=>{
                                                                       if(error){
                                                                           console.log('there\'s a problem in mail sending');
                                                                           return res
                                                                               .status(500)
                                                                               .json(ERR('Mail sending failed'));
                                                                       };
                                                                       res
                                                                       .status(200)
                                                                       .json(SUCCESS('Staff verification mail has been sent successfully to ' + req.body.email + '.'))
                                                                   })  
                                                                })
                                                            })
                                                        } else{
                                                            if(data < 1){
                                                                Owner.create({email: req.body.email, password: req.body.password, username: req.body.username, isAdmin: true}, (error, data)=>{
                                                                    if(error){
                                                                        return res
                                                                           .status(500)
                                                                           .json(ERR('Error occured while saving file'))
                                                                    };
                                                                    //if no error occured while trying to save file
                                                                    Token.create({_ownerId: data._id, token: crypto.randomBytes(16).toString('hex')}, (error)=>{
                                                                       if(error){//if error occur while trying to send mail
                                                                            return res
                                                                               .status(500)
                                                                               .json(ERR('Error in token creation'));
                                                                       };
                                                                        //send the email  if no error occur 
                                                                        sgMail.setApiKey('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');  
                                                                       var mail = { from: 'no-reply@genkins.com',
                                                                                            to: req.body.email,
                                                                                            subject: 'Administrator Account Verification Token',
                                                                                            text: 'Hello' + req.body.username +',' + '\n\nPlease verify your admin account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'};
                                                                       sgMail.send(mail, (error)=>{
                                                                           if(error){
                                                                               console.log('there\'s a problem in mail sending');
                                                                               return res
                                                                                   .status(500)
                                                                                   .json(ERR('Mail sending failed'));
                                                                           };
                                                                           res
                                                                           .status(200)
                                                                           .json(SUCCESS('Staff verification mail has been sent successfully to ' + req.body.email + '.'))
                                                                       })  
                                                                    })
                                                                })
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })    
        },
        verificationtoken:(req, res)=>{
            Token.findOne({token: req.body.token}, (error, token)=>{
                if(error){
                    return res
                        .status(400)
                        .json(ERR('Error encountered while looking for token'));
                }
                if(!token){
                    return res
                        .status(400)
                        .json(ERR('Unable to find a valid token or Token expired. Try Signing up again'))
                }
                else{
                    if(token){
                        Owner.findOne({_id: token._ownerId, email: req.body.email}, (error, data)=>{
                            if(error){
                                return res
                                    .status(400)
                                    .json(ERR('Error ecountered while checking for token verification.'));
                            }
                            if(!data){
                                return res
                                    .status(400)
                                    .json(ERR('No staff registered to this Verification token.'));
                            }
                            if(data.isVerified){
                                return res
                                    .status(400)
                                    .json(ERR('Staff has already been verified.'))
                            }
                            data.isVerified = true;
                            data.save((error)=>{
                                if(error){
                                    return res
                                        .status(400)
                                        .json(ERR('Problem occured while trying to save staff'));
                                }
                                return res
                                    .status(200)
                                    .json(SUCCESS('You just got verified. Please log in.'))
                            })
                        })
                        token.remove();
                    }
                }
            })
        },
        resendverificationtoken:(req, res)=>{
            Owner.findOne({email: req.body.email}, (error, data)=>{
                if(error){
                    return res
                        .status(400)
                        .json(ERR('Error occured while fetching user email'));
                }
                if(!data){
                    return res
                        .status(400)
                        .json(ERR('Email not signed up, we can\'t send token to an unknown email'))
                }else{
                    if(data.isVerified){
                        return res
                            .status(400)
                            .json(ERR('This account has been verified.'));
                    }
                
                Token.findOne({_ownerId: data._id}, (error, e)=>{
                    if(error){
                        return res
                            .status(401)
                            .json(ERR('Error encountered while searching for token.'))
                    }
                    if(e){
                        return res
                            .status(401)
                            .json(ERR('The last token you requsted hasn\'t expired. Check your email for it.'))
                    }else{
                    Token.create({_ownerId: data._id, token: crypto.randomBytes(16).toString('hex')}, (error)=>{
                        if(error){
                            return res
                                .status(400)
                                .json(ERR('Erro intoken creation'));
                        };
                        sgMail.setApiKey('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')
                        var mail = {from: 'no-reply@genkins.com',
                                    to: req.body.email,
                                    subject: 'Account Verification Token',
                                    text: 'Hello '+ req.body.username +',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'        
                                                    }
                        sgMail.send(mail, (error)=>{
                            if(error){
                                console.log('there\'s a problem in mail sending');
                                return res
                                    .status(500)
                                    .json(ERR('Mail sending failed'));
                            };
                             return res
                                .status(200)
                                .json(SUCCESS('Verification mail has been sent successfully to ' + req.body.email + '.'))
                                })
                            })
                        }
                    })
                }
            })
        },
        signin:(req, res)=>{
            Owner.findOne({$or:[{email: req.body.data}, {username: req.body.data}]}, (error, data)=>{
                if(error){
                    console.log('Error encountered while fetching user');
                    return res
                        .stataus(400)
                        .json(ERR('Error encountered while fetching user email'));
                }
                if(!data){
                    return res
                        .status(400)
                        .json(ERR('This sign in parameter is not associated with any account. Check, re-type and try again.'))
                }
                else{
                    if(data && Object.keys(data).length>0){
                        bcrypt.compare(req.body.password, data.password, (error, isMatch)=>{
                            if(error){
                                console.log('Error encountered while comparing password and hash');
                                return res
                                    .status(401)
                                    .json(ERR('Error encountered while comparing password and hash'));
                            }
                            if(!isMatch){
                                console.log('Password doesn\'t match with the hash in db');
                                return res
                                    .status(400)
                                    .json(ERR('Password doesn\'t match with the hash in db'));
                            }
                            else{
                                if(isMatch){
                                    if(!data.isVerified){
                                        return res
                                            .status(401)
                                            .json(ERR('Your Account has not been Verified.'))
                                    }
                                    jwt.sign({user: user.email}, jwtsecret, { expiresIn: '4h'}, (err, jtoken)=>{
                                        if(err){
                                            return res 
                                                .status(400)
                                                .json(ERR('Error while attempting to sign token'));
                                        }
                                        if(!jtoken){
                                            return res
                                                .status(400)
                                                .json(ERR('No token signed'))
                                        }else{
                                            return res
                                                .status(200)
                                                .json(SUCCESS(jtoken));
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })
        },
        passwordresettoken:(req, res)=>{
            Owner.findOne({email: req.body.email}, (error, data)=>{
                if(error){
                    return res
                        .status(400)
                        .json(ERR('Error encountered while fetching Staff.'));
                }
                if(!data){
                    return res
                        .status(400)
                        .json(ERR('Staff does not exist.'));
                }
                if(data){
                    PasswordToken.findOne({_ownerId: data._id},(error, e)=>{
                        if(error){
                            return res
                                .status(401)
                                .json(ERR('Error encountered while searching for token'))
                        }
                        if(e){
                            return res
                                .status(401)
                                .json(ERR('The last token you requested hasn\'t expired, check your email for it.'))
                        }
                        else{
                             PasswordToken.create({_ownerId: data._id, passwordResetToken:crypto.randomBytes(16).toString('hex')}, (error, token)=>{
                                     if(error){
                                          return res
                                              .status(401)
                                              .json(ERR('Token creation failed'));
                                      }
                        else{
                        if(token){
                            sgMail.setApiKey('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');
                            var mail = {
                                from: 'Password-Reset@genkins.com',
                                to: req.body.email,
                                subject: 'Password Reset Token',
                                text: 'Hello, '+ data.username+ '\n\n' + 'You applied to change your password \n\n' +'Activate Password Reset authorization by clicking this link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + PasswordToken.passwordResetToken + '.\n',
                            }
                            sgMail.send(mail, (error)=>{
                                if(error){
                                   return res
                                        .status(401)
                                        .json(ERR('there\'s a problem in mail sending'));
                                }
                                res
                                    .status(200)
                                    .json(SUCCESS('Password reset mail has been sent successfully to ' + req.body.email + '.'));
                                    })
                                }
                            }
                         })
                       }
                   })
                }
            })
        },
        resetpassword: (req, res)=>{
            PasswordToken.findOne({passwordResetToken: req.body.PasswordToken}, (error, token)=>{
                if(error){
                    return res
                        .status(401)
                        .json(ERR('Error while fetching token'))
                }
                if(!token){
                    return res
                        .status(401)
                        .json(ERR('Token not recognised'));
                }
                else{
                    if(token){
                        Owner.findOne({_id: token._ownerId, email: req.body.email}, (error, owner)=>{
                            if(error){
                                return res
                                    .status(401)
                                    .json(ERR('Data fetching error'));
                            }
                            if(!owner){
                                return res
                                    .status(401)
                                    .json(ERR('No staff linked to that Token'));
                            }
                            if(owner){
                                bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
                                    if(err) return (err);
                                    //hash password using the new salt
                                    bcrypt.hash(req.body.password, salt, function(err, hash){
                                        if(err) return (err);
                                        //override the cleartext password with the hashed one
                                        req.body.password = hash;
                                                          
                                    });
                                });
                                owner.password = req.body.password;
                                owner.save((error)=> {
                                    if(error){
                                        return res
                                           .status(401)
                                           .json(ERR('Problem occured while trying to change password'))
                                    };
                                    
                                    return res
                                        .status(200)
                                        .json(SUCCESS('Password Changed, work with new password.'));
                                });
                            }
                        })
                         token.remove();
                    }
                }
            })
        },
        /*
---------------------------------THESE ENDPOINTS REQUIRE OWNER SIGNED IN-----------------------------------
        */
        deletestaff:(req, res)=>{
            let payload = req.decoded;
            if(payload.isAdmin === true){
                Owner.findOne({username: req.body.username},(err, staff)=>{
                    if(err){
                        return res
                            .status(400)
                            .json(ERR('Problem encountered while trying to find user'));
                    };
                    if(!staff){
                        return res
                            .status(400)
                            .json(ERR('There is not staff with this Username'));
                    }else{
                        if(staff){
                            staff.remove(err=>{
                                if(err){
                                    return res
                                        .status(400)
                                        .json(ERR('Unable to remove staff account'))
                                }else{    
                                    sgMail.setApiKey('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');
                                     var mail = {
                                         from: 'administrator@genkins.com',
                                         to: staff.email,
                                         subject: 'Staff Relieve Notification',
                                         text: 'Hello, '+ req.body.username+ '\n\n' + 'This is to officially inform you that you have been officially relieved of your official duties at Genkins.'+'\n\n'+ 'Thanks, Management.',
                                     }
                                    sgMail.send(mail, (error)=>{
                                        if(error){
                                             return res
                                                .status(401)
                                                .json(ERR('there\'s a problem in mail sending'));
                                        }
                                            res
                                             .status(200)
                                             .json(SUCCESS(req.body.username + ' has been relieved of official duties and staff relieve mail has been sent to their mail ' + req.body.email));
                                    })
                                }                           
                            })
                        }
                    }
                })
            }else{
                return res
                    .status(400)
                    .json(ERR('Only the Administator can relieve staff of duty.'))
            }
        },
        uploadproduct:()=>{

        }
    }
