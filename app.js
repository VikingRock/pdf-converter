/**
 * Created by aliaksandrzinchuk on 9/9/16.
 */
var htmlToPdf = require('html-to-pdf');

htmlToPdf.setDebug(true);

htmlToPdf.convertHTMLFile('./node_modules/html-to-pdf/test/test.html', './destination1.pdf',
    function (error, success) {
        if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
        } else {
            console.log('Woot! Success!');
            console.log(success);
        }
    }
);