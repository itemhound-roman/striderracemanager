var findRunner = function(){
  console.log($("#bibToFind").val());
  displayRunner($("#bibToFind").val());
}

var findRunners= function(){
  console.log($("#bibToFind").val());
  displayRunners($("#bibsToFind").val());
}

var displayRunner = function(bibnumber){
  $.ajax("/api/getRunner",{
    type: 'POST',
    data: {
      raceId : raceId,
      bibnumber : bibnumber
    },
    success: showRunner,
    error : function(){
      noty({
        text: "No match found",
        layout: "top",
        type: "error",
        animateOpen : {
          opacity: "show"
        },
        closeButton: true
      })

    }
  })  
}


var displayRunners = function(bibnumbers){
  var bibz = bibnumbers.split(' ');
  var bibs = [];
  for (var i = 0; i < bibz.length; i++){
    bibs.push(bibz[i].replace(/[^a-zA-Z0-9]/g,''));
  }
  $.ajax("/api/getBibs",{
    type: 'POST',
    data: {
      raceId : raceId,
      bibnumbers : bibs
    },
    success: showRunners,
    error : function(){
      noty({
        text: "No match found",
        layout: "top",
        type: "error",
        animateOpen : {
          opacity: "show"
        },
        closeButton: true
      })

    }
  })  
}


var SecondsToTimeString = function(seconds) {
  var hours = parseInt(seconds / 3600) % 24;
  var minutes = parseInt(seconds / 60) % 60;
  var seconds = seconds % 60;
  var TimeStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
  return TimeStr;
}
var showRunner = function(data){
  console.log(data);
  $("#modal-lastName").val(data.lastName);
  $("#modal-firstName").val(data.firstName);
  $("#modal-bibnumber").val(data.bibnumber);
  $("#modal-comments").val(data.comments);
  $("#modal-gunTime").text( "Official Time: " + SecondsToTimeString(data.gunTime) );
  $("#modal_id").val(data._id);
  if (data.startTime != null)  $("#modal-startTime").val(toTimeString(data.startTime));
  else $("#modal-startTime").val('');
  if (data.endTime != null) $("#modal-endTime").val(toTimeString(data.endTime));
  else $("#modal-endTime").val('');
  $("#modal-gender").val(data.gender);
  $("#modal-team").val(data.team);
  $("#showRunnerModal").modal('show');
  $("#modal-disqualified").val(data.disqualified.toString());
  var textTimes = "";
  for (var i = 0 ; i < data.times.length; i++){
    var d = new Date(data.times[i]);
    textTimes+= d.toLocaleTimeString() + "\r\n";
  }

  var textLaps = "Total Laps Completed: " + data.lapsCompleted;
  for (var i = 0; i < data.laps.length; i++){
    textLaps+="\r\n";
    textLaps+="\r\n";
    textLaps+= ("Lap: " + (i+1))
    textLaps+="\r\n";
    textLaps+= ("Lap Start: " + new  Date(data.laps[i].lapStart).toLocaleTimeString());
    textLaps+="\r\n";
    if (data.laps[i].lapEnd == null)  textLaps+= ("Lap End: ");
    else textLaps+= ("Lap End: " + new  Date(data.laps[i].lapEnd).toLocaleTimeString());
  }

  $("#runner-laps").val(textLaps);
  $("#runner-times").val(textTimes);
}


var editRunner = function(){
  var runnerData = {
    id: $("#modal_id").val(),
    firstName: $("#modal-firstName").val(),
    lastName: $("#modal-lastName").val(),
    startTime : ($("#modal-startTime").val().length == 0)?(null):($("#modal-startTime").val()),
    endTime : ($("#modal-endTime").val().length == 0)?(null):($("#modal-endTime").val()),
    gender: $("#modal-gender").val(),
    raceId : raceId,
    comments: $("#modal-comments").val(),
    disqualified: ($("#modal-disqualified").val() == "true"),
    team:  $("#modal-team").val(),
  }
  $.ajax("/api/editRunner",{
    type: 'POST',
    data: runnerData,
    success: function(data){
      console.log(data);
      $("#showRunnerModal").modal('hide');
      filterRunners();
    },
    error : function(){
      $("#showRunnerModal").modal('hide');
      noty({
        text: "Error editing Runner",
        layout: "top",
        type: "error",
        animateOpen : {
          opacity: "show"
        },
        closeButton: true
      })

    }
  })  
}

var filterRunners = function(){
  var waveId = $("#waveName").val();
  var includeDisqualified = $("#includeDisqualified").is(":checked");
  var males = $("#maleRunners").is(":checked");
  var females = $("#femaleRunners").is(":checked");
  var filterByTeams = $("#filterByTeams").is(":checked");
  var teamName = $("#teamName").val();
  var searchParams = {
    raceId : raceId,
    waveId : waveId,
    includeDisqualified : includeDisqualified,
    males: males,
    females : females,
    teamName : teamName,
    filterByTeams: filterByTeams
  };
  console.log(searchParams);
  $.fn.dataTableExt.sErrMode = 'throw';
  $.ajax("/api/runners",{
    type: 'POST',
    data: searchParams,
    success: showRunners
  })
}

var toTimeString = function(time){
  console.log(time);
  var Time = (new Date(time));
  var TimeStr = (Time.getHours() < 10 ? "0" + Time.getHours() : Time.getHours()) + ":" + (Time.getMinutes() < 10 ? "0" + Time.getMinutes() : Time.getMinutes()) +  ":"+ (Time.getSeconds() < 10 ? "0" + Time.getSeconds().toFixed(0) : Time.getSeconds().toFixed(0));
  return TimeStr;
}

var SecondsToHHMMSS = function(seconds) {
  var hours = parseInt(seconds / 3600) % 24;
  var minutes = parseInt(seconds / 60) % 60;
  var secs = parseInt(seconds % 60);
  var TimeStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) +  ":"+ (secs < 10 ? "0" + secs.toFixed(0) : secs.toFixed(0));
  return TimeStr;
}

var SecondsToTimeString = function(seconds) {
  var hours = parseInt(seconds / 3600) % 24;
  var minutes = parseInt(seconds / 60) % 60;
  var seconds = (seconds % 60).toFixed(0);
  var TimeStr = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
  return TimeStr;
}

var showRunners = function (data) {
  // body...
  console.log(data);
  //turn data into an array
  $("#tableContainer").empty();
  $("#tableContainer").html("<table id='filteredRunners'></table>");
  var aaData = [];
  for (var i = 0; i < data.length; i++){
    aaData.push( [ data[i].bibnumber, data[i].firstName, data[i].lastName, data[i].gender, toTimeString(data[i].startTime), toTimeString(data[i].endTime), SecondsToTimeString(data[i].gunTime), data[i].comments, data[i].team, data[i].age, data[i].lapsCompleted ]);
  }
  console.log(aaData);
  var oTable = $("#filteredRunners").dataTable({
    "aaData" : aaData,
    "aoColumns" : [
      { "sTitle" : "Bib"},
      { "sTitle" : "First Name"},
      { "sTitle" : "Last Name"},
      { "sTitle" : "Gender"},
      { "sTitle" : "Start"},
      { "sTitle" : "End"},
      { "sTitle" : "Time"},
      { "sTitle" : "Comments"},
      { "sTitle" : "Team"},
      { "sTitle" : "Age"},
      { "sTitle" : "Laps"}
    ],
    "aaSorting": [[ 6, "asc" ]]

  });
  $(oTable.fnGetNodes()).click(function(data, data2){
    
    displayRunner(this.getElementsByTagName("td")[0].innerHTML);
  })

}

$(function()
{
  $("#bibToFind").keypress(function(e) {
    if(e.which == 13) findRunner();
  });

  $("#bibsToFind").keypress(function(e) {
    if(e.which == 13) findRunners();
  });


  $('.timepicker').datetimepicker({
    showSecond: true,
    timeOnly: true,
    timeFormat: 'HH:mm:ss',
    stepHour: 1,
    stepMinute: 1,
    stepSecond: 1
  });
});
