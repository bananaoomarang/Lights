var express = require("express"),
    app = express();

var PORT = process.env.PORT || 9966;

app.listen(PORT);

console.log('\n   Server listening on ' + PORT);

app.configure(function() {
    app.use(express.bodyParser());
    app.use(app.router);
});

app.use(express.static(__dirname + "/public"));
