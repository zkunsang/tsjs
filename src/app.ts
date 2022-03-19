import Router from './core/router';
import { NewsFeedView, NewsDetailView } from './page';
import Store from './store';

const store = new Store();

const rootEl: HTMLElement | null = document.getElementById("root");
// 왜 믹스인을 써야 할까?
// 1. 기존에 extends상속 방법은 적시 되어야 하는 상속 방법
// 상속의 관계를 바꾸고 싶다면 구조를 바꿔야 함 -> 유연성이 필요함

// 2. 다중 상속을 지원하지 않아.

const router: Router = new Router();
const newsFeedView = new NewsFeedView('root', store);
const newsDetailView = new NewsDetailView('root', store);

router.addRoutePath('/page/', newsFeedView);
router.addRoutePath('/show/', newsDetailView);
router.setDefaultPage(newsFeedView);

router.route();