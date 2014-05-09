var raceIdToDelete;

var DeleteRace = function(raceId, raceName){
  $("#raceToBeDeleted").text("Delete " + raceName + " ?");
  raceIdToDelete = raceId;
  $("#deleteRaceModal").modal('show');
}

var ConfirmDeleteRace = function(){
  console.log(raceIdToDelete);
  $.ajax("/deleteRace", {
    type: "POST",
    data: {
      raceId : raceIdToDelete,
    },
    success: function(){
      console.log("Success!");
      alert("Successfully deleted Race");
      document.location.reload();
    },
    error:  function(){
      alert("Error in deleting race");
      document.location.reload();
    }
  });
}