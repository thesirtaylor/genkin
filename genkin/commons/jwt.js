var  jwt = require('jsonwebtoken'),
     jwtsecret = require('./jwtconfig').secret
     ERR = require('./errorResponse'),
     SUCCESS = require('./successResponse'),
//middle-ware to check if user is signed in, simply verifies the token signed at signin
 module.exports = {
     checkToken: (req, res, next)=>{
        let token = req.headers['x-access-token'] || req.headers['authorization'];
        if (token.startsWith('Bearer')){
            //remove Bearer from string
            token = token.slice(7, token.length);
        }

        if(token){
            jwt.verify(token, jwtsecret, (err, decoded)=>{
                if (err){
                    return res
                        .status(401)
                        .json(ERR('Token is not valid'));
                }else{
                    req.decoded = decoded;
                    next();
                }
            });
        }else{
            return res
                    .status(400)
                    .json(ERR('Auth token is not supplied'));
        }
     }
 }