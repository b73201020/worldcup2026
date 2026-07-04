// 國旗圖片路徑對應
const FLAGS = {
    CA: 'assets/img/CA.png',
    MA: 'assets/img/MA.png',
    PY: 'assets/img/PY.png',
    FR: 'assets/img/FR.png',
    US: 'assets/img/US.png',
    BE: 'assets/img/BE.png',
    PT: 'assets/img/PT.png',
    ES: 'assets/img/ES.png',
    BR: 'assets/img/BR.png',
    NO: 'assets/img/NO.png',
    MX: 'assets/img/MX.png',
    GB: 'assets/img/GB.png',
    CH: 'assets/img/CH.png',
    CO: 'assets/img/CO.png',
    AR: 'assets/img/AR.png',
    EG: 'assets/img/EG.png'
};

// 16強賽初始數據（8 場比賽，16 支隊伍）- 根據圖片順序更新
const BRACKET_DATA = {
    round16: [
        {
            id: "r16_1",
            team1: { name: "加拿大", flag: "🇨🇦", code: "CA" },
            team2: { name: "摩洛哥", flag: "🇲🇦", code: "MA" },
            winner: null
        },
        {
            id: "r16_2",
            team1: { name: "巴拉圭", flag: "🇵🇾", code: "PY" },
            team2: { name: "法國", flag: "🇫🇷", code: "FR" },
            winner: null
        },
        {
            id: "r16_3",
            team1: { name: "美國", flag: "🇺🇸", code: "US" },
            team2: { name: "比利時", flag: "🇧🇪", code: "BE" },
            winner: null
        },
        {
            id: "r16_4",
            team1: { name: "葡萄牙", flag: "🇵🇹", code: "PT" },
            team2: { name: "西班牙", flag: "🇪🇸", code: "ES" },
            winner: null
        },
        {
            id: "r16_5",
            team1: { name: "巴西", flag: "🇧🇷", code: "BR" },
            team2: { name: "挪威", flag: "🇳🇴", code: "NO" },
            winner: null
        },
        {
            id: "r16_6",
            team1: { name: "墨西哥", flag: "🇲🇽", code: "MX" },
            team2: { name: "英格蘭", flag: "🇬🇧", code: "GB" },
            winner: null
        },
        {
            id: "r16_7",
            team1: { name: "瑞士", flag: "🇨🇭", code: "CH" },
            team2: { name: "哥倫比亞", flag: "🇨🇴", code: "CO" },
            winner: null
        },
        {
            id: "r16_8",
            team1: { name: "阿根廷", flag: "🇦🇷", code: "AR" },
            team2: { name: "埃及", flag: "🇪🇬", code: "EG" },
            winner: null
        }
    ],
    quarterfinal: [
        {
            id: "qf_1",
            team1: null,
            team2: null,
            winner: null
        },
        {
            id: "qf_2",
            team1: null,
            team2: null,
            winner: null
        },
        {
            id: "qf_3",
            team1: null,
            team2: null,
            winner: null
        },
        {
            id: "qf_4",
            team1: null,
            team2: null,
            winner: null
        }
    ],
    semiFinal: [
        {
            id: "sf_1",
            team1: null,
            team2: null,
            winner: null
        },
        {
            id: "sf_2",
            team1: null,
            team2: null,
            winner: null
        }
    ],
    final: [
        {
            id: "f_1",
            team1: null,
            team2: null,
            winner: null
        }
    ],
    thirdPlace: [
        {
            id: "tp_1",
            team1: null,
            team2: null,
            winner: null
        }
    ],
    champion: {
        winner: null
    }
};

// 淘汰賽進程映射
const PROGRESSION = {
    // 16強 → 8強（四分之一決賽）
    "r16_1": { stage: "quarterfinal", matchId: "qf_1", position: 1 },
    "r16_2": { stage: "quarterfinal", matchId: "qf_1", position: 2 },
    "r16_3": { stage: "quarterfinal", matchId: "qf_2", position: 1 },
    "r16_4": { stage: "quarterfinal", matchId: "qf_2", position: 2 },
    "r16_5": { stage: "quarterfinal", matchId: "qf_3", position: 1 },
    "r16_6": { stage: "quarterfinal", matchId: "qf_3", position: 2 },
    "r16_7": { stage: "quarterfinal", matchId: "qf_4", position: 1 },
    "r16_8": { stage: "quarterfinal", matchId: "qf_4", position: 2 },
    // 8強 → 準決賽
    "qf_1": { stage: "semifinal", matchId: "sf_1", position: 1 },
    "qf_2": { stage: "semifinal", matchId: "sf_1", position: 2 },
    "qf_3": { stage: "semifinal", matchId: "sf_2", position: 1 },
    "qf_4": { stage: "semifinal", matchId: "sf_2", position: 2 },
    // 準決賽 → 決賽
    "sf_1": { stage: "final", matchId: "f_1", position: 1 },
    "sf_2": { stage: "final", matchId: "f_1", position: 2 },
    // 決賽 → 冠軍
    "f_1": { stage: "champion", matchId: null, position: 1 }
};

// 準決賽的「敗方」進入季軍賽（與 PROGRESSION 的勝方路線並行、互不影響）
const THIRD_PLACE_PROGRESSION = {
    "sf_1": { matchId: "tp_1", position: 1 },
    "sf_2": { matchId: "tp_1", position: 2 }
};

function findMatchById(matchId) {
    const [stage, num] = matchId.split('_');
    let stageKey;

    if (stage === 'r16') stageKey = 'round16';
    else if (stage === 'qf') stageKey = 'quarterfinal';
    else if (stage === 'sf') stageKey = 'semiFinal';
    else if (stage === 'f') stageKey = 'final';
    else if (stage === 'tp') stageKey = 'thirdPlace';
    else return null;

    return BRACKET_DATA[stageKey].find(m => m.id === matchId);
}

// 準決賽產生勝負後，把「敗方」推進季軍賽對應的位置
function updateThirdPlace(matchId, winnerTeam) {
    const progression = THIRD_PLACE_PROGRESSION[matchId];
    if (!progression) return;

    const match = findMatchById(matchId);
    if (!match || !match.team1 || !match.team2) return;

    const loserTeam = match.team1.name === winnerTeam.name ? match.team2 : match.team1;

    const tpMatch = findMatchById(progression.matchId);
    if (!tpMatch) return;

    const key = progression.position === 1 ? 'team1' : 'team2';
    const previousTeam = tpMatch[key];
    tpMatch[key] = loserTeam;

    const teamChanged = !previousTeam || previousTeam.name !== loserTeam.name;
    if (teamChanged && tpMatch.winner) {
        tpMatch.winner = null;
    }
}

// 準決賽的預測被取消/改變時，清除季軍賽中對應的敗方隊伍與已選結果
function clearThirdPlace(matchId) {
    const progression = THIRD_PLACE_PROGRESSION[matchId];
    if (!progression) return;

    const tpMatch = findMatchById(progression.matchId);
    if (!tpMatch) return;

    const key = progression.position === 1 ? 'team1' : 'team2';
    tpMatch[key] = null;
    tpMatch.winner = null;
}

function updateNextRound(matchId, winnerTeam) {
    updateThirdPlace(matchId, winnerTeam);

    const progression = PROGRESSION[matchId];
    if (!progression) return;

    if (progression.stage === 'champion') {
        BRACKET_DATA.champion.winner = winnerTeam;
        return;
    }

    const nextMatch = findMatchById(progression.matchId);
    if (!nextMatch) return;

    const key = progression.position === 1 ? 'team1' : 'team2';
    const previousTeam = nextMatch[key];
    nextMatch[key] = winnerTeam;

    // 如果推進的隊伍與原本不同（例如改選了別隊），
    // 代表下一場比賽原本的結果已失效，必須清除並繼續往後清除
    const teamChanged = !previousTeam || previousTeam.name !== winnerTeam.name;
    if (teamChanged && nextMatch.winner) {
        nextMatch.winner = null;
        clearDownstream(nextMatch.id);
    }
}

// 清除某場比賽的結果對「後續比賽」造成的影響（遞迴清到冠軍為止）
function clearDownstream(matchId) {
    clearThirdPlace(matchId);

    const progression = PROGRESSION[matchId];
    if (!progression) return;

    if (progression.stage === 'champion') {
        BRACKET_DATA.champion.winner = null;
        return;
    }

    const nextMatch = findMatchById(progression.matchId);
    if (!nextMatch) return;

    const key = progression.position === 1 ? 'team1' : 'team2';
    nextMatch[key] = null;

    if (nextMatch.winner) {
        nextMatch.winner = null;
        clearDownstream(nextMatch.id);
    }
}
