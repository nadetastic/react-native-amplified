/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import {
  Amplify,
  Analytics,
  AWSKinesisProvider,
  AWSKinesisFirehoseProvider,
  AmazonPersonalizeProvider,
} from 'aws-amplify';
// import {MyAnalyticsProvider} from './src/types/MyAnalyticsProvider';
import awsconfig from './src/aws-exports';

// Amplify.Logger.LOG_LEVEL = 'DEBUG';

const isLocalhost = false;

// Assuming you have two redirect URIs, and the first is for localhost and second is for production
const [localRedirectSignIn, productionRedirectSignIn] =
  awsconfig.oauth.redirectSignIn.split(',');

const [localRedirectSignOut, productionRedirectSignOut] =
  awsconfig.oauth.redirectSignOut.split(',');

const updatedAwsConfig = {
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    redirectSignIn: isLocalhost
      ? localRedirectSignIn
      : productionRedirectSignIn,
    redirectSignOut: isLocalhost
      ? localRedirectSignOut
      : productionRedirectSignOut,
  },
};

Amplify.configure(updatedAwsConfig);

// Analytics.record('App launched');
// Analytics.autoTrack('session', {
//   enable: true,
//   attributes: {
//     location: 'autoTrack',
//     time: new Date().getTime(),
//   },
//   provider: 'AWSPinpoint',
// });

Analytics.addPluggable(new AWSKinesisProvider());
Analytics.addPluggable(new AWSKinesisFirehoseProvider());
Analytics.addPluggable(new AmazonPersonalizeProvider());
// Analytics.addPluggable(new MyAnalyticsProvider());

Analytics.configure({
  AWSKinesis: {
    region: 'us-east-1',
    bufferSize: 1000,
    flushSize: 100,
    flushInterval: 5000,
    resendLimit: 5,
  },
  AWSKinesisFirehose: {
    region: 'us-east-1',
    bufferSize: 1000,
    flushSize: 100,
    flushInterval: 5000,
    resendLimit: 5,
  },
  AmazonPersonalize: {
    trackingId: '436aebd5-0a4a-4fcc-be29-c31cef508511',
    region: 'us-east-1',
    flushSize: 10,
    flushInterval: 5000,
  },
  // MyAnalyticsProvider: {
  //   // ...custom provider configuration
  // },
});

AppRegistry.registerComponent(appName, () => App);
