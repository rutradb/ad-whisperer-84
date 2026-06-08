[Skip to main content](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#main-content)

[![Google Ads API](https://developers.google.com/static/ads/images/ads_192px_clr.svg)](https://developers.google.com/google-ads/api)

- [GoogleAds API](https://developers.google.com/google-ads/api)

`/`

Language

- [English](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication)
- [Deutsch](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=de)
- [Español](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=es)
- [Español – América Latina](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=es-419)
- [Français](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=fr)
- [Indonesia](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=id)
- [Italiano](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=it)
- [Polski](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=pl)
- [Português – Brasil](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=pt-br)
- [Tiếng Việt](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=vi)
- [Türkçe](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=tr)
- [Русский](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=ru)
- [עברית](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=he)
- [العربيّة](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=ar)
- [فارسی](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=fa)
- [हिंदी](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=hi)
- [বাংলা](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=bn)
- [ภาษาไทย](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=th)
- [中文 – 简体](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=zh-cn)
- [中文 – 繁體](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=zh-tw)
- [日本語](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=ja)
- [한국어](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication?hl=ko)

[Sign in](https://developers.google.com/_d/signin?continue=https%3A%2F%2Fdevelopers.google.com%2Fgoogle-ads%2Fapi%2Fdocs%2Foauth%2Fmulti-user-authentication&prompt=select_account)

- On this page
- [Client library configuration](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#client_library_configuration)

- [Home](https://developers.google.com/)
- [Products](https://developers.google.com/products)
- [Google Ads API](https://developers.google.com/google-ads/api)

Was this helpful?



 Send feedback



# Multi User Authentication Workflow    Stay organized with collections      Save and categorize content based on your preferences.

- On this page
- [Client library configuration](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#client_library_configuration)

![Spark icon](https://developers.google.com/_static/images/icons/spark.svg)

## Page Summary

outlined\_flag

- To access the Google Ads API, configure your application to authenticate for the `https://www.googleapis.com/auth/adwords` scope.

- It is recommended to request OAuth offline access to make API calls on behalf of the user while they are offline.

- You should go through the OAuth App verification process and get your app certified.

- Once you obtain OAuth 2.0 credentials after authorizing a user, you can configure your client library using those credentials to make API calls to their accounts.


In the multi-user authentication workflow, you build your own OAuth flow to
authenticate your users. There are multiple app types discussed as part of the
[Google Identity documentation](https://developers.google.com/identity/protocols/oauth2), and the Google
Cloud Console project configuration you need to support that app type. All these
app types are supported by Google Ads API. The additional technical details to keep in
mind are:

1. To access Google Ads API, you should configure your application to authenticate for
the following scope:




```
https://www.googleapis.com/auth/adwords
```

2. Your app may have to make API calls on behalf of the user while they are
offline. A common scenario is to download account metrics offline to generate
reports and perform account analytics. For this reason, we recommend
requesting [OAuth offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline).

3. You should go through the [OAuth App verification process](https://support.google.com/cloud/answer/13461325)
and get your app certified.


### Client library configuration

Once you authorize the user and obtain OAuth 2.0 credentials, you can configure
the client library by following the instructions on the tab corresponding to
your programming language.

[Java](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#java)[.NET](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#.net)[Python](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#python)[PHP](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#php)[Ruby](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#ruby)[Perl](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#perl)[curl](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication#curl)More

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

````
UserCredentials credentials =
    UserCredentials.newBuilder()
        .setClientId(OAUTH_CLIENT_ID)
        .setClientSecret(OAUTH_CLIENT_SECRET)
        .setRefreshToken(REFRESH_TOKEN)
        .build();

// Creates a GoogleAdsClient with the provided credentials.
GoogleAdsClient client =
    GoogleAdsClient.newBuilder()
        // Sets the developer token which enables API access.
        .setDeveloperToken(DEVELOPER_TOKEN)
        // Sets the OAuth credentials which provide Google Ads account access.
        .setCredentials(credentials)
        // Optional: sets the login customer ID.
        .setLoginCustomerId(Long.valueOf(LOGIN_CUSTOMER_ID))
        .build();
``` See the [configuration guide][java-config-guide] for additional options.
````

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

```
GoogleAdsConfig googleAdsConfig = new GoogleAdsConfig()
{
    DeveloperToken = DEVELOPER_TOKEN,
    LoginCustomerId = LOGIN_CUSTOMER_ID,
    OAuth2ClientId = OAUTH_CLIENT_ID,
    OAuth2ClientSecret = OAUTH_CLIENT_SECRET,
    OAuth2RefreshToken = REFRESH_TOKEN,
};

GoogleAdsClient googleAdsClient = new GoogleAdsClient(googleAdsConfig);
```

See the [configuration guide](https://developers.google.com/google-ads/api/docs/client-libs/dotnet/configuration) for additional options.

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

```
from google.ads.googleads.client import GoogleAdsClient

credentials = {
    "developer_token": "INSERT_DEVELOPER_TOKEN_HERE",
    "login_customer_id": "INSERT_LOGIN_CUSTOMER_ID_HERE",
    "refresh_token": "REFRESH_TOKEN",
    "client_id": "OAUTH_CLIENT_ID",
    "client_secret": "OAUTH_CLIENT_SECRET"}

client = GoogleAdsClient.load_from_dict(credentials)
```

See the [configuration guide](https://developers.google.com/google-ads/api/docs/client-libs/python/configuration) for additional options.

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

```
$oAuth2Credential = (new OAuth2TokenBuilder())
->withClientId('INSERT_CLIENT_ID_HERE')
->withClientSecret('INSERT_CLIENT_SECRET_HERE')
->withRefreshToken('INSERT_REFRESH_TOKEN_HERE')
->build();

$googleAdsClient = (new GoogleAdsClientBuilder())
    ->withOAuth2Credential($oAuth2Credential)
    ->withDeveloperToken('INSERT_DEVELOPER_TOKEN_HERE')
    ->withLoginCustomerId('INSERT_LOGIN_CUSTOMER_ID_HERE')
    ->build();
```

See the [configuration guide](https://developers.google.com/google-ads/api/docs/client-libs/php/configuration) for additional options.

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

```
client = Google::Ads::GoogleAds::GoogleAdsClient.new do |config|
    config.client_id = 'INSERT_CLIENT_ID_HERE'
    config.client_secret = 'INSERT_CLIENT_SECRET_HERE'
    config.refresh_token = 'INSERT_REFRESH_TOKEN_HERE'
    config.login_customer_id = 'INSERT_LOGIN_CUSTOMER_ID_HERE'
    config.developer_token = 'INSERT_DEVELOPER_TOKEN_HERE'
end
```

See the [configuration guide](https://developers.google.com/google-ads/api/docs/client-libs/ruby/configuration) for additional options.

You can initialize your `GoogleAdsClient` instance at runtime, using the
credentials you have obtained from the user whose accounts you are making
API calls to.

```
my $api_client = Google::Ads::GoogleAds::Client->new({
developer_token   => "INSERT_DEVELOPER_TOKEN_HERE",
login_customer_id => "INSERT_LOGIN_CUSTOMER_ID_HERE"
});

my $oauth2_applications_handler = $api_client->get_oauth2_applications_handler();
$oauth2_applications_handler->set_client_id("INSERT_CLIENT_ID");
$oauth2_applications_handler->set_client_secret("INSERT_CLIENT_SECRET");
$oauth2_applications_handler->set_refresh_token("INSERT_REFRESH_TOKEN");
```

See the [configuration guide](https://developers.google.com/google-ads/api/docs/client-libs/perl/configuration) for additional options.

Start by using an HTTP client to fetch an OAuth 2.0 access token. This guide
uses the `curl` command.

```
curl \
  --data "grant_type=refresh_token" \
  --data "client_id=CLIENT_ID" \
  --data "client_secret=CLIENT_SECRET" \
  --data "refresh_token=REFRESH_TOKEN" \
https://www.googleapis.com/oauth2/v3/token
```

You can now use the access token in your API calls. The following example
shows how to run a campaign report using the
[`GoogleAdsService.SearchStream`](https://developers.google.com/google-ads/api/reference/rpc/v23/GoogleAdsService/SearchStream) method to retrieve the
campaigns in your account. This guide doesn't cover the details of
[reporting](https://developers.google.com/google-ads/api/docs/reporting/overview).

```
curl -i -X POST https://googleads.googleapis.com/v23/customers/CUSTOMER_ID/googleAds:searchStream \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer ACCESS_TOKEN" \
   -H "developer-token: DEVELOPER_TOKEN" \
   -H "login-customer-id: LOGIN_CUSTOMER_ID" \
   --data-binary "@query.json"
```

The contents of `query.json` are as follows:

```
{
"query": "SELECT campaign.id, campaign.name, campaign.network_settings.target_content_network FROM campaign ORDER BY campaign.id"
}
```

[Previous\\
\\
arrow\_back\\
\\
Single-user authentication workflow](https://developers.google.com/google-ads/api/docs/oauth/single-user-authentication)

[Next\\
\\
Handling two-step verification\\
\\
arrow\_forward](https://developers.google.com/google-ads/api/docs/oauth/2sv)

Was this helpful?



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-03-25 UTC.


Need to tell us more?






\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-03-25 UTC."\],\[\],\[\]\]