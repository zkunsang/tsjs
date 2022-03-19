import { NewsFeed, NewsDetail } from '../types';
import { NEWS_URL, CONTENT_URL } from '../config';

export class Api {
  xhr: XMLHttpRequest;
  url: string;

  constructor(url: string) {
    this.xhr = new XMLHttpRequest();
    this.url = url;
  }

  getRequestWithXHR<AjaxResponse>(cb: (data: AjaxResponse) => void): void {
    this.xhr.open('Get', this.url, false);
    this.xhr.addEventListener('load', () => {
      cb(JSON.parse(this.xhr.response) as AjaxResponse);
    });

    this.xhr.send();
  }

  getRequestWithPromise<AjaxResponse>(cb: (data: AjaxResponse) => void): void {
    // xhr 보다는
    // 최신 버젼의 api(fetch) , promise베이스
    // json.parse가 동기적으로 작동하게 되어있다. 느려서 멈추게 됨.
    // json자체도 비동기로 
    fetch(this.url)
      .then(response => response.json())
      .then(cb)
      .catch(() => {
        console.error('error occured');
      })
  }
}

function applyApiMixins(targetClass: any, baseClasses: any[]): void {
  baseClasses.forEach(baseClass => {
    // 공식 문서에서 사용되는 코드 mixins
    Object.getOwnPropertyNames(baseClass.prototype).forEach(name => {
      const descriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, name);

      if (descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    })
  })
}

export class NewsFeedApi extends Api{
  constructor(url: string) {
    super(url);
  }

  getDataWithXHR(cb: (data: NewsFeed[]) => void): void {
    this.getRequestWithXHR<NewsFeed[]>(cb);
  }
  getDataWithPromise(cb: (data: NewsFeed[]) => void): void {
    this.getRequestWithPromise<NewsFeed[]>(cb);
  }
}

export class NewsDetailApi extends Api{
  constructor(url: string) {
    super(url);
  }

  getDataWithXHR(cb: (data: NewsDetail) => void): void {
    this.getRequestWithXHR<NewsDetail>(cb);
  }

  getDataWithPromise(cb: (data: NewsDetail) => void): void {
    this.getRequestWithPromise<NewsDetail>(cb);
  }
}

// export interface NewsFeedApi extends Api { };
// export interface NewsDetailApi extends Api { };

// applyApiMixins(NewsFeedApi, [Api]);
// applyApiMixins(NewsDetailApi, [Api]);