
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , os = require('os')
  , _ = require('underscore');
var ipAddresses = "IP Addresses for this computer ";
var ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  var alias=0;
  ifaces[dev].forEach(function(details){
    if (details.family=='IPv4') {
      ipAddresses = ipAddresses + " " + dev + ": " + details.address + " || ";
      ++alias;
    }
  });
}  

var globalReadersList = [];

var DataProvider = require('./data_layer/dataProvider.js').DataProvider;
var dataProvider = new DataProvider('mongodb://localhost/RaceManager');

routes.setDataProvider(dataProvider);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/img/favicon.png'));
  app.use(function(req, res, next){
    res.locals.address = ipAddresses;
    next();
  });
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(err, req, res, next){
      console.error(err.stack);
      res.send(500, 'something broke');
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/readers', routes.readers);
app.get('/race', routes.races);
app.get('/race/:raceId', routes.race);
app.get('/runners/:raceId', routes.runners);
app.get('/race/:raceId/:waveId/', routes.wave);
app.get('/createRace', routes.createRace);
app.post('/createRace', routes.createRaceData);
app.post('/deleteRace', routes.deleteRace);
app.post('/marathon/receivedetectionsunix_multiple.php', routes.receiveRFID);
app.post('/api/startWave', routes.startWave);
app.post('/api/finishFrenzy', routes.finishFrenzy);
app.post('/api/uploadRunnerFile', routes.uploadRunnerFile);
app.post('/api/getRunner', routes.getRunner);
app.post('/api/getBibs', routes.getBibs);
app.post('/api/editRunner', routes.editRunner);
app.post('/api/runners', routes.getRunners);
app.post('/race/:raceId/:waveId/', routes.waveControl);
app.post('/api/races/:raceId/:waveId/', routes.winners);
app.post('/api/runners/:raceId/:bibnumber/', routes.runner);
app.post('/addMessage', routes.addMessage);
app.get('/winners/:raceId', routes.winners);

//app.post('/api/writeDetections', routes.writeDetections);
app.post('/api/writeDetections', routes.writeDetectionsWithDetails);

app.post('/api/writeRaceData', routes.writeRaceData);
app.post('/api/syncReaderTime', routes.syncReaderTime);
app.get('/users', user.list);

//new shiz
//server side underscore yeah!
var globalReaderNames = [];
var initPingReaders = _.once(routes.startPing);
app.get('/readerNames', function(req,res){
  res.send(globalReaderNames);
})

app.post('/readerNames', function(req,res){
  globalReaderNames.push(req.body.readerName);
  globalReaderNames = _.uniq(globalReaderNames);
  routes.setReaderNames(globalReaderNames);
  initPingReaders();
  res.send("ok");
})

app.get('/paulo', function(req, res){
  dataProvider.getRunnersInRace(1, function(err, runners){
    res.send(runners);
  });
})

var server = http.createServer(app);
routes.setApp(server);

server.listen(8080, function(){
  console.log("Congratulations! Open up a browser and go to http://localhost:" + 8080);
});

//routes.PAULO();
//routes.PAULO2();



