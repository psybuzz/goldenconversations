/**
 * Golden Applications.
 * 
 * This file is the entry point to the main application.  It lists module dependencies, sets up
 * environment variables, and starts a new server to listen to requests.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var messaging = require('./routes/messaging');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');
var db = require('./db');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', handlebars({
	extname: '.html'
}));
app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/all', messaging.getMessage);
app.post('/post', messaging.addMessage);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// TODO(erik): Setup socket.io chat relay for realtime updates.
// var io = require('socket.io')(http);

// io.on('connection', function(socket){
//   console.log('a user connected');
// });
