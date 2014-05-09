var socket = io.connect();

var addMessage = function(){
  $.ajax("/addMessage", {
    type: 'POST',
    data: {
      raceId: raceId,
      message: $("#messageToSubmit").val()
    },
    success: function(data){
      console.log(data);
      $("#messageToSubmit").val('');
    }
  })
}

socket.on('chat', function(data){
  if (data.raceId == raceId){
    $("#raceNotes").append("\r\n" + data.message).scrollTop($('#raceNotes')[0].scrollHeight);
    
    noty({
        text: "New Chat Message: " + data.message,
        layout: "top",
        type: "information",
        animateOpen : {
          opacity: "show"
        },
        closeButton: true,
        dismissQueue: true
      });
  }
});
