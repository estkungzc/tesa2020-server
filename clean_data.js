const fs = require('fs');
const ini = require('ini');
const mongodb = require('mongodb');

var config = ini.parse(fs.readFileSync(__dirname + '/config.ini', 'utf-8'));

const MongoClient = require('mongodb').MongoClient;

const Parser = require('binary-parser').Parser;

var db;

const pmLocData = {
  '44': { lat: 19.166391, long: 99.901908, locationName: 'ศาลหลักเหมือง' },
  '45': { lat: 19.177149, long: 99.812571, locationName: 'วัดอนาลโยทิพยาราม' },
  '46': { lat: 19.176477, long: 99.88926, locationName: 'วัดศรีโคมคำ' },
  '47': { lat: 19.021294, long: 99.897926, locationName: 'พระนาคปรก สธ' }
};

MongoClient.connect(
  config.mongodb.url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  function(error, connection) {
    if (error) {
      console.error(error);
    } else {
      db = connection.db('tgr2020');
    }
  }
);

async function cleansing() {
  try {
    const rawDataCollection = db.collection('fake_raw_data');
    let queryPM25 = {
      sensor_type: 'pm25',
      sensor_id: { $in : Object.keys(pmLocData) },
      cleaned: { $ne: true }
    };
    // clean pm2.5
    await rawDataCollection
      .find(queryPM25)
      .sort({ _id: 1 })
      .limit(100)
      .toArray(function(err, result) {
        if (err) throw err;
        // filter
        // console.log('Start cleaned PM25');
        result.forEach(data => {
          const dev = data.data.DevEUI_uplink;

          const cleaned = {
            _id: data._id,
            ts: data.ts,
            sensor_type: data.sensor_type,
            sensor_id: data.sensor_id,
            device_id: dev.DevEUI,
            pm25: getPM25(dev.payload_hex),
            location: getLocation(data.sensor_id)
          };

          // validation
          if (cleaned.pm25 >= 0 && cleaned.sensor_id != null) {
            writeCleanData(cleaned);
          }
          updateCleanRawData(data);
        });
      });

      let queryTrack = {
        sensor_type: 'track',
        cleaned: { $ne: true }
      };
      // clean track
      await rawDataCollection
      .find(queryTrack)
      .sort({ _id: 1 })
      .limit(100)
      .toArray(function(err, result) {
        if (err) throw err;
        // console.log('Start cleaned Track');
        result.forEach(data => {
          const dev = data.data;
          const cleaned = {
            _id: data._id,
            ts: data.ts,
            sensor_type: data.sensor_type,
            sensor_id: data.sensor_id,
            mac_addr: dev.mac_addr,
            rssi: dev.rssi
          }
          if (!!cleaned.sensor_id && !!cleaned.mac_addr && !!cleaned.rssi ){
            writeCleanData(cleaned);
          }
          updateCleanRawData(data);
        });
      });
  } catch (err) {
    console.log(err);
  }
}

const getLocation = id => {
  return id in pmLocData ? pmLocData[id] : null;
};

const getPM25 = payload => {
  let parser = new Parser().int8('team').int8('pm25');
  const buf = Buffer.from(payload, 'hex');
  return parser.parse(buf).pm25;
};

const writeCleanData = async (data) => {
  await db.collection('fake_clean_data').insertOne(data);
  console.log('Insert cleaned data!');
};

const updateCleanRawData = async (data) => {
  await db
    .collection('fake_raw_data')
    .updateOne({ _id: data._id }, { $set: { cleaned: true } });
  console.log('update cleaned')
};

setInterval(cleansing, 1000);
