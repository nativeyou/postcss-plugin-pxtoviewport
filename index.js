const postcss = require('postcss');
const objectAssign = require('object-assign');
const filterPropList = require('./lib/filter-prop-list');

const pxRegex = /"[^"]+"|'[^']+'|url\([^)]+\)|(\d*\.?\d+)px/ig;

const defaults = {
    viewportWidth: 750,         // 默认设计稿宽度
    viewportHeight: 1334,  // 默认设计稿高度 其实不用设置，根本没有使用过这个参数，加上它是为了显示逼格
    unitPrecision: 5,       // 保留小数点之后位数
    viewportUnit: 'vw',     // 默认为vw
    selectorBlackList: [],  // 黑名单  用于忽略转换为vw
    propList: [],               // 某个属性 用于忽略转为vw  eg: ['font-size'] or ['font-size', 'margin*']  or ['font-size', 'margin*', '*-width'] or ['*position*']
    minPixelValue: 1,       // 最小像素限制
    mediaQuery: false, // 是否转换媒体查询
    rootValue: 16,      // 转换为rem的基础字号
    toRem: false,       // 是否转换为rem
    toViewport: true,    // 是否转换为vw 最好不要设置
    isSavePx: false         // 是否保留px
};

module.exports = postcss.plugin('postcss-plugin-px-to-viewport', options => {
    const opts = objectAssign({}, defaults, options);
    const px2vwReplace = createPx2Viewport(opts.viewportUnit === 'vw' ? opts.viewportWidth : opts.viewportHeight, opts.minPixelValue, opts.unitPrecision, opts.viewportUnit);
    const px2remReplace = createPx2Rem(opts.viewportWidth, opts.rootValue, opts.minPixelValue, opts.unitPrecision);
    const satisfyPropList = createPropListMatcher(opts.propList);

    return css => {
        css.walkDecls((decl, i) => {
            if (decl.value.indexOf('px') === -1) return;

            const declValue = decl.value;

            const isInBlackList = blacklistedSelector(opts.selectorBlackList, decl.parent.selector);

            if (isInBlackList) return;

            if (opts.toViewport)
                decl.value = declValue.replace(pxRegex, px2vwReplace);

            if(opts.isSavePx && opts.toViewport){
                if(pxRegex.test(declValue)){
                    const cloned = decl.clone({value: declValue});
                    if(decl.value === cloned.value) return
                    decl.parent.insertBefore(decl, cloned);
                }
            }
            
            if (opts.toRem) {
                if (!isInBlackList && satisfyPropList(decl.prop) && opts.toViewport) {
                    const cloned = decl.clone({value: declValue.replace(pxRegex, px2remReplace)});
                    if (cloned.value === declValue) return;
                    decl.parent.insertBefore(decl, cloned)
                } else {
                    decl.value = declValue.replace(pxRegex, px2remReplace)
                }
            }

            if(opts.isSavePx && !opts.toViewport){
                if(pxRegex.test(declValue)){
                    const cloned = decl.clone({value: declValue});
                    if(decl.value === cloned.value) return
                    decl.parent.insertBefore(decl, cloned);
                }
            }
        });

        if (opts.mediaQuery) {
            css.walkAtRules('media', rule => {
                if (rule.params.indexOf('px') === -1) return;
                rule.params = rule.params.replace(pxRegex, px2vwReplace)
            })
        }
    }
});

function createPx2Viewport (viewportSize, minPixelValue, unitPrecision, viewportUnit) {
    return (m, $1) => {
        if (!$1) return m;

        let pixels = parseFloat($1);
        if (pixels <= minPixelValue) {
            return m
        }

        return toFixed((pixels / viewportSize * 100), unitPrecision) + viewportUnit
    }
}

function createPx2Rem (viewportSize, rootValue, minPixelValue, unitPrecision) {
    return (m, $1) => {
        if (!$1) return m;

        let pixels = parseFloat($1);
        if (pixels <= minPixelValue) return m;

        return toFixed((pixels / rootValue), unitPrecision) + 'rem'
    }
}

function toFixed (number, precision) {
    let multiplier = Math.pow(10, precision + 1);
    let wholeNumber = Math.floor(number * multiplier);
    return Math.round(wholeNumber / 10) * 10 / multiplier;
}

function blacklistedSelector (blacklist, selector) {
    if (typeof selector !== 'string') return;
    return blacklist.some(regex => {
        if (typeof regex === 'string') return selector.indexOf(regex) !== -1;
        return selector.match(regex)
    })
}

function createPropListMatcher(propList) {
    let lists = {
        exact: filterPropList.exact(propList),
        contain: filterPropList.contain(propList),
        startWith: filterPropList.startWith(propList),
        endWith: filterPropList.endWith(propList)
    };
    return function (prop) {
        if (lists.exact.indexOf(prop) > -1
            || lists.contain.some(function (m) {
                return prop.indexOf(m) > -1;
            }) ||
            lists.startWith.some(function (m) {
                return prop.indexOf(m) === 0;
            }) ||
            lists.endWith.some(function (m) {
                return prop.indexOf(m) === prop.length - m.length;
            }) )
            return false;
        else
            return true;
    };
}