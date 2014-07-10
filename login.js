var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var db = require('./db');

passport.use(new LocalStrategy(
  function(username, password, done) {
    db.models.User.findOne({ username: username }, function(err, user) {
      console.log(user);
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!validPassword(user, password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

function validPassword(user, password){
  return user.password === password;
}