var socket = io.connect();

$(document).ready(function(){
  $("#syncReaderTimeButton").on('click', function(){
    syncReaderTime();
  })
});

var ReaderMap = {};
/*
var readerNames = [];

$.ajax("/readerNames", {
  type: 'GET',
  success: function(data){
    readerNames = data;
    console.log(readerNames);
  } 
});
*/

socket.on('pingreaders', function(data){
  console.log(data);
  if(!data.readerStatus)
    alert(data.readerName + " seems to be dead!");
})

socket.on('readers', function(data){
  console.log(data);
  NewReader(data);
  
  $.ajax("/readerNames", {
    type: 'POST',
    data: {readerName: data.readerName},
    success: function(){
      console.log("ok");
    },
    error: function(data){
      console.log(data);
    }  
  })
});

var syncReaderTime = function(){
  var readerAddress = $("#readerToSync").val();
  console.log(readerAddress);
  $.ajax("/api/syncReaderTime", {
    type: 'POST',
    data: {readerAddress: readerAddress},
    success: function(){ alert('Successfully synced reader');},
    error:  function(data){alert('FAILED TO SYNC READER \n' + data) ;}

  })
}

var NewReader = function(data){
  if (ReaderMap[data.readerName] == null){
    ReaderMap[data.readerName] = 'Present';
    $("#tableBody").append(
      '<tr><td>'+data.readerName+'</td><td class="reader"><div reader="'+data.readerName+'" antenna="1" class="antenna antennaNotFound"> &nbsp</div></td><td class="reader"><div reader="'+data.readerName+'" antenna="2" class="antenna antennaNotFound"> &nbsp</div></td><td class="reader"><div reader="'+data.readerName+'" antenna="3" class="antenna antennaNotFound"> &nbsp</div></td><td class="reader"><div reader="'+data.readerName+'" antenna="4" class="antenna antennaNotFound"> &nbsp</div></td><td reader='+data.readerName+' time=></td></tr>'
    );
  }
  for (var i = 0; i < data.antennas.length; i++){
    $(".antenna[reader = '"+data.readerName+"' ][antenna = '"+data.antennas[i]+"']").removeClass('antennaNotFound').stop().css("background-color","#11D406").animate({"background-color":"#D40633"},5000,'linear', function(){})   
  }

  $("td[reader = '"+data.readerName+"' ][time]").text( (new Date( ((data.lastSeenTime - 28800) *1000) ).toLocaleString()));


}
//$(".antenna[reader = 'Paulo' ][antenna = '1']").removeClass('antennaNotFound').stop().css("background-color","#11D406").animate({"background-color":"#D40633"},5000,'linear', function(){})