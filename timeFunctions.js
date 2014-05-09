
exports.IsTime2AfterTime1 = function(time1, time2){
  return (time2 > time1);
}

exports.ComputeTimeDifference = function(start, end){
  return (( end.getTime() - start.getTime())/1000)
}


exports.DateStringToTimeString = function(DateString){
  var myDate = new Date(DateString);
  return ((myDate.getHours()) < 10 ? "0"+myDate.getHours() :myDate.getHours() ) +":" +((myDate.getMinutes()) < 10?  "0"+myDate.getMinutes() :myDate.getMinutes() ) +":" + (myDate.getSeconds() < 10?  "0"+myDate.getSeconds() :myDate.getSeconds() ) +" "+ (myDate.getHours() < 12?  "AM" : "PM" ); 
}

exports.SecondsToTimeString = function(seconds) {
  var hours = parseInt(seconds / 3600) % 24;
  var minutes = parseInt(seconds / 60) % 60;
  var seconds = seconds % 60;
  var TimeStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
  return TimeStr;
}

exports.SecondsToHHMM = function(seconds) {
  var hours = parseInt(seconds / 3600) % 24;
  var minutes = parseInt(seconds / 60) % 60;
  
  var TimeStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
  return TimeStr;
}