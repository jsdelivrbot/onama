var lire = function(){
  //var pg = require('pg');

  /*pg.defaults.ssl = true;
  pg.connect(process.env.DATABASE_URL, function(err, client) {
    if (err) throw err;
    console.log('Connected to postgres! Getting schemas...');
dedzzdzd
    client
      .query('SELECT table_schema,table_name FROM information_schema.tables;')
      .on('row', function(row) {
        return (JSON.stringify(row));
      });
  });*/
}


exports.lire = lire;
