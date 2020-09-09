/*
Controller for owner and staff
> sign up
> log in 
> account verification 
> password reset
> logout
*/

var Owner = require("../model/owner").owner,
  Token = require("../model/owner").ownerverificationtoken,
  PasswordToken = require("../model/owner").ownerpasswordresettoken,
  Product = require("../model/product").product,
  ERR = require("../commons/errorResponse"),
  SUCCESS = require("../commons/successResponse"),
  sgMail = require("@sendgrid/mail"),
  bcrypt = require("bcryptjs"),
  SALT_WORK_FACTOR = 10,
  uploadCloudinary = require("../commons/cloudinary"),
  fs = require("fs"),
  crypto = require("crypto"),
  jwt = require("jsonwebtoken"),
  jwtsecret = process.env.JWTSECRET;
var mailKey = process.env.SGMAIL_APIKEY;

module.exports = {
  signup: (req, res) => {
    Owner.findOne(
      { $or: [{ username: req.body.username }, { email: req.body.email }] },
      (error, data) => {
        if (error) {
          return res
            .status(400)
            .json(ERR("Error encountered while checking data"));
        } else {
          if (data && Object.keys(data).length > 0) {
            return res
              .status(400)
              .json(ERR("Username or Email already in use, try another."));
          }
          if (!data) {
            Owner.create(
              {
                email: req.body.email,
                password: req.body.password,
                username: req.body.username,
              },
              (error, data) => {
                if (error) {
                  return res
                    .status(500)
                    .json(ERR("Error occured while saving file"));
                }
                //if no error occured while trying to save file
                Token.create(
                  {
                    _ownerId: data._id,
                    token: crypto.randomBytes(16).toString("hex"),
                  },
                  (error, token) => {
                    if (error) {
                      //if error occur while trying to send mail
                      return res
                        .status(500)
                        .json(ERR("Error in token creation"));
                    }
                    //send the email  if no error occur
                    sgMail.setApiKey(mailKey);
                    var mail = {
                      from: "no-reply@genkins.com",
                      to: req.body.email,
                      subject: "Account Verification Token",
                      //text: 'Hello' +' ' + req.body.username +',' + '\n\nPlease verify your admin account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'
                      text: token.token,
                    };
                    sgMail.send(mail, (error) => {
                      if (error) {
                        return res.status(500).json(ERR("Mail sending failed"));
                      }
                      return res
                        .status(200)
                        .json(
                          SUCCESS(
                            "Verification mail has been sent successfully to " +
                              req.body.email +
                              "."
                          )
                        );
                    });
                  }
                );
              }
            );
          }
        }
      }
    );
  },
  verificationtoken: (req, res) => {
    Token.findOne({ token: req.body.token }, (error, token) => {
      if (error) {
        return res
          .status(400)
          .json(ERR("Error encountered while looking for token"));
      }
      if (!token) {
        return res
          .status(400)
          .json(
            ERR(
              "Unable to find a valid token or Token expired. Try requesting for a new token if you are sure you signed up"
            )
          );
      } else {
        if (token) {
          Owner.findOne(
            { _id: token._ownerId, email: req.body.email },
            (error, data) => {
              if (error) {
                return res
                  .status(400)
                  .json(
                    ERR(
                      "Error ecountered while checking for token verification."
                    )
                  );
              }
              if (!data) {
                return res
                  .status(400)
                  .json(
                    ERR(
                      "Make sure your form is correctly filled, either your token or your email is wrong"
                    )
                  );
              }
              if (data.isVerified) {
                return res
                  .status(400)
                  .json(ERR("Staff has already been verified."));
              }
              data.isVerified = true; //verify token if it hasn't
              //test to see if save callback is necessary
              data.save((error) => {
                if (error) {
                  return res
                    .status(400)
                    .json(ERR("Problem occured while trying to save staff"));
                }
                return res
                  .status(200)
                  .json(SUCCESS("You just got verified. Please log in."));
              });
            }
          );
          token.remove();
        }
      }
    });
  },
  resendverificationtoken: (req, res) => {
    Owner.findOne({ email: req.body.email }, (error, data) => {
      if (error) {
        return res.status(400).json(ERR("Error occured while fetching email"));
      }
      if (!data) {
        return res
          .status(400)
          .json(
            ERR("Email not signed up, we can't send token to an unknown email")
          );
      } else {
        if (data.isVerified) {
          return res.status(400).json(ERR("This account has been verified."));
        }

        Token.findOne({ _ownerId: data._id }, (error, e) => {
          if (error) {
            return res
              .status(401)
              .json(ERR("Error encountered while searching for token."));
          }
          if (e) {
            return res
              .status(401)
              .json(
                ERR(
                  "The last token you requsted hasn't expired. Check your email for it."
                )
              );
          } else {
            Token.create(
              {
                _ownerId: data._id,
                token: crypto.randomBytes(16).toString("hex"),
              },
              (error, tokken) => {
                if (error) {
                  return res.status(400).json(ERR("Error in token creation"));
                }
                sgMail.setApiKey(mailKey);
                var mail = {
                  from: "no-reply@genkins.com",
                  to: req.body.email,
                  subject: "Account Verification Token",
                  //text: 'Hello '+ req.body.username +',\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + Token.token + '.\n'
                  text: tokken.token,
                };

                sgMail.send(mail, (error) => {
                  if (error) {
                    return res.status(500).json(ERR("Mail sending failed"));
                  }
                  return res
                    .status(200)
                    .json(
                      SUCCESS(
                        "Verification mail has been sent successfully to " +
                          req.body.email +
                          "."
                      )
                    );
                });
              }
            );
          }
        });
      }
    });
  },
  signin: (req, res) => {
    Owner.findOne(
      { $or: [{ email: req.body.data }, { username: req.body.data }] },
      (error, owner) => {
        if (error) {
          return res
            .status(400)
            .json(ERR("Error encountered while fetching user email"));
        }
        if (!owner) {
          return res
            .status(400)
            .json(
              ERR(
                "This sign in parameter is not associated with any account. Check, re-type, and try again."
              )
            );
        } else {
          if (owner && Object.keys(owner).length > 0) {
            bcrypt.compare(
              req.body.password,
              owner.password,
              (error, isMatch) => {
                if (error) {
                  return res
                    .status(401)
                    .json(
                      ERR("Error encountered while comparing password and hash")
                    );
                }
                if (!isMatch) {
                  return res
                    .status(400)
                    .json(ERR("Password doesn't match with the hash in db"));
                } else {
                  if (isMatch) {
                    if (!owner.isVerified) {
                      return res
                        .status(401)
                        .json(ERR("Your Account has not been Verified."));
                    }
                    jwt.sign(
                      { owner: owner._id },
                      jwtsecret,
                      { expiresIn: "4h" },
                      (err, jtoken) => {
                        if (err) {
                          return res
                            .status(400)
                            .json(ERR("Error while attempting to sign token"));
                        }
                        if (!jtoken) {
                          return res.status(400).json(ERR("No token signed"));
                        } else {
                          return res.status(200).json(SUCCESS(jtoken));
                        }
                      }
                    );
                  }
                }
              }
            );
          }
        }
      }
    );
  },
  passwordresettoken: (req, res) => {
    Owner.findOne({ email: req.body.email }, (error, data) => {
      if (error) {
        return res
          .status(400)
          .json(ERR("Error encountered while fetching Staff."));
      }
      if (!data) {
        return res.status(400).json(ERR("Staff does not exist."));
      }
      if (data) {
        PasswordToken.findOne({ _ownerId: data._id }, (error, e) => {
          if (error) {
            return res
              .status(401)
              .json(ERR("Error encountered while searching for token"));
          }
          if (e) {
            return res
              .status(401)
              .json(
                ERR(
                  "The last token you requested hasn't expired, check your email for it."
                )
              );
          } else {
            PasswordToken.create(
              {
                _ownerId: data._id,
                token: crypto.randomBytes(16).toString("hex"),
              },
              (error, tokken) => {
                if (error) {
                  return res.status(401).json(ERR("Token creation failed"));
                }
                if (tokken) {
                  sgMail.setApiKey(mailKey);
                  let mail = {
                    from: "Password-Reset@genkins.com",
                    to: req.body.email,
                    subject: "Password Reset Token",
                    //text: 'Hello, '+ data.username+ '\n\n' + 'You applied to change your password \n\n' +'Activate Password Reset authorization by clicking this link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + PasswordToken.passwordResetToken + '.\n',
                    text: tokken.token,
                  };
                  sgMail.send(mail, (error) => {
                    if (error) {
                      return res
                        .status(401)
                        .json(ERR("there's a problem in mail sending"));
                    }
                    return res
                      .status(200)
                      .json(
                        SUCCESS(
                          "Password reset mail has been sent successfully to " +
                            req.body.email +
                            "."
                        )
                      );
                  });
                } else {
                  return res.status(401).json(ERR("No token created"));
                }
              }
            );
          }
        });
      }
    });
  },
  resetpassword: (req, res) => {
    PasswordToken.findOne(
      { passwordResetToken: req.body.passwordResetToken },
      (error, token) => {
        if (error) {
          return res.status(401).json(ERR("Error while fetching token"));
        }
        if (!token) {
          return res.status(401).json(ERR("Token not recognised"));
        } else {
          if (token) {
            Owner.findOne(
              { _id: token._ownerId, email: req.body.email },
              (error, owner) => {
                if (error) {
                  return res.status(401).json(ERR("Data fetching error"));
                }
                if (!owner) {
                  return res
                    .status(401)
                    .json(ERR("No staff linked to that Token"));
                }
                if (owner) {
                  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
                    if (err) return err;
                    //hash password using the new salt
                    bcrypt.hash(req.body.password, salt, function (err, hash) {
                      if (err) return err;
                      //override the cleartext password with the hashed one
                      req.body.password = hash;
                    });
                  });
                  owner.password = req.body.password;
                  owner.save((error) => {
                    if (error) {
                      return res
                        .status(401)
                        .json(
                          ERR("Problem occured while trying to change password")
                        );
                    }

                    return res
                      .status(200)
                      .json(
                        SUCCESS("Password Changed, work with new password.")
                      );
                  });
                }
              }
            );
            token.remove();
          }
        }
      }
    );
  },
};
