const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const msal = require('@azure/msal-node');
const path = require('path');
require('dotenv').config();

const middlewares = require('./middlewares');
// const api = require('./api');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const calendarRouter = require('./routes/calendar');

const app = express();
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

// app.get('/', (req, res) => {
//   res.json({
//     message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄'
//   });
// });

// app.use('/api/v1', api);

app.locals.users = {};

// MSAL config
const msalConfig = {
  auth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    authority: process.env.OAUTH_AUTHORITY,
    clientSecret: process.env.OAUTH_CLIENT_SECRET
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
};

// Create msal application object
app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);



// Flash middleware
app.use(flash());
// Session middleware
// NOTE: Uses default in-memory session store, which is not
// suitable for production
app.use(session({
  secret: 'your_secret_value_here',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy'
}));

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  // Check for an authenticated user and load
  // into response locals
  if (req.session.userId) {
    res.locals.user = app.locals.users[req.session.userId];
  }

  next();
});

// In-memory storage of logged-in users
// For demo purposes only, production apps should store
// this in a reliable storage





//view engine
app.set('views',path.join(__dirname,'views'));
app.set('view engine','hbs');


var hbs = require('hbs');
var parseISO = require('date-fns/parseISO');
var formatDate = require('date-fns/format');
// Helper to format date/time sent by Graph
hbs.registerHelper('eventDateTime', function(dateTime) {
  const date = parseISO(dateTime);
  return formatDate(date, 'M/d/yy h:mm a');
});

app.use('/',indexRouter)
app.use('/users',usersRouter)
app.use('/auth',authRouter)
app.use('/calendar', calendarRouter);







app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
