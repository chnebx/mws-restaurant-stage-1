let currentCacheName = "static-v1";
let dynamicCacheName = "dynamic-v1";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(currentCacheName).then((cache) => {
            cache.addAll([
                "/",
                "/index.html",
                "/restaurant.html",
                "/js/restaurant_info.js",
                "/js/dbhelper.js",
                "/js/main.js",
                "/css/styles.css",
                "/data/restaurants.json",
                "/skeleton.html"
            ]);
        })        
    );
})

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cachenames => {
            return Promise.all(
                cachenames.filter((cachename) => {
                    return cachename != dynamicCacheName && cachename != currentCacheName ;
                }).map((cacheData) => {
                    return caches.delete(cacheData);
                })
            );
        }))
    );
})

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                    .then((response) => {
                        if (event.request.url.indexOf("maps.googleapis") == -1) {
                            return caches.open(dynamicCacheName)
                            .then((cache) => {
                                cache.put(event.request.url, response.clone());
                                return response;
                            });
                        } else {
                            if (response){
                                return response;
                            }
                        }
                    })
                    .catch((err) => {
                        return caches.open(currentCacheName)
                            .then((cache) => {
                                return cache.match("/skeleton.html");
                        });
                    })
                };
            }).catch((err) => {
                return caches.open(currentCacheName)
                    .then((cache) => {
                        if (event.request.url.startsWith("http://localhost:5000/restaurant")){
                            return cache.match("/skeleton.html");
                        }
                });
            })
    )
})