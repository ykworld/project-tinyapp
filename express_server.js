const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080;

const urlDatabase = {
  "userRandomID": {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  }
};

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

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.redirect("/urls")
});

// List
app.get("/urls", (req, res) => {
  let userId = req.cookies["user_id"];
  let user = users[userId];
  let urls = urlsForUser(userId);
  let templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

// New
app.get("/urls/new", (req, res) => {
  // if user who is not logined in, redirect to login page
  let userId = req.cookies["user_id"];
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
  urlDatabase[key] = req.body.longURL; // create url to database
  res.redirect("/urls"); // redirect to /urls
});

// Login page
app.get("/login", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render('login', templateVars);
});

// Login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  // Check if user exist
  for (userId in users) {
    if(users[userId].email === email) {
      if (users[userId].password === password) {
        res.cookie('user_id', userId);
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
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Read
app.get("/urls/:id", (req, res) => {
  let userId = req.cookies["user_id"];
  let templateVars;
  if (userId) {
    let user = users[userId];
    let urls = urlsForUser(userId);
    let shortURL = req.params.id;
    let longURL = urls[req.params.id];
    templateVars = { shortURL: shortURL, longUrl: longURL, user: user };
  } else {
    templateVars = {user: null};
  }

  res.render("urls_show", templateVars);
});

// Update
app.post("/urls/:id", (req, res) => {
  let userId = req.cookies["user_id"];
  if (!users[userId]) {
    res.status(400).send('Only the owner (creator) of the URL can edit the link.');
    return;
  }

  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// Delete
app.post("/urls/:id/delete", (req, res) => {
  let userId = req.cookies["user_id"];
  if (!users[userId]) {
    res.status(400).send('Only the owner (creator) of the URL can delete the link.');
    return;
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Registration page
app.get("/register", (req, res) => {
  let user = users[req.cookies["user_id"]];
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

  //create new user
  users[userId] = {id: userId, email: email, password: password};
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = "";
  for (userId in urlDatabase) {
    for (shortUrl in urlDatabase[userId]) {
      if (shortUrl === req.params.shortURL) {
        longURL = urlDatabase[userId][shortUrl];
        break;
      }
    }
  }

  if (!longURL) {
    res.status(403).send('URL not found');
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

// returns the subset of the URL database that belongs to the user with ID
function urlsForUser(id) {
  return urlDatabase[id];
}

//Generate Random String (6 characters);
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}