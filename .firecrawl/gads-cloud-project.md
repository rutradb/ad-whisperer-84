[Skip to main content](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#main-content)

[![Google Ads API](https://developers.google.com/static/ads/images/ads_192px_clr.svg)](https://developers.google.com/google-ads/api)

- [GoogleAds API](https://developers.google.com/google-ads/api)

`/`

Language

- [English](https://developers.google.com/google-ads/api/docs/oauth/cloud-project)
- [Deutsch](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=de)
- [Español](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=es)
- [Español – América Latina](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=es-419)
- [Français](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=fr)
- [Indonesia](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=id)
- [Italiano](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=it)
- [Polski](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=pl)
- [Português – Brasil](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=pt-br)
- [Tiếng Việt](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=vi)
- [Türkçe](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=tr)
- [Русский](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=ru)
- [עברית](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=he)
- [العربيّة](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=ar)
- [فارسی](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=fa)
- [हिंदी](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=hi)
- [বাংলা](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=bn)
- [ภาษาไทย](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=th)
- [中文 – 简体](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=zh-cn)
- [中文 – 繁體](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=zh-tw)
- [日本語](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=ja)
- [한국어](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?hl=ko)

[Sign in](https://developers.google.com/_d/signin?continue=https%3A%2F%2Fdevelopers.google.com%2Fgoogle-ads%2Fapi%2Fdocs%2Foauth%2Fcloud-project%3Fauthpath%3Dservice_accounts&prompt=select_account)

- On this page
- [Select or create a Google API Console project](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#select-or-create-project)
- [Enable the Google Ads API in your project](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#enable-api)
- [Create a service account and key](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#sa-key)

Join us live on [Discord](https://discord.com/events/971845904002871346/1492135554966360125) on the Google Advertising and Measurement Community server and on [YouTube](https://www.youtube.com/watch?v=sw_YjsWhYlY) on April 23rd at 10:00 AM EST! We will discuss the new features added in v24 of the Google Ads API.


- [Home](https://developers.google.com/)
- [Products](https://developers.google.com/products)
- [Google Ads API](https://developers.google.com/google-ads/api)

Was this helpful?



 Send feedback



# Set up a Google API Console project    Stay organized with collections      Save and categorize content based on your preferences.

- On this page
- [Select or create a Google API Console project](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#select-or-create-project)
- [Enable the Google Ads API in your project](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#enable-api)
- [Create a service account and key](https://developers.google.com/google-ads/api/docs/oauth/cloud-project?authpath=service_accounts#sa-key)

![Spark icon](https://developers.google.com/_static/images/icons/spark.svg)

## Page Summary

outlined\_flag

- Creating and configuring a Google API Console project for Google Ads API access depends on your chosen OAuth 2.0 authorization scenario (service accounts or user authentication).

- A Google API Console project is necessary to create OAuth 2.0 credentials and enable the Google Ads API, which are needed to generate tokens for API calls.

- While a single developer token can be used across multiple projects, each project can only use one developer token.

- To set up for Google Ads API use, you need to select or create a Google API Console project and enable the Google Ads API within it.

- For service account authorization, you must create a service account and download its key in JSON format.


Getting Started – Service Accounts - YouTube

Tap to unmute

[Getting Started – Service Accounts](https://www.youtube.com/watch?v=8MYzuG7JzLs) [Google Advertising and Measurement Developers](https://www.youtube.com/channel/UCgCvgLpbHZFjH-7MAJNgWBQ)

Google Advertising and Measurement Developers11.2K subscribers

[Watch on](https://www.youtube.com/watch?v=8MYzuG7JzLs)

The steps to be followed for creating and configuring a Google API Console
project depends on the type of OAuth 2.0 authorization scenario you are building
in your application. Choose the authorization scenario you are building for;
this guide will be customized based on your choice.

Service accountsUser authentication

You need a Google API Console project for creating OAuth 2.0 credentials, and
enabling the Google Ads API for your app.

The credentials are needed for the authentication and authorization of Google Ads
users by Google servers. These credentials let you generate OAuth tokens to be
used in calls to the API.

Although you can use a single developer token for multiple projects, each
project can use only a single developer token.

## Select or create a Google API Console project

Follow the [instructions](https://developers.google.com/workspace/guides/create-project#project)
to create a project. [Enabling billing for your project](https://developers.google.com/workspace/guides/create-project#billing)
is optional. If you have billing enabled, select a billing account for the new
project. There is no charge for using the Google Ads API, but there is a quota on the
total number of Cloud projects.

## Enable the Google Ads API in your project

To enable the Google Ads API in your project, follow these steps:

1. [Open the API Library](https://console.cloud.google.com/apis/library) in the Google API Console. If prompted, select your
project or create a new one. The API Library lists all available
APIs, grouped by product family and popularity.

2. Use search to find the Google Ads API if it isn't visible in the list.

3. Select the Google Ads API, then click the **Enable** button.


[Enable Google Ads API](https://console.cloud.google.com/flows/enableapi?apiid=googleads.googleapis.com)

## Create a service account and key

Start by [creating a service account and credentials](https://developers.google.com/google-ads/api/docs/get-started/choose-application-type).
Next, [create credentials for the service account](https://developers.google.com/workspace/guides/create-credentials#service-account).
Download the service account key in JSON format and note the service account ID
and email.

[Previous\\
\\
arrow\_back\\
\\
OAuth 2.0 internals](https://developers.google.com/google-ads/api/docs/oauth/internals)

[Next\\
\\
Credential management\\
\\
arrow\_forward](https://developers.google.com/google-ads/api/docs/oauth/credential-management)

Was this helpful?



 Send feedback



Except as otherwise noted, the content of this page is licensed under the [Creative Commons Attribution 4.0 License](https://creativecommons.org/licenses/by/4.0/), and code samples are licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0). For details, see the [Google Developers Site Policies](https://developers.google.com/site-policies). Java is a registered trademark of Oracle and/or its affiliates.

Last updated 2026-03-25 UTC.


Need to tell us more?






\[\[\["Easy to understand","easyToUnderstand","thumb-up"\],\["Solved my problem","solvedMyProblem","thumb-up"\],\["Other","otherUp","thumb-up"\]\],\[\["Missing the information I need","missingTheInformationINeed","thumb-down"\],\["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"\],\["Out of date","outOfDate","thumb-down"\],\["Samples / code issue","samplesCodeIssue","thumb-down"\],\["Other","otherDown","thumb-down"\]\],\["Last updated 2026-03-25 UTC."\],\[\],\[\]\]