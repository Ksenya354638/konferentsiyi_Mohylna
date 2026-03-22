function requireLogin(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect("/");
    }
}

function requireAdmin(req, res, next) {
    if (req.session.right === "admin") {
        next();
    } else {
        res.render("access_denied", { zagolovok: "Помилка доступу" });
    }
}

module.exports = { requireLogin, requireAdmin };