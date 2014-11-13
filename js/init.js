/* This initialization code gets the web api url from the manifest file
* and makes it available as a Javascript variable (for Angular).
* This code is taken from the example application of Lars Kristian Roland*/

 var xhReq = new XMLHttpRequest();
xhReq.open("GET", "manifest.webapp", false);
xhReq.send(null);
var serverResponse = JSON.parse(xhReq.responseText);
var dhisAPI = serverResponse.activities.dhis.href;

// TODO: Remove this from a production environment
var isDev = window.location.hostname == "localhost";
if (isDev) {
    console.log("Development mode active!");
}
