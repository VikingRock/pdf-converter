/**
 * Created by aliaksandrzinchuk on 9/14/16.
 */
var express = require('express');
var certificateController = require('./controllers/certificateController');
var app = express();

//template engine
app.set('view engine', 'ejs');

//static files
app.use(express.static('./public'));

//firing controllers
certificateController(app);

//listen to port
app.listen(3000);
console.log('Listening to the port 3000');
