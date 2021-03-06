const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 8080;

const urlDatabase = {
  "userRandomID": {
    "b2xVn2": {
      shortUrl: "b2xVn2",
      longUrl: "http://www.lighthouselabs.ca",
      createdDate: "2016-12-20",
      count: 0,
      uniqueCount: 8,
      visitor: [{id: "x131sax", timestamp: "12311112344"}]
    }
  }
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.set("view engine", "ejs");

app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect("/urls")
});

// Main Page (List page)
app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  let urls = urlsForUser(userId);
  let templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

// New
app.get("/urls/new", (req, res) => {
  // if user who is not logined in, redirect to login page
  let userId = req.session.user_id;
  if (!users[userId]) {
    res.redirect('/login');
    return;
  }
  let templateVars = {user: userId};
  res.render("urls_new", templateVars);
});

// Create
app.post("/urls", (req, res) => {
  let key = generateRandomString();
  let userId = req.session.user_id;

  // if userid not exist in database, add user id
  if (!urlDatabase[userId]) {
    urlDatabase[userId] = {};
  }

  //add url to database
  urlDatabase[userId][key] = {
    shortUrl: key,
    longUrl: req.body.longURL,
    createdDate: new Date().toLocaleString(),
    count: 0,
    uniqueCount:0,
    visitor: []
  };

  res.redirect("/urls"); // redirect to /urls
});

// Login page
app.get("/login", (req, res) => {
  let user = users[req.session.user_id];
  let templateVars = {user: user};
  res.render('login', templateVars);
});

// Login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // Check if user exist
  let userId = chkEmailExist(email);
  if(userId) {
    if (bcrypt.compareSync(password, users[userId].password)) {
      req.session.user_id = userId;
      res.redirect('/urls');
      return;
    } else {
      res.status(403).send('Password not found');
      return;
    }
  } else {
    res.status(403).send('Email not found');
    return;
  }
});

// Logout page
app.post("/logout", (req, res) => {
  req.session = null
  res.redirect('/login');
});

// Edit Page
app.get("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  let templateVars;
  if (userId) {
    let user = users[userId];
    let urls = urlsForUser(userId);
    let shortURL = isExistShortUrl(userId, req.params.id) ? req.params.id : "";
    let longURL = urls[req.params.id].longUrl;
    let visitor = urls[req.params.id].visitor;
    let count = urls[req.params.id].count;
    let uniqueCount = urls[req.params.id].uniqueCount;
    let createdDate = urls[req.params.id].createdDate;
    templateVars = { shortURL: shortURL, longUrl: longURL, user: user, visitor: visitor, count: count, uniqueCount: uniqueCount, createdDate: createdDate};
  } else {
    templateVars = {user: null};
  }

  res.render("urls_show", templateVars);
});

// URL Update (POST)
app.put("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  if (!users[userId]) {
    res.status(400).send('Only the owner (creator) of the URL can edit the link.');
    return;
  }

  urlDatabase[userId][req.params.id].longUrl = req.body.longURL;
  res.redirect("/urls");
});

// Delete url
app.delete("/urls/:id", (req, res) => {
  let userId = req.session.user_id;
  if (!users[userId]) {
    res.status(400).send('Only the owner (creator) of the URL can delete the link.');
    return;
  }

  delete urlDatabase[userId][req.params.id];
  res.redirect("/urls");
});

// Registration page
app.get("/register", (req, res) => {
  let user = users[req.session.user_id];
  let templateVars = {user: user};
  res.render("register", templateVars);
});

// Registration Handler
app.post("/register", (req, res) => {
  let userId = generateRandomString(); //getNewUserID
  let email = req.body.email;
  let password = req.body.password;

  if(!email || !password) { // check email and password are empty string
    res.status(400).send('Email or Password not entered');
    return;
  }

  let hashed_password = bcrypt.hashSync(password, 10);
  //create new user
  users[userId] = {id: userId, email: email, password: hashed_password};
  req.session.user_id = userId;
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = "";
  for (userId in urlDatabase) {
    for (shortUrl in urlDatabase[userId]) {
      if (shortUrl === req.params.shortURL) {
        longURL = urlDatabase[userId][shortUrl].longUrl;

        let visitor_id;
        // Unique visitor check
        if(!req.cookies["visitor_id"]) {
          //Generate visitor_id
          visitor_id = generateRandomString()
          res.cookie("visitor_id", visitor_id);

          urlDatabase[userId][shortUrl].uniqueCount = parseInt(urlDatabase[userId][shortUrl].uniqueCount) + 1;
        } else {
          visitor_id = req.cookies["visitor_id"];
        }

        // record visit
        let timestamp = new Date().toLocaleString();
        let visitData = {id: visitor_id, timestamp: timestamp };
        urlDatabase[userId][shortUrl].visitor.push(visitData);

        // visitor count increment
        urlDatabase[userId][shortUrl].count = parseInt(urlDatabase[userId][shortUrl].count) + 1;
        break;
      }
    }
  }

  if (!longURL) {
    res.status(403).send('URL not found');
    return;
  }
  res.redirect(longURL); // redirect to long url (real url)
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// check if shorturl exisit
function isExistShortUrl(userId, sUrl) {
  for (shortUrl in urlDatabase[userId]) {
    if (shortUrl === sUrl) {
      return true;
    }
  }
  return false;
}

// return userId if email exist of return false
function chkEmailExist(email) {
  for (userId in users) {
    if(users[userId].email === email) {
      return userId;
    }
  }
  return false;
}

// returns the subset of the URL database that belongs to the user with ID
function urlsForUser(id) {
  return urlDatabase[id];
}

//Generate Random String (6 characters);
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}