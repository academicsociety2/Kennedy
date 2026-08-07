import { ref, update, onValue, push, onChildAdded, off } from "firebase/database";

const DEFAULT_SYMBOLS = ['🔥', '⚡', '💎', '🚀', '👑', '🎲', '👾', '🔮', '🎯', '🏆'];

export function initCardGame(container, roomData, currentUser, roomCode, dbInstance) {
    let timerInterval = null;
    let localScore = 0;
    let matchesCount = 0;
    let lockBoard = false;
    let firstCard = null, secondCard = null;
    let gameConfig = { timeLimit: 60, pairs: 8, penalty: false, fastFlip: false };

    const isHost = currentUser.uid === roomData.hostId;

    container.innerHTML = `
        <div class="cg-game-wrapper">
            <div class="cg-players-panel">
                <div class="cg-panel-title">
                    <span>اللاعبين</span>
                    <span id="cgPlayerCount">0</span>
                </div>
                <div id="cgPlayersList"></div>
            </div>

            <div class="cg-center-area">
                <div id="cgSetupModal" class="cg-modal-overlay">
                    <div class="cg-setup-card">
                        <h2 class="cg-setup-title">${isHost ? '⚙️ اختيارات وتحديات الجولة' : '⏳ في انتظار الهوست...'}</h2>
                        
                        ${isHost ? `
                            <div class="cg-option-group">
                                <label class="cg-option-label">مدة الجولة (بالثواني):</label>
                                <div class="cg-options-grid" id="optTimeGrid">
                                    <button class="cg-option-btn" data-val="30">30ث</button>
                                    <button class="cg-option-btn active" data-val="60">60ث</button>
                                    <button class="cg-option-btn" data-val="90">90ث</button>
                                </div>
                            </div>

                            <div class="cg-option-group">
                                <label class="cg-option-label">عدد أزواج الكروت:</label>
                                <div class="cg-options-grid" id="optPairsGrid">
                                    <button class="cg-option-btn" data-val="6">12 كارت</button>
                                    <button class="cg-option-btn active" data-val="8">16 كارت</button>
                                    <button class="cg-option-btn" data-val="10">20 كارت</button>
                                </div>
                            </div>

                            <div class="cg-option-group">
                                <label class="cg-checkbox-label">
                                    <input type="checkbox" id="chkPenalty">
                                    <span>خصم 5 نقاط عند التخمين الخاطئ ⚠️</span>
                                </label>
                            </div>

                            <div class="cg-option-group">
                                <label class="cg-checkbox-label">
                                    <input type="checkbox" id="chkFastFlip">
                                    <span>إخفاء سريع للكروت (0.5 ثانية) ⚡</span>
                                </label>
                            </div>

                            <button id="btnLaunchGame" class="cg-btn-start-game">🚀 ابدأ التحدي الآن!</button>
                        ` : `
                            <p style="color: #94a3b8; margin-top: 15px;">يقوم الهوست الآن باختيار قوانين اللعبة والتحديات...</p>
                        `}
                    </div>
                </div>

                <div class="cg-game-header">
                    <div class="cg-timer-box">
                        <div class="cg-timer-circle" id="cgTimerNum">60</div>
                        <div class="cg-timer-bar-bg">
                            <div class="cg-timer-bar-fill" id="cgTimerFill"></div>
                        </div>
                    </div>
                    <button class="cg-option-btn" id="btnExitGame" style="background:#ef4444; border:none;">خروج</button>
                </div>

                <div class="cg-board-container">
                    <div class="cg-board" id="cgBoard"></div>
                </div>
            </div>

            <div class="cg-chat-panel">
                <div class="cg-panel-title">💬 محادثة اللعبة</div>
                <div class="cg-chat-messages" id="cgChatMessages"></div>
                <div class="cg-chat-input-area">
                    <input type="text" id="cgChatInput" class="cg-chat-input" placeholder="اكتب رسالة..." autocomplete="off">
                    <button id="cgBtnSendChat" class="cg-btn-send">إرسال</button>
                </div>
            </div>
        </div>
    `;

    const setupModal = document.getElementById('cgSetupModal');
    const board = document.getElementById('cgBoard');
    const timerNum = document.getElementById('cgTimerNum');
    const timerFill = document.getElementById('cgTimerFill');
    const playersListEl = document.getElementById('cgPlayersList');
    const chatMsgsEl = document.getElementById('cgChatMessages');
    const chatInput = document.getElementById('cgChatInput');

    if (isHost) {
        setupOptionsHandler();
        document.getElementById('btnLaunchGame').onclick = () => {
            const deck = createShuffledDeck(gameConfig.pairs);
            
            update(ref(dbInstance, `rooms/${roomCode}`), {
                gameConfig: gameConfig,
                deck: deck,
                gameState: 'playing_started',
                startTime: Date.now()
            });
        };
    }

    function setupOptionsHandler() {
        document.querySelectorAll('#optTimeGrid .cg-option-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#optTimeGrid .cg-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gameConfig.timeLimit = parseInt(btn.dataset.val);
            };
        });
        document.querySelectorAll('#optPairsGrid .cg-option-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('#optPairsGrid .cg-option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                gameConfig.pairs = parseInt(btn.dataset.val);
            };
        });
        document.getElementById('chkPenalty').onchange = (e) => gameConfig.penalty = e.target.checked;
        document.getElementById('chkFastFlip').onchange = (e) => gameConfig.fastFlip = e.target.checked;
    }
    const roomRef = ref(dbInstance, `rooms/${roomCode}`);
    const roomListener = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.players) {
            renderPlayers(data.players);
        }

        if (data.gameState === 'playing_started' && setupModal.style.display !== 'none') {
            setupModal.style.display = 'none';
            gameConfig = data.gameConfig || gameConfig;
            buildBoard(data.deck);
            startTimer(data.startTime, gameConfig.timeLimit);
            updateLiveStatus('يفكر 🤔', 'thinking');
        }
    });
    function createShuffledDeck(pairsCount) {
        const selectedSymbols = DEFAULT_SYMBOLS.slice(0, pairsCount);
        const deck = [...selectedSymbols, ...selectedSymbols];
        return deck.sort(() => 0.5 - Math.random());
    }

    function buildBoard(deck) {
        board.innerHTML = '';
        if (gameConfig.pairs === 10) {
            board.style.gridTemplateColumns = 'repeat(5, 1fr)';
        } else if (gameConfig.pairs === 6) {
            board.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            board.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }

        deck.forEach((val, index) => {
            const card = document.createElement('div');
            card.className = 'cg-card';
            card.dataset.val = val;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="cg-card-face cg-card-back">K</div>
                <div class="cg-card-face cg-card-front">${val}</div>
            `;

            card.addEventListener('click', () => onCardClick(card));
            board.appendChild(card);
        });
    }
    function onCardClick(card) {
        if (lockBoard || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');

        if (!firstCard) {
            firstCard = card;
            updateLiveStatus('يقوم بالتقليب... 🃏', 'thinking');
            return;
        }

        secondCard = card;
        checkMatch();
    }

    function checkMatch() {
        lockBoard = true;
        const isMatch = firstCard.dataset.val === secondCard.dataset.val;

        if (isMatch) {
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            
            localScore += 10;
            matchesCount++;

            updateLiveStatus(`طابق كرتين! 🎉 (${matchesCount}/${gameConfig.pairs})`, 'matched');
            syncPlayerStats();

            resetTurn();

            if (matchesCount === gameConfig.pairs) {
                updateLiveStatus('أنهى جميع الكروت! 🏆', 'done');
                setTimeout(() => alert(`🎉 تهانينا! أنهيت الكروت بنجاح وحصلت على ${localScore} نقطة!`), 300);
            }
        } else {
            firstCard.classList.add('wrong-shake');
            secondCard.classList.add('wrong-shake');
            
            if (gameConfig.penalty && localScore >= 5) {
                localScore -= 5;
            }

            updateLiveStatus('تخمين خاطئ ❌', 'wrong');
            syncPlayerStats();

            const flipDelay = gameConfig.fastFlip ? 500 : 1000;
            setTimeout(() => {
                if (firstCard) {
                    firstCard.classList.remove('flipped', 'wrong-shake');
                    secondCard.classList.remove('flipped', 'wrong-shake');
                }
                resetTurn();
                updateLiveStatus('يفكر 🤔', 'thinking');
            }, flipDelay);
        }
    }

    function resetTurn() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    function startTimer(startTime, duration) {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = duration - elapsed;

            if (remaining <= 0) {
                clearInterval(timerInterval);
                timerNum.innerText = '0';
                timerFill.style.width = '0%';
                lockBoard = true;
                updateLiveStatus('انتهى الوقت! ⏰', 'wrong');
                alert('⏰ انتهى وقت الجولة!');
            } else {
                timerNum.innerText = remaining;
                const percentage = (remaining / duration) * 100;
                timerFill.style.width = `${percentage}%`;
            }
        }, 500);
    }

    function updateLiveStatus(statusText, statusClass) {
        update(ref(dbInstance, `rooms/${roomCode}/players/${currentUser.uid}`), {
            liveStatus: statusText,
            statusClass: statusClass
        });
    }

    function syncPlayerStats() {
        update(ref(dbInstance, `rooms/${roomCode}/players/${currentUser.uid}`), {
            score: localScore,
            matches: matchesCount
        });
    }

    function renderPlayers(players) {
        playersListEl.innerHTML = '';
        const playerKeys = Object.keys(players);
        document.getElementById('cgPlayerCount').innerText = playerKeys.length;

        playerKeys.forEach(uid => {
            const p = players[uid];
            const isMe = uid === currentUser.uid;

            const card = document.createElement('div');
            card.className = `cg-player-card ${isMe ? 'is-me' : ''}`;
            
            card.innerHTML = `
                <div class="cg-player-header">
                    <div class="cg-avatar">${(p.name || 'P')[0].toUpperCase()}</div>
                    <div class="cg-player-info">
                        <div class="cg-player-name">${p.name || 'لاعب'} ${isMe ? ' (أنت)' : ''}</div>
                        <div class="cg-player-score">النقاط: ${p.score || 0}</div>
                    </div>
                </div>
                <div class="cg-live-status ${p.statusClass || 'thinking'}">
                    <span>${p.liveStatus || 'في الانتظار...'}</span>
                </div>
            `;
            playersListEl.appendChild(card);
        });
    }
    const chatRef = ref(dbInstance, `rooms/${roomCode}/chat`);
    const chatListener = onChildAdded(chatRef, (snapshot) => {
        const msg = snapshot.val();
        if (!msg) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'cg-chat-msg';
        msgDiv.innerHTML = `<span class="sender">${msg.sender}:</span> ${msg.text}`;
        chatMsgsEl.appendChild(msgDiv);
        chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;
    });

    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        push(chatRef, {
            sender: currentUser.displayName || 'لاعب',
            text: text,
            timestamp: Date.now()
        });
        chatInput.value = '';
    }

    document.getElementById('cgBtnSendChat').onclick = sendChatMessage;
    chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendChatMessage(); };

    document.getElementById('btnExitGame').onclick = () => {
        clearInterval(timerInterval);
        off(roomRef);
        off(chatRef);
        
        if (isHost) {
            update(ref(dbInstance, `rooms/${roomCode}`), { state: 'lobby', gameState: 'lobby' });
        }
        
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('lobbyScreen').classList.add('active');
        container.innerHTML = '';
    };
}