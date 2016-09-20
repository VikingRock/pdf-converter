var formidable = require('formidable');
var fs = require('fs');
var util = require('util');
var request = require('request');
var Converter = require("csvtojson").Converter;

var certificate = require('../public/assets/certificate.json');
var key = fs.readFileSync('./public/assets/drpbx-key.txt', 'utf-8');
var pathToCertificateFile; //path where uploaded csv is saved to
var inputFileName; // csv input file name



module.exports = function(app) {

    var today = function() {
        var date = new Date();

        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        if (month < 10) month = "0" + month;
        if (day < 10) day = "0" + day;

        return year + "-" + month + "-" + day;
    };

    app.get('/certificate', function(req, res) {
        res.render('form', {data: certificate, today: today()});
    });

    app.post('/certificate', function(req, res) {

        var form = new formidable.IncomingForm();
        form.uploadDir = "./uploads";
        form.keepExtensions = true;

        form.parse(req, function(err, fields, files) {
            res.writeHead(200, {'content-type': 'text/plain'});
            res.write('received upload:\n\n');
            res.end(util.inspect({fields: fields, files: files}));
            pathToCertificateFile = files.inputFile.path;
            inputFileName = files.inputFile.name;

            createDropboxFile(pathToCertificateFile, inputFileName);
        });


        //var converter = new Converter({});
        //converter.fromString(req.body.inputFile, function(err,result){
        //    console.log(result);
        //});

    });

    //var url2pdf = require("url2pdf");
    //
    //url2pdf.renderPdf('https://www.npmjs.com/package/url2pdf')
    //    .then(function(path){
    //        console.log('Rendered pdf @', path);
    //    });


    var shareDropboxFile = function(path) {
        var options = {
            url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json'
            },
            body: '{\"path\": \"' + path +'\",\"settings\": {\"requested_visibility\": \"public\"}}'
        };

        function callback(error, response, body) {
            var info = JSON.parse(body);
            if (!error && response.statusCode == 200) {
                console.log('Shared URL: ' + info.url);
            } else {
                console.log(info.error_summary);
            }
        }

        request.post(options, callback);
    };

    var createDropboxFile = function(path, name) {
        var myStream = fs.createReadStream('./' + path, 'utf8');

        var options = {
            url: 'https://content.dropboxapi.com/2/files/upload',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Dropbox-API-Arg': '{\"path\": \"/Test/' + name + '\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type': 'application/octet-stream'
            },
            body: myStream
        };

        function callback(error, response, body) {
            var info = JSON.parse(body);

            if (!error && response.statusCode == 200) {

                console.log('File Name: ' + info.name);
                console.log('File Size: ' + info.size);

                shareDropboxFile('/Test/' + name);

            } else {
                console.log(info.error_summary);
            }
        }

        request.post(options, callback);
    };

    var csvToJson = function(path) {

    };

};