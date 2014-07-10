/**
 * Golden Applications.
 * 
 * This file is the entry point to the main application.  It lists module dependencies, sets up
 * environment variables, and starts a new server to listen to requests.
 *
 * TODO(erik): Make a grunt/gulp build system to compile models, views, from Source/ into Assets/js
 */

var express = require('express');
var app = express();
var db = require('./db');
var routes = require('./routes');
var user = require('./routes/user');
var conversation = require('./routes/conversation');
var group = require('./routes/group');
var post = require('./routes/post');
var http = require('http').Server(app);
var path = require('path');
var handlebars = require('express3-handlebars');
var passport = require('passport');

var io = require('socket.io')(http);

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
app.get('/signup', routes.signup);
app.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/login' }));
app.post('/user/create', user.create);
app.post('/conversation/create', conversation.create);
app.post('/group/create', group.create);
app.post('/post/create', post.create);

app.post('/user/delete', user.delete);
app.post('/conversation/delete', conversation.delete);
app.post('/group/delete', group.delete);
app.post('/post/delete', post.delete);

app.post('/user/update', user.update);
app.post('/conversation/update', conversation.update);
app.post('/group/update', group.update);
app.post('/post/update', post.update);

app.get('/user/search', user.search);

app.get('/all', conversation.getTestMessages);

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
