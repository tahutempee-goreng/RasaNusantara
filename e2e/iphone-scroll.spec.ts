import {test,devices} from '@playwright/test';
import {registerMobileScrollTests} from './mobile-scroll-cases';
const {defaultBrowserType,...device}=devices['iPhone 13'];
test.use({...device,browserName:'webkit',channel:''});
registerMobileScrollTests();
