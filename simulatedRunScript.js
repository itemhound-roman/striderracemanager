
var bibs = [];


var createEPC = function(bib){
  var epc = "69";
  console.log(bib);
  console.log(bib.length);
  for (; epc.length < 8-bib.length;){
    epc = epc + "0";
    console.log(epc);

  }
  return epc + bib;
}

for(var i = 0; i < 200; i++) bibs.push({ bib:i, gunTime:  0 + Math.floor((Math.random()*600)+1)});

var writer = function(bibnumber) {
 return function(){
  var a = bibnumber.toString();  
  var limit = 8-a.length;
  var epc = "";
  for (epc = "69"; epc.length < limit;){
    epc = epc + "0";
  }
  epc = epc + bibnumber;
  console.log("Writing: " + epc);
  var data = { 
      EPCs : epc+"-", 
      Source: "Paulo", 
      Antennas:"1-", 
      Times:  (parseInt(Date.now()/1000) + 28800) +"-"}
    ;
  //console.log( (new Date()).toLocaleTimeString() );
  $.ajax("http://localhost:8080/marathon/receivedetectionsunix_multiple.php", 
   {
     type: 'POST', 
     success: function(){console.log("success")}, 
     error: function(){console.log("error");}, 
     data: data
 });
 }
}
for (var i = 0; i < bibs.length; i++) {setTimeout(writer(bibs[i].bib) ,(bibs[i].gunTime*1000) )}