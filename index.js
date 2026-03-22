const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session); // пакет для сесій
const hbs = require("hbs");
const { engine } = require("express-handlebars");
const path = require("path");
const { requireLogin, requireAdmin } = require("./middleware");

const zagolovok = "Облік конференцій";
const app = express();
app.use(express.static('img'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const pool = mysql.createPool({
  connectionLimit: 5,
  host: "localhost",
  user: "root",
  database: "konferentsiyi_mohylna",
  password: ""
});
global.pool = pool;

const sessionStore = new MySQLStore({}, pool.promise());

app.use(session({
  key: 'session_cookie_name',
  secret: 'supersecret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));
app.use((req, res, next) => {
  res.locals.username = req.session.username || null;
  res.locals.isAdmin = req.session.right === "admin";
  next();
});

app.engine("hbs", engine({
  layoutsDir: "views",
  defaultLayout: "index",
  extname: "hbs",
  partialsDir: "views"
}));
app.set("view engine", "hbs");
global.zagolovok = zagolovok;

app.get("/", (req, res) => {
  res.render("start", {
    zagolovok: zagolovok,
    username: req.session.username || null,
    isAdmin: req.session.right === "admin" ? true : false
});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Сервер запущено на порту " + PORT));

const kafedry = require('./kafedry');
kafedry(app);

const spivrobitnyky = require('./spivrobitnyky');
spivrobitnyky(app);

const konferentsiyi = require('./konferentsiyi');
konferentsiyi(app);

app.get("/konf_top", requireAdmin, (req, res) => {
  pool.query(`
    SELECT 
      konferentsiyi.nazva_conferentsiyi,
      DATE_FORMAT(konferentsiyi.data_pochatku, '%d.%m.%Y') AS data_pochatku,
      DATE_FORMAT(konferentsiyi.data_zakinchennya, '%d.%m.%Y') AS data_zakinchennya,
      COUNT(uchasnyky.id_uchasnyky) AS kilkist
    FROM konferentsiyi
    LEFT JOIN uchasnyky 
      ON uchasnyky.id_conferentsiyi = konferentsiyi.id_conferentsiyi
    GROUP BY
      konferentsiyi.nazva_conferentsiyi,
      konferentsiyi.data_pochatku,
      konferentsiyi.data_zakinchennya
    ORDER BY kilkist DESC
    LIMIT 10
  `, (err, data) => {
    if (err) {
      console.log(err);
      return res.send("Помилка SQL");
    }
    res.render("konf_top", {
      conf_top: data,
      zagolovok: zagolovok
    });
  });
});

app.get("/kafedry_top", requireAdmin, (req, res) => {
  pool.query(`
    SELECT 
      kafedry.nazva_kafedry,
      kafedry.roztashuvannya,
      COUNT(konferentsiyi.id_conferentsiyi) AS kilkist
    FROM kafedry
    LEFT JOIN spivrobitnyky 
      ON spivrobitnyky.id_kafedry = kafedry.id_kafedry
    LEFT JOIN konferentsiyi 
      ON konferentsiyi.id_spivrobitnyky = spivrobitnyky.id_spivrobitnyky
    GROUP BY 
      kafedry.nazva_kafedry,
      kafedry.roztashuvannya
    ORDER BY kilkist DESC
    LIMIT 10
  `, (err, data) => {
    if (err) {
      console.log(err);
      return res.send("Помилка SQL");
    }
    res.render("kafedry_top", {
      kafedry_top: data,
      zagolovok: zagolovok
    });
  });
});

app.get("/misce_top", requireAdmin, (req, res) => {
  pool.query(`
    SELECT 
      misce,
      COUNT(id_uchasnyky) AS kilkist
    FROM uchasnyky
    GROUP BY misce
    ORDER BY kilkist DESC
    LIMIT 10
  `, (err, data) => {
    if (err) return res.send("Помилка SQL");
    res.render("misce_top", { misce_top: data, zagolovok, bootstrap_v: true });
  });
});

app.post("/login", function(req, res) {
  const e_mail = req.body.username;
  const parol = req.body.password;
  pool.query(
    "SELECT e_mail, parol, prava FROM uchasnyky WHERE e_mail=? AND parol=?",
    [e_mail, parol],
    function(err, data) {
      if (err) return console.log(err);
        if (data.length > 0) {
          req.session.username = data[0].e_mail;
          req.session.right = data[0].prava;
          return res.redirect("/konferentsiyi");
        } else {
        return res.status(401).send("Невірний логін або пароль");
        }     
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if(err) console.log(err);
    res.redirect("/");
  });
});