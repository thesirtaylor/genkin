//get all requirements 
var express = require('express'),//express
    app = express(),//invoke express
    config = require('./server/configure'),//configure server
    mongoose = require('mongoose'); //mongoose

app.set('views', __dirname+'/views'),//set views directory
app.set('port', process.env.PORT||3333),//set port to environment port or 3333
app = config(app); //invoke app config


mongoose.Promise = global.Promise// doesnt solves server timeout error
//mongoose.connect('mongodb://localhost/genkin'); //offline test database.
mongoose.connect('mongodb://127.0.0.1:27017/genkin', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
  .catch(error => console.log(error));//catch connection error if it occurs.
mongoose.connection.on('open', function(){//connection to mongoose
    console.log('Mongoose Connected.');//log connection message
});

app.listen(app.get('port'), function(){//listent to port
    console.log('Server running on port ' + app.get('port'))//log port listened to
});
