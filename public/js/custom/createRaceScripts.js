$(document).ready(function(){
  $('#raceDate').datepicker();
  $(".addWaveButton").on('click', AddWave);
})

console.log('alive');
var waveCtr = 0;
AddWave = function(){
  waveCtr++;


  //<div  class="row"><div class="span3"><input id="WaveName"><label>Wave Name</label></div><div class="span3"><input id="WaveDistance"><label>Wave Distance</label></div><div class="span2"><a id="RemoveWaveButton" onclick="RemoveWave()" type="" class="btn btn-warning">Remove Wave</a></div><div class="span2"><a id="AddSplitButton" onclick="AddSplit()" type="" class="btn btn-primary">Add Split</a></div>
  var newWave = $(
                  '<div  id="WaveRow'+waveCtr+'" class="waverow"> \
                    <div class = "control-group"> \
                      <label class = "control-label"> <strong>Wave Name</strong> </label> \
                      <div class = "controls"> \
                        <input class = "span6" id = "WaveName"> \
                        <p class = "help-block"> Wave Name </p> \
                      </div> \
                    </div> \
                    <div class = "control-group"> \
                      <label class = "control-label"> Wave Distance </label> \
                      <div class = "controls"> \
                        <input class = "span6" id = "WaveDistance"> \
                        <p class = "help-block"> Wave Distance in Meters </p> \
                      </div> \
                    </div> \
                    <div class = "control-group"> \
                      <label class = "control-label"> Remove Wave </label> \
                      <div class = "controls"> \
                        <a id="RemoveWaveButton" onclick="RemoveWave()" type="" class="btn btn-warning">Remove Wave</a> \
                      </div> \
                    </div> \
                  </div><hr>'
                  );
  $('#waves').append(newWave);
}

RemoveWave = function(){
  
  var toDetach =$(event.target).parent().parent().parent().attr('id');
  console.log(toDetach); 
  $('#'+toDetach).detach();
}

SubmitForm = function(){
  var toSubmit = new Object();
  
  toSubmit.RaceName = $('#raceName').val();
  toSubmit.RaceDate = $('#raceDate').val();
  toSubmit.Waves = [];
  
  $('#waves').find('.waverow').each(function(){
    
    var waveDistance = $(this).find('#WaveDistance').val();
    var waveName = $(this).find('#WaveName').val();
    
    var wave = new Object();
    wave.Name = waveName;
    wave.Distance = waveDistance;
    wave.Splits = [];
      $(this).find('.splitdetails').each(function(){
        var splitDistance = $(this).find('#SplitDistance').val();
        var splitName = $(this).find('#SplitName').val();
        var split = new Object();
        
        split.Distance = splitDistance;
        split.splitName = splitName;
        wave.Splits.push(split);
      });
    toSubmit.Waves.push(wave);
  });
  console.log(toSubmit);
  $.ajax("/createRace", {
    type: 'POST',
    data: toSubmit,
    success : function(){
      alert('Successfully created race');
      $(location).attr('href','/race');
    },
    error: function(){
      console.log("Error");
    }
  })

  
  
}


AddSplit = function(){
  var root  =$(event.target).parent().parent().parent().attr('id');
  
  waveNumber = root.substring(7);
  console.log(root); 
  var newSPLIT = $('<div class="row splitdetails"><div class ="span4"><input id="SplitName"><label>Split Name</label></div> <div class ="span4"><input id="SplitDistance"><label>Split Distance</label></div></div>'
                  );
  $('#'+root).append(newSPLIT);
}
