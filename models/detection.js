var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  

var DetectionSchema = new Schema({
    epc           : String
  , antenna       : Number 
  , source        : String
  , time          : { type : Date }
  , timeReceived  : { type: Date, default: Date.now}
})


DetectionSchema.index({source  : 1});


module.exports = mongoose.model('DetectionModel', DetectionSchema)
