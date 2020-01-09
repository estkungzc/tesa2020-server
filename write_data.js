const fs = require('fs');
const ini = require('ini');
const mqtt = require('mqtt');
const mongodb = require('mongodb');

var config = ini.parse(fs.readFileSync(__dirname + '/config.ini', 'utf-8'));
var mqtt_client = mqtt.connect('mqtt://' + config.mqtt.host, {
  username: config.mqtt.username,
  password: config.mqtt.password,
  clientId: 'tgr27',
  connectTimeout: 3000,
  reconnectPeriod: 3000
});
var mongo_client = mongodb.MongoClient;
var db;

mongo_client.connect(
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

function write_sensor_data(data) {
  db.collection('raw_data').insertOne(data, function(error, res) {
    if (error) {
      console.error(error);
    } else {
      console.log(
        'Insert data from ' +
          data.sensor_type +
          '/' +
          data.sensor_id +
          ' sensor.'
      );
    }
  });
  db.collection('fake_raw_data').insertOne(data, function(error, res) {
    if (error) {
      console.error(error);
    } else {
      console.log(
        'Insert fake data from ' +
          data.sensor_type +
          '/' +
          data.sensor_id +
          ' sensor.'
      );
    }
  });
}

mqtt_client.on('connect', function() {
  console.log(
    'MQTT client connect to server at ' + config.mqtt.host + ' success.'
  );

  mqtt_client.on('close', function() {
    console.error('MQTT connection closed.');
  });

  mqtt_client.subscribe('tgr2020/#', function(err) {
    if (err) {
      console.error('Subscribe topic tgr2020/# error.');
    } else {
      console.log('Subscribe topic tgr2020/# success.');
    }
  });
});

mqtt_client.on('reconnect', function() {
  console.error('MQTT client re-connecting.');
});

mqtt_client.on('message', function(topic, message) {
    
    
  if (topic.toString().match(/tgr2020\/.+\/data\/.+/g)) {
    var sensor_type = topic.toString().split('/')[1];
    var sensor_id = topic.toString().split('/')[3];
    var tmp = {};
    const now = new Date();
    tmp['ts'] = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    tmp['sensor_type'] = sensor_type;
    tmp['sensor_id'] = sensor_id;
    try {
      tmp['data'] = JSON.parse(message);
      write_sensor_data(tmp);
    } catch (e) {
      console.error(message);
      console.error(
        'Error data from ' + sensor_type + '/' + sensor_id + ' sensor.'
      );
    }
  } else {
    console.log(topic.toString() + ' => ' + message.toString());
  }
});

mqtt_client.on('error', function(error) {
  console.error(error);
});
