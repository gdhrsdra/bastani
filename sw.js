/* Bump VERSION whenever you change any cached file other than index.html */
var VERSION='bastani-v1',FONTS='bastani-fonts';
var CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon.svg'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==VERSION&&k!==FONTS;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===location.origin){
    if(req.mode==='navigate'){
      /* network first (so updates arrive), fall back to cache when offline or slow */
      e.respondWith(new Promise(function(resolve){
        var done=false;
        function fallback(){caches.match('index.html').then(function(r){if(!done){done=true;resolve(r||Response.error());}});}
        var t=setTimeout(fallback,3500);
        fetch(req).then(function(res){
          clearTimeout(t);
          if(res&&res.ok){var cp=res.clone();caches.open(VERSION).then(function(c){c.put('index.html',cp);});}
          if(!done){done=true;resolve(res);}
        }).catch(function(){clearTimeout(t);fallback();});
      }));
      return;
    }
    e.respondWith(caches.match(req).then(function(hit){
      return hit||fetch(req).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(VERSION).then(function(c){c.put(req,cp);});}return res;});
    }));
    return;
  }
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(res){if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());return res;}).catch(function(){return hit;});
        return hit||net;
      });
    }));
  }
});
