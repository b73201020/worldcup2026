const STORAGE_KEY = "worldcup2026_bracket";

class BracketStorage {
    static saveBracket() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(BRACKET_DATA));
    }

    static loadBracket() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const savedData = JSON.parse(data);
            // 更新 BRACKET_DATA
            Object.assign(BRACKET_DATA, savedData);
            return true;
        }
        return false;
    }

    static resetBracket() {
        // 第 1 步：重置所有內存數據
        BRACKET_DATA.round16.forEach(m => {
            m.winner = null;
        });
        BRACKET_DATA.quarterfinal.forEach(m => {
            m.team1 = null;
            m.team2 = null;
            m.winner = null;
        });
        BRACKET_DATA.semiFinal.forEach(m => {
            m.team1 = null;
            m.team2 = null;
            m.winner = null;
        });
        BRACKET_DATA.final.forEach(m => {
            m.team1 = null;
            m.team2 = null;
            m.winner = null;
        });
        BRACKET_DATA.champion.winner = null;

        // 第 2 步：清除 localStorage
        localStorage.removeItem(STORAGE_KEY);
    }

    static savePrediction(matchId, winnerTeam) {
        const match = findMatchById(matchId);
        if (match) {
            match.winner = winnerTeam;
            updateNextRound(matchId, winnerTeam);
            this.saveBracket();
        }
    }

    static cancelPrediction(matchId) {
        const match = findMatchById(matchId);
        if (match && match.winner) {
            match.winner = null;
            clearDownstream(matchId);
            this.saveBracket();
        }
    }
}

// 頁面載入時自動載入已保存的預測
document.addEventListener('DOMContentLoaded', () => {
    BracketStorage.loadBracket();
});
