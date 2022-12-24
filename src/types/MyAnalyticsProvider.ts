import { AnalyticsProvider } from 'aws-amplify';

class MyAnalyticsProvider implements AnalyticsProvider {
  // category and provider name
  static category = 'Analytics';
  static providerName = 'MyAnalytics';

  // you need to implement these four methods
  // configure your provider
  configure(config: object): object {
    return {};
  };

  // record events and returns true if succeeds
  record(params: object): Promise<boolean> {
    return Promise.resolve(true);
  };

  // return 'Analytics';
  getCategory(): string {
    return MyAnalyticsProvider.category;
  };

  // return the name of you provider
  getProviderName(): string {
    return MyAnalyticsProvider.providerName;
  };
}