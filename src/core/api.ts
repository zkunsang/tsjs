import { NewsFeed, NewsDetail } from '../types';
import { NEWS_URL, CONTENT_URL } from '../config';

export class Api {
  xhr: XMLHttpRequest;
  url: string;

  constructor(url: string) {
    this.xhr = new XMLHttpRequest();
    this.url = url;
  }
  async request<AjaxResponse>(): Promise<AjaxResponse> {
    const response = await fetch(this.url);
    return await response.json() as AjaxResponse;
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

  async getData(): Promise<NewsFeed[]> {
    return await this.request<NewsFeed[]>();
  }
}

export class NewsDetailApi extends Api{
  constructor(url: string) {
    super(url);
  }

  async getData(): Promise<NewsDetail> {
    return await this.request<NewsDetail>();
  }
}

// export interface NewsFeedApi extends Api { };
// export interface NewsDetailApi extends Api { };

// applyApiMixins(NewsFeedApi, [Api]);
// applyApiMixins(NewsDetailApi, [Api]);