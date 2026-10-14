/**
 * @file data.js
 * @description 开放数据域数据层：拉取好友托管数据（好友榜 / 好友邀请列表共用）
 */

var env = (typeof wx !== 'undefined' && wx) || (typeof tt !== 'undefined' && tt) || (typeof swan !== 'undefined' && swan);

/**
 * 拉取同玩好友数据
 * @param {string[]} keyList 需要读取的托管数据 key
 * @param {(list: Array<{openId: string, avatarUrl: string, nickname: string, score: number}>, tips: string) => void} callback
 */
function fetchFriendList(keyList, callback) {
    if (!env || !env.getFriendCloudStorage) {
        callback([], '当前环境不支持关系链数据');
        return;
    }

    env.getFriendCloudStorage({
        keyList: keyList || ['score'],
        success: function (res) {
            var list = (res && res.data) || [];
            var result = [];
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                var score = item && item.data && item.data.score !== undefined ? Number(item.data.score) || 0 : 0;
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
            callback(result, '');
        },
        fail: function (err) {
            callback([], '关系链数据获取失败（可能未授权）');
        },
    });
}

module.exports = {
    fetchFriendList: fetchFriendList,
};
