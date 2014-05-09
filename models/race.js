var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  

var WaveSchema = new Schema({
    waveId        : Number
  , waveName      : String
  , waveDistance  : Number
  , waveStart     : { type : Date, default: null }
  , hasStarted    : { type: Boolean, default: false }
  , hasFinishFrenzyEnabled : { type: Boolean, default: false }
  , numRunners    : { type : Number, default : 0}
  , numStarters   : { type : Number, default : 0}
  , numFinishers  : { type : Number, default : 0}
  
})

var RaceSchema = new Schema({
    raceId        : Number 
  , raceName 			: String
  , raceDate      :  { type : Date, default: null } 
  , waves         : [WaveSchema]
  , notes         : String
  , teams         : [String]
});

RaceSchema.index({raceName  : 1});


module.exports = mongoose.model('RaceModel', RaceSchema)
