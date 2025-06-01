const API_URL = 'https://script.google.com/macros/s/AKfycbwdbELcANTFzy7Jcdb37hQeKmBVYszWJKJFt8QB_xA1-SMJTP8yTJ76edUm_TqDAGZK/exec';
let currentStep = 1;
let player;
let recentlyViewed = JSON.parse(localStorage.getItem('perunFilmRecentlyViewed')) || [];
let allContent = [];
let currentUser = null;
let currentItem = null;

// Ładowanie YouTube IFrame API
let tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    // Inicjalizacja odtwarzacza w openMediaModal
}

function initializePlayer(videoId) {
    if (player) player.destroy();
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'controls': 0,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': () => showToast('Błąd ładowania wideo')
        }
    });
}
document.getElementById('loginModal').addEventListener('cancel', (e) => {
  e.preventDefault(); // Blocks closing when clicking outside
});
function onPlayerReady(event) {
    event.target.setVolume(50);
    updateProgressBar();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        document.getElementById('playPauseIcon').className = 'fas fa-play';
        document.getElementById('playPauseButton').setAttribute('data-tooltip', 'Odtwórz');
    }
}

function playPauseVideo() {
    if (!player) return;
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        document.getElementById('playPauseIcon').className = 'fas fa-play';
        document.getElementById('playPauseButton').setAttribute('data-tooltip', 'Odtwórz');
    } else {
        player.playVideo();
        document.getElementById('playPauseIcon').className = 'fas fa-pause';
        document.getElementById('playPauseButton').setAttribute('data-tooltip', 'Pauza');
    }
}

function stopVideo() {
    if (!player) return;
    player.stopVideo();
    document.getElementById('playPauseIcon').className = 'fas fa-play';
    document.getElementById('playPauseButton').setAttribute('data-tooltip', 'Odtwórz');
}

function toggleMute() {
    if (!player) return;
    if (player.isMuted()) {
        player.unMute();
        document.getElementById('volumeIcon').className = 'fas fa-volume-up';
        document.getElementById('muteButton').setAttribute('data-tooltip', 'Wycisz');
    } else {
        player.mute();
        document.getElementById('volumeIcon').className = 'fas fa-volume-mute';
        document.getElementById('muteButton').setAttribute('data-tooltip', 'Włącz dźwięk');
    }
}

function setVolume(value) {
    if (!player) return;
    player.setVolume(value);
    if (value == 0) {
        player.mute();
        document.getElementById('volumeIcon').className = 'fas fa-volume-mute';
        document.getElementById('muteButton').setAttribute('data-tooltip', 'Włącz dźwięk');
    } else {
        player.unMute();
        document.getElementById('volumeIcon').className = 'fas fa-volume-up';
        document.getElementById('muteButton').setAttribute('data-tooltip', 'Wycisz');
    }
}

function setVolumeClick(event) {
    const slider = event.target;
    const rect = slider.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newValue = Math.round((clickX / width) * 100);
    slider.value = newValue;
    setVolume(newValue);
}

function toggleFullscreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (!document.fullscreenElement) {
        if (playerContainer.requestFullscreen) playerContainer.requestFullscreen();
        else if (playerContainer.webkitRequestFullscreen) playerContainer.webkitRequestFullscreen();
        else if (playerContainer.msRequestFullscreen) playerContainer.msRequestFullscreen();
        document.getElementById('fullscreenIcon').className = 'fas fa-compress';
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        document.getElementById('fullscreenIcon').className = 'fas fa-expand';
    }
}

function toggleLoop() {
    if (!player) return;
    player.setLoop(!player.getLoop());
    document.getElementById('loopIcon').className = player.getLoop() ? 'fas fa-redo text-[var(--accent-color)]' : 'fas fa-redo';
}

function updateProgressBar() {
    if (!player) return;
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    const percentage = (currentTime / duration) * 100;
    document.querySelector('.progress-filled').style.width = `${percentage}%`;
    const current = formatTime(currentTime);
    const total = formatTime(duration);
    document.getElementById('timeDisplay').textContent = `${current} / ${total}`;
    requestAnimationFrame(updateProgressBar);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function showProgressTooltip(event) {
    if (!player) return;
    const progressContainer = event.target.closest('.progress-container');
    const rect = progressContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const duration = player.getDuration();
    const time = percentage * duration;
    const tooltip = document.getElementById('progressTooltip');
    tooltip.textContent = formatTime(time);
    tooltip.style.left = `${x}px`;
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.classList.remove('hidden');
}

function hideProgressTooltip() {
    document.getElementById('progressTooltip').classList.add('hidden');
}

function startSeeking(event) {
    if (!player) return;
    const progressContainer = event.target.closest('.progress-container');
    const rect = progressContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const duration = player.getDuration();
    const time = percentage * duration;
    player.seekTo(time, true);
}

function setButtonLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Ładowanie...';
    return originalText;
}

function resetButton(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    button.disabled = false;
    button.innerHTML = originalText;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function switchTab(tab) {
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (tab === 'login') {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
        loginTab.classList.add('tab-active');
        loginTab.classList.remove('tab-inactive');
        registerTab.classList.add('tab-inactive');
        registerTab.classList.remove('tab-active');
        fillLoginFields();
    } else {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        loginTab.classList.add('tab-inactive');
        loginTab.classList.remove('tab-active');
        registerTab.classList.add('tab-active');
        registerTab.classList.remove('tab-inactive');
        resetRegisterForm();
    }
}

function fillLoginFields() {
    const savedEmail = localStorage.getItem('perunFilmEmail');
    const savedPassword = localStorage.getItem('perunFilmPassword');
    if (savedEmail) document.getElementById('loginEmail').value = savedEmail;
    if (savedPassword) document.getElementById('loginPassword').value = savedPassword;
}

function resetRegisterForm() {
    currentStep = 1;
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPasswordConfirm').value = '';
    document.getElementById('regFirstName').value = '';
    document.getElementById('regLastName').value = '';
    document.getElementById('regBirthDate').value = '';
    showStep(1);
}

function showStep(step) {
    document.getElementById('step1').classList.add('step-hidden');
    document.getElementById('step2').classList.add('step-hidden');
    document.getElementById('step3').classList.add('step-hidden');
    document.getElementById(`step${step}`).classList.remove('step-hidden');
}

function nextStep(step) {
    if (step === 1) {
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;
        if (!email || !password || !passwordConfirm) return showToast('Wypełnij wszystkie pola.');
        if (!isValidEmail(email)) return showToast('Podaj poprawny email.');
        if (password !== passwordConfirm) return showToast('Hasła nie są identyczne.');
    } else if (step === 2) {
        const firstName = document.getElementById('regFirstName').value;
        const lastName = document.getElementById('regLastName').value;
        if (!firstName || !lastName) return showToast('Wypełnij wszystkie pola.');
    }
    currentStep = step + 1;
    showStep(currentStep);
}

function prevStep(step) {
    currentStep = step - 1;
    showStep(currentStep);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function openModal(modalId) {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    if (modalId === 'mediaModal' && player) {
        player.stopVideo();
    }
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(modal.id);
    });
});

async function verifyAccessCode() {
    const codeInput = document.getElementById('accessCodeInput');
    const code = codeInput.value.trim();
    const originalText = setButtonLoading('verifyCodeButton', 'Zweryfikuj');
    if (!code) {
        codeInput.classList.add('invalid');
        codeInput.placeholder = 'Wpisz kod';
        resetButton('verifyCodeButton', originalText);
        return;
    }
    try {
        const response = await fetch(`${API_URL}?action=verifyAccessCode&code=${encodeURIComponent(code)}&email=${encodeURIComponent(currentUser?.email || '')}`);
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('perunFilmAccessCode', code);
            localStorage.setItem('perunFilmAccessExpiration', result.expirationDate);
            closeModal('accessCodeModal');
            document.getElementById('heroSection').classList.remove('hidden');
            document.getElementById('recentlyViewed').classList.remove('hidden');
            document.getElementById('movies').classList.remove('hidden');
            document.getElementById('series').classList.remove('hidden');
            document.getElementById('searchInput').disabled = false;
            loadHeroSection();
            loadVideos();
            loadSeries();
            loadRecentlyViewed();
            showToast(`Kod zweryfikowany! Dostęp na ${result.days} dni do ${new Date(result.expirationDate).toLocaleDateString('pl-PL')}.`);
        } else {
            codeInput.classList.add('invalid');
            codeInput.value = '';
            codeInput.placeholder = result.error || 'Nieprawidłowy kod';
        }
    } catch (error) {
        codeInput.classList.add('invalid');
        codeInput.value = '';
        codeInput.placeholder = 'Błąd weryfikacji';
        showToast('Błąd: ' + error.message);
    } finally {
        resetButton('verifyCodeButton', originalText);
    }
}

async function checkAccessCode() {
    const code = localStorage.getItem('perunFilmAccessCode');
    const expiration = localStorage.getItem('perunFilmAccessExpiration');
    const email = currentUser?.email || '';
    if (!code || !expiration || new Date(expiration) < new Date()) {
        localStorage.removeItem('perunFilmAccessCode');
        localStorage.removeItem('perunFilmAccessExpiration');
        openModal('accessCodeModal');
        return false;
    }
    try {
        const response = await fetch(`${API_URL}?action=verifyAccessCode&code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`);
        const result = await response.json();
        if (result.success) return true;
        localStorage.removeItem('perunFilmAccessCode');
        localStorage.removeItem('perunFilmAccessExpiration');
        openModal('accessCodeModal');
        return false;
    } catch (error) {
        openModal('accessCodeModal');
        return false;
    }
}

async function showAuthSection(user) {
    const authContainer = document.getElementById('authContainer');
    const contentContainer = document.getElementById('contentContainer');
    const avatar = document.getElementById('avatar');

    if (user && user.email) {
        currentUser = { email: user.email };
        authContainer.classList.add('hidden');
        contentContainer.classList.remove('hidden');
        avatar.textContent = user.email[0].toUpperCase();
        localStorage.setItem('perunFilmEmail', user.email);
        const hasAccess = await checkAccessCode();
        if (hasAccess) {
            document.getElementById('heroSection').classList.remove('hidden');
            document.getElementById('recentlyViewed').classList.remove('hidden');
            document.getElementById('movies').classList.remove('hidden');
            document.getElementById('series').classList.remove('hidden');
            document.getElementById('searchInput').disabled = false;
            loadHeroSection();
            loadVideos();
            loadSeries();
            loadRecentlyViewed();
        }
        setupAvatarDropdown();
        setupSearch();
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        contentContainer.classList.add('hidden');
        switchTab('login');
        if (user && user.error) showToast('Błąd: ' + user.error);
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const originalText = setButtonLoading('loginButton', 'Zaloguj');
    if (!email || !password) {
        showToast('Wypełnij wszystkie pola.');
        resetButton('loginButton', originalText);
        return;
    }
    if (!isValidEmail(email)) {
        showToast('Podaj poprawny email.');
        resetButton('loginButton', originalText);
        return;
    }
    try {
        const response = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        const user = await response.json();
        if (user.email) {
            localStorage.setItem('perunFilmEmail', email);
            localStorage.setItem('perunFilmPassword', password);
        }
        showAuthSection(user);
    } catch (error) {
        showToast('Błąd logowania: ' + error.message);
    } finally {
        resetButton('loginButton', originalText);
    }
}

async function register() {
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const birthDate = document.getElementById('regBirthDate').value;
    const originalText = setButtonLoading('registerButton', 'Zarejestruj');

    if (!email || !password || !passwordConfirm || !firstName || !lastName || !birthDate) {
        showToast('Wypełnij wszystkie pola.');
        resetButton('registerButton', originalText);
        return;
    }
    if (!isValidEmail(email)) {
        showToast('Podaj poprawny email.');
        resetButton('registerButton', originalText);
        return;
    }
    if (password !== passwordConfirm) {
        showToast('Hasła nie są identyczne.');
        resetButton('registerButton', originalText);
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=register&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&birthDate=${encodeURIComponent(birthDate)}`);
        const user = await response.json();
        if (user.email) {
            localStorage.setItem('perunFilmEmail', email);
            localStorage.setItem('perunFilmPassword', password);
            switchTab('login');
            showToast('Rejestracja udana! Zaloguj się.');
        } else {
            showToast('Błąd: ' + (user.error || 'Nieznany błąd'));
        }
    } catch (error) {
        showToast('Błąd rejestracji: ' + error.message);
    } finally {
        resetButton('registerButton', originalText);
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}?action=logout`);
        const result = await response.json();
        if (result.success) {
            recentlyViewed = [];
            localStorage.removeItem('perunFilmRecentlyViewed');
            localStorage.removeItem('perunFilmEmail');
            localStorage.removeItem('perunFilmPassword');
            localStorage.removeItem('perunFilmAccessCode');
            localStorage.removeItem('perunFilmAccessExpiration');
            showAuthSection(null);
        }
    } catch (error) {
        showToast('Błąd wylogowania: ' + error.message);
    }
}

async function toggleLike(title) {
    if (!currentUser) return showToast('Zaloguj się, aby polubić');
    try {
        const response = await fetch(`${API_URL}?action=toggleLike&email=${encodeURIComponent(currentUser.email)}&title=${encodeURIComponent(title)}`);
        const data = await response.json();
        if (data.success) {
            const item = allContent.find(v => v.title === title);
            item.likedBy = data.liked ? [...item.likedBy, currentUser.email] : item.likedBy.filter(e => e !== currentUser.email);
            item.likes = data.liked ? item.likes + 1 : item.likes - 1;
            loadHeroSection();
            loadVideos();
            loadSeries();
            loadRecentlyViewed();
            if (currentItem && currentItem.title === title) {
                document.getElementById('likeIcon').className = data.liked ? 'fas fa-heart text-red-500 cursor-pointer mr-2' : 'far fa-heart text-[var(--text-color)] cursor-pointer mr-2';
                document.getElementById('likeCount').textContent = item.likes;
            }
        } else {
            showToast(data.error);
        }
    } catch (error) {
        showToast('Błąd polubienia');
    }
}

async function loadHeroSection() {
    if (allContent.length === 0) return;
    const heroSection = document.getElementById('heroSection');
    const randomItem = allContent[Math.floor(Math.random() * allContent.length)];
    document.getElementById('heroImage').src = `https://img.youtube.com/vi/${randomItem.url?.split('v=')[1] || randomItem.seasons?.[0]?.episodes?.[0]?.url?.split('v=')[1] || 'default'}/maxresdefault.jpg`;
    document.getElementById('heroImage').alt = randomItem.title;
    document.getElementById('heroTitle').textContent = randomItem.title;
    document.getElementById('heroDescription').textContent = randomItem.description || 'Brak opisu';
    document.getElementById('heroPlayBtn').onclick = () => openDetailsModal(randomItem);
    heroSection.classList.remove('hidden');
}

async function loadVideos() {
    try {
        const response = await fetch(`${API_URL}?action=getVideos`);
        const videos = await response.json();
        if (videos.error) return showToast('Błąd: ' + videos.error);
        const moviesContent = document.getElementById('moviesContent');
        moviesContent.innerHTML = '';
        allContent = allContent.filter(item => item.type !== 'movie');
        videos.forEach(video => {
            video.type = 'movie';
            video.likedBy = video.likedBy || [];
            video.likes = video.likes || 0;
            allContent.push(video);
            const item = document.createElement('div');
            item.className = 'item relative bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer';
            item.innerHTML = `
                <img src="https://img.youtube.com/vi/${video.url.split('v=')[1]}/hqdefault.jpg" class="w-full h-full object-cover rounded-lg" alt="${video.title}">
                <div class="overlay">
                    <p class="text-lg font-semibold text-center">${video.title}</p>
                    <p class="text-xs text-center text-gray-300 mt-1">${video.description?.substring(0, 50) || 'Brak opisu'}...</p>
                    <button class="bg-[var(--accent-color)] text-white px-4 py-1 rounded-md mt-2 hover:bg-[var(--accent-hover)]" onclick="event.stopPropagation(); openDetailsModal(allContent.find(v => v.title === '${video.title}'))">Odtwórz</button>
                </div>
                <div class="like-container">
                    <i class="${video.likedBy.includes(currentUser?.email) ? 'fas' : 'far'} fa-heart" onclick="event.stopPropagation(); toggleLike('${video.title}')"></i>
                    <span>${video.likes}</span>
                </div>
            `;
            item.addEventListener('click', () => openDetailsModal(video));
            moviesContent.appendChild(item);
        });
        setupCarousel('moviesContent');
    } catch (error) {
        showToast('Błąd ładowania filmów: ' + error.message);
    }
}

async function loadSeries() {
    try {
        const response = await fetch(`${API_URL}?action=getSeries`);
        const series = await response.json();
        if (series.error) return showToast('Błąd: ' + series.error);
        const seriesContent = document.getElementById('seriesContent');
        seriesContent.innerHTML = '';
        allContent = allContent.filter(item => item.type !== 'series');
        series.forEach(item => {
            item.type = 'series';
            item.likedBy = item.likedBy || [];
            item.likes = item.likes || 0;
            allContent.push(item);
            const div = document.createElement('div');
            div.className = 'item relative bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer';
            div.innerHTML = `
                <img src="https://img.youtube.com/vi/${item.seasons[0]?.episodes[0]?.url.split('v=')[1] || 'default'}/hqdefault.jpg" class="w-full h-full object-cover rounded-lg" alt="${item.title}">
                <div class="overlay">
                    <p class="text-lg font-semibold text-center">${item.title}</p>
                    <p class="text-xs text-center text-gray-300 mt-1">${item.description?.substring(0, 50) || 'Brak opisu'}...</p>
                    <button class="bg-[var(--accent-color)] text-white px-4 py-1 rounded-md mt-2 hover:bg-[var(--accent-hover)]" onclick="event.stopPropagation(); openDetailsModal(allContent.find(v => v.title === '${item.title}'))">Odtwórz</button>
                </div>
                <div class="like-container">
                    <i class="${item.likedBy.includes(currentUser?.email) ? 'fas' : 'far'} fa-heart" onclick="event.stopPropagation(); toggleLike('${item.title}')"></i>
                    <span>${item.likes}</span>
                </div>
            `;
            div.addEventListener('click', () => openDetailsModal(item));
            seriesContent.appendChild(div);
        });
        setupCarousel('seriesContent');
    } catch (error) {
        showToast('Błąd ładowania seriali: ' + error.message);
    }
}

function loadRecentlyViewed() {
    const recentlyViewedContent = document.getElementById('recentlyViewedContent');
    recentlyViewedContent.innerHTML = '';
    recentlyViewed.forEach(video => {
        video.likedBy = video.likedBy || [];
        video.likes = video.likes || 0;
        const item = document.createElement('div');
        item.className = 'item relative bg-[var(--card-bg)] rounded-lg overflow-hidden cursor-pointer';
        item.innerHTML = `
            <img src="https://img.youtube.com/vi/${video.url.split('v=')[1]}/hqdefault.jpg" class="w-full h-full object-cover rounded-lg" alt="${video.title}">
            <div class="overlay">
                <p class="text-lg font-semibold text-center">${video.title}</p>
                <p class="text-xs text-center text-gray-300 mt-1">${video.description?.substring(0, 50) || 'Brak opisu'}...</p>
                <button class="bg-[var(--accent-color)] text-white px-4 py-1 rounded-md mt-2 hover:bg-[var(--accent-hover)]" onclick="event.stopPropagation(); openDetailsModal(allContent.find(v => v.title === '${video.title}'))">Odtwórz</button>
            </div>
            <div class="like-container">
                <i class="${video.likedBy.includes(currentUser?.email) ? 'fas' : 'far'} fa-heart" onclick="event.stopPropagation(); toggleLike('${video.title}')"></i>
                <span>${video.likes}</span>
            </div>
        `;
        item.addEventListener('click', () => openDetailsModal(video));
        recentlyViewedContent.appendChild(item);
    });
    setupCarousel('recentlyViewedContent');
}

function setupCarousel(containerId) {
    const container = document.getElementById(containerId);
    const prevBtn = container.parentElement.querySelector('.carousel-prev');
    const nextBtn = container.parentElement.querySelector('.carousel-next');

    function updateButtons() {
        prevBtn.disabled = container.scrollLeft <= 0;
        nextBtn.disabled = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
        prevBtn.classList.toggle('opacity-50', prevBtn.disabled);
        nextBtn.classList.toggle('opacity-50', nextBtn.disabled);
    }

    prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -320, behavior: 'smooth' });
        setTimeout(updateButtons, 300);
    });

    nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: 320, behavior: 'smooth' });
        setTimeout(updateButtons, 300);
    });

    container.addEventListener('scroll', updateButtons);
    updateButtons();
}

function updateEpisodeSelect() {
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    const seasonIndex = seasonSelect.value;
    episodeSelect.innerHTML = '';
    currentItem.seasons[seasonIndex].episodes.forEach((ep, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = ep.title || `Odcinek ${ep.episodeNumber}`;
        episodeSelect.appendChild(option);
    });
}

function openDetailsModal(item) {
    currentItem = item;
    openModal('detailsModal');
    document.getElementById('detailsTitle').textContent = item.title;
    document.getElementById('detailsImage').src = `https://img.youtube.com/vi/${item.url?.split('v=')[1] || item.seasons?.[0]?.episodes?.[0]?.url?.split('v=')[1] || 'default'}/hqdefault.jpg`;
    document.getElementById('detailsImage').alt = item.title;
    document.getElementById('detailsDescription').textContent = item.description || 'Brak opisu';
    document.getElementById('detailsCategory').textContent = `Kategoria: ${item.type === 'movie' ? 'Filmy' : 'Seriale'}`;
    document.getElementById('detailsAgeRating').textContent = `Kategoria wiekowa: ${item.ageRating || 'Brak'}`;
    document.getElementById('likeIcon').className = item.likedBy.includes(currentUser?.email) ? 'fas fa-heart text-red-500 cursor-pointer mr-2' : 'far fa-heart text-[var(--text-color)] cursor-pointer mr-2';
    document.getElementById('likeCount').textContent = item.likes;

    const seriesEpisodes = document.getElementById('seriesEpisodes');
    const seasonSelect = document.getElementById('seasonSelect');
    const episodeSelect = document.getElementById('episodeSelect');
    if (item.type === 'series' && item.seasons?.length > 0) {
        seriesEpisodes.classList.remove('hidden');
        seasonSelect.innerHTML = '';
        item.seasons.forEach((season, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Sezon ${season.seasonNumber}`;
            seasonSelect.appendChild(option);
        });
        updateEpisodeSelect();
        document.getElementById('detailsOpenBtn').onclick = () => {
            const seasonIndex = seasonSelect.value;
            const episodeIndex = episodeSelect.value;
            const episode = item.seasons[seasonIndex].episodes[episodeIndex];
            openMediaModal({ ...item, url: episode.url, title: `${item.title} - ${episode.title || `Odcinek ${episode.episodeNumber}`}` });
            addToRecentlyViewed({ ...item, url: episode.url });
        };
    } else {
        seriesEpisodes.classList.add('hidden');
        document.getElementById('detailsOpenBtn').onclick = () => {
            openMediaModal(item);
            addToRecentlyViewed(item);
        };
    }
}

function openMediaModal(item) {
    document.getElementById('modalTitle').textContent = item.title;
    const videoId = item.url.split('v=')[1]?.split('&')[0] || item.url.split('youtu.be/')[1];
    initializePlayer(videoId);
    openModal('mediaModal');
}

function addToRecentlyViewed(item) {
    recentlyViewed = recentlyViewed.filter(v => v.url !== item.url);
    recentlyViewed.unshift(item);
    if (recentlyViewed.length > 10) recentlyViewed.pop();
    localStorage.setItem('perunFilmRecentlyViewed', JSON.stringify(recentlyViewed));
    loadRecentlyViewed();
}

function setupAvatarDropdown() {
    const avatar = document.getElementById('avatar');
    const dropdown = document.getElementById('dropdown');
    avatar.addEventListener('click', () => dropdown.classList.toggle('hidden'));
    document.addEventListener('click', e => {
        if (!avatar.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    let searchTimeout;
    let selectedIndex = -1;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            searchDropdown.innerHTML = '';
            selectedIndex = -1;
            if (query.length < 2) {
                searchDropdown.classList.add('hidden');
                return;
            }
            const results = allContent.filter(item => item.title.toLowerCase().includes(query)).slice(0, 4);
            if (results.length === 0) {
                searchDropdown.classList.add('hidden');
                return;
            }
            results.forEach((item, index) => {
                const div = document.createElement('div');
                div.setAttribute('tabindex', '0');
                div.className = 'search-item';
                div.innerHTML = `
                    ${item.title}
                    <span class="ml-2">
                        <i class="${item.likedBy.includes(currentUser?.email) ? 'fas' : 'far'} fa-heart"></i>
                        ${item.likes}
                    </span>
                `;
                div.addEventListener('click', () => {
                    openDetailsModal(item);
                    searchInput.value = '';
                    searchDropdown.classList.add('hidden');
                });
                div.addEventListener('mouseover', () => {
                    selectedIndex = index;
                    updateSearchSelection();
                });
                searchDropdown.appendChild(div);
            });
            searchDropdown.classList.remove('hidden');
            updateSearchSelection();
        }, 300);
    });

    searchInput.addEventListener('keydown', e => {
        const items = searchDropdown.querySelectorAll('.search-item');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSearchSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSearchSelection();
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            openDetailsModal(allContent.find(item => item.title === items[selectedIndex].textContent.trim()));
            searchInput.value = '';
            searchDropdown.classList.add('hidden');
        }
    });

    function updateSearchSelection() {
        const items = searchDropdown.querySelectorAll('.search-item');
        items.forEach((item, index) => {
            item.classList.toggle('bg-[var(--input-bg)]', index === selectedIndex);
            if (index === selectedIndex) item.focus();
        });
    }

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const themePreviews = modal.querySelectorAll('.theme-preview');
    const compactView = document.getElementById('compactView');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    themePreviews.forEach(preview => {
        preview.classList.toggle('border-2', preview.dataset.theme === currentTheme);
        preview.classList.toggle('border-[var(--accent-color)]', preview.dataset.theme === currentTheme);
        preview.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', preview.dataset.theme);
            themePreviews.forEach(p => p.classList.remove('border-2', 'border-[var(--accent-color)]'));
            preview.classList.add('border-2', 'border-[var(--accent-color)]');
            localStorage.setItem('perunFilmTheme', preview.dataset.theme);
        });
    });

    compactView.checked = document.documentElement.getAttribute('data-view') === 'compact';
    compactView.addEventListener('change', () => {
        document.documentElement.setAttribute('data-view', compactView.checked ? 'compact' : '');
        localStorage.setItem('perunFilmView', compactView.checked ? 'compact' : '');
        loadVideos();
        loadSeries();
        loadRecentlyViewed();
    });

    openModal('settingsModal');
}

function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const form = document.getElementById('profileForm');
    const avatarColor = localStorage.getItem('perunFilmAvatarColor') || '#0071EB';
    document.getElementById('profileAvatar').value = avatarColor;
    document.getElementById('avatar').style.backgroundColor = avatarColor;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const newColor = document.getElementById('profileAvatar').value;
        localStorage.setItem('perunFilmAvatarColor', newColor);
        document.getElementById('avatar').style.backgroundColor = newColor;
        closeModal('profileModal');
        showToast('Profil zapisany!');
    });

    openModal('profileModal');
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !document.getElementById('mediaModal').classList.contains('hidden')) {
        e.preventDefault();
        playPauseVideo();
    }
});