/**
 * Created by aliaksandrzinchuk on 9/14/16.
 */
var url2pdf = require("url2pdf");

url2pdf.renderPdf("http://localhost:8080/blog.html")
    .then(function(path){
        console.log("Rendered pdf @", path);
    });
