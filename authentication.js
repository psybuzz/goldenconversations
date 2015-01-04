var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var db = require('./db');
var bcrypt = require('bcrypt');

passport.use(new LocalStrategy(
  function(username, password, done) {
    db.models.User.findOne({ username: username }, function(err, user) {
      console.log(user);
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      bcrypt.compare(password, user.password, function(err, isMatch) {
          if (isMatch === true && !err) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Incorrect password.' });
          }
      });
    });
  }
));
