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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    idbHandler.readIdbData('restaurants').then(restaurants => {
      if (restaurants.length > 1) {
          /* if the first load of the site happens on a restaurant page, there'll only be one item in the database,
          => making sure that all restaurants are there first before using the database 
          */
          return callback(null, restaurants);
        } else {
          return fetch(DBHelper.DATABASE_URL).then((data) => {
            // fetches data first to get content
            if (!data.ok) {
              const error = (`Request failed. Returned status of ${data.status}`);
              callback(error, null);
            }
            return data.json().then((responseData) => {
              // if data is recieved, populate the database first
              responseData.forEach(restaurant => idbHandler.storeIdbData('restaurants', restaurant));
              callback(null, responseData);
            })
          });
        }
      })
      .catch((err) => {
        console.error(err);
        const error = (`Request failed. Returned status of ${err.status}`);
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    idbHandler.getDbItem('restaurants', id).then(restaurant => {
      if (restaurant) {
        // if restaurants objectStore contains the specified restaurant
        return callback(null, restaurant);
      } else {
        return fetch(`${DBHelper.DATABASE_URL}/${id}`).then((data) => {
          // fetches data first to get content
          if (!data.ok) {
            const error = (`Request failed. Returned status of ${data.status}`);
            callback(error, null);
          }
          return data.json().then((responseData) => {
            // if data is recieved, populate the database first
            idbHandler.storeIdbData('restaurants', responseData);
    
            callback(null, responseData);
          })
        });
      }
    })
    .catch((err) => {
      const error = (`Request failed. Returned status of ${err.status}`);
      callback(error, null);
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
      original: `/img/${restaurant.photograph}.jpg`,
      small: `/img/small/${restaurant.photograph}.jpg`,
      medium: `/img/medium/${restaurant.photograph}.jpg`
    };
    
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