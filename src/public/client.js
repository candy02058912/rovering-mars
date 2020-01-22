const initialState = Immutable.fromJS({
  rovers: ["Curiosity", "Spirit", "Opportunity"],
  meta: [],
  photos: {
    curiosity: [],
    spirit: [],
    opportunity: []
  }
});

let store = initialState;

// add our markup to the page
const root = document.getElementById("root");

const updateStore = (store, newState) => {
  store = store.mergeDeep(newState);
  console.log(newState.toJS(), store.toJS(), "store");
  render(root, store);
};

const render = async (root, state) => {
  root.innerHTML = await App(state);
  $(".carousel").slick({
    dots: true,
    fade: true,
    arrows: false,
    autoplay: true,
    mobileFirst: true
  });
};

// create content
const App = state => {
  const rovers = state.get("rovers");
  const meta = state.get("meta");
  const photos = state.get("photos");
  if (!meta.size) {
    getRoverMetas();
  }
  if (meta.size && !photos.get("curiosity").size) {
    getRoverPhotos("curiosity", meta.get(0).get("max_sol"), state);
  }
  if (meta.size && photos.get("curiosity").size && !photos.get("spirit").size) {
    getRoverPhotos("spirit", meta.get(1).get("max_sol"), state);
  }
  if (
    meta.size &&
    photos.get("curiosity").size &&
    photos.get("spirit").size &&
    !photos.get("opportunity").size
  ) {
    getRoverPhotos("opportunity", meta.get(2).get("max_sol"), state);
  }
  return `
        <header><a href="#"><img width="100%" src="../assets/images/header.png"></a></header>
        ${Nav(rovers)}
        <div class="carousel" style="margin: 1rem 0 0">
          <div><img class="slick-img" src="//apod.nasa.gov/apod/image/2001/ngc602_ChandraHubbleSpitzer_960.jpg"></div>
          <div><img class="slick-img" src="//apod.nasa.gov/apod/image/2001/NacreousPMHeden.jpg"></div>
          <div><img class="slick-img" src="//apod.nasa.gov/apod/image/2001/ngc602_ChandraHubbleSpitzer_960.jpg"></div>
          <div><img class="slick-img" src="//apod.nasa.gov/apod/image/2001/NacreousPMHeden.jpg"></div>
        </div>
        <main>
          ${meta.size ? RoverList(meta, photos) : "Fetching Meta..."}
        </main>
        <footer></footer>
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
  render(root, store);
});

// ------------------------------------------------------  COMPONENTS
const Nav = rovers => {
  return `<nav>${rovers
    .map(rover => `<a href="#${rover}">${rover}</a>`)
    .join("")}</nav>`;
};

const RoverList = (meta, photos) => {
  return meta
    .map((m, ix) => {
      const name = m.get("name");
      const landingDate = m.get("landing_date");
      const launchDate = m.get("launch_date");
      const status = m.get("status");
      const maxSol = m.get("max_sol");
      const maxDate = m.get("max_date");
      const totalPhotos = m.get("total_photos");
      return `
        <section id="${name}">
          <div class="bgMask" style="background-image: url('../assets/images/${name}.jpg')">
            <div class="wrapper">
              <article class="info">
                <h2>${name}</h2>
                <ul class="info-list">
                  <li>Landing Date: ${landing_date}</li>
                  <li>Launch Date: ${launch_date}</li>
                  <li>Status: ${status}</li>
                  <li>Max Sol: ${max_sol}</li>
                  <li>Max Date: ${max_date}</li>
                  <li>Total Photos: ${total_photos}</li>
                </ul>
              </article>
            </div>
          </div>
         ${
           photos.get(name.toLowerCase()).size
             ? RoverGallery(photos.get(name.toLowerCase()))
             : "Fetching Photos..."
         }
        </section>
        `
    )
    .join("");
};

const RoverGallery = photos => {
  const renderRoverImage = imgSrc =>
    `<div><img class="slick-img" src="${imgSrc}"></div>`;
  return `
  <h1 style="text-align: center">Recent Photos</h1>
  <div class="carousel" style="margin: 1rem 0 0">
  ${photos
    .map(photo => {
      return renderRoverImage(photo.get("img_src"));
    })
    .join("")}
  </div>
  `;
};

// ------------------------------------------------------  API CALLS

const getRoverMetas = () => {
  fetch(`http://localhost:3000/rovers`)
    .then(res => res.json())
    .then(meta => updateStore(store, Immutable.fromJS({ meta })));
};

const getRoverPhotos = (rover, maxSol, state) => {
  fetch(`http://localhost:3000/rover/${rover}?maxSol=${maxSol}`)
    .then(res => res.json())
    .then(
      photos =>
        console.log("update store", state.toJS()) ||
        updateStore(
          state,
          Immutable.fromJS({
            photos: { [rover.toLowerCase()]: photos.flat() }
          }),
          `photos.${rover.toLowerCase()}`
        )
    );
};
