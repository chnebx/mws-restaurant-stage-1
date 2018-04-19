let currentCacheName = "static-v1";
let dynamicCacheName = "dynamic-v1";
const fallbackUrl = "/img/default.svg";

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
                "/js/idb-handler.js",
                "/js/idb.js",
                "/css/styles.css",
                "/data/restaurants.json",
                "/skeleton.html",
                "/img/default.svg"
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
        })),   
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
                            if (event.request.url.indexOf("img") > -1 && !response.ok) {
                                return caches.open(currentCacheName).then(cache => {
                                    return cache.match(fallbackUrl);
                                })
                            }
                            if (event.request.url.indexOf("img") > -1) {
                                return caches.open(dynamicCacheName)
                                .then((cache) => {
                                    cache.put(event.request.url, response.clone());
                                    return response;
                                });
                            }
                            return response;
                        } else {
                            if (response) {
                                return response;
                            }
                        }
                    })
                    .catch((err) => {
                        console.log("fail");
                        return caches.open(currentCacheName)
                            .then((cache) => {
                                if (event.request.url.indexOf("img") > -1) {
                                    console.log("image not found");
                                    return cache.match(fallbackUrl);
                                }
                                return cache.match("/skeleton.html");
                        });
                    })
                };
            }).catch((err) => {
                return caches.open(currentCacheName)
                    .then((cache) => {
                        if (event.request.url.startsWith("http://localhost:5000/restaurant")){
                            cache.match("/skeleton.html");
                        }

                        if (event.request.url.indexOf("img") > -1) {
                            console.log("image not found");
                            cache.match(fallbackUrl);
                        }
                });
            }
        )
    )}
)