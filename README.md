# postcss-plugin-pxtoviewport

## 用法

配合postcss可以使px转为vw和rem


### 输入/输出

*可以通过配置参数，实现px同时转为vw和rem*

```css
// 输入
h1 {
    margin: 0 0 20px;
    font-size: 32px;
    line-height: 1.2;
    letter-spacing: 1px;
}

// 输出
h1 {
    margin: 0 0 20px;
    margin: 0 0 1.25rem;
    margin: 0 0 5.33333vw;
    font-size: 2rem;
    font-size: 8.53333vw;
    line-height: 1.2;
    letter-spacing: 1px;
}
```

### 参数

Type: `Object | Null`  
Default:
```js
{
    viewportWidth: 750,
    viewportHeight: 1334,
    unitPrecision: 5,
    viewportUnit: 'vw',
    selectorBlackList: [],
    propList: [],
    minPixelValue: 1,
    mediaQuery: false,
    rootValue: 16,
    toRem: false,
    toViewport: true,
    isSavePx: false
}
```

- `viewportWidth` (Number) 设计稿宽度。
- `viewportUnit` (String) 转换单位。
- `rootValue` (Number) 根节点字体大小。
- `toRem` (Boolean) px是否可以转成rem。
- `toViewport` (Boolean) px是否可以转为vw 或 vh。
- `isSavePx` (Boolean) px是否保留。
- `unitPrecision` (Number) 转换之后的精度。
- `propList` (Array) 如果有些属性不想转为vw可以配置这个参数。
- `selectorBlackList` (Array) 忽略转换的模块。
- `mediaQuery` (Boolean) 媒体查询是否转换。
- `minPixelValue` (Number) 设置最小像素.


### 使用 gulp-postcss and postcss-plugin-pxtoviewport

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var pxtovw = require('postcss-plugin-pxtoviewport');

gulp.task('css', function () {
    var processors = [
        autoprefixer({
            browsers: 'last 1 version'
        }),
        pxtovw({
            viewportWidth: 375,
            toRem: true
        })
    ];

    return gulp.src(['build/css/**/*.css'])
        .pipe(postcss(processors))
        .pipe(gulp.dest('build/css'));
});
```

### 使用 webpack
```js
var webpack = require('webpack');
var px2viewport = require('postcss-plugin-pxtoviewport');

module.exports = {
    entry: [],
    output: [],
    module: {
        {
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: require.resolve('postcss-loader'),
                    options: {
                        ident: 'postcss',
                        plugins: () => [
                            px2viewport({
                                viewportWidth: 375,
                                toRem: true
                            })
                        ],
                    }
                }
            ]
        }
    }
}
```