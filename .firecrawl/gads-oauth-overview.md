[Skip to main content](https://developers.google.com/google-ads/api/docs/oauth/overview#main-content)

[![Google Ads API](https://developers.google.com/static/ads/images/ads_192px_clr.svg)](https://developers.google.com/google-ads/api)

- [GoogleAds API](https://developers.google.com/google-ads/api)

`/`

Language

- [English](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [Deutsch](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=de)
- [Español](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=es)
- [Español – América Latina](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=es-419)
- [Français](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=fr)
- [Indonesia](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=id)
- [Italiano](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=it)
- [Polski](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=pl)
- [Português – Brasil](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=pt-br)
- [Tiếng Việt](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=vi)
- [Türkçe](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=tr)
- [Русский](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=ru)
- [עברית](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=he)
- [العربيّة](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=ar)
- [فارسی](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=fa)
- [हिंदी](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=hi)
- [বাংলা](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=bn)
- [ภาษาไทย](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=th)
- [中文 – 简体](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=zh-cn)
- [中文 – 繁體](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=zh-tw)
- [日本語](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=ja)
- [한국어](https://developers.google.com/google-ads/api/docs/oauth/overview?hl=ko)

[Sign in](https://developers.google.com/_d/signin?continue=https%3A%2F%2Fdevelopers.google.com%2Fgoogle-ads%2Fapi%2Fdocs%2Foauth%2Foverview&prompt=select_account)

- [Home](https://developers.google.com/)
- [Products](https://developers.google.com/products)
- [Google Ads API](https://developers.google.com/google-ads/api)

Was this helpful?



 Send feedback



# Use OAuth 2.0 to Access Google Ads API    Stay organized with collections      Save and categorize content based on your preferences.

![Spark icon](https://developers.google.com/_static/images/icons/spark.svg)

## Page Summary

outlined\_flag

- Google Ads API utilizes the OAuth 2.0 protocol for authentication and authorization, allowing your app to access user accounts without handling login information.

- In addition to OAuth 2.0 credentials, a developer token is also required to make Google Ads API calls.

- While all Google-supported OAuth 2.0 scenarios work, this guide focuses on the most common ones for Google Ads API developers.

- The recommended OAuth 2.0 approach depends on your specific application scenario, such as integrating with existing Google APIs, managing your own accounts, or managing accounts on behalf of other users.


Just like other Google APIs, Google Ads API also uses the [OAuth 2.0\\
protocol](http://oauth.net/2/) for authentication and authorization. OAuth 2.0
enables your Google Ads API client app to access a user's Google Ads account without having
to handle or store the user's login info.

Broadly speaking, all the [OAuth 2.0 authorization\\
scenarios](https://developers.google.com/identity/protocols/oauth2) that Google supports also works with
Google Ads API. However, we will focus on a handful of scenarios that are most common
for Google Ads API developers.

| Scenario | Recommended approach |
| --- | --- |
| My app already uses one or more Google APIs. I have already built<br> support for OAuth 2.0 workflows for my app, and just need to add Google Ads API<br> functionality to my existing app. | 1. Make sure your authorized user or your service account has access<br>    to the Google Ads API accounts you are making API calls to. Learn more about<br>    the [Google Ads access model](https://developers.google.com/google-ads/api/docs/oauth/access-model).<br>2. Refer to the [multi-user authentication workflow](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication) or the [service account workflow](https://developers.google.com/google-ads/api/docs/oauth/service-accounts) depending on the approach you are using<br>    with the rest of the Google APIs that your app is using. |
| I am building an app that manages Google Ads accounts that I already have<br> access to. If I need to manage new Google Ads accounts in the future, I will<br> gain access to those accounts by linking them under my Google Ads Manager<br> account.<br>OR<br>Someone will [invite](https://support.google.com/google-ads/answer/6372672)<br> me to manage those accounts. | Use [service account workflow](https://developers.google.com/google-ads/api/docs/oauth/service-accounts).<br>If you have organizational policies that prevent you from using<br>service accounts, then use [single-user authentication workflow](https://developers.google.com/google-ads/api/docs/oauth/single-user-authentication) as a fallback. |
| I am building an app that manages Google Ads accounts on behalf of other<br> users. My app will build a user screen that lets the logged in users to<br> connect to their Google Ads accounts and authorize my app to manage those<br> accounts on their behalf. | Use [multi-user authentication](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication). |

To review and revoke access for third-party applications connected to your
Google Account, visit your
[Google Account permissions page](https://myaccount.google.com/permissions).

[Next\\
\\
Access model overview\\
\\
arrow\_forward](https://developers.google.com/google-ads/api/docs/oauth/access-model)

Was this helpful?



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-03-25 UTC.


Need to tell us more?






\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-03-25 UTC."\],\[\],\[\]\]