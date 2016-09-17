var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = function(app) {

//app.get('/certificate', function(req, res) {
//    res.render('todo', {data: data});
//});
//
//app.post('/certificate', urlencodedParser, function(req, res) {
//        data.push(req.body);
//        res.json(data);
//    });
//
//var url2pdf = require("url2pdf");
//
//url2pdf.renderPdf('https://www.npmjs.com/package/url2pdf')
//    .then(function(path){
//        console.log('Rendered pdf @', path);
//    });


console.log("\n *START* \n");

fs.readFile('./public/assets/certificate.json', 'utf8', function(err, data) {
    var certificate = JSON.parse(data);
    console.log(certificate.trainers);
});


};