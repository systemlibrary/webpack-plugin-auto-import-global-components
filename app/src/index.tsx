import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';

global.React = React;
global.ReactDOM = ReactDOM;
global.ReactDOMServer = ReactDOMServer;

//auto-global-react-module-plugin start
import A from './Modules/A/A';
import Banner from './Modules/Banner/Banner';
import BreadCrumbs from './Modules/BreadCrumbs/BreadCrumbs';
import { HelloWorld, Cars } from './Modules/BreadCrumbs/BreadCrumbs';
import Logo from './Modules/Logo/Index';
global.Modules = {};
global.Modules.A = {};
global.Modules.A.A = A;
global.Modules.Banner = {};
global.Modules.Banner.Banner = Banner;
global.Modules.BreadCrumbs = {};
global.Modules.BreadCrumbs.HelloWorld = HelloWorld;
global.Modules.BreadCrumbs.Cars = Cars;
global.Modules.BreadCrumbs.BreadCrumbs = BreadCrumbs;
global.Modules.Logo = {};
global.Modules.Logo.Logo = Logo;
//auto-global-react-module-plugin end
