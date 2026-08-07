import { ref, update, onValue, push, onChildAdded, off, get } from "firebase/database";

const ARABIC_LETTERS = ['أ','ب','ت','ث','ج','ح','خ','د','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ','و','ي'];

const DEFAULT_CATEGORIES = ['ولد', 'بنت', 'حيوان', 'نبات', 'جماد', 'بلاد'];
const EXTRA_CATEGORIES = [
    { id: 'historical', name: 'شخصيات تاريخية' },
    { id: 'prophets', name: 'أنبياء' },
    { id: 'actors', name: 'ممثلين' },
    { id: 'cartoon', name: 'أنمي وكارتون' }
];

// قواميس الترجمة الخاصة باللعبة
const i18n = {
    ar: {
        setupTitle: '🚌 إعدادات غرفة لعبة أتوبيس كومبليت',
        waitingHost: '⏳ في انتظار الهوست لتأكيد الإعدادات...',
        rounds: 'عدد الجولات:',
        letterMode: 'طريقة اختيار الحرف:',
        timeLimit: 'وقت الجولة (بالثواني):',
        extraCats: 'الفئات الإضافية:',
        randomLetter: '🎲 عشوائي (البوت)',
        manualLetter: '🧑‍🤝‍🧑 بالدور (اللاعبين)',
        startBtn: ' ابدأ اللعبة الآن!',
        players: '👥 اللاعبون',
        chat: '💬 المحادثة',
        chatPlaceholder: 'اكتب رسالة...',
        send: 'إرسال',
        targetLetter: 'الحرف:',
        stopBusBtn: '🛑 أتوبيــــس كومبليـــــت',
        reviewTitle: '📝 مراجعة وتقييم إجابات الجولة',
        nextRound: '✅ اعتماد النقاط والتالي',
        lobbyReturn: '🏠 العودة للإعدادات (تصفير النقاط)',
        timeUp: 'الـوقت انتهـى ⏰'
    },
    en: {
        setupTitle: '🚌 Stop The Bus - Room Setup',
        waitingHost: '⏳ Waiting for Host to setup...',
        rounds: 'Total Rounds:',
        letterMode: 'Letter Selection:',
        timeLimit: 'Round Time (Seconds):',
        extraCats: 'Extra Categories:',
        randomLetter: '🎲 Random (Bot)',
        manualLetter: '🧑‍🤝‍🧑 Turn-based (Players)',
        startBtn: ' Start Game Now!',
        players: '👥 Players',
        chat: '💬 Chat',
        chatPlaceholder: 'Type a message...',
        send: 'Send',
        targetLetter: 'Letter:',
        stopBusBtn: '🛑 STOP THE BUS!',
        reviewTitle: '📝 Round Review & Scoring',
        nextRound: '✅ Approve Scores & Next Round',
        lobbyReturn: '🏠 Return to Setup (Reset Scores)',
        timeUp: 'Time is UP ⏰'
    }
};

const STB_SOUNDS = {
    tick: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    stopBus: new Audio('https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3'),
    roulette: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    winRound: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    chat: new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'),
    reviewShow: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    bgm: new Audio('https://cdn.pixabay.com/audio/2022/10/25/audio_517a943722.mp3')
};
STB_SOUNDS.bgm.loop = true;
STB_SOUNDS.bgm.volume = 0.3;

let COMPLETE_DICTIONARY = null;

async function loadBotDictionaries() {
    if (COMPLETE_DICTIONARY) return;
    try {
        const githubUrl = 'https://github.com/academicsociety2/Kennedy/releases/download/%D8%A7%D8%AA%D9%88%D8%A8%D9%8A%D8%B3_%D9%83%D9%88%D9%85%D8%A8%D9%84%D9%8A%D8%AA/itobees_complete.json';
        
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(githubUrl)}`;
        
        const res = await fetch(proxyUrl);
        
        if (res.ok) {
            COMPLETE_DICTIONARY = await res.json();
            console.log("✅ تم تحميل قاموس الكلمات بنجاح من اللينك (عبر البروكسي)!");
        } else {
            console.error("❌ فشل في تحميل القاموس، حالة الرد:", res.status);
        }
    } catch (e) {
        console.error("❌ حصل خطأ أثناء سحب الملف:", e);
    }
}

function normalizeArabic(text) {
    if (!text || typeof text !== 'string') return '';
    let clean = text.trim();
    clean = clean.replace(/[\u064B-\u0652]/g, '');
    clean = clean.replace(/^الـ?/, '');
    clean = clean.replace(/[أإآءئؤ]/g, 'ا');
    clean = clean.replace(/ة/g, 'ه');
    clean = clean.replace(/ى/g, 'ي');
    clean = clean.replace(/[\s\-_]+/g, '');
    return clean;
}

function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1.0;
    let longer = s1.length > s2.length ? s1 : s2;
    let shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    
    let costs = [];
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) !== shorter.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
}

function extractAllStrings(data) {
    let results = [];
    function recurse(obj) {
        if (!obj) return;
        if (typeof obj === 'string') {
            if (obj.trim().length > 0) results.push(obj.trim());
            return;
        }
        if (Array.isArray(obj)) {
            for (let item of obj) recurse(item);
            return;
        }
        if (typeof obj === 'object') {
            for (let key of Object.keys(obj)) recurse(obj[key]);
        }
    }
    recurse(data);
    return results;
}

function validateAnswerByBot(word, targetLetter, category) {
    if (!word || typeof word !== 'string') return { valid: false, score: 0 };
    let normInput = normalizeArabic(word);
    if (!normInput || normInput.length < 2) return { valid: false, score: 0 };

    let normalizedTarget = normalizeArabic(targetLetter).charAt(0);
    if (normInput.charAt(0) !== normalizedTarget) return { valid: false, score: 0 };

    if (!COMPLETE_DICTIONARY) return { valid: true, score: 10 };

    const MAP = {
        'ولد': COMPLETE_DICTIONARY['أسماء']?.['أولاد'],
        'بنت': COMPLETE_DICTIONARY['أسماء']?.['بنات'],
        'حيوان': COMPLETE_DICTIONARY['حيوانات'],
        'نبات': COMPLETE_DICTIONARY['نبات'],
        'جماد': COMPLETE_DICTIONARY['جماد'],
        'بلاد': COMPLETE_DICTIONARY['دول'],
        'شخصيات تاريخية': COMPLETE_DICTIONARY['شخصيات_تاريخية'],
        'أنبياء': COMPLETE_DICTIONARY['أنبياء'],
        'ممثلين': COMPLETE_DICTIONARY['ممثلين'],
        'أنمي وكارتون': COMPLETE_DICTIONARY['شخصيات_كرتونية']
    };

    let targetNode = MAP[category];
    if (!targetNode) return { valid: true, score: 10 }; 

    let rawWords = extractAllStrings(targetNode);
    let candidates = rawWords.filter(w => normalizeArabic(w).charAt(0) === normalizedTarget);

    if (candidates.length === 0) return { valid: true, score: 10 };

    for (let cand of candidates) {
        let normCand = normalizeArabic(cand);
        if (!normCand) continue;
        if (normInput === normCand) return { valid: true, score: 10 };
        if (normInput.includes(normCand) || normCand.includes(normInput)) {
            if (Math.abs(normInput.length - normCand.length) <= 3) return { valid: true, score: 10 };
        }
        if (getSimilarity(normInput, normCand) >= 0.70) return { valid: true, score: 10 };
    }
    return { valid: false, score: 0 };
}

export function initStopTheBusGame(container, roomData, currentUser, roomCode, dbInstance, globalAudio) {
    loadBotDictionaries();
    
    if(globalAudio && !globalAudio.isMuted) {
        globalAudio.gameMusic.pause();
        STB_SOUNDS.bgm.play().catch(()=>{});
    }

    const lang = document.documentElement.lang || 'ar';
    const t = (key) => i18n[lang][key] || key;

    let timerInterval = null;
    let botTypingTimeout = null;
    let botStopTimeout = null;
    let selectedCategories = [...DEFAULT_CATEGORIES];
    let gameConfig = { timeLimit: 90, totalRounds: 3, letterMode: 'random', categories: [...DEFAULT_CATEGORIES] };
    let currentAnswers = {};
    let currentRound = roomData.currentRound || 1;
    let gameTheme = 'light';

    const isHost = currentUser.uid === roomData.hostId;

    container.innerHTML = `
        <div class="stb-game-wrapper theme-light" id="stbWrapper">
            <div class="stb-top-controls">
                <button id="btnExitGameTop" class="stb-control-btn back-btn">
                    <span class="icon">${lang === 'ar' ? '➔' : '←'}</span> خروج
                </button>
                <button id="btnToggleThemeTop" class="stb-control-btn theme-btn">
                    <span class="icon">🎨</span> تغيير المظهر
                </button>
            </div>

            <div class="stb-players-panel">
                <div class="stb-panel-title">
                    <span>${t('players')}</span>
                    <span id="stbPlayerCount" class="stb-badge-count">0</span>
                </div>
                <div id="stbPlayersList" class="stb-players-scroll"></div>
            </div>

            <div class="stb-center-area">
                <div id="stbSetupModal" class="stb-modal-overlay">
                    <div class="stb-setup-card">
                        <h2 class="stb-setup-title">${isHost ? t('setupTitle') : t('waitingHost')}</h2>
                        
                        ${isHost ? `
                            <div class="stb-option-group">
                                <label class="stb-option-label">${t('timeLimit')}</label>
                                <div class="stb-options-grid" id="optTimeGrid">
                                    <button class="stb-option-btn" data-val="60">60s</button>
                                    <button class="stb-option-btn active" data-val="90">90s</button>
                                    <button class="stb-option-btn" data-val="120">120s</button>
                                </div>
                            </div>
                            <div class="stb-option-group">
                                <label class="stb-option-label">${t('extraCats')}</label>
                                <div class="stb-extra-categories-grid" id="stbExtraCategoriesGrid">
                                    ${EXTRA_CATEGORIES.map(cat => `
                                        <label class="stb-checkbox-btn">
                                            <input type="checkbox" value="${cat.name}" class="stb-extra-cat-checkbox">
                                            <span>➕ ${cat.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <button id="btnLaunchGame" class="stb-btn-start-game">${t('startBtn')}</button>
                        ` : `
                            <div class="stb-waiting-box"><div class="stb-spinner"></div></div>
                        `}
                    </div>
                </div>

                <div id="stbLetterPickerOverlay" class="stb-letter-picker-overlay" style="display: none;">
                    <h2 class="stb-picker-title">🎯 اختر الحرف!</h2>
                    <div class="stb-letters-grid" id="stbLettersGrid"></div>
                </div>

                <div id="stbStopBannerOverlay" class="stb-stop-banner-overlay" style="display: none;">
                    <div class="stb-stop-stamp">${t('stopBusBtn')}! 🚌</div>
                </div>

                <div class="stb-game-header">
                    <div class="stb-letter-box">
                        <span class="stb-letter-label">${t('targetLetter')}</span>
                        <div class="stb-target-letter" id="stbTargetLetter">؟</div>
                    </div>
                    <div class="stb-timer-box">
                        <div class="stb-timer-circle" id="stbTimerNum">90</div>
                        <div class="stb-timer-bar-bg"><div class="stb-timer-bar-fill" id="stbTimerFill"></div></div>
                    </div>
                </div>

                <div class="stb-board-container" id="stbBoardContainer">

                    <div id="stbPlayArea" style="display: flex; flex-direction: column; width: 100%; height: 100%;">
                        <div class="stb-inputs-grid" id="stbInputsGrid"></div>
                        <button id="btnStopBus" class="stb-btn-stop" disabled>${t('stopBusBtn')}</button>
                    </div>
                    
                    <div id="stbReviewArea" style="display: none; width: 100%;"></div>
                </div>
            </div>

            <div class="stb-chat-panel">
                <div class="stb-panel-title">${t('chat')}</div>
                <div class="stb-chat-messages" id="stbChatMessages"></div>
                <div class="stb-chat-input-area">
                    <input type="text" id="stbChatInput" class="stb-chat-input" placeholder="${t('chatPlaceholder')}" autocomplete="off">
                    <button id="stbBtnSendChat" class="stb-btn-send">${t('send')}</button>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.getElementById('stbWrapper');
    const playSound = (name) => { if (globalAudio && !globalAudio.isMuted && STB_SOUNDS[name]) { STB_SOUNDS[name].currentTime=0; STB_SOUNDS[name].play().catch(()=>{}); }};

    document.getElementById('btnToggleThemeTop').onclick = () => {
        playSound('click');
        gameTheme = gameTheme === 'light' ? 'dark' : 'light';
        wrapper.className = `stb-game-wrapper theme-${gameTheme}`;
    };

    document.getElementById('btnExitGameTop').onclick = () => {
        playSound('click');
        clearInterval(timerInterval);
        clearTimeout(botTypingTimeout);
        clearTimeout(botStopTimeout);
        STB_SOUNDS.bgm.pause();
        if(globalAudio && !globalAudio.isMuted) globalAudio.gameMusic.play();
        
        off(ref(dbInstance, `rooms/${roomCode}`));
        off(ref(dbInstance, `rooms/${roomCode}/chat`));
        if (isHost) update(ref(dbInstance, `rooms/${roomCode}`), { state: 'lobby', gameState: 'lobby' });
        
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('mainMenuScreen').classList.add('active');
    };

    const inputsGrid = document.getElementById('stbInputsGrid');
    const targetLetterEl = document.getElementById('stbTargetLetter');
    const timerNum = document.getElementById('stbTimerNum');
    const timerFill = document.getElementById('stbTimerFill');
    const btnStopBus = document.getElementById('btnStopBus');

    function renderCategoryInputs(cats) {
        inputsGrid.innerHTML = '';
        cats.forEach(cat => {
            const group = document.createElement('div');
            group.className = 'stb-input-group';
            group.innerHTML = `<label class="stb-label">📍 ${cat}:</label><input type="text" class="stb-input game-input" data-cat="${cat}" disabled>`;
            inputsGrid.appendChild(group);
        });

        const inputs = inputsGrid.querySelectorAll('.game-input');
        inputs.forEach(input => {
            input.oninput = () => {
                playSound('click');
                currentAnswers[input.dataset.cat] = input.value.trim();
                update(ref(dbInstance, `rooms/${roomCode}/players/${currentUser.uid}`), { isTyping: true });
                let allFilled = true;
                inputs.forEach(inp => { if (!inp.value.trim()) allFilled = false; });
                btnStopBus.disabled = !allFilled;
            };
        });
    }

    if (isHost) {
        document.getElementById('stbSetupModal').addEventListener('click', (e) => {
            const btn = e.target.closest('.stb-option-btn');
            if (!btn) return;
            playSound('click');
            const parent = btn.parentElement;
            parent.querySelectorAll('.stb-option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (parent.id === 'optRoundsGrid') gameConfig.totalRounds = parseInt(btn.dataset.val);
            if (parent.id === 'optTimeGrid') gameConfig.timeLimit = parseInt(btn.dataset.val);
        });

        const launchBtn = document.getElementById('btnLaunchGame');
        if(launchBtn) {
            launchBtn.onclick = () => {
                playSound('click');
                const extraBoxes = document.querySelectorAll('.stb-extra-cat-checkbox:checked');
                const extraCats = Array.from(extraBoxes).map(cb => cb.value);
                gameConfig.categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...extraCats]));
                launchBtn.disabled = true;

                update(ref(dbInstance, `rooms/${roomCode}`), {
                    gameState: 'picking_letter_host', 
                    hostPicker: currentUser.uid, 
                    gameConfig: gameConfig,
                    currentRound: 1,
                    playedLetters: [] 
                });
            };
        }
    }

    onValue(ref(dbInstance, `rooms/${roomCode}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        if (data.gameConfig) { gameConfig = data.gameConfig; selectedCategories = gameConfig.categories; }
        
        if (data.players) {
            const pList = Object.entries(data.players);
            document.getElementById('stbPlayerCount').innerText = pList.length;
            const playersListEl = document.getElementById('stbPlayersList');
            playersListEl.innerHTML = '';
            pList.forEach(([uid, p]) => {
                const isMe = uid === currentUser.uid;
                playersListEl.innerHTML += `
                    <div class="stb-player-card ${isMe ? 'is-me' : ''}">
                        <div class="stb-player-header">
                            <div class="stb-avatar">${p.avatar ? `<img src="${p.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (p.name||'Player')[0].toUpperCase()}</div>
                            <div>
                                <div class="stb-player-name">${p.name||'Player'}</div>
                                <div class="stb-player-score">🏆 ${p.score||0}</div>
                            </div>
                        </div>
                        <div class="stb-live-status ${data.stoppedBy === uid ? 'done' : (p.isTyping ? 'typing' : '')}">
                            ${data.stoppedBy === uid ? '🛑' : (p.isTyping ? '✍️...' : '⏳')}
                        </div>
                    </div>`;
            });
        }

        const state = data.gameState;
        const setupModal = document.getElementById('stbSetupModal');
        const picker = document.getElementById('stbLetterPickerOverlay');

        if (state === 'picking_letter_host') {
            setupModal.style.display = 'none';
            const revArea = document.getElementById('stbReviewArea');
            revArea.style.display = 'none';
            revArea.innerHTML = ''; 
            document.getElementById('stbPlayArea').style.display = 'flex';
            
            picker.innerHTML = `
                <div style="text-align: center;">
                    <h2 class="stb-picker-title">🎯 جولة رقم ${data.currentRound} من ${gameConfig.totalRounds}</h2>
                    <div id="letterErrorMsg" style="color: #ff4757; font-weight: 900; font-size: 1.2rem; margin-bottom: 15px; display: none;">الحرف ده لعبنا بيه قبل كده! جرب حرف تاني</div>
                </div>
            `;

            if (isHost) {
                picker.innerHTML += `
                    <p style="color: var(--stb-text-muted); margin-bottom: 15px;">اختار الحرف اللي هنلعب بيه الجولة دي</p>
                    <input type="text" id="manualLetterInput" class="stb-input" maxlength="1" placeholder="اكتب حرف" style="width: 150px; text-align: center; font-size: 2rem; margin-bottom: 20px; color: #000 !important; background: #fff;">
                    <button id="btnSubmitLetter" class="stb-btn-start-game">تأكيد الحرف وبدء الجولة </button>
                `;
                picker.style.display = 'flex';
                
                const inputEl = document.getElementById('manualLetterInput');
                setTimeout(() => inputEl.focus(), 100);
                
                document.getElementById('btnSubmitLetter').onclick = () => {
                    let letter = inputEl.value.trim().charAt(0);
                    if(!ARABIC_LETTERS.includes(letter)) letter = 'ا'; 
                    const playedLetters = data.playedLetters || [];
                    if (playedLetters.includes(letter)) {
                        document.getElementById('letterErrorMsg').style.display = 'block';
                        playSound('tick');
                        return; 
                    }
                   
                    playSound('click');
                    picker.style.display = 'none';
                    update(ref(dbInstance, `rooms/${roomCode}`), { 
                        gameState: 'playing', 
                        targetLetter: letter, 
                        startTime: Date.now(),
                        playedLetters: [...playedLetters, letter]
                    });
                };
            } else {
                picker.innerHTML += `
                    <div class="stb-waiting-box">
                        <div class="stb-spinner"></div>
                        <h3 style="margin-top:20px; color: var(--stb-text);">⏳ بنستنى الهوست يختار الحرف...</h3>
                    </div>
                `;
                picker.style.display = 'flex';
            }
        } 
        else if (state === 'playing') {
            setupModal.style.display = 'none'; 
            picker.style.display = 'none';
            const revArea = document.getElementById('stbReviewArea');
            revArea.style.display = 'none';
            revArea.innerHTML = ''; 
            document.getElementById('stbPlayArea').style.display = 'flex';
            if (data.targetLetter && targetLetterEl.innerText !== data.targetLetter) {
                targetLetterEl.innerText = data.targetLetter;
                renderCategoryInputs(selectedCategories);
                inputsGrid.querySelectorAll('.game-input').forEach(i => i.disabled = false);
                
                clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    const rem = Math.max(0, gameConfig.timeLimit - Math.floor((Date.now() - data.startTime) / 1000));
                    timerNum.innerText = rem;
                    timerFill.style.width = `${(rem / gameConfig.timeLimit) * 100}%`;
                    if (rem <= 10 && rem > 0) playSound('tick');
                    if (rem <= 0) {
                        clearInterval(timerInterval);
                        if (isHost) update(ref(dbInstance, `rooms/${roomCode}`), { gameState: 'stopped', stoppedByName: t('timeUp') });
                    }
                }, 1000);

                if (isHost && roomCode.startsWith('offline_') && data.players && data.players['bot_ai']) {
                    clearTimeout(botTypingTimeout);
                    clearTimeout(botStopTimeout);
                    
                    botTypingTimeout = setTimeout(() => {
                        update(ref(dbInstance, `rooms/${roomCode}/players/bot_ai`), { isTyping: true });
                    }, Math.random() * 4000 + 4000);

                    botStopTimeout = setTimeout(() => {
                        update(ref(dbInstance, `rooms/${roomCode}`), { gameState: 'stopped', stoppedBy: 'bot_ai', stoppedByName: 'الروبوت الذكي 🤖' });
                    }, Math.random() * 25000 + 20000);
                }
            }
        }
        else if (state === 'stopped') {
            clearInterval(timerInterval);
            clearTimeout(botTypingTimeout);
            clearTimeout(botStopTimeout);
            
            inputsGrid.querySelectorAll('.game-input').forEach(i => i.disabled = true);
            playSound('stopBus');
            const banner = document.getElementById('stbStopBannerOverlay');
            banner.querySelector('.stb-stop-stamp').innerText = `🛑 (${data.stoppedByName || '...'})`;
            banner.style.display = 'flex'; 
            setTimeout(() => banner.style.display = 'none', 2800);
            
            update(ref(dbInstance, `rooms/${roomCode}/answers/${currentUser.uid}`), { playerName: currentUser.name, answers: currentAnswers });
            
            if (isHost) {
                setTimeout(async () => {
                    const answersSnap = await get(ref(dbInstance, `rooms/${roomCode}/answers`));
                    let allAnswers = answersSnap.val() || {};

                    if (roomCode.startsWith('offline_') && data.players && data.players['bot_ai']) {
                        let botAnswers = {};
                        if (COMPLETE_DICTIONARY) {
                            const MAP = {
                                'ولد': COMPLETE_DICTIONARY['أسماء']?.['أولاد'], 'بنت': COMPLETE_DICTIONARY['أسماء']?.['بنات'],
                                'حيوان': COMPLETE_DICTIONARY['حيوانات'], 'نبات': COMPLETE_DICTIONARY['نبات'],
                                'جماد': COMPLETE_DICTIONARY['جماد'], 'بلاد': COMPLETE_DICTIONARY['دول'],
                                'شخصيات تاريخية': COMPLETE_DICTIONARY['شخصيات_تاريخية'], 'أنبياء': COMPLETE_DICTIONARY['أنبياء'],
                                'ممثلين': COMPLETE_DICTIONARY['ممثلين'], 'أنمي وكارتون': COMPLETE_DICTIONARY['شخصيات_كرتونية']
                            };
                            let normalizedTarget = normalizeArabic(data.targetLetter).charAt(0);
                            
                            selectedCategories.forEach(cat => {
                                let node = MAP[cat];
                                if (node) {
                                    let words = extractAllStrings(node).filter(w => normalizeArabic(w).charAt(0) === normalizedTarget);
                                    if (words.length > 0 && Math.random() > 0.15) {
                                        botAnswers[cat] = words[Math.floor(Math.random() * words.length)];
                                    }
                                }
                            });
                        }
                        allAnswers['bot_ai'] = { playerName: 'الروبوت الذكي 🤖', answers: botAnswers };
                        update(ref(dbInstance, `rooms/${roomCode}/players/bot_ai`), { isTyping: false });
                    }
                    let updates = {};
                    Object.entries(allAnswers).forEach(([uid, pData]) => {
                        let totalScore = 0;
                        selectedCategories.forEach(cat => {
                            const word = (pData.answers && pData.answers[cat]) || '';
                            const val = validateAnswerByBot(word, data.targetLetter, cat);
                            totalScore += val.score;
                        });
                        updates[`rooms/${roomCode}/players/${uid}/score`] = (data.players[uid]?.score || 0) + totalScore;
                    });
                    
                    updates[`rooms/${roomCode}/lastRoundData`] = allAnswers;
                    updates[`rooms/${roomCode}/gameState`] = 'reviewing';
                    
                    update(ref(dbInstance), updates);
                }, 3500);
            }
        } 
        else if (state === 'reviewing') {
            clearInterval(timerInterval);
            playSound('reviewShow');
            inputsGrid.innerHTML = ''; 
            targetLetterEl.innerText = '👀';
            
            let html = `
                <div class="stb-review-screen-animated">
                    <h2 class="stb-board-title" style="margin-bottom: 20px;">📝 مراجعة الجولة (حرف ${data.targetLetter})</h2>
                    <div class="stb-review-cards-container">
            `;
            
            const roundData = data.lastRoundData || {};
            Object.entries(roundData).forEach(([uid, pData], index) => {
                html += `
                    <div class="stb-review-player-card" style="animation-delay: ${index * 0.2}s">
                        <div class="stb-rpc-header">
                            <span class="stb-rpc-name">${pData.playerName}</span>
                        </div>
                        <div class="stb-rpc-answers">
                `;
                selectedCategories.forEach(cat => {
                    const ans = (pData.answers && pData.answers[cat]) ? pData.answers[cat] : '---';
                    const validation = validateAnswerByBot(ans, data.targetLetter, cat);
                    const isCorrect = validation.valid && ans !== '---';
                    html += `
                        <div class="stb-rpc-item ${isCorrect ? 'correct' : 'wrong'}">
                            <span class="cat-name">${cat}:</span> 
                            <span class="cat-ans">${ans}</span>
                            <span class="cat-score">${isCorrect ? '+10' : '0'}</span>
                        </div>
                    `;
                });
                html += `</div></div>`;
            });
            
            html += `</div>`;
            
            if (isHost) {
                html += `<button id="btnSkipReview" class="stb-btn-start-game" style="margin-top: 30px; width: 100%;">التالي (Skip) ⏭️</button>`;
            } else {
                html += `<p style="text-align:center; margin-top:20px; color:var(--stb-text-muted);">في انتظار الهوست لبدء الجولة القادمة...</p>`;
            }
            
            html += `</div>`;
            document.getElementById('stbPlayArea').style.display = 'none';
            document.getElementById('stbReviewArea').style.display = 'block';
            document.getElementById('stbReviewArea').innerHTML = html;

            if (isHost) {
                document.getElementById('btnSkipReview').onclick = () => {
                    playSound('click');
                    const nxt = currentRound + 1;
                    let updates = {};
                    if (nxt > gameConfig.totalRounds) {
                        updates[`rooms/${roomCode}/gameState`] = 'game_over'; 
                    } else {
                        updates[`rooms/${roomCode}/gameState`] = 'picking_letter_host';
                        updates[`rooms/${roomCode}/currentRound`] = nxt;
                        updates[`rooms/${roomCode}/stoppedBy`] = null;
                        updates[`rooms/${roomCode}/answers`] = null;
                        currentAnswers = {};
                    }
                    update(ref(dbInstance), updates);
                };
            }
        }
        else if (state === 'game_over') {
            clearInterval(timerInterval);
            const pList = Object.entries(data.players || {}).sort((a, b) => (b[1].score||0) - (a[1].score||0));
            let html = `<div class="stb-final-leaderboard"><h2 class="stb-board-title">🏆 Score 🏆</h2><div class="stb-podium-grid">`;
            pList.forEach(([uid, p], i) => {
                html += `<div class="stb-podium-card ${i===0?'first-place':''}">
                    <div class="stb-medal">${i===0?'🥇':i===1?'🥈':'🥉'}</div>
                    <div class="stb-avatar-large">${p.avatar ? `<img src="${p.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : (p.name||'Player')[0].toUpperCase()}</div>
                    <div class="stb-player-name">${p.name||'Player'}</div>
                    <div class="stb-final-score">${p.score||0}</div>
                </div>`;
            });
            html += `</div>${isHost ? `<button id="btnReturnLobby" class="stb-btn-start-game">${t('lobbyReturn')}</button>` : ''}</div>`;
            document.getElementById('stbPlayArea').style.display = 'none';
            document.getElementById('stbReviewArea').style.display = 'block';
            document.getElementById('stbReviewArea').innerHTML = html;
            playSound('winRound');
            if (isHost) document.getElementById('btnReturnLobby').onclick = () => {
                let upd = {}; pList.forEach(([uid]) => upd[`rooms/${roomCode}/players/${uid}/score`] = 0);
                upd[`rooms/${roomCode}/gameState`] = 'lobby'; upd[`rooms/${roomCode}/currentRound`] = 1;
                update(ref(dbInstance), upd);
            };
        }
    });

    btnStopBus.onclick = () => {
        playSound('stopBus'); 
        btnStopBus.disabled = true;
        update(ref(dbInstance, `rooms/${roomCode}`), { gameState: 'stopped', stoppedBy: currentUser.uid, stoppedByName: currentUser.name });
    };

    const chatRef = ref(dbInstance, `rooms/${roomCode}/chat`);
    onChildAdded(chatRef, (snap) => {
        const msg = snap.val();
        if(!msg) return;
        const box = document.getElementById('stbChatMessages');
        box.innerHTML += `<div class="stb-chat-msg"><span class="sender">${msg.sender}:</span> ${msg.text}</div>`;
        box.scrollTop = box.scrollHeight;
        playSound('chat');
    });

    const sendChat = () => {
        const inp = document.getElementById('stbChatInput');
        if(inp.value.trim()) { push(chatRef, { sender: currentUser.name, text: inp.value.trim() }); inp.value = ''; }
    };
    document.getElementById('stbBtnSendChat').onclick = sendChat;
    document.getElementById('stbChatInput').onkeydown = (e) => { if (e.key === 'Enter') sendChat(); };
}
