$(document).ready(function(){
  //$(".iphone-toggle")`.iphoneStyle();
  $(".startWaveButton").click(function(e){    
    //e.preventDefault();
    if($(this).hasClass('disabled')){
      console.log('wave already started');
    }
    else{
      startWave($(this).attr("tag"));
    }
  });

  $(".finishFrenzyButton").click(function(){
    //e.preventDefault();
    if($(this).hasClass('disabled')){
      console.log('finish frenzy already enabled');
    }
    else{
      finishFrenzyWave($(this).attr("tag"));
    }
  });

  $("#downloadDetectionsButton").click(function(){
    writeDetections(raceId);
  });

  $("#downloadRaceDataButton").click(function(){
    //e.preventDefault();
    //$('#loadRunnersModal').modal('show');
  });  
  
  $('#loadRunnersButton').click(function(e){
    e.preventDefault();
    $('#loadRunnersModal').modal('show');
  });
});

var writeDetections = function(raceId){
  $.ajax("/api/writeDetections", {
    type: "POST",
    data: {
      raceId : raceId,
    },
    success: function(data){
      console.log("Success!");
      alert("Successfully written data");
    },
    error:  function(){
      console.log("error");
    }
  });
}

var startWave = function(waveId){
  var startTime = new Date();
  console.log('staring now');
  $.ajax("/api/startWave", {
    type: "POST",
    data: {
      raceId : raceId,
      waveId: waveId,
      startTime : startTime
    },
    success: function(){
      console.log("Success!");
      $('.startWaveButton[tag = '+waveId+']').addClass('disabled');
      $('.raceStartTime[tag = '+waveId+']').text(startTime.toLocaleTimeString());
      $('.racestatuslabel[wave = '+waveId+']').removeClass('label-success').addClass('label-important').text('Running');
    },
    error:  function(){
      console.log("error");
      

    }
  })
}

var finishFrenzyWave = function(waveId){
  var startTime = new Date();
  $.ajax("/api/finishFrenzy", {
    type: "POST",
    data: {
      raceId : raceId,
      waveId: waveId,
      startTime : startTime
    },
    success: function(){
      console.log("Success!");
      $('.finishFrenzyButton[tag = '+waveId+']').addClass('disabled');
    },
    error:  function(){
      console.log("error");
    
    }
  })
}