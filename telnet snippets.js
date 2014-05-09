var net = require('net');
var client = net.connect({port:23, host:'gingging.local'}, function(){
   client.on('data', function(data) {
     console.log('data:', data.toString());
   });

   client.on('error', function(err) {
     console.log('error:', err.message);
   });

   client.write('root\n');
   client.write('impinj\n');
   client.write('show network summary\n');
});
