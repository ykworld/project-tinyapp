const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080;

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

// add Url
app.post("/urls", (req, res) => {
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL; // update database
  res.redirect("/urls"); // redirect to /urls
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL); // redirect to long url (real url)
});

// Login
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// Read Url
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longUrl: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

// Update Url
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// Delete Url
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
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