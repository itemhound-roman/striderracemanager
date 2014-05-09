var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
var LapSchema = new Schema({
    lapNumber   : Number
  , lapStart    : { type : Date , default : null }
  , lapEnd      : { type : Date , default : null }
  , lapTime     : Number
})

var RunnerSchema = new Schema({
    bibnumber   : { type: String, required: true}
  , epc         : { type: String, required: true}  
  , firstName   : { type: String, default: "First Name"}
  , lastName    : { type: String, default: "Last Name"}
  , gender      : { type: String, default: "U"}
  , age         : { type: Number, default: 0 }
  , team        : { type: String, default: ""}
  , runnerClass : { type: String, default: ""}
  , startTime   : { type : Date, default : null }
  , endTime     : { type : Date, default : null }
  , gunTime     : Number
  , chipTime    : Number
  , raceId      : { type: Number, required: true }
  , waveId      : { type: Number, required: true }
  , laps        : [LapSchema]
  , numLaps     : { type : Number, default : 0 }
  , lapsCompleted        : { type : Number, default : 0 }
  , times       : [Date]
  , disqualified: { type : Boolean, default: false}
  , comments    : { type: String, default: "" }
});



RunnerSchema.index({ bibnumber  : 1, raceId: 1 });
RunnerSchema.index({ epc  : 1});
RunnerSchema.index({ gunTime  : 1});


module.exports = mongoose.model('RunnerModel', RunnerSchema)