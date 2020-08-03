var express = require('express'),
    router = express.Router(),
    read = require('../controller/read'),
    upload = require('../commons/imageupload'),
    user = require('../controller/user'),
    owner = require('../controller/owner'),
    store = require('../controller/store'),
    verify = require('../commons/jwt').checkToken


module.exports = function(app){

    //accounts routes
    router.get('/',read.index);//hello message

    /** User Routes**/
    router.post('/user/signup', user.signup); //signup endpoint
    router.post('/user/uv', user.verificationtoken);//tokenconfirmation endpoint
    router.post('/user/rvt', user.resendverificationtoken);//resendtoken endpoint
    router.post('/user/signin', user.signin);//signin endpoint
    router.post('/user/prt', user.passwordresettoken);//passwordresetmail endpoint
    router.post('/user/rp', user.resetpassword);//passwordresetmail endpoint
    router.get('/user/pro', user.getAllproduct);
    router.get('/user/group', user.productcart);
    router.get('/user/:id', user.getproductsbyId);

    /* Owner Routes */
    router.post('/owner/signup', owner.signup);
    router.post('/owner/ov', owner.verificationtoken);
    router.post('/owner/rvt', owner.resendverificationtoken);
    router.post('/owner/signin', owner.signin);
    router.post('/owner/prt', owner.passwordresettoken);
    router.post('/owner/rp', owner.resetpassword);

    /* Store Routes */
    router.post('/store/create',verify, store.create);
    router.post('/store/genHirekey',verify, store.hireKey);
    router.post('/store/join', verify, store.joinstore);
    router.post('/store/removeproduct', verify, store.removeproduct);
    router.post('/store/removeworker', verify, store.removeworker);
    router.post('/store/upload', verify, upload.array('images', 4), store.uploadproduct);

    /*Sign in required*/
//    router.post('/owner/up', verify,upload.array('images', 4), owner.uploadproduct);
    app.use(router);
}