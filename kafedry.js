const header = global.zagolovok;
const pool = global.pool;

const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const hbs = require("hbs");
const { engine } = require("express-handlebars");
const path = require('path');
const zagolovok = "Облік конференцій";
const app = express();
const { requireLogin, requireAdmin } = require("./middleware");

module.exports = function(app) {
  app.get("/kafedry", requireLogin, function (req, res) {
      pool.query(
        "SELECT id_kafedry, nazva_kafedry, roztashuvannya FROM kafedry",
        function (err, data) {
          if (err) return console.log(err);
          res.render("kafedry.hbs", {
            kafedry: data,
            zagolovok: zagolovok
          });
        }
      );
  });

app.get("/create", requireAdmin, function(req, res) {
  res.render("create.hbs", {
    zagolovok: zagolovok
  });
});

app.post("/create", urlencodedParser, requireAdmin, function (req, res) {
    const nazva = req.body.nazva_kafedry;
    const roztashuvannya = req.body.roztashuvannya;
    pool.query(
      "INSERT INTO kafedry (nazva_kafedry, roztashuvannya) VALUES (?, ?)",
      [nazva, roztashuvannya],
      function(err) {
        if (err) return console.log(err);
        res.redirect("/kafedry");
      }
    );
});

app.get("/edit/:id_kafedry", requireAdmin, function(req, res) {
  const id = req.params.id_kafedry;
  pool.query(
    "SELECT id_kafedry, nazva_kafedry, roztashuvannya FROM kafedry WHERE id_kafedry=?",
    [id],
    function(err, data) {
      if (err) return console.log(err);

      res.render("edit.hbs", {
        kafedry: data[0],
        zagolovok: zagolovok
      });
    }
  );
});

app.post("/edit", urlencodedParser, requireAdmin, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const id = req.body.id_kafedry;
  const nazva = req.body.nazva_kafedry;
  const roztashuvannya = req.body.roztashuvannya;
  pool.query(
    "UPDATE kafedry SET nazva_kafedry=?, roztashuvannya=? WHERE id_kafedry=?",
    [nazva, roztashuvannya, id],
    function(err) {
      if (err) return console.log(err);
      res.redirect("/kafedry");
    }
  );
});

app.post("/delete/:id_kafedry", requireAdmin, function(req, res) {
    const id_kafedry = req.params.id_kafedry;
    pool.query(
        "DELETE FROM kafedry WHERE id_kafedry=?",
        [id_kafedry],
        function(err, data) {
            if(err) return console.log(err);
            res.redirect("/kafedry");
        }
    );
});
}
