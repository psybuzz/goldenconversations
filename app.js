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
var password = require('./routes/password');
var http = require('http').Server(app);
var path = require('path');
var handlebars = require('express3-handlebars');
var passport = require('passport');
var io = require('socket.io')(http);

// Passport
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'mr tolkein' }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.models.User.findById(id, function(err, user) {
    done(err, user);
  });
});
var login = require('./authentication');

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.csrf());
app.use(function (req, res, next) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  res.locals.csrfToken = req.csrfToken();
  console.log(res.locals.csrfToken)
  next();
})


// Routes.
app.use(app.router);

app.get('/', routes.home);
app.get('/testing', routes.testing);
app.get('/landing', routes.landing);
app.get('/signup', routes.signup);
app.get('/login', routes.login);
app.get('/signup', routes.signup);
app.post('/login', passport.authenticate('local'), 
	function (req, res){
      res.send({
          success: true
      });
	},
	function (req, res){
      res.send({
          success: false,
      });
	}
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

app.post('/user/create', user.create);
app.post('/conversation/create', conversation.create);
app.post('/group/create', group.create);
app.post('/post/create', post.create);

app.post('/user/delete', user.delete);
app.post('/conversation/leave', conversation.leave);
app.post('/conversation/delete', conversation.delete);
app.post('/group/delete', group.delete);
app.post('/post/delete', post.delete);

app.post('/user/update', user.update);
app.post('/conversation/update', conversation.update);
app.post('/group/update', group.update);
app.post('/post/update', post.update);

app.get('/user/search', user.search);
app.get('/conversation/search', conversation.search)	// must come before /conversation/:id
app.get('/conversation/posts', conversation.allPosts);

app.get('/home', routes.home);
app.get('/conversation/:id', routes.conversation);
app.get('/halloffame', routes.halloffame);
app.get('/group/:id', routes.group);
app.get('/account', routes.account);

app.get('/forgot', password.forgotPassword);
app.post('/forgot', password.forgotPasswordRequest);
app.get('/reset/:token', password.resetPasswordGet);
app.post('/reset', password.resetPasswordPost);

app.get('/all', conversation.getTestMessages);

app.use(routes.error404);
app.use(routes.error500)

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
