let currentCacheName = "static-v3";
let dynamicCacheName = "dynamic-v3";
const fallbackUrl = "/img/default.svg";

self.addEventListener("install", (event) => {
    event.waitUntil(
            caches.open(currentCacheName).then((cache) => {
            cache.addAll([
                "/",
                "/index.html",
                "/restaurant.html",
                "/js/restaurant.js",
                "/js/index.js",
                "/css/styles.css",
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
                            //for any other elements than Google Maps one
                            if (event.request.url.indexOf("img") > -1) {
                                if (!response.ok) {
                                    // if fetching the new image failed
                                    return caches.open(currentCacheName).then(cache => {
                                        return cache.match(fallbackUrl);
                                    })
                                }
                                // if fetching succeeded adds the image to the dynamic cache
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
                        return caches.open(currentCacheName)
                            .then((cache) => {
                                if (event.request.url.indexOf("img") > -1) {
                                    return cache.match(fallbackUrl);
                                }

                                if (event.request.url.indexOf("/restaurant.html?id") > -1){
                                    return cache.match("/restaurant.html");
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
                            cache.match(fallbackUrl);
                        }
                });
            }
        )
    )}
)