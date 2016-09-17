var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = function(app) {

//app.get('/todo', function(req, res) {
//    Todo.find({}, function(err, data) {
//        if (err) throw err;
//        res.render('todo', {data: data});
//    });
//});
//
//app.post('/todo', urlencodedParser, function(req, res) {
//    var newTodo = Todo(req.body).save(function(err, data) {
//        if (err) throw err;
//        res.json(data);
//    });
//});

    console.log('inside controller');

};