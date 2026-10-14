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
 * 从一条好友数据里取出分数，兼容微信可能返回的几种结构：
 *   1) KVDataList: [{ key: "score", value: "177" }]      ← 实际返回结构
 *   2) data:       { score: "177" }
 *   3) 直接挂在 item 上：{ score: "177" }
 * @param {object} item 好友数据项
 * @param {string} key 数据 key
 * @returns {number} 分数，取不到返回 0
 */
function readScore(item, key) {
    if (!item) {
        return 0;
    }

    /* 结构一：KVDataList / data 数组（每项为 KVData） */
    var kvList = item.KVDataList || item.data;
    if (kvList && typeof kvList.length === 'number') {
        for (var i = 0; i < kvList.length; i++) {
            var kv = kvList[i];
            if (kv && kv.key === key) {
                return Number(kv.value) || 0;
            }
        }
    }

    /* 结构二：data 对象 */
    if (item.data && item.data[key] !== undefined) {
        return Number(item.data[key]) || 0;
    }

    /* 结构三：直接挂在 item 上 */
    if (item[key] !== undefined) {
        return Number(item[key]) || 0;
    }

    return 0;
}

/**
 * 把微信返回的好友数据归一化并按分数降序排列
 * @param {Array} list wx.getFriendCloudStorage 返回的 data 数组
 * @param {string} key 分数 key
 * @returns {Array<{openId: string, avatarUrl: string, nickname: string, score: number}>}
 */
function normalize(list, key) {
    var result = [];
    for (var i = 0; i < list.length; i++) {
        var item = list[i] || {};
        result.push({
            openId: item.openId || '',
            avatarUrl: item.avatarUrl || '',
            nickname: item.nickName || item.nickname || '好友',
            score: readScore(item, key),
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

    var keys = keyList || ['score'];
    env.getFriendCloudStorage({
        keyList: keys,
        success: function (res) {
            callback(normalize((res && res.data) || [], keys[0]), '');
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
