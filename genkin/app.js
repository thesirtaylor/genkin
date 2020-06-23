//get all requirements 
var dotenv = require('dotenv');
     dotenv.config();
var express = require('express'),//express
    app = express(),//invoke express
    configure = require('./server/configure'),//configure server
    mongoose = require('mongoose'); //mongoose

app.set('views', __dirname+'/views'),//set views directory
app.set('port', process.env.PORT||3333),//set port to environment port or 3333
app = configure(app); //invoke app config

    const date = new Date();
    const conDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}[${date.getHours()}:${date.getMinutes()}]`

//we define 2 connections here, to the mongodb and the express server
mongoose.Promise = global.Promise// doesnt solves server timeout error
//mongoose.connect('mongodb://localhost/genkin'); //offline test database.
// we use /genkin because genkin is the db name we'll be using 
//could have been /test if we want to use test db etc...
mongoose.connect('mongodb://127.0.0.1:27017/genkin', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
  .catch(error => console.log(error));//catch connection error if it occurs.
mongoose.connection.on('open', function(){//connection to mongoose
    console.log('Mongoose Connected.');//log connection message
});

app.listen(app.get('port'), function(){//listent to port
    console.log('Server running on port ' + app.get('port') + '\n'+ conDate)//log port listened to
});
