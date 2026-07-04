let selectedMatchId = null;

document.addEventListener('DOMContentLoaded', () => {
    renderBracket();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('saveBtn').addEventListener('click', saveBracket);
    document.getElementById('resetBtn').addEventListener('click', resetBracket);
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // 點擊模態框外部關閉
    const modal = document.getElementById('teamModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function renderBracket() {
    renderRound16();
    renderQuarterfinal();
    renderSemiFinal();
    renderFinal();
    renderChampion();
}

function renderRound16() {
    const container = document.getElementById('round16');
    container.innerHTML = '';

    BRACKET_DATA.round16.forEach(match => {
        container.appendChild(createMatchSlot(match));
    });
}

function renderQuarterfinal() {
    const container = document.getElementById('quarterfinal');
    container.innerHTML = '';

    BRACKET_DATA.quarterfinal.forEach(match => {
        container.appendChild(createMatchSlot(match));
    });
}

function renderSemiFinal() {
    const container = document.getElementById('semifinal');
    container.innerHTML = '';

    BRACKET_DATA.semiFinal.forEach(match => {
        container.appendChild(createMatchSlot(match));
    });
}

function renderFinal() {
    const container = document.getElementById('final');
    container.innerHTML = '';

    BRACKET_DATA.final.forEach(match => {
        container.appendChild(createMatchSlot(match));
    });
}

// 將比賽卡片包在 slot 容器內，讓 CSS 用 flex:1 平均分配高度，
// 使卡片能垂直置中對齊前一輪的兩場比賽中點，並提供連接線的定位基準
function createMatchSlot(match) {
    const slot = document.createElement('div');
    slot.className = 'match-slot';
    slot.appendChild(createMatchCard(match));
    return slot;
}

function renderChampion() {
    const champContainer = document.getElementById('champion');
    const champion = BRACKET_DATA.champion.winner;

    if (champion) {
        const flagUrl = champion.code ? FLAGS[champion.code] : '';
        champContainer.innerHTML = `
            <img class="champion-flag" src="${flagUrl}" alt="${champion.name}" title="${champion.name}">
            <div class="champion-name">${champion.name}</div>
        `;
    } else {
        champContainer.innerHTML = `
            <div class="champion-flag"></div>
            <div class="champion-name">待定</div>
        `;
    }
}

function createMatchCard(match) {
    const div = document.createElement('div');
    div.className = 'match-card';

    // 檢查是否已完成預測
    const isCompleted = match.winner !== null;
    if (isCompleted) {
        div.classList.add('completed');
    }

    // 檢查隊伍是否已確定（來自前一輪的勝者）
    const team1Ready = match.team1 !== null;
    const team2Ready = match.team2 !== null;
    const bothTeamsReady = team1Ready && team2Ready;

    let team1HTML = '';
    let team2HTML = '';

    if (match.team1) {
        const isWinner = match.winner && match.winner.name === match.team1.name;
        const winnerClass = isWinner ? 'winner' : '';
        const flagUrl = match.team1.code ? FLAGS[match.team1.code] : '';
        team1HTML = `
            <div class="team ${winnerClass}">
                <img class="flag" src="${flagUrl}" alt="${match.team1.name}" title="${match.team1.name}">
                <span class="name">${match.team1.name}</span>
            </div>
        `;
    } else {
        team1HTML = `<div class="team placeholder">待定</div>`;
    }

    if (match.team2) {
        const isWinner = match.winner && match.winner.name === match.team2.name;
        const winnerClass = isWinner ? 'winner' : '';
        const flagUrl = match.team2.code ? FLAGS[match.team2.code] : '';
        team2HTML = `
            <div class="team ${winnerClass}">
                <img class="flag" src="${flagUrl}" alt="${match.team2.name}" title="${match.team2.name}">
                <span class="name">${match.team2.name}</span>
            </div>
        `;
    } else {
        team2HTML = `<div class="team placeholder">待定</div>`;
    }

    // 只要兩支隊伍都確定，就允許點擊（即使已選定勝者，仍可點擊切換或取消）
    const clickable = bothTeamsReady;

    div.innerHTML = `
        ${team1HTML}
        <div class="match-result">${match.winner ? '✓' : ''}</div>
        ${team2HTML}
    `;

    // 為可點擊的隊伍添加事件監聽
    if (clickable && match.team1) {
        const team1El = div.querySelector('.team:first-child');
        team1El.style.cursor = 'pointer';
        team1El.addEventListener('click', (e) => {
            e.stopPropagation();
            selectWinnerDirect(match, match.team1);
        });
        team1El.addEventListener('mouseover', () => {
            team1El.style.backgroundColor = 'var(--primary-color)';
            team1El.style.color = 'white';
        });
        team1El.addEventListener('mouseout', () => {
            team1El.style.backgroundColor = '';
            team1El.style.color = '';
        });
    }

    if (clickable && match.team2) {
        const team2El = div.querySelector('.team:last-child');
        team2El.style.cursor = 'pointer';
        team2El.addEventListener('click', (e) => {
            e.stopPropagation();
            selectWinnerDirect(match, match.team2);
        });
        team2El.addEventListener('mouseover', () => {
            team2El.style.backgroundColor = 'var(--primary-color)';
            team2El.style.color = 'white';
        });
        team2El.addEventListener('mouseout', () => {
            team2El.style.backgroundColor = '';
            team2El.style.color = '';
        });
    }

    return div;
}

function openTeamModal(matchId) {
    const match = findMatchById(matchId);
    if (!match || !match.team1 || !match.team2) return;

    selectedMatchId = matchId;

    const flag1Url = match.team1.code ? FLAGS[match.team1.code] : '';
    const flag2Url = match.team2.code ? FLAGS[match.team2.code] : '';

    document.getElementById('team1Option').innerHTML = `
        <img class="team-flag" src="${flag1Url}" alt="${match.team1.name}" title="${match.team1.name}">
        <span class="team-name">${match.team1.name}</span>
    `;
    document.getElementById('team1Option').dataset.team = match.team1.name;

    document.getElementById('team2Option').innerHTML = `
        <img class="team-flag" src="${flag2Url}" alt="${match.team2.name}" title="${match.team2.name}">
        <span class="team-name">${match.team2.name}</span>
    `;
    document.getElementById('team2Option').dataset.team = match.team2.name;

    // 清除之前的選擇樣式
    document.querySelectorAll('.team-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 如果已有預測，高亮已選擇的隊伍
    if (match.winner) {
        document.querySelectorAll('.team-option').forEach(opt => {
            if (opt.dataset.team === match.winner.name) {
                opt.classList.add('selected');
            }
        });
    }

    // 設定點擊事件
    document.getElementById('team1Option').onclick = () => selectWinner(match.team1);
    document.getElementById('team2Option').onclick = () => selectWinner(match.team2);

    document.getElementById('teamModal').classList.remove('hidden');
}

function selectWinner(team) {
    BracketStorage.savePrediction(selectedMatchId, team);
    renderBracket();
    closeModal();
    showNotification(`${team.name} 晉級下一輪 ✓`);
}

function selectWinnerDirect(match, team) {
    // 檢查該隊伍是否已經是赢家 → 點擊已選定的隊伍代表取消選擇
    if (match.winner && match.winner.name === team.name) {
        BracketStorage.cancelPrediction(match.id);
        renderBracket();
        showNotification(`已取消 ${team.name} 的選擇 ✗`);
        return;
    }

    // 否則，保存新的預測（若原本已有其他勝者，會自動清除後續受影響的比賽）
    BracketStorage.savePrediction(match.id, team);
    renderBracket();
    showNotification(`${team.name} 晉級下一輪 ✓`);
}

function closeModal() {
    document.getElementById('teamModal').classList.add('hidden');
    selectedMatchId = null;
}

function saveBracket() {
    BracketStorage.saveBracket();
    showNotification('預測已保存 💾');
}

function resetBracket() {
    if (confirm('確定要重置所有預測嗎？此動作無法復原。')) {
        BracketStorage.resetBracket();
        renderBracket();
        showNotification('所有預測已清除 🔄');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
