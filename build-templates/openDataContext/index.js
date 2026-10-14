/**
 * @file index.js
 * @description 开放数据域（子域）入口：好友排行榜 / 好友邀请列表
 *
 * 主域通过 wx.getOpenDataContext().postMessage 下发消息：
 *  - { type: 'mode', mode: 'rank' | 'invite', roomId: '', title: '', imageUrl: '' } 切换模式并拉取数据
 *  - { type: 'viewport', x: 0, y: 0, width: 587, height: 504 }                      设置可视区尺寸
 *  - { type: 'touch', event: 'start' | 'move' | 'end', x: 0, y: 0 }                 触摸事件
 *  - { type: 'refresh' }                                                            强制刷新
 *
 * 说明：本文件不依赖 engine.js 模板，自行绘制列表与处理滚动/点击，
 *       以便在「邀请」模式下做条目点击命中并调用 wx.shareMessageToFriend。
 */

var env = (typeof wx !== 'undefined' && wx) || (typeof tt !== 'undefined' && tt) || (typeof swan !== 'undefined' && swan);
var sharedCanvas = env.getSharedCanvas();
var ctx = sharedCanvas.getContext('2d');
var dataApi = require('./render/data');

var ITEM_H = 96;        /* 条目高度 */
var AVATAR_SIZE = 60;   /* 头像尺寸 */
var PADDING_X = 24;     /* 左右内边距 */
var HEADER_H = 0;       /* 顶部预留（列表从 0 开始，标题由 FGUI 提供） */
var CLICK_MOVE_LIMIT = 12;
var CLICK_TIME_LIMIT = 400;

var state = {
    mode: 'rank',
    roomId: '',
    shareTitle: '',
    shareImage: '',
    width: 587,
    height: 504,
    items: [],
    scrollTop: 0,
    maxScroll: 0,
    loading: false,
    tips: '',
    selfOpenId: '',
    touchStartY: 0,
    touchStartTime: 0,
    lastTouchY: 0,
    moved: false,
    pressedIndex: -1,
};

var avatarCache = {};

/* ---------------- 工具 ---------------- */

function log() {
    if (env && env.__openDataDebug) {
        console.log.apply(console, arguments);
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getAvatar(url) {
    if (!url) {
        return null;
    }
    var cached = avatarCache[url];
    if (cached) {
        return cached.loaded ? cached.image : null;
    }
    var image = env.createImage();
    var record = { image: image, loaded: false };
    avatarCache[url] = record;
    image.onload = function () {
        record.loaded = true;
        draw();
    };
    image.onerror = function () {
        record.loaded = false;
    };
    image.src = url;
    return null;
}

/* ---------------- 数据 ---------------- */

/**
 * 拉取好友数据（数据层见 render/data.js，便于复用与单独维护）
 * @param {(list: Array, tips: string) => void} callback 回调：好友列表与提示文案
 */
function fetchFriendData(callback) {
    dataApi.fetchFriendList(['score'], function (list, tips) {
        if (tips) {
            log('getFriendCloudStorage fail:', tips);
        }
        callback(list, tips);
    });
}

function loadData() {
    state.loading = true;
    state.tips = '';
    draw();
    fetchFriendData(function (list, tips) {
        state.loading = false;
        state.items = list;
        state.tips = tips;
        state.scrollTop = 0;
        updateMaxScroll();
        draw();
    });
}

/* ---------------- 布局与绘制 ---------------- */

function updateMaxScroll() {
    var contentHeight = state.items.length * ITEM_H;
    state.maxScroll = Math.max(0, contentHeight - (state.height - HEADER_H));
}

function draw() {
    sharedCanvas.width = state.width;
    sharedCanvas.height = state.height;
    ctx.clearRect(0, 0, state.width, state.height);

    /* 背景 */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, state.width, state.height);

    if (state.loading) {
        drawCenterText('加载中…');
        return;
    }

    if (!state.items.length) {
        drawCenterText(state.tips || '暂无好友数据，快邀请好友来一局吧');
        return;
    }

    drawItems();
}

function drawCenterText(text) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, state.width / 2, state.height / 2);
}

function drawItems() {
    var startIndex = Math.floor(state.scrollTop / ITEM_H);
    var endIndex = Math.min(state.items.length, startIndex + Math.ceil((state.height - HEADER_H) / ITEM_H) + 1);

    ctx.textBaseline = 'middle';

    for (var i = startIndex; i < endIndex; i++) {
        var item = state.items[i];
        var top = HEADER_H + i * ITEM_H - state.scrollTop;

        /* 交替底色 */
        ctx.fillStyle = i % 2 === 0 ? '#F7F7F7' : '#FFFFFF';
        ctx.fillRect(0, top, state.width, ITEM_H);

        /* 左：头像 */
        var avatar = getAvatar(item.avatarUrl);
        var avatarX = PADDING_X;
        var avatarY = top + (ITEM_H - AVATAR_SIZE) / 2;
        if (avatar) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
            ctx.restore();
        } else {
            ctx.fillStyle = '#E0E0E0';
            ctx.beginPath();
            ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        /* 左：昵称 */
        ctx.fillStyle = '#333333';
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'left';
        var nameX = avatarX + AVATAR_SIZE + 16;
        var nameMaxWidth = state.width * 0.42;
        ctx.fillText(ellipsis(item.nickname, nameMaxWidth), nameX, top + ITEM_H / 2);

        /* 中：积分 */
        ctx.fillStyle = '#452E27';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(item.score), state.width * 0.68, top + ITEM_H / 2);

        /* 右：排名 */
        ctx.fillStyle = i < 3 ? '#E23B2E' : '#888888';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(i + 1), state.width - PADDING_X, top + ITEM_H / 2);

        /* 邀请模式：右侧加一个「邀请」提示 */
        if (state.mode === 'invite') {
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(state.width - 132, top + 20, 108, 56);
            ctx.fillStyle = '#E23B2E';
            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('邀请', state.width - 78, top + ITEM_H / 2);
        }
    }
}

function ellipsis(text, maxWidth) {
    if (!text) {
        return '';
    }
    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }
    var result = text;
    while (result.length > 1 && ctx.measureText(result + '…').width > maxWidth) {
        result = result.substring(0, result.length - 1);
    }
    return result + '…';
}

/* ---------------- 触摸与点击 ---------------- */

function hideToIndex(y) {
    var contentY = y - HEADER_H + state.scrollTop;
    var index = Math.floor(contentY / ITEM_H);
    if (index < 0 || index >= state.items.length) {
        return -1;
    }
    return index;
}

function onTouchStart(x, y) {
    state.touchStartY = y;
    state.lastTouchY = y;
    state.touchStartTime = Date.now();
    state.moved = false;
    state.pressedIndex = hideToIndex(y);
}

function onTouchMove(x, y) {
    var delta = y - state.lastTouchY;
    if (Math.abs(y - state.touchStartY) > CLICK_MOVE_LIMIT) {
        state.moved = true;
    }
    state.lastTouchY = y;
    state.scrollTop = clamp(state.scrollTop - delta, 0, state.maxScroll);
    draw();
}

function onTouchEnd(x, y) {
    var isClick = !state.moved && Date.now() - state.touchStartTime <= CLICK_TIME_LIMIT;
    var index = hideToIndex(y);
    if (!isClick || index < 0 || index !== state.pressedIndex) {
        state.pressedIndex = -1;
        return;
    }

    state.pressedIndex = -1;
    var item = state.items[index];
    if (state.mode === 'invite') {
        inviteFriend(item);
    }
}

/* ---------------- 定向邀请 ---------------- */

function inviteFriend(item) {
    if (!env || !env.shareMessageToFriend) {
        log('当前环境不支持 shareMessageToFriend');
        return;
    }
    if (!item || !item.openId) {
        return;
    }

    env.shareMessageToFriend({
        openId: item.openId,
        title: state.shareTitle || '来一局 24 点对战',
        imageUrl: state.shareImage || '',
        success: function () {
            log('定向邀请成功', item.openId);
        },
        fail: function (err) {
            log('定向邀请失败', err);
        },
    });
}

/* ---------------- 消息入口 ---------------- */

env.onMessage(function (data) {
    if (!data) {
        return;
    }

    if (data.type === 'viewport') {
        state.width = data.width || state.width;
        state.height = data.height || state.height;
        updateMaxScroll();
        draw();
        return;
    }

    if (data.type === 'mode') {
        state.mode = data.mode || 'rank';
        state.roomId = data.roomId || '';
        state.shareTitle = data.title || '';
        state.shareImage = data.imageUrl || '';
        loadData();
        return;
    }

    if (data.type === 'touch') {
        if (data.event === 'start') {
            onTouchStart(data.x, data.y);
        } else if (data.event === 'move') {
            onTouchMove(data.x, data.y);
        } else if (data.event === 'end') {
            onTouchEnd(data.x, data.y);
        }
        return;
    }

    if (data.type === 'refresh') {
        loadData();
    }
});

draw();
