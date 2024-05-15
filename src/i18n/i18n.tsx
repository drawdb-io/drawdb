import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import {initReactI18next} from 'react-i18next';

const supportedLngs = ['en-US', 'zh-CN']
const translateItem = [
    {name:"English",file:"en-US"}
    ,{name:"简体中文",file:"zh-CN"}
];
export const getTranslateItem = ()=> {
    let result = []
    // const useLanguage = localStorage.getItem("useLanguage");
    for (const item of translateItem) {
        let lngItem = {}
        let name = item.name;
        //if(item.file === useLanguage){
        if(item.file === i18n.language){
            name = "[✔]" + name
        }
        lngItem[name] = ()=>{
            i18n.changeLanguage(item.file);
            // console.log("切换语言", item)
            localStorage.setItem("useLanguage", item.file)
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
        // lng: 'en-US',
        fallbackLng: 'en-US',
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
            loadPath: '/locales/{{lng}}.json',
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
        supportedLngs: supportedLngs
    }, function (err, t) {
        // i18n插件初始化完成或异常时的回调函数
        console.log('国际化插件初始化完毕!', err, t)
        //auto load last select Language
        console.log(">>>", this, i18n)
        if(!err && localStorage.getItem("useLanguage")){
            // let {i18n} = useTranslation();
            i18n.changeLanguage(localStorage.getItem("useLanguage"));
            // i18n.language = localStorage.getItem("useLanguage")
            console.log("auto load last select Language")
        }
    });
export default i18n;