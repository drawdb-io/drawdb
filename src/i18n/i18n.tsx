import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next, useTranslation} from 'react-i18next';

const translateItem = [
    {name:"English",file:"en-US"}
    ,{name:"简体中文",file:"zh-CN"}
];
export const getTranslateItem = ()=> {
    let result = []
    let {i18n} = useTranslation();
    for (const item of translateItem) {
        let lngItem = {}
        lngItem[item.name] = ()=>{
            i18n.changeLanguage(item.file);
            console.log("切换语言", item)
        }
        result.push(lngItem)
    }
    return result
}

i18n
    // 加入Backend插件,用于从远程服务器获取国际化资源
    // 插件详见: https://github.com/i18next/i18next-http-backend
    .use(Backend)
    // 探测用户语言
    // 插件详见: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // 初始化配置
    // 所有配置详见: https://www.i18next.com/overview/configuration-options
    .init({
        react: {
            // 是否需要在最外层加入Suspense标签
            useSuspense: false
        },
        // 设置默认语言
        lng: 'zh-CN',
        fallbackLng: 'zh-CN',
        // 是否启用调试模式
        debug: true,
        //
        load: 'currentOnly',
        backend: {
            /**
             * 用于构建请求url
             * @param lngs 语言编码
             * @param namespaces 名称空间
             */
            // loadPath: function (lngs: Array<string>, namespaces: Array<string>) {
            //     console.log(lngs, namespaces)
            //     return `http://localhost:8000/locales/${lngs[0]}.json`;
            // },
            //loadPath: '/locales/{{lng}}/{{ns}}.json',
            loadPath: '/locales/{{lng}}.json',
            /**
             * 用于对响应的结果进行结构转化
             * @param data 原始响应的字符串结果
             */
            // parse: function (data) {
            //     console.log("i18n-parse", data)
            //     const obj = eval("(" + data + ")");
            //     return obj.resp;
            // },

            /**
             * 是否允许跨域
             */
            crossDomain: true,
            /**
             * 是否允许携带登录凭证
             */
            withCredentials: true,
            /**
             * 保存未翻译
             */
            saveMissing: true, // send not translated keys to endpoint
        },
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        // resources: {
        //     "en-US": {
        //         translation: {
        //             File: "File文件"
        //         }
        //     },
        //     "zh-CN": {
        //         translation: {
        //             File: "文件"
        //         }
        //     }
        // }

    }, function (err, t) {
        // i18n插件初始化完成或异常时的回调函数
        console.log('国际化插件初始化完毕!', err, t)
    });
export default i18n;