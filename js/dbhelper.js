const idbHandler = require('./idb-handler');

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/`).then((data) => {
        // fetches data first to get content
        if (!data.ok) {
          return idbHandler.readIdbData("restaurants").then(restaurants => {
            callback(null, restaurants);
          });
        }
        return data.json().then((responseData) => {
          // if data is recieved, populate the database first
          responseData.forEach(restaurant => {
            idbHandler.checkAndUpdateDatabase("restaurants", restaurant);
          });
          callback(null, responseData);
        });
    }).catch(err => {
      return idbHandler.readIdbData("restaurants").then(restaurants => {
        callback(null, restaurants);
      });
    });
  }
  
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`).then((data) => {
    // fetches data first to get content
      if (!data.ok) {
        return idbHandler.getDbItem("restaurants", id).then(restaurant => {
          if (restaurant) {
            // if restaurants objectStore contains the specified restaurant
            return callback(null, restaurant);
          }
        });
      }
      return data.json().then((responseData) => {
        // if data is recieved, populate the database first
        idbHandler.checkAndUpdateDatabase('restaurants', responseData);
        callback(null, responseData);
      })
    }).catch((err) => {
      return idbHandler.getDbItem("restaurants", id).then(restaurant => {
        if (restaurant) {
          // if restaurants objectStore contains the specified restaurant
          return callback(null, restaurant);
        }
      })
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  static fetchRestaurantReviews(id, callback) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`).then((data) => {
      if (!data.ok){
        idbHandler.filterDbItemsByProperty("reviews", "restaurant_id", parseInt(id)).then(reviews => {
          if (reviews.length){
            return callback(null, reviews);
          } else {
            const error = (`Request failed. Returned status of ${data.status}`);
            callback(error, null);
          };
        });
      };
      return data.json().then(responseData => {
        responseData.forEach(review => {idbHandler.checkAndUpdateDatabase('reviews', review)});
        callback(null, responseData);
      })
    }).catch(err => {
      idbHandler.filterDbItemsByProperty("reviews", "restaurant_id", parseInt(id)).then(reviews => {
        if (reviews.length){
          return callback(null, reviews);
        };
      });
    });
  }

  static postReview(data) {
    return fetch("http://localhost:1337/reviews/", {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(data)
    }).then((res) => {
      res.json().then((data) => {
        console.log(data);
      })
    })
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // EDIT : I decided to return an object so as to provide different image sizes
    return {
      original: `/img/photos/${restaurant.photograph}.jpg`,
      small: `/img/photos/small/${restaurant.photograph}.jpg`,
      medium: `/img/photos/medium/${restaurant.photograph}.jpg`,
      webp: `/img/photos/small/${restaurant.photograph}.webp` 
    };
  }
  
  static checkFavoriteStatus(id){
    let isFavorite = false;
    return fetch("http://localhost:1337/restaurants/?is_favorite=true")
      .then(data => {
        if (data) {
          data.json().then(restaurants => {
            restaurants.forEach(restaurant => {
              if (restaurant.id === id){
                console.log("restaurant found among the favourites");
                isFavorite = true;
              }
            })
          })
        }
      }).then(() => {
        return isFavorite;
      });
  }
  

  static markFavorite(callback, id){
    this.checkFavoriteStatus(id).then(found => {
      console.log(found);
      if (found){
        return fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=false`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          },
          method: "PUT"
        }).then(() => {
          callback(false);
        });
      } else {
        return fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=true`, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          },
          method: "PUT"
        }).then(() => {
          callback(true);
        });
      }
    });
  }
  /**
   * Restaurant image attribute description.
   */
  static imageDescriptionForRestaurant(restaurant) {
    // adding different alt attributes for each picture
    return `${restaurant.name} restaurant`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

module.exports = DBHelper;