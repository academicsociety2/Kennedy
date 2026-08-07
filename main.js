import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, get, push, onChildAdded, off, onDisconnect } from "firebase/database";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, EmailAuthProvider, linkWithCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVeMFCOX3-WxTNrTxLe61Y-zz3IuwIYuQ",
  authDomain: "card-game-3b106.firebaseapp.com",
  projectId: "card-game-3b106",
  storageBucket: "card-game-3b106.firebasestorage.app",
  messagingSenderId: "372953805241",
  appId: "1:372953805241:web:5a37f1d9000232b1d80668"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const itchClientId = "b2ba577fe318688d5f51c5c5c22ea011";
const itchClientSecret = "57e413b9bc08fed473028dfa784bde1bfb3ae9f2b1116bc01219f6eb3937ba8e";
const itchLoginUrl = "https://itch.io/user/oauth?client_id=b2ba577fe318688d5f51c5c5c22ea011&scope=profile%3Ame&response_type=token&redirect_uri=https%3A%2F%2Fcard-game-3b106.firebaseapp.com";

const audio = {
    menuMusic: new Audio('./Assets/music/menu.mp3'),
    gameMusic: new Audio('./Assets/music/card_game.mp3'),
    clickSound: new Audio('./Assets/mouse/page_click.wav'),
    volumes: { master: 1.0, music: 0.8, sfx: 1.0 },
    isMuted: false
};
audio.menuMusic.loop = true;
audio.gameMusic.loop = true;

document.addEventListener('click', (e) => {
    if(!audio.isMuted) {
        audio.clickSound.volume = audio.volumes.master * audio.volumes.sfx;
        audio.clickSound.currentTime = 0;
        audio.clickSound.play().catch(()=>{});
    }
});

function updateAudioVolumes() {
    const musicVol = audio.isMuted ? 0 : (audio.volumes.master * audio.volumes.music);
    audio.menuMusic.volume = musicVol;
    audio.gameMusic.volume = musicVol;
}

function playMenuMusic() {
    audio.gameMusic.pause();
    if(!audio.isMuted) {
        audio.menuMusic.play().catch(() => console.log("Auto-play blocked"));
    }
}

document.getElementById('btnGlobalMute').onclick = (e) => {
    audio.isMuted = !audio.isMuted;
    const img = e.target;
    if(audio.isMuted) {
        img.src = './Assets/buttons/Music-Off.png';
        audio.menuMusic.pause();
        audio.gameMusic.pause();
    } else {
        img.src = './Assets/buttons/Music-On.png';
        playMenuMusic(); 
    }
    updateAudioVolumes();
};

document.getElementById('volMaster').oninput = (e) => { audio.volumes.master = e.target.value / 100; updateAudioVolumes(); };
document.getElementById('volMusic').oninput = (e) => { audio.volumes.music = e.target.value / 100; updateAudioVolumes(); };
document.getElementById('volSFX').oninput = (e) => { audio.volumes.sfx = e.target.value / 100; };

const settings = {
    theme: 'dark',
    font: 'Segoe UI',
    fps: 60,
    cursor: 'custom',
    shortcut: 'F'
};

document.getElementById('themeSelect').onchange = (e) => {
    settings.theme = e.target.value;
    document.body.className = settings.theme === 'light' ? 'light-mode' : 'dark-mode';
    if(settings.cursor === 'custom') document.body.classList.add('custom-cursors');
};

document.getElementById('cursorSelect').onchange = (e) => {
    settings.cursor = e.target.value;
    if (settings.cursor === 'custom') {
        document.body.classList.add('custom-cursors');
    } else {
        document.body.classList.remove('custom-cursors');
    }
};

document.getElementById('shortcutSelect').onchange = (e) => { settings.shortcut = e.target.value; };

document.getElementById('fontSelect').onchange = (e) => {
    settings.font = e.target.value;
    applyFont(settings.font);
};

function applyFont(fontName) {
    const styleEl = document.getElementById('dynamicFontStyles');
    if (fontName === 'Segoe UI') {
        styleEl.innerHTML = `* { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; }`;
        return;
    }
    const fontUrl = `./Assets/Fonts/${fontName}.ttf`; 
    styleEl.innerHTML = `
        @font-face { font-family: '${fontName}'; src: url('${fontUrl}') format('truetype'); }
        * { font-family: '${fontName}', sans-serif !important; }
    `;
}

let currentLang = 'ar';
const translations = {
    ar: {
        sub: "عالم الألعاب الجماعية", loginTab: "تسجيل الدخول", signupTab: "إنشاء حساب", loginGoogle: "تسجيل الدخول بجوجل", loginGuest: "دخول كزائر", signupGoogle: "إنشاء حساب بجوجل", loggedInAs: "أنت مسجل الدخول حالياً", logout: "تسجيل خروج", enterMenu: "استمرار للقائمة", back: "رجوع", completeProfile: "أكمل بياناتك", choosePic: "تغيير الصورة", yourName: "اسمك المستعار:", welcome: "مرحباً", friends: "الأصدقاء", settings: "الإعدادات", offlineGames: "ألعاب أوفلاين", offlineDesc: "العب بمفردك أو مع الكمبيوتر", onlineGames: "ألعاب الأونلاين", createRoom: "إنشاء غرفة", joinRoomBtn: "دخول", friendsList: "قائمة الأصدقاء", add: "إضافة", invite: "دعوة", settingsTitle: "الإعدادات", account: "الحساب", audioSettings: "الصوت", gameSettings: "النظام", linkAccount: "اربط حسابك بالإيميل لحفظ تقدمك:", linkEmail: "حفظ وربط بالإيميل", masterVol: "الصوت العام:", musicVol: "الموسيقى:", sfxVol: "المؤثرات:", theme: "المظهر (Theme):", font: "الخط (Font):", fps: "معدل الإطارات:", leave: "خروج", roomCode: "رمز الغرفة:", players: "اللاعبين", readyBtn: "أنا جاهز", startBtn: "ابدأ اللعبة", chat: "المحادثة", send: "إرسال", 
        offlineAlert: "قريباً: جاري تجهيز قسم الألعاب الأوفلاين!",
        selfAddAlert: "لا يمكنك إضافة نفسك!",
        friendAdded: "تم إضافة {name} بنجاح!",
        invalidId: "رقم الـ ID غير صحيح أو اللاعب غير موجود.",
        emailLinked: "تم ربط وتأمين حسابك بنجاح! يمكنك الآن تسجيل الدخول به.",
        linkError: "حدث خطأ أثناء الربط: ",
        notGuest: "هذا الحساب ليس حساب زائر أو أنه مربوط مسبقاً.",
        enterEmailPass: "يرجى كتابة البريد الإلكتروني وكلمة المرور أولاً!",
        hostChoose: "أنت المدير: اختر اللعبة",
        hostChoosing: "مدير الغرفة يختار اللعبة...",
        statusReady: "جاهز",
        statusWait: "ينتظر",
        gameName: "لعبة الذاكرة",
        gameDesc: "طابق الكروت واربح",
        roomNotFound: "الغرفة غير موجودة أو بدأت بالفعل",
        inviteSent: "جاري إرسال دعوة لـ {name}.. قريباً",
        noFriends: "لا يوجد أصدقاء بعد",
        friendsId: "قائمة الأصدقاء (ID: {id})",
        phPlayerName: "الاسم المستعار...", phRoomCode: "رمز الغرفة...", phFriendId: "ID الصديق...", phEmail: "البريد الإلكتروني", phPass: "كلمة المرور"
    },
    en: {
        sub: "Multiplayer Games World", loginTab: "Login", signupTab: "Sign Up", loginGoogle: "Log In with Google", loginGuest: "Play as Guest", signupGoogle: "Sign Up with Google", loggedInAs: "Logged in as", logout: "Logout", enterMenu: "Continue to Menu", back: "Back", completeProfile: "Complete Profile", choosePic: "Change Avatar", yourName: "Nickname:", welcome: "Welcome", friends: "Friends", settings: "Settings", offlineGames: "Offline Games", offlineDesc: "Play solo or with PC", onlineGames: "Online Games", createRoom: "Create Room", joinRoomBtn: "Join", friendsList: "Friends List", add: "Add", invite: "Invite", settingsTitle: "Settings", account: "Account", audioSettings: "Audio", gameSettings: "System", linkAccount: "Link account with email to save progress:", linkEmail: "Save & Link Email", masterVol: "Master Vol:", musicVol: "Music:", sfxVol: "SFX:", theme: "Theme:", font: "Font:", fps: "FPS:", leave: "Leave", roomCode: "Room Code:", players: "Players", readyBtn: "I'm Ready", startBtn: "Start Game", chat: "Chat", send: "Send",
        offlineAlert: "Soon: Offline games section is being prepared!",
        selfAddAlert: "You cannot add yourself!",
        friendAdded: "Successfully added {name}!",
        invalidId: "Invalid ID or player not found.",
        emailLinked: "Account successfully linked and secured! You can now log in.",
        linkError: "Error linking account: ",
        notGuest: "This account is not a guest account or is already linked.",
        enterEmailPass: "Please enter email and password first!",
        hostChoose: "You are the Host: Choose a game",
        hostChoosing: "Host is choosing a game...",
        statusReady: "Ready",
        statusWait: "Waiting",
        gameName: "Memory Game",
        gameDesc: "Match cards and win",
        roomNotFound: "Room not found or already started.",
        inviteSent: "Sending invite to {name}.. soon",
        noFriends: "No friends yet",
        friendsId: "Friends List (ID: {id})",
        phPlayerName: "Nickname...", phRoomCode: "Room code...", phFriendId: "Friend ID...", phEmail: "Email", phPass: "Password"
    }
};

function t(key) { return translations[currentLang][key] || key; }

function setLanguage(lang) {
    currentLang = lang;
    document.getElementById('htmlRoot').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('htmlRoot').lang = lang;
    
    document.getElementById('btnAr').classList.toggle('active', lang === 'ar');
    document.getElementById('btnEn').classList.toggle('active', lang === 'en');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = translations[lang][el.getAttribute('data-i18n')];
    });

    document.getElementById('playerName').placeholder = translations[lang].phPlayerName;
    document.getElementById('roomCodeInput').placeholder = translations[lang].phRoomCode;
    document.getElementById('friendIdInput').placeholder = translations[lang].phFriendId;
    document.getElementById('linkEmail').placeholder = translations[lang].phEmail;
    document.getElementById('linkPass').placeholder = translations[lang].phPass;
    
    if (currentUser.uid) {
        document.getElementById('loggedInText').innerText = `${t('loggedInAs')} ${currentUser.email ? '('+currentUser.email+')' : ''}`;
    }
}

document.getElementById('btnAr').onclick = () => { playMenuMusic(); setLanguage('ar'); };
document.getElementById('btnEn').onclick = () => { playMenuMusic(); setLanguage('en'); };

function playTransition(callback) {
    const overlay = document.getElementById('transitionOverlay');
    const progress = overlay.querySelector('.transition-progress');
    
    document.body.classList.add('loading-state');
    overlay.classList.add('active');
    progress.style.width = '0%';
    
    setTimeout(() => { progress.style.width = '50%'; }, 150);
    setTimeout(() => { progress.style.width = '100%'; }, 400);
    
    setTimeout(() => {
        callback();
        setTimeout(() => {
            overlay.classList.remove('active');
            document.body.classList.remove('loading-state');
            progress.style.width = '0%';
        }, 400);
    }, 700);
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}
document.querySelectorAll('.btn-back-premium').forEach(btn => {
    btn.onclick = () => {
        const target = btn.getAttribute('data-target');
        playTransition(() => switchScreen(target));
    };
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
    };
});

document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
        btn.classList.add('active');
        const target = document.getElementById(btn.getAttribute('data-target'));
        target.classList.remove('hidden');
        target.classList.add('active');
    };
});
window.addEventListener('load', () => {
    let progress = 0;
    const progressEl = document.getElementById('loadProgress');
    const txtEl = document.getElementById('txtLoading');
    const steps = ["Loading Assets...", "Loading Sounds...", "Connecting to Server...", "Ready!"];
    
    let interval = setInterval(() => {
        progress += 25;
        progressEl.style.width = `${progress}%`;
        txtEl.innerText = steps[(progress/25)-1];
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => { switchScreen('landingScreen'); }, 800);
        }
    }, 600);
});
let currentUser = { uid: null, name: "Player", email: null, avatar: "./Assets/icon/icon.png" };
let currentRoom = null;
let isHost = false;
let currentSelectedGame = 'card_game';

onAuthStateChanged(auth, (user) => {
    const authBox = document.getElementById('authStatusBox');
    const authSections = document.querySelectorAll('.auth-section');

    if (user) {
        currentUser.uid = user.uid;
        currentUser.email = user.email;
        authBox.classList.remove('hidden');
        authSections.forEach(s => s.classList.add('hidden'));
        document.getElementById('loggedInText').innerText = `${t('loggedInAs')} ${currentUser.email ? '('+currentUser.email+')' : ''}`;
    } else {
        authBox.classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
    }
});

document.getElementById('btnContinueMain').onclick = () => {
    playMenuMusic();
    playTransition(() => switchScreen('mainMenuScreen'));
};

document.getElementById('btnPlayAsGuest').onclick = () => {
    playMenuMusic();
    signInAnonymously(auth).then(() => {
        playTransition(() => switchScreen('setupProfileScreen'));
    }).catch(e => alert(e.message));
};
document.getElementById('btnAuthGoogle').onclick = loginWithGoogle;
document.getElementById('btnSignUpGoogle').onclick = loginWithGoogle;

function loginWithGoogle() {
    playMenuMusic();
    signInWithPopup(auth, googleProvider).then((result) => {
        const userRef = ref(db, `users/${result.user.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                currentUser.name = data.name || result.user.displayName;
                currentUser.avatar = data.avatar || result.user.photoURL;
                document.getElementById('welcomeName').innerText = currentUser.name;
                document.getElementById('mainMenuAvatar').src = currentUser.avatar;
                playTransition(() => switchScreen('mainMenuScreen'));
            } else {
                currentUser.name = result.user.displayName || "Player";
                currentUser.avatar = result.user.photoURL || "./Assets/icon/icon.png";
                document.getElementById('playerName').value = currentUser.name;
                document.getElementById('avatarPreview').style.backgroundImage = `url('${currentUser.avatar}')`;
                document.getElementById('avatarPreview').innerHTML = ''; 
                playTransition(() => switchScreen('setupProfileScreen'));
            }
        });
    }).catch(e => alert(e.message));
}

document.getElementById('btnLogoutMain').onclick = logoutUser;
document.getElementById('btnSettingsLogout').onclick = logoutUser;

document.getElementById('btnLinkEmail').onclick = () => {
    const email = document.getElementById('linkEmail').value.trim();
    const pass = document.getElementById('linkPass').value.trim();
    if(email && pass) {
        const user = auth.currentUser;
        if(user && user.isAnonymous) {
            const credential = EmailAuthProvider.credential(email, pass);
            linkWithCredential(user, credential).then((usercred) => {
                currentUser.email = usercred.user.email;
                update(ref(db, `users/${currentUser.uid}`), { email: currentUser.email });
                alert(t('emailLinked'));
                document.getElementById('linkEmail').value = '';
                document.getElementById('linkPass').value = '';
            }).catch((error) => {
                alert(t('linkError') + error.message);
            });
        } else {
            alert(t('notGuest'));
        }
    } else {
        alert(t('enterEmailPass'));
    }
};

function logoutUser() {
    signOut(auth).then(() => {
        currentUser = { uid: null, name: "Player", email: null, avatar: "./Assets/icon/icon.png" };
        playTransition(() => switchScreen('landingScreen'));
    });
}

document.getElementById('customAvatarInput').onchange = function(evt) {
    const file = evt.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUser.avatar = e.target.result;
            document.getElementById('avatarPreview').style.backgroundImage = `url('${e.target.result}')`;
            document.getElementById('avatarPreview').innerHTML = ''; 
        };
        reader.readAsDataURL(file);
    }
};

document.getElementById('btnSaveProfile').onclick = () => {
    let name = document.getElementById('playerName').value.trim();
    currentUser.name = name || "Player_" + Math.floor(Math.random() * 100);
    document.getElementById('welcomeName').innerText = currentUser.name;
    document.getElementById('mainMenuAvatar').src = currentUser.avatar; 
    
    if (currentUser.uid) {
        update(ref(db, `users/${currentUser.uid}`), {
            name: currentUser.name,
            avatar: currentUser.avatar,
            email: currentUser.email || "Guest"
        });
    }
    
    playTransition(() => switchScreen('mainMenuScreen'));
};

document.getElementById('btnOpenSettings').onclick = () => playTransition(() => switchScreen('settingsScreen'));

document.getElementById('btnOfflineGames').onclick = () => {
    playMenuMusic();
    playTransition(() => switchScreen('offlineScreen'));
};

document.getElementById('btnAddFriend').onclick = async () => {
    const friendId = document.getElementById('friendIdInput').value.trim();
    if (friendId) {
        if(friendId === currentUser.uid) return alert(t('selfAddAlert'));
        
        const snap = await get(ref(db, `users/${friendId}`));
        if (snap.exists()) {
            const friendData = snap.val();
            update(ref(db, `users/${currentUser.uid}/friends/${friendId}`), {
                name: friendData.name,
                avatar: friendData.avatar || "./Assets/icon/icon.png"
            });
            alert(t('friendAdded').replace('{name}', friendData.name));
            document.getElementById('friendIdInput').value = '';
        } else {
            alert(t('invalidId'));
        }
    }
};

const friendsOverlay = document.getElementById('friendsOverlay');
const dragHandle = document.getElementById('friendsDragHandle');
let isDragging = false, startX, startY, initialX, initialY;

document.getElementById('btnToggleFriends').onclick = () => {
    friendsOverlay.classList.toggle('hidden');
    document.querySelector('.friends-header span').innerText = t('friendsId').replace('{id}', currentUser.uid.substring(0,6));
    
    if(!friendsOverlay.classList.contains('hidden')) {
        onValue(ref(db, `users/${currentUser.uid}/friends`), (snapshot) => {
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            if(snapshot.exists()) {
                const friends = snapshot.val();
                for(let id in friends) {
                    friendsList.innerHTML += `
                        <div class="friend-item">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${friends[id].avatar}" style="width:30px; height:30px; border-radius:50%; border:1px solid var(--primary);">
                                <span>${friends[id].name}</span>
                            </div>
                            <button class="btn-invite clickable" onclick="alert(t('inviteSent').replace('{name}', '${friends[id].name}'))">${t('invite')}</button>
                        </div>`;
                }
            } else {
                friendsList.innerHTML = `<p style="text-align:center; padding:10px; color:var(--text-muted);">${t('noFriends')}</p>`;
            }
        });
    }
};

document.getElementById('btnToggleFriends').onclick = () => friendsOverlay.classList.toggle('hidden');
document.getElementById('btnCloseFriends').onclick = () => friendsOverlay.classList.add('hidden');

window.addEventListener('keydown', (e) => {
    if (document.getElementById('mainMenuScreen').classList.contains('active') || document.getElementById('lobbyScreen').classList.contains('active')) {
        if ((settings.shortcut === 'F' && (e.key === 'f' || e.key === 'F' || e.key === 'ب')) || 
            (settings.shortcut === 'Tab' && e.key === 'Tab')) {
            e.preventDefault();
            friendsOverlay.classList.toggle('hidden');
        }
    }
});

dragHandle.addEventListener('mousedown', dragStart);
function dragStart(e) {
    initialX = friendsOverlay.offsetLeft;
    initialY = friendsOverlay.offsetTop;
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    dragHandle.classList.add('dragging');
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}
function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    friendsOverlay.style.left = `${initialX + dx}px`;
    friendsOverlay.style.top = `${initialY + dy}px`;
}
function dragEnd() {
    isDragging = false;
    dragHandle.classList.remove('dragging');
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
}
document.getElementById('btnCreateRoom').onclick = () => {
    isHost = true;
    currentRoom = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const roomRef = ref(db, `rooms/${currentRoom}`);
    set(roomRef, {
                state: 'lobby',
                selectedGame: 'card_game',
                hostId: currentUser.uid,
                players: { [currentUser.uid]: { name: currentUser.name, ready: false, avatar: currentUser.avatar } }
            });
    
    onDisconnect(roomRef).remove();
    
    playTransition(() => joinLobbyUI(currentRoom));
};

document.getElementById('btnJoinRoom').onclick = async () => {
    const code = document.getElementById('roomCodeInput').value.toUpperCase();
    if(code.length !== 5) return;
    
    const snap = await get(ref(db, `rooms/${code}`));
    if (snap.exists() && snap.val().state === 'lobby') {
        isHost = false;
        currentRoom = code;
        
        const playerRef = ref(db, `rooms/${code}/players/${currentUser.uid}`);
        update(playerRef, { name: currentUser.name, ready: false, avatar: currentUser.avatar });
        
        onDisconnect(playerRef).remove();
        
        playTransition(() => joinLobbyUI(currentRoom));
    } else {
        alert(t('roomNotFound'));
    }
};
function joinLobbyUI(code) {
    document.getElementById('displayRoomCode').innerText = code;
    document.getElementById('chatMessages').innerHTML = ''; 
    switchScreen('lobbyScreen');
    listenToRoom();
    listenToChat();
}

let roomListener;
function listenToRoom() {
    roomListener = onValue(ref(db, `rooms/${currentRoom}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const playersBox = document.getElementById('lobbyPlayers');
        playersBox.innerHTML = '';
        let allReady = true;
        let pCount = 0;

        for (let uid in data.players) {
            pCount++;
            const p = data.players[uid];
            const statusStr = p.ready ? t('statusReady') : t('statusWait');
            const statusClass = p.ready ? 'status-ready' : 'status-waiting';
            
            playersBox.innerHTML += `
                <div class="player-card ${p.ready ? 'ready-state' : ''}">
                    <img src="${p.avatar || './Assets/icon/icon.png'}" class="player-avatar-mini" alt="Avatar">
                    <div class="player-info-box">
                        <span>${p.name}</span>
                        <span class="player-status ${statusClass}">${statusStr}</span>
                    </div>
                </div>`;
            if (!p.ready) allReady = false;
        }

        const startBtn = document.getElementById('btnStartOnlineGame');
        if (isHost) {
            startBtn.classList.remove('hidden');
            startBtn.disabled = !(allReady && pCount > 1);
        } else {
            startBtn.classList.add('hidden');
        }

        currentSelectedGame = data.selectedGame;
        renderGamesList(data.selectedGame);

        if (data.state === 'playing' && document.getElementById('lobbyScreen').classList.contains('active')) {
            playTransition(() => loadGame(data.selectedGame, data));
        }
    });
}
let chatListener;
function listenToChat() {
    const chatRef = ref(db, `rooms/${currentRoom}/chat`);
    if(chatListener) off(chatRef, 'child_added', chatListener);
    
    chatListener = onChildAdded(chatRef, (snap) => {
        const msg = snap.val();
        const chatBox = document.getElementById('chatMessages');
        chatBox.innerHTML += `<div class="chat-msg"><strong>${msg.sender}</strong>: ${msg.text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

document.getElementById('btnSendMessage').onclick = () => {
    const input = document.getElementById('chatInput');
    if (input.value.trim() !== '') {
        push(ref(db, `rooms/${currentRoom}/chat`), { sender: currentUser.name, text: input.value.trim() });
        input.value = '';
    }
};

document.getElementById('chatInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btnSendMessage').click();
});
const availableGames = [{ id: 'card_game', nameKey: 'gameName', descKey: 'gameDesc' }];

function renderGamesList(selectedId = 'card_game') {
    const list = document.getElementById('gamesList');
    if(!list) return;
    list.innerHTML = '';
    
    availableGames.forEach(game => {
        const card = document.createElement('div');
        card.className = `game-card-mega ${selectedId === game.id ? 'selected' : ''} clickable`;
        card.innerHTML = `
            <div class="game-title">${t(game.nameKey)}</div>
            <div class="game-desc">${t(game.descKey)}</div>
        `;
        
        if (isHost) {
            card.onclick = () => update(ref(db, `rooms/${currentRoom}`), { selectedGame: game.id });
        }
        list.appendChild(card);
    });
    document.getElementById('hostMessage').innerText = isHost ? t('hostChoose') : t('hostChoosing');
}

document.getElementById('btnReady').onclick = () => {
    get(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}/ready`)).then(snap => {
        update(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}`), { ready: !snap.val() });
    });
};

document.getElementById('btnStartOnlineGame').onclick = () => {
    update(ref(db, `rooms/${currentRoom}`), { state: 'playing' });
};

document.getElementById('btnLeaveLobby').onclick = () => {
    if (isHost) {
        remove(ref(db, `rooms/${currentRoom}`)); 
    } else {
        remove(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}`)); 
    }
    
    if(roomListener) off(ref(db, `rooms/${currentRoom}`));
    
    onDisconnect(ref(db, `rooms/${currentRoom}`)).cancel();
    onDisconnect(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}`)).cancel();
    
    currentRoom = null;
    isHost = false;
    playTransition(() => switchScreen('mainMenuScreen'));
};

document.querySelectorAll('[data-offline-game]').forEach(card => {
            card.onclick = () => {
                const gameId = card.getAttribute('data-offline-game');
                playTransition(() => {
                    currentRoom = 'offline_' + currentUser.uid;
                    set(ref(db, `rooms/${currentRoom}`), {
                        state: 'playing',
                        selectedGame: gameId,
                        hostId: currentUser.uid,
                        players: { [currentUser.uid]: { name: currentUser.name, avatar: currentUser.avatar } }
                    });
                    loadGame(gameId, { hostId: currentUser.uid });
                });
            };
        });

function loadGame(gameId, roomData) {
    switchScreen('gameScreen');
    const container = document.getElementById('gameContainer');
    container.innerHTML = '';
    
    if(!audio.isMuted) {
        audio.menuMusic.pause();
        audio.gameMusic.play();
    }
    
    if (gameId === 'card_game') {
        if(!document.getElementById('cardGameStyle')) {
            const link = document.createElement('link');
            link.id = 'cardGameStyle';
            link.rel = 'stylesheet';
            link.href = 'src_games/card_game/card_style.css';
            document.head.appendChild(link);
        }

        import('./src_games/card_game/card_script.js').then(module => {
            module.initCardGame(container, roomData, currentUser, currentRoom, db, audio);
        });
    }
}