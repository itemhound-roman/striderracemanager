var path = require('path');
var timeFunctions = require('../timeFunctions.js');
var csv = require('ya-csv');
var io = require('socket.io');
var dataProvider;
var fs = require('fs');
var net = require('net');
var querystring = require('querystring');
var http = require('http');
var ping = require('ping');

var mybuf = fs.readFileSync('views/layout.html');

var readerNames = [];

exports.setReaderNames = function(rNames){
  readerNames = rNames;
}

var postToCheckInBib = function(bibnumber, callback){
 //  var post_data = querystring.stringify({
 //    'bibnumber' : bibnumber,
 //    'raceId': '56',
 //  });
 //  var post_options = {
 //      host: 'strider.ph', 
 //      port: '80',
 //      path: '/social/checkInBib',
 //      method: 'POST',
 //      headers: {
 //          'Content-Type': 'application/x-www-form-urlencoded',
 //          'Content-Length': post_data.length
 //      }
 //  };
 // // Set up the request
 //  var post_req = http.request(post_options, function(res) {
 //      res.setEncoding('utf8');
 //      res.on('data', function (chunk) {
 //        console.log('Response: ' + chunk);
 //      });
 //  });
}

exports.setDataProvider = function(dProvider){
  dataProvider = dProvider;
}

/*
 * GET home page.
 */
var initializeSocket = function(io_){  
  io_.sockets.on('connection', function (socket) {
  });
  
}

exports.syncReaderTime = function(req, res){
  console.log(req.body);
  if (!req.body.readerAddress) res.status(500).send('No reader specified');
  else{
    try{
      SyncTime(req.body.readerAddress, function(err){
        if (err) res.status(500).send(err);
        else res.send('OK');
      });    
    }
    catch(e){
       res.status(500).send(e);
    }

    
  }
  
}

var zeroPad = function(text, numText){
  for (; text.toString().length < numText;){
    text = "0"+text.toString();
  }
  return text;
}

var SyncTime = function(address, callback){
  var ctr = 0;
  var CRLF = 0;
  var runningText = "";
  var timeSent = false;
  var timeSentDelay;
  //var client = net.connect({port:23, host:address.toUpperCase()+".local"}, function(err){
    try{
      var client = net.connect(23, address.toUpperCase()+".local", function(err){
        console.log(err);
       if (err) callback(err);
       client.on('timeout', function(){
        callback("Failed Connection To Socket");
       })
       client.on('data', function(data) {

          var crlfFound = false;
          ctr++;
          //console.log("CTR VALUE: " + ctr);
          console.log("---------------------")
          console.log("Data");
          //console.log(data);
          //console.log(data.toString());
          runningText+=data.toString();
          if (data.toString().indexOf("\r\n") != -1) {
            CRLF++;
            console.log("CRLF FOUND");
            console.log(runningText);
            if (timeSentDelay){
              if (runningText.indexOf("Status='0,Success")   == -1){
                callback("Failed");
              }
              else {
                console.log("succezz")
                callback(null);
                client.end();
              }
            }
            timeSentDelay = timeSent;
            runningText= "";
            crlfFound = true;
          }
          console.log("CRLF :" + CRLF);
          console.log("");
          if (data.toString().substring(0,9) == "Password:"){
            client.write('impinj\n');
            return;
          }


          if (!crlfFound) return;
          switch(CRLF){
            case 1 :
              client.write('root\n');
              break;
            case 3:
              var curTime = new Date();
              var timeStr = curTime.getFullYear()+"."+zeroPad(curTime.getMonth()+1,2)+"."+zeroPad(curTime.getDate(),2)+"-"+zeroPad(curTime.getHours(),2)+":"+zeroPad(curTime.getMinutes(),2)+":"+zeroPad(curTime.getSeconds(),2);
              console.log("SENDING TIME");
              client.write('config system time '+timeStr+'\n');
              timeSent = true;
              break;
          }
       });
    });    
    client.on('error', function(err) {
      callback(err.message);
      console.log('error:', err.message);
    });
  }catch(e){
    callback(e);
  }

}

exports.writeRaceData = function(req, res){
  dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
      var curPath = path.resolve();
      var myFileName = race.raceName + "-raceData.csv";
      var totalPath = curPath +"\\"+ myFileName;
      var wavesHash = {};

      for (var i = 0; i < race.waves.length; i++){
        wavesHash[race.waves[i].waveId] = race.waves[i].waveName;
      }

      dataProvider.getRunnersInRace(req.body.raceId, function(err, runners){
        var csvString = "Bib,Wave,First Name, Last Name, Gender, Team, Start, End, Disqualified, Comments\r\n";
        for (var i = 0; i < runners.length; i++){
          
          csvString += (runners[i].bibnumber + "," 
            + wavesHash[runners[i].waveId] +","
            + runners[i].firstName 
            + "," + runners[i].lastName
            + "," + runners[i].gender
            + "," + runners[i].team
            + "," + ((runners[i].startTime == null)?('null'):( runners[i].startTime.toLocaleTimeString()))
            + "," + ((runners[i].endTime == null)?('null'):( runners[i].endTime.toLocaleTimeString()))
            + "," + runners[i].disqualified
            + "," + runners[i].comments + "\r\n");
        }
        var targetLoc = './public/'+myFileName;
        fs.writeFile(targetLoc, csvString, function(err){
          console.log(err);
          //res.send(totalPath);
          //res.send(myFileName);
          res.download(targetLoc, myFileName);
        });  
    });
  });  
}

exports.writeDetections = function(req, res){

  dataProvider.getRunnersInRace(req.body.raceId, function(err, runners){
    var csvString = "";
    for (var i = 0; i < runners.length; i++){
    
      for (var j = 0; j < runners[i].times.length; j++){
        csvString += runners[i].epc + "," + runners[i].times[j].toLocaleTimeString() + "\r\n";
      }
    }

    dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
      
      var curPath = path.resolve();
      var myFileName = race.raceName + "-detections.csv";
      var totalPath = curPath +"\\"+ myFileName;
      var targetLoc = './public/'+myFileName;
      fs.writeFile(targetLoc, csvString, function(){
        res.download(targetLoc, myFileName);
      });  
    })
    

  });
}

//added by Roman
exports.writeDetectionsWithDetails = function(req, res){

  dataProvider.getOneRunnerInRace(req.body.raceId, function(err, runner){
    var csvString = "EPC,Time,Source,Antenna,ReceiveTime\r\n";        
    if(!err){
      var eventheader = runner.epc.substring(0,2);

      dataProvider.getDetectionsByEpcHeader(eventheader, function(err, detections){
        if(!err){
          detections.map(function(detection){
            csvString += detection.epc + "," + 
            detection.time.toLocaleTimeString() + "," +
            detection.source + "," + 
            detection.antenna.toString() + "," + 
            detection.timeReceived.toLocaleTimeString() + "\r\n";
          });          

          dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){     
            var curPath = path.resolve();
            var myFileName = race.raceName + "-detaileddetections.csv";
            var totalPath = curPath +"\\"+ myFileName;
            var targetLoc = './public/'+myFileName;
            fs.writeFile(targetLoc, csvString, function(){
              res.download(targetLoc, myFileName);
            });  
          });
        }
        else{
          res.send(err);
        }
      });
    }
    else{
      res.send(err);
    }
  })
}

exports.PAULO2 = function(){
  dataProvider.getDetectionsByEPC('00000586', function(err, detections){
    for (var i = 0; i < detections.length; i++){
      var a = detections[i].time.getTime();
      var d = new Date((a-28800) * 1000);
      console.log(d.toLocaleTimeString());
    }
  })
}

exports.PAULO = function(){
  dataProvider.getRunnersInRace(8, function(err, runners){
    if (!err){
      for (var i  = 0; i < runners.length; i++){
        if (runners[i].laps.length > 2){
          if ((runners[i].laps[0].lapEnd == null)&&(runners[i].laps[1].lapStart != null)){
            if (runners[i].laps.length != runners[i].numLaps) continue;
            if (runners[i].laps[runners[i].numLaps - 1 ].lapEnd == null) continue;
            
            // console.log("");
            runners[i].laps[0].lapEnd = runners[i].laps[1].lapEnd;
            for (var j = 1; j < (runners[i].laps.length - 1); j++){
              runners[i].laps[j].lapStart = runners[i].laps[j].lapEnd;
              runners[i].laps[j].lapEnd = runners[i].laps[j+1].lapEnd;
            }

            runners[i].laps[runners[i].laps.length - 1].lapStart = runners[i].laps[runners[i].laps.length - 2].lapEnd;
            runners[i].laps[runners[i].laps.length - 1].lapEnd = null;
            // console.log(runners[i].laps[ runners[i].laps.length - 1 ].lapStart);
            // console.log(runners[i].laps[runners[i].laps.length - 2].lapEnd);
            
            for (var j = 0; j < runners[i].times.length; j++){

              //console.log(runners[i].times[j]);
              

              if (timeFunctions.IsTime2AfterTime1(runners[i].laps[runners[i].laps.length - 1].lapStart, runners[i].times[j] )){
                if (timeFunctions.ComputeTimeDifference(runners[i].laps[runners[i].laps.length - 1].lapStart, runners[i].times[j]) < 300 ){
                  runners[i].laps[runners[i].laps.length - 1].lapStart = runners[i].times[j];
                }
                else{
                  runners[i].laps[runners[i].laps.length - 1].lapEnd = runners[i].times[j];

                  runners[i].endTime = runners[i].times[j];
                }
              }
            }
            
            // console.log(runners[i].laps);
            // console.log("");

          }
        }


        var lineText = runners[i].bibnumber + "\t" + runners[i].waveId + "\t" + runners[i].team + "\t" + ((runners[i].startTime == null)?("null"):(runners[i].startTime.toLocaleTimeString()))  + "\t" + ((runners[i].endTime == null)?("null"):(runners[i].endTime.toLocaleTimeString())) + "\t" + runners[i].numLaps + "\t" + runners[i].laps.length + "\t";

        for (var k = 0; k < runners[i].laps.length; k++){
          if (runners[i].laps[k].lapStart != null)lineText+= runners[i].laps[k].lapStart.toLocaleTimeString() +"\t";
          else lineText+= "null"+"\t";
          if (runners[i].laps[k].lapEnd != null) lineText+= runners[i].laps[k].lapEnd.toLocaleTimeString() +"\t";
          else lineText+= "null"+"\t";
        }
        
        console.log(lineText);
      }
    }
  });

}

exports.deleteRace = function(req, res){

  if (req.body.raceId == null){
    res.status(500).send('Incomplete data');
    return;
  }
  dataProvider.deleteRace(req.body.raceId, function(err){
    if (err)res.status(500).send('Incomplete data');
    else res.send('OK');
  })
}

exports.readers = function(req, res){
  res.render('readers', {
    title : 'Readers'
  })
}

exports.setApp = function(server){
  io = io.listen(server, { log: false });
  initializeSocket(io);
}

var separateTimeString = function(timeString){
  var strings = timeString.split(":");
  if (strings.length != 3) return;
  return {
    hours: parseInt(strings[0]),
    minutes : parseInt(strings[1]),
    seconds : parseInt(strings[2])
  };
}
exports.addMessage = function(req, res){
  //console.log(req.body);
  dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
    if (err) res.status(500).send('Incomplete Data');
    else{
      //  console.log(race.notes);
      if (race.notes == undefined) race.notes = "";
      race.notes = race.notes + "\r\n" + req.body.message;
      var raceNotes = race.notes;
      //console.log(race.notes);
      race.save(function(err){
        console.log(race.notes);
        if(!err) {
          res.send('OK');
          io.sockets.emit('chat', {
            raceId: req.body.raceId,
            message: req.body.message
          });
        }
        else res.status(500).send('Error');
      })
    }
  })
}

exports.editRunner = function(req, res){
  if (req.body.id == null) {
    res.status(500).send('Incomplete data');
    return;
  }
  
  dataProvider.getRunnerById(req.body.id, function(err, runner){
    if (req.body.firstName.length > 0) runner.firstName = req.body.firstName;
    if (req.body.lastName.length > 0) runner.lastName = req.body.lastName;
    if (req.body.gender.length > 0) runner.gender = req.body.gender; 
    if (req.body.team.length > 0) runner.team = req.body.team; 
    if (req.body.comments.length > 0)  runner.comments = req.body.comments;
    if (req.body.disqualified.length > 0) runner.disqualified = (req.body.disqualified == "true");

    dataProvider.getRaceByRaceId(runner.raceId, function(err, race){
      for (var i = 0; i < race.waves.length; i++) if (race.waves[i].waveId == runner.waveId) var wave = race.waves[i];
      var newFinishTime = new Date(wave.waveStart);
      if (wave.hasStarted){
        if (req.body.endTime != 'null'){
          var finTime = separateTimeString(req.body.endTime);
          var finishTime  = new Date(newFinishTime.setHours(finTime.hours));
          finishTime      = new Date(finishTime.setMinutes(finTime.minutes));
          finishTime      = new Date(finishTime.setSeconds(finTime.seconds));
          runner.endTime = finishTime;
          runner.lapsCompleted = runner.numLaps;
        }
        if (req.body.startTime != 'null'){
          var sTime = separateTimeString(req.body.startTime);
          var newStartTime = wave.waveStart;
          
          newStartTime = new Date(newStartTime.setHours(sTime.hours));
          newStartTime = new Date(newStartTime.setMinutes(sTime.minutes));
          newStartTime = new Date(newStartTime.setSeconds(sTime.seconds));
          runner.startTime = newStartTime;
        }
        if ((req.body.endTime != null)&&(runner.startTime == null)){
          runner.startTime = new Date(wave.waveStart);
        }
        if ((runner.startTime != null)&&(req.body.startTime == 'null')){
          runner.startTime = new Date(wave.waveStart); 
        }
        
        if (runner.endTime != null)
        {
          runner.gunTime = timeFunctions.ComputeTimeDifference(wave.waveStart, runner.endTime);
        runner.chipTime = timeFunctions.ComputeTimeDifference(runner.startTime, runner.endTime);  
        }  
      }
      
      
      runner.save(function(err){
        if (err) res.status(500).send(err);
        else res.send('OK');
      })

    });

  })
}

exports.index = function(req, res){
  res.send(mybuf.toString('utf-8'));
  //res.render('index', { title: 'Express' });
};

exports.getRunners = function(req, res){
  dataProvider.getRunners(req.body, function(err, runners){
    res.json(runners);
  });
}

exports.getRunner = function(req, res){
  dataProvider.getRunner(req.body.raceId, req.body.bibnumber, function(err, runner){
    if (err) {
      res.status(500).send('Incomplete Data');
    }
    else{
      res.json(runner);
    }
  });
}

exports.getBibs = function(req, res){
  console.log(req.body);
  if (!req.body.bibnumbers) {
    res.status(500).send('Incomplete data'); 
    return;
  } 

  var numOfBibsToFetch = req.body.bibnumbers.length
  var fetchAttempts = 0;
  var runners = [];
  var completer = function(err, runner){

    fetchAttempts++;
    if ((!err)&&(runner)) runners.push(runner);

    if (fetchAttempts == numOfBibsToFetch){
      res.send(runners);
    }
  }

  for (var i = 0; i < numOfBibsToFetch; i++){
    dataProvider.getRunner(req.body.raceId, req.body.bibnumbers[i], completer);
  }

}


var arrayContains = function(arr, object){
  for (var i = 0; i < arr.length; i++){
    if (arr[i] === object) {
      return true;
    }
  }
  return false;
}

exports.uploadRunnerFile = function(req, res){
  dataProvider.removeRunners(req.body.raceId, function(err){
    dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
      if (err) {
        res.status(500).send('Incomplete Data');
        return;
      }
      var wavesByName = new Object;
      var countOfWaves = new Object;
      for (var i = 0 ; i < race.waves.length; i++){
        wavesByName[race.waves[i].waveName] = race.waves[i].waveId;
        countOfWaves[race.waves[i].waveId] = 0;
      }
      console.log(wavesByName);
      //Initialize CSV
      var ColumnNames = ['bibnumber', 'epc', 'waveName', 'gender', 'firstName', 'lastName', 'team', 'age', 'numLaps', 'runnerClass'];
      var reader = csv.createCsvFileReader(req.files.runnerFile.path, {
          columnsFromHeader : false,
          encoding: 'utf8',
          'separator': '\t',
      });
      reader.setColumnNames(ColumnNames);
      var headerFound = false;

      var teamsInRace = race.teams;
      var errors = [];
      reader.addListener('end', function(){
        for (var i = 0; i < race.waves.length; i++){
          race.waves[i].numRunners = countOfWaves[race.waves[i].waveId];
        }

        race.teams = teamsInRace;

        race.save(function(err){
          if (errors.length > 0) res.render('errors', {errors:errors, prevUrl:req.path})
          else res.redirect('back');
        });
      })

      reader.addListener('error', function(err){
        res.status(500).send(err);
        console.log(err);
        return;
      });
      
      reader.addListener('data', function(data){
        if (!headerFound) {
          headerFound = true;
          return;
        }
        console.log(data.bibnumber);  
        var runnerDetails = new Object();
        data.raceId = req.body.raceId;
        console.log(data);
        console.log( (data.waveName.toUpperCase()).replace(/\s+/g,''));
        data.waveId = wavesByName[(data.waveName.toUpperCase()).replace(/\s+/g,'')];
        countOfWaves[wavesByName[(data.waveName.toUpperCase()).replace(/\s+/g,'')]]++;

        dataProvider.addRunner(data, function(err){
          if (err){
            console.log("error here");
            errors.push({
              bib: data.bibnumber,
              error: err.errors
            });
            console.log(err); 
          }
        });
        if (!arrayContains(teamsInRace, data.team)) teamsInRace.push(data.team);
      });
    });
  })

}

exports.finishFrenzy = function(req, res){
  if (!((req.body.waveId)&&(req.body.raceId)&&(req.body.startTime))){
    if (err) {
      res.status(500).send('Incomplete Data');
      return;
    }
  }
  dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
    if (err) res.status(500).send('Error fetching race');
    else{
      for (var i = 0; i < race.waves.length; i++){
        if (race.waves[i].waveId == req.body.waveId){
          race.waves[i].hasFinishFrenzyEnabled = true;
          race.save(function(err){
            if (err) res.status(500).send('Error Starting Race');
            else res.send('OK');
            return;
          });
        }
      }
    }
  });
}
exports.startWave = function(req, res){
  if (!((req.body.waveId)&&(req.body.raceId)&&(req.body.startTime))){
    if (err) res.status(500).send('Incomplete Data');
    return;
  }
  dataProvider.getRaceByRaceId(req.body.raceId, function(err, race){
    if (err) res.status(500).send('Error fetching race');
    else{
      for (var i = 0; i < race.waves.length; i++){
        if (race.waves[i].waveId == req.body.waveId){
          race.waves[i].hasStarted = true;
          race.waves[i].waveStart = new Date(req.body.startTime);
          race.save(function(err){
            if (err) res.status(500).send('Error Starting Race');
            else res.send('OK');
            return;
          });
        }
      }
    }
  });
}

exports.races = function(req, res){
  dataProvider.getRaces(function(err, races){
    if (err) res.status(500).send('Error fetching races');
    else res.render('races', {title: 'Races', races:races});
  });
  
}

exports.runners = function(req, res){
  dataProvider.getRaceByRaceId(req.params.raceId, function(err, race){
    if (err) res.status(500).send('Error fetching race');
    else res.render('runners', {title: race.raceName, race:race});
  });
}

exports.race = function(req, res){
  dataProvider.getRaceByRaceId(req.params.raceId, function(err, race){
    if (err) res.status(500).send('Error fetching race');
    else res.render('race', {title: race.raceName, race:race});
  });
}

exports.wave = function(req, res){
  res.render('wave', {title: 'Races'});
}

exports.waveControl = function(req, res){
 
}

exports.winners = function(req, res){
  dataProvider.getRaceByRaceId(req.params.raceId, function(err, race){
    if (err) res.status(500).send('Error fetching race');
    else res.render('runners', {title: race.raceName, race:race});
  });
}

exports.runner = function(req, res){

}

exports.receiveRaceData = function(req, res){

}

exports.createRace = function(req, res){
  res.render('createRace', {title : 'New Race'});
}

exports.createRaceData = function(req, res){
  var newRaceInfo = new Object();
  newRaceInfo.raceName = req.body.RaceName;
  newRaceInfo.raceDate = req.body.RaceDate;
  newRaceInfo.waves = req.body.Waves;
  dataProvider.addRace(newRaceInfo, function(err){
    if (err) res.status(500).send('ERROR in saving');
    else res.send('OK');
  });

}

var processFinishFrenzy = function(runner, wave, time){
  if (runner.endTime == null){
    if (runner.startTime == null){
      runner.startTime = new Date(wave.waveStart);
    }


    runner.endTime = time;
    runner.gunTime = timeFunctions.ComputeTimeDifference(wave.waveStart, time);
    runner.chipTime = timeFunctions.ComputeTimeDifference(runner.startTime, time);
    runner.save();  
    postToCheckInBib(runner.bibnumber, function(data){
      console.log("check in complete");
      console.log(data);
    });
  }
  
}

var processDetection2 = function(epc, time){
  dataProvider.getRunnerByEPC(epc,function(err, runner){
    if (err) return;
    else if (runner.endTime != null) return;
    else{
      dataProvider.getWave(runner.raceId, runner.waveId, function(err, wave_){
        for (var i = 0; i < wave_.waves.length; i++){
          if (wave_.waves[i].waveId == runner.waveId) var wave = wave_.waves[i];
        }

        if (!wave.hasStarted) return;
        if (timeFunctions.IsTime2AfterTime1(wave.waveStart, time)){
            if (wave.hasFinishFrenzyEnabled){
              processFinishFrenzy(runner, wave, time);
            }
            else{






            }
        }


              


      });
    }
  });
}


var processRunnerWithNoLaps = function(runner, epc, time){
  console.log(epc);
  console.log(time);
  //compare start time with receive time, but save detection time;
  var receiveTime = new Date();
  console.log("processing no laps")
  dataProvider.getWave(runner.raceId, runner.waveId, function(err, wave_){
        //console.log(wave_);
        for (var i = 0; i < wave_.waves.length; i++){
          if (wave_.waves[i].waveId == runner.waveId) var wave = wave_.waves[i];
        }
        //console.log(wave);
        if (wave.hasStarted){
          
          if (timeFunctions.IsTime2AfterTime1(wave.waveStart, receiveTime)){
            
          
            if (wave.hasFinishFrenzyEnabled){
              processFinishFrenzy(runner, wave, time);
            }
            else{
              if (runner.endTime == null){
                if (runner.startTime == null){
            
                  wave.numStarters++;
                  runner.startTime = time;
                }
                else{
                  if (timeFunctions.ComputeTimeDifference(runner.startTime, time) < 300){

                    console.log(timeFunctions.ComputeTimeDifference(runner.startTime, time) ); 
                    console.log(runner.startTime);
                    console.log(time);
                    console.log("---");

                    if ((timeFunctions.ComputeTimeDifference(runner.startTime, time))>0) runner.startTime = time;
                  }
                  else{
                    wave.numFinishers++;
                    runner.endTime = time;
                    runner.gunTime = timeFunctions.ComputeTimeDifference(wave.waveStart, time);
                    runner.chipTime = timeFunctions.ComputeTimeDifference(runner.startTime, time);
                  }
                }
              } 
            }   
          }
        }
        console.log(runner.startTime);
        runner.times.push(time);
        runner.save(function(){
          wave_.save(function(){
            
          });
        });
      });
}


var saveRunnerAndRace = function(runner, race, time){
  runner.times.push(time);
  runner.save(function(){
    if (race != null) race.save();
  });
}


var processRunnerWithLaps = function(runner, epc, time){
  //compare start time with receive time, but save detection time;
  var receiveTime = new Date();
  
  dataProvider.getWave(runner.raceId, runner.waveId, function(err, wave_){
    if (err) return;
    else{
      for (var i = 0; i < wave_.waves.length; i++){
        if (wave_.waves[i].waveId == runner.waveId) var wave = wave_.waves[i];
      }
      if (typeof(wave) === "undefined") {
          saveRunnerAndRace(runner, null, time);
          return;
      }
      if (!wave.hasStarted) {        
        saveRunnerAndRace(runner, wave_, time);
        return;
      }
      
      if (!timeFunctions.IsTime2AfterTime1(wave.waveStart, receiveTime)) {
        saveRunnerAndRace(runner, wave_, time);
        return;
      }
      if (runner.endTime != null) {
        saveRunnerAndRace(runner, wave_, time);
        return;
      }

      //edge case, no laps yet
      if (runner.laps.length == 0){
        var newLap = {
          lapNumber: 1,
          lapStart: null,
          lapEnd: null,
          lapTime: 0
        }
        runner.laps.push(newLap);
        //saveRunnerAndRace(runner, wave_, time);      
        //set dirtybit
        //saveRunnerandRace;
      }
      //console.log(runner.laps);
      var currentLapIndex = runner.laps.length - 1;

      if (runner.laps.length == 1){
        if (runner.laps[currentLapIndex].lapStart == null){
          runner.laps[currentLapIndex].lapStart = time;
          runner.startTime = time;          
          saveRunnerAndRace(runner, wave_, time);
        }
        else if (timeFunctions.ComputeTimeDifference(runner.startTime, time) < 300){
          if ((timeFunctions.ComputeTimeDifference(runner.startTime, time))>0) {
            runner.startTime = time;
            runner.laps[currentLapIndex].lapStart = time;            
            saveRunnerAndRace(runner, wave_, time);
          }
        }
        else{
          runner.laps[currentLapIndex].lapEnd = time;
          runner.laps[currentLapIndex].lapTime = timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, runner.laps[currentLapIndex].lapEnd);
          var newLap = {
            lapNumber: currentLapIndex + 2,
            //lapstart: null?
            lapStart: time,
            lapEnd: null,
            lapTime: 0
          }
          runner.lapsCompleted++;
          runner.laps.push(newLap);
          //set dirtybit?
          saveRunnerAndRace(runner, wave_, time);         
        }
      }


      currentLapIndex = runner.laps.length  - 1;
      //edge case: first lap palang
      if ((runner.laps.length < runner.numLaps) && (runner.laps.length > 1)){
        //if(lapstart is null), set lapstart to time; reset dirtybit; save;
        if (timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, time) < 300){
          if ((timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, time))>0) {
            runner.laps[currentLapIndex].lapStart = time;
            saveRunnerAndRace(runner, wave_, time);
          }
        }
        else{
          runner.laps[currentLapIndex].lapEnd = time;
          runner.laps[currentLapIndex].lapTime = timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, runner.laps[currentLapIndex].lapEnd);
          runner.lapsCompleted++;

          if (runner.lapsCompleted < runner.numLaps)
          {
            var newLap = {
              lapNumber: currentLapIndex + 2,
              lapStart: time,
              lapEnd: null,
              lapTime: 0
            }
            
            runner.laps.push(newLap);
            saveRunnerAndRace(runner, wave_, time);      
          }
        }
      }

      currentLapIndex = runner.laps.length - 1;
      if (runner.laps.length == runner.numLaps){
        if (runner.laps[currentLapIndex].lapStart == null){
          runner.laps[currentLapIndex].lapStart = time;
          saveRunnerAndRace(runner, wave_, time);
        }
        else if (timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, time) < 300){
          if ((timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, time))>0) {
            runner.laps[currentLapIndex].lapStart = time;
            saveRunnerAndRace(runner, wave_, time);
          }
        }
        else{
          runner.laps[currentLapIndex].lapEnd = time;
          runner.laps[currentLapIndex].lapTime = timeFunctions.ComputeTimeDifference(runner.laps[currentLapIndex].lapStart, runner.laps[currentLapIndex].lapEnd);
          runner.lapsCompleted++;
          runner.endTime = time;    
          runner.gunTime = timeFunctions.ComputeTimeDifference(wave.waveStart, time);
          runner.chipTime = timeFunctions.ComputeTimeDifference(runner.startTime, time);      
          saveRunnerAndRace(runner, wave_, time);         
        }
      }

    }
  })
}

var processDetection = function(epc, time){ 
  //console.log(epc);
  console.log(time);
  dataProvider.getRunnerByEPC(epc, function(err, runner){
    if (err) return;
    else{
      if (runner.numLaps < 2){       
        processRunnerWithNoLaps(runner, epc, time);
      }  
      else{    
        processRunnerWithLaps(runner, epc, time);
      }
    }
  });
}


exports.receiveRFID = function(req, res){
  res.send('OK');
  console.log(req.body);
  var EPCs = req.body.EPCs;
  var Times = req.body.Times;
  var Antennas = req.body.Antennas;
  var Source = req.body.Source;
  var EPCArray = EPCs.split('-');
  var TimeArray = Times.split('-');
  var AntennaArray = Antennas.split('-');
  
  var FoundAntennas = {};
  var MaxTime = 0;
  for (var i = 0; i < EPCArray.length; i++){
    if (EPCArray[i].length == 0) continue;
    var timeOfDetection = new  Date(1000*(parseInt(TimeArray[i]) - 28800) );
    dataProvider.addDetection(EPCArray[i], Source, AntennaArray[i], timeOfDetection, null);
    //console.log();
    processDetection(EPCArray[i], timeOfDetection);
    if (FoundAntennas[AntennaArray[i]] == null) FoundAntennas[AntennaArray[i]] = 0;
    if (parseInt(TimeArray[i]) > MaxTime) MaxTime = parseInt(TimeArray[i]);
  }
  var antennasFound = [];
  for (antennaNum in FoundAntennas) antennasFound.push(antennaNum);
  if (MaxTime != 0){
    io.sockets.emit('readers', {
    readerName: Source,
    antennas: antennasFound,
    lastSeenTime : MaxTime
    })  
  }
  
}

exports.startPing = function(){
  var myfunc = function(){
    readerNames.forEach(function(host){
      ping.sys.probe(host, function(isAlive){
        //var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        //console.log(msg);
        io.sockets.emit('pingreaders',{
          readerName: host,
          readerStatus: isAlive
        })
      })
    })
  }

  var myVar = setInterval(function(){myfunc()}, 30000);
}

 

