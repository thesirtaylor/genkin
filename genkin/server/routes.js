var express = require('express'),
    router = express.Router(),
    read = require('../controller/read')
    user = require('../controller/user'),
    owner = require('../controller/owner')


module.exports = function(app){

    //accounts routes
    router.get('/',read.index);//hello message

    /** User ROutes**/
    router.post('/user/signup', user.signup); //signup endpoint
    router.post('/user/uv', user.verificationtoken);//tokenconfirmation endpoint
    router.post('/user/rvt', user.resendverificationtoken);//resendtoken endpoint
    router.post('/user/signin', user.signin)//signin endpoint
    router.post('/user/prt', user.passwordresettoken)//passwordresetmail endpoint
    router.post('/user/rp', user.resetpassword)//passwordresetmail endpoint

    /* Owner Routes */
    router.post('/owner/signup', owner.signup);
    router.post('/owner/wv', owner.verificationtoken);
    router.post('/owner/rvt', owner.resendverificationtoken);
    router.post('/owner/signin', owner.signin);
    router.post('/owner/prt', owner.passwordresettoken);
    router.post('/owner/rp', owner.resetpassword);
    app.use(router);
}