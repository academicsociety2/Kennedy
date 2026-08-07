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
    shortcut: 'F',
    micShortcut: 'M'
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
document.getElementById('micShortcutSelect').onchange = (e) => { settings.micShortcut = e.target.value; };

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
        busGameName: "أتوبيس كومبليت",
        busGameDesc: "لعبة الحروف والسرعة",
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
        busGameName: "Stop The Bus",
        busGameDesc: "Words & Speed Game",
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
let localStream = null;
let peerConnections = {};
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};
onAuthStateChanged(auth, (user) => {
    const authBox = document.getElementById('authStatusBox');
    const authSections = document.querySelectorAll('.auth-section');

    if (user) {
        currentUser.uid = user.uid;
        currentUser.email = user.email;
        authBox.classList.remove('hidden');
        authSections.forEach(s => s.classList.add('hidden'));
        document.getElementById('loggedInText').innerText = `${t('loggedInAs')} ${currentUser.email ? '('+currentUser.email+')' : ''}`;
        
        if (!user.isAnonymous) {
            const linkSec = document.getElementById('linkAccountSection');
            if(linkSec) linkSec.style.display = 'none';
        }
        const idAcc = document.getElementById('myIdDisplayAcc');
        const idFri = document.getElementById('myIdDisplayFriends');
        if(idAcc) idAcc.value = user.uid;
        if(idFri) idFri.value = user.uid;
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
    document.querySelector('.friends-header span').innerText = "إضافة أصدقاء (Add Friends)";
    
    if(!friendsOverlay.classList.contains('hidden')) {
        onValue(ref(db, `users/${currentUser.uid}/friends`), (snapshot) => {
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            if(snapshot.exists()) {
                const friends = snapshot.val();
                for(let id in friends) {
                    friendsList.innerHTML += `
                        <div class="friend-item clickable" onclick="openFriendChat('${id}', '${friends[id].name}', '${friends[id].avatar}')">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <img src="${friends[id].avatar}" style="width:30px; height:30px; border-radius:50%; border:1px solid var(--primary);">
                                <span>${friends[id].name}</span>
                            </div>
                            <button class="btn-invite clickable" onclick="event.stopPropagation(); alert(t('inviteSent').replace('{name}', '${friends[id].name}'))">${t('invite')}</button>
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
async function startVoiceChat() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setupWebRTCSignaling();
    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("يرجى السماح للمتصفح باستخدام المايكروفون للتحدث مع أصدقائك!");
    }
}

function setupWebRTCSignaling() {
    onChildAdded(ref(db, `rooms/${currentRoom}/signals/${currentUser.uid}`), async (snap) => {
        const data = snap.val();
        const senderId = data.sender;
        
        if (data.type === 'offer') {
            const pc = createPeerConnection(senderId);
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            push(ref(db, `rooms/${currentRoom}/signals/${senderId}`), {
                type: 'answer',
                answer: { type: answer.type, sdp: answer.sdp },
                sender: currentUser.uid
            });
        } else if (data.type === 'answer') {
            const pc = peerConnections[senderId];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate') {
            const pc = peerConnections[senderId];
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        remove(snap.ref); 
    });

    get(ref(db, `rooms/${currentRoom}/players`)).then(snap => {
        if (snap.exists()) {
            const players = snap.val();
            for (let uid in players) {
                if (uid !== currentUser.uid) initiateCall(uid);
            }
        }
    });
}

async function initiateCall(targetUid) {
    const pc = createPeerConnection(targetUid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    push(ref(db, `rooms/${currentRoom}/signals/${targetUid}`), {
        type: 'offer',
        offer: { type: offer.type, sdp: offer.sdp },
        sender: currentUser.uid
    });
}

function createPeerConnection(targetUid) {
    if (peerConnections[targetUid]) return peerConnections[targetUid];
    
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections[targetUid] = pc;
    
    if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    
    pc.onicecandidate = event => {
        if (event.candidate) {
            push(ref(db, `rooms/${currentRoom}/signals/${targetUid}`), {
                type: 'candidate',
                candidate: event.candidate.toJSON(),
                sender: currentUser.uid
            });
        }
    };
    
    pc.ontrack = event => {
        let audioElement = document.getElementById(`audio_${targetUid}`);
        if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.id = `audio_${targetUid}`;
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
        }
        audioElement.srcObject = event.streams[0];
    };
    
    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
            const audioElement = document.getElementById(`audio_${targetUid}`);
            if (audioElement) audioElement.remove();
            delete peerConnections[targetUid];
        }
    };
    
    return pc;
}

function stopVoiceChat() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    for (let uid in peerConnections) {
        peerConnections[uid].close();
        const audioElement = document.getElementById(`audio_${uid}`);
        if (audioElement) audioElement.remove();
    }
    peerConnections = {};
}
function joinLobbyUI(code) {
    document.getElementById('displayRoomCode').innerText = code;
    document.getElementById('chatMessages').innerHTML = ''; 
    switchScreen('lobbyScreen');
    listenToRoom();
    listenToChat();
    startVoiceChat(); 
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
        push(ref(db, `rooms/${currentRoom}/chat`), {
            sender: currentUser.name,
            text: input.value.trim()
        });
        input.value = '';
    }
};

document.getElementById('chatInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') document.getElementById('btnSendMessage').click();
});
const availableGames = [
    { id: 'card_game', nameKey: 'gameName', descKey: 'gameDesc' },
    { id: 'bus_game', nameKey: 'busGameName', descKey: 'busGameDesc' } 
];

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
            
            let roomPlayers = { [currentUser.uid]: { name: currentUser.name, avatar: currentUser.avatar } };
            
            if (gameId === 'bus_game') {
                roomPlayers['bot_ai'] = { name: 'الروبوت الذكي 🤖', avatar: './Assets/icon/icon.png', isBot: true, score: 0 };
            }

            set(ref(db, `rooms/${currentRoom}`), {
                state: 'playing',
                selectedGame: gameId,
                hostId: currentUser.uid,
                players: roomPlayers
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
    else if (gameId === 'bus_game') {
        if(!document.getElementById('busGameStyle')) {
            const link = document.createElement('link');
            link.id = 'busGameStyle';
            link.rel = 'stylesheet';
            link.href = 'src_games/bus_game/stop-the-bus.css';
            document.head.appendChild(link);
        }

        import('./src_games/bus_game/stop-the-bus.js').then(module => {
            module.initStopTheBusGame(container, roomData, currentUser, currentRoom, db, audio);
        });
    }
}
function handleItchLoginResponse() {
    const hash = window.location.hash;
    
    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('access_token');
        
        fetch('https://itch.io/api/1/' + token + '/me')
            .then(res => res.json())
            .then(data => {
                if(data && data.user) {
                    const itchUser = data.user;
                    
                    signInAnonymously(auth).then((result) => {
                        currentUser.name = itchUser.username;
                        currentUser.avatar = itchUser.cover_url || "./Assets/icon/icon.png";
                        currentUser.uid = result.user.uid;
                        
                        document.getElementById('welcomeName').innerText = currentUser.name;
                        document.getElementById('mainMenuAvatar').src = currentUser.avatar;
                        
                        const userRef = ref(db, `users/${result.user.uid}`);
                        update(userRef, {
                            name: currentUser.name,
                            avatar: currentUser.avatar,
                            email: "Itch.io User"
                        });
                        
                        document.getElementById('loggedInText').innerText = `أنت مسجل الدخول كـ (Itch.io: ${itchUser.username})`;
                        document.getElementById('authStatusBox').classList.remove('hidden');
                        document.getElementById('loginSection').classList.add('hidden');
                        
                        playTransition(() => switchScreen('mainMenuScreen'));
                        window.history.replaceState(null, null, window.location.pathname);
                        
                    }).catch(e => alert(e.message));
                }
            })
            .catch(e => console.error("Error fetching Itch.io profile:", e));
    }
}

handleItchLoginResponse();

function copyToClipboard(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if(input && btn) {
        btn.onclick = () => {
            navigator.clipboard.writeText(input.value).then(() => {
                const oldText = btn.innerText;
                btn.innerText = "تم النسخ!";
                btn.style.background = "var(--secondary)";
                setTimeout(() => {
                    btn.innerText = oldText;
                    btn.style.background = "";
                }, 2000);
            });
        };
    }
}
copyToClipboard('myIdDisplayAcc', 'btnCopyIdAcc');
copyToClipboard('myIdDisplayFriends', 'btnCopyIdFriends');

const btnApplySettings = document.getElementById('btnApplySettings');
if(btnApplySettings) {
    btnApplySettings.onclick = () => {
        playTransition(() => {
            btnApplySettings.innerText = "Applied (تم الحفظ)";
            btnApplySettings.style.background = "var(--secondary)";
        });
    };

    document.querySelectorAll('.settings-input-trigger').forEach(input => {
        input.addEventListener('change', () => {
            btnApplySettings.innerText = "Apply (تطبيق)";
            btnApplySettings.style.background = "";
        });
    });
}
window.openFriendChat = function(friendId, friendName, friendAvatar) {
    document.getElementById('friendsOverlay').classList.add('hidden');
    document.getElementById('waChatName').innerText = friendName;
    document.getElementById('waChatAvatar').src = friendAvatar;
    playTransition(() => switchScreen('friendsChatScreen'));
};

const inputAvatarFile = document.getElementById('inputAvatarFile');
const avatarEditModal = document.getElementById('avatarEditModal');
const avatarCanvas = document.getElementById('avatarCanvas');
const zoomRange = document.getElementById('zoomRange');
const rotateRange = document.getElementById('rotateRange');
const btnCancelAvatarEdit = document.getElementById('btnCancelAvatarEdit');
const btnApplyAvatarEdit = document.getElementById('btnApplyAvatarEdit');

const barUserAvatar = document.getElementById('barUserAvatar');
const barUserName = document.getElementById('barUserName');
const settingsAvatarPreview = document.getElementById('settingsAvatarPreview');
const inputAccountName = document.getElementById('inputAccountName');

let rawImageObject = null;
let canvasCtx = avatarCanvas ? avatarCanvas.getContext('2d') : null;

if (inputAvatarFile) {
    inputAvatarFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            rawImageObject = new Image();
            rawImageObject.onload = () => {
                zoomRange.value = 1;
                rotateRange.value = 0;
                renderAvatarCanvas();
                avatarEditModal.classList.remove('hidden');
            };
            rawImageObject.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderAvatarCanvas() {
    if (!rawImageObject || !canvasCtx) return;

    const zoom = parseFloat(zoomRange.value);
    const rotation = parseFloat(rotateRange.value) * (Math.PI / 180);

    canvasCtx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
    canvasCtx.save();

    // التحريك للمنتصف للتدوير والتكبير
    canvasCtx.translate(avatarCanvas.width / 2, avatarCanvas.height / 2);
    canvasCtx.rotate(rotation);
    canvasCtx.scale(zoom, zoom);

    // رسم الصورة في المنتصف
    canvasCtx.drawImage(
        rawImageObject,
        -avatarCanvas.width / 2,
        -avatarCanvas.height / 2,
        avatarCanvas.width,
        avatarCanvas.height
    );

    canvasCtx.restore();
}

if (zoomRange) zoomRange.addEventListener('input', renderAvatarCanvas);
if (rotateRange) rotateRange.addEventListener('input', renderAvatarCanvas);

if (btnCancelAvatarEdit) {
    btnCancelAvatarEdit.onclick = () => {
        avatarEditModal.classList.add('hidden');
        inputAvatarFile.value = '';
    };
}

if (btnApplyAvatarEdit) {
    btnApplyAvatarEdit.onclick = () => {
        const croppedDataUrl = avatarCanvas.toDataURL('image/png');
        if (barUserAvatar) barUserAvatar.src = croppedDataUrl;
        if (settingsAvatarPreview) settingsAvatarPreview.src = croppedDataUrl;

        localStorage.setItem('userCustomAvatar', croppedDataUrl);
        avatarEditModal.classList.add('hidden');
    };
}

if (inputAccountName) {
    inputAccountName.addEventListener('input', (e) => {
        const newName = e.target.value.trim();
        if (newName && barUserName) {
            barUserName.innerText = newName;
            localStorage.setItem('userCustomName', newName);
            
            currentUser.name = newName; 
        }
    });

    inputAccountName.addEventListener('change', (e) => {
        const newName = e.target.value.trim();
        if (newName && currentUser.uid) {
            update(ref(db, `users/${currentUser.uid}`), { name: newName });
            
            if (currentRoom) {
                update(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}`), { name: newName });
            }
        }
    });
}

const btnMicToggle = document.getElementById('btnMicToggle');
const btnHeadsetToggle = document.getElementById('btnHeadsetToggle');

if (btnMicToggle) {
    btnMicToggle.onclick = () => {
        btnMicToggle.classList.toggle('active-muted');
    };
}

if (btnHeadsetToggle) {
    btnHeadsetToggle.onclick = () => {
        btnHeadsetToggle.classList.toggle('active-muted');
    };
}
window.addEventListener('DOMContentLoaded', () => {
    const savedAvatar = localStorage.getItem('userCustomAvatar');
    const savedName = localStorage.getItem('userCustomName');

    if (savedAvatar) {
        if (barUserAvatar) barUserAvatar.src = savedAvatar;
        if (settingsAvatarPreview) settingsAvatarPreview.src = savedAvatar;
        currentUser.avatar = savedAvatar; 
    }
    if (savedName) {
        if (barUserName) barUserName.innerText = savedName;
        if (inputAccountName) inputAccountName.value = savedName;
        currentUser.name = savedName; 
    }
});
window.toggleDiscordBarVisibility = function(isGameScreenActive) {
    const discordBar = document.getElementById('discordUserBar');
    if (!discordBar) return;

    if (isGameScreenActive) {
        discordBar.classList.add('hidden-in-game');
    } else {
        discordBar.classList.remove('hidden-in-game');
    }
};

const btnMicArrow = document.getElementById('btnMicArrow');
const btnHeadsetArrow = document.getElementById('btnHeadsetArrow');
const micDropdown = document.getElementById('micDropdown');
const headsetDropdown = document.getElementById('headsetDropdown');
const micList = document.getElementById('micList');
const headsetList = document.getElementById('headsetList');

let currentMicId = 'default';
let currentSpeakerId = 'default';

// دالة لطلب الصلاحيات وجلب الأجهزة
async function requestPermissionsAndGetDevices() {
    try {
        // طلب صلاحية المايكروفون لمرة واحدة لجلب أسماء الأجهزة الأصلية بدلاً من الأسماء الافتراضية
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // جلب قائمة بكل الأجهزة المتصلة بالجهاز
        const devices = await navigator.mediaDevices.enumerateDevices();
        populateDeviceLists(devices);
    } catch (err) {
        console.error('تم رفض صلاحية المايكروفون أو حدث خطأ:', err);
        micList.innerHTML = `<li style="color:var(--danger); cursor:default;">يرجى السماح بصلاحية المايكروفون</li>`;
        headsetList.innerHTML = `<li style="color:var(--danger); cursor:default;">يرجى السماح بصلاحية المايكروفون</li>`;
    }
}
function populateDeviceLists(devices) {
    micList.innerHTML = '';
    headsetList.innerHTML = '';

    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

    audioInputs.forEach((device, index) => {
        const li = document.createElement('li');
        li.textContent = device.label || `ميكروفون ${index + 1}`;
        li.dataset.deviceId = device.deviceId;
        
        if (device.deviceId === currentMicId || (currentMicId === 'default' && device.deviceId === 'default')) {
            li.classList.add('active');
        }
        
        li.onclick = () => selectDevice('mic', device.deviceId, li);
        micList.appendChild(li);
    });

    audioOutputs.forEach((device, index) => {
        const li = document.createElement('li');
        li.textContent = device.label || `سماعة ${index + 1}`;
        li.dataset.deviceId = device.deviceId;
        
        if (device.deviceId === currentSpeakerId || (currentSpeakerId === 'default' && device.deviceId === 'default')) {
            li.classList.add('active');
        }
        
        li.onclick = () => selectDevice('speaker', device.deviceId, li);
        headsetList.appendChild(li);
    });
    if (audioOutputs.length === 0) {
        headsetList.innerHTML = '<li style="color:var(--text-muted); cursor:default;">متصفحك لا يدعم اختيار السماعة بشكل منفصل</li>';
    }
}

async function selectDevice(type, deviceId, liElement) {
    if (type === 'mic') {
        currentMicId = deviceId;
        document.querySelectorAll('#micList li').forEach(el => el.classList.remove('active'));
        console.log("تم اختيار المايك:", deviceId);

    } else {
        currentSpeakerId = deviceId;
        document.querySelectorAll('#headsetList li').forEach(el => el.classList.remove('active'));
        console.log("تم اختيار السماعة:", deviceId);
        
        try {
            if (typeof audio.menuMusic.setSinkId === 'function') {
                await audio.menuMusic.setSinkId(deviceId);
                await audio.gameMusic.setSinkId(deviceId);
            }
        } catch (error) {
            console.log("تغيير مسار الصوت غير مدعوم بالكامل في هذا المتصفح", error);
        }
    }
    
    liElement.classList.add('active');
    
    micDropdown.classList.add('hidden');
    headsetDropdown.classList.add('hidden');
}

if (btnMicArrow) {
    btnMicArrow.onclick = (e) => {
        e.stopPropagation(); 
        headsetDropdown.classList.add('hidden');
        const isHidden = micDropdown.classList.contains('hidden');
        
        if (isHidden) {
            micDropdown.classList.remove('hidden');
            requestPermissionsAndGetDevices(); 
        } else {
            micDropdown.classList.add('hidden');
        }
    };
}

if (btnHeadsetArrow) {
    btnHeadsetArrow.onclick = (e) => {
        e.stopPropagation(); 
        micDropdown.classList.add('hidden');
        const isHidden = headsetDropdown.classList.contains('hidden');
        
        if (isHidden) {
            headsetDropdown.classList.remove('hidden');
            requestPermissionsAndGetDevices(); 
        } else {
            headsetDropdown.classList.add('hidden');
        }
    };
}

document.addEventListener('click', () => {
    if (micDropdown) micDropdown.classList.add('hidden');
    if (headsetDropdown) headsetDropdown.classList.add('hidden');
});
if (micDropdown) micDropdown.addEventListener('click', e => e.stopPropagation());
if (headsetDropdown) headsetDropdown.addEventListener('click', e => e.stopPropagation());



let localAudioStream = null;
let isMicOn = false;

async function toggleMicrophone() {
    try {
        if (!localAudioStream) {
            localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        isMicOn = !isMicOn;
        localAudioStream.getAudioTracks()[0].enabled = isMicOn;
        
        const micBtn = document.getElementById('btnMicToggle');
        const micIcon = document.getElementById('iconMicOn');
        
        if (isMicOn) {
            micBtn.classList.remove('active-muted');
            micIcon.innerHTML = '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>';
        } else {
            micBtn.classList.add('active-muted');
            micIcon.innerHTML = '<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2zm9.73 9.73z"/>';
        }
        
    } catch (err) {
        console.error("خطأ في الوصول للمايكروفون:", err);
        alert("يرجى السماح للمتصفح باستخدام المايكروفون للتحدث مع أصدقائك!");
    }
}
if (btnMicToggle) {
    btnMicToggle.addEventListener('click', toggleMicrophone);
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    let micKey = settings.micShortcut.toLowerCase();
    let pressedKey = e.code.toLowerCase().replace('key', '');
    
    if (e.key.toLowerCase() === micKey || pressedKey === micKey || (micKey === 'space' && e.code === 'Space')) {
        e.preventDefault(); 
        toggleMicrophone();
    }

    let friendKey = settings.shortcut.toLowerCase();
    if (e.key.toLowerCase() === friendKey || pressedKey === friendKey) {
        e.preventDefault();
        const overlay = document.getElementById('friendsOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden');
            if(!overlay.classList.contains('hidden')) {
                overlay.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            }
        }
    }
});
document.getElementById('btnLeaveLobby').addEventListener('click', () => {
    stopVoiceChat();
    if (currentRoom && currentUser.uid) {
        remove(ref(db, `rooms/${currentRoom}/players/${currentUser.uid}`));
    }
});
document.getElementById('btnMicToggle').addEventListener('click', function() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            if (audioTrack.enabled) {
                this.classList.remove('active-muted'); 
            } else {
                this.classList.add('active-muted'); 
            }
        }
    }
});