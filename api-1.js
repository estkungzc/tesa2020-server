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
    var col = db.collection('example_raw_data');

    col.aggregate([
        {
            $match : { "ts": { $gte: new Date(new Date().setDate(new Date().getDate()-1)), $lt: new Date() } }
        }, {
            $group : {
                _id : { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$ts" } },
                count: { $sum: 1 }
            }
        }, {
            $project: {  
                _id: 0,
                ts: "$_id",
                count: 1
            }
        }, {
            $sort: {
                ts: 1
            }
        }
    ]).toArray(function(err, docs) {
        res.send(docs)
    });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
