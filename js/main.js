const DBHelper = require('./dbhelper');
const LazyLoad = require('./lazyload.min');
let restaurants,
  neighborhoods,
  cuisines
let map
let markers = []
let mapBtn = document.getElementsByClassName('show-map-btn')[0];
let mapContainer = document.getElementById('map');
let myLazyLoad;

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      myLazyLoad.update();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    markers.forEach(m => m.setMap(null));
    //self.markers.forEach(m => m.setMap(null));
    markers = [];
    // self.markers = [];
  }
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const imgWrapper = document.createElement('div');
  imgWrapper.classList.add('img-wrapper');

  const picture = document.createElement('picture');
  const sourceWebp = document.createElement('source');
  const sourceJpeg = document.createElement('source');
  const image = document.createElement('img');

  imgWrapper.appendChild(picture)
  image.className = 'restaurant-img';
  let imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('data-src', imgUrl.small);

  sourceWebp.setAttribute('srcset', imgUrl.webp);
  sourceJpeg.setAttribute('srcset', imgUrl.small);

  picture.appendChild(sourceWebp);
  picture.appendChild(sourceJpeg);
  picture.append(image);

  image.setAttribute('alt', DBHelper.imageDescriptionForRestaurant(restaurant));
  imgWrapper.append(picture);
  li.append(imgWrapper);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  // Reducing and making links names more useful for screen readers
  const linkLabelLength = restaurant.name.length;
  let linkLabel = restaurant.name;
  if (linkLabelLength >= 20){
    // getting the first word of the restaurant name in case it's too long
    linkLabel = linkLabel.replace(/ .*/,'');
  }
  more.innerHTML = `ABOUT ${linkLabel}`;
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    // self.markers.push(marker);
    markers.push(marker);
  });
}

/**
 * Registering the service worker so that the site works offline
 */

if (navigator.serviceWorker) {
  navigator.serviceWorker.register("/sw.js").then((reg) => {
    
  }).catch((err) => { 
    return err;
  });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  myLazyLoad = new LazyLoad();
});

/**
 * Managing the "Show map" button events.
 */
mapBtn.addEventListener('click', (e) => {
  if (mapContainer.style.display === 'block') {
    mapContainer.style.display = 'none';
  } else {
    mapContainer.style.display = 'block';
  }
});