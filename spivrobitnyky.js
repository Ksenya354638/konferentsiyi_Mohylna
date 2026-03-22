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
    const header = global.zagolovok;
    app.get("/spivrobitnyky", requireAdmin, function(req, res) {
        pool.query("SELECT nazva_kafedry FROM kafedry",
        function(err, data) {
            if(err) return console.log(err);
            res.render("spivrobitnyky.hbs", {
                spivrobitnyky: data,
                header: header,
                spivrobitnyky_visible: false
            });
        });
    });

    app.post("/spivrobitnyky", urlencodedParser, requireAdmin, function (req, res) {
        const nazva_kafedry = req.body.nazva_kafedry;
        pool.query(`
            SELECT 
            spivrobitnyky.id_spivrobitnyky,
            spivrobitnyky.prizvyshche,
            spivrobitnyky.imya,
            spivrobitnyky.pobatkovi
            FROM spivrobitnyky
            INNER JOIN kafedry 
            ON spivrobitnyky.id_kafedry = kafedry.id_kafedry
            WHERE kafedry.nazva_kafedry = ?
            `, [nazva_kafedry], function (err, data) {
        if(err) return console.log(err);
        res.render("spivrobitnyky.hbs", {
            spivrobitnyky: data,
            header: header,
            spivrobitnyky_visible: true,
            department_name: nazva_kafedry
            });
        });
    });
    app.get("/spivrobitnyky_create", requireAdmin, function(req, res){
    pool.query("SELECT * FROM kafedry", function(err,data){
        if(err) return console.log(err);
        res.render("spivrobitnyky_create.hbs",{
            kafedry: data,
            header: header
        });
    });
});

    app.post("/spivrobitnyky_create", urlencodedParser, requireAdmin, function(req,res){
        const prizvyshche = req.body.prizvyshche;
        const imya = req.body.imya;
        const pobatkovi = req.body.pobatkovi;
        const id_kafedry = req.body.id_kafedry;
        pool.query(
            "INSERT INTO spivrobitnyky (prizvyshche,imya,pobatkovi,id_kafedry) VALUES (?,?,?,?)",
            [prizvyshche,imya,pobatkovi,id_kafedry],
            function(err,data){
            if(err) return console.log(err);
            res.redirect("/spivrobitnyky");
        });
    });

    app.get("/spivrobitnyky_edit/:id", requireAdmin, function(req,res){
        const id = req.params.id;
        pool.query(
            "SELECT * FROM spivrobitnyky WHERE id_spivrobitnyky=?",
            [id],
            function(err,data){
                if(err) return console.log(err);
                pool.query("SELECT * FROM kafedry", function(err,kafedry){
                    res.render("spivrobitnyky_edit.hbs",{
                        spivrobitnyky: data[0],
                        kafedry: kafedry,
                        header: header
                    });
                });
            });
    });

    app.post("/spivrobitnyky_edit", urlencodedParser, requireAdmin, function(req,res){
        const id = req.body.id_spivrobitnyky;
        const prizvyshche = req.body.prizvyshche;
        const imya = req.body.imya;
        const pobatkovi = req.body.pobatkovi;
        const id_kafedry = req.body.id_kafedry;
        pool.query(
            "UPDATE spivrobitnyky SET prizvyshche=?, imya=?, pobatkovi=?, id_kafedry=? WHERE id_spivrobitnyky=?",
            [prizvyshche,imya,pobatkovi,id_kafedry,id],
            function(err,data){
                if(err) return console.log(err);
                res.redirect("/spivrobitnyky");
        });
    });
    app.post("/spivrobitnyky_delete/:id", requireAdmin, function(req,res){
        const id = req.params.id;
        pool.query(
            "DELETE FROM spivrobitnyky WHERE id_spivrobitnyky=?",
            [id],
            function(err,data){
                if(err) return console.log(err);
            res.redirect("/spivrobitnyky");
        });
    });
}



