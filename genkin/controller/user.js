/*
Controller for user--
> sign up ~
> log in ~
> account verification ~
> password reset ~
> logout
> set full name and phone number
>delivery address should be set during order//
*/
var User = require('../model/user').user,
    Token = require('../model/user').userverificationtoken,
    PasswordToken = require('../model/user').userpasswordresettoken,
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
        //endpoint methods inhere
        //when users sign up we issue them a confirmation email to check if email is real

        signup: (req, res)=>{

            User.findOne({email: req.body.email}, (error, data)=>{
                if(error){//check for any error that would make data unavilable
                    console.log('something went wrong');
                    return res
                        .status(400)
                        .json(ERR('something went wrong'));
                 }//else if no error
                 else{
                if(data && Object .keys(data).length>0){//check if data alrady exits in the collection
                       return res
                        .status(500)
                        .json(ERR('You already signed up, reset password if forgotten'));
                       
                       //we could just save the data to the db or send the user a verification code. we'd send a code!
                
                   }else{//else if the data doesn't exists in the collection

                     User.create({email: req.body.email, password: req.body.password}, (error, data)=>{
                         if(error){
                             return res
                                .status(500)
                                .json(ERR('Error occured while saving file'))
                         };
                         //if no error occured while trying to save file
                         Token.create({_userId: data._id, token: crypto.randomBytes(16).toString('hex')}, (error)=>{
                            if(error){//if error occur while trying to send mail
                                 return res
                                    .status(500)
                                    .json(ERR('Error in token creation'));
                            };
                             //send the email  if no error occur 
                             sgMail.setApiKey('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');  
                            var mail = { from: 'no-reply@genkins.com',
                                                 to: req.body.email,
                                                 subject: 'Account Verification Token',
                                                 text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'};
                            sgMail.send(mail, (error)=>{
                                if(error){
                                    console.log('thers a problem in mail sending');
                                    return res
                                        .status(500)
                                        .json(ERR('Mail sending failed'));
                                };
                                res
                                .status(200)
                                .json(SUCCESS('Verification mail has been sent successfully to ' + req.body.email + '.'))
                            })  
                         })
                     })
                   }
                }
            })
        },
        /** 
        after signup, the confrimation link takes user (after clicking on it) to a token confrimation form
        where the user would be asked to provide their email again.
        the token would be embedded in the form as a hidden input 
        **/
        verificationtoken:(req, res)=>{
            Token.findOne({token: req.body.token}, function(error, token){
                if (error){//error occurred or token expired
                    return res
                        .status(400)
                        .json(ERR('Error encountered while looking for token'));
                }
                if(!token){
                    return res
                        .status(400)
                        .json(ERR('Unable to find a valid token or Token expired. Try Signing up again'));
                }else{
                    if(token){//if we found token
                        User.findOne({_id: token._userId, email: req.body.email}, (error, data)=>{
                             if(error){
                                 return res
                                    .status(400)
                                    .json(ERR('Error ecountered while checking for token verification.'))
                             };
                             if(!data){
                                 return res
                                    .status(400)
                                    .json(ERR('No user registered to this Verification token.'))
                             }
                             if(data.isVerified){
                                 return res
                                    .status(400)
                                    .json(ERR('User has already been verified'))
                             }
                             //Verify and save the user
                             data.isVerified = true;
                             data.save((error)=>{
                                 if(error){
                                     return res
                                        .status(400)
                                        .json(ERR('Problem occured while trying to save user'))
                                 }
                                 return res
                                    .status(200)
                                    .json(SUCCESS('You just got verified. Please log in.'));
                             })
                        })
                        token.remove();
                    }
                }
            })
        },
        //provided a user's token expires and we need to resend it
        resendverificationtoken:(req, res)=>{
            User.findOne({email: req.body.email}, (error, data)=>{
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
                
                Token.findOne({_userId: data._id}, (error, e)=>{
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
                    Token.create({_userId: data._id, token: crypto.randomBytes(16).toString('hex')}, (error)=>{
                        if(error){//if error occur while trying to send mail
                             return res
                                .status(500)
                                .json(ERR('Error in token creation'));
                    }; 
                    //send the email  if no error occur 
                    sgMail.setApiKey('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');  
                    var mail = { from: 'no-reply@genkins.com',
                                         to: req.body.email,
                                         subject: 'Account Verification Token',
                                         text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'};
                    sgMail.send(mail, (error)=>{
                        if(error){
                            console.log('thers a problem in mail sending');
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
            User.findOne({email: req.body.email}, (error, user)=>{
                if(error){
                    return res
                        .status(401)
                        .json(ERR('Error encountered while fetching user email'))
                }
                if(!user){
                    return res
                        .status(401)
                        .json(ERR('This email address ' + req.body.email + ' is not associated with any account. Re-type your email address and try again.'))
                }
                else{
                    if(user && Object.keys(user).length>0){
                       bcrypt.compare(req.body.password, user.password, (error, isMatch)=>{
                            if(error){
                                return res
                                    .status(401)
                                    .json(ERR('Error encountered while comparing password and hash'));
                            }
                            if(!isMatch){
                                return res
                                    .status(400)
                                    .json(ERR('Password doesn\'t match with the hash in db'));
                            }
                            else{
                                if(isMatch){
                                    if(!user.isVerified){
                                        return res
                                            .status(401)
                                            .json(ERR('Your Account has not been Verified.'))
                                    }
                                   jwt.sign({user: user._id}, jwtsecret, { expiresIn: '4h'}, (err,jtoken)=>{
                                       if(err){
                                           return res
                                            .status(400)
                                            .json(ERR('Error while attemting to sign token'));
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
            User.findOne({email: req.body.email}, (error, data)=>{
                if(error){
                    return res
                        .status(401)
                        .json(ERR('Error encountered while fetching user '));
                }
                if(!data){
                    return res
                        .status(400)
                        .json(ERR('User does not exist.'));
                }
                if(data){
                    PasswordToken.findOne({_userId: data._id},(error, e)=>{
                        if(error){
                            return res
                                .status(401)
                                .json(ERR('Error encountered while searching for token'));
                        }
                        if(e){
                            return res
                                .status(401)
                                .json(ERR('The last token you requested hasn\'t expired, check your email for it.'))
                        }
                        else{
                            PasswordToken.create({_userId: data._id, passwordResetToken: crypto.randomBytes(16).toString('hex')}, (error, token)=>{
                                    if(error){
                                        return res
                                            .status(401)
                                            .json(ERR('TOken creation failed'))
                        }
                        else{
                        if(token){
                            sgMail.setApiKey('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');  
                            var mail = {
                                 from: 'Password-Reset@genkins.com',
                                 to: req.body.email,
                                 subject: 'Password Reset Token',
                                 text: 'Hello, '+ data.fullname+ '\n\n' + 'You applied to change your password \n\n' +'Activate Password Reset authorization by clicking this link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + PasswordToken.passwordResetToken + '.\n'};
                            sgMail.send(mail, (error)=>{
                                if(error){
                                    return res
                                        .status(401)
                                        .json(ERR('Mail sending failed'));
                                }
                                res
                                     .status(200)
                                     .json(SUCCESS('Password reset mail has been sent successfully to ' + req.body.email + '.'))
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
            PasswordToken.findOne({passwordResetToken: req.body.passwordResetToken}, (error, token)=>{
                if(error){
                    return res
                        .status(401)
                        .json(ERR('Error while fetching token'));
                }
                if(!token){
                    return res
                        .status(401)
                        .json(ERR('Token not recognised'));
                }
                else{
                    if(token){
                        User.findOne({_id: token._userId, email: req.body.email}, (error, user)=>{
                            if(error){
                                return res
                                    .status(401)
                                    .json(ERR('Data fetching error'));
                            }
                            if(!user){
                                return res
                                    .status(401)
                                    .json(ERR('No user linked to that Token'));
                            }
                            if(user){
                                bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
                                    if(err) return (err);
                                    //hash password using the new salt
                                    bcrypt.hash(req.body.password, salt, function(err, hash){
                                        if(err) return (err);
                                        //override the cleartext password with the hashed one
                                        req.body.password = hash;
                                                          
                                    });
                                });
                                user.password = req.body.password;
                                user.save((error)=> {
                                    if(error){
                                        return res
                                           .status(401)
                                           .json(ERR('Problem occured while trying to change password'))
                                    };
                                    
                                    return res
                                        .status(200)
                                        .json(SUCCESS('Password Changed, Shop with new password.'));
                                });
                                   
                            }
                            
                        })
                        token.remove();
                    }
                }
            })
        },

    }