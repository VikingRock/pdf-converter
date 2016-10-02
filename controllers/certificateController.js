var formidable = require('formidable');
var fs = require('fs-extra');
var util = require('util');
var request = require('request');
var Converter = require("csvtojson").Converter;
var url2pdf = require("url2pdf");
var ejs = require('ejs');

var certificate = require('../public/assets/certificate.json');
var key = fs.readFileSync('./public/assets/drpbx-key.txt', 'utf-8');
var pathToCertificateFile; //path where uploaded csv is saved to
var inputFileName; // csv input file name
var studentsArr = [];


module.exports = function(app) {

    var today = function(timestamp) {
        var date = new Date();

        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        if (month < 10) month = "0" + month;
        if (day < 10) day = "0" + day;

        if (!timestamp) {
            return year + "-" + month + "-" + day;
        } else {
            var hour = date.getHours();
            var minute = date.getMinutes();
            var second = date.getSeconds();

            return year + "-" + month + "-" + day + '' + hour + minute + second;
        }

    };

    var deleteTempFiles = function (dir) {

        fs.emptyDir(dir, function (err) {
            if (!err) console.log('deleted successfully!');
        });
    };

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
        var myStream = fs.createReadStream(path);

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

    var convertToPdf = function(pathToHtml, index, timestamp) {

        url2pdf.renderPdf(pathToHtml, {saveDir: './uploads/pdf'})
            .then(function(path){
                console.log('Rendered pdf @', path);
                createDropboxFile(path, index + timestamp + '.pdf');
            });
    };

    var csvToJson = function(path, formFields) {

        var converter = new Converter({});
        converter.fromFile(path, function(error, result){
            studentsArr = JSON.parse(JSON.stringify(result));

            studentsArr.forEach(function(item, index) {
                fs.readFile('./views/certificate.ejs', 'utf-8', function(err, file) {
                    var renderedCertificate = ejs.render(file, {data: item, common: formFields});
                    var timestamp = today(true);
                    var fileName = './uploads/' + index + timestamp + '.html';

                    fs.writeFile(fileName, renderedCertificate, function(err) {
                        convertToPdf(fileName, index, timestamp);
                    });
                });
            })

        });
    };

    app.get('/certificate', function(req, res) {
        res.render('form', {data: certificate, today: today()});
    });

    app.post('/certificate', function(req, res) {

        var form = new formidable.IncomingForm();
        form.uploadDir = "./uploads";
        form.keepExtensions = true;

        form.parse(req, function(err, fields, files) {

            pathToCertificateFile = files.inputFile.path;
            inputFileName = files.inputFile.name + today(true);

            csvToJson(pathToCertificateFile, fields);

            setTimeout(function() {
                res.writeHead(200, {'content-type': 'text/plain'});
                res.write('received upload:\n\n');
                res.end(util.inspect({fields: fields, files: files}));
                console.log('---\nresponse sent');

                deleteTempFiles('./uploads');
            }, 6000);



        });

    });



};