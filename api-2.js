const fs = require('fs')
const ini = require('ini')
const mongodb = require('mongodb')
const express = require('express')
const app = express()
const port = 4000

var config = ini.parse(fs.readFileSync(__dirname + '/config.ini', 'utf-8'))
var mongo_client = mongodb.MongoClient
var db

mongo_client.connect(config.mongodb.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function(error, connection) {
    if (error) {
        console.error(error)
    } else {
        db = connection.db("tgr2020");
    }
})

app.get('/', function (req, res) {
     db.collection("example_raw_data").find({sensor_type: "track"}).sort({_id: -1}).limit(1).next().then(
       function(doc) {
         res.send(doc);
       }
     );
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
