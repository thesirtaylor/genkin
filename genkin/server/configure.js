/*
this module configures (requires and use all important application level middlewares) 
the web app and is exported into 
app.js where the app server is finally defined
*/

var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    //errorHandler = require('errorHandler'),
    routes = require('./routes');

module.exports = function(app){
    app.use(morgan('dev'));
    /**app.use(bodyParser.urlencoded({'extended:true'}));
    
    app.use(bodyParser({
        uploadDir:path.join(__dirname,'public/upload/temp');   
    }));**/
    app.use(bodyParser.json());
    //app.use(methodOverride());
    //app.use(cookieParser('09178'));
    // Using the extended option tells body-parser to use the qs library to parse the URL-encoded data
    //This allows for things like objects and arrays to be encoded into the URL-encoded forma
    //apart from urlencoded, we can also have json, raw or text, depending on what we need
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(methodOverride());
    app.use(allowCrossDomain);//allow cross domain access
    //routes(app);
    app.use('/public/',express.static(path.join(__dirname,'../public')));
    
    //if('development' === app.get('env')){
      //  app.use(errorHandler());
    //}
    
    routes(app);
    return app;
};


var allowCrossDomain = function(req,res,next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers','Content-Type');

    console.log(req.body);

    next();
}