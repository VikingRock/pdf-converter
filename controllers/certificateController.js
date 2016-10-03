var formidable = require('formidable');
var fs = require('fs-extra');
var util = require('util');
var request = require('request');
var Converter = require("csvtojson").Converter;
var url2pdf = require("url2pdf");
var ejs = require('ejs');

var email 	= require("emailjs");
var server 	= email.server.connect({
    user:    "wiproworker@yandex.ru",
    password:"Wipro123",
    host:    "smtp.yandex.com",
    ssl:     true
});

var certificate = require('../public/assets/certificate.json');
var key = fs.readFileSync('./public/assets/drpbx-key.txt', 'utf-8');
var pathToCertificateFile; //path where uploaded csv is saved to
var inputFileName; // csv input file name
var destinationFolder = '/Training/Training Assesments/Certificates'; //where to save certificates in Dropbox
var studentsArr;
var sharedLinksArr;


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

    var sendEmail = function(to) {
        var emailText = 'Trainees\' certificates:\n';

        studentsArr.forEach(function(item, index) {
            emailText += item.name + ' ' + item.surname + ' ' + item.email + ' -  ' + sharedLinksArr[index] + '\n';
        });


        server.send({
            text:    emailText,
            from:    'wiproworker@yandex.ru',
            to:      to,
            subject: 'WF ceftificate links'
        }, function(err) {
            if (!err) {
                console.log('email sent');
            }
        });
    };

    var deleteTempFiles = function (dir) {

        fs.emptyDir(dir, function (err) {
            if (!err) console.log('deleted successfully!');
        });
    };

    var shareDropboxFile = function(path, index) {
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
                sharedLinksArr[index] = info.url;
            } else {
                console.log(info.error_summary);
            }
        }

        request.post(options, callback);
    };

    var createDropboxFile = function(path, name, destination) {
        var myStream = fs.createReadStream(path);

        var options = {
            url: 'https://content.dropboxapi.com/2/files/upload',
            headers: {
                'Authorization': 'Bearer ' + key,
                'Dropbox-API-Arg': '{\"path\": \"' + destination + '/' + name + '\",\"mode\": \"add\",\"autorename\": true,\"mute\": false}',
                'Content-Type': 'application/octet-stream'
            },
            body: myStream
        };

        function callback(error, response, body) {
            var info = JSON.parse(body);

            if (!error && response.statusCode == 200) {

                console.log('File Name: ' + info.name);
                console.log('File Size: ' + info.size);

                shareDropboxFile(destination + '/' + name, name[0]);

            } else {
                console.log(info.error_summary);
            }
        }

        request.post(options, callback);
    };

    var convertToPdf = function(pathToHtml, index, timestamp, company) {

        url2pdf.renderPdf(pathToHtml, {saveDir: './uploads/pdf'})
            .then(function(path){
                console.log('Rendered pdf @', path);
                createDropboxFile(path, index + timestamp + '.pdf', destinationFolder + '/' + company);
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
                        convertToPdf(fileName, index, timestamp, formFields.company);
                    });
                });
            })

        });
    };

    app.get('/certificate', function(req, res) {
        res.render('form', {data: certificate, today: today()});
    });

    app.post('/certificate', function(req, res) {

        studentsArr = [];
        sharedLinksArr = [];

        var form = new formidable.IncomingForm();
        form.uploadDir = "./uploads";
        form.keepExtensions = true;

        form.parse(req, function(err, fields, files) {

            pathToCertificateFile = files.inputFile.path;
            inputFileName = files.inputFile.name + today(true);

            csvToJson(pathToCertificateFile, fields);

            setTimeout(function() {
                res.writeHead(200, {'content-type': 'text/html'});
                res.write('\<p\>Your certifictes have arrived\<\/p\>\<a href="/certificate"\>Go to Homepage\<\/a\>');
                res.end();
                console.log('---\nresponse sent');

                deleteTempFiles('./uploads');
                sendEmail(fields.email);
            }, 10000);

        });

    });

};