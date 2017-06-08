const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let user = users[req.cookies["user_id"]];
  console.log("user = " + user);
  let templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

// New
app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.cookies["username"]};
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
  res.clearCookie('username');
  res.redirect('/urls');
});

// Read
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longUrl: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

// Update
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// Delete
app.post("/urls/:id/delete", (req, res) => {
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
  let longURL = urlDatabase[req.params.shortURL];
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

//Generate Random String (6 characters);
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}