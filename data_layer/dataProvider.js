var csv = require('ya-csv');
var fs = require('fs');

var mongoose = require('mongoose');
var runner = require('../models/runner.js');
var race = require('../models/race.js');
var detection = require('../models/detection.js');


function DataProvider(connection){
  mongoose.connect(connection);
}
DataProvider.prototype.getDetectionsByEPC = function(epc, callback){
  detection.find({"epc":epc}).exec(callback);
}
DataProvider.prototype.deleteRace = function(raceId, callback){
  race.remove({"raceId":raceId}, function(err){
    if (err) callback(err);
    else{
      runner.remove({"raceId":raceId}, function(err){
        if (err) callback(err);
        else callback(null);
      });
    }
  })
}


DataProvider.prototype.getRunnerById = function(id, callback){
  runner.findById(id, function(err, doc){
    if ((err)||(doc == null)) callback("error");
    else callback(null, doc);
  })
}

DataProvider.prototype.getRunnersInRace = function(raceId, callback){
  var query = runner.where("raceId").equals(raceId);
  query.exec(callback);
}

DataProvider.prototype.getRunners = function(filterData, callback){
  var includeDisqualified = (filterData.includeDisqualified == "true");
  var includeMales =  (filterData.males == "true");
  var includeFemales =  (filterData.females == "true");
  var filterByTeams = (filterData.filterByTeams == "true");
  var teamName = (filterData.teamName);
  var query = runner.where("raceId").equals(filterData.raceId).where("waveId").equals(filterData.waveId);
  query = query.where("gunTime").ne(null);
  if (filterData.raceId == 8){
    if (filterData.waveId == 0){
      query = query.where("lapsCompleted").equals(8);
    }
    else{
      query = query.where("lapsCompleted").equals(4);
    }
  }
  if (!((includeFemales)&&(includeMales))){
    if (includeFemales) query = query.where("gender").equals("F");
    if (includeMales) query = query.where("gender").equals("M");  
  }
  if (!includeDisqualified) query = query.where("disqualified").equals(false);
  if (filterByTeams) query = query.where("team").equals(teamName);

  query.select("bibnumber firstName lastName startTime endTime gunTime chipTime gender comments team age lapsCompleted");
  query.limit(20);
  query.exec(function(err,runners){
    if (err) callback (err);
    else callback (null, runners);
  });
  
}

//added
DataProvider.prototype.getOneRunnerInRace = function(raceId, callback){
  runner.findOne({"raceId":raceId}, function(err, matchedRunner){
    if((err)||(matchedRunner == null)){
      callback("error");
    }
    else{
      callback(null,matchedRunner);
    }
  })
}

DataProvider.prototype.getDetectionsByEpcHeader = function(epcheader, callback){
  var regExpQuery = new RegExp("^"+ epcheader + "*");
  detection.find({"epc": regExpQuery }, function(err, matchedDetections){
    if(err || matchedDetections == null){
      callback("error");
    }
    else{
      callback(null, matchedDetections);
    }
  });
}
//up till ^ there

DataProvider.prototype.getRunner = function(raceId, bibnumber, callback){
  runner.findOne({"raceId":raceId, "bibnumber":bibnumber }, function(err, matchedRunner){
    if ((err)||(matchedRunner == null)) callback("error");
    else callback(null, matchedRunner);
  });
}

DataProvider.prototype.getRaceByRaceId = function(raceId, callback){
  race.findOne({"raceId": raceId }, function(err, matchedRace){
    if ((err)||(matchedRace == null)) callback("error", null);
    else callback(null, matchedRace);
  });
}

DataProvider.prototype.getRaces = function(callback){
  race.find().sort({'raceId':'ascending'}).exec(callback);
}

DataProvider.prototype.addRace = function(raceDetails, callback){
  getLargestRaceId(function(err, newRaceId){
    if (err) callback (err);
    else{
      var newRace = new race();
      newRace.raceName = raceDetails.raceName;
      newRace.raceDate = raceDetails.raceDate;
      newRace.raceId   = parseInt(newRaceId) + 1;
      var waves = [];
      raceDetails.waves.forEach(function(wave, waveIndex){
        var newWave = {
          waveId : waveIndex,
          waveName : (wave.Name.toUpperCase()).replace(/\s+/g, ''),
          waveDistance : wave.Distance,
        }
        waves.push(newWave);
      });
      newRace.waves = waves;
      newRace.save(callback);
    }
  });
}

var getLargestRaceId = function(callback){
  race.find().sort({'raceId':'descending'}).limit(1).exec(function(err, result){
    console.log(result);
    if (err) callback(err);
    else{

      if (result.length == 0) callback(null, 0);
      else callback(null, result[0].raceId);  
    }
    
  });
}

DataProvider.prototype.removeRunners = function(raceId, callback){
  runner.remove({"raceId":raceId}, function(err){
    callback(err);
  })
}

DataProvider.prototype.addRunner = function(runnerDetails, callback){
  var newRunner = new runner();
  newRunner.epc       = runnerDetails.epc;
  newRunner.bibnumber = runnerDetails.bibnumber;
  newRunner.raceId  = runnerDetails.raceId;
  newRunner.waveId  = runnerDetails.waveId;
  if (runnerDetails.firstName)  newRunner.firstName = runnerDetails.firstName;
  if (runnerDetails.lastName)   newRunner.lastName  = runnerDetails.lastName;
  if (runnerDetails.gender)   newRunner.gender    = runnerDetails.gender;
  if (runnerDetails.age)  newRunner.age       = runnerDetails.age;
  if (runnerDetails.team)   newRunner.team      = runnerDetails.team;
  if (runnerDetails.runnerClass) newRunner.runnerClass = runnerDetails.runnerClass;
  if (runnerDetails.numLaps) newRunner.numLaps    = runnerDetails.numLaps;
  newRunner.save(callback);
}

DataProvider.prototype.getWave = function (raceId, waveId, callback) {
  race.findOne({"raceId" : raceId, "waves.waveId": waveId}, function(err, foundWave){
    if ((err)||(foundWave == null)) callback("error", null);
    else {
      callback(null, foundWave);
    }
  });
}


DataProvider.prototype.getRunnerByEPC = function(epc, callback){
  runner.findOne({"epc":epc}, function(err, matchedRunner){
    if ((err)||(matchedRunner == null)) callback("error");
    else callback(null, matchedRunner);
  });
}

DataProvider.prototype.addDetection = function(epc, source, antenna, time, callback){
  var newDetection = new detection();
  newDetection.epc = epc;
  newDetection.source = source;
  newDetection.antenna = antenna;
  newDetection.time = time;
  newDetection.save(callback);
}


exports.DataProvider = DataProvider;