const fs = require('fs')
const ini = require('ini')
const mongodb = require('mongodb')
const express = require('express')
const app = express()
const port = 80

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

app.get('/api/pm25_data/:sensor_id', function (req, res) {
    const id = req.params.sensor_id;
     db.collection("fake_clean_data").find({ sensor_id: id, sensor_type: "pm25"}).sort({ts: -1}).limit(1).next().then(
       function(doc) {
         res.send(doc);
       }
     );
})

app.get('/api/track_data/:id', function (req, res) {
    const id = req.params.id;
     db.collection("fake_clean_data").find({ sensor_id: id, sensor_type: "track"}).sort({ts: -1}).limit(1).next().then(
       function(doc) {
         res.send(doc);
       }
     );
})

app.get('/api/pm25_data/:sensor_id/list', async (req, res) => {
  const id = req.params.sensor_id;
  let queryPM25 = {
    sensor_type: 'pm25',
    sensor_id: id
  }

   await db.collection("fake_clean_data")
   .find(queryPM25)
   .sort({ _id: 1 })
   .limit(100)
   .toArray(function(err, result) {
     if (err) return res.status(404);
     res.send(result);
   });
  })

// app.get('/api/track_data/:sensor_id/list', function (req, res) {
//   const start = req.query.start;
//   const end = req.query.end;
//   if (!!start && !!end) {

//   }
//   const id = req.params.sensor_id;
//   const date = {
//     start, end
//   }
//   console.log(start, end);
//   console.log(date);
//   res.send(date);
//   //  db.collection("fake_clean_data").find({ sensor_id: id, sensor_type: "track"}).sort({ts: -1}).limit(1).next().then(
//   //    function(doc) {
//   //      res.send(doc);
//   //    }
//   //  );
// })



// app.get("/", function(req, res) {
//   var col = db.collection("fake_clean_data");

//   var now = new Date();
//   var nowUtc = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
//   var before = new Date(new Date().setDate(new Date().getDate() - 1));
//   var beforeUtc = new Date(before.getTime() - before.getTimezoneOffset() * 60000);
//   console.log(nowUtc, beforeUtc);
//   col.aggregate([
//       {
//           $match: {
//               ts: {
//                   $gte: beforeUtc,
//                   $lt: nowUtc
//               },
//           }
//       },
//       {
//           $group: {
//               _id: {
//                   $dateToString: { format: "%Y-%m-%d %H:%M", date: "$ts" }
//               },
//               count: { $sum: 1 },
//               // sensor_id: { $first: "$sensor_id" }
//           }
//       },
//       {
//           $project: {
//               _id: 0,
//               ts: "$_id",
//               count: 1,
//               // sensor_id: 1 
//           }
//       },
//       {
//           $sort: {
//               ts: 1
//           }
//       }
//   ]).toArray(function(err, docs) {
//       res.send(docs);
//   });
// });

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
