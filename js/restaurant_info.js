const DBHelper = require('./dbhelper');
let restaurant;
let reviews;
var map;
const form = document.getElementsByTagName("form")[0];
const favHeading = document.getElementsByClassName('fav')[0];
let radioButtons = document.querySelectorAll("input[type='radio']");
const favoriteBtn = document.getElementById("favoritebtn");


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

const showFavoriteStatus = (visible) => {
  if (visible){
    favHeading.style.display = "block";
    favHeading.textContent = "You favourited this restaurant";
  } else {
    favHeading.style.display = "none";
    favHeading.textContent = "";
  }
}

const handleFavButtonLabel = (favorited) => {
  if (favorited) {
    favoriteBtn.innerText = "Unfavorite this restaurant";
    showFavoriteStatus(true);
  } else {
    favoriteBtn.innerText = "Favorite this restaurant";
    showFavoriteStatus(false);
  }
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current restaurant reviews.
 */
const fetchReviewsFromUrl = (callback) => {
  const id= getParameterByName("id");
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantReviews(id, (error, reviews) => {
      if (!reviews) {
        console.error(error);
        return;
      }
      return callback(null, reviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  DBHelper.checkFavoriteStatus(restaurant.id).then((favoriteStatus) => {
    console.log(favoriteStatus);
    showFavoriteStatus(favoriteStatus);
    handleFavButtonLabel(favoriteStatus);
  });
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const image = document.getElementById('restaurant-img');
  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant);

  //Setting the picture element for different image sizes
  const pictureElement = document.getElementsByTagName('picture')[0];
  const srcElementLarge = document.createElement('source');
  const srcElementMedium = document.createElement('source');

  //Setting different media attributes for specific sizes
  srcElementLarge.setAttribute('media', '(min-width: 1000px)');
  srcElementLarge.setAttribute('srcset', imgUrl.original);
  srcElementMedium.setAttribute('media', '(min-width: 678px)'); 
  srcElementMedium.setAttribute('srcset', imgUrl.medium);    

  //Structuring the picture element
  pictureElement.insertBefore(srcElementLarge, image);
  pictureElement.insertBefore(srcElementMedium, image);

  //Defining the image tag with its source set to the smallest picture
  image.src = imgUrl.small;
  image.className = 'restaurant-img';
  image.setAttribute("alt", DBHelper.imageDescriptionForRestaurant(restaurant));
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  
  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fetchReviewsFromUrl((error, restauReviews) => {
    self.reviews = restauReviews;
    fillReviewsHTML();
  });
  
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
// const fillReviewsHTML = (reviews = self.reviews) => {
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.updatedAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  let ratingStars = "";
  for (let i=0; i < review.rating; i++){
    ratingStars += "&#x2605;";
  }
  rating.innerHTML = `Rating: ${ratingStars}`;
  rating.classList.add("rating");
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

favoriteBtn.addEventListener("click", (e) => {
  let restaurant_id = parseInt(getParameterByName("id"));
  DBHelper.checkFavoriteStatus(restaurant_id)
    .then(favoriteStatus => {
      DBHelper.markFavorite(restaurant_id, !favoriteStatus, handleFavButtonLabel);
    });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  // let chosenRating = document.querySelector('input[type="radio"]:checked').value;
  let chosenRating;
  for (let i=1; i < 6; i++){
    let val = `rating-${i}`;
    if (form[val].checked === true){
      chosenRating = form[val].value;
      break;
    }
  }
  let restaurant_id = parseInt(getParameterByName("id"));
  let reviewData = {
    restaurant_id: restaurant_id,
    name: form.username.value,
    rating: chosenRating,
    comments: form.comment.value
  }
  DBHelper.postReview(reviewData);
})