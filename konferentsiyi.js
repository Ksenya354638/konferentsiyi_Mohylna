module.exports = function(app, pool){
    const header = global.zagolovok;
    const mysql = require("mysql2");
    const express = require("express");
    const bodyParser = require("body-parser");
    const urlencodedParser = bodyParser.urlencoded({ extended: false });
    const hbs = require("hbs");
    hbs.registerHelper('eq', function(a, b) {
        return a == b;
    });
    const { engine } = require("express-handlebars");
    const path = require('path');
    const zagolovok = "Облік конференцій";
    const { requireLogin, requireAdmin } = require("./middleware");

    app.get("/konferentsiyi", function(req,res){
        res.render("konferentsiyi.hbs",{
            header: header
        });
    });
    app.post("/konferentsiyi", urlencodedParser, function(req, res){
        if(!req.body) return res.sendStatus(400);
        const data_pochatku = req.body.data_pochatku;
        const data_zakinchennya = req.body.data_zakinchennya;
        pool.query(`
            SELECT konferentsiyi.id_conferentsiyi, konferentsiyi.nazva_conferentsiyi,
            CONCAT(spivrobitnyky.prizvyshche,' ', LEFT(spivrobitnyky.imya,1),'.',
            LEFT(spivrobitnyky.pobatkovi,1),'.') AS prizvyshche,
            DATE_FORMAT(konferentsiyi.data_pochatku,'%d.%m.%Y') AS data_pochatku,
            DATE_FORMAT(konferentsiyi.data_zakinchennya,'%d.%m.%Y') AS data_zakinchennya,
            DATEDIFF(konferentsiyi.data_zakinchennya, konferentsiyi.data_pochatku) + 1 AS truvalist
            FROM konferentsiyi INNER JOIN spivrobitnyky ON konferentsiyi.id_spivrobitnyky = spivrobitnyky.id_spivrobitnyky
            WHERE konferentsiyi.data_pochatku >= ? AND konferentsiyi.data_zakinchennya <= ?
            `, [data_pochatku, data_zakinchennya], function(err,data){
            if(err) return console.log(err);
            res.render("konferentsiyi.hbs",{
                konferentsiyi: data,
                header: header,
                konferentsiyi_visible: true,
                data_pochatku: data_pochatku,
                data_zakinchennya: data_zakinchennya
            });
        });
    });

    app.get("/konferentsiyi_create", requireAdmin, function(req,res){
        pool.query("SELECT * FROM spivrobitnyky", function(err,data){
            if(err) return console.log(err);
            res.render("konferentsiyi_create.hbs",{
                spivrobitnyky: data,
                header: header
            });
        });
    });

    app.post("/konferentsiyi_create", urlencodedParser, requireAdmin, function(req,res){
        const nazva = req.body.nazva_conferentsiyi;
        const data_pochatku = req.body.data_pochatku;
        const data_zakinchennya = req.body.data_zakinchennya;
        const id_spivrobitnyky = req.body.id_spivrobitnyky;
        pool.query(`
            INSERT INTO konferentsiyi
            (nazva_conferentsiyi,data_pochatku,data_zakinchennya,id_spivrobitnyky)
            VALUES (?,?,?,?)`,
            [nazva,data_pochatku,data_zakinchennya,id_spivrobitnyky],
            function(err,data){
                if(err) return console.log(err);
                res.redirect("/konferentsiyi");
        });
    });
    app.get("/konferentsiyi_edit/:id", requireAdmin, function(req,res){
        const id = req.params.id;
        pool.query(`
            SELECT *,
            DATE_FORMAT(data_pochatku,'%Y-%m-%d') AS data_pochatku,
            DATE_FORMAT(data_zakinchennya,'%Y-%m-%d') AS data_zakinchennya
            FROM konferentsiyi
            WHERE id_conferentsiyi=?
            `,[id],
            function(err,conference){
                if(err) return console.log(err);
                pool.query("SELECT * FROM spivrobitnyky", function(err,spivrobitnyky){
                res.render("konferentsiyi_edit.hbs",{
                    conference: conference[0],
                    spivrobitnyky: spivrobitnyky,
                    header: header
                });
            });
        });
    });
    app.post("/konferentsiyi_edit", requireAdmin, urlencodedParser, function(req,res){
        const id = req.body.id_conferentsiyi;
        const nazva = req.body.nazva_conferentsiyi;
        const data_pochatku = req.body.data_pochatku;
        const data_zakinchennya = req.body.data_zakinchennya;
        const id_spivrobitnyky = req.body.id_spivrobitnyky;
        pool.query(`
            UPDATE konferentsiyi
            SET nazva_conferentsiyi=?,
            data_pochatku=?,
            data_zakinchennya=?,
            id_spivrobitnyky=?
            WHERE id_conferentsiyi=?
            `,
            [nazva,data_pochatku,data_zakinchennya,id_spivrobitnyky,id],
        function(err,data){
        if(err) return console.log(err);
            res.redirect("/konferentsiyi");
        });
    });
    app.post("/konferentsiyi_delete/:id", requireAdmin, function(req,res){
        const id = req.params.id;
        pool.query(
            "DELETE FROM konferentsiyi WHERE id_conferentsiyi=?",
            [id],
            function(err,data){
            if(err) return console.log(err);
            res.redirect("/konferentsiyi");
        });
    });
}
