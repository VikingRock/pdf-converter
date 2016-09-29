# pdf-converter
generate certificates using node.js


Formidable - Array support fix (incoming_form.js):

if (cb) {
    var fields = {}, files = {};
    this
      .on('field', function(name, value) {
        if (name.slice(-2) === '[]') {
          var realName = name.slice(0, name.length - 2);
          if (realName in fields) {
            if (!Array.isArray(fields[realName])) {
              fields[realName] = [fields[realName]];
            }
          } else {
            fields[realName] = [];
          }
          fields[realName].push(value);
        } else {
          fields[name] = value;
        }
      })
