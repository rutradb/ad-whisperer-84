[Skip to main content](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#search-form)

# Manage OAuth Clients

Your OAuth client is the credential which your application uses when making calls to Google [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) endpoint to receive an access token or ID token. After creating your OAuth client, you will receive a client ID and sometimes, a client secret.

Think of your client ID like your app's unique username when it needs to request an access token or ID token from Google's OAuth 2.0 endpoint. This ID helps Google identify your app and ensure that only authorized applications can access user data.

## Client ID and Client Secret

Similar to how you would use a username and password to log to online services, many applications use a client ID paired with a client secret. The client secret adds an extra layer of security, acting like your app's password.

Applications are categorized as either public or private clients:

- **Private Clients:** These apps, like web server applications, can securely store the client secret because they run on servers you control.
- **Public Clients:** Native apps or JavaScript-based apps fall under this category. They cannot securely store secrets, as they reside on user devices and as such do not use client secrets.

To create an OAuth 2.0 client ID in the console:

1. Navigate to the [Google Auth Platform Clients](https://console.developers.google.com/auth/clients) page.


1. You will be prompted to create a project if you do not have one selected.
2. You will be prompted to register your [application](https://support.google.com/cloud/answer/15549049) to use Google Auth if you are yet to do so. This is required before creating a client.
2. Click CREATE CLIENT
3. Select the appropriate application type for your application and enter any additional information required. Application types are described in more detail in the following sections.
4. Fill out the required information for the select client type and click the CREATE button to create the client.

**Note**: Your application's client secret will only be shown after you create the client. Store this information in a secure place such as [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs/overview) because it will not be visible or accessible again. [Learn more](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#client-secret-hashing).

## Application types

Web Applications

A web application is accessed by web browsers over a network.

### Authorized JavaScript origins

Applications that use client-side JavaScript to access Google APIs must specify authorized JavaScript origins. The origins identify the domains from which your application can send API requests.

Specified origins must adhere to the following rules :

- JavaScript origins must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule.
- Hosts cannot be raw IP addresses. Localhost IP addresses are exempted from this rule.
- If you use a port other than 80, you must specify it. For example: https://example.com:8080
- Host TLDs (Top Level Domains) must belong to the [public suffix list](https://publicsuffix.org/list/).
- Host domains cannot be “googleusercontent.com”.
- JavaScript origins cannot contain URL shortener domains (e.g. goo.gl) unless the app owns the domain.
- JavaScript origins cannot contain the userinfo subcomponent.
- JavaScript origins cannot contain the path component.
- JavaScript origins cannot contain the query component.
- JavaScript origins cannot contain the fragment component.
- JavaScript origins cannot contain certain characters including:
  - Wildcard characters ('\*')
  - Non-printable ASCII characters
  - Invalid percent encodings (any percent encoding that does not follow URL-encoding form of a percent sign followed by two hexadecimal digits)
  - Null characters (an encoded NULL character, e.g., **%00, %C0%80**)

If you send a request to a Google OAuth 2.0 endpoint from an unregistered JavaScript origin, you will receive an `origin_mismatch` error.

Authorized redirect URIs

Applications that access Google APIs from a server (often using languages and frameworks like Node.js, Java, .NET, and Python) must specify authorized redirect URIs. The redirect URIs are the endpoints of your application server to which the OAuth 2.0 server can send responses. Users are redirected to this path after they have authenticated with Google.

Redirect URIs must adhere to the following rules :

- Redirect URIs must use the HTTPS scheme, not plain HTTP. Localhost URIs (including localhost IP address URIs) are exempt from this rule.
- Hosts cannot be raw IP addresses. Localhost IP addresses are exempted from this rule.
- Host TLDs (Top Level Domains) must belong to the [public suffix list](https://publicsuffix.org/list/).
- Redirect URIs cannot contain URL shortener domains (e.g. **goo.gl**) unless the app owns the domain. Furthermore, if an app that owns a shortener domain chooses to redirect to that domain, that redirect URI must either contain “ **/google-callback/**” in its path or end with “ **/google-callback**”.
- Redirect URIs cannot contain the userinfo subcomponent.
- Redirect URIs cannot contain a path traversal (also called directory backtracking), which is represented by an “/..” or “\\..” or their URL encoding.
- Redirect URIs cannot contain [open redirects](https://tools.ietf.org/html/rfc6749#section-10.15).
- Redirect URIs cannot contain the fragment component.
- Redirect URIs cannot contain certain characters including:
  - Wildcard characters ('\*')
  - Non-printable ASCII characters
  - Invalid percent encodings (any percent encoding that does not follow URL-encoding form of a percent sign followed by two hexadecimal digits)
  - Null characters (an encoded NULL character, e.g., **%00, %C0%80**)

If the redirect\_uri passed in the authorization request does not match an authorized redirect URI for the OAuth client ID, you will receive a `redirect_uri_mismatch` error.

**Note**: It may take 5 minutes to a few hours for changes made to these settings to take effect

Native Applications (Android, iOS, Desktop, UWP, Chrome Extensions, TV and Limited Input)

If your application is going to be installed on a device or computer (such as a system running Android, iOS, Universal Windows Platform, Chrome, or any desktop OS), you can use Google's OAuth 2.0 [Mobile and desktop apps](https://developers.google.com/identity/protocols/oauth2/native-app) flow. If your application runs on devices with limited input capabilities, such as smart TVs, you can use Google’s OAuth 2.0 [TV and limited-input device](https://developers.google.com/identity/protocols/oauth2/limited-input-device) flow.

Android

**Note**: Currently, obtaining OAuth 2.0 access tokens via [AccountManager](http://developer.android.com/reference/android/accounts/AccountManager.html) works for Android Ice Cream Sandwich (4.0) and newer versions.

You need to specify your Android app's package name and SHA1 fingerprint.

1. In the Package name field, enter your Android app's [package name](https://developer.android.com/guide/topics/manifest/manifest-element#package).

2. In a terminal, [run the keytool utility](https://developers.google.com/android/guides/client-auth) to get the SHA1 fingerprint for your digitally signed .apk file's public certificate.


```
keytool -list -v -keystore path-to-debug-or-production-keystore -alias androiddebugkey
```


**Note:** For the `debug.keystore`, the password is android. For Android Studio, the debug keystore is typically located at `~/.android/debug.keystore`.

The Keytool prints the fingerprint to the shell. For example:


```
$ keytool -list -v -keystore ~/.android/debug.keystore
Enter keystore password: Type "android" if using debug.keystore
Keystore type: JKS
Keystore provider: SUN

Your keystore contains 1 entry

Alias name: androiddebugkey
Creation date: Mar 13, 2020
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: C=US, O=Android, CN=Android Debug
Issuer: C=US, O=Android, CN=Android Debug
Serial number: 1
Valid from: Fri Mar 13 09:59:25 PDT 2020 until: Sun Mar 06 08:59:25 PST 2050
Certificate fingerprints:
   	 SHA1: D9:E9:59:FA:7A:46:72:4E:69:1F:96:18:8C:F9:AE:82:3A:5D:2F:03
   	 SHA256: 92:59:1E:F4:C9:BC:72:43:1C:59:57:24:AD:78:CA:A2:DB:C7:C5:AC:B1:A3:E8:52:04:B2:00:37:53:04:0B:8E
Signature algorithm name: SHA1withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 1
```

3. Copy the **SHA1** fingerprint from the results that appear in your terminal.

**Important:** When you prepare to release your app to your users, follow these steps again in a production project and create a new OAuth 2.0 client ID for your production app. For production apps, use your own private key to sign the production app's `.apk` file. For more information, see [Signing your applications](https://developer.android.com/studio/publish/app-signing).

4. Paste the SHA1 fingerprint into the form where requested.
5. (Optional) Verify ownership of your Android application.

You can verify ownership of your Android application to reduce the risk of app impersonation. Learn more about [verifying ownership of your Android application](https://developers.google.com/identity/protocols/oauth2/native-app#verify-app-ownership).

6. Click **Create**.

iOS

If your application accesses APIs directly from iOS, you will need the application's Bundle ID and, optionally, its Apple App Store ID and Team ID:

- The application's **[Bundle ID](https://developer.apple.com/documentation/appstoreconnectapi/bundle_ids)** is the bundle identifier as listed in the app's .plist file. For example: `com.example.myapp`.

- The application's **App Store ID** is in the app's App Store URL, if the app was published in the Apple App Store. For example, in the app URL `https://apps.apple.com/us/app/google/id284815942`, the App Store ID is `284815942`.

- The application's **Team ID** is a 10-character string that Apple assigns to your team. For information about your Team ID, see [Locating your Team ID](https://help.apple.com/developer-account/#/dev55c3c710c) in the Apple App Distribution Guide.


After creating your iOS credentials and obtaining a Client ID, you use the [Installed Application OAuth 2.0 flow](https://developers.google.com/identity/protocols/oauth2/native-app) to communicate with Google APIs.

#### **Enable App Check**

When you enable App Check, Apple's [App Attest service](https://developer.apple.com/documentation/devicecheck/establishing_your_app_s_integrity) is used to verify that OAuth 2.0 requests originating from your OAuth client are genuine and come from your app. This helps to reduce the risk of app impersonation. [Learn more about enabling App Check for your iOS app](https://developers.google.com/identity/protocols/oauth2/native-app#ios-app-check).

To enable App Check, turn on the **Protect your OAuth client from abuse with Firebase App Check** toggle button in the create/edit view of your iOS client.

The following requirements must be met to successfully enable App Check for your iOS client:

- You must specify a team ID for your iOS client.
- You must not use a wildcard in your bundle ID since it can resolve to more than one app. This means that the bundle ID must not include the asterisk (\*) symbol.

Universal Windows Platform (UWP)

If your application runs on Universal Windows Platform, you will need your app’s 12-character **Store ID**. You can find this value in the [Partner Center](https://partner.microsoft.com/dashboard), on the **App identity** page of the **App management** section. This value can also be found as the last part of your app's Microsoft Store URL. For example: `https://www.microsoft.com/store/apps/YOUR_STORE_ID`

Chrome Extension

Google Chrome apps and extensions are a special case of installed applications. Chrome exposes JavaScript APIs to allow your Chrome apps and extensions to perform various operations. Some of these APIs rely on knowing the identity of the user who is signed in to Chrome. If you're writing a Chrome app or extension that calls APIs that need to know the user's identity, and you want your app or extension to get user authorization for these requests using OAuth 2.0, then choose Chrome as the platform when you create your credentials. You will need to enter your Chrome app or extension's [Application ID](https://developers.google.com/chrome/web-store/docs/publish#appId). The Item ID is the last part of your Chrome Extension's Chrome Web Store URL. For more information about these APIs, see the [User Authentication documentation](https://developer.chrome.com/apps/app_identity).

#### **Verify app ownership**

You can verify ownership of your Chrome application to reduce the risk of app impersonation. Learn more about [verifying ownership of your Chrome application](https://developers.google.com/identity/protocols/oauth2/native-app#verify-app-ownership).

TVs and Limited-input devices

The console does not require any additional information to create OAuth 2.0 credentials for applications running on limited-input devices, such as TVs.

Desktop apps

The console does not require any additional information to create OAuth 2.0 credentials for desktop applications.

## Delete OAuth Clients

To delete a client ID, go to the [Clients page](https://console.developers.google.com/auth/clients), check the box next to the ID you want to delete, and then click the DELETE button.

Before deleting a Client ID, ensure to check the ID is not in use by monitoring your traffic in the [overview page](https://console.developers.google.com/auth/overview).

You can restore deleted clients within 30 days of the deletion. To restore a recently deleted client, navigate to the [Deleted credentials page](https://console.developers.google.com/apis/credentials/deleted) to find a list of clients you recently deleted and click the RESTORE button for the client you want to restore.

Any client deleted over 30 days ago cannot be restored and is permanently deleted.

**Note** : Clients can also be automatically deleted if they become inactive. [Learn more](https://support.google.com/cloud/answer/15549257#unused-client-deletion).

## Rotating your clients secrets

Client secrets or credentials should be treated with extreme care as described in the [OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies#secure-credentials), because they allow anyone who has them to use your app's identity to gain access to user information. With the client secret rotation feature, you can add a new secret to your OAuth client configuration, migrate to the new secret while the old secret is still usable, and disable the old secret afterwards. This is useful when the client secret has been inadvertently disclosed or leaked. This also ensures good security practices by occasionally rotating your secrets without causing downtime of your app. In addition, Google started to issue more secure client secrets recommended by [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749#section-10.10) in 2021. While apps that were created earlier are able to continue using the old secrets, we recommend that you migrate to the new secret with this rotation feature.

To rotate your client secret, please follow the following steps:

Step 1: Create a new client secret

1. Go to the [Google Auth Platform Clients page](https://console.developers.google.com/auth/clients).
2. If it's not already selected, select the project that you want to update.
3. From the list of OAuth 2.0 Client IDs, click the client you want to generate a new client secret for.
4. On the client details page, click **Add Secret** on the right side to add a new secret.
5. A new secret will appear below the old secret. You can also differentiate them by the secret creation time. The new secret will be in "Enabled" state and ready to be used.

**Note 1**: Both secrets can be used until you manually [disable](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#disable-old-secret) them. You must [update](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#use-new-secret) your app to use the new secret and disable the old one as soon as possible after creating it to minimize security risks.

**Note 2**: You can only have two client secrets at maximum. If the client already has two secrets, to create a new secret, you must first [disable](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#disable-old-secret) and [delete](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#delete-old-secret) an existing secret.

Step 2: Configure your app to use the new secret

Next, update your app to use the new secret. Remember to handle your client secrets securely as described in the [OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies#secure-credentials).

You need to monitor your app and make sure the new secret has **fully taken effect.** In other words, make sure the old secret is not used anywhere in your app. Check the metrics and configurations used by your app to confirm that only the new client secret is used, for example:

- References in code or configurations.
- Your app or server logs.
- The rollout status of your updated app version or configuration.
- Any other metrics you may have.

Step 3: Disable the old secret

Having more than one enabled secrets for a client increases security risks. Once you confirm that your app has fully migrated to the new secret per the instructions in [Step 2](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#use-new-secret), you must disable the old secret.

1. Go to the [Google Auth Platform Clients page](https://console.developers.google.com/auth/clients).
2. From the list of OAuth 2.0 Client IDs, click the client you want to update.
3. Find the old secret you want to disable. Generally it should be the one with the earlier creation time.
4. Click **Disable** on the right side. The old secret will be invalid shortly.

**Note**: A disabled client secret will be rejected in OAuth flows. You are expected to continuously monitor your app and see if it’s working properly. In case you notice the app is failing because it is still using the old secret, you may click **Enable** to reinstate the secret on your client details page in the [Google Auth Platform Clients page](https://console.developers.google.com/auth/clients). In this case, you should redo this step after completing the migration.

Step 4: Delete the old secret

Once you've confirmed that your app is working seamlessly with the new client secret, you are safe to delete the disabled old secret. To delete the secret, click the delete button next to it. **Note that this cannot be undone**.

## Unused Client Deletion

OAuth 2.0 clients that have been inactive for six months are automatically deleted. This mitigates risks associated with unused client credentials, such as potential app impersonation or unauthorized data access if credentials are compromised.

An OAuth 2.0 client is considered unused if neither of the following actions have occurred within the past six months:

- The client has not been used for any credential or token request via the Google OAuth2.0 endpoint.
- The client's settings have not been modified programmatically or manually within the [Google Cloud Console](https://console.developers.google.com/auth/clients). Examples of modifications include changing the client name, rotating the client secret, or updating redirect URIs.

You will receive an email notification 30 days before an inactive client is scheduled for deletion. To prevent the automatic deletion of a client you still require, ensure it is used for an authorization or authorization request before the 30 days elapses.

A notification will also be sent after the client has been successfully deleted.

**Note** : You should only take action to prevent deletion if you actively require the client. Keeping unused clients active unnecessarily increases security risk for your application. If you determine a client is no longer needed, delete it yourself via the [Google Auth Platform Clients](https://console.developers.google.com/auth/clients) page. Do not wait for the automatic deletion process.

Once an OAuth 2.0 client is deleted:

- It can no longer be used for Sign in with Google or for authorization for data access.
- Calls to Google APIs using existing access tokens or refresh tokens associated with the deleted client will fail.
- Attempts to use the deleted client ID in authorization requests will result in a `deleted_client` error.

Deleted clients are typically recoverable at least 30 days following deletion. To restore a deleted client, navigate to the [Deleted Credentials](https://console.cloud.google.com/apis/credentials/deleted) page. Only restore a client if you have a confirmed, ongoing need for it.

To ensure that you receive these notifications and others related to your app, [review your contact information settings](https://support.google.com/cloud/answer/15549049#developer-contact-information).

## Client Secret Handling and Visibility

**Note**: This feature is currently available for new clients created after June 2025 and will be extended to existing clients starting November 2025.

In April 2025, we [announced](https://developers.googleblog.com/en/usability-and-safety-updates-to-google-auth-platform/) that client secrets for OAuth 2.0 clients are only visible and downloadable from the Google Cloud Console at the time of their creation.

Client secrets add a critical layer of security to your OAuth 2.0 client ID, functioning similarly to a password for your application. Protecting these secrets is important for maintaining application security and privacy. To prevent accidental exposure and increase protection, client secrets are hashed. This means you will only be able to view and download the full client secret once, at the time of its creation.

It is important that you download your OAuth 2.0 client secrets immediately upon creation and store them in a secure manner, for example in a secret manager such as [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs/overview).

After the initial creation, the Google Cloud Console will only display the last four characters of the client secret. This truncated version is provided solely for identification purposes, allowing you to distinguish between your client secrets. If you lose your client secret, you can use the [client secret rotation](https://support.google.com/cloud/answer/15549257#rotating-secrets) feature to get a new one.

**Best Practices for Client Secret Management**

- Never add client secrets directly in your code or check them into version control systems such as Git or Subversion.
- Do not share client secrets in public forums, email, or other insecure communication channels.
- Store client secrets securely using a dedicated secret management service like [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs/overview) or a similar secure storage solution.
- [Rotate client secrets](https://support.google.com/cloud/answer/15549257#rotating-secrets) periodically and change immediately in the case of a leak.

## Manage client's brand configuration

## Authorized Domains

[Review how to manage authorized domains](https://support.google.com/cloud/answer/15549049#authorized-domains&zippy=%2Cauthorized-domains) in the Branding section of the Google Auth Platform.

## User Type

[Review how to manage target audience for your app](https://support.google.com/cloud/answer/15549945#user-type) in the Audience section of the Google Auth Platform.

Give feedback about this article

Choose a section to give feedback on

## Was this helpful?

How can we improve it?

YesNo

Submit

true

1409144506463496410

true

Search Help Center

false

true

true

true

[Google Help](https://support.google.com/)

[Help Center](https://support.google.com/cloud/?hl=en) [Google Cloud Platform Console](https://console.cloud.google.com/)

[Privacy Policy](https://www.google.com/intl/en/privacy.html) [Terms of Service](https://www.google.com/accounts/TOS)Submit feedback

true

true

95384

false

false

## What is the issue with this selection?

What is the issue with this selection?

Inaccurate - doesn't match what I see in the product

Hard to understand - unclear or translation is wrong

Missing info - relevant but not comprehensive

Irrelevant - doesn’t match the title and / or my expectations

Minor errors - formatting issues, typos, and / or broken links

Other suggestions - ideas to improve the content

## Share additional info or suggestions

​

​

Do not share any personal info

Cancel

Submit

By continuing, you agree Google uses your answers, [account & system info](https://support.google.com/cloud/answer/15549257?visit_id=639124070638666737-2965649748&rd=1#) to improve services, per our [Privacy](https://myaccount.google.com/privacypolicy?hl=en) & [Terms](https://policies.google.com/terms?hl=en).

false

false

Search

Clear search

Close search

Main menu

Google apps