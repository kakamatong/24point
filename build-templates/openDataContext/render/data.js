/**
 * @file data.js
 * @description 开放数据域数据层：拉取好友托管数据（好友榜 / 好友邀请列表共用）
 *
 * 说明：进入开放数据域前，主域已通过 wx.getSetting + wx.getUserInteractiveStorage
 *       确认过「微信朋友信息」授权；因此这里直接调用即可，不做延迟/重试等兜底。
 */

var env = (typeof wx !== 'undefined' && wx) || (typeof tt !== 'undefined' && tt) || (typeof swan !== 'undefined' && swan);

function log() {
    if (env && env.__openDataDebug) {
        console.log.apply(console, arguments);
    }
}

/**
 * 把微信返回的好友数据归一化并按分数降序排列
 * @param {Array} list wx.getFriendCloudStorage 返回的 data 数组
 * @returns {Array<{openId: string, avatarUrl: string, nickname: string, score: number}>}
 */
function normalize(list) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i] || {};
        var score = item.data && item.data.score !== undefined ? Number(item.data.score) || 0 : 0;
        result.push({
            openId: item.openId || '',
            avatarUrl: item.avatarUrl || '',
            nickname: item.nickName || item.nickname || '好友',
            score: score,
        });
    }
    result.sort(function (a, b) {
        return b.score - a.score;
    });
    return result;
}

/**
 * 拉取同玩好友数据
 * @param {string[]} keyList 需要读取的托管数据 key
 * @param {(list: Array, tips: string) => void} callback 回调：好友列表与提示文案
 */
function fetchFriendList(keyList, callback) {
    if (!env || !env.getFriendCloudStorage) {
        callback([], '当前环境不支持关系链数据');
        return;
    }

    env.getFriendCloudStorage({
        keyList: keyList || ['score'],
        success: function (res) {
            callback(normalize((res && res.data) || []), '');
        },
        fail: function (err) {
            log('getFriendCloudStorage fail', err);
            callback([], '关系链数据获取失败（可能未授权）');
        },
    });
}

module.exports = {
    fetchFriendList: fetchFriendList,
};
