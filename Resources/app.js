// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

var win = Titanium.UI.createWindow();
win.backgroundColor = '#B5D5FF';
 
var web = Titanium.UI.createWebView({ 
	width:'150',
	height:'150',
	bottom:40,
	url:'../html/particle.html',
	backgroundColor:'transparent'});
	
web.addEventListener('error', function(e){
     // エラー発生時に実行される
     Ti.API.error(e.message);
});
win.add(web);

var button = Ti.UI.createButton({ bottom:6,
								  width:96, 
								  height:36, 
								  title:'touch me'
});
button.addEventListener('click', function(e){
	web.evalJS('startEmit({y_force:-1.9, max_particles:150, respawn:10, vel:[-2, 2], life:[0.02, .06]});');
});

win.add(button);

Titanium.App.addEventListener('started', function() {
	Ti.App.debug("particle started.");
});

Titanium.App.addEventListener('finshed', function() {
	Ti.App.debug("particle finished.");
});

win.open();
