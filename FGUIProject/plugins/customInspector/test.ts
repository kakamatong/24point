var loader3D = '<loader3D id="n5_mwn6" name="KW_IMG_DRAGON_ICON" xy="100,100" pivot="0.5,0.5" anchor="true" size="200,201" url="ui://vii4x7mbopm82p" animation="" skin="" loop="true"/>';

const loader = {
    clearOnPublish: true,
    animationName: 'aaa',
    url: 'bbb',
    autoSize: false,
};
// const reg = (key: string) => {
//     return new RegExp(`(${key}(\s*)=(\s*)"([^"]+)")`, 'g');
// };
const setValueByKey = (key, value, str) => {
    let pattern = new RegExp(`(${key}(\s*)=(\s*)"([^"]*)")`, 'g');
    let a = str.replace(pattern, `${key}="${value}"`);
    console.log(key + '\n' + a + '\n' + str.match(pattern) + '\n' + '-'.repeat(100));
    return a;
};
if (loader3D.indexOf('clearOnPublish') < 0) {
    loader3D = loader3D.substring(0, loader3D.length - 2) + ` clearOnPublish="${loader.clearOnPublish}"/>`;
} else {
    loader3D = setValueByKey('clearOnPublish', loader.clearOnPublish, loader3D);
}
if (loader3D.indexOf('animation') < 0) {
    loader3D = loader3D.substring(0, loader3D.length - 2) + ` animation="${loader.animationName}"/>`;
} else {
    loader3D = setValueByKey('animation', loader.animationName, loader3D);
}
if (loader3D.indexOf('url') < 0) {
    loader3D = loader3D.substring(0, loader3D.length - 2) + ` url="${loader.url}"/>`;
} else {
    loader3D = setValueByKey('url', loader.url, loader3D);
}
if (loader3D.indexOf('autoSize') < 0) {
    loader3D = loader3D.substring(0, loader3D.length - 2) + ` autoSize="${loader.autoSize}"/>`;
} else {
    loader3D = setValueByKey('autoSize', loader.autoSize, loader3D);
}
console.log(loader3D);
