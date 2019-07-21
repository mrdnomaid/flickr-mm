const flickrAPIKey = '&api_key=103c346803ab76aec72fd83b612e8666';
let mm = [];
let mm35 = [];

document.getElementById('usernameInput').onkeydown = function(e){
   if(e.keyCode == 13){
     getFlickrID(document.getElementById('usernameInput').value);
   }
}

function statusMsg(message) {
  document.getElementById('usernameInput').style['text-align'] = 'left';
  document.getElementById('usernameInput').value = '';
  document.getElementById('usernameInput').placeholder = message;
}

function getFlickrID(username) {
  if(!username) {
    statusMsg('Please Enter a Photostream URL!');
    return;
  }

  statusMsg('Loading [looking up your URL]');

  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.urls.lookupUser${flickrAPIKey}&url={{USERNAME}}&format=json&jsoncallback=startProcess`.replace('{{USERNAME}}',username);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

function startProcess(flickrData) {
    let j = flickrData;

    if(!j.user) {
      statusMsg('User Not Found!');
    } else {
      loadUser(j.user.id);
    }
}

function loadUser(userID) {
  statusMsg('Loading [getting photos]');
  let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos${flickrAPIKey}&user_id={{USERID}}&page=1&per_page=500&format=json&jsoncallback=loadPhotos&extras=o_dims`.replace('{{USERID}}',userID);

  let flickrScript = document.createElement('script');
  flickrScript.src = flickrURL;
  document.body.appendChild(flickrScript);
  flickrScript.parentNode.removeChild(flickrScript);
}

let photoCount = 0;
function loadPhotos(flickrData) {
  statusMsg('Loading [loading photos]');
  let photos = flickrData.photos.photo;

  for(const photo of photos) {
    statusMsg(`Loading [loading photo #${photoCount}]`);

    if(photoCount <= 25) {
      photoList.innerHTML += `
        <div class="photo" id="photo-${photo.id}" style="
          background-image: url('https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_q.jpg');
          opacity: 0;
          animation-fill-mode: forwards;
          animation-delay: ${Math.floor(Math.random() * 10) + 0}s;
          margin: ${Math.floor(Math.random() * 16) + 4}px;
          height: ${Math.floor(Math.random() * 40) + 10}vh;
          width: ${Math.floor(Math.random() * 30) + 6}vw;
          border-radius: ${Math.floor(Math.random() * 8) + 1}px;
        ">
        </div>
      `;
    }

    let flickrURL = `https://api.flickr.com/services/rest/?method=flickr.photos.getExif${flickrAPIKey}&photo_id={{PHOTOID}}&page=1&per_page=1&format=json&jsoncallback=addPhoto&extras=o_dims`.replace('{{PHOTOID}}', photo.id);

    let flickrScript = document.createElement('script');
    flickrScript.src = flickrURL;
    document.body.appendChild(flickrScript);
    flickrScript.parentNode.removeChild(flickrScript);

    photoCount++;
  }
}

let addedPhotos = 0;
let photoList = document.getElementById('photoList');
function addPhoto(flickrData) {
statusMsg(`Loading [adding photo #${addedPhotos}]`);

  if(!flickrData) { statusMsg(`Error Adding Photo #${addedPhotos} (no data returned)`); return; }
  if(!flickrData.photo || !flickrData.photo.exif) { statusMsg(`Error Adding Photo #${addedPhotos} (no photo or exif data)`); return; }

  let exif = flickrData.photo.exif;
  for (const element of exif) {
    if(element.tag == 'FocalLengthIn35mmFormat') {
      mm35.push(parseInt(element.raw._content));
    } else if (element.tag == 'FocalLength') {

      if(document.getElementById(`photo-${flickrData.photo.id}`)) {
        document.getElementById(`photo-${flickrData.photo.id}`).classList.add('has-mm');
        document.getElementById(`photo-${flickrData.photo.id}`).innerHTML = `<span>${parseInt(element.raw._content)}mm</span>`;
        document.getElementById(`photo-${flickrData.photo.id}`).style.order = parseInt(element.raw._content);
      }

      mm.push(parseInt(element.raw._content));
    } else {
      continue;
    }
  }
  addedPhotos++;

  if(addedPhotos >= photoCount) {
    doneEverything();
  }
}

function doneEverything() {
  statusMsg(`Loading [done! calculating averages]`);

  let mmTtl = 0;
  for(const photo of mm) {
    mmTtl += photo;
  }
  let mmAvg = mmTtl / mm.length;


  let mm35Ttl = 0;
  for(const photo of mm35) {
    mm35Ttl += photo;
  }
  let mm35Avg = mm35Ttl / mm35.length;

  let mm35string = '';
  if(mm35Avg) {
    mm35string = `<h2 class="animated fadeInUp">${parseInt(mm35Avg)}mm <span style="font-size: 0.8em; opacity: 0.8;">&mdash; 35mm equivalent</span><h2>`
  }

  for(const e of document.querySelectorAll('div.photo:not(.has-mm)')) {
    e.style.display = 'none';
  }

  for(const e of document.querySelectorAll('div.photo')) {
    e.classList.add('animated');
    e.classList.add('fadeIn');

    if(photoCount < 5) {
      e.style['animation-delay'] = '0s';
    }
  }

  statusMsg(`Loading [done!]`);
  document.getElementById('stuff').innerHTML = `
    <h1 class="animated fadeInUp"><span style="opacity: 0.5;">~</span>${parseInt(mmAvg)}mm</h1>
    ${mm35string}
  `;
}
