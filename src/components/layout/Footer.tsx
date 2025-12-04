
import Link from "next/link";

export function Footer() {

    return (
        <footer className="bg-gray-800 text-white p-4 md:hidden">
            <div className="container mx-auto">
                <h3 className="text-lg font-bold mb-2">Контакты</h3>
                <div className="flex flex-col space-y-2">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <a href="https://yandex.by/maps/157/minsk/?text=Логойский+тракт+22А" target="_blank" rel="noopener noreferrer">
                            Логойский тракт 22А, Минск, СЦ ПринтЛюкс,
                            вход в цокольный этаж с левой стороны от
                            центрального входа
                        </a>
                    </div>
                    <div className="flex items-center">
                         <svg className="w-6 h-6 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <div>
                            <a href="tel:+375173703676">+375 (17) 370-36-76</a><br/>
                            <a href="tel:+375296960586">+375 (29) 696-05-86</a>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <svg className="w-6 h-6 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        <a href="mailto:service@printlux.by">service@printlux.by</a>
                    </div>
                    <div className="flex items-start">
                        <svg className="w-6 h-6 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>
                            Время работы: будние дни с 09:00 до 13:00 и
                            с 14:00 до 18:00; оформление документов и
                            прием техники до 17:30; суббота,
                            воскресение - выходной.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
