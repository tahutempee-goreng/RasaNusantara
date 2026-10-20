import {test,devices} from '@playwright/test';
import {registerMobileScrollTests} from './mobile-scroll-cases';
const {defaultBrowserType,...device}=devices['Pixel 7'];
test.use({...device,browserName:'chromium',channel:'chrome'});
registerMobileScrollTests();
