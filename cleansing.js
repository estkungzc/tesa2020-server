const fs = require('fs')
const ini = require('ini')
const mongodb = require('mongodb')

var config = ini.parse(fs.readFileSync(__dirname + '/config.ini', 'utf-8'))

const MongoClient = require('mongodb').MongoClient;

async function cleansing() {
	var client = await MongoClient.connect(config.mongodb.url, { useNewUrlParser: true, useUnifiedTopology: true}).catch(err => { console.log(err); });

    if (!client) {
        return;
    }

 	try {
        const db = client.db("tgr2020");
        let collection = db.collection('raw_data');
        let query = {sensor_type: "pm25", cleaned: { $ne: true }}
                                            // เอาตัวเก่ามาก่อน
        await collection.find(query).sort({_id: 1}).limit(100).toArray(function(err, result) {
    	    if (err) throw err;

    	    console.log(element);

            // put your code here (filter เอาข้อมูลไปเขียน)
    	    
        });
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }
}

setInterval(cleansing, 1000);


