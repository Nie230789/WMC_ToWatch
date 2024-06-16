// 1. APPLICATION STATE
const state = {
  videos: [],
  filterText: '',
  filterBy: 'title',
  sortBy: 'date-desc'
};

// 2. STATE ACCESSORS/MUTATORS FN'S
async function searchForVideo(searchTerm) {
  const apiKey = 'XXXXXXXXXX';
  try {
    const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(searchTerm)}&key=${apiKey}`);
    const videoData = await videoResponse.json();
    if (videoData.items && videoData.items.length > 0) {
      const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${videoData.items[0].snippet.channelId}&key=${apiKey}`);
      const channelData = await channelResponse.json();

      return {
        id:               videoData.items[0].id.videoId,
        title:            videoData.items[0].snippet.title,
        thumbnailUrl:     videoData.items[0].snippet.thumbnails.default.url,
        channelTitle:     videoData.items[0].snippet.channelTitle,
        channelId:        videoData.items[0].snippet.channelId,
        channelImageUrl:  channelData.items[0].snippet.thumbnails.default.url
      };
    }
  } catch (error) {
    console.error(error);
    alert("Error fetching video from API. Try again later.");
    return null;
  }
}

function addVideo(newVideo) {
  if (state.videos.some(existingVideo => existingVideo.id === newVideo.id)) {
    alert("This video is already on your Watchlist!");
    return;
  }
  newVideo.addedAt = new Date();
  state.videos.push(newVideo);
  state.videos = sortVideos(state.videos, state.sortBy);
  saveState();
  render();
}

function removeVideo(videoId) {
  state.videos = state.videos.filter(video => video.id !== videoId);
  saveState();
  render();
}

function filterVideos(videos, filterText, filterBy) {
  if (!filterText) return videos;
  return videos.filter(video =>
    filterBy === 'title' ? video.title.toLowerCase().includes(filterText.toLowerCase()) :
      video.channelTitle.toLowerCase().includes(filterText.toLowerCase())
  );
}

function sortVideos(videos, sortBy) {
  if (sortBy === 'date-old-new') {
    return videos.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
  } else if (sortBy === 'date-new-old') {
    return videos.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  } else if (sortBy === 'title-asc') {
    return videos.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'title-desc') {
    return videos.sort((a, b) => b.title.localeCompare(a.title));
  }
  return videos;
}

function saveState() {
  localStorage.setItem('toWatchVideos', JSON.stringify(state.videos));
}

function loadState() {
  const savedVideos = localStorage.getItem('toWatchVideos');
  if (savedVideos) {
    state.videos = JSON.parse(savedVideos);
    state.videos.forEach(video => {
      video.addedAt = new Date(video.addedAt);
    });
    state.videos = sortVideos(state.videos, state.sortBy);
  }
}

// 3. DOM NODE REFERENCES
const searchForm$ = document.getElementById('search-form');
const searchInput$ = document.getElementById('search-input');
const filterInput$ = document.getElementById('filter-input');
const filterType$ = document.getElementById('filter-type');
const sortType$ = document.getElementById('sort-type');
const videoList$ = document.getElementById('video-list');

// 4. DOM NODE CREATION FN'S
function createVideoItem(video) {
  const videoItem = document.createElement('li');
  videoItem.className = `video`;
  videoItem.setAttribute('data-id', video.id);

  videoItem.innerHTML = `
    <a href="https://www.youtube.com/watch?v=${video.id}">
        <img class="video__thumbnail" src="${video.thumbnailUrl}" alt="${video.title}">
    </a>
    <div class="video__description">
        <a href="https://www.youtube.com/watch?v=${video.id}">
            <h3 class="video__title">${video.title}</h3>
        </a>
        ${createChannel(video)}
    </div>
    <button class="remove-button">×</button>
  `;
  return videoItem;
}

function createChannel(video) {
  return `
    <div class="channel">
        <a href="https://www.youtube.com/channel/${video.channelId}">
            <img class="channel__image" src="${video.channelImageUrl}" alt="${video.channelTitle}">
        </a>
            <a href="https://www.youtube.com/channel/${video.channelId}">
            <p class="channel__name">${video.channelTitle}</p>
        </a>
    </div>
  `;
}

// 5. RENDER FN'S
function render(videos = state.videos) {
  videoList$.innerHTML = '';
  updateSortVisibility(videos);
  videoList$.append(...videos.map(createVideoItem));
}

function updateSortVisibility(videos) {
  sortType$.style.display = videos.length > 0 ? 'block' : 'none';
}

// 6. EVENT HANDLERS
async function onSearch(event) {
  event.preventDefault();
  const searchTerm = searchInput$.value;
  if (searchTerm !== "") {
    const video = await searchForVideo(searchTerm);
    if (video) {
      addVideo(video);
      render();
    }
  }
  searchInput$.value = '';
  console.log(state);
}

function onFilterInput() {
  state.filterText = filterInput$.value.trim();
  const filteredVideos = filterVideos(state.videos, state.filterText, state.filterBy);
  render(filteredVideos);
  console.log(state);
}

function onFilterTypeChange() {
  state.filterBy = filterType$.value;
  const filteredVideos = filterVideos(state.videos, state.filterText, state.filterBy);
  render(filteredVideos);
  console.log(state);
}

function onSortTypeChange() {
  state.sortBy = sortType$.value;
  const filteredVideos = filterVideos(state.videos, state.filterText, state.filterBy);
  const sortedVideos = sortVideos(filteredVideos, state.sortBy);
  render(sortedVideos);
  console.log(state);
}

function onRemoveButtonClick(videoId) {
  removeVideo(videoId);
  render();
  console.log(state);
}

// 7. INIT BINDINGS
searchForm$.addEventListener('submit', onSearch);
filterInput$.addEventListener('input', onFilterInput);
filterType$.addEventListener('change', onFilterTypeChange);
sortType$.addEventListener('change', onSortTypeChange);
videoList$.addEventListener('click', event => {
  if (event.target.classList.contains('remove-button')) {
    const videoId = event.target.closest('.video').getAttribute('data-id');
    onRemoveButtonClick(videoId);
  }
});

// 8. INITIAL RENDER
loadState();
render(state.videos);
console.log(state);
