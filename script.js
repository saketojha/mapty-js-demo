'use strict';

// prettier-ignore
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, duration, distance) {
    this.coords = coords; // ([lat,long])
    this.duration = duration; // in mins
    this.distance = distance; // in km
  }

  _setDescription(){
      // prettier-ignore
const months = ['January','February','March','April','May','June','July','August','September','October','November','December',
  ];
  this.description =`${this.type} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

let run1 = new Running([29, -20], 15, 5, 11);
let cyc1 = new Cycling([29, -20], 25, 50, 10);
console.log(run1, cyc1);
/////////////Appppilication Architecture ///////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Getting user current postion
    this._getPosition();

    //getting data from localStorage
    this._getLocalStorage();

    //attaching event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Sorry not able to find your current position');
        }
      );
    }
  }

  _loadMap(position) {
    let { latitude } = position.coords;
    let { longitude } = position.coords;
    let cords = [latitude, longitude];
    console.log(`https://www.google.com/maps/@${latitude},${longitude},15z`);

    this.#map = L.map('map').setView(cords, 40);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //setting up the marker when we click on particular latlang
    //handling the click event in map
    this.#map.addEventListener('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  //showing the form element by removing hidden class
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //clearing the values after submitting the data
    inputDistance.value =
      inputCadence.value =
      inputElevation.value =
      inputDuration.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  //changing to elev gain if chose cycling
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //logging a new workout
  _newWorkout(e) {
    e.preventDefault();
    //   console.log(inputDistance.value, inputType.value, inputCadence.value);
    //Get data from Form
    let type = inputType.value; // or Number(inputType.value);
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    let { lat, lng } = this.#mapEvent.latlng;
    let workout;

    let validNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    let postiveNum = (...inputs) => inputs.every(inp => inp > 0);

    //check if data is valid

    //if workout is running , create new object
    if (type === 'running') {
      let cadence = +inputCadence.value;
      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validNumber(distance, duration, cadence) ||
        !postiveNum(distance, duration, cadence)
      )
        return alert('Hi there!! Please enter a postive Number');
      workout = new Running([lat, lng], duration, distance, cadence);
    }

    //if workout is cycling , create new object
    if (type === 'cycling') {
      let elevation = +inputElevation.value;
      //check if data is valid
      if (
        !validNumber(distance, duration, elevation) ||
        !postiveNum(distance, duration)
      )
        return alert('Hi there!! Please enter a postive Number');
      workout = new Cycling([lat, lng], duration, distance, elevation);
    }
    //Add new object to workout array
    this.#workouts.push(workout);
    // console.log(this.#workouts);

    //render the workout on map as a marker
    this._renderWorkoutMarker(workout);

    //render workout on list

    this._renderWorkout(workout);
    //hide the form + clearing the values after submitting the data
    this._hideForm();

    //storig data in local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          closeOnClick: false,
          autoClose: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopUp(e) {
    const markerEl = e.target.closest('.workout');
    // console.log(markerEl);
    if (!markerEl) return;

    const workout = this.#workouts.find(
      work => work.id === markerEl.dataset.id
    );

    this.#map.setView(workout.coords, 40, {
      animate: true,
      pan: {
        duration: 1.25,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log('data:', data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  //resetting local storage
  _reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

let app = new App();
