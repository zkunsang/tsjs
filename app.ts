const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";

const rootEl: HTMLElement | null = document.getElementById("root");

class Api {
  getRequest<AjaxResoponse>(url: string): AjaxResoponse {
    const ajax = new XMLHttpRequest();
    ajax.open('Get', url, false);
    ajax.send();
    
    return JSON.parse(ajax.response);
  }
}

function applyApiMixins(targetClass: any, baseClasses: any[]): void {
  baseClasses.forEach(baseClass => {
    // 공식 문서에서 사용되는 코드 mixins
    Object.getOwnPropertyNames(baseClass.prototype).forEach(name => {
      const descriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, name);

      if(descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    })
  })
}

class NewsFeedApi {
  getData(): NewsFeed[] {
    return this.getRequest<NewsFeed[]>(NEWS_URL);
  }
}

class NewsDetailApi {
  getData(id: string): NewsDetail {
    return this.getRequest<NewsDetail>(CONTENT_URL.replace("@id", id));
  }  
}

interface NewsFeedApi extends Api {};
interface NewsDetailApi extends Api {};

applyApiMixins(NewsFeedApi, [Api]);
applyApiMixins(NewsDetailApi, [Api]);

// 왜 믹스인을 써야 할까?
// 1. 기존에 extends상속 방법은 적시 되어야 하는 상속 방법
// 상속의 관계를 바꾸고 싶다면 구조를 바꿔야 함 -> 유연성이 필요함

// 2. 다중 상속을 지원하지 않아.

interface RouteInfo {
  path: string;
  page: View;
}
interface Store {
  currentPage: number;
  feeds: NewsFeed[];
}

interface News {
  readonly id: number;
  readonly time_ago: string;
  readonly title: string;
  readonly url: string;
  readonly user: string;
  readonly content: string;
}

interface NewsFeed extends News {
  readonly comments_count: number;
  readonly points: number;
  read?: boolean;
}

interface NewsDetail extends News {
  readonly comments: NewsComment[];
}

interface NewsComment extends News {
  readonly comments: NewsComment[];
  readonly level: number;
}

const store: Store = {
  currentPage: 1,
  feeds: [],
};

abstract class View {
  private template: string;
  private renderTemplate: string; 
  private container: HTMLElement;
  private htmlList: string[];

  constructor(containerId: string, template: string) {
    const containerElement = document.getElementById(containerId);

    if(!containerElement) {
      throw '최상위 컨테이너가 없어 ui를 진행하지 못합니다.'
    }

    this.container = containerElement;
    this.template = template;
    this.renderTemplate = template;
    this.htmlList = [];
  }

  protected updateView(): void {
    this.container.innerHTML = this.renderTemplate;
    this.renderTemplate = this.template;
  }

  protected addHtml(htmlString: string): void {
    this.htmlList.push(htmlString);
  }

  protected getHtml(): string {
    const snapshot = this.htmlList.join('');
    this.clearHtmlList();
    return snapshot;
  }

  protected setTemplateData(key: string, value: string): void {
    this.renderTemplate = this.renderTemplate.replace(`{{__${key}__}}`, value);
  }

  clearHtmlList(): void{
    this.htmlList = [];
  }

  abstract render(): void;
}

class NewsFeedView extends View{
  private api: NewsFeedApi;
  private feeds: NewsFeed[];

  constructor(containerId: string) {
    let template = `
      <div class="bg-gray-600 min-h-screen">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/{{__prev_page__}}" class="text-gray-500">
                Previous
              </a>
              <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
                Next
              </a>
            </div>
          </div> 
        </div>
      </div>
      <div class="p-4 text-2xl text-gray-700">
        {{__news_feed__}}        
      </div>
    </div>
    `;

    super(containerId, template);

    this.api = new NewsFeedApi();
    this.feeds = store.feeds;
  
    if (this.feeds.length === 0) {
      this.feeds = store.feeds = this.api.getData();
      this.makeFeeds();
    }
  }

  render(): void {
    store.currentPage = Number(location.hash.substr(7) || 1) ;
    for (let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
      if (!this.feeds[i]) continue;
      const {id, title, comments_count, user, points, time_ago, read} = this.feeds[i];
      
      this.addHtml(`
      <div class="p-6 ${
        read ? "bg-red-500" : "bg-white"
      } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
            <div class="flex">
              <div class="flex-auto">
                <a href="#/show/${id}">${title}</a>  
              </div>
              <div class="text-center text-sm">
                <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${
                  comments_count
                }</div>
              </div>
            </div>
            <div class="flex mt-3">
              <div class="grid grid-cols-3 text-sm text-gray-500">
                <div><i class="fas fa-user mr-1"></i>${user}</div>
                <div><i class="fas fa-heart mr-1"></i>${points}</div>
                <div><i class="far fa-clock mr-1"></i>${time_ago}</div>
              </div>  
            </div>
          </div>    
      `);
    }

    this.setTemplateData("news_feed", this.getHtml());
    this.setTemplateData("prev_page", String(store.currentPage > 1 ? store.currentPage - 1 : 1));
    this.setTemplateData("next_page", String(store.currentPage + 1));

    this.updateView();
  }

  private makeFeeds() {
    for (let i = 0; i < this.feeds.length; i++) {
      this.feeds[i].read = false;
    }
  }

  
}


class NewsDetailView extends View{
  constructor(containerId: string) {
    
  
    const template = `
    <div class="bg-gray-600 min-h-screen pb-8">
    <div class="bg-white text-xl">
      <div class="mx-auto px-4">
        <div class="flex justify-between items-center py-6">
          <div class="flex justify-start">
            <h1 class="font-extrabold">Hacker News</h1>
          </div>
          <div class="items-center justify-end">
            <a href="#/page/{{__currentPage__}}" class="text-gray-500">
              <i class="fa fa-times"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="h-full border rounded-xl bg-white m-6 p-4 ">
      <h2>{{__title__}}</h2>
      <div class="text-gray-400 h-20">
      {{__content__}}
      </div>
    
      {{__comments__}}
    
    </div>
    </div>
      `;

      super(containerId, template) ;
  
    
  }

  render() {
    const id = location.hash.substr(7);
    const api = new NewsDetailApi();
    const newDetail = api.getData(id);

    for (let i = 0; i < store.feeds.length; i++) {
      if (store.feeds[i].id === Number(id)) {
        store.feeds[i].read = true;
        break;
      }
    }
  
    this.setTemplateData("comments", this.makeComment(newDetail.comments));
    this.setTemplateData("currentPage", String(store.currentPage));
    this.setTemplateData("title", newDetail.title);
    this.setTemplateData("content", newDetail.content);
    this.updateView();
  }

  private makeComment(comments: NewsComment[]): string {
    for (let i = 0; i < comments.length; i++) {
      const comment: NewsComment = comments[i];
      this.addHtml(`
        <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
        <div class="text-gray-400">
          <i class="fa fa-sort-up mr-2"></i>
          <strong>${comment.user}</strong> ${comment.time_ago}
        </div>
        <p class="text-gray-700">${comment.content}</p>
      </div>     
      `);
  
      if (comment.comments) {
        this.addHtml(this.makeComment(comment.comments));
      }
    }
  
    return this.getHtml();
  }
}


class Router {
  routeTable: RouteInfo[];
  defaultRoute: RouteInfo | null;
  constructor() {
    

    window.addEventListener("hashchange", this.route.bind(this));
    this.routeTable = [];
    this.defaultRoute = null;
  }

  
  addRoutePath(path: string, page: View): void{
    this.routeTable.push({path, page});
  }

  setDefaultPage(page: View): void {
    this.defaultRoute = { path: '', page }
  }

  route() {
    const routePath = location.hash;
    if(routePath === '' && this.defaultRoute) {
      this.defaultRoute.page.render();
    }

    for(const routeInfo of this.routeTable) {
      if(routePath.indexOf(routeInfo.path) >=0 ){
        routeInfo.page.render();
        break;
      }
    }
  }
}

const router: Router = new Router();
const newsFeedView = new NewsFeedView('root');
const newsDetailView = new NewsDetailView('root');

router.addRoutePath('/page/', newsFeedView);
router.addRoutePath('/show/', newsDetailView);
router.setDefaultPage(newsFeedView);

router.route();