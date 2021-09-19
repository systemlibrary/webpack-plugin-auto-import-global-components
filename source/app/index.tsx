import A from './Modules/A/A';
import Banner from './Modules/Banner/Banner';
import BreadCrumbs from './Modules/BreadCrumbs/BreadCrumbs';
import { HelloWorld, Cars } from './Modules/BreadCrumbs/BreadCrumbs';
import Logo from './Modules/Logo/Index';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

global.React = React;
global.ReactDOM = ReactDOM;
global.ReactDOMServer = ReactDOMServer;

import App from './App';

//Uncomment to load some react component inside "Html" - at OnLoad event...
//ReactDOM.render(<App name="Hello world" />, document.getElementById('app'));
